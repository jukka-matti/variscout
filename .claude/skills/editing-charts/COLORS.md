# Chart Color Reference

## Contents

1. [chartColors — data colors](#chartcolors--data-colors)
2. [chromeColors — dark theme](#chromecolors--dark-theme)
3. [chromeColors — light theme](#chromecolors--light-theme)
4. [operatorColors — multi-series](#operatorcolors--multi-series)
5. [useChartTheme hook](#usecharttheme-hook)
6. [Helper functions](#helper-functions)

Source of truth: `packages/charts/src/colors.ts`.

---

## chartColors — data colors

These colors are theme-invariant (technical palette). Access via `colors.xxx` from `useChartTheme()` or import `chartColors` directly.

| Key            | Hex       | Tailwind       | Purpose                                          |
|----------------|-----------|----------------|--------------------------------------------------|
| `pass`         | `#22c55e` | green-500      | Data points within specification                 |
| `fail`         | `#ef4444` | red-500        | Data points above USL                            |
| `warning`      | `#f59e0b` | amber-500      | Data points below LSL                            |
| `violation`    | `#f97316` | orange-500     | Data points outside control limits (UCL/LCL)    |
| `mean`         | `#3b82f6` | blue-500       | Center line / Cpk (primary capability)           |
| `meanAlt`      | `#a855f7` | purple-500     | Alternative mean / Cp (potential capability)     |
| `target`       | `#22c55e` | green-500      | Target line                                      |
| `spec`         | `#f97316` | orange-500     | Specification limits (Voice of Customer)         |
| `control`      | `#06b6d4` | cyan-500       | Control limits UCL/LCL (Voice of Process)        |
| `selected`     | `#0ea5e9` | sky-500        | Selected item highlight                          |
| `selectedBorder`| `#0284c7`| sky-600        | Selected item border                             |
| `linear`       | `#3b82f6` | blue-500       | Linear regression fit line                       |
| `quadratic`    | `#8b5cf6` | violet-500     | Quadratic regression fit line                    |
| `cumulative`   | `#f97316` | orange-500     | Pareto cumulative percentage line                |
| `threshold80`  | `#f97316` | orange-500     | Pareto 80% threshold line                        |
| `cpPotential`  | `#8b5cf6` | violet-500     | Cp (potential capability) series in capability I-Chart |
| `star`         | `#fbbf24` | yellow-400     | Rating stars                                     |

> **Note:** `spec` (`#f97316`, orange-500) and `fail` (`#ef4444`, red-500) are **different colors**. The `rules/charts.md` file incorrectly shows `spec` as `#ef4444` — the actual `colors.ts` value is `#f97316`. Trust this file.

---

## chromeColors — dark theme

The `chromeColors` export in `colors.ts` is the **dark theme** object. Access via `chrome.xxx` from `useChartTheme()`.

| Property         | Hex       | Tailwind   | Purpose                              |
|------------------|-----------|------------|--------------------------------------|
| `tooltipBg`      | `#1e293b` | slate-800  | Tooltip background                   |
| `gridLine`       | `#1e293b` | slate-800  | Chart grid lines                     |
| `barBackground`  | `#334155` | slate-700  | Bar chart background fill            |
| `tooltipBorder`  | `#334155` | slate-700  | Tooltip border                       |
| `labelPrimary`   | `#cbd5e1` | slate-300  | Axis labels, tick labels             |
| `labelSecondary` | `#94a3b8` | slate-400  | Secondary text                       |
| `labelMuted`     | `#64748b` | slate-500  | Muted text                           |
| `tooltipText`    | `#f1f5f9` | slate-100  | Tooltip text                         |
| `axisPrimary`    | `#94a3b8` | slate-400  | Primary axis lines                   |
| `axisSecondary`  | `#64748b` | slate-500  | Secondary axis lines                 |
| `whisker`        | `#94a3b8` | slate-400  | Boxplot whiskers                     |
| `dataLine`       | `#94a3b8` | slate-400  | Connecting lines between data points |
| `stageDivider`   | `#475569` | slate-600  | Stage separators (dual-stage boxplot)|
| `pointStroke`    | `#0f172a` | slate-900  | Data point outline strokes           |
| `boxDefault`     | `#475569` | slate-600  | Boxplot box fill                     |
| `boxBorder`      | `#64748b` | slate-500  | Boxplot box border                   |
| `ciband`         | `#3b82f6` | blue-500   | Confidence interval band (with opacity) |

---

## chromeColors — light theme

`chromeColorsLight` is a separate `const` (not exported directly). `getChromeColors(false)` returns it. `useChartTheme()` selects the right object automatically.

| Property         | Hex       | Tailwind   | Purpose                              |
|------------------|-----------|------------|--------------------------------------|
| `tooltipBg`      | `#ffffff` | white      | Tooltip background                   |
| `gridLine`       | `#f1f5f9` | slate-100  | Chart grid lines                     |
| `barBackground`  | `#e2e8f0` | slate-200  | Bar chart background fill            |
| `tooltipBorder`  | `#e2e8f0` | slate-200  | Tooltip border                       |
| `labelPrimary`   | `#334155` | slate-700  | Axis labels, tick labels             |
| `labelSecondary` | `#64748b` | slate-500  | Secondary text                       |
| `labelMuted`     | `#94a3b8` | slate-400  | Muted text                           |
| `tooltipText`    | `#0f172a` | slate-900  | Tooltip text                         |
| `axisPrimary`    | `#64748b` | slate-500  | Primary axis lines                   |
| `axisSecondary`  | `#94a3b8` | slate-400  | Secondary axis lines                 |
| `whisker`        | `#64748b` | slate-500  | Boxplot whiskers                     |
| `dataLine`       | `#64748b` | slate-500  | Connecting lines between data points |
| `stageDivider`   | `#cbd5e1` | slate-300  | Stage separators                     |
| `pointStroke`    | `#ffffff` | white      | Data point outline strokes           |
| `boxDefault`     | `#cbd5e1` | slate-300  | Boxplot box fill                     |
| `boxBorder`      | `#94a3b8` | slate-400  | Boxplot box border                   |
| `ciband`         | `#3b82f6` | blue-500   | Confidence interval band (with opacity) |

> **Note:** The `rules/charts.md` chrome color table only covers 5 properties (`gridLine`, `axisPrimary`, `axisSecondary`, `labelPrimary`, `labelSecondary`). This file covers all 17 properties from the actual source.

---

## operatorColors — multi-series

Eight-color array for operators, channels, or any multi-series chart requiring distinct categorical colors. Used for `PerformanceIChart`, multi-channel Boxplot, etc.

```typescript
export const operatorColors = [
  '#3b82f6', // blue-500
  '#22c55e', // green-500
  '#f59e0b', // amber-500
  '#ef4444', // red-500
  '#8b5cf6', // violet-500
  '#ec4899', // pink-500
  '#06b6d4', // cyan-500
  '#84cc16', // lime-500
] as const;
```

For performance charts with more than 8 channels, colors wrap around (modulo 8). The selection algorithm in `PerformanceParetoBase` ranks channels worst-first by Cpk — the color order follows the ranked output.

---

## useChartTheme hook

```typescript
import { useChartTheme } from '@variscout/charts';

const { isDark, chrome, colors, fontScale } = useChartTheme();
```

Returns:
- `isDark: boolean` — whether dark theme is active (reads `data-theme` attribute via MutationObserver subscription)
- `chrome: ChromeColorValues` — theme-appropriate chrome colors (dark or light object, see tables above)
- `colors: Record<ChartColor, string>` — data colors (`chartColors`, theme-invariant)
- `fontScale: number` — font scale from `data-chart-scale` attribute on the chart container

**Always use this hook in components**. Importing `chromeColors` directly gives you only the dark object and won't react to theme changes.

---

## Helper functions

These are exported from `packages/charts/src/colors.ts`:

| Function | Signature | Purpose |
|----------|-----------|---------|
| `getChromeColors` | `(isDark?: boolean) => ChromeColorValues` | Returns dark chrome (default) or light chrome. Used by `useChartTheme` internally. |
| `getChartColors` | `() => typeof chartColors` | Returns the data color object. Useful in non-React contexts (e.g., SVG template strings). |
| `getDocumentTheme` | `() => 'light' \| 'dark'` | Reads `data-theme` from `document.documentElement`. Returns `'dark'` if attribute is absent or in SSR. Used by `useChartTheme` for initial value. |

Also re-exported from `colors.ts`:

```typescript
export { stageColors } from '@variscout/core';
```

`stageColors` provides before/after comparison colors for dual-stage boxplot. Canonical source is `@variscout/core/responsive`.
