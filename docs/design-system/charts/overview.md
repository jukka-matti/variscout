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
