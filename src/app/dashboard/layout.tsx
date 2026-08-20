import type { Metadata } from "next"

/**
 * The editor is a client component, so its metadata lives here. It is kept out
 * of search results deliberately: there is nothing crawlable on the canvas and
 * every diagram lives in the visitor's own browser.
 */
export const metadata: Metadata = {
  title: "Editor — Nautilus",
  description:
    "The Nautilus canvas: drag in components, connect them, describe them and simulate the flow. Everything stays in your browser.",
  alternates: { canonical: "/dashboard" },
  robots: { index: false, follow: true },
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
