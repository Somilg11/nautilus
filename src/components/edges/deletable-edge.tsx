import React, { memo } from "react"
import { getBezierPath, EdgeProps } from "reactflow"
import { markerIdFor, type EdgeFlowView } from "@/lib/canvas-decorate"

const foreignObjectSize = 30

/** Approximate advance of the badge's 10px monospace font. */
const CHAR_WIDTH = 6.1
const BADGE_HEIGHT = 16
const STEP_PAD = 5

function onDeleteClick(evt: React.MouseEvent, id: string) {
    evt.stopPropagation()
    window.dispatchEvent(
        new CustomEvent("nautilus-delete-edge", { detail: { id } })
    )
}

/**
 * Numbered request badge: `4 GET /orders · 1.2k/s`.
 *
 * Drawn as plain SVG rather than HTML so a diagram with hundreds of
 * connections stays cheap to pan, and so it survives PNG export.
 */
function FlowBadge({ flow, x, y }: { flow: EdgeFlowView; x: number; y: number }) {
    const step = String(flow.step)
    const live = [flow.rate, flow.response].filter(Boolean).join(" · ")
    const text = [flow.op, flow.detail, live && `· ${live}`].filter(Boolean).join(" ")

    const stepWidth = step.length * CHAR_WIDTH + STEP_PAD * 2
    const textWidth = text.length * CHAR_WIDTH + STEP_PAD * 2
    const width = stepWidth + textWidth
    const left = x - width / 2
    const top = y - BADGE_HEIGHT / 2

    return (
        <g className="flow-badge" pointerEvents="none">
            <rect
                x={left}
                y={top}
                width={width}
                height={BADGE_HEIGHT}
                rx={BADGE_HEIGHT / 2}
                fill={flow.color}
                stroke={flow.slow ? "#ef4444" : flow.lagging ? "#f59e0b" : "none"}
                strokeWidth={flow.slow || flow.lagging ? 2 : 0}
            />
            {/* Darker cap behind the step number so it reads as a separate token. */}
            <path
                d={`M ${left + BADGE_HEIGHT / 2} ${top} h ${stepWidth - BADGE_HEIGHT / 2} v ${BADGE_HEIGHT} h ${-(stepWidth - BADGE_HEIGHT / 2)} a ${BADGE_HEIGHT / 2} ${BADGE_HEIGHT / 2} 0 0 1 0 ${-BADGE_HEIGHT}`}
                fill="rgba(0,0,0,0.28)"
            />
            <text
                x={left + stepWidth / 2}
                y={y}
                textAnchor="middle"
                dominantBaseline="central"
                className="flow-badge-text"
            >
                {step}
            </text>
            <text
                x={left + stepWidth + STEP_PAD}
                y={y}
                dominantBaseline="central"
                className="flow-badge-text"
            >
                {text}
            </text>
        </g>
    )
}

function DeletableEdge({
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    style = {},
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

    // Simulation state is injected by the canvas at render time (never persisted).
    const simStatus: string | undefined = data?.__simStatus
    const flow: EdgeFlowView | undefined = data?.__flow

    return (
        <>
            <path
                id={id}
                style={style}
                className={`react-flow__edge-path ${simStatus ? `sim-edge-${simStatus}` : ""}`}
                d={edgePath}
                markerEnd={
                    typeof style.stroke === "string" ? `url(#${markerIdFor(style.stroke)})` : undefined
                }
            />
            {/* Invisible wider path for easier selection */}
            <path
                d={edgePath}
                fill="none"
                strokeOpacity={0}
                strokeWidth={20}
                className="react-flow__edge-interaction cursor-pointer"
            />
            {flow && <FlowBadge flow={flow} x={labelX} y={labelY} />}
            {selected && (
                <foreignObject
                    width={foreignObjectSize}
                    height={foreignObjectSize}
                    x={labelX - foreignObjectSize / 2}
                    y={labelY + (flow ? BADGE_HEIGHT / 2 + 2 : -foreignObjectSize / 2)}
                    className="edgebutton-foreignobject"
                    requiredExtensions="http://www.w3.org/1999/xhtml"
                >
                    <div className="flex items-center justify-center w-full h-full">
                        <button
                            className="w-6 h-6 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center text-xs hover:bg-destructive/90 shadow-md transition-colors border border-border"
                            onClick={(event) => onDeleteClick(event, id)}
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

export default memo(DeletableEdge)
