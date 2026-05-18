---
title: 'Charter authoring V1 → Improvement Project V1'
purpose: remember
tier: card
status: archived
date: 2026-05-08
topic: ['investigation', 'promoted']
surfaced-date: 2026-05-07
verified-against-commit: 6f51f080
last-verified: 2026-05-18
---

> **Archived investigation card** — closed 2026-05-08 (promoted); extracted from `docs/investigations.md` on 2026-05-18. Live queue: [`ephemeral/investigations.md`](../../ephemeral/investigations.md). Card index: [`cards/investigations/`](../investigations/).

# Charter authoring V1 → Improvement Project V1

**Surfaced by:** PR8-8a amendment review, 2026-05-07.

**Description:** PR8-8a ships a Charter stub destination only. The full surface — hub-level entity (multiple per Hub per Q1), problem statement / goals / scope / team / timeline form, `.vrs` round-trip — is deferred. Free-tier-active per Q2 (PWA can author + export `.vrs`); team signoff features paid-only inside the surface.

**Resolution (2026-05-08, SUPERSEDED 2026-05-09):** Initial design spec [`docs/archive/specs/2026-05-08-improvement-project-v1-design.md`](archive/specs/2026-05-08-improvement-project-v1-design.md) + plan [`docs/archive/plans/2026-05-08-improvement-project-v1.md`](archive/plans/2026-05-08-improvement-project-v1.md) — both **SUPERSEDED 2026-05-09** by the unified Response Path System V1 design ([`docs/archive/specs/2026-05-09-response-path-system-v1-design.md`](archive/specs/2026-05-09-response-path-system-v1-design.md)) + plan ([`docs/archive/plans/2026-05-09-response-path-system-v1.md`](archive/plans/2026-05-09-response-path-system-v1.md), 54 tasks across 10 PRs). The superseding spec covers all 5 response paths (Quick Action / Focused Investigation / Improvement Project / Sustainment / Handoff) as a unified system + naming reconciliation (SuspectedCause → Hypothesis) + Wall package re-home + Wall vision Detective-pack + Survey UI dual-surface + Quick Action surface; ~8–10 PRs across ~6–8 weeks off branch `response-path-system-v1`. Brainstorm resulted in two key reframings beyond the original Q1/Q2 scope:

- **Methodology pivot — DMAIC dropped for QC Story / Toyota TBP.** VariScout's existing investigation spine (Issue Statement, SuspectedCause, Findings, ImprovementIdea, Sustainment) maps 1:1 to QC Story's 8-section narrative. The artifact reuses VariScout primitives via FK rather than duplicating in DMAIC vocabulary; methodology lineage is acknowledged in design docs but absent from UI copy.
- **Rename "Charter" → "Improvement Project."** Avoids DMAIC-coding the vocabulary, communicates living-document semantics, avoids `useProjectStore` collision while staying qualified. Vision §2.4 + §5.3 amended.
- **Audit trail dropped from V1 paid-tier scope.** Azure tenant logging (App Insights, Activity Log) handles compliance audit at platform level; V1 paid ships _only_ signoff workflow.

**Promotion path:** Implementation plan to follow per `superpowers:writing-plans` flow. Likely sequence: spec → plan → 6–8 tasks across `@variscout/core` (types + actions + .vrs serialization) + `@variscout/ui` (form + sections) + per-app shells (PWA + Azure) + persistence handlers.
