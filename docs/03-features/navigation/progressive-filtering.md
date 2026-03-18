---
title: Progressive Filtering
audience: [analyst, engineer]
category: navigation
status: stable
related: [filter-chips, progressive-stratification, variation-tracking, chart-interaction]
---

# Progressive Filtering

VariScout's navigation system connects drill-down analysis, linked filtering, and filter chips into one cohesive workflow for isolating variation sources.

---

## 1. Drill-Down: Progressive Stratification

Start with all data, then progressively filter to find where variation concentrates. Filter chips show contribution to TOTAL variation:

```
┌────────────────────┐  ┌────────────────────┐  ┌────────────────────┐
│ Shift: Night ▼ 67% │  │ Machine: C ▼ 24%   │  │ Operator: Kim ▼ 9% │
└────────────────────┘  └────────────────────┘  └────────────────────┘
```

Each chip shows how much of the TOTAL variation that filter captures.

### Decision Thresholds

| Variation % | Action                                   |
| ----------- | ---------------------------------------- |
| **>50%**    | Auto-drill — this is the primary driver  |
| **>80%**    | Strong focus — highly concentrated issue |
| **30-50%**  | Recommend investigating, ask user        |
| **<30%**    | Multiple factors — check interactions    |

### When to Check for Interactions

The drill-down methodology captures **main effects** — how much variation each factor explains independently. But factors can also **interact**:

> "Machine C is only problematic on Night shift"

**Note:** Interaction detection is planned for a future phase (see [ADR-014](../../07-decisions/adr-014-regression-deferral.md)). Currently, the drill-down captures main effects only.

| Scenario                     | Recommendation                                                    |
| ---------------------------- | ----------------------------------------------------------------- |
| **<30% variation explained** | Check for interactions — combined effect may be stronger          |
| **Factors seem related**     | Machine type + Operator experience often interact                 |
| **Action seems ambiguous**   | "Fix Machine C" vs "Change Night process" — interaction clarifies |

| Method                        | What it captures                    |
| ----------------------------- | ----------------------------------- |
| Sequential ANOVA (drill-down) | Main effects only (η² per factor)   |
| GLM with interactions         | Main effects + two-way interactions |

See [Regression Analysis: Interaction Effects](../../archive/regression.md#interaction-effects) for details (Phase 2, deferred per ADR-014).

### Cumulative Impact

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
│ ┌────────────────────┐  ┌────────────────────┐  ┌──────────────────┐   │
│ │ Shift: Night ▼ 45% │  │ Machine: A, C ▼ 32%│  │ Operator: Kim ▼  │   │
│ └────────────────────┘  └────────────────────┘  └──────────────────┘   │
│                                                                         │
│ CUMULATIVE: 77% of total variation in focus                            │
│ "Focus on this combination to address most of your quality problems"   │
└─────────────────────────────────────────────────────────────────────────┘
```

Each chip shows:

- **Factor name**: The column being filtered
- **Selected values**: Current selection (truncated if multiple)
- **Dropdown arrow**: Click to see all values with contribution %
- **Contribution %**: Combined contribution of selected values to TOTAL variation

### Multi-Select Support

Filter chips support selecting multiple values within a factor:

| Selection    | Display                      | Contribution        |
| ------------ | ---------------------------- | ------------------- |
| Single value | `Shift: Night ▼ 45%`         | That value's %      |
| Two values   | `Shift: Day, Night ▼ 78%`    | Sum of both values  |
| 3+ values    | `Shift: Day, Night +1 ▼ 89%` | Sum of all selected |

### Dropdown Values

Clicking a chip reveals all available values with their individual contributions:

```
┌─────────────────────────┐
│ Shift                   │
├─────────────────────────┤
│ ☑ Night        45%     │
│ ☐ Day          33%     │
│ ☐ Evening      22%     │
├─────────────────────────┤
│ [Remove Filter]         │
└─────────────────────────┘
```

Values are sorted by contribution (highest first) to guide users toward high-impact selections.

### Contribution % vs Local η²

**Important distinction:**

- **Contribution %** (shown in chips): Percentage of TOTAL variation from original data
- **Local η²** (legacy): Percentage of variation at the current filtered level

Filter chips always show contribution to TOTAL variation, making it easier to understand cumulative impact.

### Navigation Actions

| Action                | Result                               |
| --------------------- | ------------------------------------ |
| Click chip dropdown   | Show all values with contribution %  |
| Toggle value checkbox | Add/remove value from selection      |
| Click "Remove Filter" | Remove entire filter for that factor |
| Click "Clear All"     | Reset to unfiltered view             |
| Keyboard: Backspace   | Remove last filter                   |

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

### FilterChipData Interface

```typescript
interface FilterChipData {
  factor: string;
  values: (string | number)[];
  contributionPct: number; // % of TOTAL variation
  availableValues: {
    value: string | number;
    contributionPct: number;
    isSelected: boolean;
  }[];
}
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

## User Interaction Flow

1. **View Boxplot** - See factor comparison with contribution %
2. **Click category** - Filter into that factor value
3. **Filter chip appears** - Shows selected value(s) and contribution %
4. **Click chip dropdown** - Select/deselect additional values
5. **Repeat** - Until actionable condition found
6. **Remove filter** - Click X or use "Remove Filter" in dropdown

---

## See Also

- [Four Lenses: Drill-Down](../../01-vision/four-lenses/drilldown.md)
- [Four Lenses](../../01-vision/four-lenses/index.md)
- [Progressive Stratification](../../01-vision/progressive-stratification.md)
