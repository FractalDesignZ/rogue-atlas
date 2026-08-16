# Zeta reference

This is the primary scientific correctness benchmark.

## What to open

`/studio` — Geometry, Graphs, Operator, Protocol, Synthesis.

## What it demonstrates

- The map Φ is a homogeneous rank-one orbit. Speed and curvature are
  constant.
- Apparent high dimension is torus closure (`N_eff` primes).
- Local (ordinate) neighbors and feature (recurrence) neighbors are
  different graphs.
- Distances are transformations of **gaps** plus the declared measure.
- The Weyl operator needs the damper (`α = 1`). Hard cutoff can worsen RMSE.
- A held-out / spacing test is allowed to **fail** without touching
  the exact identities.

## How to reproduce

```bash
npm run test:vv
```

Checks: `orbit-tangent`, `zero-spacing`, `feat-not-orbit`,
`rank-one-speed`, `weyl-damped`.

From Node:

```ts
import { analyzeGeometry } from "./src/lib/meridian/geometry.ts";
import { analyzeOperator } from "./src/lib/meridian/operator.ts";
import { ZETA_ZEROS } from "./src/lib/meridian/zeros.ts";
import { verifyStudio } from "./src/lib/adapter/verify.ts";

const g = analyzeGeometry(ZETA_ZEROS.slice(0, 48), 32, 6, "hard");
const op = analyzeOperator(ZETA_ZEROS, 32, 1, 1, 8);
verifyStudio(g, op);
```

## What it does not demonstrate

RH, a Hilbert–Pólya operator, a physical Hamiltonian, or that GUE is
a law of nature. Protocol is a spacing cell, opened on purpose, not
on page load.
