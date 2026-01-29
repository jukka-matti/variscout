# Filter Chips Navigation

Filter chips provide an intuitive way to see and manage active filters with their contribution to total variation.

---

## UI Design

Filter chips replace the traditional breadcrumb trail with a chips-based interface:

```
┌─────────────────────────────────────────────────────────────────────────┐
│ ACTIVE FILTERS                                                          │
│                                                                         │
│ ┌────────────────────┐  ┌────────────────────┐  ┌──────────────────┐   │
│ │ Shift: Night ▼ 45% │  │ Machine: A, C ▼ 32%│  │ Operator: Kim ▼  │   │
│ └────────────────────┘  └────────────────────┘  └──────────────────┘   │
│                                                                         │
│ CUMULATIVE: 77% of total variation isolated                            │
│ "Focus on this combination to address most of your quality problems"   │
└─────────────────────────────────────────────────────────────────────────┘
```

Each chip shows:

- **Factor name**: The column being filtered
- **Selected values**: Current selection (truncated if multiple)
- **Dropdown arrow**: Click to see all values with contribution %
- **Contribution %**: Combined contribution of selected values to TOTAL variation

---

## Multi-Select Support

Unlike traditional drill-down, filter chips support selecting multiple values within a factor:

| Selection    | Display                      | Contribution        |
| ------------ | ---------------------------- | ------------------- |
| Single value | `Shift: Night ▼ 45%`         | That value's %      |
| Two values   | `Shift: Day, Night ▼ 78%`    | Sum of both values  |
| 3+ values    | `Shift: Day, Night +1 ▼ 89%` | Sum of all selected |

---

## Dropdown Values

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

---

## Contribution % vs Local η²

**Important distinction:**

- **Contribution %** (shown in chips): Percentage of TOTAL variation from original data
- **Local η²** (legacy): Percentage of variation at the current filtered level

Filter chips always show contribution to TOTAL variation, making it easier to understand cumulative impact.

---

## Navigation Actions

| Action                | Result                               |
| --------------------- | ------------------------------------ |
| Click chip dropdown   | Show all values with contribution %  |
| Toggle value checkbox | Add/remove value from selection      |
| Click "Remove Filter" | Remove entire filter for that factor |
| Click "Clear All"     | Reset to unfiltered view             |
| Keyboard: Backspace   | Remove last filter                   |

---

## Component API

```typescript
import { useFilterNavigation, useVariationTracking } from '@variscout/hooks';

const { filterStack, updateFilterValues, removeFilter } = useFilterNavigation(
  { filters, setFilters, columnAliases }
);

const { filterChipData } = useVariationTracking(rawData, filterStack, outcome, factors);

// Render chips
{filterChipData.map(chip => (
  <FilterChip
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

## FilterChipData Interface

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

---

## See Also

- [Drill-Down](drill-down.md)
- [Four Pillars: Drill-Down](../../01-vision/four-pillars/drilldown.md)
