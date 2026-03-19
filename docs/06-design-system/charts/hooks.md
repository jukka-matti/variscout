---
title: 'Chart Hooks'
---

# Chart Hooks

React hooks for chart layout, tooltips, and selection state in `@variscout/charts`.

## Overview

| Hook                | Purpose                                                       |
| ------------------- | ------------------------------------------------------------- |
| `useChartLayout`    | Consolidated layout calculations (margins, fonts, dimensions) |
| `useChartTooltip`   | Unified tooltip positioning                                   |
| `useSelectionState` | Selection state and opacity management                        |
| `useChartTheme`     | Theme-aware colors for dark/light themes                      |
| `useMultiSelection` | Minitab-style brushing and multi-point selection              |

**Source:** `packages/charts/src/hooks/`, `packages/charts/src/useChartTheme.ts`

---

## useChartLayout

Consolidates all common chart initialization logic into a single hook.

**Source:** `packages/charts/src/hooks/useChartLayout.ts`

### Options

```typescript
interface UseChartLayoutOptions {
  parentWidth: number; // Container width in pixels
  parentHeight: number; // Container height in pixels
  chartType: ChartType; // 'ichart' | 'boxplot' | 'pareto' | 'histogram' | 'scatter'
  showBranding?: boolean; // Show source bar (default: true)
  marginOverride?: ChartMargins; // Bypass responsive margins
  fontsOverride?: ChartFonts; // Bypass responsive fonts
}
```

### Returns

```typescript
interface ChartLayout {
  fonts: ChartFonts; // Scaled font sizes
  margin: ChartMargins; // Chart margins
  sourceBarHeight: number; // Height of branding bar
  width: number; // Inner chart width
  height: number; // Inner chart height
  fontScale: number; // Font scale from theme
}
```

### Usage

```tsx
import { useChartLayout } from '@variscout/charts';

const MyChart: React.FC<{ parentWidth: number; parentHeight: number }> = ({
  parentWidth,
  parentHeight,
}) => {
  const { fonts, margin, width, height, sourceBarHeight } = useChartLayout({
    parentWidth,
    parentHeight,
    chartType: 'ichart',
    showBranding: true,
  });

  return (
    <svg width={parentWidth} height={parentHeight}>
      <Group left={margin.left} top={margin.top}>
        {/* Chart content using width, height, fonts */}
      </Group>
    </svg>
  );
};
```

### What It Combines

1. **Font scale** from `useChartTheme()` (theme-aware)
2. **Source bar height** from `getSourceBarHeight(showBranding)`
3. **Responsive margins** from `getResponsiveMargins(width, chartType)`
4. **Scaled fonts** from `getScaledFonts(width, fontScale)`
5. **Inner dimensions** calculated from parent size minus margins

---

## useChartTooltip

Unified tooltip positioning with two positioning methods.

**Source:** `packages/charts/src/hooks/useChartTooltip.ts`

### Returns

```typescript
interface UseChartTooltipReturn<T> {
  tooltipData: T | undefined;
  tooltipLeft: number | undefined;
  tooltipTop: number | undefined;
  tooltipOpen: boolean;
  showTooltipAtPoint: (event: React.MouseEvent, data: T) => void;
  showTooltipAtCoords: (x: number, y: number, data: T) => void;
  hideTooltip: () => void;
  usesLocalPoint: boolean;
}
```

### Two Positioning Methods

#### `showTooltipAtPoint(event, data)`

Uses `localPoint()` from mouse event. Tooltip follows cursor.

```tsx
const { showTooltipAtPoint, hideTooltip, tooltipLeft, tooltipTop, tooltipData } =
  useChartTooltip<MyData>();

<Circle
  onMouseMove={(e) => showTooltipAtPoint(e, data)}
  onMouseLeave={hideTooltip}
/>

// No margin offset needed when rendering
<TooltipWithBounds left={tooltipLeft} top={tooltipTop}>
  {tooltipData?.label}
</TooltipWithBounds>
```

#### `showTooltipAtCoords(x, y, data)`

Uses scale values directly. Tooltip appears at data point.

```tsx
const { showTooltipAtCoords, hideTooltip, tooltipLeft, tooltipTop, usesLocalPoint, margin } =
  useChartTooltip<MyData>();

<Circle
  onMouseOver={() => showTooltipAtCoords(xScale(d.x), yScale(d.y), d)}
  onMouseLeave={hideTooltip}
/>

// Requires margin offset when rendering
<TooltipWithBounds
  left={usesLocalPoint ? tooltipLeft : margin.left + (tooltipLeft ?? 0)}
  top={usesLocalPoint ? tooltipTop : margin.top + (tooltipTop ?? 0)}
>
  {tooltipData?.label}
</TooltipWithBounds>
```

### `usesLocalPoint` Flag

The hook tracks which method was used so you can conditionally apply margin offsets:

```tsx
const offsetLeft = usesLocalPoint ? tooltipLeft : margin.left + (tooltipLeft ?? 0);
const offsetTop = usesLocalPoint ? tooltipTop : margin.top + (tooltipTop ?? 0);
```

---

## useSelectionState

Manages selection state and opacity for chart elements.

**Source:** `packages/charts/src/hooks/useSelectionState.ts`

### Options

```typescript
interface UseSelectionStateOptions {
  selectedKeys: string[]; // Currently selected keys
}
```

### Returns

```typescript
interface UseSelectionStateReturn {
  isSelected: (key: string) => boolean;
  hasSelection: boolean;
  getOpacity: (key: string) => number;
}
```

### Opacity Values

```typescript
export const selectionOpacity = {
  selected: 1, // Active/selected items
  dimmed: 0.3, // Unselected when selection exists
};
```

### Usage

```tsx
import { useSelectionState, chartColors, chromeColors } from '@variscout/charts';

const { isSelected, hasSelection, getOpacity } = useSelectionState({
  selectedKeys: selectedBars,
});

{
  data.map(d => (
    <Bar
      key={d.key}
      fill={isSelected(d.key) ? chartColors.selected : chromeColors.boxDefault}
      opacity={getOpacity(d.key)}
      onClick={() => onSelect(d.key)}
    />
  ));
}
```

### Behavior

| Condition                             | `getOpacity(key)` Result |
| ------------------------------------- | ------------------------ |
| No selection exists                   | 1 (full opacity)         |
| Key is selected                       | 1 (full opacity)         |
| Key not selected, but other items are | 0.3 (dimmed)             |

---

## useChartTheme

Provides theme-aware chart colors with automatic updates when the theme changes.

**Source:** `packages/charts/src/useChartTheme.ts`

### Interface

```typescript
interface ChartThemeColors {
  /** Whether dark theme is active */
  isDark: boolean;
  /** Chrome colors for current theme */
  chrome: ChromeColorValues;
  /** Data colors */
  colors: Record<ChartColor, string>;
  /** Font scale multiplier (from data-chart-scale attribute) */
  fontScale: number;
}
```

### Usage

```tsx
import { useChartTheme } from '@variscout/charts';

const MyChart = () => {
  const { isDark, chrome, colors, fontScale } = useChartTheme();

  // Use chrome.xxx for UI elements (adapts to theme):
  // chrome.gridLine, chrome.axisPrimary, chrome.labelPrimary, etc.

  // Use colors.xxx for data elements:
  // colors.pass, colors.fail, colors.mean, colors.spec, etc.
};
```

### Observed Attributes

The hook watches two `<html>` element attributes via `MutationObserver`:

| Attribute          | Values                        | Purpose               |
| ------------------ | ----------------------------- | --------------------- |
| `data-theme`       | `'light'` or `'dark'`         | Theme switching       |
| `data-chart-scale` | Numeric string (e.g. `'1.2'`) | Font scale multiplier |

### Color Resolution

| isDark | chrome source       | colors source |
| ------ | ------------------- | ------------- |
| true   | `chromeColors`      | `chartColors` |
| false  | `chromeColorsLight` | `chartColors` |

---

## useMultiSelection

Minitab-style brushing and multi-point selection for scatter/time-series charts.

**Source:** `packages/charts/src/hooks/useMultiSelection.ts`

### Options

```typescript
interface UseMultiSelectionOptions<T> {
  /** Chart data points */
  data: T[];
  /** X-axis scale (visx/d3 scale) */
  xScale: ChartScale;
  /** Y-axis scale (visx/d3 scale) */
  yScale: ChartScale;
  /** Currently selected point indices (controlled state) */
  selectedPoints: Set<number>;
  /** Callback when selection changes */
  onSelectionChange: (indices: Set<number>) => void;
  /** Accessor for X value (default: d => d.x) */
  getX?: (d: T, index: number) => number;
  /** Accessor for Y value (default: d => d.y) */
  getY?: (d: T, index: number) => number;
  /** Enable brush selection (default: true) */
  enableBrush?: boolean;
}
```

### Returns

```typescript
interface UseMultiSelectionResult {
  brushExtent: BrushExtent | null;
  isBrushing: boolean;
  handleBrushStart: (event: React.MouseEvent<SVGElement>) => void;
  handleBrushMove: (event: React.MouseEvent<SVGElement>) => void;
  handleBrushEnd: () => void;
  handlePointClick: (index: number, event: React.MouseEvent) => void;
  isPointSelected: (index: number) => boolean;
  getPointOpacity: (index: number) => number;
  getPointSize: (index: number) => number;
  getPointStrokeWidth: (index: number) => number;
}
```

### Interaction Modes

| Action           | Behavior                         |
| ---------------- | -------------------------------- |
| Drag region      | Select all points within brush   |
| Click            | Replace selection with one point |
| Ctrl/Cmd + click | Toggle point in/out of selection |
| Shift + click    | Add point to selection           |

### Visual Styling

| State                   | Opacity | Size | Stroke Width |
| ----------------------- | ------- | ---- | ------------ |
| No selection exists     | 1.0     | 4    | 1            |
| Selected                | 1.0     | 6    | 2            |
| Unselected (has others) | 0.3     | 4    | 1            |

### Usage

```tsx
import { useMultiSelection } from '@variscout/charts';

const {
  brushExtent,
  isBrushing,
  handleBrushStart,
  handleBrushMove,
  handleBrushEnd,
  handlePointClick,
  isPointSelected,
  getPointOpacity,
  getPointSize,
  getPointStrokeWidth,
} = useMultiSelection({
  data,
  xScale,
  yScale,
  selectedPoints,
  onSelectionChange,
  enableBrush: true,
});

// Wire up SVG event handlers
<svg
  onMouseDown={handleBrushStart}
  onMouseMove={handleBrushMove}
  onMouseUp={handleBrushEnd}
  onMouseLeave={handleBrushEnd}
>
  {data.map((d, i) => (
    <Circle
      r={getPointSize(i)}
      opacity={getPointOpacity(i)}
      strokeWidth={getPointStrokeWidth(i)}
      onClick={e => handlePointClick(i, e)}
    />
  ))}
</svg>;
```

Currently used by the **IChart** component for `enableBrushSelection` mode.

---

## useChartCopy

Copy chart to clipboard or download as PNG/SVG with fixed, presentation-ready dimensions. All exports temporarily resize the chart container off-screen, wait for visx ResizeObserver re-render, then capture — producing identical output from dashboard cards and focused views.

**Source:** `packages/hooks/src/useChartCopy.ts`

### Options

```typescript
interface UseChartCopyOptions {
  /** Return background color for the screenshot. Called at copy time. Defaults to #0f172a. */
  getBackgroundColor?: () => string;
}
```

### Returns

```typescript
interface UseChartCopyReturn {
  copyFeedback: string | null;
  handleCopyChart: (containerId: string, chartName: string) => Promise<void>;
  handleDownloadPng: (containerId: string, chartName: string) => Promise<void>;
  handleDownloadSvg: (containerId: string, chartName: string) => void;
}
```

### Fixed Export Dimensions

All charts export at fixed dimensions regardless of current container size:

| Chart         | Width | Height | Actual (x2) |
| ------------- | ----- | ------ | ----------- |
| `ichart`      | 1200  | 540    | 2400 x 1080 |
| `boxplot`     | 1200  | 800    | 2400 x 1600 |
| `pareto`      | 1200  | 720    | 2400 x 1440 |
| `histogram`   | 800   | 600    | 1600 x 1200 |
| `probability` | 800   | 700    | 1600 x 1400 |
| `stats`       | 1200  | 400    | 2400 x 800  |
| `dashboard`   | 1600  | auto   | 3200 x auto |

Unknown chart names fall back to 1200 x 675. The `EXPORT_SIZES` map is exported from `@variscout/hooks` for reference.

**Auto-height mode**: When `height` is `0` in EXPORT_SIZES (used by `dashboard`), `withFixedSize` sets `height: auto; overflow: visible` instead of a fixed pixel height. This captures the full scrollable content without clipping. At 1600px width, the `lg:flex-row` breakpoint is active so charts render side-by-side.

### Usage

```tsx
import { useChartCopy } from '@variscout/hooks';

const { copyFeedback, handleCopyChart, handleDownloadPng, handleDownloadSvg } = useChartCopy({
  getBackgroundColor: () => isDark ? '#0f172a' : '#ffffff',
});

// Copy to clipboard (1-click)
<button onClick={() => handleCopyChart('ichart-card', 'ichart')}>
  {copyFeedback === 'ichart' ? <Check size={14} /> : <Copy size={14} />}
</button>

// Download menu (via ChartDownloadMenu from @variscout/ui)
<ChartDownloadMenu
  containerId="boxplot-card"
  chartName="boxplot"
  onDownloadPng={handleDownloadPng}
  onDownloadSvg={handleDownloadSvg}
/>
```

### Dashboard Export

The full dashboard can be exported as a single image for PowerPoint slides. Copy/Download buttons sit in the sticky nav bar:

```tsx
// Dashboard export uses the same hook — just pass 'dashboard' as chartName
<button onClick={() => handleCopyChart('dashboard-export-container', 'dashboard')}>
  {copyFeedback === 'dashboard' ? <Check size={14} /> : <Copy size={14} />}
</button>
<button onClick={() => handleDownloadPng('dashboard-export-container', 'dashboard')}>
  <Download size={14} />
</button>
```

No SVG export for dashboard (multi-SVG composition doesn't serialize cleanly).

### How Fixed-Size Export Works

1. Sets `data-exporting="true"` on the container (hides UI-only elements via CSS)
2. Saves current `style.cssText` and locks parent `min-height`
3. Moves container off-screen at fixed export dimensions (`position: fixed; left: -9999px`)
4. Waits for visx ResizeObserver + React re-render (~100ms: double rAF + setTimeout)
5. Captures with `html-to-image` at `pixelRatio: 2`
6. Restores original styles and parent lock (even on error)

---

## Import Pattern

```typescript
import {
  useChartLayout,
  useChartTooltip,
  useSelectionState,
  selectionOpacity,
  useChartTheme,
} from '@variscout/charts';

import { useMultiSelection } from '@variscout/charts/hooks/useMultiSelection';
```

---

## Complete Example

```tsx
import {
  useChartLayout,
  useChartTooltip,
  useSelectionState,
  ChartTooltip,
} from '@variscout/charts';

const MyChart: React.FC<Props> = ({ parentWidth, parentHeight, data, selectedKeys }) => {
  // Layout
  const { fonts, margin, width, height } = useChartLayout({
    parentWidth,
    parentHeight,
    chartType: 'boxplot',
  });

  // Tooltip
  const { tooltipData, tooltipOpen, tooltipLeft, tooltipTop, showTooltipAtPoint, hideTooltip } =
    useChartTooltip<DataPoint>();

  // Selection
  const { getOpacity } = useSelectionState({ selectedKeys });

  return (
    <div style={{ position: 'relative' }}>
      <svg width={parentWidth} height={parentHeight}>
        <Group left={margin.left} top={margin.top}>
          {data.map(d => (
            <Bar
              key={d.key}
              opacity={getOpacity(d.key)}
              onMouseMove={e => showTooltipAtPoint(e, d)}
              onMouseLeave={hideTooltip}
            />
          ))}
        </Group>
      </svg>

      <ChartTooltip
        data={tooltipData}
        isOpen={tooltipOpen}
        left={tooltipLeft}
        top={tooltipTop}
        fonts={fonts}
      >
        {d => (
          <div>
            {d.label}: {d.value}
          </div>
        )}
      </ChartTooltip>
    </div>
  );
};
```

---

## See Also

- [Overview](./overview.md) - Chart design system overview and selection guide
- [Colors](./colors.md) - `useChartTheme` hook for theme-aware colors
- [Responsive](./responsive.md) - Underlying responsive utilities
- [Shared Components](./shared-components.md) - ChartTooltip component
