import { create } from "zustand";
import { parseSeries, seriesFor } from "./domains";
import { runAnalysis, runProtocol, runSynthesis, type StudioAnalysis } from "./analyze";
import { analyzeGeometry } from "./geometry";
import { analyzeOperator } from "./operator";
import type { DomainId, ProtocolReport, SynthesisReport, WindowKind } from "./types";

export type StudioTab = "geometry" | "graphs" | "operator" | "protocol" | "synthesis" | "adapter";

type StudioState = {
  domain: DomainId;
  Q: number;
  k: number;
  alpha: number;
  window: WindowKind;
  customText: string;
  tab: StudioTab;
  analysis: Omit<StudioAnalysis, "synthesis"> | null;
  synthesis: SynthesisReport[] | null;
  analyzing: boolean;
  setDomain: (d: DomainId) => void;
  setQ: (q: number) => void;
  setK: (k: number) => void;
  setAlpha: (a: number) => void;
  setWindow: (w: WindowKind) => void;
  setCustomText: (t: string) => void;
  setTab: (t: StudioTab) => void;
  recompute: () => void;
  ensureProtocol: () => void;
  computeSynthesis: () => void;
};

function compute(state: Pick<StudioState, "domain" | "Q" | "k" | "alpha" | "window" | "customText">) {
  const custom = parseSeries(state.customText);
  const series = seriesFor(state.domain, custom);
  return runAnalysis(series, {
    Q: state.Q,
    k: state.k,
    alpha: state.alpha,
    window: state.window,
  });
}

export const useStudio = create<StudioState>((set, get) => ({
  domain: "zeta",
  Q: 32,
  k: 8,
  alpha: 1,
  window: "hard",
  customText: "",
  tab: "geometry",
  analysis: null,
  synthesis: null,
  analyzing: false,
  setDomain: (domain) => {
    set({ domain, synthesis: null });
    get().recompute();
  },
  setQ: (Q) => {
    set({ Q, synthesis: null });
    get().recompute();
  },
  setK: (k) => {
    const { analysis, Q, window } = get();
    set({ k, synthesis: null });
    if (!analysis) {
      get().recompute();
      return;
    }
    const geometry = analyzeGeometry(analysis.series.ordinates, Q, k, window);
    set({ analysis: { ...analysis, geometry, protocol: null } });
  },
  setAlpha: (alpha) => {
    const { analysis, Q } = get();
    set({ alpha, synthesis: null });
    if (!analysis) {
      get().recompute();
      return;
    }
    const operator = analyzeOperator(analysis.series.ordinates, Q, alpha, 1, 8);
    set({ analysis: { ...analysis, operator } });
  },
  setWindow: (window) => {
    const { analysis, Q, k } = get();
    set({ window, synthesis: null });
    if (!analysis) {
      get().recompute();
      return;
    }
    const geometry = analyzeGeometry(analysis.series.ordinates, Q, k, window);
    set({ analysis: { ...analysis, geometry, protocol: null } });
  },
  setCustomText: (customText) => set({ customText }),
  setTab: (tab) => {
    set({ tab });
    if (tab === "synthesis" && !get().synthesis) get().computeSynthesis();
    if (tab === "protocol") get().ensureProtocol();
  },
  recompute: () => {
    set({ analyzing: true });
    const next = compute(get());
    set({ analysis: next, analyzing: false });
  },
  ensureProtocol: () => {
    const { analysis, Q, k } = get();
    if (!analysis || analysis.protocol) return;
    const protocol: ProtocolReport = runProtocol(analysis.series, { Q, k });
    set({ analysis: { ...analysis, protocol } });
  },
  computeSynthesis: () => {
    const { Q, k, alpha, window, customText } = get();
    const custom = parseSeries(customText);
    set({
      synthesis: runSynthesis(Q, k, alpha, window, custom),
    });
  },
}));
