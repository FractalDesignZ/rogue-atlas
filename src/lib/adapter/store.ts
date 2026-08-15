import { create } from "zustand";
import { runAdapter } from "./engine";
import { compareFields } from "./compare";
import { persistField } from "./filtration";
import { computeHorizon } from "./horizon";
import { nowCaption } from "./structure";
import { ADAPTER_PRESETS, COMPASS_SCENES, DEFAULT_WEIGHTS } from "./presets";
import { fieldDelta } from "./delta";
import type {
  AbstractionLevel,
  AdapterReport,
  AdapterSource,
  AtlasEntry,
  CompareReport,
  JournalBeat,
  ModalityLens,
  NoticedSeed,
  TimeKind,
  GraphKind,
  ValueWeights,
} from "./types";
import type { FieldDelta } from "./delta";

const ATLAS_KEY = "meridian-atlas-v1";
const NOTICED_KEY = "meridian-noticed-v1";

function normalizeReport(report: AdapterReport): AdapterReport {
  return {
    ...report,
    horizon: report.horizon ?? computeHorizon(report, report.now),
    persistence: report.persistence ?? persistField(report.states ?? []),
  };
}

function loadAtlas(): AtlasEntry[] {
  if (typeof localStorage === "undefined") return [];
  try {
    const raw = localStorage.getItem(ATLAS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as AtlasEntry[];
    return Array.isArray(parsed)
      ? parsed.slice(0, 8).map((e) => ({ ...e, report: normalizeReport(e.report) }))
      : [];
  } catch {
    return [];
  }
}

function persistAtlas(entries: AtlasEntry[]) {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(ATLAS_KEY, JSON.stringify(entries.slice(0, 8)));
  } catch {
    /* quota */
  }
}

function loadNoticed(): NoticedSeed[] {
  if (typeof localStorage === "undefined") return [];
  try {
    const raw = localStorage.getItem(NOTICED_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as NoticedSeed[];
    return Array.isArray(parsed) ? parsed.slice(0, 12) : [];
  } catch {
    return [];
  }
}

function persistNoticed(entries: NoticedSeed[]) {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(NOTICED_KEY, JSON.stringify(entries.slice(0, 12)));
  } catch {
    /* quota */
  }
}

type AdapterState = {
  source: AdapterSource;
  prompt: string;
  weights: ValueWeights;
  nowRatio: number;
  released: boolean;
  selected: string | null;
  focus: number | null;
  level: AbstractionLevel;
  lens: ModalityLens;
  timeKind: TimeKind;
  graphKind: GraphKind;
  walking: boolean;
  playQueue: number[] | null;
  sequenceId: string | null;
  report: AdapterReport;
  pinned: AdapterReport | null;
  compare: CompareReport | null;
  delta: FieldDelta | null;
  atlas: AtlasEntry[];
  noticed: NoticedSeed[];
  journal: JournalBeat[];
  hydrated: boolean;
  hydrate: () => void;
  setSource: (s: AdapterSource) => void;
  setPrompt: (p: string) => void;
  setWeight: (key: keyof ValueWeights, value: number) => void;
  setNowRatio: (r: number) => void;
  setNowIndex: (i: number) => void;
  stepNow: (delta: number) => void;
  setLevel: (l: AbstractionLevel) => void;
  setLens: (l: ModalityLens) => void;
  setTimeKind: (t: TimeKind) => void;
  setGraphKind: (g: GraphKind) => void;
  setWalking: (w: boolean) => void;
  playSequence: (id: string) => void;
  popPlayQueue: () => number | null;
  holdAtlas: (id: string) => void;
  applyScene: (id: string) => void;
  markJournal: () => void;
  clearJournal: () => void;
  replayJournal: () => void;
  loadPreset: (id: string) => void;
  ingestText: (text: string) => void;
  recompute: () => void;
  release: () => void;
  resetRelease: () => void;
  selectOutcome: (id: string | null) => void;
  setFocus: (i: number | null) => void;
  pin: () => void;
  unpin: () => void;
  saveToAtlas: () => void;
  restoreAtlas: (id: string) => void;
  removeAtlas: (id: string) => void;
  noticeFocus: () => void;
  forgetNoticed: (id: string) => void;
  restoreNoticed: (id: string) => void;
};

function compute(
  source: AdapterSource,
  prompt: string,
  weights: ValueWeights,
  nowRatio: number,
): AdapterReport {
  return runAdapter(source, prompt, weights, nowRatio);
}

const first = ADAPTER_PRESETS[0]!;

function withNow(report: AdapterReport, now: number): AdapterReport {
  return {
    ...report,
    now,
    nowCaption: nowCaption(report.states, now, report.outcomes, report.jumps, report.primes),
    horizon: computeHorizon(report, now),
  };
}

function withCompare(report: AdapterReport, pinned: AdapterReport | null): CompareReport | null {
  if (!pinned) return null;
  return compareFields(pinned, report);
}

export const useAdapter = create<AdapterState>((set, get) => ({
  source: first.source,
  prompt: first.prompt,
  weights: { ...DEFAULT_WEIGHTS },
  nowRatio: 1,
  released: false,
  selected: null,
  focus: null,
  level: "high",
  lens: "all",
  timeKind: "parameter",
  graphKind: "local",
  walking: false,
  playQueue: null,
  sequenceId: null,
  report: compute(first.source, first.prompt, DEFAULT_WEIGHTS, 1),
  pinned: null,
  compare: null,
  delta: null,
  atlas: [],
  noticed: [],
  journal: [],
  hydrated: false,
  hydrate: () => {
    if (get().hydrated) return;
    set({ atlas: loadAtlas(), noticed: loadNoticed(), hydrated: true });
  },
  setSource: (source) => {
    set({ source, released: false, selected: null, focus: null, walking: false, playQueue: null });
    get().recompute();
  },
  setPrompt: (prompt) => set({ prompt }),
  setWeight: (key, value) => {
    const weights = { ...get().weights, [key]: value };
    set({ weights, released: false });
    get().recompute();
  },
  setNowRatio: (nowRatio) => {
    const report = get().report;
    const n = report.states.length;
    const now = n <= 1 ? 0 : Math.round((n - 1) * Math.min(1, Math.max(0, nowRatio)));
    set({ nowRatio, report: withNow(report, now) });
  },
  setNowIndex: (i) => {
    const report = get().report;
    const n = report.states.length;
    const now = Math.min(Math.max(0, i), Math.max(n - 1, 0));
    const nowRatio = n <= 1 ? 1 : now / (n - 1);
    set({ nowRatio, report: withNow(report, now), focus: now });
  },
  stepNow: (delta) => {
    const { report, setNowIndex } = get();
    setNowIndex(report.now + delta);
  },
  setLevel: (level) => set({ level }),
  setLens: (lens) => set({ lens }),
  setTimeKind: (timeKind) => set({ timeKind }),
  setGraphKind: (graphKind) => set({ graphKind }),
  setWalking: (walking) => set({ walking, playQueue: walking ? null : get().playQueue }),
  playSequence: (id) => {
    const seq = get().report.sequences.find((s) => s.id === id);
    if (!seq?.chain.length) return;
    set({
      sequenceId: id,
      playQueue: seq.chain.slice(1),
      walking: false,
    });
    get().setNowIndex(seq.chain[0]!);
  },
  popPlayQueue: () => {
    const q = get().playQueue;
    if (!q?.length) {
      set({ playQueue: null });
      return null;
    }
    const [next, ...rest] = q;
    set({ playQueue: rest.length ? rest : null });
    return next ?? null;
  },
  holdAtlas: (id) => {
    const entry = get().atlas.find((e) => e.id === id);
    if (!entry) return;
    set({
      pinned: entry.report,
      compare: withCompare(get().report, entry.report),
    });
  },
  applyScene: (id) => {
    const scene = COMPASS_SCENES.find((s) => s.id === id);
    if (!scene) return;
    if (!get().pinned) get().pin();
    set({ weights: { ...scene.weights }, released: false });
    get().recompute();
  },
  markJournal: () => {
    const { report, journal } = get();
    const s = report.states[report.now];
    if (!s) return;
    const last = journal[journal.length - 1];
    if (last && last.i === report.now) return;
    const kind = report.outcomes.find((o) => o.members.includes(report.now))?.kind ?? "open";
    const beat: JournalBeat = {
      id: `j_${Date.now().toString(36)}`,
      i: report.now,
      caption: report.nowCaption,
      kind,
      at: Date.now(),
    };
    set({ journal: [...journal, beat].slice(-16) });
  },
  clearJournal: () => set({ journal: [] }),
  replayJournal: () => {
    const { journal } = get();
    if (!journal.length) return;
    set({
      playQueue: journal.slice(1).map((b) => b.i),
      walking: false,
      sequenceId: null,
    });
    get().setNowIndex(journal[0]!.i);
  },
  loadPreset: (id) => {
    const p = ADAPTER_PRESETS.find((x) => x.id === id);
    if (!p) return;
    set({
      source: p.source,
      prompt: p.prompt,
      released: false,
      selected: null,
      focus: null,
      walking: false,
      nowRatio: p.id === "wellbore" ? 0.55 : p.id === "drill" ? 0.4 : 1,
    });
    get().recompute();
  },
  ingestText: (text) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    const nums = trimmed.match(/-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?/g);
    const source = nums && nums.length >= 6 ? "custom" : "thought";
    set({ source, prompt: trimmed, released: false, selected: null, focus: null, walking: false, nowRatio: 1 });
    get().recompute();
  },
  recompute: () => {
    const { source, prompt, weights, nowRatio, pinned, report: prev } = get();
    const report = compute(source, prompt.trim() || first.prompt, weights, nowRatio);
    set({
      report,
      selected: null,
      focus: null,
      compare: withCompare(report, pinned),
      delta: fieldDelta(prev, report),
    });
  },
  release: () => set({ released: true }),
  resetRelease: () => set({ released: false }),
  selectOutcome: (selected) => set({ selected }),
  setFocus: (focus) => set({ focus }),
  pin: () => {
    const { report } = get();
    set({ pinned: report, compare: null });
  },
  unpin: () => set({ pinned: null, compare: null }),
  saveToAtlas: () => {
    const { report, atlas } = get();
    const entry: AtlasEntry = {
      id: `atlas_${Date.now().toString(36)}`,
      savedAt: Date.now(),
      title: report.title,
      source: report.source,
      prompt: report.prompt,
      summary: report.horizon.reading,
      report,
    };
    const next = [entry, ...atlas.filter((e) => e.prompt !== report.prompt)].slice(0, 8);
    persistAtlas(next);
    set({ atlas: next });
  },
  restoreAtlas: (id) => {
    const entry = get().atlas.find((e) => e.id === id);
    if (!entry) return;
    set({
      source: entry.source,
      prompt: entry.prompt,
      weights: { ...entry.report.weights },
      report: normalizeReport(entry.report),
      released: false,
      selected: null,
      focus: null,
      walking: false,
      nowRatio: 1,
      compare: withCompare(entry.report, get().pinned),
    });
  },
  removeAtlas: (id) => {
    const next = get().atlas.filter((e) => e.id !== id);
    persistAtlas(next);
    set({ atlas: next });
  },
  noticeFocus: () => {
    const { report, focus, noticed } = get();
    const i = focus ?? report.now;
    const s = report.states[i];
    if (!s) return;
    const label = s.clause ?? s.label;
    const id = `${report.source}:${report.prompt.slice(0, 40)}:${i}`;
    const entry: NoticedSeed = {
      id,
      i,
      label,
      source: report.source,
      prompt: report.prompt,
      fieldTitle: report.title,
      savedAt: Date.now(),
    };
    const next = [entry, ...noticed.filter((e) => e.id !== id)].slice(0, 12);
    persistNoticed(next);
    set({ noticed: next });
    get().markJournal();
  },
  forgetNoticed: (id) => {
    const next = get().noticed.filter((e) => e.id !== id);
    persistNoticed(next);
    set({ noticed: next });
  },
  restoreNoticed: (id) => {
    const entry = get().noticed.find((e) => e.id === id);
    if (!entry) return;
    const same =
      get().source === entry.source && get().prompt === entry.prompt
        ? get().report
        : null;
    if (same) {
      get().setNowIndex(entry.i);
      return;
    }
    set({
      source: entry.source,
      prompt: entry.prompt,
      released: false,
      selected: null,
      walking: false,
    });
    get().recompute();
    window.setTimeout(() => get().setNowIndex(entry.i), 0);
  },
}));
