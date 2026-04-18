---
paths:
  - "apps/azure/src/services/**"
  - "apps/azure/src/lib/**"
  - "apps/azure/src/db/**"
  - "apps/azure/server.js"
---

# Azure storage + auth — editing invariants

- **EasyAuth is the auth model**; no MSAL code in the client. `/.auth/me` (built-in) returns identity; no `/api/me` endpoint.
- **IndexedDB via Dexie** (`db/schema.ts`); `services/localDb.ts` is the facade.
- **Blob Storage sync**: client never sees storage keys. `/api/storage-token` mints short-lived SAS scoped to the user's container. Data stays in the customer's tenant (customer-owned data, ADR-059).
- **App Insights telemetry**: strict no-PII rule. Log structural events only (mode changes, feature usage, durations). Never log data rows, user identifiers beyond tenant ID, or free-text prompts.
- **CoScout API calls** go to Azure OpenAI endpoint in the customer's subscription. Prompts may include investigation state (findings, hubs, edges) but never raw data rows beyond what's exposed in charts.

Reference: `apps/azure/CLAUDE.md`, `.claude/skills/editing-azure-storage-auth/SKILL.md`, `docs/07-decisions/adr-059-web-first-deployment-architecture.md`.
