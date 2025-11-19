/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Upload, Download, Play, Sparkles, Share2, RotateCcw, RotateCw, Camera, LayoutGrid } from "lucide-react"
import { Input } from "@/components/ui/input"
import { ModeToggle } from "./mode-toggle"
import { GiNautilusShell } from "react-icons/gi"
import Link from "next/link"
import { HiMenu } from "react-icons/hi"
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
  const { nodes, edges, projectName, setProjectName, undo, redo, canUndo, canRedo, isSaved } = useFlow()
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [tplOpen, setTplOpen] = useState(false)

  /* ---------------------------
        EXPORT JSON
  --------------------------- */
  function handleExport() {
    try {
      const safeName = projectName
        .replace(/[^a-z0-9]+/gi, "-")
        .replace(/^-+|-+$/g, "")
        .toLowerCase()

      const data = JSON.stringify(
        { name: projectName, nodes, edges },
        null,
        2
      )
      const blob = new Blob([data], { type: "application/json" })

      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `${safeName || "design"}.json`
      a.click()

      URL.revokeObjectURL(url)

      toast.success("Exported successfully")
    } catch (err) {
      toast.error("Failed to export")
    }
  }

  /* ---------------------------
        IMPORT JSON
  --------------------------- */
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
          toast.error("Invalid JSON: Missing nodes or edges.")
          return
        }

        window.dispatchEvent(
          new CustomEvent("nautilus-import", {
            detail: { nodes: parsed.nodes, edges: parsed.edges, name: parsed.name },
          })
        )

        toast.success("Imported successfully!")
      } catch (err) {
        toast.error("Invalid JSON file.")
      }
    }

    reader.readAsText(file)
  }

  /* ---------------------------
        SHARE LINK
  --------------------------- */
  function handleShare() {
    try {
      const payload = {
        name: projectName,
        nodes,
        edges,
      }

      const compressed = LZString.compressToEncodedURIComponent(JSON.stringify(payload))
      const url = `${window.location.origin}/dashboard?d=${compressed}`

      navigator.clipboard.writeText(url)
      toast("Share link copied to clipboard")
    } catch {
      toast.error("Failed to generate link")
    }
  }

  /* ---------------------------
        RUN FLOW
  --------------------------- */
  function handleRun() {
    window.dispatchEvent(new Event("nautilus-run"))
    toast("Running flow… (simulation)")
  }

  /* ---------------------------
        SCREENSHOT (PNG) of Canvas
        Captures the first element with class ".react-flow"
  --------------------------- */
  /* ---------------------------
      SCREENSHOT FIX (SVG → PNG)
--------------------------- */
async function handleScreenshot() {
  try {
    const flowWrapper = document.querySelector(".react-flow") as HTMLElement | null
    if (!flowWrapper) {
      toast.error("Canvas not found")
      return
    }

    // Ensure white/transparent background
    const dataUrl = await htmlToImage.toPng(flowWrapper, {
      backgroundColor: "white",
      pixelRatio: 2, // HD export
      style: {
        transform: "none",          // Remove ReactFlow zoom transform
      },
    })

    const link = document.createElement("a")
    link.href = dataUrl
    link.download = `${projectName || "diagram"}.png`
    link.click()

    toast.success("PNG exported successfully!")
  } catch (err) {
    console.error(err)
    toast.error("Failed to export PNG")
  }
}


  return (
    <div className="h-16 border-b flex items-center justify-between px-6 bg-background">

      {/* LEFT SECTION */}
      <div className="flex items-center space-x-3">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" onClick={onToggleLeftSidebar}>
              <HiMenu className="h-6 w-6" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Toggle Sidebar</TooltipContent>
        </Tooltip>

        <Link href="/" className="flex items-center hover:opacity-80 transition">
          <GiNautilusShell className="h-7 w-7 text-primary" />
        </Link>

        <Separator orientation="vertical" className="h-6" />

        {/* PROJECT NAME */}
        <Input
          value={projectName}
          onChange={(e) => setProjectName(e.target.value)}
          className="w-56"
        />
      </div>

      {/* RIGHT SECTION */}
      <div className="flex items-center space-x-2">

        {/* Undo */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" onClick={() => undo()} disabled={!canUndo}>
              <RotateCcw className="h-5 w-5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>{canUndo ? "Undo (Ctrl/Cmd+Z)" : "Nothing to undo"}</TooltipContent>
        </Tooltip>

        {/* Redo */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" onClick={() => redo()} disabled={!canRedo}>
              <RotateCw className="h-5 w-5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>{canRedo ? "Redo (Ctrl/Cmd+Shift+Z)" : "Nothing to redo"}</TooltipContent>
        </Tooltip>

        {/* Templates */}
        <Tooltip>
  <TooltipTrigger asChild>
    <Button variant="ghost" size="icon" onClick={() => setTplOpen(true)}>
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
            <Button variant="ghost" size="icon" onClick={handleImportClick}>
              <Upload className="h-5 w-5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Import</TooltipContent>
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
            <Button variant="ghost" size="icon" onClick={handleExport}>
              <Download className="h-5 w-5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Export</TooltipContent>
        </Tooltip>

        {/* Share */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" onClick={handleShare}>
              <Share2 className="h-5 w-5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Share</TooltipContent>
        </Tooltip>

        {/* Screenshot */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" onClick={handleScreenshot}>
              <Camera className="h-5 w-5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Export PNG</TooltipContent>
        </Tooltip>

        {/* Run */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" onClick={handleRun}>
              <Play className="h-5 w-5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Run Flow</TooltipContent>
        </Tooltip>

        {/* Save indicator */}
        <div className="flex items-center gap-2 px-2">
          <div
            className={`h-2 w-2 rounded-full ${isSaved ? "bg-emerald-500" : "bg-rose-500 animate-pulse"}`}
            title={isSaved ? "Saved" : "Unsaved changes"}
          />
          {/* <span className="text-sm text-muted-foreground">{isSaved ? "Saved" : "Unsaved"}</span> */}
        </div>

        {/* AI */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" onClick={onToggleRightSidebar}>
              <Sparkles className="h-5 w-5 text-primary" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>AI Assistant</TooltipContent>
        </Tooltip>

        <ModeToggle />
      </div>
    </div>
  )
}
