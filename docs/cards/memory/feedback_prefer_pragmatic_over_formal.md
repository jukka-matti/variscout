---
title: 'prefer-pragmatic-over-formal'
description: 'When proposing verification ceremony (5x reruns, formal benchmarks, comprehensive plans, multi-step processes), explain the cost upfront and offer the shorter path that catches the actual risk. The user consistently picks lower-overhead paths; don''t make them ask.'
purpose: remember
tier: card
status: active
date: 2026-05-28
topic: [memory, feedback]
related: []
verified-against-commit: ca45f469
last-verified: 2026-05-28
source-hash: f142cf852832e245
origin-session-id: 85311cf8-0c99-4970-931f-5c1424d24b9e
---

> 🤖 **Generated mirror** of `~/.claude/memory/feedback_prefer_pragmatic_over_formal.md`. Edit there, not here. Card synced by `scripts/docs/sync-memory-cards.mjs`; re-run via `pnpm docs:rebuild` (Phase 3 A4).

**Rule**: when about to propose a process-heavy verification step (5x test reruns, formal benchmark harness with N×M×K measurements, multi-phase brainstorm, full-suite re-run after small change), pause and ask: "What's the actual risk this catches, and is there a 5-minute version that catches the same risk?" Then propose the 5-min version first, with the formal version as opt-in.

**Why**: VariScout's owner consistently prefers the minimum signal that catches the actual risk. Process overhead that doesn't proportionately reduce risk is friction.

**How to apply**:

- For test reruns: ask "what flake mechanism does 5x catch that 1x + pr-ready-check won't?" Often the answer is "none — pr-ready-check runs everything under turbo, which is where flakes actually manifest". Then 1x is enough.
- For benchmarks: ask "is the published evidence already strong?" If yes (e.g., Vitest's 2026 official docs recommending `threads` over `forks`), direct-apply + per-package isolated runs answers the meaningful question (does OUR suite tolerate it) faster than a formal harness re-proving published numbers.
- For multi-phase plans: ask "which phases are load-bearing for the decision, and which are 'we should be thorough' ceremony?" Cut the ceremony phases.
- When you DO propose a heavier process, explain the cost in concrete units (wall-clock, calendar time, decisions-deferred) so the user can make the tradeoff knowingly.

**Triggers seen in real sessions** (2026-05-25):
- User: "do we really have 20min testing??" — when I framed pr-ready-check as 20min vs actual 12-15min. Reset framing immediately.
- User: "do we need to apply step 3 5 times?" — when plan called for 5x reruns. Dropped to 1x + pr-ready-check.
- User: "do we really need all these benchmarks?" — when smoke bench took 4min/measurement vs estimated 30s. Killed bench, went direct-apply.

**Counter-cases** (when formal IS the right move):
- When industry evidence is weak or contradictory → benchmark
- When the change has wide blast radius (e.g., schema migration on data with real users) → multi-phase
- When the reviewer / future-self genuinely needs the rigor (audit trail, regulatory) → ceremony

The default leans pragmatic. Justify when going formal, not the reverse.

**Related**: [[investigate-failures-before-scoping-down]] (when to spend MORE time, not less — root-causing failures is high-leverage), [[systemic-fixes-over-patching]] (research industry standards, which often unlocks pragmatic paths), [[Bring world-class design critique, not neutral structure]] (opinionated critique includes pushback on ceremony).
