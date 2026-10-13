/**
 * Web Worker entry point for the load simulation.
 *
 * Runs in a background thread of the visitor's own browser, so a sweep over a
 * large diagram never blocks dragging or typing — and never touches a server.
 */

import { createEngine, type EngineRequest, type EngineResponse } from "./sim-engine"

type WorkerScope = {
  onmessage: ((event: MessageEvent<EngineRequest>) => void) | null
  postMessage: (message: EngineResponse) => void
}

const scope = self as unknown as WorkerScope
const engine = createEngine()

scope.onmessage = (event) => {
  const response = engine.handle(event.data)
  if (response) scope.postMessage(response)
}
