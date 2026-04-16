---
title: Process Flow Analysis Mode
audience: [analyst, engineer]
category: analysis
status: draft
related: [process-flow, yamazumi, output-rate, bottleneck, lead-time, theory-of-constraints]
date: 2026-04-07
---

# Process Flow Analysis Mode

## Origin

MBB expert discussion (2026-03-29, "Probability plot and commenting" transcript, 00:26–05:06): the analyst needs to see **output rate at individual process stations**, not just end-of-line results. The probability plot of overall line output shows inflection points corresponding to station transitions. Breaking into per-station output rates, each station is normally distributed — and the flattest slope (slowest rate) is the priority to fix. "For that you would need to have the output of the individual process steps."

## Concept

**Process Flow** is VariScout's fifth analysis mode. It lets the analyst investigate how output rate, cycle time, and lead time vary across a sequential production line — and pinpoint which station or which wait between stations causes variation in overall line performance.

The analyst's journey:

1. Pastes process data (one row per product, start/end timestamps per station)
2. Parser detects paired timestamp columns → offers Process Flow mode
3. Flow Transform derives: cycle time per station, wait times between stations, lead time, output rate
4. Dashboard shows the sequential flow — bottleneck highlighted, variation sources visible
5. Investigation asks: "Which station's cycle time explains line output variation?"
6. If Yamazumi activity data exists for a station, drill down into activity breakdown (Phase 2)

**Y options:** Output rate (primary), Lead time, or any test result column (quality angle — Phase 3).

**What it is NOT:** Not a process mapping tool, not a simulation, not a scheduling system. It is variation analysis applied to sequential process flow data.

## Three-Level Drill-Down

The analyst moves between three levels:

1. **Line level** — Overall output rate / lead time variation (I-Chart). "My line performance varies."
2. **Station level** — Per-station cycle time and wait time distributions (Flow Boxplot). "Station 3 is the bottleneck, Wait 2→3 has high variation."
3. **Activity level** — What's happening inside a slow station (Yamazumi drill-down, Phase 2). "Station 3's waste time in Activity X drives its high cycle time."

## Data Model

### Input Data Shape

One row per product flowing through the line. Wide-form with paired timestamp columns per station, plus optional categorical factors and continuous test results.

```
ProductID | St1_Start  | St1_End   | St2_Start  | St2_End   | St3_Start  | St3_End   | Operator | Shift | Weight
P001      | 08:00:00   | 08:00:45  | 08:01:02   | 08:01:54  | 08:02:10   | 08:02:58  | Anna     | Day   | 12.3
P002      | 08:00:48   | 08:01:31  | 08:01:45   | 08:02:39  | 08:02:50   | 08:03:41  | Bob      | Day   | 12.5
P003      | 08:01:35   | 08:02:22  | 08:02:40   | 08:03:28  | 08:03:45   | 08:04:38  | Anna     | Night | 12.1
```

Optional per-station factor columns for parallel machines:

```
... | St2_Start | St2_End | St2_Machine | ...
    | 08:01:02  | 08:01:54| Machine A   |
    | 08:01:45  | 08:02:39| Machine B   |
```

### Parser Detection

Recognizes paired timestamp/datetime columns with matching prefixes. Detection heuristic:

1. Find columns with datetime/timestamp values
2. Group by common prefix (e.g., `Station1_Start` / `Station1_End`, or `St1_Begin` / `St1_Finish`)
3. Minimum 2 station pairs to suggest Process Flow
4. Column order defines station sequence (critical — do not normalize away the ordering)
5. Tolerance for naming variations: Start/End, Begin/Finish, In/Out, \_start/\_end

Result: `FlowSuggestion` offered to analyst alongside existing `StackSuggestion`.

### Flow Transform

After analyst confirms the flow mapping, derive computed columns:

| Derived column               | Calculation                                                                                                                                                                                                    | Purpose                     |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------- |
| `{Station}_CycleTime`        | Station_End - Station_Start                                                                                                                                                                                    | Station processing time     |
| `Wait_{StationA}→{StationB}` | StationB_Start - StationA_End                                                                                                                                                                                  | Time between stations       |
| `LeadTime`                   | Last Station End - First Station Start                                                                                                                                                                         | Total flow time per product |
| `{Station}_OutputRate`       | Units per configured time period at each station. Computed from inter-departure times (sort products by station End time, compute successive differences, convert to rate using analyst-configured time unit). | Actual station output rate  |
| `LineOutputRate`             | Units per configured time period from the last station. Same inter-departure calculation applied to the final station.                                                                                         | Actual line output rate     |

All derived columns become first-class columns in the dataset. They flow through the entire VariScout pipeline: column mapping, analysis, investigation, improvement — unchanged.

### FlowConfig

Stored alongside `StackConfig` in project configuration:

```typescript
interface FlowConfig {
  stations: FlowStation[]; // Ordered sequence
  primaryY: 'outputRate' | 'leadTime' | string; // Which derived column is Y
  rateUnit: 'minute' | 'hour' | 'day' | 'shift'; // Output rate time unit (e.g., units/hour)
}

interface FlowStation {
  name: string; // Display name (e.g., "Station 1", "Filling")
  startColumn: string; // Source column name
  endColumn: string; // Source column name
  order: number; // Sequence position
  factorColumns?: string[]; // Per-station factors (e.g., Machine)
}
```

### Column Mapping UX

After detection, analyst confirms or adjusts:

- Station names and sequence order
- Which additional columns are factors vs test results
- Primary Y (output rate or lead time)
- Output rate time unit: per minute, per hour, per day, or per shift (like setting spec limits in capability mode)
- Per-station factor assignments (e.g., "St2_Machine applies to Station 2")

Similar interaction to how StackConfig is confirmed today.

## Dashboard Layout (4 Slots)

Strategy pattern definition for Process Flow mode:

| Slot       | Chart               | Purpose                                                                                                                                                                                                                                                                 |
| ---------- | ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Slot 1** | Line Output I-Chart | Output rate or lead time over time. Entry point: "My line performance varies." Uses existing `IChart` component with derived Y column.                                                                                                                                  |
| **Slot 2** | Flow Boxplot        | Station CTs and wait times interleaved in sequence order. Visual distinction: station CTs = solid blue boxes, wait times = dashed grey boxes (narrower). Bottleneck station highlighted red, high-variation waits highlighted amber. Flow direction arrow along bottom. |
| **Slot 3** | Station Pareto      | Stations and waits ranked by R²adj contribution to Y variation. Uses existing `Pareto` component with flow-derived variables as categories.                                                                                                                             |
| **Slot 4** | Flow Summary        | Lead time (mean, range), flow efficiency (processing time / lead time), bottleneck station identification, takt time comparison if specification exists.                                                                                                                |

### Flow Boxplot (Slot 2) — New Visualization

The key new chart for this mode. Interleaves station cycle times and wait times in process sequence order.

**Visual rules:**

- Boxes always in process flow order (left to right) — never re-sorted by spread or mean
- Station CT boxes: solid border, standard width, blue color family
- Wait time boxes: dashed border, narrower width, grey color family
- Bottleneck station (longest median CT): highlighted red
- High-variation wait (top contributor to Y variation): highlighted amber
- Flow direction arrow below x-axis
- Dot plot fallback for < 7 observations per station (existing `MIN_BOXPLOT_VALUES` rule)

**Interaction:**

- Hover: tooltip shows station name, median CT, IQR, observation count
- Click station: if per-station factor exists, split into side-by-side boxes (parallel machine drill-down)
- Right-click: context menu for adding observation (existing annotation pattern)

### Strategy Pattern Entry

```typescript
// In analysisStrategy.ts
processFlow: {
  chartSlots: {
    slot1: 'lineOutputIChart',
    slot2: 'flowBoxplot',
    slot3: 'stationPareto',
    slot4: 'flowSummary'
  },
  kpiComponent: 'processFlow',
  questionStrategy: {
    generator: 'flowAnalysis',
    evidenceMetric: 'rSquaredAdj',
    validationMethod: 'anova',
    questionFocus: 'station cycle time and wait time variation'
  },
  reportTitle: 'Process Flow Analysis',
  metricLabel: 'Cycle Time'
}
```

## Question Strategy

Question generator `flowAnalysis` produces sequence-aware questions:

| Question type             | Example                                                                               | Evidence metric                   |
| ------------------------- | ------------------------------------------------------------------------------------- | --------------------------------- |
| Bottleneck identification | "Station 3 has the longest median cycle time (55s) — it constrains line output"       | Median CT comparison              |
| Variation contribution    | "Station 3 CT explains 42% of lead time variation"                                    | R²adj from best subsets           |
| Wait time investigation   | "Wait 2→3 explains 28% of lead time variation — products queue before the bottleneck" | R²adj                             |
| Factor within station     | "Machine at Station 2 explains 61% of Station 2 CT variation"                         | ANOVA within station              |
| Downstream propagation    | "When Station 2 CT exceeds 50s, Wait 2→3 increases by 15s on average"                 | Interaction / correlation         |
| Cross-factor              | "Night shift has 23% longer lead time — driven by Station 3 CT increase"              | Best subsets with Shift as factor |

All questions use the existing stats engine (best subsets, ANOVA). The flow question generator frames results in process flow language but computes nothing new.

## CoScout Integration

Mode-specific methodology coaching for Process Flow:

- Theory of Constraints language: bottleneck, constraint, throughput
- Flow thinking: lead time, flow efficiency, WIP accumulation (conceptual, not calculated)
- Sequential reasoning: "upstream variation propagates downstream"
- Lean connections: links to Yamazumi when activity data available

Coaching delivered via the existing modular prompt architecture (`packages/core/src/ai/prompts/coScout/modes/`).

## Investigation Flow

1. **FRAME** — Parser detects timestamp pairs → Flow Transform → derived columns
2. **SCOUT** — Dashboard reveals bottleneck and variation sources across the flow
3. **INVESTIGATE** — Questions guide drill-down: "Station 3 CT is biggest contributor" → drill into Station 3 factors → create SuspectedCause hub: "Station 3 cycle time variation"
4. **IMPROVE** — What-If: "If Station 3 CT reduces by 8s, lead time improves by X, output rate increases by Y" → improvement actions

The derived columns (station CTs, wait times, lead time) participate in all existing investigation machinery: Evidence Map, causal links, SuspectedCause hubs, What-If projections.

## Connections to Existing Modes

| Connection                                | How it works                                                                                      |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------- |
| **Yamazumi drill-down** (Phase 2)         | Click bottleneck station → view activity breakdown if Yamazumi data exists                        |
| **Standard mode quality angle** (Phase 3) | Switch Y to test result (Weight) → flow columns become factors → "Does slow flow affect quality?" |
| **Evidence Map**                          | Station CT and wait time nodes appear as factors, causal links show flow relationships            |
| **What-If**                               | "Reduce Station 3 CT by 8s" → model projects impact on lead time and output rate                  |
| **Performance mode**                      | If a station has parallel machines, per-station analysis resembles channel comparison             |

## Parallel Stations

Parallel machines at a station (e.g., Machine A and Machine B at Station 2) do not break the sequential model:

- The flow is still Station 1 → Station 2 → Station 3
- Machine is a **factor within Station 2**, stored as a per-station factor column in FlowConfig
- Aggregated view: Station 2 shows as one box (all observations)
- Drill-down: click Station 2 → split by Machine → side-by-side boxes within the station position
- Investigation: "Does Machine explain variation at Station 2?" — standard ANOVA

## Phasing

### Phase 1 — Foundation (this spec)

- Parser detection for paired timestamp columns
- Flow Transform: derive cycle times, wait times, lead time, output rate
- FlowConfig model
- Column mapping UX for confirming station sequence
- Process Flow mode in strategy pattern
- Flow Boxplot (interleaved CTs and waits)
- Station Pareto by variation contribution
- Flow Summary panel
- Line Output I-Chart (existing component with derived Y)
- CoScout methodology coaching
- Basic question generator (bottleneck, variation contribution, cross-factor)

### Phase 2 — Investigation Depth

- Parallel station drill-down (split by per-station factor)
- Yamazumi bridge (drill into station activity breakdown)
- Flow-specific Evidence Map layout (stations in sequence)
- What-If projections for flow improvements
- Downstream propagation questions

### Phase 3 — Advanced

- Quality angle (test result as Y with flow columns as factors)
- Probability plot integration (when probability plots ship — per-station slope comparison)
- Process flow report template
- Sample dataset for demos/training

### Not in Scope

- WIP calculation
- Process simulation
- Non-sequential branching paths (fork/merge/rework)
- Real-time data streaming
