---
title: Feature Backlog
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
