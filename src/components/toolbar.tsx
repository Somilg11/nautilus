"use client"

import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Upload, Download, Play, Sparkles } from "lucide-react"
import { Input } from "@/components/ui/input"
import { ModeToggle } from "./mode-toggle"
import { GiNautilusShell } from "react-icons/gi"
import Link from "next/link"

export default function Toolbar({
  onToggleRightSidebar,
}: {
  onToggleRightSidebar: () => void
}) {
  return (
    <div className="h-16 border-b flex items-center justify-between px-6 bg-background">
      
      {/* Left */}
      <div className="flex items-center space-x-4">
        <Link href="/" className="flex items-center hover:opacity-80 transition">
          <GiNautilusShell className="h-7 w-7 text-primary" />
        </Link>

        <Separator orientation="vertical" className="h-6" />

        <Input
          defaultValue="Untitled Design"
          className="w-56"
        />
      </div>

      {/* Right */}
      <div className="flex items-center space-x-3">
        <Button variant="outline">Templates</Button>

        <Button variant="outline">
          <Upload className="mr-2 h-4 w-4" /> Import
        </Button>

        <Button variant="outline">
          <Download className="mr-2 h-4 w-4" /> Export
        </Button>

        <Button>Save</Button>

        <Separator orientation="vertical" className="h-6" />

        <Button variant="outline">
          <Play className="mr-2 h-4 w-4" /> Run Flow
        </Button>

        {/* AI Assistant Toggle */}
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
