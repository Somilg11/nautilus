import { MarkerType } from "react-flow-renderer"

export const UberTemplate = {
  id: "uber",
  name: "Uber – Ride Hailing System",
  description: "Real-time matching, location services, trip management, surge pricing, notifications.",

  nodes: [
    { id: "rider_app", type: "nautilusNode", position: { x: 100, y: 40 }, data: { label: "Rider App", icon: "client_mobile", color: "blue" } },
    { id: "driver_app", type: "nautilusNode", position: { x: 320, y: 40 }, data: { label: "Driver App", icon: "client_mobile", color: "blue" } },

    { id: "gateway", type: "nautilusNode", position: { x: 210, y: 140 }, data: { label: "API Gateway", icon: "api_server", color: "green" } },

    { id: "dispatch", type: "nautilusNode", position: { x: 80, y: 260 }, data: { label: "Dispatch Service", icon: "server", color: "green" } },
    { id: "matching", type: "nautilusNode", position: { x: 220, y: 260 }, data: { label: "Matching Service", icon: "server", color: "green" } },
    { id: "pricing", type: "nautilusNode", position: { x: 360, y: 260 }, data: { label: "Surge Pricing Service", icon: "server", color: "green" } },

    { id: "realtime", type: "nautilusNode", position: { x: 210, y: 360 }, data: { label: "Real-time Location Service", icon: "server", color: "yellow" } },
    { id: "mq", type: "nautilusNode", position: { x: 210, y: 460 }, data: { label: "Message Queue (Kafka)", icon: "queue", color: "yellow" } },

    { id: "drivers_db", type: "nautilusNode", position: { x: 60, y: 560 }, data: { label: "Drivers DB", icon: "database_sql", color: "red" } },
    { id: "riders_db", type: "nautilusNode", position: { x: 210, y: 560 }, data: { label: "Riders DB", icon: "database_sql", color: "red" } },
    { id: "trips_db", type: "nautilusNode", position: { x: 360, y: 560 }, data: { label: "Trips DB", icon: "database_sql", color: "red" } },

    { id: "notifications", type: "nautilusNode", position: { x: 210, y: 660 }, data: { label: "Push Notifications", icon: "server", color: "yellow" } },
  ],

  edges: [
    { id: "e1", source: "rider_app", target: "gateway", markerEnd: { type: MarkerType.Arrow }},
    { id: "e2", source: "driver_app", target: "gateway", markerEnd: { type: MarkerType.Arrow }},

    { id: "e3", source: "gateway", target: "dispatch", markerEnd: { type: MarkerType.Arrow }},
    { id: "e4", source: "gateway", target: "matching", markerEnd: { type: MarkerType.Arrow }},
    { id: "e5", source: "gateway", target: "pricing", markerEnd: { type: MarkerType.Arrow }},

    { id: "e6", source: "matching", target: "realtime", markerEnd: { type: MarkerType.Arrow }},
    { id: "e7", source: "realtime", target: "mq", markerEnd: { type: MarkerType.Arrow }},

    { id: "e8", source: "dispatch", target: "drivers_db", markerEnd: { type: MarkerType.Arrow }},
    { id: "e9", source: "matching", target: "riders_db", markerEnd: { type: MarkerType.Arrow }},
    { id: "e10", source: "pricing", target: "trips_db", markerEnd: { type: MarkerType.Arrow }},

    { id: "e11", source: "mq", target: "notifications", markerEnd: { type: MarkerType.Arrow }},
  ]
}
