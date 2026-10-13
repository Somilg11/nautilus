#!/usr/bin/env node
/**
 * Replace `'unsafe-inline'` in the production script-src with the hashes of
 * the inline scripts Next.js actually emitted.
 *
 * Next.js bootstraps every page with a few inline scripts, so a policy has to
 * allow them somehow. A nonce would do it, but a nonce needs a fresh value per
 * request, which means rendering every page on a server — and Nautilus is
 * deliberately static files and nothing else. Hashes need no server: every
 * page is prerendered, so its inline scripts are known once the build is done.
 *
 * Runs after `next build`. It hashes every inline script in the prerendered
 * HTML and rewrites the Content-Security-Policy header in
 * `.next/routes-manifest.json`, which is what `next start` and hosting
 * platforms serve headers from.
 *
 * This is hardening, never a reason to fail a deploy. Build output is laid out
 * differently on some hosts, so whenever the script cannot find what it
 * expects it says what it saw and exits cleanly; the build then keeps the
 * looser `'unsafe-inline'` policy from next.config.ts, which always works.
 */
import { createHash } from "node:crypto"
import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const APP_DIR = path.join(ROOT, ".next", "server", "app")
const MANIFEST = path.join(ROOT, ".next", "routes-manifest.json")

const INLINE_SCRIPT = /<script(?![^>]*\ssrc=)[^>]*>([\s\S]*?)<\/script>/g
const SCRIPT_SRC = /script-src [^;]*/

/** Leave the policy as next.config.ts wrote it, and say why. */
function skip(message) {
  console.warn(`csp-hashes: ${message} Keeping the default policy ('unsafe-inline').`)
  process.exit(0)
}

/** What the build output looks like, for diagnosing a host that differs. */
function describe(dir) {
  const counts = {}
  const walk = (current, depth) => {
    if (depth > 6) return
    for (const name of readdirSync(current)) {
      const file = path.join(current, name)
      if (statSync(file).isDirectory()) walk(file, depth + 1)
      else counts[path.extname(name) || "(none)"] = (counts[path.extname(name) || "(none)"] ?? 0) + 1
    }
  }
  walk(dir, 0)
  return JSON.stringify(counts)
}

function htmlFiles(dir) {
  return readdirSync(dir).flatMap((name) => {
    const file = path.join(dir, name)
    if (statSync(file).isDirectory()) return htmlFiles(file)
    return name.endsWith(".html") ? [file] : []
  })
}

process.on("uncaughtException", (err) => skip(`unexpected error (${err.message}).`))

if (!existsSync(APP_DIR) || !existsSync(MANIFEST)) {
  skip(
    `no build output where expected (app dir: ${existsSync(APP_DIR)}, routes manifest: ${existsSync(MANIFEST)}).`
  )
}

const hashes = new Set()
const pages = htmlFiles(APP_DIR)

for (const file of pages) {
  const html = readFileSync(file, "utf8")
  for (const [, body] of html.matchAll(INLINE_SCRIPT)) {
    if (body.length === 0) continue
    hashes.add(`'sha256-${createHash("sha256").update(body).digest("base64")}'`)
  }
}

if (pages.length === 0 || hashes.size === 0) {
  skip(
    `found ${pages.length} prerendered page(s) and ${hashes.size} inline script(s) in .next/server/app ` +
      `(files by type: ${describe(APP_DIR)}).`
  )
}

const manifest = JSON.parse(readFileSync(MANIFEST, "utf8"))
const scriptSrc = `script-src 'self' ${[...hashes].sort().join(" ")}`
let patched = 0

for (const rule of manifest.headers ?? []) {
  for (const header of rule.headers ?? []) {
    if (header.key.toLowerCase() !== "content-security-policy") continue
    if (!SCRIPT_SRC.test(header.value)) continue
    header.value = header.value.replace(SCRIPT_SRC, scriptSrc)
    patched += 1
  }
}

if (patched === 0) {
  skip("no Content-Security-Policy header with a script-src directive in the routes manifest.")
}

writeFileSync(MANIFEST, JSON.stringify(manifest))
console.log(
  `csp-hashes: script-src now allows ${hashes.size} inline script hash(es) from ${pages.length} page(s); 'unsafe-inline' removed.`
)
