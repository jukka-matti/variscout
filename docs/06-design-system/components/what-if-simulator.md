# What-If Simulator

Interactive component for exploring process improvement scenarios.

---

## Purpose

The What-If Simulator allows users to explore hypothetical improvements:

- "What if we reduced variation in Factor X by 50%?"
- "What would happen to Cpk if we centered the process?"
- "How much defect reduction would we see?"

---

## Shared Components

Both PWA and Azure App use shared components from `@variscout/ui`:

| Component         | Package         | Purpose                                              |
| ----------------- | --------------- | ---------------------------------------------------- |
| `WhatIfSimulator` | `@variscout/ui` | Standard simulator with mean-shift/variation sliders |
| `WhatIfPageBase`  | `@variscout/ui` | Full-page wrapper with back navigation               |
| `Slider`          | `@variscout/ui` | Reusable range slider for factor adjustments         |

**Source:** `packages/ui/src/components/WhatIfSimulator/`, `packages/ui/src/components/WhatIfPage/`

---

## WhatIfSimulator

Collapsible panel with factor-level reduction sliders and projected Cpk improvement.

### Props

```typescript
interface WhatIfSimulatorProps {
  currentStats: { mean: number; stdDev: number; cpk?: number };
  specs?: { usl?: number; lsl?: number; target?: number };
  defaultExpanded?: boolean;
  presets?: SimulatorPreset[];
  isExpanded?: boolean;
  onExpandChange?: (expanded: boolean) => void;
  initialPreset?: SimulatorPreset | null;
  colorScheme?: WhatIfSimulatorColorScheme;
  /** Cpk target for color thresholds (default 1.33) */
  cpkTarget?: number;
}
```

### User Interaction

1. Select a factor from drill-down results
2. Adjust the "reduction" slider (0-100%)
3. See projected impact on:
   - Cpk improvement
   - Defect reduction
   - Variation reduction

Uses `simulateDirectAdjustment()` from `@variscout/core` for projection calculations.

### Smart Presets

The simulator auto-computes up to 6 one-click presets based on current stats and [characteristic type](../../../03-features/analysis/characteristic-types.md):

| #   | Preset          | Logic                              |
| --- | --------------- | ---------------------------------- |
| 1   | Shift to target | Mean shift to target/midpoint      |
| 2   | Shift to median | Corrects skew                      |
| 3   | Match best      | Direction-aware best category mean |
| 4   | Tighten spread  | Match tightest category's std dev  |
| 5   | Reach 95% yield | Reverse-calc shift/reduction       |
| 6   | Best of both    | Combine #3 + #4                    |

Preset 3 ("Match best") uses the characteristic type: for smaller-is-better, it targets the category with the lowest mean; for larger-is-better, the highest mean; for nominal, the closest to target.

---

## WhatIfPageBase

Full-page view wrapping the simulator with navigation header and data context.

### Props

```typescript
interface WhatIfPageBaseProps {
  filteredData: DataRow[];
  rawData: DataRow[];
  outcome: string | null;
  specs: SpecLimits;
  filterCount: number;
  filterNames?: string[];
  onBack: () => void;
  colorScheme?: WhatIfPageColorScheme;
  simulatorColorScheme?: WhatIfSimulatorColorScheme;
  /** Cpk target for color thresholds */
  cpkTarget?: number;
}
```

### Rendering

`WhatIfPageBase` renders the standard `WhatIfSimulator` in its default expanded state, providing mean-shift and variation-reduction sliders for direct adjustment simulation.

### Color Schemes

All components follow the standard colorScheme pattern:

- `whatIfPageDefaultColorScheme` — Semantic tokens (used by both PWA and Azure)
- `whatIfSimulatorDefaultColorScheme` — Semantic tokens (used by both PWA and Azure)

The `WhatIfSimulatorColorScheme` includes `improvementPositive` and `improvementNegative` for directional change indicators (Cpk/yield improvement or decline), and `cpkGood`/`cpkOk`/`cpkBad` for Cpk status coloring.

---

## See Also

- [Variation Bar](variation-funnel.md) - Visual progress of variation in focus
- [Drill-Down Feature](../../03-features/navigation/drill-down.md)
