# Investigation to Action Workflow

From root cause discovery to projected improvement — the three-phase analyst workflow.

<div class="process-map">
  <div class="process-step">
    <div class="process-step__box process-step__box--input">
      <div class="process-step__title">Load Data</div>
      <div class="process-step__detail">Paste or upload</div>
    </div>
    <div class="process-step__clicks">2-3 actions</div>
  </div>
  <div class="process-arrow"></div>
  <div class="process-step">
    <div class="process-step__box process-step__box--navigate">
      <div class="process-step__title">Start Analysis</div>
      <div class="process-step__detail">Map columns, Start</div>
    </div>
    <div class="process-step__clicks">3-4 clicks</div>
  </div>
  <div class="process-arrow"></div>
  <div class="process-step">
    <div class="process-step__box process-step__box--read">
      <div class="process-step__title">Scan I-Chart</div>
      <div class="process-step__detail">Red dots, runs?</div>
    </div>
    <div class="process-step__clicks">0 clicks</div>
  </div>
  <div class="process-arrow"></div>
  <div class="process-step">
    <div class="process-step__box process-step__box--decision">
      <div class="process-step__title">Stable?</div>
      <div class="process-step__detail">Blue → skip. Red → investigate</div>
    </div>
    <div class="process-step__clicks">0 clicks</div>
  </div>
  <div class="process-arrow"></div>
  <div class="process-step">
    <div class="process-step__box process-step__box--analyze">
      <div class="process-step__title">Drill Factors</div>
      <div class="process-step__detail">ANOVA → filter top eta</div>
    </div>
    <div class="process-step__clicks">1-2 clicks</div>
  </div>
  <div class="process-arrow"></div>
  <div class="process-step">
    <div class="process-step__box process-step__box--navigate">
      <div class="process-step__title">Enter Specs</div>
      <div class="process-step__detail">USL, LSL, Apply</div>
    </div>
    <div class="process-step__clicks">6 actions</div>
  </div>
  <div class="process-arrow"></div>
  <div class="process-step">
    <div class="process-step__box process-step__box--navigate">
      <div class="process-step__title">Export / Save</div>
      <div class="process-step__detail">Copy chart or save</div>
    </div>
    <div class="process-step__clicks">1 click</div>
  </div>
  <div class="process-summary">
    <div class="process-summary__total">~15 actions</div>
    <div class="process-summary__time">~10 min</div>
  </div>
</div>

_See [full process map](process-maps.md#analyst-flow-a-process-investigation) with all decision points._

## Overview

A quality investigation has three distinct mental modes:

| Phase                   | Tool                  | Question                         | Output                 |
| ----------------------- | --------------------- | -------------------------------- | ---------------------- |
| **Investigate**         | Investigation Mindmap | "What is causing the variation?" | Key factors identified |
| **Refine model**        | Regression (Advanced) | "Which factors truly matter?"    | Parsimonious model     |
| **Project improvement** | What-If Simulator     | "What if we fixed it?"           | Projected Cpk/yield    |

Each phase requires a different cognitive approach. Separating them reduces cognitive load and prevents premature conclusions.

## Why Separate Phases?

An earlier design (the Variation Funnel) conflated all three modes into a single dense panel. The problem: analysts were simultaneously trying to explore data, simplify models, and imagine improvements. This led to:

- **Premature model reduction** — removing terms before the investigation was complete
- **Confirmation bias** — jumping to projections before understanding the full picture
- **Cognitive overload** — too many decisions in one place

The three-phase approach mirrors how experienced quality engineers actually think: first understand, then simplify, then project.

## Phase 1: Investigate (Mindmap)

**Goal:** Identify the factors driving variation.

Use the Investigation Mindmap to progressively drill into the data:

1. **Drilldown mode** — Click factors to filter. Each node shows its contribution to total variation. Follow the highest contribution path.

2. **Interaction mode** — Check whether factors combine. Two factors with low individual contribution can have a large joint effect.

3. **Narrative mode** — Review the investigation timeline. See every drill step in sequence to verify the logic.

### Exit criterion

Stop investigating when:

- Cumulative contribution reaches 70% or more
- All meaningful factors have been explored
- Remaining variation is common cause (no factor has significant contribution)

### Output

A list of key factors and their contribution percentages. These become the starting predictors for Phase 2.

See [Drill-Down Workflow](drill-down-workflow.md) for detailed drill-down mechanics.

## Phase 2: Refine Model (Regression Advanced Mode)

**Goal:** Determine which factors truly matter using a statistical model.

Start from the investigation findings: add the identified factors as predictors in Advanced Regression mode. Then use guided model reduction to simplify.

### Why Adj. R² is the key metric

When you add a predictor to a regression model, R² always increases — even if the predictor is pure noise. This makes R² unreliable for deciding whether a term belongs in the model.

**Adjusted R²** penalizes for the number of predictors. It can decrease when a term does not contribute enough to justify its degrees of freedom. This is the correct criterion for keep-or-remove decisions:

| Scenario          | R²                 | Adj. R²               | Interpretation                   |
| ----------------- | ------------------ | --------------------- | -------------------------------- |
| Remove noise term | Decreases slightly | Unchanged or improves | Term was noise — removal correct |
| Remove real term  | Decreases          | Decreases noticeably  | Term mattered — consider keeping |

### Guided reduction process

1. Run multi-regression with all identified factors (and interactions if applicable)
2. The suggestion banner highlights the **weakest term** — the one with the highest p-value among non-significant terms
3. Review the suggestion: is it an interaction term? A main effect? Does it have high VIF?
4. Click **Remove term** to drop it from the model
5. The model re-fits automatically. The step log records:
   - Which term was removed
   - Adj. R² before and after
   - Whether the removal improved or hurt the model
6. Repeat until all remaining terms are significant
7. The banner shows "All terms significant — model is well-specified"

### VIF and multicollinearity

During reduction, watch for VIF warnings:

| VIF  | Severity | Action                                      |
| ---- | -------- | ------------------------------------------- |
| < 5  | Low      | No concern                                  |
| 5–10 | Moderate | Monitor — may indicate shared variance      |
| > 10 | Severe   | Prioritize removal — predictor is redundant |

A term with severe VIF is suggested for removal regardless of its p-value, because its coefficient estimate is unreliable.

### Output

A reduced model containing only statistically significant terms, with Adj. R² tracking showing that no meaningful explanatory power was lost.

## Phase 3: Project Improvement (What-If Simulator)

**Goal:** Estimate what happens if you improve the process.

The What-If page takes the current process statistics (after investigation filtering) and lets you explore two adjustments:

1. **Mean adjustment** — Shift the process center toward the target. Use this when the investigation revealed an off-center process (e.g., wrong machine setting).

2. **Variation reduction** — Reduce process spread. Use this when the investigation revealed excessive scatter (e.g., inconsistent operator technique).

### What you see

- **Current vs. projected statistics** — Mean, standard deviation, Cpk side by side
- **Yield improvement** — Percentage of in-spec production, current vs. projected
- **Color-coded Cpk** — Green (capable), amber (marginal), red (not capable)

### Interpreting projections

Projections assume normal distribution and apply the adjustments to the current filtered data. They answer: "If we shifted the mean by X and reduced variation by Y%, what would our capability look like?"

These are estimates, not guarantees. Use them for:

- Justifying improvement projects ("shifting mean by 2 units would improve Cpk from 0.8 to 1.4")
- Prioritizing actions ("mean shift alone gets us to 1.2, but we need variation reduction too")
- Setting realistic targets

## Workflow Selection

| Your situation                          | Start at              |
| --------------------------------------- | --------------------- |
| "I don't know what's causing variation" | Phase 1 (Investigate) |
| "I know the factors, need a model"      | Phase 2 (Refine)      |
| "I have findings, want to project"      | Phase 3 (What-If)     |
| "Full investigation from scratch"       | Phase 1 → 2 → 3       |

## Example: Pizza Delivery Dataset

### Phase 1: Investigate

Using the Mindmap, drill into delivery time variation:

1. **Store** has the highest contribution: Store C accounts for 35% of variation
2. Within Store C, **Day** matters: Weekend deliveries are 8 minutes slower
3. **Driver** has a moderate effect (12%): Driver 3 is consistently slow

Cumulative: ~72% of variation explained.

### Phase 2: Refine

Add Store, Day, Driver, and Store x Day interaction as predictors:

| Step          | Action                          | Adj. R²                                                  |
| ------------- | ------------------------------- | -------------------------------------------------------- |
| Initial model | All 4 terms                     | 41.2%                                                    |
| Step 1        | Remove Driver (p = 0.34)        | 41.5% (improved — Driver was noise in the model context) |
| Step 2        | All remaining terms significant | Done                                                     |

Final model: Delivery Time = f(Store, Day, Store x Day) with Adj. R² = 41.5%.

### Phase 3: Project

Filter to Store C + Weekend, then use What-If:

- Shifting mean by -5 minutes (better routing) → Cpk improves from 0.6 to 1.1
- Adding 20% variation reduction (standardized process) → Cpk reaches 1.4
- Combined projection supports the business case for process improvement at Store C

## Related Documentation

- [Drill-Down Workflow](drill-down-workflow.md) — Phase 1 mechanics
- [Deep Dive](deep-dive.md) — 30-minute investigation pattern
- [Decision Trees](decision-trees.md) — Which analysis to use when
- [Four Lenses Workflow](four-lenses-workflow.md) — Foundational methodology
