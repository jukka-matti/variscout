---
title: 'Engagement-profile RACI — Identity and Engagement Layers (Brainstorm)'
audience: [engineer, designer]
category: architecture
status: draft
related:
  [
    raci,
    multi-user,
    collaboration,
    frame,
    suspected-cause,
    investigation-workflow,
    adr-015,
    adr-037,
    adr-071,
  ]
---

# Engagement-profile RACI — Design (Brainstorm)

> **Status: brainstorm.** This document captures a paused 2026-04-25 brainstorm with the user (Six Sigma MBB). The full thinking history lives at `~/.claude/plans/i-realized-how-can-federated-breeze.md`. To advance to an approved design: validate the framework hasn't shifted, then promote `status` to `draft` and land the new ADR-071 alongside.

## Context

A Six Sigma Master Black Belt user asked how RACI (Responsible / Accountable / Consulted / Informed) thinking should integrate into VariScout. The conversation surfaced two intertwined product questions:

1. How should RACI live in VariScout's existing investigation lifecycle?
2. Does VariScout serve a _day-to-day operational_ use case (call-center QA, production-line monitoring), or only the _bounded improvement project_ use case?

This brainstorm answers those by distinguishing two product profiles, two design layers within the chosen profile, and a clean separation between the work proposed here and a future Control Plan spec.

The brainstorm was triggered by recognizing zero RACI footprint anywhere in code, docs, or ADRs — and by the user's instinct that ADR-015 (2024)'s rejection of multi-user collaboration features no longer matches product reality (Investigation Wall, FRAME, Azure tier with EasyAuth, audience-toggled exports).

## The two product profiles

| Profile        | Trigger               | People binding                       | Lifecycle |
| -------------- | --------------------- | ------------------------------------ | --------- |
| **Engagement** | Chartered             | Person-named ("Jane is Accountable") | Episodic  |
| **Operations** | Event-driven (signal) | Role-named with shift / rotation     | Recurring |

Today's VariScout is solidly Engagement-profile. Operations-profile use is feasible on the same EDA engine but requires distinct infrastructure (Control Plan, signal-spawned investigations, role-named accountability with shift rotation). **This brainstorm scopes the Engagement profile only.** The Operations bridge — particularly the Control Plan as the canonical Six Sigma artifact that hands the baton from project to operations — is deferred to a separate spec.

## Two layers within the Engagement profile

| Layer          | Answers                                              | Status today               |
| -------------- | ---------------------------------------------------- | -------------------------- |
| **Identity**   | Who is on the project, their role (RACI)             | Only `ActionItem.assignee` |
| **Engagement** | How they enter, what they see, what they're notified | Doesn't exist              |

Orthogonal but should be designed together. RACI without engagement = data the right people never see. Engagement without RACI = a notification framework with nothing meaningful to route.

## Identity layer — six Discovery anchors

The existing Issue → Problem journey (FRAME → SCOUT → INVESTIGATE → IMPROVE → VERIFY, per ADR-053 / ADR-064 / ADR-070 and the 2026-04-03 reframing spec) already has natural anchor points where ownership wants to live. **No new artifacts** — six optional fields on existing entities, fully optional per Constitution P2.

| Stage                 | Anchor                                                         | Reuse                         |
| --------------------- | -------------------------------------------------------------- | ----------------------------- |
| FRAME                 | `IssueStatement.sponsor`                                       | new field                     |
| FRAME                 | `ProcessMapNode.responsibleRole` (extends tributary semantics) | new field on FRAME node       |
| INVESTIGATE           | `Question.assignee` for gemba / expert validation              | reuse `FindingAssignee` shape |
| INVESTIGATE → IMPROVE | `SuspectedCause.status += 'pending-validation'` (Belt review)  | extend existing enum          |
| IMPROVE               | `ImprovementIdea.assignee`                                     | reuse `FindingAssignee` shape |
| VERIFY                | `FindingOutcome.verifiedBy`                                    | reuse `FindingAssignee` shape |

Constitution P2 governs: **optional, never blocks workflow**. PWA renders these read-only (single-analyst surface); the Azure tier enables editing for multi-user use.

## Engagement layer — events, not notifications

Five product personas with distinct engagement defaults:

| Persona                    | Default view on entry                        | Notification rhythm             |
| -------------------------- | -------------------------------------------- | ------------------------------- |
| Belt (R / Owner)           | Investigation workspace (today's default)    | Full activity, real-time        |
| Sponsor (A)                | Problem Statement + key findings + decisions | Milestone alerts, weekly digest |
| SME (C)                    | "Questions awaiting your input"              | Only when input is requested    |
| Stakeholder (I)            | Audience-toggled summary (read-only)         | Optional digest                 |
| Process Owner (Operations) | Control Plan + signal monitoring             | Out-of-control alerts (future)  |

### Architecture decision: events, not notifications

VariScout emits typed `EngagementEvent`s (assignment, validation request, decision point, gate, signal-fired) to a **customer-configurable webhook**. The customer routes via Teams webhook / Power Automate / Outlook rules / Slack — using infrastructure already present in their tenant.

**Rejected**: in-product invitations, in-product notification settings UI, email templates, required due dates. These would (a) duplicate the customer's comms stack, (b) accumulate communications data inside the app (clashing with ADR-059's customer-owned-data principle), and (c) inflate scope without proportional value.

This is a deliberate design constraint — see proposed ADR-071.

### Concrete shape

- `Investigation.team[]` — `{userId, displayName, role, defaultView}` populated from Azure AD via EasyAuth (no in-product invitation system).
- `EngagementEvent` typed event surface — emitted to a webhook configured per Azure tier instance.
- Per-role default views — navigation extension of ADR-037's audience toggle (today's per-export setting becomes a per-user navigation default).
- Webhook configuration UI — single endpoint, Azure-tier setting only.

## Proposed ADR-071 — Multi-user collaboration policy (supersedes ADR-015)

ADR-015 (2024) explicitly rejected heavy PM features (assignees, due dates, priorities, notifications) for VariScout's then-single-analyst PWA workflow. As of April 2026, the Azure tier supports multi-user collaboration via Investigation Wall (SSE comments, anonymous voting brainstorm), audience-toggled exports, and EasyAuth identity. ADR-015's absolute rejection no longer matches product reality.

ADR-071 ratifies:

- PWA stays single-analyst, offline-first. ADR-015's spirit governs there.
- Azure tier enables multi-user with **optional, progressive RACI metadata** (Constitution P2).
- "Events, not notifications" architecture (events emitted; customer routes externally).
- Per-role default views as the navigation extension of ADR-037.
- Out of scope for V1 and likely V-near: in-product invitations, notification settings UI, email templates, required due dates. ADR-015's "don't become a PM tool" spirit survives, reframed for multi-user reality.

Files affected when implementing:

- New: `docs/07-decisions/adr-071-multi-user-collaboration-policy.md`
- Update: ADR-015 frontmatter status → "Superseded by ADR-071"
- Update: `docs/01-vision/constitution.md` P2 example (refresh)
- Update: `docs/07-decisions/index.md` (add ADR-071)

## Phased implementation

| Phase | Scope                                                       | Surface     | Independence |
| ----- | ----------------------------------------------------------- | ----------- | ------------ |
| A     | Identity layer — 6 fields                                   | PWA + Azure | Standalone   |
| B     | Engagement structural — `Investigation.team[]` + role views | Azure-only  | Needs A      |
| C     | Engagement events — `EngagementEvent` + webhook config UI   | Azure-only  | Needs B      |

Each phase is independently shippable. Phase A serves significant value alone (identity fields are useful for analyst note-taking even pre-multi-user).

## What's deliberately deferred — Control Plan

The Operations-profile bridge artifact (Control Plan with role-named R/A/C/I per control row) is the natural follow-up. It's deferred because:

- Different profile (Operations, not Engagement)
- Different design language (per-row table, role-named, recurring)
- Different value timing (post-VERIFY sustainment artifact)

Future spec path: `docs/superpowers/specs/YYYY-MM-DD-control-plan-design.md`.

## Critical files (when implementing this spec)

- `packages/core/src/findings/types.ts` — `Question.assignee`, `SuspectedCause.status`, `ImprovementIdea.assignee`, `FindingOutcome.verifiedBy`
- `packages/core/src/frame/types.ts` — `ProcessMapNode.responsibleRole`; locate `IssueStatement` type and add `sponsor` field (confirm exact path during implementation)
- `apps/azure/src/auth/types.ts` — `Investigation.team[]` structure
- `apps/azure/src/engagement/` (new module) — `EngagementEvent` emission + webhook config
- `apps/azure/src/views/` — per-role default-view router

## Existing utilities to reuse

- `FindingAssignee` (`packages/core/src/findings/types.ts:125-132`) — assignee shape for all four assignee fields.
- `EasyAuthUser` (`apps/azure/src/auth/types.ts:17-22`) — `Investigation.team[]` identity anchor.
- ADR-037 audience toggle — extend to per-user navigation default.
- Investigation Wall SSE infrastructure — possible in-app event channel (TBD); webhook is the primary out.

## Verification approach

- **Type / build**: `pnpm build` passes; new types exported correctly across package boundaries.
- **Unit (vitest)**: serialization round-trip on each new field; `SuspectedCause` status transition test; PWA renders identity fields read-only (Constitution P2 enforcement).
- **Azure E2E** (`claude --chrome` with `pnpm --filter @variscout/azure-app dev`): create investigation; add Sponsor / SME / Stakeholder team members; confirm each role lands on the correct default view; trigger an assignment; confirm `EngagementEvent` emits to a test webhook.
- **Doc governance**: ADR-071 reviewed via the Apr 2026 process; spec linked from `docs/07-decisions/index.md`; Constitution P2 example refreshed; `pnpm docs:check` (or equivalent) green.

## Open questions for resume

- **Quality Council pattern** — chartered + role-named + recurring. Mature-enterprise pattern (e.g., council reviews open hubs every Tuesday). Is this in V1 or deferred to the Operations / Control Plan follow-up?
- **PWA single-analyst story** — confirm: PWA shows identity fields read-only, but should it allow self-assignment for personal note-taking?
- **Webhook config UX** — single endpoint or per-event-type routing?
- **Documentation drift** (separate cleanup, surfaced by the Explore): `constitution.md`, `USER-JOURNEYS.md` still use older "Problem Statement captures Watson's 3 Qs" language, inconsistent with ADR-053 + the 2026-04-03 spec. Not blocking RACI work but worth flagging.

## References

- ADR-015 (existing) — heavy PM rejection, 2024
- ADR-037 — audience toggle (technical vs non-technical share)
- ADR-053 — question-driven investigation + Apr 2026 amendment
- ADR-059 — customer-owned data, browser-based architecture
- ADR-061 — HMW brainstorm + ideation
- ADR-064 — SuspectedCause hub model
- ADR-070 — FRAME workspace
- `docs/01-vision/constitution.md` — P2 (optional, never blocks workflow)
- `docs/superpowers/specs/2026-04-03-investigation-workspace-reframing-design.md` — Issue → Problem journey foundation
- `docs/03-features/workflows/question-driven-investigation.md` — analyst-side workflow guide

## Resume notes

- **User pause signal at 2026-04-25**: "lets just save this plan somehow, i think we need to come back to this."
- **Full thinking history**: `~/.claude/plans/i-realized-how-can-federated-breeze.md`
- **To advance to draft**: confirm scope hasn't shifted; validate ADR-071 supersession with arch review; promote frontmatter status.
