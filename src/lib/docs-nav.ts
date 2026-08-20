/**
 * Documentation navigation.
 *
 * Single source of truth for the sidebar, the previous/next footer links and
 * the docs index — adding a page means adding one entry here.
 */
export type DocsPage = {
  href: string
  label: string
  summary: string
}

export type DocsGroup = {
  group: string
  items: DocsPage[]
}

export const DOCS_NAV: DocsGroup[] = [
  {
    group: "Getting started",
    items: [
      {
        href: "/docs",
        label: "Introduction",
        summary: "What Nautilus is, and what it deliberately isn't.",
      },
      {
        href: "/docs/quick-start",
        label: "Quick start",
        summary: "From an empty canvas to a running simulation in five steps.",
      },
      {
        href: "/docs/interface",
        label: "The interface",
        summary: "Every region of the editor and what it controls.",
      },
    ],
  },
  {
    group: "Editing",
    items: [
      {
        href: "/docs/building",
        label: "Building a diagram",
        summary: "Nodes, edges, descriptions and the colour convention.",
      },
      {
        href: "/docs/tools",
        label: "Editing tools",
        summary: "Copy, group, align, distribute and the rest of the bar.",
      },
      {
        href: "/docs/shortcuts",
        label: "Keyboard shortcuts",
        summary: "Everything you can do without touching the mouse.",
      },
    ],
  },
  {
    group: "Features",
    items: [
      {
        href: "/docs/simulation",
        label: "Flow simulation",
        summary: "Watch data traverse the architecture, step by step.",
      },
      {
        href: "/docs/templates",
        label: "Templates",
        summary: "Production-grade architectures you can load and edit.",
      },
      {
        href: "/docs/ai-assistant",
        label: "AI assistant",
        summary: "Bring your own key; design, extend and review diagrams.",
      },
      {
        href: "/docs/sharing",
        label: "Sharing & export",
        summary: "Autosave, JSON, share links and PNG export.",
      },
    ],
  },
  {
    group: "Run it yourself",
    items: [
      {
        href: "/docs/self-hosting",
        label: "Self-hosting",
        summary: "Deploy Nautilus anywhere that runs Node 20.",
      },
      {
        href: "/docs/desktop",
        label: "Desktop app",
        summary: "One command, or a packaged native window.",
      },
    ],
  },
  {
    group: "Contributing",
    items: [
      {
        href: "/docs/contributing",
        label: "How to contribute",
        summary: "Set up the repo, find your first issue, open a PR.",
      },
      {
        href: "/docs/add-template",
        label: "Add a template",
        summary: "Ship a new architecture in one file.",
      },
      {
        href: "/docs/add-icon",
        label: "Add an icon",
        summary: "Extend the component library.",
      },
    ],
  },
  {
    group: "Reference",
    items: [
      {
        href: "/docs/icons",
        label: "Icon reference",
        summary: "Every icon key usable in node data.",
      },
      { href: "/docs/faq", label: "FAQ", summary: "Short answers to the common questions." },
    ],
  },
]

export const DOCS_PAGES: DocsPage[] = DOCS_NAV.flatMap((g) => g.items)

/** Previous/next neighbours for the footer pager. */
export function docsNeighbours(href: string) {
  const i = DOCS_PAGES.findIndex((p) => p.href === href)
  return {
    prev: i > 0 ? DOCS_PAGES[i - 1] : null,
    next: i !== -1 && i < DOCS_PAGES.length - 1 ? DOCS_PAGES[i + 1] : null,
  }
}
