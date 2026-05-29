---
tier: ephemeral
purpose: build
title: PR-LV1-A — analysisScopeStore Zustand store foundation
status: active
date: 2026-05-28
layer: spec
---

# PR-LV1-A — `analysisScopeStore` Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. Dispatch Opus implementer per task (judgment-density on multi-value categorical action design); spec compliance reviewer (Sonnet) + code quality reviewer (Sonnet) after each implementer reports DONE.

**Goal:** Ship the new view-layer Zustand store `useAnalysisScopeStore` — single source of truth for the active analysis scope (Y, X, step, categorical filters) that bridges Process tab and Explore tab in wedge V1.

**Architecture:** Flat single-file store at `packages/stores/src/analysisScopeStore.ts` (matches existing 9-store convention, NOT a subfolder). View layer per ADR-078 + F4 — no persist middleware, no devtools, no immer, session-scoped. Multi-value categorical actions mirror existing `FilterChipDropdown.onUpdateFilterValues(factor, values[])` semantics so Phase 1 chart-click drill-in (PR-LV1-F) and scope chrome (PR-LV1-E) can wire straight through without translation. Layer-boundary test enforces "view stores don't import `zustand/middleware`" via regex; new store's filename must be added to its hardcoded scan list.

**Tech Stack:** TypeScript 6 · Zustand 5 · Vitest 4. No external store deps beyond what `@variscout/stores` already declares.

**Parent spec:** [`docs/superpowers/specs/2026-05-28-state-edit-mode-and-ip-scoped-presentation-design.md`](../specs/2026-05-28-state-edit-mode-and-ip-scoped-presentation-design.md) §3 D10 (signatures), §3.3.x (categorical semantics), §6 (mode-interaction table)
**Master plan:** [`./2026-05-28-linked-views-phase-1-master-plan.md`](./2026-05-28-linked-views-phase-1-master-plan.md) PR-LV1-A row

---

## File structure

**Create:**

- `packages/stores/src/analysisScopeStore.ts` — types + initial state + Zustand `create(...)` (no middleware) + `getInitialState` test-reset cast (mirrors `viewStore.ts:142-143`)
- `packages/stores/src/__tests__/analysisScopeStore.test.ts` — vitest unit tests, one `describe()` per task

**Modify:**

- `packages/stores/src/index.ts` — re-export the new store, types, initial-state factory, and `STORE_LAYER` alias
- `packages/stores/src/__tests__/layerBoundary.test.ts` — add `'analysisScopeStore.ts'` to the hardcoded `loadStoreFiles()` filenames array so view-layer rules are enforced on the new file
- `packages/stores/CLAUDE.md` — add `useAnalysisScopeStore` to the layer table (View row) and bump the headline store count

**No changes needed:**

- `packages/stores/package.json` — single root export entry (`.`) already covers it
- `packages/stores/tsconfig.json` — same reason

---

## Constraints forwarded to implementer

- **NEVER** `--no-verify` on commits (`feedback_subagent_no_verify`)
- **No `Math.random`** anywhere (core hard rule)
- **No `zustand/middleware` imports** — view layer; enforced by `layerBoundary.test.ts:79-92`
- **Operate ONLY in the assigned worktree**, never `cd` to main repo (`feedback_subagent_worktree_discipline`)
- **Implementer verification scoped to <90s** per task (`feedback_implementer_long_bash_pitfall`) — use the `pnpm --filter @variscout/stores test analysisScopeStore` form, NOT full `pnpm test`
- **Use immutable updates** — `set(s => ({ categoricalFilters: [...s.categoricalFilters, ...] }))` style, never mutate `s` in place
- **Preserve type names** — `AnalysisScopeState`, `AnalysisScopeActions`, `AnalysisScopeStore`, `CategoricalFilter` (canonical per spec §3 D10). Do not rename
- **No emojis** in source code

---

## Task 1: Store skeleton + STORE_LAYER + `getInitialState` cast + layerBoundary opt-in

**Files:**

- Create: `packages/stores/src/analysisScopeStore.ts`
- Create: `packages/stores/src/__tests__/analysisScopeStore.test.ts`
- Modify: `packages/stores/src/__tests__/layerBoundary.test.ts`

- [ ] **Step 1: Write the failing test (skeleton block)**

Create `packages/stores/src/__tests__/analysisScopeStore.test.ts` with:

```typescript
import { beforeEach, describe, expect, it } from 'vitest';
import {
  useAnalysisScopeStore,
  getAnalysisScopeInitialState,
  STORE_LAYER,
} from '../analysisScopeStore';

beforeEach(() => {
  useAnalysisScopeStore.setState(useAnalysisScopeStore.getInitialState());
});

describe('useAnalysisScopeStore — skeleton', () => {
  it('declares STORE_LAYER as view', () => {
    expect(STORE_LAYER).toBe('view');
  });

  it('initialises all fields to undefined / empty', () => {
    const s = useAnalysisScopeStore.getState();
    expect(s.yColumn).toBeUndefined();
    expect(s.boxplotFactor).toBeUndefined();
    expect(s.stepId).toBeUndefined();
    expect(s.categoricalFilters).toEqual([]);
  });

  it('getAnalysisScopeInitialState returns a fresh state object each call', () => {
    const a = getAnalysisScopeInitialState();
    const b = getAnalysisScopeInitialState();
    expect(a).toEqual(b);
    expect(a).not.toBe(b);
  });

  it('exposes getInitialState on the store instance for the canonical reset pattern', () => {
    const fn = (useAnalysisScopeStore as unknown as { getInitialState: () => unknown })
      .getInitialState;
    expect(typeof fn).toBe('function');
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm --filter @variscout/stores test analysisScopeStore --run`

Expected: FAIL with `Failed to resolve import "../analysisScopeStore"` (module doesn't exist yet).

- [ ] **Step 3: Write the minimal implementation**

Create `packages/stores/src/analysisScopeStore.ts`:

```typescript
/**
 * useAnalysisScopeStore — transient analysis-scope state (View layer).
 *
 * No persist middleware. Session-scoped. Bridge primitive between Process tab
 * (live scope visualisation) and Explore tab (single-row scope chrome).
 * Mode-agnostic — does not touch projectStore.analysisMode.
 *
 * Spec: docs/superpowers/specs/2026-05-28-state-edit-mode-and-ip-scoped-presentation-design.md §3 D10
 */
import { create } from 'zustand';

export const STORE_LAYER = 'view' as const;

export interface CategoricalFilter {
  readonly column: string;
  readonly values: ReadonlyArray<string | number>;
}

export interface AnalysisScopeState {
  readonly yColumn?: string;
  readonly boxplotFactor?: string;
  readonly stepId?: string;
  readonly categoricalFilters: ReadonlyArray<CategoricalFilter>;
}

export interface AnalysisScopeActions {
  setY: (yColumn: string | undefined) => void;
  setBoxplotFactor: (factor: string | undefined) => void;
  setStepId: (stepId: string | undefined) => void;
  addCategoricalValue: (column: string, value: string | number) => void;
  removeCategoricalValue: (column: string, value: string | number) => void;
  setCategoricalValues: (column: string, values: ReadonlyArray<string | number>) => void;
  removeCategoricalFilter: (column: string) => void;
  clearScope: () => void;
}

export type AnalysisScopeStore = AnalysisScopeState & AnalysisScopeActions;

export const getAnalysisScopeInitialState = (): AnalysisScopeState => ({
  yColumn: undefined,
  boxplotFactor: undefined,
  stepId: undefined,
  categoricalFilters: [],
});

const notImplemented =
  (name: string) =>
  (..._args: unknown[]): void => {
    throw new Error(`useAnalysisScopeStore.${name}: not implemented yet`);
  };

export const useAnalysisScopeStore = create<AnalysisScopeStore>(_set => ({
  ...getAnalysisScopeInitialState(),
  setY: notImplemented('setY'),
  setBoxplotFactor: notImplemented('setBoxplotFactor'),
  setStepId: notImplemented('setStepId'),
  addCategoricalValue: notImplemented('addCategoricalValue'),
  removeCategoricalValue: notImplemented('removeCategoricalValue'),
  setCategoricalValues: notImplemented('setCategoricalValues'),
  removeCategoricalFilter: notImplemented('removeCategoricalFilter'),
  clearScope: notImplemented('clearScope'),
}));

// Expose getInitialState on the store instance for the canonical test reset
// pattern: `useAnalysisScopeStore.setState(useAnalysisScopeStore.getInitialState())`
// — matches packages/stores/CLAUDE.md Invariants and viewStore.ts:142-143 precedent.
(
  useAnalysisScopeStore as unknown as { getInitialState: () => AnalysisScopeState }
).getInitialState = getAnalysisScopeInitialState;
```

- [ ] **Step 4: Opt the new store into the layer-boundary scan**

Edit `packages/stores/src/__tests__/layerBoundary.test.ts` — extend the hardcoded filenames array in `loadStoreFiles()` (around line 45-55). Add `'analysisScopeStore.ts'` so the view-layer middleware-import rule scans it:

```typescript
function loadStoreFiles(): StoreFile[] {
  const filenames = [
    'projectStore.ts',
    'analyzeStore.ts',
    'canvasStore.ts',
    'canvasViewportStore.ts',
    'preferencesStore.ts',
    'activeIPStore.ts',
    'viewStore.ts',
    'improvementProjectStore.ts',
    'useProjectMembershipStore.ts',
    'analysisScopeStore.ts',
  ];
  // ... rest unchanged
}
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `pnpm --filter @variscout/stores test analysisScopeStore layerBoundary --run`

Expected:

- `analysisScopeStore.test.ts` — 4 passing tests (the 4 in the skeleton describe block)
- `layerBoundary.test.ts` — all existing tests pass, including the view-layer rule now scanning `analysisScopeStore.ts` (which doesn't import `zustand/middleware`)

- [ ] **Step 6: Commit**

```bash
git add packages/stores/src/analysisScopeStore.ts \
        packages/stores/src/__tests__/analysisScopeStore.test.ts \
        packages/stores/src/__tests__/layerBoundary.test.ts
git commit -m "feat(wedge-v1): LV1-A — analysisScopeStore skeleton + layerBoundary opt-in"
```

---

## Task 2: Single-value setters (`setY`, `setBoxplotFactor`, `setStepId`)

**Files:**

- Modify: `packages/stores/src/analysisScopeStore.ts`
- Modify: `packages/stores/src/__tests__/analysisScopeStore.test.ts`

- [ ] **Step 1: Write the failing tests**

Append to `packages/stores/src/__tests__/analysisScopeStore.test.ts`:

```typescript
describe('useAnalysisScopeStore — single-value setters', () => {
  it('setY assigns yColumn', () => {
    useAnalysisScopeStore.getState().setY('yield_pct');
    expect(useAnalysisScopeStore.getState().yColumn).toBe('yield_pct');
  });

  it('setY(undefined) clears yColumn', () => {
    useAnalysisScopeStore.setState({ yColumn: 'yield_pct' });
    useAnalysisScopeStore.getState().setY(undefined);
    expect(useAnalysisScopeStore.getState().yColumn).toBeUndefined();
  });

  it('setBoxplotFactor assigns boxplotFactor', () => {
    useAnalysisScopeStore.getState().setBoxplotFactor('vessel');
    expect(useAnalysisScopeStore.getState().boxplotFactor).toBe('vessel');
  });

  it('setBoxplotFactor(undefined) clears boxplotFactor', () => {
    useAnalysisScopeStore.setState({ boxplotFactor: 'vessel' });
    useAnalysisScopeStore.getState().setBoxplotFactor(undefined);
    expect(useAnalysisScopeStore.getState().boxplotFactor).toBeUndefined();
  });

  it('setStepId assigns stepId', () => {
    useAnalysisScopeStore.getState().setStepId('pack');
    expect(useAnalysisScopeStore.getState().stepId).toBe('pack');
  });

  it('setStepId(undefined) clears stepId', () => {
    useAnalysisScopeStore.setState({ stepId: 'pack' });
    useAnalysisScopeStore.getState().setStepId(undefined);
    expect(useAnalysisScopeStore.getState().stepId).toBeUndefined();
  });

  it('setters are independent — setting Y does not touch other fields', () => {
    useAnalysisScopeStore.setState({ boxplotFactor: 'vessel', stepId: 'pack' });
    useAnalysisScopeStore.getState().setY('yield_pct');
    expect(useAnalysisScopeStore.getState().boxplotFactor).toBe('vessel');
    expect(useAnalysisScopeStore.getState().stepId).toBe('pack');
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `pnpm --filter @variscout/stores test analysisScopeStore --run`

Expected: 7 new tests FAIL with `useAnalysisScopeStore.setY: not implemented yet` (and analogous for the other two setters).

- [ ] **Step 3: Implement the setters**

In `packages/stores/src/analysisScopeStore.ts`, change the `create` call so its argument receives `set`, and replace the three setter stubs with real implementations:

```typescript
export const useAnalysisScopeStore = create<AnalysisScopeStore>(set => ({
  ...getAnalysisScopeInitialState(),
  setY: yColumn => set({ yColumn }),
  setBoxplotFactor: factor => set({ boxplotFactor: factor }),
  setStepId: stepId => set({ stepId }),
  addCategoricalValue: notImplemented('addCategoricalValue'),
  removeCategoricalValue: notImplemented('removeCategoricalValue'),
  setCategoricalValues: notImplemented('setCategoricalValues'),
  removeCategoricalFilter: notImplemented('removeCategoricalFilter'),
  clearScope: notImplemented('clearScope'),
}));
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `pnpm --filter @variscout/stores test analysisScopeStore --run`

Expected: 4 + 7 = 11 tests pass.

- [ ] **Step 5: Commit**

```bash
git add packages/stores/src/analysisScopeStore.ts \
        packages/stores/src/__tests__/analysisScopeStore.test.ts
git commit -m "feat(wedge-v1): LV1-A — single-value scope setters (setY, setBoxplotFactor, setStepId)"
```

---

## Task 3: `addCategoricalValue` + `removeCategoricalValue`

**Files:**

- Modify: `packages/stores/src/analysisScopeStore.ts`
- Modify: `packages/stores/src/__tests__/analysisScopeStore.test.ts`

- [ ] **Step 1: Write the failing tests**

Append to `packages/stores/src/__tests__/analysisScopeStore.test.ts`:

```typescript
describe('useAnalysisScopeStore — addCategoricalValue', () => {
  it('creates filter entry when column is new', () => {
    useAnalysisScopeStore.getState().addCategoricalValue('vessel', 'A');
    expect(useAnalysisScopeStore.getState().categoricalFilters).toEqual([
      { column: 'vessel', values: ['A'] },
    ]);
  });

  it('appends value when column already has a filter', () => {
    useAnalysisScopeStore.getState().addCategoricalValue('vessel', 'A');
    useAnalysisScopeStore.getState().addCategoricalValue('vessel', 'B');
    expect(useAnalysisScopeStore.getState().categoricalFilters).toEqual([
      { column: 'vessel', values: ['A', 'B'] },
    ]);
  });

  it('is a no-op (dedupe) when value already present', () => {
    useAnalysisScopeStore.getState().addCategoricalValue('vessel', 'A');
    useAnalysisScopeStore.getState().addCategoricalValue('vessel', 'A');
    expect(useAnalysisScopeStore.getState().categoricalFilters).toEqual([
      { column: 'vessel', values: ['A'] },
    ]);
  });

  it('handles numeric values', () => {
    useAnalysisScopeStore.getState().addCategoricalValue('lot', 42);
    useAnalysisScopeStore.getState().addCategoricalValue('lot', 43);
    expect(useAnalysisScopeStore.getState().categoricalFilters).toEqual([
      { column: 'lot', values: [42, 43] },
    ]);
  });

  it('keeps multiple columns independent', () => {
    useAnalysisScopeStore.getState().addCategoricalValue('vessel', 'A');
    useAnalysisScopeStore.getState().addCategoricalValue('operator', 'Jane');
    expect(useAnalysisScopeStore.getState().categoricalFilters).toHaveLength(2);
  });
});

describe('useAnalysisScopeStore — removeCategoricalValue', () => {
  it('drops the value from the column entry', () => {
    useAnalysisScopeStore.setState({
      categoricalFilters: [{ column: 'vessel', values: ['A', 'B'] }],
    });
    useAnalysisScopeStore.getState().removeCategoricalValue('vessel', 'A');
    expect(useAnalysisScopeStore.getState().categoricalFilters).toEqual([
      { column: 'vessel', values: ['B'] },
    ]);
  });

  it('drops the entire entry when values become empty', () => {
    useAnalysisScopeStore.setState({
      categoricalFilters: [{ column: 'vessel', values: ['A'] }],
    });
    useAnalysisScopeStore.getState().removeCategoricalValue('vessel', 'A');
    expect(useAnalysisScopeStore.getState().categoricalFilters).toEqual([]);
  });

  it('is a no-op when value not present', () => {
    useAnalysisScopeStore.setState({
      categoricalFilters: [{ column: 'vessel', values: ['A'] }],
    });
    useAnalysisScopeStore.getState().removeCategoricalValue('vessel', 'B');
    expect(useAnalysisScopeStore.getState().categoricalFilters).toEqual([
      { column: 'vessel', values: ['A'] },
    ]);
  });

  it('is a no-op when column not present', () => {
    useAnalysisScopeStore.setState({
      categoricalFilters: [{ column: 'operator', values: ['Jane'] }],
    });
    useAnalysisScopeStore.getState().removeCategoricalValue('vessel', 'A');
    expect(useAnalysisScopeStore.getState().categoricalFilters).toEqual([
      { column: 'operator', values: ['Jane'] },
    ]);
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `pnpm --filter @variscout/stores test analysisScopeStore --run`

Expected: 9 new tests FAIL with `useAnalysisScopeStore.addCategoricalValue: not implemented yet` / `useAnalysisScopeStore.removeCategoricalValue: not implemented yet`.

- [ ] **Step 3: Implement the two actions**

In `packages/stores/src/analysisScopeStore.ts`, replace the `addCategoricalValue` and `removeCategoricalValue` stubs:

```typescript
addCategoricalValue: (column, value) =>
  set(s => {
    const existing = s.categoricalFilters.find(f => f.column === column);
    if (existing) {
      if (existing.values.includes(value)) return {};
      return {
        categoricalFilters: s.categoricalFilters.map(f =>
          f.column === column ? { column, values: [...f.values, value] } : f
        ),
      };
    }
    return {
      categoricalFilters: [...s.categoricalFilters, { column, values: [value] }],
    };
  }),
removeCategoricalValue: (column, value) =>
  set(s => {
    const existing = s.categoricalFilters.find(f => f.column === column);
    if (!existing) return {};
    if (!existing.values.includes(value)) return {};
    const remaining = existing.values.filter(v => v !== value);
    if (remaining.length === 0) {
      return {
        categoricalFilters: s.categoricalFilters.filter(f => f.column !== column),
      };
    }
    return {
      categoricalFilters: s.categoricalFilters.map(f =>
        f.column === column ? { column, values: remaining } : f
      ),
    };
  }),
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `pnpm --filter @variscout/stores test analysisScopeStore --run`

Expected: 11 + 9 = 20 tests pass.

- [ ] **Step 5: Commit**

```bash
git add packages/stores/src/analysisScopeStore.ts \
        packages/stores/src/__tests__/analysisScopeStore.test.ts
git commit -m "feat(wedge-v1): LV1-A — categorical value add/remove with dedupe + auto-cleanup"
```

---

## Task 4: `setCategoricalValues` + `removeCategoricalFilter`

**Files:**

- Modify: `packages/stores/src/analysisScopeStore.ts`
- Modify: `packages/stores/src/__tests__/analysisScopeStore.test.ts`

- [ ] **Step 1: Write the failing tests**

Append to `packages/stores/src/__tests__/analysisScopeStore.test.ts`:

```typescript
describe('useAnalysisScopeStore — setCategoricalValues', () => {
  it('replaces full values array for an existing column', () => {
    useAnalysisScopeStore.setState({
      categoricalFilters: [{ column: 'vessel', values: ['A'] }],
    });
    useAnalysisScopeStore.getState().setCategoricalValues('vessel', ['B', 'C']);
    expect(useAnalysisScopeStore.getState().categoricalFilters).toEqual([
      { column: 'vessel', values: ['B', 'C'] },
    ]);
  });

  it('creates a filter entry for a new column', () => {
    useAnalysisScopeStore.getState().setCategoricalValues('vessel', ['A', 'B']);
    expect(useAnalysisScopeStore.getState().categoricalFilters).toEqual([
      { column: 'vessel', values: ['A', 'B'] },
    ]);
  });

  it('empty array drops the entry (matches FilterChipDropdown uncheck-all UX)', () => {
    useAnalysisScopeStore.setState({
      categoricalFilters: [{ column: 'vessel', values: ['A'] }],
    });
    useAnalysisScopeStore.getState().setCategoricalValues('vessel', []);
    expect(useAnalysisScopeStore.getState().categoricalFilters).toEqual([]);
  });

  it('empty array on a missing column is a no-op', () => {
    useAnalysisScopeStore.getState().setCategoricalValues('vessel', []);
    expect(useAnalysisScopeStore.getState().categoricalFilters).toEqual([]);
  });

  it('leaves other columns untouched', () => {
    useAnalysisScopeStore.setState({
      categoricalFilters: [
        { column: 'vessel', values: ['A'] },
        { column: 'operator', values: ['Jane'] },
      ],
    });
    useAnalysisScopeStore.getState().setCategoricalValues('vessel', ['X']);
    expect(useAnalysisScopeStore.getState().categoricalFilters).toEqual([
      { column: 'vessel', values: ['X'] },
      { column: 'operator', values: ['Jane'] },
    ]);
  });

  it('copies the input array (caller-mutation safety)', () => {
    const input: (string | number)[] = ['A', 'B'];
    useAnalysisScopeStore.getState().setCategoricalValues('vessel', input);
    input.push('C');
    expect(useAnalysisScopeStore.getState().categoricalFilters).toEqual([
      { column: 'vessel', values: ['A', 'B'] },
    ]);
  });
});

describe('useAnalysisScopeStore — removeCategoricalFilter', () => {
  it('drops the entire entry for the column', () => {
    useAnalysisScopeStore.setState({
      categoricalFilters: [
        { column: 'vessel', values: ['A', 'B'] },
        { column: 'operator', values: ['Jane'] },
      ],
    });
    useAnalysisScopeStore.getState().removeCategoricalFilter('vessel');
    expect(useAnalysisScopeStore.getState().categoricalFilters).toEqual([
      { column: 'operator', values: ['Jane'] },
    ]);
  });

  it('is a no-op when column not present', () => {
    useAnalysisScopeStore.setState({
      categoricalFilters: [{ column: 'operator', values: ['Jane'] }],
    });
    useAnalysisScopeStore.getState().removeCategoricalFilter('vessel');
    expect(useAnalysisScopeStore.getState().categoricalFilters).toEqual([
      { column: 'operator', values: ['Jane'] },
    ]);
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `pnpm --filter @variscout/stores test analysisScopeStore --run`

Expected: 8 new tests FAIL with `useAnalysisScopeStore.setCategoricalValues: not implemented yet` / `useAnalysisScopeStore.removeCategoricalFilter: not implemented yet`.

- [ ] **Step 3: Implement the two actions**

In `packages/stores/src/analysisScopeStore.ts`, replace the `setCategoricalValues` and `removeCategoricalFilter` stubs:

```typescript
setCategoricalValues: (column, values) =>
  set(s => {
    const existing = s.categoricalFilters.find(f => f.column === column);
    if (values.length === 0) {
      if (!existing) return {};
      return {
        categoricalFilters: s.categoricalFilters.filter(f => f.column !== column),
      };
    }
    if (existing) {
      return {
        categoricalFilters: s.categoricalFilters.map(f =>
          f.column === column ? { column, values: [...values] } : f
        ),
      };
    }
    return {
      categoricalFilters: [...s.categoricalFilters, { column, values: [...values] }],
    };
  }),
removeCategoricalFilter: column =>
  set(s => {
    if (!s.categoricalFilters.some(f => f.column === column)) return {};
    return {
      categoricalFilters: s.categoricalFilters.filter(f => f.column !== column),
    };
  }),
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `pnpm --filter @variscout/stores test analysisScopeStore --run`

Expected: 20 + 8 = 28 tests pass.

- [ ] **Step 5: Commit**

```bash
git add packages/stores/src/analysisScopeStore.ts \
        packages/stores/src/__tests__/analysisScopeStore.test.ts
git commit -m "feat(wedge-v1): LV1-A — setCategoricalValues + removeCategoricalFilter (bulk + targeted drop)"
```

---

## Task 5: `clearScope` + barrel exports + CLAUDE.md

**Files:**

- Modify: `packages/stores/src/analysisScopeStore.ts`
- Modify: `packages/stores/src/__tests__/analysisScopeStore.test.ts`
- Modify: `packages/stores/src/index.ts`
- Modify: `packages/stores/CLAUDE.md`

- [ ] **Step 1: Write the failing test (clearScope)**

Append to `packages/stores/src/__tests__/analysisScopeStore.test.ts`:

```typescript
describe('useAnalysisScopeStore — clearScope', () => {
  it('resets all fields to the initial state', () => {
    useAnalysisScopeStore.setState({
      yColumn: 'yield_pct',
      boxplotFactor: 'vessel',
      stepId: 'pack',
      categoricalFilters: [{ column: 'vessel', values: ['A', 'B'] }],
    });
    useAnalysisScopeStore.getState().clearScope();
    const s = useAnalysisScopeStore.getState();
    expect(s.yColumn).toBeUndefined();
    expect(s.boxplotFactor).toBeUndefined();
    expect(s.stepId).toBeUndefined();
    expect(s.categoricalFilters).toEqual([]);
  });

  it('is a no-op when scope already empty', () => {
    useAnalysisScopeStore.getState().clearScope();
    const s = useAnalysisScopeStore.getState();
    expect(s.yColumn).toBeUndefined();
    expect(s.boxplotFactor).toBeUndefined();
    expect(s.stepId).toBeUndefined();
    expect(s.categoricalFilters).toEqual([]);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm --filter @variscout/stores test analysisScopeStore --run`

Expected: 2 new tests FAIL with `useAnalysisScopeStore.clearScope: not implemented yet`.

- [ ] **Step 3: Implement `clearScope` (final removal of stubs)**

In `packages/stores/src/analysisScopeStore.ts`, replace the `clearScope` stub and remove the now-unused `notImplemented` helper:

```typescript
clearScope: () => set(getAnalysisScopeInitialState()),
```

Then delete the `notImplemented` constant from the file (no remaining stubs reference it). The full `create` block should end up looking like:

```typescript
export const useAnalysisScopeStore = create<AnalysisScopeStore>(set => ({
  ...getAnalysisScopeInitialState(),
  setY: yColumn => set({ yColumn }),
  setBoxplotFactor: factor => set({ boxplotFactor: factor }),
  setStepId: stepId => set({ stepId }),
  addCategoricalValue: (column, value) =>
    set(s => {
      const existing = s.categoricalFilters.find(f => f.column === column);
      if (existing) {
        if (existing.values.includes(value)) return {};
        return {
          categoricalFilters: s.categoricalFilters.map(f =>
            f.column === column ? { column, values: [...f.values, value] } : f
          ),
        };
      }
      return {
        categoricalFilters: [...s.categoricalFilters, { column, values: [value] }],
      };
    }),
  removeCategoricalValue: (column, value) =>
    set(s => {
      const existing = s.categoricalFilters.find(f => f.column === column);
      if (!existing) return {};
      if (!existing.values.includes(value)) return {};
      const remaining = existing.values.filter(v => v !== value);
      if (remaining.length === 0) {
        return {
          categoricalFilters: s.categoricalFilters.filter(f => f.column !== column),
        };
      }
      return {
        categoricalFilters: s.categoricalFilters.map(f =>
          f.column === column ? { column, values: remaining } : f
        ),
      };
    }),
  setCategoricalValues: (column, values) =>
    set(s => {
      const existing = s.categoricalFilters.find(f => f.column === column);
      if (values.length === 0) {
        if (!existing) return {};
        return {
          categoricalFilters: s.categoricalFilters.filter(f => f.column !== column),
        };
      }
      if (existing) {
        return {
          categoricalFilters: s.categoricalFilters.map(f =>
            f.column === column ? { column, values: [...values] } : f
          ),
        };
      }
      return {
        categoricalFilters: [...s.categoricalFilters, { column, values: [...values] }],
      };
    }),
  removeCategoricalFilter: column =>
    set(s => {
      if (!s.categoricalFilters.some(f => f.column === column)) return {};
      return {
        categoricalFilters: s.categoricalFilters.filter(f => f.column !== column),
      };
    }),
  clearScope: () => set(getAnalysisScopeInitialState()),
}));
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `pnpm --filter @variscout/stores test analysisScopeStore --run`

Expected: 28 + 2 = 30 tests pass. Verify no lingering reference to `notImplemented`.

- [ ] **Step 5: Add barrel exports**

Edit `packages/stores/src/index.ts` — append the new store's exports next to the `useViewStore` block (top-level alphabetical order is not enforced; put it right after the View-layer entries for layer cohesion):

```typescript
export {
  useAnalysisScopeStore,
  getAnalysisScopeInitialState,
  STORE_LAYER as ANALYSIS_SCOPE_STORE_LAYER,
} from './analysisScopeStore';
export type {
  AnalysisScopeState,
  AnalysisScopeActions,
  AnalysisScopeStore,
  CategoricalFilter,
} from './analysisScopeStore';
```

- [ ] **Step 6: Update `packages/stores/CLAUDE.md` layer table**

Open `packages/stores/CLAUDE.md`. Change the headline from "9 Zustand stores" to "10 Zustand stores" (the new store is the tenth). Append a new row to the layer table after the `useViewStore` row:

```markdown
| View | `useAnalysisScopeStore` | NONE — transient (linked-views bridge: Process tab ↔ Explore tab; session-scoped per spec 2026-05-28 §3 D10) |
```

- [ ] **Step 7: Verify per-package build + tests + layerBoundary one more time**

Run: `pnpm --filter @variscout/stores test --run`

Expected: full stores test suite green (includes `analysisScopeStore.test.ts` 30 tests + `layerBoundary.test.ts` scanning the new file + all pre-existing tests).

Run: `pnpm --filter @variscout/stores build`

Expected: clean (no TypeScript errors; barrel exports resolve).

- [ ] **Step 8: Commit**

```bash
git add packages/stores/src/analysisScopeStore.ts \
        packages/stores/src/__tests__/analysisScopeStore.test.ts \
        packages/stores/src/index.ts \
        packages/stores/CLAUDE.md
git commit -m "feat(wedge-v1): LV1-A — clearScope + barrel exports + CLAUDE.md layer table"
```

---

## Final validation (controller-level, after Task 5)

The implementer's <90s scoped runs above keep iteration tight. Before opening the PR, the controller runs the full pre-PR sweep:

1. **Per-package tests:** `pnpm --filter @variscout/stores test --run` → green
2. **Per-package build:** `pnpm --filter @variscout/stores build` → clean
3. **Cross-package type check** (per `feedback_ui_build_before_merge`): `pnpm --filter @variscout/ui build` → clean (catches cross-package type drift if any consumer pre-emptively imports the new types)
4. **pr-ready-check:** `bash scripts/pr-ready-check.sh` → green
5. **Frontmatter validator** (touched a CLAUDE.md, not a docs/ file — so this is optional): `node scripts/check-doc-frontmatter.mjs`

If any gate fails, fix and re-run. **Do NOT use `--no-verify`** (per `feedback_subagent_no_verify`).

---

## Acceptance signals

- All 30 `analysisScopeStore.test.ts` tests pass
- `layerBoundary.test.ts` includes `'analysisScopeStore.ts'` in its scan list and the view-layer middleware rule passes for the new file
- `import { useAnalysisScopeStore, type AnalysisScopeState } from '@variscout/stores'` resolves cleanly in any consumer
- `packages/stores/CLAUDE.md` headline reads "10 Zustand stores" and the layer table has the new View row
- No UI changes; no app changes; no chart changes — this PR is foundation only
- PR description references the master plan + this sub-plan + spec §3 D10

---

## Related

- Parent spec: [`../specs/2026-05-28-state-edit-mode-and-ip-scoped-presentation-design.md`](../specs/2026-05-28-state-edit-mode-and-ip-scoped-presentation-design.md) §3 D10
- Master plan: [`./2026-05-28-linked-views-phase-1-master-plan.md`](./2026-05-28-linked-views-phase-1-master-plan.md) PR-LV1-A row
- Precedent (LV1-0 sub-plan format): [`./2026-05-28-pr-lv1-0-remove-yamazumi-mode.md`](./2026-05-28-pr-lv1-0-remove-yamazumi-mode.md)
- View-layer template store: `packages/stores/src/viewStore.ts`
- Layer-boundary enforcement: `packages/stores/src/__tests__/layerBoundary.test.ts`
- ADR-078 (PWA/Azure alignment + nine-store model): `docs/07-decisions/adr-078-pwa-azure-architecture-alignment.md`
- F4 spec (three-layer state model): `docs/superpowers/specs/2026-05-07-data-flow-foundation-f4-three-layer-state-design.md`
- Memory: `feedback_subagent_no_verify`, `feedback_subagent_worktree_discipline`, `feedback_implementer_long_bash_pitfall`, `feedback_ui_build_before_merge`, `feedback_preserve_commit_history`
