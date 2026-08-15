import type { ConditionState } from "./types";

export type GraphEdge = { a: number; b: number };

export type GraphReport = {
  local: GraphEdge[];
  recurrence: GraphEdge[];
  shared: number;
  contamination: number;
  k: number;
  note: string;
};

function key(a: number, b: number) {
  return a < b ? `${a}-${b}` : `${b}-${a}`;
}

function knn(n: number, i: number, k: number, d: (j: number) => number): number[] {
  const scored: { j: number; d: number }[] = [];
  for (let j = 0; j < n; j++) {
    if (j === i) continue;
    scored.push({ j, d: d(j) });
  }
  scored.sort((a, b) => a.d - b.d);
  return scored.slice(0, k).map((s) => s.j);
}

function undirected(pairs: GraphEdge[]): GraphEdge[] {
  const seen = new Set<string>();
  const out: GraphEdge[] = [];
  for (const e of pairs) {
    const k = key(e.a, e.b);
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(e);
  }
  return out;
}

export function buildGraphs(states: ConditionState[], k = 4): GraphReport {
  const n = states.length;
  const kk = Math.min(k, Math.max(1, n - 1));
  const localRaw: GraphEdge[] = [];
  const recRaw: GraphEdge[] = [];
  for (let i = 0; i < n; i++) {
    for (const j of knn(n, i, kk, (j) => Math.abs(states[i]!.t - states[j]!.t))) {
      localRaw.push({ a: i, b: j });
    }
    for (const j of knn(n, i, kk, (j) =>
      Math.hypot(states[i]!.x - states[j]!.x, states[i]!.y - states[j]!.y),
    )) {
      recRaw.push({ a: i, b: j });
    }
  }
  const local = undirected(localRaw);
  const recurrence = undirected(recRaw);
  const localSet = new Set(local.map((e) => key(e.a, e.b)));
  const recSet = new Set(recurrence.map((e) => key(e.a, e.b)));
  let shared = 0;
  for (const k of recSet) if (localSet.has(k)) shared += 1;
  const contamination = recSet.size ? 1 - shared / recSet.size : 0;
  return {
    local,
    recurrence,
    shared,
    contamination,
    k: kk,
    note:
      contamination > 0.35
        ? `${Math.round(contamination * 100)}% of feature neighbors are not time-local. Those edges measure recurrence, not the tangent.`
        : `Feature neighbors mostly follow the walk. Recurrence is quiet at k = ${kk}.`,
  };
}

export function pathCosts(states: ConditionState[], now: number) {
  const end = Math.min(Math.max(now, 1), states.length - 1);
  let geodesic = 0;
  for (let i = 1; i <= end; i++) {
    geodesic += Math.hypot(states[i]!.x - states[i - 1]!.x, states[i]!.y - states[i - 1]!.y);
  }
  const chord = Math.hypot(states[end]!.x - states[0]!.x, states[end]!.y - states[0]!.y);
  return {
    geodesic,
    chord,
    extra: Math.max(0, geodesic - chord),
    note:
      geodesic > chord * 1.08
        ? "The walk is longer than the chord. The manifold is curved; the straight line cuts a forbidden region."
        : "Walk and chord nearly agree. The field is locally flat from here.",
  };
}

function median(xs: number[]): number {
  if (!xs.length) return 0;
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m]! : 0.5 * (s[m - 1]! + s[m]!);
}

function pcaAxis(pts: { x: number; y: number }[]): { x: number; y: number } {
  const n = pts.length || 1;
  const mx = pts.reduce((a, p) => a + p.x, 0) / n;
  const my = pts.reduce((a, p) => a + p.y, 0) / n;
  let xx = 0,
    xy = 0,
    yy = 0;
  for (const p of pts) {
    const dx = p.x - mx;
    const dy = p.y - my;
    xx += dx * dx;
    xy += dx * dy;
    yy += dy * dy;
  }
  const tr = xx + yy;
  const det = xx * yy - xy * xy;
  const disc = Math.sqrt(Math.max(tr * tr - 4 * det, 0));
  const l1 = 0.5 * (tr + disc);
  let vx = xy;
  let vy = l1 - xx;
  const norm = Math.hypot(vx, vy) || 1;
  return { x: vx / norm, y: vy / norm };
}

function absCos(a: { x: number; y: number }, b: { x: number; y: number }) {
  const d = Math.abs(a.x * b.x + a.y * b.y);
  const n = Math.hypot(a.x, a.y) * Math.hypot(b.x, b.y);
  return n === 0 ? 0 : Math.min(1, d / n);
}

/** Plane analog of ordinate-local vs feature-neighbor tangent recovery. */
export function planeTangents(states: ConditionState[], k = 4) {
  const n = states.length;
  const kk = Math.min(k, Math.max(1, n - 1));
  const local: number[] = [];
  const feature: number[] = [];
  for (let i = 1; i < n - 1; i++) {
    const chord = { x: states[i + 1]!.x - states[i - 1]!.x, y: states[i + 1]!.y - states[i - 1]!.y };
    const tN = knn(n, i, kk, (j) => Math.abs(states[i]!.t - states[j]!.t));
    const fN = knn(n, i, kk, (j) =>
      Math.hypot(states[i]!.x - states[j]!.x, states[i]!.y - states[j]!.y),
    );
    const tPts = [i, ...tN].map((j) => ({ x: states[j]!.x, y: states[j]!.y }));
    const fPts = [i, ...fN].map((j) => ({ x: states[j]!.x, y: states[j]!.y }));
    local.push(absCos(pcaAxis(tPts), chord));
    feature.push(absCos(pcaAxis(fPts), chord));
  }
  return {
    local: median(local),
    feature: median(feature),
    note: "Plane PCA vs the consecutive chord. The Φ-space cosine lives in Studio, on the native kernel.",
  };
}

