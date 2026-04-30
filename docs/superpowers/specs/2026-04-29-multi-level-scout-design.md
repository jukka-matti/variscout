---
title: Multi-level SCOUT — design
audience: [product, designer, engineer, analyst]
category: design-spec
status: delivered
date: 2026-04-29
last-reviewed: 2026-04-30
related:
  - process-learning-operating-model
  - investigation-scope-and-drill-semantics
  - process-hub-design
  - frame-process-map-design
  - production-line-glance
  - evidence-map
  - investigation-wall
  - knowledge-catalyst
---

# Multi-level SCOUT — design

## §1 Context

VariScout's methodology names three levels of process understanding (`docs/01-vision/methodology.md` lines 76-100, replayed in `docs/superpowers/specs/2026-04-27-process-learning-operating-model-design.md` §"The Three Levels", lines 152-279):

1. **System / outcome** — what the customer or business must experience.
2. **Flow / process model** — what flows through which steps, at what rate, with which waits, handoffs, and bottlenecks.
3. **Local mechanism / evidence** — the physics, recipe, equipment, material, operator, environment, subgrouping behind the flow.

Today, the four-lens SCOUT dashboard reads only Level 1. Level 2 (flow) lives in FRAME's river-styled SIPOC (`docs/superpowers/specs/2026-04-18-frame-process-map-design.md` §"Visual shape — river-styled SIPOC blend") and the just-shipped Hub Capability tab, delivered through Plans B/C/C1/C2 — PRs #103/#105/#106/#107, the production-line-glance dashboard primitive whose architecture is captured in `docs/superpowers/specs/2026-04-28-production-line-glance-design.md`. Level 3 (mechanism) lives in INVESTIGATE: SuspectedCause hubs (ADR-064), the Evidence Map (`docs/superpowers/specs/2026-04-05-evidence-map-design.md`, ADR-066), and the Investigation Wall (`docs/superpowers/specs/2026-04-19-investigation-wall-design.md`).

The level-spanning surfaces exist; the seams between them are still hand-walked. Analysts who want to move from "Cpk is off" (Level 1) through "which step is contributing?" (Level 2) to "is this the same SuspectedCause we saw three months ago?" (Level 3) context-switch surfaces and lose investigation thread continuity. Each surface owns its level; none lenses the others.

A second gap compounds the first: investigations are **frozen at creation time**. The `EvidenceSnapshot` type exists at `packages/core/src/evidenceSources.ts:43-51`, but no UI surface, no automation, and no refresh hook reads or writes it. When data flows in over time — hourly automated, daily upload, ad-hoc paste — there is no operator-visible "what changed since the last cadence." The methodology asks for cadence; the product offers single-shot.

The intended outcome of this spec is a level-spanning surface architecture that lets one investigation traverse all three levels, plus a temporal primitive (the timeline window) that makes data flow operationally simple — without inventing new charts, without altering the methodology, without violating the locality rule (ADR-073).

## §2 Three primitives

The design rests on three primitives. Two are extensions of existing infrastructure; the third is a new filter type that reuses the existing filter pipeline.

### A. Strategy + 4 slots — UNCHANGED

The existing strategy pattern at `packages/core/src/analysisStrategy.ts:51-160` stays exactly as it is. Six modes (Standard, Capability, Performance, Yamazumi, Defect, Process Flow), four chart slots each. The 4-slot rule documented in `.claude/skills/editing-analysis-modes/SKILL.md:92` is preserved. No new modes are added by this spec; no slot-count changes.

This is the load-bearing constraint that protects the design from sprawl. When SCOUT spans three levels, it does so by changing what data flows into the existing four chart slots, not by adding new ones.

### B. Timeline window — NEW filter type, reusing existing infrastructure

Every investigation gains a window over the parser-detected `timeColumn` (detection at `packages/core/src/parser/detection.ts:154`, time primitives at `packages/core/src/time.ts`). Four window types:

- **Fixed.** Both ends pinned (`2026-03-01 → 2026-03-31`). For incident analysis, post-mortem, before/after comparison.
- **Rolling.** Always-recent (`last 30 days, auto-shift`). For ongoing monitoring; the default for hub-time review at cadence.
- **Open-ended.** Start pinned, end = now (`2026-04-15 → today`). For an active investigation that started in the past and continues.
- **Cumulative.** All data. For long-running hub investigations or sustainment monitoring.

```typescript
type TimelineWindow =
  | { kind: 'fixed'; startISO: string; endISO: string }
  | { kind: 'rolling'; windowDays: number }
  | { kind: 'openEnded'; startISO: string }
  | { kind: 'cumulative' };
```

The window is persisted on the investigation. The exact attachment point (extending `ProcessContext` versus a sibling field on the investigation envelope) is flagged for review in §"Open in spec" — it interacts with `nodeMappings` placement (see `docs/superpowers/specs/2026-04-29-investigation-scope-and-drill-semantics-design.md` §2 lines 70-82) and should not be guessed here.

Application is via the **existing filter pipeline**: `FilterContextBar` plus `useFilteredData` (exported from `packages/hooks/src/index.ts:525`). The timeline picker is one more filter type, applied to `timeColumn` rather than to a stratifier column. The existing time-aware charts — `IChart`, `PerformanceIChart`, `CapabilityGapTrendChart` — already render time on the X axis; they receive window-filtered data. **Zero new chart components.**

### C. dataRouter — NEW per-strategy parameter

Each `AnalysisModeStrategy` (the interface at `packages/core/src/analysisStrategy.ts:34-49`) gains a `dataRouter` function that decides, for a given `(scope, phase, window, context)` quadruple, which hook supplies rows, which compute functions transform them, and which chart variant fills each slot.

```typescript
type RouterScope = 'b0' | 'b1' | 'b2';
type RouterPhase = 'investigation' | 'hub';

interface RouterArgs {
  scope: RouterScope;
  phase: RouterPhase;
  window: TimelineWindow;
  context: SpecLookupContext; // (node, contextTuple) — see scope spec §4
}

interface RouterDecision {
  hook: 'useFilteredData' | 'useProductionLineGlanceData' /* | … */;
  transforms: Array<(rows: DataRow[]) => unknown>;
  chartVariants: {
    slot1: ChartVariantId;
    slot2: ChartVariantId;
    slot3: ChartVariantId;
    slot4: ChartVariantId;
  };
}

interface AnalysisModeStrategy {
  // …existing fields
  dataRouter(args: RouterArgs): RouterDecision;
}
```

The hook returns window-filtered rows. The transforms compute level-appropriate metrics (see §3). The existing chart components consume already-shaped data and do not change. The dashboard becomes polymorphic across `(mode × scope × phase × window)` without new surfaces.

**Scope detection.** A new pure function `detectScope(investigation): 'b0' | 'b1' | 'b2'` mirrors the existing detector pattern (compare `detectYamazumiFormat` and `detectDefectFormat`). It reads `nodeMappings` cardinality per the rule in `docs/superpowers/specs/2026-04-29-investigation-scope-and-drill-semantics-design.md` §2 lines 86-92:

- `nodeMappings` empty or absent → `b0` (legacy, investigation-level specs).
- `nodeMappings.length > 1` → `b1` (multi-step).
- `nodeMappings.length === 1` → `b2` (single-step deep dive).

`detectScope` does not exist today; this design adds it. It lives in `packages/core/src/frame/` alongside `modeInference.ts` and `gapDetector.ts`.

## §3 Multi-level SCOUT model — surfaces as level-spanning lenses

Each surface keeps its primary level (its job-to-be-done) and gains lensed access to the other two by linking to the surface that owns each destination level. The boundary-keeping rule is in §4.

| Surface                | Primary level                                  | Lensed L1                                                       | Lensed L2                                                            | Lensed L3                                                                |
| ---------------------- | ---------------------------------------------- | --------------------------------------------------------------- | -------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| **SCOUT**              | L1 Outcome (4-lens dashboard)                  | (own)                                                           | Inline LayeredProcessView strip; click step to scope all four lenses | Right rail: SuspectedCauses + Evidence sources for current step / factor |
| **Hub Capability tab** | L2 Flow (LayeredProcessView + Operations band) | Click step → embedded SCOUT-mini for that step                  | (own)                                                                | Per-step badge: open SuspectedCauses → handoff to Investigation Wall     |
| **Evidence Map**       | L3 Mechanism (factor network)                  | Click factor → lensed L1 mini-distribution + deep-link to SCOUT | Tributary chips drill to L2 step view in Hub Capability tab          | (own)                                                                    |
| **Investigation Wall** | L3 Mechanism (hypothesis canvas)               | Hypothesis → lensed L1 supporting Findings' charts              | Hypothesis → lensed L2 step coverage                                 | (own)                                                                    |

The inline LayeredProcessView strip on SCOUT renders the same primitive shipped in PR #107 (Operations band). It does not duplicate the Hub Capability tab — it is a navigation strip that links into it.

The right-rail SuspectedCauses panel on SCOUT is read-only; promote-to-causal and AND/OR/NOT composition authoring stay in the Investigation Wall, which owns the L3 hypothesis canvas.

**Boundary-keeping rule.** Every cross-level click LINKS to the owner surface. No surface duplicates another's primary view; lensed views are mini panels that link out to the full owner. This keeps the surfaces orthogonal and prevents the "every surface becomes a dashboard" failure mode.

## §3.5 Metric layer integration

The codebase already organizes metrics by level. New metrics extend the same per-level module pattern. Existing metrics wire through `dataRouter.transforms[]` as-is; **no chart-layer changes anywhere**.

### Level 1 (Outcome) — existing metrics in `packages/core/src/stats/`

- `calculateStats` (basic.ts) — mean, σ, n, Cpk, Cp, Pp, Ppk
- `calculateBoxplotStats` (boxplot.ts) — 5-number summary
- `calculateConformance` (conformance.ts) — % within / out-of-spec
- `calculateMovingRangeSigma` (basic.ts) — control-limit estimation
- `calculateAnova` (anova.ts) — variance components, F, p, η²
- `computeBestSubsets` (bestSubsets.ts) — regression search (ADR-067)

No new L1 metrics required; existing coverage is sufficient.

### Level 2 (Flow) — existing metrics

- `calculateNodeCapability` (`stats/stepErrorAggregation.ts`) — per-(node × context) Cpk / Cp / σ. Plan A engine, PR #103.
- `calculateChannelStats`, `calculateChannelPerformance`, `calculateCapabilityControlLimits` (`performance.ts`) — multi-channel KPIs.
- `computeDefectRates` (`defect/transform.ts`) — defect rates per type / step / category.
- `aggregateYamazumiData`, `classifyYamazumi` (`yamazumi/aggregation.ts`, `classify.ts`) — cycle time and activity classification.

### Level 2 — new metric module `packages/core/src/throughput/`

The module mirrors the shape of `defect/` and `yamazumi/`: `types.ts`, `index.ts`, `aggregation.ts`, `__tests__/`. No imports of React or visx; pure TS per the package CLAUDE.md hard rule.

```typescript
function computeOutputRate(
  rows: DataRow[],
  timeColumn: string,
  nodeMappings: NodeMapping[],
  window: TimelineWindow,
  granularity: TimeGranularity
): OutputRateResult[]; // units per time bucket per step

function computeBottleneck(
  outputRates: OutputRateResult[],
  cycleTimes: CycleTimeResult[],
  window: TimelineWindow
): BottleneckResult[]; // step with longest queue / lowest rate

function computeCycleTime(
  rows: DataRow[],
  timeColumn: string,
  nodeMappings: NodeMapping[],
  window: TimelineWindow
): CycleTimeResult[]; // step-to-step elapsed time at hub-time

function computeFirstPassYield(
  rows: DataRow[],
  nodeMappings: NodeMapping[],
  defectMappings: DefectMapping[],
  window: TimelineWindow
): FPYResult[]; // good units / total per step

function computeRolledThroughputYield(fpyResults: FPYResult[]): number; // multiplicative across steps

function computeOEE(
  rows: DataRow[],
  timeColumn: string,
  nodeMappings: NodeMapping[],
  window: TimelineWindow
): OEEResult[]; // availability × performance × quality

function computeTaktTime(demand: number, availableTime: number): TaktResult; // customer demand rate

function computeLeadTime(
  rows: DataRow[],
  timeColumn: string,
  nodeMappings: NodeMapping[],
  window: TimelineWindow
): LeadTimeResult; // start-to-end elapsed

function computeWIP(
  rows: DataRow[],
  timeColumn: string,
  nodeMappings: NodeMapping[],
  window: TimelineWindow
): WIPResult[]; // work in progress per step
```

`computeCycleTime` is hub-time-anchored (start-to-end elapsed between step events) and is distinct from Yamazumi's activity-classification framing in `packages/core/src/yamazumi/`. Both names persist; both shapes are valid; the strategy's `dataRouter` decides which one applies for the current `(mode × phase)`.

### Level 3 (Mechanism) — existing metrics

- `computeHubContribution`, `computeHubEvidence`, `computeHubProjection` (`findings/helpers.ts`) — SuspectedCause hub aggregation.
- `computeRiskLevel` (`findings/types.ts`) — risk-axis combination.
- `computeEvidenceMapLayout` (`stats/evidenceMapLayout.ts`) — graph layout.

### Level 3 — new metrics

- `computeFindingWindowDrift(finding, currentWindowStats) → DriftResult` (new `findings/drift.ts`). Compares the Finding's recorded window stats versus the active window's stats; flags divergence beyond a configurable threshold. Lightweight; CoScout consumes it for the "want to re-check this finding?" prompt described in §7. The Finding type gains an optional recorded-window-stats field; values are populated when a Finding is pinned.
- `computeCrossInvestigationHypothesisFrequency(hub, window) → HypothesisFrequency[]` (new `findings/aggregate.ts`). Across hub investigations within window, counts which causes appear most often. Subject to ADR-073: this is a frequency count, not a stat aggregation across heterogeneous units. The function returns occurrence counts, not Cp/Cpk, η², or any combinable stat.

### Render targets for new metrics — all existing chart components

- Time-series rate plots → `IChart`.
- Per-step rate distributions → `Boxplot`.
- Bottleneck rankings → `ParetoChart`.
- FPY / RTY → existing `BoxplotStatsTable` / `CapabilityHistogram`.

**No new chart components are introduced by this spec.**

## §4 Boundary-keeping with FRAME / INVESTIGATE / IMPROVE

| Phase       | Owns                                        | What stays here                                                                                                                                                       | What multi-level SCOUT does NOT take                                                                              |
| ----------- | ------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| FRAME       | Scope-binding authoring                     | Column-mapping, spec authoring, `suggestNodeMappings`, USL/LSL data-range hints, type-integrity check, `processHubId` visibility (cross-phase chrome but starts here) | SCOUT does not duplicate FRAME's authoring inputs                                                                 |
| SCOUT       | L1 outcome reading + cross-level navigation | Four-lens dashboard, Findings, factor stratification, lensed L2 + L3 panels, timeline window picker                                                                   | Hypothesis case-building stays at INVESTIGATE                                                                     |
| INVESTIGATE | L3 mechanism / hypothesis case-building     | SuspectedCause hubs, Evidence Map, Investigation Wall, gemba evidence, Signal Cards, AND/OR/NOT condition gates, promote-to-causal                                    | INVESTIGATE does not redo SCOUT's outcome stats — it lenses them in                                               |
| IMPROVE     | Response paths (PDCA, Sustainment)          | What-If Explorer, action items, sustainment records, control plan                                                                                                     | SCOUT does not show response action; Hub Capability tab badges open SuspectedCauses but do not own response state |

The boundary discipline is the design's load-bearing constraint. Without it, "multi-level SCOUT" becomes "SCOUT ate FRAME and INVESTIGATE." Each surface owns its level. Cross-level lenses are read-only mini-panels that link out.

## §5 FRAME thin-spot helpers — fate

The four helpers from the C3 supersession (`docs/decision-log.md` §1, line 31) split honestly across phases now. The supersession resolved that CoScout monopolizes the FRAME right rail; the underlying need ("live capability feedback while mapping") split into surgical helpers rather than one drawer.

- **`processHubId` made visible** → **app chrome.** Cross-phase orientation; not FRAME-locked. Lives in the editor header / breadcrumb.
- **`suggestNodeMappings` surfaced in FRAME UI (not just hub-migration wizard)** → **stays in FRAME.** A rational-subgrouping affordance during column-mapping authoring; FRAME owns scope-binding.
- **USL/LSL data-range hint** → **stays in FRAME.** Anchored to spec input; the VoC ↔ VoP bridge (Two Voices, `docs/01-vision/methodology.md` §"Two Voices") is paid out at the moment the analyst types the spec.
- **Type-integrity check** → **stays in FRAME.** A hard error at FRAME blocks downstream stats from running on garbage; this is the right phase for a structural error.
- **Statistical-character signals** (sparse / variance / outliers) → **SCOUT boxplot annotations**, not FRAME badges. The boxplot already shows them; a FRAME badge would duplicate the read.

The four FRAME-resident helpers feed `detectScope()` at FRAME — when the analyst maps columns and enters specs, the system can reliably classify the investigation as B0 / B1 / B2 and bind it to the right hub. Scope detection at FRAME means the strategy's `dataRouter` has the answer it needs by the time SCOUT renders.

## §6 Relationship to Drill semantics + Plan D

The Drill A / B / C / Org-view framework is defined in `docs/superpowers/specs/2026-04-29-investigation-scope-and-drill-semantics-design.md` §3.

- **Drill A — Hub → Step.** Shipped via Plans B/C/C1/C2. The cross-surface navigation contract in §3 of this spec extends Drill A (Hub Capability step click → embedded SCOUT-mini) without altering the Drill A primitive.
- **Drill B — Step → Channels in Performance mode.** Already part of Performance mode's strategy entry at `packages/core/src/analysisStrategy.ts:96-116`. Unchanged.
- **Drill C V1 — Step → Sub-flow (recursive ProcessMap, max 1 level).** Named-future in `docs/decision-log.md` §3 line 82. This spec does not implement Drill C but is structurally compatible: a sub-flow drill becomes a SCOUT scope = sub-flow's nodes; the same `dataRouter` pattern applies.
- **Plan D / Org Hub-of-Hubs view.** Named-future in `docs/decision-log.md` §3 line 83. Cross-hub side-by-side surface; outside this spec; structurally compatible (Org view = each child hub computes locally with its own `dataRouter`; no cross-hub statistical aggregation per ADR-073).

## §7 Relationship to Knowledge Catalyst (ADR-049) + Investigation Wall + Evidence Map

ADR-049 (Knowledge Catalyst) names investigation-as-memory as a foundational direction for VariScout. Multi-level SCOUT aligns with that direction along three axes:

- **Findings persist with their window context.** Each Finding records the temporal slice it was made against. This is a small extension of the Finding type — an optional `recordedWindow: TimelineWindow` and `recordedWindowStats` field — that costs nothing when absent (B0 fallback) and pays out when present.
- **Window-aware re-check coaching.** `computeFindingWindowDrift` enables CoScout to surface the prompt "this finding's data picture has shifted; want to re-check?" when the active window's stats diverge from the recorded ones beyond threshold. Investigation memory becomes time-aware without becoming time-noisy: drift only triggers above threshold.
- **Hub-level memory across investigations.** `computeCrossInvestigationHypothesisFrequency` enables the cadence prompt "across our investigations on this process, suspected cause X appeared in 7 of 12 — is this a structural pattern?" The result is a frequency count, not a statistical aggregation; ADR-073 holds.

The Investigation Wall stays the L3 hypothesis canvas; the Evidence Map stays the L3 factor network. Multi-level SCOUT lenses both into other surfaces (e.g. SCOUT right rail) but does not duplicate them. The lensed panels are read-only; promote-to-causal and gate authoring stay in their owner surface.

## §8 Sequencing (delivery shape, not in-design phasing)

This is a delivery-shape recommendation. The design above describes the complete vision; the spec body does not phase its own contents. This section guides the implementation plan that follows.

- **First slice — architecture + window primitive + L2 throughput basics.**
  - `dataRouter` extension to `AnalysisModeStrategy`.
  - `TimelineWindow` types (fixed / rolling / open-ended / cumulative) + persistence.
  - `detectScope()` in `packages/core/src/frame/`.
  - Window-context recorded on Findings (passive footer field).
  - Hub-time default windows (rolling for cadence; cumulative for sustainment).
  - New `throughput/` module shipping `computeOutputRate` + `computeBottleneck`.
  - New `findings/drift.ts` shipping `computeFindingWindowDrift`.
  - Append-mode for re-upload (re-uses parser path; adds row-merge by timestamp + key columns).
  - `ProductionLineGlanceDashboard` refactored onto the strategy pattern via `dataRouter`.

- **Second slice — flow-KPI expansion + drift coaching.**
  - `computeCycleTime` (hub-time, distinct from Yamazumi's activity framing).
  - `computeFirstPassYield`.
  - `computeRolledThroughputYield`.
  - CoScout drift hint when finding-window stats diverge from current-window beyond threshold.
  - Cross-surface navigation refinement (badge-driven Wall handoff from Hub Capability tab).

- **Third slice — operational metrics + cross-investigation knowledge.**
  - `computeOEE`, `computeTaktTime`, `computeLeadTime`, `computeWIP`.
  - `computeCrossInvestigationHypothesisFrequency`.
  - Per-mode multi-level expansion: Yamazumi, Performance, Defect, Capability inheriting the pattern fully (Standard EDA leads in the first slice).

Each slice lands as its own PR series per `feedback_no_backcompat_clean_architecture.md`; subagent-driven dispatch per `feedback_subagent_driven_default.md`.

## §9 Out of scope (this spec)

- **Code changes** — design only; the implementation plan follows in its own session.
- **Drill C V1 (recursive ProcessMap navigation)** — already named-future in `docs/decision-log.md`.
- **Plan D / Org Hub-of-Hubs view** — already named-future.
- **Hub RBAC enforcement** — sibling design, separate ADR.
- **Server-side aggregation for performance at scale** — future ADR. Context in `docs/superpowers/specs/2026-04-27-process-learning-operating-model-design.md` lines 161-162.
- **Snapshot-driven investigation families as a separate persistence model** — collapsed into the timeline window primitive; no separate ADR needed.
- **Per-mode multi-level expansion to Yamazumi / Performance / Defect / Capability beyond Standard EDA** — third delivery slice.

## §10 References

### Methodology and operating model

- `docs/01-vision/methodology.md` — three-level methodology (lines 76-100), Two Voices (lines 274-284), Four Lenses (lines 288-299), Distribution-not-Aggregation principle (line 328).
- `docs/01-vision/eda-mental-model.md` — SCOUT loops (§3-4), three EDA levels within DMAIC (§5.2 lines 482-503).
- `docs/superpowers/specs/2026-04-27-process-learning-operating-model-design.md` — operating model, level definitions (lines 152-279).
- `docs/superpowers/specs/2026-04-27-product-method-roadmap-design.md` — H0–H4 horizons.

### Surface specs

- `docs/superpowers/specs/2026-04-29-investigation-scope-and-drill-semantics-design.md` — B0/B1/B2 scope (§2), Drill A/B/C and Org view (§3), specs and context model (§4), governance (§5).
- `docs/superpowers/specs/2026-04-25-process-hub-design.md` — hub workspace, Hub Capability tab.
- `docs/superpowers/specs/2026-04-19-investigation-wall-design.md` — L3 hypothesis canvas.
- `docs/superpowers/specs/2026-04-28-production-line-glance-design.md` — dashboard primitive (Plans B/C/C1/C2 architectural home).
- `docs/superpowers/specs/2026-04-28-production-line-glance-surface-wiring-design.md` — surface-wiring framing.
- `docs/superpowers/specs/2026-04-18-frame-process-map-design.md` — FRAME canonical-map.
- `docs/superpowers/specs/2026-04-05-evidence-map-design.md` — Evidence Map primary spec.

### Decision log

- `docs/decision-log.md` §1 line 31 — C3 supersession (FRAME thin-spot helpers).
- `docs/decision-log.md` §3 line 82 — Drill C V1 named-future.
- `docs/decision-log.md` §3 line 83 — Plan D / Org Hub-of-Hubs named-future.

### ADRs

- `docs/07-decisions/adr-049-coscout-context-and-memory.md` — Knowledge Catalyst, investigation-as-memory.
- `docs/07-decisions/adr-064-suspected-cause-hub-model.md` — SuspectedCause hub model.
- `docs/07-decisions/adr-066-evidence-map-investigation-center.md` — Evidence Map workspace center.
- `docs/07-decisions/adr-067-unified-glm-regression.md` — continuous regression engine.
- `docs/07-decisions/adr-070-frame-workspace.md` — FRAME workspace.
- `docs/07-decisions/adr-073-no-statistical-rollup-across-heterogeneous-units.md` — locality rule by structural absence.

### Code anchors

- `packages/core/src/analysisStrategy.ts:34-49` — `AnalysisModeStrategy` interface (extension target for `dataRouter`).
- `packages/core/src/analysisStrategy.ts:51-160` — strategy registry (six modes, four slots each).
- `packages/core/src/time.ts` — time-handling primitives (`parseTimeValue`, `extractTimeComponents`, `augmentWithTimeColumns`, `formatTimeBucket`, `TimeGranularity`).
- `packages/core/src/parser/detection.ts:154` — `timeColumn` detection (the column the timeline window is applied against).
- `packages/core/src/evidenceSources.ts:43-51` — `EvidenceSnapshot` type (exists; not yet wired to UI).
- `packages/core/src/frame/` — home for `detectScope()`, alongside existing `modeInference.ts` and `gapDetector.ts`.
- `packages/hooks/src/index.ts:499, 525` — `useProductionLineGlanceData` and `useFilteredData` exports (the hooks the `dataRouter` selects between).

### Skills and rules

- `.claude/skills/editing-analysis-modes/SKILL.md:92` — 4-slot rule and strategy-pattern conventions.
- `feedback_full_vision_spec.md` — design the whole vision; sequence delivery in plans (informs §8 sequencing layout).
- `feedback_no_gates_language.md` — language prohibition honored throughout (no "gate" framing).
- `feedback_contribution_not_causation.md` — EDA shows contribution, not proof; honored in §3.5 (frequency counts, not aggregations).
- `feedback_aggregation_heterogeneous_specs.md` — locality rule generalizes to any heterogeneity dimension; informs §3.5 cross-investigation hypothesis frequency rule.
- `feedback_no_backcompat_clean_architecture.md` — required-props-by-default discipline informs the `dataRouter` API shape.

## Open in spec — ambiguities flagged during drafting

The design summary instructed that these be captured rather than guessed. Each is bounded; none blocks the design's core claims.

1. **Where `TimelineWindow` attaches.** §2.B says "persisted on the investigation," with two candidate attachment points:
   - Extending `ProcessContext` (`packages/core/src/ai/types.ts:29-58`), alongside `processMap`, `factorRoles`, `suspectedCauses`. This co-locates window with the rest of FRAME-shaped context.
   - A sibling field on the investigation envelope (the wrapper around `ProcessContext`), alongside `nodeMappings` (introduced by `docs/superpowers/specs/2026-04-29-investigation-scope-and-drill-semantics-design.md` §2 lines 70-82).
     The brainstorm did not lock this. Resolution belongs in the implementation-plan session, where the exact persistence field can be checked against `nodeMappings` placement to keep the investigation envelope coherent.

2. **`SpecLookupContext` shape inside `RouterArgs`.** §2.C names `context: SpecLookupContext` without giving its concrete type. The scope-and-drill spec defines lookup keys as `Record<string, string | null>` (the `when` clause shape at `docs/superpowers/specs/2026-04-29-investigation-scope-and-drill-semantics-design.md` §4). Whether the router receives the resolved `SpecRule` directly or the lookup tuple plus a resolver function is a router-API decision deferred to implementation.

3. **`ChartVariantId` taxonomy.** §2.C uses `ChartVariantId` as the slot-fill type without enumerating the variant keys. The current `ChartSlotType` union at `packages/core/src/analysisStrategy.ts:18-32` lists 14 variants (ichart, capability-ichart, cpk-scatter, yamazumi-chart, boxplot, distribution-boxplot, yamazumi-ichart, pareto, cpk-pareto, yamazumi-pareto, stats, histogram, yamazumi-summary, defect-summary). Whether `ChartVariantId` is exactly `ChartSlotType` or a superset extending it for window-aware variants is an implementation-time question.

4. **Append-mode row-merge keys.** §8 first-slice mentions "append-mode for re-upload (re-uses parser path; adds row-merge by timestamp + key columns)." Which key columns are canonical (timeColumn alone? timeColumn + step + channel? user-declared keys?) is not locked. The brainstorm scoped this to "implementation can decide based on parser shape"; it is named here so the implementation plan picks it up explicitly rather than implicitly.

5. **Drift threshold defaults.** §3.5 / §7 introduce `computeFindingWindowDrift` with a "configurable threshold." The default value (e.g., 1σ shift in mean? 20% Cpk delta? a multivariate distance?) is a methodology question rather than a code question and is not in the brainstorm transcript. Sensible default belongs to the implementation plan plus a small CoScout coaching review.

6. **Default window per mode.** Hub-time review default is "rolling" per §2.B. Investigation-time default for first creation is unspecified — likely `cumulative` for B0 (legacy data with no recurring source) and `rolling` for B1/B2 inside a hub with recurring evidence. Worth confirming with a real B1 walk before locking.
