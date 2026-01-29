# @variscout/hooks

Shared React hooks for VariScout applications (PWA, Azure, Excel Add-in).

## Installation

Used as workspace dependency in `package.json`:

```json
{
  "dependencies": {
    "@variscout/hooks": "workspace:*"
  }
}
```

## Design Pattern

All hooks use the **context injection pattern** for portability across apps. Rather than importing a specific context, hooks accept their dependencies as parameters:

```tsx
// In PWA app
const { filters, setFilters, columnAliases } = useData();
const { applyFilter, breadcrumbs } = useFilterNavigation({ filters, setFilters, columnAliases });

// Same hook works in Azure app with different context
const { filters, setFilters, columnAliases } = useData();
const { applyFilter, breadcrumbs } = useFilterNavigation({ filters, setFilters, columnAliases });
```

---

## Hooks Reference

### State Management

#### `useDataState`

Shared state management for DataContext implementations. Reduces ~460 lines of duplication between PWA and Azure apps.

```tsx
const [state, actions] = useDataState({
  persistence: myPersistenceAdapter,
});

// State includes: rawData, filteredData, outcome, factors, specs, etc.
// Actions include: setRawData, setOutcome, saveProject, loadProject, etc.
```

**Returns:** `[DataState, DataActions]`

| State Property      | Type                             | Description                          |
| ------------------- | -------------------------------- | ------------------------------------ |
| `rawData`           | `DataRow[]`                      | Original unfiltered data             |
| `filteredData`      | `DataRow[]`                      | Data after applying filters          |
| `outcome`           | `string \| null`                 | Selected outcome column              |
| `factors`           | `string[]`                       | Selected factor columns              |
| `specs`             | `object`                         | Spec limits (`usl`, `lsl`, `target`) |
| `stats`             | `StatsResult \| null`            | Calculated statistics                |
| `isPerformanceMode` | `boolean`                        | Multi-measure analysis mode          |
| `measureColumns`    | `string[]`                       | Channels for performance mode        |
| `performanceResult` | `ChannelPerformanceData \| null` | Performance analysis results         |

---

### Navigation

#### `useFilterNavigation`

Manages filter navigation with filter chips, multi-select support, toggle behavior, and optional browser history/URL sync.

```tsx
const {
  filterStack,
  applyFilter,
  updateFilterValues,
  removeFilter,
  removeLastFilter,
  navigateTo,
  breadcrumbs,
  clearFilters,
  hasFilters,
} = useFilterNavigation(
  { filters, setFilters, columnAliases },
  { enableHistory: true, enableUrlSync: true }
);

// Filter into a Pareto category (single value)
applyFilter({
  type: 'filter',
  source: 'pareto',
  factor: 'DefectType',
  values: ['Scratch'],
});

// Multi-select: update filter with multiple values
updateFilterValues('Machine', ['A', 'C'], 'boxplot');

// Remove a specific filter by factor name
removeFilter('DefectType');

// Go back one level (remove last filter)
removeLastFilter();

// Navigate to specific breadcrumb
navigateTo('action-id');
```

**Options:**

| Option          | Type      | Default | Description                                |
| --------------- | --------- | ------- | ------------------------------------------ |
| `enableHistory` | `boolean` | `false` | Push/pop browser history on filter changes |
| `enableUrlSync` | `boolean` | `false` | Sync filters to URL parameters             |

**Returns:**

| Property             | Type                                                              | Description                               |
| -------------------- | ----------------------------------------------------------------- | ----------------------------------------- |
| `filterStack`        | `FilterAction[]`                                                  | Current navigation stack                  |
| `breadcrumbs`        | `BreadcrumbItem[]`                                                | UI-ready breadcrumb items                 |
| `currentHighlight`   | `HighlightState \| null`                                          | Currently highlighted I-Chart point       |
| `applyFilter`        | `function`                                                        | Filter into data subset                   |
| `updateFilterValues` | `(factor: string, values: (string \| number)[], source?) => void` | Update/create filter with multiple values |
| `removeFilter`       | `(factor: string) => void`                                        | Remove a specific filter by factor name   |
| `removeLastFilter`   | `function`                                                        | Go back one level                         |
| `navigateTo`         | `function`                                                        | Navigate to specific point                |
| `clearFilters`       | `function`                                                        | Reset all filter state                    |
| `hasFilters`         | `boolean`                                                         | Whether any filters are active            |

---

#### `useChartNavigation`

Carousel-style focus mode navigation between charts with next/prev/exit controls.

```tsx
const {
  focusedChart,
  setFocusedChart,
  handleNextChart,
  handlePrevChart,
  exitFocus,
} = useChartNavigation();

// In focused view:
<button onClick={handlePrevChart}>←</button>
<button onClick={handleNextChart}>→</button>
<button onClick={exitFocus}>Exit</button>
```

**Options:**

| Option         | Type              | Default               | Description           |
| -------------- | ----------------- | --------------------- | --------------------- |
| `initialFocus` | `ChartId \| null` | `null`                | Initial focused chart |
| `chartOrder`   | `readonly T[]`    | `DEFAULT_CHART_ORDER` | Order for navigation  |

**Constants:**

- `DEFAULT_CHART_ORDER`: `['ichart', 'boxplot', 'pareto']`

---

#### `useKeyboardNavigation`

Keyboard handler for focus/presentation modes (arrow keys and escape).

```tsx
useKeyboardNavigation({
  focusedItem: focusedChart,
  onNext: handleNextChart,
  onPrev: handlePrevChart,
  onEscape: exitFocus,
});
```

**Keyboard Mappings:**

| Key          | Action                |
| ------------ | --------------------- |
| `ArrowRight` | Navigate to next item |
| `ArrowLeft`  | Navigate to prev item |
| `Escape`     | Exit focus mode       |

---

### Analytics

#### `useVariationTracking`

Tracks cumulative variation (η²) through drill-down navigation and provides filter chip data for the enhanced breadcrumb UI.

```tsx
const {
  breadcrumbsWithVariation,
  cumulativeVariationPct,
  impactLevel,
  factorVariations,
  categoryContributions,
  filterChipData,
} = useVariationTracking(rawData, filterStack, outcome, factors);

// Use factorVariations to highlight high-impact factors
const machineVariation = factorVariations.get('Machine'); // e.g., 0.67 (67%)

// Use filterChipData for rendering filter chips with contribution %
filterChipData.forEach(chip => {
  console.log(`${chip.factor}: ${chip.contributionPct}% of total variation`);
});
```

**Returns:**

| Property                   | Type                                         | Description                                                  |
| -------------------------- | -------------------------------------------- | ------------------------------------------------------------ |
| `breadcrumbsWithVariation` | `BreadcrumbItem[]`                           | Breadcrumbs with variation percentages                       |
| `cumulativeVariationPct`   | `number \| null`                             | Total % of original variation isolated                       |
| `impactLevel`              | `'high' \| 'moderate' \| 'low' \| null`      | Impact classification                                        |
| `insightText`              | `string \| null`                             | Human-readable insight                                       |
| `factorVariations`         | `Map<string, number>`                        | η² for each factor (for filter suggestions)                  |
| `categoryContributions`    | `Map<string, Map<string \| number, number>>` | Per-category contribution to total variation                 |
| `filterChipData`           | `FilterChipData[]`                           | Data for rendering filter chips with contribution % to TOTAL |

---

#### `FilterChipData` Interface

Data structure for rendering filter chips with multi-select support:

```typescript
interface FilterChipData {
  /** The factor/column name being filtered */
  factor: string;
  /** Currently selected value(s) */
  values: (string | number)[];
  /** Combined contribution % of selected values to TOTAL variation */
  contributionPct: number;
  /** All available values for the dropdown with their individual contributions */
  availableValues: {
    value: string | number;
    contributionPct: number;
    isSelected: boolean;
  }[];
}
```

**Usage with filter chips:**

```tsx
import { useFilterNavigation, useVariationTracking } from '@variscout/hooks';

const { filterStack, updateFilterValues, removeFilter } = useFilterNavigation(context);
const { filterChipData } = useVariationTracking(rawData, filterStack, outcome, factors);

// Render filter chips
{
  filterChipData.map(chip => (
    <FilterChip
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

---

### Data Analysis

#### `useAvailableOutcomes`

Computes available numeric outcome columns from data.

```tsx
const outcomes = useAvailableOutcomes(data);
// Returns: ['Weight', 'Diameter', 'Temperature']
```

**Parameters:**

| Parameter | Type        | Description        |
| --------- | ----------- | ------------------ |
| `data`    | `DataRow[]` | Array of data rows |

**Returns:** `string[]` - Column names containing numeric values

---

#### `useAvailableStageColumns`

Finds categorical columns suitable for grouping (2-10 unique values).

```tsx
const stageColumns = useAvailableStageColumns(data, {
  minUnique: 2,
  maxUnique: 10,
  excludeColumn: outcome,
});
// Returns: ['Operator', 'Machine', 'Shift']
```

**Options:**

| Option          | Type             | Default | Description                       |
| --------------- | ---------------- | ------- | --------------------------------- |
| `minUnique`     | `number`         | `2`     | Minimum unique values             |
| `maxUnique`     | `number`         | `10`    | Maximum unique values             |
| `excludeColumn` | `string \| null` | `null`  | Column to exclude (e.g., outcome) |

**Returns:** `string[]` - Column names suitable for staging

---

### Chart Layout

#### `useChartScale`

Calculates optimal Y-axis scale for charts based on data and specs.

```tsx
const scale = useChartScale({
  filteredData,
  outcome,
  specs,
  grades,
  axisSettings,
});
// Returns: { min: 8.5, max: 11.5 }
```

**Scale Modes:**

| Mode        | Description                              |
| ----------- | ---------------------------------------- |
| `auto`      | Calculate range from data, specs, limits |
| `clampZero` | Start Y-axis at zero, auto-calculate max |
| `manual`    | Use explicit min/max from axisSettings   |

**Returns:** `{ min: number, max: number }`

---

#### `useResponsiveChartMargins`

Calculates dynamic chart margins based on container width.

```tsx
const margins = useResponsiveChartMargins(containerWidth, 'ichart', 20);
// Returns: { top: 20, right: 30, bottom: 50, left: 60 }
```

**Parameters:**

| Parameter               | Type        | Default    | Description                       |
| ----------------------- | ----------- | ---------- | --------------------------------- |
| `containerWidth`        | `number`    | -          | Container width in pixels         |
| `chartType`             | `ChartType` | `'ichart'` | Chart type (affects base margins) |
| `additionalBottomSpace` | `number`    | `0`        | Extra space for source bar/legend |

---

#### `useResponsiveChartFonts`

Returns font sizes for different chart elements based on container width.

```tsx
const fonts = useResponsiveChartFonts(containerWidth);
// Returns: { tick: 10, axis: 11, stat: 12 }
```

---

#### `useResponsiveTickCount`

Calculates optimal tick count for axes.

```tsx
const tickCount = useResponsiveTickCount(availableWidth, 'x');
// Returns: 8
```

---

#### `useResponsiveBreakpoints`

Returns breakpoint flags for responsive behavior.

```tsx
const breakpoints = useResponsiveBreakpoints(containerWidth);
// Returns: { isSmall: false, isMedium: true, isLarge: false }
```

---

### Utilities

#### `useClipboardCopy`

Copy chart elements to clipboard as PNG images.

```tsx
import { toBlob } from 'html-to-image';

const { copyChart, isCopied } = useClipboardCopy({ toBlob });

<button onClick={() => copyChart('ichart-card', 'ichart')}>
  {isCopied('ichart') ? <Check /> : <Copy />}
  Copy
</button>;
```

**Options:**

| Option             | Type       | Default     | Description                            |
| ------------------ | ---------- | ----------- | -------------------------------------- |
| `feedbackDuration` | `number`   | `2000`      | Duration to show success feedback (ms) |
| `backgroundColor`  | `string`   | `'#0f172a'` | Background color for image capture     |
| `toBlob`           | `function` | -           | toBlob function from html-to-image     |

**Returns:**

| Property       | Type             | Description                        |
| -------------- | ---------------- | ---------------------------------- |
| `copyFeedback` | `string \| null` | ID of chart showing feedback       |
| `copyChart`    | `function`       | Copy chart to clipboard            |
| `isCopied`     | `function`       | Check if chart is showing feedback |

---

## Type Exports

The package also exports TypeScript types for context interfaces:

```tsx
import type {
  ChartScaleContext,
  ChartScaleResult,
  FilterNavigationContext,
  VariationTrackingContext,
  DataContextInterface,
  DisplayOptions,
  ChartTitles,
  AnalysisState,
  SavedProject,
  DashboardProps,
  AzureDashboardProps,
  FilterChipData,
  UseFilterNavigationReturn,
  VariationTrackingResult,
} from '@variscout/hooks';
```

---

## Related Documentation

- [Navigation Architecture](../../docs/design-system/NAVIGATION_ARCHITECTURE.md)
- [Charts Package](../charts/README.md)
- [Core Package](../core/README.md)
