import { DOCS_NAV } from "@/lib/docs-nav"
import {
  CardLink,
  Callout,
  DocsPager,
  P,
  PageHeader,
  Section,
} from "@/components/docs/ui"

export const metadata = {
  title: "Nautilus Docs",
  description:
    "Nautilus documentation: what the browser-only system design canvas does, what it deliberately does not, and where to start.",
  alternates: { canonical: "/docs" },
  openGraph: {
    title: "Nautilus Docs",
    description:
      "Nautilus documentation: what the browser-only system design canvas does, what it deliberately does not, and where to start.",
    url: "/docs",
    type: "article",
  },
}

export default function DocsIntroPage() {
  const featured = DOCS_NAV.flatMap((g) => g.items).filter((p) =>
    ["/docs/quick-start", "/docs/simulation", "/docs/ai-assistant", "/docs/self-hosting"].includes(
      p.href
    )
  )

  return (
    <>
      <PageHeader
        eyebrow="Getting started"
        title="Introduction"
        lead="Nautilus is an open-source canvas for designing and explaining software architecture — components, connections, templates, a flow simulator and an optional AI assistant, all running in your browser."
      />

      <Section title="What it is">
        <P>
          A diagram in Nautilus is a graph of components and directed
          dependencies. That structure is what makes the rest possible: the
          simulator can walk it, the AI assistant can reason about it, and the
          exported JSON is something you can diff in a pull request.
        </P>
      </Section>

      <Section title="What it deliberately isn't">
        <P>
          There is no account, no server and no database. Diagrams live in your
          browser&apos;s local storage and in files you export; AI features use a
          key you supply and talk straight to the provider. That is what keeps
          Nautilus free to use, private by default and trivial to self-host.
        </P>
        <Callout title="No lock-in">
          Everything is plain JSON — <code>{"{ name, nodes, edges }"}</code>.
          Export it, commit it, generate it from a script, or import it into a
          fork you run yourself.
        </Callout>
      </Section>

      <Section title="Start here">
        <div className="grid gap-3 sm:grid-cols-2">
          {featured.map((p) => (
            <CardLink key={p.href} href={p.href} title={p.label} body={p.summary} />
          ))}
        </div>
      </Section>

      <DocsPager href="/docs" />
    </>
  )
}
