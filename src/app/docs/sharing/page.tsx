import { Callout, Code, CodeBlock, DocsPager, P, PageHeader, Section, Table } from "@/components/docs/ui"

export const metadata = { title: "Sharing & export — Nautilus Docs" }

export default function SharingPage() {
  return (
    <>
      <PageHeader
        eyebrow="Features"
        title="Sharing & export"
        lead="Plain JSON, a self-contained link, or an image."
      />

      <Section>
        <Table
          head={["Feature", "Details"]}
          rows={[
            ["Autosave", "Written to local storage shortly after you stop editing; the toolbar shows Saved or Saving…"],
            ["Export JSON", "Downloads the canonical format — diffable, scriptable, version-controllable"],
            ["Import JSON", "Validated on load; unusable parts are dropped rather than breaking the canvas"],
            ["Share link", "Compresses the whole diagram into the URL — no server involved"],
            ["Export PNG", "Renders the canvas at 2× on a white background"],
          ]}
        />
      </Section>

      <Section title="The file format">
        <P>
          One object with a name, a list of nodes and a list of edges. Anything
          Nautilus does not recognise is dropped on import, so hand-written and
          script-generated files are safe to load.
        </P>
        <CodeBlock
          code={`{
  "name": "Payments platform",
  "nodes": [
    {
      "id": "api",
      "type": "nautilusNode",
      "position": { "x": 120, "y": 40 },
      "data": {
        "label": "Payments API",
        "icon": "api_server",
        "color": "green",
        "description": "Authorises and captures charges",
        "sim": {
          "capacity": 4000,
          "replicas": 6,
          "latencyMs": 25,
          "errorRate": 0.001
        }
      }
    }
  ],
  "edges": [
    {
      "id": "e1",
      "source": "api",
      "target": "db",
      "type": "deletableEdge",
      "label": "cache miss",
      "data": { "sim": { "share": 0.15, "fanout": 1 } }
    }
  ]
}`}
        />

        <Section title="Node fields">
          <Table
            head={["Field", "Meaning"]}
            rows={[
              ["id", "Unique within the file. Duplicates are dropped on import."],
              ["type", <Code key="t">nautilusNode</Code>],
              ["position", "Canvas coordinates, { x, y }."],
              ["data.label", "Name shown on the node."],
              ["data.icon", "Key from the icon reference."],
              ["data.color", "default | blue | green | red | yellow | purple | orange"],
              ["data.description", "Free text shown on the node and read by the AI assistant."],
              ["data.sim", "Load model — see below. Optional."],
            ]}
          />
        </Section>

        <Section title="Simulation fields">
          <Table
            head={["Field", "Where", "Default"]}
            rows={[
              ["sim.capacity", "node — requests/second one replica serves", "unbounded"],
              ["sim.replicas", "node — identical instances", "1"],
              ["sim.latencyMs", "node — service time before queueing", "20"],
              ["sim.errorRate", "node — baseline failure rate, 0–1", "0"],
              ["sim.share", "edge — fraction of requests taking this edge, 0–1", "1"],
              ["sim.fanout", "edge — calls made per request", "1"],
            ]}
          />
          <P>
            These survive export, import, share links and autosave, so a diagram
            carries its capacity model with it. Missing fields fall back to the
            defaults above rather than to zero.
          </P>
        </Section>

        <Section title="Edge fields">
          <Table
            head={["Field", "Meaning"]}
            rows={[
              ["id", "Unique within the file."],
              ["source / target", "Node ids. Edges pointing at a missing node are dropped on import."],
              ["type", <Code key="e">deletableEdge</Code>],
              ["label", "Optional text rendered on the connection."],
              ["animated", "Optional boolean, purely visual."],
              ["data.sim", "Routing model — share and fanout."],
            ]}
          />
        </Section>
      </Section>

      <Callout title="Share links are unlisted, not private">
        The diagram is encoded in the URL itself. Anyone holding the link — or
        reading a referrer header or a proxy log — has the diagram. Don&apos;t
        share internal architecture this way; export a file instead.
      </Callout>

      <DocsPager href="/docs/sharing" />
    </>
  )
}
