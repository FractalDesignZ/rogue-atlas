# Claim taxonomy

Every number on screen wears exactly one class. If you cannot classify it,
do not show it.

## The four classes

| Class | Meaning | May be used to… | May not be used to… |
| --- | --- | --- | --- |
| **Identity** | True of the construction by definition | Name the object | "Discover" anything |
| **Certificate** | Finite, checkable computation (δ², enclosure, hash) | Open a gate | Stand in for a held-out test |
| **Empirical** | Comparison against a **justified** null or a hold-out | Support a *candidate* | Support a law |
| **Excluded** | Explicitly not claimed, or the gate failed | Warn, block, retire | Soften into "suggests" |

## How to write a ledger row

```
id:        stable slug
klass:     one of the four
title:     a sentence a skeptic would accept
body:      the assumption + the number + the refuse
```

Bad: "Geometry looks rich."
Good: "Orbit dimension is one. Higher-looking rank is torus closure, not a
new manifold."

## Promotion rules

```
identity  ──►  never promotes
certificate ──► empirical   only via a frozen hold-out
empirical ──►  (nothing)    stays a candidate
excluded  ──►  (nothing)    stays excluded
```

A pretty barcode does not promote topology past a failed sheaf gate.
A low p-value against the wrong null is still **excluded**.

## Evidence that looks like a certificate but isn't

- Explained variance of a 2-view PCA (chosen rank).
- k-NN graphs on the feature plane (recurrence, not tangent).
- Persistence of a Vietoris–Rips complex (metric-derived, no new info).
- A language model restating the reading (fluency ≠ necessity).

These may appear. They stay **empirical** or **identity-of-the-view**.

## Voice

Speak the class in product language, not paper language, when the user is
on the adapter:

- Identity → "This is how we built it."
- Certificate → "This check passed."
- Empirical → "Against this null, it stands out."
- Excluded → "We will not claim this."

Never let the model (you) narrate a fifth class called "insight."
