---
title: 'feedback-audit-findings-need-design-triage'
description: 'Audit findings that recommend "delete X" or "rename/refactor to match the other app''s pattern" need a design-triage step before becoming refactor PRs — code carrying intentional structure can read as drift when the spec under-specifies it'
purpose: remember
tier: card
status: active
date: 2026-05-28
topic: [memory, feedback]
related: []
verified-against-commit: ca45f469
last-verified: 2026-05-28
source-hash: 5710d4282f7f2765
origin-session-id: 99006d69-683b-44e8-a807-7a81fd9d2a53
---

> 🤖 **Generated mirror** of `~/.claude/memory/feedback_audit_findings_need_design_triage.md`. Edit there, not here. Card synced by `scripts/docs/sync-memory-cards.mjs`; re-run via `pnpm docs:rebuild` (Phase 3 A4).

Audit findings that recommend **deletion** or **alignment-to-the-other-app's-pattern** need a design-triage step before becoming refactor PRs. The "drift" may actually preserve intentional structure the canonical spec under-specifies.

**Why:** 2026-05-26 wedge-V1 user-journey audit (5 parallel lenses, 8 findings; see decision-log §1 2026-05-26 audit entry). Two of eight recommendations turned out to mask unresolved design questions:

- **Pareto / Analyze-tab lens-switcher (#3)** — finding read as "Azure omits Pareto from the lens switcher; copy PWA's conditional spread". User flagged it before I planned the fix. Real question turned out to be *"how do the Four Lenses surface in the Analyze tab — tabs, panels, mode-aware switching?"* — no canonical doc answers this. Both apps render Pareto; they differ only in switcher inclusion. Copying PWA's pattern to Azure would have locked in a UX decision the design hadn't made.
- **ControlHandoff retire (#4)** — finding read as "`ControlHandoff` type + `handoff-updated` event + `onStartHandoff` prop linger despite wedge 'Handoff folded into Sustainment'; rename/retire". Pre-plan grounding (5 min of code-reads) showed `ControlHandoff` is load-bearing: `selectSustainmentReviews`/`selectSustainmentBuckets` in `packages/core/src/sustainment.ts:328–349` consume it; `retainSustainmentReview` suppresses cadence-board entries; `ControlHandoffSurface` enumerates 9 operational systems (MES, SCADA, QMS, …) modelling *where control was handed off after project close*. The "Handoff folded into Sustainment" spec line was UI-only; the data model is intentional. Retiring it would have silently dropped operational-handoff semantics.

The audit's `Severity: cosmetic / functional gap / vision violation` classification was insufficient. There's a fourth category: **"surface symptom of an unresolved design question"** — same shape as drift, different remedy (design session, not refactor PR).

Companion to [[feedback_step_back_for_system_design]] (pause + promote when piecewise design surfaces structural debt), [[feedback_check_registry_placeholders_first]] (registry entries can be intentional V2 placeholders), [[feedback_audit_zero_callers_verify_scope]] (Explore audits compress reality — re-grep across packages/ AND apps/), and [[feedback_subagent_grounding_catches_drift]] (subagents reading actual source catch top-down audit mistakes).

**How to apply:** When any audit (journey-vs-code, feature-parity, lens-vs-lens, code-vs-spec) recommends **delete X** or **rename/copy to match Z**:

1. **Re-verify the evidence path is real.** Audit subagents have hallucinated file paths before (PR1's "Azure pinning is unwired" came from a non-existent `apps/azure-app/` path). Grep + read before planning.
2. **Read the entity/code's actual semantics.** What enum values does the type carry? What computational consumers? What lifecycle states? Where in `packages/core/` is it used in pure logic? An entity with 9 enum members, a lifecycle, and selectors that branch on its fields is not stale drift.
3. **Ask: does the canonical spec elaborate this enough to retire/refactor?** "Handoff folded into Sustainment" is one sentence — it doesn't specify what happens to `ControlHandoffSurface`, `retainSustainmentReview`, the operational-owner lifecycle. "Pareto is the FAILURE lens" doesn't specify switcher-tab vs side-panel placement. If the spec is silent on the structure being touched, the finding is a design question.
4. **Promote to a brainstorming session.** Log the finding's open questions in `docs/ephemeral/investigations.md` with a `STATUS YYYY-MM-DD — promoted to a design session` block. Create a task pointing at the future session. Don't open a refactor PR until the design is settled.

Pre-plan grounding (~5–10 min of targeted code-reads before writing the implementation plan) is cheap insurance against design-erasing refactors. The user's "I have a hunch we need to come back to this" instinct is a strong signal — trust it and grounding will usually confirm.

Carveout: the rule does NOT apply to (a) cleanup of objectively dead code with zero callers verified across all of `packages/*/src/` + `apps/*/src/`, (b) renames driven by lint/ESLint rules where the rule itself is the spec, (c) syntactic cleanups (formatting, ordering, import paths) with no semantic implications.
