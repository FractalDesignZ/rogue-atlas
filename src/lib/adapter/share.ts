import { ADAPTER_PRESETS } from "./presets";
import type { AdapterSource } from "./types";

export type ShareState = {
  preset?: string;
  source?: AdapterSource;
  now?: number;
};

const SOURCE_OK = new Set<AdapterSource>([
  "thought",
  "zeta",
  "markets",
  "pulse",
  "climate",
  "spectra",
  "custom",
  "wellbore",
  "drill",
]);

export function readShare(): ShareState {
  if (typeof window === "undefined") return {};
  const q = new URLSearchParams(window.location.search);
  const preset = q.get("preset") ?? undefined;
  const source = q.get("source") as AdapterSource | null;
  const nowRaw = q.get("now");
  const now = nowRaw === null ? undefined : Number(nowRaw);
  return {
    preset: preset && ADAPTER_PRESETS.some((p) => p.id === preset) ? preset : undefined,
    source: source && SOURCE_OK.has(source) ? source : undefined,
    now: now !== undefined && Number.isFinite(now) ? Math.min(1, Math.max(0, now)) : undefined,
  };
}

export function writeShare(state: { preset?: string; source: AdapterSource; now: number }): string {
  const q = new URLSearchParams();
  if (state.preset) q.set("preset", state.preset);
  else q.set("source", state.source);
  q.set("now", state.now.toFixed(2));
  const url = new URL(window.location.href);
  url.search = q.toString();
  return url.toString();
}

export function matchingPreset(prompt: string): string | undefined {
  return ADAPTER_PRESETS.find((p) => p.prompt === prompt)?.id;
}
