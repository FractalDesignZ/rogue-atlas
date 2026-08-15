import { computeFork } from "./fork";
import { forecastAhead } from "./forecast";
import type { AdapterReport, CompareReport } from "./types";

function kindLine(report: AdapterReport, kind: "known" | "perceived" | "speculative"): string {
  const hits = report.outcomes.filter((o) => o.kind === kind);
  if (!hits.length) return "";
  return hits.map((o) => `${o.title.toLowerCase()} (${o.low.toFixed(2)}–${o.high.toFixed(2)})`).join("; ");
}

export function writeReading(report: AdapterReport, compare: CompareReport | null): string {
  const known = kindLine(report, "known");
  const perceived = kindLine(report, "perceived");
  const speculative = kindLine(report, "speculative");
  const prime = report.primes.find((p) => p.role === "prime");
  const primeLabel = prime ? (report.states[prime.i]?.clause ?? report.states[prime.i]?.label) : null;
  const seq = report.sequences[0];
  const shift = report.languageShifts[0];
  const horizon = report.horizon;
  const fork = computeFork(report);
  const ahead = forecastAhead(report, 3);
  const nextRefuse = ahead.find((s) => s.refuse);

  const lines = [
    report.title + ".",
    report.nowCaption,
    `From here: ${horizon.nextTitle}. ${horizon.reading}`,
    fork.refuse
      ? `Refuse the next step. V = ${fork.stayV?.toFixed(2)}. ${fork.reading}`
      : `Stay-or-jump: ${fork.advice}. ${fork.reading}`,
    nextRefuse
      ? `Within three steps a refuse sits at “${nextRefuse.label}” (V = ${nextRefuse.v?.toFixed(2)}).`
      : ahead.length
        ? `Next ${ahead.length}: ${ahead.map((s) => s.kind).join(" → ")}.`
        : "No observations remain ahead.",
    `${report.regime.label} regime. Continuity ${report.continuity.toFixed(2)}. Jump risk ${report.hallucinationRisk.toFixed(2)}. The plan is ${report.planContinuous ? "continuous" : "already jumping"}.`,
  ];

  if (known) lines.push(`Known — necessary if the story holds: ${known}.`);
  if (perceived) lines.push(`Perceived — reachable, not observed: ${perceived}.`);
  if (speculative) lines.push(`Speculative — a sequel, not an interior: ${speculative}.`);
  if (primeLabel) lines.push(`Axiomatic prime: “${primeLabel}”. The later field is contingent on it.`);
  if (seq) lines.push(`${seq.label}. ${seq.note}`);
  if (shift) lines.push(`Language map: ${shift.from} → ${shift.to}. ${shift.note}`);
  lines.push(
    `Sheaf: δ² residual ${report.sheaf.coboundaryResidual.toExponential(1)}. Function restriction is an identity. |K| ${report.sheaf.meanHolonomy.toFixed(3)}. Glueing (H⁰) ${report.sheaf.glueingResidual.toFixed(2)}. 2-view explains ${(report.sheaf.explainedVariance * 100).toFixed(0)}% — chosen, not discovered.`,
  );
  if (report.vv) {
    lines.push(`V&V: ${report.vv.headline}. ${report.vv.note}`);
  }
  if (report.graphs) {
    lines.push(`Graphs: local vs recurrence at k = ${report.graphs.k}. ${report.graphs.note}`);
  }
  if (report.nulls) {
    lines.push(`Null: ${report.nulls.name}. ${report.nulls.note}`);
  }
  if (report.pathCost) {
    lines.push(`Walk vs chord: extra ${report.pathCost.extra.toFixed(2)}. ${report.pathCost.note}`);
  }
  if (report.planeTangent) {
    lines.push(
      `Plane tangent: local ${report.planeTangent.local.toFixed(3)}, feature ${report.planeTangent.feature.toFixed(3)}. ${report.planeTangent.note}`,
    );
  }
  if (compare) {
    lines.push(`Held against ${compare.heldTitle}: ${compare.headline} ${compare.note}`);
  }
  lines.push("This is a reading, not a law.");
  return lines.join("\n\n");
}

export function readingParagraphs(report: AdapterReport, compare: CompareReport | null): string[] {
  return writeReading(report, compare).split("\n\n");
}
