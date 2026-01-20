# Chart Styling Overview

VariScout charts are built with [Visx](https://airbnb.io/visx/) and follow consistent styling patterns.

## Architecture

Charts are in the `@variscout/charts` package and are **props-based** (no context dependency):

```tsx
interface ChartProps extends BaseChartProps {
  data: DataType[];
  specs?: SpecLimits;
  showBranding?: boolean;
  parentWidth: number;
  parentHeight: number;
}
```

## Component Structure

Each chart exports:

- **Wrapped version** - Uses `withParentSize` for responsive sizing
- **Base version** - Accepts explicit dimensions

```tsx
import IChart, { IChartBase } from '@variscout/charts';

// Auto-sizing (fills parent container)
<IChart data={data} specs={specs} />

// Manual sizing
<IChartBase data={data} specs={specs} parentWidth={800} parentHeight={400} />
```

## Dark Theme

All charts use a dark theme matching the application:

- Background: transparent (inherits from container)
- Grid lines: `#334155` (slate-700) with 30-50% opacity
- Axis lines: `#64748b` (slate-500)
- Text: `#94a3b8` (slate-400)

## Chart Types

| Chart               | Purpose                     | Key Features                                |
| ------------------- | --------------------------- | ------------------------------------------- |
| **IChart**          | Individual values over time | UCL/LCL lines, out-of-spec highlighting     |
| **Boxplot**         | Distribution by category    | Quartiles, whiskers, outliers               |
| **ParetoChart**     | Defect frequency            | Sorted bars, cumulative line, 80% reference |
| **Histogram**       | Value distribution          | Bins, normal curve overlay                  |
| **ScatterPlot**     | X-Y relationship            | Regression line, R² display                 |
| **ProbabilityPlot** | Normality assessment        | Reference line, confidence bands            |
| **GageRRChart**     | Variance breakdown          | Horizontal bars, threshold lines            |
| **InteractionPlot** | Factor interaction          | Multi-series lines                          |

### I-Chart Data Point Coloring

The I-Chart uses a Minitab-style 2-color scheme for clarity:

| Color | Hex       | Condition                               |
| ----- | --------- | --------------------------------------- |
| Blue  | `#3b82f6` | Point is in-control (passes all checks) |
| Red   | `#ef4444` | Point has any violation                 |

**Violation check order:**

1. Spec limit violations (`value > USL` or `value < LSL`)
2. Control limit violations (`value > UCL` or `value < LCL`)
3. Nelson Rule 2 (9+ consecutive points on same side of center line)

See [colors.md](colors.md) for implementation details and graded data handling.

## Common Elements

### Spec Limit Lines

```tsx
// USL (Upper Spec Limit) - Red dashed
<line stroke="#ef4444" strokeDasharray="6,3" strokeWidth={1.5} />

// LSL (Lower Spec Limit) - Amber dashed
<line stroke="#f59e0b" strokeDasharray="6,3" strokeWidth={1.5} />

// Target - Green dashed
<line stroke="#22c55e" strokeDasharray="4,4" strokeWidth={1} />
```

### Control Lines

```tsx
// UCL/LCL (Control Limits) - Blue dashed
<line stroke="#3b82f6" strokeDasharray="4,4" />

// Center line (Mean) - Gray
<line stroke="#64748b" />
```

### Limit Annotations (Minitab-style)

I-Chart displays numeric values next to limit lines for at-a-glance reading:

```tsx
// Text annotation positioned right of chart
<text
  x={width + 4}
  y={yScale(value)}
  fill={lineColor}
  fontSize={fonts.statLabel}
  textAnchor="start"
  dominantBaseline="middle"
>
  UCL: {value.toFixed(1)}
</text>
```

**Annotation Types:**

| Line   | Color     | Format       | Clickable |
| ------ | --------- | ------------ | --------- |
| UCL    | `#64748b` | "UCL: 47.3"  | No        |
| Mean   | `#3b82f6` | "Mean: 42.1" | No        |
| LCL    | `#64748b` | "LCL: 36.9"  | No        |
| USL    | `#ef4444` | "USL: 50.0"  | Yes       |
| LSL    | `#ef4444` | "LSL: 35.0"  | Yes       |
| Target | `#22c55e` | "Tgt: 42.0"  | Yes       |

**Responsive Margin:**

The I-Chart right margin is increased to accommodate annotations:

```tsx
// In responsive.ts
ichart: { top: 40, right: 85, bottom: 60, left: 70 }
```

**Clickable Spec Editing:**

Spec limit annotations (USL/LSL/Target) are clickable to open the spec editor:

```tsx
<g
  onClick={() => onSpecClick?.('usl')}
  style={{ cursor: onSpecClick ? 'pointer' : 'default' }}
  className="hover:opacity-80"
>
  <line ... />
  <text>USL: {specs.usl.toFixed(1)}</text>
</g>
```

**Accessing Spec Editor:**

Users can open the SpecEditor from multiple entry points:

| Entry Point         | Location                        | When Visible                     |
| ------------------- | ------------------------------- | -------------------------------- |
| "+ Specs" button    | I-Chart header                  | When no specs defined            |
| "+ Target" button   | I-Chart header                  | When specs defined but no target |
| Click annotation    | I-Chart (USL/LSL/Target labels) | When specs are defined           |
| Click specs display | StatsPanel bottom section       | Always (secondary access)        |
| Menu item           | MobileMenu → Analysis section   | Mobile only                      |

The MobileMenu "Edit Specification Limits" option ensures mobile users have clear access to spec editing since the I-Chart header buttons may be less discoverable on small screens.

### Y-Axis Scale Editing

Users can click the Y-axis tick area to open a popover for manual scale adjustment. This allows focusing on specific data ranges or ensuring consistent scales across analyses.

**Entry Point:**

The I-Chart includes an invisible clickable rectangle over the Y-axis tick area:

```tsx
{
  onYAxisClick && (
    <rect
      x={0}
      y={margin.top}
      width={margin.left}
      height={height - margin.top - margin.bottom}
      fill="transparent"
      style={{ cursor: 'pointer' }}
      onClick={e => {
        const rect = e.currentTarget.getBoundingClientRect();
        onYAxisClick({ top: e.clientY - rect.top, left: margin.left });
      }}
    />
  );
}
```

**YAxisPopover Component:**

The popover provides min/max inputs with validation. See [YAxisPopover documentation](../components/popovers.md#yaxispopover) for full details.

```tsx
<YAxisPopover
  isOpen={yAxisPopoverOpen}
  onClose={() => setYAxisPopoverOpen(false)}
  currentMin={yAxisSettings.min}
  currentMax={yAxisSettings.max}
  autoMin={dataMin}
  autoMax={dataMax}
  onSave={setYAxisSettings}
  anchorPosition={popoverPosition}
/>
```

**Behavior:**

| Setting       | Y-Scale Behavior                        |
| ------------- | --------------------------------------- |
| Both empty    | Auto-scale from data (default)          |
| Min only      | Fixed minimum, auto maximum             |
| Max only      | Auto minimum, fixed maximum             |
| Both set      | Fixed range (validation: min < max)     |
| Reset to Auto | Clears overrides, returns to auto-scale |

**Visual Indicator:**

When custom scale is active, the chart shows a visual cue (implementation-specific) to indicate non-default scaling.

### Tooltips

Use Visx `useTooltip` with consistent styling:

```tsx
<TooltipWithBounds
  style={{
    background: '#1e293b',
    border: '1px solid #334155',
    color: '#f1f5f9',
    fontSize: 12,
    padding: '8px 12px',
  }}
>
  {content}
</TooltipWithBounds>
```

### Branding Footer

`ChartSourceBar` component adds branding:

```tsx
<ChartSourceBar
  width={width}
  top={height + margin.bottom - 18}
  n={dataLength}
  brandingText="VariScout Lite"
/>
```

Height: 18px (included in bottom margin calculations)

## Best Practices

1. **Use responsive utilities** from `packages/charts/src/responsive.ts`
2. **Include branding** unless chart is in a compact view
3. **Add tooltips** for interactive elements
4. **Handle empty states** gracefully - show actionable options when no data (see [feedback patterns](../patterns/feedback.md#actionable-empty-state))
5. **Test at multiple sizes** using the responsive wrapper

---

## See Also

- [README](./README.md) - Chart design system overview and selection guide
- [Colors](./colors.md) - Data visualization color palette
- [Responsive](./responsive.md) - Breakpoints and scaling utilities
- [Hooks](./hooks.md) - React hooks API for charts
- [Shared Components](./shared-components.md) - Reusable chart UI components
- [Utilities](./utilities.md) - Accessibility and interaction helpers
