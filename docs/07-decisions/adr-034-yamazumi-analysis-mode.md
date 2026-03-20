---
title: 'ADR-034: Yamazumi Analysis Mode'
---

# ADR-034: Yamazumi Analysis Mode

**Status**: Accepted

**Date**: 2026-03-20

## Context

VariScout currently supports two analysis modes:

- **Standard SPC** — single-measure variation analysis with I-Chart, Boxplot, Pareto, and Capability
- **Performance** — multi-channel analysis comparing fill heads, cavities, or nozzles via Cpk scatter, distribution boxplot, Cpk ranking Pareto, and single-channel histogram

A growing segment of users (lean engineers, industrial engineers, kaizen facilitators) perform time study analysis that requires a fundamentally different visualization: **activity type composition per station** with takt time compliance. These users currently export time study data to Excel and manually build stacked bar charts, losing the drill-down, findings, and investigation workflow that VariScout provides.

The Yamazumi chart (Japanese: "pile-up chart") is a standard lean tool that decomposes cycle time into activity types (value-add, non-value-add, semi-value-add, wait) and compares the stacked total against takt time. It answers questions that neither Standard nor Performance mode can address:

- "Which stations exceed takt time, and why?"
- "Where is the waste concentrated?"
- "If we eliminate NVA from Station 5, does it come below takt?"

The existing chart infrastructure (visx, props-based pattern, linked filtering, findings system) can be extended to support this mode without architectural changes.

## Decision

### 1. Analysis Mode Union

Replace the `isPerformanceMode` boolean with a three-value union:

```typescript
type AnalysisMode = 'standard' | 'performance' | 'yamazumi';
```

All existing `isPerformanceMode` checks become `analysisMode === 'performance'`. The union is extensible for future modes.

### 2. Auto-Detection Priority Chain

Data format detection runs in this order:

1. **Yamazumi** — Detected when data contains an activity type column (values matching VA/NVA/SNVA/Wait patterns via fuzzy matching) alongside a station/step column and a time/duration column
2. **Performance** — Detected when multiple measure columns share a common prefix (existing logic)
3. **Standard** — Default fallback

The user can always override the detected mode via the mode switcher in the dashboard header. Mode switching does not require re-uploading data.

### 3. Chart Slot Mapping

The Yamazumi dashboard reuses the existing four-slot layout:

| Slot   | Standard         | Performance          | Yamazumi                         |
| ------ | ---------------- | -------------------- | -------------------------------- |
| Slot 1 | I-Chart          | Cpk Scatter          | **YamazumiChart** (stacked bar)  |
| Slot 2 | Boxplot          | Distribution Boxplot | **I-Chart** (cycle time series)  |
| Slot 3 | Pareto           | Cpk Ranking Pareto   | **Pareto** (waste by station)    |
| Slot 4 | Stats / Capacity | Channel Histogram    | **Summary Panel** (lean metrics) |

### 4. YamazumiChart Component

New chart component using `@visx/shape` `BarStackHorizontal` (or vertical `BarStack`):

- Each bar = one station/process step
- Stacked segments = activity types (VA, NVA, SNVA, Wait)
- Horizontal takt time reference line
- Color mapping: VA = green, SNVA = amber, NVA = red, Wait = slate
- Click a segment to filter all other charts to that activity type + station
- Props-based, follows existing `ChartBase` + responsive wrapper pattern

### 5. Activity Type Classification

Four activity types with fuzzy matching:

| Type | Label          | Color | Match Patterns                                |
| ---- | -------------- | ----- | --------------------------------------------- |
| VA   | Value-Add      | Green | `va`, `value`, `value-add`, `value add`       |
| NVA  | Non-Value-Add  | Red   | `nva`, `non-value`, `waste`, `muda`           |
| SNVA | Semi-Value-Add | Amber | `snva`, `semi`, `necessary`, `required waste` |
| Wait | Wait / Idle    | Slate | `wait`, `idle`, `delay`, `queue`, `block`     |

Classification logic lives in `@variscout/core` with `classifyActivityType()` and `ACTIVITY_TYPE_PATTERNS`.

### 6. Reuse of Existing Infrastructure

- **I-Chart** — Repurposed to show cycle time per observation in time order; metric switcher allows toggling between total cycle time, VA-only time, and NVA-only time
- **Pareto** — Mode switcher: "Waste by Station" (default) or "Waste by Type" (across all stations)
- **Filter navigation** — Existing `useFilterNavigation` works unchanged; station = factor, activity type = drillable category
- **Findings system** — All finding types, annotations, and investigation workflow apply directly
- **Staged analysis** — Before/after comparison works (e.g., pre-kaizen vs post-kaizen)

### 7. Summary Panel Metrics

The Yamazumi summary panel replaces the standard Stats panel:

| Metric             | Formula                         | Purpose                   |
| ------------------ | ------------------------------- | ------------------------- |
| Takt Time          | Available time / demand         | Reference line            |
| Bottleneck Station | Station with highest total time | Constraint identification |
| Process Efficiency | VA time / Total time            | Lean counterpart to Cpk   |
| Takt Compliance    | Stations below takt / Total     | Overall line health       |
| Total NVA          | Sum of NVA + Wait across all    | Waste magnitude           |

## Consequences

### Positive

- **Lean workflow coverage** — Time study analysis joins SPC and multi-channel in a unified tool
- **Reuse** — ~80% of dashboard infrastructure (layout, filters, findings, export, AI) works without modification
- **Natural fit** — Activity types map cleanly to the FLOW lens (composition) and FAILURE lens (waste concentration)
- **New persona** — Industrial engineers and kaizen facilitators gain a reason to adopt VariScout
- **Teaching** — PWA free tier can offer Yamazumi for lean training, matching the educational mission

### Negative

- **`isPerformanceMode` migration** — Every existing check must be updated to use `analysisMode` union; risk of missed branches
- **New chart component** — `YamazumiChart` is the first stacked bar chart in the codebase; requires new visx composition patterns
- **Detection ambiguity** — Some datasets may have an activity type column without being time study data; false positives possible (mitigated by user override)
- **Takt time input** — Requires a new UI element (takt time entry) that has no equivalent in Standard or Performance mode

### Architecture

```
┌──────────────┐     ┌──────────────────┐     ┌──────────────────────┐
│ Data Upload   │────▶│ Mode Detection   │────▶│ Dashboard Layout     │
│ (paste/file)  │     │ yamazumi →       │     │ (4-slot, mode-aware) │
└──────────────┘     │ performance →    │     └──────────────────────┘
                     │ standard         │              │
                     └──────────────────┘         ┌────┴────────────┐
                                                  │                 │
                                             ┌────▼────┐     ┌─────▼─────┐
                                             │Yamazumi │     │ I-Chart   │
                                             │Chart    │     │ (reused)  │
                                             │(new)    │     └───────────┘
                                             └─────────┘
                                                  │
                                             ┌────▼────┐     ┌───────────┐
                                             │ Pareto  │     │ Summary   │
                                             │(reused) │     │ Panel     │
                                             └─────────┘     │ (new)     │
                                                             └───────────┘
```

## Implementation

### Phase 1: Core Types & Detection

- Add `AnalysisMode` union to `@variscout/core/types.ts`
- Migrate `isPerformanceMode` to `analysisMode` across all packages
- Implement `classifyActivityType()` and `detectYamazumiFormat()` in `@variscout/core`
- Add `yamazumiStats` module to `@variscout/core/stats/`

### Phase 2: Chart & Dashboard

- Create `YamazumiChart` / `YamazumiChartBase` in `@variscout/charts`
- Create `YamazumiSummaryPanelBase` in `@variscout/ui`
- Wire Yamazumi slot mapping in `DashboardLayoutBase`
- Add takt time input to `SettingsPanelBase`

### Phase 3: Integration

- Wire I-Chart metric switching (total / VA / NVA)
- Wire Pareto mode switching (by station / by type)
- Update AI context for Yamazumi-specific narration
- Add assembly-line sample dataset to `@variscout/data`

## See Also

- [ADR-005: Props-Based Charts](adr-005-props-based-charts.md) — Chart architecture that Yamazumi follows
- [ADR-002: Visx for Charts](adr-002-visx-charts.md) — Rendering library (BarStack)
- [Yamazumi Feature Doc](../03-features/analysis/yamazumi.md) — User-facing feature documentation
- [Assembly Line Case Study](../04-cases/assembly-line/index.md) — Teaching case for Yamazumi mode
