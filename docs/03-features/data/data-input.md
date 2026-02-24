# Data Input

How VariScout handles data input — paste (PWA and Azure App) and file upload (Azure App).

---

## Supported Formats

| Format | Extension   | Notes                        |
| ------ | ----------- | ---------------------------- |
| CSV    | .csv        | Comma or semicolon delimited |
| Excel  | .xlsx, .xls | First sheet used             |
| TSV    | .tsv        | Tab delimited                |

---

## Column Detection

VariScout auto-detects column types and displays them as **colored type badges** in the ColumnMapping screen:

| Type            | Detection                            | Badge Color |
| --------------- | ------------------------------------ | ----------- |
| Numeric measure | All values are numbers               | Blue        |
| Date/time       | Parseable date formats               | Amber       |
| Categorical     | Repeated string values               | Green       |
| Identifier      | Unique values (ignored for analysis) | Slate       |

---

## Required Columns

| Column Type | Required?        | Purpose                 |
| ----------- | ---------------- | ----------------------- |
| Measure     | Yes (at least 1) | Values to analyze       |
| Factor      | No               | Categories for grouping |
| Date/Time   | No               | Time-series ordering    |

---

## Auto-Mapping

Keywords trigger automatic column assignment:

| Keywords                       | Maps To              |
| ------------------------------ | -------------------- |
| "value", "measure", "result"   | Measure column       |
| "shift", "machine", "operator" | Factor columns       |
| "date", "time", "timestamp"    | Time column          |
| "usl", "lsl", "target", "spec" | Specification values |

---

## Paste Flow (PWA and Azure App)

Both the PWA and Azure App support paste input — users paste tab- or comma-separated text from Excel or Google Sheets.

```
TEXT PASTED
     │
     ▼
PARSE (tab/comma auto-detected via parseText())
     │
     ▼
DETECT COLUMNS (type, sample values, unique count, missing count via detectColumns())
     │
     ▼
VALIDATE DATA
     │
     ▼
USER CONFIRMS/ADJUSTS MAPPING (ColumnMapping with data-rich cards)
     │
     ▼
LOAD INTO ANALYSIS
```

The paste flow uses the same `parseText()` → `detectColumns()` → `ColumnMapping` pipeline as file upload. Tab and comma delimiters are auto-detected. The only difference is `maxFactors`: PWA allows 3 factors, Azure allows 6. The PWA HomeScreen also offers sample datasets as an alternative entry point.

`PasteScreenBase` accepts optional `title` and `submitLabel` props, allowing the Azure "Add Data" flow to reuse the same component with contextual labels (e.g., "Paste Data to Add" / "Add Data").

### ColumnMapping Features

The ColumnMapping component displays detected columns as **data-rich cards** with:

- **Type-separated sections**: The Y (Outcome) section shows numeric columns by default; the X (Factors) section shows categorical and date columns. A **"Show all columns"** toggle lets users see all columns in either section (useful when a numeric column needs to be treated as a factor).
- **Data-rich cards**: Each column card shows a colored type badge (Numeric/Categorical/Date/Text), 3–4 sample values from the data, unique or category count (≤10 unique values shows "N categories", >10 shows "N unique"), and an amber warning icon when missing values are detected.
- **Column renaming**: A pencil icon on each card opens an inline text input. Press Enter or click away to save the alias. The original column name appears as a subtitle. Aliases persist through the analysis — filter chips, chart axes, and breadcrumbs all use the renamed label.
- **Collapsible data preview**: A "Preview Data" toggle expands a mini table showing the first 5 rows with color-coded column headers (blue for numeric, green for categorical, amber for date, slate for text) and a row/column summary.
- **Specification limits**: An optional collapsible **"Set Specification Limits"** section (Target, LSL, USL) at the bottom, collapsed by default. Users who already know their spec limits can expand it and enter values before proceeding to analysis — values auto-apply on blur and carry through to the dashboard.

---

## Data Table Editor (PWA and Azure App)

Both the PWA and Azure App include an inline **Data Table Editor** for correcting or extending data without re-importing.

### How to Open

- **PWA**: Click the **Data Table** button in the toolbar header
- **Azure App**: Click the **Pencil** icon in the toolbar, or the pencil icon in the DataPanel header

### Features

| Feature                          | Description                                                                      |
| -------------------------------- | -------------------------------------------------------------------------------- |
| **Cell editing**                 | Click any cell to edit its value inline                                          |
| **Keyboard navigation**          | Tab (next cell), Shift+Tab (previous), Enter (save + move down), Escape (cancel) |
| **Add row**                      | Adds a new empty row at the bottom                                               |
| **Delete row**                   | Trash icon on each row                                                           |
| **Spec status**                  | Outcome column shows PASS/USL/LSL badges                                         |
| **Excluded row indicators**      | Amber warning icon with hover tooltip                                            |
| **Control violation indicators** | Red icon for UCL/LCL and Nelson Rule violations (Azure)                          |
| **Column aliases**               | Displays renamed column headers (Azure)                                          |
| **Pagination**                   | Automatic for datasets > 500 rows                                                |

### Batch Save Workflow

Edits are made on a **local copy** of the data. Nothing changes until you click **Apply Changes**:

1. Open the Data Table Editor
2. Make edits (cells, add rows, delete rows)
3. A **(unsaved changes)** indicator appears in the header
4. Click **Apply Changes** to commit all edits at once — charts update immediately
5. Or click **Cancel** to discard all changes

---

## Add Data During Analysis (Azure App)

The Azure App's "Add Data" dropdown lets analysts bring in additional data without restarting the analysis. It appears in the Editor toolbar header once data is loaded.

### Three Options

| Option           | Source                     | Notes                                           |
| ---------------- | -------------------------- | ----------------------------------------------- |
| **Paste Data**   | Clipboard (tab/comma)      | Opens PasteScreenBase with append-context label |
| **Upload File**  | CSV or Excel file          | Same parse pipeline as initial upload           |
| **Manual Entry** | Keyboard (ManualEntryBase) | Opens the manual entry grid                     |

### Auto-Detection (Merge Strategy)

When new data arrives, `useDataMerge` determines the merge strategy automatically via `detectMergeStrategy()`:

| Condition                        | Strategy        | Behavior                                             |
| -------------------------------- | --------------- | ---------------------------------------------------- |
| All columns match existing data  | **Append rows** | New rows concatenated; column union filled with null |
| New columns detected             | **Add columns** | Index-aligned join; shorter side padded with null    |
| No overlap / completely new data | **Replace**     | Confirmation dialog before replacing current dataset |

- **Row append**: concat existing + new rows, union of all columns, missing values filled with `null`.
- **Column merge**: index-aligned join (row 0 ↔ row 0), shorter side padded with `null`.
- **After adding columns**: ColumnMapping is shown for the new columns so the analyst can assign roles (factor, outcome, etc.).
- **Replace confirmation**: When the incoming data doesn't match existing columns, a confirmation dialog warns before replacing the current dataset.

### Feedback

A toast notification (auto-clears after 3 seconds) confirms the result — e.g., "Added 50 rows" or "Added 2 columns".

---

## Upload Flow (Azure App)

File upload (CSV/Excel drag-and-drop) is available in the Azure App.

```
FILE SELECTED
     │
     ▼
PARSE (CSV/Excel)
     │
     ▼
DETECT COLUMNS
     │
     ▼
AUTO-MAP (if keywords found)
     │
     ▼
VALIDATE DATA
     │
     ▼
USER CONFIRMS/ADJUSTS
     │
     ▼
LOAD INTO ANALYSIS
```

File upload in the append context (via "Add Data" → "Upload File") follows the same merge logic described in [Add Data During Analysis](#add-data-during-analysis-azure-app) above.

---

## See Also

- [Validation](validation.md)
- [Storage](storage.md)
- [Technical: Data Input](../../05-technical/implementation/data-input.md)
