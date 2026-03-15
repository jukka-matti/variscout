# Findings

Investigation findings, board view, and corrective actions.

---

## Purpose

The Findings system captures and tracks investigation observations throughout the analyst workflow — from initial pattern detection through corrective action and outcome verification. It implements a lightweight PDCA cycle within VariScout.

### Tier Availability

| Capability         | PWA (Free)              | Azure Standard          | Azure Team                |
| ------------------ | ----------------------- | ----------------------- | ------------------------- |
| Statuses           | 3 (observed → analyzed) | 5 (observed → resolved) | 5 (observed → resolved)   |
| Tags               | Key Driver / Low Impact | Key Driver / Low Impact | Key Driver / Low Impact   |
| Comments           | Yes                     | Yes                     | Yes (with photo evidence) |
| Suspected cause    | -                       | Yes                     | Yes                       |
| Corrective actions | -                       | Yes                     | Yes + team assignment     |
| Outcome assessment | -                       | Yes                     | Yes                       |
| Board columns      | 3                       | 5                       | 5                         |
| Board time filter  | -                       | Yes                     | Yes                       |
| Teams auto-posting | -                       | -                       | On analyzed + resolved    |
| Knowledge base     | -                       | -                       | Resolved outcomes feed AI |

---

## Components

| Component             | Package         | Purpose                                              |
| --------------------- | --------------- | ---------------------------------------------------- |
| `FindingsLog`         | `@variscout/ui` | Scrollable list of finding cards                     |
| `FindingCard`         | `@variscout/ui` | Individual finding with progressive sections         |
| `FindingEditor`       | `@variscout/ui` | Edit form for finding text, suspected cause, actions |
| `FindingStatusBadge`  | `@variscout/ui` | Status indicator dot/badge (3 or 5 variants by tier) |
| `FindingTagBadge`     | `@variscout/ui` | Classification tag (Key Driver / Low Impact)         |
| `FindingBoardColumns` | `@variscout/ui` | Horizontal drag-and-drop board layout (3 or 5 cols)  |
| `FindingComments`     | `@variscout/ui` | Timestamped comment thread                           |
| `FindingsWindow`      | `@variscout/ui` | Popout window wrapper for dual-monitor               |
| `InvestigationPrompt` | `@variscout/ui` | Contextual prompt suggesting next investigation step |
| `ActionItemList`      | `@variscout/ui` | Corrective action items within a finding (Azure)     |
| `FindingOutcomeCard`  | `@variscout/ui` | Before/after metrics comparison + verification notes |
| `FindingDetailPanel`  | `@variscout/ui` | Expanded view: full history, actions, outcome        |
| `OverdueIndicator`    | `@variscout/ui` | Red dot/badge on findings with overdue action items  |

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

## FindingStatusBadge

Renders a colored dot/badge indicating the finding's investigation status.

### Props

```typescript
interface FindingStatusBadgeProps {
  status: FindingStatus;
  onClick?: () => void;
  size?: 'sm' | 'md'; // sm = 8px dot, md = pill with label
}
```

### Variants

| Status        | Color  | Hex       | Tailwind Class  | Availability        |
| ------------- | ------ | --------- | --------------- | ------------------- |
| Observed      | Amber  | `#f59e0b` | `bg-amber-500`  | All tiers           |
| Investigating | Blue   | `#3b82f6` | `bg-blue-500`   | All tiers           |
| Analyzed      | Purple | `#8b5cf6` | `bg-violet-500` | All tiers           |
| Improving     | Cyan   | `#06b6d4` | `bg-cyan-500`   | Azure Standard/Team |
| Resolved      | Green  | `#22c55e` | `bg-green-500`  | Azure Standard/Team |

PWA renders only the first 3 statuses. The component accepts a `maxStatuses` prop (default 5) to control which statuses are available in the click-cycle.

---

## ActionItemList

Renders the corrective action items within a FindingCard. Azure only.

### Props

```typescript
interface ActionItemListProps {
  actions: ActionItem[];
  onAdd: () => void;
  onUpdate: (actionId: string, updates: Partial<ActionItem>) => void;
  onDelete: (actionId: string) => void;
  onComplete: (actionId: string) => void;
  enableAssignee?: boolean; // true for Team plan (people picker)
  colorScheme?: ActionItemColorScheme;
}
```

### Layout

Each action item row contains:

| Element           | Component          | Notes                                           |
| ----------------- | ------------------ | ----------------------------------------------- |
| Completion        | Checkbox           | Toggles `completedAt` timestamp                 |
| Action text       | Editable text      | Required, single line                           |
| Assignee          | People picker      | Team plan only (`enableAssignee`), shows avatar |
| Due date          | Date input         | Optional, native date picker on mobile          |
| Overdue indicator | `OverdueIndicator` | When `dueDate < now` and not completed          |
| Delete            | Icon button        | Trash icon, confirms before deletion            |

"+ Add action" button below the list. Completed actions show strikethrough text and gray styling.

### Progress Badge

For board card preview: `ActionProgressBadge` renders "2/3 done" text derived from `actions.filter(a => a.completedAt).length / actions.length`.

---

## FindingOutcomeCard

Renders the outcome assessment section within a FindingCard. Azure only.

### Props

```typescript
interface FindingOutcomeCardProps {
  outcome?: FindingOutcome;
  originalCpk?: number; // from finding.context.stats.cpk
  onSetOutcome: (outcome: FindingOutcome) => void;
  colorScheme?: FindingOutcomeColorScheme;
}
```

### Layout

| Element        | Component    | Notes                                          |
| -------------- | ------------ | ---------------------------------------------- |
| Effective      | Selector     | "Yes" / "No" / "Partial" pill group            |
| Cpk comparison | Side-by-side | Original Cpk → After Cpk, with delta and arrow |
| Notes          | Text area    | Free-text outcome description                  |

### Cpk Comparison Display

When both `originalCpk` and `outcome.cpkAfter` are present, renders:

```
Cpk: 0.85 → 1.35 (+0.50) ↑
```

Arrow and delta colored green for improvement, red for regression.

---

## FindingDetailPanel

Expanded view showing the full finding lifecycle. Used when clicking a finding card to see all details.

### Props

```typescript
interface FindingDetailPanelProps {
  finding: Finding;
  onAction: (action: FindingsAction) => void;
  onClose: () => void;
  columnAliases?: Record<string, string>;
  enableActions?: boolean; // false for PWA
  enableAssignee?: boolean; // true for Team plan
}
```

### Sections (progressive disclosure)

1. **Header**: Status badge, text, creation date, source chip
2. **Context**: Filter chips, statistics snapshot, variation %
3. **Comments**: Timestamped investigation log with photos (Team)
4. **Suspected Cause**: Free text (Azure, visible from "analyzed")
5. **Tags**: Key Driver / Low Impact selector (visible from "analyzed")
6. **Actions**: ActionItemList (Azure, visible from "analyzed")
7. **Outcome**: FindingOutcomeCard (Azure, visible when all actions done)

---

## OverdueIndicator

Visual indicator for action items past their due date.

### Props

```typescript
interface OverdueIndicatorProps {
  dueDate: number;
  isCompleted: boolean;
}
```

### Rendering

- Returns `null` if `isCompleted` is true or `dueDate` is in the future
- Shows red dot (8px) and "Overdue" label in `text-red-500`
- On board cards: shows red count badge (e.g., "2 overdue") when multiple actions are overdue

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

Grouped-by-status layout. Column count depends on tier:

**Azure App (5 columns):**

| Observed | Investigating | Analyzed | Improving | Resolved |
| -------- | ------------- | -------- | --------- | -------- |

**PWA (3 columns):**

| Observed | Investigating | Analyzed |
| -------- | ------------- | -------- |

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

## HypothesisTreeView

Renders a finding's hypothesis tree with indented nodes, status indicators, and validation type icons. Replaces the flat hypothesis display when sub-hypotheses exist.

**Source:** `packages/ui/src/components/FindingsLog/HypothesisTreeView.tsx`

### Props

```typescript
interface HypothesisTreeViewProps {
  hypotheses: Hypothesis[];
  findingId: string;
  onCreateChild: (parentId: string) => void;
  onUpdateStatus: (id: string, status: HypothesisStatus) => void;
  onSetValidationType: (id: string, type: 'data' | 'gemba' | 'expert') => void;
  onSetTask: (id: string, task: string) => void;
  onCompleteTask: (id: string) => void;
  onSetNote: (id: string, note: string) => void;
  onDelete: (id: string) => void;
  maxDepth?: number; // default: 3
  maxChildren?: number; // default: 8
  maxTotal?: number; // default: 30
  colorScheme?: HypothesisTreeColorScheme;
}
```

### Layout

```
┌──────────────────────────────────────────────┐
│  Hypotheses                          [+ Add] │
│                                              │
│  ● Machine 5 is causing drift        [data]  │
│    ├── ● Worn nozzle tip           [gemba]   │
│    │     Task: Check nozzle wear   [Done]    │
│    │     "Worn 0.3mm beyond spec"            │
│    ├── ● Temperature instability     [data]  │
│    │     Factor: Temperature  eta=23%        │
│    │     > 2 children (1 supported)          │
│    └── x Operator technique variance [data]  │
│          Factor: Operator  eta=3%            │
│                                              │
│  Progress: 2/3 tested, 1 contradicted        │
└──────────────────────────────────────────────┘
```

### Tree View Mode

FindingsLog gains a third view mode alongside List and Board:

| Mode  | Icon      | Layout                                       |
| ----- | --------- | -------------------------------------------- |
| List  | List      | Scrollable cards (existing)                  |
| Board | Columns   | Status columns with drag-and-drop (existing) |
| Tree  | GitBranch | Hypothesis tree per finding (new)            |

Tree view shows one finding at a time with its full hypothesis tree. Navigate between findings with prev/next arrows above the tree.

### Tree Constraints

| Constraint   | Limit | Error Message When Exceeded                 |
| ------------ | ----- | ------------------------------------------- |
| Max depth    | 3     | "Maximum hypothesis depth reached"          |
| Max children | 8     | "Maximum sub-hypotheses per parent reached" |
| Max total    | 30    | "Maximum hypotheses per finding reached"    |

---

## HypothesisNode

Individual tree node component rendering a single hypothesis with its status, metadata, and interaction controls.

**Source:** `packages/ui/src/components/FindingsLog/HypothesisNode.tsx`

### Props

```typescript
interface HypothesisNodeProps {
  hypothesis: Hypothesis;
  depth: number;
  childCount: number;
  supportedChildCount: number;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onCreateChild: () => void;
  onUpdateStatus: (status: HypothesisStatus) => void;
  onSetValidationType: (type: 'data' | 'gemba' | 'expert') => void;
  onSetTask: (task: string) => void;
  onCompleteTask: () => void;
  onSetNote: (note: string) => void;
  onDelete: () => void;
  canAddChild: boolean;
  colorScheme?: HypothesisNodeColorScheme;
}
```

### Rendering Spec

| Element              | Spec                                                                                        |
| -------------------- | ------------------------------------------------------------------------------------------- |
| Indentation          | `depth * 24px` left padding. Tree lines via `border-l` with connectors                      |
| Status dot           | 8px circle. Colors: amber (untested), blue (partial), green (supported), red (contradicted) |
| Hypothesis text      | Editable inline. Bold for root (`depth === 0`), normal for children                         |
| Factor badge         | Blue pill: factor name + eta-squared %. Only shown for data-type hypotheses                 |
| Validation type icon | 16px icon after text. Chart (data), Factory (gemba), User (expert)                          |
| Task row             | Below node, indented. Task description + checkbox. Gemba/expert only                        |
| Manual note          | Below task. Italic, `text-content-secondary`. Gemba/expert only                             |
| Children summary     | "N children (M supported)" when collapsed and node has children                             |
| Contradicted styling | `opacity-50` + `line-through` on hypothesis text                                            |
| Add child button     | Small "+" icon (16px) at end of node row. Hidden when `canAddChild` false                   |
| Delete button        | Trash icon on hover. Confirms before deleting nodes with children                           |

### Validation Type Icons

| Type   | Icon    | Color             |
| ------ | ------- | ----------------- |
| Data   | Chart   | `text-blue-500`   |
| Gemba  | Factory | `text-amber-500`  |
| Expert | User    | `text-purple-500` |

### ImprovementIdeasSection

Collapsible section within HypothesisNode, visible when the hypothesis status is `supported` or `partial`. Allows the analyst to brainstorm and evaluate improvement ideas tied to a confirmed root cause.

**Source:** `packages/ui/src/components/FindingsLog/HypothesisNode.tsx` (inline section)

#### Layout

```
┌──────────────────────────────────────────────────┐
│  ▼ Improvement Ideas (2)                         │
│                                                  │
│  ★ Replace nozzle tip weekly                     │
│    Impact: High   Effort: Low   Cpk 0.85 → 1.42 │
│                                                  │
│  ○ Add temperature PID controller                │
│    Impact: Medium  Effort: High                  │
│                                                  │
│  [+ Add idea...]                                 │
│  [Ask CoScout]  [▼ Effort]  [Project →]          │
└──────────────────────────────────────────────────┘
```

#### Elements

| Element              | Spec                                                                                                         |
| -------------------- | ------------------------------------------------------------------------------------------------------------ |
| Section header       | Collapsible. "Improvement Ideas (N)" with chevron toggle. Hidden when hypothesis is untested or contradicted |
| Idea row             | Text description (editable inline), impact badge, effort badge, optional projection summary                  |
| Impact badge         | Computed from What-If projection: High (green), Medium (amber), Low (gray). "—" if no projection             |
| Effort badge         | Manual cycle: Low → Medium → High → Low. Pill with color: Low (green), Medium (amber), High (red)            |
| Projection summary   | Inline text: "Cpk 0.85 → 1.42" when a What-If projection exists for this idea                                |
| Selected indicator   | Star (★) for selected idea, circle (○) for unselected. Click to toggle. Max one selected per hypothesis      |
| "Add idea" input     | Text input at bottom of list. Enter to add. Placeholder: "Add improvement idea..."                           |
| "Ask CoScout" button | Opens CoScout panel with ideation context pre-loaded. Only shown when AI is configured                       |
| Effort cycle button  | Cycles the selected idea's effort level (Low → Medium → High)                                                |
| "Project" button     | Opens What-If Simulator pre-populated with the selected idea's parameters. Disabled when no idea selected    |

#### Interaction

- Adding an idea creates an `ImprovementIdea` entry on the hypothesis
- "Ask CoScout" triggers converging-phase CoScout with the hypothesis context (see [AI Architecture](../../05-technical/architecture/ai-architecture.md#converging-phase-ideation-coaching))
- "Project" navigates to What-If Simulator; on return, the projection result (Cpk delta) is stored on the idea and displayed as the impact badge and projection summary
- Selected idea (starred) is the one carried forward into corrective actions when the finding progresses to "improving" status

### Status Colors

Uses the same palette as HypothesisStatus (distinct from FindingStatus):

| Status       | Color | Hex       |
| ------------ | ----- | --------- |
| Untested     | Amber | `#f59e0b` |
| Partial      | Blue  | `#3b82f6` |
| Supported    | Green | `#22c55e` |
| Contradicted | Red   | `#ef4444` |

---

## See Also

- [Investigation to Action](../../03-features/workflows/investigation-to-action.md) — Workflow documentation
- [ADR-015: Investigation Board](../../07-decisions/adr-015-investigation-board.md) — Architectural decisions
- [ADR-019: AI Integration](../../07-decisions/adr-019-ai-integration.md) — Knowledge base dependency
- [What-If Simulator](what-if-simulator.md) — Complementary improvement projection tool
- [Panels and Drawers](../patterns/panels-and-drawers.md) — Panel patterns
