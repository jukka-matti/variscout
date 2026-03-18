---
title: Journey Phase → Screen Mapping
audience: [analyst, engineer]
category: architecture
status: stable
related: [journey-phase, mental-model-hierarchy, analysis-journey-map, methodology-coach]
---

# Journey Phase → Screen Mapping

Maps the 4-phase analysis journey (FRAME → SCOUT → INVESTIGATE → IMPROVE) to actual screens, components, and features. Complements the conceptual [analysis-journey-map.md](../../../01-vision/analysis-journey-map.md) with concrete code references.

## Screen Flow Overview

```
HomeScreen → PasteScreen/ManualEntry → ColumnMapping → Dashboard → [FocusedView, Report, WhatIf]
```

## Phase Mapping

### FRAME (no data → data mapped)

| Screen        | Components                                             | Tier | Notes                                       |
| ------------- | ------------------------------------------------------ | ---- | ------------------------------------------- |
| HomeScreen    | Sample cards, Paste/Manual buttons                     | All  | PWA only; Azure has Editor empty state      |
| PasteScreen   | `PasteScreenBase` text area, file selector             | All  | Full-screen overlay                         |
| ManualEntry   | `ManualEntryBase`, `ManualEntrySetupBase`              | All  | Full-screen overlay                         |
| ColumnMapping | `ColumnMapping` column cards, type badges, spec editor | All  | Azure adds Analysis Brief via `BriefHeader` |

**Entry scenario affects FRAME:** "Problem to Solve" fills problemStatement + targetMetric in Azure Brief. "Routine Check" skips straight to data.

### SCOUT (data loaded, exploring patterns)

| Screen                 | Components                                                                              | Tier     | Notes                                           |
| ---------------------- | --------------------------------------------------------------------------------------- | -------- | ----------------------------------------------- |
| Dashboard 4-chart grid | `IChartWrapperBase`, `BoxplotWrapperBase`, `ParetoChartWrapperBase`, `StatsPanelBase`   | All      | Primary analysis view via `DashboardLayoutBase` |
| Mobile carousel        | `MobileChartCarousel`                                                                   | All      | Phone only (<640px)                             |
| FocusedChartView       | `FocusedChartViewBase` single chart full-width                                          | All      | Click chart card to enter                       |
| Performance tab        | `PerformanceIChart`, `PerformanceBoxplot`, `PerformancePareto`, `PerformanceCapability` | Azure    | Multi-measure mode                              |
| FilterBreadcrumb       | `FilterBreadcrumb` drill path chips with η²                                             | All      | Progressive stratification                      |
| NarrativeBar           | `NarrativeBar` AI summary                                                               | Azure AI | Per-chart insights                              |

**Entry scenario affects SCOUT:** "Hypothesis to Check" → coaching says "Look for evidence supporting your hypothesis". "Routine Check" → "Scan for new signals or drift".

### INVESTIGATE (findings exist, building hypotheses)

| Screen                    | Components                                                        | Tier     | Notes                                                       |
| ------------------------- | ----------------------------------------------------------------- | -------- | ----------------------------------------------------------- |
| Dashboard + FindingsPanel | `FindingsPanelBase`, `FindingCard`, `FindingBoardView`            | All      | PWA: 3 statuses (observed/investigating/analyzed), Azure: 5 |
| Hypothesis tree           | `HypothesisTreeView`, `HypothesisNode`                            | Azure    | Auto-validation with η² thresholds                          |
| FindingsWindow popout     | `FindingsWindow`, `InvestigationSidebar`                          | Azure    | Desktop dual-screen                                         |
| CoScout panel             | `CoScoutPanelBase` phase-aware conversation                       | Azure AI | Explicit phase coaching via `InvestigationPhaseBadge`       |
| Investigation diamond     | `DiamondPhaseMap` (initial → diverging → validating → converging) | Azure    | Visualizes investigation progress                           |

**Entry scenario affects INVESTIGATE:** "Problem to Solve" → full diamond traversal expected. "Hypothesis to Check" → may skip diverging, go straight to validating.

### IMPROVE (actions exist, PDCA cycle)

| Screen              | Components                                         | Tier  | Notes                          |
| ------------------- | -------------------------------------------------- | ----- | ------------------------------ |
| Dashboard + actions | `ActionItem` in `FindingCard`                      | Azure | PWA stops at Analyzed          |
| What-If Simulator   | `WhatIfPageBase`, scenario sliders                 | All   | Project Cpk impact             |
| Staged Analysis     | `StagedComparisonCard`, per-stage stats            | Azure | Before/After verification      |
| Report View         | `ReportViewBase`, 5-step story via `ReportSection` | Azure | Shares investigation narrative |
| PDCA tracker        | `PDCAProgress` (Plan → Do → Check → Act)           | Azure | Tracks cycle completion        |

**IMPROVE follows the full PDCA cycle:**

1. **Plan: Ideate** — brainstorm improvement ideas (effort estimate + What-If projection)
2. **Plan: Select** — compare projected impact, selected ideas become corrective actions
3. **Do** — define and execute actions (owners, dates, tracking) — finding → `improving`
4. **Check** — staged analysis (before vs after), compare Cpk/mean/σ
5. **Act** — target met → record outcome, close finding (`resolved`), standardize. Not met → new PDCA cycle or re-enter INVESTIGATE.

## Phase Indicator Visibility

The `JourneyPhaseStrip` (compact dots + label) appears in the app header across all post-FRAME views:

| View                      | Visible | Notes                                     |
| ------------------------- | ------- | ----------------------------------------- |
| HomeScreen                | No      | FRAME screens have no indicator           |
| PasteScreen / ManualEntry | No      | FRAME screens                             |
| ColumnMapping             | No      | FRAME screens                             |
| Dashboard (grid)          | Yes     | Header persists                           |
| Dashboard (focused)       | Yes     | Header persists                           |
| Mobile carousel           | Yes     | Compact pill in header                    |
| What-If Page              | Yes     | Header persists                           |
| Report View               | Yes     | Header persists                           |
| Presentation View         | No      | Minimal chrome                            |
| FindingsWindow popout     | No      | Separate window, has InvestigationSidebar |

## Entry Scenarios

Three scenarios affect coaching content at each phase. See `EntryScenario` type in `@variscout/core`.

| Scenario     | Label               | Typical Flow                                                                                          |
| ------------ | ------------------- | ----------------------------------------------------------------------------------------------------- |
| `problem`    | Problem to Solve    | FRAME (with brief) → SCOUT (find drivers) → INVESTIGATE (build evidence) → IMPROVE (full PDCA)        |
| `hypothesis` | Hypothesis to Check | FRAME (with hypothesis) → SCOUT (confirm/refute) → INVESTIGATE (if confirmed) → IMPROVE (fix cause)   |
| `routine`    | Routine Check       | FRAME (minimal setup) → SCOUT (scan signals) → INVESTIGATE (only if signal) → IMPROVE (only if cause) |

## Phase Detection

Phase detection uses `useJourneyPhase` hook from `@variscout/hooks`:

- **FRAME:** `!hasData`
- **SCOUT:** `hasData && findings.length === 0`
- **INVESTIGATE:** `findings.length > 0 && no actions`
- **IMPROVE:** `findings.some(f => f.actions?.length > 0)`

## Related Documents

- [analysis-journey-map.md](../../../01-vision/analysis-journey-map.md) — Conceptual journey definition
- [mental-model-hierarchy.md](./mental-model-hierarchy.md) — M1: Journey Phase model
- [investigation-to-action.md](../../../03-features/workflows/investigation-to-action.md) — INVESTIGATE/IMPROVE workflow
- [methodology-coach-design.md](../../../superpowers/specs/2026-03-18-methodology-coach-design.md) — Coach UI design spec
