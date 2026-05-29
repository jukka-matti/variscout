---
tier: ephemeral
purpose: build
title: PR-LV1-G — Canvas live scope visualization
status: delivered
date: 2026-05-29
layer: spec
---

# PR-LV1-G — Canvas Live Scope Visualization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Process tab canvas chips (OutcomeCard / FactorChip / StepBox) live-react to `useAnalysisScopeStore` per spec §4.5 — in-scope chips render with a colored border + ✓ marker (outcome/factor) or MapPin badge (step), out-of-scope chips dim to 50% when any scope is active, and FactorChips show a categorical badge `"{factor} = A, B only"` when a matching `categoricalFilters` entry exists.

**Architecture:** Pure additive subscription work. Each chip independently subscribes to the relevant scope field(s) via the existing `useAnalysisScopeStore(s => s.field)` selector pattern (LV1-E's `OutcomeSummaryPill` precedent). A new shared `useScopeIsEmpty()` hook centralizes the dim-decision emptiness check. No new props on chips, no parent-side wiring, no `CanvasWorkspace` changes. `ProcessMapBase` is deprecated per `packages/ui/CLAUDE.md` and is NOT touched.

**Tech Stack:** TypeScript · React · Zustand (`@variscout/stores/analysisScopeStore`) · lucide-react (`MapPin` for the step active badge) · vitest + @testing-library/react · happy-dom · pnpm workspaces.

---

## Parent context

- **Spec:** `docs/superpowers/specs/2026-05-28-state-edit-mode-and-ip-scoped-presentation-design.md` §4.5 (Live scope visualization on canvas), quoted verbatim below.
- **Master plan:** `docs/superpowers/plans/2026-05-28-linked-views-phase-1-master-plan.md` PR-LV1-G row 7 (Sonnet, 5–7 tasks).
- **Sibling shipped PRs:**
  - LV1-A `analysisScopeStore` foundation — `useAnalysisScopeStore` is feature-complete and tested.
  - LV1-E Explore scope chrome — established the `useAnalysisScopeStore(s => s.field)` inline selector pattern in `OutcomeSummaryPill`.
  - LV1-F Pareto + Boxplot click → `addCategoricalValue` — produces the `categoricalFilters` that the FactorChip categorical badge will read.
- **Out of scope:** I-Chart point click, Histogram bucket click, Capability annotation click (all Phase 2 / T-NEW-4). PWA canvas chips (PWA has no Process tab in wedge V1 per §PWA-Mount-Deferral).

## Spec §4.5 verbatim

```
The canvas subscribes to analysisScopeStore and renders in-scope markers:

- Active Y outcome chip: green border + ✓ marker
- Active boxplot factor chip: blue border + ✓ marker
- Active step: highlighted in process map + "📍 active" badge in steps band
- Categorical filters: chip badges show "({column}={value} only)"
  — e.g., vessel chip → "vessel = A only"
- Out-of-scope chips: dimmed (~50% opacity) when any scope is active

When scope is empty, all chips render normally (full opacity, no markers).
```

## Architectural decisions

### D-LV1G-1: V1-compliant color tokens (translates spec's "green/blue/amber border")

Per `packages/ui/CLAUDE.md` §Color discipline: "Surfaces: Tailwind 50-300 only — never 700+ fills. Text/strokes: 400-700 paired with darker 600-800 for label contrast."

| Chip             | Active border      | Active ring                | Active surface | Marker text color |
| ---------------- | ------------------ | -------------------------- | -------------- | ----------------- |
| OutcomeCard (Y)  | `border-green-600` | `ring-1 ring-green-500/30` | `bg-green-50`  | `text-green-700`  |
| FactorChip (X)   | `border-blue-600`  | `ring-1 ring-blue-500/30`  | `bg-blue-50`   | `text-blue-700`   |
| StepBox (step)   | `border-amber-600` | `ring-1 ring-amber-500/30` | `bg-amber-50`  | `text-amber-700`  |
| Dim out-of-scope | `opacity-50`       |

### D-LV1G-2: ✓ marker is inline Unicode glyph

Single character `✓` (U+2713) — already used at `ColumnChip.tsx:82` precedent. Cheaper than a `Check` icon import; spec doesn't require icon-system uniformity for the marker.

### D-LV1G-3: Step active badge is `MapPin` lucide icon + "active" text (NOT 📍 emoji)

The spec uses 📍 emoji literally but the no-emoji rule applies to source code. Replace with `MapPin` from `lucide-react` (already a dependency).

### D-LV1G-4: Categorical badge slots into FactorChip's existing secondary-pill flex row

The chip already has `<div className="flex flex-wrap gap-1 text-xs text-content-secondary">` holding target-condition + binding pills. Append a new conditional span when `categoricalFilters` contains a matching `column === control.factor` entry.

### D-LV1G-5: Dim-out-of-scope uses shared `useScopeIsEmpty()` + per-chip in-scope check

```typescript
// packages/ui/src/components/Canvas/EditMode/hooks/useScopeIsEmpty.ts
import { useAnalysisScopeStore } from '@variscout/stores';

export function useScopeIsEmpty(): boolean {
  const yColumn = useAnalysisScopeStore(s => s.yColumn);
  const boxplotFactor = useAnalysisScopeStore(s => s.boxplotFactor);
  const stepId = useAnalysisScopeStore(s => s.stepId);
  const categoricalFilters = useAnalysisScopeStore(s => s.categoricalFilters);
  return !yColumn && !boxplotFactor && !stepId && categoricalFilters.length === 0;
}
```

Dim condition per chip: `!scopeIsEmpty && !isInScope` → append `opacity-50` to root className.

### D-LV1G-6: "In scope" semantics per chip

| Chip        | In scope when                                                                                                         |
| ----------- | --------------------------------------------------------------------------------------------------------------------- |
| OutcomeCard | `scope.yColumn === spec.columnName`                                                                                   |
| FactorChip  | `scope.boxplotFactor === control.factor` OR `categoricalFilters.find(f => f.column === control.factor) !== undefined` |
| StepBox     | `scope.stepId === step.id`                                                                                            |

### D-LV1G-7: ProcessMapBase is deprecated; do NOT touch it

Per `packages/ui/CLAUDE.md`: "LayeredProcessViewWithCapability and ProcessMapBase are deprecated compatibility wrappers; new work targets `Canvas` or `CanvasWorkspace`." LV1-G touches only canonical `Canvas/EditMode/` chip components.

### D-LV1G-8: No bidirectional mutation

LV1-G is **read-only canvas presentation**. Click affordances remain LV1-D's `navigateToExploreForChip()`.

## Files

### Create

- `packages/ui/src/components/Canvas/EditMode/hooks/useScopeIsEmpty.ts` — ~12 LOC shared emptiness helper.
- `packages/ui/src/components/Canvas/EditMode/hooks/__tests__/useScopeIsEmpty.test.ts` — 4 unit tests.

### Modify

- `packages/ui/src/components/Canvas/EditMode/OutcomeZone/OutcomeCard.tsx` — subscribe `yColumn`; compute `isInScope`; conditional border/ring/bg/dim + ✓ marker.
- `packages/ui/src/components/Canvas/EditMode/OutcomeZone/__tests__/OutcomeCard.test.tsx` — 3 new tests.
- `packages/ui/src/components/Canvas/EditMode/FactorZone/FactorChip.tsx` — subscribe `boxplotFactor` + `categoricalFilters`; compute `isInScope` (two paths); conditional border/ring/bg/dim + ✓ marker + categorical badge.
- `packages/ui/src/components/Canvas/EditMode/FactorZone/__tests__/FactorChip.test.tsx` — 5 new tests.
- `packages/ui/src/components/Canvas/EditMode/ProcessZone/StepBox.tsx` — subscribe `stepId`; conditional border/ring/bg/dim + `MapPin` "active" badge.
- `packages/ui/src/components/Canvas/EditMode/ProcessZone/__tests__/StepBox.test.tsx` — 3 new tests.

### No changes (verify only)

- `packages/stores/src/analysisScopeStore.ts` — feature-complete.
- `packages/ui/src/components/Canvas/internal/ProcessMapBase.tsx` — deprecated; do NOT extend.
- `packages/ui/src/components/Canvas/EditMode/ExploreJumpButton.tsx` — LV1-D affordance, unchanged.

## Constraints (forwarded to each implementer)

- **Never** `--no-verify` on commits.
- No `Math.random`, no `dark:` Tailwind, no `"root cause"`, no `Pp`/`Ppk`.
- No emojis in source code — Unicode arrow/symbol glyphs (`✓`/`→`/`×`/`▾`/`+`) are allowed; pin/map emoji (📍) is NOT (use `MapPin` icon).
- V1 color discipline (surfaces 50–300; strokes 400–700 paired with 600–800 text). Specific tokens at D-LV1G-1.
- No migration helpers / no back-compat shims.
- `@variscout/ui` MAY import from `@variscout/stores` for store-aware components (ADR-056 exception); chip files use this.
- `@variscout/ui` MAY NOT import from `apps/`.
- Operate ONLY in the assigned worktree.
- Skip browser walks for wedge V1.
- Use factories not literals — `createTestOutcomeSpec()`, `createTestFactorControl()`, `makeStep()` factories already exist; reuse.
- Implementer verification scoped to <90s targeted runs.
- Do NOT touch `ProcessMapBase` (deprecated compat-wrapper).
- Preserved-identifier list applies — we're ADDING visual state, not renaming.

---

## Task 1: `useScopeIsEmpty()` helper + unit tests

**Files:**

- Create: `packages/ui/src/components/Canvas/EditMode/hooks/useScopeIsEmpty.ts`
- Create: `packages/ui/src/components/Canvas/EditMode/hooks/__tests__/useScopeIsEmpty.test.ts`

- [ ] **Step 1: Write the failing tests**

`packages/ui/src/components/Canvas/EditMode/hooks/__tests__/useScopeIsEmpty.test.ts`:

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useAnalysisScopeStore } from '@variscout/stores';
import { useScopeIsEmpty } from '../useScopeIsEmpty';

describe('useScopeIsEmpty', () => {
  beforeEach(() => {
    useAnalysisScopeStore.setState(useAnalysisScopeStore.getInitialState());
  });

  it('returns true when no scope fields are set', () => {
    const { result } = renderHook(() => useScopeIsEmpty());
    expect(result.current).toBe(true);
  });

  it('returns false when yColumn is set', () => {
    useAnalysisScopeStore.getState().setY('yield');
    const { result } = renderHook(() => useScopeIsEmpty());
    expect(result.current).toBe(false);
  });

  it('returns false when boxplotFactor is set', () => {
    useAnalysisScopeStore.getState().setBoxplotFactor('temperature');
    const { result } = renderHook(() => useScopeIsEmpty());
    expect(result.current).toBe(false);
  });

  it('returns false when stepId is set', () => {
    useAnalysisScopeStore.getState().setStepId('step-1');
    const { result } = renderHook(() => useScopeIsEmpty());
    expect(result.current).toBe(false);
  });

  it('returns false when categoricalFilters is non-empty', () => {
    useAnalysisScopeStore.getState().addCategoricalValue('vessel', 'A');
    const { result } = renderHook(() => useScopeIsEmpty());
    expect(result.current).toBe(false);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm --filter @variscout/ui test -- src/components/Canvas/EditMode/hooks --run`
Expected: FAIL — module `useScopeIsEmpty` does not exist.

- [ ] **Step 3: Implement the hook**

Create `packages/ui/src/components/Canvas/EditMode/hooks/useScopeIsEmpty.ts`:

```typescript
import { useAnalysisScopeStore } from '@variscout/stores';

export function useScopeIsEmpty(): boolean {
  const yColumn = useAnalysisScopeStore(s => s.yColumn);
  const boxplotFactor = useAnalysisScopeStore(s => s.boxplotFactor);
  const stepId = useAnalysisScopeStore(s => s.stepId);
  const categoricalFilters = useAnalysisScopeStore(s => s.categoricalFilters);
  return !yColumn && !boxplotFactor && !stepId && categoricalFilters.length === 0;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm --filter @variscout/ui test -- src/components/Canvas/EditMode/hooks --run`
Expected: PASS — 5/5 green.

- [ ] **Step 5: Commit**

```bash
git add packages/ui/src/components/Canvas/EditMode/hooks/
git commit -m "feat(wedge-v1): LV1-G task 1 — useScopeIsEmpty() helper

Shared dim-decision helper for canvas chips. Returns true when no
scope field is set; chips append opacity-50 when !empty && !isInScope.

Spec §4.5. Sub-plan task 1 of 5."
```

---

## Task 2: OutcomeCard scope visualization

**Files:**

- Modify: `packages/ui/src/components/Canvas/EditMode/OutcomeZone/OutcomeCard.tsx`
- Modify: `packages/ui/src/components/Canvas/EditMode/OutcomeZone/__tests__/OutcomeCard.test.tsx`

- [ ] **Step 1: Write the failing tests**

Append to `OutcomeCard.test.tsx` (the file uses `createTestOutcomeSpec()` from `test-utils/outcomeSpec`):

```tsx
import { useAnalysisScopeStore } from '@variscout/stores';

describe('OutcomeCard scope visualization (LV1-G)', () => {
  beforeEach(() => {
    useAnalysisScopeStore.setState(useAnalysisScopeStore.getInitialState());
  });

  it('renders baseline (no active border / no ✓) when scope is empty', () => {
    const { container } = render(
      <OutcomeCard spec={createTestOutcomeSpec({ columnName: 'yield' })} onSpecsClick={vi.fn()} />
    );
    const root = container.firstChild as HTMLElement;
    expect(root.className).not.toMatch(/border-green-600/);
    expect(root.className).not.toMatch(/opacity-50/);
    expect(screen.queryByText('✓')).toBeNull();
  });

  it('renders active styling when scope.yColumn matches columnName', () => {
    useAnalysisScopeStore.getState().setY('yield');
    const { container } = render(
      <OutcomeCard spec={createTestOutcomeSpec({ columnName: 'yield' })} onSpecsClick={vi.fn()} />
    );
    const root = container.firstChild as HTMLElement;
    expect(root.className).toMatch(/border-green-600/);
    expect(root.className).toMatch(/ring-green-500\/30/);
    expect(root.className).toMatch(/bg-green-50/);
    expect(root.className).not.toMatch(/opacity-50/);
    expect(screen.getByText('✓')).toBeInTheDocument();
  });

  it('dims when scope is non-empty AND columnName does not match yColumn', () => {
    useAnalysisScopeStore.getState().setY('temperature');
    const { container } = render(
      <OutcomeCard spec={createTestOutcomeSpec({ columnName: 'yield' })} onSpecsClick={vi.fn()} />
    );
    const root = container.firstChild as HTMLElement;
    expect(root.className).toMatch(/opacity-50/);
    expect(root.className).not.toMatch(/border-green-600/);
    expect(screen.queryByText('✓')).toBeNull();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm --filter @variscout/ui test -- src/components/Canvas/EditMode/OutcomeZone --run`
Expected: FAIL — neither the `✓` marker nor the active classes exist yet.

- [ ] **Step 3: Implement scope visualization in OutcomeCard.tsx**

1. Add imports at the top:

```typescript
import { useAnalysisScopeStore } from '@variscout/stores';
import { useScopeIsEmpty } from '../hooks/useScopeIsEmpty';
```

2. Inside the component (before the `return`):

```typescript
const yColumn = useAnalysisScopeStore(s => s.yColumn);
const isInScope = yColumn === spec.columnName;
const scopeIsEmpty = useScopeIsEmpty();
const shouldDim = !scopeIsEmpty && !isInScope;

const rootClasses = [
  'group flex flex-col gap-1 rounded-md border p-3 text-content',
  isInScope
    ? 'border-green-600 ring-1 ring-green-500/30 bg-green-50'
    : 'border-edge bg-surface-primary',
  shouldDim ? 'opacity-50' : '',
]
  .filter(Boolean)
  .join(' ');
```

3. Replace the root `<div className="group flex flex-col gap-1 rounded-md border border-edge bg-surface-primary p-3 text-content">` with `<div className={rootClasses}>`.

4. Inside the header row's first inner `<div className="flex items-center gap-2">`, add the ✓ marker BEFORE the `columnName` span:

```tsx
<div className="flex items-center gap-2">
  {isInScope && (
    <span aria-hidden="true" className="text-green-700">
      ✓
    </span>
  )}
  <span className="text-base font-semibold">{spec.columnName}</span>
  <span aria-hidden="true" className="text-content-tertiary">
    {direction}
  </span>
</div>
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm --filter @variscout/ui test -- src/components/Canvas/EditMode/OutcomeZone --run`
Expected: PASS — all new + existing tests green.

- [ ] **Step 5: Commit**

```bash
git add packages/ui/src/components/Canvas/EditMode/OutcomeZone/
git commit -m "feat(wedge-v1): LV1-G task 2 — OutcomeCard scope visualization

Subscribes to scope.yColumn; renders green border + ring + bg-green-50
+ inline ✓ marker when yColumn matches columnName. Dims to opacity-50
when scope is non-empty and chip is out of scope.

Spec §4.5. Sub-plan task 2 of 5."
```

---

## Task 3: FactorChip scope visualization (3 surfaces — Y marker, categorical badge, dim)

**Files:**

- Modify: `packages/ui/src/components/Canvas/EditMode/FactorZone/FactorChip.tsx`
- Modify: `packages/ui/src/components/Canvas/EditMode/FactorZone/__tests__/FactorChip.test.tsx`

- [ ] **Step 1: Write the failing tests**

Append to `FactorChip.test.tsx`:

```tsx
import { useAnalysisScopeStore } from '@variscout/stores';

describe('FactorChip scope visualization (LV1-G)', () => {
  beforeEach(() => {
    useAnalysisScopeStore.setState(useAnalysisScopeStore.getInitialState());
  });

  it('renders baseline when scope is empty', () => {
    const { container } = render(
      <FactorChip
        control={createTestFactorControl({ factor: 'temperature' })}
        onSpecsClick={vi.fn()}
      />
    );
    const root = container.firstChild as HTMLElement;
    expect(root.className).not.toMatch(/border-blue-600/);
    expect(root.className).not.toMatch(/opacity-50/);
    expect(screen.queryByText('✓')).toBeNull();
    expect(screen.queryByText(/only/)).toBeNull();
  });

  it('renders blue border + ✓ when scope.boxplotFactor matches factor', () => {
    useAnalysisScopeStore.getState().setBoxplotFactor('temperature');
    const { container } = render(
      <FactorChip
        control={createTestFactorControl({ factor: 'temperature' })}
        onSpecsClick={vi.fn()}
      />
    );
    const root = container.firstChild as HTMLElement;
    expect(root.className).toMatch(/border-blue-600/);
    expect(root.className).toMatch(/ring-blue-500\/30/);
    expect(root.className).toMatch(/bg-blue-50/);
    expect(screen.getByText('✓')).toBeInTheDocument();
  });

  it('renders categorical badge when categoricalFilters has matching column', () => {
    useAnalysisScopeStore.getState().addCategoricalValue('vessel', 'A');
    useAnalysisScopeStore.getState().addCategoricalValue('vessel', 'B');
    const { container } = render(
      <FactorChip control={createTestFactorControl({ factor: 'vessel' })} onSpecsClick={vi.fn()} />
    );
    expect(screen.getByText('vessel = A, B only')).toBeInTheDocument();
    // categorical match alone does NOT dim (in-scope via categorical path)
    const root = container.firstChild as HTMLElement;
    expect(root.className).not.toMatch(/opacity-50/);
  });

  it('renders both Y marker and categorical badge when both paths match', () => {
    useAnalysisScopeStore.getState().setBoxplotFactor('vessel');
    useAnalysisScopeStore.getState().addCategoricalValue('vessel', 'A');
    render(
      <FactorChip control={createTestFactorControl({ factor: 'vessel' })} onSpecsClick={vi.fn()} />
    );
    expect(screen.getByText('✓')).toBeInTheDocument();
    expect(screen.getByText('vessel = A only')).toBeInTheDocument();
  });

  it('dims when scope is non-empty and neither path matches', () => {
    useAnalysisScopeStore.getState().setY('yield');
    const { container } = render(
      <FactorChip
        control={createTestFactorControl({ factor: 'temperature' })}
        onSpecsClick={vi.fn()}
      />
    );
    const root = container.firstChild as HTMLElement;
    expect(root.className).toMatch(/opacity-50/);
    expect(screen.queryByText('✓')).toBeNull();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm --filter @variscout/ui test -- src/components/Canvas/EditMode/FactorZone --run`
Expected: FAIL — markers and badge not implemented.

- [ ] **Step 3: Implement scope visualization in FactorChip.tsx**

1. Add imports:

```typescript
import { useAnalysisScopeStore } from '@variscout/stores';
import { useScopeIsEmpty } from '../hooks/useScopeIsEmpty';
```

2. Inside the component (before the `return`, after `bindingPillClasses`):

```typescript
const boxplotFactor = useAnalysisScopeStore(s => s.boxplotFactor);
const categoricalFilters = useAnalysisScopeStore(s => s.categoricalFilters);
const matchingFilter = categoricalFilters.find(f => f.column === control.factor);
const isYMatch = boxplotFactor === control.factor;
const isInScope = isYMatch || matchingFilter !== undefined;
const scopeIsEmpty = useScopeIsEmpty();
const shouldDim = !scopeIsEmpty && !isInScope;

const rootClasses = [
  'group flex flex-col gap-1 rounded-md border p-3 text-content',
  isYMatch
    ? 'border-blue-600 ring-1 ring-blue-500/30 bg-blue-50'
    : 'border-edge bg-surface-primary',
  shouldDim ? 'opacity-50' : '',
]
  .filter(Boolean)
  .join(' ');
```

3. Replace the root `<div>` with `<div className={rootClasses}>`.

4. Inside the header row, add the ✓ marker BEFORE the `control.factor` span:

```tsx
{
  isYMatch && (
    <span aria-hidden="true" className="text-blue-700">
      ✓
    </span>
  );
}
<span className="text-base font-semibold">{control.factor}</span>;
```

5. Inside the secondary-pill flex row, append the categorical badge:

```tsx
<div className="flex flex-wrap gap-1 text-xs text-content-secondary">
  <span className="rounded bg-surface-secondary px-2 py-0.5">
    {formatTargetCondition(control.targetCondition)}
  </span>
  <span className={`rounded px-2 py-0.5 ${bindingPillClasses}`}>
    {isStepBound ? `step ${control.stepId}` : 'global'}
  </span>
  {matchingFilter && (
    <span className="rounded bg-amber-50 px-2 py-0.5 text-amber-700">
      {control.factor} = {matchingFilter.values.join(', ')} only
    </span>
  )}
</div>
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm --filter @variscout/ui test -- src/components/Canvas/EditMode/FactorZone --run`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/ui/src/components/Canvas/EditMode/FactorZone/
git commit -m "feat(wedge-v1): LV1-G task 3 — FactorChip scope visualization

Subscribes to scope.boxplotFactor + scope.categoricalFilters. Two
in-scope paths: boxplot-factor match → blue border + ✓; categorical-
filters match → '{factor} = A, B only' badge slotted into existing
secondary-pill flex row. Either path keeps chip non-dimmed.

Spec §4.5. Sub-plan task 3 of 5."
```

---

## Task 4: StepBox scope visualization

**Files:**

- Modify: `packages/ui/src/components/Canvas/EditMode/ProcessZone/StepBox.tsx`
- Modify: `packages/ui/src/components/Canvas/EditMode/ProcessZone/__tests__/StepBox.test.tsx`

- [ ] **Step 1: Write the failing tests**

Append to `StepBox.test.tsx` (uses `makeStep()` factory + `renderInDnd()`):

```tsx
import { useAnalysisScopeStore } from '@variscout/stores';

describe('StepBox scope visualization (LV1-G)', () => {
  beforeEach(() => {
    useAnalysisScopeStore.setState(useAnalysisScopeStore.getInitialState());
  });

  it('renders baseline when scope is empty', () => {
    const step = makeStep({ id: 'step-1', name: 'Assemble' });
    const { container } = renderInDnd(<StepBox step={step} />);
    const root = container.querySelector('[data-testid="step-box-step-1"]') as HTMLElement;
    expect(root.className).not.toMatch(/border-amber-600/);
    expect(root.className).not.toMatch(/opacity-50/);
    expect(screen.queryByText('active')).toBeNull();
  });

  it('renders amber border + active badge when scope.stepId matches', () => {
    useAnalysisScopeStore.getState().setStepId('step-1');
    const step = makeStep({ id: 'step-1', name: 'Assemble' });
    const { container } = renderInDnd(<StepBox step={step} />);
    const root = container.querySelector('[data-testid="step-box-step-1"]') as HTMLElement;
    expect(root.className).toMatch(/border-amber-600/);
    expect(root.className).toMatch(/ring-amber-500\/30/);
    expect(root.className).toMatch(/bg-amber-50/);
    expect(screen.getByText('active')).toBeInTheDocument();
  });

  it('dims when scope is non-empty and stepId does not match', () => {
    useAnalysisScopeStore.getState().setStepId('step-other');
    const step = makeStep({ id: 'step-1', name: 'Assemble' });
    const { container } = renderInDnd(<StepBox step={step} />);
    const root = container.querySelector('[data-testid="step-box-step-1"]') as HTMLElement;
    expect(root.className).toMatch(/opacity-50/);
    expect(screen.queryByText('active')).toBeNull();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm --filter @variscout/ui test -- src/components/Canvas/EditMode/ProcessZone --run`
Expected: FAIL.

- [ ] **Step 3: Implement scope visualization in StepBox.tsx**

1. Add imports:

```typescript
import { MapPin } from 'lucide-react';
import { useAnalysisScopeStore } from '@variscout/stores';
import { useScopeIsEmpty } from '../hooks/useScopeIsEmpty';
```

2. Inside the component (before the `return`):

```typescript
const scopeStepId = useAnalysisScopeStore(s => s.stepId);
const isInScope = scopeStepId === step.id;
const scopeIsEmpty = useScopeIsEmpty();
const shouldDim = !scopeIsEmpty && !isInScope;

const rootClasses = [
  'group flex min-w-0 flex-col rounded-md border p-2',
  isInScope
    ? 'border-amber-600 ring-1 ring-amber-500/30 bg-amber-50'
    : 'border-edge bg-surface-primary',
  shouldDim ? 'opacity-50' : '',
]
  .filter(Boolean)
  .join(' ');
```

3. Replace the root `<div>` with `<div data-testid={...} className={rootClasses}>`.

4. Inside the `<header>`, add the active badge AFTER the step-name span and BEFORE the optional timing/resource/explore badges:

```tsx
      <header className="flex items-center gap-2">
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-surface-secondary text-xs text-content-secondary">
          {step.order + 1}
        </span>
        <span className="truncate text-sm font-medium text-content">{step.name}</span>
        {isInScope && (
          <span className="ml-1 inline-flex items-center gap-1 rounded bg-amber-50 px-2 py-0.5 text-xs text-amber-700">
            <MapPin size={12} aria-hidden="true" /> active
          </span>
        )}
        {timingBadge ? (
          <span className="ml-auto text-xs text-content-secondary">{timingBadge}</span>
        ) : null}
        {/* ... rest unchanged */}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm --filter @variscout/ui test -- src/components/Canvas/EditMode/ProcessZone --run`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/ui/src/components/Canvas/EditMode/ProcessZone/
git commit -m "feat(wedge-v1): LV1-G task 4 — StepBox scope visualization

Subscribes to scope.stepId. In-scope step renders amber border + ring +
bg-amber-50 + MapPin lucide-icon badge with 'active' text. Out-of-scope
steps dim to opacity-50 when scope is non-empty. (📍 emoji from spec
replaced with MapPin per no-emoji rule.)

Spec §4.5. Sub-plan task 4 of 5."
```

---

## Task 5: Pre-PR sweep

**No code changes — controller-level verification.**

- [ ] **Step 1: Run full sweep**

```bash
pnpm --filter @variscout/ui test --run
pnpm --filter @variscout/ui build
pnpm --filter @variscout/azure-app test --run
pnpm --filter @variscout/azure-app build
bash scripts/pr-ready-check.sh
```

Expected outcomes:

- @variscout/ui test — all green (~16 new tests across 4 new files + 3 existing modified test files)
- @variscout/ui build — clean
- @variscout/azure-app test — green modulo pre-existing `ControlEditors.test.tsx` flake
- @variscout/azure-app build — clean
- pr-ready-check — green

If `ControlEditors.test.tsx` flake surfaces, verify structural unrelation:

```bash
git diff --stat main..HEAD -- 'apps/azure/src/components/ControlEditors*' 'apps/azure/src/services/*'
```

Empty diff confirms unrelated. Document in PR description.

- [ ] **Step 2: Acceptance + emoji grep**

```bash
grep -rn "useAnalysisScopeStore" packages/ui/src/components/Canvas/EditMode/
# Expected: hits in OutcomeCard, FactorChip, StepBox, useScopeIsEmpty (+ tests).

grep -rn "border-green-600\|border-blue-600\|border-amber-600" packages/ui/src/components/Canvas/EditMode/
# Expected: hits in the three chip files.

grep -rn "📍" packages/ui/src/
# Expected: ZERO HITS.
```

- [ ] **Step 3: No commit needed (sweep is verification only)**

---

## Execution model

- Worktree: `lv1-g-canvas-scope-visualization` (`EnterWorktree`).
- Per-task implementer: Sonnet. Pragmatic-review pattern — skip per-task spec/quality reviewer pairs; final-branch Opus review only after Task 5 (matches LV1-D / LV1-E / LV1-F precedent per `feedback_prefer_pragmatic_over_formal`).
- Pre-PR sweep at controller level (Task 5).
- `gh pr create` referencing master plan + this sub-plan + spec §4.5. Title: `feat(wedge-v1): LV1-G — canvas live scope visualization`.
- Final-branch Opus code review (STEP 0: `git fetch && git checkout && git branch --show-current`). Reviewer scope: full branch diff + verify (a) no 700+ fill tokens, (b) `✓` glyph (not Check icon) on outcome/factor, (c) `MapPin` icon (not 📍 emoji) on step, (d) categorical badge slots into existing flex row, (e) dim condition gated on `!scopeIsEmpty && !isInScope`.
- `gh pr merge --merge --delete-branch` (NEVER `--squash`).
- `ExitWorktree` action `remove`, `discard_changes: true`. Then `git pull --ff-only origin main`.

## Acceptance signals

1. **OutcomeCard:** set `scope.yColumn = 'yield'` → outcome chip with `columnName === 'yield'` renders with `border-green-600 ring-1 ring-green-500/30 bg-green-50` + `✓` glyph. All other outcomes (and all factors / steps) dim to `opacity-50`.
2. **FactorChip Y-match:** set `scope.boxplotFactor = 'temperature'` → factor chip with `factor === 'temperature'` renders with `border-blue-600 ring-1 ring-blue-500/30 bg-blue-50` + `✓` glyph.
3. **FactorChip categorical match:** call `scope.addCategoricalValue('vessel', 'A')` → factor chip with `factor === 'vessel'` shows badge `"vessel = A only"` in the existing secondary-pill row + does NOT dim.
4. **StepBox:** set `scope.stepId = 'step-1'` → StepBox with `step.id === 'step-1'` renders with `border-amber-600 ring-1 ring-amber-500/30 bg-amber-50` + MapPin "active" badge.
5. **Empty scope:** `scope.clearScope()` → all chips render baseline (no markers, no badges, no dim).
6. **No emojis in source:** `grep -rn "📍" packages/ui/src/` returns zero hits.

## Risks + mitigations

- **Risk:** Color tokens (`border-green-600` + `ring-1 ring-green-500/30`) look too subtle on light surfaces.
  - **Mitigation:** Acceptance signals are functional. Visual polish is a post-merge concern.
- **Risk:** Dimming ALL chips when scope is non-empty feels visually noisy in practice.
  - **Mitigation:** Spec mandates it. Ship as-spec; user can amend via decision-log entry post-merge.
- **Risk:** `useScopeIsEmpty()` re-renders chips on every scope mutation.
  - **Mitigation:** Zustand selectors are stable; flag flips only on transitions. Canvas has ~5–20 chips max in V1.
- **Risk:** FactorChip's two in-scope paths create test combinatorics.
  - **Mitigation:** 5 tests in Task 3 cover the 2×2 matrix + baseline.
- **Risk:** Pre-existing `ControlEditors.test.tsx` flake recurs (has on LV1-0/A/B/H/C/D/E/F).
  - **Mitigation:** Standard structural-unrelation verification + PR-description note.
- **Risk:** `renderHook` may not be exported from `@testing-library/react` in the version pinned.
  - **Mitigation:** It's the standard API in `@testing-library/react@^13`. If missing, fall back to wrapping the hook in a tiny test component that exposes the return value via a ref or `data-` attribute.

## Related

- Spec §4.5 — Live scope visualization on canvas (acceptance signals + dim rule)
- Master plan PR-LV1-G row 7
- LV1-A sub-plan — `analysisScopeStore` foundation
- LV1-D sub-plan — `navigateToExploreForChip` (click affordance precedent + `ExploreJumpButton` import)
- LV1-E sub-plan — `OutcomeSummaryPill` (inline scope-subscription pattern precedent)
- LV1-F sub-plan — produces the `categoricalFilters` that the FactorChip categorical badge reads
