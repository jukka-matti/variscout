# Investigation to Action Workflow

From root cause discovery to projected improvement — the two-phase analyst workflow.

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

A quality investigation has two distinct mental modes:

| Phase                   | Tool              | Question                         | Output                 |
| ----------------------- | ----------------- | -------------------------------- | ---------------------- |
| **Investigate**         | Findings panel    | "What is causing the variation?" | Key factors identified |
| **Project improvement** | What-If Simulator | "What if we fixed it?"           | Projected Cpk/yield    |

Each phase requires a different cognitive approach. Separating them reduces cognitive load and prevents premature conclusions.

## Why Separate Phases?

An earlier design (the now-removed Variation Funnel) conflated investigation and projection into a single dense panel. The problem: analysts were simultaneously trying to explore data and imagine improvements. This led to:

- **Premature conclusions** — jumping to projections before understanding the full picture
- **Cognitive overload** — too many decisions in one place

The two-phase approach mirrors how experienced quality engineers actually think: first understand the root causes, then project improvement.

## Phase 1: Investigate (Findings)

**Goal:** Identify the factors driving variation.

Use the dashboard's drill-down workflow to progressively filter the data by factors. As you discover interesting patterns, pin them as findings:

1. **Drill into factors** — Click Boxplot/Pareto categories to filter. Each factor's ANOVA η² shows its contribution to total variation. Follow the highest contribution path.

2. **Pin findings** — Click the pin button in the breadcrumb bar to instantly capture the current filter state as a finding. Add a note later if desired — the filter chips and statistics are captured automatically.

3. **Review findings** — Open the Findings panel to see all bookmarked states. Click a finding card to restore its filter combination on the dashboard. Edit or delete findings as your understanding evolves.

The Findings panel can be popped out to a separate window for dual-monitor setups — keep findings visible on one screen while drilling on the other.

### Exit criterion

Stop investigating when:

- Cumulative contribution reaches 70% or more
- All meaningful factors have been explored
- Remaining variation is common cause (no factor has significant contribution)

### Output

A list of pinned findings, each with filter context, variation %, and analyst notes. These become the basis for improvement scenarios in Phase 2.

See [Drill-Down Workflow](drill-down-workflow.md) for detailed drill-down mechanics.

### Transition to Phase 2

After identifying key factors via findings, open the What-If Simulator to project improvement scenarios. The transition is manual: the investigation findings inform which adjustments to explore in What-If.

For example, if the investigation reveals that Machine B accounts for 35% of variation and the Weekend shift adds 20%, the analyst can use What-If to model centering the process (mean shift) and reducing spread (variation reduction) to estimate the combined Cpk improvement.

## Phase 2: Project Improvement (What-If Simulator)

**Goal:** Estimate what happens if you improve the process.

The What-If Simulator takes the current process statistics (after investigation filtering) and lets you explore improvements through direct adjustments:

### Standard Simulator

The `WhatIfSimulator` offers two direct adjustments:

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
| "I have findings, want to project"      | Phase 2 (What-If)     |
| "Full investigation from scratch"       | Phase 1 then Phase 2  |

## Example: Pizza Delivery Dataset

### Phase 1: Investigate

Using the Mindmap, drill into delivery time variation:

1. **Store** has the highest contribution: Store C accounts for 35% of variation
2. Within Store C, **Day** matters: Weekend deliveries are 8 minutes slower
3. **Driver** has a moderate effect (12%): Driver 3 is consistently slow

Cumulative: ~72% of variation explained.

### Phase 2: Project

Filter to Store C + Weekend, then use What-If:

- Shifting mean by -5 minutes (better routing) -> Cpk improves from 0.6 to 1.1
- Adding 20% variation reduction (standardized process) -> Cpk reaches 1.4
- Combined projection supports the business case for process improvement at Store C

## Related Documentation

- [Drill-Down Workflow](drill-down-workflow.md) — Phase 1 mechanics
- [Deep Dive](deep-dive.md) — 30-minute investigation pattern
- [Decision Trees](decision-trees.md) — Which analysis to use when
- [Four Lenses Workflow](four-lenses-workflow.md) — Foundational methodology
