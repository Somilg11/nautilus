/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { useEffect, useState } from "react"
import type { Edge, Node } from "reactflow"
import { ArrowRight, Trash2 } from "lucide-react"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  FLOW_OPS,
  OP_META,
  DEFAULT_POLL_INTERVAL_MS,
  formatInterval,
  resolveFlow,
  type FlowOp,
} from "@/lib/flow-ops"
import { formatMs, formatRate, type EdgeMetrics } from "@/lib/simulation-model"

/** Order-insensitive comparison, so re-saving an untouched form is a no-op. */
export function sameJson(a: unknown, b: unknown) {
  return JSON.stringify(sortKeys(a)) === JSON.stringify(sortKeys(b))
}

function sortKeys(value: any): any {
  if (!value || typeof value !== "object" || Array.isArray(value)) return value
  return Object.fromEntries(
    Object.keys(value)
      .sort()
      .map((k) => [k, sortKeys(value[k])])
  )
}

function positive(text: string): number | undefined {
  const n = Number(text)
  return text !== "" && Number.isFinite(n) && n > 0 ? n : undefined
}

const numberText = (value: unknown, scale = 1) =>
  typeof value === "number" ? String(+(value * scale).toPrecision(6)) : ""

/**
 * Request details for one connection: what is sent, to where, how often and
 * how long the caller will wait. Mount with `key={edge.id}` so the form resets
 * when a different connection is selected.
 */
export default function EdgeInspector({
  edge,
  nodes,
  setEdges,
  metrics,
}: {
  edge: Edge<any>
  nodes: Node<any>[]
  setEdges: (updater: (prev: Edge<any>[]) => Edge<any>[]) => void
  metrics?: EdgeMetrics
}) {
  const source = nodes.find((n) => n.id === edge.source)
  const target = nodes.find((n) => n.id === edge.target)

  const flow = edge.data?.flow ?? {}
  const sim = edge.data?.sim ?? {}

  const [op, setOp] = useState<FlowOp | "">(flow.op ?? "")
  const [path, setPath] = useState<string>(flow.path ?? "")
  const [order, setOrder] = useState(numberText(flow.order))
  const [timeout, setTimeoutMs] = useState(numberText(flow.timeoutMs))
  const [interval, setIntervalSec] = useState(numberText(flow.intervalMs, 1 / 1000))
  const [share, setShare] = useState(numberText(sim.share, 100))
  const [fanout, setFanout] = useState(numberText(sim.fanout))

  useEffect(() => {
    const t = setTimeout(() => {
      const nextFlow: Record<string, unknown> = {}
      if (op) nextFlow.op = op
      if (path.trim()) nextFlow.path = path.trim().slice(0, 200)
      const orderNum = Number(order)
      if (order !== "" && Number.isFinite(orderNum) && orderNum >= 0) nextFlow.order = orderNum
      const timeoutNum = positive(timeout)
      if (timeoutNum) nextFlow.timeoutMs = timeoutNum
      const intervalNum = positive(interval)
      if (intervalNum) nextFlow.intervalMs = Math.max(1, intervalNum * 1000)

      setEdges((prev) => {
        let changed = false
        const next = prev.map((e) => {
          if (e.id !== edge.id) return e

          // Keep routing flags this form does not edit (legacy `async`).
          const nextSim: Record<string, unknown> = { ...(e.data?.sim ?? {}) }
          const shareNum = Number(share)
          if (share !== "" && Number.isFinite(shareNum) && shareNum >= 0) {
            nextSim.share = Math.min(1, shareNum / 100)
          } else delete nextSim.share
          const fanoutNum = Number(fanout)
          if (fanout !== "" && Number.isFinite(fanoutNum) && fanoutNum >= 0) {
            nextSim.fanout = fanoutNum
          } else delete nextSim.fanout

          const data: Record<string, unknown> = {}
          if (Object.keys(nextSim).length > 0) data.sim = nextSim
          if (Object.keys(nextFlow).length > 0) data.flow = nextFlow

          const current = { sim: e.data?.sim, flow: e.data?.flow }
          if (sameJson({ sim: data.sim, flow: data.flow }, current)) return e

          changed = true
          return { ...e, data: Object.keys(data).length > 0 ? data : undefined }
        })
        return changed ? next : prev
      })
    }, 200)

    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [op, path, order, timeout, interval, share, fanout])

  // What the canvas will show: the chosen operation, or the inferred one.
  const resolved = resolveFlow(
    { ...edge, data: { ...edge.data, flow: { ...flow, op: op || undefined } } } as any,
    source as any,
    target as any
  )
  const meta = OP_META[resolved.op]
  const sourceLabel = source?.data?.label || "Source"
  const targetLabel = target?.data?.label || "Target"

  const pollMs = positive(interval) ? positive(interval)! * 1000 : DEFAULT_POLL_INTERVAL_MS
  const replicas = Math.max(1, Math.floor(source?.data?.sim?.replicas ?? 1))

  const sentence =
    resolved.mode === "sync"
      ? `${sourceLabel} calls ${targetLabel} and waits for the reply.`
      : resolved.mode === "async"
        ? `${sourceLabel} hands off to ${targetLabel} and moves on — nobody waits.`
        : resolved.mode === "pull"
          ? `${targetLabel} pulls from ${sourceLabel} at its own pace; what it cannot take stays queued.`
          : `${sourceLabel} hits ${targetLabel} every ${formatInterval(pollMs)}${
              replicas > 1 ? ` from each of its ${replicas} replicas` : ""
            } (${formatRate((replicas * 1000) / pollMs)}), whatever traffic it is serving.`

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2 rounded-lg border bg-muted/30 px-3 py-2 text-[13px] font-medium">
        <span className="min-w-0 truncate">{sourceLabel}</span>
        <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        <span className="min-w-0 truncate">{targetLabel}</span>
      </div>

      <Group label="Request">
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => setOp("")}
            aria-pressed={op === ""}
            title="Infer the operation from the two components"
            className={`rounded border px-1.5 py-0.5 font-mono text-[10px] font-semibold transition-opacity ${
              op === "" ? "ring-2 ring-primary ring-offset-1 ring-offset-background" : "opacity-60 hover:opacity-100"
            }`}
          >
            AUTO
          </button>
          {FLOW_OPS.map((o) => (
            <button
              key={o}
              type="button"
              onClick={() => setOp(o)}
              aria-pressed={op === o}
              title={OP_META[o].hint}
              style={{ backgroundColor: OP_META[o].color }}
              className={`rounded px-1.5 py-0.5 font-mono text-[10px] font-semibold text-white transition-opacity ${
                op === o ? "ring-2 ring-primary ring-offset-1 ring-offset-background" : "opacity-60 hover:opacity-100"
              }`}
            >
              {o}
            </button>
          ))}
        </div>
        <p className="text-[11px] leading-5 text-muted-foreground">
          <span
            className="mr-1 rounded px-1 py-px font-mono text-[10px] font-semibold text-white"
            style={{ backgroundColor: meta.color }}
          >
            {resolved.op}
          </span>
          {op === "" && "inferred · "}
          {sentence}
        </p>
      </Group>

      <Group label={resolved.mode === "async" || resolved.mode === "pull" ? "Topic / queue" : "Endpoint"}>
        <Input
          value={path}
          onChange={(e) => setPath(e.target.value)}
          onKeyDown={(e) => e.stopPropagation()}
          placeholder={
            resolved.mode === "async" || resolved.mode === "pull"
              ? "orders.created"
              : resolved.op === "QUERY" || resolved.op === "READ" || resolved.op === "WRITE"
                ? "orders"
                : "/orders/:id"
          }
          className="font-mono text-xs"
          spellCheck={false}
        />
      </Group>

      <div className="grid grid-cols-2 gap-2">
        {resolved.mode === "poll" && (
          <NumberField
            label="Poll every (s)"
            value={interval}
            onChange={setIntervalSec}
            placeholder={String(DEFAULT_POLL_INTERVAL_MS / 1000)}
          />
        )}
        <NumberField label="Timeout (ms)" value={timeout} onChange={setTimeoutMs} placeholder="none" />
        <NumberField label="Call order" value={order} onChange={setOrder} placeholder="as drawn" />
        {resolved.mode !== "poll" && (
          <NumberField label="Share of traffic (%)" value={share} onChange={setShare} placeholder="100" />
        )}
        <NumberField label="Calls per request" value={fanout} onChange={setFanout} placeholder="1" />
      </div>

      <p className="text-[11px] leading-5 text-muted-foreground">
        Call order decides the step numbers among this component&apos;s outgoing
        requests — lower runs first. Leave it blank to keep the order the
        connections were drawn in.
      </p>

      {metrics && (
        <div className="grid grid-cols-3 gap-2 rounded-lg border p-3 text-center">
          <Stat label="Rate" value={formatRate(metrics.rate)} />
          <Stat
            label={metrics.mode === "async" ? "Ack" : "Response"}
            value={formatMs(metrics.responseMs)}
          />
          <Stat label="p95" value={formatMs(metrics.responseP95Ms)} bad={metrics.timedOut} />
          {metrics.timedOut && (
            <p className="col-span-3 text-left text-[11px] text-destructive">
              The p95 is slower than the {formatMs(metrics.timeoutMs ?? 0)} timeout — a share of
              these calls will give up.
            </p>
          )}
          {metrics.lagRate > 0 && (
            <p className="col-span-3 text-left text-[11px] text-amber-600 dark:text-amber-400">
              The consumer leaves {formatRate(metrics.lagRate)} behind; the backlog grows on{" "}
              {sourceLabel}.
            </p>
          )}
        </div>
      )}

      <Button
        variant="outline"
        onClick={() =>
          window.dispatchEvent(new CustomEvent("nautilus-delete-edge", { detail: { id: edge.id } }))
        }
        className="w-full text-destructive hover:text-destructive"
      >
        <Trash2 className="mr-2 h-4 w-4" /> Delete connection
      </Button>
    </div>
  )
}

function Group({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      {children}
    </div>
  )
}

function NumberField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder: string
}) {
  return (
    <label className="space-y-1">
      <span className="block text-[10px] uppercase tracking-wider text-muted-foreground/70">
        {label}
      </span>
      <Input
        type="number"
        min={0}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => e.stopPropagation()}
        className="h-7 text-[12px]"
      />
    </label>
  )
}

function Stat({ label, value, bad }: { label: string; value: string; bad?: boolean }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground/70">{label}</div>
      <div className={`text-[12px] font-medium ${bad ? "text-destructive" : ""}`}>{value}</div>
    </div>
  )
}
