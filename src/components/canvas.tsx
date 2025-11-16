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
import { computeExecutionPath } from "@/lib/flow-execution"

const nodeTypes = { nautilusNode: NautilusNode }

export default function Canvas({
  onOpenSidebar,
}: {
  onOpenSidebar: () => void
  onInsertTemplate: (t: any) => void
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

  /* ---------------------------------------------
     INITIALIZE REACT FLOW INSTANCE
  --------------------------------------------- */
  const onInit = (instance: ReactFlowInstance) => {
    setReactFlowInstance(instance)
  }

  /* ---------------------------------------------
     DRAG + DROP COMPONENTS
  --------------------------------------------- */
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

  /* ---------------------------------------------
     NODE SELECTION + DOUBLE CLICK
  --------------------------------------------- */
  const onNodeClick = (_e: any, node: any) => {
    setSelectedNodeId(node.id)
  }

  const onNodeDoubleClick = (_e: any, node: any) => {
    setSelectedNodeId(node.id)
    onOpenSidebar()
  }

  /* ---------------------------------------------
     NODE & EDGE UPDATE HANDLING
  --------------------------------------------- */
  const onNodesChange = (changes: NodeChange[]) => {
    setNodes((prev) => {
      const updated = [...prev]
      for (const c of changes) {
        if (c.type === "position" && c.position) {
          const index = updated.findIndex((n) => n.id === c.id)
          if (index >= 0) {
            updated[index] = { ...updated[index], position: c.position }
          }
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

  /* ---------------------------------------------
     EVENT: IMPORT DIAGRAM
     From Toolbar: window.dispatchEvent("nautilus-import")
  --------------------------------------------- */
  useEffect(() => {
    function onImport(e: any) {
      const { nodes, edges } = e.detail
      setNodes(nodes)
      setEdges(edges)

      // Auto fit view
      setTimeout(() => {
        reactFlowInstance?.fitView({ padding: 0.2 })
      }, 50)
    }

    window.addEventListener("nautilus-import", onImport)
    return () => window.removeEventListener("nautilus-import", onImport)
  }, [reactFlowInstance, setNodes, setEdges])

  /* ---------------------------------------------
   EVENT: RUN FLOW (visual execution engine)
--------------------------------------------- */
useEffect(() => {
  function onRunFlow() {
    if (nodes.length === 0) {
      alert("No nodes to run.")
      return
    }

    const valid = edges.every(
      (e) => nodes.some((n) => n.id === e.source) && nodes.some((n) => n.id === e.target)
    )

    if (!valid) {
      alert("Invalid edges — cannot run.")
      return
    }

    // 1. Compute execution order
    const path = computeExecutionPath(nodes, edges)

    if (path.length === 0) {
      alert("No valid traversal path found.")
      return
    }

    console.log("Execution path:", path)

    // 2. Animate nodes in order
    let i = 0

    function highlightNext() {
      const id = path[i]

      setNodes((prev) =>
        prev.map((n) =>
          n.id === id ? { ...n, data: { ...n.data, __glow: true } } : n
        )
      )

      // turn off after delay
      setTimeout(() => {
        setNodes((prev) =>
          prev.map((n) =>
            n.id === id ? { ...n, data: { ...n.data, __glow: false } } : n
          )
        )

        i++
        if (i < path.length) highlightNext()
      }, 700)
    }

    highlightNext()
  }

  window.addEventListener("nautilus-run", onRunFlow)
  return () => window.removeEventListener("nautilus-run", onRunFlow)
}, [nodes, edges, setNodes])


  /* ---------------------------------------------
     NODE REQUESTED SIDEBAR OPEN (custom event)
  --------------------------------------------- */
  useEffect(() => {
    const openHandler = () => onOpenSidebar()
    window.addEventListener("openSidebar", openHandler)
    return () => window.removeEventListener("openSidebar", openHandler)
  }, [])

  /* ---------------------------------------------
     RENDER
  --------------------------------------------- */
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
