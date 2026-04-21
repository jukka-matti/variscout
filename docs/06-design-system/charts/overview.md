---
title: 'Chart Styling Overview'
audience: [designer, developer]
category: reference
status: stable
---

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

| Chart               | Purpose                     | Key Features                                                    |
| ------------------- | --------------------------- | --------------------------------------------------------------- |
| **IChart**          | Individual values over time | UCL/LCL lines, out-of-spec highlighting                         |
| **Boxplot**         | Distribution by category    | Quartiles, whiskers, outliers, Violin Mode (density overlay)    |
| **ParetoChart**     | Defect frequency/value      | Sorted bars, cumulative line, 80% reference, aggregation toggle |
| **Histogram**       | Value distribution          | Bins, normal curve overlay                                      |
| **ScatterPlot**     | X-Y relationship            | Regression line, R² display                                     |
| **ProbabilityPlot** | Normality assessment        | Reference line, confidence bands                                |

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

## Chart Annotations

I-Chart, Boxplot, and Pareto charts support two types of chart annotations: **color highlights** (lightweight visual markers) and **observations** (text annotations backed by the Findings system).

### Annotation Types

| Type              | Charts                   | Stored in                | Creates a Finding? |
| ----------------- | ------------------------ | ------------------------ | ------------------ |
| Color highlights  | Boxplot, Pareto          | DisplayOptions           | No                 |
| Text observations | Boxplot, Pareto, I-Chart | Findings (AnalysisState) | Yes                |

**Color highlights** (red/amber/green) are lightweight visual markers on Boxplot boxes and Pareto bars. They do not create findings and are stored in DisplayOptions.

**Text observations** create a Finding with `source` metadata linking it to the originating chart and category. The floating text box on the chart is a visual projection of the underlying Finding — editing either side keeps them in sync. The annotation box displays a small status dot reflecting the finding's investigation status (amber = observed, blue = investigating, purple = analyzed).

### Anchor Types

| Chart   | Anchor Type       | Highlights | How to Create                                          |
| ------- | ----------------- | ---------- | ------------------------------------------------------ |
| Boxplot | Category-based    | Yes        | Right-click box → context menu → "Add observation"     |
| Pareto  | Category-based    | Yes        | Right-click bar → context menu → "Add observation"     |
| I-Chart | Free-floating (%) | No         | Right-click chart area → observation appears at cursor |

**Category-based anchors** (Boxplot/Pareto): observations follow the named group and are hidden when that category is filtered out. Offsets reset to (0, 0) on data changes (snap back to anchor). The Finding carries a `source` field with chart type and category name.

**Free-floating anchors** (I-Chart): observations are stored as a percentage position within the chart area. They remain at their visual position when data is filtered or the time range changes. I-Chart dot colors carry semantic meaning (blue = in-control, red = violation) and are never overridden by highlight colors.

### Interaction Model

| Platform        | Interaction               | Charts                   |
| --------------- | ------------------------- | ------------------------ |
| Desktop         | Right-click context menu  | Boxplot, Pareto, I-Chart |
| Mobile (<640px) | Tap → bottom action sheet | Boxplot, Pareto          |

Mobile: `MobileCategorySheet` "Pin as Finding" action includes `source` metadata (chart type and category). I-Chart observations (free-floating text) are desktop-only.

### Components

| Component               | Package         | Purpose                                                              |
| ----------------------- | --------------- | -------------------------------------------------------------------- |
| `ChartAnnotationLayer`  | `@variscout/ui` | HTML overlay for draggable text annotations (reads from `Finding[]`) |
| `AnnotationBox`         | `@variscout/ui` | Individual annotation (edit, drag, resize, status dot)               |
| `AnnotationContextMenu` | `@variscout/ui` | Right-click menu (highlight + add observation)                       |

### Data Types

Text observations are stored as `Finding` objects (from `@variscout/core`) with a `source` field:

```typescript
interface FindingSource {
  chartType: 'boxplot' | 'pareto' | 'ichart';
  category?: string; // category name (Boxplot/Pareto)
  anchorX?: number; // 0–1 fraction of chart width (I-Chart)
  anchorY?: number; // 0–1 fraction of chart height (I-Chart)
}

// Finding.source links the finding to its chart origin
interface Finding {
  id: string;
  text: string;
  status: FindingStatus;
  source?: FindingSource; // present for chart observations
  // ... other Finding fields
}
```

Color highlights remain a separate lightweight type:

```typescript
type HighlightColor = 'red' | 'amber' | 'green';
// Stored in DisplayOptions.highlightedCategories
```

### Chart Base Props

Both `BoxplotBase` and `ParetoChartBase` accept:

- `highlightedCategories?: Record<string, HighlightColor>` — per-category fill color override
- `onBoxContextMenu?: (key: string, event: React.MouseEvent) => void` — right-click handler (Boxplot)
- `onBarContextMenu?: (key: string, event: React.MouseEvent) => void` — right-click handler (Pareto)

`IChartBase` accepts:

- `ichartAnnotations?: Finding[]` — findings with chart source to render as floating annotations
- `onChartContextMenu?: (anchorX: number, anchorY: number, event: React.MouseEvent) => void` — right-click handler

### Hook: `useAnnotations`

Shared hook from `@variscout/hooks` managing annotation state:

- `contextMenu` state (open, position, category, chart type)
- `handleContextMenu(chartType, key, event)` — opens context menu (Boxplot/Pareto)
- `setHighlight(chartType, key, color)` — direct color setting (DisplayOptions)
- `createObservation(chartType, key)` — creates a Finding with chart source metadata
- `createIChartObservation(anchorX, anchorY)` — creates a Finding at % position with I-Chart source
- `clearHighlights(chartType)` — clears color highlights for a chart
- Data fingerprint offset reset (Boxplot/Pareto annotations snap back on data changes)

Text observations are persisted via the Findings system (AnalysisState), not DisplayOptions.

---

## Common Elements

### Spec Limit Lines

```tsx
// USL (Upper Spec Limit) - Red dash-dot
<line stroke="#ef4444" strokeDasharray="8,3,2,3" strokeWidth={1.5} strokeOpacity={0.7} />

// LSL (Lower Spec Limit) - Amber dash-dot
<line stroke="#f59e0b" strokeDasharray="8,3,2,3" strokeWidth={1.5} strokeOpacity={0.7} />

// Target - Green dotted
<line stroke="#22c55e" strokeDasharray="2,2" strokeWidth={1} />
```

### Control Lines

```tsx
// UCL/LCL (Control Limits) - staged mode (subtler)
<line stroke="#3b82f6" strokeDasharray="6,4" strokeWidth={0.8} strokeOpacity={0.6} />

// UCL/LCL (Control Limits) - non-staged mode
<line stroke="#3b82f6" strokeDasharray="4,4" strokeWidth={1} />

// Center line (Mean) - Bold in staged mode
<line stroke="#64748b" strokeWidth={2} />  // staged
<line stroke="#64748b" strokeWidth={1.5} /> // non-staged
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

The popover provides min/max inputs with validation. The popover provides min/max inputs with validation.

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

- [Colors](./colors.md) - Data visualization color palette
- [Responsive](./responsive.md) - Breakpoints and scaling utilities
- [Hooks](./hooks.md) - React hooks API for charts
- [Shared Components](./shared-components.md) - Reusable chart UI components
