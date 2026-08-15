/**
 * Synthetic drilling manifold — GT-MoE lineage as a demo, not a rig controller.
 * Betti signatures name regimes. Safety axioms warp/refuse; they do not certify a well.
 */

export type DrillRegime = "normal" | "stick-slip" | "whirl" | "bounce";

export type DrillSample = {
  i: number;
  wob: number;
  rpm: number;
  torque: number;
  rop: number;
  regime: DrillRegime;
};

export type SafetyAxiom = {
  id: "A3.1" | "A3.2" | "A3.3";
  name: string;
  status: "clear" | "warn" | "hard";
  note: string;
};

export type DrillReport = {
  samples: DrillSample[];
  now: DrillSample;
  regime: DrillRegime;
  confidence: number;
  beta0: number;
  beta1: number;
  experts: { id: DrillRegime; weight: number }[];
  axioms: SafetyAxiom[];
  channels: { wob: number; rpm: number; torque: number; rop: number };
};

const REGIME_AT: { until: number; regime: DrillRegime }[] = [
  { until: 0.28, regime: "normal" },
  { until: 0.48, regime: "stick-slip" },
  { until: 0.68, regime: "whirl" },
  { until: 0.84, regime: "bounce" },
  { until: 1, regime: "normal" },
];

function regimeAt(u: number): DrillRegime {
  for (const r of REGIME_AT) if (u <= r.until) return r.regime;
  return "normal";
}

export function drillWalk(count = 80): DrillSample[] {
  const out: DrillSample[] = [];
  for (let i = 0; i < count; i++) {
    const u = i / Math.max(count - 1, 1);
    const regime = regimeAt(u);
    let wob = 118 + 6 * Math.sin(u * 7);
    let rpm = 108 + 5 * Math.cos(u * 5);
    let torque = 14.2 + 0.8 * Math.sin(u * 4);
    let rop = 42 + 4 * Math.sin(u * 3);
    if (regime === "stick-slip") {
      const osc = Math.sin(u * 70);
      rpm += 28 * osc;
      torque += 6 * osc;
      rop -= 8 * Math.abs(osc);
    } else if (regime === "whirl") {
      rpm += 18 * Math.sin(u * 55) + 12 * Math.sin(u * 91);
      wob += 10 * Math.cos(u * 48);
      torque += 3 * Math.sin(u * 62);
    } else if (regime === "bounce") {
      wob += i % 3 === 0 ? 22 : -14;
      rop += i % 3 === 0 ? -12 : 6;
    }
    out.push({ i, wob, rpm, torque, rop, regime });
  }
  return out;
}

export function drillOrdinates(): { t: number[]; labels: string[] } {
  const walk = drillWalk();
  return {
    t: walk.map((s, i) => {
      const prev = walk[i - 1];
      const step = prev
        ? Math.hypot(s.wob - prev.wob, s.rpm - prev.rpm, s.torque - prev.torque, s.rop - prev.rop) /
          20
        : 0.4;
      return (i === 0 ? 0 : 0) + step;
    }).reduce<number[]>((acc, step, i) => {
      acc.push(i === 0 ? 12 : acc[i - 1]! + Math.max(0.08, step));
      return acc;
    }, []),
    labels: walk.map((s) => s.regime),
  };
}

export function slidingBetti(samples: DrillSample[], now: number, win = 14): { b0: number; b1: number } {
  const a = Math.max(0, now - win + 1);
  const slice = samples.slice(a, now + 1);
  if (slice.length < 4) return { b0: 1, b1: 0 };
  const pts = slice.map((s) => [(s.wob - 118) / 20, (s.rpm - 108) / 25] as const);
  const n = pts.length;
  const r = 0.55;
  const parent = Array.from({ length: n }, (_, i) => i);
  const find = (x: number): number => (parent[x] === x ? x : (parent[x] = find(parent[x]!)));
  let edges = 0;
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const d = Math.hypot(pts[i]![0] - pts[j]![0], pts[i]![1] - pts[j]![1]);
      if (d <= r) {
        edges += 1;
        const x = find(i);
        const y = find(j);
        if (x !== y) parent[x] = y;
      }
    }
  }
  const roots = new Set(pts.map((_, i) => find(i)));
  const b0 = roots.size;
  const b1 = Math.max(0, edges - n + b0);
  return { b0, b1 };
}

export function classifyBetti(b0: number, b1: number): DrillRegime {
  if (b0 >= 2) return "bounce";
  if (b1 >= 2) return "whirl";
  if (b1 >= 1) return "stick-slip";
  return "normal";
}

export function safetyAxioms(sample: DrillSample, refuse: boolean): SafetyAxiom[] {
  const hard = sample.wob > 145 || sample.rpm > 155 || refuse;
  const warp = sample.wob > 132 || Math.abs(sample.torque - 14.2) > 4;
  const warn = sample.regime !== "normal";
  return [
    {
      id: "A3.1",
      name: "Hard limit",
      status: hard ? "hard" : "clear",
      note: hard ? "Forbidden region. Refuse the step." : "Inside hard envelope.",
    },
    {
      id: "A3.2",
      name: "Metric warp",
      status: warp ? "warn" : "clear",
      note: warp ? "Cost rises toward the cliff. The geodesic steers away." : "No warp required.",
    },
    {
      id: "A3.3",
      name: "Advisory",
      status: warn ? "warn" : "clear",
      note: warn ? `Regime ${sample.regime} is developing.` : "Quiet hole.",
    },
  ];
}

export function mixExperts(regime: DrillRegime): { id: DrillRegime; weight: number }[] {
  const base: DrillRegime[] = ["normal", "stick-slip", "whirl", "bounce"];
  return base.map((id) => ({
    id,
    weight: id === regime ? 0.72 : regime === "normal" ? 0.09 : 0.09 + (id === "normal" ? 0.1 : 0),
  }));
}

export function drillSnapshot(nowRatio: number, refuse = false): DrillReport {
  const samples = drillWalk();
  const now = Math.round((samples.length - 1) * Math.max(0, Math.min(1, nowRatio)));
  const sample = samples[now]!;
  const { b0, b1 } = slidingBetti(samples, now);
  const fromBetti = classifyBetti(b0, b1);
  const regime = fromBetti === "normal" ? sample.regime : fromBetti;
  const match = samples
    .slice(Math.max(0, now - 10), now + 1)
    .filter((s) => s.regime === regime).length;
  return {
    samples,
    now: sample,
    regime,
    confidence: Math.min(0.96, 0.55 + match / 12),
    beta0: b0,
    beta1: b1,
    experts: mixExperts(regime),
    axioms: safetyAxioms(sample, refuse),
    channels: { wob: sample.wob, rpm: sample.rpm, torque: sample.torque, rop: sample.rop },
  };
}
