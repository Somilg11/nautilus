"use client"

import {
  Copy,
  ClipboardPaste,
  CopyPlus,
  Trash2,
  Group,
  Ungroup,
  AlignStartVertical,
  AlignCenterVertical,
  AlignEndVertical,
  AlignHorizontalSpaceAround,
  ZoomIn,
  ZoomOut,
  Maximize,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useFlow } from "@/lib/flow-context"

/**
 * Canvas editing bar.
 *
 * Every button dispatches a `nautilus-*` window event handled in
 * components/canvas.tsx — the canvas is the single owner of these actions.
 */
export default function EditingTools() {
  const { nodes } = useFlow()

  const selected = nodes.filter((n) => (n as { selected?: boolean }).selected)
  const selectedCount = selected.length
  // Naming the single selected node is more useful than a bare count.
  const selectionLabel =
    selectedCount === 1
      ? (selected[0].data?.label as string | undefined) || selected[0].id
      : null
  const hasSelection = selectedCount > 0
  const canGroup = selectedCount > 1
  const canDistribute = selectedCount > 2

  const dispatch = (event: string) => window.dispatchEvent(new CustomEvent(event))

  const groups: {
    key: string
    items: {
      event: string
      label: string
      hint?: string
      icon: React.ReactNode
      disabled?: boolean
      destructive?: boolean
    }[]
  }[] = [
    {
      key: "clipboard",
      items: [
        { event: "nautilus-copy", label: "Copy", hint: "⌘C", icon: <Copy />, disabled: !hasSelection },
        { event: "nautilus-paste", label: "Paste", hint: "⌘V", icon: <ClipboardPaste /> },
        { event: "nautilus-duplicate", label: "Duplicate", icon: <CopyPlus />, disabled: !hasSelection },
        {
          event: "nautilus-delete",
          label: "Delete",
          hint: "⌫",
          icon: <Trash2 />,
          disabled: !hasSelection,
          destructive: true,
        },
      ],
    },
    {
      key: "grouping",
      items: [
        { event: "nautilus-group", label: "Group", hint: "⌘G", icon: <Group />, disabled: !canGroup },
        { event: "nautilus-ungroup", label: "Ungroup", hint: "⌘⇧G", icon: <Ungroup />, disabled: !hasSelection },
      ],
    },
    {
      key: "align",
      items: [
        { event: "nautilus-align-left", label: "Align left", icon: <AlignStartVertical />, disabled: !canGroup },
        { event: "nautilus-align-center", label: "Align centre", icon: <AlignCenterVertical />, disabled: !canGroup },
        { event: "nautilus-align-right", label: "Align right", icon: <AlignEndVertical />, disabled: !canGroup },
        {
          event: "nautilus-distribute-h",
          label: "Distribute horizontally",
          icon: <AlignHorizontalSpaceAround />,
          disabled: !canDistribute,
        },
      ],
    },
    {
      key: "view",
      items: [
        { event: "nautilus-zoom-in", label: "Zoom in", icon: <ZoomIn /> },
        { event: "nautilus-zoom-out", label: "Zoom out", icon: <ZoomOut /> },
        { event: "nautilus-fit-view", label: "Fit to screen", icon: <Maximize /> },
      ],
    },
  ]

  return (
    <div className="flex h-10 items-center gap-1 border-b bg-muted/30 px-3">
      {groups.map((group, gi) => (
        <div key={group.key} className="flex items-center gap-0.5">
          {gi > 0 && <div className="mx-1.5 h-4 w-px bg-border" />}
          {group.items.map((item) => (
            <Tooltip key={item.event}>
              <TooltipTrigger asChild>
                <Button
                  size="icon"
                  variant="ghost"
                  aria-label={item.label}
                  disabled={item.disabled}
                  onClick={() => dispatch(item.event)}
                  className={`h-7 w-7 [&_svg]:h-3.5 [&_svg]:w-3.5 ${
                    item.destructive ? "text-destructive hover:text-destructive" : ""
                  }`}
                >
                  {item.icon}
                </Button>
              </TooltipTrigger>
              <TooltipContent className="flex items-center gap-2">
                <span>{item.label}</span>
                {item.hint && (
                  <kbd className="rounded border border-border/50 bg-background/20 px-1 font-mono text-[10px]">
                    {item.hint}
                  </kbd>
                )}
              </TooltipContent>
            </Tooltip>
          ))}
        </div>
      ))}

      <div className="ml-auto flex items-center gap-1.5">
        {selectionLabel ? (
          <Badge variant="secondary" className="max-w-[220px]">
            <span className="truncate">{selectionLabel}</span>
          </Badge>
        ) : selectedCount > 0 ? (
          <Badge variant="secondary">{selectedCount} selected</Badge>
        ) : (
          <Badge variant="outline">
            {nodes.length} component{nodes.length === 1 ? "" : "s"}
          </Badge>
        )}
      </div>
    </div>
  )
}
