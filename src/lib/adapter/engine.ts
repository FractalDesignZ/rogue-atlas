import { roleFor } from "../atlas/ingest";
import { marketSeries, pulseSeries, climateSeries, spectraSeries } from "@/lib/meridian/domains";
import { ZETA_ZEROS } from "@/lib/meridian/zeros";
import { clamp } from "@/lib/utils";
import { analyzeDec, transitionValue } from "./dec";
import { claimLedger } from "./claims";
import { metricCeiling } from "./ceiling";
import { drillOrdinates } from "./drilling";
import { buildGraphs, pathCosts, planeTangents } from "./graphs";
import { runNull } from "./nulls";
import { orbitClosure } from "./orbit";
import { provenanceOf } from "./provenance";
import { persistField } from "./filtration";
import { computeHorizon } from "./horizon";
import { modeStack } from "./modes";
import { verifyAdapter } from "./verify";
import {
  middleOutSplit,
  openCurveFromStates,
  openCurveFromXYZ,
  wellboreOrdinates,
  wellboreSurvey,
} from "./wellbore";
import {
  buildLadder,
  findPrimes,
  languageShifts,
  mapSequences,
  nowCaption,
  ordinatesFromCustom,
  parseCustomSeries,
} from "./structure";
import type {
  ActivityState,
  AdapterReport,
  AdapterSource,
  ConditionState,
  GeodesicStep,
  OpenSet,
  OutcomeKind,
  OutcomeRange,
  RegimeId,
  SheafReport,
  ValueWeights,
} from "./types";

const CONTRAST =
  /\b(but|however|then|suddenly|instead|except|although|yet|jump|jumped|leapt|leaped|gap|gapped|skip|skipped|break|broke|not sure|claim)\b/i;
const HOLD =
  /\b(quiet|still|even|hold|held|ordinary|calm|settle|settled|lock|locked|boring|same|again|rain|season)\b/i;
const UNCERTAIN = /\b(maybe|perhaps|might|not sure|could|wonder|if)\b/i;

function mean(xs: number[]): number {
  if (!xs.length) return 0;
  return xs.reduce((a, b) => a + b, 0) / xs.length;
}

function variance(xs: number[]): number {
  if (xs.length < 2) return 0;
  const m = mean(xs);
  return xs.reduce((s, x) => s + (x - m) ** 2, 0) / (xs.length - 1);
}

function median(xs: number[]): number {
  if (!xs.length) return 0;
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m]! : 0.5 * (s[m - 1]! + s[m]!);
}

function quantile(xs: number[], q: number): number {
  if (!xs.length) return 0;
  const s = [...xs].sort((a, b) => a - b);
  const i = clamp(q, 0, 1) * (s.length - 1);
  const lo = Math.floor(i);
  const hi = Math.ceil(i);
  const t = i - lo;
  return s[lo]! * (1 - t) + s[hi]! * t;
}

function hashPhrase(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) / 4294967296;
}

function splitClauses(text: string): string[] {
  const raw = text
    .split(/(?<=[.!?])\s+|(?<=,)\s+|\n+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 2);
  return raw.length >= 3 ? raw : text.trim() ? [text.trim()] : [];
}

function clauseGap(clause: string, prev: string): number {
  const words = clause.split(/\s+/).filter(Boolean);
  let g = 0.55 + 0.08 * Math.min(words.length, 12);
  if (CONTRAST.test(clause) || CONTRAST.test(`${prev} ${clause}`)) g += 1.15;
  if (HOLD.test(clause)) g *= 0.62;
  if (UNCERTAIN.test(clause)) g += 0.35;
  if (/\?/.test(clause)) g += 0.28;
  g += 0.12 * hashPhrase(clause);
  return Math.max(0.12, g);
}

export function thoughtOrdinates(text: string): { t: number[]; labels: string[] } {
  const clauses = splitClauses(text);
  const base = clauses.length >= 3
    ? clauses
    : [
        ...clauses,
        "The field holds.",
        "A small change arrives.",
        "I wait to see what continues.",
      ].slice(0, 6);

  const t: number[] = [];
  const labels: string[] = [];
  let cursor = 0;
  let prev = "";
  for (const clause of base) {
    const words = clause.split(/\s+/).filter(Boolean);
    const g = clauseGap(clause, prev);
    const steps = Math.max(2, Math.min(5, Math.ceil(words.length / 3)));
    for (let s = 0; s < steps; s++) {
      const frac = (s + 1) / steps;
      const local = g * (0.35 + 0.65 * frac);
      cursor += local / steps + 0.08;
      t.push(cursor);
      const slice = words.slice(
        Math.floor((s * words.length) / steps),
        Math.max(Math.floor(((s + 1) * words.length) / steps), 1),
      );
      labels.push(slice.join(" ") || clause);
    }
    prev = clause;
  }
  return { t, labels };
}

function seriesForSource(source: AdapterSource, prompt: string): { t: number[]; labels: string[] } {
  if (source === "thought") return thoughtOrdinates(prompt);
  if (source === "custom") {
    const nums = parseCustomSeries(prompt);
    if (nums.length >= 6) {
      const t = ordinatesFromCustom(nums).slice(0, 160);
      return { t, labels: t.map((_, i) => `x${i + 1}`) };
    }
    return thoughtOrdinates(prompt);
  }
  const raw =
    source === "zeta"
      ? ZETA_ZEROS.slice(0, 96)
      : source === "markets"
        ? marketSeries()
        : source === "pulse"
          ? pulseSeries()
          : source === "climate"
            ? climateSeries()
            : source === "wellbore"
              ? wellboreOrdinates().t
              : spectraSeries();
  if (source === "wellbore") {
    const wb = wellboreOrdinates();
    return { t: wb.t, labels: wb.labels };
  }
  if (source === "drill") return drillOrdinates();
  return {
    t: raw,
    labels: raw.map((_, i) => `event ${i + 1}`),
  };
}

function localSpeed(gaps: number[], i: number): number {
  const a = gaps[Math.max(0, i - 1)] ?? gaps[i] ?? 0;
  const b = gaps[i] ?? a;
  const c = gaps[Math.min(gaps.length - 1, i + 1)] ?? b;
  return (a + b + c) / 3;
}

function localCurv(gaps: number[], i: number): number {
  const a = gaps[Math.max(0, i - 1)] ?? gaps[i] ?? 0;
  const b = gaps[i] ?? a;
  const c = gaps[Math.min(gaps.length - 1, i + 1)] ?? b;
  return Math.abs(a - 2 * b + c);
}

function embed2(states: Omit<ConditionState, "x" | "y">[]): {
  states: ConditionState[];
  explainedVariance: number;
  viewResidual: number;
} {
  const n = states.length;
  if (!n) return { states: [], explainedVariance: 1, viewResidual: 0 };
  const feat = states.map((s) => [s.t, s.gap, s.speed, s.curvature, s.surprise]);
  const mu = [0, 0, 0, 0, 0];
  for (const f of feat) for (let k = 0; k < 5; k++) mu[k]! += f[k]!;
  for (let k = 0; k < 5; k++) mu[k]! /= n;
  const sd = [0, 0, 0, 0, 0];
  for (const f of feat) for (let k = 0; k < 5; k++) sd[k]! += (f[k]! - mu[k]!) ** 2;
  for (let k = 0; k < 5; k++) sd[k] = Math.sqrt(sd[k]! / n) || 1;

  const z = feat.map((f) => f.map((v, k) => (v - mu[k]!) / sd[k]!));
  let a1 = [0.51, 0.41, 0.38, 0.44, 0.48];
  let a2 = [0.22, -0.62, 0.55, -0.31, 0.4];
  const dot = (u: number[], v: number[]) => u.reduce((s, x, i) => s + x * (v[i] ?? 0), 0);
  const norm = (u: number[]) => {
    const nrm = Math.sqrt(Math.max(dot(u, u), 1e-12));
    return u.map((x) => x / nrm);
  };
  for (let it = 0; it < 18; it++) {
    const acc = [0, 0, 0, 0, 0];
    for (const r of z) {
      const c = dot(r, a1);
      for (let k = 0; k < 5; k++) acc[k]! += c * r[k]!;
    }
    a1 = norm(acc);
  }
  a2 = norm(a2.map((v, k) => v - a1[k]! * dot(a2, a1)));
  for (let it = 0; it < 14; it++) {
    const acc = [0, 0, 0, 0, 0];
    for (const r of z) {
      const defl = r.map((v, k) => v - a1[k]! * dot(r, a1));
      const c = dot(defl, a2);
      for (let k = 0; k < 5; k++) acc[k]! += c * defl[k]!;
    }
    a2 = norm(acc.map((v, k) => v - a1[k]! * dot(acc, a1)));
  }

  let capt = 0;
  let tot = 0;
  for (const r of z) {
    tot += dot(r, r);
    capt += dot(r, a1) ** 2 + dot(r, a2) ** 2;
  }
  const explainedVariance = tot === 0 ? 1 : clamp(capt / tot, 0, 1);

  return {
    states: states.map((s, i) => ({
      ...s,
      x: dot(z[i]!, a1),
      y: dot(z[i]!, a2),
    })),
    explainedVariance,
    viewResidual: 1 - explainedVariance,
  };
}

function spreadIfFlat(states: ConditionState[]): ConditionState[] {
  const xs = states.map((s) => s.x);
  const ys = states.map((s) => s.y);
  const rx = Math.max(...xs) - Math.min(...xs);
  const ry = Math.max(...ys) - Math.min(...ys);
  const n = states.length;
  return states.map((s, i) => {
    const a = -Math.PI * 0.55 + (i / Math.max(n - 1, 1)) * Math.PI * 1.15;
    const rad = 0.85 + 0.55 * (i / Math.max(n - 1, 1)) + s.surprise * 0.45;
    const fx = Math.cos(a) * rad;
    const fy = Math.sin(a) * rad;
    const mix = rx < 0.55 || ry < 0.55 ? 0.82 : 0.38;
    return { ...s, x: s.x * (1 - mix) + fx * mix, y: s.y * (1 - mix) + fy * mix };
  });
}

function knn(states: ConditionState[], i: number, k: number): number[] {
  const scored = states
    .map((s, j) => ({
      j,
      d: i === j ? Infinity : Math.hypot(s.x - states[i]!.x, s.y - states[i]!.y),
    }))
    .sort((a, b) => a.d - b.d);
  return scored.slice(0, k).map((s) => s.j);
}

function buildOpenSets(states: ConditionState[], k = 5): OpenSet[] {
  const radii: number[] = [];
  const neighborhoods = states.map((_, i) => {
    const nbrs = knn(states, i, k);
    const last = nbrs[nbrs.length - 1] ?? i;
    const r = Math.hypot(states[i]!.x - states[last]!.x, states[i]!.y - states[last]!.y);
    radii.push(r);
    return { nbrs, r };
  });
  const med = median(radii) || 1;
  const used = new Set<number>();
  const opens: OpenSet[] = [];
  const order = states
    .map((_, i) => i)
    .sort((a, b) => neighborhoods[a]!.r - neighborhoods[b]!.r);
  for (const i of order) {
    if (used.has(i)) continue;
    const r = Math.max(neighborhoods[i]!.r, med * 0.65);
    const members = states
      .map((s, j) => ({
        j,
        d: Math.hypot(s.x - states[i]!.x, s.y - states[i]!.y),
      }))
      .filter((p) => p.d <= r * 1.12)
      .map((p) => p.j);
    if (members.length < 2) continue;
    for (const m of members) used.add(m);
    const gaps = members.map((m) => states[m]!.gap);
    const property =
      variance(gaps) < 0.08 * (mean(gaps) ** 2 + 0.05)
        ? "robust interior"
        : mean(members.map((m) => states[m]!.curvature)) > median(states.map((s) => s.curvature))
          ? "boundary layer"
          : "coherent neighborhood";
    opens.push({ id: opens.length, center: i, members, radius: r, property });
  }
  return opens;
}

function connectedComponents(states: ConditionState[], radius: number): number[][] {
  const n = states.length;
  const seen = new Array<boolean>(n).fill(false);
  const comps: number[][] = [];
  for (let i = 0; i < n; i++) {
    if (seen[i]) continue;
    const stack = [i];
    const comp: number[] = [];
    seen[i] = true;
    while (stack.length) {
      const u = stack.pop()!;
      comp.push(u);
      for (let v = 0; v < n; v++) {
        if (seen[v]) continue;
        if (Math.hypot(states[u]!.x - states[v]!.x, states[u]!.y - states[v]!.y) <= radius) {
          seen[v] = true;
          stack.push(v);
        }
      }
    }
    comps.push(comp);
  }
  return comps;
}

function countLoops(states: ConditionState[], radius: number): number {
  const n = states.length;
  let edges = 0;
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      if (Math.hypot(states[i]!.x - states[j]!.x, states[i]!.y - states[j]!.y) <= radius) edges += 1;
    }
  }
  const comps = connectedComponents(states, radius);
  const v = n;
  const c = comps.length;
  return Math.max(0, edges - v + c);
}

function classifyRegime(states: ConditionState[], opens: OpenSet[]): ActivityState {
  const medR = median(opens.map((o) => o.radius)) || 1;
  const comps = connectedComponents(states, medR * 1.05);
  const betti0 = comps.length;
  const betti1 = countLoops(states, medR * 1.05);
  const fisher = variance(states.map((s) => s.gap)) / (mean(states.map((s) => s.gap)) ** 2 + 1e-6);
  const jumps = states.filter((s) => s.gap > quantile(states.map((x) => x.gap), 0.86)).length;
  let id: RegimeId = "ordered";
  if (fisher > 0.55 && betti0 > 2) id = "disordered";
  else if (jumps >= 2 && fisher > 0.28) id = "critical";
  else if (betti1 >= 2 || (betti0 > 1 && fisher > 0.2)) id = "transition";
  const catalog: Record<RegimeId, { label: string; note: string }> = {
    ordered: {
      label: "Ordered",
      note: "One interior, low Fisher. Continuations stay inside a robust open set.",
    },
    critical: {
      label: "Critical",
      note: "Metric is sensitive — a Type-I cliff. Small inputs change the reading.",
    },
    disordered: {
      label: "Disordered",
      note: "Several components. Neighborhoods do not cover the story.",
    },
    transition: {
      label: "Transition",
      note: "Loops or a split basin. The mosaic is changing activity:state.",
    },
  };
  return { id, ...catalog[id], betti0, betti1, fisher, typeI: 0, typeII: 0 };
}

function sheafFromDec(dec: ReturnType<typeof analyzeDec>): SheafReport {
  return {
    triangles: dec.triangles,
    tets: dec.tets,
    edges: dec.edges,
    meanHolonomy: dec.meanHolonomy,
    meanCurvatureF: dec.meanCurvatureF,
    holonomyNote: dec.note,
    bianchiResidual: dec.bianchiResidual,
    coboundaryResidual: dec.coboundaryResidual,
    coboundaryNilpotent: dec.coboundaryNilpotent,
    restrictionResidual: dec.restrictionResidual,
    restrictionCompatible: dec.restrictionCompatible,
    glueingResidual: dec.glueingResidual,
    viewResidual: dec.viewResidual,
    explainedVariance: dec.explainedVariance,
    maxWasserstein: dec.maxWasserstein,
    shiabClaimed: false,
    lorentzianClaimed: false,
    pcaDiscoversDimension: false,
    timeNote:
      "The series parameter t is an evolution coordinate. It is not a fifteenth physical dimension.",
    spectralGap: dec.spectralGap,
  };
}

function detectJumps(
  states: ConditionState[],
  opens: OpenSet[],
  wasserstein: number[],
): { from: number; to: number; size: number }[] {
  const medR = median(opens.map((o) => o.radius)) || 1;
  const wCut = Math.max(quantile(wasserstein, 0.82), 1e-6);
  const out: { from: number; to: number; size: number }[] = [];
  for (let i = 1; i < states.length; i++) {
    const d = Math.hypot(states[i]!.x - states[i - 1]!.x, states[i]!.y - states[i - 1]!.y);
    const g = states[i]!.gap;
    const w = wasserstein[i] ?? 0;
    if (d > medR * 1.35 || g > quantile(states.map((s) => s.gap), 0.88) || w > wCut * 1.15) {
      out.push({ from: i - 1, to: i, size: Math.max(d / medR, w / (wCut + 1e-6), g) });
    }
  }
  return out;
}

function scoreValue(s: ConditionState, w: ValueWeights, all: ConditionState[]): number {
  const gaps = all.map((x) => x.gap);
  const medG = median(gaps) || 1;
  const continuity = Math.exp(-((s.gap - medG) ** 2) / (2 * (medG * 0.7) ** 2 + 1e-6));
  const novelty = clamp(s.surprise, 0, 1);
  const stability = Math.exp(-s.curvature * 3.2);
  const lev =
    all.length < 3
      ? 0.4
      : (() => {
          const nbrs = knn(all, s.i, 3);
          const vs = nbrs.map((j) => all[j]!.surprise);
          return clamp(Math.abs(s.surprise - mean(vs)) * 2.4, 0, 1);
        })();
  const raw =
    w.continuity * continuity +
    w.novelty * novelty +
    w.stability * stability +
    w.leverage * lev;
  return Math.max(0.04, raw);
}

function walkGeodesic(
  states: ConditionState[],
  values: number[],
  w: ValueWeights,
  wasserstein: number[],
  typeIField: number[],
): number[] {
  if (states.length < 2) return states.map((s) => s.i);
  const start = 0;
  const n = states.length;
  const cost = (i: number, j: number) => {
    const tv = transitionValue(states[i]!, states[j]!, wasserstein[j] ?? 0, typeIField[j] ?? 0);
    const well = Math.hypot(states[i]!.x - states[j]!.x, states[i]!.y - states[j]!.y);
    const attract = 0.5 * (values[i]! + values[j]!);
    const gravity = well / Math.max(attract, 0.06);
    const refuse = tv.v < 0 ? w.continuity * Math.abs(tv.v) : 0;
    return gravity + refuse + w.leverage * (1 - clamp(typeIField[j] ?? 0, 0, 1)) * 0.05;
  };
  const dist = new Array<number>(n).fill(Infinity);
  const prev = new Array<number>(n).fill(-1);
  const used = new Array<boolean>(n).fill(false);
  dist[start] = 0;
  for (let step = 0; step < n; step++) {
    let u = -1;
    let best = Infinity;
    for (let i = 0; i < n; i++) {
      if (!used[i] && dist[i]! < best) {
        best = dist[i]!;
        u = i;
      }
    }
    if (u < 0) break;
    used[u] = true;
    const nbrs = new Set(knn(states, u, 7));
    if (u + 1 < n) nbrs.add(u + 1);
    if (u - 1 >= 0) nbrs.add(u - 1);
    for (const v of nbrs) {
      const alt = dist[u]! + cost(u, v);
      if (alt < dist[v]!) {
        dist[v] = alt;
        prev[v] = u;
      }
    }
  }
  let end = 0;
  let bestV = -Infinity;
  for (let i = 0; i < n; i++) {
    if (!Number.isFinite(dist[i])) continue;
    const score = values[i]! - 0.08 * dist[i]!;
    if (score > bestV) {
      bestV = score;
      end = i;
    }
  }
  const path: number[] = [];
  for (let u = end; u >= 0; u = prev[u]!) path.push(u);
  path.reverse();
  if (path[0] !== 0) path.unshift(0);
  return path;
}

function clusterBasins(states: ConditionState[], values: number[], opens: OpenSet[]): number[][] {
  const peaks: number[] = [];
  for (const o of opens) {
    let best = o.members[0] ?? o.center;
    for (const m of o.members) if (values[m]! > values[best]!) best = m;
    if (!peaks.some((p) => Math.hypot(states[p]!.x - states[best]!.x, states[p]!.y - states[best]!.y) < o.radius * 0.55)) {
      peaks.push(best);
    }
  }
  const first = 0;
  const last = states.length - 1;
  if (!peaks.includes(first)) peaks.unshift(first);
  if (last > 0 && !peaks.includes(last)) peaks.push(last);
  if (!peaks.length) peaks.push(last);

  const basins: number[][] = peaks.map(() => []);
  for (let i = 0; i < states.length; i++) {
    let b = 0;
    let best = Infinity;
    for (let p = 0; p < peaks.length; p++) {
      const d = Math.hypot(states[i]!.x - states[peaks[p]!]!.x, states[i]!.y - states[peaks[p]!]!.y);
      if (d < best) {
        best = d;
        b = p;
      }
    }
    basins[b]!.push(i);
  }
  return basins.filter((b) => b.length);
}

function modalSets(
  states: ConditionState[],
  opens: OpenSet[],
  jumps: { from: number; to: number }[],
): { box: Set<number>; diamond: Set<number> } {
  const jumpIdx = new Set(jumps.flatMap((j) => [j.from, j.to]));
  const surpCut = quantile(
    states.map((s) => s.surprise),
    0.72,
  );
  const P = new Set(
    states.filter((s) => !jumpIdx.has(s.i) && s.surprise <= surpCut).map((s) => s.i),
  );
  const box = new Set<number>();
  const diamond = new Set<number>();
  for (const o of opens) {
    const allIn = o.members.every((m) => P.has(m));
    const someIn = o.members.some((m) => P.has(m));
    if (allIn) for (const m of o.members) box.add(m);
    if (someIn) for (const m of o.members) diamond.add(m);
  }
  return { box, diamond };
}

function kindFor(
  members: number[],
  jumps: { from: number; to: number }[],
  geodesic: number[],
  opens: OpenSet[],
  n: number,
  modal: { box: Set<number>; diamond: Set<number> },
): { kind: OutcomeKind; modality: OutcomeRange["modality"] } {
  const jumpIdx = new Set(jumps.flatMap((j) => [j.from, j.to]));
  const crossed = members.some((m) => jumpIdx.has(m));
  const onPath = members.some((m) => geodesic.includes(m));
  const interior = members.some((m) => modal.box.has(m));
  const possible = members.some((m) => modal.diamond.has(m));
  const robust = members.some((m) =>
    opens.some((o) => o.property === "robust interior" && o.members.includes(m) && o.members.length >= 3),
  );
  const early = mean(members) < n * 0.45;
  if ((interior || robust) && !crossed && (early || onPath)) {
    return { kind: "known", modality: "necessary" };
  }
  if (onPath && !crossed && possible) return { kind: "perceived", modality: "possible" };
  return { kind: "speculative", modality: "unentailed" };
}

function readingFor(
  source: AdapterSource,
  kind: OutcomeKind,
  regime: RegimeId,
  low: number,
  high: number,
): { title: string; reading: string; unit: string } {
  const span = `${low.toFixed(2)}–${high.toFixed(2)}`;
  if (source === "thought") {
    if (kind === "known")
      return {
        title: "Holds the thread",
        reading: `A continuation already inside the open set. The next clause should stay in ${span} of the present tone.`,
        unit: "gap",
      };
    if (kind === "perceived")
      return {
        title: "Reads as a blend",
        reading: `Reachable without a jump — inferred, not observed. Interior necessity would still prefer ${span}.`,
        unit: "gap",
      };
    return {
      title: "Invented sequel",
      reading: `This basin sits across a discontinuity. Fluent, but not entailed. Treat as hallucination risk.`,
      unit: "gap",
    };
  }
  const domainWord =
    source === "markets"
      ? "session range"
      : source === "pulse"
        ? "interval"
        : source === "climate"
          ? "seasonal step"
          : source === "spectra"
            ? "peak spacing"
            : source === "custom"
              ? "sample step"
              : source === "wellbore"
                ? "TVT step"
                : source === "drill"
                  ? "manifold step"
              : "ordinate gap";
  if (kind === "known")
    return {
      title: regime === "ordered" ? "Known basin" : "Occupied range",
      reading: `Already visited. Next ${domainWord} concentrates in ${span}.`,
      unit: domainWord,
    };
  if (kind === "perceived")
    return {
      title: "Perceived range",
      reading: `A continuous geodesic can reach it. The adapter’s reading, not a new law: ${span}.`,
      unit: domainWord,
    };
  return {
    title: "Speculative jump",
    reading: `Requires leaving overlapping neighborhoods. Possible, not necessary. ${span} is a story, not an interior.`,
    unit: domainWord,
  };
}

function titleFor(source: AdapterSource): string {
  if (source === "thought") return "Thought field";
  if (source === "zeta") return "Riemann field";
  if (source === "markets") return "Book field";
  if (source === "pulse") return "Pulse field";
  if (source === "climate") return "Season field";
  if (source === "custom") return "Pasted field";
  if (source === "wellbore") return "Wellbore field";
  if (source === "drill") return "Drill field";
  return "Spectra field";
}

function buildTerms(report: {
  source: AdapterSource;
  regime: ActivityState;
  continuity: number;
  hallucinationRisk: number;
  outcomes: OutcomeRange[];
  sheaf: SheafReport;
  prompt: string;
  sequences: ReturnType<typeof mapSequences>;
  primes: ReturnType<typeof findPrimes>;
}): GeodesicStep[] {
  const primary = report.outcomes[0];
  const seq = report.sequences[0];
  const primeN = report.primes.filter((p) => p.role === "prime").length;
  return [
    {
      i: 0,
      title: "Ontological selection",
      body: `Viewed as a Condition:State topology. Each observation is a point; open sets are verifiable properties, not clusters of convenience.`,
    },
    {
      i: 1,
      title: "Regime",
      body: `${report.regime.label}. β₀ = ${report.regime.betti0}, β₁ = ${report.regime.betti1}. ${report.regime.note}`,
    },
    {
      i: 2,
      title: "Value warp",
      body: `Travel cost is ∫ ds / v, the gravity-well dual of gᵥ = v · g. Transitions with V = D_KL − C < 0 are refused: no new information does not pay its cost.`,
    },
    {
      i: 3,
      title: "Primes & sequence",
      body: seq
        ? `${primeN} axiomatic prime${primeN === 1 ? "" : "s"}. ${seq.label}: ${seq.note}`
        : "No sequence survived the guard.",
    },
    {
      i: 4,
      title: "Continuity guard",
      body: `Wasserstein path continuity ${report.continuity.toFixed(2)}. Hallucination risk ${report.hallucinationRisk.toFixed(2)}. A valid plan is a continuous map through overlapping open sets. □ is the interior (necessary); ◊ is possible; a jump is unentailed.`,
    },
    {
      i: 5,
      title: "Outcome",
      body: primary
        ? `${primary.title}: ${primary.reading}`
        : "No basin survived the guard.",
    },
    {
      i: 6,
      title: "Transcendental check",
      body: `${report.sheaf.holonomyNote} δ² residual ${report.sheaf.coboundaryResidual.toExponential(1)}. Restrictions ${report.sheaf.restrictionCompatible ? "compose" : "fail"}. Bianchi ${report.sheaf.bianchiResidual.toFixed(3)} on ${report.sheaf.tets} tets. 2-view explains ${(report.sheaf.explainedVariance * 100).toFixed(0)}%. ${report.sheaf.timeNote}`,
    },
  ];
}

export function runAdapter(
  source: AdapterSource,
  prompt: string,
  weights: ValueWeights,
  nowRatio = 1,
): AdapterReport {
  const { t, labels } = seriesForSource(source, prompt);
  const n = t.length;
  const gaps = t.map((v, i) => (i === 0 ? 0.4 : Math.max(1e-4, v - t[i - 1]!)));
  const meanG = mean(gaps);
  const draft: Omit<ConditionState, "x" | "y">[] = t.map((tv, i) => {
    const gap = gaps[i]!;
    const speed = localSpeed(gaps, i);
    const curvature = localCurv(gaps, i);
    const surprise = clamp(Math.abs(gap - meanG) / (meanG + 1e-6), 0, 1.6) / 1.6;
    return {
      i,
      t: tv,
      gap,
      speed,
      curvature,
      surprise,
      label: labels[i] ?? `s${i}`,
      clause: source === "thought" || (source === "custom" && parseCustomSeries(prompt).length < 6)
        ? labels[i]
        : undefined,
    };
  });
  const embedded = embed2(draft);
  const states = spreadIfFlat(embedded.states);
  const opens = buildOpenSets(states, Math.min(5, Math.max(3, Math.floor(n / 10))));
  const values = states.map((s) => scoreValue(s, weights, states));
  const dec = analyzeDec(states, values, opens, {
    explainedVariance: embedded.explainedVariance,
    viewResidual: embedded.viewResidual,
  });
  const jumps = detectJumps(states, opens, dec.wasserstein);
  const geodesic = walkGeodesic(states, values, weights, dec.wasserstein, dec.typeIField);
  const modal = modalSets(states, opens, jumps);
  const geoPairs = new Set<string>();
  for (let k = 1; k < geodesic.length; k++) {
    geoPairs.add(`${geodesic[k - 1]}:${geodesic[k]}`);
  }
  const planContinuous = !jumps.some((j) => geoPairs.has(`${j.from}:${j.to}`));
  const continuity = clamp(1 - jumps.length / Math.max(n - 1, 1), 0, 1);
  const hallucinationRisk = clamp(
    jumps.reduce((s, j) => s + j.size, 0) / Math.max(n, 1) + (1 - continuity) * 0.45,
    0,
    1,
  );
  const regime = classifyRegime(states, opens);
  regime.typeI = dec.typeICount;
  regime.typeII = dec.typeIICount;
  if (dec.typeICount > Math.max(2, n * 0.18) && regime.id === "ordered") {
    regime.id = "critical";
    regime.label = "Critical";
    regime.note = "Type-I metric spike. The map itself is sensitive here — not just the observer.";
  }
  const sheaf = sheafFromDec(dec);
  const basins = clusterBasins(states, values, opens);
  const outcomes: OutcomeRange[] = basins
    .map((members, idx) => {
      const gapsB = members.map((m) => states[m]!.gap);
      const low = quantile(gapsB, 0.18);
      const high = quantile(gapsB, 0.82);
      const modalKind = kindFor(members, jumps, geodesic, opens, states.length, modal);
      const copy = readingFor(source, modalKind.kind, regime.id, low, high);
      const cx = mean(members.map((m) => states[m]!.x));
      const cy = mean(members.map((m) => states[m]!.y));
      const val = mean(members.map((m) => values[m]!));
      return {
        id: `out-${idx}`,
        kind: modalKind.kind,
        title: copy.title,
        reading: copy.reading,
        modality: modalKind.modality,
        low,
        high,
        unit: copy.unit,
        value: val,
        continuity: clamp(
          1 - members.filter((m) => jumps.some((j) => j.to === m)).length / Math.max(members.length, 1),
          0,
          1,
        ),
        members,
        attractor: { x: cx, y: cy },
      };
    })
    .sort((a, b) => {
      const rank = { known: 0, perceived: 1, speculative: 2 };
      if (rank[a.kind] !== rank[b.kind]) return rank[a.kind] - rank[b.kind];
      return b.value - a.value;
    })
    .slice(0, 4);

  const now = clamp(Math.round((n - 1) * nowRatio), 0, n - 1);
  const geodesicWarped = geodesic.map((i) => {
    const s = states[i]!;
    const pull = outcomes[0]?.attractor;
    if (!pull) return { x: s.x, y: s.y };
    const a = 0.18 * weights.continuity;
    return { x: s.x * (1 - a) + pull.x * a, y: s.y * (1 - a) + pull.y * a };
  });

  const primes = findPrimes(states, values, opens, geodesic);
  const sequences = mapSequences(states, values, primes, jumps, geodesic, outcomes);
  const ladder = buildLadder(source, states, opens, regime, sheaf, outcomes, primes);
  const shifts = languageShifts(prompt);
  const caption = nowCaption(states, now, outcomes, jumps, primes);
  const persistence = persistField(states);
  const partial = {
    source,
    regime,
    continuity,
    hallucinationRisk,
    outcomes,
    sheaf,
    prompt,
    sequences,
    primes,
  };
  const horizon = computeHorizon(
    { states, outcomes, jumps, now } as AdapterReport,
    now,
  );
  const survey = source === "wellbore" ? wellboreSurvey() : null;
  const curve = survey
    ? openCurveFromXYZ(
        survey.map((s) => s.x),
        survey.map((s) => s.y),
        survey.map((s) => s.z),
      )
    : openCurveFromStates(states);
  const mid = middleOutSplit(
    source === "wellbore" ? states.map((s) => s.t) : values,
    0.55,
  );
  const coord = roleFor(source, prompt);
  const draftReport = {
    source,
    title: titleFor(source),
    prompt,
    coordinateRole: coord.role,
    ingestNote: coord.note,
    states,
    opens,
    regime,
    sheaf,
    outcomes,
    geodesic,
    geodesicWarped,
    jumps,
    continuity,
    hallucinationRisk,
    planContinuous,
    now,
    terms: [] as GeodesicStep[],
    weights: { ...weights },
    valueField: values,
    typeIField: dec.typeIField,
    typeIIField: dec.typeIIField,
    wasserstein: dec.wasserstein,
    primes,
    sequences,
    ladder,
    languageShifts: shifts,
    nowCaption: caption,
    horizon,
    persistence,
    curve,
    middleOut: mid,
    modes: [] as ReturnType<typeof modeStack>,
    orbit: orbitClosure(source, states.length),
    claims: [] as ReturnType<typeof claimLedger>,
    graphs: buildGraphs(states),
    ceiling: undefined as ReturnType<typeof metricCeiling> | undefined,
    nulls: undefined as ReturnType<typeof runNull> | undefined,
    provenance: undefined as ReturnType<typeof provenanceOf> | undefined,
    pathCost: pathCosts(states, now),
    planeTangent: planeTangents(states),
    vv: undefined as ReturnType<typeof verifyAdapter> | undefined,
  } satisfies AdapterReport;
  draftReport.terms = buildTerms(partial);
  draftReport.modes = modeStack(draftReport, curve, mid);
  draftReport.nulls = runNull(draftReport);
  draftReport.claims = claimLedger(draftReport);
  draftReport.ceiling = metricCeiling(draftReport, draftReport.graphs!);
  draftReport.provenance = provenanceOf(draftReport);
  draftReport.vv = verifyAdapter(draftReport);
  return draftReport;
}
