import assert from "node:assert/strict";
import { test } from "node:test";
import { runProtocol } from "../meridian/analyze";
import { seriesFor } from "../meridian/domains";
import { analyzeGeometry } from "../meridian/geometry";
import { analyzeOperator } from "../meridian/operator";
import { ZETA_ZEROS } from "../meridian/zeros";
import { runAdapter } from "./engine";
import { pipelineOf } from "./pipeline";
import { DEFAULT_WEIGHTS } from "./presets";
import { verifyAdapter, verifyStudio, verifyZetaGeometry } from "./verify";

test("thought field: sheaf gate, two graphs, no GUE", () => {
  const report = runAdapter(
    "thought",
    "The room held. Then the claim jumped to a medicine nobody named. I want the ordinary afternoon back.",
    DEFAULT_WEIGHTS,
    1,
  );
  const vv = verifyAdapter(report);
  const critical = vv.checks.filter((c) => c.merit === "critical" && !c.ok);
  assert.equal(critical.length, 0, critical.map((c) => `${c.id}:${c.got}`).join("; "));
  assert.ok(report.graphs);
  assert.ok(report.graphs.contamination >= 0 && report.graphs.contamination <= 1);
  assert.doesNotMatch(report.nulls?.name ?? "", /GUE/);
  const sold = vv.checks.find((c) => c.id === "restrict-not-sold");
  assert.ok(sold?.ok, sold?.got);
});

test("drill field refuses GUE and keeps the gate honest", () => {
  const report = runAdapter("drill", "", DEFAULT_WEIGHTS, 1);
  const pipe = pipelineOf(report);
  const sheafOk =
    report.sheaf.coboundaryNilpotent && report.sheaf.restrictionCompatible;
  const sheaf = pipe.find((s) => s.id === "sheaf");
  const topo = pipe.find((s) => s.id === "topology");
  assert.equal(sheaf?.klass, sheafOk ? "certificate" : "excluded");
  assert.equal(topo?.klass, sheafOk ? "empirical" : "excluded");
  assert.doesNotMatch(report.nulls?.name ?? "", /GUE/i);
  const vv = verifyAdapter(report);
  assert.equal(vv.criticalFailed, 0, vv.checks.filter((c) => !c.ok).map((c) => c.id).join(","));
});

test("zeta native tangent recovers the orbit", () => {
  const g = verifyZetaGeometry(32, 6);
  const tan = g.checks.find((c) => c.id === "orbit-tangent");
  const weyl = g.checks.find((c) => c.id === "weyl-damped");
  assert.ok(tan?.ok, `orbit tangent ${tan?.got}`);
  assert.ok(weyl?.ok, `weyl ${weyl?.got}`);
  assert.equal(g.criticalFailed, 0, g.headline);
});

test("pipeline topology is excluded when the gate is imagined shut", () => {
  const report = runAdapter("pulse", "", DEFAULT_WEIGHTS, 0.4);
  const pipe = pipelineOf({
    ...report,
    sheaf: {
      ...report.sheaf,
      coboundaryNilpotent: false,
      restrictionCompatible: false,
    },
  });
  assert.equal(pipe.find((s) => s.id === "sheaf")?.klass, "excluded");
  assert.equal(pipe.find((s) => s.id === "topology")?.klass, "excluded");
});

test("studio V&V reads the already-computed kernel", () => {
  const g = analyzeGeometry(ZETA_ZEROS.slice(0, 48), 32, 6, "hard");
  const op = analyzeOperator(ZETA_ZEROS, 32, 1, 1, 8);
  const vv = verifyStudio(g, op);
  assert.equal(vv.criticalFailed, 0, vv.headline);
});

test("frozen GUE cell returns a defined p and stays a spacing test", () => {
  const t0 = Date.now();
  const series = seriesFor("zeta");
  const p = runProtocol(series, { Q: 32, k: 8 });
  const ms = Date.now() - t0;
  assert.ok(p.pemp >= 0 && p.pemp <= 1);
  assert.ok(p.gueScores.length >= 9 && p.gueScores.length <= 19);
  assert.ok(ms < 4000, `protocol took ${ms}ms`);
  assert.ok(p.verdict === "identity" || p.verdict === "inconclusive" || p.verdict === "held-out");
});

test("lite geometry agrees with full on certificates", () => {
  const zeros = ZETA_ZEROS.slice(0, 48);
  const full = analyzeGeometry(zeros, 32, 6, "hard");
  const lite = analyzeGeometry(zeros, 32, 6, "hard", { viz: false });
  assert.equal(lite.orbitTangent, full.orbitTangent);
  assert.equal(lite.featureTangent, full.featureTangent);
  assert.equal(lite.ordinateTangent, full.ordinateTangent);
  assert.equal(lite.measure.speed, full.measure.speed);
  assert.equal(lite.orbit.length, 0);
  assert.equal(lite.expansion.length, 0);
  assert.ok(full.orbit.length > 0);
});

test("alpha moves the operator, not the orbit", () => {
  const zeros = ZETA_ZEROS.slice(0, 48);
  const g = analyzeGeometry(zeros, 32, 6, "hard", { viz: false });
  const soft = analyzeOperator(ZETA_ZEROS, 32, 1, 1, 8);
  const hard = analyzeOperator(ZETA_ZEROS, 32, 0, 1, 8);
  assert.ok(soft.rmsePerturbed < hard.rmsePerturbed);
  const vvSoft = verifyStudio(g, soft);
  const vvHard = verifyStudio(g, hard);
  assert.equal(vvSoft.checks.find((c) => c.id === "orbit-tangent")?.got, vvHard.checks.find((c) => c.id === "orbit-tangent")?.got);
  assert.ok(vvSoft.checks.find((c) => c.id === "weyl-damped")?.ok);
  assert.ok(!vvHard.checks.find((c) => c.id === "weyl-damped")?.ok);
});

test("radii cache agrees with a cold compute", () => {
  const zeros = ZETA_ZEROS.slice(0, 48);
  const a = analyzeGeometry(zeros, 32, 6, "hard", { viz: false });
  const b = analyzeGeometry(zeros, 32, 6, "hard", { viz: false });
  assert.equal(a.quadraticRadius, b.quadraticRadius);
  assert.equal(a.firstReversal, b.firstReversal);
  assert.equal(a.recurrenceWitness.gap, b.recurrenceWitness.gap);
  assert.equal(a.orbitTangent, b.orbitTangent);
});


