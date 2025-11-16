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
    <aside className="w-72 border-r h-full flex flex-col bg-card">
      <div className="p-4 font-semibold text-lg">Components</div>

      <ScrollArea className="h-full p-4">
        <div className="grid grid-cols-2 gap-3">
          {COMPONENTS.map((c) => {
            const Icon = c.icon
            return (
              <div
                key={c.id}
                draggable
                onDragStart={(e) => onDragStart(e, c.id)}
                className="rounded-xl border bg-background hover:bg-accent cursor-grab p-3 flex flex-col items-center justify-center gap-2 shadow-sm"
              >
                <Icon className="h-6 w-6" />
                <span className="text-sm text-center">{c.label}</span>
              </div>
            )
          })}
        </div>
      </ScrollArea>
    </aside>
  )
}
