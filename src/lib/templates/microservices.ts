import { MarkerType } from "react-flow-renderer"

export const MicroservicesTemplate = {
  id: "microservices",
  name: "Microservices Architecture",
  description: "Event-driven microservices with API Gateway and Kafka",
  nodes: [
    // Entry Point
    {
      id: "client",
      type: "nautilusNode",
      position: { x: 300, y: 0 },
      data: { label: "Client App", icon: "client_web", color: "blue" },
    },
    {
      id: "api-gateway",
      type: "nautilusNode",
      position: { x: 300, y: 150 },
      data: { label: "API Gateway (Kong)", icon: "load_balancer", color: "purple" },
    },

    // Core Services
    {
      id: "auth-service",
      type: "nautilusNode",
      position: { x: 100, y: 300 },
      data: { label: "Auth Service", icon: "auth", color: "red" },
    },
    {
      id: "user-service",
      type: "nautilusNode",
      position: { x: 300, y: 300 },
      data: { label: "User Service", icon: "microservice", color: "green" },
    },
    {
      id: "order-service",
      type: "nautilusNode",
      position: { x: 500, y: 300 },
      data: { label: "Order Service", icon: "microservice", color: "green" },
    },

    // Databases per Service
    {
      id: "auth-db",
      type: "nautilusNode",
      position: { x: 100, y: 450 },
      data: { label: "Auth DB", icon: "redis", color: "red" },
    },
    {
      id: "user-db",
      type: "nautilusNode",
      position: { x: 300, y: 450 },
      data: { label: "User DB", icon: "postgres", color: "blue" },
    },
    {
      id: "order-db",
      type: "nautilusNode",
      position: { x: 500, y: 450 },
      data: { label: "Order DB", icon: "mongodb", color: "green" },
    },

    // Event Bus
    {
      id: "kafka",
      type: "nautilusNode",
      position: { x: 300, y: 600 },
      data: { label: "Event Bus (Kafka)", icon: "kafka", color: "orange" },
    },

    // Async Services
    {
      id: "notification-service",
      type: "nautilusNode",
      position: { x: 100, y: 750 },
      data: { label: "Notification Service", icon: "microservice", color: "yellow" },
    },
    {
      id: "analytics-service",
      type: "nautilusNode",
      position: { x: 500, y: 750 },
      data: { label: "Analytics Service", icon: "microservice", color: "yellow" },
    },
  ],
  edges: [
    // Client -> Gateway
    { id: "e1", source: "client", target: "api-gateway", type: "deletableEdge", markerEnd: { type: MarkerType.Arrow } },

    // Gateway -> Services
    { id: "e2", source: "api-gateway", target: "auth-service", type: "deletableEdge", markerEnd: { type: MarkerType.Arrow } },
    { id: "e3", source: "api-gateway", target: "user-service", type: "deletableEdge", markerEnd: { type: MarkerType.Arrow } },
    { id: "e4", source: "api-gateway", target: "order-service", type: "deletableEdge", markerEnd: { type: MarkerType.Arrow } },

    // Services -> DBs
    { id: "e5", source: "auth-service", target: "auth-db", type: "deletableEdge", markerEnd: { type: MarkerType.Arrow } },
    { id: "e6", source: "user-service", target: "user-db", type: "deletableEdge", markerEnd: { type: MarkerType.Arrow } },
    { id: "e7", source: "order-service", target: "order-db", type: "deletableEdge", markerEnd: { type: MarkerType.Arrow } },

    // Services -> Kafka (Producers)
    { id: "e8", source: "user-service", target: "kafka", type: "deletableEdge", markerEnd: { type: MarkerType.Arrow }, animated: true },
    { id: "e9", source: "order-service", target: "kafka", type: "deletableEdge", markerEnd: { type: MarkerType.Arrow }, animated: true },

    // Kafka -> Services (Consumers)
    { id: "e10", source: "kafka", target: "notification-service", type: "deletableEdge", markerEnd: { type: MarkerType.Arrow }, animated: true },
    { id: "e11", source: "kafka", target: "analytics-service", type: "deletableEdge", markerEnd: { type: MarkerType.Arrow }, animated: true },
  ],
}
