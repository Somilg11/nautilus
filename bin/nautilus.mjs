#!/usr/bin/env node
/**
 * Nautilus launcher.
 *
 * Starts the app locally and opens it in the browser — no account, no cloud,
 * nothing uploaded. Everything stays on this machine.
 *
 *   npx github:Somilg11/nautilus
 *   nautilus --port 4000 --no-open
 */
import { startServer, openBrowser } from "./server.mjs"

const args = process.argv.slice(2)

if (args.includes("--help") || args.includes("-h")) {
  console.log(`Nautilus — open-source system design canvas

Usage:
  nautilus [options]

Options:
  -p, --port <number>   Port to listen on (default: 3000)
      --host <host>     Host to bind (default: 127.0.0.1)
      --no-open         Don't open a browser window
  -h, --help            Show this help
`)
  process.exit(0)
}

function flag(names, fallback) {
  for (const name of names) {
    const i = args.indexOf(name)
    if (i !== -1 && args[i + 1]) return args[i + 1]
  }
  return fallback
}

const port = Number(flag(["-p", "--port"], process.env.PORT ?? 3000))
const host = flag(["--host"], "127.0.0.1")

try {
  const { url, child } = await startServer({ port, host })

  console.log(`\n  Nautilus is running at ${url}\n  Press Ctrl+C to stop.\n`)
  if (!args.includes("--no-open")) openBrowser(url)

  const shutdown = () => {
    child.kill("SIGTERM")
    process.exit(0)
  }
  process.on("SIGINT", shutdown)
  process.on("SIGTERM", shutdown)
} catch (err) {
  console.error(`\nNautilus failed to start: ${err.message}\n`)
  process.exit(1)
}
