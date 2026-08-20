import { DocsPager, Keys, P, PageHeader, Section, Table } from "@/components/docs/ui"

export const metadata = {
  title: "Keyboard shortcuts — Nautilus Docs",
  description:
    "Every Nautilus keyboard shortcut, so you can build, edit and simulate an architecture diagram without touching the mouse.",
  alternates: { canonical: "/docs/shortcuts" },
  openGraph: {
    title: "Keyboard shortcuts — Nautilus Docs",
    description:
      "Every Nautilus keyboard shortcut, so you can build, edit and simulate an architecture diagram without touching the mouse.",
    url: "/docs/shortcuts",
    type: "article",
  },
}

export default function ShortcutsPage() {
  return (
    <>
      <PageHeader
        eyebrow="Editing"
        title="Keyboard shortcuts"
        lead="Shortcuts work while the canvas has focus; typing in a text field never triggers them."
      />

      <Section>
        <Table
          head={["Keys", "Action"]}
          rows={[
            [<Keys key="1" combo={["⌘/Ctrl", "C"]} />, "Copy selection"],
            [<Keys key="2" combo={["⌘/Ctrl", "V"]} />, "Paste"],
            [<Keys key="3" combo={["⌘/Ctrl", "G"]} />, "Group selection"],
            [<Keys key="4" combo={["⌘/Ctrl", "Shift", "G"]} />, "Ungroup"],
            [<Keys key="5" combo={["Delete"]} />, "Delete selection"],
            [<Keys key="6" combo={["Backspace"]} />, "Delete selection"],
            [<Keys key="7" combo={["←", "→", "↑", "↓"]} />, "Nudge selection by 1px"],
            [<Keys key="8" combo={["Shift", "arrow"]} />, "Nudge selection by 10px"],
            [<Keys key="9" combo={["Shift", "click"]} />, "Add a node to the selection"],
          ]}
        />
        <P>
          Undo and redo are in the toolbar and follow the platform convention
          (⌘Z / ⌘⇧Z). History holds the last 50 edits of the current session.
        </P>
      </Section>

      <DocsPager href="/docs/shortcuts" />
    </>
  )
}
