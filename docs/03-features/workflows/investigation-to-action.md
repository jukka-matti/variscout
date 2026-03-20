---
title: Investigation to Action Workflow
audience: [analyst, engineer]
category: workflow
status: stable
related: [findings, what-if, hypothesis, improvement-actions]
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
      <div class="process-step__detail">Copy chart, save as PDF, or save project</div>
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

As findings accumulate, track their investigation progress. The available statuses depend on the product tier:

#### 5-Status Model (Azure Standard and Team)

| Status            | Badge  | Meaning                                     | Journey Phase                               | PDCA Mapping |
| ----------------- | ------ | ------------------------------------------- | ------------------------------------------- | ------------ |
| **Observed**      | Amber  | Pattern spotted, not yet investigated       | INVESTIGATE (diamond: Initial)              | —            |
| **Investigating** | Blue   | Actively drilling into this finding         | INVESTIGATE (diamond: Diverging/Validating) | —            |
| **Analyzed**      | Purple | Suspected cause identified                  | INVESTIGATE (diamond: Converging)           | —            |
| **Improving**     | Cyan   | Corrective actions assigned and in progress | IMPROVE                                     | PDCA: Do     |
| **Resolved**      | Green  | Actions completed, outcome verified         | IMPROVE                                     | PDCA: Act    |

> **Note:** The transition from `analyzed` → `improving` maps to the boundary between INVESTIGATE and IMPROVE. Improvement ideation and action selection happen while the finding is still `analyzed` (PDCA: Plan); the first corrective action triggers the transition to `improving` (PDCA: Do). Confirmation that a root cause is correct only comes when the outcome shows the process improved to target — not when the investigation converges.

#### 3-Status Model (PWA)

| Status            | Badge  | Meaning                               |
| ----------------- | ------ | ------------------------------------- |
| **Observed**      | Amber  | Pattern spotted, not yet investigated |
| **Investigating** | Blue   | Actively drilling into this finding   |
| **Analyzed**      | Purple | Analysis completed, ready to classify |

The PWA is an educational tool — its 3-status model covers the investigation workflow (Plan phase) without the operational complexity of corrective actions and outcome tracking. Users who need closed-loop tracking upgrade to the Azure App.

#### Progressive Disclosure by Tier

| Capability                  | PWA (Free)              | Azure Standard          | Azure Team                          |
| --------------------------- | ----------------------- | ----------------------- | ----------------------------------- |
| Finding statuses            | 3 (observe → analyze)   | 5 (observe → resolve)   | 5 (observe → resolve)               |
| Classification tags         | Key Driver / Low Impact | Key Driver / Low Impact | Key Driver / Low Impact             |
| Suspected cause             | -                       | Free text field         | Free text field                     |
| Corrective actions          | -                       | Action items list       | Action items + team assignment      |
| Outcome assessment          | -                       | Effective / Cpk after   | Effective / Cpk after               |
| Board columns               | 3                       | 5                       | 5                                   |
| Board time filter           | -                       | This week / month / all | This week / month / all             |
| Teams auto-posting          | -                       | -                       | On analyzed + resolved              |
| Knowledge base contribution | -                       | -                       | Resolved outcomes feed AI (Phase 2) |

Click a finding's status badge to change its status. Add timestamped comments
to record what you checked and what you learned.

#### Status Transitions

```
observed → investigating → analyzed → improving → resolved
                                                      ↓
                                         (reopen) → investigating
```

- **observed → investigating**: User starts working on the finding
- **investigating → analyzed**: Suspected cause identified, tags assigned
- **analyzed → improving**: First corrective action item added (auto-transition)
- **improving → resolved**: All actions completed AND outcome assessed (auto-transition)
- **Any status → previous**: Can step back one status
- **Resolved → investigating**: Reopen if the problem recurs

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

### Suspected Cause / Hypothesis (Azure only)

When a finding reaches "Analyzed" status, document why the variation is happening. VariScout uses **hypotheses** — testable theories linked to factors — instead of free-text suspected cause descriptions.

A hypothesis links to a specific factor and is automatically validated via ANOVA eta-squared thresholds. For causes that cannot be validated with data (physical inspection, domain expertise), gemba and expert validation types are available.

For structured investigation with multiple competing theories, use the **Hypothesis Investigation Flow** — a diamond pattern of diverge (generate sub-hypotheses), validate (test each), and converge (eliminate contradicted, confirm supported). See [Hypothesis Investigation](hypothesis-investigation.md) for the full workflow.

### Cause Role Model (Azure only)

Once hypotheses are validated, the analyst can mark which hypothesis is the **primary suspected cause** and which are **contributing factors**:

```typescript
// On the Hypothesis type
causeRole?: 'primary' | 'contributing'
```

- **Primary** — the main suspected cause driving the variation. Only one primary is allowed per root hypothesis tree (enforced by `setCauseRole`).
- **Contributing** — a secondary factor that amplifies or enables the primary cause but is not the main driver.
- _(none)_ — not yet classified.

The cause role is set from the `HypothesisNode` UI (see [Hypothesis Investigation](hypothesis-investigation.md) for the button interaction). When any hypothesis in the tree carries a causeRole and the finding is at `analyzed` status or higher, the **FindingCard** shows a "Suspected cause" section listing the primary hypothesis prominently, with contributing hypotheses listed beneath it. This makes the convergence conclusion visible directly on the finding card without opening the full tree view.

**"Hypothesis" vs "root cause":** VariScout finds _where_ variation is hiding
(the key factors), but identifying a factor (Machine A explains 47%) is not proving
root cause. The investigation diamond converges on a **suspected root cause** — the
best-supported theory, confident enough to act on. True confirmation only comes when
the process improves to target (outcome = effective at "Resolved" status). VariScout
uses "hypothesis" and "suspected root cause" throughout to maintain this distinction.
A suspected root cause becomes **confirmed** only when the outcome shows the fix was effective.

### Improvement Ideation (Azure only)

Improvement ideation is the first step of the **IMPROVE** phase (PDCA: Plan), not the tail end of investigation. Once the investigation diamond converges on a suspected root cause, the focus shifts from "understand the cause" to "fix the process."

The Improvement Ideas section on a finding unlocks once at least one hypothesis is supported. Analysts can generate multiple improvement ideas, estimate timeframe (just do/days/weeks/months), cost, and risk, then attach a What-If projection to each idea to quantify its expected impact on Cpk and yield.

| Field                  | Purpose                                                           |
| ---------------------- | ----------------------------------------------------------------- |
| **Idea text**          | What the improvement involves (e.g., "Replace nozzle tip weekly") |
| **Timeframe**          | Just do / Days / Weeks / Months — how long implementation takes   |
| **Cost estimate**      | None / Low / Medium / High — investment required                  |
| **Risk assessment**    | Low / Medium / High — implementation risk or uncertainty          |
| **What-If projection** | Attach a What-If simulation result to compute projected Cpk/yield |
| **Impact**             | Computed from projection (auto) or manually overridden            |
| **Selected**           | Mark the best idea(s) to convert into corrective actions          |
| **Notes**              | Additional context or reasoning                                   |

This is the creative bridge between "we know what causes the problem" and "here is our action plan." By comparing projected impact across ideas, analysts can prioritize the most effective fix before committing resources. Selected ideas flow naturally into the corrective actions list below.

#### Improvement Ideation Methodology

VariScout's improvement ideation follows the RDMAIC framework, which structures brainstorming around four directions and filters ideas through four feasibility criteria.

**Four Ideation Directions** — creative prompts that push thinking beyond the obvious fix:

| Direction     | Question                                                  | Example                                         |
| ------------- | --------------------------------------------------------- | ----------------------------------------------- |
| **Prevent**   | Can the root cause be prevented from occurring?           | Poka-yoke fixture that blocks wrong orientation |
| **Detect**    | Can the problem be made visible so it's caught earlier?   | In-line sensor alarm at ±2σ threshold           |
| **Simplify**  | Can the work be made easier or less error-prone?          | Pre-measured kits replacing manual weighing     |
| **Eliminate** | Can the work step be removed or fundamentally redesigned? | Automation of the manual adjustment step        |

Working through all four directions before evaluating prevents premature convergence on the first idea that comes to mind.

**Four Feasibility Criteria** — quality filter applied to each idea. The best improvement says "yes" to all four:

| Criterion                   | Why it matters                                       |
| --------------------------- | ---------------------------------------------------- |
| **Removes root cause?**     | Treating symptoms isn't enough — the problem returns |
| **Can we do it ourselves?** | Dependencies on others delay weeks                   |
| **Can we try small?**       | Small experiment, big learning; failure is cheap     |
| **Can we measure it?**      | Without a metric, you won't know if it worked        |

**Prioritization principle:** Prefer lean improvements (no investment) first. The best improvement is the simplest one that addresses the root cause. A cheap experiment that removes the root cause beats a capital project that merely reduces symptoms. The **Prioritization Matrix** (impact vs timeframe scatter plot) visualizes all ideas at once, making it easy to spot quick wins (high impact, short timeframe) and avoid time sinks (low impact, long timeframe). See [Improvement Prioritization](improvement-prioritization.md) for the full matrix design.

### Idea → What-If Round-Trip

Each improvement idea can be linked directly to a What-If simulation. Clicking the **"P" (Project)** button on an idea opens the What-If Simulator with a context banner identifying the linked finding and idea. Adjusting the sliders and clicking **"Save to idea"** captures the resulting projection (projected mean, σ, Cpk, yield) back onto the idea record — no manual copying required.

This creates a round-trip workflow: ideas live in the finding, projections live in What-If, and the result flows back. Analysts can run multiple scenarios (one per idea) and compare their projected Cpk impact side by side on the FindingCard before selecting which idea to convert into corrective actions.

### Corrective Actions (Azure only)

When a suspected cause is identified, define corrective actions. Each action item is typed as:

```typescript
interface ActionItem {
  id: string;
  text: string; // What needs to be done (required)
  assignee?: FindingAssignee; // Person responsible (optional)
  dueDate?: number; // When the action should be completed (optional)
  completedAt?: number; // When the action was completed (timestamp)
  createdAt: number; // When the action was created
}
```

- **Action text** — What needs to be done (required)
- **Assignee** — Person responsible (people picker, optional; Team plan enables team-wide picker)
- **Due date** — When the action should be completed (optional)
- **Completion** — Checkbox to mark done (sets `completedAt` timestamp)

When the first action is added to an "analyzed" finding, the status automatically
transitions to "improving."

**Overdue indicators:** When a due date has passed and the action is not completed,
the action row shows a red border and "Overdue" label. No notifications are sent —
this is a visual indicator on the card and in Teams postings.

### Outcome Assessment (Azure only)

When all corrective actions are completed, assess the outcome. The outcome is typed as:

```typescript
interface FindingOutcome {
  effective: 'yes' | 'no' | 'partial';
  cpkBefore?: number; // Baseline Cpk (auto-filled from first stage)
  cpkAfter?: number; // Measured Cpk after corrective action
  notes?: string; // Free-text outcome description
  verifiedAt: number; // When the outcome was verified
}
```

- **Effective** — "Yes" / "No" / "Partial" selector
- **Cpk before** — Baseline capability before the corrective action. Auto-filled from the first stage when using staged analysis, or from `finding.context.stats.cpk` as fallback
- **Cpk after** — Measured capability after the corrective action. Auto-filled from the last stage when using staged analysis
- **Notes** — Free-text description of the outcome

When all actions are completed AND the outcome is set, the status automatically
transitions to "resolved."

If the outcome is "No" or "Partial," consider starting a new PDCA cycle — pin a new
finding from the current state to investigate further.

> **Verification with Staged Analysis**: The most effective way to verify an improvement is to combine before+after data with a Stage column and use [Staged Analysis](../../03-features/analysis/staged-analysis.md). The StagedComparisonCard shows quantified deltas (mean shift, σ change, Cpk delta) between stages. VerificationEvidenceBase in Report Step 5 offers a chart toggle stack for visual verification. `cpkBefore` and `cpkAfter` are auto-filled from staged comparison data. AI components (NarrativeBar, CoScout, ChartInsightChip) are stage-aware and summarize improvement quantitatively. See [ADR-023](../../07-decisions/adr-023-data-lifecycle.md) for the full verification experience design and [Azure Daily Use — Phase 4](../../02-journeys/flows/azure-daily-use.md#phase-4--verification-proving-the-improvement-worked) for the chart-by-chart verification workflow.

### Knowledge Base Contribution (Azure Team, Phase 2)

Resolved findings with outcome data contribute to a team knowledge base. When a finding
reaches "resolved" status with a verified outcome, the structured data (suspected cause,
actions taken, effectiveness, Cpk improvement) is available for the AI knowledge base
(see [ADR-019](../../07-decisions/adr-019-ai-integration.md)). This enables:

- Pattern matching: "This type of drift was caused by nozzle wear 60% of the time"
- Action suggestions: "For similar findings, nozzle replacement has a 90% success rate"
- Improvement tracking: "Average Cpk improvement for resolved findings: +0.45"

Knowledge base features are Team plan only and require Phase 2 AI deployment.

### Board View

Toggle the Findings panel to Board view for a grouped layout:

- **Panel**: Collapsible accordion sections per status
- **Popout window**: Horizontal columns with native drag-and-drop

**Azure App (5 columns):**

| Observed | Investigating | Analyzed | Improving | Resolved |
| -------- | ------------- | -------- | --------- | -------- |

**PWA (3 columns):**

| Observed | Investigating | Analyzed |
| -------- | ------------- | -------- |

- **Analyzed** cards: show suspected cause badge if populated
- **Improving** cards: show action progress (e.g., "2/3 done") and overdue indicators
- **Resolved** cards: show outcome badge (green check = effective, red = not, amber = partial)

The Board view helps organize findings during complex investigations with
many observations. Key Driver findings become a natural shortlist for action.

#### Board Time Filter

The board includes a time filter for managing finding accumulation in daily monitoring:

- **This week** — Shows findings created this week (or resolved this week)
- **This month** — Shows findings created this month (or resolved this month)
- **All time** (default) — Shows everything

A team leader doing daily monitoring sets filter to "This week" to focus on current
findings. Resolved findings from previous weeks are hidden but remain in the data.
Persisted in ViewState per project.

### Why keep Low Impact findings?

Low Impact findings document what was ruled out. This is valuable for:

- Audit trails ("we checked Machine C — minor contribution")
- Team handoffs ("don't repeat this investigation path")
- Returning to an analysis after weeks away

### Output

A list of pinned findings, each with filter context, variation %, tags, and analyst notes.
Findings at "Improving" or "Resolved" status additionally carry corrective actions,
outcomes, and Cpk improvement data.

See [Drill-Down Workflow](drill-down-workflow.md) for detailed drill-down mechanics.

### Teams Auto-Posting

When a finding reaches key statuses, VariScout auto-posts to the Teams channel (Team plan only):

**On Analyzed** (with suspected cause + actions):

```
📌 Finding Analyzed: Fill Head 3 drift — morning shift

Suspected cause: Nozzle tip worn beyond tolerance

Actions:
☐ Replace nozzle tip on Fill Head 3 — @Kim Larsson — Due: Mar 15
☐ Add nozzle inspection to daily checklist — @Jan Virtanen — Due: Mar 25
```

**On Resolved** (with outcome):

```
✅ Finding Resolved: Fill Head 3 drift — morning shift

Outcome: Effective ✓
Cpk: 0.85 → 1.35
Notes: Nozzle replacement resolved drift. Monitoring for 2 weeks.
```

Uses [ADR-018](../../07-decisions/adr-018-channel-mention-workflow.md) @mention workflow infrastructure.

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

| Your situation                          | Use                                                         | Tier Required |
| --------------------------------------- | ----------------------------------------------------------- | ------------- |
| "I don't know what's causing variation" | Findings (investigate)                                      | All           |
| "I want to set a Cpk target"            | What-If (project)                                           | All           |
| "I have findings, want to project"      | Findings then What-If                                       | All           |
| "Full investigation from scratch"       | Findings → classify → What-If                               | All           |
| "Full closed-loop improvement"          | Findings → actions → resolve → verify Cpk change            | Azure         |
| "Team improvement with verification"    | Findings → assign actions → resolve → Teams post → AI learn | Azure Team    |

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

## Convergence Synthesis

The convergence synthesis is a deliberate pause between the INVESTIGATE and IMPROVE phases. Before shifting to improvement planning, the analyst writes a concise narrative summarizing what the evidence points to.

### When It Occurs

The synthesis step activates when the investigation diamond reaches the **Converging** sub-phase:

- At least one hypothesis has `status: 'supported'` or `causeRole: 'primary'`
- The investigation diamond reaches the Converging phase

The analyst can write the synthesis at any time, or skip it entirely.

### Storage

The synthesis is stored on `ProcessContext.synthesis` (max 500 characters). It lives on `ProcessContext` rather than on a single finding because it describes the analyst's overall process understanding — potentially synthesizing evidence from multiple findings and hypotheses.

```typescript
interface ProcessContext {
  // ... other fields
  /** Convergence synthesis — suspected cause narrative (max 500 chars) */
  synthesis?: string;
}
```

### Language Guidance

VariScout builds understanding through structured learning. The synthesis field enforces careful language:

| Use                         | Avoid                      |
| --------------------------- | -------------------------- |
| "The evidence points to..." | "Confirmed that..."        |
| "The evidence suggests..."  | "Root cause identified..." |
| "Suspected cause"           | "Proven cause"             |

True confirmation only comes when the process improves to target (outcome = effective at "Resolved" status). The synthesis captures the best-supported theory — confident enough to act on, but not yet proven.

### Where Synthesis Surfaces

| Surface                   | How It Appears                                              |
| ------------------------- | ----------------------------------------------------------- |
| **Board view header**     | Read-only card above status columns (when populated)        |
| **Improvement workspace** | Editable SynthesisCard at top of the improvement plan       |
| **Report Step 3**         | "Suspected Cause" section with synthesis narrative          |
| **CoScout context**       | Included in system prompt to ground improvement suggestions |
| **Narration prompt**      | Included in `buildSummaryPrompt` for narrative generation   |

### CoScout Drafting (Azure Team AI)

When CoScout is available, the analyst can request a draft synthesis. CoScout assembles a narrative from supported hypotheses, key-driver findings, and eta-squared evidence. The draft appears in the synthesis field for editing — the analyst always has final edit control. CoScout drafts use "The evidence suggests..." framing, never "Confirmed that..." language.

## Improvement Planning Workflow

The Improvement Planning Workflow bridges the gap between investigation convergence and corrective action execution. It follows a three-workspace transition model that matches the analyst's shifting cognitive task.

### Three-Workspace Transition

| Step                   | Workspace       | What Happens                                                                   |
| ---------------------- | --------------- | ------------------------------------------------------------------------------ |
| 1. Discover variation  | **Analysis**    | Dashboard charts, drill-down, filter navigation                                |
| 2. Build understanding | **Findings**    | Hypothesis tree, validation, convergence synthesis                             |
| 3. Plan improvements   | **Improvement** | Brainstorm ideas, estimate timeframe/cost/risk, prioritize, convert to actions |

The analyst moves between workspaces as their focus shifts. Navigation tabs (Analysis | Findings | Improvement) provide direct access. All workspaces support popout via URL parameters (`?view=findings`, `?view=improvement`) for dual-monitor setups.

### Improvement Workspace Layout

The `ImprovementWorkspaceBase` provides a full-page planning view:

1. **SynthesisCard** — The convergence synthesis narrative anchors the page. Editable text area (max 500 chars) with linked finding badges showing key-driver findings that contributed to the synthesis.

2. **Four Directions hint** — A single-line creative prompt: "Think: Prevent · Detect · Simplify · Eliminate". Surfaces the RDMAIC ideation framework as a lightweight brainstorming aid.

3. **IdeaGroupCards** — Ideas grouped by supported/partial hypothesis. Each idea row contains: selection checkbox, idea text, direction badge (prevent/detect/simplify/eliminate), timeframe dropdown (just do/days/weeks/months), cost estimate dropdown (none/low/medium/high), risk assessment dropdown (low/medium/high), projection badge if a What-If simulation is attached, and action buttons for What-If and CoScout.

4. **ImprovementSummaryBar** — Sticky bottom bar aggregating: selected idea count, timeframe breakdown, best projected Cpk from selected ideas, and "Convert selected → Actions" button.

### Idea → Action Conversion

When the analyst selects ideas and clicks "Convert selected → Actions":

1. Each selected idea creates an `ActionItem` with `ideaId` FK for traceability
2. The action text is copied from the idea text
3. Actions are routed to the correct finding via the hypothesis's `findingId` link
4. If this is the first action on an `analyzed` finding, status auto-transitions to `improving`
5. Converted ideas show a "→ Action" indicator in the workspace

### Projected vs Actual Learning Loop

The `ideaId` FK enables a learning loop in the FindingCard outcome section. When a finding has an outcome with `cpkAfter` and an action linked to an idea with a What-If projection, the card displays:

```
Projected 1.35 → Actual 1.42 (+0.07)
```

Green when actual meets or exceeds projection, red when it falls short. Over time, this builds estimation confidence and feeds the Knowledge Base (Azure Team AI).

### CoScout-Optional Design

Every step works without AI. CoScout enhances but never gates:

| Step              | Without CoScout                             | With CoScout                                                             |
| ----------------- | ------------------------------------------- | ------------------------------------------------------------------------ |
| Write synthesis   | Manual text field with placeholder guidance | "Draft synthesis" generates narrative from evidence                      |
| Brainstorm ideas  | Manual entry, Four Directions hint visible  | `suggest_improvement_idea` tool generates ideas with timeframe/direction |
| Project impact    | What-If Simulator manual sliders            | CoScout can suggest simulation parameters                                |
| Convert → Actions | Select ideas, click Convert                 | Same — conversion is always user-initiated                               |

## Related Documentation

- [Drill-Down Workflow](drill-down-workflow.md) — Investigation mechanics
- [Deep Dive](deep-dive.md) — 30-minute investigation pattern
- [Decision Trees](decision-trees.md) — Which analysis to use when
- [Four Lenses Workflow](four-lenses-workflow.md) — Foundational methodology
- [Findings Components](../../06-design-system/components/findings.md) — Design system specs
- [AI Components](../../06-design-system/components/ai-components.md) — NarrativeBar, ChartInsightChip, CoScoutPanel specs
- [Hypothesis Investigation](hypothesis-investigation.md) — Diamond pattern root cause investigation
- [Improvement Prioritization](improvement-prioritization.md) — Prioritization matrix, cost/risk assessment, idea comparison
- [ADR-015: Investigation Board](../../07-decisions/adr-015-investigation-board.md) — Architectural decisions
- [ADR-020: Investigation Workflow](../../07-decisions/adr-020-investigation-workflow.md) — Hypothesis model decisions
- [ADR-019: AI Integration](../../07-decisions/adr-019-ai-integration.md) — Knowledge base dependency
- [AI Journey Integration](../../05-technical/architecture/ai-journey-integration.md) — AI × investigation phase touch points
- [ADR-023: Verification Experience](../../07-decisions/adr-023-data-lifecycle.md) — Data lifecycle, staged comparison, verification vision
- [ADR-024: Scouting Report](../../07-decisions/adr-024-scouting-report.md) — Dynamic Report View for sharing investigation stories
