import type { AdapterSource, ValueWeights } from "./types";

export const DEFAULT_WEIGHTS: ValueWeights = {
  continuity: 0.72,
  novelty: 0.38,
  stability: 0.55,
  leverage: 0.42,
};

export type AdapterPreset = {
  id: string;
  source: AdapterSource;
  title: string;
  kicker: string;
  prompt: string;
  note: string;
};

export const ADAPTER_PRESETS: AdapterPreset[] = [
  {
    id: "argument",
    source: "thought",
    title: "A thought that jumps",
    kicker: "Language",
    prompt:
      "The afternoon was ordinary and the sky held still. Then the argument leapt to a medical claim nobody had mentioned. I want a calm continuation, not a new story.",
    note: "Contrast words become gaps. A jump is a discontinuity — the CST name for a hallucination.",
  },
  {
    id: "trade",
    source: "thought",
    title: "A quiet book, then a gap",
    kicker: "Markets",
    prompt:
      "The book was quiet for three sessions and the range held. Then it gapped. Analysts say it will settle. I am not sure it will.",
    note: "Known range is the held book. Perceived is mean-reversion. Speculative is the invented sequel.",
  },
  {
    id: "pulse",
    source: "thought",
    title: "Even beats, then a skip",
    kicker: "Pulse",
    prompt:
      "Even, even, even. The interval holds and the body is boring in the best way. Then a skipped beat, and another, and I wait to see if sinus returns.",
    note: "Ordered interiors are necessity. Ectopy is a Type-II cliff — the ground is solid; the value drops fast.",
  },
  {
    id: "weather",
    source: "thought",
    title: "Season, then a break",
    kicker: "Climate",
    prompt:
      "Rain followed rain and the season locked. A slow swing arrived, then a break that does not belong to the year I know. What range still counts as weather?",
    note: "Seasonal lock is a known basin. The break is only possible if the geodesic is allowed to jump.",
  },
  {
    id: "studio-zeta",
    source: "zeta",
    title: "Riemann ordinates",
    kicker: "Studio",
    prompt: "Map the native zero series as condition:states. Promote only what a continuous path can reach.",
    note: "The arithmetic kernel still stands. The adapter only reads its topology.",
  },
  {
    id: "studio-markets",
    source: "markets",
    title: "Market residuals",
    kicker: "Studio",
    prompt: "Volatility crossings as a living book. Where is the next range if I refuse a discontinuous story?",
    note: "Same kernel as the studio. The value function is yours, not the market's.",
  },
  {
    id: "studio-pulse",
    source: "pulse",
    title: "Inter-beat intervals",
    kicker: "Studio",
    prompt: "Read the pulse as overlapping neighborhoods. A skip is allowed only if an open set already contains it.",
    note: "Interior = robust. Closure = merely possible.",
  },
  {
    id: "paste",
    source: "custom",
    title: "A pasted walk",
    kicker: "Yours",
    prompt:
      "0.4, 0.41, 0.39, 0.42, 0.40, 0.88, 0.91, 0.43, 0.41, 0.40, 1.2, 0.44, 0.42",
    note: "Paste numbers. Unsorted values become a walk. Six or more samples make a field.",
  },
  {
    id: "wellbore",
    source: "wellbore",
    title: "Heel holds, toe is residual",
    kicker: "Well",
    prompt:
      "Open-curve landing. Heel is the known section. The toe is a residual — accept only if it beats last-known hold.",
    note: "M4 middle-out. Gate3 refuses a residual that does not beat the prior. Holonomy stays open.",
  },
  {
    id: "drill",
    source: "drill",
    title: "The hole has a shape before a threshold",
    kicker: "Drill",
    prompt:
      "WOB, RPM, torque, ROP on a curved manifold. Betti names the regime. Safety is in the metric, not bolted on.",
    note: "Synthetic GT-MoE walk. Stick-slip, whirl, bounce. A3.1 refuses. Not a certified rig controller.",
  },
];

export const SOURCE_META: {
  id: AdapterSource;
  label: string;
}[] = [
  { id: "thought", label: "Thought" },
  { id: "zeta", label: "Zeros" },
  { id: "markets", label: "Book" },
  { id: "pulse", label: "Pulse" },
  { id: "climate", label: "Season" },
  { id: "spectra", label: "Spectra" },
  { id: "custom", label: "Paste" },
  { id: "wellbore", label: "Well" },
  { id: "drill", label: "Drill" },
];

export const WEIGHT_META: {
  key: keyof ValueWeights;
  label: string;
  hint: string;
}[] = [
  {
    key: "continuity",
    label: "Continuity",
    hint: "Prefer overlapping open sets. Punish jumps.",
  },
  {
    key: "novelty",
    label: "Novelty",
    hint: "Seek surprise — high local KL, new information.",
  },
  {
    key: "stability",
    label: "Stability",
    hint: "Stay in interiors. Necessity, not mere possibility.",
  },
  {
    key: "leverage",
    label: "Leverage",
    hint: "Walk the Type-II cliffs, where a little move changes meaning.",
  },
];

export type CompassScene = {
  id: string;
  label: string;
  hint: string;
  weights: ValueWeights;
};

export const COMPASS_SCENES: CompassScene[] = [
  {
    id: "hold",
    label: "Keep the room",
    hint: "Continuity first. Overlap, don't invent.",
    weights: { continuity: 0.92, novelty: 0.16, stability: 0.78, leverage: 0.22 },
  },
  {
    id: "seek",
    label: "Let it surprise",
    hint: "Novelty first. Pay for new information.",
    weights: { continuity: 0.32, novelty: 0.9, stability: 0.22, leverage: 0.55 },
  },
  {
    id: "steady",
    label: "Don't fall",
    hint: "Stability first. Stay in interiors.",
    weights: { continuity: 0.58, novelty: 0.22, stability: 0.92, leverage: 0.28 },
  },
  {
    id: "prime",
    label: "Follow the load-bearing",
    hint: "Leverage first. Walk the cliffs.",
    weights: { continuity: 0.42, novelty: 0.4, stability: 0.3, leverage: 0.9 },
  },
];
