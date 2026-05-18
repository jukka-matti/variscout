---
title: 'Full-vision spec, not V1/V2/V3 phasing'
description: 'User rejects MVP scoping in specs. Spec describes complete design; implementation plan sequences delivery.'
purpose: remember
tier: card
status: active
date: 2026-05-18
topic: [memory, feedback]
related: []
verified-against-commit: c6cf0f8c5
last-verified: 2026-05-18
source-hash: 115fe252ce240c3f
origin-session-id: 4795770b-7d21-4aff-8dc8-58d3458f8e0e
---

> 🤖 **Generated mirror** of `~/.claude/memory/feedback_full_vision_spec.md`. Edit there, not here. Card synced by `scripts/docs/sync-memory-cards.mjs`; re-run via `pnpm docs:rebuild` (Phase 3 A4).

Spec the full vision — don't hedge with V1 / V2 / V3 cuts in the design doc.

**Why:** User pushed back when I proposed a "walking skeleton V1 + follow-ups" scope for the Investigation Wall: *"do we need to separate v1 v2 and possibly 3, cant we design it the be as good as envisoned?"* Designers think in complete experiences. Watering the design down to fit an MVP mutilates the vision and creates "design-by-omission" (features missing, not rejected). The spec captures the full picture; the implementation plan decides the build sequence.

**How to apply:**
- In brainstorming, ship ONE spec that describes the whole thing.
- Use the spec's "Non-goals" section only for genuinely blocked items (external-dep gaps like live presence needing new collab infra, per-step Cpk needing `ProcessMap.nodes[].{lsl,usl,target}` schema extensions).
- Sequencing belongs in the plan (`docs/superpowers/plans/`), not the spec.
- When tempted to ask "should we defer X to V2?" — first ask whether X is truly blocked on something outside the spec's scope. If it's just "a lot of work," keep it in scope.
- The implementation plan can (and should) phase delivery with checkpoints. That's how we shipped the Wall — 14 phases, PR-per-phase-group.
