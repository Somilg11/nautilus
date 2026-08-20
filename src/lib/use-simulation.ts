"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import {
  computeExecutionPlan,
  type ExecutionPlan,
  type SimEdge,
  type SimNode,
} from "./flow-execution"

export type SimulationStatus = "idle" | "running" | "paused" | "finished"

/** Visual state of a single node/edge during a run. */
export type SimMark = "active" | "done"

export type SimulationSpeed = 0.5 | 1 | 2 | 4

const BASE_STEP_MS = 900

export type Simulation = {
  status: SimulationStatus
  plan: ExecutionPlan | null
  /** Index of the step currently highlighted (-1 before the first step). */
  stepIndex: number
  stepCount: number
  speed: SimulationSpeed
  nodeMarks: Map<string, SimMark>
  edgeMarks: Map<string, SimMark>
  /** Non-fatal problems found while planning (cycles, dangling edges…). */
  warnings: string[]

  start: () => void
  pause: () => void
  resume: () => void
  stop: () => void
  stepForward: () => void
  setSpeed: (s: SimulationSpeed) => void
}

/**
 * Drives a step-by-step run over the current diagram.
 *
 * The run state lives entirely inside this hook — it never writes back into
 * the canvas nodes. That keeps the simulation out of undo history, out of
 * autosave, and out of exported JSON, and makes stopping a run instant.
 */
export function useSimulation(
  nodes: SimNode[],
  edges: SimEdge[],
  options?: { onError?: (message: string) => void; onWarn?: (message: string) => void }
): Simulation {
  const [status, setStatus] = useState<SimulationStatus>("idle")
  const [plan, setPlan] = useState<ExecutionPlan | null>(null)
  const [stepIndex, setStepIndex] = useState(-1)
  const [speed, setSpeed] = useState<SimulationSpeed>(1)
  const [warnings, setWarnings] = useState<string[]>([])

  const timerRef = useRef<number | null>(null)
  // Keep the latest callbacks without re-arming the timer on every render.
  const optionsRef = useRef(options)
  useEffect(() => {
    optionsRef.current = options
  })

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }, [])

  // Always tear the run down when the canvas unmounts.
  useEffect(() => clearTimer, [clearTimer])

  const stop = useCallback(() => {
    clearTimer()
    setStatus("idle")
    setStepIndex(-1)
    setPlan(null)
    setWarnings([])
  }, [clearTimer])

  const start = useCallback(() => {
    clearTimer()

    const executable = nodes.filter((n) => n.type !== "groupNode")
    if (executable.length === 0) {
      optionsRef.current?.onError?.("Nothing to run — the canvas is empty.")
      return
    }

    const nextPlan = computeExecutionPlan(nodes, edges)
    if (nextPlan.steps.length === 0) {
      optionsRef.current?.onError?.("No runnable path found.")
      return
    }

    const nextWarnings: string[] = []
    if (nextPlan.entryPoints.length === 0) {
      nextWarnings.push(
        "Every node has an incoming edge — the graph is one big cycle, so there is no entry point."
      )
    }
    if (nextPlan.cyclicNodes.length > 0) {
      nextWarnings.push(
        `${nextPlan.cyclicNodes.length} node(s) form a cycle and run in a single final step.`
      )
    }
    if (nextPlan.danglingEdges.length > 0) {
      nextWarnings.push(
        `${nextPlan.danglingEdges.length} connection(s) point at a missing node and were skipped.`
      )
    }
    if (nextPlan.isolatedNodes.length > 0) {
      nextWarnings.push(
        `${nextPlan.isolatedNodes.length} node(s) have no connections.`
      )
    }
    nextWarnings.forEach((w) => optionsRef.current?.onWarn?.(w))

    setPlan(nextPlan)
    setWarnings(nextWarnings)
    setStepIndex(0)
    setStatus("running")
  }, [nodes, edges, clearTimer])

  const pause = useCallback(() => {
    clearTimer()
    setStatus((s) => (s === "running" ? "paused" : s))
  }, [clearTimer])

  const resume = useCallback(() => {
    setStatus((s) => (s === "paused" ? "running" : s))
  }, [])

  const stepForward = useCallback(() => {
    clearTimer()
    if (!plan) return

    const next = stepIndex + 1
    if (next >= plan.steps.length) {
      setStepIndex(plan.steps.length - 1)
      setStatus("finished")
      return
    }
    setStepIndex(next)
    setStatus("paused")
  }, [plan, stepIndex, clearTimer])

  // Advance the run while it is playing.
  useEffect(() => {
    if (status !== "running" || !plan) return

    // The final step still gets a full beat on screen before the run ends.
    const isLastStep = stepIndex + 1 >= plan.steps.length

    timerRef.current = window.setTimeout(() => {
      if (isLastStep) setStatus("finished")
      else setStepIndex(stepIndex + 1)
    }, BASE_STEP_MS / speed)

    return clearTimer
  }, [status, stepIndex, plan, speed, clearTimer])

  // Marks handed to the canvas for rendering. Steps already executed stay
  // "done" so the traversal reads as a trail rather than a single blink.
  const { nodeMarks, edgeMarks } = useMemo(() => {
    const nodeMarks = new Map<string, SimMark>()
    const edgeMarks = new Map<string, SimMark>()
    if (!plan || stepIndex < 0) return { nodeMarks, edgeMarks }

    for (let i = 0; i <= stepIndex && i < plan.steps.length; i++) {
      const mark: SimMark = i === stepIndex ? "active" : "done"
      plan.steps[i].nodes.forEach((id) => nodeMarks.set(id, mark))
      plan.steps[i].edges.forEach((id) => edgeMarks.set(id, mark))
    }
    return { nodeMarks, edgeMarks }
  }, [plan, stepIndex])

  return {
    status,
    plan,
    stepIndex,
    stepCount: plan?.steps.length ?? 0,
    speed,
    nodeMarks,
    edgeMarks,
    warnings,
    start,
    pause,
    resume,
    stop,
    stepForward,
    setSpeed,
  }
}
