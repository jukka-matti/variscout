# Scatter Plot

X-Y relationship visualization with regression analysis and R² strength rating.

## Overview

The ScatterPlot component displays the relationship between two variables with both linear and quadratic regression fits.

| Component       | Purpose                  | Data Source        |
| --------------- | ------------------------ | ------------------ |
| **ScatterPlot** | X-Y correlation analysis | `RegressionResult` |

**Source:** `packages/charts/src/ScatterPlot.tsx`

---

## ScatterPlot

Shows data points with regression lines and R² strength rating. Automatically displays the recommended fit (linear or quadratic) more prominently.

### Props Interface

```typescript
interface ScatterPlotProps extends BaseChartProps {
  /** Regression result with points and fit data */
  regression: RegressionResult;
  /** Specification limits for Y axis */
  specs?: SpecLimits;
  /** X-axis label */
  xAxisLabel?: string;
  /** Y-axis label */
  yAxisLabel?: string;
  /** Show stars for R² strength */
  showStars?: boolean;
  /** Callback when chart is clicked (for expansion) */
  onClick?: () => void;
}
```

### Data Structure

```typescript
interface RegressionResult {
  /** X column name */
  xColumn: string;
  /** Y column name */
  yColumn: string;
  /** Sample size */
  n: number;
  /** Data points */
  points: Array<{ x: number; y: number }>;
  /** Linear regression coefficients */
  linear: {
    slope: number;
    intercept: number;
    rSquared: number;
  };
  /** Quadratic regression coefficients (null if not computed) */
  quadratic: {
    a: number; // x² coefficient
    b: number; // x coefficient
    c: number; // constant
    rSquared: number;
  } | null;
  /** Which fit is recommended */
  recommendedFit: 'linear' | 'quadratic' | 'none';
  /** R² strength rating (1-5 stars) */
  strengthRating: number;
  /** Plain-text insight about the relationship */
  insight: string;
}
```

Use `analyzeRegression()` from `@variscout/core` to compute this result from raw data.

### Example

```tsx
import ScatterPlot from '@variscout/charts/ScatterPlot';
import { analyzeRegression } from '@variscout/core';

const regression = analyzeRegression(data, 'temperature', 'output');

<ScatterPlot
  regression={regression}
  specs={{ usl: 105, lsl: 95 }}
  xAxisLabel="Temperature (°C)"
  yAxisLabel="Output (g)"
  showStars={true}
  onClick={() => openExpandedView()}
/>;
```

---

## Visual Elements

| Element             | Description                                        |
| ------------------- | -------------------------------------------------- |
| **Data points**     | Green circles with white stroke                    |
| **Linear line**     | Blue line (solid if recommended, dashed if not)    |
| **Quadratic curve** | Violet curve (shown when quadratic is recommended) |
| **Spec limits**     | Horizontal dashed lines (USL red, LSL amber)       |
| **R² label**        | Top-right corner with star rating                  |
| **Grid**            | Horizontal and vertical grid lines                 |
| **Axes**            | Labels shown when width > 250px                    |

### Regression Line Display

The chart shows both linear and quadratic fits with visual emphasis on the recommended one:

| Recommended Fit | Linear Line                | Quadratic Curve    |
| --------------- | -------------------------- | ------------------ |
| `linear`        | Blue, solid, 2px           | Not shown          |
| `quadratic`     | Gray, dashed, 1px (dimmed) | Violet, solid, 2px |
| `none`          | Gray, dashed, 1px          | Not shown          |

---

## R² Strength Rating

The chart displays a 5-star rating based on R² value:

| R² Range    | Stars | Interpretation |
| ----------- | ----- | -------------- |
| < 0.25      | ★☆☆☆☆ | Very weak      |
| 0.25 - 0.50 | ★★☆☆☆ | Weak           |
| 0.50 - 0.70 | ★★★☆☆ | Moderate       |
| 0.70 - 0.85 | ★★★★☆ | Strong         |
| >= 0.85     | ★★★★★ | Very strong    |

Stars are displayed in yellow (`chartColors.star`) next to the R² value when `showStars={true}` and width > 200px.

---

## Data Flow

```
DataContext (PWA/Azure)
    |
RegressionPanel.tsx
    | analyzeRegression() from @variscout/core
ScatterPlot (responsive wrapper)
    | Compute linear/quadratic line points
ScatterPlotBase (renders SVG)
```

---

## Interactions

### Click Behavior

```tsx
// Chart click - typically opens expanded view
onClick={() => {
  setExpandedChart('scatter');
}}
```

The entire chart is clickable when `onClick` is provided.

### Hover Tooltip

Tooltip shows:

- X value (with axis label)
- Y value (with axis label)

```tsx
// Tooltip content
{xAxisLabel || 'X'}: {tooltipData.x.toFixed(3)}
{yAxisLabel || 'Y'}: {tooltipData.y.toFixed(3)}
```

---

## Cross-App Usage

### PWA and Azure

Use the responsive wrapper (auto-sizing with `withParentSize`):

```tsx
import ScatterPlot from '@variscout/charts/ScatterPlot';

<div className="h-[400px]">
  <ScatterPlot
    regression={regressionResult}
    xAxisLabel="Input"
    yAxisLabel="Output"
    showStars={true}
  />
</div>;
```

### Excel Add-in

Use the Base variant with explicit sizing:

```tsx
import { ScatterPlotBase } from '@variscout/charts/ScatterPlot';

<ScatterPlotBase
  parentWidth={500}
  parentHeight={350}
  regression={regressionResult}
  xAxisLabel="Input"
  yAxisLabel="Output"
/>;
```

---

## Colors and Theming

### Point Colors

All data points use `chartColors.pass` (green) with white stroke.

### Regression Line Colors

```typescript
// Linear fit (recommended)
stroke={chartColors.linear}   // blue-500

// Linear fit (not recommended)
stroke={chromeColors.labelMuted}  // gray, dashed

// Quadratic fit
stroke={chartColors.quadratic}    // violet-500
```

### Spec Limit Colors

```typescript
// USL
stroke={chartColors.spec}     // red-500

// LSL
stroke={chartColors.warning}  // amber-500
```

### Theme Colors

Uses hardcoded dark theme colors from `chromeColors`:

- Grid: `chromeColors.tooltipBorder`
- Labels: `chromeColors.labelSecondary`
- Axes: `chromeColors.axisSecondary`

---

## Quadratic Curve Generation

The quadratic curve is generated with 50 points for smooth rendering:

```typescript
function generateQuadraticCurve(
  a: number,
  b: number,
  c: number,
  xMin: number,
  xMax: number,
  numPoints: number = 50
): Array<{ x: number; y: number }> {
  const points = [];
  const step = (xMax - xMin) / (numPoints - 1);

  for (let i = 0; i < numPoints; i++) {
    const x = xMin + i * step;
    const y = a * x * x + b * x + c; // y = ax² + bx + c
    points.push({ x, y });
  }

  return points;
}
```

---

## Responsive Behavior

| Width Range | Axis Labels | Stars  | Tick Count |
| ----------- | ----------- | ------ | ---------- |
| < 200px     | Hidden      | Hidden | 4          |
| 200-250px   | Hidden      | Shown  | 4          |
| 250-300px   | Shown       | Shown  | 4          |
| > 300px     | Shown       | Shown  | 6          |

---

## Exports

```typescript
// Responsive wrapper (auto-sizing)
import ScatterPlot from '@variscout/charts/ScatterPlot';

// Base component (manual sizing)
import { ScatterPlotBase } from '@variscout/charts/ScatterPlot';

// Types
import type { ScatterPlotProps } from '@variscout/charts';
import type { RegressionResult } from '@variscout/core';
```

---

## See Also

- [README](./README.md) - Chart design system overview and selection guide
- [Colors](./colors.md) - Chart color constants
- [Responsive](./responsive.md) - Breakpoints and scaling utilities
- [Hooks](./hooks.md) - useChartLayout, useChartTooltip
- [Overview](./overview.md) - All chart types and common patterns
- [Probability Plot](./probability-plot.md) - Normality assessment
