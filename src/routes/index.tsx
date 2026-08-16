import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, CircleDot, Lock, ScanSearch, Spline, Wind } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({ component: Home });

const pillars = [
  {
    icon: Spline,
    title: "Exact geometry",
    body: "The phase map is a homogeneous rank-one orbit. Speed and curvature are constant. Apparent high rank is torus closure, not a new manifold.",
  },
  {
    icon: ScanSearch,
    title: "Two graphs",
    body: "Ordinate-local neighbors recover the tangent. Feature neighbors measure arithmetic recurrence. Mixing them is how false discoveries start.",
  },
  {
    icon: Lock,
    title: "Frozen tests",
    body: "Hold out primes, quarantine indices, compare to GUE. A construction that fits its own inputs is not evidence. Meridian says so out loud.",
  },
  {
    icon: CircleDot,
    title: "Claim classes",
    body: "Identity, certificate, empirical, excluded. The pipeline stops at the sheaf gate unless δ² = 0. GUE is not a universal null.",
  },
];

const ranges = [
  {
    k: "Known",
    l: "Already inside an open set. The next step is an interior — necessary if the story holds.",
  },
  {
    k: "Perceived",
    l: "Reachable by a continuous geodesic. The adapter’s reading, not a new law.",
  },
  {
    k: "Speculative",
    l: "Requires a jump. Fluent, possible, not entailed. The CST name for a hallucination.",
  },
];

const chapters = [
  { n: "01", t: "Phase kernel", d: "Stationary Gram, identifiability boundary." },
  { n: "02", t: "Orbit & recurrence", d: "Dirichlet witnesses, non-embedding." },
  { n: "03", t: "Two sheaf tests", d: "δ² = 0; holonomy is F, not a failed bundle." },
  { n: "04", t: "Weyl control", d: "Count-matched, fluctuation-free baseline." },
  { n: "05", t: "Prime perturbation", d: "Compact, leading-count preserving." },
  { n: "06", t: "Cutoff wall", d: "Hard field diverges; α > 0 converges." },
  { n: "07", t: "Euler-log field", d: "Absolute convergence ends at σ = 1." },
  { n: "08", t: "Condition-state", d: "Open sets, value warp, outcome ranges." },
];

function Home() {
  return (
    <div className="min-h-dvh bg-bg text-fg">
      <SiteHeader />
      <main>
        <section className="relative overflow-hidden">
          <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:py-24">
            <div>
              <p className="text-[11px] tracking-[0.22em] text-subtle uppercase">
                Rogue Atlas
              </p>
              <h1 className="mt-4 font-display text-4xl leading-[1.05] sm:text-5xl lg:text-6xl">
                See the geometry.
                <br />
                Test the claim.
              </h1>
              <p className="mt-6 max-w-xl text-base leading-relaxed text-muted sm:text-lg">
                An evidence-aware geometric intelligence studio. It turns sequential
                data into geometry and topology — then keeps asking what the
                representation imposed, and what the data independently supports.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button asChild size="lg">
                  <Link to="/atlas">
                    Open Atlas
                    <Wind className="size-4" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link to="/studio">Zeta reference</Link>
                </Button>
              </div>
              <p className="mt-6 max-w-md text-xs leading-relaxed text-subtle">
                Continuity is topological. A valid plan is a continuous map. Holonomy is
                curvature, not a failed bundle.
              </p>
            </div>
            <figure className="relative overflow-hidden rounded-2xl bg-surface shadow-[var(--shadow-lift)]">
              <img
                src="/dandelion.jpg"
                alt="A dandelion seed head — each seed a possible continuation"
                className="h-full min-h-80 w-full object-cover"
              />
              <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-bg via-bg/55 to-transparent p-5 text-sm text-muted">
                Release the seeds. Watch which ranges they can still land in.
              </figcaption>
            </figure>
          </div>
        </section>

        <section className="border-y border-line">
          <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-3">
            {ranges.map((s) => (
              <div key={s.k}>
                <div className="font-display text-3xl">{s.k}</div>
                <p className="mt-2 text-sm leading-relaxed text-muted">{s.l}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <div className="max-w-2xl">
            <p className="text-[11px] tracking-[0.22em] text-subtle uppercase">
              How it reads
            </p>
            <h2 className="mt-3 font-display text-3xl sm:text-4xl">
              Data in. Ranges out. Your value function in between.
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-muted">
              Condition:states are the alphabet. Activity:states are the regimes that emerge.
              The value compass conformally warps travel cost so geodesics fall toward what
              you marked as important. Contrast in a sentence becomes a gap. A gap without
              an overlapping open set is a jump.
            </p>
          </div>
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {pillars.map((p) => (
              <article
                key={p.title}
                className="rounded-xl bg-surface p-5 shadow-[var(--shadow-panel)]"
              >
                <p.icon className="size-5 text-muted" />
                <h3 className="mt-4 font-display text-2xl">{p.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{p.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="bg-surface/60">
          <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-[11px] tracking-[0.22em] text-subtle uppercase">
                  Chapters
                </p>
                <h2 className="mt-3 font-display text-3xl">
                  From the manuscripts, as software.
                </h2>
              </div>
              <Button asChild variant="ghost">
                <Link to="/method">
                  Full method
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
            </div>
            <ol className="mt-10 grid gap-px overflow-hidden rounded-xl bg-line sm:grid-cols-2">
              {chapters.map((c) => (
                <li key={c.n} className="flex gap-4 bg-bg p-5">
                  <span className="font-mono text-xs text-subtle">{c.n}</span>
                  <div>
                    <div className="text-sm text-fg">{c.t}</div>
                    <div className="mt-1 text-sm text-muted">{c.d}</div>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-20 sm:px-6 lg:grid-cols-2">
          <img
            src="/atelier.jpg"
            alt="Instrument desk"
            className="h-80 w-full rounded-2xl object-cover shadow-[var(--shadow-lift)]"
          />
          <div>
            <p className="text-[11px] tracking-[0.22em] text-subtle uppercase">
              Across domains
            </p>
            <h2 className="mt-3 font-display text-3xl sm:text-4xl">
              Thoughts, zeros, books, pulses — one topology, many questions.
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-muted">
              The studio still freezes arithmetic cells. The adapter sits on top and asks a
              more human question: given what I care about, which outcomes are known, which
              are only perceived, and which would require inventing a sequel?
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button asChild>
                <Link to="/adapter">Try a thought</Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/library">Browse the library</Link>
              </Button>
            </div>
          </div>
        </section>

        <footer className="border-t border-line">
          <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 text-xs text-subtle sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div className="flex items-center gap-2">
              <CircleDot className="size-3.5" />
              Meridian kernel. Atlas platform. Rogue is the drilling vertical.
            </div>
            <p>Finite certificates. Continuous plans. Not a proof of RH.</p>
          </div>
        </footer>
      </main>
    </div>
  );
}
