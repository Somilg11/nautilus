"use client"

import { useState } from "react"
import Toolbar from "@/components/toolbar"
import LeftSidebar from "@/components/left-sidebar"
import Canvas from "@/components/canvas"
import RightSidebar from "@/components/right-sidebar"
import { FlowProvider, useFlow } from "@/lib/flow-context"

function DashboardInner() {
  const [rightOpen, setRightOpen] = useState(false)

  // ⭐ FIX: get setNodes & setEdges from FlowProvider
  const { setNodes, setEdges } = useFlow()

  return (
    <div className="flex flex-col h-screen">

      {/* Toolbar */}
      <Toolbar
        onToggleRightSidebar={() => setRightOpen(true)}
        onInsertTemplate={(template) => {
          setNodes(template.nodes)
          setEdges(template.edges)
        }}
      />

      {/* Main Layout */}
      <div className="flex flex-1 overflow-hidden">
        <LeftSidebar />

        <Canvas
          onOpenSidebar={() => setRightOpen(true)}
          onInsertTemplate={(template) => {
            setNodes(template.nodes)
            setEdges(template.edges)
          }}
        />
      </div>

      {/* Right Sidebar Drawer */}
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
