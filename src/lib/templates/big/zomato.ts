import { MarkerType } from "reactflow"

export const ZomatoTemplate = {
    id: "zomato",
    name: "Zomato Architecture",
    description: "Food delivery platform with real-time tracking",
    // Playground defaults: the load this design is meant to serve.
    sim: { requestsPerSecond: 12000, timeoutMs: 600, payloadKb: 16, targetUtilization: 0.6, burstFactor: 3 },

    nodes: [
        // Clients
        {
            id: "customer-app",
            type: "nautilusNode",
            position: { x: 190, y: 0 },
            data: {
                label: "Customer App",
                icon: "client_mobile",
                color: "red",
                description: "Diner app: search, order and track delivery",
                sim: { latencyMs: 5 },
            },
        },
        {
            id: "restaurant-app",
            type: "nautilusNode",
            position: { x: 570, y: 0 },
            data: {
                label: "Restaurant App",
                icon: "client_web",
                color: "red",
                description: "Restaurant dashboard for accepting and preparing orders",
                sim: { latencyMs: 5 },
            },
        },
        {
            id: "driver-app",
            type: "nautilusNode",
            position: { x: 950, y: 0 },
            data: {
                label: "Driver App",
                icon: "client_mobile",
                color: "red",
                description: "Delivery partner app streaming location updates",
                sim: { latencyMs: 5 },
            },
        },

        // Entry
        {
            id: "lb",
            type: "nautilusNode",
            position: { x: 570, y: 300 },
            data: {
                label: "Load Balancer",
                icon: "load_balancer",
                color: "blue",
                description: "Terminates TLS and distributes traffic to the gateway fleet",
                sim: { capacity: 50000, replicas: 2, latencyMs: 2, costPerHour: 0.03 },
            },
        },
        {
            id: "api-gateway",
            type: "nautilusNode",
            position: { x: 570, y: 500 },
            data: {
                label: "API Gateway",
                icon: "api_server",
                color: "purple",
                description: "Auth, rate limiting and routing for three different client types",
                sim: { capacity: 20000, replicas: 6, latencyMs: 8, errorRate: 0.001, costPerHour: 0.12 },
            },
        },

        // Services
        {
            id: "restaurant-service",
            type: "nautilusNode",
            position: { x: 190, y: 800 },
            data: {
                label: "Restaurant Service",
                icon: "microservice",
                color: "green",
                description: "Menus, availability and restaurant metadata",
                sim: { capacity: 2500, replicas: 48, latencyMs: 35, errorRate: 0.002, costPerHour: 0.1 },
            },
        },
        {
            id: "order-service",
            type: "nautilusNode",
            position: { x: 570, y: 800 },
            data: {
                label: "Order Service",
                icon: "microservice",
                color: "green",
                description: "Order state machine from placement through delivery",
                sim: { capacity: 2500, replicas: 24, latencyMs: 35, errorRate: 0.002, costPerHour: 0.1 },
            },
        },
        {
            id: "delivery-service",
            type: "nautilusNode",
            position: { x: 950, y: 800 },
            data: {
                label: "Delivery Service",
                icon: "microservice",
                color: "green",
                description: "Assigns partners and tracks delivery in real time",
                sim: { capacity: 2500, replicas: 49, latencyMs: 35, errorRate: 0.002, costPerHour: 0.1 },
            },
        },
        {
            id: "search-service",
            type: "nautilusNode",
            position: { x: 1330, y: 800 },
            data: {
                label: "Search Service",
                icon: "microservice",
                color: "yellow",
                description: "Ranked restaurant and dish search by location",
                sim: { capacity: 8000, replicas: 8, latencyMs: 30, errorRate: 0.002, costPerHour: 0.1 },
            },
        },

        // Data
        {
            id: "restaurant-db",
            type: "nautilusNode",
            position: { x: 190, y: 1100 },
            data: {
                label: "Restaurant DB",
                icon: "postgres",
                color: "blue",
                description: "Relational store for menus and restaurant records",
                sim: { capacity: 6000, replicas: 20, latencyMs: 12, errorRate: 0.0005, costPerHour: 0.35 },
            },
        },
        {
            id: "order-db",
            type: "nautilusNode",
            position: { x: 570, y: 1100 },
            data: {
                label: "Order DB",
                icon: "postgres",
                color: "blue",
                description: "Transactional store for orders and payments",
                sim: { capacity: 6000, replicas: 10, latencyMs: 12, errorRate: 0.0005, costPerHour: 0.35 },
            },
        },
        {
            id: "elasticsearch",
            type: "nautilusNode",
            position: { x: 1330, y: 1100 },
            data: {
                label: "Elasticsearch",
                icon: "elastic",
                color: "yellow",
                description: "Geo and text index behind the search service",
                sim: { capacity: 8000, replicas: 8, latencyMs: 30, costPerHour: 0.32 },
            },
        },

        // Async / Realtime
        {
            id: "kafka",
            type: "nautilusNode",
            position: { x: 570, y: 1400 },
            data: {
                label: "Kafka (Events)",
                icon: "kafka",
                color: "orange",
                description: "Order and delivery events feeding tracking, billing and analytics",
                sim: { capacity: 100000, replicas: 3, latencyMs: 3, costPerHour: 0.22 },
            },
        },
        {
            id: "location-tracking",
            type: "nautilusNode",
            position: { x: 950, y: 1400 },
            data: {
                label: "Location Tracking",
                icon: "redis",
                color: "red",
                description: "In-memory partner locations, updated every few seconds",
                sim: { capacity: 120000, replicas: 3, latencyMs: 1, costPerHour: 0.14, hitRate: 0.9 },
            },
        },
    ],
    edges: [
        // Clients -> LB
        { id: "e1", source: "customer-app", target: "lb", type: "deletableEdge", markerEnd: { type: MarkerType.Arrow } },
        { id: "e2", source: "restaurant-app", target: "lb", type: "deletableEdge", markerEnd: { type: MarkerType.Arrow } },
        { id: "e3", source: "driver-app", target: "lb", type: "deletableEdge", markerEnd: { type: MarkerType.Arrow } },

        // LB -> Gateway
        { id: "e4", source: "lb", target: "api-gateway", type: "deletableEdge", markerEnd: { type: MarkerType.Arrow } },

        // Gateway -> Services
        { id: "e5", source: "api-gateway", target: "restaurant-service", type: "deletableEdge", markerEnd: { type: MarkerType.Arrow } },
        { id: "e6", source: "api-gateway", target: "order-service", type: "deletableEdge", markerEnd: { type: MarkerType.Arrow } },
        { id: "e7", source: "api-gateway", target: "delivery-service", type: "deletableEdge", markerEnd: { type: MarkerType.Arrow } },
        { id: "e8", source: "api-gateway", target: "search-service", type: "deletableEdge", markerEnd: { type: MarkerType.Arrow } },

        // Services -> Data
        { id: "e9", source: "restaurant-service", target: "restaurant-db", type: "deletableEdge", markerEnd: { type: MarkerType.Arrow } },
        { id: "e10", source: "order-service", target: "order-db", type: "deletableEdge", markerEnd: { type: MarkerType.Arrow } },
        { id: "e11", source: "search-service", target: "elasticsearch", type: "deletableEdge", markerEnd: { type: MarkerType.Arrow } },

        // Order Flow
        { id: "e12", source: "order-service", target: "kafka", type: "deletableEdge", markerEnd: { type: MarkerType.Arrow }, animated: true, label: "Order Placed" },
        { id: "e13", source: "kafka", target: "delivery-service", type: "deletableEdge", markerEnd: { type: MarkerType.Arrow }, animated: true },
        { id: "e14", source: "kafka", target: "restaurant-service", type: "deletableEdge", markerEnd: { type: MarkerType.Arrow }, animated: true },

        // Tracking
        { id: "e15", source: "driver-app", target: "location-tracking", type: "deletableEdge", markerEnd: { type: MarkerType.Arrow }, animated: true, label: "GPS Update" },
        { id: "e16", source: "location-tracking", target: "delivery-service", type: "deletableEdge", markerEnd: { type: MarkerType.Arrow } },
    ],
}
