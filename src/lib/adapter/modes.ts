import type { AdapterReport } from "./types";
import type { MiddleOut, OpenCurveGeom } from "./wellbore";

export type AbstractionModeId = "M0" | "M1" | "M2" | "M3" | "M4" | "M5" | "M6";

export type ModeCard = {
  id: AbstractionModeId;
  name: string;
  role: string;
  status: string;
  note: string;
};

export function modeStack(
  report: AdapterReport,
  curve: OpenCurveGeom,
  mid: MiddleOut,
): ModeCard[] {
  return [
    {
      id: "M0",
      name: "Restrict",
      role: "Law",
      status: "TVT / range RMSE · no production OPEN",
      note: "The only score is a reading against a held prior. Not a new physical law.",
    },
    {
      id: "M1",
      name: "Geom",
      role: "Open curve",
      status: `κ̄ ${curve.meanCurv.toFixed(3)} · twist ${curve.cumTwist.toFixed(3)}`,
      note: "Bishop transport along an open polyline. Closed holonomy is not claimed.",
    },
    {
      id: "M2",
      name: "Prior",
      role: "Last known",
      status: `hold ${mid.lastKnown.toFixed(2)} · err ${mid.priorErr.toFixed(3)}`,
      note: "Heel TVT held across the toe. A prior, not a forced connection.",
    },
    {
      id: "M3",
      name: "Match",
      role: "Sequence",
      status: report.sequences[0]?.label ?? "no sequence",
      note: report.sequences[0]?.note ?? "No typewell match survived the guard.",
    },
    {
      id: "M4",
      name: "Middle-out",
      role: "Heel | toe",
      status: `cut ${mid.cut + 1} / ${report.states.length}`,
      note: "Known section is the reference. The toe is the residual problem.",
    },
    {
      id: "M5",
      name: "Residual",
      role: "Correction",
      status: mid.gate3 === "accept" ? "ACCEPT" : "REJECT",
      note: mid.gateNote,
    },
    {
      id: "M6",
      name: "Certify",
      role: "Measure",
      status: report.sheaf.coboundaryNilpotent ? "δ² = 0" : "δ² fails",
      note: `${report.sheaf.holonomyNote} This is a certificate, not a marketing OPEN.`,
    },
  ];
}
