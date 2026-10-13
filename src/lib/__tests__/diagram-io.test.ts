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

describe("round trip", () => {
  it("preserves the whole simulation model through export and import", () => {
    // Exactly what the toolbar writes to a .json file.
    const exported = {
      name: "Payments",
      nodes: [
        {
          id: "api",
          type: "nautilusNode",
          position: { x: 10, y: 20 },
          data: {
            label: "API",
            icon: "api_server",
            color: "green",
            description: "Public surface",
            sim: {
              capacity: 4000,
              replicas: 6,
              latencyMs: 25,
              errorRate: 0.001,
              costPerHour: 0.12,
              down: true,
            },
          },
        },
        {
          id: "cache",
          type: "nautilusNode",
          position: { x: 10, y: 200 },
          data: { label: "Cache", icon: "redis", sim: { capacity: 120000, hitRate: 0.9 } },
        },
      ],
      edges: [
        {
          id: "e1",
          source: "api",
          target: "cache",
          type: "deletableEdge",
          data: { sim: { share: 0.15, fanout: 2 } },
        },
      ],
      sim: {
        requestsPerSecond: 10000,
        timeoutMs: 250,
        payloadKb: 16,
        targetUtilization: 0.6,
        burstFactor: 2,
      },
    }

    const { diagram, notes } = sanitizeDiagram(exported)

    expect(notes).toEqual([])
    expect(diagram.nodes[0].data.sim).toEqual({
      capacity: 4000,
      replicas: 6,
      latencyMs: 25,
      errorRate: 0.001,
      costPerHour: 0.12,
      down: true,
    })
    expect(diagram.nodes[1].data.sim).toEqual({ capacity: 120000, hitRate: 0.9 })
    expect(diagram.edges[0].data).toEqual({ sim: { share: 0.15, fanout: 2 } })
    expect(diagram.sim).toEqual(exported.sim)

    // Re-importing what we just produced must be a fixed point.
    const again = sanitizeDiagram(diagram)
    expect(again.diagram).toEqual(diagram)
  })

  it("rejects nonsense in the playground parameters", () => {
    const { diagram } = sanitizeDiagram({
      nodes: [],
      edges: [],
      sim: { requestsPerSecond: -5, timeoutMs: 0, burstFactor: "fast", targetUtilization: 0.5 },
    })

    expect(diagram.sim).toEqual({ targetUtilization: 0.5 })
  })

  it("keeps valid request and schedule settings and drops the rest", () => {
    const { diagram } = sanitizeDiagram({
      nodes: [
        {
          id: "job",
          data: {
            label: "Job",
            sim: { schedule: { kind: "cron", everyMs: 60000, batch: 10, command: "rm -rf" } },
          },
        },
        // An interval of zero would mean infinite load.
        { id: "bad", data: { label: "Bad", sim: { schedule: { kind: "cron", everyMs: 0 } } } },
        { id: "db", data: { label: "DB" } },
      ],
      edges: [
        {
          id: "e1",
          source: "job",
          target: "db",
          data: {
            flow: { op: "POLL", path: "orders", intervalMs: 5000, timeoutMs: 800, order: 2, script: "x" },
            sim: { share: 0.5 },
          },
        },
        { id: "e2", source: "bad", target: "db", data: { flow: { op: "TELEPORT", intervalMs: -1 } } },
      ],
    })

    expect(diagram.nodes[0].data.sim).toEqual({
      schedule: { kind: "cron", everyMs: 60000, batch: 10 },
    })
    expect(diagram.nodes[1].data.sim).toBeUndefined()

    expect(diagram.edges[0].data).toEqual({
      sim: { share: 0.5 },
      flow: { op: "POLL", path: "orders", intervalMs: 5000, timeoutMs: 800, order: 2 },
    })
    expect(diagram.edges[1].data).toBeUndefined()
  })
})
