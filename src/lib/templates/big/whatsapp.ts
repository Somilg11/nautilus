import { MarkerType } from "reactflow"

export const WhatsAppTemplate = {
    id: "whatsapp",
    name: "WhatsApp Architecture",
    description: "Real-time messaging with high concurrency (Erlang/Ejabberd)",
    // Playground defaults: the load this design is meant to serve.
    sim: { requestsPerSecond: 60000, timeoutMs: 500, payloadKb: 4, targetUtilization: 0.7, burstFactor: 1.5 },

    nodes: [
        // Clients
        {
            id: "user-a",
            type: "nautilusNode",
            position: { x: 190, y: 0 },
            data: {
                label: "User A",
                icon: "client_mobile",
                color: "green",
                description: "Sender: a phone holding a persistent connection to the gateway",
                sim: { latencyMs: 5 },
            },
        },
        {
            id: "user-b",
            type: "nautilusNode",
            position: { x: 950, y: 0 },
            data: {
                label: "User B",
                icon: "client_mobile",
                color: "green",
                description: "Recipient, connected the same way and possibly offline",
                sim: { latencyMs: 5 },
            },
        },

        // Load Balancer
        {
            id: "lb",
            type: "nautilusNode",
            position: { x: 570, y: 200 },
            data: {
                label: "Load Balancer",
                icon: "load_balancer",
                color: "blue",
                description: "Spreads long-lived connections across the gateway fleet",
                sim: { capacity: 50000, replicas: 4, latencyMs: 2, costPerHour: 0.03 },
            },
        },

        // Chat Gateway
        {
            id: "chat-gateway",
            type: "nautilusNode",
            position: { x: 570, y: 500 },
            data: {
                label: "Chat Gateway (Ejabberd)",
                icon: "api_server",
                color: "red",
                description: "Erlang gateway holding millions of concurrent sockets",
                sim: { capacity: 20000, replicas: 20, latencyMs: 8, errorRate: 0.001, costPerHour: 0.12 },
            },
        },

        // Services
        {
            id: "auth-service",
            type: "nautilusNode",
            position: { x: 190, y: 800 },
            data: {
                label: "Auth Service",
                icon: "auth",
                color: "purple",
                description: "Verifies devices and registers session keys on connect",
                sim: { capacity: 5000, replicas: 40, latencyMs: 40, errorRate: 0.001, costPerHour: 0.1 },
            },
        },
        {
            id: "group-service",
            type: "nautilusNode",
            position: { x: 950, y: 800 },
            data: {
                label: "Group Service",
                icon: "microservice",
                color: "purple",
                description: "Fans a group message out to every member",
                sim: { capacity: 2500, replicas: 52, latencyMs: 35, errorRate: 0.002, costPerHour: 0.1 },
            },
        },

        // Data Layer
        {
            id: "mnesia",
            type: "nautilusNode",
            position: { x: 570, y: 800 },
            data: {
                label: "Mnesia (Session DB)",
                icon: "redis",
                color: "orange",
                description: "In-memory session and presence store, co-located with the gateway",
                sim: { capacity: 120000, replicas: 8, latencyMs: 1, costPerHour: 0.14, hitRate: 0.9 },
            },
        },
        {
            id: "cassandra",
            type: "nautilusNode",
            position: { x: 570, y: 1100 },
            data: {
                label: "Cassandra (Message Store)",
                icon: "cassandra",
                color: "blue",
                description: "Durable message store for undelivered and historical messages",
                sim: { capacity: 15000, replicas: 9, latencyMs: 6, costPerHour: 0.28 },
            },
        },

        // Media
        {
            id: "media-server",
            type: "nautilusNode",
            position: { x: 1330, y: 500 },
            data: {
                label: "Media Server (HTTP)",
                icon: "web_server",
                color: "green",
                description: "Handles photo, video and voice uploads outside the chat path",
                sim: { capacity: 8000, replicas: 20, latencyMs: 15, costPerHour: 0.1 },
            },
        },
        {
            id: "blob-storage",
            type: "nautilusNode",
            position: { x: 1330, y: 800 },
            data: {
                label: "Blob Storage",
                icon: "s3",
                color: "orange",
                description: "Encrypted media blobs, referenced by the message record",
                sim: { capacity: 15000, replicas: 5, latencyMs: 45, costPerHour: 0.05 },
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
