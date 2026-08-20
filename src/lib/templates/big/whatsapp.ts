import { MarkerType } from "reactflow"

export const WhatsAppTemplate = {
    id: "whatsapp",
    name: "WhatsApp Architecture",
    description: "Real-time messaging with high concurrency (Erlang/Ejabberd)",
    nodes: [
        // Clients
        {
            id: "user-a",
            type: "nautilusNode",
            position: { x: 100, y: 0 },
            data: {
                label: "User A",
                icon: "client_mobile",
                color: "green",
                sim: { latencyMs: 5 },
            },
        },
        {
            id: "user-b",
            type: "nautilusNode",
            position: { x: 500, y: 0 },
            data: {
                label: "User B",
                icon: "client_mobile",
                color: "green",
                sim: { latencyMs: 5 },
            },
        },

        // Load Balancer
        {
            id: "lb",
            type: "nautilusNode",
            position: { x: 300, y: 100 },
            data: {
                label: "Load Balancer",
                icon: "load_balancer",
                color: "blue",
                sim: { capacity: 50000, replicas: 4, latencyMs: 2 },
            },
        },

        // Chat Gateway
        {
            id: "chat-gateway",
            type: "nautilusNode",
            position: { x: 300, y: 250 },
            data: {
                label: "Chat Gateway (Ejabberd)",
                icon: "api_server",
                color: "red",
                sim: { capacity: 20000, replicas: 20, latencyMs: 8, errorRate: 0.001 },
            },
        },

        // Services
        {
            id: "auth-service",
            type: "nautilusNode",
            position: { x: 100, y: 400 },
            data: {
                label: "Auth Service",
                icon: "auth",
                color: "purple",
                sim: { capacity: 5000, replicas: 40, latencyMs: 40, errorRate: 0.001 },
            },
        },
        {
            id: "group-service",
            type: "nautilusNode",
            position: { x: 500, y: 400 },
            data: {
                label: "Group Service",
                icon: "microservice",
                color: "purple",
                sim: { capacity: 2500, replicas: 40, latencyMs: 35, errorRate: 0.002 },
            },
        },

        // Data Layer
        {
            id: "mnesia",
            type: "nautilusNode",
            position: { x: 300, y: 400 },
            data: {
                label: "Mnesia (Session DB)",
                icon: "redis",
                color: "orange",
                sim: { capacity: 120000, replicas: 8, latencyMs: 1 },
            },
        },
        {
            id: "cassandra",
            type: "nautilusNode",
            position: { x: 300, y: 550 },
            data: {
                label: "Cassandra (Message Store)",
                icon: "cassandra",
                color: "blue",
                sim: { capacity: 15000, replicas: 8, latencyMs: 6 },
            },
        },

        // Media
        {
            id: "media-server",
            type: "nautilusNode",
            position: { x: 700, y: 250 },
            data: {
                label: "Media Server (HTTP)",
                icon: "web_server",
                color: "green",
                sim: { capacity: 8000, replicas: 20, latencyMs: 15 },
            },
        },
        {
            id: "blob-storage",
            type: "nautilusNode",
            position: { x: 700, y: 400 },
            data: {
                label: "Blob Storage",
                icon: "s3",
                color: "orange",
                sim: { capacity: 15000, replicas: 4, latencyMs: 45 },
            },
        },
    ],
    edges: [
        // Connections
        { id: "e1", source: "user-a", target: "lb", type: "deletableEdge", markerEnd: { type: MarkerType.Arrow }, label: "WebSocket" },
        { id: "e2", source: "user-b", target: "lb", type: "deletableEdge", markerEnd: { type: MarkerType.Arrow }, label: "WebSocket" },

        // LB -> Gateway
        { id: "e3", source: "lb", target: "chat-gateway", type: "deletableEdge", markerEnd: { type: MarkerType.Arrow } },

        // Gateway Logic
        { id: "e4", source: "chat-gateway", target: "auth-service", type: "deletableEdge", markerEnd: { type: MarkerType.Arrow } },
        { id: "e5", source: "chat-gateway", target: "mnesia", type: "deletableEdge", markerEnd: { type: MarkerType.Arrow }, label: "Check Online" },
        { id: "e6", source: "chat-gateway", target: "cassandra", type: "deletableEdge", markerEnd: { type: MarkerType.Arrow }, label: "Store Msg" },
        { id: "e7", source: "chat-gateway", target: "group-service", type: "deletableEdge", markerEnd: { type: MarkerType.Arrow } },

        // Media Upload
        { id: "e8", source: "user-a", target: "media-server", type: "deletableEdge", markerEnd: { type: MarkerType.Arrow }, label: "Upload Img" },
        { id: "e9", source: "media-server", target: "blob-storage", type: "deletableEdge", markerEnd: { type: MarkerType.Arrow } },
    ],
}
