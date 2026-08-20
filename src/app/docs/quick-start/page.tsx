import Link from "next/link"
import { Callout, DocsPager, PageHeader, Section, Steps } from "@/components/docs/ui"

export const metadata = { title: "Quick start — Nautilus Docs" }

export default function QuickStartPage() {
  return (
    <>
      <PageHeader
        eyebrow="Getting started"
        title="Quick start"
        lead="Five steps from an empty canvas to a running simulation. No install, no sign-up."
      />

      <Section>
        <Steps
          steps={[
            {
              title: "Open the editor",
              body: (
                <>
                  Go to{" "}
                  <Link href="/dashboard" className="underline underline-offset-4">
                    /dashboard
                  </Link>
                  . A two-node starter diagram is already on the canvas.
                </>
              ),
            },
            {
              title: "Drag in components",
              body: "Search the left palette — “kafka”, “redis”, “s3” — and drag any component onto the canvas.",
            },
            {
              title: "Connect them",
              body: "Drag from the handle at the bottom of one node to the handle at the top of another. Direction matters: it is what the simulation follows.",
            },
            {
              title: "Describe them",
              body: "Select a node and fill in its label and description in the right panel. A described diagram is a document; an undescribed one is a picture.",
            },
            {
              title: "Run it",
              body: "Press Run in the toolbar and watch data traverse the design step by step. Parallel branches light up together.",
            },
          ]}
        />
      </Section>

      <Callout title="Keeping your work">
        The canvas autosaves to this browser. For anything you care about, use
        Export JSON — autosave is a convenience, not a backup.
      </Callout>

      <DocsPager href="/docs/quick-start" />
    </>
  )
}
