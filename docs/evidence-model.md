# Evidence model

Every displayed conclusion must answer:

1. What did the analyst put into the representation?
2. What follows identically from that choice?
3. What did numerical testing verify?
4. What was learned from held-out data?
5. What failed?
6. What remains speculative?
7. Is the complex method better than a simpler baseline?

## Objects

```ts
ClaimItem = {
  id, klass, title, body,
  extras?: { validated?: boolean; failed?: boolean }
}

VerifyCheck = {
  id, path, merit: "critical" | "high" | "guard",
  ok, got, want, note
}
```

A claim without a class is a defect.
A validated badge without a holdout or justified null is a defect.

## Nulls

The null must match the claim.

| Domain | Justified null |
| --- | --- |
| zeta / spectra | GUE / gap shuffle |
| drill / wellbore | coordinate / regime-preserving shuffle |
| pulse | interval shuffle |
| thought / custom | feature shuffle |

`pApprox = (1 + #{null ≥ live}) / (replicates + 1)`.

Underpowered ensembles must be labeled. Today’s default is 12
replicates (adapter) and 11 (GUE cell). That is enough to refuse a
promotion. It is not enough to publish a power curve.

## Ladder promotion

A method advances one rung only when it improves a prespecified
operational metric on unseen units. See `canPromote` in
[`src/lib/atlas/constitution.ts`](../src/lib/atlas/constitution.ts).
