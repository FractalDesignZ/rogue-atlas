# Two graphs and typed time

False discoveries in this family almost always come from **one of two
silent conversions**: mixing neighbor definitions, or mixing clocks.

## Two graphs

| Graph | Neighbors | Measures | Use |
| --- | --- | --- | --- |
| **Local** | Ordinate- or time-adjacent k-NN | The tangent / the walk | Recover rank-one motion |
| **Recurrence** | Feature-plane k-NN | Phase return, "we've been here" | Arithmetic or regime return |

**Contamination** = share of feature edges that are *not* time-local.

Rules:

- Draw them in different inks (silver vs gold). A toggle that does not
  change the picture is a bug.
- Never build one graph and label it both ways.
- Tangent recovery (paper ~0.991) is a statement about the **local**
  graph in native Φ-space. Feature cosine dropping as Q grows is
  contamination, not a new manifold.
- The adapter plane analog is allowed. Label it analog.

## Typed time

A scalar called `t` is not a clock. Tag every series with exactly one:

| Kind | Meaning | Legal conversion |
| --- | --- | --- |
| **Physical** | Sensor / wall time | Units, yes. To filtration, no. |
| **Parameter** | Orbit ordinate, MD, walk index | Reparameterize the curve. |
| **Filtration** | Scale r of a complex | Compare only to other r. |
| **Simulation** | Step of a model | Never sold as physical. |

Illegal: treating a filtration scale as "later," treating MD as wall-clock
ROP time without a survey, treating a language-model token index as
physical thought-time.

Put the kind in the provenance hash. Show it as a caption, not a footnote.

## Walk versus chord

The geodesic along the series is the walk. The chord is the forbidden
shortcut. Extra length is curvature the user can feel. Always pair it
with the two-graph view so "curved" is not confused with "recurrent."
