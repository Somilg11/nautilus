export const FLOW_SCHEMA = `
You MUST return a JSON object with this exact structure:

{
  "nodes": [
    {
      "id": "unique-id",
      "type": "nautilusNode",
      "data": {
        "label": "Service Name",
        "icon": "client_web | client_mobile | web_server | api_server | microservice | database_sql | database_nosql | queue | event_stream | cache | auth | monitoring",
        "color": "default | blue | green | red | yellow",
        "description": "Short description"
      }
    }
  ],
  "edges": [
    { "source": "nodeId", "target": "nodeId" }
  ]
}

Rules:
- Node IDs must be unique.
- Use valid icon names only.
- Do not include explanation, ONLY valid JSON.
- Choose color based on role:
  - client = blue
  - compute/api/microservice = green
  - database/storage = red
  - messaging = yellow
`
