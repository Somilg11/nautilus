import { Callout, Code, DocsPager, List, P, PageHeader, Section, Steps, Table } from "@/components/docs/ui"

export const metadata = {
  title: "AI assistant — Nautilus Docs",
  description:
    "Use the Nautilus AI assistant with your own provider key to design, extend and review architecture diagrams. Keys never leave your browser.",
  alternates: { canonical: "/docs/ai-assistant" },
  openGraph: {
    title: "AI assistant — Nautilus Docs",
    description:
      "Use the Nautilus AI assistant with your own provider key to design, extend and review architecture diagrams. Keys never leave your browser.",
    url: "/docs/ai-assistant",
    type: "article",
  },
}

export default function AssistantPage() {
  return (
    <>
      <PageHeader
        eyebrow="Features"
        title="AI assistant"
        lead="Bring your own key. The assistant can see your canvas, so it can design, extend, review or explain the architecture in front of you."
      />

      <Section title="Setting it up">
        <Steps
          steps={[
            { title: "Open the panel", body: "Assistant in the toolbar, then the Keys tab." },
            { title: "Paste a key", body: "Any one of the four providers is enough. Keys save as you type." },
            { title: "Test it", body: "The Test button makes one tiny request and reports the provider's own error if something is wrong." },
            { title: "Pick the provider", body: "Provider buttons sit above the chat; a green dot means a key is stored." },
          ]}
        />
      </Section>

      <Section title="Providers">
        <Table
          head={["Provider", "Default model", "Cost"]}
          rows={[
            ["OpenAI", <Code key="a">gpt-4o-mini</Code>, "Usage-billed"],
            ["Google Gemini", <Code key="b">gemini-2.5-flash</Code>, "Free tier available"],
            ["Anthropic Claude", <Code key="c">claude-opus-5</Code>, "Usage-billed"],
            ["Groq", <Code key="d">llama-3.3-70b-versatile</Code>, "Free tier available"],
          ]}
        />
      </Section>

      <Section title="What to ask it">
        <List
          items={[
            "“Design a URL shortener that handles 10k writes/sec” — builds a diagram from scratch.",
            "“Review my current diagram and name its weak points” — reads the canvas and answers concretely.",
            "“Add a caching layer and a read replica to this design” — returns the whole updated diagram.",
            "“Explain the trade-offs between a queue and direct calls here” — plain conversation, no diagram.",
          ]}
        />
      </Section>

      <Section title="Applying a generated diagram">
        <P>
          Diagrams are never applied automatically. When one comes back you get
          three choices: <strong>Replace canvas</strong>,{" "}
          <strong>Add to canvas</strong> (appended below your existing work with
          fresh ids), or <strong>Discard</strong>. Replacing is undoable with
          ⌘/Ctrl+Z.
        </P>
      </Section>

      <Section title="Privacy and safety">
        <List
          items={[
            "Requests go straight from your browser to the provider. Nautilus has no backend and never sees your key, your prompts or your diagrams.",
            "Keys live in this browser's local storage. Anything with access to the origin could read them — use project-scoped keys with a spend limit and clear them when you're done.",
            "Model output is validated before it can reach the canvas: unknown fields, invalid colours, duplicate ids and edges to missing nodes are dropped.",
            "The conversation is kept locally so closing the panel doesn't lose it; New chat clears it.",
          ]}
        />
        <Callout title="Why bring-your-own-key">
          It is the only way to offer AI features on a free, backend-less tool
          without a shared quota or a paywall — and it means your prompts never
          pass through anyone else&apos;s server.
        </Callout>
      </Section>

      <DocsPager href="/docs/ai-assistant" />
    </>
  )
}
