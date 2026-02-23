# Chart Hooks

React hooks for chart layout, tooltips, and selection state in `@variscout/charts`.

## Overview

| Hook                | Purpose                                                       |
| ------------------- | ------------------------------------------------------------- |
| `useChartLayout`    | Consolidated layout calculations (margins, fonts, dimensions) |
| `useChartTooltip`   | Unified tooltip positioning                                   |
| `useSelectionState` | Selection state and opacity management                        |
| `useChartTheme`     | Theme-aware colors with executive mode support                |
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
  /** Current chart mode */
  mode: 'technical' | 'executive';
  /** Chrome colors for current theme and mode */
  chrome: ChromeColorValues;
  /** Data colors for current mode */
  colors: Record<ChartColor, string>;
  /** Font scale multiplier (from data-chart-scale attribute) */
  fontScale: number;
}
```

### Usage

```tsx
import { useChartTheme } from '@variscout/charts';

const MyChart = () => {
  const { isDark, mode, chrome, colors, fontScale } = useChartTheme();

  // Use chrome.xxx for UI elements (adapts to theme + mode):
  // chrome.gridLine, chrome.axisPrimary, chrome.labelPrimary, etc.

  // Use colors.xxx for data elements (adapts to mode):
  // colors.pass, colors.fail, colors.mean, colors.spec, etc.

  const isExecutive = mode === 'executive';
};
```

### Observed Attributes

The hook watches three `<html>` element attributes via `MutationObserver`:

| Attribute          | Values                         | Purpose               |
| ------------------ | ------------------------------ | --------------------- |
| `data-theme`       | `'light'` or `'dark'`          | Theme switching       |
| `data-chart-mode`  | `'technical'` or `'executive'` | Color palette mode    |
| `data-chart-scale` | Numeric string (e.g. `'1.2'`)  | Font scale multiplier |

### Color Resolution

| Mode        | isDark | chrome source       | colors source     |
| ----------- | ------ | ------------------- | ----------------- |
| `technical` | true   | `chromeColors`      | `chartColors`     |
| `technical` | false  | `chromeColorsLight` | `chartColors`     |
| `executive` | any    | `executiveChrome`   | `executiveColors` |

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
