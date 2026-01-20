# Probability Plot

Normality assessment chart with 95% confidence intervals following Minitab conventions.

## Overview

The ProbabilityPlot component displays data against a theoretical normal distribution to assess normality. Points falling along the fitted line indicate normally distributed data.

| Component           | Purpose              | Data Source |
| ------------------- | -------------------- | ----------- |
| **ProbabilityPlot** | Normality assessment | `number[]`  |

**Source:** `packages/charts/src/ProbabilityPlot.tsx`

---

## ProbabilityPlot

Shows data points plotted against expected percentiles with 95% confidence interval bands. Uses probability-transformed Y-axis (inverse normal CDF) following Minitab conventions.

### Props Interface

```typescript
interface ProbabilityPlotProps extends BaseChartProps {
  /** Raw numeric values */
  data: number[];
  /** Mean for theoretical line */
  mean: number;
  /** Standard deviation for theoretical line */
  stdDev: number;
  /** Optional custom margin override */
  marginOverride?: { top: number; right: number; bottom: number; left: number };
  /** Optional custom font sizes override */
  fontsOverride?: ChartFonts;
  /** Optional signature element to render */
  signatureElement?: React.ReactNode;
}
```

### Example

```tsx
import ProbabilityPlot from '@variscout/charts/ProbabilityPlot';

<ProbabilityPlot data={measurementValues} mean={stats.mean} stdDev={stats.stdDev} />;
```

---

## Visual Elements

| Element              | Description                                                      |
| -------------------- | ---------------------------------------------------------------- |
| **Data points**      | Green circles with white stroke                                  |
| **Fitted line**      | Blue straight line (theoretical normal)                          |
| **CI bands**         | Light blue shaded area with dashed boundaries                    |
| **Grid**             | Horizontal lines at standard percentile positions                |
| **Y-axis (Percent)** | Probability-transformed scale (1, 5, 10, 25, 50, 75, 90, 95, 99) |
| **X-axis**           | Data values                                                      |

### Probability Percentile Scale

The Y-axis uses standard percentile tick values:

- Full display: 1, 5, 10, 25, 50, 75, 90, 95, 99%
- Compact display (< 300px): 5, 25, 50, 75, 95%

These percentiles are transformed using the inverse normal CDF (z-scores) to create a probability-scaled axis.

---

## Confidence Interval Bands

The 95% CI bands widen at the extremes (low and high percentiles) following MLE variance propagation:

```typescript
function calculateCIWidth(
  p: number,      // percentile as decimal (0-1)
  n: number,      // sample size
  stdDev: number  // sample standard deviation
): number {
  const z = normalQuantile(p);

  // Variance includes:
  // 1. Uncertainty in mean estimation: σ²/n
  // 2. Uncertainty in std dev propagated through z: z² * σ²/(2n)
  const varPercentile = (stdDev² / n) * (1 + z² / 2);
  const sePercentile = Math.sqrt(varPercentile);

  // 95% CI half-width
  return 1.96 * sePercentile;
}
```

This creates smooth, symmetric CI bands that naturally widen at distribution tails.

---

## Interpretation

| Pattern                    | Meaning                      |
| -------------------------- | ---------------------------- |
| Points on fitted line      | Data is normally distributed |
| Points curve away at ends  | Heavy tails (leptokurtic)    |
| Points curve toward center | Light tails (platykurtic)    |
| S-shaped deviation         | Skewed distribution          |
| Points outside CI bands    | Significant non-normality    |

---

## Data Flow

```
DataContext (PWA/Azure)
    |
StatsPanel.tsx
    | data: number[], mean, stdDev from stats
ProbabilityPlot (responsive wrapper)
    | calculateProbabilityPlotData() from @variscout/core
    | normalQuantile() for z-scores
ProbabilityPlotBase (renders SVG)
```

### Plot Data Calculation

Uses `calculateProbabilityPlotData()` from `@variscout/core`:

```typescript
// For each data point:
// 1. Sort data ascending
// 2. Calculate expected percentile using (i - 0.5) / n formula
// 3. Return { value, expectedPercentile }
```

---

## Cross-App Usage

### PWA and Azure

Use the responsive wrapper (auto-sizing with `withParentSize`):

```tsx
import ProbabilityPlot from '@variscout/charts/ProbabilityPlot';

<div className="h-[400px]">
  <ProbabilityPlot data={values} mean={stats.mean} stdDev={stats.stdDev} />
</div>;
```

### Excel Add-in

Use the Base variant with explicit sizing:

```tsx
import { ProbabilityPlotBase } from '@variscout/charts/ProbabilityPlot';

<ProbabilityPlotBase
  parentWidth={500}
  parentHeight={350}
  data={values}
  mean={stats.mean}
  stdDev={stats.stdDev}
/>;
```

### Custom Margins and Fonts

```tsx
<ProbabilityPlot
  data={values}
  mean={mean}
  stdDev={stdDev}
  marginOverride={{ top: 20, right: 30, bottom: 50, left: 60 }}
  fontsOverride={{ tickLabel: 10, axisLabel: 12, statLabel: 10, tooltipText: 11, brandingText: 9 }}
/>
```

---

## Colors and Theming

### Point Colors

All data points use `chartColors.pass` (green) with white stroke.

### Line Colors

```typescript
// Fitted distribution line
stroke={chartColors.linear}       // blue-500

// CI boundary lines
stroke={chromeColors.labelMuted}  // gray, dashed
```

### CI Band Fill

```typescript
fill={chromeColors.ciband}        // blue-500 with 15% opacity
```

### Theme Colors

Uses hardcoded dark theme colors from `chromeColors`:

- Grid: `chromeColors.tooltipBorder`
- Labels: `chromeColors.labelSecondary`
- Axes: `chromeColors.labelMuted`

---

## Responsive Behavior

| Width Range | Y-Axis Label | Tick Percentiles                 | X-Axis Ticks |
| ----------- | ------------ | -------------------------------- | ------------ |
| < 300px     | Hidden       | 5, 25, 50, 75, 95 (compact)      | 4            |
| >= 300px    | "Percent"    | 1, 5, 10, 25, 50, 75, 90, 95, 99 | 6            |

---

## Mathematical Background

### Probability Transformation

The Y-axis uses the inverse normal CDF (quantile function):

```typescript
const z = normalQuantile(p); // Convert percentile to z-score
```

This transformation makes normally distributed data appear as a straight line because:

- For normal data: X_p = μ + z_p × σ
- When plotted with z on Y-axis and X on X-axis, the relationship is linear

### Fitted Line Points

The fitted line represents the theoretical normal distribution:

```typescript
const fittedLineWithCI = percentiles.map(p => {
  const pDecimal = p / 100;
  const z = normalQuantile(pDecimal);
  const expectedX = mean + z * stdDev; // Theoretical value
  const ciWidth = calculateCIWidth(pDecimal, n, stdDev);

  return {
    z,
    x: expectedX,
    lowerCI: expectedX - ciWidth,
    upperCI: expectedX + ciWidth,
  };
});
```

---

## Signature Element

An optional `signatureElement` prop allows rendering custom content (like a logo or signature) within the chart:

```tsx
<ProbabilityPlot data={values} mean={mean} stdDev={stdDev} signatureElement={<CustomSignature />} />
```

---

## Exports

```typescript
// Responsive wrapper (auto-sizing)
import ProbabilityPlot from '@variscout/charts/ProbabilityPlot';

// Base component (manual sizing)
import { ProbabilityPlotBase } from '@variscout/charts/ProbabilityPlot';

// Types
import type { ProbabilityPlotProps } from '@variscout/charts';

// Core functions
import { calculateProbabilityPlotData, normalQuantile } from '@variscout/core';
```

---

## See Also

- [README](./README.md) - Chart design system overview and selection guide
- [Colors](./colors.md) - Chart color constants
- [Responsive](./responsive.md) - Breakpoints and scaling utilities
- [Hooks](./hooks.md) - useChartLayout
- [Overview](./overview.md) - All chart types and common patterns
- [Scatter Plot](./scatter.md) - Regression analysis
- [Capability](./capability.md) - Distribution histograms
