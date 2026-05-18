---
title: 'systemic-fixes-over-patching'
description: 'User pushes for architectural solutions rather than spot patches — validate approach by researching industry standards'
purpose: remember
tier: card
status: active
date: 2026-05-18
topic: [memory, feedback]
related: []
verified-against-commit: c6cf0f8c5
last-verified: 2026-05-18
source-hash: 43cac0188a8766ad
origin-session-id: bbce0a7a-08d3-438c-aa40-25890442fc69
---

> 🤖 **Generated mirror** of `~/.claude/memory/feedback_systemic_before_patching.md`. Edit there, not here. Card synced by `scripts/docs/sync-memory-cards.mjs`; re-run via `pnpm docs:rebuild` (Phase 3 A4).

When a bug reveals a pattern (e.g., NaN propagation in one formula), don't just fix the symptom — investigate systemically. User pushed back on both "just patch the formula" AND on backlogging related fixes.

**Why:** User has CTO-level architectural thinking. They asked "what would a CTO ask?" and "is there something even more structural?" — revealing that spot patches are unsatisfying. They also pushed to validate the approach against industry standards (R, NumPy, Minitab).

**How to apply:** When finding a bug, always ask: "Is this a one-off or a pattern?" If a pattern, research how mature systems solve it, propose the structural fix, and do it all now rather than creating tech debt tickets.

**Applies to tooling / dev-loop, not just product code.** During the 2026-05-13 hooks evaluation, the prompt was "evaluate the current hooks and checks etc." and the user redirected to *"what would world-class CTO do? evaluate holistically"*. The right answer was not "fix the slow check" but research the husky/lint-staged/trunk-based-dev baseline first, frame a tiered model (commit / push / CI), evaluate each gate's blast radius, then propose. Web-search industry baselines for dev-tooling questions the same way you'd verify stats methodology. See [[feedback_close_threads_to_done]] for the carry-to-done preference that goes with this framing.
