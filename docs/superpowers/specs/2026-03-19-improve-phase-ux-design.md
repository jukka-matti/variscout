---
title: IMPROVE Phase UX Design
audience: [engineer, analyst]
category: workflow
status: stable
related: [improve, pdca, findings, ideation, actions, coaching, synthesis, workspace]
---

# IMPROVE Phase UX Design

The IMPROVE phase redesign introduces three key innovations to bridge the gap between investigation convergence and action:

1. **Three-Workspace Model** — Analysis | Findings | Improvement workspaces matching cognitive tasks
2. **Convergence Synthesis** — A deliberate synthesis moment where the analyst weaves findings into a suspected cause narrative
3. **Improvement Workspace** — Full-page planning view for brainstorming, selecting, and converting ideas to actions

## Methodology Correction

VariScout builds _understanding_ through structured learning. The investigation diamond converges on a suspected cause — the best-supported theory, confident enough to act on. True confirmation only comes when the process improves to target.

**Language rules throughout the IMPROVE phase:**

| Use                         | Avoid                      |
| --------------------------- | -------------------------- |
| "The evidence suggests..."  | "Confirmed that..."        |
| "The evidence points to..." | "Root cause identified..." |
| "Suspected cause"           | "Proven cause"             |
| "Build understanding"       | "Test hypothesis"          |
| "Gather evidence"           | "Prove"                    |

This language discipline applies to all surfaces: coaching text, CoScout prompts, synthesis fields, report narratives, and i18n keys.

## Three-Workspace Model

The analyst's cognitive task shifts as they move through the workflow. Each workspace matches a distinct mental mode:

| Workspace       | Cognitive Mode                                                           | Primary View                                                        | When Active                                  |
| --------------- | ------------------------------------------------------------------------ | ------------------------------------------------------------------- | -------------------------------------------- |
| **Analysis**    | Exploration — scanning charts, drilling factors, reading patterns        | Dashboard with charts, stats, filter breadcrumbs                    | FRAME, SCOUT, INVESTIGATE                    |
| **Findings**    | Evaluation — reviewing evidence, classifying findings, building the case | Board view with status columns, finding cards, hypothesis trees     | INVESTIGATE (converging), IMPROVE (planning) |
| **Improvement** | Planning — brainstorming ideas, estimating effort, converting to actions | Full-page improvement plan with synthesis, idea groups, summary bar | IMPROVE                                      |

### Workspace Navigation

- **Analysis workspace** is the default. The dashboard, charts, and filter navigation live here.
- **Findings workspace** is the existing Findings panel in board mode, accessible via the Findings button in the toolbar.
- **Improvement workspace** is a new full-page view, accessible from:
  - The toolbar Improvement button
  - The Findings board (button on analyzed/improving findings)
  - Direct URL parameter: `?view=improvement`

### Multi-Screen Support

All three workspaces support popout via URL parameters for dual-monitor setups:

| URL Parameter       | View                                       |
| ------------------- | ------------------------------------------ |
| `?view=findings`    | Findings board in standalone window        |
| `?view=improvement` | Improvement workspace in standalone window |
| _(none)_            | Analysis dashboard (default)               |

Popout windows share the same `DataContext` state via `BroadcastChannel`, keeping findings, hypotheses, and ideas synchronized across windows.

### No AI Dependency

All three workspaces are fully functional without AI. CoScout enhances the experience (synthesis drafting, idea suggestions, impact estimation) but every step has a manual equivalent. See [CoScout-Optional Design](#coscout-optional-design) below.

## Convergence Synthesis

The convergence synthesis is a deliberate pause at the boundary between INVESTIGATE and IMPROVE. The analyst summarizes what the evidence points to before shifting to improvement planning.

### When

The synthesis step activates when the investigation diamond reaches the **Converging** sub-phase — meaning at least one hypothesis is supported and the analyst is narrowing from "what might cause this" to "what we believe causes this."

### Trigger

Convergence conditions:

- At least one hypothesis has `status: 'supported'` or `causeRole: 'primary'`
- The investigation diamond reaches the Converging phase

The analyst can write the synthesis at any time or skip it entirely.

### With CoScout

When CoScout is available (Azure Team AI plan), the analyst can request a synthesis draft:

- Click "Draft synthesis" in the CoScout panel or synthesis field
- CoScout assembles a narrative from supported hypotheses, key-driver findings, and eta-squared evidence
- The draft appears in the synthesis field for editing
- The analyst always has final edit control

### Without CoScout

A plain text field with placeholder guidance: _"What does the evidence point to? Summarize the suspected cause in your own words."_

### Storage

```typescript
// In ProcessContext (packages/core/src/ai/types.ts)
interface ProcessContext {
  description?: string;
  product?: string;
  measurement?: string;
  targetDirection?: 'minimize' | 'maximize' | 'target';
  factorRoles?: Record<string, string>;
  /** Convergence synthesis — suspected cause narrative (max 500 chars) */
  synthesis?: string;
}
```

The synthesis field is limited to 500 characters to encourage concise narratives. It is stored on `ProcessContext` because it describes the process understanding, not a single finding.

### Language Guidance

The synthesis field enforces the methodology correction:

- Placeholder text uses "The evidence points to..." framing
- CoScout drafts use "The evidence suggests..." language
- System prompt instructs: _"Do not say 'confirmed' — use 'the evidence suggests' or 'the evidence points to'."_

### Where Synthesis Surfaces

| Surface                   | How It Appears                                              |
| ------------------------- | ----------------------------------------------------------- |
| **Board view header**     | Read-only card above status columns (when populated)        |
| **Improvement workspace** | Editable SynthesisCard at top of the page                   |
| **Report Step 3**         | "Suspected Cause" section with synthesis narrative          |
| **CoScout context**       | Included in system prompt to ground improvement suggestions |
| **Narration prompt**      | Included in `buildSummaryPrompt` for narrative generation   |

## Improvement Workspace Design

The Improvement Workspace is a full-page planning view that replaces the dashboard when the analyst shifts from understanding to action.

### Layout

```
┌──────────────────────────────────────────────────────────┐
│  ← Back to Analysis    Improvement Plan    [2L 1M 0H]   │  ← Top bar
├──────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────┐ │
│  │ SynthesisCard                                       │ │
│  │ "The evidence points to nozzle tip wear on FH3..."  │ │
│  │ [Finding 1] [Finding 3]  ← linked finding badges    │ │
│  └─────────────────────────────────────────────────────┘ │
│                                                          │
│  Think: Prevent · Detect · Simplify · Eliminate          │  ← Four Directions hint
│                                                          │
│  ┌─────────────────────────────────────────────────────┐ │
│  │ Hypothesis: "Nozzle tip wear" (supported)           │ │  ← IdeaGroupCard
│  │                                                     │ │
│  │  ☑ Replace nozzle weekly   [Prevent]    [Low ▾]    │ │
│  │    P: Cpk 1.35  [What-If] [Ask CoScout]           │ │
│  │                                                     │ │
│  │  ☐ Add inline sensor       [Detect]     [Med ▾]    │ │
│  │    P: Cpk 1.20  [What-If] [Ask CoScout]           │ │
│  │                                                     │ │
│  │  ☑ Automate adjustment     [Eliminate]  [High ▾]   │ │
│  │    P: Cpk 1.55  [What-If] [Ask CoScout]  → Action │ │
│  └─────────────────────────────────────────────────────┘ │
│                                                          │
│  ┌─────────────────────────────────────────────────────┐ │
│  │ Hypothesis: "Shift changeover gap" (partial)        │ │
│  │  ☐ Standardize handoff SOP  [Prevent]    [Low ▾]   │ │
│  └─────────────────────────────────────────────────────┘ │
│                                                          │
├──────────────────────────────────────────────────────────┤
│  2 selected · 2 low · 0 med · 0 high · Cpk 1.35       │  ← Summary bar
│                          [Convert selected → Actions]    │
└──────────────────────────────────────────────────────────┘
```

### Top Bar

| Element               | Description                                                 |
| --------------------- | ----------------------------------------------------------- |
| Back button           | "← Back to Analysis" — returns to the dashboard             |
| Title                 | "Improvement Plan" (i18n: `improve.title`)                  |
| Effort summary badges | Compact count of selected ideas by effort level: `2L 1M 0H` |

### SynthesisCard

The SynthesisCard anchors the improvement plan to the investigation's conclusion:

- **Editable narrative** — text area with 500-char limit, placeholder: _"What does the evidence point to?"_
- **Linked finding badges** — chips showing key-driver findings that contributed to the synthesis. Click a badge to jump back to that finding's filter context on the dashboard.
- **Read-only mode** — in the Board view header, the card is non-editable with a pencil icon to open the Improvement workspace for editing.

### Four Directions Hint

A single-line prompt below the SynthesisCard:

> Think: Prevent · Detect · Simplify · Eliminate

This surfaces the RDMAIC ideation framework (documented in investigation-to-action.md) as a lightweight creative prompt. It is always visible — not behind a tooltip or expandable section.

### IdeaGroupCard

Ideas are grouped by hypothesis. Each IdeaGroupCard shows:

| Element               | Description                                                   |
| --------------------- | ------------------------------------------------------------- |
| **Hypothesis header** | Hypothesis text + validation status badge (supported/partial) |
| **Idea rows**         | One row per `ImprovementIdea` on the hypothesis               |

Each idea row contains:

| Element                 | Description                                                                    |
| ----------------------- | ------------------------------------------------------------------------------ |
| **Checkbox**            | Select/deselect for conversion to actions                                      |
| **Idea text**           | Editable inline text                                                           |
| **Direction badge**     | Prevent / Detect / Simplify / Eliminate (color-coded)                          |
| **Effort dropdown**     | Inline `<select>` with LOW / MED / HIGH options, color-coded (green/amber/red) |
| **Projection badge**    | "P: Cpk X.XX" if a What-If projection is attached                              |
| **What-If button**      | Opens What-If Simulator with idea context                                      |
| **Ask CoScout button**  | Sends idea to CoScout for feasibility assessment (AI plans only)               |
| **Converted indicator** | "→ Action" label shown when `ideaId` FK exists on an ActionItem                |

Only ideas from hypotheses with `status: 'supported'` or `status: 'partial'` are shown. Contradicted and untested hypotheses are excluded from the improvement workspace since their ideas lack evidentiary support.

### Bottom Summary Bar (ImprovementSummaryBar)

A sticky bottom bar that aggregates selection state:

| Element              | Description                                                           |
| -------------------- | --------------------------------------------------------------------- |
| **Selected count**   | "N selected" (i18n: `improve.selectedCount`)                          |
| **Effort breakdown** | "X low · Y med · Z high" (i18n: `improve.effortBreakdown`)            |
| **Projected Cpk**    | Best projected Cpk from selected ideas (i18n: `improve.projectedCpk`) |
| **Convert button**   | "Convert selected → Actions" — creates ActionItems with ideaId FK     |

The Convert button is disabled when no ideas are selected.

## Ideas Architecture (Option C)

Ideas stay on hypotheses as `Hypothesis.ideas: ImprovementIdea[]`. The Improvement workspace aggregates ideas from supported and partial hypotheses across all findings.

**Why Option C (ideas on hypotheses):**

- Ideas are responses to specific suspected causes, not free-floating brainstorms
- Grouping by hypothesis preserves the logical connection between "what we think causes this" and "how we might fix it"
- The hypothesis tree already has CRUD operations via `useHypotheses` — no new state management needed
- Cross-cutting ideas (affecting multiple hypotheses) go on the primary hypothesis

**Data flow:**

```
Finding → Hypothesis (supported) → ImprovementIdea[]
                                         ↓ (selected)
                                    Convert → ActionItem (with ideaId FK)
                                         ↓ (on finding)
                                    Finding.actions[]
```

The Improvement workspace reads from all hypotheses across all findings, filters to supported/partial, and presents a flat aggregated view grouped by hypothesis.

## Idea to Action Conversion

The "Convert selected → Actions" button in the ImprovementSummaryBar performs the following:

1. For each selected idea, create an `ActionItem` with:
   - `text`: copied from `idea.text`
   - `ideaId`: set to `idea.id` (FK for traceability)
   - `createdAt`: current timestamp
2. Route the action to the correct finding via the hypothesis's `findingId` link
3. If this is the first action on an `analyzed` finding, auto-transition status to `improving`
4. Mark converted ideas with a "→ Action" indicator in the workspace

```typescript
// ActionItem with ideaId FK (already implemented in findings.ts)
interface ActionItem {
  id: string;
  text: string;
  assignee?: FindingAssignee;
  dueDate?: number;
  completedAt?: number;
  createdAt: number;
  /** Link to the ImprovementIdea that spawned this action (for traceability) */
  ideaId?: string;
}
```

The `createActionItem()` helper in `@variscout/core` already accepts an optional `ideaId` parameter. The conversion flow calls `useFindings.addAction()` with the idea's ID.

## Learning Loop (Projected vs Actual)

The `ideaId` FK enables a projected-vs-actual comparison on the FindingCard's outcome section:

### Display

When a finding has:

- An outcome with `cpkAfter` set
- An action with `ideaId` pointing to an idea with a projection

The FindingCard outcome section shows:

```
Projected 1.35 → Actual 1.42 (+0.07)
```

- **Green** when actual >= projected (improvement met or exceeded expectations)
- **Red** when actual < projected (improvement fell short)

This is already implemented in `FindingCard.tsx` via the `projectedCpk` prop. The host component resolves the projection by tracing `action.ideaId → hypothesis.ideas[].projection.cpk`.

### Learning Value

The projected-vs-actual comparison closes the learning loop:

- Analysts learn whether their What-If projections were accurate
- Over time, this builds estimation confidence
- The data is available for Knowledge Base contribution (Azure Team AI plan)

## Effort UX Improvement

### Before (cycle button)

The original effort UI was a tiny "E" button that cycled through `undefined → low → medium → high → undefined`. Problems:

- No visible current state without hovering
- Accidental clicks cycle past the desired value
- Not discoverable on mobile

### After (inline dropdown)

The effort field is now an inline `<select>` dropdown on the idea row:

| Value     | Color | Label  |
| --------- | ----- | ------ |
| _(empty)_ | Muted | —      |
| Low       | Green | Low    |
| Medium    | Amber | Medium |
| High      | Red   | High   |

This is implemented in `HypothesisNode.tsx` as a native `<select>` element with color-coded text matching `EFFORT_COLORS`.

### Effort in ActionProposalCard

When CoScout suggests an improvement idea via `suggest_improvement_idea`, the `ActionProposalCard` preview includes an effort line:

```
Effort: Low — existing resources, no approval
Effort: Medium — some coordination, minor cost
Effort: High — investment, cross-team coordination
```

The effort definitions are included in the tool schema description so the LLM can make informed estimates.

### Effort Estimation Definitions

| Level      | Definition                                                            | Examples                                                  |
| ---------- | --------------------------------------------------------------------- | --------------------------------------------------------- |
| **Low**    | Can be done immediately with existing resources, no approval needed   | Adjust machine setting, update SOP, add visual aid        |
| **Medium** | Requires some coordination, minor cost, or schedule adjustment        | Order replacement part, schedule training, modify fixture |
| **High**   | Requires investment, cross-team coordination, or significant downtime | Capital equipment, process redesign, new tooling          |

## CoScout-Optional Design

Every step in the IMPROVE phase works without AI. CoScout enhances the experience but is never required:

| Step                    | Without CoScout                                                    | With CoScout                                                          |
| ----------------------- | ------------------------------------------------------------------ | --------------------------------------------------------------------- |
| **Convergence trigger** | Hypothesis status signals convergence                              | CoScout can ask "Ready to summarize?"                                 |
| **Write synthesis**     | Manual text field with placeholder guidance                        | "Draft synthesis" button generates narrative from evidence            |
| **Brainstorm ideas**    | Manual entry on hypothesis nodes, Four Directions hint visible     | `suggest_improvement_idea` tool generates ideas with effort/direction |
| **Project impact**      | What-If Simulator round-trip (manual slider adjustment)            | CoScout can suggest simulation parameters                             |
| **Convert → Actions**   | Select ideas, click Convert, actions created with FK               | Same — conversion is always user-initiated                            |
| **Verify outcome**      | Set outcome manually (Effective/Partial/Not effective + Cpk after) | CoScout can summarize improvement delta from staged data              |

The tier gating is:

- **PWA (Free)**: 3-status model, no IMPROVE phase, no actions, no synthesis
- **Azure Standard**: Full IMPROVE phase, manual-only (no CoScout)
- **Azure Team**: Full IMPROVE phase, manual-only (no CoScout)
- **Azure Team AI**: Full IMPROVE phase + CoScout assistance

## Implementation Status

### Delivered

The following components and infrastructure have been implemented:

| Component                          | Package           | What It Does                                                                    |
| ---------------------------------- | ----------------- | ------------------------------------------------------------------------------- |
| `ProcessContext.synthesis`         | `@variscout/core` | Field on AI context type (max 500 chars)                                        |
| Synthesis in CoScout prompt        | `@variscout/core` | `coScout.ts` includes synthesis in investigation context with language guidance |
| Synthesis in narration prompt      | `@variscout/core` | `narration.ts` includes synthesis in summary prompt                             |
| `ActionItem.ideaId`                | `@variscout/core` | FK field + `createActionItem()` helper accepts ideaId                           |
| `IdeaDirection` type               | `@variscout/core` | `'prevent' \| 'detect' \| 'simplify' \| 'eliminate'` on `ImprovementIdea`       |
| Direction badge on HypothesisNode  | `@variscout/ui`   | Color-coded badge rendering idea direction                                      |
| Effort dropdown on HypothesisNode  | `@variscout/ui`   | Inline `<select>` replacing cycle button, color-coded                           |
| Effort in ActionProposalCard       | `@variscout/ui`   | Preview line with effort label and definition                                   |
| Projected vs actual in FindingCard | `@variscout/ui`   | Outcome section shows projected → actual with delta and color                   |
| i18n keys                          | `@variscout/core` | `improve.*`, `effort.*`, `idea.*`, `outcome.*` keys in en.ts catalog            |
| Four Directions hint               | `@variscout/ui`   | ImprovementWorkspaceBase hint references Prevent/Detect/Simplify/Eliminate      |
| Effort in tool schema              | `@variscout/core` | `suggest_improvement_idea` includes effort field with definitions               |
| Process context in narration       | `@variscout/core` | `product` and `measurement` in `buildSummaryPrompt`                             |

### Roadmap — All Items Delivered

All P1–P4 roadmap items are fully delivered as of 2026-03-19.

| Phase | #   | Item                                         | Status    |
| ----- | --- | -------------------------------------------- | --------- |
| P1    | 1   | Azure Editor.tsx — workspace navigation tabs | Delivered |
| P1    | 2   | Azure App.tsx — `?view=improvement` popout   | Delivered |
| P1    | 3   | Idea selection (inline in Editor.tsx memos)  | Delivered |
| P1    | 4   | Editor.tsx effort extraction                 | Delivered |
| P2    | 5   | FindingBoardView — synthesis header          | Delivered |
| P2    | 6   | ReportView — Step 3 synthesis section        | Delivered |
| P2    | 7   | Convergence nudge (removed with Coach)       | Removed   |
| P3    | 8   | WhatIfPageBase — "Save projection to idea"   | Delivered |
| P3    | 9   | `onOpenWhatIf` wiring                        | Delivered |
| P4    | 10  | FindingCard `projectedCpk` resolution        | Delivered |

## Related

- [Investigation to Action Workflow](../../03-features/workflows/investigation-to-action.md) — full investigation and improvement methodology
- [Methodology Coach Design](../../archive/2026-03-18-methodology-coach-design.md) — phase-aware coaching framework (archived, removed)
- [AI Action Tools Design](2026-03-19-ai-action-tools-design.md) — CoScout tool schemas including `suggest_improvement_idea`
- [ADR-020: Investigation Workflow](../../07-decisions/adr-020-investigation-workflow.md) — hypothesis model and finding status decisions
- [ADR-029: AI Action Tools](../../07-decisions/adr-029-ai-action-tools.md) — tool definitions and phase gating
- [Hypothesis Investigation](../../03-features/workflows/hypothesis-investigation.md) — diamond pattern for root cause investigation
