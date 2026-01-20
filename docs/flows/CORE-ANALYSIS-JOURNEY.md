# Core Analysis Journey

> **Shared across all VariScout apps** (PWA, Azure, Excel)
> This document describes the analysis experience that is identical regardless of platform.

## Overview

After data is loaded and columns are mapped, all VariScout apps provide the same interactive analysis journey:

1. **Dashboard View** - Four linked charts showing different aspects of variation
2. **Drill-Down Navigation** - Click to filter, breadcrumbs show your path
3. **Performance Mode** - Multi-measure analysis for comparing channels
4. **Focus Mode** - Full-screen single chart with keyboard navigation

---

## 1. Dashboard Layout

### Chart Grid (2x2)

| Position     | Chart          | Purpose                                |
| ------------ | -------------- | -------------------------------------- |
| Top-left     | **I-Chart**    | Time-series control chart with UCL/LCL |
| Top-right    | **Boxplot**    | Factor comparison with ANOVA           |
| Bottom-left  | **Pareto**     | Defect/category ranking                |
| Bottom-right | **Capability** | Histogram with Cp/Cpk                  |

### Stats Panel

Right sidebar showing:

- Sample count (n)
- Mean and standard deviation
- Specification limits (USL/LSL)
- Capability indices (Cp, Cpk)
- Grade breakdown (if configured)

### Linked Filtering

All four charts share the same filter state. When you drill into data on any chart, all charts update to show the filtered subset.

---

## 2. Drill-Down Flow

### How It Works

The drill-down system uses a **stack-based** navigation model:

```
All Data → Machine=A → Shift=Morning → Operator=John
   └── Each step adds a filter to the stack
```

### Initiating a Drill

| Source      | Action               | Result                     |
| ----------- | -------------------- | -------------------------- |
| **Boxplot** | Click a category bar | Filter to that category    |
| **Pareto**  | Click a defect bar   | Filter to that defect type |
| **I-Chart** | Click a point        | Highlight (no filter)      |

### Toggle Behavior

Clicking the same filter value again **removes** it from the stack (toggle off).

### Breadcrumb Trail

The breadcrumb bar shows your current drill path:

```
All Data  →  Machine: A  →  Shift: Morning
                ↓               ↓
            (click to          (current
             go back)          position)
```

**Breadcrumb interactions:**

- Click any breadcrumb to jump directly to that level
- Click "All Data" (root) to clear all filters

### Variation Tracking (η²)

Each breadcrumb shows the **variation percentage** at that level:

```
All Data (100%) → Machine: A (67%) → Shift: Morning (46%)
```

This tells you: "By drilling to Machine A + Morning Shift, you've isolated 46% of the original variation."

**Impact levels:**

- **High** (>50%): Major factor, focus attention here
- **Moderate** (25-50%): Significant contributor
- **Low** (<25%): Minor contributor

### Browser History Integration

- Back button navigates up the drill stack
- URLs are shareable (filters encoded in query params)

---

## 3. Performance Mode (Multi-Measure Analysis)

Performance Mode analyzes multiple measurement channels (e.g., 12 fill heads, 8 cavities) simultaneously.

### Entry Points

1. **Auto-detection**: When wide-format data is detected, a modal offers Performance Mode
2. **Manual**: Select multiple measure columns in setup

### Performance Dashboard Layout

| Chart            | Purpose                                    |
| ---------------- | ------------------------------------------ |
| **Summary Bar**  | Overview metrics for all channels          |
| **Scatter Plot** | Cpk by channel (identify outliers)         |
| **Boxplot**      | Distribution comparison (max 5 channels)   |
| **Pareto**       | Cpk ranking, worst first (max 20 channels) |

### Cp vs Cpk Toggle

Switch between:

- **Cpk** (default): Process capability relative to nearest spec limit
- **Cp**: Process capability ignoring centering

### Drill to Single Measure

Click any channel in Performance Mode to drill into standard Dashboard view for that specific measure. The breadcrumb will show:

```
Performance Mode → Channel: Head-03
```

Click "Performance Mode" breadcrumb to return to multi-measure view.

---

## 4. Focus Mode

Focus Mode expands a single chart to full-screen for detailed analysis or presentation.

### Entering Focus Mode

- Click the expand icon on any chart
- Press `F` key when chart is hovered (PWA only)

### Keyboard Navigation

| Key      | Action                           |
| -------- | -------------------------------- |
| `←`      | Previous chart                   |
| `→`      | Next chart                       |
| `↑`      | Previous variant (if applicable) |
| `↓`      | Next variant (if applicable)     |
| `Escape` | Exit Focus Mode                  |

### Chart Cycle Order

```
I-Chart → Boxplot → Pareto → Capability → (loop)
```

### Embed Mode

When embedded via iframe, Focus Mode is automatically enabled with a single chart visible.

---

## 5. Chart Interactions

### Common to All Charts

| Interaction | Behavior                                              |
| ----------- | ----------------------------------------------------- |
| **Hover**   | Show tooltip with data values                         |
| **Click**   | Drill/filter (Boxplot, Pareto) or highlight (I-Chart) |
| **Scroll**  | Zoom on supported charts                              |

### I-Chart Specifics

- Click point → Highlight (table scrolls to row)
- Out-of-control points shown in red
- Control limits (UCL/LCL) calculated from data
- Specification limits (USL/LSL) shown if configured

### Boxplot Specifics

- Click category → Filter to that category
- Shows mean, median, quartiles, whiskers, outliers
- η² badge shows variation explained by factor

### Pareto Specifics

- Click bar → Filter to that category
- Cumulative line shows 80/20 analysis
- Categories sorted by count (highest first)

### Capability Specifics

- Shows distribution histogram
- Spec limits (USL/LSL) as vertical lines
- Normal curve overlay
- Cp/Cpk values displayed

---

## 6. Specification Management

### Setting Specifications

Specifications can be set via:

- Setup panel (before analysis)
- Settings modal (during analysis)
- Auto-detect from column names containing "USL" or "LSL"

### Specification Types

| Type       | Fields         | Use Case                            |
| ---------- | -------------- | ----------------------------------- |
| **Simple** | USL, LSL       | Basic capability analysis           |
| **Graded** | Multiple tiers | Quality grading (A, B, C, D grades) |

### Grades (Multi-tier)

When grades are configured:

- Grade breakdown appears in Stats panel
- Colors indicate grade (green=best, red=worst)
- Grade thresholds typically: Perfect > A > B > C > D

---

## 7. Stage Analysis

Stage analysis compares different time periods or process changes.

### Setting Up Stages

1. Include a "Stage" column in your data (e.g., "Before", "After")
2. Select it as the Stage factor in setup
3. Charts will show side-by-side comparison

### Stage Ordering

- Numeric stages: Natural order (1, 2, 3)
- Text stages: Alphabetical or detection-based

### Interpretation

Compare:

- Mean shift between stages
- Spread reduction (SD)
- Control limit changes
- Capability improvement

---

## Summary: What's Shared

| Feature             | Shared Implementation        |
| ------------------- | ---------------------------- |
| Drill-down stack    | `useDrillDown` hook          |
| Variation tracking  | `useVariationTracking` hook  |
| Keyboard navigation | `useKeyboardNavigation` hook |
| Chart components    | `@variscout/charts` package  |
| Statistics engine   | `@variscout/core` package    |
| Breadcrumb display  | Logic shared, UI varies      |

For platform-specific behaviors (entry points, storage, native features), see:

- [Platform Adaptations](./PLATFORM-ADAPTATIONS.md)
- [PWA Data Onboarding](./pwa/DATA-ONBOARDING.md)
- [Azure Project Management](./azure/PROJECT-MANAGEMENT.md)
- [Excel Setup Wizard](./excel/SETUP-WIZARD.md)
