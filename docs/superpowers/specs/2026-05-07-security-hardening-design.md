---
tier: living
purpose: design
title: Security Hardening Concept — Azure VariScout (project authz + server storage boundary + login guardrails)
audience: human
category: design-spec
status: draft
last-reviewed: 2026-06-01
related:
  - docs/07-decisions/adr-007-azure-marketplace-distribution.md
  - docs/07-decisions/adr-059-web-first-deployment-architecture.md
  - docs/07-decisions/adr-063-trust-compliance-roadmap.md
  - docs/07-decisions/adr-064-suspectedcause-hub-model.md
  - docs/07-decisions/adr-077-snapshot-provenance-and-match-summary-wedge.md
  - docs/07-decisions/adr-078-pwa-azure-architecture-alignment.md
  - docs/07-decisions/adr-079-etag-optimistic-concurrency-paid-tier-hub-writes.md
  - docs/08-products/azure/security-whitepaper.md
  - docs/decision-log.md
layer: spec
implements:
  - docs/01-vision/constitution.md
  - docs/03-features/data/acl.md
  - docs/03-features/data/cloud-sync.md
---

# Security Hardening Concept — Azure VariScout

> **Last material edit 2026-06-01** — Gap 2 rewritten for R6e: broad browser container SAS is no longer production guidance; storage access moves behind same-origin server APIs backed by managed identity.

> **Concept-level design.** Three specific gaps in the Azure tier's security posture: inside-tenant authorization, server-enforced storage access, login configuration guardrails. Implementation plans to be written separately. Not a threat model, not a compliance program, not a deployment-model rethink.

## 1. Context

VariScout's Azure deployment uses a **per-customer Managed Application** model: each customer deploys VariScout into their own Azure subscription via the Marketplace, with EasyAuth + Microsoft Entra ID for sign-in, customer-owned Blob Storage for hub data, and customer-owned Azure OpenAI for CoScout. The publisher (VariScout) has zero infrastructure access. This is documented in ADR-007, ADR-059, and `docs/08-products/azure/security-whitepaper.md`.

The login surface itself is small — it's Microsoft's. The genuine security gaps live elsewhere:

1. **Inside-tenant authorization is binary**: any user who can sign into the customer's Entra tenant currently sees every hub, every investigation, every project. Optional `VariScout.Admin` role only gates a few admin-tab UIs.
2. **Storage access must be server-enforced**: project-document listing/loading is access-aware after R6c, but production storage guidance must move beyond broad browser container SAS. The R6e target is same-origin server APIs that validate the caller against the document access model before any Blob list/read/write operation.
3. **Login configuration is mis-configurable**: Bicep allows multi-tenant Entra ID, which can let users from any Microsoft tenant sign in unless the customer adds extra filtering. There's no claim-level allowlist enforcement.

This is a **concept-level** design — it describes the approach and rationale per gap, lists alternatives considered, and points at the files/ADRs that will need to change. It does **not** prescribe task-by-task implementation; that work happens later.

## 2. Out of scope

- Threat model document (separate, future deliverable)
- SOC 2 / ISO 27001 evidence work (covered by ADR-063 phased roadmap)
- General-purpose audit log (deferred — see Gap 2 rationale)
- Viewer role for restricted hubs (deferred — Owner/Member is enough until a buyer asks)
- Refactoring EasyAuth itself (platform-managed; correct as-is)
- Multi-tenant SaaS deployment model (Per-Customer Managed App stays)
- PWA tier (open by design — ADR-059 / ADR-078)

## 3. Goals & non-goals

**Goals**

- Make "authenticated ≠ full access" possible inside a customer's tenant, without breaking the small-team usability that already works.
- Move production Blob Storage access behind same-origin server APIs so a signed-in user cannot list, read, or overwrite documents outside their R6c access set.
- Eliminate the "any Microsoft account can log in" misconfiguration risk at deploy time.

**Non-goals**

- A full RBAC system. We pick small, defensible deltas, not an enterprise-grade ACL framework.
- Forensic audit logging in the app. Lean on Microsoft-native diagnostic logs instead.
- Per-finding / per-evidence row access control. Hub-level is the unit of access.

---

## 4. Gap 1 — Inside-tenant authorization (per-hub access)

### 4.1 Problem

Today, every authenticated user in the customer's tenant sees every hub. This works for a 5–20 person Six Sigma team that already trusts each other, but breaks at:

- **Department scale (50–200)** — sensitive investigations (supplier complaints, customer escalations) leak.
- **Multi-BU scale (500+)** — Plant A team should not see Plant B's investigations.
- **External-sensitive cases** — investigations involving regulatory items or cross-licensee data need named-investigator-only access.

### 4.2 Recommended approach: Microsoft-Teams-style layered access

A three-layer model that matches what corporate IT and analysts already understand from SharePoint/Teams:

| Layer                           | Default                     | Set by                                 | Enforced where                         |
| ------------------------------- | --------------------------- | -------------------------------------- | -------------------------------------- |
| **L1 Tenant scope**             | Any user in the tenant      | IT (Bicep param + runtime claim check) | Sign-in middleware                     |
| **L2 Default hub visibility**   | Open to all signed-in users | Hub creator                            | Server `/api/hubs/list` + UI list      |
| **L3 Hub restriction (opt-in)** | Off                         | Hub owner                              | SAS minting + ACL check on every write |

L1 is the IT lever; L2 keeps the analyst flow zero-friction; L3 is the opt-in escape hatch for sensitive hubs.

### 4.3 Membership identity model

**Entra security groups + individual users** (recommended). Both first-class. IT-friendly (groups are managed in Entra; one place to offboard) AND analyst-friendly (ad-hoc share with one colleague without filing a group ticket). Mirrors SharePoint/Teams.

Alternatives considered:

- _Groups only_: clean audit story, but blocks ad-hoc sharing and forces IT to create a group for every two-person collaboration.
- _Individuals only_: easy for small teams, dies at corporate scale (no offboarding integration, 500-person allowlists by hand).

### 4.4 Roles model

**Owner / Member** (recommended). Owner manages members + edits + deletes; Member edits content but cannot change membership.

Alternatives considered:

- _Owner / Editor / Viewer_: Viewer is the natural compliance/audit-observer tier — but **reports already cover that audience**. Adding a third role costs UX surface (role picker) and code (permission matrix) for a use case mostly served elsewhere. Documented as a **future extension** in this spec; build when a buyer specifically asks.
- _Four-role with Commenter_: requires comments as a first-class concept VariScout doesn't have today. Over-engineering.
- _Action-based custom roles_: maximum flexibility, big UX overhead, definitively YAGNI for the customer profile.

### 4.5 Data placement

**Separate `hub-acl.json` per hub**, ETag-tracked (aligns with ADR-079).

Schema (illustrative):

```json
{
  "hubId": "...",
  "isRestricted": false,
  "owners": [{ "type": "user", "oid": "...", "upn": "..." }],
  "members": [
    { "type": "user", "oid": "...", "upn": "..." },
    { "type": "group", "groupId": "...", "displayName": "Plant A Engineers" }
  ],
  "history": [{ "ts": "...", "by": "...", "action": "grant", "subject": "...", "role": "member" }]
}
```

Alternatives considered:

- _Embedded in hub.json_: simpler write path but every hub read drags the ACL; membership change conflicts with content edits on ETag.
- _Tenant-wide registry blob_: single source of truth, but becomes a write hot-spot at any scale; ETag conflicts on every membership change.

### 4.6 Restricted hub discoverability

**Visible-but-locked** — restricted hubs appear in tenant-wide hub lists as "🔒 Restricted (request access)" rather than being hidden. Reasoning:

- No security-by-obscurity (a determined user finds the hub anyway via URL guessing).
- Enables a "request access" workflow the owner can approve in one click.
- Makes the boundary visible to managers and analysts ("there _is_ something here, you just don't see the contents").

### 4.7 Migration

Existing hubs default to **open within tenant** (today's behavior). On first owner sign-in after the feature ships, owner sees a one-time prompt: "Should this hub be restricted?" with a Yes / No / Remind me later. Zero-friction upgrade; no surprise lockouts.

### 4.8 `VariScout.Admin` override

Existing admin role gets a documented bypass: admins can view and manage any hub regardless of restriction state. Used for IT support, departing-employee handover, and forensic investigation. Each admin override action lands in the hub's `history` field.

### 4.9 Files this will touch (when implementation starts)

- `packages/core/src/processHub/` — extend `ProcessHub` type with optional `aclRef`; add `HubAcl` type.
- `apps/azure/src/services/azureHubRepository.ts` — gate reads/writes by ACL; resolve membership against caller's claims.
- `apps/azure/src/auth/easyAuth.ts` — surface `groups` claim for membership resolution.
- `apps/azure/src/hooks/useAdminAccess.ts` — new sibling hook `useHubAccess(hubId)`; same pattern.
- New: `apps/azure/api/hubs/list` endpoint — server-side filtered hub list.
- New: `apps/azure/api/hubs/{id}/acl` endpoints — read/update ACL.
- `apps/azure/src/db/schema.ts` — Dexie mirror for offline access checks where applicable.
- `apps/azure/src/components/...` — owner UI for "Restrict this hub" + member picker (Entra group/user search).
- New ADR: hub-level access control (next number after ADR-079).

---

## 5. Gap 2 — Storage hardening (same-origin API boundary)

### 5.1 Problem

Broad browser access to the project-data container is incompatible with R6c's access-aware document model. If the browser holds a container-wide read/write/list token, it can bypass server-side list/load filters and operate directly on blob paths.

- **List** blobs the user should not discover.
- **Read** document blobs outside the user's Lead/Member/Sponsor roster or private quick-analysis ownership.
- **Overwrite** any blob, including documents they should not access.
- **Bypass R6c access metadata** because the storage credential is not bound to the document access check.

ETag (ADR-079) only handles concurrent-conflict detection — it does not stop intentional or buggy overwrites.

### 5.2 Recommended approach: same-origin server APIs + managed identity

The browser calls same-origin storage APIs in `apps/azure/server.js`. For every list/read/write:

1. Server validates the EasyAuth session.
2. Server evaluates the R6c document access set:
   - Quick-analysis documents are private to the creator/current user.
   - Formal Projects derive access from `improvementProject.metadata.members`.
3. Server performs the Blob operation using App Service managed identity and Azure RBAC.
4. Server returns only authorized document payloads or metadata.

Production App Service configuration should not depend on storage account connection strings or Shared Key. After R6e, production storage should disable Shared Key access where supported (`allowSharedKeyAccess: false`), or use Azure Policy / audit controls to track remediation toward disabling it. Connection strings remain local-dev/test-only.

### 5.3 Alternatives considered

- **Per-blob SAS**: narrower than container SAS, but still pushes authorization artifacts into the browser and adds token churn.
- **Per-document-prefix SAS**: workable as a transitional fallback for large artifact uploads, but project document list/load/save should stay server-enforced.
- **OAuth bearer + user-delegation directly against Blob REST**: Azure-native, but still requires careful per-resource authorization and would rewrite the storage layer.

### 5.4 General audit log: deliberately not built

This was originally on the list. On reflection it doesn't earn its keep right now:

- VariScout is process-analytics + improvement actions — not regulated to the EHR / GxP / financial-ledger level.
- No customer in Watson testing has asked for it.
- **Microsoft-native alternative exists for free**: customers can enable Azure Storage diagnostic logs in their portal — every blob operation is recorded, customer-controlled retention, queryable in Log Analytics. We don't need to reinvent the wheel.
- Building an in-app audit-log viewer is real engineering work for a feature that mostly satisfies an InfoSec questionnaire checkbox most buyers won't actually verify.

**What we do instead:**

- **Embedded membership history** in `hub-acl.json` — last ~10 grant/revoke entries per hub. Tiny, atomic, useful for "who added me?" UX. Already part of Gap 1.
- **Whitepaper update** — add a short section pointing at Azure Storage diagnostic logs as the official audit-trail path: "VariScout deliberately does not maintain a separate audit log; for external audit-trail requirements, enable Azure Storage diagnostic logs (Microsoft-managed, customer-tenant)."
- **Defer** a generic in-app audit log until a real buyer requirement appears. Note in `docs/decision-log.md` so it's not lost.

### 5.5 Files this will touch (when implementation starts)

- `apps/azure/server.js` — add same-origin list/load/save routes that authorize per document and use managed identity for Blob I/O.
- `apps/azure/src/services/blobClient.ts` / `cloudSync.ts` — route project document operations through server APIs; do not require broad container SAS in the browser.
- `docs/08-products/azure/security-whitepaper.md` — new section on storage permissions + audit trail guidance.
- New ADR: server-enforced storage boundary policy.

---

## 6. Gap 3 — Login configuration guardrails

### 6.1 Problem

The Bicep template currently supports both single-tenant and multi-tenant Entra ID. Multi-tenant means _any_ Microsoft account from _any_ tenant can hit the login page and (if no further filtering is configured) get a session. The runtime app does not validate `tid` against an allowlist. This is the most realistic "could someone hack the login" path — not by breaking Microsoft auth, but by walking through a misconfigured front door.

### 6.2 Recommended approach: single-tenant only

**Drop multi-tenant Entra ID support entirely.** If a customer wants users from multiple tenants, they deploy multiple instances of VariScout (one per tenant). Each VariScout deployment is bound to exactly one Entra tenant.

Reasoning:

- Aligns with the per-customer Managed App model: the deployment IS the security boundary; cross-tenant is multiple deployments.
- Eliminates the `allowedTenantIds` parameter, the runtime tid-check complexity, and the misconfiguration failure mode in one stroke.
- Customer-side ergonomic: tenant boundaries map 1:1 to billing boundaries (each subscription = one Entra tenant in practice).
- The runtime `tid` check still exists as a **defense-in-depth assertion**: confirms the signed-in user's `tid` matches the tenant the deployment was bound to.

### 6.3 Bicep changes

- Remove the multi-tenant Entra ID parameter from `infra/main.bicep`.
- Hard-code single-tenant configuration on the Static Web App / App Service authentication settings.
- Document the "want multi-tenant? deploy a second instance" guidance in `infra/README.md`.

### 6.4 Runtime check (defense-in-depth)

- EasyAuth callback / server middleware reads `tid` from the platform-injected `x-ms-client-principal` claim and compares against the deployment's bound tenant id (env var or app setting).
- Mismatch → 403, log a security event, do not return application data.
- This is ~30 LOC and one integration test.

### 6.5 Optional: Entra app role gate for _all_ sign-ins

Customer IT can require an Entra app role (e.g., `VariScout.User`) for any access (separate from `VariScout.Admin`, which gates admin features). Deploy-time toggle. Off by default for small teams; on for enterprise customers who want to scope the deployment to a specific Entra group.

### 6.6 Files this will touch (when implementation starts)

- `infra/main.bicep` — remove multi-tenant param; force single-tenant.
- `infra/README.md` — document one-tenant-per-deployment.
- `apps/azure/src/auth/easyAuth.ts` — runtime `tid` check; optional `VariScout.User` role check.
- `apps/azure/server.js` — middleware-level `tid` check on API routes.
- `docs/08-products/azure/security-whitepaper.md` — update §2 (auth) to reflect single-tenant-only stance.
- New ADR: single-tenant-only Entra ID policy.

---

## 7. Cross-gap: documentation deltas

- **`docs/08-products/azure/security-whitepaper.md`**:
  - §2: rewrite for single-tenant-only.
  - New §13: "Inside-tenant access control" (hub-level ACL, roles, defaults).
  - New §14: "Audit trail" pointing at Azure Storage diagnostic logs.
- **New ADRs** (in `docs/07-decisions/`, sequential numbering after ADR-079):
  - Hub-level access control model.
  - Storage SAS scoping policy.
  - Single-tenant-only Entra ID policy.
- **`docs/decision-log.md`**: log the deferral of (a) Viewer role, (b) general audit log, with revisit triggers ("when an enterprise buyer specifically asks").

## 8. Sequencing notes (when implementation plans are written)

- **Gap 3** is smallest and unblocks nothing — can ship anytime.
- **Gap 1** is the largest. It introduces a new data shape (hub-acl.json), new endpoints, new UI, and migration. Likely 2–3 PRs minimum (data model + repository + UI).
- **Gap 2** can build on R6c's document access metadata without adding a new role model. Sequence: R6c document access metadata → R6e server storage API enforcement → later hub/project ACL UI refinements if needed.
- **PWA tier** does not get hub authz in this concept (open by design per ADR-059/ADR-078). Confirm before implementation that this matches product intent.

## 9. Verification (end-to-end test points)

For each gap, the implementation plan should include these checks:

**Gap 1 — Hub authz**

- Two-user E2E: User A creates a Restricted hub, User B (same tenant, no membership) cannot see it in `/api/hubs/list`, cannot fetch `hub.json`, cannot fetch `hub-acl.json`.
- Group-claim E2E: User C is in Entra group `X`; hub allows group `X`; User C can read; user D not in group cannot.
- Migration: existing open hub stays open after upgrade; owner sees prompt; choosing "Restrict" successfully scopes access.
- Admin override: `VariScout.Admin` user can view any restricted hub; the action lands in `hub-acl.json` history.

**Gap 2 — Storage hardening**

- Server list: caller sees only private quick analyses they own and formal Projects where they are Lead/Member/Sponsor.
- Server load/save: caller attempts to read/write another user's private quick analysis or non-member Project document → 403.
- Browser token audit: project document flows do not expose broad container SAS to browser code.
- Production config: deployed App Service uses managed identity; storage account connection string is absent.
- Shared Key posture: production storage has Shared Key disabled or an Azure Policy / audit finding tracking disablement.
- Diagnostic logs: smoke-test that Azure Storage diagnostic logging captures a write (manual verification in customer's Log Analytics workspace).

**Gap 3 — Login guardrails**

- Bicep: deploying with any multi-tenant parameter attempt fails at template validation.
- Runtime: a token with a `tid` not matching the deployment tenant returns 403 from server middleware.
- Optional `VariScout.User` role gate: when enabled, signed-in user without the role gets 403; with the role gets 200.

---

## 10. References

- `docs/07-decisions/adr-007-azure-marketplace-distribution.md` — per-customer Managed App model.
- `docs/07-decisions/adr-059-web-first-deployment-architecture.md` — customer-owned data; current EasyAuth setup.
- `docs/07-decisions/adr-063-trust-compliance-roadmap.md` — phased compliance plan; this concept doesn't displace it.
- `docs/07-decisions/adr-064-suspectedcause-hub-model.md` — hub as canonical organizing unit.
- `docs/07-decisions/adr-077-snapshot-provenance-and-match-summary-wedge.md` — provenance for snapshots.
- `docs/07-decisions/adr-078-pwa-azure-architecture-alignment.md` — tier model; PWA stays open by design.
- `docs/07-decisions/adr-079-etag-optimistic-concurrency-paid-tier-hub-writes.md` — ETag concurrency, basis for ACL doc concurrency.
- `docs/08-products/azure/security-whitepaper.md` — current security baseline; will be updated.
- `apps/azure/server.js` — same-origin API server and current storage integration point (target of Gap 2 rewrite).
- `apps/azure/src/auth/easyAuth.ts` — current auth integration (target of Gap 1 + Gap 3 changes).
- `apps/azure/src/hooks/useAdminAccess.ts` — current admin role pattern; will be siblinged for hub-level access.
- `infra/main.bicep` — current Bicep deployment (target of Gap 3 changes).
