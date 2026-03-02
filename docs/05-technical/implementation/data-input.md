# Data Input System

Technical documentation for data parsing, validation, and auto-mapping in VariScout Lite.

## File Locations

| File                                                   | Purpose                                                                                                    |
| ------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------- |
| `packages/core/src/parser/`                            | **Shared** parsing, validation, and detection logic (csv, excel, detection, validation, pareto submodules) |
| `packages/hooks/src/useDataIngestion.ts`               | **Shared** file upload handlers                                                                            |
| `packages/ui/src/components/ColumnMapping/`            | **Shared** column selection UI                                                                             |
| `packages/ui/src/components/DataQualityBanner/`        | **Shared** validation summary component                                                                    |
| `packages/ui/src/components/MeasureColumnSelector/`    | **Shared** measure column selector                                                                         |
| `packages/ui/src/components/PerformanceDetectedModal/` | **Shared** wide-format detection modal                                                                     |
| `apps/pwa/src/hooks/useDataIngestion.ts`               | PWA wrapper (adds loadSample)                                                                              |
| `packages/ui/src/components/DataTable/`                | **Shared** inline editing table with multi-cell paste, arrow-key navigation                                |
| `apps/pwa/src/components/data/DataTableModal.tsx`      | Data view with multi-cell paste and excluded row support                                                   |
| `apps/pwa/src/context/DataContext.tsx`                 | State management for data and validation                                                                   |

**Cross-platform availability**: All parser functions are in `@variscout/core` and can be used by:

- PWA (apps/pwa)
- Azure/Teams app (apps/azure)

---

## Smart Auto-Mapping

### Keyword Detection

Column type detection uses keyword matching for intelligent suggestions. When a column name contains these keywords, it's prioritized for that role.

**Outcome Keywords** (numeric columns):

```
time, duration, cycle, lead, ct
weight, length, width, height, thickness
temperature, temp, pressure
value, measurement, result, y, response
yield, output, reading
```

**Factor Keywords** (categorical columns):

```
shift, operator, machine, line, cell
product, batch, supplier, day, week
station, tool, lot, group, team
```

**Time Keywords** (date/time columns):

```
date, time, timestamp, datetime, created, recorded
```

### Detection Algorithm

The `detectColumns()` function in `parser/detection.ts` follows this logic:

1. **Analyze each column**:
   - Sample multiple rows (not just first) to determine type
   - Check if >90% of values are numeric → `numeric` type
   - Check for date patterns → `date` type
   - Otherwise → `categorical` type

2. **Select Outcome (Y)**:
   - First priority: Numeric column with keyword match
   - Fallback: First numeric column with variation

3. **Select Factors (X)**:
   - Priority: Categorical columns with keyword matches
   - Fallback: First 3 categorical columns
   - Maximum: 3 factors

4. **Select Time Column**:
   - Priority: Column matching time keywords
   - Used for I-Chart ordering when available
   - When detected, triggers the **Time Factor Extraction** panel in ColumnMapping

### Time Factor Extraction

When `detectColumns()` finds a `timeColumn`, the `TimeExtractionPanel` (from `@variscout/ui`) appears in the ColumnMapping screen. On mapping confirm, `augmentWithTimeColumns()` from `@variscout/core/time.ts` adds derived factor columns:

```typescript
import { augmentWithTimeColumns } from '@variscout/core';

const augmented = augmentWithTimeColumns(rawData, 'Date', {
  extractYear: true,
  extractMonth: true,
  extractWeek: false,
  extractDayOfWeek: true,
  extractHour: false,
});
// Adds: Date_Year, Date_Month, Date_DayOfWeek columns
```

The `applyTimeExtraction()` method in `useDataIngestion` (from `@variscout/hooks`) handles the full pipeline: augmenting data, adding new factor columns, and re-validating.

### Return Type

```typescript
interface DetectedColumns {
  outcome: string | null;
  factors: string[];
  timeColumn: string | null;
}
```

---

## Data Validation

### Validation Rules

Rows are excluded from analysis when the outcome column has:

| Issue       | Description                      | Example              |
| ----------- | -------------------------------- | -------------------- |
| Missing     | null, undefined, or empty string | `""`, `null`         |
| Non-numeric | Cannot be parsed as a number     | `"N/A"`, `"pending"` |

Validation is **informational only** - users can inspect excluded rows but analysis proceeds with valid data.

### DataQualityReport Interface

```typescript
interface DataQualityReport {
  totalRows: number;
  validRows: number;
  excludedRows: ExcludedRow[];
  columnIssues: ColumnIssue[];
}

interface ExcludedRow {
  index: number; // Original row index (0-based)
  reasons: ExclusionReason[];
}

interface ExclusionReason {
  type: 'missing' | 'non_numeric' | 'empty';
  column: string;
  value?: string; // The problematic value
}

interface ColumnIssue {
  column: string;
  type: 'missing' | 'non_numeric' | 'no_variation' | 'all_empty';
  count: number;
  severity: 'warning' | 'info';
}
```

### Validation Flow

```
File Upload
    │
    ▼
parseCSV() / parseExcel()
    │
    ▼
detectColumns() → suggest outcome/factors
    │
    ▼
validateData(data, outcome) → DataQualityReport
    │
    ▼
Store in DataContext.dataQualityReport
    │
    ▼
Show DataQualityBanner (from @variscout/ui)
    │
    ├─► "View Excluded Rows" → DataTableModal (filtered)
    │
    └─► "Start Analysis" → Dashboard with valid rows
```

### User Interface

**DataQualityBanner** displays:

- Total rows and valid rows count
- Excluded row count with breakdown by issue type
- "View Excluded Rows" button opens DataTableModal

**DataTableModal** excluded row features:

- "Show Excluded Only" toggle button
- Amber background highlighting for excluded rows
- AlertTriangle icon with tooltip showing exclusion reasons

---

## Wide-Format (Multi-Measure) Data Detection

VariScout can automatically detect wide-format data with multiple measurement channels (e.g., fill heads, valves, nozzles) and prompt users to enable Performance Mode.

### Detection Mechanism

The `detectWideFormat()` function in `parser/detection.ts` analyzes data to identify multi-channel structures:

1. **Find numeric columns** - Identify columns with >90% numeric values
2. **Exclude metadata** - Skip known metadata patterns (date, batch, operator, etc.)
3. **Match channel patterns** - Check if column names follow channel naming conventions
4. **Assess data consistency** - Check if ranges are similar across potential channels

### Channel Naming Patterns

Columns matching these patterns are recognized as measurement channels:

```
V1, V2, V3...            # V + number
Valve_1, Valve-1         # Valve prefix
Head_1, Head1            # Head prefix
Channel_1, Ch1           # Channel prefix
Nozzle_01, Nozzle-1      # Nozzle prefix
Cavity_1, Die_1          # Injection molding
Station_1, Cell_1        # Manufacturing
1, 2, 3...               # Plain numbers
```

### Confidence Levels

| Confidence | Criteria                                       |
| ---------- | ---------------------------------------------- |
| `high`     | ≥50% of numeric columns match channel patterns |
| `medium`   | ≥5 numeric columns with consistent data ranges |
| `low`      | Meets minimum (3) but no clear channel pattern |

### Detection Options

```typescript
interface DetectWideFormatOptions {
  minChannels?: number; // Minimum channels required (default: 3)
  patternMatchThreshold?: number; // Pattern match ratio for high confidence (default: 0.5)
  numericThreshold?: number; // Required numeric ratio (default: 0.9)
}
```

### Return Type

```typescript
interface WideFormatDetection {
  isWideFormat: boolean; // True if wide format detected with sufficient confidence
  channels: ChannelInfo[]; // Detected channel columns with preview stats
  metadataColumns: string[]; // Non-channel columns (date, batch, etc.)
  confidence: 'high' | 'medium' | 'low';
  reason: string; // Explanation of detection result
}

interface ChannelInfo {
  id: string; // Column name
  label: string; // Display name
  n: number; // Valid value count
  preview: { min: number; max: number; mean: number };
  matchedPattern: boolean; // True if name matches channel pattern
}
```

### Integration with useDataIngestion

The `useDataIngestion` hook from `@variscout/hooks` triggers wide-format detection after file upload:

```typescript
import { useDataIngestion } from '@variscout/hooks';

const { handleFileUpload } = useDataIngestion({
  onWideFormatDetected: (detection: WideFormatDetection) => {
    // Show PerformanceDetectedModal to user
    setShowPerformanceModal(true);
    setPendingDetection(detection);
  },
});
```

The callback fires when:

- Detection confidence is `high` or `medium`
- At least 3 channel columns are found
- User hasn't dismissed the prompt before

### User Flow

```
File Upload
    │
    ▼
detectWideFormat(data)
    │
    ├─► confidence: high/medium
    │       │
    │       ▼
    │   PerformanceDetectedModal
    │       │
    │       ├─► "Enable" → Performance Mode
    │       │       • setPerformanceMode(true)
    │       │       • setMeasureColumns(channels)
    │       │       • setMeasureLabel(label)
    │       │
    │       └─► "Not Now" → Standard Mode
    │
    └─► confidence: low → Continue to ColumnMapping
```

### Components

| Component                  | Package         | Purpose                                        |
| -------------------------- | --------------- | ---------------------------------------------- |
| `PerformanceDetectedModal` | `@variscout/ui` | Auto-detection prompt after file upload        |
| `PerformanceSetupPanel`    | App-specific    | Manual configuration (inline or modal)         |
| `MeasureColumnSelector`    | `@variscout/ui` | Checkbox list with preview stats for selection |
| `ColumnMapping`            | `@variscout/ui` | Column selection and validation UI             |
| `DataQualityBanner`        | `@variscout/ui` | Validation summary with excluded row info      |

### Performance Mode Features

#### Cp/Cpk Metric Toggle

The Performance I-Chart displays capability metrics with a toggle to switch between:

- **Cpk** (default) - Process capability index accounting for centering
- **Cp** - Potential capability (spread only, ignores centering)

Toggle location: Top-right of the I-Chart header in Performance Mode.
Tooltip always shows both Cp and Cpk values regardless of selected metric.

```typescript
// In PerformanceDashboard.tsx
const [capabilityMetric, setCapabilityMetric] = useState<'cp' | 'cpk'>('cpk');

// Passed to chart component
<PerformanceIChart capabilityMetric={capabilityMetric} ... />
```

#### Drill-Down to Standard I-Chart

When a measure is selected in Performance Mode, users can drill down to the standard I-Chart for detailed analysis:

1. Click any channel point in the Performance I-Chart to select it
2. "View in I-Chart →" button appears in the chart header
3. Click to navigate to standard dashboard with that measure as the outcome variable
4. "Back to Performance" banner shows at the top for return navigation

**Navigation Flow:**

```
Performance Mode → Click channel → "View in I-Chart" button
                                         │
                                         ▼
                          Standard Dashboard (measure as outcome)
                                         │
                                         ├─► "Back to Performance" → Performance Mode
                                         │
                                         └─► Continue with standard analysis
```

**State Management (App.tsx):**

```typescript
// Track drill navigation origin
const [drillFromPerformance, setDrillFromPerformance] = useState<string | null>(null);

// Drill to measure
const handleDrillToMeasure = useCallback(
  (measureId: string) => {
    setDrillFromPerformance(measureId);
    setOutcome(measureId);
    setActiveView('dashboard');
  },
  [setOutcome]
);

// Return to Performance
const handleBackToPerformance = useCallback(() => {
  setDrillFromPerformance(null);
  setActiveView('performance');
}, []);
```

**Dashboard Props:**

| Prop                   | Type                          | Purpose                            |
| ---------------------- | ----------------------------- | ---------------------------------- |
| `drillFromPerformance` | `string \| null`              | Measure ID if drilled from Perf    |
| `onBackToPerformance`  | `() => void`                  | Callback to return to Perf Mode    |
| `onDrillToMeasure`     | `(measureId: string) => void` | Callback to drill to standard view |

---

## Pareto Data Sources

### Derived Mode (Default)

- Counts computed from selected factors via `d3.rollup()`
- Linked to main data filters (updates when filters change)
- Uses `factors[1] || factors[0]` by default

```typescript
// In ParetoChart.tsx
const counts = d3.rollup(
  filteredData,
  v => v.length,
  d => d[factor]
);
```

### Separate Mode

For pre-aggregated count data (e.g., from ERP/MES systems):

- Upload separate CSV/Excel file in ColumnMapping
- Auto-detects category (first string) and count (first numeric) columns
- **NOT linked to main data filters**
- Shows info banner: "Using separate Pareto file (not linked to filters)"

### ParetoRow Interface

```typescript
interface ParetoRow {
  category: string;
  count: number;
}
```

### State in DataContext

```typescript
// Mode selection
paretoMode: 'derived' | 'separate';

// Separate Pareto data
separateParetoData: ParetoRow[] | null;
separateParetoFilename: string | null;

// Setters
setParetoMode: (mode: 'derived' | 'separate') => void;
setSeparateParetoData: (data: ParetoRow[] | null) => void;
setSeparateParetoFilename: (name: string | null) => void;
```

### Separate Pareto File Format

CSV or Excel with at least two columns:

```csv
Category,Count
Machine A,45
Machine B,32
Machine C,18
```

The parser auto-detects:

- **Category column**: First string/text column
- **Count column**: First numeric column

---

## Performance Limits

| Threshold                     | PWA Behavior                          | Azure Behavior                        |
| ----------------------------- | ------------------------------------- | ------------------------------------- |
| Below warning (5K / 10K)      | Loads immediately                     | Loads immediately                     |
| Warning to hard limit         | Warning prompt (may slow performance) | Warning prompt (may slow performance) |
| Above hard limit (50K / 100K) | Rejected with error message           | Rejected with error message           |

Defaults in `packages/hooks/src/useDataIngestion.ts`, configurable via `DataIngestionConfig`:

```typescript
const DEFAULT_ROW_WARNING_THRESHOLD = 5000;
const DEFAULT_ROW_HARD_LIMIT = 50000;

// Azure wrapper overrides:
{ rowHardLimit: 100_000, rowWarningThreshold: 10_000 }
```

---

## Supported File Formats

### CSV

- Parsed with PapaParse
- UTF-8 encoding recommended
- First row = headers
- Comma delimiter

### Excel (.xlsx, .xls)

- Parsed with SheetJS (xlsx library)
- First sheet only
- First row = headers
- Numeric columns should be formatted as numbers

---

## Key Functions

### parser/ (from @variscout/core)

| Function                      | Purpose                                         |
| ----------------------------- | ----------------------------------------------- |
| `parseCSV(file)`              | Parse CSV file to array of objects              |
| `parseExcel(file)`            | Parse Excel file to array of objects            |
| `detectColumns(data)`         | Auto-detect column roles with keyword matching  |
| `validateData(data, outcome)` | Validate rows and return quality report         |
| `parseParetoFile(file)`       | Parse separate Pareto file to ParetoRow[]       |
| `detectWideFormat(data)`      | Auto-detect multi-channel wide format data      |
| `detectChannelColumns(data)`  | Find numeric columns that appear to be channels |

### useDataIngestion (from @variscout/hooks)

| Function                           | Purpose                                       |
| ---------------------------------- | --------------------------------------------- |
| `handleFileUpload(e)`              | Main file upload handler                      |
| `handleParetoFileUpload(file)`     | Separate Pareto file handler                  |
| `clearParetoFile()`                | Reset to derived Pareto mode                  |
| `clearData()`                      | Reset all data state                          |
| `applyTimeExtraction(col, config)` | Augment data with time-derived factor columns |
| `onWideFormatDetected`             | Callback when wide format data is detected    |
| `onTimeColumnDetected`             | Callback when a date/time column is detected  |

Note: `loadSample()` is added by the PWA-specific wrapper in `apps/pwa/src/hooks/useDataIngestion.ts`.
