---
title: 'One worktree per parallel agent'
description: 'When a parallel agent (Codex, subagent, automation) is going to write to the repo, give it its OWN worktree. Sharing one checkout across agents causes branch shifts under each other, stash accumulation, and disappearing commits.'
purpose: remember
tier: card
status: active
date: 2026-05-18
topic: [memory, feedback]
related: []
verified-against-commit: c6cf0f8c5
last-verified: 2026-05-18
source-hash: c06e79ab0dcdf873
origin-session-id: 906cccde-0cd3-4d5a-bbda-f82a5855e4cc
---

> 🤖 **Generated mirror** of `~/.claude/memory/feedback_one_worktree_per_agent.md`. Edit there, not here. Card synced by `scripts/docs/sync-memory-cards.mjs`; re-run via `pnpm docs:rebuild` (Phase 3 A4).

When a parallel agent is going to write to the repo concurrently with the main session, it MUST operate in its own git worktree (separate path, separate branch checkout). Sharing one checkout across two agents is a footgun.

**Why:** During slice 4 follow-up work (2026-05-04), the main Claude Code session and a parallel Codex agent both operated on the same checkout at `/Users/jukka-mattiturtiainen/Projects/VariScout_lite`. While I was writing the Spec 2 design doc, Codex was rapid-fire shipping PR1+PR2+PR3 of the canvas migration on `codex/canvas-migration-phase-1-facade` then `codex/canvas-migration-pr1-pr3`. The collisions:

- Codex switched branches under my `git checkout main` mid-flight; my next commit landed on the wrong branch
- My `git stash push` of the Spec 2 file got mixed with Codex's PR3 work-in-progress; recovery took 5 stash entries
- Pre-commit hooks (lint-staged + docs:check) intermittently failed because the working-tree state didn't match what either agent expected
- A commit `1d4ed828` for the Spec 2 spec landed dangling (not on any branch's reachable history) because the branch-switch race meant the commit was left orphaned
- The Spec 2 file got created → wiped → recreated → wiped multiple times before it stuck

Recovery worked (Spec 2 is on main at `01de9177`; PR1+PR2+PR3 ready in PR #126), but the cycle cost was significant.

This is the failure mode `feedback_subagent_worktree_discipline` warned about ("parallel worktree agents can leak writes to main repo + create branch-name collisions"). Today made it concrete: it's not just *subagents* that need their own worktree — any **parallel agent process** that will write to the repo does. Codex specifically.

**How to apply:**

1. **Before kicking off a parallel agent (Codex, subagent, automation) that will write to the repo,** create a dedicated worktree for it:
   ```bash
   git worktree add .worktrees/<feature-branch> -b <feature-branch> origin/main
   ```
   Direct the agent to operate from that path. The agent's branch checkout is local to its worktree and never collides with the main session.

2. **The main session stays on `<repo-root>/`** typically on `main`. Used for design docs, ADRs, decision-log updates, brainstorming output — not for parallel feature-branch work.

3. **If you discover a parallel agent is already on the same checkout,** stop committing yourself; let it finish; THEN do your work. Don't try to interleave commits — the branch-switch race almost always loses.

4. **For Codex specifically:** AGENTS.md should make this explicit. The Codex Session Start section should include "create or attach to a worktree under `.worktrees/<branch>` before starting work."

5. **Verify worktree separation by command:** `git worktree list` should show one entry per concurrent agent. If two agents share a path, you have a problem.

This generalizes `feedback_subagent_worktree_discipline` from "parallel worktree agents" to **any parallel agent**. The "one worktree per parallel agent" rule has no exceptions for read/write workloads — only pure read-only sessions can safely share a checkout.

**Trade-off:** worktree setup overhead (~5 seconds + `pnpm install`). Compared to the recovery cost of a collision (5 stashes, dangling commits, hook flap), this is trivial.
