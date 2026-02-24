# Investigation-to-Regression Bridge

Contextual navigation buttons that connect the Investigation Mindmap to the Regression Panel, enabling a seamless transition from exploratory drill-down to formal modeling.

## Overview

When users have investigated factors in the mindmap, two bridge mechanisms offer direct paths into Regression Advanced mode with pre-populated predictors. These replaced the earlier `InteractionGuidance` component (removed with the FunnelPanel).

| Bridge                     | Location                      | Trigger             | Factors Passed           |
| -------------------------- | ----------------------------- | ------------------- | ------------------------ |
| **ConclusionPanel button** | Narrative mode conclusion     | `steps.length >= 2` | All investigated factors |
| **EdgeTooltip button**     | Interaction mode edge tooltip | Click any edge      | The two edge factors     |

Both buttons pass factors to `onNavigateToRegression(factors)` or `onModelInteraction(factors)`, which feeds them into the Regression Panel as `initialPredictors`.

## ConclusionPanel "Refine in Regression" Button

Appears at the bottom of the narrative conclusion panel when the user has drilled into two or more factors.

### Visibility Logic

- **Shows:** When `onNavigateToRegression` is provided AND `steps.length >= 2`
- **Hides:** When fewer than 2 narrative steps exist

### Visual Design

```
┌──────────────────────────────────┐
│  Focused on 72% of variation     │
│  28% outside scope               │
│                                  │
│  [ Refine in Regression -> ]     │  <- amber button
│  [ Model improvements ->   ]     │  <- blue button (What-If)
└──────────────────────────────────┘
```

**Button style:**

- Background: `chartColors.warning` at 10% opacity (`#f59e0b18`)
- Border: `chartColors.warning` at 25% opacity (`#f59e0b40`)
- Text: `chartColors.warning` (`#f59e0b`), 10px, weight 500
- Hover: background increases to 19% opacity (`#f59e0b30`)
- Focus: 2px outline in `chartColors.warning`

### Behavior

On click, calls `onNavigateToRegression(steps.map(s => s.factor))` — passing all investigated factor names from the narrative steps.

### Source

`packages/charts/src/mindmap/ConclusionPanel.tsx`

## EdgeTooltip "Model in Regression" Button

Appears inside the edge tooltip in Interaction mode when viewing a factor pair.

### Visibility Logic

- **Shows:** When `onModelInteraction` prop is provided on the tooltip
- **Hides:** When the prop is not provided

### Visual Design

```
┌──────────────────────────────────┐
│  Shift x Machine                 │
│  --------------------------------│
│  Delta R^2      3.2%             │
│  p              0.012            │
│  beta           0.45             │
│                                  │
│  [ Model in Regression -> ]      │  <- amber button, full-width
└──────────────────────────────────┘
```

**Button style:** Same amber color scheme as the ConclusionPanel button, but rendered full-width inside the tooltip.

### Behavior

On click, calls `onModelInteraction([edge.factorA, edge.factorB])` and closes the tooltip.

### Source

`packages/charts/src/mindmap/EdgeTooltip.tsx`

## initialPredictors Auto-Population

When either bridge button is clicked, the app-level handler sets `initialPredictors` on the Regression Panel. The `useRegressionState` hook responds with an effect that:

1. Switches mode to `'advanced'`
2. Sets the selected predictors to the passed factor list
3. Detects non-numeric columns and marks them as categorical

```typescript
// packages/hooks/src/useRegressionState.ts
useEffect(() => {
  if (initialPredictors && initialPredictors.length > 0) {
    setMode('advanced');
    setAdvSelectedPredictors(initialPredictors);
    // Mark categorical columns that aren't in numeric list
    const catSet = new Set<string>();
    for (const col of initialPredictors) {
      if (!numericColumns.includes(col)) {
        catSet.add(col);
      }
    }
    if (catSet.size > 0) {
      setCategoricalColumns(catSet);
    }
  }
}, [initialPredictors, numericColumns]);
```

The `RegressionPanelBase` also accepts `investigationFactors?: string[]` for a suggestion banner that appears when the user navigates to Advanced mode without `initialPredictors` — offering a one-click "add all" for factors found during investigation.

## Props

### InvestigationMindmapProps (relevant subset)

| Prop                     | Type                          | Description                                               |
| ------------------------ | ----------------------------- | --------------------------------------------------------- |
| `onNavigateToRegression` | `(factors: string[]) => void` | Called from ConclusionPanel with all investigated factors |
| `onModelInteraction`     | `(factors: string[]) => void` | Called from EdgeTooltip with the two edge factors         |

### RegressionPanelBaseProps (relevant subset)

| Prop                   | Type       | Description                                                     |
| ---------------------- | ---------- | --------------------------------------------------------------- |
| `initialPredictors`    | `string[]` | Pre-populate Advanced mode predictors from investigation bridge |
| `investigationFactors` | `string[]` | Show suggestion banner for uninvestigated factors               |

### UseRegressionStateOptions (relevant subset)

| Prop                | Type       | Description                                                    |
| ------------------- | ---------- | -------------------------------------------------------------- |
| `initialPredictors` | `string[]` | External predictors that trigger mode switch + auto-population |

## Accessibility

- Both buttons are keyboard accessible with focus ring states
- ConclusionPanel button has visible focus outline (2px `chartColors.warning`)
- EdgeTooltip button inherits tooltip keyboard handling
- Color contrast meets WCAG AA for interactive elements on dark backgrounds

## Files

| File                                                                 | Purpose                                                           |
| -------------------------------------------------------------------- | ----------------------------------------------------------------- |
| `packages/charts/src/mindmap/types.ts`                               | Prop definitions (`onNavigateToRegression`, `onModelInteraction`) |
| `packages/charts/src/mindmap/ConclusionPanel.tsx`                    | Narrative conclusion with "Refine in Regression" button           |
| `packages/charts/src/mindmap/EdgeTooltip.tsx`                        | Interaction edge tooltip with "Model in Regression" button        |
| `packages/hooks/src/useRegressionState.ts`                           | `initialPredictors` effect (mode switch + auto-population)        |
| `packages/ui/src/components/RegressionPanel/RegressionPanelBase.tsx` | `initialPredictors` + `investigationFactors` banner               |

## Related Components

- [Investigation Mindmap](../../06-design-system/charts/mindmap.md) — Parent component rendering both bridge buttons
- [Regression Panel](../../03-features/analysis/regression.md) — Target destination for the bridge
- [Investigation to Action Workflow](../../03-features/workflows/investigation-to-action.md) — Three-phase workflow using these bridges

## See Also

- [Drill-Down Workflow](../../03-features/workflows/drill-down-workflow.md) — Investigation mechanics
- [What-If Simulator](what-if-simulator.md) — Phase 3 destination (via Regression "Project in What-If" button)
