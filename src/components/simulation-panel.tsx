"use client"

import { useState } from "react"
import {
  AlertTriangle,
  Gauge,
  Pause,
  Play,
  SkipForward,
  Square,
  X,
  Zap,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

import type { Simulation, SimulationSpeed } from "@/lib/use-simulation"
import {
  formatMs,
  formatRate,
  type LoadParams,
  type SimulationReport,
} from "@/lib/simulation-model"

const SPEEDS: SimulationSpeed[] = [0.5, 1, 2, 4]

const LOAD_PRESETS: { label: string; rps: number }[] = [
  { label: "100/s", rps: 100 },
  { label: "1k/s", rps: 1000 },
  { label: "10k/s", rps: 10_000 },
  { label: "100k/s", rps: 100_000 },
]

export type LoadController = {
  enabled: boolean
  params: LoadParams
  setParams: (next: LoadParams) => void
  report: SimulationReport | null
  disable: () => void
  focusNode: (id: string) => void
}

/**
 * Bottom-of-canvas control surface for both simulators:
 * "Trace" walks the graph step by step, "Load" pushes traffic through it.
 */
export default function SimulationPanel({
  sim,
  load,
}: {
  sim: Simulation
  load: LoadController
}) {
  const traceActive = sim.status !== "idle"
  const [tab, setTab] = useState<"trace" | "load">("trace")

  if (!traceActive && !load.enabled) return null

  // Follow whichever simulator the user just started.
  const activeTab = traceActive && !load.enabled ? "trace" : load.enabled && !traceActive ? "load" : tab

  return (
    <div className="absolute bottom-4 left-1/2 z-10 w-[min(94vw,680px)] -translate-x-1/2 rounded-xl border bg-background/95 shadow-lg backdrop-blur">
      <Tabs value={activeTab} onValueChange={(v) => setTab(v as "trace" | "load")}>
        <div className="flex items-center gap-2 border-b px-3 py-2">
          <TabsList className="h-7">
            <TabsTrigger value="trace" className="h-6 gap-1.5 px-2 text-[12px]" disabled={!traceActive}>
              <Zap className="h-3 w-3" /> Trace
            </TabsTrigger>
            <TabsTrigger value="load" className="h-6 gap-1.5 px-2 text-[12px]" disabled={!load.enabled}>
              <Gauge className="h-3 w-3" /> Load
            </TabsTrigger>
          </TabsList>

          <div className="ml-auto flex items-center gap-1.5">
            {load.enabled && load.report && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge variant={load.report.summary.successRate > 0.999 ? "success" : "warning"}>
                    {(load.report.summary.successRate * 100).toFixed(1)}% served
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  Share of all {formatRate(load.report.summary.totalRequests)} calls —
                  internal hops included — that were served rather than shed
                </TooltipContent>
              </Tooltip>
            )}
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7"
              aria-label="Close simulation panel"
              onClick={() => {
                sim.stop()
                load.disable()
              }}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {/* ---------------- TRACE ---------------- */}
        <TabsContent value="trace" className="m-0 p-3">
          <TraceControls sim={sim} />
        </TabsContent>

        {/* ---------------- LOAD ---------------- */}
        <TabsContent value="load" className="m-0 p-3">
          <LoadControls load={load} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

/* ------------------------------------------------------------------ */

function TraceControls({ sim }: { sim: Simulation }) {
  const current = sim.plan?.steps[sim.stepIndex]
  const label =
    sim.status === "finished"
      ? "Run complete"
      : current?.cyclic
        ? "Cycle — running remaining nodes together"
        : `Step ${sim.stepIndex + 1} of ${sim.stepCount} · ${current?.nodes.length ?? 0} node(s) active`

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        {sim.status === "running" ? (
          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={sim.pause} aria-label="Pause">
            <Pause className="h-4 w-4" />
          </Button>
        ) : (
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8"
            onClick={sim.status === "finished" ? sim.start : sim.resume}
            aria-label={sim.status === "finished" ? "Run again" : "Resume"}
          >
            <Play className="h-4 w-4" />
          </Button>
        )}

        <Button
          size="icon"
          variant="ghost"
          className="h-8 w-8"
          onClick={sim.stepForward}
          disabled={sim.status === "finished"}
          aria-label="Step forward"
        >
          <SkipForward className="h-4 w-4" />
        </Button>

        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={sim.stop} aria-label="Stop">
          <Square className="h-4 w-4 text-destructive" />
        </Button>

        <div className="min-w-0 flex-1">
          <div className="truncate text-xs font-medium">{label}</div>
          <div className="mt-1 h-1 w-full overflow-hidden rounded bg-muted">
            <div
              className="h-full bg-primary transition-all duration-200"
              style={{
                width: `${sim.stepCount ? ((sim.stepIndex + 1) / sim.stepCount) * 100 : 0}%`,
              }}
            />
          </div>
        </div>

        <div className="flex items-center gap-1">
          {SPEEDS.map((s) => (
            <Button
              key={s}
              size="sm"
              variant={sim.speed === s ? "secondary" : "ghost"}
              className="h-7 px-2 text-xs"
              onClick={() => sim.setSpeed(s)}
              aria-label={`${s} times speed`}
            >
              {s}×
            </Button>
          ))}
        </div>
      </div>

      {sim.warnings.length > 0 && (
        <div className="space-y-1 border-t pt-2">
          {sim.warnings.map((w) => (
            <div key={w} className="flex items-start gap-2 text-[11px] text-muted-foreground">
              <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0 text-amber-500" />
              <span>{w}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ */

function LoadControls({ load }: { load: LoadController }) {
  const { params, setParams, report } = load
  const summary = report?.summary

  return (
    <div className="space-y-3">
      {/* Parameters */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Param label="Load (req/s)">
          <Input
            type="number"
            min={0}
            value={params.requestsPerSecond}
            onChange={(e) =>
              setParams({ ...params, requestsPerSecond: Math.max(0, Number(e.target.value) || 0) })
            }
            onKeyDown={(e) => e.stopPropagation()}
            className="h-7 text-[12px]"
          />
        </Param>

        <Param label="Timeout (ms)">
          <Input
            type="number"
            min={1}
            value={params.timeoutMs}
            onChange={(e) => setParams({ ...params, timeoutMs: Math.max(1, Number(e.target.value) || 1) })}
            onKeyDown={(e) => e.stopPropagation()}
            className="h-7 text-[12px]"
          />
        </Param>

        <Param label="Payload (KB)">
          <Input
            type="number"
            min={0}
            value={params.payloadKb}
            onChange={(e) => setParams({ ...params, payloadKb: Math.max(0, Number(e.target.value) || 0) })}
            onKeyDown={(e) => e.stopPropagation()}
            className="h-7 text-[12px]"
          />
        </Param>

        <Param label="Presets">
          <div className="flex gap-1">
            {LOAD_PRESETS.map((p) => (
              <Button
                key={p.label}
                size="sm"
                variant={params.requestsPerSecond === p.rps ? "secondary" : "ghost"}
                className="h-7 flex-1 px-1 text-[11px]"
                onClick={() => setParams({ ...params, requestsPerSecond: p.rps })}
              >
                {p.label}
              </Button>
            ))}
          </div>
        </Param>
      </div>

      {/* Slider for quick sweeps */}
      <input
        type="range"
        min={0}
        max={200000}
        step={100}
        value={Math.min(params.requestsPerSecond, 200000)}
        onChange={(e) => setParams({ ...params, requestsPerSecond: Number(e.target.value) })}
        aria-label="Offered load"
        className="h-1 w-full cursor-pointer appearance-none rounded bg-muted accent-primary"
      />

      {/* Results */}
      {summary && (
        <div className="space-y-2 border-t pt-2">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Stat label="Exit throughput" value={formatRate(summary.delivered)} />
            <Stat
              label="Dropped"
              value={formatRate(summary.dropped)}
              tone={summary.dropped > 0 ? "bad" : "ok"}
            />
            <Stat
              label="Slowest path"
              value={formatMs(summary.criticalPathMs)}
              tone={summary.breachesTimeout ? "bad" : "ok"}
            />
            <Stat label="Egress" value={`${summary.totalMbps.toFixed(1)} Mbps`} />
          </div>

          {summary.bottlenecks.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] text-muted-foreground">Bottlenecks</span>
              {summary.bottlenecks.slice(0, 6).map((id) => (
                <Tooltip key={id}>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => load.focusNode(id)}
                      className="rounded border border-destructive/40 bg-destructive/10 px-1.5 py-0.5 text-[11px] text-destructive transition-colors hover:bg-destructive/20"
                    >
                      {report!.metrics[id].label} ·{" "}
                      {Math.round(report!.metrics[id].utilization * 100)}%
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>Select this node</TooltipContent>
                </Tooltip>
              ))}
            </div>
          )}

          {summary.breachesTimeout && (
            <Note tone="bad">
              Slowest path {formatMs(summary.criticalPathMs)} exceeds the{" "}
              {formatMs(params.timeoutMs)} budget:{" "}
              {summary.criticalPath.map((id) => report!.metrics[id]?.label ?? id).join(" → ")}
            </Note>
          )}

          {summary.cyclic.length > 0 && (
            <Note>
              {summary.cyclic.length} node(s) sit in a cycle. Steady-state traffic
              through a loop is undefined, so their inbound load reads as zero.
            </Note>
          )}

          {summary.unbounded.length > 0 && (
            <Note>
              {summary.unbounded.length} node(s) have no capacity set and are treated as
              infinite — set one in Properties ▸ Simulation for realistic numbers.
            </Note>
          )}
        </div>
      )}
    </div>
  )
}

function Param({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="space-y-1">
      <span className="block text-[10px] font-medium uppercase tracking-wider text-muted-foreground/70">
        {label}
      </span>
      {children}
    </label>
  )
}

function Stat({
  label,
  value,
  tone = "ok",
}: {
  label: string
  value: string
  tone?: "ok" | "bad"
}) {
  return (
    <div className="rounded-md border bg-card px-2 py-1.5">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground/70">{label}</div>
      <div className={`text-[13px] font-medium ${tone === "bad" ? "text-destructive" : ""}`}>
        {value}
      </div>
    </div>
  )
}

function Note({ children, tone }: { children: React.ReactNode; tone?: "bad" }) {
  return (
    <div
      className={`flex items-start gap-2 text-[11px] ${
        tone === "bad" ? "text-destructive" : "text-muted-foreground"
      }`}
    >
      <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" />
      <span>{children}</span>
    </div>
  )
}
