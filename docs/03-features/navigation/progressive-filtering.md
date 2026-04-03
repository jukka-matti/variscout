---
title: Progressive Filtering
audience: [analyst, engineer]
category: navigation
status: stable
related: [filter-chips, progressive-stratification, eta-squared, chart-interaction]
---

# Progressive Filtering

<!-- journey-phase: scout -->

> **Journey phase:** Primarily SCOUT (drill-down to find variation drivers) and INVESTIGATE (validating questions on filtered subsets).

VariScout's navigation system connects drill-down analysis, linked filtering, and filter chips into one cohesive workflow for isolating variation sources.

---

## 1. Drill-Down: Progressive Stratification

Start with all data, then progressively filter to find where variation concentrates. Factor Intelligence (R²adj) guides which factors to explore. η² confirms each factor's effect size. Filter chips show sample counts:

```
┌──────────────────────────┐  ┌──────────────────────────┐  ┌──────────────────────────┐
│ Shift = Night (n=45)     │  │ Machine = C (n=15)       │  │ Operator = Kim (n=8)     │
└──────────────────────────┘  └──────────────────────────┘  └──────────────────────────┘
```

Each chip shows the factor, selected value, and how many observations remain in the filtered subset.

### Decision Guidance

| Signal                                            | Action                                              |
| ------------------------------------------------- | --------------------------------------------------- |
| Factor Intelligence shows high R²adj for a factor | Drill that factor first                             |
| η² > 50% for a factor                             | Strong main effect — this factor dominates          |
| StdDev of one category is 2x+ others              | Investigate that category's spread                  |
| η² < 10% for all remaining factors                | Remaining variation is common cause — stop drilling |
| n < 20 after filtering                            | Data too sparse for reliable statistics             |

### When to Check for Interactions

The drill-down methodology captures **main effects** — how much variation each factor explains independently. But factors can also **interact**:

> "Machine C is only problematic on Night shift"

**Note:** Interaction detection is planned for a future phase (see [ADR-014](../../07-decisions/adr-014-regression-deferral.md)). Currently, the drill-down captures main effects only. Factor Intelligence can hint at interactions when a two-factor combination has much higher R²adj than either factor alone.

| Scenario                   | Recommendation                                                    |
| -------------------------- | ----------------------------------------------------------------- |
| **Low η² for all factors** | Check for interactions — combined effect may be stronger          |
| **Factors seem related**   | Machine type + Operator experience often interact                 |
| **Action seems ambiguous** | "Fix Machine C" vs "Change Night process" — interaction clarifies |

| Method                        | What it captures                    |
| ----------------------------- | ----------------------------------- |
| Sequential ANOVA (drill-down) | Main effects only (η² per factor)   |
| GLM with interactions         | Main effects + two-way interactions |

See [Regression Analysis: Interaction Effects](../../archive/regression.md#interaction-effects) for details (Phase 2, deferred per ADR-014).

---

## 2. Linked Filtering: Cross-Chart Interaction

When you click on one chart, all others respond:

| Action                       | System Response                                            |
| ---------------------------- | ---------------------------------------------------------- |
| Click "Machine B" in Boxplot | I-Chart shows only Machine B's timeline                    |
|                              | Pareto shows only Machine B's failure modes                |
|                              | Capability recalculates for Machine B alone                |
| Click "Above UCL" in I-Chart | Boxplot highlights which factors had out-of-control points |
|                              | Pareto shows defect types during unstable periods          |

This isn't just a UI feature — it's how the Four Lenses interconnect:

```
        ┌─────────┐
        │ CHANGE  │ ← Click a time region
        │(I-Chart)│
        └────┬────┘
             │
             ▼
┌─────────┐     ┌─────────┐
│  FLOW   │◄───►│ FAILURE │ ← See which factors/failures
│(Boxplot)│     │(Pareto) │    were active then
└────┬────┘     └────┬────┘
     │               │
     └───────┬───────┘
             │
             ▼
        ┌─────────┐
        │  VALUE  │ ← Capability updates
        │(Capable)│    for filtered subset
        └─────────┘
```

---

## 3. Filter Chips: UI & Interaction

Filter chips replace the traditional breadcrumb trail with a chips-based interface:

```
┌─────────────────────────────────────────────────────────────────────────┐
│ ACTIVE FILTERS                                                          │
│                                                                         │
│ ┌──────────────────────┐  ┌─────────────────────────┐  ┌─────────────┐ │
│ │ Shift = Night (n=45) │  │ Machine = A, C (n=22)   │  │ Operator =  │ │
│ │                      │  │                         │  │ Kim (n=8)   │ │
│ └──────────────────────┘  └─────────────────────────┘  └─────────────┘ │
└─────────────────────────────────────────────────────────────────────────┘
```

Each chip shows:

- **Factor name**: The column being filtered
- **Selected values**: Current selection (truncated if multiple)
- **n=X**: Sample count for the current selection
- **Dropdown arrow**: Click to see all values

### Multi-Select Support

Filter chips support selecting multiple values within a factor:

| Selection    | Display                        |
| ------------ | ------------------------------ |
| Single value | `Shift = Night (n=45)`         |
| Two values   | `Shift = Day, Night (n=78)`    |
| 3+ values    | `Shift = Day, Night +1 (n=89)` |

### Dropdown Values

Clicking a chip reveals all available values with sample counts:

```
┌─────────────────────────┐
│ Shift                   │
├─────────────────────────┤
│ ☑ Night        n=45    │
│ ☐ Day          n=33    │
│ ☐ Evening      n=22    │
├─────────────────────────┤
│ [Remove Filter]         │
└─────────────────────────┘
```

### Navigation Actions

| Action                | Result                               |
| --------------------- | ------------------------------------ |
| Click chip dropdown   | Show all values with sample counts   |
| Toggle value checkbox | Add/remove value from selection      |
| Click "Remove Filter" | Remove entire filter for that factor |
| Click "Clear All"     | Reset to unfiltered view             |
| Keyboard: Backspace   | Remove last filter                   |

---

## Implementation

```typescript
import { useFilterNavigation } from '@variscout/hooks';

// Filter navigation with multi-select support
const { filterStack, applyFilter, updateFilterValues, removeFilter, clearFilters, hasFilters } =
  useFilterNavigation(
    { filters, setFilters, columnAliases },
    { enableHistory: true, enableUrlSync: true }
  );

// Single value selection (traditional drill)
applyFilter({
  type: 'filter',
  source: 'boxplot',
  factor: 'Shift',
  values: ['Night'],
});

// Multi-select: add another value
updateFilterValues('Shift', ['Night', 'Day'], 'boxplot');

// Remove a specific filter
removeFilter('Shift');
```

### Click Handlers

```typescript
// Boxplot click handler - single value
const handleBoxClick = (factor: string, level: string) => {
  applyFilter({
    type: 'filter',
    source: 'boxplot',
    factor,
    values: [level],
  });
  // All charts automatically re-render with filtered data
};

// Multi-select handler - toggle value in existing filter
const handleMultiSelect = (factor: string, value: string, currentValues: string[]) => {
  const newValues = currentValues.includes(value)
    ? currentValues.filter(v => v !== value)
    : [...currentValues, value];
  updateFilterValues(factor, newValues, 'boxplot');
};
```

### Filter Chip Rendering

```typescript
// Render filter chips from filter stack
{filterStack.map(filter => (
  <FilterChipDropdown
    key={filter.factor}
    factor={filter.factor}
    values={filter.values}
    sampleCount={filter.sampleCount}
    onValuesChange={(newValues) => updateFilterValues(filter.factor, newValues)}
    onRemove={() => removeFilter(filter.factor)}
  />
))}
```

---

## User Interaction Flow

1. **Check Factor Intelligence** — See R²adj ranking for factor priority
2. **View Boxplot** — See η² and category distributions
3. **Click category** — Filter into that factor value
4. **Filter chip appears** — Shows selected value(s) and n=X
5. **Click chip dropdown** — Select/deselect additional values
6. **Repeat** — Until actionable condition found
7. **Remove filter** — Click X or use "Remove Filter" in dropdown

---

## See Also

- [Four Lenses: Drill-Down](../../01-vision/four-lenses/drilldown.md)
- [Four Lenses](../../01-vision/four-lenses/index.md)
- [Progressive Stratification](../../01-vision/progressive-stratification.md)
