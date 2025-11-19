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

/* ===========================================
   IMPORT ICONS (React Icons Only)
=========================================== */

/* Clients */
import { FaUser, FaDesktop, FaMobileAlt } from "react-icons/fa"

/* Compute / Servers */
import { FaServer, FaTools, FaNetworkWired } from "react-icons/fa"
import { SiDocker, SiKubernetes, SiNginx, SiTraefikproxy } from "react-icons/si"

/* Databases / Storage */
import {
  SiMysql,
  SiPostgresql,
  SiMongodb,
  SiApachecassandra,
  SiRedis,
  SiElastic,
} from "react-icons/si"
import { FaDatabase, FaHdd, FaCloud } from "react-icons/fa"

/* Media & Uploads */
import {
  SiImagedotsc as SiImagekit,
  SiCloudinary,
  SiCloudways as SiUploadcare,
  SiMinio,
  SiFirebase,
  SiSupabase,
} from "react-icons/si"

/* Messaging */
import { SiApachekafka, SiRabbitmq } from "react-icons/si"
import { FaEnvelope, FaStream } from "react-icons/fa"

/* Networking */
import { FaGlobe, FaBalanceScale } from "react-icons/fa"
import { SiCloudflare } from "react-icons/si"

/* Security */
import { FaShieldAlt, FaLock, FaKey } from "react-icons/fa"

/* Observability */
import { SiGrafana, SiPrometheus, SiKibana } from "react-icons/si"

/* Payments */
import {
  SiStripe,
  SiRazorpay,
  SiPaypal,
  SiCashapp,
  SiPayoneer,
  SiPaddle,
} from "react-icons/si"
import { FaMoneyBill } from "react-icons/fa"

/* Auth Providers */
import {
  SiClerk,
  SiAuth0,
  SiFirebase as SiFirebaseAuth,
  SiSupabase as SiSupabaseAuth,
} from "react-icons/si"
import { FaUserShield } from "react-icons/fa"

/* Cloud Providers */
import { FaAws } from "react-icons/fa"
import { SiGooglecloud, SiDigitalocean, SiOpenstack } from "react-icons/si"
import { VscAzure } from "react-icons/vsc"

/* Microservices */
import { FaCubes } from "react-icons/fa"


/* ===========================================
   CATEGORY STRUCTURE
=========================================== */

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
  /* ---------- Clients ---------- */
  {
    title: "Clients",
    items: [
      { id: "user", label: "User", icon: FaUser },
      { id: "client_web", label: "Web Client", icon: FaDesktop },
      { id: "client_mobile", label: "Mobile Client", icon: FaMobileAlt },
    ],
  },

  /* ---------- Compute ---------- */
  {
    title: "Compute",
    items: [
      { id: "web_server", label: "Web Server", icon: FaServer },
      { id: "api_server", label: "API Server", icon: FaServer },
      { id: "microservice", label: "Microservice", icon: FaCubes },
      { id: "docker", label: "Docker Container", icon: SiDocker },
      { id: "k8s", label: "Kubernetes Pod", icon: SiKubernetes },
      { id: "nginx", label: "Nginx Proxy", icon: SiNginx },
      { id: "traefik", label: "Traefik Proxy", icon: SiTraefikproxy },
      { id: "worker", label: "Worker Service", icon: FaTools },
    ],
  },

  /* ---------- Databases ---------- */
  {
    title: "Databases",
    items: [
      { id: "database_sql", label: "SQL Database", icon: FaDatabase },
      { id: "mysql", label: "MySQL", icon: SiMysql },
      { id: "postgres", label: "PostgreSQL", icon: SiPostgresql },
      { id: "mongodb", label: "MongoDB", icon: SiMongodb },
      { id: "cassandra", label: "Cassandra", icon: SiApachecassandra },
      { id: "redis", label: "Redis Cache", icon: SiRedis },
      { id: "elasticsearch", label: "Elasticsearch", icon: SiElastic },
    ],
  },

  /* ---------- Storage / Media ---------- */
  {
    title: "Storage & Media",
    items: [
      { id: "storage_block", label: "Block Storage", icon: FaHdd },
      { id: "storage_object", label: "Object Storage", icon: FaCloud },
      { id: "s3", label: "AWS S3", icon: FaAws },
      { id: "minio", label: "MinIO", icon: SiMinio },
      { id: "cloudinary", label: "Cloudinary", icon: SiCloudinary },
      { id: "imagekit", label: "ImageKit", icon: SiImagekit },
      { id: "uploadcare", label: "Uploadcare", icon: SiUploadcare },
      { id: "firebase_storage", label: "Firebase Storage", icon: SiFirebase },
      { id: "supabase_storage", label: "Supabase Storage", icon: SiSupabase },
    ],
  },

  /* ---------- Messaging ---------- */
  {
    title: "Messaging & Streams",
    items: [
      { id: "kafka", label: "Kafka", icon: SiApachekafka },
      { id: "rabbitmq", label: "RabbitMQ", icon: SiRabbitmq },
      { id: "message_queue", label: "Message Queue", icon: FaEnvelope },
      { id: "event_stream", label: "Event Stream", icon: FaStream },
    ],
  },

  /* ---------- Networking ---------- */
  {
    title: "Networking",
    items: [
      { id: "load_balancer", label: "Load Balancer", icon: FaBalanceScale },
      { id: "reverse_proxy", label: "Reverse Proxy", icon: SiNginx },
      { id: "api_gateway", label: "API Gateway", icon: FaGlobe },
      { id: "cdn", label: "CDN", icon: SiCloudflare },
      { id: "dns", label: "DNS", icon: FaGlobe },
      { id: "vpc", label: "VPC / Network", icon: FaNetworkWired },
      { id: "internet", label: "Internet", icon: FaGlobe },
    ],
  },

  /* ---------- Payments ---------- */
  {
    title: "Payments",
    items: [
      { id: "stripe", label: "Stripe", icon: SiStripe },
      { id: "razorpay", label: "Razorpay", icon: SiRazorpay },
      { id: "paypal", label: "PayPal", icon: SiPaypal },
      { id: "cashfree", label: "Cashfree", icon: SiCashapp },
      { id: "payoneer", label: "Payoneer", icon: SiPayoneer },
      { id: "paddle", label: "Paddle", icon: SiPaddle },
      { id: "billing", label: "Billing Service", icon: FaMoneyBill },
    ],
  },

  /* ---------- Auth ---------- */
  {
    title: "Auth Providers",
    items: [
      { id: "clerk", label: "Clerk", icon: SiClerk },
      { id: "auth0", label: "Auth0", icon: SiAuth0 },
      { id: "firebase_auth", label: "Firebase Auth", icon: SiFirebaseAuth },
      { id: "supabase_auth", label: "Supabase Auth", icon: SiSupabaseAuth },
      { id: "better_auth", label: "BetterAuth", icon: FaUserShield },
      { id: "custom_auth", label: "Custom Auth", icon: FaKey },
    ],
  },

  /* ---------- Observability ---------- */
  {
    title: "Monitoring & Logs",
    items: [
      { id: "grafana", label: "Grafana", icon: SiGrafana },
      { id: "prometheus", label: "Prometheus", icon: SiPrometheus },
      { id: "kibana", label: "Kibana", icon: SiKibana },
    ],
  },

  /* ---------- Cloud Providers ---------- */
  {
    title: "Cloud Providers",
    items: [
      { id: "aws", label: "AWS", icon: FaAws },
      { id: "gcp", label: "GCP", icon: SiGooglecloud },
      { id: "azure", label: "Azure", icon: VscAzure },
      { id: "digitalocean", label: "DigitalOcean", icon: SiDigitalocean },
      { id: "cloudflare", label: "Cloudflare", icon: SiCloudflare },
      { id: "openstack", label: "OpenStack", icon: SiOpenstack },
    ],
  },
]

/* ===========================================
   COMPONENT
=========================================== */

export default function LeftSidebar({
  collapsed = false,
}: {
  collapsed?: boolean
}) {
  const [search, setSearch] = useState("")

  function onDragStart(e: React.DragEvent, componentId: string) {
    e.dataTransfer.setData("application/reactflow", componentId)
    e.dataTransfer.effectAllowed = "move"
  }

  if (collapsed) {
    return (
      <aside className="w-10 border-r h-full flex items-center justify-center cursor-pointer opacity-60">
        <span className="-rotate-90">›</span>
      </aside>
    )
  }

  return (
    <aside className="w-72 border-r h-full flex flex-col bg-card min-h-0">


  {/* Search */}
  <div className="p-3">
    <Input
      placeholder="Search components..."
      value={search}
      onChange={(e) => setSearch(e.target.value)}
    />
  </div>

  {/* Scrollable Content */}
  <ScrollArea className="flex-1 px-3 pb-3">
    <Accordion type="multiple" className="space-y-1">
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
                      className="rounded-xl border bg-background hover:bg-accent cursor-grab p-3 flex flex-col items-center justify-center gap-2 shadow-sm transition"
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

