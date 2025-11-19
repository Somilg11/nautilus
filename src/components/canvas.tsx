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

/* --------------------------------
   MODULE-LEVEL EDGE DELETE BUTTON
--------------------------------- */
function EdgeDeleteButton({ id, x, y }: any) {
  return (
    <foreignObject
      x={x - 15}
      y={y - 15}
      width={30}
      height={30}
      requiredExtensions="http://www.w3.org/1999/xhtml"
      xmlns="http://www.w3.org/1999/xhtml"
    >
      <div
        style={{
          width: "30px",
          height: "30px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "white",
          borderRadius: "50%",
          border: "1px solid #ccc",
          cursor: "pointer",
        }}
        onClick={(e) => {
          e.stopPropagation()
          window.dispatchEvent(
            new CustomEvent("delete-edge", { detail: { id } })
          )
        }}
      >
        ❌
      </div>
    </foreignObject>
  )
}


let CLIPBOARD: { nodes: any[]; edges: any[] } | null = null

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
    reactFlowInstance,
    setReactFlowInstance,
    setSelectedNodeId,
  } = useFlow()

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

  /* -----------------------------
        EDGE CLICK (select + show delete)
  ------------------------------ */
  function onEdgeClick(event: any, edge: any) {
    const { sourceX, sourceY, targetX, targetY } = edge

    const midX = (sourceX + targetX) / 2
    const midY = (sourceY + targetY) / 2

    setEdges((prev) =>
      prev.map((e) =>
        e.id === edge.id
          ? {
            ...e,
            selected: true,
            data: {
              ...e.data,
              showDelete: true,
              deleteX: midX,
              deleteY: midY,
            },
          }
          : { ...e, selected: false, data: { ...e.data, showDelete: false } }
      )
    )
  }

  /* -----------------------------
       APPLY NODE CHANGES
  ------------------------------ */
  const onNodesChange = (changes: NodeChange[]) => {
    setNodes((prev) => {
      const updated = [...prev]
      for (const c of changes) {
        if (!("id" in c)) continue
        const index = updated.findIndex((n) => n.id === (c as any).id)
        if (index === -1) continue

        if (c.type === "position" && c.position) {
          updated[index] = { ...updated[index], position: c.position }
        }

        if (c.type === "select" && typeof c.selected === "boolean") {
          updated[index] = { ...updated[index], selected: c.selected }
        }
      }
      return updated
    })
  }

  /* -----------------------------
       APPLY EDGE CHANGES
  ------------------------------ */
  const onEdgesChange = (changes: EdgeChange[]) => {
    setEdges((prev) => {
      let updated = [...prev]
      for (const c of changes) {
        if (c.type === "remove") updated = updated.filter((e) => e.id !== c.id)
      }
      return updated
    })
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
      markerEnd: { type: MarkerType.Arrow },
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
    }))

    setNodes((prev) => prev.map((n) => ({ ...n, selected: false })).concat(pastedNodes))
    setEdges((prev) => prev.concat(pastedEdges))
  }

  /* -----------------------------
        GROUP / UNGROUP
  ------------------------------ */
  function groupSelected() {
    const sel = getSelectedNodes()
    if (sel.length === 0) return
    const groupId = crypto.randomUUID()

    setNodes((prev) =>
      prev.map((n) =>
        (n as any).selected
          ? { ...n, data: { ...n.data, group: groupId } }
          : n
      )
    )
  }

  function ungroupSelected() {
    setNodes((prev) =>
      prev.map((n) =>
        (n as any).selected && n.data?.group
          ? { ...n, data: { ...n.data, group: undefined } }
          : n
      )
    )
  }

  /* -----------------------------
       ALIGN / DISTRIBUTE / NUDGE
  ------------------------------ */
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
      (s) => s.position.x + ((s.width ?? 150) / 2 || 75)
    )
    const avgCenter = centers.reduce((a, b) => a + b, 0) / centers.length

    setNodes((prev) =>
      prev.map((n) =>
        (n as any).selected
          ? {
            ...n,
            position: {
              ...n.position,
              x: avgCenter - ((n.width ?? 150) / 2 || 75),
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
      ...sel.map((s) => s.position.x + ((s.width ?? 150) || 150))
    )

    setNodes((prev) =>
      prev.map((n) =>
        (n as any).selected
          ? {
            ...n,
            position: {
              ...n.position,
              x: maxRight - ((n.width ?? 150) || 150),
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
      ["nautilus-delete", deleteSelected],
    ]

    events.forEach(([ev, fn]) => window.addEventListener(ev, fn))
    return () => {
      events.forEach(([ev, fn]) => window.removeEventListener(ev, fn))
    }
  }, [nodes, edges])

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
  }, [])

  /* -----------------------------
       IMPORT EVENT
  ------------------------------ */
  useEffect(() => {
    function onImport(e: any) {
      const { nodes, edges } = e.detail
      setNodes(nodes)
      setEdges(edges)
      setTimeout(() => reactFlowInstance?.fitView({ padding: 0.2 }), 50)
    }
    window.addEventListener("nautilus-import", onImport)
    return () => window.removeEventListener("nautilus-import", onImport)
  }, [reactFlowInstance])

  /* -----------------------------
        RUN FLOW VISUALIZATION
  ------------------------------ */
  useEffect(() => {
    function onRunFlow() {
      if (nodes.length === 0) {
        alert("No nodes to run.")
        return
      }

      const valid = edges.every(
        (e) =>
          nodes.some((n) => n.id === e.source) &&
          nodes.some((n) => n.id === e.target)
      )

      if (!valid) {
        alert("Invalid edges — cannot run.")
        return
      }

      const path = computeExecutionPath(nodes, edges)
      if (path.length === 0) {
        alert("No valid traversal path found.")
        return
      }

      let i = 0
      const highlight = () => {
        const id = path[i]

        setNodes((prev) =>
          prev.map((n) =>
            n.id === id ? { ...n, data: { ...n.data, __glow: true } } : n
          )
        )

        setTimeout(() => {
          setNodes((prev) =>
            prev.map((n) =>
              n.id === id ? { ...n, data: { ...n.data, __glow: false } } : n
            )
          )

          i++
          if (i < path.length) highlight()
        }, 700)
      }

      highlight()
    }

    window.addEventListener("nautilus-run", onRunFlow)
    return () => window.removeEventListener("nautilus-run", onRunFlow)
  }, [nodes, edges])

  /* -----------------------------
         SHOW CANVAS
  ------------------------------ */
  return (
    <div
      ref={wrapperRef}
      className="flex-1 h-full bg-canvas-pattern"
      style={{ position: "relative" }}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges.map((e) => ({
          ...e,
          style: e.selected
            ? { stroke: "#ff4d4d", strokeWidth: 2 }
            : { stroke: "#999" },
        }))}
        nodeTypes={nodeTypes}
        onInit={onInit}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onNodeClick={onNodeClick}
        onNodeDoubleClick={onNodeDoubleClick}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onEdgeClick={onEdgeClick}  // <-- edge delete handler
        fitView
      >
        {edges
          .filter((e) => e.data?.showDelete)
          .map((e) => (
            <EdgeDeleteButton
              key={e.id}
              id={e.id}
              x={e.data.deleteX}
              y={e.data.deleteY}
            />
          ))}

        <Background gap={20} size={1} />
        <Controls />
      </ReactFlow>
    </div>
  )
}
