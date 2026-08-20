import { MarkerType } from "reactflow"

export const YouTubeTemplate = {
    id: "youtube",
    name: "YouTube Architecture",
    description: "Video sharing platform with transcoding pipeline",
    // Playground defaults: uploads per second, not views — this graph is
  // the ingest path.
    sim: { requestsPerSecond: 3000, timeoutMs: 800, payloadKb: 128, targetUtilization: 0.65, burstFactor: 2 },

    nodes: [
        // Client
        {
            id: "user",
            type: "nautilusNode",
            position: { x: 300, y: 0 },
            data: {
                label: "User",
                icon: "client_web",
                color: "red",
                description: "Uploads video and watches from the same client",
                sim: { latencyMs: 5 },
            },
        },

        // Front Door
        {
            id: "web-server",
            type: "nautilusNode",
            position: { x: 300, y: 150 },
            data: {
                label: "Web Server",
                icon: "web_server",
                color: "blue",
                description: "Serves the watch page and the upload entry point",
                sim: { capacity: 8000, replicas: 20, latencyMs: 15, costPerHour: 0.1 },
            },
        },

        // Upload Flow
        {
            id: "upload-service",
            type: "nautilusNode",
            position: { x: 100, y: 300 },
            data: {
                label: "Upload Service",
                icon: "microservice",
                color: "green",
                description: "Accepts the raw file and hands off to processing",
                sim: { capacity: 2500, replicas: 40, latencyMs: 35, errorRate: 0.002, costPerHour: 0.1 },
            },
        },
        {
            id: "raw-storage",
            type: "nautilusNode",
            position: { x: 100, y: 450 },
            data: {
                label: "Raw Storage (S3)",
                icon: "s3",
                color: "orange",
                description: "Holds the original upload until transcoding finishes",
                sim: { capacity: 15000, replicas: 4, latencyMs: 45, costPerHour: 0.05 },
            },
        },
        {
            id: "transcoding-queue",
            type: "nautilusNode",
            position: { x: 100, y: 600 },
            data: {
                label: "Transcoding Queue",
                icon: "rabbitmq",
                color: "purple",
                description: "Buffers upload jobs; a backlog here delays publishing, not requests",
                sim: { capacity: 120, replicas: 120, latencyMs: 900, errorRate: 0.01, costPerHour: 0.16 },
            },
        },
        {
            id: "transcoder",
            type: "nautilusNode",
            position: { x: 100, y: 750 },
            data: {
                label: "Transcoder Workers",
                icon: "microservice",
                color: "yellow",
                description: "Workers encoding each upload into every resolution and codec",
                sim: { capacity: 120, replicas: 120, latencyMs: 900, errorRate: 0.01, costPerHour: 0.1 },
            },
        },
        {
            id: "processed-storage",
            type: "nautilusNode",
            position: { x: 300, y: 750 },
            data: {
                label: "Processed Storage",
                icon: "s3",
                color: "orange",
                description: "Finished renditions, ready for the CDN to pull",
                sim: { capacity: 15000, replicas: 4, latencyMs: 45, costPerHour: 0.05 },
            },
        },

        // Viewing Flow
        {
            id: "metadata-service",
            type: "nautilusNode",
            position: { x: 500, y: 300 },
            data: {
                label: "Metadata Service",
                icon: "microservice",
                color: "blue",
                description: "Titles, descriptions, view counts and playback metadata",
                sim: { capacity: 2500, replicas: 40, latencyMs: 35, errorRate: 0.002, costPerHour: 0.1 },
            },
        },
        {
            id: "metadata-db",
            type: "nautilusNode",
            position: { x: 500, y: 450 },
            data: {
                label: "Metadata DB (Vitess)",
                icon: "mysql",
                color: "blue",
                description: "Sharded MySQL behind Vitess for metadata at scale",
                sim: { capacity: 6000, replicas: 8, latencyMs: 12, errorRate: 0.0005, costPerHour: 0.35 },
            },
        },
        {
            id: "metadata-cache",
            type: "nautilusNode",
            position: { x: 700, y: 450 },
            data: {
                label: "Cache (Memcached)",
                icon: "redis",
                color: "red",
                description: "Keeps hot metadata off the database on the watch path",
                sim: { capacity: 120000, replicas: 8, latencyMs: 1, costPerHour: 0.14, hitRate: 0.9 },
            },
        },
        {
            id: "cdn",
            type: "nautilusNode",
            position: { x: 500, y: 600 },
            data: {
                label: "CDN (Edge Locations)",
                icon: "cdn",
                color: "green",
                description: "Edge locations streaming video; the origin only sees cache misses",
                sim: { capacity: 250000, replicas: 4, latencyMs: 15, errorRate: 0.0002, costPerHour: 0.09, hitRate: 0.95 },
            },
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
