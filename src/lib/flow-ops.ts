/**
 * Request model for connections.
 *
 * An edge is not just "A depends on B" — it is a specific interaction: a
 * `GET /orders` the caller waits on, a message published to a topic, a consumer
 * pulling from a queue, or a job polling a table every five seconds. This
 * module names those interactions, infers a sensible one for edges that were
 * drawn without any, and numbers every hop in the order it happens so the
 * canvas can show exactly which request goes where.
 *
 * Pure — no React, no DOM — so it runs unchanged inside the simulation worker.
 */

export const FLOW_OPS = [
  "GET",
  "POST",
  "PUT",
  "PATCH",
  "DELETE",
  "CALL",
  "READ",
  "WRITE",
  "QUERY",
  "PUBLISH",
  "EVENT",
  "CONSUME",
  "POLL",
] as const

export type FlowOp = (typeof FLOW_OPS)[number]

/**
 * Who initiates the hop and whether anybody waits on it.
 *
 * - `sync`  — the source calls the target and waits for the reply.
 * - `async` — the source hands off and moves on (publish, fire-and-forget).
 * - `pull`  — the target pulls work from the source (queue → consumer).
 * - `poll`  — the source hits the target on a timer, whatever traffic it sees.
 */
export type FlowMode = "sync" | "async" | "pull" | "poll"

export const OP_META: Record<FlowOp, { mode: FlowMode; color: string; hint: string }> = {
  GET: { mode: "sync", color: "#3b82f6", hint: "HTTP read — caller waits" },
  POST: { mode: "sync", color: "#22c55e", hint: "HTTP create — caller waits" },
  PUT: { mode: "sync", color: "#f59e0b", hint: "HTTP replace — caller waits" },
  PATCH: { mode: "sync", color: "#a855f7", hint: "HTTP partial update — caller waits" },
  DELETE: { mode: "sync", color: "#ef4444", hint: "HTTP delete — caller waits" },
  CALL: { mode: "sync", color: "#64748b", hint: "Generic request / RPC — caller waits" },
  READ: { mode: "sync", color: "#0ea5e9", hint: "Read from a store or cache" },
  WRITE: { mode: "sync", color: "#f97316", hint: "Write to a store or cache" },
  QUERY: { mode: "sync", color: "#14b8a6", hint: "Database query" },
  PUBLISH: { mode: "async", color: "#84cc16", hint: "Produce to a queue or topic — nobody waits" },
  EVENT: { mode: "async", color: "#ec4899", hint: "Fire-and-forget call or webhook" },
  CONSUME: { mode: "pull", color: "#eab308", hint: "Target pulls messages from the source" },
  POLL: { mode: "poll", color: "#6366f1", hint: "Source hits the target on a fixed interval" },
}

const OP_SET = new Set<string>(FLOW_OPS)

export function isFlowOp(value: unknown): value is FlowOp {
  return typeof value === "string" && OP_SET.has(value)
}

/** Per-edge request description, stored on `edge.data.flow`. */
export type EdgeFlowConfig = {
  op?: FlowOp
  /** Route, topic, table or key the hop touches: `/orders/:id`, `orders.created`. */
  path?: string
  /** Position among the source's outgoing calls. Lower runs first. */
  order?: number
  /** POLL only: time between polls, per replica of the source. */
  intervalMs?: number
  /** How long the caller is willing to wait before giving up. */
  timeoutMs?: number
}

/**
 * Self-triggered work, stored on `node.data.sim.schedule`.
 *
 * - `cron`   fires once per interval no matter how many replicas exist.
 * - `worker` is a loop every replica runs, so the rate scales with replicas.
 */
export type NodeSchedule = {
  kind: "cron" | "worker"
  everyMs: number
  /** Jobs started per firing. 1 by default. */
  batch?: number
}

export const DEFAULT_POLL_INTERVAL_MS = 5000

export type FlowNodeLike = {
  id: string
  type?: string
  data?: {
    label?: string
    icon?: string
    sim?: { queue?: boolean; schedule?: Partial<NodeSchedule>; replicas?: number }
  }
}

export type FlowEdgeLike = {
  id?: string
  source: string
  target: string
  label?: unknown
  data?: { sim?: { async?: boolean }; flow?: EdgeFlowConfig }
}

/** Icons that buffer by nature, so `queue` does not have to be set by hand. */
const QUEUE_ICONS = new Set([
  "kafka",
  "rabbitmq",
  "queue",
  "message_queue",
  "sqs",
  "event_stream",
  "orchestrator",
])

const DATABASE_ICONS = new Set([
  "database_sql",
  "database_nosql",
  "mysql",
  "postgres",
  "mongodb",
  "cassandra",
  "sqlite",
  "elastic",
  "elasticsearch",
])

const CACHE_ICONS = new Set(["cache", "redis"])

/** True for queues, topics and anything explicitly marked as buffering. */
export function isBufferNode(node: FlowNodeLike | undefined): boolean {
  if (!node) return false
  return node.data?.sim?.queue ?? QUEUE_ICONS.has(node.data?.icon ?? "")
}

/** Validated schedule, or null when the node only reacts to incoming traffic. */
export function readSchedule(node: FlowNodeLike | undefined): Required<NodeSchedule> | null {
  const raw = node?.data?.sim?.schedule
  if (!raw || (raw.kind !== "cron" && raw.kind !== "worker")) return null
  if (typeof raw.everyMs !== "number" || !Number.isFinite(raw.everyMs) || raw.everyMs <= 0) return null

  const batch = typeof raw.batch === "number" && raw.batch >= 0 ? raw.batch : 1
  return { kind: raw.kind, everyMs: raw.everyMs, batch }
}

/** Jobs per second a schedule starts. Cron fires once; a worker loops per replica. */
export function scheduleRate(schedule: Required<NodeSchedule> | null, replicas: number): number {
  if (!schedule) return 0
  const firings = schedule.kind === "worker" ? Math.max(1, replicas) : 1
  return (firings * schedule.batch * 1000) / schedule.everyMs
}

export type ResolvedFlow = {
  op: FlowOp
  mode: FlowMode
  path: string
  /** False when the operation was inferred from the node types. */
  explicit: boolean
  order: number | null
  intervalMs: number
  timeoutMs: number | null
}

/**
 * The interaction an edge represents. Edges drawn without an operation get one
 * inferred from what they connect, so an old diagram reads correctly without
 * anyone having to annotate it.
 */
export function resolveFlow(
  edge: FlowEdgeLike,
  source: FlowNodeLike | undefined,
  target: FlowNodeLike | undefined
): ResolvedFlow {
  const flow = edge.data?.flow ?? {}
  const explicit = isFlowOp(flow.op)

  let op: FlowOp
  if (explicit) {
    op = flow.op as FlowOp
  } else if (edge.data?.sim?.async === true) {
    op = "EVENT"
  } else if (isBufferNode(source)) {
    op = "CONSUME"
  } else if (isBufferNode(target) && edge.data?.sim?.async !== false) {
    op = "PUBLISH"
  } else if (DATABASE_ICONS.has(target?.data?.icon ?? "")) {
    op = "QUERY"
  } else if (CACHE_ICONS.has(target?.data?.icon ?? "")) {
    op = "READ"
  } else {
    op = "CALL"
  }

  const interval = flow.intervalMs
  const timeout = flow.timeoutMs

  return {
    op,
    mode: OP_META[op].mode,
    path: typeof flow.path === "string" ? flow.path : "",
    explicit,
    order: typeof flow.order === "number" && Number.isFinite(flow.order) ? flow.order : null,
    intervalMs:
      typeof interval === "number" && Number.isFinite(interval) && interval > 0
        ? interval
        : DEFAULT_POLL_INTERVAL_MS,
    timeoutMs: typeof timeout === "number" && Number.isFinite(timeout) && timeout > 0 ? timeout : null,
  }
}

/** Stable key for an edge, matching the execution planner's. */
export function edgeKey(edge: { id?: string; source: string; target: string }, index: number) {
  return edge.id ?? `${edge.source}->${edge.target}#${index}`
}

/** "5s", "250ms", "2m", "1h" — for badges and trigger descriptions. */
export function formatInterval(ms: number): string {
  if (ms < 1000) return `${Math.round(ms)}ms`
  if (ms < 60_000) return `${trim(ms / 1000)}s`
  if (ms < 3_600_000) return `${trim(ms / 60_000)}m`
  if (ms < 86_400_000) return `${trim(ms / 3_600_000)}h`
  return `${trim(ms / 86_400_000)}d`
}

function trim(value: number) {
  return String(Math.round(value * 10) / 10)
}

export function describeSchedule(schedule: Required<NodeSchedule>): string {
  const batch = schedule.batch !== 1 ? ` × ${schedule.batch}` : ""
  return schedule.kind === "cron"
    ? `cron every ${formatInterval(schedule.everyMs)}${batch}`
    : `worker loop every ${formatInterval(schedule.everyMs)}${batch}`
}

/* ==================================================================
   SEQUENCE
================================================================== */

export type FlowHop = {
  /** 1-based position in the overall flow. */
  step: number
  edgeId: string
  source: string
  target: string
  sourceLabel: string
  targetLabel: string
  op: FlowOp
  mode: FlowMode
  path: string
  /** What sets this hop off: "on request", "polls every 5s", "cron every 5m". */
  trigger: string
}

export type FlowSequence = {
  hops: FlowHop[]
  /** Edge id → step number. */
  stepByEdge: Map<string, number>
  /** Edge id → resolved operation, for rendering without resolving twice. */
  flowByEdge: Map<string, ResolvedFlow>
  /** Nodes where user traffic enters. */
  entryPoints: string[]
  /** Nodes that start work on their own: cron jobs, worker loops, pollers. */
  selfStarting: string[]
}

type OutEdge = { id: string; target: string; flow: ResolvedFlow; index: number }

/**
 * Number every hop in the order it happens.
 *
 * A request is followed depth-first through the calls its handler waits on,
 * because that is the order they are made in. Hand-offs — a publish, a
 * fire-and-forget event, a poll — are numbered where they are issued, but what
 * happens on the far side is deferred until the request that caused it has
 * finished, which is how it plays out in production too. Scheduled jobs and
 * pollers come after the request paths, as flows of their own.
 *
 * Runs in O(V + E log E).
 */
export function computeSequence(nodes: FlowNodeLike[], edges: FlowEdgeLike[]): FlowSequence {
  const executable = nodes.filter((n) => n.type !== "groupNode")
  const byId = new Map(executable.map((n) => [n.id, n]))

  const outgoing = new Map<string, OutEdge[]>()
  const inDegree = new Map<string, number>()
  executable.forEach((n) => {
    outgoing.set(n.id, [])
    inDegree.set(n.id, 0)
  })

  const flowByEdge = new Map<string, ResolvedFlow>()

  edges.forEach((e, index) => {
    if (!byId.has(e.source) || !byId.has(e.target) || e.source === e.target) return
    const id = edgeKey(e, index)
    const flow = resolveFlow(e, byId.get(e.source), byId.get(e.target))
    flowByEdge.set(id, flow)
    outgoing.get(e.source)!.push({ id, target: e.target, flow, index })
    inDegree.set(e.target, (inDegree.get(e.target) ?? 0) + 1)
  })

  // Explicit order first, then the order the connections were drawn in.
  outgoing.forEach((list) =>
    list.sort(
      (a, b) =>
        (a.flow.order ?? Number.POSITIVE_INFINITY) - (b.flow.order ?? Number.POSITIVE_INFINITY) ||
        a.index - b.index
    )
  )

  const labelOf = (id: string) => byId.get(id)?.data?.label || id

  const entryPoints: string[] = []
  const selfStarting: string[] = []
  executable.forEach((n) => {
    const out = outgoing.get(n.id)!
    const schedule = readSchedule(n)
    const polls = out.some((o) => o.flow.mode === "poll")
    if (schedule || polls) selfStarting.push(n.id)
    if (isTrafficEntry(inDegree.get(n.id) ?? 0, schedule !== null, out.map((o) => o.flow.mode))) {
      entryPoints.push(n.id)
    }
  })

  const hops: FlowHop[] = []
  const stepByEdge = new Map<string, number>()
  const expanded = new Set<string>()

  /** Follow one flow from `rootId`, then whatever it handed off. */
  function walk(rootId: string, rootTrigger: string) {
    const pending: { id: string; trigger: string }[] = [{ id: rootId, trigger: rootTrigger }]

    for (let p = 0; p < pending.length; p++) {
      const start = pending[p]
      if (expanded.has(start.id)) continue
      expanded.add(start.id)

      // Explicit stack: a 2,000-node chain must not overflow the call stack.
      const stack: { id: string; next: number }[] = [{ id: start.id, next: 0 }]

      while (stack.length > 0) {
        const frame = stack[stack.length - 1]
        const out = outgoing.get(frame.id)!
        if (frame.next >= out.length) {
          stack.pop()
          continue
        }

        const edge = out[frame.next++]
        const { flow } = edge

        const trigger =
          flow.mode === "poll"
            ? `polls every ${formatInterval(flow.intervalMs)}`
            : flow.mode === "pull"
              ? "on message"
              : start.trigger

        const step = hops.length + 1
        stepByEdge.set(edge.id, step)
        hops.push({
          step,
          edgeId: edge.id,
          source: frame.id,
          target: edge.target,
          sourceLabel: labelOf(frame.id),
          targetLabel: labelOf(edge.target),
          op: flow.op,
          mode: flow.mode,
          path: flow.path,
          trigger,
        })

        if (flow.mode === "sync" || flow.mode === "pull") {
          if (!expanded.has(edge.target)) {
            expanded.add(edge.target)
            stack.push({ id: edge.target, next: 0 })
          }
        } else {
          // Nobody waits past this point; pick the far side up afterwards.
          const after = flow.mode === "poll" ? trigger : `after step ${step}`
          pending.push({ id: edge.target, trigger: after })
        }
      }
    }
  }

  entryPoints.forEach((id) => walk(id, "on request"))

  // Flows that start themselves, in the order they sit on the canvas.
  executable.forEach((n) => {
    if (expanded.has(n.id)) return
    const schedule = readSchedule(n)
    if (schedule) walk(n.id, describeSchedule(schedule))
    else if ((inDegree.get(n.id) ?? 0) === 0) walk(n.id, "self-started")
  })

  // Anything left is only reachable through a cycle with no way in.
  executable.forEach((n) => {
    if (!expanded.has(n.id) && outgoing.get(n.id)!.length > 0) walk(n.id, "in a cycle")
  })

  return { hops, stepByEdge, flowByEdge, entryPoints, selfStarting }
}

/**
 * Whether user traffic enters at a node. Jobs that start themselves — cron,
 * worker loops, pure pollers — have no callers, but they are not where
 * requests arrive either, so the offered load must not be split onto them.
 */
export function isTrafficEntry(inDegree: number, scheduled: boolean, outModes: FlowMode[]): boolean {
  if (inDegree > 0 || scheduled) return false
  if (outModes.length > 0 && outModes.every((m) => m === "poll")) return false
  return true
}
