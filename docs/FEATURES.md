# Nautilus — Feature Guide

Everything Nautilus can do today, how to reach it, and where its limits are.

- [The editor at a glance](#the-editor-at-a-glance)
- [Building a diagram](#building-a-diagram)
- [Editing tools](#editing-tools)
- [Keyboard shortcuts](#keyboard-shortcuts)
- [Flow simulation](#flow-simulation)
- [Templates](#templates)
- [AI assistant](#ai-assistant)
- [Saving, sharing and exporting](#saving-sharing-and-exporting)
- [Running it as an app](#running-it-as-an-app)
- [Theming](#theming)
- [Limits and known gaps](#limits-and-known-gaps)

---

## The editor at a glance

Open `/dashboard`. Four regions:

| Region | What lives there |
| --- | --- |
| **Top toolbar** | Project name, undo/redo, templates, import, export, share, PNG, run, save indicator, AI panel, theme |
| **Editing bar** | Copy, paste, duplicate, delete, group, ungroup, align, distribute, zoom, fit |
| **Left sidebar** | Searchable component palette — drag onto the canvas |
| **Right sidebar** | Properties of the selected node or connection, the AI assistant, API-key management |
| **Simulation panel** | Trace, Load, Ramp and Calls tabs; appears when you run a trace or open the load playground |

The canvas itself supports pan (drag empty space), zoom (scroll / controls), box
selection (drag) and multi-select (Shift or ⌘/Ctrl click).

## Building a diagram

1. **Add nodes** — drag from the left palette, or double-click an existing node
   to open its properties.
2. **Connect them** — drag from the handle at the bottom of one node to the
   handle at the top of another. Draw from the component that *initiates* the
   interaction to the one that receives it: caller → service, producer → queue,
   queue → consumer, poller → the thing it polls.
3. **Describe them** — select a node and use the Properties tab to set its
   label, description and colour. A described diagram is a document; an
   undescribed one is a picture.
4. **Say what each connection does** — double-click a connection to set its
   operation, endpoint or topic, timeout and call order. Leave it alone and the
   operation is inferred. See [Flow simulation](#flow-simulation).
5. **Delete a connection** — select it, then the ✕ button on it or *Delete
   connection* in Properties.

The palette holds 60+ components in ten categories: clients, compute (including
ready-made **Worker** and **Cron Job** components), databases, storage and
media, messaging and streams, networking, payments, auth providers, monitoring
and logs, and cloud providers.

Right-click a node for edit, duplicate, delete and failure injection.

Colours available: default (grey), blue, green, red, yellow, purple, orange.
Convention used by the built-in templates: clients blue, compute green, storage
red, messaging yellow.

## Editing tools

| Tool | Behaviour |
| --- | --- |
| Copy / Paste | Copies selected nodes plus the edges between them; paste offsets by 25px and selects the new copy |
| Duplicate | Copy + paste in one action |
| Delete | Removes selected nodes and any edge touching them |
| Group | Wraps the selection in a real container node; children move with it and are clipped to it |
| Ungroup | Dissolves the container, restoring absolute positions |
| Align left / center / right | Aligns using measured node widths, not just x-coordinates |
| Distribute horizontally | Even spacing between the leftmost and rightmost selected node (needs 3+) |
| Zoom in / out / fit | Viewport controls; fit frames the whole diagram |

## Keyboard shortcuts

| Keys | Action |
| --- | --- |
| ⌘/Ctrl + C · V | Copy · Paste |
| ⌘/Ctrl + G | Group selection |
| ⌘/Ctrl + Shift + G | Ungroup |
| Delete / Backspace | Delete selection |
| Arrow keys | Nudge 1px |
| Shift + Arrow keys | Nudge 10px |
| ⌘/Ctrl + Z | Undo |
| ⌘/Ctrl + Shift + Z · Ctrl + Y | Redo |

Inside a text field, undo and redo act on the text, not the canvas. Dragging a node is one undo step however far
it moves; selecting something is not an edit and is not recorded.

## Flow simulation

### Every connection is a numbered request

A connection is a specific interaction, drawn from the component that initiates
it to the one that receives it. Select one (or double-click it) and set it in
**Properties**:

| Operation | Who waits | Use it for |
| --- | --- | --- |
| `GET` `POST` `PUT` `PATCH` `DELETE` `CALL` | The caller | HTTP and RPC between services |
| `READ` `WRITE` `QUERY` | The caller | Cache and database access |
| `PUBLISH` `EVENT` | Nobody — it is a hand-off | Producing to a queue; fire-and-forget calls |
| `CONSUME` | The consumer pulls at its own pace | Queue → consumer; what it cannot take stays queued |
| `POLL` | The source asks on a timer | Checking a table or API every few seconds |

Each connection also takes an endpoint or topic (`/orders/:id`,
`order.created`), a timeout, a call order, a traffic share and a fan-out.
Connections you have not labelled are inferred from what they join, so existing
diagrams read correctly as they are.

Every connection shows its **step number**. A request is followed depth-first
through the calls its handler waits on; what a publish sets off is numbered
after the request that caused it; cron jobs, worker loops and pollers come last
as flows of their own. The **Calls** tab lists every hop with what triggers it.

### Cron jobs, workers and polling

In **Properties ▸ Runs on its own** a component can be a **cron job** (fires
once per interval, however many replicas exist) or a **worker loop** (every
replica runs it continuously). A `POLL` connection does the same for a single
call. This load is independent of user traffic and is reported separately.

### Trace

Press **Run** (▶) in the toolbar to replay the numbered requests one at a time.
The connection in flight lights up with the two components it joins, and the
panel names it — who calls whom, with what, whether anyone waits, and what set
it off.

| Control | Purpose |
| --- | --- |
| ▶ / ⏸ | Play or pause |
| ⏮ / ⏭ | Move exactly one request back or forward (pauses the run) |
| ■ | Stop and clear all highlighting |
| 0.5× · 1× · 2× · 4× | Playback speed |
| Request list | Click any row to jump to it |

It also reports problems it found rather than failing silently:

- **Cycles** — each node in a loop is visited once, then the loop is cut.
- **Flows nothing starts** — no entry point and nothing on a schedule.
- **Isolated nodes** — nodes with no connections at all.
- **Empty canvas** — nothing to run.

### Runs in your browser

There is no simulation backend. The load playground compiles the diagram once
inside a **Web Worker** — a background thread of the visitor's own browser —
and each run after that only sends the load parameters. Nothing is sent to a
server, moving nodes does not re-run anything, and only one run is ever in
flight, so a slow machine cannot build up a queue of stale work. Large diagrams
automatically skip off-screen elements, unreadable badges and animations.

Simulation state is never written into your document: it does not enter undo
history, autosave, exported JSON or share links, and stopping a run is instant.

### Load playground

The gauge button in the toolbar opens a second simulator that pushes traffic
through the design instead of just walking it.

Per node (**Properties ▸ Simulation**):

| Field | Meaning |
| --- | --- |
| Capacity (req/s) | What one replica can serve. Blank = unbounded. |
| Replicas | Identical instances; total capacity is capacity × replicas. |
| Latency (ms) | Service time before queueing. |
| Error rate (%) | Baseline failures, independent of overload. |
| Cost / hour ($) | Price of one replica per hour; monthly cost is cost × replicas × 730. |
| Cache hit (%) | Share answered here and not forwarded, so a backing store only sees misses. |
| Failure | Failure injection (right-click a node): it serves nothing until restored. |

Globally: offered load (req/s, split evenly across entry points), a timeout
budget, an average payload size for bandwidth estimates, the utilisation to size
for (70% by default), and a burst factor — capacity has to survive the peak, so
the load is applied as `load × burst`.

Three things it will tell you that a drawing cannot:

- **Capacity plan** — every node that would run hotter than the target gets a
  replica suggestion (`Payment Service 8 → 90`), appliable one at a time or all
  at once. Sized against demand, not against throttled traffic, so a saturated
  gateway cannot hide the load behind it.
- **Failure injection** — right-click a node and take it out. Watch which paths
  die, where the traffic lands and what the success rate becomes. The flag is
  saved with the diagram, so a failure scenario can be shared.
- **p95 latency** — per hop and along the path, combined statistically rather
  than by adding percentiles. The timeout check uses p95, because a design whose
  average fits the budget can still time out for a noticeable slice of users.
- **Load ramp** — the Ramp tab sweeps from zero to twice the current load and
  plots offered against delivered. Where delivered flattens is the knee; the
  panel also reports the highest load still served cleanly and where the p95
  first breaches the budget. Click the curve to jump to that load.
- **Cost** — price nodes per instance-hour and the panel reports monthly cost,
  cost per million delivered requests, and what the capacity plan would do to the
  bill (`$1,000 → $1,570/mo`). Every built-in template ships with rough cloud
  list prices.
- **Requests vs pipelines** — an edge into a queue is a hand-off, so a slow
  consumer never inflates the request that triggered it. The timeout is checked
  against the request path; background work is reported separately.
- **Queues buffer** — a queue past capacity builds a backlog (`+4.0k/s`) instead
  of dropping. Kafka, RabbitMQ, SQS and queue icons behave this way
  automatically; anything else opts in with `sim.queue`.
- **Baseline diff** — pin a run, then every number shows its delta and the diff
  line names bottlenecks that appeared or cleared.
- **Copy report** — a Markdown capacity summary (parameters, throughput, p95,
  cost, critical path, bottlenecks, capacity plan) on the clipboard, ready for a
  design doc or a PR.

Results update live as you edit either the graph or the parameters. Each node
shows a utilisation bar, its served rate and its queue-inflated latency; each
connection's badge gains its live call rate and response time, with a red
outline when its p95 is over its own timeout and an amber one when a consumer
on it is falling behind. The panel reports exit throughput, dropped traffic, egress bandwidth, the slowest
path against the timeout, and ranked bottlenecks you can click to jump to.

Two throughput numbers, deliberately different: **exit throughput** counts
traffic leaving the exit nodes (a request that fans out to three stores counts
three times), while **% served** is the share of every call in the graph —
internal hops included — that was served rather than shed.

Connections carry `share` (fraction of requests taking this edge — load
balancing, cache misses) and `fanout` (calls made per request). Both default to
1 and are edited on the connection; in exported JSON they live in
`edge.data.sim`, beside the request itself in `edge.data.flow`.

It is a steady-state analytical model with an M/M/1 queue approximation — good
for finding capacity mistakes and bottlenecks, not for predicting a p99. Traffic
through a cycle is undefined and reported as such. The formulas are written out
in [ARCHITECTURE.md](ARCHITECTURE.md#the-load-model).

## Templates

Every template ships fully modelled: descriptions on every node, per-instance
capacity, replica counts sized for its rated load, cloud list prices, and the
playground parameters it was designed for — so loading one and pressing the
gauge button gives a design that serves its own traffic at 100%, with the knee
roughly 1.5–2× further out.

Toolbar ▸ **Templates** loads a production-grade architecture onto the canvas —
Netflix, Uber, WhatsApp, Instagram, YouTube, Spotify, Zomato, plus generic
three-tier and microservices patterns.

Loading a template replaces the canvas contents, so export first if you have
unsaved work you care about. Adding your own template is a good first
contribution — see [CONTRIBUTING.md](../CONTRIBUTING.md#adding-a-template).

## AI assistant

Right sidebar ▸ **Assistant**. The assistant receives your current diagram as
context, so it can do four different jobs:

- **Design** — "design a URL shortener that handles 10k writes/sec".
- **Extend** — "add a caching layer and a read replica to this design".
- **Review** — "review my current diagram and name its weak points".
- **Explain** — ordinary conversation about trade-offs, with your canvas in view.

Generated diagrams are **never applied automatically**. Each one arrives with
three choices: *Replace canvas* (undoable), *Add to canvas* (appended below your
existing work with fresh ids), or *Discard*.

Other conveniences: the conversation persists locally until you press *New
chat*, requests can be stopped mid-flight, failed requests offer a retry, and
each key has a *Test* button that makes one tiny request and reports the
provider's own error message.

Supported providers, each with your own key:

| Provider | Default model | Cost |
| --- | --- | --- |
| OpenAI | `gpt-4o-mini` | Usage-billed |
| Google Gemini | `gemini-2.5-flash` | Free tier available |
| Anthropic Claude | `claude-opus-5` | Usage-billed |
| Groq | `llama-3.3-70b-versatile` | Free tier available |

How it works and what that means for you:

- Requests go **straight from your browser to the provider**. Nautilus has no
  backend and never sees your key or your prompts.
- Keys are stored in your browser's `localStorage` under the app's origin.
  Anything with access to that origin could read them — use project-scoped keys
  with a spend limit, and clear them when you're done (Settings ▸ Clear All Keys).
- Generated diagrams are validated before they touch the canvas: unknown fields,
  bad colours, duplicate ids and edges to non-existent nodes are dropped.
- Generated nodes are positioned with a dependency-layered auto-layout, so the
  result is a readable graph rather than one long column.
- Conversation history is sent with each request (last dozen turns), so
  follow-ups like "now add a queue between them" work.

## Saving, sharing and exporting

| Feature | Details |
| --- | --- |
| **Autosave** | The canvas is written to `localStorage` ~600ms after you stop editing. The dot in the toolbar shows saved/unsaved. |
| **Export JSON** | Downloads `{ name, nodes, edges }` — the canonical format. |
| **Import JSON** | Validated on load; unusable parts are dropped rather than breaking the canvas. |
| **Share link** | Compresses the whole diagram into the URL (`/dashboard?d=…`). No server, no account — but long diagrams make long URLs, and anyone with the link has the diagram. |
| **Export PNG** | Renders the canvas at 2× on a white background. |

Autosave is per-browser and per-origin. It is not a backup — export anything you
would be upset to lose.

### The JSON format

```json
{
  "name": "Payments platform",
  "nodes": [
    {
      "id": "api",
      "type": "nautilusNode",
      "position": { "x": 120, "y": 40 },
      "data": {
        "label": "Payments API",
        "icon": "api_server",
        "color": "green",
        "description": "Authorises and captures charges",
        "sim": { "capacity": 4000, "replicas": 6, "latencyMs": 25, "errorRate": 0.001 }
      }
    },
    {
      "id": "sweeper",
      "type": "nautilusNode",
      "position": { "x": 420, "y": 40 },
      "data": {
        "label": "Settlement Job",
        "icon": "cron",
        "sim": {
          "capacity": 500,
          "schedule": { "kind": "cron", "everyMs": 300000, "batch": 200 }
        }
      }
    }
  ],
  "edges": [
    {
      "id": "e1",
      "source": "api",
      "target": "db",
      "type": "deletableEdge",
      "data": {
        "flow": { "op": "QUERY", "path": "charges", "timeoutMs": 250 },
        "sim": { "share": 0.15, "fanout": 1 }
      }
    }
  ],
  "sim": {
    "requestsPerSecond": 10000,
    "timeoutMs": 500,
    "payloadKb": 8,
    "targetUtilization": 0.7,
    "burstFactor": 2
  }
}
```

| Field | Where | Default |
| --- | --- | --- |
| `data.label` / `icon` / `color` / `description` | node | label required; others optional |
| `data.sim.capacity` | node — req/s one replica serves | unbounded |
| `data.sim.replicas` | node — identical instances | `1` |
| `data.sim.latencyMs` | node — service time before queueing | `20` |
| `data.sim.errorRate` | node — baseline failures, 0–1 | `0` |
| `data.sim.down` | node — failure injection; serves nothing | absent |
| `data.sim.costPerHour` | node — price of one replica per hour | `0` |
| `data.sim.hitRate` | node — share answered here, not forwarded, 0–1 | `0` |
| `data.sim.queue` | node — buffers past capacity instead of dropping | auto by icon |
| `data.sim.schedule.kind` | node — `cron` (once per interval) or `worker` (every replica loops) | absent |
| `data.sim.schedule.everyMs` | node — interval between firings, 1 ms to one week | required with `kind` |
| `data.sim.schedule.batch` | node — jobs started per firing | `1` |
| `sim` (top level) | diagram — playground parameters | defaults |
| `data.flow.op` | edge — one of the 13 operations | inferred |
| `data.flow.path` | edge — endpoint, topic, table or key; descriptive only | empty |
| `data.flow.order` | edge — position among the source's outgoing calls; lower runs first | as drawn |
| `data.flow.intervalMs` | edge — `POLL` only: time between polls, per replica | `5000` |
| `data.flow.timeoutMs` | edge — how long the caller waits; flagged when p95 exceeds it | none |
| `data.sim.share` | edge — fraction of requests taking this edge, 0–1 | `1` |
| `data.sim.fanout` | edge — calls made per request | `1` |
| `data.sim.async` | edge — legacy hand-off flag; `flow.op: "EVENT"` says the same thing | auto into queues |

Limits enforced on import: 2,000 nodes, 4,000 connections, 2,000 characters per
text field, and a ceiling on every number.

The simulation fields ride along through export, import, share links and
autosave, so a diagram carries its capacity model — and the playground
parameters that were set when it was shared — with it. Unknown fields are
dropped on import; missing fields fall back to the defaults above rather than to
zero.

## Running it as an app

Nautilus does not have to live in a browser tab:

| Command | Result |
| --- | --- |
| `npx github:Somilg11/nautilus` | Builds if needed, starts a local server, opens your browser |
| `npm run desktop` | The same app in a native Electron window |
| `npm run desktop:build` | Packaged installers — `.dmg`, `.exe`, AppImage |

Both are fully offline apart from AI calls. Browser and desktop keep separate
local storage; move work between them with Export/Import JSON.

## Theming

Light and dark, following the system preference by default; toggle in the
toolbar. The simulation's pulse animation respects
`prefers-reduced-motion: reduce`.

## Limits and known gaps

Honest list of what Nautilus does not do yet — several are good contribution
targets:

- **The editor is desktop-first.** Small screens get a one-time dismissible
  notice; the marketing, about and docs pages are fully responsive.
- **No accounts, no server-side persistence, no realtime collaboration.**
- **Undo history is capped at 50 steps** and is not persisted across reloads.
- **The simulation is a model, not a measurement.** Endpoints you name are
  never called; retries, circuit breakers and cold starts are not simulated.
- **No custom edge routing** in the UI yet.
- **Vertical layout only** for auto-layout; no left-to-right mode.
- **PNG export only** — no SVG or PDF.
- **Group nodes are excluded from simulation**, by design (they are visual
  containers, not services).
- **Very large diagrams are bounded by the canvas library.** Off-screen elements
  are skipped, but with close to a thousand elements on screen at once, dragging
  is noticeably slower on a low-end machine.
