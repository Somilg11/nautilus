"use client"

import { useState } from "react"
import { formatMs, formatRate, type RampResult } from "@/lib/simulation-model"

/**
 * Load ramp curve: offered load on x, throughput on y.
 *
 * Two series, told apart by dash pattern and direct labels as well as colour —
 * a dashed neutral reference line for "everything served" and a solid line for
 * what the design actually delivers. The gap between them is shed traffic, and
 * the knee is where the design stops keeping up.
 *
 * Inline SVG rather than a chart library: no dependency, no CDN (the CSP
 * forbids one), and it inherits the theme through currentColor and tokens.
 */

const W = 640
const H = 190
const PAD = { top: 14, right: 16, bottom: 26, left: 52 }

export default function RampChart({
  ramp,
  currentRps,
  onPick,
}: {
  ramp: RampResult
  currentRps: number
  onPick: (rps: number) => void
}) {
  const [hover, setHover] = useState<number | null>(null)

  const points = ramp.points
  if (points.length === 0) return null

  const maxRps = points[points.length - 1].rps
  // Both series are requests per second, so they share one axis — never two.
  const maxY = Math.max(maxRps, ...points.map((p) => p.delivered)) || 1

  const plotW = W - PAD.left - PAD.right
  const plotH = H - PAD.top - PAD.bottom

  const x = (rps: number) => PAD.left + (rps / maxRps) * plotW
  const y = (value: number) => PAD.top + plotH - (value / maxY) * plotH

  const line = (get: (p: (typeof points)[number]) => number) =>
    points.map((p) => `${x(p.rps)},${y(get(p))}`).join(" ")

  // Shed traffic: the area between what was asked for and what came back.
  const shedArea = [
    ...points.map((p) => `${x(p.rps)},${y(Math.min(p.rps, maxY))}`),
    ...[...points].reverse().map((p) => `${x(p.rps)},${y(p.delivered)}`),
  ].join(" ")

  const active = hover !== null ? points[hover] : null
  const knee = ramp.kneeRps !== null ? points.find((p) => p.rps === ramp.kneeRps) : null

  function pickFromEvent(e: React.MouseEvent<SVGSVGElement>) {
    const rect = e.currentTarget.getBoundingClientRect()
    const ratio = (e.clientX - rect.left) / rect.width
    const index = Math.round(ratio * W - PAD.left) / plotW
    const i = Math.round(index * (points.length - 1))
    return Math.min(points.length - 1, Math.max(0, i))
  }

  return (
    <div className="space-y-2">
      {/* Legend — identity never rests on colour alone. */}
      <div className="flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <svg width="18" height="6" aria-hidden="true">
            <line
              x1="0"
              y1="3"
              x2="18"
              y2="3"
              className="stroke-muted-foreground/60"
              strokeWidth="2"
              strokeDasharray="4 3"
            />
          </svg>
          Offered
        </span>
        <span className="inline-flex items-center gap-1.5">
          <svg width="18" height="6" aria-hidden="true">
            <line x1="0" y1="3" x2="18" y2="3" className="stroke-emerald-500" strokeWidth="2" />
          </svg>
          Delivered
        </span>
        {ramp.kneeRps !== null && (
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-red-500" />
            Knee at {formatRate(ramp.kneeRps)}
          </span>
        )}
      </div>

      <div className="relative">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="w-full select-none"
          role="img"
          aria-label={`Load ramp. Serves cleanly up to ${formatRate(ramp.safeRps)}${
            ramp.kneeRps !== null ? `, knee at ${formatRate(ramp.kneeRps)}` : ""
          }.`}
          onMouseMove={(e) => setHover(pickFromEvent(e))}
          onMouseLeave={() => setHover(null)}
          onClick={(e) => onPick(points[pickFromEvent(e)].rps)}
        >
          {/* Recessive grid */}
          {[0, 0.25, 0.5, 0.75, 1].map((t) => (
            <g key={t}>
              <line
                x1={PAD.left}
                x2={W - PAD.right}
                y1={PAD.top + plotH * t}
                y2={PAD.top + plotH * t}
                className="stroke-border"
                strokeWidth="1"
              />
              <text
                x={PAD.left - 8}
                y={PAD.top + plotH * t + 3}
                textAnchor="end"
                className="fill-muted-foreground text-[9px]"
              >
                {formatRate(maxY * (1 - t))}
              </text>
            </g>
          ))}

          {/* Shed traffic */}
          <polygon points={shedArea} className="fill-red-500/15" />

          {/* Offered (reference) */}
          <polyline
            points={line((p) => Math.min(p.rps, maxY))}
            fill="none"
            className="stroke-muted-foreground/60"
            strokeWidth="2"
            strokeDasharray="4 3"
          />

          {/* Delivered */}
          <polyline
            points={line((p) => p.delivered)}
            fill="none"
            className="stroke-emerald-500"
            strokeWidth="2"
            strokeLinejoin="round"
          />

          {/* Knee marker */}
          {knee && (
            <>
              <line
                x1={x(knee.rps)}
                x2={x(knee.rps)}
                y1={PAD.top}
                y2={PAD.top + plotH}
                className="stroke-red-500/70"
                strokeWidth="1.5"
                strokeDasharray="3 3"
              />
              <circle
                cx={x(knee.rps)}
                cy={y(knee.delivered)}
                r="4"
                className="fill-red-500 stroke-background"
                strokeWidth="2"
              />
            </>
          )}

          {/* Where the slider currently sits */}
          {currentRps <= maxRps && (
            <line
              x1={x(currentRps)}
              x2={x(currentRps)}
              y1={PAD.top}
              y2={PAD.top + plotH}
              className="stroke-primary/50"
              strokeWidth="1.5"
            />
          )}

          {/* Hover crosshair */}
          {active && (
            <>
              <line
                x1={x(active.rps)}
                x2={x(active.rps)}
                y1={PAD.top}
                y2={PAD.top + plotH}
                className="stroke-foreground/30"
                strokeWidth="1"
              />
              <circle
                cx={x(active.rps)}
                cy={y(active.delivered)}
                r="4"
                className="fill-emerald-500 stroke-background"
                strokeWidth="2"
              />
            </>
          )}

          {/* X axis ends */}
          <text
            x={PAD.left}
            y={H - 8}
            className="fill-muted-foreground text-[9px]"
            textAnchor="start"
          >
            0
          </text>
          <text
            x={W - PAD.right}
            y={H - 8}
            className="fill-muted-foreground text-[9px]"
            textAnchor="end"
          >
            {formatRate(maxRps)} offered
          </text>
        </svg>

        {active && (
          <div
            className="pointer-events-none absolute top-1 rounded-md border bg-background/95 px-2 py-1 text-[11px] shadow-sm backdrop-blur"
            style={{
              left: `${(x(active.rps) / W) * 100}%`,
              transform:
                x(active.rps) > W / 2 ? "translateX(calc(-100% - 8px))" : "translateX(8px)",
            }}
          >
            <div className="font-medium">{formatRate(active.rps)} offered</div>
            <div className="text-muted-foreground">
              {formatRate(active.delivered)} delivered ·{" "}
              {(active.successRate * 100).toFixed(1)}% served
            </div>
            <div className="text-muted-foreground">p95 {formatMs(active.p95Ms)}</div>
            {active.dropped > 0 && (
              <div className="text-destructive">dropping {formatRate(active.dropped)}</div>
            )}
            {active.backlog > 0 && (
              <div className="text-amber-500">backlog +{formatRate(active.backlog)}</div>
            )}
          </div>
        )}
      </div>

      <p className="text-[11px] text-muted-foreground">
        Click anywhere on the curve to run the design at that load.
      </p>
    </div>
  )
}
