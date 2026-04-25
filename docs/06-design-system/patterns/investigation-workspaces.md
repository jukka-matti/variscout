---
title: Investigation Workspace Pattern
audience: [designer, developer]
category: reference
status: draft
related: [investigation-wall, question-driven-eda, accessibility, ai-independent-ux, signal-cards]
---

# Investigation Workspace Pattern

Canonical pattern for VariScout workspaces where analysts build process
understanding from clues, mechanism branches, signals, and next moves.

This pattern extends the chart/dashboard design system into canvas-like,
graph-like, and touch/mobile workspaces.

## Design Target

Investigation workspaces must support three renderings of the same graph:

| Context        | Rendering                                      | Purpose                                  |
| -------------- | ---------------------------------------------- | ---------------------------------------- |
| Desktop        | Spatial workspace / roots view                 | Synthesis, relationship reading, debate  |
| Tablet         | Touch-safe workspace with large cards          | Gemba and team review                    |
| Phone / narrow | Structured card list with relationship drawers | Review, comments, next moves, audit read |

The data model must not depend on the rendering. The graph is data; the view
adapts.

## Core Layout

Desktop baseline:

```text
┌────────────────────────────────────────────────────────────────┐
│ Current Understanding · Problem Condition · phase/context strip │
├─────────────────────────────────────────────┬──────────────────┤
│ Investigation workspace                     │ Side rail        │
│                                             │                  │
│ Problem condition                           │ Branch detail    │
│   ↑                                         │ Signal cards     │
│ Mechanism branches                          │ Comments         │
│   ↑                                         │ Next moves       │
│ Clues / checks / gates                      │ CoScout proposals│
├─────────────────────────────────────────────┴──────────────────┤
│ Structured twin toggle · filters · legend · export/report link  │
└────────────────────────────────────────────────────────────────┘
```

Phone/narrow baseline:

```text
Current Understanding
Problem Condition card
Branch cards
Clues grouped by branch
Open checks
Signal cards
Next moves
Comments
Report/audit trail
```

## User-Facing Objects

Expose the simple QDE 2.0 vocabulary:

- Problem condition
- Clue
- Suspected mechanism
- Mechanism Branch
- Next move
- Signal Card

Avoid making users manage internal object types as peers:

- Finding
- Question
- Hypothesis
- Gate
- Evidence node
- AI proposal

Those can exist internally, but the workspace should read like process
understanding, not a database editor.

## Mechanism Branch Card

A branch card answers six questions:

1. What mechanism might explain the problem?
2. Which clues support it?
3. Which clues weaken or contradict it?
4. Which signal trust/power warnings affect it?
5. What is missing?
6. What is the next move?

Required regions:

```text
Title / suspected mechanism
Status label
Scope chips
Supporting clues
Counter-clues or "not tested"
Signal/trust/power chips
Next move
Comments / ownership
```

Status labels must be textual:

| Label             | Meaning                                   |
| ----------------- | ----------------------------------------- |
| Proposed          | Stated, not yet supported by a clue       |
| Evidenced         | Has support, but may still be incomplete  |
| Challenged        | Has meaningful counter-evidence           |
| Needs check       | Missing an important next check           |
| Ready for action  | Evidence is sufficient to try improvement |
| Verified improved | Improvement was executed and checked      |

Do not use "confirmed root cause" before post-action verification.

## Clues

A clue can come from:

- brushed chart region
- high-variation boxplot category
- Pareto bar
- probability-plot kink
- Cp/Cpk process-moment drop
- Process Flow bottleneck
- Yamazumi waste segment
- gemba note or photo
- expert input
- CoScout proposal accepted by the user

Clue cards must show source, scope, and reproducibility:

```text
Source: I-Chart / Boxplot / Yamazumi / Gemba / Expert
Scope: factor, process node, time window, branch
Metric: deterministic statistic or user-entered observation
Action: open source, attach to branch, mark as counter-clue
```

## Gates

AND/OR/NOT gates can appear visually on desktop, but must also be represented
as text:

- `H1 AND H2`: both conditions must hold.
- `H1 OR H2`: either condition may explain the problem.
- `NOT H3`: H3 is absent when the problem appears, or H3 contradicts the
  branch.

Gate checks must state what was evaluated:

```text
Gate check: H1 AND H2 held for 38 of 42 problem events.
Inputs: Nozzle temperature high, lot viscosity low.
Method: deterministic filter over current dataset.
```

## Missing Evidence

The workspace should actively show missing checks:

- no data clue attached
- no gemba clue attached
- no counter-check attempted
- signal trust too weak for this scope
- statistical power too weak for this conclusion
- process node not mapped
- Yamazumi data missing for scoped bottleneck step

Missing evidence is a next-move generator, not an error state.

## AI-Independent Behavior

All primary actions must work without CoScout:

| Action                 | Without AI                                     | With CoScout                                        |
| ---------------------- | ---------------------------------------------- | --------------------------------------------------- |
| Create branch          | User creates/edit branch manually              | CoScout proposes branch, user accepts/edits/rejects |
| Attach clue            | User pins from chart or adds gemba/expert note | CoScout suggests likely branch for the clue         |
| Identify missing check | Deterministic rules show missing checks        | CoScout explains why the check matters              |
| Create next move       | User selects next move from deterministic list | CoScout drafts a recommended next move              |
| Summarize branch       | Template summary from branch fields            | CoScout drafts a narrative from the same fields     |

If AI is unavailable, the workspace should not look broken or incomplete.

## Accessibility Rules

Investigation workspaces are complex visualizations. They must provide:

- keyboard navigation across cards, nodes, links, and gates
- visible focus for every interactive element
- semantic names for relationships
- structured card/list rendering for all graph content
- non-color status labels
- table/list export path for report and audit
- reduced-motion behavior for canvas transitions
- touch targets of at least 44 by 44 CSS pixels on tablet/mobile

The structured rendering is required, not optional.

## Design System Fit

Use existing VariScout surfaces:

- semantic theme classes from foundations/colors
- panel/drawer rules from Panels and Drawers
- chip conventions from existing analysis/filter chips
- chart source and accessible summary patterns from chart docs
- CoScout proposal controls from AI Components

Do not import the dark detective-wall deck style wholesale. Preserve the
current product theme and accessibility guarantees.
