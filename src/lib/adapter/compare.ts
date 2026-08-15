import type { AdapterReport, CompareReport, TransferKind, TransferredRange } from "./types";

function wasserstein1(a: number[], b: number[]): number {
  if (!a.length || !b.length) return 0;
  const sa = [...a].sort((x, y) => x - y);
  const sb = [...b].sort((x, y) => x - y);
  const m = Math.max(sa.length, sb.length);
  let s = 0;
  for (let i = 0; i < m; i++) {
    const xa = sa[Math.min(sa.length - 1, Math.round((i * (sa.length - 1)) / Math.max(m - 1, 1)))]!;
    const xb = sb[Math.min(sb.length - 1, Math.round((i * (sb.length - 1)) / Math.max(m - 1, 1)))]!;
    s += Math.abs(xa - xb);
  }
  return s / m;
}

function overlap(a0: number, a1: number, b0: number, b1: number): number {
  const lo = Math.max(a0, b0);
  const hi = Math.min(a1, b1);
  const span = Math.max(a1, b1) - Math.min(a0, b0);
  if (span <= 1e-9) return 1;
  return Math.max(0, hi - lo) / span;
}

function transferOf(fromKind: TransferredRange["fromKind"], toKind: TransferredRange["fromKind"] | null): TransferKind {
  if (!toKind) return "breaks";
  if (fromKind === toKind) return "holds";
  if (fromKind === "known" && toKind === "perceived") return "warps";
  if (fromKind === "perceived" && toKind === "known") return "holds";
  if (toKind === "speculative") return "breaks";
  return "warps";
}

export function compareFields(held: AdapterReport, live: AdapterReport): CompareReport {
  const gapsA = held.states.map((s) => s.gap);
  const gapsB = live.states.map((s) => s.gap);
  const w1 = wasserstein1(gapsA, gapsB);
  const scale = Math.max(1, (gapsA.reduce((s, x) => s + x, 0) / Math.max(gapsA.length, 1) +
    gapsB.reduce((s, x) => s + x, 0) / Math.max(gapsB.length, 1)) / 2);
  const shapeDistance = w1 / scale;

  const transfers: TransferredRange[] = held.outcomes.map((o) => {
    let best: { id: string; kind: TransferredRange["fromKind"]; score: number } | null = null;
    for (const p of live.outcomes) {
      const ov = overlap(o.low, o.high, p.low, p.high);
      const kindBonus = o.kind === p.kind ? 0.2 : 0;
      const score = ov + kindBonus;
      if (!best || score > best.score) best = { id: p.id, kind: p.kind, score };
    }
    const hit = best && best.score >= 0.12 ? best : null;
    const kind = transferOf(o.kind, hit?.kind ?? null);
    return {
      fromId: o.id,
      fromTitle: o.title,
      fromKind: o.kind,
      toId: hit?.id ?? null,
      toKind: hit?.kind ?? null,
      kind,
      note:
        kind === "holds"
          ? `“${o.title}” is still an interior on the live field.`
          : kind === "warps"
            ? `“${o.title}” survives, but only as ${hit?.kind ?? "a different modality"}.`
            : `“${o.title}” has no overlapping basin. The sequel does not transfer.`,
    };
  });

  const score = { holds: 0, warps: 0, breaks: 0 };
  for (const t of transfers) score[t.kind] += 1;
  const verdict: TransferKind =
    score.breaks > score.holds && score.breaks >= score.warps
      ? "breaks"
      : score.warps > score.holds
        ? "warps"
        : "holds";

  const shared = held.sequences
    .filter((s) => live.sequences.some((t) => t.pattern === s.pattern))
    .map((s) => s.pattern);

  const regimeSame = held.regime.id === live.regime.id;
  const continuityDelta = live.continuity - held.continuity;

  const headline =
    verdict === "holds"
      ? `${held.title} still reads inside ${live.title}.`
      : verdict === "warps"
        ? `${held.title} arrives in ${live.title}, but the modality shifts.`
        : `${held.title} does not survive the walk into ${live.title}.`;

  return {
    heldTitle: held.title,
    liveTitle: live.title,
    heldSource: held.source,
    liveSource: live.source,
    shapeDistance,
    regimeSame,
    continuityDelta,
    sharedSequences: shared,
    transfers,
    verdict,
    headline,
    note:
      verdict === "holds"
        ? "Shared interiors. A continuous plan on the held field is still a continuous plan here."
        : verdict === "warps"
          ? "The shape is close enough to map, but necessity became possibility — or the other way around. Promote only what still overlaps."
          : "The gap laws have drifted. Treating this as the same basin would be an invented sequel.",
  };
}
