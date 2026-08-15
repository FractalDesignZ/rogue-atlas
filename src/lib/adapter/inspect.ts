import type { AdapterReport, AxiomaticPrime, OutcomeRange } from "./types";

export type SeedInspect = {
  i: number;
  label: string;
  clause?: string;
  gap: number;
  speed: number;
  surprise: number;
  value: number;
  typeI: number;
  typeII: number;
  role: AxiomaticPrime["role"] | "ordinary";
  roleNote: string;
  openProperty: string | null;
  onGeodesic: boolean;
  outcome: OutcomeRange | null;
  isJump: boolean;
};

export function inspectSeed(report: AdapterReport, i: number): SeedInspect | null {
  const s = report.states[i];
  if (!s) return null;
  const prime = report.primes.find((p) => p.i === i);
  const open = report.opens.find((o) => o.members.includes(i));
  const outcome = report.outcomes.find((o) => o.members.includes(i)) ?? null;
  const isJump = report.jumps.some((j) => j.from === i || j.to === i);
  return {
    i,
    label: s.label,
    clause: s.clause,
    gap: s.gap,
    speed: s.speed,
    surprise: s.surprise,
    value: report.valueField[i] ?? 0,
    typeI: report.typeIField[i] ?? 0,
    typeII: report.typeIIField[i] ?? 0,
    role: prime?.role ?? "ordinary",
    roleNote: prime?.why ?? "An ordinary condition:state. Contingent, not load-bearing.",
    openProperty: open?.property ?? null,
    onGeodesic: report.geodesic.includes(i),
    outcome,
    isJump,
  };
}
