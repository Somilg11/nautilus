import { Callout, DocsPager, List, P, PageHeader, Section, Table } from "@/components/docs/ui"

export const metadata = {
  title: "Building a diagram — Nautilus Docs",
  description:
    "How to build an architecture diagram in Nautilus: adding components, drawing connections, saying what each request does, and the colour convention.",
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
        lead="A node is a component. A connection is a request from one component to another. Everything else follows from those two ideas."
      />

      <Section title="The basics">
        <List
          items={[
            "Drag a component from the left palette onto the canvas to create a node.",
            "Drag from the bottom handle of one node to the top handle of another to connect them.",
            "Double-click a node or a connection to open its properties in the right panel.",
            "Right-click a node to edit, duplicate or delete it, or to simulate its failure.",
            "Select a connection, then the ✕ button on it, to remove it.",
          ]}
        />
      </Section>

      <Section title="Which way to draw a connection">
        <P>
          From the component that <strong>starts</strong> the interaction to the
          one that receives it. The direction is what the step numbers, the
          trace and the load model all follow.
        </P>
        <Table
          head={["Situation", "Draw it", "Operation"]}
          rows={[
            ["A service calls another", "Caller → callee", "GET, POST, CALL …"],
            ["A service reads or writes a store", "Service → store", "READ, WRITE, QUERY"],
            ["A service produces a message", "Producer → queue", "PUBLISH"],
            ["A consumer reads from a queue", "Queue → consumer", "CONSUME"],
            ["Something checks on a timer", "Poller → what it polls", "POLL"],
            ["A webhook or fire-and-forget call", "Sender → receiver", "EVENT"],
          ]}
        />
        <P>
          You do not have to label every line. A connection with no operation
          gets one inferred from what it joins, and you can make any of them
          specific — endpoint, timeout, call order — in Properties.
        </P>
      </Section>

      <Section title="Components that run on their own">
        <P>
          The palette has a <strong>Worker</strong> and a <strong>Cron Job</strong>{" "}
          under Compute, already set to run on a schedule. Any other component
          can be given one in <strong>Properties ▸ Runs on its own</strong>.
          Nothing has to call them: they start their own flow, and their load
          is counted separately from user traffic.
        </P>
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
