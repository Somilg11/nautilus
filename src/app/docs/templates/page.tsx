import Link from "next/link"
import { CardLink, DocsPager, P, PageHeader, Section } from "@/components/docs/ui"

export const metadata = { title: "Templates — Nautilus Docs" }

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
          Load one, then press Run. The simulation shows you the dependency order
          the author intended — usually more informative than the picture alone.
          Click through the nodes and read their descriptions; that is where the
          reasoning lives.
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
