import { MarkerType } from "react-flow-renderer"

export const Templates = {
  threeTier: {
    name: "3-Tier Architecture",
    nodes: [
      {
        id: "client",
        type: "nautilusNode",
        position: { x: 200, y: 50 },
        data: { label: "Client", icon: "client_web", color: "blue" },
      },
      {
        id: "api",
        type: "nautilusNode",
        position: { x: 200, y: 200 },
        data: { label: "API Server", icon: "api_server", color: "green" },
      },
      {
        id: "db",
        type: "nautilusNode",
        position: { x: 200, y: 350 },
        data: { label: "Database", icon: "database_sql", color: "red" },
      },
    ],
    edges: [
      {
        id: "e-client-api",
        source: "client",
        target: "api",
        markerEnd: { type: MarkerType.Arrow },
      },
      {
        id: "e-api-db",
        source: "api",
        target: "db",
        markerEnd: { type: MarkerType.Arrow },
      },
    ],
  },

  microservices: {
    name: "Microservices Architecture",
    nodes: [
      {
        id: "gateway",
        type: "nautilusNode",
        position: { x: 200, y: 50 },
        data: { label: "API Gateway", icon: "api_server", color: "blue" },
      },
      {
        id: "auth",
        type: "nautilusNode",
        position: { x: 50, y: 200 },
        data: { label: "Auth Service", icon: "auth", color: "green" },
      },
      {
        id: "user",
        type: "nautilusNode",
        position: { x: 200, y: 200 },
        data: { label: "User Service", icon: "server", color: "green" },
      },
      {
        id: "billing",
        type: "nautilusNode",
        position: { x: 350, y: 200 },
        data: { label: "Billing Service", icon: "server", color: "green" },
      },
      {
        id: "queue",
        type: "nautilusNode",
        position: { x: 200, y: 350 },
        data: { label: "Message Queue", icon: "queue", color: "yellow" },
      },
    ],
    edges: [
      {
        id: "e-gateway-auth",
        source: "gateway",
        target: "auth",
        markerEnd: { type: MarkerType.Arrow },
      },
      {
        id: "e-gateway-user",
        source: "gateway",
        target: "user",
        markerEnd: { type: MarkerType.Arrow },
      },
      {
        id: "e-gateway-bill",
        source: "gateway",
        target: "billing",
        markerEnd: { type: MarkerType.Arrow },
      },
      {
        id: "e-user-queue",
        source: "user",
        target: "queue",
        markerEnd: { type: MarkerType.Arrow },
      },
    ],
  },
}
