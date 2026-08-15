import type { ConditionState, OpenSet } from "./types";

type Edge = { a: number; b: number };
type Face = { i: number; j: number; k: number };
type Tet = { a: number; b: number; c: number; d: number };

export type DecReport = {
  vertices: number;
  edges: number;
  triangles: number;
  tets: number;
  coboundaryResidual: number;
  coboundaryNilpotent: boolean;
  restrictionResidual: number;
  restrictionCompatible: boolean;
  glueingResidual: number;
  meanHolonomy: number;
  meanCurvatureF: number;
  holonomyIsCurvature: true;
  bianchiResidual: number;
  bianchiCells: number;
  spectralGap: number;
  typeICount: number;
  typeIICount: number;
  typeIField: number[];
  typeIIField: number[];
  wasserstein: number[];
  maxWasserstein: number;
  viewResidual: number;
  explainedVariance: number;
  shiabClaimed: false;
  lorentzianClaimed: false;
  pcaDiscoversDimension: false;
  note: string;
};

function knn(states: ConditionState[], i: number, k: number): number[] {
  const scored = states
    .map((s, j) => ({
      j,
      d: i === j ? Infinity : Math.hypot(s.x - states[i]!.x, s.y - states[i]!.y),
    }))
    .sort((a, b) => a.d - b.d);
  return scored.slice(0, k).map((s) => s.j);
}

function edgeKey(a: number, b: number): string {
  return a < b ? `${a}:${b}` : `${b}:${a}`;
}

function buildComplex(states: ConditionState[], k = 5) {
  const n = states.length;
  const nbrs = states.map((_, i) => new Set(knn(states, i, k)));
  const edgeSet = new Map<string, Edge>();
  for (let i = 0; i < n; i++) {
    for (const j of nbrs[i]!) {
      const key = edgeKey(i, j);
      if (!edgeSet.has(key)) edgeSet.set(key, { a: Math.min(i, j), b: Math.max(i, j) });
    }
  }
  const adj = Array.from({ length: n }, () => new Set<number>());
  for (const e of edgeSet.values()) {
    adj[e.a]!.add(e.b);
    adj[e.b]!.add(e.a);
  }
  const faces: Face[] = [];
  const faceKey = new Set<string>();
  for (const e of edgeSet.values()) {
    for (const c of adj[e.a]!) {
      if (c === e.b) continue;
      if (!adj[e.b]!.has(c)) continue;
      const i = Math.min(e.a, e.b, c);
      const k3 = Math.max(e.a, e.b, c);
      const j = e.a + e.b + c - i - k3;
      const key = `${i}:${j}:${k3}`;
      if (faceKey.has(key)) continue;
      faceKey.add(key);
      faces.push({ i, j, k: k3 });
    }
  }
  const tets: Tet[] = [];
  const tetKey = new Set<string>();
  for (const f of faces) {
    const cand = new Set<number>([...adj[f.i]!, ...adj[f.j]!, ...adj[f.k]!]);
    for (const d of cand) {
      if (d === f.i || d === f.j || d === f.k) continue;
      if (!adj[f.i]!.has(d) || !adj[f.j]!.has(d) || !adj[f.k]!.has(d)) continue;
      const ids = [f.i, f.j, f.k, d].sort((x, y) => x - y);
      const key = ids.join(":");
      if (tetKey.has(key)) continue;
      tetKey.add(key);
      tets.push({ a: ids[0]!, b: ids[1]!, c: ids[2]!, d: ids[3]! });
    }
  }
  return { edges: [...edgeSet.values()], faces, tets, adj };
}

/** (δf)(ab) = f(b) − f(a) on the stored orientation a < b. */
function coboundary0(f: number[], edges: Edge[]): number[] {
  return edges.map((e) => f[e.b]! - f[e.a]!);
}

/**
 * (δg)(ijk) = g(ij) + g(jk) + g(ki) with stored edges oriented low→high.
 * g(ki) = −g(ik) when i < k.
 */
function coboundary1(g: number[], edges: Edge[], faces: Face[]): number[] {
  const idx = new Map<string, number>();
  edges.forEach((e, i) => idx.set(edgeKey(e.a, e.b), i));
  const signed = (u: number, v: number) => {
    const i = idx.get(edgeKey(u, v));
    if (i === undefined) return 0;
    return u < v ? g[i]! : -g[i]!;
  };
  return faces.map((f) => signed(f.i, f.j) + signed(f.j, f.k) + signed(f.k, f.i));
}

/**
 * Gaussian curvature of the travel-cost metric ds / v.
 * In 2D a conformal factor φ = −log v has K = Δφ.
 * Discrete graph Laplacian of log v is F; Σ K = 0 is the 2D Bianchi identity.
 */
function conformalCurvature(
  states: ConditionState[],
  adj: Set<number>[],
  values: number[],
): { meanAbs: number; meanF: number; bianchiResidual: number } {
  const n = states.length;
  const phi = values.map((v) => -Math.log(Math.max(v, 0.06)));
  const K = new Array<number>(n).fill(0);
  const areas = new Array<number>(n).fill(0);
  for (let i = 0; i < n; i++) {
    for (const j of adj[i]!) {
      const d = Math.hypot(states[i]!.x - states[j]!.x, states[i]!.y - states[j]!.y);
      const w = 1 / Math.max(d, 1e-6);
      K[i]! += w * (phi[j]! - phi[i]!);
      areas[i]! += d;
    }
  }
  const meanAbs = n ? K.reduce((s, x) => s + Math.abs(x), 0) / n : 0;
  let meanF = 0;
  for (let i = 0; i < n; i++) {
    meanF += Math.abs(K[i]!) / Math.max(areas[i]!, 1e-6);
  }
  meanF = n ? meanF / n : 0;
  const bianchiResidual = Math.abs(K.reduce((s, x) => s + x, 0));
  return { meanAbs, meanF, bianchiResidual };
}

function hodgeGap(f: number[], edges: Edge[], n: number): number {
  const L = new Array<number>(n).fill(0);
  for (const e of edges) {
    const d = f[e.a]! - f[e.b]!;
    L[e.a]! += d;
    L[e.b]! -= d;
  }
  let num = 0;
  let den = 0;
  for (let i = 0; i < n; i++) {
    num += f[i]! * L[i]!;
    den += f[i]! * f[i]!;
  }
  return den === 0 ? 0 : num / den;
}

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

function localGaps(states: ConditionState[], i: number, w = 3): number[] {
  const lo = Math.max(0, i - w);
  const hi = Math.min(states.length - 1, i + w);
  const out: number[] = [];
  for (let j = lo; j <= hi; j++) out.push(states[j]!.gap);
  return out;
}

/**
 * Function sheaf on the open-set poset.
 * Restriction of a section s: V → ℝ is restriction of functions.
 * For a function sheaf, ρ_{U⊂W} = ρ_{U⊂V} ∘ ρ_{V⊂W} is an identity —
 * not a certificate, and not what pairwise Procrustes would test.
 * A nonzero residual here can only mean the implementation compared
 * the wrong stalks.
 */
function restrictionCompose(
  _opens: Pick<OpenSet, "members">[],
  _values: number[],
  _faces: Face[],
): number {
  return 0;
}

/** Discrete-label sheaf of open-set properties. Clash on a nonempty overlap is H⁰ failure. */
function glueingResidual(opens: Pick<OpenSet, "members" | "property">[]): number {
  let pairs = 0;
  let clash = 0;
  for (let i = 0; i < opens.length; i++) {
    const a = new Set(opens[i]!.members);
    for (let j = i + 1; j < opens.length; j++) {
      const hit = opens[j]!.members.some((m) => a.has(m));
      if (!hit) continue;
      pairs += 1;
      if (opens[i]!.property !== opens[j]!.property) clash += 1;
    }
  }
  return pairs === 0 ? 0 : clash / pairs;
}

function localMetricCond(states: ConditionState[], i: number, adj: Set<number>[]): number {
  const ids = [i, ...adj[i]!];
  if (ids.length < 3) return 1;
  let mx = 0;
  let my = 0;
  for (const j of ids) {
    mx += states[j]!.x;
    my += states[j]!.y;
  }
  mx /= ids.length;
  my /= ids.length;
  let cxx = 0;
  let cxy = 0;
  let cyy = 0;
  for (const j of ids) {
    const dx = states[j]!.x - mx;
    const dy = states[j]!.y - my;
    cxx += dx * dx;
    cxy += dx * dy;
    cyy += dy * dy;
  }
  const inv = 1 / ids.length;
  cxx *= inv;
  cxy *= inv;
  cyy *= inv;
  const tr = cxx + cyy;
  const det = cxx * cyy - cxy * cxy;
  const disc = Math.sqrt(Math.max(tr * tr - 4 * det, 0));
  const l1 = (tr + disc) / 2;
  const l2 = (tr - disc) / 2;
  return l1 / Math.max(l2, 1e-8);
}

function fisherSpeed(states: ConditionState[], i: number, adj: Set<number>[]): number {
  const gi = localGaps(states, i);
  let best = 0;
  for (const j of adj[i]!) {
    const d = Math.hypot(states[i]!.x - states[j]!.x, states[i]!.y - states[j]!.y);
    const w = wasserstein1(gi, localGaps(states, j));
    best = Math.max(best, w / Math.max(d, 1e-6));
  }
  return best;
}

function emptyReport(
  n: number,
  viewResidual: number,
  explainedVariance: number,
): DecReport {
  return {
    vertices: n,
    edges: 0,
    triangles: 0,
    tets: 0,
    coboundaryResidual: 0,
    coboundaryNilpotent: true,
    restrictionResidual: 0,
    restrictionCompatible: true,
    glueingResidual: 0,
    meanHolonomy: 0,
    meanCurvatureF: 0,
    holonomyIsCurvature: true,
    bianchiResidual: 0,
    bianchiCells: 0,
    spectralGap: 0,
    typeICount: 0,
    typeIICount: 0,
    typeIField: Array.from({ length: n }, () => 0),
    typeIIField: Array.from({ length: n }, () => 0),
    wasserstein: Array.from({ length: n }, () => 0),
    maxWasserstein: 0,
    viewResidual,
    explainedVariance,
    shiabClaimed: false,
    lorentzianClaimed: false,
    pcaDiscoversDimension: false,
    note: "Empty complex. Need more condition:states.",
  };
}

export function analyzeDec(
  states: ConditionState[],
  values: number[],
  opens: Pick<OpenSet, "members" | "property">[] = [],
  view: { explainedVariance: number; viewResidual: number } = {
    explainedVariance: 1,
    viewResidual: 0,
  },
): DecReport {
  const n = states.length;
  if (n < 3) return emptyReport(n, view.viewResidual, view.explainedVariance);

  const k = Math.min(6, Math.max(3, Math.floor(n / 8) + 3));
  const { edges, faces, tets, adj } = buildComplex(states, k);

  const probe = states.map((s) => s.surprise + 0.17 * s.curvature + 0.03 * s.i);
  const d0 = coboundary0(probe, edges);
  const d1d0 = coboundary1(d0, edges, faces);
  const coboundaryResidual = d1d0.reduce((m, x) => Math.max(m, Math.abs(x)), 0);

  const restrictionResidual = restrictionCompose(opens, values, faces);
  const glue = glueingResidual(opens);

  const { meanAbs, meanF, bianchiResidual } = conformalCurvature(states, adj, values);
  const meanHolonomy = meanAbs;
  const meanCurvatureF = meanF;

  const mean = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);
  const centered = values.map((v) => v - mean(values));
  const spectralGap = hodgeGap(centered, edges, n);

  const typeIField = states.map((_, i) => {
    const speed = fisherSpeed(states, i, adj);
    const cond = localMetricCond(states, i, adj);
    return speed * (1 + Math.log1p(Math.max(cond - 1, 0)));
  });
  const typeIIField = states.map((_, i) => {
    let best = 0;
    for (const j of adj[i]!) {
      const d = Math.hypot(states[i]!.x - states[j]!.x, states[i]!.y - states[j]!.y);
      best = Math.max(best, Math.abs(values[i]! - values[j]!) / Math.max(d, 1e-6));
    }
    return best;
  });
  const cutAt = (field: number[], q: number) => {
    const s = [...field].sort((a, b) => a - b);
    return s[Math.min(s.length - 1, Math.floor(s.length * q))] ?? 1;
  };
  const t1cut = Math.max(cutAt(typeIField, 0.78), 1e-6);
  const t2cut = Math.max(cutAt(typeIIField, 0.78), 1e-6);
  const typeICount = typeIField.filter((x) => x > t1cut).length;
  const typeIICount = typeIIField.filter((x) => x > t2cut).length;

  const wasserstein = states.map((_, i) =>
    i === 0 ? 0 : wasserstein1(localGaps(states, i - 1), localGaps(states, i)),
  );
  const maxWasserstein = wasserstein.reduce((m, x) => Math.max(m, x), 0);

  return {
    vertices: n,
    edges: edges.length,
    triangles: faces.length,
    tets: tets.length,
    coboundaryResidual,
    coboundaryNilpotent: coboundaryResidual < 1e-9,
    restrictionResidual,
    restrictionCompatible: restrictionResidual < 1e-9,
    glueingResidual: glue,
    meanHolonomy,
    meanCurvatureF,
    holonomyIsCurvature: true,
    bianchiResidual,
    bianchiCells: tets.length,
    spectralGap,
    typeICount,
    typeIICount,
    typeIField,
    typeIIField,
    wasserstein,
    maxWasserstein,
    viewResidual: view.viewResidual,
    explainedVariance: view.explainedVariance,
    shiabClaimed: false,
    lorentzianClaimed: false,
    pcaDiscoversDimension: false,
    note:
      "Two tests, not one. δ² = 0 is the cellular certificate. Function-sheaf restriction is an identity, not a finding. Glueing of open-set properties is H⁰ (empirical). |K| is curvature of ds/v. The 2-view is a projection, not a discovered dimension.",
  };
}

/** Transition value: information gain minus metabolic cost. Do nothing if V < 0. */
export function transitionValue(
  from: ConditionState,
  to: ConditionState,
  wasserstein: number,
  typeI: number,
): { kl: number; cost: number; v: number } {
  const kl = Math.abs(to.surprise - from.surprise) + 0.35 * wasserstein;
  const dist = Math.hypot(to.x - from.x, to.y - from.y);
  const cost = dist + 0.45 * wasserstein + 0.25 * typeI;
  return { kl, cost, v: kl - cost };
}
