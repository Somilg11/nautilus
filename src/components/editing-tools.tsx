"use client"

import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

import {
  FaCopy,
  FaPaste,
  FaTrash,
  FaObjectGroup,
  FaObjectUngroup,
} from "react-icons/fa"

import {
  LuMove,
  LuZoomIn,
  LuZoomOut,
  LuScanLine,
  LuAlignVerticalJustifyCenter,
  LuAlignVerticalJustifyStart,
  LuAlignVerticalJustifyEnd,
  LuColumns2,
} from "react-icons/lu"

export default function EditingTools() {
  const dispatch = (event: string) =>
    window.dispatchEvent(new CustomEvent(event))

  return (
    <div className="w-full border-b bg-muted/40 h-12 flex items-center px-4 gap-2">

      {/* ============================= */}
      {/* COPY / PASTE / DUPLICATE / DELETE */}
      {/* ============================= */}

      <Tooltip>
        <TooltipTrigger asChild>
          <Button size="icon" variant="ghost" onClick={() => dispatch("nautilus-copy")}>
            <FaCopy className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Copy</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button size="icon" variant="ghost" onClick={() => dispatch("nautilus-paste")}>
            <FaPaste className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Paste</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button size="icon" variant="ghost" onClick={() => dispatch("nautilus-duplicate")}>
            <LuMove className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Duplicate</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button size="icon" variant="ghost" onClick={() => dispatch("nautilus-delete")}>
            <FaTrash className="h-4 w-4 text-red-500" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Delete</TooltipContent>
      </Tooltip>

      <div className="h-6 w-px bg-border mx-2" />

      {/* ============================= */}
      {/* GROUP / UNGROUP */}
      {/* ============================= */}

      <Tooltip>
        <TooltipTrigger asChild>
          <Button size="icon" variant="ghost" onClick={() => dispatch("nautilus-group")}>
            <FaObjectGroup className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Group</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button size="icon" variant="ghost" onClick={() => dispatch("nautilus-ungroup")}>
            <FaObjectUngroup className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Ungroup</TooltipContent>
      </Tooltip>

      <div className="h-6 w-px bg-border mx-2" />

      {/* ============================= */}
      {/* ALIGNMENT TOOLS */}
      {/* ============================= */}

      {/* Align Left */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button size="icon" variant="ghost" onClick={() => dispatch("nautilus-align-left")}>
            <LuAlignVerticalJustifyStart className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Align Left</TooltipContent>
      </Tooltip>

      {/* Align Center */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button size="icon" variant="ghost" onClick={() => dispatch("nautilus-align-center")}>
            <LuAlignVerticalJustifyCenter className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Align Center</TooltipContent>
      </Tooltip>

      {/* Align Right */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button size="icon" variant="ghost" onClick={() => dispatch("nautilus-align-right")}>
            <LuAlignVerticalJustifyEnd className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Align Right</TooltipContent>
      </Tooltip>

      {/* Distribute Horizontally */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button size="icon" variant="ghost" onClick={() => dispatch("nautilus-distribute-h")}>
            <LuColumns2 className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Distribute Horizontally</TooltipContent>
      </Tooltip>

      <div className="h-6 w-px bg-border mx-2" />

      {/* ============================= */}
      {/* ZOOM / FIT VIEW */}
      {/* ============================= */}

      <Tooltip>
        <TooltipTrigger asChild>
          <Button size="icon" variant="ghost" onClick={() => dispatch("nautilus-zoom-in")}>
            <LuZoomIn className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Zoom In</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button size="icon" variant="ghost" onClick={() => dispatch("nautilus-zoom-out")}>
            <LuZoomOut className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Zoom Out</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button size="icon" variant="ghost" onClick={() => dispatch("nautilus-fit-view")}>
            <LuScanLine className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Fit View</TooltipContent>
      </Tooltip>

    </div>
  )
}
