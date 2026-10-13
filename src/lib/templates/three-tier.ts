import { MarkerType } from "reactflow"

export const ThreeTierTemplate = {
  id: "three-tier",
  name: "Production 3-Tier Web App",
  description: "Scalable architecture with LB, Cache, and DB Replication",
  // Playground defaults: the load this design is meant to serve.
  sim: { requestsPerSecond: 5000, timeoutMs: 500, payloadKb: 12, targetUtilization: 0.7, burstFactor: 2 },

  nodes: [
    // Tier 1: Presentation / Client
    {
      id: "client",
      type: "nautilusNode",
      position: { x: 475, y: 0 },
      data: {
        label: "Client (Browser/Mobile)",
        icon: "client_web",
        color: "blue",
        description: "Browser or mobile app making HTTPS requests",
        sim: { latencyMs: 5 },
      },
    },
    {
      id: "dns",
      type: "nautilusNode",
      position: { x: 475, y: 200 },
      data: {
        label: "DNS (Route53)",
        icon: "dns",
        color: "purple",
        description: "Resolves the domain and steers traffic to the nearest region",
        sim: { capacity: 200000, latencyMs: 3, costPerHour: 0.01 },
      },
    },
    {
      id: "cdn",
      type: "nautilusNode",
      position: { x: 855, y: 200 },
      data: {
        label: "CDN (Cloudflare)",
        icon: "cdn",
        color: "orange",
        description: "Serves static assets from the edge so origin only sees dynamic traffic",
        sim: { capacity: 250000, latencyMs: 15, errorRate: 0.0002, costPerHour: 0.09, hitRate: 0.95 },
      },
    },

    // Tier 2: Application / Logic
    {
      id: "lb",
      type: "nautilusNode",
      position: { x: 475, y: 400 },
      data: {
        label: "Load Balancer (Nginx)",
        icon: "load_balancer",
        color: "green",
        description: "Health-checks the pool and spreads requests evenly across web servers",
        sim: { capacity: 50000, latencyMs: 2, costPerHour: 0.03 },
      },
    },
    {
      id: "web-server-1",
      type: "nautilusNode",
      position: { x: 190, y: 700 },
      data: {
        label: "Web Server 1",
        icon: "web_server",
        color: "green",
        description: "Stateless app server: renders pages and calls the data tier",
        sim: { capacity: 8000, replicas: 2, latencyMs: 15, costPerHour: 0.1 },
      },
    },
    {
      id: "web-server-2",
      type: "nautilusNode",
      position: { x: 760, y: 700 },
      data: {
        label: "Web Server 2",
        icon: "web_server",
        color: "green",
        description: "Second instance of the same app server, for capacity and failover",
        sim: { capacity: 8000, replicas: 2, latencyMs: 15, costPerHour: 0.1 },
      },
    },

    // Caching Layer
    {
      id: "cache",
      type: "nautilusNode",
      position: { x: 1140, y: 700 },
      data: {
        label: "Cache (Redis)",
        icon: "redis",
        color: "red",
        description: "Read-through cache; absorbs ~90% of reads before they reach Postgres",
        sim: { capacity: 120000, latencyMs: 1, costPerHour: 0.14, hitRate: 0.9 },
      },
    },

    // Tier 3: Data
    {
      id: "db-primary",
      type: "nautilusNode",
      position: { x: 285, y: 1000 },
      data: {
        label: "Primary DB (Postgres)",
        icon: "postgres",
        color: "blue",
        description: "Source of truth. Handles every write and streams changes to the replica",
        sim: { capacity: 6000, latencyMs: 12, errorRate: 0.0005, costPerHour: 0.35 },
      },
    },
    {
      id: "db-replica",
      type: "nautilusNode",
      position: { x: 665, y: 1000 },
      data: {
        label: "Read Replica",
        icon: "postgres",
        color: "blue",
        description: "Read-only copy for reporting and read scaling; lags the primary slightly",
        sim: { capacity: 6000, latencyMs: 12, errorRate: 0.0005, costPerHour: 0.35 },
      },
    },
  ],
  edges: [
    // Client -> DNS
    { id: "e1", source: "client", target: "dns", type: "deletableEdge", markerEnd: { type: MarkerType.Arrow } },
    // Client -> CDN (Static assets)
    { id: "e2", source: "client", target: "cdn", type: "deletableEdge", markerEnd: { type: MarkerType.Arrow }, animated: true, label: "Static Assets", data: { flow: { op: "GET" } } },
    // DNS -> LB
    { id: "e3", source: "dns", target: "lb", type: "deletableEdge", markerEnd: { type: MarkerType.Arrow } },

    // LB -> Web Servers
    { id: "e4", source: "lb", target: "web-server-1", type: "deletableEdge", markerEnd: { type: MarkerType.Arrow }, data: { flow: { op: "GET" }, sim: { share: 0.5 } }, label: "50%" },
    { id: "e5", source: "lb", target: "web-server-2", type: "deletableEdge", markerEnd: { type: MarkerType.Arrow }, data: { flow: { op: "GET" }, sim: { share: 0.5 } }, label: "50%" },

    // Web Servers -> Cache
    { id: "e6", source: "web-server-1", target: "cache", type: "deletableEdge", markerEnd: { type: MarkerType.Arrow }, animated: true, data: { flow: { op: "READ" } } },
    { id: "e7", source: "web-server-2", target: "cache", type: "deletableEdge", markerEnd: { type: MarkerType.Arrow }, animated: true, data: { flow: { op: "READ" } } },

    // Web Servers -> DB
    { id: "e8", source: "web-server-1", target: "db-primary", type: "deletableEdge", markerEnd: { type: MarkerType.Arrow }, data: { sim: { share: 0.15 } }, label: "cache miss" },
    { id: "e9", source: "web-server-2", target: "db-primary", type: "deletableEdge", markerEnd: { type: MarkerType.Arrow }, data: { sim: { share: 0.15 } }, label: "cache miss" },

    // DB Replication
    { id: "e10", source: "db-primary", target: "db-replica", type: "deletableEdge", markerEnd: { type: MarkerType.Arrow }, animated: true, label: "Replication", data: { flow: { op: "EVENT" }, sim: { share: 0.2 } } },
  ],
}
