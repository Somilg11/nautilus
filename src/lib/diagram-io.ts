/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Validation for diagrams coming from outside the app: imported JSON files,
 * `?d=` share links and localStorage written by an older version.
 *
 * Nothing here is trusted. Only known fields survive, which keeps a malformed
 * or hostile payload from injecting arbitrary props into React Flow, and drops
 * transient runtime keys (simulation marks) that must never be persisted.
 */

export type DiagramNode = {
  id: string
  type: string
  position: { x: number; y: number }
  data: Record<string, any>
  width?: number
  height?: number
  style?: Record<string, any>
  parentNode?: string
  extent?: "parent"
  selected?: boolean
}

export type DiagramEdge = {
  id: string
  source: string
  target: string
  sourceHandle?: string
  targetHandle?: string
  type: string
  animated?: boolean
  label?: string
  markerEnd?: any
  data?: Record<string, any>
}

export type Diagram = {
  name?: string
  nodes: DiagramNode[]
  edges: DiagramEdge[]
}

const ALLOWED_NODE_TYPES = new Set(["nautilusNode", "groupNode"])
const ALLOWED_COLORS = new Set([
  "default",
  "blue",
  "green",
  "red",
  "yellow",
  "purple",
  "orange",
])

/** Runtime-only keys that must be stripped before persisting or importing. */
const TRANSIENT_DATA_KEYS = ["__simStatus", "__glow", "__metrics"]

const MAX_NODES = 2000
const MAX_EDGES = 4000
const MAX_TEXT = 2000

function str(value: unknown, max = MAX_TEXT): string | undefined {
  return typeof value === "string" ? value.slice(0, max) : undefined
}

function num(value: unknown, fallback = 0): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback
}

/** Clamp a numeric simulation field, dropping anything unusable. */
function simNumber(value: unknown, max: number): number | undefined {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) return undefined
  return Math.min(value, max)
}

/** Node capacity model. Undefined fields fall back to the engine defaults. */
function sanitizeNodeSim(raw: any): Record<string, number> | undefined {
  if (!raw || typeof raw !== "object") return undefined

  const sim: Record<string, number> = {}
  const capacity = simNumber(raw.capacity, 10_000_000)
  const replicas = simNumber(raw.replicas, 10_000)
  const latencyMs = simNumber(raw.latencyMs, 600_000)
  const errorRate = simNumber(raw.errorRate, 1)

  if (capacity !== undefined) sim.capacity = capacity
  if (replicas !== undefined) sim.replicas = Math.max(1, Math.round(replicas))
  if (latencyMs !== undefined) sim.latencyMs = latencyMs
  if (errorRate !== undefined) sim.errorRate = errorRate

  return Object.keys(sim).length > 0 ? sim : undefined
}

/** Edge routing model. */
function sanitizeEdgeSim(raw: any): Record<string, number> | undefined {
  if (!raw || typeof raw !== "object") return undefined

  const sim: Record<string, number> = {}
  const share = simNumber(raw.share, 1)
  const fanout = simNumber(raw.fanout, 1000)

  if (share !== undefined) sim.share = share
  if (fanout !== undefined) sim.fanout = fanout

  return Object.keys(sim).length > 0 ? sim : undefined
}

function sanitizeData(raw: any): Record<string, any> {
  const data = raw && typeof raw === "object" ? raw : {}
  const color = str(data.color, 32)

  const clean: Record<string, any> = {
    label: str(data.label, 200) ?? "Node",
    description: str(data.description, MAX_TEXT),
    icon: str(data.icon, 64),
    color: color && ALLOWED_COLORS.has(color) ? color : "default",
  }

  const sim = sanitizeNodeSim(data.sim)
  if (sim) clean.sim = sim

  TRANSIENT_DATA_KEYS.forEach((k) => delete clean[k])
  return clean
}

function sanitizeNode(raw: any, index: number): DiagramNode | null {
  if (!raw || typeof raw !== "object") return null

  const id = str(raw.id, 128) ?? String(index)
  const type = str(raw.type, 64)
  const position = raw.position && typeof raw.position === "object" ? raw.position : {}

  const node: DiagramNode = {
    id,
    type: type && ALLOWED_NODE_TYPES.has(type) ? type : "nautilusNode",
    position: { x: num(position.x), y: num(position.y) },
    data: sanitizeData(raw.data),
  }

  if (typeof raw.width === "number") node.width = num(raw.width)
  if (typeof raw.height === "number") node.height = num(raw.height)
  if (raw.style && typeof raw.style === "object") {
    node.style = {
      width: num(raw.style.width, 0) || undefined,
      height: num(raw.style.height, 0) || undefined,
    }
  }
  if (typeof raw.parentNode === "string") node.parentNode = str(raw.parentNode, 128)
  if (raw.extent === "parent") node.extent = "parent"

  return node
}

function sanitizeEdge(raw: any, index: number, nodeIds: Set<string>): DiagramEdge | null {
  if (!raw || typeof raw !== "object") return null

  const source = str(raw.source, 128)
  const target = str(raw.target, 128)
  // Drop edges that do not connect two real nodes — they break traversal.
  if (!source || !target || !nodeIds.has(source) || !nodeIds.has(target)) return null

  const sim = sanitizeEdgeSim(raw.data?.sim)

  return {
    id: str(raw.id, 128) ?? `e${index}`,
    source,
    target,
    sourceHandle: str(raw.sourceHandle, 128),
    targetHandle: str(raw.targetHandle, 128),
    type: "deletableEdge",
    animated: raw.animated === true,
    label: str(raw.label, 200),
    markerEnd: raw.markerEnd && typeof raw.markerEnd === "object" ? raw.markerEnd : undefined,
    data: sim ? { sim } : undefined,
  }
}

export type SanitizeResult = {
  diagram: Diagram
  /** Human-readable notes about anything that was dropped or repaired. */
  notes: string[]
}

/**
 * Coerce an unknown payload into a diagram the canvas can safely render.
 * Throws only when the payload has no usable nodes/edges arrays at all.
 */
export function sanitizeDiagram(raw: any): SanitizeResult {
  const notes: string[] = []

  if (!raw || typeof raw !== "object") {
    throw new Error("Diagram must be a JSON object")
  }
  if (!Array.isArray(raw.nodes) || !Array.isArray(raw.edges)) {
    throw new Error("Diagram is missing `nodes` or `edges` arrays")
  }

  let rawNodes = raw.nodes
  if (rawNodes.length > MAX_NODES) {
    notes.push(`Truncated to the first ${MAX_NODES} nodes.`)
    rawNodes = rawNodes.slice(0, MAX_NODES)
  }

  const seen = new Set<string>()
  const nodes: DiagramNode[] = []
  rawNodes.forEach((n: any, i: number) => {
    const node = sanitizeNode(n, i)
    if (!node) return
    if (seen.has(node.id)) {
      notes.push(`Dropped duplicate node id "${node.id}".`)
      return
    }
    seen.add(node.id)
    nodes.push(node)
  })

  let rawEdges = raw.edges
  if (rawEdges.length > MAX_EDGES) {
    notes.push(`Truncated to the first ${MAX_EDGES} connections.`)
    rawEdges = rawEdges.slice(0, MAX_EDGES)
  }

  const edges: DiagramEdge[] = []
  const edgeIds = new Set<string>()
  rawEdges.forEach((e: any, i: number) => {
    const edge = sanitizeEdge(e, i, seen)
    if (!edge) return
    if (edgeIds.has(edge.id)) edge.id = `${edge.id}-${i}`
    edgeIds.add(edge.id)
    edges.push(edge)
  })

  const droppedEdges = rawEdges.length - edges.length
  if (droppedEdges > 0) {
    notes.push(`Dropped ${droppedEdges} connection(s) pointing at missing nodes.`)
  }

  return {
    diagram: { name: str(raw.name, 120), nodes, edges },
    notes,
  }
}
