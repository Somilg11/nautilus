import { DocsPager, P, PageHeader, Section, Table } from "@/components/docs/ui"

export const metadata = {
  title: "The interface — Nautilus Docs",
  description:
    "A tour of every region of the Nautilus editor — toolbar, component sidebar, canvas, inspector and simulation panel — and what each one controls.",
  alternates: { canonical: "/docs/interface" },
  openGraph: {
    title: "The interface — Nautilus Docs",
    description:
      "A tour of every region of the Nautilus editor — toolbar, component sidebar, canvas and inspector — and what each one controls.",
    url: "/docs/interface",
    type: "article",
  },
}

export default function InterfacePage() {
  return (
    <>
      <PageHeader
        eyebrow="Getting started"
        title="The interface"
        lead="Five regions, each with one job."
      />

      <Section>
        <Table
          head={["Region", "What it does"]}
          rows={[
            ["Top toolbar", "Project name, save state, undo/redo, templates, import, export, PNG, share, run, load playground, assistant, theme"],
            ["Editing bar", "Copy, paste, duplicate, delete, group, ungroup, align, distribute, zoom, fit — plus a live selection count"],
            ["Left panel", "Searchable component palette; the drag source for new nodes"],
            ["Right panel", "Properties of the selected node or connection, the AI assistant, and API key management"],
            ["Canvas", "Pan by dragging empty space, zoom with the wheel, box-select by dragging, multi-select with Shift, right-click a node for its menu, minimap bottom-right"],
            ["Simulation panel", "Appears at the bottom of the canvas when you run a trace or open the load playground"],
          ]}
        />
      </Section>

      <Section title="Right panel tabs">
        <Table
          head={["Tab", "Use it for"]}
          rows={[
            ["Properties — node", "Label, description, colour, the capacity model, and whether the component runs on its own as a cron job or worker loop"],
            ["Properties — connection", "Operation, endpoint or topic, timeout, call order, traffic share and fan-out, plus live rate and response time"],
            ["Assistant", "Chat that can see your diagram — design, extend, review or explain"],
            ["Keys", "Store, reveal, test and clear provider API keys"],
          ]}
        />
        <P>
          The panel opens from the Assistant button in the toolbar, or by
          double-clicking any node or connection on the canvas.
        </P>
      </Section>

      <Section title="Simulation panel tabs">
        <Table
          head={["Tab", "Use it for"]}
          rows={[
            ["Trace", "Replay the numbered requests: play, pause, step back and forward, jump, speed"],
            ["Load", "Offered load and the other parameters, throughput, drops, backlog, bottlenecks, the capacity plan and cost"],
            ["Ramp", "Offered against delivered from zero to twice the current load — where the design gives out"],
            ["Calls", "Every request in order, with what triggers it. Click a row to jump to that connection"],
          ]}
        />
        <P>
          What you see on the canvas itself: each connection carries a coloured
          badge with its step number, operation and endpoint. Solid lines are
          calls somebody waits on, dashed lines are hand-offs and consumers,
          dotted lines are polls.
        </P>
      </Section>

      <DocsPager href="/docs/interface" />
    </>
  )
}
