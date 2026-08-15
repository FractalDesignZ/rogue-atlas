import {
  analyticTangent,
  dist,
  dist2,
  featureReal,
  kernelReal,
  smallGapExpansion,
  buildMeasure,
} from "./kernel";
import type { WindowKind } from "./types";
import type { GeometryReport, Measure } from "./types";

function dot(a: number[], b: number[]): number {
  let s = 0;
  const n = Math.min(a.length, b.length);
  for (let i = 0; i < n; i++) s += a[i]! * b[i]!;
  return s;
}

function norm(a: number[]): number {
  return Math.sqrt(Math.max(dot(a, a), 0));
}

function sub(a: number[], b: number[]): number[] {
  return a.map((v, i) => v - (b[i] ?? 0));
}

function scale(a: number[], s: number): number[] {
  return a.map((v) => v * s);
}

function normalize(a: number[]): number[] {
  const n = norm(a);
  return n === 0 ? a.slice() : scale(a, 1 / n);
}

function meanVec(rows: number[][]): number[] {
  const d = rows[0]?.length ?? 0;
  const m = new Array<number>(d).fill(0);
  for (const r of rows) {
    for (let i = 0; i < d; i++) m[i]! += r[i]!;
  }
  const inv = rows.length ? 1 / rows.length : 0;
  return m.map((v) => v * inv);
}

function powerEigen(rows: number[][], start?: number[]): number[] {
  const d = rows[0]?.length ?? 0;
  let v = start ? start.slice() : Array.from({ length: d }, (_, i) => (i === 0 ? 1 : 0.01));
  v = normalize(v);
  for (let it = 0; it < 40; it++) {
    const acc = new Array<number>(d).fill(0);
    for (const r of rows) {
      const c = dot(r, v);
      for (let i = 0; i < d; i++) acc[i]! += c * r[i]!;
    }
    v = normalize(acc);
  }
  return v;
}

function pca2(points: number[][]): { coords: { x: number; y: number }[]; axes: number[][] } {
  if (points.length === 0) return { coords: [], axes: [] };
  const mu = meanVec(points);
  const centered = points.map((p) => sub(p, mu));
  const a1 = powerEigen(centered);
  const deflated = centered.map((p) => {
    const c = dot(p, a1);
    return sub(p, scale(a1, c));
  });
  const a2 = powerEigen(
    deflated,
    a1.map((v, i) => (i === 1 ? 1 : 0.02)),
  );
  const coords = centered.map((p) => ({ x: dot(p, a1), y: dot(p, a2) }));
  return { coords, axes: [a1, a2] };
}

function absCos(a: number[], b: number[]): number {
  const d = Math.abs(dot(a, b));
  const n = norm(a) * norm(b);
  return n === 0 ? 0 : d / n;
}

function knnIndices(
  n: number,
  i: number,
  k: number,
  metric: (i: number, j: number) => number,
): number[] {
  const scored: { j: number; d: number }[] = [];
  for (let j = 0; j < n; j++) {
    if (j === i) continue;
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
}

function tangentCosine(frames: number[][], tangent: number[]): number {
  const { axes } = pca2(frames);
  return axes[0] ? absCos(axes[0], tangent) : 0;
}

/** Micro-window on the continuous map Φ. Neighboring zeros are already past this radius. */
function orbitTangentCosine(measure: Measure, gamma: number, half = 6): number {
  const eps = Math.min(0.025, 0.35 / Math.max(measure.speed, 1));
  const frames: number[][] = [];
  for (let s = -half; s <= half; s++) {
    frames.push(featureReal(measure, gamma + s * eps));
  }
  return tangentCosine(frames, analyticTangent(measure, gamma));
}

function median(xs: number[]): number {
  if (!xs.length) return 0;
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m]! : 0.5 * (s[m - 1]! + s[m]!);
}

function firstReversalRadius(measure: Measure): number {
  let prev = 0;
  let t = 0.002;
  while (t < 4) {
    const d = dist(measure, t);
    if (d < prev) return t;
    prev = d;
    t += 0.004;
  }
  return t;
}

function quadraticRadius(measure: Measure): number {
  let t = 0.002;
  while (t < 2) {
    const exact = dist2(measure, t);
    const quad = measure.mu2 * t * t;
    if (Math.abs(exact - quad) > 0.05 * Math.max(exact, 1e-9)) return t;
    t += 0.004;
  }
  return t;
}

function dirichletWitness(measure: Measure, maxT = 12_000): { gap: number; distance: number } {
  let best = { gap: 1, distance: Infinity };
  const primes = [...new Set(measure.atoms.map((a) => a.p))].slice(0, 8);
  if (primes.length === 0) return { gap: 0, distance: 0 };
  const alphas = primes.map((p) => Math.log(p) / (2 * Math.PI));
  const step = primes.length === 1 ? Math.max(1, Math.round((2 * Math.PI) / Math.log(primes[0]!))) : 1;
  const limit = Math.min(maxT, primes.length === 1 ? step * 40 : 8_000);
  for (let t = step; t <= limit; t += step) {
    let score = 0;
    for (const a of alphas) {
      const frac = t * a - Math.floor(t * a);
      const distT = Math.min(frac, 1 - frac);
      score += distT * distT;
    }
    if (score < best.distance) {
      best = { gap: t, distance: score };
    }
  }
  return { gap: best.gap, distance: dist(measure, best.gap) };
}

const radiusCache = new Map<
  string,
  { qr: number; rev: number; witness: { gap: number; distance: number } }
>();

function radiiFor(measure: Measure, Q: number, window: WindowKind) {
  const key = `${window}:${Q}:${measure.activePrimes}:${measure.neff.toFixed(4)}`;
  const hit = radiusCache.get(key);
  if (hit) return hit;
  const next = {
    qr: quadraticRadius(measure),
    rev: firstReversalRadius(measure),
    witness: dirichletWitness(measure),
  };
  radiusCache.set(key, next);
  return next;
}

export function analyzeGeometry(
  ordinates: number[],
  Q: number,
  k = 8,
  window: WindowKind = "hard",
  opts: { viz?: boolean } = {},
): GeometryReport {
  const measure = buildMeasure(Q, window);
  const n = ordinates.length;
  const gaps: number[] = [];
  const distances: number[] = [];
  for (let i = 1; i < n; i++) {
    const g = ordinates[i]! - ordinates[i - 1]!;
    gaps.push(g);
    distances.push(dist(measure, g));
  }

  const { qr, rev, witness } = radiiFor(measure, Q, window);

  const featureDists: number[][] = Array.from({ length: n }, () => new Array<number>(n).fill(0));
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const d = dist(measure, ordinates[j]! - ordinates[i]!);
      featureDists[i]![j] = d;
      featureDists[j]![i] = d;
    }
  }

  const feats = ordinates.map((t) => featureReal(measure, t));
  let branch = 0;
  const featTan: number[] = [];
  const ordTan: number[] = [];
  const orbTan: number[] = [];
  for (let i = 0; i < n; i++) {
    const fN = knnIndices(n, i, k, (a, b) => featureDists[a]![b]!);
    const oN = knnIndices(n, i, k, (a, b) => Math.abs(ordinates[a]! - ordinates[b]!));
    branch += fN.filter((j) => Math.abs(ordinates[j]! - ordinates[i]!) < rev).length / Math.max(k, 1);
    const tan = analyticTangent(measure, ordinates[i]!);
    featTan.push(tangentCosine([feats[i]!, ...fN.map((j) => feats[j]!)], tan));
    ordTan.push(tangentCosine([feats[i]!, ...oN.map((j) => feats[j]!)], tan));
    if (i % 2 === 0) orbTan.push(orbitTangentCosine(measure, ordinates[i]!));
  }

  const viz = opts.viz !== false;
  const samples = viz ? 180 : 0;
  const t0 = ordinates[0] ?? 0;
  const t1 = ordinates[ordinates.length - 1] ?? 1;
  const span = Math.max(t1 - t0, 1);
  const cloud: number[][] = [];
  const ts: number[] = [];
  for (let s = 0; s < samples; s++) {
    const t = t0 + (span * s) / (samples - 1);
    cloud.push(featureReal(measure, t));
    ts.push(t);
  }
  const { coords } = pca2(cloud);

  const expansion: { t: number; exact: number; quad: number }[] = [];
  if (viz) {
    for (let i = 0; i <= 48; i++) {
      const t = (i / 48) * Math.min(1.4, rev * 1.6);
      expansion.push({
        t,
        exact: dist(measure, t),
        quad: Math.sqrt(Math.max(smallGapExpansion(measure, t), 0)),
      });
    }
  }

  return {
    measure,
    gaps,
    distances,
    expansion,
    quadraticRadius: qr,
    firstReversal: rev,
    adjacentLocal: gaps.filter((g) => g < rev).length / Math.max(gaps.length, 1),
    branchEdges: branch / Math.max(n, 1),
    featureTangent: median(featTan),
    ordinateTangent: median(ordTan),
    orbitTangent: median(orbTan),
    orbit: coords.map((c, i) => ({ ...c, t: ts[i]! })),
    recurrenceWitness: witness,
  };
}

export function kernelCurve(measure: Measure, tmax: number, steps = 160) {
  const out: { t: number; k: number; d: number }[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = (tmax * i) / steps;
    out.push({ t, k: kernelReal(measure, t), d: dist(measure, t) });
  }
  return out;
}
