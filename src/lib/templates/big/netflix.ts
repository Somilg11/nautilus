import { MarkerType } from "reactflow"

export const NetflixTemplate = {
    id: "netflix",
    name: "Netflix Architecture",
    description: "Video streaming at massive scale with Open Connect",
    // Playground defaults: the load this design is meant to serve.
    sim: { requestsPerSecond: 50000, timeoutMs: 800, payloadKb: 48, targetUtilization: 0.65, burstFactor: 1.8 },

    nodes: [
        // Clients
        {
            id: "client-tv",
            type: "nautilusNode",
            position: { x: 190, y: 0 },
            data: {
                label: "Smart TV",
                icon: "client_web",
                color: "red",
                description: "Smart TV app: the majority of streaming hours",
                sim: { latencyMs: 5 },
            },
        },
        {
            id: "client-mobile",
            type: "nautilusNode",
            position: { x: 950, y: 0 },
            data: {
                label: "Mobile App",
                icon: "client_mobile",
                color: "red",
                description: "Mobile app using the same APIs with different bitrates",
                sim: { latencyMs: 5 },
            },
        },

        // Edge / CDN
        {
            id: "open-connect",
            type: "nautilusNode",
            position: { x: 570, y: 300 },
            data: {
                label: "Open Connect (CDN)",
                icon: "cdn",
                color: "red",
                description: "Netflix-operated CDN appliances inside ISP networks",
                sim: { capacity: 250000, replicas: 4, latencyMs: 15, errorRate: 0.0002, costPerHour: 0.09, hitRate: 0.95 },
            },
        },

        // Backend Entry
        {
            id: "api-gateway",
            type: "nautilusNode",
            position: { x: 570, y: 600 },
            data: {
                label: "Zuul Gateway",
                icon: "api_server",
                color: "purple",
                description: "Zuul: routing, auth and per-device request shaping",
                sim: { capacity: 20000, replicas: 20, latencyMs: 8, errorRate: 0.001, costPerHour: 0.12 },
            },
        },

        // Microservices
        {
            id: "playback-service",
            type: "nautilusNode",
            position: { x: 190, y: 900 },
            data: {
                label: "Playback Service",
                icon: "microservice",
                color: "blue",
                description: "Authorises playback and issues streaming licences",
                sim: { capacity: 2500, replicas: 56, latencyMs: 35, errorRate: 0.002, costPerHour: 0.1 },
            },
        },
        {
            id: "steering-service",
            type: "nautilusNode",
            position: { x: 570, y: 900 },
            data: {
                label: "Steering Service",
                icon: "microservice",
                color: "blue",
                description: "Picks the best Open Connect server for each client",
                sim: { capacity: 2500, replicas: 56, latencyMs: 35, errorRate: 0.002, costPerHour: 0.1 },
            },
        },
        {
            id: "recommendation",
            type: "nautilusNode",
            position: { x: 950, y: 900 },
            data: {
                label: "Recommendations",
                icon: "microservice",
                color: "blue",
                description: "Ranks rows and titles for the home screen",
                sim: { capacity: 1200, replicas: 116, latencyMs: 80, errorRate: 0.002, costPerHour: 0.1 },
            },
        },

        // Data Layer
        {
            id: "evcache",
            type: "nautilusNode",
            position: { x: 570, y: 1200 },
            data: {
                label: "EVCache (Memcached)",
                icon: "redis",
                color: "orange",
                description: "Distributed memcached tier absorbing most metadata reads",
                sim: { capacity: 120000, replicas: 8, latencyMs: 1, costPerHour: 0.14, hitRate: 0.9 },
            },
        },
        {
            id: "cassandra",
            type: "nautilusNode",
            position: { x: 190, y: 1500 },
            data: {
                label: "Cassandra (User History)",
                icon: "cassandra",
                color: "red",
                description: "Viewing history and user state, written on every playback event",
                sim: { capacity: 15000, replicas: 10, latencyMs: 6, costPerHour: 0.28 },
            },
        },
        {
            id: "mysql",
            type: "nautilusNode",
            position: { x: 950, y: 1500 },
            data: {
                label: "MySQL (Billing/Account)",
                icon: "mysql",
                color: "blue",
                description: "Billing and account records, the one strongly relational store",
                sim: { capacity: 6000, replicas: 24, latencyMs: 12, errorRate: 0.0005, costPerHour: 0.35 },
            },
        },

        // Async
        {
            id: "kafka",
            type: "nautilusNode",
            position: { x: 1330, y: 900 },
            data: {
                label: "Kafka (Data Pipeline)",
                icon: "kafka",
                color: "orange",
                description: "Pipeline carrying playback and UI events to the data platform",
                sim: { capacity: 100000, replicas: 9, latencyMs: 3, costPerHour: 0.22 },
            },
        },
        {
            id: "spark",
            type: "nautilusNode",
            position: { x: 1330, y: 1200 },
            data: {
                label: "Spark (Big Data)",
                icon: "elastic",
                color: "yellow",
                description: "Batch and streaming jobs producing the recommendation models",
                sim: { capacity: 8000, replicas: 18, latencyMs: 30, costPerHour: 0.32 },
            },
        },
    ],
    edges: [
        // Streaming Flow
        { id: "e1", source: "client-tv", target: "open-connect", type: "deletableEdge", markerEnd: { type: MarkerType.Arrow }, animated: true, label: "Stream Video" },
        { id: "e2", source: "client-mobile", target: "open-connect", type: "deletableEdge", markerEnd: { type: MarkerType.Arrow }, animated: true, label: "Stream Video" },

        // API Flow
        { id: "e3", source: "client-tv", target: "api-gateway", type: "deletableEdge", markerEnd: { type: MarkerType.Arrow } },
        { id: "e4", source: "client-mobile", target: "api-gateway", type: "deletableEdge", markerEnd: { type: MarkerType.Arrow } },

        // Gateway -> Services
        { id: "e5", source: "api-gateway", target: "playback-service", type: "deletableEdge", markerEnd: { type: MarkerType.Arrow } },
        { id: "e6", source: "api-gateway", target: "steering-service", type: "deletableEdge", markerEnd: { type: MarkerType.Arrow } },
        { id: "e7", source: "api-gateway", target: "recommendation", type: "deletableEdge", markerEnd: { type: MarkerType.Arrow } },

        // Services -> Cache
        { id: "e8", source: "playback-service", target: "evcache", type: "deletableEdge", markerEnd: { type: MarkerType.Arrow } },
        { id: "e9", source: "recommendation", target: "evcache", type: "deletableEdge", markerEnd: { type: MarkerType.Arrow } },

        // Services -> DB
        { id: "e10", source: "playback-service", target: "cassandra", type: "deletableEdge", markerEnd: { type: MarkerType.Arrow } },
        { id: "e11", source: "api-gateway", target: "mysql", type: "deletableEdge", markerEnd: { type: MarkerType.Arrow } },

        // Analytics
        { id: "e12", source: "recommendation", target: "kafka", type: "deletableEdge", markerEnd: { type: MarkerType.Arrow }, animated: true },
        { id: "e13", source: "kafka", target: "spark", type: "deletableEdge", markerEnd: { type: MarkerType.Arrow }, animated: true },
    ],
}
