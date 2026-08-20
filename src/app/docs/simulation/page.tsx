import { Callout, Code, CodeBlock, DocsPager, List, P, PageHeader, Section, Table } from "@/components/docs/ui"

export const metadata = {
  title: "Flow simulation — Nautilus Docs",
  description:
    "Run flow simulations in Nautilus to watch requests traverse your architecture step by step and find bottlenecks before you build it.",
  alternates: { canonical: "/docs/simulation" },
  openGraph: {
    title: "Flow simulation — Nautilus Docs",
    description:
      "Run flow simulations in Nautilus to watch requests traverse your architecture step by step and find bottlenecks before you build it.",
    url: "/docs/simulation",
    type: "article",
  },
}

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
            ["Cost / hour ($)", "Price of one replica per hour. Monthly cost is cost × replicas × 730."],
            ["Cache hit (%)", "Share answered here and not forwarded, so a backing store only sees the misses."],
            ["Failure", "Failure injection — the node serves nothing until restored."],
          ]}
        />

        <Table
          head={["Global parameter", "Meaning"]}
          rows={[
            ["Load (req/s)", "Total offered traffic, split evenly across entry points."],
            ["Timeout (ms)", "End-to-end budget. The slowest path's p95 is checked against it."],
            ["Payload (KB)", "Average response size, used for the bandwidth estimate."],
            ["Target util (%)", "Utilisation to size for. Capacity advice keeps every node at or below it; 70% leaves headroom for bursts and failover."],
            ["Burst ×", "Peak-to-average multiplier. Capacity has to survive the peak, so the offered load is sized as load × burst."],
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

        <Section title="Capacity plan">
          <P>
            Whenever a node would run hotter than the target, the panel proposes
            a replica count: <em>Payment Service 8 → 90</em>. Click a suggestion
            to apply it to that node, or <em>Apply all</em> to size the whole
            design at once. The same suggestion appears in Properties ▸
            Simulation for the selected node.
          </P>
          <Callout title="Sized against demand, not throttled traffic">
            Advice uses what a node <em>would</em> receive with nothing upstream
            shedding load. Otherwise a saturated gateway would hide the demand on
            everything behind it, and you would scale the front door only to
            uncover the same problem one hop deeper.
          </Callout>
        </Section>

        <Section title="Load ramp">
          <P>
            Dragging the slider answers &ldquo;what happens at 50k?&rdquo;. The{" "}
            <strong>Ramp</strong> tab answers the more useful question:{" "}
            <em>where does this design stop working?</em> It sweeps the load from
            zero to twice the current setting and plots offered against
            delivered.
          </P>
          <P>
            While the two lines track each other the design is keeping up. Where
            delivered flattens out is the <strong>knee</strong> — the red marker —
            and the shaded gap past it is shed traffic. The panel also reports the
            highest load still served cleanly, and the load at which the p95 first
            breaches your timeout budget, which usually arrives before the knee.
            Click anywhere on the curve to run the design at that load.
          </P>
        </Section>

        <Section title="Cost">
          <P>
            Give nodes a price per instance-hour and the panel reports the
            monthly cost of the design, the cost per million delivered requests,
            and — next to the capacity plan — what applying that plan would do to
            the bill. All built-in templates ship with rough cloud list prices,
            so a template tells you what it would cost to run at a given load.
          </P>
          <Callout title="Capacity and cost together">
            A capacity plan without a price is half an answer. &ldquo;Payment
            Service 8 → 90 replicas&rdquo; reads differently once it says{" "}
            <em>$1,050 → $11,800/mo</em> beside it.
          </Callout>
        </Section>

        <Section title="Requests versus pipelines">
          <P>
            Publishing to a queue is a hand-off, not a call: the producer&apos;s
            request ends there. Nautilus treats any edge into a buffering node as
            asynchronous, so a slow consumer never inflates the latency of the
            request that triggered it. Set <Code>sim.async</Code> on any other
            edge to say the same thing about a fire-and-forget call.
          </P>
          <P>
            The timeout budget is checked against the{" "}
            <strong>request path</strong> only. Work behind a hand-off is reported
            separately as a <strong>background pipeline</strong> — YouTube&apos;s
            watch path is 142ms while its transcoding pipeline takes about seven
            seconds, and both numbers are correct.
          </P>
        </Section>

        <Section title="Queues buffer, they don't shed">
          <P>
            A queue past its capacity does not drop traffic — it falls behind.
            Nodes marked as buffering report the overload as{" "}
            <strong>backlog growth</strong> in requests per second rather than as
            drops, which is what a growing consumer lag actually looks like.
            Kafka, RabbitMQ, SQS and generic queue icons are treated this way
            automatically; anything else can opt in with{" "}
            <Code>sim.queue</Code>.
          </P>
        </Section>

        <Section title="Baselines and reports">
          <P>
            <strong>Pin baseline</strong> freezes the current run. Every number
            then shows its delta, and the diff line names bottlenecks that
            appeared or cleared — which is usually where a tuning pass goes wrong.
          </P>
          <P>
            <strong>Copy report</strong> puts a Markdown capacity summary on the
            clipboard: parameters, throughput, p95, cost, critical path,
            bottlenecks and the capacity plan. Paste it into a design doc or a
            pull request.
          </P>
        </Section>

        <Section title="Failure injection">
          <P>
            Right-click any node and choose <strong>Simulate failure</strong> (or
            use the button in Properties ▸ Simulation). The node stops serving:
            everything arriving is shed, nothing is forwarded, and the panel shows
            what the rest of the design does about it — which paths die, where
            the load lands, and what the success rate drops to.
          </P>
          <P>
            Downed nodes are drawn dashed and dimmed, listed in the panel, and
            restored individually or all at once. The flag lives in{" "}
            <Code>data.sim.down</Code>, so a &ldquo;what if this region is
            gone&rdquo; scenario can be exported and shared like any other
            diagram.
          </P>
        </Section>

        <Section title="Latency: p95, not just the average">
          <P>
            Service time in a queue is not a fixed number, so Nautilus reports
            both. Per hop, response time is treated as exponentially distributed,
            which puts the 95th percentile at about 3× the mean. Along a path the
            hops are combined statistically rather than by adding their
            percentiles — the p95 of a chain is well below the sum of each hop&apos;s
            p95, because they rarely all go slow at once.
          </P>
          <P>
            The timeout check uses the p95. A design whose average fits the budget
            but whose p95 does not is a design that times out for a noticeable
            slice of real users.
          </P>
        </Section>

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
