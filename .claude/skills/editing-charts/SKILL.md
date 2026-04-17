---
name: editing-charts
description: Use when editing packages/charts/ or chart wrappers in apps. Chart component patterns (Base + responsive wrapper), theme-aware colors via useChartTheme, chartColors/chromeColors constants, export dimensions, Pareto/Boxplot overflow for many categories, LTTB decimation, chart annotations, dot plot fallback for small N, violin mode, boxplot sorting.
---

# Editing Charts

## When this skill applies

Triggered when editing `packages/charts/**` or chart wrapper components in `apps/pwa/**` or `apps/azure/**`. Also applies when working on chart export, chart annotations, the Evidence Map visualization, or the Yamazumi chart.

## Core patterns

### Component structure

All charts are props-based (no context dependency). Each chart exports a responsive wrapper and a raw base:

- `IChart` — Responsive wrapper (uses `withParentSize` from `@visx/responsive`)
- `IChartBase` — Raw component, accepts explicit `width`/`height` for custom sizing

Props interfaces follow `{ComponentName}Props extends BaseChartProps`. Reference the full base-component table in `rules/charts.md` under "Performance Charts" and "Evidence Map".

When adding a new chart:
1. Create `NewChart.tsx` with `NewChartBase` export
2. Add to `packages/charts/src/index.ts` exports
3. Add props interface to `types.ts`

### Theme-aware colors

Never hardcode hex values. Import from `packages/charts/src/colors.ts`:

```typescript
import { chartColors, chromeColors, operatorColors } from './colors';
```

Inside components, access colors through `useChartTheme()`:

```typescript
import { useChartTheme } from '@variscout/charts';

const { isDark, chrome, colors, fontScale } = useChartTheme();
// chrome.gridLine, chrome.axisPrimary, chrome.labelPrimary, etc.
// colors.pass, colors.fail, colors.mean, colors.spec, etc.
```

Never read `data-theme` directly from the document — use `useChartTheme()`. Without the hook subscription, theme changes won't trigger re-renders.

See `COLORS.md` (sibling file) for the full hex mapping of all `chartColors`, `chromeColors` (dark + light), and `operatorColors`.

### Responsive utilities

Import from `@variscout/core/responsive`:

- `getResponsiveMargins(width, chartType, extraBottom)` — chart margin objects
- `getResponsiveFonts(width)` — returns tick/axis/stat font sizes
- `getResponsiveTickCount(size, axis)` — optimal tick count for the available space

### Adaptive category limits

**Pareto:** Top 20 categories shown (`PARETO_MAX_CATEGORIES = 20` from `useParetoChartData`). Remaining categories aggregate into a single "Others" bar styled with muted fill via the `othersKey` prop.

**Boxplot (adaptive):** Container width drives the category budget at `MIN_BOX_STEP = 50px` per box. When more categories exist than fit, `selectBoxplotCategories()` selects the most analytically relevant ones:
- `smaller-is-better` → highest median first (worst performers)
- `larger-is-better` → lowest median first
- `nominal/target` → farthest from target first
- No specs → highest IQR first (most variation)
- Sort override → sort criterion drives selection

An overflow indicator ("⋯ +N") renders at the right edge when categories are truncated. The `visibleCategories` prop on `BoxplotBase` controls the filter. The `useBoxplotCategoryLimit` hook computes the visible set.

**Label rotation (both):** When categories > 10, X-axis labels rotate −45° and truncate to 12 chars + "…". This is handled at the base-component level — do not add per-chart label logic.

**I-Chart tooltip:** Shows factor column values (e.g., "Month: Jul, Year: 2019") alongside point value and index. Factor values are included in `IChartDataPoint.factorValues` via `useIChartData`.

### Boxplot sorting

Sorting is applied in the app Boxplot wrapper, not in `BoxplotBase`. Use `sortBoxplotData()` from `@variscout/core`:

```typescript
import { sortBoxplotData } from '@variscout/core';
const sorted = sortBoxplotData(data, 'mean', 'desc');
```

Criteria: `'name'` (alphabetical), `'mean'` (group mean), `'spread'` (IQR). Direction: `'asc'` (default) or `'desc'`. State lives in `DisplayOptions.boxplotSortBy` / `boxplotSortDirection`. `BoxplotDisplayToggle` exposes `sortBy`, `sortDirection`, and `onSortChange` props.

### Violin mode

Both `Boxplot` and `PerformanceBoxplot` support `showViolin?: boolean`. When true, renders `@visx/stats` `<ViolinPlot>` behind box elements using KDE data from `calculateKDE()` in `@variscout/core`. Controlled via `displayOptions.showViolin` in the app wrappers.

### Target reference line

`BoxplotBase` accepts an optional `targetLine` prop:

```typescript
targetLine?: { value: number; color: string; label?: string }
```

Renders a horizontal dashed reference line at the given value (e.g., Cpk target in capability mode).

### Dot plot fallback

`BoxplotBase` and `PerformanceBoxplotBase` automatically switch from box-and-whisker to jittered dots for any category with fewer than 7 data points (`MIN_BOXPLOT_VALUES`, exported from `@variscout/charts`). This is a **per-category** decision — a single chart legitimately mixes boxes (N ≥ 7) and dots (N < 7). Do not guard against this; it is intentional.

### LTTB decimation (I-Chart)

When `chartWidth` is provided to `useIChartData`, datasets exceeding `chartWidth * 2` points are decimated to that threshold via Largest-Triangle-Three-Buckets algorithm.

- Stats are computed from the **full** dataset; decimation is display-only.
- Control-limit violation points (above UCL or below LCL) are force-included and must never be dropped by decimation.
- `lttb()` function lives in `packages/core/src/stats/lttb.ts`.

### Chart annotations (Finding-backed)

Three chart types support annotations via right-click context menu:

| Chart   | Anchor Type           | Highlights | Text Observations | Key Props                                     |
|---------|-----------------------|------------|-------------------|-----------------------------------------------|
| Boxplot | Category-based        | Yes        | Yes (Finding)     | `highlightedCategories`, `onBoxContextMenu`   |
| Pareto  | Category-based        | Yes        | Yes (Finding)     | `highlightedCategories`, `onBarContextMenu`   |
| I-Chart | Free-floating (% coords) | No      | Yes (Finding)     | `ichartAnnotations`, `onChartContextMenu`     |

"Add observation" creates a `Finding` with `FindingSource` metadata (chartType + category OR anchorX/Y). `ChartAnnotationLayer` reads from `Finding[]`, **not** from a `ChartAnnotation[]`. Color highlights (red/amber/green) remain in `DisplayOptions` as lightweight visual markers — they do not create Findings.

State managed by `useAnnotations` hook. UI components: `ChartAnnotationLayer` and `AnnotationContextMenu` from `@variscout/ui`. Mobile < 640px: `MobileCategorySheet` bottom sheet. Question-linked findings have `showOnChart: false` by default.

### Branding

`ChartSourceBar` component renders footer branding. `getSourceBarHeight(showBranding)` computes the bottom margin offset. Branding shown for free tier, hidden for paid tiers — gate via `isPaidTier()` from `@variscout/core/tier`.

### Chart export

`useChartCopy` hook in `@variscout/hooks` owns all export paths (clipboard copy, PNG download, SVG download). All exports temporarily resize the chart container to fixed export dimensions, wait for visx ResizeObserver + React re-render, then capture — producing identical output from any view (dashboard card or focused view).

Key details:
- Fixed dimensions defined in `EXPORT_SIZES` in `packages/hooks/src/useChartCopy.ts` (see `EXPORTS.md`)
- All exports rendered at `pixelRatio: 2` (double actual pixels)
- Wide charts use desktop font breakpoint (≥ 768px) during export
- Dashboard uses auto-height mode (`height: 0`) — captures full scrollable content at 1600px width

Components:
- `ChartDownloadMenu` — Dropdown (PNG/SVG) from `@variscout/ui`, uses colorScheme pattern
- Copy button — inline 1-click with Check feedback icon, 2 s timeout
- All export icons use `size={14}`
- Dashboard nav bar elements marked `data-export-hide` are excluded from capture

## Performance charts (multi-channel)

Performance charts analyze multiple measurement channels (fill heads, cavities, nozzles):

| Component               | Base Export                 | Purpose                           |
|-------------------------|-----------------------------|-----------------------------------|
| `PerformanceIChart`     | `PerformanceIChartBase`     | Cpk scatter plot by channel       |
| `PerformanceBoxplot`    | `PerformanceBoxplotBase`    | Distribution comparison (max 5)   |
| `PerformancePareto`     | `PerformanceParetoBase`     | Cpk ranking, worst first (max 20) |
| `PerformanceCapability` | `PerformanceCapabilityBase` | Single channel histogram          |

All accept `channels: ChannelResult[]` from `@variscout/core`. `selectedMeasure` drives drill-down highlighting; `onChannelClick` handles selection. PWA/Azure both use the responsive wrapper (auto-sizing).

## Yamazumi chart

`YamazumiChart` (responsive) + `YamazumiChartBase` (raw). Stacked bars per step × activity type. Theme-aware via `useChartTheme`.

**Activity type colors (fixed — never change by drill level):**

| Activity     | Hex       | Tailwind     | Meaning                    |
|--------------|-----------|--------------|----------------------------|
| VA           | `#22c55e` | green-500    | Value-Adding               |
| NVA Required | `#f59e0b` | amber-500    | Necessary non-value-adding |
| Waste        | `#ef4444` | red-500      | Eliminable waste           |
| Wait         | `#94a3b8` | slate-400    | Queue/wait time            |

Accepts `data: YamazumiBarData[]` from `computeYamazumiData()`. `taktTime` prop renders the target line.

**Chart slot mapping in Yamazumi mode:**

| Slot | Standard     | Performance   | Yamazumi                    |
|------|--------------|---------------|-----------------------------|
| 1    | I-Chart      | Cpk Scatter   | I-Chart (switchable metric) |
| 2    | Boxplot      | Boxplot       | Yamazumi Chart              |
| 3    | Pareto       | Pareto (Cpk)  | Pareto (5 switchable modes) |
| 4    | Stats        | Stats         | Yamazumi Summary            |

## Evidence Map

Props-based layered SVG visualization of factor relationships (R²adj from best subsets regression). See `editing-evidence-map` skill for full implementation detail.

Key facts relevant to chart work:
- Three composited `<g>` layer groups: Statistical (PWA + Azure), Investigation (Azure), Synthesis (Azure)
- Colors via `chartColors` / `chromeColors` constants — no hardcoded hex
- Mobile: `enableZoom` prop for pinch/pan; `compact` hides labels until zoom > 1.5×
- Pop-out sync via `usePopoutChannel` (BroadcastChannel + localStorage hydration)
- Layout computation: `evidenceMapLayout.ts` in `@variscout/core/stats`
- Data flow: `useEvidenceMapData` hook in `@variscout/hooks`

## Gotchas

- **Don't add manual `React.memo()`** — React Compiler (`babel-plugin-react-compiler`, enabled in both apps) automatically memoizes components and hooks. Manual memo is redundant and can occasionally cause stale-closure bugs.

- **Don't read `data-theme` directly** — use `useChartTheme()`. Reading the attribute directly bypasses the hook's subscription, so theme changes won't trigger re-renders in the component.

- **Boxplot dot fallback is per-category, not per-chart** — a single chart legitimately renders boxes for high-N groups and dots for low-N groups simultaneously. Do not add a chart-level guard that forces a uniform mode.

- **LTTB must force-include control-limit violations** — dropping UCL/LCL violation points via naive decimation is a correctness bug that hides process signals. See `lttb()` in `packages/core/src/stats/lttb.ts` for the force-include mechanism.

- **Export dimensions are fixed at the EXPORT_SIZES values** (see `EXPORTS.md`). `useChartCopy` re-renders at export size via temporary DOM resize — not the on-screen size. Charts look identical whether captured from a dashboard card or a focused view.

- **Label rotation at categories > 10 is handled at base-component level** — do not add per-chart label-rotation logic to individual chart implementations; it's centrally applied in `BoxplotBase` and `ParetoBase`.

- **`chromeColors` in `colors.ts` is the dark-theme object** — `chromeColorsLight` is the separate const. `getChromeColors(isDark)` selects between them. The theme-aware hook hides this; use `useChartTheme()` rather than importing `chromeColors` directly in component code.

- **`chartColors.spec` and `chartColors.fail` differ** — `spec` is `#f97316` (orange-500, Voice of Customer specification limits), `fail` is `#ef4444` (red-500, above USL). The rules doc notes `spec` as `#ef4444` but the actual `colors.ts` has `#f97316`. Trust `colors.ts`.

## Reference

- Export dimensions (PNG/SVG/clipboard): `EXPORTS.md` (sibling file)
- Full theme + chart color mapping: `COLORS.md` (sibling file)
- ADR-002 Visx charts
- ADR-005 Props-based charts
- ADR-051 Chart many categories
- `docs/06-design-system/charts/chart-sizing-guide.md`
- `packages/charts/src/colors.ts` (color constants source of truth)
- `packages/hooks/src/useChartCopy.ts` (export implementation + `EXPORT_SIZES`)
- `.claude/rules/charts.md` (full rule set, retained during Phase 2 transition)
