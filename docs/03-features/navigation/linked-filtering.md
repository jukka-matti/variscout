# Linked Filtering

Linked filtering connects all charts so clicking one filters all others.

---

## Concept

When you click on one chart, all others respond:

| Action                       | System Response                                            |
| ---------------------------- | ---------------------------------------------------------- |
| Click "Machine B" in Boxplot | I-Chart shows only Machine B's timeline                    |
|                              | Pareto shows only Machine B's failure modes                |
|                              | Capability recalculates for Machine B alone                |
| Click "Above UCL" in I-Chart | Boxplot highlights which factors had out-of-control points |
|                              | Pareto shows defect types during unstable periods          |

---

## Why It Matters

This isn't just a UI feature — it's how the Four Pillars interconnect:

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

## Implementation

### State Management

```typescript
import { useFilterNavigation, useVariationTracking } from '@variscout/hooks';

// Filter navigation manages active filters
const {
  filterStack,
  applyFilter,
  updateFilterValues,
  removeFilter,
  clearFilters,
  hasFilters,
} = useFilterNavigation(
  { filters, setFilters, columnAliases },
  { enableHistory: true }
);

// Variation tracking provides filter chip data
const { filterChipData, cumulativeVariationPct } = useVariationTracking(
  rawData,
  filterStack,
  outcome,
  factors
);

// Filters propagate to all charts via filteredData
<IChart data={filteredData} />
<Boxplot data={filteredData} />
<ParetoChart data={filteredData} />
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
// Render filter chips from variation tracking
{filterChipData.map(chip => (
  <FilterChipDropdown
    key={chip.factor}
    factor={chip.factor}
    values={chip.values}
    contributionPct={chip.contributionPct}
    availableValues={chip.availableValues}
    onValuesChange={(newValues) => updateFilterValues(chip.factor, newValues)}
    onRemove={() => removeFilter(chip.factor)}
  />
))}
```

---

## Platform Support

| Platform | Implementation          |
| -------- | ----------------------- |
| PWA      | React Context state     |
| Excel    | Native Excel slicers    |
| Azure    | React Context state     |
| Power BI | Native Power BI slicers |

---

## See Also

- [Drill-Down](drill-down.md)
- [Filter Chips](breadcrumbs.md)
- [Four Pillars](../../01-vision/four-pillars/index.md)
