import type { AdapterReport, AdapterSource } from "./types";
import { buildGraphs } from "./graphs";

export type NullReport = {
  name: string;
  justified: boolean;
  justification: string;
  live: number;
  nullMean: number;
  pApprox: number;
  replicates: number;
  note: string;
};

function shuffle<T>(xs: T[], seed: number): T[] {
  const out = xs.slice();
  let s = seed || 1;
  for (let i = out.length - 1; i > 0; i--) {
    s = (s * 1664525 + 1013904223) >>> 0;
    const j = s % (i + 1);
    const t = out[i]!;
    out[i] = out[j]!;
    out[j] = t;
  }
  return out;
}

function justify(source: AdapterSource): { name: string; justified: boolean; text: string } {
  if (source === "zeta") {
    return {
      name: "GUE / gap shuffle",
      justified: true,
      text: "Spacing-only is the manuscript’s primary null. GUE belongs here. It is not a universal sheaf test.",
    };
  }
  if (source === "drill" || source === "wellbore") {
    return {
      name: "Coordinate shuffle",
      justified: true,
      text: "Keep the walk, permute (x, y). A drill manifold is not a GUE spectrum.",
    };
  }
  if (source === "pulse") {
    return {
      name: "Interval shuffle",
      justified: true,
      text: "Preserve the interval multiset. Recurrence should vanish if only order mattered.",
    };
  }
  return {
    name: "Feature shuffle",
    justified: true,
    text: "Permute the plane, keep time. Recurrence that survives is an artifact of the embedding, not a discovery.",
  };
}

export function runNull(report: AdapterReport, replicates = 12): NullReport {
  const live = report.graphs?.contamination ?? buildGraphs(report.states).contamination;
  const meta = justify(report.source);
  const scores: number[] = [];
  for (let r = 0; r < replicates; r++) {
    const xs = shuffle(report.states.map((s) => s.x), 17 + r * 13);
    const ys = shuffle(report.states.map((s) => s.y), 91 + r * 7);
    const fake = report.states.map((s, i) => ({ ...s, x: xs[i]!, y: ys[i]! }));
    scores.push(buildGraphs(fake).contamination);
  }
  const nullMean = scores.reduce((a, b) => a + b, 0) / Math.max(scores.length, 1);
  const extreme = scores.filter((s) => s <= live).length;
  const pApprox = (extreme + 1) / (replicates + 1);
  return {
    name: meta.name,
    justified: meta.justified,
    justification: meta.text,
    live,
    nullMean,
    pApprox,
    replicates,
    note:
      pApprox > 0.2
        ? `Live contamination ${live.toFixed(2)} sits inside the shuffle (p ≈ ${pApprox.toFixed(2)}). Recurrence is not a discovery.`
        : `Live contamination ${live.toFixed(2)} is unusual against ${replicates} shuffles (p ≈ ${pApprox.toFixed(2)}). Still not a physical law.`,
  };
}
