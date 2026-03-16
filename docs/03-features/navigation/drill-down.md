# Drill-Down Navigation

Drill-down is VariScout's core methodology for isolating variation sources through progressive stratification.

---

## Concept

Start with all data, then progressively filter to find where variation concentrates. Filter chips show contribution to TOTAL variation:

```
┌────────────────────┐  ┌────────────────────┐  ┌────────────────────┐
│ Shift: Night ▼ 67% │  │ Machine: C ▼ 24%   │  │ Operator: Kim ▼ 9% │
└────────────────────┘  └────────────────────┘  └────────────────────┘
```

Each chip shows how much of the TOTAL variation that filter captures.

---

## Decision Thresholds

| Variation % | Action                                   |
| ----------- | ---------------------------------------- |
| **>50%**    | Auto-drill — this is the primary driver  |
| **>80%**    | Strong focus — highly concentrated issue |
| **30-50%**  | Recommend investigating, ask user        |
| **<30%**    | Multiple factors — check interactions    |

---

## When to Check for Interactions

The drill-down methodology captures **main effects** — how much variation each factor explains independently. But factors can also **interact**:

> "Machine C is only problematic on Night shift"

### The Guidance Prompt

When 2+ factors are in your drill stack, the Investigation Mindmap's Interaction mode shows factor relationships visually as edges between nodes. The Mindmap also surfaces a guidance prompt:

```
┌────────────────────────────────────────────────┐
│ Analyzing multiple factors?                    │
│                                                │
│ Your drill-down shows main effects. To check  │
│ if factors interact, use the Regression Panel │
│ with "Include interactions".                  │
│                                                │
│ [Check Interactions →]                        │
└────────────────────────────────────────────────┘
```

### When Interactions Matter

| Scenario                     | Recommendation                                                    |
| ---------------------------- | ----------------------------------------------------------------- |
| **<30% variation explained** | Check for interactions — combined effect may be stronger          |
| **Factors seem related**     | Machine type + Operator experience often interact                 |
| **Action seems ambiguous**   | "Fix Machine C" vs "Change Night process" — interaction clarifies |

### Statistical Difference

| Method                        | What it captures                    |
| ----------------------------- | ----------------------------------- |
| Sequential ANOVA (drill-down) | Main effects only (η² per factor)   |
| GLM with interactions         | Main effects + two-way interactions |

See [Regression Analysis: Interaction Effects](../../archive/regression.md#interaction-effects) for details (Phase 2, deferred per ADR-014).

---

## Cumulative Impact

The real power is cumulative calculation of contribution percentages:

```
FILTER CHIPS                      CONTRIBUTION TO TOTAL
─────────────────────────────────────────────────────────
[Shift: Night ▼ 67%]              67% of total variation
[Machine: C ▼ 24%]                (within Night Shift context)
[Operator: Kim ▼ 9%]              (within Machine C + Night)

CUMULATIVE: Focused on ~46% of TOTAL variation
```

**Result:** Three filters focus on nearly half of ALL variation in ONE condition.

---

## Implementation

```typescript
import { useFilterNavigation, useVariationTracking } from '@variscout/hooks';

// Filter navigation with multi-select support
const { filterStack, applyFilter, updateFilterValues, removeFilter, clearFilters, hasFilters } =
  useFilterNavigation(
    { filters, setFilters, columnAliases },
    { enableHistory: true, enableUrlSync: true }
  );

// Variation tracking for filter chip data
const {
  filterChipData, // Data for rendering filter chips
  cumulativeVariationPct, // Total SS scope % in focus
  impactLevel, // 'high' | 'moderate' | 'low'
  factorVariations, // η² for each factor (internal drill suggestion)
} = useVariationTracking(rawData, filterStack, outcome, factors);

// Update filter with multiple values (multi-select)
updateFilterValues('Machine', ['A', 'C'], 'boxplot');

// Remove a specific filter
removeFilter('Shift');
```

---

## User Interaction

1. **View Boxplot** - See factor comparison with contribution %
2. **Click category** - Filter into that factor value
3. **Filter chip appears** - Shows selected value(s) and contribution %
4. **Click chip dropdown** - Select/deselect additional values
5. **Repeat** - Until actionable condition found
6. **Remove filter** - Click X or use "Remove Filter" in dropdown

---

## Multi-Select Workflow

Filter chips support selecting multiple values within a factor:

```typescript
// Single value selection (traditional drill)
applyFilter({
  type: 'filter',
  source: 'boxplot',
  factor: 'Shift',
  values: ['Night'],
});

// Add another value (multi-select)
updateFilterValues('Shift', ['Night', 'Day'], 'boxplot');

// Remove one value, keep the other
updateFilterValues('Shift', ['Night'], 'boxplot');

// Remove filter entirely
removeFilter('Shift');
```

---

## See Also

- [Four Lenses: Drill-Down](../../01-vision/four-lenses/drilldown.md)
- [Filter Chips](breadcrumbs.md)
- [Linked Filtering](linked-filtering.md)
