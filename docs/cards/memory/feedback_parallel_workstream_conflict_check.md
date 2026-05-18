---
title: 'feedback-parallel-workstream-conflict-check'
description: 'Before dispatching folder-restructure / decomposition / shared-aggregate edit work, check for active parallel writers (other worktrees, in-flight PRs). HIGH merge-conflict risk when concurrent writers touch same shared files.'
purpose: remember
tier: card
status: active
date: 2026-05-18
topic: [memory, feedback]
related: []
verified-against-commit: 6f51f080
last-verified: 2026-05-18
origin-session-id: 6b6ea222-9daf-42ab-b211-7ad309428640
---

> 🤖 **Generated mirror** of `~/.claude/memory/feedback_parallel_workstream_conflict_check.md`. Edit there, not here. Card synced by `scripts/docs/sync-memory-cards.mjs`; re-run via `pnpm docs:rebuild` (Phase 3 A4).

# Check for parallel writers before restructure

Before dispatching work that:
- moves/renames files (`git mv`)
- decomposes large files into many smaller ones
- consolidates content across files
- modifies shared aggregates (decision-log, MEMORY, investigations, root CLAUDE.md, AGENTS.md, llms.txt)

…fan out and check for active parallel writers FIRST:
- `git worktree list` — other worktrees on the same repo
- `gh pr list --state open` — in-flight PRs likely to touch the same files
- The user's open chat sessions / Codex tabs / other agent instances

If concurrent activity exists, split the work into:
- **safe-parallel subset**: new files only, scripts, new skills, additive frontmatter, anything in `.claude/` (if the other workstream is product code)
- **deferred subset**: the moves + consolidations + shared-aggregate edits

Wait for the parallel workstream to ship before the deferred subset, then land it in a focused burst.

**Why**: 2026-05-16 session — orchestrating the docs-strategy-2026 plan, dispatched Play 1 (521-doc git mv) without first checking that wedge V1 engineering was actively shipping PRs to main in parallel (PR-WV1-1 just merged, PR-WV1-2 next, 5-7 more to come over 3-4 weeks). User flagged the concern. Each wedge PR amends decision-log.md + adds ADRs + amends investigations.md; my folder restructure would have moved those same files to new paths → every wedge PR merge would conflict. Killed Play 1 subagent mid-flight via TaskStop (see [[feedback_taskstop_subagent_pivot]]); `git reset --hard` to end-of-Phase-2 (`2dbb6a1f`) dropped the dangerous `a3a49e0e` mv commit. Split Play 1 into 1a (safe foundation + schema, shipped in PR #184) + 1b (deferred). Avoided multi-week merge tax.

**How to apply**:
1. Before brainstorming → writing-plans for any structural-change task, list shared files the work would touch.
2. For each shared file, check who else might touch it during the work window.
3. If conflict likely: explicitly scope the plan with "safe-parallel" vs "deferred" subsets. Deferred subset gets a trigger condition (e.g., "after wedge V1 ships" or "when origin/main has no in-flight PRs touching X").
4. The deferred subset can still have its sub-plan + spec written now — just don't dispatch implementation until the trigger fires.

**Counter-signal**: if no parallel workstreams exist (solo work, quiet repo), this caution doesn't apply. Direct push to main per repo CLAUDE.md "tooling/docs/config = fine" is still the convention.

Related: [[feedback_one_worktree_per_agent]], [[feedback_subagent_worktree_discipline]], [[feedback_taskstop_subagent_pivot]], [[project_docs_strategy_2026]]
