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
    *   *Note: This creates an "alias". Your original data column name remains unchanged.*

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

### Setting Standard Limits (USL/LSL)
1.  Locate the **Stats Panel** (the card with Cp/Cpk stats).
2.  Click the **"Add Specs"** area at the bottom, or the **Settings Icon** in the panel header.
3.  Enter your limits:
    *   **LSL (Lower Spec Limit)**: Minimum acceptable value.
    *   **Target**: Ideal value (optional, drawn in green).
    *   **USL (Upper Spec Limit)**: Maximum acceptable value.
4.  **Result**:
    *   Red dotted lines appear on charts (I-Chart & Boxplot).
    *   Cp, Cpk, and Pass/Fail rates are instantly calculated.
    *   Histogram updates to show spec boundaries.

### Multi-Tier Grading
For industries like Coffee or Textiles, simple Pass/Fail isn't enough. You can define multiple grades (e.g., Specialty, Premium, Commercial).

1.  Open the **Spec Editor** (same as above).
2.  In the "Grades" section, click **"+ Add"**.
3.  Define a grade:
    *   **Label**: e.g., "Grade A".
    *   **Max**: The upper limit for this grade (inclusive).
    *   **Color**: Pick a color for visualization.
4.  Add as many grades as needed. Ensure they are sorted logic (the editor usually handles sorting by max value).
5.  **Result**: Charts will show colored background bands corresponding to these grades.

---

## Visualization Options

You can toggle visibility of chart elements in the global **Settings**.

1.  Click the **Gear Icon** (top right of the header).
2.  Scroll to **"2. Visualization"**.
3.  Toggle options:
    *   **Show Cp**: Capability of the process width (ignoring centering).
    *   **Show Cpk**: Capability considering process centering (real-world performance).
    *   **Show Spec Limits**: Toggle the red USL/LSL lines on charts on/off.

---

## Tips & Tricks

*   **Keyboard Shortcuts**: Press `Esc` to instantly clear all chart filters.
*   **Reset Scaling**: If you manually zoomed or panned, double-click the chart area or use the "Reset" button in scale settings to fit to data.
*   **Large Mode**: Presenting to a group? Open Settings and toggle "Large Mode" for 30% larger text.
