import { Callout, Code, CodeBlock, DocsPager, List, P, PageHeader, Section, Table } from "@/components/docs/ui"

export const metadata = { title: "Flow simulation — Nautilus Docs" }

export default function SimulationPage() {
  return (
    <>
      <PageHeader
        eyebrow="Features"
        title="Flow simulation"
        lead="Two simulators over the same graph: Trace walks it step by step, and the load playground pushes traffic through it to find the bottleneck."
      />

      <Section title="How the plan is built">
        <P>
          Nautilus derives a layered execution plan from the graph. Entry points
          — nodes with no incoming edges — run first. Each following step
          contains every node whose upstream dependencies have all completed, so
          parallel branches animate together instead of being forced into an
          arbitrary single-file order.
        </P>
        <CodeBlock
          caption="Example: client → (api-a, api-b) → db"
          code={`step 1   client
step 2   api-a, api-b      ← both, at the same time
step 3   db                ← only after both APIs have run`}
        />
      </Section>

      <Section title="Controls">
        <Table
          head={["Control", "Purpose"]}
          rows={[
            ["Play / Pause", "Start or hold the run"],
            ["Step", "Advance exactly one step and pause"],
            ["Stop", "End the run and clear all highlighting"],
            ["0.5× – 4×", "Playback speed"],
            ["Progress", "Step n of m, and how many nodes are active right now"],
          ]}
        />
      </Section>

      <Section title="What it tells you">
        <P>
          The panel reports problems rather than failing silently:
        </P>
        <List
          items={[
            "Cycles — nodes in a loop can never have every dependency satisfied, so they are named and run together as a final step.",
            "Dangling connections — edges pointing at a deleted node are skipped rather than aborting the run.",
            "Isolated nodes — components with no connections at all.",
            "An empty canvas, instead of an animation that appears to do nothing.",
          ]}
        />
      </Section>

      <Callout title="Runs never touch your document">
        Simulation marks are merged at render time only. They never enter undo
        history, autosave, exported JSON or share links — so a run can&apos;t
        dirty your diagram, and stopping is instant.
      </Callout>

      <Section title="Load playground">
        <P>
          Trace answers &ldquo;in what order does this run?&rdquo;. The load
          playground answers &ldquo;what happens when you push traffic through
          it?&rdquo; — open it with the gauge button in the toolbar.
        </P>
        <P>
          Give nodes a capacity model in <strong>Properties ▸ Simulation</strong>,
          then set the offered load. Results update live as you change either,
          so you can sweep the load slider and watch where the design gives out.
        </P>

        <Table
          head={["Node parameter", "Meaning"]}
          rows={[
            ["Capacity (req/s)", "What one replica can serve. Blank means unbounded — fine for clients, misleading for services."],
            ["Replicas", "Identical instances. Total capacity is capacity × replicas."],
            ["Latency (ms)", "Service time at low utilisation, before queueing."],
            ["Error rate (%)", "Baseline failures, independent of overload."],
          ]}
        />

        <Table
          head={["Global parameter", "Meaning"]}
          rows={[
            ["Load (req/s)", "Total offered traffic, split evenly across entry points."],
            ["Timeout (ms)", "End-to-end budget. The slowest path is checked against it."],
            ["Payload (KB)", "Average response size, used for the bandwidth estimate."],
          ]}
        />

        <P>
          Each node then shows its utilisation bar, served rate and effective
          latency; the panel reports exit throughput, dropped traffic, the
          slowest path and the ranked bottlenecks — click one to jump to that
          node.
        </P>

        <Table
          head={["Reading", "What it counts"]}
          rows={[
            ["Exit throughput", "Traffic leaving the exit nodes. A request that fans out to three stores counts three times, so this can exceed the offered load."],
            ["% served", "Share of every call in the graph — internal hops included — that was served rather than shed."],
            ["Dropped", "Requests per second shed anywhere, summed."],
            ["Slowest path", "Worst entry-to-exit latency, queueing included, checked against your timeout."],
          ]}
        />

        <Section title="How the numbers are produced">
          <List
            items={[
              "Traffic enters at nodes with no incoming edges and flows in dependency order.",
              "A node accepts min(offered, capacity × replicas); the rest is shed and reported as dropped.",
              "Queue wait uses an M/M/1 approximation, so latency climbs sharply as utilisation approaches 100%.",
              "Downstream load is what actually got served, after drops and baseline errors.",
              "The slowest entry-to-exit path becomes the critical path, compared against your timeout budget.",
            ]}
          />
          <P>
            Edges carry two optional fields — <Code>share</Code> (the fraction of
            requests that take this edge, for load balancing or cache-miss paths)
            and <Code>fanout</Code> (calls made per request). Both default to 1
            and can be set in exported JSON under <Code>edge.data.sim</Code>.
          </P>
        </Section>
      </Section>

      <Section title="Limits">
        <P>
          Both simulators are models, not measurements. Trace shows dependency
          order. The load playground is a steady-state analytical model — it does
          not simulate retries, circuit breakers, bursts, cold starts or
          per-request variance, and traffic through a cycle is undefined. Use it
          to find capacity mistakes and bottlenecks, not to predict a p99.
        </P>
      </Section>

      <DocsPager href="/docs/simulation" />
    </>
  )
}
