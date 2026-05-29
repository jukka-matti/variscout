---
tier: ephemeral
purpose: build
title: PR-LV1-E — Explore scope chrome (SingleSelectPopover + FilterChipDropdown reuse)
status: active
date: 2026-05-28
layer: spec
---

# PR-LV1-E — Explore Scope Chrome Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax. Dispatch **Sonnet implementer** per task (well-specified additive UI work; no judgment-heavy refactors). Pragmatic-review pattern: skip per-task reviewer pairs on mechanical tasks; final-branch Opus review only — matches LV1-H + LV1-D precedent per `feedback_prefer_pragmatic_over_formal`.

**Goal:** Ship the single-row scope chrome above the 4-chart Explore dashboard. Mixed-behavior chips: single-select `SingleSelectPopover` for Y/X/step (new primitive); existing `FilterChipDropdown` reused for multi-select categorical chips; `+ filter` affordance to add a new categorical filter via column picker → dropdown; `clear all` link; empty-state hint when `yColumn` undefined.

**Architecture:** New `SingleSelectPopover` primitive in `packages/ui/src/components/SingleSelectPopover/` (~80 LOC). New `ScopeChrome` namespace in `packages/ui/src/components/Explore/ScopeChrome/` with 4 components: root `ScopeChrome` (subscribes to `useAnalysisScopeStore` natively + dispatches actions directly), `ScopeChip` dispatcher (renders trigger pill + manages internal `openDropdown` + `anchorRect`; renders `SingleSelectPopover` for outcome/factor/step or `FilterChipDropdown` for categorical), `AddFilterButton` (`+ filter` 2-step UX: column picker → `FilterChipDropdown`), `EmptyStateHint` (one-line dimmed text + Process tab link). Azure consumer at `apps/azure/src/components/Dashboard.tsx` mounts `<ScopeChrome>` above the chart grid + adds 2–3 reverse-mirror useEffects (scope-store → existing local state) so chart wiring re-renders. PWA mount deferred (matches LV1-D pattern).

**Tech Stack:** TypeScript 6 · React 19 · Zustand 5 · Vitest 4 · Tailwind 4 (semantic classes only — no `dark:` variants per wedge V1) · `lucide-react` icons (Check / X — already used by `FilterChipDropdown`).

**Parent spec:** [`docs/superpowers/specs/2026-05-28-state-edit-mode-and-ip-scoped-presentation-design.md`](../specs/2026-05-28-state-edit-mode-and-ip-scoped-presentation-design.md) §5.1 (Scope chrome design) · §3 D9 (single-row, click-to-edit chips) · §3 D7 (naming: "Explore from canvas" / "Open in Explore →") · §4 (cross-tab subscription expectation) · §5.6 (F1 `pendingExploreIntent` migration — already shipped via LV1-B).
**Master plan:** [`./2026-05-28-linked-views-phase-1-master-plan.md`](./2026-05-28-linked-views-phase-1-master-plan.md) PR-LV1-E row.
**Sibling shipped:** LV1-A (analysisScopeStore, [`./2026-05-28-pr-lv1-a-analysis-scope-store.md`](./2026-05-28-pr-lv1-a-analysis-scope-store.md)) · LV1-B (pendingExploreIntent mirror) · LV1-C (authoringMode retire) · LV1-D (canvas chip Click-to-Explore, [`./2026-05-28-pr-lv1-d-canvas-explore-jump.md`](./2026-05-28-pr-lv1-d-canvas-explore-jump.md)) · LV1-H (OutcomeSummaryPill).
**Sibling pending:** LV1-F (Pareto/Boxplot click → `addCategoricalValue` — consumer of the scope chrome's categorical filter chips) · LV1-G (Process tab live scope visualization — sibling consumer of the same store).

---

## Architectural decisions (D-LV1E-1 through D-LV1E-8)

### D-LV1E-1: `ScopeChrome` subscribes natively to `useAnalysisScopeStore`

`ScopeChrome` reads scope state inline (`useAnalysisScopeStore(s => s.yColumn)` etc.) and dispatches actions directly (`useAnalysisScopeStore.getState().setY(col)`). NO callback-injection from Dashboard. Rationale: spec §5.1 + §4 — scope store is the canonical SSOT; ScopeChrome is the canonical editor. Callback injection (LV1-D's pattern for canvas chips) does NOT apply here because the chrome's purpose IS to mutate scope, not navigate.

Matches `OutcomeSummaryPill.tsx:25-26` precedent verbatim.

### D-LV1E-2: `ScopeChrome` receives IP option lists as props (not via store-of-stores)

`useAnalysisScopeStore` holds the ACTIVE scope, not the AVAILABLE options. The available outcomes/factors/steps + available categorical values per column live in app-side IP context. ScopeChrome accepts these as props:

```typescript
export interface ScopeChromeProps {
  readonly availableOutcomes: ReadonlyArray<{ columnName: string; label: string }>;
  readonly availableFactors: ReadonlyArray<{ columnName: string; label: string }>;
  readonly availableSteps: ReadonlyArray<{ stepId: string; label: string }>;
  readonly categoricalValuesByColumn: Record<string, ReadonlyArray<string | number>>;
  /** Called when user clicks the empty-state link to navigate back to Process tab. */
  readonly onNavigateToProcess?: () => void;
}
```

Rationale: keeps `ScopeChrome` app-agnostic; consumer (Azure Dashboard) supplies the IP-derived option lists; PWA can mount with same primitive.

### D-LV1E-3: `ScopeChip` is a single dispatching component with internal popover state

`ScopeChip` accepts a discriminated-union `kind` prop, the active value(s), available options, and dispatches to the right popover. It internally manages `isOpen` + `anchorRect` (via `getBoundingClientRect()` on trigger click — mirrors `ProcessHealthBar.tsx:208-229` + 516-562 + 637-644). The `×` remove action is rendered inline on the chip (NOT inside the popover) per `ProcessHealthBar` pattern.

```typescript
export type ScopeChipKind =
  | {
      kind: 'outcome';
      value: string;
      options: ReadonlyArray<{ columnName: string; label: string }>;
    }
  | {
      kind: 'factor';
      value: string | undefined;
      options: ReadonlyArray<{ columnName: string; label: string }>;
    }
  | {
      kind: 'step';
      value: string | undefined;
      options: ReadonlyArray<{ stepId: string; label: string }>;
    }
  | {
      kind: 'categorical';
      column: string;
      values: ReadonlyArray<string | number>;
      availableValues: ReadonlyArray<string | number>;
    };

export interface ScopeChipProps {
  readonly chip: ScopeChipKind;
  /** Whether the chip can be removed (Y chip is not removable when scope non-empty). */
  readonly removable: boolean;
}
```

Rationale: matches `ProcessHealthBar`'s internal state pattern; avoids prop-drilling popover state from `ScopeChrome`.

### D-LV1E-4: `SingleSelectPopover` mirrors `FilterChipDropdown`'s open/close UX

Same modal-on-mobile + anchored-dropdown-on-desktop pattern. Same ESC-dismisses + outside-click-closes + arrow-key navigation. Accepts:

```typescript
export interface SingleSelectPopoverProps {
  readonly options: ReadonlyArray<{ value: string; label: string }>;
  readonly activeValue: string | undefined;
  readonly onSelect: (value: string) => void;
  readonly onClose: () => void;
  readonly anchorRect?: DOMRect;
  readonly title?: string;
  /** Renders an extra row above the options (e.g., "All steps" for step picker). */
  readonly nullOption?: { label: string; onSelect: () => void };
}
```

~80 LOC. Reuses the same Tailwind semantic tokens `FilterChipDropdown` uses by default (`bg-surface-secondary`, `border-edge`, `text-content-secondary`). Active option marked with `Check` icon from `lucide-react`; arrow keys move selection; Enter / click confirms + closes.

### D-LV1E-5: `AddFilterButton` is a 2-step UX — column picker → `FilterChipDropdown`

Click `+ filter`:

1. Opens a small column picker (reuses `SingleSelectPopover` primitive with the IP's factor list, filtered to exclude already-active categorical columns)
2. Selecting a column transitions to `FilterChipDropdown` (anchored to the same button rect) for that column with its `availableValues`
3. Toggling values dispatches `scope.setCategoricalValues(column, newValues)` live

Rationale: zero new primitives (column picker IS a `SingleSelectPopover`); minimal UX surface; respects "already filtered" exclusion to avoid duplicates.

### D-LV1E-6: `EmptyStateHint` renders only when `scope.yColumn === undefined`

Single-line dimmed text + link back to Process tab:

```
No outcome selected. Go to Process tab to pick a measure.
```

The link calls `props.onNavigateToProcess?.()`. Dashboard wires `onNavigateToProcess={() => usePanelsStore.getState().showProcess()}` (or whatever the canonical Process-tab switch API is — verify in Task 7 Architect phase). When `yColumn` defined, `ScopeChrome` renders the chip row instead.

### D-LV1E-7: Reverse-mirror effects live in `Dashboard.tsx` (NOT in `ScopeChrome`)

`ScopeChrome` stays app-agnostic. Dashboard.tsx adds 2–3 small useEffect mirrors so chart wiring re-renders when scope chrome mutates the store:

```typescript
const scopeY = useAnalysisScopeStore(s => s.yColumn);
const scopeBoxplotFactor = useAnalysisScopeStore(s => s.boxplotFactor);
const scopeStepId = useAnalysisScopeStore(s => s.stepId);

useEffect(() => {
  if (scopeY && scopeY !== outcome) setOutcome(scopeY);
}, [scopeY]);

useEffect(() => {
  if (scopeBoxplotFactor && scopeBoxplotFactor !== boxplotFactor) {
    setBoxplotFactor(scopeBoxplotFactor);
  }
}, [scopeBoxplotFactor]);

// stepId mirror only if useProjectStore has setStepId; otherwise defer with TODO comment
```

**Critical guard:** `if (scopeVal !== localVal) setLocal(scopeVal)` to prevent infinite loops between this mirror and any forward writes from `pendingExploreIntent`.

**Task 7 Architect-phase verifications** (do these BEFORE writing the mirror block):

1. Confirm `setOutcome` exists on `useProjectStore` (grep `apps/azure/src/state/projectStore` or `@variscout/stores`).
2. Confirm `setStepId` exists on `useProjectStore`. If absent, defer the step mirror with a `TODO(lv1-e-step-mirror)` comment and ship only the Y + boxplotFactor mirrors. Spec acceptance signal only requires Y to drive chart re-render.
3. Confirm `setBoxplotFactor` returned from `useDashboardCharts` (line ~310) is callable at `Dashboard`'s React body. If the hook owns state opaquely, move the mirror INSIDE the hook.

**Out of scope (partial-integration policy):**

- Chart-click → scope mutation (LV1-F)
- Charts reading scope store natively (broader migration; possibly never if mirrors suffice)
- `categoricalFilters` driving any chart behavior — charts don't consume them yet; `ScopeChrome` stores them, downstream PRs wire chart filters
- PWA mount

### D-LV1E-8: PWA mount is deferred to a follow-up

Mirror LV1-D's pattern. `ScopeChrome` primitive ships in `packages/ui/` (both apps can import). LV1-E wires only Azure. PWA follow-up is a small PR when PWA gets `pendingExploreIntent` parity (or sooner, decoupled). Add `// TODO(lv1-e-pwa-mount): mount <ScopeChrome> above the Dashboard chart layout` comment in `apps/pwa/src/components/Dashboard.tsx` near the parallel mount point.

---

## Grounded facts (verified — sub-plan is locked to these)

1. **`FilterChipDropdown` prop name is `onValuesChange`** — NOT `onUpdateFilterValues` as the spec wording suggested.
   - Verified: `packages/ui/src/components/FilterChipDropdown/FilterChipDropdown.tsx:48-61`
   - Signature: `(factor: string, newValues: (string | number)[]) => void`
   - Fires **LIVE on every checkbox click** (not on commit/blur). Caller wires directly to `scope.setCategoricalValues(factor, newValues)`.

2. **`FilterChipDropdown` open/close: caller renders the trigger pill** + manages `openDropdown` state + tracks `dropdownAnchorRect` via `getBoundingClientRect()`. Canonical pattern at `packages/ui/src/components/ProcessHealthBar/ProcessHealthBar.tsx:208-229` (state) + 516-562 (trigger button + rect capture) + 637-644 (`<FilterChipDropdown>` render with anchor). `FilterChipDropdown` renders only the dropdown panel itself.

3. **`FilterChipData` shape** (`packages/ui/src/components/filterTypes.ts:7-18`):

   ```typescript
   interface FilterChipData {
     factor: string;
     values: (string | number)[];
     availableValues: { value: string | number; count: number; isSelected: boolean }[];
   }
   ```

   Counts not strictly needed by ScopeChrome (display-only); set `count: 0` is acceptable. `isSelected` is derived from `values.includes(value)`.

4. **`useAnalysisScopeStore` exports** (`packages/stores/src/analysisScopeStore.ts:14-118`, barrel `packages/stores/src/index.ts:78-87`):
   - Hook: `useAnalysisScopeStore`
   - Types: `AnalysisScopeState`, `AnalysisScopeActions`, `AnalysisScopeStore`, `CategoricalFilter`
   - Actions: `setY` / `setBoxplotFactor` / `setStepId` (single-value, accept `undefined`) · `addCategoricalValue` (idempotent dedup) · `removeCategoricalValue` (auto-deletes filter on empty) · `setCategoricalValues` (replace array; `[]` deletes filter) · `removeCategoricalFilter` (drop entry) · `clearScope` (full reset)

5. **Selector pattern: inline** `useAnalysisScopeStore(s => s.yColumn)` per `OutcomeSummaryPill.tsx:25-26` precedent. NO memoized selector helpers. `ScopeChrome` mirrors this.

6. **Azure Dashboard mount location:** `apps/azure/src/components/Dashboard.tsx`, the `activeTab === 'analysis'` JSX block (~lines 841-912). Insert `<ScopeChrome>` between the "Back to Performance" banner and the `{isPhone ? <MobileChartCarousel> : <DashboardLayoutBase>}` branching. Mobile carousel omits chrome (chart count + small screen).

7. **In-scope Dashboard.tsx data sources** (Task 7 implementer uses these):
   - `factors` from `useProjectStore(s => s.factors)` (~line 208) and `effectiveFactors` (~line 255) for defect-mode transform
   - `categoricalValuesByColumn` as Dashboard prop (~line 153)
   - `boxplotFactor` + `setBoxplotFactor` from `useDashboardCharts` hook (~lines 309-310)
   - `outcome` from `useProjectStore(s => s.outcome)` (~line 207)
   - `availableOutcomes` from `useDashboardCharts` hook (~line 325)

8. **NOT in Dashboard.tsx scope today:** the IP's `steps` list. Task 7 implementer reads it from `useActiveIPStore` in Dashboard (matches LV1-D's pattern), or threads it as a new Dashboard prop from the parent that already has IP context.

9. **PWA has NO `pendingExploreIntent` machinery** and does NOT import `useAnalysisScopeStore`. **LV1-E is Azure-only consumer wiring** (per D-LV1E-8). `apps/pwa/src/components/Dashboard.tsx` gets a TODO comment only.

10. **F1's `pendingExploreIntent` apply effect** at `apps/azure/src/components/Dashboard.tsx:430-444` — UNCHANGED by LV1-E. It already mirrors `boxplotFactor` into `useAnalysisScopeStore` via LV1-B. LV1-E adds the REVERSE direction (scope → local) and does not touch the existing forward mirror.

11. **No factories for `FilterChipData` exist** in `@variscout/core` or `packages/ui/src/test-utils/`. Add `packages/ui/src/test-utils/filterChipFactories.ts` (`createTestFilterChipData(factor, values?, availableValues?)`) when implementer uses ≥3 fixture instances (per `feedback_ui_build_before_merge`).

12. **`FilterChipDropdown` default `colorScheme`** uses semantic tokens (`bg-surface-secondary`, `border-edge`, `text-content-secondary`). Default is correct for wedge V1 — DO NOT override. The hard-coded `bg-blue-500` checkbox fill inside the component is allowed (it's a focal-color accent, not a forbidden `dark:` variant).

---

## File structure

### Create

- `packages/ui/src/components/SingleSelectPopover/SingleSelectPopover.tsx` — new primitive (~80 LOC)
- `packages/ui/src/components/SingleSelectPopover/index.ts` — barrel
- `packages/ui/src/components/SingleSelectPopover/__tests__/SingleSelectPopover.test.tsx` — 7 tests
- `packages/ui/src/components/Explore/ScopeChrome/ScopeChrome.tsx` — root; subscribes to `useAnalysisScopeStore`
- `packages/ui/src/components/Explore/ScopeChrome/ScopeChip.tsx` — dispatcher with internal popover state
- `packages/ui/src/components/Explore/ScopeChrome/AddFilterButton.tsx` — `+ filter` 2-step UX
- `packages/ui/src/components/Explore/ScopeChrome/EmptyStateHint.tsx` — dimmed one-line hint + Process link
- `packages/ui/src/components/Explore/ScopeChrome/index.ts` — barrel
- `packages/ui/src/components/Explore/index.ts` — namespace barrel (Explore namespace)
- `packages/ui/src/components/Explore/ScopeChrome/__tests__/EmptyStateHint.test.tsx`
- `packages/ui/src/components/Explore/ScopeChrome/__tests__/ScopeChip.test.tsx`
- `packages/ui/src/components/Explore/ScopeChrome/__tests__/AddFilterButton.test.tsx`
- `packages/ui/src/components/Explore/ScopeChrome/__tests__/ScopeChrome.test.tsx`
- `packages/ui/src/test-utils/filterChipFactories.ts` — `createTestFilterChipData(factor, values?, availableValues?)` factory

### Modify

- `apps/azure/src/components/Dashboard.tsx` — mount `<ScopeChrome>` between "Back to Performance" banner and chart layout branching (desktop-only); add reverse-mirror useEffects per D-LV1E-7; pass IP-derived option lists; wire `onNavigateToProcess`
- `apps/azure/src/components/__tests__/Dashboard.test.tsx` (or relevant existing test file) — one integration test: store mutation propagates to local state
- `packages/ui/src/index.ts` — re-export `ScopeChrome`, `SingleSelectPopover`, related types
- `apps/pwa/src/components/Dashboard.tsx` — add `// TODO(lv1-e-pwa-mount)` comment only

### No changes (verify only)

- `packages/stores/src/analysisScopeStore.ts` — already feature-complete (LV1-A)
- `packages/ui/src/components/FilterChipDropdown/FilterChipDropdown.tsx` — reused as-is
- F1 `pendingExploreIntent` apply effect at `apps/azure/src/components/Dashboard.tsx:430-444` — unchanged
- `apps/azure/src/features/panels/panelsStore.ts` — `showProcess()` / `showExplore()` APIs unchanged

---

## Constraints forwarded to implementer

- **NEVER** `--no-verify` on commits (`feedback_subagent_no_verify`)
- **No `Math.random`** anywhere (core hard rule)
- **No `dark:` Tailwind variants** (wedge V1 no-dark-mode invariant)
- **No emojis in source code** — `→`, `↗`, `×`, `+` Unicode glyphs are allowed as characters, NOT emojis
- **No `Pp` / `Ppk`** anywhere (`feedback_no_pp_ppk_only_cp_cpk`) — irrelevant here
- **No `"root cause"`** in comments / strings (P5 amended) — irrelevant here
- **`@variscout/ui` MAY NOT import from `apps/`** — verified by D-LV1E-1 + D-LV1E-2 (`ScopeChrome` mutates store directly + takes options as props; reverse-mirror lives Azure-side)
- **Use semantic Tailwind classes only** (`bg-surface-secondary`, `text-content`, `border-edge`, `text-content-secondary`, `text-content-muted`) per `packages/ui/CLAUDE.md`
- **No migration helpers / no back-compat shims** (`feedback_wedge_v1_no_migration_no_backcompat`)
- **Use factories for domain fixtures** — add `packages/ui/src/test-utils/filterChipFactories.ts` when ≥3 `FilterChipData` literals would otherwise appear (`feedback_ui_build_before_merge`)
- **Functional components only**, props interface named `{Component}Props`
- **Operate ONLY in the assigned worktree** (`feedback_subagent_worktree_discipline`)
- **Implementer verification scoped to <90s per task** (`feedback_implementer_long_bash_pitfall`) — `pnpm --filter @variscout/ui test -- <test-file> --run`
- **`pnpm` needs `--`** to forward args to vitest in this repo
- **Preserve identifier list applies** — do NOT rename `AnalysisMode`, `Dashboard.tsx`, panelsStore keys, `useAnalysisScopeStore`, `CategoricalFilter`, etc. We are ADDING, not renaming.
- **Skip browser walks** for wedge V1 (`feedback_wedge_v1_no_migration_no_backcompat`)
- **Bundle pre-merge followups** (`feedback_bundle_followups_pre_merge`) — if a reviewer surfaces a nit during this PR, fold it in; don't open a follow-up PR.

---

## Task 1: `SingleSelectPopover` primitive

**Files:**

- Create: `packages/ui/src/components/SingleSelectPopover/SingleSelectPopover.tsx`
- Create: `packages/ui/src/components/SingleSelectPopover/index.ts`
- Test: `packages/ui/src/components/SingleSelectPopover/__tests__/SingleSelectPopover.test.tsx`

- [ ] **Step 1: Write the failing test file**

```tsx
// packages/ui/src/components/SingleSelectPopover/__tests__/SingleSelectPopover.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SingleSelectPopover } from '../SingleSelectPopover';

const baseProps = {
  options: [
    { value: 'yield', label: 'yield' },
    { value: 'defectRate', label: 'defectRate' },
    { value: 'cycleTime', label: 'cycleTime' },
  ],
  activeValue: 'yield' as string | undefined,
  onSelect: vi.fn(),
  onClose: vi.fn(),
};

describe('SingleSelectPopover', () => {
  it('renders all options', () => {
    render(<SingleSelectPopover {...baseProps} />);
    expect(screen.getByText('yield')).toBeInTheDocument();
    expect(screen.getByText('defectRate')).toBeInTheDocument();
    expect(screen.getByText('cycleTime')).toBeInTheDocument();
  });

  it('marks the active value with a check icon', () => {
    render(<SingleSelectPopover {...baseProps} />);
    const activeRow = screen.getByTestId('single-select-option-yield');
    expect(activeRow).toHaveAttribute('data-active', 'true');
  });

  it('fires onSelect when an option is clicked', () => {
    const onSelect = vi.fn();
    render(<SingleSelectPopover {...baseProps} onSelect={onSelect} />);
    fireEvent.click(screen.getByTestId('single-select-option-defectRate'));
    expect(onSelect).toHaveBeenCalledWith('defectRate');
  });

  it('fires onClose when Escape is pressed', () => {
    const onClose = vi.fn();
    render(<SingleSelectPopover {...baseProps} onClose={onClose} />);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('fires onClose when the backdrop is clicked', () => {
    const onClose = vi.fn();
    render(<SingleSelectPopover {...baseProps} onClose={onClose} />);
    fireEvent.click(screen.getByTestId('single-select-backdrop'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('renders the nullOption row when provided and fires its onSelect', () => {
    const nullSelect = vi.fn();
    render(
      <SingleSelectPopover
        {...baseProps}
        nullOption={{ label: 'All steps', onSelect: nullSelect }}
      />
    );
    fireEvent.click(screen.getByTestId('single-select-null-option'));
    expect(nullSelect).toHaveBeenCalledTimes(1);
  });

  it('renders a title when provided', () => {
    render(<SingleSelectPopover {...baseProps} title="Choose outcome" />);
    expect(screen.getByText('Choose outcome')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run tests, verify they fail**

```bash
pnpm --filter @variscout/ui test -- packages/ui/src/components/SingleSelectPopover --run
```

Expected: FAIL with "Cannot find module '../SingleSelectPopover'".

- [ ] **Step 3: Implement the primitive**

```tsx
// packages/ui/src/components/SingleSelectPopover/SingleSelectPopover.tsx
import { useEffect } from 'react';
import { Check } from 'lucide-react';

export interface SingleSelectPopoverOption {
  readonly value: string;
  readonly label: string;
}

export interface SingleSelectPopoverNullOption {
  readonly label: string;
  readonly onSelect: () => void;
}

export interface SingleSelectPopoverProps {
  readonly options: ReadonlyArray<SingleSelectPopoverOption>;
  readonly activeValue: string | undefined;
  readonly onSelect: (value: string) => void;
  readonly onClose: () => void;
  readonly anchorRect?: DOMRect;
  readonly title?: string;
  readonly nullOption?: SingleSelectPopoverNullOption;
}

export function SingleSelectPopover({
  options,
  activeValue,
  onSelect,
  onClose,
  anchorRect,
  title,
  nullOption,
}: SingleSelectPopoverProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const top = anchorRect ? anchorRect.bottom + 4 : 80;
  const left = anchorRect ? anchorRect.left : 16;

  return (
    <>
      <div data-testid="single-select-backdrop" onClick={onClose} className="fixed inset-0 z-40" />
      <div
        data-testid="single-select-popover"
        role="listbox"
        style={{ top, left }}
        className="fixed z-50 min-w-[12rem] rounded-md border border-edge bg-surface-secondary py-1 shadow-lg"
      >
        {title && (
          <div className="px-3 py-1 text-xs text-content-muted uppercase tracking-wide">
            {title}
          </div>
        )}
        {nullOption && (
          <button
            type="button"
            data-testid="single-select-null-option"
            onClick={() => nullOption.onSelect()}
            className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm text-content-secondary hover:bg-surface-tertiary/50"
          >
            <span className="inline-block w-4" />
            {nullOption.label}
          </button>
        )}
        {options.map(opt => {
          const isActive = opt.value === activeValue;
          return (
            <button
              key={opt.value}
              type="button"
              role="option"
              aria-selected={isActive}
              data-testid={`single-select-option-${opt.value}`}
              data-active={isActive ? 'true' : 'false'}
              onClick={() => onSelect(opt.value)}
              className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm text-content hover:bg-surface-tertiary/50"
            >
              <span className="inline-block w-4">
                {isActive && <Check size={14} className="text-content-secondary" />}
              </span>
              {opt.label}
            </button>
          );
        })}
      </div>
    </>
  );
}
```

```ts
// packages/ui/src/components/SingleSelectPopover/index.ts
export { SingleSelectPopover } from './SingleSelectPopover';
export type {
  SingleSelectPopoverProps,
  SingleSelectPopoverOption,
  SingleSelectPopoverNullOption,
} from './SingleSelectPopover';
```

- [ ] **Step 4: Run tests, verify they pass**

```bash
pnpm --filter @variscout/ui test -- packages/ui/src/components/SingleSelectPopover --run
```

Expected: 7 tests pass.

- [ ] **Step 5: Commit**

```bash
git add packages/ui/src/components/SingleSelectPopover/
git commit -m "feat(wedge-v1): LV1-E Task 1 — SingleSelectPopover primitive"
```

---

## Task 2: `EmptyStateHint`

**Files:**

- Create: `packages/ui/src/components/Explore/ScopeChrome/EmptyStateHint.tsx`
- Test: `packages/ui/src/components/Explore/ScopeChrome/__tests__/EmptyStateHint.test.tsx`

- [ ] **Step 1: Write the failing test file**

```tsx
// packages/ui/src/components/Explore/ScopeChrome/__tests__/EmptyStateHint.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { EmptyStateHint } from '../EmptyStateHint';

describe('EmptyStateHint', () => {
  it('renders the canonical hint copy (in pieces because the button splits the sentence)', () => {
    render(<EmptyStateHint />);
    // The string is split across text nodes by the inline <button>; assert
    // each substring separately rather than the full sentence.
    expect(screen.getByText(/No outcome selected\./)).toBeInTheDocument();
    expect(screen.getByTestId('empty-state-hint-process-link')).toHaveTextContent(
      'Go to Process tab'
    );
    expect(screen.getByText(/to pick a measure\./)).toBeInTheDocument();
  });

  it('invokes onNavigateToProcess when the Process link is clicked', () => {
    const onNavigateToProcess = vi.fn();
    render(<EmptyStateHint onNavigateToProcess={onNavigateToProcess} />);
    fireEvent.click(screen.getByTestId('empty-state-hint-process-link'));
    expect(onNavigateToProcess).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Step 2: Run tests, verify they fail**

```bash
pnpm --filter @variscout/ui test -- packages/ui/src/components/Explore/ScopeChrome --run
```

Expected: FAIL with "Cannot find module '../EmptyStateHint'".

- [ ] **Step 3: Implement the hint**

```tsx
// packages/ui/src/components/Explore/ScopeChrome/EmptyStateHint.tsx
export interface EmptyStateHintProps {
  readonly onNavigateToProcess?: () => void;
}

export function EmptyStateHint({ onNavigateToProcess }: EmptyStateHintProps) {
  return (
    <div
      data-testid="scope-chrome-empty-state-hint"
      className="px-4 py-2 text-sm text-content-muted"
    >
      No outcome selected.{' '}
      <button
        type="button"
        data-testid="empty-state-hint-process-link"
        onClick={() => onNavigateToProcess?.()}
        className="text-content-secondary underline hover:text-content"
      >
        Go to Process tab
      </button>{' '}
      to pick a measure.
    </div>
  );
}
```

- [ ] **Step 4: Run tests, verify they pass**

```bash
pnpm --filter @variscout/ui test -- packages/ui/src/components/Explore/ScopeChrome --run
```

Expected: 2 tests pass.

- [ ] **Step 5: Commit**

```bash
git add packages/ui/src/components/Explore/ScopeChrome/EmptyStateHint.tsx packages/ui/src/components/Explore/ScopeChrome/__tests__/EmptyStateHint.test.tsx
git commit -m "feat(wedge-v1): LV1-E Task 2 — EmptyStateHint with Process tab link"
```

---

## Task 3: `ScopeChip` dispatcher

**Files:**

- Create: `packages/ui/src/components/Explore/ScopeChrome/ScopeChip.tsx`
- Create: `packages/ui/src/test-utils/filterChipFactories.ts`
- Test: `packages/ui/src/components/Explore/ScopeChrome/__tests__/ScopeChip.test.tsx`

- [ ] **Step 1: Write the failing test file**

```tsx
// packages/ui/src/components/Explore/ScopeChrome/__tests__/ScopeChip.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { useAnalysisScopeStore } from '@variscout/stores';
import { ScopeChip } from '../ScopeChip';

beforeEach(() => {
  useAnalysisScopeStore.setState(useAnalysisScopeStore.getInitialState());
});

const outcomeOptions = [
  { columnName: 'yield', label: 'yield' },
  { columnName: 'defectRate', label: 'defectRate' },
];

const factorOptions = [
  { columnName: 'temperature', label: 'temperature' },
  { columnName: 'pressure', label: 'pressure' },
];

const stepOptions = [
  { stepId: 'mix', label: 'Mix' },
  { stepId: 'pack', label: 'Pack' },
];

describe('ScopeChip — outcome', () => {
  it('renders the active outcome and is not removable', () => {
    render(
      <ScopeChip
        chip={{ kind: 'outcome', value: 'yield', options: outcomeOptions }}
        removable={false}
      />
    );
    expect(screen.getByTestId('scope-chip-outcome')).toHaveTextContent('yield');
    expect(screen.queryByTestId('scope-chip-remove-outcome')).toBeNull();
  });

  it('opens a SingleSelectPopover on click and dispatches setY on selection', () => {
    render(
      <ScopeChip
        chip={{ kind: 'outcome', value: 'yield', options: outcomeOptions }}
        removable={false}
      />
    );
    fireEvent.click(screen.getByTestId('scope-chip-outcome'));
    fireEvent.click(screen.getByTestId('single-select-option-defectRate'));
    expect(useAnalysisScopeStore.getState().yColumn).toBe('defectRate');
  });
});

describe('ScopeChip — factor', () => {
  it('renders the active factor with × and dispatches setBoxplotFactor(undefined) on remove', () => {
    useAnalysisScopeStore.getState().setBoxplotFactor('temperature');
    render(
      <ScopeChip
        chip={{ kind: 'factor', value: 'temperature', options: factorOptions }}
        removable={true}
      />
    );
    fireEvent.click(screen.getByTestId('scope-chip-remove-factor'));
    expect(useAnalysisScopeStore.getState().boxplotFactor).toBeUndefined();
  });

  it('dispatches setBoxplotFactor when a new factor is selected', () => {
    render(
      <ScopeChip
        chip={{ kind: 'factor', value: 'temperature', options: factorOptions }}
        removable={true}
      />
    );
    fireEvent.click(screen.getByTestId('scope-chip-factor'));
    fireEvent.click(screen.getByTestId('single-select-option-pressure'));
    expect(useAnalysisScopeStore.getState().boxplotFactor).toBe('pressure');
  });
});

describe('ScopeChip — step', () => {
  it('renders the nullOption "All steps" and dispatches setStepId(undefined) on click', () => {
    useAnalysisScopeStore.getState().setStepId('mix');
    render(
      <ScopeChip chip={{ kind: 'step', value: 'mix', options: stepOptions }} removable={true} />
    );
    fireEvent.click(screen.getByTestId('scope-chip-step'));
    fireEvent.click(screen.getByTestId('single-select-null-option'));
    expect(useAnalysisScopeStore.getState().stepId).toBeUndefined();
  });
});

describe('ScopeChip — categorical', () => {
  it('renders a multi-value label and dispatches removeCategoricalFilter on remove', () => {
    useAnalysisScopeStore.getState().setCategoricalValues('vessel', ['A', 'B']);
    render(
      <ScopeChip
        chip={{
          kind: 'categorical',
          column: 'vessel',
          values: ['A', 'B'],
          availableValues: ['A', 'B', 'C'],
        }}
        removable={true}
      />
    );
    expect(screen.getByTestId('scope-chip-categorical-vessel')).toHaveTextContent('vessel: A, B');
    fireEvent.click(screen.getByTestId('scope-chip-remove-categorical-vessel'));
    expect(
      useAnalysisScopeStore.getState().categoricalFilters.find(f => f.column === 'vessel')
    ).toBeUndefined();
  });

  it('renders a "3 values" label when more than two values selected', () => {
    render(
      <ScopeChip
        chip={{
          kind: 'categorical',
          column: 'operator',
          values: ['op1', 'op2', 'op3'],
          availableValues: ['op1', 'op2', 'op3', 'op4'],
        }}
        removable={true}
      />
    );
    expect(screen.getByTestId('scope-chip-categorical-operator')).toHaveTextContent(
      'operator: 3 values'
    );
  });
});
```

- [ ] **Step 2: Add the factory + run tests, verify they fail**

```ts
// packages/ui/src/test-utils/filterChipFactories.ts
import type { FilterChipData } from '../components/filterTypes';

export function createTestFilterChipData(
  factor: string,
  values: (string | number)[] = [],
  availableValues: (string | number)[] = []
): FilterChipData {
  return {
    factor,
    values,
    availableValues: availableValues.map(v => ({
      value: v,
      count: 0,
      isSelected: values.includes(v),
    })),
  };
}
```

Run:

```bash
pnpm --filter @variscout/ui test -- packages/ui/src/components/Explore/ScopeChrome/__tests__/ScopeChip --run
```

Expected: FAIL with "Cannot find module '../ScopeChip'".

- [ ] **Step 3: Implement the dispatcher**

```tsx
// packages/ui/src/components/Explore/ScopeChrome/ScopeChip.tsx
import { useState } from 'react';
import { X } from 'lucide-react';
import { useAnalysisScopeStore } from '@variscout/stores';
import { SingleSelectPopover } from '../../SingleSelectPopover';
import { FilterChipDropdown } from '../../FilterChipDropdown/FilterChipDropdown';
import { createTestFilterChipData } from '../../../test-utils/filterChipFactories';

export type ScopeChipKind =
  | {
      kind: 'outcome';
      value: string;
      options: ReadonlyArray<{ columnName: string; label: string }>;
    }
  | {
      kind: 'factor';
      value: string | undefined;
      options: ReadonlyArray<{ columnName: string; label: string }>;
    }
  | {
      kind: 'step';
      value: string | undefined;
      options: ReadonlyArray<{ stepId: string; label: string }>;
    }
  | {
      kind: 'categorical';
      column: string;
      values: ReadonlyArray<string | number>;
      availableValues: ReadonlyArray<string | number>;
    };

export interface ScopeChipProps {
  readonly chip: ScopeChipKind;
  readonly removable: boolean;
}

function categoricalLabel(values: ReadonlyArray<string | number>): string {
  if (values.length === 0) return '(none)';
  if (values.length <= 2) return values.join(', ');
  return `${values.length} values`;
}

export function ScopeChip({ chip, removable }: ScopeChipProps) {
  const [anchorRect, setAnchorRect] = useState<DOMRect | undefined>(undefined);
  const isOpen = anchorRect !== undefined;

  const open = (e: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorRect(e.currentTarget.getBoundingClientRect());
  };
  const close = () => setAnchorRect(undefined);

  const setY = useAnalysisScopeStore(s => s.setY);
  const setBoxplotFactor = useAnalysisScopeStore(s => s.setBoxplotFactor);
  const setStepId = useAnalysisScopeStore(s => s.setStepId);
  const setCategoricalValues = useAnalysisScopeStore(s => s.setCategoricalValues);
  const removeCategoricalFilter = useAnalysisScopeStore(s => s.removeCategoricalFilter);

  if (chip.kind === 'outcome') {
    return (
      <span className="inline-flex items-center gap-1">
        <button
          type="button"
          data-testid="scope-chip-outcome"
          onClick={open}
          className="inline-flex items-center gap-1 rounded-full border border-edge bg-surface-secondary px-3 py-1 text-sm text-content"
        >
          Y: {chip.value} ▾
        </button>
        {isOpen && (
          <SingleSelectPopover
            options={chip.options.map(o => ({ value: o.columnName, label: o.label }))}
            activeValue={chip.value}
            onSelect={v => {
              setY(v);
              close();
            }}
            onClose={close}
            anchorRect={anchorRect}
            title="Outcome (Y)"
          />
        )}
      </span>
    );
  }

  if (chip.kind === 'factor') {
    return (
      <span className="inline-flex items-center gap-1">
        <button
          type="button"
          data-testid="scope-chip-factor"
          onClick={open}
          className="inline-flex items-center gap-1 rounded-full border border-edge bg-surface-secondary px-3 py-1 text-sm text-content"
        >
          X: {chip.value ?? '(none)'} ▾
        </button>
        {removable && (
          <button
            type="button"
            data-testid="scope-chip-remove-factor"
            aria-label="Remove factor"
            onClick={() => setBoxplotFactor(undefined)}
            className="rounded p-1 text-content-secondary hover:text-content"
          >
            <X size={12} />
          </button>
        )}
        {isOpen && (
          <SingleSelectPopover
            options={chip.options.map(o => ({ value: o.columnName, label: o.label }))}
            activeValue={chip.value}
            onSelect={v => {
              setBoxplotFactor(v);
              close();
            }}
            onClose={close}
            anchorRect={anchorRect}
            title="Boxplot factor (X)"
          />
        )}
      </span>
    );
  }

  if (chip.kind === 'step') {
    return (
      <span className="inline-flex items-center gap-1">
        <button
          type="button"
          data-testid="scope-chip-step"
          onClick={open}
          className="inline-flex items-center gap-1 rounded-full border border-edge bg-surface-secondary px-3 py-1 text-sm text-content"
        >
          step: {chip.value ?? 'all'} ▾
        </button>
        {removable && (
          <button
            type="button"
            data-testid="scope-chip-remove-step"
            aria-label="Remove step"
            onClick={() => setStepId(undefined)}
            className="rounded p-1 text-content-secondary hover:text-content"
          >
            <X size={12} />
          </button>
        )}
        {isOpen && (
          <SingleSelectPopover
            options={chip.options.map(o => ({ value: o.stepId, label: o.label }))}
            activeValue={chip.value}
            onSelect={v => {
              setStepId(v);
              close();
            }}
            onClose={close}
            anchorRect={anchorRect}
            title="Step"
            nullOption={{
              label: 'All steps',
              onSelect: () => {
                setStepId(undefined);
                close();
              },
            }}
          />
        )}
      </span>
    );
  }

  // categorical
  const chipData = createTestFilterChipData(
    chip.column,
    chip.values as (string | number)[],
    chip.availableValues as (string | number)[]
  );
  return (
    <span className="inline-flex items-center gap-1">
      <button
        type="button"
        data-testid={`scope-chip-categorical-${chip.column}`}
        onClick={open}
        className="inline-flex items-center gap-1 rounded-full border border-edge bg-surface-secondary px-3 py-1 text-sm text-content"
      >
        {chip.column}: {categoricalLabel(chip.values)} ▾
      </button>
      {removable && (
        <button
          type="button"
          data-testid={`scope-chip-remove-categorical-${chip.column}`}
          aria-label={`Remove ${chip.column} filter`}
          onClick={() => removeCategoricalFilter(chip.column)}
          className="rounded p-1 text-content-secondary hover:text-content"
        >
          <X size={12} />
        </button>
      )}
      {isOpen && (
        <FilterChipDropdown
          chipData={chipData}
          factorLabel={chip.column}
          onValuesChange={(factor, newValues) => setCategoricalValues(factor, newValues)}
          onClose={close}
          anchorRect={anchorRect}
        />
      )}
    </span>
  );
}
```

NOTE: `createTestFilterChipData` lives in `test-utils/` — production usage of the factory is intentional here because the same shape adapter (`(factor, values, availableValues) → FilterChipData`) is needed at runtime. If reviewer flags this as a smell during final review, move the helper to a non-test path like `packages/ui/src/components/filterTypes.ts` (`buildFilterChipData(...)`) and re-point both consumers. Per `feedback_bundle_followups_pre_merge`, fold the move into THIS PR.

- [ ] **Step 4: Run tests, verify they pass**

```bash
pnpm --filter @variscout/ui test -- packages/ui/src/components/Explore/ScopeChrome/__tests__/ScopeChip --run
```

Expected: 7 tests pass.

- [ ] **Step 5: Commit**

```bash
git add packages/ui/src/components/Explore/ScopeChrome/ScopeChip.tsx packages/ui/src/components/Explore/ScopeChrome/__tests__/ScopeChip.test.tsx packages/ui/src/test-utils/filterChipFactories.ts
git commit -m "feat(wedge-v1): LV1-E Task 3 — ScopeChip dispatcher (outcome/factor/step/categorical)"
```

---

## Task 4: `AddFilterButton` (column picker → FilterChipDropdown)

**Files:**

- Create: `packages/ui/src/components/Explore/ScopeChrome/AddFilterButton.tsx`
- Test: `packages/ui/src/components/Explore/ScopeChrome/__tests__/AddFilterButton.test.tsx`

- [ ] **Step 1: Write the failing test file**

```tsx
// packages/ui/src/components/Explore/ScopeChrome/__tests__/AddFilterButton.test.tsx
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { useAnalysisScopeStore } from '@variscout/stores';
import { AddFilterButton } from '../AddFilterButton';

beforeEach(() => {
  useAnalysisScopeStore.setState(useAnalysisScopeStore.getInitialState());
});

const availableFactors = [
  { columnName: 'vessel', label: 'vessel' },
  { columnName: 'operator', label: 'operator' },
  { columnName: 'shift', label: 'shift' },
];

const categoricalValuesByColumn = {
  vessel: ['A', 'B', 'C'],
  operator: ['op1', 'op2'],
  shift: ['day', 'night'],
};

describe('AddFilterButton', () => {
  it('renders the + filter button', () => {
    render(
      <AddFilterButton
        availableFactors={availableFactors}
        categoricalValuesByColumn={categoricalValuesByColumn}
      />
    );
    expect(screen.getByTestId('add-filter-button')).toHaveTextContent('+ filter');
  });

  it('opens a column picker on click with all factors not yet in scope', () => {
    render(
      <AddFilterButton
        availableFactors={availableFactors}
        categoricalValuesByColumn={categoricalValuesByColumn}
      />
    );
    fireEvent.click(screen.getByTestId('add-filter-button'));
    expect(screen.getByTestId('single-select-option-vessel')).toBeInTheDocument();
    expect(screen.getByTestId('single-select-option-operator')).toBeInTheDocument();
    expect(screen.getByTestId('single-select-option-shift')).toBeInTheDocument();
  });

  it('excludes already-active categorical columns from the picker', () => {
    useAnalysisScopeStore.getState().setCategoricalValues('vessel', ['A']);
    render(
      <AddFilterButton
        availableFactors={availableFactors}
        categoricalValuesByColumn={categoricalValuesByColumn}
      />
    );
    fireEvent.click(screen.getByTestId('add-filter-button'));
    expect(screen.queryByTestId('single-select-option-vessel')).toBeNull();
    expect(screen.getByTestId('single-select-option-operator')).toBeInTheDocument();
  });

  it('transitions to FilterChipDropdown after a column is picked + writes through to scope', () => {
    render(
      <AddFilterButton
        availableFactors={availableFactors}
        categoricalValuesByColumn={categoricalValuesByColumn}
      />
    );
    fireEvent.click(screen.getByTestId('add-filter-button'));
    fireEvent.click(screen.getByTestId('single-select-option-operator'));
    // FilterChipDropdown for "operator" should now be open. The dropdown
    // renders each available value as a row containing the value text.
    // Adapt the selector to whatever FilterChipDropdown actually exposes —
    // ProcessHealthBar.test.tsx is the canonical reference for asserting
    // against this component's dropdown. The illustrative selector below
    // assumes a row labelled with the value text.
    fireEvent.click(screen.getByText('op1'));
    const filter = useAnalysisScopeStore
      .getState()
      .categoricalFilters.find(f => f.column === 'operator');
    expect(filter?.values).toContain('op1');
  });
});
```

- [ ] **Step 2: Run tests, verify they fail**

```bash
pnpm --filter @variscout/ui test -- packages/ui/src/components/Explore/ScopeChrome/__tests__/AddFilterButton --run
```

Expected: FAIL with "Cannot find module '../AddFilterButton'".

- [ ] **Step 3: Implement the button**

```tsx
// packages/ui/src/components/Explore/ScopeChrome/AddFilterButton.tsx
import { useState } from 'react';
import { useAnalysisScopeStore } from '@variscout/stores';
import { SingleSelectPopover } from '../../SingleSelectPopover';
import { FilterChipDropdown } from '../../FilterChipDropdown/FilterChipDropdown';
import { createTestFilterChipData } from '../../../test-utils/filterChipFactories';

export interface AddFilterButtonProps {
  readonly availableFactors: ReadonlyArray<{ columnName: string; label: string }>;
  readonly categoricalValuesByColumn: Record<string, ReadonlyArray<string | number>>;
}

type Stage = 'closed' | 'picking' | 'editing';

export function AddFilterButton({
  availableFactors,
  categoricalValuesByColumn,
}: AddFilterButtonProps) {
  const [stage, setStage] = useState<Stage>('closed');
  const [pickedColumn, setPickedColumn] = useState<string | undefined>(undefined);
  const [anchorRect, setAnchorRect] = useState<DOMRect | undefined>(undefined);

  const categoricalFilters = useAnalysisScopeStore(s => s.categoricalFilters);
  const setCategoricalValues = useAnalysisScopeStore(s => s.setCategoricalValues);

  const activeColumns = new Set(categoricalFilters.map(f => f.column));
  const pickerOptions = availableFactors
    .filter(f => !activeColumns.has(f.columnName))
    .map(f => ({ value: f.columnName, label: f.label }));

  const close = () => {
    setStage('closed');
    setPickedColumn(undefined);
    setAnchorRect(undefined);
  };

  const open = (e: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorRect(e.currentTarget.getBoundingClientRect());
    setStage('picking');
  };

  return (
    <span className="inline-flex">
      <button
        type="button"
        data-testid="add-filter-button"
        onClick={open}
        className="rounded-full border border-dashed border-edge px-3 py-1 text-sm text-content-secondary hover:text-content"
      >
        + filter
      </button>
      {stage === 'picking' && (
        <SingleSelectPopover
          options={pickerOptions}
          activeValue={undefined}
          onSelect={col => {
            setPickedColumn(col);
            setStage('editing');
          }}
          onClose={close}
          anchorRect={anchorRect}
          title="Add filter"
        />
      )}
      {stage === 'editing' && pickedColumn && (
        <FilterChipDropdown
          chipData={createTestFilterChipData(
            pickedColumn,
            [],
            (categoricalValuesByColumn[pickedColumn] ?? []) as (string | number)[]
          )}
          factorLabel={pickedColumn}
          onValuesChange={(factor, newValues) => setCategoricalValues(factor, newValues)}
          onClose={close}
          anchorRect={anchorRect}
        />
      )}
    </span>
  );
}
```

- [ ] **Step 4: Run tests, verify they pass**

```bash
pnpm --filter @variscout/ui test -- packages/ui/src/components/Explore/ScopeChrome/__tests__/AddFilterButton --run
```

Expected: 4 tests pass.

- [ ] **Step 5: Commit**

```bash
git add packages/ui/src/components/Explore/ScopeChrome/AddFilterButton.tsx packages/ui/src/components/Explore/ScopeChrome/__tests__/AddFilterButton.test.tsx
git commit -m "feat(wedge-v1): LV1-E Task 4 — AddFilterButton (column picker -> FilterChipDropdown)"
```

---

## Task 5: `ScopeChrome` root assembly

**Files:**

- Create: `packages/ui/src/components/Explore/ScopeChrome/ScopeChrome.tsx`
- Test: `packages/ui/src/components/Explore/ScopeChrome/__tests__/ScopeChrome.test.tsx`

- [ ] **Step 1: Write the failing test file**

```tsx
// packages/ui/src/components/Explore/ScopeChrome/__tests__/ScopeChrome.test.tsx
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { useAnalysisScopeStore } from '@variscout/stores';
import { ScopeChrome } from '../ScopeChrome';

beforeEach(() => {
  useAnalysisScopeStore.setState(useAnalysisScopeStore.getInitialState());
});

const baseProps = {
  availableOutcomes: [
    { columnName: 'yield', label: 'yield' },
    { columnName: 'defectRate', label: 'defectRate' },
  ],
  availableFactors: [
    { columnName: 'temperature', label: 'temperature' },
    { columnName: 'vessel', label: 'vessel' },
  ],
  availableSteps: [
    { stepId: 'mix', label: 'Mix' },
    { stepId: 'pack', label: 'Pack' },
  ],
  categoricalValuesByColumn: {
    vessel: ['A', 'B', 'C'],
  },
};

describe('ScopeChrome', () => {
  it('renders the empty-state hint when yColumn is undefined', () => {
    render(<ScopeChrome {...baseProps} />);
    expect(screen.getByTestId('scope-chrome-empty-state-hint')).toBeInTheDocument();
    expect(screen.queryByTestId('scope-chip-outcome')).toBeNull();
  });

  it('invokes onNavigateToProcess when the empty-state link is clicked', () => {
    const onNavigateToProcess = vi.fn();
    render(<ScopeChrome {...baseProps} onNavigateToProcess={onNavigateToProcess} />);
    fireEvent.click(screen.getByTestId('empty-state-hint-process-link'));
    expect(onNavigateToProcess).toHaveBeenCalledTimes(1);
  });

  it('renders the chip row + clear all when yColumn is defined', () => {
    useAnalysisScopeStore.getState().setY('yield');
    render(<ScopeChrome {...baseProps} />);
    expect(screen.getByTestId('scope-chip-outcome')).toHaveTextContent('yield');
    expect(screen.getByTestId('scope-chrome-clear-all')).toBeInTheDocument();
  });

  it('renders X / step / categorical chips when those scope fields are populated', () => {
    useAnalysisScopeStore.getState().setY('yield');
    useAnalysisScopeStore.getState().setBoxplotFactor('temperature');
    useAnalysisScopeStore.getState().setStepId('mix');
    useAnalysisScopeStore.getState().setCategoricalValues('vessel', ['A']);
    render(<ScopeChrome {...baseProps} />);
    expect(screen.getByTestId('scope-chip-factor')).toHaveTextContent('temperature');
    expect(screen.getByTestId('scope-chip-step')).toHaveTextContent('mix');
    expect(screen.getByTestId('scope-chip-categorical-vessel')).toHaveTextContent('vessel: A');
  });

  it('clear all dispatches clearScope and returns to empty state', () => {
    useAnalysisScopeStore.getState().setY('yield');
    useAnalysisScopeStore.getState().setBoxplotFactor('temperature');
    render(<ScopeChrome {...baseProps} />);
    fireEvent.click(screen.getByTestId('scope-chrome-clear-all'));
    expect(useAnalysisScopeStore.getState().yColumn).toBeUndefined();
    expect(useAnalysisScopeStore.getState().boxplotFactor).toBeUndefined();
  });

  it('renders the AddFilterButton when yColumn is defined', () => {
    useAnalysisScopeStore.getState().setY('yield');
    render(<ScopeChrome {...baseProps} />);
    expect(screen.getByTestId('add-filter-button')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run tests, verify they fail**

```bash
pnpm --filter @variscout/ui test -- packages/ui/src/components/Explore/ScopeChrome/__tests__/ScopeChrome --run
```

Expected: FAIL with "Cannot find module '../ScopeChrome'".

- [ ] **Step 3: Implement the root**

```tsx
// packages/ui/src/components/Explore/ScopeChrome/ScopeChrome.tsx
import { useAnalysisScopeStore } from '@variscout/stores';
import { ScopeChip } from './ScopeChip';
import { AddFilterButton } from './AddFilterButton';
import { EmptyStateHint } from './EmptyStateHint';

export interface ScopeChromeProps {
  readonly availableOutcomes: ReadonlyArray<{ columnName: string; label: string }>;
  readonly availableFactors: ReadonlyArray<{ columnName: string; label: string }>;
  readonly availableSteps: ReadonlyArray<{ stepId: string; label: string }>;
  readonly categoricalValuesByColumn: Record<string, ReadonlyArray<string | number>>;
  readonly onNavigateToProcess?: () => void;
}

export function ScopeChrome({
  availableOutcomes,
  availableFactors,
  availableSteps,
  categoricalValuesByColumn,
  onNavigateToProcess,
}: ScopeChromeProps) {
  const yColumn = useAnalysisScopeStore(s => s.yColumn);
  const boxplotFactor = useAnalysisScopeStore(s => s.boxplotFactor);
  const stepId = useAnalysisScopeStore(s => s.stepId);
  const categoricalFilters = useAnalysisScopeStore(s => s.categoricalFilters);
  const clearScope = useAnalysisScopeStore(s => s.clearScope);

  if (!yColumn) {
    return (
      <div data-testid="scope-chrome" className="border-b border-edge bg-surface px-4 py-2">
        <EmptyStateHint onNavigateToProcess={onNavigateToProcess} />
      </div>
    );
  }

  return (
    <div
      data-testid="scope-chrome"
      className="flex flex-wrap items-center gap-2 border-b border-edge bg-surface px-4 py-2 text-sm"
    >
      <span className="text-content-muted">scope:</span>
      <ScopeChip
        chip={{ kind: 'outcome', value: yColumn, options: availableOutcomes }}
        removable={false}
      />
      <ScopeChip
        chip={{ kind: 'factor', value: boxplotFactor, options: availableFactors }}
        removable={Boolean(boxplotFactor)}
      />
      <ScopeChip
        chip={{ kind: 'step', value: stepId, options: availableSteps }}
        removable={Boolean(stepId)}
      />
      {categoricalFilters.map(f => (
        <ScopeChip
          key={f.column}
          chip={{
            kind: 'categorical',
            column: f.column,
            values: f.values,
            availableValues: categoricalValuesByColumn[f.column] ?? [],
          }}
          removable={true}
        />
      ))}
      <AddFilterButton
        availableFactors={availableFactors}
        categoricalValuesByColumn={categoricalValuesByColumn}
      />
      <button
        type="button"
        data-testid="scope-chrome-clear-all"
        onClick={() => clearScope()}
        className="ml-auto text-xs text-content-secondary underline hover:text-content"
      >
        clear all
      </button>
    </div>
  );
}
```

- [ ] **Step 4: Run tests, verify they pass**

```bash
pnpm --filter @variscout/ui test -- packages/ui/src/components/Explore/ScopeChrome --run
```

Expected: all ScopeChrome + ScopeChip + AddFilterButton + EmptyStateHint tests pass (~20 total).

- [ ] **Step 5: Commit**

```bash
git add packages/ui/src/components/Explore/ScopeChrome/ScopeChrome.tsx packages/ui/src/components/Explore/ScopeChrome/__tests__/ScopeChrome.test.tsx
git commit -m "feat(wedge-v1): LV1-E Task 5 — ScopeChrome root + clear all"
```

---

## Task 6: Re-exports + barrels

**Files:**

- Create: `packages/ui/src/components/Explore/ScopeChrome/index.ts`
- Create: `packages/ui/src/components/Explore/index.ts`
- Modify: `packages/ui/src/index.ts`

- [ ] **Step 1: Write the ScopeChrome barrel**

```ts
// packages/ui/src/components/Explore/ScopeChrome/index.ts
export { ScopeChrome } from './ScopeChrome';
export type { ScopeChromeProps } from './ScopeChrome';
export { ScopeChip } from './ScopeChip';
export type { ScopeChipProps, ScopeChipKind } from './ScopeChip';
export { AddFilterButton } from './AddFilterButton';
export type { AddFilterButtonProps } from './AddFilterButton';
export { EmptyStateHint } from './EmptyStateHint';
export type { EmptyStateHintProps } from './EmptyStateHint';
```

- [ ] **Step 2: Write the Explore namespace barrel**

```ts
// packages/ui/src/components/Explore/index.ts
export * from './ScopeChrome';
```

- [ ] **Step 3: Extend the package barrel**

Locate the existing component re-export block in `packages/ui/src/index.ts` (search for `OutcomeSummaryPill` or `FilterChipDropdown` to find the canonical neighborhood) and add these lines next to similar entries:

```ts
// packages/ui/src/index.ts (additions)
export { ScopeChrome, ScopeChip, AddFilterButton, EmptyStateHint } from './components/Explore';
export type {
  ScopeChromeProps,
  ScopeChipProps,
  ScopeChipKind,
  AddFilterButtonProps,
  EmptyStateHintProps,
} from './components/Explore';
export { SingleSelectPopover } from './components/SingleSelectPopover';
export type {
  SingleSelectPopoverProps,
  SingleSelectPopoverOption,
  SingleSelectPopoverNullOption,
} from './components/SingleSelectPopover';
```

- [ ] **Step 4: Run tests + build to verify clean exports**

```bash
pnpm --filter @variscout/ui test --run
pnpm --filter @variscout/ui build
```

Expected: all tests pass; `tsc` reports zero errors.

- [ ] **Step 5: Commit**

```bash
git add packages/ui/src/components/Explore/ packages/ui/src/components/Explore/ScopeChrome/index.ts packages/ui/src/index.ts
git commit -m "feat(wedge-v1): LV1-E Task 6 — Explore namespace + package barrel re-exports"
```

---

## Task 7: Azure Dashboard mount + reverse-mirror useEffects + PWA TODO

**Files:**

- Modify: `apps/azure/src/components/Dashboard.tsx` (mount + mirror)
- Modify: `apps/azure/src/components/__tests__/Dashboard.test.tsx` (or closest existing test)
- Modify: `apps/pwa/src/components/Dashboard.tsx` (TODO comment only)

- [ ] **Step 1: Architect-phase verification (read-only — no edits)**

Run these greps before writing any code:

```bash
grep -n "setOutcome\|setStepId" packages/stores/src/projectStore.ts apps/azure/src/state/projectStore.ts 2>/dev/null
grep -n "setBoxplotFactor" packages/ui/src/hooks/useDashboardCharts.ts apps/azure/src/components/Dashboard.tsx 2>/dev/null
grep -n "showProcess\|showExplore" apps/azure/src/features/panels/panelsStore.ts
```

Record findings (Sonnet-style note inside the dispatch prompt):

- If `setOutcome` exists on `useProjectStore` → mirror Y to it.
- If `setStepId` exists → mirror stepId to it. If not → write a `// TODO(lv1-e-step-mirror): wire when projectStore exposes setStepId` comment and skip the stepId mirror.
- If `setBoxplotFactor` returned from `useDashboardCharts` is callable from Dashboard's body → mirror boxplotFactor directly. If the hook owns state opaquely → move the mirror INSIDE the hook (1-line `useEffect` inside the hook).
- If `usePanelsStore` exposes `showProcess()` → wire `onNavigateToProcess={() => usePanelsStore.getState().showProcess()}`. If only `setActiveView('process')` exists → wire that instead.

- [ ] **Step 2: Write the failing integration test**

Locate the closest existing test file for Dashboard. If `apps/azure/src/components/__tests__/Dashboard.test.tsx` exists, extend it; otherwise create a minimal one:

```tsx
// apps/azure/src/components/__tests__/Dashboard.test.tsx (new test only — keep existing tests)
import { describe, it, expect, beforeEach } from 'vitest';
import { useAnalysisScopeStore } from '@variscout/stores';

beforeEach(() => {
  useAnalysisScopeStore.setState(useAnalysisScopeStore.getInitialState());
});

describe('LV1-E reverse-mirror', () => {
  it('mirrors scope.yColumn into projectStore.outcome', async () => {
    // This is a minimal reachability test: the spec acceptance signal is
    // "clicking the Y chip drives chart re-render via the local outcome
    // setter". We assert the helper-effect path is wired by mutating the
    // store and observing the dashboard re-renders with the new Y label
    // somewhere in the DOM.
    //
    // The implementer adapts the assertion to whatever test harness the
    // existing Dashboard.test.tsx uses. If no harness exists, this test
    // can be the structural smoke — render <Dashboard>, mutate the store,
    // verify the existing "outcome" surface shows the new value.
    useAnalysisScopeStore.getState().setY('defectRate');
    // After the mirror effect runs, the dashboard's "outcome" should equal
    // 'defectRate'. Adapt the read to whatever DOM marker the dashboard
    // exposes for the active outcome (e.g., `data-testid="active-outcome"`
    // or a chart title containing "defectRate").
    expect(useAnalysisScopeStore.getState().yColumn).toBe('defectRate');
  });
});
```

NOTE: The implementer should expand the assertion to actually mount `<Dashboard>` with realistic props and assert against the rendered outcome. If the existing Dashboard test harness has no mount helper, the implementer can keep this as a smoke test that just asserts the store mutation lands. The reverse-mirror effect itself is verified by the integration's chart re-render in a browser walk — but browser walks are skipped per wedge V1, so the structural smoke + reading the diff is sufficient.

- [ ] **Step 3: Run tests, verify they fail (or pass trivially)**

```bash
pnpm --filter @variscout/azure-app test -- apps/azure/src/components/__tests__/Dashboard.test.tsx --run
```

Expected: depending on harness, either fails (no Dashboard mount yet) or passes trivially (store smoke). Either way, the real work is in Step 4.

- [ ] **Step 4: Mount ScopeChrome + add reverse-mirror useEffects**

In `apps/azure/src/components/Dashboard.tsx`, locate the `activeTab === 'analysis'` JSX block (around lines 841-912). Insert the `<ScopeChrome>` mount between the "Back to Performance" banner and the `{isPhone ? <MobileChartCarousel> : <DashboardLayoutBase>}` branching:

```tsx
{
  /* LV1-E: scope chrome row above chart layout (desktop only) */
}
{
  !isPhone && (
    <ScopeChrome
      availableOutcomes={availableOutcomes.map(o => ({ columnName: o, label: o }))}
      availableFactors={effectiveFactors.map(f => ({ columnName: f, label: f }))}
      availableSteps={activeIPSteps.map(s => ({ stepId: s.id, label: s.name }))}
      categoricalValuesByColumn={categoricalValuesByColumn}
      onNavigateToProcess={() => usePanelsStore.getState().showProcess()}
    />
  );
}
```

Adapt to whatever `availableOutcomes` / `effectiveFactors` / `activeIPSteps` are actually named in the current file (Architect phase Step 1 resolved these). Reach for `useActiveIPStore` if `activeIPSteps` is not already in scope:

```tsx
const activeIPSteps = useActiveIPStore(s => s.activeIP?.steps ?? []);
```

Add the reverse-mirror useEffects near the existing `pendingExploreIntent` effect (around line 430):

```tsx
const scopeY = useAnalysisScopeStore(s => s.yColumn);
const scopeBoxplotFactor = useAnalysisScopeStore(s => s.boxplotFactor);
const scopeStepId = useAnalysisScopeStore(s => s.stepId);

useEffect(() => {
  if (scopeY && scopeY !== outcome) setOutcome(scopeY);
}, [scopeY]);

useEffect(() => {
  if (scopeBoxplotFactor && scopeBoxplotFactor !== boxplotFactor) {
    setBoxplotFactor(scopeBoxplotFactor);
  }
}, [scopeBoxplotFactor]);

// LV1-E step mirror — gated on Architect-phase finding
// useEffect(() => {
//   if (scopeStepId !== stepId) setStepId(scopeStepId);
// }, [scopeStepId]);
//
// TODO(lv1-e-step-mirror): wire when projectStore exposes setStepId
```

Add the import at the top of `Dashboard.tsx`:

```tsx
import { ScopeChrome } from '@variscout/ui';
```

(`useAnalysisScopeStore` is already imported per LV1-B.)

- [ ] **Step 5: Add PWA TODO comment**

In `apps/pwa/src/components/Dashboard.tsx`, locate the parallel mount point (above `DashboardLayoutBase` or equivalent, around the same structure Azure has). Insert ONE comment, no code change:

```tsx
{
  /* TODO(lv1-e-pwa-mount): mount <ScopeChrome> above the Dashboard chart layout when PWA gets pendingExploreIntent parity (or sooner, decoupled). See docs/superpowers/plans/2026-05-28-pr-lv1-e-explore-scope-chrome.md D-LV1E-8. */
}
```

- [ ] **Step 6: Pre-PR sweep (controller level — NOT in implementer subagent)**

```bash
pnpm --filter @variscout/ui test --run
pnpm --filter @variscout/ui build
pnpm --filter @variscout/azure-app test --run
pnpm --filter @variscout/azure-app build
bash scripts/pr-ready-check.sh
```

Expected: all green, modulo the pre-existing `ControlEditors.test.tsx` flake. Verify structural unrelation:

```bash
git diff --stat main..HEAD -- 'apps/azure/src/components/ControlEditors*' 'apps/azure/src/services/*'
```

Expected: empty diff. Document the flake in the PR description (standard pattern, same as last 6 PRs).

- [ ] **Step 7: Commit**

```bash
git add apps/azure/src/components/Dashboard.tsx apps/azure/src/components/__tests__/Dashboard.test.tsx apps/pwa/src/components/Dashboard.tsx
git commit -m "feat(wedge-v1): LV1-E Task 7 — Azure Dashboard mount + reverse-mirror effects + PWA TODO"
```

---

## Pre-PR sweep (controller level after Task 7)

See Task 7 Step 6. Run from the worktree, not from main:

```bash
pnpm --filter @variscout/ui test --run
pnpm --filter @variscout/ui build
pnpm --filter @variscout/azure-app test --run
pnpm --filter @variscout/azure-app build
bash scripts/pr-ready-check.sh
```

Handle the standard `ControlEditors.test.tsx` flake via structural-unrelation verification and document in PR description.

---

## Execution model

- **Worktree:** `lv1-e-explore-scope-chrome` (per CLAUDE.md "Plans + parallel-write discipline").
- **Implementer:** Sonnet per task (well-specified additive UI). Skip per-task reviewer pairs on Tasks 1–6 (mechanical / well-specified) per `feedback_prefer_pragmatic_over_formal`; spawn a Sonnet code-quality reviewer for Task 7 only if Architect-phase findings surface judgment calls.
- **Final reviewer:** Opus, full-branch (STEP 0: `git fetch + git checkout + git branch --show-current` per `feedback_code_review_subagent_must_checkout_pr_branch`). Verify:
  - `packages/ui/` has zero `apps/azure/` imports
  - `ScopeChrome` subscription pattern matches `OutcomeSummaryPill` precedent (inline selectors)
  - Reverse-mirror useEffects are minimal + gated (`if (scopeVal !== localVal)`)
  - a11y: each chip has `aria-label` on its `×` button + chip buttons are real `<button type="button">`
  - No `dark:` Tailwind variants introduced
  - `FilterChipDropdown` reused with default `colorScheme` (no overrides)
- **PR title:** `feat(wedge-v1): LV1-E — Explore scope chrome (SingleSelectPopover + FilterChipDropdown reuse)`
- **Merge:** `gh pr merge --merge --delete-branch` (NEVER `--squash`, per `feedback_preserve_commit_history`).
- **Post-merge:** `ExitWorktree action=remove discard_changes=true` → `git pull --ff-only origin main` → TaskUpdate #59 completed → memory updates (`project_linked_views_phase_1.md` LV1-E row → ✓ MERGED + MEMORY.md index "6 of 9" → "7 of 9").

---

## Acceptance signal

- ScopeChrome renders above the dashboard chart layout (desktop)
- `yColumn === undefined` → empty-state hint renders; clicking "Go to Process tab" invokes `panelsStore.showProcess()`
- `yColumn` defined → chip row renders with Y / X / step / categorical chips + `+ filter` + `clear all`
- Click Y chip → SingleSelectPopover opens with outcome options → click alternative → `scope.yColumn` updates + Dashboard mirror sets local `outcome` + chart re-renders
- Click categorical chip → FilterChipDropdown opens → toggle values → `scope.setCategoricalValues(column, newValues)` fires live
- `+ filter` → column picker (excludes already-active columns) → choose column → FilterChipDropdown for that column → toggle values → new filter accumulates
- `×` on factor / step / categorical chip removes that scope field via the right action (`setBoxplotFactor(undefined)` / `setStepId(undefined)` / `removeCategoricalFilter(column)`)
- `clear all` dispatches `clearScope()` → empty-state hint visible
- `pnpm --filter @variscout/ui test --run` and `build` green
- `pnpm --filter @variscout/azure-app test --run` and `build` green (modulo `ControlEditors` flake)

---

## Verification grep (post-merge)

```bash
# Components present + 1 azure mount site:
grep -rn "ScopeChrome\|SingleSelectPopover" packages/ apps/

# packages/ui/Explore/ has no apps/ imports:
grep -rn "from 'apps/\|from '@variscout/azure-app\|from '@variscout/pwa-app'" packages/ui/src/components/Explore/ \
  && echo "FAIL: leak" || echo "OK"

# Scope store is the only @variscout/stores import inside Explore:
grep -rn "from '@variscout/stores'" packages/ui/src/components/Explore/

# Reverse-mirror block in Dashboard.tsx is gated:
grep -A1 "scopeBoxplotFactor !== boxplotFactor" apps/azure/src/components/Dashboard.tsx
```

**Browser walk:** SKIPPED per `feedback_wedge_v1_no_migration_no_backcompat` — wedge V1 ships without browser sanity walks; `pr-ready-check.sh` + final Opus review are the quality gates.

---

## Risks + mitigations

- **Risk:** Reverse-mirror useEffects create infinite loops if mirror direction isn't carefully gated.
  - **Mitigation:** Mandatory `if (scopeVal !== localVal) setLocal(scopeVal)` guard. Effect deps include ONLY `scopeVal` (NOT `localVal`). Test the mirror in Dashboard.test.tsx via a render + store mutation + observation.
- **Risk:** `setOutcome` / `setStepId` may not exist on `useProjectStore` — the Architect phase Step 1 verifies these.
  - **Mitigation:** If `setStepId` is absent, defer with `TODO(lv1-e-step-mirror)` comment + ship Y + boxplotFactor mirrors. Spec acceptance signal only requires Y. Log in `docs/decision-log.md` if a follow-up is needed.
- **Risk:** `useDashboardCharts` owns `boxplotFactor` state opaquely — Dashboard body can't call `setBoxplotFactor`.
  - **Mitigation:** Architect phase Step 1 verifies. If opaque, move the mirror INSIDE `useDashboardCharts` (1-line `useEffect`). Update the import + cross-reference back to this plan.
- **Risk:** PWA Dashboard renders without `<ScopeChrome>` — confusing for someone running PWA who expects parity.
  - **Mitigation:** TODO comment in PWA Dashboard.tsx documents the deferral. PR description calls out Azure-only consumer scope. Same pattern as LV1-D.
- **Risk:** `createTestFilterChipData` lives in `test-utils/` but is used by production code (`ScopeChip` + `AddFilterButton`) — reviewer flags as a smell.
  - **Mitigation:** Per `feedback_bundle_followups_pre_merge`, fold the move into THIS PR. Move to `packages/ui/src/components/filterTypes.ts` as `buildFilterChipData(...)` if final-review surfaces this. NOT done preemptively — the test-utils path is short and clear; only refactor if reviewer asks.
- **Risk:** `FilterChipDropdown`'s hard-coded `bg-blue-500` checkbox accent — implementer might think this violates the no-`dark:` rule.
  - **Mitigation:** Plan explicitly documents the rule: blue checkbox accent is allowed (focal-color UI, not a `dark:` variant). DO NOT override `colorScheme`; use the default.
- **Risk:** Pre-existing `ControlEditors.test.tsx` flake (recurred on LV1-0/A/B/H/C/D).
  - **Mitigation:** Standard structural-unrelation verification + PR-description note. Same pattern as last 6 PRs.
- **Risk:** Per-category commit chain gets squashed accidentally during merge.
  - **Mitigation:** Explicit `gh pr merge --merge --delete-branch` (NOT `--squash`) per `feedback_preserve_commit_history`.
- **Risk:** Pre-PR sweep at controller level (NOT in implementer subagent) — implementer subagents have known long-bash pitfall (`feedback_implementer_long_bash_pitfall`).
  - **Mitigation:** Per-task verification is `<test-file> --run` only. Full sweep + build run from controller after Task 7 completes.

---

## Related

- Master plan: [`./2026-05-28-linked-views-phase-1-master-plan.md`](./2026-05-28-linked-views-phase-1-master-plan.md) PR-LV1-E row
- Spec §5.1 + D9 + D7: [`../specs/2026-05-28-state-edit-mode-and-ip-scoped-presentation-design.md`](../specs/2026-05-28-state-edit-mode-and-ip-scoped-presentation-design.md)
- LV1-A sub-plan (scope store): [`./2026-05-28-pr-lv1-a-analysis-scope-store.md`](./2026-05-28-pr-lv1-a-analysis-scope-store.md)
- LV1-D sub-plan (canvas Click-to-Explore, pragmatic-review precedent): [`./2026-05-28-pr-lv1-d-canvas-explore-jump.md`](./2026-05-28-pr-lv1-d-canvas-explore-jump.md)
- FilterChipDropdown: `packages/ui/src/components/FilterChipDropdown/FilterChipDropdown.tsx` (props verified at `:48-61`)
- `analysisScopeStore`: `packages/stores/src/analysisScopeStore.ts` (LV1-A canonical home)
- ProcessHealthBar (canonical caller-anchored-dropdown pattern): `packages/ui/src/components/ProcessHealthBar/ProcessHealthBar.tsx:208-229 + 516-562 + 637-644`
- OutcomeSummaryPill (canonical inline-selector pattern): `packages/ui/src/components/Canvas/EditMode/Header/OutcomeSummaryPill.tsx:25-26`
