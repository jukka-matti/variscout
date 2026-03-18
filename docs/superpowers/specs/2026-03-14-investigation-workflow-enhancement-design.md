---
title: 'Investigation Workflow Enhancement: Root Cause, Actions, Outcome'
---

# Investigation Workflow Enhancement: Root Cause, Actions, Outcome

**Date:** 2026-03-14
**Status:** Draft
**Scope:** Extend Finding type and UI to capture the full improvement journey
**Related:** AI Integration Strategy (../../archive/ai-integration-strategy-brainstorm.md)

## Context

VariScout's investigation workflow currently covers **discovery** (find variation via Four Lenses) and **investigation** (drill-down, pin findings, add comments). But the workflow drops off at the point of action — there's no structured way to capture root cause, corrective actions, or verify outcomes.

Quality teams use established methodologies (PDCA, DMAIC) that expect a closed-loop: find the problem → understand it → fix it → verify the fix worked. VariScout currently captures the first two steps well but leaves steps 3-4 to external tools or unstructured comments.

This enhancement completes the improvement journey within VariScout, following a PDCA-lightweight approach: the Finding lifecycle naturally captures the full cycle without imposing a formal framework.

### Goals

1. **Closed-loop investigations** — Track from observation → root cause → action → result
2. **Team accountability** — Action items with responsible person and due date
3. **Improvement reports** — Structured data for "we found X, did Y, Cpk improved from A to B"
4. **AI foundation** — Structured corrective action and outcome data feeds the AI knowledge base (see AI Integration Strategy)
5. **Teams integration** — Auto-post findings with actions to Teams channel

### Non-Goals

- Not a full CAPA (Corrective and Preventive Action) system
- Not a project management tool
- No Gantt charts, dependencies, or complex workflows
- No backward compatibility needed (clean type extensions)

## Methodology Mapping

VariScout's Finding lifecycle maps to PDCA:

| PDCA Phase | Finding Status                      | What Happens                                             |
| ---------- | ----------------------------------- | -------------------------------------------------------- |
| **Plan**   | observed → investigating → analyzed | Find variation, drill down, identify suspected cause     |
| **Do**     | improving                           | Define and assign corrective actions, implement them     |
| **Check**  | resolved                            | Load new data, verify improvement (Cpk before/after)     |
| **Act**    | resolved (outcome captured)         | Standardize if effective, or iterate with new PDCA cycle |

### Status Flow

```
observed → investigating → analyzed → improving (NEW) → resolved (NEW)
```

- **observed** = spotted a pattern
- **investigating** = drilling into it, adding comments
- **analyzed** = key factor identified, suspected cause documented, tagged key-driver/low-impact
- **improving** = corrective actions assigned (auto-transitions when first action added)
- **resolved** = all actions completed AND outcome verified

### Language: "Suspected Cause" Not "Root Cause"

VariScout finds where variation is hiding — the key factors. But identifying a factor (Machine A explains 47%) is not proving root cause. True root cause requires demonstrating that fixing it works. So we use:

- **"Suspected cause"** — what VariScout identifies (η², drill-down). Field name: `suspectedCause`
- **"Root cause confirmed"** — only when outcome = effective (verified)

## Data Model

### New Types

```typescript
/** A corrective action item linked to a finding */
export interface ActionItem {
  /** Unique identifier */
  id: string;
  /** Description of the action to take */
  text: string;
  /** Person responsible for the action */
  assignee?: FindingAssignee; // reuse existing type (upn + displayName)
  /** Due date (timestamp) */
  dueDate?: number;
  /** When the action was completed (timestamp) */
  completedAt?: number;
  /** When the action was created (timestamp) */
  createdAt: number;
}

/** Outcome assessment after corrective action */
export interface FindingOutcome {
  /** Was the corrective action effective? */
  effective: 'yes' | 'no' | 'partial';
  /** Baseline Cpk before corrective action (auto-filled from first stage) */
  cpkBefore?: number;
  /** Cpk measured after corrective action */
  cpkAfter?: number;
  /** Free-text notes about the outcome */
  notes?: string;
  /** When the outcome was verified (timestamp) */
  verifiedAt: number;
}
```

### Finding Type Extensions

```typescript
export interface Finding {
  // ... existing fields (id, text, createdAt, context, status, tag, comments, source, assignee) ...

  /** Suspected cause description — populated when status = analyzed.
   *  Called "suspected cause" because true root cause is only confirmed
   *  when the corrective action proves effective (outcome.effective = 'yes'). */
  suspectedCause?: string;

  /** Corrective action items — populated when status = analyzed */
  actions?: ActionItem[];

  /** Outcome assessment — populated when status = resolved */
  outcome?: FindingOutcome;
}
```

### Status Extension

```typescript
export type FindingStatus = 'observed' | 'investigating' | 'analyzed' | 'improving' | 'resolved';

export const FINDING_STATUS_LABELS: Record<FindingStatus, string> = {
  observed: 'Observed',
  investigating: 'Investigating',
  analyzed: 'Analyzed',
  improving: 'Improving',
  resolved: 'Resolved',
};

// Status colors: observed=amber, investigating=blue, analyzed=purple, improving=cyan, resolved=green
```

**Auto-transition:** When the first action item is added to an "analyzed" finding, status automatically moves to "improving". When all actions are completed AND outcome is set, status moves to "resolved".

### FindingsAction Protocol Extension

Add to the existing 7 action types:

```typescript
type FindingsAction =
  // ... existing: edit, delete, set-status, set-tag, add-comment, edit-comment, delete-comment ...
  | { type: 'set-suspected-cause'; id: string; suspectedCause: string }
  | { type: 'add-action'; id: string; action: ActionItem }
  | { type: 'update-action'; id: string; actionId: string; updates: Partial<ActionItem> }
  | { type: 'delete-action'; id: string; actionId: string }
  | { type: 'complete-action'; id: string; actionId: string }
  | { type: 'set-outcome'; id: string; outcome: FindingOutcome };
```

## UX Design

### Progressive Disclosure

Fields appear based on finding status:

| Status        | Visible Sections                                                |
| ------------- | --------------------------------------------------------------- |
| observed      | Observation text, context chips, comments                       |
| investigating | + comments log, photo evidence                                  |
| analyzed      | + **Suspected Cause** (text)                                    |
| improving     | + **Actions** (list with assignee, due date, overdue indicator) |
| resolved      | + **Outcome** (effective, Cpk after, notes)                     |

### Overdue Action Indicators

When `dueDate < now` and `completedAt === undefined`, the action item shows:

- Red border on the action row
- "Overdue: was [date]" label in red
- No notifications — just visual indicator on the card and in Teams postings

### Finding Card (Extended)

The existing FindingCard gets 3 collapsible sections:

1. **Root Cause** section — single free-text area. Appears when status = analyzed.
2. **Actions** section — list of action items. Each has: text, assignee (people picker), due date, completion checkbox. "+ Add action" button. Appears when status = analyzed.
3. **Outcome** section — effective (yes/no/partial selector), Cpk after (number input), notes (text area). Appears when status = resolved.

### Board View (Extended)

The existing 3-column board extends to 5 columns:

| Observed | Investigating | Analyzed | Improving | Resolved |
| -------- | ------------- | -------- | --------- | -------- |

- **Analyzed** cards show suspected cause badge if populated
- **Improving** cards show action progress (e.g., "2/3 done") and overdue indicators
- **Resolved** cards show outcome badge (green check = effective, red = not, amber = partial)

### Board Time Filter

The board includes a time filter for managing finding accumulation in daily monitoring scenarios:

- **Options:** "This week" | "This month" | "All time"
- **Default:** "All time" (shows everything — works for improvement projects)
- **Applies to all columns** — filters by `createdAt` for active findings, `outcome.verifiedAt` for resolved
- **Persisted in ViewState** per project

**Use case:** A team leader doing daily monitoring sets filter to "This week" to see only current findings. Resolved findings from previous weeks are hidden but remain in the data and AI knowledge base. Switching to "All time" shows the full history.

### Mobile Behavior

On phone (< 640px), the action items list renders as a vertical stack. People picker uses existing PeoplePicker component (from ADR-018). Due date uses native date input.

## Teams Integration

### Auto-Post on Status Change

When a finding moves to **analyzed** with root cause + actions, auto-post to the Teams channel:

```
📌 Finding Analyzed: Fill Head 3 drift — morning shift

Root cause: Nozzle tip worn beyond tolerance

Actions:
☐ Replace nozzle tip on Fill Head 3 — @Kim Larsson — Due: Mar 15
☐ Add nozzle inspection to daily checklist — @Jan Virtanen — Due: Mar 25
```

When a finding moves to **resolved** with outcome, auto-post:

```
✅ Finding Resolved: Fill Head 3 drift — morning shift

Outcome: Effective ✓
Cpk: 0.85 → 1.35
Notes: Nozzle replacement resolved drift. Monitoring for 2 weeks.
```

Uses existing ADR-018 @mention workflow and Teams posting infrastructure.

## Files to Modify

| File                                                             | Change                                                                                    |
| ---------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| `packages/core/src/findings.ts`                                  | Add ActionItem, FindingOutcome interfaces. Extend Finding, FindingStatus, FindingsAction. |
| `packages/hooks/src/useFindings.ts`                              | Add reducer cases for new action types.                                                   |
| `packages/ui/src/components/FindingsLog/FindingCard.tsx`         | Add collapsible Root Cause, Actions, Outcome sections.                                    |
| `packages/ui/src/components/FindingsLog/FindingEditor.tsx`       | Add root cause textarea, action items editor.                                             |
| `packages/ui/src/components/FindingsLog/FindingBoardColumns.tsx` | Add "Resolved" column.                                                                    |
| `packages/ui/src/components/FindingsLog/FindingStatusBadge.tsx`  | Add resolved color (green).                                                               |
| `apps/azure/src/components/Editor.tsx`                           | Wire new action dispatches.                                                               |
| `apps/azure/src/teams/`                                          | Extend posting for analyzed/resolved status changes.                                      |

## Testing

| Component               | Tests                                                                                         |
| ----------------------- | --------------------------------------------------------------------------------------------- |
| Finding type extensions | Unit tests for new factory functions, action item CRUD                                        |
| useFindings reducer     | Test 6 new action types (set-root-cause, add/update/delete/complete-action, set-outcome)      |
| FindingCard             | Component tests for progressive section visibility                                            |
| FindingEditor           | Component tests for root cause, action list, outcome form                                     |
| Board view              | Test 4-column layout, badges                                                                  |
| Teams posting           | Test message format for analyzed + resolved                                                   |
| E2E                     | Full flow: create finding → analyze → add root cause → add actions → resolve → verify outcome |

## AI Integration Value

With these extensions, the AI knowledge base gains:

- **Root cause patterns** — "Fill Head drift is caused by nozzle wear 60% of the time"
- **Action effectiveness** — "Nozzle replacement has 90% success rate for this type of drift"
- **Cpk improvement tracking** — "Average Cpk improvement for resolved findings: 0.45"
- **Time-to-resolution** — "Findings about Fill Head 3 take average 5 days to resolve"
- **Team workload** — "Kim has 3 open actions; Jan has completed 8 this month"

This data feeds directly into the AI CoScout's ability to suggest actions, estimate improvement potential, and generate investigation reports.
