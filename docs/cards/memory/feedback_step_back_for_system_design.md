---
title: 'Step back when piecewise design surfaces structural debt'
description: 'When brainstorming feature N reveals (via audit) that N''s primitives reference unresolved naming/layering/vision debt, pause and promote to system-level redesign'
purpose: remember
tier: card
status: active
date: 2026-05-18
topic: [memory, feedback]
related: []
verified-against-commit: c6cf0f8c5
last-verified: 2026-05-18
source-hash: 5f49fe09ee0675ab
origin-session-id: 4dc98d7b-6a43-414c-8387-61555905cfc7
---

> 🤖 **Generated mirror** of `~/.claude/memory/feedback_step_back_for_system_design.md`. Edit there, not here. Card synced by `scripts/docs/sync-memory-cards.mjs`; re-run via `pnpm docs:rebuild` (Phase 3 A4).

When brainstorming a single feature reveals (via codebase / vision-spec audit) that the feature's primitives reference UNRESOLVED structural debt — naming overlap, package-layering violation, vision UX gaps in adjacent surfaces, methodology misalignment — **pause the piecewise design and promote to a system-level redesign**. Don't ship the new feature on top of the structural debt.

**Why:** Per RPS V1 brainstorm 2026-05-09 — IP V1 was being designed standalone (8-section QC Story-shaped Charter form). Mid-brainstorm audit revealed:
- Investigation Wall vision had 4 UX gaps still open (mini-charts, brush-to-pin, 5th status, best-subsets-inline)
- Wall lived in `packages/charts/` (wrong package layer)
- Naming debt across 5 entity-ish names + 3 status enums for one investigation graph
- 5 response paths (vision §2.4) were being designed in isolation; chain transitions undesigned
- Cross-surface flows (IP↔Wall, IP→Sustainment→Handoff) undesigned

Designing IP V1 alone would have produced an artifact that didn't compose with paths 4+5 (Sustainment + Handoff) when they shipped later, would have inherited the Wall's UX debt, and would have ossified the naming overlap in another generation of types.

The user's instinct ("are we missing architectural coherence + E2E flow alignment?") was the right read.

**How to apply:**
- During brainstorming, audit the codebase + vision spec for the primitives the new feature touches.
- If you find structural debt (naming, layering, missing UX) that the new feature would compound, surface it explicitly: "this debt blocks shipping at world-class quality."
- Offer the user a clear choice: ship feature N on top of debt (faster, perpetuates debt), pause to address debt first (slower, cleaner foundation), or hybrid.
- Default recommendation: **system-level redesign** when the audit reveals 2+ pieces of structural debt that the new feature would compound. Per RPS V1: 4 Wall UX gaps + naming debt + Wall package layering + missing chain transitions = pause + promote.
- The system-level redesign output: a unified spec covering the original feature AND the structural concerns AND the cross-surface flows. Implementation slices into multiple PRs but the design is unified.

Related:
- `feedback_full_vision_spec` — spec the whole thing, plan sequences delivery
- `feedback_systemic_before_patching` — research industry standards, fix patterns not symptoms
- `feedback_validate_architecture` — CTO/AI expert review before multi-layer implementations
