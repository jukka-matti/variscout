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
  /** Grade tiers for multi-tier grading */
  grades?: GradeTier[];
  /** Y-axis label */
  yAxisLabel?: string;
  /** Axis settings for manual scaling */
  axisSettings?: { min?: number; max?: number };
  /** Override Y-axis domain (for locking scale to full dataset) */
  yDomainOverride?: YAxisDomain;
  /** Callback when a point is clicked */
  onPointClick?: (index: number, originalIndex?: number) => void;
  /** Callback when brush selection changes */
  onBrushChange?: (range: [number, number] | null) => void;
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

#### Grade Bands Mode

Multi-tier grading with colored background bands:

```tsx
<IChart
  data={chartData}
  stats={statsResult}
  specs={specs}
  grades={[
    { label: 'A', max: 95, color: '#22c55e' },
    { label: 'B', max: 100, color: '#3b82f6' },
    { label: 'C', max: 105, color: '#f59e0b' },
  ]}
/>
```

Grade bands render as semi-transparent rectangles behind the data.

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

| Element            | Standard IChart                   | PerformanceIChart                         |
| ------------------ | --------------------------------- | ----------------------------------------- |
| **Data points**    | Circles on time series            | Circles by channel index                  |
| **Data line**      | Connecting line (dimmed)          | Not shown                                 |
| **UCL/LCL**        | Dashed lines with labels          | Dashed gray (mean ± 3σ of Cpk/Cp)         |
| **Mean line**      | Solid blue line with label        | Solid blue (mean Cpk/Cp across channels)  |
| **Target line**    | Dashed green line                 | Dashed green (user-defined, default 1.33) |
| **Spec limits**    | Dashed red lines (USL/LSL)        | Not shown                                 |
| **Stage dividers** | Vertical dashed lines (if staged) | Not applicable                            |
| **Grid**           | Horizontal rows                   | Horizontal rows                           |

---

## Point Coloring (Minitab 2-Color Scheme)

Standard IChart uses a simple two-color scheme following Minitab conventions:

| Condition               | Color | Meaning          |
| ----------------------- | ----- | ---------------- |
| Above USL or below LSL  | Red   | Out of spec      |
| Above UCL or below LCL  | Red   | Out of control   |
| Nelson Rule 2 violation | Red   | Pattern detected |
| All checks pass         | Blue  | In control       |

**Nelson Rule 2:** 9 or more consecutive points on the same side of the mean line.

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

### Excel Add-in

Use the Base variant with explicit sizing:

```tsx
import { IChartBase } from '@variscout/charts/IChart';
import { PerformanceIChartBase } from '@variscout/charts/PerformanceIChart';

// Standard IChart with explicit size
<IChartBase
  parentWidth={500}
  parentHeight={350}
  data={chartData}
  stats={stats}
  specs={specs}
/>

// Performance IChart with explicit size
<PerformanceIChartBase
  parentWidth={400}
  parentHeight={300}
  channels={channels}
/>
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
// Control limits
stroke={chartColors.control}  // slate-400 dashed

// Mean line
stroke={chartColors.mean}     // blue-500 solid

// Spec limits (USL/LSL)
stroke={chartColors.spec}     // red-500 dashed

// Target line
stroke={chartColors.target}   // green-500 dashed
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

- [README](./README.md) - Chart design system overview and selection guide
- [Colors](./colors.md) - Chart color constants and health classification
- [Responsive](./responsive.md) - Breakpoints and scaling utilities
- [Hooks](./hooks.md) - useChartLayout, useChartTooltip
- [Performance Mode](./performance-mode.md) - Full Performance Mode documentation
- [Overview](./overview.md) - All chart types and common patterns
- [Boxplot](./boxplot.md) - Distribution comparison charts
