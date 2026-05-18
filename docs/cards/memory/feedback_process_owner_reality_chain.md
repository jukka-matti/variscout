---
title: 'Process-owner reality shapes chain UX'
description: 'Chain transitions (IP→Sustainment→Handoff) need 3-layer hybrid — per-card prerequisite + Hub-overview always-active + Survey-Inbox prompts — not pure prerequisite OR auto-promotion'
purpose: remember
tier: card
status: active
date: 2026-05-18
topic: [memory, feedback]
related: []
verified-against-commit: 6f51f080
last-verified: 2026-05-18
origin-session-id: 4dc98d7b-6a43-414c-8387-61555905cfc7
---

> 🤖 **Generated mirror** of `~/.claude/memory/feedback_process_owner_reality_chain.md`. Edit there, not here. Card synced by `scripts/docs/sync-memory-cards.mjs`; re-run via `pnpm docs:rebuild` (Phase 3 A4).

Multi-artifact lifecycle chains (e.g., Improvement Project → Sustainment → Handoff) **can't be designed as pure prerequisite-locked OR pure auto-promotion**. Real process owners are time-poor + forgetful + need ad-hoc creation. World-class answer: 3-layer hybrid.

**Why:** Per RPS V1 brainstorm 2026-05-09 — when asked "what would world class designer think?" the right answer wasn't any of the academic options:

- **Pure prerequisite-locked CTAs** (driver-led) — paternalistic; doesn't help process owners remember; gatekeeping.
- **Pure auto-promotion** (every closed IP auto-creates Sustainment + Handoff) — pollutes Hub with empty artifacts for trivial fixes; aggressive.
- **Pure ad-hoc** (no prerequisites; user creates whatever) — no help for forgetfulness; loses vision §5.3 chain semantics.

**Process-owner reality:**
- Time-poor: 30 min during cadence reviews (weekly/monthly), not all-day VariScout users
- Improvement work is non-linear: projects pause, priorities shift, quick fixes balloon
- Sustainment is the discipline that gets dropped (nobody enjoys monitoring for drift)
- Handoff is awkward (person-to-person ownership transfer often skipped)
- Most fixes don't need the formal chain (auto-creation pollutes Hub)
- Process owners want VariScout to PROMPT, not gatekeep

**The 3-layer hybrid:**

| Layer | Behavior | Concern addressed |
|---|---|---|
| **A. Canvas card drill-down** | CTAs prerequisite-locked per 8a's design (Sustainment locked without intervention; Handoff locked without sustainment confirmation) | Per-card UX: which response is appropriate for THIS card right now? |
| **B. Hub-overview entry points** | "+ New Sustainment" / "+ New Handoff" buttons always-active, NOT prerequisite-locked | Process-owner reality: ad-hoc creation needs (baseline monitoring, retrospective handoffs) |
| **C. Survey-Inbox prompts** | Hub-overview top digest shows "things needing attention" each cadence tick | Forgetfulness: process owner returns weekly/monthly and needs to be reminded |

**How to apply:**
- When designing chained-artifact lifecycles, don't pick a pure option.
- Define per-context entry points (per-card vs Hub-overview); each can have different prerequisite logic.
- Add a Survey/Inbox layer that aggregates "needs attention" prompts at the macro level.
- Concrete signals (e.g., `hasIntervention`, `sustainmentConfirmed`) feed BOTH the per-card prerequisite check AND the Inbox prompts — same logic, different rendering.
- Sustainment counter pattern: store + increment via dispatch on cadence tick; auto-fire confirmation after N consecutive on-target ticks; user can override.

Per RPS V1 D10: locked the 3-layer hybrid + concrete `hasIntervention = closed IP + selected idea + done action`; `sustainmentConfirmed = manual review OR N=4 ticks`.

Related:
- `feedback_no_gates_language` — prefer guidance / scaffolding / checkpoint over "gate"
- `feedback_world_class_critique` — bring opinionated craft critique
- `feedback_pwa_philosophy` — same analysis everywhere; guided frustration is pedagogy
