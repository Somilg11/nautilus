import { MarkerType } from "react-flow-renderer"

export const SpotifyTemplate = {
  id: "spotify",
  name: "Spotify – Music Streaming",
  description: "Audio streaming, metadata service, playlists, recommendations, CDN.",

  nodes: [
    { id: "client", type: "nautilusNode", position: { x: 200, y: 40 }, data: { label: "Web/Mobile Client", icon: "client_mobile", color: "blue" } },

    { id: "gateway", type: "nautilusNode", position: { x: 200, y: 140 }, data: { label: "API Gateway", icon: "api_server", color: "green" } },

    { id: "auth", type: "nautilusNode", position: { x: 50, y: 260 }, data: { label: "Auth Service", icon: "auth", color: "green" } },
    { id: "playlist", type: "nautilusNode", position: { x: 200, y: 260 }, data: { label: "Playlist Service", icon: "server", color: "green" } },
    { id: "metadata", type: "nautilusNode", position: { x: 350, y: 260 }, data: { label: "Metadata Service", icon: "server", color: "green" } },

    { id: "cdn", type: "nautilusNode", position: { x: 200, y: 360 }, data: { label: "CDN (Audio Delivery)", icon: "cloud", color: "yellow" } },

    { id: "reco", type: "nautilusNode", position: { x: 200, y: 460 }, data: { label: "Recommendation Engine", icon: "server", color: "yellow" } },

    { id: "cache", type: "nautilusNode", position: { x: 60, y: 560 }, data: { label: "Redis Cache", icon: "cache", color: "yellow" } },
    { id: "users_db", type: "nautilusNode", position: { x: 200, y: 560 }, data: { label: "Users DB", icon: "database_sql", color: "red" } },
    { id: "tracks_db", type: "nautilusNode", position: { x: 350, y: 560 }, data: { label: "Tracks DB", icon: "database_sql", color: "red" } },
  ],

  edges: [
    { id: "e1", source: "client", target: "gateway", markerEnd: { type: MarkerType.Arrow }},
    { id: "e2", source: "gateway", target: "auth", markerEnd: { type: MarkerType.Arrow }},
    { id: "e3", source: "gateway", target: "playlist", markerEnd: { type: MarkerType.Arrow }},
    { id: "e4", source: "gateway", target: "metadata", markerEnd: { type: MarkerType.Arrow }},

    { id: "e5", source: "metadata", target: "cdn", markerEnd: { type: MarkerType.Arrow }},
    { id: "e6", source: "playlist", target: "cache", markerEnd: { type: MarkerType.Arrow }},
    { id: "e7", source: "auth", target: "users_db", markerEnd: { type: MarkerType.Arrow }},
    { id: "e8", source: "metadata", target: "tracks_db", markerEnd: { type: MarkerType.Arrow }},

    { id: "e9", source: "playlist", target: "reco", markerEnd: { type: MarkerType.Arrow }},
  ]
}
