/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  Upload,
  Download,
  Play,
  Sparkles,
  Share2,
  Undo2,
  Redo2,
  Camera,
  LayoutGrid,
  Square,
  Gauge,
  PanelLeft,
  Check,
  Loader2,
} from "lucide-react"

import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ModeToggle } from "./mode-toggle"
import Link from "next/link"

import LZString from "lz-string"
import * as htmlToImage from "html-to-image"
import { toast } from "sonner"

import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip"

import { useFlow } from "@/lib/flow-context"
import NautilusMark from "@/components/nautilus-mark"
import TemplateDialog from "./template-dialog"

/** Icon button with a mandatory label — every control stays reachable. */
function ToolButton({
  label,
  hint,
  onClick,
  disabled,
  children,
  active,
}: {
  label: string
  hint?: string
  onClick: () => void
  disabled?: boolean
  children: React.ReactNode
  active?: boolean
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          size="icon"
          variant={active ? "secondary" : "ghost"}
          onClick={onClick}
          disabled={disabled}
          aria-label={label}
          className="h-8 w-8"
        >
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent className="flex items-center gap-2">
        <span>{label}</span>
        {hint && (
          <kbd className="rounded border border-border/50 bg-background/20 px-1 font-mono text-[10px]">
            {hint}
          </kbd>
        )}
      </TooltipContent>
    </Tooltip>
  )
}

export default function Toolbar({
  onToggleRightSidebar,
  onInsertTemplate,
  onToggleLeftSidebar,
}: {
  onToggleRightSidebar: () => void
  onInsertTemplate: (template: any) => void
  onToggleLeftSidebar: () => void
}) {
  const {
    nodes,
    edges,
    projectName,
    setProjectName,
    undo,
    redo,
    canUndo,
    canRedo,
    isSaved,
  } = useFlow()

  const [tplOpen, setTplOpen] = useState(false)
  const [running, setRunning] = useState(false)
  const [loadOn, setLoadOn] = useState(false)
  const [exporting, setExporting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  /* ----------------------------- EXPORT JSON ----------------------------- */
  function handleExport() {
    try {
      const safeName = projectName
        .replace(/[^a-z0-9]+/gi, "-")
        .replace(/^-+|-+$/g, "")
        .toLowerCase()

      const json = JSON.stringify({ name: projectName, nodes, edges }, null, 2)
      const blob = new Blob([json], { type: "application/json" })
      const url = URL.createObjectURL(blob)

      const a = document.createElement("a")
      a.href = url
      a.download = `${safeName || "diagram"}.json`
      a.click()
      URL.revokeObjectURL(url)

      toast.success("Exported JSON")
    } catch {
      toast.error("Export failed")
    }
  }

  /* ----------------------------- IMPORT JSON ----------------------------- */
  function handleImportClick() {
    fileInputRef.current?.click()
  }

  function handleImport(e: any) {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string)

        if (!parsed.nodes || !parsed.edges) {
          toast.error("Invalid file: missing nodes or edges")
          return
        }

        window.dispatchEvent(
          new CustomEvent("nautilus-import", {
            detail: { nodes: parsed.nodes, edges: parsed.edges, name: parsed.name },
          })
        )

        toast.success(`Imported ${parsed.nodes.length} components`)
      } catch {
        toast.error("That file isn't valid JSON")
      } finally {
        // Allow importing the same file twice in a row.
        e.target.value = ""
      }
    }

    reader.readAsText(file)
  }

  /* ------------------------------- SHARE -------------------------------- */
  async function handleShare() {
    try {
      const payload = JSON.stringify({ name: projectName, nodes, edges })
      const compressed = LZString.compressToEncodedURIComponent(payload)
      const url = `${window.location.origin}/dashboard?d=${compressed}`

      await navigator.clipboard.writeText(url)

      if (url.length > 8000) {
        toast.warning("Link copied, but it's very long — export JSON for big diagrams")
      } else {
        toast.success("Share link copied to clipboard")
      }
    } catch {
      toast.error("Could not copy the share link")
    }
  }

  /* -------------------------------- RUN --------------------------------- */
  useEffect(() => {
    function onState(e: Event) {
      const detail = (e as CustomEvent).detail ?? {}
      setRunning(detail.status === "running" || detail.status === "paused")
      setLoadOn(Boolean(detail.load))
    }
    window.addEventListener("nautilus-run-state", onState)
    return () => window.removeEventListener("nautilus-run-state", onState)
  }, [])

  function handleRun() {
    window.dispatchEvent(new Event(running ? "nautilus-run-stop" : "nautilus-run"))
  }

  /* ----------------------------- CANVAS → PNG ---------------------------- */
  async function handleScreenshot() {
    const flow = document.querySelector(".react-flow") as HTMLElement
    if (!flow) return toast.error("Canvas not found")

    setExporting(true)
    try {
      const url = await htmlToImage.toPng(flow, {
        backgroundColor: "white",
        pixelRatio: 2,
        style: { transform: "none" },
      })

      const a = document.createElement("a")
      a.href = url
      a.download = `${projectName || "diagram"}.png`
      a.click()

      toast.success("PNG exported")
    } catch {
      toast.error("Failed to export PNG")
    } finally {
      setExporting(false)
    }
  }

  /* -------------------------------- RENDER ------------------------------- */
  return (
    <header className="flex h-12 items-center gap-2 border-b bg-background px-3">
      {/* LEFT */}
      <div className="flex min-w-0 items-center gap-1.5">
        <ToolButton label="Toggle component panel" hint="[" onClick={onToggleLeftSidebar}>
          <PanelLeft className="h-4 w-4" />
        </ToolButton>

        <Link href="/" aria-label="Nautilus home" className="shrink-0 transition-opacity hover:opacity-80">
          <NautilusMark className="h-6 w-6" />
        </Link>

        <Input
          value={projectName}
          onChange={(e) => setProjectName(e.target.value)}
          onKeyDown={(e) => e.stopPropagation()}
          aria-label="Project name"
          placeholder="Untitled design"
          className="h-8 w-52 border-transparent bg-transparent px-2 text-[13px] font-medium shadow-none hover:border-border focus-visible:border-border"
        />

        <Badge variant={isSaved ? "success" : "warning"} className="gap-1.5">
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              isSaved ? "bg-emerald-500" : "bg-amber-500 animate-pulse"
            }`}
          />
          {isSaved ? "Saved" : "Saving…"}
        </Badge>
      </div>

      {/* RIGHT */}
      <div className="ml-auto flex items-center gap-1">
        <ToolButton label="Undo" hint="⌘Z" onClick={undo} disabled={!canUndo}>
          <Undo2 className="h-4 w-4" />
        </ToolButton>
        <ToolButton label="Redo" hint="⌘⇧Z" onClick={redo} disabled={!canRedo}>
          <Redo2 className="h-4 w-4" />
        </ToolButton>

        <Separator orientation="vertical" className="mx-1 h-5" />

        <ToolButton label="Templates" onClick={() => setTplOpen(true)}>
          <LayoutGrid className="h-4 w-4" />
        </ToolButton>

        <TemplateDialog
          open={tplOpen}
          onOpenChange={setTplOpen}
          onSelect={(tpl) => onInsertTemplate(tpl)}
        />

        <ToolButton label="Import JSON" onClick={handleImportClick}>
          <Upload className="h-4 w-4" />
        </ToolButton>

        <input
          ref={fileInputRef}
          type="file"
          accept="application/json"
          className="hidden"
          onChange={handleImport}
          aria-hidden="true"
          tabIndex={-1}
        />

        <ToolButton label="Export JSON" onClick={handleExport}>
          <Download className="h-4 w-4" />
        </ToolButton>

        <ToolButton label="Export PNG" onClick={handleScreenshot} disabled={exporting}>
          {exporting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Camera className="h-4 w-4" />
          )}
        </ToolButton>

        <ToolButton label="Copy share link" onClick={handleShare}>
          <Share2 className="h-4 w-4" />
        </ToolButton>

        <Separator orientation="vertical" className="mx-1 h-5" />

        <Button
          size="sm"
          variant={running ? "destructive" : "default"}
          onClick={handleRun}
          className="h-8 gap-1.5 px-3 text-[13px]"
        >
          {running ? (
            <>
              <Square className="h-3.5 w-3.5" /> Stop
            </>
          ) : (
            <>
              <Play className="h-3.5 w-3.5" /> Run
            </>
          )}
        </Button>

        <ToolButton
          label="Load playground"
          onClick={() => window.dispatchEvent(new Event("nautilus-load-toggle"))}
          active={loadOn}
        >
          <Gauge className="h-4 w-4" />
        </ToolButton>

        <Button
          size="sm"
          variant="secondary"
          onClick={onToggleRightSidebar}
          className="h-8 gap-1.5 px-3 text-[13px]"
        >
          <Sparkles className="h-3.5 w-3.5 text-primary" /> Assistant
        </Button>

        <ModeToggle />
      </div>
    </header>
  )
}
