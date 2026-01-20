# Boxplot Charts

Distribution comparison charts for categorical and multi-channel analysis.

## Overview

VariScout provides two Boxplot variants for different analysis contexts:

| Component              | Purpose                         | Context           | Data Source          |
| ---------------------- | ------------------------------- | ----------------- | -------------------- |
| **Boxplot**            | Distribution by category/factor | Standard Analysis | `BoxplotGroupData[]` |
| **PerformanceBoxplot** | Channel comparison              | Performance Mode  | `ChannelResult[]`    |

**Source:** `packages/charts/src/Boxplot.tsx`, `packages/charts/src/PerformanceBoxplot.tsx`

---

## Standard Boxplot

Compares distributions across categorical groups (shifts, operators, machines, etc.) to identify variation sources.

### Props Interface

```typescript
interface BoxplotProps extends BaseChartProps {
  /** Grouped data for boxplot (pre-calculated stats) */
  data: BoxplotGroupData[];
  /** Specification limits (USL, LSL, Target) */
  specs: SpecLimits;
  /** Y-axis label (default: 'Value') */
  yAxisLabel?: string;
  /** X-axis label - factor name (default: 'Group') */
  xAxisLabel?: string;
  /** Override Y-axis domain for Y-axis lock feature */
  yDomainOverride?: YAxisDomain;
  /** Currently selected groups (highlighted) */
  selectedGroups?: string[];
  /** Callback when a box is clicked */
  onBoxClick?: (key: string) => void;
  /** Sample size for branding bar */
  sampleSize?: number;
  /** Variation % explained by this factor */
  variationPct?: number;
  /** Threshold for high variation highlight (default: 50) */
  variationThreshold?: number;
  /** Category contributions - Map from key to % of total variation */
  categoryContributions?: Map<string | number, number>;
  /** Show contribution labels below boxes (default: false) */
  showContributionLabels?: boolean;
}
```

### Data Structure

```typescript
interface BoxplotGroupData {
  key: string; // Category identifier
  values: number[]; // Raw values for n calculation
  min: number; // Lower whisker (or Q1 - 1.5*IQR)
  max: number; // Upper whisker (or Q3 + 1.5*IQR)
  q1: number; // First quartile (25th percentile)
  median: number; // Median (50th percentile)
  mean: number; // Mean value (for diamond marker)
  q3: number; // Third quartile (75th percentile)
  outliers: number[]; // Values beyond 1.5*IQR fences
}
```

Use `calculateBoxplotStats()` from `@variscout/charts/types` to convert raw data:

```typescript
import { calculateBoxplotStats, BoxplotGroupInput } from '@variscout/charts';

const input: BoxplotGroupInput = { group: 'Shift A', values: [...] };
const boxplotData = calculateBoxplotStats(input);
```

### Display Modes

#### Standard Mode

Default view showing distribution comparison:

```tsx
<Boxplot
  data={groupedData}
  specs={{ usl: 105, lsl: 95, target: 100 }}
  yAxisLabel="Fill Weight (g)"
  xAxisLabel="Shift"
/>
```

#### Drill Suggestion Mode

When `variationPct >= variationThreshold`, the chart highlights the factor as a drill target:

- X-axis label turns red with variation percentage: "Shift (67%)"
- "↓ drill here" indicator appears below axis label
- Signals to user that drilling into this factor will explain significant variation

```tsx
<Boxplot
  data={groupedData}
  specs={specs}
  xAxisLabel="Shift"
  variationPct={67} // Factor explains 67% of variation
  variationThreshold={50} // Highlight when >= 50% (default)
/>
```

#### Contribution Labels Mode

Shows category-level impact percentages below each box:

```tsx
<Boxplot
  data={groupedData}
  specs={specs}
  categoryContributions={contributionMap}
  showContributionLabels={true}
/>
```

Labels are styled red when contribution ≥ `variationThreshold`.

#### Selection Mode

Highlights specific groups while dimming others:

```tsx
<Boxplot
  data={groupedData}
  specs={specs}
  selectedGroups={['Shift A', 'Shift C']}
  onBoxClick={key => toggleSelection(key)}
/>
```

Selection uses `useSelectionState` hook with `selectionOpacity.dimmed` (0.3) for unselected items.

#### Y-Axis Lock Mode

Locks Y-axis scale to a fixed range (useful during drill-down to maintain reference):

```tsx
<Boxplot data={groupedData} specs={specs} yDomainOverride={{ min: 90, max: 110 }} />
```

---

## PerformanceBoxplot

Compares distributions across measurement channels (fill heads, cavities, etc.) in Performance Mode.

### Props Interface

```typescript
interface PerformanceBoxplotProps extends BaseChartProps {
  /** Channel results with values for boxplot calculation */
  channels: ChannelResult[];
  /** Specification limits for reference lines */
  specs: SpecLimits;
  /** Selected channel ID (shows only this channel when set) */
  selectedMeasure?: string | null;
  /** Maximum channels to display when no selection (default: 5) */
  maxDisplayed?: number;
  /** Callback when a boxplot is clicked */
  onChannelClick?: (channelId: string) => void;
}
```

### Display Behavior

| State            | Display                                                  |
| ---------------- | -------------------------------------------------------- |
| No selection     | Worst N channels by Cpk (uses `getWorstChannels()`)      |
| Channel selected | Single detailed boxplot for selected channel             |
| Empty channels   | Placeholder: "Select a channel or load performance data" |

### Visual Style

PerformanceBoxplot uses neutral theme-aware colors consistent with Standard Boxplot:

- Box: `chrome.boxDefault` / `chrome.boxBorder`
- Whiskers: `chrome.whisker`
- Median: `chartColors.cumulative`
- Mean: Diamond marker in `chrome.labelPrimary`

When a channel is selected, it uses `chartColors.selected` / `chartColors.selectedBorder`.

### Example

```tsx
import PerformanceBoxplot from '@variscout/charts/PerformanceBoxplot';

<PerformanceBoxplot
  channels={channelResults}
  specs={{ usl: 105, lsl: 95 }}
  selectedMeasure={selectedId}
  maxDisplayed={5}
  onChannelClick={handleChannelSelect}
/>;
```

---

## Statistical Elements

| Element            | Standard Boxplot          | PerformanceBoxplot    |
| ------------------ | ------------------------- | --------------------- |
| **Whiskers**       | Min/Max (within 1.5×IQR)  | Min to Max            |
| **Whisker caps**   | Horizontal at min/max     | Horizontal at min/max |
| **Box**            | Q1 to Q3 (IQR)            | Q1 to Q3 (IQR)        |
| **Median**         | Thick line                | Thick line            |
| **Mean**           | Diamond marker            | Diamond marker        |
| **Outliers**       | Red circles beyond fences | Not shown separately  |
| **n label**        | Below each box            | Below each box        |
| **Contribution %** | Below n (optional)        | Not applicable        |
| **Spec lines**     | USL/LSL (dashed red)      | USL/LSL (dashed red)  |
| **Target line**    | Dashed green              | Not shown             |
| **Grid**           | Not shown                 | Not shown             |

---

## Data Flow

### Standard Boxplot

```
DataContext (PWA/Azure)
    ↓
Dashboard.tsx
    ↓ calculateBoxplotStats() per group
Boxplot (responsive wrapper)
    ↓
BoxplotBase (renders SVG)
```

### PerformanceBoxplot

```
DataContext (PWA/Azure)
    ↓ analyzePerformanceData()
PerformanceDashboard.tsx
    ↓ channels: ChannelResult[]
PerformanceBoxplot (responsive wrapper)
    ↓ getWorstChannels() for display
PerformanceBoxplotBase (renders SVG)
```

---

## Interactions

### Click Behavior

Both variants support click-based selection:

```tsx
// Standard Boxplot - toggle category filter
onBoxClick={(key) => {
  if (selectedGroups.includes(key)) {
    setSelectedGroups(groups => groups.filter(g => g !== key));
  } else {
    setSelectedGroups(groups => [...groups, key]);
  }
}}

// PerformanceBoxplot - single channel selection (toggle)
onChannelClick={(channelId) => {
  setSelectedMeasure(prev => prev === channelId ? null : channelId);
}}
```

### Hover Tooltip

Standard Boxplot tooltip shows:

- Category key
- Median, Mean, Q1, Q3
- Sample size (n)
- Impact % (if `categoryContributions` provided)

PerformanceBoxplot tooltip shows:

- Channel label
- Full stats: Max, Q3, Median, Mean, Q1, Min
- Cpk value

### Integration with Hooks

Standard Boxplot integrates with shared hooks:

| Hook                   | Purpose                           |
| ---------------------- | --------------------------------- |
| `useDrillDown`         | Navigate into selected categories |
| `useVariationTracking` | Cumulative η² explanation         |
| `useChartLayout`       | Consistent margins/fonts          |
| `useChartTooltip`      | Tooltip positioning               |
| `useSelectionState`    | Selection opacity management      |

---

## Cross-App Usage

### PWA and Azure

Use the responsive wrapper (auto-sizing with `withParentSize`):

```tsx
import Boxplot from '@variscout/charts/Boxplot';
import PerformanceBoxplot from '@variscout/charts/PerformanceBoxplot';

// Standard Boxplot
<div className="h-[400px]">
  <Boxplot data={groupedData} specs={specs} onBoxClick={handleClick} />
</div>

// Performance Boxplot
<div className="h-[300px]">
  <PerformanceBoxplot
    channels={channels}
    specs={specs}
    onChannelClick={handleClick}
  />
</div>
```

### Excel Add-in

Use the Base variant with explicit sizing:

```tsx
import { BoxplotBase } from '@variscout/charts/Boxplot';
import { PerformanceBoxplotBase } from '@variscout/charts/PerformanceBoxplot';

// Standard Boxplot with explicit size
<BoxplotBase
  parentWidth={500}
  parentHeight={350}
  data={groupedData}
  specs={specs}
/>

// Performance Boxplot with explicit size
<PerformanceBoxplotBase
  parentWidth={400}
  parentHeight={300}
  channels={channels}
  specs={specs}
/>
```

---

## Colors and Theming

### Box Colors

| Variant             | Condition    | Fill Color             | Stroke Color                 |
| ------------------- | ------------ | ---------------------- | ---------------------------- |
| Standard (default)  | Unselected   | `chrome.boxDefault`    | `chrome.boxBorder`           |
| Standard (selected) | In selection | `chartColors.selected` | `chartColors.selectedBorder` |
| Performance         | Unselected   | `chrome.boxDefault`    | `chrome.boxBorder`           |
| Performance         | Selected     | `chartColors.selected` | `chartColors.selectedBorder` |

### Theme-Aware Colors

PerformanceBoxplot uses `useChartTheme()` for automatic light/dark adaptation:

```typescript
const { chrome } = useChartTheme();

// Chrome colors adapt to theme:
// chrome.gridLine, chrome.axisPrimary, chrome.labelPrimary, etc.
```

Standard Boxplot uses hardcoded dark theme colors from `chromeColors`.

### Whisker & Axis Colors

```typescript
// Standard Boxplot
stroke={chromeColors.whisker}       // Whisker lines
stroke={chromeColors.axisPrimary}   // Axis lines
fill={chromeColors.labelPrimary}    // Axis tick labels
fill={chromeColors.labelSecondary}  // X-axis tick labels
fill={chromeColors.labelMuted}      // n= labels

// PerformanceBoxplot (theme-aware)
stroke={chrome.axisPrimary}
fill={chrome.labelPrimary}
```

### Responsive Sizing

Both variants use responsive utilities:

```typescript
// Standard Boxplot uses useChartLayout hook
const { fonts, margin, width, height } = useChartLayout({
  parentWidth,
  parentHeight,
  chartType: 'boxplot',
  showBranding,
});

// PerformanceBoxplot uses direct responsive functions
const margin = getResponsiveMargins(parentWidth, 'boxplot', sourceBarHeight);
const fonts = getResponsiveFonts(parentWidth);
```

---

## Exports

```typescript
// Responsive wrappers (auto-sizing)
import Boxplot from '@variscout/charts/Boxplot';
import PerformanceBoxplot from '@variscout/charts/PerformanceBoxplot';

// Base components (manual sizing)
import { BoxplotBase } from '@variscout/charts/Boxplot';
import { PerformanceBoxplotBase } from '@variscout/charts/PerformanceBoxplot';

// Data utilities
import { calculateBoxplotStats, BoxplotGroupInput, BoxplotGroupData } from '@variscout/charts';
```

---

## See Also

- [README](./README.md) - Chart design system overview and selection guide
- [Colors](./colors.md) - Chart color constants and health classification
- [Responsive](./responsive.md) - Responsive margin and font utilities
- [Hooks](./hooks.md) - useChartLayout, useChartTooltip, useSelectionState
- [Performance Mode](./performance-mode.md) - Full Performance Mode documentation
- [Overview](./overview.md) - All chart types and common patterns
- [IChart](./ichart.md) - Time-series control charts
