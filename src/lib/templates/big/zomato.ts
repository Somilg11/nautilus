import { MarkerType } from "react-flow-renderer"

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
            data: { label: "Customer App", icon: "client_mobile", color: "red" },
        },
        {
            id: "restaurant-app",
            type: "nautilusNode",
            position: { x: 300, y: 0 },
            data: { label: "Restaurant App", icon: "client_web", color: "red" },
        },
        {
            id: "driver-app",
            type: "nautilusNode",
            position: { x: 500, y: 0 },
            data: { label: "Driver App", icon: "client_mobile", color: "red" },
        },

        // Entry
        {
            id: "lb",
            type: "nautilusNode",
            position: { x: 300, y: 150 },
            data: { label: "Load Balancer", icon: "load_balancer", color: "blue" },
        },
        {
            id: "api-gateway",
            type: "nautilusNode",
            position: { x: 300, y: 250 },
            data: { label: "API Gateway", icon: "api_server", color: "purple" },
        },

        // Services
        {
            id: "restaurant-service",
            type: "nautilusNode",
            position: { x: 100, y: 400 },
            data: { label: "Restaurant Service", icon: "microservice", color: "green" },
        },
        {
            id: "order-service",
            type: "nautilusNode",
            position: { x: 300, y: 400 },
            data: { label: "Order Service", icon: "microservice", color: "green" },
        },
        {
            id: "delivery-service",
            type: "nautilusNode",
            position: { x: 500, y: 400 },
            data: { label: "Delivery Service", icon: "microservice", color: "green" },
        },
        {
            id: "search-service",
            type: "nautilusNode",
            position: { x: 700, y: 400 },
            data: { label: "Search Service", icon: "microservice", color: "yellow" },
        },

        // Data
        {
            id: "restaurant-db",
            type: "nautilusNode",
            position: { x: 100, y: 550 },
            data: { label: "Restaurant DB", icon: "postgres", color: "blue" },
        },
        {
            id: "order-db",
            type: "nautilusNode",
            position: { x: 300, y: 550 },
            data: { label: "Order DB", icon: "postgres", color: "blue" },
        },
        {
            id: "elasticsearch",
            type: "nautilusNode",
            position: { x: 700, y: 550 },
            data: { label: "Elasticsearch", icon: "elastic", color: "yellow" },
        },

        // Async / Realtime
        {
            id: "kafka",
            type: "nautilusNode",
            position: { x: 300, y: 700 },
            data: { label: "Kafka (Events)", icon: "kafka", color: "orange" },
        },
        {
            id: "location-tracking",
            type: "nautilusNode",
            position: { x: 500, y: 700 },
            data: { label: "Location Tracking", icon: "redis", color: "red" },
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
