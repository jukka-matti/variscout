# Chart Design System

Complete reference for VariScout chart components built with [Visx](https://airbnb.io/visx/).

---

## Chart Selection Guide

Choose the right chart for your analysis:

| Analysis Need            | Chart                  | Documentation                                |
| ------------------------ | ---------------------- | -------------------------------------------- |
| Time-series monitoring   | IChart                 | [ichart.md](./ichart.md)                     |
| Distribution by category | Boxplot                | [boxplot.md](./boxplot.md)                   |
| Distribution vs specs    | Capability (Histogram) | [capability.md](./capability.md)             |
| Frequency ranking        | Pareto                 | [pareto.md](./pareto.md)                     |
| X-Y relationship         | Scatter Plot           | [scatter.md](./scatter.md)                   |
| Normality assessment     | Probability Plot       | [probability-plot.md](./probability-plot.md) |
| Measurement system       | Gage R&R               | [gage-rr.md](./gage-rr.md)                   |

---

## Performance Mode (Multi-Channel)

Performance charts analyze multiple measurement channels (fill heads, cavities, nozzles):

| Chart                 | Purpose                  | Max Displayed    |
| --------------------- | ------------------------ | ---------------- |
| PerformanceIChart     | Cpk scatter by channel   | All channels     |
| PerformanceBoxplot    | Distribution comparison  | 5 (worst by Cpk) |
| PerformancePareto     | Cpk ranking              | 20 (worst first) |
| PerformanceCapability | Single channel histogram | 1 (selected)     |

**Full documentation**: [performance-mode.md](./performance-mode.md)

---

## Styling & Infrastructure

Core documentation for chart development:

| Topic                 | Documentation                                  | Purpose                        |
| --------------------- | ---------------------------------------------- | ------------------------------ |
| **Architecture**      | [overview.md](./overview.md)                   | Component structure, patterns  |
| **Colors**            | [colors.md](./colors.md)                       | Data visualization palette     |
| **Responsive**        | [responsive.md](./responsive.md)               | Breakpoints, scaling utilities |
| **Hooks**             | [hooks.md](./hooks.md)                         | React hooks API                |
| **Shared Components** | [shared-components.md](./shared-components.md) | Reusable chart UI              |
| **Utilities**         | [utilities.md](./utilities.md)                 | Accessibility, interactions    |

---

## Quick Reference

### Component Exports

Each chart exports two versions:

```typescript
// Responsive wrapper (auto-sizing with withParentSize)
import IChart from '@variscout/charts/IChart';
import Boxplot from '@variscout/charts/Boxplot';

// Base component (manual sizing)
import { IChartBase } from '@variscout/charts/IChart';
import { BoxplotBase } from '@variscout/charts/Boxplot';
```

### Color Constants

Never hardcode hex values - use centralized colors:

```typescript
import { chartColors, chromeColors } from '@variscout/charts';

// Data point colors
fill={chartColors.pass}      // #22c55e - within spec
fill={chartColors.fail}      // #ef4444 - above USL
fill={chartColors.warning}   // #f59e0b - below LSL

// Chrome colors
fill={chromeColors.labelPrimary}  // #cbd5e1
```

### Theme-Aware Colors

Charts support automatic light/dark theme switching:

```typescript
import { useChartTheme } from '@variscout/charts';

const { isDark, chrome } = useChartTheme();
// chrome.gridLine, chrome.axisPrimary, chrome.labelPrimary, etc.
```

### Responsive Utilities

```typescript
import {
  getResponsiveMargins,
  getResponsiveFonts,
  getResponsiveTickCount,
} from '@variscout/charts';

const margin = getResponsiveMargins(width, 'ichart');
const fonts = getResponsiveFonts(width);
```

---

## Cross-App Usage

| App       | Wrapper    | Sizing                |
| --------- | ---------- | --------------------- |
| **PWA**   | Responsive | Auto (withParentSize) |
| **Azure** | Responsive | Auto (withParentSize) |
| **Excel** | Base       | Explicit dimensions   |

### PWA/Azure Example

```tsx
<div className="h-[400px]">
  <IChart data={data} specs={specs} />
</div>
```

### Excel Example

```tsx
<IChartBase parentWidth={500} parentHeight={350} data={data} specs={specs} />
```

---

## Adding New Charts

1. Create `NewChart.tsx` with `NewChartBase` export
2. Follow the props interface pattern from existing charts
3. Use responsive utilities for margins/fonts
4. Add to `packages/charts/src/index.ts` exports
5. Document in this directory with "See Also" section

---

## See Also

- [Design System Overview](../README.md) - Complete design system
- [UI Colors](../../packages/ui/src/colors.ts) - Shared UI colors (gradeColors)
- [User Flows](../../flows/OVERVIEW.md) - How users interact with charts
