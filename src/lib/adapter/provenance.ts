import type { AdapterReport } from "./types";

export type Provenance = {
  hash: string;
  inputs: string;
  gates: string[];
};

function djb2(s: string): string {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h) ^ s.charCodeAt(i);
  return (h >>> 0).toString(16).padStart(8, "0");
}

export function provenanceOf(report: AdapterReport): Provenance {
  const w = report.weights;
  const payload = [
    report.source,
    report.prompt.trim(),
    w.continuity,
    w.novelty,
    w.stability,
    w.leverage,
    report.states.length,
  ].join("|");
  const gates = [
    report.sheaf.coboundaryNilpotent ? "δ²" : null,
    report.sheaf.restrictionCompatible ? "compose" : null,
    report.planContinuous ? "continuous-plan" : "plan-jumps",
    report.middleOut ? `gate3-${report.middleOut.gate3}` : null,
  ].filter((g): g is string => Boolean(g));
  return {
    hash: djb2(payload),
    inputs: `${report.source} · ${report.states.length} states · ${report.prompt.slice(0, 48)}`,
    gates,
  };
}
