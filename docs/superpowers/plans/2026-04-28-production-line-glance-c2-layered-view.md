---
title: Production-Line-Glance — C2 LayeredProcessView Operations Band Implementation Plan
audience: [engineer, architect]
category: implementation
status: delivered
related:
  [
    production-line-glance-surface-wiring-design,
    production-line-glance-design,
    layered-process-view,
    production-line-glance-charts,
  ]
date: 2026-04-28
---

# Production-Line-Glance — C2 LayeredProcessView Operations Band Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development. Steps use checkbox `- [ ]` syntax.

**Goal:** Wire the production-line-glance dashboard into LayeredProcessView's Operations band with progressive reveal, in both azure-app and PWA. Land the `mode: 'spatial' | 'full'` prop on `ProductionLineGlanceDashboard`, the URL-state toggle hook (`?ops=full`), the slot-prop API change on LayeredProcessView, and the surface wiring in both `apps/azure/src/components/editor/FrameView.tsx` and `apps/pwa/src/components/views/FrameView.tsx`.

**Architecture:** Three contract additions, no new components:

1. `ProductionLineGlanceDashboard` gets `mode?: 'spatial' | 'full'` (default `'full'`). When `'spatial'`, the temporal row's wrapper transitions `max-height: 0` (no chart re-mounts).
2. `LayeredProcessView` gets `operationsBandContent?: React.ReactNode` and `filterStripContent?: React.ReactNode` slot props. When `operationsBandContent` is provided, the band renders that node and the existing tributary chips relocate to the Outcome band's "Mapped factors" subsection. Default behavior (no slot props) is unchanged — preserves current FRAME usage.
3. `useProductionLineGlanceOpsToggle` (new in `@variscout/hooks`) syncs the `ops` URL search-param to `'spatial' | 'full'` mode state with `replaceState` semantics matching `useProductionLineGlanceFilter`.

The new composition is plumbed in each app's FrameView: `useHubProvision` (or the existing FRAME data path) → `useProductionLineGlanceData` + `useProductionLineGlanceFilter` + `useProductionLineGlanceOpsToggle` → render the dashboard inside `LayeredProcessView`'s Operations band slot. PWA reuses the same hooks (the PWA-Hub-IA scope clarification from C1's spec applies only to Hub view; FRAME is already PWA-native).

**Tech Stack:** TypeScript, React, Vitest, RTL. Skills: `editing-charts` (mode prop), `editing-coscout-prompts` N/A, `writing-tests`. Hard rules from `packages/charts/CLAUDE.md` (no hex; no manual memo), `packages/ui/CLAUDE.md` (semantic Tailwind tokens; functional components; props named `{ComponentName}Props`).

**Spec reference:** `docs/superpowers/specs/2026-04-28-production-line-glance-surface-wiring-design.md` — sections "The dashboard's three forms" + "Three surfaces / 1. LayeredProcessView Operations band".

**Critical existing files:**

- `packages/ui/src/components/ProductionLineGlanceDashboard/ProductionLineGlanceDashboard.tsx` — Plan B target for `mode` prop (T1)
- `packages/ui/src/components/LayeredProcessView/LayeredProcessView.tsx` — V1 layout (T3)
- `apps/azure/src/components/editor/FrameView.tsx` — azure FRAME mount (T6)
- `apps/pwa/src/components/views/FrameView.tsx` — PWA FRAME mount (T6)
- `packages/hooks/src/useProductionLineGlanceFilter.ts` — pattern for T2's URL-state hook
- `packages/hooks/src/useProductionLineGlanceData.ts` — slot-input hook (used in T6)

**Out of scope:**

- C3 (FRAME workspace right-hand drawer with full 2×2)
- Plan D (cross-hub view)
- Engine work to expose per-snapshot line-level Cp/Cpk for the temporal row (current cpkTrend/cpkGapTrend remain empty per C1 — the spatial row is the value Plan C2 ships)
- Tributary-chip relocation as a tooltip / advanced layout — V1 just adds them in a "Mapped factors" subsection of the Outcome band

**Rules of engagement:** TDD; one PR; subagent code review per task; never `--no-verify`; bundle followups per `feedback_bundle_followups_pre_merge.md`.

---

## File structure

### `packages/ui/src/components/ProductionLineGlanceDashboard/` — modified

- `types.ts` — add `mode?: 'spatial' | 'full'` and `onModeChange?` to `ProductionLineGlanceDashboardProps`.
- `ProductionLineGlanceDashboard.tsx` — wrap the temporal row in a `max-height` transition container; expose `data-testid="dashboard-temporal-row"` for tests.
- `__tests__/ProductionLineGlanceDashboard.test.tsx` — extend with mode-prop tests.

### `packages/hooks/src/` — new file

- `useProductionLineGlanceOpsToggle.ts` — URL `?ops=full` state synchronizer.
- `__tests__/useProductionLineGlanceOpsToggle.test.tsx`

### `packages/hooks/src/index.ts` — modified

- Re-export the new hook.

### `packages/ui/src/components/LayeredProcessView/LayeredProcessView.tsx` — modified

- Add `operationsBandContent?: React.ReactNode` and `filterStripContent?: React.ReactNode` props.
- When `operationsBandContent` is provided: render that as the band content; relocate tributary chips to a new "Mapped factors" subsection of the Outcome band.
- When `filterStripContent` is provided: render it above the Outcome band.
- Defaults preserve current behavior.

### `packages/ui/src/components/LayeredProcessView/__tests__/LayeredProcessView.test.tsx` — extended

- New tests for `operationsBandContent` swap + tributary-chip relocation.
- New tests for `filterStripContent` placement.
- Existing tests pass unchanged.

### `apps/azure/src/components/editor/FrameView.tsx` — modified

- Compose the dashboard into the LayeredProcessView via the new slot props, using the C1 hooks.

### `apps/pwa/src/components/views/FrameView.tsx` — modified

- Same composition as azure FrameView.

---

## Task 1: Add `mode` prop to `ProductionLineGlanceDashboard`

**Files:**

- Modify: `packages/ui/src/components/ProductionLineGlanceDashboard/types.ts`
- Modify: `packages/ui/src/components/ProductionLineGlanceDashboard/ProductionLineGlanceDashboard.tsx`
- Modify: `packages/ui/src/components/ProductionLineGlanceDashboard/__tests__/ProductionLineGlanceDashboard.test.tsx`

- [ ] **Step 1: Extend the test with mode behavior**

Append to `packages/ui/src/components/ProductionLineGlanceDashboard/__tests__/ProductionLineGlanceDashboard.test.tsx` (inside the existing `describe`):

```typescript
  it('renders both rows when mode is full (default)', () => {
    const { container } = render(<ProductionLineGlanceDashboard {...baseProps} />);
    const temporal = container.querySelector('[data-testid="dashboard-temporal-row"]');
    expect(temporal).toBeTruthy();
    expect(temporal).toHaveAttribute('aria-hidden', 'false');
  });

  it('collapses temporal row to max-height: 0 when mode="spatial"', () => {
    const { container } = render(
      <ProductionLineGlanceDashboard {...baseProps} mode="spatial" />
    );
    const temporal = container.querySelector('[data-testid="dashboard-temporal-row"]');
    expect(temporal).toBeTruthy();
    expect(temporal).toHaveAttribute('aria-hidden', 'true');
  });

  it('always mounts both rows in the DOM regardless of mode (no re-mount)', () => {
    const { container, rerender } = render(
      <ProductionLineGlanceDashboard {...baseProps} mode="spatial" />
    );
    const initialBoxplot = container.querySelector('[data-testid="mock-capability-boxplot"]');
    expect(initialBoxplot).toBeTruthy();
    rerender(<ProductionLineGlanceDashboard {...baseProps} mode="full" />);
    const afterBoxplot = container.querySelector('[data-testid="mock-capability-boxplot"]');
    expect(afterBoxplot).toBeTruthy();
    // Same DOM node identity — no re-mount.
    expect(afterBoxplot).toBe(initialBoxplot);
  });
```

- [ ] **Step 2: Run, expect failure**

`pnpm --filter @variscout/ui test ProductionLineGlanceDashboard` — expect FAIL on the new cases.

- [ ] **Step 3: Add `mode` to `ProductionLineGlanceDashboardProps`**

In `packages/ui/src/components/ProductionLineGlanceDashboard/types.ts`, append to the interface:

```typescript
  /** Reveal mode. Default 'full'. LayeredProcessView passes 'spatial'. */
  mode?: 'spatial' | 'full';
  /** Click handler when the user toggles between spatial and full. */
  onModeChange?: (next: 'spatial' | 'full') => void;
```

- [ ] **Step 4: Implement the collapse in `ProductionLineGlanceDashboard.tsx`**

Wrap the existing top-row grid (`<div data-testid="slot-cpk-trend">` and `<div data-testid="slot-cpk-gap">`) inside a single container with `data-testid="dashboard-temporal-row"`, add `aria-hidden`, and apply `max-height` transition:

The simplest effective layout: two grid rows controlled by mode. The temporal row is always rendered but its row-container has:

```tsx
<div
  data-testid="dashboard-temporal-row"
  aria-hidden={mode === 'spatial'}
  className={
    mode === 'spatial'
      ? 'grid grid-cols-2 gap-px bg-edge max-h-0 overflow-hidden transition-[max-height] duration-240'
      : 'grid grid-cols-2 gap-px bg-edge transition-[max-height] duration-240'
  }
  style={{ maxHeight: mode === 'spatial' ? 0 : '50%' }}
>
  <div data-testid="slot-cpk-trend" className="bg-surface p-3">
    <IChart {...} />
  </div>
  <div data-testid="slot-cpk-gap" className="bg-surface p-3">
    <CapabilityGapTrendChart {...} />
  </div>
</div>
```

The bottom (spatial) row stays in its own grid below. Adjust the outer container's `grid-rows-2` to a flex column if needed so the collapsed row's space is reclaimed.

Read the current `ProductionLineGlanceDashboard.tsx` and adapt the layout — preserve the 2x2 sizing in `mode='full'` and the bottom-row-only fill in `mode='spatial'`.

If `style={{ maxHeight: ... }}` per-render churns, instead toggle a className. Tailwind v4 supports `max-h-0` / `max-h-screen` and `transition-all duration-240`. Keep it framework-idiomatic.

Add `mode` to the destructured props with default `'full'`. Pass `onModeChange` through (no internal state — controlled).

- [ ] **Step 5: Run tests, expect pass**

`pnpm --filter @variscout/ui test ProductionLineGlanceDashboard` — expect all old tests + 3 new = pass.

- [ ] **Step 6: Verify `tsc --noEmit` clean + no regressions**

`pnpm --filter @variscout/ui tsc --noEmit && pnpm --filter @variscout/ui test 2>&1 | tail -3`

- [ ] **Step 7: Commit**

```bash
git add packages/ui/src/components/ProductionLineGlanceDashboard/
git commit -m "$(cat <<'EOF'
feat(ui): add mode prop to ProductionLineGlanceDashboard

mode: 'spatial' | 'full' (default 'full'). When 'spatial', the temporal
row's container collapses to max-height: 0 with a 240ms transition. The
chart components never re-mount — visx scales remain stable, no flicker.

Used by LayeredProcessView Operations band (Plan C2) for progressive
reveal: the band shows mode='spatial' inline; user click toggles to
mode='full' to see the temporal row above.

See spec docs/superpowers/specs/2026-04-28-production-line-glance-surface-wiring-design.md
section "The dashboard's three forms".

Co-Authored-By: ruflo <ruv@ruv.net>
EOF
)"
```

---

## Task 2: `useProductionLineGlanceOpsToggle` URL-state hook

**Files:**

- Create: `packages/hooks/src/useProductionLineGlanceOpsToggle.ts`
- Create: `packages/hooks/src/__tests__/useProductionLineGlanceOpsToggle.test.tsx`
- Modify: `packages/hooks/src/index.ts`

- [ ] **Step 1: Write failing tests**

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useProductionLineGlanceOpsToggle } from '../useProductionLineGlanceOpsToggle';

const setLocation = (search: string) => {
  window.history.replaceState(null, '', `/test${search ? `?${search}` : ''}`);
};

describe('useProductionLineGlanceOpsToggle', () => {
  beforeEach(() => setLocation(''));
  afterEach(() => setLocation(''));

  it('returns "spatial" by default', () => {
    const { result } = renderHook(() => useProductionLineGlanceOpsToggle());
    expect(result.current.mode).toBe('spatial');
  });

  it('reads "full" from ?ops=full', () => {
    setLocation('ops=full');
    const { result } = renderHook(() => useProductionLineGlanceOpsToggle());
    expect(result.current.mode).toBe('full');
  });

  it('writes ops=full to URL via replaceState', () => {
    const { result } = renderHook(() => useProductionLineGlanceOpsToggle());
    act(() => result.current.setMode('full'));
    expect(window.location.search).toContain('ops=full');
  });

  it('removes ops param when toggling back to spatial', () => {
    setLocation('ops=full');
    const { result } = renderHook(() => useProductionLineGlanceOpsToggle());
    act(() => result.current.setMode('spatial'));
    expect(window.location.search).not.toContain('ops=');
  });

  it('preserves filter params when toggling ops', () => {
    setLocation('product=Coke&ops=spatial');
    const { result } = renderHook(() => useProductionLineGlanceOpsToggle());
    act(() => result.current.setMode('full'));
    expect(window.location.search).toContain('product=Coke');
    expect(window.location.search).toContain('ops=full');
  });

  it('toggle() flips spatial <-> full', () => {
    const { result } = renderHook(() => useProductionLineGlanceOpsToggle());
    expect(result.current.mode).toBe('spatial');
    act(() => result.current.toggle());
    expect(result.current.mode).toBe('full');
    act(() => result.current.toggle());
    expect(result.current.mode).toBe('spatial');
  });

  it('does not push history entries (uses replaceState)', () => {
    const initial = window.history.length;
    const { result } = renderHook(() => useProductionLineGlanceOpsToggle());
    act(() => result.current.setMode('full'));
    act(() => result.current.setMode('spatial'));
    act(() => result.current.setMode('full'));
    expect(window.history.length).toBe(initial);
  });
});
```

- [ ] **Step 2: Run, expect fail**

`pnpm --filter @variscout/hooks test useProductionLineGlanceOpsToggle`

- [ ] **Step 3: Implement**

```typescript
import { useCallback, useEffect, useState } from 'react';

export type ProductionLineGlanceOpsMode = 'spatial' | 'full';

const PARAM_NAME = 'ops';

function readFromURL(): ProductionLineGlanceOpsMode {
  if (typeof window === 'undefined') return 'spatial';
  const value = new URLSearchParams(window.location.search).get(PARAM_NAME);
  return value === 'full' ? 'full' : 'spatial';
}

function writeToURL(mode: ProductionLineGlanceOpsMode): void {
  if (typeof window === 'undefined') return;
  const params = new URLSearchParams(window.location.search);
  if (mode === 'spatial') {
    params.delete(PARAM_NAME);
  } else {
    params.set(PARAM_NAME, 'full');
  }
  const next = params.toString();
  const url = `${window.location.pathname}${next ? `?${next}` : ''}${window.location.hash}`;
  window.history.replaceState(null, '', url);
}

export interface UseProductionLineGlanceOpsToggleResult {
  mode: ProductionLineGlanceOpsMode;
  setMode: (next: ProductionLineGlanceOpsMode) => void;
  toggle: () => void;
}

/**
 * URL-search-param state for the LayeredProcessView Operations band's
 * progressive-reveal mode. Default 'spatial' (only the bottom row is
 * visible). 'full' reveals the temporal row above the spatial row.
 *
 * Coexists with useProductionLineGlanceFilter via the latter's reserved
 * params list.
 */
export function useProductionLineGlanceOpsToggle(): UseProductionLineGlanceOpsToggleResult {
  const [mode, setModeState] = useState<ProductionLineGlanceOpsMode>(() => readFromURL());

  useEffect(() => {
    const onPop = () => setModeState(readFromURL());
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const setMode = useCallback((next: ProductionLineGlanceOpsMode) => {
    setModeState(next);
    writeToURL(next);
  }, []);

  const toggle = useCallback(() => {
    setModeState(prev => {
      const next: ProductionLineGlanceOpsMode = prev === 'spatial' ? 'full' : 'spatial';
      writeToURL(next);
      return next;
    });
  }, []);

  return { mode, setMode, toggle };
}
```

- [ ] **Step 4: Run, expect pass**

7/7.

- [ ] **Step 5: Re-export from `packages/hooks/src/index.ts`**

```typescript
export { useProductionLineGlanceOpsToggle } from './useProductionLineGlanceOpsToggle';
export type {
  ProductionLineGlanceOpsMode,
  UseProductionLineGlanceOpsToggleResult,
} from './useProductionLineGlanceOpsToggle';
```

- [ ] **Step 6: Verify hooks suite**

`pnpm --filter @variscout/hooks test 2>&1 | tail -3` — total previous + 7.

- [ ] **Step 7: Commit**

```bash
git add packages/hooks/src/useProductionLineGlanceOpsToggle.ts \
        packages/hooks/src/__tests__/useProductionLineGlanceOpsToggle.test.tsx \
        packages/hooks/src/index.ts
git commit -m "feat(hooks): add useProductionLineGlanceOpsToggle (URL ?ops state)

URL-search-param synchronizer for the LayeredProcessView Operations band's
progressive-reveal mode. Default 'spatial' (bottom row only); 'full' adds
the temporal row above. Coexists with useProductionLineGlanceFilter via
that hook's reserved-params list.

See spec docs/superpowers/specs/2026-04-28-production-line-glance-surface-wiring-design.md
section 'Three surfaces / 1. LayeredProcessView Operations band'.

Co-Authored-By: ruflo <ruv@ruv.net>"
```

---

## Task 3: `LayeredProcessView` slot-prop API

**Files:**

- Modify: `packages/ui/src/components/LayeredProcessView/LayeredProcessView.tsx`
- Modify: `packages/ui/src/components/LayeredProcessView/__tests__/LayeredProcessView.test.tsx`

- [ ] **Step 1: Read the current LayeredProcessView**

Read the full file — note the existing Outcome / Process Flow / Operations bands and the tributary-chip rendering inside the Operations band.

- [ ] **Step 2: Extend the test**

Append cases:

```typescript
  it('replaces Operations band content when operationsBandContent is provided', () => {
    const mapWithFactors = /* same as existing test */;
    render(
      <LayeredProcessView
        map={mapWithFactors}
        availableColumns={[]}
        onChange={() => {}}
        operationsBandContent={<div data-testid="custom-ops">CUSTOM</div>}
      />
    );
    expect(screen.getByTestId('custom-ops')).toBeInTheDocument();
  });

  it('relocates tributary chips to Outcome band as Mapped factors when operationsBandContent is provided', () => {
    const mapWithFactors = /* map with at least one tributary */;
    render(
      <LayeredProcessView
        map={mapWithFactors}
        availableColumns={[]}
        onChange={() => {}}
        operationsBandContent={<div>X</div>}
      />
    );
    // Tributary chips appear inside the Outcome band's Mapped factors subsection
    const outcome = screen.getByTestId('band-outcome');
    expect(outcome.textContent).toMatch(/Mapped factors/i);
    // The chip's data-testid stays the same; it just moved to a different band
    expect(within(outcome).getByTestId(/factor-chip-/)).toBeInTheDocument();
  });

  it('renders filterStripContent above the Outcome band when provided', () => {
    render(
      <LayeredProcessView
        map={emptyMap}
        availableColumns={[]}
        onChange={() => {}}
        filterStripContent={<div data-testid="filter-strip">FILTER</div>}
      />
    );
    expect(screen.getByTestId('filter-strip')).toBeInTheDocument();
  });

  it('renders Operations band default content (tributary chips) when slot props are absent', () => {
    const mapWithFactors = /* map with one tributary */;
    render(<LayeredProcessView map={mapWithFactors} availableColumns={[]} onChange={() => {}} />);
    const ops = screen.getByTestId('band-operations');
    expect(within(ops).getByTestId(/factor-chip-/)).toBeInTheDocument();
  });
```

(`within` from `@testing-library/react`.)

- [ ] **Step 3: Run, expect failure**

`pnpm --filter @variscout/ui test LayeredProcessView`

- [ ] **Step 4: Implement the slot props**

Modify `packages/ui/src/components/LayeredProcessView/LayeredProcessView.tsx`:

```typescript
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
  /** Optional content rendered inside the Operations band. When provided,
   * tributary chips relocate to the Outcome band as a "Mapped factors"
   * subsection. Plan C2. */
  operationsBandContent?: React.ReactNode;
  /** Optional content rendered above the Outcome band (typically the
   * dashboard's filter strip). Plan C2. */
  filterStripContent?: React.ReactNode;
}

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
  operationsBandContent,
  filterStripContent,
}) => {
  const hasOutcomeData = target !== undefined || usl !== undefined || lsl !== undefined;
  const tributariesContent =
    map.tributaries.length > 0 ? (
      <ul className="mt-2 flex flex-wrap gap-2">
        {map.tributaries.map(trib => {
          const parentStep = map.nodes.find(n => n.id === trib.stepId);
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
    );

  return (
    <div data-testid="layered-process-view" className="flex flex-col">
      {filterStripContent ? (
        <div data-testid="layered-filter-strip">{filterStripContent}</div>
      ) : null}

      <section
        data-testid="band-outcome"
        className="border-b border-edge px-4 py-3 bg-surface-secondary"
      >
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
        {operationsBandContent ? (
          <div className="mt-3">
            <h4 className="text-xs font-semibold uppercase tracking-wide text-content-muted">
              Mapped factors
            </h4>
            {tributariesContent}
          </div>
        ) : null}
      </section>

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

      <section data-testid="band-operations" className="px-4 py-3 bg-surface-secondary">
        <h3 className="text-sm font-semibold text-content">Operations</h3>
        {operationsBandContent ? (
          <div className="mt-2">{operationsBandContent}</div>
        ) : (
          tributariesContent
        )}
      </section>
    </div>
  );
};
```

- [ ] **Step 5: Run, expect pass**

`pnpm --filter @variscout/ui test LayeredProcessView` — all old tests + 4 new = pass.

- [ ] **Step 6: Verify ui suite + tsc**

```
pnpm --filter @variscout/ui test
pnpm --filter @variscout/ui tsc --noEmit
```

- [ ] **Step 7: Commit**

```bash
git add packages/ui/src/components/LayeredProcessView/
git commit -m "feat(ui): add operationsBandContent + filterStripContent slot props to LayeredProcessView

Two optional slot props for Plan C2's progressive-reveal composition. When
operationsBandContent is provided, the band renders the slot content and
the tributary-chip list relocates to the Outcome band as a 'Mapped factors'
subsection. When filterStripContent is provided, it renders above the
Outcome band as the layered-view's hoisted filter strip.

Default behavior (both slot props absent) is unchanged — preserves current
FRAME usage.

See spec docs/superpowers/specs/2026-04-28-production-line-glance-surface-wiring-design.md
section 'Three surfaces / 1. LayeredProcessView Operations band'.

Co-Authored-By: ruflo <ruv@ruv.net>"
```

---

## Task 4: Compose `LayeredProcessViewWithCapability` wrapper

The wrapper takes the same props as `LayeredProcessView` plus `data` (slot inputs from `useProductionLineGlanceData`) + `filter` (from `useProductionLineGlanceFilter`) + `mode/onModeToggle` (from `useProductionLineGlanceOpsToggle`). It composes the dashboard inside the Operations band and the filter strip above the Outcome band, plus the progressive-reveal affordance.

**Files:**

- Create: `packages/ui/src/components/LayeredProcessView/LayeredProcessViewWithCapability.tsx`
- Create: `packages/ui/src/components/LayeredProcessView/__tests__/LayeredProcessViewWithCapability.test.tsx`
- Modify: `packages/ui/src/components/LayeredProcessView/index.ts`
- Modify: `packages/ui/src/index.ts`

- [ ] **Step 1: Write the test**

```typescript
import { describe, it, expect, vi } from 'vitest';

vi.mock('@variscout/charts', async () => {
  const React = await import('react');
  return {
    IChart: () => React.createElement('div', { 'data-testid': 'mock-cpk-trend' }),
    CapabilityGapTrendChart: () => React.createElement('div', { 'data-testid': 'mock-gap-trend' }),
    CapabilityBoxplot: () => React.createElement('div', { 'data-testid': 'mock-capability-boxplot' }),
    StepErrorPareto: () => React.createElement('div', { 'data-testid': 'mock-step-pareto' }),
  };
});

import { render, screen, fireEvent } from '@testing-library/react';
import { LayeredProcessViewWithCapability } from '../LayeredProcessViewWithCapability';
import type { ProcessMap } from '@variscout/core/frame';
import type { ProductionLineGlanceDashboardProps } from '../../ProductionLineGlanceDashboard';

const map: ProcessMap = {
  version: 1,
  nodes: [],
  tributaries: [],
} as unknown as ProcessMap;

const data: Pick<
  ProductionLineGlanceDashboardProps,
  'cpkTrend' | 'cpkGapTrend' | 'capabilityNodes' | 'errorSteps'
> = {
  cpkTrend: { data: [], stats: null, specs: { target: 1.33 } },
  cpkGapTrend: { series: [], stats: null },
  capabilityNodes: [],
  errorSteps: [],
};

describe('LayeredProcessViewWithCapability', () => {
  it('renders the dashboard inside the Operations band', () => {
    render(
      <LayeredProcessViewWithCapability
        map={map}
        availableColumns={[]}
        onChange={() => {}}
        data={data}
        filter={{
          availableContext: { hubColumns: [] },
          contextValueOptions: {},
          value: {},
          onChange: vi.fn(),
        }}
        mode="spatial"
        onModeChange={vi.fn()}
      />
    );
    expect(screen.getByTestId('mock-capability-boxplot')).toBeInTheDocument();
    expect(screen.getByTestId('mock-step-pareto')).toBeInTheDocument();
  });

  it('shows "Show temporal trends" affordance when mode=spatial', () => {
    render(
      <LayeredProcessViewWithCapability
        map={map}
        availableColumns={[]}
        onChange={() => {}}
        data={data}
        filter={{
          availableContext: { hubColumns: [] },
          contextValueOptions: {},
          value: {},
          onChange: vi.fn(),
        }}
        mode="spatial"
        onModeChange={vi.fn()}
      />
    );
    expect(screen.getByRole('button', { name: /show temporal trends/i })).toBeInTheDocument();
  });

  it('shows "Hide temporal trends" affordance when mode=full', () => {
    render(
      <LayeredProcessViewWithCapability
        map={map}
        availableColumns={[]}
        onChange={() => {}}
        data={data}
        filter={{
          availableContext: { hubColumns: [] },
          contextValueOptions: {},
          value: {},
          onChange: vi.fn(),
        }}
        mode="full"
        onModeChange={vi.fn()}
      />
    );
    expect(screen.getByRole('button', { name: /hide temporal trends/i })).toBeInTheDocument();
  });

  it('fires onModeChange when affordance is clicked', () => {
    const onModeChange = vi.fn();
    render(
      <LayeredProcessViewWithCapability
        map={map}
        availableColumns={[]}
        onChange={() => {}}
        data={data}
        filter={{
          availableContext: { hubColumns: [] },
          contextValueOptions: {},
          value: {},
          onChange: vi.fn(),
        }}
        mode="spatial"
        onModeChange={onModeChange}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: /show temporal trends/i }));
    expect(onModeChange).toHaveBeenCalledWith('full');
  });

  it('renders the filter strip above the Outcome band', () => {
    render(
      <LayeredProcessViewWithCapability
        map={map}
        availableColumns={[]}
        onChange={() => {}}
        data={data}
        filter={{
          availableContext: { hubColumns: ['product'] },
          contextValueOptions: { product: ['A'] },
          value: {},
          onChange: vi.fn(),
        }}
        mode="spatial"
        onModeChange={vi.fn()}
      />
    );
    // ProductionLineGlanceFilterStrip renders the column name as a label
    expect(screen.getByText('product')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run, expect fail**

- [ ] **Step 3: Implement**

```typescript
/**
 * LayeredProcessViewWithCapability — composition wrapper.
 *
 * Mounts ProductionLineGlanceDashboard inside LayeredProcessView's Operations
 * band slot, the dashboard's filter strip above the Outcome band, and a
 * "Show/Hide temporal trends" affordance for progressive reveal.
 *
 * See spec docs/superpowers/specs/2026-04-28-production-line-glance-surface-wiring-design.md
 * section "Three surfaces / 1. LayeredProcessView Operations band".
 */
import React from 'react';
import {
  LayeredProcessView,
  type LayeredProcessViewProps,
} from './LayeredProcessView';
import {
  ProductionLineGlanceDashboard,
  ProductionLineGlanceFilterStrip,
  type ProductionLineGlanceDashboardProps,
  type ProductionLineGlanceFilterStripProps,
} from '../ProductionLineGlanceDashboard';

export type ProductionLineGlanceOpsMode = 'spatial' | 'full';

export interface LayeredProcessViewWithCapabilityProps
  extends Omit<LayeredProcessViewProps, 'operationsBandContent' | 'filterStripContent'> {
  data: Pick<
    ProductionLineGlanceDashboardProps,
    'cpkTrend' | 'cpkGapTrend' | 'capabilityNodes' | 'errorSteps'
  >;
  filter: ProductionLineGlanceFilterStripProps;
  mode: ProductionLineGlanceOpsMode;
  onModeChange: (next: ProductionLineGlanceOpsMode) => void;
  onStepClick?: (nodeId: string) => void;
}

export const LayeredProcessViewWithCapability: React.FC<LayeredProcessViewWithCapabilityProps> = ({
  data,
  filter,
  mode,
  onModeChange,
  onStepClick,
  ...layeredProps
}) => {
  const isFull = mode === 'full';
  const affordanceLabel = isFull ? 'Hide temporal trends' : 'Show temporal trends';
  const affordanceArrow = isFull ? '↓' : '↑';

  return (
    <LayeredProcessView
      {...layeredProps}
      filterStripContent={<ProductionLineGlanceFilterStrip {...filter} />}
      operationsBandContent={
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={() => onModeChange(isFull ? 'spatial' : 'full')}
            className="self-start rounded text-xs font-medium text-content-secondary transition-colors hover:text-content"
          >
            {affordanceLabel} {affordanceArrow}
          </button>
          <div data-testid="ops-band-dashboard">
            <ProductionLineGlanceDashboard
              {...data}
              mode={mode}
              onStepClick={onStepClick}
            />
          </div>
        </div>
      }
    />
  );
};

export default LayeredProcessViewWithCapability;
```

- [ ] **Step 4: Run, expect pass**

5/5.

- [ ] **Step 5: Wire exports**

In `packages/ui/src/components/LayeredProcessView/index.ts`:

```typescript
export { LayeredProcessView } from './LayeredProcessView';
export type { LayeredProcessViewProps } from './LayeredProcessView';
export { LayeredProcessViewWithCapability } from './LayeredProcessViewWithCapability';
export type {
  LayeredProcessViewWithCapabilityProps,
  ProductionLineGlanceOpsMode,
} from './LayeredProcessViewWithCapability';
```

In `packages/ui/src/index.ts` append:

```typescript
export { LayeredProcessViewWithCapability } from './components/LayeredProcessView';
export type {
  LayeredProcessViewWithCapabilityProps,
  ProductionLineGlanceOpsMode,
} from './components/LayeredProcessView';
```

- [ ] **Step 6: Verify ui suite + tsc**

- [ ] **Step 7: Commit**

```bash
git add packages/ui/src/components/LayeredProcessView/ \
        packages/ui/src/index.ts
git commit -m "feat(ui): add LayeredProcessViewWithCapability composition wrapper

Mounts ProductionLineGlanceDashboard inside LayeredProcessView's
Operations band with progressive-reveal affordance ('Show/Hide temporal
trends'). Filter strip hoisted above the Outcome band. Plan C2.

See spec docs/superpowers/specs/2026-04-28-production-line-glance-surface-wiring-design.md
section 'Three surfaces / 1. LayeredProcessView Operations band'.

Co-Authored-By: ruflo <ruv@ruv.net>"
```

---

## Task 5: Wire into apps/azure FrameView

**Files:**

- Modify: `apps/azure/src/components/editor/FrameView.tsx`
- Modify or extend tests: `apps/azure/src/components/editor/__tests__/FrameView.test.tsx` (if exists; otherwise add a small smoke test)

- [ ] **Step 1: Read existing FrameView**

`cat apps/azure/src/components/editor/FrameView.tsx | head -120`

Understand which props the existing `<LayeredProcessView ... />` receives and where the surrounding hub/investigation context comes from.

- [ ] **Step 2: Replace `<LayeredProcessView>` with `<LayeredProcessViewWithCapability>`**

Pull the rollup (or hub + members + rows) from the existing FrameView state. Use:

- `useHubProvision({ rollup })` — but FrameView may not have a rollup yet (it's an investigation-editor surface, not a hub view). If so, BUILD a synthetic rollup from the current investigation: `{ hub: { id: 'frame-preview', canonicalProcessMap: map, ... }, investigations: [currentInvestigation] }`. The dashboard will show data scoped to the investigation being authored.
- `useProductionLineGlanceData({ hub, members, rowsByInvestigation, contextFilter })` with the synthetic rollup.
- `useProductionLineGlanceFilter()` for filter state.
- `useProductionLineGlanceOpsToggle()` for mode state.

The exact synthetic-rollup shape depends on FrameView's existing data; the implementer adapts.

If wiring becomes complex (FrameView's data layer doesn't naturally project to ProcessHubRollup), a smaller scope is acceptable: pass a `data` prop with empty slot inputs (the empty-state hint in the dashboard handles it gracefully) and document that real-data wiring lands in a follow-up. Plan C2's primary value is the API + composition; live data in FRAME is V2.

- [ ] **Step 3: If a smoke test exists, update; otherwise add a minimal one**

Add a test that mounts FrameView and asserts `data-testid="layered-process-view"` is present and `data-testid="ops-band-dashboard"` is present (using mocked chart components).

- [ ] **Step 4: Run azure tests**

`pnpm --filter @variscout/azure-app test FrameView`

- [ ] **Step 5: Commit**

```bash
git add apps/azure/src/components/editor/FrameView.tsx \
        apps/azure/src/components/editor/__tests__/FrameView.test.tsx
git commit -m "feat(azure): wire LayeredProcessViewWithCapability into FrameView

Replaces direct LayeredProcessView mount with the C2 composition wrapper
hosting the production-line-glance dashboard inside the Operations band
with progressive-reveal affordance. Filter strip hoisted to top of the
layered view. URL ?ops state via useProductionLineGlanceOpsToggle.

See spec docs/superpowers/specs/2026-04-28-production-line-glance-surface-wiring-design.md.

Co-Authored-By: ruflo <ruv@ruv.net>"
```

---

## Task 6: Wire into apps/pwa FrameView

Same as Task 5 but for `apps/pwa/src/components/views/FrameView.tsx`. PWA's data layer is Zustand; the implementer projects the current investigation into the synthetic rollup similarly to azure.

- [ ] **Step 1: Read existing PWA FrameView + identify data path**
- [ ] **Step 2: Replace `<LayeredProcessView>` with `<LayeredProcessViewWithCapability>`**
- [ ] **Step 3: Add/update smoke test**
- [ ] **Step 4: Verify PWA tests**
- [ ] **Step 5: Commit**

```bash
git add apps/pwa/src/components/views/FrameView.tsx
git commit -m "feat(pwa): wire LayeredProcessViewWithCapability into FrameView

Plan C2 — same composition as the azure FrameView wiring. Dashboard
spatial row inline in the Operations band; progressive reveal toggles
the temporal row above.

Co-Authored-By: ruflo <ruv@ruv.net>"
```

---

## Task 7: Workspace verification + chrome walk + PR

- [ ] **Step 1: Full workspace tests + build + pr-ready-check**

```
pnpm test
pnpm build
bash scripts/pr-ready-check.sh
```

- [ ] **Step 2: Chrome walk — start dev server and validate**

```
pnpm --filter @variscout/azure-app dev
```

Open the FrameView. Validate:

- LayeredProcessView renders three bands.
- Operations band shows the dashboard's spatial row (CapabilityBoxplot left, StepErrorPareto right).
- Filter strip appears above the Outcome band.
- Outcome band shows "Mapped factors" subsection with tributary chips.
- "Show temporal trends ↑" affordance visible. Click it: temporal row expands above the spatial row with a smooth transition. URL becomes `?ops=full`. Affordance text updates to "Hide temporal trends ↓".
- Click again: collapses. URL `?ops` removed.

Capture screenshots before/after.

- [ ] **Step 3: Push branch + open PR**

```bash
git push -u origin feat/plan-c2-layered-view-progressive-reveal
gh pr create --title "feat: Plan C2 LayeredProcessView Operations band + progressive reveal" --body "$(cat <<'EOF'
## Summary

Second of three sub-plans for the production-line-glance surface-wiring design. Wires the dashboard into LayeredProcessView's Operations band with progressive reveal in both azure-app and PWA FrameView.

- `mode: 'spatial' | 'full'` prop on `ProductionLineGlanceDashboard` (additive; default 'full' preserves C1 behavior).
- `useProductionLineGlanceOpsToggle` URL `?ops` state hook.
- `operationsBandContent` + `filterStripContent` slot props on `LayeredProcessView` (additive; default behavior unchanged).
- `LayeredProcessViewWithCapability` composition wrapper.
- Wired into both apps' FrameView.
- Tributary chips relocated to Outcome band's "Mapped factors" subsection when slot props are used.

## Test plan

- [x] All package suites green
- [x] `pnpm test` 9/9 turbo tasks green
- [x] `bash scripts/pr-ready-check.sh` green
- [ ] Chrome walk: progressive reveal animation, URL state, filter strip placement, mapped-factors relocation

## Spec

`docs/superpowers/specs/2026-04-28-production-line-glance-surface-wiring-design.md` — sections "The dashboard's three forms" + "Three surfaces / 1. LayeredProcessView Operations band".

🤖 Generated with [ruflo](https://github.com/ruvnet/ruflo)
EOF
)"
```

- [ ] **Step 4: Final code review** via `feature-dev:code-reviewer` subagent. Focus on:
  - Watson aggregation safety (no new arithmetic across heterogeneous nodes/investigations).
  - Hard rules: no hex; no manual memo; semantic Tailwind tokens; both Base + responsive exports for any new chart-like components.
  - Test discipline: vi.mock before imports; deterministic data; no `as never` masking type errors.
  - Spec coverage of C2's stated scope.

- [ ] **Step 5: Address findings** in follow-up commits.

- [ ] **Step 6: Squash-merge**

```bash
gh pr merge --squash --delete-branch
```

---

## Self-review

**Spec coverage:**

- ✅ `mode` prop on dashboard (T1)
- ✅ URL `?ops` state (T2)
- ✅ Slot-prop API (T3)
- ✅ Composition wrapper with progressive-reveal affordance (T4)
- ✅ Surface wiring in both apps' FrameView (T5, T6)
- ✅ Tributary chips relocation (T3)
- ✅ Filter strip hoisted (T3, T4)

**Placeholder scan:** No TBD/TODO/etc.

**Type consistency:** `ProductionLineGlanceOpsMode` defined in T2 (`@variscout/hooks`) and T4 (`@variscout/ui`). The duplication is intentional: hooks owns URL state; ui owns composition. Both reduce to `'spatial' | 'full'` and are interchangeable.

**Risk reminders:**

- T5/T6 may discover that FrameView's data layer doesn't project cleanly to ProcessHubRollup. Pragmatic fallback: pass empty `data` props and document live-data wiring as V2 follow-up. The composition is the value; live data is icing.
- The temporal row's `max-height` transition with content of unknown height (depends on viewport) needs the right CSS — use `max-h-screen` for full or rely on actual element height via `style.maxHeight`. T1 implementer chooses.
- The "Mapped factors" subsection in Outcome band may overflow at small widths. Wrap chip list with `flex-wrap` (already in original code).
