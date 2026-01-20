# Manual Data Entry Flow

> Direct data entry mode for field use, quick measurements, or when source data isn't available as a file.

## Overview

Manual Entry provides a streamlined two-step workflow for entering measurement data directly into VariScout:

```
Step 1: Setup          Step 2: Grid Entry
┌──────────────┐       ┌──────────────────────────┐
│ Configure:   │       │ Factor1 │ Factor2 │ Y   │
│ - Mode       │  ──→  ├─────────┼─────────┼─────┤
│ - Outcome    │       │ A       │ Day     │ 10.2│
│ - Factors    │       │ B       │ Night   │ 10.4│
│ - Specs      │       │ ...     │ ...     │ ... │
└──────────────┘       └──────────────────────────┘
                                    ↓
                              [Analyze] → Dashboard
```

## Access Points

From the **HomeScreen** (before any data is loaded):

1. Click **"Enter Data Manually"** button
2. Or select from the upload area dropdown

---

## Analysis Modes

Manual Entry supports two distinct analysis modes selected during setup:

| Mode            | Use Case                           | Columns Generated              |
| --------------- | ---------------------------------- | ------------------------------ |
| **Standard**    | Factor-outcome analysis (Y = f(X)) | Factor columns + Outcome (Y)   |
| **Performance** | Multi-channel comparison           | Channel columns (Head 1, 2...) |

---

## Standard Mode

For analyzing how factors (X) affect an outcome (Y).

### Setup Configuration

| Field       | Description                          | Example              |
| ----------- | ------------------------------------ | -------------------- |
| Outcome (Y) | The measurement being recorded       | Weight, Diameter, pH |
| Factors (X) | Grouping/categorical variables       | Operator, Machine    |
| LSL         | Lower Specification Limit (optional) | 9.5                  |
| USL         | Upper Specification Limit (optional) | 10.5                 |

- Click **+ Add Factor** to add additional factors (up to 3 recommended)
- Click **trash icon** to remove a factor
- Factor order determines column order in the grid

### Grid Layout

```
┌─────┬───────────┬───────────┬────────────┬─────┐
│  #  │ Factor1(X)│ Factor2(X)│ Outcome(Y) │     │
├─────┼───────────┼───────────┼────────────┼─────┤
│  1  │ Operator A│ Machine 1 │    10.2    │ [×] │
│  2  │ Operator B│ Machine 2 │    10.4    │ [×] │
│  3  │ ...       │ ...       │    ...     │ [×] │
└─────┴───────────┴───────────┴────────────┴─────┘
              [+ Add Row]
```

### Running Statistics (Standard Mode)

Live statistics update as data is entered:

| Metric     | Description                              |
| ---------- | ---------------------------------------- |
| **Count**  | Number of valid measurements             |
| **Mean**   | Running average of outcome values        |
| **Range**  | Min – Max of outcome values              |
| **Pass %** | Percentage within specs (if LSL/USL set) |

---

## Performance Mode

For analyzing variation across parallel measurement channels (fill heads, nozzles, cavities).

### Setup Configuration

| Field         | Description                   | Example      | Constraints |
| ------------- | ----------------------------- | ------------ | ----------- |
| Measure Label | Base name for channel columns | Head, Nozzle | Required    |
| Channel Count | Number of parallel channels   | 8            | 3–20        |
| LSL           | Lower Specification Limit     | 9.5          | Optional    |
| USL           | Upper Specification Limit     | 10.5         | Optional    |

**Column Preview**: Shows generated column names (e.g., "Head 1, Head 2, ... Head 8")

### Grid Layout

```
┌─────┬────────┬────────┬────────┬────────┬─────┐
│  #  │ Head 1 │ Head 2 │ Head 3 │  ...   │     │
├─────┼────────┼────────┼────────┼────────┼─────┤
│  1  │  10.2  │  10.1  │  10.3  │  ...   │ [×] │
│  2  │  10.1  │  10.2  │  10.0  │  ...   │ [×] │
└─────┴────────┴────────┴────────┴────────┴─────┘
                [+ Add Row]
```

- Grid scrolls horizontally for many channels
- Row number column is sticky (stays visible when scrolling)

### Running Statistics (Performance Mode)

Per-channel Cpk indicators update as data is entered:

```
Running Stats:
┌──────────────┬──────────────┬──────────────┐
│ Head 1       │ Head 2       │ Head 3       │
│ n=5, μ=10.2  │ n=5, μ=10.1  │ n=5, μ=10.3  │
│ Cpk=1.45 ✓   │ Cpk=1.32 ⚠   │ Cpk=0.89 ✗   │
└──────────────┴──────────────┴──────────────┘
```

**Status Indicators** (when specs are set):

- **Green (✓)**: Cpk ≥ 1.33 (capable)
- **Amber (⚠)**: 1.0 ≤ Cpk < 1.33 (marginal)
- **Red (✗)**: Cpk < 1.0 (not capable)

---

## Features

### Keyboard Navigation

| Key           | Action                                  |
| ------------- | --------------------------------------- |
| `Tab`         | Move to next cell                       |
| `Shift+Tab`   | Move to previous cell                   |
| `Enter`       | Move to next cell (same as Tab)         |
| `Enter` (end) | Auto-creates new row at end of last row |

Navigation wraps: end of row → start of next row.

### Clipboard Paste

1. Click **Paste** button in header
2. Paste tab-separated data (from Excel)
3. Data appends to existing rows
4. Columns must match grid order

**Expected format** (Standard Mode):

```
Operator A	Machine 1	10.2
Operator B	Machine 2	10.4
```

**Expected format** (Performance Mode):

```
10.2	10.1	10.3	10.0
10.4	10.2	10.1	10.3
```

### Spec Limit Visual Feedback

When LSL and/or USL are configured, cells show instant pass/fail feedback:

| Status       | Style                 | Condition         |
| ------------ | --------------------- | ----------------- |
| **Pass**     | Green left border     | LSL ≤ value ≤ USL |
| **Fail USL** | Red left border       | value > USL       |
| **Fail LSL** | Amber left border     | value < LSL       |
| **No spec**  | Blue background (dim) | No limits set     |

### Row Operations

- **Add Row**: Click **+ Add Row** button or press `Enter` on last cell
- **Delete Row**: Hover row → click trash icon (appears on hover)
- **Auto-focus**: New rows auto-focus first input cell

---

## Data Flow

```
ManualEntrySetup
      ↓ [Continue]
ManualEntry (Grid)
      ↓ [Analyze]
onAnalyze callback
      ↓
DataContext.setData()
      ↓
┌──────────────────┬───────────────────────┐
│ Standard Mode    │ Performance Mode      │
├──────────────────┼───────────────────────┤
│ Dashboard.tsx    │ PerformanceDashboard  │
└──────────────────┴───────────────────────┘
```

### Output Format

**Standard Mode** returns:

```typescript
{
  data: [{ Operator: "A", Machine: "1", Weight: 10.2 }, ...],
  config: {
    outcome: "Weight",
    factors: ["Operator", "Machine"],
    specs: { usl: 10.5, lsl: 9.5 }
  }
}
```

**Performance Mode** returns:

```typescript
{
  data: [{ "Head 1": 10.2, "Head 2": 10.1, ... }, ...],
  config: {
    outcome: "Head 1",  // First channel as default
    factors: [],
    specs: { usl: 10.5, lsl: 9.5 },
    isPerformanceMode: true,
    measureColumns: ["Head 1", "Head 2", ...],
    measureLabel: "Head"
  }
}
```

---

## Append Mode

Append mode allows adding new data to an existing analysis without replacing the current dataset. This is useful for incremental data collection over time.

### Access Points

When data is already loaded, access append mode via:

1. **Toolbar button**: Click "Add Data" (➕) in the header toolbar
2. **Azure app**: Also available from the project menu

### How It Works

```
Existing Data (10 rows)          Manual Entry (5 new rows)
┌──────────────────────┐         ┌──────────────────────┐
│ Op │ Machine │ Wt   │         │ Op │ Machine │ Wt   │
├────┼─────────┼──────┤         ├────┼─────────┼──────┤
│ A  │ M1      │ 10.2 │    +    │ C  │ M2      │ 10.3 │
│ B  │ M1      │ 10.4 │         │ A  │ M2      │ 10.1 │
│ ...│ ...     │ ...  │         │ ...│ ...     │ ...  │
└──────────────────────┘         └──────────────────────┘
           │                                │
           └──────────────┬─────────────────┘
                          ▼
              Merged Data (15 rows)
              ┌──────────────────────┐
              │ Op │ Machine │ Wt   │
              ├────┼─────────┼──────┤
              │ A  │ M1      │ 10.2 │
              │ ...│ ...     │ ...  │
              │ C  │ M2      │ 10.3 │
              │ ...│ ...     │ ...  │
              └──────────────────────┘
```

### Data Merging Behavior

| Scenario        | Behavior                                             |
| --------------- | ---------------------------------------------------- |
| Same columns    | New rows appended to existing data                   |
| New columns     | Columns added; existing rows get empty values        |
| Missing columns | Existing columns retained; new rows get empty values |

### Config Merging

When appending, configuration is intelligently merged:

| Config Property  | Merge Behavior                                       |
| ---------------- | ---------------------------------------------------- |
| `factors`        | Union of existing and new factors                    |
| `measureColumns` | Union of existing and new measure columns            |
| `outcome`        | Preserved from existing (unless new data defines it) |
| `specs`          | Preserved from existing analysis                     |

### Modes

Append mode works in both analysis modes:

- **Standard Mode**: Append new factor-outcome rows
- **Performance Mode**: Append new measurement cycles across channels

### Workflow

1. Click "Add Data" in toolbar
2. Manual Entry opens with existing config pre-filled
3. Enter new data rows
4. Click "Analyze"
5. New data merges with existing
6. Dashboard updates with combined dataset

---

## Touch-Optimized Design

Manual Entry is designed for tablet and field use:

| Element     | Size/Behavior                     |
| ----------- | --------------------------------- |
| Input cells | 56px minimum height               |
| Buttons     | Large touch targets (44px+)       |
| Row numbers | Sticky column (always visible)    |
| Spacing     | Generous padding between elements |

---

## Validation

### Standard Mode

- At least one outcome value required to enable **Analyze** button
- Empty factor cells are allowed (will be empty strings)
- Non-numeric outcome values are filtered on analyze

### Performance Mode

- At least one row with valid channel data required
- Empty channels become `null` in output
- Rows with no valid measurements are filtered

---

## Implementation

**Source files:**

- `apps/pwa/src/components/ManualEntry.tsx` - Main component
- `apps/pwa/src/components/ManualEntrySetup.tsx` - Setup step

**State managed:**

- `step`: 'setup' | 'grid'
- `mode`: 'standard' | 'performance'
- `rows`: Array of row objects
- `usl/lsl`: Specification limits as strings

---

## Related Documentation

- [Data Onboarding Flow](./DATA-ONBOARDING.md) - File upload entry points
- [Core Analysis Journey](../CORE-ANALYSIS-JOURNEY.md) - What happens after Analyze
- [Performance Mode Charts](../../design-system/charts/performance-mode.md) - Multi-channel analysis
