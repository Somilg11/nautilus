import { DocsPager, P, PageHeader, Section, Table } from "@/components/docs/ui"

export const metadata = {
  title: "The interface — Nautilus Docs",
  description:
    "A tour of every region of the Nautilus editor — toolbar, component sidebar, canvas and inspector — and what each one controls.",
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
        lead="Four regions, each with one job."
      />

      <Section>
        <Table
          head={["Region", "What it does"]}
          rows={[
            ["Top toolbar", "Project name, save state, undo/redo, templates, import, export, PNG, share, run, assistant, theme"],
            ["Editing bar", "Copy, paste, duplicate, delete, group, ungroup, align, distribute, zoom, fit — plus a live selection count"],
            ["Left panel", "Searchable component palette; the drag source for new nodes"],
            ["Right panel", "Node properties, the AI assistant, and API key management"],
            ["Canvas", "Pan by dragging empty space, zoom with the wheel, box-select by dragging, multi-select with Shift, minimap bottom-right"],
          ]}
        />
      </Section>

      <Section title="Right panel tabs">
        <Table
          head={["Tab", "Use it for"]}
          rows={[
            ["Properties", "Label, description and colour of the selected node, plus its id and delete"],
            ["Assistant", "Chat that can see your diagram — design, extend, review or explain"],
            ["Keys", "Store, reveal, test and clear provider API keys"],
          ]}
        />
        <P>
          The panel opens from the Assistant button in the toolbar, or by
          double-clicking any node on the canvas.
        </P>
      </Section>

      <DocsPager href="/docs/interface" />
    </>
  )
}
