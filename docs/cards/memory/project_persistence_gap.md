---
title: 'Persistence Gap Fix'
description: 'FIXED — getCurrentStateFromStores now reads from investigationStore; suspectedCauses + causalLinks persist correctly'
purpose: remember
tier: card
status: active
date: 2026-05-18
topic: [memory, project]
related: []
verified-against-commit: 6f51f080
last-verified: 2026-05-18
---

> 🤖 **Generated mirror** of `~/.claude/memory/project_persistence_gap.md`. Edit there, not here. Card synced by `scripts/docs/sync-memory-cards.mjs`; re-run via `pnpm docs:rebuild` (Phase 3 A4).

Persistence gap discovered and fixed during Evidence Map implementation (Apr 5 2026).

**Root cause:** After Zustand-first migration, investigation CRUD moved to `investigationStore`, but `getCurrentStateFromStores()` in `useProjectActions.ts` still read from `projectStore` (stale copies from load time).

**Fixed fields:**
- findings: now read from investigationStore (was projectStore stale)
- questions: now read from investigationStore (was projectStore stale)
- categories: now read from investigationStore (was projectStore stale)
- suspectedCauses: now read from investigationStore (was NOWHERE — 100% data loss)
- causalLinks: added to AnalysisState + serialization (new entity)

**Fix location:** `packages/hooks/src/useProjectActions.ts` — `getCurrentStateFromStores()` reads `useInvestigationStore.getState()` for all investigation fields. Load path extended to hydrate suspectedCauses + causalLinks.

**Why:** investigationStore is the authoritative source for all investigation data after the Zustand-first migration. projectStore copies are stale mirrors only used for backward-compatible serialization format.

**How to apply:** Any new investigation entity added to investigationStore must also be added to `getCurrentStateFromStores()` and the `loadInvestigationState()` calls in `loadProject()` and `importProject()`.
