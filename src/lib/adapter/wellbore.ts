/**
 * Open-curve wellbore geometry — public-interface lineage of
 * topology-sees-sequence / rogii-wellbore-topology (AGPL public tree).
 * Wells are OPEN curves. We never force closed holonomy = 0.
 */

export type OpenCurveGeom = {
  n: number;
  pathLength: number;
  chord: number;
  tortuosity: number;
  meanCurv: number;
  cumTwist: number;
  absCumTwist: number;
  meanAbsTorsion: number;
  closedHolonomyClaimed: false;
};

export type MiddleOut = {
  cut: number;
  lastKnown: number;
  priorErr: number;
  residualErr: number;
  gate3: "accept" | "reject";
  gateNote: string;
};

export type WellStation = {
  md: number;
  x: number;
  y: number;
  z: number;
  tvt: number;
  gr: number;
  section: "heel" | "build" | "lateral";
};

function hypot3(ax: number, ay: number, az: number) {
  return Math.hypot(ax, ay, az);
}

function synthWell(seed = 17, count = 72): WellStation[] {
  const out: WellStation[] = [];
  let x = 0;
  let y = 0;
  let z = 0;
  let tvt = 0;
  let md = 0;
  for (let i = 0; i < count; i++) {
    const u = i / Math.max(count - 1, 1);
    const section: WellStation["section"] = u < 0.28 ? "heel" : u < 0.48 ? "build" : "lateral";
    const inc =
      section === "heel" ? 0.08 : section === "build" ? 0.55 + 0.35 * Math.sin(u * 9) : 0.12;
    const az = 0.15 + (section === "lateral" ? 0.04 * Math.sin(u * 14) : 0);
    const dx = Math.cos(az) * (section === "heel" ? 0.08 : 1.15);
    const dy = Math.sin(az) * (section === "heel" ? 0.02 : 0.22);
    const dz = section === "lateral" ? 0.04 * Math.sin(u * 11 + seed) : inc;
    x += dx;
    y += dy;
    z += dz;
    md += hypot3(dx, dy, dz);
    const dip = section === "lateral" ? 0.18 * Math.sin(u * 7) : section === "build" ? 0.08 : 0.02;
    tvt += dz * 0.85 + dip + (section === "lateral" && i % 17 === 0 ? 0.55 : 0);
    const gr =
      72 +
      18 * Math.sin(tvt * 0.45) +
      (section === "lateral" && u > 0.78 ? 22 * Math.sin(u * 30) : 0);
    out.push({ md, x, y, z, tvt, gr, section });
  }
  return out;
}

export function wellboreSurvey(seed = 17, count = 72): WellStation[] {
  return synthWell(seed, count);
}

export function wellboreOrdinates(seed = 17): { t: number[]; labels: string[] } {
  const well = synthWell(seed);
  return {
    t: well.map((s) => s.tvt),
    labels: well.map((s, i) => `${s.section} ${i + 1}`),
  };
}

export function openCurveFromXYZ(
  xs: number[],
  ys: number[],
  zs: number[],
): OpenCurveGeom {
  const n = xs.length;
  if (n < 3) {
    return {
      n,
      pathLength: 0,
      chord: 0,
      tortuosity: 0,
      meanCurv: 0,
      cumTwist: 0,
      absCumTwist: 0,
      meanAbsTorsion: 0,
      closedHolonomyClaimed: false,
    };
  }
  const T: [number, number, number][] = [];
  let path = 0;
  for (let i = 1; i < n; i++) {
    const dx = xs[i]! - xs[i - 1]!;
    const dy = ys[i]! - ys[i - 1]!;
    const dz = zs[i]! - zs[i - 1]!;
    const L = hypot3(dx, dy, dz) || 1e-12;
    path += L;
    T.push([dx / L, dy / L, dz / L]);
  }
  const chord = hypot3(xs[n - 1]! - xs[0]!, ys[n - 1]! - ys[0]!, zs[n - 1]! - zs[0]!);
  const curv: number[] = [];
  for (let i = 0; i < T.length - 1; i++) {
    const c = Math.max(-1, Math.min(1, T[i]![0] * T[i + 1]![0] + T[i]![1] * T[i + 1]![1] + T[i]![2] * T[i + 1]![2]));
    curv.push(Math.acos(c));
  }
  const B: [number, number, number][] = [];
  for (let i = 0; i < T.length - 1; i++) {
    const t0 = T[i]!;
    const t1 = T[i + 1]!;
    let nx = t1[0] - t0[0];
    let ny = t1[1] - t0[1];
    let nz = t1[2] - t0[2];
    const proj = nx * t0[0] + ny * t0[1] + nz * t0[2];
    nx -= proj * t0[0];
    ny -= proj * t0[1];
    nz -= proj * t0[2];
    let nn = hypot3(nx, ny, nz);
    if (nn < 1e-12) {
      const hx = Math.abs(t0[2]) < 0.9 ? 0 : 0;
      const hy = Math.abs(t0[2]) < 0.9 ? 0 : 1;
      const hz = Math.abs(t0[2]) < 0.9 ? 1 : 0;
      nx = t0[1] * hz - t0[2] * hy;
      ny = t0[2] * hx - t0[0] * hz;
      nz = t0[0] * hy - t0[1] * hx;
      nn = hypot3(nx, ny, nz) || 1e-12;
    }
    nx /= nn;
    ny /= nn;
    nz /= nn;
    const bx = t0[1] * nz - t0[2] * ny;
    const by = t0[2] * nx - t0[0] * nz;
    const bz = t0[0] * ny - t0[1] * nx;
    const bn = hypot3(bx, by, bz) || 1e-12;
    B.push([bx / bn, by / bn, bz / bn]);
  }
  const tors: number[] = [];
  for (let i = 0; i < B.length - 1; i++) {
    const t = T[Math.min(i + 1, T.length - 1)]!;
    const b0 = B[i]!;
    const b1 = B[i + 1]!;
    const p0 = projectPerp(b0, t);
    const p1 = projectPerp(b1, t);
    if (!p0 || !p1) {
      tors.push(0);
      continue;
    }
    const c = Math.max(-1, Math.min(1, p0[0] * p1[0] + p0[1] * p1[1] + p0[2] * p1[2]));
    const cx = p0[1] * p1[2] - p0[2] * p1[1];
    const cy = p0[2] * p1[0] - p0[0] * p1[2];
    const cz = p0[0] * p1[1] - p0[1] * p1[0];
    const s = cx * t[0] + cy * t[1] + cz * t[2];
    tors.push(Math.atan2(s, c));
  }
  const mean = (xs0: number[]) => (xs0.length ? xs0.reduce((a, b) => a + b, 0) / xs0.length : 0);
  return {
    n,
    pathLength: path,
    chord,
    tortuosity: path / Math.max(chord, 1e-6) - 1,
    meanCurv: mean(curv),
    cumTwist: tors.reduce((a, b) => a + b, 0),
    absCumTwist: tors.reduce((a, b) => a + Math.abs(b), 0),
    meanAbsTorsion: mean(tors.map(Math.abs)),
    closedHolonomyClaimed: false,
  };
}

function projectPerp(
  v: [number, number, number],
  t: [number, number, number],
): [number, number, number] | null {
  const d = v[0] * t[0] + v[1] * t[1] + v[2] * t[2];
  const x = v[0] - d * t[0];
  const y = v[1] - d * t[1];
  const z = v[2] - d * t[2];
  const n = hypot3(x, y, z);
  if (n < 1e-12) return null;
  return [x / n, y / n, z / n];
}

export function openCurveFromStates(states: { x: number; y: number }[]): OpenCurveGeom {
  return openCurveFromXYZ(
    states.map((s) => s.x),
    states.map((s) => s.y),
    states.map(() => 0),
  );
}

export function middleOutSplit(
  values: number[],
  cutRatio = 0.55,
): MiddleOut {
  const n = values.length;
  const cut = Math.max(2, Math.min(n - 2, Math.round((n - 1) * cutRatio)));
  const lastKnown = values[cut - 1] ?? 0;
  const toe = values.slice(cut);
  const priorErr =
    toe.reduce((s, v) => s + Math.abs(v - lastKnown), 0) / Math.max(toe.length, 1);
  const heelMean =
    values.slice(0, cut).reduce((s, v) => s + v, 0) / Math.max(cut, 1);
  const slope =
    cut > 1 ? (lastKnown - (values[0] ?? 0)) / (cut - 1) : 0;
  let residualErr = 0;
  for (let k = 0; k < toe.length; k++) {
    const priorLinear = lastKnown + slope * (k + 1) * 0.15;
    residualErr += Math.abs(toe[k]! - priorLinear);
  }
  residualErr /= Math.max(toe.length, 1);
  const gate3: MiddleOut["gate3"] = residualErr + 1e-9 < priorErr ? "accept" : "reject";
  return {
    cut,
    lastKnown,
    priorErr,
    residualErr,
    gate3,
    gateNote:
      gate3 === "accept"
        ? `Gate3 ACCEPT. Residual ${residualErr.toFixed(3)} beats last-known hold ${priorErr.toFixed(3)}.`
        : `Gate3 REJECT. Residual ${residualErr.toFixed(3)} does not beat last-known hold ${priorErr.toFixed(3)}. Stay with the heel.`,
  };
}
