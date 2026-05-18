---
title: 'F1+F2 Data-Flow Foundation closed out (PR1 #130 + PR2 #131 + PR3 = data-flow-foundation-pr3)'
purpose: decide
tier: card
status: active
date: 2026-05-06
topic: ['decisions', 'azure', 'sustainment', 'adr']
verified-against-commit: 6f51f080
last-verified: 2026-05-18
supersedes: []
---
> **Decision card** — extracted from `docs/decision-log.md` §1 on 2026-05-18. Aggregate view: [`decision-log.md`](../../decision-log.md) (generated).

# F1+F2 Data-Flow Foundation closed out (PR1 #130 + PR2 #131 + PR3 = data-flow-foundation-pr3)

Three-PR sequence: **F1 types layer (PR1)** — `EntityBase` (`id`/`createdAt`/`deletedAt`) + `HubAction` discriminated union + `cascadeRules` + `HubRepository` interface in `@variscout/core/persistence`. **F2 PWA (PR2)** — `PwaHubRepository` + composition-root migration (store/hook call-sites wired to `dispatch`). **F2 Azure (PR3)** — `AzureHubRepository` + `cascadeArchive` in a single Dexie transaction + `applyAction` per-action dispatch for all 36 `HubAction` kinds + `services/storage.ts` facade migration + `useEvidenceSourceSync` cursor migration + ESLint `no-restricted-imports` guard (P7.2) blocking direct `dexie` + `**/db/schema` imports outside R12+R13 allow-list. **Why (1):** enforce a single dispatch boundary for hub-domain writes, eliminating scattered inline Dexie calls that violated ADR-078 D2 at the call-site level. **Why (2):** prepare F3 normalization (PWA blob → normalized tables) as a contained swap inside `PwaHubRepository.dispatch` with no store-side changes required. **Plan-reality deltas absorbed:** (1) sustainment/handoff dispatch deferred — no `SUSTAINMENT_*`/`HANDOFF_*` `HubAction` kinds; sustainment editors continue calling `services/localDb.ts` helpers directly (R13 allow-listed); F3 may unify. (2) P6 sub-tasks consolidated — only `services/storage.ts` facade internals + `useEvidenceSourceSync` cursor were real migration targets; UI components calling `useStorage()` are auto-satisfied. (3) Bootstrap cache-fill at `storage.ts:548` left as direct `saveProcessHubToIndexedDB` (cloud→local cache, not write-dispatch). (4) P7.2 ESLint rule extended beyond `dexie` package imports to also block `**/db/schema` glob imports. (5) `--chrome` walk deferred to user pre-merge (mirrors PR2 precedent). **State:** F1+F2 ACCEPTED. F3 starting point: swap `PwaHubRepository.dispatch` from blob-write to normalized-table-write; no store-side changes required (Opus final review, 0 Critical, 0 Important). Source: [`docs/superpowers/specs/2026-05-06-data-flow-foundation-design.md`](superpowers/specs/2026-05-06-data-flow-foundation-design.md) (status: delivered); plan at [`docs/archive/plans/2026-05-06-data-flow-foundation-f1-f2.md`](archive/plans/2026-05-06-data-flow-foundation-f1-f2.md). _Pinned 2026-05-06._
