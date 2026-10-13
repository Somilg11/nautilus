import { DocsPager, Faq, PageHeader, Section } from "@/components/docs/ui"

export const metadata = {
  title: "FAQ — Nautilus Docs",
  description:
    "Short answers to the common Nautilus questions: data privacy, offline use, AI keys, exports and browser support.",
  alternates: { canonical: "/docs/faq" },
  openGraph: {
    title: "FAQ — Nautilus Docs",
    description:
      "Short answers to the common Nautilus questions: data privacy, offline use, AI keys, exports and browser support.",
    url: "/docs/faq",
    type: "article",
  },
}

export default function FaqPage() {
  return (
    <>
      <PageHeader eyebrow="Reference" title="FAQ" lead="Short answers to the questions that come up most." />

      <Section>
        <Faq
          items={[
            {
              q: "Is it really free?",
              a: "Yes. Nautilus is MIT-licensed with no paid tier, no account and no backend to charge for. AI features use your own provider key, so any cost there is between you and the provider — and two of the four providers have a free tier.",
            },
            {
              q: "Where are my diagrams stored?",
              a: "In your browser's local storage, plus whatever you export. Clearing site data deletes them. Autosave is a convenience, not a backup.",
            },
            {
              q: "Can other people see my share links?",
              a: "Anyone holding the link can open the diagram — the whole thing is encoded in the URL. Treat share links as unlisted, not private.",
            },
            {
              q: "Does the simulation model latency or load?",
              a: "Yes. Trace replays the numbered requests in order; the load playground pushes traffic through a capacity model and reports utilisation, queue-inflated latency, p95, drops, backlog, cost and where the design gives out. It is a steady-state model, so use it to find bottlenecks rather than to predict an exact p99.",
            },
            {
              q: "Are the endpoints I name actually called?",
              a: "No. An endpoint or topic on a connection describes the design. Nothing is ever sent to it — Nautilus is a model, not a load-testing tool.",
            },
            {
              q: "Does running a simulation put load on a server?",
              a: "No. There is no simulation backend. The model runs in a Web Worker inside your own browser and makes no network requests, so it works offline and costs the host nothing.",
            },
            {
              q: "Will it cope with a large diagram?",
              a: "Off-screen components are not drawn, badges are hidden when you zoom out too far to read them, and animations switch off automatically on big diagrams and low-end devices. Imports are capped at 2,000 components and 4,000 connections.",
            },
            {
              q: "Does Nautilus send my data anywhere?",
              a: "The app makes no network calls of its own. The only outbound requests are AI calls you explicitly trigger, sent straight to the provider you selected.",
            },
            {
              q: "Can I use it offline?",
              a: "Yes — run it locally with npx or the desktop build. Everything except the AI assistant works without a network.",
            },
            {
              q: "Does it work on mobile?",
              a: "The editor is desktop-first and shows a disclaimer on small screens. Reading a shared diagram works; drawing on a phone is not a good time yet.",
            },
            {
              q: "How do I report a security issue?",
              a: "Privately, through GitHub Security Advisories — see SECURITY.md in the repository. Please don't open a public issue.",
            },
          ]}
        />
      </Section>

      <DocsPager href="/docs/faq" />
    </>
  )
}
