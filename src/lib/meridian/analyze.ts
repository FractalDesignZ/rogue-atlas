import { analyzeGeometry } from "./geometry";
import { analyzeOperator } from "./operator";
import { analyzeProtocol } from "./protocol";
import { seriesFor, DOMAIN_ORDER } from "./domains";
import { buildMeasure } from "./kernel";
import type {
  DomainId,
  ProtocolReport,
  Series,
  SynthesisReport,
  WindowKind,
} from "./types";

export type StudioParams = {
  domain: DomainId;
  Q: number;
  k: number;
  alpha: number;
  window: WindowKind;
  customText?: string;
};

export type StudioAnalysis = {
  series: Series;
  geometry: ReturnType<typeof analyzeGeometry>;
  operator: ReturnType<typeof analyzeOperator>;
  protocol: ProtocolReport | null;
  synthesis: SynthesisReport[];
};

export function runAnalysis(
  series: Series,
  params: Pick<StudioParams, "Q" | "k" | "alpha" | "window">,
) {
  const geometry = analyzeGeometry(series.ordinates, params.Q, params.k, params.window);
  const operator = analyzeOperator(series.ordinates, params.Q, params.alpha, 1, 8);
  return { series, geometry, operator, protocol: null as ProtocolReport | null };
}

export function runProtocol(
  series: Series,
  params: Pick<StudioParams, "Q" | "k">,
) {
  return analyzeProtocol(series.ordinates, params.Q, params.k, 17);
}

export function runSynthesis(
  Q: number,
  k: number,
  alpha: number,
  window: WindowKind,
  custom?: number[],
): SynthesisReport[] {
  return DOMAIN_ORDER.filter((d) => d !== "custom" || (custom && custom.length >= 8)).map(
    (domain) => {
      const series = seriesFor(domain, custom);
      const g = analyzeGeometry(series.ordinates, Q, k, window, { viz: false });
      const o = analyzeOperator(series.ordinates, Q, alpha, 1, 8);
      return {
        domain,
        speed: g.measure.speed,
        curvature: g.measure.curvature,
        neff: g.measure.neff,
        tangent: g.orbitTangent,
        concentration: 2 / Math.max(g.measure.neff, 1e-6),
        operatorGain: o.rmseSmooth - o.rmsePerturbed,
      };
    },
  );
}

export function describeVerdict(v: ProtocolReport["verdict"]): string {
  if (v === "held-out") {
    return "The arithmetic graph beats a spacing-only baseline against the GUE null in this cell. GUE is a spacing ensemble, not a physical law. Treat as a candidate, not a discovery of new physics.";
  }
  if (v === "identity") {
    return "No held-out arithmetic signal beyond spacing. The geometry is doing what the construction already guarantees.";
  }
  return "The frozen cell does not separate from GUE at this sample size. GUE tests a spacing claim, not whether a field theory is physically correct. Keep the structural theorems; retire the discovery claim.";
}

export { buildMeasure };
export type { Series, WindowKind };
