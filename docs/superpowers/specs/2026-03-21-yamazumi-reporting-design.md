---
title: Yamazumi-Aware Reporting View
audience: [engineer, analyst]
category: workflow
status: draft
related: [yamazumi, reporting, lean, findings]
---

# Yamazumi-Aware Reporting View

## Problem

The reporting view renders the same SPC-focused content regardless of analysis mode. When the analyst is in yamazumi mode, the report shows I-Chart, Cpk, and boxplot snapshots that don't apply to time study data. The report should tell the right story for each mode.

## Design

### Core Principle

Adapt the existing 6-section / 3-workspace skeleton with mode-specific content. Same structure, different story.

### Section Mapping

| Step | Standard SPC      | Yamazumi             | Workspace            |
| ---- | ----------------- | -------------------- | -------------------- |
| 1    | Current Condition | Time Composition     | Analysis (green)     |
| 2    | Drivers           | Activity Composition | Analysis (green)     |
| 3    | Evidence Trail    | Evidence Trail       | Findings (amber)     |
| 4    | Improvement Plan  | Improvement Plan     | Improvement (purple) |
| 5    | Actions Taken     | Actions Taken        | Improvement (purple) |
| 6    | Verification      | Verification         | Improvement (purple) |

### Step 1: Time Composition

**KPI Grid (simplified, 3 metrics):**

- **VA Ratio** — value-adding time / total lead time (green if >50%, red if <30%)
- **Takt Time** — user-entered reference time
- **Steps Over Takt** — count + names of bottleneck steps (red if >0, show first 3 names then "+N more" if many)

**Chart:** Yamazumi stacked bar chart showing all steps with takt line.

**Summary mode:** KPI grid only (no chart).

### Step 2: Activity Composition (cross-mode change)

**Finding-driven content** — applies to ALL modes (standard SPC + yamazumi). When findings exist, finding-driven content **replaces** the auto-generated charts entirely. The analyst's pinned observations tell a more specific story than auto-generated charts.

When findings exist, each pinned finding renders:

1. Finding observation text with status dot
2. Chart context snapshot from where it was pinned (reconstructed from `Finding.source` metadata)
3. **Yamazumi only:** Activity breakdown table for the step, listing individual activities with their times and activity type colors (VA green, NVA-Required amber, Waste red, Wait grey)

Activity type badges in the breakdown table have **tooltips** (interactive only, not in print) explaining the lean improvement principle:

- Waste/Wait → "Eliminate: remove this activity entirely"
- NVA Required → "Reduce: minimize through automation or simplification"
- VA → "Optimize: improve efficiency of value-adding work"

**Fallback (no findings):** Only shown when zero findings exist.

- **Yamazumi:** Reasons Pareto (if reason column was mapped) → else Waste-by-Step Pareto. Uses existing `useParetoChartData` with yamazumi modes.
- **Standard SPC:** Current behavior: boxplot + pareto of first factor (unchanged).

**Summary mode:** Finding text + key driver name only (no chart/table).

### Steps 3–5: Unchanged

Evidence Trail, Improvement Plan, and Actions Taken are mode-agnostic. They work with findings, hypotheses, and action items regardless of analysis type. No changes needed.

### Step 6: Verification

**Learning loop:** Generalize `ReportCpkLearningLoop` props:

- Rename `cpkBefore`/`projectedCpk`/`cpkAfter` → `valueBefore`/`projectedValue`/`valueAfter`
- Add `metricLabel: string` prop (default "Cpk")
- Add `formatValue?: (v: number) => string` prop (default: 2-decimal format for Cpk; yamazumi passes percentage formatter showing "65%")
- Verdict logic unchanged: higher = better, "within 5% of projected" threshold applies to both Cpk and VA Ratio

**Summary mode:** Learning loop only (same as technical).

### Audience Toggle

Same Technical/Summary toggle as standard reports. Same pattern: Technical shows full charts + details, Summary shows KPIs + highlights.

| Section              | Technical                        | Summary                        |
| -------------------- | -------------------------------- | ------------------------------ |
| Time Composition     | KPI grid + yamazumi chart        | KPI grid only                  |
| Activity Composition | Finding charts + activity tables | Finding text + key driver      |
| Evidence Trail       | Full hypothesis tree             | Primary hypothesis + synthesis |
| Improvement Plan     | All idea details                 | Summary bar                    |
| Actions Taken        | Full action list                 | Count + completion %           |
| Verification         | Learning loop + staged charts    | Learning loop only             |

## Lean Improvement Principle

The yamazumi analysis embeds a lean improvement framework through activity type classification:

| Activity Type | Color | Lean Action | Tooltip Guidance                              |
| ------------- | ----- | ----------- | --------------------------------------------- |
| Waste         | Red   | Eliminate   | Remove this activity entirely                 |
| Wait          | Grey  | Eliminate   | Remove idle/queue time                        |
| NVA Required  | Amber | Reduce      | Minimize through automation or simplification |
| VA            | Green | Optimize    | Improve efficiency of value-adding work       |

This principle surfaces as tooltips on activity type badges in the Step 2 breakdown table (interactive only). Documentation should be updated to describe this framework.

## Implementation Approach

**Mode parameter in `useReportSections`:** Pass `analysisMode` to the hook, which returns mode-specific section titles and metadata. The hook already computes section list from findings state — adding mode awareness is a natural extension.

### Key Changes

1. **`useReportSections.ts`** — Accept `analysisMode` parameter, return mode-specific `title` per section
2. **New: `ReportYamazumiKPIGrid.tsx`** — Separate component accepting `YamazumiSummary` data (VA Ratio, Takt, Steps Over Takt). Existing `ReportKPIGrid` stays unchanged for SPC.
3. **`ReportCpkLearningLoop.tsx`** — Generalize props: `valueBefore`/`projectedValue`/`valueAfter` + `metricLabel` + `formatValue` function prop
4. **`ReportViewBase.tsx`** — No changes (section rendering is app-level)
5. **`apps/azure/src/components/views/ReportView.tsx`** — Mode-aware `renderSection` callback: select chart components and data based on `analysisMode`
6. **New: `ReportActivityBreakdown.tsx`** — Activity table component for yamazumi findings (with lean tooltips)
7. **Step 2 finding-driven logic** — New shared pattern: iterate findings, render source chart context per finding. Replaces auto-generated charts when findings exist.

### Data Flow

```
analysisMode (from DataContext)
  → useReportSections(findings, hypotheses, analysisMode)
    → sections[] with mode-specific titles
  → ReportView renderSection callback
    → mode check → select chart component + data hook
    → yamazumi: YamazumiChart, ReportYamazumiKPIGrid, ReportActivityBreakdown
    → standard: IChart, ReportKPIGrid, Boxplot, Pareto
```

## Follow-ups

- Evaluate broader yamazumi mode improvements (dashboard, interaction patterns)
- Capability mode report adaptations (separate design)
- Update yamazumi documentation with lean improvement principle
