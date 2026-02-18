# Component Patterns

How VariScout's shared hooks work together to enable drill-down, filtering, and analysis.

---

## Hook Architecture Overview

```mermaid
flowchart TB
    subgraph State["State Layer"]
        DS[useDataState]
    end

    subgraph Navigation["Navigation Layer"]
        FN[useFilterNavigation]
        VT[useVariationTracking]
    end

    subgraph Presentation["Presentation Layer"]
        CS[useChartScale]
        CT[useChartTheme]
        RM[useResponsiveChartMargins]
        KN[useKeyboardNavigation]
    end

    subgraph ChartData["Chart Data Layer"]
        BD[useBoxplotData]
        ID[useIChartData]
    end

    DS --> FN
    DS --> VT
    FN --> VT
    DS --> CS
    DS --> BD
    DS --> ID
```

---

## useDataState

**Central state management for data and specifications.**

### Input

| Parameter     | Type                 | Description                       |
| ------------- | -------------------- | --------------------------------- |
| `persistence` | `PersistenceAdapter` | Platform-specific storage adapter |
| `initialData` | `DataRow[]`          | Optional initial dataset          |

### Output (State)

| Property                 | Type                         | Description                   |
| ------------------------ | ---------------------------- | ----------------------------- |
| `rawData`                | `DataRow[]`                  | Original unfiltered dataset   |
| `filteredData`           | `DataRow[]`                  | Data after filter application |
| `specs`                  | `SpecLimits`                 | Global USL/LSL/target         |
| `measureSpecs`           | `Record<string, SpecLimits>` | Per-measure overrides         |
| `getSpecsForMeasure(id)` | `Function`                   | Get effective specs           |
| `isPerformanceMode`      | `boolean`                    | Multi-measure mode active     |
| `measureColumns`         | `string[]`                   | Selected measure columns      |
| `filters`                | `FilterState`                | Active filter conditions      |

### Output (Actions)

| Action               | Parameters       | Effect                   |
| -------------------- | ---------------- | ------------------------ |
| `setData`            | `DataRow[]`      | Replace dataset          |
| `setSpecs`           | `SpecLimits`     | Update global specs      |
| `setMeasureSpec`     | `id, SpecLimits` | Set per-measure override |
| `setFilters`         | `FilterState`    | Update active filters    |
| `setPerformanceMode` | `boolean`        | Toggle Performance Mode  |
| `reset`              | -                | Clear all state          |

### Usage Example

```tsx
const [state, actions] = useDataState({ persistence: indexedDBAdapter });

// Get specs with per-measure override fallback
const specs = state.getSpecsForMeasure('FillHead_1');

// Update specs for specific measure
actions.setMeasureSpec('FillHead_1', { usl: 105, lsl: 95 });
```

---

## useFilterNavigation

**Manages drill-down navigation with multi-select support.**

### Input

| Parameter        | Type          | Description           |
| ---------------- | ------------- | --------------------- |
| `data`           | `DataRow[]`   | Dataset to filter     |
| `initialFilters` | `FilterState` | Starting filter state |

### Output

| Property           | Type               | Description             |
| ------------------ | ------------------ | ----------------------- |
| `filters`          | `FilterState`      | Current active filters  |
| `breadcrumbs`      | `BreadcrumbItem[]` | Navigation path         |
| `drillPath`        | `DrillLevel[]`     | Complete drill history  |
| `availableFactors` | `string[]`         | Factors not yet drilled |

| Method               | Parameters         | Description              |
| -------------------- | ------------------ | ------------------------ |
| `addFilter`          | `factor, value`    | Add single filter        |
| `updateFilterValues` | `factor, values[]` | Set multi-select values  |
| `removeFilter`       | `factor`           | Remove filter for factor |
| `clearFilters`       | -                  | Reset to unfiltered      |
| `goToLevel`          | `index`            | Navigate breadcrumb      |

### Filter State Shape

```typescript
interface FilterState {
  [factorName: string]: {
    values: string[]; // Selected values (multi-select)
    singleValue?: string; // Legacy single-select
  };
}
```

### Usage Example

```tsx
const { filters, breadcrumbs, addFilter, updateFilterValues, removeFilter } = useFilterNavigation(
  rawData,
  {}
);

// Single filter
addFilter('Shift', 'Night');

// Multi-select filter
updateFilterValues('Machine', ['A', 'B', 'C']);

// Navigate breadcrumb
goToLevel(1); // Go back to first drill level
```

---

## useVariationTracking

**Tracks cumulative variation explained through drill-down path.**

### Input

| Parameter   | Type           | Description         |
| ----------- | -------------- | ------------------- |
| `data`      | `DataRow[]`    | Dataset             |
| `outcome`   | `string`       | Outcome column name |
| `drillPath` | `DrillLevel[]` | Current drill path  |

### Output

| Property               | Type               | Description             |
| ---------------------- | ------------------ | ----------------------- |
| `cumulativeEtaSquared` | `number`           | Total η² explained      |
| `filterChipData`       | `FilterChipData[]` | Per-filter contribution |
| `remainingVariation`   | `number`           | 1 - cumulative η²       |

### FilterChipData Shape

```typescript
interface FilterChipData {
  factor: string; // Factor name
  values: string[]; // Selected values
  etaSquared: number; // This factor's η²
  contribution: number; // Percentage of total
  cumulativeEtaSquared: number; // Running total
}
```

### Usage Example

```tsx
const { cumulativeEtaSquared, filterChipData, remainingVariation } = useVariationTracking(
  filteredData,
  'Weight',
  drillPath
);

// Display in filter chips
filterChipData.map(chip => (
  <FilterChip
    key={chip.factor}
    label={`${chip.factor}: ${chip.values.join(', ')}`}
    contribution={`${(chip.contribution * 100).toFixed(0)}%`}
  />
));
```

---

## useChartScale

**Calculates optimal Y-axis scale for charts.**

### Input

| Parameter | Type          | Description                  |
| --------- | ------------- | ---------------------------- |
| `data`    | `number[]`    | Data values                  |
| `specs`   | `SpecLimits`  | Specification limits         |
| `stats`   | `StatsResult` | Calculated statistics        |
| `padding` | `number`      | Scale padding (default: 0.1) |

### Output

| Property | Type               | Description          |
| -------- | ------------------ | -------------------- |
| `yMin`   | `number`           | Scale minimum        |
| `yMax`   | `number`           | Scale maximum        |
| `domain` | `[number, number]` | D3-compatible domain |

### Scale Logic

```mermaid
flowchart TD
    A[Collect values] --> B[data min/max]
    A --> C[specs: USL/LSL]
    A --> D[stats: UCL/LCL]
    B --> E[Find overall min/max]
    C --> E
    D --> E
    E --> F[Add padding]
    F --> G[yMin, yMax]
```

---

## useChartTheme

**Provides theme-aware colors for charts.**

### Input

None (reads from document `data-theme` attribute).

### Output

| Property    | Type           | Description                     |
| ----------- | -------------- | ------------------------------- |
| `isDark`    | `boolean`      | Dark theme active               |
| `chrome`    | `ChromeColors` | Theme-appropriate chrome colors |
| `fontScale` | `number`       | Font scaling factor             |

### Chrome Colors

| Property         | Dark      | Light     | Use              |
| ---------------- | --------- | --------- | ---------------- |
| `gridLine`       | `#1e293b` | `#f1f5f9` | Chart grid       |
| `axisPrimary`    | `#94a3b8` | `#64748b` | Axis lines       |
| `axisSecondary`  | `#64748b` | `#94a3b8` | Secondary axes   |
| `labelPrimary`   | `#cbd5e1` | `#334155` | Primary labels   |
| `labelSecondary` | `#94a3b8` | `#64748b` | Secondary labels |

### Usage Example

```tsx
const { isDark, chrome } = useChartTheme();

<AxisLeft
  stroke={chrome.axisPrimary}
  tickStroke={chrome.axisSecondary}
  tickLabelProps={{ fill: chrome.labelPrimary }}
/>;
```

---

## useResponsiveChartMargins

**Calculates dynamic margins based on container width.**

### Input

| Parameter     | Type     | Description              |
| ------------- | -------- | ------------------------ |
| `width`       | `number` | Container width          |
| `chartType`   | `string` | Chart type identifier    |
| `extraBottom` | `number` | Additional bottom margin |

### Output

| Property       | Type      | Description                    |
| -------------- | --------- | ------------------------------ |
| `margins`      | `Margins` | `{ top, right, bottom, left }` |
| `tickFontSize` | `number`  | Responsive tick label size     |
| `axisFontSize` | `number`  | Responsive axis label size     |
| `statFontSize` | `number`  | Responsive stat display size   |

### Breakpoints

| Width     | Category | Left Margin |
| --------- | -------- | ----------- |
| <400px    | Mobile   | 40px        |
| 400-600px | Tablet   | 50px        |
| >600px    | Desktop  | 60px        |

---

## useKeyboardNavigation

**Enables keyboard control for chart interactions.**

### Input

| Parameter   | Type             | Description        |
| ----------- | ---------------- | ------------------ |
| `items`     | `any[]`          | Navigable items    |
| `onSelect`  | `(item) => void` | Selection callback |
| `isEnabled` | `boolean`        | Active state       |

### Output

| Property          | Type               | Description    |
| ----------------- | ------------------ | -------------- |
| `focusedIndex`    | `number`           | Current focus  |
| `setFocusedIndex` | `Function`         | Manual focus   |
| `handlers`        | `KeyboardHandlers` | Event handlers |

### Key Bindings

| Key                        | Action         |
| -------------------------- | -------------- |
| `ArrowRight` / `ArrowDown` | Next item      |
| `ArrowLeft` / `ArrowUp`    | Previous item  |
| `Enter` / `Space`          | Select focused |
| `Escape`                   | Clear focus    |
| `Home`                     | First item     |
| `End`                      | Last item      |

---

## Integration Example

**Complete flow from data load to filtered chart:**

```tsx
function Dashboard() {
  // 1. State management
  const [state, actions] = useDataState({ persistence });

  // 2. Filter navigation
  const { filters, breadcrumbs, addFilter } = useFilterNavigation(state.rawData, state.filters);

  // 3. Variation tracking
  const { filterChipData, cumulativeEtaSquared } = useVariationTracking(
    state.filteredData,
    'Weight',
    breadcrumbs.map(b => ({ factor: b.factor, values: b.values }))
  );

  // 4. Chart scale
  const { domain } = useChartScale(
    state.filteredData.map(d => d.Weight),
    state.specs,
    stats
  );

  // 5. Theme
  const { chrome, isDark } = useChartTheme();

  return (
    <>
      <FilterBreadcrumb
        chips={filterChipData}
        onRemove={removeFilter}
        cumulativeEtaSquared={cumulativeEtaSquared}
      />
      <IChart
        data={state.filteredData}
        specs={state.specs}
        yDomain={domain}
        theme={chrome}
        onPointClick={point => addFilter(nextFactor, point[nextFactor])}
      />
    </>
  );
}
```

---

## Shared UI Components

Components extracted to `@variscout/ui` use a **colorScheme prop pattern** for platform-agnostic theming.

### Pattern

```tsx
// Component defines interface and presets
export interface MyComponentColorScheme {
  background: string; // Tailwind class
  text: string;
  border: string;
}

export const defaultColorScheme: MyComponentColorScheme = {
  background: 'bg-surface-secondary', // PWA semantic
  text: 'text-content',
  border: 'border-edge',
};

export const azureColorScheme: MyComponentColorScheme = {
  background: 'bg-slate-800', // Tailwind Slate
  text: 'text-white',
  border: 'border-slate-700',
};
```

### Usage

```tsx
// PWA - uses default (semantic tokens)
<FilterBreadcrumb {...props} />;

// Azure - uses Azure scheme (Slate palette)
import { filterBreadcrumbAzureColorScheme } from '@variscout/ui';
<FilterBreadcrumb {...props} colorScheme={filterBreadcrumbAzureColorScheme} />;
```

### Available Components

| Component                     | Base | Color Schemes               | Context-Free                              |
| ----------------------------- | ---- | --------------------------- | ----------------------------------------- |
| `FilterBreadcrumb`            | ✓    | default, azure              | ✓                                         |
| `FilterChipDropdown`          | ✓    | default, azure              | ✓                                         |
| `FilterContextBar`            | ✓    | default, azure              | ✓                                         |
| `VariationBar`                | ✓    | default, azure              | ✓                                         |
| `AnovaResults`                | ✓    | default, azure              | ✓                                         |
| `YAxisPopover`                | ✓    | default, azure              | ✓                                         |
| `RegressionPanelBase`         | ✓    | default, azure              | Uses render props                         |
| `PerformanceSetupPanelBase`   | ✓    | default, pwa                | Props + optional tierProps                |
| `StatsPanelBase`              | ✓    | default, azure              | Uses `onSaveSpecs` prop for inline inputs |
| `ManualEntryBase`             | ✓    | semantic tokens (no scheme) | `enablePerformanceMode` prop              |
| `ManualEntrySetupBase`        | ✓    | semantic tokens (no scheme) | ✓                                         |
| `SpecsPopover` / `SpecEditor` | ✓    | default, azure              | ✓                                         |
| `CapabilityHistogram`         | ✓    | default, azure              | ✓                                         |
| `ProbabilityPlot`             | ✓    | default, azure              | ✓                                         |
| `BoxplotDisplayToggle`        | ✓    | default, azure              | Popover with checkboxes + sort controls   |
| `ChartAnnotationLayer`        | ✓    | -                           | HTML overlay for draggable text notes     |
| `AnnotationContextMenu`       | ✓    | -                           | Right-click menu (highlight + add note)   |

### Base Components with Render Props

Some components use render props to delegate app-specific rendering:

```tsx
// RegressionPanelBase delegates chart rendering to apps
<RegressionPanelBase
  filteredData={data}
  outcome={outcome}
  specs={specs}
  renderSimpleView={props => <SimpleRegressionView {...props} />}
  renderAdvancedView={props => <AdvancedRegressionView {...props} />}
  colorScheme={regressionPanelAzureColorScheme}
/>
```

See [Colors > Shared Component Color Schemes](../../06-design-system/foundations/colors.md#shared-component-color-schemes) for the complete color mapping.

---

## useAnnotations

**Manages chart annotation state (highlights + text notes) via right-click context menu.**

### Input

| Parameter           | Type                             | Description                                |
| ------------------- | -------------------------------- | ------------------------------------------ |
| `displayOptions`    | `DisplayOptions`                 | Current display options state              |
| `setDisplayOptions` | `(opts: DisplayOptions) => void` | Setter for display options                 |
| `dataFingerprint`   | `string`                         | Changes when data changes (resets offsets) |

### Output

| Property                | Type                                           | Description                         |
| ----------------------- | ---------------------------------------------- | ----------------------------------- |
| `contextMenu`           | `{ isOpen, position, categoryKey, chartType }` | Context menu state                  |
| `handleContextMenu`     | `(chartType, key, event) => void`              | Opens context menu                  |
| `closeContextMenu`      | `() => void`                                   | Closes context menu                 |
| `setHighlight`          | `(chartType, key, color?) => void`             | Sets/clears highlight color         |
| `createAnnotation`      | `(chartType, key) => void`                     | Creates text annotation             |
| `setBoxplotAnnotations` | `(annotations: ChartAnnotation[]) => void`     | Updates boxplot annotations         |
| `setParetoAnnotations`  | `(annotations: ChartAnnotation[]) => void`     | Updates pareto annotations          |
| `clearAnnotations`      | `(chartType) => void`                          | Clears all for chart type           |
| `hasAnnotations`        | `boolean`                                      | Any annotations or highlights exist |

### Usage Example

```tsx
const {
  contextMenu,
  handleContextMenu,
  closeContextMenu,
  setHighlight,
  createAnnotation,
  clearAnnotations,
  hasAnnotations,
} = useAnnotations({ displayOptions, setDisplayOptions, dataFingerprint });

// Wire to chart wrapper
<BoxplotBase onBoxContextMenu={(key, e) => handleContextMenu('boxplot', key, e)} />;

// Render context menu
{
  contextMenu.isOpen && (
    <AnnotationContextMenu
      categoryKey={contextMenu.categoryKey}
      position={contextMenu.position}
      onSetHighlight={color => {
        setHighlight(contextMenu.chartType, contextMenu.categoryKey, color);
        closeContextMenu();
      }}
      onAddNote={() => {
        createAnnotation(contextMenu.chartType, contextMenu.categoryKey);
        closeContextMenu();
      }}
      onClose={closeContextMenu}
    />
  );
}
```

---

## Settings Architecture

Display settings are split into two categories based on scope:

### Global Preferences (SettingsPanel)

Accessible via the Settings gear icon. These apply to all charts and persist across sessions.

| Setting             | Type    | Default | Effect                              |
| ------------------- | ------- | ------- | ----------------------------------- |
| Lock Y-axis to data | boolean | false   | Use full data range for chart scale |
| Show spec limits    | boolean | true    | Display USL/LSL lines on charts     |
| Show Cpk            | boolean | true    | Display Cpk in stats panel          |
| Show filter context | boolean | true    | Display active filters on charts    |
| Chart text size     | preset  | Normal  | Compact / Normal / Large            |

**PWA** has a slim panel (4 display toggles + chart text size). **Azure** adds theme toggle, company accent color, and font scale.

### Contextual Toggles (Chart Card Headers)

Attached directly to individual chart cards. These are chart-specific display options.

| Toggle              | Component              | Location            |
| ------------------- | ---------------------- | ------------------- |
| Violin mode         | `BoxplotDisplayToggle` | Boxplot card header |
| Contribution labels | `BoxplotDisplayToggle` | Boxplot card header |
| Sort order          | `BoxplotDisplayToggle` | Boxplot card header |

`BoxplotDisplayToggle` is a shared popover component from `@variscout/ui` (SlidersHorizontal icon triggering a popover with 2 checkboxes and sort controls). It manages local state that feeds into the Boxplot's `showViolin`, `showContributionLabels`, sort criterion (`boxplotSortBy`), and sort direction (`boxplotSortDirection`) props.

---

## See Also

- [Data Flow](data-flow.md) - How data moves through the system
- [Shared Packages](shared-packages.md) - Package exports
- [Colors > Color Schemes](../../06-design-system/foundations/colors.md#shared-component-color-schemes) - ColorScheme prop pattern
- [Charts Overview](../../06-design-system/charts/overview.md) - Chart components
- [ADR-005: Props-Based Charts](../../07-decisions/adr-005-props-based-charts.md)
