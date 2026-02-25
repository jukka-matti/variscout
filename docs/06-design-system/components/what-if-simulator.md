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

- `whatIfPageDefaultColorScheme` — Semantic tokens (PWA)
- `whatIfPageAzureColorScheme` — Slate palette (Azure)
- `whatIfSimulatorDefaultColorScheme` / `whatIfSimulatorAzureColorScheme`

The `WhatIfSimulatorColorScheme` includes `improvementPositive` and `improvementNegative` for directional change indicators (Cpk/yield improvement or decline), and `cpkGood`/`cpkOk`/`cpkBad` for Cpk status coloring.

---

## See Also

- [Variation Bar](variation-funnel.md) - Visual progress of isolated variation
- [Drill-Down Feature](../../03-features/navigation/drill-down.md)
