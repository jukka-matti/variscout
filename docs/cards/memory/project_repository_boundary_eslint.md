---
title: 'Repository boundary ESLint pattern (F1+F2 P7.2)'
description: 'ESLint no-restricted-imports rule blocking both `dexie` package and `**/db/schema` glob imports outside R12+R13 allow-list. Catches both direct-Dexie and bypass-via-`db`-symbol patterns.'
purpose: remember
tier: card
status: active
date: 2026-05-18
topic: [memory, project]
related: []
verified-against-commit: c6cf0f8c5
last-verified: 2026-05-18
source-hash: 138cba51333b671e
origin-session-id: bd280fdf-fc6b-4524-8bc5-2a4ec315a804
---

> 🤖 **Generated mirror** of `~/.claude/memory/project_repository_boundary_eslint.md`. Edit there, not here. Card synced by `scripts/docs/sync-memory-cards.mjs`; re-run via `pnpm docs:rebuild` (Phase 3 A4).

`eslint.config.js` `no-restricted-imports` config object (added 2026-05-06 in F1+F2 PR3 #132) enforces the dispatch-only repository boundary. Blocks TWO patterns simultaneously:

1. `paths: [{ name: 'dexie', message: 'Persistence access is via @variscout/core HubRepository...' }]` — the obvious case (importing the Dexie package).
2. `patterns: [{ group: ['**/db/schema'], message: 'Direct `db` access from db/schema bypasses the repository dispatch boundary...' }]` — catches the `useEvidenceSourceSync.ts` pattern (pre-PR3) of importing the `db` symbol from `db/schema` rather than from `dexie` directly. Without this glob, the rule would silently miss every "import db, call db.someTable.put" violation.

**Allow-list per audit R12 + R13:**

```js
ignores: [
  'packages/stores/src/wallLayoutStore.ts',           // R12: separate variscout-wall-layout DB
  'apps/*/src/persistence/**',                         // designated home
  'apps/*/src/db/**',                                  // schema files
  'apps/azure/src/services/storage.ts',               // R13: facade with cloud-sync orthogonal
  'apps/azure/src/services/localDb.ts',               // R13: helper layer
  'apps/azure/src/services/cloudSync.ts',             // R13: cloud writes
  'apps/azure/src/lib/persistence.ts',                // R13: project-overlay
  '**/*.test.ts', '**/*.test.tsx', '**/__tests__/**', // tests routinely mock db
],
```

**Why this pattern is the right enforcement layer:**

- TypeScript's `assertNever` on the dispatch switch catches MISSING handlers but doesn't catch CALLERS that bypass dispatch.
- Per-file CLAUDE.md rules document intent but don't enforce.
- Per-app vitest doesn't catch this — it would pass even if a UI file went around dispatch.
- ESLint runs in `pnpm lint` which is part of `scripts/pr-ready-check.sh`, so the rule fires before merge.

**Smoke test (verify the rule actually fires):** plant `import Dexie from 'dexie'` in any non-allow-listed file (e.g. `apps/azure/src/components/ProcessHubEvidencePanel.tsx`), run `pnpm lint`, confirm the rule's message appears, then revert. This is the canonical regression-guard verification step.

**Why test files are exempt:** mocks routinely import `db`/Dexie for setup (`fake-indexeddb/auto`, `vi.mock('../db/schema', ...)`). Excluding test files keeps the rule signal clean.

**Watch-out for future expansions:** if a new app gets added (e.g. mobile, embedded), update both the `files` glob (`apps/*/src/**/*.{ts,tsx}` already covers it) and the allow-list if that app needs its own services facade. Don't expand the allow-list to silence violations — migrate the violating file to dispatch instead.

**Cross-references:** `apps/azure/CLAUDE.md` Persistence-boundary bullet (R12+R13 enumeration); `packages/stores/CLAUDE.md` (R12 wallLayoutStore exception); `feedback_no_backcompat_clean_architecture` (atomic refactor pattern this rule reinforces).
