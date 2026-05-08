---
title: 'Canvas Wall Overlay — PR8 sub-PR 8e implementation plan'
audience: [engineer, product]
category: implementation
status: active
last-reviewed: 2026-05-08
related:
  - docs/superpowers/specs/2026-05-08-canvas-wall-overlay-design.md
  - docs/superpowers/specs/2026-05-07-canvas-hypothesis-arrow-drawing-design.md
  - docs/superpowers/plans/2026-05-07-canvas-pr8-vision-alignment-master.md
  - docs/superpowers/specs/2026-05-07-data-flow-foundation-f4-three-layer-state-design.md
---

# Canvas Wall Overlay Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended per master-plan D6) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. **Sonnet for ≥70% of dispatches** (implementer + per-task spec/quality reviewers); **Opus only for the final code-reviewer** sweep before merge.
>
> **Spec:** [`docs/superpowers/specs/2026-05-08-canvas-wall-overlay-design.md`](../specs/2026-05-08-canvas-wall-overlay-design.md). Read it for design rationale; this plan is the executable shape.
>
> **Worktree:** Per `feedback_one_worktree_per_agent`, create `.worktrees/canvas-pr8-8e-wall-overlay/` via `superpowers:using-git-worktrees` BEFORE dispatching the first task. Branch name: `canvas-pr8-8e-wall-overlay`.

**Goal:** Embed `WallCanvas` viewport as a read-only canvas overlay layer per vision §5.6 dual-home, with click-to-drill into the Wall destination view, viewport-adaptive mobile re-skin to "Open Wall ↗" navigation, and shared `useWallLayoutStore` viewport across overlay + destination. Closes the unmet vision-spec commitment _"Canvas Wall overlay is badge projection, not 'same data, two views' mirror (vision §5.6)"_ from the canvas PR4c–PR6 retrospective (2026-05-06).

**Architecture:** Add `'wall'` to the existing `CanvasOverlayId` union. Render a new `<CanvasWallOverlay/>` internal component inside `<Canvas/>`'s card-surface section that wraps `WallCanvas` with a new `mode='overlay'` prop. The `'overlay'` mode is a pure subtraction inside `WallCanvas`: no `DndContext` (no `onComposeGate`), no hub-comment SSE wiring, no `MissingEvidenceDigest` HTML panel; click handlers stay live and forward to a single `onOpenWall` callback the app wires to navigate to Wall destination. `useWallLayoutStore` is the shared viewport. Mobile (<768px): the toolbar slot re-skins to a `WallShortcutButton` that calls the same `onOpenWall`. Empty graph: `'wall'` is filtered out of `CanvasOverlayPicker.availableOverlays` until ≥1 hub/question/finding exists.

**Tech Stack:** TypeScript 6, React 19, Zustand (`useWallLayoutStore`, `usePanelsStore`, `useInvestigationStore`, `useFindingsStore` — all existing), Tailwind v4 semantic classes (`bg-surface-*`, `text-content-*`, `border-edge`, `bg-status-info-soft`), Lucide icons (existing dep), Vitest + React Testing Library, `@variscout/charts` (`WallCanvas`, `useWallIsMobile`, `WALL_MOBILE_BREAKPOINT`).

**Plan-time decisions locked** (resolves spec §11 risks + grounded callsite findings):

| Decision                                        | Locked value                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Per-app `onOpenWall` wiring                     | **Azure:** `panelsStore.setInvestigationViewMode('map')` + `wallLayoutStore.setViewMode('wall')`. **PWA:** the existing route action that switches to Investigation view + `wallLayoutStore.setViewMode('wall')`. Both apps' wiring lives in their respective `FrameView.tsx` files (or the parent that owns the `CanvasWorkspace` mount).                                                                                                                                                                                      |
| Shared `wallProps` selector                     | New hook `useSharedWallProps()` in `@variscout/hooks` (downward-only deps OK: it reads from `@variscout/stores` only). Memoized; consumed by both `CanvasWorkspace` (for the overlay) and the existing destination-view callsites in `apps/azure/src/components/editor/InvestigationWorkspace.tsx` + `apps/pwa/src/components/views/InvestigationView.tsx`. The destination callsites continue to pass viewport (`zoom`, `pan`, `groupByTributary`) as props from local `useWallLayoutStore` selectors — overlay does the same. |
| Click-to-drill: overlay click handlers          | All five WallCanvas click props (`onSelectHub`, `onPromoteQuestion`, `onPromoteFromQuestion`, `onSeedFromFactorIntel`, `onFocusHubFromGap`) wire to a no-arg `() => onOpenWall?.()` in overlay mode. V1 doesn't carry an entity id through to destination (per spec Q1: shared viewport already centers the user on what they clicked).                                                                                                                                                                                         |
| `availableOverlays` derivation                  | New selector `useHasInvestigationContent()` in `@variscout/hooks` reads from `@variscout/stores`'s `useInvestigationStore.suspectedCauses + .questions` and from the app's findings source. Returns `boolean` derived from `(hubs.length + questions.length + findings.length) > 0`. App (CanvasWorkspace) derives `availableOverlays` from this and passes to Canvas → CanvasOverlayPicker.                                                                                                                                    |
| Findings source                                 | Findings live in app-level feature stores (`apps/azure/src/features/findings/findingsStore.ts` and the PWA equivalent), NOT in `@variscout/stores`. So `useHasInvestigationContent` accepts findings count as an argument; CanvasWorkspace's caller (FrameView in each app) passes `findings.length`. Avoids forcing a cross-app store coupling.                                                                                                                                                                                |
| Mobile re-skin glyph                            | Lucide `ExternalLink` icon at 14px, paired with the i18n-keyed label ("Open Wall"). Button styling matches `CanvasOverlayPicker`'s active-state pill (`border-status-info bg-status-info-soft text-status-info`).                                                                                                                                                                                                                                                                                                               |
| Resize behavior                                 | View store can hold `'wall'` regardless; render gates on `useWallIsMobile()` inside `<CanvasWallOverlay/>` (returns `null` when mobile) and inside the toolbar (renders `WallShortcutButton` instead of toggle when mobile). No store mutation on resize.                                                                                                                                                                                                                                                                       |
| `pointer-events: none` while draw-hypothesis on | Wrapper div on `<CanvasWallOverlay/>` computes `pointerEventsClass = activeCanvasTool === 'draw-hypothesis' ? 'pointer-events-none' : ''`. Single Tailwind toggle; no JS event-routing logic.                                                                                                                                                                                                                                                                                                                                   |
| i18n keys                                       | New keys `canvas.wall.overlayLabel = "Wall"`, `canvas.wall.overlayDescription = "Investigation Wall projected onto the canvas. Click any hub to open the Wall destination view."`, `canvas.wall.shortcutLabel = "Open Wall"`. Add to existing `packages/core/src/i18n/messages/canvas.ts` catalog. Per `adding-i18n-messages`, every test rendering these strings must register locale loaders.                                                                                                                                 |

**File structure:**

```
NEW FILES:
  packages/hooks/src/useSharedWallProps.ts                                     (memoized WallCanvas-prop assembly)
  packages/hooks/src/__tests__/useSharedWallProps.test.ts                      (selector test)
  packages/hooks/src/useHasInvestigationContent.ts                             (boolean predicate)
  packages/hooks/src/__tests__/useHasInvestigationContent.test.ts              (predicate test)
  packages/ui/src/components/Canvas/internal/CanvasWallOverlay.tsx             (overlay layer wrapper)
  packages/ui/src/components/Canvas/internal/__tests__/CanvasWallOverlay.test.tsx
  packages/ui/src/components/Canvas/internal/WallShortcutButton.tsx            (mobile re-skin button)
  packages/ui/src/components/Canvas/internal/__tests__/WallShortcutButton.test.tsx

MODIFIED FILES:
  packages/hooks/src/useCanvasInvestigationOverlays.ts                          (+ 'wall' in CanvasOverlayId, registry)
  packages/hooks/src/__tests__/useCanvasInvestigationOverlays.test.ts           (+ 'wall' coercion test)
  packages/hooks/src/index.ts                                                    (+ export new hooks)
  packages/charts/src/InvestigationWall/WallCanvas.tsx                          (+ mode prop, gate subscriptions/DnD/footer)
  packages/charts/src/InvestigationWall/__tests__/WallCanvas.test.tsx           (+ mode='overlay' tests)
  packages/ui/src/components/Canvas/internal/CanvasOverlayPicker.tsx            (+ availableOverlays prop)
  packages/ui/src/components/Canvas/internal/__tests__/CanvasOverlayPicker.test.tsx (or new file if absent)
  packages/ui/src/components/Canvas/index.tsx                                    (+ onOpenWall prop, mount overlay + shortcut button)
  packages/ui/src/components/Canvas/CanvasWorkspace.tsx                          (+ thread onOpenWall, derive availableOverlays + wallProps)
  packages/ui/src/components/Canvas/__tests__/CanvasWorkspace.test.tsx           (+ overlay-on smoke test)
  packages/ui/src/components/Canvas/__tests__/Canvas.test.tsx                    (+ shortcut button + overlay layer tests)
  packages/core/src/i18n/messages/canvas.ts                                      (+ 3 new keys)
  packages/core/src/i18n/__tests__/canvas-messages.test.ts                       (+ key presence test)
  apps/azure/src/components/editor/FrameView.tsx                                 (+ wire onOpenWall + content predicate inputs)
  apps/pwa/src/components/views/FrameView.tsx                                    (+ wire onOpenWall + content predicate inputs)
  docs/investigations.md                                                         (close the §5.6 entry [RESOLVED YYYY-MM-DD])
```

---

## Task 1: Add `'wall'` to `CanvasOverlayId` union + registry

**Files:**

- Modify: `packages/hooks/src/useCanvasInvestigationOverlays.ts:6` (union literal) and `:15-40` (registry)
- Modify: `packages/hooks/src/__tests__/useCanvasInvestigationOverlays.test.ts`

**Goal:** Surface a fifth overlay id `'wall'` so `CanvasOverlayPicker` can render its toggle, and so `coerceCanvasOverlays` round-trips persisted values. No rendering yet — that comes in later tasks.

- [ ] **Step 1: Write the failing test**

Add to `packages/hooks/src/__tests__/useCanvasInvestigationOverlays.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import {
  CANVAS_OVERLAY_REGISTRY,
  coerceCanvasOverlays,
  enabledCanvasOverlays,
  type CanvasOverlayId,
} from '../useCanvasInvestigationOverlays';

describe('CanvasOverlayId — wall overlay', () => {
  it('registry includes a wall entry with overlay-appropriate label/description', () => {
    expect(CANVAS_OVERLAY_REGISTRY.wall).toBeDefined();
    expect(CANVAS_OVERLAY_REGISTRY.wall.id).toBe('wall');
    expect(CANVAS_OVERLAY_REGISTRY.wall.enabled).toBe(true);
    expect(CANVAS_OVERLAY_REGISTRY.wall.label.length).toBeGreaterThan(0);
  });

  it('enabledCanvasOverlays exposes wall', () => {
    const ids = enabledCanvasOverlays().map(o => o.id);
    expect(ids).toContain('wall');
  });

  it('coerceCanvasOverlays preserves wall through a round-trip', () => {
    const input: unknown[] = ['wall', 'hypotheses'];
    expect(coerceCanvasOverlays(input)).toEqual<CanvasOverlayId[]>(['wall', 'hypotheses']);
  });

  it('coerceCanvasOverlays deduplicates wall', () => {
    expect(coerceCanvasOverlays(['wall', 'wall'])).toEqual<CanvasOverlayId[]>(['wall']);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @variscout/hooks test useCanvasInvestigationOverlays`
Expected: FAIL — `CANVAS_OVERLAY_REGISTRY.wall` is `undefined`; `coerceCanvasOverlays(['wall'])` returns `[]`.

- [ ] **Step 3: Add the union literal + registry entry**

In `packages/hooks/src/useCanvasInvestigationOverlays.ts` change line 6:

```ts
export type CanvasOverlayId =
  | 'investigations'
  | 'hypotheses'
  | 'suspected-causes'
  | 'findings'
  | 'wall';
```

And add to the `CANVAS_OVERLAY_REGISTRY` object literal (after the `findings` entry, before the closing brace at line 40):

```ts
  wall: {
    id: 'wall',
    label: 'Wall',
    enabled: true,
    description:
      'Investigation Wall projected onto the canvas. Click any hub to open the Wall destination view.',
  },
```

(The labels here are placeholders; Task 9 swaps them for i18n-resolved strings via the new `canvas.wall.*` keys. We accept the duplication for one task because the registry is a static literal that consumers read at module-init time, not in the render path.)

- [ ] **Step 4: Run tests and verify they pass**

Run: `pnpm --filter @variscout/hooks test useCanvasInvestigationOverlays`
Expected: PASS — all four new tests green; pre-existing tests in the file unaffected.

- [ ] **Step 5: Commit**

```bash
git add packages/hooks/src/useCanvasInvestigationOverlays.ts \
        packages/hooks/src/__tests__/useCanvasInvestigationOverlays.test.ts
git commit -m "feat(8e): add 'wall' to CanvasOverlayId union and registry"
```

---

## Task 2: `useHasInvestigationContent` predicate hook

**Files:**

- Create: `packages/hooks/src/useHasInvestigationContent.ts`
- Create: `packages/hooks/src/__tests__/useHasInvestigationContent.test.ts`
- Modify: `packages/hooks/src/index.ts` (export)

**Goal:** Boolean selector that returns `true` iff `(hubs.length + questions.length + findings.length) > 0`. Powers `availableOverlays` derivation in CanvasWorkspace so `'wall'` is hidden from the picker on empty graphs (spec Q2). Findings are passed in as a count rather than read from a store, since findings live in app-level feature stores outside `@variscout/stores`.

- [ ] **Step 1: Write the failing test**

Create `packages/hooks/src/__tests__/useHasInvestigationContent.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useInvestigationStore } from '@variscout/stores';
import type { Question, SuspectedCause } from '@variscout/core';
import { useHasInvestigationContent } from '../useHasInvestigationContent';

const sampleHub: SuspectedCause = {
  id: 'hub-1',
  name: 'Test hub',
  status: 'proposed',
  questionIds: [],
  findingIds: [],
  condition: { kind: 'always' },
};

const sampleQuestion: Question = {
  id: 'q-1',
  text: 'Test question',
  status: 'open',
};

describe('useHasInvestigationContent', () => {
  beforeEach(() => {
    useInvestigationStore.setState(useInvestigationStore.getInitialState());
  });

  it('returns false when graph is empty and findings count is 0', () => {
    const { result } = renderHook(() => useHasInvestigationContent({ findingsCount: 0 }));
    expect(result.current).toBe(false);
  });

  it('returns true when at least one hub exists', () => {
    useInvestigationStore.setState({ suspectedCauses: [sampleHub] });
    const { result } = renderHook(() => useHasInvestigationContent({ findingsCount: 0 }));
    expect(result.current).toBe(true);
  });

  it('returns true when at least one question exists', () => {
    useInvestigationStore.setState({ questions: [sampleQuestion] });
    const { result } = renderHook(() => useHasInvestigationContent({ findingsCount: 0 }));
    expect(result.current).toBe(true);
  });

  it('returns true when only findings count is > 0', () => {
    const { result } = renderHook(() => useHasInvestigationContent({ findingsCount: 3 }));
    expect(result.current).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @variscout/hooks test useHasInvestigationContent`
Expected: FAIL — module does not exist.

- [ ] **Step 3: Implement the hook**

Create `packages/hooks/src/useHasInvestigationContent.ts`:

```ts
import { useInvestigationStore } from '@variscout/stores';

export interface UseHasInvestigationContentArgs {
  findingsCount: number;
}

/**
 * Returns true iff the investigation graph has at least one hub, question, or
 * finding. Used to gate the canvas Wall overlay toggle (spec §4 Q2): when this
 * is false, 'wall' is filtered out of CanvasOverlayPicker.availableOverlays.
 *
 * Findings live in app-level feature stores (apps/azure/src/features/findings,
 * etc.), not in @variscout/stores. Callers pass findingsCount from their app's
 * findings selector. This keeps the hook downward-only-dependent on @variscout
 * /stores.
 */
export function useHasInvestigationContent(args: UseHasInvestigationContentArgs): boolean {
  const hubsCount = useInvestigationStore(s => s.suspectedCauses.length);
  const questionsCount = useInvestigationStore(s => s.questions.length);
  return hubsCount + questionsCount + args.findingsCount > 0;
}
```

- [ ] **Step 4: Wire the export**

Add to `packages/hooks/src/index.ts` (alphabetical position with the other `use*` exports):

```ts
export { useHasInvestigationContent } from './useHasInvestigationContent';
export type { UseHasInvestigationContentArgs } from './useHasInvestigationContent';
```

- [ ] **Step 5: Run tests and verify they pass**

Run: `pnpm --filter @variscout/hooks test useHasInvestigationContent`
Expected: PASS — all four cases green.

- [ ] **Step 6: Commit**

```bash
git add packages/hooks/src/useHasInvestigationContent.ts \
        packages/hooks/src/__tests__/useHasInvestigationContent.test.ts \
        packages/hooks/src/index.ts
git commit -m "feat(8e): add useHasInvestigationContent predicate"
```

---

## Task 3: `mode='overlay'` prop on `WallCanvas`

**Files:**

- Modify: `packages/charts/src/InvestigationWall/WallCanvas.tsx` (props interface, render gates)
- Modify: `packages/charts/src/InvestigationWall/__tests__/WallCanvas.test.tsx`

**Goal:** Add `mode?: 'destination' | 'overlay'` to `WallCanvas` (default `'destination'`, preserving existing destination-view behavior). When `mode='overlay'`: skip `MissingEvidenceDigest` render, skip `DraggableHypothesisCard` rendering even if `onComposeGate` is somehow passed (defense-in-depth — overlay callers won't pass it), and skip `EmptyState` when `hubs.length === 0` (overlay handles its own empty-state semantics in the wrapper). Click handlers stay live regardless of mode — they're just props.

`useWallHubCommentLifecycle` and the ⌘K palette are NOT subscribed inside `WallCanvas` itself; they're set up in destination-view callsites (`InvestigationWorkspace.tsx`, `InvestigationView.tsx`). The overlay caller (`<CanvasWallOverlay/>` in Task 5) simply does not subscribe them. So `mode='overlay'` only needs to gate the three internal render branches above.

- [ ] **Step 1: Write the failing test**

Add to `packages/charts/src/InvestigationWall/__tests__/WallCanvas.test.tsx`:

```ts
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { WallCanvas } from '../WallCanvas';
import type { SuspectedCause, Finding, Question } from '@variscout/core';

const hub: SuspectedCause = {
  id: 'h1',
  name: 'Test hub',
  status: 'proposed',
  questionIds: [],
  findingIds: [],
  condition: { kind: 'always' },
};

describe('WallCanvas mode prop', () => {
  it('default mode is destination — renders MissingEvidenceDigest panel', () => {
    render(
      <WallCanvas
        hubs={[hub]}
        findings={[]}
        questions={[]}
        problemCpk={0}
        eventsPerWeek={0}
        gaps={[{ id: 'g1', message: 'Gap message' }]}
      />
    );
    expect(screen.getByText('Gap message')).toBeInTheDocument();
  });

  it('mode=overlay omits MissingEvidenceDigest panel', () => {
    render(
      <WallCanvas
        hubs={[hub]}
        findings={[]}
        questions={[]}
        problemCpk={0}
        eventsPerWeek={0}
        gaps={[{ id: 'g1', message: 'Gap message' }]}
        mode="overlay"
      />
    );
    expect(screen.queryByText('Gap message')).not.toBeInTheDocument();
  });

  it('mode=overlay with empty hubs renders an empty-marker SVG (no EmptyState component)', () => {
    const { container } = render(
      <WallCanvas
        hubs={[]}
        findings={[]}
        questions={[]}
        problemCpk={0}
        eventsPerWeek={0}
        mode="overlay"
      />
    );
    // EmptyState contains the "Write a hypothesis" CTA text in destination mode.
    // Overlay mode renders an empty SVG canvas instead so the wrapper can
    // decide whether to mount at all.
    expect(screen.queryByText(/write a hypothesis/i)).not.toBeInTheDocument();
    expect(container.querySelector('svg')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @variscout/charts test WallCanvas`
Expected: FAIL — `mode` prop unrecognized; test 2 fails because the panel still renders; test 3 fails because EmptyState fires.

- [ ] **Step 3: Add the prop and gate the renders**

In `packages/charts/src/InvestigationWall/WallCanvas.tsx`, extend `WallCanvasProps` (insert before the closing `}` at line 87):

```ts
  /**
   * Render mode.
   * - `'destination'` (default): full destination-view chrome including
   *   `MissingEvidenceDigest` panel below the SVG and the dedicated
   *   `EmptyState` for zero-hub graphs.
   * - `'overlay'` (8e canvas overlay): SVG-only render; no
   *   `MissingEvidenceDigest`; empty hubs render the SVG header/footer
   *   without the EmptyState CTA panel (the overlay wrapper gates mount).
   */
  mode?: 'destination' | 'overlay';
```

In the destructured props (after `groupByTributary = false,` at line 126), add:

```ts
  mode = 'destination',
```

Replace the mobile early-return at lines 183–199 with a mode-aware version:

```tsx
if (isMobile) {
  return (
    <div className="w-full h-full flex flex-col">
      <MobileCardList
        hubs={hubs}
        findings={findings}
        questions={questions}
        processMap={processMap}
        onSelectHub={onSelectHub}
        onWriteHypothesis={onWriteHypothesis}
        onPromoteFromQuestion={onPromoteFromQuestion}
        onSeedFromFactorIntel={onSeedFromFactorIntel}
      />
      {mode === 'destination' ? (
        <MissingEvidenceDigest gaps={gaps} onFocusHub={onFocusHubFromGap} />
      ) : null}
    </div>
  );
}
```

Replace the empty-hubs early-return at lines 201–209 with a mode-aware version:

```tsx
if (hubs.length === 0) {
  if (mode === 'destination') {
    return (
      <EmptyState
        onWriteHypothesis={onWriteHypothesis}
        onPromoteFromQuestion={onPromoteFromQuestion}
        onSeedFromFactorIntel={onSeedFromFactorIntel}
      />
    );
  }
  // Overlay mode: render an SVG with header chrome only. The overlay
  // wrapper (CanvasWallOverlay) is expected to gate this branch via
  // useHasInvestigationContent — but we render defensively just in case.
  return (
    <svg
      viewBox={`0 0 ${CANVAS_W} ${CANVAS_H}`}
      preserveAspectRatio="xMidYMid meet"
      className="bg-background text-content w-full h-full"
      role="img"
      aria-label={getMessage(locale, 'wall.canvas.ariaLabel')}
    />
  );
}
```

In the `body` JSX (the `<div>` returned at lines 238–335), wrap the `<MissingEvidenceDigest>` mount in a mode check. Find:

```tsx
<MissingEvidenceDigest gaps={gaps} onFocusHub={onFocusHubFromGap} />
```

Replace with:

```tsx
{
  mode === 'destination' ? (
    <MissingEvidenceDigest gaps={gaps} onFocusHub={onFocusHubFromGap} />
  ) : null;
}
```

- [ ] **Step 4: Run tests and verify they pass**

Run: `pnpm --filter @variscout/charts test WallCanvas`
Expected: PASS — three new tests green; existing WallCanvas tests still pass (default mode preserves all behavior).

- [ ] **Step 5: Run charts package full test suite**

Run: `pnpm --filter @variscout/charts test`
Expected: PASS — no regressions across InvestigationWall component tests.

- [ ] **Step 6: Commit**

```bash
git add packages/charts/src/InvestigationWall/WallCanvas.tsx \
        packages/charts/src/InvestigationWall/__tests__/WallCanvas.test.tsx
git commit -m "feat(8e): add mode='overlay' to WallCanvas (subtractive render gates)"
```

---

## Task 4: `useSharedWallProps` hook (memoized prop assembly)

**Files:**

- Create: `packages/hooks/src/useSharedWallProps.ts`
- Create: `packages/hooks/src/__tests__/useSharedWallProps.test.ts`
- Modify: `packages/hooks/src/index.ts` (export)

**Goal:** Single source of `WallCanvas`-prop assembly that both the canvas overlay (Task 5) and the destination-view callsites can consume. Reads from `@variscout/stores` (`useInvestigationStore`, `useWallLayoutStore`) only — findings, processMap, problemCpk, and eventsPerWeek arrive as args because they're not in `@variscout/stores`. Returns a memoized object matching `WallCanvasProps` minus the click handlers (callers add their own per-surface).

This task does NOT migrate destination-view callsites to use the new hook (that's a refactor outside 8e scope per `feedback_design_aligned_fixes`). It only creates the hook for the overlay's use; if a future cleanup wants to migrate destination callers, that's a separate followup.

- [ ] **Step 1: Write the failing test**

Create `packages/hooks/src/__tests__/useSharedWallProps.test.ts`:

```ts
import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useInvestigationStore, useWallLayoutStore } from '@variscout/stores';
import type { SuspectedCause } from '@variscout/core';
import { useSharedWallProps } from '../useSharedWallProps';

const hub: SuspectedCause = {
  id: 'h1',
  name: 'Test hub',
  status: 'proposed',
  questionIds: [],
  findingIds: [],
  condition: { kind: 'always' },
};

describe('useSharedWallProps', () => {
  beforeEach(() => {
    useInvestigationStore.setState(useInvestigationStore.getInitialState());
    useWallLayoutStore.setState(useWallLayoutStore.getInitialState());
  });

  it('exposes hubs, questions, findings from args', () => {
    useInvestigationStore.setState({ suspectedCauses: [hub] });
    const { result } = renderHook(() =>
      useSharedWallProps({
        findings: [],
        problemCpk: 0,
        eventsPerWeek: 0,
        processMap: undefined,
        activeColumns: undefined,
      })
    );
    expect(result.current.hubs).toEqual([hub]);
    expect(result.current.questions).toEqual([]);
    expect(result.current.findings).toEqual([]);
  });

  it('exposes viewport (zoom, pan, groupByTributary) from useWallLayoutStore', () => {
    useWallLayoutStore.setState({ zoom: 1.5, pan: { x: 10, y: 20 }, groupByTributary: true });
    const { result } = renderHook(() =>
      useSharedWallProps({
        findings: [],
        problemCpk: 0,
        eventsPerWeek: 0,
        processMap: undefined,
        activeColumns: undefined,
      })
    );
    expect(result.current.zoom).toBe(1.5);
    expect(result.current.pan).toEqual({ x: 10, y: 20 });
    expect(result.current.groupByTributary).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @variscout/hooks test useSharedWallProps`
Expected: FAIL — module does not exist.

- [ ] **Step 3: Implement the hook**

Create `packages/hooks/src/useSharedWallProps.ts`:

```ts
import { useMemo } from 'react';
import { useInvestigationStore, useWallLayoutStore } from '@variscout/stores';
import type { Finding } from '@variscout/core';
import type { ProcessMap } from '@variscout/core/frame';

export interface UseSharedWallPropsArgs {
  findings: readonly Finding[];
  processMap: ProcessMap | undefined;
  problemCpk: number;
  eventsPerWeek: number;
  activeColumns: ReadonlyArray<string> | undefined;
}

/**
 * Memoized assembly of the data half of WallCanvasProps. Used by:
 *   1. <CanvasWallOverlay/> (8e) to render the overlay layer.
 *   2. (future) Destination-view callsites that want a shared selector instead
 *      of duplicated prop-assembly logic.
 *
 * Click handlers and `mode` are intentionally NOT included — callers wire
 * those per-surface (overlay forwards everything to onOpenWall; destination
 * wires real per-callback flows).
 */
export function useSharedWallProps(args: UseSharedWallPropsArgs) {
  const hubs = useInvestigationStore(s => s.suspectedCauses);
  const questions = useInvestigationStore(s => s.questions);
  const zoom = useWallLayoutStore(s => s.zoom);
  const pan = useWallLayoutStore(s => s.pan);
  const groupByTributary = useWallLayoutStore(s => s.groupByTributary);

  return useMemo(
    () => ({
      hubs,
      findings: args.findings,
      questions,
      processMap: args.processMap,
      problemCpk: args.problemCpk,
      eventsPerWeek: args.eventsPerWeek,
      activeColumns: args.activeColumns,
      zoom,
      pan,
      groupByTributary,
    }),
    [
      hubs,
      questions,
      args.findings,
      args.processMap,
      args.problemCpk,
      args.eventsPerWeek,
      args.activeColumns,
      zoom,
      pan,
      groupByTributary,
    ]
  );
}
```

- [ ] **Step 4: Wire the export**

Add to `packages/hooks/src/index.ts`:

```ts
export { useSharedWallProps } from './useSharedWallProps';
export type { UseSharedWallPropsArgs } from './useSharedWallProps';
```

- [ ] **Step 5: Run tests and verify they pass**

Run: `pnpm --filter @variscout/hooks test useSharedWallProps`
Expected: PASS — both cases green.

- [ ] **Step 6: Commit**

```bash
git add packages/hooks/src/useSharedWallProps.ts \
        packages/hooks/src/__tests__/useSharedWallProps.test.ts \
        packages/hooks/src/index.ts
git commit -m "feat(8e): add useSharedWallProps memoized prop assembly"
```

---

## Task 5: `<CanvasWallOverlay/>` component

**Files:**

- Create: `packages/ui/src/components/Canvas/internal/CanvasWallOverlay.tsx`
- Create: `packages/ui/src/components/Canvas/internal/__tests__/CanvasWallOverlay.test.tsx`

**Goal:** The overlay layer wrapper. Renders `WallCanvas` with `mode='overlay'` when:

1. `'wall' ∈ activeOverlays`
2. NOT mobile (`useWallIsMobile()` returns `false`)
3. content present (the parent passes `hasContent={true}` — but we double-check defensively here too)

Also handles the input-layering rule from spec Q4: when `activeCanvasTool === 'draw-hypothesis'`, the wrapper has `pointer-events: none`. All click handlers funnel into a single `onOpenWall?.()` callback.

- [ ] **Step 1: Write the failing test**

Create `packages/ui/src/components/Canvas/internal/__tests__/CanvasWallOverlay.test.tsx`:

```tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { useInvestigationStore } from '@variscout/stores';
import { CanvasWallOverlay } from '../CanvasWallOverlay';
import type { SuspectedCause } from '@variscout/core';
import { registerLocaleLoaders } from '@variscout/core/i18n';

vi.mock('@variscout/charts/InvestigationWall', async () => {
  const actual = await vi.importActual<typeof import('@variscout/charts/InvestigationWall')>(
    '@variscout/charts/InvestigationWall'
  );
  return {
    ...actual,
    useWallIsMobile: vi.fn(() => false),
  };
});

const hub: SuspectedCause = {
  id: 'h1',
  name: 'Test hub',
  status: 'proposed',
  questionIds: [],
  findingIds: [],
  condition: { kind: 'always' },
};

beforeEach(() => {
  registerLocaleLoaders(import.meta.glob('/packages/core/src/i18n/messages/locales/**/*.json'));
  useInvestigationStore.setState(useInvestigationStore.getInitialState());
});

describe('CanvasWallOverlay', () => {
  it('returns null when wall not in activeOverlays', () => {
    const { container } = render(
      <CanvasWallOverlay
        activeOverlays={['hypotheses']}
        activeCanvasTool="select"
        findings={[]}
        problemCpk={0}
        eventsPerWeek={0}
        processMap={undefined}
        activeColumns={undefined}
        onOpenWall={() => {}}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('returns null when content is empty (no hubs/questions/findings)', () => {
    const { container } = render(
      <CanvasWallOverlay
        activeOverlays={['wall']}
        activeCanvasTool="select"
        findings={[]}
        problemCpk={0}
        eventsPerWeek={0}
        processMap={undefined}
        activeColumns={undefined}
        onOpenWall={() => {}}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('returns null when mobile', async () => {
    const charts = await import('@variscout/charts/InvestigationWall');
    (charts.useWallIsMobile as ReturnType<typeof vi.fn>).mockReturnValueOnce(true);
    useInvestigationStore.setState({ suspectedCauses: [hub] });
    const { container } = render(
      <CanvasWallOverlay
        activeOverlays={['wall']}
        activeCanvasTool="select"
        findings={[]}
        problemCpk={0}
        eventsPerWeek={0}
        processMap={undefined}
        activeColumns={undefined}
        onOpenWall={() => {}}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders WallCanvas with mode=overlay when desktop + active + content', () => {
    useInvestigationStore.setState({ suspectedCauses: [hub] });
    render(
      <CanvasWallOverlay
        activeOverlays={['wall']}
        activeCanvasTool="select"
        findings={[]}
        problemCpk={0}
        eventsPerWeek={0}
        processMap={undefined}
        activeColumns={undefined}
        onOpenWall={() => {}}
      />
    );
    // EmptyState is destination-only; overlay mode renders SVG instead.
    expect(screen.queryByText(/write a hypothesis/i)).not.toBeInTheDocument();
    expect(document.querySelector('[data-testid="canvas-wall-overlay"]')).toBeInTheDocument();
  });

  it('applies pointer-events-none class when draw-hypothesis tool active', () => {
    useInvestigationStore.setState({ suspectedCauses: [hub] });
    render(
      <CanvasWallOverlay
        activeOverlays={['wall']}
        activeCanvasTool="draw-hypothesis"
        findings={[]}
        problemCpk={0}
        eventsPerWeek={0}
        processMap={undefined}
        activeColumns={undefined}
        onOpenWall={() => {}}
      />
    );
    const wrapper = document.querySelector('[data-testid="canvas-wall-overlay"]');
    expect(wrapper?.className).toMatch(/pointer-events-none/);
  });

  it('forwards hub click to onOpenWall', () => {
    useInvestigationStore.setState({ suspectedCauses: [hub] });
    const onOpenWall = vi.fn();
    render(
      <CanvasWallOverlay
        activeOverlays={['wall']}
        activeCanvasTool="select"
        findings={[]}
        problemCpk={0}
        eventsPerWeek={0}
        processMap={undefined}
        activeColumns={undefined}
        onOpenWall={onOpenWall}
      />
    );
    // Hub cards are rendered by HypothesisCard; clicking the rendered
    // hub element triggers onSelectHub → onOpenWall in our wiring.
    const hubElement = screen.getByText('Test hub');
    fireEvent.click(hubElement);
    expect(onOpenWall).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @variscout/ui test CanvasWallOverlay`
Expected: FAIL — component does not exist.

- [ ] **Step 3: Implement the component**

Create `packages/ui/src/components/Canvas/internal/CanvasWallOverlay.tsx`:

```tsx
import React from 'react';
import {
  useSharedWallProps,
  useHasInvestigationContent,
  type CanvasOverlayId,
  type CanvasToolId,
} from '@variscout/hooks';
import { WallCanvas, useWallIsMobile } from '@variscout/charts/InvestigationWall';
import type { Finding } from '@variscout/core';
import type { ProcessMap } from '@variscout/core/frame';

export interface CanvasWallOverlayProps {
  activeOverlays: CanvasOverlayId[];
  activeCanvasTool: CanvasToolId;
  findings: readonly Finding[];
  processMap: ProcessMap | undefined;
  problemCpk: number;
  eventsPerWeek: number;
  activeColumns: ReadonlyArray<string> | undefined;
  onOpenWall?: () => void;
}

/**
 * Canvas Wall overlay layer (sub-PR 8e).
 *
 * Renders `WallCanvas` with `mode='overlay'` when:
 *   - `'wall'` is in `activeOverlays`
 *   - NOT mobile (`useWallIsMobile()` is false)
 *   - investigation graph has at least one hub/question/finding
 *
 * Returns `null` otherwise. Ignores `onComposeGate` / DnD entirely; the
 * mode='overlay' path inside WallCanvas already gates `MissingEvidenceDigest`
 * + EmptyState. Click handlers funnel into a single `onOpenWall` callback;
 * V1 doesn't carry an entity id forward (spec Q1: shared viewport already
 * keeps the clicked entity in view in destination).
 *
 * Pointer events: when `activeCanvasTool === 'draw-hypothesis'`, the wrapper
 * has `pointer-events: none` so the 8d hypothesis-arrow gesture passes
 * through to underlying canvas step cards (spec Q4).
 */
export const CanvasWallOverlay: React.FC<CanvasWallOverlayProps> = ({
  activeOverlays,
  activeCanvasTool,
  findings,
  processMap,
  problemCpk,
  eventsPerWeek,
  activeColumns,
  onOpenWall,
}) => {
  const isMobile = useWallIsMobile();
  const hasContent = useHasInvestigationContent({ findingsCount: findings.length });
  const wallProps = useSharedWallProps({
    findings,
    processMap,
    problemCpk,
    eventsPerWeek,
    activeColumns,
  });

  if (!activeOverlays.includes('wall')) return null;
  if (isMobile) return null;
  if (!hasContent) return null;

  const handleAny = () => onOpenWall?.();

  const pointerEventsClass = activeCanvasTool === 'draw-hypothesis' ? 'pointer-events-none' : '';

  return (
    <div
      data-testid="canvas-wall-overlay"
      className={`absolute inset-0 z-30 ${pointerEventsClass}`}
      aria-hidden={activeCanvasTool === 'draw-hypothesis'}
    >
      <WallCanvas
        {...wallProps}
        mode="overlay"
        onSelectHub={handleAny}
        onPromoteQuestion={handleAny}
        onWriteHypothesis={handleAny}
        onPromoteFromQuestion={handleAny}
        onSeedFromFactorIntel={handleAny}
        onFocusHubFromGap={handleAny}
      />
    </div>
  );
};
```

- [ ] **Step 4: Run tests and verify they pass**

Run: `pnpm --filter @variscout/ui test CanvasWallOverlay`
Expected: PASS — all six cases green.

- [ ] **Step 5: Commit**

```bash
git add packages/ui/src/components/Canvas/internal/CanvasWallOverlay.tsx \
        packages/ui/src/components/Canvas/internal/__tests__/CanvasWallOverlay.test.tsx
git commit -m "feat(8e): add CanvasWallOverlay component (read-only Wall mirror)"
```

---

## Task 6: `WallShortcutButton` component (mobile re-skin)

**Files:**

- Create: `packages/ui/src/components/Canvas/internal/WallShortcutButton.tsx`
- Create: `packages/ui/src/components/Canvas/internal/__tests__/WallShortcutButton.test.tsx`

**Goal:** A mobile-only toolbar button that replaces the `'wall'` toggle slot below 768px. External-link glyph + label "Open Wall". Click invokes `onOpenWall`. Hidden when content is empty (parent will gate this; defense-in-depth not needed since the parent's predicate is the same `useHasInvestigationContent`).

- [ ] **Step 1: Write the failing test**

Create `packages/ui/src/components/Canvas/internal/__tests__/WallShortcutButton.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { WallShortcutButton } from '../WallShortcutButton';

describe('WallShortcutButton', () => {
  it('renders with external-link icon and "Open Wall" label', () => {
    render(<WallShortcutButton onClick={() => {}} />);
    expect(screen.getByRole('button', { name: /open wall/i })).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const onClick = vi.fn();
    render(<WallShortcutButton onClick={onClick} />);
    fireEvent.click(screen.getByRole('button', { name: /open wall/i }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('respects disabled prop', () => {
    const onClick = vi.fn();
    render(<WallShortcutButton onClick={onClick} disabled />);
    const btn = screen.getByRole('button', { name: /open wall/i });
    expect(btn).toBeDisabled();
    fireEvent.click(btn);
    expect(onClick).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @variscout/ui test WallShortcutButton`
Expected: FAIL — component does not exist.

- [ ] **Step 3: Implement the component**

Create `packages/ui/src/components/Canvas/internal/WallShortcutButton.tsx`:

```tsx
import React from 'react';
import { ExternalLink } from 'lucide-react';

export interface WallShortcutButtonProps {
  onClick: () => void;
  disabled?: boolean;
}

/**
 * Mobile-only canvas toolbar button (sub-PR 8e). Replaces the 'wall' overlay
 * toggle slot below 768px. Click navigates the user to the Investigation tab
 * → Wall destination view (the canonical mobile Wall path), since layered
 * canvas overlays would obscure the canvas on small screens (spec Q6).
 */
export const WallShortcutButton: React.FC<WallShortcutButtonProps> = ({ onClick, disabled }) => {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      data-testid="canvas-wall-shortcut-button"
      className="inline-flex items-center gap-1 rounded-md border border-edge bg-surface-primary px-2 py-1 text-xs font-medium text-content-secondary hover:bg-surface-secondary disabled:opacity-50 disabled:cursor-not-allowed"
      aria-label="Open Wall"
      title="Open the Investigation Wall (destination view)"
    >
      <span>Open Wall</span>
      <ExternalLink size={14} aria-hidden="true" />
    </button>
  );
};
```

- [ ] **Step 4: Run tests and verify they pass**

Run: `pnpm --filter @variscout/ui test WallShortcutButton`
Expected: PASS — three cases green.

- [ ] **Step 5: Commit**

```bash
git add packages/ui/src/components/Canvas/internal/WallShortcutButton.tsx \
        packages/ui/src/components/Canvas/internal/__tests__/WallShortcutButton.test.tsx
git commit -m "feat(8e): add WallShortcutButton (mobile re-skin of wall overlay slot)"
```

---

## Task 7: Extend `CanvasOverlayPicker` with `availableOverlays` prop

**Files:**

- Modify: `packages/ui/src/components/Canvas/internal/CanvasOverlayPicker.tsx`
- Create: `packages/ui/src/components/Canvas/internal/__tests__/CanvasOverlayPicker.test.tsx`

**Goal:** Allow the parent (Canvas) to filter which overlays show in the picker. Backwards-compatible: when `availableOverlays` is omitted, picker shows all enabled overlays (existing behavior). When provided, picker shows only the intersection of `enabledCanvasOverlays()` and `availableOverlays`.

- [ ] **Step 1: Write the failing test**

Create `packages/ui/src/components/Canvas/internal/__tests__/CanvasOverlayPicker.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CanvasOverlayPicker } from '../CanvasOverlayPicker';

describe('CanvasOverlayPicker availableOverlays prop', () => {
  it('shows all enabled overlays by default', () => {
    render(<CanvasOverlayPicker activeOverlays={[]} />);
    expect(screen.getByRole('button', { name: /investigations overlay/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /hypotheses overlay/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /suspected causes overlay/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /findings overlay/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /wall overlay/i })).toBeInTheDocument();
  });

  it('omits overlays not in availableOverlays', () => {
    render(
      <CanvasOverlayPicker
        activeOverlays={[]}
        availableOverlays={['investigations', 'hypotheses', 'suspected-causes', 'findings']}
      />
    );
    expect(screen.queryByRole('button', { name: /wall overlay/i })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /investigations overlay/i })).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @variscout/ui test CanvasOverlayPicker`
Expected: FAIL — first test fails because the registry now has `'wall'` (Task 1) but the picker has no filter; second test fails because `availableOverlays` prop doesn't exist.

- [ ] **Step 3: Add the prop and filter**

Modify `packages/ui/src/components/Canvas/internal/CanvasOverlayPicker.tsx`:

```tsx
import React from 'react';
import {
  coerceCanvasOverlays,
  enabledCanvasOverlays,
  type CanvasOverlayId,
} from '@variscout/hooks';

interface CanvasOverlayPickerProps {
  activeOverlays: CanvasOverlayId[];
  /**
   * When provided, restricts the rendered toggle list to the intersection of
   * `enabledCanvasOverlays()` and this prop. Used by the canvas to hide the
   * 'wall' toggle on empty graphs (spec §4 Q2).
   */
  availableOverlays?: CanvasOverlayId[];
  onToggle?: (overlay: CanvasOverlayId) => void;
}

export const CanvasOverlayPicker: React.FC<CanvasOverlayPickerProps> = ({
  activeOverlays,
  availableOverlays,
  onToggle,
}) => {
  const active = coerceCanvasOverlays(activeOverlays);
  const allowed = availableOverlays ? new Set(availableOverlays) : null;
  const overlaysToRender = enabledCanvasOverlays().filter(o =>
    allowed ? allowed.has(o.id) : true
  );

  return (
    <div className="flex flex-wrap items-center gap-1" data-testid="canvas-overlay-picker">
      {overlaysToRender.map(overlay => {
        const pressed = active.includes(overlay.id);
        return (
          <button
            key={overlay.id}
            type="button"
            className={`rounded-md border px-2 py-1 text-xs font-medium ${
              pressed
                ? 'border-status-info bg-status-info-soft text-status-info'
                : 'border-edge bg-surface-primary text-content-secondary hover:bg-surface-secondary'
            }`}
            aria-pressed={pressed}
            aria-label={`${overlay.label} overlay`}
            title={overlay.description}
            onClick={() => onToggle?.(overlay.id)}
          >
            {overlay.label}
          </button>
        );
      })}
    </div>
  );
};
```

- [ ] **Step 4: Run tests and verify they pass**

Run: `pnpm --filter @variscout/ui test CanvasOverlayPicker`
Expected: PASS — both cases green.

- [ ] **Step 5: Commit**

```bash
git add packages/ui/src/components/Canvas/internal/CanvasOverlayPicker.tsx \
        packages/ui/src/components/Canvas/internal/__tests__/CanvasOverlayPicker.test.tsx
git commit -m "feat(8e): add availableOverlays filter to CanvasOverlayPicker"
```

---

## Task 8: Wire overlay + shortcut into `<Canvas/>` and `CanvasWorkspace`

**Files:**

- Modify: `packages/ui/src/components/Canvas/index.tsx`
- Modify: `packages/ui/src/components/Canvas/CanvasWorkspace.tsx`
- Modify: `packages/ui/src/components/Canvas/__tests__/Canvas.test.tsx`
- Modify: `packages/ui/src/components/Canvas/__tests__/CanvasWorkspace.test.tsx`

**Goal:** Add `onOpenWall`, `findings`, `processMap`, `problemCpk`, `eventsPerWeek`, `activeColumns` props to `Canvas`. Mount `<CanvasWallOverlay/>` inside the canvas card-surface section. Compute `availableOverlays` from `useHasInvestigationContent()` and `useWallIsMobile()` — derive at the `Canvas` level so the picker filters correctly. On mobile, render `<WallShortcutButton/>` in the toolbar instead of (or in addition to) the picker; on desktop render the picker.

`CanvasWorkspace` threads the new props through from its caller (FrameView in PWA + Azure).

- [ ] **Step 1: Write the failing tests**

Add to `packages/ui/src/components/Canvas/__tests__/Canvas.test.tsx`:

```tsx
// Add at top of file alongside existing mocks
vi.mock('@variscout/charts/InvestigationWall', async () => {
  const actual = await vi.importActual<typeof import('@variscout/charts/InvestigationWall')>(
    '@variscout/charts/InvestigationWall'
  );
  return { ...actual, useWallIsMobile: vi.fn(() => false) };
});

describe('Canvas wall overlay integration', () => {
  // Use the existing Canvas test factory / fixture pattern; if the file
  // already has a `renderCanvas(props)` helper, reuse it.

  it('passes availableOverlays excluding wall when content empty', () => {
    // Render Canvas with hasContent=false (no hubs/questions/findings).
    // Assert the wall overlay button is NOT in the picker.
    // (Replace the placeholder render below with the existing test factory.)
    renderCanvas({ findings: [], /* ...minimum required props... */ onOpenWall: () => {} });
    expect(screen.queryByRole('button', { name: /wall overlay/i })).not.toBeInTheDocument();
  });

  it('mounts CanvasWallOverlay when wall is active and content exists', () => {
    useInvestigationStore.setState({
      suspectedCauses: [
        {
          id: 'h1',
          name: 'Hub',
          status: 'proposed',
          questionIds: [],
          findingIds: [],
          condition: { kind: 'always' },
        },
      ],
    });
    renderCanvas({
      findings: [],
      activeOverlays: ['wall'],
      onOpenWall: () => {},
      /* ...minimum required props... */
    });
    expect(document.querySelector('[data-testid="canvas-wall-overlay"]')).toBeInTheDocument();
  });

  it('renders WallShortcutButton instead of wall toggle on mobile', async () => {
    const charts = await import('@variscout/charts/InvestigationWall');
    (charts.useWallIsMobile as ReturnType<typeof vi.fn>).mockReturnValueOnce(true);
    useInvestigationStore.setState({
      suspectedCauses: [
        {
          id: 'h1',
          name: 'Hub',
          status: 'proposed',
          questionIds: [],
          findingIds: [],
          condition: { kind: 'always' },
        },
      ],
    });
    renderCanvas({ findings: [], onOpenWall: vi.fn() /* ... */ });
    expect(screen.queryByRole('button', { name: /wall overlay/i })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /open wall/i })).toBeInTheDocument();
  });

  it('WallShortcutButton on mobile invokes onOpenWall', async () => {
    const charts = await import('@variscout/charts/InvestigationWall');
    (charts.useWallIsMobile as ReturnType<typeof vi.fn>).mockReturnValueOnce(true);
    useInvestigationStore.setState({
      suspectedCauses: [
        {
          id: 'h1',
          name: 'Hub',
          status: 'proposed',
          questionIds: [],
          findingIds: [],
          condition: { kind: 'always' },
        },
      ],
    });
    const onOpenWall = vi.fn();
    renderCanvas({ findings: [], onOpenWall /* ... */ });
    fireEvent.click(screen.getByRole('button', { name: /open wall/i }));
    expect(onOpenWall).toHaveBeenCalledTimes(1);
  });
});
```

If the existing Canvas.test.tsx does not have a `renderCanvas` helper, define one at the top of the new `describe` block that supplies the minimum required `CanvasProps` (use the existing Canvas test fixtures for inspiration).

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm --filter @variscout/ui test Canvas`
Expected: FAIL — `Canvas` doesn't accept `onOpenWall`/`findings` etc.; the overlay isn't rendered; `WallShortcutButton` doesn't render on mobile.

- [ ] **Step 3: Add props to `CanvasProps` interface**

In `packages/ui/src/components/Canvas/index.tsx`, extend the `CanvasProps` interface (around line 92–158) with:

```ts
  /**
   * Findings count surfaces fed into the canvas Wall overlay (8e). Findings
   * live in app-level feature stores outside @variscout/stores; the parent
   * (CanvasWorkspace → FrameView) sources this from its app's findings store.
   */
  findings?: ReadonlyArray<import('@variscout/core').Finding>;
  problemCpk?: number;
  eventsPerWeek?: number;
  activeColumns?: ReadonlyArray<string>;
  /**
   * Per-app callback invoked when:
   *   - a hub/question/finding inside the Wall overlay is clicked; OR
   *   - the mobile WallShortcutButton is clicked.
   * Apps wire this to navigate to the Investigation tab → Wall sub-tab. See
   * spec §3 Q1 + §8 Q6.
   */
  onOpenWall?: () => void;
```

- [ ] **Step 4: Add new imports + derive `availableOverlays` and `isMobile`**

In `packages/ui/src/components/Canvas/index.tsx`, near the top:

```ts
import { useHasInvestigationContent } from '@variscout/hooks';
import { useWallIsMobile } from '@variscout/charts/InvestigationWall';
import { CanvasWallOverlay } from './internal/CanvasWallOverlay';
import { WallShortcutButton } from './internal/WallShortcutButton';
```

Inside the `Canvas` component body (after the existing `resolvedOverlays` derivation, around line 200), add:

```tsx
const findings = props.findings ?? [];
const hasContent = useHasInvestigationContent({ findingsCount: findings.length });
const isMobile = useWallIsMobile();

// Wall overlay is only available when content exists.
const availableOverlays = React.useMemo<CanvasOverlayId[]>(() => {
  const all: CanvasOverlayId[] = ['investigations', 'hypotheses', 'suspected-causes', 'findings'];
  if (hasContent) all.push('wall');
  return all;
}, [hasContent]);
```

Note: `props.findings` here assumes the destructuring at the top of the component is updated to leave the remaining props on a `props` reference. If destructuring lists every prop individually (the existing pattern in this file), name the new ones in the destructure: `findings = [], problemCpk = 0, eventsPerWeek = 0, activeColumns, onOpenWall,` and replace the `props.findings` reference above with the destructured `findings` name.

- [ ] **Step 5: Pass `availableOverlays` to `CanvasOverlayPicker` and gate the mobile shortcut**

Find the toolbar JSX (around line 583–597 — the `<CanvasOverlayPicker>` mount) and replace:

```tsx
<CanvasOverlayPicker activeOverlays={resolvedOverlays} onToggle={onOverlayToggle} />
<HypothesisDrawToolButton ... />
```

with:

```tsx
{!isMobile ? (
  <CanvasOverlayPicker
    activeOverlays={resolvedOverlays}
    availableOverlays={availableOverlays}
    onToggle={onOverlayToggle}
  />
) : (
  <CanvasOverlayPicker
    activeOverlays={resolvedOverlays}
    availableOverlays={availableOverlays.filter(id => id !== 'wall')}
    onToggle={onOverlayToggle}
  />
)}
{isMobile && hasContent && onOpenWall ? (
  <WallShortcutButton onClick={onOpenWall} disabled={disabled} />
) : null}
<HypothesisDrawToolButton ... />
```

- [ ] **Step 6: Mount `<CanvasWallOverlay/>` inside the card-surface section**

Find the card-surface `<section>` (around line 606–693 — the one with `data-testid="canvas-card-surface"`). It currently contains the per-step badge SVG, the rubber-band SVG, the step-card grid, and the popover. Add `<CanvasWallOverlay/>` inside this section, positioned inside the relative wrapper, just above the `<HypothesisDraftPopover>` mount:

```tsx
<CanvasWallOverlay
  activeOverlays={resolvedOverlays}
  activeCanvasTool={activeCanvasTool}
  findings={findings}
  processMap={map}
  problemCpk={problemCpk ?? 0}
  eventsPerWeek={eventsPerWeek ?? 0}
  activeColumns={activeColumns}
  onOpenWall={onOpenWall}
/>
```

(The overlay's `<div>` has `absolute inset-0 z-30`, so it tiles the entire card-surface region. Existing per-step badge SVG is `z-10`; rubber-band is `z-20`; overlay sits above both, below the hypothesis-tool's invisible top-layer when active.)

- [ ] **Step 7: Thread props through `CanvasWorkspace`**

Modify `packages/ui/src/components/Canvas/CanvasWorkspace.tsx`:

In the `CanvasWorkspaceProps` interface (search for `interface CanvasWorkspaceProps`), add:

```ts
findings?: ReadonlyArray<import('@variscout/core').Finding>;
problemCpk?: number;
eventsPerWeek?: number;
activeColumns?: ReadonlyArray<string>;
onOpenWall?: () => void;
```

In the `CanvasWorkspace` component destructuring add the new param names. In the `<Canvas .../>` mount (around line 444–498), pass them:

```tsx
<Canvas
  ...existing props...
  findings={findings}
  problemCpk={problemCpk}
  eventsPerWeek={eventsPerWeek}
  activeColumns={activeColumns}
  onOpenWall={onOpenWall}
/>
```

- [ ] **Step 8: Run tests and verify they pass**

Run: `pnpm --filter @variscout/ui test Canvas`
Expected: PASS — four new cases green; existing tests still green.

Also run: `pnpm --filter @variscout/ui test CanvasWorkspace`
Expected: PASS — existing tests unaffected. (Add a single smoke test in CanvasWorkspace.test.tsx threading `onOpenWall` through if no test currently exercises the new param.)

- [ ] **Step 9: Run UI package full test suite**

Run: `pnpm --filter @variscout/ui test`
Expected: PASS — no regressions.

- [ ] **Step 10: Commit**

```bash
git add packages/ui/src/components/Canvas/index.tsx \
        packages/ui/src/components/Canvas/CanvasWorkspace.tsx \
        packages/ui/src/components/Canvas/__tests__/Canvas.test.tsx \
        packages/ui/src/components/Canvas/__tests__/CanvasWorkspace.test.tsx
git commit -m "feat(8e): wire CanvasWallOverlay + WallShortcutButton into Canvas"
```

---

## Task 9: i18n keys for the new strings

**Files:**

- Modify: `packages/core/src/i18n/messages/canvas.ts` (or create if missing — check first with `ls packages/core/src/i18n/messages/`)
- Modify: `packages/core/src/i18n/__tests__/canvas-messages.test.ts` (or the closest existing message-presence test pattern)
- Modify: `packages/hooks/src/useCanvasInvestigationOverlays.ts` (registry strings → resolve via `getMessage`)
- Modify: `packages/ui/src/components/Canvas/internal/WallShortcutButton.tsx` (label + title via `getMessage`)
- Modify: `packages/ui/src/components/Canvas/internal/CanvasWallOverlay.tsx` (no string surface — skip)

**Goal:** Per `feedback_terminology_consistency` and `adding-i18n-messages`, all user-facing strings flow through `getMessage(locale, key)`. Add three new keys in `canvas.*` namespace.

- [ ] **Step 1: Locate the canvas message catalog**

Run: `ls packages/core/src/i18n/messages/ | grep -i canvas` — locate the existing canvas catalog file. If none exists, choose the closest namespace (likely `wall.ts` or a shared `canvas.ts` file based on the `wall.canvas.ariaLabel` key already used in WallCanvas).

If `canvas.ts` does NOT exist, run `grep -l "wall.canvas.ariaLabel" packages/core/src/i18n/messages/` to locate the existing namespace. Add the new keys in the same file.

- [ ] **Step 2: Write the failing test**

Add to the appropriate i18n test file (e.g., `packages/core/src/i18n/__tests__/canvas-messages.test.ts`):

```ts
import { describe, it, expect, beforeAll } from 'vitest';
import { registerLocaleLoaders, preloadLocale, getMessage } from '@variscout/core/i18n';

beforeAll(async () => {
  registerLocaleLoaders(import.meta.glob('/packages/core/src/i18n/messages/locales/**/*.json'));
  await preloadLocale('en');
});

describe('canvas wall overlay i18n keys', () => {
  it('canvas.wall.overlayLabel resolves', () => {
    expect(getMessage('en', 'canvas.wall.overlayLabel' as any)).toBe('Wall');
  });
  it('canvas.wall.overlayDescription resolves', () => {
    const msg = getMessage('en', 'canvas.wall.overlayDescription' as any);
    expect(msg).toMatch(/wall/i);
    expect(msg).toMatch(/click/i);
  });
  it('canvas.wall.shortcutLabel resolves', () => {
    expect(getMessage('en', 'canvas.wall.shortcutLabel' as any)).toBe('Open Wall');
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `pnpm --filter @variscout/core test canvas-messages`
Expected: FAIL — keys not registered.

- [ ] **Step 4: Add the keys to the catalog**

In the canvas message catalog (e.g., `packages/core/src/i18n/messages/canvas.ts` or wherever `wall.canvas.ariaLabel` lives), add:

```ts
'canvas.wall.overlayLabel': 'Wall',
'canvas.wall.overlayDescription': 'Investigation Wall projected onto the canvas. Click any hub to open the Wall destination view.',
'canvas.wall.shortcutLabel': 'Open Wall',
```

If the existing catalog uses typed keys (look for a `MessageKey` union or similar), add the three new keys to the union too.

If localized JSON loader files exist (e.g., `locales/en.json`), add the keys there:

```json
{
  "canvas": {
    "wall": {
      "overlayLabel": "Wall",
      "overlayDescription": "Investigation Wall projected onto the canvas. Click any hub to open the Wall destination view.",
      "shortcutLabel": "Open Wall"
    }
  }
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `pnpm --filter @variscout/core test canvas-messages`
Expected: PASS — three keys resolve.

- [ ] **Step 6: Update `CANVAS_OVERLAY_REGISTRY.wall` to use i18n keys at consumer time**

In `packages/hooks/src/useCanvasInvestigationOverlays.ts`, the registry's `label` and `description` are static strings consumed by `CanvasOverlayPicker` for `aria-label` and `title`. There are two implementation paths:

**Path A (preferred):** keep registry static, but switch the picker to call `getMessage(locale, key)` for the `'wall'` entry specifically. This avoids loader-init coupling at registry-import time.

In `packages/ui/src/components/Canvas/internal/CanvasOverlayPicker.tsx`, accept `locale` as an optional prop (defaulting to a sensible value or via a context); resolve the wall entry's strings through `getMessage`. Other overlays continue to use their hard-coded English strings until a separate i18n migration (out of 8e scope).

**Path B (simpler, accepted for 8e):** leave the registry's hard-coded English strings as-is for the `'wall'` entry and rely on the i18n keys only for `WallShortcutButton`. Tests pass; user-visible strings are correct in English. Migrating all four pre-existing overlays to i18n is outside 8e scope per `feedback_design_aligned_fixes` (don't refactor unrelated code).

**Lock Path B for 8e.** Skip changes to the registry. The keys exist in the catalog for future use and for `WallShortcutButton`.

- [ ] **Step 7: Update `WallShortcutButton` to use i18n keys**

In `packages/ui/src/components/Canvas/internal/WallShortcutButton.tsx`, replace the hard-coded label + title with i18n lookups:

```tsx
import React from 'react';
import { ExternalLink } from 'lucide-react';
import { useLocale } from '@variscout/core/i18n'; // verify exact import path
import { getMessage } from '@variscout/core/i18n';

export interface WallShortcutButtonProps {
  onClick: () => void;
  disabled?: boolean;
}

export const WallShortcutButton: React.FC<WallShortcutButtonProps> = ({ onClick, disabled }) => {
  const locale = useLocale(); // OR pass as prop if no hook exists
  const label = getMessage(locale, 'canvas.wall.shortcutLabel' as any);
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      data-testid="canvas-wall-shortcut-button"
      className="inline-flex items-center gap-1 rounded-md border border-edge bg-surface-primary px-2 py-1 text-xs font-medium text-content-secondary hover:bg-surface-secondary disabled:opacity-50 disabled:cursor-not-allowed"
      aria-label={label}
      title={label}
    >
      <span>{label}</span>
      <ExternalLink size={14} aria-hidden="true" />
    </button>
  );
};
```

If `useLocale` does not exist as a hook, pass `locale` as a prop and add it to `WallShortcutButtonProps`. Update Task 6's tests to register locale loaders before rendering (per `.claude/rules/testing.md`: each test file must register its own loader).

- [ ] **Step 8: Run tests and verify they pass**

Run: `pnpm --filter @variscout/ui test WallShortcutButton`
Expected: PASS — Task 6's tests still pass under the new i18n-resolved strings (because the strings resolve to "Open Wall" exactly).

- [ ] **Step 9: Commit**

```bash
git add packages/core/src/i18n/messages/ \
        packages/core/src/i18n/__tests__/canvas-messages.test.ts \
        packages/ui/src/components/Canvas/internal/WallShortcutButton.tsx \
        packages/ui/src/components/Canvas/internal/__tests__/WallShortcutButton.test.tsx
git commit -m "feat(8e): add i18n keys for canvas Wall overlay strings"
```

---

## Task 10: Wire `onOpenWall` in PWA + Azure FrameViews

**Files:**

- Modify: `apps/azure/src/components/editor/FrameView.tsx`
- Modify: `apps/pwa/src/components/views/FrameView.tsx`

**Goal:** Provide each app's wiring for `onOpenWall`. Azure: set `panelsStore.investigationViewMode = 'map'` + `wallLayoutStore.viewMode = 'wall'`. PWA: route to Investigation view + set `wallLayoutStore.viewMode = 'wall'`. Also pass `findings` (from each app's findings store) into `CanvasWorkspace`.

- [ ] **Step 1: Verify Azure navigation API**

Run: `grep -n "setInvestigationViewMode\|setView\|navigate" apps/azure/src/components/editor/FrameView.tsx apps/azure/src/pages/Dashboard.tsx | head -10` — locate how the app currently switches between Frame/Investigation views.

Expected output: identifies the action that switches the user from Frame to Investigation. In Azure this is typically `panelsStore.setInvestigationViewMode('map')` PLUS the parent (Dashboard) determining which tab/section is rendered. If Dashboard owns the tab selection (Frame vs Investigation vs Improvement), the FrameView's `onOpenWall` needs to either invoke a Dashboard-level callback or trigger a route change.

**Decision (lock at plan time):** if Dashboard exposes a `setActiveTab('investigation')`-style action, FrameView accepts an `onNavigateToInvestigation` callback prop and calls it from `onOpenWall`. If no such action exists, FrameView reaches into the global router/store directly. Use the implementation that matches the existing pattern in InvestigationWorkspace's mount path.

- [ ] **Step 2: Wire `onOpenWall` in Azure FrameView**

Modify `apps/azure/src/components/editor/FrameView.tsx`:

Add imports near the top:

```ts
import { useFindingsStore } from '../../features/findings/findingsStore';
import { usePanelsStore } from '../../features/panels/panelsStore';
import { useWallLayoutStore } from '@variscout/stores';
```

Inside the FrameView component body:

```ts
const findings = useFindingsStore(s => s.findings);
const setInvestigationViewMode = usePanelsStore(s => s.setInvestigationViewMode);
const setWallViewMode = useWallLayoutStore(s => s.setViewMode);

const handleOpenWall = React.useCallback(() => {
  setInvestigationViewMode('map');
  setWallViewMode('wall');
  // If a tab-switch action exists on Dashboard or app-level routing, call
  // it here too. If FrameView is mounted only when the active tab is
  // already 'investigation', no further action needed.
}, [setInvestigationViewMode, setWallViewMode]);
```

Pass `findings` and `onOpenWall` to `CanvasWorkspace`:

```tsx
<CanvasWorkspace
  ...existing props...
  findings={findings}
  onOpenWall={handleOpenWall}
/>
```

- [ ] **Step 3: Wire `onOpenWall` in PWA FrameView**

Modify `apps/pwa/src/components/views/FrameView.tsx` similarly:

```ts
import { useFindingsStore } from '../../features/findings/findingsStore'; // verify path
import { useWallLayoutStore } from '@variscout/stores';
// Plus the PWA's view-routing action — locate via grep below

const findings = useFindingsStore(s => s.findings);
const setWallViewMode = useWallLayoutStore(s => s.setViewMode);

const handleOpenWall = React.useCallback(() => {
  setWallViewMode('wall');
  // PWA: navigate to Investigation view. Locate the existing route action
  // via `grep -n "setActiveView\|navigate\|setView" apps/pwa/src/components/views/FrameView.tsx
  // apps/pwa/src/state/`. Call it with the Investigation view id.
}, [setWallViewMode]);
```

Pass `findings` and `onOpenWall` to `CanvasWorkspace` (note: PWA's FrameView mounts CanvasWorkspace with a different prop signature — keep parity with the Azure version above).

- [ ] **Step 4: Compile-check both apps**

Run: `pnpm --filter @variscout/azure-app build && pnpm --filter @variscout/pwa-app build`
Expected: PASS. If type errors surface around the new `findings`/`onOpenWall` props on `CanvasWorkspace`, verify Task 8's `CanvasWorkspaceProps` extension landed.

- [ ] **Step 5: Run app test suites**

Run: `pnpm --filter @variscout/azure-app test && pnpm --filter @variscout/pwa-app test`
Expected: PASS — no regressions in either app's test suite.

- [ ] **Step 6: Commit**

```bash
git add apps/azure/src/components/editor/FrameView.tsx \
        apps/pwa/src/components/views/FrameView.tsx
git commit -m "feat(8e): wire onOpenWall + findings in PWA + Azure FrameViews"
```

---

## Task 11: Chrome walk + close investigations.md entry

**Files:**

- Modify: `docs/investigations.md`

**Goal:** Verify the overlay end-to-end in a real browser before merge per `feedback_verify_before_push` and `feedback_know_your_tools`. The 8e brainstorm closed a `docs/investigations.md` entry; mark it resolved.

- [ ] **Step 1: Start the PWA dev server**

Run: `pnpm dev` (from repo root, in a foreground terminal — leave running)
Expected: PWA available at http://localhost:5173.

- [ ] **Step 2: Walk the desktop overlay path with `--chrome`**

In a separate terminal, launch Claude with the `--chrome` extension (`claude --chrome` or use the existing chrome session). Navigate the live PWA:

1. Load a seeded investigation (use the syringe-barrel showcase per `reference_chrome_walkthrough_template`).
2. Switch to Frame tab. Verify the canvas shows step cards.
3. Open the canvas overlay picker — verify the `'Wall'` toggle is visible (because the showcase has hubs/questions/findings).
4. Click `'Wall'` toggle. Verify a `<CanvasWallOverlay/>` mounts above the step cards. Visual check: hubs render as cards, problem-condition card on top, tributary footer at bottom.
5. Pan inside the overlay. Switch to Investigation tab → Wall sub-tab. Verify the destination view's viewport matches what you panned to.
6. Pan inside the destination view. Switch back to Frame tab. Verify the overlay shows the same panned viewport.
7. Click a hub card inside the overlay. Verify the app navigates to Investigation tab → Wall sub-tab.

- [ ] **Step 3: Walk the 8d compatibility path**

1. With overlay still on, click the Draw Hypothesis tool button.
2. Verify the overlay layer becomes pointer-transparent (cursor changes to crosshair on hover over the canvas surface, hub cards no longer respond to clicks).
3. Draw a hypothesis arrow between two canvas step cards underneath the overlay. Verify the arrow commits via the existing 8d popover.
4. Deactivate the Draw Hypothesis tool. Verify hub cards inside the overlay regain click-to-drill behavior.

- [ ] **Step 4: Walk the empty-state path**

1. Load a brand-new project (empty hub list, no questions, no findings).
2. Open the Frame tab. Verify the canvas overlay picker does NOT show the `'Wall'` toggle.
3. Add a single question via the Investigation tab.
4. Return to Frame. Verify the `'Wall'` toggle now appears.

- [ ] **Step 5: Walk the mobile fallback path**

1. Resize the browser viewport to <768px (DevTools → device toolbar → iPhone or similar).
2. Open the Frame tab. Verify the `'Wall'` toggle is replaced by an "Open Wall ↗" link button.
3. Click the link button. Verify navigation to Investigation tab → Wall sub-tab (which itself shows `MobileCardList`).
4. Resize back to ≥768px. Verify the toolbar reverts to the toggle picker.

- [ ] **Step 6: Mark the investigations entry resolved**

In `docs/investigations.md`, find the entry referencing _"Canvas Wall overlay is badge projection, not 'same data, two views' mirror (vision §5.6)"_ (pinned 2026-05-06 from the canvas PR4c–PR6 retrospective). Append `[RESOLVED 2026-05-08 — sub-PR 8e]` and a one-line note pointing to the spec.

- [ ] **Step 7: Commit**

```bash
git add docs/investigations.md
git commit -m "docs(8e): mark Wall overlay investigations.md entry resolved"
```

---

## Task 12: PR-ready check + final code review

**Files:** none (read-only verification step)

**Goal:** Run the standard PR-ready check (`scripts/pr-ready-check.sh`), invoke the final code-reviewer subagent (Opus per master plan D6), and only then push the branch + open the PR.

- [ ] **Step 1: Sync the branch to current main**

```bash
git fetch origin
git log HEAD..origin/main --oneline | wc -l
```

If ≥10 commits drift, merge main first per CLAUDE.md "Workflow" guidance.

- [ ] **Step 2: Run the PR-ready check**

```bash
bash scripts/pr-ready-check.sh
```

Expected: all checks green (build + lint + typecheck + tests + docs:check). If any fail, fix before continuing.

- [ ] **Step 3: Dispatch the final code-reviewer subagent**

Per master plan D6 + `feedback_subagent_driven_default`, dispatch the final code-reviewer using the `feature-dev:code-reviewer` agent type with Opus model. The reviewer reads the spec + this plan + the diff and produces a confidence-graded list of issues.

If the reviewer flags any issues with confidence ≥ "high", address them in the same PR per `feedback_bundle_followups_pre_merge`.

- [ ] **Step 4: Push and open the PR**

```bash
git push -u origin canvas-pr8-8e-wall-overlay
gh pr create --title "Canvas Wall overlay (PR8 sub-PR 8e)" --body "$(cat <<'EOF'
## Summary
- Embeds `WallCanvas` viewport as a read-only canvas overlay layer per vision §5.6 dual-home (Fork 1, vision honored verbatim).
- Click-to-drill from overlay → Investigation tab → Wall destination view.
- Viewport-adaptive mobile re-skin: <768px shows "Open Wall ↗" navigation button.
- Shared `useWallLayoutStore` viewport — pan/zoom mirrors live across overlay + destination.

## Spec
`docs/superpowers/specs/2026-05-08-canvas-wall-overlay-design.md`

## Test plan
- [x] Unit: `useCanvasInvestigationOverlays` round-trips `'wall'`.
- [x] Unit: `useHasInvestigationContent` returns true/false correctly.
- [x] Unit: `useSharedWallProps` exposes hubs/questions/viewport.
- [x] Unit: `WallCanvas` `mode='overlay'` skips `MissingEvidenceDigest` + `EmptyState`.
- [x] Unit: `CanvasWallOverlay` mounts only when active + desktop + content; `pointer-events: none` while draw-hypothesis active.
- [x] Unit: `WallShortcutButton` invokes `onClick`.
- [x] Unit: `CanvasOverlayPicker` filters by `availableOverlays`.
- [x] Integration: Canvas mounts overlay/shortcut correctly per breakpoint + content state.
- [x] Chrome walk (desktop overlay, 8d compat, empty state, mobile fallback).

🤖 Generated with [ruflo](https://github.com/ruvnet/ruflo)
EOF
)"
```

- [ ] **Step 5: Verify investigations.md entry, decision-log entry, and spec status**

Manually verify:

- `docs/investigations.md` has the `[RESOLVED 2026-05-08 — sub-PR 8e]` marker.
- `docs/decision-log.md` 2026-05-08 entry already exists (from spec commit).
- Spec status remains `active` until the PR merges; promotion to `delivered` happens in a followup commit after merge per `maintaining-documentation` skill conventions.
