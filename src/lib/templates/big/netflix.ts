import { MarkerType } from "reactflow"

export const NetflixTemplate = {
    id: "netflix",
    name: "Netflix Architecture",
    description: "Video streaming at massive scale with Open Connect",
    nodes: [
        // Clients
        {
            id: "client-tv",
            type: "nautilusNode",
            position: { x: 100, y: 0 },
            data: {
                label: "Smart TV",
                icon: "client_web",
                color: "red",
                sim: { latencyMs: 5 },
            },
        },
        {
            id: "client-mobile",
            type: "nautilusNode",
            position: { x: 500, y: 0 },
            data: {
                label: "Mobile App",
                icon: "client_mobile",
                color: "red",
                sim: { latencyMs: 5 },
            },
        },

        // Edge / CDN
        {
            id: "open-connect",
            type: "nautilusNode",
            position: { x: 300, y: 150 },
            data: {
                label: "Open Connect (CDN)",
                icon: "cdn",
                color: "red",
                sim: { capacity: 250000, replicas: 4, latencyMs: 15, errorRate: 0.0002 },
            },
        },

        // Backend Entry
        {
            id: "api-gateway",
            type: "nautilusNode",
            position: { x: 300, y: 300 },
            data: {
                label: "Zuul Gateway",
                icon: "api_server",
                color: "purple",
                sim: { capacity: 20000, replicas: 20, latencyMs: 8, errorRate: 0.001 },
            },
        },

        // Microservices
        {
            id: "playback-service",
            type: "nautilusNode",
            position: { x: 100, y: 450 },
            data: {
                label: "Playback Service",
                icon: "microservice",
                color: "blue",
                sim: { capacity: 2500, replicas: 40, latencyMs: 35, errorRate: 0.002 },
            },
        },
        {
            id: "steering-service",
            type: "nautilusNode",
            position: { x: 300, y: 450 },
            data: {
                label: "Steering Service",
                icon: "microservice",
                color: "blue",
                sim: { capacity: 2500, replicas: 40, latencyMs: 35, errorRate: 0.002 },
            },
        },
        {
            id: "recommendation",
            type: "nautilusNode",
            position: { x: 500, y: 450 },
            data: {
                label: "Recommendations",
                icon: "microservice",
                color: "blue",
                sim: { capacity: 1200, replicas: 40, latencyMs: 80, errorRate: 0.002 },
            },
        },

        // Data Layer
        {
            id: "evcache",
            type: "nautilusNode",
            position: { x: 300, y: 600 },
            data: {
                label: "EVCache (Memcached)",
                icon: "redis",
                color: "orange",
                sim: { capacity: 120000, replicas: 8, latencyMs: 1 },
            },
        },
        {
            id: "cassandra",
            type: "nautilusNode",
            position: { x: 100, y: 750 },
            data: {
                label: "Cassandra (User History)",
                icon: "cassandra",
                color: "red",
                sim: { capacity: 15000, replicas: 8, latencyMs: 6 },
            },
        },
        {
            id: "mysql",
            type: "nautilusNode",
            position: { x: 500, y: 750 },
            data: {
                label: "MySQL (Billing/Account)",
                icon: "mysql",
                color: "blue",
                sim: { capacity: 6000, replicas: 8, latencyMs: 12, errorRate: 0.0005 },
            },
        },

        // Async
        {
            id: "kafka",
            type: "nautilusNode",
            position: { x: 700, y: 450 },
            data: {
                label: "Kafka (Data Pipeline)",
                icon: "kafka",
                color: "orange",
                sim: { capacity: 100000, replicas: 9, latencyMs: 3 },
            },
        },
        {
            id: "spark",
            type: "nautilusNode",
            position: { x: 700, y: 600 },
            data: {
                label: "Spark (Big Data)",
                icon: "elastic",
                color: "yellow",
                sim: { capacity: 8000, replicas: 8, latencyMs: 30 },
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
