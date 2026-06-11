---
tier: living
purpose: decide
title: 'ADR-093: V1 simplification cuts — collaboration, Azure persistence, mobile'
audience: both
category: product
status: active
date: 2026-06-11
layer: L5
related:
  - docs/07-decisions/adr-092-local-first-variscout-product-model.md
  - docs/superpowers/specs/2026-06-11-local-first-variscout-product-vision-design.md
  - docs/superpowers/specs/2026-06-11-consultation-loop-design.md
  - docs/07-decisions/adr-082-wedge-architecture.md
  - docs/07-decisions/adr-091-two-tier-persistence-model.md
---

# ADR-093: V1 simplification cuts — collaboration, Azure persistence, mobile

**Status:** Accepted
**Date:** 2026-06-11

## Context

ADR-092 (accepted the same day) reframed VariScout V1 as a local-first
process improvement workspace. As written by the original draft, ADR-092 kept
live project membership, Blob persistence, and ACLs as "optional capabilities."
The same-day owner review went further: if the collaboration model is
artifact-first with a closed consultation loop (see the
[consultation-loop spec](../superpowers/specs/2026-06-11-consultation-loop-design.md)),
then the live-collaboration and cloud-persistence layers are not optional
capabilities — they are dead weight that complicates the codebase, the security
review, and the pitch. This ADR records the engineering consequences.

Four additional same-day decisions sharpen the cut:

1. **Azure's role narrows to distribution + CoScout.** The paid deployment is
   company-approved distribution/licensing plus CoScout on the customer's
   Azure OpenAI endpoint. Cloud document persistence is not part of the paid
   surface.
2. **Desktop-only, hard cut.** The product targets desktop browsers. Mobile-
   and touch-specific surfaces are deleted, not maintained.
3. **Free deployment gets a build-time hard gate.** The free web deployment
   ships **without save/export code in the bundle**: upload/paste data in,
   full in-session analysis, nothing comes out as a file. The artifact layer
   (`.vrs` save, Analysis Packs, the consultation loop) is paid-only.
4. **An individual tier joins the channel model** (same-session decision):
   **€17+VAT/month or €99+VAT/year via Paddle** (merchant of record — VAT
   handled), carrying the personal artifact layer plus **BYOK CoScout**
   (the user's own AI key, direct browser→provider calls — never a
   VariScout-operated proxy, preserving ADR-059). Delivery: an **installable
   desktop PWA on a dedicated app origin** (not the public free site),
   Paddle-authenticated at delivery, installed to the user's machine, fully
   offline-capable with a license grace period — the paid product runs on
   the user's desktop, the public website carries only the free demo. NOT a
   client-side license key in a public bundle (which would expose export
   code). A true downloadable desktop build (Tauri) is **named-future** for
   air-gapped demand. Personal-use license; trainer/launch discount codes
   are the land-motion lever. Ships with the artifact layer, not before.

## Decision

### D1 — Delete the collaboration layer

Live multi-user collaboration is removed from V1 (it remains named-future in
VariScout Process). Deleted: project-membership ACLs (`projectMembership` /
`canAccess`), Lead / Member / Sponsor roles, invite flows, roster UI, ACL
enforcement at the storage boundary (R6c/R6e), and shared-document surfaces.
"Sponsor" survives only as a pack **audience** (executive Analysis Pack), not
as a role with access. Collaboration in V1 = the consultation loop + Analysis
Packs.

### D2 — Delete the Azure persistence layer

The Blob/EasyAuth-document stack is removed: `cloudSync`, server storage APIs,
durable Azure document identity, the save-conflict machinery
(`SaveConflictDialog` + ETag pre-flight, PO-8b), and the `DocumentSnapshot`
Blob path. This deletes fresh work (PO-8b shipped 2026-06-05) — eyes open;
the model it served (durable cloud documents) is no longer in the product.
Durability is file-based: `.vrs` snapshots plus a minimal local autosave
cache (IndexedDB) so a crash does not eat a session. The Azure app's server
shrinks to: licensing/auth gate + CoScout proxy.

### D3 — Delete the mobile layer

Desktop-only, hard cut. Phone-specific components, responsive variants, and
touch affordances are deleted. Phone/tablet may render degraded — explicitly
unsupported. (Offline-after-first-visit is unaffected; it is orthogonal to
form factor.)

### D4 — Converge to one app, three deployments

Direction decided now, executed after the deletion sweeps: `apps/azure` and
`apps/pwa` converge into a single desktop web app. Deployment configuration
decides what is enabled — the free public deployment runs with AI provider
`none` and no artifact-export code; the Paddle-authenticated individual
deployment adds the artifact layer + BYOK CoScout; the Marketplace-distributed
company deployment adds tenant licensing, tenant-governed CoScout, and the
artifact layer. This kills the feature-parity burden, mirrored components,
and the dual-store seam.

### D5 — Channel boundaries (build-time enforced)

| Capability                               | Free web             | Individual (Paddle, €17/mo or €99/yr +VAT)                             | Company (Marketplace, €120/mo)                                        |
| ---------------------------------------- | -------------------- | ---------------------------------------------------------------------- | --------------------------------------------------------------------- |
| Upload/paste data, full analysis loop    | ✓                    | ✓                                                                      | ✓                                                                     |
| Save workspace (`.vrs`)                  | — (session-only)     | ✓                                                                      | ✓                                                                     |
| Analysis Pack / Consultation Pack export | —                    | ✓                                                                      | ✓                                                                     |
| Consultation loop                        | — (depends on packs) | ✓                                                                      | ✓                                                                     |
| CoScout + transcript distillation        | —                    | ✓ BYOK (own key, direct calls)                                         | ✓ tenant endpoint, IT-governed                                        |
| Distribution / legitimacy                | public URL           | installable desktop PWA, Paddle-gated app origin; personal-use license | company-approved, runs in the customer's tenant; security review pack |

The free gate is **build-time exclusion**, not a runtime flag: the free bundle
does not contain export code, so it cannot be circumvented client-side. The
boundary message: **"analyze free; keep, share, and consult on your work =
paid."** Named regression, accepted deliberately: the free deployment becomes
weaker than the 2026-06 shipped PWA (which has `.vrs` export today).

Channel logic: the individual tier monetizes consultants, freelance belts, and
trainees (post-course discount codes) who never pass Azure procurement, and is
the bottom-up land motion into the company SKU. Seat math is deliberate: ~7
monthly seats ≈ the company price, so small teams tip upward. The company SKU's
distinct pull is governance — personal BYOK keys are shadow AI to corporate IT;
the company deployment is the sanctioned alternative (tenant endpoint, audit,
security pack). BYOK constraint is architectural: supported-provider list
(endpoints that accept direct browser calls), key in browser storage only,
**no vendor proxy ever**.

### D6 — Cut CoScout voice input (added same day, owner call)

CoScout's transcription-first voice input (ADR-071; shipped on Azure —
`CoScoutSection`, finding editor, `runtimeConfig`) is **cut from V1**. Voice
is not a design principle anywhere in the product: CoScout is typed-first,
and new designs (e.g., the Ishikawa lens) must not assume a voice mode.
ADR-071 is superseded in effect; the code deletion rides the D1–D3 sweep
program (grounding audit first, same discipline). The consultation loop is
unaffected — its talk-track mode processes _Teams_ recordings/transcripts,
which never depended on in-product voice capture. Revive trigger: field
demand for hands-free gemba capture, as a deliberate re-decision.

## Execution discipline

- **Ground before delete.** Each deletion program (D1, D2, D3, D6) gets its
  own grounded audit before any sweep — the 2026-06-09 future-code audit
  showed deletion priors are frequently wrong in both directions.
- **Deletion sweeps follow the atomic-cascade carve-out** (one implementer,
  Architect → Migration → Validator phases, per-category commits) and
  validators run **app test suites**, not just builds.
- **Sequencing:** nothing here jumps the active queue (ER-5b/ER-6 closeout,
  demo-readiness) without a separate call. D4 (app convergence) explicitly
  waits until D1–D3 land, when what remains of `apps/azure` is small.
- L3/L4 docs describing shipped behavior (DATA-FLOW §4–6, save-and-load,
  blob-storage-sync) keep documenting the code until the sweeps land; they
  carry a "scheduled for deletion (ADR-093)" marker, not premature rewrites.

## Consequences

### Positive

- Dramatically smaller codebase: no membership, no ACL enforcement, no cloud
  sync/conflict machinery, no mobile variants, eventually one app shell.
- Smaller security-review surface: the deployed product holds no shared data
  application; sharing is controlled file artifacts.
- A legible paid boundary that does not artificially cripple analysis.
- The consultation loop — the differentiating workflow — lands entirely on
  the paid side, strengthening the paid story beyond "AI + legitimacy."
- The individual Paddle tier opens revenue from the long tail (consultants,
  freelance belts, trainees) with near-zero marginal cost, and seeds champions
  inside companies that have not yet passed procurement.

### Harder

- Deletes recently shipped work (PO-8b conflict machinery, R6e ACL
  enforcement) — accepted sunk cost.
- Cross-device continuity is "carry your `.vrs`" — no cloud restore.
- Multi-day training cannot save state between sessions on the free
  deployment (re-paste the exercise CSV; trainers can hold licenses per the
  trainer-network model).
- Evaluators who invest hours and cannot keep artifacts may churn before
  convincing their org — standard freemium tension, monitored under H5.

## Relationship to prior decisions

- **ADR-092** stands; this ADR hardens its "optional capabilities" into
  deletions and adds the desktop-only and free-gate decisions.
- **ADR-082** (wedge architecture) is amended in effect: the 3-persona
  per-project ACL model leaves V1 entirely; single-SKU and the 7-tab nav
  stand.
- **ADR-091** (two-tier persistence) is amended in effect: tier 2 (durable
  Azure documents) is deleted; `.vrs` + local autosave is the persistence
  model.
- **ADR-059** (no VariScout-operated cloud) is unaffected and strengthened.
- The Workspace product model (W-series, 2026-06-09) stands: Workspace →
  soft-formalized Project → Analysis Scope survives as the product spine;
  formalization becomes a solo act (charter, lifecycle) with no membership.

## Links

- [ADR-092: Local-first VariScout product model](adr-092-local-first-variscout-product-model.md)
- [Consultation-loop design spec](../superpowers/specs/2026-06-11-consultation-loop-design.md)
- [Local-first product vision spec](../superpowers/specs/2026-06-11-local-first-variscout-product-vision-design.md)
