import { MarkerType } from "react-flow-renderer"

export const ThreeTierTemplate = {
  id: "three-tier",
  name: "3-Tier Architecture",
  description: "Client → API → Database tiered layout",
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
      id: "e1",
      source: "client",
      target: "api",
      markerEnd: { type: MarkerType.Arrow },
    },
    {
      id: "e2",
      source: "api",
      target: "db",
      markerEnd: { type: MarkerType.Arrow },
    },
  ],
}
