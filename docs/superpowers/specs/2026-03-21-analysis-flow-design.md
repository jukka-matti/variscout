# Analysis Flow Documentation + Capability Mode Features

**Date:** 2026-03-21
**Status:** Design
**Scope:** Documentation (analysis-flow.md) + CapabilitySuggestionModal + TimeExtractionPanel extension + SubgroupConfig simplification

---

## Problem

VariScout's analysis journey has two analytical threads — **variation analysis** (standard I-Chart with Boxplot/Pareto drill-down) and **capability analysis** (I-Chart plotting Cp/Cpk per subgroup). The existing `analysis-journey-map.md` covers the four-phase journey but treats capability as a single checkpoint ("Check Cpk" in SCOUT step 4), missing that capability mode is a flexible I-Chart view toggle used throughout SCOUT → INVESTIGATE → IMPROVE.

Additionally:

- No contextual suggestion to start with capability view when specs are set
- Time-based subgrouping uses a separate code path (`groupByTimeInterval`) that doesn't integrate with Boxplot/drill-down/findings
- The complete two-thread analysis flow is undocumented

## Solution

Four deliverables addressing documentation, UX, and architecture:

1. **New `analysis-flow.md`** — Comprehensive E2E document showing both threads through all four journey phases
2. **`CapabilitySuggestionModal`** — Contextual modal when specs are set during FRAME
3. **TimeExtractionPanel extension** — Add minute-interval options (30/15/5/1 min)
4. **SubgroupConfig simplification** — Remove `time-interval` method, unify under column extraction

---

## Deliverable 1: analysis-flow.md

**Path:** `docs/03-features/workflows/analysis-flow.md`
**Audience:** Quality professionals (methodology) + developers (code traceability)
**Format:** Mermaid diagrams + narrative + tables

### Document Structure

#### 1. Introduction

Two analytical threads woven through one journey:

- **Variation Analysis** — "Where does variation come from?" (I-Chart values + Boxplot η² + Pareto + Stats)
- **Capability Analysis** — "Are we meeting our Cpk target?" (I-Chart Cp/Cpk per subgroup)

Capability mode is a **flexible I-Chart view toggle**, not a separate workflow. The analyst switches freely at any point. Findings, drill-down, and investigation work identically in both modes.

Three entry paths determine which thread leads.

#### 2. Three Entry Paths × Two Threads

| Entry Path          | Starting Question              | Primary Thread        | Secondary Thread             |
| ------------------- | ------------------------------ | --------------------- | ---------------------------- |
| Problem to Solve    | "What's causing this problem?" | Variation first       | Capability quantifies impact |
| Hypothesis to Check | "Is my theory right?"          | Depends on hypothesis | The other thread validates   |
| Routine Check       | "Are we still on target?"      | Capability first      | Variation if signal found    |

The first question the analyst asks depends on the entry path — not a fixed sequence.

#### 3. The Two Threads

**Thread 1: Variation Analysis**

- Core question: "Where does variation come from?"
- Tools: I-Chart (values), Boxplot (η²), Pareto, Stats
- Method: Progressive stratification — drill via highest η², filter, repeat until ≥70% variation isolated
- Findings: Pin at breadcrumb (filter state + stats + Cpk) or right-click chart observation

**Thread 2: Capability Analysis**

- Core question: "Are we meeting our Cpk target?"
- Tools: I-Chart (Cp/Cpk per subgroup), SubgroupConfig
- Method: Toggle I-Chart → "Values | Capability", configure subgroups (column or fixed-size), read Cpk dots vs target line
- Dual series: Cpk (blue) + Cp (green), gap = centering loss
- Requires specs (USL/LSL) to be set

**What changes when you toggle:**

| Aspect           | Values Mode      | Capability Mode         |
| ---------------- | ---------------- | ----------------------- |
| Y-axis data      | Raw measurements | Cpk values per subgroup |
| Control limits   | From data        | From Cpk series         |
| Secondary series | None             | Cp (green)              |
| Target line      | None             | Cpk target (if set)     |
| Boxplot/Pareto   | Unchanged        | Unchanged               |
| Findings         | Same context     | Same context            |

#### 4. FRAME Phase

- Data input, column mapping, spec limits
- **Cpk target setting** — enables capability thread
- **Characteristic type** — nominal/smaller-is-better/larger-is-better (affects both threads)
- **Time factor extraction** — TimeExtractionPanel creates categorical columns from timestamps (Year, Month, Week, DayOfWeek, Hour, and minute intervals). These become regular factor columns usable in Boxplot, drill-down, findings, AND as subgroup columns in capability mode.
- **CapabilitySuggestionModal** — when specs are set, suggest starting SCOUT in capability view

#### 5. SCOUT Phase

EDA for process improvement — not sequential verification gates.

**Decision points (natural questions, not gates):**

| #   | Decision                        | Evidence                          | Outcome                            |
| --- | ------------------------------- | --------------------------------- | ---------------------------------- |
| 1   | What patterns exist?            | All four lenses simultaneously    | Follow the most interesting signal |
| 2   | Where does variation come from? | Boxplot η²                        | Drill into highest η² factor       |
| 3   | Are we meeting Cpk target?      | Capability I-Chart vs target      | Below target → which subgroups?    |
| 4   | Centering problem?              | Cp-Cpk gap                        | Large gap → investigate centering  |
| 5   | Enough variation isolated?      | Cumulative Total SS ≥ 50-70%      | Pin finding → INVESTIGATE          |
| 6   | Toggle view?                    | Curiosity about other perspective | Switch I-Chart mode freely         |

**Thread switching moments:**

- Capability → Variation: "Batch 7 Cpk below target" → filter to Batch 7 → drill Boxplot → find why
- Variation → Capability: "Machine C explains 47%" → toggle capability, group by Machine → see Machine C's Cpk trend
- Deep drill → Capability check: "Isolated to Night Shift + Machine C" → check Cpk for this specific condition

**Drill-down + capability interaction:**

- Both views work at any drill level on the same filtered data
- Capability mode respects current drill-down filters
- Boxplot/Pareto always show variation perspective (don't change when toggling)

**Brush → Create Factor flow (for fixed-size subgroups):**
When capability mode uses fixed-size subgroups and a specific subgroup fails:

1. Switch to standard I-Chart
2. Brush the problematic data points
3. Create named factor (e.g., "Problem Period")
4. New factor appears in Boxplot → can drill, filter, pin findings

**Findings work identically in both modes:**

- Same context captured: filter state, stats (including Cpk), cumulative scope, source
- No separate "capability finding" type needed
- Whether toggled to Values or Capability when pinning — same FindingContext

#### 6. INVESTIGATE Phase

Both threads converge. Whether the finding came from variation drill-down or capability observation, the investigation follows the same diamond pattern (Initial → Diverge → Validate → Converge).

- **Variation-sourced finding:** "Machine C explains 47%" → hypothesis tree → test why Machine C
- **Capability-sourced finding:** "Batch 7 Cpk dropped" → switch to variation → filter to Batch 7 → drill to find why Cpk dropped
- **Hypotheses test causes (η²), not capability** — clean separation of concerns
- **Convergence synthesis** weaves evidence from both threads

#### 7. IMPROVE Phase

Both threads provide complementary verification evidence.

- **What-If:** Projects Cpk improvement (mean shift + σ reduction)
- **Staged analysis:** Before/after comparison (mean, σ, Cpk delta)
- **Capability verification:** Subgroup Cpk I-Chart in control after improvement = sustained evidence
- **PDCA Check:** Uses both variation (staged before/after) AND capability (consistent Cpk above target) evidence
- **Outcome learning loop:** Projected Cpk vs actual Cpk (green if met, red if short)

#### 8. Cpk Touchpoint Matrix

| Phase       | Touchpoint                            | Purpose                          |
| ----------- | ------------------------------------- | -------------------------------- |
| FRAME       | Cpk target in specs                   | Set the goal                     |
| SCOUT       | Stats panel (Cp, Cpk)                 | Current capability               |
| SCOUT       | Capability Histogram                  | Visual spec compliance           |
| SCOUT       | Capability I-Chart (per subgroup)     | Meeting target across subgroups? |
| SCOUT       | Probability Plot                      | Can we trust Cpk calculation?    |
| INVESTIGATE | Finding context (Cpk at drill level)  | Quantify impact of each driver   |
| IMPROVE     | What-If projected Cpk                 | Project before acting            |
| IMPROVE     | Staged analysis Cpk delta             | Verify improvement               |
| IMPROVE     | Capability I-Chart (post-improvement) | Sustained stable capability      |
| IMPROVE     | Outcome (projected vs actual)         | Learning loop                    |

#### 9. Use Case Examples

**Supplier PPAP (Routine Check → Capability thread leads):**
Weekly data load → capability mode → all subgroups above Cpk 1.67? → in-control Cpk I-Chart = PPAP evidence → done (or investigate failing subgroup)

**Customer Complaint (Problem to Solve → Variation thread leads):**
Complaint data → I-Chart: when did it shift? → Boxplot: Machine C η²=47% → drill to Machine C + Night Shift → pin finding → hypothesis: worn nozzle → gemba validates → What-If: replace nozzle → projected Cpk 1.35 → staged verification: Cpk 0.85→1.38 → capability mode confirms stable → resolved

**Batch Consistency (Hypothesis to Check → Depends on hypothesis):**
"Batch 7 uses new supplier" → capability mode by Batch → Batch 7 Cpk=0.72 → standard mode → filter Batch 7 → Boxplot: Supplier=New η²=65% → hypothesis confirmed → improvement: qualify new supplier material

#### 10. Code Traceability

| Phase              | Thread     | Key Hooks                                                                        | Key Components                                                                      |
| ------------------ | ---------- | -------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| FRAME              | Both       | `useDataIngestion`, `useDataState`                                               | `ColumnMapping`, `SpecsPopover`, `TimeExtractionPanel`, `CapabilitySuggestionModal` |
| SCOUT (variation)  | Variation  | `useFilterNavigation`, `useVariationTracking`, `useIChartData`, `useBoxplotData` | `IChartWrapperBase`, `BoxplotWrapperBase`, `ParetoChartWrapperBase`                 |
| SCOUT (capability) | Capability | `useCapabilityIChartData`                                                        | `CapabilityMetricToggle`, `SubgroupConfig`                                          |
| SCOUT (both)       | Both       | `useFindings`, `useChartScale`                                                   | `FindingsLog`, `ChartAnnotationLayer`, `CreateFactorModal`                          |
| INVESTIGATE        | Both       | `useHypotheses`, `useFindings`                                                   | `HypothesisTreeView`, `FindingBoardView`, `SynthesisCard`                           |
| IMPROVE            | Both       | `useFindings` (actions, outcome)                                                 | `WhatIfPageBase`, `StagedComparisonCard`, `ImprovementWorkspaceBase`                |

---

## Deliverable 2: CapabilitySuggestionModal

**Path:** `packages/ui/src/components/CapabilitySuggestionModal/index.tsx`

### Design

Follows `PerformanceDetectedModal` / `YamazumiDetectedModal` pattern.

```typescript
interface CapabilitySuggestionModalProps {
  /** Callback when user chooses capability view */
  onStartCapability: (subgroupConfig: {
    method: 'column' | 'fixed-size';
    column?: string;
    size?: number;
  }) => void;
  /** Callback when user chooses standard view */
  onStartStandard: () => void;
  /** Whether factors exist in the dataset */
  hasFactors: boolean;
  /** Available factor column names (for auto-selecting subgroup column) */
  factorColumns: string[];
}
```

### Trigger Logic

```typescript
const shouldShowCapabilitySuggestion =
  hasSpecs && // USL and/or LSL set
  (factorColumns.length > 0 || rows.length >= 10) && // Can form subgroups
  !capabilitySuggestionDismissed; // Not dismissed this session
```

### Content

- Icon + "Specification limits set"
- "Would you like to start with the Capability view to check if your subgroups are meeting the Cpk target?"
- What you'll see: Cp/Cpk per subgroup, target compliance, centering loss
- Buttons: "Start with Capability View" (primary) / "Standard View" (secondary)
- Footer: "You can switch anytime using the toggle in the I-Chart header."

### Auto-Select Subgroup Method

When analyst clicks "Start with Capability View":

1. If `factorColumns.length > 0` → `{ method: 'column', column: factorColumns[0] }`
   - Heuristic: prefer the first factor column in column order (same as Boxplot default). If a time-extracted column exists (prefixed with `_`), prefer it over regular factors for temporal capability analysis.
2. Else → `{ method: 'fixed-size', size: 5 }`

Gear icon immediately available for adjustment.

---

## Deliverable 3: TimeExtractionPanel Extension

**Path:** `packages/ui/src/components/ColumnMapping/TimeExtractionPanel.tsx`

### Current Options

- Year → "2025"
- Month → "Jan"
- Week → "W03"
- Day of Week → "Mon"
- Hour → "14:00" (only if time-of-day component)

### New Options (only if time-of-day component)

- Every 30 min → "14:00", "14:30"
- Every 15 min → "14:00", "14:15", "14:30", "14:45"
- Every 5 min → "14:00", "14:05", "14:10", ...
- Every 1 min → "14:00", "14:01", "14:02", ...

### Implementation

Extend `TimeExtractionConfig` in `core/time.ts`:

```typescript
interface TimeExtractionConfig {
  extractYear: boolean;
  extractMonth: boolean;
  extractWeek: boolean;
  extractDayOfWeek: boolean;
  extractHour: boolean;
  extractMinuteInterval?: number; // NEW: 1, 5, 15, or 30
}
```

Reuse `formatTimeBucket()` from `subgroupCapability.ts` for generating column values. The function already handles minute-level formatting with configurable intervals.

### UI

Add a dropdown or radio group below the Hour checkbox:

```
☑ Hour        14:00
  Interval:   [Every 15 min ▾]    ← only shown when Hour is checked
              Options: 30 min | 15 min | 5 min | 1 min
```

When a minute interval is selected, the extracted column uses `formatTimeBucket(date, 'minute', interval)` for values like "Mar 19 14:15".

### Column Naming

| Extraction | Column Name   | Example Values                 |
| ---------- | ------------- | ------------------------------ |
| Hour       | `{col}_Hour`  | "14:00", "15:00"               |
| 30 min     | `{col}_30min` | "Mar 19 14:00", "Mar 19 14:30" |
| 15 min     | `{col}_15min` | "Mar 19 14:00", "Mar 19 14:15" |
| 5 min      | `{col}_5min`  | "Mar 19 14:00", "Mar 19 14:05" |
| 1 min      | `{col}_1min`  | "Mar 19 14:00", "Mar 19 14:01" |

Where `{col}` is the timestamp column name (e.g., `timestamp_15min`). This follows the existing `${timeColumn}_${suffix}` naming convention used by `augmentWithTimeColumns`. Minute-interval columns include the date prefix (from `formatTimeBucket`) to distinguish same-time buckets across different days.

---

## Deliverable 4: SubgroupConfig Simplification

### Remove `time-interval` method

**Before:**

```typescript
type SubgroupMethod = 'column' | 'fixed-size' | 'time-interval';

interface SubgroupConfig {
  method: SubgroupMethod;
  column?: string;
  size?: number;
  timeColumn?: string;
  granularity?: TimeGranularity;
  minuteInterval?: number;
}
```

**After:**

```typescript
type SubgroupMethod = 'column' | 'fixed-size';

interface SubgroupConfig {
  method: SubgroupMethod;
  column?: string;
  size?: number;
}
```

### Rationale

Time-based subgrouping is better handled through column extraction during FRAME because:

1. Extracted columns work with Boxplot, drill-down, findings (full integration)
2. No "capability-only" subgroup labels that can't be filtered
3. One code path for all time-based analysis
4. Simpler type and UI (2 radio buttons instead of 3)

### Migration

- Remove `groupByTimeInterval()` from `subgroupCapability.ts`
- Remove `TimeGranularity` type export (keep `formatTimeBucket` — still used by TimeExtractionPanel)
- Simplify `SubgroupConfigPopover` to show only Column and Fixed Size options
- Update `useCapabilityIChartData` to remove time-interval branch
- Update existing tests

---

## Deliverable 5: Existing Document Updates

### analysis-journey-map.md

Add to SCOUT section after step 4:

> **Capability Mode Toggle:** The I-Chart supports a "Values | Capability" toggle that switches between raw measurements and per-subgroup Cp/Cpk. This enables checking whether subgroups consistently meet the Cpk target. See [Analysis Flow](analysis-flow.md) for the complete two-thread analysis journey.

### methodology.md

Update Analysis Modes section to add journey context:

> Each mode answers a different analytical question within the SCOUT phase. Standard mode asks "Where does variation come from?", while Capability mode asks "Are we meeting our Cpk target?" Analysts switch freely between modes at any drill level. See [Analysis Flow](../03-features/workflows/analysis-flow.md) for how these modes interleave through the full journey.

### subgroup-capability.md

Add "Journey Context" section:

> Capability mode is a view toggle within the SCOUT phase. The analyst switches between Values (variation analysis) and Capability (target compliance) at any point. Time-based subgrouping uses extracted time columns from FRAME (TimeExtractionPanel), ensuring subgroups are Boxplot-filterable and work with findings. See [Analysis Flow](../workflows/analysis-flow.md).

### mental-model-hierarchy.md

Add capability mode to the framework nesting, showing it as a SCOUT-phase I-Chart view toggle alongside the standard Four Lenses.

---

## Platform Availability

| Feature                              | PWA                  | Azure Standard | Azure Team |
| ------------------------------------ | -------------------- | -------------- | ---------- |
| Capability I-Chart toggle            | Yes (when specs set) | Yes            | Yes        |
| CapabilitySuggestionModal            | Yes                  | Yes            | Yes        |
| TimeExtractionPanel minute intervals | Yes                  | Yes            | Yes        |
| SubgroupConfig (column + fixed-size) | Yes                  | Yes            | Yes        |
| Brush → Create Factor                | Yes                  | Yes            | Yes        |
| CoScout in capability mode           | —                    | Yes            | Yes        |
