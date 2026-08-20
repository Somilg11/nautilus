import type { MetadataRoute } from "next"
import { DOCS_NAV } from "@/lib/docs-nav"
import { absoluteUrl } from "@/lib/site"

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date()

  const docs = DOCS_NAV.flatMap((group) => group.items).map((page) => ({
    url: absoluteUrl(page.href),
    lastModified,
    changeFrequency: "monthly" as const,
    priority: page.href === "/docs" ? 0.8 : 0.6,
  }))

  return [
    { url: absoluteUrl("/"), lastModified, changeFrequency: "weekly", priority: 1 },
    { url: absoluteUrl("/about"), lastModified, changeFrequency: "monthly", priority: 0.7 },
    ...docs,
  ]
}
