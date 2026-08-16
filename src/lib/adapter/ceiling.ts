import { sheafEligible } from "../atlas/constitution";
import type { AdapterReport } from "./types";
import type { GraphReport } from "./graphs";

export type CeilingId = "pair" | "rips" | "holonomy" | "sheaf";

export type CeilingLayer = {
  id: CeilingId;
  title: string;
  status: "pair" | "metric" | "connection" | "sheaf" | "blocked";
  body: string;
};

export type CeilingReport = {
  layers: CeilingLayer[];
  note: string;
};

export function metricCeiling(report: AdapterReport, graph: GraphReport): CeilingReport {
  const pairN = (report.states.length * (report.states.length - 1)) / 2;
  const long = report.persistence.longLived;
  const sheafOk = sheafEligible(report.sheaf);
  const layers: CeilingLayer[] = [
    {
      id: "pair",
      title: "Pair-summary",
      status: "pair",
      body: `${pairN.toFixed(0)} chords. A histogram of distances cannot see who shares a vertex.`,
    },
    {
      id: "rips",
      title: "Metric topology",
      status: "metric",
      body: `${long} long H₀ bar${long === 1 ? "" : "s"}. Rips uses labeled triples — still no information beyond the metric.`,
    },
    {
      id: "holonomy",
      title: "Connection",
      status: report.sheaf.meanHolonomy > 1e-6 ? "connection" : "pair",
      body:
        report.sheaf.triangles > 0
          ? `${report.sheaf.triangles} triangles. Mean |K| = ${report.sheaf.meanHolonomy.toFixed(3)}. Cycle products are not a pair histogram.`
          : "No filled triangles. Holonomy has nothing to multiply.",
    },
    {
      id: "sheaf",
      title: "True sheaf",
      status: sheafOk ? "sheaf" : "blocked",
      body: sheafOk
        ? `δ² = 0 on declared cells. Function restriction is an identity, not a second certificate. ${graph.note}`
        : `Pairwise transport does not promote. Retain as a connection only. ${report.sheaf.holonomyNote}`,
    },
  ];
  return {
    layers,
    note: sheafOk
      ? "The higher object is a sheaf on the declared cells — not a physical bundle."
      : "Stop at the connection. A pretty cycle is not H¹.",
  };
}
