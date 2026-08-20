import { Code, CodeBlock, DocsPager, List, PageHeader, Section } from "@/components/docs/ui"

export const metadata = {
  title: "Add an icon — Nautilus Docs",
  description:
    "Extend the Nautilus component library by adding a new icon and wiring it into the node palette.",
  alternates: { canonical: "/docs/add-icon" },
  openGraph: {
    title: "Add an icon — Nautilus Docs",
    description:
      "Extend the Nautilus component library by adding a new icon and wiring it into the node palette.",
    url: "/docs/add-icon",
    type: "article",
  },
}

export default function AddIconPage() {
  return (
    <>
      <PageHeader
        eyebrow="Contributing"
        title="Add an icon"
        lead="Icons are keyed by a stable snake_case id used in node data, templates and AI output."
      />

      <Section title="1. Register the icon">
        <CodeBlock
          caption="src/components/nodes/node-icons.tsx"
          code={`import { SiApachekafka } from "react-icons/si"

export const NodeIcons: Record<string, JSX.Element> = {
  // …
  kafka: <SiApachekafka className="h-4 w-4" />,
}`}
        />
      </Section>

      <Section title="2. Add it to the palette">
        <CodeBlock
          caption="src/components/left-sidebar.tsx"
          code={`{
  title: "Messaging",
  items: [
    { id: "kafka", label: "Kafka", icon: SiApachekafka },
  ],
}`}
        />
      </Section>

      <Section title="3. Teach the assistant (optional)">
        <CodeBlock
          caption="src/lib/ai-schema.ts"
          code={`"icon": "client_web | api_server | kafka | …"`}
        />
      </Section>

      <Section title="Rules">
        <List
          items={[
            <span key="libs">
              Use <Code>lucide-react</Code> or <Code>react-icons</Code>; no inline SVG blobs.
            </span>,
            <span key="size">
              Size every icon <Code>h-4 w-4</Code> so nodes stay aligned.
            </span>,
            "Keys are snake_case and permanent — renaming one breaks saved diagrams.",
            "Prefer the vendor's own brand icon when the component is a specific product.",
          ]}
        />
      </Section>

      <DocsPager href="/docs/add-icon" />
    </>
  )
}
