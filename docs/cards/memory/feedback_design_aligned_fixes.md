---
title: 'Fix to match design, not patch symptoms'
description: 'When addressing code review findings, evaluate fixes against the written design intent (specs/ADRs/spec comments) before patching — not just whatever makes the reviewer comment go away.'
purpose: remember
tier: card
status: active
date: 2026-05-18
topic: [memory, feedback]
related: []
verified-against-commit: c6cf0f8c5
last-verified: 2026-05-18
source-hash: 867c4bd978a8d660
origin-session-id: 735256b7-0b83-49c5-b7fb-9407f6d02899
---

> 🤖 **Generated mirror** of `~/.claude/memory/feedback_design_aligned_fixes.md`. Edit there, not here. Card synced by `scripts/docs/sync-memory-cards.mjs`; re-run via `pnpm docs:rebuild` (Phase 3 A4).

# Design-aligned fixes over surface patches

When presented with a list of review blockers/concerns, user explicitly wants the evaluation and fix strategy to be grounded in the actual design spec — not the most surgical local change to silence the reviewer.

**Why:** On PR #76 (Investigation Wall) code review, 2026-04-24, user said: *"lets evaluate these so, that we fix them in a way that this thing works we have been designing and coding!"* For every blocker, the spec already stated the intended behavior; the "bugs" were implementation gaps, not design mistakes. The right fix for each was to read the spec and complete the implementation:
- Orphaned `pendingComments` queue → spec line 330: *"Posts queue in pendingComments[], flush on SSE reconnect"*. Fix was to wire the drain on `init`, not remove the queue.
- Bare English tagline → spec line 371 already included the full tagline as one catalog entry. Fix was to un-split, not decide whether to translate.
- Minimap viewport math → the code's own doc comment already stated the correct formula. Fix was to match the comment.

**How to apply:** When user hands over a review punch list:
1. Before proposing fixes, dispatch an Explore agent (or read directly) to check `docs/superpowers/specs/`, ADRs, and in-code doc comments for the intended behavior on each item.
2. Present each fix as "spec says X, code does Y, change code to X." Cite file:line for the design claim.
3. Flag design/spec contradictions if found — don't silently pick one.
4. Only if there's no design intent on record, propose options and ask.

This is distinct from "world-class critique" (`feedback_world_class_critique.md`), which is about unsolicited design opinions. This is specifically about fix evaluation: align with what was designed, not with what looks minimal.
