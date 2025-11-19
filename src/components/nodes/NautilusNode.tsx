"use client"

import {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
} from "@/components/ui/context-menu"

import { Handle, Position } from "react-flow-renderer"
import { useFlow } from "@/lib/flow-context"
import { NodeIcons } from "./node-icons"

type NautilusNodeProps = {
  id: string
  data: {
    label?: string
    description?: string
    color?: string
    icon?: string
    __glow?: boolean
  }
}

function pickIcon(name?: string) {
  return NodeIcons[name ?? "service"] ?? NodeIcons["service"]
}

function bgFor(color?: string) {
  switch (color) {
    case "blue":
      return "bg-blue-600/80"
    case "green":
      return "bg-green-600/80"
    case "red":
      return "bg-red-600/80"
    case "yellow":
      return "bg-yellow-500/80"
    default:
      return "bg-zinc-700/80"
  }
}

export default function NautilusNode({ id, data }: NautilusNodeProps) {
  const { setSelectedNodeId, setNodes } = useFlow()

  const deleteNode = () => {
    setNodes((prev) => prev.filter((n) => n.id !== id))
    setSelectedNodeId(null)
  }

  const duplicateNode = () => {
    setNodes((prev) => {
      const node = prev.find((n) => n.id === id)
      if (!node) return prev
      return [
        ...prev,
        {
          ...node,
          id: crypto.randomUUID(),
          position: {
            x: node.position.x + 40,
            y: node.position.y + 40,
          },
        },
      ]
    })
  }

  const editNode = () => {
    setSelectedNodeId(id)
    window.dispatchEvent(new CustomEvent("openSidebar"))
  }

  return (
    <ContextMenu>
      <ContextMenuTrigger>
        <div
          className={`min-w-40 max-w-xs rounded-lg overflow-hidden border shadow-sm ${
            data.__glow ? "node-glow" : ""
          }`}
        >
          {/* HEADER */}
          <div
            className={`flex items-center gap-2 px-3 py-2 text-white ${bgFor(
              data.color
            )}`}
          >
            <div className="flex items-center justify-center h-6 w-6">
              {pickIcon(data.icon)}
            </div>

            <div className="font-semibold text-sm truncate">
              {data.label || "Node"}
            </div>
          </div>

          {/* BODY */}
          <div className="p-3 bg-card">
            {data.description ? (
              <div className="text-sm text-muted-foreground">
                {data.description}
              </div>
            ) : (
              <div className="text-sm text-muted-foreground/60">
                No description
              </div>
            )}
          </div>

          {/* HANDLES */}
          <Handle type="target" position={Position.Top} />
          <Handle type="source" position={Position.Bottom} />
        </div>
      </ContextMenuTrigger>

      <ContextMenuContent className="w-40">
        <ContextMenuItem onClick={editNode}>Edit</ContextMenuItem>
        <ContextMenuItem onClick={duplicateNode}>Duplicate</ContextMenuItem>
        <ContextMenuItem onClick={deleteNode} className="text-red-500">
          Delete
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  )
}
