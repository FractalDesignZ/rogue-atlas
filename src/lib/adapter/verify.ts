import { sheafEligible } from "../atlas/constitution";
import { analyzeGeometry } from "../meridian/geometry";
import { analyzeOperator } from "../meridian/operator";
import type { GeometryReport, OperatorReport } from "../meridian/types";
import { ZETA_ZEROS } from "../meridian/zeros";
import { computeFork } from "./fork";
import { pipelineOf } from "./pipeline";
import type { AdapterReport } from "./types";

export type CheckMerit = "critical" | "high" | "guard";

export type VerifyCheck = {
  id: string;
  path: string;
  merit: CheckMerit;
  ok: boolean;
  got: string;
  want: string;
  note: string;
};

export type VerifyReport = {
  passed: number;
  failed: number;
  criticalFailed: number;
  elapsedMs: number;
  checks: VerifyCheck[];
  headline: string;
  note: string;
};

function check(
  id: string,
  path: string,
  merit: CheckMerit,
  ok: boolean,
  got: string,
  want: string,
  note: string,
): VerifyCheck {
  return { id, path, merit, ok, got, want, note };
}

function pack(checks: VerifyCheck[], elapsedMs: number, note: string): VerifyReport {
  const failed = checks.filter((c) => !c.ok).length;
  const criticalFailed = checks.filter((c) => !c.ok && c.merit === "critical").length;
  const passed = checks.length - failed;
  return {
    passed,
    failed,
    criticalFailed,
    elapsedMs,
    checks,
    headline:
      criticalFailed > 0
        ? `${criticalFailed} critical check${criticalFailed === 1 ? "" : "s"} failed`
        : failed > 0
          ? `${failed} guard${failed === 1 ? "" : "s"} failed — spine still holds`
          : `${passed} checks held`,
    note,
  };
}

function sellsRestriction(text: string): boolean {
  return /restrictions compose/i.test(text) && !/identity/i.test(text);
}

export function verifyReport(report: AdapterReport): VerifyReport {
  const t0 = Date.now();
  const sheafOk = sheafEligible(report.sheaf);
  const pipe = pipelineOf(report);
  const sheafStage = pipe.find((s) => s.id === "sheaf");
  const topoStage = pipe.find((s) => s.id === "topology");
  const fork = computeFork(report);
  const localKeys = new Set(
    (report.graphs?.local ?? []).map((e) => `${e.a}-${e.b}`),
  );
  const recKeys = new Set(
    (report.graphs?.recurrence ?? []).map((e) => `${e.a}-${e.b}`),
  );
  let shared = 0;
  for (const k of recKeys) if (localKeys.has(k)) shared++;
  const sameGraph =
    recKeys.size > 0 && shared === recKeys.size && recKeys.size === localKeys.size;
  const nullName = report.nulls?.name ?? "";
  const drillLike = report.source === "drill" || report.source === "wellbore";
  const zetaLike = report.source === "zeta";
  const gueOnWrongDomain = /GUE/i.test(nullName) && !zetaLike;
  const zetaMissingGue = zetaLike && !/GUE/i.test(nullName);
  const excluded = (report.claims ?? []).filter((c) => c.klass === "excluded");
  const geo = report.pathCost;
  const chordOk = !geo || geo.geodesic + 1e-9 >= geo.chord;
  const sheafCopy = [
    sheafStage?.note ?? "",
    sheafStage?.brief ?? "",
    report.ceiling?.layers.find((l) => l.id === "sheaf")?.body ?? "",
  ].join(" ");

  const checks: VerifyCheck[] = [
    check(
      "delta2",
      "spine.sheaf",
      "critical",
      report.sheaf.coboundaryResidual < 1e-9,
      report.sheaf.coboundaryResidual.toExponential(1),
      "< 1e-9",
      "The sheaf coboundary must square to zero on declared cells.",
    ),
    check(
      "restrict-identity",
      "spine.sheaf",
      "guard",
      report.sheaf.restrictionResidual === 0,
      String(report.sheaf.restrictionResidual),
      "0 (identity)",
      "Function restriction composes by definition. A nonzero residual is a bug, not curvature.",
    ),
    check(
      "restrict-not-sold",
      "spine.sheaf",
      "high",
      !sellsRestriction(sheafCopy),
      sellsRestriction(sheafCopy) ? "sold as compose" : "identity",
      "do not sell restriction as a certificate",
      "Function restriction composes by definition. Selling it is a tautology.",
    ),
    check(
      "gate-klass",
      "spine.pipeline",
      "critical",
      sheafStage?.klass === (sheafOk ? "certificate" : "excluded"),
      sheafStage?.klass ?? "missing",
      sheafOk ? "certificate" : "excluded",
      "The pipeline must not promote a failed gate.",
    ),
    check(
      "topo-klass",
      "spine.pipeline",
      "critical",
      topoStage?.klass === (sheafOk ? "empirical" : "excluded"),
      topoStage?.klass ?? "missing",
      sheafOk ? "empirical" : "excluded",
      "Topology is ineligible when the gate is shut.",
    ),
    check(
      "null-domain",
      "spine.null",
      "critical",
      !gueOnWrongDomain && !zetaMissingGue && !!report.nulls?.justified,
      nullName || "none",
      zetaLike ? "GUE on zeta" : "no GUE off-zeta",
      "GUE belongs to spectral spacing. A drill or thought gets its own shuffle.",
    ),
    check(
      "two-graphs",
      "spine.graphs",
      "high",
      !!report.graphs && !sameGraph,
      sameGraph ? "identical edge sets" : `contam ${(report.graphs?.contamination ?? 0).toFixed(2)}`,
      "local ≠ recurrence",
      "Mixing the two graphs is how a pretty picture becomes a false discovery.",
    ),
    check(
      "walk-chord",
      "spine.metric",
      "high",
      chordOk,
      geo ? `geo ${geo.geodesic.toFixed(2)} / chord ${geo.chord.toFixed(2)}` : "missing",
      "geodesic ≥ chord",
      "A shortcut cheaper than the walk is a bug, not a geodesic.",
    ),
    check(
      "refuse",
      "spine.fork",
      "high",
      !fork.refuse || fork.advice === "refuse" || fork.advice === "hold",
      fork.refuse ? fork.advice : "open",
      "refuse ⇒ hold/refuse",
      "V < 0 must not be sold as a walk.",
    ),
    check(
      "excluded",
      "spine.claims",
      "high",
      excluded.length >= 2,
      `${excluded.length} excluded`,
      "≥ 2 excluded rows",
      "RH, Hilbert–Pólya, and universal GUE stay excluded.",
    ),
    check(
      "pca-not-dim",
      "guard.epistemic",
      "guard",
      report.sheaf.pcaDiscoversDimension === false &&
        report.sheaf.lorentzianClaimed === false &&
        report.sheaf.shiabClaimed === false,
      "flags false",
      "no discovered dimension",
      "The 2-view is chosen. Time is already a coordinate.",
    ),
    check(
      "hash",
      "guard.provenance",
      "guard",
      !!report.provenance?.hash && report.states.length >= 8,
      report.provenance?.hash?.slice(0, 8) ?? "none",
      "hashed series, n ≥ 8",
      "A certificate without a hash is a screenshot.",
    ),
  ];

  if (drillLike) {
    checks.push(
      check(
        "drill-null",
        "domain.drill",
        "critical",
        !/GUE/i.test(nullName),
        nullName,
        "coordinate/regime shuffle",
        "A hole is not a GUE spectrum.",
      ),
    );
  }

  return pack(
    checks,
    Date.now() - t0,
    sheafOk
      ? "Spine holds. Topology may speak as a candidate."
      : "Sheaf gate shut. Connection only — do not write cohomology.",
  );
}

export function verifyStudio(g: GeometryReport, op: OperatorReport): VerifyReport {
  const t0 = Date.now();
  const gain = op.rmseSmooth - op.rmsePerturbed;
  const checks: VerifyCheck[] = [
    check(
      "orbit-tangent",
      "paper.tangent",
      "critical",
      g.orbitTangent >= 0.97,
      g.orbitTangent.toFixed(3),
      "≥ 0.97 (paper ~0.991 on the continuous orbit)",
      "A micro-window on Φ recovers the analytic tangent. Neighboring zeros are already past that radius.",
    ),
    check(
      "zero-spacing",
      "paper.tangent",
      "high",
      g.ordinateTangent < g.orbitTangent - 0.2,
      `zeros ${g.ordinateTangent.toFixed(3)} / orbit ${g.orbitTangent.toFixed(3)}`,
      "discrete zeros ≪ orbit",
      "Mean zero gaps wind the fastest primes. That is not a failed theorem — it is the linear radius.",
    ),
    check(
      "feat-not-orbit",
      "paper.tangent",
      "high",
      g.featureTangent <= g.orbitTangent,
      `feat ${g.featureTangent.toFixed(3)} / orbit ${g.orbitTangent.toFixed(3)}`,
      "feature ≤ orbit",
      "Feature neighbors measure recurrence, not the tangent.",
    ),
    check(
      "rank-one-speed",
      "paper.orbit",
      "high",
      g.measure.speed > 0 && g.measure.curvature >= 0,
      `v=${g.measure.speed.toFixed(3)} κ=${g.measure.curvature.toFixed(3)}`,
      "speed > 0, κ ≥ 0",
      "The orbit is homogeneous. Vanishing speed is a broken measure.",
    ),
    check(
      "neff",
      "paper.orbit",
      "guard",
      g.measure.neff >= 1,
      g.measure.neff.toFixed(2),
      "N_eff ≥ 1",
      "Effective prime count is the closure dimension cue, not the tangent rank.",
    ),
    check(
      "weyl-damped",
      "paper.operator",
      "critical",
      gain > 0.05 && op.improvedBlocks === op.totalBlocks,
      `ΔRMSE ${gain.toFixed(3)}, ${op.improvedBlocks}/${op.totalBlocks}`,
      "α = 1 reduces RMSE on every block",
      "Hard cutoff (α = 0) can raise RMSE. The manuscript’s operator is the damped one.",
    ),
  ];
  return pack(
    checks,
    Date.now() - t0,
    "Native Φ-space. Adapter plane cosine is an analog. Protocol stays a separate freeze.",
  );
}

let zetaGeomCache: VerifyReport | null = null;

export function verifyZetaGeometry(Q = 32, k = 6): VerifyReport {
  if (zetaGeomCache) return zetaGeomCache;
  const g = analyzeGeometry(ZETA_ZEROS.slice(0, 48), Q, k, "hard");
  const op = analyzeOperator(ZETA_ZEROS, Q, 1, 1, 8);
  zetaGeomCache = verifyStudio(g, op);
  return zetaGeomCache;
}

export function mergeVerify(...reports: VerifyReport[]): VerifyReport {
  const checks = reports.flatMap((r) => r.checks);
  const elapsedMs = reports.reduce((s, r) => s + r.elapsedMs, 0);
  const note = reports.map((r) => r.note).filter(Boolean).join(" ");
  return pack(checks, elapsedMs, note);
}

/** Adapter path only. Native Φ certificates live in Studio via verifyStudio. */
export function verifyAdapter(report: AdapterReport): VerifyReport {
  return verifyReport(report);
}
