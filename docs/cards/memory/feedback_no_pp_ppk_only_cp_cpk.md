---
title: 'no-pp-ppk-only-cp-cpk'
description: 'VariScout calculates only Cp and Cpk capability indices, never Pp/Ppk — product-level decision, removal targets if encountered'
purpose: remember
tier: card
status: active
date: 2026-05-28
topic: [memory, feedback]
related: []
verified-against-commit: ca45f469
last-verified: 2026-05-28
source-hash: 39eb83ae894e70aa
origin-session-id: 3528f5ac-bc2d-45da-a6f3-ac657193cb33
---

> 🤖 **Generated mirror** of `~/.claude/memory/feedback_no_pp_ppk_only_cp_cpk.md`. Edit there, not here. Card synced by `scripts/docs/sync-memory-cards.mjs`; re-run via `pnpm docs:rebuild` (Phase 3 A4).

VariScout calculates only `Cp` and `Cpk` capability indices, never `Pp` and `Ppk`.

**Canonical home:** [ADR-084 — Capability indices: Cp/Cpk only, no Pp/Ppk](docs/07-decisions/adr-084-capability-indices-cp-cpk-only.md), accepted 2026-05-18. This memory is the index entry; ADR-084 is the durable rationale doc. Phase 1 of Lane B (the removal sweep) shipped on 2026-05-19 — see `git log --grep ADR-084` for the deletion commits.

**Why:** Product-level decision stated by the user 2026-05-18 while scoping the lane B (stats engine type-cleanup) refactor. VariScout's positioning as the wedge V1 single-product improvement-specialist tool centers on stable-process capability (Cp/Cpk against within-subgroup σ̂), not overall-process performance (Pp/Ppk against total σ). Mixing both indices in the UI dilutes the methodology message.

**How to apply:**

- When adding new capability primitives, branded types, stats engine helpers, or chart annotations, scope to `Cp` and `Cpk` only.
- Any existing `Pp` / `Ppk` code re-surfacing in `packages/core/src/stats/`, `packages/charts/`, `packages/ui/`, `packages/core/src/i18n/messages/` capability formatters, or any app displays is a **removal target**, not a parallel calculation to preserve. Don't add fallbacks or migrations for `Pp`/`Ppk` — delete cleanly. (As of the Phase 1 sweep on 2026-05-19, the only retained Pp/Ppk references live in `apps/website/src/data/{learnData,toolsData}.ts` as educational "not in VariScout — here's why" text per ADR-084 §Decision.)
- Branded-type planning for Lane B Phase 2 drops `Pp` and `Ppk` types from scope entirely. The branded set is `Cp` + `Cpk` (each with a single typed constructor that takes a single-`SpecRule` context).
- ADR-073 amendment (in Lane B Phase 2 PR B-4 — retiring the architecture-grep guard `noCrossInvestigationAggregation.test.ts`) should explicitly state "Cp/Cpk only" as part of the policy lock. The forbidden-name denylist becomes shorter by removing `aggregatePpk` / `aggregatePerformance` from the substring grep.
- Capability grade banding (Cpk vs user-set target, default 1.33) is unchanged — see [[capability-grades-target-relative]]. The decision here is about *which indices exist*, not how they are graded.

Related: [[sdd-architectural-findings]] (lane A finding that surfaced lane B), [[capability-grades-target-relative]] (grade banding policy), [[aggregation-heterogeneous-specs]] (ADR-073 boundary policy), [[pr-ready-check-vitest-hang]] (workflow workaround surfaced during Phase 1 controller verification).
