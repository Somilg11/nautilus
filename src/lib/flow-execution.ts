/**
 * Flow execution planner.
 *
 * Turns a diagram (nodes + edges) into a layered execution plan that the
 * canvas can animate step by step:
 *
 *   - Nodes with no incoming edges are entry points (step 0).
 *   - Every following step contains all nodes whose dependencies were
 *     satisfied by the previous steps, so parallel branches light up together
 *     instead of being forced into an arbitrary single-file order.
 *   - Edges are attached to the step in which data travels along them.
 *   - Nodes trapped in a cycle can never reach in-degree 0, so they are
 *     reported separately and appended as a final step.
 *
 * This module is pure — no React, no DOM — so it can be unit tested.
 */

export type SimNode = { id: string; type?: string }
export type SimEdge = { id?: string; source: string; target: string }

export type ExecutionStep = {
  /** Nodes that become active during this step. */
  nodes: string[]
  /** Edges carrying data into the nodes of this step. */
  edges: string[]
  /** True when this step only exists because the graph has a cycle. */
  cyclic?: boolean
}

export type ExecutionPlan = {
  steps: ExecutionStep[]
  /** Flattened node order, for callers that only need a sequence. */
  order: string[]
  /** Nodes with no incoming edges — where the simulation starts. */
  entryPoints: string[]
  /** Nodes with no outgoing edges — where the simulation ends. */
  exitPoints: string[]
  /** Nodes that take part in at least one cycle. */
  cyclicNodes: string[]
  /** Nodes not reachable from any entry point (isolated islands). */
  isolatedNodes: string[]
  /** Edges pointing at a node that does not exist. */
  danglingEdges: string[]
}

/** Node types that are decoration only and must not take part in a run. */
const NON_EXECUTABLE_TYPES = new Set(["groupNode"])

function isExecutable(node: SimNode) {
  return !NON_EXECUTABLE_TYPES.has(node.type ?? "")
}

function edgeKey(edge: SimEdge, index: number) {
  return edge.id ?? `${edge.source}->${edge.target}#${index}`
}

/**
 * Build a layered execution plan. Runs in O(V + E).
 */
export function computeExecutionPlan(
  nodes: SimNode[],
  edges: SimEdge[]
): ExecutionPlan {
  const executable = nodes.filter(isExecutable)
  const ids = new Set(executable.map((n) => n.id))

  const inDegree = new Map<string, number>()
  const outgoing = new Map<string, { target: string; edgeId: string }[]>()
  const incomingEdges = new Map<string, string[]>()
  const danglingEdges: string[] = []

  executable.forEach((n) => {
    inDegree.set(n.id, 0)
    outgoing.set(n.id, [])
    incomingEdges.set(n.id, [])
  })

  edges.forEach((e, i) => {
    const id = edgeKey(e, i)

    // Ignore edges to/from deleted or non-executable nodes instead of
    // aborting the whole run, and report them so the UI can warn.
    if (!ids.has(e.source) || !ids.has(e.target)) {
      danglingEdges.push(id)
      return
    }
    // A self-loop can never be satisfied; treat it as a cycle marker.
    if (e.source === e.target) {
      danglingEdges.push(id)
      return
    }

    inDegree.set(e.target, (inDegree.get(e.target) ?? 0) + 1)
    outgoing.get(e.source)!.push({ target: e.target, edgeId: id })
    incomingEdges.get(e.target)!.push(id)
  })

  const entryPoints = executable
    .filter((n) => (inDegree.get(n.id) ?? 0) === 0)
    .map((n) => n.id)

  const exitPoints = executable
    .filter((n) => (outgoing.get(n.id) ?? []).length === 0)
    .map((n) => n.id)

  const steps: ExecutionStep[] = []
  const settled = new Set<string>()
  const remainingDegree = new Map(inDegree)

  let frontier = [...entryPoints]

  while (frontier.length > 0) {
    frontier.forEach((id) => settled.add(id))

    steps.push({
      nodes: [...frontier],
      // A node only enters the frontier once every source feeding it has run,
      // so all of its incoming edges carry data during this step.
      edges: frontier.flatMap((id) => incomingEdges.get(id) ?? []),
    })

    const next: string[] = []
    for (const id of frontier) {
      for (const { target } of outgoing.get(id) ?? []) {
        const left = (remainingDegree.get(target) ?? 0) - 1
        remainingDegree.set(target, left)
        if (left === 0 && !settled.has(target)) next.push(target)
      }
    }
    frontier = next
  }

  // Anything left over is part of (or downstream of) a cycle.
  const cyclicNodes = executable
    .filter((n) => !settled.has(n.id))
    .map((n) => n.id)

  if (cyclicNodes.length > 0) {
    steps.push({
      nodes: cyclicNodes,
      edges: cyclicNodes.flatMap((id) => incomingEdges.get(id) ?? []),
      cyclic: true,
    })
  }

  // Entry points with no edges at all are isolated islands, worth flagging.
  const isolatedNodes = executable
    .filter(
      (n) =>
        (inDegree.get(n.id) ?? 0) === 0 && (outgoing.get(n.id) ?? []).length === 0
    )
    .map((n) => n.id)

  return {
    steps,
    order: steps.flatMap((s) => s.nodes),
    entryPoints,
    exitPoints,
    cyclicNodes,
    isolatedNodes,
    danglingEdges,
  }
}

/**
 * Backwards-compatible helper: flat topological order of node ids.
 */
export function computeExecutionPath(nodes: SimNode[], edges: SimEdge[]) {
  return computeExecutionPlan(nodes, edges).order
}
