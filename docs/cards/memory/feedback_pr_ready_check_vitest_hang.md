---
title: 'pr-ready-check-vitest-hang'
description: '`scripts/pr-ready-check.sh` was unreliable on @variscout/ui (RESOLVED 2026-05-25 via wholesale rewrite of Canvas.test.tsx). Root cause: legacy file imported real @variscout/hooks; fresh file mirrors CanvasWorkspace.test.tsx''s full hooks mock. If a similar heavy-component test file hangs, mirror the same mock pattern from the start.'
purpose: remember
tier: card
status: active
date: 2026-05-28
topic: [memory, feedback]
related: []
verified-against-commit: ca45f469
last-verified: 2026-05-28
source-hash: b1cd1b5d13725a94
origin-session-id: d5bc876c-0411-4916-8f0e-6f6a3357eac6
---

> 🤖 **Generated mirror** of `~/.claude/memory/feedback_pr_ready_check_vitest_hang.md`. Edit there, not here. Card synced by `scripts/docs/sync-memory-cards.mjs`; re-run via `pnpm docs:rebuild` (Phase 3 A4).

`bash scripts/pr-ready-check.sh` was hanging indefinitely on its first `pnpm test` step. Root cause bisected 2026-05-25 to a single file: `packages/ui/src/components/Canvas/__tests__/Canvas.test.tsx`. Initially quarantined via `describe.skip`; later that day **wholesale-rewritten** (1500 lines → ~575 lines) on branch `fix/canvas-test-quarantine-vitest-hang`. Full @variscout/ui suite completes in 86.59s; pr-ready-check green.

**Actual mechanism (now known):** the legacy file imported the **real `@variscout/hooks`** package. Its transitive graph — `useCanvasViewportInput`, `useCanvasHypothesisDrawing`, `useCanvasKeyboard`, `useChipDragAndDrop`, `useHypothesisDrawTool`, `useSharedWallProps`, `useEvidenceMapData`, plus the lens/overlay registries — deadlocks vitest's mock-resolution during module init. Sibling `CanvasWorkspace.test.tsx` mocks the entire `@variscout/hooks` package (~365-line `vi.mock` factory) and runs cleanly. The fresh `Canvas.test.tsx` copied that exact mock structure and unhung instantly (3.19s).

**Wrong fix attempted first:** An Explore subagent on the same date asserted with "high confidence" that the `@variscout/charts` synthetic mock-factory pattern (`async () => { const React = await import('react'); ... }` without `importOriginal`) was the trigger. Verified by applying that fix → file still hung at 240s isolated. The hooks-package mock was the actual missing piece. Lesson: when a hang is "in mock resolution," check the **entire** transitive mock surface, not just the most-suspicious factory.

**How to apply:**

- **When writing a new heavy-component test file** that mounts something with a Canvas-shaped transitive graph (uses `@variscout/hooks` runtime: viewport hooks, drag-and-drop, keyboard, hypothesis drawing): **mirror `packages/ui/src/components/Canvas/__tests__/CanvasWorkspace.test.tsx`'s `vi.mock('@variscout/hooks', ...)` factory from the start.** Cheaper than discovering the deadlock later. The current `Canvas.test.tsx` is the second working reference of this pattern.
- **If pr-ready-check hangs again** (no progress for >3 min on `pnpm test`): repeat the bisect. Working pattern:
  - Wrap `pnpm --filter @variscout/ui test -- --run <substring>` in a kill-after-N-seconds shell (macOS has no native `timeout`); 240s is enough to distinguish hang from pass.
  - Start with positional-substring chunks of ~80 files; each iteration halves the search space. Log iterations as you go.
  - Once narrowed to ≤ 3 files, run each individually with `timeout 120`.
  - `--reporter=verbose` reveals whether the offender hangs at import-time (no test reports) vs test-time (one test name then silence).
- **Once narrowed to one file**, check whether it imports `@variscout/hooks` (or other heavy in-repo packages) **without mocking the package** — that was the actual mechanism here, not the per-factory `async () => { await import('react') }` pattern (which is fine — `CanvasWorkspace.test.tsx` uses it and runs in seconds).
- **Don't reintroduce per-package workarounds in CLAUDE.md / docs** — they were valid only while pr-ready-check was broken. Source of truth: `bash scripts/pr-ready-check.sh`.

Investigation card: `docs/ephemeral/investigations.md` § "`@variscout/ui` vitest full-suite hang" (now `[RESOLVED 2026-05-25]` with the actual root cause + verification numbers).

Related: [[atomic-sweep-one-dispatch]], [[implementer-long-bash-pitfall]], [[verify-preexisting-failure-claims]].
