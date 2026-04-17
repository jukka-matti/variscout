---
title: Improvement Hub Redesign
audience: [developer, analyst]
category: architecture
status: delivered
related: [improvement, prioritization, what-if, pdca, actions, verification, matrix, risk]
---

# Improvement Hub Redesign

## Context

The Improvement workspace has strong building blocks — idea cards, prioritization matrix, risk assessment, What-If simulator, action conversion — but they don't cohere into a unified experience. The PrioritizationMatrix component exists but isn't placed in the workspace layout. What-If opens in the PI Panel (left side), pulling the analyst out of improvement context. The PI Panel shows investigation data that's already embedded in idea card headers. And the PDCA tracking sections (Actions, Verification, Outcome) don't exist yet.

The analyst's workflow in the Improvement phase crosses four cognitive modes — divergent (brainstorm ideas per cause), evaluative (assess risk/cost/benefit), convergent (select and convert), and tracking (monitor actions, verify results). The current vertical scroll doesn't serve these modes well.

This design rethinks the Improvement workspace as a cohesive hub where ideation, prioritization, projection, and tracking form a connected workflow. It supersedes the `2026-04-02-improvement-workspace-pdca-design.md` spec (which focused narrowly on PDCA sections) and incorporates its content.

## Decision

### 1. Split Layout: Matrix Top + Cards Bottom

The hub uses a horizontal split layout (Approach B from brainstorming):

```
┌─── Context Panel ───┐ ┌──────────── Hub ────────────┐ ┌── CoScout ──┐
│ Problem Statement    │ │ [Prioritization Matrix]      │ │ AI coaching │
│ Target Cpk: 1.33     │ │  ● ●  ★Quick   presets:     │ │ (adapts to  │
│ ── Causes ──         │ │   ●● wins  [BfB][QI][RR][B]  │ │  workspace  │
│ Shift 34% 3 ideas    │ │  ● ●                         │ │  phase)     │
│ Nozzle 22% 2 ideas   │ │ ─── resize handle ─────────  │ │             │
│ Material 8% 2 ideas  │ │ ▼ scrollable cards ▼         │ │             │
│ ── Synthesis ──      │ │ IdeaGroupCard (Shift)        │ │             │
│ Night shift setup... │ │ IdeaGroupCard (Nozzle)       │ │             │
│                      │ │ IdeaGroupCard (Material)     │ │             │
│                      │ │ ═══ Summary Bar ════════     │ │             │
└──────────────────────┘ └─────────────────────────────┘ └─────────────┘
```

- **Left panel (300px)**: Context panel or What-If Simulator (see section 3)
- **Center**: Prioritization Matrix pinned at top (~40%), scrollable idea cards below (~60%), resizable divider
- **Right panel (280px)**: CoScout with mode-aware coaching
- **Summary bar**: Sticky bottom, evolves with progress (see section 6)

### 2. Prioritization Matrix Integration

The existing `PrioritizationMatrix` component is placed in the top zone of the hub. Changes:

**Cause color-coding:** Each suspected cause gets a consistent color (amber, blue, green, etc.) used across matrix dots, idea card left borders, PI Panel question items, and legend. Colors assigned from the existing `operatorColors` palette in `@variscout/charts`.

**Ghost dots for unprojected ideas:** Ideas without a What-If projection appear as dashed-outline circles at categorical fallback positions (low/medium/high). A nudge message below the legend: _"N ideas have no projection — click 🧪 to simulate their impact"_. Clicking a ghost dot opens the What-If panel for that idea.

**Bidirectional navigation:** Click a matrix dot → the corresponding idea card scrolls into view and highlights. Click/hover an idea card → the corresponding dot highlights in the matrix.

**Pulsing projection dot:** When projecting an idea via What-If, the corresponding matrix dot pulses with a blue glow and moves in real-time as sliders adjust. This provides instant visual feedback of where the idea lands relative to Quick Wins.

**Implementation:** Add `ghostDots` rendering path in `PrioritizationMatrix` for ideas where `projection` is undefined and `impactOverride` is undefined. Use `operatorColors` indexed by question ID for cause coloring. Add `highlightedIdeaId` prop for bidirectional hover.

### 3. Left Panel: Context Panel ↔ What-If Simulator

The PI Panel is hidden in the Improvement workspace — its investigation content (questions, evidence, stats) is already embedded in idea card headers. The left panel instead serves two roles:

**Default state — Improvement Context Panel:**

```
┌─ Improvement Context ─────────────┐
│ PROBLEM STATEMENT                  │
│ Fill weight variation on the       │
│ sachet line causing 28% OOS...     │
│                                    │
│ IMPROVEMENT TARGET                 │
│ ┌──────────────────────────────┐  │
│ │ Target Cpk    Current        │  │
│ │   1.33         0.62          │  │
│ └──────────────────────────────┘  │
│                                    │
│ SUSPECTED CAUSES                   │
│ ▌ Shift (Night)  R²adj 34%       │
│ ▌ Nozzle (5-8)   R²adj 22%       │
│ ▌ Material Batch  η² 8%          │
│                                    │
│ SYNTHESIS                          │
│ Night shift setup inconsistency    │
│ and nozzle wear on heads 5-8...   │
└────────────────────────────────────┘
```

Data sources:

- Problem statement: `processContext.problemStatement`
- Target: `processContext.targetValue` (existing)
- Current Cpk: from stats pipeline
- Causes: **SuspectedCause hub entities** from the investigation store (each hub has a name, synthesis summary, evidence strength, and connected questions/findings). Previously modeled as `causeRole`-tagged questions; now each hub is the primary unit. See the investigation reframing spec.
- Synthesis: `processContext.synthesis`

**Projecting state — What-If Simulator:**

When the analyst clicks 🧪 Project on an idea, the left panel transitions to the What-If Simulator with enhanced context:

```
┌─ What-If Simulator ───────────────┐
│ 🧪 What-If Simulator              │
│                                    │
│ PROJECTING IDEA:                   │
│ Replace nozzles on heads 5-8      │
│ for Nozzle (Head 5-8) — R²adj 22%│
│                                    │
│ CONTEXT:                           │
│ Problem: Head 5-8 (n=124, Cpk 0.62)
│ Reference: Head 1-4 (n=376, Cpk 1.42)
│                                    │
│ [Match Head 1-4 mean] [Center on  │
│  spec target] [Match Head 1-4     │
│  spread] [Match Head 1-4 fully]   │
│                                    │
│ Mean Shift        ────●──── +0.42 │
│ Variation Reduction ──●──── -18%  │
│                                    │
│ ┌─ Distribution ──────────────┐   │
│ │ ╱╲  current   ╱╲ projected  │   │
│ │╱  ╲          ╱  ╲          │   │
│ └──────────────────────────────┘  │
│                                    │
│ Mean:  12.38 → 12.80  +0.42      │
│ σ:     0.84  → 0.69   -18%       │
│ Cpk:   0.62  → 1.32   +113%     │
│ Yield: 72%   → 98.2%  +26.2%    │
│                                    │
│ [💾 Save projection to idea]      │
└────────────────────────────────────┘
```

**Context header:** Shows the problem subset vs reference subset with stats. This makes it clear what "Match best" means — it's not abstract, it's "make heads 5-8 perform like heads 1-4".

**Contextual preset labels:** Replace abstract labels with concrete references:

- "Match best" → "Match Head 1-4 mean" (12.80)
- "Tighten spread" → "Match Head 1-4 spread" (σ 0.52)
- "Shift to target" → "Center on spec target" (13.00)
- "Best of both" → "Match Head 1-4 fully" (mean + spread)

**Implementation:** The `WhatIfPageBase` already accepts `activeFactor` and `projectionContext`. Add a new `referenceContext` prop with subset/complement stats and names. Modify preset labels to use reference names instead of generic terms. The `computePresets()` function already has the data — it just needs to be surfaced in the label, not just the description tooltip.

**Live matrix feedback:** While the What-If panel is open, the matrix dot for the projected idea pulses and repositions as the analyst adjusts sliders. This requires the parent to pass `simParams` changes up to the matrix, which recomputes the dot's Y position from the in-progress `projectedCpk`.

### 4. Evidence % in Idea Group Headers

Each `IdeaGroupCard` header gains an evidence strength badge:

Before: `Shift (Night) → Suspected cause`
After: `▌ Shift (Night)  R²adj 34%  suspected cause`

The badge shows `R²adj` or `η²` from the SuspectedCause hub's aggregate evidence (combined across connected questions). The cause color bar on the left matches the matrix legend color. Each `IdeaGroupCard` corresponds to one SuspectedCause hub — one hub = one idea group = one HMW brainstorm session. The hub provides full evidence context (connected questions, supporting findings, gemba notes) to seed the brainstorm session.

**Implementation:** `IdeaGroupCard` already receives the question object. Extract `question.evidence?.rSquaredAdj` or `question.evidence?.etaSquared`. Render as a small muted badge next to the factor name.

### 5. Progressive Workspace Evolution (Plan → Track)

The workspace evolves as the analyst progresses through PDCA — no tabs, no mode toggles.

**Plan View (default):**
Matrix + idea cards + What-If integration. This is where brainstorming, projecting, and prioritization happen. The summary bar shows: `3 ideas selected · just do: 2 · wks: 1 · €2,400 · Projected 1.35 [Convert → Actions]`

**Track View (after conversion):**
Clicking "Convert → Actions" creates action items and transitions the hub to the Track view:

```
┌─ Context Panel ─┐ ┌──────── Track View ─────────┐ ┌─ CoScout ─┐
│ Problem          │ │ [← Back to Plan & Prioritize]│ │ Tracking  │
│ Target: 1.33     │ │                              │ │ mode      │
│ Causes           │ │ SELECTED IMPROVEMENTS        │ │           │
│ Synthesis        │ │ ● SOP  ● Checklist  ● Nozzle│ │           │
│                  │ │                              │ │           │
│                  │ │ ACTIONS          2/4 done    │ │           │
│                  │ │ ⚠ 1 overdue                  │ │           │
│                  │ │ ☑ Standardize SOP  Done 3/28 │ │           │
│                  │ │ ☑ Add checklist    Done 4/1  │ │           │
│                  │ │ ☐ Replace nozzles  OVERDUE   │ │           │
│                  │ │ ☐ Calibrate sensors Apr 15   │ │           │
│                  │ │                              │ │           │
│                  │ │ VERIFICATION                 │ │           │
│                  │ │ [+ Add verification data]    │ │           │
│                  │ │                              │ │           │
│                  │ │ OUTCOME (dimmed)             │ │           │
│                  │ │ Available after verification │ │           │
│                  │ │ ═══ Summary Bar ═══════════  │ │           │
└──────────────────┘ └──────────────────────────────┘ └───────────┘
```

The summary bar evolves: `2/4 actions done · ⚠ 1 overdue · Cpk 0.62 → target 1.33 [+ Add verification data]`

**"← Back to Plan & Prioritize"** returns to the Plan view. No state is lost — actions persist, and the Plan view still shows idea selection with "→ Action" badges.

**Track View contents:**

**Selected Improvements recap:** Compact badges showing what was selected (cause dot + idea text + projected Cpk). "Edit selection →" link returns to Plan view.

**Actions section:** Cross-finding action tracker (from PDCA spec):

- Aggregated from all findings with actions
- Completion checkboxes (toggle `completedAt`)
- Assignee badge (clickable to assign: text input)
- Due date (clickable to set: date picker)
- Overdue alert banner when any action past `dueDate`
- Cause color dot + projected Cpk badge per action
- "+ Add action" opens dialog to attach action to a finding
- Sort: overdue first → pending by dueDate → completed by completedAt

**Verification section** (from PDCA spec):

- Empty state: "No verification data yet. Complete your actions, then upload new data." + [Add verification data] button
- After verification: KPI grid showing Cpk before→after, pass rate, mean shift, σ ratio
- "View staged charts in Analysis →" link
- Smart detection: when data uploads while findings are `improving`, prompt "Is this verification data?"

**Outcome section** (from PDCA spec):

- Dimmed until verification data exists
- Three options: Effective (green → resolved), Partial (amber → stays improving), Not effective (red → stays improving)
- Notes field saved to finding comments
- Progressive disclosure prevents premature assessment

### 6. Summary Bar Evolution

The summary bar is always visible and reflects the current state:

**Plan mode (no actions):**

```
│ 3 ideas selected · just do: 2 · wks: 1 · €2,400       Projected 1.35  [Convert → Actions] │
```

**Plan mode (some converted):**

```
│ 3 ideas · 3 actions (2/4 done · ⚠ 1 overdue)          Projected 1.35  [Actions ↑] [Convert] │
```

**Track mode:**

```
│ 2/4 actions done · ⚠ 1 overdue · Cpk 0.62 → target 1.33              [+ Add verification] │
```

**Track mode (with verification):**

```
│ 4/4 done · Cpk 0.62 → 1.28 (+107%) · Yield 72% → 96%               [Assess outcome] │
```

### 7. Synthesis Pre-Fill from Problem Statement

When the analyst first opens the Improvement workspace, if `processContext.synthesis` is empty but `processContext.problemStatement` exists, pre-fill the synthesis with the problem statement text.

**Implementation:** One-line check in the improvement orchestration hook.

### 8. Mobile Layout (<640px)

The three-panel layout collapses for mobile:

**No side panels:** Context panel and CoScout are hidden. Hub is full-width.

**Collapsible context header:** Problem statement + target + cause summary collapse into a compact header at the top. Tap to expand/collapse.

**Swipeable summary cards replace matrix:** The scatter plot is replaced by horizontally swipeable cards per cause:

```
┌──────────────────────────────┐
│ ◀  Shift (Night)  R²adj 34% ▶│
│ 3 ideas · 2 quick wins        │
│ Avg projected Cpk: 1.27       │
│ [View ideas]                   │
└──────────────────────────────┘
```

Each card shows: cause name, evidence %, idea count, quick win count, average projected Cpk. "View ideas" scrolls to that cause's idea group.

**What-If as bottom sheet:** Clicking 🧪 Project opens the What-If Simulator as a full-screen bottom sheet (same content as desktop left panel). Saving closes the sheet and returns to ideas.

**Track view:** Stacks naturally as vertical list. Action cards, verification section, and outcome section work without modification.

**Idea cards:** Full-width, same content. Timeframe/cost/risk pills wrap to second line if needed.

## Components

### New Components

| Component                 | Package         | Purpose                                                          |
| ------------------------- | --------------- | ---------------------------------------------------------------- |
| `ImprovementContextPanel` | `@variscout/ui` | Left panel: problem statement, target, causes, synthesis         |
| `ActionTrackerSection`    | `@variscout/ui` | Cross-finding action list with inline management                 |
| `VerificationSection`     | `@variscout/ui` | Verification data entry + KPI comparison grid                    |
| `OutcomeSection`          | `@variscout/ui` | Outcome assessment (Effective/Partial/Not effective)             |
| `VerificationPrompt`      | `@variscout/ui` | Smart detection modal when new data + improving findings         |
| `TrackView`               | `@variscout/ui` | Track view layout: plan recap + actions + verification + outcome |
| `PlanRecap`               | `@variscout/ui` | Compact selected-ideas summary for Track view header             |
| `CauseSummaryCards`       | `@variscout/ui` | Mobile swipeable summary cards per cause (replaces matrix)       |

### Modified Components

| Component                  | Change                                                                    |
| -------------------------- | ------------------------------------------------------------------------- |
| `ImprovementWorkspaceBase` | Split layout, matrix placement, Plan/Track view switching                 |
| `PrioritizationMatrix`     | Ghost dots, cause colors, bidirectional highlight, pulsing projection dot |
| `IdeaGroupCard`            | Evidence % badge, cause color bar, 🧪 Project button per idea             |
| `ImprovementSummaryBar`    | Progressive evolution (plan → mixed → track → verification states)        |
| `WhatIfPageBase`           | Context header with subset/reference stats, contextual preset labels      |
| `SynthesisCard`            | Pre-fill from problem statement                                           |

### Modified Hooks

| Hook                              | Change                                                      |
| --------------------------------- | ----------------------------------------------------------- |
| `useImprovementOrchestration`     | Aggregate actions, Track view state, verification detection |
| `useDataIngestion` (or data flow) | Smart verification data detection prompt                    |

## Data Flow

### Idea → What-If → Matrix (existing, enhanced)

```
Click 🧪 on idea
  → setProjectionTarget({ questionId, ideaId, referenceContext })
  → Left panel transitions to What-If Simulator
  → Context header shows: "Head 5-8 (Cpk 0.62) vs Head 1-4 (Cpk 1.42)"
  → Presets labeled: "Match Head 1-4 mean"
  → Adjust sliders → matrix dot moves in real-time
  → Save → idea.projection = { projectedCpk, ... }
  → Matrix dot settles at continuous Y position
  → Left panel returns to Context Panel
```

### Plan → Track Transition

```
Click "Convert → Actions"
  → For each selected idea: create ActionItem with ideaId FK (existing logic)
  → Findings auto-transition: analyzed → improving
  → Hub transitions to Track View
  → Summary bar evolves to track mode
```

### Smart Verification Detection

```
Data upload completes (from any workspace)
  → Check: findings.some(f => f.status === 'improving')
  → Yes → Show VerificationPrompt: "Is this verification data?"
    → Yes → Tag as staged, populate VerificationSection KPI grid
    → No → Normal data flow
```

## Relationship to Previous Specs

This spec **supersedes** `2026-04-02-improvement-workspace-pdca-design.md` (the PDCA extension spec). All PDCA content (Actions, Verification, Outcome, synthesis pre-fill, evidence badges, smart verification detection) is incorporated here within the Track view and data handoff fixes. The PDCA spec should be marked `status: superseded`.

This spec **builds on** `2026-03-20-improvement-prioritization-design.md` (delivered). The prioritization data model (timeframe, cost, risk, benefit) and matrix presets are unchanged. This spec adds cause color-coding, ghost dots, bidirectional navigation, and contextual What-If integration.

## PWA Considerations

- PWA has all 5 finding statuses but no Improvement workspace
- The Improvement workspace is Azure-only
- No PWA impact from this design

## Verification

1. `pnpm test` — all pass
2. `pnpm build` — all build
3. **Plan view:** Open Improvement → matrix visible with cause-colored dots, idea cards below
4. **Ghost dots:** Ideas without projections show as dashed outlines with nudge message
5. **What-If integration:** Click 🧪 → left panel shows What-If with context header → adjust sliders → dot moves on matrix → save → projection badge appears
6. **Contextual presets:** Preset labels reference actual category names, not abstract terms
7. **Bidirectional navigation:** Click matrix dot → idea scrolls into view. Hover idea → dot highlights.
8. **Track view:** Convert ideas → Track view shows actions → assign → set due date → mark complete
9. **Verification:** Upload new data while improving → prompt → Yes → KPI grid populates
10. **Outcome:** Select "Effective" → findings transition to resolved
11. **Mobile:** Matrix becomes swipeable summary cards, What-If opens as bottom sheet
12. **Summary bar:** Evolves through plan → mixed → track → verification states
13. **Evidence badges:** Idea group headers show R²adj %
14. **Synthesis pre-fill:** First visit with problem statement → synthesis pre-filled
