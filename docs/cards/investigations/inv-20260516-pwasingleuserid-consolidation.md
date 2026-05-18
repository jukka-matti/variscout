---
title: 'PWA_SINGLE_USER_ID consolidation'
purpose: remember
tier: card
status: archived
date: 2026-05-16
topic: ['investigation', 'logged']
verified-against-commit: 6f51f080
last-verified: 2026-05-18
---

> **Archived investigation card** — closed 2026-05-16 (logged); extracted from `docs/investigations.md` on 2026-05-18. Live queue: [`ephemeral/investigations.md`](../../ephemeral/investigations.md). Card index: [`cards/investigations/`](../investigations/).

# PWA_SINGLE_USER_ID consolidation

**Surfaced by:** PR-WV1-3 architecture review.

`'analyst@local'` hardcoded in 3 files: `apps/pwa/src/App.tsx` (`PWA_WALL_USER_ID`), `apps/pwa/src/components/views/ImprovementView.tsx` (`PWA_USER_ID`), and PR-WV1-1 `ProjectsTabView` wiring. Consolidate into `packages/core/src/identity/pwaSingleUser.ts` as `export const PWA_SINGLE_USER_ID = 'analyst@local'`. PR-WV1-5 (auth wiring) is the natural place — single deletion site when real auth lands.

**Promotion path:** PR-WV1-5 (auth wiring sweep). Single-string change across 3 files; no design decision needed.
