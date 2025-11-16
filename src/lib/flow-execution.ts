type Node = { id: string }
type Edge = { source: string; target: string }

export function computeExecutionPath(nodes: Node[], edges: Edge[]) {
  const incoming = new Map<string, number>()
  nodes.forEach((n) => incoming.set(n.id, 0))
  edges.forEach((e) => incoming.set(e.target, (incoming.get(e.target) || 0) + 1))

  const startNodes = nodes.filter((n) => (incoming.get(n.id) || 0) === 0)

  const visited = new Set<string>()
  const order: string[] = []

  function dfs(nodeId: string) {
    if (visited.has(nodeId)) return
    visited.add(nodeId)
    order.push(nodeId)

    const outEdges = edges.filter((e) => e.source === nodeId)
    outEdges.forEach((e) => dfs(e.target))
  }

  startNodes.forEach((n) => dfs(n.id))

  return order
}
