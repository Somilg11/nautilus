import { MarkerType } from "react-flow-renderer"

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
      data: { label: "Mobile App", icon: "client_mobile", color: "green" },
    },
    {
      id: "client-desktop",
      type: "nautilusNode",
      position: { x: 400, y: 0 },
      data: { label: "Desktop App", icon: "client_web", color: "green" },
    },

    // Entry
    {
      id: "access-point",
      type: "nautilusNode",
      position: { x: 300, y: 150 },
      data: { label: "Access Point (Gateway)", icon: "api_server", color: "black" },
    },

    // Content Delivery
    {
      id: "cdn",
      type: "nautilusNode",
      position: { x: 600, y: 150 },
      data: { label: "CDN (Audio Files)", icon: "cdn", color: "orange" },
    },

    // Services
    {
      id: "playlist-service",
      type: "nautilusNode",
      position: { x: 100, y: 300 },
      data: { label: "Playlist Service", icon: "microservice", color: "blue" },
    },
    {
      id: "search-service",
      type: "nautilusNode",
      position: { x: 300, y: 300 },
      data: { label: "Search Service", icon: "microservice", color: "blue" },
    },
    {
      id: "player-service",
      type: "nautilusNode",
      position: { x: 500, y: 300 },
      data: { label: "Player Service", icon: "microservice", color: "blue" },
    },

    // Data
    {
      id: "cassandra-cluster",
      type: "nautilusNode",
      position: { x: 200, y: 450 },
      data: { label: "Cassandra Cluster", icon: "cassandra", color: "red" },
    },
    {
      id: "elasticsearch",
      type: "nautilusNode",
      position: { x: 400, y: 450 },
      data: { label: "Elasticsearch", icon: "elastic", color: "yellow" },
    },

    // Analytics
    {
      id: "kafka",
      type: "nautilusNode",
      position: { x: 300, y: 600 },
      data: { label: "Log Aggregation (Kafka)", icon: "kafka", color: "orange" },
    },
    {
      id: "hadoop",
      type: "nautilusNode",
      position: { x: 300, y: 750 },
      data: { label: "Hadoop (Analytics)", icon: "database_sql", color: "yellow" },
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
