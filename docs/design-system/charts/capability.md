# Capability Histograms

Distribution histograms with specification limit overlays for capability analysis.

## Overview

VariScout provides two capability histogram variants for different analysis contexts:

| Component                 | Purpose                     | Context           | Data Source     |
| ------------------------- | --------------------------- | ----------------- | --------------- |
| **CapabilityHistogram**   | Distribution vs spec limits | Standard Analysis | `number[]`      |
| **PerformanceCapability** | Single channel histogram    | Performance Mode  | `ChannelResult` |

**Source:** `packages/charts/src/CapabilityHistogram.tsx`, `packages/charts/src/PerformanceCapability.tsx`

---

## Standard CapabilityHistogram

Shows data distribution as a histogram with specification limits and mean reference line. Used to visualize process capability and identify out-of-spec data.

### Props Interface

```typescript
interface CapabilityHistogramProps extends BaseChartProps {
  /** Raw numeric values */
  data: number[];
  /** Specification limits */
  specs: SpecLimits;
  /** Mean value for reference line */
  mean: number;
  /** Override X-axis domain (for locking scale to full dataset) - data values axis */
  xDomainOverride?: YAxisDomain;
}
```

### Binning Algorithm

Uses D3's `bin()` function with 15 bins:

- Domain extends to include spec limits if outside data range
- Respects `xDomainOverride` when provided (for Y-axis lock feature)

### Bar Coloring

Bar color is determined by position relative to spec limits:

| Condition                | Color                      |
| ------------------------ | -------------------------- |
| Bin midpoint within spec | Green (`chartColors.pass`) |
| Bin midpoint >= USL      | Red (`chartColors.fail`)   |
| Bin midpoint <= LSL      | Red (`chartColors.fail`)   |

### Example

```tsx
import CapabilityHistogram from '@variscout/charts/CapabilityHistogram';

<CapabilityHistogram
  data={measurementValues}
  specs={{ usl: 105, lsl: 95, target: 100 }}
  mean={99.5}
/>;
```

### X-Axis Lock Mode

Locks X-axis scale to a fixed range (useful during drill-down):

```tsx
<CapabilityHistogram
  data={filteredData}
  specs={specs}
  mean={mean}
  xDomainOverride={{ min: 90, max: 110 }}
/>
```

---

## PerformanceCapability

Shows detailed capability histogram for a selected channel in Performance Mode. Includes a stats overlay panel.

### Props Interface

```typescript
interface PerformanceCapabilityProps extends BaseChartProps {
  /** Single channel result to display (null shows placeholder) */
  channel: ChannelResult | null;
  /** Specification limits for reference lines */
  specs: SpecLimits;
}
```

### Display Behavior

| State            | Display                                                |
| ---------------- | ------------------------------------------------------ |
| Channel provided | Histogram with stats overlay panel                     |
| Channel is null  | Placeholder: "Click on a channel to see its histogram" |

### Stats Overlay

A semi-transparent panel in the top-right corner showing:

- Channel label
- Health badge (colored by health status)
- Sample size (n)
- Standard deviation (σ)
- Cpk value (bold)

### Bar Coloring

Bar color is determined by position relative to spec limits:

| Condition       | Color                         |
| --------------- | ----------------------------- |
| Within spec     | Green (`chartColors.pass`)    |
| At or above USL | Red (`chartColors.fail`)      |
| At or below LSL | Amber (`chartColors.warning`) |

### Health Badge Colors

| Health      | Badge Color                   |
| ----------- | ----------------------------- |
| `critical`  | Red (`chartColors.fail`)      |
| `warning`   | Amber (`chartColors.warning`) |
| `capable`   | Green (`chartColors.pass`)    |
| `excellent` | Blue (`chartColors.mean`)     |

### Example

```tsx
import PerformanceCapability from '@variscout/charts/PerformanceCapability';

<PerformanceCapability channel={selectedChannel} specs={{ usl: 105, lsl: 95 }} />;
```

---

## Visual Elements

| Element            | Standard CapabilityHistogram | PerformanceCapability          |
| ------------------ | ---------------------------- | ------------------------------ |
| **Histogram bars** | 15 bins, spec-colored        | 15 bins, spec-colored          |
| **LSL line**       | Dashed red, labeled above    | Dashed red, labeled left       |
| **USL line**       | Dashed red, labeled above    | Dashed red, labeled right      |
| **Target line**    | Dashed green, labeled above  | Not shown                      |
| **Mean line**      | Solid blue, labeled below    | Solid blue, labeled above (μ=) |
| **Stats overlay**  | Not shown                    | Top-right panel                |
| **Grid**           | Not shown                    | Horizontal rows                |
| **Y-axis label**   | Not shown                    | "Count"                        |

---

## Data Flow

### Standard CapabilityHistogram

```
DataContext (PWA/Azure)
    |
Dashboard.tsx / StatsPanel.tsx
    | data: number[], mean from stats
CapabilityHistogram (responsive wrapper)
    | D3 bin() for histogram
CapabilityHistogramBase (renders SVG)
```

### PerformanceCapability

```
DataContext (PWA/Azure)
    | analyzePerformanceData()
PerformanceDashboard.tsx
    | channel: ChannelResult | null
PerformanceCapability (responsive wrapper)
    | calculateHistogram(channel.values)
PerformanceCapabilityBase (renders SVG)
```

---

## Cross-App Usage

### PWA and Azure

Use the responsive wrapper (auto-sizing with `withParentSize`):

```tsx
import CapabilityHistogram from '@variscout/charts/CapabilityHistogram';
import PerformanceCapability from '@variscout/charts/PerformanceCapability';

// Standard Histogram
<div className="h-[300px]">
  <CapabilityHistogram
    data={values}
    specs={specs}
    mean={mean}
  />
</div>

// Performance Capability
<div className="h-[300px]">
  <PerformanceCapability
    channel={selectedChannel}
    specs={specs}
  />
</div>
```

### Excel Add-in

Use the Base variant with explicit sizing:

```tsx
import { CapabilityHistogramBase } from '@variscout/charts/CapabilityHistogram';
import { PerformanceCapabilityBase } from '@variscout/charts/PerformanceCapability';

// Standard Histogram with explicit size
<CapabilityHistogramBase
  parentWidth={400}
  parentHeight={250}
  data={values}
  specs={specs}
  mean={mean}
/>

// Performance Capability with explicit size
<PerformanceCapabilityBase
  parentWidth={400}
  parentHeight={300}
  channel={selectedChannel}
  specs={specs}
/>
```

---

## Colors and Theming

### Bar Colors

Bars are colored based on their position relative to spec limits (see Bar Coloring sections above).

### Theme-Aware Colors

PerformanceCapability uses `useChartTheme()` for automatic light/dark adaptation:

```typescript
const { chrome } = useChartTheme();

// Chrome colors adapt to theme:
// chrome.gridLine, chrome.axisPrimary, chrome.labelPrimary, chrome.tooltipBg
```

Standard CapabilityHistogram uses hardcoded dark theme colors from `chromeColors`.

### Reference Line Colors

```typescript
// Spec limits (USL/LSL)
stroke={chartColors.spec}     // red-500 dashed

// Target line
stroke={chartColors.target}   // green-500 dashed

// Mean line
stroke={chartColors.meanAlt}  // blue-400 solid (standard)
stroke={chartColors.mean}     // blue-500 solid (performance)
```

---

## Histogram Calculation

PerformanceCapability uses a custom histogram function:

```typescript
function calculateHistogram(values: number[], numBins: number): HistogramBin[] {
  // 1. Find min/max of values
  // 2. Calculate bin width = (max - min) / numBins
  // 3. Initialize bins with x0, x1, count = 0
  // 4. Assign each value to appropriate bin
  // 5. Return bins array
}
```

Both components use 15 bins (constant `NUM_BINS = 15`).

---

## Exports

```typescript
// Responsive wrappers (auto-sizing)
import CapabilityHistogram from '@variscout/charts/CapabilityHistogram';
import PerformanceCapability from '@variscout/charts/PerformanceCapability';

// Base components (manual sizing)
import { CapabilityHistogramBase } from '@variscout/charts/CapabilityHistogram';
import { PerformanceCapabilityBase } from '@variscout/charts/PerformanceCapability';

// Types
import type { CapabilityHistogramProps, PerformanceCapabilityProps } from '@variscout/charts';
```

---

## See Also

- [README](./README.md) - Chart design system overview and selection guide
- [Colors](./colors.md) - Chart color constants and health classification
- [Responsive](./responsive.md) - Breakpoints and scaling utilities
- [Hooks](./hooks.md) - useChartLayout
- [Performance Mode](./performance-mode.md) - Full Performance Mode documentation
- [Overview](./overview.md) - All chart types and common patterns
- [IChart](./ichart.md) - Time-series control charts
