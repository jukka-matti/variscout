---
title: 'Interaction Language — Geometric Not Causal'
description: 'Interaction effects must use geometric language (ordinal/disordinal, gap changes, ranking flips) — never assign moderator/primary roles or causal direction'
purpose: remember
tier: card
status: active
date: 2026-05-18
topic: [memory, feedback]
related: []
verified-against-commit: 6f51f080
last-verified: 2026-05-18
---

> 🤖 **Generated mirror** of `~/.claude/memory/feedback_interaction_language.md`. Edit there, not here. Card synced by `scripts/docs/sync-memory-cards.mjs`; re-run via `pnpm docs:rebuild` (Phase 3 A4).

Interaction effect language must describe geometry, not mechanism. This was iteratively refined during the interaction effects brainstorming (Apr 7 2026) with Cobblebot flagging causal language leaks 4 times.

**Why:** VariScout analyzes observational data, not designed experiments. An interaction term tells you the cell means are non-additive — it does NOT tell you which factor moderates which. Assigning "moderator" and "primary" roles is a causal claim dressed as a statistical one. Even hedged language like "Temperature's effect estimate differs by Machine" implies directionality.

**How to apply:**

| Do | Don't |
|---|---|
| "The gap between Machine levels changes" | "Machine B is more sensitive to Temperature" |
| "The ranking reverses across Machine levels" | "Temperature helps on A but hurts on B" |
| "These factors don't behave independently" | "Machine moderates Temperature's effect" |
| ordinal / disordinal (geometric terms) | amplifying / dampening (mechanistic terms) |

Classification uses `'ordinal' | 'disordinal'` — both describe plot geometry, not process mechanism. The analyst supplies the "why" through gemba and expert knowledge.

Plot axis assignment (`plotXAxis`/`plotSeries`) is a **visualization convention**, explicitly labeled as such — not a causal claim. Continuous on x-axis because it makes readable slopes, not because it "drives" the other factor.

This extends the existing "contribution not causation" principle (see `feedback_contribution_not_causation.md`) specifically to interaction effects.
