# Excel Setup Wizard Flow

> Excel-specific setup process for configuring VaRiScout analysis.
> For the shared analysis journey, see [Core Analysis Journey](../CORE-ANALYSIS-JOURNEY.md).

## Overview

The Excel Add-in uses a 6-step wizard to configure analysis from worksheet data. This replaces the single-modal column mapping used in PWA/Azure.

## Prerequisites

- Data in Excel worksheet (rows = observations, columns = variables)
- VaRiScout Add-in installed
- Excel 2016+ or Excel Online

---

## Wizard Steps

```
┌─────────────────────────────────────────────────────┐
│ Step 1/6: Select Data                    [■□□□□□]   │
├─────────────────────────────────────────────────────┤
│                                                     │
│ Select your data range in Excel, then click        │
│ "Get Selection" to begin.                          │
│                                                     │
│         [Get Selection from Excel]                 │
│                                                     │
├─────────────────────────────────────────────────────┤
│ [Cancel]                              [Next →]     │
└─────────────────────────────────────────────────────┘
```

---

## Step 1: Select Data

### Purpose

Create an Excel Table from the selected range for analysis.

### User Actions

1. Select data range in Excel (including headers)
2. Click "Get Selection" button
3. Add-in creates/finds Excel Table

### Behind the Scenes

```
User selects range (A1:E100)
        ↓
    ensureTable() called
        ├── Check if selection is already in table
        ├── OR create new table from range
        └── Return table name
        ↓
    Store: rangeAddress, dataSheetName, tableName
```

### Error Handling

- "Please select a data range first" - No selection
- "Selection too small" - Less than 2 rows

---

## Step 2: Configure Columns

### Purpose

Map columns to outcome variable and factor variables.

### Auto-Detection

The wizard automatically detects column types:

| Detection       | Rule                                   |
| --------------- | -------------------------------------- |
| **Numeric**     | All values parseable as numbers        |
| **Categorical** | Contains text or limited unique values |

### User Actions

1. Select **Outcome** from numeric columns dropdown
2. Check factor columns to include (checkboxes)

### Layout

```
┌─────────────────────────────────────────────────────┐
│ Step 2/6: Configure Columns              [■■□□□□]   │
├─────────────────────────────────────────────────────┤
│                                                     │
│ Outcome (measurement):                              │
│ [Weight ▼]                                          │
│                                                     │
│ Factors (grouping variables):                       │
│   ☑ Machine                                         │
│   ☑ Shift                                           │
│   ☐ Operator                                        │
│   ☐ Date                                            │
│                                                     │
├─────────────────────────────────────────────────────┤
│ [← Back]                              [Next →]     │
└─────────────────────────────────────────────────────┘
```

### Constraints

- Outcome must be numeric
- Maximum 3 factors recommended

---

## Step 3: Stage Analysis

### Purpose

Configure staged I-Chart for before/after comparisons.

### What Is Stage Analysis?

Divides data into phases (e.g., "Before", "After") to compare:

- Control limit shifts
- Mean changes
- Process improvements

### User Actions

1. Select stage column (optional)
2. Choose stage ordering mode

### Layout

```
┌─────────────────────────────────────────────────────┐
│ Step 3/6: Stage Analysis                 [■■■□□□]   │
├─────────────────────────────────────────────────────┤
│                                                     │
│ Stage column (optional):                            │
│ [None ▼]                                            │
│   - None                                            │
│   - Phase                                           │
│   - Period                                          │
│                                                     │
│ Stage ordering:                                     │
│   ● Auto-detect (numeric or alphabetical)          │
│   ○ Data order (as they appear)                    │
│                                                     │
├─────────────────────────────────────────────────────┤
│ [← Back]                              [Next →]     │
└─────────────────────────────────────────────────────┘
```

### Skip Option

If no stage analysis needed, leave as "None" and proceed.

---

## Step 4: Create Slicers

### Purpose

Create native Excel slicers for interactive filtering.

### Why Native Slicers?

- Familiar Excel UI
- Works when Add-in is closed
- Filters entire workbook
- No custom UI required

### User Actions

1. Choose whether to create slicers
2. Select which factors get slicers

### Layout

```
┌─────────────────────────────────────────────────────┐
│ Step 4/6: Create Slicers                 [■■■■□□]   │
├─────────────────────────────────────────────────────┤
│                                                     │
│ ☑ Create Excel slicers for filtering               │
│                                                     │
│ Slicers to create:                                  │
│   ☑ Machine                                         │
│   ☑ Shift                                           │
│   ☐ Operator                                        │
│                                                     │
│ ⚠ Slicers will be placed in a new row above the   │
│   Content Add-in.                                   │
│                                                     │
├─────────────────────────────────────────────────────┤
│ [← Back]                              [Next →]     │
└─────────────────────────────────────────────────────┘
```

### Slicer Requirements

- ExcelApi 1.10+ required
- Not available in all Excel versions
- If unsupported, step is skipped

### Slicer Placement

Slicers are created in a row above the Content Add-in for easy access.

---

## Step 5: Set Specifications

### Purpose

Define specification limits for capability analysis.

### User Actions

1. Enter USL (Upper Specification Limit)
2. Enter LSL (Lower Specification Limit)
3. Optionally enter Target
4. Set Cpk target (default 1.33)

### Layout

```
┌─────────────────────────────────────────────────────┐
│ Step 5/6: Set Specifications             [■■■■■□]   │
├─────────────────────────────────────────────────────┤
│                                                     │
│ Upper Spec Limit (USL): [10.5______]               │
│ Lower Spec Limit (LSL): [9.5_______]               │
│ Target (optional):      [10.0______]               │
│                                                     │
│ ───────────────────────────────────────────────     │
│ Cpk Target:             [1.33______]               │
│ (Used to color capability values)                   │
│                                                     │
├─────────────────────────────────────────────────────┤
│ [← Back]                              [Finish →]   │
└─────────────────────────────────────────────────────┘
```

### Validation

- USL must be greater than LSL
- All values must be numeric
- Empty specs are allowed (capability disabled)

---

## Step 6: Complete

### Purpose

Confirm setup and launch analysis.

### What Happens

1. State saved to Custom Document Properties
2. Content Add-in opens (if not already)
3. Charts render with configured data

### Layout

```
┌─────────────────────────────────────────────────────┐
│ Step 6/6: Complete                       [■■■■■■]   │
├─────────────────────────────────────────────────────┤
│                                                     │
│            ✓ Setup Complete!                        │
│                                                     │
│ Your analysis is ready. The charts will appear     │
│ in the Content Add-in.                             │
│                                                     │
│ Summary:                                            │
│ • Outcome: Weight                                   │
│ • Factors: Machine, Shift                          │
│ • Specs: 9.5 - 10.5                               │
│ • Slicers: 2 created                               │
│                                                     │
│         [Open Analysis Dashboard]                   │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

## State Persistence

### Custom Document Properties

Settings are saved to the workbook file:

```json
{
  "variscout_tableName": "Table1",
  "variscout_outcomeColumn": "Weight",
  "variscout_factorColumns": ["Machine", "Shift"],
  "variscout_specs": { "usl": 10.5, "lsl": 9.5, "target": 10.0 },
  "variscout_cpkTarget": 1.33,
  "variscout_stageColumn": null
}
```

### Benefits

- Settings travel with workbook
- Re-open workbook → analysis resumes
- Share workbook → recipients see same config

### License Gating

In free tier, saving settings prompts upgrade:

```
┌─────────────────────────────────────────────────────┐
│ Save Settings (Premium Feature)                     │
├─────────────────────────────────────────────────────┤
│ Save your analysis configuration to this workbook   │
│ so it loads automatically next time.               │
│                                                     │
│ This feature requires a license.                    │
│                                                     │
│ [Buy License €49/year]    [Continue without saving] │
└─────────────────────────────────────────────────────┘
```

---

## Content Add-in Integration

### How Charts Display

After wizard completes:

```
Excel Worksheet
┌─────────────────────────────────────────────────────┐
│ [Machine ▼] [Shift ▼]    ← Native Excel Slicers    │
├─────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────┐ │
│ │                                                 │ │
│ │  Content Add-in (embedded)                      │ │
│ │  ┌─────────┐ ┌─────────┐                        │ │
│ │  │ I-Chart │ │ Boxplot │                        │ │
│ │  └─────────┘ └─────────┘                        │ │
│ │                                                 │ │
│ └─────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────┤
│ Data Table...                                       │
└─────────────────────────────────────────────────────┘
```

### Slicer → Chart Sync

1. User clicks slicer filter
2. Excel filters table rows
3. Content Add-in polls table for visible rows
4. Charts re-render with filtered data

### Polling Interval

- Check every 500ms for slicer changes
- Only re-calculate if row count changes

---

## Differences from PWA/Azure

| Aspect                  | PWA/Azure       | Excel               |
| ----------------------- | --------------- | ------------------- |
| Steps                   | 1 (modal)       | 6 (wizard)          |
| Filtering               | Click charts    | Native slicers      |
| Persistence             | IndexedDB/Cloud | Document Properties |
| Data source             | File upload     | Table selection     |
| Auto-detect wide format | Yes             | No                  |
| Pareto separate file    | Yes             | No                  |
| Mobile                  | Yes (PWA)       | No                  |

---

## Related Documentation

- [Core Analysis Journey](../CORE-ANALYSIS-JOURNEY.md) - Shared analysis experience
- [Platform Adaptations](../PLATFORM-ADAPTATIONS.md) - How Excel differs from other apps
- [Excel Add-in Overview](../../products/excel/OVERVIEW.md) - Product specification
