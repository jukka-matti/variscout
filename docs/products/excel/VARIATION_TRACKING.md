# Variation Tracking in Excel Add-in

**Status:** Implemented  
**Version:** 1.0  
**Last Updated:** January 2026

---

## Overview

The Excel Add-in displays variation percentages (η²) on the Boxplot chart to help users identify which factors explain the most variation in their data. This is a simplified version of the PWA's full cumulative variation tracking — optimized for Excel's slicer-based workflow.

---

## Feature Scope

### What's Included

- **Variation % on boxplot axis label**: Shows `Factor (X%)` format
- **Visual drill suggestion**: Red highlight + "↓ drill here" when variation ≥ 50%
- **Automatic calculation**: Updates when data changes or slicers are adjusted

### What's NOT Included (Excel-specific)

- **Breadcrumb navigation**: Excel uses native slicers for filtering
- **Cumulative tracking**: Single-level view (no drill stack in Excel)
- **Drill history**: Users control filtering via Excel's UI

---

## How It Works

### Calculation Flow

```
Excel Table Data
      │
      ▼
ContentDashboard.tsx
      │
      ├─► calculateFactorVariations(filteredData, [factor], outcome, [])
      │         │
      │         ▼
      │   Map<string, number>  (factor → variation %)
      │
      ▼
BoxplotBase
      │
      ├─► variationPct prop
      │
      ▼
X-Axis Label: "Shift (67%)"
+ "↓ drill here" indicator (if ≥50%)
```

### Integration Code

```typescript
// apps/excel-addin/src/content/ContentDashboard.tsx

import { calculateFactorVariations } from '@variscout/core';

// Calculate variation for the active factor
const factorVariationPct = useMemo(() => {
  if (!filteredData.length || !state.factorColumns?.[0] || !state.outcomeColumn) {
    return undefined;
  }

  const factor = state.factorColumns[0];
  const variations = calculateFactorVariations(
    filteredData,
    [factor],
    state.outcomeColumn,
    [] // No excluded factors
  );

  return variations.get(factor);
}, [filteredData, state.outcomeColumn, state.factorColumns]);

// Pass to BoxplotBase
<BoxplotBase
  data={boxplotData}
  specs={state.specs || {}}
  xAxisLabel={state.factorColumns?.[0] || 'Group'}
  variationPct={factorVariationPct}
  // ...other props
/>
```

---

## User Experience

### Normal Case (variation < 50%)

```
┌────────────────────────────────────┐
│          Boxplot Chart             │
│     [box] [box] [box] [box]        │
│       A     B     C     D          │
│                                    │
│           Shift (34%)              │
└────────────────────────────────────┘
```

- Gray axis label showing factor name + percentage
- No special highlight

### High Variation Case (≥ 50%)

```
┌────────────────────────────────────┐
│          Boxplot Chart             │
│     [box] [box] [box] [box]        │
│       A     B     C     D          │
│                                    │
│         🔴 Shift (67%)             │
│           ↓ drill here             │
└────────────────────────────────────┘
```

- Red axis label showing factor name + percentage
- "↓ drill here" indicator below
- Suggests user should filter with slicer to investigate

---

## Workflow Integration

### User Flow

1. **Set up analysis** in Task Pane (data, factor, outcome, specs)
2. **View boxplot** in Content Add-in
3. **See variation %** on axis label
4. **If highlighted**: Use Excel slicer to filter to specific category
5. **Observe**: Data updates, new variation % calculated for remaining factors

### Example Scenario

1. User loads manufacturing data
2. Boxplot shows `Shift (67%)` with red highlight
3. User clicks "Night" in Shift slicer
4. Boxplot now shows `Machine (45%)` — no highlight
5. Insight: Shift was the major driver; within Night Shift, machine variation is less dominant

---

## Differences from PWA

| Feature             | PWA                          | Excel Add-in      |
| ------------------- | ---------------------------- | ----------------- |
| Variation display   | Breadcrumb + Boxplot + Bar   | Boxplot only      |
| Cumulative tracking | Yes (multiplied η²)          | No (single level) |
| Variation bar       | Stacked bar below breadcrumb | Not included      |
| Variation funnel    | Slide-in analysis panel      | Not included      |
| Drill suggestions   | Boxplot highlight            | Boxplot highlight |
| Navigation          | Click-to-drill               | Use Excel slicers |
| Filter history      | Breadcrumb trail             | Excel's native UI |
| Insight tooltips    | On cumulative badge + bar    | Not included      |
| Popout window       | Dual-screen funnel view      | Not applicable    |

**Note:** The PWA includes additional visual features:

- **Stacked Variation Bar** — Visual progress bar below breadcrumb showing isolated vs unexplained variation
- **Variation Funnel Panel** — Slide-in analysis tool that finds optimal factor combinations
- **Popout Window Support** — Opens funnel in separate window for dual-screen analysis

These features use the same core `@variscout/core` functions (`findOptimalFactors()`, `getVariationImpactLevel()`, `getVariationInsight()`) and may be added to Excel in future versions.

---

## Technical Details

### Shared Components

The Excel Add-in uses the same shared infrastructure as the PWA:

- **`@variscout/core`**: `calculateFactorVariations()` function
- **`@variscout/charts`**: `BoxplotBase` with `variationPct` prop

### Thresholds

```typescript
// packages/core/src/navigation.ts
export const VARIATION_THRESHOLDS = {
  HIGH_IMPACT: 50, // Red highlight threshold
  MODERATE_IMPACT: 30, // Amber (not used in Excel)
} as const;
```

---

## Related Documentation

- [Architecture Overview](../../../ARCHITECTURE.md) — Shared architecture
- [PWA Variation Tracking](../pwa/VARIATION_TRACKING.md) — Full feature documentation
- [Statistics Reference](../../STATISTICS_REFERENCE.md) — Eta-squared calculation
- [Excel Add-in Tech Spec](./TECH-EXCEL-ADDIN.md) — Full Excel Add-in documentation
