import { MarkerType } from "reactflow"

export const SpotifyTemplate = {
  id: "spotify",
  name: "Spotify Architecture",
  description: "Music streaming with low latency and high availability",
  // Playground defaults: the load this design is meant to serve.
  sim: { requestsPerSecond: 20000, timeoutMs: 400, payloadKb: 32, targetUtilization: 0.65, burstFactor: 1.8 },

  nodes: [
    // Clients
    {
      id: "client-mobile",
      type: "nautilusNode",
      position: { x: 380, y: 0 },
      data: {
        label: "Mobile App",
        icon: "client_mobile",
        color: "green",
        description: "Mobile player; streams audio and syncs playlists offline",
        sim: { latencyMs: 5 },
      },
    },
    {
      id: "client-desktop",
      type: "nautilusNode",
      position: { x: 760, y: 0 },
      data: {
        label: "Desktop App",
        icon: "client_web",
        color: "green",
        description: "Desktop player sharing the same backend APIs",
        sim: { latencyMs: 5 },
      },
    },

    // Entry
    {
      id: "access-point",
      type: "nautilusNode",
      position: { x: 570, y: 300 },
      data: {
        label: "Access Point (Gateway)",
        icon: "api_server",
        color: "black",
        description: "Long-lived gateway connection that multiplexes every client call",
        sim: { capacity: 20000, replicas: 6, latencyMs: 8, errorRate: 0.001, costPerHour: 0.12 },
      },
    },

    // Content Delivery
    {
      id: "cdn",
      type: "nautilusNode",
      position: { x: 1140, y: 300 },
      data: {
        label: "CDN (Audio Files)",
        icon: "cdn",
        color: "orange",
        description: "Delivers encoded audio chunks from the edge; origin sees only misses",
        sim: { capacity: 250000, replicas: 2, latencyMs: 15, errorRate: 0.0002, costPerHour: 0.09, hitRate: 0.95 },
      },
    },

    // Services
    {
      id: "playlist-service",
      type: "nautilusNode",
      position: { x: 190, y: 600 },
      data: {
        label: "Playlist Service",
        icon: "microservice",
        color: "blue",
        description: "Reads and writes playlists, the most-hit endpoint in the product",
        sim: { capacity: 2500, replicas: 23, latencyMs: 35, errorRate: 0.002, costPerHour: 0.1 },
      },
    },
    {
      id: "search-service",
      type: "nautilusNode",
      position: { x: 570, y: 600 },
      data: {
        label: "Search Service",
        icon: "microservice",
        color: "blue",
        description: "Query parsing and ranking over the catalogue index",
        sim: { capacity: 8000, replicas: 8, latencyMs: 30, errorRate: 0.002, costPerHour: 0.1 },
      },
    },
    {
      id: "player-service",
      type: "nautilusNode",
      position: { x: 950, y: 600 },
      data: {
        label: "Player Service",
        icon: "microservice",
        color: "blue",
        description: "Tracks playback position, licensing and what to play next",
        sim: { capacity: 2500, replicas: 23, latencyMs: 35, errorRate: 0.002, costPerHour: 0.1 },
      },
    },

    // Data
    {
      id: "cassandra-cluster",
      type: "nautilusNode",
      position: { x: 380, y: 900 },
      data: {
        label: "Cassandra Cluster",
        icon: "cassandra",
        color: "red",
        description: "Wide-column store for playlists and listening history at scale",
        sim: { capacity: 15000, replicas: 4, latencyMs: 6, costPerHour: 0.28 },
      },
    },
    {
      id: "elasticsearch",
      type: "nautilusNode",
      position: { x: 760, y: 900 },
      data: {
        label: "Elasticsearch",
        icon: "elastic",
        color: "yellow",
        description: "Inverted index powering catalogue search and autocomplete",
        sim: { capacity: 8000, replicas: 7, latencyMs: 30, costPerHour: 0.32 },
      },
    },

    // Analytics
    {
      id: "kafka",
      type: "nautilusNode",
      position: { x: 570, y: 1200 },
      data: {
        label: "Log Aggregation (Kafka)",
        icon: "kafka",
        color: "orange",
        description: "Collects playback and interaction events for downstream analytics",
        sim: { capacity: 100000, replicas: 3, latencyMs: 3, costPerHour: 0.22 },
      },
    },
    {
      id: "hadoop",
      type: "nautilusNode",
      position: { x: 570, y: 1500 },
      data: {
        label: "Hadoop (Analytics)",
        icon: "database_sql",
        color: "yellow",
        description: "Batch analytics over the event log; feeds recommendations",
        sim: { capacity: 6000, replicas: 10, latencyMs: 12, errorRate: 0.0005, costPerHour: 0.35 },
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
