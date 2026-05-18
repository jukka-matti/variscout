---
title: 'Contribution not causation'
description: 'Never use "root cause" in VariScout UI or specs — methodology is EDA contribution, not causal proof'
purpose: remember
tier: card
status: active
date: 2026-05-18
topic: [memory, feedback]
related: []
verified-against-commit: c6cf0f8c5
last-verified: 2026-05-18
source-hash: 600a1e487a755b51
---

> 🤖 **Generated mirror** of `~/.claude/memory/feedback_contribution_not_causation.md`. Edit there, not here. Card synced by `scripts/docs/sync-memory-cards.mjs`; re-run via `pnpm docs:rebuild` (Phase 3 A4).

Never use "root cause" in VariScout UI, specs, or descriptions. The methodology is explicitly "contribution, not causation" (Constitution principle 1, philosophy.md, methodology.md).

**Why:** VariScout identifies factors driving variation through EDA — it shows WHERE variation lives, not WHY. Causal links are the analyst's *hypotheses*, not confirmed causes. The tool guides investigation; it doesn't prove causation.

**How to apply:** Use "suspected cause", "upstream factor", "shared variation source" instead of "root cause", "shared root cause", "cause". When describing edge interactions, say "investigate what connects them" not "find the root cause." CausalLinkCreator creates hypotheses, not proven causes. The 5-Why questions guide investigation, not prove causation.
