import type { ConditionState, PersistenceReport } from "./types";

type Edge = { a: number; b: number; d: number };

function distances(states: ConditionState[]): Edge[] {
  const edges: Edge[] = [];
  for (let i = 0; i < states.length; i++) {
    for (let j = i + 1; j < states.length; j++) {
      edges.push({
        a: i,
        b: j,
        d: Math.hypot(states[i]!.x - states[j]!.x, states[i]!.y - states[j]!.y),
      });
    }
  }
  edges.sort((p, q) => p.d - q.d);
  return edges;
}

function makeUf(n: number) {
  const p = Array.from({ length: n }, (_, i) => i);
  const r = new Array<number>(n).fill(0);
  const find = (x: number): number => {
    while (p[x] !== x) {
      p[x] = p[p[x]!]!;
      x = p[x]!;
    }
    return x;
  };
  const unite = (a: number, b: number) => {
    let x = find(a);
    let y = find(b);
    if (x === y) return false;
    if (r[x]! < r[y]!) {
      const t = x;
      x = y;
      y = t;
    }
    p[y] = x;
    if (r[x] === r[y]) r[x]! += 1;
    return true;
  };
  return { find, unite };
}

/**
 * Exact H₀ persistence (Kruskal). β₁(r) is the graph cyclomatic number of the
 * r-neighborhood — a curve, not a claimed barcode of 1-cycles.
 */
export function persistField(states: ConditionState[]): PersistenceReport {
  const n = states.length;
  if (n < 2) {
    return { h0: [], bettiCurve: [], longLived: 0, maxScale: 1 };
  }
  const edges = distances(states);
  const maxScale = Math.max(edges[edges.length - 1]?.d ?? 1, 1e-6);
  const uf = makeUf(n);
  const h0: PersistenceReport["h0"] = [];
  let components = n;
  for (const e of edges) {
    if (uf.unite(e.a, e.b)) {
      h0.push({ birth: 0, death: e.d, persist: e.d / maxScale });
      components -= 1;
      if (components === 1) break;
    }
  }
  if (components > 1) {
    for (let k = 0; k < components; k++) {
      h0.push({ birth: 0, death: maxScale, persist: 1 });
    }
  }

  const samples = 14;
  const bettiCurve: PersistenceReport["bettiCurve"] = [];
  for (let s = 0; s < samples; s++) {
    const r = ((s + 1) / samples) * maxScale;
    const ufR = makeUf(n);
    let eCount = 0;
    let c = n;
    for (const e of edges) {
      if (e.d > r) break;
      eCount += 1;
      if (ufR.unite(e.a, e.b)) c -= 1;
    }
    const b1 = Math.max(0, eCount - n + c);
    bettiCurve.push({ r, b0: c, b1 });
  }

  const persistVals = h0.map((b) => b.persist).sort((a, b) => a - b);
  const med = persistVals[Math.floor(persistVals.length / 2)] ?? 0;
  const longLived = h0.filter((b) => b.persist > Math.max(med, 0.35)).length;

  return { h0, bettiCurve, longLived, maxScale };
}
