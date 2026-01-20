# Shared Chart Components

Reusable components for building consistent charts in `@variscout/charts`.

## Overview

The charts package provides shared components that enforce visual consistency:

| Component               | Purpose                                |
| ----------------------- | -------------------------------------- |
| `SpecLimitLine`         | Horizontal spec/control limit lines    |
| `VerticalSpecLimitLine` | Vertical spec limit lines (histograms) |
| `ChartTooltip`          | Standardized tooltip wrapper           |
| `EditableChartTitle`    | Click-to-edit title component          |
| `ChartCard`             | Card wrapper with header layout        |

**Source:** `packages/charts/src/components/`

---

## SpecLimitLine

Renders horizontal specification and control limit lines with consistent styling.

**Source:** `packages/charts/src/components/SpecLimitLine.tsx`

### Props

```typescript
interface SpecLimitLineProps {
  value: number; // The limit value
  type: LimitType; // 'usl' | 'lsl' | 'target' | 'ucl' | 'lcl' | 'mean'
  yScale: NumericScale; // Y-scale for positioning
  width: number; // Chart inner width
  fonts: ChartFonts; // Font sizes for label
  showLabel?: boolean; // Show label (default: true)
  labelText?: string; // Custom label text
  labelOffset?: number; // Label position from right (default: 4)
  onLabelClick?: () => void; // Click handler for label
  decimalPlaces?: number; // Value display precision (default: 1)
}
```

### Limit Type Styling

Each limit type has predefined color and line style:

| Type     | Color                          | Line Style | Default Label   |
| -------- | ------------------------------ | ---------- | --------------- |
| `usl`    | `chartColors.spec` (red)       | Dashed 6,3 | "USL: {value}"  |
| `lsl`    | `chartColors.spec` (red)       | Dashed 6,3 | "LSL: {value}"  |
| `target` | `chartColors.target` (purple)  | Dotted 2,2 | "Tgt: {value}"  |
| `ucl`    | `chartColors.control` (orange) | Dashed 4,4 | "UCL: {value}"  |
| `lcl`    | `chartColors.control` (orange) | Dashed 4,4 | "LCL: {value}"  |
| `mean`   | `chartColors.mean` (blue)      | Solid      | "Mean: {value}" |

### Example

```tsx
import { SpecLimitLine } from '@variscout/charts';

<SpecLimitLine
  value={specs.usl}
  type="usl"
  yScale={yScale}
  width={width}
  fonts={fonts}
  onLabelClick={() => onSpecClick?.('usl')}
/>;
```

---

## VerticalSpecLimitLine

Renders vertical specification lines for histogram X-axis positioning.

### Props

```typescript
interface VerticalSpecLimitLineProps {
  value: number;
  type: LimitType;
  xScale: NumericScale; // X-scale for positioning
  height: number; // Chart inner height
  fonts: ChartFonts;
  showLabel?: boolean;
  labelText?: string;
}
```

### Example

```tsx
<VerticalSpecLimitLine value={specs.lsl} type="lsl" xScale={xScale} height={height} fonts={fonts} />
```

---

## ChartTooltip

Standardized tooltip wrapper with consistent styling across all charts.

**Source:** `packages/charts/src/components/ChartTooltip.tsx`

### Props

```typescript
interface ChartTooltipProps<T> {
  data: T | undefined; // Tooltip data (hidden when undefined)
  isOpen: boolean; // Whether tooltip is visible
  left?: number; // X position from tooltip hook
  top?: number; // Y position from tooltip hook
  margin?: ChartMargins; // Chart margins for offset
  fonts: ChartFonts; // Font sizes
  children: (data: T) => React.ReactNode; // Render function
  applyMarginOffset?: boolean; // Apply margin offset (default: true)
}
```

### Styling

Uses `chromeColors` for consistent appearance:

- Background: `chromeColors.tooltipBg`
- Text: `chromeColors.tooltipText`
- Border: `chromeColors.tooltipBorder`
- Border radius: 6px
- Padding: 8px 12px

### Example

```tsx
import { ChartTooltip } from '@variscout/charts';

<ChartTooltip
  data={tooltipData}
  isOpen={tooltipOpen}
  left={tooltipLeft}
  top={tooltipTop}
  margin={margin}
  fonts={fonts}
>
  {data => (
    <>
      <div>
        <strong>{data.label}</strong>
      </div>
      <div>Value: {data.value}</div>
    </>
  )}
</ChartTooltip>;
```

### `getTooltipStyle(fonts)`

For charts that need custom positioning, get the style object directly:

```tsx
import { getTooltipStyle } from '@variscout/charts';

<TooltipWithBounds style={getTooltipStyle(fonts)}>{/* Custom content */}</TooltipWithBounds>;
```

---

## EditableChartTitle

Click-to-edit chart title with subtle hover indicator.

**Source:** `packages/charts/src/components/EditableChartTitle.tsx`

### Props

```typescript
interface EditableChartTitleProps {
  defaultTitle: string; // Auto-generated title (shown when custom is empty)
  value?: string; // Current custom title
  onChange: (newTitle: string) => void;
  className?: string;
}
```

### UX Pattern

1. **Display mode:**
   - Shows subtle dashed underline on hover
   - Cursor: text (indicates editable)

2. **Edit mode:**
   - Text input with blue border
   - Text pre-selected for easy replacement
   - Helper text: "Enter to save - Esc to cancel"

3. **Saving:**
   - Enter key saves
   - Escape cancels
   - Blur (click outside) saves
   - Empty input reverts to default

### Example

```tsx
import { EditableChartTitle } from '@variscout/charts';

<h2 className="text-xl font-bold">
  <EditableChartTitle
    defaultTitle={`${measureColumn} Control Chart`}
    value={customTitle}
    onChange={setCustomTitle}
  />
</h2>;
```

---

## ChartCard

Reusable card wrapper with consistent header layout for chart panels.

**Source:** `packages/charts/src/components/ChartCard.tsx`

### Props

```typescript
interface ChartCardProps {
  title: string; // Chart title (auto-generated default)
  icon?: React.ReactNode; // Optional icon component

  // Editable title support
  editableTitle?: boolean;
  customTitle?: string;
  onTitleChange?: (title: string) => void;

  // Header controls
  controls?: React.ReactNode; // Right-side controls
  actions?: React.ReactNode; // Action buttons (copy, maximize)

  children: React.ReactNode; // Chart content
  className?: string;
  id?: string;
  onClick?: () => void;
}
```

### Layout

```
[Icon] [Title (editable?)] .......... [Controls] [Actions]
[Chart Content]
```

### Example

```tsx
import { ChartCard } from '@variscout/charts';

<ChartCard
  title="I-Chart"
  icon={<TrendingUp />}
  editableTitle={true}
  customTitle={chartTitle}
  onTitleChange={setChartTitle}
  controls={
    <select value={view} onChange={e => setView(e.target.value)}>
      <option value="all">All Points</option>
      <option value="last30">Last 30</option>
    </select>
  }
  actions={<button onClick={onCopy}>Copy</button>}
>
  <IChart data={data} specs={specs} />
</ChartCard>;
```

### Styling

- Background: `bg-surface-secondary`
- Border: `border-edge`
- Padding: `p-6`
- Border radius: `rounded-2xl`
- Shadow: `shadow-xl shadow-black/20`

---

## Import Patterns

### Direct Import

```typescript
import { SpecLimitLine, ChartTooltip, ChartCard } from '@variscout/charts';
```

### Components Index

All shared components are exported from the components barrel:

```typescript
// packages/charts/src/components/index.ts
export { SpecLimitLine, VerticalSpecLimitLine } from './SpecLimitLine';
export { ChartTooltip, getTooltipStyle } from './ChartTooltip';
export { default as EditableChartTitle } from './EditableChartTitle';
export { default as ChartCard } from './ChartCard';
```

---

## See Also

- [README](./README.md) - Chart design system overview and selection guide
- [Utilities](./utilities.md) - A11y and interaction utilities
- [Hooks](./hooks.md) - useChartTooltip hook
- [Colors](./colors.md) - Chart color constants
- [Responsive](./responsive.md) - Breakpoints and scaling utilities
- [Overview](./overview.md) - Chart architecture and common patterns
