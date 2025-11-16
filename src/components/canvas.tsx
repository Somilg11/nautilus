/* eslint-disable react-hooks/preserve-manual-memoization */
"use client"

import React, { useCallback, useRef, useState } from "react"
import ReactFlow, {
  addEdge,
  Background,
  Controls,
  Connection,
  Edge,
  Node,
  useNodesState,
  useEdgesState,
  ReactFlowInstance,
  MarkerType,
} from "react-flow-renderer"

import { createNode } from "@/lib/flow-utils"
import "@/styles/canvas.css"

export default function Canvas() {
  const reactFlowWrapper = useRef<HTMLDivElement | null>(null)
  const [reactFlowInstance, setReactFlowInstance] =
    useState<ReactFlowInstance | null>(null)

  const initialNodes: Node[] = [
    { id: "1", data: { label: "Web Server" }, position: { x: 250, y: 5 } },
    { id: "2", data: { label: "Database" }, position: { x: 250, y: 200 } },
  ]

  const initialEdges: Edge[] = [
    {
      id: "e1-2",
      source: "1",
      target: "2",
      animated: true,
      markerEnd: { type: MarkerType.Arrow },
    },
  ]

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)

  const onConnect = useCallback(
    (params: Edge | Connection) => setEdges((eds) => addEdge(params, eds)),
    []
  )

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = "move"
  }, [])

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault()

      if (!reactFlowWrapper.current || !reactFlowInstance) return

      const componentId = event.dataTransfer.getData("application/reactflow")
      if (!componentId) return

      const bounds = reactFlowWrapper.current.getBoundingClientRect()
      const position = reactFlowInstance.project({
        x: event.clientX - bounds.left,
        y: event.clientY - bounds.top,
      })

      const node = createNode(componentId, position, { label: componentId })
      setNodes((nds) => nds.concat(node))
    },
    [reactFlowInstance, setNodes]
  )

  return (
    <div
      ref={reactFlowWrapper}
      className="flex-1 h-full relative bg-canvas-pattern"
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onInit={setReactFlowInstance}
        onDrop={onDrop}
        onDragOver={onDragOver}
        fitView
      >
        <Background gap={20} />
        <Controls />
      </ReactFlow>
    </div>
  )
}
