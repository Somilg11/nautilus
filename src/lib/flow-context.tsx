/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/set-state-in-effect */
"use client"

import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from "react"
import type { Edge, Node, ReactFlowInstance } from "react-flow-renderer"
import LZString from "lz-string"

type SelectionMode = "select" | "pan"

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

  // editing tools API
  selectionMode: SelectionMode
  setSelectionMode: (m: SelectionMode) => void

  copySelected: () => void
  pasteClipboard: () => void
  duplicateSelected: () => void
  deleteSelected: () => void

  alignSelected: (mode: "left" | "center" | "right" | "group" | "ungroup" | "distribute-h") => void
  groupSelected: () => void
  ungroupSelected: () => void
  distributeHorizontally: () => void

  fitView: () => void
  zoomIn: () => void
  zoomOut: () => void
}

const FlowContext = createContext<FlowContextType | undefined>(undefined)

const STORAGE_KEY = "nautilus-canvas-v1"
const NAME_KEY = "nautilus-project-name"
const HISTORY_LIMIT = 50
const PASTE_OFFSET = 24

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

  // selection mode (select/pan)
  const [selectionMode, setSelectionMode] = useState<SelectionMode>("select")

  // history refs (avoid re-renders)
  const historyRef = useRef<{ nodes: Node<any>[]; edges: Edge<any>[] }[]>([])
  const historyIndexRef = useRef<number>(-1)

  // clipboard for copy/paste
  const clipboardRef = useRef<{ nodes: Node<any>[]; edges: Edge<any>[] } | null>(null)
  const pasteCountRef = useRef<number>(0)

  // saved indicator
  const [isSaved, setIsSaved] = useState(true)
  const saveTimeoutRef = useRef<number | null>(null)

  /* ------------------------------
     Helpers: snapshots / history
  ------------------------------ */

  function pushHistory(nSnapshot: Node<any>[], eSnapshot: Edge<any>[]) {
    const current = historyRef.current[historyIndexRef.current]
    const serialize = (s: any) => JSON.stringify(s)
    if (current && serialize(current.nodes) === serialize(nSnapshot) && serialize(current.edges) === serialize(eSnapshot)) {
      return
    }

    if (historyIndexRef.current < historyRef.current.length - 1) {
      historyRef.current = historyRef.current.slice(0, historyIndexRef.current + 1)
    }

    historyRef.current.push({ nodes: nSnapshot, edges: eSnapshot })
    historyIndexRef.current = historyRef.current.length - 1

    if (historyRef.current.length > HISTORY_LIMIT) {
      historyRef.current.shift()
      historyIndexRef.current = historyRef.current.length - 1
    }
  }

  function resetHistory(snapshot?: { nodes: Node<any>[]; edges: Edge<any>[] }) {
    if (snapshot) {
      historyRef.current = [{ nodes: snapshot.nodes, edges: snapshot.edges }]
      historyIndexRef.current = 0
    } else {
      historyRef.current = [{ nodes, edges }]
      historyIndexRef.current = 0
    }
  }

  function canUndo() {
    return historyIndexRef.current > 0
  }

  function canRedo() {
    return historyIndexRef.current < historyRef.current.length - 1
  }

  // wrapped setters (push history and mark unsaved)
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

  /* ------------------------------
      Load / save / autosave
  ------------------------------ */
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search)
      const shared = params.get("d")

      if (shared) {
        const payload = JSON.parse(LZString.decompressFromEncodedURIComponent(shared) || "{}")
        setNodesRaw(payload.nodes || [])
        setEdgesRaw(payload.edges || [])
        if (payload.name) setProjectName(payload.name)

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

  useEffect(() => {
    if (saveTimeoutRef.current) {
      window.clearTimeout(saveTimeoutRef.current)
    }
    saveTimeoutRef.current = window.setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ nodes, edges }))
        setIsSaved(true)
        // transient saved indicator
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

  useEffect(() => {
    try {
      localStorage.setItem(NAME_KEY, projectName)
    } catch {
      // ignore
    }
  }, [projectName])

  /* ------------------------------
        Undo / Redo
  ------------------------------ */
  function undo() {
    if (historyIndexRef.current <= 0) return
    historyIndexRef.current -= 1
    const snapshot = historyRef.current[historyIndexRef.current]
    if (snapshot) {
      setNodesRaw(snapshot.nodes)
      setEdgesRaw(snapshot.edges)
      setIsSaved(false)
    }
  }

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

  /* ------------------------------
      Selection helpers
  ------------------------------ */
  const selectedNodeIds = () => nodes.filter((n) => (n as any).selected).map((n) => n.id)

  /* ------------------------------
      Copy / Paste / Duplicate / Delete
  ------------------------------ */

  function deepClone<T>(obj: T): T {
    return JSON.parse(JSON.stringify(obj))
  }

  function copySelected() {
    const selIds = new Set(selectedNodeIds())
    if (selIds.size === 0) return
    const copiedNodes = nodes.filter((n) => selIds.has(n.id)).map((n) => deepClone(n))
    const copiedEdges = edges.filter((e) => selIds.has((e as any).source) && selIds.has((e as any).target)).map((e) => deepClone(e))
    clipboardRef.current = { nodes: copiedNodes, edges: copiedEdges }
    pasteCountRef.current = 0
    // mark saved? no
  }

  function pasteClipboard() {
    if (!clipboardRef.current) return
    const mapping: Record<string, string> = {}
    const base = clipboardRef.current
    const offset = (pasteCountRef.current + 1) * PASTE_OFFSET
    pasteCountRef.current += 1

    // create new nodes with new ids and offset positions
    const newNodes = base.nodes.map((n) => {
      const newId = crypto.randomUUID()
      mapping[n.id] = newId
      const pos = n.position || { x: 100, y: 100 }
      return {
        ...deepClone(n),
        id: newId,
        position: { x: pos.x + offset, y: pos.y + offset },
      }
    })

    // create new edges remapping source/target
    const newEdges = base.edges.map((e) => {
      const src = (e as any).source
      const tgt = (e as any).target
      // only include edges between copied nodes (they are in mapping)
      if (!mapping[src] || !mapping[tgt]) return null
      return {
        ...deepClone(e),
        id: crypto.randomUUID(),
        source: mapping[src],
        target: mapping[tgt],
      }
    }).filter(Boolean) as Edge<any>[]

    // append
    setNodes((prev) => [...prev, ...newNodes])
    setEdges((prev) => [...prev, ...newEdges])
    // select newly pasted nodes (set their selected flag)
    setTimeout(() => {
      setNodes((prev) => prev.map((n) => ({ ...n, selected: newNodes.some((nn) => nn.id === n.id) })))
    }, 10)
  }

  function duplicateSelected() {
    copySelected()
    pasteClipboard()
  }

  function deleteSelected() {
    const sel = new Set(selectedNodeIds())
    if (sel.size === 0) return
    setNodes((prev) => prev.filter((n) => !sel.has(n.id)))
    setEdges((prev) => prev.filter((e) => !sel.has((e as any).source) && !sel.has((e as any).target)))
    // clear selection
    setSelectedNodeId(null)
  }

  /* ------------------------------
       Group / Ungroup (lightweight)
  ------------------------------ */
  function groupSelected() {
    const sel = new Set(selectedNodeIds())
    if (sel.size === 0) return
    setNodes((prev) => prev.map((n) => sel.has(n.id) ? ({ ...n, data: { ...n.data, __group: true } }) : n))
  }

  function ungroupSelected() {
    const sel = new Set(selectedNodeIds())
    if (sel.size === 0) return
    setNodes((prev) => prev.map((n) => sel.has(n.id) ? ({ ...n, data: { ...n.data, __group: undefined } }) : n))
  }

  /* ------------------------------
        Align / Distribute
  ------------------------------ */
  function alignSelected(mode: "left" | "center" | "right" | "group" | "ungroup" | "distribute-h") {
    const selIds = selectedNodeIds()
    if (selIds.length === 0) return

    const selected = nodes.filter((n) => selIds.includes(n.id))
    if (selected.length === 0) return

    if (mode === "left" || mode === "center" || mode === "right") {
      // compute anchor
      const xs = selected.map((n) => (n.position as any)?.x ?? 0)
      let anchorX = xs[0]
      if (mode === "left") anchorX = Math.min(...xs)
      else if (mode === "right") anchorX = Math.max(...xs)
      else if (mode === "center") anchorX = Math.round(xs.reduce((a, b) => a + b, 0) / xs.length)

      setNodes((prev) =>
        prev.map((n) =>
          selIds.includes(n.id) ? { ...n, position: { ...n.position, x: anchorX } } : n
        )
      )
      return
    }

    if (mode === "distribute-h") {
      // distribute horizontally between min and max x
      const sorted = selected.slice().sort((a, b) => ((a.position as any).x || 0) - ((b.position as any).x || 0))
      const minX = (sorted[0].position as any).x || 0
      const maxX = (sorted[sorted.length - 1].position as any).x || 0
      if (sorted.length <= 2) return // nothing to distribute
      const gap = (maxX - minX) / (sorted.length - 1)
      setNodes((prev) =>
        prev.map((n) => {
          const idx = sorted.findIndex((s) => s.id === n.id)
          if (idx === -1) return n
          return { ...n, position: { ...n.position, x: Math.round(minX + gap * idx) } }
        })
      )
      return
    }

    // fallback noop for group/ungroup (handled by groupSelected/ungroupSelected)
  }

  function distributeHorizontally() {
    alignSelected("distribute-h")
  }

  /* ------------------------------
        View / Zoom helpers
  ------------------------------ */
  function fitView() {
    reactFlowInstance?.fitView({ padding: 0.2 })
  }

  function zoomIn() {
    // react-flow has zoomIn on instance
    if (reactFlowInstance && typeof (reactFlowInstance as any).zoomIn === "function") {
      ;(reactFlowInstance as any).zoomIn()
    } else {
      // fallback: setTransform
      const cur = (reactFlowInstance as any)?._viewport?.scale ?? 1
      reactFlowInstance?.setViewport({ x: 0, y: 0, zoom: Math.min(2, cur + 0.2) })
    }
  }

  function zoomOut() {
    if (reactFlowInstance && typeof (reactFlowInstance as any).zoomOut === "function") {
      ;(reactFlowInstance as any).zoomOut()
    } else {
      const cur = (reactFlowInstance as any)?._viewport?.scale ?? 1
      reactFlowInstance?.setViewport({ x: 0, y: 0, zoom: Math.max(0.1, cur - 0.2) })
    }
  }

  /* ------------------------------
      Window event bindings for toolbar / edit buttons
  ------------------------------ */
  useEffect(() => {
    function onAlignLeft() { alignSelected("left") }
    function onAlignCenter() { alignSelected("center") }
    function onAlignRight() { alignSelected("right") }
    function onDistributeH() { distributeHorizontally() }
    function onGroup() { groupSelected() }
    function onUngroup() { ungroupSelected() }
    function onCopy() { copySelected() }
    function onPaste() { pasteClipboard() }
    function onDelete() { deleteSelected() }

    window.addEventListener("nautilus-align-left", onAlignLeft)
    window.addEventListener("nautilus-align-center", onAlignCenter)
    window.addEventListener("nautilus-align-right", onAlignRight)
    window.addEventListener("nautilus-distribute-h", onDistributeH)
    window.addEventListener("nautilus-group", onGroup)
    window.addEventListener("nautilus-ungroup", onUngroup)
    window.addEventListener("nautilus-copy", onCopy)
    window.addEventListener("nautilus-paste", onPaste)
    window.addEventListener("nautilus-delete", onDelete)

    return () => {
      window.removeEventListener("nautilus-align-left", onAlignLeft)
      window.removeEventListener("nautilus-align-center", onAlignCenter)
      window.removeEventListener("nautilus-align-right", onAlignRight)
      window.removeEventListener("nautilus-distribute-h", onDistributeH)
      window.removeEventListener("nautilus-group", onGroup)
      window.removeEventListener("nautilus-ungroup", onUngroup)
      window.removeEventListener("nautilus-copy", onCopy)
      window.removeEventListener("nautilus-paste", onPaste)
      window.removeEventListener("nautilus-delete", onDelete)
    }
    // depend on nodes/edges to have fresh selection logic
  }, [nodes, edges])

  /* ------------------------------
        Global import/run listeners (existing)
  ------------------------------ */
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
        return
      }
      // toolbar shows toasts; run logic elsewhere
    }

    window.addEventListener("nautilus-import", handleImport)
    window.addEventListener("nautilus-run", handleRunFlow)

    return () => {
      window.removeEventListener("nautilus-import", handleImport)
      window.removeEventListener("nautilus-run", handleRunFlow)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /* ------------------------------
         Context value
  ------------------------------ */
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
      canUndo: canUndo(),
      canRedo: canRedo(),
      resetHistory,
      isSaved,
      markSaved: () => setIsSaved(true),

      // editing tools
      selectionMode,
      setSelectionMode,
      copySelected,
      pasteClipboard,
      duplicateSelected,
      deleteSelected,
      alignSelected,
      groupSelected,
      ungroupSelected,
      distributeHorizontally,
      fitView,
      zoomIn,
      zoomOut,
    }),
    // include minimal dependencies
    [nodes, edges, reactFlowInstance, selectedNodeId, projectName, isSaved, selectionMode]
  )

  return <FlowContext.Provider value={value}>{children}</FlowContext.Provider>
}
