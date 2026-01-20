# Performance Mode Charts

Multi-measure analysis charts for comparing performance across multiple measurement channels.

## Overview

Performance Mode enables analysis of wide-format data with multiple measurement columns (fill heads, cavities, nozzles, etc.). These charts help identify which channels need attention and how they compare.

| Component               | Purpose                     | Normal | Maximized |
| ----------------------- | --------------------------- | ------ | --------- |
| `PerformanceIChart`     | Cpk scatter plot by channel | All    | All       |
| `PerformanceBoxplot`    | Distribution comparison     | 5      | All       |
| `PerformancePareto`     | Cpk ranking (worst first)   | 20     | 50        |
| `PerformanceCapability` | Single channel histogram    | 1      | 1         |

**Source:** `packages/charts/src/Performance*.tsx`

---

## ChannelResult Interface

All Performance charts accept `channels: ChannelResult[]` from `@variscout/core`:

```typescript
interface ChannelResult {
  id: string; // Unique channel identifier
  label: string; // Display label
  values: number[]; // Raw measurement values
  n: number; // Sample size
  mean: number; // Mean value
  stdDev: number; // Standard deviation
  cp?: number; // Process Capability
  cpk?: number; // Process Capability Index
  health: 'excellent' | 'capable' | 'warning' | 'critical';
}
```

### Health Classification

Health classification is used by PerformanceBoxplot, PerformancePareto, and PerformanceCapability charts:

| Health      | Cpk Range   | Color                         |
| ----------- | ----------- | ----------------------------- |
| `excellent` | >= 1.67     | Blue (`chartColors.mean`)     |
| `capable`   | 1.33 - 1.67 | Green (`chartColors.pass`)    |
| `warning`   | 1.0 - 1.33  | Amber (`chartColors.warning`) |
| `critical`  | < 1.0       | Red (`chartColors.fail`)      |

> **Note:** PerformanceIChart uses control-based coloring (blue/red for in-control/out-of-control)
> based on statistical control limits calculated from the Cpk/Cp distribution across channels.
> See [PerformanceIChart section](#performanceichart) below for details.

---

## PerformanceIChart

I-Chart for capability metrics (Cpk or Cp) across channels. Uses statistical control limits rather than health-based coloring.

**Source:** `packages/charts/src/PerformanceIChart.tsx`

### Props

```typescript
interface PerformanceIChartProps {
  parentWidth: number;
  parentHeight: number;
  channels: ChannelResult[];
  selectedMeasure?: string; // Highlighted channel
  onChannelClick?: (id: string) => void;
  showBranding?: boolean;
  capabilityMetric?: 'cp' | 'cpk'; // Toggle between Cp/Cpk (default: 'cpk')
  cpkTarget?: number; // Target line value (default: 1.33)
}
```

### Features

- **X-axis:** Channel index/name
- **Y-axis:** Capability metric value (Cpk or Cp)
- **Control limits:** UCL/LCL calculated from capability distribution (mean ± 3σ)
- **Mean line:** Average capability across all channels (solid blue)
- **Target line:** User-defined reference (default: 1.33, dashed green)
- **Point coloring:** Control-based (blue = in-control, red = out-of-control)
- **Nelson Rule 2:** 9+ consecutive points on same side of mean flagged as violations
- Selected point highlighted with larger radius and white stroke
- Unselected points dimmed when selection exists

### Control-Based vs Health-Based Coloring

PerformanceIChart differs from other Performance charts in its coloring approach:

| Chart                 | Coloring Approach | Colors Used           |
| --------------------- | ----------------- | --------------------- |
| **PerformanceIChart** | Control-based     | Blue (in) / Red (out) |
| PerformanceBoxplot    | Health-based      | 4-tier health colors  |
| PerformancePareto     | Health-based      | 4-tier health colors  |
| PerformanceCapability | Health-based      | 4-tier health colors  |

### Cpk Target Setting

Users can configure a custom Cpk target in PerformanceSetupPanel:

| Property  | Default | Range     | Description                  |
| --------- | ------- | --------- | ---------------------------- |
| cpkTarget | 1.33    | 0.5 - 3.0 | Target line shown on I-Chart |

Common target values:

| Target | PPM Defects | Use Case           |
| ------ | ----------- | ------------------ |
| 1.00   | ~2,700      | Minimum capability |
| 1.33   | ~63         | Standard target    |
| 1.67   | ~1          | High capability    |
| 2.00   | <1          | Six Sigma          |

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

## PerformanceBoxplot

Shows boxplots for selected channel or worst-performing channels.

**Source:** `packages/charts/src/PerformanceBoxplot.tsx`

### Props

```typescript
interface PerformanceBoxplotProps {
  parentWidth: number;
  parentHeight: number;
  channels: ChannelResult[];
  specs: SpecLimits; // USL, LSL, Target
  selectedMeasure?: string;
  maxDisplayed?: number; // Default: 5
  onChannelClick?: (id: string) => void;
  showBranding?: boolean;
}
```

### Behavior

- **When channel selected:** Shows single detailed boxplot
- **When no selection:** Shows worst N channels by Cpk (uses `getWorstChannels()`)

### Boxplot Elements

| Element    | Description      |
| ---------- | ---------------- |
| Whiskers   | Min to Max range |
| Box        | Q1 to Q3 (IQR)   |
| Thick line | Median           |
| Diamond    | Mean             |

### Example

```tsx
import PerformanceBoxplot from '@variscout/charts/PerformanceBoxplot';

<PerformanceBoxplot
  channels={channelResults}
  specs={{ usl: 105, lsl: 95, target: 100 }}
  selectedMeasure={selectedId}
  maxDisplayed={5}
  onChannelClick={handleChannelSelect}
/>;
```

---

## PerformancePareto

Ranks channels by Cpk (worst first) with cumulative percentage line.

**Source:** `packages/charts/src/PerformancePareto.tsx`

### Props

```typescript
interface PerformanceParetoProps {
  parentWidth: number;
  parentHeight: number;
  channels: ChannelResult[];
  selectedMeasure?: string;
  maxDisplayed?: number; // Default: 20
  onChannelClick?: (id: string) => void;
  showBranding?: boolean;
}
```

### Features

- Bars sorted by Cpk ascending (worst first)
- Bar color indicates health classification
- Cumulative percentage line (right Y-axis)
- Reference lines at Cpk = 1.0 and 1.33 thresholds
- Tooltip shows rank, Cpk, n, and health

### Example

```tsx
import PerformancePareto from '@variscout/charts/PerformancePareto';

<PerformancePareto
  channels={channelResults}
  selectedMeasure={selectedId}
  maxDisplayed={20}
  onChannelClick={handleChannelSelect}
/>;
```

---

## PerformanceCapability

Detailed capability histogram for a single selected channel.

**Source:** `packages/charts/src/PerformanceCapability.tsx`

### Props

```typescript
interface PerformanceCapabilityProps {
  parentWidth: number;
  parentHeight: number;
  channel: ChannelResult | null;
  specs: SpecLimits;
  showBranding?: boolean;
}
```

### Features

- 15-bin histogram of measurement values
- Vertical spec limit lines (LSL, USL)
- Mean line with value label
- Stats overlay panel showing:
  - Channel label
  - Health badge
  - n, sigma, Cpk values
- Bars colored by position relative to specs

### Example

```tsx
import PerformanceCapability from '@variscout/charts/PerformanceCapability';

<PerformanceCapability channel={selectedChannel} specs={{ usl: 105, lsl: 95 }} />;
```

---

## Cross-App Usage

### PWA and Azure

Use the responsive wrapper (auto-sizing with `withParentSize`):

```tsx
import PerformanceIChart from '@variscout/charts/PerformanceIChart';

<div className="h-[300px]">
  <PerformanceIChart channels={channels} onChannelClick={handleClick} />
</div>;
```

### Excel Add-in

Use the Base variant with explicit sizing and dark theme tokens:

```tsx
import { PerformanceIChartBase } from '@variscout/charts/PerformanceIChart';

<PerformanceIChartBase
  parentWidth={400}
  parentHeight={300}
  channels={channels}
  onChannelClick={handleClick}
/>;
```

---

## Drill-Down Flow

Typical user journey through Performance Mode:

```
PerformancePareto (overview)
    |
    | Click worst channel
    v
PerformanceBoxplot (distribution)
    |
    | Click channel
    v
PerformanceCapability (detail)
    |
    | Back button
    v
Standard Dashboard (I-Chart, etc.)
```

### Implementation

```tsx
const [selectedMeasure, setSelectedMeasure] = useState<string | null>(null);

// Pareto and IChart show all channels, highlight selected
<PerformancePareto
  channels={channels}
  selectedMeasure={selectedMeasure}
  onChannelClick={setSelectedMeasure}
/>

// Boxplot shows selected or worst N
<PerformanceBoxplot
  channels={channels}
  selectedMeasure={selectedMeasure}
  onChannelClick={setSelectedMeasure}
/>

// Capability shows only selected
{selectedMeasure && (
  <PerformanceCapability
    channel={channels.find(c => c.id === selectedMeasure)}
    specs={specs}
  />
)}
```

---

## Focus Mode

Performance charts support maximize/fullscreen mode for detailed analysis of all channels.

### Activation

- Click the maximize button (⤢) in each chart panel header
- Chart expands to full viewport with navigation arrows

### Keyboard Navigation

| Key       | Action               |
| --------- | -------------------- |
| `←` / `→` | Cycle between charts |
| `Escape`  | Exit focus mode      |

Navigation arrows appear on hover at screen edges.

### Display Limits

When maximized, display limits increase to show more data:

| Chart                   | Normal | Maximized |
| ----------------------- | ------ | --------- |
| `PerformanceBoxplot`    | 5      | All       |
| `PerformancePareto`     | 20     | 50        |
| `PerformanceIChart`     | All    | All       |
| `PerformanceCapability` | 1      | 1         |

### Implementation

Focus Mode is implemented in the Performance Dashboard components:

- **PWA:** `apps/pwa/src/components/PerformanceDashboard.tsx`
- **Azure:** `apps/azure/src/components/PerformanceDashboard.tsx`

State management uses `focusedChart` to track the currently maximized panel (or `null` for normal view).

---

## Exports

```typescript
// Responsive wrappers (auto-sizing)
import PerformanceIChart from '@variscout/charts/PerformanceIChart';
import PerformanceBoxplot from '@variscout/charts/PerformanceBoxplot';
import PerformancePareto from '@variscout/charts/PerformancePareto';
import PerformanceCapability from '@variscout/charts/PerformanceCapability';

// Base components (manual sizing)
import { PerformanceIChartBase } from '@variscout/charts/PerformanceIChart';
import { PerformanceBoxplotBase } from '@variscout/charts/PerformanceBoxplot';
import { PerformanceParetoBase } from '@variscout/charts/PerformancePareto';
import { PerformanceCapabilityBase } from '@variscout/charts/PerformanceCapability';
```

---

## See Also

- [README](./README.md) - Chart design system overview and selection guide
- [Colors](./colors.md) - Health classification colors
- [Responsive](./responsive.md) - Breakpoints and scaling utilities
- [Hooks](./hooks.md) - useChartLayout, useChartTooltip
- [Overview](./overview.md) - Standard chart components
- [IChart](./ichart.md) - PerformanceIChart component
- [Boxplot](./boxplot.md) - PerformanceBoxplot component
- [Pareto](./pareto.md) - PerformancePareto component
- [Capability](./capability.md) - PerformanceCapability component
