# Investigation Wall Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the hypothesis-centric Investigation Wall as a view toggle inside the Investigation workspace, preserving ADR-066 (Evidence Map remains default) and delivering the full-vision design from `docs/superpowers/specs/2026-04-19-investigation-wall-design.md`.

**Architecture:** New sibling primitive `packages/charts/src/InvestigationWall/` next to `EvidenceMap/`, mounted via a `Map | Wall` toggle in Investigation. Three optional persisted schema additions on `SuspectedCause` (`condition?`, `tributaryIds?`, `comments?`) and one on `investigationStore` (`problemContributionTree?`). New UI-only feature store `wallLayoutStore` with IndexedDB persistence. Zero enum migrations. Two new CoScout tools (`critique_investigation_state` read, `propose_hypothesis_from_finding` action).

**Tech Stack:** TypeScript, Zustand, React + SVG (switches to WebGL at >50 nodes), Vitest + React Testing Library, Playwright for E2E, Server-Sent Events via Express (reusing ADR-061's pattern), IndexedDB via Dexie.

**Phase checkpoints:** Pause for human review at each `─── PHASE N COMPLETE ───` marker before continuing. Phases ship independently and each keeps the test suite green.

---

## File structure

### Create

| Path                                                                        | Responsibility                                                                                                    |
| --------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `packages/core/src/findings/hypothesisCondition.ts`                         | Pure types + `deriveConditionFromFindingSource` + small helpers                                                   |
| `packages/core/src/findings/hypothesisConditionEvaluator.ts`                | `evaluateCondition(cond, row)`, `runAndCheck(tree, hubs, rows)`                                                   |
| `packages/core/src/findings/__tests__/hypothesisCondition.test.ts`          | Tests for types + derivation                                                                                      |
| `packages/core/src/findings/__tests__/hypothesisConditionEvaluator.test.ts` | Tests for evaluator + AND-check                                                                                   |
| `packages/core/src/ai/actions/proposeDisconfirmationMove.ts`                | Complementary-brush heuristic                                                                                     |
| `packages/core/src/ai/actions/__tests__/proposeDisconfirmationMove.test.ts` | Tests for the heuristic                                                                                           |
| `packages/core/src/ai/actions/critiqueInvestigationState.ts`                | Aggregates gaps for CoScout critique tool                                                                         |
| `packages/core/src/ai/actions/__tests__/critiqueInvestigationState.test.ts` | Tests for critique aggregation                                                                                    |
| `packages/stores/src/wallLayoutStore.ts`                                    | New Zustand feature store (UI state) with Dexie persistence                                                       |
| `packages/stores/src/__tests__/wallLayoutStore.test.ts`                     | Tests for rehydration, undo/redo, SSE offline queue                                                               |
| `packages/stores/src/wallSelectors.ts`                                      | `selectHubCommentStream`, `selectHypothesisTributaries`, `selectOpenQuestionsWithoutHub`, `selectQuestionsForHub` |
| `packages/stores/src/__tests__/wallSelectors.test.ts`                       | Selector tests                                                                                                    |
| `packages/core/src/ai/prompts/coScout/tier2/investigationDiscipline.ts`     | Tier 2 coaching prompt text                                                                                       |
| `packages/charts/src/InvestigationWall/index.ts`                            | Barrel export                                                                                                     |
| `packages/charts/src/InvestigationWall/WallCanvas.tsx`                      | Top-level SVG canvas with pan/zoom                                                                                |
| `packages/charts/src/InvestigationWall/ProblemConditionCard.tsx`            | Problem condition rect at top                                                                                     |
| `packages/charts/src/InvestigationWall/HypothesisCard.tsx`                  | Hub card with embedded mini-chart                                                                                 |
| `packages/charts/src/InvestigationWall/QuestionPill.tsx`                    | Open-question pill node                                                                                           |
| `packages/charts/src/InvestigationWall/FindingChip.tsx`                     | Finding chip (tethered to hub)                                                                                    |
| `packages/charts/src/InvestigationWall/GateBadge.tsx`                       | AND/OR/NOT gate glyph with HOLDS badge                                                                            |
| `packages/charts/src/InvestigationWall/NarratorRail.tsx`                    | Single evolving rail (coach → CoScout → collab)                                                                   |
| `packages/charts/src/InvestigationWall/TributaryFooter.tsx`                 | Tributary chip row                                                                                                |
| `packages/charts/src/InvestigationWall/MissingEvidenceDigest.tsx`           | Bottom digest bar (collapsed by default)                                                                          |
| `packages/charts/src/InvestigationWall/EmptyState.tsx`                      | Three-CTA empty state                                                                                             |
| `packages/charts/src/InvestigationWall/MobileCardList.tsx`                  | Mobile/tablet list rendering                                                                                      |
| `packages/charts/src/InvestigationWall/Minimap.tsx`                         | Floating 160×100 minimap                                                                                          |
| `packages/charts/src/InvestigationWall/SearchPalette.tsx`                   | `⌘K` search                                                                                                       |
| `packages/charts/src/InvestigationWall/ContextMenu.tsx`                     | Right-click menu primitive                                                                                        |
| `packages/charts/src/InvestigationWall/hooks/useWallKeyboard.ts`            | Keyboard shortcut wiring                                                                                          |
| `packages/charts/src/InvestigationWall/hooks/useWallDragDrop.ts`            | dnd-kit composition                                                                                               |
| `packages/charts/src/InvestigationWall/__tests__/*.test.tsx`                | Per-component RTL tests                                                                                           |
| `apps/pwa/e2e/wall.spec.ts`                                                 | Playwright E2E full flow                                                                                          |

### Modify

| Path                                                            | Change                                                                  |
| --------------------------------------------------------------- | ----------------------------------------------------------------------- |
| `packages/core/src/findings/types.ts`                           | Add `HypothesisCondition` union + 3 optional fields on `SuspectedCause` |
| `packages/core/src/index.ts`                                    | Re-export new types                                                     |
| `packages/core/src/ai/prompts/coScout/tools/registry.ts`        | Add 2 new tool entries                                                  |
| `packages/core/src/ai/prompts/coScout/tier2/index.ts`           | Wire in `investigationDiscipline` module                                |
| `packages/core/src/i18n/messages/en.ts`                         | Add `wall` catalog                                                      |
| `packages/core/src/i18n/messages/*.ts` (other locales)          | Add `wall` catalog (English fallback)                                   |
| `packages/stores/src/investigationStore.ts`                     | Add `problemContributionTree?: GateNode` + actions                      |
| `packages/stores/src/index.ts`                                  | Export `wallLayoutStore`, selectors                                     |
| `apps/azure/src/components/editor/InvestigationWorkspace.tsx`   | Add Map/Wall toggle, mount `WallCanvas` when active                     |
| `apps/pwa/src/components/views/InvestigationView.tsx`           | Same toggle in PWA                                                      |
| `apps/azure/src/server/routes/brainstorm.ts` (or equivalent)    | Extend SSE pattern for hub comments                                     |
| `packages/ui/src/components/FindingsLog/QuestionLinkPrompt.tsx` | Add "Propose new hypothesis from this finding" option when Wall active  |

---

## ─── PHASE 1: Types & core schema additions ───

### Task 1.1: Define `HypothesisCondition` types

**Files:**

- Create: `packages/core/src/findings/hypothesisCondition.ts`
- Test: `packages/core/src/findings/__tests__/hypothesisCondition.test.ts`

- [ ] **Step 1: Write the failing test**

Create `packages/core/src/findings/__tests__/hypothesisCondition.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import type { HypothesisCondition } from '../hypothesisCondition';

describe('HypothesisCondition type', () => {
  it('allows a leaf with eq comparison', () => {
    const cond: HypothesisCondition = {
      kind: 'leaf',
      column: 'SHIFT',
      op: 'eq',
      value: 'night',
    };
    expect(cond.kind).toBe('leaf');
  });

  it('allows an AND branch with nested leaves', () => {
    const cond: HypothesisCondition = {
      kind: 'and',
      children: [
        { kind: 'leaf', column: 'SHIFT', op: 'eq', value: 'night' },
        { kind: 'leaf', column: 'NOZZLE.TEMP', op: 'gt', value: 120 },
      ],
    };
    expect(cond.kind).toBe('and');
    expect(cond.kind === 'and' ? cond.children.length : 0).toBe(2);
  });

  it('allows OR and NOT branches', () => {
    const or: HypothesisCondition = {
      kind: 'or',
      children: [{ kind: 'leaf', column: 'X', op: 'eq', value: 1 }],
    };
    const not: HypothesisCondition = {
      kind: 'not',
      children: [{ kind: 'leaf', column: 'X', op: 'eq', value: 1 }],
    };
    expect(or.kind).toBe('or');
    expect(not.kind).toBe('not');
  });

  it('allows between comparison with tuple value', () => {
    const cond: HypothesisCondition = {
      kind: 'leaf',
      column: 'TEMP',
      op: 'between',
      value: [100, 200],
    };
    expect(cond.kind).toBe('leaf');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @variscout/core test -- --run hypothesisCondition.test`
Expected: FAIL — `Cannot find module '../hypothesisCondition'`

- [ ] **Step 3: Write minimal implementation**

Create `packages/core/src/findings/hypothesisCondition.ts`:

```ts
/**
 * Predicate tree that can be evaluated against a data row.
 *
 * Used by Investigation Wall hub `SuspectedCause.condition` to turn a hypothesis
 * into a disconfirmable claim — auto-derived from a finding's source on first
 * hub creation; editable afterwards.
 *
 * See: docs/superpowers/specs/2026-04-19-investigation-wall-design.md
 */

export type ComparisonOp = 'eq' | 'neq' | 'lt' | 'lte' | 'gt' | 'gte' | 'between' | 'in';

export interface ConditionLeaf {
  kind: 'leaf';
  column: string;
  op: ComparisonOp;
  value: string | number | [number, number] | string[];
}

export interface ConditionBranch {
  kind: 'and' | 'or' | 'not';
  children: HypothesisCondition[];
}

export type HypothesisCondition = ConditionLeaf | ConditionBranch;
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @variscout/core test -- --run hypothesisCondition.test`
Expected: PASS — 4 tests green.

- [ ] **Step 5: Commit**

```bash
git add packages/core/src/findings/hypothesisCondition.ts packages/core/src/findings/__tests__/hypothesisCondition.test.ts
git commit -m "feat(wall): add HypothesisCondition predicate types"
```

### Task 1.2: Add `deriveConditionFromFindingSource`

**Files:**

- Modify: `packages/core/src/findings/hypothesisCondition.ts`
- Modify: `packages/core/src/findings/__tests__/hypothesisCondition.test.ts`

- [ ] **Step 1: Add failing derivation tests**

Append to `packages/core/src/findings/__tests__/hypothesisCondition.test.ts`:

```ts
import { deriveConditionFromFindingSource } from '../hypothesisCondition';
import type { FindingSource } from '../types';

describe('deriveConditionFromFindingSource', () => {
  it('derives eq leaf from boxplot category', () => {
    const source: FindingSource = { chart: 'boxplot', category: 'night' };
    const result = deriveConditionFromFindingSource(source, { groupColumn: 'SHIFT' });
    expect(result).toEqual({ kind: 'leaf', column: 'SHIFT', op: 'eq', value: 'night' });
  });

  it('derives eq leaf from pareto category', () => {
    const source: FindingSource = { chart: 'pareto', category: 'SupplierB' };
    const result = deriveConditionFromFindingSource(source, { dimensionColumn: 'SUPPLIER' });
    expect(result).toEqual({ kind: 'leaf', column: 'SUPPLIER', op: 'eq', value: 'SupplierB' });
  });

  it('derives gte leaf from ichart anchor', () => {
    const source: FindingSource = { chart: 'ichart', anchorX: 10, anchorY: 120 };
    const result = deriveConditionFromFindingSource(source, { metricColumn: 'NOZZLE.TEMP' });
    expect(result).toEqual({ kind: 'leaf', column: 'NOZZLE.TEMP', op: 'gte', value: 120 });
  });

  it('derives between leaf from probability plot', () => {
    const source: FindingSource = { chart: 'probability', anchorX: 10, anchorY: 100 };
    const result = deriveConditionFromFindingSource(source, {
      metricColumn: 'FILL',
      anchorYMax: 110,
    });
    expect(result).toEqual({ kind: 'leaf', column: 'FILL', op: 'between', value: [100, 110] });
  });

  it('derives eq leaf from yamazumi activity', () => {
    const source: FindingSource = { chart: 'yamazumi', category: 'Bending' };
    const result = deriveConditionFromFindingSource(source, { activityColumn: 'ACTIVITY' });
    expect(result).toEqual({ kind: 'leaf', column: 'ACTIVITY', op: 'eq', value: 'Bending' });
  });

  it('returns undefined for coscout findings', () => {
    const source: FindingSource = { chart: 'coscout', messageId: 'abc123' };
    const result = deriveConditionFromFindingSource(source, {});
    expect(result).toBeUndefined();
  });

  it('returns undefined when no columnHint is provided for a boxplot', () => {
    const source: FindingSource = { chart: 'boxplot', category: 'night' };
    const result = deriveConditionFromFindingSource(source, {});
    expect(result).toBeUndefined();
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `pnpm --filter @variscout/core test -- --run hypothesisCondition.test`
Expected: FAIL — `deriveConditionFromFindingSource is not a function`.

- [ ] **Step 3: Implement derivation**

Append to `packages/core/src/findings/hypothesisCondition.ts`:

```ts
import type { FindingSource } from './types';

/** Column hints resolved by the caller from chart state at brush time. */
export interface FindingSourceColumnHints {
  /** The grouping column for boxplot (x-axis column). */
  groupColumn?: string;
  /** The dimension column for pareto (x-axis column). */
  dimensionColumn?: string;
  /** The activity column for yamazumi. */
  activityColumn?: string;
  /** The metric column (y-axis) for ichart / probability plot. */
  metricColumn?: string;
  /** Upper anchor for probability-plot between ranges. */
  anchorYMax?: number;
}

/**
 * Derive a one-leaf condition from a finding's chart source, given column hints
 * resolved from the chart state at brush time. Returns undefined for CoScout
 * findings (no brush) or when the required column hint is missing.
 */
export function deriveConditionFromFindingSource(
  source: FindingSource,
  hints: FindingSourceColumnHints
): HypothesisCondition | undefined {
  switch (source.chart) {
    case 'boxplot':
      if (!hints.groupColumn) return undefined;
      return { kind: 'leaf', column: hints.groupColumn, op: 'eq', value: source.category };
    case 'pareto':
      if (!hints.dimensionColumn) return undefined;
      return { kind: 'leaf', column: hints.dimensionColumn, op: 'eq', value: source.category };
    case 'yamazumi':
      if (!hints.activityColumn) return undefined;
      return { kind: 'leaf', column: hints.activityColumn, op: 'eq', value: source.category };
    case 'ichart':
      if (!hints.metricColumn) return undefined;
      return { kind: 'leaf', column: hints.metricColumn, op: 'gte', value: source.anchorY };
    case 'probability':
      if (!hints.metricColumn || hints.anchorYMax === undefined) return undefined;
      return {
        kind: 'leaf',
        column: hints.metricColumn,
        op: 'between',
        value: [source.anchorY, hints.anchorYMax],
      };
    case 'coscout':
      return undefined;
  }
}
```

- [ ] **Step 4: Run test to verify pass**

Run: `pnpm --filter @variscout/core test -- --run hypothesisCondition.test`
Expected: PASS — 11 tests green.

- [ ] **Step 5: Commit**

```bash
git add packages/core/src/findings/hypothesisCondition.ts packages/core/src/findings/__tests__/hypothesisCondition.test.ts
git commit -m "feat(wall): derive HypothesisCondition from finding source"
```

### Task 1.3: Extend `SuspectedCause` with optional fields

**Files:**

- Modify: `packages/core/src/findings/types.ts:634-654`
- Modify: `packages/core/src/findings/__tests__/suspectedCause.test.ts`

- [ ] **Step 1: Add failing test for new optional fields**

Append to `packages/core/src/findings/__tests__/suspectedCause.test.ts` (create if needed):

```ts
import { describe, it, expect } from 'vitest';
import type { SuspectedCause, FindingComment } from '../types';
import type { HypothesisCondition } from '../hypothesisCondition';

describe('SuspectedCause optional Wall fields', () => {
  it('accepts an undefined condition (default for existing hubs)', () => {
    const hub: SuspectedCause = {
      id: 'hub-1',
      name: 'Nozzle runs hot',
      synthesis: '',
      questionIds: [],
      findingIds: [],
      status: 'suspected',
      createdAt: '2026-04-19T00:00:00.000Z',
      updatedAt: '2026-04-19T00:00:00.000Z',
    };
    expect(hub.condition).toBeUndefined();
  });

  it('accepts a condition predicate tree', () => {
    const condition: HypothesisCondition = {
      kind: 'and',
      children: [
        { kind: 'leaf', column: 'SHIFT', op: 'eq', value: 'night' },
        { kind: 'leaf', column: 'NOZZLE.TEMP', op: 'gt', value: 120 },
      ],
    };
    const hub: SuspectedCause = {
      id: 'hub-2',
      name: 'Hot nozzle night shift',
      synthesis: '',
      questionIds: [],
      findingIds: [],
      status: 'suspected',
      condition,
      createdAt: '2026-04-19T00:00:00.000Z',
      updatedAt: '2026-04-19T00:00:00.000Z',
    };
    expect(hub.condition?.kind).toBe('and');
  });

  it('accepts tributaryIds and comments', () => {
    const comment: FindingComment = {
      id: 'c-1',
      text: 'H1 looks tight',
      createdAt: Date.now(),
    };
    const hub: SuspectedCause = {
      id: 'hub-3',
      name: 'Low viscosity',
      synthesis: '',
      questionIds: [],
      findingIds: [],
      status: 'suspected',
      tributaryIds: ['trib-123'],
      comments: [comment],
      createdAt: '2026-04-19T00:00:00.000Z',
      updatedAt: '2026-04-19T00:00:00.000Z',
    };
    expect(hub.tributaryIds).toEqual(['trib-123']);
    expect(hub.comments?.length).toBe(1);
  });
});
```

- [ ] **Step 2: Run test to verify failure**

Run: `pnpm --filter @variscout/core test -- --run suspectedCause.test`
Expected: FAIL — TypeScript error: Property 'condition' / 'tributaryIds' / 'comments' does not exist on type 'SuspectedCause'.

- [ ] **Step 3: Extend `SuspectedCause` interface**

In `packages/core/src/findings/types.ts`, modify the `SuspectedCause` interface (around lines 634-654). Replace:

```ts
export interface SuspectedCause {
  id: string;
  name: string;
  synthesis: string;
  questionIds: string[];
  findingIds: string[];
  evidence?: SuspectedCauseEvidence;
  selectedForImprovement?: boolean;
  status: 'suspected' | 'confirmed' | 'not-confirmed';
  createdAt: string;
  updatedAt: string;
}
```

With:

```ts
import type { HypothesisCondition } from './hypothesisCondition';

export interface SuspectedCause {
  id: string;
  name: string;
  synthesis: string;
  questionIds: string[];
  findingIds: string[];
  evidence?: SuspectedCauseEvidence;
  selectedForImprovement?: boolean;
  status: 'suspected' | 'confirmed' | 'not-confirmed';
  /** Predicate tree used by the Investigation Wall to evaluate HOLDS X/Y.
   * Auto-derived from the first finding's `findingSource` on creation; analyst-editable.
   * Absent for hubs created before Wall ships. */
  condition?: HypothesisCondition;
  /** Explicit ProcessMap binding. Falls back to column-matching derivation via
   * findings' columns when absent. */
  tributaryIds?: string[];
  /** Timestamped hypothesis-level team discussion. Same shape as FindingComment. */
  comments?: FindingComment[];
  createdAt: string;
  updatedAt: string;
}
```

- [ ] **Step 4: Run test to verify pass**

Run: `pnpm --filter @variscout/core test -- --run suspectedCause.test`
Expected: PASS — 3 new tests green.

- [ ] **Step 5: Run the full core test suite to verify no regressions**

Run: `pnpm --filter @variscout/core test`
Expected: all existing tests still pass.

- [ ] **Step 6: Commit**

```bash
git add packages/core/src/findings/types.ts packages/core/src/findings/__tests__/suspectedCause.test.ts
git commit -m "feat(wall): add optional Wall fields to SuspectedCause"
```

### Task 1.4: Define `GateNode` and extend `investigationStore`

**Files:**

- Modify: `packages/core/src/findings/types.ts` (add `GateNode`)
- Modify: `packages/stores/src/investigationStore.ts` (add `problemContributionTree`)
- Test: `packages/stores/src/__tests__/investigationStore.test.ts`

- [ ] **Step 1: Add failing test**

Append to `packages/stores/src/__tests__/investigationStore.test.ts`:

```ts
import { useInvestigationStore } from '../investigationStore';
import type { GateNode } from '@variscout/core';

describe('problemContributionTree', () => {
  beforeEach(() => {
    useInvestigationStore.setState(useInvestigationStore.getInitialState());
  });

  it('defaults to undefined', () => {
    expect(useInvestigationStore.getState().problemContributionTree).toBeUndefined();
  });

  it('can be set to a gate tree with hub leaves', () => {
    const tree: GateNode = {
      kind: 'and',
      children: [
        { kind: 'hub', hubId: 'h1' },
        { kind: 'hub', hubId: 'h2' },
      ],
    };
    useInvestigationStore.getState().setProblemContributionTree(tree);
    expect(useInvestigationStore.getState().problemContributionTree).toEqual(tree);
  });

  it('can be cleared by setting undefined', () => {
    useInvestigationStore.getState().setProblemContributionTree({ kind: 'hub', hubId: 'h1' });
    useInvestigationStore.getState().setProblemContributionTree(undefined);
    expect(useInvestigationStore.getState().problemContributionTree).toBeUndefined();
  });
});
```

- [ ] **Step 2: Run test to verify failure**

Run: `pnpm --filter @variscout/stores test -- --run investigationStore.test`
Expected: FAIL — `setProblemContributionTree is not a function`, `Cannot find export 'GateNode'`.

- [ ] **Step 3: Define `GateNode`**

Append to `packages/core/src/findings/types.ts`:

```ts
/**
 * Composition tree for the Investigation Wall. Leaves reference `SuspectedCause`
 * hubs; branches compose them with boolean gates (AND / OR / NOT). Persisted on
 * `investigationStore.problemContributionTree` so team-authored root-cause stories
 * survive reload. Terminology: "contribution tree", never "root cause" (P5 amended).
 */
export type GateNode =
  | { kind: 'hub'; hubId: string }
  | { kind: 'and' | 'or' | 'not'; children: GateNode[] };
```

Also export it from the barrel: in `packages/core/src/index.ts`, add `export type { GateNode } from './findings/types';`.

- [ ] **Step 4: Extend `investigationStore`**

In `packages/stores/src/investigationStore.ts`, find `InvestigationState` and add the field:

```ts
export interface InvestigationState {
  findings: Finding[];
  questions: Question[];
  suspectedCauses: SuspectedCause[];
  causalLinks: CausalLink[];
  categories: InvestigationCategory[];
  focusedQuestionId: string | null;
  problemContributionTree?: GateNode;
}
```

Find `InvestigationActions` and add the setter:

```ts
export interface InvestigationActions {
  // ...existing...
  setProblemContributionTree: (tree: GateNode | undefined) => void;
}
```

Import `GateNode` at the top:

```ts
import type {
  // ...existing imports...
  GateNode,
} from '@variscout/core';
```

In the `create(...)` call, add to initial state (inside the create callback):

```ts
problemContributionTree: undefined,
```

And add the action implementation:

```ts
setProblemContributionTree: (tree) => set({ problemContributionTree: tree }),
```

- [ ] **Step 5: Run test to verify pass**

Run: `pnpm --filter @variscout/stores test -- --run investigationStore.test`
Expected: PASS — 3 new tests green + existing tests still pass.

- [ ] **Step 6: Commit**

```bash
git add packages/core/src/findings/types.ts packages/core/src/index.ts packages/stores/src/investigationStore.ts packages/stores/src/__tests__/investigationStore.test.ts
git commit -m "feat(wall): add GateNode type and problemContributionTree action"
```

**─── PHASE 1 COMPLETE — types and schema additions landed. Run `pnpm test` at monorepo root before continuing. All existing tests must stay green. ───**

---

## ─── PHASE 2: Pure compute (evaluator + AND-check) ───

### Task 2.1: Implement `evaluateCondition`

**Files:**

- Create: `packages/core/src/findings/hypothesisConditionEvaluator.ts`
- Test: `packages/core/src/findings/__tests__/hypothesisConditionEvaluator.test.ts`

- [ ] **Step 1: Write failing evaluator tests**

Create `packages/core/src/findings/__tests__/hypothesisConditionEvaluator.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { evaluateCondition } from '../hypothesisConditionEvaluator';
import type { HypothesisCondition } from '../hypothesisCondition';

type Row = Record<string, unknown>;

describe('evaluateCondition', () => {
  const row: Row = {
    SHIFT: 'night',
    NOZZLE_TEMP: 130,
    SUPPLIER: 'B',
  };

  it('evaluates eq leaf true', () => {
    const cond: HypothesisCondition = { kind: 'leaf', column: 'SHIFT', op: 'eq', value: 'night' };
    expect(evaluateCondition(cond, row)).toBe(true);
  });

  it('evaluates eq leaf false', () => {
    const cond: HypothesisCondition = { kind: 'leaf', column: 'SHIFT', op: 'eq', value: 'day' };
    expect(evaluateCondition(cond, row)).toBe(false);
  });

  it('evaluates numeric gt leaf', () => {
    const cond: HypothesisCondition = { kind: 'leaf', column: 'NOZZLE_TEMP', op: 'gt', value: 120 };
    expect(evaluateCondition(cond, row)).toBe(true);
  });

  it('evaluates between leaf inclusive', () => {
    const cond: HypothesisCondition = {
      kind: 'leaf',
      column: 'NOZZLE_TEMP',
      op: 'between',
      value: [120, 140],
    };
    expect(evaluateCondition(cond, row)).toBe(true);
  });

  it('evaluates in leaf', () => {
    const cond: HypothesisCondition = {
      kind: 'leaf',
      column: 'SUPPLIER',
      op: 'in',
      value: ['A', 'B', 'C'],
    };
    expect(evaluateCondition(cond, row)).toBe(true);
  });

  it('returns false on missing column without throwing', () => {
    const cond: HypothesisCondition = {
      kind: 'leaf',
      column: 'MISSING_COL',
      op: 'eq',
      value: 1,
    };
    expect(evaluateCondition(cond, row)).toBe(false);
  });

  it('evaluates AND branch', () => {
    const cond: HypothesisCondition = {
      kind: 'and',
      children: [
        { kind: 'leaf', column: 'SHIFT', op: 'eq', value: 'night' },
        { kind: 'leaf', column: 'NOZZLE_TEMP', op: 'gt', value: 120 },
      ],
    };
    expect(evaluateCondition(cond, row)).toBe(true);
  });

  it('evaluates OR branch — short-circuit on first true', () => {
    const cond: HypothesisCondition = {
      kind: 'or',
      children: [
        { kind: 'leaf', column: 'SHIFT', op: 'eq', value: 'day' },
        { kind: 'leaf', column: 'SHIFT', op: 'eq', value: 'night' },
      ],
    };
    expect(evaluateCondition(cond, row)).toBe(true);
  });

  it('evaluates NOT branch (unary)', () => {
    const cond: HypothesisCondition = {
      kind: 'not',
      children: [{ kind: 'leaf', column: 'SHIFT', op: 'eq', value: 'day' }],
    };
    expect(evaluateCondition(cond, row)).toBe(true);
  });

  it('handles nested AND inside OR', () => {
    const cond: HypothesisCondition = {
      kind: 'or',
      children: [
        {
          kind: 'and',
          children: [
            { kind: 'leaf', column: 'SHIFT', op: 'eq', value: 'night' },
            { kind: 'leaf', column: 'SUPPLIER', op: 'eq', value: 'A' },
          ],
        },
        { kind: 'leaf', column: 'SUPPLIER', op: 'eq', value: 'B' },
      ],
    };
    expect(evaluateCondition(cond, row)).toBe(true);
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `pnpm --filter @variscout/core test -- --run hypothesisConditionEvaluator.test`
Expected: FAIL — `Cannot find module '../hypothesisConditionEvaluator'`.

- [ ] **Step 3: Implement the evaluator**

Create `packages/core/src/findings/hypothesisConditionEvaluator.ts`:

```ts
/**
 * Pure predicate evaluator for `HypothesisCondition`. Used by the Investigation
 * Wall to compute HOLDS X/Y over a data window. Missing columns and type
 * mismatches return `false` rather than throwing (ADR-069 B2 safety).
 */

import type { HypothesisCondition } from './hypothesisCondition';

export type DataRow = Record<string, unknown>;

export function evaluateCondition(cond: HypothesisCondition, row: DataRow): boolean {
  if (cond.kind === 'leaf') return evaluateLeaf(cond, row);
  if (cond.kind === 'and') return cond.children.every(c => evaluateCondition(c, row));
  if (cond.kind === 'or') return cond.children.some(c => evaluateCondition(c, row));
  // kind === 'not' — unary, operates on children[0]
  const [head] = cond.children;
  if (!head) return false;
  return !evaluateCondition(head, row);
}

function evaluateLeaf(cond: Extract<HypothesisCondition, { kind: 'leaf' }>, row: DataRow): boolean {
  if (!(cond.column in row)) return false;
  const raw = row[cond.column];
  if (raw === null || raw === undefined) return false;

  switch (cond.op) {
    case 'eq':
      return raw === cond.value;
    case 'neq':
      return raw !== cond.value;
    case 'lt':
      return typeof raw === 'number' && typeof cond.value === 'number' && raw < cond.value;
    case 'lte':
      return typeof raw === 'number' && typeof cond.value === 'number' && raw <= cond.value;
    case 'gt':
      return typeof raw === 'number' && typeof cond.value === 'number' && raw > cond.value;
    case 'gte':
      return typeof raw === 'number' && typeof cond.value === 'number' && raw >= cond.value;
    case 'between':
      if (typeof raw !== 'number') return false;
      if (!Array.isArray(cond.value) || cond.value.length !== 2) return false;
      return raw >= cond.value[0] && raw <= cond.value[1];
    case 'in':
      if (!Array.isArray(cond.value)) return false;
      return (cond.value as Array<string | number>).some(v => v === raw);
  }
}
```

- [ ] **Step 4: Run test to verify pass**

Run: `pnpm --filter @variscout/core test -- --run hypothesisConditionEvaluator.test`
Expected: PASS — 10 tests green.

- [ ] **Step 5: Commit**

```bash
git add packages/core/src/findings/hypothesisConditionEvaluator.ts packages/core/src/findings/__tests__/hypothesisConditionEvaluator.test.ts
git commit -m "feat(wall): pure evaluator for HypothesisCondition"
```

### Task 2.2: Implement `runAndCheck` with gate tree traversal

**Files:**

- Modify: `packages/core/src/findings/hypothesisConditionEvaluator.ts`
- Modify: `packages/core/src/findings/__tests__/hypothesisConditionEvaluator.test.ts`

- [ ] **Step 1: Write failing AND-check tests**

Append to `packages/core/src/findings/__tests__/hypothesisConditionEvaluator.test.ts`:

```ts
import { runAndCheck } from '../hypothesisConditionEvaluator';
import type { SuspectedCause, GateNode } from '@variscout/core';

function hub(id: string, cond: HypothesisCondition | undefined): SuspectedCause {
  return {
    id,
    name: id,
    synthesis: '',
    questionIds: [],
    findingIds: [],
    status: 'suspected',
    condition: cond,
    createdAt: '2026-04-19T00:00:00Z',
    updatedAt: '2026-04-19T00:00:00Z',
  };
}

describe('runAndCheck', () => {
  const hubs: SuspectedCause[] = [
    hub('h1', { kind: 'leaf', column: 'SHIFT', op: 'eq', value: 'night' }),
    hub('h2', { kind: 'leaf', column: 'SUPPLIER', op: 'eq', value: 'B' }),
    hub('h3', undefined),
  ];

  const rows = [
    { SHIFT: 'night', SUPPLIER: 'B' },
    { SHIFT: 'night', SUPPLIER: 'A' },
    { SHIFT: 'day', SUPPLIER: 'B' },
    { SHIFT: 'night', SUPPLIER: 'B' },
  ];

  it('counts holds for a single-hub leaf', () => {
    const tree: GateNode = { kind: 'hub', hubId: 'h1' };
    const result = runAndCheck(tree, hubs, rows);
    expect(result.total).toBe(4);
    expect(result.holds).toBe(3);
    expect(result.matchingRowIndices).toEqual([0, 1, 3]);
  });

  it('counts holds for AND of two hubs', () => {
    const tree: GateNode = {
      kind: 'and',
      children: [
        { kind: 'hub', hubId: 'h1' },
        { kind: 'hub', hubId: 'h2' },
      ],
    };
    const result = runAndCheck(tree, hubs, rows);
    expect(result.holds).toBe(2);
    expect(result.matchingRowIndices).toEqual([0, 3]);
  });

  it('returns 0 holds when a referenced hub has no condition', () => {
    const tree: GateNode = {
      kind: 'and',
      children: [
        { kind: 'hub', hubId: 'h1' },
        { kind: 'hub', hubId: 'h3' }, // no condition
      ],
    };
    const result = runAndCheck(tree, hubs, rows);
    expect(result.holds).toBe(0);
  });

  it('handles nested OR + AND', () => {
    const tree: GateNode = {
      kind: 'or',
      children: [
        {
          kind: 'and',
          children: [
            { kind: 'hub', hubId: 'h1' },
            { kind: 'hub', hubId: 'h2' },
          ],
        },
        { kind: 'hub', hubId: 'h2' },
      ],
    };
    const result = runAndCheck(tree, hubs, rows);
    // row 0: h1=true h2=true → AND true → OR true
    // row 1: h1=true h2=false → AND false. h2=false. OR false.
    // row 2: h1=false h2=true → AND false. h2=true. OR true.
    // row 3: h1=true h2=true → AND true → OR true.
    expect(result.holds).toBe(3);
    expect(result.matchingRowIndices).toEqual([0, 2, 3]);
  });

  it('returns total 0 / holds 0 on empty rows without throwing', () => {
    const tree: GateNode = { kind: 'hub', hubId: 'h1' };
    const result = runAndCheck(tree, hubs, []);
    expect(result.total).toBe(0);
    expect(result.holds).toBe(0);
    expect(result.matchingRowIndices).toEqual([]);
  });

  it('returns 0 holds when tree references a missing hub', () => {
    const tree: GateNode = { kind: 'hub', hubId: 'missing' };
    const result = runAndCheck(tree, hubs, rows);
    expect(result.holds).toBe(0);
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `pnpm --filter @variscout/core test -- --run hypothesisConditionEvaluator.test`
Expected: FAIL — `runAndCheck is not a function`.

- [ ] **Step 3: Implement `runAndCheck`**

Append to `packages/core/src/findings/hypothesisConditionEvaluator.ts`:

```ts
import type { SuspectedCause, GateNode } from './types';

export interface AndCheckResult {
  total: number;
  holds: number;
  matchingRowIndices: number[];
}

/**
 * Evaluate a `GateNode` tree against every row in the data window. Returns the
 * count of rows where the tree evaluates to true, the total rows considered, and
 * the matching row indices for highlight-on-chart interactions.
 *
 * Hubs without a `condition` evaluate to false (can't be disconfirmed without a rule).
 * Unknown hub IDs evaluate to false.
 */
export function runAndCheck(
  tree: GateNode,
  hubs: SuspectedCause[],
  rows: DataRow[]
): AndCheckResult {
  const hubById = new Map(hubs.map(h => [h.id, h]));
  const matching: number[] = [];

  for (let i = 0; i < rows.length; i++) {
    if (evaluateGate(tree, hubById, rows[i])) matching.push(i);
  }
  return { total: rows.length, holds: matching.length, matchingRowIndices: matching };
}

function evaluateGate(node: GateNode, hubById: Map<string, SuspectedCause>, row: DataRow): boolean {
  if (node.kind === 'hub') {
    const hub = hubById.get(node.hubId);
    if (!hub || !hub.condition) return false;
    return evaluateCondition(hub.condition, row);
  }
  if (node.kind === 'and') return node.children.every(c => evaluateGate(c, hubById, row));
  if (node.kind === 'or') return node.children.some(c => evaluateGate(c, hubById, row));
  // 'not' — unary
  const [head] = node.children;
  if (!head) return false;
  return !evaluateGate(head, hubById, row);
}
```

- [ ] **Step 4: Run test to verify pass**

Run: `pnpm --filter @variscout/core test -- --run hypothesisConditionEvaluator.test`
Expected: PASS — all 16 tests green.

- [ ] **Step 5: Commit**

```bash
git add packages/core/src/findings/hypothesisConditionEvaluator.ts packages/core/src/findings/__tests__/hypothesisConditionEvaluator.test.ts
git commit -m "feat(wall): runAndCheck traverses GateNode tree across data window"
```

### Task 2.3: Export new primitives from core barrel

**Files:**

- Modify: `packages/core/src/index.ts`

- [ ] **Step 1: Verify test passes with barrel export**

Run existing test expecting `@variscout/core` import:

Run: `pnpm --filter @variscout/stores test -- --run investigationStore.test`
Expected: should already pass (GateNode export added in Task 1.4).

- [ ] **Step 2: Add missing exports**

In `packages/core/src/index.ts`, ensure these lines exist:

```ts
export type {
  HypothesisCondition,
  ConditionLeaf,
  ConditionBranch,
  ComparisonOp,
  FindingSourceColumnHints,
} from './findings/hypothesisCondition';
export { deriveConditionFromFindingSource } from './findings/hypothesisCondition';
export type { DataRow, AndCheckResult } from './findings/hypothesisConditionEvaluator';
export { evaluateCondition, runAndCheck } from './findings/hypothesisConditionEvaluator';
```

- [ ] **Step 3: Run monorepo typecheck**

Run: `pnpm typecheck` (or `pnpm -r exec tsc --noEmit`)
Expected: PASS — no type errors.

- [ ] **Step 4: Commit**

```bash
git add packages/core/src/index.ts
git commit -m "feat(wall): export HypothesisCondition + evaluator from core barrel"
```

**─── PHASE 2 COMPLETE — AND-check compute is pure, tested, and callable from stores/charts/apps. ───**

---

## ─── PHASE 3: Disconfirmation heuristic + critique aggregator ───

### Task 3.1: Implement `proposeDisconfirmationMove`

**Files:**

- Create: `packages/core/src/ai/actions/proposeDisconfirmationMove.ts`
- Test: `packages/core/src/ai/actions/__tests__/proposeDisconfirmationMove.test.ts`

- [ ] **Step 1: Write failing tests**

Create `packages/core/src/ai/actions/__tests__/proposeDisconfirmationMove.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { proposeDisconfirmationMove } from '../proposeDisconfirmationMove';
import type { SuspectedCause, Finding } from '@variscout/core';

function finding(
  id: string,
  source: Finding['source'],
  validationStatus?: Finding['validationStatus']
): Finding {
  return {
    id,
    text: '',
    createdAt: Date.now(),
    context: { activeFilters: {}, cumulativeScope: null },
    status: 'observed',
    comments: [],
    statusChangedAt: Date.now(),
    source,
    validationStatus,
  };
}

function hub(id: string, findingIds: string[]): SuspectedCause {
  return {
    id,
    name: id,
    synthesis: '',
    questionIds: [],
    findingIds,
    status: 'suspected',
    createdAt: '2026-04-19T00:00:00Z',
    updatedAt: '2026-04-19T00:00:00Z',
  };
}

describe('proposeDisconfirmationMove', () => {
  const data = [{ SHIFT: 'night' }, { SHIFT: 'day' }, { SHIFT: 'evening' }, { SHIFT: 'night' }];

  it('returns undefined when hub has <3 supporting findings', () => {
    const h = hub('h1', ['f1', 'f2']);
    const findings = [
      finding('f1', { chart: 'boxplot', category: 'night' }),
      finding('f2', { chart: 'boxplot', category: 'night' }),
    ];
    expect(proposeDisconfirmationMove(h, findings, data)).toBeUndefined();
  });

  it('returns undefined when a contradicting finding already exists', () => {
    const h = hub('h1', ['f1', 'f2', 'f3', 'f4']);
    const findings = [
      finding('f1', { chart: 'boxplot', category: 'night' }),
      finding('f2', { chart: 'boxplot', category: 'night' }),
      finding('f3', { chart: 'boxplot', category: 'night' }),
      finding('f4', { chart: 'boxplot', category: 'day' }, 'contradicts'),
    ];
    expect(proposeDisconfirmationMove(h, findings, data)).toBeUndefined();
  });

  it('suggests complementary categorical brush when eligible', () => {
    const h = hub('h1', ['f1', 'f2', 'f3']);
    const findings = [
      finding('f1', { chart: 'boxplot', category: 'night' }),
      finding('f2', { chart: 'boxplot', category: 'night' }),
      finding('f3', { chart: 'boxplot', category: 'night' }),
    ];
    const result = proposeDisconfirmationMove(h, findings, data);
    expect(result).toBeDefined();
    expect(result?.chart).toBe('boxplot');
    expect(result?.suggestedCategory).toBeDefined();
    expect(result?.suggestedCategory).not.toBe('night');
  });

  it('returns undefined for coscout-only findings', () => {
    const h = hub('h1', ['f1', 'f2', 'f3']);
    const findings = [
      finding('f1', { chart: 'coscout', messageId: 'm1' }),
      finding('f2', { chart: 'coscout', messageId: 'm2' }),
      finding('f3', { chart: 'coscout', messageId: 'm3' }),
    ];
    expect(proposeDisconfirmationMove(h, findings, data)).toBeUndefined();
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `pnpm --filter @variscout/core test -- --run proposeDisconfirmationMove.test`
Expected: FAIL — `Cannot find module '../proposeDisconfirmationMove'`.

- [ ] **Step 3: Implement the heuristic**

Create `packages/core/src/ai/actions/proposeDisconfirmationMove.ts`:

```ts
/**
 * Pure heuristic that proposes a complementary brush region analysts should try
 * in order to disconfirm a suspected cause. Emits a `SuggestedBrush` the Wall UI
 * can hand to CoScout's `critique_investigation_state` tool output.
 *
 * Gate: hub has ≥3 supporting findings AND no existing finding with
 * validationStatus === 'contradicts'. Returns undefined otherwise.
 */

import type { SuspectedCause, Finding, FindingSource, DataRow } from '../..';

export interface SuggestedBrush {
  chart: FindingSource['chart'];
  suggestedCategory?: string;
  suggestedRange?: [number, number];
  column?: string;
  reason: string;
}

const SUPPORT_THRESHOLD = 3;

export function proposeDisconfirmationMove(
  hub: SuspectedCause,
  findings: Finding[],
  data: DataRow[]
): SuggestedBrush | undefined {
  const supporters = findings.filter(f => hub.findingIds.includes(f.id));
  if (supporters.length < SUPPORT_THRESHOLD) return undefined;
  if (supporters.some(f => f.validationStatus === 'contradicts')) return undefined;

  // Prefer categorical findings first — they have a clean "opposite" via other categories.
  const categorical = supporters.find(
    f =>
      f.source &&
      (f.source.chart === 'boxplot' || f.source.chart === 'pareto' || f.source.chart === 'yamazumi')
  );
  if (categorical?.source && 'category' in categorical.source) {
    const usedCategory = categorical.source.category;
    // Find another distinct category in the data (first occurrence wins; deterministic).
    const columnHint = inferCategoryColumn(data, usedCategory);
    if (!columnHint) return undefined;
    const otherCategory = firstDistinctValue(data, columnHint, usedCategory);
    if (!otherCategory) return undefined;
    return {
      chart: categorical.source.chart,
      suggestedCategory: otherCategory,
      column: columnHint,
      reason: `${hub.name} has no disconfirmation attempted. Try brushing ${otherCategory}.`,
    };
  }

  // Numeric ichart — propose opposite side of the anchor.
  const numeric = supporters.find(f => f.source?.chart === 'ichart');
  if (numeric?.source && numeric.source.chart === 'ichart') {
    const threshold = numeric.source.anchorY;
    return {
      chart: 'ichart',
      suggestedRange: [Number.NEGATIVE_INFINITY, threshold],
      reason: `${hub.name} has no disconfirmation attempted. Try brushing values below ${threshold}.`,
    };
  }

  return undefined;
}

/** Guess which column the supporting findings share by scanning data for value match. */
function inferCategoryColumn(data: DataRow[], value: string): string | undefined {
  if (data.length === 0) return undefined;
  for (const key of Object.keys(data[0])) {
    if (data.some(row => row[key] === value)) return key;
  }
  return undefined;
}

function firstDistinctValue(data: DataRow[], column: string, exclude: string): string | undefined {
  for (const row of data) {
    const v = row[column];
    if (typeof v === 'string' && v !== exclude) return v;
  }
  return undefined;
}
```

- [ ] **Step 4: Run test to verify pass**

Run: `pnpm --filter @variscout/core test -- --run proposeDisconfirmationMove.test`
Expected: PASS — 4 tests green.

- [ ] **Step 5: Commit**

```bash
git add packages/core/src/ai/actions/proposeDisconfirmationMove.ts packages/core/src/ai/actions/__tests__/proposeDisconfirmationMove.test.ts
git commit -m "feat(wall): disconfirmation heuristic (complementary brush)"
```

### Task 3.2: Implement `critiqueInvestigationState`

**Files:**

- Create: `packages/core/src/ai/actions/critiqueInvestigationState.ts`
- Test: `packages/core/src/ai/actions/__tests__/critiqueInvestigationState.test.ts`

- [ ] **Step 1: Write failing tests**

Create `packages/core/src/ai/actions/__tests__/critiqueInvestigationState.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { critiqueInvestigationState } from '../critiqueInvestigationState';
import type { SuspectedCause, Question, Finding } from '@variscout/core';

function hub(id: string, findingIds: string[], questionIds: string[] = []): SuspectedCause {
  return {
    id,
    name: id,
    synthesis: '',
    questionIds,
    findingIds,
    status: 'suspected',
    createdAt: '2026-04-19T00:00:00Z',
    updatedAt: '2026-04-19T00:00:00Z',
  };
}

function question(
  id: string,
  status: Question['status'] = 'open',
  linkedFindingIds: string[] = []
): Question {
  return {
    id,
    text: id,
    status,
    linkedFindingIds,
    createdAt: '2026-04-19T00:00:00Z',
    updatedAt: '2026-04-19T00:00:00Z',
  };
}

function finding(id: string, validationStatus?: Finding['validationStatus']): Finding {
  return {
    id,
    text: '',
    createdAt: Date.now(),
    context: { activeFilters: {}, cumulativeScope: null },
    status: 'observed',
    comments: [],
    statusChangedAt: Date.now(),
    validationStatus,
  };
}

describe('critiqueInvestigationState', () => {
  it('flags hubs with 3+ findings and no contradictor as missing disconfirmation', () => {
    const hubs = [hub('h1', ['f1', 'f2', 'f3'])];
    const findings = [finding('f1'), finding('f2'), finding('f3')];
    const result = critiqueInvestigationState({ hubs, questions: [], findings });
    expect(result.gaps.some(g => g.kind === 'missing-disconfirmation' && g.hubId === 'h1')).toBe(
      true
    );
  });

  it('does not flag hubs that already have a contradictor', () => {
    const hubs = [hub('h1', ['f1', 'f2', 'f3'])];
    const findings = [finding('f1'), finding('f2'), finding('f3', 'contradicts')];
    const result = critiqueInvestigationState({ hubs, questions: [], findings });
    expect(result.gaps.some(g => g.kind === 'missing-disconfirmation' && g.hubId === 'h1')).toBe(
      false
    );
  });

  it('flags hubs with no linked questions', () => {
    const hubs = [hub('h1', ['f1'], /* no questions */ [])];
    const findings = [finding('f1')];
    const result = critiqueInvestigationState({ hubs, questions: [], findings });
    expect(result.gaps.some(g => g.kind === 'hub-without-question' && g.hubId === 'h1')).toBe(true);
  });

  it('flags orphan open questions not linked to any hub', () => {
    const hubs: SuspectedCause[] = [];
    const questions = [question('q1'), question('q2', 'answered')];
    const result = critiqueInvestigationState({ hubs, questions, findings: [] });
    // q1 is open and orphan; q2 is answered (not orphan-flaggable).
    expect(result.gaps.filter(g => g.kind === 'orphan-question').length).toBe(1);
  });

  it('flags stale open questions older than 7 days', () => {
    const staleDate = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString();
    const freshDate = new Date().toISOString();
    const questions: Question[] = [
      { ...question('qStale'), createdAt: staleDate, updatedAt: staleDate },
      { ...question('qFresh'), createdAt: freshDate, updatedAt: freshDate },
    ];
    const result = critiqueInvestigationState({ hubs: [], questions, findings: [] });
    expect(result.gaps.some(g => g.kind === 'stale-question' && g.questionId === 'qStale')).toBe(
      true
    );
    expect(result.gaps.some(g => g.kind === 'stale-question' && g.questionId === 'qFresh')).toBe(
      false
    );
  });

  it('returns empty gaps array for clean investigation', () => {
    const result = critiqueInvestigationState({ hubs: [], questions: [], findings: [] });
    expect(result.gaps).toEqual([]);
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `pnpm --filter @variscout/core test -- --run critiqueInvestigationState.test`
Expected: FAIL — `Cannot find module '../critiqueInvestigationState'`.

- [ ] **Step 3: Implement the aggregator**

Create `packages/core/src/ai/actions/critiqueInvestigationState.ts`:

```ts
/**
 * Aggregates investigation-state gaps for the CoScout
 * `critique_investigation_state` tool. Returns a structured array of gap
 * entries. One read tool powers the whole Wall rail critique feed.
 *
 * Gap kinds:
 * - missing-disconfirmation: hub has ≥3 supporting findings and no contradictor
 * - hub-without-question: hub with no linked guiding questions
 * - orphan-question: open question with no hub membership
 * - stale-question: open question older than STALE_DAYS
 */

import type { SuspectedCause, Question, Finding } from '..';

const MIN_SUPPORTERS_FOR_DISCONFIRMATION_GAP = 3;
const STALE_DAYS = 7;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

export type InvestigationGap =
  | { kind: 'missing-disconfirmation'; hubId: string; hubName: string }
  | { kind: 'hub-without-question'; hubId: string; hubName: string }
  | { kind: 'orphan-question'; questionId: string; questionText: string }
  | { kind: 'stale-question'; questionId: string; questionText: string; daysOpen: number };

export interface CritiqueInput {
  hubs: SuspectedCause[];
  questions: Question[];
  findings: Finding[];
}

export interface CritiqueResult {
  gaps: InvestigationGap[];
}

export function critiqueInvestigationState(input: CritiqueInput): CritiqueResult {
  const gaps: InvestigationGap[] = [];
  const findingById = new Map(input.findings.map(f => [f.id, f]));

  for (const hub of input.hubs) {
    const supporters = hub.findingIds
      .map(id => findingById.get(id))
      .filter((f): f is Finding => !!f);
    const hasContradictor = supporters.some(f => f.validationStatus === 'contradicts');
    if (supporters.length >= MIN_SUPPORTERS_FOR_DISCONFIRMATION_GAP && !hasContradictor) {
      gaps.push({ kind: 'missing-disconfirmation', hubId: hub.id, hubName: hub.name });
    }
    if (hub.questionIds.length === 0) {
      gaps.push({ kind: 'hub-without-question', hubId: hub.id, hubName: hub.name });
    }
  }

  const hubQuestionIds = new Set(input.hubs.flatMap(h => h.questionIds));
  const now = Date.now();
  for (const q of input.questions) {
    if (q.status !== 'open') continue;
    if (!hubQuestionIds.has(q.id)) {
      gaps.push({ kind: 'orphan-question', questionId: q.id, questionText: q.text });
    }
    const createdMs = Date.parse(q.createdAt);
    if (!Number.isNaN(createdMs)) {
      const daysOpen = Math.floor((now - createdMs) / MS_PER_DAY);
      if (daysOpen > STALE_DAYS) {
        gaps.push({ kind: 'stale-question', questionId: q.id, questionText: q.text, daysOpen });
      }
    }
  }

  return { gaps };
}
```

- [ ] **Step 4: Run test to verify pass**

Run: `pnpm --filter @variscout/core test -- --run critiqueInvestigationState.test`
Expected: PASS — 6 tests green.

- [ ] **Step 5: Commit**

```bash
git add packages/core/src/ai/actions/critiqueInvestigationState.ts packages/core/src/ai/actions/__tests__/critiqueInvestigationState.test.ts
git commit -m "feat(wall): aggregate investigation gaps for CoScout critique tool"
```

### Task 3.3: Export critique + disconfirmation from core

**Files:**

- Modify: `packages/core/src/index.ts`

- [ ] **Step 1: Add barrel exports**

In `packages/core/src/index.ts`, add:

```ts
export { proposeDisconfirmationMove } from './ai/actions/proposeDisconfirmationMove';
export type { SuggestedBrush } from './ai/actions/proposeDisconfirmationMove';
export { critiqueInvestigationState } from './ai/actions/critiqueInvestigationState';
export type {
  InvestigationGap,
  CritiqueInput,
  CritiqueResult,
} from './ai/actions/critiqueInvestigationState';
```

- [ ] **Step 2: Typecheck**

Run: `pnpm --filter @variscout/core typecheck`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add packages/core/src/index.ts
git commit -m "feat(wall): export critique + disconfirmation primitives"
```

**─── PHASE 3 COMPLETE — AI heuristics are pure, tested, and callable from the CoScout tool layer. ───**

---

## ─── PHASE 4: `wallLayoutStore` + selectors ───

### Task 4.1: Scaffold `wallLayoutStore` with viewMode + zoom/pan

**Files:**

- Create: `packages/stores/src/wallLayoutStore.ts`
- Test: `packages/stores/src/__tests__/wallLayoutStore.test.ts`

- [ ] **Step 1: Write failing tests**

Create `packages/stores/src/__tests__/wallLayoutStore.test.ts`:

```ts
import { describe, it, expect, beforeEach } from 'vitest';
import { useWallLayoutStore } from '../wallLayoutStore';

describe('wallLayoutStore', () => {
  beforeEach(() => {
    useWallLayoutStore.setState(useWallLayoutStore.getInitialState());
  });

  it('defaults viewMode to map (preserves ADR-066 default)', () => {
    expect(useWallLayoutStore.getState().viewMode).toBe('map');
  });

  it('toggles viewMode to wall and back', () => {
    useWallLayoutStore.getState().setViewMode('wall');
    expect(useWallLayoutStore.getState().viewMode).toBe('wall');
    useWallLayoutStore.getState().setViewMode('map');
    expect(useWallLayoutStore.getState().viewMode).toBe('map');
  });

  it('starts with zoom 1.0 and pan 0,0', () => {
    expect(useWallLayoutStore.getState().zoom).toBe(1);
    expect(useWallLayoutStore.getState().pan).toEqual({ x: 0, y: 0 });
  });

  it('updates pan', () => {
    useWallLayoutStore.getState().setPan({ x: 100, y: -50 });
    expect(useWallLayoutStore.getState().pan).toEqual({ x: 100, y: -50 });
  });

  it('updates zoom', () => {
    useWallLayoutStore.getState().setZoom(2);
    expect(useWallLayoutStore.getState().zoom).toBe(2);
  });

  it('rail is open by default', () => {
    expect(useWallLayoutStore.getState().railOpen).toBe(true);
  });

  it('toggles rail', () => {
    useWallLayoutStore.getState().toggleRail();
    expect(useWallLayoutStore.getState().railOpen).toBe(false);
    useWallLayoutStore.getState().toggleRail();
    expect(useWallLayoutStore.getState().railOpen).toBe(true);
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `pnpm --filter @variscout/stores test -- --run wallLayoutStore.test`
Expected: FAIL — `Cannot find module '../wallLayoutStore'`.

- [ ] **Step 3: Implement the store scaffold**

Create `packages/stores/src/wallLayoutStore.ts`:

```ts
/**
 * wallLayoutStore — UI-only Zustand feature store for the Investigation Wall.
 *
 * Holds node positions, zoom/pan, selection, open chart clusters, rail state,
 * and an ephemeral undo history. Persisted to IndexedDB per projectId via Dexie
 * (wired in Task 4.4). Not a domain store — domain facts (hubs, findings,
 * causalLinks, problemContributionTree) live in investigationStore.
 */

import { create } from 'zustand';

export type NodeId = string;
export type TributaryId = string;
export type GateNodePath = string; // dot-separated path from tree root, e.g. "root.and.0"

export interface ChartClusterState {
  tributaryId: TributaryId;
  x: number;
  y: number;
  activeChart: 'ichart' | 'boxplot' | 'pareto' | 'histogram' | 'probability';
}

export interface AndCheckSnapshot {
  holds: number;
  total: number;
  at: number;
}

export interface PendingComment {
  scope: 'finding' | 'hub';
  targetId: string;
  text: string;
  author?: string;
  localId: string;
  createdAt: number;
}

export interface WallLayoutState {
  viewMode: 'map' | 'wall';
  nodePositions: Record<NodeId, { x: number; y: number }>;
  selection: Set<NodeId>;
  openChartClusters: Record<TributaryId, ChartClusterState>;
  zoom: number;
  pan: { x: number; y: number };
  railOpen: boolean;
  andCheckResults: Record<GateNodePath, AndCheckSnapshot>;
  pendingComments: PendingComment[];
}

export interface WallLayoutActions {
  setViewMode: (mode: 'map' | 'wall') => void;
  setNodePosition: (nodeId: NodeId, pos: { x: number; y: number }) => void;
  setSelection: (ids: NodeId[]) => void;
  addToSelection: (id: NodeId) => void;
  clearSelection: () => void;
  setZoom: (zoom: number) => void;
  setPan: (pan: { x: number; y: number }) => void;
  toggleRail: () => void;
  setRailOpen: (open: boolean) => void;
  setAndCheckResult: (path: GateNodePath, snapshot: AndCheckSnapshot) => void;
  openChartCluster: (state: ChartClusterState) => void;
  closeChartCluster: (tributaryId: TributaryId) => void;
  enqueuePendingComment: (comment: PendingComment) => void;
  drainPendingComments: () => PendingComment[];
}

const INITIAL_STATE: WallLayoutState = {
  viewMode: 'map',
  nodePositions: {},
  selection: new Set<NodeId>(),
  openChartClusters: {},
  zoom: 1,
  pan: { x: 0, y: 0 },
  railOpen: true,
  andCheckResults: {},
  pendingComments: [],
};

export const useWallLayoutStore = create<WallLayoutState & WallLayoutActions>()((set, get) => ({
  ...INITIAL_STATE,
  setViewMode: viewMode => set({ viewMode }),
  setNodePosition: (nodeId, pos) =>
    set(s => ({ nodePositions: { ...s.nodePositions, [nodeId]: pos } })),
  setSelection: ids => set({ selection: new Set(ids) }),
  addToSelection: id => set(s => ({ selection: new Set([...s.selection, id]) })),
  clearSelection: () => set({ selection: new Set() }),
  setZoom: zoom => set({ zoom }),
  setPan: pan => set({ pan }),
  toggleRail: () => set(s => ({ railOpen: !s.railOpen })),
  setRailOpen: railOpen => set({ railOpen }),
  setAndCheckResult: (path, snapshot) =>
    set(s => ({ andCheckResults: { ...s.andCheckResults, [path]: snapshot } })),
  openChartCluster: state =>
    set(s => ({ openChartClusters: { ...s.openChartClusters, [state.tributaryId]: state } })),
  closeChartCluster: tributaryId =>
    set(s => {
      const next = { ...s.openChartClusters };
      delete next[tributaryId];
      return { openChartClusters: next };
    }),
  enqueuePendingComment: comment =>
    set(s => ({ pendingComments: [...s.pendingComments, comment] })),
  drainPendingComments: () => {
    const drained = get().pendingComments;
    set({ pendingComments: [] });
    return drained;
  },
}));

// Expose initial state for test resets (Zustand store API convention in this monorepo).
(useWallLayoutStore as unknown as { getInitialState: () => WallLayoutState }).getInitialState =
  () => INITIAL_STATE;
```

- [ ] **Step 4: Run test to verify pass**

Run: `pnpm --filter @variscout/stores test -- --run wallLayoutStore.test`
Expected: PASS — 7 tests green.

- [ ] **Step 5: Commit**

```bash
git add packages/stores/src/wallLayoutStore.ts packages/stores/src/__tests__/wallLayoutStore.test.ts
git commit -m "feat(wall): wallLayoutStore scaffold (viewMode, zoom/pan, rail, pending comments)"
```

### Task 4.2: Add node positions, selection, AND-check cache tests

**Files:**

- Modify: `packages/stores/src/__tests__/wallLayoutStore.test.ts`

- [ ] **Step 1: Add failing tests for interactions**

Append:

```ts
describe('wallLayoutStore — positions, selection, cache', () => {
  beforeEach(() => {
    useWallLayoutStore.setState(useWallLayoutStore.getInitialState());
  });

  it('sets node position', () => {
    useWallLayoutStore.getState().setNodePosition('hub-1', { x: 500, y: 400 });
    expect(useWallLayoutStore.getState().nodePositions['hub-1']).toEqual({ x: 500, y: 400 });
  });

  it('replaces selection', () => {
    useWallLayoutStore.getState().setSelection(['a', 'b']);
    expect([...useWallLayoutStore.getState().selection]).toEqual(['a', 'b']);
    useWallLayoutStore.getState().setSelection(['c']);
    expect([...useWallLayoutStore.getState().selection]).toEqual(['c']);
  });

  it('adds to selection and clears', () => {
    useWallLayoutStore.getState().addToSelection('a');
    useWallLayoutStore.getState().addToSelection('b');
    expect(useWallLayoutStore.getState().selection.size).toBe(2);
    useWallLayoutStore.getState().clearSelection();
    expect(useWallLayoutStore.getState().selection.size).toBe(0);
  });

  it('stores an AND-check result by gate path', () => {
    useWallLayoutStore.getState().setAndCheckResult('root', { holds: 38, total: 42, at: 123 });
    expect(useWallLayoutStore.getState().andCheckResults.root).toEqual({
      holds: 38,
      total: 42,
      at: 123,
    });
  });

  it('open and close chart clusters', () => {
    useWallLayoutStore.getState().openChartCluster({
      tributaryId: 't1',
      x: 100,
      y: 200,
      activeChart: 'ichart',
    });
    expect(useWallLayoutStore.getState().openChartClusters.t1?.activeChart).toBe('ichart');
    useWallLayoutStore.getState().closeChartCluster('t1');
    expect(useWallLayoutStore.getState().openChartClusters.t1).toBeUndefined();
  });

  it('enqueues and drains pending comments', () => {
    useWallLayoutStore.getState().enqueuePendingComment({
      scope: 'hub',
      targetId: 'h1',
      text: 'offline note',
      localId: 'loc-1',
      createdAt: 1,
    });
    expect(useWallLayoutStore.getState().pendingComments.length).toBe(1);
    const drained = useWallLayoutStore.getState().drainPendingComments();
    expect(drained.length).toBe(1);
    expect(useWallLayoutStore.getState().pendingComments.length).toBe(0);
  });
});
```

- [ ] **Step 2: Run to verify pass**

Run: `pnpm --filter @variscout/stores test -- --run wallLayoutStore.test`
Expected: PASS — new tests green (store methods already implemented in 4.1).

- [ ] **Step 3: Commit**

```bash
git add packages/stores/src/__tests__/wallLayoutStore.test.ts
git commit -m "test(wall): positions, selection, cache, cluster, pending-comment tests"
```

### Task 4.3: Add Dexie persistence for `wallLayoutStore`

**Files:**

- Modify: `packages/stores/src/wallLayoutStore.ts`
- Modify: `packages/stores/src/__tests__/wallLayoutStore.test.ts`

Check for existing Dexie usage: `grep -rn "from 'dexie'" packages/stores/src/` to find the import pattern. If `wallLayoutDb.ts` exists, reuse it. Otherwise follow the pattern from any existing Dexie-backed store (e.g., `sessionStore`).

- [ ] **Step 1: Add failing persistence test**

Append:

```ts
import { rehydrateWallLayout, persistWallLayout } from '../wallLayoutStore';

describe('wallLayoutStore persistence', () => {
  beforeEach(() => {
    useWallLayoutStore.setState(useWallLayoutStore.getInitialState());
  });

  it('persists and rehydrates viewMode + positions for a projectId', async () => {
    useWallLayoutStore.getState().setViewMode('wall');
    useWallLayoutStore.getState().setNodePosition('hub-1', { x: 123, y: 456 });
    await persistWallLayout('proj-abc');

    useWallLayoutStore.setState(useWallLayoutStore.getInitialState());
    expect(useWallLayoutStore.getState().viewMode).toBe('map');

    await rehydrateWallLayout('proj-abc');
    expect(useWallLayoutStore.getState().viewMode).toBe('wall');
    expect(useWallLayoutStore.getState().nodePositions['hub-1']).toEqual({ x: 123, y: 456 });
  });

  it('rehydrate with unknown projectId leaves defaults', async () => {
    await rehydrateWallLayout('unknown-project');
    expect(useWallLayoutStore.getState().viewMode).toBe('map');
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `pnpm --filter @variscout/stores test -- --run wallLayoutStore.test`
Expected: FAIL — `persistWallLayout is not a function`.

- [ ] **Step 3: Add Dexie wiring**

At the top of `packages/stores/src/wallLayoutStore.ts`, import:

```ts
import Dexie, { type Table } from 'dexie';
```

After the store definition, add:

```ts
interface WallLayoutSnapshot {
  projectId: string;
  viewMode: 'map' | 'wall';
  nodePositions: Record<NodeId, { x: number; y: number }>;
  zoom: number;
  pan: { x: number; y: number };
  railOpen: boolean;
  updatedAt: number;
}

class WallLayoutDB extends Dexie {
  snapshots!: Table<WallLayoutSnapshot, string>;
  constructor() {
    super('variscout-wall-layout');
    this.version(1).stores({ snapshots: 'projectId,updatedAt' });
  }
}

const db = new WallLayoutDB();

export async function persistWallLayout(projectId: string): Promise<void> {
  const s = useWallLayoutStore.getState();
  await db.snapshots.put({
    projectId,
    viewMode: s.viewMode,
    nodePositions: s.nodePositions,
    zoom: s.zoom,
    pan: s.pan,
    railOpen: s.railOpen,
    updatedAt: Date.now(),
  });
}

export async function rehydrateWallLayout(projectId: string): Promise<void> {
  const snapshot = await db.snapshots.get(projectId);
  if (!snapshot) return;
  useWallLayoutStore.setState({
    viewMode: snapshot.viewMode,
    nodePositions: snapshot.nodePositions,
    zoom: snapshot.zoom,
    pan: snapshot.pan,
    railOpen: snapshot.railOpen,
  });
}
```

- [ ] **Step 4: Run test to verify pass**

Run: `pnpm --filter @variscout/stores test -- --run wallLayoutStore.test`
Expected: PASS — persistence tests green. Note: IndexedDB in jsdom requires `fake-indexeddb`; if tests fail with "IDBFactory is not defined", add `import 'fake-indexeddb/auto'` at top of the test file.

- [ ] **Step 5: Commit**

```bash
git add packages/stores/src/wallLayoutStore.ts packages/stores/src/__tests__/wallLayoutStore.test.ts
git commit -m "feat(wall): IndexedDB persistence for wallLayoutStore via Dexie"
```

### Task 4.4: Wall selectors

**Files:**

- Create: `packages/stores/src/wallSelectors.ts`
- Test: `packages/stores/src/__tests__/wallSelectors.test.ts`

- [ ] **Step 1: Write failing selector tests**

Create `packages/stores/src/__tests__/wallSelectors.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import {
  selectHubCommentStream,
  selectHypothesisTributaries,
  selectOpenQuestionsWithoutHub,
  selectQuestionsForHub,
} from '../wallSelectors';
import type {
  SuspectedCause,
  Finding,
  Question,
  FindingComment,
  ProcessMap,
} from '@variscout/core';

function fc(id: string, text: string, createdAt: number): FindingComment {
  return { id, text, createdAt };
}

describe('selectHubCommentStream', () => {
  it('merges hub comments and linked-finding comments chronologically', () => {
    const hubComment = fc('hc1', 'hub talk', 2000);
    const fComment1 = fc('fc1', 'chart note A', 1000);
    const fComment2 = fc('fc2', 'chart note B', 3000);

    const hub: SuspectedCause = {
      id: 'h1',
      name: 'H1',
      synthesis: '',
      questionIds: [],
      findingIds: ['f1'],
      status: 'suspected',
      createdAt: '',
      updatedAt: '',
      comments: [hubComment],
    };
    const f1: Finding = {
      id: 'f1',
      text: '',
      createdAt: 0,
      context: { activeFilters: {}, cumulativeScope: null },
      status: 'observed',
      comments: [fComment1, fComment2],
      statusChangedAt: 0,
    };

    const result = selectHubCommentStream('h1', [hub], [f1]);
    expect(result.map(c => c.id)).toEqual(['fc1', 'hc1', 'fc2']);
    expect(result[0].source).toBe('finding');
    expect(result[1].source).toBe('hub');
  });

  it('returns empty for unknown hub', () => {
    expect(selectHubCommentStream('missing', [], [])).toEqual([]);
  });
});

describe('selectHypothesisTributaries', () => {
  const processMap: ProcessMap = {
    version: 1,
    nodes: [
      { id: 'n1', name: 'Mix', order: 0 },
      { id: 'n2', name: 'Fill', order: 1 },
    ],
    tributaries: [
      { id: 't1', stepId: 'n1', column: 'SHIFT' },
      { id: 't2', stepId: 'n2', column: 'SUPPLIER' },
    ],
    createdAt: '',
    updatedAt: '',
  };

  it('prefers explicit tributaryIds when set', () => {
    const hub: SuspectedCause = {
      id: 'h1',
      name: 'h',
      synthesis: '',
      questionIds: [],
      findingIds: [],
      status: 'suspected',
      createdAt: '',
      updatedAt: '',
      tributaryIds: ['t2'],
    };
    const result = selectHypothesisTributaries(hub, [], processMap);
    expect(result.map(t => t.id)).toEqual(['t2']);
  });

  it('derives from findings when tributaryIds absent', () => {
    const hub: SuspectedCause = {
      id: 'h1',
      name: 'h',
      synthesis: '',
      questionIds: [],
      findingIds: ['f1'],
      status: 'suspected',
      createdAt: '',
      updatedAt: '',
    };
    const f1: Finding = {
      id: 'f1',
      text: '',
      createdAt: 0,
      context: { activeFilters: {}, cumulativeScope: null },
      status: 'observed',
      comments: [],
      statusChangedAt: 0,
      source: { chart: 'boxplot', category: 'night' },
    };
    // source.column hint resolution is caller-side in practice; this helper treats
    // findingSource's column indirectly via findings with an attached column.
    // For this test, we use a hub whose tributaryIds map directly.
    const resultEmpty = selectHypothesisTributaries(hub, [f1], processMap);
    // Without column hints, helper returns [] when deriving from non-column sources.
    expect(resultEmpty).toEqual([]);
  });
});

describe('selectOpenQuestionsWithoutHub', () => {
  it('returns open questions not linked to any hub', () => {
    const hubs: SuspectedCause[] = [
      {
        id: 'h1',
        name: '',
        synthesis: '',
        questionIds: ['q1'],
        findingIds: [],
        status: 'suspected',
        createdAt: '',
        updatedAt: '',
      },
    ];
    const questions: Question[] = [
      {
        id: 'q1',
        text: 'linked',
        status: 'open',
        linkedFindingIds: [],
        createdAt: '',
        updatedAt: '',
      },
      {
        id: 'q2',
        text: 'orphan',
        status: 'open',
        linkedFindingIds: [],
        createdAt: '',
        updatedAt: '',
      },
      {
        id: 'q3',
        text: 'answered',
        status: 'answered',
        linkedFindingIds: [],
        createdAt: '',
        updatedAt: '',
      },
    ];
    const result = selectOpenQuestionsWithoutHub(questions, hubs);
    expect(result.map(q => q.id)).toEqual(['q2']);
  });
});

describe('selectQuestionsForHub', () => {
  it('returns questions referenced by hub.questionIds', () => {
    const hubs: SuspectedCause[] = [
      {
        id: 'h1',
        name: '',
        synthesis: '',
        questionIds: ['q1', 'q2'],
        findingIds: [],
        status: 'suspected',
        createdAt: '',
        updatedAt: '',
      },
    ];
    const questions: Question[] = [
      { id: 'q1', text: 'a', status: 'open', linkedFindingIds: [], createdAt: '', updatedAt: '' },
      {
        id: 'q2',
        text: 'b',
        status: 'investigating',
        linkedFindingIds: [],
        createdAt: '',
        updatedAt: '',
      },
      {
        id: 'q3',
        text: 'unused',
        status: 'open',
        linkedFindingIds: [],
        createdAt: '',
        updatedAt: '',
      },
    ];
    const result = selectQuestionsForHub('h1', hubs, questions);
    expect(result.map(q => q.id)).toEqual(['q1', 'q2']);
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `pnpm --filter @variscout/stores test -- --run wallSelectors.test`
Expected: FAIL — `Cannot find module '../wallSelectors'`.

- [ ] **Step 3: Implement selectors**

Create `packages/stores/src/wallSelectors.ts`:

```ts
import type {
  SuspectedCause,
  Finding,
  FindingComment,
  Question,
  ProcessMap,
  ProcessMapTributary,
} from '@variscout/core';

export interface HubCommentEntry extends FindingComment {
  source: 'hub' | 'finding';
  findingId?: string;
}

export function selectHubCommentStream(
  hubId: string,
  hubs: SuspectedCause[],
  findings: Finding[]
): HubCommentEntry[] {
  const hub = hubs.find(h => h.id === hubId);
  if (!hub) return [];
  const entries: HubCommentEntry[] = [];
  for (const c of hub.comments ?? []) entries.push({ ...c, source: 'hub' });
  for (const fid of hub.findingIds) {
    const f = findings.find(x => x.id === fid);
    if (!f) continue;
    for (const c of f.comments) entries.push({ ...c, source: 'finding', findingId: fid });
  }
  return entries.sort((a, b) => a.createdAt - b.createdAt);
}

export function selectHypothesisTributaries(
  hub: SuspectedCause,
  findings: Finding[],
  processMap: ProcessMap | undefined
): ProcessMapTributary[] {
  if (!processMap) return [];
  if (hub.tributaryIds && hub.tributaryIds.length > 0) {
    const idSet = new Set(hub.tributaryIds);
    return processMap.tributaries.filter(t => idSet.has(t.id));
  }
  // Derive from findings' columns when possible.
  const columns = new Set<string>();
  for (const fid of hub.findingIds) {
    const f = findings.find(x => x.id === fid);
    if (!f?.source) continue;
    // FindingSource doesn't carry its column directly; the derive-condition step
    // resolves it via chart state at brush time. Absent that, we fall back to
    // any context.activeFilters the finding captured — columns used as filters
    // are almost always the tributary columns the analyst cared about.
    Object.keys(f.context.activeFilters).forEach(c => columns.add(c));
  }
  return processMap.tributaries
    .filter(t => columns.has(t.column))
    .sort((a, b) => {
      const ai = processMap.nodes.findIndex(n => n.id === a.stepId);
      const bi = processMap.nodes.findIndex(n => n.id === b.stepId);
      return ai - bi;
    });
}

export function selectOpenQuestionsWithoutHub(
  questions: Question[],
  hubs: SuspectedCause[]
): Question[] {
  const inHub = new Set(hubs.flatMap(h => h.questionIds));
  return questions.filter(q => q.status === 'open' && !inHub.has(q.id));
}

export function selectQuestionsForHub(
  hubId: string,
  hubs: SuspectedCause[],
  questions: Question[]
): Question[] {
  const hub = hubs.find(h => h.id === hubId);
  if (!hub) return [];
  const ids = new Set(hub.questionIds);
  return questions.filter(q => ids.has(q.id));
}
```

- [ ] **Step 4: Run test to verify pass**

Run: `pnpm --filter @variscout/stores test -- --run wallSelectors.test`
Expected: PASS — all selector tests green.

- [ ] **Step 5: Export from stores barrel**

In `packages/stores/src/index.ts`, add:

```ts
export { useWallLayoutStore, persistWallLayout, rehydrateWallLayout } from './wallLayoutStore';
export type {
  WallLayoutState,
  WallLayoutActions,
  ChartClusterState,
  AndCheckSnapshot,
  PendingComment,
  NodeId,
  TributaryId,
  GateNodePath,
} from './wallLayoutStore';
export {
  selectHubCommentStream,
  selectHypothesisTributaries,
  selectOpenQuestionsWithoutHub,
  selectQuestionsForHub,
} from './wallSelectors';
export type { HubCommentEntry } from './wallSelectors';
```

- [ ] **Step 6: Commit**

```bash
git add packages/stores/src/wallSelectors.ts packages/stores/src/__tests__/wallSelectors.test.ts packages/stores/src/index.ts
git commit -m "feat(wall): selectors — hub comment stream, tributaries, orphan questions"
```

**─── PHASE 4 COMPLETE — store + selectors in place. Run `pnpm test` at root. ───**

---

## ─── PHASE 5: CoScout tool registry + Tier 2 prompt ───

### Task 5.1: Add `critique_investigation_state` tool

**Files:**

- Modify: `packages/core/src/ai/prompts/coScout/tools/registry.ts`
- Modify: `packages/core/src/ai/__tests__/toolRegistry.test.ts`

- [ ] **Step 1: Add failing test**

Append to `packages/core/src/ai/__tests__/toolRegistry.test.ts`:

```ts
describe('Wall critique tool', () => {
  it('registers critique_investigation_state as read tool in investigate phase', () => {
    expect(TOOL_REGISTRY.critique_investigation_state).toBeDefined();
    expect(TOOL_REGISTRY.critique_investigation_state.classification).toBe('read');
    expect(TOOL_REGISTRY.critique_investigation_state.phases).toContain('investigate');
  });

  it('getToolsForPhase includes critique tool when phase is investigate', () => {
    const tools = getToolsForPhase({ journeyPhase: 'investigate' });
    expect(tools.some(t => t.name === 'critique_investigation_state')).toBe(true);
  });

  it('getToolsForPhase excludes critique tool in frame phase', () => {
    const tools = getToolsForPhase({ journeyPhase: 'frame' });
    expect(tools.some(t => t.name === 'critique_investigation_state')).toBe(false);
  });
});
```

Verify the import statement at the top of that test file already includes `TOOL_REGISTRY` and `getToolsForPhase` — add if missing.

- [ ] **Step 2: Run to verify failure**

Run: `pnpm --filter @variscout/core test -- --run toolRegistry.test`
Expected: FAIL — `TOOL_REGISTRY.critique_investigation_state is undefined`.

- [ ] **Step 3: Register the tool**

In `packages/core/src/ai/prompts/coScout/tools/registry.ts`, after the `answer_question` entry (or anywhere in the registry object), add:

```ts
  critique_investigation_state: {
    definition: {
      type: 'function',
      name: 'critique_investigation_state',
      description:
        'Identify gaps in the current investigation: hypotheses missing disconfirmation attempts, open questions lacking a hypothesis, promising columns not yet hypothesized, stale questions. Returns a structured gap array for the Wall rail critique feed.',
      parameters: {
        type: 'object',
        properties: {},
        additionalProperties: false,
        strict: true,
      },
    },
    classification: 'read',
    phases: ['investigate'],
  },
```

- [ ] **Step 4: Run test to verify pass**

Run: `pnpm --filter @variscout/core test -- --run toolRegistry.test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/core/src/ai/prompts/coScout/tools/registry.ts packages/core/src/ai/__tests__/toolRegistry.test.ts
git commit -m "feat(wall): register critique_investigation_state CoScout tool"
```

### Task 5.2: Add `propose_hypothesis_from_finding` action tool

**Files:**

- Modify: `packages/core/src/ai/prompts/coScout/tools/registry.ts`
- Modify: `packages/core/src/ai/__tests__/toolRegistry.test.ts`

- [ ] **Step 1: Add failing test**

Append:

```ts
describe('Wall propose_hypothesis_from_finding tool', () => {
  it('registers as an action tool (requires user confirmation)', () => {
    expect(TOOL_REGISTRY.propose_hypothesis_from_finding).toBeDefined();
    expect(TOOL_REGISTRY.propose_hypothesis_from_finding.classification).toBe('action');
    expect(TOOL_REGISTRY.propose_hypothesis_from_finding.phases).toContain('investigate');
  });

  it('requires finding_id and hypothesis_name parameters', () => {
    const required = TOOL_REGISTRY.propose_hypothesis_from_finding.definition.parameters.required;
    expect(required).toContain('finding_id');
    expect(required).toContain('hypothesis_name');
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `pnpm --filter @variscout/core test -- --run toolRegistry.test`
Expected: FAIL — `propose_hypothesis_from_finding is undefined`.

- [ ] **Step 3: Register the action tool**

Add to the registry:

```ts
  propose_hypothesis_from_finding: {
    definition: {
      type: 'function',
      name: 'propose_hypothesis_from_finding',
      description:
        'Create a new suspected-cause hub seeded with an existing finding as first evidence. Condition auto-derives from the finding\'s source. Requires analyst confirmation before the hub is committed.',
      parameters: {
        type: 'object',
        properties: {
          finding_id: {
            type: 'string',
            description: 'ID of the finding that provides initial evidence for the hypothesis',
          },
          hypothesis_name: {
            type: 'string',
            description: 'Short analyst-ready label for the hypothesis',
          },
        },
        required: ['finding_id', 'hypothesis_name'],
        additionalProperties: false,
        strict: true,
      },
    },
    classification: 'action',
    phases: ['investigate'],
  },
```

- [ ] **Step 4: Run test to verify pass**

Run: `pnpm --filter @variscout/core test -- --run toolRegistry.test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/core/src/ai/prompts/coScout/tools/registry.ts packages/core/src/ai/__tests__/toolRegistry.test.ts
git commit -m "feat(wall): register propose_hypothesis_from_finding action tool"
```

### Task 5.3: Tier 2 investigation discipline prompt

**Files:**

- Create: `packages/core/src/ai/prompts/coScout/tier2/investigationDiscipline.ts`
- Modify: `packages/core/src/ai/prompts/coScout/tier2/index.ts`
- Test: `packages/core/src/ai/__tests__/promptSafety.test.ts` (add check)

- [ ] **Step 1: Add failing prompt-safety test**

Append to `packages/core/src/ai/__tests__/promptSafety.test.ts` (or create if needed):

```ts
import { investigationDisciplinePrompt } from '../prompts/coScout/tier2/investigationDiscipline';

describe('investigationDisciplinePrompt', () => {
  it('never uses the phrase "root cause"', () => {
    expect(investigationDisciplinePrompt.toLowerCase()).not.toContain('root cause');
  });

  it('never uses interaction-moderator language', () => {
    expect(investigationDisciplinePrompt.toLowerCase()).not.toContain('moderator');
    expect(investigationDisciplinePrompt.toLowerCase()).not.toContain('primary factor');
  });

  it('mentions disconfirmation, questions, best-subsets, and REF tokens', () => {
    const lower = investigationDisciplinePrompt.toLowerCase();
    expect(lower).toContain('disconfirmation');
    expect(lower).toContain('question');
    expect(lower).toContain('best-subsets');
    expect(lower).toContain('ref');
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `pnpm --filter @variscout/core test -- --run promptSafety.test`
Expected: FAIL — `Cannot find module '../prompts/coScout/tier2/investigationDiscipline'`.

- [ ] **Step 3: Write the prompt module**

Create `packages/core/src/ai/prompts/coScout/tier2/investigationDiscipline.ts`:

```ts
/**
 * Tier 2 coaching prompt for CoScout when the analyst is in the Investigation
 * phase (applies to both Map and Wall views — coaching is view-agnostic).
 *
 * Terminology rules (ESLint `no-root-cause-language`, `no-interaction-moderator`):
 * - Never "root cause" — use "contribution" or "suspected cause"
 * - Never "moderator" / "primary factor" — describe interactions as ordinal / disordinal
 * - Reference chart elements via REF tokens (ADR-057), never raw row indices
 */

export const investigationDisciplinePrompt = `When the analyst is in the Investigation phase:
- Prioritize disconfirmation over confirmation. Flag hypotheses with 3 or more supporters and no attempted contradictor.
- For each hypothesis without a guiding question, propose one.
- When best-subsets reveals a column with ΔR²adj > 0.10 that no hypothesis covers, suggest adding it.
- Describe hypotheses as contributions or suspected causes.
- Reference chart elements via REF tokens (ADR-057), never raw row indices.
- Describe interaction findings as ordinal or disordinal.`;
```

- [ ] **Step 4: Wire it into Tier 2 assembly**

Open `packages/core/src/ai/prompts/coScout/tier2/index.ts` and add the export + include it in whatever composes the tier-2 block. If there's a `composeTier2(phase)` function, add a branch for the `'investigate'` phase that includes this prompt. Example pattern (adapt to whatever exists):

```ts
export { investigationDisciplinePrompt } from './investigationDiscipline';

// In the phase-specific assembler (example):
if (phase === 'investigate') {
  blocks.push(investigationDisciplinePrompt);
}
```

- [ ] **Step 5: Run test to verify pass**

Run: `pnpm --filter @variscout/core test -- --run promptSafety.test`
Expected: PASS.

- [ ] **Step 6: Run full core tests to check no regressions**

Run: `pnpm --filter @variscout/core test`
Expected: all green including ESLint `no-root-cause-language` check (runs during test).

- [ ] **Step 7: Commit**

```bash
git add packages/core/src/ai/prompts/coScout/tier2/investigationDiscipline.ts packages/core/src/ai/prompts/coScout/tier2/index.ts packages/core/src/ai/__tests__/promptSafety.test.ts
git commit -m "feat(wall): Tier 2 investigation discipline coaching prompt"
```

**─── PHASE 5 COMPLETE — CoScout knows about the Wall. 27 tools, Tier 2 updated. ───**

---

## ─── PHASE 6: Wall canvas primitives (@variscout/charts) ───

**Directory layout** — create `packages/charts/src/InvestigationWall/` mirroring `packages/charts/src/EvidenceMap/`:

```
InvestigationWall/
├── index.ts
├── WallCanvas.tsx
├── ProblemConditionCard.tsx
├── HypothesisCard.tsx
├── QuestionPill.tsx
├── FindingChip.tsx
├── GateBadge.tsx
├── NarratorRail.tsx
├── TributaryFooter.tsx
├── MissingEvidenceDigest.tsx
├── EmptyState.tsx
├── ContextMenu.tsx
├── Minimap.tsx
├── SearchPalette.tsx
├── MobileCardList.tsx
├── types.ts
├── hooks/
│   ├── useWallKeyboard.ts
│   └── useWallDragDrop.ts
└── __tests__/
    ├── HypothesisCard.test.tsx
    ├── QuestionPill.test.tsx
    ├── GateBadge.test.tsx
    ├── ProblemConditionCard.test.tsx
    ├── EmptyState.test.tsx
    └── WallCanvas.test.tsx
```

Follow `@variscout/ui` rules from `packages/ui/CLAUDE.md`: no nested `<button>`, functional components only, semantic Tailwind classes (`bg-surface-secondary`, `text-content`, `border-edge`), Props interfaces named `{ComponentName}Props`.

### Task 6.1: `ProblemConditionCard`

**Files:**

- Create: `packages/charts/src/InvestigationWall/ProblemConditionCard.tsx`
- Create: `packages/charts/src/InvestigationWall/types.ts`
- Test: `packages/charts/src/InvestigationWall/__tests__/ProblemConditionCard.test.tsx`

- [ ] **Step 1: Write failing test**

Create `packages/charts/src/InvestigationWall/__tests__/ProblemConditionCard.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ProblemConditionCard } from '../ProblemConditionCard';

describe('ProblemConditionCard', () => {
  it('renders CTS column, Cpk, and event rate', () => {
    render(
      <svg>
        <ProblemConditionCard
          ctsColumn="Fill < LSL on night shift"
          cpk={0.78}
          eventsPerWeek={42}
          x={600}
          y={40}
        />
      </svg>
    );
    expect(screen.getByText(/Fill < LSL/)).toBeInTheDocument();
    expect(screen.getByText(/0\.78/)).toBeInTheDocument();
    expect(screen.getByText(/42/)).toBeInTheDocument();
  });

  it('is focusable and has aria-label', () => {
    render(
      <svg>
        <ProblemConditionCard ctsColumn="Fill" cpk={1.0} eventsPerWeek={10} x={0} y={0} />
      </svg>
    );
    const g = screen.getByRole('button', { name: /problem condition/i });
    expect(g.tabIndex).toBe(0);
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `pnpm --filter @variscout/charts test -- --run ProblemConditionCard.test`
Expected: FAIL — module not found.

- [ ] **Step 3: Write component**

First create shared types at `packages/charts/src/InvestigationWall/types.ts`:

```ts
export interface Point {
  x: number;
  y: number;
}

export type WallStatus = 'proposed' | 'evidenced' | 'confirmed' | 'refuted';
```

Then create `packages/charts/src/InvestigationWall/ProblemConditionCard.tsx`:

```tsx
import React from 'react';

export interface ProblemConditionCardProps {
  ctsColumn: string;
  cpk: number;
  eventsPerWeek: number;
  x: number;
  y: number;
}

const CARD_W = 320;
const CARD_H = 80;

export const ProblemConditionCard: React.FC<ProblemConditionCardProps> = ({
  ctsColumn,
  cpk,
  eventsPerWeek,
  x,
  y,
}) => {
  const label = `Problem condition: ${ctsColumn}, Cpk ${cpk.toFixed(2)}, ${eventsPerWeek} events per week`;
  return (
    <g
      role="button"
      tabIndex={0}
      aria-label={label}
      transform={`translate(${x - CARD_W / 2}, ${y})`}
    >
      <rect
        width={CARD_W}
        height={CARD_H}
        rx={8}
        className="fill-surface-secondary stroke-[var(--color-danger,#ef5e7c)]"
        strokeWidth={2}
      />
      <text
        x={CARD_W / 2}
        y={28}
        textAnchor="middle"
        className="fill-content font-semibold text-sm"
      >
        Problem condition
      </text>
      <text x={CARD_W / 2} y={50} textAnchor="middle" className="fill-content-muted text-xs">
        {ctsColumn} · Cpk {cpk.toFixed(2)}
      </text>
      <text
        x={CARD_W / 2}
        y={70}
        textAnchor="middle"
        className="fill-content-subtle text-[10px] font-mono"
      >
        {eventsPerWeek} events/wk
      </text>
    </g>
  );
};
```

- [ ] **Step 4: Run test to verify pass**

Run: `pnpm --filter @variscout/charts test -- --run ProblemConditionCard.test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/charts/src/InvestigationWall/types.ts packages/charts/src/InvestigationWall/ProblemConditionCard.tsx packages/charts/src/InvestigationWall/__tests__/ProblemConditionCard.test.tsx
git commit -m "feat(wall): ProblemConditionCard SVG primitive"
```

### Task 6.2: `HypothesisCard`

**Files:**

- Create: `packages/charts/src/InvestigationWall/HypothesisCard.tsx`
- Test: `packages/charts/src/InvestigationWall/__tests__/HypothesisCard.test.tsx`

- [ ] **Step 1: Write failing test**

Create the test file:

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { HypothesisCard } from '../HypothesisCard';
import type { SuspectedCause } from '@variscout/core';

const hub: SuspectedCause = {
  id: 'h1',
  name: 'Nozzle runs hot on night shift',
  synthesis: '',
  questionIds: [],
  findingIds: ['f1', 'f2', 'f3'],
  status: 'confirmed',
  createdAt: '',
  updatedAt: '',
};

describe('HypothesisCard', () => {
  it('renders hub name and status', () => {
    render(
      <svg>
        <HypothesisCard hub={hub} displayStatus="confirmed" x={0} y={0} />
      </svg>
    );
    expect(screen.getByText(/Nozzle runs hot on night shift/)).toBeInTheDocument();
    expect(screen.getByText(/confirmed/i)).toBeInTheDocument();
  });

  it('shows findings count', () => {
    render(
      <svg>
        <HypothesisCard hub={hub} displayStatus="confirmed" x={0} y={0} />
      </svg>
    );
    expect(screen.getByText(/3 findings/)).toBeInTheDocument();
  });

  it('fires onSelect on click', () => {
    const onSelect = vi.fn();
    render(
      <svg>
        <HypothesisCard hub={hub} displayStatus="evidenced" x={0} y={0} onSelect={onSelect} />
      </svg>
    );
    fireEvent.click(screen.getByRole('button', { name: /hypothesis/i }));
    expect(onSelect).toHaveBeenCalledWith('h1');
  });

  it('shows warning badge when hasGap is true', () => {
    render(
      <svg>
        <HypothesisCard hub={hub} displayStatus="confirmed" x={0} y={0} hasGap />
      </svg>
    );
    expect(screen.getByLabelText(/evidence gap/i)).toBeInTheDocument();
  });

  it('renders status-tinted border via CSS class', () => {
    const { container } = render(
      <svg>
        <HypothesisCard hub={hub} displayStatus="refuted" x={0} y={0} />
      </svg>
    );
    expect(container.querySelector('rect.hub-card')?.getAttribute('data-status')).toBe('refuted');
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `pnpm --filter @variscout/charts test -- --run HypothesisCard.test`
Expected: FAIL.

- [ ] **Step 3: Implement the component**

Create `packages/charts/src/InvestigationWall/HypothesisCard.tsx`:

```tsx
import React from 'react';
import type { SuspectedCause } from '@variscout/core';
import type { WallStatus } from './types';

export interface HypothesisCardProps {
  hub: SuspectedCause;
  displayStatus: WallStatus;
  x: number;
  y: number;
  hasGap?: boolean;
  onSelect?: (hubId: string) => void;
  onContextMenu?: (hubId: string, event: React.MouseEvent) => void;
}

const CARD_W = 280;
const CARD_H = 180;

const STATUS_LABEL: Record<WallStatus, string> = {
  proposed: 'Proposed',
  evidenced: 'Evidenced',
  confirmed: 'Confirmed',
  refuted: 'Refuted',
};

export const HypothesisCard: React.FC<HypothesisCardProps> = ({
  hub,
  displayStatus,
  x,
  y,
  hasGap,
  onSelect,
  onContextMenu,
}) => {
  const label = `Hypothesis ${hub.name}, ${STATUS_LABEL[displayStatus]}, ${hub.findingIds.length} findings`;
  return (
    <g
      role="button"
      tabIndex={0}
      aria-label={label}
      transform={`translate(${x - CARD_W / 2}, ${y})`}
      onClick={() => onSelect?.(hub.id)}
      onContextMenu={e => {
        e.preventDefault();
        onContextMenu?.(hub.id, e);
      }}
      onKeyDown={e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect?.(hub.id);
        }
      }}
      className="cursor-pointer"
    >
      <rect
        className="hub-card fill-surface-secondary stroke-current"
        data-status={displayStatus}
        width={CARD_W}
        height={CARD_H}
        rx={12}
        strokeWidth={2}
      />
      <text
        x={16}
        y={24}
        className="fill-content-subtle text-[10px] uppercase tracking-wide font-mono"
      >
        Hypothesis · {STATUS_LABEL[displayStatus]}
      </text>
      <text x={16} y={48} className="fill-content font-semibold text-sm">
        {hub.name}
      </text>
      {/* Mini-chart slot — integrates LTTB sparkline in Phase 7.5 */}
      <rect x={16} y={64} width={CARD_W - 32} height={72} rx={4} className="fill-surface" />
      <text x={16} y={CARD_H - 16} className="fill-content-muted text-xs font-mono">
        {hub.findingIds.length} findings
      </text>
      {hasGap && (
        <g aria-label="Evidence gap">
          <circle cx={CARD_W - 24} cy={24} r={10} className="fill-[var(--color-warning,#f59e0b)]" />
          <text x={CARD_W - 24} y={28} textAnchor="middle" className="fill-black text-xs font-bold">
            !
          </text>
        </g>
      )}
    </g>
  );
};
```

- [ ] **Step 4: Run test to verify pass**

Run: `pnpm --filter @variscout/charts test -- --run HypothesisCard.test`
Expected: PASS — 5 tests green.

- [ ] **Step 5: Commit**

```bash
git add packages/charts/src/InvestigationWall/HypothesisCard.tsx packages/charts/src/InvestigationWall/__tests__/HypothesisCard.test.tsx
git commit -m "feat(wall): HypothesisCard SVG primitive with status borders + gap badge"
```

### Task 6.3: `QuestionPill`

**Files:**

- Create: `packages/charts/src/InvestigationWall/QuestionPill.tsx`
- Test: `packages/charts/src/InvestigationWall/__tests__/QuestionPill.test.tsx`

- [ ] **Step 1: Write failing test**

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { QuestionPill } from '../QuestionPill';

describe('QuestionPill', () => {
  it('renders the question text and ? glyph', () => {
    render(
      <svg>
        <QuestionPill questionId="q1" text="Why is night different?" status="open" x={0} y={0} />
      </svg>
    );
    expect(screen.getByText(/Why is night different\?/)).toBeInTheDocument();
  });

  it('calls onPromote on right-click action', () => {
    const onPromote = vi.fn();
    render(
      <svg>
        <QuestionPill questionId="q1" text="Test" status="open" x={0} y={0} onPromote={onPromote} />
      </svg>
    );
    fireEvent.contextMenu(screen.getByRole('button', { name: /question/i }));
    expect(onPromote).toHaveBeenCalledWith('q1');
  });

  it('styles ruled-out questions with strikethrough', () => {
    const { container } = render(
      <svg>
        <QuestionPill questionId="q1" text="No" status="ruled-out" x={0} y={0} />
      </svg>
    );
    expect(container.querySelector('[data-status="ruled-out"]')).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `pnpm --filter @variscout/charts test -- --run QuestionPill.test`
Expected: FAIL.

- [ ] **Step 3: Implement**

Create `packages/charts/src/InvestigationWall/QuestionPill.tsx`:

```tsx
import React from 'react';
import type { QuestionStatus } from '@variscout/core';

export interface QuestionPillProps {
  questionId: string;
  text: string;
  status: QuestionStatus;
  x: number;
  y: number;
  onSelect?: (id: string) => void;
  onPromote?: (id: string) => void;
}

const PILL_W = 220;
const PILL_H = 28;

export const QuestionPill: React.FC<QuestionPillProps> = ({
  questionId,
  text,
  status,
  x,
  y,
  onSelect,
  onPromote,
}) => {
  return (
    <g
      role="button"
      tabIndex={0}
      aria-label={`Question: ${text}, ${status}`}
      transform={`translate(${x - PILL_W / 2}, ${y})`}
      onClick={() => onSelect?.(questionId)}
      onContextMenu={e => {
        e.preventDefault();
        onPromote?.(questionId);
      }}
      data-status={status}
      className="cursor-pointer"
    >
      <rect
        width={PILL_W}
        height={PILL_H}
        rx={PILL_H / 2}
        className="fill-surface stroke-edge"
        strokeDasharray={status === 'open' ? '4 2' : '0'}
      />
      <text x={14} y={PILL_H / 2 + 4} className="fill-content-muted text-xs font-mono">
        ?
      </text>
      <text x={28} y={PILL_H / 2 + 4} className="fill-content text-xs">
        {status === 'ruled-out' ? <tspan textDecoration="line-through">{text}</tspan> : text}
      </text>
    </g>
  );
};
```

- [ ] **Step 4: Run test to verify pass**

Run: `pnpm --filter @variscout/charts test -- --run QuestionPill.test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/charts/src/InvestigationWall/QuestionPill.tsx packages/charts/src/InvestigationWall/__tests__/QuestionPill.test.tsx
git commit -m "feat(wall): QuestionPill SVG primitive with promote-to-hypothesis"
```

### Task 6.4: `GateBadge` (AND / OR / NOT + HOLDS X/Y)

**Files:**

- Create: `packages/charts/src/InvestigationWall/GateBadge.tsx`
- Test: `packages/charts/src/InvestigationWall/__tests__/GateBadge.test.tsx`

- [ ] **Step 1: Write failing test**

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { GateBadge } from '../GateBadge';

describe('GateBadge', () => {
  it('renders AND with HOLDS badge', () => {
    render(
      <svg>
        <GateBadge kind="and" gatePath="root" holds={38} total={42} x={0} y={0} />
      </svg>
    );
    expect(screen.getByText('AND')).toBeInTheDocument();
    expect(screen.getByText(/38/)).toBeInTheDocument();
    expect(screen.getByText(/42/)).toBeInTheDocument();
  });

  it('renders OR label', () => {
    render(
      <svg>
        <GateBadge kind="or" gatePath="root.0" x={0} y={0} />
      </svg>
    );
    expect(screen.getByText('OR')).toBeInTheDocument();
  });

  it('renders NOT label with glyph', () => {
    render(
      <svg>
        <GateBadge kind="not" gatePath="root" x={0} y={0} />
      </svg>
    );
    expect(screen.getByText('NOT')).toBeInTheDocument();
  });

  it('fires onRun on click', () => {
    const onRun = vi.fn();
    render(
      <svg>
        <GateBadge kind="and" gatePath="root" x={0} y={0} onRun={onRun} />
      </svg>
    );
    fireEvent.click(screen.getByRole('button', { name: /gate/i }));
    expect(onRun).toHaveBeenCalledWith('root');
  });

  it('renders em-dash for empty data total', () => {
    render(
      <svg>
        <GateBadge kind="and" gatePath="root" holds={0} total={0} x={0} y={0} />
      </svg>
    );
    expect(screen.getByText(/—\/0/)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `pnpm --filter @variscout/charts test -- --run GateBadge.test`
Expected: FAIL.

- [ ] **Step 3: Implement**

Create `packages/charts/src/InvestigationWall/GateBadge.tsx`:

```tsx
import React from 'react';

export interface GateBadgeProps {
  kind: 'and' | 'or' | 'not';
  gatePath: string;
  holds?: number;
  total?: number;
  x: number;
  y: number;
  onRun?: (gatePath: string) => void;
  onContextMenu?: (gatePath: string, event: React.MouseEvent) => void;
}

const GATE_R = 22;

export const GateBadge: React.FC<GateBadgeProps> = ({
  kind,
  gatePath,
  holds,
  total,
  x,
  y,
  onRun,
  onContextMenu,
}) => {
  const label = kind.toUpperCase();
  const glyph = kind === 'not' ? '⊘' : '◇';
  const holdsText =
    holds === undefined || total === undefined
      ? ''
      : total === 0
        ? '—/0'
        : `HOLDS ${holds}/${total}`;
  return (
    <g
      role="button"
      tabIndex={0}
      aria-label={`Gate ${label} ${holdsText}`}
      transform={`translate(${x}, ${y})`}
      onClick={() => onRun?.(gatePath)}
      onContextMenu={e => {
        e.preventDefault();
        onContextMenu?.(gatePath, e);
      }}
      className="cursor-pointer"
    >
      <text
        x={0}
        y={0}
        textAnchor="middle"
        className="fill-[var(--color-warning,#eab308)] text-2xl"
      >
        {glyph}
      </text>
      <text
        x={0}
        y={5}
        textAnchor="middle"
        className="fill-content font-mono text-[10px] font-bold pointer-events-none"
      >
        {label}
      </text>
      {holdsText && (
        <text x={GATE_R + 8} y={5} className="fill-content-muted text-xs font-mono">
          {holdsText}
        </text>
      )}
    </g>
  );
};
```

- [ ] **Step 4: Run test to verify pass**

Run: `pnpm --filter @variscout/charts test -- --run GateBadge.test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/charts/src/InvestigationWall/GateBadge.tsx packages/charts/src/InvestigationWall/__tests__/GateBadge.test.tsx
git commit -m "feat(wall): GateBadge primitive with HOLDS X/Y rendering"
```

### Task 6.5: Remaining primitives — batched TDD

Apply the same TDD pattern (test → fail → minimal impl → pass → commit) for each:

| Component               | Primary responsibility                                                   | Test count target |
| ----------------------- | ------------------------------------------------------------------------ | ----------------- |
| `FindingChip`           | Small chip rendering a `Finding` with tether-line anchor                 | 3                 |
| `NarratorRail`          | Right-rail evolving pane; renders coach cards / CoScout thread; hideable | 4                 |
| `TributaryFooter`       | Chip row bound to `ProcessMap.tributaries`; orphan-dimmed                | 3                 |
| `MissingEvidenceDigest` | Collapsed/expandable gap list; click-to-focus                            | 3                 |
| `EmptyState`            | Three CTAs; calls callbacks                                              | 3                 |
| `ContextMenu`           | Generic right-click menu, positioned; keyboard-navigable                 | 3                 |
| `Minimap`               | 160×100 thumbnail; click-to-pan; syncs with `wallLayoutStore.pan`        | 2                 |
| `SearchPalette`         | ⌘K filter across hubs/questions/findings by text/status/tributary        | 4                 |
| `MobileCardList`        | Responsive list rendering of the same graph                              | 3                 |

For each, write ≤200-line tests covering: renders expected data, fires callbacks on interaction, handles empty state. Keep components ≤200 lines each; if you exceed, split sub-components.

**Commit after each component**: `feat(wall): <ComponentName> primitive`.

### Task 6.6: `WallCanvas` — top-level composition

**Files:**

- Create: `packages/charts/src/InvestigationWall/WallCanvas.tsx`
- Create: `packages/charts/src/InvestigationWall/index.ts`
- Test: `packages/charts/src/InvestigationWall/__tests__/WallCanvas.test.tsx`

- [ ] **Step 1: Write failing integration test**

```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { WallCanvas } from '../WallCanvas';
import type { SuspectedCause, ProcessMap } from '@variscout/core';

const processMap: ProcessMap = {
  version: 1,
  nodes: [{ id: 'n1', name: 'Fill', order: 0 }],
  tributaries: [{ id: 't1', stepId: 'n1', column: 'SHIFT' }],
  ctsColumn: 'FILL',
  createdAt: '',
  updatedAt: '',
};

const hub: SuspectedCause = {
  id: 'h1',
  name: 'Nozzle runs hot',
  synthesis: '',
  questionIds: [],
  findingIds: ['f1', 'f2', 'f3'],
  status: 'confirmed',
  createdAt: '',
  updatedAt: '',
};

describe('WallCanvas', () => {
  it('renders empty state when no hubs', () => {
    render(
      <WallCanvas
        hubs={[]}
        findings={[]}
        questions={[]}
        processMap={processMap}
        problemCpk={0.78}
        eventsPerWeek={42}
      />
    );
    expect(screen.getByText(/Start with a hypothesis/i)).toBeInTheDocument();
  });

  it('renders Problem card + hub cards when hubs present', () => {
    render(
      <WallCanvas
        hubs={[hub]}
        findings={[]}
        questions={[]}
        processMap={processMap}
        problemCpk={0.78}
        eventsPerWeek={42}
      />
    );
    expect(screen.getByText(/Problem condition/i)).toBeInTheDocument();
    expect(screen.getByText(/Nozzle runs hot/i)).toBeInTheDocument();
  });

  it('renders tributary footer row', () => {
    render(
      <WallCanvas
        hubs={[hub]}
        findings={[]}
        questions={[]}
        processMap={processMap}
        problemCpk={0.78}
        eventsPerWeek={42}
      />
    );
    expect(screen.getByText(/SHIFT/)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `pnpm --filter @variscout/charts test -- --run WallCanvas.test`
Expected: FAIL.

- [ ] **Step 3: Implement**

Create `packages/charts/src/InvestigationWall/WallCanvas.tsx`:

```tsx
import React from 'react';
import type { SuspectedCause, Finding, Question, ProcessMap, GateNode } from '@variscout/core';
import { ProblemConditionCard } from './ProblemConditionCard';
import { HypothesisCard } from './HypothesisCard';
import { QuestionPill } from './QuestionPill';
import { TributaryFooter } from './TributaryFooter';
import { EmptyState } from './EmptyState';
import { MissingEvidenceDigest } from './MissingEvidenceDigest';
import type { WallStatus } from './types';

export interface WallCanvasProps {
  hubs: SuspectedCause[];
  findings: Finding[];
  questions: Question[];
  processMap: ProcessMap;
  problemCpk: number;
  eventsPerWeek: number;
  problemContributionTree?: GateNode;
  gapsByHubId?: Record<string, boolean>;
  onSelectHub?: (id: string) => void;
  onPromoteQuestion?: (id: string) => void;
  onWriteHypothesis?: () => void;
  onPromoteFromQuestion?: () => void;
  onSeedFromFactorIntel?: () => void;
}

const CANVAS_W = 2000;
const CANVAS_H = 1400;

function deriveDisplayStatus(hub: SuspectedCause, findings: Finding[]): WallStatus {
  if (hub.status === 'confirmed') return 'confirmed';
  if (hub.status === 'not-confirmed') return 'refuted';
  const supporting = hub.findingIds
    .map(id => findings.find(f => f.id === id))
    .filter(Boolean) as Finding[];
  const hasContradictor = supporting.some(f => f.validationStatus === 'contradicts');
  if (supporting.length >= 1 && !hasContradictor) return 'evidenced';
  return 'proposed';
}

export const WallCanvas: React.FC<WallCanvasProps> = ({
  hubs,
  findings,
  questions,
  processMap,
  problemCpk,
  eventsPerWeek,
  gapsByHubId = {},
  onSelectHub,
  onPromoteQuestion,
  onWriteHypothesis,
  onPromoteFromQuestion,
  onSeedFromFactorIntel,
}) => {
  if (hubs.length === 0) {
    return (
      <EmptyState
        onWriteHypothesis={onWriteHypothesis}
        onPromoteFromQuestion={onPromoteFromQuestion}
        onSeedFromFactorIntel={onSeedFromFactorIntel}
      />
    );
  }

  const problemLabel = processMap.ctsColumn ?? 'CTS';

  // Hypothesis band layout: equal spacing along x.
  const hubY = 400;
  const hubSpacing = CANVAS_W / (hubs.length + 1);

  return (
    <svg
      viewBox={`0 0 ${CANVAS_W} ${CANVAS_H}`}
      preserveAspectRatio="xMidYMid meet"
      className="bg-background text-content"
      role="img"
      aria-label="Investigation Wall canvas"
    >
      <ProblemConditionCard
        ctsColumn={problemLabel}
        cpk={problemCpk}
        eventsPerWeek={eventsPerWeek}
        x={CANVAS_W / 2}
        y={40}
      />

      <line
        x1={80}
        x2={CANVAS_W - 80}
        y1={280}
        y2={280}
        className="stroke-edge"
        strokeDasharray="4 6"
      />

      {hubs.map((hub, idx) => (
        <HypothesisCard
          key={hub.id}
          hub={hub}
          displayStatus={deriveDisplayStatus(hub, findings)}
          x={hubSpacing * (idx + 1)}
          y={hubY}
          hasGap={gapsByHubId[hub.id]}
          onSelect={onSelectHub}
        />
      ))}

      {questions
        .filter(q => q.status === 'open' && !hubs.some(h => h.questionIds.includes(q.id)))
        .map((q, idx) => (
          <QuestionPill
            key={q.id}
            questionId={q.id}
            text={q.text}
            status={q.status}
            x={200 + idx * 240}
            y={900}
            onPromote={onPromoteQuestion}
          />
        ))}

      <TributaryFooter
        tributaries={processMap.tributaries}
        hubs={hubs}
        y={1300}
        canvasWidth={CANVAS_W}
      />

      <MissingEvidenceDigest
        hubs={hubs}
        gapsByHubId={gapsByHubId}
        y={CANVAS_H - 60}
        canvasWidth={CANVAS_W}
      />
    </svg>
  );
};
```

And `packages/charts/src/InvestigationWall/index.ts`:

```ts
export { WallCanvas } from './WallCanvas';
export type { WallCanvasProps } from './WallCanvas';
export { ProblemConditionCard } from './ProblemConditionCard';
export { HypothesisCard } from './HypothesisCard';
export { QuestionPill } from './QuestionPill';
export { FindingChip } from './FindingChip';
export { GateBadge } from './GateBadge';
export { NarratorRail } from './NarratorRail';
export { TributaryFooter } from './TributaryFooter';
export { MissingEvidenceDigest } from './MissingEvidenceDigest';
export { EmptyState } from './EmptyState';
export { ContextMenu } from './ContextMenu';
export { Minimap } from './Minimap';
export { SearchPalette } from './SearchPalette';
export { MobileCardList } from './MobileCardList';
export { useWallKeyboard } from './hooks/useWallKeyboard';
export { useWallDragDrop } from './hooks/useWallDragDrop';
export type { WallStatus, Point } from './types';
```

- [ ] **Step 4: Run tests to verify pass**

Run: `pnpm --filter @variscout/charts test -- --run WallCanvas.test`
Expected: PASS.

- [ ] **Step 5: Run full charts test suite**

Run: `pnpm --filter @variscout/charts test`
Expected: all green.

- [ ] **Step 6: Commit**

```bash
git add packages/charts/src/InvestigationWall/
git commit -m "feat(wall): WallCanvas composition + InvestigationWall barrel export"
```

### Task 6.7: Export `InvestigationWall` from charts barrel

**Files:**

- Modify: `packages/charts/src/index.ts`

- [ ] **Step 1: Add export**

In `packages/charts/src/index.ts`, add:

```ts
export * from './InvestigationWall';
```

- [ ] **Step 2: Verify build**

Run: `pnpm --filter @variscout/charts build`
Expected: clean build.

- [ ] **Step 3: Commit**

```bash
git add packages/charts/src/index.ts
git commit -m "feat(wall): expose InvestigationWall from @variscout/charts barrel"
```

**─── PHASE 6 COMPLETE — Wall canvas primitives ready for app wiring. ───**

---

## ─── PHASE 7: Keyboard + drag-drop + undo/redo ───

### Task 7.1: `useWallKeyboard` hook

**Files:**

- Create: `packages/charts/src/InvestigationWall/hooks/useWallKeyboard.ts`
- Test: `packages/charts/src/InvestigationWall/__tests__/useWallKeyboard.test.tsx`

- [ ] **Step 1: Failing test**

```tsx
import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useWallKeyboard } from '../hooks/useWallKeyboard';

describe('useWallKeyboard', () => {
  it('calls onNewHypothesis for N', () => {
    const onNewHypothesis = vi.fn();
    renderHook(() => useWallKeyboard({ onNewHypothesis }));
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'n' }));
    expect(onNewHypothesis).toHaveBeenCalled();
  });

  it('calls onRunAndCheck for R', () => {
    const onRunAndCheck = vi.fn();
    renderHook(() => useWallKeyboard({ onRunAndCheck }));
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'r' }));
    expect(onRunAndCheck).toHaveBeenCalled();
  });

  it('calls onToggleRail for cmd+/', () => {
    const onToggleRail = vi.fn();
    renderHook(() => useWallKeyboard({ onToggleRail }));
    window.dispatchEvent(new KeyboardEvent('keydown', { key: '/', metaKey: true }));
    expect(onToggleRail).toHaveBeenCalled();
  });

  it('ignores keys while typing in inputs', () => {
    const onNewHypothesis = vi.fn();
    renderHook(() => useWallKeyboard({ onNewHypothesis }));
    const input = document.createElement('input');
    document.body.appendChild(input);
    input.focus();
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'n' }));
    expect(onNewHypothesis).not.toHaveBeenCalled();
    input.remove();
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `pnpm --filter @variscout/charts test -- --run useWallKeyboard.test`
Expected: FAIL.

- [ ] **Step 3: Implement**

Create `packages/charts/src/InvestigationWall/hooks/useWallKeyboard.ts`:

```ts
import { useEffect } from 'react';

export interface UseWallKeyboardOptions {
  onNewHypothesis?: () => void;
  onNewQuestion?: () => void;
  onRunAndCheck?: () => void;
  onFit?: () => void;
  onSnapRiver?: () => void;
  onToggleRail?: () => void;
  onSearch?: () => void;
  onEscape?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  onDelete?: () => void;
}

export function useWallKeyboard(options: UseWallKeyboardOptions): void {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      // Ignore when typing in inputs/textareas/editable elements.
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          (target as HTMLElement).isContentEditable)
      ) {
        return;
      }

      const mod = e.metaKey || e.ctrlKey;

      if (mod && e.key === '/') {
        e.preventDefault();
        options.onToggleRail?.();
        return;
      }
      if (mod && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        options.onSearch?.();
        return;
      }
      if (mod && e.key.toLowerCase() === 'z' && e.shiftKey) {
        e.preventDefault();
        options.onRedo?.();
        return;
      }
      if (mod && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        options.onUndo?.();
        return;
      }

      if (e.key === 'Escape') {
        options.onEscape?.();
        return;
      }
      if (e.key === 'Delete' || e.key === 'Backspace') {
        options.onDelete?.();
        return;
      }

      // Unmodified single-letter shortcuts
      switch (e.key.toLowerCase()) {
        case 'n':
          options.onNewHypothesis?.();
          return;
        case 'q':
          options.onNewQuestion?.();
          return;
        case 'r':
          options.onRunAndCheck?.();
          return;
        case 'f':
          options.onFit?.();
          return;
        case 's':
          options.onSnapRiver?.();
          return;
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [options]);
}
```

- [ ] **Step 4: Run to verify pass**

Run: `pnpm --filter @variscout/charts test -- --run useWallKeyboard.test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/charts/src/InvestigationWall/hooks/useWallKeyboard.ts packages/charts/src/InvestigationWall/__tests__/useWallKeyboard.test.tsx
git commit -m "feat(wall): useWallKeyboard hook with all shortcut keys"
```

### Task 7.2: `useWallDragDrop` for gate composition

Apply the same TDD pattern. Build on `@dnd-kit/core` if the project already uses it; otherwise use native pointer events with a minimal state machine. Test that dragging a hub onto a gate glyph calls `onComposeGate(hubId, gatePath)`.

- [ ] **Step 1: Write a failing test for composeGate callback firing on drop.**
- [ ] **Step 2: Run — fails.**
- [ ] **Step 3: Implement the hook using pointer events tracked against an SVG coordinate system.**
- [ ] **Step 4: Run — passes.**
- [ ] **Step 5: Commit:**

```bash
git commit -m "feat(wall): useWallDragDrop for gate composition via hub drop"
```

### Task 7.3: Undo/redo patch history

Extend `wallLayoutStore` with `undoHistory: Patch[]` (array of immer-style structural patches) and actions `applyPatch(patch)`, `undo()`, `redo()`. 50-step cap.

- [ ] **Step 1: Write tests covering:**
  - undo reverts the last position-change patch
  - redo re-applies it
  - history is capped at 50
  - patches are scoped to structural mutations only (not zoom/pan)

- [ ] **Step 2: Implement with `immer`'s `produceWithPatches`.**

- [ ] **Step 3: Commit:**

```bash
git commit -m "feat(wall): undo/redo patch history in wallLayoutStore"
```

**─── PHASE 7 COMPLETE — interactions layer ready. ───**

---

## ─── PHASE 8: Workspace toggle + app wiring ───

### Task 8.1: Add Map/Wall toggle to Azure `InvestigationWorkspace`

**Files:**

- Modify: `apps/azure/src/components/editor/InvestigationWorkspace.tsx`
- Test: `apps/azure/src/components/editor/__tests__/InvestigationWorkspace.test.tsx`

- [ ] **Step 1: Write failing test**

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { useWallLayoutStore } from '@variscout/stores';
import { InvestigationWorkspace } from '../InvestigationWorkspace';

// Stub the investigation store + projectStore minimally for the render.
vi.mock('@variscout/stores', async () => {
  const actual = await vi.importActual<typeof import('@variscout/stores')>('@variscout/stores');
  return { ...actual };
});

describe('InvestigationWorkspace Map/Wall toggle', () => {
  it('defaults to Map', () => {
    render(<InvestigationWorkspace />);
    expect(screen.getByRole('button', { name: /map/i })).toHaveAttribute('aria-pressed', 'true');
  });

  it('switches to Wall on click and persists in store', () => {
    render(<InvestigationWorkspace />);
    fireEvent.click(screen.getByRole('button', { name: /wall/i }));
    expect(useWallLayoutStore.getState().viewMode).toBe('wall');
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `pnpm --filter @variscout/azure-app test -- --run InvestigationWorkspace.test`
Expected: FAIL — no toggle.

- [ ] **Step 3: Add toggle + Wall mount**

Locate the existing Investigation workspace view in `apps/azure/src/components/editor/InvestigationWorkspace.tsx` (or the equivalent `InvestigationMapView.tsx`). Add above the main content:

```tsx
import { useWallLayoutStore } from '@variscout/stores';
import { WallCanvas } from '@variscout/charts';
import { useInvestigationStore } from '@variscout/stores';
import { useProjectStore } from '@variscout/stores';

// Inside the component body:
const viewMode = useWallLayoutStore(s => s.viewMode);
const setViewMode = useWallLayoutStore(s => s.setViewMode);
const processMap = useProjectStore(s => s.processContext?.processMap);
const hubs = useInvestigationStore(s => s.suspectedCauses);
const findings = useInvestigationStore(s => s.findings);
const questions = useInvestigationStore(s => s.questions);

// Toggle UI (place in the workspace header, right side):
<div
  role="group"
  aria-label="Investigation view mode"
  className="inline-flex items-center gap-1 rounded-md border border-edge p-0.5"
>
  <button
    type="button"
    aria-pressed={viewMode === 'map'}
    onClick={() => setViewMode('map')}
    className={viewMode === 'map' ? 'bg-accent px-2 py-1 text-xs' : 'px-2 py-1 text-xs'}
  >
    Map
  </button>
  <button
    type="button"
    aria-pressed={viewMode === 'wall'}
    onClick={() => setViewMode('wall')}
    className={viewMode === 'wall' ? 'bg-accent px-2 py-1 text-xs' : 'px-2 py-1 text-xs'}
  >
    Wall
  </button>
</div>;

// Conditional render in the workspace center:
{
  viewMode === 'map' ? (
    <InvestigationMapView /> // Keep whatever props the existing call site passes.
  ) : (
    <WallCanvas
      hubs={hubs}
      findings={findings}
      questions={questions}
      processMap={processMap!}
      problemCpk={problemCpk}
      eventsPerWeek={eventsPerWeek}
    />
  );
}
```

Add the Cpk + events-per-week derivations above the toggle render, using existing helpers:

```tsx
import { computeCpk } from '@variscout/core';
import { useMemo } from 'react';

const rows = useProjectStore(s => s.activeRows);
const ctsColumn = processMap?.ctsColumn;
const specs = useProjectStore(s => s.specs); // { lsl?, usl?, target? } per column

const problemCpk = useMemo(() => {
  if (!ctsColumn) return 0;
  const vals = rows.map(r => r[ctsColumn]).filter((v): v is number => typeof v === 'number');
  return computeCpk(vals, specs?.[ctsColumn]?.lsl, specs?.[ctsColumn]?.usl) ?? 0;
}, [ctsColumn, rows, specs]);

const eventsPerWeek = useMemo(() => {
  // Rough rate: count CTS rows over the recent 7 days of activity in data.
  if (!ctsColumn) return 0;
  const weekMs = 7 * 24 * 60 * 60 * 1000;
  const now = Date.now();
  return rows.filter(r => {
    const ts = typeof r.timestamp === 'string' ? Date.parse(r.timestamp) : NaN;
    return !Number.isNaN(ts) && now - ts < weekMs;
  }).length;
}, [ctsColumn, rows]);
```

If `computeCpk` is not exported from the barrel, grep `packages/core/src/stats/` for the existing Cpk helper (likely named `cpk` or `computeCapability`) and import it from there. If no date/timestamp column exists in the data, `eventsPerWeek` falls back to total row count — still informative.

- [ ] **Step 4: Run test to verify pass**

Run: `pnpm --filter @variscout/azure-app test -- --run InvestigationWorkspace.test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/azure/src/components/editor/InvestigationWorkspace.tsx apps/azure/src/components/editor/__tests__/InvestigationWorkspace.test.tsx
git commit -m "feat(wall): Map/Wall toggle in Azure Investigation workspace"
```

### Task 8.2: Mirror toggle in PWA

**Files:**

- Modify: `apps/pwa/src/components/views/InvestigationView.tsx` (path may differ — verify via `grep -rn "InvestigationView" apps/pwa/src/`)
- Test: corresponding test file

- [ ] Repeat Task 8.1 pattern in the PWA app. Same store, same components. Commit:

```bash
git commit -m "feat(wall): Map/Wall toggle in PWA Investigation view"
```

### Task 8.3: Rehydrate Wall layout on project load

**Files:**

- Modify: `apps/azure/src/features/project/useProjectLifecycle.ts` (or equivalent lifecycle hook)
- Modify: same in PWA

- [ ] **Step 1: Call `rehydrateWallLayout(projectId)` after project open and `persistWallLayout(projectId)` via `store.subscribe`. Commit:**

```bash
git commit -m "feat(wall): rehydrate + persist wallLayoutStore per project"
```

**─── PHASE 8 COMPLETE — toggle wired in both apps. ───**

---

## ─── PHASE 9: Best-subsets pipeline + CoScout hook-in ───

### Task 9.1: Debounced best-subsets job

**Files:**

- Create: `packages/core/src/ai/actions/bestSubsetsCandidateDetector.ts`
- Test: `packages/core/src/ai/actions/__tests__/bestSubsetsCandidateDetector.test.ts`

Use existing `bestSubsetsRegression()` from `packages/core/src/stats/olsRegression.ts`.

- [ ] **Step 1: Tests**

Cover: (a) returns a candidate when an unhypothesized column improves R²adj > 0.10, (b) returns undefined when all high-R² columns already cited, (c) skips when fewer than 10 rows, (d) deterministic — seeded input produces identical output.

- [ ] **Step 2: Implement** — glue function calling `bestSubsetsRegression()`, extracting column names from hub conditions, emitting a `BestSubsetsCandidate` type.

- [ ] **Step 3: Commit:**

```bash
git commit -m "feat(wall): best-subsets candidate detector (ΔR²adj > 0.10)"
```

### Task 9.2: Wire to `aiStore` message stream

**Files:**

- Modify: `packages/stores/src/aiStore.ts` (if present — else create feature-store hook)
- Modify: `apps/azure/src/features/investigation/useWallBackgroundJobs.ts` (new hook)

- [ ] **Step 1: Write a hook that subscribes to `investigationStore` changes (hubs + findings), debounces 2s, calls `bestSubsetsCandidateDetector`, and pushes results as `aiStore` messages with kind `best-subsets-candidate`.**

- [ ] **Step 2: Unit test the debounce + emit behavior using `vi.useFakeTimers()`.**

- [ ] **Step 3: Commit:**

```bash
git commit -m "feat(wall): background best-subsets pipeline emits CoScout suggestions"
```

**─── PHASE 9 COMPLETE — CoScout proactively surfaces uncovered columns. ───**

---

## ─── PHASE 10: Hub comments + SSE (reuse ADR-061) ───

### Task 10.1: Server endpoint for hub comments

**Files:**

- Modify: `server.js` (or whichever file holds the HMW brainstorm SSE endpoints)
- Test: `server/__tests__/hubComments.test.ts` (or equivalent)

- [ ] Follow the existing `POST /brainstorm/session/:id/append` + `GET /brainstorm/session/:id/stream` pattern. Add `/hub-comments/:projectId/:hubId` (POST append, GET SSE stream). Session state in a Blob keyed by `${projectId}:${hubId}`. Auto-expire 24h matches the brainstorm spec.
- [ ] Commit: `feat(wall): server SSE endpoints for hub comments (append-only)`

### Task 10.2: `addHubComment` action in `investigationStore`

- [ ] Add `addHubComment(hubId, text, author?)` that POSTs to the server, applies optimistic update to `hub.comments`, and on failure pushes to `wallLayoutStore.pendingComments[]`.
- [ ] Tests cover optimistic success, server failure queueing, and drain on reconnect.
- [ ] Commit: `feat(wall): addHubComment action with optimistic update + offline queue`

### Task 10.3: Subscribe to SSE stream in app

- [ ] Create `apps/azure/src/features/investigation/useHubCommentStream.ts` that opens an EventSource for each hub visible on the Wall and appends incoming comments to `investigationStore`.
- [ ] Commit: `feat(wall): EventSource subscription for live hub comments`

**─── PHASE 10 COMPLETE — async team discussion on hubs with offline support. ───**

---

## ─── PHASE 11: QuestionLinkPrompt extension + missing-column handling ───

### Task 11.1: Wall variant of `QuestionLinkPrompt`

**Files:**

- Modify: `packages/ui/src/components/FindingsLog/QuestionLinkPrompt.tsx:108` (TODO already present)
- Modify: corresponding test file

- [ ] **Step 1: Write failing test** — prompt renders "Propose new hypothesis from this finding" button when `wallActive: true` prop is set.

- [ ] **Step 2: Implement** — add `wallActive?: boolean` prop and a 4th CTA. Wire callback.

- [ ] **Step 3: Commit:**

```bash
git commit -m "feat(wall): QuestionLinkPrompt gains propose-hypothesis option when Wall active"
```

### Task 11.2: Missing-column badge on hub card

- [ ] Extend `HypothesisCard` with a `missingColumn?: boolean` prop that renders a `⚠ Condition references missing column` badge. Exclude such hubs from AND-check in `runAndCheck` — already behaviorally correct (leaf with missing column returns false), but add an explicit UI signal.

**─── PHASE 11 COMPLETE ───**

---

## ─── PHASE 12: i18n ───

### Task 12.1: Add `wall` catalog to English messages

**Files:**

- Modify: `packages/core/src/i18n/messages/en.ts`
- Modify: `packages/core/src/i18n/types.ts` (if message types are centrally typed)
- Test: `packages/core/src/i18n/__tests__/messages.test.ts`

- [ ] **Step 1: Test for catalog presence**

```ts
import { en } from '../messages/en';

describe('wall i18n catalog', () => {
  it('has toolbar keys', () => {
    expect(en.wall.toolbar.newHypothesis).toBe('New hypothesis');
    expect(en.wall.toolbar.runAndCheck).toBe('Run AND-check');
  });

  it('has status labels', () => {
    expect(en.wall.status.evidenced).toBe('Evidenced');
  });

  it('has missing evidence templates', () => {
    expect(en.wall.missing.title).toContain('Missing evidence');
  });
});
```

- [ ] **Step 2: Add catalog** — copy the entire `wall: { … }` block from the spec into `packages/core/src/i18n/messages/en.ts` (merged into the main export).

- [ ] **Step 3: Run — passes.**

- [ ] **Step 4: Commit:**

```bash
git commit -m "feat(wall): English i18n catalog"
```

### Task 12.2: Propagate to all locales

- [ ] For each locale file under `packages/core/src/i18n/messages/*.ts`, copy the English `wall` block as the fallback. Translation work can follow; initial pass uses English strings.
- [ ] Commit: `feat(wall): seed wall catalog across all locales (English fallback)`

**─── PHASE 12 COMPLETE ───**

---

## ─── PHASE 13: Scale features (LOD, ⌘K, minimap, clusters) ───

### Task 13.1: Level-of-detail rendering

- [ ] Add `zoom` threshold logic to `HypothesisCard`: at `zoom < 0.6` render status glyph + hub name only; at `zoom < 0.3` render glyph only. Test with three `zoom` values.
- [ ] Commit: `feat(wall): level-of-detail rendering per zoom threshold`

### Task 13.2: `⌘K` search palette functional

- [ ] Search filters hubs by name, questions by text, findings by text. Up-down arrows navigate results, Enter selects + pans canvas to node.
- [ ] Tests cover keyboard nav, selection, pan-to-node.
- [ ] Commit: `feat(wall): ⌘K search with result navigation`

### Task 13.3: Minimap click-to-pan

- [ ] Implement as a 160×100 SVG thumbnail at bottom-right, showing dimmed copies of all nodes + a viewport rectangle. Click on minimap → updates `wallLayoutStore.pan`.
- [ ] Commit: `feat(wall): minimap floating bottom-right with click-to-pan`

### Task 13.4: Cluster grouping

- [ ] Add an optional "group by tributary" toggle that wraps same-tributary hubs in a rounded container. Test that hubs grouped by `SHIFT` tributary render within a shared frame.
- [ ] Commit: `feat(wall): cluster grouping by tributary`

**─── PHASE 13 COMPLETE ───**

---

## ─── PHASE 14: Mobile rendering + E2E ───

### Task 14.1: `MobileCardList` rendering and breakpoint switch

- [ ] Detect `window.matchMedia('(max-width: 768px)')` in `WallCanvas`; render `MobileCardList` instead of SVG at that breakpoint.
- [ ] Write tests using `matchMedia` mock that confirm list rendering below breakpoint and canvas above.
- [ ] Commit: `feat(wall): mobile card list rendering below 768px`

### Task 14.2: E2E Playwright test

**Files:**

- Create: `apps/pwa/e2e/wall.spec.ts`

- [ ] **Step 1: Write the E2E**

```ts
import { test, expect } from '@playwright/test';

test.describe('Investigation Wall', () => {
  test('toggle reveals Wall; create hypothesis + finding; AND-check computes', async ({ page }) => {
    await page.goto('/');
    // Load a seeded showcase project that has a ProcessMap + some findings.
    await page.click('text=Syringe barrel weight showcase');
    await page.click('text=Investigate');
    await page.click('role=button[name=Wall]');

    await expect(page.locator('text=Problem condition')).toBeVisible();

    // Create a hypothesis via toolbar
    await page.click('role=button[name="New hypothesis"]');
    await page.fill('role=textbox[name="Hypothesis name"]', 'Nozzle runs hot on night shift');
    await page.click('role=button[name="Create"]');

    // Pin a finding by brushing the I-chart
    await page.click('text=SHIFT'); // open tributary
    await page.click('text=I-Chart');
    // brush gesture – coordinates depend on the showcase; use test ids
    await page
      .locator('[data-testid="ichart-brush-zone"]')
      .dragTo(page.locator('[data-testid="ichart-brush-target"]'));
    await page.click('role=button[name="Pin finding"]');

    // Link via prompt
    await page.click('text=Propose new hypothesis from this finding');

    // Run AND-check
    await page.click('role=button[name="Run AND-check"]');
    await expect(page.locator('text=/HOLDS \\d+\\/\\d+/')).toBeVisible();
  });
});
```

- [ ] **Step 2: Run**

Run: `claude --chrome && pnpm --filter @variscout/pwa-app exec playwright test wall.spec`
Expected: PASS.

- [ ] **Step 3: Commit:**

```bash
git commit -m "test(wall): E2E Playwright full-flow coverage"
```

**─── PHASE 14 COMPLETE — ALL DEFINITION-OF-DONE CHECKBOXES GREEN. ───**

---

## Final verification

- [ ] Run full test suite at monorepo root: `pnpm test` — all green.
- [ ] Run linting: `pnpm lint` — `no-root-cause-language` and `no-interaction-moderator` rules green.
- [ ] Run `pnpm build` — clean monorepo build.
- [ ] Run `bash scripts/pr-ready-check.sh` — green.
- [ ] Manual smoke test with `pnpm dev`:
  - Open `http://localhost:5173`
  - Load the syringe-barrel-weight showcase
  - Navigate Investigation → click Wall toggle
  - Confirm Problem card, hubs, tributary footer render
  - Create a hypothesis, pin a finding, compose an AND gate, run AND-check
  - Verify `⌘K` search, `⌘/` rail toggle
  - Resize browser below 768px → Wall switches to list rendering
  - Refresh the page — viewMode + node positions persist
- [ ] Update spec status from `draft` → `active` in `docs/superpowers/specs/2026-04-19-investigation-wall-design.md` frontmatter and the spec index.
- [ ] Open a PR with summary linking the spec and the phase-by-phase commit graph.

---

## Notes for the executing agent

- **TDD discipline.** Every task shows the test first, verifies failure, then the minimum impl, then verifies pass. Don't skip the "verify it fails" step — it catches missing imports and exports early.
- **Commit cadence.** Commit at every `Step 5` / `Commit` marker in each task. Small commits make the review history navigable and safe to bisect.
- **Terminology.** Never write "root cause" in a prompt, message, tool description, or user-facing string. Use "contribution", "convergence", "causation", or "suspected cause". ESLint `no-root-cause-language` will fail the build otherwise.
- **Store invariants.** Always read via selectors: `useX((s) => s.field)` — never bare `useX()`. `beforeEach` reset: `useStore.setState(useStore.getInitialState())`.
- **Numeric safety.** Stats functions return `number | undefined`, never `NaN`. Use `safeMath.ts` primitives. No `.toFixed()` on exported stat values — format via `formatStatistic()`.
- **No `Math.random`.** Any test needing randomness uses the seeded PRNG in `packages/core/src/stats/__tests__/`.
- **Check the skills** as you go:
  - Touching stats → `editing-statistics`
  - Touching CoScout prompts → `editing-coscout-prompts`
  - Adding i18n strings → `adding-i18n-messages`
  - Writing tests → `writing-tests`
  - Editing EvidenceMap/InvestigationWall → `editing-evidence-map`
  - Touching Azure app (auth/storage) → `editing-azure-storage-auth`
