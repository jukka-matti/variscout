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

VariScout auto-detects column types:

| Type            | Detection                            |
| --------------- | ------------------------------------ |
| Numeric measure | All values are numbers               |
| Date/time       | Parseable date formats               |
| Categorical     | Repeated string values               |
| Identifier      | Unique values (ignored for analysis) |

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
DETECT COLUMNS (keyword matching via detectColumns())
     │
     ▼
VALIDATE DATA
     │
     ▼
USER CONFIRMS/ADJUSTS MAPPING (ColumnMapping component)
     │
     ▼
LOAD INTO ANALYSIS
```

The paste flow uses the same `parseText()` → `detectColumns()` → `ColumnMapping` pipeline as file upload. Tab and comma delimiters are auto-detected. The PWA HomeScreen also offers sample datasets as an alternative entry point.

The ColumnMapping component includes an optional collapsible **"Set Specification Limits"** section (Target, LSL, USL) at the bottom of the screen. It is collapsed by default. Users who already know their spec limits can expand it and enter values before proceeding to analysis — values auto-apply on blur and carry through to the dashboard.

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
