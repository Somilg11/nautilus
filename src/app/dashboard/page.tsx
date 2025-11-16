"use client"

import { useState } from "react"
import Toolbar from "@/components/toolbar"
import LeftSidebar from "@/components/left-sidebar"
import Canvas from "@/components/canvas"
import RightSidebar from "@/components/right-sidebar"
import { FlowProvider } from "@/lib/flow-context"

export default function DashboardPage() {
  const [rightOpen, setRightOpen] = useState(false)

  return (
    <FlowProvider>
      <div className="flex flex-col h-screen">

        {/* Pass toggle to toolbar */}
        <Toolbar onToggleRightSidebar={() => setRightOpen(true)} />

        <div className="flex flex-1 overflow-hidden">
          <LeftSidebar />

          {/* Pass setter to Canvas */}
          <Canvas onOpenSidebar={() => setRightOpen(true)} />
        </div>

        <RightSidebar open={rightOpen} onOpenChange={setRightOpen} />
      </div>
    </FlowProvider>
  )
}
