---
title: Defect Analysis Mode
audience: [engineer, analyst]
category: analysis
status: delivered
related: [defect, pareto, aggregation, mode, strategy-pattern, copq]
---

# Defect Analysis Mode

## Context

VariScout's 3 implemented analysis modes (standard, performance, yamazumi) all assume continuous measurement data as Y. A 4th mode (process-flow) is designed but not yet implemented. Users with defect/error data — event logs, defect counts, pass/fail outcomes — can paste it today, but the statistical treatment is wrong: I-Chart control limits assume normality, Cpk is meaningless for counts, and there's no aggregation step to convert raw events into analyzable rates.

The COPQ drill-down use case (`docs/02-journeys/use-cases/copq-drilldown.md`) demonstrates that the Four Lenses already work well for defect exploration once data is in the right shape. The missing piece is a **data transformation layer** and a **mode-specific strategy** that makes defect data a first-class citizen.

## Design Principle

**Turn defect data into rates, then use the existing Four Lenses.** No new chart types. No Poisson/binomial engine. The aggregation step converts raw defect events into "defects per [time unit]" — a numeric Y that the existing I-Chart, Boxplot, Pareto, and ANOVA handle naturally. This is unconventional (vs. traditional p/c/u/np-charts) but leverages VariScout's strength: simultaneous multi-lens investigation with progressive drill-down.

## Data Shapes Supported

Defect data arrives in three shapes:

### Event Log (one row per defect)

```
Date,       DefectType, Machine, Shift, Product
2026-01-15, Scratch,    M3,      Day,   Widget-A
2026-01-15, Dent,       M1,      Day,   Widget-B
2026-01-15, Scratch,    M3,      Night, Widget-A
```

### Pre-aggregated Counts (one row per period)

```
Date,       Shift, DefectCount, UnitsProduced, ScrapCost
2026-01-15, Day,   12,          500,           $240
2026-01-15, Night, 23,          480,           $460
```

### Pass/Fail (one row per unit)

```
UnitID, Result,  Machine, Shift, Product
U001,   OK,      M1,      Day,   Widget-A
U002,   NG,      M3,      Day,   Widget-B
U003,   OK,      M2,      Night, Widget-A
```

## End-to-End Flow

Follows the established mode pattern (yamazumi detection → modal → column mapping → dashboard):

### 1. Paste / Upload

User pastes or uploads defect data. Parser runs `detectColumns()` as usual.

### 2. Auto-Detection

New `detectDefectFormat()` function runs in parallel with yamazumi and wide-format detection. Detection signals:

- **Event log**: Categorical column with defect-type keywords (`defect`, `error`, `failure`, `reject`, `nonconforming`, `scrap`, `fault`, `issue`) AND no continuous numeric outcome column
- **Pre-aggregated**: Numeric column with count keywords (`count`, `defects`, `errors`, `rejects`, `failures`, `qty_defective`) AND a time/batch grouping column
- **Pass/fail**: Categorical column with exactly 2 unique values matching pass/fail patterns (`OK/NG`, `Pass/Fail`, `Good/Bad`, `Conforming/Nonconforming`, `0/1`, `Y/N`)

Returns `DefectDetection` with `isDefectFormat`, `confidence` (high/medium/low), `dataShape` (`'event-log' | 'pre-aggregated' | 'pass-fail'`), and `suggestedMapping`.

### 3. DefectDetectedModal

Mirrors YamazumiDetectedModal and PerformanceDetectedModal:

- Detection confidence badge
- Detected data shape indicator
- Suggested column roles:
  - **Defect type column** (for event log / pre-aggregated)
  - **Count column** (for pre-aggregated; event log = 1 per row)
  - **Result column** (for pass/fail)
  - **Units produced column** (optional — enables rate normalization)
  - **Cost/time columns** (optional — enables Pareto value POVs)
- **Aggregation unit selector**: which column to group by for the I-Chart X-axis
  - Auto-suggests based on detected columns (time extraction columns, batch, shift)
  - If timestamp detected: offers Hour, Day, Week, Month (via existing TimeExtractionPanel logic)
  - If categorical grouping column exists (shift, batch, lot): offers those directly
- "Enable Defect Mode" vs "Use Standard Mode" buttons

### 4. Column Mapping

Standard ColumnMapping with defect-specific additions:

- **Defect type column** shown as assigned role (like outcome in standard mode)
- **Aggregation unit** shown and editable (the grouping column for I-Chart)
- **Factor columns** available for drill-down (machine, product, line, operator)
- **TimeExtractionPanel** available if timestamp column detected (existing feature)
- **Spec limits section hidden** (Cpk not applicable)
- **Optional columns**: units produced (for rate denominator), cost, duration

### 5. Mode Transform — Aggregation

Defect mode applies a **mode transform** before analysis — the same pattern used by yamazumi (`computeYamazumiData()` aggregates activities per step) and planned for process-flow (`computeFlowData()` derives cycle times from timestamps). Each mode that needs a transform produces a working dataset that all four chart slots consume.

```
Raw data → Mode Transform → Working dataset → All charts + ANOVA + Best Subsets
                                ↑
                          Filters trigger re-transform
```

The working dataset IS the analysis data. All four charts, ANOVA, and Best Subsets operate on the transformed rows. No dual data paths.

#### `computeDefectRates()` — the defect mode transform

**Event log → aggregated rates:**

```
Input:  N rows (one per defect event)
Group by: [aggregation unit] (e.g., Shift column or Date_Hour)
Output: M rows (one per aggregation group), columns:
  - [aggregation unit]: the grouping value (I-Chart X-axis)
  - DefectCount: count of events in group (numeric Y)
  - DefectRate: count / units_produced (if available), else raw count
  - [defect type]: preserved as factor (Boxplot/Pareto grouping)
  - [other factors]: preserved (machine, product, line — for drill-down)
```

Factor preservation: each aggregation group may span multiple factor values (e.g., a shift has events from multiple machines). For event logs, the defect type column becomes a cross-tabulation dimension — the transform produces one row per [aggregation unit × defect type], so Boxplot can show rate by type and Pareto can rank types.

**Pre-aggregated → pass through:**
Count column becomes Y. No transformation needed beyond column role assignment. The value of defect mode for pre-aggregated data: DefectSummary panel (Slot 4), CoScout defect coaching, Pareto factor switching, and question strategy tuned for defect investigation.

**Pass/fail → aggregated rates:**

```
Input:  N rows (one per unit)
Group by: [aggregation unit]
Output: M rows, columns:
  - [aggregation unit]: grouping value
  - DefectCount: count of fail/NG rows in group
  - DefectRate: fail_count / total_count_in_group (proportion defective)
  - [factors]: preserved
```

#### How each chart uses the transformed data

| Chart                  | What it receives                                                   | What it shows                            |
| ---------------------- | ------------------------------------------------------------------ | ---------------------------------------- |
| I-Chart (Slot 1)       | Aggregated rows, Y = DefectRate                                    | Rate over time per [aggregation unit]    |
| Boxplot (Slot 2)       | Aggregated rows, grouped by defect type (L1) or machine/shift (L2) | Rate distribution per category           |
| Pareto (Slot 3)        | Aggregated rows, grouped by switchable factor                      | Category ranking (freq/time/cost POVs)   |
| ANOVA                  | Aggregated rows, Y = DefectRate, factor = selected column          | η² for factor contribution               |
| DefectSummary (Slot 4) | Derived from aggregated rows                                       | Total, rate, trend, top type, top factor |

### 6. Re-Aggregation on Drill-Down

When the user filters to a specific defect type (Level 2 drill-down), the mode transform **re-runs on the filtered raw data**, producing a new working dataset:

1. User clicks "Type A" in Pareto → filter applied to raw data
2. `computeDefectRates()` re-runs on filtered events (Type A only)
3. New working dataset: Type A rate per [aggregation unit], with remaining factors preserved
4. I-Chart: shows Type A-only rate over time (may reveal different pattern than total)
5. Boxplot: factor switches from "defect type" to next best factor (machine, shift, line) — suggested by η² on re-aggregated data
6. Pareto: user can switch grouping to see composition (which machines, products contribute to Type A)

This reactive re-aggregation uses the same filter → transform → render pipeline. Implementation: a `useDefectTransform` hook that depends on `useFilteredData` output and `defectMapping` config, recomputing via `useMemo` when either changes.

## Strategy Registration

### Type Changes

Both `AnalysisMode` and `ResolvedMode` must be extended:

```typescript
// packages/core/src/types.ts
type AnalysisMode = 'standard' | 'performance' | 'yamazumi' | 'defect';

// packages/core/src/analysisStrategy.ts
type ResolvedMode = 'standard' | 'capability' | 'performance' | 'yamazumi' | 'defect';
```

**Breaking change**: Adding `'defect'` to `AnalysisMode` requires updates to all `Record<AnalysisMode, string>` patterns across the codebase (~10-15 files), including:

- `packages/core/src/ai/prompts/coScout/modes/index.ts` (mode dispatch)
- Phase coaching files (`frame.ts`, `scout.ts`, `investigate.ts`, `improve.ts`)
- `packages/core/src/ai/__tests__/coScoutPhases.test.ts` (iterates `ALL_MODES`)
- Any UI component with exhaustive mode switches

### resolveMode() Update

```typescript
if (mode === 'defect') return 'defect';
```

### Chart Slot Types

```typescript
// New ChartSlotType values (added to existing union in analysisStrategy.ts)
type ChartSlotType = ... | 'defect-summary';
// Slots 1-3 reuse standard types: 'ichart', 'boxplot', 'pareto'
// All charts receive the mode-transformed working dataset — aggregation is transparent to the chart layer
```

### Chart Slots

| Slot | Lens    | ChartSlotType      | Role                                                                |
| ---- | ------- | ------------------ | ------------------------------------------------------------------- |
| 1    | CHANGE  | `'ichart'`         | Aggregated rate over time. Brush to select spike periods.           |
| 2    | FLOW    | `'boxplot'`        | L1: rate by defect type. L2+: by machine/shift/line. η² ranking.    |
| 3    | FAILURE | `'pareto'`         | Existing freq/time/cost POVs. Factor selector for composition view. |
| 4    | VALUE   | `'defect-summary'` | Total defects, rate, trend, top type, top factor. Replaces Cpk.     |

### KPI and Metrics

- **KPI component**: `'defect'` (requires `'defect'` in `ResolvedMode` — see above)
- **Metric label**: `'Defect Rate'` (or `'Defects/Unit'` if units produced available)
- **Format**: `(v: number) => units produced ? `${v.toFixed(1)}/unit` : `${Math.round(v)}`
- **Report title**: `'Defect Analysis'`
- **Report sections**: `['current-condition', 'drivers', 'evidence-trail', 'learning-loop']` (same as standard)
- **AI tool set**: `'standard'` (reuses standard tools — defect mode uses same chart types)

### Question Strategy

```typescript
{
  generator: 'defectAnalysis',  // new value — add to QuestionStrategy.generator union
  evidenceMetric: 'rSquaredAdj',
  evidenceLabel: 'R²adj',
  validationMethod: 'anova',
  questionFocus: 'defect type contribution and factor-driven defect variation'
}
```

Question generation priorities:

1. Which defect type dominates? (Pareto-driven)
2. Which factor explains variation in defect rate? (ANOVA η²)
3. Is defect rate stable over time? (I-Chart trend / Nelson rules)
4. After drill-down: which sub-factor drives this specific defect type?

## Defect Summary Panel (Slot 4)

Replaces the Stats/Capability panel. Displays:

- **Total defects**: raw count across all data
- **Defect rate**: per unit if denominator available, else per [aggregation unit]
- **Trend**: arrow indicator (↑ increasing, → stable, ↓ decreasing) based on I-Chart regression
- **Top defect type**: highest frequency type + its percentage
- **Top contributing factor**: highest η² factor + its value
- **80/20 indicator**: how many types account for 80% of defects (Pareto principle)

## CoScout Coaching (Defect Mode)

### Terminology

Use: defect type, failure mode, defect rate, escape rate, containment, corrective action, Pareto principle, 80/20, frequency, composition, contributing factor

Never use: Cpk, Cp, specification limits, capability index

Nelson rules: Valid on aggregated defect rates (which are approximately continuous). Not valid on raw event counts. CoScout should apply Nelson rules to the I-Chart (which shows aggregated rates) but never reference them in the context of individual defect events.

### Phase-Specific Guidance

- **FRAME**: "What is the defect problem?" — total rate, cost impact, trend direction
- **SCOUT**: "Where do defects concentrate?" — Pareto for top types, Boxplot for factor comparison, I-Chart for temporal patterns
- **INVESTIGATE**: "What drives this defect type?" — drill into specific type, η² factor ranking, brush spike periods for composition analysis
- **IMPROVE**: "How to reduce defects?" — target top Pareto contributor, containment vs prevention, estimate rate reduction

## Pareto Enhancement: Factor Switching

In defect mode, the Pareto gains enhanced factor switching. The existing `paretoFactor` selector (which factor the Pareto groups by) becomes more prominent:

- Default: group by defect type (frequency/time/cost POVs)
- User can switch to: machine, product, line, shift, operator — any factor column
- This answers "what's the composition?" from different angles
- Combined with filter chips: filter to Type A → switch Pareto to "by machine" → see which machines produce Type A

This enhancement uses existing Pareto infrastructure (`useParetoChartData` with different factor selection). No new chart component needed.

## Detection Logic

### Keywords

```typescript
const DEFECT_TYPE_KEYWORDS = [
  'defect',
  'defect_type',
  'defect_category',
  'error',
  'error_type',
  'failure',
  'failure_mode',
  'reject',
  'reject_reason',
  'fault',
  'issue',
  'issue_type',
  'nonconformance',
  'nc_type',
  'scrap_reason',
];

const DEFECT_COUNT_KEYWORDS = [
  'count',
  'defect_count',
  'defects',
  'errors',
  'rejects',
  'failures',
  'qty_defective',
  'nc_count',
  'scrap_count',
];

const PASS_FAIL_VALUES = [
  ['OK', 'NG'],
  ['Pass', 'Fail'],
  ['Good', 'Bad'],
  ['Conforming', 'Nonconforming'],
  ['0', '1'],
  ['Y', 'N'],
  ['Accept', 'Reject'],
  ['Go', 'NoGo'],
];
```

### Confidence Levels

- **High**: defect type keyword column + (count keyword column OR event log with no numeric Y)
- **Medium**: pass/fail pattern detected (2-value categorical matching known patterns) AND column name matches pass/fail keywords (`result`, `status`, `outcome`, `pass_fail`, `verdict`, `judgment`)
- **Low**: count keyword column exists but no defect type column (could be standard count data); OR 2-value categorical detected without keyword match in column name (to avoid false positives on arbitrary binary 0/1 columns)

### Detection Priority

When defect detection runs in parallel with standard `detectColumns()`:

- If `detectDefectFormat()` returns `confidence: 'high'` → show DefectDetectedModal (user can still decline and use standard mode)
- If `confidence: 'medium'` → show DefectDetectedModal with "not sure" framing
- If `confidence: 'low'` → do not show modal, proceed as standard mode
- The user always has the choice: "Enable Defect Mode" vs "Use Standard Mode". Standard mode remains valid for pre-aggregated defect data where the user wants to treat counts as a continuous Y.

## Defect Mode Column Mapping Configuration

```typescript
interface DefectMapping {
  dataShape: 'event-log' | 'pre-aggregated' | 'pass-fail';
  defectTypeColumn?: string;
  countColumn?: string;
  resultColumn?: string;
  aggregationUnit: string;
  unitsProducedColumn?: string;
  costColumn?: string;
  durationColumn?: string;
}
```

Uses `undefined` (not `null`) for absent optional columns, consistent with projectStore conventions.

Stored in `projectStore` alongside `yamazumiMapping` and `measureColumns`.

## What's Reused vs. New

### Reused (existing infrastructure)

- I-Chart component + brush selection + useMultiSelection
- Boxplot component + factor selector + BoxplotDisplayToggle
- Pareto chart + frequency/time/cost POVs + useParetoChartData
- Filter chips + progressive drill-down
- ANOVA + η² factor ranking
- Best Subsets regression + Evidence Map
- Investigation workflow + question-driven EDA
- Strategy pattern + resolveMode()
- Detection modal pattern (YamazumiDetectedModal as template)
- Column mapping framework + TimeExtractionPanel
- Create Factor from brush selection
- ProcessHealthBar (mode-aware metrics)
- CoScout prompt architecture (mode dispatch)

### New (to build)

1. `detectDefectFormat()` — detection logic in `@variscout/core`
2. `DefectDetectedModal` — in `@variscout/ui` (mirrors YamazumiDetectedModal)
3. Aggregation transform engine — in `@variscout/core`
4. Re-aggregation on filter (drill-down) — in `@variscout/hooks`
5. Defect mode column mapping fields — in ColumnMapping component
6. `DefectSummary` panel — in `@variscout/ui` (Slot 4)
7. Strategy entry + chart slot types — in `analysisStrategy.ts`
8. CoScout defect mode coaching — in `packages/core/src/ai/prompts/coScout/modes/defect.ts`
9. Question strategy: `defectAnalysis` generator — in `@variscout/core`
10. Parser keyword additions — `DEFECT_TYPE_KEYWORDS`, `DEFECT_COUNT_KEYWORDS`, `PASS_FAIL_VALUES`
11. Pareto factor switching enhancement — UI prominence in defect mode

## Phasing

### Phase 1 — Foundation

- Detection logic + DefectDetectedModal
- Aggregation transform (event log + pre-aggregated shapes)
- Strategy registration (mode type, chart slots, KPI)
- DefectSummary panel (basic: total, rate, top type)
- Defect mode CoScout coaching (terminology + 4-phase guidance)
- Question strategy generator
- Sample dataset for testing

### Phase 2 — Full Drill-Down (delivered)

- Re-aggregation on filter change (reactive via useDefectTransform)
- Pareto factor switching (FactorSelectorDropdown in defect mode)
- Pass/fail data shape support (detection + transform)
- Rate normalization (defects per N units via unitsProducedColumn)
- Cost/duration column integration for Pareto value POVs (CostTotal/DurationTotal)
- DefectSummary panel (full: trend via split-half, top factor, 80/20)
- Boxplot auto-suggest after drill-down (switches to first non-defect-type factor)

### Phase 3 — Investigation Depth

- Defect-specific question templates
- Evidence Map integration (defect type nodes)
- Report template for defect mode
- CoScout deep coaching (containment vs prevention, escape rate)

## Verification

1. **Detection**: Paste packaging defects dataset (`docs/04-cases/packaging/defects.csv`) → DefectDetectedModal should appear with high confidence
2. **Aggregation**: Confirm I-Chart shows defect rate per time unit, not raw event rows
3. **Drill-down**: Click a defect type in Pareto → I-Chart re-aggregates for that type only, Boxplot switches factor
4. **Brush + composition**: Brush spike on I-Chart → Create Factor → Pareto shows composition of spiking period
5. **Pareto POVs**: Toggle frequency/time/cost → values change correctly
6. **Factor switching**: Switch Pareto grouping from defect type to machine → see machine composition
7. **CoScout**: Verify defect terminology in coaching, no Cpk/capability language
8. **Mode persistence**: Save and reload project → defect mode and aggregation config preserved
