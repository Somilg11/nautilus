import { Callout, Code, CodeBlock, DocsPager, List, P, PageHeader, Section, Table } from "@/components/docs/ui"

export const metadata = {
  title: "Flow simulation — Nautilus Docs",
  description:
    "Number every request in your architecture, replay it step by step, and load-test the design in your own browser — cron jobs, workers and polling included.",
  alternates: { canonical: "/docs/simulation" },
  openGraph: {
    title: "Flow simulation — Nautilus Docs",
    description:
      "Number every request in your architecture, replay it step by step, and load-test the design in your own browser — cron jobs, workers and polling included.",
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
        lead="Every connection is a numbered request. Trace replays them one at a time; the load playground pushes traffic through them to find the bottleneck — all inside your browser."
      />

      <Section title="Every connection is a request">
        <P>
          A connection is not just &ldquo;A depends on B&rdquo; — it is a
          specific interaction, and it is drawn from the component that
          initiates it to the one that receives it. Select a connection (or
          double-click it) to set what it does in{" "}
          <strong>Properties</strong>: the operation, the endpoint or topic, a
          timeout, and how much of the traffic takes it.
        </P>
        <Table
          head={["Operation", "Who waits", "Use it for"]}
          rows={[
            ["GET · POST · PUT · PATCH · DELETE · CALL", "The caller waits for the reply", "HTTP and RPC between services"],
            ["READ · WRITE · QUERY", "The caller waits", "Cache and database access"],
            ["PUBLISH · EVENT", "Nobody — it is a hand-off", "Producing to a queue or topic; fire-and-forget calls and webhooks"],
            ["CONSUME", "The consumer pulls at its own pace", "Queue → consumer. What it cannot take stays in the queue"],
            ["POLL", "The source asks on a timer", "A service checking a table or an API every few seconds"],
          ]}
        />
        <P>
          Connections you have not labelled are inferred from what they join —
          into a queue is a <Code>PUBLISH</Code>, out of one is a{" "}
          <Code>CONSUME</Code>, into a database is a <Code>QUERY</Code> — so an
          existing diagram reads correctly without annotating every line. Solid
          lines are calls somebody waits on; dashed lines are hand-offs and
          consumers; dotted lines are polls.
        </P>
      </Section>

      <Section title="Numbering: which request goes where">
        <P>
          Every connection carries a step number. A request is followed
          depth-first through the calls its handler waits on, because that is
          the order they are made in. A publish is numbered where it is issued,
          but what happens on the far side of the queue is numbered after the
          request that caused it has finished — which is how it plays out in
          production. Cron jobs, worker loops and pollers come last, as flows
          of their own.
        </P>
        <CodeBlock
          caption="Example: an order is placed, then processed in the background"
          code={`1  GET      Client → Gateway        /api            on request
2  POST     Gateway → Orders        /orders         on request
3  WRITE    Orders → Orders DB      orders          on request
4  PUBLISH  Orders → Kafka          order.created   on request
5  CONSUME  Kafka → Notifier        order.created   on message
6  QUERY    Reconcile job → Orders DB               cron every 5m`}
        />
        <P>
          Sibling calls run in the order the connections were drawn. To change
          it, set <strong>Call order</strong> on the connection — lower runs
          first. The <strong>Calls</strong> tab of the simulation panel lists
          every hop with what triggers it; click a row to jump to that
          connection.
        </P>
      </Section>

      <Section title="Cron jobs, workers and polling">
        <P>
          Not everything waits to be called. In{" "}
          <strong>Properties ▸ Runs on its own</strong> a component can be made
          a <strong>cron job</strong> — it fires once per interval however many
          replicas exist — or a <strong>worker loop</strong>, which every
          replica runs continuously, so its rate grows with the replica count.
          The palette has both ready-made under Compute.
        </P>
        <P>
          A <Code>POLL</Code> connection is the same idea for a single call: the
          source hits the target every <em>n</em> seconds from each replica,
          whatever traffic it happens to be serving.
        </P>
        <Callout title="Scheduled load does not scale with your users">
          Self-starting components are never treated as entry points, so the
          offered load is not split onto them. Their traffic is added on top and
          reported separately — it is still there at 3am with nobody online.
        </Callout>
      </Section>

      <Section title="Trace">
        <P>
          <strong>Run</strong> replays the numbered requests one at a time. The
          connection in flight lights up along with the two components it
          joins, and the panel names it: who is calling whom, with what, whether
          anyone is waiting, and what set it off.
        </P>
      </Section>

      <Section title="Controls">
        <Table
          head={["Control", "Purpose"]}
          rows={[
            ["Play / Pause", "Start or hold the run"],
            ["Step forward / back", "Move exactly one request and pause"],
            ["Click a row", "Jump straight to that request"],
            ["Stop", "End the run and clear all highlighting"],
            ["0.5× – 4×", "Playback speed"],
            ["Progress", "Request n of m, and the call being made right now"],
          ]}
        />
      </Section>

      <Section title="What it tells you">
        <P>
          The panel reports problems rather than failing silently:
        </P>
        <List
          items={[
            "Cycles — each node in a loop is visited once and then the loop is cut, so a run always ends.",
            "Flows nothing starts — every node has an incoming connection and none runs on a schedule.",
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

      <Section title="Runs on your machine">
        <P>
          Nautilus has no simulation backend. When you open the load playground
          the diagram is compiled once into a compact form inside a{" "}
          <strong>Web Worker</strong> — a background thread of your own browser
          — and every run after that only sends the load parameters. Dragging
          the slider re-runs the model and its 24-point ramp without re-planning
          the graph, without blocking the canvas, and without a single network
          request. The panel shows where the last run executed and how long it
          took.
        </P>
        <List
          items={[
            "Moving, selecting or resizing nodes does not re-run anything — only changes the model can see do.",
            "One run is in flight at a time; a burst of slider events collapses into the latest one, so a slow machine never builds up a queue of stale work.",
            "Closing the playground terminates the worker and frees its memory.",
            "If workers are blocked, the same engine runs in the page instead.",
          ]}
        />
        <P>
          Large diagrams also drop their decorative effects automatically:
          off-screen nodes are not mounted, request badges are hidden when you
          zoom far enough out that they could not be read, and animated edges
          and glows are switched off past a couple of hundred elements or on a
          device that asks for reduced motion.
        </P>
      </Section>

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
            ["Runs on its own", "Cron job or worker loop, with its interval and jobs per run."],
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
            ["Over their timeout", "Connections whose p95 response is slower than the timeout set on that connection."],
            ["Self-generated load", "Traffic from cron jobs, worker loops and polls — present whether or not users are."],
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
            request that triggered it. Mark any other connection as an{" "}
            <Code>EVENT</Code> to say the same thing about a fire-and-forget
            call.
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
          <P>
            The same holds on the way out. A consumer that cannot keep up does
            not drop messages it never took — they stay in the queue it reads
            from. The consumer shows as saturated and lagging, the queue shows
            the backlog, and the capacity plan tells you how many consumers
            would clear it.
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
              "User traffic enters at nodes with no incoming edges that are not self-starting, and flows in dependency order.",
              "Cron jobs, worker loops and polls add their own rate on top, independent of the offered load.",
              "A node accepts min(offered, capacity × replicas); the rest is shed and reported as dropped.",
              "Queue wait uses an M/M/1 approximation, so latency climbs sharply as utilisation approaches 100%.",
              "Downstream load is what actually got served, after drops and baseline errors.",
              "The slowest entry-to-exit path becomes the critical path, compared against your timeout budget.",
            ]}
          />
          <P>
            Each call also reports how long its caller waits: the target plus
            everything the target itself waits on. A publish only waits for the
            broker. Set a timeout on a connection and it is flagged when the
            p95 of that wait is slower.
          </P>
          <P>
            Connections carry <Code>share</Code> (the fraction of requests that
            take this path, for load balancing or cache misses) and{" "}
            <Code>fanout</Code> (calls made per request). Both default to 1 and
            are edited on the connection; in exported JSON they live under{" "}
            <Code>edge.data.sim</Code>, beside the request itself in{" "}
            <Code>edge.data.flow</Code>.
          </P>
        </Section>
      </Section>

      <Section title="Limits">
        <P>
          Both simulators are models, not measurements. Nothing is ever sent to
          the endpoints you name — they describe the design, they are not
          called. Trace shows the order requests are made in. The load
          playground is a steady-state analytical model — it does
          not simulate retries, circuit breakers, bursts, cold starts or
          per-request variance, and traffic through a cycle is undefined. Use it
          to find capacity mistakes and bottlenecks, not to predict a p99.
        </P>
      </Section>

      <DocsPager href="/docs/simulation" />
    </>
  )
}
