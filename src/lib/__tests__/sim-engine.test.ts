import { describe, expect, it } from "vitest"
import { createEngine } from "../sim-engine"
import { createGraphProjector } from "../sim-graph"
import { DEFAULT_LOAD_PARAMS, simulateLoad } from "../simulation-model"

const nodes = [
  { id: "api", type: "nautilusNode", data: { label: "API", sim: { capacity: 400 } } },
  { id: "db", type: "nautilusNode", data: { label: "DB", sim: { capacity: 4000 } } },
]
const edges = [{ id: "e1", source: "api", target: "db" }]

describe("simulation engine", () => {
  it("keeps the compiled graph between runs", () => {
    const engine = createEngine()
    expect(engine.handle({ type: "graph", nodes, edges })).toBeNull()

    const first = engine.handle({ type: "run", seq: 1, params: DEFAULT_LOAD_PARAMS, rampMaxRps: 2000 })
    const second = engine.handle({
      type: "run",
      seq: 2,
      params: { ...DEFAULT_LOAD_PARAMS, requestsPerSecond: 200 },
      rampMaxRps: 2000,
    })

    if (first?.type !== "result" || second?.type !== "result") throw new Error("expected results")

    expect(first.seq).toBe(1)
    expect(first.report).toEqual(simulateLoad(nodes, edges, DEFAULT_LOAD_PARAMS))
    expect(first.ramp.points).toHaveLength(24)
    expect(first.nodeCount).toBe(2)
    expect(first.edgeCount).toBe(1)

    // Only the parameters were re-sent, and the answer still tracks them.
    expect(second.report.metrics.api.dropped).toBe(0)
    expect(first.report.metrics.api.dropped).toBe(600)
  })

  it("answers a run that arrives before any graph", () => {
    const result = createEngine().handle({
      type: "run",
      seq: 7,
      params: DEFAULT_LOAD_PARAMS,
      rampMaxRps: 1000,
    })

    expect(result?.type).toBe("result")
    expect(result?.seq).toBe(7)
  })

  it("produces results that survive being posted between threads", () => {
    const engine = createEngine()
    engine.handle({ type: "graph", nodes, edges })
    const result = engine.handle({ type: "run", seq: 1, params: DEFAULT_LOAD_PARAMS, rampMaxRps: 2000 })

    expect(structuredClone(result)).toEqual(result)
  })
})

describe("graph projector", () => {
  const canvasNodes = [
    { id: "a", type: "nautilusNode", position: { x: 0, y: 0 }, data: { label: "A" } },
    { id: "b", type: "nautilusNode", position: { x: 0, y: 100 }, data: { label: "B" } },
  ]
  const canvasEdges = [{ id: "e", source: "a", target: "b" }]

  it("returns the same graph while only positions and selection change", () => {
    const project = createGraphProjector()
    const first = project(canvasNodes, canvasEdges)

    // What a drag frame and a click produce: new node objects, same `data`.
    const dragged = canvasNodes.map((n) => ({ ...n, position: { x: 50, y: 50 }, selected: true }))
    const selected = canvasEdges.map((e) => ({ ...e, selected: true }))

    expect(project(dragged, selected)).toBe(first)
  })

  it("returns a new graph when something the model reads changes", () => {
    const project = createGraphProjector()
    const first = project(canvasNodes, canvasEdges)

    const edited = canvasNodes.map((n) =>
      n.id === "a" ? { ...n, data: { ...n.data, sim: { capacity: 10 } } } : n
    )
    const next = project(edited, canvasEdges)

    expect(next).not.toBe(first)
    expect(next.nodes[0].data?.sim).toEqual({ capacity: 10 })
    // The untouched half is reused rather than rebuilt.
    expect(next.edges).toBe(first.edges)

    expect(project(edited, [])).not.toBe(next)
  })

  it("carries only what the model needs", () => {
    const project = createGraphProjector()
    const graph = project(
      [{ id: "a", type: "nautilusNode", position: { x: 1, y: 2 }, data: { label: "A", description: "long text", __metrics: {} } }] as never,
      []
    )

    expect(graph.nodes[0]).toEqual({ id: "a", type: "nautilusNode", data: { label: "A", icon: undefined, sim: undefined } })
  })
})
