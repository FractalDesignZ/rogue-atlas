import { clamp } from "@/lib/utils";
import type {
  AbstractionRung,
  ActivityState,
  AdapterSource,
  AxiomaticPrime,
  ConditionState,
  LanguageShift,
  OpenSet,
  OutcomeRange,
  SequenceMap,
  SheafReport,
} from "./types";

function mean(xs: number[]): number {
  if (!xs.length) return 0;
  return xs.reduce((a, b) => a + b, 0) / xs.length;
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

/** Degree as inverse-distance mass — axiomatic primes are load-bearing, not just early. */
function influence(states: ConditionState[], i: number): number {
  const nbrs = knn(states, i, Math.min(6, Math.max(2, states.length - 1)));
  let mass = 0;
  for (const j of nbrs) {
    const d = Math.hypot(states[i]!.x - states[j]!.x, states[i]!.y - states[j]!.y);
    mass += 1 / Math.max(d, 0.08);
  }
  return mass;
}

/**
 * Axiomatic primes: irreducible nodes the rest of the field is contingent on.
 * Gateways sit between basins. Dependents inherit a prime's neighborhood.
 */
export function findPrimes(
  states: ConditionState[],
  values: number[],
  opens: OpenSet[],
  geodesic: number[],
): AxiomaticPrime[] {
  if (!states.length) return [];
  const n = states.length;
  const geo = new Set(geodesic);
  const cover = states.map((_, i) => opens.filter((o) => o.members.includes(i)).length);
  const infl = states.map((_, i) => influence(states, i));
  const maxI = Math.max(...infl, 1e-6);
  const maxV = Math.max(...values, 1e-6);

  const scored = states.map((s, i) => {
    const early = 1 - (i / Math.max(n - 1, 1)) * 0.45;
    const score =
      (values[i]! / maxV) * 0.34 +
      (infl[i]! / maxI) * 0.28 +
      clamp(s.surprise, 0, 1) * 0.18 +
      (cover[i]! > 0 ? 0.1 : 0) +
      (geo.has(i) ? 0.1 : 0);
    return { i, score: score * early };
  });

  const ranked = [...scored].sort((a, b) => b.score - a.score);
  const cut = ranked[Math.min(2, ranked.length - 1)]?.score ?? 0;
  const primeIdx = new Set(
    ranked.filter((r) => r.score >= cut * 0.82).slice(0, 4).map((r) => r.i),
  );

  const basinOf = (i: number) =>
    opens.find((o) => o.members.includes(i)) ?? opens[0];

  const out: AxiomaticPrime[] = [];
  for (const s of states) {
    const i = s.i;
    if (primeIdx.has(i)) {
      out.push({
        i,
        role: "prime",
        score: scored[i]!.score,
        why: `Load-bearing. Influence ${infl[i]!.toFixed(1)}, value ${(values[i] ?? 0).toFixed(2)}. Remove it and the neighborhood collapses.`,
      });
      continue;
    }
    const mine = basinOf(i);
    const hasPrime = mine?.members.some((m) => primeIdx.has(m)) ?? false;
    const bridges =
      opens.filter((o) => o.members.includes(i)).length >= 2 ||
      (infl[i]! / maxI > 0.62 && !hasPrime);
    if (bridges) {
      out.push({
        i,
        role: "gateway",
        score: scored[i]!.score,
        why: "Sits on more than one open set — a broker between basins.",
      });
    } else if (hasPrime && i > Math.min(...primeIdx)) {
      out.push({
        i,
        role: "dependent",
        score: scored[i]!.score,
        why: "Contingent on a prime. The field is not independent here.",
      });
    }
  }
  return out;
}

/**
 * Sequence mapping from the tactical paper, read on a value-warped geodesic:
 * foundation-expansion, constraint-elimination, dependency-inversion.
 */
export function mapSequences(
  states: ConditionState[],
  values: number[],
  primes: AxiomaticPrime[],
  jumps: { from: number; to: number; size: number }[],
  geodesic: number[],
  outcomes: OutcomeRange[],
): SequenceMap[] {
  const seq: SequenceMap[] = [];
  const primeSet = new Set(primes.filter((p) => p.role === "prime").map((p) => p.i));
  const firstPrime = [...primeSet].sort((a, b) => a - b)[0];

  if (firstPrime !== undefined) {
    const later = geodesic.filter((i) => i > firstPrime);
    const expand = later.filter((i) => (values[i] ?? 0) <= (values[firstPrime] ?? 0) * 1.15);
    if (expand.length >= 2) {
      seq.push({
        id: "seq-fe",
        pattern: "foundation-expansion",
        label: "Foundation → expansion",
        note: `Prime at ${states[firstPrime]?.label ?? firstPrime} seeds the later chain. Growth is contingent on that first node.`,
        chain: [firstPrime, ...expand.slice(0, 6)],
      });
    }
  }

  if (jumps.length) {
    const j = jumps[0]!;
    seq.push({
      id: "seq-ce",
      pattern: "constraint-elimination",
      label: "Constraint elimination",
      note: `A jump of size ${j.size.toFixed(2)} removes a barrier. The sequel after ${states[j.to]?.label ?? j.to} is only possible once the constraint is gone.`,
      chain: [j.from, j.to, Math.min(j.to + 2, states.length - 1)],
    });
  }

  if (firstPrime !== undefined) {
    const laterHigh = states
      .map((s) => s.i)
      .filter((i) => i > firstPrime && (values[i] ?? 0) > (values[firstPrime] ?? 0) * 1.08);
    if (laterHigh.length) {
      const peak = laterHigh.reduce((a, b) => ((values[b] ?? 0) > (values[a] ?? 0) ? b : a));
      seq.push({
        id: "seq-di",
        pattern: "dependency-inversion",
        label: "Dependency inversion",
        note: `A later node outvalues its founding prime. The system designed to stand alone is now leaning on what it was meant to replace.`,
        chain: [firstPrime, peak],
      });
    }
  }

  if (!seq.length && outcomes[0]) {
    seq.push({
      id: "seq-hold",
      pattern: "hold",
      label: "The field holds",
      note: "No inversion, no eliminated constraint. Continuations stay inside the occupied interior.",
      chain: geodesic.slice(0, 5),
    });
  }
  return seq.slice(0, 3);
}

export function buildLadder(
  source: AdapterSource,
  states: ConditionState[],
  opens: OpenSet[],
  regime: ActivityState,
  sheaf: SheafReport,
  outcomes: OutcomeRange[],
  primes: AxiomaticPrime[],
): AbstractionRung[] {
  const primeN = primes.filter((p) => p.role === "prime").length;
  const noun =
    source === "thought"
      ? "clauses"
      : source === "custom"
        ? "samples"
        : "events";
  return [
    {
      level: "low",
      title: "Events",
      body: `The binary. ${states.length} ${noun} with a gap, a speed, a curvature. No design recovered yet — only the artifact.`,
      items: states.slice(0, 6).map((s) => {
        const bit = s.clause ?? s.label;
        return `${bit} · gap ${s.gap.toFixed(2)}`;
      }),
    },
    {
      level: "mid",
      title: "Modules",
      body: `${opens.length} open sets, ${sheaf.triangles} faces, ${sheaf.edges} edges. This is design recovery — neighborhoods and a sheaf, not a sea of points.`,
      items: [
        ...opens.slice(0, 3).map((o) => `${o.property} · ${o.members.length} members`),
        `δ² ${sheaf.coboundaryNilpotent ? "nilpotent" : "fails"} · |K| ${sheaf.meanHolonomy.toFixed(3)}`,
      ],
    },
    {
      level: "high",
      title: "Architecture",
      body: `${regime.label} regime. ${outcomes.length} outcome basins, ${primeN} axiomatic prime${primeN === 1 ? "" : "s"}. The conceptual design the low-level stream was hiding.`,
      items: [
        ...outcomes.slice(0, 3).map((o) => `${o.kind}: ${o.title}`),
        `β₀ ${regime.betti0} · β₁ ${regime.betti1} · Fisher ${regime.fisher.toFixed(2)}`,
      ],
    },
  ];
}

const PAIRS: [string, string, string][] = [
  ["ordinary", "leapt", "Calm language covering a discontinuous move."],
  ["held", "gapped", "A range that was an interior, then a jump."],
  ["settle", "break", "Mean-reversion talk after a constraint is gone."],
  ["even", "skip", "A periodic hold, then ectopy."],
  ["quiet", "claim", "A still book, then an invented sequel."],
  ["compliance", "surveillance", "The tactical paper’s language map — palatable word, operational fact."],
  ["service", "token", "A rebrand that changes what the object is allowed to be."],
  ["neutral", "funded", "Sovereignty claimed; a prime underwrites it."],
];

export function languageShifts(prompt: string): LanguageShift[] {
  const lower = prompt.toLowerCase();
  const out: LanguageShift[] = [];
  for (const [from, to, note] of PAIRS) {
    if (lower.includes(from) && lower.includes(to)) {
      out.push({ from, to, note });
    }
  }
  return out.slice(0, 3);
}

export function nowCaption(
  states: ConditionState[],
  now: number,
  outcomes: OutcomeRange[],
  jumps: { from: number; to: number; size: number }[],
  primes: AxiomaticPrime[],
): string {
  const s = states[now];
  if (!s) return "The field is empty.";
  const owner = outcomes.find((o) => o.members.includes(s.i));
  const prime = primes.find((p) => p.i === s.i);
  const nextJump = jumps.find((j) => j.from >= now);
  const here = s.clause ?? s.label;
  const basin = owner
    ? `${owner.kind} · ${owner.title.toLowerCase()}`
    : "no occupied basin";
  const role = prime
    ? prime.role === "prime"
      ? " You are on an axiomatic prime."
      : prime.role === "gateway"
        ? " You are on a gateway between neighborhoods."
        : " This node is contingent on a prime."
    : "";
  const ahead = nextJump
    ? ` A discontinuity sits ${nextJump.from - now} step${nextJump.from - now === 1 ? "" : "s"} ahead.`
    : " No jump is queued. The plan can stay continuous.";
  return `Now: “${here}”. Reading ${basin}.${role}${ahead}`;
}

export function parseCustomSeries(text: string): number[] {
  const nums = text.match(/-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?/g);
  if (!nums) return [];
  return nums.map(Number).filter((n) => Number.isFinite(n));
}

/** Turn a pasted list into monotone ordinates. Returns or unsorted values become a walk. */
export function ordinatesFromCustom(nums: number[]): number[] {
  if (nums.length < 2) return nums;
  let rising = 0;
  for (let i = 1; i < nums.length; i++) if (nums[i]! > nums[i - 1]!) rising += 1;
  if (rising >= nums.length * 0.6) return nums;
  const t: number[] = [0];
  for (let i = 0; i < nums.length; i++) {
    t.push(t[t.length - 1]! + Math.abs(nums[i]!) + 0.12);
  }
  return t.slice(1);
}
