/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/set-state-in-effect */
"use client"

import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from "react"
import type { Edge, Node, ReactFlowInstance } from "react-flow-renderer"
import LZString from "lz-string"

type FlowContextType = {
  nodes: Node<any>[]
  setNodes: (updater: React.SetStateAction<Node<any>[]>) => void
  edges: Edge<any>[]
  setEdges: (updater: React.SetStateAction<Edge<any>[]>) => void
  reactFlowInstance: ReactFlowInstance | null
  setReactFlowInstance: (r: ReactFlowInstance | null) => void
  selectedNodeId: string | null
  setSelectedNodeId: (id: string | null) => void

  projectName: string
  setProjectName: (name: string) => void

  // history API
  undo: () => void
  redo: () => void
  canUndo: boolean
  canRedo: boolean
  resetHistory: (snapshot?: { nodes: Node<any>[]; edges: Edge<any>[] }) => void

  // saved indicator
  isSaved: boolean
  markSaved: () => void
}

const FlowContext = createContext<FlowContextType | undefined>(undefined)

const STORAGE_KEY = "nautilus-canvas-v1"
const NAME_KEY = "nautilus-project-name"
const HISTORY_LIMIT = 50

export function useFlow() {
  const ctx = useContext(FlowContext)
  if (!ctx) throw new Error("useFlow must be used inside FlowProvider")
  return ctx
}

export function FlowProvider({ children }: { children: React.ReactNode }) {
  const [nodes, setNodesRaw] = useState<Node<any>[]>([])
  const [edges, setEdgesRaw] = useState<Edge<any>[]>([])
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null)
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const [projectName, setProjectName] = useState("Untitled Design")

  // history state (not directly in React state to avoid frequent re-renders)
  const historyRef = useRef<{ nodes: Node<any>[]; edges: Edge<any>[] }[]>([])
  const historyIndexRef = useRef<number>(-1)

  // saved indicator
  const [isSaved, setIsSaved] = useState(true)
  const saveTimeoutRef = useRef<number | null>(null)

  // Helper to set nodes/edges and push history
  // We wrap the setters to intercept changes and push history.
  const setNodes = (updater: React.SetStateAction<Node<any>[]>) => {
    setNodesRaw((prev) => {
      const next = typeof updater === "function" ? (updater as any)(prev) : updater
      pushHistory(next, edges)
      setIsSaved(false)
      return next
    })
  }

  const setEdges = (updater: React.SetStateAction<Edge<any>[]>) => {
    setEdgesRaw((prev) => {
      const next = typeof updater === "function" ? (updater as any)(prev) : updater
      pushHistory(nodes, next)
      setIsSaved(false)
      return next
    })
  }

  // Load from storage or shared URL at mount
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search)
      const shared = params.get("d")

      if (shared) {
        const payload = JSON.parse(LZString.decompressFromEncodedURIComponent(shared) || "{}")
        setNodesRaw(payload.nodes || [])
        setEdgesRaw(payload.edges || [])
        if (payload.name) setProjectName(payload.name)

        // initialize history with loaded snapshot
        resetHistory({ nodes: payload.nodes || [], edges: payload.edges || [] })
        setIsSaved(true)
        return
      }

      const savedName = localStorage.getItem(NAME_KEY)
      if (savedName) setProjectName(savedName)

      const raw = localStorage.getItem(STORAGE_KEY)
      if (!raw) {
        const initialNodes = [
          { id: "1", data: { label: "Web Server" }, position: { x: 250, y: 5 }, type: "nautilusNode" },
          { id: "2", data: { label: "Database" }, position: { x: 250, y: 200 }, type: "nautilusNode" },
        ]
        const initialEdges = [{ id: "e1-2", source: "1", target: "2", animated: true }]
        setNodesRaw(initialNodes)
        setEdgesRaw(initialEdges)
        resetHistory({ nodes: initialNodes, edges: initialEdges })
        setIsSaved(true)
        return
      }

      const parsed = JSON.parse(raw)
      setNodesRaw(parsed.nodes || [])
      setEdgesRaw(parsed.edges || [])
      resetHistory({ nodes: parsed.nodes || [], edges: parsed.edges || [] })
      setIsSaved(true)
    } catch (err) {
      console.error("Failed to load canvas:", err)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Autosave to localStorage (debounced)
  useEffect(() => {
    if (saveTimeoutRef.current) {
      window.clearTimeout(saveTimeoutRef.current)
    }
    saveTimeoutRef.current = window.setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ nodes, edges }))
        // mark saved briefly
        setIsSaved(true)
        // after 1.2s mark back to false if user changes again
        setTimeout(() => {
          setIsSaved(false)
        }, 1200)
      } catch (err) {
        console.error("Failed to save canvas:", err)
      }
    }, 600)

    return () => {
      if (saveTimeoutRef.current) {
        window.clearTimeout(saveTimeoutRef.current)
        saveTimeoutRef.current = null
      }
    }
  }, [nodes, edges])

  // persist project name
  useEffect(() => {
    try {
      localStorage.setItem(NAME_KEY, projectName)
    } catch (e) {
      // ignore
    }
  }, [projectName])

  // Push a snapshot into history (keeps pointer)
  function pushHistory(nSnapshot: Node<any>[], eSnapshot: Edge<any>[]) {
    // if identical to current history entry, skip
    const current = historyRef.current[historyIndexRef.current]
    const serialize = (s: any) => JSON.stringify(s)
    if (current && serialize(current.nodes) === serialize(nSnapshot) && serialize(current.edges) === serialize(eSnapshot)) {
      return
    }

    // cut future redo entries if any
    if (historyIndexRef.current < historyRef.current.length - 1) {
      historyRef.current = historyRef.current.slice(0, historyIndexRef.current + 1)
    }

    historyRef.current.push({ nodes: nSnapshot, edges: eSnapshot })
    historyIndexRef.current = historyRef.current.length - 1

    // cap history size
    if (historyRef.current.length > HISTORY_LIMIT) {
      historyRef.current.shift()
      historyIndexRef.current = historyRef.current.length - 1
    }
  }

  // undo
  function undo() {
    if (historyIndexRef.current <= 0) return
    historyIndexRef.current -= 1
    const snapshot = historyRef.current[historyIndexRef.current]
    if (snapshot) {
      // replace without pushing history
      setNodesRaw(snapshot.nodes)
      setEdgesRaw(snapshot.edges)
      setIsSaved(false)
    }
  }

  // redo
  function redo() {
    if (historyIndexRef.current >= historyRef.current.length - 1) return
    historyIndexRef.current += 1
    const snapshot = historyRef.current[historyIndexRef.current]
    if (snapshot) {
      setNodesRaw(snapshot.nodes)
      setEdgesRaw(snapshot.edges)
      setIsSaved(false)
    }
  }

  // reset history (init or on import)
  function resetHistory(snapshot?: { nodes: Node<any>[]; edges: Edge<any>[] }) {
    if (snapshot) {
      historyRef.current = [{ nodes: snapshot.nodes, edges: snapshot.edges }]
      historyIndexRef.current = 0
    } else {
      historyRef.current = [{ nodes, edges }]
      historyIndexRef.current = 0
    }
  }

  // Expose canUndo / canRedo
  const canUndo = historyIndexRef.current > 0
  const canRedo = historyIndexRef.current < historyRef.current.length - 1

  // Listen to global import event (if triggered externally)
  useEffect(() => {
    function handleImport(e: any) {
      const { nodes: importedNodes, edges: importedEdges, name } = e.detail
      setNodesRaw(importedNodes)
      setEdgesRaw(importedEdges)
      if (name) setProjectName(name)
      resetHistory({ nodes: importedNodes, edges: importedEdges })
      setIsSaved(true)
    }

    function handleRunFlow() {
      if (nodes.length === 0) {
        // no-op
        return
      }
      // run validation - no UI here (Toolbar shows toasts)
    }

    window.addEventListener("nautilus-import", handleImport)
    window.addEventListener("nautilus-run", handleRunFlow)

    return () => {
      window.removeEventListener("nautilus-import", handleImport)
      window.removeEventListener("nautilus-run", handleRunFlow)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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
      projectName,
      setProjectName,
      undo,
      redo,
      canUndo,
      canRedo,
      resetHistory,
      isSaved,
      markSaved: () => setIsSaved(true),
    }),
    // include minimal dependencies to avoid recreation too often
    [nodes, edges, reactFlowInstance, selectedNodeId, projectName, isSaved]
  )

  return <FlowContext.Provider value={value}>{children}</FlowContext.Provider>
}
