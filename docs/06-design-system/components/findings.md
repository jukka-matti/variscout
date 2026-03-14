# Findings

Investigation findings, board view, and corrective actions.

---

## Purpose

The Findings system captures and tracks investigation observations throughout the analyst workflow — from initial pattern detection through corrective action and outcome verification. It implements a lightweight PDCA cycle within VariScout.

---

## Components

| Component             | Package         | Purpose                                              |
| --------------------- | --------------- | ---------------------------------------------------- |
| `FindingsLog`         | `@variscout/ui` | Scrollable list of finding cards                     |
| `FindingCard`         | `@variscout/ui` | Individual finding with progressive sections         |
| `FindingEditor`       | `@variscout/ui` | Edit form for finding text, suspected cause, actions |
| `FindingStatusBadge`  | `@variscout/ui` | Status indicator dot/badge                           |
| `FindingTagBadge`     | `@variscout/ui` | Classification tag (Key Driver / Low Impact)         |
| `FindingBoardColumns` | `@variscout/ui` | Horizontal drag-and-drop board layout                |
| `FindingComments`     | `@variscout/ui` | Timestamped comment thread                           |
| `FindingsWindow`      | `@variscout/ui` | Popout window wrapper for dual-monitor               |
| `InvestigationPrompt` | `@variscout/ui` | Contextual prompt suggesting next investigation step |

**Source:** `packages/ui/src/components/FindingsLog/`

---

## FindingCard

Displays a single finding with progressive disclosure based on investigation status.

### Props

```typescript
interface FindingCardProps {
  finding: Finding;
  isActive: boolean;
  onSelect: (id: string) => void;
  onAction: (action: FindingsAction) => void;
  columnAliases?: Record<string, string>;
  colorScheme?: FindingCardColorScheme;
}
```

### Progressive Disclosure

Sections appear based on the finding's status:

| Status        | Visible Sections                                                                        |
| ------------- | --------------------------------------------------------------------------------------- |
| Observed      | Observation text, context chips (filter state, stats), source chip                      |
| Investigating | + comments log, photo evidence                                                          |
| Analyzed      | + **Suspected Cause** (free text), **Classification Tag** (Key Driver / Low Impact)     |
| Improving     | + **Corrective Actions** (list with assignee, due date, completion, overdue indicators) |
| Resolved      | + **Outcome Assessment** (effective selector, Cpk after, notes)                         |

### Source Chip

Findings created from chart observations display a source chip (e.g., "Boxplot: Machine C") to distinguish them from breadcrumb-pinned findings. The chip shows the chart type and category from `FindingSource`.

### Status Dot (Chart Annotations)

When a finding has a `source` (chart observation), the floating annotation box on the chart displays a small status dot matching the finding's investigation status color.

---

## Status Colors

| Status        | Color  | Hex       | Usage                                 |
| ------------- | ------ | --------- | ------------------------------------- |
| Observed      | Amber  | `#f59e0b` | Pattern spotted, not yet investigated |
| Investigating | Blue   | `#3b82f6` | Actively drilling into this           |
| Analyzed      | Purple | `#8b5cf6` | Suspected cause identified            |
| Improving     | Cyan   | `#06b6d4` | Corrective actions in progress        |
| Resolved      | Green  | `#22c55e` | Actions completed, outcome verified   |

### Tag Colors

| Tag        | Color             | Meaning                           |
| ---------- | ----------------- | --------------------------------- |
| Key Driver | Green (`#22c55e`) | Significant variation contributor |
| Low Impact | Gray (`#94a3b8`)  | Minor or negligible contribution  |

---

## Corrective Actions UI

Appears when status is "analyzed" or later. Each action item shows:

| Element           | Component          | Notes                                                              |
| ----------------- | ------------------ | ------------------------------------------------------------------ |
| Action text       | Text input         | Required                                                           |
| Assignee          | People picker      | Optional. Uses existing `FindingAssignee` type (UPN + displayName) |
| Due date          | Date input         | Optional. Native date picker on mobile                             |
| Completion        | Checkbox           | Sets `completedAt` timestamp                                       |
| Overdue indicator | Red border + label | When `dueDate < now` and not completed                             |

"+ Add action" button below the list. Action progress badge on board cards: "2/3 done".

### Auto-Transition

When the first action is added to an "analyzed" finding, status automatically moves to "improving".

---

## Outcome Assessment UI

Appears when status is "resolved" (or when manually triggered on "improving" findings).

| Element   | Component    | Notes                                          |
| --------- | ------------ | ---------------------------------------------- |
| Effective | Selector     | "Yes" / "No" / "Partial"                       |
| Cpk after | Number input | Optional. Compared with finding's original Cpk |
| Notes     | Text area    | Free-text outcome description                  |

### Auto-Transition

When all actions are completed AND outcome is set, status automatically moves to "resolved".

### Outcome Badges (Board View)

| Outcome       | Badge        |
| ------------- | ------------ |
| Effective     | Green check  |
| Not effective | Red X        |
| Partial       | Amber circle |

---

## Board View

Grouped-by-status layout with 5 columns:

| Observed | Investigating | Analyzed | Improving | Resolved |
| -------- | ------------- | -------- | --------- | -------- |

### Layout Variants

| Context                | Layout                                      | Interaction                |
| ---------------------- | ------------------------------------------- | -------------------------- |
| Panel (≤500px)         | Accordion — collapsible sections per status | Tap to expand              |
| Popout window (≥500px) | Horizontal columns                          | Native HTML5 drag-and-drop |

### Board Badges

- **Analyzed** cards: suspected cause text (if populated)
- **Improving** cards: action progress ("2/3 done"), overdue count
- **Resolved** cards: outcome badge (effective/not/partial)

### Board Time Filter

Manages finding accumulation in daily monitoring scenarios:

| Option             | Scope                                                                     |
| ------------------ | ------------------------------------------------------------------------- |
| This week          | Active: `createdAt` this week. Resolved: `outcome.verifiedAt` this week   |
| This month         | Active: `createdAt` this month. Resolved: `outcome.verifiedAt` this month |
| All time (default) | Everything                                                                |

Persisted in ViewState per project.

---

## Color Scheme

Components use the standard `colorScheme` pattern with `defaultColorScheme` (semantic tokens). Both PWA and Azure use the same defaults.

---

## Responsive Behavior

| Context                   | Behavior                                                                                                                                              |
| ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| Desktop                   | Inline resizable panel (Azure) or slide-in overlay (PWA)                                                                                              |
| Desktop (popout)          | Separate window with horizontal board columns                                                                                                         |
| Phone (<640px)            | Full-screen overlay (fixed inset-0 z-40)                                                                                                              |
| Phone (chart annotations) | MobileCategorySheet bottom action sheet replaces right-click. "Pin as Finding" includes source metadata. Draggable text annotations are desktop-only. |

---

## Accessibility

- Status badge: `aria-label` describes current status
- Board columns: `role="list"`, cards `role="listitem"`
- Drag-and-drop: keyboard alternative via status badge click (cycles status)
- Focus management: new finding receives focus, deleted finding moves focus to next
- Action items: overdue state announced via `aria-label`

---

## See Also

- [Investigation to Action](../../03-features/workflows/investigation-to-action.md) — Workflow documentation
- [ADR-015: Investigation Board](../../07-decisions/adr-015-investigation-board.md) — Architectural decisions
- [What-If Simulator](what-if-simulator.md) — Complementary improvement projection tool
- [Panels and Drawers](../patterns/panels-and-drawers.md) — Panel patterns
