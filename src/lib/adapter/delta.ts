import { computeFork } from "./fork";
import { computeHorizon } from "./horizon";
import type { AdapterReport } from "./types";

export type FieldDelta = {
  headline: string;
  lines: string[];
};

function atNow(report: AdapterReport, now: number): AdapterReport {
  const n = report.states.length;
  const i = Math.min(Math.max(0, now), Math.max(n - 1, 0));
  return { ...report, now: i, horizon: computeHorizon(report, i) };
}

export function fieldDelta(prev: AdapterReport, next: AdapterReport): FieldDelta | null {
  if (prev.prompt !== next.prompt || prev.source !== next.source) {
    return {
      headline: "A new field.",
      lines: [`Now reading “${next.title}”.`],
    };
  }
  const sample = Math.max(0, Math.min(prev.now, next.now, next.states.length - 2));
  const a = computeFork(atNow(prev, sample));
  const b = computeFork(atNow(next, sample));
  const lines: string[] = [];

  if (prev.horizon.nextTitle !== next.horizon.nextTitle) {
    lines.push(`From here: “${prev.horizon.nextTitle}” → “${next.horizon.nextTitle}”.`);
  }
  if (a.refuse !== b.refuse) {
    lines.push(
      b.refuse
        ? "The next step is now refused. It does not pay."
        : "Refuse lifted. The next step pays.",
    );
  } else if (a.stayV !== null && b.stayV !== null && Math.abs(a.stayV - b.stayV) >= 0.03) {
    const sign = b.stayV > a.stayV ? "rose" : "fell";
    lines.push(`Stay V ${sign} ${a.stayV.toFixed(2)} → ${b.stayV.toFixed(2)}.`);
  }
  const dc = next.continuity - prev.continuity;
  if (Math.abs(dc) >= 0.02) {
    lines.push(`Continuity ${dc >= 0 ? "rose" : "fell"} to ${next.continuity.toFixed(2)}.`);
  }
  if (prev.regime.id !== next.regime.id) {
    lines.push(`Regime ${prev.regime.label} → ${next.regime.label}.`);
  }
  if (prev.geodesic.join(",") !== next.geodesic.join(",")) {
    lines.push("The geodesic found a different path.");
  }
  const before = prev.outcomes[0]?.title;
  const after = next.outcomes[0]?.title;
  if (before && after && before !== after) {
    lines.push(`Primary basin “${before}” → “${after}”.`);
  }
  if (!lines.length && JSON.stringify(prev.weights) !== JSON.stringify(next.weights)) {
    lines.push("The observer changed. Walk back from the end to feel the new path.");
  }
  if (!lines.length) return null;
  return {
    headline: b.refuse ? "The field tightened." : a.refuse && !b.refuse ? "The field opened." : "The observer moved.",
    lines,
  };
}
