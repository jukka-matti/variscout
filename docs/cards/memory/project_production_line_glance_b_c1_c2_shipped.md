---
title: 'Production-Line-Glance B/C1/C2 shipped, C3 superseded'
description: 'Plan B (charts), C1 (data layer + Process Hub Capability tab), C2 (LayeredProcessView Operations band + progressive reveal) all merged on main. C3 (FRAME right-hand drawer) superseded 2026-04-29 by FRAME thin-spot batch.'
purpose: remember
tier: card
status: active
date: 2026-05-18
topic: [memory, project]
related: []
verified-against-commit: 6f51f080
last-verified: 2026-05-18
origin-session-id: a412b49d-bfc2-454e-8df2-92cccdd1be04
---

> 🤖 **Generated mirror** of `~/.claude/memory/project_production_line_glance_b_c1_c2_shipped.md`. Edit there, not here. Card synced by `scripts/docs/sync-memory-cards.mjs`; re-run via `pnpm docs:rebuild` (Phase 3 A4).

Plans A (engine), B (charts), C1 (data + Hub Capability tab), and C2 (LayeredProcessView Operations band) shipped sequentially via subagent-driven development between 2026-04-28 sessions. See `gh pr list --state all` for delivery state of each.

**C3 status (2026-04-29): superseded.** Originally scoped as a right-hand capability drawer in the FRAME workspace, C3 was killed because **CoScout monopolizes the right rail** in EditorDashboardView and InvestigationWorkspace; staking a non-CoScout claim on FRAME's right rail would force a redesign the moment CoScout is wired into FRAME (the FRAME-mode coaching prompt at `packages/core/src/ai/prompts/coScout/phases/frame.ts` already exists). The underlying need ("live capability feedback while mapping") is met instead by the **FRAME thin-spot batch**: per-column health badges, `suggestNodeMappings` surfaced in the FRAME UI (not just the hub-migration wizard), USL/LSL inputs gaining data-range context, and `processHubId` made visible. Any future capability-preview-during-FRAME-authoring would require a *fresh* scope (left rail? modal? slot in FRAME header?), not unblocking the C3 spec.

**How to apply:** When the user mentions "C3", "FRAME drawer", or "right-hand drawer", check `docs/decision-log.md` Replayed Decisions first — the decision is durable and should not be re-litigated. The amended spec `docs/superpowers/specs/2026-04-28-production-line-glance-surface-wiring-design.md` (§3 + ## Amendments) carries the supersession rationale. The surface-wiring trio is closed at C2.

## Final on-main state (commit chain on main after this session)

```
3a874bbb  feat: Plan C2 LayeredProcessView Operations band + progressive reveal (#107)
6ab346d6  feat: Plan C1 data layer + Process Hub Capability tab (#106)
e4a1774b  spec: production-line-glance surface wiring (Plan C)
680dc8ab  feat: production-line-glance charts (Plan B) (#105)
7b0ca143  feat(core): add observed-vs-expected unifying principle to CoScout role (#104)
00cc97f5  feat(core): production-line-glance engine layer (W1' foundation) (#103)
```

## Public API surface delivered

**`@variscout/core/stats`:**
- `calculateNodeCapability` (Plan A)
- `lookupSpecRule`, `ruleMatches`, `ruleSpecificity` (Plan A)
- `sampleConfidenceFor`, `SAMPLE_CONFIDENCE_THRESHOLDS` (Plan A)
- `isLegacyInvestigation`, `suggestNodeMappings(canonicalMap, datasetColumns)` (Plan A) — note: real signature differs from the modal-side `{nodeId, label, confidence}` interface; C1 hydrates labels from canonical-map node names and uses `confidence: 1.0` (the engine heuristic is binary).
- `distinctContextValues(rows, column): string[]` (C1) — sorted, deduped, capped at 50, null/empty excluded.
- `rollupStepErrors(input): { nodeId, label, errorCount }[]` (C1) — non-pass values per defect column per mapped node.

**`@variscout/charts`:**
- `CapabilityBoxplot`, `CapabilityGapTrendChart`, `StepErrorPareto` (Plan B) — each with `*Base` + responsive wrapper exports.
- `BOXPLOT_BAND_PADDING = 0.4` exported from `Boxplot.tsx` (Plan B T3 follow-up) so `CapabilityBoxplot`'s overlay scale stays in lock-step with the underlying box scale.

**`@variscout/hooks`:**
- `useProductionLineGlanceData(input): { cpkTrend, cpkGapTrend, capabilityNodes, errorSteps, availableContext, contextValueOptions }` (C1) — keystone slot-input projector.
- `useProductionLineGlanceFilter(): { value, onChange }` (C1) — URL `?<col>=<val>` state, `replaceState` semantics, `RESERVED_PARAMS = new Set(['ops'])` so C2's ops toggle isn't clobbered.
- `useB0InvestigationsInHub({ hubId, members }): { unmapped, count }` (C1) — drives the migration banner count.
- `useProductionLineGlanceOpsToggle(): { mode, setMode, toggle }` (C2) — URL `?ops=full` synchronizer, mirrors filter-hook pattern.

**`@variscout/ui`:**
- `ProductionLineGlanceDashboard` (Plan B) with `mode?: 'spatial' | 'full'` prop added in C2 — temporal row collapses via `max-h-0` transition; chart components never re-mount.
- `ProductionLineGlanceFilterStrip` (Plan B) — hub-level + tributary-grouped chip selector.
- `ProductionLineGlanceMigrationBanner` + `ProductionLineGlanceMigrationModal` (C1) — pure presentational; consumer owns persistence.
- `LayeredProcessView` extended with `operationsBandContent?` + `filterStripContent?` slot props (C2). When `operationsBandContent` is provided, tributary chips relocate to the Outcome band's "Mapped factors" subsection.
- `LayeredProcessViewWithCapability` (C2) — composition wrapper mounting the dashboard inside the Operations band slot with "Show/Hide temporal trends ↑↓" affordance.

**`apps/azure`:**
- `apps/azure/src/features/processHub/useHubProvision` (C1) — `ProcessHubRollup` → `{ hub, members, rowsByInvestigation }`.
- `apps/azure/src/features/processHub/useHubMigrationState` (C1) — composes B0 enumerator + modal entries (with `suggestNodeMappings` suggestions hydrated from canonical-map node names + binary 1.0 confidence) + persistence callbacks. `persistInvestigation` is required (no NOOP fallback per `feedback_no_backcompat_clean_architecture.md`).
- `apps/azure/src/components/ProcessHubView` (C1) — tab container ("Status" + "Capability"), wraps existing `ProcessHubReviewPanel`.
- `apps/azure/src/components/ProcessHubCapabilityTab` (C1) — composes the dashboard + filter strip in the Capability tab.
- `apps/azure/src/components/editor/FrameView` (C2) — replaces `<LayeredProcessView>` with `<LayeredProcessViewWithCapability>`, uses an empty preview rollup (live data = C3).
- `Dashboard.tsx` mounts `ProcessHubView` (replaces direct `ProcessHubReviewPanel`) and forwards `persistInvestigation` hooked into the existing `loadProject`/`saveProject` path.

**`apps/pwa`:**
- `apps/pwa/src/components/views/FrameView` (C2) — same composition as azure FrameView.

## Design invariants preserved across all four PRs (Watson safety)

- The engine has NO `meanCapability`, `aggregateCpk`, `sumCpk`, `portfolioCpk`, or `combineCpk` function. Verified by architectural test in `@variscout/core` (Plan A T11).
- `useProductionLineGlanceData.cpkTrend` and `cpkGapTrend` ship empty in C1 (per code review fix). Reason: computing them via `calculateStats` over per-node Cpks would aggregate Cp/Cpk across heterogeneous local processes — exactly the unsafe primitive Plan A's "structural absence" principle excludes. The dashboard renders empty top-row slots gracefully; the spatial row is methodologically safe (each node's Cpk visualized as its own distribution, never collapsed).
- Future engine work for the temporal row: a per-snapshot line-level Cp/Cpk source (probably the hub's outcome / line-level CTQ column). This is post-Plan-C engine work, not C3.

## Test counts at end of session

- `@variscout/core`: 2916 tests across 155 files (was 2903 baseline)
- `@variscout/hooks`: 1009 tests across 82 files (was 992 baseline)
- `@variscout/ui`: 1278 tests across 101 files (was 1246 baseline)
- `@variscout/charts`: 253 tests across 34 files (was 229 baseline)
- `@variscout/azure-app`: 970 tests across 72 files (was 955 baseline)
- `@variscout/pwa`: 124 tests (smoke test added)

## C3 status

**Superseded 2026-04-29 by FRAME thin-spot batch.** See `docs/decision-log.md` Replayed Decisions for the durable record. The amended surface-wiring spec marks §3 superseded with a `## Amendments` block. Do not re-propose C3 as currently scoped; any future capability-preview-during-FRAME-authoring needs a fresh scope.

## References

- **Canonical drill-semantics spec (added 2026-04-29)**: `docs/superpowers/specs/2026-04-29-investigation-scope-and-drill-semantics-design.md` — promotes the locked decisions from this work into a versioned spec. Drill A (this dashboard) is one of four navigation patterns; B1/B2 unified scope model defined; ADR-073 captures the no-aggregation policy at decision-record durability.
- Surface-wiring spec: `docs/superpowers/specs/2026-04-28-production-line-glance-surface-wiring-design.md`
- C1 plan: `docs/superpowers/plans/2026-04-28-production-line-glance-c1-data-and-hub-tab.md`
- C2 plan: `docs/superpowers/plans/2026-04-28-production-line-glance-c2-layered-view.md`
- Engine plan (Plan A, merged): `docs/superpowers/plans/2026-04-28-production-line-glance-engine.md`
- Charts plan (Plan B, merged): `docs/superpowers/plans/2026-04-28-production-line-glance-charts.md`
