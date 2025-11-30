import { MarkerType } from "react-flow-renderer"

export const UberTemplate = {
  id: "uber",
  name: "Uber Architecture",
  description: "Ride-sharing platform with real-time location tracking",
  nodes: [
    // Clients
    {
      id: "rider-app",
      type: "nautilusNode",
      position: { x: 100, y: 0 },
      data: { label: "Rider App", icon: "client_mobile", color: "black" },
    },
    {
      id: "driver-app",
      type: "nautilusNode",
      position: { x: 500, y: 0 },
      data: { label: "Driver App", icon: "client_mobile", color: "black" },
    },

    // Entry
    {
      id: "lb",
      type: "nautilusNode",
      position: { x: 300, y: 100 },
      data: { label: "Load Balancer", icon: "load_balancer", color: "green" },
    },
    {
      id: "api-gateway",
      type: "nautilusNode",
      position: { x: 300, y: 200 },
      data: { label: "API Gateway", icon: "api_server", color: "purple" },
    },

    // Core Services
    {
      id: "trip-service",
      type: "nautilusNode",
      position: { x: 100, y: 350 },
      data: { label: "Trip Service", icon: "microservice", color: "blue" },
    },
    {
      id: "matching-service",
      type: "nautilusNode",
      position: { x: 300, y: 350 },
      data: { label: "Matching Service", icon: "microservice", color: "blue" },
    },
    {
      id: "location-service",
      type: "nautilusNode",
      position: { x: 500, y: 350 },
      data: { label: "Location Service", icon: "microservice", color: "blue" },
    },

    // Data Layer
    {
      id: "trip-db",
      type: "nautilusNode",
      position: { x: 100, y: 500 },
      data: { label: "Trip DB (Postgres)", icon: "postgres", color: "blue" },
    },
    {
      id: "geo-index",
      type: "nautilusNode",
      position: { x: 500, y: 500 },
      data: { label: "Geo Index (Redis)", icon: "redis", color: "red" },
    },
    {
      id: "location-db",
      type: "nautilusNode",
      position: { x: 700, y: 500 },
      data: { label: "Location History (Cassandra)", icon: "cassandra", color: "orange" },
    },

    // Async / Payments
    {
      id: "kafka",
      type: "nautilusNode",
      position: { x: 300, y: 650 },
      data: { label: "Event Stream (Kafka)", icon: "kafka", color: "orange" },
    },
    {
      id: "payment-service",
      type: "nautilusNode",
      position: { x: 100, y: 800 },
      data: { label: "Payment Service", icon: "billing", color: "green" },
    },
    {
      id: "analytics",
      type: "nautilusNode",
      position: { x: 500, y: 800 },
      data: { label: "Analytics (Hadoop)", icon: "elastic", color: "yellow" },
    },
  ],
  edges: [
    // Clients -> LB
    { id: "e1", source: "rider-app", target: "lb", type: "deletableEdge", markerEnd: { type: MarkerType.Arrow } },
    { id: "e2", source: "driver-app", target: "lb", type: "deletableEdge", markerEnd: { type: MarkerType.Arrow } },

    // LB -> Gateway
    { id: "e3", source: "lb", target: "api-gateway", type: "deletableEdge", markerEnd: { type: MarkerType.Arrow } },

    // Gateway -> Services
    { id: "e4", source: "api-gateway", target: "trip-service", type: "deletableEdge", markerEnd: { type: MarkerType.Arrow } },
    { id: "e5", source: "api-gateway", target: "matching-service", type: "deletableEdge", markerEnd: { type: MarkerType.Arrow } },
    { id: "e6", source: "api-gateway", target: "location-service", type: "deletableEdge", markerEnd: { type: MarkerType.Arrow } },

    // Services -> Data
    { id: "e7", source: "trip-service", target: "trip-db", type: "deletableEdge", markerEnd: { type: MarkerType.Arrow } },
    { id: "e8", source: "location-service", target: "geo-index", type: "deletableEdge", markerEnd: { type: MarkerType.Arrow } },
    { id: "e9", source: "location-service", target: "location-db", type: "deletableEdge", markerEnd: { type: MarkerType.Arrow } },

    // Matching Logic
    { id: "e10", source: "matching-service", target: "geo-index", type: "deletableEdge", markerEnd: { type: MarkerType.Arrow }, label: "Find Drivers" },

    // Async
    { id: "e11", source: "trip-service", target: "kafka", type: "deletableEdge", markerEnd: { type: MarkerType.Arrow }, animated: true },
    { id: "e12", source: "kafka", target: "payment-service", type: "deletableEdge", markerEnd: { type: MarkerType.Arrow }, animated: true },
    { id: "e13", source: "kafka", target: "analytics", type: "deletableEdge", markerEnd: { type: MarkerType.Arrow }, animated: true },
  ],
}
