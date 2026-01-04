# Hooks Reference

This document describes the custom React hooks and context used in VariScout Lite.

## Table of Contents

- [useData (DataContext)](#usedata-datacontext)
- [useDataIngestion](#usedataingestion)
- [useChartScale](#usechartscale)
- [useDrillDown](#usedrilldown)

---

## useData (DataContext)

The primary state management hook providing access to all application state.

**Location:** `src/context/DataContext.tsx`

### Usage

```typescript
import { useData } from '../context/DataContext';

const MyComponent = () => {
  const { rawData, filteredData, outcome, setOutcome } = useData();
  // ...
};
```

### State Values

| Property             | Type                                     | Description                               |
| -------------------- | ---------------------------------------- | ----------------------------------------- |
| `rawData`            | `any[]`                                  | Complete dataset as imported              |
| `filteredData`       | `any[]`                                  | Data after applying all filters (derived) |
| `outcome`            | `string \| null`                         | Selected numeric column for Y-axis        |
| `factors`            | `string[]`                               | Selected categorical columns (max 3)      |
| `timeColumn`         | `string \| null`                         | Column used for time-series ordering      |
| `specs`              | `{ usl?, lsl?, target? }`                | Specification limits                      |
| `grades`             | `{ max, label, color }[]`                | Multi-tier grade definitions              |
| `stats`              | `StatsResult \| null`                    | Calculated statistics (derived)           |
| `filters`            | `Record<string, any[]>`                  | Active filter selections                  |
| `axisSettings`       | `{ min?, max? }`                         | Manual Y-axis range overrides             |
| `columnAliases`      | `Record<string, string>`                 | Display names for columns                 |
| `valueLabels`        | `Record<string, Record<string, string>>` | Display names for category values         |
| `displayOptions`     | `{ showCp, showCpk, showSpecs }`         | Visibility toggles                        |
| `currentProjectId`   | `string \| null`                         | ID if loaded from saved project           |
| `currentProjectName` | `string \| null`                         | Name of current project                   |
| `hasUnsavedChanges`  | `boolean`                                | True if changes since last save           |

### Setter Functions

| Function            | Parameters                        | Description              |
| ------------------- | --------------------------------- | ------------------------ |
| `setRawData`        | `data: any[]`                     | Replace entire dataset   |
| `setOutcome`        | `col: string`                     | Set outcome column       |
| `setFactors`        | `cols: string[]`                  | Set factor columns       |
| `setSpecs`          | `specs: { usl?, lsl?, target? }`  | Set specification limits |
| `setGrades`         | `grades: { max, label, color }[]` | Set grade tiers          |
| `setFilters`        | `filters: Record<string, any[]>`  | Set active filters       |
| `setAxisSettings`   | `settings: { min?, max? }`        | Set Y-axis range         |
| `setColumnAliases`  | `aliases: Record<string, string>` | Set column display names |
| `setValueLabels`    | `labels: Record<...>`             | Set value display names  |
| `setDisplayOptions` | `options: DisplayOptions`         | Set visibility toggles   |

### Persistence Methods

| Method                    | Returns                   | Description             |
| ------------------------- | ------------------------- | ----------------------- |
| `saveProject(name)`       | `Promise<SavedProject>`   | Save to IndexedDB       |
| `loadProject(id)`         | `Promise<void>`           | Load from IndexedDB     |
| `listProjects()`          | `Promise<SavedProject[]>` | List all saved projects |
| `deleteProject(id)`       | `Promise<void>`           | Delete from IndexedDB   |
| `renameProject(id, name)` | `Promise<void>`           | Rename saved project    |
| `exportProject(filename)` | `void`                    | Download as .vrs file   |
| `importProject(file)`     | `Promise<void>`           | Load from .vrs file     |
| `newProject()`            | `void`                    | Clear all state         |

### Example: Loading Data and Setting Specs

```typescript
const { setRawData, setOutcome, setFactors, setSpecs } = useData();

// After parsing CSV
setRawData(parsedData);
setOutcome('Weight');
setFactors(['Supplier', 'Shift']);
setSpecs({ usl: 350, lsl: 300, target: 325 });
```

### Example: Using Filters

```typescript
const { filters, setFilters, filteredData } = useData();

// Filter to only "Supplier A"
setFilters({ Supplier: ['Supplier A'] });

// filteredData now only contains rows where Supplier === 'Supplier A'
console.log(filteredData.length);

// Clear filters
setFilters({});
```

---

## useDataIngestion

Handles file upload, sample data loading, and data clearing.

**Location:** `src/hooks/useDataIngestion.ts`

### Usage

```typescript
import { useDataIngestion } from '../hooks/useDataIngestion';

const UploadArea = () => {
  const { handleFileUpload, loadSample, clearData } = useDataIngestion();

  return (
    <input type="file" onChange={handleFileUpload} accept=".csv,.xlsx" />
  );
};
```

### Methods

#### `handleFileUpload(event)`

Parses uploaded CSV or Excel file and loads data into context.

**Parameters:**

- `event`: `React.ChangeEvent<HTMLInputElement>` - File input change event

**Returns:** `Promise<boolean>` - True if successful

**Behavior:**

- Detects file type from extension (.csv or .xlsx)
- Enforces row limits:
  - Warning at 5,000 rows (user can cancel)
  - Hard limit at 50,000 rows (rejected)
- Auto-detects outcome and factor columns
- Shows error alert on parse failure

**Example:**

```typescript
const { handleFileUpload } = useDataIngestion();

const onFileChange = async e => {
  const success = await handleFileUpload(e);
  if (success) {
    console.log('Data loaded successfully');
  }
};
```

#### `loadSample(sample)`

Loads a predefined sample dataset with pre-configured settings.

**Parameters:**

- `sample`: `SampleDataset` - Sample dataset object with data and config

**Example:**

```typescript
import { coffeeDefects } from '../data/sampleData';
const { loadSample } = useDataIngestion();

loadSample(coffeeDefects);
```

#### `clearData()`

Resets all data and configuration to initial state.

**Example:**

```typescript
const { clearData } = useDataIngestion();

const handleNewProject = () => {
  clearData();
};
```

---

## useChartScale

Calculates Y-axis range for charts based on data, specs, and manual overrides.

**Location:** `src/hooks/useChartScale.ts`

### Usage

```typescript
import { useChartScale } from '../hooks/useChartScale';

const Chart = () => {
  const { min, max } = useChartScale();

  const yScale = scaleLinear().domain([min, max]).range([height, 0]);
};
```

### Returns

```typescript
{ min: number, max: number }
```

### Calculation Logic

1. **Manual override**: If both `axisSettings.min` and `axisSettings.max` are set, use them
2. **Auto-calculate** from:
   - All values in `filteredData[outcome]`
   - Specification limits (USL, LSL) if defined
   - Grade thresholds if grades are defined (capped at reasonable values)
3. **Add padding**: 10% of range on each side
4. **Apply partial overrides**: If only min or max is manually set, use it

### Example: Manual Axis Control

```typescript
const { axisSettings, setAxisSettings } = useData();

// Set fixed range
setAxisSettings({ min: 0, max: 100 });

// Reset to auto
setAxisSettings({});

// Set only minimum (max auto-calculated)
setAxisSettings({ min: 0 });
```

---

## useDrillDown

Manages drill-down navigation state with breadcrumb trail and filter synchronization.

**Location:** `src/hooks/useDrillDown.ts`

### Usage

```typescript
import { useDrillDown } from '../hooks/useDrillDown';

const Dashboard = () => {
  const { drillStack, breadcrumbs, drillDown, drillUp, drillTo, clearDrill, hasDrills } =
    useDrillDown();

  const handleBoxplotClick = (factor: string, value: string) => {
    drillDown({
      type: 'filter',
      source: 'boxplot',
      factor,
      values: [value],
    });
  };
};
```

### Returns

| Property           | Type                     | Description                       |
| ------------------ | ------------------------ | --------------------------------- |
| `drillStack`       | `DrillAction[]`          | Current drill history stack       |
| `breadcrumbs`      | `BreadcrumbItem[]`       | Formatted items for breadcrumb UI |
| `hasDrills`        | `boolean`                | True if any drills are active     |
| `currentHighlight` | `HighlightState \| null` | I-Chart highlight (if any)        |

### Methods

| Method           | Parameters                | Description                         |
| ---------------- | ------------------------- | ----------------------------------- |
| `drillDown`      | `params: DrillDownParams` | Add new drill action to stack       |
| `drillUp`        | -                         | Remove last drill action            |
| `drillTo`        | `id: string`              | Navigate to specific point in stack |
| `clearDrill`     | -                         | Clear all drills (back to root)     |
| `setHighlight`   | `state: HighlightState`   | Set I-Chart highlight               |
| `clearHighlight` | -                         | Clear I-Chart highlight             |

### Types

```typescript
interface DrillDownParams {
  type: 'filter' | 'highlight';
  source: 'ichart' | 'boxplot' | 'pareto' | 'histogram';
  factor?: string; // For filter drills
  values: (string | number)[];
  rowIndex?: number; // For highlight drills
}

interface DrillAction {
  id: string; // Unique identifier
  type: DrillType;
  source: DrillSource;
  factor?: string;
  values: (string | number)[];
  rowIndex?: number;
  timestamp: number;
  label: string; // Display label
}

interface BreadcrumbItem {
  id: string; // 'root' or factor name
  label: string; // Display text
  isActive: boolean; // Is current position?
  source: DrillSource;
}

interface HighlightState {
  source: DrillSource;
  rowIndex: number;
  timestamp: number;
}
```

### Example: Boxplot Drill-Down

```typescript
const { drillDown } = useDrillDown();

// When user clicks a boxplot category
const handleBoxClick = (category: string) => {
  drillDown({
    type: 'filter',
    source: 'boxplot',
    factor: 'Machine',
    values: [category],
  });
};
```

### Example: Navigate Breadcrumb

```typescript
const { breadcrumbs, drillTo, clearDrill } = useDrillDown();

// Breadcrumb navigation
const handleBreadcrumbClick = (id: string) => {
  if (id === 'root') {
    clearDrill();
  } else {
    drillTo(id);
  }
};
```

### Filter Synchronization

The hook automatically syncs with `DataContext.filters`:

```typescript
// Internal behavior (simplified)
const drillDown = params => {
  const action = createDrillAction(params);
  setDrillStack(prev => [...prev, action]);

  // Sync to context filters
  const newFilters = drillStackToFilters([...drillStack, action]);
  setFilters(newFilters);
};
```

### Chart-Specific Behavior

| Chart   | Drill Type  | Effect                                   |
| ------- | ----------- | ---------------------------------------- |
| I-Chart | `highlight` | Sets `currentHighlight`, no filter       |
| Boxplot | `filter`    | Adds factor filter, updates breadcrumb   |
| Pareto  | `filter`    | Adds category filter, updates breadcrumb |

---

## Constants

### Data Limits

Defined in `useDataIngestion.ts`:

| Constant                | Value  | Purpose                  |
| ----------------------- | ------ | ------------------------ |
| `ROW_WARNING_THRESHOLD` | 5,000  | Show performance warning |
| `ROW_HARD_LIMIT`        | 50,000 | Reject file              |

---

## Best Practices

### 1. Destructure Only What You Need

```typescript
// Good - only re-renders when these specific values change
const { outcome, setOutcome } = useData();

// Avoid - re-renders on any context change
const context = useData();
```

### 2. Memoize Derived Values

```typescript
const { filteredData, outcome } = useData();

// Good - cached calculation
const values = useMemo(() => filteredData.map(d => d[outcome]), [filteredData, outcome]);
```

### 3. Batch State Updates

```typescript
// These will batch automatically in React 18+
setOutcome('Weight');
setFactors(['Supplier']);
setSpecs({ usl: 100 });
```

---

## Type Definitions

Key types used across hooks:

```typescript
interface StatsResult {
  mean: number;
  stdDev: number;
  ucl: number;
  lcl: number;
  cp?: number;
  cpk?: number;
  outOfSpecPercentage: number;
  gradeCounts?: GradeCount[];
}

interface DisplayOptions {
  showCp: boolean;
  showCpk: boolean;
  showSpecs?: boolean;
}

interface SavedProject {
  id: string;
  name: string;
  state: AnalysisState;
  savedAt: string;
  rowCount: number;
}
```

See `src/lib/persistence.ts` for complete type definitions.
