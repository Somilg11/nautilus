import Link from "next/link"
import { Callout, DocsPager, PageHeader, Section, Steps } from "@/components/docs/ui"

export const metadata = {
  title: "Quick start — Nautilus Docs",
  description:
    "Go from an empty Nautilus canvas to a load-tested architecture in six steps: drag components in, connect them, say what each request does, run it, load it.",
  alternates: { canonical: "/docs/quick-start" },
  openGraph: {
    title: "Quick start — Nautilus Docs",
    description:
      "Go from an empty Nautilus canvas to a load-tested architecture in six steps: drag components in, connect them, say what each request does, run it, load it.",
    url: "/docs/quick-start",
    type: "article",
  },
}

export default function QuickStartPage() {
  return (
    <>
      <PageHeader
        eyebrow="Getting started"
        title="Quick start"
        lead="Six steps from an empty canvas to a design you have pushed traffic through. No install, no sign-up."
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
              body: "Drag from the handle at the bottom of one node to the handle at the top of another. Draw from whoever starts the interaction to whoever receives it — caller to service, producer to queue, queue to consumer.",
            },
            {
              title: "Say what each request does",
              body: "Every connection already carries a step number and an inferred operation. Double-click one to make it specific: GET /orders/:id, PUBLISH order.created, POLL every 5 seconds.",
            },
            {
              title: "Run it",
              body: "Press Run in the toolbar to replay the requests one at a time, in the order they happen. The Calls tab lists every hop and what triggers it.",
            },
            {
              title: "Push traffic through it",
              body: "Press the gauge button, give your services a capacity in Properties ▸ Simulation, and drag the load slider until something turns red. The Ramp tab shows where the design gives out.",
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
