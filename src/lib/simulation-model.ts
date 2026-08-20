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
}

export type LoadParams = {
  /** Total offered load in requests per second, split across entry points. */
  requestsPerSecond: number
  /** End-to-end budget; paths slower than this are reported as breaching. */
  timeoutMs: number
  /** Average response payload, used for bandwidth estimates. */
  payloadKb: number
}

export const DEFAULT_LOAD_PARAMS: LoadParams = {
  requestsPerSecond: 1000,
  timeoutMs: 500,
  payloadKb: 8,
}

export const DEFAULT_NODE_SIM: Required<NodeSimConfig> = {
  capacity: 500,
  replicas: 1,
  latencyMs: 20,
  errorRate: 0,
}

export type NodeStatus = "idle" | "ok" | "warn" | "saturated" | "overloaded"

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
  /** Slowest cumulative latency from an entry point to this node. */
  cumulativeMs: number
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
    /** Whether the critical path breaches the timeout budget. */
    breachesTimeout: boolean
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
  data?: { label?: string; sim?: NodeSimConfig }
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

function nodeConfig(node: NodeLike): Required<NodeSimConfig> & { unbounded: boolean } {
  const sim = node.data?.sim ?? {}
  const capacity = typeof sim.capacity === "number" && sim.capacity > 0 ? sim.capacity : undefined

  return {
    capacity: capacity ?? Number.POSITIVE_INFINITY,
    replicas: Math.max(1, Math.floor(sim.replicas ?? DEFAULT_NODE_SIM.replicas)),
    latencyMs: Math.max(0, sim.latencyMs ?? DEFAULT_NODE_SIM.latencyMs),
    errorRate: Math.min(1, Math.max(0, sim.errorRate ?? DEFAULT_NODE_SIM.errorRate)),
    unbounded: capacity === undefined,
  }
}

function edgeConfig(edge: EdgeLike) {
  const sim = edge.data?.sim ?? {}
  return {
    share: Math.min(1, Math.max(0, sim.share ?? 1)),
    fanout: Math.max(0, sim.fanout ?? 1),
  }
}

function statusFor(utilization: number, offered: number): NodeStatus {
  if (offered <= 0) return "idle"
  if (utilization > 1) return "overloaded"
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

  const entryLoad =
    plan.entryPoints.length > 0
      ? params.requestsPerSecond / plan.entryPoints.length
      : 0

  const metrics: Record<string, NodeMetrics> = {}
  /** Throughput each node passes on to its dependants. */
  const forwarded = new Map<string, number>()
  /** Best-known slowest path reaching each node. */
  const pathTo = new Map<string, string[]>()

  for (const step of plan.steps) {
    for (const id of step.nodes) {
      const node = byId.get(id)!
      const config = nodeConfig(node)

      const inbound = incoming.get(id) ?? []
      let offered = plan.entryPoints.includes(id) ? entryLoad : 0
      let cumulative = 0
      let worstPath: string[] = []

      for (const { edge, source } of inbound) {
        const { share, fanout } = edgeConfig(edge)
        offered += (forwarded.get(source) ?? 0) * share * fanout

        const upstream = metrics[source]
        if (upstream && upstream.cumulativeMs >= cumulative) {
          cumulative = upstream.cumulativeMs
          worstPath = pathTo.get(source) ?? [source]
        }
      }

      const totalCapacity = config.capacity * config.replicas
      const accepted = Math.min(offered, totalCapacity)
      const dropped = Math.max(0, offered - accepted)
      const utilization = totalCapacity > 0 ? offered / totalCapacity : 0

      // M/M/1 wait approximation; a stalled node is reported at the cap
      // rather than as Infinity so the UI stays readable.
      const effectiveU = Math.min(utilization, STALL_UTILIZATION)
      const queueMs = Number.isFinite(totalCapacity)
        ? Math.min(
            config.latencyMs * (effectiveU / Math.max(1e-6, 1 - effectiveU)),
            config.latencyMs * MAX_QUEUE_MULTIPLIER
          )
        : 0
      const latencyMs = config.latencyMs + queueMs

      const passed = accepted * (1 - config.errorRate)
      forwarded.set(id, passed)

      const lossRate = offered > 0 ? 1 - passed / offered : 0

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
        cumulativeMs: cumulative + latencyMs,
        lossRate,
        mbps: (passed * params.payloadKb * 8) / 1000,
        status: statusFor(utilization, offered),
        unbounded: config.unbounded,
      }

      pathTo.set(id, [...worstPath, id])
    }
  }

  // Exits carry the delivered throughput; entry-only graphs count themselves.
  const exitIds = plan.exitPoints.length > 0 ? plan.exitPoints : plan.entryPoints
  const delivered = exitIds.reduce((sum, id) => sum + (forwarded.get(id) ?? 0), 0)

  const slowest = Object.values(metrics).reduce<NodeMetrics | null>(
    (worst, m) => (!worst || m.cumulativeMs > worst.cumulativeMs ? m : worst),
    null
  )

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

  return {
    params,
    metrics,
    summary: {
      offered: params.requestsPerSecond,
      delivered,
      totalRequests,
      dropped: totalDropped,
      successRate: totalRequests > 0 ? 1 - totalDropped / totalRequests : 0,
      criticalPathMs: slowest?.cumulativeMs ?? 0,
      criticalPath: slowest ? (pathTo.get(slowest.id) ?? [slowest.id]) : [],
      breachesTimeout: (slowest?.cumulativeMs ?? 0) > params.timeoutMs,
      bottlenecks,
      unbounded: Object.values(metrics)
        .filter((m) => m.unbounded)
        .map((m) => m.id),
      cyclic: plan.cyclicNodes,
      totalMbps: Object.values(metrics).reduce((sum, m) => sum + m.mbps, 0),
    },
  }
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
