---
paths:
  - "apps/azure/src/services/**"
  - "apps/azure/src/lib/**"
  - "apps/azure/src/db/**"
  - "apps/azure/server.js"
---

# Azure storage + auth — non-negotiables

- **EasyAuth only.** No MSAL in client code. `/.auth/me` returns identity.
- **Customer-owned data (ADR-059).** Never log PII to App Insights — log structural events only (counts, types, durations). Send error *type*, not message text.
- **SAS tokens minted server-side** via `/api/storage-token`. Client never sees storage keys. Container-scoped, 1h expiry.
- **ETag concurrency on hub-blob writes (ADR-079).** Callers MUST handle the `{ ok: false; reason }` branch — the typed result is the compile-time guard against silent overwrites.

Detailed patterns + persistence boundary + sustainment deferral: `apps/azure/CLAUDE.md`.
