---
name: concept-to-product
description: >
  Turn papers, frameworks, and half-formal ideas into an installable,
  auditable product — not a slide deck and not a claim engine. Use whenever
  the user attaches research, PDFs, theorems, or says "synthesize these
  into a studio / stack / commercial instrument." Covers paper ingest,
  theory correction, claim taxonomy, pipeline gates, two-graph discipline,
  mapping data to intuitive outcomes, GPU path, and wide-adoption packaging.
  Triggers on "concept to product", "commercialize", "synthesize these
  papers", "scientific studio", "claim ledger", "pipeline", "skill base",
  "from the paper", "auditable", "installable repo".
metadata:
  short-description: "Papers → playable instrument: claims, gates, two graphs, GPU"
user-invocable: false
---

# Concept to product

A paper is a **construction**. A product is an **instrument that will not
lie about that construction**. The job is not to decorate theorems. It is
to make the user *feel* the distinction the paper actually proved — and
to refuse every promotion the paper did not earn.

This skill owns the **concept → instrument** loop. Pair it with
**`design-ui`** for chrome and **`og`** for install/share identity.
Do not reach for **`building-games`** unless the instrument is a game.

**Read `references/` on demand** — do not inline them all:

- `references/paper-ingest.md` — how to read PDFs into a shippable core.
- `references/claim-taxonomy.md` — identity / certificate / empirical / excluded.
- `references/pipeline-gates.md` — data → neighborhood → frames → transport → sheaf → topology → null.
- `references/two-graphs-and-time.md` — local ≠ recurrence; time is typed.
- `references/outcome-adapter.md` — known / perceived / speculative; what humans enjoy.
- `references/gpu-and-stack.md` — browser-first, high-end GPU later, no fake backends.
- `references/anti-overclaim.md` — the failure modes that kill scientific products.
- `references/meridian-worked-example.md` — this repo as the worked instance.
- `references/rogue-atlas.md` — Research / Operations / Audit; the synthesis constitution.

---

## 1. Decide what the product *is*

One sentence. One verb. One refuse.

| Kind | Verb | Refuse |
| --- | --- | --- |
| Geometry studio | **Audit** a construction | Treating a tautology as a discovery |
| Domain adapter | **Walk** a series from here | A jump dressed as a geodesic |
| Applied console | **Route** a regime | A safety axiom the model can override |
| Claim ledger | **Classify** every number | Mixing evidence classes |

If you cannot name the refuse, you are building a dashboard. Stop and name it.

Meridian's refuse: *a construction that fits its own inputs is not evidence.*

---

## 2. Ingest, then correct

1. **Read the paper for theorems, not vibe.** Extract identities, bounds,
   nulls, and explicit non-claims. See `paper-ingest.md`.
2. **Apply corrections before UI.** Holonomy is curvature. δ² = 0 is the
   sheaf test. PCA does not discover dimension. GUE is a spacing null, not
   a law of nature. Time is already a coordinate.
3. **One core computation that reproduces a number from the paper.**
   If you cannot recover the paper's own metric (cosine, residual, δ²),
   you do not yet have a product — you have a mood board.
4. **Generalize last.** Domain adapters inherit the same gates. They do
   not get a looser epistemology because the data is dirtier.

---

## 3. The commercial spine (do not skip)

Every scientific instrument in this family ships these four surfaces.
They are the product, not chrome around a plot.

1. **Two graphs** — ordinate/time-local vs feature/recurrence. Mixing them
   is how a pretty picture becomes a false discovery. `two-graphs-and-time.md`.
2. **Claim ledger** — every number wears a class. `claim-taxonomy.md`.
3. **Pipeline with a gate** — topology is *not eligible* until the sheaf
   gate passes. `pipeline-gates.md`.
4. **Justified null** — the null must match the claim. GUE is not
   universal. A shuffle that destroys the regime is not a control.

If a feature does not change one of these four, it is decoration. Cut it
or demote it.

---

## 4. Map to what a human can hold

People do not enjoy "β₁ at scale r." They enjoy:

- **From here** — what is still open, what is a jump.
- **Stay / jump** with a refuse they can feel (V < 0).
- **Walk vs chord** — the path is longer because the field is curved.
- **A reading** they can speak, copy, or pin.
- **A card** they can show someone.

That mapping is the **adapter**. It is not a softening of the math. It is
the math, named in the tense a person actually uses. See
`outcome-adapter.md`. Fun is allowed. Fluency without necessity is not.

---

## 5. Stack rules (this workspace)

- **Browser-native first.** TanStack Start, client engine, Canvas / WebGL.
  Do not invent a Python/FastAPI backend the preview cannot run.
- **GPU is a path, not a costume.** Badge what the client actually uses
  (rAF, OffscreenCanvas, WebGL). Promise CUDA / WebGPU kernels only when
  the kernel exists. `gpu-and-stack.md`.
- **Installable.** PWA + `startup.sh` + Method/docs a stranger can follow.
  Wide adoption is an install, a share card (`og` skill), and a certificate
  they can export — not a GitHub star count you cannot see.
- **Provenance.** Hash the series + params. Frozen cutoffs. No silent
  unit conversion. Typed time.

---

## 6. Execution loop (every turn)

1. Name the refuse for this change.
2. Put the new number in a claim class.
3. Wire it into the pipeline or the two graphs so it is *visible*.
4. Write the reading line a human can say out loud.
5. Verify in the browser (visible content, clean console, mobile 390px).
6. Do not overwrite a large file with an empty `old_string`. Reconstruct
   only from a read you just did.

---

## Finish checklist

- [ ] One sentence: what the instrument *is* and what it *refuses*.
- [ ] At least one paper metric reproduced (or an honest plane analog,
      labeled as analog).
- [ ] Two graphs visibly different; contamination reported.
- [ ] Claim ledger present; no number without a class.
- [ ] Pipeline shows the sheaf gate; topology blocked when δ² ≠ 0.
- [ ] Null is justified for *this* domain.
- [ ] Time is typed; no silent conversion.
- [ ] From-here / stay-jump / reading exist for a non-expert.
- [ ] PWA / share / export path works.
- [ ] Method page states the corrections, not just the marketing.
- [ ] Dev and production render; no console errors; 390px usable.

If any box is theater (a label with no computation), it is a fail.
See `anti-overclaim.md`.
