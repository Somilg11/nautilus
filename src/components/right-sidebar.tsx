/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from "@/components/ui/sheet"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"

import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  Trash2,
  Send,
  Square,
  Eye,
  EyeOff,
  ExternalLink,
  Check,
  Plus,
  Replace,
  X,
  Sparkles,
  MousePointerSquareDashed,
  KeyRound,
  RotateCcw,
  Loader2,
  Copy,
  X as XIcon,
  RotateCw,
  Gauge,
} from "lucide-react"

import { toast } from "sonner"

import { useFlow } from "@/lib/flow-context"
import {
  generateFlow,
  testProviderKey,
  DEFAULT_MODELS,
  PROVIDER_META,
  type AIProvider,
  type AIResponse,
  type ChatTurn,
} from "@/lib/ai-client"
import { autoLayout } from "@/lib/auto-layout"
import {
  formatMs,
  formatRate,
  type NodeMetrics,
  type SimulationReport,
} from "@/lib/simulation-model"
import { sanitizeDiagram, type Diagram } from "@/lib/diagram-io"
import { MarkerType } from "reactflow"

import { SiOpenai, SiGoogle, SiPlanetscale as SiGroq } from "react-icons/si"
import { SiClaude as SiAnthropic } from "react-icons/si"
import { JSX } from "react/jsx-runtime"

const PROVIDERS: AIProvider[] = ["openai", "gemini", "claude", "groq"]

const providerIcons: Record<AIProvider, JSX.Element> = {
  openai: <SiOpenai className="h-4 w-4" />,
  gemini: <SiGoogle className="h-4 w-4 text-blue-500" />,
  claude: <SiAnthropic className="h-4 w-4 text-amber-600" />,
  groq: <SiGroq className="h-4 w-4 text-orange-500" />,
}

const COLORS = [
  { id: "default", label: "Slate", swatch: "bg-zinc-500" },
  { id: "blue", label: "Blue", swatch: "bg-blue-600" },
  { id: "green", label: "Green", swatch: "bg-green-600" },
  { id: "red", label: "Red", swatch: "bg-red-600" },
  { id: "yellow", label: "Yellow", swatch: "bg-yellow-500" },
  { id: "purple", label: "Purple", swatch: "bg-purple-600" },
  { id: "orange", label: "Orange", swatch: "bg-orange-500" },
]

const SUGGESTIONS = [
  "Design a URL shortener that handles 10k writes/sec",
  "Review my current diagram and name its weak points",
  "Add a caching layer and a read replica to this design",
  "Explain the trade-offs between a queue and direct calls here",
]

const CHAT_KEY = "nautilus-ai-chat"
const PROVIDER_KEY = "nautilus-ai-provider"
const modelKey = (p: AIProvider) => `nautilus-ai-model-${p}`

type Message = ChatTurn & {
  /** A diagram the assistant produced but that has not been applied yet. */
  proposal?: Diagram
  error?: boolean
}

export default function RightSidebar({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const {
    nodes,
    edges,
    setNodes,
    setEdges,
    projectName,
    selectedNodeId,
    setSelectedNodeId,
  } = useFlow()

  const [tab, setTab] = useState("properties")

  const selectedNode = nodes.find((n) => n.id === selectedNodeId) || null

  /**
   * Live load metrics, broadcast by the canvas. They are render-only there, so
   * they never reach this panel through node state.
   */
  const [loadReport, setLoadReport] = useState<SimulationReport | null>(null)

  useEffect(() => {
    function onReport(e: Event) {
      setLoadReport((e as CustomEvent).detail?.report ?? null)
    }
    window.addEventListener("nautilus-load-report", onReport)
    return () => window.removeEventListener("nautilus-load-report", onReport)
  }, [])

  const metrics: NodeMetrics | undefined = selectedNodeId
    ? loadReport?.metrics[selectedNodeId]
    : undefined

  /* ---------------------------------------------
     NODE PROPERTIES
  --------------------------------------------- */
  const [name, setName] = useState("")
  const [desc, setDesc] = useState("")
  const [color, setColor] = useState("default")

  /** Load-model fields. Strings so the inputs can be cleared while typing. */
  const [capacity, setCapacity] = useState("")
  const [replicas, setReplicas] = useState("")
  const [latency, setLatency] = useState("")
  const [errorPct, setErrorPct] = useState("")

  useEffect(() => {
    if (selectedNode) {
      setName(selectedNode.data.label ?? "")
      setDesc(selectedNode.data.description ?? "")
      setColor(selectedNode.data.color ?? "default")

      const sim = selectedNode.data.sim ?? {}
      setCapacity(sim.capacity != null ? String(sim.capacity) : "")
      setReplicas(sim.replicas != null ? String(sim.replicas) : "")
      setLatency(sim.latencyMs != null ? String(sim.latencyMs) : "")
      setErrorPct(sim.errorRate != null ? String(Math.round(sim.errorRate * 1000) / 10) : "")
    }
  }, [selectedNode])

  useEffect(() => {
    if (!selectedNode) return

    const t = setTimeout(() => {
      // Only keep simulation fields the user actually filled in; blank means
      // "use the engine default" rather than zero.
      const sim: Record<string, number> = {}
      const capacityNum = Number(capacity)
      const replicasNum = Number(replicas)
      const latencyNum = Number(latency)
      const errorNum = Number(errorPct)

      if (capacity !== "" && Number.isFinite(capacityNum) && capacityNum > 0) sim.capacity = capacityNum
      if (replicas !== "" && Number.isFinite(replicasNum) && replicasNum >= 1) {
        sim.replicas = Math.round(replicasNum)
      }
      if (latency !== "" && Number.isFinite(latencyNum) && latencyNum >= 0) sim.latencyMs = latencyNum
      if (errorPct !== "" && Number.isFinite(errorNum) && errorNum >= 0) {
        sim.errorRate = Math.min(1, errorNum / 100)
      }

      setNodes((prev) =>
        prev.map((n) =>
          n.id === selectedNode.id
            ? {
              ...n,
              data: {
                ...n.data,
                label: name,
                description: desc,
                color,
                sim: Object.keys(sim).length > 0 ? sim : undefined,
              },
            }
            : n
        )
      )
    }, 200)

    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name, desc, color, capacity, replicas, latency, errorPct])

  function deleteNode() {
    if (!selectedNode) return
    setNodes((prev) => prev.filter((n) => n.id !== selectedNode.id))
    setEdges((prev) =>
      prev.filter((e) => e.source !== selectedNode.id && e.target !== selectedNode.id)
    )
    setSelectedNodeId(null)
  }

  /* ---------------------------------------------
     API KEYS
  --------------------------------------------- */
  const [keys, setKeys] = useState<Record<AIProvider, string>>({
    openai: "",
    gemini: "",
    claude: "",
    groq: "",
  })
  // Per-provider model override. Empty string means "use the default".
  const [models, setModels] = useState<Record<AIProvider, string>>({
    openai: "",
    gemini: "",
    claude: "",
    groq: "",
  })
  const [revealed, setRevealed] = useState<AIProvider | null>(null)
  const [testing, setTesting] = useState<AIProvider | null>(null)
  const [provider, setProvider] = useState<AIProvider>("gemini")

  useEffect(() => {
    if (typeof window === "undefined") return
    setKeys({
      openai: localStorage.getItem("openai_key") || "",
      gemini: localStorage.getItem("gemini_key") || "",
      claude: localStorage.getItem("claude_key") || "",
      groq: localStorage.getItem("groq_key") || "",
    })
    setModels({
      openai: localStorage.getItem(modelKey("openai")) || "",
      gemini: localStorage.getItem(modelKey("gemini")) || "",
      claude: localStorage.getItem(modelKey("claude")) || "",
      groq: localStorage.getItem(modelKey("groq")) || "",
    })
    const saved = localStorage.getItem(PROVIDER_KEY) as AIProvider | null
    if (saved && PROVIDERS.includes(saved)) setProvider(saved)
  }, [])

  function updateModel(p: AIProvider, value: string) {
    setModels((prev) => ({ ...prev, [p]: value }))
    try {
      if (value.trim()) localStorage.setItem(modelKey(p), value.trim())
      else localStorage.removeItem(modelKey(p))
    } catch {
      // non-fatal
    }
  }

  /** The model id actually sent for a provider. */
  const modelFor = (p: AIProvider) => models[p].trim() || DEFAULT_MODELS[p]

  function updateKey(p: AIProvider, value: string) {
    setKeys((prev) => ({ ...prev, [p]: value }))
    try {
      if (value) localStorage.setItem(`${p}_key`, value)
      else localStorage.removeItem(`${p}_key`)
    } catch {
      toast.error("Could not save the key — local storage is unavailable")
    }
  }

  function clearKeys() {
    PROVIDERS.forEach((p) => localStorage.removeItem(`${p}_key`))
    setKeys({ openai: "", gemini: "", claude: "", groq: "" })
    toast.success("All API keys cleared from this browser")
  }

  async function handleTestKey(p: AIProvider) {
    setTesting(p)
    try {
      await testProviderKey(p, keys[p], models[p].trim() || undefined)
      toast.success(`${PROVIDER_META[p].label} key works`)
    } catch (err: any) {
      toast.error(`${PROVIDER_META[p].label}: ${err?.message ?? "key rejected"}`)
    } finally {
      setTesting(null)
    }
  }

  function selectProvider(p: AIProvider) {
    setProvider(p)
    try {
      localStorage.setItem(PROVIDER_KEY, p)
    } catch {
      // non-fatal
    }
  }

  const hasKey = (p: AIProvider) => Boolean(keys[p])

  /* ---------------------------------------------
     CHAT
  --------------------------------------------- */
  const [prompt, setPrompt] = useState("")
  const [loading, setLoading] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const abortRef = useRef<AbortController | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  // Restore the previous conversation so closing the panel is not destructive.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(CHAT_KEY)
      if (raw) setMessages(JSON.parse(raw))
    } catch {
      // ignore a corrupt cache
    }
  }, [])

  useEffect(() => {
    try {
      // Proposals hold whole diagrams; keep them out of the cache.
      localStorage.setItem(
        CHAT_KEY,
        JSON.stringify(
          messages.slice(-30).map((m) => ({ role: m.role, content: m.content, error: m.error }))
        )
      )
    } catch {
      // ignore quota errors
    }
  }, [messages])

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    })
  }, [messages, loading])

  const diagramContext = useMemo(
    () => ({
      name: projectName,
      nodes: nodes.map((n) => ({ id: n.id, data: n.data })),
      edges: edges.map((e) => ({ source: e.source, target: e.target })),
    }),
    [nodes, edges, projectName]
  )

  const send = useCallback(
    async (text: string) => {
      const question = text.trim()
      if (!question || loading) return

      if (!keys[provider]) {
        toast.error(`Add a ${PROVIDER_META[provider].label} key to start`)
        setTab("settings")
        return
      }

      const history: ChatTurn[] = [
        ...messages
          .filter((m) => !m.error)
          .map((m) => ({ role: m.role, content: m.content })),
        { role: "user" as const, content: question },
      ]

      setMessages((prev) => [...prev, { role: "user", content: question }])
      setPrompt("")
      setLoading(true)

      const controller = new AbortController()
      abortRef.current = controller

      try {
        const response: AIResponse = await generateFlow({
          provider,
          keys,
          history,
          diagram: diagramContext,
          modelId: modelFor(provider),
          signal: controller.signal,
        })

        if (response.type === "message") {
          setMessages((prev) => [...prev, { role: "ai", content: response.content }])
          return
        }

        // Model output is untrusted: validate before it can reach the canvas.
        const { diagram } = sanitizeDiagram({
          nodes: (response.nodes ?? []).map((n: any) => ({ ...n, type: "nautilusNode" })),
          edges: (response.edges ?? []).map((e: any, i: number) => ({
            id: e.id ?? `ai-e${i}`,
            source: e.source,
            target: e.target,
            markerEnd: { type: MarkerType.Arrow },
          })),
        })

        if (diagram.nodes.length === 0) {
          setMessages((prev) => [
            ...prev,
            {
              role: "ai",
              content: "That reply had no usable nodes. Try rephrasing the request.",
              error: true,
            },
          ])
          return
        }

        setMessages((prev) => [
          ...prev,
          {
            role: "ai",
            content:
              response.message ||
              `Designed ${diagram.nodes.length} components with ${diagram.edges.length} connections.`,
            proposal: diagram,
          },
        ])
      } catch (err: any) {
        if (err?.name === "AbortError") {
          setMessages((prev) => [...prev, { role: "ai", content: "Stopped.", error: true }])
          return
        }
        setMessages((prev) => [
          ...prev,
          { role: "ai", content: err?.message ?? "Something went wrong.", error: true },
        ])
      } finally {
        setLoading(false)
        abortRef.current = null
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [messages, provider, keys, models, diagramContext, loading]
  )

  function stop() {
    abortRef.current?.abort()
  }

  function retryLast() {
    const lastUser = [...messages].reverse().find((m) => m.role === "user")
    if (lastUser) send(lastUser.content)
  }

  function newChat() {
    setMessages([])
    setPrompt("")
    try {
      localStorage.removeItem(CHAT_KEY)
    } catch {
      // ignore
    }
  }

  /* ---------------------------------------------
     APPLYING A PROPOSED DIAGRAM

     Generated diagrams are never applied automatically — replacing a canvas
     the user spent time on should be their decision, not the model's.
  --------------------------------------------- */
  function replaceCanvas(diagram: Diagram) {
    setNodes(autoLayout(diagram.nodes, diagram.edges) as any)
    setEdges(diagram.edges as any)
    toast.success("Canvas replaced — undo with Ctrl/Cmd+Z")
    dismissProposal(diagram)
  }

  function appendToCanvas(diagram: Diagram) {
    // Fresh ids so an appended design cannot collide with what is already on
    // the canvas, and a y-offset so it lands below the existing diagram.
    const idMap = new Map<string, string>()
    diagram.nodes.forEach((n) => idMap.set(n.id, crypto.randomUUID()))

    const laidOut = autoLayout(diagram.nodes, diagram.edges)
    const bottom = nodes.reduce((max, n) => Math.max(max, n.position?.y ?? 0), 0)
    const offset = nodes.length > 0 ? bottom + 220 : 0

    const newNodes = laidOut.map((n) => ({
      ...n,
      id: idMap.get(n.id)!,
      position: { x: n.position!.x, y: n.position!.y + offset },
    }))

    const newEdges = diagram.edges.map((e) => ({
      ...e,
      id: crypto.randomUUID(),
      source: idMap.get(e.source)!,
      target: idMap.get(e.target)!,
    }))

    setNodes((prev) => [...prev, ...(newNodes as any)])
    setEdges((prev) => [...prev, ...(newEdges as any)])
    toast.success(`Added ${newNodes.length} components to the canvas`)
    dismissProposal(diagram)
  }

  function dismissProposal(diagram: Diagram) {
    setMessages((prev) =>
      prev.map((m) => (m.proposal === diagram ? { ...m, proposal: undefined } : m))
    )
  }

  /* ===========================================================
     RENDER
  =========================================================== */
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        showClose={false}
        className="w-[420px] sm:max-w-[420px] p-0 gap-0 flex flex-col bg-background border-l"
      >
        {/* Own header: the default floating close button sat on top of the tabs. */}
        <div className="flex h-11 items-center gap-2 border-b px-3">
          <SheetTitle className="text-[13px] font-medium">Inspector</SheetTitle>
          <SheetDescription className="sr-only">
            Node properties, the AI assistant and API key management.
          </SheetDescription>

          {selectedNode && (
            <Badge variant="outline" className="max-w-[160px] truncate">
              {selectedNode.data?.label || "Untitled node"}
            </Badge>
          )}

          <SheetClose asChild>
            <Button
              size="icon"
              variant="ghost"
              aria-label="Close panel"
              className="ml-auto h-7 w-7"
            >
              <XIcon className="h-4 w-4" />
            </Button>
          </SheetClose>
        </div>

        <Tabs value={tab} onValueChange={setTab} className="flex-1 flex flex-col h-full min-h-0 gap-0">
          <div className="border-b px-3 py-2.5">
            <TabsList className="grid grid-cols-3 w-full">
              <TabsTrigger value="properties" className="text-xs">Properties</TabsTrigger>
              <TabsTrigger value="assistant" className="text-xs">Assistant</TabsTrigger>
              <TabsTrigger value="settings" className="text-xs">Keys</TabsTrigger>
            </TabsList>
          </div>

          {/* ================= PROPERTIES ================= */}
          <TabsContent value="properties" className="flex-1 min-h-0 overflow-y-auto p-4 m-0">
            {!selectedNode ? (
              <EmptyState
                icon={<MousePointerSquareDashed className="h-5 w-5" />}
                title="No node selected"
                body="Click a node on the canvas to edit its label, description and colour."
              />
            ) : (
              <div className="space-y-5">
                <Field label="Label">
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onKeyDown={(e) => e.stopPropagation()}
                    placeholder="API Gateway"
                  />
                </Field>

                <Field label="Description">
                  <Textarea
                    value={desc}
                    onChange={(e) => setDesc(e.target.value)}
                    onKeyDown={(e) => e.stopPropagation()}
                    placeholder="What this component is responsible for…"
                    className="min-h-24 resize-none"
                  />
                </Field>

                <Field label="Colour">
                  <div className="flex flex-wrap gap-2">
                    {COLORS.map((c) => (
                      <Tooltip key={c.id}>
                        <TooltipTrigger asChild>
                          <button
                            type="button"
                            aria-label={c.label}
                            aria-pressed={color === c.id}
                            onClick={() => setColor(c.id)}
                            className={`h-7 w-7 rounded-md ${c.swatch} ring-offset-background transition-all ${
                              color === c.id
                                ? "ring-2 ring-primary ring-offset-2"
                                : "opacity-70 hover:opacity-100"
                            }`}
                          />
                        </TooltipTrigger>
                        <TooltipContent>{c.label}</TooltipContent>
                      </Tooltip>
                    ))}
                  </div>
                </Field>

                {/* -------- LOAD MODEL -------- */}
                <div className="space-y-3 rounded-lg border p-3">
                  <div className="flex items-center gap-2">
                    <Gauge className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-[13px] font-medium">Simulation</span>
                    {metrics && (
                      <Badge
                        variant={
                          metrics.status === "overloaded"
                            ? "destructive"
                            : metrics.status === "saturated" || metrics.status === "warn"
                              ? "warning"
                              : "success"
                        }
                        className="ml-auto"
                      >
                        {Math.round(metrics.utilization * 100)}% used
                      </Badge>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <SimField
                      label="Capacity (req/s)"
                      value={capacity}
                      onChange={setCapacity}
                      placeholder="unbounded"
                    />
                    <SimField label="Replicas" value={replicas} onChange={setReplicas} placeholder="1" />
                    <SimField label="Latency (ms)" value={latency} onChange={setLatency} placeholder="20" />
                    <SimField label="Error rate (%)" value={errorPct} onChange={setErrorPct} placeholder="0" />
                  </div>

                  {metrics ? (
                    <div className="grid grid-cols-3 gap-2 border-t pt-2 text-center">
                      <MiniStat label="In" value={formatRate(metrics.offered)} />
                      <MiniStat
                        label="Dropped"
                        value={formatRate(metrics.dropped)}
                        bad={metrics.dropped > 0}
                      />
                      <MiniStat label="Latency" value={formatMs(metrics.latencyMs)} />
                    </div>
                  ) : (
                    <p className="text-[11px] leading-5 text-muted-foreground">
                      Total capacity is capacity × replicas. Open the load playground
                      (gauge icon in the toolbar) to see traffic flow through these
                      numbers.
                    </p>
                  )}
                </div>

                <div className="rounded-lg border bg-muted/30 px-3 py-2">
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    Node ID
                  </div>
                  <code className="text-xs break-all">{selectedNode.id}</code>
                </div>

                <Button
                  variant="outline"
                  onClick={deleteNode}
                  className="w-full text-destructive hover:text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" /> Delete node
                </Button>
              </div>
            )}
          </TabsContent>

          {/* ================= ASSISTANT ================= */}
          <TabsContent
            value="assistant"
            className="flex-1 flex flex-col min-h-0 m-0 data-[state=inactive]:hidden"
          >
            <div className="flex items-center gap-1 px-3 py-2 border-b bg-muted/20">
              {PROVIDERS.map((p) => (
                <Tooltip key={p}>
                  <TooltipTrigger asChild>
                    <Button
                      size="sm"
                      variant={provider === p ? "secondary" : "ghost"}
                      onClick={() => selectProvider(p)}
                      className="h-8 gap-1.5 px-2"
                      aria-pressed={provider === p}
                      aria-label={PROVIDER_META[p].label}
                    >
                      {providerIcons[p]}
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          hasKey(p) ? "bg-emerald-500" : "bg-muted-foreground/30"
                        }`}
                      />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {PROVIDER_META[p].label} · {hasKey(p) ? "key saved" : "no key"}
                  </TooltipContent>
                </Tooltip>
              ))}

              <div className="ml-auto flex items-center gap-1">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => setTab("settings")}
                      className="max-w-[130px] truncate rounded border px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    >
                      {modelFor(provider)}
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>Change the model for {PROVIDER_META[provider].label}</TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8"
                      onClick={newChat}
                      disabled={loading || messages.length === 0}
                      aria-label="New chat"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>New chat</TooltipContent>
                </Tooltip>
              </div>
            </div>

            <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto px-3 py-4 space-y-3">
              {messages.length === 0 && (
                <div className="space-y-4 py-4">
                  <EmptyState
                    icon={<Sparkles className="h-5 w-5" />}
                    title="Ask about your architecture"
                    body="The assistant can see the diagram on your canvas — ask it to design, extend, review or explain."
                  />
                  <div className="space-y-2">
                    {SUGGESTIONS.map((s) => (
                      <button
                        key={s}
                        onClick={() => send(s)}
                        className="w-full text-left text-xs rounded-lg border bg-card hover:bg-accent px-3 py-2 transition-colors"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                  {!hasKey(provider) && (
                    <div className="rounded-lg border border-amber-500/40 bg-amber-500/5 p-3 space-y-2">
                      <div className="flex items-center gap-2 text-xs font-medium">
                        <KeyRound className="h-3.5 w-3.5" />
                        No {PROVIDER_META[provider].label} key yet
                      </div>
                      <p className="text-[11px] text-muted-foreground leading-relaxed">
                        Nautilus is free and has no backend — bring your own key.
                        {" "}
                        {PROVIDER_META[provider].freeTier}.
                      </p>
                      <Button size="sm" className="h-7 text-xs" onClick={() => setTab("settings")}>
                        Add a key
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {messages.map((msg, i) => (
                <div key={i} className={msg.role === "user" ? "flex justify-end" : "group space-y-2"}>
                  <div
                    className={`max-w-[92%] rounded-xl px-3 py-2 text-[13px] leading-relaxed whitespace-pre-wrap ${
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground rounded-br-sm"
                        : msg.error
                          ? "bg-destructive/10 text-destructive border border-destructive/20"
                          : "bg-muted border rounded-bl-sm"
                    }`}
                  >
                    {msg.content}
                  </div>

                  {msg.role === "ai" && !msg.error && (
                    <Button
                      size="sm"
                      variant="ghost"
                      aria-label="Copy reply"
                      className="h-6 px-1.5 text-[11px] text-muted-foreground opacity-0 transition-opacity focus-visible:opacity-100 group-hover:opacity-100"
                      onClick={() => {
                        navigator.clipboard.writeText(msg.content)
                        toast.success("Copied")
                      }}
                    >
                      <Copy className="mr-1 h-3 w-3" /> Copy
                    </Button>
                  )}

                  {msg.proposal && (
                    <div className="rounded-xl border bg-card p-3 space-y-3">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <Badge variant="secondary">{msg.proposal.nodes.length} components</Badge>
                        <Badge variant="outline">{msg.proposal.edges.length} connections</Badge>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          size="sm"
                          className="h-7 text-xs"
                          onClick={() => replaceCanvas(msg.proposal!)}
                        >
                          <Replace className="mr-1.5 h-3 w-3" /> Replace canvas
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          className="h-7 text-xs"
                          onClick={() => appendToCanvas(msg.proposal!)}
                        >
                          <Plus className="mr-1.5 h-3 w-3" /> Add to canvas
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 text-xs"
                          onClick={() => dismissProposal(msg.proposal!)}
                        >
                          <X className="mr-1.5 h-3 w-3" /> Discard
                        </Button>
                      </div>
                    </div>
                  )}

                  {msg.error && msg.role === "ai" && i === messages.length - 1 && (
                    <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={retryLast}>
                      <RotateCcw className="mr-1.5 h-3 w-3" /> Retry
                    </Button>
                  )}
                </div>
              ))}

              {loading && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Thinking…
                </div>
              )}
            </div>

            <div className="border-t p-3 bg-background">
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  send(prompt)
                }}
                className="relative"
              >
                <Textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  onKeyDown={(e) => {
                    e.stopPropagation()
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault()
                      send(prompt)
                    }
                  }}
                  placeholder="Design, extend or review this architecture…"
                  className="min-h-[76px] max-h-40 resize-none pr-12 text-[13px]"
                />
                {loading ? (
                  <Button
                    type="button"
                    size="icon"
                    variant="destructive"
                    onClick={stop}
                    className="absolute right-2 bottom-2 h-8 w-8"
                    aria-label="Stop generating"
                  >
                    <Square className="h-3.5 w-3.5" />
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    size="icon"
                    disabled={!prompt.trim()}
                    className="absolute right-2 bottom-2 h-8 w-8"
                    aria-label="Send message"
                  >
                    <Send className="h-3.5 w-3.5" />
                  </Button>
                )}
              </form>
              <p className="text-[10px] text-muted-foreground mt-2 leading-relaxed">
                Enter to send · Shift+Enter for a new line. Responses can be wrong —
                review before applying.
              </p>
            </div>
          </TabsContent>

          {/* ================= KEYS ================= */}
          <TabsContent
            value="settings"
            className="flex-1 min-h-0 overflow-y-auto p-4 m-0 space-y-4"
          >
            <div className="rounded-lg border bg-muted/30 p-3 space-y-1">
              <div className="text-xs font-medium">Bring your own key</div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Nautilus has no backend. Keys stay in this browser and go straight
                to the provider you select — nobody else sees them or your prompts.
                Anything with access to this origin could read them, so use
                project-scoped keys with a spend limit and clear them when done.
              </p>
            </div>

            {PROVIDERS.map((p) => {
              const meta = PROVIDER_META[p]
              return (
                <div key={p} className="rounded-lg border p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    {providerIcons[p]}
                    <span className="text-sm font-medium">{meta.label}</span>
                    {hasKey(p) && (
                      <span className="ml-auto inline-flex items-center gap-1 text-[10px] text-emerald-600">
                        <Check className="h-3 w-3" /> saved
                      </span>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Input
                        type={revealed === p ? "text" : "password"}
                        value={keys[p]}
                        onChange={(e) => updateKey(p, e.target.value)}
                        onKeyDown={(e) => e.stopPropagation()}
                        placeholder={`${meta.keyPrefix}…`}
                        className="pr-9 font-mono text-xs"
                        autoComplete="off"
                        spellCheck={false}
                      />
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="absolute right-0 top-0 h-9 w-9"
                        onClick={() => setRevealed(revealed === p ? null : p)}
                        aria-label={revealed === p ? "Hide key" : "Show key"}
                      >
                        {revealed === p ? (
                          <EyeOff className="h-3.5 w-3.5" />
                        ) : (
                          <Eye className="h-3.5 w-3.5" />
                        )}
                      </Button>
                    </div>

                    <Button
                      size="sm"
                      variant="outline"
                      className="h-9"
                      disabled={!keys[p] || testing === p}
                      onClick={() => handleTestKey(p)}
                    >
                      {testing === p ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Test"}
                    </Button>
                  </div>

                  <div className="relative">
                    <Input
                      value={models[p]}
                      onChange={(e) => updateModel(p, e.target.value)}
                      onKeyDown={(e) => e.stopPropagation()}
                      placeholder={`Model — default: ${DEFAULT_MODELS[p]}`}
                      className="pr-16 font-mono text-xs"
                      autoComplete="off"
                      spellCheck={false}
                      aria-label={`${meta.label} model id`}
                    />
                    {models[p] && (
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        className="absolute right-1 top-1 h-7 px-2 text-[11px]"
                        onClick={() => updateModel(p, "")}
                      >
                        <RotateCw className="mr-1 h-3 w-3" /> Reset
                      </Button>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                    <span>{meta.freeTier}</span>
                    <a
                      href={meta.keysUrl}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="inline-flex items-center gap-1 hover:text-foreground"
                    >
                      Get a key <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </div>
              )
            })}

            <Button
              variant="outline"
              onClick={clearKeys}
              className="w-full text-destructive hover:text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" /> Clear all keys
            </Button>
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  )
}

/* ---------------------------------------------
   SMALL PRESENTATIONAL HELPERS
--------------------------------------------- */
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </label>
      {children}
    </div>
  )
}

function SimField({
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

function MiniStat({ label, value, bad }: { label: string; value: string; bad?: boolean }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground/70">{label}</div>
      <div className={`text-[12px] font-medium ${bad ? "text-destructive" : ""}`}>{value}</div>
    </div>
  )
}

function EmptyState({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode
  title: string
  body: string
}) {
  return (
    <div className="flex flex-col items-center text-center px-4 py-8">
      <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center text-muted-foreground mb-3">
        {icon}
      </div>
      <div className="text-sm font-medium">{title}</div>
      <p className="text-xs text-muted-foreground mt-1 max-w-[260px] leading-relaxed">{body}</p>
    </div>
  )
}
