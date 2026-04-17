---
title: Improvement Workspace PDCA Extension
audience: [developer, analyst]
category: architecture
status: superseded
superseded-by: 2026-04-02-improvement-hub-design.md
related: [improvement, pdca, actions, verification, outcome]
---

# Improvement Workspace PDCA Extension

**Superseded by [Improvement Hub Redesign](2026-04-02-improvement-hub-design.md)** which incorporates all PDCA content within a broader workspace redesign.

## Context

The Improvement workspace was designed to handle full PDCA (Plan, Do, Check, Act) per the mental model hierarchy and navigation docs. The implementation covers Plan well (synthesis, ideas, What-If projections, Convert → Actions) but the Do/Check/Act steps are scattered: actions live on finding cards in Investigation, verification happens in Analysis workspace (StagedComparisonCard), and outcome assessment is buried in individual finding cards.

The analyst's journey after converting ideas to actions currently requires switching between 3 workspaces to track execution, verify improvement, and assess outcomes. This breaks the flow — especially for the "Check" step where new verification data needs to be connected to the improvement context.

Additionally, two data hand-off disconnects exist:

1. SynthesisCard starts blank even though the analyst already wrote a problem statement in Investigation
2. Idea group headers don't show evidence strength (R²adj/η²), losing prioritization context

## Decision

Extend the Improvement workspace with three new sections (Actions, Verification, Outcome) and fix two data hand-off disconnects. The flow is natural — no PDCA section headers, the methodology is the structure without being named in the UI.

### 1. Synthesis Pre-Fill from Problem Statement

When the analyst first opens the Improvement workspace, if `processContext.problemStatement` exists and `processContext.synthesis` is empty, pre-fill the SynthesisCard with the problem statement text.

The analyst can then edit it to add improvement context (e.g., "...we will address this by standardizing the night shift setup procedure and replacing worn nozzles on heads 5-8").

**Implementation:** In the improvement orchestration hook, check if synthesis is empty + problemStatement exists → set synthesis = problemStatement on first visit.

### 2. Evidence % in Idea Group Headers

Each IdeaGroupCard header shows the question's factor name. Add an evidence badge showing R²adj or η² percentage.

Before: `Shift (Night) → Suspected cause`
After: `Shift (Night)  R²adj 34%  suspected`

**Implementation:** `IdeaGroupCard` already receives the question object. Extract `question.evidence?.rSquaredAdj` or `question.evidence?.etaSquared` and render a small badge.

### 3. Actions Section (NEW)

A cross-finding action tracker below the idea groups. Aggregates all actions from all findings with status `improving` or `resolved`.

**Layout:**

```
Actions                    3/5 complete  [████████░░░░]
⚠ 1 action overdue

☑ Standardize setup SOP              Done Mar 28
☑ Retrain night shift                Done Mar 30
☑ Update work instruction            Done Apr 1
☐ Replace nozzles heads 5-8   Matti K.   OVERDUE
☐ Calibrate pressure sensors          Apr 15

+ Add action
```

**Features:**

- Aggregated from all findings with active actions
- Completion checkboxes (toggle completedAt)
- Overdue alert banner (red) when any action past dueDate
- Assignee display (purple badge)
- Due date with red color when overdue
- Click action → could navigate to finding card for full context
- "+ Add action" opens a dialog where analyst types action text and selects which finding to attach it to (dropdown of improving/analyzed findings)

**Data source:** Iterate all `findings` where `finding.actions?.length > 0`. Flatten into a single list sorted by: overdue first, then pending by dueDate, then completed by completedAt.

### 4. Verification Section (NEW)

Entry point for verification data and display of before/after comparison.

**Before verification data exists:**

```
Verification
┌─────────────────────────────────────────┐
│  No verification data yet               │
│  [+ Add verification data]              │
│  Or upload data normally — system will  │
│  ask if it's for verification           │
└─────────────────────────────────────────┘
```

**After verification data arrives:**

```
Verification                    Apr 2 data
┌──────┬──────────┬────────────┬─────────┐
│ Cpk  │ Pass Rate│ Mean Shift │ σ Ratio │
│0.62→ │ 72% →   │  -1.8mm    │  0.72   │
│ 1.28 │  96%    │            │         │
└──────┴──────────┴────────────┴─────────┘
           View staged charts in Analysis →
```

**KPI Grid:** Shows the 4 key metrics from `StagedComparisonCard`:

- Cpk before → after (color: green if improved, red if worse)
- Pass rate before → after
- Mean shift (absolute delta)
- σ ratio (after/before, <1 = improved)

**"Add verification data" button:** Opens the standard data upload flow (PasteScreen or file picker) with a flag indicating this is verification/staged data. The uploaded data is tagged as the "after" dataset.

**Smart detection (when uploading from anywhere):** When new data arrives AND there are findings with `status === 'improving'`, show a prompt: "You have ongoing improvement actions. Is this new data to verify their effect?" Yes → tag as verification. No → normal append/replace.

**Link to Analysis:** "View staged charts in Analysis →" navigates to the Analysis workspace where the full StagedComparisonCard, staged I-Chart, staged Boxplot, and staged Capability charts are visible.

### 5. Outcome Section (NEW)

Outcome assessment appears after verification data exists. Allows the analyst to record whether the improvement was effective.

**Layout:**

```
Outcome

Was the improvement effective?

[Effective ✓]   [Partial]   [Not effective]

Notes: ________________________
```

**Three outcome options:**

- **Effective** — Target met. Finding status → `resolved`. Green styling.
- **Partial** — Improved but below target. Finding stays `improving`. Amber styling. Suggests iteration.
- **Not effective** — No improvement. Finding stays `improving`. Red styling. Suggests re-investigation.

**When outcome is selected:**

- Stores on `finding.outcome` (existing field)
- If "Effective": transitions all linked findings to `resolved` status
- If "Partial" or "Not effective": findings remain `improving`, analyst can iterate (add more ideas, new actions)
- Notes saved to finding comments as an outcome comment

**Progressive disclosure:** Outcome section is dimmed/collapsed until verification data exists. This prevents premature assessment.

### 6. Smart Verification Data Detection

When the data upload flow completes (from any workspace) and there are findings with `status === 'improving'`:

1. Show a modal/prompt: "You have X actions in progress. Is this new data to check their effect?"
2. **Yes** → Data tagged as staged/verification. StagedComparisonCard activates in Analysis. Verification section in Improvement populates with KPI grid.
3. **No** → Normal data flow (append/replace).

**Implementation:** Add a check in the data ingestion hook (`useDataIngestion` or the Azure data flow). After data is parsed and accepted, check `findings.some(f => f.status === 'improving')`. If true, show the prompt.

### 7. Summary Bar Enhancement

The existing `ImprovementSummaryBar` at the bottom gains additional context:

Before: `3 ideas selected · days · low risk`
After: `3 ideas selected · 3/5 actions done · Cpk 0.62 → 1.28`

Show action completion count and the verification Cpk change (if available) alongside the existing idea selection summary.

## Components

### New Components

| Component              | Package         | Purpose                                                  |
| ---------------------- | --------------- | -------------------------------------------------------- |
| `ActionTrackerSection` | `@variscout/ui` | Cross-finding action list with inline management         |
| `VerificationSection`  | `@variscout/ui` | Verification data entry + KPI comparison grid            |
| `OutcomeSection`       | `@variscout/ui` | Outcome assessment (Effective/Partial/Not effective)     |
| `VerificationPrompt`   | `@variscout/ui` | Smart detection modal when new data + improving findings |

### Modified Components

| Component                     | Change                                                           |
| ----------------------------- | ---------------------------------------------------------------- |
| `ImprovementWorkspaceBase`    | Add Actions, Verification, Outcome sections below ideas          |
| `IdeaGroupCard`               | Add evidence % badge to header                                   |
| `SynthesisCard`               | Accept `initialValue` prop for pre-fill from problem statement   |
| `ImprovementSummaryBar`       | Show action completion + verification Cpk in summary             |
| `useImprovementOrchestration` | Aggregate actions across findings, handle verification detection |

### Hooks

| Hook                              | Change                                                      |
| --------------------------------- | ----------------------------------------------------------- |
| `useImprovementOrchestration`     | Add `aggregatedActions`, `verificationData`, `outcomeState` |
| `useDataIngestion` (or data flow) | Add verification data detection prompt                      |

## Data Flow

### Action Aggregation

```typescript
// Aggregate actions from all findings with improving/resolved status
const aggregatedActions = useMemo(() => {
  return findings
    .filter(f => f.actions && f.actions.length > 0)
    .flatMap(f => f.actions!.map(a => ({ ...a, findingId: f.id, findingText: f.text })))
    .sort((a, b) => {
      // Overdue first, then pending by dueDate, then completed
      const aOverdue = a.dueDate && !a.completedAt && new Date(a.dueDate) < new Date();
      const bOverdue = b.dueDate && !b.completedAt && new Date(b.dueDate) < new Date();
      if (aOverdue && !bOverdue) return -1;
      if (!aOverdue && bOverdue) return 1;
      if (!a.completedAt && b.completedAt) return -1;
      if (a.completedAt && !b.completedAt) return 1;
      return 0;
    });
}, [findings]);
```

### Verification KPI Grid

Reads from existing `StagedComparisonCard` data (which is already computed in the stats pipeline when staged data is present). The Improvement workspace just displays a summary — the full charts remain in Analysis.

```typescript
interface VerificationSummary {
  cpkBefore: number;
  cpkAfter: number;
  passRateBefore: number;
  passRateAfter: number;
  meanShift: number;
  sigmaRatio: number;
  dataDate: string;
}
```

## PWA Considerations

- PWA has 3-status findings (no `improving`/`resolved`) and no Improvement workspace
- These changes are Azure-only
- No PWA impact

## Verification

1. `pnpm test` — all pass
2. `pnpm build` — all build
3. **Synthesis pre-fill:** Open Improvement after writing problem statement → SynthesisCard pre-filled
4. **Evidence badges:** Idea group headers show R²adj %
5. **Actions:** Convert ideas → actions appear in Actions section → check/uncheck → overdue shows red
6. **Verification data:** Upload new data while findings improving → prompt appears → Yes → KPI grid populates
7. **Outcome:** Select "Effective" → finding transitions to resolved
8. **Smart detection:** Upload from Analysis workspace → "Is this verification data?" prompt when improving findings exist
