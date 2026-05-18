---
title: 'Verify subagent "pre-existing failure" claims by running on main'
description: 'When an implementer subagent labels a test failure as "pre-existing on main, unrelated to this task," verify by actually running the test on main before accepting the claim — the failure is often caused by transitive imports the subagent introduced.'
purpose: remember
tier: card
status: active
date: 2026-05-18
topic: [memory, feedback]
related: []
verified-against-commit: c6cf0f8c5
last-verified: 2026-05-18
source-hash: 03594201b2a8d608
origin-session-id: 9b1399c5-d8ba-4e26-8ce7-810d3c156d4b
---

> 🤖 **Generated mirror** of `~/.claude/memory/feedback_verify_preexisting_failure_claims.md`. Edit there, not here. Card synced by `scripts/docs/sync-memory-cards.mjs`; re-run via `pnpm docs:rebuild` (Phase 3 A4).

When a subagent reports DONE / DONE_WITH_CONCERNS and pins a test failure as "pre-existing, unrelated to this task" — verify it. Run the failing test on `main` (or via `git stash` round-trip) before accepting the claim.

**Why:** In Canvas Polish v1 T2 (PR #143), the implementer reported the Azure `useEditorDataFlow.test.ts` failure (`No "DEFAULT_TIME_LENS" export is defined on the "@variscout/core" mock`) as pre-existing, citing a stash-based before/after comparison. Verification on main showed 38/38 passed there — the failure was actually caused by T2's new `useCanvasStore` + `useProjectStore` imports, which transitively pulled in `usePreferencesStore`, which reads `DEFAULT_TIME_LENS` at module init. The flat `vi.mock('@variscout/core', () => ({ ... }))` factory only returned the parser shims, so `usePreferencesStore` initialization crashed.

The implementer's mistake was natural: they likely ran the failing test in the worktree, stashed their changes, ran it again, saw it still fail, and concluded "pre-existing." But `git stash` doesn't unstage `node_modules` symlink state or the tsc / vite compilation cache, and the import graph a vi.mock test exercises is determined by the source files, not the working-tree diff. Stash-based comparison is unreliable for transitive-dependency failures.

**How to apply:**

- When a subagent claims a pre-existing failure, verify directly:
  - `git checkout main -- <test-file>` (briefly — careful) OR run `pnpm --filter <pkg> test <test-name>` from a separate clone of `main`.
  - If the test passes on main but fails on your branch, the failure is yours regardless of where the diff "looks" attributable.
- Trust `git log` / `gh` — not stash round-trips — for pre-existing claims. If the failure pre-dates your branch, `git log -p -- <test-file>` should show the test's last edit + the test should fail on `git checkout <commit-before-yours>`.
- For Vitest tests that mock `@variscout/core` (or any other multi-export domain package), prefer the `vi.mock(import('@variscout/core'), async (importOriginal) => { const actual = await importOriginal(); return { ...actual, ... } })` partial-mock pattern — it's robust against future transitive imports. See `feedback_vi_mock_import_original` for the pattern.
- Add to per-task implementer prompts: "If you flag any failure as pre-existing, the controller will verify on main; report this claim only if you have actively confirmed it."
