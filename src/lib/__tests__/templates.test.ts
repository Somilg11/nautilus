import { describe, expect, it } from "vitest"
import { AllTemplates } from "../templates"
import { sanitizeDiagram } from "../diagram-io"
import { computeExecutionPlan } from "../flow-execution"
import { simulateLoad, DEFAULT_LOAD_PARAMS } from "../simulation-model"

/**
 * Templates are the first thing most people load, and they double as the
 * reference for the JSON format — so they have to survive validation, have a
 * runnable shape, and hold capacity numbers that are actually reachable.
 */
describe("built-in templates", () => {
  it.each(AllTemplates.map((t) => [t.id, t] as const))("%s is valid and runnable", (_id, template) => {
    const { diagram, notes } = sanitizeDiagram(template)

    expect(notes).toEqual([])
    expect(diagram.nodes.length).toBe(template.nodes.length)
    expect(diagram.edges.length).toBe(template.edges.length)

    const plan = computeExecutionPlan(diagram.nodes, diagram.edges)
    expect(plan.entryPoints.length).toBeGreaterThan(0)
    expect(plan.cyclicNodes).toEqual([])
    expect(plan.isolatedNodes).toEqual([])
  })

  it.each(AllTemplates.map((t) => [t.id, t] as const))(
    "%s keeps its simulation config through validation",
    (_id, template) => {
      const { diagram } = sanitizeDiagram(template)

      // Every non-client node should declare a capacity, or the load
      // playground silently treats it as infinite.
      const missing = diagram.nodes
        .filter((n) => !String(n.data.icon ?? "").startsWith("client"))
        .filter((n) => n.data.sim?.capacity === undefined)
        .map((n) => n.data.label)

      expect(missing).toEqual([])
    }
  )

  it.each(AllTemplates.map((t) => [t.id, t] as const))(
    "%s documents every node and ships its own load defaults",
    (_id, template) => {
      const { diagram } = sanitizeDiagram(template)

      const undocumented = diagram.nodes
        .filter((n) => !n.data.description)
        .map((n) => n.data.label)
      expect(undocumented).toEqual([])

      // A template without playground defaults would load at whatever the
      // previous diagram happened to use.
      expect(diagram.sim?.requestsPerSecond).toBeGreaterThan(0)
      expect(diagram.sim?.burstFactor).toBeGreaterThanOrEqual(1)
    }
  )

  it.each(AllTemplates.map((t) => [t.id, t] as const))(
    "%s serves its rated load without saturating",
    (_id, template) => {
      const { diagram } = sanitizeDiagram(template)
      // Run each template at the load it claims to be designed for, peak
      // included — a template that cannot serve its own rated load is wrong.
      const report = simulateLoad(diagram.nodes, diagram.edges, {
        ...DEFAULT_LOAD_PARAMS,
        ...diagram.sim,
      })

      // A template that drops traffic out of the box teaches the wrong thing.
      expect(report.summary.dropped).toBe(0)

      // Only client nodes may be uncapped — they are traffic sources, not
      // services, so a capacity there would be meaningless.
      // Templates ship sized for their own rated load, so nothing should be
      // over budget or asking to be scaled out of the box.
      expect(report.summary.breachesTimeout).toBe(false)
      expect(report.summary.scaleAdvice).toEqual([])

      const uncappedServices = report.summary.unbounded.filter(
        (id) => !String(diagram.nodes.find((n) => n.id === id)?.data.icon ?? "").startsWith("client")
      )
      expect(uncappedServices).toEqual([])
    }
  )
})
