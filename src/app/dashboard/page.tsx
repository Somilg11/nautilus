"use client"

import { useState } from "react"
import Toolbar from "@/components/toolbar"
import LeftSidebar from "@/components/left-sidebar"
import Canvas from "@/components/canvas"
import RightSidebar from "@/components/right-sidebar"
import EditingTools from "@/components/editing-tools"
import MobileDisclaimer from "@/components/mobile-disclaimer"
import { FlowProvider, useFlow } from "@/lib/flow-context"
import { DEFAULT_LOAD_PARAMS } from "@/lib/simulation-model"

function DashboardInner() {
  const [rightOpen, setRightOpen] = useState(false)
  const [leftOpen, setLeftOpen] = useState(true)

  const { setNodes, setEdges, setLoadParams } = useFlow()

  return (
    <div className="flex flex-col h-screen">
      
      {/* TOP APP TOOLBAR */}
      <Toolbar
        onToggleRightSidebar={() => setRightOpen(true)}
        onInsertTemplate={(template) => {
          setNodes(template.nodes)
          setEdges(template.edges)
          // Templates ship with the load they are meant to serve.
          if (template.sim) setLoadParams({ ...DEFAULT_LOAD_PARAMS, ...template.sim })
        }}
        onToggleLeftSidebar={() => setLeftOpen((p) => !p)}
      />

      {/* Canvas editing bar */}
      <EditingTools />

      {/* MAIN LAYOUT */}
      <div className="flex flex-1 overflow-hidden min-h-0">
        <div
          className={`
            transition-[width] duration-200 ease-out
            ${leftOpen ? "w-64" : "w-0"}
            overflow-hidden border-r bg-background
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

      {/* The canvas is desktop-first; warn once on small screens. */}
      <MobileDisclaimer />
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
