---
title: Yamazumi Analysis Mode
audience: [analyst, engineer]
category: analysis
status: draft
related: [yamazumi, lean, time-study, waste, value-stream, takt-time, activity-type]
---

# Yamazumi Analysis Mode

## Purpose

Add a third analysis mode to VariScout for lean manufacturing time study analysis. Yamazumi (積み上げ, "stacking") charts visualize cycle time composition by activity type (Value-Adding, NVA Required, Waste, Wait) across process steps, enabling analysts to identify bottlenecks, waste patterns, and improvement opportunities.

The mode reuses the existing dashboard grid, filter navigation, findings system, hypothesis tree, and improvement workspace — providing a lean manufacturing lens on the same investigation-to-action workflow.

## Use Cases

1. **Bottleneck identification**: Analyst pastes time study data → Yamazumi chart immediately shows which process steps have the tallest bars (most time) and which are dominated by waste (red segments).
2. **Waste Pareto**: Switch Pareto to "Waste Reasons" mode → see that "waiting for material" accounts for 45% of total waste → pin as finding → create hypothesis → investigate with drill-down.
3. **Product comparison**: Drill into a bottleneck step → Yamazumi re-groups by product type → see that Product B takes 3x longer due to manual rework → focus investigation.
4. **Lead time stability**: I-Chart in "Total" mode shows process lead time trending upward → switch to "Waste only" → waste is the driver, not VA work → drill into waste reasons.
5. **Mode switching**: Same dataset viewed through Standard lens (SPC/capability) and Yamazumi lens (lean/waste) — different analytical perspectives without re-uploading.

## Analysis Mode Model

The existing `isPerformanceMode: boolean` evolves to a discriminated union:

```typescript
type AnalysisMode = 'standard' | 'performance' | 'yamazumi';
```

`isPerformanceMode` becomes a derived getter during transition for backwards compatibility.

### Chart Slot Mapping

| Slot | Standard              | Performance       | Yamazumi                                      |
| ---- | --------------------- | ----------------- | --------------------------------------------- |
| 1    | I-Chart (individuals) | Cpk Scatter       | I-Chart (lead time, switchable metric)        |
| 2    | Boxplot               | Boxplot           | **Yamazumi Chart** (stacked bars)             |
| 3    | Pareto (count)        | Pareto (Cpk rank) | Pareto (switchable: steps/activities/reasons) |
| 4    | Stats Panel           | Stats Panel       | Yamazumi Summary (VA%, efficiency, takt)      |

The same `DashboardGrid` component is used — each mode composes different chart components into the same slots.

### Mode Switching

Analysts can switch between Standard and Yamazumi views of the same data without re-uploading. A mode selector in the dashboard header enables this. The column mapping captures enough information for both modes (cycle time = outcome, process step/product type = factors, activity type = Yamazumi-specific role).

## Data Model

### Column Roles

```typescript
interface YamazumiColumnMapping {
  activityTypeColumn: string; // Required: column with VA/NVA/Waste/Wait values
  cycleTimeColumn: string; // Required: numeric time column (= outcome)
  stepColumn: string; // Required: process step names
  activityColumn?: string; // Optional: individual activity names
  reasonColumn?: string; // Optional: waste reason/comment text
  productColumn?: string; // Optional: product type for comparison
  waitTimeColumn?: string; // Optional: separate wait-before-step column
  taktTime?: number; // User-entered reference time
}
```

### Activity Type System

Four canonical categories with fixed semantic colors:

| Type         | Color | Hex     | Meaning                        |
| ------------ | ----- | ------- | ------------------------------ |
| VA           | Green | #22c55e | Value-Adding work              |
| NVA Required | Amber | #f59e0b | Necessary but non-value-adding |
| Waste        | Red   | #ef4444 | Eliminable waste (muda)        |
| Wait         | Grey  | #94a3b8 | Queue/wait time between steps  |

Activity type is **always** the stacking dimension — colors never change based on drill level.

```typescript
type ActivityType = 'va' | 'nva-required' | 'waste' | 'wait';

const ACTIVITY_TYPE_COLORS: Record<ActivityType, string> = {
  va: '#22c55e',
  'nva-required': '#f59e0b',
  waste: '#ef4444',
  wait: '#94a3b8',
};
```

### Core Data Types

```typescript
/** One segment within a Yamazumi bar */
interface YamazumiSegment {
  activityType: ActivityType;
  totalTime: number;
  percentage: number; // of this bar's total
  count: number; // rows contributing
}

/** One Yamazumi bar (one process step or category) */
interface YamazumiBarData {
  key: string; // step/category name
  segments: YamazumiSegment[]; // stacked by activity type
  totalTime: number; // sum across all segments
}

/** Summary statistics for Yamazumi mode */
interface YamazumiSummary {
  totalLeadTime: number;
  vaTime: number;
  nvaTime: number;
  wasteTime: number;
  waitTime: number;
  vaRatio: number; // VA / totalLeadTime
  processEfficiency: number; // VA / (VA + NVA Required)
  taktTime?: number;
  stepsOverTakt: string[];
}

type YamazumiIChartMetric = 'total' | 'va' | 'nva' | 'waste' | 'wait';

type YamazumiParetoMode = 'steps-total' | 'steps-waste' | 'steps-nva' | 'activities' | 'reasons';
```

### Row Granularity

The system handles both granularity levels through the same aggregation:

**Activity-level** (many rows per step):

```csv
Step,Activity,Activity_Type,Cycle_Time,Reason
Pick,Get tool,VA,12,
Pick,Walk to shelf,Waste,45,Poor layout
```

**Step-level** (one row per step per activity type):

```csv
Step,Activity_Type,Cycle_Time
Pick,VA,120
Pick,Waste,45
```

Both produce the same Yamazumi bars. The `activityColumn` being present enables deeper drill-down.

### Wait Time

Two input patterns, both supported:

1. Wait rows in the activity type column (value = "Wait") — handled by classification
2. Separate `waitTimeColumn` — aggregation adds as a wait segment per step

## Yamazumi Chart Component

### Visual Design

- Vertical stacked bars, one per process step on X-axis
- Y-axis: cycle time (seconds/minutes, auto-scaled)
- Segments stacked bottom-to-top: VA → NVA Required → Waste → Wait
- Horizontal dashed **takt time line** (like spec limit lines)
- Bars exceeding takt get a subtle indicator
- Click bar → filter drill-down (existing filter navigation)
- Right-click → context menu → pin as Finding (existing pattern)
- Tooltips: segment time, percentage of step total, activity count

### Props Interface

```typescript
interface YamazumiChartProps extends BaseChartProps {
  data: YamazumiBarData[];
  taktTime?: number;
  selectedBars?: string[];
  onBarClick?: (stepKey: string) => void;
  onSegmentClick?: (stepKey: string, activityType: ActivityType) => void;
  onBarContextMenu?: (key: string, event: React.MouseEvent) => void;
  highlightedBars?: Record<string, HighlightColor>;
  showPercentLabels?: boolean;
}
```

Built with `@visx/shape` BarStack + scaleBand/scaleLinear. No new dependencies.

## Switchable I-Chart

The existing I-Chart component is reused with different input data. A toggle in the chart card header switches the Y-axis metric:

| Metric | What it measures                          |
| ------ | ----------------------------------------- |
| Total  | Sum of all activity times + wait per unit |
| VA     | Value-adding time only                    |
| NVA    | NVA Required time only                    |
| Waste  | Waste time only                           |
| Wait   | Wait/queue time only                      |

Each view tells a different story: "Is overall lead time stable?" vs "Is the value-added work consistent even though waste varies?"

The toggle uses a segmented control following the `BoxplotDisplayToggle` pattern.

## Switchable Pareto

The existing Pareto component is reused with different input data. A dropdown switches ranking mode:

| Mode                | X-axis categories     | Y-axis value                 |
| ------------------- | --------------------- | ---------------------------- |
| Steps by Total Time | Process steps         | Sum of all activity times    |
| Steps by Waste Time | Process steps         | Sum of waste time only       |
| Steps by NVA Time   | Process steps         | Sum of NVA time only         |
| Activities by Time  | Individual activities | Cycle time per activity      |
| Waste Reasons       | Unique reason values  | Sum of waste time per reason |

The "Waste Reasons" mode uses the reason/comment column — powerful for root cause identification. Feeds directly into the investigation flow.

## Yamazumi Summary Panel

Replaces the stats panel in Yamazumi mode. Key metrics:

- **VA Ratio**: VA time / total lead time (the lean headline metric)
- **Process Efficiency**: VA / (VA + NVA Required)
- **Total Lead Time**: Sum across all steps
- **Waste Breakdown**: Time and % for each waste type
- **Takt Compliance**: N steps over takt / total steps
- **Steps Over Takt**: List of step names exceeding takt time

## Takt Time

- Set initially in ColumnMapping (alongside spec limits section)
- Adjustable from the Yamazumi summary panel without returning to setup
- Persisted in `YamazumiColumnMapping.taktTime` and `AnalysisState`
- Rendered as horizontal dashed line on Yamazumi chart (same visual as spec limit lines)

## Mode Activation

### Auto-Detection

New function `detectYamazumiFormat()` in parser, called alongside `detectWideFormat()`:

1. Find a categorical column whose values match activity type keywords (VA, NVA, Waste, Wait, Value-Added, Muda, etc.) — at least 60% of unique values match
2. Find a numeric column matching time keywords (cycle, time, duration)
3. Find a categorical column matching step keywords (step, process, station, operation)
4. Confidence: high (all three + keyword match), medium (activity type found), low (uncertain)

### Manual Mapping

ColumnMapping UI gains an "Activity Type" column role option. When assigned, the system suggests Yamazumi mode.

### Confirmation

`YamazumiDetectedModal` follows the `PerformanceDetectedModal` pattern:

- Shows detection confidence and suggested column role assignments
- Allows reviewing/modifying assignments
- Takt time input
- "Enable Yamazumi Mode" / "Use Standard Mode" buttons

### Detection Priority

```
Data uploaded → detectColumns() (always)
             → detectYamazumiFormat() → if detected → YamazumiDetectedModal
             → detectWideFormat()     → if detected → PerformanceDetectedModal
             → otherwise              → ColumnMapping (standard)
```

Yamazumi detection runs first because it's more specific (requires activity type values).

## Investigation Flow Integration

### Findings

Pin from Yamazumi chart via right-click context menu. `FindingSource` is a discriminated union — add a new variant:

```typescript
// Existing variants (unchanged):
| { chart: 'boxplot' | 'pareto'; category: string }
| { chart: 'ichart'; anchorX: number; anchorY: number }

// New variant:
| { chart: 'yamazumi'; category: string; activityType?: ActivityType }
```

Category-based anchoring (like Boxplot/Pareto). The optional `activityType` captures segment-level findings.

### Filter Drill-Down

Uses existing `useFilterNavigation` unchanged:

- Click Step 3 → filter to Step 3 → Yamazumi shows Step 3 by product type (next factor)
- Click Product B → filter to Product B → Yamazumi shows activities within Step 3 / Product B
- Each drill level maintains VA/NVA/Waste/Wait stacking colors

### Hypothesis Tree

Waste categories naturally become investigation branches:

- Finding: "Step 3 has 42% waste time"
- Root hypothesis: "Step 3 waste is caused by equipment issues"
- Sub-hypotheses: "Nozzle tip wear" (data-validated via ANOVA on waste time), "Waiting for material" (gemba-validated)
- The reason column provides initial hypothesis text material

### Improvement Workspace

After investigation converges, the improvement workspace works identically:

- SynthesisCard: "Evidence suggests Step 3 waste is primarily caused by waiting for material (35% of waste) and equipment jams (28%)"
- IdeaGroupCards: Ideas grouped by hypothesis — "Install kanban signal" (prevent), "Add buffer stock" (detect), "Relocate material staging" (eliminate)
- What-If: Simulate takt time impact of removing specific waste categories

## CoScout AI Integration

### Context Building

`useAIContext` extends for Yamazumi mode:

- Yamazumi summary stats (VA ratio, process efficiency, waste breakdown)
- Current drill-down state (focused step, activity type)
- Takt time and steps exceeding it
- Activity type distribution per step
- Waste reasons (if reason column exists)

### NarrativeBar Insights

- "Testing has 42% waste time — highest across all steps"
- "3 of 8 steps exceed takt time (120s)"
- "VA ratio is 58% — Process Efficiency 72%"
- "Waste reason 'Equipment jam' accounts for 35% of total waste"

### ChartInsightChips

- Yamazumi: "Step 5 has 3x more waste than average"
- I-Chart: "Total lead time shows upward trend (Nelson Rule 3)"
- Pareto: "Top 3 waste reasons cover 78% of waste time"

## Tier Availability

All tiers get Yamazumi mode to the extent their existing features allow:

| Feature                                 | PWA (Free)      | Azure Standard  | Azure Team      |
| --------------------------------------- | --------------- | --------------- | --------------- |
| Yamazumi chart + drill-down             | Yes (3 factors) | Yes (6 factors) | Yes (6 factors) |
| I-Chart (switchable metric)             | Yes             | Yes             | Yes             |
| Pareto (switchable mode)                | Yes             | Yes             | Yes             |
| Takt time line                          | Yes             | Yes             | Yes             |
| Yamazumi summary panel                  | Yes             | Yes             | Yes             |
| Sample dataset                          | Yes             | Yes             | Yes             |
| Findings (3 statuses)                   | Yes             | —               | —               |
| Findings (5 statuses) + hypothesis tree | —               | Yes             | Yes             |
| Improvement workspace                   | —               | Yes             | Yes             |
| NarrativeBar + ChartInsightChips        | —               | Yes (AI)        | Yes (AI)        |
| CoScout conversation                    | —               | Yes             | Yes             |

## New Files

### Core (`packages/core/src/yamazumi/`)

| File             | Purpose                                                                                |
| ---------------- | -------------------------------------------------------------------------------------- |
| `types.ts`       | ActivityType, YamazumiColumnMapping, YamazumiBarData, YamazumiSegment, YamazumiSummary |
| `classify.ts`    | classifyActivityType() — normalize strings to ActivityType enum                        |
| `aggregation.ts` | computeYamazumiData(), computeYamazumiSummary()                                        |
| `detection.ts`   | detectYamazumiFormat() — column role inference                                         |
| `index.ts`       | Barrel re-exports                                                                      |

### Charts (`packages/charts/src/`)

| File                | Purpose                                                |
| ------------------- | ------------------------------------------------------ |
| `YamazumiChart.tsx` | YamazumiChartBase + YamazumiChart (responsive wrapper) |

### Hooks (`packages/hooks/src/`)

| File                       | Purpose                                                    |
| -------------------------- | ---------------------------------------------------------- |
| `useYamazumiChartData.ts`  | Raw rows → YamazumiBarData[], handles drill-down filtering |
| `useYamazumiIChartData.ts` | Aggregates per-unit time series, supports metric switching |
| `useYamazumiParetoData.ts` | Pareto data prep with mode switching (5 modes)             |

### UI (`packages/ui/src/components/`)

| File                              | Purpose                                      |
| --------------------------------- | -------------------------------------------- |
| `YamazumiDetectedModal/index.tsx` | Auto-detection confirmation modal            |
| `YamazumiDisplayToggle/index.tsx` | I-Chart metric toggle + Pareto mode dropdown |
| `YamazumiSummaryBar/index.tsx`    | Summary statistics panel                     |

### Data (`packages/data/src/samples/`)

| File               | Purpose                                                  |
| ------------------ | -------------------------------------------------------- |
| `assembly-line.ts` | Sample dataset: electronics assembly, 8 steps, ~200 rows |

### App-Level

| File                                               | Purpose                            |
| -------------------------------------------------- | ---------------------------------- |
| `apps/*/src/components/YamazumiDashboard.tsx`      | Dashboard layout for Yamazumi mode |
| `apps/*/src/components/charts/YamazumiWrapper.tsx` | App wrapper for YamazumiChartBase  |

## Modified Files

| File                                                 | Change                                                          |
| ---------------------------------------------------- | --------------------------------------------------------------- |
| `packages/core/src/types.ts`                         | Add `AnalysisMode` type, extend `FindingSource`                 |
| `packages/core/src/parser/detection.ts`              | Add `detectYamazumiFormat()` call                               |
| `packages/core/src/parser/keywords.ts`               | Add activity type keywords                                      |
| `packages/core/src/i18n/en.ts`                       | Add `yamazumi.*` keys                                           |
| `packages/charts/src/index.ts`                       | Export YamazumiChart                                            |
| `packages/hooks/src/useDataState.ts`                 | `analysisMode` replaces `isPerformanceMode`, add yamazumi state |
| `packages/hooks/src/useDataIngestion.ts`             | Wire in Yamazumi detection                                      |
| `packages/hooks/src/useAIContext.ts`                 | Yamazumi context for CoScout                                    |
| `packages/hooks/src/useChartCopy.ts`                 | Add yamazumi export dimensions                                  |
| `packages/ui/src/components/ColumnMapping/index.tsx` | Activity type column role, takt time input                      |
| `packages/data/src/samples/index.ts`                 | Register assembly-line sample                                   |
| `apps/*/src/context/DataContext.tsx`                 | analysisMode state, Yamazumi mapping                            |
| `apps/*/src/components/Dashboard.tsx`                | Mode switching, Yamazumi dashboard rendering                    |

## Implementation Sequence

### Phase 1: Core Types + Aggregation (no UI)

1. `packages/core/src/yamazumi/types.ts`
2. `packages/core/src/yamazumi/classify.ts` + tests
3. `packages/core/src/yamazumi/aggregation.ts` + tests
4. `packages/core/src/yamazumi/detection.ts` + tests
5. `packages/core/src/types.ts` — add `AnalysisMode`, extend `FindingSource`

### Phase 2: Chart Component

1. `packages/charts/src/YamazumiChart.tsx` (Base + wrapper)
2. Chart tests
3. Export from `packages/charts/src/index.ts`

### Phase 3: Hooks + Data Pipeline

1. `useYamazumiChartData.ts` + tests
2. `useYamazumiIChartData.ts` + tests
3. `useYamazumiParetoData.ts` + tests

### Phase 4: UI Components + State

1. `YamazumiDetectedModal`
2. `YamazumiDisplayToggle`
3. `YamazumiSummaryBar`
4. Extend DataState, AnalysisState

### Phase 5: App Integration

1. YamazumiDashboard in both apps
2. Detection flow in useDataIngestion
3. Mode switching UI
4. Sample dataset
5. i18n keys
6. CoScout context extensions

### Phase 6: Cleanup

1. Refactor `isPerformanceMode` → `analysisMode` across codebase
2. E2E tests

## Verification

### Unit Tests

- `classify.test.ts`: All string variants normalize correctly, unknown values handled
- `aggregation.test.ts`: Both granularity levels produce correct bars, wait time handling
- `detection.test.ts`: Auto-detection with various column names and value patterns
- Hook tests: Metric switching, mode switching, filter interaction

### Integration Tests

- Load sample dataset → verify detection modal appears
- Confirm Yamazumi mode → verify chart renders with correct stacking
- Drill-down → verify filter navigation updates all charts
- Pin finding → verify finding source includes yamazumi chart type
- Switch metric on I-Chart → verify data changes
- Switch Pareto mode → verify ranking changes

### E2E Tests

- Full flow: load sample → detect → confirm → drill → pin finding → investigate → improve
- Mode switching: Standard ↔ Yamazumi on same data
- Takt time: set in ColumnMapping, adjust in summary panel, verify line on chart

## Migration Notes

### `isPerformanceMode` → `analysisMode`

The boolean flag appears in ~26 files. Migration strategy:

1. Add `analysisMode: AnalysisMode` alongside `isPerformanceMode`
2. Add derived getter: `isPerformanceMode = analysisMode === 'performance'`
3. Saved projects with `isPerformanceMode: true` in `AnalysisState` map to `analysisMode: 'performance'` on load
4. Incrementally replace direct `isPerformanceMode` references
5. Remove the boolean in Phase 6

### Mobile Layout

PWA phone layout uses `MobileChartCarousel` (4 views). In Yamazumi mode, the carousel shows: Yamazumi chart → I-Chart → Pareto → Summary. The mode selector lives in the mobile header menu (same location as existing display toggles). `MobileCategorySheet` works for Yamazumi bars (tap bar → bottom sheet with step stats, drill, highlight, pin-as-finding).

### Detection Priority

Yamazumi detection runs before Performance detection because it's more specific (requires activity type column values). A dataset is unlikely to match both — wide-format data (many numeric columns) is structurally different from Yamazumi data (categorical activity type + single numeric time column). If both somehow match, Yamazumi takes priority and the user can decline to fall through to Performance detection.

### Chart Export Dimensions

```typescript
// Add to EXPORT_SIZES in useChartCopy.ts
yamazumi: { width: 1200, height: 800 },  // same as boxplot
```
