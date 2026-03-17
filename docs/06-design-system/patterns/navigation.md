---
title: 'Navigation Patterns'
---

# Navigation Patterns

Navigation patterns used across VariScout applications.

---

## Filter Chips

Filter chips show active filters with contribution % to total variation:

```
┌────────────────────┐  ┌────────────────────┐  ┌────────────────────┐
│ Shift: Night ▼ 67% │  │ Machine: C ▼ 24%   │  │ Operator: Kim ▼ 9% │
└────────────────────┘  └────────────────────┘  └────────────────────┘
```

### Implementation

```tsx
import { useFilterNavigation, useVariationTracking } from '@variscout/hooks';

const { filterStack, updateFilterValues, removeFilter } = useFilterNavigation(context);
const { filterChipData } = useVariationTracking(rawData, filterStack, outcome, factors);

{
  filterChipData.map(chip => (
    <FilterChipDropdown
      key={chip.factor}
      factor={chip.factor}
      values={chip.values}
      contributionPct={chip.contributionPct}
      availableValues={chip.availableValues}
      onValuesChange={newValues => updateFilterValues(chip.factor, newValues)}
      onRemove={() => removeFilter(chip.factor)}
    />
  ));
}
```

### Visual Design

| Element         | Style                                    |
| --------------- | ---------------------------------------- |
| Chip            | Rounded pill with factor name and values |
| Percentage      | Contribution % to TOTAL variation        |
| Dropdown arrow  | Click to reveal all values with %        |
| Selected values | Checkmarks in dropdown                   |
| Remove button   | X icon or "Remove Filter" in dropdown    |

### Multi-Select

Chips support selecting multiple values within a factor:

```
┌────────────────────────┐
│ Machine: A, C ▼ 45%    │
└────────────────────────┘
```

---

## Tab Navigation

For switching between analysis modes.

### PWA

```tsx
<Tabs value={activeTab} onChange={setActiveTab}>
  <Tab value="analysis">Analysis</Tab>
  <Tab value="performance">Performance</Tab>
  <Tab value="data">Data</Tab>
</Tabs>
```

---

## Sidebar Navigation

Desktop layouts use a sidebar for factor selection.

```
FACTORS
─────────────────
○ Shift
● Machine [selected]
○ Operator
○ Product

MEASURES
─────────────────
○ Fill Weight
● Moisture [selected]
○ Defects
```

---

## Mobile Menu

Mobile uses a hamburger menu with drawer:

```tsx
<MobileMenu>
  <MenuItem icon={<BarChart />}>Analysis</MenuItem>
  <MenuItem icon={<Settings />}>Settings</MenuItem>
  <MenuItem icon={<HelpCircle />}>Help</MenuItem>
</MobileMenu>
```

---

## Keyboard Navigation

| Key         | Action                        |
| ----------- | ----------------------------- |
| `←` / `→`   | Navigate between factors      |
| `↑` / `↓`   | Navigate within factor levels |
| `Enter`     | Select/drill into             |
| `Backspace` | Remove last filter            |
| `Escape`    | Exit focus mode               |

---

## See Also

- [Drill-Down Feature](../../03-features/navigation/drill-down.md)
- [Filter Chips](../../03-features/navigation/breadcrumbs.md)
- [Accessibility](../foundations/accessibility.md)
