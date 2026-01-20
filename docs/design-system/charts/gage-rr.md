# Gage R&R Charts

Measurement system analysis charts for assessing repeatability and reproducibility.

## Overview

VariScout provides two chart components for Gage R&R (Repeatability and Reproducibility) analysis:

| Component           | Purpose                      | Data Source           |
| ------------------- | ---------------------------- | --------------------- |
| **GageRRChart**     | Variance component breakdown | Percentage values     |
| **InteractionPlot** | Operator × Part interaction  | `GageRRInteraction[]` |

**Source:** `packages/charts/src/GageRRChart.tsx`, `packages/charts/src/InteractionPlot.tsx`

---

## GageRRChart

Horizontal bar chart showing the percentage breakdown of variance components in a measurement system study.

### Props Interface

```typescript
interface GageRRChartProps {
  /** % contribution from Part-to-Part */
  pctPart: number;
  /** % contribution from Repeatability (Equipment) */
  pctRepeatability: number;
  /** % contribution from Reproducibility (Operator + Interaction) */
  pctReproducibility: number;
  /** Total %GRR */
  pctGRR: number;
  /** Container width from withParentSize */
  parentWidth: number;
  /** Container height from withParentSize */
  parentHeight: number;
  /** Show branding footer */
  showBranding?: boolean;
  /** Custom branding text */
  brandingText?: string;
}
```

### Variance Components

| Component           | Color | Description                                    |
| ------------------- | ----- | ---------------------------------------------- |
| **Part-to-Part**    | Green | Actual variation between measured parts        |
| **Repeatability**   | Blue  | Equipment variation (same operator, same part) |
| **Reproducibility** | Amber | Operator variation (different operators)       |

### Reference Lines

| Threshold | Color | Interpretation                  |
| --------- | ----- | ------------------------------- |
| 10%       | Green | Excellent measurement system    |
| 30%       | Red   | Unacceptable measurement system |

A measurement system is considered:

- **Acceptable:** %GRR < 10%
- **Marginal:** 10% <= %GRR < 30%
- **Unacceptable:** %GRR >= 30%

### Example

```tsx
import GageRRChart from '@variscout/charts/GageRRChart';

<GageRRChart pctPart={75.2} pctRepeatability={15.3} pctReproducibility={9.5} pctGRR={24.8} />;
```

### Visual Elements

| Element               | Description                               |
| --------------------- | ----------------------------------------- |
| **Background bars**   | Gray bars showing 100% scale              |
| **Value bars**        | Colored bars showing actual percentage    |
| **Percentage labels** | Values displayed to the right of each bar |
| **Category labels**   | Component names on left Y-axis            |
| **X-axis**            | Percentage scale (0-100%)                 |
| **Threshold lines**   | Vertical dashed lines at 10% and 30%      |

---

## InteractionPlot

Multi-line plot showing the interaction between operators and parts. Used to assess whether operators measure parts consistently.

### Props Interface

```typescript
interface InteractionPlotProps {
  /** Interaction data from Gage R&R result */
  data: GageRRInteraction[];
  /** Container width from withParentSize */
  parentWidth: number;
  /** Container height from withParentSize */
  parentHeight: number;
  /** Show branding footer */
  showBranding?: boolean;
  /** Custom branding text */
  brandingText?: string;
}
```

### Data Structure

```typescript
interface GageRRInteraction {
  /** Part identifier */
  part: string;
  /** Operator identifier */
  operator: string;
  /** Mean measurement for this operator × part combination */
  mean: number;
}
```

Use `calculateGageRR()` from `@variscout/core` to compute this data.

### Example

```tsx
import InteractionPlot from '@variscout/charts/InteractionPlot';

const interactionData: GageRRInteraction[] = [
  { part: 'Part 1', operator: 'Op A', mean: 100.2 },
  { part: 'Part 1', operator: 'Op B', mean: 100.5 },
  { part: 'Part 2', operator: 'Op A', mean: 99.8 },
  { part: 'Part 2', operator: 'Op B', mean: 99.7 },
  // ...
];

<InteractionPlot data={interactionData} />;
```

### Interpretation

| Pattern              | Meaning                                   |
| -------------------- | ----------------------------------------- |
| **Parallel lines**   | No interaction - operators are consistent |
| **Crossing lines**   | Interaction present - operators differ    |
| **Tight clustering** | Good repeatability                        |
| **Wide spread**      | Poor repeatability                        |

### Visual Elements

| Element    | Description                                  |
| ---------- | -------------------------------------------- |
| **Lines**  | One line per operator, connecting part means |
| **Points** | Circles at each operator × part intersection |
| **Legend** | Operator names with color-coded markers      |
| **X-axis** | Part identifiers                             |
| **Y-axis** | Mean measurement value                       |

---

## Operator Colors

Both charts use a consistent 8-color palette for operators/series:

```typescript
const operatorColors = [
  '#3b82f6', // blue-500
  '#22c55e', // green-500
  '#f59e0b', // amber-500
  '#ef4444', // red-500
  '#8b5cf6', // violet-500
  '#ec4899', // pink-500
  '#06b6d4', // cyan-500
  '#84cc16', // lime-500
];
```

---

## Data Flow

### GageRRChart

```
DataContext (PWA/Azure)
    |
GageRRPanel.tsx
    | calculateGageRR() from @variscout/core
    | Extract: pctPart, pctRepeatability, pctReproducibility, pctGRR
GageRRChart (responsive wrapper)
    |
GageRRChartBase (renders SVG)
```

### InteractionPlot

```
DataContext (PWA/Azure)
    |
GageRRPanel.tsx
    | calculateGageRR() from @variscout/core
    | Extract: interactionData: GageRRInteraction[]
InteractionPlot (responsive wrapper)
    | Group data by operator
    | Sort by part order
InteractionPlotBase (renders SVG)
```

---

## Interactions

### Hover Tooltip

GageRRChart tooltip shows:

- Component label
- Percentage value
- Description of what the component measures

InteractionPlot tooltip shows:

- Operator name × Part name
- Mean measurement value

---

## Cross-App Usage

### PWA and Azure

Use the responsive wrapper (auto-sizing with `withParentSize`):

```tsx
import GageRRChart from '@variscout/charts/GageRRChart';
import InteractionPlot from '@variscout/charts/InteractionPlot';

// Variance breakdown
<div className="h-[200px]">
  <GageRRChart
    pctPart={75.2}
    pctRepeatability={15.3}
    pctReproducibility={9.5}
    pctGRR={24.8}
  />
</div>

// Interaction plot
<div className="h-[300px]">
  <InteractionPlot data={interactionData} />
</div>
```

### Excel Add-in

Use the Base variant with explicit sizing:

```tsx
import { GageRRChartBase } from '@variscout/charts/GageRRChart';
import { InteractionPlotBase } from '@variscout/charts/InteractionPlot';

// Variance breakdown with explicit size
<GageRRChartBase
  parentWidth={400}
  parentHeight={180}
  pctPart={75.2}
  pctRepeatability={15.3}
  pctReproducibility={9.5}
  pctGRR={24.8}
/>

// Interaction plot with explicit size
<InteractionPlotBase
  parentWidth={500}
  parentHeight={280}
  data={interactionData}
/>
```

---

## Colors and Theming

### GageRRChart Bar Colors

```typescript
// Part-to-Part
fill={chartColors.pass}       // green-500

// Repeatability
fill={chartColors.mean}       // blue-500

// Reproducibility
fill={chartColors.warning}    // amber-500
```

### Reference Line Colors

```typescript
// 10% threshold (excellent)
stroke={chartColors.pass}     // green-500

// 30% threshold (unacceptable)
stroke={chartColors.fail}     // red-500
```

### InteractionPlot Line Colors

Uses `operatorColors` palette (see above). Each operator is assigned a unique color from the palette.

### Theme Colors

Both components use hardcoded dark theme colors from `chromeColors`:

- Background: `chromeColors.barBackground`
- Labels: `chromeColors.labelSecondary`
- Axes: `chromeColors.stageDivider`
- Point stroke: `chromeColors.pointStroke`

---

## Custom Margins

Both charts use custom margins different from standard responsive margins:

**GageRRChart:**

```typescript
{
  top: 20,
  right: 60,    // Space for percentage labels
  bottom: 30 + sourceBarHeight,
  left: 100,    // Space for category labels
}
```

**InteractionPlot:**

```typescript
{
  top: 30,
  right: 100,   // Legend space
  bottom: 50 + sourceBarHeight,
  left: 60,
}
```

---

## Exports

```typescript
// Responsive wrappers (auto-sizing)
import GageRRChart from '@variscout/charts/GageRRChart';
import InteractionPlot from '@variscout/charts/InteractionPlot';

// Base components (manual sizing)
import { GageRRChartBase } from '@variscout/charts/GageRRChart';
import { InteractionPlotBase } from '@variscout/charts/InteractionPlot';

// Types
import type { GageRRChartProps } from '@variscout/charts';
import type { InteractionPlotProps } from '@variscout/charts';
import type { GageRRInteraction } from '@variscout/core';

// Color palette
import { operatorColors } from '@variscout/charts';
```

---

## See Also

- [README](./README.md) - Chart design system overview and selection guide
- [Colors](./colors.md) - Chart color constants and operator palette
- [Responsive](./responsive.md) - Breakpoints and scaling utilities
- [Hooks](./hooks.md) - useChartLayout, useChartTooltip
- [Overview](./overview.md) - All chart types and common patterns
- [Boxplot](./boxplot.md) - Distribution comparison charts
