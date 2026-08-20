import { Code, CodeBlock, DocsPager, List, P, PageHeader, Section, Steps } from "@/components/docs/ui"

export const metadata = {
  title: "Add a template — Nautilus Docs",
  description:
    "Add a new architecture template to Nautilus in a single file: create it, register it, and check it renders.",
  alternates: { canonical: "/docs/add-template" },
  openGraph: {
    title: "Add a template — Nautilus Docs",
    description:
      "Add a new architecture template to Nautilus in a single file: create it, register it, and check it renders.",
    url: "/docs/add-template",
    type: "article",
  },
}

export default function AddTemplatePage() {
  return (
    <>
      <PageHeader
        eyebrow="Contributing"
        title="Add a template"
        lead="One file, one registration line, one pull request."
      />

      <Section>
        <Steps
          steps={[
            {
              title: "Create the file",
              body: (
                <>
                  <Code>src/lib/templates/my-system.ts</Code> — put large
                  real-world systems in <Code>src/lib/templates/big/</Code>.
                </>
              ),
            },
            {
              title: "Register it",
              body: (
                <>
                  Export it from <Code>src/lib/templates/index.ts</Code>.
                </>
              ),
            },
            {
              title: "Check it",
              body: "Load it from the Templates dialog, then press Run — the simulation is a fast sanity check that the graph flows the way you intended.",
            },
          ]}
        />
      </Section>

      <Section title="The shape">
        <CodeBlock
          code={`import { MarkerType } from "reactflow"

export const MyTemplate = {
  id: "my-system",
  name: "My System",
  description: "One line describing what this architecture shows.",
  nodes: [
    {
      id: "client",
      type: "nautilusNode",
      position: { x: 0, y: 0 },
      data: {
        label: "Mobile Client",
        icon: "client_mobile",   // must exist in the icon reference
        color: "blue",           // default | blue | green | red | yellow | purple | orange
        description: "iOS / Android app",
      },
    },
  ],
  edges: [
    {
      id: "e-client-api",
      source: "client",
      target: "api",
      type: "deletableEdge",
      markerEnd: { type: MarkerType.Arrow },
    },
  ],
}`}
        />
      </Section>

      <Section title="What makes a good template">
        <List
          items={[
            "Top-to-bottom layout: clients at the top, storage at the bottom.",
            "A description on every node — that is what the template teaches.",
            "Colour by role, matching the rest of the library.",
            "No cycles unless the real architecture has one.",
            "Enough components to be realistic, few enough to be readable — roughly 8 to 20.",
          ]}
        />
        <P>
          Node ids are local to the template, so short readable ids like{" "}
          <Code>api</Code> or <Code>orders-db</Code> are better than UUIDs.
        </P>
      </Section>

      <DocsPager href="/docs/add-template" />
    </>
  )
}
