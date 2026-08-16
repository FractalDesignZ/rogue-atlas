# Architecture

## What runs

Browser-native TanStack Start (React 19, Vite, Tailwind v4). The
analysis kernel is TypeScript. There is no Python service and no
analysis REST backend.

```
DATA (typed coordinates)
    → Representation (imposed / estimated / learned)
    → Geometry & topology
    → Identifiability & justified null
    → Models / decisions (ladder; L0 interlocks always on)
    → Evidence ledger + visualization
```

## Repos and rooms

| Path | Role |
| --- | --- |
| `src/lib/meridian/` | Φ-space kernel (measure, geometry, operator, protocol) |
| `src/lib/adapter/` | Operations engine (walk, sheaf, graphs, nulls, claims) |
| `src/lib/atlas/` | Constitution, ingest sniff, ladder |
| `src/routes/` | Pages |
| `src/components/` | UI |
| `docs/` | This documentation |

## Multi-rate compute (policy)

| Path | Target | Shipped? |
| --- | --- | --- |
| Fast | ms — checks, rolling summaries, L0 | partial (sync main thread) |
| Medium | subsecond — PCA, recurrence, gating | sync, Q=32 class |
| Slow | seconds–hours — exact PH, nulls, GUE | Protocol is lazy; nulls are 12 shuffles |

Q = 256 will hitch. That is a known limit, not a 10 Hz certificate.

## Data stores

- Optional Postgres via `DATABASE_URL`.
- PGLite WASM fallback for preview (fail-soft if WASM is missing).
- Zustand for session analysis state.
- localStorage for pinned atlas entries / noticed seeds.

## What is not here

Job queue, plugin host, live connectors, edge runtime, monorepo
packages. See [api.md](api.md) §8 for the planned HTTP surface.
