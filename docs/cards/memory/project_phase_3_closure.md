---
title: 'Phase 3 closure (H1 finish + H2 launch)'
description: 'Phase 3 shipped 3 PRs 2026-04-27/28 — team notes (H1), full EvidenceSheet (V2 follow-up), General Evidence Source (H2 launch). All H1 capabilities complete; H2 first slice in.'
purpose: remember
tier: card
status: active
date: 2026-05-18
topic: [memory, project]
related: []
verified-against-commit: c6cf0f8c5
last-verified: 2026-05-18
source-hash: 1f9548ab51f532f4
origin-session-id: efb5d588-ee52-4005-996f-a8f1d0dca016
---

> 🤖 **Generated mirror** of `~/.claude/memory/project_phase_3_closure.md`. Edit there, not here. Card synced by `scripts/docs/sync-memory-cards.mjs`; re-run via `pnpm docs:rebuild` (Phase 3 A4).

Phase 3 of VariScout shipped 2026-04-27/28. Three PRs merged to main:

- **PR #100** (`86c29ca5`): team notes on state items (H1). New `ProcessStateNote` types in core + `ProcessHubInvestigationMetadata.stateNotes` field bridged via `ProcessContext.stateNotes` → `ProjectMetadata.stateNotes`. `ProcessHubCurrentStatePanel` takes 4th required `notes` contract (signaling callbacks; consumer renders drawer). `StateItemNotesDrawer` in apps/azure (4 kind buttons + textarea + save/cancel). Dashboard manages drawer state with in-flight guard + try/catch + `normalizeProcessHubId` filtering. Telemetry `process_hub.state_note_{added,edited,deleted}` no-PII per ADR-059. **Closes the last H1 capability** ("Team notes on state items: question / gemba finding / data gap / decision" — roadmap line 144).

- **PR #101** (`1f26fa35`): full EvidenceSheet rendering (V2 follow-up). Refactored `ProcessHubEvidenceContract` to split count from load (`countFor` sync + `loadFindingsFor` async + `onChipClick(item)` + `onFindingSelect(item, finding)`) — eliminates the synthetic-Finding cast from PR #99. New `EvidenceSheet` bottom-sheet component. Dashboard owns sheet state + async-loads via `useStorage().loadProject()` chain + race guard. Telemetry includes `evidenceCount` per spec. **Closes the V2 chip-to-finding half-loop**.

- **PR #102** (`f0aca331`): General Evidence Source for CSV/Excel (H2 launch). New `GENERIC_TABULAR_PROFILE` in `DATA_PROFILE_REGISTRY` (any tabular file with ≥1 numeric column; confidence enum scales with numeric ratio). `ProcessHubEvidencePanel` extended with multi-step wizard (idle → optional picker → mapping confirmation → cadence → save). Cadence selector uses 5 actual `EvidenceCadence` values (`manual|hourly|shiftly|daily|weekly` — NO `monthly`). Existing Agent Review Log quick-create flow preserved. Telemetry `process_hub.evidence_source_created` no-PII. **Launches H2 — first slice of Process Measurement System**.

**Implementation reality notes that mattered (documented in plan):**
1. `DataProfileDefinition` has single `label` field (not separate `name`+`description`); `confidence` is enum string `'high'|'medium'|'low'` (not number); `validate` returns `EvidenceValidationResult`.
2. `EvidenceCadence` enum has 5 values, no `monthly`.
3. `Finding` type has no `investigationId` field — caller pre-groups findings into `ReadonlyMap<investigationId, Finding[]>` for `linkFindingsToStateItems`.
4. Stale-write race condition in any load → mutate → save chain — use `isSavingNote`/`isSavingX` in-flight guard.

**Code-review findings caught and fixed during execution (~12 in total across 3 PRs):**
- Nested-button hard-rule violation (StateItemCard wrapper) — fixed by sibling-region restructure.
- a11y improvements (aria-pressed on kind buttons, aria-label on add-note, light-mode contrast pair).
- ADR-059 PII risks (telemetry `hubId` actually contained investigation ID — switched to `rollup.hub.id`; missing `evidenceCount` in `evidence_sheet_opened` payload).
- Math.random in tests / Math.random for client-side IDs (replaced with `crypto.randomUUID`).
- normalizeProcessHubId pattern violation in two filter sites.
- Dead WizardState variant (`detecting`) — removed.

**Test counts on main after Phase 3:**
- @variscout/core: ~2840 tests (+~14 net new across processStateNote + processEvidence + evidenceSources.generic)
- @variscout/ui: ~1239 tests (panel went from 25 → 27 with the contract refactor)
- @variscout/azure-app: ~955 tests (+~25 across StateItemNotesDrawer + EvidenceSheet + ProcessHubEvidencePanel.generic + Dashboard integration)

**Spec/plan refs:**
- Spec: `docs/superpowers/specs/2026-04-27-phase-3-h1-closure-h2-launch-design.md` (commit `9adaba0c`)
- Plan: `docs/superpowers/plans/2026-04-27-phase-3-h1-closure-h2-launch-plan.md` (commit `15f16480`)

**Future work documented in plan §"Out of scope":**
- Snapshot trend / Cp-Cpk gap card (H2 second slice per roadmap line 184)
- Recurring snapshot trigger / cadence enforcement (PR #3 stores cadence as metadata only)
- MSA editor surface (renders 'Planned' pill — H2 third slice)
- Editor honors `?intent=` and `?surface=` query params (small ~50 LOC follow-up)
- Hub-canonical ProcessMap (H3 — needs own brainstorm)
- Control-handoff revisit (user-flagged for own brainstorm)
- Profile config DSL (H2+ refinement)
