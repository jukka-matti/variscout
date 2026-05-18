---
title: 'Dispatch pattern: HubAction vs Project-metadata patch'
purpose: remember
tier: card
status: archived
date: 2026-05-16
topic: ['investigation', 'resolved']
verified-against-commit: 6f51f080
last-verified: 2026-05-18
---

> **Archived investigation card** — closed 2026-05-16 (resolved); extracted from `docs/investigations.md` on 2026-05-18. Live queue: [`ephemeral/investigations.md`](../../ephemeral/investigations.md). Card index: [`cards/investigations/`](../investigations/).

# Dispatch pattern: HubAction vs Project-metadata patch

**Surfaced by:** PR-WV1-3 architecture review (Opus).

**Question:** Why does `MeasurementPlanAction` dispatch through `HubRepository.dispatch()` → `applyAction.ts` → Dexie table, while `ActionItemAction` dispatches through `useImprovementProjectStore.upsertProject()` → store state → Dexie sync?

**Rule:** Hub-domain sub-entities with their own Dexie table dispatch through `HubRepository.dispatch(HubAction)`. Project-metadata bag fields (anything under `ImprovementProjectMetadata.actions[]` or similar arrays-on-metadata) use `useImprovementProjectStore.upsertProject()`.

- MeasurementPlan: own Dexie table → HubAction dispatch ✓
- ProjectMember: own Dexie table → HubAction dispatch ✓
- ActionItem: stored as `ImprovementProjectMetadata.actions[]` → upsertProject patch ✓
- Invitation: localStorage-only V1 → Annotation store direct write ✓

**Side note:** The `ACTION_ITEM_UPDATE/REMOVE` cases in both apps' `applyAction.ts` are currently dead-code (the consumers use the upsertProject path). They are kept for symmetry + future-proofing if ActionItem migrates to its own table. Not load-bearing for V1.

**Resolution:** No code change needed. This entry establishes the rule for future Hub-domain extensions.
