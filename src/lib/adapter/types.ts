export type OutcomeKind = "known" | "perceived" | "speculative";

export type RegimeId = "ordered" | "critical" | "disordered" | "transition";

export type AdapterSource =
  | "thought"
  | "zeta"
  | "markets"
  | "pulse"
  | "climate"
  | "spectra"
  | "custom"
  | "wellbore"
  | "drill";

export type TimeKind = "physical" | "parameter" | "filtration" | "simulation";

export type GraphKind = "local" | "recurrence";

export type AbstractionLevel = "low" | "mid" | "high";

export type ModalityLens = "all" | "necessary" | "possible" | "unentailed";

export type SequencePattern =
  | "foundation-expansion"
  | "constraint-elimination"
  | "dependency-inversion"
  | "hold";

export type PrimeRole = "prime" | "gateway" | "dependent";

export type TransferKind = "holds" | "warps" | "breaks";

export type ValueWeights = {
  continuity: number;
  novelty: number;
  stability: number;
  leverage: number;
};

export type ConditionState = {
  i: number;
  t: number;
  gap: number;
  speed: number;
  curvature: number;
  surprise: number;
  x: number;
  y: number;
  label: string;
  clause?: string;
};

export type OpenSet = {
  id: number;
  center: number;
  members: number[];
  radius: number;
  property: string;
};

export type ActivityState = {
  id: RegimeId;
  label: string;
  note: string;
  betti0: number;
  betti1: number;
  fisher: number;
  typeI: number;
  typeII: number;
};

export type SheafReport = {
  triangles: number;
  tets: number;
  edges: number;
  meanHolonomy: number;
  meanCurvatureF: number;
  holonomyNote: string;
  bianchiResidual: number;
  coboundaryResidual: number;
  coboundaryNilpotent: boolean;
  restrictionResidual: number;
  restrictionCompatible: boolean;
  glueingResidual: number;
  viewResidual: number;
  explainedVariance: number;
  maxWasserstein: number;
  shiabClaimed: false;
  lorentzianClaimed: false;
  pcaDiscoversDimension: false;
  timeNote: string;
  spectralGap: number;
};

export type OutcomeRange = {
  id: string;
  kind: OutcomeKind;
  title: string;
  reading: string;
  modality: "necessary" | "possible" | "unentailed";
  low: number;
  high: number;
  unit: string;
  value: number;
  continuity: number;
  members: number[];
  attractor: { x: number; y: number };
};

export type GeodesicStep = {
  i: number;
  title: string;
  body: string;
};

export type AxiomaticPrime = {
  i: number;
  role: PrimeRole;
  score: number;
  why: string;
};

export type SequenceMap = {
  id: string;
  pattern: SequencePattern;
  label: string;
  note: string;
  chain: number[];
};

export type AbstractionRung = {
  level: AbstractionLevel;
  title: string;
  body: string;
  items: string[];
};

export type LanguageShift = {
  from: string;
  to: string;
  note: string;
};

export type Horizon = {
  nextKind: OutcomeKind | "open";
  nextTitle: string;
  reading: string;
  untilJump: number | null;
  stepsAhead: number;
  remainingKnown: number;
  remainingSpeculative: number;
};

export type H0Bar = {
  birth: number;
  death: number;
  persist: number;
};

export type PersistenceReport = {
  h0: H0Bar[];
  bettiCurve: { r: number; b0: number; b1: number }[];
  longLived: number;
  maxScale: number;
};

export type AdapterReport = {
  source: AdapterSource;
  title: string;
  prompt: string;
  coordinateRole?: import("../atlas/constitution").CoordinateRole;
  ingestNote?: string;
  states: ConditionState[];
  opens: OpenSet[];
  regime: ActivityState;
  sheaf: SheafReport;
  outcomes: OutcomeRange[];
  geodesic: number[];
  geodesicWarped: { x: number; y: number }[];
  jumps: { from: number; to: number; size: number }[];
  continuity: number;
  hallucinationRisk: number;
  planContinuous: boolean;
  now: number;
  terms: GeodesicStep[];
  weights: ValueWeights;
  valueField: number[];
  typeIField: number[];
  typeIIField: number[];
  wasserstein: number[];
  primes: AxiomaticPrime[];
  sequences: SequenceMap[];
  ladder: AbstractionRung[];
  languageShifts: LanguageShift[];
  nowCaption: string;
  horizon: Horizon;
  persistence: PersistenceReport;
  curve?: import("./wellbore").OpenCurveGeom;
  middleOut?: import("./wellbore").MiddleOut;
  modes?: import("./modes").ModeCard[];
  orbit?: import("./orbit").OrbitReport;
  claims?: import("./claims").ClaimItem[];
  graphs?: import("./graphs").GraphReport;
  ceiling?: import("./ceiling").CeilingReport;
  nulls?: import("./nulls").NullReport;
  provenance?: import("./provenance").Provenance;
  pathCost?: ReturnType<typeof import("./graphs").pathCosts>;
  planeTangent?: ReturnType<typeof import("./graphs").planeTangents>;
  vv?: import("./verify").VerifyReport;
};

export type TransferredRange = {
  fromId: string;
  fromTitle: string;
  fromKind: OutcomeKind;
  toId: string | null;
  toKind: OutcomeKind | null;
  kind: TransferKind;
  note: string;
};

export type CompareReport = {
  heldTitle: string;
  liveTitle: string;
  heldSource: AdapterSource;
  liveSource: AdapterSource;
  shapeDistance: number;
  regimeSame: boolean;
  continuityDelta: number;
  sharedSequences: SequencePattern[];
  transfers: TransferredRange[];
  verdict: TransferKind;
  headline: string;
  note: string;
};

export type AtlasEntry = {
  id: string;
  savedAt: number;
  title: string;
  source: AdapterSource;
  prompt: string;
  summary: string;
  report: AdapterReport;
};

export type NoticedSeed = {
  id: string;
  i: number;
  label: string;
  source: AdapterSource;
  prompt: string;
  fieldTitle: string;
  savedAt: number;
};

export type JournalBeat = {
  id: string;
  i: number;
  caption: string;
  kind: OutcomeKind | "open";
  at: number;
};
