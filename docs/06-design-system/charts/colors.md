---
title: 'Chart Colors'
---

# Chart Colors

Data visualization colors for VariScout charts.

## Implementation

All chart colors are centralized in `packages/charts/src/colors.ts`. **Never hardcode hex values in chart components** - always import from the colors module.

```typescript
import { chartColors, chromeColors, operatorColors } from './colors';

// Data point colors
fill={chartColors.pass}      // #22c55e - within spec
fill={chartColors.fail}      // #ef4444 - above USL
fill={chartColors.warning}   // #f59e0b - below LSL

// Line colors
stroke={chartColors.mean}    // #3b82f6 - center line
stroke={chartColors.spec}    // #ef4444 - spec limits

// Multi-series
fill={operatorColors[index]} // 8-color array for categories

// UI chrome
fill={chromeColors.tooltipBg}      // #1e293b
fill={chromeColors.labelSecondary} // #94a3b8
```

## Data Point Colors

### I-Chart Color Scheme (Minitab-style)

The I-Chart uses a simplified 2-color scheme following Minitab conventions. Color encodes severity; shape additionally encodes the rule type (dual encoding):

| Status         | Color | Shape     | Hex       | Conditions                                              |
| -------------- | ----- | --------- | --------- | ------------------------------------------------------- |
| In-control     | Blue  | ● Circle  | `#3b82f6` | All checks pass                                         |
| Out-of-control | Red   | ● Circle  | `#ef4444` | Spec or control limit violation                         |
| Nelson Rule 2  | Red   | ◆ Diamond | `#ef4444` | 9+ consecutive points on same side of center line       |
| Nelson Rule 3  | Red   | ■ Square  | `#ef4444` | 6+ strictly increasing or decreasing consecutive values |

Shape encodes rule type so patterns remain distinguishable at a glance (and in grayscale). When multiple rules fire on the same point, the highest-priority shape is rendered: spec/control violation (●) > Rule 2 (◆) > Rule 3 (■).

**Violation checks (in order):**

1. Spec limit violations: `value > USL` or `value < LSL`
2. Control limit violations: `value > UCL` or `value < LCL`
3. Nelson Rule 2: 9+ consecutive points on same side of center line
4. Nelson Rule 3: 6+ strictly increasing or decreasing consecutive values

```tsx
const getPointColor = (value: number, index: number): string => {
  // Spec limit violations -> Red
  if (usl !== undefined && value > usl) return chartColors.fail;
  if (lsl !== undefined && value < lsl) return chartColors.fail;

  // Control limit violations -> Red
  if (value > ucl || value < lcl) return chartColors.fail;

  // Nelson Rule 2 violations -> Red
  if (nelsonRule2Violations.has(index)) return chartColors.fail;

  // Nelson Rule 3 violations -> Red
  if (nelsonRule3Violations.has(index)) return chartColors.fail;

  // In-control -> Blue
  return chartColors.mean;
};

const getPointShape = (value: number, index: number): ViolationShape => {
  // Spec or control limit violation -> Circle (highest priority)
  const isSpecViolation = (usl !== undefined && value > usl) || (lsl !== undefined && value < lsl);
  const isControlViolation = value > ucl || value < lcl;
  if (isSpecViolation || isControlViolation) return 'circle';

  // Nelson Rule 2 -> Diamond
  if (nelsonRule2Violations.has(index)) return 'diamond';

  // Nelson Rule 3 -> Square
  if (nelsonRule3Violations.has(index)) return 'square';

  // In-control -> Circle
  return 'circle';
};
```

### Nelson Rule 2 Detection

Nelson Rule 2 identifies when 9 or more consecutive points fall on the same side of the center line (mean). This indicates a shift in the process, even if individual points remain within control limits.

**Implementation:** `getNelsonRule2ViolationPoints()` in `@variscout/core/stats.ts`

**Staged mode:** Nelson Rule 2 is computed per-stage using each stage's mean.

### Direction Color Semantics

When a [characteristic type](../../03-features/analysis/characteristic-types.md) is set, control violation colors gain directional meaning:

- **Green** = favorable signal (process moved toward quality goal)
- **Red** = harmful signal (process moved away from goal)
- **Orange** = spec violation (always harmful, regardless of direction)

This applies to I-Chart dots and Boxplot category fills. The color palette itself doesn't change — the assignment logic changes based on whether a deviation is toward or away from the quality target.

## Line Colors

| Element    | Hex       | Style        | Usage            |
| ---------- | --------- | ------------ | ---------------- |
| USL        | `#ef4444` | Dashed (6,3) | Upper spec limit |
| LSL        | `#f59e0b` | Dashed (6,3) | Lower spec limit |
| Target     | `#22c55e` | Dashed (4,4) | Target value     |
| UCL/LCL    | `#06b6d4` | Dashed (4,4) | Control limits   |
| Mean/CL    | `#64748b` | Solid        | Center line      |
| Regression | `#3b82f6` | Solid        | Linear fit       |
| Quadratic  | `#8b5cf6` | Solid        | Polynomial fit   |

## Grid & Axis

| Element      | Hex       | Opacity | Usage           |
| ------------ | --------- | ------- | --------------- |
| Grid rows    | `#334155` | 50%     | Horizontal grid |
| Grid columns | `#334155` | 30%     | Vertical grid   |
| Axis stroke  | `#64748b` | 100%    | Axis lines      |
| Tick stroke  | `#64748b` | 100%    | Tick marks      |
| Axis labels  | `#94a3b8` | 100%    | Axis text       |

## Category Colors

For multi-series charts (Boxplot, InteractionPlot):

```tsx
const CATEGORY_COLORS = [
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

## Pareto Chart

| Element         | Hex       | Usage                 |
| --------------- | --------- | --------------------- |
| Default bar     | `#3b82f6` | Unselected bars       |
| Selected bar    | `#0ea5e9` | Currently filtered    |
| Unselected bar  | `#475569` | When filtering active |
| Cumulative line | `#f97316` | 80% reference         |
| 80% threshold   | `#f97316` | Horizontal line       |

## Tooltip

```tsx
const tooltipStyle = {
  background: '#1e293b',
  border: '1px solid #334155',
  color: '#f1f5f9',
  fontSize: 12,
  padding: '8px 12px',
};
```

## Branding Bar

| Element     | Hex       | Usage            |
| ----------- | --------- | ---------------- |
| Background  | `#334155` | 60% opacity      |
| Accent bar  | `#3b82f6` | Left edge marker |
| Text        | `#94a3b8` | Branding text    |
| Sample size | `#64748b` | "n = X" text     |

## SVG Usage Examples

```tsx
import { chartColors, chromeColors } from './colors';

// Grid
<GridRows stroke={chromeColors.gridLine} strokeOpacity={0.5} />

// Spec lines
<line
  stroke={chartColors.spec}
  strokeWidth={1.5}
  strokeDasharray="6,3"
/>

// Data points with status
<Circle
  fill={value > usl ? chartColors.fail : value < lsl ? chartColors.warning : chartColors.pass}
  stroke="#fff"
  strokeWidth={1}
/>
```

## Executive Color Palette

VariScout supports an executive chart mode designed for consulting-grade reports (McKinsey, Bain, BCG style). The executive palette prioritizes clarity, authority, and high data-ink ratio.

### executiveColors

Muted, professional tones that replace the standard `chartColors` in executive mode:

```typescript
import { executiveColors } from '@variscout/charts';

executiveColors.pass; // #10b981 - emerald-500, refined green
executiveColors.fail; // #ef4444 - red-500, standard red
executiveColors.warning; // #f59e0b - amber-500
executiveColors.violation; // #ea580c - orange-600, deep orange

executiveColors.mean; // #0f172a - slate-900, nearly black for authority
executiveColors.meanAlt; // #7c3aed - violet-600
executiveColors.target; // #10b981 - emerald-500
executiveColors.spec; // #94a3b8 - slate-400, subtle (don't distract)
executiveColors.control; // #64748b - slate-500, subtle control limits

executiveColors.linear; // #0f172a - slate-900
executiveColors.quadratic; // #475569 - slate-600
executiveColors.cumulative; // #475569 - slate-600, distinct from bars
executiveColors.threshold80; // #94a3b8 - slate-400
```

### executiveChrome

Light-mode-only chrome for executive reports (executive reports are rarely dark mode):

```typescript
import { executiveChrome } from '@variscout/charts';

executiveChrome.tooltipBg; // #ffffff - white
executiveChrome.gridLine; // #e2e8f0 - slate-200, very subtle
executiveChrome.barBackground; // #cbd5e1 - slate-300

executiveChrome.labelPrimary; // #334155 - slate-700
executiveChrome.labelSecondary; // #64748b - slate-500
executiveChrome.axisPrimary; // #cbd5e1 - slate-300, subtle axis
executiveChrome.axisSecondary; // #e2e8f0 - slate-200
executiveChrome.pointStroke; // #ffffff - white stroke for separation

executiveChrome.boxDefault; // #94a3b8 - slate-400
executiveChrome.boxBorder; // #475569 - slate-600
executiveChrome.ciband; // #e2e8f0 - slate-200
```

### getChartColors(mode)

Returns the appropriate data color palette:

```typescript
import { getChartColors } from '@variscout/charts';

const colors = getChartColors('executive'); // returns executiveColors
const colors = getChartColors('technical'); // returns chartColors (default)
```

### getChromeColors(isDark, mode)

Returns theme-aware chrome colors with optional mode parameter:

```typescript
import { getChromeColors } from '@variscout/charts';

// Technical mode (default) - respects dark/light theme
getChromeColors(true); // dark chrome (chromeColors)
getChromeColors(false); // light chrome (chromeColorsLight)

// Executive mode - always returns executiveChrome regardless of isDark
getChromeColors(true, 'executive'); // executiveChrome
getChromeColors(false, 'executive'); // executiveChrome
```

### Enabling Executive Mode

Set `data-chart-mode="executive"` on the `<html>` element. The `useChartTheme` hook automatically detects this attribute and switches all chart colors to the executive palette.

## Design Principles

Colors are centralized in `packages/charts/src/colors.ts` for:

1. **Consistency** - Single source of truth for all charts
2. **Maintainability** - Change colors in one place
3. **Type Safety** - TypeScript const assertions prevent typos
4. **Portability** - Charts work in any context (PWA, Azure, Website)

When adding new charts, import from the colors module to maintain consistency.

## Cross-Platform Usage

All apps must import chart colors from `@variscout/charts`:

```typescript
// PWA, Azure, Website
import { chartColors } from '@variscout/charts';

// Use in components
fill={chartColors.pass}    // #22c55e
stroke={chartColors.spec}  // #ef4444
```

**Do NOT hardcode hex values in chart components.** Always use the centralized color constants to ensure visual consistency across all platforms.

| App     | Import From         | Usage                              |
| ------- | ------------------- | ---------------------------------- |
| PWA     | `@variscout/charts` | Chart components in Dashboard      |
| Azure   | `@variscout/charts` | Chart components in Dashboard      |
| Website | `@variscout/charts` | React Islands (IChartIsland, etc.) |

---

## See Also

- [Overview](./overview.md) - Chart design system overview and selection guide
- [Executive Mode](./executive-mode.md) - Consulting-grade chart styling
- [Responsive](./responsive.md) - Breakpoints and scaling utilities
- [Hooks](./hooks.md) - useChartTheme for theme-aware colors
- [IChart](./ichart.md) - I-Chart point coloring implementation
