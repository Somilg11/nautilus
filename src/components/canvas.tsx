/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import React, { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react"
import ReactFlow, {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  Panel,
  ReactFlowInstance,
  NodeChange,
  EdgeChange,
  Connection,
} from "reactflow"

import { toast } from "sonner"

import { createNode } from "@/lib/flow-utils"
import { useFlow } from "@/lib/flow-context"
import NautilusNode from "@/components/nodes/NautilusNode"
import SimulationPanel, { type LoadController } from "@/components/simulation-panel"
import { useSimulation } from "@/lib/use-simulation"
import { useLoadEngine } from "@/lib/use-load-engine"
import { createGraphProjector } from "@/lib/sim-graph"
import { createEdgeDecorator, createNodeDecorator } from "@/lib/canvas-decorate"
import { computeSequence } from "@/lib/flow-ops"
import { capacityReport, type SimulationReport } from "@/lib/simulation-model"
import "reactflow/dist/style.css"
import "@/styles/canvas.css"

import DeletableEdge from "@/components/edges/deletable-edge"
import FlowMarkers from "@/components/edges/flow-markers"

import GroupNode from "@/components/nodes/GroupNode"

const nodeTypes = { nautilusNode: NautilusNode, groupNode: GroupNode }

/** Keep the minimap readable by mirroring the node colour palette. */
function miniMapColor(color?: string) {
  switch (color) {
    case "blue":
      return "#2563eb"
    case "green":
      return "#16a34a"
    case "red":
      return "#dc2626"
    case "yellow":
      return "#eab308"
    case "purple":
      return "#9333ea"
    case "orange":
      return "#f97316"
    default:
      return "#71717a"
  }
}
const miniMapNodeColor = (n: { data?: { color?: string } }) => miniMapColor(n.data?.color)

const edgeTypes = { deletableEdge: DeletableEdge }

let CLIPBOARD: { nodes: any[]; edges: any[] } | null = null

/**
 * Past this many nodes and connections the canvas drops its decorative
 * effects — marching-ants edges, glow filters — which cost far more to paint
 * than the diagram itself.
 */
const LITE_ELEMENT_COUNT = 220
/** The minimap redraws every node on every change, so it goes first. */
const MINIMAP_NODE_LIMIT = 400
const MINIMAP_NODE_LIMIT_LOW_END = 120

/** Schedules given to self-starting components when they are dropped in. */
const DEFAULT_SCHEDULES: Record<string, { kind: "cron" | "worker"; everyMs: number; batch: number }> = {
  cron: { kind: "cron", everyMs: 60_000, batch: 1 },
  worker: { kind: "worker", everyMs: 1000, batch: 1 },
}

const subscribeNever = () => () => {}

/** Few cores, little memory, or an explicit request for less motion. */
function isLowEndDevice() {
  const nav = navigator as Navigator & { deviceMemory?: number }
  return (
    (nav.hardwareConcurrency ?? 8) <= 4 ||
    (nav.deviceMemory ?? 8) <= 4 ||
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  )
}

/* --------------------------------
        MAIN CANVAS
--------------------------------- */

export default function Canvas({ onOpenSidebar }: { onOpenSidebar: () => void }) {
  const wrapperRef = useRef<HTMLDivElement | null>(null)

  const {
    nodes,
    edges,
    setNodes,
    setEdges,
    commitHistory,
    undo,
    redo,
    reactFlowInstance,
    setReactFlowInstance,
    setSelectedNodeId,
    projectName,
    loadParams,
    setLoadParams,
  } = useFlow()

  /* -----------------------------
        SIMULATION INPUT

     Positions, selection and measured sizes change constantly and mean
     nothing to a simulation. The projector returns the same graph until
     something structural changes, so nothing below re-runs during a drag.
  ------------------------------ */
  const [projectGraph] = useState(createGraphProjector)
  const simGraph = useMemo(() => projectGraph(nodes, edges), [projectGraph, nodes, edges])

  /** Which request goes where, in order. Drives the numbers on the edges. */
  const sequence = useMemo(
    () => computeSequence(simGraph.nodes, simGraph.edges),
    [simGraph]
  )

  const sim = useSimulation(simGraph, sequence, {
    onError: (m) => toast.error(m),
    onWarn: (m) => toast.warning(m),
  })

  const lowEnd = useSyncExternalStore(subscribeNever, isLowEndDevice, () => false)
  const lite = lowEnd || nodes.length + edges.length > LITE_ELEMENT_COUNT
  const showMiniMap =
    nodes.length <= (lowEnd ? MINIMAP_NODE_LIMIT_LOW_END : MINIMAP_NODE_LIMIT)

  /* -----------------------------
        LOAD PLAYGROUND

     Steady-state model, re-run on every parameter or graph change so the
     numbers track edits live. It runs in a Web Worker in this browser — the
     graph is compiled there once per edit, and a run plus its 24-point ramp
     never blocks the canvas or leaves the machine. Results are render-only,
     like trace marks.
  ------------------------------ */
  const [loadOn, setLoadOn] = React.useState(false)
  /** Pinned run to compare against while tuning. */
  const [baseline, setBaseline] = React.useState<SimulationReport | null>(null)

  const { report: loadReport, ramp, stats: engineStats } = useLoadEngine(
    loadOn,
    simGraph,
    loadParams
  )

  /** Merge a patch into one node's `data.sim`, dropping emptied fields. */
  const patchNodeSim = (id: string, patch: Record<string, unknown>) => {
    setNodes((prev) =>
      prev.map((n) => {
        if (n.id !== id) return n
        const sim = { ...(n.data?.sim ?? {}), ...patch }
        Object.keys(sim).forEach((k) => {
          if (sim[k] === undefined || sim[k] === false) delete sim[k]
        })
        return { ...n, data: { ...n.data, sim: Object.keys(sim).length ? sim : undefined } }
      })
    )
  }

  const load: LoadController = {
    enabled: loadOn,
    params: loadParams,
    setParams: setLoadParams,
    report: loadReport,
    ramp,
    stats: engineStats,
    baseline,
    disable: () => setLoadOn(false),

    pinBaseline: () => {
      setBaseline(loadReport)
      toast.success("Baseline pinned — changes now show as deltas")
    },

    clearBaseline: () => setBaseline(null),

    copyReport: async () => {
      if (!loadReport) return
      try {
        await navigator.clipboard.writeText(capacityReport(loadReport, projectName))
        toast.success("Capacity report copied as Markdown")
      } catch {
        toast.error("Could not copy the report")
      }
    },


    applyReplicas: (id, replicas) => {
      patchNodeSim(id, { replicas })
      toast.success(`Scaled ${loadReport?.metrics[id]?.label ?? id} to ${replicas} replicas`)
    },

    applyAllScaling: () => {
      const advice = loadReport?.summary.scaleAdvice ?? []
      if (advice.length === 0) return

      const wanted = new Map(advice.map((a) => [a.id, a.required]))
      setNodes((prev) =>
        prev.map((n) =>
          wanted.has(n.id)
            ? { ...n, data: { ...n.data, sim: { ...(n.data?.sim ?? {}), replicas: wanted.get(n.id) } } }
            : n
        )
      )
      toast.success(`Scaled ${advice.length} node(s) to the target utilisation`)
    },

    toggleDown: (id) => {
      const isDown = Boolean((nodes.find((n) => n.id === id)?.data?.sim as any)?.down)
      patchNodeSim(id, { down: !isDown })
    },

    restoreAll: () => {
      setNodes((prev) =>
        prev.map((n) => {
          const sim = n.data?.sim as Record<string, unknown> | undefined
          if (!sim?.down) return n
          const next = { ...sim }
          delete next.down
          return { ...n, data: { ...n.data, sim: Object.keys(next).length ? next : undefined } }
        })
      )
      toast.success("All nodes restored")
    },

    focusEdge: (id: string) => {
      const edge = edges.find((e) => e.id === id)
      if (!edge) return
      setSelectedNodeId(null)
      setNodes((prev) => prev.map((n) => (n.selected ? { ...n, selected: false } : n)), { history: false })
      setEdges((prev) => prev.map((e) => (Boolean(e.selected) === (e.id === id) ? e : { ...e, selected: e.id === id })), {
        history: false,
      })
      const a = nodes.find((n) => n.id === edge.source)
      const b = nodes.find((n) => n.id === edge.target)
      if (a && b) {
        reactFlowInstance?.setCenter(
          (a.position.x + b.position.x) / 2 + 80,
          (a.position.y + b.position.y) / 2 + 40,
          { zoom: 1.1, duration: 400 }
        )
      }
    },

    focusNode: (id: string) => {
      setSelectedNodeId(id)
      setNodes(
        (prev) => prev.map((n) => (Boolean(n.selected) === (n.id === id) ? n : { ...n, selected: n.id === id })),
        { history: false }
      )
      const node = nodes.find((n) => n.id === id)
      if (node) reactFlowInstance?.setCenter(node.position.x + 80, node.position.y + 40, { zoom: 1.2, duration: 400 })
    },
  }

  /* -----------------------------
        INIT INSTANCE
  ------------------------------ */
  const onInit = (instance: ReactFlowInstance) => {
    setReactFlowInstance(instance)
  }

  /* -----------------------------
        DRAG & DROP
  ------------------------------ */
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

    // Cron jobs and workers arrive already running, so the flow shows them
    // starting work on their own instead of waiting for a caller.
    const schedule = DEFAULT_SCHEDULES[compId]
    if (schedule) newNode.data.sim = { schedule }

    setNodes((prev) => [...prev, newNode])
  }

  /* -----------------------------
        NODE CLICK / DOUBLE CLICK
  ------------------------------ */
  const onNodeClick = (e: any, node: any) => {
    if (!e.shiftKey && !e.ctrlKey && !e.metaKey) {
      setSelectedNodeId(node.id)
    }
  }

  const onNodeDoubleClick = (_e: any, node: any) => {
    setSelectedNodeId(node.id)
    onOpenSidebar()
  }

  // The inspector shows a connection's request details when no node is picked.
  const onEdgeClick = () => setSelectedNodeId(null)

  const onEdgeDoubleClick = (_e: any, edge: any) => {
    setSelectedNodeId(null)
    setEdges((prev) => prev.map((e) => (e.selected === (e.id === edge.id) ? e : { ...e, selected: e.id === edge.id })), {
      history: false,
    })
    onOpenSidebar()
  }

  /* -----------------------------
       APPLY NODE CHANGES
  ------------------------------ */
  /** True once a drag has actually moved something, so a click is not an edit. */
  const movedRef = useRef(false)

  const onNodesChange = (changes: NodeChange[]) => {
    let dragEnded = false

    // None of these are undo steps on their own: selection and measured sizes
    // are not edits, and a drag is one edit, recorded when it ends.
    setNodes(
      (prev) => {
        let updated: typeof prev | null = null
        let index: Map<string, number> | null = null

        for (const c of changes) {
          if (c.type !== "position" && c.type !== "select" && c.type !== "dimensions") continue

          // One id lookup table per batch: the first render of a large diagram
          // reports every node's size at once.
          index ??= new Map(prev.map((n, i) => [n.id, i]))
          const i = index.get(c.id)
          if (i === undefined) continue

          const current = (updated ?? prev)[i]
          let next = current

          if (c.type === "position") {
            if (c.position) {
              next = { ...current, position: c.position }
              movedRef.current = true
            }
            if (c.dragging === false) dragEnded = true
          } else if (c.type === "select") {
            if (Boolean(current.selected) !== c.selected) next = { ...current, selected: c.selected }
          } else if (c.dimensions) {
            // Measured size matters for alignment and grouping.
            if (current.width !== c.dimensions.width || current.height !== c.dimensions.height) {
              next = {
                ...current,
                width: c.dimensions.width,
                height: c.dimensions.height,
                measured: { ...c.dimensions },
              } as any
            }
          }

          if (next !== current) {
            updated ??= [...prev]
            updated[i] = next
          }
        }

        return updated ?? prev
      },
      { history: false }
    )

    if (dragEnded && movedRef.current) {
      movedRef.current = false
      commitHistory()
    }
  }

  /* -----------------------------
       APPLY EDGE CHANGES
  ------------------------------ */
  const onEdgesChange = (changes: EdgeChange[]) => {
    const removes = changes.some((c) => c.type === "remove")

    setEdges(
      (prev) => {
        let updated: typeof prev | null = null
        for (const c of changes) {
          if (c.type === "remove") {
            updated = (updated ?? prev).filter((e) => e.id !== c.id)
          } else if (c.type === "select") {
            const list = updated ?? prev
            const index = list.findIndex((e) => e.id === c.id)
            if (index !== -1 && Boolean(list[index].selected) !== c.selected) {
              updated ??= [...prev]
              updated[index] = { ...updated[index], selected: c.selected }
            }
          }
        }
        return updated ?? prev
      },
      { history: removes }
    )
  }

  /* -----------------------------
        CONNECT NODES
  ------------------------------ */
  const onConnect = (params: Connection) => {
    const edge = {
      id: crypto.randomUUID(),
      source: params.source ?? "",
      target: params.target ?? "",
      sourceHandle: params.sourceHandle ?? undefined,
      targetHandle: params.targetHandle ?? undefined,
      type: "deletableEdge",
    }

    setEdges((prev) => [...prev, edge])
  }

  /* -----------------------------
    SELECTION HELPERS
  ------------------------------ */
  function getSelectedNodes() {
    return nodes.filter((n) => (n as any).selected)
  }
  function getSelectedNodeIds() {
    return getSelectedNodes().map((n) => n.id)
  }
  function getSelectedEdges() {
    return edges.filter((e) => (e as any).selected)
  }

  /* -----------------------------
      DELETE SELECTED NODES/EDGES
  ------------------------------ */
  function deleteSelected() {
    const nodeIds = new Set(getSelectedNodeIds())
    const edgeIds = new Set(getSelectedEdges().map((e) => e.id))

    setNodes((prev) => prev.filter((n) => !nodeIds.has(n.id)))
    setEdges((prev) =>
      prev.filter(
        (e) =>
          !nodeIds.has(e.source) &&
          !nodeIds.has(e.target) &&
          !edgeIds.has(e.id)
      )
    )

    setSelectedNodeId(null)
  }

  /* -----------------------------
        COPY / PASTE
  ------------------------------ */
  function copySelected() {
    const selectedNodes = getSelectedNodes()
    const selectedEdges = getSelectedEdges()

    CLIPBOARD = {
      nodes: JSON.parse(JSON.stringify(selectedNodes)),
      edges: JSON.parse(JSON.stringify(selectedEdges)),
    }
  }

  function pasteClipboard() {
    if (!CLIPBOARD) return

    const mapOldToNew = new Map()

    const pastedNodes = CLIPBOARD.nodes.map((n: any) => {
      const newId = crypto.randomUUID()
      mapOldToNew.set(n.id, newId)
      return {
        ...n,
        id: newId,
        position: { x: n.position.x + 25, y: n.position.y + 25 },
        selected: true,
      }
    })

    const pastedEdges = CLIPBOARD.edges.map((e: any) => ({
      ...e,
      id: crypto.randomUUID(),
      source: mapOldToNew.get(e.source),
      target: mapOldToNew.get(e.target),
      type: "deletableEdge",
    }))

    setNodes((prev) => prev.map((n) => ({ ...n, selected: false })).concat(pastedNodes))
    setEdges((prev) => prev.concat(pastedEdges))
  }

  function duplicateSelected() {
    copySelected()
    pasteClipboard()
  }

  /* -----------------------------
        GROUP / UNGROUP
  ------------------------------ */
  function groupSelected() {
    const sel = getSelectedNodes()
    if (sel.length < 2) return // Need at least 2 items to group, or 1 item to wrap? Let's say 1 is fine.

    // Calculate bounding box
    const minX = Math.min(...sel.map((n) => n.position.x))
    const minY = Math.min(...sel.map((n) => n.position.y))
    const maxX = Math.max(...sel.map((n) => n.position.x + ((n as any).measured?.width ?? n.width ?? 150)))
    const maxY = Math.max(...sel.map((n) => n.position.y + ((n as any).measured?.height ?? n.height ?? 100)))

    const padding = 20
    const groupId = crypto.randomUUID()

    const groupNode = {
      id: groupId,
      type: 'groupNode',
      position: { x: minX - padding, y: minY - padding },
      style: {
        width: maxX - minX + padding * 2,
        height: maxY - minY + padding * 2,
      },
      data: { label: 'Group' },
      selected: true,
      zIndex: -1,
    }

    // Update children to be relative to group
    const updatedChildren = sel.map((n) => ({
      ...n,
      parentNode: groupId,
      extent: 'parent' as const,
      position: {
        x: n.position.x - (minX - padding),
        y: n.position.y - (minY - padding),
      },
      selected: false,
      draggable: true, // Ensure draggable
    }))

    setNodes((prev) => {
      const otherNodes = prev.filter((n) => !sel.find((s) => s.id === n.id))
      return [...otherNodes, groupNode, ...updatedChildren]
    })
  }

  function ungroupSelected() {
    const sel = getSelectedNodes()
    const groupsToDissolve = sel.filter(n => n.type === 'groupNode')

    if (groupsToDissolve.length === 0) return

    setNodes((prev) => {
      let newNodes = [...prev]

      groupsToDissolve.forEach(group => {
        // Find children
        const children = newNodes.filter(n => n.parentNode === group.id)

        // Update children to be absolute
        const updatedChildren = children.map(child => ({
          ...child,
          parentNode: undefined,
          extent: undefined,
          position: {
            x: group.position.x + child.position.x,
            y: group.position.y + child.position.y,
          },
        }))

        // Remove group node and replace children
        newNodes = newNodes.filter(n => n.id !== group.id && n.parentNode !== group.id)
        newNodes.push(...updatedChildren)
      })

      return newNodes
    })
  }

  /* -----------------------------
       ALIGN / DISTRIBUTE / NUDGE
  ------------------------------ */
  function getWidth(n: any) {
    return (n as any).measured?.width ?? n.width ?? 150
  }

  function alignLeft() {
    const sel = getSelectedNodes()
    if (sel.length < 2) return
    const minX = Math.min(...sel.map((s) => s.position.x))

    setNodes((prev) =>
      prev.map((n) =>
        (n as any).selected
          ? { ...n, position: { ...n.position, x: minX } }
          : n
      )
    )
  }

  function alignCenter() {
    const sel = getSelectedNodes()
    if (sel.length < 2) return

    const centers = sel.map(
      (s) => s.position.x + getWidth(s) / 2
    )
    const avgCenter = centers.reduce((a, b) => a + b, 0) / centers.length

    setNodes((prev) =>
      prev.map((n) =>
        (n as any).selected
          ? {
            ...n,
            position: {
              ...n.position,
              x: avgCenter - getWidth(n) / 2,
            },
          }
          : n
      )
    )
  }

  function alignRight() {
    const sel = getSelectedNodes()
    if (sel.length < 2) return

    const maxRight = Math.max(
      ...sel.map((s) => s.position.x + getWidth(s))
    )

    setNodes((prev) =>
      prev.map((n) =>
        (n as any).selected
          ? {
            ...n,
            position: {
              ...n.position,
              x: maxRight - getWidth(n),
            },
          }
          : n
      )
    )
  }

  function distributeHorizontally() {
    const sel = getSelectedNodes().sort((a, b) => a.position.x - b.position.x)
    if (sel.length < 3) return

    const left = sel[0].position.x
    const right = sel[sel.length - 1].position.x
    const step = (right - left) / (sel.length - 1)

    setNodes((prev) =>
      prev.map((n) => {
        if (!(n as any).selected) return n
        const idx = sel.findIndex((s) => s.id === n.id)
        return {
          ...n,
          position: { x: left + step * idx, y: n.position.y },
        }
      })
    )
  }

  function nudge(dx: number, dy: number) {
    setNodes((prev) =>
      prev.map((n) =>
        (n as any).selected
          ? {
            ...n,
            position: {
              x: n.position.x + dx,
              y: n.position.y + dy,
            },
          }
          : n
      )
    )
  }

  /* -----------------------------
        KEYBOARD SHORTCUTS
  ------------------------------ */
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const cmd = e.ctrlKey || e.metaKey

      if (cmd && (e.key.toLowerCase() === "z" || e.key.toLowerCase() === "y")) {
        // A text field has its own undo; leave it to the browser there.
        const target = e.target as HTMLElement | null
        if (target?.closest("input, textarea, select, [contenteditable='true']")) return

        e.preventDefault()
        if (e.key.toLowerCase() === "y" || e.shiftKey) redo()
        else undo()
        return
      }

      if (cmd && e.key.toLowerCase() === "c") {
        e.preventDefault()
        copySelected()
      }

      if (cmd && e.key.toLowerCase() === "v") {
        e.preventDefault()
        pasteClipboard()
      }

      if (cmd && e.key.toLowerCase() === "g" && !e.shiftKey) {
        e.preventDefault()
        groupSelected()
      }

      if (cmd && e.key.toLowerCase() === "g" && e.shiftKey) {
        e.preventDefault()
        ungroupSelected()
      }

      if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault()
        deleteSelected()
      }

      const step = e.shiftKey ? 10 : 1
      if (e.key === "ArrowLeft") nudge(-step, 0)
      if (e.key === "ArrowRight") nudge(step, 0)
      if (e.key === "ArrowUp") nudge(0, -step)
      if (e.key === "ArrowDown") nudge(0, step)
    }

    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [nodes, edges])

  /* -----------------------------
       ZOOM / FIT VIEW
  ------------------------------ */
  function zoomIn() {
    reactFlowInstance?.zoomIn()
  }

  function zoomOut() {
    reactFlowInstance?.zoomOut()
  }

  function fitView() {
    reactFlowInstance?.fitView()
  }

  /* -----------------------------
      TOOLBAR EVENTS
  ------------------------------ */
  useEffect(() => {
    const events: [string, any][] = [
      ["nautilus-align-left", alignLeft],
      ["nautilus-align-center", alignCenter],
      ["nautilus-align-right", alignRight],
      ["nautilus-distribute-h", distributeHorizontally],
      ["nautilus-group", groupSelected],
      ["nautilus-ungroup", ungroupSelected],
      ["nautilus-copy", copySelected],
      ["nautilus-paste", pasteClipboard],
      ["nautilus-duplicate", duplicateSelected],
      ["nautilus-delete", deleteSelected],
      ["nautilus-zoom-in", zoomIn],
      ["nautilus-zoom-out", zoomOut],
      ["nautilus-fit-view", fitView],
    ]

    events.forEach(([ev, fn]) => window.addEventListener(ev, fn))
    return () => {
      events.forEach(([ev, fn]) => window.removeEventListener(ev, fn))
    }
  }, [nodes, edges, reactFlowInstance])

  /* -----------------------------
      EDGE DELETE BUTTON EVENT
  ------------------------------ */
  useEffect(() => {
    function deleteEdge(e: any) {
      const id = e.detail.id
      setEdges((prev) => prev.filter((edge) => edge.id !== id))
    }
    window.addEventListener("nautilus-delete-edge", deleteEdge)
    return () => window.removeEventListener("nautilus-delete-edge", deleteEdge)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /* -----------------------------
      NODE CONTEXT MENU ACTIONS

      Nodes dispatch these instead of touching canvas state themselves, so
      they do not have to subscribe to it.
  ------------------------------ */
  useEffect(() => {
    function onNodeAction(e: Event) {
      const { id, action } = (e as CustomEvent).detail ?? {}
      if (!id) return

      if (action === "delete") {
        setNodes((prev) => prev.filter((n) => n.id !== id))
        setEdges((prev) => prev.filter((edge) => edge.source !== id && edge.target !== id))
        setSelectedNodeId(null)
      } else if (action === "duplicate") {
        setNodes((prev) => {
          const node = prev.find((n) => n.id === id)
          if (!node) return prev
          return [
            ...prev,
            {
              ...node,
              id: crypto.randomUUID(),
              selected: false,
              position: { x: node.position.x + 40, y: node.position.y + 40 },
            },
          ]
        })
      } else if (action === "edit") {
        setSelectedNodeId(id)
        onOpenSidebar()
      }
    }
    window.addEventListener("nautilus-node-action", onNodeAction)
    return () => window.removeEventListener("nautilus-node-action", onNodeAction)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /* -----------------------------
       IMPORT EVENT

       The provider validates and applies the payload; the canvas only has to
       re-frame the viewport once the new nodes are mounted.
  ------------------------------ */
  useEffect(() => {
    function onImport() {
      setTimeout(() => reactFlowInstance?.fitView({ padding: 0.2 }), 50)
    }
    window.addEventListener("nautilus-import", onImport)
    return () => window.removeEventListener("nautilus-import", onImport)
  }, [reactFlowInstance])

  /* -----------------------------
        FLOW SIMULATION
  ------------------------------ */
  useEffect(() => {
    function onRunFlow() {
      sim.start()
    }
    function onStopFlow() {
      sim.stop()
    }
    function onToggleLoad() {
      setLoadOn((v) => !v)
    }
    // Fired by a node's context menu.
    function onToggleNodeDown(e: Event) {
      const id = (e as CustomEvent).detail?.id
      if (!id) return
      setLoadOn(true)
      load.toggleDown(id)
    }

    window.addEventListener("nautilus-run", onRunFlow)
    window.addEventListener("nautilus-run-stop", onStopFlow)
    window.addEventListener("nautilus-load-toggle", onToggleLoad)
    window.addEventListener("nautilus-node-failure", onToggleNodeDown)
    return () => {
      window.removeEventListener("nautilus-run", onRunFlow)
      window.removeEventListener("nautilus-run-stop", onStopFlow)
      window.removeEventListener("nautilus-load-toggle", onToggleLoad)
      window.removeEventListener("nautilus-node-failure", onToggleNodeDown)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sim.start, sim.stop, nodes])

  // Let the toolbar mirror the run state without owning it.
  useEffect(() => {
    window.dispatchEvent(
      new CustomEvent("nautilus-run-state", { detail: { status: sim.status, load: loadOn } })
    )
  }, [sim.status, loadOn])

  // The properties panel reads live metrics from here: canvas node data is
  // decorated at render time only, so the report has to be broadcast.
  useEffect(() => {
    window.dispatchEvent(
      new CustomEvent("nautilus-load-report", { detail: { report: loadReport } })
    )
  }, [loadReport])

  /* -----------------------------
      RENDER-TIME SIMULATION MARKS

      Marks are merged into node/edge data only for rendering, so a run never
      touches canvas state (no undo entries, no autosave, no export noise).
  ------------------------------ */
  const [decorateNodes] = useState(createNodeDecorator)
  const [decorateEdges] = useState(createEdgeDecorator)

  const renderedNodes = useMemo(
    () => decorateNodes(nodes, sim.nodeMarks, loadReport),
    [decorateNodes, nodes, sim.nodeMarks, loadReport]
  )

  // Every connection carries its step number and request type; trace marks
  // and live rates are layered on top while a simulation is open.
  const renderedEdges = useMemo(
    () => decorateEdges(edges, sim.edgeMarks, sequence, loadReport, lite),
    [decorateEdges, edges, sim.edgeMarks, sequence, loadReport, lite]
  )

  /* -----------------------------
         SHOW CANVAS
  ------------------------------ */
  return (
    <div
      ref={wrapperRef}
      className={`flex-1 h-full bg-canvas-pattern ${lite ? "canvas-lite" : ""}`}
      style={{ position: "relative" }}
    >
      <ReactFlow
        nodes={renderedNodes}
        edges={renderedEdges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onInit={onInit}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onNodeClick={onNodeClick}
        onNodeDoubleClick={onNodeDoubleClick}
        onEdgeClick={onEdgeClick}
        onEdgeDoubleClick={onEdgeDoubleClick}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        // Off-screen nodes and edges are not mounted at all, which is what
        // keeps a several-hundred-node diagram responsive to pan and zoom.
        onlyRenderVisibleElements
        minZoom={0.05}
        fitView
      >
        <FlowMarkers />

        <Background variant={BackgroundVariant.Dots} gap={18} size={1} className="opacity-60" />

        <Controls
          showInteractive={false}
          className="!bottom-4 !left-4 !shadow-sm [&>button]:!border-border [&>button]:!bg-background [&>button]:!text-foreground"
        />

        {showMiniMap && (
          <MiniMap
            pannable
            zoomable
            ariaLabel="Diagram overview"
            className="!bottom-4 !right-4 !h-28 !w-44 !rounded-lg !border !bg-background/80 !shadow-sm"
            maskColor="rgba(0,0,0,0.06)"
            nodeColor={miniMapNodeColor}
            nodeStrokeWidth={2}
          />
        )}

        {nodes.length === 0 && (
          <Panel position="top-center" className="!top-16">
            <div className="rounded-lg border bg-background/90 px-4 py-3 text-center shadow-sm backdrop-blur">
              <div className="text-[13px] font-medium">Empty canvas</div>
              <p className="mt-1 text-[12px] text-muted-foreground">
                Drag a component from the left panel, load a template, or ask the assistant.
              </p>
            </div>
          </Panel>
        )}
      </ReactFlow>

      <SimulationPanel sim={sim} load={load} hops={sequence.hops} />
    </div>
  )
}
