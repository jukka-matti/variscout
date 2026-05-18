---
title: 'Subagent-driven-development is the default implementation path (sequential, per-task 2-stage review)'
description: 'Execute implementation plans via the superpowers:subagent-driven-development skill — sequential implementer dispatches in ONE worktree per plan, with per-task spec-compliance + code-quality review pair, and a final code-reviewer pass at the end.'
purpose: remember
tier: card
status: active
date: 2026-05-18
topic: [memory, feedback]
related: []
verified-against-commit: c6cf0f8c5
last-verified: 2026-05-18
source-hash: 06675c1eafa71d17
origin-session-id: ce1c7399-5523-4447-b096-37f8fa8894ef
---

> 🤖 **Generated mirror** of `~/.claude/memory/feedback_subagent_driven_default.md`. Edit there, not here. Card synced by `scripts/docs/sync-memory-cards.mjs`; re-run via `pnpm docs:rebuild` (Phase 3 A4).

When `superpowers:writing-plans` produces an implementation plan, execute it via `superpowers:subagent-driven-development`. The skill prescribes a specific shape — follow it exactly. The temptation to "parallelize for speed" is wrong even when tasks look independent.

## The skill's prescription (authoritative)

Read it via `Skill superpowers:subagent-driven-development` if uncertain. Key rules:

1. **One worktree per PLAN** (not per task). `superpowers:using-git-worktrees` is listed as REQUIRED at the top of the skill. Set up the isolated workspace once before starting; all implementers work sequentially inside it.

2. **Sequential implementer dispatches — NEVER parallel.** The skill's red-flag list says verbatim: *"Never dispatch multiple implementation subagents in parallel (conflicts)."* This rule applies even when tasks touch non-overlapping files. Reasons: spec/code reviews need the previous task's results in scope; type/signature changes from earlier tasks must be visible to later implementers; TDD chain stabilises after each commit; failure debugging is dramatically easier with one change at a time; merge conflicts on shared docs (backlog checkboxes, USER-JOURNEYS) disappear.

3. **Per-task 2-stage review** — after each implementer reports DONE:
   - First: dispatch a **spec-compliance reviewer** subagent. Verifies the implementation matches the task spec; catches over-/under-building. Loop with implementer fixes until ✅.
   - Then: dispatch a **code-quality reviewer** subagent. Verifies clean code, hard rules, test coverage. Loop with implementer fixes until ✅.
   - Only then mark the task complete and dispatch the next implementer.

4. **Final code-reviewer at the end** of all tasks, against the whole branch diff vs main.

5. **Then** use `superpowers:finishing-a-development-branch` to merge/PR.

## Why "but tasks are independent" is a trap

Two failure modes I learned the hard way (2026-04-30, this repo):

- **Attempt 1**: 4 implementers in shared workdir → contamination disaster, agents stepping on each other's edits.
- **Attempt 2 (overcorrection)**: 3 implementers in 3 separate worktrees → still violated the skill's rule. The orchestration tax (per-task worktree create/dispatch/merge/conflict-resolve) ate the speed gain. Doc-line conflicts on `feature-backlog.md` checkboxes were the visible symptom of the deeper problem.

The skill chose sequential because it OPTIMISES the right thing: review quality and progress integrity, not wall-clock speed. The Anthropic-recommended cadence beats homegrown parallelism.

## How to apply (concrete steps)

1. Read the plan once. Extract every task's full text + context into your TodoWrite.
2. `git worktree add .worktrees/<plan-slug>` off the integration branch. Stay inside that worktree for the whole plan.
3. For each task in order:
   - Dispatch implementer subagent with full task spec, repo conventions (no `--no-verify`, no `Math.random`, `pnpm` test cmds, branch discipline), and required report format (status + commit SHA + test counts).
   - Wait for status: DONE / DONE_WITH_CONCERNS / NEEDS_CONTEXT / BLOCKED. Handle per skill's table.
   - Dispatch spec-compliance reviewer. Loop with implementer until ✅.
   - Dispatch code-quality reviewer. Loop with implementer until ✅.
   - Mark task complete in TodoWrite.
4. Final code-reviewer subagent against the full branch.
5. `superpowers:finishing-a-development-branch`.

## Override conditions

- User explicitly says "do this inline" / "don't dispatch subagents" — honor immediately.
- Task touches credentials, .env, secrets — keep in parent session for visibility.
- Task is exploration/research only (no code changes) — use `Explore` agent, not implementer.
- Trivially small task (single-line fix, one-file rename) — inline is fine, dispatch overhead exceeds the work.

## Model selection per role (right-size-per-task, no default quota)

The skill says "use the least powerful model that can handle each role." For VariScout that means **right-size every dispatch** — pick per task based on (a) judgment density, (b) integration breadth, and (c) reversibility of mistakes. There is **no Sonnet quota and no default**; the orchestrator picks per task.

**Why:** the prior "Sonnet workhorse / ≥70% Sonnet" framing pulled toward Sonnet as a comfortable default and (1) overspent on purely mechanical tasks (Haiku is plenty for `git rm` + one-barrel-line edits) and (2) understated when Opus actually earns its keep (multi-file integration, B-class ACL rewires, union-type cascades). The fix is to evaluate each task on its merits.

**How to apply:** before each dispatch, classify the task on three axes:
- **Judgment density** — does the implementer need to decide anything (e.g., "delete the conditional OR rewire to canAccess"), or is it pure text substitution?
- **Integration breadth** — 1 file vs 3–5 files (Sonnet) vs >10 files / cross-package / union cascade (Opus).
- **Reversibility** — is a wrong call cheap to detect (test fails / lint catches) or load-bearing (Final-branch review)?

| Role / task shape | Model | Why |
|---|---|---|
| Implementer — purely mechanical (1 file, full spec inline, `git rm` / barrel-line / rename / `grep`-then-delete) | **Haiku** | No judgment; mistakes caught by tests/lint immediately. |
| Implementer — standard well-specified TDD (1–3 files, clear spec, some test-update judgment) | **Sonnet** | Reliable on mechanical TDD; cheap. |
| Implementer — multi-file integration / B-class ACL rewires / union-type rename cascade / reachability decisions | **Opus** | Judgment-heavy + load-bearing — Sonnet mistakes here become spec/quality-review ping-pong that eats more time than the Opus premium. |
| Implementer — architecture-level / new ADR territory / cross-package primitives | **Opus** | — |
| Spec-compliance reviewer (read code, compare to spec) | **Sonnet** | Pattern-matching; Sonnet reliable. Match Opus if the implementer was Opus (cross-cutting refactor). |
| Code-quality reviewer (idioms, hard rules, test coverage) | **Sonnet** | Same as above; upgrade to Opus for cross-cutting refactors, security-sensitive code, or when reviewing a fix of a previous reviewer concern. |
| Final code-reviewer (whole-branch vs plan + ADR) | **Opus** | Last gate before PR; one place to always spend. |
| Brainstorming / design / writing-plans (parent session) | **Opus** | — |

If a session's tasks are mostly Opus, that's a signal the plan is under-specified, not a reason to downgrade. Tighten the spec first, then re-evaluate.

Pass `model: "sonnet"` / `"opus"` / `"haiku"` explicitly to `Agent` calls. Don't rely on the parent's model leaking down — it's the orchestrator's job to pick.

## What NOT to do

- Don't dispatch implementers in parallel. Even with worktrees. Even when "tasks don't overlap."
- Don't skip the per-task 2-stage review pair. Final code-reviewer doesn't replace it.
- Don't run code-quality review before spec-compliance review (wrong order — fix spec first, then polish).
- Don't make the implementer read the plan file — provide the full task text inline so the subagent has zero plan-file dependency.
- Don't mark a task complete with open review issues. Loop until both reviewers ✅.
