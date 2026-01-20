# Performance Mode Flow

> Multi-measure analysis for parallel channels (fill heads, nozzles, cavities, etc.)
> For the shared analysis journey, see [Core Analysis Journey](./CORE-ANALYSIS-JOURNEY.md).

## Overview

**Performance Mode** analyzes multiple measurement channels simultaneously, comparing their capability (Cpk) to identify the weakest performers. This is essential for:

- **Multi-head fillers**: 8, 12, or 20+ fill heads on a line
- **Multi-cavity molds**: Injection molding with parallel cavities
- **Multi-lane packaging**: Parallel packaging lanes
- **Multi-nozzle dispensers**: Parallel dispensing stations

### When to Use Performance Mode

| Scenario                               | Use Performance Mode      |
| -------------------------------------- | ------------------------- |
| 8-head filler, need to find worst head | Yes                       |
| Single measurement, compare by machine | No (use standard boxplot) |
| Multi-cavity mold, compare Cpk         | Yes                       |
| Time-series process control            | No (use standard I-Chart) |

---

## Data Format Requirements

### Wide Format Structure

Performance Mode requires **wide format** data where each channel is a separate column:

```csv
Sample,Head1,Head2,Head3,Head4,Head5,Head6,Head7,Head8
1,10.02,10.15,9.98,10.08,10.12,10.05,9.95,10.10
2,10.05,10.12,10.01,10.05,10.08,10.02,9.98,10.08
3,10.00,10.18,9.96,10.10,10.15,10.08,9.92,10.12
```

### Column Naming Patterns

The auto-detection looks for these patterns:

| Pattern                    | Examples                                 |
| -------------------------- | ---------------------------------------- |
| **Label + Number**         | `Head1`, `Head2`, `Cavity-1`, `Cavity-2` |
| **Label + Space + Number** | `Head 1`, `Nozzle 2`, `Lane 3`           |
| **Number only suffix**     | `FillWeight1`, `FillWeight2`             |
| **Sequential letters**     | `A`, `B`, `C` (less common)              |

### Minimum Requirements

| Requirement      | Value                   |
| ---------------- | ----------------------- |
| Minimum channels | 3                       |
| Maximum channels | 20 (UI limit)           |
| Minimum rows     | 10 (for meaningful Cpk) |
| Data type        | Numeric only            |

---

## Entry Methods

Performance Mode can be entered through multiple paths:

```
                    ┌─────────────────────────┐
                    │   Performance Mode      │
                    │      Dashboard          │
                    └───────────┬─────────────┘
                                │
        ┌───────────────────────┼───────────────────────┐
        │                       │                       │
        ↓                       ↓                       ↓
┌───────────────┐      ┌───────────────┐      ┌───────────────┐
│ File Upload   │      │ Manual Entry  │      │ Sample Data   │
│ + Auto-detect │      │ + Setup Panel │      │ (Sachets)     │
└───────────────┘      └───────────────┘      └───────────────┘
```

### 1. File Upload with Auto-Detection

The most common path - upload a file and let VariScout detect wide format:

```
Upload CSV/Excel file
        ↓
    Parse file
        ↓
    detectWideFormat()
        ├── Check for 3+ numeric columns
        ├── Look for sequential naming pattern
        └── Calculate confidence score
        ↓
    Wide format detected?
        ├── Yes → PerformanceDetectedModal
        │           ├── "Enable Performance Mode" → PerformanceDashboard
        │           └── "Skip" → Standard Dashboard
        └── No → Standard Column Mapping
```

### 2. Manual Data Entry with Performance Mode

For users entering data directly (e.g., from manual measurements):

```
HomeScreen → "Enter Data Manually"
        ↓
    ManualEntrySetup
        ├── Mode: Standard Analysis
        └── Mode: Performance Mode (Multi-Measure)
                ├── Enter measure label (e.g., "Head")
                ├── Enter number of channels (3-20)
                └── Enter spec limits (apply to all)
        ↓
    ManualEntry Grid
        ├── Standard: Factors + Outcome columns
        └── Performance: Channel columns only
        ↓
    Click "Analyze"
        ├── Standard → Dashboard
        └── Performance → PerformanceDashboard
```

### 3. Manual Measure Selection

When auto-detection fails or user wants to customize:

```
Standard Dashboard loaded
        ↓
    Open Settings → "Configure Performance Mode"
        ↓
    PerformanceSetupPanel
        ├── Select measure columns (checkbox list)
        ├── Enter measure label
        └── Set shared spec limits
        ↓
    Click "Analyze" → PerformanceDashboard
```

### 4. Sample Data Loading

Pre-configured Performance Mode samples:

```
HomeScreen → "Load Sample Data"
        ↓
    Select "Sachets" sample
        ↓
    Auto-loads with:
        ├── measureColumns: ["Head 1", "Head 2", ...]
        ├── performanceMode: true
        └── specs: { usl: 10.5, lsl: 9.5 }
        ↓
    PerformanceDashboard opens
```

---

## Setup Panel UI

### Manual Entry Setup (Performance Mode)

```
┌─────────────────────────────────────────────────┐
│ Step 1: What are you measuring?                 │
├─────────────────────────────────────────────────┤
│ Mode:                                           │
│   ○ Standard Analysis (1 outcome + factors)     │
│   ● Performance Mode (multiple channels)        │
│                                                 │
│ Measure Label: [Head________]                   │
│ Number of Channels: [8___]                      │
│                                                 │
│ Columns will be: Head 1, Head 2, ... Head 8     │
│                                                 │
│ Spec Limits (apply to all channels):            │
│   USL: [10.5]  LSL: [9.5]                       │
│                                                 │
│ [Cancel]                    [Continue →]        │
└─────────────────────────────────────────────────┘
```

### Manual Entry Grid (Performance Mode)

```
┌──────────────────────────────────────────────────────────────┐
│ Step 2: Enter Data                             [Paste] [+Row]│
├──────────────────────────────────────────────────────────────┤
│   # │ Head 1 │ Head 2 │ Head 3 │ Head 4 │ Head 5 │ Head 6   │
│ ─── │ ────── │ ────── │ ────── │ ────── │ ────── │ ──────   │
│   1 │ 10.2   │ 10.1   │  9.8   │ 10.3   │ 10.0   │ 10.1     │
│   2 │ 10.1   │ 10.2   │  9.7   │ 10.2   │ 10.1   │ 10.0     │
│   3 │ [____] │ [____] │ [____] │ [____] │ [____] │ [____]   │
├──────────────────────────────────────────────────────────────┤
│ Running Stats:                                               │
│   Head 1: n=2, μ=10.15, Cpk=1.23 ●                          │
│   Head 2: n=2, μ=10.15, Cpk=1.33 ●                          │
│   Head 3: n=2, μ=9.75,  Cpk=0.87 ⚠                          │
│   ...                                                        │
├──────────────────────────────────────────────────────────────┤
│ [Cancel]                              [Analyze (12 rows) →]  │
└──────────────────────────────────────────────────────────────┘
```

### Performance Setup Panel (Post-Load)

```
┌─────────────────────────────────────────────────┐
│ Performance Mode Setup                          │
├─────────────────────────────────────────────────┤
│ Measure Label: [Head________]                   │
│   e.g., "Head 1", "Head 2"                      │
│                                                 │
│ Cpk Target: [1.33]                              │
│   Target line shown on I-Chart (default: 1.33) │
│   1.33 = ~63 PPM defects | 1.67 = ~1 PPM        │
│                                                 │
│ Select Measure Columns:                         │
│   ☑ Head 1                                      │
│   ☑ Head 2                                      │
│   ☑ Head 3                                      │
│   ☑ Head 4                                      │
│   ☐ Timestamp (excluded - not numeric)          │
│   ☐ Batch (excluded - categorical)              │
│                                                 │
│ [Cancel]              [Analyze 4 Channels →]    │
└─────────────────────────────────────────────────┘
```

#### Cpk Target Setting

The Cpk Target allows users to define a reference target for capability analysis:

| Property    | Description                                                 |
| ----------- | ----------------------------------------------------------- |
| **Input**   | Numeric field with range 0.5 - 3.0                          |
| **Default** | 1.33 (industry standard, ~63 PPM defects)                   |
| **Purpose** | Displays a target line on the Performance I-Chart           |
| **Storage** | Stored with Performance Mode settings, reset on new project |

Common target values:

| Target | PPM Defects | Use Case           |
| ------ | ----------- | ------------------ |
| 1.00   | ~2,700      | Minimum capability |
| 1.33   | ~63         | Standard target    |
| 1.67   | ~1          | High capability    |
| 2.00   | <1          | Six Sigma          |

---

## Cross-Platform Differences

| Aspect               | PWA                  | Azure             | Excel             |
| -------------------- | -------------------- | ----------------- | ----------------- |
| **Auto-detection**   | Yes, modal prompt    | Yes, modal prompt | No                |
| **Manual entry**     | Yes, with setup      | No                | No                |
| **Setup panel**      | Settings → Configure | Tab-based nav     | Setup Wizard step |
| **Sample data**      | Sachets sample       | No samples        | No samples        |
| **Drill to I-Chart** | Yes                  | Yes               | Limited           |
| **Focus Mode**       | Yes                  | Yes               | No                |

### PWA-Specific Features

- Auto-detection modal on file upload
- Manual data entry with Performance Mode support
- Sample data (Sachets) with Performance Mode pre-configured
- Settings panel for manual configuration

### Azure-Specific Features

- Tab-based navigation (Analysis → Performance tab)
- No manual entry (file upload only)
- Team sharing of Performance Mode projects

### Excel-Specific Features

- Setup Wizard includes Performance Mode step
- Manual column selection (no auto-detection)
- Native slicer integration for filtering

---

## Detection Algorithm

The `detectWideFormat()` function in `@variscout/core`:

```typescript
function detectWideFormat(data: DataRow[]): WideFormatDetection {
  // 1. Find all numeric columns
  const numericCols = findNumericColumns(data);

  // 2. Look for sequential naming patterns
  const patterns = findSequentialPatterns(numericCols);

  // 3. Filter to groups of 3+ columns
  const channelGroups = patterns.filter(g => g.columns.length >= 3);

  // 4. Score confidence based on pattern strength
  const confidence = calculateConfidence(channelGroups);

  return {
    isWideFormat: channelGroups.length > 0,
    channels: channelGroups[0]?.columns || [],
    label: channelGroups[0]?.label || 'Channel',
    confidence,
  };
}
```

### Pattern Examples

| Column Names                   | Detected Label | Confidence |
| ------------------------------ | -------------- | ---------- |
| `Head1, Head2, Head3, Head4`   | "Head"         | High       |
| `Nozzle 1, Nozzle 2, Nozzle 3` | "Nozzle"       | High       |
| `A, B, C, D`                   | "Channel"      | Medium     |
| `Fill1, Fill2, Weight`         | Not detected   | -          |

---

## Troubleshooting

### Why Detection Fails

| Symptom                    | Cause                | Solution                                     |
| -------------------------- | -------------------- | -------------------------------------------- |
| Modal doesn't appear       | < 3 numeric columns  | Add more channels or use manual setup        |
| Wrong columns detected     | Non-sequential names | Rename columns to `Head1, Head2...`          |
| Mixed types detected       | Non-numeric values   | Clean data, remove text from measure columns |
| Only some columns detected | Naming inconsistency | Use consistent naming pattern                |

### Manual Override

When auto-detection fails:

1. Load data in standard mode
2. Open Settings panel
3. Click "Configure Performance Mode"
4. Manually select the measure columns
5. Click "Analyze"

### Validation Errors

| Error                           | Meaning                  | Fix                          |
| ------------------------------- | ------------------------ | ---------------------------- |
| "Minimum 3 channels required"   | Too few columns selected | Select more measure columns  |
| "Maximum 20 channels"           | Too many columns         | Split into multiple analyses |
| "Non-numeric data in column X"  | Text values found        | Clean column or exclude it   |
| "Insufficient data (< 10 rows)" | Too few samples          | Add more data rows           |

---

## Related Documentation

- [Core Analysis Journey](./CORE-ANALYSIS-JOURNEY.md) - Shared analysis experience
- [Platform Adaptations](./PLATFORM-ADAPTATIONS.md) - How Performance Mode differs across apps
- [PWA Data Onboarding](./pwa/DATA-ONBOARDING.md) - File upload and auto-detection
- [Performance Charts](../design-system/charts/performance.md) - Chart component specs
