---
title: 'Probability Plot Enhancement Design'
status: draft
---

# Probability Plot Enhancement Design

Multi-series overlay, brush selection with factor creation, annotations, and Anderson-Darling normality test.

## Context

User testing (2026-03-29) revealed the probability plot is underutilized as a diagnostic tool. The current single-series implementation limits its value — quality professionals need to visually compare process steps, machines, or operators by overlaying multiple series. They also need to interact with the plot: brush regions of interest (inflection points, deviations), create factors from visual patterns, and annotate observations as findings.

This enhancement transforms the probability plot from a passive normality check into an active process diagnostic tool.

## Core Capabilities

### 1. Multi-Series Overlay

Plot multiple factor levels on shared axes, one colored line per level.

**Data model:**

- Component always receives `ProbabilityPlotSeries[]` (single series = array with one element)
- No backward-compatible branching — unified API

```typescript
interface ProbabilityPlotSeries {
  key: string; // factor level name ("Shift A", "Machine 2")
  color: string; // from operatorColors (up to 8)
  points: ProbabilityPlotPoint[];
  mean: number;
  stdDev: number;
  n: number;
  adTestPValue: number | null; // null when n < 7
}
```

**Visual behavior:**

- All series share same X scale (value domain = union of all series min/max) and Y scale (probability)
- Each series: fitted line + data points in its assigned color
- CI bands shown only for the hovered series (avoids visual noise)
- Non-hovered series dim to opacity 0.3 when one is hovered
- Legend with series name + color dot appears when multi-series

**Data pipeline:**

- New `useProbabilityPlotData` hook in `@variscout/hooks`
- Input: `values[]`, `factorColumn`, `factorValues[]`
- Groups values by factor level, calls `calculateProbabilityPlotData()` per group
- Computes mean, stdDev, n, and `andersonDarlingTest()` per group
- Assigns colors from `operatorColors`

### 2. Brush Selection + Factor Creation

Drag to select a region on the probability plot, highlighting points across all dashboard charts, with option to create a new factor from the selection.

**Interaction:**

- Drag rectangle to select region (reuses `useMultiSelection` pattern from I-Chart)
- Ctrl/Cmd+drag to add to existing selection
- Selected points highlight across all charts (I-Chart, Boxplot, Pareto)
- "Create Factor" button appears when points are selected (same `CreateFactorModal`)

**Factor creation flow:**

1. User sees inflection point or deviation on probability plot
2. Drags brush rectangle around the region
3. Selected points highlight across all charts
4. Clicks "Create Factor" → modal opens (same as I-Chart flow)
5. New factor column created: selected = "Group A", rest = "Group B"
6. Probability plot immediately shows two series if factor is active

**Technical:**

- Brush rectangle rendered at SVG root level (not inside Group), matching I-Chart pattern
- Points-in-brush detection converts pixel brush extent to data coordinates via scale.invert()
- Brush extent clamped to chart bounds

### 3. Annotations (Findings)

Right-click to create findings anchored to the probability plot, either free-floating or series-aware.

**FindingSource extension:**

```typescript
// Added to existing FindingSource union in @variscout/core/findings/types.ts
| { chart: 'probability'; anchorX: number; anchorY: number; seriesKey?: string }
```

- `anchorX` / `anchorY`: normalized 0-1 coordinates (same as I-Chart)
- `seriesKey`: factor level name if right-clicked on a specific series line; undefined for free-floating observations
- Multiple annotations supported on same chart
- `ChartAnnotationLayer` renders findings filtered by `chart: 'probability'`
- Status dot on annotation boxes (amber/blue/purple by investigation status)

**Context menu:**

- Right-click anywhere → "Add observation" (free-floating)
- Right-click on a series line → "Add observation" with seriesKey pre-filled
- Reuses existing `AnnotationContextMenu` component, extended for 'probability' chart type

### 4. Hover Card (Series Tooltip)

Hover over a series line or its data points to see statistics.

**Content:**

- Series name (with color dot)
- N (sample count)
- Mean
- StDev
- AD p-value (or "—" when n < 7)

**Behavior:**

- Appears near cursor, positioned by `useTooltipPosition` (viewport-aware)
- CI band fades in for hovered series only
- Other series dim (opacity 0.3)
- No color-coding of p-value — purely numeric, the visual slope tells the story

### 5. Anderson-Darling Normality Test

New pure function in `@variscout/core/stats/andersonDarling.ts`.

```typescript
export function andersonDarlingTest(data: number[]): {
  statistic: number; // A²* (sample-size adjusted)
  pValue: number; // from D'Agostino & Stephens (1986) approximation
};
```

**Algorithm:**

1. Sort data, standardize: z_i = (x_i - mean) / stdDev
2. Compute Φ(z_i) using existing `normalCDF` from distributions.ts
3. A² = -n - (1/n) Σ (2i-1)[ln Φ(z_i) + ln(1-Φ(z_{n+1-i}))]
4. Adjust: A²\* = A²(1 + 0.75/n + 2.25/n²)
5. p-value from D'Agostino & Stephens approximation

**Constraints:**

- Requires n ≥ 7 (returns null below that)
- Computed per series in `useProbabilityPlotData` hook
- Exported via `@variscout/core/stats` sub-path

## Package Changes

### @variscout/core (pure logic)

- **NEW** `stats/andersonDarling.ts` — AD test function
- **EDIT** `types.ts` — add `ProbabilityPlotSeries` interface
- **EDIT** `findings/types.ts` — extend FindingSource union with `'probability'` variant
- **EDIT** `stats/index.ts` — re-export `andersonDarlingTest`

### @variscout/charts (visx components)

- **REWRITE** `ProbabilityPlot.tsx` — multi-series rendering, shared axes, brush, hover, right-click
  - Accepts `series: ProbabilityPlotSeries[]`
  - Renders N lines + N point sets with operatorColors
  - Hover → highlight series, show CI band, dim others
  - Brush rectangle (reuse useMultiSelection pattern)
  - Right-click handlers with normalized coordinates + optional seriesKey
- **EDIT** `types.ts` — update `ProbabilityPlotProps`

### @variscout/hooks (React hooks)

- **NEW** `useProbabilityPlotData.ts` — groups by factor, computes ProbabilityPlotSeries[]
- **EDIT** `useAnnotationMode.ts` — handle 'probability' chart type

### @variscout/ui (shared components)

- **EDIT** `ChartAnnotationLayer` — support 'probability' finding source
- **EDIT** `AnnotationContextMenu` — add 'probability' to chart type handling
- **NEW** `ProbabilityPlotTooltip` — hover card component

### apps/pwa + apps/azure (app wiring)

- **EDIT** Probability plot wrapper — wire `useProbabilityPlotData`, pass `series[]`
- **EDIT** Dashboard — connect brush selection → cross-chart highlight + Create Factor
- **EDIT** Context menu handlers — add probability plot finding creation

## Reused Existing Patterns

No new libraries or paradigms — heavy reuse:

- `calculateProbabilityPlotData()` — existing Benard formula, called per group
- `normalQuantile()` — unchanged
- `useMultiSelection` hook — reused as-is from I-Chart for brush interaction
- `CreateFactorModal` — reused as-is for factor creation from brush
- `ChartAnnotationLayer` / `AnnotationBox` — extended, not rewritten
- `operatorColors` — 8-color array for series coloring
- `useTooltipPosition` — viewport-aware hover card placement
- `normalCDF` from distributions.ts — reused by AD test

## Verification

1. **Unit tests** (`@variscout/core`):
   - `andersonDarlingTest()` — validate against R/Minitab reference values for known datasets
   - `ProbabilityPlotSeries` grouping logic — correct split by factor, correct per-group stats

2. **Hook tests** (`@variscout/hooks`):
   - `useProbabilityPlotData` — single factor, multiple factors, empty groups, n < 7 edge case

3. **Component tests** (`@variscout/charts`):
   - Multi-series renders correct number of lines and point sets
   - Brush selection identifies correct points
   - Right-click provides normalized coordinates + seriesKey

4. **Visual verification** (Chrome browser):
   - Load sample data with factor column → verify overlaid series with distinct colors
   - Hover over series → tooltip appears with correct stats, CI band shows, others dim
   - Brush region → points highlight across I-Chart/Boxplot/Pareto
   - Brush → Create Factor → new series appear on probability plot
   - Right-click on chart → finding created, annotation box visible
   - Right-click on series line → finding includes seriesKey

5. **Storybook**:
   - Update existing stories for multi-series variants
   - Add story for brush interaction
