/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { useState } from "react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Input } from "@/components/ui/input"
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion"

// React Icons
import {
  FaUser,
  FaLaptop,
  FaMobileAlt,
  FaServer,
  FaDatabase,
  FaCloud,
  FaLock,
  FaKey,
  FaTools,
  FaNetworkWired,
  FaBalanceScale,
  FaBroadcastTower,
  FaFire,
  FaMicrochip,
  FaCube,
  FaCubes,
  FaChartLine,
  FaEnvelope,
  FaStream,
  FaShieldAlt,
  FaCodeBranch,
  FaGlobe,
} from "react-icons/fa"

type ComponentItem = {
  id: string
  label: string
  icon: any
}

type Category = {
  title: string
  items: ComponentItem[]
}

const CATEGORIES: Category[] = [
  {
    title: "Clients",
    items: [
      { id: "user", label: "User", icon: FaUser },
      { id: "client_web", label: "Web Client", icon: FaLaptop },
      { id: "client_mobile", label: "Mobile Client", icon: FaMobileAlt },
    ],
  },
  {
    title: "Compute",
    items: [
      { id: "web_server", label: "Web Server", icon: FaServer },
      { id: "api_server", label: "API Server", icon: FaServer },
      { id: "microservice", label: "Microservice", icon: FaMicrochip },
      { id: "worker", label: "Worker Service", icon: FaTools },
      { id: "proxy", label: "Reverse Proxy", icon: FaNetworkWired },
      { id: "job_scheduler", label: "Job Scheduler", icon: FaCodeBranch },
    ],
  },
  {
    title: "Databases",
    items: [
      { id: "database_sql", label: "SQL Database", icon: FaDatabase },
      { id: "database_nosql", label: "NoSQL Database", icon: FaDatabase },
      { id: "database_graph", label: "Graph Database", icon: FaCubes },
      { id: "cache", label: "Cache (Redis)", icon: FaCube },
      { id: "vector_db", label: "Vector DB", icon: FaDatabase },
      { id: "time_series", label: "Time Series DB", icon: FaChartLine },
    ],
  },
  {
    title: "Storage",
    items: [
      { id: "object_storage", label: "Object Storage", icon: FaCloud },
      { id: "blob_storage", label: "Blob Storage", icon: FaCloud },
      { id: "distributed_fs", label: "Distributed FS", icon: FaCubes },
    ],
  },
  {
    title: "Networking",
    items: [
      { id: "load_balancer", label: "Load Balancer", icon: FaBalanceScale },
      { id: "api_gateway", label: "API Gateway", icon: FaGlobe },
      { id: "cdn", label: "CDN", icon: FaGlobe },
      { id: "firewall", label: "Firewall", icon: FaFire },
      { id: "vpc", label: "VPC / Network", icon: FaNetworkWired },
    ],
  },
  {
    title: "Messaging",
    items: [
      { id: "message_queue", label: "Message Queue", icon: FaEnvelope },
      { id: "event_stream", label: "Event Stream", icon: FaStream },
      { id: "pubsub", label: "Pub/Sub", icon: FaBroadcastTower },
    ],
  },
  {
    title: "Security",
    items: [
      { id: "auth_service", label: "Auth Service", icon: FaKey },
      { id: "iam", label: "IAM & Roles", icon: FaLock },
      { id: "waf", label: "WAF", icon: FaShieldAlt },
    ],
  },
  {
    title: "Monitoring",
    items: [
      { id: "metrics", label: "Metrics (Prometheus)", icon: FaChartLine },
      { id: "logs", label: "Log Service", icon: FaTools },
      { id: "alerting", label: "Alerting", icon: FaBroadcastTower },
    ],
  },
]

export default function LeftSidebar({ collapsed = false }: { collapsed?: boolean }) {
  const [search, setSearch] = useState("")

  function onDragStart(e: React.DragEvent, componentId: string) {
    e.dataTransfer.setData("application/reactflow", componentId)
    e.dataTransfer.effectAllowed = "move"
  }

  if (collapsed) {
    return (
      <aside className="w-10 border-r h-full flex items-center justify-center cursor-pointer">
        <span className="rotate-90 opacity-60">›</span>
      </aside>
    )
  }

  return (
    <aside className="w-72 border-r h-full flex flex-col bg-card overflow-hidden">
      {/* SEARCH */}
      <div className="p-3">
        <Input
          placeholder="Search components..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <ScrollArea className="h-full px-3">
        <Accordion type="multiple">
          {CATEGORIES.map((category) => {
            const filtered = category.items.filter((i) =>
              i.label.toLowerCase().includes(search.toLowerCase())
            )

            if (filtered.length === 0) return null

            return (
              <AccordionItem key={category.title} value={category.title}>
                <AccordionTrigger>{category.title}</AccordionTrigger>
                <AccordionContent>
                  <div className="grid grid-cols-2 gap-3 py-2">
                    {filtered.map((c) => {
                      const Icon = c.icon
                      return (
                        <div
                          key={c.id}
                          draggable
                          onDragStart={(e) => onDragStart(e, c.id)}
                          className="rounded-xl border bg-background hover:bg-accent cursor-grab p-3 flex flex-col items-center justify-center gap-2 shadow-sm"
                        >
                          <Icon className="h-6 w-6" />
                          <span className="text-xs text-center">{c.label}</span>
                        </div>
                      )
                    })}
                  </div>
                </AccordionContent>
              </AccordionItem>
            )
          })}
        </Accordion>
      </ScrollArea>
    </aside>
  )
}
