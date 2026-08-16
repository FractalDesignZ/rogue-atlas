# Rogue Atlas API

There is **no separate analysis HTTP server**. The instrument is a typed
TypeScript kernel that runs in the browser (and in Node for tests). The
only HTTP API that exists today is authentication.

This document describes:

1. What is shipped and callable.
2. What a future HTTP surface would look like — **planned, not implemented**.

If a function is not listed under **Shipped**, do not treat it as available.

---

## 1. HTTP surface (shipped)

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| `GET`, `POST` | `/api/auth/$` | public | better-auth handler (session, sign-in, sign-out) |
| `GET` | `/` | public | Landing |
| `GET` | `/atlas` | public | Audit constitution |
| `GET` | `/studio` | public | Research (zeta kernel) |
| `GET` | `/adapter` | public | Operations (walks) |
| `GET` | `/method` | public | Refuse, in prose |
| `GET` | `/library` | public | Presets |
| `GET` | `/login` | public | Sign-in |

There is no `POST /v1/runs`, no job queue, and no dataset CRUD API.

Certificates are **client-side JSON exports**, hashed with djb2 — a
screenshot guard, not a content-addressed legal record.

---

## 2. Evidence and claim types (shipped)

```ts
type EvidenceStatus =
  | "exact"        // follows the declared representation
  | "certified"    // finite numerical check passed
  | "observed"     // descriptive of the loaded data
  | "validated"    // survived a declared holdout or justified null
  | "failed"       // the declared test did not pass
  | "speculative"; // jump / outside scope — not sold as fact

type ClaimClass = "identity" | "certificate" | "empirical" | "excluded";

function evidenceOf(
  klass: ClaimClass,
  extras?: { validated?: boolean; failed?: boolean },
): EvidenceStatus;
```

| Claim class | Default evidence |
| --- | --- |
| `identity` | `exact` |
| `certificate` | `certified` |
| `empirical` | `observed`, or `validated` / `failed` via `extras` |
| `excluded` | `speculative` |

Source: [`src/lib/atlas/constitution.ts`](../src/lib/atlas/constitution.ts),
[`src/lib/adapter/claims.ts`](../src/lib/adapter/claims.ts).

---

## 3. Coordinate and ingest API (shipped)

```ts
type CoordinateRole =
  | "physical-time"
  | "sequence"
  | "spectral"
  | "spatial"
  | "categorical"
  | "constructed"
  | "visualization";

type IngestSniff = {
  source: AdapterSource;
  role: CoordinateRole;
  note: string;
};

function sniffIngest(text: string): IngestSniff;
function roleFor(source: AdapterSource, text: string): {
  role: CoordinateRole;
  note: string;
};
```

Sniff rules (headers and body, not the filename):

| Cue | Source | Role |
| --- | --- | --- |
| `WOB`, `RPM`, `torque`, stick-slip | `drill` | `physical-time` |
| `TVD`, `MD`, inclination, survey | `wellbore` | `spatial` |
| `gamma`, ordinate, zeta zero | `zeta` | `spectral` |
| `timestamp`, `utc`, `datetime` | `pulse` | `physical-time` |
| ≥ 6 numbers, no cue | `custom` | `sequence` |
| prose | `thought` | `sequence` |

Source: [`src/lib/atlas/ingest.ts`](../src/lib/atlas/ingest.ts).

---

## 4. Complexity ladder API (shipped)

```ts
type LadderLevel = 0 | 1 | 2 | 3 | 4 | 5;

function canPromote(
  from: LadderLevel,
  to: LadderLevel,
  evidence: { incrementalValue: boolean; holdout: boolean },
): { ok: boolean; note: string };

function rungOf(input: {
  source: AdapterSource;
  nullP?: number;
  incrementalValue?: boolean;
  holdout?: boolean;
}): { level: LadderLevel; title: string; note: string; next: string };

function sheafEligible(sheaf: { coboundaryNilpotent: boolean }): boolean;
function gueAllowed(source: AdapterSource): boolean; // true only for "zeta"
```

Rules encoded, not decorative:

- No skipped rungs.
- L3 requires a holdout.
- L4 requires a specialist beating L1.
- Sheaf gate is **δ² only**. Restriction-compose is an identity.
- GUE is not a drill or thought null.

---

## 5. Meridian kernel (shipped)

Module: [`src/lib/meridian/`](../src/lib/meridian/).

### 5.1 Dictionary and measure

```ts
function primesUpTo(limit: number): number[];
function primePowersUpTo(Q: number): PrimePower[];
function buildMeasure(Q: number, kind?: "hard" | "master"): Measure;
```

Von Mangoldt-style amplitude on prime powers `q = p^k ≤ Q`:

`amplitude² ∝ Λ(q)² / q`, then normalized so weights sum to 1.

### 5.2 Stationary kernel and distance

Let `p_q` be the normalized weights and `ω_q = log q`.

```
K(t)     = Σ p_q cos(t ω_q)
d²(t)    = 2 Σ p_q [1 − cos(t ω_q)]
d(t)     = √d²(t)
```

```ts
function kernelReal(measure: Measure, t: number): number;
function dist2(measure: Measure, t: number): number;
function dist(measure: Measure, t: number): number;
function featureReal(measure: Measure, gamma: number): number[];
function analyticTangent(measure: Measure, gamma: number): number[];
```

`dist2` is an identity of the declared measure and the **gap** `t`.
It is not an independent observation of the zeros.

### 5.3 Geometry

```ts
function analyzeGeometry(
  ordinates: number[],
  Q: number,
  k?: number,
  window?: "hard" | "master",
  opts?: { viz?: boolean },
): GeometryReport;
```

Returns, among other fields:

| Field | Meaning | Class |
| --- | --- | --- |
| `orbitTangent` | Micro-window PCA vs analytic tangent | certificate |
| `ordinateTangent` | Discrete-zero kNN vs analytic tangent | empirical |
| `featureTangent` | Feature-neighbor kNN vs analytic tangent | empirical |
| `measure.speed` | `√μ₂` | identity |
| `measure.curvature` | `√μ₄ / μ₂` | identity |
| `firstReversal` | First distance reversal (linear radius cue) | empirical |

Do not cite `ordinateTangent ≈ 0.1` as a failed theorem. Neighboring
zeros sit past the linear radius. The rank-one certificate is the
**orbit** window.

### 5.4 Operator

```ts
function analyzeOperator(
  ordinates: number[],
  Q: number,
  alpha: number,
  /* … */
): OperatorReport;
```

`alpha = 1` is the manuscript operator (logarithmic damper).
`alpha = 0` (hard cutoff) can **raise** RMSE. That is a test, not a default.

### 5.5 Protocol (lazy, expensive)

```ts
function runProtocol(series: Series, params: { Q: number; k: number }): ProtocolReport;
```

GUE spacing comparison. Computed only when Protocol is opened.
`p_emp` is `(1 + G) / (n + 1)` on a small ensemble. It is a **spacing**
test. `p ≥ 0.05` is not proof of no effect.

---

## 6. Operations engine (shipped)

```ts
function runAdapter(
  source: AdapterSource,
  prompt: string,
  weights: ValueWeights,
  nowRatio: number,
): AdapterReport;

function writeReading(report: AdapterReport, compare: CompareReport | null): string;
function verifyAdapter(report: AdapterReport): VerifyReport;
function verifyStudio(g: GeometryReport, op: OperatorReport): VerifyReport;
function sniffIngest(text: string): IngestSniff;
```

`AdapterReport` (selected fields):

| Field | Contents |
| --- | --- |
| `source` | `thought` \| `zeta` \| `drill` \| `wellbore` \| … |
| `coordinateRole` | sniffed or declared |
| `states` | condition-states of the walk |
| `sheaf` | `coboundaryResidual`, holonomy, glueing |
| `graphs` | local vs recurrence + contamination |
| `nulls` | justified null, `pApprox`, replicates |
| `claims` | ledger rows with optional `extras` |
| `vv` | V&V suite |
| `provenance` | djb2 hash + gates |
| `outcomes` | known / perceived / speculative |

Pipeline stages: data → neighborhood → frames → transport → **sheaf** →
topology → null. Topology is ineligible unless `sheafEligible` is true.

---

## 7. V&V suite (shipped)

```ts
npm run test:vv
```

Critical checks include:

- `delta2` — coboundary residual `< 1e-9`
- `gate-klass` / `topo-klass` — pipeline does not promote a shut gate
- `null-domain` — GUE only on zeta
- `orbit-tangent` — `≥ 0.97` on the continuous micro-window
- `weyl-damped` — `α = 1` reduces RMSE on every block
- `restrict-not-sold` — do not sell restriction-compose as a certificate

---

## 8. Planned HTTP API (not implemented)

These routes are the commercialization sketch. **They do not exist.**
Do not write clients against them.

```
POST   /v1/projects
GET    /v1/projects/:id
POST   /v1/datasets                 # multipart; size-limited; sniffed, not trusted
GET    /v1/datasets/:id
POST   /v1/runs                     # { dataset, representation, ladderMax }
GET    /v1/runs/:id
GET    /v1/runs/:id/claims
GET    /v1/runs/:id/certificates
POST   /v1/runs/:id/nulls
GET    /v1/jobs/:id                 # async: medium/slow path
GET    /v1/warnings?run=
POST   /v1/exports/:run             # signed manifest
```

Every planned resource must carry:

```ts
type PlannedResource = {
  id: string;
  evidence: EvidenceStatus;
  provenance: { hash: string; algo: "sha-256"; inputs: unknown };
  warnings: WarningId[];
  manuscriptReported?: boolean; // true ⇒ not independently recomputed
};
```

A 10 Hz or sub-100 ms figure must never appear as a response field unless
it was **measured** on named hardware against a named fixture.

---

## 9. Warning identifiers (spec, partial implementation)

| Id | Meaning | Shipped? |
| --- | --- | --- |
| `representation-induced` | Geometry follows the declared map | yes (orbit vs closure copy) |
| `local-vs-global` | Two graphs mixed or contamination high | yes (contamination number) |
| `gue-wrong-domain` | GUE used off zeta | yes (refused) |
| `restriction-sold` | Identity sold as certificate | yes (V&V) |
| `betti-as-identity` | Fixed Betti = dysfunction | yes (refused in copy + tests) |
| `geometry-as-safety` | Metric claimed as interlock | yes (refused) |
| `underpowered-null` | Ensemble too small | partial (`n` in null note) |
| `p-not-absence` | `p ≥ 0.05` read as no effect | documented, not a UI chip |
| `holdout-leakage` | Train/test contamination | not implemented |
| `missing-units` | Upload without units | not implemented |
| `coordinate-ambiguous` | Sniff uncertain | partial (defaults to sequence) |
| `synthetic-data` | Generator, not a well | yes (drill console label) |
| `manuscript-reported` | Number not recomputed | partial (Method page) |

---

## 10. Open-core vs commercial (boundary only)

**Open kernel (this repo):** measure, kernel, geometry, operator,
protocol, adapter engine, evidence types, V&V, zeta reference, local web.

**Commercial (not in this tree):** live connectors, managed compute,
SSO/RBAC beyond preview auth, model registry, approval workflow,
on-prem edge runtime.

Do not change the license without explicit owner approval. The tree
currently carries an MIT file; that is a starting posture, not a legal
opinion.

---

## 11. How to call the kernel from Node

```bash
node --experimental-strip-types --import ./scripts/register-alias.mjs
```

```ts
import { buildMeasure, dist2, featureReal } from "./src/lib/meridian/kernel.ts";
import { analyzeGeometry } from "./src/lib/meridian/geometry.ts";
import { ZETA_ZEROS } from "./src/lib/meridian/zeros.ts";
import { runAdapter } from "./src/lib/adapter/engine.ts";
import { DEFAULT_WEIGHTS } from "./src/lib/adapter/presets.ts";

const m = buildMeasure(32, "hard");
const g = analyzeGeometry(ZETA_ZEROS.slice(0, 48), 32, 6, "hard", { viz: false });
const walk = runAdapter("thought", "The room held.", DEFAULT_WEIGHTS, 1);
```

There is no Python binding and no CUDA kernel in this repository.
