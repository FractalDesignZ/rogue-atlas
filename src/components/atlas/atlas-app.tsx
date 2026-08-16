import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  COMPUTE_RATE,
  COORDINATE_NOTE,
  CORRECTIONS,
  EVIDENCE_LABEL,
  EVIDENCE_NOTE,
  LADDER,
  POSITIONING,
  PRODUCTS,
  SEQUENCE,
  TRANSFER,
  type EvidenceStatus,
} from "@/lib/atlas/constitution";

const EVIDENCE_ORDER: EvidenceStatus[] = [
  "exact",
  "certified",
  "observed",
  "validated",
  "failed",
  "speculative",
];

const EVIDENCE_TONE: Record<EvidenceStatus, "info" | "pass" | "default" | "warn" | "fail"> = {
  exact: "info",
  certified: "pass",
  observed: "default",
  validated: "pass",
  failed: "fail",
  speculative: "warn",
};

export function AtlasApp() {
  return (
    <div className="min-h-dvh bg-bg text-fg">
      <SiteHeader solid />
      <main>
        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-20">
          <p className="text-xs tracking-[0.22em] text-subtle uppercase">Rogue Atlas</p>
          <h1 className="mt-4 max-w-3xl font-display text-4xl leading-[1.05] sm:text-5xl">
            See the geometry. Test the claim. Deploy the evidence.
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-relaxed text-muted sm:text-lg">
            {POSITIONING.strong}
          </p>
          <ol className="mt-10 flex flex-wrap gap-2">
            {SEQUENCE.map((step, i) => (
              <li key={step} className="flex items-center gap-2">
                {i > 0 ? <span className="text-faint">→</span> : null}
                <span className="rounded-sm bg-surface px-2.5 py-1 font-display text-lg">
                  {step}
                </span>
              </li>
            ))}
          </ol>
        </section>

        <section className="border-y border-line">
          <div className="mx-auto grid max-w-6xl gap-px bg-line md:grid-cols-3">
            {PRODUCTS.map((p) => (
              <article key={p.id} className="bg-bg p-6 sm:p-8">
                <p className="text-xs tracking-wide text-subtle uppercase">{p.forWhom}</p>
                <h2 className="mt-3 font-display text-3xl">{p.name}</h2>
                <p className="mt-3 text-sm leading-relaxed text-muted">{p.body}</p>
                <Button asChild className="mt-6" variant={p.id === "audit" ? "outline" : "default"}>
                  <Link to={p.href}>
                    {p.id === "research"
                      ? "Open Research"
                      : p.id === "operations"
                        ? "Open Operations"
                        : "You are here"}
                    <ArrowRight className="size-4" />
                  </Link>
                </Button>
              </article>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <p className="text-xs tracking-[0.22em] text-subtle uppercase">Evidence ledger</p>
          <h2 className="mt-3 font-display text-3xl sm:text-4xl">
            Every number wears a status.
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted">
            The zeta manuscript is the constitution. A sophisticated graph is not a
            finding because it is pretty. The held-out prime test was allowed to fail
            (p_emp = 0.70) without touching the exact identities.
          </p>
          <ol className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {EVIDENCE_ORDER.map((id) => (
              <li key={id} className="rounded-xl bg-surface p-4 shadow-[var(--shadow-panel)]">
                <Badge variant={EVIDENCE_TONE[id]}>{EVIDENCE_LABEL[id]}</Badge>
                <p className="mt-3 text-sm leading-relaxed text-muted">{EVIDENCE_NOTE[id]}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="bg-surface/50">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
            <p className="text-xs tracking-[0.22em] text-subtle uppercase">
              Coordinate registry
            </p>
            <h2 className="mt-3 font-display text-3xl">Not every ordered variable is time.</h2>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted">
              γ generates a phase curve. A timestamp is operational. A delay window is
              constructed. A 3D projection is only a view. These roles persist through
              the whole data model.
            </p>
            <dl className="mt-8 grid gap-3 sm:grid-cols-2">
              {(Object.keys(COORDINATE_NOTE) as (keyof typeof COORDINATE_NOTE)[]).map((role) => (
                <div key={role} className="rounded-xl bg-bg p-4">
                  <dt className="font-display text-xl">{role}</dt>
                  <dd className="mt-2 text-sm leading-relaxed text-muted">
                    {COORDINATE_NOTE[role]}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <p className="text-xs tracking-[0.22em] text-subtle uppercase">Complexity ladder</p>
          <h2 className="mt-3 font-display text-3xl">A method advances only if it beats the last one.</h2>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted">
            Persistent topology must outperform simpler temporal and multivariate models
            before it is promoted from an explanatory visualization to a production signal.
          </p>
          <ol className="mt-8 space-y-2">
            {LADDER.map((rung) => (
              <li
                key={rung.level}
                className="grid gap-3 rounded-xl bg-surface p-4 shadow-[var(--shadow-panel)] sm:grid-cols-[3.5rem_1fr_auto]"
              >
                <span className="font-mono text-xs text-subtle">L{rung.level}</span>
                <div>
                  <div className="font-display text-xl">{rung.title}</div>
                  <p className="mt-1 text-sm leading-relaxed text-muted">{rung.body}</p>
                </div>
                <Badge>{COMPUTE_RATE[rung.rate].target}</Badge>
              </li>
            ))}
          </ol>
        </section>

        <section className="border-y border-line">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
            <p className="text-xs tracking-[0.22em] text-subtle uppercase">Compute rates</p>
            <h2 className="mt-3 font-display text-3xl">Not every analysis at every tick.</h2>
            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {(Object.keys(COMPUTE_RATE) as (keyof typeof COMPUTE_RATE)[]).map((id) => {
                const r = COMPUTE_RATE[id];
                return (
                  <article key={id} className="rounded-xl bg-surface p-5">
                    <p className="text-xs tracking-wide text-subtle uppercase">{id}</p>
                    <h3 className="mt-2 font-display text-2xl">{r.target}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted">{r.examples}</p>
                    <p className="mt-3 text-xs leading-relaxed text-subtle">{r.claim}</p>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <p className="text-xs tracking-[0.22em] text-subtle uppercase">What transfers</p>
          <h2 className="mt-3 font-display text-3xl">Algorithms reuse. Interpretations do not.</h2>
          <div className="mt-8 overflow-x-auto">
            <table className="w-full min-w-[36rem] text-left text-sm">
              <thead>
                <tr className="border-b border-line text-subtle">
                  <th className="py-2 pr-4 font-medium">Capability</th>
                  <th className="py-2 pr-4 font-medium">Zeta</th>
                  <th className="py-2 pr-4 font-medium">Drilling</th>
                  <th className="py-2 font-medium">Reuse</th>
                </tr>
              </thead>
              <tbody>
                {TRANSFER.map((row) => (
                  <tr key={row.capability} className="border-b border-line/70">
                    <td className="py-3 pr-4 text-fg">{row.capability}</td>
                    <td className="py-3 pr-4 text-muted">{row.zeta}</td>
                    <td className="py-3 pr-4 text-muted">{row.drilling}</td>
                    <td className="py-3">
                      <Badge variant={row.reusable === "algorithm" ? "info" : "warn"}>
                        {row.reusable}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="bg-surface/50">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
            <p className="text-xs tracking-[0.22em] text-subtle uppercase">
              Corrections that keep the product honest
            </p>
            <h2 className="mt-3 font-display text-3xl">Hypotheses, not packaging.</h2>
            <ol className="mt-8 space-y-4">
              {CORRECTIONS.map((c) => (
                <li key={c.sold} className="rounded-xl bg-bg p-5">
                  <p className="text-sm text-fail line-through decoration-fail/40">{c.sold}</p>
                  <p className="mt-2 text-sm leading-relaxed text-muted">{c.better}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <p className="text-xs tracking-[0.22em] text-subtle uppercase">Positioning</p>
          <h2 className="mt-3 font-display text-3xl">Do not sell the costume.</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <article className="rounded-xl bg-surface p-5">
              <p className="text-xs tracking-wide text-subtle uppercase">Weak</p>
              <p className="mt-3 text-sm leading-relaxed text-muted">{POSITIONING.weak}</p>
            </article>
            <article className="rounded-xl bg-surface p-5">
              <p className="text-xs tracking-wide text-subtle uppercase">Strong</p>
              <p className="mt-3 text-sm leading-relaxed text-fg">{POSITIONING.strong}</p>
            </article>
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link to="/studio">Zeta reference</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/adapter">Drill a hole</Link>
            </Button>
          </div>
        </section>
      </main>
    </div>
  );
}
