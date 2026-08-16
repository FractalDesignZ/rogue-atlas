# Security

## In this tree

- No analysis secrets belong in source. None should be committed.
- Auth uses better-auth. Preview tokens exist for the sandbox host.
- Same-site request assertion on mutating server handlers.
- File ingest is **text sniff + number parse** in the browser. There
  is no server-side upload parser yet. When one exists: size limits,
  type allow-lists, no eval, no path traversal.
- Provenance hash is djb2 — collision-friendly. Upgrade to SHA-256
  before certificates are treated as records.
- PGLite / local project rows are isolated per preview identity, not
  a multi-tenant hardened store.

## Planned, not claimed

- RBAC and project isolation beyond preview users.
- Audit event log.
- Signed artifacts.
- SSO / OIDC enterprise IdP.
- Customer-managed encryption.
- Dependency scanning in CI.
- Export-control review for specific jurisdictions.

## Industrial

A learned model must never override a certified physical interlock.
Advisory recommendations require human approval (Phase D). Closed
loop is Phase E only after hazard analysis.

**Do not claim IEC 62443** because compatible controls are planned.
