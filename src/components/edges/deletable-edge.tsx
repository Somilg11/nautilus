import React from "react"
import { getBezierPath, EdgeProps } from "reactflow"

const foreignObjectSize = 30

export default function DeletableEdge({
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    style = {},
    markerEnd,
    selected,
    data,
}: EdgeProps) {
    const [edgePath, labelX, labelY] = getBezierPath({
        sourceX,
        sourceY,
        sourcePosition,
        targetX,
        targetY,
        targetPosition,
    })

    const onEdgeClick = (evt: React.MouseEvent, id: string) => {
        evt.stopPropagation()
        window.dispatchEvent(
            new CustomEvent("nautilus-delete-edge", { detail: { id } })
        )
    }

    // Simulation state is injected by the canvas at render time (never persisted).
    const simStatus: string | undefined = data?.__simStatus

    return (
        <>
            <path
                id={id}
                style={style}
                className={`react-flow__edge-path ${simStatus ? `sim-edge-${simStatus}` : ""}`}
                d={edgePath}
                markerEnd={markerEnd}
            />
            {/* Invisible wider path for easier selection */}
            <path
                d={edgePath}
                fill="none"
                strokeOpacity={0}
                strokeWidth={20}
                className="react-flow__edge-interaction cursor-pointer"
            />
            {selected && (
                <foreignObject
                    width={foreignObjectSize}
                    height={foreignObjectSize}
                    x={labelX - foreignObjectSize / 2}
                    y={labelY - foreignObjectSize / 2}
                    className="edgebutton-foreignobject"
                    requiredExtensions="http://www.w3.org/1999/xhtml"
                >
                    <div className="flex items-center justify-center w-full h-full">
                        <button
                            className="w-6 h-6 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center text-xs hover:bg-destructive/90 shadow-md transition-colors border border-border"
                            onClick={(event) => onEdgeClick(event, id)}
                            title="Delete Connection"
                        >
                            ✕
                        </button>
                    </div>
                </foreignObject>
            )}
        </>
    )
}
