import { primePowersUpTo } from "./primes";
import { meanGapAt, smoothWeyl } from "./lambert";
import type { OperatorReport } from "./types";

export function primeField(
  t: number,
  Q: number,
  alpha = 0,
): number {
  const powers = primePowersUpTo(Q);
  let s = 0;
  const log2 = Math.log(2);
  for (const pp of powers) {
    const damp = alpha === 0 ? 1 : (log2 / Math.log(pp.q)) ** alpha;
    s += (damp * Math.sin(t * pp.omega)) / (pp.k * Math.sqrt(pp.q));
  }
  return s;
}

export function displacedQuantile(n: number, Q: number, alpha = 0): number {
  const base = smoothWeyl(n);
  const denom = Math.log(base / (2 * Math.PI));
  const delta = (2 * primeField(base, Q, alpha)) / denom;
  return base + delta;
}

function rmse(a: number[], b: number[]): number {
  const n = Math.min(a.length, b.length);
  if (!n) return 0;
  let s = 0;
  for (let i = 0; i < n; i++) {
    const d = a[i] - b[i];
    s += d * d;
  }
  return Math.sqrt(s / n);
}

export function analyzeOperator(
  ordinates: number[],
  Q: number,
  alpha = 0,
  startIndex = 1,
  block = 8,
): OperatorReport {
  const index: number[] = [];
  const actual: number[] = [];
  const smooth: number[] = [];
  const perturbed: number[] = [];
  const residualSmooth: number[] = [];
  const residualPerturbed: number[] = [];

  for (let i = 0; i < ordinates.length; i++) {
    const n = startIndex + i;
    const s = smoothWeyl(n);
    const p = displacedQuantile(n, Q, alpha);
    index.push(n);
    actual.push(ordinates[i]);
    smooth.push(s);
    perturbed.push(p);
    residualSmooth.push(ordinates[i] - s);
    residualPerturbed.push(ordinates[i] - p);
  }

  let improved = 0;
  let total = 0;
  for (let i = 0; i < residualSmooth.length; i += block) {
    const sl = residualSmooth.slice(i, i + block);
    const pl = residualPerturbed.slice(i, i + block);
    if (sl.length < 3) continue;
    const rs = rmse(sl, new Array(sl.length).fill(0));
    const rp = rmse(pl, new Array(pl.length).fill(0));
    total += 1;
    if (rp < rs) improved += 1;
  }

  return {
    index,
    actual,
    smooth,
    perturbed,
    residualSmooth,
    residualPerturbed,
    rmseSmooth: rmse(actual, smooth),
    rmsePerturbed: rmse(actual, perturbed),
    improvedBlocks: improved,
    totalBlocks: total,
    Q,
    alpha,
  };
}

export function heightCutoff(height: number, beta = 2): number {
  return Math.max(2, Math.floor(Math.log(Math.max(height, 3)) ** beta));
}

export function countLaw(T: number): number {
  const x = T / (2 * Math.PI);
  return x * Math.log(x) - x + 7 / 8;
}

export { meanGapAt, smoothWeyl };
