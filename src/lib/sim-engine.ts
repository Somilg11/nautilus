/**
 * Message-driven wrapper around the load model.
 *
 * The same engine runs in two places: inside a Web Worker (the normal case) and
 * inline on the main thread when workers are unavailable. Either way it runs on
 * the user's machine — a simulation never makes a network request.
 *
 * The graph is sent once per edit and kept compiled; a run only carries the
 * load parameters, so dragging the slider does not re-send or re-plan anything.
 */

import {
  compileGraph,
  runCompiled,
  sweepCompiled,
  type CompiledGraph,
  type EdgeLike,
  type LoadParams,
  type NodeLike,
  type RampResult,
  type SimulationReport,
} from "./simulation-model"

export type EngineRequest =
  | { type: "graph"; nodes: NodeLike[]; edges: EdgeLike[] }
  | { type: "run"; seq: number; params: LoadParams; rampMaxRps: number }

export type EngineResult = {
  type: "result"
  seq: number
  report: SimulationReport
  ramp: RampResult
  /** Wall-clock time spent on this run, ramp included. */
  ms: number
  nodeCount: number
  edgeCount: number
}

export type EngineResponse = EngineResult | { type: "error"; seq: number; message: string }

const now = () => (typeof performance !== "undefined" ? performance.now() : Date.now())

export function createEngine() {
  let compiled: CompiledGraph | null = null

  return {
    handle(request: EngineRequest): EngineResponse | null {
      if (request.type === "graph") {
        compiled = compileGraph(request.nodes, request.edges)
        return null
      }

      try {
        const graph = compiled ?? compileGraph([], [])
        const started = now()
        const report = runCompiled(graph, request.params)
        const ramp = sweepCompiled(graph, request.params, { maxRps: request.rampMaxRps })

        return {
          type: "result",
          seq: request.seq,
          report,
          ramp,
          ms: now() - started,
          nodeCount: graph.nodes.length,
          edgeCount: graph.edges.length,
        }
      } catch (err) {
        return {
          type: "error",
          seq: request.seq,
          message: err instanceof Error ? err.message : String(err),
        }
      }
    },
  }
}
