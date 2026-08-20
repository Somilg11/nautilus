import { MarkerType } from "reactflow"

export const ZomatoTemplate = {
    id: "zomato",
    name: "Zomato Architecture",
    description: "Food delivery platform with real-time tracking",
    nodes: [
        // Clients
        {
            id: "customer-app",
            type: "nautilusNode",
            position: { x: 100, y: 0 },
            data: {
                label: "Customer App",
                icon: "client_mobile",
                color: "red",
                sim: { latencyMs: 5 },
            },
        },
        {
            id: "restaurant-app",
            type: "nautilusNode",
            position: { x: 300, y: 0 },
            data: {
                label: "Restaurant App",
                icon: "client_web",
                color: "red",
                sim: { latencyMs: 5 },
            },
        },
        {
            id: "driver-app",
            type: "nautilusNode",
            position: { x: 500, y: 0 },
            data: {
                label: "Driver App",
                icon: "client_mobile",
                color: "red",
                sim: { latencyMs: 5 },
            },
        },

        // Entry
        {
            id: "lb",
            type: "nautilusNode",
            position: { x: 300, y: 150 },
            data: {
                label: "Load Balancer",
                icon: "load_balancer",
                color: "blue",
                sim: { capacity: 50000, replicas: 2, latencyMs: 2 },
            },
        },
        {
            id: "api-gateway",
            type: "nautilusNode",
            position: { x: 300, y: 250 },
            data: {
                label: "API Gateway",
                icon: "api_server",
                color: "purple",
                sim: { capacity: 20000, replicas: 6, latencyMs: 8, errorRate: 0.001 },
            },
        },

        // Services
        {
            id: "restaurant-service",
            type: "nautilusNode",
            position: { x: 100, y: 400 },
            data: {
                label: "Restaurant Service",
                icon: "microservice",
                color: "green",
                sim: { capacity: 2500, replicas: 8, latencyMs: 35, errorRate: 0.002 },
            },
        },
        {
            id: "order-service",
            type: "nautilusNode",
            position: { x: 300, y: 400 },
            data: {
                label: "Order Service",
                icon: "microservice",
                color: "green",
                sim: { capacity: 2500, replicas: 8, latencyMs: 35, errorRate: 0.002 },
            },
        },
        {
            id: "delivery-service",
            type: "nautilusNode",
            position: { x: 500, y: 400 },
            data: {
                label: "Delivery Service",
                icon: "microservice",
                color: "green",
                sim: { capacity: 2500, replicas: 8, latencyMs: 35, errorRate: 0.002 },
            },
        },
        {
            id: "search-service",
            type: "nautilusNode",
            position: { x: 700, y: 400 },
            data: {
                label: "Search Service",
                icon: "microservice",
                color: "yellow",
                sim: { capacity: 8000, replicas: 8, latencyMs: 30, errorRate: 0.002 },
            },
        },

        // Data
        {
            id: "restaurant-db",
            type: "nautilusNode",
            position: { x: 100, y: 550 },
            data: {
                label: "Restaurant DB",
                icon: "postgres",
                color: "blue",
                sim: { capacity: 6000, replicas: 3, latencyMs: 12, errorRate: 0.0005 },
            },
        },
        {
            id: "order-db",
            type: "nautilusNode",
            position: { x: 300, y: 550 },
            data: {
                label: "Order DB",
                icon: "postgres",
                color: "blue",
                sim: { capacity: 6000, replicas: 3, latencyMs: 12, errorRate: 0.0005 },
            },
        },
        {
            id: "elasticsearch",
            type: "nautilusNode",
            position: { x: 700, y: 550 },
            data: {
                label: "Elasticsearch",
                icon: "elastic",
                color: "yellow",
                sim: { capacity: 8000, replicas: 3, latencyMs: 30 },
            },
        },

        // Async / Realtime
        {
            id: "kafka",
            type: "nautilusNode",
            position: { x: 300, y: 700 },
            data: {
                label: "Kafka (Events)",
                icon: "kafka",
                color: "orange",
                sim: { capacity: 100000, replicas: 3, latencyMs: 3 },
            },
        },
        {
            id: "location-tracking",
            type: "nautilusNode",
            position: { x: 500, y: 700 },
            data: {
                label: "Location Tracking",
                icon: "redis",
                color: "red",
                sim: { capacity: 120000, replicas: 3, latencyMs: 1 },
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
