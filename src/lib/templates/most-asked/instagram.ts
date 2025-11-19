import { MarkerType } from "react-flow-renderer"

export const InstagramTemplate = {
  id: "instagram",
  name: "Instagram – Social Media",
  description: "Feed, posts, stories, search, notifications, media storage.",

  nodes: [
    { id: "app", type: "nautilusNode", position: { x: 200, y: 40 }, data: { label: "Mobile/Web App", icon: "client_mobile", color: "blue" } },

    { id: "gateway", type: "nautilusNode", position: { x: 200, y: 140 }, data: { label: "API Gateway", icon: "api_server", color: "green" } },

    { id: "user_service", type: "nautilusNode", position: { x: 40, y: 260 }, data: { label: "User Service", icon: "server", color: "green" } },
    { id: "post_service", type: "nautilusNode", position: { x: 200, y: 260 }, data: { label: "Post Service", icon: "server", color: "green" } },
    { id: "story_service", type: "nautilusNode", position: { x: 360, y: 260 }, data: { label: "Story Service", icon: "server", color: "green" } },

    { id: "media", type: "nautilusNode", position: { x: 200, y: 360 }, data: { label: "Media Storage (S3)", icon: "object_storage", color: "yellow" } },

    { id: "feed", type: "nautilusNode", position: { x: 200, y: 460 }, data: { label: "Feed Generator", icon: "server", color: "yellow" } },
    { id: "search", type: "nautilusNode", position: { x: 360, y: 460 }, data: { label: "Search Service", icon: "server", color: "yellow" } },

    { id: "cache", type: "nautilusNode", position: { x: 50, y: 560 }, data: { label: "Redis Cache", icon: "cache", color: "yellow" } },
    { id: "users_db", type: "nautilusNode", position: { x: 200, y: 560 }, data: { label: "Users DB", icon: "database_sql", color: "red" } },
    { id: "posts_db", type: "nautilusNode", position: { x: 360, y: 560 }, data: { label: "Posts DB", icon: "database_sql", color: "red" } },

    { id: "notifications", type: "nautilusNode", position: { x: 200, y: 660 }, data: { label: "Push Notifications", icon: "server", color: "yellow" } },
  ],

  edges: [
    { id: "e1", source: "app", target: "gateway", markerEnd: { type: MarkerType.Arrow }},

    { id: "e2", source: "gateway", target: "user_service", markerEnd: { type: MarkerType.Arrow }},
    { id: "e3", source: "gateway", target: "post_service", markerEnd: { type: MarkerType.Arrow }},
    { id: "e4", source: "gateway", target: "story_service", markerEnd: { type: MarkerType.Arrow }},

    { id: "e5", source: "post_service", target: "media", markerEnd: { type: MarkerType.Arrow }},
    { id: "e6", source: "story_service", target: "media", markerEnd: { type: MarkerType.Arrow }},

    { id: "e7", source: "post_service", target: "feed", markerEnd: { type: MarkerType.Arrow }},
    { id: "e8", source: "user_service", target: "cache", markerEnd: { type: MarkerType.Arrow }},

    { id: "e9", source: "user_service", target: "users_db", markerEnd: { type: MarkerType.Arrow }},
    { id: "e10", source: "post_service", target: "posts_db", markerEnd: { type: MarkerType.Arrow }},

    { id: "e11", source: "gateway", target: "notifications", markerEnd: { type: MarkerType.Arrow }},
  ]
}
