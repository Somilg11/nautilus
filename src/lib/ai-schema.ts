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
    {
      "source": "nodeId",
      "target": "nodeId",
      "op": "GET | POST | PUT | PATCH | DELETE | CALL | READ | WRITE | QUERY | PUBLISH | EVENT | CONSUME | POLL",
      "path": "/orders/:id, a table name, or a topic such as orders.created"
    }
  ]
}

Rules:
- Node IDs must be unique.
- Use valid icon names only.
- Do not include explanation, ONLY valid JSON.
- Every edge runs from the component that initiates the interaction to the one that receives it, and states what it does:
  - GET/POST/PUT/PATCH/DELETE/CALL for a request the caller waits on
  - READ/WRITE/QUERY for a cache or database access
  - PUBLISH for producing to a queue or topic (draw producer -> queue)
  - CONSUME for a consumer reading from a queue (draw queue -> consumer)
  - EVENT for a fire-and-forget call or webhook
  - POLL when the source checks the target on a timer
- Choose color based on role:
  - client = blue
  - compute/api/microservice = green
  - database/storage = red
  - messaging = yellow
`
