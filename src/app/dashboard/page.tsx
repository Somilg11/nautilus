"use client"

import { useState } from "react"
import Toolbar from "@/components/toolbar"
import LeftSidebar from "@/components/left-sidebar"
import Canvas from "@/components/canvas"
import RightSidebar from "@/components/right-sidebar"
import EditingTools from "@/components/editing-tools"
import { FlowProvider, useFlow } from "@/lib/flow-context"

function DashboardInner() {
  const [rightOpen, setRightOpen] = useState(false)
  const [leftOpen, setLeftOpen] = useState(true)

  const { setNodes, setEdges } = useFlow()

  return (
    <div className="flex flex-col h-screen">
      
      {/* TOP APP TOOLBAR */}
      <Toolbar
        onToggleRightSidebar={() => setRightOpen(true)}
        onInsertTemplate={(template) => {
          setNodes(template.nodes)
          setEdges(template.edges)
        }}
        onToggleLeftSidebar={() => setLeftOpen((p) => !p)}
      />

      {/* 🔥 NEW — EDITING TOOLS (Canvas toolbar) */}
      <EditingTools />

      {/* MAIN LAYOUT */}
      <div className="flex flex-1 overflow-hidden min-h-0">
        <div
          className={`
            transition-all duration-300 ease-in-out
            ${leftOpen ? "w-72" : "w-0"}
            overflow-hidden border-r
            h-full min-h-0
          `}
        >
          <LeftSidebar collapsed={!leftOpen} />
        </div>

        <Canvas
          onOpenSidebar={() => setRightOpen(true)}
        />
      </div>

      <RightSidebar open={rightOpen} onOpenChange={setRightOpen} />
    </div>
  )
}

export default function DashboardPage() {
  return (
    <FlowProvider>
      <DashboardInner />
    </FlowProvider>
  )
}
