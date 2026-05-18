---
title: 'Team-collaboration features inside Charter / Sustainment / Handoff surfaces'
purpose: remember
tier: card
status: archived
date: 2026-05-17
topic: ['investigation', 'wedge-scope-note']
surfaced-date: 2026-05-07
verified-against-commit: 6f51f080
last-verified: 2026-05-18
---

> **Archived investigation card** — closed 2026-05-17 (wedge-scope-note); extracted from `docs/investigations.md` on 2026-05-18. Live queue: [`ephemeral/investigations.md`](../../ephemeral/investigations.md). Card index: [`cards/investigations/`](../investigations/).

# Team-collaboration features inside Charter / Sustainment / Handoff surfaces

**Surfaced by:** PR8-8a amendment review, 2026-05-07.

> **Wedge V1 (2026-05-16):** Handoff surface is retired (folded into Sustainment). This entry covers Charter + Sustainment only. The five-CTA model reduces to 3 V1 paths; Q2 tier reframe still applies for the remaining surfaces. The pattern (project-role gating via `canAccess()` inside surfaces) remains valid — the `useTier()` references are retired per ADR-082.

**Description:** The team-collaboration role-gate lives **inside** each surface: signoff buttons, audit trail, alerts setup, RACI, change notifications. PR8-8a defers wiring this layer until the surface forms ship.

**Possible directions:**

- Each surface component uses `canAccess()` from `@variscout/core/projectMembership` and renders project-role-gated controls at button level (not surface-level). `useTier()` is retired in V1 (single SKU, see ADR-082).
- Shared pattern: a `<MembershipFeatureGate feature="signoff">` wrapper component in `@variscout/ui` so the gating contract is uniform across surfaces.
- Telemetry: track feature impressions to inform pricing.

**Promotion path:** Per-surface, ride along with each response-path's V1 form slice.
