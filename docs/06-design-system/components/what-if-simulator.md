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

| Component              | Package         | Purpose                                              |
| ---------------------- | --------------- | ---------------------------------------------------- |
| `WhatIfSimulator`      | `@variscout/ui` | Standard simulator with mean-shift/variation sliders |
| `ModelDrivenSimulator` | `@variscout/ui` | Regression model-based per-factor simulator          |
| `WhatIfPageBase`       | `@variscout/ui` | Full-page wrapper with back navigation               |
| `Slider`               | `@variscout/ui` | Reusable range slider for factor adjustments         |

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

## Model-Driven Simulator

When arriving from the Regression Panel with a significant model, the `ModelDrivenSimulator` renders above the standard `WhatIfSimulator`. It uses regression coefficients to compute per-factor projections.

**Source:** `packages/ui/src/components/WhatIfSimulator/ModelDrivenSimulator.tsx`

### Props

```typescript
interface ModelDrivenSimulatorProps {
  /** Regression model from Advanced mode */
  model: MultiRegressionResult;
  /** Filtered data for computing baselines */
  filteredData: DataRow[];
  /** Current process statistics */
  currentStats: { mean: number; stdDev: number; cpk?: number };
  /** Specification limits */
  specs?: { usl?: number; lsl?: number; target?: number };
  /** Color scheme */
  colorScheme?: WhatIfSimulatorColorScheme;
}
```

### Factor Controls

The simulator generates controls automatically based on the model's predictor types:

| Factor Type     | Control           | Range                                                               |
| --------------- | ----------------- | ------------------------------------------------------------------- |
| **Categorical** | Dropdown selector | All levels, each showing coefficient delta (e.g., `Level B (+2.3)`) |
| **Continuous**  | Slider            | mean +/- 2 standard deviations, auto-rounded step size              |

Factor baselines are computed via `getFactorBaselines(filteredData, model)` from `@variscout/core`. Categorical baselines use the mode (most frequent value); continuous baselines use the mean.

### Contribution Bars

When any factor is adjusted, horizontal contribution bars appear showing each factor's delta contribution to the predicted mean shift. Bars are centered on a zero-line: positive deltas extend right (green), negative deltas extend left (red). Bar widths are scaled relative to the largest absolute contribution.

### Projection Engine

Uses `simulateFromModel(model, adjustments)` from `@variscout/core` to compute the total mean shift from regression coefficients, then feeds the shift through `simulateDirectAdjustment()` to project Cpk and yield changes.

The projection results panel shows:

- **Mean:** Current and projected values with delta
- **Cpk:** Color-coded (green >= 1.33, amber >= 1.0, red < 1.0) with improvement percentage
- **Yield:** Current and projected with improvement percentage

### Reset

A "Reset" button (RotateCcw icon) clears all proposed factor values back to baselines.

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
  /** Optional regression model for model-driven simulation */
  regressionModel?: MultiRegressionResult;
}
```

### Rendering with regressionModel

When `regressionModel` is provided, `WhatIfPageBase` renders both simulators:

1. **`ModelDrivenSimulator`** — Rendered first, using the regression model for per-factor coefficient-based projections
2. **`WhatIfSimulator`** — Rendered below, collapsed by default (`defaultExpanded={!regressionModel}`), providing the standard mean-shift and variation-reduction sliders

When `regressionModel` is not provided, only the standard `WhatIfSimulator` renders in its default expanded state.

### Color Schemes

All components follow the standard colorScheme pattern:

- `whatIfPageDefaultColorScheme` — Semantic tokens (PWA)
- `whatIfPageAzureColorScheme` — Slate palette (Azure)
- `whatIfSimulatorDefaultColorScheme` / `whatIfSimulatorAzureColorScheme`

---

## See Also

- [Variation Bar](variation-funnel.md) - Visual progress of isolated variation
- [Drill-Down Feature](../../03-features/navigation/drill-down.md)
