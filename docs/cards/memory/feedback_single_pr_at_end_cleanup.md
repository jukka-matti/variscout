---
title: 'single-pr-at-end-cleanup'
description: 'For cleanup workstreams executing many small independent tasks via subagent-driven-development, the user may prefer one final PR with all commits on a single branch instead of per-task PR ceremony. Treat as a valid execution mode.'
purpose: remember
tier: card
status: active
date: 2026-05-18
topic: [memory, feedback]
related: []
verified-against-commit: c6cf0f8c5
last-verified: 2026-05-18
source-hash: 3d7745b8915bc921
origin-session-id: b2d446f3-2832-4671-8701-d919d7fc03c1
---

> 🤖 **Generated mirror** of `~/.claude/memory/feedback_single_pr_at_end_cleanup.md`. Edit there, not here. Card synced by `scripts/docs/sync-memory-cards.mjs`; re-run via `pnpm docs:rebuild` (Phase 3 A4).

`superpowers:subagent-driven-development`'s default flow assumes per-task PR ceremony (push + open PR + final code-reviewer + merge). For **cleanup workstreams** — sweeps of small, independent followup findings on the same branch — the user has explicitly asked for **single-PR-at-end mode**: commit each implementer's work directly to the followup branch, skip per-task PRs, push + open one PR after all tasks complete.

**Why:** Per-task PRs work well when each task ships independent value and benefits from isolated review. For cleanup workstreams (i18n + Dexie deletion + dead-code sweep + spec amend + Blob sync + UI polish), the tasks are correlated enough that a reviewer wants to see the whole sweep at once, and the per-task PR ceremony multiplies overhead (push, open, wait, merge, re-cut branch) without proportional value. The risk profile is also lower: each task is small, individually-tested, and the final PR's Opus reviewer pass catches anything cross-cutting.

**How to apply:**
1. When the plan is a cleanup workstream (many small findings, mostly independent), ask once: "single PR at end, or per-task PRs?" If unclear, default to per-task per skill docs.
2. If single-PR-at-end is chosen: cut the worktree once, dispatch implementers task-by-task with commit-after-each, skip the push+gh-pr-create ceremony per task, do a final consolidated verification + push + PR at the end.
3. Keep one reviewer per implementer dispatch — the skill's two-stage review (spec + quality) still applies per task. Just don't ceremonialize the PR layer.
4. Final PR body should enumerate every finding closed with reference to the investigations.md entry. Tag deferred items as out-of-scope.

Concrete precedent: 8f-followups workstream 2026-05-13/14 — 6 PRs of work compressed into PR #166 after the user said "we can do just one pr in the end? commit these tasks instead?" 23 commits, 19/20 findings closed.

Related: [[feedback_subagent_driven_default]] (workhorse pattern), [[feedback_slice_size_cap]] (cap slices at 6–8/PR — still applies for the FINAL PR's size sanity, not per-task ceremony), [[feedback_bundle_followups_pre_merge]] (bundle adjacent fixes into the same PR rather than opening followups).
