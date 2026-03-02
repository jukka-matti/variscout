# Pareto Charts

Frequency analysis and ranking charts with cumulative percentage lines.

## Overview

VariScout provides two Pareto chart variants for different analysis contexts:

| Component             | Purpose                     | Context           | Data Source                |
| --------------------- | --------------------------- | ----------------- | -------------------------- |
| **ParetoChart**       | Category frequency analysis | Standard Analysis | Derived from `DataContext` |
| **PerformancePareto** | Channel Cpk ranking         | Performance Mode  | `ChannelResult[]` (props)  |

**Source:** `packages/charts/src/ParetoChart.tsx` (shared), `packages/charts/src/PerformancePareto.tsx` (shared)

---

## Standard ParetoChart

Shows frequency distribution with bars sorted by count (highest first) and a cumulative percentage line. Classic Pareto analysis for identifying the "vital few" causes.

### Props Interface

```typescript
interface ParetoChartProps {
  /** Factor column name for grouping */
  factor: string;
  /** Parent container width (from withParentSize) */
  parentWidth: number;
  /** Parent container height (from withParentSize) */
  parentHeight: number;
  /** Callback for drill-down on bar click */
  onDrillDown?: (factor: string, value: string) => void;
  /** Show ghost bars comparing filtered to full population */
  showComparison?: boolean;
  /** Callback to toggle comparison view */
  onToggleComparison?: () => void;
  /** Callback to hide the Pareto panel */
  onHide?: () => void;
  /** Callback to open factor selector (not currently used — both apps use visible FactorSelector buttons) */
  onSelectFactor?: () => void;
  /** Callback to open Pareto file upload dialog */
  onUploadPareto?: () => void;
  /** Available factors for selection (determines if "Select Factor" button shows) */
  availableFactors?: string[];
  /** Aggregation mode: 'count' (occurrences) or 'value' (sum of outcome) */
  aggregation?: 'count' | 'value';
  /** Callback to toggle aggregation mode */
  onToggleAggregation?: () => void;
}
```

### Internal Data Structure

The component derives Pareto data internally from `DataContext.filteredData`:

```typescript
interface ParetoDataPoint {
  key: string; // Category identifier
  value: number; // Count or sum depending on aggregation mode
  cumulative: number; // Running total
  cumulativePercentage: number; // Cumulative % (0-100)
}
```

Data is automatically sorted by value (descending) with cumulative percentages calculated. In count mode, `value` represents the number of occurrences. In value mode, `value` represents the sum of the outcome column for each category.

### Display Features

- **Bars:** Count or sum per category based on aggregation mode (left Y-axis)
- **Cumulative line:** Running percentage with circle markers
- **80% threshold:** Dashed orange reference line
- **Dual Y-axes:** Count/Sum (left) and Cumulative % (right)
- **Y-axis label:** "Count" in count mode, outcome column name in value mode

### Panel Controls

The Pareto chart includes optional control buttons in the top-right corner:

| Button                  | Icon       | Condition                                                                       | Action                                           |
| ----------------------- | ---------- | ------------------------------------------------------------------------------- | ------------------------------------------------ |
| **Hide**                | EyeOff     | `onHide` provided                                                               | Hides the Pareto panel from view                 |
| **Aggregation**         | Hash/Sigma | `onToggleAggregation` provided + `outcome` exists + not using separate data     | Toggles count/value mode                         |
| **Comparison**          | Eye/EyeOff | Filters active + `onToggleComparison` provided + not using separate data        | Toggles ghost bar comparison                     |
| **Pre-aggregated hint** | Info       | `allSingleRow` + count mode + `outcome` exists + `onToggleAggregation` provided | Clickable amber hint that switches to value mode |

When both buttons are visible, the hide button appears to the left of the comparison toggle.

### Comparison Mode

When filters are active, the comparison toggle shows ghost bars representing the full population distribution:

- **Ghost bars:** Dashed outline, 30% opacity, shows expected count based on overall distribution
- **Solid bars:** Current filtered data
- **Tooltip (with comparison):** Shows filtered %, overall %, and difference with directional arrow (↑/↓)

This helps identify whether a category is over- or under-represented in the filtered subset.

### Aggregation Mode

The Pareto chart supports two aggregation modes for analyzing category importance:

| Mode      | Icon  | Y-Axis Label        | Bar Values                         |
| --------- | ----- | ------------------- | ---------------------------------- |
| **Count** | Hash  | "Count"             | Number of occurrences per category |
| **Value** | Sigma | Outcome column name | Sum of outcome column per category |

**Default behavior:** Count mode (shows frequency of each category).

**Value mode:** When enabled, bars represent the sum of the outcome column for each category. This is useful for analyzing total impact (e.g., total cost, total downtime) rather than just frequency.

**Auto-detection:** When every category has exactly 1 row in count mode (pre-aggregated data), `useParetoChartData` sets `allSingleRow: true`. The wrapper renders an amber hint ("1 row each — try Σ") that acts as a clickable shortcut to switch to value mode. The hint disappears once value mode is active.

**Toggle button:**

- Appears when `onToggleAggregation` is provided AND an `outcome` column exists
- Hidden when using separate Pareto data (no underlying data to aggregate)
- Hash icon (# ) in count mode, Sigma icon (Σ) in value mode
- Purple highlight when value mode is active

**Tooltip behavior:**

- Count mode: Shows "Count: N"
- Value mode: Shows "{outcome column name}: N.N" (one decimal place)

**Y-axis label:**

- Dynamically updates to show "Count" or the outcome column name/alias
- Clickable to edit the column alias (same as other axis labels)

### Empty State

When no Pareto data is available (e.g. all categories filtered out), an actionable empty state is shown:

- **Upload** button — visible if `onUploadPareto` provided. Opens ColumnMapping re-edit (factor management).
- **Hide** button — visible if `onHide` provided. Hides the Pareto card from the dashboard grid.

Both PWA and Azure wire these two actions. The shared component also accepts `onSelectFactor` for a "Select Factor" button, but neither app passes it — factor selection uses the visible `FactorSelector` pill buttons in the card header instead.

### Separate Pareto Data Mode

When `paretoMode === 'separate'` in DataContext, the chart uses pre-aggregated data from `separateParetoData` instead of deriving counts from filtered data. An amber info banner indicates this mode: "Using separate Pareto file (not linked to filters)". Comparison mode is disabled when using separate data.

### Example

```tsx
import ParetoChart from './components/charts/ParetoChart';

// Basic usage - data is derived from DataContext based on factor column
<div className="h-[400px]">
  <ParetoChart
    factor="Shift"
    onDrillDown={(factor, value) => console.log('Drill:', factor, value)}
  />
</div>

// With panel controls and comparison
<div className="h-[400px]">
  <ParetoChart
    factor="Shift"
    onDrillDown={handleDrillDown}
    showComparison={showComparison}
    onToggleComparison={() => setShowComparison(prev => !prev)}
    onHide={() => setParetoVisible(false)}
    onUploadPareto={() => setParetoUploadOpen(true)}
  />
</div>

// With aggregation mode control (count vs value)
<div className="h-[400px]">
  <ParetoChart
    factor="Reason"
    onDrillDown={handleDrillDown}
    aggregation={paretoAggregation}
    onToggleAggregation={() => setParetoAggregation(
      paretoAggregation === 'count' ? 'value' : 'count'
    )}
  />
</div>
```

### Selection Behavior

Clicking a bar either:

1. Calls `onDrillDown(factor, value)` if provided, or
2. Falls back to toggling the bar in `filters[factor]` via DataContext

Selected bars are highlighted using `chartColors.selected`, unselected bars use `chrome.boxDefault`.

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

### Neutral Coloring

All bars use a uniform blue color (`chartColors.mean`) regardless of Cpk value. This neutral approach lets users focus on the ranking and set their own Cpk targets via PerformanceSetupPanel.

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

| Element             | Standard ParetoChart                | PerformancePareto          |
| ------------------- | ----------------------------------- | -------------------------- |
| **Bars**            | Count or Sum values (descending)    | Cpk values (ascending)     |
| **Bar color**       | Default or selected                 | Health-based               |
| **Cumulative line** | Orange with circle markers          | Orange with circle markers |
| **Left Y-axis**     | Count or Sum (based on aggregation) | Cpk                        |
| **Right Y-axis**    | Cumulative %                        | Cumulative %               |
| **Reference line**  | 80% threshold (orange)              | Cpk 1.0 & 1.33 (red/green) |
| **Grid**            | Horizontal rows                     | Horizontal rows            |
| **X-axis labels**   | Category names                      | Channel labels (truncated) |

---

## Data Flow

### Standard ParetoChart (PWA)

```
DataContext
    | filteredData, rawData, paretoMode, separateParetoData, outcome
    |
ParetoChart (responsive wrapper)
    | aggregation prop determines value computation:
    |   - 'count': counts occurrences per category
    |   - 'value': sums outcome column per category
    | (or uses separateParetoData if paretoMode === 'separate')
    | Sorts by value (descending)
    | Computes cumulative percentages
    | Calculates full population comparison (if enabled)
    |
SVG rendering with Visx primitives
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

### Mobile Tap Interaction

On mobile (<640px), tapping a Pareto bar opens a `MobileCategorySheet` bottom action sheet (from `@variscout/ui`) showing the category's contribution %. Count and cumulative % display are deferred to a future update. The sheet is triggered by the tap on the bar, with drill-down and highlight (red/amber/green) actions available.

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
- Count or Sum value (based on aggregation mode, labeled with column name)
- Cumulative percentage
- **When comparison mode active:**
  - Filtered % (current selection)
  - Overall % (full population)
  - Difference with directional arrow (↑/↓/→)

PerformancePareto tooltip shows:

- Channel label
- Rank (e.g., #1, #2)
- Cpk value
- Sample size (n)
- Health status (colored)

---

## Cross-App Usage

### PWA

The PWA uses a custom ParetoChart component in `apps/pwa/src/components/charts/ParetoChart.tsx` that derives data from DataContext:

```tsx
import ParetoChart from './components/charts/ParetoChart';

// Data is derived from DataContext based on factor column
<div className="h-[400px]">
  <ParetoChart
    factor="Shift"
    onDrillDown={handleDrillDown}
    showComparison={showComparison}
    onToggleComparison={() => setShowComparison(prev => !prev)}
    onHide={() => setParetoVisible(false)}
  />
</div>;
```

### PerformancePareto (Shared)

Use the responsive wrapper from `@variscout/charts` for Performance Mode:

```tsx
import PerformancePareto from '@variscout/charts/PerformancePareto';

<div className="h-[300px]">
  <PerformancePareto channels={channels} onChannelClick={handleClick} />
</div>;
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

Standard ParetoChart also uses `useChartTheme()` for theme-aware chrome colors.

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
// PWA Standard Pareto (local component, derives data from DataContext)
import ParetoChart from './components/charts/ParetoChart';

// Shared Performance Pareto (responsive wrapper)
import PerformancePareto from '@variscout/charts/PerformancePareto';

// Base component for manual sizing
import { PerformanceParetoBase } from '@variscout/charts/PerformancePareto';

// Types
import type { PerformanceParetoProps } from '@variscout/charts';
```

---

## See Also

- [Overview](./overview.md) - Chart design system overview and selection guide
- [Colors](./colors.md) - Chart color constants
- [Responsive](./responsive.md) - Breakpoints and scaling utilities
- [Hooks](./hooks.md) - useChartLayout, useChartTooltip, useSelectionState
- [Performance Mode](./performance-mode.md) - Full Performance Mode documentation
- [Boxplot](./boxplot.md) - Distribution comparison charts
