import { describe, expect, it } from "vitest"
import {
  capacityReport,
  simulateLoad,
  sweepLoad,
  DEFAULT_LOAD_PARAMS,
} from "../simulation-model"

const node = (id: string, sim?: Record<string, number | boolean>, type = "nautilusNode") => ({
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

  it("reports a p95 above the mean for every hop and path", () => {
    const report = simulateLoad(
      [node("a", { capacity: 100000, latencyMs: 20 }), node("b", { capacity: 100000, latencyMs: 30 })],
      [edge("e1", "a", "b")],
      params
    )

    // Exponential service time: p95 of one hop is ln(20) ≈ 3x its mean.
    expect(report.metrics.a.p95Ms).toBeCloseTo(report.metrics.a.latencyMs * Math.log(20), 3)

    // Along a path the hops combine, so the p95 sits above the summed mean
    // but well below the sum of the per-hop p95s.
    const meanPath = report.metrics.b.cumulativeMs
    expect(report.metrics.b.cumulativeP95Ms).toBeGreaterThan(meanPath)
    expect(report.metrics.b.cumulativeP95Ms).toBeLessThan(
      report.metrics.a.p95Ms + report.metrics.b.p95Ms
    )
    expect(report.summary.criticalPathP95Ms).toBeCloseTo(report.metrics.b.cumulativeP95Ms)
  })

  it("times out on the p95, not the mean", () => {
    const report = simulateLoad(
      [node("api", { capacity: 100000, latencyMs: 100 })],
      [],
      { ...params, timeoutMs: 150 }
    )

    expect(report.summary.criticalPathMs).toBeLessThan(150)
    expect(report.summary.breachesTimeout).toBe(true)
  })

  it("takes a node out when failure is injected", () => {
    const report = simulateLoad(
      [
        node("api", { capacity: 10000, latencyMs: 10 }),
        node("cache", { capacity: 10000, down: true }),
        node("db", { capacity: 10000 }),
      ],
      [edge("e1", "api", "cache"), edge("e2", "cache", "db")],
      params
    )

    expect(report.metrics.cache.status).toBe("down")
    expect(report.metrics.cache.accepted).toBe(0)
    expect(report.metrics.cache.dropped).toBe(1000)
    // Nothing survives the dead hop.
    expect(report.metrics.db.offered).toBe(0)
    expect(report.summary.downNodes).toEqual(["cache"])
    expect(report.summary.successRate).toBeLessThan(1)
  })

  it("sizes replicas against the target utilisation", () => {
    const report = simulateLoad(
      [node("api", { capacity: 500, replicas: 1, latencyMs: 10 })],
      [],
      { ...params, targetUtilization: 0.7 }
    )

    // 1000 req/s at 70% of a 500 req/s instance needs three instances.
    expect(report.metrics.api.requiredReplicas).toBe(3)
    expect(report.summary.scaleAdvice).toEqual([
      { id: "api", label: "api", current: 1, required: 3 },
    ])
  })

  it("sizes downstream nodes against real demand, not throttled traffic", () => {
    // The gateway sheds 60% of the load, so the service only sees 400 req/s —
    // but it still has to be sized for the 1000 req/s the design implies.
    const report = simulateLoad(
      [
        node("gateway", { capacity: 400, replicas: 1 }),
        node("service", { capacity: 250, replicas: 1 }),
      ],
      [edge("e1", "gateway", "service")],
      { ...params, targetUtilization: 1 }
    )

    expect(report.metrics.service.offered).toBe(400)
    expect(report.metrics.service.demand).toBe(1000)
    expect(report.metrics.service.requiredReplicas).toBe(4)
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

describe("queues, caches, cost and burst", () => {
  it("lets a queue build a backlog instead of dropping", () => {
    const report = simulateLoad(
      [node("q", { capacity: 400, queue: true }), node("worker", { capacity: 10000 })],
      [edge("e1", "q", "worker")],
      params
    )

    expect(report.metrics.q.dropped).toBe(0)
    expect(report.metrics.q.backlogRate).toBe(600)
    expect(report.metrics.q.status).toBe("backlog")
    expect(report.summary.backlogNodes).toEqual(["q"])
    // Nothing was lost, so the served share stays clean.
    expect(report.summary.successRate).toBe(1)
  })

  it("treats well-known queue icons as buffers without configuration", () => {
    const kafka = { id: "k", type: "nautilusNode", data: { label: "Kafka", icon: "kafka", sim: { capacity: 100 } } }
    const report = simulateLoad([kafka], [], params)

    expect(report.metrics.k.buffers).toBe(true)
    expect(report.metrics.k.dropped).toBe(0)
    expect(report.metrics.k.backlogRate).toBe(900)
  })

  it("shields a backing store by the cache hit ratio", () => {
    const report = simulateLoad(
      [node("cache", { capacity: 100000, hitRate: 0.9 }), node("db", { capacity: 100000 })],
      [edge("e1", "cache", "db")],
      params
    )

    // Only the 10% of requests that miss continue downstream.
    expect(report.metrics.db.offered).toBeCloseTo(100)
  })

  it("prices the design per month and per million requests", () => {
    const report = simulateLoad(
      [node("api", { capacity: 2000, replicas: 3, costPerHour: 0.1 })],
      [],
      params
    )

    // 3 replicas x $0.10 x 730 hours.
    expect(report.metrics.api.monthlyCost).toBeCloseTo(219)
    expect(report.summary.monthlyCost).toBeCloseTo(219)
    expect(report.summary.costPerMillionRequests).toBeGreaterThan(0)
  })

  it("projects the cost of applying the capacity plan", () => {
    const report = simulateLoad(
      [node("api", { capacity: 200, replicas: 1, costPerHour: 0.1 })],
      [],
      { ...params, targetUtilization: 1 }
    )

    expect(report.metrics.api.requiredReplicas).toBe(5)
    expect(report.summary.projectedMonthlyCost).toBeCloseTo(365)
    expect(report.summary.projectedMonthlyCost).toBeGreaterThan(report.summary.monthlyCost)
  })

  it("sizes for the peak, not the average", () => {
    const flat = simulateLoad([node("api", { capacity: 1500 })], [], params)
    const bursty = simulateLoad([node("api", { capacity: 1500 })], [], { ...params, burstFactor: 2 })

    expect(flat.metrics.api.dropped).toBe(0)
    expect(bursty.metrics.api.offered).toBe(2000)
    expect(bursty.metrics.api.dropped).toBe(500)
  })
})

describe("sweepLoad", () => {
  it("finds the knee where the design stops keeping up", () => {
    const result = sweepLoad(
      [node("api", { capacity: 1000, latencyMs: 5 })],
      [],
      params,
      { maxRps: 2000, samples: 20 }
    )

    expect(result.points).toHaveLength(20)
    expect(result.safeRps).toBeLessThanOrEqual(1000)
    expect(result.kneeRps).not.toBeNull()
    expect(result.kneeRps!).toBeGreaterThan(1000)
    // Delivered throughput plateaus at capacity.
    expect(result.points.at(-1)!.delivered).toBeCloseTo(1000, 0)
  })

  it("reports no knee for a design that survives the sweep", () => {
    const result = sweepLoad([node("api", { capacity: 1000000 })], [], params, { maxRps: 5000 })

    expect(result.kneeRps).toBeNull()
    expect(result.safeRps).toBe(5000)
  })
})

describe("capacityReport", () => {
  it("renders a Markdown summary with the parts a review needs", () => {
    const report = simulateLoad(
      [node("api", { capacity: 400, replicas: 1, costPerHour: 0.2 }), node("db", { capacity: 10000 })],
      [edge("e1", "api", "db")],
      params
    )

    const md = capacityReport(report, "Payments")

    expect(md).toContain("## Capacity report — Payments")
    expect(md).toContain("Requests served")
    expect(md).toContain("### Bottlenecks")
    expect(md).toContain("### Capacity plan")
    expect(md).toContain("Monthly cost")
  })
})

describe("async hand-offs", () => {
  const queueNode = {
    id: "q",
    type: "nautilusNode",
    data: { label: "Queue", icon: "kafka", sim: { capacity: 100000, latencyMs: 5 } },
  }

  it("keeps queue consumers off the request path", () => {
    const report = simulateLoad(
      [
        node("api", { capacity: 100000, latencyMs: 20 }),
        queueNode,
        node("worker", { capacity: 100000, latencyMs: 2000 }),
      ],
      [edge("e1", "api", "q"), edge("e2", "q", "worker")],
      { ...params, timeoutMs: 500 }
    )

    // The caller's request ends when the message is published.
    expect(report.summary.criticalPath).toEqual(["api"])
    expect(report.summary.breachesTimeout).toBe(false)

    // The slow consumer is reported as a background pipeline instead.
    expect(report.summary.pipelinePath).toEqual(["q", "worker"])
    expect(report.summary.pipelineP95Ms).toBeGreaterThan(2000)
  })

  it("still delivers traffic across the hand-off", () => {
    const report = simulateLoad(
      [node("api", { capacity: 100000 }), queueNode, node("worker", { capacity: 100000 })],
      [edge("e1", "api", "q"), edge("e2", "q", "worker")],
      params
    )

    expect(report.metrics.worker.offered).toBeCloseTo(1000)
  })

  it("honours an explicit async flag on any edge", () => {
    const report = simulateLoad(
      [node("api", { capacity: 100000, latencyMs: 10 }), node("audit", { capacity: 100000, latencyMs: 5000 })],
      [{ id: "e1", source: "api", target: "audit", data: { sim: { async: true } } }],
      { ...params, timeoutMs: 100 }
    )

    expect(report.summary.criticalPath).toEqual(["api"])
    expect(report.summary.breachesTimeout).toBe(false)
    expect(report.summary.pipelinePath).toEqual(["audit"])
  })
})

describe("who initiates a call", () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const flowEdge = (id: string, source: string, target: string, flow: any, sim?: any) => ({
    id,
    source,
    target,
    data: { flow, sim },
  })

  it("leaves what a slow consumer cannot pull in the queue, instead of dropping it", () => {
    const kafka = { id: "q", type: "nautilusNode", data: { label: "q", icon: "kafka", sim: { capacity: 100000 } } }
    const report = simulateLoad(
      [node("api", { capacity: 100000 }), kafka, node("worker", { capacity: 300 })],
      [edge("e1", "api", "q"), edge("e2", "q", "worker")],
      params
    )

    // 1000 msg/s arrive, the consumer takes 300 — the other 700 are lag.
    expect(report.metrics.worker.dropped).toBe(0)
    expect(report.metrics.worker.accepted).toBe(300)
    expect(report.metrics.worker.lagRate).toBe(700)
    expect(report.metrics.worker.status).toBe("saturated")
    expect(report.metrics.q.backlogRate).toBe(700)
    expect(report.metrics.q.status).toBe("backlog")
    expect(report.edges.e2.lagRate).toBe(700)
    expect(report.summary.dropped).toBe(0)
    expect(report.summary.backlogNodes).toEqual(["q"])
    // It still needs four consumers to keep up.
    expect(report.metrics.worker.requiredReplicas).toBe(Math.ceil(1000 / (300 * 0.7)))
  })

  it("only forwards what a queue can actually serve", () => {
    const report = simulateLoad(
      [node("q", { capacity: 400, queue: true }), node("worker", { capacity: 10000 })],
      [edge("e1", "q", "worker")],
      params
    )

    expect(report.metrics.q.backlogRate).toBe(600)
    expect(report.metrics.worker.offered).toBe(400)
  })

  it("runs a cron job at its own rate, independent of user traffic", () => {
    const cron = node("cleanup", { capacity: 1000, schedule: { kind: "cron", everyMs: 1000, batch: 50 } } as never)
    const graph = [node("client"), node("api", { capacity: 100000 }), cron, node("db", { capacity: 100000 })]
    const edges = [edge("e1", "client", "api"), edge("e2", "api", "db"), edge("e3", "cleanup", "db")]

    const report = simulateLoad(graph, edges, params)

    // The job is not an entry point, so it takes none of the offered load…
    expect(report.metrics.client.offered).toBe(1000)
    expect(report.metrics.cleanup.offered).toBe(50)
    expect(report.metrics.cleanup.scheduledRate).toBe(50)
    // …and the database sees both.
    expect(report.metrics.db.offered).toBe(1050)
    expect(report.summary.scheduledLoad).toBe(50)

    // With no users at all, the job keeps running.
    const idle = simulateLoad(graph, edges, { ...params, requestsPerSecond: 0 })
    expect(idle.metrics.db.offered).toBe(50)
  })

  it("scales a worker loop with its replicas without asking for more because of it", () => {
    const worker = node("w", {
      capacity: 10,
      replicas: 4,
      schedule: { kind: "worker", everyMs: 100 },
    } as never)
    const report = simulateLoad([worker, node("db", { capacity: 1000 })], [edge("e1", "w", "db")], params)

    // Four replicas, ten loops a second each.
    expect(report.metrics.w.offered).toBe(40)
    expect(report.metrics.db.offered).toBe(40)
    // Adding replicas would add the same load again, so none is suggested.
    expect(report.summary.scaleAdvice).toEqual([])
  })

  it("polls on a timer from every replica, whatever the source is serving", () => {
    const report = simulateLoad(
      [
        node("client"),
        node("api", { capacity: 100000, replicas: 5 }),
        node("config", { capacity: 1000 }),
      ],
      [edge("e1", "client", "api"), flowEdge("poll", "api", "config", { op: "POLL", intervalMs: 500 })],
      params
    )

    // 5 replicas × 2 polls per second — not the 1000 req/s passing through.
    expect(report.metrics.config.offered).toBe(10)
    expect(report.edges.poll.rate).toBe(10)
    expect(report.edges.poll.mode).toBe("poll")
    // Nobody's request waits on a background poll.
    expect(report.summary.criticalPath).toEqual(["client", "api"])
  })

  it("stops polling when the poller is down", () => {
    const report = simulateLoad(
      [node("watcher", { capacity: 100, down: true }), node("db", { capacity: 1000 })],
      [flowEdge("poll", "watcher", "db", { op: "POLL", intervalMs: 1000 })],
      params
    )

    expect(report.metrics.db.offered).toBe(0)
  })

  it("does not send user traffic into a pure poller", () => {
    const report = simulateLoad(
      [node("client"), node("api", { capacity: 100000 }), node("watcher", { capacity: 100 })],
      [edge("e1", "client", "api"), flowEdge("poll", "watcher", "api", { op: "POLL", intervalMs: 1000 })],
      params
    )

    expect(report.metrics.client.offered).toBe(1000)
    expect(report.metrics.watcher.offered).toBe(0)
    expect(report.metrics.api.offered).toBe(1001)
  })

  it("reports how long each call takes, including what the target waits on", () => {
    const report = simulateLoad(
      [
        node("api", { capacity: 1000000, latencyMs: 10 }),
        node("svc", { capacity: 1000000, latencyMs: 20 }),
        node("db", { capacity: 1000000, latencyMs: 30 }),
        { id: "q", type: "nautilusNode", data: { label: "q", icon: "kafka", sim: { capacity: 1000000, latencyMs: 2 } } },
        node("slow", { capacity: 1000000, latencyMs: 5000 }),
      ],
      [
        flowEdge("call", "api", "svc", { op: "GET", path: "/x", timeoutMs: 40 }),
        edge("query", "svc", "db"),
        edge("publish", "svc", "q"),
        edge("consume", "q", "slow"),
      ],
      params
    )

    // api waits for svc, and svc waits for db — but not for the consumer.
    expect(report.edges.call.responseMs).toBeCloseTo(50, 0)
    expect(report.edges.query.responseMs).toBeCloseTo(30, 0)
    // A publish only waits for the broker.
    expect(report.edges.publish.responseMs).toBeCloseTo(2, 0)

    expect(report.edges.call.timedOut).toBe(true)
    expect(report.summary.slowCalls).toEqual(["call"])
    expect(capacityReport(report)).toContain("Calls over their timeout")
  })
})

describe("compiled graph", () => {
  it("gives the same answer when reused across loads", async () => {
    const { compileGraph, runCompiled } = await import("../simulation-model")
    const nodes = [node("api", { capacity: 400, latencyMs: 10 }), node("db", { capacity: 4000 })]
    const edges = [edge("e1", "api", "db")]

    const compiled = compileGraph(nodes, edges)
    for (const rps of [100, 1000, 100, 5000]) {
      const p = { ...params, requestsPerSecond: rps }
      expect(runCompiled(compiled, p)).toEqual(simulateLoad(nodes, edges, p))
    }
  })

  it("stays linear on a large diagram", async () => {
    const { compileGraph, sweepCompiled } = await import("../simulation-model")
    const count = 2000
    const nodes = Array.from({ length: count }, (_, i) => node(`n${i}`, { capacity: 5000, latencyMs: 1 }))
    // A long chain with a cross link every few nodes: 2000 nodes, ~2600 edges.
    const edges = [
      ...Array.from({ length: count - 1 }, (_, i) => edge(`c${i}`, `n${i}`, `n${i + 1}`)),
      ...Array.from({ length: 600 }, (_, i) => edge(`x${i}`, `n${i * 3}`, `n${i * 3 + 7}`, { share: 0.01 })),
    ]

    const started = performance.now()
    const compiled = compileGraph(nodes, edges)
    const ramp = sweepCompiled(compiled, params, { maxRps: 10000 })
    const elapsed = performance.now() - started

    expect(ramp.points).toHaveLength(24)
    // Generous bound: this takes a few tens of ms; quadratic would take seconds.
    expect(elapsed).toBeLessThan(1500)
  })
})
