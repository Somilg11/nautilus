/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import React, { useEffect, useRef } from "react"
import ReactFlow, {
  Background,
  Controls,
  MarkerType,
  ReactFlowInstance,
  NodeChange,
  EdgeChange,
  Connection,
} from "react-flow-renderer"

import { createNode } from "@/lib/flow-utils"
import { useFlow } from "@/lib/flow-context"
import NautilusNode from "@/components/nodes/NautilusNode"
import "@/styles/canvas.css"

const nodeTypes = { nautilusNode: NautilusNode }

export default function Canvas({
  onOpenSidebar,
}: {
  onOpenSidebar: () => void
}) {
  const wrapperRef = useRef<HTMLDivElement | null>(null)
  const {
    nodes,
    edges,
    setNodes,
    setEdges,
    reactFlowInstance,
    setReactFlowInstance,
    setSelectedNodeId,
  } = useFlow()

  const onInit = (instance: ReactFlowInstance) => {
    setReactFlowInstance(instance)
  }

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
  }

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    if (!reactFlowInstance || !wrapperRef.current) return

    const compId = e.dataTransfer.getData("application/reactflow")
    if (!compId) return

    const bounds = wrapperRef.current.getBoundingClientRect()
    const position = reactFlowInstance.project({
      x: e.clientX - bounds.left,
      y: e.clientY - bounds.top,
    })

    const newNode = createNode(compId, position, {
      label: compId,
      icon: compId,
      color: "default",
    })

    newNode.type = "nautilusNode"

    setNodes((prev) => [...prev, newNode])
  }

  const onNodeClick = (_e: any, node: any) => {
    setSelectedNodeId(node.id)
  }

  const onNodeDoubleClick = (_e: any, node: any) => {
    setSelectedNodeId(node.id)
    onOpenSidebar()
  }

  const onNodesChange = (changes: NodeChange[]) => {
    setNodes((prev) => {
      const updated = [...prev]
      for (const c of changes) {
        if (c.type === "position" && c.position) {
          const index = updated.findIndex((n) => n.id === c.id)
          if (index >= 0)
            updated[index] = { ...updated[index], position: c.position }
        }
      }
      return updated
    })
  }

  const onEdgesChange = (changes: EdgeChange[]) => {
    setEdges((prev) => {
      let updated = [...prev]
      for (const c of changes) {
        if (c.type === "remove") {
          updated = updated.filter((e) => e.id !== c.id)
        }
      }
      return updated
    })
  }

  const onConnect = (params: Connection) => {
    const edge = {
      id: crypto.randomUUID(),
      source: params.source ?? "",
      target: params.target ?? "",
      sourceHandle: params.sourceHandle ?? undefined,
      targetHandle: params.targetHandle ?? undefined,
      markerEnd: { type: MarkerType.Arrow },
    }

    setEdges((prev) => [...prev, edge])
  }

  // Listen for custom “openSidebar” events from NautilusNode
  useEffect(() => {
    const openHandler = () => onOpenSidebar()
    window.addEventListener("openSidebar", openHandler)
    return () => window.removeEventListener("openSidebar", openHandler)
  }, [])

  return (
    <div ref={wrapperRef} className="flex-1 h-full bg-canvas-pattern">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onInit={onInit}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onNodeClick={onNodeClick}
        onNodeDoubleClick={onNodeDoubleClick}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        fitView
      >
        <Background gap={20} size={1} />
        <Controls />
      </ReactFlow>
    </div>
  )
}
