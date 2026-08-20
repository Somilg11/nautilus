import { Callout, Code, CodeBlock, DocsPager, List, P, PageHeader, Section, Table } from "@/components/docs/ui"

export const metadata = { title: "Self-hosting — Nautilus Docs" }

export default function SelfHostingPage() {
  return (
    <>
      <PageHeader
        eyebrow="Run it yourself"
        title="Self-hosting"
        lead="No database, no environment variables, no background jobs. Node 20+ is the only requirement."
      />

      <Section title="Run it locally">
        <CodeBlock
          code={`git clone https://github.com/Somilg11/nautilus.git
cd nautilus
npm install
npm run build
npm start          # http://localhost:3000`}
        />
      </Section>

      <Section title="Deploy it">
        <Table
          head={["Target", "How"]}
          rows={[
            ["Vercel", "Import the repo; the default Next.js preset is correct. No environment variables."],
            ["Any Node host", "npm ci && npm run build && npm start, behind nginx or Caddy for TLS."],
            [
              "Static CDN",
              <span key="static-cdn">
                Set <Code>output: &quot;export&quot;</Code>, build, and serve <Code>out/</Code>.
              </span>,
            ],
            ["Docker", "A working Dockerfile is in docs/SELF_HOSTING.md."],
          ]}
        />
      </Section>

      <Section title="Security notes for operators">
        <List
          items={[
            "Serve over HTTPS — the app sends Strict-Transport-Security on every response.",
            "Don't strip the app's response headers at your proxy. The Content-Security-Policy is what stops an injected script from reading visitors' API keys.",
            "A static export cannot send those headers — re-create them at the CDN layer, copying the policy from next.config.ts verbatim.",
            "Adding an analytics or embed script means adding its host to connect-src / script-src. Add the specific host, never a wildcard.",
          ]}
        />
        <Callout title="Deploying for a team?">
          Consider removing the provider hosts from <Code>connect-src</Code> and
          hiding the Keys tab, so API keys are never entered on a shared origin
          in the first place.
        </Callout>
      </Section>

      <Section title="Upgrading">
        <CodeBlock code={`git pull origin main
npm install
npm run build`} />
        <P>
          Saved diagrams are forward-compatible: unknown fields are dropped on
          load rather than breaking the canvas, and exported JSON from any
          version imports cleanly.
        </P>
      </Section>

      <DocsPager href="/docs/self-hosting" />
    </>
  )
}
