/**
 * Load simulation model.
 *
 * The trace simulator answers "in what order does this run?". This module
 * answers "what happens when you push traffic through it?" — where the queue
 * builds, what drops, and how slow the slowest path gets.
 *
 * It is a steady-state analytical model, not a discrete-event simulator: one
 * pass over the graph in dependency order, with an M/M/1 queueing approximation
 * for wait time. That is enough to expose bottlenecks and capacity mistakes.
 *
 * The work is split in two so it can run off the main thread cheaply:
 * `compileGraph` turns a diagram into index-addressed arrays once per edit, and
 * `runCompiled` pushes a load through that compiled form — which is all a
 * slider drag or a 24-point ramp needs to repeat.
 *
 * Pure — no React, no DOM.
 */

import { computeExecutionPlan } from "./flow-execution"
import {
  edgeKey,
  isBufferNode,
  isTrafficEntry,
  readSchedule,
  resolveFlow,
  scheduleRate,
  type EdgeFlowConfig,
  type FlowMode,
  type NodeSchedule,
} from "./flow-ops"

/** Per-node capacity model, stored on `node.data.sim`. */
export type NodeSimConfig = {
  /** Requests per second a single replica can serve. Undefined = unbounded. */
  capacity?: number
  /** Number of identical instances behind this node. */
  replicas?: number
  /** Service time in ms at low utilisation. */
  latencyMs?: number
  /** Baseline failure probability, 0–1 (independent of overload). */
  errorRate?: number
  /** Failure injection: the node serves nothing while this is set. */
  down?: boolean
  /** Cost of one replica per hour, in whatever currency you are budgeting in. */
  costPerHour?: number
  /**
   * Cache hit ratio, 0–1. Only misses continue downstream, so a cache with
   * hitRate 0.9 shields its backing store from 90% of the traffic without
   * anyone having to set a share on the outgoing edges.
   */
  hitRate?: number
  /**
   * Buffering component. Queues do not shed traffic past capacity — they build
   * a backlog — so excess is reported as lag instead of drops.
   */
  queue?: boolean
  /**
   * Work the node starts on its own — a cron job or a worker loop — on top of
   * whatever arrives over its incoming edges.
   */
  schedule?: NodeSchedule
}

/** Per-edge routing model, stored on `edge.data.sim`. */
export type EdgeSimConfig = {
  /**
   * Fraction of the source's traffic that travels this edge, 0–1.
   * 1 (the default) means every request calls the target; use 0.5 for a
   * load-balanced split or 0.1 for a 10% cache miss path.
   */
  share?: number
  /** Calls made per incoming request. 1 by default; 3 fans out three calls. */
  fanout?: number
  /**
   * Fire-and-forget hand-off. Superseded by `edge.data.flow.op` — an EVENT or
   * PUBLISH says the same thing — but still honoured on older diagrams.
   */
  async?: boolean
}

export type LoadParams = {
  /** Total offered load in requests per second, split across entry points. */
  requestsPerSecond: number
  /** End-to-end budget; paths slower than this are reported as breaching. */
  timeoutMs: number
  /** Average response payload, used for bandwidth estimates. */
  payloadKb: number
  /**
   * Utilisation to size for, 0–1. Capacity advice aims to keep every node at
   * or below this; 0.7 leaves headroom for bursts and failover.
   */
  targetUtilization: number
  /**
   * Peak-to-average multiplier. Real traffic is not flat, and capacity has to
   * survive the peak, so the offered load is sized as rps × burstFactor.
   */
  burstFactor: number
}

export const DEFAULT_LOAD_PARAMS: LoadParams = {
  requestsPerSecond: 1000,
  timeoutMs: 500,
  payloadKb: 8,
  targetUtilization: 0.7,
  burstFactor: 1,
}

export const DEFAULT_NODE_SIM = {
  capacity: 500,
  replicas: 1,
  latencyMs: 20,
  errorRate: 0,
  down: false,
  costPerHour: 0,
  hitRate: 0,
  queue: false,
}

/** Hours in an average month, for cost projections. */
export const HOURS_PER_MONTH = 730

export type NodeStatus =
  | "idle"
  | "ok"
  | "warn"
  | "saturated"
  | "overloaded"
  | "backlog"
  | "down"

export type NodeMetrics = {
  id: string
  label: string
  /** Requests per second arriving. */
  offered: number
  /** Requests per second actually served. */
  accepted: number
  /** Requests per second shed because capacity ran out. */
  dropped: number
  /** offered / total capacity. > 1 means the node cannot keep up. */
  utilization: number
  /** Configured service time. */
  serviceMs: number
  /** Queue wait added by utilisation. */
  queueMs: number
  /** serviceMs + queueMs. */
  latencyMs: number
  /** 95th percentile response time for this hop. */
  p95Ms: number
  /** Slowest cumulative latency from an entry point to this node. */
  cumulativeMs: number
  /** 95th percentile of that cumulative path. */
  cumulativeP95Ms: number
  /**
   * Traffic this node would receive if nothing upstream were shedding load.
   * Capacity advice is sized against demand, not against the throttled figure.
   */
  demand: number
  /** Replicas currently configured. */
  replicas: number
  /** Replicas needed to sit at or below the target utilisation. */
  requiredReplicas: number
  /** True when failure injection has taken this node out. */
  down: boolean
  /** Requests per second piling up in a buffering component. */
  backlogRate: number
  /** True when this node buffers instead of shedding. */
  buffers: boolean
  /** Share of traffic answered here and not forwarded (cache hits). */
  hitRate: number
  /** Jobs per second this node starts itself (cron, worker loop). */
  scheduledRate: number
  /**
   * Messages per second this consumer could not pull. They are not dropped —
   * they stay in the queue it reads from, which reports them as backlog.
   */
  lagRate: number
  /** Cost of the currently configured replicas, per month. */
  monthlyCost: number
  /** Cost at the replica count the target utilisation implies. */
  projectedMonthlyCost: number
  /** Share of traffic lost here, 0–1 (drops plus baseline errors). */
  lossRate: number
  /** Estimated egress bandwidth in megabits per second. */
  mbps: number
  status: NodeStatus
  unbounded: boolean
}

export type EdgeMetrics = {
  id: string
  source: string
  target: string
  mode: FlowMode
  /** Calls per second travelling this edge. */
  rate: number
  /**
   * How long the initiator waits: the target and everything it calls
   * synchronously for a request, just the acknowledgement for a hand-off.
   */
  responseMs: number
  responseP95Ms: number
  /** Caller-side timeout, when one is set on the edge. */
  timeoutMs: number | null
  /** True when the p95 response is slower than that timeout. */
  timedOut: boolean
  /** Messages per second a consumer on this edge leaves behind. */
  lagRate: number
}

export type SimulationReport = {
  params: LoadParams
  metrics: Record<string, NodeMetrics>
  edges: Record<string, EdgeMetrics>
  summary: {
    /** Load applied at the entry points. */
    offered: number
    /** Load the design generates itself: cron jobs, worker loops and polls. */
    scheduledLoad: number
    /**
     * Throughput leaving the exit nodes. A request that fans out to several
     * stores is counted once per exit, so this can exceed the offered load —
     * it is a throughput figure, not a success count.
     */
    delivered: number
    /** Every call the graph makes, internal hops included. */
    totalRequests: number
    /** Requests per second lost anywhere in the graph. */
    dropped: number
    /** Share of all calls that were served rather than shed, 0–1. */
    successRate: number
    /** Slowest path from an entry point to an exit. */
    criticalPathMs: number
    /** Node ids along that path. */
    criticalPath: string[]
    /** 95th percentile of the slowest path. */
    criticalPathP95Ms: number
    /**
     * Slowest chain that starts behind an async hand-off — a background
     * pipeline. Nobody is waiting on it, so it is reported separately and is
     * never checked against the request timeout.
     */
    pipelineP95Ms: number
    pipelinePath: string[]
    /** Whether the slowest path's p95 breaches the timeout budget. */
    breachesTimeout: boolean
    /** Edges whose p95 response is slower than their own timeout. */
    slowCalls: string[]
    /** Nodes needing more replicas to hit the target utilisation. */
    scaleAdvice: { id: string; label: string; current: number; required: number }[]
    /** Nodes currently taken out by failure injection. */
    downNodes: string[]
    /** Requests per second accumulating in buffering components. */
    backlogRate: number
    /** Nodes whose backlog is growing. */
    backlogNodes: string[]
    /** Monthly cost of the design as configured. */
    monthlyCost: number
    /** Monthly cost if every capacity suggestion were applied. */
    projectedMonthlyCost: number
    /** Cost per million delivered requests, or null when nothing is priced. */
    costPerMillionRequests: number | null
    /** Nodes at or over capacity, worst first. */
    bottlenecks: string[]
    /** Nodes with no capacity configured — their numbers are optimistic. */
    unbounded: string[]
    /** Nodes in a cycle; the model treats their inbound traffic as unknown. */
    cyclic: string[]
    totalMbps: number
  }
}

export type NodeLike = {
  id: string
  type?: string
  data?: { label?: string; icon?: string; sim?: NodeSimConfig }
}

export type EdgeLike = {
  id?: string
  source: string
  target: string
  data?: { sim?: EdgeSimConfig; flow?: EdgeFlowConfig }
}

/** Utilisation above this is treated as a hard stall rather than a queue. */
const STALL_UTILIZATION = 0.99
/** Wait time is capped so a stalled node does not produce Infinity. */
const MAX_QUEUE_MULTIPLIER = 50
/**
 * Response time in an M/M/1 queue is exponentially distributed, so the 95th
 * percentile of a single hop is ln(20) ≈ 3× its mean.
 */
const P95_FACTOR = Math.log(20)
/** Normal quantile for 95%, used to combine hops along a path. */
const Z95 = 1.645

/* ==================================================================
   COMPILE
================================================================== */

type CompiledNode = {
  id: string
  label: string
  /** Per-replica capacity; Infinity when none is configured. */
  capacity: number
  replicas: number
  latencyMs: number
  errorRate: number
  down: boolean
  costPerHour: number
  hitRate: number
  queue: boolean
  unbounded: boolean
  /** True when user traffic enters here. */
  entry: boolean
  /** Jobs per second the node starts itself. */
  selfRate: number
  /** Part of `selfRate` that grows with the replica count. */
  perReplicaRate: number
  /** Indexes into `edges` of everything arriving. */
  incoming: number[]
  /** Indexes into `edges` of the calls this node waits on. */
  syncOut: number[]
}

type CompiledEdge = {
  id: string
  source: number
  target: number
  share: number
  fanout: number
  mode: FlowMode
  /** Calls per second a POLL edge issues regardless of traffic. */
  pollRate: number
  timeoutMs: number | null
}

/**
 * A diagram reduced to what the model needs, with nodes and edges addressed by
 * index. Plain data, so it can be built in a worker and reused across runs.
 */
export type CompiledGraph = {
  nodes: CompiledNode[]
  edges: CompiledEdge[]
  /** Node indexes in dependency order. */
  order: number[]
  entryCount: number
  exits: number[]
  cyclic: string[]
}

function clamp01(value: number) {
  return Math.min(1, Math.max(0, value))
}

/**
 * Resolve a diagram into its compiled form. Runs in O(V + E); everything that
 * depends only on the shape of the graph — dependency order, entry points,
 * inferred request types — is settled here, once.
 */
export function compileGraph(rawNodes: NodeLike[], rawEdges: EdgeLike[]): CompiledGraph {
  const plan = computeExecutionPlan(rawNodes, rawEdges)
  const executable = rawNodes.filter((n) => n.type !== "groupNode")
  const indexOf = new Map(executable.map((n, i) => [n.id, i]))

  const nodes: CompiledNode[] = executable.map((node) => {
    const sim = node.data?.sim ?? {}
    const capacity = typeof sim.capacity === "number" && sim.capacity > 0 ? sim.capacity : undefined
    const replicas = Math.max(1, Math.floor(sim.replicas ?? DEFAULT_NODE_SIM.replicas))
    const schedule = readSchedule(node)

    return {
      id: node.id,
      label: node.data?.label ?? node.id,
      capacity: capacity ?? Number.POSITIVE_INFINITY,
      replicas,
      latencyMs: Math.max(0, sim.latencyMs ?? DEFAULT_NODE_SIM.latencyMs),
      errorRate: clamp01(sim.errorRate ?? DEFAULT_NODE_SIM.errorRate),
      down: sim.down === true,
      costPerHour: Math.max(0, sim.costPerHour ?? 0),
      hitRate: clamp01(sim.hitRate ?? 0),
      // Queues buffer by nature, so the common ones don't need the flag set.
      queue: isBufferNode(node),
      unbounded: capacity === undefined,
      entry: false,
      selfRate: scheduleRate(schedule, replicas),
      perReplicaRate: schedule?.kind === "worker" ? scheduleRate(schedule, 1) : 0,
      incoming: [],
      syncOut: [],
    }
  })

  const edges: CompiledEdge[] = []
  const inDegree = new Array<number>(nodes.length).fill(0)
  const outModes: FlowMode[][] = nodes.map(() => [])

  rawEdges.forEach((edge, i) => {
    const source = indexOf.get(edge.source)
    const target = indexOf.get(edge.target)
    // Same rule as the planner: dangling edges and self-loops carry nothing.
    if (source === undefined || target === undefined || source === target) return

    const flow = resolveFlow(edge, executable[source], executable[target])
    const sim = edge.data?.sim ?? {}
    const fanout = Math.max(0, sim.fanout ?? 1)
    const index = edges.length

    edges.push({
      id: edgeKey(edge, i),
      source,
      target,
      share: clamp01(sim.share ?? 1),
      fanout,
      mode: flow.mode,
      // Every replica of the poller runs its own timer.
      pollRate: flow.mode === "poll" ? (nodes[source].replicas * 1000 * fanout) / flow.intervalMs : 0,
      timeoutMs: flow.timeoutMs,
    })

    nodes[target].incoming.push(index)
    if (flow.mode === "sync") nodes[source].syncOut.push(index)
    inDegree[target] += 1
    outModes[source].push(flow.mode)
  })

  let entryCount = 0
  executable.forEach((node, i) => {
    if (isTrafficEntry(inDegree[i], readSchedule(node) !== null, outModes[i])) {
      nodes[i].entry = true
      entryCount += 1
    }
  })

  const toIndex = (id: string) => indexOf.get(id)!
  // Exits carry the delivered throughput; entry-only graphs count themselves.
  const exitIds = plan.exitPoints.length > 0 ? plan.exitPoints : plan.entryPoints

  return {
    nodes,
    edges,
    order: plan.order.map(toIndex),
    entryCount,
    exits: exitIds.map(toIndex),
    cyclic: plan.cyclicNodes,
  }
}

/* ==================================================================
   RUN
================================================================== */

function statusFor(
  utilization: number,
  offered: number,
  down: boolean,
  buffering: boolean,
  dropped: number
): NodeStatus {
  if (down) return "down"
  if (offered <= 0) return "idle"
  if (utilization > 1) {
    if (buffering) return "backlog"
    // A consumer at its limit sheds nothing — the surplus waits in the queue.
    return dropped > 0 ? "overloaded" : "saturated"
  }
  if (utilization >= 0.85) return "saturated"
  if (utilization >= 0.6) return "warn"
  return "ok"
}

/**
 * Push a load through a compiled graph.
 *
 * User traffic enters at every entry point (the offered load is split evenly
 * between them); cron jobs, worker loops and pollers add their own on top.
 * Everything then flows along the edges in dependency order.
 */
export function runCompiled(
  graph: CompiledGraph,
  params: LoadParams = DEFAULT_LOAD_PARAMS
): SimulationReport {
  const { nodes, edges, order } = graph
  const count = nodes.length

  // Capacity has to survive the peak, not the average.
  const peakLoad = params.requestsPerSecond * Math.max(0, params.burstFactor || 1)
  const entryLoad = graph.entryCount > 0 ? peakLoad / graph.entryCount : 0

  /**
   * Demand pass: what each node *would* receive if nothing upstream were
   * shedding load or switched off. Capacity advice has to be sized against
   * this, otherwise a bottleneck hides the demand on everything behind it.
   */
  const demand = new Float64Array(count)
  const demandForwarded = new Float64Array(count)
  for (const i of order) {
    const node = nodes[i]
    let offered = (node.entry ? entryLoad : 0) + node.selfRate

    for (const ei of node.incoming) {
      const edge = edges[ei]
      offered +=
        edge.mode === "poll"
          ? edge.pollRate
          : demandForwarded[edge.source] * edge.share * edge.fanout
    }

    demand[i] = offered
    // Downstream demand is what a healthy node would forward: successful
    // responses minus anything a cache answers itself.
    demandForwarded[i] = offered * (1 - node.errorRate) * (1 - node.hitRate)
  }

  const metrics: Record<string, NodeMetrics> = {}
  const computed = new Uint8Array(count)
  /** Throughput each node passes on to its dependants. */
  const forwarded = new Float64Array(count)
  const latency = new Float64Array(count)
  const cumulativeMean = new Float64Array(count)
  /** Variance accumulated along the slowest path, for the percentile estimate. */
  const cumulativeVar = new Float64Array(count)
  /** Previous node on the slowest path reaching each node, or -1. */
  const previous = new Int32Array(count).fill(-1)
  /**
   * Where each node's latency chain begins: an entry point for a synchronous
   * request, or the node itself when it sits behind a hand-off.
   */
  const rootOf = new Int32Array(count)

  const edgeRate = new Float64Array(edges.length)
  const edgeLag = new Float64Array(edges.length)
  /** Backlog pushed back onto a queue by consumers that cannot keep up. */
  const consumerLag = new Float64Array(count)

  let scheduledLoad = 0

  for (const i of order) {
    const node = nodes[i]

    const selfRate = node.down ? 0 : node.selfRate
    scheduledLoad += selfRate

    let offered = (node.entry ? entryLoad : 0) + selfRate
    let pullOffered = 0
    let cumulative = 0
    let variance = 0
    let worstFrom = -1
    let root = i

    for (const ei of node.incoming) {
      const edge = edges[ei]
      const source = edge.source

      let rate: number
      if (edge.mode === "poll") {
        // A poller keeps its own clock; a dead one stops asking.
        rate = nodes[source].down ? 0 : edge.pollRate
        scheduledLoad += rate
      } else {
        rate = forwarded[source] * edge.share * edge.fanout
      }

      edgeRate[ei] = rate
      offered += rate
      if (edge.mode === "pull") pullOffered += rate

      // A hand-off starts a fresh latency chain: nobody upstream is still
      // waiting, so their time is not part of this path.
      if (edge.mode === "async" || edge.mode === "poll") continue

      if (computed[source] && cumulativeMean[source] >= cumulative) {
        cumulative = cumulativeMean[source]
        variance = cumulativeVar[source]
        worstFrom = source
        root = rootOf[source]
      }
    }

    const buffering = node.queue && !node.down

    // Failure injection removes the node's capacity entirely: everything
    // arriving is shed and nothing is forwarded.
    const totalCapacity = node.down ? 0 : node.capacity * node.replicas
    const servable = Math.min(offered, totalCapacity)
    const excess = Math.max(0, offered - totalCapacity)

    // What happens to the excess depends on who is holding it:
    //  - a queue keeps it, and falls behind (backlog);
    //  - a consumer never took it — it is still in the queue it pulls from;
    //  - anything else was sent a request it could not serve, and sheds it.
    const lagRate = buffering ? 0 : Math.min(pullOffered, excess)
    const dropped = buffering ? 0 : excess - lagRate
    const backlogRate = buffering ? excess : 0
    const accepted = buffering ? offered : servable

    if (lagRate > 0) {
      for (const ei of node.incoming) {
        if (edges[ei].mode !== "pull") continue
        const lag = lagRate * (edgeRate[ei] / pullOffered)
        edgeLag[ei] = lag
        consumerLag[edges[ei].source] += lag
      }
    }

    const utilization = totalCapacity > 0 ? offered / totalCapacity : offered > 0 ? Infinity : 0

    // M/M/1 wait approximation; a stalled node is reported at the cap
    // rather than as Infinity so the UI stays readable.
    const effectiveU = Math.min(utilization, STALL_UTILIZATION)
    const queueMs =
      Number.isFinite(totalCapacity) && totalCapacity > 0
        ? Math.min(
            node.latencyMs * (effectiveU / Math.max(1e-6, 1 - effectiveU)),
            node.latencyMs * MAX_QUEUE_MULTIPLIER
          )
        : 0
    const latencyMs = node.down ? 0 : node.latencyMs + queueMs

    // A queue hands on what it can serve, not everything it was given; and
    // only cache misses travel on.
    const served = servable * (1 - node.errorRate)
    forwarded[i] = served * (1 - node.hitRate)

    const lost = dropped + servable * node.errorRate
    const lossRate = offered > 0 ? lost / offered : 0

    // A worker loop adds load with every replica, so its own jobs cannot be
    // what the replica count is sized against.
    const sizingDemand = Math.max(0, demand[i] - node.perReplicaRate * node.replicas)
    const requiredReplicas = Number.isFinite(node.capacity)
      ? Math.max(
          1,
          Math.ceil(sizingDemand / (node.capacity * Math.max(0.05, params.targetUtilization)))
        )
      : node.replicas

    // Sum of means along the path, with variances combined normally — the
    // sum of exponential hops is not itself exponential.
    const pathMean = cumulative + latencyMs
    const pathVar = variance + latencyMs * latencyMs

    metrics[node.id] = {
      id: node.id,
      label: node.label,
      offered,
      accepted,
      dropped,
      utilization,
      serviceMs: node.latencyMs,
      queueMs,
      latencyMs,
      p95Ms: latencyMs * P95_FACTOR,
      cumulativeMs: pathMean,
      cumulativeP95Ms: pathMean + Z95 * Math.sqrt(pathVar),
      demand: demand[i],
      replicas: node.replicas,
      requiredReplicas,
      down: node.down,
      backlogRate,
      buffers: buffering,
      hitRate: node.hitRate,
      scheduledRate: selfRate,
      lagRate,
      monthlyCost: node.costPerHour * node.replicas * HOURS_PER_MONTH,
      projectedMonthlyCost:
        node.costPerHour * Math.max(node.replicas, requiredReplicas) * HOURS_PER_MONTH,
      lossRate,
      mbps: (served * params.payloadKb * 8) / 1000,
      status: statusFor(utilization, offered, node.down, buffering, dropped),
      unbounded: node.unbounded,
    }

    computed[i] = 1
    latency[i] = latencyMs
    cumulativeMean[i] = pathMean
    cumulativeVar[i] = pathVar
    previous[i] = worstFrom
    rootOf[i] = root
  }

  // Lag belongs to the queue being read, wherever the slow consumer sits.
  for (let i = 0; i < count; i++) {
    if (consumerLag[i] <= 0) continue
    const m = metrics[nodes[i].id]
    m.backlogRate += consumerLag[i]
    if (m.status !== "down") m.status = "backlog"
  }

  /**
   * Response time per call, walking the graph backwards: a caller waits for
   * the target and for everything the target itself waits on.
   */
  const subtreeMean = new Float64Array(count)
  const subtreeVar = new Float64Array(count)
  for (let k = order.length - 1; k >= 0; k--) {
    const i = order[k]
    let slowest = 0
    let slowestVar = 0
    for (const ei of nodes[i].syncOut) {
      const target = edges[ei].target
      if (subtreeMean[target] > slowest) {
        slowest = subtreeMean[target]
        slowestVar = subtreeVar[target]
      }
    }
    subtreeMean[i] = latency[i] + slowest
    subtreeVar[i] = latency[i] * latency[i] + slowestVar
  }

  const edgeMetrics: Record<string, EdgeMetrics> = {}
  const slowCalls: string[] = []
  edges.forEach((edge, ei) => {
    const target = edge.target
    // Publishing only waits for the broker's acknowledgement.
    const handOff = edge.mode === "async"
    const responseMs = handOff ? latency[target] : subtreeMean[target]
    const responseVar = handOff ? latency[target] * latency[target] : subtreeVar[target]
    const responseP95Ms = responseMs + Z95 * Math.sqrt(responseVar)
    const timedOut = edge.timeoutMs !== null && edgeRate[ei] > 0 && responseP95Ms > edge.timeoutMs

    if (timedOut) slowCalls.push(edge.id)

    edgeMetrics[edge.id] = {
      id: edge.id,
      source: nodes[edge.source].id,
      target: nodes[target].id,
      mode: edge.mode,
      rate: edgeRate[ei],
      responseMs,
      responseP95Ms,
      timeoutMs: edge.timeoutMs,
      timedOut,
      lagRate: edgeLag[ei],
    }
  })

  const all = Object.values(metrics)

  let delivered = 0
  for (const i of graph.exits) delivered += forwarded[i]

  const pathTo = (index: number) => {
    const path: string[] = []
    // `previous` only ever points upstream, but a cyclic graph can still loop.
    for (let i = index, guard = 0; i !== -1 && guard <= count; i = previous[i], guard++) {
      path.push(nodes[i].id)
    }
    return path.reverse()
  }

  // Only chains a caller is actually waiting on count as the request path.
  let slowestSync = -1
  let slowestBackground = -1
  let slowestAny = -1
  for (const i of order) {
    if (slowestAny === -1 || cumulativeMean[i] > cumulativeMean[slowestAny]) slowestAny = i
    if (nodes[rootOf[i]].entry) {
      if (slowestSync === -1 || cumulativeMean[i] > cumulativeMean[slowestSync]) slowestSync = i
    } else if (slowestBackground === -1 || cumulativeMean[i] > cumulativeMean[slowestBackground]) {
      slowestBackground = i
    }
  }
  const slowest = slowestSync !== -1 ? slowestSync : slowestAny

  const bottlenecks = all
    .filter((m) => m.utilization >= 0.85)
    .sort((a, b) => b.utilization - a.utilization)
    .map((m) => m.id)

  const totalDropped = all.reduce((sum, m) => sum + m.dropped, 0)
  // Measured against every call in the graph, not just the entry load: a
  // fan-out design makes far more requests than it receives, and comparing
  // exit throughput to offered load could read as 100% while nodes were
  // shedding traffic.
  const totalRequests = all.reduce((sum, m) => sum + m.offered, 0)

  const criticalPathP95Ms =
    slowest !== -1 ? cumulativeMean[slowest] + Z95 * Math.sqrt(cumulativeVar[slowest]) : 0
  const pipelineP95Ms =
    slowestBackground !== -1
      ? cumulativeMean[slowestBackground] + Z95 * Math.sqrt(cumulativeVar[slowestBackground])
      : 0

  const monthlyCost = all.reduce((sum, m) => sum + m.monthlyCost, 0)
  const projectedMonthlyCost = all.reduce((sum, m) => sum + m.projectedMonthlyCost, 0)
  const backlogRate = all.reduce((sum, m) => sum + m.backlogRate, 0)
  // Requests per month at the delivered rate, in millions.
  const millionsPerMonth = (delivered * 3600 * HOURS_PER_MONTH) / 1_000_000

  return {
    params,
    metrics,
    edges: edgeMetrics,
    summary: {
      offered: peakLoad,
      scheduledLoad,
      delivered,
      totalRequests,
      dropped: totalDropped,
      successRate: totalRequests > 0 ? 1 - totalDropped / totalRequests : 0,
      criticalPathMs: slowest !== -1 ? cumulativeMean[slowest] : 0,
      criticalPathP95Ms,
      criticalPath: slowest !== -1 ? pathTo(slowest) : [],
      pipelineP95Ms,
      pipelinePath: slowestBackground !== -1 ? pathTo(slowestBackground) : [],
      breachesTimeout: criticalPathP95Ms > params.timeoutMs,
      slowCalls,
      bottlenecks,
      scaleAdvice: all
        .filter((m) => !m.unbounded && m.requiredReplicas > m.replicas)
        .sort((a, b) => b.requiredReplicas / b.replicas - a.requiredReplicas / a.replicas)
        .map((m) => ({
          id: m.id,
          label: m.label,
          current: m.replicas,
          required: m.requiredReplicas,
        })),
      downNodes: all.filter((m) => m.down).map((m) => m.id),
      backlogRate,
      backlogNodes: all.filter((m) => m.backlogRate > 0).map((m) => m.id),
      monthlyCost,
      projectedMonthlyCost,
      costPerMillionRequests:
        monthlyCost > 0 && millionsPerMonth > 0 ? monthlyCost / millionsPerMonth : null,
      unbounded: all.filter((m) => m.unbounded).map((m) => m.id),
      cyclic: graph.cyclic,
      totalMbps: all.reduce((sum, m) => sum + m.mbps, 0),
    },
  }
}

/** Compile and run in one call, for callers that only need a single report. */
export function simulateLoad(
  nodes: NodeLike[],
  edges: EdgeLike[],
  params: LoadParams = DEFAULT_LOAD_PARAMS
): SimulationReport {
  return runCompiled(compileGraph(nodes, edges), params)
}

/* ==================================================================
   LOAD RAMP
================================================================== */

export type RampPoint = {
  /** Offered load for this sample, before the burst factor. */
  rps: number
  /** Throughput leaving the exit nodes. */
  delivered: number
  dropped: number
  backlog: number
  successRate: number
  p95Ms: number
  monthlyCost: number
}

export type RampResult = {
  points: RampPoint[]
  /**
   * First offered load at which the design stops keeping up — the knee in the
   * curve. Null when it survives the whole sweep.
   */
  kneeRps: number | null
  /** Highest load still served cleanly. */
  safeRps: number
  /** Load at which the p95 first breaches the timeout budget, if it does. */
  timeoutRps: number | null
}

/** Anything below this counts as "keeping up". */
const RAMP_CLEAN_THRESHOLD = 0.999

type RampOptions = { maxRps?: number; samples?: number }

/**
 * Sweep the offered load from zero to `maxRps` and report the curve.
 *
 * Dragging the load slider answers "what happens at 50k?"; the ramp answers
 * "where does this design stop working?", which is the more useful question.
 * The graph is compiled once and reused for every sample.
 */
export function sweepCompiled(
  graph: CompiledGraph,
  params: LoadParams,
  options: RampOptions = {}
): RampResult {
  const maxRps = Math.max(1, options.maxRps ?? params.requestsPerSecond * 2)
  const samples = Math.max(4, Math.min(80, options.samples ?? 24))

  const points: RampPoint[] = []
  let kneeRps: number | null = null
  let safeRps = 0
  let timeoutRps: number | null = null

  for (let i = 1; i <= samples; i++) {
    const rps = Math.round((maxRps / samples) * i)
    const { summary } = runCompiled(graph, { ...params, requestsPerSecond: rps })

    const clean = summary.successRate >= RAMP_CLEAN_THRESHOLD && summary.backlogRate <= 0
    if (clean) safeRps = rps
    if (!clean && kneeRps === null) kneeRps = rps
    if (summary.breachesTimeout && timeoutRps === null) timeoutRps = rps

    points.push({
      rps,
      delivered: summary.delivered,
      dropped: summary.dropped,
      backlog: summary.backlogRate,
      successRate: summary.successRate,
      p95Ms: summary.criticalPathP95Ms,
      monthlyCost: summary.monthlyCost,
    })
  }

  return { points, kneeRps, safeRps, timeoutRps }
}

export function sweepLoad(
  nodes: NodeLike[],
  edges: EdgeLike[],
  params: LoadParams,
  options: RampOptions = {}
): RampResult {
  return sweepCompiled(compileGraph(nodes, edges), params, options)
}

/* ==================================================================
   REPORTING
================================================================== */

/**
 * Markdown summary of a run, for pasting into a design doc or a pull request.
 */
export function capacityReport(report: SimulationReport, name = "Untitled design"): string {
  const { summary, params, metrics } = report
  const money = (n: number) => `$${Math.round(n).toLocaleString("en-US")}`

  const lines: string[] = [
    `## Capacity report — ${name}`,
    "",
    `Offered load **${formatRate(summary.offered)}**` +
      (params.burstFactor > 1 ? ` (${formatRate(params.requestsPerSecond)} × ${params.burstFactor} burst)` : "") +
      ` · target utilisation ${Math.round(params.targetUtilization * 100)}%` +
      ` · timeout budget ${formatMs(params.timeoutMs)}`,
    "",
    "| Metric | Value |",
    "| --- | --- |",
    `| Requests served | ${(summary.successRate * 100).toFixed(2)}% |`,
    `| Exit throughput | ${formatRate(summary.delivered)} |`,
    `| Dropped | ${formatRate(summary.dropped)} |`,
    `| Backlog growth | ${formatRate(summary.backlogRate)} |`,
    `| Slowest path (p95) | ${formatMs(summary.criticalPathP95Ms)}${summary.breachesTimeout ? " — **over budget**" : ""} |`,
    `| Slowest path (avg) | ${formatMs(summary.criticalPathMs)} |`,
    ...(summary.pipelineP95Ms > 0
      ? [`| Background pipeline (p95) | ${formatMs(summary.pipelineP95Ms)} |`]
      : []),
    `| Egress | ${summary.totalMbps.toFixed(1)} Mbps |`,
    ...(summary.scheduledLoad > 0
      ? [`| Scheduled load (cron, workers, polls) | ${formatRate(summary.scheduledLoad)} |`]
      : []),
  ]

  if (summary.monthlyCost > 0) {
    lines.push(`| Monthly cost | ${money(summary.monthlyCost)} |`)
    if (summary.costPerMillionRequests !== null) {
      lines.push(`| Cost per million requests | $${summary.costPerMillionRequests.toFixed(3)} |`)
    }
  }

  if (summary.criticalPath.length > 0) {
    lines.push(
      "",
      `**Request path:** ${summary.criticalPath.map((id) => metrics[id]?.label ?? id).join(" → ")}`
    )
  }

  if (summary.pipelinePath.length > 0) {
    lines.push(
      "",
      `**Background pipeline:** ${summary.pipelinePath.map((id) => metrics[id]?.label ?? id).join(" → ")}`
    )
  }

  if (summary.bottlenecks.length > 0) {
    lines.push("", "### Bottlenecks", "", "| Node | Utilisation | Dropped |", "| --- | --- | --- |")
    summary.bottlenecks.forEach((id) => {
      const m = metrics[id]
      lines.push(
        `| ${m.label} | ${Math.round(m.utilization * 100)}% | ${formatRate(m.dropped)} |`
      )
    })
  }

  if (summary.scaleAdvice.length > 0) {
    lines.push(
      "",
      "### Capacity plan",
      "",
      "| Node | Replicas | Needed |",
      "| --- | --- | --- |"
    )
    summary.scaleAdvice.forEach((a) => {
      lines.push(`| ${a.label} | ${a.current} | ${a.required} |`)
    })
    if (summary.projectedMonthlyCost > summary.monthlyCost) {
      lines.push(
        "",
        `Applying the plan moves monthly cost from ${money(summary.monthlyCost)} to ` +
          `${money(summary.projectedMonthlyCost)} ` +
          `(+${money(summary.projectedMonthlyCost - summary.monthlyCost)}).`
      )
    }
  }

  if (summary.slowCalls.length > 0) {
    lines.push("", "### Calls over their timeout", "", "| Call | p95 | Timeout |", "| --- | --- | --- |")
    summary.slowCalls.forEach((id) => {
      const e = report.edges[id]
      lines.push(
        `| ${metrics[e.source]?.label ?? e.source} → ${metrics[e.target]?.label ?? e.target} | ` +
          `${formatMs(e.responseP95Ms)} | ${formatMs(e.timeoutMs ?? 0)} |`
      )
    })
  }

  if (summary.downNodes.length > 0) {
    lines.push(
      "",
      `**Failure injected:** ${summary.downNodes.map((id) => metrics[id]?.label ?? id).join(", ")}`
    )
  }

  if (summary.unbounded.length > 0) {
    lines.push(
      "",
      `_${summary.unbounded.length} node(s) have no capacity configured and are treated as infinite._`
    )
  }

  return lines.join("\n")
}

/** Human-readable request rate. */
export function formatRate(rps: number) {
  if (rps >= 1_000_000) return `${(rps / 1_000_000).toFixed(1)}M/s`
  if (rps >= 1_000) return `${(rps / 1_000).toFixed(rps >= 10_000 ? 0 : 1)}k/s`
  return `${Math.round(rps)}/s`
}

/** Human-readable latency. */
export function formatMs(ms: number) {
  if (ms >= 1000) return `${(ms / 1000).toFixed(2)}s`
  return `${Math.round(ms)}ms`
}
