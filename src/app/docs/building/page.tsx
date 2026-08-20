import { Callout, DocsPager, List, P, PageHeader, Section, Table } from "@/components/docs/ui"

export const metadata = {
  title: "Building a diagram — Nautilus Docs",
  description:
    "How to build an architecture diagram in Nautilus: adding nodes, drawing edges, writing component descriptions and using the colour convention.",
  alternates: { canonical: "/docs/building" },
  openGraph: {
    title: "Building a diagram — Nautilus Docs",
    description:
      "How to build an architecture diagram in Nautilus: adding nodes, drawing edges, writing component descriptions and using the colour convention.",
    url: "/docs/building",
    type: "article",
  },
}

export default function BuildingPage() {
  return (
    <>
      <PageHeader
        eyebrow="Editing"
        title="Building a diagram"
        lead="A node is a component. An edge is a directed dependency. Everything else follows from those two ideas."
      />

      <Section title="The basics">
        <List
          items={[
            "Drag a component from the left palette onto the canvas to create a node.",
            "Drag from the bottom handle of one node to the top handle of another to connect them.",
            "Double-click a node to open its properties in the right panel.",
            "Click an edge, then the ✕ button on it, to remove a connection.",
          ]}
        />
      </Section>

      <Section title="Colour convention">
        <P>
          Colour is not decoration — it is the fastest way to read an unfamiliar
          diagram. Every built-in template follows this mapping, and so should
          any template you contribute.
        </P>
        <Table
          head={["Colour", "Role"]}
          rows={[
            ["Blue", "Clients — web, mobile, third-party callers"],
            ["Green", "Compute — services, APIs, workers"],
            ["Red", "Storage — databases, object stores, caches"],
            ["Yellow", "Messaging — queues, streams, event buses"],
            ["Purple / Orange", "Anything that needs to stand out on its own terms"],
            ["Slate", "Infrastructure and everything unclassified"],
          ]}
        />
      </Section>

      <Callout title="Write the descriptions">
        A node&apos;s description is what turns a picture into documentation, and
        it is also what the AI assistant reads when you ask it to review the
        design. Empty descriptions make both weaker.
      </Callout>

      <DocsPager href="/docs/building" />
    </>
  )
}
