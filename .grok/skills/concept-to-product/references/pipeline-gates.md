# Pipeline gates

The commercialization differentiator is a **typed pipeline with a hard
gate**. Plots without a gate are galleries.

```
01 Data          identity
02 Neighborhood  identity      (time-local graph)
03 Frames        certificate   (chosen 2-view, explained variance)
04 Transport     certificate   (holonomy = curvature)
05 Sheaf gate    certificate | excluded
06 Topology      empirical     (only if gate passed)
07 Null          empirical | excluded
```

## The sheaf gate

Pass only if **both**:

1. `δ² = 0` (coboundary nilpotence on the discrete complex).
2. Restriction maps compose (`ρ_{U W} = ρ_{V W} ∘ ρ_{U V}`).

On fail:

- Label the stage **connection only**.
- Do **not** report cohomology as a finding.
- Persistence may still be *drawn* as a metric summary, but its claim
  class is **excluded** from "structure discovered."

Holonomy is **not** this gate. Nontrivial holonomy is the expected
curvature of a connection. Confusing the two is the classic write-up
error.

## Metric ceiling

Each layer can only see what the previous layer handed it.

| Layer | Ceiling |
| --- | --- |
| Pair summary | Distances and angles. No cycles. |
| Rips / H₀ | Connected components of the metric. |
| Holonomy | Connection around loops. Still not a sheaf. |
| Sheaf | Sections and cohomology — **after** the gate. |

Show the ceiling. A user who sees "we cannot know that yet" trusts the
instrument when it later says "now we can."

## Domain gates (lifts)

Applied domains add **safety** gates. They do not replace the sheaf gate.

- **Gate3 / middle-out:** a residual is accepted only if it beats the
  last-known hold. Heel is prior; toe is residual.
- **A3.1 refuse / A3.2 warp / A3.3 warn:** hard safety. The model cannot
  override A3.1.
- **V < 0 refuse:** a stay/jump fork that would destroy value is blocked.

Draw these as traffic on the same pipeline, not as a second product.

## Implementation contract

`pipelineOf(report)` is the single source of stage copy. UI reads it.
Readings read it. Export cards read it. Do not hand-write stage status
in JSX.

When you add a computation, add a stage **or** attach it to an existing
stage's `status` / `note`. Orphan numbers are how overclaim starts.
