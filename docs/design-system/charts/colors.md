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

### Spec Status Colors

| Status             | Hex       | Usage                       |
| ------------------ | --------- | --------------------------- |
| In-spec            | `#22c55e` | Values within LSL-USL range |
| Out-of-spec (high) | `#ef4444` | Values > USL                |
| Out-of-spec (low)  | `#f59e0b` | Values < LSL                |

```tsx
const getPointColor = (value: number, usl?: number, lsl?: number): string => {
  if (usl !== undefined && value > usl) return '#ef4444';
  if (lsl !== undefined && value < lsl) return '#f59e0b';
  return '#22c55e';
};
```

### Control Status Colors

| Status         | Hex       | Usage           |
| -------------- | --------- | --------------- |
| In control     | `#22c55e` | Within UCL/LCL  |
| Out of control | `#ef4444` | Outside UCL/LCL |

## Line Colors

| Element    | Hex       | Style        | Usage            |
| ---------- | --------- | ------------ | ---------------- |
| USL        | `#ef4444` | Dashed (6,3) | Upper spec limit |
| LSL        | `#f59e0b` | Dashed (6,3) | Lower spec limit |
| Target     | `#22c55e` | Dashed (4,4) | Target value     |
| UCL/LCL    | `#3b82f6` | Dashed (4,4) | Control limits   |
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

## Gage R&R Chart

| Component       | Hex       | Usage                   |
| --------------- | --------- | ----------------------- |
| Part-to-Part    | `#22c55e` | Good (actual variation) |
| Repeatability   | `#3b82f6` | Equipment variation     |
| Reproducibility | `#f59e0b` | Operator variation      |
| Background bar  | `#334155` | 100% reference          |
| 10% threshold   | `#22c55e` | Excellent GRR line      |
| 30% threshold   | `#ef4444` | Acceptable limit line   |

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

## Design Principles

Colors are centralized in `packages/charts/src/colors.ts` for:

1. **Consistency** - Single source of truth for all charts
2. **Maintainability** - Change colors in one place
3. **Type Safety** - TypeScript const assertions prevent typos
4. **Portability** - Charts work in any context (PWA, Excel, Azure, Website)

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
| Excel   | `@variscout/charts` | Content Add-in chart panel         |
