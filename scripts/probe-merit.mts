import { runAdapter } from "../src/lib/adapter/engine.ts";
import { DEFAULT_WEIGHTS } from "../src/lib/adapter/presets.ts";
import { analyzeOperator } from "../src/lib/meridian/operator.ts";
import { ZETA_ZEROS } from "../src/lib/meridian/zeros.ts";

const t0 = Date.now();
const thought = runAdapter("thought", "The room held. Then a claim jumped.", DEFAULT_WEIGHTS, 1);
console.log("thought", Date.now() - t0, {
  d2: thought.sheaf.coboundaryResidual,
  rest: thought.sheaf.restrictionResidual,
  glue: thought.sheaf.glueingResidual,
  sheaf: thought.sheaf.coboundaryNilpotent,
});

const t1 = Date.now();
const drill = runAdapter("drill", "", DEFAULT_WEIGHTS, 1);
console.log("drill", Date.now() - t1, {
  d2: drill.sheaf.coboundaryResidual,
  glue: drill.sheaf.glueingResidual,
  n: drill.states.length,
});

for (const alpha of [0, 1, 1.5]) {
  const o = analyzeOperator(ZETA_ZEROS, 32, alpha, 1, 8);
  console.log("weyl", { alpha, smooth: o.rmseSmooth, pert: o.rmsePerturbed, gain: o.rmseSmooth - o.rmsePerturbed, blocks: `${o.improvedBlocks}/${o.totalBlocks}` });
}
