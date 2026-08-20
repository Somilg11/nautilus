"use client"

import { useState } from "react"
import {
  AlertTriangle,
  Gauge,
  Pause,
  Play,
  Copy,
  LineChart,
  Pin,
  PinOff,
  PowerOff,
  RotateCcw,
  SkipForward,
  Square,
  TrendingUp,
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

import RampChart from "@/components/ramp-chart"
import type { Simulation, SimulationSpeed } from "@/lib/use-simulation"
import {
  formatMs,
  formatRate,
  type LoadParams,
  type RampResult,
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
  /** Sweep of the same design across a range of offered loads. */
  ramp: RampResult | null
  /** Pinned run to compare the current one against. */
  baseline: SimulationReport | null
  disable: () => void
  focusNode: (id: string) => void
  /** Set one node's replica count to the suggested value. */
  applyReplicas: (id: string, replicas: number) => void
  /** Apply every suggestion at once. */
  applyAllScaling: () => void
  /** Failure injection: take a node out, or bring it back. */
  toggleDown: (id: string) => void
  restoreAll: () => void
  pinBaseline: () => void
  clearBaseline: () => void
  copyReport: () => void
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
  const [tab, setTab] = useState<"trace" | "load" | "ramp">("trace")

  if (!traceActive && !load.enabled) return null

  // Follow whichever simulator the user just started.
  const activeTab =
    traceActive && !load.enabled
      ? "trace"
      : load.enabled && !traceActive && tab === "trace"
        ? "load"
        : tab

  return (
    <div className="absolute bottom-4 left-1/2 z-10 w-[min(94vw,680px)] -translate-x-1/2 rounded-xl border bg-background/95 shadow-lg backdrop-blur">
      <Tabs value={activeTab} onValueChange={(v) => setTab(v as "trace" | "load" | "ramp")}>
        <div className="flex items-center gap-2 border-b px-3 py-2">
          <TabsList className="h-7">
            <TabsTrigger value="trace" className="h-6 gap-1.5 px-2 text-[12px]" disabled={!traceActive}>
              <Zap className="h-3 w-3" /> Trace
            </TabsTrigger>
            <TabsTrigger value="load" className="h-6 gap-1.5 px-2 text-[12px]" disabled={!load.enabled}>
              <Gauge className="h-3 w-3" /> Load
            </TabsTrigger>
            <TabsTrigger value="ramp" className="h-6 gap-1.5 px-2 text-[12px]" disabled={!load.enabled}>
              <LineChart className="h-3 w-3" /> Ramp
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
        <TabsContent value="load" className="m-0 max-h-[52vh] overflow-y-auto overscroll-contain p-3">
          <LoadControls load={load} />
        </TabsContent>

        {/* ---------------- RAMP ---------------- */}
        <TabsContent value="ramp" className="m-0 p-3">
          <RampPanel load={load} />
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
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
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

        <Param label="Burst ×">
          <Input
            type="number"
            min={1}
            step={0.1}
            value={params.burstFactor}
            onChange={(e) =>
              setParams({ ...params, burstFactor: Math.max(1, Number(e.target.value) || 1) })
            }
            onKeyDown={(e) => e.stopPropagation()}
            className="h-7 text-[12px]"
          />
        </Param>

        <Param label="Target util (%)">
          <Input
            type="number"
            min={5}
            max={100}
            value={Math.round(params.targetUtilization * 100)}
            onChange={(e) =>
              setParams({
                ...params,
                targetUtilization: Math.min(1, Math.max(0.05, (Number(e.target.value) || 70) / 100)),
              })
            }
            onKeyDown={(e) => e.stopPropagation()}
            className="h-7 text-[12px]"
          />
        </Param>
      </div>

      <div className="flex flex-wrap items-center gap-1">
        <span className="mr-1 text-[10px] uppercase tracking-wider text-muted-foreground/70">
          Presets
        </span>
        {LOAD_PRESETS.map((p) => (
          <Button
            key={p.label}
            size="sm"
            variant={params.requestsPerSecond === p.rps ? "secondary" : "ghost"}
            className="h-6 px-2 text-[11px]"
            onClick={() => setParams({ ...params, requestsPerSecond: p.rps })}
          >
            {p.label}
          </Button>
        ))}
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
          <div className="flex items-center gap-1.5">
            <Button
              size="sm"
              variant="ghost"
              className="h-6 px-2 text-[11px]"
              onClick={load.baseline ? load.clearBaseline : load.pinBaseline}
            >
              {load.baseline ? (
                <>
                  <PinOff className="mr-1 h-3 w-3" /> Clear baseline
                </>
              ) : (
                <>
                  <Pin className="mr-1 h-3 w-3" /> Pin baseline
                </>
              )}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-6 px-2 text-[11px]"
              onClick={load.copyReport}
            >
              <Copy className="mr-1 h-3 w-3" /> Copy report
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Stat
              label="Exit throughput"
              value={formatRate(summary.delivered)}
              delta={
                load.baseline
                  ? deltaRate(summary.delivered, load.baseline.summary.delivered)
                  : undefined
              }
            />
            <Stat
              label={summary.backlogRate > 0 ? "Dropped · backlog" : "Dropped"}
              value={
                summary.backlogRate > 0
                  ? `${formatRate(summary.dropped)} · +${formatRate(summary.backlogRate)}`
                  : formatRate(summary.dropped)
              }
              tone={summary.dropped > 0 || summary.backlogRate > 0 ? "bad" : "ok"}
            />
            <Stat
              label="Slowest path (p95)"
              value={`${formatMs(summary.criticalPathP95Ms)} · avg ${formatMs(summary.criticalPathMs)}`}
              tone={summary.breachesTimeout ? "bad" : "ok"}
              delta={
                load.baseline
                  ? deltaMs(summary.criticalPathP95Ms, load.baseline.summary.criticalPathP95Ms)
                  : undefined
              }
            />
            {summary.monthlyCost > 0 ? (
              <Stat
                label="Monthly cost"
                value={money(summary.monthlyCost)}
                delta={
                  load.baseline
                    ? deltaMoney(summary.monthlyCost, load.baseline.summary.monthlyCost)
                    : undefined
                }
              />
            ) : (
              <Stat label="Egress" value={`${summary.totalMbps.toFixed(1)} Mbps`} />
            )}
          </div>

          {summary.pipelineP95Ms > 0 && (
            <div className="text-[11px] text-muted-foreground">
              Background pipeline p95 {formatMs(summary.pipelineP95Ms)} —{" "}
              {summary.pipelinePath.map((id) => report!.metrics[id]?.label ?? id).join(" → ")}
              . Nobody waits on it, so it is not checked against the timeout.
            </div>
          )}

          {summary.costPerMillionRequests !== null && (
            <div className="text-[11px] text-muted-foreground">
              ${summary.costPerMillionRequests.toFixed(3)} per million delivered requests ·{" "}
              {summary.totalMbps.toFixed(1)} Mbps egress
            </div>
          )}

          {load.baseline && (
            <BaselineDiff current={report!} baseline={load.baseline} />
          )}

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

          {summary.scaleAdvice.length > 0 && (
            <div className="space-y-1.5 rounded-md border border-primary/30 bg-primary/5 p-2">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-3.5 w-3.5 text-primary" />
                <span className="text-[11px] font-medium">
                  Capacity plan at {formatRate(params.requestsPerSecond)} ·{" "}
                  {Math.round(params.targetUtilization * 100)}% target
                </span>
                {summary.projectedMonthlyCost > summary.monthlyCost && (
                  <span className="text-[11px] text-muted-foreground">
                    {money(summary.monthlyCost)} → {money(summary.projectedMonthlyCost)}/mo
                  </span>
                )}
                <Button
                  size="sm"
                  className="ml-auto h-6 px-2 text-[11px]"
                  onClick={load.applyAllScaling}
                >
                  Apply all
                </Button>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {summary.scaleAdvice.slice(0, 8).map((a) => (
                  <button
                    key={a.id}
                    onClick={() => load.applyReplicas(a.id, a.required)}
                    title={`Set ${a.label} to ${a.required} replicas`}
                    className="rounded border bg-background px-1.5 py-0.5 text-[11px] transition-colors hover:bg-accent"
                  >
                    {a.label}{" "}
                    <span className="text-muted-foreground">
                      {a.current} → {a.required}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {summary.downNodes.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5">
              <PowerOff className="h-3.5 w-3.5 text-destructive" />
              <span className="text-[11px] text-muted-foreground">Failure injected</span>
              {summary.downNodes.map((id) => (
                <button
                  key={id}
                  onClick={() => load.toggleDown(id)}
                  title="Bring this node back"
                  className="rounded border border-destructive/40 bg-destructive/10 px-1.5 py-0.5 text-[11px] text-destructive transition-colors hover:bg-destructive/20"
                >
                  {report!.metrics[id].label}
                </button>
              ))}
              <Button
                size="sm"
                variant="ghost"
                className="h-6 px-2 text-[11px]"
                onClick={load.restoreAll}
              >
                <RotateCcw className="mr-1 h-3 w-3" /> Restore all
              </Button>
            </div>
          )}

          {summary.breachesTimeout && (
            <Note tone="bad">
              p95 of the slowest path is {formatMs(summary.criticalPathP95Ms)}, over the{" "}
              {formatMs(params.timeoutMs)} budget:{" "}
              {summary.criticalPath.map((id) => report!.metrics[id]?.label ?? id).join(" → ")}
            </Note>
          )}

          {summary.backlogNodes.length > 0 && (
            <Note>
              Buffering:{" "}
              {summary.backlogNodes
                .map((id) => `${report!.metrics[id].label} +${formatRate(report!.metrics[id].backlogRate)}`)
                .join(", ")}
              . Queues absorb the overload instead of shedding it, but the lag
              grows for as long as the load lasts.
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
  delta,
}: {
  label: string
  value: string
  tone?: "ok" | "bad"
  delta?: { text: string; good: boolean } | null
}) {
  return (
    <div className="rounded-md border bg-card px-2 py-1.5">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground/70">{label}</div>
      <div className={`text-[13px] font-medium ${tone === "bad" ? "text-destructive" : ""}`}>
        {value}
      </div>
      {delta && (
        <div
          className={`text-[10px] ${delta.good ? "text-emerald-600 dark:text-emerald-400" : "text-destructive"}`}
        >
          {delta.text}
        </div>
      )}
    </div>
  )
}

/* ---------------- formatting helpers ---------------- */

function money(value: number) {
  return `$${Math.round(value).toLocaleString("en-US")}`
}

function signed(value: number, format: (n: number) => string) {
  return `${value >= 0 ? "+" : "−"}${format(Math.abs(value))}`
}

/** Deltas are only rendered when the change is worth reading. */
function deltaRate(current: number, base: number) {
  const diff = current - base
  if (Math.abs(diff) < Math.max(1, base * 0.005)) return null
  return { text: signed(diff, formatRate), good: diff >= 0 }
}

function deltaMs(current: number, base: number) {
  const diff = current - base
  if (Math.abs(diff) < Math.max(1, base * 0.02)) return null
  return { text: signed(diff, formatMs), good: diff <= 0 }
}

function deltaMoney(current: number, base: number) {
  const diff = current - base
  if (Math.abs(diff) < 1) return null
  return { text: `${signed(diff, money)}/mo`, good: diff <= 0 }
}

/**
 * What changed since the pinned run. New bottlenecks matter more than the
 * numbers: they are the ones a tuning pass tends to create by accident.
 */
function BaselineDiff({
  current,
  baseline,
}: {
  current: SimulationReport
  baseline: SimulationReport
}) {
  const was = new Set(baseline.summary.bottlenecks)
  const now = new Set(current.summary.bottlenecks)

  const appeared = current.summary.bottlenecks.filter((id) => !was.has(id))
  const cleared = baseline.summary.bottlenecks.filter((id) => !now.has(id))

  const servedDiff =
    (current.summary.successRate - baseline.summary.successRate) * 100

  return (
    <div className="rounded-md border border-dashed px-2 py-1.5 text-[11px]">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <span className="font-medium">vs baseline</span>
        <span className={servedDiff >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-destructive"}>
          served {servedDiff >= 0 ? "+" : "−"}
          {Math.abs(servedDiff).toFixed(2)} pts
        </span>
        {appeared.length > 0 && (
          <span className="text-destructive">
            new bottleneck: {appeared.map((id) => current.metrics[id]?.label ?? id).join(", ")}
          </span>
        )}
        {cleared.length > 0 && (
          <span className="text-emerald-600 dark:text-emerald-400">
            cleared: {cleared.map((id) => baseline.metrics[id]?.label ?? id).join(", ")}
          </span>
        )}
      </div>
    </div>
  )
}

/* ---------------- ramp tab ---------------- */

function RampPanel({ load }: { load: LoadController }) {
  const { ramp, params, setParams } = load

  if (!ramp) return null

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <Stat label="Serves cleanly to" value={formatRate(ramp.safeRps)} />
        <Stat
          label="Knee"
          value={ramp.kneeRps !== null ? formatRate(ramp.kneeRps) : "not reached"}
          tone={ramp.kneeRps !== null ? "bad" : "ok"}
        />
        <Stat
          label="Timeout budget breached at"
          value={ramp.timeoutRps !== null ? formatRate(ramp.timeoutRps) : "not reached"}
          tone={ramp.timeoutRps !== null ? "bad" : "ok"}
        />
      </div>

      <RampChart
        ramp={ramp}
        currentRps={params.requestsPerSecond}
        onPick={(rps) => setParams({ ...params, requestsPerSecond: rps })}
      />

      <p className="text-[11px] text-muted-foreground">
        The sweep runs to twice the current load. Raise the load on the Load tab
        to look further out.
      </p>
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
