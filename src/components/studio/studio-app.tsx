import { useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Download, FlaskConical, Menu, ShieldCheck, SlidersHorizontal, Wind } from "lucide-react";
import { toast } from "sonner";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip as RTooltip,
  XAxis,
  YAxis,
} from "recharts";
import { BrandMark } from "@/components/brand-mark";
import { AccountChip } from "@/components/account-chip";
import { OrbitCanvas } from "@/components/orbit-canvas";
import { OutcomeTape } from "@/components/adapter/outcome-tape";
import { SeedField } from "@/components/adapter/seed-field";
import { VvPanel } from "@/components/adapter/vv-panel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { Metric } from "@/components/studio/metric";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { describeVerdict } from "@/lib/meridian/analyze";
import { verifyStudio } from "@/lib/adapter/verify";
import { DOMAIN_META, DOMAIN_ORDER } from "@/lib/meridian/domains";
import { useStudio, type StudioTab } from "@/lib/meridian/store";
import { useAdapter } from "@/lib/adapter/store";
import type { AdapterSource, OutcomeKind, OutcomeRange } from "@/lib/adapter/types";
import { saveCertificate, saveProject } from "@/lib/projects";
import { cn, formatFixed, formatNum } from "@/lib/utils";

const Q_STEPS = [4, 8, 16, 32, 64, 128, 256];
const TABS: { id: StudioTab; label: string }[] = [
  { id: "geometry", label: "Geometry" },
  { id: "graphs", label: "Graphs" },
  { id: "operator", label: "Operator" },
  { id: "protocol", label: "Protocol" },
  { id: "synthesis", label: "Synthesis" },
  { id: "adapter", label: "Adapter" },
];

function Controls() {
  const domain = useStudio((s) => s.domain);
  const Q = useStudio((s) => s.Q);
  const k = useStudio((s) => s.k);
  const alpha = useStudio((s) => s.alpha);
  const windowKind = useStudio((s) => s.window);
  const customText = useStudio((s) => s.customText);
  const setDomain = useStudio((s) => s.setDomain);
  const setQ = useStudio((s) => s.setQ);
  const setK = useStudio((s) => s.setK);
  const setAlpha = useStudio((s) => s.setAlpha);
  const setWindow = useStudio((s) => s.setWindow);
  const setCustomText = useStudio((s) => s.setCustomText);
  const recompute = useStudio((s) => s.recompute);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-[11px] tracking-[0.16em] text-subtle uppercase">Domain</p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          {DOMAIN_ORDER.map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => setDomain(id)}
              className={cn(
                "rounded-md px-3 py-2.5 text-left text-sm shadow-[var(--shadow-panel)] transition-colors",
                domain === id ? "bg-accent text-accent-fg" : "bg-raised text-muted hover:text-fg",
              )}
            >
              {DOMAIN_META[id].short}
            </button>
          ))}
        </div>
        <p className="mt-3 text-xs leading-relaxed text-muted">{DOMAIN_META[domain].blurb}</p>
      </div>

      {domain === "custom" ? (
        <div className="space-y-2">
          <Label htmlFor="custom-series">Monotone ordinates</Label>
          <Textarea
            id="custom-series"
            value={customText}
            onChange={(e) => setCustomText(e.target.value)}
            placeholder="14.13, 21.02, 25.01"
          />
          <Button type="button" variant="secondary" size="sm" onClick={() => recompute()}>
            Embed series
          </Button>
        </div>
      ) : null}

      <Separator />

      <div>
        <div className="flex items-baseline justify-between">
          <Label>Cutoff Q</Label>
          <span className="font-mono text-xs text-fg tabular-nums">{Q}</span>
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {Q_STEPS.map((q) => (
            <button
              key={q}
              type="button"
              onClick={() => setQ(q)}
              className={cn(
                "h-8 rounded-sm px-2.5 font-mono text-xs",
                Q === q ? "bg-accent text-accent-fg" : "bg-raised text-muted",
              )}
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      <div>
        <div className="flex items-baseline justify-between">
          <Label>Neighbors k</Label>
          <span className="font-mono text-xs tabular-nums">{k}</span>
        </div>
        <Slider
          className="mt-3"
          min={4}
          max={16}
          step={2}
          value={[k]}
          onValueChange={(v) => setK(v[0] ?? 8)}
        />
      </div>

      <div>
        <div className="flex items-baseline justify-between">
          <Label>Log damping alpha</Label>
          <span className="font-mono text-xs tabular-nums">{formatFixed(alpha, 2)}</span>
        </div>
        <Slider
          className="mt-3"
          min={0}
          max={1}
          step={0.25}
          value={[alpha]}
          onValueChange={(v) => setAlpha(v[0] ?? 0)}
        />
        <p className="mt-2 text-xs text-subtle">
          Hard cutoff can raise RMSE. The damper α = 1 is the manuscript operator.
        </p>
      </div>

      <div>
        <Label>Window</Label>
        <div className="mt-2 flex gap-2">
          {(["hard", "master"] as const).map((w) => (
            <button
              key={w}
              type="button"
              onClick={() => setWindow(w)}
              className={cn(
                "h-9 flex-1 rounded-sm text-xs capitalize",
                windowKind === w ? "bg-accent text-accent-fg" : "bg-raised text-muted",
              )}
            >
              {w}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function GeometryPane() {
  const analysis = useStudio((s) => s.analysis);
  const vv = useMemo(
    () => (analysis ? verifyStudio(analysis.geometry, analysis.operator) : null),
    [analysis],
  );
  if (!analysis) return null;
  const g = analysis.geometry;
  const chart = g.expansion.map((p) => ({
    t: Number(p.t.toFixed(3)),
    exact: Number(p.exact.toFixed(4)),
    quadratic: Number(p.quad.toFixed(4)),
  }));
  return (
    <>
    <div className="grid gap-4 xl:grid-cols-[1.35fr_0.9fr]">
      <section className="overflow-hidden rounded-xl bg-surface p-3 shadow-[var(--shadow-panel)] sm:p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-xl">Rank-one orbit</h2>
          <Badge>PCA of Phi</Badge>
        </div>
        <div className="h-72 overflow-hidden rounded-lg bg-inset sm:h-80">
          <OrbitCanvas geometry={g} className="h-full w-full" />
        </div>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          Homogeneous unitary orbit with constant speed {formatFixed(g.measure.speed, 3)} and
          curvature {formatFixed(g.measure.curvature, 3)}. Closure dimension equals{" "}
          {g.measure.activePrimes} active primes — not the local tangent rank.
        </p>
      </section>
      <section className="rounded-xl bg-surface p-4 shadow-[var(--shadow-panel)]">
        <h2 className="font-display text-xl">Chord distance</h2>
        <div className="mt-3 h-52">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chart} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
              <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis dataKey="t" tick={{ fill: "#6b675f", fontSize: 11 }} />
              <YAxis tick={{ fill: "#6b675f", fontSize: 11 }} />
              <RTooltip
                contentStyle={{
                  background: "#18181c",
                  border: "1px solid #26252a",
                  borderRadius: 8,
                  fontSize: 12,
                }}
              />
              <Line type="monotone" dataKey="exact" stroke="#f2efe8" strokeWidth={1.6} dot={false} />
              <Line
                type="monotone"
                dataKey="quadratic"
                stroke="#8a96a3"
                strokeDasharray="4 4"
                strokeWidth={1.2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-4">
          <Metric label="Quadratic radius" value={g.quadraticRadius} />
          <Metric label="First reversal" value={g.firstReversal} />
          <Metric label="N effective" value={g.measure.neff} />
          <Metric
            label="Recurrence"
            value={g.recurrenceWitness.distance}
            hint={`gap ${formatNum(g.recurrenceWitness.gap, 0)}`}
          />
        </div>
      </section>
    </div>
    {vv ? (
      <div className="mt-4">
        <VvPanel vv={vv} />
      </div>
    ) : null}
    </>
  );
}

function GraphsPane() {
  const analysis = useStudio((s) => s.analysis);
  if (!analysis) return null;
  const g = analysis.geometry;
  const data = [
    { name: "Orbit window", cosine: g.orbitTangent },
    { name: "Zero neighbors", cosine: g.ordinateTangent },
    { name: "Feature kNN", cosine: g.featureTangent },
  ];
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <section className="rounded-xl bg-surface p-4 shadow-[var(--shadow-panel)]">
        <h2 className="font-display text-xl">Tangent recovery</h2>
        <p className="mt-2 text-sm text-muted">
          The rank-one certificate is a micro-window on the continuous orbit. Neighboring
          zeros already sit past that radius. Feature neighbors measure recurrence.
        </p>
        <div className="mt-5 h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
              <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis dataKey="name" tick={{ fill: "#9a968c", fontSize: 12 }} />
              <YAxis domain={[0, 1]} tick={{ fill: "#6b675f", fontSize: 11 }} />
              <RTooltip
                contentStyle={{
                  background: "#18181c",
                  border: "1px solid #26252a",
                  fontSize: 12,
                }}
              />
              <Bar dataKey="cosine" fill="#d7d2c8" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>
      <section className="rounded-xl bg-surface p-4 shadow-[var(--shadow-panel)]">
        <h2 className="font-display text-xl">Two graphs, one series</h2>
        <div className="mt-5 grid gap-5">
          <Metric
            label="Orbit-window cosine"
            value={g.orbitTangent}
            tone={g.orbitTangent > 0.97 ? "pass" : "warn"}
            hint="Continuous Φ, linear radius. This is the paper’s rank-one certificate."
          />
          <Metric
            label="Zero-neighbor cosine"
            value={g.ordinateTangent}
            hint="Discrete zeros. Mean gaps wind the fastest primes — not a failed theorem."
          />
          <Metric
            label="Feature-neighbor cosine"
            value={g.featureTangent}
            hint="Recurrence graph. Drops as Q grows."
          />
          <Metric
            label="Branch-local feature edges"
            value={g.branchEdges}
            hint="Fraction of feature edges inside the first monotone branch."
          />
          <p className="text-xs leading-relaxed text-muted">
            The published 0.991 is the orbit window, not the zero graph. Conflating them
            is how a spacing fact gets written up as a broken manifold.
          </p>
        </div>
      </section>
    </div>
  );
}

function OperatorPane() {
  const analysis = useStudio((s) => s.analysis);
  if (!analysis) return null;
  const o = analysis.operator;
  const data = o.index.map((n, i) => ({
    n,
    smooth: Number(o.residualSmooth[i]!.toFixed(4)),
    prime: Number(o.residualPerturbed[i]!.toFixed(4)),
  }));
  const gain = o.rmseSmooth - o.rmsePerturbed;
  return (
    <div className="grid gap-4">
      <section className="rounded-xl bg-surface p-4 shadow-[var(--shadow-panel)]">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-display text-xl">Prime-perturbed Weyl</h2>
            <p className="mt-1 max-w-xl text-sm text-muted">
              Target-free smooth quantiles plus a finite prime displacement. The damper
              α ≥ 1 is required — a hard cutoff can raise RMSE. Count-preserving, compact,
              not a Hilbert–Pólya operator.
            </p>
          </div>
          <Badge variant={gain > 0 ? "pass" : "warn"}>{gain > 0 ? "RMSE reduced" : "No reduction"}</Badge>
        </div>
        <div className="mt-5 h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
              <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis dataKey="n" tick={{ fill: "#6b675f", fontSize: 11 }} />
              <YAxis tick={{ fill: "#6b675f", fontSize: 11 }} />
              <RTooltip
                contentStyle={{
                  background: "#18181c",
                  border: "1px solid #26252a",
                  fontSize: 12,
                }}
              />
              <Line type="monotone" dataKey="smooth" stroke="#8a96a3" strokeWidth={1.3} dot={false} />
              <Line type="monotone" dataKey="prime" stroke="#d7d2c8" strokeWidth={1.6} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>
      <div className="grid gap-3 sm:grid-cols-4">
        <div className="rounded-xl bg-surface p-4 shadow-[var(--shadow-panel)]">
          <Metric label="Smooth RMSE" value={o.rmseSmooth} />
        </div>
        <div className="rounded-xl bg-surface p-4 shadow-[var(--shadow-panel)]">
          <Metric
            label="Perturbed RMSE"
            value={o.rmsePerturbed}
            tone={gain > 0 ? "pass" : "default"}
          />
        </div>
        <div className="rounded-xl bg-surface p-4 shadow-[var(--shadow-panel)]">
          <Metric label="Blocks improved" value={`${o.improvedBlocks}/${o.totalBlocks}`} />
        </div>
        <div className="rounded-xl bg-surface p-4 shadow-[var(--shadow-panel)]">
          <Metric label="Gain" value={gain} hint={`Q = ${o.Q}, alpha = ${o.alpha}`} />
        </div>
      </div>
    </div>
  );
}

function ProtocolPane() {
  const analysis = useStudio((s) => s.analysis);
  const ensureProtocol = useStudio((s) => s.ensureProtocol);
  useEffect(() => {
    ensureProtocol();
  }, [ensureProtocol]);
  if (!analysis) return null;
  const p = analysis.protocol;
  if (!p) {
    return (
      <section className="rounded-xl bg-surface p-6 shadow-[var(--shadow-panel)]">
        <p className="text-[11px] tracking-[0.18em] text-subtle uppercase">Frozen cell</p>
        <h2 className="mt-2 font-display text-2xl">Drawing the GUE ensemble…</h2>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted">
          Nineteen spacing replicates. This is the expensive test, so it only runs when you
          open this tab.
        </p>
      </section>
    );
  }
  const tone = p.verdict === "held-out" ? "pass" : p.verdict === "identity" ? "info" : "warn";
  const hist = p.gueScores.map((s, i) => ({ i: i + 1, score: Number(s.toFixed(3)) }));
  return (
    <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
      <section className="rounded-xl bg-surface p-4 shadow-[var(--shadow-panel)]">
        <div className="flex items-center gap-2">
          <ShieldCheck className="size-4 text-muted" />
          <h2 className="font-display text-xl">Frozen cell</h2>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Badge>Q = {p.cell.Q}</Badge>
          <Badge>k = {p.cell.k}</Badge>
          <Badge variant={tone}>
            {p.verdict === "held-out"
              ? "Candidate finding"
              : p.verdict === "identity"
                ? "Identity / null"
                : "Inconclusive"}
          </Badge>
        </div>
        <p className="mt-4 text-sm leading-relaxed text-muted">{describeVerdict(p.verdict)}</p>
        <div className="mt-5 grid grid-cols-2 gap-4">
          <Metric label="Primary score" value={p.primary} />
          <Metric label="Empirical p" value={p.pemp} />
          <Metric label="Hold-out primes" value={p.holdoutPrimes.join(", ")} />
          <Metric label="GUE draws" value={p.gueScores.length} />
        </div>
      </section>
      <section className="rounded-xl bg-surface p-4 shadow-[var(--shadow-panel)]">
        <h2 className="font-display text-xl">GUE reference</h2>
        <div className="mt-4 h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={hist}>
              <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis dataKey="i" tick={{ fill: "#6b675f", fontSize: 11 }} />
              <YAxis tick={{ fill: "#6b675f", fontSize: 11 }} />
              <Bar dataKey="score" fill="#8a96a3" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <p className="mt-3 text-xs text-subtle">
          Observed score is compared against matched GUE replicates. GUE and Poisson nulls
          test a spacing claim — they are not a test of whether a field theory is physically
          correct. A held-out win is a candidate cell, not a law.
        </p>
      </section>
    </div>
  );
}

function SynthesisPane() {
  const synthesis = useStudio((s) => s.synthesis);
  const computeSynthesis = useStudio((s) => s.computeSynthesis);
  useEffect(() => {
    if (!synthesis) computeSynthesis();
  }, [synthesis, computeSynthesis]);
  if (!synthesis) {
    return <div className="rounded-xl bg-surface p-8 text-sm text-muted">Comparing domains…</div>;
  }
  return (
    <div className="space-y-4">
      <section className="rounded-xl bg-surface p-4 shadow-[var(--shadow-panel)]">
        <h2 className="font-display text-xl">Cross-domain signatures</h2>
        <p className="mt-2 max-w-2xl text-sm text-muted">
          The same kernel is applied to every library series. Shared geometry is an identity of the
          map. Transfer that still beats a spacing null is the only thing counted as discovery.
        </p>
        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[36rem] text-left text-sm">
            <thead className="text-[11px] tracking-wide text-subtle uppercase">
              <tr>
                <th className="pb-2 font-medium">Domain</th>
                <th className="pb-2 font-medium">Speed</th>
                <th className="pb-2 font-medium">Curvature</th>
                <th className="pb-2 font-medium">Tangent</th>
                <th className="pb-2 font-medium">N_eff</th>
                <th className="pb-2 font-medium">Operator gain</th>
              </tr>
            </thead>
            <tbody>
              {synthesis.map((row) => (
                <tr key={row.domain} className="border-t border-line">
                  <td className="py-3 text-fg">{DOMAIN_META[row.domain].name}</td>
                  <td className="py-3 font-mono tabular-nums">{formatFixed(row.speed)}</td>
                  <td className="py-3 font-mono tabular-nums">{formatFixed(row.curvature)}</td>
                  <td className="py-3 font-mono tabular-nums">{formatFixed(row.tangent)}</td>
                  <td className="py-3 font-mono tabular-nums">{formatFixed(row.neff)}</td>
                  <td
                    className={cn(
                      "py-3 font-mono tabular-nums",
                      row.operatorGain > 0 ? "text-pass" : "text-muted",
                    )}
                  >
                    {formatFixed(row.operatorGain)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function AdapterPane() {
  const domain = useStudio((s) => s.domain);
  const customText = useStudio((s) => s.customText);
  const report = useAdapter((s) => s.report);
  const released = useAdapter((s) => s.released);
  const selected = useAdapter((s) => s.selected);
  const level = useAdapter((s) => s.level);
  const setSource = useAdapter((s) => s.setSource);
  const setPrompt = useAdapter((s) => s.setPrompt);
  const recompute = useAdapter((s) => s.recompute);
  const release = useAdapter((s) => s.release);
  const selectOutcome = useAdapter((s) => s.selectOutcome);
  const setNowIndex = useAdapter((s) => s.setNowIndex);
  const source = useAdapter((s) => s.source);

  useEffect(() => {
    const next: AdapterSource = domain === "custom" ? "custom" : domain;
    if (source !== next) setSource(next);
    if (domain === "custom" && customText.trim()) {
      setPrompt(customText);
      recompute();
    }
  }, [domain, customText, source, setSource, setPrompt, recompute]);

  const kindBadge: Record<OutcomeKind, "pass" | "info" | "warn"> = {
    known: "pass",
    perceived: "info",
    speculative: "warn",
  };
  const modality: Record<OutcomeRange["modality"], string> = {
    necessary: "interior",
    possible: "possible",
    unentailed: "unentailed",
  };

  return (
    <div className="grid gap-4 xl:grid-cols-[1.35fr_0.9fr]">
      <section className="overflow-hidden rounded-xl bg-surface p-3 shadow-[var(--shadow-panel)] sm:p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-display text-xl">Outcome field</h2>
          <div className="flex items-center gap-2">
            <Badge variant={report.continuity > 0.62 ? "pass" : "warn"}>
              Continuity {formatFixed(report.continuity, 2)}
            </Badge>
            <Badge variant={report.planContinuous ? "pass" : "warn"}>
              {report.planContinuous ? "Continuous plan" : "Plan jumps"}
            </Badge>
            {report.graphs ? (
              <Badge variant={report.graphs.contamination > 0.35 ? "warn" : "info"}>
                Recurrence {Math.round(report.graphs.contamination * 100)}%
              </Badge>
            ) : null}
            <Button type="button" size="sm" onClick={() => release()}>
              <Wind className="size-3.5" />
              Release
            </Button>
          </div>
        </div>
        <div className="h-72 overflow-hidden rounded-lg bg-inset sm:h-80">
          <SeedField
            report={report}
            released={released}
            selected={selected}
            level={level}
            onSelect={selectOutcome}
            onNow={setNowIndex}
            className="h-full w-full"
          />
        </div>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          {report.nowCaption}
        </p>
        <div className="mt-3">
          <OutcomeTape report={report} onNow={setNowIndex} />
        </div>
        <p className="mt-3 text-sm leading-relaxed text-fg">
          From here: {report.horizon.nextTitle}. {report.horizon.reading}
        </p>
      </section>
      <section className="rounded-xl bg-surface p-4 shadow-[var(--shadow-panel)]">
        <h2 className="font-display text-xl">Ranges</h2>
        <div className="mt-4 space-y-4">
          {report.outcomes.map((o) => (
            <button
              key={o.id}
              type="button"
              onClick={() => selectOutcome(o.id)}
              className="block min-h-11 w-full rounded-md bg-raised px-3 py-3 text-left"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex flex-wrap gap-1.5">
                  <Badge variant={kindBadge[o.kind]}>{o.kind}</Badge>
                  <Badge>{modality[o.modality]}</Badge>
                </div>
                <span className="font-mono text-[11px] text-subtle tabular-nums">
                  {formatFixed(o.low, 2)}–{formatFixed(o.high, 2)}
                </span>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-muted">{o.reading}</p>
            </button>
          ))}
        </div>
        {report.sequences[0] ? (
          <>
            <Separator className="my-4" />
            <p className="text-[11px] tracking-[0.16em] text-subtle uppercase">Sequence</p>
            <p className="mt-2 text-sm text-fg">{report.sequences[0].label}</p>
            <p className="mt-1 text-xs leading-relaxed text-muted">{report.sequences[0].note}</p>
          </>
        ) : null}
        <Separator className="my-4" />
        <p className="text-[11px] tracking-[0.16em] text-subtle uppercase">Two sheaf tests</p>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <div>
            <div className="text-[11px] text-subtle">δ² / restrict</div>
            <div className="mt-1 font-mono text-sm tabular-nums">
              {report.sheaf.coboundaryNilpotent ? "0" : report.sheaf.coboundaryResidual.toExponential(1)}
              {" · "}
              {report.sheaf.restrictionCompatible ? "compose" : "fail"}
            </div>
          </div>
          <div>
            <div className="text-[11px] text-subtle">|K| / Σ K</div>
            <div className="mt-1 font-mono text-sm tabular-nums">
              {formatFixed(report.sheaf.meanHolonomy, 3)} / {formatFixed(report.sheaf.bianchiResidual, 3)}
            </div>
          </div>
          <div>
            <div className="text-[11px] text-subtle">Type I / II</div>
            <div className="mt-1 font-mono text-sm tabular-nums">
              {report.regime.typeI} / {report.regime.typeII}
            </div>
          </div>
          <div>
            <div className="text-[11px] text-subtle">2-view</div>
            <div className="mt-1 font-mono text-sm tabular-nums">
              {(report.sheaf.explainedVariance * 100).toFixed(0)}%
            </div>
          </div>
        </div>
        <p className="mt-4 text-xs text-subtle">
          Holonomy {formatFixed(report.sheaf.meanHolonomy, 3)} is curvature of ds/v, not a
          failed bundle. 2-view residual {formatFixed(report.sheaf.viewResidual, 2)} — chosen,
          not discovered. {report.sheaf.timeNote}
        </p>
      </section>
    </div>
  );
}

function Inspector() {
  const analysis = useStudio((s) => s.analysis);
  const ensureProtocol = useStudio((s) => s.ensureProtocol);
  const { user } = useCurrentUserState();
  const domain = useStudio((s) => s.domain);
  const Q = useStudio((s) => s.Q);
  const k = useStudio((s) => s.k);
  const alpha = useStudio((s) => s.alpha);
  const windowKind = useStudio((s) => s.window);

  if (!analysis) return null;
  const current = analysis;
  const g = current.geometry;
  const p = current.protocol;

  async function persist() {
    if (!user) {
      toast("Sign in to keep a project or certificate.");
      return;
    }
    if (!p) {
      ensureProtocol();
      toast("Open Protocol to freeze the GUE cell, then store.");
      return;
    }
    try {
      const saved = await saveProject({
        data: {
          name: `${current.series.short} · Q${Q}`,
          domain,
          config: { Q, k, alpha, window: windowKind },
        },
      });
      await saveCertificate({
        data: {
          projectId: saved.id,
          title: `${current.series.name} frozen cell`,
          verdict: p.verdict,
          payload: {
            pemp: p.pemp,
            primary: p.primary,
            rmse: current.operator.rmsePerturbed,
            tangent: g.orbitTangent,
            vv: (() => {
              const v = verifyStudio(g, current.operator);
              return {
                headline: v.headline,
                criticalFailed: v.criticalFailed,
                passed: v.passed,
              };
            })(),
          },
        },
      });
      toast("Certificate stored to your workspace.");
    } catch {
      toast("Could not store the certificate. Sign in and retry.");
    }
  }

  function exportJson() {
    const blob = new Blob(
      [
        JSON.stringify(
          {
            series: current.series.name,
            domain,
            params: { Q, k, alpha, window: windowKind },
            measure: {
              speed: g.measure.speed,
              curvature: g.measure.curvature,
              neff: g.measure.neff,
              primes: g.measure.activePrimes,
            },
            tangent: {
              orbit: g.orbitTangent,
              ordinate: g.ordinateTangent,
              feature: g.featureTangent,
            },
            operator: {
              rmseSmooth: current.operator.rmseSmooth,
              rmsePerturbed: current.operator.rmsePerturbed,
              improvedBlocks: current.operator.improvedBlocks,
              totalBlocks: current.operator.totalBlocks,
              alpha: current.operator.alpha,
            },
            vv: (() => {
              const v = verifyStudio(g, current.operator);
              return {
                headline: v.headline,
                criticalFailed: v.criticalFailed,
                passed: v.passed,
                failed: v.failed,
                checks: v.checks.map((c) => ({
                  id: c.id,
                  ok: c.ok,
                  merit: c.merit,
                  got: c.got,
                })),
              };
            })(),
            protocol: p,
            disclaimer:
              "Finite necessary-condition certificate. Not RH, not a Hilbert-Polya realization.",
          },
          null,
          2,
        ),
      ],
      { type: "application/json" },
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `meridian-${domain}-q${Q}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <aside className="space-y-5">
      <div>
        <p className="text-[11px] tracking-[0.16em] text-subtle uppercase">Measure</p>
        <div className="mt-3 space-y-4">
          <Metric label="Speed" value={g.measure.speed} />
          <Metric label="Curvature" value={g.measure.curvature} />
          <Metric label="Active primes" value={g.measure.activePrimes} />
          <Metric label="Zeros / events" value={current.series.ordinates.length} />
        </div>
      </div>
      <Separator />
      <div>
        <p className="text-[11px] tracking-[0.16em] text-subtle uppercase">Boundary</p>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          {p
            ? p.verdict === "identity"
              ? "This cell is an identity of the construction. Do not publish it as a finding."
              : describeVerdict(p.verdict)
            : "Open Protocol to freeze the GUE cell. Geometry and the operator are already computed."}
        </p>
      </div>
      <div className="flex flex-col gap-2">
        <Button type="button" onClick={() => void persist()}>
          <FlaskConical className="size-4" />
          Freeze certificate
        </Button>
        <Button type="button" variant="secondary" onClick={exportJson}>
          <Download className="size-4" />
          Export JSON
        </Button>
      </div>
    </aside>
  );
}

function StudioLoading() {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="h-80 animate-pulse rounded-xl bg-surface" />
      <div className="h-80 animate-pulse rounded-xl bg-surface" />
    </div>
  );
}

function ensureStudioAnalysis() {
  const s = useStudio.getState();
  if (!s.analysis) s.recompute();
}

export function StudioApp() {
  ensureStudioAnalysis();
  const analysis = useStudio((s) => s.analysis);
  const tab = useStudio((s) => s.tab);
  const setTab = useStudio((s) => s.setTab);
  const [mobile, setMobile] = useState<"controls" | "inspect" | null>(null);

  const pane = useMemo(() => {
    if (tab === "geometry") return <GeometryPane />;
    if (tab === "graphs") return <GraphsPane />;
    if (tab === "operator") return <OperatorPane />;
    if (tab === "protocol") return <ProtocolPane />;
    if (tab === "adapter") return <AdapterPane />;
    return <SynthesisPane />;
  }, [tab]);

  return (
    <div className="flex min-h-dvh flex-col bg-bg text-fg">
      <header className="flex h-14 items-center justify-between border-b border-line px-3 sm:px-4">
        <div className="flex items-center gap-3">
          <Link to="/" className="text-fg">
            <BrandMark />
          </Link>
          <span className="hidden text-xs text-subtle sm:inline">Discovery studio</span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="lg:hidden"
            onClick={() => setMobile("controls")}
            aria-label="Parameters"
          >
            <SlidersHorizontal className="size-4" />
          </Button>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="lg:hidden"
            onClick={() => setMobile("inspect")}
            aria-label="Inspector"
          >
            <Menu className="size-4" />
          </Button>
          <AccountChip />
        </div>
      </header>
      <div className="flex min-h-0 flex-1">
        <aside className="hidden w-72 shrink-0 overflow-y-auto border-r border-line p-4 lg:block">
          <Controls />
        </aside>
        <main className="min-w-0 flex-1 overflow-y-auto">
          <div className="border-b border-line px-3 pt-3 sm:px-5">
            <div className="flex gap-1 overflow-x-auto pb-3">
              {TABS.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTab(t.id)}
                  className={cn(
                    "h-9 shrink-0 rounded-sm px-3 text-sm",
                    tab === t.id ? "bg-raised text-fg" : "text-muted hover:text-fg",
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
          <div className="p-3 sm:p-5">{analysis ? pane : <StudioLoading />}</div>
        </main>
        <aside className="hidden w-72 shrink-0 overflow-y-auto border-l border-line p-5 xl:block">
          <Inspector />
        </aside>
      </div>
      <Sheet open={mobile === "controls"} onOpenChange={(o) => !o && setMobile(null)}>
        <SheetContent side="left">
          <SheetHeader>
            <SheetTitle>Parameters</SheetTitle>
          </SheetHeader>
          <div className="overflow-y-auto">
            <Controls />
          </div>
        </SheetContent>
      </Sheet>
      <Sheet open={mobile === "inspect"} onOpenChange={(o) => !o && setMobile(null)}>
        <SheetContent side="right">
          <SheetHeader>
            <SheetTitle>Inspector</SheetTitle>
          </SheetHeader>
          <Inspector />
        </SheetContent>
      </Sheet>
    </div>
  );
}
