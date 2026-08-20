"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import { ArrowLeft, ArrowRight, Check, Copy, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { NodeIcons } from "@/components/nodes/node-icons"
import { docsNeighbours } from "@/lib/docs-nav"

/* ------------------------------------------------------------------
   Shared documentation primitives.
   Kept in one file so every docs page renders with identical rhythm.
------------------------------------------------------------------- */

export function PageHeader({
  eyebrow,
  title,
  lead,
}: {
  eyebrow?: string
  title: string
  lead?: string
}) {
  return (
    <header className="space-y-3 border-b pb-8">
      {eyebrow && (
        <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground/70">
          {eyebrow}
        </div>
      )}
      <h1 className="text-[30px] font-semibold tracking-tight">{title}</h1>
      {lead && <p className="text-[15px] leading-7 text-muted-foreground">{lead}</p>}
    </header>
  )
}

export function Section({
  id,
  title,
  children,
}: {
  id?: string
  title?: string
  children: React.ReactNode
}) {
  return (
    <section id={id} className="scroll-mt-24 space-y-4">
      {title && <h2 className="text-[19px] font-semibold tracking-tight">{title}</h2>}
      {children}
    </section>
  )
}

export function P({
  children,
  className = "",
}: {
  children: React.ReactNode
  className?: string
}) {
  return <p className={`text-[14.5px] leading-7 text-muted-foreground ${className}`}>{children}</p>
}

export function Code({ children }: { children: React.ReactNode }) {
  return (
    <code className="rounded border bg-muted/60 px-1.5 py-0.5 font-mono text-[12.5px] text-foreground">
      {children}
    </code>
  )
}

export function List({ items }: { items: React.ReactNode[] }) {
  return (
    <ul className="space-y-2">
      {items.map((item, i) => (
        <li key={i} className="flex gap-3 text-[14.5px] leading-7 text-muted-foreground">
          <span className="mt-[11px] h-1 w-1 shrink-0 rounded-full bg-muted-foreground/50" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  )
}

export function Steps({ steps }: { steps: { title: string; body: React.ReactNode }[] }) {
  return (
    <ol className="space-y-5">
      {steps.map((s, i) => (
        <li key={s.title} className="flex gap-4">
          <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-md border bg-muted/50 text-[12px] font-medium">
            {i + 1}
          </span>
          <div className="space-y-1.5">
            <div className="text-[14px] font-medium">{s.title}</div>
            <div className="text-[14px] leading-6 text-muted-foreground">{s.body}</div>
          </div>
        </li>
      ))}
    </ol>
  )
}

export function Table({ head, rows }: { head: string[]; rows: React.ReactNode[][] }) {
  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full text-left text-[13.5px]">
        <thead className="border-b bg-muted/40 text-muted-foreground">
          <tr>
            {head.map((h) => (
              <th key={h} className="px-4 py-2.5 font-medium">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y">
          {rows.map((row, i) => (
            <tr key={i} className="align-top">
              {row.map((cell, j) => (
                <td
                  key={j}
                  className={`px-4 py-2.5 ${
                    j === 0 ? "whitespace-nowrap font-medium" : "text-muted-foreground"
                  }`}
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function Keys({ combo }: { combo: string[] }) {
  return (
    <span className="inline-flex items-center gap-1">
      {combo.map((k) => (
        <kbd
          key={k}
          className="rounded border bg-muted px-1.5 py-0.5 font-mono text-[11px] text-foreground"
        >
          {k}
        </kbd>
      ))}
    </span>
  )
}

export function Callout({
  title,
  children,
}: {
  title?: string
  children: React.ReactNode
}) {
  return (
    <div className="rounded-lg border-l-2 border-l-foreground/30 bg-muted/40 px-4 py-3">
      {title && <div className="mb-1 text-[13px] font-medium">{title}</div>}
      <div className="text-[13.5px] leading-6 text-muted-foreground">{children}</div>
    </div>
  )
}

export function CodeBlock({ code, caption }: { code: string; caption?: string }) {
  const [copied, setCopied] = useState(false)

  return (
    <div className="space-y-1.5">
      {caption && <div className="text-[12px] text-muted-foreground">{caption}</div>}
      <div className="group relative">
        <pre className="overflow-x-auto rounded-lg border bg-muted/40 p-4 font-mono text-[12.5px] leading-6">
          {code}
        </pre>
        <Button
          size="icon"
          variant="ghost"
          aria-label="Copy code"
          className="absolute right-2 top-2 h-7 w-7 opacity-0 transition-opacity focus-visible:opacity-100 group-hover:opacity-100"
          onClick={() => {
            navigator.clipboard.writeText(code)
            setCopied(true)
            setTimeout(() => setCopied(false), 1500)
          }}
        >
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
        </Button>
      </div>
    </div>
  )
}

export function Faq({ items }: { items: { q: string; a: string }[] }) {
  return (
    <div className="divide-y rounded-lg border">
      {items.map((item) => (
        <details key={item.q} className="group px-4 py-3">
          <summary className="cursor-pointer list-none text-[14px] font-medium marker:hidden">
            <span className="inline-flex w-full items-center justify-between gap-4">
              {item.q}
              <span className="text-muted-foreground transition-transform group-open:rotate-45">+</span>
            </span>
          </summary>
          <p className="pt-2 text-[13.5px] leading-6 text-muted-foreground">{item.a}</p>
        </details>
      ))}
    </div>
  )
}

export function CardLink({
  href,
  title,
  body,
  external,
}: {
  href: string
  title: string
  body: string
  external?: boolean
}) {
  return (
    <Link
      href={href}
      target={external ? "_blank" : undefined}
      rel={external ? "noreferrer noopener" : undefined}
      className="group block rounded-lg border bg-card p-4 transition-colors hover:bg-accent"
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-[14px] font-medium">{title}</span>
        <ArrowRight className="h-3.5 w-3.5 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
      </div>
      <p className="mt-1 text-[13px] leading-5 text-muted-foreground">{body}</p>
    </Link>
  )
}

/** Previous/next pager shown at the bottom of every docs page. */
export function DocsPager({ href }: { href: string }) {
  const { prev, next } = docsNeighbours(href)

  return (
    <nav className="grid gap-3 border-t pt-8 sm:grid-cols-2">
      {prev ? (
        <Link
          href={prev.href}
          className="group rounded-lg border p-3 transition-colors hover:bg-accent"
        >
          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <ArrowLeft className="h-3 w-3" /> Previous
          </div>
          <div className="mt-0.5 text-[14px] font-medium">{prev.label}</div>
        </Link>
      ) : (
        <span />
      )}

      {next && (
        <Link
          href={next.href}
          className="group rounded-lg border p-3 text-right transition-colors hover:bg-accent"
        >
          <div className="flex items-center justify-end gap-1.5 text-[11px] text-muted-foreground">
            Next <ArrowRight className="h-3 w-3" />
          </div>
          <div className="mt-0.5 text-[14px] font-medium">{next.label}</div>
        </Link>
      )}
    </nav>
  )
}

/* ------------------------------------------------------------------
   ICON GALLERY (reference page)
------------------------------------------------------------------- */
export function IconGallery() {
  const [query, setQuery] = useState("")
  const [copied, setCopied] = useState<string | null>(null)

  const keys = useMemo(() => {
    const all = Object.keys(NodeIcons).sort()
    const q = query.trim().toLowerCase()
    return q ? all.filter((k) => k.includes(q)) : all
  }, [query])

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={`Filter ${Object.keys(NodeIcons).length} icons…`}
          aria-label="Filter icons"
          className="h-9 w-full rounded-lg border bg-background pl-9 pr-3 text-[13px] outline-none transition-colors focus:border-foreground/30"
        />
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {keys.map((key) => (
          <button
            key={key}
            onClick={() => {
              navigator.clipboard.writeText(key)
              setCopied(key)
              setTimeout(() => setCopied(null), 1200)
            }}
            title={`Copy "${key}"`}
            className="flex items-center gap-2.5 rounded-lg border bg-card px-3 py-2.5 text-left transition-colors hover:bg-accent"
          >
            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-muted text-foreground">
              {NodeIcons[key]}
            </span>
            <code className="truncate font-mono text-[11.5px] text-muted-foreground">
              {copied === key ? "copied" : key}
            </code>
          </button>
        ))}
      </div>

      {keys.length === 0 && (
        <p className="py-6 text-center text-[13px] text-muted-foreground">
          No icon matches “{query}”.
        </p>
      )}
    </div>
  )
}
