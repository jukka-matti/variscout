---
tier: ephemeral
purpose: build
title: PR-LV1-D — navigateToExploreForChip + canvas chip Click-to-Explore affordances
status: delivered
date: 2026-05-28
layer: spec
---

# PR-LV1-D — Canvas Chip Click-to-Explore Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax. Dispatch **Sonnet implementer** per task (well-specified additive UI work; no judgment-heavy refactors). Spec compliance reviewer (Sonnet) + code quality reviewer (Sonnet) after each task — both two-stage review per `subagent-driven-development` protocol. Final-branch Opus review at the end.

**Goal:** Wire Click-to-Explore as the canvas's affirmative purpose. Outcome cards, factor chips, and step boxes get an "Open in Explore →" hover affordance; clicking sets the relevant `analysisScopeStore` field (yColumn / boxplotFactor / stepId) and asks the host app to switch to the Explore tab.

**Architecture:** New `navigateToExploreForChip()` helper in `@variscout/ui` lives at `Canvas/EditMode/handlers/`. Takes a discriminated-union `ChipNavigationTarget` + a navigation callback; mutates `useAnalysisScopeStore` and invokes the callback. New `ExploreJumpButton` primitive (small Tailwind icon button) lives at `Canvas/EditMode/ExploreJumpButton.tsx`. `OutcomeCard`, `FactorChip`, and `StepBox` each get an optional `onExploreJumpClick` prop; their parent zones (`OutcomeZone`, `FactorZone`, `ProcessStructureZone`) get a single optional `onChipExploreJump(target)` prop that builds the right target and passes the bound callback to each child. `CanvasWorkspace` threads one `onChipExploreJump` prop through to the three zones. Azure-side `FrameView` wires the actual tab switch via `navigateToExploreForChip(target, () => usePanelsStore.getState().showExplore())`. PWA defers (no `pendingExploreIntent` routing yet).

**Tech Stack:** TypeScript 6 · React 19 · Zustand 5 · Vitest 4 · @dnd-kit/core (existing, not touched) · Tailwind 4 (semantic classes only — no `dark:` variants per wedge V1).

**Parent spec:** [`docs/superpowers/specs/2026-05-28-state-edit-mode-and-ip-scoped-presentation-design.md`](../specs/2026-05-28-state-edit-mode-and-ip-scoped-presentation-design.md) §3 D4 (Click-to-Explore as canvas purpose) · D7 (naming) · D8.1 (no `focusedChart` on per-chip click) · §4.2 (chip affordances) · §4.3 (click handler contract) · §4.4 (step boxes secondary action) · §4.6 (step-bound chips at L3)
**Master plan:** [`./2026-05-28-linked-views-phase-1-master-plan.md`](./2026-05-28-linked-views-phase-1-master-plan.md) PR-LV1-D row

---

## Grounded facts (verified — sub-plan is locked to these)

1. **Chip components are `OutcomeCard` + `FactorChip` + `StepBox`** — NOT "OutcomeChip" as the master plan said.
   - `packages/ui/src/components/Canvas/EditMode/OutcomeZone/OutcomeCard.tsx` — props `{ spec: OutcomeSpec; onSpecsClick: (anchor) => void }`; column id = `spec.columnName`; renders a ⚙ button (`aria-label="Edit specs"`) that opens the specs popover. Not draggable.
   - `packages/ui/src/components/Canvas/EditMode/FactorZone/FactorChip.tsx` — props `{ control: ImprovementProjectFactorControl; onSpecsClick: (anchor) => void }`; column id = `control.factor`; step binding = `control.stepId` (existing data field); ⚙ button (`aria-label="Edit factor"`). Not draggable.
   - `packages/ui/src/components/Canvas/EditMode/ProcessZone/StepBox.tsx` — props include `{ step: { id, name, order }, timingBadge?, resourceIndicator? }`; uses two `useDroppable` zones (internalY/internalX); has NO click handler. Clean slate for the affordance.

2. **`navigateToExploreForChip` does NOT exist.** No `navigate*` file under `packages/ui/src/components/Canvas/EditMode/handlers/`. Created from scratch.

3. **`ExploreJumpButton` does NOT exist.** No `IconButton` primitive in `@variscout/ui`. Created from scratch.

4. **`useAnalysisScopeStore` is at `packages/stores/src/analysisScopeStore.ts`** (NOT under a sub-directory). Barrel: `import { useAnalysisScopeStore, getAnalysisScopeInitialState } from '@variscout/stores'` works. Actions verified: `setY` / `setBoxplotFactor` / `setStepId` (set-undefined supported on all three).

5. **PWA has NO `pendingExploreIntent` routing.** PWA's `panelsStore.showExplore(): void` takes no args. **LV1-D is Azure-only on the wiring side.** The chip primitives live in `@variscout/ui` and are PWA-safe; PWA simply doesn't pass `onChipExploreJump` until a future PR.

6. **Tab-switching API:** `apps/azure/src/features/panels/panelsStore.ts` exports `showExplore(intent?: PendingExploreIntent): void`. Per spec D8.1, per-chip clicks pass NO intent — call `showExplore()` with no arg. `FrameView.tsx:236-241` already shows the canonical wiring pattern for `handleExploreExit`; the new `handleChipExploreJump` mirrors it.

7. **`packages/ui/` cannot import `apps/azure/`-specific stores.** Existing precedent: `ExploreExitButton.tsx` takes `onExit` callback; consumer in `FrameView` wires `panelsStore.showExplore(intent)`. LV1-D follows this pattern — helper takes a callback; Azure wires the actual `showExplore()` call.

8. **Step-bound chips at L3 (§4.6) reuse the same `FactorChip`.** L3 doesn't have a separate chip; `stepId` is data on `control.stepId`. `FactorZone` reads `control.stepId` when building the navigation target; the helper's `if (target.stepId) scope.setStepId(target.stepId)` guard handles both global and step-bound factors in one path.

9. **Test factories exist:**
   - `createTestOutcomeSpec()` at `packages/ui/src/test-utils/outcomeSpec.ts`
   - `createTestFactorControl()` at `packages/ui/src/test-utils/factorControl.ts`
   - `createTestStep()` at `packages/ui/src/test-utils/step.ts`
     Use them for all domain-type fixtures — never bare object literals (`feedback_ui_build_before_merge`).

10. **DndContext is safe.** Chips are NOT draggable (use parent `useDroppable`). Adding `<ExploreJumpButton>` as a chip child doesn't activate sensors — discrete click events bubble harmlessly.

11. **No `focusedChart` on per-chip clicks.** Per spec D8.1, Click-to-Explore lands in the full 4-chart dashboard. The helper does NOT set `focusedChart` or touch `pendingExploreIntent`. F1's existing `ExploreExitButton` + `pendingExploreIntent` apply effect at `Dashboard.tsx:430-444` is UNCHANGED.

---

## File structure

**Create:**

- `packages/ui/src/components/Canvas/EditMode/handlers/navigateToExploreForChip.ts` — helper + `ChipNavigationTarget` discriminated-union type
- `packages/ui/src/components/Canvas/EditMode/handlers/__tests__/navigateToExploreForChip.test.ts` — unit tests
- `packages/ui/src/components/Canvas/EditMode/ExploreJumpButton.tsx` — small icon button primitive
- `packages/ui/src/components/Canvas/EditMode/__tests__/ExploreJumpButton.test.tsx` — unit tests

**Modify:**

- `packages/ui/src/components/Canvas/EditMode/OutcomeZone/OutcomeCard.tsx` — add `onExploreJumpClick?: () => void` prop; render `<ExploreJumpButton>` next to the existing ⚙ button (`opacity-0 group-hover:opacity-100 focus-within:opacity-100`); wrap card root in `group`
- `packages/ui/src/components/Canvas/EditMode/OutcomeZone/__tests__/OutcomeCard.test.tsx` — extend with 2 new tests (button renders + click fires callback)
- `packages/ui/src/components/Canvas/EditMode/OutcomeZone/index.tsx` — add `onChipExploreJump?: (target: ChipNavigationTarget) => void` prop; pass `() => onChipExploreJump({ kind: 'outcome', columnName: spec.columnName })` to each `OutcomeCard`
- `packages/ui/src/components/Canvas/EditMode/FactorZone/FactorChip.tsx` — same pattern as OutcomeCard
- `packages/ui/src/components/Canvas/EditMode/FactorZone/__tests__/FactorChip.test.tsx` — extend (3 new tests including step-bound `stepId` carry-through)
- `packages/ui/src/components/Canvas/EditMode/FactorZone/index.tsx` — add `onChipExploreJump`; pass `() => onChipExploreJump({ kind: 'factor', columnName: control.factor, stepId: control.stepId })`
- `packages/ui/src/components/Canvas/EditMode/ProcessZone/StepBox.tsx` — add `onExploreJumpClick?: () => void` prop; render `<ExploreJumpButton>` inside the existing `<header>` after `resourceIndicator`; wrap card root in `group`
- `packages/ui/src/components/Canvas/EditMode/ProcessZone/__tests__/StepBox.test.tsx` — extend (2 new tests)
- `packages/ui/src/components/Canvas/EditMode/ProcessZone/index.tsx` — add `onChipExploreJump`; pass `() => onChipExploreJump({ kind: 'step', stepId: step.id })`
- `packages/ui/src/components/Canvas/CanvasWorkspace.tsx` — add `onChipExploreJump?: (target: ChipNavigationTarget) => void` prop; thread to `OutcomeZone`, `FactorZone`, `ProcessStructureZone`
- `packages/ui/src/components/Canvas/index.tsx` — re-export `navigateToExploreForChip`, `ChipNavigationTarget`, `ExploreJumpButton`
- `packages/ui/src/index.ts` — same re-exports
- `apps/azure/src/components/editor/FrameView.tsx` — wire `handleChipExploreJump` using helper + `usePanelsStore.getState().showExplore()`; pass to `<CanvasWorkspace>`
- `apps/azure/src/components/editor/__tests__/FrameView.test.tsx` — one integration test (simulating `onChipExploreJump` mutates scope + invokes `showExplore`)

**No changes:**

- `packages/stores/src/analysisScopeStore.ts` — final from LV1-A
- `packages/ui/src/components/Canvas/EditMode/ExploreExitButton.tsx` — F1's separate exit path; unchanged
- `apps/azure/src/components/Dashboard.tsx` — F1's `pendingExploreIntent` apply effect at lines 430-444; unchanged
- `apps/azure/src/features/panels/panelsStore.ts` — `showExplore()` API unchanged
- `apps/pwa/` — PWA primitives ride the new optional prop as `undefined`; no consumer wiring

---

## Constraints forwarded to implementer

- **NEVER** `--no-verify` on commits (`feedback_subagent_no_verify`)
- **No `Math.random`** anywhere (core hard rule)
- **No `dark:` Tailwind variants** (wedge V1 no-dark-mode invariant)
- **No emojis in source code** — `→` and `↗` are Unicode arrow glyphs, allowed as characters, NOT emojis
- **No `Pp` / `Ppk`** anywhere (`feedback_no_pp_ppk_only_cp_cpk`) — irrelevant here
- **No `"root cause"`** in comments / strings (P5 amended) — irrelevant here
- **`@variscout/ui` MAY NOT import from `apps/`** — helper takes a callback; navigation wiring stays in `FrameView`
- **Use semantic Tailwind only** (`bg-surface-secondary`, `text-content`, `border-edge`, `text-content-tertiary`) per `packages/ui/CLAUDE.md`. Pair `text-green-400` with `text-green-700` if used (not expected here).
- **No migration helpers / no back-compat shims** (`feedback_wedge_v1_no_migration_no_backcompat`)
- **Use factories `createTestOutcomeSpec` / `createTestFactorControl` / `createTestStep`** for domain fixtures; never bare literals. Caught by `pnpm --filter @variscout/ui build` (`feedback_ui_build_before_merge`).
- **Functional components only**, props interface named `{Component}Props`
- **Operate ONLY in the assigned worktree** (`feedback_subagent_worktree_discipline`)
- **Implementer verification scoped to <90s per task** (`feedback_implementer_long_bash_pitfall`) — `pnpm --filter @variscout/ui test -- <test-file> --run`
- **`pnpm` needs `--`** to forward args to vitest in this repo
- **Preserve identifier list applies** — do NOT rename `AnalysisMode`, `Dashboard.tsx`, `CanvasWorkspace.tsx`, etc. We are ADDING, not renaming.
- **Bundle pre-merge followups** (`feedback_bundle_followups_pre_merge`) — if a reviewer surfaces a nit during this PR, fold it in; don't open a follow-up PR.
- **Step button click uses `e.stopPropagation()`** to prevent any parent click handler from firing (defensive — even though StepBox has no body click today).

---

## Task 1: `ChipNavigationTarget` type + `navigateToExploreForChip` helper

**Files:**

- Create: `packages/ui/src/components/Canvas/EditMode/handlers/navigateToExploreForChip.ts`
- Create: `packages/ui/src/components/Canvas/EditMode/handlers/__tests__/navigateToExploreForChip.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `packages/ui/src/components/Canvas/EditMode/handlers/__tests__/navigateToExploreForChip.test.ts`:

```typescript
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useAnalysisScopeStore, getAnalysisScopeInitialState } from '@variscout/stores';
import { navigateToExploreForChip } from '../navigateToExploreForChip';

describe('navigateToExploreForChip', () => {
  beforeEach(() => {
    useAnalysisScopeStore.setState(getAnalysisScopeInitialState());
  });

  it('outcome target sets yColumn and invokes the navigation callback', () => {
    const onNavigate = vi.fn();
    navigateToExploreForChip({ kind: 'outcome', columnName: 'Diameter' }, onNavigate);
    expect(useAnalysisScopeStore.getState().yColumn).toBe('Diameter');
    expect(useAnalysisScopeStore.getState().stepId).toBeUndefined();
    expect(onNavigate).toHaveBeenCalledTimes(1);
  });

  it('outcome target with stepId also sets stepId', () => {
    const onNavigate = vi.fn();
    navigateToExploreForChip(
      { kind: 'outcome', columnName: 'Diameter', stepId: 'step-3' },
      onNavigate
    );
    expect(useAnalysisScopeStore.getState().yColumn).toBe('Diameter');
    expect(useAnalysisScopeStore.getState().stepId).toBe('step-3');
    expect(onNavigate).toHaveBeenCalledTimes(1);
  });

  it('factor target sets boxplotFactor and leaves yColumn untouched', () => {
    useAnalysisScopeStore.setState({ yColumn: 'Diameter' });
    const onNavigate = vi.fn();
    navigateToExploreForChip({ kind: 'factor', columnName: 'Vessel' }, onNavigate);
    expect(useAnalysisScopeStore.getState().boxplotFactor).toBe('Vessel');
    expect(useAnalysisScopeStore.getState().yColumn).toBe('Diameter');
    expect(onNavigate).toHaveBeenCalledTimes(1);
  });

  it('factor target with stepId sets both boxplotFactor and stepId', () => {
    const onNavigate = vi.fn();
    navigateToExploreForChip(
      { kind: 'factor', columnName: 'Vessel', stepId: 'step-2' },
      onNavigate
    );
    expect(useAnalysisScopeStore.getState().boxplotFactor).toBe('Vessel');
    expect(useAnalysisScopeStore.getState().stepId).toBe('step-2');
  });

  it('factor target without stepId does NOT clear an existing stepId scope', () => {
    useAnalysisScopeStore.setState({ stepId: 'step-1' });
    const onNavigate = vi.fn();
    navigateToExploreForChip({ kind: 'factor', columnName: 'Vessel' }, onNavigate);
    expect(useAnalysisScopeStore.getState().stepId).toBe('step-1');
  });

  it('step target sets stepId and invokes the callback', () => {
    const onNavigate = vi.fn();
    navigateToExploreForChip({ kind: 'step', stepId: 'step-1' }, onNavigate);
    expect(useAnalysisScopeStore.getState().stepId).toBe('step-1');
    expect(onNavigate).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm --filter @variscout/ui test -- navigateToExploreForChip --run`

Expected: FAIL with `Cannot find module '../navigateToExploreForChip'` — the helper doesn't exist yet.

- [ ] **Step 3: Implement the helper**

Create `packages/ui/src/components/Canvas/EditMode/handlers/navigateToExploreForChip.ts`:

```typescript
import { useAnalysisScopeStore } from '@variscout/stores';

export type ChipNavigationTarget =
  | { kind: 'outcome'; columnName: string; stepId?: string }
  | { kind: 'factor'; columnName: string; stepId?: string }
  | { kind: 'step'; stepId: string };

export function navigateToExploreForChip(
  target: ChipNavigationTarget,
  onNavigateToExplore: () => void
): void {
  const scope = useAnalysisScopeStore.getState();

  switch (target.kind) {
    case 'outcome':
      scope.setY(target.columnName);
      if (target.stepId) scope.setStepId(target.stepId);
      break;
    case 'factor':
      scope.setBoxplotFactor(target.columnName);
      if (target.stepId) scope.setStepId(target.stepId);
      break;
    case 'step':
      scope.setStepId(target.stepId);
      break;
  }

  onNavigateToExplore();
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm --filter @variscout/ui test -- navigateToExploreForChip --run`

Expected: all 6 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/ui/src/components/Canvas/EditMode/handlers/navigateToExploreForChip.ts \
        packages/ui/src/components/Canvas/EditMode/handlers/__tests__/navigateToExploreForChip.test.ts
git commit -m "$(cat <<'EOF'
feat(wedge-v1): LV1-D — navigateToExploreForChip helper + ChipNavigationTarget

Discriminated-union ChipNavigationTarget over outcome/factor/step kinds.
Helper mutates useAnalysisScopeStore (setY / setBoxplotFactor / setStepId)
then invokes a navigation callback supplied by the consumer. stepId is
only set when defined on the target (preserves existing stepId scope
for global factors).

Refs: docs/superpowers/specs/2026-05-28-state-edit-mode-and-ip-scoped-presentation-design.md §3 D4 + D8.1 + §4.3
EOF
)"
```

---

## Task 2: `ExploreJumpButton` primitive

**Files:**

- Create: `packages/ui/src/components/Canvas/EditMode/ExploreJumpButton.tsx`
- Create: `packages/ui/src/components/Canvas/EditMode/__tests__/ExploreJumpButton.test.tsx`

- [ ] **Step 1: Write the failing tests**

Create `packages/ui/src/components/Canvas/EditMode/__tests__/ExploreJumpButton.test.tsx`:

```tsx
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { ExploreJumpButton } from '../ExploreJumpButton';

describe('ExploreJumpButton', () => {
  it('renders a button with the parameterized aria-label', () => {
    render(<ExploreJumpButton label="Diameter" onClick={vi.fn()} />);
    const button = screen.getByRole('button', { name: /open diameter in explore/i });
    expect(button).toBeInTheDocument();
  });

  it('has data-testid="chip-explore-jump"', () => {
    render(<ExploreJumpButton label="Diameter" onClick={vi.fn()} />);
    expect(screen.getByTestId('chip-explore-jump')).toBeInTheDocument();
  });

  it('renders the → glyph as its child', () => {
    render(<ExploreJumpButton label="Diameter" onClick={vi.fn()} />);
    expect(screen.getByTestId('chip-explore-jump')).toHaveTextContent('→');
  });

  it('fires onClick when clicked and stops propagation', () => {
    const onClick = vi.fn();
    const parentClick = vi.fn();
    render(
      <div onClick={parentClick}>
        <ExploreJumpButton label="Diameter" onClick={onClick} />
      </div>
    );
    fireEvent.click(screen.getByTestId('chip-explore-jump'));
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(parentClick).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm --filter @variscout/ui test -- ExploreJumpButton --run`

Expected: FAIL — module doesn't exist.

- [ ] **Step 3: Implement the primitive**

Create `packages/ui/src/components/Canvas/EditMode/ExploreJumpButton.tsx`:

```tsx
export interface ExploreJumpButtonProps {
  /** User-facing label embedded into aria-label ("Open {label} in Explore"). */
  readonly label: string;
  readonly onClick: () => void;
}

export function ExploreJumpButton({ label, onClick }: ExploreJumpButtonProps) {
  return (
    <button
      type="button"
      data-testid="chip-explore-jump"
      aria-label={`Open ${label} in Explore`}
      onClick={e => {
        e.stopPropagation();
        onClick();
      }}
      className="rounded p-1 text-content-tertiary opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100 hover:bg-surface-secondary hover:text-content focus-visible:opacity-100"
    >
      →
    </button>
  );
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm --filter @variscout/ui test -- ExploreJumpButton --run`

Expected: all 4 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/ui/src/components/Canvas/EditMode/ExploreJumpButton.tsx \
        packages/ui/src/components/Canvas/EditMode/__tests__/ExploreJumpButton.test.tsx
git commit -m "$(cat <<'EOF'
feat(wedge-v1): LV1-D — ExploreJumpButton primitive

Small icon button rendering '→' with parameterized aria-label
('Open {label} in Explore'). Hover-reveal via group-hover Tailwind
(opacity-0 → opacity-100); also visible on group focus-within and
focus-visible for keyboard a11y. stopPropagation on click so the
button is the launch target even when its parent has its own click
handler.

Refs: docs/superpowers/specs/2026-05-28-state-edit-mode-and-ip-scoped-presentation-design.md §4.2 + D7
EOF
)"
```

---

## Task 3: Wire `OutcomeCard`

**Files:**

- Modify: `packages/ui/src/components/Canvas/EditMode/OutcomeZone/OutcomeCard.tsx`
- Modify: `packages/ui/src/components/Canvas/EditMode/OutcomeZone/__tests__/OutcomeCard.test.tsx`

- [ ] **Step 1: Append failing tests inside the existing describe block**

Append inside `describe('OutcomeCard', ...)` in `packages/ui/src/components/Canvas/EditMode/OutcomeZone/__tests__/OutcomeCard.test.tsx`:

```tsx
it('renders ExploreJumpButton labeled with columnName when onExploreJumpClick is provided', () => {
  render(
    <OutcomeCard
      spec={createTestOutcomeSpec({ columnName: 'Diameter' })}
      onSpecsClick={vi.fn()}
      onExploreJumpClick={vi.fn()}
    />
  );
  expect(screen.getByRole('button', { name: /open diameter in explore/i })).toBeInTheDocument();
});

it('does NOT render ExploreJumpButton when onExploreJumpClick is undefined', () => {
  render(
    <OutcomeCard spec={createTestOutcomeSpec({ columnName: 'Diameter' })} onSpecsClick={vi.fn()} />
  );
  expect(screen.queryByRole('button', { name: /open diameter in explore/i })).toBeNull();
});

it('clicking ExploreJumpButton fires onExploreJumpClick (and does NOT fire onSpecsClick)', () => {
  const onExploreJumpClick = vi.fn();
  const onSpecsClick = vi.fn();
  render(
    <OutcomeCard
      spec={createTestOutcomeSpec({ columnName: 'Diameter' })}
      onSpecsClick={onSpecsClick}
      onExploreJumpClick={onExploreJumpClick}
    />
  );
  fireEvent.click(screen.getByTestId('chip-explore-jump'));
  expect(onExploreJumpClick).toHaveBeenCalledTimes(1);
  expect(onSpecsClick).not.toHaveBeenCalled();
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm --filter @variscout/ui test -- OutcomeCard --run`

Expected: 3 new tests FAIL — prop doesn't exist yet. Existing 5 PASS.

- [ ] **Step 3: Implement the prop + button in OutcomeCard**

Edit `packages/ui/src/components/Canvas/EditMode/OutcomeZone/OutcomeCard.tsx`:

1. Add `ExploreJumpButton` import at the top:
   ```tsx
   import { ExploreJumpButton } from '../ExploreJumpButton';
   ```
2. Extend the props interface:
   ```tsx
   export interface OutcomeCardProps {
     spec: OutcomeSpec;
     onSpecsClick: (anchor: { x: number; y: number }) => void;
     onExploreJumpClick?: () => void;
   }
   ```
3. Update the function signature destructure: `export function OutcomeCard({ spec, onSpecsClick, onExploreJumpClick }: OutcomeCardProps) {`
4. Add `group` to the root `<div>` className so child `group-hover` works:
   ```tsx
   <div className="group flex flex-col gap-1 rounded-md border border-edge bg-surface-primary p-3 text-content">
   ```
5. Inside the existing right-side action area (the `<button ref={buttonRef} aria-label="Edit specs">⚙</button>`), wrap both buttons in a flex container so they sit side-by-side, with the jump button rendered conditionally:
   ```tsx
   <div className="flex items-center gap-1">
     {onExploreJumpClick && (
       <ExploreJumpButton label={spec.columnName} onClick={onExploreJumpClick} />
     )}
     <button
       ref={buttonRef}
       type="button"
       aria-label="Edit specs"
       onClick={handleSpecsClick}
       className="rounded p-1 text-content-tertiary hover:bg-surface-secondary"
     >
       ⚙
     </button>
   </div>
   ```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm --filter @variscout/ui test -- OutcomeCard --run`

Expected: all 8 tests PASS (5 existing + 3 new).

- [ ] **Step 5: Commit**

```bash
git add packages/ui/src/components/Canvas/EditMode/OutcomeZone/OutcomeCard.tsx \
        packages/ui/src/components/Canvas/EditMode/OutcomeZone/__tests__/OutcomeCard.test.tsx
git commit -m "$(cat <<'EOF'
feat(wedge-v1): LV1-D — OutcomeCard renders ExploreJumpButton

Adds optional onExploreJumpClick prop. When provided, renders
ExploreJumpButton beside the existing ⚙ specs button (group-hover
reveal, columnName in aria-label). Wrapping card root in 'group' so
the child opacity transition responds to hover/focus. When the prop
is undefined (PWA), no button renders.

Refs: docs/superpowers/specs/2026-05-28-state-edit-mode-and-ip-scoped-presentation-design.md §4.2
EOF
)"
```

---

## Task 4: Wire `FactorChip` (with stepId carry-through)

**Files:**

- Modify: `packages/ui/src/components/Canvas/EditMode/FactorZone/FactorChip.tsx`
- Modify: `packages/ui/src/components/Canvas/EditMode/FactorZone/__tests__/FactorChip.test.tsx`

- [ ] **Step 1: Append failing tests inside the existing describe block**

Append inside `describe('FactorChip', ...)` in `packages/ui/src/components/Canvas/EditMode/FactorZone/__tests__/FactorChip.test.tsx`. The file already imports `createTestFactorControl`; if it doesn't, add `import { createTestFactorControl } from '../../../../../test-utils/factorControl';` at the top alongside existing imports.

```tsx
it('renders ExploreJumpButton labeled with factor when onExploreJumpClick is provided', () => {
  render(
    <FactorChip
      control={createTestFactorControl({ factor: 'Vessel' })}
      onSpecsClick={vi.fn()}
      onExploreJumpClick={vi.fn()}
    />
  );
  expect(screen.getByRole('button', { name: /open vessel in explore/i })).toBeInTheDocument();
});

it('does NOT render ExploreJumpButton when onExploreJumpClick is undefined', () => {
  render(
    <FactorChip control={createTestFactorControl({ factor: 'Vessel' })} onSpecsClick={vi.fn()} />
  );
  expect(screen.queryByRole('button', { name: /open vessel in explore/i })).toBeNull();
});

it('clicking ExploreJumpButton fires onExploreJumpClick (and does NOT fire onSpecsClick)', () => {
  const onExploreJumpClick = vi.fn();
  const onSpecsClick = vi.fn();
  render(
    <FactorChip
      control={createTestFactorControl({ factor: 'Vessel' })}
      onSpecsClick={onSpecsClick}
      onExploreJumpClick={onExploreJumpClick}
    />
  );
  fireEvent.click(screen.getByTestId('chip-explore-jump'));
  expect(onExploreJumpClick).toHaveBeenCalledTimes(1);
  expect(onSpecsClick).not.toHaveBeenCalled();
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm --filter @variscout/ui test -- FactorChip --run`

Expected: 3 new tests FAIL. Existing PASS.

- [ ] **Step 3: Implement the prop + button in FactorChip**

Edit `packages/ui/src/components/Canvas/EditMode/FactorZone/FactorChip.tsx`:

1. Add `import { ExploreJumpButton } from '../ExploreJumpButton';`
2. Extend the props interface:
   ```tsx
   export interface FactorChipProps {
     control: ImprovementProjectFactorControl;
     onSpecsClick: (anchor: { x: number; y: number }) => void;
     onExploreJumpClick?: () => void;
   }
   ```
3. Destructure the new prop: `export function FactorChip({ control, onSpecsClick, onExploreJumpClick }: FactorChipProps) {`
4. Add `group` to the root `<div>` className:
   ```tsx
   <div className="group flex flex-col gap-1 rounded-md border border-edge bg-surface-primary p-3 text-content">
   ```
5. Wrap the existing ⚙ button + new ExploreJumpButton in a flex container in the header row:
   ```tsx
   <div className="flex items-center gap-1">
     {onExploreJumpClick && (
       <ExploreJumpButton label={control.factor} onClick={onExploreJumpClick} />
     )}
     <button
       ref={buttonRef}
       type="button"
       aria-label="Edit factor"
       onClick={handleSpecsClick}
       className="rounded p-1 text-content-tertiary hover:bg-surface-secondary"
     >
       ⚙
     </button>
   </div>
   ```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm --filter @variscout/ui test -- FactorChip --run`

Expected: all tests PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/ui/src/components/Canvas/EditMode/FactorZone/FactorChip.tsx \
        packages/ui/src/components/Canvas/EditMode/FactorZone/__tests__/FactorChip.test.tsx
git commit -m "$(cat <<'EOF'
feat(wedge-v1): LV1-D — FactorChip renders ExploreJumpButton

Mirrors OutcomeCard's pattern. Optional onExploreJumpClick prop;
ExploreJumpButton labeled with control.factor. stepId carry-through
happens at FactorZone (next task) — the chip itself stays dumb.

Refs: docs/superpowers/specs/2026-05-28-state-edit-mode-and-ip-scoped-presentation-design.md §4.2 + §4.6
EOF
)"
```

---

## Task 5: Wire `StepBox`

**Files:**

- Modify: `packages/ui/src/components/Canvas/EditMode/ProcessZone/StepBox.tsx`
- Modify: `packages/ui/src/components/Canvas/EditMode/ProcessZone/__tests__/StepBox.test.tsx`

- [ ] **Step 1: Append failing tests inside the existing describe block**

Append inside `describe('StepBox', ...)` in `packages/ui/src/components/Canvas/EditMode/ProcessZone/__tests__/StepBox.test.tsx`. Imports likely already include `vi` from vitest and `fireEvent`, `screen` from `@testing-library/react`; if not, add them. Add `import { createTestStep } from '../../../../../test-utils/step';` if not already present (or replace bare `{ id, name, order }` literals with the factory call).

```tsx
it('renders ExploreJumpButton when onExploreJumpClick is provided', () => {
  const step = createTestStep({ id: 'step-1', name: 'Pack', order: 0 });
  render(<StepBox step={step} onExploreJumpClick={vi.fn()} />);
  expect(screen.getByRole('button', { name: /open pack in explore/i })).toBeInTheDocument();
});

it('does NOT render ExploreJumpButton when onExploreJumpClick is undefined', () => {
  const step = createTestStep({ id: 'step-1', name: 'Pack', order: 0 });
  render(<StepBox step={step} />);
  expect(screen.queryByRole('button', { name: /open pack in explore/i })).toBeNull();
});

it('clicking ExploreJumpButton fires onExploreJumpClick', () => {
  const onExploreJumpClick = vi.fn();
  const step = createTestStep({ id: 'step-1', name: 'Pack', order: 0 });
  render(<StepBox step={step} onExploreJumpClick={onExploreJumpClick} />);
  fireEvent.click(screen.getByTestId('chip-explore-jump'));
  expect(onExploreJumpClick).toHaveBeenCalledTimes(1);
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm --filter @variscout/ui test -- StepBox --run`

Expected: 3 new tests FAIL.

- [ ] **Step 3: Implement the prop + button in StepBox**

Edit `packages/ui/src/components/Canvas/EditMode/ProcessZone/StepBox.tsx`:

1. Add `import { ExploreJumpButton } from '../ExploreJumpButton';`
2. Extend the props interface:
   ```tsx
   export interface StepBoxProps {
     step: StepBoxStep;
     timingBadge?: ReactNode;
     resourceIndicator?: ReactNode;
     onExploreJumpClick?: () => void;
   }
   ```
3. Update the function signature destructure: `export const StepBox: FC<StepBoxProps> = ({ step, timingBadge, resourceIndicator, onExploreJumpClick }) => {`
4. Add `group` to the root `<div>` className:
   ```tsx
   <div
     data-testid={`step-box-${step.id}`}
     className="group flex min-w-0 flex-col rounded-md border border-edge bg-surface-primary p-2"
   >
   ```
5. Inside the existing `<header>` block, after `resourceIndicator`, append:
   ```tsx
   {
     onExploreJumpClick && <ExploreJumpButton label={step.name} onClick={onExploreJumpClick} />;
   }
   ```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm --filter @variscout/ui test -- StepBox --run`

Expected: all tests PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/ui/src/components/Canvas/EditMode/ProcessZone/StepBox.tsx \
        packages/ui/src/components/Canvas/EditMode/ProcessZone/__tests__/StepBox.test.tsx
git commit -m "$(cat <<'EOF'
feat(wedge-v1): LV1-D — StepBox renders ExploreJumpButton

StepBox had no click handler before this PR; the new ExploreJumpButton
is the only interactive surface besides the existing droppable zones.
Per spec §4.4, the L3-drill body click stays unwired in LV1-D (separate
work).

Refs: docs/superpowers/specs/2026-05-28-state-edit-mode-and-ip-scoped-presentation-design.md §4.4
EOF
)"
```

---

## Task 6: Zone-level callback threading (`OutcomeZone` + `FactorZone` + `ProcessStructureZone`)

**Files:**

- Modify: `packages/ui/src/components/Canvas/EditMode/OutcomeZone/index.tsx`
- Modify: `packages/ui/src/components/Canvas/EditMode/OutcomeZone/__tests__/OutcomeZone.test.tsx`
- Modify: `packages/ui/src/components/Canvas/EditMode/FactorZone/index.tsx`
- Modify: `packages/ui/src/components/Canvas/EditMode/FactorZone/__tests__/FactorZone.test.tsx`
- Modify: `packages/ui/src/components/Canvas/EditMode/ProcessZone/index.tsx`
- Modify: `packages/ui/src/components/Canvas/EditMode/ProcessZone/__tests__/ProcessStructureZone.test.tsx`

- [ ] **Step 1: Append failing zone tests**

Inside each of the three zone tests, append one new test that asserts the chip's `onExploreJumpClick` callback invokes `onChipExploreJump` with the correctly-shaped target.

**OutcomeZone.test.tsx** — append inside `describe('OutcomeZone', ...)`:

```tsx
it('clicking a chip Explore button calls onChipExploreJump with { kind: outcome, columnName }', () => {
  const onChipExploreJump = vi.fn();
  const onSpecUpdate = vi.fn();
  const onSpecAdd = vi.fn();
  render(
    <OutcomeZone
      specs={[createTestOutcomeSpec({ columnName: 'Diameter' })]}
      numericValuesByColumn={{}}
      onSpecAdd={onSpecAdd}
      onSpecUpdate={onSpecUpdate}
      onChipExploreJump={onChipExploreJump}
    />
  );
  fireEvent.click(screen.getByRole('button', { name: /open diameter in explore/i }));
  expect(onChipExploreJump).toHaveBeenCalledTimes(1);
  expect(onChipExploreJump).toHaveBeenCalledWith({ kind: 'outcome', columnName: 'Diameter' });
});
```

**FactorZone.test.tsx** — append inside `describe('FactorZone', ...)` (test BOTH global and step-bound):

```tsx
it('clicking global-factor chip Explore button calls onChipExploreJump WITHOUT stepId', () => {
  const onChipExploreJump = vi.fn();
  render(
    <FactorZone
      controls={[createTestFactorControl({ factor: 'Vessel', stepId: undefined })]}
      steps={[]}
      onControlAdd={vi.fn()}
      onControlUpdate={vi.fn()}
      onChipExploreJump={onChipExploreJump}
    />
  );
  fireEvent.click(screen.getByRole('button', { name: /open vessel in explore/i }));
  expect(onChipExploreJump).toHaveBeenCalledTimes(1);
  expect(onChipExploreJump).toHaveBeenCalledWith({
    kind: 'factor',
    columnName: 'Vessel',
    stepId: undefined,
  });
});

it('clicking step-bound-factor chip Explore button calls onChipExploreJump WITH stepId', () => {
  const onChipExploreJump = vi.fn();
  render(
    <FactorZone
      controls={[createTestFactorControl({ factor: 'Temperature', stepId: 'step-2' })]}
      steps={[{ id: 'step-2', name: 'Heat' }]}
      onControlAdd={vi.fn()}
      onControlUpdate={vi.fn()}
      onChipExploreJump={onChipExploreJump}
    />
  );
  fireEvent.click(screen.getByRole('button', { name: /open temperature in explore/i }));
  expect(onChipExploreJump).toHaveBeenCalledTimes(1);
  expect(onChipExploreJump).toHaveBeenCalledWith({
    kind: 'factor',
    columnName: 'Temperature',
    stepId: 'step-2',
  });
});
```

**ProcessStructureZone.test.tsx** — append inside `describe('ProcessStructureZone', ...)`:

```tsx
it('clicking a step Explore button calls onChipExploreJump with { kind: step, stepId }', () => {
  const onChipExploreJump = vi.fn();
  render(
    <ProcessStructureZone
      steps={[createTestStep({ id: 'step-1', name: 'Pack', order: 0 })]}
      onChipExploreJump={onChipExploreJump}
    />
  );
  fireEvent.click(screen.getByRole('button', { name: /open pack in explore/i }));
  expect(onChipExploreJump).toHaveBeenCalledTimes(1);
  expect(onChipExploreJump).toHaveBeenCalledWith({ kind: 'step', stepId: 'step-1' });
});
```

Add factory imports + scope-store imports + `import type { ChipNavigationTarget } from '...'` where needed.

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm --filter @variscout/ui test -- OutcomeZone FactorZone ProcessStructureZone --run`

Expected: 4 new tests FAIL.

- [ ] **Step 3: Implement zone threading**

For each zone, accept `onChipExploreJump?: (target: ChipNavigationTarget) => void` and pass the bound callback to each child chip.

**OutcomeZone/index.tsx:**

1. Import: `import type { ChipNavigationTarget } from '../handlers/navigateToExploreForChip';`
2. Extend `OutcomeZoneProps`:
   ```tsx
   onChipExploreJump?: (target: ChipNavigationTarget) => void;
   ```
3. Destructure the prop in the function signature.
4. In the `specs.map(spec => <OutcomeCard ... />)` JSX, pass:
   ```tsx
   onExploreJumpClick={
     onChipExploreJump
       ? () => onChipExploreJump({ kind: 'outcome', columnName: spec.columnName })
       : undefined
   }
   ```

**FactorZone/index.tsx:**

1. Same import.
2. Extend `FactorZoneProps` with `onChipExploreJump?`.
3. Destructure.
4. In `controls.map(control => <FactorChip ... />)`:
   ```tsx
   onExploreJumpClick={
     onChipExploreJump
       ? () =>
           onChipExploreJump({
             kind: 'factor',
             columnName: control.factor,
             stepId: control.stepId,
           })
       : undefined
   }
   ```

**ProcessZone/index.tsx:**

1. Same import.
2. Extend `ProcessStructureZoneProps` with `onChipExploreJump?`.
3. Destructure.
4. In the `sortedSteps.map(...)` rendering `<StepBox>`:
   ```tsx
   onExploreJumpClick={
     onChipExploreJump
       ? () => onChipExploreJump({ kind: 'step', stepId: step.id })
       : undefined
   }
   ```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm --filter @variscout/ui test -- OutcomeZone FactorZone ProcessStructureZone --run`

Expected: all tests PASS (existing zone tests stay green since the new prop is optional).

- [ ] **Step 5: Commit**

```bash
git add packages/ui/src/components/Canvas/EditMode/OutcomeZone/index.tsx \
        packages/ui/src/components/Canvas/EditMode/OutcomeZone/__tests__/OutcomeZone.test.tsx \
        packages/ui/src/components/Canvas/EditMode/FactorZone/index.tsx \
        packages/ui/src/components/Canvas/EditMode/FactorZone/__tests__/FactorZone.test.tsx \
        packages/ui/src/components/Canvas/EditMode/ProcessZone/index.tsx \
        packages/ui/src/components/Canvas/EditMode/ProcessZone/__tests__/ProcessStructureZone.test.tsx
git commit -m "$(cat <<'EOF'
feat(wedge-v1): LV1-D — zone-level onChipExploreJump threading

OutcomeZone / FactorZone / ProcessStructureZone accept an optional
onChipExploreJump callback. Each zone builds the correct
ChipNavigationTarget for its child chip type. FactorZone reads
control.stepId per spec §4.6 (step-bound chips at L3 inherit the
step-context automatically). When the callback is undefined, no
ExploreJumpButton renders downstream.

Refs: docs/superpowers/specs/2026-05-28-state-edit-mode-and-ip-scoped-presentation-design.md §4.2 + §4.4 + §4.6
EOF
)"
```

---

## Task 7: CanvasWorkspace prop + Azure `FrameView` integration + barrel exports

**Files:**

- Modify: `packages/ui/src/components/Canvas/CanvasWorkspace.tsx`
- Modify: `packages/ui/src/components/Canvas/__tests__/CanvasWorkspace.test.tsx` (one integration test)
- Modify: `packages/ui/src/components/Canvas/index.tsx` — re-export `navigateToExploreForChip`, `ChipNavigationTarget`, `ExploreJumpButton`
- Modify: `packages/ui/src/index.ts` — same re-exports
- Modify: `apps/azure/src/components/editor/FrameView.tsx` — wire `handleChipExploreJump`
- Modify: `apps/azure/src/components/editor/__tests__/FrameView.test.tsx` — one integration test

- [ ] **Step 1: Write failing CanvasWorkspace integration test**

Append inside `describe('CanvasWorkspace', ...)` (or a relevant nested describe) in `packages/ui/src/components/Canvas/__tests__/CanvasWorkspace.test.tsx`:

```tsx
it('LV1-D: clicking an outcome chip Explore button bubbles through to onChipExploreJump', () => {
  const onChipExploreJump = vi.fn();
  // Use the file's existing render helper / props pattern. The key bits:
  // - outcomeSpecs contains one spec for 'Diameter'
  // - canEditCanvas is true so the b1 archetype renders
  // - onChipExploreJump prop is supplied
  // If the file has a helper like `renderCanvasWorkspace(...)`, extend it
  // to forward onChipExploreJump. Otherwise inline the props.
  render(
    <CanvasWorkspaceTestHarness
      outcomeSpecs={[createTestOutcomeSpec({ columnName: 'Diameter' })]}
      canEditCanvas={true}
      onChipExploreJump={onChipExploreJump}
    />
  );
  fireEvent.click(screen.getByRole('button', { name: /open diameter in explore/i }));
  expect(onChipExploreJump).toHaveBeenCalledWith({ kind: 'outcome', columnName: 'Diameter' });
});
```

If `CanvasWorkspaceTestHarness` doesn't exist, look for the existing test render pattern in the file (likely a direct `render(<CanvasWorkspace {...props} />)` with a fixed `outcomeSpecs` mock). Mirror it. If the existing CanvasWorkspace test setup is too complex (visx mocks, DnD-kit harness, etc.) to extend cleanly, defer this single integration assertion + rely on the zone-level tests + the FrameView integration test in Step 7. Document the deferral in the PR description.

- [ ] **Step 2: Run the failing CanvasWorkspace test**

Run: `pnpm --filter @variscout/ui test -- CanvasWorkspace --run`

Expected: the new test FAILS (prop doesn't exist).

- [ ] **Step 3: Add `onChipExploreJump` prop to CanvasWorkspace + thread through to all three zones**

Edit `packages/ui/src/components/Canvas/CanvasWorkspace.tsx`:

1. Add `import type { ChipNavigationTarget } from './EditMode/handlers/navigateToExploreForChip';` near the existing `Canvas/EditMode/...` imports.
2. Extend the props interface (find `CanvasWorkspaceProps`):
   ```tsx
   /**
    * LV1-D: dispatched when a chip's "Open in Explore" affordance is clicked.
    * Caller is responsible for mutating analysisScopeStore + switching to the
    * Explore tab (typically via `navigateToExploreForChip(target, () =>
    * panelsStore.showExplore())`). PWA leaves this undefined; Azure wires it.
    */
   onChipExploreJump?: (target: ChipNavigationTarget) => void;
   ```
3. Destructure the prop in the function signature.
4. Locate the three zone mounts inside the b1 render path (`<OutcomeZone ... />`, `<FactorZone ... />`, `<ProcessStructureZone ... />` — under the existing DndContext at ~line 1247). Pass `onChipExploreJump={onChipExploreJump}` to each.

- [ ] **Step 4: Run CanvasWorkspace tests to verify they pass**

Run: `pnpm --filter @variscout/ui test -- CanvasWorkspace --run`

Expected: existing CanvasWorkspace tests + the new LV1-D integration test all PASS.

- [ ] **Step 5: Update barrels**

Edit `packages/ui/src/components/Canvas/index.tsx`: add to the existing exports:

```tsx
export { navigateToExploreForChip } from './EditMode/handlers/navigateToExploreForChip';
export type { ChipNavigationTarget } from './EditMode/handlers/navigateToExploreForChip';
export { ExploreJumpButton } from './EditMode/ExploreJumpButton';
```

Edit `packages/ui/src/index.ts`: re-export the same three symbols (search for the existing `Canvas/` block; mirror the pattern).

- [ ] **Step 6: Wire Azure `FrameView`**

Edit `apps/azure/src/components/editor/FrameView.tsx`:

1. Update the top-level `@variscout/ui` import (around line 9) to include `navigateToExploreForChip` and `type ChipNavigationTarget`:
   ```tsx
   import {
     CanvasWorkspace,
     navigateToExploreForChip,
     // ... existing imports
     type ChipNavigationTarget,
   } from '@variscout/ui';
   ```
2. Add a `handleChipExploreJump` callback near the existing `handleExploreExit` (~line 236):
   ```tsx
   const handleChipExploreJump = React.useCallback((target: ChipNavigationTarget) => {
     navigateToExploreForChip(target, () => usePanelsStore.getState().showExplore());
   }, []);
   ```
3. Pass it to `<CanvasWorkspace ... />` (~line 376) alongside `onExploreExit`:
   ```tsx
   onChipExploreJump = { handleChipExploreJump };
   ```

- [ ] **Step 7: Write + run failing FrameView integration test**

Append to `apps/azure/src/components/editor/__tests__/FrameView.test.tsx`:

```tsx
it('LV1-D: onChipExploreJump from CanvasWorkspace mutates scope + switches to Explore', () => {
  useAnalysisScopeStore.setState(getAnalysisScopeInitialState());
  usePanelsStore.setState({ activeView: 'frame' });

  // Spy on the prop passed to CanvasWorkspace. Reuse the file's existing
  // render harness if available; otherwise stub @variscout/ui's
  // CanvasWorkspace with vi.mock and capture onChipExploreJump from props.
  let capturedHandler: ((target: ChipNavigationTarget) => void) | undefined;
  vi.mocked(CanvasWorkspace).mockImplementation(
    (props: { onChipExploreJump?: (t: ChipNavigationTarget) => void }) => {
      capturedHandler = props.onChipExploreJump;
      return <div data-testid="canvas-workspace-stub" />;
    }
  );

  render(<FrameView /* existing test props */ />);

  // Simulate a chip click bubbling through the captured handler:
  capturedHandler?.({ kind: 'outcome', columnName: 'Diameter' });

  expect(useAnalysisScopeStore.getState().yColumn).toBe('Diameter');
  expect(usePanelsStore.getState().activeView).toBe('explore');
});
```

If the file already mocks `CanvasWorkspace` differently, mirror that. The acceptance is: simulating the handler being invoked sets `yColumn` + switches `activeView`. Add imports as needed (`useAnalysisScopeStore`, `getAnalysisScopeInitialState`, `usePanelsStore`, `ChipNavigationTarget`).

Run: `pnpm --filter @variscout/azure-app test -- FrameView --run`

Expected: the new test PASSES (the FrameView wiring just landed in Step 6).

- [ ] **Step 8: Cross-package builds + full UI suite**

Run from the worktree root (all three commands sequentially):

```bash
pnpm --filter @variscout/ui test --run
pnpm --filter @variscout/ui build
pnpm --filter @variscout/azure-app build
```

Expected: all green. The `@variscout/ui` build catches any tsc drift in the barrel re-exports (`feedback_ui_build_before_merge`). The azure-app build catches any drift in the `FrameView` import shape.

If anything fails, fix in place (use Edit not Bash sed). Do not skip type errors.

- [ ] **Step 9: Commit (FrameView + barrels + CanvasWorkspace edits in one commit)**

```bash
git add packages/ui/src/components/Canvas/CanvasWorkspace.tsx \
        packages/ui/src/components/Canvas/__tests__/CanvasWorkspace.test.tsx \
        packages/ui/src/components/Canvas/index.tsx \
        packages/ui/src/index.ts \
        apps/azure/src/components/editor/FrameView.tsx \
        apps/azure/src/components/editor/__tests__/FrameView.test.tsx
git commit -m "$(cat <<'EOF'
feat(wedge-v1): LV1-D — CanvasWorkspace.onChipExploreJump + Azure FrameView wiring

CanvasWorkspace accepts an optional onChipExploreJump prop and
threads it to the three EditMode zones. Azure FrameView builds
handleChipExploreJump using navigateToExploreForChip + panelsStore.
showExplore() per spec D8.1 (no focusedChart, no pendingExploreIntent).
PWA leaves the prop undefined; chips render without the affordance
until PWA-side panelsStore gains scoped navigation support.

Barrels re-export navigateToExploreForChip, ChipNavigationTarget,
and ExploreJumpButton from @variscout/ui.

Refs: docs/superpowers/specs/2026-05-28-state-edit-mode-and-ip-scoped-presentation-design.md §3 D4 + D7 + D8.1 + §4.2-§4.6
EOF
)"
```

---

## Acceptance signal (end-of-PR, pre-final-review)

Controller-level sweep after Task 7 (per `feedback_implementer_long_bash_pitfall` — implementer's per-task verification is <90s targeted runs; full sweep is here):

```bash
pnpm --filter @variscout/ui test --run
pnpm --filter @variscout/ui build
pnpm --filter @variscout/azure-app test --run
pnpm --filter @variscout/azure-app build
bash scripts/pr-ready-check.sh
```

Expected:

- All `@variscout/ui` tests PASS — helper (6), button (4), OutcomeCard (5+3), FactorChip (existing+3), StepBox (existing+3), three zones (existing+1 each), CanvasWorkspace integration (existing+1).
- `@variscout/ui` build clean — no tsc errors from new types/exports.
- `@variscout/azure-app` tests + build PASS — new FrameView integration test green; existing tests unchanged.
- `bash scripts/pr-ready-check.sh` green (modulo pre-existing `ControlEditors.test.tsx` flake — verify structural unrelation via `git diff --stat main..HEAD -- apps/azure/src/components/ControlEditors* apps/azure/src/services/*` returning empty + document in PR description).
- **Acceptance grep:** `grep -r "navigateToExploreForChip" packages/ apps/` returns the helper file + helper test + 1 Azure call site in FrameView + barrel re-exports — nothing surprising.
- **Architecture grep:** `grep -rn "from '@variscout/' apps/" packages/ui/src/` returns no hits (UI doesn't import apps; verifies the callback-injection pattern held).
- Branch contains 7 commits preserved via `gh pr merge --merge --delete-branch`, never `--squash` (`feedback_preserve_commit_history`).
- Manual smoke not required (wedge V1 no-browser-walk policy per `feedback_wedge_v1_no_migration_no_backcompat`).

---

## Why 7 bite-sized tasks (and not an atomic-sweep dispatch)

Unlike LV1-C, this PR is purely additive: a new helper, a new primitive, new OPTIONAL props on existing chips + zones + CanvasWorkspace, plus one new integration point in Azure FrameView. Every task leaves the tsc tree clean because all new props are optional and existing callers keep working unchanged. Per `feedback_atomic_sweep_one_dispatch`, atomic sweep is reserved for "public-API change forces a tsc-wide breaking change" — not this case.

Sonnet implementer per task is appropriate (well-specified UI work; reuses existing chip + DnD architecture).

---

## Related

- Parent spec: `docs/superpowers/specs/2026-05-28-state-edit-mode-and-ip-scoped-presentation-design.md` §3 D4 + D7 + D8.1 + §4.2–§4.6
- Master plan: `docs/superpowers/plans/2026-05-28-linked-views-phase-1-master-plan.md` PR-LV1-D row
- LV1-A precedent (scope store): `docs/superpowers/plans/2026-05-28-pr-lv1-a-analysis-scope-store.md`
- LV1-H precedent (most recent bite-sized TDD sub-plan): `docs/superpowers/plans/2026-05-28-pr-lv1-h-outcome-summary-pill.md`
- LV1-C precedent (atomic-sweep contrast): `docs/superpowers/plans/2026-05-28-pr-lv1-c-retire-authoring-mode.md`
- F1's existing exit pattern: `packages/ui/src/components/Canvas/EditMode/ExploreExitButton.tsx` + `FrameView.tsx:236-241`
- Test factories: `packages/ui/src/test-utils/{outcomeSpec,factorControl,step}.ts`
- Memory: `feedback_subagent_no_verify`, `feedback_subagent_worktree_discipline`, `feedback_implementer_long_bash_pitfall`, `feedback_wedge_v1_no_migration_no_backcompat`, `feedback_bundle_followups_pre_merge`, `feedback_preserve_commit_history`, `feedback_ui_build_before_merge`, `feedback_reuse_production_primitives`, `feedback_atomic_sweep_one_dispatch`, `feedback_code_review_subagent_must_checkout_pr_branch`
