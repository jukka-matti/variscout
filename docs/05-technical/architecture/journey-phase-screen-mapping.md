---
title: Journey Phase → Screen Mapping
audience: [analyst, engineer]
category: architecture
status: stable
related: [journey-phase, mental-model-hierarchy, analysis-journey-map]
---

# Journey Phase → Screen Mapping

Maps the 4-phase analysis journey (FRAME → SCOUT → INVESTIGATE → IMPROVE) to actual screens, components, and features. Complements the conceptual [analysis-journey-map.md](../../03-features/workflows/analysis-journey-map.md) with concrete code references.

## Screen Flow Overview

```
HomeScreen → PasteScreen/ManualEntry → ColumnMapping → Dashboard → [FocusedView, Report, WhatIf]

Azure saved projects: loadProject() → Project Dashboard (activeView: 'dashboard') → Editor
                      Deep links (Teams, initialFindingId, initialChart) → Editor directly
```

## Project Dashboard (Azure-only)

The Project Dashboard is a **peer view** alongside the analysis Editor, available for saved Azure projects that have data. It is the default landing when opening a saved project.

| Field                | Detail                                                                                           |
| -------------------- | ------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------- |
| **Navigation model** | `panelsStore.activeView: 'dashboard'                                                             | 'editor'` — toggled by "Overview" / "Analysis" tab bar in the project shell |
| **Default landing**  | Set to `'dashboard'` after `loadProject()` for projects with data (unless deep link is present)  |
| **New projects**     | Skip dashboard; go straight to Analysis workspace in FRAME mode (no data yet)                    |
| **Deep links**       | `?finding=<id>`, `?hypothesis=<id>` open Investigation workspace; `?chart=<type>` opens Analysis |
| **Persistence**      | `activeView` is included in `ViewState` and restored on project reopen                           |
| **Components**       | `ProjectDashboard`, `ProjectStatusCard`, `DashboardSummaryCard` in `apps/azure/src/components/`  |
| **AI summary**       | Fast tier (gpt-5.4-nano, reasoning: none). State-aware cache key. Hidden when AI unavailable.    |

Store actions: `panelsStore.showDashboard()` / `showAnalysis()` / `showInvestigation()` / `showImprovement()` / `showReport()`. See [ADR-042](../../07-decisions/adr-042-project-dashboard.md), [ADR-055](../../07-decisions/adr-055-workspace-navigation.md).

## Phase Mapping

### FRAME (no data → data mapped)

| Screen        | Components                                             | Tier | Notes                                       |
| ------------- | ------------------------------------------------------ | ---- | ------------------------------------------- |
| HomeScreen    | Sample cards, Paste/Manual buttons                     | All  | PWA only; Azure has Editor empty state      |
| PasteScreen   | `PasteScreenBase` text area, file selector             | All  | Full-screen overlay                         |
| ManualEntry   | `ManualEntryBase`, `ManualEntrySetupBase`              | All  | Full-screen overlay                         |
| ColumnMapping | `ColumnMapping` column cards, type badges, spec editor | All  | Azure adds Analysis Brief via `BriefHeader` |

**Entry scenario affects FRAME:** "Problem to Solve" fills issueStatement (analyst's input; AI-derived problemStatement is the output) + targetMetric in Azure Brief. "Routine Check" skips straight to data.

### SCOUT (data loaded, exploring patterns)

| Screen                 | Components                                                                              | Tier     | Notes                                           |
| ---------------------- | --------------------------------------------------------------------------------------- | -------- | ----------------------------------------------- |
| Dashboard 4-chart grid | `IChartWrapperBase`, `BoxplotWrapperBase`, `ParetoChartWrapperBase`, `StatsPanelBase`   | All      | Primary analysis view via `DashboardLayoutBase` |
| Mobile carousel        | `MobileChartCarousel`                                                                   | All      | Phone only (<640px)                             |
| FocusedChartView       | `FocusedChartViewBase` single chart full-width                                          | All      | Click chart card to enter                       |
| Performance tab        | `PerformanceIChart`, `PerformanceBoxplot`, `PerformancePareto`, `PerformanceCapability` | Azure    | Multi-measure mode                              |
| FilterBreadcrumb       | `FilterBreadcrumb` drill path chips with η²                                             | All      | Progressive stratification                      |
| NarrativeBar           | `NarrativeBar` AI summary                                                               | Azure AI | Per-chart insights                              |

**Entry scenario affects SCOUT:** "Hypothesis to Check" → CoScout references the upfront hypothesis. "Routine Check" → CoScout highlights signals vs. stable state.

### INVESTIGATE (findings exist, building hypotheses)

| Screen                    | Components                                             | Tier     | Notes                                                       |
| ------------------------- | ------------------------------------------------------ | -------- | ----------------------------------------------------------- |
| Dashboard + FindingsPanel | `FindingsPanelBase`, `FindingCard`, `FindingBoardView` | All      | PWA: 3 statuses (observed/investigating/analyzed), Azure: 5 |
| Hypothesis tree           | `HypothesisTreeView`, `HypothesisNode`                 | Azure    | Auto-validation with η² thresholds                          |
| FindingsWindow popout     | `FindingsWindow`, `InvestigationSidebar`               | Azure    | Desktop dual-screen                                         |
| CoScout panel             | `CoScoutPanelBase` phase-aware conversation            | Azure AI | Explicit phase coaching via `InvestigationPhaseBadge`       |

**New UI elements added in INVESTIGATE (2026-03-18):**

- **`HypothesisNode` — inline sub-hypothesis form:** The "+" button on each node expands an inline form (text input + optional factor dropdown + validation type radio buttons) in place of the previous `window.prompt()`. Cancels with Escape; submits with Enter or "Add".
- **`InvestigationConclusion` — SuspectedCause hub creation:** In the Converging phase, the analyst creates named hub entities that group multiple answered questions into one causal story. Multiple hubs are allowed. Each hub receives a mechanism name and collects its evidence links. The old `causeRole: 'primary'` cycle button (single-primary constraint) is replaced by hub membership management.
- **`FindingCard` — "Suspected causes" section:** When any hub exists and the finding is `analyzed` or higher, the card renders a "Suspected causes" section listing hub names ranked by total evidence (η²/R²adj), with contributing questions beneath each hub.

**Amendment (Apr 2026):** The Converging phase creates `SuspectedCauseHub` entities rather than setting `causeRole` tags on individual questions. See [Investigation Workspace Reframing Design](../../superpowers/specs/2026-04-03-investigation-workspace-reframing-design.md).

**Entry scenario affects INVESTIGATE:** "Problem to Solve" → full diamond traversal expected. "Hypothesis to Check" → may skip diverging, go straight to validating. Entry scenario flows to CoScout via `useEditorAI`.

### IMPROVE (actions exist, PDCA cycle)

| Screen                | Components                                                                            | Tier  | Notes                                                                         |
| --------------------- | ------------------------------------------------------------------------------------- | ----- | ----------------------------------------------------------------------------- |
| Dashboard + actions   | `ActionItem` in `FindingCard`                                                         | Azure | PWA stops at Analyzed                                                         |
| Improvement Workspace | `ImprovementWorkspaceBase`, `SynthesisCard`, `IdeaGroupCard`, `ImprovementSummaryBar` | Azure | Full-page improvement planning                                                |
| What-If Simulator     | `WhatIfPageBase`, scenario sliders                                                    | All   | Project Cpk impact                                                            |
| Staged Analysis       | `StagedComparisonCard`, per-stage stats                                               | Azure | Before/After verification                                                     |
| Report View           | `ReportViewBase`, 5-step story via `ReportSection`                                    | Azure | Report workspace tab (`activeView: 'report'`); shares investigation narrative |

**New UI elements added in IMPROVE (2026-03-19):**

- **`ImprovementWorkspaceBase`** — Full-page improvement planning view. Contains SynthesisCard, Four Directions hint, IdeaGroupCards grouped by hypothesis, and ImprovementSummaryBar. Azure only.
- **`SynthesisCard`** — Convergence synthesis narrative (editable, max 500 chars). Linked finding badges. Read-only variant for Board view header.
- **`IdeaGroupCard`** — Ideas grouped by SuspectedCause hub (one card per hub). Each row has checkbox, direction badge (Four Ideation Directions), timeframe dropdown (just do/days/weeks/months), cost estimate, risk assessment, projection badge, What-If and CoScout buttons.
- **`ImprovementSummaryBar`** — Sticky bottom bar: selected count, timeframe breakdown, projected Cpk, "Convert selected → Actions" button.
- **Direction badge on `HypothesisNode` ideas:** Color-coded prevent/detect/simplify/eliminate badge (Four Ideation Directions).
- **Timeframe dropdown on `HypothesisNode`:** Inline `<select>` for implementation timeframe (just do/days/weeks/months), color-coded.
- **Projected vs actual on `FindingCard` outcome:** Shows "Projected X.XX → Actual Y.YY (+delta)" with green/red color.
- **`WhatIfPageBase` — projection context banner:** When opened via the "P" (Project) button on an improvement idea, the simulator displays a banner identifying the linked finding and idea name. A **"Save to idea"** button captures the current projection (projected mean, σ, Cpk, yield) back onto the idea record, completing the idea → What-If → idea round-trip.

**IMPROVE follows the full PDCA cycle:**

1. **Plan: Ideate** — brainstorm improvement ideas (timeframe/cost/risk estimate + What-If projection)
2. **Plan: Select** — compare projected impact, selected ideas become corrective actions
3. **Do** — define and execute actions (owners, dates, tracking) — finding → `improving`
4. **Check** — staged analysis (before vs after), compare Cpk/mean/σ
5. **Act** — target met → record outcome, close finding (`resolved`), standardize. Not met → new PDCA cycle or re-enter INVESTIGATE.

## Entry Scenarios

Three scenarios affect AI behavior at each phase. See `EntryScenario` type in `@variscout/core`, detected by `detectEntryScenario()` in `@variscout/hooks`.

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

- [analysis-journey-map.md](../../03-features/workflows/analysis-journey-map.md) — Conceptual journey definition
- [mental-model-hierarchy.md](./mental-model-hierarchy.md) — The Journey Model
- [investigation-to-action.md](../../03-features/workflows/investigation-to-action.md) — INVESTIGATE/IMPROVE workflow
- [methodology-coach-design.md](../../archive/2026-03-18-methodology-coach-design.md) — Coach UI design spec (archived, removed)
