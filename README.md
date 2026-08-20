<div align="center">

# Nautilus 🐚

**An open-source canvas for designing, simulating and explaining software architecture.**

No accounts. No backend. No lock-in.

[Editor](https://github.com/Somilg11/nautilus) · [Docs](/docs) · [Contributing](CONTRIBUTING.md) · [Self-hosting](docs/SELF_HOSTING.md) · [Security](SECURITY.md)

</div>

---

Nautilus is a browser-only tool for system design. A diagram is a real directed
graph, which is what makes the rest possible: the simulator can walk it, the AI
assistant can reason about it, and the exported JSON is something you can diff in
a pull request.

Your diagrams live in your browser and in the files you export. AI features use a
key you supply and talk straight to the provider. That is what keeps Nautilus
genuinely free and trivial to self-host.

## Features

| | |
| --- | --- |
| **Flow simulation** | Watch data traverse the architecture step by step. Parallel branches light up together; cycles, dangling edges and isolated nodes are reported instead of failing silently. Play, pause, step and 0.5×–4× speed. |
| **Load playground** | Give nodes capacity, replicas, latency, error rates and a price, then push traffic through. Live utilisation, queue-inflated p95 latency, dropped traffic, queue backlog and ranked bottlenecks. |
| **Capacity & cost** | Replica counts sized to a target utilisation (`Payment Service 8 → 90`), the monthly bill that implies, and cost per million requests. Apply a suggestion with one click. |
| **Load ramp** | Sweep from zero and plot offered vs delivered — the knee is where the design gives out, and the panel names the load where p95 first breaches your budget. |
| **Failure injection** | Take a node out and watch what survives, where traffic lands and what the success rate becomes. Pin a baseline to see every change as a delta. |
| **Component library** | Hundreds of searchable cloud, database, messaging, auth and DevOps icons, drag-and-drop onto the canvas. |
| **Templates** | Netflix, Uber, WhatsApp, Instagram, YouTube, Spotify, Zomato, three-tier and microservices, ready to load and edit. |
| **AI assistant** | Bring your own OpenAI, Gemini, Claude or Groq key. It sees your canvas, so it can design, extend, review or explain — and nothing is applied without your say-so. |
| **Editing tools** | Group, ungroup, align, distribute, copy/paste, duplicate, nudge, undo/redo, plus keyboard shortcuts. |
| **Sharing** | JSON export/import, PNG export, self-contained share links, and a Markdown capacity report for design docs and PRs. |
| **Runs anywhere** | Vercel, any Node host, a static CDN, one `npx` command, or a packaged desktop app. |
| **Private by default** | The app makes no network calls of its own. No telemetry, no accounts, no server-side storage. |

## Getting started

```bash
git clone https://github.com/Somilg11/nautilus.git
cd nautilus
npm install
npm run dev          # http://localhost:3000
```

Requires **Node.js 20+**. There are no environment variables to set.

### Run it as a local app

```bash
npx github:Somilg11/nautilus     # starts the app and opens your browser
```

### Run it in a native window

```bash
npm run desktop                  # Electron shell around the same app
npm run desktop:build            # package a .dmg / .exe / AppImage
```

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Dev server with hot reload |
| `npm run build` | Production build (type-checks too) |
| `npm start` | Serve the production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | Unit tests (Vitest) |
| `npm run desktop` | Run the desktop shell |
| `npm run desktop:build` | Package desktop installers |

## Documentation

| Guide | For |
| --- | --- |
| [`/docs`](src/app/docs) | The in-app documentation site |
| [`docs/FEATURES.md`](docs/FEATURES.md) | Every feature, how to reach it, and its limits |
| [`docs/SELF_HOSTING.md`](docs/SELF_HOSTING.md) | Deployment, Docker, static export, operator security notes |
| [`CONTRIBUTING.md`](CONTRIBUTING.md) | Repo layout, conventions, how to add templates and icons |
| [`SECURITY.md`](SECURITY.md) | Threat model and how to report a vulnerability |

## Tech stack

Next.js 16 · React 19 · TypeScript · React Flow 11 · Tailwind CSS 4 · shadcn/ui ·
Vitest · Electron (optional desktop build)

## Contributing

Contributions are welcome, and templates and icons are genuinely easy first
pull requests — each is a single file. Start with
[CONTRIBUTING.md](CONTRIBUTING.md), or open an issue if you want to discuss a
change first.

Before opening a PR:

```bash
npm run lint && npm run typecheck && npm test && npm run build
```

## Security

Nautilus stores API keys in the browser, so anything that can execute script on
its origin is a key-disclosure bug. The app ships a strict Content-Security-Policy
and validates every externally-sourced diagram. Please report vulnerabilities
privately — see [SECURITY.md](SECURITY.md).

## License

MIT — see [LICENSE](LICENSE).

---

<div align="center">

Built by the open-source community.

</div>
