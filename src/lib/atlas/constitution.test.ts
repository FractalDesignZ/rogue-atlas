import assert from "node:assert/strict";
import { test } from "node:test";
import { runAdapter } from "../adapter/engine";
import { DEFAULT_WEIGHTS } from "../adapter/presets";
import { sniffIngest } from "./ingest";
import {
  bettiIsIdentity,
  canPromote,
  evidenceOf,
  geometryCertifiesSafety,
  gueAllowed,
  representationsFor,
  rungOf,
  sheafEligible,
  SOURCE_COORDINATE,
} from "./constitution";

test("evidence map: identity is exact, excluded is speculative", () => {
  assert.equal(evidenceOf("identity"), "exact");
  assert.equal(evidenceOf("certificate"), "certified");
  assert.equal(evidenceOf("empirical"), "observed");
  assert.equal(evidenceOf("empirical", { validated: true }), "validated");
  assert.equal(evidenceOf("empirical", { failed: true }), "failed");
  assert.equal(evidenceOf("excluded"), "speculative");
});

test("GUE is allowed only on zeta", () => {
  assert.equal(gueAllowed("zeta"), true);
  assert.equal(gueAllowed("drill"), false);
  assert.equal(gueAllowed("thought"), false);
  assert.equal(gueAllowed("wellbore"), false);
  const drill = runAdapter("drill", "", DEFAULT_WEIGHTS, 1);
  assert.equal(gueAllowed(drill.source), false);
  assert.doesNotMatch(drill.nulls?.name ?? "", /GUE/i);
});

test("Betti signatures and geometric safety stay hypotheses", () => {
  assert.equal(bettiIsIdentity(), false);
  assert.equal(geometryCertifiesSafety(), false);
});

test("ladder will not skip, and MoE needs a beaten baseline", () => {
  assert.equal(canPromote(1, 3, { incrementalValue: true, holdout: true }).ok, false);
  assert.equal(canPromote(2, 3, { incrementalValue: false, holdout: false }).ok, false);
  assert.equal(canPromote(3, 4, { incrementalValue: false, holdout: true }).ok, false);
  assert.equal(canPromote(3, 4, { incrementalValue: true, holdout: true }).ok, true);
  assert.equal(canPromote(0, 1, { incrementalValue: false, holdout: false }).ok, true);
});

test("coordinate roles do not collapse to physical time", () => {
  assert.equal(SOURCE_COORDINATE.zeta, "spectral");
  assert.equal(SOURCE_COORDINATE.drill, "physical-time");
  assert.equal(SOURCE_COORDINATE.thought, "sequence");
  assert.equal(SOURCE_COORDINATE.wellbore, "spatial");
  assert.notEqual(SOURCE_COORDINATE.zeta, SOURCE_COORDINATE.drill);
});

test("sheaf gate is δ² only", () => {
  assert.equal(sheafEligible({ coboundaryNilpotent: true }), true);
  assert.equal(sheafEligible({ coboundaryNilpotent: false }), false);
});

test("every representation is labeled imposed, estimated, or learned", () => {
  for (const source of ["zeta", "drill", "thought", "wellbore"] as const) {
    const reps = representationsFor(source);
    assert.ok(reps.length >= 3);
    assert.ok(reps.every((r) => r.imposition === "imposed" || r.imposition === "estimated" || r.imposition === "learned"));
    assert.ok(reps.some((r) => r.role === "visualization" || r.name.includes("view") || r.name.includes("PCA") || r.name.includes("manifold")));
  }
});

test("zeta failed spacing test stays at L2; drill stays at L1 without holdout", () => {
  const zeta = rungOf({ source: "zeta", nullP: 0.7 });
  assert.equal(zeta.level, 2);
  assert.match(zeta.note, /did not beat/i);
  const drill = rungOf({ source: "drill", incrementalValue: false, holdout: false });
  assert.equal(drill.level, 1);
  assert.match(drill.note, /Interlocks stay on L0/);
  const thought = rungOf({ source: "thought" });
  assert.equal(thought.level, 2);
});

test("ingest sniffs coordinate roles from the file, not the filename", () => {
  assert.equal(sniffIngest("gamma\n14.13\n21.02\n25.01\n30.42\n32.93\n37.58").role, "spectral");
  assert.equal(sniffIngest("WOB,RPM,torque\n80,120,12\n81,118,13\n79,121,12\n82,119,14\n80,122,11\n78,117,12").source, "drill");
  assert.equal(sniffIngest("MD,TVD,inclination\n0,0,0\n30,30,1\n60,59,2\n90,88,3\n120,116,4\n150,143,5").role, "spatial");
  assert.equal(sniffIngest("The room held. Then it jumped.").source, "thought");
});

test("a failed null marks the beat-claim Failed", () => {
  const report = runAdapter("thought", "The room held. Then the claim jumped.", DEFAULT_WEIGHTS, 1);
  const beat = report.claims?.find((c) => c.id === "null-beat");
  assert.ok(beat);
  assert.equal(beat?.extras?.failed, true);
  assert.notEqual(beat?.extras?.validated, true);
});



