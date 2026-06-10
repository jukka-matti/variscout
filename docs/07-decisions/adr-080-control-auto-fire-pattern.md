---
tier: living
purpose: decide
title: 'ADR-080: Sustainment auto-fire + Inbox prompt + signoff-gated lifecycle pattern'
audience: human
category: architecture
status: superseded
superseded-by: docs/superpowers/specs/2026-06-10-control-closure-and-report-endstate-design.md
date: 2026-05-13
related:
  - adr-064-suspected-cause-hub-model
  - adr-070-frame-workspace
  - adr-078-pwa-azure-architecture-alignment
  - decision-log
layer: L5
---

# ADR-080: Sustainment auto-fire + Inbox prompt + signoff-gated lifecycle pattern

> **Superseded 2026-06-10 by [Control closure + Report end-state](../superpowers/specs/2026-06-10-control-closure-and-report-endstate-design.md).** The auto-fire/cadence/signoff pattern below is retained as historical context for RPS V1, but the shipped Control model is now analyst-owned data-driven sustainment: frozen baseline, widening re-check ladder, explicit `ControlReview` verdicts, no automatic verdict/status writes, and a closure checklist rather than a handoff status machine.

**Status**: Superseded

**Implementation status (added 2026-05-26):** the auto-fire dispatch pattern this ADR prescribes is **not yet implemented**. Sustainment records are currently written via the documented R13 exception in `packages/stores/CLAUDE.md` — direct `saveSustainmentRecordToIndexedDB` writes rather than HubAction → reducer co-located auto-fire. The user-visible Sustainment flow is functional (UI exists in both apps; see [feature-parity Sustainment rows](../08-products/feature-parity.md)), but the architectural pattern described below is aspirational until F5 lands. PWA Sustainment is session-only (does not round-trip through `.vrs`); Azure Sustainment is durable via the same R13 path. Surfaced by the 2026-05-26 user-journey audit (`docs/decision-log.md` §1 2026-05-26 entry).

**Amendment — 2026-05-16:** Extended by [ADR-082](adr-082-wedge-architecture.md). The Phase 6 / Sustainment-Control-Handoff design (formerly `docs/superpowers/specs/2026-04-26-phase-6-sustainment-control-handoff-design.md`, now archived) is **subsumed by this ADR's auto-fire pattern + the wedge spec §3.2 Sustainment stage**. Under the wedge: (a) Handoff is folded into Sustainment closure (no separate stage); (b) Sustainment auto-fires when Improve-stage actions complete or sustainment cadence triggers fire; (c) the closure screen is the single end-of-project decision moment ("did it work? + close"). The Phase 6 spec's lifecycle semantics (implicit start, asynchronous nudges, signoff-gated close) are preserved here; only its Hub-anchored multi-phase framing retires. Signoff is no longer tier-gated (single SKU); it is gated by **project-membership role** (Reviewer / Lead per wedge spec §4) — visible to all members; actively writable by Lead, signable by Reviewer.

## Context

RPS V1 (`docs/archive/specs/2026-05-09-response-path-system-v1-design.md`) ships five response paths off a single Process Hub: Quick Action, Wall Detective-pack, Improvement Project (Charter), Sustainment, Handoff. The last three share a lifecycle shape — the response is not a single user action but a multi-step process that:

1. **Starts implicitly** from an upstream state transition (e.g., Improvement Project enters Sustain phase) rather than an explicit "create" click,
2. **Surfaces follow-up nudges** asynchronously as conditions drift (drift-detection survey rules, time-since-last-check, evidence gaps),
3. **Closes on a tier-gated signoff** that is visible-with-lock for free tier (pedagogy + `.vrs` export) and active for paid tier (team collaboration per D9).

PR-RPS-9 implemented Sustainment as the first instance of this shape: `SUSTAINMENT_*` HubAction kinds, an auto-fire trigger when an Improvement Project transitions to Sustain, drift-detection rules feeding the Inbox digest surface, and sponsor-signoff lifecycle close. PR-RPS-10 followed the same shape for Handoff (`CONTROL_HANDOFF_*` kinds + signoff). The pattern will recur — audit-trail features, regulated-industry workflows, future response paths that the V2 named-future list calls for (`feedback_drop_methodology_bridges`).

Three temptations to anticipate when the pattern is re-applied:

- **Reinventing the auto-fire trigger** as a generic state-machine framework when each instance is in fact narrow (one upstream transition, one downstream entity).
- **Pushing nudges into modals** instead of Inbox digest, breaking the cadence-scan vs deep-work split (vision §5.6).
- **Tier-gating the entry CTA** instead of the signoff step, violating `feedback_tier_gate_inside_surface`.

## Decision

**Treat the Sustainment-shaped lifecycle as a recurring pattern, not a framework.** Future response-path lifecycles cite this ADR and re-implement the three primitives narrowly per instance:

1. **Auto-fire from upstream transition** — the upstream entity's status-change action (e.g., `IMPROVEMENT_PROJECT_UPDATE` to `phase: 'sustain'`) dispatches a sibling `<NEW_RESPONSE>_CREATE` action in the same reducer pass. No generic event bus, no subscription wiring. The two actions are conceptually one transition; co-locating them keeps reasoning local.

2. **Inbox digest as the only nudge surface** — drift / gap / cadence rules feed `surveyWallRules` (extended) and the Inbox digest list. Never modal pop-ups, never toast notifications. The user pulls nudges in their own cadence; the system never interrupts deep work. Mirrors the `MissingEvidencePanel` rule-driven shape from PR-RPS-4.

3. **Signoff as the tier gate** — the lifecycle close (`<NEW_RESPONSE>_SIGNOFF` action) is the tier-gated step. Free tier renders the signoff slot as visible-with-lock with concrete actionable copy (per `feedback_hidden_vs_disabled_cta`); paid tier renders it active with the sponsor-resolver + audit fields. The entry CTA and all authoring steps stay free-tier.

## Consequences

**Positive:**

- New response-path lifecycles get a known shape — implementers can read PR-RPS-9/10 and copy the three primitives, no framework learning curve.
- Tier-gate boundary stays consistent across response paths; users see a uniform free→paid escalation.
- Inbox digest accumulates nudges from multiple paths without surface fragmentation.

**Negative / accepted trade-offs:**

- Pattern is descriptive, not enforced — a future implementer can ignore it. Mitigated by code review citing this ADR.
- Auto-fire co-location couples two response paths' reducers in one switch case; refactor when a third path joins the same upstream transition (none anticipated).

**Out of scope for this ADR:**

- A generic state-machine library (YAGNI — three instances at write time, all narrow).
- Cross-Hub notification or external integrations (Slack/email digest) — V2 named-future per spec §14.
- Audit-trail / GxP compliance lifting — explicitly parked per RPS V1 D9 + F3.6-β decision.

## References

- RPS V1 spec [`docs/archive/specs/2026-05-09-response-path-system-v1-design.md`](../archive/specs/2026-05-09-response-path-system-v1-design.md) §D14 (five response paths), §D9 (tier gate at signoff).
- RPS V1 plan [`docs/archive/plans/2026-05-09-response-path-system-v1.md`](../archive/plans/2026-05-09-response-path-system-v1.md) §PR-RPS-9 ledger line 2231 (originating ask) + §PR-RPS-10 (Handoff applies the same shape).
- PR #154 (PR-RPS-9 Sustainment V1, squash `5f95e6fd`) — first instance.
- PR #155 (PR-RPS-10 Handoff V1, squash `12e1257b`) — second instance.
- Companion feedback memories: `feedback_tier_gate_inside_surface`, `feedback_hidden_vs_disabled_cta`, `feedback_drop_methodology_bridges`, `feedback_no_backcompat_clean_architecture`.
