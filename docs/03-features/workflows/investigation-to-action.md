---
title: 'Investigation to Action Workflow'
---

# Investigation to Action Workflow

<!-- journey-phase: investigate, improve -->

From variation discovery to projected improvement — the analyst workflow.

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

A quality analyst uses two complementary tools:

| Tool              | Question                         | Output                 |
| ----------------- | -------------------------------- | ---------------------- |
| Findings panel    | "What is driving the variation?" | Key factors identified |
| What-If Simulator | "What if we improved it?"        | Projected Cpk/yield    |

These tools are independent — use either one alone, or combine them for a full investigation-to-projection workflow.

## Why Two Tools?

An earlier design (the now-removed Variation Funnel) conflated investigation and projection into a single dense panel. The problem: analysts were simultaneously trying to explore data and imagine improvements. This led to:

- **Premature conclusions** — jumping to projections before understanding the full picture
- **Cognitive overload** — too many decisions in one place

Separating investigation (Findings) from projection (What-If) mirrors how experienced quality engineers think. But they are peers, not sequential phases — the What-If Simulator is equally useful for general target-setting without any investigation.

## Findings — Investigate Variation

**Goal:** Identify the factors driving variation.

Use the dashboard's drill-down workflow to progressively filter the data by factors. As you discover interesting patterns, pin them as findings:

1. **Drill into factors** — Click Boxplot/Pareto categories to filter. Each factor's ANOVA η² shows its contribution to total variation. Follow the highest contribution path.

2. **Pin findings** — Click the pin button in the breadcrumb bar to instantly capture the current filter state as a finding. Add a note later if desired — the filter chips and statistics are captured automatically.

3. **Add chart observations** — Right-click a Boxplot category or Pareto bar and select "Add observation" to create a finding anchored to that specific chart element. The observation text appears as a floating annotation on the chart and is stored as a Finding with source metadata.

4. **Review findings** — Open the Findings panel to see all bookmarked states. Click a finding card to restore its filter combination on the dashboard. Edit or delete findings as your understanding evolves.

The Findings panel can be popped out to a separate window for dual-monitor setups — keep findings visible on one screen while drilling on the other.

### Chart Observations

There are two ways to create findings:

| Method                | How                                            | What is captured                                             |
| --------------------- | ---------------------------------------------- | ------------------------------------------------------------ |
| **Breadcrumb pin**    | Click pin button in filter breadcrumb bar      | Current filter state, statistics, variation %                |
| **Chart observation** | Right-click chart category → "Add observation" | Category name, chart type, observation text, source metadata |

Chart-sourced findings carry a `source` chip on the FindingCard (e.g., "Boxplot: Machine C") so analysts can distinguish observations made on a specific chart element from drill-down filter pins.

The floating text box on the chart is a visual projection of the underlying Finding. Editing the text in the annotation box updates the Finding; editing the Finding text in the panel updates the annotation. The annotation box displays a small status dot matching the finding's investigation status color (amber/blue/purple).

Color highlights (red/amber/green) remain as separate lightweight visual markers on Boxplot and Pareto categories. They are stored in DisplayOptions and do not create findings.

In Board view, chart observations appear alongside drill-down findings, grouped by the same status columns (Observed / Investigating / Analyzed). The source chip helps identify which findings came from chart annotations versus breadcrumb pins.

### Exit criterion

Stop investigating when:

- Cumulative contribution reaches 70% or more
- All meaningful factors have been explored
- Remaining variation is common cause (no factor has significant contribution)

### Investigation Status Tracking

As findings accumulate, track their investigation progress:

| Status            | Badge  | Meaning                               |
| ----------------- | ------ | ------------------------------------- |
| **Observed**      | Amber  | Pattern spotted, not yet investigated |
| **Investigating** | Blue   | Actively drilling into this finding   |
| **Analyzed**      | Purple | Analysis completed                    |

Click a finding's status badge to change its status. Add timestamped comments
to record what you checked and what you learned.

### Classification Tags

When a finding reaches "Analyzed" status, classify it by contribution magnitude:

| Tag            | Color | Meaning                                        |
| -------------- | ----- | ---------------------------------------------- |
| **Key Driver** | Green | Significant variation contributor — actionable |
| **Low Impact** | Gray  | Minor or negligible contribution               |
| _(none)_       | —     | Not yet classified                             |

Tags reflect _contribution magnitude_, not causal certainty. VariScout quantifies
contribution, not causation — we measure how much variation a factor accounts for,
not whether it's the "root cause."

### Board View

Toggle the Findings panel to Board view for a grouped layout:

- **Panel**: Collapsible accordion sections per status (3 columns)
- **Popout window**: Horizontal columns with native drag-and-drop

The Board view helps organize findings during complex investigations with
many observations. Key Driver findings become a natural shortlist for action.

### Why keep Low Impact findings?

Low Impact findings document what was ruled out. This is valuable for:

- Audit trails ("we checked Machine C — minor contribution")
- Team handoffs ("don't repeat this investigation path")
- Returning to an analysis after weeks away

### Output

A list of pinned findings, each with filter context, variation %, tags, and analyst notes.

See [Drill-Down Workflow](drill-down-workflow.md) for detailed drill-down mechanics.

## What-If Simulator — Project Improvement

**Goal:** Estimate what happens if you improve the process.

The What-If Simulator is a standalone tool accessible from the header toolbar. It takes the current process statistics and lets you explore improvements through direct adjustments. Use it for:

- **Improvement modeling** — After investigation, project the impact of fixing a key driver
- **Project target-setting** — Set Cpk targets and see what mean/variation changes are needed
- **Prioritizing actions** — Compare different improvement scenarios

### Standard Simulator

The `WhatIfSimulator` offers two direct adjustments:

1. **Mean adjustment** — Shift the process center toward the target. Use this when the process is off-center (e.g., wrong machine setting).

2. **Variation reduction** — Reduce process spread. Use this when there's excessive scatter (e.g., inconsistent operator technique).

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

## Workflow Combinations

| Your situation                          | Use                           |
| --------------------------------------- | ----------------------------- |
| "I don't know what's causing variation" | Findings (investigate)        |
| "I want to set a Cpk target"            | What-If (project)             |
| "I have findings, want to project"      | Findings then What-If         |
| "Full investigation from scratch"       | Findings → classify → What-If |

## Example: Pizza Delivery Dataset

### Investigate

Drill into delivery time variation and pin findings:

1. **Store** has the highest contribution: Store C accounts for 35% of variation
2. Within Store C, **Day** matters: Weekend deliveries are 8 minutes slower
3. **Driver** has a moderate effect (12%): Driver 3 is consistently slow

Cumulative: ~72% of variation explained. Tag Store C + Weekend as "Key Driver", Driver 3 as "Low Impact" (small contribution alone).

### Project

Filter to Store C + Weekend, then use What-If:

- Shifting mean by -5 minutes (better routing) -> Cpk improves from 0.6 to 1.1
- Adding 20% variation reduction (standardized process) -> Cpk reaches 1.4
- Combined projection supports the business case for process improvement at Store C

## Related Documentation

- [Drill-Down Workflow](drill-down-workflow.md) — Investigation mechanics
- [Deep Dive](deep-dive.md) — 30-minute investigation pattern
- [Decision Trees](decision-trees.md) — Which analysis to use when
- [Four Lenses Workflow](four-lenses-workflow.md) — Foundational methodology
