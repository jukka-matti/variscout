# PWA Data Onboarding Flow

> PWA-specific entry experience for loading data into VariScout.
> For the shared analysis journey, see [Core Analysis Journey](../CORE-ANALYSIS-JOURNEY.md).

## Entry Points

The PWA HomeScreen shows different options based on user state.
See [PWA Tier Model](./PWA-TIER-MODEL.md) for full details on the 3-tier system.

### Entry Points by State

#### Web Browser (Demo Mode)

Web visitors can only explore sample data:

```
HomeScreen (Demo)
├── Load sample data (pre-built demos)
│   ├── Featured cards (Coffee, Bottleneck, Journey)
│   └── Collapsible category lists
└── Install CTA → Leads to Trial mode
```

**Key insight:** Upload and manual entry are NOT available in web browser mode.
Users must install the PWA first to work with their own data.

#### Installed PWA (No License)

Installed users without a license can work with data, but it's session-only:

```
HomeScreen (Trial)
├── 1. Upload CSV/Excel file (drag-drop or click)
├── 2. Enter data manually (direct entry)
└── 3. Load sample data (collapsed at bottom)
```

Session warning: "Work disappears when you close. Upgrade to save projects →"

#### Installed PWA (Licensed)

Licensed users have full access:

```
HomeScreen (Full)
├── Recent projects (top 3, if any exist)
│   ├── See all projects
│   └── Import .vrs file
├── 1. Upload CSV/Excel file (drag-drop or click)
├── 2. Enter data manually (direct entry)
└── 3. Load sample data (collapsed at bottom)
```

> **Manual Entry**: For direct data entry without a file, see [Manual Entry Flow](./MANUAL-ENTRY.md).

---

## 1. File Upload Flow

### Supported Formats

| Format | Extension       | Parser         |
| ------ | --------------- | -------------- |
| CSV    | `.csv`          | `parseCSV()`   |
| Excel  | `.xlsx`, `.xls` | `parseExcel()` |

### Performance Limits

| Threshold  | Rows   | Behavior            |
| ---------- | ------ | ------------------- |
| Warning    | 5,000  | Confirmation dialog |
| Hard limit | 50,000 | Upload blocked      |

### Upload → Analysis Flow

```
User uploads file
        ↓
    Parse file (CSV/Excel)
        ↓
    Check row limits
        ├── > 50,000 → Error, block upload
        └── > 5,000 → Warning dialog
        ↓
    Store raw data
        ↓
    Auto-detect columns ←────────────────┐
        ├── Outcome: numeric column       │
        ├── Factors: categorical columns  │
        └── Specs: USL/LSL columns        │
        ↓                                 │
    Validate data quality                 │
        └── Generate DataQualityReport    │
        ↓                                 │
    Check for wide format                 │
        ├── 3+ numeric columns with       │
        │   similar names → wide format   │
        └── Show PerformanceDetectedModal─┘
        ↓
    Open Column Mapping panel
        ↓
    User confirms/adjusts mappings
        ↓
    Dashboard loads with charts
```

### Auto-Detection Keywords

The parser looks for keywords to auto-map columns:

| Keyword Pattern                                 | Maps To  |
| ----------------------------------------------- | -------- |
| `weight`, `fill`, `volume`, `measurement`       | Outcome  |
| `machine`, `line`, `operator`, `shift`, `batch` | Factor   |
| `usl`, `upper`                                  | USL spec |
| `lsl`, `lower`                                  | LSL spec |

### Data Quality Banner

After upload, a validation banner may appear showing:

- **Excluded rows**: Non-numeric outcome values
- **Missing values**: Empty cells in key columns
- **Outliers**: Extreme values flagged

Click the banner to see detailed report.

---

## 2. Wide Format Detection (Performance Mode)

### What Is Wide Format?

Data where each measurement channel is a separate column:

```csv
Sample,Head1,Head2,Head3,Head4
1,10.2,10.1,10.3,10.0
2,10.1,10.2,10.1,10.2
```

### Detection Criteria

- 3+ numeric columns
- Similar naming pattern (e.g., `Head1`, `Head2`, `Head3`)
- Column names suggest parallel measurements

### User Flow

```
Wide format detected
        ↓
    PerformanceDetectedModal appears
        ├── "Enable Performance Mode"
        │       └── Sets measureColumns, opens PerformanceDashboard
        └── "Skip, use standard analysis"
                └── Opens standard Dashboard with first column
```

---

## 3. Pareto File Upload (Separate Defect Data)

### Use Case

When defect/rejection data is in a separate file from measurement data.

### Flow

```
Standard data already loaded
        ↓
    Click "Upload Pareto File" in settings
        ↓
    Select defect data file (CSV/Excel)
        ↓
    Parse Pareto file
        ├── Validate has category + count columns
        └── Store as separateParetoData
        ↓
    Switch paretoMode to 'separate'
        ↓
    Pareto chart shows separate file data
```

### File Requirements

| Column   | Required | Description           |
| -------- | -------- | --------------------- |
| Category | Yes      | Defect type name      |
| Count    | Yes      | Number of occurrences |

---

## 4. Sample Data Loading

### Available Samples

Pre-built datasets for demos and training:

| Sample     | Description                | Use Case              |
| ---------- | -------------------------- | --------------------- |
| Coffee     | Fill weight variation      | Basic capability      |
| Bottleneck | Production line bottleneck | Multi-factor analysis |
| Journey    | Customer journey stages    | Stage comparison      |
| Sachets    | Multi-head fill machine    | Performance Mode      |

### Load Flow

```
Click "Load Sample" on HomeScreen
        ↓
    Sample picker modal
        ↓
    Select sample dataset
        ↓
    Load pre-configured:
        ├── Raw data
        ├── Column mappings
        ├── Specifications
        ├── Grades (if applicable)
        └── Performance mode settings (if applicable)
        ↓
    Dashboard opens with full analysis
```

---

## 5. Project Import (.vrs files)

### What's in a .vrs File

JSON-based project file containing:

```json
{
  "version": "1.0",
  "rawData": [...],
  "config": {
    "outcome": "Weight",
    "factors": ["Machine", "Shift"],
    "specs": { "usl": 10.5, "lsl": 9.5 },
    "grades": [...]
  },
  "filters": {...},
  "performanceMode": false
}
```

### Import Flow

```
Click "Import" or drag .vrs file
        ↓
    Parse JSON
        ↓
    Validate schema version
        ↓
    Restore all state:
        ├── Data
        ├── Column mappings
        ├── Specifications
        ├── Filters (drill state)
        └── Performance mode
        ↓
    Dashboard opens at saved state
```

---

## 6. Column Mapping Panel

After data loads, the Column Mapping panel allows adjustments:

### Layout

```
┌─────────────────────────────────┐
│ Column Mapping                   │
├─────────────────────────────────┤
│ Outcome:  [Weight ▼]            │
│                                  │
│ Factors:                         │
│   ☑ Machine                      │
│   ☑ Shift                        │
│   ☐ Operator                     │
│                                  │
│ [Data Quality: 2 rows excluded]  │
│                                  │
│ Specifications:                  │
│   USL: [10.5]                    │
│   LSL: [9.5]                     │
│                                  │
│ [Apply]  [Reset]                 │
└─────────────────────────────────┘
```

### Constraints

- **Outcome**: Must be numeric column
- **Factors**: Max 3 categorical columns
- **Specs**: Optional, enables capability analysis

---

## State Flow Summary

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  HomeScreen  │────→│  Data Load   │────→│   Column     │
│              │     │  (parsing)   │     │   Mapping    │
└──────────────┘     └──────────────┘     └──────────────┘
                            │                     │
                            ↓                     ↓
                     ┌──────────────┐     ┌──────────────┐
                     │ Wide Format  │     │  Dashboard   │
                     │   Modal      │────→│  (analysis)  │
                     └──────────────┘     └──────────────┘
```

---

## Related Documentation

- [Manual Entry Flow](./MANUAL-ENTRY.md) - Direct data entry without files
- [Core Analysis Journey](../CORE-ANALYSIS-JOURNEY.md) - Shared analysis experience
- [Platform Adaptations](../PLATFORM-ADAPTATIONS.md) - How PWA differs from other apps
- [FLOW-FIRST-USE.md](../../products/website/flows/FLOW-FIRST-USE.md) - First use experience design
