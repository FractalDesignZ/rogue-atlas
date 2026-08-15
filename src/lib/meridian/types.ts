export type WindowKind = "hard" | "master";

export type DomainId =
  | "zeta"
  | "markets"
  | "pulse"
  | "climate"
  | "spectra"
  | "custom";

export type FrequencyAtom = {
  q: number;
  omega: number;
  amplitude2: number;
  p: number;
  k: number;
  label: string;
};

export type Measure = {
  atoms: FrequencyAtom[];
  weights: number[];
  omegas: number[];
  Z: number;
  mu2: number;
  mu4: number;
  mu6: number;
  neff: number;
  speed: number;
  curvature: number;
  activePrimes: number;
};

export type Series = {
  id: DomainId | "custom";
  name: string;
  short: string;
  domain: DomainId;
  ordinates: number[];
  offset: number;
  blurb: string;
  frequencyNote: string;
};

export type GeometryReport = {
  measure: Measure;
  gaps: number[];
  distances: number[];
  expansion: { t: number; exact: number; quad: number }[];
  quadraticRadius: number;
  firstReversal: number;
  adjacentLocal: number;
  branchEdges: number;
  featureTangent: number;
  ordinateTangent: number;
  orbitTangent: number;
  orbit: { x: number; y: number; t: number }[];
  recurrenceWitness: { gap: number; distance: number };
};

export type OperatorReport = {
  index: number[];
  actual: number[];
  smooth: number[];
  perturbed: number[];
  residualSmooth: number[];
  residualPerturbed: number[];
  rmseSmooth: number;
  rmsePerturbed: number;
  improvedBlocks: number;
  totalBlocks: number;
  Q: number;
  alpha: number;
};

export type ProtocolReport = {
  arithmetic: number;
  spacing: number;
  primary: number;
  gueScores: number[];
  pemp: number;
  verdict: "identity" | "inconclusive" | "held-out";
  holdoutPrimes: number[];
  cell: { Q: number; k: number };
};

export type SynthesisReport = {
  domain: DomainId;
  speed: number;
  curvature: number;
  neff: number;
  tangent: number;
  concentration: number;
  operatorGain: number;
};
