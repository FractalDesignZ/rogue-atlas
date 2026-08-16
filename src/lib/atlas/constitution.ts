import type { ClaimClass } from "../adapter/claims";
import type { AdapterSource } from "../adapter/types";

/** Six public evidence statuses. The four manuscript classes map onto these. */
export type EvidenceStatus =
  | "exact"
  | "certified"
  | "observed"
  | "validated"
  | "failed"
  | "speculative";

export const EVIDENCE_LABEL: Record<EvidenceStatus, string> = {
  exact: "Exact",
  certified: "Certified",
  observed: "Observed",
  validated: "Validated",
  failed: "Failed",
  speculative: "Speculative",
};

export const EVIDENCE_NOTE: Record<EvidenceStatus, string> = {
  exact: "Follows mathematically from the declared representation.",
  certified: "A finite numerical check of that identity passed.",
  observed: "Descriptive of the loaded data. Not yet held out.",
  validated: "Survived a declared holdout or justified null.",
  failed: "The declared test did not pass. The construction may still stand.",
  speculative: "Interpretation, jump, or outside-scope claim. Not sold as fact.",
};

export function evidenceOf(
  klass: ClaimClass,
  extras: { validated?: boolean; failed?: boolean } = {},
): EvidenceStatus {
  if (klass === "identity") return "exact";
  if (klass === "certificate") return "certified";
  if (klass === "excluded") return "speculative";
  if (extras.failed) return "failed";
  if (extras.validated) return "validated";
  return "observed";
}

export type CoordinateRole =
  | "physical-time"
  | "sequence"
  | "spectral"
  | "spatial"
  | "categorical"
  | "constructed"
  | "visualization";

export const COORDINATE_NOTE: Record<CoordinateRole, string> = {
  "physical-time": "Operational clock. Not a spectral parameter.",
  sequence: "Order of the walk. Continuity is topological, not temporal.",
  spectral: "Ordinate that generates a phase curve. Does not establish physical time.",
  spatial: "A length, depth, or TVT along a hole. Geometry of a path, not a clock.",
  categorical: "Context. Formation, rig, tool, speaker. Not an axis to embed.",
  constructed: "A delay window, a torus angle, a state coordinate we built.",
  visualization: "A chosen projection. Never evidence of intrinsic dimension.",
};

export const SOURCE_COORDINATE: Record<AdapterSource, CoordinateRole> = {
  thought: "sequence",
  zeta: "spectral",
  markets: "physical-time",
  pulse: "physical-time",
  climate: "physical-time",
  spectra: "spectral",
  custom: "sequence",
  drill: "physical-time",
  wellbore: "spatial",
};

export type LadderLevel = 0 | 1 | 2 | 3 | 4 | 5;

export type ComputeRate = "fast" | "medium" | "slow";

export type LadderRung = {
  level: LadderLevel;
  title: string;
  body: string;
  rate: ComputeRate;
};

export const COMPUTE_RATE: Record<
  ComputeRate,
  { target: string; examples: string; claim: string }
> = {
  fast: {
    target: "milliseconds",
    examples: "sensor checks, rolling summaries, hard interlocks, cached neighbors",
    claim: "Engineering target, not a measured 10 Hz certificate.",
  },
  medium: {
    target: "subsecond to seconds",
    examples: "incremental PCA, local dimension, recurrence, gating updates",
    claim: "Selected rolling windows. Not every tick.",
  },
  slow: {
    target: "seconds to hours",
    examples: "exact persistence, null ensembles, holonomy, retraining, certificates",
    claim: "Asynchronous. Never sold as the 100 ms loop.",
  },
};

export const LADDER: LadderRung[] = [
  {
    level: 0,
    title: "Deterministic rules",
    body: "Thresholds, interlocks, envelopes. Stay on regardless of the model.",
    rate: "fast",
  },
  {
    level: 1,
    title: "Classical baselines",
    body: "Change-points, robust covariance, trees, sequence classifiers.",
    rate: "fast",
  },
  {
    level: 2,
    title: "Geometric features",
    body: "Local dimension, tangent variation, recurrence, geodesic proxies.",
    rate: "medium",
  },
  {
    level: 3,
    title: "Topological features",
    body: "Persistence, Betti curves, landscapes. Candidate signatures, not identities.",
    rate: "slow",
  },
  {
    level: 4,
    title: "Mixture of experts",
    body: "Route among validated specialists. Do not hide a weak model in a gate.",
    rate: "medium",
  },
  {
    level: 5,
    title: "Decision optimization",
    body: "Recommendations under hard constraints. Never replace certified interlocks.",
    rate: "medium",
  },
];

export type Promotion = { ok: boolean; note: string };

/** A rung advances only when a simpler baseline is beaten on a declared holdout. */
export function canPromote(
  from: LadderLevel,
  to: LadderLevel,
  evidence: { incrementalValue: boolean; holdout: boolean },
): Promotion {
  if (to <= from) return { ok: false, note: "Not an advance." };
  if (to > from + 1) return { ok: false, note: "Skip no rungs. The ladder is the refuse." };
  if (to >= 3 && !evidence.holdout) {
    return { ok: false, note: "Topology is not a production signal without a holdout." };
  }
  if (to >= 4 && !evidence.incrementalValue) {
    return {
      ok: false,
      note: "MoE does not promote until a specialist beats the Level 1 baseline.",
    };
  }
  if (!evidence.holdout && to >= 2) {
    return { ok: false, note: "Unseen wells, rigs, formations, or time periods first." };
  }
  return { ok: true, note: "Eligible to try. Not yet validated." };
}

export const SEQUENCE = [
  "Declare",
  "Represent",
  "Audit",
  "Compare",
  "Validate",
  "Advise",
  "Act",
] as const;

export type AtlasProduct = "research" | "operations" | "audit";

export const PRODUCTS: {
  id: AtlasProduct;
  name: string;
  forWhom: string;
  body: string;
  href: "/studio" | "/adapter" | "/atlas";
}[] = [
  {
    id: "research",
    name: "Atlas Research",
    forWhom: "Mathematicians, physicists, TDA, computational science",
    body: "Phase embeddings, orbit versus closure, two graphs, certificates, reproducible manifests. The zeta manuscript is the reference demonstration.",
    href: "/studio",
  },
  {
    id: "operations",
    name: "Atlas Operations",
    forWhom: "Drilling, plants, rotating machines, live streams",
    body: "Physical-time replay, regime candidates, expert routing, advisory only. GT-MoE Rogue is the first vertical — not a certified controller.",
    href: "/adapter",
  },
  {
    id: "audit",
    name: "Atlas Audit",
    forWhom: "Anyone who has to sign the claim",
    body: "What was imposed. What follows identically. What the test verified. What failed. What stays speculative. Whether the complex method beat a simpler baseline.",
    href: "/atlas",
  },
];

export type Correction = { sold: string; better: string };

export const CORRECTIONS: Correction[] = [
  {
    sold: "Drilling data is inherently non-Euclidean.",
    better:
      "Drilling dynamics may admit useful nonlinear representations. The platform tests whether they are stable and predictive. A curved 3D projection is not an intrinsic manifold.",
  },
  {
    sold: "Persistent homology is immune to sensor noise.",
    better:
      "Persistence can be robust under defined perturbations. Operational robustness is measured across noise, sampling, windows, and missing data.",
  },
  {
    sold: "Stick-slip, whirl, and bounce have fixed Betti signatures.",
    better:
      "Those are candidate signatures. Validity depends on window, channels, metric, rate, labels, and filtration. They are not physical identities.",
  },
  {
    sold: "Safety is built into the geometry.",
    better:
      "Hard interlocks are independent and deterministic. Geometric penalties are advisory risk scores. A learned metric cannot certify a limit.",
  },
  {
    sold: "Geodesic optimization produces the safe path.",
    better:
      "A geodesic is shortest under a chosen metric. It is safe only if that metric and the admissible region encode the actual risk. Who defined it, from which data, under which validation.",
  },
];

export const POSITIONING = {
  weak: "We use advanced topology and Riemannian geometry to understand drilling data.",
  strong:
    "Rogue Atlas tests whether geometric, topological, and AI representations reveal validated operational structure beyond conventional baselines — and deploys only what survives those tests.",
  researchers:
    "A reproducible studio for separating representation-induced structure from independently supported discovery.",
  operators:
    "A transparent regime-intelligence layer that shows what the model sees, why it matters, how certain it is, and whether it has worked on comparable unseen operations.",
};

export type TransferRow = {
  capability: string;
  zeta: string;
  drilling: string;
  reusable: "algorithm" | "interpretation";
};

export const TRANSFER: TransferRow[] = [
  {
    capability: "Sequential coordinate",
    zeta: "Zero ordinate γ",
    drilling: "Physical timestamp",
    reusable: "algorithm",
  },
  {
    capability: "Feature map",
    zeta: "Prime-power phases",
    drilling: "Sensor / window features",
    reusable: "algorithm",
  },
  {
    capability: "Local geometry",
    zeta: "Exact rank-one tangent",
    drilling: "Estimated state dimension",
    reusable: "algorithm",
  },
  {
    capability: "Global recurrence",
    zeta: "Quasiperiodic phase returns",
    drilling: "Repeated operational regimes",
    reusable: "interpretation",
  },
  {
    capability: "Persistent topology",
    zeta: "Geometry diagnostic",
    drilling: "Candidate regime features",
    reusable: "interpretation",
  },
  {
    capability: "Null model",
    zeta: "GUE, spacing, Poisson",
    drilling: "Time-series and physics-matched controls",
    reusable: "interpretation",
  },
  {
    capability: "Expert routing",
    zeta: "Mostly unnecessary",
    drilling: "Normal, stick-slip, whirl, bounce specialists",
    reusable: "algorithm",
  },
  {
    capability: "Safety layer",
    zeta: "Not applicable",
    drilling: "Hard interlocks, independent of the model",
    reusable: "interpretation",
  },
];

export function gueAllowed(source: AdapterSource): boolean {
  return source === "zeta";
}

export function bettiIsIdentity(): boolean {
  return false;
}

export function geometryCertifiesSafety(): boolean {
  return false;
}

/** The sheaf gate is δ². Function restriction is an identity, not a second vote. */
export function sheafEligible(sheaf: { coboundaryNilpotent: boolean }): boolean {
  return sheaf.coboundaryNilpotent;
}

export type Imposition = "imposed" | "estimated" | "learned";

export type Representation = {
  name: string;
  imposition: Imposition;
  role: CoordinateRole | "feature";
  note: string;
};

export function representationsFor(source: AdapterSource): Representation[] {
  if (source === "zeta" || source === "spectra") {
    return [
      { name: "Ordinates γ", imposition: "imposed", role: "spectral", note: "Declared sequence. Not a clock." },
      { name: "Phase map Φ", imposition: "imposed", role: "constructed", note: "Prime-power dictionary. Distances are gap transforms." },
      { name: "2-view PCA", imposition: "imposed", role: "visualization", note: "Chosen rank. Not discovered dimension." },
      { name: "Torus closure", imposition: "estimated", role: "constructed", note: "N_eff primes. Closure is not the tangent." },
    ];
  }
  if (source === "drill" || source === "wellbore") {
    return [
      {
        name: "Sensor / TVT channels",
        imposition: "imposed",
        role: source === "wellbore" ? "spatial" : "physical-time",
        note: "Operational coordinates. Interlocks stay on L0.",
      },
      { name: "Delay window", imposition: "imposed", role: "constructed", note: "A state we built. Window length is a hypothesis." },
      { name: "3D manifold view", imposition: "imposed", role: "visualization", note: "A curved projection is not an intrinsic manifold." },
      { name: "Persistence / Betti", imposition: "estimated", role: "constructed", note: "Candidate regime features. Not identities." },
      { name: "Expert routing", imposition: "learned", role: "categorical", note: "Promotes only after a specialist beats L1." },
    ];
  }
  return [
    { name: "Walk order", imposition: "imposed", role: "sequence", note: "Continuity is topological, not temporal." },
    { name: "Value warp", imposition: "imposed", role: "constructed", note: "Travel cost 1/v. Who marked the values is the author." },
    { name: "2-view", imposition: "imposed", role: "visualization", note: "Chosen. Not a discovered manifold." },
    { name: "Persistence", imposition: "estimated", role: "constructed", note: "Metric-derived. Still the metric, spoken slowly." },
  ];
}

export type RungReading = {
  level: LadderLevel;
  title: string;
  note: string;
  next: string;
};

export function rungOf(input: {
  source: AdapterSource;
  nullP?: number;
  incrementalValue?: boolean;
  holdout?: boolean;
}): RungReading {
  if (input.source === "zeta" || input.source === "spectra") {
    const failed = input.nullP === undefined || input.nullP >= 0.05;
    return {
      level: 2,
      title: LADDER[2]!.title,
      note: failed
        ? "Exact rank-one geometry. The arithmetic graph did not beat a spacing-only baseline. Topology stays a diagnostic."
        : "Geometry holds. A spacing-beating graph would be eligible to try L3 — still not a law.",
      next: "Do not promote persistence to a production signal on a failed hold-out.",
    };
  }
  if (input.source === "drill" || input.source === "wellbore") {
    const moe = canPromote(1, 2, {
      incrementalValue: !!input.incrementalValue,
      holdout: !!input.holdout,
    });
    if (!input.holdout) {
      return {
        level: 1,
        title: LADDER[1]!.title,
        note: "Interlocks stay on L0. Classical baselines are the floor. Persistence and experts are candidates.",
        next: moe.ok
          ? "Eligible to try geometry on unseen wells."
          : "Unseen wells, rigs, or formations before L2 becomes a signal.",
      };
    }
    return {
      level: 2,
      title: LADDER[2]!.title,
      note: "Geometry may speak as a candidate. Betti patterns are not identities. Experts stay unpromoted.",
      next: canPromote(2, 3, {
        incrementalValue: !!input.incrementalValue,
        holdout: true,
      }).note,
    };
  }
  return {
    level: 2,
    title: LADDER[2]!.title,
    note: "Geometry of the walk. Persistence is observed, not validated.",
    next: "A holdout is required before topology is more than a view.",
  };
}
