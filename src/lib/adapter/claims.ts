import type { AdapterReport } from "./types";

export type ClaimClass = "identity" | "certificate" | "empirical" | "excluded";

export type ClaimItem = {
  id: string;
  klass: ClaimClass;
  title: string;
  body: string;
  extras?: { validated?: boolean; failed?: boolean };
};

export const CLAIM_LABEL: Record<ClaimClass, string> = {
  identity: "Identity",
  certificate: "Certificate",
  empirical: "Empirical",
  excluded: "Excluded",
};

export function claimLedger(report: AdapterReport): ClaimItem[] {
  const sheafOk = report.sheaf.coboundaryNilpotent;
  const hol = report.sheaf.meanCurvatureF;
  const mid = report.middleOut;
  const curve = report.curve;
  const beat = (report.nulls?.pApprox ?? 1) < 0.05;
  return [
    {
      id: "orbit",
      klass: "identity",
      title: "Orbit dimension is one",
      body: "The walk is a one-parameter orbit. Higher-looking rank is torus closure, not a new manifold.",
    },
    {
      id: "kernel",
      klass: "identity",
      title: "Pair distances are a function of gaps",
      body: "At a fixed dictionary the metric is determined by ordinate differences plus the declared measure. No independent observations hide in the chords.",
    },
    {
      id: "delta",
      klass: sheafOk ? "certificate" : "empirical",
      title: sheafOk ? "δ² = 0 on declared cells" : "δ² failed the declared cells",
      body: sheafOk
        ? "Cellular coboundary squares to zero. Function-sheaf restriction is an identity — not a second certificate."
        : report.sheaf.holonomyNote,
    },
    {
      id: "holonomy",
      klass: hol > 1e-6 ? "certificate" : "identity",
      title: "Holonomy is curvature, not a failed bundle",
      body: `Mean |K| = ${hol.toFixed(3)}. Pairwise Procrustes does not promote to a flat higher sheaf.`,
    },
    {
      id: "persist",
      klass: "empirical",
      title: "Persistence is metric-derived topology",
      body: `${report.persistence.longLived} long H₀ bars. Rips uses labeled vertex-sharing, not a pair histogram — still no information beyond the metric.`,
    },
    {
      id: "gate",
      klass: mid?.gate3 === "accept" ? "empirical" : "certificate",
      title: mid ? `Gate3 ${mid.gate3.toUpperCase()}` : "No residual gate",
      body: mid
        ? mid.gateNote
        : "A residual is eligible only if it beats last-known hold.",
    },
    {
      id: "curve",
      klass: "identity",
      title: "The curve is open",
      body: curve
        ? `Tortuosity ${curve.tortuosity.toFixed(3)}, cum twist ${curve.cumTwist.toFixed(3)}. Closed holonomy = 0 is not claimed.`
        : "Open-curve transport only.",
    },
    {
      id: "physics",
      klass: "excluded",
      title: "Not a physical Hamiltonian",
      body: "A discrete field is not evidence the corresponding field exists. No RH, no Hilbert–Pólya, no new law.",
    },
    {
      id: "gue",
      klass: "excluded",
      title: "GUE is not a universal null",
      body: "GUE and Poisson belong to spectral spacing. A drill manifold, a thought, a latent space need their own justified null.",
    },
    {
      id: "null-beat",
      klass: "empirical",
      extras: {
        validated: beat,
        failed: !beat,
      },
      title: beat ? "Beat the justified null" : "Did not beat the justified null",
      body: report.nulls
        ? `p ≈ ${report.nulls.pApprox.toFixed(2)} on ${report.nulls.replicates} ${report.nulls.name} shuffles. A pretty graph is not a finding.`
        : "No justified null has been run.",
    },
  ];
}
