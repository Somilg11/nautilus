import "@/styles/canvas.css"

export default function Canvas() {
    return (
        <div className="flex-1 h-full relative bg-canvas-pattern">
            <div className="absolute inset-0 flex items-center justify-center">
                <p className="text-muted-foreground">
                    ReactFlow Canvas Placeholder (Phase 2)
                </p>
            </div>
        </div>
    )
}