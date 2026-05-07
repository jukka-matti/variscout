---
title: 'Canvas Hypothesis-Arrow Drawing — PR8 sub-PR 8d implementation plan'
audience: [engineer, product]
category: implementation
status: active
last-reviewed: 2026-05-07
related:
  - docs/superpowers/specs/2026-05-07-canvas-hypothesis-arrow-drawing-design.md
  - docs/superpowers/plans/2026-05-07-canvas-pr8-vision-alignment-master.md
  - docs/superpowers/specs/2026-05-04-manual-canvas-authoring-design.md
  - docs/superpowers/specs/2026-05-07-data-flow-foundation-f4-three-layer-state-design.md
---

# Canvas Hypothesis-Arrow Drawing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended per master-plan D6) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. **Sonnet for ≥70% of dispatches** (implementer + per-task spec/quality reviewers); **Opus only for the final code-reviewer** sweep before merge.
>
> **Spec:** [`docs/superpowers/specs/2026-05-07-canvas-hypothesis-arrow-drawing-design.md`](../specs/2026-05-07-canvas-hypothesis-arrow-drawing-design.md). Read it for design rationale; this plan is the executable shape.
>
> **Worktree:** Per `feedback_one_worktree_per_agent`, create `.worktrees/canvas-pr8-8d-hypothesis-arrow-drawing/` via `superpowers:using-git-worktrees` BEFORE dispatching the first task. Branch name: `canvas-pr8-8d-hypothesis-arrow-drawing`.

**Goal:** Ship the user-facing gesture for drawing hypothesis arrows on the canvas, replacing Codex's read-only PR6 projection with an authoring affordance per vision §3.4. Closes `docs/investigations.md` "Canvas hypothesis-arrow drawing affordance absent" entry pinned 2026-05-06.

**Architecture:** Custom pointer-event state machine (`useHypothesisDrawTool` hook) drives a top-level mode-agnostic canvas tool. Source/target hit-test on `[data-arrow-endpoint="…"]` DOM attributes attached to step cards + column chips. Release opens a hand-rolled floating popover; Save commits a `CausalLink` via `investigationStore.addCausalLink`. Promoted hypotheses (ADR-064 SuspectedCause hubs past evidence threshold) get a new `<StepNodeMarker>` pip on card chrome — replacing Codex's inline count badge per `feedback_fix_absorbed_violations_at_seam`.

**Tech Stack:** TypeScript 6, React 19, Zustand (existing F4 stores: `investigationStore` Document layer; gesture state View-component-local), Pointer Events API, SVG, `focus-trap-react` (existing dep), Lucide icons (existing dep), Vitest + React Testing Library.

**Plan-time decisions locked** (resolves spec §10 risks):

| Risk                   | Decision                                                                                                                                                                                                              |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| #1 step-grabbed column | `card.metricColumn` (resolved by `useCanvasStepCards` precedence: `node.ctqColumn` → first numeric assigned → first assigned). If `card.metricColumn` is undefined, gesture fails validity check (no valid endpoint). |
| #2 chained-add UX      | Return to `'select'` after Save. MBB workflow is reflective-one-at-a-time, not bulk entry; user clicks the button again for a second draw.                                                                            |
| #5 popover library     | Hand-rolled positioning consistent with existing `YAxisPopover` / `RiskPopover` patterns. `focus-trap-react` for focus management. No new dep.                                                                        |
| #6 marker icon         | Lucide `Flag` icon. Status color: `bg-status-warning-soft text-status-warning` for `'suspected'`; `bg-status-info-soft text-status-info` for `'confirmed'`.                                                           |

**File structure:**

```
NEW FILES:
  packages/hooks/src/useHypothesisDrawTool.ts                                 (state machine + endpoint helpers)
  packages/hooks/src/__tests__/useHypothesisDrawTool.test.ts                  (deterministic state-machine tests)
  packages/ui/src/components/Canvas/internal/HypothesisDrawToolButton.tsx     (top-level chrome button)
  packages/ui/src/components/Canvas/internal/__tests__/HypothesisDrawToolButton.test.tsx
  packages/ui/src/components/Canvas/internal/HypothesisDraftPopover.tsx       (inline form, hand-rolled positioning)
  packages/ui/src/components/Canvas/internal/__tests__/HypothesisDraftPopover.test.tsx
  packages/ui/src/components/Canvas/internal/StepNodeMarker.tsx               (promoted-hypothesis pip)
  packages/ui/src/components/Canvas/internal/__tests__/StepNodeMarker.test.tsx

MODIFIED FILES:
  packages/hooks/src/useSessionCanvasFilters.ts                               (+ activeCanvasTool field + auto-overlay)
  packages/hooks/src/__tests__/useSessionCanvasFilters.test.ts                (+ tool toggling tests)
  packages/ui/src/components/Canvas/internal/CanvasStepCard.tsx               (replace badge w/ marker; data-arrow-endpoint; activeCanvasTool prop)
  packages/ui/src/components/Canvas/internal/__tests__/CanvasStepCard.test.tsx (or add file if absent)
  packages/ui/src/components/Canvas/index.tsx                                 (chrome button; pointer handlers; rubber-band SVG)
  packages/ui/src/components/Canvas/CanvasWorkspace.tsx                       (thread activeCanvasTool through)
  packages/ui/src/components/Canvas/__tests__/CanvasWorkspace.test.tsx        (E2E integration)
  packages/ui/src/components/Canvas/internal/CanvasStepOverlay.tsx            (Remove button per causalLink)
  packages/ui/src/components/Canvas/internal/__tests__/CanvasStepOverlay.test.tsx (Remove behavior)
  packages/hooks/src/index.ts                                                  (export new hook + types)
  packages/ui/src/index.ts                                                     (export new components if needed externally)
  docs/investigations.md                                                       (mark entry [RESOLVED YYYY-MM-DD])
```

---

## Task 1: State machine hook + endpoint helpers

**Files:**

- Create: `packages/hooks/src/useHypothesisDrawTool.ts`
- Create: `packages/hooks/src/__tests__/useHypothesisDrawTool.test.ts`
- Modify: `packages/hooks/src/index.ts` (add export)

**Goal:** Pure state-machine hook driving the gesture. No DOM dependency; deterministic transitions over `pointerdown` / `pointermove` / `pointerup` / `pointercancel` / `keyDown(Esc)` events. Returns the current state + transition methods + commit-resolution helpers. Independent of UI surface.

- [ ] **Step 1: Write the failing test**

Create `packages/hooks/src/__tests__/useHypothesisDrawTool.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useHypothesisDrawTool, type ArrowEndpoint } from '../useHypothesisDrawTool';

const stepA: ArrowEndpoint = { kind: 'step', id: 'step-a' };
const stepB: ArrowEndpoint = { kind: 'step', id: 'step-b' };
const colX: ArrowEndpoint = { kind: 'column', name: 'temp_psi', hostStepId: 'step-a' };
const colY: ArrowEndpoint = { kind: 'column', name: 'yield', hostStepId: 'step-b' };

describe('useHypothesisDrawTool — state machine', () => {
  it('starts in idle phase', () => {
    const { result } = renderHook(() => useHypothesisDrawTool({ active: true }));
    expect(result.current.state).toEqual({ phase: 'idle' });
  });

  it('idle → drawing on pointerDown over a valid endpoint', () => {
    const { result } = renderHook(() => useHypothesisDrawTool({ active: true }));
    act(() => result.current.onPointerDown(stepA, { x: 10, y: 20 }));
    expect(result.current.state).toEqual({
      phase: 'drawing',
      source: stepA,
      cursorAt: { x: 10, y: 20 },
      hover: null,
    });
  });

  it('drawing tracks hover target on pointerMove', () => {
    const { result } = renderHook(() => useHypothesisDrawTool({ active: true }));
    act(() => result.current.onPointerDown(stepA, { x: 10, y: 20 }));
    act(() => result.current.onPointerMove({ x: 100, y: 50 }, stepB));
    expect(result.current.state).toMatchObject({
      phase: 'drawing',
      cursorAt: { x: 100, y: 50 },
      hover: stepB,
    });
  });

  it('drawing → awaitingForm on pointerUp over a valid different target', () => {
    const { result } = renderHook(() => useHypothesisDrawTool({ active: true }));
    act(() => result.current.onPointerDown(stepA, { x: 10, y: 20 }));
    act(() => result.current.onPointerUp(stepB, { x: 100, y: 50 }));
    expect(result.current.state).toEqual({
      phase: 'awaitingForm',
      source: stepA,
      target: stepB,
      releaseAt: { x: 100, y: 50 },
    });
  });

  it('drawing → idle on pointerUp on the same source (self-loop rejected)', () => {
    const { result } = renderHook(() => useHypothesisDrawTool({ active: true }));
    act(() => result.current.onPointerDown(stepA, { x: 10, y: 20 }));
    act(() => result.current.onPointerUp(stepA, { x: 12, y: 22 }));
    expect(result.current.state).toEqual({ phase: 'idle' });
  });

  it('drawing → idle on pointerUp over no target', () => {
    const { result } = renderHook(() => useHypothesisDrawTool({ active: true }));
    act(() => result.current.onPointerDown(stepA, { x: 10, y: 20 }));
    act(() => result.current.onPointerUp(null, { x: 999, y: 999 }));
    expect(result.current.state).toEqual({ phase: 'idle' });
  });

  it('any phase → idle on Esc', () => {
    const { result } = renderHook(() => useHypothesisDrawTool({ active: true }));
    act(() => result.current.onPointerDown(stepA, { x: 10, y: 20 }));
    act(() => result.current.cancel());
    expect(result.current.state).toEqual({ phase: 'idle' });
  });

  it('any phase → idle on pointerCancel', () => {
    const { result } = renderHook(() => useHypothesisDrawTool({ active: true }));
    act(() => result.current.onPointerDown(stepA, { x: 10, y: 20 }));
    act(() => result.current.onPointerCancel());
    expect(result.current.state).toEqual({ phase: 'idle' });
  });

  it('ignores all events when active=false', () => {
    const { result } = renderHook(() => useHypothesisDrawTool({ active: false }));
    act(() => result.current.onPointerDown(stepA, { x: 10, y: 20 }));
    expect(result.current.state).toEqual({ phase: 'idle' });
  });

  it('column-grabbed source survives the gesture into awaitingForm', () => {
    const { result } = renderHook(() => useHypothesisDrawTool({ active: true }));
    act(() => result.current.onPointerDown(colX, { x: 0, y: 0 }));
    act(() => result.current.onPointerUp(colY, { x: 0, y: 0 }));
    expect(result.current.state).toMatchObject({
      phase: 'awaitingForm',
      source: colX,
      target: colY,
    });
  });

  it('reset() returns to idle from awaitingForm (called by popover Save/Cancel)', () => {
    const { result } = renderHook(() => useHypothesisDrawTool({ active: true }));
    act(() => result.current.onPointerDown(stepA, { x: 0, y: 0 }));
    act(() => result.current.onPointerUp(stepB, { x: 100, y: 100 }));
    expect(result.current.state.phase).toBe('awaitingForm');
    act(() => result.current.reset());
    expect(result.current.state).toEqual({ phase: 'idle' });
  });
});

describe('useHypothesisDrawTool — endpoint resolution helper', () => {
  it('resolves step-grabbed endpoint to its metric column when present', () => {
    // resolveEndpointToFactor is exported as a pure helper for use by the
    // canvas surface at commit time. It's a discriminated-union narrower.
    const { resolveEndpointToFactor } = require('../useHypothesisDrawTool');
    expect(resolveEndpointToFactor(stepA, { 'step-a': 'pressure_psi', 'step-b': 'yield' })).toBe(
      'pressure_psi'
    );
  });

  it('returns undefined when step has no metric column', () => {
    const { resolveEndpointToFactor } = require('../useHypothesisDrawTool');
    expect(resolveEndpointToFactor(stepA, { 'step-a': undefined })).toBeUndefined();
  });

  it('returns the column name directly for column endpoints', () => {
    const { resolveEndpointToFactor } = require('../useHypothesisDrawTool');
    expect(resolveEndpointToFactor(colX, {})).toBe('temp_psi');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @variscout/hooks test -- useHypothesisDrawTool`
Expected: FAIL with "Cannot find module '../useHypothesisDrawTool'"

- [ ] **Step 3: Write the hook implementation**

Create `packages/hooks/src/useHypothesisDrawTool.ts`:

```ts
import { useCallback, useState } from 'react';

/** A drag endpoint resolved at hit-test time on the canvas. */
export type ArrowEndpoint =
  | { kind: 'step'; id: string }
  | { kind: 'column'; name: string; hostStepId: string };

export type Point = { x: number; y: number };

export type DrawToolState =
  | { phase: 'idle' }
  | {
      phase: 'drawing';
      source: ArrowEndpoint;
      cursorAt: Point;
      hover: ArrowEndpoint | null;
    }
  | {
      phase: 'awaitingForm';
      source: ArrowEndpoint;
      target: ArrowEndpoint;
      releaseAt: Point;
    };

export interface UseHypothesisDrawToolArgs {
  /** When false, all event handlers are no-ops. Wire this from `activeCanvasTool === 'draw-hypothesis'`. */
  active: boolean;
}

export interface UseHypothesisDrawToolResult {
  state: DrawToolState;
  /** Pointer-down on a valid endpoint. */
  onPointerDown: (endpoint: ArrowEndpoint, at: Point) => void;
  /** Pointer-move during drag; pass current hover endpoint or null. */
  onPointerMove: (at: Point, hover: ArrowEndpoint | null) => void;
  /** Pointer-up; pass the endpoint under the pointer (or null if none). */
  onPointerUp: (endpoint: ArrowEndpoint | null, at: Point) => void;
  /** Browser pointercancel event. */
  onPointerCancel: () => void;
  /** User pressed Esc or otherwise aborted. */
  cancel: () => void;
  /** Popover commit/cancel calls reset() to return to idle. */
  reset: () => void;
}

function endpointsEqual(a: ArrowEndpoint, b: ArrowEndpoint): boolean {
  if (a.kind === 'step' && b.kind === 'step') return a.id === b.id;
  if (a.kind === 'column' && b.kind === 'column') {
    return a.name === b.name && a.hostStepId === b.hostStepId;
  }
  return false;
}

export function useHypothesisDrawTool(
  args: UseHypothesisDrawToolArgs
): UseHypothesisDrawToolResult {
  const [state, setState] = useState<DrawToolState>({ phase: 'idle' });
  const { active } = args;

  const onPointerDown = useCallback(
    (endpoint: ArrowEndpoint, at: Point) => {
      if (!active) return;
      setState({ phase: 'drawing', source: endpoint, cursorAt: at, hover: null });
    },
    [active]
  );

  const onPointerMove = useCallback(
    (at: Point, hover: ArrowEndpoint | null) => {
      if (!active) return;
      setState(prev => (prev.phase === 'drawing' ? { ...prev, cursorAt: at, hover } : prev));
    },
    [active]
  );

  const onPointerUp = useCallback(
    (endpoint: ArrowEndpoint | null, at: Point) => {
      if (!active) return;
      setState(prev => {
        if (prev.phase !== 'drawing') return prev;
        if (endpoint === null) return { phase: 'idle' };
        if (endpointsEqual(prev.source, endpoint)) return { phase: 'idle' };
        return { phase: 'awaitingForm', source: prev.source, target: endpoint, releaseAt: at };
      });
    },
    [active]
  );

  const onPointerCancel = useCallback(() => {
    if (!active) return;
    setState({ phase: 'idle' });
  }, [active]);

  const cancel = useCallback(() => {
    setState({ phase: 'idle' });
  }, []);

  const reset = useCallback(() => {
    setState({ phase: 'idle' });
  }, []);

  return { state, onPointerDown, onPointerMove, onPointerUp, onPointerCancel, cancel, reset };
}

/**
 * Resolves an endpoint to the `fromFactor` / `toFactor` string the
 * `CausalLink` schema requires.
 *
 * - Column endpoints: returns the column name directly.
 * - Step endpoints: looks up the step's metric column from the provided map.
 *   Returns `undefined` if the step has no metric column (gesture invalid).
 *
 * Pure function — no React hooks; the popover save handler calls it.
 */
export function resolveEndpointToFactor(
  endpoint: ArrowEndpoint,
  stepMetricColumns: Record<string, string | undefined>
): string | undefined {
  if (endpoint.kind === 'column') return endpoint.name;
  return stepMetricColumns[endpoint.id];
}
```

- [ ] **Step 4: Wire the export**

Edit `packages/hooks/src/index.ts` — add at the end of the file, alphabetically near other `useCanvas*` exports:

```ts
export {
  useHypothesisDrawTool,
  resolveEndpointToFactor,
  type ArrowEndpoint,
  type Point,
  type DrawToolState,
  type UseHypothesisDrawToolArgs,
  type UseHypothesisDrawToolResult,
} from './useHypothesisDrawTool';
```

- [ ] **Step 5: Run tests and verify they pass**

Run: `pnpm --filter @variscout/hooks test -- useHypothesisDrawTool`
Expected: 13 PASS (10 state-machine + 3 resolver tests).

Run also the full hooks test suite to confirm no regressions:
Run: `pnpm --filter @variscout/hooks test`
Expected: all green (note: `index.test.ts` may flake under concurrent Turbo per `packages/hooks/CLAUDE.md`; rerun standalone if it fails).

- [ ] **Step 6: Commit**

```bash
git add packages/hooks/src/useHypothesisDrawTool.ts \
        packages/hooks/src/__tests__/useHypothesisDrawTool.test.ts \
        packages/hooks/src/index.ts
git commit -m "feat(8d): add useHypothesisDrawTool state machine + endpoint resolver

State-machine hook driving the canvas hypothesis-arrow gesture. Pure
React state, no DOM dependency. Transitions: idle -> drawing -> awaitingForm
on pointerdown/move/up. Self-loop and no-target releases return to idle.
Esc and pointercancel always reset.

Pure helper resolveEndpointToFactor() narrows ArrowEndpoint to the
fromFactor/toFactor string CausalLink requires. Column endpoints return
the column name; step endpoints look up the step metric column from a
provided map (Risk #1 lock per spec).

Co-Authored-By: ruflo <ruv@ruv.net>"
```

---

## Task 2: Active tool field in `useSessionCanvasFilters` + auto-enable hypotheses overlay

**Files:**

- Modify: `packages/hooks/src/useSessionCanvasFilters.ts`
- Modify: `packages/hooks/src/__tests__/useSessionCanvasFilters.test.ts`

**Goal:** Add a session-scoped View-layer field tracking which canvas tool is active, plus an auto-effect: activating `'draw-hypothesis'` ensures the Hypotheses overlay is on (Q6 spec lock — drawing without seeing the result is a worse surprise than auto-enabling). Per Q7 spec lock, this state is View (resets on reload), not Annotation.

- [ ] **Step 1: Write the failing test**

Edit `packages/hooks/src/__tests__/useSessionCanvasFilters.test.ts` — add new `describe` block at the bottom:

```ts
describe('useSessionCanvasFilters — activeCanvasTool', () => {
  it('starts in select tool with empty active overlays', () => {
    const { result } = renderHook(() => useSessionCanvasFilters());
    expect(result.current.activeCanvasTool).toBe('select');
    expect(result.current.activeCanvasOverlays).toEqual([]);
  });

  it('setActiveCanvasTool to draw-hypothesis auto-enables the hypotheses overlay', () => {
    const { result } = renderHook(() => useSessionCanvasFilters());
    act(() => result.current.setActiveCanvasTool('draw-hypothesis'));
    expect(result.current.activeCanvasTool).toBe('draw-hypothesis');
    expect(result.current.activeCanvasOverlays).toContain('hypotheses');
  });

  it('setActiveCanvasTool to draw-hypothesis is idempotent on overlay (no duplicate)', () => {
    const { result } = renderHook(() => useSessionCanvasFilters());
    act(() => result.current.toggleCanvasOverlay('hypotheses'));
    expect(result.current.activeCanvasOverlays).toEqual(['hypotheses']);
    act(() => result.current.setActiveCanvasTool('draw-hypothesis'));
    expect(result.current.activeCanvasOverlays).toEqual(['hypotheses']);
  });

  it('setActiveCanvasTool back to select does NOT remove the overlay', () => {
    const { result } = renderHook(() => useSessionCanvasFilters());
    act(() => result.current.setActiveCanvasTool('draw-hypothesis'));
    expect(result.current.activeCanvasOverlays).toContain('hypotheses');
    act(() => result.current.setActiveCanvasTool('select'));
    expect(result.current.activeCanvasTool).toBe('select');
    expect(result.current.activeCanvasOverlays).toContain('hypotheses');
  });

  it('preserves other active overlays when activating draw-hypothesis', () => {
    const { result } = renderHook(() => useSessionCanvasFilters());
    act(() => result.current.toggleCanvasOverlay('investigations'));
    act(() => result.current.setActiveCanvasTool('draw-hypothesis'));
    expect(result.current.activeCanvasOverlays).toEqual(
      expect.arrayContaining(['investigations', 'hypotheses'])
    );
  });
});
```

Test imports at top of file should already include `renderHook`, `act`, and `useSessionCanvasFilters`. Add `it`/`expect`/`describe` from vitest if not already imported.

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @variscout/hooks test -- useSessionCanvasFilters`
Expected: FAIL — `result.current.activeCanvasTool` is undefined; `setActiveCanvasTool` does not exist.

- [ ] **Step 3: Extend the hook**

Edit `packages/hooks/src/useSessionCanvasFilters.ts`. Replace the existing module body with:

```ts
import { useState, useCallback } from 'react';
import type { ScopeFilter, TimelineWindow } from '@variscout/core';
import type { UseCanvasFiltersResult } from './useCanvasFilters';
import type { CanvasLensId } from './useCanvasStepCards';
import type { CanvasOverlayId } from './useCanvasInvestigationOverlays';

const DEFAULT_CUMULATIVE: TimelineWindow = { kind: 'cumulative' };

export type CanvasToolId = 'select' | 'draw-hypothesis';

export type UseSessionCanvasFiltersResult = UseCanvasFiltersResult & {
  activeCanvasLens: CanvasLensId;
  setActiveCanvasLens: (next: CanvasLensId) => void;
  activeCanvasOverlays: CanvasOverlayId[];
  setActiveCanvasOverlays: (next: CanvasOverlayId[]) => void;
  toggleCanvasOverlay: (overlay: CanvasOverlayId) => void;
  activeCanvasTool: CanvasToolId;
  setActiveCanvasTool: (next: CanvasToolId) => void;
};

export function useSessionCanvasFilters(): UseSessionCanvasFiltersResult {
  const [timelineWindow, setTimelineWindow] = useState<TimelineWindow>(DEFAULT_CUMULATIVE);
  const [scopeFilter, setScopeFilter] = useState<ScopeFilter | undefined>(undefined);
  const [paretoGroupBy, setParetoGroupBy] = useState<string | undefined>(undefined);
  const [activeCanvasLens, setActiveCanvasLens] = useState<CanvasLensId>('default');
  const [activeCanvasOverlays, setActiveCanvasOverlays] = useState<CanvasOverlayId[]>([]);
  const [activeCanvasTool, setActiveCanvasToolState] = useState<CanvasToolId>('select');

  const toggleCanvasOverlay = useCallback((overlay: CanvasOverlayId): void => {
    setActiveCanvasOverlays(current =>
      current.includes(overlay) ? current.filter(id => id !== overlay) : [...current, overlay]
    );
  }, []);

  // Activating draw-hypothesis auto-enables the hypotheses overlay so the
  // user sees the resulting arrow. Deactivating does not remove the overlay
  // (the user toggled it on for a reason; let them turn it off explicitly).
  const setActiveCanvasTool = useCallback((next: CanvasToolId): void => {
    setActiveCanvasToolState(next);
    if (next === 'draw-hypothesis') {
      setActiveCanvasOverlays(current =>
        current.includes('hypotheses') ? current : [...current, 'hypotheses']
      );
    }
  }, []);

  return {
    timelineWindow,
    setTimelineWindow,
    scopeFilter,
    setScopeFilter,
    paretoGroupBy,
    setParetoGroupBy,
    activeCanvasLens,
    setActiveCanvasLens,
    activeCanvasOverlays,
    setActiveCanvasOverlays,
    toggleCanvasOverlay,
    activeCanvasTool,
    setActiveCanvasTool,
  };
}
```

Note: the existing test file has tests for the prior surface (timelineWindow / scopeFilter / overlays). They MUST keep passing — only the new fields are added.

- [ ] **Step 4: Run tests and verify they pass**

Run: `pnpm --filter @variscout/hooks test -- useSessionCanvasFilters`
Expected: all existing + 5 new tests PASS.

Run: `pnpm --filter @variscout/hooks test`
Expected: full suite green.

- [ ] **Step 5: Commit**

```bash
git add packages/hooks/src/useSessionCanvasFilters.ts \
        packages/hooks/src/__tests__/useSessionCanvasFilters.test.ts
git commit -m "feat(8d): add activeCanvasTool to useSessionCanvasFilters

New View-layer field tracking which canvas tool is active
('select' | 'draw-hypothesis'). Per spec Q7, this is session-scoped
View state — resets on reload, matching Figma/tldraw/Excalidraw
convention.

Activating 'draw-hypothesis' auto-enables the Hypotheses overlay
(spec Q6 lock — prevents the user drawing an invisible arrow).
Deactivating does NOT auto-disable the overlay.

Co-Authored-By: ruflo <ruv@ruv.net>"
```

---

## Task 3: `HypothesisDrawToolButton` component

**Files:**

- Create: `packages/ui/src/components/Canvas/internal/HypothesisDrawToolButton.tsx`
- Create: `packages/ui/src/components/Canvas/internal/__tests__/HypothesisDrawToolButton.test.tsx`

**Goal:** Self-contained icon button. Pressed visual when active. Click toggles the tool between `'select'` and `'draw-hypothesis'`. ARIA `aria-pressed` reflects active state. Disabled when `disabled` prop is true (force-read-only views).

- [ ] **Step 1: Write the failing test**

Create `packages/ui/src/components/Canvas/internal/__tests__/HypothesisDrawToolButton.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { HypothesisDrawToolButton } from '../HypothesisDrawToolButton';

describe('HypothesisDrawToolButton', () => {
  it('renders with aria-pressed=false when active tool is select', () => {
    render(<HypothesisDrawToolButton activeTool="select" onChange={() => {}} />);
    const button = screen.getByRole('button', { name: /draw hypothesis/i });
    expect(button).toHaveAttribute('aria-pressed', 'false');
  });

  it('renders with aria-pressed=true when active tool is draw-hypothesis', () => {
    render(<HypothesisDrawToolButton activeTool="draw-hypothesis" onChange={() => {}} />);
    const button = screen.getByRole('button', { name: /draw hypothesis/i });
    expect(button).toHaveAttribute('aria-pressed', 'true');
  });

  it('clicking from select calls onChange with draw-hypothesis', () => {
    const onChange = vi.fn();
    render(<HypothesisDrawToolButton activeTool="select" onChange={onChange} />);
    fireEvent.click(screen.getByRole('button', { name: /draw hypothesis/i }));
    expect(onChange).toHaveBeenCalledWith('draw-hypothesis');
  });

  it('clicking while active calls onChange with select (toggle off)', () => {
    const onChange = vi.fn();
    render(<HypothesisDrawToolButton activeTool="draw-hypothesis" onChange={onChange} />);
    fireEvent.click(screen.getByRole('button', { name: /draw hypothesis/i }));
    expect(onChange).toHaveBeenCalledWith('select');
  });

  it('does not call onChange when disabled', () => {
    const onChange = vi.fn();
    render(<HypothesisDrawToolButton activeTool="select" onChange={onChange} disabled />);
    fireEvent.click(screen.getByRole('button', { name: /draw hypothesis/i }));
    expect(onChange).not.toHaveBeenCalled();
  });

  it('exposes data-testid for E2E selectors', () => {
    render(<HypothesisDrawToolButton activeTool="select" onChange={() => {}} />);
    expect(screen.getByTestId('hypothesis-draw-tool-button')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @variscout/ui test -- HypothesisDrawToolButton`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement the component**

Create `packages/ui/src/components/Canvas/internal/HypothesisDrawToolButton.tsx`:

```tsx
import { Spline } from 'lucide-react';
import type { CanvasToolId } from '@variscout/hooks';

export interface HypothesisDrawToolButtonProps {
  activeTool: CanvasToolId;
  onChange: (next: CanvasToolId) => void;
  disabled?: boolean;
}

export function HypothesisDrawToolButton({
  activeTool,
  onChange,
  disabled,
}: HypothesisDrawToolButtonProps) {
  const isActive = activeTool === 'draw-hypothesis';
  const next: CanvasToolId = isActive ? 'select' : 'draw-hypothesis';

  return (
    <button
      type="button"
      aria-label="Draw hypothesis"
      aria-pressed={isActive}
      title={isActive ? 'Exit hypothesis-draw mode' : 'Draw a hypothesis arrow'}
      disabled={disabled}
      data-testid="hypothesis-draw-tool-button"
      onClick={() => onChange(next)}
      className={[
        'inline-flex h-8 w-8 items-center justify-center rounded-md border transition-colors',
        isActive
          ? 'border-status-info bg-status-info-soft text-status-info'
          : 'border-edge bg-surface-primary text-content-secondary hover:bg-surface-tertiary hover:text-content',
        'disabled:cursor-not-allowed disabled:opacity-40',
      ].join(' ')}
    >
      <Spline aria-hidden="true" size={16} />
    </button>
  );
}
```

NOTE: if `Spline` is not exported by the installed `lucide-react` version (per `packages/ui/package.json` peer dep), replace with `MoveDiagonal` or `Slash`. Verify by running `pnpm --filter @variscout/ui exec tsc --noEmit` after the import — the error message will be unambiguous. Lock the substitution in this same task.

- [ ] **Step 4: Run tests and verify they pass**

Run: `pnpm --filter @variscout/ui test -- HypothesisDrawToolButton`
Expected: 6 PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/ui/src/components/Canvas/internal/HypothesisDrawToolButton.tsx \
        packages/ui/src/components/Canvas/internal/__tests__/HypothesisDrawToolButton.test.tsx
git commit -m "feat(8d): add HypothesisDrawToolButton chrome component

Top-level canvas tool button per spec Q6. Mode-agnostic; visible in
both author and read modes; pressed visual reflects activeTool;
ARIA aria-pressed for screen readers; disabled prop for
force-read-only contexts.

Co-Authored-By: ruflo <ruv@ruv.net>"
```

---

## Task 4: `HypothesisDraftPopover` component (form + hand-rolled positioning)

**Files:**

- Create: `packages/ui/src/components/Canvas/internal/HypothesisDraftPopover.tsx`
- Create: `packages/ui/src/components/Canvas/internal/__tests__/HypothesisDraftPopover.test.tsx`

**Goal:** Floating form anchored at the gesture-release point. Hand-rolled positioning consistent with existing `YAxisPopover` / `RiskPopover` patterns (Risk #5 lock — no new dep). Focus-trap via existing `focus-trap-react`. Save commits via callback; Cancel/Esc dismisses without state change.

- [ ] **Step 1: Write the failing test**

Create `packages/ui/src/components/Canvas/internal/__tests__/HypothesisDraftPopover.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { HypothesisDraftPopover } from '../HypothesisDraftPopover';

const baseProps = {
  sourceLabel: 'pressure_psi',
  targetLabel: 'yield',
  releaseAt: { x: 100, y: 200 },
  questions: [],
  onSave: () => {},
  onCancel: () => {},
};

describe('HypothesisDraftPopover', () => {
  it('renders subject and object as read-only', () => {
    render(<HypothesisDraftPopover {...baseProps} />);
    expect(screen.getByText(/pressure_psi/)).toBeInTheDocument();
    expect(screen.getByText(/yield/)).toBeInTheDocument();
  });

  it('Save passes the typed because-statement and selected questionId', () => {
    const onSave = vi.fn();
    const questions = [{ id: 'q1', text: 'Why does yield drop?' }];
    render(<HypothesisDraftPopover {...baseProps} questions={questions} onSave={onSave} />);
    fireEvent.change(screen.getByLabelText(/because/i), {
      target: { value: 'thermal drift in the chamber' },
    });
    fireEvent.change(screen.getByLabelText(/link to question/i), { target: { value: 'q1' } });
    fireEvent.click(screen.getByRole('button', { name: /save/i }));
    expect(onSave).toHaveBeenCalledWith({
      whyStatement: 'thermal drift in the chamber',
      questionId: 'q1',
    });
  });

  it('Save with no question link passes questionId undefined', () => {
    const onSave = vi.fn();
    render(<HypothesisDraftPopover {...baseProps} onSave={onSave} />);
    fireEvent.change(screen.getByLabelText(/because/i), { target: { value: 'shift change' } });
    fireEvent.click(screen.getByRole('button', { name: /save/i }));
    expect(onSave).toHaveBeenCalledWith({
      whyStatement: 'shift change',
      questionId: undefined,
    });
  });

  it('Save is disabled when because-statement is empty or whitespace-only', () => {
    render(<HypothesisDraftPopover {...baseProps} />);
    expect(screen.getByRole('button', { name: /save/i })).toBeDisabled();
    fireEvent.change(screen.getByLabelText(/because/i), { target: { value: '   ' } });
    expect(screen.getByRole('button', { name: /save/i })).toBeDisabled();
    fireEvent.change(screen.getByLabelText(/because/i), { target: { value: 'real text' } });
    expect(screen.getByRole('button', { name: /save/i })).not.toBeDisabled();
  });

  it('Cancel button calls onCancel', () => {
    const onCancel = vi.fn();
    render(<HypothesisDraftPopover {...baseProps} onCancel={onCancel} />);
    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
    expect(onCancel).toHaveBeenCalledOnce();
  });

  it('Esc keypress calls onCancel', () => {
    const onCancel = vi.fn();
    render(<HypothesisDraftPopover {...baseProps} onCancel={onCancel} />);
    fireEvent.keyDown(screen.getByTestId('hypothesis-draft-popover'), { key: 'Escape' });
    expect(onCancel).toHaveBeenCalledOnce();
  });

  it('positions itself relative to the release point', () => {
    render(<HypothesisDraftPopover {...baseProps} releaseAt={{ x: 250, y: 350 }} />);
    const container = screen.getByTestId('hypothesis-draft-popover');
    // Hand-rolled positioning: popover is absolutely positioned with
    // top/left derived from releaseAt. We assert the inline style includes
    // the coords (allowing for offset adjustments).
    expect(container.style.left).toMatch(/^\d+(\.\d+)?px$/);
    expect(container.style.top).toMatch(/^\d+(\.\d+)?px$/);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @variscout/ui test -- HypothesisDraftPopover`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement the component**

Create `packages/ui/src/components/Canvas/internal/HypothesisDraftPopover.tsx`:

```tsx
import React from 'react';
import FocusTrap from 'focus-trap-react';
import type { Point } from '@variscout/hooks';

const POPOVER_WIDTH = 320;
const POPOVER_OFFSET_Y = 12;

export interface HypothesisDraftPayload {
  whyStatement: string;
  questionId: string | undefined;
}

export interface HypothesisDraftPopoverProps {
  sourceLabel: string;
  targetLabel: string;
  releaseAt: Point;
  questions: ReadonlyArray<{ id: string; text: string }>;
  onSave: (payload: HypothesisDraftPayload) => void;
  onCancel: () => void;
}

/** Hand-rolled positioning: clamp to viewport, prefer below the release point. */
function computePosition(releaseAt: Point): { top: number; left: number } {
  if (typeof window === 'undefined') {
    return { top: releaseAt.y, left: releaseAt.x };
  }
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  let left = releaseAt.x - POPOVER_WIDTH / 2;
  let top = releaseAt.y + POPOVER_OFFSET_Y;

  // Clamp horizontally
  if (left < 8) left = 8;
  if (left + POPOVER_WIDTH > viewportWidth - 8) left = viewportWidth - POPOVER_WIDTH - 8;

  // Flip above the release point if it would overflow below
  // (estimate popover height ~280px for the form)
  const estimatedHeight = 280;
  if (top + estimatedHeight > viewportHeight - 8) {
    top = Math.max(8, releaseAt.y - estimatedHeight - POPOVER_OFFSET_Y);
  }

  return { top, left };
}

export function HypothesisDraftPopover({
  sourceLabel,
  targetLabel,
  releaseAt,
  questions,
  onSave,
  onCancel,
}: HypothesisDraftPopoverProps) {
  const [whyStatement, setWhyStatement] = React.useState('');
  const [questionId, setQuestionId] = React.useState<string>('');
  const { top, left } = computePosition(releaseAt);

  const trimmed = whyStatement.trim();
  const canSave = trimmed.length > 0;

  const handleSave = (): void => {
    if (!canSave) return;
    onSave({
      whyStatement: trimmed,
      questionId: questionId === '' ? undefined : questionId,
    });
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>): void => {
    if (event.key === 'Escape') {
      event.stopPropagation();
      onCancel();
    }
  };

  return (
    <FocusTrap focusTrapOptions={{ allowOutsideClick: true, escapeDeactivates: false }}>
      <div
        role="dialog"
        aria-labelledby="hypothesis-draft-popover-title"
        data-testid="hypothesis-draft-popover"
        onKeyDown={handleKeyDown}
        style={{ position: 'fixed', top, left, width: POPOVER_WIDTH, zIndex: 50 }}
        className="rounded-md border border-edge bg-surface-primary p-3 shadow-lg"
      >
        <h3 id="hypothesis-draft-popover-title" className="mb-2 text-sm font-semibold text-content">
          New hypothesis
        </h3>
        <p className="mb-3 text-sm text-content-secondary">
          I suspect <span className="font-mono text-content">{sourceLabel}</span> affects{' '}
          <span className="font-mono text-content">{targetLabel}</span>
        </p>
        <label className="mb-3 block text-xs text-content-secondary">
          <span className="mb-1 block font-medium">because…</span>
          <textarea
            className="w-full rounded border border-edge bg-surface-primary p-2 text-sm text-content"
            rows={3}
            maxLength={280}
            value={whyStatement}
            onChange={event => setWhyStatement(event.target.value)}
            autoFocus
            aria-label="because"
          />
        </label>
        {questions.length > 0 ? (
          <label className="mb-3 block text-xs text-content-secondary">
            <span className="mb-1 block font-medium">Link to question (optional)</span>
            <select
              className="w-full rounded border border-edge bg-surface-primary p-2 text-sm text-content"
              value={questionId}
              onChange={event => setQuestionId(event.target.value)}
              aria-label="Link to question"
            >
              <option value="">No question link</option>
              {questions.map(question => (
                <option key={question.id} value={question.id}>
                  {question.text}
                </option>
              ))}
            </select>
          </label>
        ) : null}
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded border border-edge bg-surface-primary px-2 py-1 text-xs text-content-secondary hover:bg-surface-tertiary hover:text-content"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!canSave}
            className="rounded border border-status-info bg-status-info-soft px-2 py-1 text-xs font-medium text-status-info hover:bg-status-info disabled:cursor-not-allowed disabled:opacity-50"
          >
            Save
          </button>
        </div>
      </div>
    </FocusTrap>
  );
}
```

- [ ] **Step 4: Run tests and verify they pass**

Run: `pnpm --filter @variscout/ui test -- HypothesisDraftPopover`
Expected: 7 PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/ui/src/components/Canvas/internal/HypothesisDraftPopover.tsx \
        packages/ui/src/components/Canvas/internal/__tests__/HypothesisDraftPopover.test.tsx
git commit -m "feat(8d): add HypothesisDraftPopover form component

Floating popover anchored at gesture release point per spec Q4.
Hand-rolled positioning per Risk #5 lock (no new dep). focus-trap-react
for focus management (existing dep). Save disabled until non-empty
whyStatement; questionId optional. Esc dismisses via onCancel.

Co-Authored-By: ruflo <ruv@ruv.net>"
```

---

## Task 5: `StepNodeMarker` component (promoted-hypothesis pip)

**Files:**

- Create: `packages/ui/src/components/Canvas/internal/StepNodeMarker.tsx`
- Create: `packages/ui/src/components/Canvas/internal/__tests__/StepNodeMarker.test.tsx`

**Goal:** Element-anchored pip per Q3 spec lock + Risk #6 (Lucide `Flag` + status color). Replaces Codex's inline count badge in `CanvasStepCard`. Glance-readable; click → triggers `onClick` callback (drilldown opens with focus on suspected-causes section). Hover tooltip lists the hub names.

- [ ] **Step 1: Write the failing test**

Create `packages/ui/src/components/Canvas/internal/__tests__/StepNodeMarker.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { StepNodeMarker } from '../StepNodeMarker';

const suspectedHub = {
  id: 'hub-1',
  name: 'Chamber 3 thermal drift',
  status: 'suspected' as const,
};

const confirmedHub = {
  id: 'hub-2',
  name: 'Shift change effect',
  status: 'confirmed' as const,
};

describe('StepNodeMarker', () => {
  it('renders nothing when hubs is empty', () => {
    const { container } = render(<StepNodeMarker hubs={[]} onClick={() => {}} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders one marker with count when hubs has 1', () => {
    render(<StepNodeMarker hubs={[suspectedHub]} onClick={() => {}} />);
    const marker = screen.getByTestId('step-node-marker');
    expect(marker).toBeInTheDocument();
    expect(marker).toHaveTextContent('1');
  });

  it('renders count when hubs has multiple', () => {
    render(<StepNodeMarker hubs={[suspectedHub, confirmedHub]} onClick={() => {}} />);
    expect(screen.getByTestId('step-node-marker')).toHaveTextContent('2');
  });

  it('uses status-warning style when any hub is suspected', () => {
    render(<StepNodeMarker hubs={[suspectedHub]} onClick={() => {}} />);
    const marker = screen.getByTestId('step-node-marker');
    expect(marker.className).toMatch(/status-warning/);
  });

  it('uses status-info style when all hubs are confirmed', () => {
    render(<StepNodeMarker hubs={[confirmedHub]} onClick={() => {}} />);
    const marker = screen.getByTestId('step-node-marker');
    expect(marker.className).toMatch(/status-info/);
  });

  it('exposes hub names via aria-label for tooltip semantics', () => {
    render(<StepNodeMarker hubs={[suspectedHub, confirmedHub]} onClick={() => {}} />);
    const marker = screen.getByTestId('step-node-marker');
    expect(marker).toHaveAttribute(
      'aria-label',
      expect.stringContaining('Chamber 3 thermal drift')
    );
    expect(marker).toHaveAttribute('aria-label', expect.stringContaining('Shift change effect'));
  });

  it('clicking calls onClick', () => {
    const onClick = vi.fn();
    render(<StepNodeMarker hubs={[suspectedHub]} onClick={onClick} />);
    fireEvent.click(screen.getByTestId('step-node-marker'));
    expect(onClick).toHaveBeenCalledOnce();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @variscout/ui test -- StepNodeMarker`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement the component**

Create `packages/ui/src/components/Canvas/internal/StepNodeMarker.tsx`:

```tsx
import { Flag } from 'lucide-react';
import type { SuspectedCause } from '@variscout/core';

export interface StepNodeMarkerHub {
  id: string;
  name: string;
  status: SuspectedCause['status'];
}

export interface StepNodeMarkerProps {
  hubs: ReadonlyArray<StepNodeMarkerHub>;
  onClick: () => void;
}

/**
 * Promoted-hypothesis node marker pip. Replaces Codex's inline count badge
 * per spec Q3 — element-anchored glyph on card chrome, separate primitive
 * from in-content badges. Glance-readable; click drills into the step
 * overlay's suspected-causes section.
 */
export function StepNodeMarker({ hubs, onClick }: StepNodeMarkerProps) {
  if (hubs.length === 0) return null;

  // Worst-status determines color: suspected (warning) > confirmed (info).
  const anySuspected = hubs.some(hub => hub.status === 'suspected');
  const colorClasses = anySuspected
    ? 'border-status-warning bg-status-warning-soft text-status-warning'
    : 'border-status-info bg-status-info-soft text-status-info';

  const tooltip = hubs.map(hub => hub.name).join(', ');

  return (
    <button
      type="button"
      data-testid="step-node-marker"
      aria-label={`${hubs.length} promoted ${hubs.length === 1 ? 'hypothesis' : 'hypotheses'}: ${tooltip}`}
      title={tooltip}
      onClick={event => {
        event.stopPropagation();
        onClick();
      }}
      className={[
        'inline-flex h-5 items-center gap-1 rounded-full border px-1.5 text-[11px] font-medium',
        colorClasses,
      ].join(' ')}
    >
      <Flag aria-hidden="true" size={10} />
      <span>{hubs.length}</span>
    </button>
  );
}
```

- [ ] **Step 4: Run tests and verify they pass**

Run: `pnpm --filter @variscout/ui test -- StepNodeMarker`
Expected: 7 PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/ui/src/components/Canvas/internal/StepNodeMarker.tsx \
        packages/ui/src/components/Canvas/internal/__tests__/StepNodeMarker.test.tsx
git commit -m "feat(8d): add StepNodeMarker promoted-hypothesis pip

Element-anchored marker pip per spec Q3 + Risk #6. Lucide Flag icon
with status-warning soft color for suspected hubs, status-info for
confirmed-only. Glance-readable affordance separate from in-content
badges. Click drills into the step overlay suspected-causes section
via the onClick callback.

Co-Authored-By: ruflo <ruv@ruv.net>"
```

---

## Task 6: `CanvasStepCard` updates — replace badge, add `data-arrow-endpoint`, gate click during draw

**Files:**

- Modify: `packages/ui/src/components/Canvas/internal/CanvasStepCard.tsx`
- Modify or Create: `packages/ui/src/components/Canvas/internal/__tests__/CanvasStepCard.test.tsx`

**Goal:** Three changes:

1. Replace the inline `{N} cause` count badge (current implementation per Codex) with `<StepNodeMarker>` rendered on card chrome.
2. Add `data-arrow-endpoint="step:<stepId>"` to the card root `<div>` and `data-arrow-endpoint="column:<name>"` to each rendered column chip pill (the existing `assignedColumns.slice(0, 3).map(...)` block).
3. Add a new prop `activeCanvasTool: CanvasToolId`. When `'draw-hypothesis'`, the card's onClick handler returns early (drilldown disabled while drawing). When `'select'`, behavior is unchanged.

- [ ] **Step 1: Read the current file**

Open `packages/ui/src/components/Canvas/internal/CanvasStepCard.tsx`. Locate (these line numbers may shift):

- Line ~57–58: `showSuspectedCauses` derived from `activeOverlays.includes('suspected-causes') && investigationOverlay?.suspectedCauses.length`
- Line ~118–126 (approximately): the inline count badge JSX rendering `{N} cause`. The exact JSX:
  ```tsx
  {
    showSuspectedCauses ? (
      <span className="…">{investigationOverlay?.suspectedCauses.length} cause</span>
    ) : null;
  }
  ```
  (Locate via `grep -n showSuspectedCauses` — the exact wrapper may use different whitespace.)
- Line ~141–148: `card.assignedColumns.slice(0, 3).map(column => <span ...>{column}</span>)` — the column chip pills.
- Line ~76: `onClick={event => onOpen(card.stepId, event.currentTarget)}` — the drilldown trigger.

- [ ] **Step 2: Add or extend the test file**

If `__tests__/CanvasStepCard.test.tsx` does not exist, create it. Otherwise append. New cases:

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CanvasStepCard } from '../CanvasStepCard';
import type { CanvasStepCardModel, CanvasStepInvestigationOverlay } from '@variscout/hooks';

const baseCard: CanvasStepCardModel = {
  stepId: 'step-1',
  stepName: 'Chamber 3',
  parentName: undefined,
  metricColumn: 'pressure_psi',
  assignedColumns: ['pressure_psi', 'temp_c'],
  capability: { state: 'no-specs', n: 0, cpk: undefined, grade: undefined },
  stats: undefined,
  drift: undefined,
  defectCount: undefined,
};

const overlayWithPromoted: CanvasStepInvestigationOverlay = {
  stepId: 'step-1',
  questions: [],
  findings: [],
  suspectedCauses: [
    {
      id: 'hub-1',
      name: 'Thermal drift',
      status: 'suspected',
      questionId: undefined,
      focus: { kind: 'suspected-cause', id: 'hub-1' },
    },
  ],
  causalLinks: [],
  investigationCounts: { open: 0, supported: 0, refuted: 0 },
};

describe('CanvasStepCard — 8d additions', () => {
  it('renders StepNodeMarker (NOT inline count badge) when overlay shows suspected-causes', () => {
    render(
      <CanvasStepCard
        card={baseCard}
        activeLens="default"
        activeOverlays={['suspected-causes']}
        investigationOverlay={overlayWithPromoted}
        activeCanvasTool="select"
        onOpen={() => {}}
      />
    );
    expect(screen.getByTestId('step-node-marker')).toBeInTheDocument();
    // The legacy inline badge said "{N} cause" — the marker uses Flag + count.
    expect(screen.queryByText(/^1 cause$/)).not.toBeInTheDocument();
  });

  it('exposes data-arrow-endpoint="step:<id>" on the card root', () => {
    render(
      <CanvasStepCard
        card={baseCard}
        activeLens="default"
        activeCanvasTool="select"
        onOpen={() => {}}
      />
    );
    const card = screen.getByTestId('canvas-step-card-step-1');
    expect(card).toHaveAttribute('data-arrow-endpoint', 'step:step-1');
  });

  it('exposes data-arrow-endpoint="column:<name>" on each column chip pill', () => {
    render(
      <CanvasStepCard
        card={baseCard}
        activeLens="default"
        activeCanvasTool="select"
        onOpen={() => {}}
      />
    );
    const pressureChip = screen.getByText('pressure_psi');
    expect(pressureChip).toHaveAttribute('data-arrow-endpoint', 'column:pressure_psi');
    const tempChip = screen.getByText('temp_c');
    expect(tempChip).toHaveAttribute('data-arrow-endpoint', 'column:temp_c');
  });

  it('clicking the card calls onOpen when activeCanvasTool=select', () => {
    const onOpen = vi.fn();
    render(
      <CanvasStepCard
        card={baseCard}
        activeLens="default"
        activeCanvasTool="select"
        onOpen={onOpen}
      />
    );
    fireEvent.click(screen.getByTestId('canvas-step-card-step-1'));
    expect(onOpen).toHaveBeenCalled();
  });

  it('clicking the card is a no-op when activeCanvasTool=draw-hypothesis', () => {
    const onOpen = vi.fn();
    render(
      <CanvasStepCard
        card={baseCard}
        activeLens="default"
        activeCanvasTool="draw-hypothesis"
        onOpen={onOpen}
      />
    );
    fireEvent.click(screen.getByTestId('canvas-step-card-step-1'));
    expect(onOpen).not.toHaveBeenCalled();
  });

  it('clicking StepNodeMarker calls onOpen (drilldown) and stops propagation', () => {
    const onOpen = vi.fn();
    render(
      <CanvasStepCard
        card={baseCard}
        activeLens="default"
        activeOverlays={['suspected-causes']}
        investigationOverlay={overlayWithPromoted}
        activeCanvasTool="select"
        onOpen={onOpen}
      />
    );
    fireEvent.click(screen.getByTestId('step-node-marker'));
    expect(onOpen).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Step 3: Run test to verify failures**

Run: `pnpm --filter @variscout/ui test -- CanvasStepCard`
Expected: FAIL — `activeCanvasTool` prop unknown; no `data-arrow-endpoint`; legacy badge present; no marker.

- [ ] **Step 4: Update the component**

Edit `packages/ui/src/components/Canvas/internal/CanvasStepCard.tsx`:

1. Update imports — add `StepNodeMarker` and `CanvasToolId`:

   ```tsx
   import { StepNodeMarker } from './StepNodeMarker';
   import type { CanvasToolId } from '@variscout/hooks';
   ```

2. Update the `CanvasStepCardProps` interface — add the new prop:

   ```tsx
   interface CanvasStepCardProps {
     card: CanvasStepCardModel;
     activeLens: CanvasLensId;
     activeOverlays?: CanvasOverlayId[];
     investigationOverlay?: CanvasStepInvestigationOverlay;
     activeCanvasTool: CanvasToolId;
     onOpen: (stepId: string, element: HTMLElement) => void;
     onStepSpecsRequest?: (column: string, stepId: string) => void;
     registerCardElement?: (stepId: string, element: HTMLElement | null) => void;
   }
   ```

3. Update the destructuring in the function body to include `activeCanvasTool`.

4. Update the card root `<div>`:
   - Add `data-arrow-endpoint={`step:${card.stepId}`}`
   - Change onClick to gate on `activeCanvasTool`:

     ```tsx
     onClick={event => {
       if (activeCanvasTool === 'draw-hypothesis') return;
       onOpen(card.stepId, event.currentTarget);
     }}
     ```

   - Same gating on the `onKeyDown` handler — when Enter/Space and `activeCanvasTool === 'draw-hypothesis'`, return early.

5. Replace the inline suspected-causes badge JSX. Find:

   ```tsx
   {
     showSuspectedCauses ? (
       <span className="…">{investigationOverlay?.suspectedCauses.length} cause</span>
     ) : null;
   }
   ```

   Replace with:

   ```tsx
   {showSuspectedCauses ? (
     <StepNodeMarker
       hubs={(investigationOverlay?.suspectedCauses ?? []).map(item => ({
         id: item.id,
         name: item.name,
         status: item.status,
       }))}
       onClick={() => onOpen(card.stepId, /* the card itself */ /* see note */ ... )}
     />
   ) : null}
   ```

   The `onOpen` requires the card root element. To preserve the existing API, pull a `ref` to the card root and pass it from the marker click. Cleanest: extract the card root to a ref:

   ```tsx
   const rootRef = React.useRef<HTMLDivElement | null>(null);
   ```

   Wire `ref={element => { rootRef.current = element; registerCardElement?.(card.stepId, element); }}` on the card root. Then:

   ```tsx
   onClick={() => {
     if (rootRef.current) onOpen(card.stepId, rootRef.current);
   }}
   ```

6. Update the column chip rendering. Find:

   ```tsx
   {
     card.assignedColumns.slice(0, 3).map(column => (
       <span
         key={column}
         className="rounded-full bg-surface-secondary px-2 py-0.5 text-[11px] text-content-secondary"
       >
         {column}
       </span>
     ));
   }
   ```

   Update to:

   ```tsx
   {
     card.assignedColumns.slice(0, 3).map(column => (
       <span
         key={column}
         data-arrow-endpoint={`column:${column}`}
         className="rounded-full bg-surface-secondary px-2 py-0.5 text-[11px] text-content-secondary"
       >
         {column}
       </span>
     ));
   }
   ```

- [ ] **Step 5: Run tests and verify they pass**

Run: `pnpm --filter @variscout/ui test -- CanvasStepCard`
Expected: all PASS (existing tests + 6 new).

Run: `pnpm --filter @variscout/ui test -- Canvas`
Expected: all Canvas-namespace tests pass (e.g., CanvasStepOverlay test still green).

- [ ] **Step 6: Commit**

```bash
git add packages/ui/src/components/Canvas/internal/CanvasStepCard.tsx \
        packages/ui/src/components/Canvas/internal/__tests__/CanvasStepCard.test.tsx
git commit -m "feat(8d): wire StepNodeMarker + arrow endpoints into CanvasStepCard

- Replace inline {N} cause badge with StepNodeMarker pip on chrome
  per spec Q3 (Codex's deviation fixed at this seam per
  feedback_fix_absorbed_violations_at_seam).
- Add data-arrow-endpoint='step:<id>' on card root and
  data-arrow-endpoint='column:<name>' on each column chip pill — the
  hit-test surface for useHypothesisDrawTool.
- Gate the card's onClick/onKeyDown drilldown when activeCanvasTool is
  'draw-hypothesis' so the gesture wins over drilldown during draw mode.

Co-Authored-By: ruflo <ruv@ruv.net>"
```

---

## Task 7: Canvas chrome integration (button + pointer handlers + rubber-band SVG + state-machine wiring)

**Files:**

- Modify: `packages/ui/src/components/Canvas/index.tsx`
- Modify: `packages/ui/src/components/Canvas/CanvasWorkspace.tsx`
- Modify: `packages/ui/src/components/Canvas/__tests__/Canvas.test.tsx` (or `CanvasWorkspace.test.tsx`)

**Goal:** Compose the gesture end-to-end on the canvas surface. Three concerns:

1. Place `<HypothesisDrawToolButton>` in the chrome row, between `<CanvasOverlayPicker>` and `<CanvasModeToggle>`.
2. On the canvas card surface (`section[data-testid="canvas-card-surface"]`), attach pointerdown / pointermove / pointerup / pointercancel handlers that drive the state machine via `useHypothesisDrawTool`. Use `document.elementFromPoint` (walked up) to find the nearest `[data-arrow-endpoint]` ancestor at hit-test moments.
3. Render an SVG rubber-band line during the `'drawing'` phase. Render the `HypothesisDraftPopover` during the `'awaitingForm'` phase; on save, call `investigationStore.addCausalLink(...)` and `setActiveCanvasTool('select')` (Risk #2 lock — return to select after Save).

This task is the integration spine; it threads through `Canvas/index.tsx` to `CanvasWorkspace.tsx`. Read both files first to understand the prop shape.

- [ ] **Step 1: Read the current Canvas/index.tsx (specifically lines 320–411 — the chrome bar + canvas surface)**

Get the current chrome layout (the bar at line 332–354) and the SVG arrow rendering (line 368–390).

- [ ] **Step 2: Read CanvasWorkspace.tsx — find where activeCanvasOverlays is sourced and how onOverlayToggle flows down**

Specifically lines 235–248 (the `useSessionCanvasFilters` destructure) and line 458–459 (the props passed to `<Canvas>`).

- [ ] **Step 3: Write the integration test**

Edit `packages/ui/src/components/Canvas/__tests__/CanvasWorkspace.test.tsx` — add a new describe block (test fixture data may need adapting to existing fixtures; mirror the pattern used by other tests in the file):

```tsx
describe('CanvasWorkspace — hypothesis-arrow drawing (8d)', () => {
  it('renders the HypothesisDrawToolButton in the chrome', () => {
    render(<CanvasWorkspace {...minimalProps} />);
    expect(screen.getByTestId('hypothesis-draw-tool-button')).toBeInTheDocument();
  });

  it('clicking the tool button enters draw mode and auto-enables the hypotheses overlay', () => {
    render(<CanvasWorkspace {...minimalProps} />);
    fireEvent.click(screen.getByTestId('hypothesis-draw-tool-button'));
    expect(screen.getByTestId('hypothesis-draw-tool-button')).toHaveAttribute(
      'aria-pressed',
      'true'
    );
    // Hypotheses overlay button reflects pressed state too
    const hypothesesToggle = screen.getByRole('button', { name: /Hypotheses overlay/i });
    expect(hypothesesToggle).toHaveAttribute('aria-pressed', 'true');
  });

  it('drawing flow: pointerdown on step-a, pointerup on step-b, fill form, Save commits CausalLink', () => {
    const investigationStore = useInvestigationStore.getState();
    const initialLinkCount = investigationStore.causalLinks.length;

    render(<CanvasWorkspace {...minimalPropsWithStepsAandB} />);
    fireEvent.click(screen.getByTestId('hypothesis-draw-tool-button'));

    const stepA = screen.getByTestId('canvas-step-card-step-a');
    const stepB = screen.getByTestId('canvas-step-card-step-b');

    fireEvent.pointerDown(stepA, { clientX: 10, clientY: 20 });
    fireEvent.pointerMove(stepB, { clientX: 100, clientY: 50 });
    fireEvent.pointerUp(stepB, { clientX: 100, clientY: 50 });

    // Popover opens
    expect(screen.getByTestId('hypothesis-draft-popover')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/because/i), {
      target: { value: 'thermal coupling between chambers' },
    });
    fireEvent.click(screen.getByRole('button', { name: /save/i }));

    // Popover closes; link was committed
    expect(screen.queryByTestId('hypothesis-draft-popover')).not.toBeInTheDocument();
    const finalLinks = useInvestigationStore.getState().causalLinks;
    expect(finalLinks.length).toBe(initialLinkCount + 1);
    expect(finalLinks[finalLinks.length - 1].whyStatement).toBe(
      'thermal coupling between chambers'
    );

    // Tool returned to select per Risk #2 lock
    expect(screen.getByTestId('hypothesis-draw-tool-button')).toHaveAttribute(
      'aria-pressed',
      'false'
    );
  });

  it('Cancel during awaitingForm dismisses without committing', () => {
    const investigationStore = useInvestigationStore.getState();
    const initialLinkCount = investigationStore.causalLinks.length;

    render(<CanvasWorkspace {...minimalPropsWithStepsAandB} />);
    fireEvent.click(screen.getByTestId('hypothesis-draw-tool-button'));

    const stepA = screen.getByTestId('canvas-step-card-step-a');
    const stepB = screen.getByTestId('canvas-step-card-step-b');
    fireEvent.pointerDown(stepA, { clientX: 10, clientY: 20 });
    fireEvent.pointerUp(stepB, { clientX: 100, clientY: 50 });

    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
    expect(screen.queryByTestId('hypothesis-draft-popover')).not.toBeInTheDocument();
    expect(useInvestigationStore.getState().causalLinks.length).toBe(initialLinkCount);
  });

  it('self-loop release (same step) returns to drawing without opening form', () => {
    render(<CanvasWorkspace {...minimalPropsWithStepsAandB} />);
    fireEvent.click(screen.getByTestId('hypothesis-draw-tool-button'));
    const stepA = screen.getByTestId('canvas-step-card-step-a');
    fireEvent.pointerDown(stepA, { clientX: 10, clientY: 20 });
    fireEvent.pointerUp(stepA, { clientX: 12, clientY: 22 });
    expect(screen.queryByTestId('hypothesis-draft-popover')).not.toBeInTheDocument();
  });
});
```

(`minimalPropsWithStepsAandB` should mirror the existing test fixtures in this file — extend or adapt to your fixtures.)

- [ ] **Step 4: Run test to verify failures**

Run: `pnpm --filter @variscout/ui test -- CanvasWorkspace`
Expected: FAIL — button not in chrome; pointer handlers not wired; popover doesn't open.

- [ ] **Step 5: Update `CanvasWorkspace.tsx`**

Add the new state to the existing `useSessionCanvasFilters` destructure (line ~245):

```tsx
const {
  timelineWindow,
  setTimelineWindow,
  scopeFilter,
  setScopeFilter,
  paretoGroupBy,
  setParetoGroupBy,
  activeCanvasLens,
  setActiveCanvasLens,
  activeCanvasOverlays,
  toggleCanvasOverlay,
  activeCanvasTool,
  setActiveCanvasTool,
} = useSessionCanvasFilters();
```

Pass them to `<Canvas>` (line ~458):

```tsx
<Canvas
  // ...existing props...
  activeOverlays={activeCanvasOverlays}
  onOverlayToggle={toggleCanvasOverlay}
  activeCanvasTool={activeCanvasTool}
  onCanvasToolChange={setActiveCanvasTool}
/>
```

Also: pass `questions` and `causalLinks` from `useInvestigationStore` if not already (the popover needs the questions list; CanvasWorkspace already accepts these as props per the existing API — verify).

- [ ] **Step 6: Update `Canvas/index.tsx`**

Three changes:

1. **Extend props interface.** Add to the existing `CanvasProps`:

   ```tsx
   activeCanvasTool: CanvasToolId;
   onCanvasToolChange: (next: CanvasToolId) => void;
   onAddCausalLink: (
     fromFactor: string,
     toFactor: string,
     whyStatement: string,
     options?: { questionIds?: string[] }
   ) => void;
   questions: ReadonlyArray<{ id: string; text: string }>;
   ```

   Thread `onAddCausalLink` from CanvasWorkspace down to Canvas — CanvasWorkspace either has direct access to `useInvestigationStore.getState().addCausalLink` or accepts it as a callback prop. Verify which pattern this codebase uses (the existing `onCharter` / `onSustainment` callbacks are the precedent — they call `usePanelsStore.getState().show...()` from FrameView). Mirror that: CanvasWorkspace's parent (e.g., FrameView) injects `onAddCausalLink` as a callback that calls `useInvestigationStore.getState().addCausalLink(...)` internally.

2. **Add the chrome button.** In the JSX block at line ~333–354, between `<CanvasOverlayPicker>` and the right-side `<CanvasModeToggle>` cluster:

   ```tsx
   <div className="flex flex-wrap items-center gap-2">
     {isAuthorMode ? <StructuralToolbar … /> : null}
     <CanvasLensPicker activeLens={resolvedLens} onChange={onLensChange} />
     <CanvasOverlayPicker activeOverlays={resolvedOverlays} onToggle={onOverlayToggle} />
     <HypothesisDrawToolButton
       activeTool={activeCanvasTool}
       onChange={onCanvasToolChange}
       disabled={disabled}
     />
   </div>
   ```

3. **Wire the state machine + render rubber-band + popover.** Inside the `Canvas` body:

   ```tsx
   const drawTool = useHypothesisDrawTool({
     active: activeCanvasTool === 'draw-hypothesis',
   });

   const stepMetricColumns = React.useMemo(() => {
     const out: Record<string, string | undefined> = {};
     for (const card of stepCards) out[card.stepId] = card.metricColumn;
     return out;
   }, [stepCards]);

   const handlePointerDown = (event: React.PointerEvent<HTMLElement>) => {
     if (activeCanvasTool !== 'draw-hypothesis') return;
     const endpoint = endpointFromElementAt(event.clientX, event.clientY);
     if (!endpoint) return;
     event.preventDefault();
     drawTool.onPointerDown(endpoint, { x: event.clientX, y: event.clientY });
   };

   const handlePointerMove = (event: React.PointerEvent<HTMLElement>) => {
     if (drawTool.state.phase !== 'drawing') return;
     const endpoint = endpointFromElementAt(event.clientX, event.clientY);
     drawTool.onPointerMove({ x: event.clientX, y: event.clientY }, endpoint);
   };

   const handlePointerUp = (event: React.PointerEvent<HTMLElement>) => {
     if (drawTool.state.phase !== 'drawing') return;
     const endpoint = endpointFromElementAt(event.clientX, event.clientY);
     drawTool.onPointerUp(endpoint, { x: event.clientX, y: event.clientY });
   };

   React.useEffect(() => {
     const handleKey = (event: KeyboardEvent) => {
       if (event.key === 'Escape') drawTool.cancel();
     };
     window.addEventListener('keydown', handleKey);
     return () => window.removeEventListener('keydown', handleKey);
   }, [drawTool]);

   const handleSave = (payload: HypothesisDraftPayload) => {
     if (drawTool.state.phase !== 'awaitingForm') return;
     const fromFactor = resolveEndpointToFactor(drawTool.state.source, stepMetricColumns);
     const toFactor = resolveEndpointToFactor(drawTool.state.target, stepMetricColumns);
     if (!fromFactor || !toFactor) {
       drawTool.reset();
       return;
     }
     onAddCausalLink(fromFactor, toFactor, payload.whyStatement, {
       questionIds: payload.questionId ? [payload.questionId] : [],
     });
     drawTool.reset();
     onCanvasToolChange('select'); // Risk #2 lock: return to select after Save
   };

   const handleCancel = () => {
     drawTool.reset();
   };
   ```

   Define `endpointFromElementAt`:

   ```tsx
   function endpointFromElementAt(x: number, y: number): ArrowEndpoint | null {
     const el = typeof document === 'undefined' ? null : document.elementFromPoint(x, y);
     let node: Element | null = el;
     while (node) {
       const attr = node.getAttribute('data-arrow-endpoint');
       if (attr) {
         const [kind, ...rest] = attr.split(':');
         const id = rest.join(':');
         if (kind === 'step') return { kind: 'step', id };
         if (kind === 'column') {
           // hostStepId = the nearest step ancestor's id
           let stepNode: Element | null = node.parentElement;
           while (stepNode) {
             const stepAttr = stepNode.getAttribute('data-arrow-endpoint');
             if (stepAttr?.startsWith('step:')) {
               return { kind: 'column', name: id, hostStepId: stepAttr.slice(5) };
             }
             stepNode = stepNode.parentElement;
           }
           return null; // column chip outside any step (shouldn't happen)
         }
       }
       node = node.parentElement;
     }
     return null;
   }
   ```

   Attach the handlers to the existing `<section data-testid="canvas-card-surface">` (line ~363):

   ```tsx
   <section
     ref={cardSurfaceRef}
     className={[
       'relative px-4 py-4',
       activeCanvasTool === 'draw-hypothesis' ? 'cursor-crosshair' : '',
     ].join(' ')}
     data-testid="canvas-card-surface"
     onPointerDown={handlePointerDown}
     onPointerMove={handlePointerMove}
     onPointerUp={handlePointerUp}
     onPointerCancel={() => drawTool.onPointerCancel()}
     style={{ touchAction: activeCanvasTool === 'draw-hypothesis' ? 'none' : undefined }}
   >
   ```

   Track the cursor pos as component-local state (`'drawing'` phase only):

   ```tsx
   const [cursorPos, setCursorPos] = React.useState<{ x: number; y: number } | null>(null);
   ```

   Update `handlePointerMove` to also update `cursorPos`:

   ```tsx
   const handlePointerMove = (event: React.PointerEvent<HTMLElement>) => {
     if (drawTool.state.phase !== 'drawing') return;
     setCursorPos({ x: event.clientX, y: event.clientY });
     const endpoint = endpointFromElementAt(event.clientX, event.clientY);
     drawTool.onPointerMove({ x: event.clientX, y: event.clientY }, endpoint);
   };
   ```

   Reset `cursorPos` when leaving the `'drawing'` phase via a `useEffect` watching `drawTool.state.phase`. Render the rubber-band inside the surface section (sibling to the existing `arrowSegments` SVG):

   ```tsx
   {
     drawTool.state.phase === 'drawing' && cursorPos ? (
       <svg
         className="pointer-events-none absolute inset-0 z-20 h-full w-full"
         data-testid="canvas-rubber-band"
         aria-hidden="true"
       >
         <line
           x1={drawTool.state.cursorAt.x}
           y1={drawTool.state.cursorAt.y}
           x2={cursorPos.x}
           y2={cursorPos.y}
           stroke="currentColor"
           strokeDasharray="4 3"
           strokeWidth="2"
           opacity={0.7}
           style={{ color: chartColors.warning }}
         />
       </svg>
     ) : null;
   }
   ```

   The state machine's `cursorAt` carries the source center (set at pointerdown — see next paragraph); `cursorPos` carries the live mouse position during drag. The `<line>` connects them.

   **Source coordinate at gesture start.** Update `handlePointerDown` to pass the source endpoint's element-rect center (not the raw event coords) so `cursorAt` doubles as the rubber-band's anchor:

   ```tsx
   const sourceEl = (event.target as Element).closest('[data-arrow-endpoint]');
   const sourceRect = sourceEl?.getBoundingClientRect();
   const sourceCenter = sourceRect
     ? { x: sourceRect.left + sourceRect.width / 2, y: sourceRect.top + sourceRect.height / 2 }
     : { x: event.clientX, y: event.clientY };
   drawTool.onPointerDown(endpoint, sourceCenter);
   ```

   This keeps Task 1 stable: state-machine `cursorAt` carries the source point (fixed at pointerdown); component-local `cursorPos` tracks the live cursor during drag. Together they define the rubber-band line endpoints.

   Render popover during `'awaitingForm'`:

   ```tsx
   {
     drawTool.state.phase === 'awaitingForm' ? (
       <HypothesisDraftPopover
         sourceLabel={endpointLabel(drawTool.state.source)}
         targetLabel={endpointLabel(drawTool.state.target)}
         releaseAt={drawTool.state.releaseAt}
         questions={questions.map(q => ({ id: q.id, text: q.text }))}
         onSave={handleSave}
         onCancel={handleCancel}
       />
     ) : null;
   }
   ```

   Helper:

   ```tsx
   function endpointLabel(ep: ArrowEndpoint): string {
     if (ep.kind === 'column') return ep.name;
     // step: return the resolved metric column for display
     // (we already have stepMetricColumns)
     return stepMetricColumns[ep.id] ?? ep.id;
   }
   ```

4. **Pass `activeCanvasTool` down to `CanvasStepCard`**:

   ```tsx
   {
     stepCards.map(card => (
       <CanvasStepCard
         key={card.stepId}
         card={card}
         activeLens={resolvedLens}
         activeOverlays={resolvedOverlays}
         investigationOverlay={investigationOverlays?.byStep[card.stepId]}
         activeCanvasTool={activeCanvasTool}
         onOpen={handleOpenStepCard}
         onStepSpecsRequest={onStepSpecsRequest}
         registerCardElement={registerCardElement}
       />
     ));
   }
   ```

- [ ] **Step 7: Wire `onAddCausalLink` callback in app shells**

For BOTH apps (`apps/azure/src/components/editor/FrameView.tsx` AND `apps/pwa/src/components/views/FrameView.tsx`), inside the FrameView component (find the `handleCharter` / `handleSustainment` etc. callbacks — line ~96+), add:

```tsx
const handleAddCausalLink = React.useCallback(
  (
    fromFactor: string,
    toFactor: string,
    whyStatement: string,
    options?: { questionIds?: string[] }
  ) => {
    const link = useInvestigationStore.getState().addCausalLink(fromFactor, toFactor, whyStatement);
    if (link && options?.questionIds) {
      for (const qid of options.questionIds) {
        useInvestigationStore.getState().linkQuestionToCausalLink(link.id, qid);
      }
    }
  },
  []
);
```

And pass `onAddCausalLink={handleAddCausalLink}` + `questions={questions}` to `<CanvasWorkspace>`.

- [ ] **Step 8: Run tests**

Run: `pnpm --filter @variscout/ui test -- Canvas`
Expected: all PASS, including the 5 new integration tests.

Run: `pnpm --filter @variscout/azure-app build && pnpm --filter @variscout/pwa-app build`
Expected: type-check passes; production builds succeed.

- [ ] **Step 9: Commit**

```bash
git add packages/ui/src/components/Canvas/index.tsx \
        packages/ui/src/components/Canvas/CanvasWorkspace.tsx \
        packages/ui/src/components/Canvas/__tests__/CanvasWorkspace.test.tsx \
        apps/azure/src/components/editor/FrameView.tsx \
        apps/pwa/src/components/views/FrameView.tsx
git commit -m "feat(8d): integrate hypothesis-arrow drawing into canvas chrome

- Place HypothesisDrawToolButton in chrome row between OverlayPicker
  and ModeToggle (top-level mode-agnostic per spec Q6).
- Wire useHypothesisDrawTool through Canvas; pointer handlers on the
  card surface walk DOM via document.elementFromPoint to find
  data-arrow-endpoint hit-test targets.
- Render rubber-band SVG line during drawing phase; render
  HypothesisDraftPopover during awaitingForm phase.
- Save commits via investigationStore.addCausalLink and returns to
  'select' tool (Risk #2 lock).
- Apps inject onAddCausalLink callback so FrameView wraps the store
  call (mirrors handleCharter / handleSustainment pattern).

Co-Authored-By: ruflo <ruv@ruv.net>"
```

---

## Task 8: `CanvasStepOverlay` Remove button + investigations.md resolution + chrome walk

**Files:**

- Modify: `packages/ui/src/components/Canvas/internal/CanvasStepOverlay.tsx`
- Modify: `packages/ui/src/components/Canvas/internal/__tests__/CanvasStepOverlay.test.tsx`
- Modify: `docs/investigations.md`

**Goal:** Add a Remove `×` button next to each causalLink in the step overlay's drilldown list (per spec Q5 explicit-delete affordance). Mark the investigations entry resolved. Document chrome-walk steps.

- [ ] **Step 1: Read the current CanvasStepOverlay causalLinks list (lines ~322–331)**

The current JSX:

```tsx
{
  investigationOverlay.causalLinks.map(link => (
    <button
      key={`link-${link.id}`}
      type="button"
      className="rounded border border-edge bg-surface-primary px-2 py-1 text-left text-content-secondary hover:bg-surface-tertiary hover:text-content"
      onClick={() => onOpenInvestigationFocus?.(link.focus)}
    >
      Link: {link.label}
    </button>
  ));
}
```

- [ ] **Step 2: Update the test file**

Add to `packages/ui/src/components/Canvas/internal/__tests__/CanvasStepOverlay.test.tsx`:

```tsx
describe('CanvasStepOverlay — causal link Remove (8d)', () => {
  it('renders a Remove button per causal link', () => {
    const overlay = {
      // ...minimal overlay with 1 causalLink {id: 'link-1', label: 'A → B'}
      causalLinks: [
        {
          id: 'link-1',
          fromStepId: 'step-a',
          toStepId: 'step-b',
          label: 'A → B',
          questionId: undefined,
          focus: { kind: 'causal-link' as const, id: 'link-1' },
        },
      ],
      // ...rest empty
    };
    render(<CanvasStepOverlay /* ...props with overlay... */ />);
    expect(screen.getByRole('button', { name: /Remove hypothesis A → B/ })).toBeInTheDocument();
  });

  it('clicking Remove calls onRemoveCausalLink with the link id', () => {
    const onRemoveCausalLink = vi.fn();
    render(<CanvasStepOverlay /* ...props with overlay + onRemoveCausalLink... */ />);
    fireEvent.click(screen.getByRole('button', { name: /Remove hypothesis/ }));
    expect(onRemoveCausalLink).toHaveBeenCalledWith('link-1');
  });

  it('Remove button click does NOT trigger onOpenInvestigationFocus (stopPropagation)', () => {
    const onOpenInvestigationFocus = vi.fn();
    const onRemoveCausalLink = vi.fn();
    render(
      <CanvasStepOverlay
      /* ...props with overlay + both handlers... */
      />
    );
    fireEvent.click(screen.getByRole('button', { name: /Remove hypothesis/ }));
    expect(onRemoveCausalLink).toHaveBeenCalled();
    expect(onOpenInvestigationFocus).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 3: Run test to verify failures**

Run: `pnpm --filter @variscout/ui test -- CanvasStepOverlay`
Expected: FAIL — Remove button not found.

- [ ] **Step 4: Update CanvasStepOverlay**

Add `onRemoveCausalLink?: (linkId: string) => void` to the props interface. Then update the causalLinks list:

```tsx
{
  investigationOverlay.causalLinks.map(link => (
    <div key={`link-${link.id}`} className="flex items-center gap-1">
      <button
        type="button"
        className="flex-1 rounded border border-edge bg-surface-primary px-2 py-1 text-left text-content-secondary hover:bg-surface-tertiary hover:text-content"
        onClick={() => onOpenInvestigationFocus?.(link.focus)}
      >
        Link: {link.label}
      </button>
      {onRemoveCausalLink ? (
        <button
          type="button"
          aria-label={`Remove hypothesis ${link.label}`}
          title="Remove hypothesis"
          className="rounded border border-edge bg-surface-primary px-1 py-1 text-content-secondary hover:bg-status-fail-soft hover:text-status-fail"
          onClick={event => {
            event.stopPropagation();
            onRemoveCausalLink(link.id);
          }}
        >
          ×
        </button>
      ) : null}
    </div>
  ));
}
```

- [ ] **Step 5: Thread `onRemoveCausalLink` through the call chain**

`Canvas/index.tsx` → `CanvasStepOverlay` consumer (find the existing `<CanvasStepOverlay …/>` mount point — line ~440+) → add `onRemoveCausalLink={onRemoveCausalLink}` prop. Add the prop to `CanvasProps`. Plumb through `CanvasWorkspace.tsx` → up to FrameView, where:

```tsx
const handleRemoveCausalLink = React.useCallback((linkId: string) => {
  useInvestigationStore.getState().removeCausalLink(linkId);
}, []);
```

Pass `onRemoveCausalLink={handleRemoveCausalLink}` down through CanvasWorkspace.

- [ ] **Step 6: Run tests**

Run: `pnpm --filter @variscout/ui test -- CanvasStepOverlay`
Expected: 3 new tests PASS + existing tests still green.

Run: `pnpm --filter @variscout/ui test`
Expected: full UI suite green.

Run: `bash scripts/pr-ready-check.sh`
Expected: all green (build, lint, tests, docs:check).

- [ ] **Step 7: Mark investigations.md resolved**

Edit `docs/investigations.md`. Find the entry "Canvas hypothesis-arrow drawing affordance absent (vision §3.4)" pinned 2026-05-06. Add a `[RESOLVED YYYY-MM-DD]` marker at the start of the title. Replace the "Promotion path:" section with a short "Resolved by PR #NNN landing canvas-pr8-8d-hypothesis-arrow-drawing." pointer (NNN filled in after the PR is created).

- [ ] **Step 8: Manual chrome walk**

Per `feedback_browser_e2e_use_official_extension`, run `claude --chrome` and execute these steps in BOTH PWA and Azure builds:

1. Open the canvas with the syringe-barrel showcase seed (per `reference_chrome_walkthrough_template`).
2. Verify the Hypothesis Draw tool button is in the chrome row between Overlays and the Edit/Lock toggle.
3. Click the button. Confirm: pressed visual on the button; cursor switches to crosshair on the canvas; Hypotheses overlay button shows pressed state.
4. Press-drag from one step card header to another. Confirm: a faint dashed rubber-band line follows the cursor during drag.
5. Release on a different step card. Confirm: floating popover appears at release point with auto-filled subject and object; arrow points to the target step.
6. Type a `because…` statement. Confirm: Save button enables after non-empty input.
7. Click Save. Confirm: popover closes; faint dashed arrow renders between source and target steps; tool returns to select (button no longer pressed); cursor returns to default.
8. Open a step card via click. Confirm: drilldown opens; causal links list shows the new link with a `×` Remove button.
9. Click the `×` button. Confirm: link removed; faint dashed arrow disappears.
10. Toggle the Hypotheses overlay off. Confirm: arrows hide.
11. Promote a hypothesis to a SuspectedCause hub via the existing investigation flow (open the investigation tab, mark as suspected). Return to the canvas. Confirm: faint dashed arrow disappears AND a `<StepNodeMarker>` Flag pip appears on the affected step card chrome.
12. Click the Flag pip. Confirm: drilldown opens with focus on the suspected-causes section.
13. Test on touch (use Chrome DevTools mobile mode): confirm gesture works with finger drag; popover renders bottom-sheet style on small viewports.
14. Test keyboard alternative: Tab to a step card, Enter, Tab to a target step, Enter — confirm popover opens.

Document each step's screenshot or quick observation in the PR description.

- [ ] **Step 9: Commit + push + PR**

```bash
git add packages/ui/src/components/Canvas/internal/CanvasStepOverlay.tsx \
        packages/ui/src/components/Canvas/internal/__tests__/CanvasStepOverlay.test.tsx \
        packages/ui/src/components/Canvas/index.tsx \
        packages/ui/src/components/Canvas/CanvasWorkspace.tsx \
        apps/azure/src/components/editor/FrameView.tsx \
        apps/pwa/src/components/views/FrameView.tsx \
        docs/investigations.md
git commit -m "feat(8d): add Remove button to causal links + close investigations entry

- CanvasStepOverlay's causal-link list gets a × Remove button per
  spec Q5 explicit-delete affordance.
- onRemoveCausalLink threaded from FrameView (calling
  investigationStore.removeCausalLink) through CanvasWorkspace and
  Canvas.
- investigations.md 'Canvas hypothesis-arrow drawing' entry marked
  [RESOLVED] with PR pointer.

Co-Authored-By: ruflo <ruv@ruv.net>"
```

Then per master plan §6:

```bash
git push -u origin canvas-pr8-8d-hypothesis-arrow-drawing
gh pr create --title "PR8-8d: canvas hypothesis-arrow drawing" --body "$(cat <<'EOF'
## Summary
- Implements user-authored hypothesis-arrow drawing per vision §3.4 + spec [`docs/superpowers/specs/2026-05-07-canvas-hypothesis-arrow-drawing-design.md`]
- Custom pointer-event state machine; top-level mode-agnostic tool; auto-enables Hypotheses overlay
- Replaces Codex's inline count badge with StepNodeMarker pip per Q3 (closes spec deviation)
- Remove affordance in step overlay drilldown per Q5

## Test plan
- [ ] `pnpm --filter @variscout/hooks test` green
- [ ] `pnpm --filter @variscout/ui test` green
- [ ] `bash scripts/pr-ready-check.sh` green
- [ ] `claude --chrome` walk PWA: 14 steps in plan §Task 8 Step 8
- [ ] `claude --chrome` walk Azure: same 14 steps
- [ ] Final code-reviewer (Opus) approval

🤖 Generated with [ruflo](https://github.com/ruvnet/ruflo)
EOF
)"
```

After PR opens: dispatch the final Opus code-reviewer per `feedback_subagent_driven_default` master-plan D6.

---

## Test command reference

```bash
# Single hook test
pnpm --filter @variscout/hooks test -- useHypothesisDrawTool

# Single component test
pnpm --filter @variscout/ui test -- HypothesisDrawToolButton

# Whole package
pnpm --filter @variscout/ui test
pnpm --filter @variscout/hooks test

# Full repo
pnpm test

# PR gate (build + lint + tests + docs)
bash scripts/pr-ready-check.sh

# Manual chrome walk
claude --chrome
```

## Spec coverage map

| Spec section                 | Tasks                                                                                                        |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------ |
| Q1 drag gesture mechanic     | Task 1 (state machine), Task 7 (pointer handlers)                                                            |
| Q2 source/target granularity | Task 1 (helper), Task 6 (`data-arrow-endpoint`), Task 7 (hit-test)                                           |
| Q3 promoted-vs-draft visual  | Task 5 (StepNodeMarker), Task 6 (replace badge)                                                              |
| Q4 inline form placement     | Task 4 (HypothesisDraftPopover), Task 7 (mount during awaitingForm)                                          |
| Q5 undo behavior             | Task 7 (no Cmd+Z; reset on Save), Task 8 (Remove button)                                                     |
| Q6 tool visibility           | Task 3 (button), Task 7 (chrome placement)                                                                   |
| Q7 F4 layer assignments      | Task 1 (component-local), Task 2 (View in useSessionCanvasFilters), Task 7 (Document via investigationStore) |
| §11 acceptance criteria      | All tasks contribute; Task 7 + Task 8 cover the integration + chrome walk                                    |
| Risk #1 column resolution    | Task 1 (`resolveEndpointToFactor`), Task 7 (`stepMetricColumns` map)                                         |
| Risk #2 chained-add UX       | Task 7 (`onCanvasToolChange('select')` after Save)                                                           |
| Risk #5 popover library      | Task 4 (hand-rolled positioning)                                                                             |
| Risk #6 marker icon          | Task 5 (Lucide `Flag`)                                                                                       |

## Out of scope (carry-forwards from spec §15)

These are NOT addressed by this plan; if surfaced during the chrome walk or review, file a follow-up task:

- 8e Wall mirror in canvas overlay
- 8f canvas viewport architecture (levels-as-pan/zoom)
- Retroactive Spec 4 documentation of PR6 read-side projections
- `useSessionCanvasFilters` migration to `useViewStore` (separate F4 follow-up)
- `investigationStore` undo stack (separate design discussion)
- Marker clustering at zoom-out (coupled to 8f)
- AI-assisted hypothesis suggestion
- Multi-user CRDT for hypothesis arrows

## Master-plan + workflow rule references

- Master plan: [`2026-05-07-canvas-pr8-vision-alignment-master.md`](2026-05-07-canvas-pr8-vision-alignment-master.md) §4 8d, §5 sequencing (after F4 + 8a + 8b merge), D5 investigations close-out, D6 subagent-driven dispatch.
- `feedback_subagent_driven_default` — Sonnet workhorse + per-task spec/quality reviewers; Opus final review.
- `feedback_one_worktree_per_agent` — branch in `.worktrees/canvas-pr8-8d-hypothesis-arrow-drawing/`.
- `feedback_branch_staleness_guardrails` — `git fetch && git log HEAD..origin/main` before each push.
- `feedback_slice_size_cap` — 8 tasks/PR (within target).
- `feedback_no_backcompat_clean_architecture` — internal API changes (e.g., `CanvasStepCard` requires `activeCanvasTool`); refactor consumers in the same PR.
- `feedback_subagent_no_verify` — never bypass pre-commit hooks; if a hook fails, fix the underlying issue.
- `feedback_verify_subagent_commit_tree` — after each task's implementer marks DONE, the per-task quality reviewer must confirm `git show <commit> --stat` matches reported file list.
- `feedback_world_class_critique` — Q6 deviation from master plan was the design call; reviewers should not relitigate it.
