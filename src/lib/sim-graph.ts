/**
 * The part of a diagram the simulators care about.
 *
 * Canvas state changes on every mouse move — positions while dragging,
 * selection flags, measured sizes — and none of that affects a simulation.
 * The projector hands back the *same* graph object until something that
 * matters changes, so everything derived from it (the flow numbering, the
 * compiled graph in the worker) is skipped during a drag instead of rebuilt
 * sixty times a second.
 */

import type { EdgeFlowConfig } from "./flow-ops"
import type { EdgeLike, EdgeSimConfig, NodeLike, NodeSimConfig } from "./simulation-model"

export type SimGraph = {
  nodes: NodeLike[]
  edges: (EdgeLike & { id: string; label?: string })[]
}

type SourceNode = { id: string; type?: string; data?: Record<string, unknown> }
type SourceEdge = {
  id: string
  source: string
  target: string
  label?: unknown
  data?: Record<string, unknown>
}

function sameNodes(a: readonly SourceNode[], b: readonly SourceNode[]) {
  if (a === b) return true
  if (a.length !== b.length) return false
  for (let i = 0; i < a.length; i++) {
    const x = a[i]
    const y = b[i]
    // Moving or selecting a node replaces the node object but keeps `data`.
    if (x !== y && (x.id !== y.id || x.type !== y.type || x.data !== y.data)) return false
  }
  return true
}

function sameEdges(a: readonly SourceEdge[], b: readonly SourceEdge[]) {
  if (a === b) return true
  if (a.length !== b.length) return false
  for (let i = 0; i < a.length; i++) {
    const x = a[i]
    const y = b[i]
    if (
      x !== y &&
      (x.id !== y.id ||
        x.source !== y.source ||
        x.target !== y.target ||
        x.data !== y.data ||
        x.label !== y.label)
    ) {
      return false
    }
  }
  return true
}

/**
 * Returns a function that maps canvas state to a `SimGraph`, reusing the
 * previous result whenever the change was cosmetic. The output is plain data
 * with nothing but the fields the model reads, so it is cheap to post to a
 * worker and safe to keep around.
 */
export function createGraphProjector() {
  let lastNodes: readonly SourceNode[] = []
  let lastEdges: readonly SourceEdge[] = []
  let last: SimGraph = { nodes: [], edges: [] }

  return (nodes: readonly SourceNode[], edges: readonly SourceEdge[]): SimGraph => {
    const nodesSame = sameNodes(nodes, lastNodes)
    const edgesSame = sameEdges(edges, lastEdges)
    lastNodes = nodes
    lastEdges = edges
    if (nodesSame && edgesSame) return last

    last = {
      nodes: nodesSame
        ? last.nodes
        : nodes.map((n) => ({
            id: n.id,
            type: n.type,
            data: {
              label: n.data?.label as string | undefined,
              icon: n.data?.icon as string | undefined,
              sim: n.data?.sim as NodeSimConfig | undefined,
            },
          })),
      edges: edgesSame
        ? last.edges
        : edges.map((e) => ({
            id: e.id,
            source: e.source,
            target: e.target,
            label: typeof e.label === "string" ? e.label : undefined,
            data: {
              sim: e.data?.sim as EdgeSimConfig | undefined,
              flow: e.data?.flow as EdgeFlowConfig | undefined,
            },
          })),
    }
    return last
  }
}
