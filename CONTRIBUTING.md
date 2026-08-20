# Contributing to Nautilus

Thanks for wanting to help. Nautilus is a small codebase with a wide surface, so
most contributions are genuinely approachable — a new icon, a new template, a
bug fix in the canvas, a docs correction.

- [Ways to contribute](#ways-to-contribute)
- [Local setup](#local-setup)
- [Project layout](#project-layout)
- [Development workflow](#development-workflow)
- [Adding a template](#adding-a-template)
- [Adding a component icon](#adding-a-component-icon)
- [Working on the canvas](#working-on-the-canvas)
- [Working on the simulation](#working-on-the-simulation)
- [Working on AI providers](#working-on-ai-providers)
- [Coding conventions](#coding-conventions)
- [Commit and PR conventions](#commit-and-pr-conventions)
- [Reporting bugs](#reporting-bugs)

---

## Ways to contribute

| Type | Difficulty | Where |
| --- | --- | --- |
| Architecture templates (Netflix, Kafka, CQRS…) | 🟢 easy | `src/lib/templates/` |
| Component icons | 🟢 easy | `src/components/nodes/node-icons.tsx` |
| Docs (this file, `docs/`, `/docs` site) | 🟢 easy | `docs/`, `src/app/docs/` |
| Desktop packaging | 🟡 medium | `bin/`, `desktop/` |
| UI polish, dark-mode fixes, a11y | 🟡 medium | `src/components/` |
| Canvas behaviour (grouping, alignment, edges) | 🟡 medium | `src/components/canvas.tsx` |
| Simulation engines | 🔴 involved | `src/lib/flow-execution.ts`, `src/lib/simulation-model.ts`, `src/lib/use-simulation.ts` |
| New AI provider | 🔴 involved | `src/lib/ai-client.ts` |

Small PRs get reviewed fastest. If a change is large or changes the data format
(`nodes` / `edges` JSON), open an issue first so we can agree on the shape.

---

## Local setup

Requirements: **Node.js 20+** and npm.

```bash
git clone https://github.com/Somilg11/nautilus.git
cd nautilus
npm install
npm run dev          # http://localhost:3000
```

No environment variables and no backend are needed. AI features are optional and
use a key you paste into the app's Settings panel at runtime.

### Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Dev server with hot reload |
| `npm run build` | Production build (also type-checks) |
| `npm start` | Serve the production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | Unit tests (Vitest, single run) |
| `npm run test:watch` | Unit tests in watch mode |
| `npm run start:app` | Run the launcher the way `npx` users get it |
| `npm run desktop` | Open the app in an Electron window |
| `npm run desktop:build` | Package desktop installers |

Before opening a PR, all four of `lint`, `typecheck`, `test`, and `build` should
pass. CI runs exactly those.

---

## Project layout

```
src/
├── app/
│   ├── page.tsx              # Landing page
│   ├── dashboard/            # The editor (toolbar + sidebars + canvas)
│   ├── docs/                 # In-app docs site (layout.tsx + one route per page)
│   └── about/
├── components/
│   ├── canvas.tsx            # React Flow wrapper: drag/drop, selection,
│   │                         # copy/paste, grouping, align, simulation glue
│   ├── toolbar.tsx           # Top bar: import/export/share/run/undo/redo
│   ├── editing-tools.tsx     # Second bar: dispatches `nautilus-*` events
│   ├── left-sidebar.tsx      # Component palette (drag source)
│   ├── right-sidebar.tsx     # Node properties, AI chat, API-key settings
│   ├── simulation-panel.tsx  # Trace / load / ramp controls
│   ├── ramp-chart.tsx        # Inline SVG load-ramp curve
│   ├── nodes/                # NautilusNode, GroupNode, icon registry
│   └── edges/                # DeletableEdge
├── lib/
│   ├── flow-context.tsx      # Canvas state, undo/redo, autosave, share links
│   ├── flow-execution.ts     # Layered execution planner (pure, tested)
│   ├── simulation-model.ts   # Load/capacity model (pure, tested)
│   ├── use-simulation.ts     # Run/pause/step state machine
│   ├── auto-layout.ts        # Dependency-layered layout for AI output
│   ├── diagram-io.ts         # Validation for untrusted diagram JSON
│   ├── ai-client.ts          # Browser-side provider calls
│   └── templates/            # Built-in architecture templates
└── styles/canvas.css         # Canvas + simulation styling
```

### How components talk to each other

Toolbar buttons do **not** call canvas functions directly — they dispatch
`CustomEvent`s on `window`, and the canvas listens:

| Event | Handled in | Notes |
| --- | --- | --- |
| `nautilus-copy` / `-paste` / `-duplicate` / `-delete` | `canvas.tsx` | |
| `nautilus-group` / `-ungroup` | `canvas.tsx` | Real React Flow parent nodes |
| `nautilus-align-left` / `-center` / `-right` / `-distribute-h` | `canvas.tsx` | Uses measured node widths |
| `nautilus-zoom-in` / `-zoom-out` / `-fit-view` | `canvas.tsx` | |
| `nautilus-delete-edge` | `canvas.tsx` | Dispatched by `DeletableEdge` |
| `nautilus-import` | `flow-context.tsx` (state) + `canvas.tsx` (fit view) | Payload is validated |
| `nautilus-run` / `nautilus-run-stop` | `canvas.tsx` | Starts/stops the trace simulation |
| `nautilus-load-toggle` | `canvas.tsx` | Opens/closes the load playground |
| `nautilus-run-state` | `toolbar.tsx` | Canvas broadcasts trace status + playground state |
| `nautilus-load-report` | `right-sidebar.tsx` | Canvas broadcasts the latest load metrics |

**Each event must have exactly one owner.** Binding the same event in both the
canvas and the provider is a bug we have already had once: every paste inserted
two copies and grouping used two different models at the same time.

---

## Development workflow

1. Fork, then branch from `main`: `git checkout -b feat/kafka-template`.
2. Make the change. Keep it focused.
3. `npm run lint && npm run typecheck && npm test && npm run build`.
4. Push and open a PR against `main` using the PR template.

---

## Adding a template

Templates live in `src/lib/templates/` (put large, real-world systems in
`src/lib/templates/big/`).

1. Create `src/lib/templates/big/my-system.ts`:

```ts
import { MarkerType } from "reactflow"

export const MySystemTemplate = {
  id: "my-system",
  name: "My System",
  description: "One line describing what this architecture shows.",
  nodes: [
    {
      id: "client",
      type: "nautilusNode",
      position: { x: 0, y: 0 },
      data: {
        label: "Mobile Client",
        icon: "client_mobile",     // must exist in node-icons.tsx
        color: "blue",             // default | blue | green | red | yellow | purple | orange
        description: "iOS / Android app",
        sim: { latencyMs: 5 },     // clients are traffic sources: no capacity
      },
    },
    {
      id: "api",
      type: "nautilusNode",
      position: { x: 0, y: 160 },
      data: {
        label: "API",
        icon: "api_server",
        color: "green",
        description: "Public REST surface",
        // Per-replica capacity, not aggregate — scale with replicas.
        sim: { capacity: 4000, replicas: 6, latencyMs: 25, errorRate: 0.001 },
      },
    },
  ],
  edges: [
    {
      id: "e-client-api",
      source: "client",
      target: "api",
      type: "deletableEdge",
      markerEnd: { type: MarkerType.Arrow },
      // Optional routing model for the load playground.
      data: { sim: { share: 1, fanout: 1 } },
    },
  ],
}
```

2. Register it in `src/lib/templates/index.ts`.
3. Check it in the app: **Templates** in the toolbar, then press **Run** — the
   simulation is a quick sanity check that the graph flows the way you intended.

Template guidelines:

- Lay out top-to-bottom, clients at the top, storage at the bottom.
- Give every node a `description`; it is what makes a template teach something.
- Colour by role: clients blue, compute green, storage red, messaging yellow.
- Avoid cycles unless the architecture genuinely has one.
- Give every service a capacity model, and check the template serves its rated
  load without dropping traffic — `src/lib/__tests__/templates.test.ts` enforces
  this for every built-in template.

## Adding a component icon

Add an entry to `NodeIcons` in `src/components/nodes/node-icons.tsx` keyed by a
stable snake_case id (`kafka`, `redis_cache`, `s3_bucket`). Use an icon from
`lucide-react` or `react-icons`, sized `h-4 w-4`. Then reference that id as the
node's `data.icon` and, if it should be draggable, add it to the palette in
`src/components/left-sidebar.tsx`.

Keep icon ids in sync with `FLOW_SCHEMA` in `src/lib/ai-schema.ts` if you want
the AI to be able to use them.

## Working on the canvas

- The canvas is [React Flow v11](https://reactflow.dev) (`reactflow` package).
  Do not reintroduce `react-flow-renderer` — it is the unmaintained v10 package
  and it pins React to 18.
- `reactflow/dist/style.css` must stay imported in `canvas.tsx`; v11 does not
  inject its styles.
- Node state is the source of truth for the document. Anything transient
  (hover, run marks, drag previews) must be merged at render time, never written
  into node state — persisted state ends up in undo history, autosave, exported
  JSON and share links.

## Working on the simulation

`src/lib/flow-execution.ts` is pure and unit-tested — it takes nodes and edges
and returns a layered `ExecutionPlan`:

```ts
const plan = computeExecutionPlan(nodes, edges)
// plan.steps      -> [{ nodes: ["client"], edges: [] }, { nodes: ["api-a","api-b"], edges: ["e1","e2"] }, …]
// plan.entryPoints / exitPoints / cyclicNodes / isolatedNodes / danglingEdges
```

Rules it must keep:

- Independent branches share a step (parallel paths animate together).
- A node runs only after **every** node feeding it has run.
- Cycles are reported, never hung on — remaining nodes become one final step.
- Group nodes and edges pointing at missing nodes are excluded, not fatal.

Add a test in `src/lib/__tests__/flow-execution.test.ts` for any behaviour you
change. `use-simulation.ts` owns playback (play/pause/step/speed) and hands the
canvas two `Map`s of render-time marks.

## Working on AI providers

`src/lib/ai-client.ts` calls provider APIs **directly from the browser** with a
key the user supplies. When adding a provider:

1. Add it to `AIProvider` and `DEFAULT_MODELS`.
2. Add the request branch, using `postJSON` so it inherits the timeout and error
   handling.
3. Add the provider's API host to `connect-src` in `next.config.ts` — the CSP
   will otherwise block the request.
4. Add the key field and icon in `src/components/right-sidebar.tsx`.

Model output is untrusted: it goes through `sanitizeDiagram()` before it reaches
the canvas. Keep it that way.

---

## Coding conventions

- TypeScript, functional components, `"use client"` where browser APIs are used.
- Tailwind for styling; shadcn/ui primitives live in `src/components/ui/` and
  should be used rather than hand-rolled.
- Comment the *why*, not the *what*. Prefer one sentence explaining a non-obvious
  constraint over a paragraph restating the code.
- Match the surrounding style; don't reformat files you're not changing.
- Prefer `toast` (sonner) over `alert()` for user feedback.

## Commit and PR conventions

Conventional Commits:

```
feat: add Kafka streaming template
fix: stop paste from inserting two copies
docs: document simulation controls
refactor: extract execution planner from canvas
test: cover cyclic graphs in the planner
chore: bump next to 16.3.1
```

A good PR description says what changed, why, and how you verified it. Include a
screenshot or short clip for anything visual.

## Reporting bugs

Open an issue with: what you did, what happened, what you expected, browser and
OS, and — if the canvas is involved — the exported JSON (toolbar ▸ Export) so the
diagram can be reproduced exactly.

Security issues: please follow [SECURITY.md](SECURITY.md) instead of filing a
public issue.
