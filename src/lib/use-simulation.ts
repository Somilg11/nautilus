"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { computeExecutionPlan } from "./flow-execution"
import type { FlowHop, FlowSequence } from "./flow-ops"
import type { SimGraph } from "./sim-graph"

export type SimulationStatus = "idle" | "running" | "paused" | "finished"

/** Visual state of a single node/edge during a run. */
export type SimMark = "active" | "done"

export type SimulationSpeed = 0.5 | 1 | 2 | 4

const BASE_STEP_MS = 900

export type Simulation = {
  status: SimulationStatus
  /** The numbered hops being replayed, frozen when the run started. */
  hops: FlowHop[]
  /** Index of the hop currently highlighted (-1 before the first one). */
  stepIndex: number
  stepCount: number
  /** The request in flight right now. */
  current: FlowHop | null
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
  stepBack: () => void
  /** Jump straight to a hop and hold there. */
  jumpTo: (index: number) => void
  setSpeed: (s: SimulationSpeed) => void
}

/**
 * Replays the diagram one request at a time, in the numbered order shown on
 * the connections.
 *
 * The run state lives entirely inside this hook — it never writes back into
 * the canvas nodes. That keeps the simulation out of undo history, out of
 * autosave, and out of exported JSON, and makes stopping a run instant.
 */
export function useSimulation(
  graph: SimGraph,
  sequence: FlowSequence,
  options?: { onError?: (message: string) => void; onWarn?: (message: string) => void }
): Simulation {
  const [status, setStatus] = useState<SimulationStatus>("idle")
  const [hops, setHops] = useState<FlowHop[]>([])
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
    setHops([])
    setWarnings([])
  }, [clearTimer])

  const start = useCallback(() => {
    clearTimer()

    const executable = graph.nodes.filter((n) => n.type !== "groupNode")
    if (executable.length === 0) {
      optionsRef.current?.onError?.("Nothing to run — the canvas is empty.")
      return
    }
    if (sequence.hops.length === 0) {
      optionsRef.current?.onError?.("Nothing to run — connect two components first.")
      return
    }

    const plan = computeExecutionPlan(graph.nodes, graph.edges)
    const nextWarnings: string[] = []
    if (sequence.entryPoints.length === 0 && sequence.selfStarting.length === 0) {
      nextWarnings.push(
        "Nothing starts this flow — every node has an incoming connection and none runs on a schedule."
      )
    }
    if (plan.cyclicNodes.length > 0) {
      nextWarnings.push(
        `${plan.cyclicNodes.length} node(s) form a cycle; each is visited once, then the loop is cut.`
      )
    }
    if (plan.isolatedNodes.length > 0) {
      nextWarnings.push(`${plan.isolatedNodes.length} node(s) have no connections.`)
    }
    nextWarnings.forEach((w) => optionsRef.current?.onWarn?.(w))

    setHops(sequence.hops)
    setWarnings(nextWarnings)
    setStepIndex(0)
    setStatus("running")
  }, [graph, sequence, clearTimer])

  const pause = useCallback(() => {
    clearTimer()
    setStatus((s) => (s === "running" ? "paused" : s))
  }, [clearTimer])

  const resume = useCallback(() => {
    setStatus((s) => (s === "paused" ? "running" : s))
  }, [])

  const stepForward = useCallback(() => {
    clearTimer()
    if (hops.length === 0) return

    const next = stepIndex + 1
    if (next >= hops.length) {
      setStepIndex(hops.length - 1)
      setStatus("finished")
      return
    }
    setStepIndex(next)
    setStatus("paused")
  }, [hops, stepIndex, clearTimer])

  const stepBack = useCallback(() => {
    clearTimer()
    if (hops.length === 0) return
    setStepIndex(Math.max(0, stepIndex - 1))
    setStatus("paused")
  }, [hops, stepIndex, clearTimer])

  const jumpTo = useCallback(
    (index: number) => {
      clearTimer()
      if (hops.length === 0) return
      setStepIndex(Math.min(hops.length - 1, Math.max(0, index)))
      setStatus("paused")
    },
    [hops, clearTimer]
  )

  // Advance the run while it is playing.
  useEffect(() => {
    if (status !== "running" || hops.length === 0) return

    // The final hop still gets a full beat on screen before the run ends.
    const isLastStep = stepIndex + 1 >= hops.length

    timerRef.current = window.setTimeout(() => {
      if (isLastStep) setStatus("finished")
      else setStepIndex(stepIndex + 1)
    }, BASE_STEP_MS / speed)

    return clearTimer
  }, [status, stepIndex, hops, speed, clearTimer])

  // Marks handed to the canvas for rendering. Hops already made stay "done"
  // so the traversal reads as a trail rather than a single blink.
  const { nodeMarks, edgeMarks } = useMemo(() => {
    const nodeMarks = new Map<string, SimMark>()
    const edgeMarks = new Map<string, SimMark>()
    if (stepIndex < 0) return { nodeMarks, edgeMarks }

    const last = Math.min(stepIndex, hops.length - 1)
    for (let i = 0; i <= last; i++) {
      const hop = hops[i]
      const mark: SimMark = i === last ? "active" : "done"
      edgeMarks.set(hop.edgeId, mark)
      // A node passed through earlier lights up again when it is called again.
      nodeMarks.set(hop.source, mark)
      nodeMarks.set(hop.target, mark)
    }
    return { nodeMarks, edgeMarks }
  }, [hops, stepIndex])

  return {
    status,
    hops,
    stepIndex,
    stepCount: hops.length,
    current: stepIndex >= 0 ? (hops[stepIndex] ?? null) : null,
    speed,
    nodeMarks,
    edgeMarks,
    warnings,
    start,
    pause,
    resume,
    stop,
    stepForward,
    stepBack,
    jumpTo,
    setSpeed,
  }
}
