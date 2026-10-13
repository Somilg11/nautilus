import { describe, expect, it } from "vitest"
import { computeSequence, resolveFlow, scheduleRate, readSchedule } from "../flow-ops"

/* eslint-disable @typescript-eslint/no-explicit-any */

// Loosely typed on purpose: these fixtures also feed in values the real types
// forbid, to check that bad input is ignored rather than trusted.
const node = (id: string, icon?: string, sim?: Record<string, unknown>): any => ({
  id,
  type: "nautilusNode",
  data: { label: id, icon, sim },
})

const edge = (id: string, source: string, target: string, flow?: Record<string, unknown>): any => ({
  id,
  source,
  target,
  data: flow ? { flow } : undefined,
})

const sequence = (nodes: any[], edges: any[]) => computeSequence(nodes, edges)

describe("resolveFlow", () => {
  it("infers the operation from what an unlabelled edge connects", () => {
    const api = node("api", "api_server")
    const kafka = node("kafka", "kafka")
    const db = node("db", "postgres")
    const cache = node("cache", "redis")
    const worker = node("worker", "microservice")

    expect(resolveFlow(edge("e", "api", "kafka"), api, kafka).op).toBe("PUBLISH")
    expect(resolveFlow(edge("e", "kafka", "worker"), kafka, worker).op).toBe("CONSUME")
    expect(resolveFlow(edge("e", "api", "db"), api, db).op).toBe("QUERY")
    expect(resolveFlow(edge("e", "api", "cache"), api, cache).op).toBe("READ")
    expect(resolveFlow(edge("e", "api", "worker"), api, worker).op).toBe("CALL")
  })

  it("lets an explicit operation win over inference", () => {
    const api = node("api")
    const kafka = node("kafka", "kafka")
    const flow = resolveFlow(edge("e", "api", "kafka", { op: "GET", path: "/topics" }), api, kafka)

    expect(flow.op).toBe("GET")
    expect(flow.mode).toBe("sync")
    expect(flow.explicit).toBe(true)
    expect(flow.path).toBe("/topics")
  })

  it("still honours the legacy async flag", () => {
    const legacy = { id: "e", source: "a", target: "b", data: { sim: { async: true } } }
    expect(resolveFlow(legacy, node("a"), node("b")).mode).toBe("async")
  })

  it("ignores an operation it does not know", () => {
    const flow = resolveFlow(edge("e", "a", "b", { op: "TELEPORT" }), node("a"), node("b"))
    expect(flow.op).toBe("CALL")
    expect(flow.explicit).toBe(false)
  })
})

describe("schedules", () => {
  it("fires a cron once however many replicas run, and a worker once per replica", () => {
    const cron = readSchedule(node("j", "cron", { schedule: { kind: "cron", everyMs: 1000, batch: 5 } }))
    const worker = readSchedule(node("w", "worker", { schedule: { kind: "worker", everyMs: 500 } }))

    expect(scheduleRate(cron, 10)).toBe(5)
    expect(scheduleRate(worker, 10)).toBe(20)
  })

  it("rejects a schedule that would mean infinite load", () => {
    expect(readSchedule(node("j", "cron", { schedule: { kind: "cron", everyMs: 0 } }))).toBeNull()
    expect(readSchedule(node("j", "cron", { schedule: { kind: "hourly", everyMs: 10 } }))).toBeNull()
  })
})

describe("computeSequence", () => {
  it("numbers a request depth-first, in the order the calls are made", () => {
    // client → api → (auth, db), and auth has its own store.
    const { hops } = sequence(
      [node("client"), node("api"), node("auth"), node("sessions"), node("db")],
      [
        edge("e1", "client", "api"),
        edge("e2", "api", "auth"),
        edge("e3", "api", "db"),
        edge("e4", "auth", "sessions"),
      ]
    )

    // The auth call finishes — including its own lookup — before the DB call.
    expect(hops.map((h) => h.edgeId)).toEqual(["e1", "e2", "e4", "e3"])
    expect(hops.map((h) => h.step)).toEqual([1, 2, 3, 4])
    expect(hops[0].trigger).toBe("on request")
  })

  it("honours an explicit call order among siblings", () => {
    const { stepByEdge } = sequence(
      [node("api"), node("a"), node("b")],
      [edge("first-drawn", "api", "a", { order: 2 }), edge("second-drawn", "api", "b", { order: 1 })]
    )

    expect(stepByEdge.get("second-drawn")).toBe(1)
    expect(stepByEdge.get("first-drawn")).toBe(2)
  })

  it("finishes the request before following what it published", () => {
    const { hops } = sequence(
      [node("api"), node("q", "kafka"), node("worker"), node("db", "postgres"), node("mail")],
      [
        edge("publish", "api", "q"),
        edge("write", "api", "db"),
        edge("consume", "q", "worker"),
        edge("send", "worker", "mail"),
      ]
    )

    // The publish is numbered where it is issued, but the consumer only runs
    // after the request that caused it has made its remaining calls.
    expect(hops.map((h) => h.edgeId)).toEqual(["publish", "write", "consume", "send"])
    expect(hops.find((h) => h.edgeId === "consume")!.trigger).toBe("on message")
    expect(hops.find((h) => h.edgeId === "send")!.trigger).toBe("after step 1")
  })

  it("starts cron jobs and pollers after the request paths, as their own flows", () => {
    const { hops, entryPoints, selfStarting } = sequence(
      [
        node("client"),
        node("api"),
        node("db", "postgres"),
        node("cleanup", "cron", { schedule: { kind: "cron", everyMs: 300000 } }),
        node("watcher"),
      ],
      [
        edge("poll", "watcher", "db", { op: "POLL", intervalMs: 5000 }),
        edge("purge", "cleanup", "db", { op: "DELETE", path: "sessions" }),
        edge("req", "client", "api"),
        edge("query", "api", "db"),
      ]
    )

    // Only the client receives user traffic.
    expect(entryPoints).toEqual(["client"])
    expect(selfStarting.sort()).toEqual(["cleanup", "watcher"])

    expect(hops.map((h) => h.edgeId)).toEqual(["req", "query", "purge", "poll"])
    expect(hops.find((h) => h.edgeId === "purge")!.trigger).toBe("cron every 5m")
    expect(hops.find((h) => h.edgeId === "poll")!.trigger).toBe("polls every 5s")
  })

  it("numbers every edge exactly once, cycles included", () => {
    const { hops, stepByEdge } = sequence(
      [node("a"), node("b"), node("c")],
      [edge("ab", "a", "b"), edge("bc", "b", "c"), edge("ca", "c", "a")]
    )

    expect(hops).toHaveLength(3)
    expect(new Set(stepByEdge.values()).size).toBe(3)
  })

  it("skips group nodes, self-loops and dangling edges", () => {
    const { hops } = sequence(
      [node("a"), node("b"), { id: "g", type: "groupNode", data: {} }],
      [edge("ok", "a", "b"), edge("loop", "a", "a"), edge("gone", "a", "ghost"), edge("grp", "g", "b")]
    )

    expect(hops.map((h) => h.edgeId)).toEqual(["ok"])
  })

  it("survives a chain far deeper than the call stack would", () => {
    const count = 20000
    const nodes = Array.from({ length: count }, (_, i) => node(`n${i}`))
    const edges = Array.from({ length: count - 1 }, (_, i) => edge(`e${i}`, `n${i}`, `n${i + 1}`))

    const { hops } = sequence(nodes, edges)
    expect(hops).toHaveLength(count - 1)
    expect(hops.at(-1)!.step).toBe(count - 1)
  })
})
