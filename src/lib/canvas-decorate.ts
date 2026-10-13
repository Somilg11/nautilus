/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Render-time decoration for nodes and edges.
 *
 * Simulation state is merged into node/edge `data` only for drawing — it never
 * reaches canvas state, undo history or exports. The decorators here also keep
 * object identity for everything that did not change: React Flow skips a node
 * or edge whose object is the same as last time, so a drag re-renders the one
 * node being moved instead of the whole diagram.
 */

import type { Edge, Node } from "reactflow"
import { OP_META, type FlowMode, type FlowOp, type FlowSequence } from "./flow-ops"
import { formatMs, formatRate, type NodeMetrics, type SimulationReport } from "./simulation-model"
import type { SimMark } from "./use-simulation"

/** What an edge needs to draw its numbered request badge. */
export type EdgeFlowView = {
  step: number
  op: FlowOp
  mode: FlowMode
  color: string
  /** Route, topic or legacy label shown after the operation. */
  detail: string
  /** Live call rate, while the load playground is open. */
  rate: string
  /** Live response time, while the load playground is open. */
  response: string
  /** The call's p95 is slower than its own timeout. */
  slow: boolean
  /** A consumer on this edge is falling behind. */
  lagging: boolean
}

const MAX_DETAIL = 26

const TRACE_ACTIVE = "#00ff99"
const TRACE_DONE = "#00b46e"
const SELECTED = "#ff4d4d"
const PLAIN = "#999999"

/** Every stroke colour an edge can take — one arrowhead marker is defined per colour. */
export const EDGE_COLORS: string[] = [
  ...new Set([...Object.values(OP_META).map((m) => m.color), TRACE_ACTIVE, TRACE_DONE, SELECTED, PLAIN]),
]

export const markerIdFor = (color: string) => `nautilus-arrow-${color.replace("#", "")}`

function dashFor(mode: FlowMode) {
  if (mode === "sync") return undefined
  return mode === "poll" ? "2 5" : "6 4"
}

export function createNodeDecorator() {
  let cache = new Map<string, { src: Node<any>; mark?: SimMark; metrics?: NodeMetrics; out: Node<any> }>()

  return (
    nodes: Node<any>[],
    marks: Map<string, SimMark>,
    report: SimulationReport | null
  ): Node<any>[] => {
    if (marks.size === 0 && !report) {
      if (cache.size > 0) cache = new Map()
      return nodes
    }

    const next: typeof cache = new Map()
    const out = nodes.map((n) => {
      const mark = marks.get(n.id)
      const metrics = report?.metrics[n.id]
      if (!mark && !metrics) return n

      const hit = cache.get(n.id)
      if (hit && hit.src === n && hit.mark === mark && hit.metrics === metrics) {
        next.set(n.id, hit)
        return hit.out
      }

      const decorated = {
        ...n,
        data: {
          ...n.data,
          ...(mark ? { __simStatus: mark } : {}),
          ...(metrics ? { __metrics: metrics } : {}),
        },
      }
      next.set(n.id, { src: n, mark, metrics, out: decorated })
      return decorated
    })

    cache = next
    return out
  }
}

export function createEdgeDecorator() {
  let cache = new Map<string, { src: Edge<any>; key: string; out: Edge<any> }>()

  return (
    edges: Edge<any>[],
    marks: Map<string, SimMark>,
    sequence: FlowSequence,
    report: SimulationReport | null,
    /** Skip animation on large diagrams and low-end devices. */
    lite: boolean
  ): Edge<any>[] => {
    const next: typeof cache = new Map()

    const out = edges.map((e) => {
      const flow = sequence.flowByEdge.get(e.id)
      const step = sequence.stepByEdge.get(e.id)
      const mark = marks.get(e.id)
      const live = report?.edges[e.id]

      const rate = live ? formatRate(live.rate) : ""
      const response = live && live.mode !== "async" ? formatMs(live.responseMs) : ""
      const slow = live?.timedOut ?? false
      const lagging = (live?.lagRate ?? 0) > 0
      // Busier calls draw thicker, on a log scale so 100k/s does not swamp 10/s.
      const weight = live ? Math.round(Math.min(3, Math.log10(live.rate + 1) / 1.5) * 2) / 2 : 0
      const idle = live ? live.rate <= 0 : false

      const key = `${step}|${flow?.op}|${flow?.path}|${mark}|${rate}|${response}|${slow}|${lagging}|${idle}|${e.selected}|${lite}`
      const hit = cache.get(e.id)
      if (hit && hit.src === e && hit.key === key) {
        next.set(e.id, hit)
        return hit.out
      }

      const color = flow ? OP_META[flow.op].color : PLAIN
      const stroke = e.selected
        ? SELECTED
        : mark === "active"
          ? TRACE_ACTIVE
          : mark === "done"
            ? TRACE_DONE
            : color

      const label = typeof e.label === "string" ? e.label : ""
      const detail = (flow?.path || label).slice(0, MAX_DETAIL)

      const view: EdgeFlowView | undefined =
        flow && step !== undefined
          ? { step, op: flow.op, mode: flow.mode, color, detail, rate, response, slow, lagging }
          : undefined

      const decorated: Edge<any> = {
        ...e,
        type: "deletableEdge", // Force type for existing edges
        animated: mark === "active" && !lite,
        // The arrowhead comes from a shared <marker> (see FlowMarkers) chosen
        // by stroke colour. React Flow's own markers are derived by hashing
        // every edge's marker config on every render, which adds up.
        markerEnd: undefined,
        data: { ...(e.data ?? {}), __simStatus: mark, __flow: view },
        style: {
          stroke,
          strokeWidth: e.selected ? 2 : mark === "active" ? 2.5 : 1.5 + weight,
          strokeDasharray: flow ? dashFor(flow.mode) : undefined,
          opacity: e.selected || mark ? 1 : idle ? 0.3 : 0.85,
        },
      }

      next.set(e.id, { src: e, key, out: decorated })
      return decorated
    })

    cache = next
    return out
  }
}
