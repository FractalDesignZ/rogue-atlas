import { sheafEligible } from "../atlas/constitution";
import type { ClaimClass } from "./claims";
import type { AbstractionLevel, AdapterReport, GraphKind } from "./types";

export type StageTarget = "field" | "torus" | "ceiling" | "topology" | "null" | "claims";

export type PipelineStage = {
  id: string;
  label: string;
  klass: ClaimClass;
  status: string;
  note: string;
  brief: string;
  target: StageTarget;
  graph?: GraphKind;
  level?: AbstractionLevel;
};

export function pipelineOf(report: AdapterReport): PipelineStage[] {
  const sheafOk = sheafEligible(report.sheaf);
  const p = report.nulls?.pApprox;
  return [
    {
      id: "data",
      label: "Data",
      klass: "identity",
      status: `${report.states.length} states`,
      note: report.provenance?.hash ?? report.source,
      brief: "The series is the construction. Nothing here is a finding.",
      target: "field",
      level: "low",
    },
    {
      id: "neighborhood",
      label: "Neighborhood",
      klass: "identity",
      status: report.graphs ? `k = ${report.graphs.k}` : "local",
      note: "Time-local is the tangent graph. Feature kNN is something else.",
      brief: "Local edges recover the walk. Press R if you want recurrence — it is a different graph.",
      target: "field",
      graph: "local",
    },
    {
      id: "frames",
      label: "Frames",
      klass: "certificate",
      status: `${Math.round(report.sheaf.explainedVariance * 100)}% 2-view`,
      note: "Chosen rank, not discovered dimension.",
      brief: "The drawing plane is a choice. Explained variance is not a new axis.",
      target: "field",
      level: "mid",
    },
    {
      id: "transport",
      label: "Transport",
      klass: report.sheaf.meanHolonomy > 1e-6 ? "certificate" : "identity",
      status: `|K| ${report.sheaf.meanHolonomy.toFixed(2)}`,
      note: "Cycle products. Not a pair histogram.",
      brief: "Holonomy is curvature. A loop that fails to close is what a connection is for.",
      target: "torus",
    },
    {
      id: "sheaf",
      label: "Sheaf gate",
      klass: sheafOk ? "certificate" : "excluded",
      status: sheafOk ? "δ² = 0" : "connection only",
      note: sheafOk
        ? "δ² = 0. Restriction is an identity."
        : "Pairwise Procrustes does not promote.",
      brief: sheafOk
        ? "δ² = 0. Function restriction is an identity. Glueing of labels is H⁰, not this gate."
        : "The gate is shut. δ² failed. Do not write cohomology.",
      target: "ceiling",
    },
    {
      id: "topology",
      label: "Topology",
      klass: sheafOk ? "empirical" : "excluded",
      status: `${report.persistence.longLived} long H₀`,
      note: "Metric-derived. Still no information beyond the metric.",
      brief: sheafOk
        ? "Long H₀ bars survive scale. They are still the metric, spoken slowly."
        : "Topology is not eligible. The barcode is a metric summary only.",
      target: "topology",
      level: "high",
    },
    {
      id: "null",
      label: "Null",
      klass: p !== undefined && p < 0.2 ? "empirical" : "excluded",
      status: p !== undefined ? `p ≈ ${p.toFixed(2)}` : "—",
      note: report.nulls?.name ?? "No justified null yet.",
      brief:
        report.nulls?.justification ??
        "A green p against the wrong ensemble is still excluded.",
      target: "null",
    },
  ];
}

export function stageById(report: AdapterReport, id: string) {
  return pipelineOf(report).find((s) => s.id === id) ?? null;
}

export const STAGE_IDS = [
  "data",
  "neighborhood",
  "frames",
  "transport",
  "sheaf",
  "topology",
  "null",
] as const;
