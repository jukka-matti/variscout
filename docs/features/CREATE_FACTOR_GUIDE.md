# Create Factor from Selection - User Guide

**Feature**: Create custom factors from brushed point selections in IChart
**Status**: Phase 2 Complete ✅
**Version**: 1.0.0

---

## Overview

The **Create Factor from Selection** feature allows users to turn a brushed point selection into a permanent, named factor column. This enables:

- Identifying and naming specific events or patterns
- Filtering to analyze only the selected points
- Comparing selected vs unselected points in drill-down
- Exporting data with custom factor labels

**Common Use Cases**:

- Outlier investigation ("High Temperature Outliers")
- Time window analysis ("Morning Shift", "Weekend Production")
- Pattern identification ("Cyclic Events", "Tool Wear Period")
- Special cause isolation ("Machine Malfunction", "Operator Training")

---

## User Workflow

### Step 1: Brush Points in IChart

Select points using one of these methods:

**Drag to Select Region** (Primary Method):

- Click and drag to draw a blue selection rectangle
- All points within the rectangle are selected
- Visual feedback: Selected points grow larger with white stroke

**Modify Selection**:

- **Ctrl+click** → Toggle individual point in/out of selection
- **Shift+click** → Add point to existing selection
- **Drag new region** → Replace entire selection with new region
- **Click empty area** → Clear selection

**Visual Feedback**:

- Selected points: 6px radius, 2px white stroke, full opacity
- Unselected points: Normal size, 0.3 opacity (dimmed for context)
- Brush rectangle: Blue fill (10% opacity), blue stroke (50% opacity)

---

### Step 2: Review Selection in SelectionPanel

The **SelectionPanel** appears below the FilterBreadcrumb when points are selected.

**What You See**:

```
┌─────────────────────────────────────────────────┐
│ 12 points selected       [Clear] [Create Factor] │
├─────────────────────────────────────────────────┤
│ #23: Value=45.2, Operator=A, Time=09:15        │
│ #47: Value=43.8, Operator=B, Time=09:30        │
│ #52: Value=44.1, Operator=A, Time=09:35        │
│ #61: Value=46.8, Operator=C, Time=09:44        │
│ #73: Value=44.5, Operator=A, Time=09:56        │
│ ... and 7 more points                           │
└─────────────────────────────────────────────────┘
```

**Information Shown**:

- Total point count
- First 5 points with row numbers (1-based)
- Outcome value for each point
- Factor values (e.g., Operator, Shift)
- Time column value (if present)
- Overflow indicator ("and N more points")

**Actions Available**:

- **[Clear]** → Remove selection, hide panel
- **[Create Factor]** → Open naming modal

---

### Step 3: Name Your Factor

Click **[Create Factor]** to open the modal.

**Modal Interface**:

```
┌─────────────────────────────────────────────────┐
│  Create Factor from Selection               [×] │
├─────────────────────────────────────────────────┤
│  Factor Name: [________________________]        │
│                                                 │
│  12 points will be marked as:                   │
│  • "Your Factor Name" (selected)                │
│  • "Other" (unselected)                         │
│                                                 │
│  The view will automatically filter to show     │
│  only the selected points.                      │
│                                                 │
│             [Cancel]  [Create & Filter]         │
└─────────────────────────────────────────────────┘
```

**Naming Guidelines**:

- Be descriptive: "High Temperature Outliers" better than "Group1"
- Use context: "Morning Shift" better than "Shift A"
- Avoid duplicates: System validates against existing columns
- Keep it concise: Factor name appears in charts and filters

**Validation Rules**:

- ❌ Empty name → "Factor name cannot be empty"
- ❌ Duplicate name → "A factor with this name already exists"
- ✅ Unique name → "Create & Filter" button enabled

**Keyboard Shortcuts**:

- **Enter** → Create factor (if name valid)
- **Escape** → Cancel and close modal

---

### Step 4: Auto-Filter Applied

After clicking **[Create & Filter]**, the system:

1. **Creates new column** in your dataset
   - Column name: Your factor name (e.g., "High Temperature Events")
   - Selected points: Get factor name as value
   - Unselected points: Get "Other" as value

2. **Applies filter automatically**
   - Filter: `High Temperature Events: High Temperature Events`
   - Chart view zooms to show only selected points
   - FilterBreadcrumb shows new filter chip

3. **Clears selection**
   - SelectionPanel disappears
   - Now using filter instead of selection

**Example Data After Factor Creation**:

```
| Row | Value | Operator | High Temperature Events |
|-----|-------|----------|-------------------------|
|  23 | 45.2  | A        | High Temperature Events | ← Selected
|  24 | 39.1  | B        | Other                   | ← Not selected
|  47 | 43.8  | B        | High Temperature Events | ← Selected
|  48 | 38.5  | A        | Other                   | ← Not selected
```

---

### Step 5: Analyze & Export

**What You Can Do Now**:

**View Filtered Data**:

- IChart shows only selected points (zoomed view)
- Stats panel updates to show stats for selected points only
- All charts reflect the filtered dataset

**Remove Filter to See Full Dataset**:

- Click **×** on filter chip in FilterBreadcrumb
- Full dataset reappears
- New factor column still exists

**Drill Down by Factor**:

- Select factor in Boxplot: Compare "High Temperature Events" vs "Other"
- Select factor in Pareto: See Cpk ranking by factor value
- Use factor like any other categorical variable

**Export with Factor**:

- Export to CSV includes new factor column
- Share data with team, factor labels preserved
- Reproducible analysis with named categories

---

## Real-World Examples

### Example 1: Investigating Outliers

**Scenario**: Coffee roasting temperatures have 5 points above USL.

**Steps**:

1. Brush the 5 high points in IChart
2. SelectionPanel shows: "#12, #18, #23, #29, #34"
3. Click "Create Factor" → Name: "Temperature Outliers"
4. System filters to show only these 5 points
5. Boxplot shows: "Temperature Outliers" vs "Other"
6. Drill by Operator: See if outliers concentrated in one operator
7. Export CSV with "Temperature Outliers" column for report

**Result**: Identified that 4/5 outliers occurred with Operator C during morning shift.

---

### Example 2: Time Window Analysis

**Scenario**: Suspecting morning shift produces better results.

**Steps**:

1. Brush points from 6am-12pm in IChart
2. SelectionPanel shows: "24 points selected"
3. Create Factor → Name: "Morning Shift"
4. Remove filter to see full dataset
5. Boxplot: Compare "Morning Shift" vs "Other"
6. Stats show: Morning Cpk = 1.8, Other Cpk = 1.2
7. Present finding: Morning shift has 50% better capability

**Result**: Identified process difference between shifts, recommend standardizing setup procedures.

---

### Example 3: Pattern Group Identification

**Scenario**: Cyclic pattern appears in sachet fill weights.

**Steps**:

1. Brush the 8 points in cyclic peaks
2. Create Factor → Name: "Cyclic Events"
3. Filter to show only cyclic points
4. Drill by Machine: See which machine shows pattern
5. Drill by Time: Confirm pattern occurs every 2 hours
6. Export with "Cyclic Events" label for maintenance

**Result**: Found pattern linked to heat exchanger cycling, added to PM schedule.

---

## Tips & Best Practices

### Naming Conventions

**Good Names**:

- ✅ "High Temperature Outliers" (descriptive, actionable)
- ✅ "Morning Shift Production" (context + category)
- ✅ "Machine 3 Warm-Up Period" (specific event)
- ✅ "Operator Training Week" (time-based event)

**Avoid**:

- ❌ "Group1" (not descriptive)
- ❌ "Data" (too generic)
- ❌ "Selected" (doesn't convey meaning)
- ❌ "X" (cryptic)

### When to Create Factors

**Good Use Cases**:

- Outlier investigation (isolate special causes)
- Time window analysis (shift comparisons)
- Pattern identification (cyclic events)
- Event labeling (maintenance periods)
- Hypothesis testing (before/after changes)

**Better Done with Filters**:

- Temporary exploration (use filter chips instead)
- Already have categorical column (use existing factor)
- Single-use analysis (no need for persistence)

### Workflow Efficiency

**Before Brushing**:

- Decide what you're looking for (outliers, patterns, time windows)
- Check if existing factors already capture this (Shift, Operator, etc.)
- Consider if multiple factors needed (create separately)

**After Creating Factor**:

- Remove filter chip to verify factor column exists
- Try drill-down with new factor in Boxplot/Pareto
- Export early to save work (factor persists in CSV)

**Multiple Factors**:

- Can create multiple factors from different selections
- Each creates independent column
- Can drill by multiple factors sequentially

---

## Troubleshooting

### Issue: "A factor with this name already exists"

**Cause**: Column name already in dataset (original column or previously created factor)

**Solution**:

- Use a different name: "High Temp Events v2"
- Or delete the old column first (if no longer needed)
- Check existing columns in factor dropdown

---

### Issue: Selection cleared after creating factor

**Cause**: This is intentional behavior. After creating factor, you're now using a filter instead of a selection.

**Solution**:

- This is expected! The filter chip shows your factor filter.
- Points are still "selected" via the filter, not brush selection.
- To modify, remove filter chip and brush new selection.

---

### Issue: Factor not appearing in Boxplot dropdown

**Cause**: Factor was created but filter is still active, hiding other values.

**Solution**:

- Remove the auto-applied filter chip
- Full dataset returns, including "Other" category
- Factor now appears in dropdown with both values

---

### Issue: Created factor by mistake

**Cause**: Clicked "Create & Filter" with wrong name or selection.

**Solution**:

- No built-in undo (intentional design)
- Can manually remove from data:
  1. Export to CSV
  2. Delete factor column in Excel
  3. Re-import cleaned CSV
- Or create new selection with correct name

---

## Technical Notes

### Data Structure

**Before Factor Creation**:

```json
[
  { "Value": 45.2, "Operator": "A", "Time": "09:15" },
  { "Value": 39.1, "Operator": "B", "Time": "09:16" }
]
```

**After Creating "High Temp" Factor (row 1 selected)**:

```json
[
  { "Value": 45.2, "Operator": "A", "Time": "09:15", "High Temp": "High Temp" },
  { "Value": 39.1, "Operator": "B", "Time": "09:16", "High Temp": "Other" }
]
```

### Filter Application

**Auto-filter** applies: `{ "High Temp": ["High Temp"] }`

This means: Show only rows where `"High Temp"` column equals `"High Temp"` value.

To see all data: Remove filter chip → Shows both "High Temp" and "Other" rows.

---

## API Reference (For Developers)

### SelectionPanel Props

```typescript
interface SelectionPanelProps {
  selectedIndices: Set<number>; // Selected row indices (0-based)
  data: DataRow[]; // Filtered dataset
  outcome: string | null; // Outcome column name
  columnAliases?: Record<string, string>; // Display name overrides
  factors?: string[]; // Factor columns to show
  timeColumn?: string | null; // Time column name
  onClearSelection: () => void; // Clear callback
  onCreateFactor: () => void; // Open modal callback
}
```

### CreateFactorModal Props

```typescript
interface CreateFactorModalProps {
  isOpen: boolean; // Modal open state
  onClose: () => void; // Close callback
  selectedCount: number; // Number of selected points
  existingFactors: string[]; // Existing column names (for validation)
  onCreateFactor: (factorName: string) => void; // Create callback
}
```

### Core Utilities

```typescript
// Create factor column from selection
function createFactorFromSelection(
  data: DataRow[],
  selectedIndices: Set<number>,
  factorName: string
): DataRow[];

// Validate factor name uniqueness
function isValidFactorName(factorName: string, existingColumns: string[]): boolean;

// Extract all column names from dataset
function getColumnNames(data: DataRow[]): string[];
```

---

## Future Enhancements (Not in Phase 2)

- [ ] Undo factor creation
- [ ] Rename factor after creation
- [ ] Multi-value factor (not just "Factor Name" / "Other")
- [ ] Factor templates (save common selections)
- [ ] Merge multiple selections into one factor
- [ ] Color coding in SelectionPanel by health status

---

## Feedback & Support

**Found a bug?** Report at: [GitHub Issues](https://github.com/ruvnet/variscout/issues)

**Have a feature request?** Create an issue with label: `enhancement`

**Need help?** Check the [main documentation](../../README.md) or [MINITAB_BRUSHING.md](./MINITAB_BRUSHING.md)

---

**Last Updated**: 2026-02-04
**Phase**: 2 Complete ✅
**Next**: Phase 3 - Data Table Sync
