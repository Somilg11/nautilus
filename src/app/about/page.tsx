import Link from "next/link"
import type { Metadata } from "next"
import { Button } from "@/components/ui/button"
import NautilusMark from "@/components/nautilus-mark"
import {
  ArrowRight,
  ArrowUpRight,
  Boxes,
  GitPullRequest,
  KeyRound,
  Play,
  Shield,
  Sparkles,
} from "lucide-react"

export const metadata: Metadata = {
  title: "About — Nautilus",
  description:
    "Why Nautilus exists: an open-source, browser-only canvas for system design and load simulation — no accounts, no backend, no lock-in.",
}

const PRINCIPLES = [
  {
    icon: <Shield className="h-4 w-4" />,
    title: "Your data stays yours",
    body: "No accounts, no servers, no telemetry. Diagrams live in your browser and in files you export. The app makes no network calls of its own.",
  },
  {
    icon: <KeyRound className="h-4 w-4" />,
    title: "Bring your own key",
    body: "AI is optional and uses a key you supply, sent straight to the provider. That is how the tool stays genuinely free instead of metered.",
  },
  {
    icon: <Boxes className="h-4 w-4" />,
    title: "Plain, portable format",
    body: "Every diagram is JSON you can diff, commit, script or import elsewhere. There is nothing to migrate away from.",
  },
  {
    icon: <Play className="h-4 w-4" />,
    title: "Diagrams you can run",
    body: "The canvas holds a real dependency graph, so it can be traced step by step — and loaded with traffic until something gives out.",
  },
]

const INSIDE = [
  {
    label: "Component library",
    body: "Hundreds of cloud, database, messaging, auth and DevOps icons, searchable and draggable.",
  },
  {
    label: "Templates",
    body: "Netflix, Uber, WhatsApp, Instagram, YouTube, Spotify, Zomato, three-tier and microservices.",
  },
  {
    label: "Trace simulation",
    body: "Layered execution with play, pause, step and speed — parallel branches light up together.",
  },
  {
    label: "Load playground",
    body: "Give nodes capacity, replicas, latency and error rates, then push traffic through and watch where it breaks.",
  },
  {
    label: "AI assistant",
    body: "Design, extend, review or explain — with your canvas as context and your own provider key.",
  },
  {
    label: "Sharing",
    body: "JSON export and import, PNG export, and self-contained share links that need no server.",
  },
  {
    label: "Runs anywhere",
    body: "Vercel, any Node host, a static CDN, one npx command, or a packaged desktop app.",
  },
]

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* ---------------- HEADER ---------------- */}
      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-[1100px] items-center gap-3 px-4 sm:px-5">
          <Link href="/" className="flex items-center gap-2 text-sm font-medium tracking-tight">
            <NautilusMark className="h-6 w-6" />
            Nautilus
          </Link>
          <span className="text-muted-foreground/40">/</span>
          <span className="text-sm text-muted-foreground">About</span>

          <div className="ml-auto flex items-center gap-1.5">
            <Button asChild variant="ghost" size="sm" className="h-8 text-[13px] text-muted-foreground">
              <Link href="/docs">Docs</Link>
            </Button>
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="hidden h-8 text-[13px] text-muted-foreground sm:inline-flex"
            >
              <Link href="https://github.com/Somilg11/nautilus" target="_blank" rel="noreferrer noopener">
                GitHub <ArrowUpRight className="ml-1 h-3.5 w-3.5" />
              </Link>
            </Button>
            <Button asChild size="sm" className="h-8 text-[13px]">
              <Link href="/dashboard">Open editor</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1100px] px-4 sm:px-5">
        {/* ---------------- HERO ---------------- */}
        <section className="border-b py-14 sm:py-20">
          <div className="max-w-[46rem] space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-[11px] text-muted-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Open source · MIT licensed
            </div>

            <h1 className="text-[40px] font-semibold leading-[1.1] tracking-tight sm:text-[52px]">
              System design should be
              <br />
              readable, runnable and yours.
            </h1>

            <p className="max-w-[38rem] text-[16px] leading-7 text-muted-foreground">
              Nautilus is a browser-only canvas for designing, simulating and
              explaining software architecture. No accounts, no backend, no
              lock-in — just a graph you can draw, run traffic through, share as
              a file, and host yourself.
            </p>

            <div className="flex flex-wrap items-center gap-2 pt-2">
              <Button asChild size="sm" className="h-9 px-4 text-[13px]">
                <Link href="/dashboard">
                  Start designing <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                </Link>
              </Button>
              <Button asChild size="sm" variant="outline" className="h-9 px-4 text-[13px]">
                <Link href="/docs/quick-start">Read the quick start</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* ---------------- WHY ---------------- */}
        <section className="grid gap-8 border-b py-14 sm:py-20 md:grid-cols-[1fr_1.1fr] md:gap-10">
          <div>
            <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground/70">
              Why it exists
            </div>
            <h2 className="mt-3 text-[26px] font-semibold tracking-tight">
              Architecture tools stopped being about architecture.
            </h2>
          </div>
          <div className="space-y-4">
            <p className="text-[15px] leading-7 text-muted-foreground">
              Most diagramming tools treat a system design as a picture: shapes,
              arrows, a login wall and a pricing page. The structure of the system
              — what depends on what — is thrown away the moment you save.
            </p>
            <p className="text-[15px] leading-7 text-muted-foreground">
              Nautilus keeps that structure. Because the canvas holds a real
              directed graph, the same document can be traced, loaded with
              traffic until a service saturates, reviewed by an assistant that
              understands it, and committed to a repository as plain JSON. And
              because it runs entirely in the browser, none of that requires
              trusting anyone with your architecture.
            </p>
          </div>
        </section>

        {/* ---------------- PRINCIPLES ---------------- */}
        <section className="border-b py-20">
          <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground/70">
            Principles
          </div>
          <h2 className="mt-3 text-[26px] font-semibold tracking-tight">
            Four decisions everything else follows from
          </h2>

          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            {PRINCIPLES.map((p) => (
              <div key={p.title} className="rounded-lg border bg-card p-5">
                <div className="flex items-center gap-2">
                  <span className="grid h-7 w-7 place-items-center rounded-md bg-muted text-foreground">
                    {p.icon}
                  </span>
                  <span className="text-[14px] font-medium">{p.title}</span>
                </div>
                <p className="mt-2 text-[13.5px] leading-6 text-muted-foreground">{p.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ---------------- WHAT'S INSIDE ---------------- */}
        <section className="border-b py-20">
          <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground/70">
            What&apos;s inside
          </div>
          <h2 className="mt-3 text-[26px] font-semibold tracking-tight">
            A short tour
          </h2>

          <div className="mt-8 divide-y rounded-lg border">
            {INSIDE.map((item) => (
              <div key={item.label} className="grid gap-1 px-5 py-4 sm:grid-cols-[200px_1fr] sm:gap-6">
                <div className="text-[14px] font-medium">{item.label}</div>
                <div className="text-[13.5px] leading-6 text-muted-foreground">{item.body}</div>
              </div>
            ))}
          </div>

          <div className="mt-4">
            <Button asChild variant="ghost" size="sm" className="h-8 px-2 text-[13px] text-muted-foreground">
              <Link href="/docs">
                Full documentation <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>
        </section>

        {/* ---------------- SIMULATION ---------------- */}
        <section className="grid gap-8 border-b py-14 sm:py-20 md:grid-cols-[1fr_1.1fr] md:gap-10">
          <div>
            <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground/70">
              <Play className="h-3.5 w-3.5" /> Simulation
            </div>
            <h2 className="mt-3 text-[26px] font-semibold tracking-tight">
              A diagram that answers back
            </h2>
          </div>
          <div className="space-y-4">
            <p className="text-[15px] leading-7 text-muted-foreground">
              <strong className="text-foreground">Trace</strong> walks the graph
              in dependency order: entry points first, then everything whose
              upstream work has finished — so parallel branches light up
              together, and cycles get named instead of hanging.
            </p>
            <p className="text-[15px] leading-7 text-muted-foreground">
              The <strong className="text-foreground">load playground</strong>{" "}
              goes further. Give each node a capacity, replica count, latency and
              error rate, then set the offered traffic. Every node shows its
              utilisation, served rate and queue-inflated latency, and the panel
              names the bottleneck, the dropped traffic and the slowest path
              against your timeout budget. Change a number and the whole picture
              updates instantly.
            </p>
            <Button asChild variant="outline" size="sm" className="h-8 text-[13px]">
              <Link href="/docs/simulation">How simulation works</Link>
            </Button>
          </div>
        </section>

        {/* ---------------- AI ---------------- */}
        <section className="grid gap-8 border-b py-14 sm:py-20 md:grid-cols-[1fr_1.1fr] md:gap-10">
          <div>
            <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground/70">
              <Sparkles className="h-3.5 w-3.5" /> The assistant
            </div>
            <h2 className="mt-3 text-[26px] font-semibold tracking-tight">
              Useful because it can see the canvas
            </h2>
          </div>
          <div className="space-y-4">
            <p className="text-[15px] leading-7 text-muted-foreground">
              The assistant receives your current diagram as context, so
              &ldquo;review this&rdquo; and &ldquo;add a read replica&rdquo; mean
              something concrete. It answers in conversation, or returns a
              complete diagram you can apply.
            </p>
            <p className="text-[15px] leading-7 text-muted-foreground">
              Nothing is applied automatically: a generated design waits behind
              <em> Replace canvas</em>, <em>Add to canvas</em> or{" "}
              <em>Discard</em>. Output is validated before it can touch your work,
              and requests go straight from your browser to OpenAI, Gemini, Claude
              or Groq with your own key.
            </p>
            <Button asChild variant="outline" size="sm" className="h-8 text-[13px]">
              <Link href="/docs/ai-assistant">How the assistant works</Link>
            </Button>
          </div>
        </section>

        {/* ---------------- CONTRIBUTE ---------------- */}
        <section className="py-20">
          <div className="rounded-xl border bg-card p-6 sm:p-8">
            <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground/70">
              <GitPullRequest className="h-3.5 w-3.5" /> Contributing
            </div>
            <h2 className="mt-3 max-w-[34rem] text-[26px] font-semibold tracking-tight">
              Built by the community, and small enough to be approachable
            </h2>
            <p className="mt-3 max-w-[42rem] text-[15px] leading-7 text-muted-foreground">
              Adding a template or an icon is a single file. The canvas, the
              simulation engine and the provider client are where the interesting
              work is. Everything runs locally with{" "}
              <code className="rounded border bg-muted/60 px-1.5 py-0.5 font-mono text-[12.5px]">
                npm install &amp;&amp; npm run dev
              </code>
              .
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              <Button asChild size="sm" className="h-9 px-4 text-[13px]">
                <Link href="/docs/contributing">Contributor guide</Link>
              </Button>
              <Button asChild size="sm" variant="outline" className="h-9 px-4 text-[13px]">
                <Link href="https://github.com/Somilg11/nautilus" target="_blank" rel="noreferrer noopener">
                  GitHub <ArrowUpRight className="ml-1.5 h-3.5 w-3.5" />
                </Link>
              </Button>
              <Button asChild size="sm" variant="ghost" className="h-9 px-4 text-[13px] text-muted-foreground">
                <Link href="https://github.com/Somilg11/nautilus/issues" target="_blank" rel="noreferrer noopener">
                  Open an issue
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t">
        <div className="mx-auto flex max-w-[1100px] flex-wrap items-center gap-4 px-4 py-8 sm:px-5 text-[13px] text-muted-foreground">
          <span>Nautilus — MIT licensed</span>
          <Link href="/docs" className="hover:text-foreground">Docs</Link>
          <Link href="/dashboard" className="hover:text-foreground">Editor</Link>
          <Link
            href="https://github.com/Somilg11/nautilus"
            target="_blank"
            rel="noreferrer noopener"
            className="hover:text-foreground"
          >
            Source
          </Link>
        </div>
      </footer>
    </div>
  )
}
