import { analyzeGeometry } from "../src/lib/meridian/geometry.ts";
import { ZETA_ZEROS } from "../src/lib/meridian/zeros.ts";

const n = ZETA_ZEROS.length;
console.log("zeros", n, ZETA_ZEROS[0], ZETA_ZEROS[n - 1]);

for (const Q of [16, 32, 64, 128]) {
  for (const count of [32, 48, 80, 100]) {
    const g = analyzeGeometry(ZETA_ZEROS.slice(0, count), Q, 8, "hard");
    console.log(
      JSON.stringify({
        Q,
        count,
        ord: Number(g.ordinateTangent.toFixed(4)),
        feat: Number(g.featureTangent.toFixed(4)),
        speed: Number(g.measure.speed.toFixed(4)),
        neff: Number(g.measure.neff.toFixed(3)),
        primes: g.measure.activePrimes,
      }),
    );
  }
}
