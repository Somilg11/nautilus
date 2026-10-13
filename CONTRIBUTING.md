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
| Request model and simulators | 🔴 involved | `src/lib/flow-ops.ts`, `src/lib/simulation-model.ts`, `src/lib/sim-engine.ts` |
| New AI provider | 🔴 involved | `src/lib/ai-client.ts` |

Small PRs get reviewed fastest. If a change is large or changes the data format
(`nodes` / `edges` JSON), open an issue first so we can agree on the shape.

[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) explains how the pieces fit
together and is worth ten minutes before touching the canvas or the simulators.

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
│   ├── edge-inspector.tsx    # Connection properties: operation, endpoint, timing
│   ├── simulation-panel.tsx  # Trace / Load / Ramp / Calls tabs
│   ├── ramp-chart.tsx        # Inline SVG load-ramp curve
│   ├── nodes/                # NautilusNode, GroupNode, icon registry
│   └── edges/                # DeletableEdge (numbered badge), shared arrow markers
├── lib/
│   ├── flow-context.tsx      # Canvas store, undo/redo, autosave, share links
│   ├── flow-ops.ts           # Request model, inference, step numbering (pure, tested)
│   ├── flow-execution.ts     # Dependency-order planner (pure, tested)
│   ├── simulation-model.ts   # compileGraph / runCompiled / sweepCompiled (pure, tested)
│   ├── sim-engine.ts         # Message protocol around the model (pure, tested)
│   ├── sim-worker.ts         # Web Worker entry point
│   ├── use-load-engine.ts    # Worker lifecycle, one run in flight, inline fallback
│   ├── sim-graph.ts          # Projector: canvas state → stable simulation graph
│   ├── canvas-decorate.ts    # Render-time decoration with identity caching
│   ├── use-simulation.ts     # Trace playback state machine
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
| `nautilus-delete-edge` | `canvas.tsx` | Dispatched by `DeletableEdge` and the connection inspector |
| `nautilus-node-action` | `canvas.tsx` | Node context menu: edit, duplicate, delete |
| `nautilus-node-failure` | `canvas.tsx` | Toggle failure injection on a node |
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
      position: { x: 0, y: 300 },
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
      data: {
        // What this connection does. Leave `flow` out and it is inferred.
        flow: { op: "GET", path: "/api/*" },
        // Optional routing model for the load playground.
        sim: { share: 1, fanout: 1 },
      },
    },
  ],
}
```

2. Register it in `src/lib/templates/index.ts`.
3. Check it in the app: **Templates** in the toolbar, then press **Run** and
   read the numbered requests — it is a quick check that the flow is the one
   you intended. Then open the load playground: at the template's own `sim`
   parameters nothing should be dropped.

Template guidelines:

- Lay out top-to-bottom, clients at the top, storage at the bottom. Leave at
  least 340px between nodes side by side and 200px between rows — a node grows
  to 320px wide, and the test suite rejects a template whose nodes overlap.
- Give every node a `description`; it is what makes a template teach something.
- Colour by role: clients blue, compute green, storage red, messaging yellow.
- Avoid cycles unless the architecture genuinely has one.
- Draw every connection from initiator to receiver (producer → queue → consumer),
  and prefer an explicit `flow.op` and `path` — a template is read more than it
  is run.
- Model background work honestly: a `schedule` on jobs and workers, a `POLL`
  connection for anything that checks on a timer.
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
  JSON and share links. `src/lib/canvas-decorate.ts` is where that merge happens.
- **Keep object identity.** React Flow skips a node or edge whose object is the
  same as last time. A change handler that returns a new array of new objects
  for an unchanged canvas re-renders the whole diagram; return the previous
  array when nothing changed, and the previous element when *it* did not.
- **Not every change is an edit.** Pass `{ history: false }` to `setNodes` /
  `setEdges` for selection, measured sizes and intermediate drag frames, and
  call `commitHistory()` once when the gesture ends.
- Read with `useFlow()` only if the component must re-render when the canvas
  changes. A component that only writes should use `useFlowActions()`.
- Node and edge components are wrapped in `memo`. Do not read canvas state
  inside them — pass what they need through `data`.

## Working on the simulation

There are two simulators, and all of their logic is pure and unit-tested.

| Module | Job |
| --- | --- |
| `flow-ops.ts` | The request model: operations, inference for unlabelled edges, schedules, and `computeSequence`, which numbers every hop |
| `flow-execution.ts` | Dependency order (Kahn's algorithm), cycle and island detection |
| `simulation-model.ts` | `compileGraph` (once per edit) → `runCompiled` (per run) → `sweepCompiled` (the ramp) |
| `sim-engine.ts` | The `graph` / `run` message protocol shared by the worker and the inline fallback |

```ts
const sequence = computeSequence(nodes, edges)
// sequence.hops -> [{ step: 1, op: "GET", source, target, path, trigger: "on request" }, …]

const graph = compileGraph(nodes, edges)
const report = runCompiled(graph, params)
// report.metrics[nodeId], report.edges[edgeId], report.summary
```

Rules they must keep:

- **Pure.** No React, no DOM, no `window`. The same file runs in a Web Worker
  and in Node under Vitest.
- **Plain data across the boundary.** Whatever the engine returns is posted
  between threads, so it must survive structured cloning: no functions, no class
  instances, no `Map` in a report.
- **Nothing is fatal.** Cycles are reported, never hung on. Group nodes,
  self-loops and edges pointing at missing nodes are skipped.
- **Unlabelled diagrams keep working.** A new field needs a default, and a new
  operation needs an inference story or an explicit opt-in.
- **Excess goes somewhere specific.** A queue keeps it (backlog), a consumer
  never took it (lag, pushed back to the queue), anything else sheds it (drops).
  Do not collapse those into one number.
- **Validate what you add.** A new persisted field needs a branch in
  `src/lib/diagram-io.ts` with a maximum, or it will be dropped on import.

Add a test for any behaviour you change — `flow-ops.test.ts` for numbering and
inference, `simulation-model.test.ts` for the numbers. `templates.test.ts` runs
every built-in template at its rated load and will tell you if a model change
quietly broke one.

`use-simulation.ts` owns trace playback (play, pause, step, jump, speed) and
`use-load-engine.ts` owns the worker; both hand the canvas render-time data and
neither writes to the document.

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
