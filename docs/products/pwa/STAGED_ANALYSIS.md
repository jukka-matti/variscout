# Staged Analysis User Guide

> **Cross-App Feature**: Staged I-Chart analysis is available in all VariScout apps:
>
> - **PWA** (web app) — Stage dropdown in Dashboard header
> - **Azure Team App** — Same UI as PWA
> - **Excel Add-in** — Configure in Setup Wizard (Step 3: Stage Analysis)

This guide explains how to use staged I-Charts in VariScout to analyze data across distinct phases or time periods.

## What is Staged Analysis?

Staged analysis divides your I-Chart into distinct phases, with **separate control limits calculated for each stage**. This is essential when your process has undergone changes that affect its baseline behavior.

### Common Use Cases

| Scenario            | Example                                           |
| ------------------- | ------------------------------------------------- |
| Process improvement | Before/during/after implementing a change         |
| Batch comparison    | Different production batches or lots              |
| Equipment changes   | Before/after equipment maintenance or replacement |
| Material changes    | Comparing suppliers or material lots              |
| Shift comparison    | Day vs. night shift performance                   |
| Time periods        | Comparing weekly or monthly performance           |

### Why Use Staged Analysis?

Without staging, control limits are calculated from **all** data combined. This can mask real improvements or hide problems:

**Problem 1: Hiding improvements**

- Your process improved mid-way through data collection
- Combined data shows wider control limits than either stage alone
- Real improvement is obscured

**Problem 2: False stability**

- Process shifted but variation stayed similar
- Combined limits look acceptable
- The shift goes undetected

**Solution: Staged analysis** calculates separate limits per stage, revealing the true behavior in each phase.

---

## How to Enable Stages

### Step 1: Prepare Your Data

Your data file needs a column that identifies which stage each row belongs to. Examples:

| Phase  | Machine | Measurement |
| ------ | ------- | ----------- |
| Before | A       | 10.2        |
| Before | B       | 10.5        |
| After  | A       | 9.8         |
| After  | B       | 9.7         |

or

| Batch | Operator | Value |
| ----- | -------- | ----- |
| 1     | John     | 25.3  |
| 1     | Jane     | 25.1  |
| 2     | John     | 24.8  |
| 2     | Jane     | 24.9  |

### Step 2: Select Stage Column

1. Load your data into VariScout
2. Look for the **Stage** dropdown in the Dashboard header (next to Outcome selector)
3. Select your stage column from the dropdown
4. The I-Chart will immediately update with staged control limits

### Step 3: Choose Stage Order (Optional)

When you select a stage column, a secondary dropdown appears for **stage ordering**:

| Option                    | Behavior                                                      |
| ------------------------- | ------------------------------------------------------------- |
| **Auto-detect** (default) | Numeric patterns sorted numerically, text by first occurrence |
| **First occurrence**      | Stages appear in the order they first occur in your data      |
| **Alphabetical**          | Stages sorted A-Z or 1-9                                      |

---

## Stage Order Detection

### Auto-detect Logic

VariScout automatically determines the best ordering:

**Numeric stages** are sorted numerically:

- `"1", "2", "3"` → 1, 2, 3
- `"Stage 1", "Stage 2", "Stage 10"` → Stage 1, Stage 2, Stage 10
- `"Phase 1", "Phase 2"` → Phase 1, Phase 2
- `"Batch 01", "Batch 02"` → Batch 01, Batch 02

**Text stages** use first occurrence order:

- `"Before", "After"` → Before, After (order from data)
- `"Control", "Treatment"` → as they appear in data

### Manual Override

If auto-detect doesn't match your needs, select a different order mode:

- **First occurrence**: Preserves the sequence in your raw data
- **Alphabetical**: Sorts stages A-Z or numerically 1-9

---

## Reading the Staged Chart

### Visual Elements

When staging is active, the I-Chart displays:

```
       Stage A           │           Stage B
       ──────────────────┼──────────────────────
  UCL ─────────────      │      ─────────────── UCL
      ●  ●     ●  ●      │    ●   ●    ●
 Mean ───────────────    │  ──────────────────── Mean
        ●  ●  ●          │      ●  ●  ●
  LCL ─────────────      │      ─────────────── LCL
```

| Element              | Description                                      |
| -------------------- | ------------------------------------------------ |
| **Stage labels**     | Appear at the top of each stage section          |
| **Vertical divider** | Dashed line marking stage boundaries             |
| **UCL/Mean/LCL**     | Calculated separately for each stage             |
| **Point colors**     | Based on that point's stage limits (not overall) |

### Data Sorting

When staging is enabled:

- Data is **sorted by stage** (all Stage A points, then Stage B, etc.)
- X-axis shows **observation index** (1, 2, 3...) not time
- Original row order within each stage is preserved

This grouping makes it easy to compare control limits between stages.

---

## Best Practices

### Sample Size Per Stage

Each stage should have enough data points for reliable statistics:

| Stage Size   | Recommendation                    |
| ------------ | --------------------------------- |
| < 10 points  | Control limits may be unreliable  |
| 10-20 points | Minimum for basic analysis        |
| 20-50 points | Good for most applications        |
| > 50 points  | Excellent statistical reliability |

### Number of Stages

VariScout supports stages with columns that have 2-10 unique values:

| Number of Stages | Recommendation                     |
| ---------------- | ---------------------------------- |
| 2-3 stages       | Ideal for before/after comparisons |
| 4-5 stages       | Good for batch or period analysis  |
| 6-10 stages      | May become visually crowded        |
| > 10 stages      | Consider grouping or filtering     |

### Meaningful Stage Definitions

Choose stages that represent real process changes:

**Good stage definitions:**

- Before/After a specific intervention
- Different equipment or operators
- Distinct time periods (weeks, months)
- Different material lots

**Poor stage definitions:**

- Arbitrary splits (first half / second half with no real change)
- Too granular (every hour when daily is sufficient)
- Overlapping periods

---

## Interpreting Results

### Comparing Stages

Look for these patterns:

| Pattern                         | Interpretation                         |
| ------------------------------- | -------------------------------------- |
| Lower mean in Stage B           | Process shifted (centered differently) |
| Tighter UCL/LCL in Stage B      | Process improved (less variation)      |
| Wider UCL/LCL in Stage B        | Process worsened (more variation)      |
| Different out-of-control points | Some stages more stable than others    |

### Example Analysis

**Scenario**: Comparing process before and after a maintenance event

| Stage  | Mean | UCL  | LCL  | Points Outside |
| ------ | ---- | ---- | ---- | -------------- |
| Before | 50.2 | 58.1 | 42.3 | 3              |
| After  | 49.8 | 53.2 | 46.4 | 0              |

**Interpretation**:

- Mean stayed similar (centered correctly)
- Control limits tightened significantly (less variation)
- No out-of-control points after maintenance
- Maintenance improved process stability

---

## Limitations

### Not Suitable For

- **Interleaved data without clear stages**: If Stage A and B points are randomly mixed with no logical grouping
- **Very small stages**: Stages with < 5 points produce unreliable statistics
- **High number of stages**: More than 10 stages makes the chart hard to read

### Data Requirements

- Stage column must be categorical (text or limited numeric values)
- Each row must have a valid stage value (missing values excluded)
- Outcome column must be numeric

---

## API Reference

For developers integrating staged analysis:

```typescript
import {
  determineStageOrder,
  sortDataByStage,
  calculateStatsByStage,
  getStageBoundaries,
  type StagedStatsResult,
  type StageOrderMode,
  type StageBoundary,
} from '@variscout/core';
```

See [Statistics Reference](../../STATISTICS_REFERENCE.md#staged-control-limits) for detailed API documentation.

---

## Related Documentation

- [Statistics Reference: Staged Control Limits](../../STATISTICS_REFERENCE.md#staged-control-limits)
- [Control Limits (I-Chart)](../../STATISTICS_REFERENCE.md#control-limits-i-chart)
- [Product Specification: Three-Chart Dashboard](../../../Specs.md#2-three-chart-dashboard)
