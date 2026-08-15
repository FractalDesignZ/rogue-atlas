import { transitionValue } from "./dec";
import type { AdapterReport, OutcomeKind } from "./types";

export type ForecastStep = {
  i: number;
  label: string;
  kind: OutcomeKind | "open";
  v: number | null;
  refuse: boolean;
  isJump: boolean;
};

export function forecastAhead(report: AdapterReport, count = 5): ForecastStep[] {
  const n = report.states.length;
  const here = Math.min(Math.max(0, report.now), Math.max(n - 1, 0));
  const out: ForecastStep[] = [];
  for (let k = 1; k <= count; k++) {
    const i = here + k;
    const s = report.states[i];
    if (!s) break;
    const prev = report.states[i - 1]!;
    const tv = transitionValue(
      prev,
      s,
      report.wasserstein[i] ?? 0,
      report.typeIField[i] ?? 0,
    );
    const kind = report.outcomes.find((o) => o.members.includes(i))?.kind ?? "open";
    const isJump = report.jumps.some((j) => j.to === i);
    out.push({
      i,
      label: s.clause ?? s.label,
      kind,
      v: tv.v,
      refuse: tv.v < 0,
      isJump,
    });
  }
  return out;
}
