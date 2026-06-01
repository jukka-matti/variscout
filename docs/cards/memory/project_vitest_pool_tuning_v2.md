---
title: 'vitest-pool-tuning-v2'
description: 'Per-package vitest pool config architecture as of 2026-05-25. 3 jsdom packages (charts/hooks/ui) on `pool: ''threads'' + environment: ''happy-dom''`; 2 apps (azure/pwa) still on `forks + fileParallelism: false`. Shared cross-DOM-impl polyfills live in test/setup.ts.'
purpose: remember
tier: card
status: active
date: 2026-05-28
topic: [memory, project]
related: []
verified-against-commit: ca45f469
last-verified: 2026-05-28
source-hash: 5a92ae39d2cac0c4
origin-session-id: 85311cf8-0c99-4970-931f-5c1424d24b9e
---

> 🤖 **Generated mirror** of `~/.claude/memory/project_vitest_pool_tuning_v2.md`. Edit there, not here. Card synced by `scripts/docs/sync-memory-cards.mjs`; re-run via `pnpm docs:rebuild` (Phase 3 A4).

**Fact**: VariScout's vitest pool config landed in V2 form on main as PR #208 (`c475dd9c`, 2026-05-25).

**Why**: per-file JSDOM environment setup dominated wall-clock on the slow jsdom packages (`@variscout/hooks` had 295s env-time vs 6.6s actual tests). Switching to `pool: 'threads'` + `environment: 'happy-dom'` delivered ~30% faster on charts, ~2.6x on hooks, ~2.8x on ui — see `docs/superpowers/specs/2026-05-25-vitest-pool-config-design.md` Outcomes section for the table.

**How to apply** (architecture facts that should inform future changes):

| Package | Config | Notes |
| --- | --- | --- |
| `@variscout/charts` | `pool: 'threads' + environment: 'happy-dom'` | V2 |
| `@variscout/hooks` | `pool: 'threads' + environment: 'happy-dom'` | V2 |
| `@variscout/ui` | `pool: 'threads' + environment: 'happy-dom'` | V2 |
| `@variscout/core` | `environment: 'node'` (default pool) | Already cheap; not tuned |
| `@variscout/stores` | `environment: 'node'` (default pool) | Already cheap; not tuned |
| `apps/azure` | `pool: 'forks', fileParallelism: false, execArgv: ['--max-old-space-size=4096']` | Deferred — unknown rationale; needs git blame archaeology before changing |
| `apps/pwa` | `pool: 'forks', fileParallelism: false` | Deferred — same as azure |

- Shared cross-DOM-impl polyfills live in `test/setup.ts` (window.confirm stub, SVGPoint.matrixTransform polyfill with DOMMatrix a/b/c/d + m11/m21 aliases, MouseEvent/WheelEvent constructor patch for clientX/Y). Don't duplicate these per-package.
- happy-dom is a root devDep (`package.json`). Don't import from per-package devDeps.
- Cross-DOM test patterns: see [[happy-dom-test-patterns]].
- Benchmark harness lives at `scripts/bench-vitest.sh` — kept for future tuning rounds (apps).

**Open follow-ups**:
- **Apps tuning** — when someone has time, do `git blame apps/{azure,pwa}/vite.config.ts` for the rationale behind `fileParallelism: false`. If stale (underlying bug fixed), re-enable + benchmark. If load-bearing, document.
- **Retire `packages/hooks/CLAUDE.md` flaky-test-watch note** — gated on 3 consecutive clean turbo runs of `pr-ready-check.sh` on post-merge main. First clean run captured in PR #208; revisit on 2026-05-26+ after 2 more.

**Rollback path**: each `vitest.config.ts` change is a 2-line revert per package. Independent commits.

Related: [[happy-dom-test-patterns]], [[pr-ready-check-vitest-hang]] (different vitest issue — Canvas.test.tsx hang, resolved earlier 2026-05-25 in PR #206), [[investigate-failures-before-scoping-down]] (the lesson from the happy-dom failure investigation).
