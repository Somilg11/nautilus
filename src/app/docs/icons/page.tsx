import { Code, DocsPager, IconGallery, P, PageHeader, Section } from "@/components/docs/ui"

export const metadata = {
  title: "Icon reference — Nautilus Docs",
  description:
    "Reference of every icon key available to Nautilus nodes, grouped by the component category it belongs to.",
  alternates: { canonical: "/docs/icons" },
  openGraph: {
    title: "Icon reference — Nautilus Docs",
    description:
      "Reference of every icon key available to Nautilus nodes, grouped by the component category it belongs to.",
    url: "/docs/icons",
    type: "article",
  },
}

export default function IconsPage() {
  return (
    <>
      <PageHeader
        eyebrow="Reference"
        title="Icon reference"
        lead="Every key below is valid in a node's data.icon field, in templates, and in AI-generated diagrams."
      />

      <Section>
        <P>
          Click a tile to copy its key. Missing something?{" "}
          <Code>src/components/nodes/node-icons.tsx</Code> is a two-line change —
          see <Code>/docs/add-icon</Code>.
        </P>
        <IconGallery />
      </Section>

      <DocsPager href="/docs/icons" />
    </>
  )
}
