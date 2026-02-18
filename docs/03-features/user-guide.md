# VariScout Lite: User Guide

This guide covers advanced features and workflows in VariScout Lite, focusing on interactive customization and specification management.

## Interactive Chart Customization

VariScout Lite allows you to customize chart labels and axis names directly on the dashboard without altering your original data source. This is called **Aliasing**.

### Renaming Axis Titles

You can rename the Y-axis (Outcome) and X-axis (Factor/Category) labels to make charts more presentation-ready.

1.  **Hover** over any axis label (e.g., "Weight" on the Y-axis). The cursor will change to a pointer.
2.  **Click** the label. A small popup editor will appear.
3.  **Type** the new name (e.g., "Net Weight (g)").
4.  **Click Save** (Check icon).
    - _Note: This creates an "alias". Your original data column name remains unchanged._

### Renaming Categories (Boxplot)

If your data has cryptic codes (e.g., "M1", "M2"), you can rename them to meaningful labels (e.g., "Machine 1", "Machine 2") directly on the Boxplot.

1.  **Click** the X-axis label of the Boxplot (e.g., "MachineID").
2.  The **Label & Category Editor** will open.
3.  You will see a list of all unique values found in that column.
4.  Enter a **Display Name** next to any value you wish to rename.
5.  **Click Save**. The chart will update immediately.

---

## Specification Management

Specifications (Spec Limits) define what is considered "acceptable" quality. VariScout Lite supports both standard limits and complex multi-tier grading.

### Setting Specifications — Two Entry Points

You can set specification limits at two points in the workflow. Both approaches auto-apply on blur; there is no separate Apply button.

**Option 1: During Column Mapping (optional, at setup time)**

The ColumnMapping screen includes a collapsible **"Set Specification Limits"** section at the bottom, collapsed by default.

1. After pasting or uploading data, scroll to the bottom of the column mapping screen.
2. Click **"Set Specification Limits"** to expand the section.
3. Enter any combination of **Target**, **LSL**, and **USL** — all three are optional.
4. Continue to analysis. The values carry over automatically.

This is the fastest path when you already know your spec limits before starting.

**Option 2: Inline in the Stats Panel (at analysis time)**

If you reach the dashboard without specs set, the Stats Panel shows an inline entry area instead of silently omitting Cp/Cpk/Pass Rate.

1. Look for the **"Set a target to enable Cp/Cpk"** prompt in the Stats Panel.
2. Enter a **Target** value first (lowest commitment — unlocks partial feedback).
3. Click **"+ LSL/USL"** to expand and add the full specification range.
4. Click or tab away from the field — values apply immediately.
5. The inline entry area transforms into the normal Cp/Cpk/Pass Rate stat cards.

**Option 3: Via the Specs dropdown in the I-Chart header**

1.  In the **I-Chart header**, click the **"Specs"** dropdown button.
2.  A popover will appear with checkboxes and input fields for each limit.
3.  Enter your limits:
    - **USL (Upper Spec Limit)**: Maximum acceptable value.
    - **LSL (Lower Spec Limit)**: Minimum acceptable value.
    - **Target**: Ideal value (optional, drawn in green).
4.  Use the checkboxes to toggle visibility of each limit on the chart.

**Result (any entry point):**

- Red dotted lines appear on charts (I-Chart & Boxplot).
- Cp, Cpk, and Pass/Fail rates are instantly calculated in the Stats Panel.
- Histogram updates to show spec boundaries.

---

## Visualization Options

You can toggle visibility of chart elements and change display settings in the **Settings Panel**.

1.  Click the **Settings icon (⚙)** in the top right of the header.
2.  The Settings Panel will slide in from the right.
3.  In the **"Display Options"** section, toggle:
    - **Lock Y-axis when drilling**: Keep the Y-axis scale consistent when filtering data.
    - **Show Control Limits**: Display UCL/Mean/LCL lines on the I-Chart (statistical process control limits based on 3-sigma rule).
    - **Show distribution shape**: Overlay density curves (violin plots) on boxplots to reveal distribution shape, bimodality, and skewness.
4.  In the **"Y-Axis Scale Mode"** section, choose:
    - **Auto**: Automatically fit scale to data and specification limits.
    - **Start at Zero**: Force Y-axis minimum to zero (useful for ratio data).
    - **Manual**: Set explicit Min and Max values for the Y-axis.
5.  Spec limit visibility (USL/LSL/Target) is now controlled via the **Specs dropdown** in the I-Chart header.

---

## Manual Data Entry

VariScout Lite includes a touch-optimized data entry mode for field use or when you need to quickly input measurements.

### Accessing Manual Entry

1. From the home screen, click **"Or enter data manually"** (below the Paste button)
2. In the Azure App, also available via the **Manual Entry** option in the data menu

### Step 1: Choose Analysis Mode

Select your analysis type:

| Mode                  | Use Case                              | Output           |
| --------------------- | ------------------------------------- | ---------------- |
| **Standard Analysis** | Factor-outcome analysis (Y = f(X))    | Dashboard        |
| **Performance Mode**  | Multi-channel comparison (fill heads) | Performance view |

### Step 1a: Standard Analysis Setup

1. **Outcome (Y)**: Name of the measurement you're recording (e.g., "Weight", "Diameter", "pH")
2. **Factors (X)**: Grouping variables (e.g., "Operator", "Machine", "Batch")
   - Click **+ Add Factor** to add more (up to 3 recommended)
   - Click the **X** to remove a factor
3. Click **Continue** to proceed to data entry

### Step 1b: Performance Mode Setup

1. **Measure Label**: Base name for channels (e.g., "Head", "Nozzle", "Cavity")
2. **Number of Channels**: How many parallel channels (3-20)
   - Preview shows generated column names (e.g., "Head 1, Head 2, ...")
3. Click **Continue** to proceed to data entry

### Step 2: Enter Your Data

The data entry grid has these features:

#### Keyboard Navigation

| Key                  | Action                          |
| -------------------- | ------------------------------- |
| `Tab`                | Move to next cell               |
| `Shift+Tab`          | Move to previous cell           |
| `Enter`              | Move to next cell (same as Tab) |
| `Enter` on last cell | Creates a new row               |

#### Touch-Optimized Design

- Large **56px input fields** for easy tablet/phone use
- Clear visual feedback on focus
- **Add Row** button prominently placed

#### Spec Limit Feedback

1. Enter **USL** and/or **LSL** in the header area
2. Each measurement shows instant visual feedback:
   - **Green border**: Within spec (PASS)
   - **Red border + text**: Exceeds USL
   - **Amber border + text**: Below LSL

#### Running Statistics

As you enter data, live statistics appear:

**Standard Mode:**

- **Count**: Number of valid measurements
- **Mean**: Running average
- **Min/Max**: Range of values
- **Pass Rate**: Percentage meeting specs (if limits defined)

**Performance Mode:**
Per-channel statistics cards showing:

- **n**: Sample count per channel
- **μ (Mean)**: Average value per channel
- **Cpk**: Process capability index (when specs set)
- **Status indicator**: Green (Cpk ≥ 1.33), Amber (1.0-1.33), Red (< 1.0)

#### Paste from Clipboard

Click the **Paste** button to paste tab-separated data from Excel:

1. Copy cells in Excel (columns should match your factor + outcome order)
2. Click **Paste from Clipboard**
3. Data is appended to existing rows

### Analyzing Your Data

1. Enter at least one measurement
2. Click **Analyze** to proceed to the dashboard
3. Your spec limits (if set) carry over to the analysis

---

## Data Import Formats

### Supported File Types

| Format | Extension | Notes                                 |
| ------ | --------- | ------------------------------------- |
| CSV    | `.csv`    | Comma-separated, UTF-8 recommended    |
| Excel  | `.xlsx`   | First sheet only, first row = headers |

### CSV Requirements

```csv
Supplier,Shift,Weight
Farm A,Morning,325.5
Farm B,Afternoon,318.2
Farm A,Morning,330.1
```

- **First row**: Column headers (required)
- **Encoding**: UTF-8 preferred (for international characters)
- **Delimiter**: Comma (`,`)
- **Numeric columns**: Use period (`.`) for decimals

### Excel Requirements

- **Sheet**: Only the first sheet is read
- **Headers**: First row must contain column names
- **Data types**: Numeric columns should be formatted as numbers
- **Limit**: Maximum 50,000 rows

### Data Size Limits

| Threshold           | Behavior                              |
| ------------------- | ------------------------------------- |
| < 5,000 rows        | Loads immediately                     |
| 5,000 - 50,000 rows | Warning prompt (may slow performance) |
| > 50,000 rows       | Rejected (file too large)             |

### Data Validation

When you upload a file, VariScout automatically validates your data and shows a summary:

**What Gets Validated:**

- The outcome column (Y) is checked for valid numeric values
- Rows with missing or non-numeric values are excluded from analysis

**Validation Summary Banner:**
After uploading, you'll see a banner showing:

- Total rows in the file
- Valid rows ready for analysis
- Excluded rows with reasons (if any)

**Viewing Excluded Rows:**

1. Click **"View Excluded Rows"** in the validation banner
2. The Data Table opens filtered to show only problem rows
3. Excluded rows are highlighted with an amber background
4. Hover over the warning icon to see the specific issue

**Common Issues:**
| Issue | Cause | Solution |
|-------|-------|----------|
| Missing values | Empty cells in outcome column | Fill in values or remove rows in source file |
| Non-numeric values | Text like "N/A" or "pending" | Replace with numbers or remove rows |

Validation is informational — your analysis proceeds with valid rows. You can inspect issues anytime via the Data Table.

### Pareto Data Source

By default, the Pareto chart counts occurrences from your selected factors. For some use cases, you may want to use pre-aggregated data instead.

**Default: Derived from Factors**

- Counts computed automatically from your data
- Updates when you apply filters
- Uses the selected factor for grouping

**Optional: Separate Pareto File**

If you have pre-aggregated counts (e.g., from ERP or MES systems):

1. In the column mapping screen, scroll to **"Pareto Source"**
2. Drop a CSV/Excel file with category + count columns
3. The chart will use this data instead

**Important:** Separate Pareto data is NOT linked to main data filters. When you filter your process data, the Pareto chart won't update if using a separate file.

### Auto-Detection

VariScout uses smart keyword-based detection to suggest column roles:

**Outcome (Y) Detection** — Numeric columns containing:

- Measurement terms: `weight`, `length`, `width`, `height`, `thickness`
- Time metrics: `time`, `duration`, `cycle`, `lead`, `ct`
- Process values: `temperature`, `pressure`, `yield`, `output`

**Factor (X) Detection** — Categorical columns containing:

- Process factors: `shift`, `operator`, `machine`, `line`, `station`
- Grouping terms: `product`, `batch`, `supplier`, `lot`, `team`

**Time Column Detection** — Columns containing:

- `date`, `time`, `timestamp`, `datetime`, `created`, `recorded`

The detection algorithm also:

- Analyzes multiple rows (not just the first) to determine column types
- Prioritizes keyword matches over simple type detection
- Limits factors to 3 columns maximum

You can always override these suggestions in the column mapping screen.

---

## Annotating Charts

You can add text notes to any chart and, on Boxplot and Pareto, apply highlight colors to categories — useful for marking findings before exporting charts for reports.

### Boxplot and Pareto: Highlighting a Category

1. **Right-click** any boxplot box or pareto bar
2. A context menu appears with color options: Red, Amber, Green
3. **Click a color** to apply the highlight — the box/bar fills with that color
4. To remove a highlight, right-click and choose **Clear highlight**

### Boxplot and Pareto: Adding a Text Note

1. **Right-click** the box/bar you want to annotate
2. Click **"+ Add note"** in the context menu
3. A text box appears anchored to that category
4. **Click the text** to edit it — type your note, then click away to save
5. **Drag the text box** to reposition it relative to the anchor
6. **Drag the right edge** to resize the width
7. **Hover** and click **×** to delete the note

### I-Chart: Adding a Free-Floating Text Note

1. **Right-click** anywhere in the I-Chart area
2. A text note appears immediately at the click position — no context menu
3. **Click the text** to edit it, then click away to save
4. **Drag the note** to reposition it anywhere on the chart
5. **Drag the right edge** to resize the width
6. **Hover** and click **×** to delete the note

I-Chart notes are **free-floating**: they are anchored to a percentage position within the chart area, not to a data point. Notes remain at their visual position when you filter data or change the time range.

Note: I-Chart dots use fixed semantic colors (blue = in-control, red = violation). Highlight colors are not available for I-Chart dots.

### Clearing All Annotations

- Each chart card shows a small **×** button in the header when annotations exist
- Click it to clear all highlights and text notes for that chart

### Important Behavior

- **Left-click always does drill-down** — annotations don't interfere with normal navigation
- When you filter, sort, or drill-down Boxplot/Pareto notes **snap back to their default position** (offsets reset); I-Chart notes stay at their percentage position
- Boxplot/Pareto notes are **hidden** when their anchor category is filtered out
- Annotations appear in **copy-to-clipboard** chart images (PNG)

---

## Point Selection (Brushing)

You can select points directly on the I-Chart to create ad-hoc grouping factors.

### How to Select

| Action        | Effect                                    |
| ------------- | ----------------------------------------- |
| Drag on chart | Draw a selection rectangle (brush)        |
| Ctrl+click    | Toggle a single point in/out of selection |
| Shift+click   | Add a single point to the selection       |
| Esc           | Clear the selection                       |

### Create Factor Workflow

1. Select points on the I-Chart using any combination of drag and click
2. The **Selection Panel** appears showing the count of selected points
3. Click **"Create Factor"** and enter a name (e.g., "Startup batch")
4. A new factor column is created with your named group and "Other"
5. The dashboard auto-filters to show your selected points — continue analysis with Boxplot, Pareto, and Capability

This is useful when you spot instability patterns on the I-Chart that don't align with any existing factor in your data.

---

## Tips & Tricks

- **Keyboard Shortcuts**: Press `Esc` to instantly clear all chart filters.
- **Reset Scaling**: If you manually zoomed or panned, double-click the chart area or use the "Reset" button in scale settings to fit to data.
- **Large Mode**: Presenting to a group? Open Settings (⚙) and toggle "Large Mode" for 30% larger text.
- **Export Charts**: Use the Share button (↗) to export charts as PNG images.
- **Linked Filtering**: Click any bar in Pareto or group in Boxplot to filter all charts instantly.
- **Focus Mode**: Click the fullscreen icon (⛶) to maximize. **Use Arrow Keys (Left/Right)** or on-screen buttons to cycle through charts like a slideshow.
- **Data Table**: Toggle the Data Panel (📊) to view raw data alongside your charts. Click a row to highlight it in the chart.
- **Save Project** (Azure App): Use the Save button to save your work to the browser. The PWA is session-only — data is cleared on refresh.

---

## Troubleshooting / FAQ

### Data Issues

**Q: My data isn't showing up after upload**

A: Check that:

1. Your file has a header row
2. At least one column contains numeric data
3. File size is under 50,000 rows

**Q: Numeric column is being treated as text**

A: Excel may format numbers as text. Re-format the column as "Number" in Excel and re-export.

**Q: Special characters (é, ü, etc.) look wrong**

A: Save your CSV as UTF-8 encoding. In Excel: Save As → CSV UTF-8.

### Charts

**Q: I-Chart control limits seem wrong**

A: Control limits (UCL/LCL) are calculated from your data using the 3-sigma rule:

- UCL = Mean + 3 × StdDev
- LCL = Mean − 3 × StdDev

They reflect what your process **is doing**, not what it **should do**. Specification limits (USL/LSL) are separate.

**Q: Charts are too small on my screen**

A: Enable **Large Mode** in Settings for 30% larger fonts and touch targets.

### Offline Use

**Q: Can I use VariScout without internet?**

A: Yes! After visiting once, the app caches itself via Service Worker for offline use.

**Q: Where is my data stored?**

A: All data stays in your browser — nothing is sent to any server.

- **Azure App**: Save analyses to IndexedDB + sync to OneDrive. Click **"Save"** in the toolbar.
- **PWA (Free)**: Session-only — data lives in memory and is cleared on refresh. No save feature.

### Export

**Q: How do I share my analysis?**

A: Click the **Share icon (↗)** in the header to see export options:

- **Export Image (PNG)**: Save charts as images for presentations
- **Export Data (CSV)**: Download the filtered data as a spreadsheet
- **Download Project (.vrs)**: Save the complete analysis for sharing (Azure App only)

In the Azure App, others can import .vrs files by clicking the **Logo** and selecting **"Open Project"**.
