import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/method")({ component: Method });

const loop = [
  {
    n: "01",
    t: "Name the refuse",
    d: "One sentence. If you cannot name what the instrument will not claim, you are building a dashboard.",
  },
  {
    n: "02",
    t: "Ingest, then correct",
    d: "Theorems first. Holonomy is curvature. PCA does not discover dimension. GUE is a spacing null.",
  },
  {
    n: "03",
    t: "Reproduce one number",
    d: "If the paper’s own metric does not appear, you have a mood board.",
  },
  {
    n: "04",
    t: "Four surfaces",
    d: "Two graphs. Claim ledger. Pipeline with a sheaf gate. A null that belongs to this domain.",
  },
  {
    n: "05",
    t: "Map to a tense",
    d: "Known, perceived, speculative. Stay or jump. From here is the only honest tense.",
  },
  {
    n: "06",
    t: "Install and hash",
    d: "A stranger can add it to the home screen and export a certificate. Provenance is part of the math.",
  },
];

const theorems = [
  {
    t: "Theorem 1 — Stationarity",
    b: "Normalized kernel and chord distance depend only on the ordinate gap. Fixed-cutoff normalization is a global rescaling. There are no independent observations beyond the declared arithmetic spectral measure.",
  },
  {
    t: "Theorem 2 — Rank-one orbit",
    b: "The map is a homogeneous one-parameter unitary orbit. Real tangent rank is one. Speed √μ₂ and curvature √μ₄/μ₂ are constant. Intrinsic curvature is zero.",
  },
  {
    t: "Theorem 3 — Closure dimension",
    b: "With P active base primes the orbit is dense on a P-torus after removing harmonic coordinates. Finite-radius PCA can report the closure, not the tangent.",
  },
  {
    t: "Theorem 4 — Global recurrence",
    b: "Every finite cutoff has unbounded gaps whose feature distance tends to zero. For P ≥ 2 the map is an injective immersion but not a proper embedding.",
  },
  {
    t: "Theorems 6–9 — Operators",
    b: "The prime-frequency multiplication operator has the wrong counting law. A Lambert-W diagonal matches the leading count. Finite prime displacements stay compact. Hard cutoffs have no B² limit; logarithmic damping with α > 0 does.",
  },
  {
    t: "Protocol — Discovery versus identity",
    b: "A held-out prime energy statistic must beat a spacing-only graph against GUE. GUE and Poisson nulls test a spacing claim. They are not a generic test of whether a field theory is physically correct.",
  },
];

const corrections = [
  {
    t: "Holonomy is curvature",
    b: "Nontrivial triangle holonomy is exactly what a connection should produce when the bundle is curved. What must square to zero is the sheaf coboundary δ. A covariant exterior derivative obeys D²α = F ∧ α, and only in the flat case F = 0 does it become a cochain differential.",
  },
  {
    t: "Two tests, not one",
    b: "δ² = 0 is sheaf compatibility on the cellular complex. Function-sheaf restriction is an identity — a zero residual there is not a finding. |K| is the graph Laplacian of −log v for the travel-cost metric, reported as F ≈ K / area. Σ K = 0 is Bianchi in the 2-view. Confusing them is how a curved bundle gets written up as a failed sheaf.",
  },
  {
    t: "Travel cost, not a stretched metric",
    b: "The value-induced formula gᵥ = v · g makes high-value regions more expensive to traverse. The stated gravity-well intent is the dual: we take path cost ∫ ds / v so geodesics fall toward what the observer marked as important. Transitions with V = D_KL − C < 0 are refused.",
  },
  {
    t: "Type I is not Type II",
    b: "A Fisher / metric singularity (Type I) means the chart itself is sensitive — local gap law times the condition number of the 2-view. A valuational cliff (Type II) is a steep ||∇v|| on solid ground. The adapter counts them separately and will not treat a value drop as a broken metric.",
  },
  {
    t: "Time is already in the base",
    b: "The series parameter t is an evolution coordinate. It is not a fifteenth physical dimension, and it does not discover Lorentzian time by being named time.",
  },
  {
    t: "The 2-view is chosen, not discovered",
    b: "PCA of a five-feature cloud onto the drawing plane reports explained variance. It does not find a physical dimension, a Lorentzian time, or a thirteenth Shiab copy. O(d) here is Euclidean, not O(1,3). Spinors are not claimed.",
  },
  {
    t: "Continuity as a plan",
    b: "In Condition-State Topology a valid intervention is a continuous map through overlapping open sets. □ is the interior — necessary if the property holds. ◊ is possible. A jump is possibility without necessity — the topological name for a hallucination.",
  },
  {
    t: "GUE is a spacing null",
    b: "A held-out prime energy must beat a spacing-only graph against GUE. That ensemble tests a spacing claim. It is not a generic test of whether a field theory is physically correct.",
  },
  {
    t: "Axiomatic primes are load-bearing",
    b: "A prime is an irreducible node: high influence, high value, early enough that later neighborhoods are contingent on it. A gateway sits on more than one open set. A dependent inherits a prime’s basin. Removing a prime is the network analogue of denying an axiom.",
  },
  {
    t: "Three sequences, not a timeline",
    b: "Foundation-expansion: a prime seeds later growth. Constraint-elimination: a jump removes a barrier and a new basin becomes possible. Dependency-inversion: a later node outvalues its founding prime — the system designed to stand alone now leans on what it was meant to replace.",
  },
  {
    t: "Abstraction is a ladder",
    b: "Low is the artifact — events, gaps, the binary. Mid is design recovery — open sets, faces, a sheaf. High is architecture — regimes, outcome basins, axiomatic primes. Persistent features that survive the climb are the ones worth promoting.",
  },
  {
    t: "From here is the only honest tense",
    b: "A range is not a prophecy. The adapter answers a smaller question: given this now, which basin is next, and does a jump sit on the way. Walk the field and the reading changes. That is the future adapter — not a forecast, a tense.",
  },
  {
    t: "Transfer is not identity",
    b: "Hold one field and walk into another. A basin holds if the ranges still overlap. It warps if the modality changes. It breaks if nothing remains. Shared geometry of the kernel is an identity of the map; transfer that still beats a jump is the only thing counted as a continuation.",
  },
  {
    t: "H₀ is exact; H₁ is a curve",
    b: "The barcode on the floor is Kruskal persistence of connected components. Long bars are features that survive scale. The cyclomatic number β₁(r) is reported as a curve. We do not invent death times for 1-cycles.",
  },
  {
    t: "Refuse V < 0",
    b: "A transition’s value is D_KL − C. If the next step does not pay its travel cost, the adapter says so and advises hold. That is not a moral claim. It is the Jones/IGVF refuse: no new information does not buy a jump.",
  },
  {
    t: "The tape is the range map",
    b: "Known, perceived, and speculative sit on a filmstrip in time-order. Jumps cut rust. Type II cliffs tick the top. The playhead is now. Click it. The reading is the tense of that position.",
  },
  {
    t: "□, ◊, and the unentailed",
    b: "The lens dims what is not in view. Interior is necessary if the open set holds. Possible is a continuous geodesic. Unentailed is a jump — fluent, not required. The next five steps are that grammar in time.",
  },
  {
    t: "A compass is an observer",
    b: "Named scenes — keep the room, let it surprise, don't fall, follow the load-bearing — are value weights, not new physics. Hold the field, apply a scene, and the ghost geodesic is the previous observer. Transfer still says what survived.",
  },
  {
    t: "What moved is the only delta we claim",
    b: "After a scene or a remapping we report the change in tense: from-here title, stay V, refuse, continuity. We do not invent a causal story. The observer moved. The field answered.",
  },
  {
    t: "The well is an open curve",
    b: "A wellbore is not a loop. Open-curve Bishop transport and discrete torsion are features. Closed holonomy = 0 is not a TVT theorem. Heel is the known section; the toe is a residual. Gate3 accepts a residual only if it beats last-known hold — the same refuse as V < 0, named for a drill floor.",
  },
  {
    t: "Claim classes are the product",
    b: "Identity is the construction. Certificate is a finite check. Empirical is a reading against a justified null. Excluded is a jump we refuse to sell: RH, Hilbert–Pólya, a physical Hamiltonian, GUE as a universal null. A discrete field is not evidence the field exists.",
  },
  {
    t: "Two graphs, four times",
    b: "Ordinate-local neighbors recover the tangent. Feature neighbors measure recurrence. Mixing them is how false discoveries start. Time is physical, a trajectory parameter, a filtration scale, or simulation — never converted in silence.",
  },
  {
    t: "A hole has a shape before a threshold",
    b: "Stick-slip, whirl, and bounce are Betti names on a sliding window of (WOB, RPM). Safety axioms warp the metric and refuse a forbidden step. Mixture-of-experts is regime routing. This is a synthetic console, not a certified rig controller.",
  },
  {
    t: "Local is not recurrence",
    b: "Ordinate-local neighbors recover the tangent. Feature neighbors measure phase return. Contamination is the share of feature edges that are not time-local. Mixing the two graphs is how a pretty picture becomes a false discovery.",
  },
  {
    t: "The metric ceiling is a product feature",
    b: "Pair-summaries see only a histogram. Rips sees labeled triples. Holonomy sees cycles. A true sheaf is eligible only after δ² = 0. Function restriction is an identity. Pairwise Procrustes stops at the connection.",
  },
  {
    t: "Every null must justify itself",
    b: "GUE belongs to spectral spacing. A drill manifold, a pulse, a thought get their own shuffle. A green p is not a physical law. The manuscript’s p_emp = 0.70 is the reminder.",
  },
  {
    t: "Concept becomes product at the gate",
    b: "A paper is a construction. A product is an instrument that will not lie about that construction. The sheaf gate, the two graphs, the claim class, and the justified null are the commercial spine. Everything else is a tense the operator can hold.",
  },
  {
    t: "The 0.991 is an orbit window",
    b: "Neighboring zeta zeros already sit past the linear radius of the fastest primes. The rank-one certificate is a micro-window on the continuous map Φ. Discrete-zero kNN measuring ~0.1 is the spacing fact, not a broken theorem. Conflating them is how a construction gets written up as a failed manifold.",
  },
  {
    t: "Restriction of functions is an identity",
    b: "On a function sheaf, ρ_{U⊂W} = ρ_{U⊂V} ∘ ρ_{V⊂W} cannot fail. A zero residual there is not a certificate. The cellular test is δ² = 0. Glueing of open-set labels is H⁰ — empirical, and allowed to clash. Pairwise Procrustes would be a connection, and we do not promote it.",
  },
  {
    t: "Weyl needs the damper",
    b: "At α = 0 the prime displacement can raise RMSE. At α = 1 every block on the first hundred zeros improves. The studio defaults to the damped operator. The frozen GUE cell is computed only when you open Protocol — it is a test, not a page load.",
  },
];

function Method() {
  return (
    <div className="min-h-dvh bg-bg text-fg">
      <SiteHeader solid />
      <main className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <p className="text-[11px] tracking-[0.22em] text-subtle uppercase">Method</p>
        <h1 className="mt-3 font-display text-4xl sm:text-5xl">
          What the software is allowed to claim.
        </h1>
        <p className="mt-5 text-base leading-relaxed text-muted">
          Meridian implements the constructions and boundaries of the phase-recurrence
          manuscript, then layers a Condition-State adapter on top. The product exists to
          make those boundaries usable — not to launder a circular fit as a discovery, and
          not to treat graph-plus-PCA as a finished gauge theory.
        </p>
        <p className="mt-4 text-sm leading-relaxed text-muted">
          Concept to product is a loop, not a launch. The same gates that keep a theorem
          honest keep a commercial studio honest.
        </p>

        <ol className="mt-8 grid gap-3 sm:grid-cols-2">
          {loop.map((s) => (
            <li key={s.n} className="rounded-md bg-surface px-3 py-3 shadow-[var(--shadow-panel)]">
              <div className="font-mono text-[11px] text-subtle">{s.n}</div>
              <h2 className="mt-1 font-display text-xl leading-tight">{s.t}</h2>
              <p className="mt-1.5 text-sm leading-relaxed text-muted">{s.d}</p>
            </li>
          ))}
        </ol>

        <div className="mt-8 flex flex-wrap gap-3">
          <Button asChild>
            <Link to="/adapter">Open the adapter</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/studio">Run a frozen cell</Link>
          </Button>
        </div>

        <ol className="mt-14 space-y-8">
          {theorems.map((th, i) => (
            <li key={th.t} className="border-t border-line pt-8">
              <div className="font-mono text-[11px] text-subtle">
                {String(i + 1).padStart(2, "0")}
              </div>
              <h2 className="mt-2 font-display text-2xl">{th.t}</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted">{th.b}</p>
            </li>
          ))}
        </ol>

        <h2 className="mt-16 font-display text-3xl">Corrections the adapter keeps.</h2>
        <ol className="mt-6 space-y-8">
          {corrections.map((th, i) => (
            <li key={th.t} className="border-t border-line pt-8">
              <div className="font-mono text-[11px] text-subtle">
                C{String(i + 1).padStart(2, "0")}
              </div>
              <h3 className="mt-2 font-display text-2xl">{th.t}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{th.b}</p>
            </li>
          ))}
        </ol>

        <aside className="mt-14 rounded-xl bg-surface p-5 shadow-[var(--shadow-panel)]">
          <h2 className="font-display text-2xl">Install</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            Add Meridian to the home screen for a standing instrument. Projects and
            certificates require an account; the public adapter and live geometry do not.
          </p>
          <Button asChild className="mt-4">
            <a href="/?install=1">Installation guide</a>
          </Button>
        </aside>
      </main>
    </div>
  );
}
