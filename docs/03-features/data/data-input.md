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

### ColumnMapping Features

The ColumnMapping component displays detected columns as **data-rich cards** with:

- **Type-separated sections**: The Y (Outcome) section shows numeric columns by default; the X (Factors) section shows categorical and date columns. A **"Show all columns"** toggle lets users see all columns in either section (useful when a numeric column needs to be treated as a factor).
- **Data-rich cards**: Each column card shows a colored type badge (Numeric/Categorical/Date/Text), 3–4 sample values from the data, unique or category count (≤10 unique values shows "N categories", >10 shows "N unique"), and an amber warning icon when missing values are detected.
- **Column renaming**: A pencil icon on each card opens an inline text input. Press Enter or click away to save the alias. The original column name appears as a subtitle. Aliases persist through the analysis — filter chips, chart axes, and breadcrumbs all use the renamed label.
- **Collapsible data preview**: A "Preview Data" toggle expands a mini table showing the first 5 rows with color-coded column headers (blue for numeric, green for categorical, amber for date, slate for text) and a row/column summary.
- **Specification limits**: An optional collapsible **"Set Specification Limits"** section (Target, LSL, USL) at the bottom, collapsed by default. Users who already know their spec limits can expand it and enter values before proceeding to analysis — values auto-apply on blur and carry through to the dashboard.

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

---

## See Also

- [Validation](validation.md)
- [Storage](storage.md)
- [Technical: Data Input](../../05-technical/implementation/data-input.md)
