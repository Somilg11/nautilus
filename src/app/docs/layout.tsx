"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import { ArrowUpRight, Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import NautilusMark from "@/components/nautilus-mark"
import { DOCS_NAV } from "@/lib/docs-nav"

/** Header height, kept in one place: the sidebar and drawer offset from it. */
const HEADER = "3.5rem"

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    if (!mobileOpen) return

    // Escape closes the drawer; the page behind stays frozen until it does.
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setMobileOpen(false)
    }

    // Freeze the page behind the drawer so touch scrolling stays inside it.
    const previous = document.body.style.overflow
    document.body.style.overflow = "hidden"
    window.addEventListener("keydown", onKey)

    return () => {
      document.body.style.overflow = previous
      window.removeEventListener("keydown", onKey)
    }
  }, [mobileOpen])

  const nav = (
    <nav className="space-y-6">
      {DOCS_NAV.map((group) => (
        <div key={group.group} className="space-y-0.5">
          <div className="px-2 pb-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground/70">
            {group.group}
          </div>
          {group.items.map((item) => {
            const active = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                // Harmless on desktop; on mobile it dismisses the drawer.
                onClick={() => setMobileOpen(false)}
                className={`block rounded-md px-2 py-1.5 text-[13px] transition-colors ${
                  active
                    ? "bg-muted font-medium text-foreground"
                    : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                }`}
              >
                {item.label}
              </Link>
            )
          })}
        </div>
      ))}
    </nav>
  )

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* ---------------- HEADER (fixed height, never grows) ---------------- */}
      <header className="sticky top-0 z-50 h-14 border-b bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-full max-w-[1400px] items-center gap-3 px-4 sm:px-5">
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 lg:hidden"
            aria-label={mobileOpen ? "Close navigation" : "Open navigation"}
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((v) => !v)}
          >
            {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </Button>

          <Link href="/" className="flex items-center gap-2 text-sm font-medium tracking-tight">
            <NautilusMark className="h-6 w-6" />
            <span className="hidden sm:inline">Nautilus</span>
          </Link>
          <span className="text-muted-foreground/40">/</span>
          <Link href="/docs" className="text-sm text-muted-foreground hover:text-foreground">
            Docs
          </Link>

          <div className="ml-auto flex items-center gap-1.5">
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

      {/* ----------------  MOBILE DRAWER  ----------------
          A fixed overlay rather than a block inside the header: growing a
          sticky header pushed the page around and left the nav sharing the
          document's scroll. This panel owns its own scroll region. */}
      {mobileOpen && (
        <>
          <div
            className="fixed inset-0 top-14 z-30 bg-black/40 lg:hidden"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />
          <div
            id="docs-mobile-nav"
            className="fixed inset-y-0 left-0 top-14 z-40 w-72 max-w-[85vw] overflow-y-auto overscroll-contain border-r bg-background px-4 py-5 lg:hidden"
          >
            {nav}
          </div>
        </>
      )}

      {/* ---------------- BODY ---------------- */}
      <div className="mx-auto max-w-[1400px] px-4 sm:px-5 lg:grid lg:grid-cols-[14rem_minmax(0,1fr)] lg:gap-12">
        {/*
          `self-start` is what makes `sticky` work here: as a stretched grid
          item the sidebar would be as tall as the article and never stick.
          Its own overflow + overscroll-contain keep its scrolling separate
          from the page.
        */}
        <aside
          className="sticky hidden self-start overflow-y-auto overscroll-contain py-10 lg:block"
          style={{ top: HEADER, maxHeight: `calc(100dvh - ${HEADER})` }}
        >
          {nav}
        </aside>

        <main className="min-w-0 py-10 sm:py-12">
          <article className="max-w-[46rem] space-y-8 pb-24 sm:space-y-10">{children}</article>
        </main>
      </div>
    </div>
  )
}
