import { describe, expect, it } from "vitest"
import { sanitizeDiagram } from "../diagram-io"

describe("sanitizeDiagram", () => {
  it("rejects payloads without node/edge arrays", () => {
    expect(() => sanitizeDiagram({ nodes: [] })).toThrow()
    expect(() => sanitizeDiagram("nope")).toThrow()
  })

  it("strips unknown props and transient simulation state", () => {
    const { diagram } = sanitizeDiagram({
      nodes: [
        {
          id: "a",
          type: "nautilusNode",
          position: { x: 1, y: 2 },
          data: { label: "API", __simStatus: "active", onClick: "alert(1)" },
        },
      ],
      edges: [],
    })

    expect(diagram.nodes[0].data).toEqual({
      label: "API",
      description: undefined,
      icon: undefined,
      color: "default",
    })
  })

  it("drops edges pointing at missing nodes and duplicate node ids", () => {
    const { diagram } = sanitizeDiagram({
      nodes: [
        { id: "a", position: { x: 0, y: 0 }, data: {} },
        { id: "a", position: { x: 0, y: 0 }, data: {} },
        { id: "b", position: { x: 0, y: 0 }, data: {} },
      ],
      edges: [
        { id: "e1", source: "a", target: "b" },
        { id: "e2", source: "a", target: "ghost" },
      ],
    })

    expect(diagram.nodes.map((n) => n.id)).toEqual(["a", "b"])
    expect(diagram.edges.map((e) => e.id)).toEqual(["e1"])
  })

  it("falls back to safe defaults for bad values", () => {
    const { diagram } = sanitizeDiagram({
      nodes: [{ id: "a", type: "evilNode", position: { x: "NaN" }, data: { color: "hotpink" } }],
      edges: [],
    })

    expect(diagram.nodes[0].type).toBe("nautilusNode")
    expect(diagram.nodes[0].position).toEqual({ x: 0, y: 0 })
    expect(diagram.nodes[0].data.color).toBe("default")
  })
})
