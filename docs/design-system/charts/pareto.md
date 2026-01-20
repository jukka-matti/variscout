# Pareto Charts

Frequency analysis and ranking charts with cumulative percentage lines.

## Overview

VariScout provides two Pareto chart variants for different analysis contexts:

| Component             | Purpose                     | Context           | Data Source         |
| --------------------- | --------------------------- | ----------------- | ------------------- |
| **ParetoChart**       | Category frequency analysis | Standard Analysis | `ParetoDataPoint[]` |
| **PerformancePareto** | Channel Cpk ranking         | Performance Mode  | `ChannelResult[]`   |

**Source:** `packages/charts/src/ParetoChart.tsx`, `packages/charts/src/PerformancePareto.tsx`

---

## Standard ParetoChart

Shows frequency distribution with bars sorted by count (highest first) and a cumulative percentage line. Classic Pareto analysis for identifying the "vital few" causes.

### Props Interface

```typescript
interface ParetoChartProps extends BaseChartProps {
  /** Pareto data with counts and cumulative percentages */
  data: ParetoDataPoint[];
  /** Total count for percentage calculations */
  totalCount: number;
  /** X-axis label (factor name) */
  xAxisLabel?: string;
  /** Y-axis label */
  yAxisLabel?: string;
  /** Currently selected bars */
  selectedBars?: string[];
  /** Callback when a bar is clicked */
  onBarClick?: (key: string) => void;
}
```

### Data Structure

```typescript
interface ParetoDataPoint {
  key: string; // Category identifier
  value: number; // Count for this category
  cumulative: number; // Running total
  cumulativePercentage: number; // Cumulative % (0-100)
}
```

Data must be pre-sorted by value (descending) with cumulative percentages calculated.

### Display Features

- **Bars:** Count for each category (left Y-axis)
- **Cumulative line:** Running percentage with circle markers
- **80% threshold:** Dashed orange reference line
- **Dual Y-axes:** Count (left) and Cumulative % (right)

### Example

```tsx
import ParetoChart from '@variscout/charts/ParetoChart';

const paretoData: ParetoDataPoint[] = [
  { key: 'Shift A', value: 45, cumulative: 45, cumulativePercentage: 45 },
  { key: 'Shift B', value: 30, cumulative: 75, cumulativePercentage: 75 },
  { key: 'Shift C', value: 15, cumulative: 90, cumulativePercentage: 90 },
  { key: 'Shift D', value: 10, cumulative: 100, cumulativePercentage: 100 },
];

<ParetoChart
  data={paretoData}
  totalCount={100}
  xAxisLabel="Shift"
  yAxisLabel="Defect Count"
  onBarClick={key => console.log('Selected:', key)}
/>;
```

### Selection Mode

Highlights specific bars while dimming others:

```tsx
<ParetoChart
  data={paretoData}
  totalCount={100}
  selectedBars={['Shift A', 'Shift B']}
  onBarClick={key => toggleSelection(key)}
/>
```

Selection uses `useSelectionState` hook with `selectionOpacity.dimmed` (0.3) for unselected items.

---

## PerformancePareto

Shows channels ranked by Cpk (worst first) in Pareto-style bar chart. Helps identify which channels need the most attention.

### Props Interface

```typescript
interface PerformanceParetoProps extends BaseChartProps {
  /** Channel results for ranking */
  channels: ChannelResult[];
  /** Currently selected measure/channel */
  selectedMeasure?: string | null;
  /** Maximum number of channels to display (default: 20) */
  maxDisplayed?: number;
  /** Callback when a bar is clicked */
  onChannelClick?: (channelId: string) => void;
}
```

### Display Behavior

| State            | Display                                              |
| ---------------- | ---------------------------------------------------- |
| No selection     | Worst N channels by Cpk (ascending sort)             |
| Channel selected | Selected channel highlighted, others dimmed (0.4)    |
| Empty channels   | Placeholder: "No channel performance data available" |

### Sorting and Limiting

Channels are automatically sorted by Cpk ascending (worst first) using `sortChannels(channels, 'cpk-asc')` from `@variscout/core`. The `maxDisplayed` prop limits display (default: 20).

### Health-Based Coloring

Bar color reflects channel capability health:

| Health      | Cpk Range   | Color                         |
| ----------- | ----------- | ----------------------------- |
| `critical`  | < 1.0       | Red (`chartColors.fail`)      |
| `warning`   | 1.0 - 1.33  | Amber (`chartColors.warning`) |
| `capable`   | 1.33 - 1.67 | Green (`chartColors.pass`)    |
| `excellent` | >= 1.67     | Blue (`chartColors.mean`)     |

### Reference Lines

| Line     | Value | Color | Meaning                  |
| -------- | ----- | ----- | ------------------------ |
| Critical | 1.0   | Red   | Minimum acceptable Cpk   |
| Target   | 1.33  | Green | Industry standard target |

### Example

```tsx
import PerformancePareto from '@variscout/charts/PerformancePareto';

<PerformancePareto
  channels={channelResults}
  selectedMeasure={selectedId}
  maxDisplayed={15}
  onChannelClick={handleChannelSelect}
/>;
```

---

## Visual Elements

| Element             | Standard ParetoChart       | PerformancePareto          |
| ------------------- | -------------------------- | -------------------------- |
| **Bars**            | Count values (descending)  | Cpk values (ascending)     |
| **Bar color**       | Default or selected        | Health-based               |
| **Cumulative line** | Orange with circle markers | Orange with circle markers |
| **Left Y-axis**     | Count                      | Cpk                        |
| **Right Y-axis**    | Cumulative %               | Cumulative %               |
| **Reference line**  | 80% threshold (orange)     | Cpk 1.0 & 1.33 (red/green) |
| **Grid**            | Horizontal rows            | Horizontal rows            |
| **X-axis labels**   | Category names             | Channel labels (truncated) |

---

## Data Flow

### Standard ParetoChart

```
DataContext (PWA/Azure)
    |
Dashboard.tsx
    | Calculate counts, sort, compute cumulative %
ParetoChart (responsive wrapper)
    |
ParetoChartBase (renders SVG)
```

### PerformancePareto

```
DataContext (PWA/Azure)
    | analyzePerformanceData()
PerformanceDashboard.tsx
    | channels: ChannelResult[]
PerformancePareto (responsive wrapper)
    | sortChannels(channels, 'cpk-asc')
    | slice(0, maxDisplayed)
PerformanceParetoBase (renders SVG)
```

---

## Interactions

### Click Behavior

```tsx
// Standard ParetoChart - toggle category selection
onBarClick={(key) => {
  if (selectedBars.includes(key)) {
    setSelectedBars(bars => bars.filter(b => b !== key));
  } else {
    setSelectedBars(bars => [...bars, key]);
  }
}}

// PerformancePareto - single channel selection (toggle)
onChannelClick={(channelId) => {
  setSelectedMeasure(prev => prev === channelId ? null : channelId);
}}
```

### Hover Tooltip

Standard ParetoChart tooltip shows:

- Category key
- Count value
- Cumulative percentage

PerformancePareto tooltip shows:

- Channel label
- Rank (e.g., #1, #2)
- Cpk value
- Sample size (n)
- Health status (colored)

---

## Cross-App Usage

### PWA and Azure

Use the responsive wrapper (auto-sizing with `withParentSize`):

```tsx
import ParetoChart from '@variscout/charts/ParetoChart';
import PerformancePareto from '@variscout/charts/PerformancePareto';

// Standard Pareto
<div className="h-[400px]">
  <ParetoChart
    data={paretoData}
    totalCount={100}
    xAxisLabel="Category"
    onBarClick={handleClick}
  />
</div>

// Performance Pareto
<div className="h-[300px]">
  <PerformancePareto
    channels={channels}
    onChannelClick={handleClick}
  />
</div>
```

### Excel Add-in

Use the Base variant with explicit sizing:

```tsx
import { ParetoChartBase } from '@variscout/charts/ParetoChart';
import { PerformanceParetoBase } from '@variscout/charts/PerformancePareto';

// Standard Pareto with explicit size
<ParetoChartBase
  parentWidth={500}
  parentHeight={350}
  data={paretoData}
  totalCount={100}
/>

// Performance Pareto with explicit size
<PerformanceParetoBase
  parentWidth={400}
  parentHeight={300}
  channels={channels}
/>
```

---

## Colors and Theming

### Bar Colors

| Variant             | Condition    | Fill Color                |
| ------------------- | ------------ | ------------------------- |
| Standard (default)  | Unselected   | `chromeColors.boxDefault` |
| Standard (selected) | In selection | `chartColors.selected`    |
| Performance         | By health    | Health color (see above)  |

### Theme-Aware Colors

PerformancePareto uses `useChartTheme()` for automatic light/dark adaptation:

```typescript
const { chrome } = useChartTheme();

// Chrome colors adapt to theme:
// chrome.gridLine, chrome.axisPrimary, chrome.labelPrimary, etc.
```

Standard ParetoChart uses hardcoded dark theme colors from `chromeColors`.

### Cumulative Line & Reference Colors

```typescript
// Cumulative line
stroke={chartColors.cumulative}  // orange-500

// 80% threshold (standard)
stroke={chartColors.threshold80} // orange-500

// Cpk thresholds (performance)
stroke={chartColors.fail}        // red-500 (1.0)
stroke={chartColors.pass}        // green-500 (1.33)
```

---

## Responsive Behavior

X-axis labels are rotated 45 degrees when there are more than 10 categories in PerformancePareto. Labels longer than 8 characters are truncated with ellipsis.

---

## Exports

```typescript
// Responsive wrappers (auto-sizing)
import ParetoChart from '@variscout/charts/ParetoChart';
import PerformancePareto from '@variscout/charts/PerformancePareto';

// Base components (manual sizing)
import { ParetoChartBase } from '@variscout/charts/ParetoChart';
import { PerformanceParetoBase } from '@variscout/charts/PerformancePareto';

// Types
import type { ParetoChartProps, ParetoDataPoint, PerformanceParetoProps } from '@variscout/charts';
```

---

## See Also

- [README](./README.md) - Chart design system overview and selection guide
- [Colors](./colors.md) - Chart color constants and health classification
- [Responsive](./responsive.md) - Breakpoints and scaling utilities
- [Hooks](./hooks.md) - useChartLayout, useChartTooltip, useSelectionState
- [Performance Mode](./performance-mode.md) - Full Performance Mode documentation
- [Overview](./overview.md) - All chart types and common patterns
- [Boxplot](./boxplot.md) - Distribution comparison charts
