"use client"

import { useEffect, useRef, useState } from "react"
import {
  createEngine,
  type EngineRequest,
  type EngineResponse,
  type EngineResult,
} from "./sim-engine"
import type { LoadParams, RampResult, SimulationReport } from "./simulation-model"
import type { SimGraph } from "./sim-graph"

export type EngineStats = {
  /** Where the last run executed. Both are local to this browser. */
  mode: "worker" | "inline"
  ms: number
  nodeCount: number
  edgeCount: number
}

export type LoadEngineState = {
  report: SimulationReport | null
  ramp: RampResult | null
  stats: EngineStats | null
}

type RunRequest = { params: LoadParams; rampMaxRps: number }

/**
 * Owns the connection to the simulation engine.
 *
 * Only one run is ever in flight. Requests that arrive meanwhile replace each
 * other, so dragging the load slider on a slow machine runs the model as fast
 * as the machine allows and no faster — it cannot build up a queue of stale
 * work behind the pointer.
 */
function createTransport(onResult: (result: EngineResult, mode: EngineStats["mode"]) => void) {
  let worker: Worker | null = null
  let inline: ReturnType<typeof createEngine> | null = null
  let disposed = false

  let seq = 0
  let inFlight = false
  let queued: RunRequest | null = null
  let lastRun: RunRequest | null = null
  let graph: SimGraph | null = null
  let timer: ReturnType<typeof setTimeout> | null = null

  function fallBackInline() {
    worker?.terminate()
    worker = null
    inline = createEngine()
    if (graph) inline.handle({ type: "graph", nodes: graph.nodes, edges: graph.edges })
    inFlight = false
    queued = null
    if (lastRun) run(lastRun)
  }

  function settle(response: EngineResponse) {
    if (disposed) return
    inFlight = false
    if (response.type === "result") onResult(response, worker ? "worker" : "inline")
    if (queued) {
      const next = queued
      queued = null
      dispatch(next)
    }
  }

  function dispatch(request: RunRequest) {
    inFlight = true
    const message: EngineRequest = { type: "run", seq: ++seq, ...request }

    if (worker) {
      worker.postMessage(message)
      return
    }

    // Still yield first, so a burst of slider events collapses into one run.
    timer = setTimeout(() => {
      timer = null
      const response = inline!.handle(message)
      if (response) settle(response)
    }, 0)
  }

  function run(request: RunRequest) {
    lastRun = request
    if (inFlight) queued = request
    else dispatch(request)
  }

  try {
    worker = new Worker(new URL("./sim-worker.ts", import.meta.url), { type: "module" })
    worker.onmessage = (event: MessageEvent<EngineResponse>) => settle(event.data)
    // A blocked or failed worker script must not leave the playground dead.
    worker.onerror = () => {
      if (!disposed) fallBackInline()
    }
  } catch {
    inline = createEngine()
  }

  return {
    setGraph(next: SimGraph) {
      graph = next
      const message: EngineRequest = { type: "graph", nodes: next.nodes, edges: next.edges }
      if (worker) worker.postMessage(message)
      else inline?.handle(message)
    },
    run,
    dispose() {
      disposed = true
      if (timer !== null) clearTimeout(timer)
      worker?.terminate()
      worker = null
    },
  }
}

const EMPTY: LoadEngineState = { report: null, ramp: null, stats: null }

/**
 * Run the load model for the current diagram, off the main thread.
 *
 * The engine only exists while the playground is open: enabling it starts a
 * worker, disabling it terminates the worker and frees its memory.
 */
export function useLoadEngine(
  enabled: boolean,
  graph: SimGraph,
  params: LoadParams
): LoadEngineState {
  const [state, setState] = useState<LoadEngineState>(EMPTY)
  const transportRef = useRef<ReturnType<typeof createTransport> | null>(null)

  useEffect(() => {
    if (!enabled) return

    const transport = createTransport((result, mode) =>
      setState({
        report: result.report,
        ramp: result.ramp,
        stats: {
          mode,
          ms: result.ms,
          nodeCount: result.nodeCount,
          edgeCount: result.edgeCount,
        },
      })
    )
    transportRef.current = transport

    return () => {
      transport.dispose()
      transportRef.current = null
      setState(EMPTY)
    }
  }, [enabled])

  // The graph crosses to the worker only when its structure changes.
  useEffect(() => {
    if (enabled) transportRef.current?.setGraph(graph)
  }, [enabled, graph])

  useEffect(() => {
    if (!enabled) return
    transportRef.current?.run({
      params,
      rampMaxRps: Math.max(1000, params.requestsPerSecond * 2),
    })
  }, [enabled, graph, params])

  return enabled ? state : EMPTY
}
