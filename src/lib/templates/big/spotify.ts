import { MarkerType } from "reactflow"

export const SpotifyTemplate = {
  id: "spotify",
  name: "Spotify Architecture",
  description: "Music streaming with low latency and high availability",
  nodes: [
    // Clients
    {
      id: "client-mobile",
      type: "nautilusNode",
      position: { x: 200, y: 0 },
      data: {
        label: "Mobile App",
        icon: "client_mobile",
        color: "green",
        sim: { latencyMs: 5 },
      },
    },
    {
      id: "client-desktop",
      type: "nautilusNode",
      position: { x: 400, y: 0 },
      data: {
        label: "Desktop App",
        icon: "client_web",
        color: "green",
        sim: { latencyMs: 5 },
      },
    },

    // Entry
    {
      id: "access-point",
      type: "nautilusNode",
      position: { x: 300, y: 150 },
      data: {
        label: "Access Point (Gateway)",
        icon: "api_server",
        color: "black",
        sim: { capacity: 20000, replicas: 6, latencyMs: 8, errorRate: 0.001 },
      },
    },

    // Content Delivery
    {
      id: "cdn",
      type: "nautilusNode",
      position: { x: 600, y: 150 },
      data: {
        label: "CDN (Audio Files)",
        icon: "cdn",
        color: "orange",
        sim: { capacity: 250000, replicas: 2, latencyMs: 15, errorRate: 0.0002 },
      },
    },

    // Services
    {
      id: "playlist-service",
      type: "nautilusNode",
      position: { x: 100, y: 300 },
      data: {
        label: "Playlist Service",
        icon: "microservice",
        color: "blue",
        sim: { capacity: 2500, replicas: 8, latencyMs: 35, errorRate: 0.002 },
      },
    },
    {
      id: "search-service",
      type: "nautilusNode",
      position: { x: 300, y: 300 },
      data: {
        label: "Search Service",
        icon: "microservice",
        color: "blue",
        sim: { capacity: 8000, replicas: 8, latencyMs: 30, errorRate: 0.002 },
      },
    },
    {
      id: "player-service",
      type: "nautilusNode",
      position: { x: 500, y: 300 },
      data: {
        label: "Player Service",
        icon: "microservice",
        color: "blue",
        sim: { capacity: 2500, replicas: 8, latencyMs: 35, errorRate: 0.002 },
      },
    },

    // Data
    {
      id: "cassandra-cluster",
      type: "nautilusNode",
      position: { x: 200, y: 450 },
      data: {
        label: "Cassandra Cluster",
        icon: "cassandra",
        color: "red",
        sim: { capacity: 15000, replicas: 3, latencyMs: 6 },
      },
    },
    {
      id: "elasticsearch",
      type: "nautilusNode",
      position: { x: 400, y: 450 },
      data: {
        label: "Elasticsearch",
        icon: "elastic",
        color: "yellow",
        sim: { capacity: 8000, replicas: 3, latencyMs: 30 },
      },
    },

    // Analytics
    {
      id: "kafka",
      type: "nautilusNode",
      position: { x: 300, y: 600 },
      data: {
        label: "Log Aggregation (Kafka)",
        icon: "kafka",
        color: "orange",
        sim: { capacity: 100000, replicas: 3, latencyMs: 3 },
      },
    },
    {
      id: "hadoop",
      type: "nautilusNode",
      position: { x: 300, y: 750 },
      data: {
        label: "Hadoop (Analytics)",
        icon: "database_sql",
        color: "yellow",
        sim: { capacity: 6000, replicas: 3, latencyMs: 12, errorRate: 0.0005 },
      },
    },
  ],
  edges: [
    // Clients -> Access Point
    { id: "e1", source: "client-mobile", target: "access-point", type: "deletableEdge", markerEnd: { type: MarkerType.Arrow } },
    { id: "e2", source: "client-desktop", target: "access-point", type: "deletableEdge", markerEnd: { type: MarkerType.Arrow } },

    // Clients -> CDN
    { id: "e3", source: "client-mobile", target: "cdn", type: "deletableEdge", markerEnd: { type: MarkerType.Arrow }, animated: true, label: "Stream Audio" },

    // Access Point -> Services
    { id: "e4", source: "access-point", target: "playlist-service", type: "deletableEdge", markerEnd: { type: MarkerType.Arrow } },
    { id: "e5", source: "access-point", target: "search-service", type: "deletableEdge", markerEnd: { type: MarkerType.Arrow } },
    { id: "e6", source: "access-point", target: "player-service", type: "deletableEdge", markerEnd: { type: MarkerType.Arrow } },

    // Services -> Data
    { id: "e7", source: "playlist-service", target: "cassandra-cluster", type: "deletableEdge", markerEnd: { type: MarkerType.Arrow } },
    { id: "e8", source: "search-service", target: "elasticsearch", type: "deletableEdge", markerEnd: { type: MarkerType.Arrow } },

    // Logging
    { id: "e9", source: "player-service", target: "kafka", type: "deletableEdge", markerEnd: { type: MarkerType.Arrow }, animated: true },
    { id: "e10", source: "kafka", target: "hadoop", type: "deletableEdge", markerEnd: { type: MarkerType.Arrow }, animated: true },
  ],
}
