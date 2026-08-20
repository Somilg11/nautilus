/* eslint-disable @typescript-eslint/no-explicit-any */
import { computeExecutionPlan } from "./flow-execution"

const COLUMN_GAP = 260
const ROW_GAP = 170
const TOP = 40
const LEFT = 120

/**
 * Position nodes on a top-to-bottom layered grid derived from the graph's
 * dependency order: each execution step becomes a row, and nodes inside a step
 * are spread across that row.
 *
 * Used for AI-generated diagrams, which arrive without coordinates. Without it
 * every node lands in a single vertical column and edges overlap.
 */
export function autoLayout<T extends { id: string; position?: { x: number; y: number } }>(
  nodes: T[],
  edges: { source: string; target: string }[]
): T[] {
  if (nodes.length === 0) return nodes

  const plan = computeExecutionPlan(nodes as any, edges as any)
  const placed = new Map<string, { x: number; y: number }>()

  plan.steps.forEach((step, row) => {
    const width = (step.nodes.length - 1) * COLUMN_GAP
    step.nodes.forEach((id, i) => {
      placed.set(id, {
        x: LEFT + i * COLUMN_GAP - width / 2,
        y: TOP + row * ROW_GAP,
      })
    })
  })

  // Anything the planner did not reach (shouldn't happen, but stay safe).
  let extra = 0
  return nodes.map((n) => {
    const pos =
      placed.get(n.id) ??
      { x: LEFT + extra++ * COLUMN_GAP, y: TOP + plan.steps.length * ROW_GAP }
    return { ...n, position: pos }
  })
}
