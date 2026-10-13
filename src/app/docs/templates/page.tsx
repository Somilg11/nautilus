import Link from "next/link"
import { CardLink, DocsPager, P, PageHeader, Section } from "@/components/docs/ui"

export const metadata = {
  title: "Templates — Nautilus Docs",
  description:
    "Load production-grade reference architectures in Nautilus — ready-made system designs you can open, edit and simulate.",
  alternates: { canonical: "/docs/templates" },
  openGraph: {
    title: "Templates — Nautilus Docs",
    description:
      "Load production-grade reference architectures in Nautilus — ready-made system designs you can open, edit and simulate.",
    url: "/docs/templates",
    type: "article",
  },
}

const TEMPLATES = [
  "Netflix", "Uber", "WhatsApp", "Instagram", "YouTube",
  "Spotify", "Zomato", "Three-tier", "Microservices",
]

export default function TemplatesPage() {
  return (
    <>
      <PageHeader
        eyebrow="Features"
        title="Templates"
        lead="Production-grade architectures you can load, read and edit."
      />

      <Section>
        <P>
          Open <strong>Templates</strong> in the toolbar and pick one. Loading a
          template replaces the canvas contents, so export first if you have work
          in progress.
        </P>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {TEMPLATES.map((t) => (
            <div key={t} className="rounded-lg border bg-card px-3 py-2.5 text-[13px] text-muted-foreground">
              {t}
            </div>
          ))}
        </div>
      </Section>

      <Section title="Reading a template well">
        <P>
          Load one, then press Run. The trace replays the requests in the order
          the author intended — usually more informative than the picture alone.
          Click through the nodes and read their descriptions; that is where the
          reasoning lives.
        </P>
        <P>
          Then open the load playground. Every template ships with a capacity
          model, rough cloud list prices and the load it was designed for, so
          it serves its own traffic cleanly — and the Ramp tab shows how much
          further it would go before something gives out. The microservices
          template also includes a cron job and a polling connection as
          examples of work nobody calls.
        </P>
      </Section>

      <Section title="Add your own">
        <div className="grid gap-3 sm:grid-cols-2">
          <CardLink
            href="/docs/add-template"
            title="Add a template"
            body="One file, one registration line, one pull request."
          />
          <CardLink
            href="/docs/contributing"
            title="How to contribute"
            body="Repo setup, conventions and the PR checklist."
          />
        </div>
        <P className="pt-2">
          Templates are the easiest meaningful contribution to Nautilus — see the{" "}
          <Link href="/docs/add-template" className="underline underline-offset-4">
            guide
          </Link>
          .
        </P>
      </Section>

      <DocsPager href="/docs/templates" />
    </>
  )
}
