import { Callout, CodeBlock, DocsPager, P, PageHeader, Section, Table } from "@/components/docs/ui"

export const metadata = { title: "Desktop app — Nautilus Docs" }

export default function DesktopPage() {
  return (
    <>
      <PageHeader
        eyebrow="Run it yourself"
        title="Desktop app"
        lead="Prefer a local app to a browser tab? Two ways to run Nautilus on your own machine, both offline after the first launch."
      />

      <Section title="One command">
        <CodeBlock code={`npx github:Somilg11/nautilus`} />
        <P>
          Builds the app if needed, starts a local server and opens your browser.
          Nothing is uploaded anywhere. Add <code>--port 4000</code> to change
          the port, or <code>--no-open</code> to skip the browser.
        </P>
      </Section>

      <Section title="Native window">
        <CodeBlock
          code={`git clone https://github.com/Somilg11/nautilus.git
cd nautilus
npm install

npm run desktop         # open in a native window
npm run desktop:build   # package a .dmg / .exe / AppImage`}
        />
        <P>
          The desktop build is an Electron shell around exactly the same
          application, so it never drifts from the web version. The renderer is
          sandboxed with no Node access and only ever loads the local server.
        </P>
      </Section>

      <Section title="Which one?">
        <Table
          head={["", "npx", "Electron"]}
          rows={[
            ["Install size", "Repo + node_modules", "Repo + Electron runtime"],
            ["Runs in", "Your browser", "A native window"],
            ["Best for", "Occasional local use", "Daily driver, app switcher, dock icon"],
            ["Packaged installer", "No", "Yes — dmg, nsis, AppImage"],
          ]}
        />
      </Section>

      <Callout title="Same data, different container">
        Both run the same app, but browser and desktop each keep their own local
        storage. Move work between them with Export/Import JSON.
      </Callout>

      <DocsPager href="/docs/desktop" />
    </>
  )
}
