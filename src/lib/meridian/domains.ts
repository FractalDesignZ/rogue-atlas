import { mulberry32 } from "./primes";
import { meanGapAt } from "./lambert";
import { ZETA_ZEROS } from "./zeros";
import { sampleGueSpectrum } from "./protocol";
import type { DomainId, Series } from "./types";

function accumulate(gaps: number[], start = 0): number[] {
  const out = [start];
  for (const g of gaps) out.push(out[out.length - 1] + Math.max(g, 1e-6));
  return out;
}

export function marketSeries(seed = 7, count = 96): number[] {
  const rng = mulberry32(seed);
  const gaps: number[] = [];
  for (let i = 0; i < count - 1; i++) {
    const vol = 0.55 + 0.35 * Math.sin(i / 9) + 0.15 * rng();
    const jump = rng() < 0.07 ? 1.8 + rng() * 2 : 0;
    gaps.push(Math.max(0.08, vol + jump * rng()));
  }
  return accumulate(gaps, 12);
}

export function pulseSeries(seed = 11, count = 88): number[] {
  const rng = mulberry32(seed);
  const gaps: number[] = [];
  for (let i = 0; i < count - 1; i++) {
    const base = 0.82 + 0.06 * Math.sin(i / 5);
    const ectopy = rng() < 0.05 ? 0.38 + rng() * 0.2 : 0;
    gaps.push(Math.max(0.28, base + 0.05 * (rng() - 0.5) - ectopy));
  }
  return accumulate(gaps, 0);
}

export function climateSeries(seed = 19, count = 120): number[] {
  const rng = mulberry32(seed);
  const gaps: number[] = [];
  for (let i = 0; i < count - 1; i++) {
    const seasonal = 0.7 + 0.22 * Math.cos((2 * Math.PI * i) / 12);
    const enso = 0.12 * Math.sin((2 * Math.PI * i) / 43);
    gaps.push(Math.max(0.2, seasonal + enso + 0.08 * (rng() - 0.5)));
  }
  return accumulate(gaps, 4);
}

export function spectraSeries(seed = 23, count = 80): number[] {
  const rng = mulberry32(seed);
  const gaps: number[] = [];
  for (let i = 0; i < count - 1; i++) {
    const harmonic = 0.62 + 0.18 * Math.sin(i * 0.7);
    const inharmonic = rng() < 0.12 ? 0.9 * rng() : 0;
    gaps.push(Math.max(0.16, harmonic + inharmonic));
  }
  return accumulate(gaps, 8);
}

export function highHeightBlock(count = 96, seed = 1022): number[] {
  const T = 1370919909931.9953;
  const mean = meanGapAt(T);
  return sampleGueSpectrum(count, mean, seed).map((x) => x + 20);
}

export const DOMAIN_META: Record<
  DomainId,
  { name: string; short: string; blurb: string; frequencyNote: string }
> = {
  zeta: {
    name: "Riemann ordinates",
    short: "Zeta",
    blurb:
      "The paper’s native series: nontrivial zeros as a one-parameter orbit under prime-power frequencies.",
    frequencyNote: "Prime powers q = p^k with von Mangoldt amplitudes Λ(q)/√q.",
  },
  markets: {
    name: "Market residuals",
    short: "Markets",
    blurb:
      "Event times from volatility crossings. Same arithmetic kernel; the studio asks whether anything survives a spacing-only null.",
    frequencyNote: "Shared prime-power dictionary — a transferred construction, not a price law.",
  },
  pulse: {
    name: "Pulse intervals",
    short: "Pulse",
    blurb:
      "Inter-beat intervals with rare ectopy. Local rank-one recovery should dominate if the map is only a curve.",
    frequencyNote: "Prime-power phases applied to physiological event times.",
  },
  climate: {
    name: "Climate anomalies",
    short: "Climate",
    blurb:
      "Seasonal crossings with a slow envelope. Recurrence edges appear when the torus closure mixes.",
    frequencyNote: "Same frequencies; seasonal structure lives in the ordinates, not the kernel.",
  },
  spectra: {
    name: "Partial peaks",
    short: "Spectra",
    blurb:
      "Inharmonic peak locations from a synthetic spectrum. Use this to watch identity versus discovery split.",
    frequencyNote: "Prime-power kernel on peak ordinates — construction, not acoustics.",
  },
  custom: {
    name: "Custom series",
    short: "Custom",
    blurb: "Paste monotone event times or residuals. Meridian never invents a manifold they do not imply.",
    frequencyNote: "Declared arithmetic spectral measure on your gaps.",
  },
};

export function seriesFor(domain: DomainId, custom?: number[]): Series {
  const meta = DOMAIN_META[domain];
  const ordinates =
    domain === "zeta"
      ? ZETA_ZEROS.slice()
      : domain === "markets"
        ? marketSeries()
        : domain === "pulse"
          ? pulseSeries()
          : domain === "climate"
            ? climateSeries()
            : domain === "spectra"
              ? spectraSeries()
              : (custom?.length ? custom : ZETA_ZEROS.slice());
  return {
    id: domain,
    name: meta.name,
    short: meta.short,
    domain,
    ordinates,
    offset: 0,
    blurb: meta.blurb,
    frequencyNote: meta.frequencyNote,
  };
}

export function parseSeries(text: string): number[] {
  const nums = text
    .split(/[\s,;]+/)
    .map((s) => Number(s))
    .filter((n) => Number.isFinite(n));
  const sorted = [...nums].sort((a, b) => a - b);
  const uniq: number[] = [];
  for (const n of sorted) {
    if (!uniq.length || Math.abs(n - uniq[uniq.length - 1]) > 1e-12) uniq.push(n);
  }
  return uniq.slice(0, 256);
}

export const DOMAIN_ORDER: DomainId[] = [
  "zeta",
  "markets",
  "pulse",
  "climate",
  "spectra",
  "custom",
];
