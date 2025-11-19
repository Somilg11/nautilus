/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  Upload,
  Download,
  Play,
  Sparkles,
  Share2,
  RotateCcw,
  RotateCw,
  Camera,
  LayoutGrid,
} from "lucide-react"

import { Input } from "@/components/ui/input"
import { ModeToggle } from "./mode-toggle"
import { RiHomeFill } from "react-icons/ri"
import Link from "next/link"
import { TbLayoutSidebarFilled } from "react-icons/tb"

import LZString from "lz-string"
import * as htmlToImage from "html-to-image"
import { toast } from "sonner"

import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip"

import { useFlow } from "@/lib/flow-context"
import TemplateDialog from "./template-dialog"

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
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  /* -----------------------------
     EXPORT JSON
  ----------------------------- */
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

  /* -----------------------------
     IMPORT JSON
  ----------------------------- */
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
          toast.error("Invalid JSON: missing nodes/edges")
          return
        }

        window.dispatchEvent(
          new CustomEvent("nautilus-import", {
            detail: { nodes: parsed.nodes, edges: parsed.edges, name: parsed.name },
          })
        )

        toast.success("Imported successfully")
      } catch {
        toast.error("Invalid JSON")
      }
    }

    reader.readAsText(file)
  }

  /* -----------------------------
     SHARE LINK
  ----------------------------- */
  function handleShare() {
    try {
      const payload = JSON.stringify({ name: projectName, nodes, edges })
      const compressed = LZString.compressToEncodedURIComponent(payload)

      const url = `${window.location.origin}/dashboard?d=${compressed}`
      navigator.clipboard.writeText(url)

      toast("Share link copied")
    } catch {
      toast.error("Share failed")
    }
  }

  /* -----------------------------
     RUN FLOW
  ----------------------------- */
  function handleRun() {
    window.dispatchEvent(new Event("nautilus-run"))
    toast("Running flow…")
  }

  /* -----------------------------
     CANVAS → PNG
  ----------------------------- */
  async function handleScreenshot() {
    try {
      const flow = document.querySelector(".react-flow") as HTMLElement
      if (!flow) return toast.error("Canvas not found")

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
    }
  }

  /* -----------------------------
     RENDER
  ----------------------------- */
  return (
    <div className="h-16 border-b flex items-center justify-between px-6 bg-background">

      {/* LEFT SIDE */}
      <div className="flex items-center gap-3">

        {/* Toggle Sidebar */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button size="icon" variant="ghost" onClick={onToggleLeftSidebar}>
              <TbLayoutSidebarFilled className="h-6 w-6" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Toggle Sidebar</TooltipContent>
        </Tooltip>

        {/* Home */}
        <Link href="/" className="hover:opacity-80">
          <RiHomeFill className="h-4 w-4 text-primary" />
        </Link>

        <Separator orientation="vertical" className="h-6" />

        {/* Project Name */}
        <Input
          value={projectName}
          onChange={(e) => setProjectName(e.target.value)}
          className="w-56"
          placeholder="Project Name"
        />
      </div>

      {/* RIGHT SIDE */}
      <div className="flex items-center gap-2">

        {/* Undo */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button size="icon" variant="ghost" disabled={!canUndo} onClick={() => undo()}>
              <RotateCcw className="h-5 w-5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Undo</TooltipContent>
        </Tooltip>

        {/* Redo */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button size="icon" variant="ghost" disabled={!canRedo} onClick={() => redo()}>
              <RotateCw className="h-5 w-5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Redo</TooltipContent>
        </Tooltip>

        {/* Templates */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button size="icon" variant="ghost" onClick={() => setTplOpen(true)}>
              <LayoutGrid className="h-5 w-5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Templates</TooltipContent>
        </Tooltip>

        <TemplateDialog
          open={tplOpen}
          onOpenChange={setTplOpen}
          onSelect={(tpl) => onInsertTemplate(tpl)}
        />

        {/* Import */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button size="icon" variant="ghost" onClick={handleImportClick}>
              <Upload className="h-5 w-5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Import JSON</TooltipContent>
        </Tooltip>

        <input
          ref={fileInputRef}
          type="file"
          accept="application/json"
          className="hidden"
          onChange={handleImport}
        />

        {/* Export */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button size="icon" variant="ghost" onClick={handleExport}>
              <Download className="h-5 w-5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Export JSON</TooltipContent>
        </Tooltip>

        {/* Share */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button size="icon" variant="ghost" onClick={handleShare}>
              <Share2 className="h-5 w-5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Share</TooltipContent>
        </Tooltip>

        {/* Screenshot */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button size="icon" variant="ghost" onClick={handleScreenshot}>
              <Camera className="h-5 w-5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Export PNG</TooltipContent>
        </Tooltip>

        {/* Run */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button size="icon" variant="ghost" onClick={handleRun}>
              <Play className="h-5 w-5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Run Flow</TooltipContent>
        </Tooltip>

        {/* Save Indicator */}
        <div className="flex items-center px-1">
          <div
            className={`h-2 w-2 rounded-full ${
              isSaved ? "bg-emerald-500" : "bg-rose-500 animate-pulse"
            }`}
            title={isSaved ? "Saved" : "Unsaved changes"}
          />
        </div>

        {/* AI */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button size="icon" variant="ghost" onClick={onToggleRightSidebar}>
              <Sparkles className="h-5 w-5 text-primary" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>AI Assistant</TooltipContent>
        </Tooltip>

        {/* Theme */}
        <ModeToggle />
      </div>
    </div>
  )
}
