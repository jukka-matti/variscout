# Charts Package Rules (@variscout/charts)

## Component Pattern

- All charts are **props-based** (no context dependency)
- Export both wrapped and base components:
  - `IChart` - Responsive wrapper (uses `withParentSize`)
  - `IChartBase` - Raw component for custom sizing

## Props Interface

```typescript
interface ChartProps extends BaseChartProps {
  data: DataType[];
  specs: SpecLimits;
  showBranding?: boolean;
  // ... chart-specific props
}
```

## Responsive Utilities

- `getResponsiveMargins(width, chartType, extraBottom)`
- `getResponsiveFonts(width)` - Returns tick/axis/stat font sizes
- `getResponsiveTickCount(size, axis)` - Optimal tick count

## Color Constants

All chart colors are centralized in `packages/charts/src/colors.ts`:

```typescript
import { chartColors, chromeColors, operatorColors } from './colors';

// Semantic data colors
chartColors.pass; // #22c55e - within spec
chartColors.fail; // #ef4444 - above USL
chartColors.warning; // #f59e0b - below LSL
chartColors.mean; // #3b82f6 - center line
chartColors.spec; // #ef4444 - specification limits
chartColors.cpPotential; // #8b5cf6 - Cp (potential capability) series in capability I-Chart

// UI chrome colors
chromeColors.tooltipBg; // #1e293b
chromeColors.labelSecondary; // #94a3b8
chromeColors.axisSecondary; // #64748b

// Multi-series colors
operatorColors; // 8-color array for operators/categories
```

**Never hardcode hex values** - always use color constants.

## Theme-Aware Colors

Charts support automatic theme switching via the `useChartTheme` hook:

### useChartTheme Hook

```typescript
import { useChartTheme } from '@variscout/charts';

const MyChart = () => {
  const { isDark, chrome, colors, fontScale } = useChartTheme();

  // Use chrome.xxx instead of hardcoded hex colors:
  // chrome.gridLine, chrome.axisPrimary, chrome.labelPrimary, etc.
  // Use colors.xxx for data colors:
  // colors.pass, colors.fail, colors.mean, colors.spec, etc.
};
```

Returns:

- `isDark: boolean` - Whether dark theme is active
- `chrome: ChromeColorValues` - Theme-appropriate chrome colors (dark/light)
- `colors: Record<ChartColor, string>` - Data colors (technical palette)
- `fontScale: number` - Font scale from `data-chart-scale` attribute

### Color Functions

- `getChromeColors(isDark)` - Get chrome colors for theme
- `getChartColors()` - Get data colors (technical palette)
- `getDocumentTheme()` - Detect theme from `data-theme` attribute

### Chrome Color Mapping

| Dark Theme | Light Theme | Property                |
| ---------- | ----------- | ----------------------- |
| `#1e293b`  | `#f1f5f9`   | `chrome.gridLine`       |
| `#94a3b8`  | `#64748b`   | `chrome.axisPrimary`    |
| `#64748b`  | `#94a3b8`   | `chrome.axisSecondary`  |
| `#cbd5e1`  | `#334155`   | `chrome.labelPrimary`   |
| `#94a3b8`  | `#64748b`   | `chrome.labelSecondary` |

## Branding

- `ChartSourceBar` component for footer branding
- `getSourceBarHeight(showBranding)` for margin calculations
- Branding shown for free tier, hidden for paid tiers (`isPaidTier()` from `@variscout/core/tier`)

## Performance Charts (Multi-Measure Analysis)

Performance charts analyze multiple measurement channels (fill heads, cavities, nozzles):

| Component               | Base Export                 | Purpose                           |
| ----------------------- | --------------------------- | --------------------------------- |
| `PerformanceIChart`     | `PerformanceIChartBase`     | Cpk scatter plot by channel       |
| `PerformanceBoxplot`    | `PerformanceBoxplotBase`    | Distribution comparison (max 5)   |
| `PerformancePareto`     | `PerformanceParetoBase`     | Cpk ranking, worst first (max 20) |
| `PerformanceCapability` | `PerformanceCapabilityBase` | Single channel histogram          |

**Props pattern:**

- All accept `channels: ChannelResult[]` from `@variscout/core`
- Support `selectedMeasure` for drill-down highlighting
- Use `onChannelClick` callback for selection

**Cross-app usage:**

- PWA/Azure: Use responsive wrapper (auto-sizing)

## Violin Mode

Both `Boxplot` and `PerformanceBoxplot` support `showViolin?: boolean` prop. When true, renders `@visx/stats` `<ViolinPlot>` behind box elements using KDE data from `calculateKDE()` in `@variscout/core`. Controlled via `displayOptions.showViolin` in the app wrappers.

## Many Categories (ADR-051)

When datasets have many categories (e.g., 80+ countries from stacked wide-form data):

**Pareto:** Top 20 categories shown, remainder aggregated into "Others" bar (muted color). `PARETO_MAX_CATEGORIES = 20` from `useParetoChartData`. The "Others" bar is styled with `othersKey` prop for muted fill.

**Boxplot (adaptive):** Categories are limited based on container width (`MIN_BOX_STEP = 50px`). When there are more categories than fit, `selectBoxplotCategories()` selects the most relevant ones based on specs and sort:
- `smaller-is-better` → highest median first (worst performers)
- `larger-is-better` → lowest median first
- `nominal/target` → farthest from target first
- No specs → highest IQR first (most variation)
- Sort override → sort criterion drives selection

An overflow indicator ("⋯ +N") appears at the right edge when categories are truncated. The `visibleCategories` prop on `BoxplotBase` controls filtering. The `useBoxplotCategoryLimit` hook computes the visible set.

**Boxplot + Pareto labels:** When categories > 10, X-axis labels rotate -45° and truncate to 12 chars + "…". This applies to both standard Pareto and Boxplot.

**I-Chart tooltip:** Shows factor column values (e.g., "Month: Jul, Year: 2019") alongside the point value and index. Factor values are included in `IChartDataPoint.factorValues` via `useIChartData`.

## Dot Plot Fallback

All boxplots (`BoxplotBase`, `PerformanceBoxplotBase`) automatically switch from box-and-whisker to jittered dots when a category has fewer than 7 data points (`MIN_BOXPLOT_VALUES`). This is a per-category decision — a single chart can show boxes for some categories and dots for others. The threshold is exported from `@variscout/charts`.

## Boxplot Sorting

Categories in the standard Boxplot can be sorted via `sortBoxplotData()` from `@variscout/core`:

```typescript
import { sortBoxplotData } from '@variscout/core';
import type { BoxplotSortBy, BoxplotSortDirection } from '@variscout/core';

const sorted = sortBoxplotData(data, 'mean', 'desc');
```

| Criterion | `BoxplotSortBy` | Sorts by                      |
| --------- | --------------- | ----------------------------- |
| Name      | `'name'`        | Alphabetical (default)        |
| Mean      | `'mean'`        | Group mean value              |
| Spread    | `'spread'`      | IQR (Q3 - Q1)                |

Direction: `'asc'` (ascending, default) or `'desc'` (descending).

Sorting is applied in the **app Boxplot wrapper** (not `BoxplotBase`). State lives in `DisplayOptions.boxplotSortBy` / `boxplotSortDirection` (see `@variscout/hooks` types). `BoxplotDisplayToggle` exposes `sortBy`, `sortDirection`, and `onSortChange` props alongside the existing violin/contribution toggles.

## Chart Annotations

Three chart types support annotations via right-click context menu. Text observations create Findings (not transient annotations). Color highlights remain as separate visual markers.

| Chart   | Anchor Type       | Highlights | Text Observations | Props                                           |
| ------- | ----------------- | ---------- | ----------------- | ----------------------------------------------- |
| Boxplot | Category-based    | Yes        | Yes (Finding)     | `highlightedCategories`, `onBoxContextMenu`     |
| Pareto  | Category-based    | Yes        | Yes (Finding)     | `highlightedCategories`, `onBarContextMenu`     |
| I-Chart | Free-floating (%) | No         | Yes (Finding)     | `ichartAnnotations`, `onChartContextMenu`       |

"Add observation" creates a `Finding` with `source` metadata (`FindingSource` with chartType, category, anchorX/Y). `ChartAnnotationLayer` reads from `Finding[]`, not `ChartAnnotation[]`. Color highlights (red/amber/green) remain in `DisplayOptions` as lightweight visual markers — they do not create findings.

State managed by `useAnnotations` hook. UI: `ChartAnnotationLayer` and `AnnotationContextMenu` from `@variscout/ui`. Mobile (<640px): `MobileCategorySheet` bottom sheet. Question-linked findings have `showOnChart: false` by default.

## Target Reference Line

`BoxplotBase` accepts an optional `targetLine` prop for rendering a horizontal dashed reference line (e.g., Cpk target in capability mode):

| Prop | Type | Purpose |
|------|------|---------|
| `targetLine` | `{ value: number; color: string; label?: string }` | Horizontal dashed line at the given value |

## Chart Export

Charts export at fixed, presentation-ready dimensions via `useChartCopy` from `@variscout/hooks`. All exports (clipboard copy, PNG download, SVG download) temporarily resize the chart container, wait for visx re-render, then capture — producing identical output from any view (dashboard card or focused).

### Export Dimensions

| Group | Chart | Width | Height | Ratio |
|-------|-------|-------|--------|-------|
| Wide | I-Chart | 1200 | 540 | 2.2:1 |
| Wide | Boxplot | 1200 | 800 | 3:2 |
| Wide | Pareto | 1200 | 720 | 5:3 |
| Compact | Histogram | 800 | 600 | 4:3 |
| Compact | Probability | 800 | 700 | ~1.14:1 |
| Wide | Yamazumi | 1200 | 800 | 3:2 |
| Text | Stats panel | 1200 | 400 | 3:1 |
| Composite | Dashboard | 1600 | auto | 16:9 target |

All exported with `pixelRatio: 2` (double actual pixels). Wide charts use desktop font breakpoint (>=768px). Dimensions defined in `EXPORT_SIZES` in `packages/hooks/src/useChartCopy.ts`.

Dashboard uses auto-height mode (`height: 0` in EXPORT_SIZES) — captures full scrollable content at 1600px width (triggers `lg:flex-row` breakpoint for side-by-side layout). Copy/Download buttons in sticky nav bar, marked `data-export-hide`.

### Components

- `ChartDownloadMenu` — Dropdown (PNG/SVG) from `@variscout/ui`, uses colorScheme pattern
- `useChartCopy` — Hook from `@variscout/hooks`: copy-to-clipboard, PNG download, SVG download
- Copy button: inline 1-click with Check feedback icon
- All export icons use `size={14}`

## Evidence Map (Data Relationship Visualization)

Spatial visualization of factor relationships using R²adj from best subsets regression:

| Component | Base Export | Purpose |
|-----------|-------------|---------|
| `EvidenceMap` | `EvidenceMapBase` | Layered SVG: factor nodes, relationship edges, causal links |

**3-layer architecture (composited `<g>` groups):**
- **Layer 1 (Statistical):** Factor nodes by R²adj, 5 relationship types, equation bar. PWA + Azure.
- **Layer 2 (Investigation):** CausalLink directed edges, evidence badges (D/G/E), gap markers. Azure only.
- **Layer 3 (Synthesis):** SuspectedCause hub convergence zones, projections. Azure only.

Props-based, uses `chartColors`/`chromeColors` constants. Layout: `evidenceMapLayout.ts` in `@variscout/core/stats`. Data flow: `useEvidenceMapData` hook. Mobile: `enableZoom` for pinch/pan, `compact` hides labels until zoom > 1.5x. Pop-out: `usePopoutChannel` (BroadcastChannel). See CLAUDE.md Evidence Map rows for design specs and interaction details.

## Yamazumi Chart (Lean Time Study Analysis)

Yamazumi stacked bar chart visualizes cycle time composition by activity type:

| Component | Base Export | Purpose |
|-----------|-------------|---------|
| `YamazumiChart` | `YamazumiChartBase` | Stacked bars by activity type per step |

**Activity type colors (fixed, never change by drill level):**
- VA: `#22c55e` (green) — Value-Adding
- NVA Required: `#f59e0b` (amber) — Necessary non-value-adding
- Waste: `#ef4444` (red) — Eliminable waste
- Wait: `#94a3b8` (grey) — Queue/wait time

Accepts `data: YamazumiBarData[]` from `computeYamazumiData()`, `taktTime` for target line. Theme-aware via `useChartTheme`.

**Chart slot mapping (Yamazumi mode):**

| Slot | Standard | Performance | Yamazumi |
|------|----------|-------------|----------|
| 1 | I-Chart | Cpk Scatter | I-Chart (switchable metric) |
| 2 | Boxplot | Boxplot | Yamazumi Chart |
| 3 | Pareto | Pareto (Cpk) | Pareto (5 switchable modes) |
| 4 | Stats | Stats | Yamazumi Summary |

## Chart Performance

### Memoization (React Compiler)

React Compiler (babel-plugin-react-compiler, enabled in both apps) automatically memoizes components and hooks. **Do not add manual `React.memo()` wrapping to new chart components** — the compiler handles it. Existing base components (`IChartBase`, `BoxplotBase`, `ParetoBase`, `YamazumiChartBase`) do not use `React.memo` and rely on the compiler.

### LTTB Point Decimation

I-Chart uses Largest-Triangle-Three-Buckets (LTTB) downsampling for large datasets. When `chartWidth` is provided to `useIChartData`, datasets exceeding `chartWidth * 2` points are decimated to that threshold while preserving visual shape.

- Stats are computed from the **full** dataset (decimation is display-only)
- Control limit violation points (above UCL or below LCL) are force-included — never hidden by decimation
- The `lttb()` function is in `@variscout/core` (`packages/core/src/stats/lttb.ts`)

## Adding New Charts

1. Create `NewChart.tsx` with `NewChartBase` export
2. Add to `packages/charts/src/index.ts` exports
3. Add props interface to `types.ts`
