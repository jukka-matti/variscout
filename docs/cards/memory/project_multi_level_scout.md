---
title: 'Multi-level SCOUT design family'
description: 'Architecture decision for level-spanning SCOUT surface; timeline window as primitive; ADR-074 boundary policy; V1 first slice complete on feat/multi-level-scout-v1 (11 commits, awaiting PR review/merge)'
purpose: remember
tier: card
status: active
date: 2026-05-18
topic: [memory, project]
related: []
verified-against-commit: c6cf0f8c5
last-verified: 2026-05-18
source-hash: a03dd6cbdc913eaf
origin-session-id: 63e83e6f-6d7f-4518-9add-ab057c5c39d8
---

> 🤖 **Generated mirror** of `~/.claude/memory/project_multi_level_scout.md`. Edit there, not here. Card synced by `scripts/docs/sync-memory-cards.mjs`; re-run via `pnpm docs:rebuild` (Phase 3 A4).

# Multi-level SCOUT — design + V1 implementation

Lands the architectural reframe of how the dashboard spans the three methodology levels (System / Outcome — Flow / Process — Mechanism / Evidence). The brainstorm rejected several attractive-looking moves before converging.

## The design move (the durable architecture)

**Three primitives compose, methodology stays unchanged:**

1. **Strategy + 4 slots — UNCHANGED.** `resolveMode()` + `getStrategy()` at `packages/core/src/analysisStrategy.ts` stays exactly as it is. 4-slot rule preserved.
2. **Timeline window primitive — NEW filter type, reusing infrastructure.** Four window kinds: `fixed` / `rolling` / `openEnded` / `cumulative`. Applied via the existing filter pipeline (`useFilteredData` + `FilterContextBar`). Anchored to the parser-detected `timeColumn` and existing `time.ts` primitives. **Zero new chart components.**
3. **`AnalysisModeStrategy.dataRouter` — NEW per-strategy parameter.** Routes `(scope, phase, window, context)` to a hook + transforms + chart variants. Investigation phase → `useFilteredData`; hub phase → `useProductionLineGlanceData`. Polymorphic dashboard, same 4 slots.

**Surfaces become level-spanning lenses** (per ADR-074): each surface keeps its primary level (job-to-be-done) and gains lensed access to the others via links — never via reimplementation. SCOUT owns L1 outcome reading. Hub Capability tab owns L2 flow rendering. FRAME owns L2 authoring. Investigation Wall + Evidence Map split L3.

**Methodology preserved exactly:** positioning, constitution, FRAME→SCOUT→INVESTIGATE→IMPROVE spine, Watson's three Qs (scope now naturally includes time), ADR-073 (no roll-up), CoScout role, distributions-not-aggregates, VoC↔VoP, investigation-as-memory.

## What was rejected during the brainstorm

- **"Multi-level surfaces redesign"** — would have invented new surfaces; rejected because the codebase already organizes work by level, just not yet polymorphic on data source.
- **"Snapshot-driven investigation families as a separate persistence model"** — would have introduced new entities; collapsed into the timeline-window primitive (data flows; window selects).
- **"Cadence board as separate operator entry surface"** — folded into Hub Capability tab + timeline picker (default `rolling` matched to cadence).
- **Chart consolidation refactor** — IChart vs PerformanceIChart vs CapabilityGapTrendChart; Boxplot vs PerformanceBoxplot vs CapabilityBoxplot. Looks redundant but they handle fundamentally different data shapes (`BoxplotGroupData[]` vs `ChannelResult[]` vs `CapabilityBoxplotNode[]`). Forcing one component would create a discriminated-union mess. Specialized charts stay; the dataRouter picks which variant per (mode × phase) combination.

## Source artifacts

- **Spec:** `docs/superpowers/specs/2026-04-29-multi-level-scout-design.md` (status: `draft`; flips to `delivered` when V1 ships)
- **ADR:** `docs/07-decisions/adr-074-scout-level-spanning-surface-boundary-policy.md` (status: `accepted`) — boundary policy: each level has exactly one owner surface; structural-absence enforcement (mirrors ADR-073's pattern); verification via `scripts/check-level-boundaries.sh` (lands in V1 Task 15)
- **Implementation plan:** `docs/superpowers/plans/2026-04-29-multi-level-scout-v1.md` — 16 tasks for the first slice
- **Locked decisions:** `docs/superpowers/plans/2026-04-29-multi-level-scout-v1-decisions.md` — six "Open in spec" ambiguities resolved
- **Decision log entry:** ADR-074 in §1 Replayed Decisions; V1 implementation row in §4 Session Backlog; second-slice / third-slice metrics in §3 Named-Future

## V1 first slice — what's in scope

dataRouter extension; timeline window primitive; `detectScope()`; `mergeRows` for re-upload; `computeFindingWindowDrift`; `computeOutputRate` + `computeBottleneck`; `useTimelineWindow` + `useDataRouter` hooks; `TimelineWindowPicker` UI; FRAME thin-spot helpers' fate (`processHubId` → app chrome; `suggestNodeMappings` + USL/LSL hint + type-integrity → stay in FRAME; statistical-character → SCOUT boxplot annotations); `ProductionLineGlanceDashboard` refactored onto strategy + dataRouter pattern; ADR-074 boundary check script.

**V1 first slice complete on `feat/multi-level-scout-v1` (2026-04-30)** — see PR for delivery state. Two task specs were revised mid-execution and committed back into the plan file (Tasks 8, 13, 14):
- **Task 8 (`useTimelineWindow`)** — original Zustand-store-in-hooks design rejected; replaced with pure-projection hook over `ProcessHubInvestigationMetadata.timelineWindow`. Persistence is the caller's responsibility via `onChange` wired to the existing `persistInvestigation` flow (canonical pattern at `apps/azure/src/features/processHub/useHubMigrationState.ts:67-114`).
- **Task 13 (dashboard refactor)** — original `<strategy.chartSlots.slot1 />` interpretation impossible; `ChartSlots` carries `ChartSlotType` strings, not React components. V1 keeps `ProductionLineGlanceDashboard` hardcoded; routing happens at the call site (`ProcessHubCapabilityTab` consults `useDataRouter`). Slot-component registry is V2/V3.
- **Task 14 (app wiring)** — investigation Dashboards (Azure + PWA) don't receive a `ProcessHubInvestigation` envelope, so `useTimelineWindow` can't be used there in V1. Local `useState<TimelineWindow>` is the correct V1 fit; V2 makes the dashboards investigation-aware.

For V2: the three "do later" items above are the load-bearing follow-ups.

## V2 / V3 named-future

- **Second-slice metrics:** `computeCycleTime` (hub-time, distinct from Yamazumi); `computeFirstPassYield`; `computeRolledThroughputYield`; CoScout drift coaching when finding-window stats diverge from current-window.
- **Third-slice metrics:** `computeOEE`, `computeTaktTime`, `computeLeadTime`, `computeWIP`; `computeCrossInvestigationHypothesisFrequency` (cross-investigation knowledge memory). Per-mode multi-level expansion (Yamazumi / Performance / Defect inheriting the pattern).

## Supersession

- **FRAME thin-spot batch (Plan C3 supersession's four FRAME helpers, 2026-04-29 morning)** — DEFERRED behind the multi-level SCOUT design. The four helpers split honestly across phases by the new spec §5: `processHubId` becomes app chrome; the others stay FRAME-anchored or migrate to SCOUT. Check the design spec §5 before recommending the FRAME helper batch as next work — it's no longer the "recommended next" item.

## Cross-links

- ADR-073 (no roll-up across heterogeneous units) — same enforcement mechanism (structural absence)
- ADR-049 (Knowledge Catalyst, investigation-as-memory) — depends on this policy; drift detection feeds it
- `docs/superpowers/specs/2026-04-29-investigation-scope-and-drill-semantics-design.md` — defines B0/B1/B2 scope; `detectScope()` mirrors `detectYamazumiFormat()` / `detectDefectFormat()` patterns
- `docs/superpowers/specs/2026-04-25-process-hub-design.md` — Hub Capability tab is the L2-flow primary owner per ADR-074
