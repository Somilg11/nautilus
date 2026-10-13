"use client"

import {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
} from "@/components/ui/context-menu"

import { memo } from "react"
import { Clock, RefreshCw } from "lucide-react"
import { Handle, Position } from "reactflow"
import { NodeIcons } from "./node-icons"
import { formatInterval, type NodeSchedule } from "@/lib/flow-ops"
import { formatMs, formatRate, type NodeMetrics } from "@/lib/simulation-model"

type NautilusNodeProps = {
  id: string
  data: {
    label?: string
    description?: string
    color?: string
    icon?: string
    sim?: { schedule?: NodeSchedule }
    /** Injected at render time while a trace simulation is running. */
    __simStatus?: "active" | "done"
    /** Injected at render time while the load playground is open. */
    __metrics?: NodeMetrics
  }
}

function pickIcon(name?: string) {
  return NodeIcons[name ?? "service"] ?? NodeIcons["service"]
}

function bgFor(color?: string) {
  switch (color) {
    case "blue":
      return "bg-blue-600/80"
    case "green":
      return "bg-green-600/80"
    case "red":
      return "bg-red-600/80"
    case "yellow":
      return "bg-yellow-500/80"
    case "purple":
      return "bg-purple-600/80"
    case "orange":
      return "bg-orange-500/80"
    default:
      return "bg-zinc-700/80"
  }
}

/** Border treatment for the node's load status. */
function loadClass(metrics?: NodeMetrics) {
  switch (metrics?.status) {
    case "down":
      return "sim-node-down"
    case "overloaded":
      return "sim-node-overloaded"
    case "saturated":
      return "sim-node-saturated"
    case "backlog":
      return "sim-node-warn"
    case "warn":
      return "sim-node-warn"
    default:
      return ""
  }
}

function utilizationColor(u: number) {
  if (u > 1) return "bg-red-500"
  if (u >= 0.85) return "bg-orange-500"
  if (u >= 0.6) return "bg-amber-500"
  return "bg-emerald-500"
}

/**
 * Menu actions are sent to the canvas as events rather than run here. A node
 * that subscribed to canvas state would re-render on every change to it —
 * which, during a drag, means every node on every mouse move.
 */
function act(id: string, action: "edit" | "duplicate" | "delete") {
  window.dispatchEvent(new CustomEvent("nautilus-node-action", { detail: { id, action } }))
}

function NautilusNode({ id, data }: NautilusNodeProps) {
  const toggleFailure = () => {
    window.dispatchEvent(
      new CustomEvent("nautilus-node-failure", { detail: { id } })
    )
  }

  const schedule = data.sim?.schedule

  return (
    <ContextMenu>
      <ContextMenuTrigger>
        <div
          className={`min-w-40 max-w-xs rounded-lg overflow-hidden border shadow-sm ${
            data.__simStatus === "active"
              ? "sim-node-active"
              : data.__simStatus === "done"
                ? "sim-node-done"
                : loadClass(data.__metrics)
          }`}
        >
          {/* HEADER */}
          <div
            className={`flex items-center gap-2 px-3 py-2 text-white ${bgFor(
              data.color
            )}`}
          >
            <div className="flex items-center justify-center h-6 w-6">
              {pickIcon(data.icon)}
            </div>

            <div className="font-semibold text-sm truncate">
              {data.label || "Node"}
            </div>

            {/* Self-starting work: this node does not wait to be called. */}
            {schedule && schedule.everyMs > 0 && (
              <div
                className="ml-auto flex shrink-0 items-center gap-1 rounded bg-black/25 px-1.5 py-0.5 text-[10px] font-medium leading-none"
                title={
                  schedule.kind === "cron"
                    ? "Cron job — fires on a schedule"
                    : "Worker loop — runs continuously on every replica"
                }
              >
                {schedule.kind === "cron" ? (
                  <Clock className="h-3 w-3" />
                ) : (
                  <RefreshCw className="h-3 w-3" />
                )}
                {formatInterval(schedule.everyMs)}
              </div>
            )}
          </div>

          {/* BODY */}
          <div className="p-3 bg-card">
            {data.description ? (
              <div className="text-sm text-muted-foreground">
                {data.description}
              </div>
            ) : (
              <div className="text-sm text-muted-foreground/60">
                No description
              </div>
            )}
          </div>

          {/* LOAD METRICS (render-only, present while the playground is open) */}
          {data.__metrics && (
            <div className="border-t bg-muted/40 px-3 py-2 space-y-1.5">
              <div className="h-1 w-full overflow-hidden rounded bg-muted">
                <div
                  className={`h-full transition-all ${utilizationColor(data.__metrics.utilization)}`}
                  style={{ width: `${Math.min(100, data.__metrics.utilization * 100)}%` }}
                />
              </div>
              <div className="flex items-center justify-between gap-2 text-[10px] leading-none text-muted-foreground">
                <span className="font-medium text-foreground">
                  {data.__metrics.down
                    ? "DOWN"
                    : `${Math.round(data.__metrics.utilization * 100)}%`}
                </span>
                <span>{formatRate(data.__metrics.accepted)}</span>
                <span title="p95 / average response time">
                  p95 {formatMs(data.__metrics.p95Ms)}
                </span>
              </div>
              <div className="flex items-center justify-between gap-2 text-[10px] leading-none">
                <span className="text-muted-foreground">
                  {data.__metrics.replicas}×
                  {data.__metrics.requiredReplicas > data.__metrics.replicas && (
                    <span className="text-primary"> → {data.__metrics.requiredReplicas}×</span>
                  )}
                </span>
                {data.__metrics.dropped > 0 ? (
                  <span className="text-red-500">
                    dropping {formatRate(data.__metrics.dropped)}
                  </span>
                ) : data.__metrics.backlogRate > 0 ? (
                  <span className="text-amber-500">
                    backlog +{formatRate(data.__metrics.backlogRate)}
                  </span>
                ) : data.__metrics.lagRate > 0 ? (
                  <span className="text-amber-500">
                    lagging {formatRate(data.__metrics.lagRate)}
                  </span>
                ) : null}
              </div>
            </div>
          )}

          {/* HANDLES */}
          <Handle type="target" position={Position.Top} />
          <Handle type="source" position={Position.Bottom} />
        </div>
      </ContextMenuTrigger>

      <ContextMenuContent className="w-48">
        <ContextMenuItem onClick={() => act(id, "edit")}>Edit</ContextMenuItem>
        <ContextMenuItem onClick={() => act(id, "duplicate")}>Duplicate</ContextMenuItem>
        <ContextMenuItem onClick={toggleFailure}>
          {data.__metrics?.down ? "Restore node" : "Simulate failure"}
        </ContextMenuItem>
        <ContextMenuItem onClick={() => act(id, "delete")} className="text-red-500">
          Delete
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  )
}

export default memo(NautilusNode)
