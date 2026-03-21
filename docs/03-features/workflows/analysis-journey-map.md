---
title: Analysis Journey Map
description: Visual map of the 4-phase analysis journey — Frame, Scout, Investigate, Improve — with CoScout companion and PDCA loop
journey-phase: [all]
---

# Analysis Journey Map

> **Analyst's visual guide** to the 4-phase journey with flowcharts and decision points. For the canonical architecture reference (AI modes, code mappings, known gaps), see [The Journey Model](../../05-technical/architecture/mental-model-hierarchy.md). For AI behavior per phase, see [AI Journey Integration](../../05-technical/architecture/ai-journey-integration.md).

VariScout guides quality analysts through four distinct phases: **Frame**, **Scout**, **Investigate**, and **Improve**. Each phase has a clear purpose, specific data shapes at its boundaries, and defined decision points that move the analyst forward. CoScout, the AI companion, adapts its behaviour at each phase to provide contextually relevant guidance.

## Journey Overview

```mermaid
flowchart LR
    subgraph CoScout["CoScout AI Companion"]
        direction LR
        F["FRAME\nDefine the problem space"]
        S["SCOUT\nDiscover variation patterns"]
        I["INVESTIGATE\nUnderstand suspected causes"]
        IM["IMPROVE\nProject and verify fixes"]
    end

    F --> S
    S --> I
    I --> IM
    IM -- "PDCA loop" --> F
    S -- "Add Data" --> F

    style F fill:#3b82f6,color:#fff
    style S fill:#22c55e,color:#fff
    style I fill:#f59e0b,color:#fff
    style IM fill:#8b5cf6,color:#fff
```

The journey is not strictly linear. Two feedback loops connect the phases:

- **PDCA loop** -- After verifying an improvement, the analyst re-enters Frame with new data to confirm the gains hold.
- **Add Data loop** -- While scouting, the analyst may realise the dataset is incomplete and return to Frame to add more data or remap columns.

---

## Phase 1: FRAME

**Purpose:** Define the problem space by loading data, mapping columns, and setting specification limits.

```mermaid
flowchart TD
    U["Upload / Paste data"] --> P["Parse rows"]
    P --> CM["Column Mapping\n(measure + factors)"]
    CM --> SS["Set Spec Limits\n(USL, LSL, Target)"]
    SS --> PD["Describe Process Context"]
    PD --> R["Ready for analysis"]

    style U fill:#3b82f6,color:#fff
    style R fill:#22c55e,color:#fff
```

### Steps

1. **Upload or paste data** -- CSV, Excel, or clipboard paste. The parser (`parseText` / `parseFile`) detects delimiters and validates structure.
2. **Map columns** -- Assign one measurement column and up to N factor columns. The `ColumnMapping` component provides data-rich cards with type badges and preview values.
3. **Set specification limits** -- Enter USL, LSL, and optional target via `SpecsPopover`. These flow through to capability calculations.
4. **Describe process context** -- Optional but valuable for CoScout. Process name, characteristic type, and any known constraints.

### Data Shapes at Boundary

| Entry                     | Exit                                          |
| ------------------------- | --------------------------------------------- |
| Raw file / clipboard text | `DataRow[]` (parsed, validated)               |
| --                        | `ValidationResult` (quality checks)           |
| --                        | `ColumnMapping` (measure + factors assigned)  |
| --                        | `AnalysisState` (specs, settings, ready flag) |

### Tier Differences

| Dimension   | PWA (Free)   | Azure (Standard / Team)         |
| ----------- | ------------ | ------------------------------- |
| Max factors | 3            | 6                               |
| Max rows    | 50,000       | 100,000                         |
| Persistence | Session only | IndexedDB (+ OneDrive for Team) |

### CoScout in Frame

CoScout is **not active** during Frame -- there is no analysed data to reason about yet. Once the analyst clicks "Start", data flows into the Scout phase and CoScout activates.

### Key Code References

- `useDataIngestion` -- shared file upload and parsing hook
- `useDataState` -- shared DataContext state management
- `ColumnMapping` component -- column assignment UI
- `parser.ts` -- CSV/Excel parsing and validation

---

## Phase 2: SCOUT

**Purpose:** Discover variation patterns using the Four Lenses -- CHANGE, FLOW, FAILURE, VALUE.

```mermaid
flowchart TD
    IC["I-Chart\n(CHANGE)"] --> BP["Boxplot\n(FLOW)"]
    BP --> PA["Pareto\n(FAILURE)"]
    PA --> CA["Capability\n(VALUE)"]

    IC -- "Special cause?" --> PIN1["Pin finding"]
    BP -- "High eta-squared?" --> DRILL["Drill down"]
    PA -- "Vital few?" --> PIN2["Pin finding"]
    CA -- "Cpk concern?" --> PIN3["Pin finding"]

    DRILL --> IC
    CA -- "Need more data?" --> ADD["Add Data\n(back to Frame)"]

    style IC fill:#3b82f6,color:#fff
    style BP fill:#3b82f6,color:#fff
    style PA fill:#3b82f6,color:#fff
    style CA fill:#3b82f6,color:#fff
    style PIN1 fill:#f59e0b,color:#fff
    style PIN2 fill:#f59e0b,color:#fff
    style PIN3 fill:#f59e0b,color:#fff
```

### Steps

1. **Scan I-Chart for stability** -- Look for points outside control limits, runs, and trends. Red dots signal special causes.
2. **Compare factors in Boxplot** -- Read ANOVA eta-squared to identify which factor explains the most variation.
3. **Rank in Pareto** -- See which categories within a factor contribute most to failures or out-of-spec results.
4. **Check Cpk** -- After filtering, assess whether the isolated subset meets specification requirements.
5. **Toggle Capability Mode** -- The I-Chart supports a "Values | Capability" toggle switching between raw measurements and per-subgroup Cp/Cpk. This checks whether subgroups consistently meet the Cpk target. See [Analysis Flow](analysis-flow.md) for the complete two-thread analysis journey.

At any point, the analyst can **pin a finding** to capture an observation for later investigation.

### Two Speeds

| Path            | Duration | When to Use                                                   |
| --------------- | -------- | ------------------------------------------------------------- |
| **Quick Check** | ~5 min   | Daily monitoring, shift handover                              |
| **Deep Dive**   | ~30 min  | Customer complaint, root cause project, process qualification |

See [quick-check.md](quick-check.md) and [deep-dive.md](deep-dive.md) for detailed protocols.

### Data Shapes

| Type                           | Purpose                                                 |
| ------------------------------ | ------------------------------------------------------- |
| `StatsResult`                  | Mean, sigma, Cp, Cpk, median for current filter scope   |
| `AnovaResult`                  | F-statistic, p-value, eta-squared for factor comparison |
| `FilterAction[]`               | Ordered drill trail (filter stack)                      |
| `Finding` (status: `observed`) | Pinned observations from charts                         |

### Tier Differences

| Dimension          | PWA (Free)                            | Azure (Standard / Team)   |
| ------------------ | ------------------------------------- | ------------------------- |
| Max drill factors  | 3                                     | 6                         |
| Finding statuses   | 3 (observed, investigating, analyzed) | 5 (+ improving, resolved) |
| Variation tracking | Cumulative Total SS                   | Cumulative Total SS       |

### CoScout in Scout

- **NarrativeBar** suggests patterns detected in the data ("Shift detected after sample 47")
- **ChartInsightChips** appear on individual charts with contextual observations

### Key Code References

- `useFilterNavigation` -- filter navigation with multi-select and breadcrumbs
- `useVariationTracking` -- cumulative Total SS scope tracking
- `useChartScale` -- Y-axis scale calculation
- `useBoxplotData`, `useIChartData` -- chart data transforms

---

## Phase 3: INVESTIGATE

**Purpose:** Understand why variation exists through structured learning — diverge, validate, converge.

```mermaid
stateDiagram-v2
    [*] --> Initial: Pin finding
    Initial --> Diverging: Generate sub-hypotheses
    Diverging --> Validating: Select hypothesis to test
    Validating --> Diverging: Needs more hypotheses
    Validating --> Converging: Evidence confirms
    Converging --> [*]: Suspected cause identified — move to Improve

    note right of Diverging
        Brainstorm possible causes
        The hypothesis tree grows
        (CoScout suggests)
    end note

    note right of Validating
        Data evidence (ANOVA)
        Gemba observation
        Expert input
    end note
```

### Investigation Diamond (4 Phases)

> **Diamond views:** [Architecture definition](../../05-technical/architecture/mental-model-hierarchy.md#investigation-diamond-4-phases) · [State machine](investigation-lifecycle-map.md) · [Tree UI & validation](hypothesis-investigation.md)

The investigation follows the diamond pattern within each finding — a structured learning process:

| Phase          | Status          | Activity                                                                          |
| -------------- | --------------- | --------------------------------------------------------------------------------- |
| **I**nitial    | `observed`      | Pin finding; upfront hypothesis (from FRAME) or new observation becomes tree root |
| **D**iverging  | `investigating` | Generate sub-hypotheses as a tree — break broad cause into testable theories      |
| **V**alidating | `investigating` | Test each leaf with evidence (data, Gemba, expert)                                |
| **C**onverging | `analyzed`      | Prune contradicted branches, promote suspected root cause                         |

The diamond closes at Converging. What follows — improvement ideation, corrective actions, implementation, and verification — belongs to the IMPROVE phase (PDCA).

### Steps

1. **Formulate hypotheses** -- Based on Scout observations, propose why the variation exists. The upfront hypothesis from FRAME's analysis brief (if present) seeds the tree root. CoScout can suggest hypotheses grounded in the data.
2. **Test with data** -- Use ANOVA results and drill-down filtering to validate or reject each hypothesis. Auto-validation uses eta-squared thresholds.
3. **Gemba observation** -- Go to the process and observe. Azure Team plan supports photo evidence (EXIF-stripped).
4. **Expert input** -- Add comments and notes from domain experts to findings.
5. **Converge** -- Identify the suspected root cause — the analyst has sufficient understanding to move to IMPROVE. Classify the finding (key-driver vs low-impact).

### Data Shapes

| Type            | Purpose                                                                                        |
| --------------- | ---------------------------------------------------------------------------------------------- |
| `Finding`       | Core investigation record with status progression                                              |
| `Hypothesis`    | Sub-hypothesis linked to a finding, with validation state and causeRole (primary/contributing) |
| `FindingStatus` | `observed` / `investigating` / `analyzed` / `improving` / `resolved`                           |
| `FindingTag`    | `key-driver` or `low-impact` classification                                                    |

### Tier Differences

| Dimension             | PWA (Free)                            | Azure (Standard / Team)      |
| --------------------- | ------------------------------------- | ---------------------------- |
| Finding statuses      | 3 (observed, investigating, analyzed) | 5 (all statuses)             |
| Photo evidence        | No                                    | Team plan only               |
| Hypothesis management | Full                                  | Full                         |
| Board view            | 3 columns                             | 5 columns with drag-and-drop |

### CoScout in Investigate

- Suggests hypotheses based on data patterns and process context
- Validates hypotheses against statistical evidence
- Links related findings across investigation sessions

### Key Code References

- `useFindings` -- finding CRUD, status transitions, hypothesis linking
- `useHypotheses` -- hypothesis CRUD, auto-validation with eta-squared thresholds
- `FindingsLog`, `FindingBoardView` -- UI components for findings management

---

## Phase 4: IMPROVE

**Purpose:** Improve the process to target through PDCA — Plan (ideate, select), Do, Check (staged analysis), Act (standardize or loop).

```mermaid
flowchart TD
    PLAN_I["PLAN: Ideate\nBrainstorm improvements"] --> WHATIF["What-If Projection\nModel idea impact"]
    WHATIF --> PLAN_S["PLAN: Select\nCompare projected impact"]
    WHATIF -- "Adjust parameters" --> PLAN_I
    PLAN_S --> DO["DO: Execute\nDefine & implement actions"]
    DO --> CHECK["CHECK: Verify\nStaged Analysis\n(before vs after)"]
    CHECK --> CHK{Target\nmet?}
    CHK -- "Yes" --> ACT_S["ACT: Standardize\nRecord outcome, close finding"]
    CHK -- "No" --> LOOP{"New PDCA\ncycle?"}
    LOOP -- "Yes" --> PLAN_I
    LOOP -- "Back to Investigate" --> INV["Re-enter INVESTIGATE"]

    style PLAN_I fill:#8b5cf6,color:#fff
    style PLAN_S fill:#8b5cf6,color:#fff
    style DO fill:#8b5cf6,color:#fff
    style CHECK fill:#8b5cf6,color:#fff
    style ACT_S fill:#22c55e,color:#fff
    style INV fill:#f59e0b,color:#fff
```

### PDCA Steps

1. **Plan: Ideate** -- Brainstorm improvement options based on the suspected root cause. Each idea gets a timeframe estimate (just-do/days/weeks/months) and a What-If projection (projected Cpk/yield impact).
2. **Plan: Select** -- Compare projected impact across ideas. Selected ideas become corrective actions. Use the What-If Simulator (`directAdjustment`) to model scenarios.
3. **Do** -- Define and execute corrective actions (owners, dates, completion tracking). Implementation happens mostly outside VariScout. When the first action is added, the finding transitions to `improving`.
4. **Check** -- Load new data into staged analysis. Compare before vs after (control limits, Cpk, mean shift, σ change). Did the process improve to target?
5. **Act** -- Target met → record outcome, close finding (`resolved`), standardize the fix. Not enough → start a new PDCA cycle (back to Plan) or re-enter Investigate if the suspected cause was wrong.

### Data Shapes

| Type                           | Purpose                                    |
| ------------------------------ | ------------------------------------------ |
| `ActionItem`                   | Corrective action with owner, date, status |
| `FindingOutcome`               | Documented result of the improvement       |
| `FindingProjection`            | Idea→What-If round-trip projection result  |
| `Finding` (status: `resolved`) | Closed investigation                       |

### Tier Differences

| Dimension         | PWA (Free) | Azure (Standard / Team)              |
| ----------------- | ---------- | ------------------------------------ |
| What-If Simulator | Available  | Available                            |
| Action tracking   | Limited    | Full (improving + resolved statuses) |
| Staged analysis   | Available  | Available                            |
| Outcome recording | No         | Team plan                            |

### CoScout in Improve

- Suggests improvement actions based on validated suspected cause
- Assists with What-If parameter selection
- Summarises before/after comparison

### Key Code References

- `WhatIfSimulator` / `WhatIfPageBase` -- simulation UI
- `simulation.ts` -- `directAdjustment` computation
- [staged-analysis.md](../analysis/staged-analysis.md) -- staged comparison methodology

---

## Three Entry Paths

Not every analysis starts the same way. VariScout supports three distinct entry paths that modify each phase's behavior:

```mermaid
flowchart TD
    START["Data loaded\n(Frame complete)"] --> PATH

    PATH --> PROB["Problem to Solve"]
    PATH --> HYPO["Hypothesis to Check"]
    PATH --> ROUT["Routine Check"]

    PROB --> SCAN["Scan all Four Lenses"]
    SCAN --> DRILL["Drill into patterns"]
    DRILL --> FIND["Pin findings"]
    FIND --> INV["Move to Investigate"]

    HYPO --> CONFIRM["Confirm hypothesis\nwith chart evidence"]
    CONFIRM --> JUMP["Investigate mechanism\nor diverge if refuted"]

    ROUT --> BASELINE["Scan for new signals\nvs baseline"]
    BASELINE --> OK{"New signal?"}
    OK -- "No" --> DONE["Process fine — done"]
    OK -- "Yes" --> INV

    style PROB fill:#22c55e,color:#fff
    style HYPO fill:#f59e0b,color:#fff
    style ROUT fill:#8b5cf6,color:#fff
```

| Path                    | Starting Point                        | Duration  | Best For                                      |
| ----------------------- | ------------------------------------- | --------- | --------------------------------------------- |
| **Problem to Solve**    | Customer complaint or Cpk alert       | 15-30 min | New datasets, exploratory analysis            |
| **Hypothesis to Check** | CoScout suggestion or prior knowledge | 5-10 min  | Known issues, suspected equipment or material |
| **Routine Check**       | Scheduled monitoring                  | 3-5 min   | Weekly/shift monitoring, trend watching       |

**In code:** `EntryScenario` type in `@variscout/core/ai/types.ts`, detection via `detectEntryScenario()` in `@variscout/hooks`.

---

## Entry-Path-Dependent Phase Goals

How the analyst entered the journey shapes what each phase needs to accomplish. See [Entry-Path-Dependent Phase Goals](../../05-technical/architecture/mental-model-hierarchy.md#entry-path-dependent-phase-goals) for the full matrix.

The upfront hypothesis (hypothesis-driven path) seeds the hypothesis tree root when investigation begins, creating a continuous thread from initial theory through validated understanding.

---

## The Drill-Down Loop

The drill-down loop is the core interaction pattern within the Scout phase. Each iteration narrows the data scope and increases the percentage of variation explained.

```mermaid
flowchart TD
    ALL["All Data"] --> READ["Read eta-squared\n(ANOVA under Boxplot)"]
    READ --> CLICK["Click highest-eta factor"]
    CLICK --> FILTER["Filter applied\n(chip shows contribution %)"]
    FILTER --> UPDATE["Charts update\nfor filtered subset"]
    UPDATE --> CHECK{Enough variation\nisolated?}
    CHECK -- "Yes (>50%)" --> PIN["Pin finding"]
    CHECK -- "No" --> READ

    style ALL fill:#3b82f6,color:#fff
    style PIN fill:#22c55e,color:#fff
```

Each filter chip displays the cumulative contribution percentage (Total SS scope), giving the analyst a running measure of how much variation has been explained by the current drill path. See [drill-down-workflow.md](drill-down-workflow.md) for the detailed protocol.

---

## Decision Point Map

Twelve key decision points shape the analysis journey. Each has a clear question, evidence source, and branching outcome.

| #   | Decision Point                     | Phase       | Evidence                               | Yes Path                         | No Path                              |
| --- | ---------------------------------- | ----------- | -------------------------------------- | -------------------------------- | ------------------------------------ |
| 1   | Stable?                            | Scout       | I-Chart (control limits, Nelson rules) | Proceed to Boxplot               | Investigate special causes first     |
| 2   | Which factor drives variation?     | Scout       | Boxplot eta-squared                    | Drill into highest eta-squared   | Check interactions                   |
| 3   | Enough variation isolated?         | Scout       | Cumulative Total SS > 50%              | Pin finding, move to Investigate | Continue drilling                    |
| 4   | Capable?                           | Scout       | Cpk vs target (1.33 default)           | Process acceptable               | Needs improvement                    |
| 5   | Quick Check or Deep Dive?          | Scout       | Time available, severity               | Quick Check (~5 min)             | Deep Dive (~30 min)                  |
| 6   | Discovery or Hypothesis-driven?    | Scout       | Prior knowledge, CoScout input         | Discovery (scan all lenses)      | Hypothesis-driven (confirm and jump) |
| 7   | Key Driver or Low Impact?          | Investigate | eta-squared magnitude, Pareto rank     | Tag as key-driver                | Tag as low-impact                    |
| 8   | Single or multiple hypotheses?     | Investigate | Complexity of problem                  | Test single hypothesis           | Diverge into sub-hypotheses          |
| 9   | Data, gemba, or expert validation? | Investigate | Available evidence                     | Statistical test (ANOVA)         | Physical observation or consultation |
| 10  | Converged on suspected cause?      | Investigate | Hypothesis validation status           | Enter Improve phase              | Generate more hypotheses             |
| 11  | What-If projection effective?      | Improve     | Projected Cpk meets target             | Define corrective actions        | Revise approach                      |
| 12  | Verification passed?               | Improve     | Staged analysis (before vs after)      | Resolve finding, close           | PDCA loop back to Frame              |

---

## All Loops Visualized

Five feedback loops keep the analysis iterative and self-correcting:

```mermaid
flowchart TD
    FRAME["FRAME"] --> SCOUT["SCOUT"]
    SCOUT --> INVESTIGATE["INVESTIGATE"]
    INVESTIGATE --> IMPROVE["IMPROVE"]

    %% Drill-down loop (Scout)
    SCOUT -- "Drill-down loop\n(filter, read, repeat)" --> SCOUT

    %% Hypothesis validation loop (Investigate)
    INVESTIGATE -- "Hypothesis loop\n(diverge, validate, converge)" --> INVESTIGATE

    %% What-If iteration loop (Improve)
    IMPROVE -- "What-If loop\n(project, adjust, re-project)" --> IMPROVE

    %% PDCA re-entry loop
    IMPROVE -- "PDCA loop\n(verify failed or new cycle)" --> FRAME

    %% Add Data loop
    SCOUT -- "Add Data loop\n(incomplete dataset)" --> FRAME

    style FRAME fill:#3b82f6,color:#fff
    style SCOUT fill:#22c55e,color:#fff
    style INVESTIGATE fill:#f59e0b,color:#fff
    style IMPROVE fill:#8b5cf6,color:#fff
```

| Loop                  | Phase            | Trigger                                            | Exit Condition                              |
| --------------------- | ---------------- | -------------------------------------------------- | ------------------------------------------- |
| Drill-down            | Scout            | eta-squared suggests deeper factor                 | >50% variation explained or no more factors |
| Hypothesis validation | Investigate      | Hypothesis not yet confirmed                       | Suspected cause validated with evidence     |
| What-If iteration     | Improve          | Projected Cpk below target                         | Projection meets target or approach revised |
| PDCA re-entry         | Improve to Frame | Staged verification fails or new improvement cycle | Verification passes                         |
| Add Data              | Scout to Frame   | Dataset missing factors or insufficient samples    | Data reloaded with additional columns/rows  |

---

## Related Documentation

- [Four Lenses Workflow](four-lenses-workflow.md) -- detailed CHANGE / FLOW / FAILURE / VALUE methodology
- [Drill-Down Workflow](drill-down-workflow.md) -- progressive stratification using filter chips
- [Quick Check](quick-check.md) -- 5-minute monitoring protocol
- [Deep Dive](deep-dive.md) -- 30-minute investigation protocol
- [Investigation to Action](investigation-to-action.md) -- findings and What-If workflow
- [Investigation Lifecycle Map](investigation-lifecycle-map.md) -- Investigation diamond state machine detail
- [Decision Trees](decision-trees.md) -- branching logic for analysis decisions
- [Mental Model Hierarchy](../../05-technical/architecture/mental-model-hierarchy.md) -- how all conceptual frameworks (journey, investigation diamond, report steps, lenses) nest together
