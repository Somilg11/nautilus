import { MarkerType } from "reactflow"

export const InstagramTemplate = {
  id: "instagram",
  name: "Instagram Architecture",
  description: "Photo sharing with heavy read/write and media storage",
  nodes: [
    // Client
    {
      id: "mobile-app",
      type: "nautilusNode",
      position: { x: 300, y: 0 },
      data: {
        label: "Mobile App",
        icon: "client_mobile",
        color: "pink",
        sim: { latencyMs: 5 },
      },
    },

    // Edge
    {
      id: "cdn",
      type: "nautilusNode",
      position: { x: 500, y: 100 },
      data: {
        label: "CDN (Cloudfront)",
        icon: "cdn",
        color: "orange",
        sim: { capacity: 250000, replicas: 4, latencyMs: 15, errorRate: 0.0002 },
      },
    },
    {
      id: "lb",
      type: "nautilusNode",
      position: { x: 300, y: 150 },
      data: {
        label: "Load Balancer",
        icon: "load_balancer",
        color: "green",
        sim: { capacity: 50000, replicas: 4, latencyMs: 2 },
      },
    },

    // App Layer
    {
      id: "app-server-1",
      type: "nautilusNode",
      position: { x: 150, y: 300 },
      data: {
        label: "App Server (Django)",
        icon: "web_server",
        color: "blue",
        sim: { capacity: 8000, replicas: 20, latencyMs: 15 },
      },
    },
    {
      id: "app-server-2",
      type: "nautilusNode",
      position: { x: 450, y: 300 },
      data: {
        label: "App Server (Django)",
        icon: "web_server",
        color: "blue",
        sim: { capacity: 8000, replicas: 20, latencyMs: 15 },
      },
    },

    // Services
    {
      id: "feed-service",
      type: "nautilusNode",
      position: { x: 650, y: 300 },
      data: {
        label: "Feed Service",
        icon: "microservice",
        color: "purple",
        sim: { capacity: 2500, replicas: 40, latencyMs: 35, errorRate: 0.002 },
      },
    },

    // Data Layer
    {
      id: "user-db",
      type: "nautilusNode",
      position: { x: 150, y: 450 },
      data: {
        label: "User DB (Postgres)",
        icon: "postgres",
        color: "blue",
        sim: { capacity: 6000, replicas: 8, latencyMs: 12, errorRate: 0.0005 },
      },
    },
    {
      id: "media-storage",
      type: "nautilusNode",
      position: { x: 500, y: 550 },
      data: {
        label: "Object Storage (S3)",
        icon: "s3",
        color: "orange",
        sim: { capacity: 15000, replicas: 4, latencyMs: 45 },
      },
    },
    {
      id: "feed-cache",
      type: "nautilusNode",
      position: { x: 650, y: 450 },
      data: {
        label: "Feed Cache (Redis)",
        icon: "redis",
        color: "red",
        sim: { capacity: 120000, replicas: 8, latencyMs: 1 },
      },
    },

    // Async
    {
      id: "task-queue",
      type: "nautilusNode",
      position: { x: 300, y: 650 },
      data: {
        label: "Task Queue (RabbitMQ)",
        icon: "rabbitmq",
        color: "orange",
        sim: { capacity: 25000, replicas: 9, latencyMs: 5 },
      },
    },
    {
      id: "image-processor",
      type: "nautilusNode",
      position: { x: 300, y: 750 },
      data: {
        label: "Image Processor (Celery)",
        icon: "microservice",
        color: "yellow",
        sim: { capacity: 2500, replicas: 40, latencyMs: 35, errorRate: 0.002 },
      },
    },
  ],
  edges: [
    // Client -> Edge
    { id: "e1", source: "mobile-app", target: "lb", type: "deletableEdge", markerEnd: { type: MarkerType.Arrow } },
    { id: "e2", source: "mobile-app", target: "cdn", type: "deletableEdge", markerEnd: { type: MarkerType.Arrow }, animated: true, label: "Fetch Images" },

    // LB -> App Servers
    { id: "e3", source: "lb", target: "app-server-1", type: "deletableEdge", markerEnd: { type: MarkerType.Arrow } },
    { id: "e4", source: "lb", target: "app-server-2", type: "deletableEdge", markerEnd: { type: MarkerType.Arrow } },

    // App Servers -> Data
    { id: "e5", source: "app-server-1", target: "user-db", type: "deletableEdge", markerEnd: { type: MarkerType.Arrow } },
    { id: "e6", source: "app-server-2", target: "user-db", type: "deletableEdge", markerEnd: { type: MarkerType.Arrow } },

    // App Servers -> S3
    { id: "e7", source: "app-server-1", target: "media-storage", type: "deletableEdge", markerEnd: { type: MarkerType.Arrow }, label: "Upload" },

    // Feed Generation
    { id: "e8", source: "app-server-2", target: "feed-service", type: "deletableEdge", markerEnd: { type: MarkerType.Arrow } },
    { id: "e9", source: "feed-service", target: "feed-cache", type: "deletableEdge", markerEnd: { type: MarkerType.Arrow } },

    // Async Processing
    { id: "e10", source: "app-server-1", target: "task-queue", type: "deletableEdge", markerEnd: { type: MarkerType.Arrow }, animated: true },
    { id: "e11", source: "task-queue", target: "image-processor", type: "deletableEdge", markerEnd: { type: MarkerType.Arrow }, animated: true },
    { id: "e12", source: "image-processor", target: "media-storage", type: "deletableEdge", markerEnd: { type: MarkerType.Arrow }, label: "Processed" },
  ],
}
