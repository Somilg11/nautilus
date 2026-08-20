import { describe, expect, it } from "vitest"
import { simulateLoad, DEFAULT_LOAD_PARAMS } from "../simulation-model"

const node = (id: string, sim?: Record<string, number>, type = "nautilusNode") => ({
  id,
  type,
  data: { label: id, sim },
})

const edge = (id: string, source: string, target: string, sim?: Record<string, number>) => ({
  id,
  source,
  target,
  data: sim ? { sim } : undefined,
})

const params = { ...DEFAULT_LOAD_PARAMS, requestsPerSecond: 1000 }

describe("simulateLoad", () => {
  it("passes traffic through a chain and reports capacity headroom", () => {
    const report = simulateLoad(
      [node("api", { capacity: 2000, latencyMs: 10 }), node("db", { capacity: 4000, latencyMs: 5 })],
      [edge("e1", "api", "db")],
      params
    )

    expect(report.metrics.api.offered).toBe(1000)
    expect(report.metrics.api.utilization).toBeCloseTo(0.5)
    expect(report.metrics.db.offered).toBe(1000)
    expect(report.summary.dropped).toBe(0)
    expect(report.summary.successRate).toBe(1)
  })

  it("sheds load past capacity and flags the bottleneck", () => {
    const report = simulateLoad(
      [node("api", { capacity: 400, latencyMs: 10 }), node("db", { capacity: 4000, latencyMs: 5 })],
      [edge("e1", "api", "db")],
      params
    )

    expect(report.metrics.api.accepted).toBe(400)
    expect(report.metrics.api.dropped).toBe(600)
    expect(report.metrics.api.status).toBe("overloaded")
    expect(report.summary.bottlenecks[0]).toBe("api")
    // 600 of the 1400 calls in the graph (1000 into the API, 400 into the DB)
    // are shed at the API.
    expect(report.summary.totalRequests).toBe(1400)
    expect(report.summary.successRate).toBeCloseTo(1 - 600 / 1400)
  })

  it("scales capacity with replicas", () => {
    const single = simulateLoad([node("api", { capacity: 500 })], [], params)
    const scaled = simulateLoad([node("api", { capacity: 500, replicas: 4 })], [], params)

    expect(single.metrics.api.dropped).toBe(500)
    expect(scaled.metrics.api.dropped).toBe(0)
    expect(scaled.metrics.api.utilization).toBeCloseTo(0.5)
  })

  it("adds queue time as utilisation rises", () => {
    const light = simulateLoad([node("api", { capacity: 10000, latencyMs: 20 })], [], params)
    const heavy = simulateLoad([node("api", { capacity: 1100, latencyMs: 20 })], [], params)

    expect(light.metrics.api.queueMs).toBeLessThan(3)
    expect(heavy.metrics.api.latencyMs).toBeGreaterThan(heavy.metrics.api.serviceMs * 5)
  })

  it("applies edge share and fanout", () => {
    const report = simulateLoad(
      [node("lb"), node("a"), node("b")],
      [edge("e1", "lb", "a", { share: 0.25 }), edge("e2", "lb", "b", { fanout: 2 })],
      params
    )

    expect(report.metrics.a.offered).toBeCloseTo(250)
    expect(report.metrics.b.offered).toBeCloseTo(2000)
  })

  it("reports the slowest path and whether it breaches the budget", () => {
    const report = simulateLoad(
      [
        node("client", { latencyMs: 5, capacity: 100000 }),
        node("fast", { latencyMs: 10, capacity: 100000 }),
        node("slow", { latencyMs: 300, capacity: 100000 }),
        node("db", { latencyMs: 10, capacity: 100000 }),
      ],
      [
        edge("e1", "client", "fast"),
        edge("e2", "client", "slow"),
        edge("e3", "fast", "db"),
        edge("e4", "slow", "db"),
      ],
      { ...params, timeoutMs: 200 }
    )

    expect(report.summary.criticalPath).toEqual(["client", "slow", "db"])
    expect(report.summary.breachesTimeout).toBe(true)
  })

  it("loses traffic to baseline error rates", () => {
    const report = simulateLoad(
      [node("api", { capacity: 10000, errorRate: 0.1 }), node("db", { capacity: 10000 })],
      [edge("e1", "api", "db")],
      params
    )

    expect(report.metrics.api.lossRate).toBeCloseTo(0.1)
    expect(report.metrics.db.offered).toBeCloseTo(900)
  })

  it("flags nodes with no capacity configured", () => {
    const report = simulateLoad([node("api"), node("db", { capacity: 100 })], [edge("e1", "api", "db")], params)

    expect(report.summary.unbounded).toContain("api")
    expect(report.metrics.api.dropped).toBe(0)
  })

  it("ignores group nodes and survives an empty canvas", () => {
    const grouped = simulateLoad([node("g", undefined, "groupNode")], [], params)
    expect(grouped.metrics.g).toBeUndefined()

    const empty = simulateLoad([], [], params)
    expect(empty.summary.delivered).toBe(0)
    expect(empty.summary.successRate).toBe(0)
  })

  it("splits the offered load across multiple entry points", () => {
    const report = simulateLoad(
      [node("web", { capacity: 100000 }), node("mobile", { capacity: 100000 }), node("api", { capacity: 100000 })],
      [edge("e1", "web", "api"), edge("e2", "mobile", "api")],
      params
    )

    expect(report.metrics.web.offered).toBe(500)
    expect(report.metrics.mobile.offered).toBe(500)
    expect(report.metrics.api.offered).toBe(1000)
  })
})
