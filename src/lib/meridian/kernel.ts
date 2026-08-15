import { primePowersUpTo, type PrimePower } from "./primes";
import type { FrequencyAtom, Measure } from "./types";

export type WindowKind = "hard" | "master";

function windowWeight(omega: number, kind: WindowKind, maxOmega: number): number {
  if (kind === "hard") return 1;
  const x = omega / Math.max(maxOmega, 1e-9);
  return Math.max(0, 1 - x * x);
}

export function buildMeasure(
  Q: number,
  kind: WindowKind = "hard",
  dictionary?: PrimePower[],
): Measure {
  const powers = dictionary ?? primePowersUpTo(Q);
  const maxOmega = Math.log(Math.max(Q, 2));
  const atoms: FrequencyAtom[] = powers
    .filter((pp) => pp.q <= Q)
    .map((pp) => {
      const w = windowWeight(pp.omega, kind, maxOmega);
      const amplitude2 = w * ((pp.lambda * pp.lambda) / pp.q);
      return {
        q: pp.q,
        omega: pp.omega,
        amplitude2,
        p: pp.p,
        k: pp.k,
        label: pp.k === 1 ? String(pp.p) : `${pp.p}^${pp.k}`,
      };
    })
    .filter((a) => a.amplitude2 > 0);

  const Z = atoms.reduce((s, a) => s + a.amplitude2, 0);
  const weights = atoms.map((a) => a.amplitude2 / Z);
  const omegas = atoms.map((a) => a.omega);

  let mu2 = 0;
  let mu4 = 0;
  let mu6 = 0;
  let sumSq = 0;
  for (let i = 0; i < atoms.length; i++) {
    const p = weights[i];
    const w = omegas[i];
    mu2 += p * w * w;
    mu4 += p * w ** 4;
    mu6 += p * w ** 6;
    sumSq += p * p;
  }

  const primes = new Set(atoms.map((a) => a.p));
  return {
    atoms,
    weights,
    omegas,
    Z,
    mu2,
    mu4,
    mu6,
    neff: 1 / Math.max(sumSq, 1e-18),
    speed: Math.sqrt(mu2),
    curvature: Math.sqrt(mu4) / mu2,
    activePrimes: primes.size,
  };
}

export function kernelReal(measure: Measure, t: number): number {
  let s = 0;
  for (let i = 0; i < measure.weights.length; i++) {
    s += measure.weights[i] * Math.cos(t * measure.omegas[i]);
  }
  return s;
}

export function dist2(measure: Measure, t: number): number {
  let s = 0;
  for (let i = 0; i < measure.weights.length; i++) {
    s += measure.weights[i] * (1 - Math.cos(t * measure.omegas[i]));
  }
  return 2 * s;
}

export function dist(measure: Measure, t: number): number {
  return Math.sqrt(Math.max(dist2(measure, t), 0));
}

export function featureReal(measure: Measure, gamma: number): number[] {
  const out = new Array<number>(measure.atoms.length * 2);
  for (let i = 0; i < measure.atoms.length; i++) {
    const amp = Math.sqrt(measure.weights[i]);
    const th = gamma * measure.omegas[i];
    out[2 * i] = amp * Math.cos(th);
    out[2 * i + 1] = -amp * Math.sin(th);
  }
  return out;
}

export function analyticTangent(measure: Measure, gamma: number): number[] {
  const out = new Array<number>(measure.atoms.length * 2);
  for (let i = 0; i < measure.atoms.length; i++) {
    const amp = Math.sqrt(measure.weights[i]);
    const w = measure.omegas[i];
    const th = gamma * w;
    out[2 * i] = -w * amp * Math.sin(th);
    out[2 * i + 1] = -w * amp * Math.cos(th);
  }
  return out;
}

export function smallGapExpansion(measure: Measure, t: number): number {
  const t2 = t * t;
  const t4 = t2 * t2;
  const t6 = t4 * t2;
  return measure.mu2 * t2 - (measure.mu4 / 12) * t4 + (measure.mu6 / 360) * t6;
}
