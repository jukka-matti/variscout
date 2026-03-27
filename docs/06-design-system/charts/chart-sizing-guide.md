---
title: Chart Sizing Guide
audience: [developer]
category: reference
status: stable
related: [charts, visx, responsive, layout]
---

# Chart Sizing Guide

How visx charts are sized in VariScout and how to use them correctly in any container.

## withParentSize HOC

All chart components (IChart, Boxplot, ParetoChart, etc.) use `withParentSize` from `@visx/responsive`:

```tsx
// packages/charts/src/IChart.tsx
const IChart = withParentSize(IChartBase);
```

`withParentSize` wraps the component with a `ResizeObserver` that measures the parent element's `clientWidth` and `clientHeight`, passing them as `parentWidth` and `parentHeight` props.

**Critical requirement**: The parent element must have a **definite height**. If the parent's height is `auto` (content-based), `withParentSize` measures whatever the SVG forces it to be, creating circular expansion. See [CSS Height Chain Pattern](../patterns/css-height-chain.md).

## Two Usage Modes

### 1. Responsive Wrapper (auto-sizing) — Default

```tsx
import { IChart } from '@variscout/charts';

{
  /* Parent MUST have definite height */
}
<div className="flex-1 min-h-0">
  <IChart data={data} specs={specs} />
</div>;
```

The chart fills its parent. Used in DashboardGrid and FocusedChartView.

### 2. Base Component (manual sizing)

```tsx
import { IChartBase } from '@variscout/charts';

<IChartBase parentWidth={1200} parentHeight={540} data={data} specs={specs} />;
```

Fixed dimensions. Used for chart export (off-screen capture).

## Container Pattern

The standard chart container in the dashboard (`DashboardChartCard.tsx`):

```tsx
<div className="flex flex-col min-h-0 h-full">
  {' '}
  {/* Card fills grid cell */}
  <div className="flex items-center mb-2">
    {' '}
    {/* Header (fixed) */}
    {title} {controls}
  </div>
  {filterBar} {/* Optional (fixed) */}
  <div className="flex-1 min-h-0 relative">
    {' '}
    {/* Chart area (flexible) */}
    <div className="absolute inset-0">
      {' '}
      {/* Defense-in-depth */}
      {children} {/* withParentSize chart */}
    </div>
  </div>
  {footer} {/* Optional insight chip */}
</div>
```

The chart content area uses the **absolute fill** pattern: the `relative` parent gets its size from the flex algorithm, and the `absolute inset-0` child fills it without being able to influence the parent's size. This breaks the ResizeObserver feedback loop ([visx #881](https://github.com/airbnb/visx/issues/881)) — even if `withParentSize` measures large content, the absolute container cannot push its parent larger.

## Responsive Utilities

Three functions in `@variscout/core/responsive` adapt chart internals to container width:

### getResponsiveMargins(width, chartType, extraBottom?)

Returns `{ top, right, bottom, left }` margins that scale with container width.

| Width     | Margins (approximate) |
| --------- | --------------------- |
| < 400px   | Compact (20/10/30/30) |
| 400-768px | Medium (30/20/40/40)  |
| > 768px   | Full (40/30/50/50)    |

`chartType` adjusts for chart-specific needs (Pareto needs more bottom margin for labels).

### getResponsiveFonts(width)

Returns `{ tick, axis, stat }` font sizes.

| Width     | Tick | Axis | Stat |
| --------- | ---- | ---- | ---- |
| < 400px   | 9px  | 10px | 11px |
| 400-768px | 10px | 11px | 12px |
| > 768px   | 11px | 12px | 14px |

### getResponsiveTickCount(size, axis)

Returns optimal tick count for the given axis dimension.

| Dimension | Ticks |
| --------- | ----- |
| < 200px   | 3     |
| 200-400px | 5     |
| > 400px   | 8     |

## Export Sizes

Fixed dimensions for chart export, defined in `packages/hooks/src/useChartCopy.ts`:

```typescript
export const EXPORT_SIZES = {
  ichart: { width: 1200, height: 540 }, // 2.2:1
  boxplot: { width: 1200, height: 800 }, // 3:2
  pareto: { width: 1200, height: 720 }, // 5:3
  histogram: { width: 800, height: 600 }, // 4:3
  probability: { width: 800, height: 700 }, // ~1.14:1
  yamazumi: { width: 1200, height: 800 }, // 3:2
  stats: { width: 1200, height: 400 }, // 3:1
  dashboard: { width: 1600, height: 0 }, // auto-height (scrollHeight)
  slide: { width: 1920, height: 1080 }, // 16:9
};
```

All exported at `pixelRatio: 2` (Retina). Wide charts use the desktop font breakpoint (>=768px).

Dashboard export uses `height: 0` (auto) — temporarily sets `overflow: visible; height: auto` on the grid to capture full scrollable content at 1600px width.

## Branding Footer

`ChartSourceBar` renders a "VARISCOUT" branding footer on free-tier charts.

```tsx
import { getSourceBarHeight } from '@variscout/charts';
import { isPaidTier } from '@variscout/core/tier';

const showBranding = !isPaidTier();
const extraBottom = getSourceBarHeight(showBranding);
const margins = getResponsiveMargins(width, 'ichart', extraBottom);
```

Hidden for Standard and Team plans.

## LTTB Point Decimation

I-Chart uses Largest-Triangle-Three-Buckets downsampling for datasets exceeding `chartWidth * 2` points:

- Stats computed from **full** dataset (decimation is display-only)
- Control limit violation points (above UCL, below LCL) are force-included
- Function: `lttb()` in `packages/core/src/stats/lttb.ts`

## Related

- [CSS Height Chain Pattern](../patterns/css-height-chain.md) — the sizing constraint pattern
- [Dashboard Layout Architecture](../../05-technical/architecture/dashboard-layout.md) — how charts are arranged in the grid
- [Charts Package Rules](../../../.claude/rules/charts.md) — implementation conventions
