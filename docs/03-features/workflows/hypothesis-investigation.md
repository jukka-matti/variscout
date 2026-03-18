---
title: Hypothesis Investigation Flow
audience: [analyst, engineer]
category: workflow
status: stable
related: [hypothesis, root-cause, investigation-phases, investigation-diamond]
---

# Hypothesis Investigation Flow

Structured investigation using the diamond pattern — diverge, validate, converge on a suspected cause.

## Overview

When you identify a key variation driver through drill-down analysis, the next question is _why_. The Hypothesis Investigation Flow provides a structured way to explore possible causes, test them against data and real-world evidence, and converge on a suspected root cause.

The investigation follows a **diamond pattern** — four phases of structured learning:

1. **Initial** — The upfront hypothesis (from FRAME's analysis brief) or a new observation becomes the root node of the hypothesis tree
2. **Diverge** — The tree grows — break the broad cause into testable sub-hypotheses
3. **Validate** — Test each leaf — data (ANOVA auto-validate), Gemba (go inspect), expert input
4. **Converge** — The tree narrows — prune contradicted branches, promote the suspected root cause

The diamond closes at Converging. What follows — improvement ideation, corrective actions, implementation, and verification — belongs to the **IMPROVE** phase (PDCA). See [Analysis Journey Map § Phase 4: IMPROVE](analysis-journey-map.md#phase-4-improve).

This mirrors how experienced quality engineers think: cast a wide net, then narrow down. VariScout structures this natural process so nothing is lost and the reasoning trail is documented.

## Data Validation vs Gemba/Expert Validation

Not every hypothesis can be tested with data. VariScout supports three validation types:

| Validation Type | When to Use                                      | How It Works                                             |
| --------------- | ------------------------------------------------ | -------------------------------------------------------- |
| **Data**        | The hypothesis links to a factor in your dataset | ANOVA eta-squared automatically validates the hypothesis |
| **Gemba**       | You need to physically inspect something         | Define a task, go look, record what you find             |
| **Expert**      | You need domain knowledge beyond the data        | Consult an expert, record their assessment               |

### Data Validation (Automatic)

Link a hypothesis to a factor column and value. VariScout runs ANOVA and automatically sets the hypothesis status based on eta-squared thresholds:

- **Supported** (>= 15% eta-squared) — the factor explains meaningful variation
- **Contradicted** (< 5% eta-squared) — the factor explains negligible variation
- **Partial** (5-15% eta-squared) — inconclusive, may warrant further investigation

This is the same auto-validation from the existing hypothesis feature, now extended to work within a tree structure.

### Gemba Validation (Go and See)

For hypotheses like "the nozzle tip is worn" or "the conveyor belt is misaligned," you cannot validate from data alone. Create a gemba task:

1. Write what to check ("Inspect nozzle tip wear on Machine 5")
2. Go to the shop floor and inspect
3. Mark the task as completed
4. Record what you found ("Nozzle tip worn 0.3mm beyond tolerance")
5. Set the hypothesis status manually (supported/contradicted/partial)

### Expert Validation (Domain Knowledge)

Similar to gemba, but for questions that require expertise rather than physical inspection. "Could the resin batch variation cause this pattern?" — consult the materials engineer, record their assessment.

## Using the Tree View

### In the Findings Panel

When a finding has hypotheses with sub-hypotheses, the Findings panel can display them in tree view mode. Toggle between List, Board, and Tree views using the view mode selector.

Tree view shows one finding at a time with its full hypothesis tree:

```
Hypotheses                                [+ Add]

● Machine 5 is causing drift               [data]
  ├── ● Worn nozzle tip                   [gemba]  🎯 PRIMARY
  │     Task: Check nozzle wear           [Done]
  │     "Worn 0.3mm beyond spec"
  ├── ● Temperature instability             [data]  CONTRIBUTING
  │     Factor: Temperature  eta=23%
  └── ✗ Operator technique variance         [data]
        Factor: Operator  eta=3%

Progress: 2/3 tested, 1 contradicted
```

- **Status dots** use the standard colors (amber = untested, blue = partial, green = supported, red = contradicted)
- **Factor badges** show the linked factor name and eta-squared percentage
- **Validation type icons** distinguish data, gemba, and expert hypotheses
- **Contradicted hypotheses** are dimmed (50% opacity) with strikethrough text — visible but clearly eliminated
- **Children summaries** show "N children (M supported)" when a node is collapsed

### Inline Sub-Hypothesis Creation

The **"+" button** on a hypothesis node no longer uses `window.prompt()`. Clicking "+" expands an inline form directly within the tree node:

- **Text input** — hypothesis statement (required, 5–200 chars)
- **Factor dropdown** (optional) — link to a factor column for automatic data validation
- **Validation type radio buttons** — `data` / `gemba` / `expert` (defaults to `data` when a factor is selected, `gemba` otherwise)

Pressing Enter or clicking "Add" creates the sub-hypothesis and collapses the form. Pressing Escape cancels without saving. Validation errors are shown inline (e.g., "Text is required" or tree depth/width limit warnings).

### Cause Role Marking

When a hypothesis reaches `supported` or `partial` status, a **🎯 button** appears on its `HypothesisNode` row. Clicking it cycles the hypothesis through three cause roles:

```
none → primary → contributing → none → …
```

Constraints:

- Only **one primary** is allowed per root hypothesis tree. Marking a second hypothesis as primary automatically demotes the previous primary to `contributing`.
- `contributing` has no uniqueness limit — any number of hypotheses in the tree can be marked as contributing.
- The cycle button is only available on supported/partial hypotheses; contradicted hypotheses cannot carry a cause role.

**Visual badges on the node:**

| Role           | Badge                  |
| -------------- | ---------------------- |
| `primary`      | `PRIMARY` (blue)       |
| `contributing` | `CONTRIBUTING` (slate) |
| _(none)_       | — (no badge)           |

Once any cause role is set and the finding is at `analyzed` status or higher, the **FindingCard** (outside the tree view) renders a "Suspected cause" section showing the primary hypothesis prominently and listing contributing hypotheses beneath it. This surfaces the convergence conclusion without requiring the analyst to expand the full tree.

### In the Popout Window

The FindingsWindow popout adds two features for investigation:

**Problem Brief Header** — When you have set a problem statement (in Settings or column mapping), it appears as a compact header at the top of the popout window, keeping the investigation goal visible.

**CoScout Sidebar** — A collapsible sidebar on the right shows the current investigation phase, suggests uncovered factor categories, and provides a link to open CoScout with investigation context pre-loaded.

### Tree Constraints

To keep investigations focused and manageable:

| Constraint   | Limit | Why                                                                    |
| ------------ | ----- | ---------------------------------------------------------------------- |
| Max depth    | 3     | Root, child, grandchild. Deeper means you should decompose differently |
| Max children | 8     | Per parent. More than 8 sub-hypotheses = too broad                     |
| Max total    | 30    | Per finding. Hard cap across the entire tree                           |

## Upfront Hypothesis Thread

When the analyst enters with a hypothesis (hypothesis-driven entry path), the analysis brief captures it during FRAME. This upfront hypothesis becomes the root node of the hypothesis tree when investigation begins, creating a continuous thread from initial theory through validated understanding.

For example: "I think Machine 5 has drifted" → captured in FRAME → confirmed in SCOUT (eta-squared shows Machine 5 at 47%) → becomes tree root in INVESTIGATE → diverge into sub-hypotheses (worn nozzle, temperature drift, operator technique) → validate → converge on suspected root cause.

The thread is currently conceptual — the analysis brief captures upfront hypotheses as text, but the hypothesis tree starts fresh. See [Journey Model § Known Gaps](../../05-technical/architecture/mental-model-hierarchy.md#known-gaps) for the opportunity to connect them programmatically.

## CoScout Investigation Prompts

When AI is configured, CoScout adapts its suggestions to the current investigation phase:

| Phase      | What CoScout Helps With                                                 |
| ---------- | ----------------------------------------------------------------------- |
| Initial    | Suggests possible causes based on the problem and data                  |
| Diverging  | Suggests additional sub-hypotheses, highlights uncovered factor roles   |
| Validating | Suggests how to validate untested hypotheses (data checks, gemba tasks) |
| Converging | Helps evaluate which supported hypotheses are most likely root cause    |

> **Note:** CoScout also assists during IMPROVE — suggesting corrective actions, assisting with What-If parameter selection, and summarising before/after comparison — but this is part of the IMPROVE phase's PDCA cycle, not the investigation diamond.

CoScout also checks which factor categories (equipment, temporal, operator, material, location) have been covered by hypotheses and nudges the analyst to consider uncovered categories. For example, if you have equipment and temporal hypotheses but no material hypothesis, CoScout might suggest: "Have you considered whether raw material batch variation could explain the drift?"

## Example: Machine 5 Packaging Line

### Scenario

Fill weight variation on a packaging line exceeds the +/-2g specification. I-Chart shows a drift pattern starting two weeks ago. ANOVA drill-down identifies Machine 5 as the top contributor (47% eta-squared).

### Investigation

**1. Root hypothesis:** "Machine 5 mechanical issue is causing fill weight drift"

**2. Diverge — generate sub-hypotheses:**

- "Worn nozzle tip" (gemba — needs physical inspection)
- "Temperature controller drift" (data — temperature factor in dataset)
- "Operator technique variance" (data — operator factor in dataset)
- "Vibration from adjacent line" (expert — ask maintenance engineer)

**3. Validate each:**

- **Worn nozzle tip** [gemba]: Go to Machine 5, inspect nozzle. Result: "Tip worn 0.3mm beyond tolerance." Status: **Supported**.
- **Temperature drift** [data]: Link to Temperature factor. eta-squared = 23%. Status: **Supported**.
- **Operator variance** [data]: Link to Operator factor. eta-squared = 3%. Status: **Contradicted**.
- **Vibration** [expert]: Ask maintenance. Result: "Adjacent line was offline during the drift period, no vibration." Status: **Contradicted**.

**4. Converge:**

Two hypotheses supported (worn nozzle + temperature drift), two contradicted. The worn nozzle is the suspected root cause — it directly explains the mechanical drift and the temperature instability (worn nozzle affects heat transfer). The investigation diamond closes here.

**→ IMPROVE phase (PDCA):**

With the suspected root cause identified, the analyst moves to IMPROVE:

**Plan — Ideate and select:** Brainstorm improvement ideas, each with an effort estimate and What-If projection:

- "Replace nozzle tip weekly" (effort: low, projected Cpk: 1.25)
- "Install automated nozzle wear sensor" (effort: high, projected Cpk: 1.40)
- "Tighten temperature controller PID loop" (effort: medium, projected Cpk: 1.15)

**Do — Execute:** Define and execute corrective actions:

- Replace nozzle tip on Machine 5
- Add nozzle inspection to weekly PM checklist
- Calibrate temperature controller after nozzle replacement

**Check — Verify:** Load new data, staged analysis shows Cpk improved from 0.85 to 1.35.

**Act — Standardize:** Target met → record outcome, resolve finding. The suspected root cause is now **confirmed** — the process improved to target.

## Terminology

VariScout uses deliberate terminology to maintain the distinction between theory and proof:

| Stage                | Term                        | Meaning                                               |
| -------------------- | --------------------------- | ----------------------------------------------------- |
| Created              | **Hypothesis**              | A testable theory about cause                         |
| Evidence supports it | **Supported Hypothesis**    | Data, gemba, or expert evidence supports this         |
| Tree converges on it | **Suspected Root Cause**    | Best-supported theory, confident enough to act        |
| Improvement works    | **Confirmed** (via outcome) | Process improved to target — the theory was effective |

VariScout never auto-labels anything as "root cause." The analyst explicitly promotes a supported hypothesis to **suspected root cause** when they are confident enough to act on it. Confirmation is outcome-based: it only happens when the process improves to target (outcome = effective at "Resolved" status), not when the investigation converges.

## Platform Availability

| Capability                    | PWA (Free)        | Azure Standard        | Azure Team            |
| ----------------------------- | ----------------- | --------------------- | --------------------- |
| Hypotheses per finding        | 1 (flat, no tree) | Up to 30 (tree)       | Up to 30 (tree)       |
| Validation types              | Data only (auto)  | Data + gemba + expert | Data + gemba + expert |
| Gemba/expert tasks            | -                 | Task + completion     | + task assignment     |
| Tree view                     | -                 | Yes                   | Yes                   |
| CoScout investigation sidebar | -                 | Yes (with AI)         | Yes (with AI)         |
| Teams posting on convergence  | -                 | -                     | Yes                   |

## Related Documentation

- [Investigation to Action](investigation-to-action.md) — Full investigation workflow (findings, actions, outcomes)
- [Drill-Down Workflow](drill-down-workflow.md) — ANOVA drill-down mechanics
- [Deep Dive](deep-dive.md) — 30-minute investigation pattern
- [AI Journey Integration](../../05-technical/architecture/ai-journey-integration.md) — CoScout and AI features
- [Findings Components](../../06-design-system/components/findings.md) — Design system specs
- [ADR-020: Investigation Workflow](../../07-decisions/adr-020-investigation-workflow.md) — Architectural decisions
