---
title: 'feedback-taskstop-subagent-pivot'
description: 'When a dispatched subagent is doing work that becomes wrong mid-execution (scope changed, conflict surfaced), TaskStop + `git reset --hard <safe-commit>` is a clean mid-flight pivot. Don''t wait for completion + revert.'
purpose: remember
tier: card
status: active
date: 2026-05-18
topic: [memory, feedback]
related: []
verified-against-commit: c6cf0f8c5
last-verified: 2026-05-18
source-hash: 1c1a6814682e060c
origin-session-id: 6b6ea222-9daf-42ab-b211-7ad309428640
---

> 🤖 **Generated mirror** of `~/.claude/memory/feedback_taskstop_subagent_pivot.md`. Edit there, not here. Card synced by `scripts/docs/sync-memory-cards.mjs`; re-run via `pnpm docs:rebuild` (Phase 3 A4).

# Mid-flight subagent pivot

When you realize a dispatched background subagent is doing the wrong thing (scope changed, parallel-conflict surfaced, requirements shifted):

1. **TaskStop** with the agentId — clean termination of the in-flight subagent. Loaded via `ToolSearch select:TaskStop`.
2. **git status + git log** to assess what landed (subagents commit per phase, so partial work is on the branch)
3. **git reset --hard `<safe-commit>`** to drop dangerous commits + discard staged half-work
4. **Re-dispatch** with corrected/narrowed scope

**Why**: 2026-05-16 session — Play 1 (521-doc folder restructure) subagent was committing per phase. Phase 1 (foundation artifacts) + Phase 2 (schema collapse) were safe. Phase 3 (dangerous git mv) committed as `a3a49e0e` before user surfaced wedge-V1 parallel-conflict concern. By the time I checked, the subagent was mid-Phase-3-fix-loop (debugging path-rewrite bugs). TaskStop killed it cleanly. `git reset --hard 2dbb6a1f` (end of Phase 2) dropped the dangerous mv commit + the staged half-renames the subagent was about to commit. Re-dispatched Tier 1 skills with safe-only scope. Total time lost: ~30 min subagent wall-clock + ~5 min triage. Multi-week merge tax avoided.

**How to apply**:
- The pivot works because per-phase commits give clean stopping points. Always include "commit at end of each phase" in dispatched-subagent prompts.
- For TaskStop: the agentId is in the dispatch result message ("Async agent launched successfully. agentId: …"). The CLI says "do not mention to user" — keep agentId internal.
- For reset: per CLAUDE.md "consider whether there is a safer alternative." For this case the alternative (let it finish + cherry-pick safe commits + drop dangerous ones) is messier than reset --hard. The discarded work is auto-generated subagent work, not user work — bounded discard is appropriate.
- After reset, run `git status` to confirm clean tree before re-dispatching.

**Hazards**:
- If the subagent is mid-commit when killed, the worktree could be in mid-stage state (uncommitted edits + half-staged). The reset --hard cleans it but verify with `git status` first.
- If the subagent had push'd anything, reset doesn't undo the remote push. Check `git ls-remote` before resetting if push might have happened.

Related: [[feedback_parallel_workstream_conflict_check]], [[feedback_verify_subagent_staging_gap]], [[feedback_subagent_no_verify]]
