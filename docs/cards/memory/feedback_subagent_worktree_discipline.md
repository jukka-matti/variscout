---
title: 'Subagent worktree discipline (one worktree per plan, sequential dispatches)'
description: 'The official superpowers:subagent-driven-development skill prescribes ONE worktree for the whole plan + sequential implementer dispatches. Parallel implementers — even in separate worktrees — violate the skill and create real coordination tax.'
purpose: remember
tier: card
status: active
date: 2026-05-18
topic: [memory, feedback]
related: []
verified-against-commit: 6f51f080
last-verified: 2026-05-18
origin-session-id: 97eb0472-69b7-4d98-97b0-a8275489984f
---

> 🤖 **Generated mirror** of `~/.claude/memory/feedback_subagent_worktree_discipline.md`. Edit there, not here. Card synced by `scripts/docs/sync-memory-cards.mjs`; re-run via `pnpm docs:rebuild` (Phase 3 A4).

**The headline rule:** `superpowers:subagent-driven-development` requires `superpowers:using-git-worktrees` for ONE worktree per plan, then sequential implementer dispatches inside that worktree. The skill's red-flag list says verbatim *"Never dispatch multiple implementation subagents in parallel (conflicts)."* This applies even when tasks look independent — see `feedback_subagent_driven_default.md` for the full prescription and rationale.

## Why parallel-with-worktrees is still wrong

Tried it 2026-04-30 on the Cpk follow-ups (5 tasks, 3 dispatched in parallel via 3 separate worktrees off the same integration branch). Even with isolation, the coordination tax was real:

- **Doc-line merge conflicts** on `docs/10-development/feature-backlog.md` (each parallel task flipped a different checkbox; git's line-level diff still required orchestrator intervention to resolve).
- **Cross-task type drift** invisible to parallel implementers: when Task A changes a signature, Tasks B/C/E running in parallel can't know. Today the dependency was resolved by serializing A first, but with `K` parallel rounds the dependency analysis becomes its own engineering problem.
- **Lost the per-task 2-stage review** — running implementers in parallel makes per-task spec/code review impossible (no stable per-task moment to review against).
- **Failure debugging is harder** when 3 things changed at once and one breaks integration build.

Sequential dispatch sidesteps all of these. The wall-clock "speed gain" from parallelism was illusory once orchestration overhead is counted.

## Historical exception: when parallel + worktrees is unavoidable

Documented 2026-04-19 (Phase 7.2-14.1 wall feature, this repo) — `Agent({ isolation: "worktree" })` ran in true parallel for many independent UI tweaks. Two failure modes observed even then:

1. **Branch-name collisions.** Subagent named its branch `feature/wall-phase-12` while the umbrella branch was `feature/wall-phase-11`. Bash cwd inside a worktree → merges landed on the agent's branch, main branch didn't advance. Recovery: `cd` back to main repo, fast-forward.
2. **Main-repo path leakage.** Subagents Edit/Write at `/Users/.../VariScout_lite/packages/...` (main repo path) instead of their worktree. Self-recover via `git restore`, but stale uncommitted changes block subsequent merges. Agent flags it; orchestrator must remediate.

**Why those leak:** Main Bash session and all worktrees share the same `.git` dir; branch moves and checkouts are globally visible. Subagents can't see the orchestrator's branch context.

## If you must do parallel-with-worktrees (rare exception)

Reserve for cases where the official skill genuinely doesn't fit (e.g., user explicitly requests parallel for time-bounded multi-tenant migration). Then enforce:

- Every prompt: `CRITICAL: All edits must target paths inside your worktree directory <absolute path>. Do NOT write to /Users/.../VariScout_lite/packages/...`
- Branch naming convention up front: `Use branch name worktree-agent-<id>; do NOT shadow the umbrella branch (<umbrella-branch-name>).`
- Before merge: `cd` to main repo, `git branch --show-current`. Never trust cwd.
- After merge: `git status` for unexpected staged/unstaged changes from leaks; `git restore` if duplicates.
- After merging a branch that added deps: `pnpm install` in main repo (agent's `pnpm install` ran in worktree only).

## Default

Sequential implementer dispatches in a single plan-level worktree. Per the skill. Always start there; only deviate with explicit user direction.
