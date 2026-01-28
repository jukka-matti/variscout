# What-If Simulator

Interactive component for exploring process improvement scenarios through mean adjustment and variation reduction.

## Overview

The What-If Simulator allows users to explore the two primary levers of process improvement:

1. **Mean shift** - Moving the process center toward a target
2. **Variation reduction** - Reducing process spread (standard deviation)

The component displays projected statistics including Cpk, yield percentage, and improvement metrics with color-coded capability indicators.

## Usage

```tsx
import WhatIfSimulator from './components/WhatIfSimulator';

<WhatIfSimulator
  currentStats={{ mean: 102.5, stdDev: 2.3, cpk: 0.82 }}
  specs={{ usl: 110, lsl: 90, target: 100 }}
  defaultExpanded={false}
/>;
```

## Props

| Prop            | Type                                              | Default   | Description                                       |
| --------------- | ------------------------------------------------- | --------- | ------------------------------------------------- |
| currentStats    | `{ mean: number; stdDev: number; cpk?: number }`  | required  | Current process statistics                        |
| specs           | `{ usl?: number; lsl?: number; target?: number }` | undefined | Specification limits for Cpk calculations         |
| defaultExpanded | boolean                                           | false     | Initial expansion state (uncontrolled mode)       |
| presets         | `SimulatorPreset[]`                               | undefined | Quick-access scenario buttons                     |
| isExpanded      | boolean                                           | undefined | Controlled expansion state                        |
| onExpandChange  | `(expanded: boolean) => void`                     | undefined | Callback when expansion changes (controlled mode) |
| initialPreset   | `SimulatorPreset \| null`                         | undefined | Preset to apply on mount                          |

## SimulatorPreset Interface

```typescript
interface SimulatorPreset {
  /** Button label */
  label: string;
  /** Short description shown on hover */
  description: string;
  /** Mean shift to apply */
  meanShift: number;
  /** Variation reduction (0-0.5) to apply */
  variationReduction: number;
  /** Icon name (optional) */
  icon?: 'target' | 'x-circle' | 'star';
}
```

**Common presets:**

- **Center on target** - Shifts mean to target value (`icon: 'target'`)
- **Exclude worst** - Simulates removing highest-variation category (`icon: 'x-circle'`)
- **Standardize to best** - Matches best performer's variation (`icon: 'star'`)

## Imperative Handle

The component exposes an imperative handle for parent control:

```typescript
interface WhatIfSimulatorHandle {
  /** Apply a preset scenario programmatically */
  applyPreset: (preset: SimulatorPreset) => void;
  /** Expand the simulator panel */
  expand: () => void;
}
```

**Usage:**

```tsx
const simulatorRef = useRef<WhatIfSimulatorHandle>(null);

// Apply preset from external trigger
simulatorRef.current?.applyPreset({
  label: 'Exclude Machine C',
  description: 'Remove worst performer',
  meanShift: -2.1,
  variationReduction: 0.35,
  icon: 'x-circle',
});

// Expand panel
simulatorRef.current?.expand();

<WhatIfSimulator ref={simulatorRef} currentStats={stats} specs={specs} />;
```

## Controlled vs Uncontrolled

### Uncontrolled (default)

```tsx
// Component manages its own expansion state
<WhatIfSimulator currentStats={stats} specs={specs} defaultExpanded={false} />
```

### Controlled

```tsx
// Parent controls expansion state
const [expanded, setExpanded] = useState(false);

<WhatIfSimulator
  currentStats={stats}
  specs={specs}
  isExpanded={expanded}
  onExpandChange={setExpanded}
/>;
```

Use controlled mode when you need to:

- Open the simulator programmatically (e.g., from inline Cpk badge)
- Coordinate expansion with other UI elements
- Persist expansion state

## Slider Behavior

### Mean Adjustment

- **Range:** Calculated based on target distance or ±3σ
- **Overshoot:** 20% past target allowed for exploration
- **Step:** Auto-calculated (~20 steps across range)

### Variation Reduction

- **Range:** 0% to 50%
- **Step:** 5%
- **Display:** Percentage format

## Projection Display

```
Current → Projected
Mean:   102.5 → 100.0
σ:      2.3   → 1.6    (-30%)
Cpk:    0.82  → 1.56   (+90%)
Yield:  96.2% → 99.92% (+3.9%)
```

**Color coding:**

- Cpk ≥ 1.33: `text-green-400` (capable)
- Cpk 1.0-1.33: `text-amber-400` (marginal)
- Cpk < 1.0: `text-red-400` (incapable)

## Integration with VariationFunnel

The VariationFunnel component integrates with What-If Simulator through:

1. **Preset generation** - Creates presets from category analysis
2. **Inline Cpk badges** - Click to apply preset and expand simulator
3. **Controlled expansion** - Badge click expands simulator automatically
4. **Scroll into view** - After expansion, scrolls to simulator panel

```tsx
// VariationFunnel integration pattern
const [simulatorExpanded, setSimulatorExpanded] = useState(false);
const [activePreset, setActivePreset] = useState<SimulatorPreset | null>(null);
const simulatorContainerRef = useRef<HTMLDivElement>(null);

const handleCpkBadgeClick = (factor: string) => {
  const preset = calculatePresetForFactor(factor);
  setActivePreset(preset);
  setSimulatorExpanded(true);

  setTimeout(() => {
    simulatorContainerRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, 100);
};

<div ref={simulatorContainerRef}>
  <WhatIfSimulator
    currentStats={currentStats}
    specs={specs}
    presets={simulatorPresets}
    isExpanded={simulatorExpanded}
    onExpandChange={setSimulatorExpanded}
    initialPreset={activePreset}
  />
</div>;
```

## Visual Design

**Collapsed state:**

```
┌──────────────────────────────────────────┐
│ > 🧪 What-If Simulator            Active │
└──────────────────────────────────────────┘
```

**Expanded state:**

```
┌──────────────────────────────────────────┐
│ ▼ 🧪 What-If Simulator                   │
│                                          │
│ Adjust Mean                              │
│ ───────────────●─────────────  +2.5      │
│                                          │
│ Reduce Variation                         │
│ ─────────●─────────────────────  15%     │
│                                          │
│ [Center on target] [Exclude worst]       │
│                                          │
│ ┌──────────────────────────────────────┐ │
│ │     Current → Projected      [Reset] │ │
│ │ Mean:  102.5 → 100.0                 │ │
│ │ σ:    2.3   → 1.96    (-15%)         │ │
│ │ Cpk:  0.82  → 1.12    (+37%)         │ │
│ │ Yield: 96.2% → 98.8%                 │ │
│ └──────────────────────────────────────┘ │
│                                          │
│ Explore process improvement by adjusting │
│ mean and reducing variation.             │
└──────────────────────────────────────────┘
```

## Dependencies

- `@variscout/core` - `simulateDirectAdjustment()` function
- `lucide-react` - Icons (ChevronRight, ChevronDown, RotateCcw, Beaker, Target, XCircle, Star)
- `./ui/Slider` - Slider input component

## Files

| File                                            | Purpose                        |
| ----------------------------------------------- | ------------------------------ |
| `apps/pwa/src/components/WhatIfSimulator.tsx`   | PWA component implementation   |
| `apps/pwa/src/components/ui/Slider.tsx`         | PWA Slider input component     |
| `apps/azure/src/components/WhatIfSimulator.tsx` | Azure component implementation |
| `apps/azure/src/components/ui/Slider.tsx`       | Azure Slider input component   |
| `packages/core/src/variation.ts`                | `simulateDirectAdjustment()`   |

## Related Components

- [VariationFunnel](./variation-funnel.md) - Parent component with factor analysis
- [VariationBar](./variation-bar.md) - Visual progress bar for variation tracking
- [Improvement Simulator Concept](../../concepts/improvement-simulator/OVERVIEW.md) - Strategy document
