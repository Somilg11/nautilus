/**
 * Load simulation model.
 *
 * The trace simulator (`flow-execution.ts`) answers "in what order does this
 * run?". This module answers "what happens when you push traffic through it?"
 * — where the queue builds, what drops, and how slow the slowest path gets.
 *
 * It is a steady-state analytical model, not a discrete-event simulator: one
 * pass over the graph in dependency order, with an M/M/1 queueing approximation
 * for wait time. That is enough to expose bottlenecks and capacity mistakes,
 * and it runs instantly on every parameter change.
 *
 * Pure — no React, no DOM.
 */

import { computeExecutionPlan } from "./flow-execution"

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
   * Fire-and-forget hand-off. Traffic still flows, but the caller does not wait,
   * so latency past this edge is not part of its request. Publishing to a queue
   * is treated this way automatically.
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

/** Icons that buffer by nature, so `queue` does not have to be set by hand. */
const QUEUE_ICONS = new Set([
  "kafka",
  "rabbitmq",
  "queue",
  "sqs",
  "event_stream",
  "orchestrator",
])

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

export type SimulationReport = {
  params: LoadParams
  metrics: Record<string, NodeMetrics>
  summary: {
    /** Load applied at the entry points. */
    offered: number
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

type NodeLike = {
  id: string
  type?: string
  data?: { label?: string; icon?: string; sim?: NodeSimConfig }
}

type EdgeLike = {
  id?: string
  source: string
  target: string
  data?: { sim?: EdgeSimConfig }
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

function nodeConfig(node: NodeLike) {
  const sim = node.data?.sim ?? {}
  const capacity = typeof sim.capacity === "number" && sim.capacity > 0 ? sim.capacity : undefined

  return {
    capacity: capacity ?? Number.POSITIVE_INFINITY,
    replicas: Math.max(1, Math.floor(sim.replicas ?? DEFAULT_NODE_SIM.replicas)),
    latencyMs: Math.max(0, sim.latencyMs ?? DEFAULT_NODE_SIM.latencyMs),
    errorRate: Math.min(1, Math.max(0, sim.errorRate ?? DEFAULT_NODE_SIM.errorRate)),
    down: sim.down === true,
    costPerHour: Math.max(0, sim.costPerHour ?? 0),
    hitRate: Math.min(1, Math.max(0, sim.hitRate ?? 0)),
    // Queues buffer by nature, so the common ones don't need the flag set.
    queue: sim.queue ?? QUEUE_ICONS.has(node.data?.icon ?? ""),
    unbounded: capacity === undefined,
  }
}

function edgeConfig(edge: EdgeLike, targetBuffers = false) {
  const sim = edge.data?.sim ?? {}
  return {
    share: Math.min(1, Math.max(0, sim.share ?? 1)),
    fanout: Math.max(0, sim.fanout ?? 1),
    // Publishing to a queue is a hand-off: the producer's request ends there,
    // and the consumer's latency belongs to its own chain.
    async: sim.async ?? targetBuffers,
  }
}

function statusFor(
  utilization: number,
  offered: number,
  down: boolean,
  buffering: boolean
): NodeStatus {
  if (down) return "down"
  if (offered <= 0) return "idle"
  if (utilization > 1) return buffering ? "backlog" : "overloaded"
  if (utilization >= 0.85) return "saturated"
  if (utilization >= 0.6) return "warn"
  return "ok"
}

/**
 * Run the model over a diagram.
 *
 * Traffic enters at every node with no incoming edges (the offered load is
 * split evenly between them) and flows along edges in dependency order.
 */
export function simulateLoad(
  nodes: NodeLike[],
  edges: EdgeLike[],
  params: LoadParams = DEFAULT_LOAD_PARAMS
): SimulationReport {
  const plan = computeExecutionPlan(nodes, edges)
  const executable = nodes.filter((n) => n.type !== "groupNode")
  const byId = new Map(executable.map((n) => [n.id, n]))

  // Incoming edges per node, ignoring anything the planner discarded.
  const incoming = new Map<string, { edge: EdgeLike; source: string }[]>()
  executable.forEach((n) => incoming.set(n.id, []))
  edges.forEach((e) => {
    if (!byId.has(e.source) || !byId.has(e.target) || e.source === e.target) return
    incoming.get(e.target)!.push({ edge: e, source: e.source })
  })

  // Capacity has to survive the peak, not the average.
  const peakLoad = params.requestsPerSecond * Math.max(0, params.burstFactor || 1)
  const entryLoad = plan.entryPoints.length > 0 ? peakLoad / plan.entryPoints.length : 0

  /** Throughput a healthy node would hand downstream, used by the demand pass. */
  const demandForwarded = new Map<string, number>()

  /**
   * Demand pass: what each node *would* receive if nothing upstream were
   * shedding load or switched off. Capacity advice has to be sized against
   * this, otherwise a bottleneck hides the demand on everything behind it.
   */
  const demand = new Map<string, number>()
  for (const step of plan.steps) {
    for (const id of step.nodes) {
      const config = nodeConfig(byId.get(id)!)
      let offered = plan.entryPoints.includes(id) ? entryLoad : 0

      for (const { edge, source } of incoming.get(id) ?? []) {
        const { share, fanout } = edgeConfig(edge)
        offered += (demandForwarded.get(source) ?? 0) * share * fanout
      }

      demand.set(id, offered)
      // Downstream demand is what a healthy node would forward: successful
      // responses minus anything a cache answers itself.
      demandForwarded.set(id, offered * (1 - config.errorRate) * (1 - config.hitRate))
    }
  }

  const metrics: Record<string, NodeMetrics> = {}
  /** Throughput each node passes on to its dependants. */
  const forwarded = new Map<string, number>()
  /** Best-known slowest path reaching each node. */
  const pathTo = new Map<string, string[]>()
  /** Variance accumulated along that path, for the percentile estimate. */
  const varianceTo = new Map<string, number>()
  /**
   * Where each node's latency chain begins: an entry point for a synchronous
   * request, or the node itself when it sits behind an async hand-off.
   */
  const rootOf = new Map<string, string>()

  for (const step of plan.steps) {
    for (const id of step.nodes) {
      const node = byId.get(id)!
      const config = nodeConfig(node)

      const inbound = incoming.get(id) ?? []
      let offered = plan.entryPoints.includes(id) ? entryLoad : 0
      let cumulative = 0
      let cumulativeVar = 0
      let worstPath: string[] = []
      let root = id

      const buffers = config.queue && !config.down

      for (const { edge, source } of inbound) {
        const { share, fanout, async } = edgeConfig(edge, buffers)
        offered += (forwarded.get(source) ?? 0) * share * fanout

        // An async hand-off starts a fresh latency chain: nobody upstream is
        // still waiting, so their time is not part of this path.
        if (async) continue

        const upstream = metrics[source]
        if (upstream && upstream.cumulativeMs >= cumulative) {
          cumulative = upstream.cumulativeMs
          cumulativeVar = varianceTo.get(source) ?? 0
          worstPath = pathTo.get(source) ?? [source]
          root = rootOf.get(source) ?? source
        }
      }

      // Failure injection removes the node's capacity entirely: everything
      // arriving is shed and nothing is forwarded.
      const totalCapacity = config.down ? 0 : config.capacity * config.replicas
      const servable = Math.min(offered, totalCapacity)

      // A queue past capacity does not shed traffic, it falls behind: the
      // excess becomes backlog growth rather than dropped requests. A dead
      // queue is still dead, though.
      const buffering = buffers
      const accepted = buffering ? offered : servable
      const dropped = buffering ? 0 : Math.max(0, offered - servable)
      const backlogRate = buffering ? Math.max(0, offered - totalCapacity) : 0

      const utilization = totalCapacity > 0 ? offered / totalCapacity : offered > 0 ? Infinity : 0

      // M/M/1 wait approximation; a stalled node is reported at the cap
      // rather than as Infinity so the UI stays readable.
      const effectiveU = Math.min(utilization, STALL_UTILIZATION)
      const queueMs =
        Number.isFinite(totalCapacity) && totalCapacity > 0
          ? Math.min(
              config.latencyMs * (effectiveU / Math.max(1e-6, 1 - effectiveU)),
              config.latencyMs * MAX_QUEUE_MULTIPLIER
            )
          : 0
      const latencyMs = config.down ? 0 : config.latencyMs + queueMs

      // Only cache misses travel on.
      const served = accepted * (1 - config.errorRate)
      const passed = served * (1 - config.hitRate)
      forwarded.set(id, passed)

      const lossRate = offered > 0 ? 1 - served / offered : 0

      const nodeDemand = demand.get(id) ?? 0
      const requiredReplicas = Number.isFinite(config.capacity)
        ? Math.max(
            1,
            Math.ceil(nodeDemand / (config.capacity * Math.max(0.05, params.targetUtilization)))
          )
        : config.replicas

      // Sum of means along the path, with variances combined normally — the
      // sum of exponential hops is not itself exponential.
      const pathMean = cumulative + latencyMs
      const pathVar = cumulativeVar + latencyMs * latencyMs

      const monthlyCost = config.costPerHour * config.replicas * HOURS_PER_MONTH

      metrics[id] = {
        id,
        label: node.data?.label ?? id,
        offered,
        accepted,
        dropped,
        utilization,
        serviceMs: config.latencyMs,
        queueMs,
        latencyMs,
        p95Ms: latencyMs * P95_FACTOR,
        cumulativeMs: pathMean,
        cumulativeP95Ms: pathMean + Z95 * Math.sqrt(pathVar),
        demand: nodeDemand,
        replicas: config.replicas,
        requiredReplicas,
        down: config.down,
        backlogRate,
        buffers: buffering,
        hitRate: config.hitRate,
        monthlyCost,
        projectedMonthlyCost:
          config.costPerHour * Math.max(config.replicas, requiredReplicas) * HOURS_PER_MONTH,
        lossRate,
        mbps: (served * params.payloadKb * 8) / 1000,
        status: statusFor(utilization, offered, config.down, buffering),
        unbounded: config.unbounded,
      }

      pathTo.set(id, [...worstPath, id])
      varianceTo.set(id, pathVar)
      rootOf.set(id, root)
    }
  }

  // Exits carry the delivered throughput; entry-only graphs count themselves.
  const exitIds = plan.exitPoints.length > 0 ? plan.exitPoints : plan.entryPoints
  const delivered = exitIds.reduce((sum, id) => sum + (forwarded.get(id) ?? 0), 0)

  const entrySet = new Set(plan.entryPoints)
  const worstIn = (candidates: NodeMetrics[]) =>
    candidates.reduce<NodeMetrics | null>(
      (worst, m) => (!worst || m.cumulativeMs > worst.cumulativeMs ? m : worst),
      null
    )

  // Only chains a caller is actually waiting on count as the request path.
  const synchronous = Object.values(metrics).filter((m) => entrySet.has(rootOf.get(m.id) ?? m.id))
  const background = Object.values(metrics).filter((m) => !entrySet.has(rootOf.get(m.id) ?? m.id))

  const slowest = worstIn(synchronous) ?? worstIn(Object.values(metrics))
  const slowestPipeline = worstIn(background)

  const bottlenecks = Object.values(metrics)
    .filter((m) => m.utilization >= 0.85)
    .sort((a, b) => b.utilization - a.utilization)
    .map((m) => m.id)

  const totalDropped = Object.values(metrics).reduce((sum, m) => sum + m.dropped, 0)
  // Measured against every call in the graph, not just the entry load: a
  // fan-out design makes far more requests than it receives, and comparing
  // exit throughput to offered load could read as 100% while nodes were
  // shedding traffic.
  const totalRequests = Object.values(metrics).reduce((sum, m) => sum + m.offered, 0)

  const criticalPathP95Ms = slowest?.cumulativeP95Ms ?? 0

  const all = Object.values(metrics)
  const monthlyCost = all.reduce((sum, m) => sum + m.monthlyCost, 0)
  const projectedMonthlyCost = all.reduce((sum, m) => sum + m.projectedMonthlyCost, 0)
  const backlogRate = all.reduce((sum, m) => sum + m.backlogRate, 0)
  // Requests per month at the delivered rate, in millions.
  const millionsPerMonth = (delivered * 3600 * HOURS_PER_MONTH) / 1_000_000

  return {
    params,
    metrics,
    summary: {
      offered: peakLoad,
      delivered,
      totalRequests,
      dropped: totalDropped,
      successRate: totalRequests > 0 ? 1 - totalDropped / totalRequests : 0,
      criticalPathMs: slowest?.cumulativeMs ?? 0,
      criticalPathP95Ms,
      criticalPath: slowest ? (pathTo.get(slowest.id) ?? [slowest.id]) : [],
      pipelineP95Ms: slowestPipeline?.cumulativeP95Ms ?? 0,
      pipelinePath: slowestPipeline ? (pathTo.get(slowestPipeline.id) ?? [slowestPipeline.id]) : [],
      breachesTimeout: criticalPathP95Ms > params.timeoutMs,
      bottlenecks,
      scaleAdvice: Object.values(metrics)
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
      unbounded: Object.values(metrics)
        .filter((m) => m.unbounded)
        .map((m) => m.id),
      cyclic: plan.cyclicNodes,
      totalMbps: Object.values(metrics).reduce((sum, m) => sum + m.mbps, 0),
    },
  }
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

/**
 * Sweep the offered load from zero to `maxRps` and report the curve.
 *
 * Dragging the load slider answers "what happens at 50k?"; the ramp answers
 * "where does this design stop working?", which is the more useful question.
 */
export function sweepLoad(
  nodes: NodeLike[],
  edges: EdgeLike[],
  params: LoadParams,
  options: { maxRps?: number; samples?: number } = {}
): RampResult {
  const maxRps = Math.max(1, options.maxRps ?? params.requestsPerSecond * 2)
  const samples = Math.max(4, Math.min(80, options.samples ?? 24))

  const points: RampPoint[] = []
  let kneeRps: number | null = null
  let safeRps = 0
  let timeoutRps: number | null = null

  for (let i = 1; i <= samples; i++) {
    const rps = Math.round((maxRps / samples) * i)
    const report = simulateLoad(nodes, edges, { ...params, requestsPerSecond: rps })
    const { summary } = report

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
