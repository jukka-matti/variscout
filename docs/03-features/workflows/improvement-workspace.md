---
title: Improvement Workspace
audience: [analyst, engineer]
category: workflow
status: stable
related: [improvement, pdca, prioritization, what-if, actions, verification]
---

# Improvement Workspace

The Improvement workspace is the IMPROVE phase of the analyst's journey (FRAME → SCOUT → INVESTIGATE → **IMPROVE**). It is Azure-only and covers the full PDCA cycle: Plan (ideate, prioritize, project), Do (actions), Check (verification), and Act (outcome assessment).

See [Investigation to Action](investigation-to-action.md) for how findings and suspected causes flow into this workspace, and [Improvement Prioritization](improvement-prioritization.md) for the evaluation dimensions (timeframe, cost, risk, benefit) and matrix preset details.

## Overview

After the investigation diamond converges on suspected causes, the Improvement workspace takes over. The analyst brainstorms ideas per cause, projects their impact with the What-If Simulator, selects the best combination, converts them to actions, then tracks execution and verifies the result.

The workspace evolves progressively — no mode toggles. It starts in **Plan view** for ideation and prioritization, and transitions to **Track view** after ideas are converted to actions.

## Layout

```
┌─── Context Panel ────┐ ┌──────────── Hub ─────────────┐ ┌── CoScout ──┐
│ Problem Statement     │ │  Prioritization Matrix (top) │ │ coaching    │
│ Target Cpk            │ │  Scrollable idea cards (btm) │ │ adapts to   │
│ Suspected Causes      │ │  ════ Summary Bar ══════════  │ │ Plan/Track  │
│ Synthesis             │ │                              │ │             │
└───────────────────────┘ └──────────────────────────────┘ └─────────────┘
```

Three panels:

- **Left (300px)** — Improvement Context Panel by default; transitions to What-If Simulator when the analyst clicks the project button on an idea
- **Center** — Hub with pinned Prioritization Matrix at top (~40% height) and scrollable `IdeaGroupCard` list below (~60%); resizable divider
- **Right (280px)** — `CoScoutPanelBase` with mode-aware coaching (lean methodology prompts for Plan view, tracking prompts for Track view)

The PI Panel is hidden in the Improvement workspace — its investigation content (question tree, ANOVA stats) is already embedded in idea card headers via evidence badges.

## Context Panel

The left panel shows the improvement context while the analyst is not projecting an idea:

- **Problem Statement** — `processContext.problemStatement` (Watson's 3-question synthesis from the Investigation phase)
- **Improvement Target** — `processContext.targetValue` alongside the current Cpk from the stats pipeline
- **Suspected Causes** — Questions with `status: 'answered' | 'investigating'` and `causeRole: 'suspected-cause' | 'contributing'`, each showing its R²adj or η² evidence
- **Synthesis** — `processContext.synthesis` (editable narrative, max 500 chars). Pre-filled from the problem statement text on first open if synthesis is empty.

## Brainstorm Modal

The brainstorm modal opens per cause from the "💡 Brainstorm" button in the IdeaGroupCard header. It also auto-opens on first workspace entry if a cause has no ideas.

### Three-Beat Flow

1. **Brainstorm** — 2×2 grid of HMW prompts (desktop) or swipeable tabs (mobile). Ideas are text only — no evaluation metadata. CoScout acts as a creative partner with data-driven sparks, direction nudges, and KB analogies.
2. **Select** — Dot-vote on which ideas to pursue. Anonymous vote counts in collaborative mode. No voter names.
3. **Evaluate** — Selected ideas flow to IdeaGroupCard with direction pre-set. Unselected ideas are "parked" (dimmed, promotable later).

See [HMW Brainstorm Modal Design](../../superpowers/specs/2026-04-03-hmw-brainstorm-modal-design.md) for the full spec.

### Collaborative Sessions (Team Plan)

Team plan users can invite colleagues to brainstorm together in real-time. Ideas appear on all screens via SSE. Team members with the same project open auto-detect active sessions via toast notification.

See [ADR-061](../../07-decisions/adr-061-hmw-brainstorm-ideation.md) for architectural decisions.

## Plan View

The default view after entering the Improvement workspace.

### Prioritization Matrix

`PrioritizationMatrix` is placed at the top of the hub. It visualizes all ideas as a scatter plot on configurable axes. See [Improvement Prioritization](improvement-prioritization.md) for axis presets (Bang for Buck, Quick Impact, Risk-Reward, Budget View) and quadrant logic.

**Cause color-coding:** Each suspected cause is assigned a consistent color from `operatorColors` (in `@variscout/charts`). Colors appear on matrix dots, idea card left borders, and the matrix legend — so the analyst can see at a glance which cause each idea addresses.

**Ghost dots:** Ideas without a What-If projection appear as dashed-outline circles at categorical fallback positions. A nudge below the legend counts how many ideas have no projection and invites the analyst to simulate their impact.

**Bidirectional navigation:** Clicking a matrix dot scrolls the corresponding idea card into view and highlights it. Hovering an idea card highlights its dot in the matrix.

**Live projection feedback:** When the What-If panel is open for an idea, that idea's dot pulses with a blue glow and repositions in real-time as the analyst adjusts sliders. This shows immediately whether the projected improvement lands in the Quick Wins quadrant.

### Idea Cards

`IdeaGroupCard` instances are stacked below the matrix, one per suspected cause. Each card header shows:

- Cause color bar on the left
- Cause name and evidence badge (R²adj % or η² from `question.evidence`)
- Cause role label ("suspected cause" or "contributing")

Each idea row within the card contains: selection checkbox, idea text, direction badge (Prevent/Detect/Simplify/Eliminate), timeframe dropdown, cost dropdown, risk assessment, projected Cpk badge (when a What-If projection is saved), action buttons for "Project" and CoScout, and a "→ Action" badge when the idea has been converted.

### What-If Integration

Clicking the project button on an idea transitions the left panel from the Context Panel to the What-If Simulator.

**Context header:** The simulator displays the problem subset (the factor level being addressed, e.g., "Head 5-8, n=124, Cpk 0.62") alongside a reference subset (e.g., "Head 1-4, n=376, Cpk 1.42"). This makes projections concrete — "Match Head 1-4" is a real target, not an abstract slider.

**Contextual preset labels:** Abstract preset labels are replaced with references to actual category names:

- "Match best" → "Match Head 1-4 mean"
- "Tighten spread" → "Match Head 1-4 spread"
- "Shift to target" → "Center on spec target"
- "Best of both" → "Match Head 1-4 fully"

**Save and return:** Clicking "Save projection to idea" writes the result (`projectedCpk`, projected mean, σ, yield) back to the idea record. The matrix dot settles at the continuous Y position corresponding to the projected Cpk. The left panel returns to the Context Panel.

The round-trip is: idea → left panel shows What-If with context → adjust sliders → dot moves live on matrix → save → projection badge on idea card. No manual copying.

## Track View

After the analyst selects ideas and clicks "Convert → Actions":

1. Each selected idea creates an `ActionItem` with an `ideaId` FK for traceability
2. Findings auto-transition: `analyzed → improving`
3. The hub switches to Track view

A "Back to Plan & Prioritize" link returns to Plan view without losing state. Idea selection and "→ Action" badges remain visible in Plan view after conversion.

### Plan Recap

Compact badges at the top of Track view showing which ideas were selected — cause color dot, idea text, projected Cpk. "Edit selection" returns to Plan view.

### Actions Section

Cross-finding action tracker aggregated from all findings with actions:

- Completion checkboxes (toggle `completedAt`)
- Assignee badge (text input on click)
- Due date (date picker on click)
- Overdue alert banner when any action has passed its `dueDate`
- Cause color dot and projected Cpk badge per action row
- Sort order: overdue first → pending by dueDate → completed by completedAt
- "+ Add action" button to attach additional actions to a finding

Overdue display is visual only — no notifications are sent.

### Verification Section

Empty state: "No verification data yet. Complete your actions, then upload new data." with an Add verification data button.

**Smart detection:** When new data is uploaded while any finding has `status: 'improving'`, VariScout prompts: "Is this verification data?" Confirming tags the data as staged and populates the verification KPI grid.

After verification data is added, the section shows:

| KPI        | Content                               |
| ---------- | ------------------------------------- |
| Cpk        | Before → after with color-coded delta |
| Pass rate  | Before → after %                      |
| Mean shift | Absolute and % change                 |
| σ ratio    | Spread change                         |

A "View staged charts in Analysis" link opens the Analysis workspace with staged comparison charts (I-Chart with stage boundaries, side-by-side Boxplot, Capability Histogram overlay). See [Staged Analysis](../analysis/staged-analysis.md) for the full staged comparison workflow.

### Outcome Section

Dimmed until verification data exists (progressive disclosure prevents premature assessment).

Three options:

| Outcome       | Badge | Effect                                                       |
| ------------- | ----- | ------------------------------------------------------------ |
| Effective     | Green | Finding → `resolved` (auto-transition when all actions done) |
| Partial       | Amber | Finding stays `improving`; start a new PDCA cycle            |
| Not effective | Red   | Finding stays `improving`; re-investigate                    |

A notes field saves to finding comments. The notes and outcome are stored in `FindingOutcome`.

When the outcome is Effective and all actions are completed, the finding automatically transitions to `resolved`. Resolved findings with `cpkAfter` and an idea-linked projection display a learning loop entry:

```
Projected 1.35 → Actual 1.42 (+0.07)
```

Green when actual meets or exceeds projection; red when it falls short. This builds estimation confidence over time and feeds the Knowledge Base on Azure Team.

## Summary Bar

`ImprovementSummaryBar` is sticky at the bottom of the hub. It evolves through four modes:

**Plan — no actions yet:**

```
3 ideas selected · just do: 2 · wks: 1 · €2,400       Projected 1.35  [Convert → Actions]
```

**Plan — some ideas converted:**

```
3 ideas · 3 actions (2/4 done · ⚠ 1 overdue)          Projected 1.35  [Actions ↑] [Convert]
```

**Track — actions in progress:**

```
2/4 actions done · ⚠ 1 overdue · Cpk 0.62 → target 1.33              [+ Add verification]
```

**Track — verification complete:**

```
4/4 done · Cpk 0.62 → 1.28 (+107%) · Yield 72% → 96%               [Assess outcome]
```

## Mobile

On screens narrower than 640px:

- Side panels (Context, CoScout) are hidden; hub is full-width
- A collapsible context header at the top shows problem statement, target, and cause summary
- The scatter plot matrix is replaced by horizontally swipeable summary cards, one per cause:
  ```
  ◀  Shift (Night)  R²adj 34%  ▶
  3 ideas · 2 quick wins
  Avg projected Cpk: 1.27
  [View ideas]
  ```
  Each card shows cause name, evidence %, idea count, quick win count, and average projected Cpk. "View ideas" scrolls to that cause's `IdeaGroupCard`.
- The What-If Simulator opens as a full-screen bottom sheet instead of the left panel
- Track view stacks vertically without modification; idea cards are full-width with pills wrapping to a second line if needed

## Data Model References

Key types in `@variscout/core/types`:

| Type                | Purpose                                                        |
| ------------------- | -------------------------------------------------------------- |
| `ImprovementIdea`   | Idea with timeframe, cost, risk, direction, projection, ideaId |
| `ActionItem`        | Action with text, assignee, dueDate, completedAt, ideaId FK    |
| `FindingProjection` | Projected mean, σ, Cpk, yield from What-If save                |
| `FindingOutcome`    | effective/partial/not-effective, cpkBefore, cpkAfter, notes    |
| `ProcessContext`    | problemStatement, targetValue, synthesis                       |

## Platform Availability

The Improvement workspace is Azure-only (Standard and Team plans). The PWA includes finding statuses `observed`, `investigating`, and `analyzed` only — the `improving` and `resolved` statuses, action items, What-If integration, verification, and outcome assessment require the Azure app. See [feature-parity.md](../../08-products/feature-parity.md) for the full comparison.

## Related

- [Investigation to Action](investigation-to-action.md) — Finding status lifecycle, ideation methodology, action items
- [Improvement Prioritization](improvement-prioritization.md) — Evaluation dimensions, matrix presets, budget fitting
- [Question-Driven Investigation](question-driven-investigation.md) — How suspected causes are identified before entering this workspace
- [Staged Analysis](../analysis/staged-analysis.md) — Verification with before/after data
- [ADR-035](../../07-decisions/adr-035-improvement-prioritization.md) — Prioritization decision record
- [Improvement Hub Design](../../superpowers/specs/2026-04-02-improvement-hub-design.md) — Full design spec
