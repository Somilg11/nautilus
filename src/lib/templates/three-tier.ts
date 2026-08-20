import { MarkerType } from "reactflow"

export const ThreeTierTemplate = {
  id: "three-tier",
  name: "Production 3-Tier Web App",
  description: "Scalable architecture with LB, Cache, and DB Replication",
  nodes: [
    // Tier 1: Presentation / Client
    {
      id: "client",
      type: "nautilusNode",
      position: { x: 250, y: 0 },
      data: {
        label: "Client (Browser/Mobile)",
        icon: "client_web",
        color: "blue",
        sim: { latencyMs: 5 },
      },
    },
    {
      id: "dns",
      type: "nautilusNode",
      position: { x: 250, y: 100 },
      data: {
        label: "DNS (Route53)",
        icon: "dns",
        color: "purple",
        sim: { capacity: 200000, latencyMs: 3 },
      },
    },
    {
      id: "cdn",
      type: "nautilusNode",
      position: { x: 450, y: 100 },
      data: {
        label: "CDN (Cloudflare)",
        icon: "cdn",
        color: "orange",
        sim: { capacity: 250000, latencyMs: 15, errorRate: 0.0002 },
      },
    },

    // Tier 2: Application / Logic
    {
      id: "lb",
      type: "nautilusNode",
      position: { x: 250, y: 200 },
      data: {
        label: "Load Balancer (Nginx)",
        icon: "load_balancer",
        color: "green",
        sim: { capacity: 50000, latencyMs: 2 },
      },
    },
    {
      id: "web-server-1",
      type: "nautilusNode",
      position: { x: 100, y: 350 },
      data: {
        label: "Web Server 1",
        icon: "web_server",
        color: "green",
        sim: { capacity: 8000, replicas: 2, latencyMs: 15 },
      },
    },
    {
      id: "web-server-2",
      type: "nautilusNode",
      position: { x: 400, y: 350 },
      data: {
        label: "Web Server 2",
        icon: "web_server",
        color: "green",
        sim: { capacity: 8000, replicas: 2, latencyMs: 15 },
      },
    },

    // Caching Layer
    {
      id: "cache",
      type: "nautilusNode",
      position: { x: 600, y: 350 },
      data: {
        label: "Cache (Redis)",
        icon: "redis",
        color: "red",
        sim: { capacity: 120000, latencyMs: 1 },
      },
    },

    // Tier 3: Data
    {
      id: "db-primary",
      type: "nautilusNode",
      position: { x: 150, y: 500 },
      data: {
        label: "Primary DB (Postgres)",
        icon: "postgres",
        color: "blue",
        sim: { capacity: 6000, latencyMs: 12, errorRate: 0.0005 },
      },
    },
    {
      id: "db-replica",
      type: "nautilusNode",
      position: { x: 350, y: 500 },
      data: {
        label: "Read Replica",
        icon: "postgres",
        color: "blue",
        sim: { capacity: 6000, latencyMs: 12, errorRate: 0.0005 },
      },
    },
  ],
  edges: [
    // Client -> DNS
    { id: "e1", source: "client", target: "dns", type: "deletableEdge", markerEnd: { type: MarkerType.Arrow } },
    // Client -> CDN (Static assets)
    { id: "e2", source: "client", target: "cdn", type: "deletableEdge", markerEnd: { type: MarkerType.Arrow }, animated: true, label: "Static Assets" },
    // DNS -> LB
    { id: "e3", source: "dns", target: "lb", type: "deletableEdge", markerEnd: { type: MarkerType.Arrow } },

    // LB -> Web Servers
    { id: "e4", source: "lb", target: "web-server-1", type: "deletableEdge", markerEnd: { type: MarkerType.Arrow }, data: { sim: { share: 0.5 } }, label: "50%" },
    { id: "e5", source: "lb", target: "web-server-2", type: "deletableEdge", markerEnd: { type: MarkerType.Arrow }, data: { sim: { share: 0.5 } }, label: "50%" },

    // Web Servers -> Cache
    { id: "e6", source: "web-server-1", target: "cache", type: "deletableEdge", markerEnd: { type: MarkerType.Arrow }, animated: true },
    { id: "e7", source: "web-server-2", target: "cache", type: "deletableEdge", markerEnd: { type: MarkerType.Arrow }, animated: true },

    // Web Servers -> DB
    { id: "e8", source: "web-server-1", target: "db-primary", type: "deletableEdge", markerEnd: { type: MarkerType.Arrow }, data: { sim: { share: 0.15 } }, label: "cache miss" },
    { id: "e9", source: "web-server-2", target: "db-primary", type: "deletableEdge", markerEnd: { type: MarkerType.Arrow }, data: { sim: { share: 0.15 } }, label: "cache miss" },

    // DB Replication
    { id: "e10", source: "db-primary", target: "db-replica", type: "deletableEdge", markerEnd: { type: MarkerType.Arrow }, animated: true, label: "Replication", data: { sim: { share: 0.2 } } },
  ],
}
