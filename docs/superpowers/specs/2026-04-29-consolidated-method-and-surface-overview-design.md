---
title: VariScout — Consolidated Method And Surface Overview
audience: [product, designer, engineer, analyst]
category: design-spec
status: review
related:
  [
    overview,
    user-journeys,
    decision-log,
    operating-model,
    product-method-roadmap,
    process-hub,
    investigation-scope-and-drill-semantics,
    production-line-glance,
    layered-process-view,
    eda-2,
    constitution,
  ]
date: 2026-04-29
---

# VariScout — Consolidated Method And Surface Overview

State-of-the-union snapshot for 2026-04-29. The spec is a periodic rollup, not
a living artifact: it links to the [decision log](../../decision-log.md) for
status that changes between sessions, and to the underlying ADRs / specs for
detail. A new visitor reading this end-to-end (≤25 minutes) plus the decision
log should be able to answer: _what is shipped, what is open or named-future,
what was decided about C3 and why, what is the methodological gap, and what
is the recommended sequence?_

## §1 One-breath synthesis

VariScout is a structured team improvement workspace where a team uploads
operational data, walks the FRAME → SCOUT → INVESTIGATE → IMPROVE journey
through six analysis modes (with question-driven EDA + three evidence types
— data, gemba, expert), inside a Process Hub that holds one production line /
queue / workflow over time, with the Hub feeding a Process Measurement System
that produces a Current Process State summary that triggers one of five
response paths (quick action / focused investigation / charter / sustainment /
handoff).

## §2 Operating model layer

Five orthogonal axes, one journey. Read top-to-bottom: the journey is the
spine; everything else is a lens that modifies how the spine is used.

```text
Journey (temporal)        FRAME ───── SCOUT ───── INVESTIGATE ───── IMPROVE
                                  ▲
Process-learning levels      ┌────┴────┐
(simultaneous lens)          │ Outcome │  ← Y / system / customer requirement
                             │  Flow   │  ← X / where loss concentrates
                             │  Local  │  ← x / mechanism, recipe, evidence
                             └────┬────┘
                                  ▼
Six analysis modes        Standard · Capability · Yamazumi · Performance · Defect · Process Flow
                                  │
Three evidence types         data │ gemba │ expert
                                  │
Three FRAME entry points     upfront hypothesis │ evidence-ranked from data │ observation-triggered
                                  │
Five response paths       quick action · focused investigation · charter · sustainment · handoff
```

| Axis                   | Cardinality | Source                                                                                                                                    |
| ---------------------- | ----------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| Process-learning level | 3           | `2026-04-27-process-learning-operating-model-design.md` (faithful rename of the existing Y / X / x EDA spine; `eda-mental-model.md` §5.2) |
| Response path          | 5           | `2026-04-27-process-learning-operating-model-design.md` §Operating And Problem-Solving Loops                                              |
| Analysis mode          | 6           | `analysisStrategy.ts`; `OVERVIEW.md` §The six analysis modes                                                                              |
| Evidence type          | 3           | Constitution P7; `methodology.md` Three validation types                                                                                  |
| FRAME entry point      | 3           | Constitution P5 (amended Apr 16); upfront hypothesis / evidence-ranked from data / observation-triggered                                  |

| Mode         | Status      | Notes                                                                |
| ------------ | ----------- | -------------------------------------------------------------------- |
| Standard     | shipped     | Default; I-Chart + Boxplot + Pareto + Stats panel                    |
| Capability   | shipped     | Cp/Cpk + subgroup capability (ADR-038)                               |
| Yamazumi     | shipped     | Lean activity-level cycle-time analysis                              |
| Performance  | shipped     | Multi-channel cavities / heads / nozzles                             |
| Defect       | shipped     | Events → rates via mode transform                                    |
| Process Flow | design-only | Spec at `2026-04-07-process-flow-analysis-mode-design.md`; not coded |

Mode resolution lives in `packages/core/src/analysisStrategy.ts`. CoScout
methodology coaching adapts per mode (W6 amendment to ADR-068 documents the
shift toward level-aware coaching alongside mode-aware).

## §3 Journey spine — surfaced

Each stage shows what the user does, the surfaces involved, where they live
in code, and which §7 surface-debt entries land at this stage.

### FRAME — name the concern, map evidence to a level

- **What the user does.** States the concern (data-first or hypothesis-first
  entry); maps the data shape to the canonical map; chooses entry path
  (upfront hypothesis / evidence-ranked / observation-triggered).
- **Surfaces.** `FrameView.tsx` (PWA: `apps/pwa/src/components/views/FrameView.tsx`;
  Azure: `apps/azure/src/components/editor/FrameView.tsx`), `ProcessMap`
  (`packages/ui/src/components/ProcessMap`), `ColumnMapping`, `SpecEditor`,
  `ProcessDescriptionField`. CoScout FRAME-mode coaching prompt at
  `packages/core/src/ai/prompts/coScout/phases/frame.ts` exists; FRAME wiring
  is on the roadmap.
- **App.** Both. (Azure adds canonical-map authoring + `processHubId`.)
- **Surface debt.** §7 item 1 (FRAME thin spots); §7 item 2 (B2 chrome walk).

### SCOUT — characterize the data, see the variation

- **What the user does.** Data is parsed (wide-form, stack columns, defect
  events); characteristic types are inferred; analysis modes surface
  variation, capability, flow, defect, or work-content patterns; first clues
  emerge.
- **Surfaces.** `Dashboard.tsx` (PWA + Azure), `LayeredProcessView` (three
  bands Outcome / Process Flow / Operations — `packages/ui/src/components/LayeredProcessView`),
  `ProductionLineGlanceDashboard` (`packages/ui/src/components/ProductionLineGlanceDashboard`),
  `ProcessHubView` + `ProcessHubCapabilityTab` + `ProcessHubCurrentStatePanel`
  (Azure-only), `ProcessHealthBar`, `NarrativeBar`, mode-specific sub-dashboards
  (`PerformanceDashboard`, `YamazumiDashboard`, defect import flow).
- **App.** Both for the dashboard primitive; Azure-only for Process Hub
  surfaces.
- **Surface debt.** §7 item 5 (Wall PR #76 status reconciliation); §7 item 7
  (Plan D / Org Hub-of-Hubs).

### INVESTIGATE — pick suspected causes, accumulate evidence

- **What the user does.** Picks suspected causes from Pareto ranks / Boxplot
  outliers / observations; explores Evidence Map edges; answers questions
  with data, gemba, or expert evidence; promotes converging hubs.
- **Surfaces.** `InvestigationWorkspace.tsx` + `InvestigationMapView.tsx`
  (Azure), `InvestigationView.tsx` (PWA), `EvidenceMap` (3-layer SVG —
  `packages/ui/src/components/EvidenceMap`), `WallCanvas` (Investigation Wall
  hypothesis-centric projection — `packages/ui/src/components/WallCanvas`),
  `FindingsPanel`, `FindingsLog`, `CausalLinkCreator`, `QuestionLinkPrompt`,
  `CapabilityCoachingPanel`, `CoScoutPanel` + `CoScoutInline`.
- **App.** Both for Evidence Map, Findings, and editor; Investigation Wall is
  Azure-only.
- **Surface debt.** §7 item 5 (Wall reconciliation).

### IMPROVE — converge to action, prioritize, verify

- **What the user does.** Hubs with strong evidence become HMW
  brainstorming starters; ideas are prioritized by timeframe / cost / risk /
  impact; selected ideas become action items; outcome compared to prediction
  via What-If Explorer; sustainment + handoff records.
- **Surfaces.** `ImprovementWindow.tsx` + `ImprovementPlan` + `ImprovementView.tsx`
  (PWA), `WhatIfPage.tsx` + `WhatIfExplorer` + `WhatIfSimulator`,
  `SustainmentRecordEditor` + `SustainmentReviewLogger` (Azure, unmounted v1)
  - `ControlHandoffEditor` (Azure, unmounted v1) + `ProcessHubSustainmentRegion`,
    `VerificationCard`, `ReportView` + `PresentationView`. HMW Brainstorm modal
    via SSE (ADR-061).
- **App.** Both for What-If + Improvement; Azure-only for Sustainment +
  Control Handoff.
- **Surface debt.** §7 item 3 (Phase 6 v2 / S5).

## §4 Process Hub layer

The Process Hub is the operating spine around the journey. It holds one
production line / queue / workflow / value stream over time and gives the
process owner one place to see what is being investigated, changed, owned,
verified, or sustained. See `2026-04-25-process-hub-design.md` for the full
model.

- **Hub model.** One Process Hub per recurring operational or development
  context (Line 4 sachet filling; claims queue; outpatient waiting time).
  Each hub has a process owner, a canonical ProcessMap, optional
  `contextColumns`, and a queue of investigations at quick / focused /
  chartered depth. The MVP stores one primary `processHubId` per
  investigation; Portfolio Investigation as a first-class cross-hub entity
  is named-future (decision log §Named-Future).
- **Evidence Sources, Snapshots, Data Profiles, Profile Applications.** The
  recurring evidence workflow: an Evidence Source belongs to a hub; each
  upload becomes a dated Snapshot; a Data Profile is the deterministic
  adapter behind a recognizable source-data shape; the Profile Application
  records the profile version + confirmed mapping for each Snapshot. See
  `2026-04-26-evidence-sources-data-profiles-design.md`.
- **Process Measurement System → Current Process State.** Stable measure
  definitions, Evidence Sources, Snapshots, Signal Cards, Survey readiness,
  subgroup logic, targets, and cadence rules combine into the latest
  structured read of the process across outcome / flow / known x-control /
  capability structure / trust. Current Process State is not a stable /
  unstable label; it is the cadence-review surface that triggers a response
  path.
- **Hub-of-Hubs (named-future).** Plant > Line > Station modeled as nested
  hubs, not as nested ProcessMaps. The plant hub renders child-hub cards
  side-by-side. Visual side-by-side only, never arithmetic. Designed in
  `2026-04-29-investigation-scope-and-drill-semantics-design.md` §6; not
  built. See decision log §Named-Future.
- **Customer-tenant ingestion + rollups (named-future).** Hourly or
  automated production-line data should land as immutable raw files in
  customer-tenant Blob Storage; a narrow customer-tenant ingestion processor
  writes Snapshot manifests + period rollups; Process Hub reads rollups
  first, raw only on drill-down. `2026-04-29-customer-tenant-ingestion-rollups-concept.md`.
- **Boundary.** Hubs **facet**, do not aggregate. The engine exposes no
  function that produces a single statistical metric across heterogeneous
  units. ADR-073 records the policy at decision-record durability;
  cross-hub views render side-by-side per-step distributions. `mean Cpk
across hubs` does not exist and never will.

## §5 Drill and scope semantics

Summarized from `2026-04-29-investigation-scope-and-drill-semantics-design.md`;
see that spec for examples and the full data model.

- **Investigation scope (B1 / B2 / B0).** Unified via the
  `nodeMappings: Array<{ nodeId, measurementColumn, specsOverride? }>` field
  on `Investigation`.
  - **B0 (legacy)** — `nodeMappings` empty. Investigation uses its global
    investigation-level specs; does not appear in production-line-glance views.
  - **B1 (multi-step)** — `nodeMappings.length > 1`. One investigation
    covers many canonical-map nodes; production line, business workflow,
    multi-team flow.
  - **B2 (single-step)** — `nodeMappings.length === 1`. One investigation
    IS one step's deep-dive; same hub as the line-level investigation; both
    contribute to the step's distribution.
- **Drill A — Hub → Step.** Click a step node; the step's per-step
  capability detail panel renders, scoped to that node's data across all
  contributing investigations and context-tuples. Per
  `(canonical-node × context-tuple)` Cpk, visualized as a distribution.
  **Shipped** via PRs #103 / #105 / #106 / #107.
- **Drill B — Step → Channels.** Within-step comparison across replicated
  equipment (cavities of a press, heads of a filling carousel). Channels
  share specs; arithmetic across channels is methodologically valid.
  **Shipped** in Performance mode; unchanged.
- **Drill C — Step → Sub-flow.** A step references a sub-ProcessMap when
  the step is itself a complex sub-process. Recursive ProcessMap, max 1
  level in V1. **Spec'd, not built.** The dashboard primitive is ready;
  the navigation affordance, recursion guard, and breadcrumb UX are the
  remaining work. (See §9 sequencing.)
- **Plan D / Org Hub-of-Hubs.** Plant > Line > Station rendered as
  side-by-side child-hub dashboards, plus a cross-hub context filter chip
  strip. Each child computes locally; no cross-hub arithmetic.
  **Spec'd, not built.**
- **Governance.** Versioned canonical map. Hub owner edits canonical
  structure + specs. Investigations pin a `canonicalMapVersion`; can
  `pull-latest` explicitly. Override (`specsOverride` set) = local fork,
  flagged in UI. The B0 migration banner in PR #106 is the first
  user-facing surface of this governance model.

## §6 Surface inventory

Every UI surface enumerated from `apps/azure/src/components/`,
`apps/pwa/src/components/`, and the dashboard primitives in
`packages/ui/src/components/` that the apps wire. Status options:
**shipped** / **spec'd** (designed, not built) / **design-only** (designed,
no code path) / **superseded** (closed by a later decision).

| Surface                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | Stage             | Mode(s)      | Status                                             | App   | Notes                                                                                                                                   |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------- | ------------ | -------------------------------------------------- | ----- | --------------------------------------------------------------------------------------------------------------------------------------- |
| FRAME workspace (river-SIPOC ProcessMap)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | FRAME             | all          | shipped                                            | both  | 4 thin spots — see §7 item 1                                                                                                            |
| FRAME canonical-map authoring + capability drawer (C3)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | FRAME             | all          | **superseded 2026-04-29** by FRAME thin-spot batch | azure | See decision log §Replayed Decisions; CoScout right-rail conflict; future capability-preview-during-FRAME-authoring needs a fresh scope |
| `ProcessDescriptionField`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                | FRAME             | all          | shipped                                            | both  | Issue Statement input                                                                                                                   |
| `ColumnMapping`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | FRAME             | all          | shipped                                            | both  | Wide-form + stack-column support                                                                                                        |
| `SpecEditor` + `SpecsPopover`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | FRAME             | capability   | shipped                                            | both  | USL/LSL/target inputs; data-range context missing (§7 item 1)                                                                           |
| `Dashboard.tsx` (PWA)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    | SCOUT             | all          | shipped                                            | pwa   | Four-lens dashboard; mobile carousel                                                                                                    |
| `Dashboard.tsx` (Azure) + `EditorDashboardView`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | SCOUT             | all          | shipped                                            | azure | Editor dashboard with strategy-pattern slots                                                                                            |
| `LayeredProcessView`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     | SCOUT             | all          | shipped (snapshot mode deferred to H3)             | both  | Outcome / Process Flow / Operations bands; progressive reveal                                                                           |
| `ProductionLineGlanceDashboard`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | SCOUT             | capability   | shipped                                            | both  | Plans A/B/C1/C2 (PRs #103/#105/#106/#107); 2×2 with `mode='spatial' \| 'full'`                                                          |
| `ProductionLineGlanceMigration` (B0 banner + modal)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      | SCOUT             | capability   | shipped                                            | azure | C1 (PR #106); first surface of governance §5                                                                                            |
| `ProcessHubView`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         | SCOUT             | all          | shipped                                            | azure | Hub home with status / capability tabs                                                                                                  |
| `ProcessHubCapabilityTab`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                | SCOUT             | capability   | shipped                                            | azure | C1 (PR #106); 4-slot capability dashboard                                                                                               |
| `ProcessHubCurrentStatePanel`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | SCOUT             | all          | shipped (Phase 2 V2 — PRs #97/#98/#99)             | azure | Current Process State surface                                                                                                           |
| `ProcessHubReviewPanel` + `ProcessHubCadenceQuestions` + `ProcessHubCadenceQueues`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | SCOUT             | all          | shipped                                            | azure | Cadence-review composition                                                                                                              |
| `ProcessHubSustainmentRegion`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | SCOUT/IMPROVE     | all          | shipped                                            | azure | Phase 6 v1                                                                                                                              |
| `ProcessHubEvidencePanel`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                | SCOUT             | all          | shipped                                            | azure | Evidence Sources surface; full EvidenceSheet via PR #101                                                                                |
| `ProcessHubCard` + `ProjectCard` + `OtherProjectsList`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | SCOUT             | all          | shipped                                            | azure | Hub list / project list                                                                                                                 |
| `ProjectDashboard` + `ProjectStatusCard` + `DashboardSummaryCard`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        | SCOUT             | all          | shipped                                            | azure | Multi-project rollup                                                                                                                    |
| `MobileChartCarousel` + `MobileDashboard`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                | SCOUT             | all          | shipped                                            | both  | Mobile dashboard pattern                                                                                                                |
| `EvidenceSheet` + `StateItemNotesDrawer`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | SCOUT/INVESTIGATE | all          | shipped (Phase 3 PR #101)                          | azure | Generic Evidence panel; team notes on state items                                                                                       |
| `InvestigationWorkspace` + `InvestigationMapView` (Azure)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                | INVESTIGATE       | all          | shipped                                            | azure | Editor + map projection                                                                                                                 |
| `InvestigationView` + `EvidenceMapPopout` (PWA)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | INVESTIGATE       | all          | shipped                                            | pwa   | PWA editor + popout sync                                                                                                                |
| `EvidenceMap` (3-layer SVG)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              | INVESTIGATE       | all          | shipped                                            | both  | Statistical / investigation / synthesis layers; popout; edge interactions                                                               |
| `EvidenceMapContextMenu` + `EvidenceMapSheet`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | INVESTIGATE       | all          | shipped                                            | both  | Right-click + edge-detail mobile sheet                                                                                                  |
| Investigation Wall (`WallCanvas` + Wall lifecycle hooks)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | INVESTIGATE       | all          | shipped (PR #75 + PR #76 merged 2026-04-24)        | azure | Hypothesis-centric projection; ⌘K + minimap + drag + AND/OR/NOT; memory still says PR #76 OPEN — see §7 item 5                          |
| `FindingsPanel` + `FindingsLog` + `FindingsWindow`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | INVESTIGATE       | all          | shipped                                            | both  | Findings UI with FindingSource discriminated union                                                                                      |
| `CausalLinkCreator`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      | INVESTIGATE       | all          | shipped                                            | both  | CausalLink entity (ADR-064)                                                                                                             |
| `Investigation` + `InvestigationConclusion` + `InvestigationPhaseBadge` + `InvestigationPrompt`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | INVESTIGATE       | all          | shipped                                            | both  | Phase + diamond UX                                                                                                                      |
| `QuestionLinkPrompt`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     | INVESTIGATE       | all          | shipped                                            | both  | Observation-triggered question linking (P5 entry #3)                                                                                    |
| `CoScoutPanel` + `CoScoutInline` + `CoScoutSection` + `AIOnboardingTooltip`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              | INVESTIGATE       | all          | shipped                                            | azure | CoScout right-rail (ADR-068)                                                                                                            |
| `VoiceInput`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             | INVESTIGATE       | all          | shipped                                            | azure | Transcript-first voice path (ADR-024)                                                                                                   |
| `CapabilityCoachingPanel` + `CapabilityMetricToggle` + `CapabilitySuggestionModal`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | INVESTIGATE       | capability   | shipped                                            | both  | Capability coaching helpers                                                                                                             |
| `CharacteristicTypeSelector` + `MeasureColumnSelector` + `FactorSelector` + `CreateFactorModal`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | INVESTIGATE       | all          | shipped                                            | both  | Factor / measure setup                                                                                                                  |
| `FactorPreviewSection` + `FactorPreviewOverlay`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | INVESTIGATE       | all          | shipped                                            | both  | Factor Intelligence preview                                                                                                             |
| `FilterBreadcrumb` + `FilterChipDropdown` + `FilterContextBar` + `SelectionPanel`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        | SCOUT/INVESTIGATE | all          | shipped                                            | both  | Linked filter chips; progressive stratification                                                                                         |
| Charts: `IChart`, `Boxplot`, `ParetoChart`, `CapabilityHistogram`, `ProbabilityPlot`, `BoxplotWrapper`, `IChartWrapper`, `ParetoChartWrapper`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | SCOUT             | all          | shipped                                            | both  | Four Lenses                                                                                                                             |
| Charts: `PerformanceIChart` + `PerformanceBoxplot` + `PerformanceCapability` + `PerformancePareto`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | SCOUT             | performance  | shipped                                            | both  | Performance mode multi-channel                                                                                                          |
| Charts: `YamazumiWrapper` + `YamazumiSummaryBar` + `YamazumiDisplayToggle` + `YamazumiDetectedModal`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     | SCOUT             | yamazumi     | shipped                                            | both  | Yamazumi mode                                                                                                                           |
| `DefectDetectedModal` + `DefectSummary`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | SCOUT             | defect       | shipped                                            | both  | Mode transform: events → rates                                                                                                          |
| `PerformanceDetectedModal` + `PerformanceSetupPanel` + `PerformanceSpecsControls`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        | SCOUT             | performance  | shipped                                            | both  | Performance setup                                                                                                                       |
| Process Flow mode dashboard                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              | SCOUT             | process-flow | design-only                                        | —     | `2026-04-07-process-flow-analysis-mode-design.md` not coded                                                                             |
| `WhatIfPage` + `WhatIfExplorer` + `WhatIfSimulator`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      | IMPROVE           | all          | shipped                                            | both  | Mode-aware unified What-If; gap estimation                                                                                              |
| `ImprovementWindow` + `ImprovementPlan` + `ImprovementView`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              | IMPROVE           | all          | shipped                                            | both  | PDCA wiring                                                                                                                             |
| HMW Brainstorm modal (SSE)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               | IMPROVE           | all          | shipped                                            | both  | ADR-061; anonymous voting                                                                                                               |
| `SustainmentRecordEditor`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                | IMPROVE           | all          | shipped (Phase 6 v1)                               | azure | Cadence editor; Q3-Q5 fixes via `f5b1fdaa`                                                                                              |
| `SustainmentReviewLogger`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                | IMPROVE           | all          | shipped, **unmounted in v1** — see §7 item 3 (S5)  | azure | Tested, no production mount; Phase 6 v2 blocker                                                                                         |
| `ControlHandoffEditor`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | IMPROVE           | all          | shipped, **unmounted in v1** — see §7 item 3 (S5)  | azure | Tested, no production mount; Phase 6 v2 blocker                                                                                         |
| `VerificationCard`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | IMPROVE           | all          | shipped                                            | both  | Action verification surface                                                                                                             |
| `ReportView` + `PresentationView` + `EmbedFocusView` + `FocusedChartView` + `ReportEvidenceMap`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | IMPROVE           | all          | shipped                                            | both  | Report / presentation surfaces                                                                                                          |
| `AppHeader` + `AppFooter` + `MobileMenu` + `MobileTabBar` + `ShareDropdown` + `SharePopover` + `SyncToast` + `WhatsNewSection`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | chrome            | all          | shipped                                            | both  | Adaptive AppHeader (44px); shell                                                                                                        |
| `HomeScreen`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             | onboarding        | all          | shipped                                            | pwa   | First-run home                                                                                                                          |
| Settings: `SettingsPanel` + `ThemeToggle` + `DevTierSwitcher`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | settings          | all          | shipped                                            | both  | Theme + tier switching                                                                                                                  |
| Admin: `AdminHub` + `AdminKnowledgeSetup` + `AdminPlanTab` + `AdminStatusTab` + `AdminTroubleshootTab`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | admin             | all          | shipped                                            | azure | Tenant admin + Knowledge Base                                                                                                           |
| Data: `DataTable` + `DataTableModal` + `DataPanel` + `DataQualityBanner` + `PasteScreen` + `ManualEntry` + `SampleSection` + `SampleDataPicker`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | onboarding        | all          | shipped                                            | both  | Data entry + quality + samples                                                                                                          |
| Annotations: `AxisEditor` + `EditableChartTitle` + `ChartAnnotationLayer` + `AnnotationContextMenu` + `ChartCard` + `ChartExportMenu` + `ChartInsightChip` + `BoxplotDisplayToggle` + `YAxisPopover` + `ProbabilityPlotTooltip` + `Slider` + `HelpTooltip` + `PreviewBadge` + `UpgradePrompt` + `MobileCategorySheet` + `DocumentShelf` + `SubgroupConfig` + `ErrorBoundary` + `AnovaResults` + `DashboardBase` + `FocusedChartViewBase` + `SurveyNotebookBase` + `ProcessIntelligencePanel` + `EditorMobileSheet` + `EditorEmptyState` + `EditorModals` + `PISection` + `DashboardSection` + `ProcessHealthBar` + `NarrativeBar` + `EvidenceMap` chrome | chrome / chart    | all          | shipped                                            | both  | Supporting surfaces; complete inventory captured here for traceability                                                                  |

**[open in spec]** — Process Flow mode is the only `design-only` row; the
spec at `2026-04-07-process-flow-analysis-mode-design.md` is older than the
Process Learning System pivot and may need a supersession audit before any
implementation work. Treated as a separate Open Question in the decision log.

## §7 Surface debt

Flat list, ordered by user-value-blocked-per-day-of-work. D1–D5 tags refer
to the devil's-advocate critique in
`~/.claude/plans/i-would-need-to-drifting-hummingbird.md`.

1. **FRAME — 4 thin spots.**
   - **Q1.** No per-column health badges in the FRAME column-mapping UI
     (data-range / sample-count / type-mismatch cues).
   - **Q2.** `suggestNodeMappings` exists but is only used in the
     hub-migration wizard, not in the FRAME UI directly.
   - **Q3.** USL / LSL inputs lack data-range context or sanity checks
     (e.g., "your data is 12.0–14.5; you typed USL=80").
   - **Q4.** `processHubId` is in state but FRAME does not surface "you are
     editing the canonical map for N investigations".
     Each is small; together they make FRAME feel less smart than it
     actually is. Source: today's helpers scout in
     `~/.claude/plans/lets-evaluate-where-we-deep-pascal.md`. Tagged: D1
     (synthesis-drift between transcript and spec — these were named
     actionable methodology items the spec pass abstracted).

2. **B2 single-node-scoped chrome walk.** The investigation-scope spec
   locked B2 (`nodeMappings.length === 1`); no actual UX walk has confirmed
   that FRAME / SCOUT / Process Hub Capability tab feel right when the
   investigation is scoped to one machine or one decision point. Tagged: D1.

3. **Phase 6 v2 / S5** — `SustainmentReviewLogger` and `ControlHandoffEditor`
   are tested but unmounted in v1. The spec's Flow B (log review), Flow C
   (drifting + escalate), and Flow D (record handoff) literally cannot be
   executed by a real user yet. Largest single blocker for sustainment-flow
   v2. Gates Q1 / Q2 of `project_phase_6_deferred_findings.md`. Source:
   `project_phase_6_deferred_findings.md` S5. No D-tag (post-pivot debt,
   not drift).

4. **Drill C V1** (recursive ProcessMap, max 1 level). New primitive locked
   by the investigation-scope spec; navigation affordance, recursion guard,
   and breadcrumb UX are the work. Source:
   `2026-04-29-investigation-scope-and-drill-semantics-design.md` §3 Drill C.
   Tagged: D2 (concrete methodology gain abstracted into prose; here, the
   abstraction is benign — the spec is concrete, just unbuilt).

5. **Investigation Wall PR #76 status reconciliation.** Memory says PR #76
   OPEN; commit history + `gh pr list` show PR #75 + PR #76 both merged
   2026-04-24. Wall is fully shipped. The reconciliation is a memory-edit
   task (post plan-mode exit) plus a doc backfill (`docs/03-features/workflows/investigation-wall.md`
   stub; feature-parity row; methodology three-projections paragraph). No
   D-tag.

6. **Plan D / Org Hub-of-Hubs view.** The plant-hub layout, side-by-side
   child-hub cards, and cross-hub context-filter chip strip. Bigger UX
   undertaking; locked in spec. Source:
   `2026-04-29-investigation-scope-and-drill-semantics-design.md` §6. Tagged:
   D3 (Cp/Cpk aggregation safety closed at the engine layer via ADR-073;
   the cross-hub view is the structural answer).

7. **Methodological credibility floor — MSA, sample-size planning,
   question-data fit.** Surface debt at the methodology layer, not the UI
   layer. See §8 for the gap analysis. Tagged: D2 (concrete methodology
   gains abstracted into prose), D4 (instrument-set / level-aware migration
   in progress).

### §7b Yesterday's W4–W7 — completed

These were sources of session-start drift; closing them removed the friction
that used to cost time at the top of every session.

| Workstream | What landed                                                                                                                                                                                                                           | Commit                  |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------- |
| **W4**     | `mode` vs "instrument set" terminology drift resolved (option A: strike "instrument set" from copy, keep `mode` everywhere). 11 doc files touched.                                                                                    | `bfcf3e72`              |
| **W5**     | Top-level governance docs reframed to Process Learning System; CLAUDE.md + OVERVIEW.md + methodology.md + llms.txt + LayeredProcessView spec aligned.                                                                                 | `c0214735`              |
| **W6**     | ADR amendments for ADR-060 / ADR-064 / ADR-068 / ADR-070 documenting the methodology shift, the FRAME-as-one-flow-lens reframing, level-aware coaching alongside mode-aware, and Current Process State alongside SuspectedCause hubs. | `c0214735`              |
| **W7**     | "Observed vs expected" methodology unity captured — methodology.md paragraph + CoScout system prompt addition (ADR-068 lint fix in the second commit).                                                                                | `7b0ca143` + `6a11016a` |

These are not surface debt anymore. They appear here for traceability.

## §8 Methodological gap analysis

Framing pulled verbatim from the morning transcript at
`~/.claude/projects/-Users-jukka-mattiturtiainen-Projects-VariScout-lite/708e62b5-c667-45de-9c9a-869382da2a46.jsonl:129`:

> _A Six Sigma MBB walking into VariScout today would ask, in order:_
> _(1) "What question are you trying to answer?" — and "Can this data answer it?"_
> _(2) "Is your measurement system trustworthy?" — Gage R&R, bias, linearity, stability._
> _(3) "Do you have enough samples to answer the question with adequate power?" — sample-size planning, MDE._
> _(4) Then capability, hypothesis tests, regression, etc._

| Methodological step                      | Status in VariScout                                                                                                                                                                                                                                                              | Verification                                                                                                                                                                          | Needs own brainstorm?                                                                                     |
| ---------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| (1) Question-data fit                    | Question framework exists (ADR-053 + question-driven-eda-2 spec) but assumes the analyst has already chosen a tractable question. No upfront "your data can / can't support this question" assessment.                                                                           | Constitution P5 (questions drive investigation); `2026-04-25-question-driven-eda-2-design.md`                                                                                         | Possibly — could fold into FRAME thin-spot batch (§9 item 1) if scoped narrowly, otherwise own brainstorm |
| (2) MSA / Gage R&R                       | **Absent.** No Gage R&R, no repeatability / reproducibility computation, no bias / linearity / stability studies, no measurement-system trust checkpoint before capability claims. Removed from product entirely (ADR-010 superseded; commit `87bb072` removed shared MSA code). | `rg -i "gage\|gagerr\|repeatability\|reproducibility" packages/` returns only i18n strings + memory; no statistical implementation. ADR-010 §Post-Decision Update.                    | **Yes** — MSA naming + scope is its own brainstorm + ADR (decision-layer first; build later)              |
| (3) Sample-size / power planning         | **Mostly absent.** `sampleConfidence.ts` flags low-N capability estimates as low-confidence (post-hoc). No upfront power calculator, no MDE-per-question-type guidance, no power curves.                                                                                         | `rg -i "minimum detectable\|MDE\|sample.size.*plan\|power.*calc\|power.*analysis" packages/` returns only i18n + a `useBrainstormDetect` test fixture; no statistical implementation. | **Yes** — sample-size planning shape is its own brainstorm                                                |
| (4) Capability / regression / hypothesis | **Shipped, mature.** Cp/Cpk + subgroup capability (ADR-038); two-pass best-subsets regression + interaction screening (ADR-067); ANOVA + η² standardized (ADR-062); three-boundary numeric safety (ADR-069); NIST-validated reference cases.                                     | `packages/core/src/stats/` mature; `sampleConfidence` integrated with W2 / Plan A engine.                                                                                             | No                                                                                                        |

VariScout currently jumps to step (4) with most of step (1) missing and
steps (2) and (3) absent. The credibility floor sits below the analytics
ceiling. The Process Learning System pivot's sustainment promise — _learn
over time from a process measurement system_ — presupposes a trustworthy
measurement system. Without an MSA discipline, accumulated learning risks
encoding noise as signal.

This is the **credibility-foundation** layer. Closing it at the decision
layer (a written ADR + spec) before building any UX is the explicit
recommendation in §9.

## §9 Recommended sequence

Five items, ordered by user-value-blocked-per-day-of-work. Each item is
flagged either as a **commitment** (the next session is the implementation
plan) or **named-future** (the next step is design-only, not delivery).
**C3 is deliberately absent** — see decision log §Replayed Decisions.

1. **FRAME thin-spot batch + B2 chrome walk.** **Commitment.** Combined
   because the four thin spots (§7 item 1) are the answer to the same
   underlying need C3 was scoped against ("live capability feedback while
   mapping"); the B2 walk validates that single-node-scoped investigations
   feel right end-to-end. Surfaces real UX gaps before more surface area
   lands. ~3–5 days. References §6 row "FRAME workspace"; §7 items 1 + 2.

2. **Phase 6 v2 / S5.** **Commitment.** Mount `SustainmentReviewLogger` +
   `ControlHandoffEditor` in production paths; unblocks Flow B / C / D of
   the sustainment + control-handoff design. Defined scope. ~3 days.
   References §6 rows "SustainmentReviewLogger" + "ControlHandoffEditor";
   §7 item 3.

3. **MSA naming brainstorm + ADR (no implementation).** **Commitment**
   (decision layer). Close the methodology hole at the decision layer first
   — define what "Measurement System Analysis" means in VariScout
   (Gage R&R is one option; sample-confidence + bias / linearity / stability
   are others; the boundary against ADR-010's "removed from product" needs
   re-derivation). Build later, not now. ~half-day brainstorm + draft ADR.
   References §8 row 2.

4. **Drill C V1.** **Named-future.** New primitive once FRAME is solid;
   recursive ProcessMap with max 1 level recursion; navigation affordance
   - breadcrumb. ~1 week when planned. References §6 row "Process Hub
     Capability tab" / "LayeredProcessView" (where Drill C lands); §7 item 4.

5. **Plan D / Org Hub-of-Hubs.** **Named-future.** Plant-hub layout +
   side-by-side child-hub composition + cross-hub context-filter chip
   strip. Biggest single UX undertaking; last on this list. ~2 weeks when
   planned. References §6 row "ProcessHubView" (extension target); §7
   item 6.

The sequence is recommendation, not binding roadmap. Future sessions can
redirect against the underlying user-value argument; the order falls out
of "what unblocks the most users for the least implementation cost" given
today's state.

## §10 Named-Future inventory — see decision log

The named-future inventory is **not** in this master doc. It lives in
`docs/decision-log.md` §Named-Future so that each defer / supersede /
close action has one durable home. The decision log is the load-bearing
artifact; this overview is a periodic snapshot that links to it.

The decision-log §Named-Future contains, at minimum, the following items
(read the log for current state, rationale, and where each would live if
built):

- Portfolio Investigation as first-class entity (sustained cross-hub
  investigation with own questions / findings / actions). H3+. See
  `docs/decision-log.md#named-future` (Portfolio Investigation entry).
- Per-node distinct context dimensions (tributary-attached column that
  differs from sibling tributaries). V2 of production-line-glance.
- Investigation-level context overrides (`nodeMappings[i].contextOverride`)
  for retrospective analysis. V2 of production-line-glance.
- MSA editor surface. Phase 3 deferred; see §8 + ADR-010 trail.
- Recurring snapshot trigger / cadence enforcement. Hub settings + Evidence
  Source contract extension.
- No-data-team Evidence Source workflow (Watson critique B4). Own ICP
  design slice.
- CoScout structural autonomy boundary (Watson critique B5). Own ADR
  proposal.
- JD Powers severity-weighting in defect mode (Watson critique G11).
  Defect-mode methodology addendum.
- Drill C V1 (recursive ProcessMap, max 1 level). Spec'd here in §5; not
  built. See §9 item 4.
- Plan D / Org Hub-of-Hubs view. Spec'd in
  `2026-04-29-investigation-scope-and-drill-semantics-design.md` §6; not
  built. See §9 item 5.
- Phase 6 v2 / S5 (review + handoff editor wiring). See §7 item 3 + §9
  item 2.
- LayeredProcessView snapshot mode. H3-aligned; deferred per
  `project_phase_2_v2_closure.md`.

## §11 References

### Source plans (private — referenced for traceability)

- Today's morning plan: `~/.claude/plans/lets-evaluate-where-we-deep-pascal.md`
- Yesterday's locked decisions + W4–W7: `~/.claude/plans/we-just-implemented-phase-delightful-adleman.md`
- Devil's-advocate critique (D1–D5): `~/.claude/plans/i-would-need-to-drifting-hummingbird.md`
- This consolidation plan: `~/.claude/plans/i-am-wondering-that-fancy-brook.md`

### Decision log (the load-bearing companion)

- `docs/decision-log.md` — Replayed Decisions / Open Questions / Named-Future
  / Session Backlog / User Journey Map.

### Top-level orientation

- `docs/OVERVIEW.md`
- `docs/USER-JOURNEYS.md`
- `docs/DATA-FLOW.md`
- `docs/llms.txt`

### Vision / methodology

- `docs/01-vision/methodology.md`
- `docs/01-vision/eda-mental-model.md`
- `docs/01-vision/constitution.md`

### Operating model + roadmap

- `docs/superpowers/specs/2026-04-27-process-learning-operating-model-design.md`
- `docs/superpowers/specs/2026-04-27-product-method-roadmap-design.md`

### Process Hub + evidence layer

- `docs/superpowers/specs/2026-04-25-process-hub-design.md`
- `docs/superpowers/specs/2026-04-25-process-hub-use-cases.md`
- `docs/superpowers/specs/2026-04-26-evidence-sources-data-profiles-design.md`
- `docs/superpowers/specs/2026-04-26-agent-review-log-process-hub-design.md`
- `docs/superpowers/specs/2026-04-29-customer-tenant-ingestion-rollups-concept.md`

### Scope + drill + capability surfaces

- `docs/superpowers/specs/2026-04-29-investigation-scope-and-drill-semantics-design.md`
- `docs/superpowers/specs/2026-04-28-production-line-glance-design.md`
- `docs/superpowers/specs/2026-04-28-production-line-glance-surface-wiring-design.md`
- `docs/superpowers/specs/2026-04-27-layered-process-view-design.md`
- `docs/superpowers/specs/2026-04-27-actionable-current-process-state-panel-design.md`

### Investigation Wall + Evidence Map + workflows

- `docs/superpowers/specs/2026-04-19-investigation-wall-design.md`
- `docs/superpowers/specs/2026-04-05-evidence-map-design.md`
- `docs/superpowers/specs/2026-04-05-evidence-map-spine-design.md`
- `docs/superpowers/specs/2026-04-07-evidence-map-edge-interactions-design.md`
- `docs/superpowers/specs/2026-04-04-investigation-spine-design.md`

### Mode-specific

- `docs/superpowers/specs/2026-04-25-question-driven-eda-2-design.md`
- `docs/superpowers/specs/2026-04-07-process-flow-analysis-mode-design.md`
- `docs/superpowers/specs/2026-04-16-defect-analysis-mode-design.md`
- `docs/superpowers/specs/2026-04-16-defect-evidence-map-integration-design.md`
- `docs/superpowers/specs/2026-04-25-process-flow-yamazumi-integration-design.md`
- `docs/USER-JOURNEYS-CAPABILITY.md`
- `docs/USER-JOURNEYS-DEFECT.md`
- `docs/USER-JOURNEYS-PERFORMANCE.md`
- `docs/USER-JOURNEYS-PROCESS-FLOW.md`
- `docs/USER-JOURNEYS-YAMAZUMI.md`

### CoScout + AI

- `docs/superpowers/specs/2026-04-02-coscout-intelligence-architecture-design.md`
- `docs/superpowers/specs/2026-04-24-coscout-voice-input-design.md`
- `docs/superpowers/specs/2026-03-19-ai-action-tools-design.md`

### Phase 6 sustainment

- `docs/superpowers/specs/2026-04-26-phase-6-sustainment-control-handoff-design.md`

### Decisions (non-exhaustive — see `docs/07-decisions/index.md` for the full list)

- ADR-010 — Defer Gage R&R (superseded; MSA removed from product)
  `docs/07-decisions/adr-010-gagerr-deferral.md`
- ADR-035 — Improvement prioritization (impact × feasibility × …)
- ADR-038 — Subgroup capability
- ADR-053 — Question-driven EDA
- ADR-056 — PI Panel + tab API
- ADR-058 — Deployment lifecycle
- ADR-059 — Web-first deployment architecture (Teams entry experience superseded)
- ADR-060 — CoScout intelligence architecture (W6 amendment)
- ADR-061 — Collaborative HMW Brainstorm
- ADR-062 — Standard ANOVA metrics
- ADR-064 — SuspectedCause hub model (W6 amendment)
- ADR-067 — Continuous regression engine
- ADR-068 — CoScout cognitive redesign (W6 amendment)
- ADR-069 — Three-boundary numeric safety
- ADR-070 — FRAME workspace (W6 amendment)
- ADR-071 — CoScout voice input (transcript-first)
- ADR-072 — Process Hub storage and CoScout context boundary
- ADR-073 — No statistical roll-up across heterogeneous units (companion
  policy to investigation-scope spec)

### Memory references (private — not part of public spec)

- `feedback_aggregation_heterogeneous_specs.md` — locality rule generalizes
  to any heterogeneity dimension.
- `feedback_full_vision_spec.md` — design the whole vision; sequence in
  plans, not in design phasing.
- `feedback_no_gates_language.md` — language convention this spec honors.
- `feedback_no_backcompat_clean_architecture.md` — required-props discipline.
- `feedback_subagent_driven_default.md` — execution pattern for plans
  output.
- `project_phase_6_deferred_findings.md` — source for §7 item 3.
- `project_journey_spine_status.md`, `project_status_audit_apr16.md`,
  `project_production_line_glance_b_c1_c2_shipped.md` — context for §6 +
  §7.
