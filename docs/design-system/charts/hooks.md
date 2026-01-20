# Chart Hooks

React hooks for chart layout, tooltips, and selection state in `@variscout/charts`.

## Overview

| Hook                | Purpose                                                       |
| ------------------- | ------------------------------------------------------------- |
| `useChartLayout`    | Consolidated layout calculations (margins, fonts, dimensions) |
| `useChartTooltip`   | Unified tooltip positioning                                   |
| `useSelectionState` | Selection state and opacity management                        |
| `useChartTheme`     | Theme-aware colors (documented in colors.md)                  |

**Source:** `packages/charts/src/hooks/`

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

## Import Pattern

```typescript
import {
  useChartLayout,
  useChartTooltip,
  useSelectionState,
  selectionOpacity,
} from '@variscout/charts';
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

- [README](./README.md) - Chart design system overview and selection guide
- [Colors](./colors.md) - `useChartTheme` hook for theme-aware colors
- [Responsive](./responsive.md) - Underlying responsive utilities
- [Shared Components](./shared-components.md) - ChartTooltip component
- [Utilities](./utilities.md) - Accessibility and interaction helpers
- [Overview](./overview.md) - Chart architecture and common patterns
