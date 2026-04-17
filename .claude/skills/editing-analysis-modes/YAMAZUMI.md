<!-- TOC: computeYamazumiData · Activity types · Fixed colors · Takt time · Chart slots · CoScout coaching -->

# Yamazumi Mode Reference

- [Data Transform: computeYamazumiData()](#data-transform-computeyamazumidata)
- [Activity Type Classification](#activity-type-classification)
- [Fixed Activity Type Colors](#fixed-activity-type-colors)
- [Takt Time](#takt-time)
- [Chart Slot Mapping](#chart-slot-mapping)
- [Summary Panel Metrics](#summary-panel-metrics)
- [CoScout Coaching Language](#coscout-coaching-language)
- [Key Files](#key-files)

## Data Transform: computeYamazumiData()

Yamazumi mode applies `computeYamazumiData()` **before** the stats engine runs. Raw activity rows are aggregated into per-step stacked bar data. All four chart slots and ANOVA operate on this transformed working dataset — never on raw event rows.

```
Raw rows (one per activity observation)
  → computeYamazumiData(rows, columnMapping)
  → YamazumiBarData[] (one per process step, stacked segments by activity type)
  → Stats engine + all 4 charts
```

**Location:** `packages/core/src/yamazumi/aggregation.ts`
**Export:** `computeYamazumiData`, `computeYamazumiSummary` (via `@variscout/core/yamazumi`)

**`YamazumiBarData` shape:**

```typescript
interface YamazumiBarData {
  key: string;               // Process step name
  segments: YamazumiSegment[]; // One per activity type
  totalTime: number;         // Sum of all segment times
}

interface YamazumiSegment {
  activityType: ActivityType;
  totalTime: number;
  percentage: number;        // % of this bar's total
  count: number;             // Number of contributing rows
}
```

**Re-aggregation on filter:** When the user filters (e.g., selects a specific shift), the transform re-runs on the filtered raw data. This is handled in the app's data pipeline via the existing filter → transform → render flow.

**Detection:** `detectYamazumiFormat()` in `packages/core/src/yamazumi/detection.ts` runs at import time. It checks for an activity type column (VA/NVA/Waste/Wait patterns), a step column, and a time/duration column. Returns `YamazumiDetection` with `confidence: 'high' | 'medium' | 'low'`.

## Activity Type Classification

`classifyActivityType()` in `packages/core/src/yamazumi/classify.ts` maps raw strings to one of four canonical types using fuzzy matching.

| `ActivityType` | Label | Match Patterns |
|----------------|-------|----------------|
| `'va'` | Value-Adding | `va`, `value`, `value-add`, `value add` |
| `'nva-required'` | NVA Required | `nva`, `non-value`, `necessary`, `required waste`, `snva`, `semi` |
| `'waste'` | Waste | `waste`, `muda`, `nva` (without "required") |
| `'wait'` | Wait | `wait`, `idle`, `delay`, `queue`, `block` |

Stacking order (bottom to top in bar): `ACTIVITY_TYPE_ORDER = ['va', 'nva-required', 'waste', 'wait']`

## Fixed Activity Type Colors

These colors are defined in `ACTIVITY_TYPE_COLORS` in `packages/core/src/yamazumi/types.ts` and must **never change** per drill level, per filter, or per user preference. They match lean engineering convention globally.

| `ActivityType` | Color | Hex |
|----------------|-------|-----|
| `'va'` | Green | `#22c55e` |
| `'nva-required'` | Amber | `#f59e0b` |
| `'waste'` | Red | `#ef4444` |
| `'wait'` | Grey | `#94a3b8` |

Do not override these with Tailwind classes or `chartColors`. Import `ACTIVITY_TYPE_COLORS` directly for chart rendering.

## Takt Time

Takt time is user-entered (not calculated). It is stored in `YamazumiColumnMapping.taktTime` and passed to the `YamazumiChart` component as the `taktTime` prop, which renders a horizontal dashed reference line.

**KPI:** `metricLabel = () => 'VA Ratio'` with `formatMetricValue = (v) => `${Math.round(v * 100)}%``

`YamazumiSummary.stepsOverTakt` is the list of step names whose `totalTime` exceeds `taktTime`. Takt compliance = `(total steps - stepsOverTakt.length) / total steps`.

**Setting takt time:** Exposed via the settings panel (no equivalent in Standard or Performance mode). If not set, the takt line is hidden and takt compliance metrics are omitted.

## Chart Slot Mapping

| Slot | `ChartSlotType` | Component | Purpose |
|------|-----------------|-----------|---------|
| 1 | `'yamazumi-chart'` | `YamazumiChart` / `YamazumiChartBase` | Stacked bar chart: activity composition per step |
| 2 | `'yamazumi-ichart'` | I-Chart (reused) | Cycle time series with switchable metric |
| 3 | `'yamazumi-pareto'` | Pareto (reused, 5-mode switcher) | Waste/type/step ranking |
| 4 | `'yamazumi-summary'` | `YamazumiSummaryPanel` | Lean KPIs: VA ratio, takt compliance, bottleneck |

**Slot 2 metric switcher:** `YamazumiIChartMetric = 'total' | 'va' | 'nva' | 'waste' | 'wait'` — allows the analyst to focus the I-Chart on any activity type's time series.

**Slot 3 Pareto mode switcher:** `YamazumiParetoMode`:
- `'steps-total'` — Total time per step (default)
- `'steps-waste'` — Waste time per step
- `'steps-nva'` — NVA Required time per step
- `'activities'` — All individual activities ranked
- `'reasons'` — Waste reasons/comments ranked (if reason column mapped)

## Summary Panel Metrics

`YamazumiSummary` fields displayed in Slot 4:

| Metric | Field | Description |
|--------|-------|-------------|
| VA Ratio | `vaRatio` | `vaTime / totalLeadTime` (0–1) — lean counterpart to Cpk |
| Process Efficiency | `processEfficiency` | `vaTime / (vaTime + nvaTime)` |
| Total Lead Time | `totalLeadTime` | Sum across all steps |
| Total NVA | `wasteTime + waitTime` | Eliminable time |
| Takt Compliance | derived | Steps below takt / total steps |
| Bottleneck Step | derived | Step with highest `totalTime` |

## CoScout Coaching Language

`aiToolSet: 'yamazumi'` routes to lean methodology coaching.

**Use:** value-add ratio, takt time, cycle time, takt compliance, bottleneck station, waste composition, NVA elimination, kaizen opportunity, process efficiency, lean improvement.

**Do not use:** Cpk, specification limits, control limits, normality, ANOVA (unless answering a specific cross-factor question).

**Phase framing:**
- FRAME: "Which stations exceed takt time?"
- SCOUT: "Where is waste concentrated? Which step has the highest NVA?"
- INVESTIGATE: "What drives cycle time at Station X? Which activity type dominates?"
- IMPROVE: "If we eliminate NVA from Station 3, does it come below takt?"

`questionStrategy.generator = 'wasteComposition'` — questions ranked by `wasteContribution` (waste %) rather than R²adj.

## Key Files

| File | Purpose |
|------|---------|
| `packages/core/src/yamazumi/types.ts` | `ActivityType`, `ACTIVITY_TYPE_COLORS`, `YamazumiBarData`, `YamazumiSummary` |
| `packages/core/src/yamazumi/aggregation.ts` | `computeYamazumiData()`, `computeYamazumiSummary()` |
| `packages/core/src/yamazumi/classify.ts` | `classifyActivityType()` |
| `packages/core/src/yamazumi/detection.ts` | `detectYamazumiFormat()` |
| `packages/core/src/yamazumi/projection.ts` | `projectWasteElimination()`, `projectVAImprovement()` |
| `packages/charts/src/` | `YamazumiChart`, `YamazumiChartBase` |
| `packages/hooks/src/useDefectTransform.ts` | (defect) analogous pattern for yamazumi data pipeline |
| `docs/07-decisions/adr-034-yamazumi-analysis-mode.md` | Mode design rationale |
| `docs/03-features/analysis/yamazumi.md` | User-facing feature documentation |
