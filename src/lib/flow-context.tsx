/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/set-state-in-effect */
"use client"

import React, { createContext, useContext, useEffect, useMemo, useState } from "react"
import type { Edge, Node, ReactFlowInstance } from "react-flow-renderer"

type FlowContextType = {
  nodes: Node[]
  setNodes: (updater: React.SetStateAction<Node[]>) => void
  edges: Edge[]
  setEdges: (updater: React.SetStateAction<Edge[]>) => void
  reactFlowInstance: ReactFlowInstance | null
  setReactFlowInstance: (r: ReactFlowInstance | null) => void
  selectedNodeId: string | null
  setSelectedNodeId: (id: string | null) => void
}

const FlowContext = createContext<FlowContextType | undefined>(undefined)

const STORAGE_KEY = "nautilus-canvas-v1"

export function useFlow() {
  const ctx = useContext(FlowContext)
  if (!ctx) throw new Error("useFlow must be used inside FlowProvider")
  return ctx
}

export function FlowProvider({ children }: { children: React.ReactNode }) {
  const [nodes, setNodes] = useState<Node[]>([])
  const [edges, setEdges] = useState<Edge[]>([])
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null)
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)

  // load from storage once
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (!raw) {
        // nothing saved yet
        setNodes([
          { id: "1", data: { label: "Web Server", description: "" }, position: { x: 250, y: 5 }, type: "nautilusNode" },
          { id: "2", data: { label: "Database", description: "" }, position: { x: 250, y: 200 }, type: "nautilusNode" },
        ])
        setEdges([{ id: "e1-2", source: "1", target: "2", animated: true }])
        return
      }
      const parsed = JSON.parse(raw)
      setNodes(parsed.nodes || [])
      setEdges(parsed.edges || [])
    } catch (err) {
      console.error("Failed to load canvas:", err)
    }
  }, [])

  // autosave with simple debounce
  useEffect(() => {
    const t = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ nodes, edges }))
      } catch (err) {
        console.error("Failed to save canvas:", err)
      }
    }, 600) // 600ms debounce

    return () => clearTimeout(t)
  }, [nodes, edges])

  const value = useMemo(
    () => ({
      nodes,
      setNodes,
      edges,
      setEdges,
      reactFlowInstance,
      setReactFlowInstance,
      selectedNodeId,
      setSelectedNodeId,
    }),
    [nodes, edges, reactFlowInstance, selectedNodeId]
  )

  // Listen to global import event
useEffect(() => {
  function handleImport(e: any) {
    const { nodes, edges } = e.detail
    setNodes(nodes)
    setEdges(edges)
  }

  function handleRunFlow() {
    // Simple validation logic
    if (nodes.length === 0) {
      alert("No nodes in the diagram.")
      return
    }

    const ids = new Set(nodes.map((n) => n.id))
    for (const edge of edges) {
      if (!ids.has(edge.source) || !ids.has(edge.target)) {
        alert("Invalid edges detected. Cannot run flow.")
        return
      }
    }

    alert("Flow executed successfully! (Simulation)")
  }

  window.addEventListener("nautilus-import", handleImport)
  window.addEventListener("nautilus-run", handleRunFlow)

  return () => {
    window.removeEventListener("nautilus-import", handleImport)
    window.removeEventListener("nautilus-run", handleRunFlow)
  }
}, [nodes, edges])


  return <FlowContext.Provider value={value}>{children}</FlowContext.Provider>
}
