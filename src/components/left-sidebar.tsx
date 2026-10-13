/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { useState } from "react"
import { Search } from "lucide-react"
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
import { FaServer, FaCogs, FaClock, FaNetworkWired } from "react-icons/fa"
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
      { id: "worker", label: "Worker (runs continuously)", icon: FaCogs },
      { id: "cron", label: "Cron Job (scheduled)", icon: FaClock },
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

const ALL_ITEMS = CATEGORIES.flatMap((c) =>
  c.items.map((i) => ({ ...i, category: c.title }))
)

export default function LeftSidebar({
  collapsed = false,
}: {
  collapsed?: boolean
}) {
  const [search, setSearch] = useState("")
  const query = search.trim().toLowerCase()

  function onDragStart(e: React.DragEvent, componentId: string) {
    e.dataTransfer.setData("application/reactflow", componentId)
    e.dataTransfer.effectAllowed = "move"
  }

  if (collapsed) return null

  // While searching, a flat result list beats collapsed accordion groups —
  // matches used to hide inside sections the user then had to expand.
  const results = query
    ? ALL_ITEMS.filter(
        (i) =>
          i.label.toLowerCase().includes(query) ||
          i.id.includes(query) ||
          i.category.toLowerCase().includes(query)
      )
    : []

  return (
    <aside className="flex h-full w-full min-h-0 flex-col bg-background">
      <div className="flex items-center justify-between px-3 pt-3 pb-2">
        <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground/70">
          Components
        </span>
        <span className="text-[11px] text-muted-foreground">{ALL_ITEMS.length}</span>
      </div>

      <div className="px-3 pb-2">
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search components…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.stopPropagation()}
            aria-label="Search components"
            className="h-8 pl-8 text-[13px]"
          />
        </div>
      </div>

      <ScrollArea className="min-h-0 flex-1 px-3 pb-3">
        {query ? (
          <div className="space-y-1 py-1">
            {results.map((c) => (
              <PaletteRow key={c.id} item={c} onDragStart={onDragStart} showCategory />
            ))}
            {results.length === 0 && (
              <p className="py-8 text-center text-[12px] text-muted-foreground">
                No component matches “{search}”.
              </p>
            )}
          </div>
        ) : (
          <Accordion
            type="multiple"
            defaultValue={[CATEGORIES[0].title, CATEGORIES[1].title]}
            className="space-y-0.5"
          >
            {CATEGORIES.map((category) => (
              <AccordionItem key={category.title} value={category.title} className="border-b-0">
                <AccordionTrigger className="rounded-md px-2 py-2 text-[13px] font-medium hover:bg-muted/60 hover:no-underline">
                  {category.title}
                </AccordionTrigger>
                <AccordionContent className="pb-2">
                  <div className="space-y-1">
                    {category.items.map((c) => (
                      <PaletteRow key={c.id} item={c} onDragStart={onDragStart} />
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}
      </ScrollArea>

      <div className="border-t px-3 py-2 text-[11px] text-muted-foreground">
        Drag any component onto the canvas
      </div>
    </aside>
  )
}

function PaletteRow({
  item,
  onDragStart,
  showCategory,
}: {
  item: ComponentItem & { category?: string }
  onDragStart: (e: React.DragEvent, id: string) => void
  showCategory?: boolean
}) {
  const Icon = item.icon

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, item.id)}
      title={`Drag "${item.label}" onto the canvas`}
      className="flex cursor-grab items-center gap-2.5 rounded-md border border-transparent px-2 py-1.5 transition-colors hover:border-border hover:bg-accent active:cursor-grabbing"
    >
      <span className="grid h-6 w-6 shrink-0 place-items-center rounded bg-muted text-foreground [&_svg]:h-3.5 [&_svg]:w-3.5">
        <Icon />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[13px]">{item.label}</span>
        {showCategory && item.category && (
          <span className="block truncate text-[11px] text-muted-foreground">{item.category}</span>
        )}
      </span>
    </div>
  )
}
