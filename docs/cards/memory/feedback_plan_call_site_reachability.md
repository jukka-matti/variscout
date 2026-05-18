---
title: 'Plans validate call-site reachability, not just types'
description: 'Before locking an implementation plan, verify the proposed integration target actually has the data the plan assumes is in scope. Trace data flow, not just type names.'
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

> 🤖 **Generated mirror** of `~/.claude/memory/feedback_plan_call_site_reachability.md`. Edit there, not here. Card synced by `scripts/docs/sync-memory-cards.mjs`; re-run via `pnpm docs:rebuild` (Phase 3 A4).

When a plan proposes mounting/wiring a feature into an existing component, verify upfront that the component actually has access to the data the plan assumes — by tracing the data flow at the call site, not just confirming the types exist.

**Why:** VariScout slice 4 (PR #125) hit two avoidable mid-flight pivots that one Explore dispatch each would've caught:

- **P3.6:** plan said "filter state on `investigation.metadata` (D13), mount in PWA + Azure FrameView." Type-level this validated. Reality: FrameView is a canonical-map authoring surface and has NO `ProcessHubInvestigation` in scope. Implementer improvised session-local `useState` and shipped DONE_WITH_CONCERNS. The chip rendering works only when state is set programmatically in tests; production state never roundtrips.

- **P0.1:** decision-log entry said "read `hub.evidenceSnapshots.at(-1)?.rowTimestampRange` in each paste wedge." Implementer added the field to `ProcessHub` (which lacked it) and the wiring became a no-op in production because nothing populated it. Spec reviewer caught it; took 3 commits to fix. One pre-plan grep would've shown only `ProcessHubRollup` had `evidenceSnapshots` — the active hub passed to wedges is `ProcessHub`-shaped, not Rollup.

Distinct from `feedback_plan_grounded_in_actual_types` (which is about FIELD NAMES). This is about RUNTIME DATA FLOW — does the consumer at the chosen mount point have the data in scope at the moment of use?

**How to apply:** During plan-writing Phase 3 (Review), dispatch a focused Explore for any task that mounts/wires into an existing component:
- "Does `<ComponentName>` have `<DataType>` in scope at the proposed call site? Trace from the entry point (App.tsx / Editor.tsx) to the component. If not, what nearby component does?"
- Read 2–3 caller files end-to-end. Type signatures lie about runtime reachability.

If the answer is "no," redirect the mount point in the plan, OR add a Partial-integration policy section (see `feedback_partial_integration_policy`) so the implementer doesn't improvise under pressure.

**Generalizes to:** any plan that wires through an app's existing scaffolding rather than building greenfield. Especially relevant when the plan was written from a brainstorm that assumed an idealized data flow.
