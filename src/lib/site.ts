/**
 * Single source of truth for anything that needs the deployed origin:
 * canonical URLs, the sitemap, robots.txt and social card tags.
 * Override with NEXT_PUBLIC_SITE_URL when running on another domain.
 */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://nautilusss.vercel.app"
).replace(/\/$/, "")

export const SITE_NAME = "Nautilus"

export const SITE_DESCRIPTION =
  "Open-source canvas for designing, simulating and explaining software architecture. Runs entirely in your browser — no account, no backend, no lock-in."

export const SITE_KEYWORDS = [
  "system design",
  "architecture diagram",
  "software architecture",
  "system design tool",
  "load simulation",
  "flow simulation",
  "diagram editor",
  "open source",
  "self-hosted",
  "nautilus",
]

export const GITHUB_URL = "https://github.com/Somilg11/nautilus"

/** Absolute URL for a route, e.g. absoluteUrl("/docs"). */
export function absoluteUrl(pathname = "/") {
  return `${SITE_URL}${pathname === "/" ? "" : pathname}`
}
