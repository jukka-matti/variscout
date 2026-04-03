---
title: Question-Driven Investigation Flow
audience: [analyst, engineer]
category: workflow
status: stable
related: [question-tree, investigation-phases, investigation-diamond, factor-intelligence]
---

# Question-Driven Investigation Flow

> How to use the question tree and validation UI. For the diamond lifecycle, see [Investigation Lifecycle Map](investigation-lifecycle-map.md). For the narrative walkthrough, see [Analysis Journey Map § INVESTIGATE](analysis-journey-map.md#phase-3-investigate). For the full EDA methodology, see [EDA Mental Model](../../01-vision/eda-mental-model.md).

Structured investigation using the question-driven diamond pattern — generate questions, answer them with evidence, converge on suspected causes.

## Overview

When you identify a key variation driver through drill-down analysis, the next question is _why_. The Question-Driven Investigation Flow provides a structured way to explore possible causes by generating questions from evidence (Factor Intelligence + context), answering them with data and real-world evidence, and converging on multiple suspected causes.

The investigation follows a **question-driven diamond pattern** — four phases of structured learning:

1. **Initial** — Upfront questions from the issue statement + Factor Intelligence generate evidence-ranked questions; these form the root nodes of the question tree
2. **Diverge** — The question tree grows — answered questions spawn follow-up questions at deeper levels
3. **Validate** — Answer each question — data (ANOVA auto-validate), Gemba (go inspect), expert input
4. **Converge** — The tree narrows — rule out answered-no branches, mark multiple suspected causes

The diamond closes at Converging. What follows — improvement ideation, corrective actions, implementation, and verification — belongs to the **IMPROVE** phase (PDCA). See [Analysis Journey Map § Phase 4: IMPROVE](analysis-journey-map.md#phase-4-improve).

This mirrors how experienced quality engineers think: cast a wide net of questions, then narrow down through evidence. VariScout structures this natural process so nothing is lost and the reasoning trail is documented.

## Data Validation vs Gemba/Expert Validation

Not every question can be answered with data alone. VariScout supports three validation types:

| Validation Type | When to Use                                    | How It Works                                         |
| --------------- | ---------------------------------------------- | ---------------------------------------------------- |
| **Data**        | The question links to a factor in your dataset | ANOVA eta-squared automatically answers the question |
| **Gemba**       | You need to physically inspect something       | Define a task, go look, record what you find         |
| **Expert**      | You need domain knowledge beyond the data      | Consult an expert, record their assessment           |

### Data Validation (Automatic)

Link a question to a factor column and value. VariScout runs ANOVA and automatically sets the question status based on eta-squared thresholds:

- **Answered yes** (>= 15% eta-squared) — the factor explains meaningful variation
- **Ruled out** (< 5% eta-squared) — the factor explains negligible variation
- **Partial** (5-15% eta-squared) — inconclusive, may warrant further investigation

This is the same auto-validation from the existing question/hypothesis feature, now extended to work within a tree structure. Questions with R²adj < 5% from Factor Intelligence are auto-answered as "ruled out" without analyst effort.

### Gemba Validation (Go and See)

For questions like "is the nozzle tip worn?" or "is the conveyor belt misaligned?", you cannot answer from data alone. Create a gemba task:

1. Write what to check ("Inspect nozzle tip wear on Machine 5")
2. Go to the shop floor and inspect
3. Mark the task as completed
4. Record what you found ("Nozzle tip worn 0.3mm beyond tolerance")
5. Set the question status manually (answered-yes/ruled-out/partial)

### Expert Validation (Domain Knowledge)

Similar to gemba, but for questions that require expertise rather than physical inspection. "Could resin batch variation cause this pattern?" — consult the materials engineer, record their assessment.

## Using the Question Tree

### In the Findings Panel

When a finding has questions with sub-questions, the Findings panel can display them in tree view mode. Toggle between List, Board, and Tree views using the view mode selector.

Tree view shows one finding at a time with its full question tree:

```
Questions                                 [+ Add]

● Does Machine 5 cause drift?              [data]
  ├── ● Is nozzle tip worn?               [gemba]  🎯 SUSPECTED
  │     Task: Check nozzle wear           [Done]
  │     "Worn 0.3mm beyond spec"
  ├── ● Does temperature drift?             [data]  CONTRIBUTING
  │     Factor: Temperature  eta=23%
  └── ✗ Does operator technique vary?       [data]
        Factor: Operator  eta=3%

Progress: 2/3 answered, 1 ruled out
```

- **Status dots** use the standard colors (amber = open, blue = partial, green = answered-yes, red = ruled-out)
- **Factor badges** show the linked factor name and eta-squared percentage
- **Validation type icons** distinguish data, gemba, and expert hypotheses
- **Ruled-out questions** are dimmed (50% opacity) with strikethrough text — visible but clearly eliminated (negative learnings)
- **Children summaries** show "N children (M answered)" when a node is collapsed

### Inline Sub-Question Creation

The **"+" button** on a question node no longer uses `window.prompt()`. Clicking "+" expands an inline form directly within the tree node:

- **Text input** — question text (required, 5-200 chars)
- **Factor dropdown** (optional) — link to a factor column for automatic data validation
- **Validation type radio buttons** — `data` / `gemba` / `expert` (defaults to `data` when a factor is selected, `gemba` otherwise)

Pressing Enter or clicking "Add" creates the sub-question and collapses the form. Pressing Escape cancels without saving. Validation errors are shown inline (e.g., "Text is required" or tree depth/width limit warnings).

**Note:** Factor Intelligence automatically generates initial questions ranked by R²adj evidence. The analyst can also add questions manually at any level of the tree.

### Creating SuspectedCause Hubs

When the investigation converges, the analyst creates a **SuspectedCause hub** — a named entity that connects multiple related questions and findings into one coherent causal story. A hub is not a tag on a single question; it is a grouping mechanism that collects the evidence threads that point toward the same underlying mechanism.

**Creating a hub:**

1. In the Converging phase, click "Create Suspected Cause" in the `InvestigationConclusion` bar
2. Give the hub a name that describes the mechanism (e.g., "Worn nozzle tip" or "Night shift technique drift")
3. Link the answered questions whose evidence supports this mechanism
4. Optionally mark questions as "contributing" within the hub

**Hub structure:**

Each `SuspectedCauseHub` groups evidence under a single named mechanism:

- **Hub name** — A short description of the suspected mechanism (not just the factor name)
- **Primary questions** — Answered questions with direct evidence for this mechanism
- **Contributing questions** — Questions whose evidence amplifies or enables this mechanism
- **Evidence summary** — η²/R²adj aggregated across linked questions

Multiple hubs are allowed per investigation. Real quality problems often have two or three independent mechanisms. Creating separate hubs for each keeps the stories distinct and ensures each receives its own improvement focus in the IMPROVE phase.

Ruled-out questions cannot be linked to a hub. They remain in the tree as negative learnings — visible but not part of any causal story.

**Visual badges on hub-linked question nodes:**

| Hub membership   | Badge                  |
| ---------------- | ---------------------- |
| Primary evidence | `SUSPECTED` (blue)     |
| Contributing     | `CONTRIBUTING` (slate) |
| _(not linked)_   | — (no badge)           |

Once any hub exists and the finding is at `analyzed` status or higher, the **FindingCard** (outside the tree view) renders a "Suspected causes" section listing all hubs ranked by total evidence (η²/R²adj), with contributing questions beneath each hub name. This surfaces the convergence conclusion without requiring the analyst to expand the full tree.

See also [investigation-workspace-reframing-design.md](../../superpowers/specs/2026-04-03-investigation-workspace-reframing-design.md) for the full SuspectedCause hub model and data type.

### In the Popout Window

The FindingsWindow popout adds two features for investigation:

**Issue Statement Header** — When you have set an issue statement (in Settings or column mapping), it appears as a compact header at the top of the popout window, keeping the investigation goal visible. As the investigation progresses, the emerging Problem Statement appears below it.

**CoScout Sidebar** — A collapsible sidebar on the right shows the current investigation phase, suggests uncovered factor categories, and provides a link to open CoScout with investigation context pre-loaded.

### Tree Constraints

To keep investigations focused and manageable:

| Constraint   | Limit | Why                                                                    |
| ------------ | ----- | ---------------------------------------------------------------------- |
| Max depth    | 3     | Root, child, grandchild. Deeper means you should decompose differently |
| Max children | 8     | Per parent. More than 8 sub-questions = too broad                      |
| Max total    | 30    | Per finding. Hard cap across the entire tree                           |

## Upfront Questions Thread

When the analyst enters with a hypothesis (hypothesis-driven entry path), the analysis brief captures it during FRAME as an upfront question. This becomes a root node in the question tree when investigation begins, alongside questions generated by Factor Intelligence.

For example: "I think Machine 5 has drifted" → captured as upfront question in FRAME → Factor Intelligence confirms in SCOUT (eta-squared shows Machine 5 at 47%) → becomes tree root in INVESTIGATE → spawn follow-up questions (is nozzle worn? does temperature drift? does operator technique vary?) → answer each → converge on suspected causes.

Factor Intelligence also generates its own questions ranked by R²adj evidence. These merge with upfront questions into a single ranked checklist, ensuring that both analyst intuition and statistical evidence drive the investigation.

## CoScout Investigation Prompts

When AI is configured, CoScout adapts its suggestions to the current investigation phase:

| Phase      | What CoScout Helps With                                           |
| ---------- | ----------------------------------------------------------------- |
| Initial    | Generates additional questions from issue statement + context     |
| Diverging  | Suggests follow-up questions, highlights uncovered factor roles   |
| Validating | Suggests how to answer open questions (data checks, gemba tasks)  |
| Converging | Helps evaluate which answered questions point to suspected causes |

> **Note:** CoScout also assists during IMPROVE — suggesting corrective actions, assisting with What-If parameter selection, and summarising before/after comparison — but this is part of the IMPROVE phase's PDCA cycle, not the investigation diamond.

CoScout also checks which factor categories (equipment, temporal, operator, material, location) have been covered by questions and nudges the analyst to consider uncovered categories. For example, if you have equipment and temporal questions but no material question, CoScout might suggest: "Have you considered whether raw material batch variation could explain the drift?"

## Mode-Specific Investigation

> See [ADR-054: Mode-Aware Question Strategy](../../07-decisions/adr-054-mode-aware-question-strategy.md) for the architectural decision.

The question-driven investigation adapts to the active analysis mode. Each mode has different question types, evidence metrics, and validation approaches:

### Question Examples by Mode

| Mode            | Example Questions                                                                             | Evidence Badge | Validation                 |
| --------------- | --------------------------------------------------------------------------------------------- | -------------- | -------------------------- |
| **Standard**    | "Does Shift explain variation?" / "Do Machine + Operator together explain more?"              | R²adj          | ANOVA η² ≥ 15%             |
| **Capability**  | "Which factor most affects Cpk?" / "Does Shift shift the process center from target?"         | Cpk impact     | ANOVA η² + spec comparison |
| **Yamazumi**    | "Which steps exceed takt?" / "Which waste type dominates?" / "Is waste increasing over time?" | Waste %        | Takt compliance            |
| **Performance** | "Which channel has worst Cpk?" / "Is the worst channel a centering or spread problem?"        | Channel Cpk    | ANOVA η² per channel       |

### Capability: Centering vs Spread Diagnostic

When specification limits are set, capability questions diagnose the root cause type:

- **Low Cpk + High Cp** → centering drift → "Which factor shifts the process mean from target?"
- **Low Cpk + Low Cp** → excess spread → "Which factor increases process variation?"
- **Subgroup drill-down** → "Why is Cpk lower in Shift=Night subgroups?"

### Yamazumi: Lean Investigation Workflow

Yamazumi mode replaces statistical decomposition with a lean waste elimination flow:

1. **Takt compliance scan** — "Which steps exceed takt time?" (prioritize by flow impact)
2. **Waste composition** — "Is the bottleneck value-adding work or waste?"
3. **Waste driver ranking** — "Which waste type dominates?" (Pareto of waste reasons)
4. **Temporal stability** — "Is waste increasing over time?" (I-Chart of waste metric)
5. **Kaizen targeting** — "Where should kaizen focus first?" (highest waste × takt gap)

R²adj does not apply to Yamazumi data. Evidence is expressed as waste contribution percentage.

### CoScout Alignment

The deterministic question pipeline produces questions matching CoScout's mode-specific coaching (`coScout.ts`). In Yamazumi mode, CoScout uses lean terminology (VA ratio, takt, waste types) and the 5-step workflow above. In Capability mode, CoScout references Cpk/Cp and centering-vs-spread diagnostics. The two layers tell the same story.

## Example: Machine 5 Packaging Line

### Scenario

Fill weight variation on a packaging line exceeds the +/-2g specification. I-Chart shows a drift pattern starting two weeks ago. ANOVA drill-down identifies Machine 5 as the top contributor (47% eta-squared).

### Investigation

**1. Root question:** "Does Machine 5 have a mechanical issue causing fill weight drift?"

**2. Diverge — generate sub-questions:**

- "Is the nozzle tip worn?" (gemba — needs physical inspection)
- "Does the temperature controller drift?" (data — temperature factor in dataset)
- "Does operator technique vary?" (data — operator factor in dataset)
- "Is there vibration from the adjacent line?" (expert — ask maintenance engineer)

**3. Answer each:**

- **Nozzle tip worn?** [gemba]: Go to Machine 5, inspect nozzle. Result: "Tip worn 0.3mm beyond tolerance." Status: **Answered yes**.
- **Temperature drift?** [data]: Link to Temperature factor. eta-squared = 23%. Status: **Answered yes**.
- **Operator variance?** [data]: Link to Operator factor. eta-squared = 3%. Status: **Ruled out**.
- **Vibration?** [expert]: Ask maintenance. Result: "Adjacent line was offline during the drift period, no vibration." Status: **Ruled out**.

**4. Converge:**

Two questions answered yes (worn nozzle + temperature drift), two ruled out. Both are marked as suspected causes — the worn nozzle directly explains the mechanical drift, and the temperature instability is an independent contributor (worn nozzle also affects heat transfer). The investigation diamond closes here.

**→ IMPROVE phase (PDCA):**

With the suspected root cause identified, the analyst moves to IMPROVE:

**Plan — Ideate and select:** Brainstorm improvement ideas, each with a timeframe estimate and What-If projection:

- "Replace nozzle tip weekly" (timeframe: just-do, projected Cpk: 1.25)
- "Install automated nozzle wear sensor" (timeframe: months, projected Cpk: 1.40)
- "Tighten temperature controller PID loop" (timeframe: weeks, projected Cpk: 1.15)

**Do — Execute:** Define and execute corrective actions:

- Replace nozzle tip on Machine 5
- Add nozzle inspection to weekly PM checklist
- Calibrate temperature controller after nozzle replacement

**Check — Verify:** Load new data, staged analysis shows Cpk improved from 0.85 to 1.35.

**Act — Standardize:** Target met → record outcome, resolve finding. The suspected root cause is now **confirmed** — the process improved to target.

## Terminology

VariScout uses deliberate terminology to maintain the distinction between question and proof:

| Stage                | Term                        | Meaning                                                         |
| -------------------- | --------------------------- | --------------------------------------------------------------- |
| Generated            | **Question** (open)         | A question about a potential cause, ranked by evidence          |
| Evidence answers yes | **Answered question**       | Data, gemba, or expert evidence confirms the factor matters     |
| Evidence answers no  | **Ruled out**               | Factor checked and found not relevant (negative learning)       |
| Tree converges       | **Suspected cause**         | Answered question promoted to suspected cause, confident to act |
| Improvement works    | **Confirmed** (via outcome) | Process improved to target — the suspected cause was correct    |

VariScout never auto-labels anything as "root cause." The analyst explicitly marks an answered question as a **suspected cause** when they are confident enough to act on it. Multiple suspected causes are allowed — real processes often have multiple independent sources of variation. Confirmation is outcome-based: it only happens when the process improves to target (outcome = effective at "Resolved" status), not when the investigation converges.

**Semantic mapping from previous terminology:** The underlying data model uses the Hypothesis type. The semantic mapping is: hypothesis text = question text; supported = answered-yes; contradicted = ruled-out; untested = open. The old `causeRole 'primary'` field is superseded by `SuspectedCauseHub` entities (Apr 2026) — see the SuspectedCause hub section above.

## Platform Availability

| Capability                    | PWA (Free)        | Azure Standard        | Azure Team            |
| ----------------------------- | ----------------- | --------------------- | --------------------- |
| Questions per finding         | 1 (flat, no tree) | Up to 30 (tree)       | Up to 30 (tree)       |
| Validation types              | Data only (auto)  | Data + gemba + expert | Data + gemba + expert |
| Gemba/expert tasks            | -                 | Task + completion     | + task assignment     |
| Tree view                     | -                 | Yes                   | Yes                   |
| CoScout investigation sidebar | -                 | Yes (with AI)         | Yes (with AI)         |
| Teams posting on convergence  | -                 | -                     | Yes                   |

## PI Panel Integration (ADR-056)

The Questions tab in the Process Intelligence panel (left sidebar) provides a persistent, cross-workspace view of the investigation state:

- **All questions visible** across Analysis, Investigation, Improvement, and Report workspaces
- **Context-reactive**: drilling into a factor highlights the corresponding question
- **Auto-linking**: findings created while investigating a question auto-link to it
- **Observations inbox**: unlinked gemba/expert findings can be linked to questions later
- **Conclusion card**: suspected causes with Cpk projections appear when converging

The Journal tab records the chronological investigation timeline — every question generated, status change, finding, and comment — providing an audit trail that feeds into reports.

### Visual Grounding

When CoScout references a question via `[REF:hypothesis:ID]text[/REF]`, clicking the link:

1. Opens the PI panel if closed
2. Switches to the Questions tab
3. Highlights and auto-expands the referenced question

## Problem Statement Formulation

The Problem Statement forms **progressively** — it is not a single event at investigation end. Watson's 3 questions are answered at different points in the journey:

### Watson's 3 Questions and When They Are Answered

| Question                          | Answered When                                                | Source                                                  |
| --------------------------------- | ------------------------------------------------------------ | ------------------------------------------------------- |
| **What measure needs to change?** | FRAME — when the measure column is mapped                    | `columnMapping.measureColumn`                           |
| **How should it change?**         | FRAME/SCOUT — when characteristic type and direction are set | `processContext.characteristicType` + `targetDirection` |
| **What is the scope?**            | SCOUT Loop 1 — when the first SuspectedCause hub is created  | First `SuspectedCauseHub` during Converging             |

Q1 and Q2 are answered as soon as the analyst maps data and sets specification context. Q3 is answered when the first suspected cause hub is created. The Problem Statement is a **live view** assembled from these three answers — it is always visible in the PI panel conclusion card and updates as hubs are created or edited.

### Live Problem Statement

The system assembles the draft automatically:

"Reduce variation in [measure] (Cpk [current] → target [targetValue]) driven by [hub 1 name] and [hub 2 name]."

The analyst can edit the assembled text at any time. Edits are saved to `processContext.problemStatement`. There is no "Generate" button — the statement is always present, updating as evidence accumulates.

- Appears in the PI panel Questions tab conclusion card from the moment Q1+Q2 are answered
- Scope section updates each time a new SuspectedCause hub is created
- Appears in the Report workspace without requiring any explicit export step

## Related Documentation

- [EDA Mental Model](../../01-vision/eda-mental-model.md) — Full question-driven methodology grounded in Turtiainen (2019)
- [Investigation to Action](investigation-to-action.md) — Full investigation workflow (findings, actions, outcomes)
- [Drill-Down Workflow](drill-down-workflow.md) — ANOVA drill-down mechanics
- [Deep Dive](deep-dive.md) — 30-minute investigation pattern
- [AI Journey Integration](../../05-technical/architecture/ai-journey-integration.md) — CoScout and AI features
- [Findings Components](../../06-design-system/components/findings.md) — Design system specs
- [ADR-020: Investigation Workflow](../../07-decisions/adr-020-investigation-workflow.md) — Architectural decisions
- [PI Panel Redesign](../../superpowers/specs/2026-04-01-process-intelligence-panel-redesign.md) — Stats/Questions/Journal tab design (ADR-056)

## Related: ADR-060 (CoScout Intelligence Architecture)

ADR-060 completes the mode-aware question generation pipeline:

- Yamazumi mode: lean-specific questions (takt compliance, waste composition)
- Performance mode: channel ranking questions (worst Cpk first)
- Evidence sorting uses mode-appropriate metrics
- CoScout can propose answering questions via the `answer_question` action tool
