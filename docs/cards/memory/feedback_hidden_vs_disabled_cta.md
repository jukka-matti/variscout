---
title: 'Hide unwired CTAs; reserve disabled for unmet prerequisites'
description: 'When a CTA''s click handler isn''t wired yet, hide it entirely — don''t render a "Coming soon" disabled button. Reserve the disabled / locked state for the case where the handler exists but a concrete prerequisite isn''t met (workflow position, missing data). "Awaiting-impl as a UX state" is a feature-flag in disguise and erodes confidence.'
purpose: remember
tier: card
status: active
date: 2026-05-18
topic: [memory, feedback]
related: []
verified-against-commit: 6f51f080
last-verified: 2026-05-18
origin-session-id: 906cccde-0cd3-4d5a-bbda-f82a5855e4cc
---

> 🤖 **Generated mirror** of `~/.claude/memory/feedback_hidden_vs_disabled_cta.md`. Edit there, not here. Card synced by `scripts/docs/sync-memory-cards.mjs`; re-run via `pnpm docs:rebuild` (Phase 3 A4).

When designing CTA states for a button that might be unfinished, tier-gated, prerequisite-gated, or in flux: separate "the handler isn't wired" (hide) from "the handler exists but the user can't use it right now" (disabled with concrete reason). Don't conflate them into a single "Coming soon" disabled state.

**Why:** PR8-8a's original plan proposed a 4-state machine for canvas response-path CTAs: `active` / `tier-locked` / `hub-immature` / `awaiting-impl`. The amendment review caught that `awaiting-impl` was a feature-flag-disguised-as-UX-state — it meant "the engineer hasn't wired this yet, but here's a button anyway." Showing "Coming soon" buttons to users who have met every prerequisite erodes confidence in the rest of the surface ("what else is fake?"). It also hides the build state in the user's view rather than the engineer's view, where it belongs.

The amendment collapsed the 4 states to: `active` (handler wired + prerequisites met) | `prerequisite-locked` (handler wired + prerequisites unmet, with a specific actionable reason like "Available after you've implemented a process change") | `hidden` (handler not wired — render nothing, don't tease the feature). The third state isn't "another CTA appearance" — it's literally `null`.

**How to apply:**

1. **Audit your CTA states for the "what is this state actually saying" test:**
   - "Use this feature now" → `active`.
   - "You can't use this yet, but you will be able to once X happens, and X is something you control or that the system communicates" → `prerequisite-locked` with concrete reason copy.
   - "The engineer hasn't built this part yet" → `hidden`. Not a CTA state. Render nothing.
   - "You'd need to upgrade your subscription" → that's tier-gating, a separate axis. Often belongs INSIDE the surface (per `feedback_tier_gate_inside_surface`), not on the entry CTA.
2. **The `hidden` state should be unreachable in production for shipping features.** If you're tempted to render `hidden` for a feature you're shipping, you have a wiring gap — fix the wiring or ship a stub destination (per `feedback_tier_gate_inside_surface` point 3) so `active` is reachable. `hidden` exists in the type system to make the state machine total, not as a runtime UX.
3. **Stub destinations bridge the "I want this CTA active even though the form isn't ready" gap.** Ship a one-paragraph placeholder view describing what the surface will do, route the CTA there, and hide the actual form behind a "future release" line. The CTA stays active; pedagogy continues; no fake "Coming soon" button.
4. **Disabled-with-reason copy must be specific and actionable.** "Available after you've implemented a process change to monitor" tells the user *what to do*. "Coming soon" is engineering language leaking out.

**Counter-case:** features that are GENUINELY in active development and the user expects to see progress (preview features, opt-in betas) — those are different. Use feature-flag UI explicitly ("Beta", "Preview"), not a disabled "Coming soon" CTA.

**Generalizes to:** any button / link / menu item / settings toggle that goes through phases of "not wired → wired but gated → wired and ready." The three-axis decomposition (handler exists / prerequisites met / tier ok) catches state-machine bugs early.

**See also:** `feedback_tier_gate_inside_surface` (tier gating is a separate axis); `feedback_no_backcompat_clean_architecture` (don't make CTA props optional with hidden defaults — that's the same anti-pattern in prop-shape form).
