---
title: 'Verify subagent commit tree state, not just the report'
description: 'Subagents reporting DONE may have modified files locally without staging — controller must `git show <commit> --stat` + spot-grep before accepting completion'
purpose: remember
tier: card
status: active
date: 2026-05-18
topic: [memory, feedback]
related: []
verified-against-commit: c6cf0f8c5
last-verified: 2026-05-18
source-hash: 05113b140716f3d7
origin-session-id: 4e71d88a-bb6e-4929-b7a9-8a70adc06793
---

> 🤖 **Generated mirror** of `~/.claude/memory/feedback_subagent_staging_gap.md`. Edit there, not here. Card synced by `scripts/docs/sync-memory-cards.mjs`; re-run via `pnpm docs:rebuild` (Phase 3 A4).

When a subagent reports "modified file X" as part of a DONE handoff, verify the COMMIT actually contains that change — not just trust the report.

**Why:** F4 Task 6 implementer reported "Files modified (1): packages/stores/src/index.ts — removed lines 29-30 (improvementStore re-export)". Build + tests passed locally. But `git show <commit> --stat` showed only the 2 file deletions, NOT the index.ts change. The implementer's working tree had the edit (so local tests passed), but the modification was never staged. HEAD commit was broken — a clean checkout would fail to build because the deleted file was still being re-exported. Required a follow-up commit to repair the inconsistency.

**How to apply:**
- After every implementer DONE: run `git show <commit> --stat` and confirm the file list matches the implementer's report. Flag any "MODIFIED file X" claim absent from the stat output.
- Spot-check critical-path edits with `grep` against the working tree to confirm the commit's tree state actually has the change. Don't rely on tests passing — local working-tree state can mask a missing-stage bug.
- Implementer-prompt safeguard: explicitly require the implementer to run `git status -s` AFTER commit and report the (clean) output. Tasks 7-9 added this requirement and caught no further gaps.

The hazard is most likely when a task touches MULTIPLE files (some via Edit, some via git rm) — the implementer may run `git add` on a subset, miss one, and the commit silently lacks it.
