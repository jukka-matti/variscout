---
title: 'Run @variscout/ui build before squash-merge'
description: 'Per-package vitest runs miss cross-package type export gaps. @variscout/ui''s tsc is the real cross-package build gate — run it before merging large branches.'
purpose: remember
tier: card
status: active
date: 2026-05-18
topic: [memory, feedback]
related: []
verified-against-commit: c6cf0f8c5
last-verified: 2026-05-18
source-hash: 900d85f275c3ca7d
origin-session-id: 4795770b-7d21-4aff-8dc8-58d3458f8e0e
---

> 🤖 **Generated mirror** of `~/.claude/memory/feedback_ui_build_before_merge.md`. Edit there, not here. Card synced by `scripts/docs/sync-memory-cards.mjs`; re-run via `pnpm docs:rebuild` (Phase 3 A4).

Before squash-merging any branch that touches multiple packages, run `pnpm --filter @variscout/ui build` (or `scripts/pr-ready-check.sh`). Per-package `vitest` is not sufficient — it runs against source, not against the build graph.

**Why:** PR #75 (Investigation Wall) carried three latent TypeScript errors through 8 phases and 36 commits — all caught only when the final pre-merge `pr-ready-check.sh` ran the full `turbo test` with `@variscout/ui`'s `tsc && vite build`:
1. Duplicate `DataRow` export at core root (findings barrel re-exported alongside canonical `./types` export).
2. `ProcessMap` / `ProcessMapTributary` imported from `@variscout/core` root by chart components, but only exported from the `@variscout/core/frame` sub-path.
3. `wallLayoutStore.ts` `getInitialState` cast collided with Zustand's built-in `getInitialState` that returns state + actions — needed `as unknown as ...` double-cast.

Individual package tests stayed green the whole way because:
- Vitest compiles source on the fly, doesn't enforce cross-package barrel consistency
- Each package's `tsc --noEmit` runs only against its own sources
- `@variscout/ui` builds via real `tsc && vite build`, which transitively type-checks through its dep graph (ui → charts → core) and surfaces the gaps

**How to apply:**
- **Before squash-merge**, always run `bash scripts/pr-ready-check.sh` (it runs `turbo test` which chains through `@variscout/ui:build`).
- For large branches, run `pnpm --filter @variscout/ui build` at key phase boundaries — catches cross-package gaps early, before the pre-merge rush.
- When adding new types/functions at sub-path level (e.g. `@variscout/core/frame` or `@variscout/core/findings`), also surface them at the root barrel IF any consumer imports from `@variscout/core` (root). Charts components conventionally import from root.
- Watch for duplicate exports: adding `export type { Foo } from './subpath'` while `Foo` is already re-exported via `export * from './subpath'` creates duplicates that silently pass vitest but break `tsc`.
