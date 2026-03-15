# Hypothesis Investigation Flow: Diamond Pattern for Root Cause Analysis

**Date:** 2026-03-15
**Status:** Draft
**Scope:** Extend Hypothesis model with sub-hypotheses, validation types, tree view UI, and CoScout investigation integration
**Related:** Investigation Workflow Enhancement (2026-03-14), ADR-020, ADR-019 (AI Integration)

## Context

VariScout's hypothesis system (ADR-020) currently supports flat hypotheses linked to findings with auto-validation via eta-squared. But real-world root cause investigation follows a **diamond pattern**: start with a broad suspected cause, generate multiple sub-hypotheses (diverge), test each against the data (validate), then converge on the confirmed root cause.

The current flat model cannot represent this investigative reasoning. Analysts need to:

- Break a broad hypothesis ("Machine 5 is drifting") into testable sub-hypotheses ("worn nozzle", "temperature instability", "operator technique")
- Track which sub-hypotheses are supported vs contradicted by data
- Distinguish between data-validated hypotheses (eta-squared) and gemba/expert-validated ones (physical inspection, domain knowledge)
- See the investigation tree at a glance — what was tested, what remains

This enhancement adds the tree structure, validation types, and UI needed for structured investigation without imposing a heavyweight methodology.

### Goals

1. **Diamond investigation pattern** — Diverge (generate sub-hypotheses) then converge (eliminate contradicted, confirm supported)
2. **Multiple validation types** — Data validation (automatic eta-squared), gemba validation (go-and-see), expert validation (domain knowledge)
3. **Investigation tree view** — Visual hierarchy of hypotheses with status, validation type, and factor badges
4. **CoScout integration** — Phase-aware investigation prompts, uncovered factor suggestions
5. **Task tracking** — Gemba/expert validation tasks with completion flow

### Non-Goals

- Not a full decision tree builder
- No automated hypothesis generation (CoScout suggests, human decides)
- No cross-finding hypothesis sharing (each finding has its own tree)
- No version control on hypothesis trees

## The Diamond Pattern

Investigation follows a natural diamond shape:

```
                    ┌─── Root Hypothesis ───┐
                    │   "Machine 5 drift"    │
                    └────────┬───────────────┘
         ┌──────────────────┼──────────────────┐         DIVERGE
         ▼                  ▼                  ▼         (generate)
    ┌─────────┐      ┌─────────┐       ┌─────────┐
    │ Worn    │      │ Temp    │       │ Operator │
    │ nozzle  │      │ drift   │       │ variance │
    └────┬────┘      └────┬────┘       └────┬────┘
         │                │                  │               VALIDATE
    data: 47%        gemba: ✓          data: 3%             (test each)
    SUPPORTED        SUPPORTED         CONTRADICTED
         │                │                  │
         ▼                ▼                  ×               CONVERGE
    ┌─────────┐      ┌─────────┐                            (eliminate)
    │ ROOT    │      │ ROOT    │
    │ CAUSE   │      │ CAUSE   │
    │ HYPO    │      │ HYPO    │
    └─────────┘      └─────────┘
```

**Phases:**

1. **Initial** — Root hypothesis created, no children yet
2. **Diverging** — Sub-hypotheses being added (the "why" behind the root hypothesis)
3. **Validating** — Sub-hypotheses being tested (data checks, gemba tasks, expert reviews)
4. **Converging** — Some contradicted, some supported; root cause candidates emerging
5. **Acting** — Root cause hypothesis confirmed, corrective actions defined

Phase detection is automatic based on tree state (see CoScout Integration section).

## Data Model

### Hypothesis Extensions

```typescript
export interface Hypothesis {
  // ... existing fields (id, text, factorName, factorValue, status, createdAt) ...

  /** Parent hypothesis ID — null for root hypotheses */
  parentId: string | null;

  /** How this hypothesis was validated */
  validationType: 'data' | 'gemba' | 'expert';

  /** Description of the validation task (gemba/expert only) */
  validationTask?: string;

  /** Whether the validation task has been completed (gemba/expert only) */
  taskCompleted?: boolean;

  /** Free-text note explaining the validation result */
  manualNote?: string;
}
```

### Field Semantics

| Field            | Type                            | Default   | Description                                                       |
| ---------------- | ------------------------------- | --------- | ----------------------------------------------------------------- |
| `parentId`       | `string \| null`                | `null`    | Links sub-hypothesis to parent. Root hypotheses have `null`       |
| `validationType` | `'data' \| 'gemba' \| 'expert'` | `'data'`  | How validation is performed                                       |
| `validationTask` | `string \| undefined`           | undefined | "Check nozzle tip wear on Machine 5" — gemba/expert tasks only    |
| `taskCompleted`  | `boolean \| undefined`          | undefined | Whether the physical/expert check has been done                   |
| `manualNote`     | `string \| undefined`           | undefined | "Nozzle tip worn 0.3mm beyond tolerance" — human-entered evidence |

### Validation Types

| Type     | Icon    | Auto-Status | How Validated                                           |
| -------- | ------- | ----------- | ------------------------------------------------------- |
| `data`   | Chart   | Yes         | ANOVA eta-squared thresholds (existing auto-validation) |
| `gemba`  | Factory | No          | Physical inspection task — analyst goes and looks       |
| `expert` | User    | No          | Domain expert review — human judgment                   |

**Data validation** works exactly as today: link a factor, eta-squared thresholds determine status automatically (>= 15% supported, < 5% contradicted, 5-15% partial).

**Gemba validation** requires a task description and manual completion. The analyst defines what to check ("Inspect nozzle tip on Machine 5"), goes to the shop floor, completes the task, and sets the status manually with a note.

**Expert validation** is similar to gemba but for domain knowledge rather than physical inspection. The analyst consults a subject matter expert and records the conclusion.

### Tree Constraints

To prevent runaway complexity:

| Constraint   | Limit | Rationale                                            |
| ------------ | ----- | ---------------------------------------------------- |
| Max depth    | 3     | Root → child → grandchild. Deeper = overthinking     |
| Max children | 8     | Per parent node. More than 8 = decompose differently |
| Max total    | 30    | Per finding. Hard cap on total hypothesis count      |

Constraints are validated in `useHypotheses` — attempts to exceed limits return a user-facing error message without creating the hypothesis.

### Status Propagation

Status flows **upward** in the tree:

| Child States                       | Parent Auto-Status            |
| ---------------------------------- | ----------------------------- |
| All children contradicted          | Parent becomes `contradicted` |
| Any child supported, none untested | Parent becomes `supported`    |
| Mix of supported and contradicted  | Parent stays `partial`        |
| Any child untested                 | Parent stays current status   |

**Rules:**

- Propagation only fires when all children have been tested (no untested children remain)
- Manual override is always possible (analyst can force parent status)
- Leaf nodes follow their own validation rules (data = auto, gemba/expert = manual)
- Status propagation is computed, not stored — derived from children's statuses in `useHypotheses`

### Root Cause Hypothesis Terminology

The journey from hypothesis to confirmed root cause follows deliberate terminology:

| Stage                      | Term                      | Meaning                                           |
| -------------------------- | ------------------------- | ------------------------------------------------- |
| Created                    | **Hypothesis**            | Testable theory about cause                       |
| Data/gemba/expert supports | **Supported Hypothesis**  | Evidence supports this theory                     |
| Tree converges on it       | **Root Cause Hypothesis** | Best-supported theory after diamond investigation |
| Corrective action works    | **Confirmed Root Cause**  | Outcome = effective proves the theory was correct |

VariScout never auto-labels a hypothesis as "root cause" — the analyst explicitly promotes a supported hypothesis to root cause hypothesis status when they are confident enough to act on it. Confirmed root cause only happens at the "Resolved" finding status when the outcome assessment shows the fix was effective.

## UI Architecture

### HypothesisTreeView

Replaces the flat hypothesis section in FindingCard / FindingDetailPanel when the finding has hypotheses with `parentId` relationships.

**Location:** `packages/ui/src/components/FindingsLog/HypothesisTreeView.tsx`

```typescript
interface HypothesisTreeViewProps {
  hypotheses: Hypothesis[];
  findingId: string;
  onCreateChild: (parentId: string) => void;
  onUpdateStatus: (id: string, status: HypothesisStatus) => void;
  onSetValidationType: (id: string, type: ValidationType) => void;
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

**Layout:**

```
┌──────────────────────────────────────────────┐
│  Hypotheses                          [+ Add] │
│                                              │
│  ● Machine 5 is causing drift        [data]  │
│    ├── ● Worn nozzle tip           [gemba]   │
│    │     Task: Check nozzle wear   [✓ Done]  │
│    │     "Worn 0.3mm beyond spec"            │
│    ├── ● Temperature instability     [data]  │
│    │     Factor: Temperature  η²=23%         │
│    │     ⤷ 2 children (1 supported)          │
│    └── ✗ Operator technique variance [data]  │
│          Factor: Operator  η²=3%             │
│                                              │
│  Progress: 2/3 tested · 1 contradicted       │
└──────────────────────────────────────────────┘
```

### HypothesisNode

Individual tree node component.

**Location:** `packages/ui/src/components/FindingsLog/HypothesisNode.tsx`

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
  onSetValidationType: (type: ValidationType) => void;
  onSetTask: (task: string) => void;
  onCompleteTask: () => void;
  onSetNote: (note: string) => void;
  onDelete: () => void;
  canAddChild: boolean; // false when at max depth or max children
  colorScheme?: HypothesisNodeColorScheme;
}
```

**Rendering spec:**

| Element              | Spec                                                                    |
| -------------------- | ----------------------------------------------------------------------- |
| Indentation          | `depth * 24px` left padding. Tree lines use `border-l` with connector   |
| Status dot           | Same colors as FindingStatusBadge (amber/blue/purple/green/red)         |
| Hypothesis text      | Editable inline text. Bold for root, normal for children                |
| Factor badge         | Blue pill showing linked factor name + eta-squared %                    |
| Validation type icon | Chart (data), Factory (gemba), User (expert) — 16px, after text         |
| Task row             | Indented below node. Shows task description + completion checkbox       |
| Manual note          | Indented below task. Italic text in `text-content-secondary`            |
| Children summary     | "N children (M supported)" — collapsed indicator when node has children |
| Contradicted styling | `opacity-50` + `line-through` on hypothesis text                        |
| Add child button     | Small "+" icon at end of node row. Hidden when `canAddChild` is false   |

### Tree View Mode in FindingsLog

FindingsLog gains a third view mode:

| Mode  | Icon      | Layout                                       |
| ----- | --------- | -------------------------------------------- |
| List  | List      | Scrollable cards (existing)                  |
| Board | Columns   | Status columns with drag-and-drop (existing) |
| Tree  | GitBranch | Hypothesis tree per finding (new)            |

Tree view shows one finding at a time (selected finding) with its full hypothesis tree expanded. Navigate between findings with prev/next arrows above the tree.

### Popout Window Enhancements

The FindingsWindow popout gains two additions:

**1. Problem Brief Header**

When `processContext.problemStatement` is set, a compact header appears at the top of the popout:

```
┌──────────────────────────────────────────────────────┐
│  Problem: Fill weight variation exceeds ±2g spec     │
│  Target: Cpk ≥ 1.33 (currently 0.85)     [Edit]    │
└──────────────────────────────────────────────────────┘
```

- Shows `problemStatement` + `targetMetric`/`targetValue`
- "Edit" link opens brief in settings/column mapping
- Collapsible — remembers state in ViewState

**2. CoScout Sidebar**

A collapsible sidebar on the right edge of the popout window:

```
┌──────────────────────────────┬────────────────┐
│                              │  CoScout       │
│  Findings / Board / Tree     │                │
│                              │  Phase:        │
│                              │  Diverging     │
│                              │                │
│                              │  Suggestions:  │
│                              │  "Have you     │
│                              │   checked      │
│                              │   Material?"   │
│                              │                │
│                              │  [Ask CoScout] │
│                              │                │
└──────────────────────────────┴────────────────┘
```

- Width: 280px fixed, collapsible to 0
- Shows current investigation phase (auto-detected)
- Lists uncovered factor role suggestions
- "Ask CoScout" opens full conversation with investigation context pre-loaded
- Only visible when AI endpoint is configured

## CoScout Integration

### Phase Detection

CoScout detects the investigation phase from hypothesis tree state:

```typescript
type InvestigationPhase = 'initial' | 'diverging' | 'validating' | 'converging' | 'acting';

function detectInvestigationPhase(hypotheses: Hypothesis[]): InvestigationPhase {
  if (hypotheses.length === 0) return 'initial';

  const roots = hypotheses.filter(h => h.parentId === null);
  const children = hypotheses.filter(h => h.parentId !== null);

  if (children.length === 0) return 'initial';

  const tested = children.filter(h => h.status !== 'untested');
  const untested = children.filter(h => h.status === 'untested');

  if (untested.length > tested.length) return 'diverging';
  if (untested.length > 0) return 'validating';

  const supported = children.filter(h => h.status === 'supported');
  if (supported.length > 0 && supported.length < children.length) return 'converging';

  return 'acting';
}
```

### Phase-Aware Suggested Questions

| Phase      | Example Questions                                                    |
| ---------- | -------------------------------------------------------------------- |
| Initial    | "What are the most likely causes of [problem]?"                      |
| Diverging  | "What other factors could explain [root hypothesis]?"                |
| Validating | "How can I validate [untested hypothesis] on the shop floor?"        |
| Converging | "Which of these supported hypotheses is most likely the root cause?" |
| Acting     | "What corrective actions are effective for [root cause hypothesis]?" |

### Uncovered Factor Role Suggestions

CoScout checks which `FactorRole` categories have been covered by hypotheses and suggests uncovered ones:

```
Factors not yet investigated:
- Material (no hypothesis covers material-related factors)
- Location (no hypothesis covers location-related factors)

Consider: "Could raw material batch variation explain the drift?"
```

This uses the `factorRoles` from `ProcessContext` — if the analyst has equipment and temporal hypotheses but no material hypothesis, CoScout nudges them to consider material.

### Diverge Assistant

During the diverge phase, CoScout can suggest sub-hypotheses based on:

1. The root hypothesis text
2. Available factors in the dataset that are not yet linked to any hypothesis
3. Factor roles (equipment, temporal, operator, material, location)
4. Process description from ProcessContext

Suggestions are presented as clickable chips that create a new sub-hypothesis when tapped. The analyst always decides — CoScout never auto-creates hypotheses.

## Platform Scope

| Capability                    | PWA (Free)        | Azure Standard                | Azure Team                          |
| ----------------------------- | ----------------- | ----------------------------- | ----------------------------------- |
| Hypothesis per finding        | 1 (flat, no tree) | Tree (max depth 3, max 30)    | Tree (max depth 3, max 30)          |
| Validation types              | Data only (auto)  | Data + gemba + expert         | Data + gemba + expert               |
| Gemba/expert tasks            | -                 | Task description + completion | + assignee (people picker)          |
| HypothesisTreeView            | -                 | Full tree view                | Full tree view                      |
| Tree view mode in FindingsLog | -                 | Yes                           | Yes                                 |
| Problem brief header          | -                 | Yes                           | Yes                                 |
| CoScout sidebar               | -                 | Yes (when AI configured)      | Yes (when AI configured)            |
| Phase detection               | -                 | Yes                           | Yes                                 |
| Uncovered factor suggestions  | -                 | Yes                           | Yes                                 |
| Max hypotheses per finding    | 5                 | 30                            | 30                                  |
| Teams posting on convergence  | -                 | -                             | Auto-post when tree converges       |
| Task assignment               | -                 | -                             | People picker on gemba/expert tasks |

**PWA rationale:** The PWA is a training tool. A single auto-validated hypothesis per finding teaches the concept without the complexity of tree investigation. Students learn to link hypothesis to factor and see eta-squared validation — that is the pedagogical value.

## Incremental Delivery Plan

### Increment 0: Documentation & Design (this document)

- Write design spec (this file)
- Write feature documentation
- Update ADR-020 with decisions 8-12
- Update component specs (findings.md, ai-components.md)
- Update feature parity matrix
- Update CLAUDE.md key files and task mapping

### Increment 1: Data Model & Hook Extensions

- Add `parentId`, `validationType`, `validationTask`, `taskCompleted`, `manualNote` to Hypothesis type
- Update `createHypothesis()` factory with new fields
- Extend `useHypotheses` with tree operations (addChild, setValidationType, setTask, completeTask, setNote)
- Add tree constraint validation (max depth, max children, max total)
- Add status propagation computation
- Add `detectInvestigationPhase()` utility
- Unit tests for all new logic

### Increment 2: HypothesisTreeView & HypothesisNode Components

- Build `HypothesisTreeView` component with indented tree layout
- Build `HypothesisNode` component with status dots, factor badges, validation type icons
- Contradicted node styling (opacity, strikethrough)
- Collapsible children with summary indicator
- Add tree view mode toggle to FindingsLog
- Component tests

### Increment 3: Popout Window Enhancements

- Problem brief header in FindingsWindow
- CoScout sidebar layout (collapsible)
- Wire sidebar to existing CoScout conversation
- Investigation phase display

### Increment 4: CoScout Investigation Integration

- Phase detection in `buildAIContext`
- Phase-aware suggested questions in `suggestedQuestions.ts`
- Uncovered factor role suggestions
- Diverge assistant (sub-hypothesis suggestion chips)

### Increment 5: Azure App Wiring

- Wire HypothesisTreeView into Azure FindingsPanel/FindingDetailPanel
- Gemba/expert task completion flow in Azure Editor
- Progress indicator in tree header
- ViewState persistence for tree expansion state

### Increment 6: Teams Integration (Team plan)

- Auto-post when hypothesis tree converges (all children tested)
- Include root cause hypothesis summary in Teams message
- Task assignment people picker on gemba/expert tasks (Team plan)

## Key Files

| File                                                            | Change                                                 |
| --------------------------------------------------------------- | ------------------------------------------------------ |
| `packages/core/src/findings.ts`                                 | Hypothesis type extensions, createHypothesis() updates |
| `packages/core/src/ai/types.ts`                                 | InvestigationPhase type                                |
| `packages/core/src/ai/buildAIContext.ts`                        | Phase detection, uncovered factors                     |
| `packages/core/src/ai/suggestedQuestions.ts`                    | Phase-aware investigation questions                    |
| `packages/hooks/src/useHypotheses.ts`                           | Tree operations, constraints, status propagation       |
| `packages/ui/src/components/FindingsLog/HypothesisTreeView.tsx` | New — tree view component                              |
| `packages/ui/src/components/FindingsLog/HypothesisNode.tsx`     | New — individual tree node component                   |
| `packages/ui/src/components/FindingsLog/FindingsLog.tsx`        | Tree view mode toggle                                  |
| `packages/ui/src/components/FindingsLog/FindingsWindow.tsx`     | Problem brief header, CoScout sidebar                  |
| `apps/azure/src/components/Editor.tsx`                          | Wire tree operations                                   |
| `apps/azure/src/teams/`                                         | Convergence auto-posting (Team plan)                   |

## Testing

| Component             | Tests                                                                     |
| --------------------- | ------------------------------------------------------------------------- |
| Hypothesis tree model | Unit tests for parentId linking, depth computation, constraint validation |
| Status propagation    | Unit tests for upward propagation rules                                   |
| Phase detection       | Unit tests for each phase condition                                       |
| HypothesisTreeView    | Component tests for tree rendering, indentation, expand/collapse          |
| HypothesisNode        | Component tests for each validation type, contradicted styling            |
| Gemba task flow       | Component tests for task creation, completion, note entry                 |
| CoScout investigation | Unit tests for phase-aware questions, uncovered factor suggestions        |
| E2E                   | Full diamond pattern: create root → diverge → validate → converge         |

## Open Questions

1. **Should contradicted branches be auto-collapsed?** Current design: no, they remain visible (with dimmed styling) so the analyst can see what was ruled out. But for large trees, auto-collapse might reduce noise.

2. **Should gemba tasks have due dates?** Current design: no, keeping it simple. Tasks are yes/no completion. Due dates add complexity better handled by external task management tools.

3. **Should hypothesis text be editable after creation?** Current design: yes, inline editable. This mirrors FindingCard behavior.
