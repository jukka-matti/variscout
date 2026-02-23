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

| Component         | Package         | Purpose                                      |
| ----------------- | --------------- | -------------------------------------------- |
| `WhatIfSimulator` | `@variscout/ui` | Core simulator with factor sliders           |
| `WhatIfPageBase`  | `@variscout/ui` | Full-page wrapper with back navigation       |
| `Slider`          | `@variscout/ui` | Reusable range slider for factor adjustments |

**Source:** `packages/ui/src/components/WhatIfSimulator/`, `packages/ui/src/components/WhatIfPage/`

---

## WhatIfSimulator

Collapsible panel with factor-level reduction sliders and projected Cpk improvement.

### Props

```typescript
interface WhatIfSimulatorProps {
  baselineStats: StatsResult; // Current process statistics
  specs: SpecLimits; // USL/LSL/Target
  factors: string[]; // Available factors from drill-down
  filteredData: DataRow[]; // Current filtered data
  rawData: DataRow[]; // Full dataset
  outcome: string; // Outcome column name
  colorScheme?: WhatIfSimulatorColorScheme;
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
  onBack: () => void;
  colorScheme?: WhatIfPageColorScheme;
  simulatorColorScheme?: WhatIfSimulatorColorScheme;
  sliderColorScheme?: SliderColorScheme;
}
```

### Color Schemes

Both components follow the standard colorScheme pattern:

- `whatIfPageDefaultColorScheme` — Semantic tokens (PWA)
- `whatIfPageAzureColorScheme` — Slate palette (Azure)
- `whatIfSimulatorDefaultColorScheme` / `whatIfSimulatorAzureColorScheme`

---

## See Also

- [Variation Bar](variation-funnel.md) - Visual progress of isolated variation
- [Drill-Down Feature](../../03-features/navigation/drill-down.md)
