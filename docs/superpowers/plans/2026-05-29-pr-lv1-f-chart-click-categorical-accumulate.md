---
tier: ephemeral
purpose: build
title: PR-LV1-F — Pareto + Boxplot click → categorical accumulate
status: delivered
date: 2026-05-29
layer: spec
---

# PR-LV1-F — Chart-Click Categorical Accumulate Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wire Pareto bar clicks and Boxplot category/whisker clicks to `useAnalysisScopeStore.addCategoricalValue(factor, key)` so the Explore scope chrome (LV1-E) accumulates categorical filter values live as the user explores. Spec §5.4.

**Architecture:** Pure additive — extend the shared `ParetoChartWrapperBase` + `BoxplotWrapperBase` in `@variscout/ui` with one optional callback prop (`onScopeAccumulate?: (factor, key) => void`) that fires unconditionally inside the existing internal click handlers (alongside legacy filter-toggle / `onDrillDown`). Azure thin wrappers (`apps/azure/src/components/charts/*`) pass the callback wired to `useAnalysisScopeStore.getState().addCategoricalValue` via the existing `{...props}` spread from Dashboard.tsx. PWA thin wrappers get a `TODO(lv1-f-pwa)` comment only — no functional change (mirrors LV1-E's PWA deferral; PWA `<ScopeChrome>` is deferred per `docs/superpowers/plans/2026-05-28-linked-views-phase-1-master-plan.md` §PWA-Mount-Deferral).

**Tech Stack:** TypeScript · React · Zustand (`@variscout/stores/analysisScopeStore`) · vitest + @testing-library/react · happy-dom · pnpm workspaces.

---

## Parent context

- **Spec:** `docs/superpowers/specs/2026-05-28-state-edit-mode-and-ip-scoped-presentation-design.md` §5.4 (Drill-in from charts).
- **Master plan:** `docs/superpowers/plans/2026-05-28-linked-views-phase-1-master-plan.md` PR-LV1-F row (Sonnet, "Pareto bar + Boxplot category click → `addCategoricalValue()` accumulation").
- **Sibling shipped PRs:**
  - LV1-A `analysisScopeStore` foundation — `addCategoricalValue` already feature-complete + tested at `packages/stores/src/analysisScopeStore.ts:50-65`.
  - LV1-E Explore scope chrome — `ScopeChrome` subscribes to `categoricalFilters`; categorical chip auto-updates on store mutation. **No extra wiring needed in this PR** to make accumulated values appear in the chrome.
- **Out of scope:** I-Chart point → date filter, Histogram bucket → value-bin filter, Capability annotation → above/below-spec filter (all explicitly Phase 2 / T-NEW-4 per spec §5.4 final paragraph).

## Spec §5.4 verbatim

```
Two chart interactions add categorical filter values to scope:

- Pareto bar click → scope.addCategoricalValue(paretoFactor, clickedCategory)
  — additive (creates filter if factor not yet in scope; appends value if filter exists)
- Boxplot category click / whisker click → scope.addCategoricalValue(boxplotFactor, clickedCategory)

Repeated clicks accumulate values within the same factor. Click "vessel=A" then
"vessel=B" → vessel = [A, B]. The categorical chip in scope chrome updates to
show vessel: A, B. Click the chip → opens FilterChipDropdown for fine-grained
editing.
```

## Architectural decisions

### D-LV1F-1: `onScopeAccumulate` prop on `*WrapperBase` (3-hop pass-through, not 4)

The original scratch-plan suggested a 4-hop chain (`chart → WrapperBase → DashboardLayoutBase → Dashboard`). After verifying source, **`DashboardLayoutBase` accepts charts as `renderParetoContent: React.ReactNode` / `renderBoxplotContent: React.ReactNode`** — the chart node is constructed by Dashboard.tsx and injected, not prop-threaded through the layout. So the actual chain is 3 hops: `chart → WrapperBase → Azure thin wrapper (with {...props} spread) ← Dashboard.tsx caller`.

The cleanest extension point is the shared `ParetoChartWrapperBase` / `BoxplotWrapperBase` in `@variscout/ui`. Both already know `factor`, already have an internal `handleBarClick(key)` / `handleBoxClick(key)`. We add one new optional callback prop and invoke it unconditionally inside that handler.

### D-LV1F-2: Callback fires unconditionally, in addition to existing branches

Today's internal handlers (e.g. `ParetoChartWrapperBase.handleBarClick` at lines 339-350) have two branches:

1. If `onDrillDown` provided → `onDrillDown(factor, key)` + early return.
2. Otherwise → toggle legacy `filters[factor]` via `onFiltersChange`.

`onScopeAccumulate` is **independent of both**. It fires before the if/else, so:

- Callers using legacy filters still get filter-toggle behavior.
- Callers using `onDrillDown` still drill.
- Scope-store accumulation always happens when the prop is provided.

This decouples LV1-F from any existing filter-system migration and keeps blast radius tight (D-LV1F-3 of the approved scratch plan: "No coupling to existing `handleDrillDown`").

### D-LV1F-3: Charts stay scope-store-agnostic

`@variscout/charts` and `@variscout/ui/*WrapperBase` know **nothing** about `useAnalysisScopeStore`. They only forward callbacks. The store dispatch lives in the Azure thin wrapper (`apps/azure/src/components/charts/{ParetoChart,Boxplot}.tsx`). Verification: `grep -rn "useAnalysisScopeStore\|analysisScopeStore" packages/charts/ packages/ui/src/components/{ParetoChartWrapper,BoxplotWrapper}/` returns **zero hits** post-merge.

### D-LV1F-4: PWA wiring deferred (parallel to LV1-E precedent)

PWA thin wrappers (`apps/pwa/src/components/charts/{ParetoChart,Boxplot}.tsx`) get a one-line `TODO(lv1-f-pwa)` comment but no functional change. Reasoning: PWA has no `<ScopeChrome>` mounted (deferred until PWA gains a Process tab), so dispatching scope mutations would be invisible plumbing. Comment text:

```
// TODO(lv1-f-pwa): Pass onScopeAccumulate={(f,k)=>useAnalysisScopeStore.getState().addCategoricalValue(f,k)}
// once PWA mounts <ScopeChrome>. See docs/superpowers/plans/2026-05-28-linked-views-phase-1-master-plan.md
// §PWA-Mount-Deferral (decision 2026-05-29).
```

### D-LV1F-5: Pareto's `shiftKey` context dropped

Pareto's existing `BarClickContext.shiftKey` is preserved at the chart level for any consumer that already uses it, but `onScopeAccumulate` signature drops it: `(factor, key) => void` only. If a future PR (T-NEW-4 / Phase 2) wants shift-click-replace semantics, it can extend the callback then.

### D-LV1F-6: Key type accepts `string | number`

`scope.addCategoricalValue(column, value: string | number)` matches the chart-level `d.key` type which is `string` for Pareto/Boxplot today. `onScopeAccumulate?: (factor: string, key: string | number) => void` to match the store's accepted type; chart internals pass `key` as-is.

## Files

### Modify

- `packages/ui/src/components/ParetoChartWrapper/index.tsx` — add `onScopeAccumulate?: (factor: string, key: string | number) => void` to `ParetoChartWrapperBaseProps`; invoke in `handleBarClick`.
- `packages/ui/src/components/ParetoChartWrapper/__tests__/ParetoChartWrapper.test.tsx` — add 2 tests covering `onScopeAccumulate` dispatch (fires alongside legacy filter-toggle; fires when `onDrillDown` provided).
- `packages/ui/src/components/BoxplotWrapper/index.tsx` — add `onScopeAccumulate?: (factor: string, key: string | number) => void` to `BoxplotWrapperBaseProps`; invoke in `handleBoxClick`.
- `packages/ui/src/components/BoxplotWrapper/__tests__/BoxplotWrapper.test.tsx` — create or extend test file with 2 tests (fires on box-click, fires on whisker-click since Group at `Boxplot.tsx:236` covers both).
- `apps/azure/src/components/charts/ParetoChart.tsx` — import `useAnalysisScopeStore` from `@variscout/stores`; pass `onScopeAccumulate={onScopeAccumulate}` (callback constructed at top of component) to `<ParetoChartWrapperBase>`.
- `apps/azure/src/components/charts/Boxplot.tsx` — same pattern.
- `apps/azure/src/components/__tests__/` — add or extend an integration test asserting that simulated bar click mutates `useAnalysisScopeStore.getState().categoricalFilters` with the expected `{ column: factor, values: [key] }`.
- `apps/pwa/src/components/charts/ParetoChart.tsx` — `TODO(lv1-f-pwa)` comment near `<ParetoChartWrapperBase>` render.
- `apps/pwa/src/components/charts/Boxplot.tsx` — same TODO.
- `apps/pwa/src/components/Dashboard.tsx` — update the existing `TODO(lv1-e-pwa-mount)` comment to read `DEFERRED(lv1-pwa-mount)` with the rationale block from the scratch plan §3.

### No changes (verify only)

- `packages/charts/src/ParetoChart.tsx` — `onClick={(e) => onBarClick?.(d.key, { shiftKey: e.shiftKey })}` at line 176 fires today.
- `packages/charts/src/Boxplot.tsx` — `onClick={() => onBoxClick?.(d.key)}` at line 238 fires today; whisker click routed through same Group wrapper at line 236.
- `packages/stores/src/analysisScopeStore.ts` — `addCategoricalValue` feature-complete + tested.
- `packages/ui/src/components/Explore/ScopeChrome/*` — auto-updates via Zustand subscription.
- `packages/ui/src/components/DashboardBase/DashboardLayoutBase.tsx` — untouched (charts injected as `React.ReactNode`).

## Constraints

- **Never** `--no-verify` on commits (`feedback_subagent_no_verify`).
- No `Math.random` anywhere.
- No `dark:` Tailwind variants (wedge V1 no-dark-mode invariant).
- No emojis in source code (Unicode arrow/symbol glyphs `→`/`✓`/`×` allowed where the existing code uses them).
- No `"root cause"` in any comment / docstring (P5 amended — use "contribution" / "suspected cause" / "mechanism").
- No `Pp` / `Ppk` — `Cpk` only.
- `@variscout/charts` MAY NOT import React-app code, Zustand stores, or apps/.
- `packages/ui/src/components/{ParetoChartWrapper,BoxplotWrapper}/` MAY NOT import `useAnalysisScopeStore` — store dispatch lives in the Azure thin wrapper only (D-LV1F-3).
- `@variscout/ui` MAY NOT import from `apps/`.
- No migration helpers / no back-compat shims (`feedback_wedge_v1_no_migration_no_backcompat`).
- Use factories not literals for domain types in tests; for `FilterChipData` / `BoxplotGroupData` etc., factories live in `@variscout/core` or `packages/ui/src/test-utils/`. Add new helpers if ≥3 fixtures needed.
- Operate ONLY in the assigned worktree (`feedback_subagent_worktree_discipline`).
- Skip browser walks for wedge V1 (`feedback_wedge_v1_no_migration_no_backcompat`).
- Preserved-identifier list applies — we're ADDING props, not renaming. Don't touch `AnalysisMode`, `Dashboard.tsx`, panelsStore keys, ADR-074 timing concepts.
- Implementer verification scoped to <90s targeted runs (`feedback_implementer_long_bash_pitfall`). Full sweep is controller-level after Task 4.

---

## Task 1: `onScopeAccumulate` on `ParetoChartWrapperBase` + tests

**Files:**

- Modify: `packages/ui/src/components/ParetoChartWrapper/index.tsx` (add prop + invoke in `handleBarClick`)
- Modify: `packages/ui/src/components/ParetoChartWrapper/__tests__/ParetoChartWrapper.test.tsx` (add 2 tests)

- [ ] **Step 1: Write the failing tests**

Add these tests to `packages/ui/src/components/ParetoChartWrapper/__tests__/ParetoChartWrapper.test.tsx` (after the existing test suite; mocks at the top of the file already cover `useParetoChartData`):

```tsx
describe('onScopeAccumulate (LV1-F)', () => {
  it('fires onScopeAccumulate(factor, key) on bar click, alongside legacy filter toggle', () => {
    const onScopeAccumulate = vi.fn();
    const onFiltersChange = vi.fn();
    render(
      <ParetoChartWrapperBase
        parentWidth={400}
        parentHeight={300}
        factor="vessel"
        rawData={[]}
        filteredData={[]}
        outcome="rate"
        filters={{}}
        onFiltersChange={onFiltersChange}
        columnAliases={{}}
        onColumnAliasesChange={() => {}}
        onScopeAccumulate={onScopeAccumulate}
      />
    );
    const bar = screen.getAllByTestId(/pareto-bar-/i)[0];
    fireEvent.click(bar);
    expect(onScopeAccumulate).toHaveBeenCalledWith('vessel', 'A');
    // Legacy filter-toggle ALSO fires (no `onDrillDown` provided)
    expect(onFiltersChange).toHaveBeenCalled();
  });

  it('fires onScopeAccumulate alongside onDrillDown when both provided', () => {
    const onScopeAccumulate = vi.fn();
    const onDrillDown = vi.fn();
    render(
      <ParetoChartWrapperBase
        parentWidth={400}
        parentHeight={300}
        factor="vessel"
        rawData={[]}
        filteredData={[]}
        outcome="rate"
        filters={{}}
        onFiltersChange={() => {}}
        columnAliases={{}}
        onColumnAliasesChange={() => {}}
        onDrillDown={onDrillDown}
        onScopeAccumulate={onScopeAccumulate}
      />
    );
    const bar = screen.getAllByTestId(/pareto-bar-/i)[0];
    fireEvent.click(bar);
    expect(onScopeAccumulate).toHaveBeenCalledWith('vessel', 'A');
    expect(onDrillDown).toHaveBeenCalledWith('vessel', 'A');
  });
});
```

Note: if `ParetoChartBase` doesn't render `data-testid="pareto-bar-{key}"` on bars, the existing test file's mock data already produces bars with `data-testid` per the fixture pattern — verify and adjust the selector accordingly. If no testid exists, use `container.querySelectorAll('rect')` and filter by index per the existing test file's idioms.

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm --filter @variscout/ui test -- src/components/ParetoChartWrapper --run`
Expected: FAIL with "Property 'onScopeAccumulate' does not exist on type 'IntrinsicAttributes & ParetoChartWrapperBaseProps'" (TypeScript) or "onScopeAccumulate is not a function" at runtime.

- [ ] **Step 3: Implement the prop**

In `packages/ui/src/components/ParetoChartWrapper/index.tsx`:

1. Add prop to `ParetoChartWrapperBaseProps` (place near `onDrillDown` for readability):

```typescript
  /**
   * LV1-F: Linked-views scope accumulation. When provided, fires on every bar click
   * with `(factor, key)` regardless of legacy filter-toggle or `onDrillDown` branches.
   * Caller (Azure thin wrapper) wires this to `useAnalysisScopeStore.addCategoricalValue`.
   * Spec §5.4. Scope-store-agnostic at this layer per D-LV1F-3.
   */
  onScopeAccumulate?: (factor: string, key: string | number) => void;
```

2. Destructure in the component signature:

```typescript
  onScopeAccumulate,
```

3. Invoke unconditionally at the top of `handleBarClick`:

```typescript
const handleBarClick = (key: string, _ctx?: { shiftKey: boolean }) => {
  onScopeAccumulate?.(factor, key);
  if (onDrillDown) {
    onDrillDown(factor, key);
    return;
  }
  // Legacy behavior: toggle filter membership in filters[factor]
  const currentFilters = filters[factor] || [];
  const newFilters = currentFilters.includes(key)
    ? currentFilters.filter(v => v !== key)
    : [...currentFilters, key];
  onFiltersChange({ ...filters, [factor]: newFilters });
};
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm --filter @variscout/ui test -- src/components/ParetoChartWrapper --run`
Expected: PASS — both new tests green; existing tests unchanged.

- [ ] **Step 5: Commit**

```bash
git add packages/ui/src/components/ParetoChartWrapper/
git commit -m "feat(wedge-v1): LV1-F task 1 — onScopeAccumulate on ParetoChartWrapperBase

Adds optional callback that fires (factor, key) on every bar click
alongside existing legacy filter-toggle / onDrillDown branches. Layer
stays scope-store-agnostic; Azure thin wrapper will dispatch in task 3.

Spec §5.4. Sub-plan task 1 of 4."
```

---

## Task 2: `onScopeAccumulate` on `BoxplotWrapperBase` + tests

**Files:**

- Modify: `packages/ui/src/components/BoxplotWrapper/index.tsx` (add prop + invoke in `handleBoxClick`)
- Create or extend: `packages/ui/src/components/BoxplotWrapper/__tests__/BoxplotWrapper.test.tsx`

- [ ] **Step 1: Write the failing tests**

If `BoxplotWrapper/__tests__/BoxplotWrapper.test.tsx` doesn't exist, create it with this scaffold mirroring `ParetoChartWrapper.test.tsx` (vi.mock pattern for `useBoxplotData` etc.). If it exists, append the LV1-F describe block.

```tsx
describe('onScopeAccumulate (LV1-F)', () => {
  it('fires onScopeAccumulate(factor, key) on box click', () => {
    const onScopeAccumulate = vi.fn();
    render(
      <BoxplotWrapperBase
        parentWidth={400}
        parentHeight={300}
        factor="vessel"
        filteredData={
          [
            /* seeded rows with vessel='A' and vessel='B' */
          ]
        }
        outcome="rate"
        specs={{}}
        filters={{}}
        onFiltersChange={() => {}}
        columnAliases={{}}
        onColumnAliasesChange={() => {}}
        valueLabels={{}}
        onValueLabelsChange={() => {}}
        displayOptions={{
          showSpecs: true,
          boxplotSortBy: 'key',
          boxplotSortDirection: 'asc',
          showViolin: false,
        }}
        yDomainMin={0}
        yDomainMax={100}
        onScopeAccumulate={onScopeAccumulate}
      />
    );
    const group = screen.getAllByTestId(/boxplot-group-/i)[0];
    fireEvent.click(group);
    expect(onScopeAccumulate).toHaveBeenCalledWith('vessel', 'A');
  });

  it('fires onScopeAccumulate when whisker zone clicked (covered by same Group wrapper)', () => {
    // Boxplot's <Group> at packages/charts/src/Boxplot.tsx:236 covers whiskers + box
    // → whisker click routes through the same onBoxClick handler.
    const onScopeAccumulate = vi.fn();
    render(/* same as above */);
    // Click on a whisker line element nested under the Group
    const whisker = screen.getAllByTestId(/boxplot-group-/i)[0].querySelector('line');
    fireEvent.click(whisker!);
    expect(onScopeAccumulate).toHaveBeenCalledWith('vessel', 'A');
  });
});
```

Test-data note: seed `filteredData` with enough rows for `useBoxplotData` to produce ≥1 group, OR mock `useBoxplotData` / `sortBoxplotData` to return a fixture (mirror `ParetoChartWrapper.test.tsx`'s mock-everything pattern if simpler).

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm --filter @variscout/ui test -- src/components/BoxplotWrapper --run`
Expected: FAIL — type error on `onScopeAccumulate` or callback not called.

- [ ] **Step 3: Implement the prop**

In `packages/ui/src/components/BoxplotWrapper/index.tsx`:

1. Add to `BoxplotWrapperBaseProps`:

```typescript
  /**
   * LV1-F: Linked-views scope accumulation. Fires `(factor, key)` on every box /
   * whisker click. Caller (Azure thin wrapper) wires this to
   * `useAnalysisScopeStore.addCategoricalValue`. Spec §5.4.
   */
  onScopeAccumulate?: (factor: string, key: string | number) => void;
```

2. Destructure: `onScopeAccumulate,`

3. Invoke at the top of `handleBoxClick`:

```typescript
const handleBoxClick = (key: string) => {
  onScopeAccumulate?.(factor, key);
  if (onDrillDown) {
    onDrillDown(factor, key);
  } else {
    const currentFilters = filters[factor] || [];
    const newFilters = currentFilters.includes(key)
      ? currentFilters.filter(v => v !== key)
      : [...currentFilters, key];
    onFiltersChange({ ...filters, [factor]: newFilters });
  }
};
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm --filter @variscout/ui test -- src/components/BoxplotWrapper --run`
Expected: PASS — both new tests green.

- [ ] **Step 5: Commit**

```bash
git add packages/ui/src/components/BoxplotWrapper/
git commit -m "feat(wedge-v1): LV1-F task 2 — onScopeAccumulate on BoxplotWrapperBase

Adds optional callback firing on every box/whisker click. Whisker
zone covered by Boxplot.tsx:236 Group wrapper. Layer stays
scope-store-agnostic; Azure thin wrapper dispatches in task 3.

Spec §5.4. Sub-plan task 2 of 4."
```

---

## Task 3: Azure thin-wrapper dispatch + Dashboard integration test

**Files:**

- Modify: `apps/azure/src/components/charts/ParetoChart.tsx` (import + callback + pass-through)
- Modify: `apps/azure/src/components/charts/Boxplot.tsx` (same pattern)
- Modify or create: `apps/azure/src/components/__tests__/Dashboard.test.tsx` (or chart-specific test file) — add integration test

- [ ] **Step 1: Write the failing integration test**

Append to `apps/azure/src/components/__tests__/Dashboard.test.tsx` (or the chart-test file that already mounts `<ParetoChart>` / `<Boxplot>` from `./charts/`):

```tsx
import { useAnalysisScopeStore } from '@variscout/stores';

describe('LV1-F chart-click categorical accumulate (Azure)', () => {
  beforeEach(() => {
    useAnalysisScopeStore.setState(useAnalysisScopeStore.getInitialState());
  });

  it('Pareto bar click accumulates into scope.categoricalFilters', () => {
    // Render Dashboard or the Pareto thin wrapper directly with factor='vessel'
    // seeded data containing vessel='A' and vessel='B'
    render(<ParetoChart factor="vessel" parentWidth={400} parentHeight={300} />);
    fireEvent.click(screen.getAllByTestId(/pareto-bar-/i)[0]);
    expect(useAnalysisScopeStore.getState().categoricalFilters).toEqual([
      { column: 'vessel', values: ['A'] },
    ]);
    // Second click accumulates
    fireEvent.click(screen.getAllByTestId(/pareto-bar-/i)[1]);
    expect(useAnalysisScopeStore.getState().categoricalFilters).toEqual([
      { column: 'vessel', values: ['A', 'B'] },
    ]);
  });

  it('Boxplot category click accumulates into scope.categoricalFilters', () => {
    render(<Boxplot factor="vessel" parentWidth={400} parentHeight={300} />);
    fireEvent.click(screen.getAllByTestId(/boxplot-group-/i)[0]);
    expect(useAnalysisScopeStore.getState().categoricalFilters).toEqual([
      { column: 'vessel', values: ['A'] },
    ]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @variscout/azure-app test -- Dashboard --run` (or the specific file path)
Expected: FAIL — `useAnalysisScopeStore.getState().categoricalFilters` empty after click; no dispatch wired yet.

- [ ] **Step 3: Wire Azure thin-wrapper dispatch**

In `apps/azure/src/components/charts/ParetoChart.tsx`:

1. Add import at the top of the file:

```typescript
import { useAnalysisScopeStore } from '@variscout/stores';
```

2. Inside the component body (before the `return`), add a stable callback:

```typescript
const onScopeAccumulate = React.useCallback((factor: string, key: string | number) => {
  useAnalysisScopeStore.getState().addCategoricalValue(factor, key);
}, []);
```

3. Pass it to `<ParetoChartWrapperBase>` (the existing `{...props}` spread allows ordering before or after — either works; place before `{...props}` so callers can override):

```tsx
<ParetoChartWrapperBase
  // ...existing props
  onScopeAccumulate={onScopeAccumulate}
  {...props}
/>
```

Identical pattern in `apps/azure/src/components/charts/Boxplot.tsx`.

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm --filter @variscout/azure-app test -- Dashboard --run`
Expected: PASS — Pareto + Boxplot integration tests green.

Also confirm wrapper tests still pass:
Run: `pnpm --filter @variscout/ui test -- 'src/components/(ParetoChartWrapper|BoxplotWrapper)' --run`
Expected: PASS — no regression.

- [ ] **Step 5: Commit**

```bash
git add apps/azure/src/components/charts/ParetoChart.tsx apps/azure/src/components/charts/Boxplot.tsx apps/azure/src/components/__tests__/Dashboard.test.tsx
git commit -m "feat(wedge-v1): LV1-F task 3 — Azure thin wrappers dispatch to scope store

Wires Pareto + Boxplot click handlers to addCategoricalValue via
useCallback. Integration test asserts accumulation: click vessel=A
then vessel=B → categoricalFilters = [{column:'vessel', values:['A','B']}].

Spec §5.4. Sub-plan task 3 of 4."
```

---

## Task 4: PWA TODOs + pre-PR sweep

**Files:**

- Modify: `apps/pwa/src/components/charts/ParetoChart.tsx` (TODO comment only)
- Modify: `apps/pwa/src/components/charts/Boxplot.tsx` (TODO comment only)
- Modify: `apps/pwa/src/components/Dashboard.tsx` (update existing TODO to `DEFERRED`)

- [ ] **Step 1: Add PWA TODOs**

In `apps/pwa/src/components/charts/ParetoChart.tsx` immediately above the `<ParetoChartWrapperBase>` render (line ~63):

```typescript
{
  /* TODO(lv1-f-pwa): Pass onScopeAccumulate={(f,k)=>useAnalysisScopeStore.getState().addCategoricalValue(f,k)}
          once PWA mounts <ScopeChrome>. See docs/superpowers/plans/2026-05-28-linked-views-phase-1-master-plan.md
          §PWA-Mount-Deferral (decision 2026-05-29). */
}
```

Identical comment in `apps/pwa/src/components/charts/Boxplot.tsx` (line ~76).

In `apps/pwa/src/components/Dashboard.tsx` at the existing `TODO(lv1-e-pwa-mount)` line (~710), replace with:

```typescript
{
  /* DEFERRED(lv1-pwa-mount): Mount <ScopeChrome> when PWA gains a Process tab
          with a process-steps source. Until then, partial mount (Y/factor/categorical,
          no step chip) ships dead UI and scope mutations have no visual consumer.
          See docs/superpowers/plans/2026-05-28-linked-views-phase-1-master-plan.md
          §PWA-Mount-Deferral (decision 2026-05-29). */
}
```

- [ ] **Step 2: Pre-PR full sweep at controller level**

The implementer subagent runs ONLY targeted tests. The controller (parent session) runs the full sweep:

```bash
pnpm --filter @variscout/charts test --run
pnpm --filter @variscout/ui test --run
pnpm --filter @variscout/ui build
pnpm --filter @variscout/azure-app test --run
pnpm --filter @variscout/azure-app build
bash scripts/pr-ready-check.sh
```

Pre-existing `ControlEditors.test.tsx` flake handling: if it surfaces, verify structural unrelation:

```bash
git diff --stat main..HEAD -- 'apps/azure/src/components/ControlEditors*' 'apps/azure/src/services/*'
```

Empty diff confirms unrelated. Document in PR description (same pattern as last 7 PRs).

- [ ] **Step 3: Acceptance + architecture greps**

```bash
grep -rn "onScopeAccumulate" packages/ apps/
# Expected: prop defined in 2 wrapper files, used in 2 Azure thin wrappers,
# tested in 2+ test files. No surprises.

grep -rn "useAnalysisScopeStore\|analysisScopeStore" packages/charts/ packages/ui/src/components/ParetoChartWrapper/ packages/ui/src/components/BoxplotWrapper/
# Expected: ZERO HITS. Chart + wrapper layers stay scope-store-agnostic.
```

- [ ] **Step 4: Commit**

```bash
git add apps/pwa/src/components/charts/ParetoChart.tsx apps/pwa/src/components/charts/Boxplot.tsx apps/pwa/src/components/Dashboard.tsx
git commit -m "feat(wedge-v1): LV1-F task 4 — PWA TODOs + ScopeChrome deferral note

PWA chart click → scope mutation deferred until PWA mounts ScopeChrome
(which itself is deferred until PWA gains Process tab). Updates the
existing TODO(lv1-e-pwa-mount) to DEFERRED(lv1-pwa-mount) with the
2026-05-29 decision rationale. Sub-plan task 4 of 4."
```

---

## Execution model

- Worktree: `lv1-f-chart-click-categorical-accumulate` (`EnterWorktree`).
- Per-task implementer: Sonnet. Pragmatic-review pattern — skip per-task spec/quality reviewer pairs; final-branch Opus review only after Task 4 (matches LV1-H / LV1-D / LV1-E precedent per `feedback_prefer_pragmatic_over_formal`).
- Pre-PR sweep at controller level (Task 4 step 2).
- `gh pr create` referencing master plan + this sub-plan + spec §5.4. Title: `feat(wedge-v1): LV1-F — Pareto + Boxplot click → categorical accumulate`.
- Final-branch Opus code review (STEP 0: `git fetch && git checkout && git branch --show-current` per `feedback_code_review_subagent_must_checkout_pr_branch`). Reviewer scope: full branch diff + verify the two architecture greps return zero/expected hits + verify `useCallback` deps are correct + verify whisker-click test exists.
- `gh pr merge --merge --delete-branch` (NEVER `--squash`).
- `ExitWorktree` action `remove`, `discard_changes: true`. Then `git pull --ff-only origin main`.

## Acceptance signal

End-to-end via the integration test in Task 3:

1. `useAnalysisScopeStore.setState(useAnalysisScopeStore.getInitialState())` in beforeEach.
2. Render Azure `<ParetoChart factor="vessel" ...>` with seeded data containing vessel categories A, B.
3. Click bar for "A" → `useAnalysisScopeStore.getState().categoricalFilters === [{ column: 'vessel', values: ['A'] }]`.
4. Click bar for "B" → `categoricalFilters === [{ column: 'vessel', values: ['A', 'B'] }]`.
5. Click bar for "A" again → idempotent dedup → still `[{ column: 'vessel', values: ['A', 'B'] }]`.
6. Render Azure `<Boxplot factor="vessel" ...>`; same assertions for box click.
7. Whisker click on Boxplot → still fires same handler (covered by Boxplot Group at line 236).

## Risks + mitigations

- **Risk:** `factor` captured in a stale closure inside the Azure thin wrapper's `useCallback`.
  - **Mitigation:** `factor` enters the callback via the `(factor, key)` argument signature; the callback closes over **nothing app-specific**. `useCallback([])` is correct.
- **Risk:** Wrapper-level test fixtures don't render bars/boxes with predictable test-ids.
  - **Mitigation:** Existing `ParetoChartWrapper.test.tsx` mocks `useParetoChartData` to return a fixed `data` array. Mirror the same `vi.mock` pattern for `useBoxplotData` in `BoxplotWrapper.test.tsx`. If test-ids don't exist on chart elements, use `container.querySelectorAll('rect')` with index access (the existing test files use this idiom).
- **Risk:** `useAnalysisScopeStore` import in Azure thin wrapper creates a circular dependency.
  - **Mitigation:** `@variscout/stores` is downstream of `@variscout/ui` per the package layering rule (apps → ui → stores → core). Azure thin wrappers already import many stores; one more is fine. Verify after Task 3 with `pnpm --filter @variscout/azure-app build`.
- **Risk:** Boxplot's whisker zone test requires SVG hit-testing in happy-dom.
  - **Mitigation:** happy-dom dispatches click events to any descendant of a Group wrapper. The test simulates `fireEvent.click(group.querySelector('line'))` — happy-dom bubbles to the Group. If it doesn't, fall back to asserting the box-click case + document whisker-via-Group as covered by Boxplot.tsx:236 source inspection.
- **Risk:** Pre-existing `ControlEditors.test.tsx` flake recurs (it has on LV1-0/A/B/H/C/D/E).
  - **Mitigation:** Structural-unrelation verification + PR-description note (standard pattern).
- **Risk:** Implementer wires PWA dispatch (gold-plating).
  - **Mitigation:** Plan explicitly states "TODO comment only" at PWA wrapper files in §Files and §Task 4. Reviewer checks in final-branch review.
- **Risk:** Implementer wires `useAnalysisScopeStore` inside `*WrapperBase` (violates D-LV1F-3 layer rule).
  - **Mitigation:** Plan §Constraints explicitly forbids `useAnalysisScopeStore` imports in `packages/ui/src/components/{ParetoChartWrapper,BoxplotWrapper}/`. Architecture grep in Task 4 step 3 verifies.

## Related

- Spec §5.4 — Drill-in from charts (Phase 1 minimum)
- Master plan PR-LV1-F row
- LV1-A sub-plan — `analysisScopeStore` foundation
- LV1-D sub-plan — `navigateToExploreForChip` precedent for `.getState().<action>(args)` pattern
- LV1-E sub-plan — Explore scope chrome (consumer of the categorical accumulation)
- `analysisScopeStore.ts:50-65` — `addCategoricalValue` implementation
- `ParetoChart.tsx:176` — chart-level `onBarClick` dispatch (already wired)
- `Boxplot.tsx:236-238` — chart-level `onBoxClick` dispatch + Group wrapper covering whiskers
