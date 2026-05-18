---
title: 'Data-flow foundation spec (F1–F6 sequence, supersedes "PR7 = persistence schema only" framing)'
purpose: decide
tier: card
status: active
date: 2026-05-06
topic: ['decisions', 'wedge', 'canvas', 'capability']
verified-against-commit: 6f51f080
last-verified: 2026-05-18
supersedes: []
---
> **Decision card** — extracted from `docs/decision-log.md` §1 on 2026-05-18. Aggregate view: [`decision-log.md`](../../decision-log.md) (generated).

# Data-flow foundation spec (F1–F6 sequence, supersedes "PR7 = persistence schema only" framing)

Brainstorm 2026-05-06 reframed PR7 (PWA persistence schema) as one slice in a foundational data-flow refactor that addresses three drift sources at once: (a) stores reach past `@variscout/stores` directly into Dexie, violating ADR-078 D2 at the call-site level even though it holds at the type level; (b) write paths are scattered across inline Immer recipes (paste flow, investigation writes) instead of dispatched actions, blocking atomic multi-table writes; (c) referential integrity is implicit (everything embeds in the hub blob), with no cascade rules ready for the deferred multi-investigation lifecycle. **Decision: ship F1–F6 as a foundation track running parallel to canvas migration's PR8 Vision Alignment + PR9 cleanup.** F1+F2 — type-level normalization (`id`/`createdAt`/`deletedAt` + typed FKs on every entity) + repository interfaces (`HubRepository.dispatch(action)`) in `@variscout/core`. F3 = PR7 — PWA Dexie `version(1)` with normalized schema mirroring Azure's table set; pre-production = no migration code, dev hubs wipe on first open. F3.5 — ingestion action layer; paste/upload/evidence-source unify on `evidence/addSnapshot` action. F4 — three-layer state codification (Document / Annotation / View) generalizing canvas migration spec Decision 2. F5 — discriminated-union actions, full coverage (canvas already there; investigation + outcome writes get the pattern). F6 (named-future) — multi-investigation lifecycle. Compute pipeline (capability / regression / defect / pareto / matchSummary / analysisStrategy) is unchanged; hooks become join-aware via a central `useDenormalizedHubView`. `.vrs` format bumps v1.0 → v1.1; old fixtures regenerate. Source: [`docs/superpowers/specs/2026-05-06-data-flow-foundation-design.md`](superpowers/specs/2026-05-06-data-flow-foundation-design.md); F1+F2 plan at [`docs/archive/plans/2026-05-06-data-flow-foundation-f1-f2.md`](archive/plans/2026-05-06-data-flow-foundation-f1-f2.md) (3-PR sequence on branch `data-flow-foundation-f1-f2`). Cross-references ADR-078 (D2 architecture), canvas migration spec (Decision 2 + action shape precedent), ADR-077 (snapshot provenance / match-summary wedge that F3 normalizes), `feedback_no_backcompat_clean_architecture` (atomic refactors), `feedback_one_worktree_per_agent` (F-series + canvas migration get separate worktrees). _Pinned 2026-05-06._
