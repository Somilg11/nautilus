/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/set-state-in-effect */
"use client"

import React, {
  createContext,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react"
import type { Edge, Node, ReactFlowInstance } from "reactflow"
import LZString from "lz-string"
import { sanitizeDiagram } from "./diagram-io"
import { DEFAULT_LOAD_PARAMS, type LoadParams } from "./simulation-model"

type SelectionMode = "select" | "pan"

/**
 * `history: false` applies a change without an undo entry. Selection, measured
 * sizes and the intermediate frames of a drag are not edits, and recording them
 * used to cost a full snapshot of the diagram per mouse move.
 */
type SetOptions = { history?: boolean }

type FlowContextType = {
  nodes: Node<any>[]
  setNodes: (updater: React.SetStateAction<Node<any>[]>, options?: SetOptions) => void
  edges: Edge<any>[]
  setEdges: (updater: React.SetStateAction<Edge<any>[]>, options?: SetOptions) => void
  /** Record the current canvas as one undo step (used when a drag ends). */
  commitHistory: () => void
  reactFlowInstance: ReactFlowInstance | null
  setReactFlowInstance: (r: ReactFlowInstance | null) => void
  selectedNodeId: string | null
  setSelectedNodeId: (id: string | null) => void

  projectName: string
  setProjectName: (name: string) => void

  /** Load playground parameters; saved and shared with the diagram. */
  loadParams: LoadParams
  setLoadParams: (params: LoadParams) => void

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

/**
 * Canvas state is published through a store rather than as a context value.
 *
 * A context value that changes on every mouse move makes React walk the
 * subtree of every memoised component below it looking for consumers — which,
 * under a canvas, is every node and edge on screen, sixty times a second
 * during a drag. With a store the context itself never changes: components
 * that read canvas state subscribe to it, and nothing else is visited.
 */
type FlowStore = {
  get: () => FlowContextType
  subscribe: (listener: () => void) => () => void
  publish: (value: FlowContextType) => void
  notify: () => void
  /** Setters with a stable identity, for components that only write. */
  actions: FlowActions
}

export type FlowActions = Pick<FlowContextType, "setNodes" | "setEdges" | "setLoadParams">

function createFlowStore(): FlowStore {
  let current: FlowContextType | null = null
  const listeners = new Set<() => void>()

  const get = () => {
    if (!current) throw new Error("Flow state read before FlowProvider rendered")
    return current
  }

  return {
    get,
    subscribe(listener) {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    publish(value) {
      current = value
    },
    notify() {
      listeners.forEach((listener) => listener())
    },
    actions: {
      setNodes: (updater, options) => get().setNodes(updater, options),
      setEdges: (updater, options) => get().setEdges(updater, options),
      setLoadParams: (params) => get().setLoadParams(params),
    },
  }
}

const FlowContext = createContext<FlowStore | undefined>(undefined)

const STORAGE_KEY = "nautilus-canvas-v1"
const NAME_KEY = "nautilus-project-name"
const HISTORY_LIMIT = 50
const PASTE_OFFSET = 24

function useFlowStore() {
  const store = useContext(FlowContext)
  if (!store) throw new Error("useFlow must be used inside FlowProvider")
  return store
}

/** Canvas state. The calling component re-renders whenever it changes. */
export function useFlow() {
  const store = useFlowStore()
  return useSyncExternalStore(store.subscribe, store.get, store.get)
}

/**
 * Canvas setters only. Unlike `useFlow`, this never causes a re-render, so a
 * component that just loads a template is not redrawn on every drag frame.
 */
export function useFlowActions(): FlowActions {
  return useFlowStore().actions
}

export function FlowProvider({ children }: { children: React.ReactNode }) {
  const [nodes, setNodesRaw] = useState<Node<any>[]>([])
  const [edges, setEdgesRaw] = useState<Edge<any>[]>([])
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null)
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const [projectName, setProjectName] = useState("Untitled Design")
  const [loadParams, setLoadParams] = useState<LoadParams>(DEFAULT_LOAD_PARAMS)

  // selection mode (select/pan)
  const [selectionMode, setSelectionMode] = useState<SelectionMode>("select")

  // Mirrors of the latest state so the wrapped setters can compute the next
  // value (and snapshot history) outside of a React state updater.
  const nodesRef = useRef<Node<any>[]>([])
  const edgesRef = useRef<Edge<any>[]>([])
  useEffect(() => {
    nodesRef.current = nodes
    edgesRef.current = edges
  }, [nodes, edges])

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
    // Snapshots are immutable arrays, so identity is enough to spot a no-op —
    // serialising the whole diagram here made every change O(diagram).
    const current = historyRef.current[historyIndexRef.current]
    if (current && current.nodes === nSnapshot && current.edges === eSnapshot) return

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

  /*
    Wrapped setters: push a history snapshot and mark the doc unsaved.

    The next value is computed from a ref instead of inside the state updater —
    updaters must stay pure, and React invokes them twice in development, which
    used to duplicate history entries and trigger cross-component updates.
  */
  const setNodes = (updater: React.SetStateAction<Node<any>[]>, options?: SetOptions) => {
    const next = typeof updater === "function" ? (updater as any)(nodesRef.current) : updater
    if (next === nodesRef.current) return
    nodesRef.current = next
    if (options?.history !== false) pushHistory(next, edgesRef.current)
    setIsSaved(false)
    setNodesRaw(next)
  }

  const setEdges = (updater: React.SetStateAction<Edge<any>[]>, options?: SetOptions) => {
    const next = typeof updater === "function" ? (updater as any)(edgesRef.current) : updater
    if (next === edgesRef.current) return
    edgesRef.current = next
    if (options?.history !== false) pushHistory(nodesRef.current, next)
    setIsSaved(false)
    setEdgesRaw(next)
  }

  const commitHistory = () => pushHistory(nodesRef.current, edgesRef.current)

  /* ------------------------------
      Load / save / autosave
  ------------------------------ */
  useEffect(() => {
    /** Load an untrusted payload (share link or localStorage) safely. */
    function load(raw: unknown, source: string) {
      const { diagram, notes } = sanitizeDiagram(raw)
      if (notes.length > 0) {
        console.warn(`Repaired diagram from ${source}:`, notes)
      }
      setNodesRaw(diagram.nodes as Node<any>[])
      setEdgesRaw(diagram.edges as Edge<any>[])
      if (diagram.name) setProjectName(diagram.name)
      if (diagram.sim) setLoadParams({ ...DEFAULT_LOAD_PARAMS, ...diagram.sim })
      resetHistory({
        nodes: diagram.nodes as Node<any>[],
        edges: diagram.edges as Edge<any>[],
      })
      setIsSaved(true)
    }

    try {
      const params = new URLSearchParams(window.location.search)
      const shared = params.get("d")

      if (shared) {
        const decompressed = LZString.decompressFromEncodedURIComponent(shared)
        if (!decompressed) throw new Error("Share link is corrupt")
        load(JSON.parse(decompressed), "share link")
        return
      }

      const savedName = localStorage.getItem(NAME_KEY)
      if (savedName) setProjectName(savedName)

      const raw = localStorage.getItem(STORAGE_KEY)
      if (!raw) {
        const initialNodes = [
          { id: "1", data: { label: "Web Server", icon: "web_server", color: "green" }, position: { x: 250, y: 5 }, type: "nautilusNode" },
          { id: "2", data: { label: "Database", icon: "database_sql", color: "red" }, position: { x: 250, y: 200 }, type: "nautilusNode" },
        ]
        const initialEdges = [{ id: "e1-2", source: "1", target: "2", type: "deletableEdge", animated: true }]
        setNodesRaw(initialNodes)
        setEdgesRaw(initialEdges)
        resetHistory({ nodes: initialNodes, edges: initialEdges })
        setIsSaved(true)
        return
      }

      load(JSON.parse(raw), "local storage")
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
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ nodes, edges, sim: loadParams }))
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
  }, [nodes, edges, loadParams])

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

  /*
    Canvas-level operations (copy/paste/group/align/zoom) are handled in
    components/canvas.tsx, which has access to measured node sizes. They used
    to be bound here as well, so every toolbar click ran twice — pasting two
    copies, deleting twice, and fighting over the grouping model.
  */

  /* ------------------------------
        Global import listener
  ------------------------------ */
  useEffect(() => {
    function handleImport(e: any) {
      try {
        const { diagram } = sanitizeDiagram(e.detail)
        setNodesRaw(diagram.nodes as Node<any>[])
        setEdgesRaw(diagram.edges as Edge<any>[])
        if (diagram.name) setProjectName(diagram.name)
        if (diagram.sim) setLoadParams({ ...DEFAULT_LOAD_PARAMS, ...diagram.sim })
        resetHistory({
          nodes: diagram.nodes as Node<any>[],
          edges: diagram.edges as Edge<any>[],
        })
        setIsSaved(true)
      } catch (err) {
        console.error("Import rejected:", err)
      }
    }

    window.addEventListener("nautilus-import", handleImport)

    return () => {
      window.removeEventListener("nautilus-import", handleImport)
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
      commitHistory,
      reactFlowInstance,
      setReactFlowInstance,
      selectedNodeId,
      setSelectedNodeId,
      projectName,
      setProjectName,
      loadParams,
      setLoadParams,
      undo,
      redo,
      // History lives in refs so recording it never re-renders. Every change
      // to it comes with a state change, so these are current at render time.
      // eslint-disable-next-line react-hooks/refs
      canUndo: canUndo(),
      // eslint-disable-next-line react-hooks/refs
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
    [nodes, edges, reactFlowInstance, selectedNodeId, projectName, loadParams, isSaved, selectionMode]
  )

  const [store] = useState(createFlowStore)

  // Published during render so children mounting in this same pass can read
  // it; subscribers that are already mounted are told once it has committed.
  // eslint-disable-next-line react-hooks/refs
  store.publish(value)
  useLayoutEffect(() => {
    store.notify()
  }, [store, value])

  return <FlowContext.Provider value={store}>{children}</FlowContext.Provider>
}
