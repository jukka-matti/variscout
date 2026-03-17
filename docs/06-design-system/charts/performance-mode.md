---
title: 'Performance Mode Charts'
---

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
  health: 'excellent' | 'capable' | 'warning' | 'critical'; // Legacy, not used for display
}
```

### Per-Measure Specs (Optional)

Performance Mode supports different specification limits for each measure column. This is useful when channels have different tolerance requirements (e.g., different fill heads with different nominal values).

```typescript
// In DataState (from useDataState hook)
measureSpecs?: Record<string, SpecLimits>;

// Usage
const specsForChannel = state.getSpecsForMeasure(channelId);
// Returns per-measure override if defined, otherwise global specs
```

The `measureSpecs` map is keyed by measure column name and persisted in project state.

### Characteristic Type

Each spec (global or per-measure) can have a `characteristicType` that affects interpretation:

| Type        | Specs Defined | Meaning                                                |
| ----------- | ------------- | ------------------------------------------------------ |
| `'nominal'` | USL + LSL     | Target is ideal, deviation in either direction is loss |
| `'smaller'` | USL only      | Smaller-is-better (e.g., defects, cycle time)          |
| `'larger'`  | LSL only      | Larger-is-better (e.g., yield, strength)               |

The type is automatically inferred from which specs are defined, but can be overridden:

```typescript
import { inferCharacteristicType } from '@variscout/core';

const type = inferCharacteristicType({ usl: 100, lsl: 90 }); // 'nominal'
const type = inferCharacteristicType({ usl: 5 }); // 'smaller'
const type = inferCharacteristicType({ lsl: 80 }); // 'larger'
```

### Color Approach

Performance Mode uses a simplified color scheme that lets users set their own Cpk targets:

| Chart                   | Coloring Approach | Description                                 |
| ----------------------- | ----------------- | ------------------------------------------- |
| `PerformanceIChart`     | Control-based     | Blue (in-control) / Red (out-of-control)    |
| `PerformanceBoxplot`    | Spec-based        | Colored by position relative to spec limits |
| `PerformancePareto`     | Neutral           | All bars use blue (`chartColors.mean`)      |
| `PerformanceCapability` | Spec-based        | Histogram bars colored by spec position     |

> **Note:** Users set their own Cpk target (default 1.33) via PerformanceSetupPanel (setup phase).

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

### Control-Based Coloring

PerformanceIChart uses control limits calculated from the Cpk/Cp distribution:

- **Blue points:** Within control limits (in-control)
- **Red points:** Outside control limits (out-of-control)
- **Target line:** User-defined Cpk target (default 1.33)

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
- All bars use neutral blue color (`chartColors.mean`)
- Cumulative percentage line (right Y-axis)
- Reference lines at Cpk = 1.0 and 1.33 thresholds
- Tooltip shows rank, Cpk, and n

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
  - n, σ, Cpk values
- Bars colored by position relative to specs (green in-spec, red/amber out-of-spec)

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

- [Overview](./overview.md) - Chart design system overview and selection guide
- [Colors](./colors.md) - Chart color constants
- [Responsive](./responsive.md) - Breakpoints and scaling utilities
- [Hooks](./hooks.md) - useChartLayout, useChartTooltip
- [IChart](./ichart.md) - PerformanceIChart component
- [Boxplot](./boxplot.md) - PerformanceBoxplot component
- [Pareto](./pareto.md) - PerformancePareto component
- [Capability](./capability.md) - PerformanceCapability component
