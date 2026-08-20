import { MarkerType } from "reactflow"

export const UberTemplate = {
  id: "uber",
  name: "Uber Architecture",
  description: "Ride-sharing platform with real-time location tracking",
  // Playground defaults: the load this design is meant to serve.
  sim: { requestsPerSecond: 15000, timeoutMs: 500, payloadKb: 8, targetUtilization: 0.6, burstFactor: 2.5 },

  nodes: [
    // Clients
    {
      id: "rider-app",
      type: "nautilusNode",
      position: { x: 100, y: 0 },
      data: {
        label: "Rider App",
        icon: "client_mobile",
        color: "black",
        description: "Requests trips and follows the driver on the map",
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
        color: "black",
        description: "Streams driver location and accepts dispatch offers",
        sim: { latencyMs: 5 },
      },
    },

    // Entry
    {
      id: "lb",
      type: "nautilusNode",
      position: { x: 300, y: 100 },
      data: {
        label: "Load Balancer",
        icon: "load_balancer",
        color: "green",
        description: "Regional entry point; sheds and balances traffic across gateways",
        sim: { capacity: 50000, replicas: 2, latencyMs: 2, costPerHour: 0.03 },
      },
    },
    {
      id: "api-gateway",
      type: "nautilusNode",
      position: { x: 300, y: 200 },
      data: {
        label: "API Gateway",
        icon: "api_server",
        color: "purple",
        description: "Authenticates, rate limits and routes to the right service",
        sim: { capacity: 20000, replicas: 6, latencyMs: 8, errorRate: 0.001, costPerHour: 0.12 },
      },
    },

    // Core Services
    {
      id: "trip-service",
      type: "nautilusNode",
      position: { x: 100, y: 350 },
      data: {
        label: "Trip Service",
        icon: "microservice",
        color: "blue",
        description: "Owns the trip lifecycle: request, accept, in-progress, complete",
        sim: { capacity: 2500, replicas: 25, latencyMs: 35, errorRate: 0.002, costPerHour: 0.1 },
      },
    },
    {
      id: "matching-service",
      type: "nautilusNode",
      position: { x: 300, y: 350 },
      data: {
        label: "Matching Service",
        icon: "microservice",
        color: "blue",
        description: "Pairs riders with nearby drivers; the hardest thing to scale here",
        sim: { capacity: 1500, replicas: 42, latencyMs: 60, errorRate: 0.002, costPerHour: 0.1 },
      },
    },
    {
      id: "location-service",
      type: "nautilusNode",
      position: { x: 500, y: 350 },
      data: {
        label: "Location Service",
        icon: "microservice",
        color: "blue",
        description: "Ingests high-frequency GPS updates from every active driver",
        sim: { capacity: 2500, replicas: 25, latencyMs: 35, errorRate: 0.002, costPerHour: 0.1 },
      },
    },

    // Data Layer
    {
      id: "trip-db",
      type: "nautilusNode",
      position: { x: 100, y: 500 },
      data: {
        label: "Trip DB (Postgres)",
        icon: "postgres",
        color: "blue",
        description: "Transactional record of every trip and its state changes",
        sim: { capacity: 6000, replicas: 11, latencyMs: 12, errorRate: 0.0005, costPerHour: 0.35 },
      },
    },
    {
      id: "geo-index",
      type: "nautilusNode",
      position: { x: 500, y: 500 },
      data: {
        label: "Geo Index (Redis)",
        icon: "redis",
        color: "red",
        description: "Redis geospatial index for nearest-driver lookups",
        sim: { capacity: 120000, replicas: 3, latencyMs: 1, costPerHour: 0.14, hitRate: 0.9 },
      },
    },
    {
      id: "location-db",
      type: "nautilusNode",
      position: { x: 700, y: 500 },
      data: {
        label: "Location History (Cassandra)",
        icon: "cassandra",
        color: "orange",
        description: "Write-heavy history of location pings, kept for replay and analytics",
        sim: { capacity: 15000, replicas: 5, latencyMs: 6, costPerHour: 0.28 },
      },
    },

    // Async / Payments
    {
      id: "kafka",
      type: "nautilusNode",
      position: { x: 300, y: 650 },
      data: {
        label: "Event Stream (Kafka)",
        icon: "kafka",
        color: "orange",
        description: "Event backbone connecting trips, pricing, payments and analytics",
        sim: { capacity: 100000, replicas: 3, latencyMs: 3, costPerHour: 0.22 },
      },
    },
    {
      id: "payment-service",
      type: "nautilusNode",
      position: { x: 100, y: 800 },
      data: {
        label: "Payment Service",
        icon: "billing",
        color: "green",
        description: "Calls the external payment provider — slow and failure-prone by nature",
        sim: { capacity: 800, replicas: 78, latencyMs: 250, errorRate: 0.005, costPerHour: 0.1 },
      },
    },
    {
      id: "analytics",
      type: "nautilusNode",
      position: { x: 500, y: 800 },
      data: {
        label: "Analytics (Hadoop)",
        icon: "elastic",
        color: "yellow",
        description: "Batch and near-real-time analysis over the event stream",
        sim: { capacity: 8000, replicas: 8, latencyMs: 30, costPerHour: 0.32 },
      },
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
