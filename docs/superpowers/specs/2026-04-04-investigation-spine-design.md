---
title: 'Investigation Spine — Three Threads, Five Sentences, One Story'
audience: [analyst, engineer]
category: architecture
status: draft
related:
  [
    investigation,
    eda-mental-model,
    question-driven,
    suspected-cause,
    problem-statement,
    improvement,
    best-subsets,
    what-if,
    coscout,
    yamazumi,
  ]
---

# Investigation Spine

The complete investigation experience as one coherent narrative — from vague concern to confirmed improvement. Three interleaving threads (narrative, evidence, projection) weave through five progressive sentences, rendered on three surfaces at two speeds. Grounded in Turtiainen (2019), validated against Lean Six Sigma MBB methodology.

Builds on: [Investigation Workspace Reframing](2026-04-03-investigation-workspace-reframing-design.md) (three breakthrough insights), [Question-Driven EDA](2026-03-30-question-driven-eda-design.md) (EDA mental model implementation), [Improvement Hub](2026-04-02-improvement-hub-design.md) (What-If integration).

---

## 1. The Model

The investigation is a **progressive sharpening** (Turtiainen 2019) from vague concern to confirmed improvement. It carries three interleaving threads through five sentences.

### Three Threads

| Thread                    | Question                    | Engine                              | Role                                                  |
| ------------------------- | --------------------------- | ----------------------------------- | ----------------------------------------------------- |
| **Narrative** (WHY)       | What's the mechanism?       | Analyst naming + CoScout            | Qualitative story from concern to confirmed cause     |
| **Evidence** (PROOF)      | How do we know?             | Best Subsets R²adj + gemba + expert | Three evidence types powering each transition         |
| **Projection** (HOW MUCH) | What improves if we fix it? | Regression equation + What-If       | Quantitative impact from baseline to measured outcome |

### Five Sentences

| Sentence          | Phase       | Narrative                                           | Evidence                                                     | Projection                                        |
| ----------------- | ----------- | --------------------------------------------------- | ------------------------------------------------------------ | ------------------------------------------------- |
| **1. Concern**    | FRAME       | Issue Statement: "fill weight too variable"         | Analyst's observation                                        | Baseline Cpk or mean                              |
| **2. Direction**  | FRAME exit  | PS draft (Q1+Q2): "Reduce variation in fill weight" | `inferCharacteristicType(specs)` → deterministic             | Target Cpk or mean target                         |
| **3. Scope**      | SCOUT       | PS actionable (Q1+Q2+Q3): "...for Machine C"        | Best Subsets runs → R²adj ranking → questions                | Drill: → Cpk 1.05 or mean −0.8g                   |
| **4. Mechanisms** | INVESTIGATE | Suspected Cause Hubs: "nozzle wear on night shift"  | Factor Intel L1→L3 + gemba + expert + `computeHubEvidence()` | Per-hub: equation-driven. Cumulative across hubs. |
| **4b. Ideas**     | → IMPROVE   | HMW brainstorm per hub → ideas                      | `computeIdeaImpact()`                                        | What-If per idea (model preset + manual)          |
| **5. Confirmed**  | RESOLVE     | Hubs → confirmed / not-confirmed                    | Measured outcome (staged analysis)                           | Before vs After: 0.62 → 1.41                      |

### Projection Metric Follows Characteristic Type

The primary projection metric adapts to the analyst's improvement direction:

| Characteristic         | Direction        | Primary Metric              | Secondary                     |
| ---------------------- | ---------------- | --------------------------- | ----------------------------- |
| **nominal** (USL+LSL)  | Reduce variation | Cpk (centering + spread)    | Mean shift toward target      |
| **smaller** (USL only) | Decrease         | **Mean** (lower is better)  | Cpk if specs exist            |
| **larger** (LSL only)  | Increase         | **Mean** (higher is better) | Cpk if specs exist            |
| **no specs**           | Analyst-defined  | **Mean + σ**                | Yield/pass rate if target set |

### Three Surfaces, Two Speeds

| Surface                      | Speed                     | Visible                | Sentences         | Role                                      |
| ---------------------------- | ------------------------- | ---------------------- | ----------------- | ----------------------------------------- |
| **PI Panel** (Questions tab) | Quick check (~5 min)      | Across ALL workspaces  | 1–4 summary       | Read the story. Presentation tool.        |
| **Investigation Workspace**  | Deep dive (~30 min)       | Investigation tab only | 3–4 in full depth | Write the story. EDA loop. Hub synthesis. |
| **Improvement Workspace**    | Action planning (~20 min) | Improvement tab only   | 4b–5              | Act on the story. Improve. Verify.        |

Hub creation lives exclusively in the Investigation workspace. The PI panel conclusion card shows existing hubs (read-only summary). Creating, naming, and connecting evidence to a hub requires the full Investigation workspace.

### The Chart Is the Primary Artifact

One picture speaks a thousand words. The investigation is fundamentally about **showing charts, interpreting them, and explaining what they mean**. Questions, equations, and hubs are organizing structures — the chart is the evidence the audience can see.

This shapes the entire design:

- **A finding IS a chart snapshot** — `FindingContext` captures the filter state + stats, `FindingSource` captures chart type + category. Click a finding → `handleRestoreFinding()` restores the exact chart configuration.
- **A question IS a reason to look at a chart** — click question → spotlight on boxplot for that factor. The chart answers the question visually.
- **A hub IS a curated chain of chart snapshots** — walk through a hub = walk through the visual evidence, each finding restoring its chart with the analyst's commentary.
- **The equation IS the quantitative summary of what the charts show** — "Night adds +0.8g" is what the boxplot IS SHOWING, now in precise words and numbers.

The data model already supports this: findings carry chart state, questions link to factors, hubs aggregate findings. The design surfaces this chart-first nature rather than treating charts as secondary to text.

---

## 2. Two-Tier Question Model

### Questions Serve Different Purposes in SCOUT vs INVESTIGATE

With the regression equation available from SCOUT entry, the nature of questions shifts fundamentally depending on the phase:

|                           | SCOUT Questions                                    | INVESTIGATE Questions                                  |
| ------------------------- | -------------------------------------------------- | ------------------------------------------------------ |
| **Purpose**               | "Look at this chart" — navigate to evidence        | "Why is this happening?" — find the mechanism          |
| **Answer source**         | Charts + statistics (often auto-answerable)        | Gemba + expert + deeper analysis                       |
| **Generated by**          | Factor Intelligence (deterministic, from equation) | Follow-ups, analyst, CoScout, observations             |
| **What "answered" means** | "This factor matters (η² X%)" — confirmed visually | "This is WHY (mechanism named)" — understanding        |
| **Key artifact**          | The chart configuration showing the effect         | The mechanism explanation connecting the evidence      |
| **Example**               | "Does Shift matter?" → boxplot shows Night higher  | "WHY does Night add +0.8g?" → nozzle thermal expansion |

### SCOUT Questions = Chart Navigation Bookmarks

Factor Intelligence generates ranked reasons to look at specific chart configurations. Each question is essentially: "look at this boxplot/pareto configuration — the model says this factor explains X%."

The equation enriches these bookmarks: not just "Does Shift matter? (R²adj 34%)" but the Factor Intelligence panel shows "Night +0.8g" — so the analyst knows what they'll see before they click. The chart confirms it visually.

Many L1 questions are auto-answerable: η² ≥ 15% → clearly matters (the chart will show obvious separation). η² < 5% → doesn't matter (the chart will show flat boxes). The checklist tracks what's been checked and what hasn't — it's a **coverage navigation tool**.

### INVESTIGATE Questions = Mechanism Questions

These are the questions that charts alone can't answer. "The boxplot shows Night is worse — WHY?" requires going beyond the data: gemba walks, operator interviews, maintenance records, expert knowledge. This is where the three evidence types (data + gemba + expert) truly matter.

Investigation questions spawn from:

- Answered SCOUT questions ("Shift matters" → "WHY does Night add +0.8g?")
- Analyst experience ("I think it's nozzle wear based on 20 years in this plant")
- CoScout suggestions ("The pattern of Night + Head 5-8 suggests a thermal interaction")
- Observations/comments on findings ("This finding about temperature drift suggests...")

### Questions Serve Four Audiences

| Audience                        | What they need                                           | How the model serves them                                              |
| ------------------------------- | -------------------------------------------------------- | ---------------------------------------------------------------------- |
| **Analyst** (during work)       | Guide: what to check next, what mechanism to investigate | SCOUT questions navigate charts; INVESTIGATE questions drive deeper    |
| **Sponsor/management** (review) | Audit trail: what was checked, what was ruled out        | Coverage progress + ruled-out factors as negative learnings            |
| **Operator/team** (action)      | What to fix and why — show me the chart                  | Hub presentation: chart snapshots + mechanism name + actions           |
| **Future analyst** (knowledge)  | Lessons learned, don't re-investigate ruled-out factors  | Full question trail persisted in project, negative learnings preserved |

### Hub as Presentation Unit

Each suspected cause hub becomes a **presentation-ready evidence chain**:

```
Hub: "Nozzle wear on night shift"
├── Chart 1: Boxplot (Shift) → Night clearly higher (+0.8g)
│   └── Finding: "Night shift adds 0.8g" + analyst comment
├── Chart 2: Boxplot (Head) → Heads 5-8 clearly worse (+0.5g)
│   └── Finding: "Gemba: 0.3mm wear after 4h" + photo
├── Chart 3: Boxplot (Shift × Head) → Night+Head5-8 worst combination
│   └── Finding: "Interaction confirms thermal cycling pattern"
├── Equation: Y = 12.1 + Shift(Night +0.8) + Head(5-8 +0.5) | R²adj 38%
└── Projection: fixing both → −1.8g → Cpk 1.12 (model suggests)
```

Walking through this hub = clicking each finding = each chart restores = sponsor SEES the evidence. The equation summarizes what the charts show. The mechanism name ("nozzle wear on night shift") is the analyst's insight that connects the visual evidence into understanding.

This is already supported by the data model — no new chart snapshot storage needed. Each finding already carries its `FindingContext` (filters) and `FindingSource` (chart type + category).

---

## 3. Regression Equation from Best Subsets

### The Bridge Between Evidence and Projection

Currently, the evidence thread (Best Subsets R²adj) and the projection thread (What-If sliders) are disconnected. The regression equation bridges them: the model predicts exactly what happens when factor levels change.

### How It Works (Categorical Regression)

For categorical factors, the regression equation is a cell-means model. The math is already computed inside `computeSubsetSS()` — it groups observations by factor level combinations and computes group means. Currently, the means are discarded after computing SSB. The change: **keep them**.

```
Y = grand mean + effect(Factor₁ = level) + effect(Factor₂ = level) + ...

Example:
  Grand mean = 12.1g
  Shift: Day = −0.3g, Night = +0.8g  (Night is 1.1g worse than Day)
  Head:  1-4 = −0.2g, 5-8 = +0.5g   (Heads 5-8 are 0.7g worse)

  Predictions:
    Night + Head 5-8:  12.1 + 0.8 + 0.5 = 13.4g  (worst case)
    Day + Head 1-4:    12.1 − 0.3 − 0.2 = 11.6g  (best case)
    Fix Shift to Day:  13.4 → 12.6 = −0.8g shift
    Fix both:          13.4 → 11.6 = −1.8g shift
```

### Data Model Changes

Extend `BestSubsetResult`:

```typescript
interface BestSubsetResult {
  // ...existing fields (factors, rSquared, rSquaredAdj, fStatistic, pValue, isSignificant, dfModel)

  /** Level effects relative to grand mean. factor → (level → effect) */
  levelEffects: Map<string, Map<string, number>>;
  /** Cell means. compound key → { mean, n } */
  cellMeans: Map<string, { mean: number; n: number }>;
}
```

### New Functions

```typescript
/** Predict outcome for given factor level changes using the equation. */
predictFromModel(
  bestSubset: BestSubsetResult,
  grandMean: number,
  currentLevels: Record<string, string>,
  targetLevels: Record<string, string>
): { predictedMean: number; meanDelta: number; levelChanges: LevelChange[] }

/** Compute hub projection using the equation. */
computeHubProjection(
  hub: SuspectedCause,
  bestSubsetsResult: BestSubsetsResult,
  currentLevels: Record<string, string>,
  specs?: SpecLimits
): HubProjection
```

### Equation Display

Compact readable form for PI panel and Investigation workspace:

```
BEST MODEL (R²adj 38%, p < 0.001)
Fill Weight = 12.1 + Shift(Day −0.3, Night +0.8) + Head(1-4 −0.2, 5-8 +0.5)
Worst: Night + Head 5-8 = 13.4g  |  Best: Day + Head 1-4 = 11.6g  |  Range: 1.8g
```

Expanded view shows n per cell. Cells with n < 5 flagged as low-confidence.

### How the Equation Connects to Each Sentence

| Sentence          | Without Equation                      | With Equation                                             |
| ----------------- | ------------------------------------- | --------------------------------------------------------- |
| **3. Scope**      | R²adj ranking: "these factors matter" | + Level effects: "Night is 1.1g worse than Day"           |
| **4. Mechanisms** | Hub evidence = R²adj match            | + Predicted mean shift from equation per hub              |
| **4b. Ideas**     | Manual What-If sliders                | + "Model prediction" preset auto-fills from equation      |
| **5. Confirmed**  | Before/after measured                 | + Compare measured vs model prediction (model validation) |

### MBB-Validated Safeguards

1. **Interaction flag**: When L3 interaction ΔR² > 2% (meaningful interaction effect), display: "⚠ Interaction detected — model assumes additive effects, prediction may be conservative." On equation display AND What-If model preset.
2. **R²adj alongside every projection**: Every model-driven projection carries "Model explains X%" qualifier. "Model suggests Cpk ~1.12 if Shift + Head fixed (R²adj 38%)".
3. **Cell sample counts**: Expanded equation view shows n per cell. Flag cells with n < 5 as low-confidence.
4. **Hedged language**: All model-driven projections use "Model suggests" not "will be."

### Equation in SCOUT Phase and PI Panel

The equation is available from **SCOUT entry** — the moment Best Subsets runs. It affects these surfaces immediately:

**Factor Intelligence Panel (Layer 1):** Each ranking row gains a level effect summary alongside R²adj. "Shift + Head: 38% — Night +0.8g, Head 5-8 +0.5g". The analyst sees direction AND magnitude before drilling. Layer 2 main effects plot already shows level means visually — add numeric labels for precision.

**ProcessHealthBar:** Model-based projection alongside drill projection. "→ Cpk 1.12 (model: −1.8g shift)". The equation-driven projection is more precise than complement-based — shows both when available.

**TargetDiscoveryCard (State 4):** "Model predicts Cpk X.XX if best levels applied — Day + Head 1-4". More informative than "fixing this subset" — shows what "best" means in concrete level changes.

**Chart Insight Chips:** Effect magnitude in insights. "Night shift adds +0.8g (34% of variation)" — HOW MUCH, not just THAT it matters.

**Problem Statement (Sentence 3):** Q3 gains effect size. "...for Machine C (adds +0.8g, Cpk 0.62 → 1.05)". The PS becomes more precise at SCOUT Loop 1.

**NarrativeBar:** Level effects in AI context enable richer narration. "Night shift adds 0.8g to fill weight — fixing this could shift mean by −1.1g." Automatic via enriched `buildAIContext()`.

**PI Panel (Questions tab):** Equation display below conclusion card. Compact, always available across all workspaces. The analyst sees the transfer function while reviewing questions.

**PI Panel (Stats tab):** No change — stays focused on descriptive stats. Equation lives in Questions tab.

**Design tension — progressive disclosure:** Questions stay as questions ("Does Shift matter? R²adj 34%") without spoiling the level direction. Level effects live in Factor Intelligence (the evidence panel) and chart insights. The analyst sees effects when they LOOK at Factor Intelligence, not when they read the question. This preserves the discovery process while making the evidence richer.

---

## 4. Hub Creation + Synthesis UX

### The Gap

SuspectedCause hub entity is fully implemented in the data layer (types, factory, CRUD hook, store sync, serialization, migration, evidence computation). But there is no UI for creating, editing, or connecting evidence to a hub.

### Four Layers (combination approach)

All produce the same SuspectedCause entity. Each layer serves a different skill level and investigation phase.

**Layer 1: Organic Growth (always on, all tiers).** The living story grows without explicit "create hub" actions. Problem Statement updates live. Questions auto-link to findings. Evidence badges show R²adj/waste%/Cpk. Already implemented — no new work needed.

**Layer 2: Prompted Synthesis (when evidence converges, all tiers).** When 2+ answered questions share factors and no existing hub covers those factors, an inline synthesis prompt appears in InvestigationConclusion:

> "3 answered questions relate to Shift + Head factors (combined R²adj 38%). Name this cause →"

Trigger conditions:

- 2+ questions with status `answered` share the same factor(s)
- OR 2+ findings reference the same factor levels in their filter context
- AND no existing hub already covers those factors
- AND investigation phase is `validating` or `converging`

Clicking "Name this cause →" opens the Hub Composer pre-populated with detected evidence.

**Layer 3: Manual Creation (always available, all tiers).** "+ Name a suspected cause" action in InvestigationConclusion panel during validating/converging phases. Also accessible from question context menu ("Create hub from this question") and finding context menu ("Start hub from this finding").

**Layer 4: CoScout-Guided (Azure only).** New action tool `suggest_suspected_cause` (see §6). CoScout proposes hub with draft name, synthesis, and connected evidence. Analyst reviews via Hub Composer.

### The Hub Composer

All four layers converge on one UI: an **inline expansion** in the InvestigationConclusion panel. Not a modal — the analyst stays in context.

**Design principles:**

- **Name first** — the name field is the primary input. The name IS the synthesis insight. Placeholder: "Name the mechanism..."
- **Synthesis is optional** — experienced analysts may skip it. Beginners benefit from articulating the connection.
- **Evidence pre-connected** — when triggered by prompt or CoScout, evidence threads are pre-populated. Analyst can add/remove.
- **"+ Connect more"** — dropdown showing unconnected answered questions + findings. Checkbox selection, not drag-drop.
- **Evidence badge computed live** — `computeHubEvidence()` updates as connections change. Shows Best Subsets R²adj match.
- **Model prediction shown** — if hub's factors match a Best Subsets equation, show the predicted mean shift.
- **No status selection** — new hubs start as `suspected`. Status changes to `confirmed` only via outcome verification.

### Hub Card (after creation)

Expandable card in InvestigationConclusion panel:

- Status badge (suspected/confirmed/not-confirmed)
- Name + evidence badge (R²adj or waste% or Cpk)
- Summary: "3 questions · 1 finding · Shift + Head factors"
- Model prediction: "Model suggests −1.8g if fixed (R²adj 38%)"
- Actions: **Edit** (reopens composer), **☑ Select for improvement**, **→ Brainstorm** (navigates to Improvement workspace, opens HMW modal for this hub with full evidence context)

### Hub → Projection Connection

- **Auto-projection (from equation):** Hub's factors → `predictFromModel()` → precise mean shift → projected Cpk/mean.
- **Idea-level projection (from What-If):** After HMW brainstorm, each idea carries its own What-If projection. Hub's best idea projection bubbles up.
- **Cumulative (across hubs):** `computeCumulativeProjection()` chains selected hubs. ProcessHealthBar shows aggregate.
- **What-If presets are contextual** (per improvement hub spec): reference actual category names — "Match Head 1-4 mean" not "Match best."

---

## 5. EDA Heartbeat Rhythm

### The Gap

The EDA inner loop (ask → explore → pin → evaluate → ask next) works at beats 1–4. Beat 5 is silent — when the analyst answers a question, nothing happens next. No follow-ups arrive, no next question is highlighted.

### Three Mechanisms to Close the Loop

#### A. Auto Follow-Up Generation (the trigger)

When a question is answered with η² ≥ 5%, auto-generate follow-up sub-questions:

| Trigger                       | Follow-up                               | Example                                          |
| ----------------------------- | --------------------------------------- | ------------------------------------------------ |
| L1 answered, η² ≥ 5%          | **L2 Main Effect:** "Which level?"      | "Is Night shift specifically worse than Day?"    |
| ≥2 L1s answered, both η² ≥ 5% | **L3 Interaction:** "Do they interact?" | "Is the Head 5-8 problem worse on Night shift?"  |
| L1 answered, η² < 5%          | **None** — auto-ruled-out               | Negative learning captured. No follow-up needed. |

Implementation: `useQuestionGeneration` already has `generateFollowUpQuestions()` logic. Wire trigger into `useInvestigationOrchestration`'s question status change handler.

#### B. "Next Question" Highlight (the pull)

After answering, the next most relevant unanswered question gets a subtle highlight: blue left-border + "← next" badge.

Selection logic (priority order):

1. Newly generated follow-ups from the just-answered question (deepening the thread)
2. Highest R²adj unanswered L1 question (next most impactful factor)
3. Oldest open question (fallback)

Clicking any question clears the highlight. The highlight is a suggestion, not a prescription — the analyst can always go off-script.

#### C. Coverage Progress Signal (the momentum)

Question checklist header shows: `4/7 checked · 68% explored`

Calculation: Sum R²adj of (answered + auto-ruled-out) / sum R²adj of all L1 questions. Mode-aware: waste % explored for yamazumi, channels checked for performance.

Coverage progress bar tooltip: "This tracks factors in your data. Real-world causes may be outside your dataset — gemba walks and expert input help fill the gap." (Coverage ≠ completeness.)

Phase transition signal: At ~80% coverage, subtle color shift to indicate convergence readiness. A signal, not a gate.

---

## 6. Lean What-If (Yamazumi Mode)

### The Gap

Core functions exist (`projectWasteElimination()`, `projectVAImprovement()`) with `LeanProjectionResult` type. Zero UI — no sliders, no visualization, no presets, no ProcessHealthBar variant.

### Design

Same `WhatIfPageBase` shell, mode-dispatched content via strategy pattern (ADR-047).

**Analyst selects target activity.** Any type — VA, NVA Required, or Waste. Selected from yamazumi chart (click bar segment) or dropdown in the simulator. The analyst is the domain expert — the tool doesn't presume which activity to target.

**One slider: reduce this activity's time** (0% to 100% reduction). VA time and other activities don't change — only the selected activity shrinks.

**Stacked bar visualization (not bell curves).** Current vs projected side by side. VA (green) + NVA Required (amber) + Waste (red). Takt time as dashed vertical line. The analyst sees the targeted activity shrinking as the slider moves.

**Four contextual presets** (for the selected activity):

1. **"Eliminate"** — reduce to zero. Most relevant for waste, but available for any.
2. **"Match [Best Step/Performer]"** — if another step or operator does this activity faster, match their time. Contextual label from data.
3. **"Reach takt (Xs)"** — minimum reduction of this activity to bring total CT under takt. Only shown when CT > takt.
4. **"Halve"** — reduce by 50%. Simple benchmark when no reference exists.

**Saves to same ProjectionScenario.** `domain: 'lean'` with `lean: LeanProjectionResult`. Same "Save to idea" pattern.

### ProcessHealthBar: Lean Variant

Shows cycle time + takt compliance instead of Cpk + yield:

- Statistical: `Cpk 0.62 → 1.05 (if fixed)`
- Yamazumi: `CT 45s → 35.9s (if waste eliminated) · Takt ✓`

Priority order same as statistical (resolved > improvement > cumulative > drill > none).

### ImprovementSummaryBar: Lean Variant

Via existing `modeRenderers` dispatch:

- Statistical: `3 ideas selected · Projected Cpk 1.35`
- Yamazumi: `2 ideas selected · Projected CT 35.9s · Takt ✓`

---

## 7. CoScout as Investigation Partner

### Principle

Deterministic first, AI enhances. The spine works without CoScout (PWA gets it all via Factor Intelligence). CoScout adds three capabilities: suggest synthesis, coach methodology by phase, and propose actions that accelerate the EDA loop.

### New Action Tools

#### `suggest_suspected_cause`

CoScout recognizes clustering evidence and proposes a hub.

```
params:
  name: "Nozzle wear on night shift"
  synthesis: "Night shift thermal stress causes..."
  questionIds: ["q1", "q3", "q7"]
  findingIds: ["f2", "f5"]

proposal preview:
  "Create suspected cause: Nozzle wear on night shift
   connecting 3 questions + 2 findings (R²adj 38%)"
```

On accept: Opens Hub Composer pre-filled. Analyst reviews, edits, confirms.
Phase gate: Only available during `validating` and `converging`.

#### `connect_hub_evidence`

When a hub exists and new evidence arrives, CoScout suggests connecting it.

```
params:
  hubId: "hub-1"
  questionIds: ["q9"]
  reason: "This interaction question confirms the shift×head pattern"

proposal preview:
  "Connect Shift × Head interaction? to hub Nozzle wear on night shift"
```

On accept: Calls `connectQuestion()` directly. Hub evidence auto-recomputes.

### Phase-Specific Coaching

CoScout's system prompt adapts based on investigation phase:

| Phase          | Coaching Focus                                                                                                  | Tools Prioritized                                              |
| -------------- | --------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| **Initial**    | Help formulate concern. Suggest issue statement sharpening. Highlight PS draft.                                 | `create_question`, `apply_filter`                              |
| **Diverging**  | Encourage breadth. Suggest unexplored factors. Flag non-data evidence sources. Show coverage.                   | `create_question`, `switch_factor`                             |
| **Validating** | Focus on evidence quality. Suggest gemba for statistical findings. Prompt expert input. Highlight interactions. | `answer_question`, `create_finding`, `suggest_suspected_cause` |
| **Converging** | Help synthesize. Identify threads that belong together. Suggest hub names. Draft synthesis.                     | `suggest_suspected_cause`, `connect_hub_evidence`              |

### Mode-Aware Coaching

| Mode                    | Investigation Coaching                                                                    |
| ----------------------- | ----------------------------------------------------------------------------------------- |
| **Standard/Capability** | Factor ranking by R²adj. Check interactions when ≥2 significant. Evidence = R²adj.        |
| **Yamazumi**            | Which activities waste most? Eliminate → simplify → combine → reduce. Evidence = waste %. |
| **Performance**         | Which channels worst? Rank by Cpk. Same root cause across channels? Evidence = Cpk delta. |

### AI Context Additions

New fields in `buildAIContext()`:

```typescript
context.investigation = {
  ...existingFields,
  // NEW
  suspectedCauses: SuspectedCause[],       // Hub entities
  coveragePercent: number,                  // R²adj explored %
  questionsChecked: number,
  questionsTotal: number,
  problemStatementStage: 'partial' | 'actionable' | 'with-causes',
  liveStatement: string,
  bestModelEquation?: {                     // From best subset
    factors: string[],
    rSquaredAdj: number,
    levelEffects: Record<string, Record<string, number>>,
    worstCase: { levels: Record<string, string>; predicted: number },
    bestCase: { levels: Record<string, string>; predicted: number },
  },
}
```

---

## 8. Mode-Aware Evidence Engines

The spine is mode-agnostic. The evidence engine plugs in per mode via strategy pattern (ADR-047):

| Mode            | Evidence Engine             | Metric              | Hub Evidence                  | Projection Engine                               |
| --------------- | --------------------------- | ------------------- | ----------------------------- | ----------------------------------------------- |
| **Standard**    | Best Subsets                | R²adj               | Exact subset match + equation | `simulateDirectAdjustment` + `predictFromModel` |
| **Capability**  | Best Subsets + Spec adapter | R²adj → Cpk framing | Exact subset match + equation | `simulateDirectAdjustment` + `predictFromModel` |
| **Yamazumi**    | Waste composition           | Waste %             | Capped waste sum              | `projectVAImprovement` (activity-based)         |
| **Performance** | Channel ranking             | Channel Cpk         | Capped Cpk sum                | Per-channel What-If                             |

---

## 9. What-If Smart Presets (Updated)

### Statistical Modes (Standard / Capability)

From the improvement hub spec — contextual, referencing actual data:

1. **"Match [Reference] mean"** — shift to reference subset's mean (e.g., "Match Head 1-4 mean")
2. **"Match [Reference] spread"** — reduce σ to reference subset's σ
3. **"Center on spec target"** — shift to midpoint/target
4. **"Match [Reference] fully"** — both mean + spread
5. **"Model prediction"** (**new**) — auto-fill from regression equation's `predictFromModel()`. Shows exact level effect. First preset when equation available — most precise.

Model prediction preset carries interaction flag when L3 ΔR² is significant.

### Yamazumi Mode

Analyst selects target activity first, then presets apply to that activity:

1. **"Eliminate"** — reduce to zero
2. **"Match [Best Step/Performer]"** — contextual label from data
3. **"Reach takt (Xs)"** — minimum reduction to meet takt
4. **"Halve"** — 50% reduction benchmark

---

## 10. Design Principles

1. **The chart is the primary artifact.** One picture speaks a thousand words. Charts are the evidence; questions navigate to them; findings snapshot them; hubs curate them; equations summarize them. Design for chart-first, text-second.
2. **The story is always readable.** At any point, the analyst reads their investigation as a coherent narrative — from concern through whatever sentence they've reached.
3. **Evidence drives transitions.** No sentence transition without evidence. Best Subsets gates questions. Answered questions gate hub prompts. Hub evidence gates improvement. Measured outcomes gate confirmation.
4. **Projections are companions, not gates.** Projections enrich but never block. An analyst can name a hub without running a What-If.
5. **Same spine everywhere, AI optional.** PWA gets the full spine. CoScout adds depth but the spine works without it.
6. **Honor the creative moment.** Hub creation feels like composition (gathering threads into understanding), not data entry.
7. **Communicate uncertainty honestly.** R²adj alongside every projection. Interaction flags. Hedged language. Coverage ≠ completeness.
8. **SCOUT discovers, INVESTIGATE explains.** SCOUT questions are chart navigation bookmarks ("look at this"). Investigation questions seek mechanisms ("why is this happening?"). The equation bridges both — it tells you what the charts show (SCOUT) and predicts what fixing the mechanism achieves (INVESTIGATE).

---

## 11. Implementation Scope

### New Components

| Component                 | Package | Purpose                                                       |
| ------------------------- | ------- | ------------------------------------------------------------- |
| `HubComposer`             | ui      | Inline hub creation/editing in InvestigationConclusion        |
| `HubCard`                 | ui      | Compact hub display with actions (edit, select, brainstorm)   |
| `SynthesisPrompt`         | ui      | Inline prompt when evidence clusters detected                 |
| `EquationDisplay`         | ui      | Compact regression equation view for PI panel / Investigation |
| `LeanWhatIfSimulator`     | ui      | Activity selector + time reduction slider + stacked bar       |
| `LeanDistributionPreview` | ui      | Stacked bar before/after with takt line (SVG)                 |

### New Core Functions

| Function                   | Package       | Purpose                                                      |
| -------------------------- | ------------- | ------------------------------------------------------------ |
| `predictFromModel()`       | core/stats    | Predict outcome from regression equation for target levels   |
| `computeHubProjection()`   | core/findings | Equation-driven projection per hub                           |
| `detectEvidenceClusters()` | core/findings | Pure function: questions[] + findings[] → candidate clusters |
| `computeCoverage()`        | core/stats    | Questions[] → { checked, total, exploredPercent }            |
| `computeLeanPresets()`     | ui            | 4 contextual presets from yamazumi data + takt               |

### Modified Components

| Component                       | Change                                                                                  |
| ------------------------------- | --------------------------------------------------------------------------------------- |
| `computeSubsetSS()`             | Return cell means + per-factor level effects (data already computed, just not returned) |
| `BestSubsetResult`              | Add `levelEffects` and `cellMeans` fields                                               |
| `InvestigationConclusion`       | Add HubComposer, HubCards, SynthesisPrompt, EquationDisplay                             |
| `QuestionChecklist`             | Add "← next" highlight + coverage progress bar                                          |
| `QuestionNode`                  | Show "follow-up" badge on auto-generated children                                       |
| `ConclusionCard`                | PI panel: show hub summary (read-only, link to Investigation workspace)                 |
| `WhatIfPageBase`                | Mode dispatch to LeanWhatIfSimulator; add "Model prediction" preset                     |
| `computePresets()`              | Add model prediction preset using `predictFromModel()`                                  |
| `ProcessHealthBar`              | Lean variant: CT + takt instead of Cpk + yield                                          |
| `ImprovementSummaryBar`         | Lean variant via existing modeRenderers dispatch                                        |
| `useProcessProjection`          | Add lean projection path + equation-driven projection                                   |
| `useInvestigationOrchestration` | Wire follow-up generation trigger on answer                                             |
| `HubCard`                       | Show model-predicted mean shift alongside R²adj                                         |
| `actionTools.ts`                | Add `suggest_suspected_cause` + `connect_hub_evidence`                                  |
| `actionToolHandlers.ts`         | Handlers for both new tools                                                             |
| `buildAIContext.ts`             | Add hubs, coverage, PS stage, equation summary                                          |
| `coScout.ts`                    | Phase-specific coaching blocks (4 phases × mode)                                        |
| `buildCoScoutTools()`           | Phase-gate new tools                                                                    |
| `BestSubsetsCard`               | Add level effect summary on each ranking row                                            |
| `MainEffectsPlot`               | Add numeric level effect labels alongside visual                                        |
| `TargetDiscoveryCard`           | State 4: show model prediction with concrete level changes                              |
| `chartInsights.ts`              | Include effect magnitude: "Night adds +0.8g (34%)"                                      |
| `buildProblemStatement()`       | Include effect size when Q3 answered                                                    |

---

## 12. Verification

### End-to-End Flow (Statistical)

1. Load data with 3+ factors and specs → Best Subsets runs → ranked questions with R²adj
2. Equation display shows best model: `Y = grand mean + level effects`
3. Answer L1 question → L2 follow-up auto-generates → "← next" highlights it
4. Coverage progress advances (e.g., 40% → 55%)
5. After 3+ answered questions sharing factors → SynthesisPrompt appears
6. Click "Name this cause →" → Hub Composer opens pre-filled
7. Name hub, confirm → HubCard appears with R²adj evidence + model prediction
8. Click "→ Brainstorm" → Improvement workspace, HMW modal with hub context
9. Create idea → open What-If → "Model prediction" preset auto-fills mean shift from equation
10. Save projection → ProcessHealthBar shows projected Cpk with "Model suggests" language
11. Implement fix → staged analysis → before/after comparison vs model prediction

### End-to-End Flow (Yamazumi)

1. Load time study data → yamazumi chart renders → waste questions generated
2. Answer questions about waste activities → follow-ups about specific steps
3. Create hub: "Changeover waste in Step 3" with waste % evidence
4. Brainstorm → idea "Redesign changeover sequence"
5. Open Lean What-If → select "Changeover (Wait)" activity → slider reduces time
6. "Reach takt" preset calculates minimum reduction → save projection
7. ProcessHealthBar shows: CT 45s → 35.9s · Takt ✓

### Without CoScout (PWA)

1. Factor Intelligence generates questions deterministically
2. Auto-rule-out < 5%, auto-answer ≥ 15%
3. Coverage progress, follow-ups, hub creation — all work without AI
4. No synthesis prompts from CoScout, but prompted synthesis (Layer 2) still triggers from evidence clustering
5. What-If model prediction preset works (equation is deterministic)

---

## 13. Relationship to Existing Specs and ADRs

| Document                                                                          | Relationship                                                                        |
| --------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| [Investigation Reframing](2026-04-03-investigation-workspace-reframing-design.md) | **Predecessor** — three breakthrough insights incorporated here as foundation       |
| [Question-Driven EDA](2026-03-30-question-driven-eda-design.md)                   | **Extended** — EDA heartbeat mechanism added (follow-ups, next highlight, coverage) |
| [Improvement Hub](2026-04-02-improvement-hub-design.md)                           | **Aligned** — contextual What-If presets, hub → brainstorm link, reference naming   |
| [HMW Brainstorm](2026-04-03-hmw-brainstorm-modal-design.md)                       | **Compatible** — hub context passed to brainstorm session                           |
| [CoScout Intelligence](2026-04-02-coscout-intelligence-architecture-design.md)    | **Extended** — 2 new tools, phase coaching, enriched context                        |
| [PI Panel Redesign](2026-04-01-process-intelligence-panel-redesign.md)            | **Compatible** — Questions tab shows spine summary with equation display            |
| ADR-047 (Strategy Pattern)                                                        | Uses mode dispatch for evidence engines and What-If variants                        |
| ADR-052 (Factor Intelligence)                                                     | L1→L3 pipeline drives evidence thread                                               |
| ADR-053 (Question-Driven Investigation)                                           | Foundation — question model, 5 sources, auto-linking                                |
| ADR-054 (Mode-Aware Questions)                                                    | Mode routing for question generators                                                |
| ADR-061 (HMW Brainstorm)                                                          | Hub → brainstorm connection formalized                                              |
| ADR-062 (Standard ANOVA Metrics)                                                  | R²adj for ranking, η² for effect size, standardized labels                          |
