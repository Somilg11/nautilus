import { MarkerType } from "react-flow-renderer"

export const InstagramTemplate = {
  id: "instagram",
  name: "Instagram System",
  description: "Photo sharing with feed ranking, reels, stories, search, and notifications.",

  nodes: [
    { id: "mobile_app", type: "nautilusNode", data: { label: "Mobile App", icon: "client_mobile", color: "blue" }, position: { x: 200, y: 50 } },
    { id: "api_gateway", type: "nautilusNode", data: { label: "API Gateway", icon: "api_gateway", color: "green" }, position: { x: 200, y: 150 } },

    { id: "user_service", type: "nautilusNode", data: { label: "User Service", icon: "microservice", color: "green" }, position: { x: 70, y: 260 } },
    { id: "media_service", type: "nautilusNode", data: { label: "Media Upload", icon: "microservice", color: "yellow" }, position: { x: 200, y: 260 } },
    { id: "feed_service", type: "nautilusNode", data: { label: "Feed Ranking", icon: "microservice", color: "orange" }, position: { x: 350, y: 260 } },

    { id: "photos_s3", type: "nautilusNode", data: { label: "Photos Storage (S3)", icon: "storage_object", color: "red" }, position: { x: 200, y: 380 } },
    { id: "user_db", type: "nautilusNode", data: { label: "Users DB", icon: "postgres", color: "red" }, position: { x: 70, y: 380 } },
    { id: "feed_cache", type: "nautilusNode", data: { label: "Feed Cache (Redis)", icon: "redis", color: "red" }, position: { x: 350, y: 380 } },

    { id: "notifications", type: "nautilusNode", data: { label: "Notifications", icon: "rabbitmq", color: "pink" }, position: { x: 200, y: 500 } },

    { id: "kafka", type: "nautilusNode", data: { label: "Event Stream (Kafka)", icon: "kafka", color: "orange" }, position: { x: 200, y: 630 } },
    { id: "analytics", type: "nautilusNode", data: { label: "Analytics Engine", icon: "microservice", color: "gray" }, position: { x: 350, y: 630 } },

    { id: "grafana", type: "nautilusNode", data: { label: "Grafana", icon: "grafana", color: "gray" }, position: { x: 200, y: 760 } },
  ],

  edges: [
    { id: "1", source: "mobile_app", target: "api_gateway", markerEnd: { type: MarkerType.Arrow }},
    { id: "2", source: "api_gateway", target: "user_service", markerEnd: { type: MarkerType.Arrow }},
    { id: "3", source: "api_gateway", target: "media_service", markerEnd: { type: MarkerType.Arrow }},
    { id: "4", source: "api_gateway", target: "feed_service", markerEnd: { type: MarkerType.Arrow }},

    { id: "5", source: "user_service", target: "user_db", markerEnd: { type: MarkerType.Arrow }},
    { id: "6", source: "media_service", target: "photos_s3", markerEnd: { type: MarkerType.Arrow }},
    { id: "7", source: "feed_service", target: "feed_cache", markerEnd: { type: MarkerType.Arrow }},
    { id: "8", source: "feed_service", target: "kafka", markerEnd: { type: MarkerType.Arrow }},

    { id: "9", source: "kafka", target: "analytics", markerEnd: { type: MarkerType.Arrow }},
  ],
}
