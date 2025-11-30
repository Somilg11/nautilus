import { MarkerType } from "react-flow-renderer"

export const YouTubeTemplate = {
    id: "youtube",
    name: "YouTube Architecture",
    description: "Video sharing platform with transcoding pipeline",
    nodes: [
        // Client
        {
            id: "user",
            type: "nautilusNode",
            position: { x: 300, y: 0 },
            data: { label: "User", icon: "client_web", color: "red" },
        },

        // Front Door
        {
            id: "web-server",
            type: "nautilusNode",
            position: { x: 300, y: 150 },
            data: { label: "Web Server", icon: "web_server", color: "blue" },
        },

        // Upload Flow
        {
            id: "upload-service",
            type: "nautilusNode",
            position: { x: 100, y: 300 },
            data: { label: "Upload Service", icon: "microservice", color: "green" },
        },
        {
            id: "raw-storage",
            type: "nautilusNode",
            position: { x: 100, y: 450 },
            data: { label: "Raw Storage (S3)", icon: "s3", color: "orange" },
        },
        {
            id: "transcoding-queue",
            type: "nautilusNode",
            position: { x: 100, y: 600 },
            data: { label: "Transcoding Queue", icon: "rabbitmq", color: "purple" },
        },
        {
            id: "transcoder",
            type: "nautilusNode",
            position: { x: 100, y: 750 },
            data: { label: "Transcoder Workers", icon: "microservice", color: "yellow" },
        },
        {
            id: "processed-storage",
            type: "nautilusNode",
            position: { x: 300, y: 750 },
            data: { label: "Processed Storage", icon: "s3", color: "orange" },
        },

        // Viewing Flow
        {
            id: "metadata-service",
            type: "nautilusNode",
            position: { x: 500, y: 300 },
            data: { label: "Metadata Service", icon: "microservice", color: "blue" },
        },
        {
            id: "metadata-db",
            type: "nautilusNode",
            position: { x: 500, y: 450 },
            data: { label: "Metadata DB (Vitess)", icon: "mysql", color: "blue" },
        },
        {
            id: "metadata-cache",
            type: "nautilusNode",
            position: { x: 700, y: 450 },
            data: { label: "Cache (Memcached)", icon: "redis", color: "red" },
        },
        {
            id: "cdn",
            type: "nautilusNode",
            position: { x: 500, y: 600 },
            data: { label: "CDN (Edge Locations)", icon: "cdn", color: "green" },
        },
    ],
    edges: [
        // User Actions
        { id: "e1", source: "user", target: "web-server", type: "deletableEdge", markerEnd: { type: MarkerType.Arrow } },

        // Upload Path
        { id: "e2", source: "web-server", target: "upload-service", type: "deletableEdge", markerEnd: { type: MarkerType.Arrow }, label: "Upload Video" },
        { id: "e3", source: "upload-service", target: "raw-storage", type: "deletableEdge", markerEnd: { type: MarkerType.Arrow } },
        { id: "e4", source: "upload-service", target: "transcoding-queue", type: "deletableEdge", markerEnd: { type: MarkerType.Arrow }, animated: true },
        { id: "e5", source: "transcoding-queue", target: "transcoder", type: "deletableEdge", markerEnd: { type: MarkerType.Arrow }, animated: true },
        { id: "e6", source: "transcoder", target: "raw-storage", type: "deletableEdge", markerEnd: { type: MarkerType.Arrow }, label: "Read" },
        { id: "e7", source: "transcoder", target: "processed-storage", type: "deletableEdge", markerEnd: { type: MarkerType.Arrow }, label: "Write" },

        // Viewing Path
        { id: "e8", source: "web-server", target: "metadata-service", type: "deletableEdge", markerEnd: { type: MarkerType.Arrow }, label: "Get Video Info" },
        { id: "e9", source: "metadata-service", target: "metadata-cache", type: "deletableEdge", markerEnd: { type: MarkerType.Arrow } },
        { id: "e10", source: "metadata-service", target: "metadata-db", type: "deletableEdge", markerEnd: { type: MarkerType.Arrow } },

        // CDN
        { id: "e11", source: "processed-storage", target: "cdn", type: "deletableEdge", markerEnd: { type: MarkerType.Arrow }, label: "Distribute" },
        { id: "e12", source: "user", target: "cdn", type: "deletableEdge", markerEnd: { type: MarkerType.Arrow }, animated: true, label: "Stream" },
    ],
}
