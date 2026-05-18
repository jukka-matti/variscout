---
tier: ephemeral
purpose: build
title: 'PR-WV1-4 — Canvas Response Paths (5→3) + Handoff Retirement'
status: draft
last-reviewed: 2026-05-16
parent: docs/superpowers/plans/2026-05-16-wedge-implementation.md
related:
  - docs/superpowers/specs/2026-05-16-wedge-architecture-design.md
  - docs/07-decisions/adr-080-sustainment-auto-fire-pattern.md
  - docs/07-decisions/adr-082-wedge-architecture.md
layer: spec
---

# PR-WV1-4 — Canvas Response Paths (5→3) + Handoff Retirement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. Sonnet for implementer + reviewers; Opus for the final-branch code review only.

**Goal:** Reduce the canvas drill response-path menu from 5 CTAs to 3 (Quick action, Focused investigation, Improvement Project), retire the `'control-handoff'` response path end-to-end (core enum, readiness, action mapping, UI components, label map), and verify persona-routing deletion is a no-op (zero references in the codebase).

**Architecture:** The wedge folds Handoff into Sustainment-closure (already shipped via PR-WV1-2 at the IP-stage level). This PR retires the parallel Handoff CTA on the canvas drill menu and the supporting `HandoffForm` / `HandoffPanel` surfaces. ADR-080 Sustainment auto-fire is preserved — it triggers on project phase → `'sustain'` via co-located reducer dispatch and is independent of the canvas-CTA path. Sustainment-as-state remains in `ProcessStateResponsePath` (still reported in `responsePathCounts`); only the user-clickable Sustainment + Handoff canvas CTAs are removed (sustainment becomes a state-listing only, not a drill choice).

**Tech Stack:** TypeScript + Vite + React 18 + Vitest + `@testing-library/react`. Architecture invariants per ADR-073 (no statistical roll-up across heterogeneous units), ADR-074 (SCOUT level boundary), ADR-080 (Sustainment auto-fire pattern).

**Persona-routing note:** The master sequencer §"PR-WV1-4" lists persona-shell deletion (`usePersonaStore`, `personaRouter`, `Pat/Chen/Fred HomeShell`, `personaRole` field). Investigation 2026-05-16 confirmed **all of these are no-op** — zero references in `packages/`/`apps/`. Persona was design-only; code never shipped. Task 7 verifies the no-op state.

---

## Scope check — single PR, atomic enum change

The `ProcessStateResponsePath` enum drop and the `ResponsePathKind` UI drop must land together for TypeScript exhaustiveness to hold (the `assertNever` in `deriveResponsePathAction` will fail-fast if values are out of sync between core and UI). This is an atomic phase — single PR despite touching ~16 files.

**Slice-size note:** 8 tasks (at the ≤8 cap per `feedback_slice_size_cap`). Counter-signal honored: enum + UI changes are inseparable.

---

## File structure

**Modify:**

- `packages/core/src/processState.ts` — drop `'control-handoff'` from `ProcessStateResponsePath` (line 21); drop the control-handoff push block (lines 270-285); simplify the sustainment items filter (line 287-289 no longer needs to exclude `'control-handoff-missing'`)
- `packages/core/src/responsePathAction.ts` — drop `case 'control-handoff'` (line 48); simplify `ResponsePathAction.open-sustainment` to drop `surface: 'handoff'` variant → becomes `surface: 'review'` (or drop the surface field entirely if it's no longer discriminating)
- `packages/core/src/responsePathReadiness.ts` — delete `isHandoffReady` function
- `packages/core/src/processHub.ts` — drop `'control-handoff-missing'` from `SustainmentReviewReason` union (line 314)
- `packages/core/src/sustainment.ts` — drop the line 433 `buildSustainmentReviewItem(inv, ['control-handoff-missing'])` map; whatever conditional gates that map either deletes too or short-circuits
- `packages/core/src/__tests__/processState.test.ts` — drop control-handoff assertions (lines 216, 252-254)
- `packages/core/src/__tests__/responsePathAction.test.ts` — drop control-handoff test (lines 76-86)
- `packages/core/src/__tests__/responsePathReadiness.test.ts` — drop `describe('isHandoffReady')` block (lines 41-54)
- `packages/core/src/__tests__/processHub.test.ts` — drop control-handoff-missing reason assertion (line 797) if test isolates that path
- `packages/ui/src/components/Canvas/internal/responsePathCta.ts` — reduce `ResponsePathKind` to `'quick-action' | 'focused-investigation' | 'charter'`; simplify `computeCtaState` to drop sustainment + handoff cases; simplify return type to `'active' | 'hidden'` (no more `'prerequisite-locked'`); drop `PrerequisiteLockedReason` export
- `packages/ui/src/components/Canvas/internal/__tests__/responsePathCta.test.ts` — drop `describe('computeCtaState — sustainment')` + `describe('computeCtaState — handoff')` + `ALWAYS_AVAILABLE` simplifies to the full union
- `packages/ui/src/components/Canvas/internal/CanvasStepOverlay.tsx` — drop `onSustainment` + `onHandoff` props (lines 38-39); drop `handlerMap` entries for them (lines 146-147); drop `CTA_LABELS` entries (lines 107-108); drop `PREREQUISITE_TOOLTIP_KEY` constant (lines 111-117) entirely; drop the two `renderCta('sustainment')` + `renderCta('handoff', ...)` calls (lines 384-385); drop the `import { isSustainmentReady, isHandoffReady } from '@variscout/core'` in `responsePathCta.ts` (now unused)
- `packages/ui/src/components/Canvas/internal/__tests__/CanvasStepOverlay.test.tsx` — update overlay-rendering tests to assert only 3 CTAs
- `packages/ui/src/components/Canvas/index.tsx` — drop `onSustainment` + `onHandoff` from `CanvasProps`; stop passing them to overlay (lines 829-830)
- `packages/ui/src/components/ProcessHubCurrentStatePanel/ProcessHubCurrentStatePanel.tsx` — drop the `'control-handoff': 'Control handoff'` entry from the label map (line 66)
- `apps/azure/src/components/editor/FrameView.tsx` + tests — drop `onSustainment` + `onHandoff` wiring
- `apps/pwa/src/components/views/FrameView.tsx` + tests — drop `onSustainment` + `onHandoff` wiring
- `apps/azure/src/pages/Editor.tsx` — drop handler wiring

**Delete:**

- `packages/ui/src/components/Handoff/HandoffForm.tsx` (281 lines) + `__tests__/HandoffForm.test.tsx`
- `apps/azure/src/components/handoff/HandoffPanel.tsx` (297 lines)
- `apps/pwa/src/components/HandoffPanel.tsx` (297 lines)
- Any barrel `index.ts` exports that re-export the deleted components (search `grep -rn "HandoffForm\|HandoffPanel" packages/ apps/ --include="*.ts" --include="*.tsx" -l`)

**No new files.**

---

## Task 1: Drop `'control-handoff'` from `ProcessStateResponsePath` + `deriveResponsePathAction`

**Files:**

- Modify: `packages/core/src/processState.ts:14-21`
- Modify: `packages/core/src/responsePathAction.ts:4-15` + `35-53`
- Modify: `packages/core/src/__tests__/responsePathAction.test.ts:76-86`

- [ ] **Step 1: Update the test to drop the control-handoff assertion**

Edit `packages/core/src/__tests__/responsePathAction.test.ts` — delete this block at lines 76-86:

```typescript
it('maps control-handoff to open-sustainment/handoff', () => {
  const action = deriveResponsePathAction(
    baseItem({ responsePath: 'control-handoff' }),
    DEFAULT_ID
  );
  expect(action).toEqual({
    kind: 'open-sustainment',
    investigationId: DEFAULT_ID,
    surface: 'handoff',
  });
});
```

Also update the existing `'maps sustainment-review to open-sustainment/review'` test — drop the `surface: 'review'` from the expected shape since we're simplifying `'open-sustainment'` to no longer discriminate on surface. New expectation:

```typescript
it('maps sustainment-review to open-sustainment', () => {
  const action = deriveResponsePathAction(
    baseItem({ responsePath: 'sustainment-review' }),
    DEFAULT_ID
  );
  expect(action).toEqual({
    kind: 'open-sustainment',
    investigationId: DEFAULT_ID,
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pnpm --filter @variscout/core test -- responsePathAction.test.ts
```

Expected: FAIL — the existing types still include `'control-handoff'` and the action's `surface` field.

- [ ] **Step 3: Drop `'control-handoff'` from `ProcessStateResponsePath`**

Edit `packages/core/src/processState.ts:14-21`:

```typescript
export type ProcessStateResponsePath =
  | 'monitor'
  | 'quick-action'
  | 'focused-investigation'
  | 'chartered-project'
  | 'measurement-system-work'
  | 'sustainment-review';
```

(Removed `| 'control-handoff';`)

- [ ] **Step 4: Simplify `ResponsePathAction` + drop the case**

Edit `packages/core/src/responsePathAction.ts`. Update the discriminated union (lines 4-15):

```typescript
export type ResponsePathAction =
  | {
      kind: 'open-investigation';
      investigationId: string;
      intent: 'focused' | 'chartered' | 'quick';
    }
  | { kind: 'open-sustainment'; investigationId: string }
  | { kind: 'unsupported'; reason: 'planned' | 'informational' };
```

Update the switch (lines 35-53) — drop the `case 'control-handoff'` block and remove `surface` from the `'sustainment-review'` case:

```typescript
switch (path) {
  case 'monitor':
    return { kind: 'unsupported', reason: 'informational' };
  case 'measurement-system-work':
    return { kind: 'unsupported', reason: 'planned' };
  case 'quick-action':
    return { kind: 'open-investigation', investigationId, intent: 'quick' };
  case 'focused-investigation':
    return { kind: 'open-investigation', investigationId, intent: 'focused' };
  case 'chartered-project':
    return { kind: 'open-investigation', investigationId, intent: 'chartered' };
  case 'sustainment-review':
    return { kind: 'open-sustainment', investigationId };
  default:
    return assertNever(path);
}
```

- [ ] **Step 5: Run tests to verify they pass**

```bash
pnpm --filter @variscout/core test -- responsePathAction.test.ts
```

Expected: PASS.

Also run the full core test suite to surface downstream exhaustiveness compile errors:

```bash
pnpm --filter @variscout/core test
```

Expected: any failures here are downstream consumers of the old type — they get fixed in subsequent tasks. Note the failing test names; the implementer will address them in tasks 2-6.

- [ ] **Step 6: Commit**

```bash
git add packages/core/src/processState.ts packages/core/src/responsePathAction.ts packages/core/src/__tests__/responsePathAction.test.ts
git commit -m "feat(wedge): drop 'control-handoff' from ProcessStateResponsePath + simplify open-sustainment action"
```

---

## Task 2: Drop `isHandoffReady` from `responsePathReadiness` + drop control-handoff block in `buildCurrentProcessState`

**Files:**

- Modify: `packages/core/src/responsePathReadiness.ts:31-33`
- Modify: `packages/core/src/__tests__/responsePathReadiness.test.ts:41-54`
- Modify: `packages/core/src/processState.ts:270-289`
- Modify: `packages/core/src/__tests__/processState.test.ts:216, 252-254`

- [ ] **Step 1: Update readiness tests to drop isHandoffReady**

Edit `packages/core/src/__tests__/responsePathReadiness.test.ts` — delete the entire `describe('isHandoffReady', ...)` block (lines 41-54). Also drop `isHandoffReady` from the import on line 5.

- [ ] **Step 2: Update processState tests to drop control-handoff assertions**

Edit `packages/core/src/__tests__/processState.test.ts`:

- Line ~216: `expect(state.responsePathCounts['control-handoff']).toBe(1);` — delete this assertion (and adjust surrounding test scope; the test that asserted control-handoff counts may collapse or simplify).
- Lines ~252-254: Drop the test that asserts a control-handoff state item is produced.

If the implementer finds these assertions are central to a `describe` block, restructure the block to assert that no control-handoff state item is produced when `cadence.sustainment.items[].reasons` contains `'control-handoff-missing'` — or skip that branch entirely. Use TDD discipline: write the assertion first, then drop the code.

- [ ] **Step 3: Run tests to verify failures**

```bash
pnpm --filter @variscout/core test -- responsePathReadiness.test.ts processState.test.ts
```

Expected: FAIL — `isHandoffReady` is still exported; the control-handoff push block still produces a state item.

- [ ] **Step 4: Delete `isHandoffReady` from readiness**

Edit `packages/core/src/responsePathReadiness.ts` — delete the function at lines 31-33:

```typescript
export function isHandoffReady(signals: WorkflowReadinessSignals): boolean {
  return signals.isDemo === true || signals.sustainmentConfirmed;
}
```

Also drop `sustainmentConfirmed` from `WorkflowReadinessSignals` IF no other consumer references it (run `grep -rn "sustainmentConfirmed" packages/ apps/ --include="*.ts" --include="*.tsx"`). If still referenced (e.g., by `isSustainmentReady` callers elsewhere), keep the field but note its diminished surface.

- [ ] **Step 5: Drop the control-handoff push block in `buildCurrentProcessState`**

Edit `packages/core/src/processState.ts` — delete lines 270-285 entirely:

```typescript
if (cadence.sustainment.items.some(item => item.reasons.includes('control-handoff-missing'))) {
  items.push({
    id: 'control-handoff',
    lens: 'sustainment',
    severity: 'amber',
    responsePath: 'control-handoff',
    source: 'sustainment',
    label: 'Control handoff needed',
    count: cadence.sustainment.items.filter(item =>
      item.reasons.includes('control-handoff-missing')
    ).length,
    investigationIds: cadence.sustainment.items
      .filter(item => item.reasons.includes('control-handoff-missing'))
      .map(item => item.investigation.id),
  });
}
```

Then simplify the sustainment items filter on line 287-289. The current code is:

```typescript
const sustainmentReviewItems = cadence.sustainment.items.filter(
  item => !item.reasons.includes('control-handoff-missing')
);
```

Change to just:

```typescript
const sustainmentReviewItems = cadence.sustainment.items;
```

- [ ] **Step 6: Run tests to verify they pass**

```bash
pnpm --filter @variscout/core test -- responsePathReadiness.test.ts processState.test.ts
```

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add packages/core/src/responsePathReadiness.ts packages/core/src/processState.ts packages/core/src/__tests__/responsePathReadiness.test.ts packages/core/src/__tests__/processState.test.ts
git commit -m "feat(wedge): drop isHandoffReady + remove control-handoff state-item production"
```

---

## Task 3: Reduce `ResponsePathKind` to 3 values + simplify `computeCtaState`

**Files:**

- Modify: `packages/ui/src/components/Canvas/internal/responsePathCta.ts` (full file)
- Modify: `packages/ui/src/components/Canvas/internal/__tests__/responsePathCta.test.ts` (full file)

- [ ] **Step 1: Rewrite `responsePathCta.test.ts` to cover only the 3 surviving paths**

Replace the entire file `packages/ui/src/components/Canvas/internal/__tests__/responsePathCta.test.ts` with:

```typescript
import { describe, it, expect } from 'vitest';
import { computeCtaState, type ResponsePathKind } from '../responsePathCta';

const ALL_PATHS: ResponsePathKind[] = ['quick-action', 'focused-investigation', 'charter'];

describe('computeCtaState — all canvas response paths are always-available', () => {
  for (const path of ALL_PATHS) {
    it(`${path} is active when handler wired`, () => {
      expect(computeCtaState({ path, hasHandler: true })).toEqual({ kind: 'active' });
    });

    it(`${path} is hidden when no handler is wired`, () => {
      expect(computeCtaState({ path, hasHandler: false })).toEqual({ kind: 'hidden' });
    });
  }
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pnpm --filter @variscout/ui test -- responsePathCta.test.ts
```

Expected: FAIL — `computeCtaState` still requires `signals` as input; `ResponsePathKind` still includes sustainment + handoff.

- [ ] **Step 3: Rewrite `responsePathCta.ts` with the reduced surface**

Replace the entire file `packages/ui/src/components/Canvas/internal/responsePathCta.ts` with:

```typescript
/**
 * Maps `(path, hasHandler)` to a `ResponsePathCtaState` for each of the three
 * canvas drill-down response-path CTAs. All three (Quick action, Focused
 * investigation, Improvement Project) are always-available — `'hidden'` is
 * reserved for the case where a path's handler is not wired (we hide rather
 * than tease unfinished features).
 *
 * Wedge spec: docs/superpowers/specs/2026-05-16-wedge-architecture-design.md §3
 */

export type ResponsePathKind = 'quick-action' | 'focused-investigation' | 'charter';

export type ResponsePathCtaState = { kind: 'active' } | { kind: 'hidden' };

export interface ComputeCtaStateInput {
  path: ResponsePathKind;
  hasHandler: boolean;
}

function assertNever(value: never): never {
  throw new Error(`Unhandled response-path kind: ${String(value)}`);
}

export function computeCtaState({ path, hasHandler }: ComputeCtaStateInput): ResponsePathCtaState {
  switch (path) {
    case 'quick-action':
    case 'focused-investigation':
    case 'charter':
      return hasHandler ? { kind: 'active' } : { kind: 'hidden' };
    default:
      return assertNever(path);
  }
}
```

This drops: `'sustainment' | 'handoff'` from the union, `PrerequisiteLockedReason` type, the prerequisite-locked variant, the `signals` param, the `isSustainmentReady`/`isHandoffReady` imports.

- [ ] **Step 4: Run tests to verify pass**

```bash
pnpm --filter @variscout/ui test -- responsePathCta.test.ts
```

Expected: PASS. Other ui tests may now fail (consumers of the dropped types) — those get fixed in tasks 4-5.

- [ ] **Step 5: Commit**

```bash
git add packages/ui/src/components/Canvas/internal/responsePathCta.ts packages/ui/src/components/Canvas/internal/__tests__/responsePathCta.test.ts
git commit -m "feat(wedge): reduce ResponsePathKind to 3 always-available paths"
```

---

## Task 4: Update `CanvasStepOverlay` — drop sustainment + handoff handlers + render only 3 CTAs

**Files:**

- Modify: `packages/ui/src/components/Canvas/internal/CanvasStepOverlay.tsx`
- Modify: `packages/ui/src/components/Canvas/internal/__tests__/CanvasStepOverlay.test.tsx`

- [ ] **Step 1: Update `CanvasStepOverlay.test.tsx` to assert 3 CTAs**

Read the existing file first, then update the rendering tests. Replace assertions like `expect(screen.getByTestId('canvas-cta-sustainment'))` with absence assertions:

```typescript
expect(screen.queryByTestId('canvas-cta-sustainment')).toBeNull();
expect(screen.queryByTestId('canvas-cta-handoff')).toBeNull();
```

Update or drop the entire `describe` block(s) that test prerequisite-locked sustainment/handoff CTAs. Update the "active CTAs render" assertion to expect exactly 3 testids: `canvas-cta-quick-action`, `canvas-cta-focused-investigation`, `canvas-cta-charter`.

Also drop any test setup that passes `onSustainment`/`onHandoff` props — they no longer exist on `CanvasStepOverlayProps`.

- [ ] **Step 2: Run test to verify it fails**

```bash
pnpm --filter @variscout/ui test -- CanvasStepOverlay.test.tsx
```

Expected: FAIL — overlay still renders 5 CTAs; props still include onSustainment/onHandoff.

- [ ] **Step 3: Update `CanvasStepOverlay.tsx`**

Edit `packages/ui/src/components/Canvas/internal/CanvasStepOverlay.tsx`:

1. **Drop the imports** (lines 4 + 15) — remove `WorkflowReadinessSignals` import (now unused) + remove `type PrerequisiteLockedReason` from the `./responsePathCta` import.

2. **Drop props** (lines 38-39) — remove `onSustainment` + `onHandoff` from `CanvasStepOverlayProps`.

3. **Drop `signals`** (line 33) from `CanvasStepOverlayProps` — `computeCtaState` no longer takes signals. Also drop the destructure on line 123 and the consumer-pass on line 152.

4. **Drop CTA_LABELS entries** (lines 107-108) — keep only quick-action / focused-investigation / charter:

```typescript
const CTA_LABELS: Record<ResponsePathKind, string> = {
  'quick-action': 'Quick action',
  'focused-investigation': 'Focused investigation',
  charter: 'Improvement Project',
};
```

5. **Delete `PREREQUISITE_TOOLTIP_KEY` constant** (lines 111-117) — entirely unused now.

6. **Simplify `handlerMap`** (lines 142-148):

```typescript
const handlerMap: Record<ResponsePathKind, ((stepId: string) => void) | undefined> = {
  'quick-action': onLogQuickAction ? () => setShowLogAction(true) : onQuickAction,
  'focused-investigation': onFocusedInvestigation,
  charter: onCharter,
};
```

7. **Simplify `renderCta`** (lines 150-188) — drop the prerequisite-locked branch (lines 174-187); `computeCtaState` no longer returns it:

```typescript
const renderCta = (path: ResponsePathKind, extraClass?: string): React.ReactNode => {
  const handler = handlerMap[path];
  const state = computeCtaState({ path, hasHandler: handler !== undefined });
  const baseClass =
    'rounded-md border border-edge bg-surface-secondary px-3 py-2 text-sm font-medium';
  const cls = extraClass ? `${baseClass} ${extraClass}` : baseClass;

  if (state.kind === 'hidden') return null;

  return (
    <button
      key={path}
      type="button"
      data-testid={`canvas-cta-${path}`}
      data-cta-state="active"
      className={`${cls} text-content hover:bg-surface-tertiary`}
      onClick={() => handler!(card.stepId)}
    >
      {CTA_LABELS[path]}
    </button>
  );
};
```

8. **Drop the two `renderCta` calls for sustainment + handoff** (lines 384-385):

```typescript
<div className="mt-4 grid gap-2 sm:grid-cols-2">
  {renderCta('quick-action')}
  {renderCta('focused-investigation')}
  {renderCta('charter', 'sm:col-span-2')}
</div>
```

(Promoted `charter` to span 2 cols so the 3-button grid has a sensible visual rhythm. Alternative: keep three 2-col items in a `sm:grid-cols-2` grid and let the third wrap; pick whichever the consumer-tests verify against.)

- [ ] **Step 4: Run tests to verify pass**

```bash
pnpm --filter @variscout/ui test -- CanvasStepOverlay.test.tsx
```

Expected: PASS. Run the full ui test suite to catch other downstream failures (Canvas parent, FrameView consumers, etc.):

```bash
pnpm --filter @variscout/ui test
```

Note remaining failures for tasks 5-6.

- [ ] **Step 5: Commit**

```bash
git add packages/ui/src/components/Canvas/internal/CanvasStepOverlay.tsx packages/ui/src/components/Canvas/internal/__tests__/CanvasStepOverlay.test.tsx
git commit -m "feat(wedge): canvas overlay renders 3 always-available CTAs only"
```

---

## Task 5: Update parent `Canvas` + consumer apps (FrameView × 2 + Editor)

**Files:**

- Modify: `packages/ui/src/components/Canvas/index.tsx` (CanvasProps + overlay-passing site)
- Modify: `apps/azure/src/components/editor/FrameView.tsx` + `__tests__/FrameView.test.tsx`
- Modify: `apps/pwa/src/components/views/FrameView.tsx` + `__tests__/FrameView.test.tsx`
- Modify: `apps/azure/src/pages/Editor.tsx`

- [ ] **Step 1: Drop `onSustainment` + `onHandoff` from `CanvasProps`**

Edit `packages/ui/src/components/Canvas/index.tsx`. Find the `CanvasProps` interface (around lines 165-248) and delete the `onSustainment` + `onHandoff` props (around lines 229-234). Also delete the destructure of these props in the component body and the two lines passing them to `<CanvasStepOverlay>` (around lines 829-830).

- [ ] **Step 2: Find all `onSustainment` / `onHandoff` call sites**

Run:

```bash
grep -rln "onSustainment\|onHandoff" packages/ apps/ --include="*.ts" --include="*.tsx"
```

Expected files to update (verified during investigation):

- `apps/azure/src/components/editor/FrameView.tsx` + tests
- `apps/pwa/src/components/views/FrameView.tsx` + tests
- `apps/azure/src/pages/Editor.tsx`

For each call site: delete the prop declaration, the handler definition (often a `useCallback` that opened a panel/modal), and any state related to handoff/sustainment panel open/close.

- [ ] **Step 3: Update consumer tests with `importOriginal` partial pattern if needed**

Honor `.claude/rules/testing.md` — any test that mocks `@variscout/core` or `@variscout/stores` and was relying on flat factory should switch to `importOriginal` partial pattern. If the failing tests already use partial mock pattern, no change needed.

Example (only if a test currently uses flat factory):

```typescript
vi.mock('@variscout/core', async importOriginal => {
  const actual = await importOriginal<typeof import('@variscout/core')>();
  return {
    ...actual,
    // override only what this test needs
  };
});
```

- [ ] **Step 4: Run all UI tests**

```bash
pnpm --filter @variscout/ui test
pnpm --filter @variscout/pwa test
pnpm --filter @variscout/azure-app test
```

Expected: PASS across all three. Any remaining `onSustainment`/`onHandoff` failures = missed call site; grep again.

- [ ] **Step 5: Commit**

```bash
git add packages/ui/src/components/Canvas/index.tsx apps/azure/src/components/editor/FrameView.tsx apps/azure/src/components/editor/__tests__/FrameView.test.tsx apps/pwa/src/components/views/FrameView.tsx apps/pwa/src/components/views/__tests__/FrameView.test.tsx apps/azure/src/pages/Editor.tsx
git commit -m "feat(wedge): drop onSustainment + onHandoff from Canvas + FrameView wiring"
```

---

## Task 6: Delete handoff UI components + clean up label map + barrels

**Files:**

- Delete: `packages/ui/src/components/Handoff/HandoffForm.tsx` (281 lines)
- Delete: `packages/ui/src/components/Handoff/__tests__/HandoffForm.test.tsx`
- Delete: `apps/azure/src/components/handoff/HandoffPanel.tsx` (297 lines)
- Delete: `apps/pwa/src/components/HandoffPanel.tsx` (297 lines)
- Modify: `packages/ui/src/components/ProcessHubCurrentStatePanel/ProcessHubCurrentStatePanel.tsx:66` (drop label entry)
- Modify: any `index.ts` / `index.tsx` barrel that re-exports the deleted files

- [ ] **Step 1: Find barrels that re-export the deleted files**

```bash
grep -rn "HandoffForm\|HandoffPanel\|from.*Handoff" packages/ apps/ --include="*.ts" --include="*.tsx" | grep -v __tests__ | grep -v dist
```

Note all `export { HandoffForm } from ...` / `export * from './Handoff'` lines. These will need deletion in step 2.

- [ ] **Step 2: Delete the handoff UI files**

```bash
rm packages/ui/src/components/Handoff/HandoffForm.tsx
rm packages/ui/src/components/Handoff/__tests__/HandoffForm.test.tsx
rm apps/azure/src/components/handoff/HandoffPanel.tsx
rm apps/pwa/src/components/HandoffPanel.tsx
```

If the Handoff directory is now empty, remove the directory itself:

```bash
rmdir packages/ui/src/components/Handoff/__tests__ 2>/dev/null || true
rmdir packages/ui/src/components/Handoff 2>/dev/null || true
rmdir apps/azure/src/components/handoff 2>/dev/null || true
```

- [ ] **Step 3: Update barrels + label map**

For each barrel found in step 1, delete the offending export line. For `ProcessHubCurrentStatePanel.tsx:66`, drop the line:

```typescript
'control-handoff': 'Control handoff',
```

If the type of the label map is `Record<ProcessStateResponsePath, string>`, the now-incomplete map will be a TS compile error — that's the loud failure signal that `'control-handoff'` is genuinely retired from the enum.

- [ ] **Step 4: Run full test suite**

```bash
pnpm test
```

Expected: PASS. Any remaining import errors = missed barrel; grep + fix.

- [ ] **Step 5: Commit**

```bash
git add -A packages/ui/src/components/Handoff packages/ui/src/components/ProcessHubCurrentStatePanel/ProcessHubCurrentStatePanel.tsx apps/azure/src/components/handoff apps/pwa/src/components/HandoffPanel.tsx
# Also git add any barrel updates surfaced by step 3
git commit -m "feat(wedge): delete HandoffForm + HandoffPanel components + drop control-handoff label"
```

---

## Task 7: Drop `'control-handoff-missing'` from `SustainmentReviewReason` + verify persona-routing no-op

**Files:**

- Modify: `packages/core/src/processHub.ts:310-314` (SustainmentReviewReason union)
- Modify: `packages/core/src/sustainment.ts:433` (the buildSustainmentReviewItem call)
- Modify: `packages/core/src/__tests__/processHub.test.ts:797` (drop the contains-control-handoff-missing assertion if isolated)

**Partial-integration policy** (decided upfront per `feedback_partial_integration_policy`): `'control-handoff-missing'` is a **computed** runtime reason (`sustainment.ts:433` builds it from investigation state) — NOT a stored .vrs value. Per investigation 2026-05-16, no `.vrs` migration is required. If during implementation it turns out a stored field references it, fall back to an idempotent silent map (the PR-WV1-1 / PR-WV1-2 pattern) — do NOT introduce a loud `assertX()` mid-PR.

- [ ] **Step 1: Drop `'control-handoff-missing'` from `SustainmentReviewReason`**

Edit `packages/core/src/processHub.ts:310-314`. The current union is:

```typescript
  | 'overdue-actions'
  | 'next-move'
  | 'sustainment'
  | 'sustainment-due'
  | 'control-handoff-missing';
```

Change to:

```typescript
  | 'overdue-actions'
  | 'next-move'
  | 'sustainment'
  | 'sustainment-due';
```

- [ ] **Step 2: Find consumers + delete the production point**

```bash
grep -rn "'control-handoff-missing'" packages/ apps/ --include="*.ts" --include="*.tsx"
```

Edit `packages/core/src/sustainment.ts` — find the line 433 `.map(inv => buildSustainmentReviewItem(inv, ['control-handoff-missing']))` and remove that entire `.filter(...)` → `.map(...)` chain (along with whatever conditional produced it). The investigations that previously triggered control-handoff-missing now fall through to whatever the default sustainment-review path is, or are filtered out entirely — the implementer judges based on the surrounding code.

- [ ] **Step 3: Update processHub test if isolated**

Edit `packages/core/src/__tests__/processHub.test.ts:797` — if this line is the only assertion in a test, drop the whole test. If it's one of several reason-assertions, just drop this specific `toContain('control-handoff-missing')` expectation.

- [ ] **Step 4: Verify persona-routing is genuinely no-op**

```bash
grep -rn "usePersonaStore\|personaRole\|PersonaRouter\|PatHomeShell\|ChenHomeShell\|FredHomeShell\|MiraHomeShell" packages/ apps/ --include="*.ts" --include="*.tsx"
```

Expected: **empty output**. If any reference surfaces, that's a finding for a separate amendment — note it in the PR description but do NOT scope-creep into this PR. Per `feedback_check_registry_placeholders_first`, a single hit could be an intentional V2 placeholder; investigate before deleting.

- [ ] **Step 5: Run tests**

```bash
pnpm test
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add packages/core/src/processHub.ts packages/core/src/sustainment.ts packages/core/src/__tests__/processHub.test.ts
git commit -m "feat(wedge): drop control-handoff-missing from SustainmentReviewReason + verify persona-routing no-op"
```

---

## Task 8: Browser walk + `pr-ready-check.sh` + final verification

- [ ] **Step 1: Architecture tests pass**

```bash
bash scripts/check-level-boundaries.sh
```

Expected: PASS — ADR-074 SCOUT level boundary enforced.

- [ ] **Step 2: Full pre-PR sweep**

```bash
bash scripts/pr-ready-check.sh
```

Expected: GREEN. This runs `pnpm test` (turbo), `pnpm lint` (turbo), `bash scripts/check-level-boundaries.sh`, `pnpm docs:check`, and `pnpm --filter @variscout/pwa build` + dist integrity. Do NOT use `--no-verify` to skip hook failures (per `feedback_subagent_no_verify`) — investigate any failure.

- [ ] **Step 3: Browser walk via `claude --chrome`**

Run:

```bash
pnpm dev
```

In a separate Claude session with the official Chrome extension enabled, walk:

1. Open PWA at `http://localhost:5173`
2. Open a hub with seeded data; click into Process tab → Canvas
3. Click a step card → drill overlay opens
4. **Assert**: exactly 3 CTAs visible — "Quick action", "Focused investigation", "Improvement Project". NO "Sustainment" or "Handoff" CTAs.
5. Click "Quick action" → action modal opens (existing flow intact).
6. Trigger an Improvement Project transition to `phase: 'sustain'`. **Assert**: ADR-080 Sustainment auto-fire still works — a `SUSTAINMENT_CREATE` event fires in the same reducer pass (verify via devtools console + Zustand DevTools).
7. Navigate Home → **assert**: single Specialist shape; no persona switcher (already true pre-PR; sanity check).
8. Inbox → **assert**: project-scoped notifications only (already true pre-PR; sanity check).

If anything fails the walk, fix in-PR rather than deferring.

- [ ] **Step 4: Final TypeScript check across packages**

```bash
pnpm build
```

Expected: GREEN across all packages + apps. Per `feedback_ui_build_before_merge`, the ui package's `tsc` catches cross-package type-export gaps that per-package vitest misses.

- [ ] **Step 5: Self-review the diff**

```bash
git log --oneline main..HEAD
git diff main..HEAD --stat
```

Confirm:

- 7 commits (one per task 1-7)
- Net file change: ~5 files deleted, ~15 files modified, no new files
- No `--no-verify` / no `// @ts-ignore` / no `Math.random` introductions
- No `// removed code` comments left behind (per CLAUDE.md "no back-compat shims")

- [ ] **Step 6: PR-open**

```bash
git push origin feat/wedge-pr-wv1-4-canvas-persona
gh pr create --title "feat(wedge): PR-WV1-4 — canvas response paths 5→3 + handoff retirement" --body "$(cat <<'EOF'
## Summary

- Reduce canvas drill response-path menu from 5 CTAs to 3 (Quick action / Focused investigation / Improvement Project); retire Sustainment + Handoff as click-driven canvas paths.
- Drop `'control-handoff'` from `ProcessStateResponsePath` enum + `deriveResponsePathAction` switch + `'control-handoff-missing'` from `SustainmentReviewReason`.
- Delete handoff UI: `HandoffForm`, `HandoffPanel` (× 2 apps), `isHandoffReady` readiness helper.
- Simplify `computeCtaState` — all 3 surviving paths are always-available; no prerequisite-locked state.
- Verify persona-routing is a no-op (zero references; persona code never shipped post-pivot).
- Preserve ADR-080 Sustainment auto-fire — independent of canvas-CTA path; triggers on project phase → 'sustain'.

## Plan

Sub-plan: `docs/superpowers/plans/2026-05-16-pr-wv1-4-canvas-paths-persona-deletion.md`
Master sequencer: `docs/superpowers/plans/2026-05-16-wedge-implementation.md`

## Test plan

- [ ] `pnpm test` (turbo) green
- [ ] `pnpm build` (turbo) green
- [ ] `bash scripts/pr-ready-check.sh` green
- [ ] Browser walk via `claude --chrome`: canvas drill = 3 CTAs; sustainment auto-fires; Home is single Specialist shape

## Wedge progress

- [x] PR-WV1-1 — project membership foundation (merged 2026-05-16)
- [x] PR-WV1-2 — Improve workspace migration (merged 2026-05-16)
- [x] PR-WV1-3 — Investigation Wall + Measurement Plans (merged 2026-05-16)
- [x] PR-WV1-4 — Canvas paths 5→3 + handoff retirement (this PR)
- [ ] PR-WV1-5 — Tier-gating retirement + nav reorder (unblocked by this)
- [ ] PR-WV1-6 — Azure Marketplace SKU
EOF
)"
```

Then dispatch an Opus code-reviewer subagent against the open PR (full diff, check out the PR branch per `feedback_code_review_subagent_must_checkout_pr_branch`).

---

## Self-review checklist (per writing-plans skill)

- [x] **Spec coverage**: master sequencer §"PR-WV1-4" + wedge spec §3 (canvas paths) + §10 (out-of-V1) all covered.
- [x] **No placeholders**: every step contains the real code/command; no "TBD" / "similar to Task N" / "add appropriate error handling".
- [x] **Type consistency**: `ResponsePathKind` 3 values, `ProcessStateResponsePath` 6 values, `SustainmentReviewReason` 4 values — same names across all tasks that reference them.
- [x] **Slice-size cap**: 8 tasks (at cap per `feedback_slice_size_cap`). Counter-signal honored: enum + UI changes are atomic.
- [x] **Partial-integration policy**: declared upfront in Task 7 — `'control-handoff-missing'` is computed runtime, no .vrs migration required; silent-map fallback documented if implementation reveals otherwise.
- [x] **Guardrails applied**: call-site reachability verified (Canvas parent passes all needed handlers); placeholder-check done (handoff is genuinely retired, not V2-deferred); silent-migration pattern over assertX (matches PR-WV1-1/2 precedent); slice ≤8; one-worktree-per-agent in execution; explicit no `--no-verify`.

---

## Execution handoff

Plan complete. Two execution options per writing-plans skill:

**1. Subagent-Driven (recommended)** — controller dispatches fresh Sonnet implementer per task; spec + quality reviewer pair per task; Opus final code-reviewer at branch end. Skip `pr-ready-check.sh` in implementer prompts (controller runs full sweep before PR-open). Use worktree `.worktrees/feat-wedge-pr-wv1-4-canvas-persona`.

**2. Inline Execution** — main session executes all 8 tasks sequentially via `executing-plans`. Faster wall-clock; lower review quality.

Recommended: **Option 1**.
