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

**"Add observation"** (context menu) creates a `Finding` with `source` metadata (`FindingSource` with chartType, category, anchorX/Y). The floating text box rendered by `ChartAnnotationLayer` is a visual projection of the Finding. `ChartAnnotationLayer` reads from `Finding[]` (filtered by source), not `ChartAnnotation[]`.

**Color highlights** (red/amber/green) remain in `DisplayOptions` as lightweight visual markers. They do not create findings.

**Category-based** (Boxplot/Pareto): Observations anchor to a named category. Offsets reset on data changes. Finding carries `source.category`.

**Free-floating** (I-Chart): Observations store percentage positions (0.0-1.0) within the chart area. Position is data-independent. Finding carries `source.anchorX`/`source.anchorY`. I-Chart dot colors are never overridden (blue = in-control, red = violation).

**Status dot**: Each annotation box displays a status dot matching the finding's investigation status (amber = observed, blue = investigating, purple = analyzed).

State managed by `useAnnotations` hook from `@variscout/hooks`. UI components: `ChartAnnotationLayer` and `AnnotationContextMenu` from `@variscout/ui`.

**Mobile (<640px)**: Tap on boxplot box or Pareto bar opens `MobileCategorySheet` bottom action sheet (from `@variscout/ui`) with category stats, drill-down, highlight, and pin-as-finding actions. "Pin as Finding" includes `source` metadata (chart type and category). Draggable text annotations (`ChartAnnotationLayer`) remain desktop-only. I-Chart annotations are desktop-only on all platforms.

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

**Props pattern:**
- Accepts `data: YamazumiBarData[]` from `computeYamazumiData()` in `@variscout/core`
- `taktTime?: number` renders horizontal dashed line (reuses spec limit pattern)
- `onBarClick`, `onBarContextMenu` for drill-down and findings
- `highlightedBars` for annotation highlights
- Theme-aware via `useChartTheme`

**Chart slot mapping (Yamazumi mode):**

| Slot | Standard | Performance | Yamazumi |
|------|----------|-------------|----------|
| 1 | I-Chart | Cpk Scatter | I-Chart (switchable metric) |
| 2 | Boxplot | Boxplot | Yamazumi Chart |
| 3 | Pareto | Pareto (Cpk) | Pareto (5 switchable modes) |
| 4 | Stats | Stats | Yamazumi Summary |

## Chart Performance

### React.memo

All chart base components (`IChartBase`, `BoxplotBase`, `ParetoBase`, `YamazumiChartBase`) are wrapped in `React.memo()` to prevent unnecessary re-renders when parent state changes but chart props haven't changed. This is critical on mobile where each re-render of SVG subtrees is expensive.

### LTTB Point Decimation

I-Chart uses Largest-Triangle-Three-Buckets (LTTB) downsampling for large datasets. When `chartWidth` is provided to `useIChartData`, datasets exceeding `chartWidth * 2` points are decimated to that threshold while preserving visual shape.

- Stats are computed from the **full** dataset (decimation is display-only)
- Control limit violation points (above UCL or below LCL) are force-included — never hidden by decimation
- The `lttb()` function is in `@variscout/core` (`packages/core/src/stats/lttb.ts`)

## Adding New Charts

1. Create `NewChart.tsx` with `NewChartBase` export
2. Add to `packages/charts/src/index.ts` exports
3. Add props interface to `types.ts`
