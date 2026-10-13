import { memo, useEffect } from "react"
import { useStore, useStoreApi } from "reactflow"
import { EDGE_COLORS, markerIdFor } from "@/lib/canvas-decorate"

/** Below this zoom the request badges are too small to read, so they are not drawn. */
const BADGE_MIN_ZOOM = 0.3

/**
 * Canvas-wide SVG definitions and zoom-dependent detail.
 *
 * Rendered once inside <ReactFlow>: one arrowhead per edge colour, shared by
 * every connection, and a class on the canvas root that hides the request
 * badges when zoomed far out. Both live here so neither costs a canvas
 * re-render.
 */
function FlowMarkers() {
  const far = useStore((s) => s.transform[2] < BADGE_MIN_ZOOM)
  const store = useStoreApi()

  useEffect(() => {
    store.getState().domNode?.classList.toggle("canvas-far", far)
  }, [far, store])

  return (
    <svg className="pointer-events-none absolute h-0 w-0" aria-hidden="true">
      <defs>
        {EDGE_COLORS.map((color) => (
          <marker
            key={color}
            id={markerIdFor(color)}
            markerWidth="20"
            markerHeight="20"
            viewBox="-10 -10 20 20"
            markerUnits="userSpaceOnUse"
            orient="auto-start-reverse"
            refX="0"
            refY="0"
          >
            <polyline
              points="-6,-4.5 0,0 -6,4.5 -6,-4.5"
              fill={color}
              stroke={color}
              strokeWidth="1"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </marker>
        ))}
      </defs>
    </svg>
  )
}

export default memo(FlowMarkers)
