import { describe, expect, it } from "vitest"
import { computeExecutionPlan } from "../flow-execution"

const n = (id: string, type = "nautilusNode") => ({ id, type })
const e = (id: string, source: string, target: string) => ({ id, source, target })

describe("computeExecutionPlan", () => {
  it("groups independent branches into the same step", () => {
    // client -> (api-a, api-b) -> db
    const plan = computeExecutionPlan(
      [n("client"), n("api-a"), n("api-b"), n("db")],
      [
        e("e1", "client", "api-a"),
        e("e2", "client", "api-b"),
        e("e3", "api-a", "db"),
        e("e4", "api-b", "db"),
      ]
    )

    expect(plan.steps.map((s) => s.nodes)).toEqual([
      ["client"],
      ["api-a", "api-b"],
      ["db"],
    ])
    expect(plan.entryPoints).toEqual(["client"])
    expect(plan.exitPoints).toEqual(["db"])
  })

  it("waits for every dependency before running a node", () => {
    // a -> c, b -> c: c must not run in the same step as b
    const plan = computeExecutionPlan(
      [n("a"), n("b"), n("c")],
      [e("e1", "a", "c"), e("e2", "b", "c")]
    )
    expect(plan.steps.map((s) => s.nodes)).toEqual([["a", "b"], ["c"]])
    expect(plan.steps[1].edges.sort()).toEqual(["e1", "e2"])
  })

  it("reports cycles instead of hanging or losing nodes", () => {
    const plan = computeExecutionPlan(
      [n("a"), n("b"), n("c")],
      [e("e1", "a", "b"), e("e2", "b", "c"), e("e3", "c", "b")]
    )
    expect(plan.cyclicNodes.sort()).toEqual(["b", "c"])
    expect(plan.steps.at(-1)?.cyclic).toBe(true)
    expect(plan.order.sort()).toEqual(["a", "b", "c"])
  })

  it("skips group nodes and dangling edges", () => {
    const plan = computeExecutionPlan(
      [n("a"), n("group", "groupNode")],
      [e("e1", "a", "ghost"), e("e2", "a", "a")]
    )
    expect(plan.order).toEqual(["a"])
    expect(plan.danglingEdges.sort()).toEqual(["e1", "e2"])
  })

  it("handles an empty canvas", () => {
    const plan = computeExecutionPlan([], [])
    expect(plan.steps).toEqual([])
    expect(plan.order).toEqual([])
  })
})
