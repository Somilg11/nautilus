import { MarkerType } from "react-flow-renderer"

export const UberTemplate = {
  id: "uber",
  name: "Uber – Ride Hailing System",
  description: "Real-time ride matching, dispatch, GPS tracking, payments.",

  nodes: [
    { id: "rider_app", type: "nautilusNode", data: { label: "Rider App", icon: "client_mobile", color: "blue" }, position: { x: 100, y: 50 } },
    { id: "driver_app", type: "nautilusNode", data: { label: "Driver App", icon: "client_mobile", color: "blue" }, position: { x: 350, y: 50 } },

    { id: "api_gateway", type: "nautilusNode", data: { label: "API Gateway", icon: "api_gateway", color: "green" }, position: { x: 220, y: 150 } },

    { id: "auth_service", type: "nautilusNode", data: { label: "Auth Service", icon: "auth_service", color: "purple" }, position: { x: 70, y: 260 } },
    { id: "user_service", type: "nautilusNode", data: { label: "User Service", icon: "microservice", color: "green" }, position: { x: 220, y: 260 } },
    { id: "driver_service", type: "nautilusNode", data: { label: "Driver Service", icon: "microservice", color: "green" }, position: { x: 380, y: 260 } },

    { id: "location_service", type: "nautilusNode", data: { label: "Location Service (GPS)", icon: "microservice", color: "yellow" }, position: { x: 180, y: 360 } },
    { id: "geo_service", type: "nautilusNode", data: { label: "Geocoding", icon: "microservice", color: "yellow" }, position: { x: 350, y: 360 } },

    { id: "matching", type: "nautilusNode", data: { label: "Ride Matching", icon: "microservice", color: "orange" }, position: { x: 150, y: 480 } },
    { id: "kafka", type: "nautilusNode", data: { label: "Kafka Events", icon: "kafka", color: "orange" }, position: { x: 350, y: 480 } },

    { id: "payment_service", type: "nautilusNode", data: { label: "Payment Service", icon: "microservice", color: "pink" }, position: { x: 220, y: 580 } },
    { id: "billing", type: "nautilusNode", data: { label: "Billing", icon: "microservice", color: "pink" }, position: { x: 380, y: 580 } },

    { id: "db_users", type: "nautilusNode", data: { label: "Users DB", icon: "postgres", color: "red" }, position: { x: 70, y: 680 } },
    { id: "db_rides", type: "nautilusNode", data: { label: "Rides DB", icon: "postgres", color: "red" }, position: { x: 220, y: 680 } },
    { id: "db_locations", type: "nautilusNode", data: { label: "Geo DB", icon: "mongodb", color: "red" }, position: { x: 380, y: 680 } },

    { id: "prometheus", type: "nautilusNode", data: { label: "Prometheus", icon: "prometheus", color: "gray" }, position: { x: 150, y: 780 } },
    { id: "grafana", type: "nautilusNode", data: { label: "Grafana", icon: "grafana", color: "gray" }, position: { x: 350, y: 780 } },
  ],

  edges: [
    { id: "1", source: "rider_app", target: "api_gateway", markerEnd: { type: MarkerType.Arrow }},
    { id: "2", source: "driver_app", target: "api_gateway", markerEnd: { type: MarkerType.Arrow }},

    { id: "3", source: "api_gateway", target: "auth_service", markerEnd: { type: MarkerType.Arrow }},
    { id: "4", source: "api_gateway", target: "user_service", markerEnd: { type: MarkerType.Arrow }},
    { id: "5", source: "api_gateway", target: "driver_service", markerEnd: { type: MarkerType.Arrow }},

    { id: "6", source: "user_service", target: "db_users", markerEnd: { type: MarkerType.Arrow }},
    { id: "7", source: "driver_service", target: "db_users", markerEnd: { type: MarkerType.Arrow }},

    { id: "8", source: "location_service", target: "db_locations", markerEnd: { type: MarkerType.Arrow }},

    { id: "9", source: "matching", target: "kafka", markerEnd: { type: MarkerType.Arrow }},

    { id: "10", source: "payment_service", target: "billing", markerEnd: { type: MarkerType.Arrow }},
    { id: "11", source: "billing", target: "db_rides", markerEnd: { type: MarkerType.Arrow }},
  ],
}
