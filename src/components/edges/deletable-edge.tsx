import React from "react"
import {
    getBezierPath,
    getEdgeCenter,
    EdgeProps,
    getMarkerEnd,
} from "react-flow-renderer"

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
}: EdgeProps) {
    const edgePath = getBezierPath({
        sourceX,
        sourceY,
        sourcePosition,
        targetX,
        targetY,
        targetPosition,
    })

    const [edgeCenterX, edgeCenterY] = getEdgeCenter({
        sourceX,
        sourceY,
        targetX,
        targetY,
    })

    const onEdgeClick = (evt: React.MouseEvent, id: string) => {
        evt.stopPropagation()
        window.dispatchEvent(
            new CustomEvent("nautilus-delete-edge", { detail: { id } })
        )
    }

    return (
        <>
            <path
                id={id}
                style={style}
                className="react-flow__edge-path"
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
                    x={edgeCenterX - foreignObjectSize / 2}
                    y={edgeCenterY - foreignObjectSize / 2}
                    className="edgebutton-foreignobject"
                    requiredExtensions="http://www.w3.org/1999/xhtml"
                >
                    <div
                        className="flex items-center justify-center w-full h-full"
                    // We need to stop propagation on the container too to prevent selecting the edge again?
                    // Actually we want to click the button.
                    >
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
