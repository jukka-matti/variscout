---
title: Feature Backlog
audience: [developer, product]
category: reference
status: draft
---

# Feature Backlog

**How to read:** Items are grouped by status — **Active** has user-validated demand and clear scope; **Candidate** needs validation before investment; **Delivered** is recorded for traceability. Each active/candidate item links to a design spec where one exists.

Features identified from user testing discussions (2026-03-29) and development sessions.

## Source Discussions

| Date       | Topic                                     | Transcript                                                                                                               |
| ---------- | ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| 2026-03-29 | Dataset analysis (Finland arrivals)       | [discussions/2026-03-29-dataset-analysis.txt](discussions/2026-03-29-dataset-analysis.txt)                               |
| 2026-03-29 | Probability plot UX                       | [discussions/2026-03-29-probability-plot.txt](discussions/2026-03-29-probability-plot.txt)                               |
| 2026-03-29 | Probability plot methodology + commenting | [discussions/2026-03-29-probability-plot-and-commenting.txt](discussions/2026-03-29-probability-plot-and-commenting.txt) |

---

## Active — Real Pending Work

Items with user-validated demand and clear scope. Ordered by impact within each theme.

### Foundational Statistical Methods

- [ ] **Chi-square goodness-of-fit test** — Observed vs expected distribution test. Foundation for probability plot, ANOVA, regression. Show alongside probability plot.
  - _Source: Methodology discussion — "chi-square test is a fundamental aspect in building all statistical analysis"_
  - _No spec yet — consider ADR + spec before implementation._

- [ ] **Output-based analysis** — Analyze output per process step and overall production line output. Relates to Yamazumi (time study) but focused on throughput/yield rather than cycle time. Probability plot inflection points map to process step transitions.
  - _Source: Methodology discussion — "relate those to the process steps, you can say which process steps should be fixed in what order"_
  - _Related: Process Flow mode design spec (`2026-04-07-process-flow-analysis-mode-design.md`, draft)._

### Probability Plot — Phase C (Process Diagnostics)

Design spec: [`2026-03-29-probability-plot-enhancement-design.md`](../archive/specs/2026-03-29-probability-plot-enhancement-design.md) (draft).

- [ ] **Inflection point detection** — Piecewise linear regression on the probability plot data. Detect where slope changes significantly. Mark change points with vertical indicators.

- [ ] **Annotations on inflection points** — Create findings anchored to inflection locations. "Process loss between Step 2 and 3." Depends on inflection point detection.

### Accessibility

- [ ] **Text size for everything, not just charts** — Current "Chart Text Size" setting (compact/normal/large) only scales chart fonts. Extend to all UI: stats panel, data table, filter chips, tooltips, navigation. Users with reduced vision need consistent scaling.
  - _Source: Both discussions — "bigger fonts... my current setting is just chart text size but it should be everything"_
  - _Related: Display density design spec (`2026-03-29-display-density-design.md`, draft)._

### i18n

- [ ] **Wall native translations pass** — `wall.*` catalog keys (Phase 12 + `wall.missing.processMap` from PR #76 walk) currently use English fallback in all 31 non-English locales. Next translation batch should cover the 10 native locales: fi, de, es, fr, pt, ja, zhHans, zhHant, ko, nb.

### Per-Characteristic Capability Targets

Active workstream on `feat/per-characteristic-cpk-target`. Phase A landed in commit `33941743`; Phases B–D pending. Architectural rationale + design POV in `~/.claude/plans/where-did-we-leave-bright-garden.md`.

The methodology requires per-characteristic capability bars (AIAG / AS9100 / ISO 13485 control plans assume each characteristic has its own Cpk requirement; critical-to-safety dimensions get ≥ 1.67, major characteristics ≥ 1.33, etc.). The data model supports it — `measureSpecs: Record<string, SpecLimits>` is persisted on `projectStore` — but the UI today edits a single project-wide `cpkTarget` and a single project-wide `specs`. Per-column specs as a feature isn't shipped.

- [x] **Phase A — Foundation.** Single `gradeCpk` rule (target × 0.75 amber boundary) replaces 3 inline banding copies. New `@variscout/core/capability` module with `gradeCpk` + `resolveCpkTarget` cascade. `SpecLimits.cpkTarget` field added. New architecture doc at `docs/05-technical/architecture/capability-target-cascade.md`. No user-facing UX change.
- [x] **Phase B — Per-column specs editor.** `SpecEditor` extended with `cpkTarget` (toggle + numeric input alongside USL/LSL/target/characteristicType). Consumers (Dashboard Azure+PWA, PISection, MobileChartCarousel via parent, ProcessIntelligencePanel PWA) read `measureSpecs[outcome]` and write via new `setMeasureSpec(outcome, partial)` action on `projectStore`. `SpecsPopover` and its dead PWA shim deleted entirely. `ProcessHealthBar` renames `onCpkTargetChange` → `onCpkTargetCommit` and gains optional `columnLabel` chip ("for [outcome]") for visible per-column scope. The legacy project-wide `useProjectStore.specs` / `setSpecs` API is retained as a passive cascade fallback (`PerformanceSetupPanel` still writes there during setup).
- [x] **Phase C — Banding surfaces use cascade.** Single-column banding surfaces switched from reading `useProjectStore.cpkTarget` directly to calling `resolveCpkTarget(column, { measureSpecs, projectCpkTarget })`: `Dashboard` capability mode (Azure+PWA), `WhatIfPage` (Azure+PWA), `Editor`, `ReportView`, `InvestigationWorkspace`, PWA `App.tsx`, `IChart`/`Boxplot` chart wrappers (Azure+PWA), `StatsTabContent`, `QuestionsTabContent`. Multi-channel `PerformanceDashboard` resolves against `selectedMeasure`. `PerformanceSetupPanel` keeps its direct `setCpkTarget` write (project-wide writer for the setup flow). Per-step `ProcessHubCapabilityTab` and per-channel `PerformanceIChartBase` (array of targets) remain on the project-wide value pending a chart-API broadening — cascade still resolves cleanly for them via `projectCpkTarget` fallback.
- [x] **Phase D — FRAME Ocean spec editor per-column with cpkTarget.** FRAME's Ocean spec editor (`OceanCard` inside `ProcessMapBase`, exposed via `LayeredProcessView` / `LayeredProcessViewWithCapability`) now writes per-column to `measureSpecs[ctsColumn]` via `setMeasureSpec(column, partial)`, replacing the project-wide `setSpecs(...)` write. A new "Cpk target" input renders alongside LSL / Target / USL (2×2 grid) so the per-characteristic capability bar is editable at the methodology's primary control-plan authoring entry point. The `onSpecsChange` payload is a single shape `{ target?, usl?, lsl?, cpkTarget? }` end-to-end (no back-compat), threaded through `ProcessMapBaseProps` → `LayeredProcessViewProps` → `LayeredProcessViewWithCapabilityProps`. PWA + Azure FrameViews refactored symmetrically. Per-step CTQ specs (per-StepCard USL/LSL/target/cpkTarget editor) deferred to V2 — see "Per-step CTQ specs editor" below.

Deferred to V2 (decision points along the way):

- [x] **Per-step CTQ specs editor** — Per-step USL / LSL / target / cpkTarget editor on each `StepCard`'s CTQ column, mirroring Ocean's pattern. Each StepCard with a `ctqColumn` now renders a 2x2 SpecsGrid; edits route through `onStepSpecsChange(column, next)` to `setMeasureSpec(column, next)` on `projectStore.measureSpecs`. `OceanCard` was refactored to use the same shared `SpecsGrid` helper. Threaded through `ProcessMapBaseProps` → `LayeredProcessViewProps` → `LayeredProcessViewWithCapabilityProps` (inherited via `Omit`). PWA + Azure FrameViews wired symmetrically. AIAG control plans now have a single authoring surface for every step's quality requirement.
- [ ] **Specs table (bulk audit surface)** — Settings panel listing all columns × USL × LSL × target × cpkTarget. Real value for review/handoff. Needs sort/filter/edit semantics design before scoping.
- [x] **Hub Capability tab header editor** — `CpkTargetInput` primitive renders next to `TimelineWindowPicker` on the Hub Capability tab; commits write `processHub.reviewSignal.capability.cpkTarget` via the new `onHubCpkTargetCommit` prop, persisted by Dashboard's `saveProcessHub` round-trip. The hub-level reviewSignal is now first-class on `ProcessHub` and wins over the investigation-derived rollup signal in `buildProcessHubRollups`.
- [ ] **Provenance labels** — Small "(per-spec)" / "(hub default)" caption under each band. Add only if usability testing surfaces confusion when targets differ across columns.
- [x] **Reconcile `PerformanceSetupPanel`'s project-wide write path** — Wizard now emits `cpkTargetPerChannel` and the Azure consumer fans out via `setMeasureSpec(column, { cpkTarget })` per selected channel; legacy `setCpkTarget` write removed from the setup flow.

### UX Polish — Probability Plot & Charts

- [ ] **Cp/Cpk on histogram** — When in capability mode, show Cp/Cpk on the histogram chart itself (Phase A follow-up).

- [ ] **Easier focused view entry** — Double-click chart to expand, or more prominent expand button.

---

## Candidate — Needs Validation

Items where the gap vs. current behavior isn't fully clear, or where user demand needs re-confirmation before investment. Do not schedule without a brainstorming pass.

- [ ] **Chart commenting on data points and regions** — Select a specific data point, region, or range on any chart (Boxplot, Probability plot, I-Chart) and add a comment. Extends the current Finding/annotation system to support more granular anchoring (point-level, not just category-level).
  - _Caveat: Series-aware annotations already shipped (Phase B). Validate what specific gap remains — point-level vs category-level may already be covered by the existing `FindingSource` discriminated union._

- [ ] **Brushing mode with smart selection** — Select all points above/below a value (e.g., target, control limit). Selection respects performance measure direction: if smaller-is-better, "select all above USL" highlights the failures. Could also support "select all outside control limits" as a one-click action.
  - _Caveat: Brush + factor creation already exists via `useMultiSelection`. This is specifically about *threshold-based* smart selection — not arbitrary region brushing. Worth validating as a distinct feature._

- [ ] **Data panel to left sidebar, CoScout to right sidebar** — In the Process Improvement tab, data/stats should live on the left side and CoScout AI on the right side. Clear spatial separation between data exploration (left) and AI assistance (right).
  - _Source: User feedback — "data only to left side process improvement tab, right side is for CoScout"_
  - _Caveat: Overlaps with navigation architecture refactor (`2026-03-17-navigation-architecture-design.md`, draft). Bundle with that effort rather than shipping standalone._

---

## Probability Plot — Phases A & B (Completed)

Detailed analysis: [discussions/2026-03-29-probability-plot-analysis.md](discussions/2026-03-29-probability-plot-analysis.md)

### Phase A — Quick wins (UX polish)

- [x] **Anderson-Darling normality test** — `andersonDarlingTest()` in `@variscout/core/stats`. Per-series AD p-value in hover tooltip.
- [x] **Hover card with per-series stats** — N, Mean, StDev, AD p-value shown on series hover via `ProbabilityPlotTooltip`.

### Phase B — Multi-series probability plot

- [x] **Multiple probability plot by factor** — `useProbabilityPlotData` hook groups by factor, `ProbabilityPlotBase` renders multi-series with `operatorColors`.
- [x] **Slope comparison for prioritization** — Visual slope = StDev. Steeper = tighter distribution. Parallel lines = location shift.
- [x] **Per-level stats** — Hover card shows N, Mean, StDev, AD p-value per series.
- [x] **Brush selection + factor creation** — Reuses `useMultiSelection` from I-Chart. Brush → cross-chart highlight → Create Factor.
- [x] **Series-aware annotations** — `FindingSource` extended with `{ chart: 'probability'; anchorX; anchorY; seriesKey? }`.

---

## Delivered Since Backlog Created

Items that were pending when the backlog was written but have since shipped. Kept for traceability.

- [x] **Best subsets regression (continuous + categorical)** — Delivered via ADR-067 (Unified GLM Regression Engine). Supersedes the earlier ADR-014 deferral. Ships two-pass best subsets with interaction screening; handles continuous, categorical, and mixed predictors.
  - _Source: Methodology discussion — "that's best subsets regression, that's what you teach first"_

- [x] **Wide-form data support (Stack Columns)** — ADR-050. Paste 80+ column datasets, stack into long-form for analysis. Integrated into ColumnMapping with smart detection.
  - _Source: Dataset analysis discussion — "I'm not able to answer with the current data structure"_

- [x] **Pareto Top N + Others** — ADR-051. Top 20 categories + "Others" aggregated bar for many-category datasets.

- [x] **Adaptive boxplot category limits** — Width-driven limits with specs-aware priority selection. Overflow indicator + category picker in BoxplotDisplayToggle.

- [x] **I-Chart factor tooltips** — Hover shows factor values (Month, Year) alongside point value.

- [x] **Create Factor auto-switch** — After creating a factor from selection, boxplot and pareto auto-switch to the new factor.

- [x] **Chart label rotation** — Boxplot and Pareto rotate labels -45° and truncate for 10+ categories.

---

## Tech Debt: Mode-Dispatch Pattern Consolidation (Completed)

`analysisStrategy.ts` uses a declarative function-map pattern (`Record<ResolvedMode, Strategy>`) for mode-specific behavior. All identified consolidation targets are done.

- [x] `computeHubEvidence` in `packages/core/src/findings/helpers.ts` — mode-dispatched evidence computers
- [x] `generateForMode` in `packages/hooks/src/useQuestionGeneration.ts` — extracted dispatch function
- [x] `useYamazumiParetoData.ts` — `categoryExtractors: Record<YamazumiParetoMode, CategoryExtractor>`
- [x] `ImprovementSummaryBar.tsx` — `modeRenderers: Record<SummaryMode, RenderFn>`
- [x] `ManualEntrySetupBase.tsx` + `ManualEntryBase.tsx` — `modeValidators`, `modeConfigRenderers`, `emptyRowCreators`, `pasteMappers`, `analyzers`
- [x] `bestSubsets.ts` — `singleFactorFormatters` / `combinationFormatters: Record<ResolvedMode, Fn>`
- [x] `Dashboard.tsx` — `modeTabs: Record<ResolvedMode, ModeTab[]>` + `modeDefaultTab`

**Pattern reference:** See `packages/core/src/analysisStrategy.ts` for the canonical implementation.
