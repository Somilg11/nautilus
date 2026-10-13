import { spawn } from "node:child_process"
import { existsSync } from "node:fs"
import net from "node:net"
import path from "node:path"
import { fileURLToPath } from "node:url"

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")

const NEXT_BIN = path.join(ROOT, "node_modules", "next", "dist", "bin", "next")

/** Run a command in the project root and resolve when it exits cleanly. */
function run(args, label) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [NEXT_BIN, ...args], {
      cwd: ROOT,
      stdio: "inherit",
    })
    child.on("error", reject)
    child.on("exit", (code) =>
      code === 0 ? resolve() : reject(new Error(`${label} exited with code ${code}`))
    )
  })
}

/** Build the app if it has not been built yet. */
export async function ensureBuild() {
  if (existsSync(path.join(ROOT, ".next", "BUILD_ID"))) return
  console.log("Nautilus: no production build found, building once…")
  await run(["build"], "next build")
  await tightenPolicy()
}

/** Same post-build step as `npm run build`: pin script-src to hashes. */
function tightenPolicy() {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, [path.join(ROOT, "scripts", "csp-hashes.mjs")], {
      cwd: ROOT,
      stdio: "inherit",
    })
    // The build still works with the default policy, so never block startup.
    child.on("error", () => resolve())
    child.on("exit", () => resolve())
  })
}

/** True when nothing is listening on the port yet. */
function isPortFree(port, host) {
  return new Promise((resolve) => {
    const tester = net
      .createServer()
      .once("error", () => resolve(false))
      .once("listening", () => tester.close(() => resolve(true)))
      .listen(port, host)
  })
}

/**
 * First free port at or after `start`. Without this, launching a second
 * window (or having a dev server open) fails with EADDRINUSE.
 */
export async function findFreePort(start, host = "127.0.0.1", attempts = 20) {
  for (let port = start; port < start + attempts; port++) {
    if (await isPortFree(port, host)) return port
  }
  throw new Error(`No free port between ${start} and ${start + attempts}`)
}

async function waitForServer(url, timeoutMs = 60_000) {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    try {
      const res = await fetch(url, { method: "HEAD" })
      if (res.ok || res.status < 500) return
    } catch {
      // server not up yet
    }
    await new Promise((r) => setTimeout(r, 250))
  }
  throw new Error(`Server did not become ready at ${url}`)
}

/**
 * Start the Next.js production server.
 * Resolves with { url, child } once the server answers.
 */
export async function startServer({ port = 3000, host = "127.0.0.1", autoPort = true } = {}) {
  await ensureBuild()

  const finalPort = autoPort ? await findFreePort(port, host) : port
  if (finalPort !== port) {
    console.log(`Nautilus: port ${port} is busy, using ${finalPort} instead.`)
  }

  const child = spawn(
    process.execPath,
    [NEXT_BIN, "start", "-p", String(finalPort), "-H", host],
    {
      cwd: ROOT,
      stdio: "inherit",
      env: { ...process.env, NODE_ENV: "production" },
    }
  )

  const url = `http://${host}:${finalPort}`

  try {
    await waitForServer(url)
  } catch (err) {
    child.kill("SIGTERM")
    throw err
  }

  // Never leave an orphaned server behind if the parent dies.
  const cleanup = () => child.kill("SIGTERM")
  process.once("exit", cleanup)
  process.once("SIGINT", cleanup)
  process.once("SIGTERM", cleanup)

  return { url, port: finalPort, child }
}

/** Open a URL in the user's default browser, cross-platform. */
export function openBrowser(url) {
  const cmd =
    process.platform === "darwin" ? "open" : process.platform === "win32" ? "start" : "xdg-open"
  const args = process.platform === "win32" ? ["/c", "start", "", url] : [url]
  const bin = process.platform === "win32" ? "cmd" : cmd
  spawn(bin, args, { stdio: "ignore", detached: true }).unref()
}
