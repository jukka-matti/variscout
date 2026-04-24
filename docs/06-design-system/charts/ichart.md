---
title: 'Individual Control Charts (I-Chart)'
audience: [designer, developer]
category: reference
status: stable
---

# Individual Control Charts (I-Chart)

Time-series control charts for individual measurements with control limits and specification limits.

## Overview

VariScout provides two I-Chart variants for different analysis contexts:

| Component             | Purpose                        | Context           | Data Source         |
| --------------------- | ------------------------------ | ----------------- | ------------------- |
| **IChart**            | Time-series control monitoring | Standard Analysis | `IChartDataPoint[]` |
| **PerformanceIChart** | Cpk scatter by channel         | Performance Mode  | `ChannelResult[]`   |

**Source:** `packages/charts/src/IChart.tsx`, `packages/charts/src/PerformanceIChart.tsx`

---

## Standard IChart

Displays individual measurements over time with control limits (UCL/LCL) and specification limits (USL/LSL). Follows Minitab conventions for control chart visualization.

### Props Interface

```typescript
interface IChartProps extends BaseChartProps {
  /** Data points with x (index), y (value), and optional stage */
  data: IChartDataPoint[];
  /** Statistical results (mean, stdDev, ucl, lcl) - used when not staged */
  stats: StatsResult | null;
  /** Staged statistics - when provided, renders per-stage control limits */
  stagedStats?: StagedStatsResult;
  /** Specification limits */
  specs: SpecLimits;
  /** Y-axis label */
  yAxisLabel?: string;
  /** Axis settings for manual scaling */
  axisSettings?: { min?: number; max?: number };
  /** Override Y-axis domain (for locking scale to full dataset) */
  yDomainOverride?: YAxisDomain;
  /** Callback when a point is clicked */
  onPointClick?: (index: number, originalIndex?: number) => void;
  /** Enable drag-to-select multi-point brushing */
  enableBrushSelection?: boolean;
  /** Currently selected point indices */
  selectedPoints?: Set<number>;
  /** Callback when selection changes */
  onSelectionChange?: (indices: Set<number>) => void;
  /** Sample size for branding bar */
  sampleSize?: number;
  /** Show Minitab-style labels next to limit lines (default: true) */
  showLimitLabels?: boolean;
  /** Callback when a spec limit label is clicked (for editing) */
  onSpecClick?: (spec: 'usl' | 'lsl' | 'target') => void;
  /** Callback when Y-axis area is clicked (for editing scale) */
  onYAxisClick?: (event?: React.MouseEvent) => void;
}
```

### Data Structure

```typescript
interface IChartDataPoint {
  /** X-axis value (typically index or time) */
  x: number;
  /** Y-axis value (measurement) */
  y: number;
  /** Original row index for drill-down navigation */
  originalIndex?: number;
  /** Stage identifier for staged I-Charts */
  stage?: string;
}
```

### Display Modes

#### Standard Mode (Single Stats)

Default view showing all data with unified control limits:

```tsx
<IChart
  data={chartData}
  stats={statsResult}
  specs={{ usl: 105, lsl: 95, target: 100 }}
  yAxisLabel="Fill Weight (g)"
/>
```

#### Staged Mode

When `stagedStats` is provided, the chart renders per-stage control limits with stage dividers:

```tsx
<IChart data={chartData} stats={null} stagedStats={stagedStatsResult} specs={specs} />
```

Features in staged mode:

- Vertical dashed stage dividers between stages
- Stage labels above each section
- Independent UCL/Mean/LCL per stage
- Nelson Rule 2 detection computed per stage

#### Visual Hierarchy (Staged Mode)

Staged mode renders many reference lines (control limits per stage + spec limits + grid rows), which can create visual clutter. The chart applies a layered visual hierarchy so each element has a distinct weight:

| Priority | Element        | Style                                                | Weight    |
| -------- | -------------- | ---------------------------------------------------- | --------- |
| 1        | Data points    | Shaped markers (circle/diamond/square/triangle, r=4) | Dominant  |
| 2        | Stage means    | Solid blue, 2px                                      | Bold      |
| 3        | Stage UCL/LCL  | Dashed (6,4), 0.8px, 60% opacity                     | Secondary |
| 4        | Stage dividers | Dashed (4,4), 1px                                    | Clear     |
| 5        | Spec limits    | Dash-dot (8,3,2,3), 1.5px, 70% opacity               | Reference |
| 6        | Grid rows      | 15% opacity (staged) / 40% (non-staged)              | Minimal   |

The dash-dot pattern on spec limits visually distinguishes the Voice of the Customer (spec limits) from the Voice of the Process (control limits), reinforcing the Two Voices model.

#### Y-Axis Lock Mode

Locks Y-axis scale to a fixed range (useful during drill-down to maintain reference):

```tsx
<IChart
  data={filteredData}
  stats={filteredStats}
  specs={specs}
  yDomainOverride={{ min: 90, max: 110 }}
/>
```

---

## PerformanceIChart

I-Chart for capability metrics (Cpk or Cp) across channels. Uses statistical control limits calculated from the capability distribution rather than health-based coloring.

### Props Interface

```typescript
interface PerformanceIChartProps extends BaseChartProps {
  /** Channel results with Cpk values */
  channels: ChannelResult[];
  /** Currently selected measure/channel */
  selectedMeasure?: string | null;
  /** Callback when a channel point is clicked */
  onChannelClick?: (channelId: string) => void;
  /** Which capability metric to display: 'cpk' (default) or 'cp' */
  capabilityMetric?: 'cp' | 'cpk';
  /** User-defined Cpk/Cp target line (default: 1.33) */
  cpkTarget?: number;
}
```

### Features

- **X-axis:** Channel index (1, 2, 3, ... n)
- **Y-axis:** Cpk or Cp value
- **Control limits:** UCL/LCL calculated from capability distribution (mean ± 3σ)
- **Mean line:** Average capability across all channels (solid blue)
- **Target line:** User-defined reference (default: 1.33, dashed green)
- **Nelson Rule 2 detection:** Flags 9+ consecutive points on same side of mean

### Display Behavior

| State            | Display                                              |
| ---------------- | ---------------------------------------------------- |
| No selection     | All channels as scatter points by Cpk/Cp             |
| Channel selected | Selected channel highlighted, others dimmed          |
| Empty channels   | Placeholder: "No channel performance data available" |

### Control Limit Lines

The chart displays statistical control limits calculated from the Cpk/Cp distribution:

| Line   | Calculation | Style        | Meaning                          |
| ------ | ----------- | ------------ | -------------------------------- |
| UCL    | mean + 3σ   | Dashed gray  | Upper Control Limit              |
| Mean   | x̄           | Solid blue   | Average capability               |
| LCL    | mean - 3σ   | Dashed gray  | Lower Control Limit (min: 0)     |
| Target | User input  | Dashed green | Reference target (default: 1.33) |

### Control-Based Coloring

Point color reflects statistical control status (I-Chart style):

| Status         | Color                     | Condition                                 |
| -------------- | ------------------------- | ----------------------------------------- |
| In-control     | Blue (`chartColors.mean`) | Within UCL/LCL, no rule violations        |
| Out-of-control | Red (`chartColors.fail`)  | Beyond UCL/LCL or Nelson Rule 2 violation |

**Note:** This differs from the other Performance charts (Boxplot, Pareto, Capability) which use health-based 4-tier coloring.

### Control Limit Calculation

Control limits are calculated using functions from `@variscout/core`:

```typescript
import { calculateCapabilityControlLimits, getCapabilityControlStatus } from '@variscout/core';

// Calculate limits from Cpk/Cp distribution
const limits = calculateCapabilityControlLimits(channels, 'cpk');
// Returns: { mean, stdDev, ucl, lcl, n }

// Determine control status for each channel
const statusMap = getCapabilityControlStatus(channels, limits, 'cpk');
// Returns: Map<channelId, { inControl, nelsonRule2Violation }>
```

### Example

```tsx
import PerformanceIChart from '@variscout/charts/PerformanceIChart';

<PerformanceIChart
  channels={channelResults}
  selectedMeasure={selectedId}
  onChannelClick={handleChannelSelect}
  capabilityMetric="cpk"
  cpkTarget={1.33}
/>;
```

---

## Statistical Elements

| Element            | Standard IChart                          | PerformanceIChart                         |
| ------------------ | ---------------------------------------- | ----------------------------------------- |
| **Data points**    | Circles on time series                   | Circles by channel index                  |
| **Data line**      | Connecting line (dimmed)                 | Not shown                                 |
| **UCL/LCL**        | Subtle dashed (0.8px, 60% opacity)       | Dashed gray (mean ± 3σ of Cpk/Cp)         |
| **Mean line**      | Bold solid blue (2px)                    | Solid blue (mean Cpk/Cp across channels)  |
| **Target line**    | Dashed green line                        | Dashed green (user-defined, default 1.33) |
| **Spec limits**    | Dash-dot orange (1.5px, 70% opacity)     | Not shown                                 |
| **Stage dividers** | Vertical dashed lines (if staged)        | Not applicable                            |
| **Grid**           | Subtle rows (15% staged, 40% non-staged) | Horizontal rows                           |

---

## Point Coloring (Minitab 2-Color Scheme)

Standard IChart uses a simple two-color scheme following Minitab conventions. Shape additionally encodes the rule type (see [Violation Shapes](#violation-shapes) below):

| Condition               | Color | Shape     | Meaning          |
| ----------------------- | ----- | --------- | ---------------- |
| Above USL or below LSL  | Red   | ● Circle  | Out of spec      |
| Above UCL or below LCL  | Red   | ● Circle  | Out of control   |
| Nelson Rule 2 violation | Red   | ◆ Diamond | Pattern detected |
| Nelson Rule 3 violation | Red   | ■ Square  | Trend detected   |
| All checks pass         | Blue  | ● Circle  | In control       |

Shape encodes the rule type; color encodes severity (always red for violations in the 2-color scheme, or directionally aware when a characteristic type is set).

**Nelson Rule 2:** 9 or more consecutive points on the same side of the mean line.

**Nelson Rule 3:** 6 or more consecutive strictly increasing or decreasing values.

---

## Violation Shapes

The `ViolationShape` type and the `ViolationPoint` component map each rule to a distinct SVG shape so that pattern types remain distinguishable at a glance.

```typescript
type ViolationShape = 'circle' | 'diamond' | 'square' | 'triangle';

// Shape assignment by rule priority (highest wins when multiple rules fire)
// spec / control violation → 'circle'
// Nelson Rule 2            → 'diamond'
// Nelson Rule 3            → 'square'
```

Shape sizing: all shapes are sized so that their visual area is approximately equal to a circle with `r=4` (16px²). Diamonds and squares are rotated 45° and upright respectively. The `ViolationPoint` component from `IChartBase` accepts a `shape` prop and renders the appropriate SVG path.

---

## Data Flow

### Standard IChart

```
DataContext (PWA/Azure)
    |
Dashboard.tsx
    | calculateStats() for control limits
IChart (responsive wrapper)
    |
IChartBase (renders SVG)
    | getStageBoundaries() if staged
    | getNelsonRule2ViolationPoints()
    | getNelsonRule3ViolationPoints()
```

### PerformanceIChart

```
DataContext (PWA/Azure)
    | analyzePerformanceData()
PerformanceDashboard.tsx
    | channels: ChannelResult[]
PerformanceIChart (responsive wrapper)
    |
PerformanceIChartBase (renders SVG)
```

---

## Interactions

### Click Behavior

```tsx
// Standard IChart - point selection
onPointClick={(index, originalIndex) => {
  // Navigate to specific data row
  scrollToRow(originalIndex ?? index);
}}

// Clickable spec labels (for editing)
onSpecClick={(spec) => {
  openSpecEditor(spec); // 'usl' | 'lsl' | 'target'
}}

// Clickable Y-axis (for editing scale)
onYAxisClick={() => {
  openAxisEditor();
}}

// PerformanceIChart - channel selection
onChannelClick={(channelId) => {
  setSelectedMeasure(prev => prev === channelId ? null : channelId);
}}
```

### Hover Tooltip

Standard IChart tooltip shows:

- Observation number (#1, #2, etc.)
- Stage name (if staged)
- Value

PerformanceIChart tooltip shows:

- Channel label
- Cp value
- Cpk value
- Sample size (n)
- Mean
- Control status (colored: "In control", "Out of control", or "Nelson Rule 2 violation")

---

## I-Chart Annotations

The I-Chart supports **free-floating text annotations** created via right-click on the chart area. Unlike Boxplot/Pareto annotations (which anchor to categories), I-Chart annotations use percentage-based positioning within the chart area.

### Annotation Props (App Wrapper Level)

The annotation system is wired at the app wrapper level (PWA and Azure IChart wrappers), not in `IChartBase` directly:

```typescript
interface IChartWrapperProps {
  // ... standard props ...

  /** Free-floating text annotations positioned by percentage */
  ichartAnnotations?: ChartAnnotation[];
  /** Callback to create a new annotation at a position (0.0-1.0) */
  onCreateAnnotation?: (anchorX: number, anchorY: number) => void;
  /** Callback when annotations are edited/moved/deleted */
  onAnnotationsChange?: (annotations: ChartAnnotation[]) => void;
}
```

### How It Works

1. User right-clicks anywhere on the I-Chart area
2. The wrapper converts click coordinates to percentage-based position (0.0-1.0) using `getResponsiveMargins('ichart')`
3. A new `ChartAnnotation` is created with `anchorX`/`anchorY` fields
4. `ChartAnnotationLayer` (from `@variscout/ui`) renders draggable text notes as an HTML overlay

### Position System

| Field            | Type   | Description                                                |
| ---------------- | ------ | ---------------------------------------------------------- |
| `anchorX`        | number | Horizontal position (0.0 = left, 1.0 = right)              |
| `anchorY`        | number | Vertical position (0.0 = top, 1.0 = bottom)                |
| `anchorCategory` | string | Self-referencing ID (I-Chart uses the annotation's own ID) |

Percentage-based positions are data-independent, so annotations remain valid when data changes.

### Clearing Annotations

A clear button appears in the I-Chart card header when `ichartAnnotations.length > 0`. The `useAnnotations` hook from `@variscout/hooks` provides `clearAnnotations('ichart')` for this.

---

## Cross-App Usage

### PWA and Azure

Use the responsive wrapper (auto-sizing with `withParentSize`):

```tsx
import IChart from '@variscout/charts/IChart';
import PerformanceIChart from '@variscout/charts/PerformanceIChart';

// Standard IChart
<div className="h-[400px]">
  <IChart
    data={chartData}
    stats={stats}
    specs={specs}
    onPointClick={handlePointClick}
  />
</div>

// Performance IChart
<div className="h-[300px]">
  <PerformanceIChart
    channels={channels}
    onChannelClick={handleClick}
  />
</div>
```

---

## Colors and Theming

### Point Colors

| Variant               | Condition                          | Fill Color                |
| --------------------- | ---------------------------------- | ------------------------- |
| Standard (in-ctrl)    | All checks pass                    | `chartColors.mean` (blue) |
| Standard (violation)  | Any violation                      | `chartColors.fail` (red)  |
| Performance (in-ctrl) | Within UCL/LCL, no rule violations | `chartColors.mean` (blue) |
| Performance (out)     | Beyond UCL/LCL or Nelson Rule 2    | `chartColors.fail` (red)  |

### Theme-Aware Colors

PerformanceIChart uses `useChartTheme()` for automatic light/dark adaptation:

```typescript
const { chrome } = useChartTheme();

// Chrome colors adapt to theme:
// chrome.gridLine, chrome.axisPrimary, chrome.labelPrimary, etc.
```

Standard IChart uses hardcoded dark theme colors from `chromeColors`.

### Reference Line Colors

```typescript
// Control limits (staged: subtler; non-staged: standard)
stroke={chartColors.control}  // cyan-500
strokeWidth={0.8}             // staged (1 for non-staged)
strokeDasharray="6,4"         // staged ("4,4" for non-staged)
strokeOpacity={0.6}           // staged (1 for non-staged)

// Mean line (bold anchor)
stroke={chartColors.mean}     // blue-500 solid
strokeWidth={2}               // staged (1.5 for non-staged)

// Spec limits (USL/LSL) - dash-dot pattern
stroke={chartColors.spec}     // red-500
strokeWidth={1.5}
strokeDasharray="8,3,2,3"     // dash-dot (distinct from control dashes)
strokeOpacity={0.7}

// Target line
stroke={chartColors.target}   // green-500 dotted
strokeWidth={1}
strokeDasharray="2,2"
```

---

## Exports

```typescript
// Responsive wrappers (auto-sizing)
import IChart from '@variscout/charts/IChart';
import PerformanceIChart from '@variscout/charts/PerformanceIChart';

// Base components (manual sizing)
import { IChartBase } from '@variscout/charts/IChart';
import { PerformanceIChartBase } from '@variscout/charts/PerformanceIChart';

// Types
import type { IChartProps, IChartDataPoint, PerformanceIChartProps } from '@variscout/charts';
```

---

## See Also

- [Overview](./overview.md) - Chart design system overview and selection guide
- [Colors](./colors.md) - Chart color constants and health classification
- [Responsive](./responsive.md) - Breakpoints and scaling utilities
- [Hooks](./hooks.md) - useChartLayout, useChartTooltip
- [Performance Mode](./performance-mode.md) - Full Performance Mode documentation
- [Boxplot](./boxplot.md) - Distribution comparison charts
