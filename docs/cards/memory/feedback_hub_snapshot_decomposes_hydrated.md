---
title: 'HUB_PERSIST_SNAPSHOT decomposes hydrated optional fields'
description: 'Hydrated optional fields on ProcessHub (outcomes, improvementProjects, etc.) live in dedicated tables; snapshot must strip them from the hub blob and write rows in a single transaction'
purpose: remember
tier: card
status: active
date: 2026-05-18
topic: [memory, feedback]
related: []
verified-against-commit: c6cf0f8c5
last-verified: 2026-05-18
source-hash: 9a704681a4e37399
origin-session-id: 880d795c-aeb1-4193-9666-fd0e25119749
---

> 🤖 **Generated mirror** of `~/.claude/memory/feedback_hub_snapshot_decomposes_hydrated.md`. Edit there, not here. Card synced by `scripts/docs/sync-memory-cards.mjs`; re-run via `pnpm docs:rebuild` (Phase 3 A4).

When a hydrated optional field is added to `ProcessHub` (e.g., `outcomes?`, `improvementProjects?`, future `sustainmentRecords?`), `HUB_PERSIST_SNAPSHOT` is the canonical full-replace path that must:

1. Destructure the field out of the incoming hub blob via the same destructure used for `outcomes` / `canonicalProcessMap`:
   ```ts
   const { canonicalProcessMap, outcomes, improvementProjects, ...hubMeta } = action.hub;
   ```
2. Wrap all writes in a single `db.transaction('rw', [<all touched tables>], …)` so partial-state recovery semantics hold.
3. Apply the **stale-row-delete-then-bulkPut** pattern: build a `Set` of incoming row IDs, delete rows with the hub's `hubId` whose IDs aren't in the set, then `bulkPut` the incoming rows (this preserves the F2 blob-replacement invariant in the normalized world — `bulkPut` alone is upsert and would leave dropped entities visible on the next read).

**Why:** Without decomposition, the embedded array ends up in BOTH the hub row AND the dedicated table. `joinHub` reads from the dedicated table and hides the bug, but the hub row carries stale duplicate data — surfacing on the next legacy `db.processHubs.get(...)` outside the repository. Once a UI consumer reads from the raw blob (e.g., a `.vrs` import path or a debug tool), they see ghost data.

**Apps:**
- **PWA**: handler lives in `apps/pwa/src/persistence/applyAction.ts` HUB_PERSIST_SNAPSHOT case; transaction scope already includes `db.outcomes` and `db.canvasState`; add new tables to the lock list when the field is added.
- **Azure**: short-circuit in `AzureHubRepository.dispatch` BEFORE applyAction; transaction scope is `[db.processHubs, db.improvementProjects, …]`. `saveProcessHubToIndexedDB` joins the outer transaction via Dexie 4 zone propagation — no special wiring needed.

**Test discipline:** Dispatch tests that mock `saveProcessHubToIndexedDB` will pass vacuously if the fixture hub doesn't carry the decomposed field. Fixtures MUST include a populated decomposed-field array, and the assertion MUST verify it's stripped from the call arg (`expect.not.objectContaining({ improvementProjects: expect.anything() })`). Add a separate real-Dexie integration test (e.g., `AzureHubRepository.snapshot.test.ts`) using `fake-indexeddb/auto` to verify both: (a) hub blob lacks the field, (b) dedicated table has the rows, (c) stale rows from a prior snapshot are deleted.

**How to apply:** When adding `<entity>?: <Entity>[]` to `ProcessHub` (hydrated optional pattern):
- Add the dedicated Dexie table (PWA: append to v1 stores; Azure: bump version with new `.version(N).stores({...})` block).
- Update HUB_PERSIST_SNAPSHOT in BOTH apps to destructure + bulk-put + stale-cleanup the new field.
- Update read-path hydration (`PwaHubRepository.joinHub` + `AzureHubRepository.hubs.get`/`list`) to attach the field with conditional spread (only when `liveRows.length > 0`).
- Write a real-Dexie snapshot integration test before merging.

PR-RPS-5 established this pattern for `improvementProjects`. PR-RPS-9 (Sustainment) and PR-RPS-10 (Handoff) follow the same shape when their HubAction kinds land.
