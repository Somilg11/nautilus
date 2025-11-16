/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { useRef } from "react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Upload, Download, Play, Sparkles } from "lucide-react"
import { Input } from "@/components/ui/input"
import { ModeToggle } from "./mode-toggle"
import { GiNautilusShell } from "react-icons/gi"
import Link from "next/link"

import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu"

import { Templates } from "@/lib/templates"
import { useFlow } from "@/lib/flow-context"

export default function Toolbar({
  onToggleRightSidebar,
  onInsertTemplate,
}: {
  onToggleRightSidebar: () => void
  onInsertTemplate: (template: any) => void
}) {
  const { nodes, edges } = useFlow()
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  /* ---------------------------
        EXPORT JSON
  --------------------------- */
  function handleExport() {
    const data = JSON.stringify({ nodes, edges }, null, 2)
    const blob = new Blob([data], { type: "application/json" })

    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "nautilus-design.json"
    a.click()

    URL.revokeObjectURL(url)
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
          alert("Invalid diagram file. Missing 'nodes' or 'edges'.")
          return
        }

        // Broadcast to FlowProvider
        window.dispatchEvent(
          new CustomEvent("nautilus-import", {
            detail: { nodes: parsed.nodes, edges: parsed.edges },
          })
        )
      } catch (err) {
        alert("Invalid JSON file.")
      }
    }

    reader.readAsText(file)
  }

  /* ---------------------------
        MANUAL SAVE BUTTON
  --------------------------- */
  function handleSave() {
    try {
      localStorage.setItem(
        "nautilus-canvas-v1",
        JSON.stringify({ nodes, edges })
      )
      alert("Design saved successfully!")
    } catch (err) {
      alert("Failed to save!")
    }
  }

  /* ---------------------------
        RUN FLOW
  --------------------------- */
  function handleRun() {
    window.dispatchEvent(new Event("nautilus-run"))
  }

  return (
    <div className="h-16 border-b flex items-center justify-between px-6 bg-background">
      
      {/* -------- LEFT SECTION -------- */}
      <div className="flex items-center space-x-4">
        <Link href="/" className="flex items-center hover:opacity-80 transition">
          <GiNautilusShell className="h-7 w-7 text-primary" />
        </Link>

        <Separator orientation="vertical" className="h-6" />

        <Input defaultValue="Untitled Design" className="w-56" />
      </div>

      {/* -------- RIGHT SECTION -------- */}
      <div className="flex items-center space-x-3">

        {/* TEMPLATES MENU */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">Templates</Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent>
            {Object.entries(Templates).map(([key, template]) => (
              <DropdownMenuItem
                key={key}
                onClick={() => onInsertTemplate(template)}
                className="cursor-pointer"
              >
                {template.name}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* IMPORT */}
        <Button variant="outline" onClick={handleImportClick}>
          <Upload className="mr-2 h-4 w-4" /> Import
        </Button>

        <input
          ref={fileInputRef}
          type="file"
          accept="application/json"
          className="hidden"
          onChange={handleImport}
        />

        {/* EXPORT */}
        <Button variant="outline" onClick={handleExport}>
          <Download className="mr-2 h-4 w-4" /> Export
        </Button>

        {/* SAVE */}
        <Button onClick={handleSave}>Save</Button>

        <Separator orientation="vertical" className="h-6" />

        {/* RUN */}
        <Button variant="outline" onClick={handleRun}>
          <Play className="mr-2 h-4 w-4" /> Run Flow
        </Button>

        {/* AI ASSISTANT */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleRightSidebar}
          className="hover:bg-accent"
        >
          <Sparkles className="h-5 w-5 text-primary" />
        </Button>

        <ModeToggle />
      </div>
    </div>
  )
}
