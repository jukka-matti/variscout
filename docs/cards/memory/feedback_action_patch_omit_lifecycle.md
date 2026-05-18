---
title: 'Action UPDATE patches must Omit lifecycle fields'
description: 'Every entity HubAction UPDATE.patch type must Omit `id | createdAt | hubId | updatedAt | deletedAt` so callers can''t bypass handlers'
purpose: remember
tier: card
status: active
date: 2026-05-18
topic: [memory, feedback]
related: []
verified-against-commit: c6cf0f8c5
last-verified: 2026-05-18
source-hash: 00d8e5b9e45cca6b
origin-session-id: 880d795c-aeb1-4193-9666-fd0e25119749
---

> 🤖 **Generated mirror** of `~/.claude/memory/feedback_action_patch_omit_lifecycle.md`. Edit there, not here. Card synced by `scripts/docs/sync-memory-cards.mjs`; re-run via `pnpm docs:rebuild` (Phase 3 A4).

When defining a new `<ENTITY>_UPDATE` HubAction kind, the `patch` type must be:

```ts
patch: Partial<Omit<Entity, 'id' | 'createdAt' | 'hubId' | 'updatedAt' | 'deletedAt'>>
```

Plus deeply-optional intersection for any field that contains nested-required sub-keys (e.g., `sections` for `ImprovementProject` where each sub-section must shallow-merge per key).

**Why:** Without `'updatedAt' | 'deletedAt'` in the Omit, callers can pass `patch: { updatedAt: 999 }` or `patch: { deletedAt: ... }` — bypassing the handler's `updatedAt: Date.now()` stamping AND creating an unsupervised soft-delete path that competes with the dedicated `<ENTITY>_ARCHIVE` action. The JSDoc says "updatedAt is set by the handler"; the type must enforce it.

`'id'` and `'createdAt'` are immutable identity fields. `'hubId'` is FK ownership — re-parenting an entity to a different hub via UPDATE is not a supported operation; future moves must use a dedicated action.

**How to apply:**
- Mirror the pattern set by `IMPROVEMENT_PROJECT_UPDATE` (`packages/core/src/actions/improvementProjectActions.ts`) and the earlier `HYPOTHESIS_UPDATE` tightening (PR-RPS-1 review fix).
- For entity types with nested-required sub-keys (sections, layouts, multi-step config), intersect with `Partial<Entity['theField']>` to let callers patch one sub-key without supplying all.
- Codify the deep-merge contract as JSDoc on the action union member; PWA + Azure handlers replicate it byte-for-byte.
- When PR-RPS-9 / PR-RPS-10 add `SUSTAINMENT_*` and `CONTROL_HANDOFF_*` action kinds, follow the same pattern.

**Why this is a feedback memory and not just code:** Reviewers in PR-RPS-2 (Hypothesis) and PR-RPS-5 (ImprovementProject) caught the same omission twice. The Omit list is the load-bearing detail — easy to forget when sketching a new action union from the existing `OutcomeAction` template (which lacks soft-delete via UPDATE because outcomes have no `deletedAt` patch path today).
