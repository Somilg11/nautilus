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
| **Right sidebar** | Node properties, the AI assistant, API-key management |

The canvas itself supports pan (drag empty space), zoom (scroll / controls), box
selection (drag) and multi-select (Shift or ⌘/Ctrl click).

## Building a diagram

1. **Add nodes** — drag from the left palette, or double-click an existing node
   to open its properties.
2. **Connect them** — drag from the handle at the bottom of one node to the
   handle at the top of another. Edges are directional; direction is what the
   simulation follows.
3. **Describe them** — select a node and use the Properties tab to set its
   label, description and colour. A described diagram is a document; an
   undescribed one is a picture.
4. **Delete a connection** — click the edge, then the ✕ button on it.

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

## Flow simulation

Press **Run** (▶) in the toolbar to watch data move through the architecture.

Nautilus computes a **layered execution plan** from the graph:

- Nodes with no incoming edges are the entry points and light up first.
- Each following step contains every node whose upstream nodes have all
  finished — so two parallel services light up *together*, rather than being
  forced into an arbitrary single-file order.
- Edges pulse as data travels along them; completed nodes keep a dim trail so
  you can see how far the run has got.

The transport panel at the bottom of the canvas gives you:

| Control | Purpose |
| --- | --- |
| ▶ / ⏸ | Play or pause |
| ⏭ | Advance exactly one step (pauses the run) |
| ■ | Stop and clear all highlighting |
| 0.5× · 1× · 2× · 4× | Playback speed |
| Progress bar | Step *n* of *m*, and how many nodes are active in this step |

It also reports problems it found rather than failing silently:

- **Cycles** — nodes in a loop can never have all dependencies satisfied, so
  they are called out and run together as a final step.
- **Dangling connections** — edges pointing at a deleted node are skipped.
- **Isolated nodes** — nodes with no connections at all.
- **Empty canvas** — nothing to run.

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

Globally: offered load (req/s, split evenly across entry points), a timeout
budget, and an average payload size for bandwidth estimates.

Results update live as you edit either the graph or the parameters. Each node
shows a utilisation bar, its served rate and its queue-inflated latency; the
panel reports exit throughput, dropped traffic, egress bandwidth, the slowest
path against the timeout, and ranked bottlenecks you can click to jump to.

Two throughput numbers, deliberately different: **exit throughput** counts
traffic leaving the exit nodes (a request that fans out to three stores counts
three times), while **% served** is the share of every call in the graph —
internal hops included — that was served rather than shed.

Edges support two optional fields in exported JSON (`edge.data.sim`):
`share` (fraction of requests taking this edge — load balancing, cache misses)
and `fanout` (calls made per request). Both default to 1.

It is a steady-state analytical model with an M/M/1 queue approximation — good
for finding capacity mistakes and bottlenecks, not for predicting a p99. Traffic
through a cycle is undefined and reported as such.

## Templates

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
    }
  ],
  "edges": [
    {
      "id": "e1",
      "source": "api",
      "target": "db",
      "type": "deletableEdge",
      "label": "cache miss",
      "data": { "sim": { "share": 0.15, "fanout": 1 } }
    }
  ]
}
```

| Field | Where | Default |
| --- | --- | --- |
| `data.label` / `icon` / `color` / `description` | node | label required; others optional |
| `data.sim.capacity` | node — req/s one replica serves | unbounded |
| `data.sim.replicas` | node — identical instances | `1` |
| `data.sim.latencyMs` | node — service time before queueing | `20` |
| `data.sim.errorRate` | node — baseline failures, 0–1 | `0` |
| `data.sim.share` | edge — fraction of requests taking this edge, 0–1 | `1` |
| `data.sim.fanout` | edge — calls made per request | `1` |

The simulation fields ride along through export, import, share links and
autosave, so a diagram carries its capacity model with it. Unknown fields are
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
- **The simulation is structural.** It animates dependency order — it does not
  model latency, throughput, failure or queueing.
- **No edge labels or custom edge routing** in the UI yet.
- **Vertical layout only** for auto-layout; no left-to-right mode.
- **PNG export only** — no SVG or PDF.
- **Group nodes are excluded from simulation**, by design (they are visual
  containers, not services).
