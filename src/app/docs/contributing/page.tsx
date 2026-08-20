import { Callout, CardLink, Code, CodeBlock, DocsPager, P, PageHeader, Section, Table } from "@/components/docs/ui"

export const metadata = { title: "Contributing — Nautilus Docs" }

export default function ContributingPage() {
  return (
    <>
      <PageHeader
        eyebrow="Contributing"
        title="How to contribute"
        lead="Nautilus is community-built and small enough to be approachable. Templates and icons are genuinely easy first contributions."
      />

      <Section title="Set up">
        <CodeBlock
          code={`git clone https://github.com/Somilg11/nautilus.git
cd nautilus
npm install
npm run dev

# before opening a PR — CI runs exactly this
npm run lint && npm run typecheck && npm test && npm run build`}
        />
      </Section>

      <Section title="Where things live">
        <Table
          head={["Area", "Path", "Difficulty"]}
          rows={[
            ["Templates", <Code key="1">src/lib/templates/</Code>, "Easy"],
            ["Icons", <Code key="2">src/components/nodes/node-icons.tsx</Code>, "Easy"],
            ["Docs", <Code key="3">docs/, src/app/docs/</Code>, "Easy"],
            ["Canvas behaviour", <Code key="4">src/components/canvas.tsx</Code>, "Medium"],
            ["Simulation engine", <Code key="5">src/lib/flow-execution.ts</Code>, "Involved"],
            ["AI providers", <Code key="6">src/lib/ai-client.ts</Code>, "Involved"],
          ]}
        />
      </Section>

      <Section title="Conventions worth knowing">
        <Table
          head={["Rule", "Why"]}
          rows={[
            ["One listener per nautilus-* event", "Toolbar buttons dispatch window events. Binding one twice is how paste once inserted two copies of everything."],
            ["Never persist transient state", "Anything written into node data lands in undo history, autosave, exports and share links."],
            ["Validate untrusted input", "Imports, share links and AI output all pass through src/lib/diagram-io.ts."],
            ["Use reactflow v11", "react-flow-renderer is the unmaintained v10 package and pins React to 18."],
            ["Conventional commits", "feat:, fix:, docs:, refactor:, test:, chore:"],
          ]}
        />
      </Section>

      <Section title="Testing">
        <P>
          The pure parts — the execution planner and the diagram validator — are
          unit-tested with Vitest. Any change to their behaviour should come with
          a test.
        </P>
        <CodeBlock code={`npm test           # single run
npm run test:watch # watch mode`} />
      </Section>

      <Callout title="Start small">
        A focused pull request gets reviewed quickly. If a change touches the
        JSON format or the event contract, open an issue first so the shape can
        be agreed before you write it.
      </Callout>

      <Section title="Next">
        <div className="grid gap-3 sm:grid-cols-2">
          <CardLink href="/docs/add-template" title="Add a template" body="Ship an architecture in one file." />
          <CardLink href="/docs/add-icon" title="Add an icon" body="Extend the component library." />
        </div>
      </Section>

      <DocsPager href="/docs/contributing" />
    </>
  )
}
