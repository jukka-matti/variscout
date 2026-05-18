---
title: 'implementer-long-bash-pitfall'
description: 'Implementer subagents get stuck on long-running bash commands (pr-ready-check, full pnpm test, builds). The Bash tool auto-backgrounds commands that exceed its 2-minute default. Brief implementers to skip slow PR-prep gates or use run_in_background explicitly.'
purpose: remember
tier: card
status: active
date: 2026-05-18
topic: [memory, feedback]
related: []
verified-against-commit: c6cf0f8c5
last-verified: 2026-05-18
source-hash: 7fd46ecc6d512d8b
origin-session-id: 13d849fb-ae7d-4093-90ea-a9bff40322cf
---

> 🤖 **Generated mirror** of `~/.claude/memory/feedback_implementer_long_bash_pitfall.md`. Edit there, not here. Card synced by `scripts/docs/sync-memory-cards.mjs`; re-run via `pnpm docs:rebuild` (Phase 3 A4).

When dispatching implementer subagents that need to run long verification commands (`pr-ready-check.sh`, `pnpm build`, full workspace `pnpm test`), the Bash tool's 2-minute default timeout auto-promotes long commands to background mode. The implementer subagent then can't get clean synchronous output and burns context re-checking task files, polling, and eventually getting stuck.

**Concrete failure mode (PR-WV1-3a Task 7, 2026-05-16):** the verification implementer dispatched to run the test sweep + `pnpm build` + `bash scripts/pr-ready-check.sh`. Each command auto-backgrounded. Subagent looped checking output files, re-running, and eventually was interrupted by the user. The controller-level Bash (with 600s timeout + targeted filters) finished the same verification cleanly in under 5 minutes.

**How to apply:**

- **Default rule for implementer subagent prompts:** if a task includes long-running verification (test sweep across multiple packages, full build, full pr-ready-check), instruct the implementer to scope to ONE package OR target a single filter that completes in <90 seconds. Save the "all packages + full pr-ready-check" sweep for the controller (the controller's Bash tool gets a longer effective timeout when explicitly set).
- **Alternative:** in the implementer's prompt, explicitly say "use `run_in_background: true` for `pnpm build` and wait for the completion notification before proceeding." This works but requires the implementer to handle the async completion flow correctly, which is fragile.
- **Best pattern:** the implementer commits per-task and runs per-task targeted tests (e.g., `pnpm --filter @variscout/core test -- specific-suite`). The full pre-PR sweep is the controller's responsibility at the end of the branch (or skip entirely + trust the per-task TDD pipeline + CI).
- **Don't ask implementer subagents to run `bash scripts/pr-ready-check.sh`** directly. That script does a full doc-graph walk (~4 minutes) plus dead-link check plus build. Per `feedback_check_prior_plans_first` + workflow-history: pr-ready-check at branch-end belongs to the controller OR to pre-commit hooks OR to CI — not to per-task implementers.

Companion: [[subagent-driven-default]] (Sonnet workhorses for ≥70% of dispatches), [[doc-validation-hooks]] (pre-commit hook coverage), [[ui-build-before-merge]] (build catches type-export gaps that per-package vitest misses).
