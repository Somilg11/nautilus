import React from "react"
import { NodeProps } from "reactflow"

export default function GroupNode({ data, selected }: NodeProps) {
    return (
        <div
            className={`relative w-full h-full rounded-md border-2 border-dashed transition-colors ${selected ? "border-primary bg-primary/5" : "border-border/50 bg-black/5"
                }`}
        >
            {data.label && (
                <div className="absolute -top-6 left-0 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    {data.label}
                </div>
            )}
        </div>
    )
}
