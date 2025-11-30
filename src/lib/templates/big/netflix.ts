import { MarkerType } from "react-flow-renderer"

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
            data: { label: "Smart TV", icon: "client_web", color: "red" },
        },
        {
            id: "client-mobile",
            type: "nautilusNode",
            position: { x: 500, y: 0 },
            data: { label: "Mobile App", icon: "client_mobile", color: "red" },
        },

        // Edge / CDN
        {
            id: "open-connect",
            type: "nautilusNode",
            position: { x: 300, y: 150 },
            data: { label: "Open Connect (CDN)", icon: "cdn", color: "red" },
        },

        // Backend Entry
        {
            id: "api-gateway",
            type: "nautilusNode",
            position: { x: 300, y: 300 },
            data: { label: "Zuul Gateway", icon: "api_server", color: "purple" },
        },

        // Microservices
        {
            id: "playback-service",
            type: "nautilusNode",
            position: { x: 100, y: 450 },
            data: { label: "Playback Service", icon: "microservice", color: "blue" },
        },
        {
            id: "steering-service",
            type: "nautilusNode",
            position: { x: 300, y: 450 },
            data: { label: "Steering Service", icon: "microservice", color: "blue" },
        },
        {
            id: "recommendation",
            type: "nautilusNode",
            position: { x: 500, y: 450 },
            data: { label: "Recommendations", icon: "microservice", color: "blue" },
        },

        // Data Layer
        {
            id: "evcache",
            type: "nautilusNode",
            position: { x: 300, y: 600 },
            data: { label: "EVCache (Memcached)", icon: "redis", color: "orange" },
        },
        {
            id: "cassandra",
            type: "nautilusNode",
            position: { x: 100, y: 750 },
            data: { label: "Cassandra (User History)", icon: "cassandra", color: "red" },
        },
        {
            id: "mysql",
            type: "nautilusNode",
            position: { x: 500, y: 750 },
            data: { label: "MySQL (Billing/Account)", icon: "mysql", color: "blue" },
        },

        // Async
        {
            id: "kafka",
            type: "nautilusNode",
            position: { x: 700, y: 450 },
            data: { label: "Kafka (Data Pipeline)", icon: "kafka", color: "orange" },
        },
        {
            id: "spark",
            type: "nautilusNode",
            position: { x: 700, y: 600 },
            data: { label: "Spark (Big Data)", icon: "elastic", color: "yellow" },
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
