type Node = { id: string }
type Edge = { source: string; target: string }

export function computeExecutionPath(nodes: Node[], edges: Edge[]) {
  const incoming = new Map<string, number>()
  const adj = new Map<string, string[]>()

  // Initialize
  nodes.forEach((n) => {
    incoming.set(n.id, 0)
    adj.set(n.id, [])
  })

  // Build Graph
  edges.forEach((e) => {
    // Only consider edges where both source and target exist in the nodes list
    if (incoming.has(e.target) && incoming.has(e.source)) {
      incoming.set(e.target, (incoming.get(e.target) || 0) + 1)
      adj.get(e.source)?.push(e.target)
    }
  })

  // Queue for Kahn's Algorithm (nodes with 0 in-degree)
  const queue: string[] = []
  nodes.forEach((n) => {
    if (incoming.get(n.id) === 0) {
      queue.push(n.id)
    }
  })

  const order: string[] = []

  while (queue.length > 0) {
    const u = queue.shift()!
    order.push(u)

    const neighbors = adj.get(u) || []
    for (const v of neighbors) {
      const newIn = (incoming.get(v) || 0) - 1
      incoming.set(v, newIn)
      if (newIn === 0) {
        queue.push(v)
      }
    }
  }

  // Handle cycles or remaining nodes (if graph has cycles, some nodes won't reach 0 in-degree)
  if (order.length < nodes.length) {
    const visited = new Set(order)
    const remaining = nodes.filter((n) => !visited.has(n.id))
    // Append remaining nodes. In a cycle, strict dependency order is impossible, so we just visit them.
    remaining.forEach((n) => order.push(n.id))
  }

  return order
}
