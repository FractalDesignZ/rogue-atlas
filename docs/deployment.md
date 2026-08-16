# Deployment

## Local

```bash
npm install   # if node_modules is missing
sh startup.sh # or: npm run dev
# app on the preview host; kernel tests:
npm run test:vv
npm run typecheck
npm run build
```

One-command intent: `sh startup.sh` brings the preview back after
hibernate. It is idempotent.

## Production build

`npm run build` emits a Vercel/Nitro output. `/assets/*` must be
routed **before** the SSR fallback (otherwise module scripts arrive
as `text/html` and the page is blank).

PGLite WASM is copied next to the function so a preview without
`DATABASE_URL` still boots. On a real Neon deploy that copy is dead
weight — set `DATABASE_URL` and treat the WASM bundle as preview-only.

## Environment

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | Postgres. Optional. |
| `VITE_AUTH_ENABLED` | Set `false` to disable client auth UI. |
| better-auth / OIDC secrets | **never commit** |

## On-prem / disconnected

Not packaged. The kernel is browser-side TypeScript and can be
served as static+SSR assets. Live connectors, air-gap installers,
and customer-managed encryption are commercial modules (planned).

## Do not claim

ISA/IEC 62443, SOC2, or measured 10 Hz until those audits and
benchmarks exist.
