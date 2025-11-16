"use client"

import { ScrollArea } from "@/components/ui/scroll-area"
import {
  User,
  Laptop,
  Smartphone,
  Server,
  Database,
  Cloud,
  Key,
  Activity,
  ServerCog,
} from "lucide-react"

const COMPONENTS = [
  { id: "user", label: "User", icon: User },
  { id: "client_web", label: "Client (Web)", icon: Laptop },
  { id: "client_mobile", label: "Client (Mobile)", icon: Smartphone },

  { id: "web_server", label: "Web Server", icon: Server },
  { id: "api_server", label: "API Server", icon: ServerCog },

  { id: "database_sql", label: "Database (SQL)", icon: Database },
  { id: "object_storage", label: "Object Storage", icon: Cloud },

  { id: "auth", label: "Auth Service", icon: Key },
  { id: "monitoring", label: "Monitoring", icon: Activity },
]

export default function LeftSidebar() {
  function onDragStart(e: React.DragEvent, componentId: string) {
    e.dataTransfer.setData("application/reactflow", componentId)
    e.dataTransfer.effectAllowed = "move"
  }

  return (
    <aside className="w-72 border-r h-full flex flex-col">
      <div className="p-4">
        <h3 className="font-semibold">Components</h3>
        <p className="text-sm text-muted-foreground">Drag to add to canvas.</p>
      </div>

      <ScrollArea className="px-4 pb-4 flex-1">
        <div className="grid grid-cols-2 gap-3">
          {COMPONENTS.map((c) => {
            const Icon = c.icon
            return (
              <div
                key={c.id}
                draggable
                onDragStart={(e) => onDragStart(e, c.id)}
                className="border rounded-md p-2 h-24 flex flex-col items-center justify-center text-sm cursor-grab hover:shadow"
              >
                <Icon className="h-6 w-6 mb-2" />
                <div className="text-center">{c.label}</div>
              </div>
            )
          })}
        </div>
      </ScrollArea>
    </aside>
  )
}
