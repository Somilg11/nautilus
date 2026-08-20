import { Callout, DocsPager, PageHeader, Section, Table } from "@/components/docs/ui"

export const metadata = { title: "Editing tools — Nautilus Docs" }

export default function ToolsPage() {
  return (
    <>
      <PageHeader
        eyebrow="Editing"
        title="Editing tools"
        lead="The bar under the toolbar. Buttons dim when the current selection can't use them."
      />

      <Section>
        <Table
          head={["Tool", "Behaviour", "Needs"]}
          rows={[
            ["Copy / Paste", "Copies selected nodes plus the edges between them; paste offsets and selects the copy", "A selection"],
            ["Duplicate", "Copy and paste in one action", "A selection"],
            ["Delete", "Removes the selection and every edge touching it", "A selection"],
            ["Group", "Wraps the selection in a real container node; children move with it and are clipped to it", "2+ nodes"],
            ["Ungroup", "Dissolves the container and restores absolute positions", "A group"],
            ["Align left / centre / right", "Aligns using measured node widths, not raw coordinates", "2+ nodes"],
            ["Distribute horizontally", "Even spacing between the outermost selected nodes", "3+ nodes"],
            ["Zoom in / out / fit", "Viewport controls; fit frames the whole diagram", "—"],
          ]}
        />
      </Section>

      <Callout title="Groups are real">
        Grouping creates an actual container node rather than a visual hint, so
        children move with the group and stay inside it. Groups are excluded
        from simulation — they are containers, not services.
      </Callout>

      <DocsPager href="/docs/tools" />
    </>
  )
}
