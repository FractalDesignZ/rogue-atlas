import { mulberry32 } from "./primes";
import { dist } from "./kernel";
import { buildMeasure } from "./kernel";
import type { ProtocolReport } from "./types";

function wignerPdf(s: number): number {
  return ((32 / Math.PI ** 2) * s * s * Math.exp((-4 * s * s) / Math.PI));
}

function wignerCdf(s: number): number {
  // Numerical integration of GUE Wigner surmise
  if (s <= 0) return 0;
  const n = 48;
  let acc = 0;
  const h = s / n;
  for (let i = 0; i <= n; i++) {
    const x = i * h;
    const w = i === 0 || i === n ? 1 : i % 2 === 0 ? 2 : 4;
    acc += w * wignerPdf(x);
  }
  return Math.min(1, (h / 3) * acc);
}

export function sampleGueSpectrum(count: number, meanGap: number, seed: number): number[] {
  const rng = mulberry32(seed);
  const gaps: number[] = [];
  for (let i = 0; i < count - 1; i++) {
    const u = rng();
    let s = 1;
    for (let k = 0; k < 10; k++) {
      const f = wignerCdf(s) - u;
      const p = Math.max(wignerPdf(s), 1e-6);
      s = Math.max(0.02, s - f / p);
    }
    gaps.push(s * meanGap);
  }
  const out = [0];
  for (const g of gaps) out.push(out[out.length - 1] + g);
  return out;
}

function graphEnergy(ordinates: number[], edges: [number, number][], omega: number): number {
  let num = 0;
  let den = 0;
  const deg = new Array<number>(ordinates.length).fill(0);
  for (const [i, j] of edges) {
    deg[i] += 1;
    deg[j] += 1;
    const di = Math.hypot(
      Math.cos(ordinates[i] * omega) - Math.cos(ordinates[j] * omega),
      Math.sin(ordinates[i] * omega) - Math.sin(ordinates[j] * omega),
    );
    num += di * di;
  }
  for (let i = 0; i < ordinates.length; i++) den += deg[i];
  return den === 0 ? 0 : num / den;
}

const GUE_REPS = 11;

function knnSpacingSorted(n: number, i: number, k: number): number[] {
  const out: number[] = [];
  let lo = i - 1;
  let hi = i + 1;
  while (out.length < k && (lo >= 0 || hi < n)) {
    const left = lo >= 0;
    const right = hi < n;
    if (left && right) {
      const dl = i - lo;
      const dr = hi - i;
      if (dl <= dr) out.push(lo--);
      else out.push(hi++);
    } else if (left) out.push(lo--);
    else out.push(hi++);
  }
  return out;
}

function knnGraph(
  ordinates: number[],
  k: number,
  metric: (i: number, j: number) => number,
  sorted1d = false,
): [number, number][] {
  const edges: [number, number][] = [];
  const seen = new Set<string>();
  const n = ordinates.length;
  for (let i = 0; i < n; i++) {
    const neigh = sorted1d
      ? knnSpacingSorted(n, i, k)
      : (() => {
          const scored: { j: number; d: number }[] = [];
          for (let j = 0; j < n; j++) {
            if (i === j) continue;
            const d = metric(i, j);
            if (scored.length < k) {
              scored.push({ j, d });
              if (scored.length === k) scored.sort((a, b) => a.d - b.d);
              continue;
            }
            if (d >= scored[k - 1]!.d) continue;
            scored[k - 1] = { j, d };
            scored.sort((a, b) => a.d - b.d);
          }
          return scored.map((s) => s.j);
        })();
    for (const j of neigh) {
      const a = Math.min(i, j);
      const b = Math.max(i, j);
      const key = `${a}:${b}`;
      if (!seen.has(key)) {
        seen.add(key);
        edges.push([a, b]);
      }
    }
  }
  return edges;
}

function robustZ(value: number, sample: number[]): number {
  const s = [...sample].sort((a, b) => a - b);
  const mid = s[Math.floor(s.length / 2)] ?? 0;
  const devs = s.map((x) => Math.abs(x - mid)).sort((a, b) => a - b);
  const mad = devs[Math.floor(devs.length / 2)] ?? 1;
  const scale = 1.4826 * Math.max(mad, 1e-6);
  return (value - mid) / scale;
}

export function analyzeProtocol(
  ordinates: number[],
  Q: number,
  k: number,
  seed = 17,
): ProtocolReport {
  const measure = buildMeasure(Q, "hard");
  const holdCount = Math.max(1, Math.round(measure.activePrimes * 0.2));
  const primes = [...new Set(measure.atoms.map((a) => a.p))];
  const rng = mulberry32(seed);
  const shuffled = [...primes].sort(() => rng() - 0.5);
  const holdout = shuffled.slice(0, holdCount);

  const arithmetic = knnGraph(ordinates, k, (i, j) =>
    dist(measure, ordinates[j] - ordinates[i]),
  );
  const spacing = knnGraph(
    ordinates,
    k,
    (i, j) => Math.abs(ordinates[j] - ordinates[i]),
    true,
  );

  const randomOmegas = Array.from({ length: 12 }, () => 0.4 + rng() * 3.2);
  const holdEnergiesA = holdout.map((p) => graphEnergy(ordinates, arithmetic, Math.log(p)));
  const holdEnergiesS = holdout.map((p) => graphEnergy(ordinates, spacing, Math.log(p)));
  const randA = randomOmegas.map((w) => graphEnergy(ordinates, arithmetic, w));
  const randS = randomOmegas.map((w) => graphEnergy(ordinates, spacing, w));

  const med = (xs: number[]) => {
    const s = [...xs].sort((a, b) => a - b);
    return s[Math.floor(s.length / 2)] ?? 0;
  };
  const aGain = med(randA) - med(holdEnergiesA);
  const sGain = med(randS) - med(holdEnergiesS);
  const primary = aGain - sGain;

  const meanGap =
    (ordinates[ordinates.length - 1] - ordinates[0]) / Math.max(ordinates.length - 1, 1);
  const gueScores: number[] = [];
  for (let b = 0; b < GUE_REPS; b++) {
    const spec = sampleGueSpectrum(ordinates.length, meanGap, seed + 100 + b * 13);
    const gA = knnGraph(spec, k, (i, j) => dist(measure, spec[j] - spec[i]));
    const gS = knnGraph(spec, k, (i, j) => Math.abs(spec[j] - spec[i]), true);
    const gHold = holdout.map((p) => graphEnergy(spec, gA, Math.log(p)));
    const gRand = randomOmegas.map((w) => graphEnergy(spec, gA, w));
    const gHoldS = holdout.map((p) => graphEnergy(spec, gS, Math.log(p)));
    const gRandS = randomOmegas.map((w) => graphEnergy(spec, gS, w));
    gueScores.push(med(gRand) - med(gHold) - (med(gRandS) - med(gHoldS)));
  }

  const greater = gueScores.filter((s) => s >= primary).length;
  const pemp = (1 + greater) / (gueScores.length + 1);
  const verdict: ProtocolReport["verdict"] =
    pemp < 0.05 ? "held-out" : pemp > 0.4 ? "identity" : "inconclusive";

  return {
    arithmetic: robustZ(aGain, gueScores),
    spacing: robustZ(sGain, gueScores),
    primary,
    gueScores,
    pemp,
    verdict,
    holdoutPrimes: holdout,
    cell: { Q, k },
  };
}
