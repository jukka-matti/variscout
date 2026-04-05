---
title: 'Probability Plot'
---

# Probability Plot

Multi-series normality assessment chart with brush selection, annotations, and Anderson-Darling test.

## Overview

The ProbabilityPlot component displays data against a theoretical normal distribution to assess normality. Points falling along the fitted line indicate normally distributed data. Supports overlaying multiple factor levels for visual comparison of process steps, machines, or operators.

| Component           | Purpose                         | Data Source               |
| ------------------- | ------------------------------- | ------------------------- |
| **ProbabilityPlot** | Multi-series normality analysis | `ProbabilityPlotSeries[]` |

**Source:** `packages/charts/src/ProbabilityPlot.tsx`

---

## ProbabilityPlot

Shows one or more series plotted against expected percentiles with 95% confidence interval bands. Uses probability-transformed Y-axis (inverse normal CDF) following Minitab conventions.

### Props Interface

```typescript
interface ProbabilityPlotProps extends BaseChartProps {
  /** Series data (one per factor level, or single "All" series) */
  series: ProbabilityPlotSeries[];
  /** Optional custom margin override */
  marginOverride?: ChartMargins;
  /** Optional custom font sizes override */
  fontsOverride?: ChartFonts;
  /** Currently selected point indices (for brush selection) */
  selectedPoints?: Set<number>;
  /** Callback when brush selection changes */
  onSelectionChange?: (indices: Set<number>) => void;
  /** Right-click context menu callback */
  onChartContextMenu?: (anchorX: number, anchorY: number, seriesKey?: string) => void;
  /** Series hover callback for tooltip */
  onSeriesHover?: (
    series: ProbabilityPlotSeries | null,
    position: { x: number; y: number }
  ) => void;
}
```

### Data Type

```typescript
interface ProbabilityPlotSeries {
  key: string; // Factor level name or "All"
  points: ProbabilityPlotPoint[];
  mean: number;
  stdDev: number;
  n: number;
  adTestPValue: number | null; // null when n < 7
  originalIndices: number[]; // For brush → cross-chart highlight
}
```

### Example

```tsx
import { ProbabilityPlotBase } from '@variscout/charts';
import { useProbabilityPlotData } from '@variscout/hooks';

const series = useProbabilityPlotData({ values, factorColumn, rows });

<ProbabilityPlotBase series={series} parentWidth={600} parentHeight={500} />;
```

---

## Multi-Series Overlay

When a factor column is active, one colored line per factor level is rendered on shared axes.

| Behavior    | Description                                                                      |
| ----------- | -------------------------------------------------------------------------------- |
| Colors      | `operatorColors` palette (up to 8), single series uses `chartColors.mean` (blue) |
| Shared axes | X domain = union of all series min/max                                           |
| Hover       | Hovered series highlighted, others dim to opacity 0.3                            |
| CI bands    | Shown only for the hovered series (avoids clutter)                               |
| Legend      | Color dot + series name, shown when multi-series                                 |

**Factor selection:** The probability plot is linked to the Boxplot factor selector — when the analyst selects a factor in the Boxplot dropdown, the probability plot automatically groups by the same factor. Data flow: `boxplotFactor` from `projectStore` → `useProbabilityPlotData({ values, factorColumn, rows })` → multi-series rendering.

**Slope interpretation:** Steeper line = smaller StDev = better capability. Parallel lines = same spread, different means (location shift). Different slopes = variability problem.

---

## Interactions

### Brush Selection

Drag to select a region. Points inside the brush highlight across all dashboard charts.

- Reuses `useMultiSelection` hook from I-Chart
- Ctrl/Cmd+drag to add to existing selection
- "Create Factor" button appears (same `CreateFactorModal` as I-Chart)
- Brush rectangle rendered at SVG root level (not inside Group)

### Annotations (Findings)

Right-click to create findings anchored to the probability plot.

```typescript
// FindingSource variant
{ chart: 'probability'; anchorX: number; anchorY: number; seriesKey?: string }
```

- Free-floating (like I-Chart): right-click anywhere, normalized 0-1 coordinates
- Series-aware: right-click on a series line, `seriesKey` captures which series
- Multiple annotations supported
- `ChartAnnotationLayer` renders findings filtered by `chart: 'probability'`

### Hover Card (Tooltip)

`ProbabilityPlotTooltip` component shows per-series stats on hover:

- Series name
- N (sample count)
- Mean
- StDev
- AD p-value (or "—" when n < 7)

Positioned by `useTooltipPosition` for viewport awareness.

---

## Anderson-Darling Test

`andersonDarlingTest()` in `@variscout/core/stats/andersonDarling.ts`.

Tests whether data comes from a normal distribution. Computed per series in `useProbabilityPlotData`.

| p-value  | Interpretation                |
| -------- | ----------------------------- |
| p > 0.05 | No evidence against normality |
| p < 0.05 | Data deviates from normal     |

Requires n ≥ 7. Returns `{ statistic: number; pValue: number }`.

---

## Visual Elements

| Element              | Description                                              |
| -------------------- | -------------------------------------------------------- |
| **Data points**      | Colored circles per series with white stroke             |
| **Fitted line**      | Straight line per series (theoretical normal)            |
| **CI bands**         | Shaded area with dashed boundaries (hovered series only) |
| **Grid**             | Horizontal lines at standard percentile positions        |
| **Y-axis (Percent)** | Probability-transformed scale                            |
| **X-axis**           | Data values (shared across series)                       |
| **Brush rectangle**  | Semi-transparent blue selection area                     |
| **Legend**           | Color dots with series names (multi-series only)         |

### Probability Percentile Scale

- Full display (≥ 300px): 1, 5, 10, 25, 50, 75, 90, 95, 99%
- Compact display (< 300px): 5, 25, 50, 75, 95%

---

## Data Flow

```
DataContext (values, factorColumn, rows)
    │
useProbabilityPlotData (hooks)
    │ groups by factor, calculateProbabilityPlotData() per group
    │ andersonDarlingTest() per group (n ≥ 7)
    ↓
ProbabilityPlotSeries[]
    │
ProbabilityPlotBase (charts)
    │ renders multi-series SVG, brush, context menu
    ↓
ProbabilityPlotTooltip (ui) — hover card
ChartAnnotationLayer (ui) — findings overlay
```

---

## Responsive Behavior

| Width Range | Y-Axis Label | Tick Percentiles                 | X-Axis Ticks |
| ----------- | ------------ | -------------------------------- | ------------ |
| < 300px     | Hidden       | 5, 25, 50, 75, 95 (compact)      | 4            |
| ≥ 300px     | "Percent"    | 1, 5, 10, 25, 50, 75, 90, 95, 99 | 6            |

---

## Exports

```typescript
// Charts package
import { ProbabilityPlotBase } from '@variscout/charts';
import ProbabilityPlot from '@variscout/charts/ProbabilityPlot';

// Core stats
import {
  calculateProbabilityPlotData,
  normalQuantile,
  andersonDarlingTest,
  normalCDF,
} from '@variscout/core/stats';
import type { ProbabilityPlotSeries, ProbabilityPlotPoint } from '@variscout/core';

// Hooks
import { useProbabilityPlotData } from '@variscout/hooks';

// UI
import { ProbabilityPlotTooltip } from '@variscout/ui';
```

---

## See Also

- [Overview](./overview.md) - Chart design system overview and selection guide
- [Colors](./colors.md) - Chart color constants
- [Responsive](./responsive.md) - Breakpoints and scaling utilities
- [Capability](./capability.md) - Distribution histograms
