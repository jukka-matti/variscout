---
title: 'Check shipped architectural decisions before treating spec defaults as canon'
description: 'Before locking a spec default for a UI surface, search the decision log for shipped supersessions, claimed real-estate, and locked patterns. Spec defaults written in isolation can quietly conflict with already-pinned architectural facts (e.g., the 2026-05-03 vision §5.3 "side-panel slides from right" default conflicted with C3 supersession of CoScout''s right-rail claim).'
purpose: remember
tier: card
status: active
date: 2026-05-18
topic: [memory, feedback]
related: []
verified-against-commit: 6f51f080
last-verified: 2026-05-18
origin-session-id: 503ee542-f216-48e3-9706-8b2aaf6de3ee
---

> 🤖 **Generated mirror** of `~/.claude/memory/feedback_check_shipped_patterns_first.md`. Edit there, not here. Card synced by `scripts/docs/sync-memory-cards.mjs`; re-run via `pnpm docs:rebuild` (Phase 3 A4).

**Rule.** Before evaluating or confirming a spec default for a UI surface, search `docs/decision-log.md` (especially §1 Replayed Decisions and §3 Named-Future) and the `feedback_*` memory entries for shipped patterns or pinned supersessions that the default might conflict with. Spec defaults written in a brainstorm session can quietly assume away architectural facts already locked elsewhere.

**Why:** In the 2026-05-03 §8 walk-through, the vision spec's §5.3 default ("side-panel attached to canvas... slides in from the right") directly contradicted a pinned 2026-04-29 decision-log entry: "Plan C3 (FRAME right-hand capability drawer) — superseded 2026-04-29 by FRAME thin-spot batch... CoScout monopolizes the right rail in EditorDashboardView and InvestigationWorkspace today; staking a non-CoScout claim on FRAME's right rail would force a redesign the moment CoScout is wired into FRAME." The spec author wrote the default without that constraint in view; if I had taken the default at face value I would have been about to ship a redesign-in-waiting.

A similar gap surfaced for Q1: the user reminded me of the shipped **pop-out window pattern** (`usePopoutChannel` + BroadcastChannel — three live consumers in `EvidenceMapWindow`, `FindingsWindow`, `ImprovementWindow`) — a real surface option the spec hadn't considered.

**How to apply:**

- **Before evaluating options for a UI default**, fan out via Explore agents to:
  1. `docs/decision-log.md` — every §1 Replayed Decision, every §3 Named-Future entry that touches the same surface (right rail, drill-down, popout, etc).
  2. `~/.claude/projects/.../memory/feedback_*.md` — feedback memories that pin behavior (e.g., `feedback_pwa_sw_no_prompt_mode` — PWA SW must stay autoUpdate, no prompt mode).
  3. The actual shipped components — grep for the surface area (right-rail, side-panel, popout) to see what's already claimed.
- **Treat spec defaults as proposals, not as canon.** Especially defaults that name UI primitives (slide-in panel, dropdown, modal). Verify the primitive doesn't conflict with shipped real-estate.
- **Watch for these specific VariScout shipped facts that often get assumed away:**
  - CoScout owns the right rail in Azure Analysis + Investigation (320–600px, resizable) — `feedback`-level constraint, not a default to override casually.
  - The pop-out pattern is real and shipped (`usePopoutChannel` + BroadcastChannel).
  - PWA SW = autoUpdate + skipWaiting (per ADR-075, locked); never go to prompt-mode.
  - Mobile drill-down = bottom sheets today (`EvidenceMapNodeSheet`, `MobileCategorySheet`).
  - Constitution P8: no CoScout in the free PWA tier. Spec features that assume CoScout is present need a PWA-tier fallback.
  - ADR-073 / ADR-074: structural absence rules — no aggregation primitives across heterogeneous specs / contexts.
- **When a spec default is overridden because it conflicted with a shipped pattern, log the rationale in the spec rewrite** (the override note) and in the decision-log entry — so the next session re-reading the spec sees why the change happened, not just that it changed.

**Operationally:** the heuristic is "if a spec writes a UI default in passive voice ('a panel slides in from the right'), it probably wasn't checked against existing real-estate." Active voice with cited prior decisions ('drill-down sits in a floating overlay because the right rail is claimed by CoScout per decision-log §1 C3 supersession') is the form to aim for after override.

**Linked memories:** `feedback_check_prior_plans_first` (read prior plans), `feedback_validate_architecture` (CTO review before multi-layer implementations), `feedback_design_aligned_fixes` (evaluate review fixes against the spec first). This entry is the architectural-fact-check complement.
