import { MarkerType } from "react-flow-renderer"

export const MicroservicesTemplate = {
  id: "microservices",
  name: "Microservices Architecture",
  description: "Gateway → Services → Queue",
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
      id: "bill",
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
    { id: "e1", source: "gateway", target: "auth", markerEnd: { type: MarkerType.Arrow } },
    { id: "e2", source: "gateway", target: "user", markerEnd: { type: MarkerType.Arrow } },
    { id: "e3", source: "gateway", target: "bill", markerEnd: { type: MarkerType.Arrow } },
    { id: "e4", source: "user", target: "queue", markerEnd: { type: MarkerType.Arrow } },
  ],
}
