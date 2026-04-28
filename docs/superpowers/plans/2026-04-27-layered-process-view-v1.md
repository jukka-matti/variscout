# Layered Process View V1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wrap the existing river-styled SIPOC FRAME workspace in a three-band layered visual (Outcome / Process Flow / Operations), shipping in both PWA and Azure apps without changing the underlying ProcessMap data model.

**Architecture:** New shared component `<LayeredProcessView>` in `@variscout/ui` composes (a) an Outcome summary band on top, (b) the existing `<ProcessMapBase>` river-SIPOC inside a Process Flow band, and (c) an Operations band below that mirrors `map.tributaries` as factor chips labelled with their parent step. Both `FrameView` wrappers (PWA + Azure) swap their `ProcessMapBase` usage for `LayeredProcessView`. No data-model changes; props-based composition only.

**Tech Stack:** TypeScript, React (functional components), Tailwind v4 with semantic tokens, Vitest + React Testing Library. No new dependencies.

**Spec:** [`docs/superpowers/specs/2026-04-27-layered-process-view-design.md`](../specs/2026-04-27-layered-process-view-design.md). V1 corresponds to the spec's "V1 — Layer existing FRAME map into three visual bands" phase.

**Out of scope for V1 (deferred to later phases per the spec):**

- New data model (factor specs, designed step rates, snapshot-backed actuals) — V3 / V4
- Cross-band SVG connector lines (require pixel-position coordination with `ProcessMapBase`) — V2+
- Process Hub current-state rendering — V2
- Multi-hub aggregate rendering — V5
- `tributary` → `factor` code rename — separate PR before V3
- Capability-mode-specific emphasis on bands — V1 ships with default content for all modes

---

## File Structure

**Created:**

- `packages/ui/src/components/LayeredProcessView/LayeredProcessView.tsx` — the composed view
- `packages/ui/src/components/LayeredProcessView/index.ts` — barrel export
- `packages/ui/src/components/LayeredProcessView/__tests__/LayeredProcessView.test.tsx` — component tests

**Modified:**

- `packages/ui/src/index.ts` — add `LayeredProcessView` to public exports
- `apps/pwa/src/components/views/FrameView.tsx` — swap `ProcessMapBase` for `LayeredProcessView`
- `apps/azure/src/components/editor/FrameView.tsx` — same swap
- `docs/07-decisions/adr-070-frame-workspace.md` — amend to note layered extension
- `docs/01-vision/methodology.md` — add band labels to the methodology hierarchy table
- `docs/05-technical/architecture/mental-model-hierarchy.md` — note the layered visual structure for FRAME
- `docs/llms.txt` — add reference to the new spec

**Not modified (rely on existing patterns):**

- `packages/charts/src/ProcessMap/` — primitives unchanged
- `packages/ui/src/components/ProcessMap/ProcessMapBase.tsx` — used as-is by `LayeredProcessView`
- `packages/core/src/frame/` — types unchanged
- `packages/core/src/processState.ts` — `ProcessStateLens` reconciliation is render-time projection only; no enum changes

---

## Conventions

These apply across all tasks; the engineer should follow them without being reminded each time.

- **Functional components only.** Props interface named `LayeredProcessViewProps` (per `@variscout/ui` rule).
- **Semantic Tailwind classes** (`bg-surface-secondary`, `text-content`, `border-edge`) so the component adapts to `data-theme`. Never hard-code colors.
- **Test imports**: `vi.mock()` calls **must come before** the component import to prevent infinite test loops (per `writing-tests` skill / memory rule).
- **No `Math.random`** in code or tests. The existing `ProcessMapBase` already uses `Math.random` for IDs; do not propagate that pattern into the new component.
- **`data-testid` for tests**: top-level wrapper carries `data-testid="layered-process-view"`; bands carry `data-testid="band-outcome"`, `band-process-flow`, `band-operations`.
- **No new i18n keys for V1**: hard-coded English labels match the existing `FrameView` header pattern. i18n keys are a follow-up if and when methodology.md upgrades.
- **Commits**: small, focused. Each task ends with a commit. Commit messages follow the existing convention (`feat:`, `test:`, `docs:`, `refactor:`).

---

## Task 1: Scaffold `LayeredProcessView` skeleton

**Files:**

- Create: `packages/ui/src/components/LayeredProcessView/LayeredProcessView.tsx`
- Create: `packages/ui/src/components/LayeredProcessView/index.ts`
- Create: `packages/ui/src/components/LayeredProcessView/__tests__/LayeredProcessView.test.tsx`
- Modify: `packages/ui/src/index.ts` — add export

- [ ] **Step 1.1: Write the failing test for the three-band skeleton**

Create `packages/ui/src/components/LayeredProcessView/__tests__/LayeredProcessView.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { LayeredProcessView } from '../LayeredProcessView';
import type { ProcessMap } from '@variscout/core/frame';

const emptyMap: ProcessMap = {
  version: 1,
  nodes: [],
  tributaries: [],
  createdAt: '2026-04-27T00:00:00.000Z',
  updatedAt: '2026-04-27T00:00:00.000Z',
};

describe('LayeredProcessView', () => {
  it('renders three bands labelled Outcome, Process Flow, Operations', () => {
    render(<LayeredProcessView map={emptyMap} availableColumns={[]} onChange={() => {}} />);

    expect(screen.getByTestId('layered-process-view')).toBeInTheDocument();
    expect(screen.getByTestId('band-outcome')).toBeInTheDocument();
    expect(screen.getByTestId('band-process-flow')).toBeInTheDocument();
    expect(screen.getByTestId('band-operations')).toBeInTheDocument();

    expect(screen.getByText('Outcome')).toBeInTheDocument();
    expect(screen.getByText('Process Flow')).toBeInTheDocument();
    expect(screen.getByText('Operations')).toBeInTheDocument();
  });
});
```

- [ ] **Step 1.2: Run test to verify it fails**

Run: `pnpm --filter @variscout/ui test LayeredProcessView -- --run`
Expected: FAIL — `Cannot find module '../LayeredProcessView'` (component doesn't exist yet).

- [ ] **Step 1.3: Implement minimal three-band skeleton**

Create `packages/ui/src/components/LayeredProcessView/LayeredProcessView.tsx`:

```tsx
/**
 * LayeredProcessView — three-band process visual (outcome / flow / operations).
 *
 * Stacks Outcome / Process Flow / Operations bands vertically. The Process
 * Flow band wraps the existing `ProcessMapBase` river-SIPOC; the Outcome and
 * Operations bands surround it. See spec at
 * `docs/superpowers/specs/2026-04-27-layered-process-view-design.md` (V1).
 */

import React from 'react';
import type { ProcessMap, Gap } from '@variscout/core/frame';

export interface LayeredProcessViewProps {
  map: ProcessMap;
  availableColumns: string[];
  onChange: (next: ProcessMap) => void;
  gaps?: Gap[];
  disabled?: boolean;
  target?: number;
  usl?: number;
  lsl?: number;
  onSpecsChange?: (next: { target?: number; usl?: number; lsl?: number }) => void;
}

export const LayeredProcessView: React.FC<LayeredProcessViewProps> = () => {
  return (
    <div data-testid="layered-process-view" className="flex flex-col">
      <section
        data-testid="band-outcome"
        className="border-b border-edge px-4 py-3 bg-surface-secondary"
      >
        <h3 className="text-sm font-semibold text-content">Outcome</h3>
      </section>
      <section data-testid="band-process-flow" className="border-b border-edge px-4 py-3">
        <h3 className="text-sm font-semibold text-content">Process Flow</h3>
      </section>
      <section data-testid="band-operations" className="px-4 py-3 bg-surface-secondary">
        <h3 className="text-sm font-semibold text-content">Operations</h3>
      </section>
    </div>
  );
};
```

- [ ] **Step 1.4: Create barrel export**

Create `packages/ui/src/components/LayeredProcessView/index.ts`:

```ts
export { LayeredProcessView } from './LayeredProcessView';
export type { LayeredProcessViewProps } from './LayeredProcessView';
```

- [ ] **Step 1.5: Add to package public exports**

Open `packages/ui/src/index.ts` and add (matching existing export style — likely near other component exports):

```ts
export { LayeredProcessView } from './components/LayeredProcessView';
export type { LayeredProcessViewProps } from './components/LayeredProcessView';
```

- [ ] **Step 1.6: Run test to verify it passes**

Run: `pnpm --filter @variscout/ui test LayeredProcessView -- --run`
Expected: PASS — all three bands rendered with correct testids and labels.

- [ ] **Step 1.7: Commit**

```bash
git add packages/ui/src/components/LayeredProcessView/ packages/ui/src/index.ts
git commit -m "feat(ui): scaffold LayeredProcessView three-band skeleton"
```

---

## Task 2: Wire Outcome band to specs

The Outcome band shows the strategic / business outcome we want. For V1, populate it with `target` (Cpk target value), USL, and LSL when provided. Show a placeholder when no specs are set.

**Files:**

- Modify: `packages/ui/src/components/LayeredProcessView/LayeredProcessView.tsx`
- Modify: `packages/ui/src/components/LayeredProcessView/__tests__/LayeredProcessView.test.tsx`

- [ ] **Step 2.1: Add failing tests for Outcome band content**

Add to the existing test file:

```tsx
it('shows target Cpk in Outcome band when target is set', () => {
  render(
    <LayeredProcessView map={emptyMap} availableColumns={[]} onChange={() => {}} target={1.33} />
  );

  const outcomeBand = screen.getByTestId('band-outcome');
  expect(outcomeBand).toHaveTextContent('Target: 1.33');
});

it('shows USL and LSL in Outcome band when set', () => {
  render(
    <LayeredProcessView
      map={emptyMap}
      availableColumns={[]}
      onChange={() => {}}
      usl={12.5}
      lsl={8.5}
    />
  );

  const outcomeBand = screen.getByTestId('band-outcome');
  expect(outcomeBand).toHaveTextContent('USL: 12.5');
  expect(outcomeBand).toHaveTextContent('LSL: 8.5');
});

it('shows placeholder when no outcome data', () => {
  render(<LayeredProcessView map={emptyMap} availableColumns={[]} onChange={() => {}} />);

  const outcomeBand = screen.getByTestId('band-outcome');
  expect(outcomeBand).toHaveTextContent('No outcome target set');
});
```

- [ ] **Step 2.2: Run tests to verify they fail**

Run: `pnpm --filter @variscout/ui test LayeredProcessView -- --run`
Expected: 3 new tests fail (placeholder + target + USL/LSL); existing skeleton test still passes.

- [ ] **Step 2.3: Implement Outcome band content**

Update the Outcome `<section>` in `LayeredProcessView.tsx`:

```tsx
const hasOutcomeData = target !== undefined || usl !== undefined || lsl !== undefined;

// inside the return:
<section data-testid="band-outcome" className="border-b border-edge px-4 py-3 bg-surface-secondary">
  <h3 className="text-sm font-semibold text-content">Outcome</h3>
  {hasOutcomeData ? (
    <dl className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-sm text-content-secondary">
      {target !== undefined && (
        <div className="flex gap-1">
          <dt className="font-medium">Target:</dt>
          <dd>{target}</dd>
        </div>
      )}
      {usl !== undefined && (
        <div className="flex gap-1">
          <dt className="font-medium">USL:</dt>
          <dd>{usl}</dd>
        </div>
      )}
      {lsl !== undefined && (
        <div className="flex gap-1">
          <dt className="font-medium">LSL:</dt>
          <dd>{lsl}</dd>
        </div>
      )}
    </dl>
  ) : (
    <p className="mt-2 text-sm text-content-secondary italic">No outcome target set</p>
  )}
</section>;
```

Update the destructured props in the component signature to actually consume them:

```tsx
export const LayeredProcessView: React.FC<LayeredProcessViewProps> = ({
  target,
  usl,
  lsl,
}) => {
```

(Other props get destructured in subsequent tasks.)

- [ ] **Step 2.4: Run tests to verify they pass**

Run: `pnpm --filter @variscout/ui test LayeredProcessView -- --run`
Expected: All 4 tests pass.

- [ ] **Step 2.5: Commit**

```bash
git add packages/ui/src/components/LayeredProcessView/
git commit -m "feat(ui): wire Outcome band to specs (target/USL/LSL)"
```

---

## Task 3: Embed `ProcessMapBase` in Process Flow band

Process Flow band wraps the existing `ProcessMapBase` component. All current FRAME interactions (step add, tributary add, hunches, gap rendering, specs popover) keep working unchanged.

**Files:**

- Modify: `packages/ui/src/components/LayeredProcessView/LayeredProcessView.tsx`
- Modify: `packages/ui/src/components/LayeredProcessView/__tests__/LayeredProcessView.test.tsx`

- [ ] **Step 3.1: Add failing test for Process Flow band containing ProcessMapBase**

Add to the test file:

```tsx
it('renders ProcessMapBase inside Process Flow band', () => {
  const mapWithStep: ProcessMap = {
    ...emptyMap,
    nodes: [{ id: 'step-1', name: 'Mix' }],
  };

  render(
    <LayeredProcessView
      map={mapWithStep}
      availableColumns={['Temperature', 'Speed']}
      onChange={() => {}}
    />
  );

  const processFlowBand = screen.getByTestId('band-process-flow');
  // ProcessMapBase renders the step name
  expect(processFlowBand).toHaveTextContent('Mix');
});
```

- [ ] **Step 3.2: Run test to verify it fails**

Run: `pnpm --filter @variscout/ui test LayeredProcessView -- --run`
Expected: New test fails — "Mix" text not found in the Process Flow band (ProcessMapBase isn't there yet).

- [ ] **Step 3.3: Embed ProcessMapBase in the Process Flow band**

Update the imports and component body in `LayeredProcessView.tsx`:

```tsx
import React from 'react';
import type { ProcessMap, Gap } from '@variscout/core/frame';
import { ProcessMapBase } from '../ProcessMap/ProcessMapBase';

// ... (props interface unchanged)

export const LayeredProcessView: React.FC<LayeredProcessViewProps> = ({
  map,
  availableColumns,
  onChange,
  gaps,
  disabled,
  target,
  usl,
  lsl,
  onSpecsChange,
}) => {
  const hasOutcomeData = target !== undefined || usl !== undefined || lsl !== undefined;

  return (
    <div data-testid="layered-process-view" className="flex flex-col">
      {/* Outcome band — unchanged from Task 2 */}
      <section
        data-testid="band-outcome"
        className="border-b border-edge px-4 py-3 bg-surface-secondary"
      >
        {/* ... existing Outcome band markup ... */}
      </section>

      {/* Process Flow band — wraps ProcessMapBase */}
      <section data-testid="band-process-flow" className="border-b border-edge px-4 py-3">
        <h3 className="text-sm font-semibold text-content">Process Flow</h3>
        <div className="mt-2">
          <ProcessMapBase
            map={map}
            availableColumns={availableColumns}
            onChange={onChange}
            gaps={gaps}
            disabled={disabled}
            target={target}
            usl={usl}
            lsl={lsl}
            onSpecsChange={onSpecsChange}
          />
        </div>
      </section>

      {/* Operations band — placeholder for now, populated in Task 4 */}
      <section data-testid="band-operations" className="px-4 py-3 bg-surface-secondary">
        <h3 className="text-sm font-semibold text-content">Operations</h3>
      </section>
    </div>
  );
};
```

- [ ] **Step 3.4: Run tests to verify they pass**

Run: `pnpm --filter @variscout/ui test LayeredProcessView -- --run`
Expected: All tests pass (including existing ones — ProcessMapBase still works as-is).

- [ ] **Step 3.5: Commit**

```bash
git add packages/ui/src/components/LayeredProcessView/
git commit -m "feat(ui): embed ProcessMapBase in Process Flow band"
```

---

## Task 4: Render factor chips in Operations band

Operations band shows `map.tributaries` as a row of factor chips. Each chip displays the column name and the parent step's name. Read-only mirror — V1 does not let users edit factors from the Operations band (those edits still happen via the river inside the Process Flow band).

**Files:**

- Modify: `packages/ui/src/components/LayeredProcessView/LayeredProcessView.tsx`
- Modify: `packages/ui/src/components/LayeredProcessView/__tests__/LayeredProcessView.test.tsx`

- [ ] **Step 4.1: Add failing tests for factor chips**

Add to the test file:

```tsx
it('renders one factor chip per tributary in Operations band', () => {
  const mapWithFactors: ProcessMap = {
    ...emptyMap,
    nodes: [
      { id: 'step-1', name: 'Mix' },
      { id: 'step-2', name: 'Coat' },
    ],
    tributaries: [
      { id: 't-1', toNodeId: 'step-1', column: 'Temperature' },
      { id: 't-2', toNodeId: 'step-2', column: 'Speed' },
    ],
  };

  render(
    <LayeredProcessView
      map={mapWithFactors}
      availableColumns={['Temperature', 'Speed']}
      onChange={() => {}}
    />
  );

  const operationsBand = screen.getByTestId('band-operations');
  const chips = operationsBand.querySelectorAll('[data-testid^="factor-chip-"]');
  expect(chips).toHaveLength(2);
  expect(operationsBand).toHaveTextContent('Temperature');
  expect(operationsBand).toHaveTextContent('Speed');
});

it('labels each factor chip with its parent step name', () => {
  const mapWithFactors: ProcessMap = {
    ...emptyMap,
    nodes: [{ id: 'step-1', name: 'Mix' }],
    tributaries: [{ id: 't-1', toNodeId: 'step-1', column: 'Temperature' }],
  };

  render(<LayeredProcessView map={mapWithFactors} availableColumns={[]} onChange={() => {}} />);

  const chip = screen.getByTestId('factor-chip-t-1');
  expect(chip).toHaveTextContent('Temperature');
  expect(chip).toHaveTextContent('at Mix');
});

it('shows placeholder when no factors are mapped', () => {
  render(<LayeredProcessView map={emptyMap} availableColumns={[]} onChange={() => {}} />);

  const operationsBand = screen.getByTestId('band-operations');
  expect(operationsBand).toHaveTextContent('No factors mapped yet');
});
```

- [ ] **Step 4.2: Run tests to verify they fail**

Run: `pnpm --filter @variscout/ui test LayeredProcessView -- --run`
Expected: 3 new tests fail; previous tests still pass.

- [ ] **Step 4.3: Implement Operations band factor chips**

Update the Operations band in `LayeredProcessView.tsx`:

```tsx
{
  /* Operations band — factor chips per tributary */
}
<section data-testid="band-operations" className="px-4 py-3 bg-surface-secondary">
  <h3 className="text-sm font-semibold text-content">Operations</h3>
  {map.tributaries.length > 0 ? (
    <ul className="mt-2 flex flex-wrap gap-2">
      {map.tributaries.map(trib => {
        const parentStep = map.nodes.find(n => n.id === trib.toNodeId);
        const stepLabel = parentStep?.name ?? 'Unmapped';
        return (
          <li
            key={trib.id}
            data-testid={`factor-chip-${trib.id}`}
            className="rounded-md border border-edge bg-surface px-2 py-1 text-xs"
          >
            <span className="font-medium text-content">{trib.column}</span>
            <span className="ml-1 text-content-secondary">at {stepLabel}</span>
          </li>
        );
      })}
    </ul>
  ) : (
    <p className="mt-2 text-sm text-content-secondary italic">No factors mapped yet</p>
  )}
</section>;
```

- [ ] **Step 4.4: Run tests to verify they pass**

Run: `pnpm --filter @variscout/ui test LayeredProcessView -- --run`
Expected: All tests pass.

- [ ] **Step 4.5: Commit**

```bash
git add packages/ui/src/components/LayeredProcessView/
git commit -m "feat(ui): render factor chips in Operations band"
```

---

## Task 5: Empty-state polish — placeholder when Process Flow is empty

When the map has no steps, the Process Flow band's `ProcessMapBase` already renders its own empty state. Ensure the LayeredProcessView itself doesn't break visually with a fully empty map. This is a small polish task with one test.

**Files:**

- Modify: `packages/ui/src/components/LayeredProcessView/__tests__/LayeredProcessView.test.tsx`

- [ ] **Step 5.1: Add test for fully empty state**

Add to the test file:

```tsx
it('renders all three band frames even when the map is fully empty', () => {
  render(<LayeredProcessView map={emptyMap} availableColumns={[]} onChange={() => {}} />);

  // All three bands render with their headers regardless of content
  expect(screen.getByText('Outcome')).toBeInTheDocument();
  expect(screen.getByText('Process Flow')).toBeInTheDocument();
  expect(screen.getByText('Operations')).toBeInTheDocument();

  // Outcome and Operations show their placeholders
  expect(screen.getByTestId('band-outcome')).toHaveTextContent('No outcome target set');
  expect(screen.getByTestId('band-operations')).toHaveTextContent('No factors mapped yet');
});
```

- [ ] **Step 5.2: Run test to verify it passes**

Run: `pnpm --filter @variscout/ui test LayeredProcessView -- --run`
Expected: PASS — the previous tasks already implemented the empty-state placeholders. This task is a regression check.

- [ ] **Step 5.3: Commit**

```bash
git add packages/ui/src/components/LayeredProcessView/
git commit -m "test(ui): regression test for fully empty LayeredProcessView"
```

---

## Task 6: Replace `ProcessMapBase` with `LayeredProcessView` in PWA `FrameView`

**Files:**

- Modify: `apps/pwa/src/components/views/FrameView.tsx`
- Create or Modify: `apps/pwa/src/components/views/__tests__/FrameView.test.tsx` (create if doesn't exist)

- [ ] **Step 6.1: Check if a FrameView test exists**

Run: `ls apps/pwa/src/components/views/__tests__/FrameView.test.tsx 2>/dev/null && echo EXISTS || echo MISSING`

If `EXISTS`, skip to step 6.2 (modify the existing test). If `MISSING`, create the file in step 6.2.

- [ ] **Step 6.2: Write or update the failing test**

Either create or modify `apps/pwa/src/components/views/__tests__/FrameView.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// vi.mock MUST come before component imports (per writing-tests skill)
vi.mock('@variscout/stores', () => {
  const setProcessContext = vi.fn();
  const setSpecs = vi.fn();
  return {
    useProjectStore: vi.fn((selector: any) =>
      selector({
        rawData: [],
        outcome: null,
        specs: null,
        setSpecs,
        processContext: null,
        setProcessContext,
      })
    ),
  };
});

import FrameView from '../FrameView';

describe('FrameView (PWA)', () => {
  it('renders LayeredProcessView with three bands', () => {
    render(<FrameView />);

    expect(screen.getByTestId('layered-process-view')).toBeInTheDocument();
    expect(screen.getByTestId('band-outcome')).toBeInTheDocument();
    expect(screen.getByTestId('band-process-flow')).toBeInTheDocument();
    expect(screen.getByTestId('band-operations')).toBeInTheDocument();
  });
});
```

- [ ] **Step 6.3: Run test to verify it fails**

Run: `pnpm --filter @variscout/pwa test FrameView -- --run`
Expected: FAIL — `band-outcome` testid not found (current FrameView uses ProcessMapBase, not LayeredProcessView).

- [ ] **Step 6.4: Swap `ProcessMapBase` for `LayeredProcessView`**

Modify `apps/pwa/src/components/views/FrameView.tsx`:

Change the import line from:

```tsx
import { ProcessMapBase } from '@variscout/ui';
```

to:

```tsx
import { LayeredProcessView } from '@variscout/ui';
```

In the JSX return, replace the `<ProcessMapBase ... />` usage with `<LayeredProcessView ... />` — the props are identical (same prop names).

The full updated component body:

```tsx
return (
  <div className="flex-1 overflow-auto" data-testid="frame-view">
    <div className="mx-auto max-w-6xl">
      <header className="px-4 pt-4">
        <h2 className="text-lg font-semibold text-content">Frame the investigation</h2>
        <p className="text-sm text-content-secondary">
          Build your process map so the analysis has context. The map drives mode selection and a
          measurement-gap report; the methodology wants CTS at the ocean, a CTQ per step, and at
          least one rational-subgroup axis.
        </p>
      </header>
      <LayeredProcessView
        map={map}
        availableColumns={availableColumns}
        onChange={handleChange}
        gaps={gaps}
        target={specs?.target}
        lsl={specs?.lsl}
        usl={specs?.usl}
        onSpecsChange={handleSpecsChange}
      />
    </div>
  </div>
);
```

(If the existing FrameView has any closing JSX after `onSpecsChange` that I haven't shown — preserve it.)

- [ ] **Step 6.5: Run tests to verify they pass**

Run: `pnpm --filter @variscout/pwa test FrameView -- --run`
Expected: PASS.

- [ ] **Step 6.6: Run the broader PWA test suite to ensure no regressions**

Run: `pnpm --filter @variscout/pwa test -- --run`
Expected: All tests pass (the swap is non-breaking; LayeredProcessView passes ProcessMapBase props through unchanged).

- [ ] **Step 6.7: Commit**

```bash
git add apps/pwa/src/components/views/FrameView.tsx apps/pwa/src/components/views/__tests__/FrameView.test.tsx
git commit -m "feat(pwa): use LayeredProcessView in FrameView"
```

---

## Task 7: Replace `ProcessMapBase` with `LayeredProcessView` in Azure `FrameView`

Same swap as Task 6, in the Azure app.

**Files:**

- Modify: `apps/azure/src/components/editor/FrameView.tsx`
- Create or Modify: `apps/azure/src/components/editor/__tests__/FrameView.test.tsx` (create if doesn't exist)

- [ ] **Step 7.1: Check if an Azure FrameView test exists**

Run: `ls apps/azure/src/components/editor/__tests__/FrameView.test.tsx 2>/dev/null && echo EXISTS || echo MISSING`

- [ ] **Step 7.2: Write or update the failing test**

Either create or modify `apps/azure/src/components/editor/__tests__/FrameView.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

vi.mock('@variscout/stores', () => {
  const setProcessContext = vi.fn();
  const setSpecs = vi.fn();
  return {
    useProjectStore: vi.fn((selector: any) =>
      selector({
        rawData: [],
        outcome: null,
        specs: null,
        setSpecs,
        processContext: null,
        setProcessContext,
      })
    ),
  };
});

import FrameView from '../FrameView';

describe('FrameView (Azure)', () => {
  it('renders LayeredProcessView with three bands', () => {
    render(<FrameView />);

    expect(screen.getByTestId('layered-process-view')).toBeInTheDocument();
    expect(screen.getByTestId('band-outcome')).toBeInTheDocument();
    expect(screen.getByTestId('band-process-flow')).toBeInTheDocument();
    expect(screen.getByTestId('band-operations')).toBeInTheDocument();
  });
});
```

- [ ] **Step 7.3: Run test to verify it fails**

Run: `pnpm --filter @variscout/azure-app test FrameView -- --run`
Expected: FAIL — `band-outcome` testid not found.

- [ ] **Step 7.4: Swap `ProcessMapBase` for `LayeredProcessView` in Azure FrameView**

Modify `apps/azure/src/components/editor/FrameView.tsx` exactly as in Task 6.4 — the file is structurally near-identical to the PWA version.

- [ ] **Step 7.5: Run tests to verify they pass**

Run: `pnpm --filter @variscout/azure-app test FrameView -- --run`
Expected: PASS.

- [ ] **Step 7.6: Run the broader Azure test suite**

Run: `pnpm --filter @variscout/azure-app test -- --run`
Expected: All tests pass.

- [ ] **Step 7.7: Commit**

```bash
git add apps/azure/src/components/editor/FrameView.tsx apps/azure/src/components/editor/__tests__/FrameView.test.tsx
git commit -m "feat(azure): use LayeredProcessView in FrameView"
```

---

## Task 8: Verify cross-package build + test green across the monorepo

**Files:** none modified — verification only.

- [ ] **Step 8.1: Run the @variscout/ui type check + build**

Run: `pnpm --filter @variscout/ui build`
Expected: Build completes with no type errors. (Per memory rule: ui's tsc catches cross-package type-export gaps that per-package vitest misses.)

- [ ] **Step 8.2: Run the full monorepo test suite**

Run: `pnpm test`
Expected: All packages pass. (Note from memory: `packages/hooks` may show flaky timeout under concurrent load — re-run that package alone if it fails: `pnpm --filter @variscout/hooks test`.)

- [ ] **Step 8.3: Run the full build**

Run: `pnpm build`
Expected: All packages and apps build cleanly. Tailwind v4 `@source` directives in both apps' `index.css` should already cover `packages/ui/src/**/*.tsx` (per app CLAUDE.md memory rule), so the new component's classes will be picked up without changes.

- [ ] **Step 8.4: No commit (verification task)**

If issues surface, fix them in their respective tasks and re-run.

---

## Task 9: Visual verification with `claude --chrome`

The PR-ready check expects this for UI changes per memory rule "Verify before push".

**Files:** none modified — manual verification.

- [ ] **Step 9.1: Start the PWA dev server**

Run: `pnpm dev`
Expected: PWA available at `http://localhost:5173`.

- [ ] **Step 9.2: Walk the FRAME workspace with `claude --chrome`**

Open the running app in chrome (via `claude --chrome` or browser). Navigate to FRAME workspace. Verify:

- Three bands render with labels Outcome / Process Flow / Operations
- Outcome band shows "No outcome target set" placeholder when no specs are entered
- Setting USL/LSL/target via the existing SpecsPopover updates the Outcome band immediately
- Process Flow band shows the existing river-SIPOC, fully interactive (add step, add tributary, set ocean, etc.)
- Operations band shows factor chips matching tributaries (e.g., "Temperature at Mix")
- Operations band shows "No factors mapped yet" when no tributaries exist
- Theme toggle (light/dark) works; semantic Tailwind classes adapt correctly
- Resize the browser to tablet width — bands still render legibly (full mobile responsive behavior is V2+)

- [ ] **Step 9.3: Walk the Azure FrameView with `claude --chrome`**

If running the Azure app locally, do the same walk in `apps/azure`. Run: `pnpm --filter @variscout/azure-app dev`.

- [ ] **Step 9.4: Document any visual issues**

If anything reads poorly, file a follow-up task — _do not_ try to redesign in V1. V1 is structural; visual polish is allowed but not in scope for layout changes.

---

## Task 10: Documentation updates

Update related docs to reflect the layered visual structure. Per the user note: this should be holistic — touch every doc that's affected.

**Files:**

- Modify: `docs/07-decisions/adr-070-frame-workspace.md`
- Modify: `docs/01-vision/methodology.md`
- Modify: `docs/05-technical/architecture/mental-model-hierarchy.md`
- Modify: `docs/llms.txt`
- (Already done in earlier session) `docs/superpowers/specs/index.md`

- [ ] **Step 10.1: Amend ADR-070 to note the layered extension**

Open `docs/07-decisions/adr-070-frame-workspace.md`. Add a new "Update — 2026-04-27 (Layered Process View V1)" section after the existing Consequences section:

```markdown
## Update — 2026-04-27 (Layered Process View V1)

The river-styled SIPOC `ProcessMapBase` is now wrapped by `LayeredProcessView` (`@variscout/ui`), which adds an Outcome band above and an Operations band below. ADR-070 stays canonical for the river/SIPOC design itself; the layered extension adds visual structure around it without changing the data model.

See the Layered Process View design spec at `docs/superpowers/specs/2026-04-27-layered-process-view-design.md` for band semantics, surface variations, and phasing. (When pasting this snippet into ADR-070, write a real markdown link from `docs/07-decisions/` to that path.)

V1 (this update) is structural only: the bands wrap the existing component. V2+ phases add Operations band content (snapshot-backed actuals, capability sparklines), Process Hub current-state rendering, and multi-hub aggregation.
```

- [ ] **Step 10.2: Update methodology.md to reference the band names**

Open `docs/01-vision/methodology.md`. In the "Process Learning Levels" section (currently introduces System / Flow / Local mechanism levels), add a small note that the FRAME workspace now exposes these levels as visible bands labelled Outcome / Process Flow / Operations:

```markdown
The FRAME workspace renders these levels as three visible bands — **Outcome**,
**Process Flow**, and **Operations** — stacked vertically with the river-styled
SIPOC inside the Process Flow band. The visual structure makes the methodology
visible by default. See the Layered Process View design spec at `docs/superpowers/specs/2026-04-27-layered-process-view-design.md`. (When pasting this snippet into methodology.md, write a real markdown link from `docs/01-vision/` to that path.)
```

(Add this as a paragraph after the Process Learning Levels table; do not restructure the section.)

- [ ] **Step 10.3: Update mental-model-hierarchy.md**

Open `docs/05-technical/architecture/mental-model-hierarchy.md`. In the "What's In Code" or "Per-Phase Detail → FRAME" section, add a row or paragraph noting the layered visual structure:

```markdown
**Layered band structure:** FRAME renders as three coplanar bands — Outcome / Process Flow / Operations — wrapping the existing river-styled SIPOC inside the Process Flow band. The bands are a render-time projection; no data-model change. See `LayeredProcessView` in `@variscout/ui` and the design spec at `docs/superpowers/specs/2026-04-27-layered-process-view-design.md`. (When pasting this snippet into mental-model-hierarchy.md, write a real markdown link from `docs/05-technical/architecture/` to that path.)
```

- [ ] **Step 10.4: Add the design spec reference to docs/llms.txt**

Open `docs/llms.txt`. In the "Core orientation" or design-spec section, add an entry:

```text
- docs/superpowers/specs/2026-04-27-layered-process-view-design.md — three-band visual language (Outcome / Process Flow / Operations) for FRAME, Process Hub, and multi-hub
```

- [ ] **Step 10.5: Verify docs build cleanly**

Run: `bash scripts/check-diagram-health.sh` (per memory: docs:check before merge).
Run: `pnpm docs:check` (or whatever the project's docs-check command is — see `package.json`).

If frontmatter validator complains, fix before committing.

- [ ] **Step 10.6: Commit documentation updates**

```bash
git add docs/07-decisions/adr-070-frame-workspace.md docs/01-vision/methodology.md docs/05-technical/architecture/mental-model-hierarchy.md docs/llms.txt
git commit -m "docs: reflect Layered Process View V1 in ADR-070, methodology, mental-model"
```

---

## Task 11: PR readiness check + final validation

**Files:** none modified — verification.

- [ ] **Step 11.1: Run the project's PR-ready check**

Run: `bash scripts/pr-ready-check.sh`
Expected: All checks pass (tests + lint + docs:check).

- [ ] **Step 11.2: Confirm git log is clean**

Run: `git log --oneline main..HEAD`
Expected: One commit per logical task, all with clear messages. If multiple WIP commits exist for one task, that's fine — just confirm the message hygiene is reasonable.

- [ ] **Step 11.3: Decide on merge path**

Two paths per the user's tooling/docs commit rule:

1. **Direct to main** (allowed for docs/tooling per CLAUDE.md): if the bulk of changes are docs + new component without modifying product behavior critically, this works. The new component is additive; the FrameView swap changes behavior visually but the underlying ProcessMapBase is unchanged.
2. **PR + review** (safer, recommended): the FrameView swap touches both apps and changes user-facing chrome, so a PR with subagent code review feels right. Per the project workflow rule for product code: branch → PR → `bash scripts/pr-ready-check.sh` green → subagent code review → squash-merge.

Recommended: PR path, since this touches `apps/*/src/`. Do not use `gh pr merge --admin`.

---

## Self-Review Checklist (the engineer should run this after Task 11)

1. **Spec coverage:** every V1 deliverable in the spec maps to a task above:
   - V1: "Wrap the existing ProcessMapBase river-SIPOC in a Process Flow band" — Task 3
   - V1: "Add an Outcome band above (initially showing Cpk target if set)" — Task 2
   - V1: "Add an Operations band below (initially showing existing tributaries as factor chips)" — Task 4
   - V1: "Renames 'tributary' → 'factor' in UI strings only; code stays `tributary`" — Tasks 4, 6, 7 (UI strings use "factor", code keeps `tributary`)
   - V1: Band labels Outcome / Process Flow / Operations — Task 1
   - Cross-band connector lines: explicitly deferred to V2+ (correctly not in this plan)
2. **Placeholder scan:** no "TBD", "implement appropriate", or vague language. Every step has a concrete code block or command.
3. **Type consistency:** `LayeredProcessViewProps` defined in Task 1 is used in Tasks 2-4. The prop names match `ProcessMapBaseProps`. ✓
4. **Test patterns:** all tests use `vi.mock` BEFORE component imports (per memory rule). ✓
5. **Tailwind tokens:** all class strings use semantic tokens (`bg-surface-secondary`, `text-content`, `border-edge`). No hard-coded colors. ✓
6. **Memory rules covered:** terminology consistency (UI says "factor", code says "tributary" — consciously deferred to follow-up PR per spec), no `Math.random` in new code, vi.mock ordering, no destructive git operations.

---

## Open follow-ups (NOT in V1 — recorded for future plans)

- V2: Read-only Process Hub current-state overlay using `<LayeredProcessView mode="snapshot">`
- V2: Cross-band SVG connector lines (requires position coordination with ProcessMapBase — non-trivial)
- V2: Side-sheet preview for cross-investigation evidence flow
- V3: `tributary` → `factor` code rename (separate cleanup PR)
- V3: Per-factor spec data model (`tributary.targetRange?` and `node.designedRate?`)
- V4: Snapshot-backed actuals + Cp/Cpk-over-batches mini-i-charts
- V5: Multi-hub aggregate rendering
- Future: CoScout coaching prompt updates for level-aware guidance (touches ADR-068)
- Future: Way 3 / band × lens grid exploration (requires its own design session)

---

## References

- Spec: [`docs/superpowers/specs/2026-04-27-layered-process-view-design.md`](../specs/2026-04-27-layered-process-view-design.md)
- Predecessor: [`docs/07-decisions/adr-070-frame-workspace.md`](../../07-decisions/adr-070-frame-workspace.md)
- Predecessor design: [`docs/superpowers/specs/2026-04-18-frame-process-map-design.md`](../specs/2026-04-18-frame-process-map-design.md)
- Brainstorm critique input: `~/.claude/plans/i-would-need-to-drifting-hummingbird.md`
- @variscout/ui CLAUDE.md (functional components, Tailwind tokens, \*Base naming)
- @variscout/core CLAUDE.md (no Math.random, no React imports)
- writing-tests skill (vi.mock ordering)
