---
title: 'master-plan-for-multi-subsystem-specs'
description: 'When a spec covers multiple subsystems (~6-8 PRs of work), writing-plans skill should produce a master sequencer + per-PR sub-plans, not one mega bite-sized plan'
purpose: remember
tier: card
status: active
date: 2026-05-18
topic: [memory, feedback]
related: []
verified-against-commit: 6f51f080
last-verified: 2026-05-18
origin-session-id: 22e9f4ed-cade-4c58-8dc1-da82ee14aa2e
---

> 🤖 **Generated mirror** of `~/.claude/memory/feedback_master_plan_for_multi_subsystem_specs.md`. Edit there, not here. Card synced by `scripts/docs/sync-memory-cards.mjs`; re-run via `pnpm docs:rebuild` (Phase 3 A4).

When a spec covers **multiple independent subsystems** (~6–8 PRs of work), invoking `superpowers:writing-plans` directly on the whole spec produces a 5000+ line document that nobody can navigate. The skill's "2–5-minute step granularity" is designed for one PR's worth of work, not 8.

**The right pattern:**

1. **Master plan first** — sequence the PRs at PR-level granularity (each task = roughly half a day of work). Document file structure, dependencies, verification approach, but NOT bite-sized steps. Save to `docs/superpowers/plans/<date>-<feature>-implementation.md`.

2. **Per-PR sub-plans** — invoke `superpowers:writing-plans` again with each PR's scope as input. Each sub-plan has the 2–5-minute steps with exact code, exact commands, exact commit messages. Save to `docs/superpowers/plans/<date>-pr-<id>-<name>.md`.

3. **Execute sub-plan via subagent-driven-development**, not the master plan directly.

**Why:** Bite-sized steps for 8 PRs = ~400 steps. That's a maintenance burden; updates to one PR's steps risk drift across the doc. Per-PR sub-plans are self-contained, can be amended independently, and match the lifecycle of one branch.

**How to apply:** The first round of writing-plans is the master sequencer. The output should include a "next step" pointer per PR: "Invoke `superpowers:writing-plans` again on this PR's scope to produce its bite-sized sub-plan." The recommended approach is sub-plan PR-N → execute PR-N → sub-plan PR-(N+1), not bulk-generate all sub-plans up front.

**Why how to apply:** Generating all sub-plans up front is wasted work if PR-N reveals a scope or sequencing change that affects PR-(N+1+...). Plan-as-you-execute is cheaper than plan-all-then-discover-drift.

**Canonical example:** wedge V1 (2026-05-16) — [[wedge-v1]]. Master plan at `docs/superpowers/plans/2026-05-16-wedge-implementation.md` sequences 6 PRs (PR-WV1-1 through PR-WV1-6); PR-WV1-1 sub-plan at `docs/superpowers/plans/2026-05-16-pr-wv1-1-project-membership.md` has the bite-sized steps.

**Scope-check signal:** if the spec lists ~6+ "engineering items" in its migration table (per wedge spec §6 shape), it's multi-subsystem. Produce a master sequencer.
