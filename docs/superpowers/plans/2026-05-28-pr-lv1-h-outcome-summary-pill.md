---
tier: ephemeral
purpose: build
title: PR-LV1-H — Outcome summary pill in Process tab header
status: active
date: 2026-05-28
layer: spec
---

# PR-LV1-H — Outcome Summary Pill Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax. Dispatch **Sonnet implementer** per task (UI composition; well-specified; reusing existing primitives). Spec compliance reviewer (Sonnet) + code quality reviewer (Sonnet) after Tasks 3 + 4 only (Tasks 1 + 2 are failing-test boilerplate + skeleton — review pair would be overkill). Final-branch Opus review at the end.

**Goal:** Ship a small chrome pill in the Process tab header that subscribes to `useAnalysisScopeStore` and shows the active outcome's name + latest Cpk + a ↗ link to the existing `OutcomeSpecsPopover`.

**Architecture:** New prop-driven component `OutcomeSummaryPill` in `@variscout/ui`. Subscribes directly to `useAnalysisScopeStore` for `yColumn` + `categoricalFilters`. Receives `rawData` + `outcomeSpecs` + an `onOutcomeSpecApply` callback as props. Computes Cpk via the existing `calculateChannelStats` from `@variscout/core` (extracting `.cpk`). Reuses the existing `OutcomeSpecsPopover` for ↗ click — no new popover. Mounts inline in `CanvasWorkspace.tsx`'s existing `<header>` region (lines 1235-1237), conditional on `yColumn !== undefined` so the pill is invisible until LV1-D wires canvas chip clicks to set `scope.yColumn`.

**Tech Stack:** TypeScript 6 · React 19 · Zustand 5 · Vitest 4 · Tailwind 4 (semantic classes only — no `dark:` variants per wedge V1).

**Parent spec:** [`docs/superpowers/specs/2026-05-28-state-edit-mode-and-ip-scoped-presentation-design.md`](../specs/2026-05-28-state-edit-mode-and-ip-scoped-presentation-design.md) §4.1 (Outcome summary pill) + §3 D2 (drop §3.3 panels; keep this pill as chrome)
**Master plan:** [`./2026-05-28-linked-views-phase-1-master-plan.md`](./2026-05-28-linked-views-phase-1-master-plan.md) PR-LV1-H row

---

## Grounded facts (verified — sub-plan is locked to these)

1. **OutcomeSpec already carries `usl?`, `lsl?`, `target?`, `cpkTarget?`** (`packages/core/src/processHub.ts:86-101`). **The pill needs only `outcomeSpecs` — NOT a separate `measureSpecs` prop.** The same OutcomeSpec drives both Cpk computation AND the popover wiring.
2. **CanvasWorkspace already has `rawData` (line 77, required prop) and `outcomeSpecs` (line 142, optional prop).** No thread-through needed; the pill just reads them from existing scope.
3. **OutcomeSpecsPopover EXISTS** at `packages/ui/src/components/Canvas/EditMode/OutcomeZone/OutcomeSpecsPopover.tsx` with API `{ spec: OutcomeSpec, anchor: {x,y}, onApply, onClose }`. Reuse as-is.
4. **`calculateChannelStats(data, columnName, { usl?, lsl? }, label?)` returns `ChannelResult | null`** with `.cpk?: number`. Exported from `@variscout/core` barrel at `packages/core/src/performance.ts:129`. Returns `null` for < 2 numeric values; `.cpk` is `undefined` if no spec limits or σ=0.
5. **Test factory exists**: `createTestOutcomeSpec(overrides?)` at `packages/ui/src/test-utils/outcomeSpec.ts`. Default fixture: Diameter outcome, target 10, LSL 9.5, USL 10.5, cpkTarget 1.33. Use for all popover-spec fixtures.
6. **`formatStatistic` lives at `@variscout/core/i18n`** — use it for the Cpk number (never `.toFixed()` per core hard rule).
7. **`stepId` filtering deferred** to LV1-D/G — needs a step-column convention not yet wired. Pill does NOT subscribe to `stepId` in LV1-H (subscribing without filtering would mislead the reader). Future enhancement, not a regression.

---

## File structure

**Create:**

- `packages/ui/src/components/Canvas/EditMode/Header/OutcomeSummaryPill.tsx` — the pill component
- `packages/ui/src/components/Canvas/EditMode/Header/__tests__/OutcomeSummaryPill.test.tsx` — unit tests

**Modify:**

- `packages/ui/src/components/Canvas/CanvasWorkspace.tsx` — import the pill + render it inline inside the existing `<header>` region (lines 1235-1237) wrapped by a flex container so it sits right of the heading
- `packages/ui/src/components/Canvas/__tests__/CanvasWorkspace.test.tsx` — add one integration assertion (pill visible when `scope.yColumn` set)

**No changes:**

- `packages/stores/src/analysisScopeStore.ts` — final from LV1-A
- `packages/ui/src/components/Canvas/EditMode/OutcomeZone/OutcomeSpecsPopover.tsx` — reused as-is
- `packages/core/src/performance.ts` — `calculateChannelStats` reused as-is
- `packages/ui/src/index.ts` — pill is canvas-internal chrome, no public barrel needed
- `apps/azure/`, `apps/pwa/` — CanvasWorkspace already receives `rawData` + `outcomeSpecs` from these apps

---

## Constraints forwarded to implementer

- **NEVER** `--no-verify` on commits (`feedback_subagent_no_verify`)
- **No `Math.random`** anywhere (core hard rule)
- **No `dark:` Tailwind variants** (wedge V1 no-dark-mode invariant)
- **No emojis in source code** — `↗` is a Unicode arrow glyph, allowed as a character, NOT an emoji
- **No `.toFixed()` on stat values** — use `formatStatistic` from `@variscout/core/i18n`
- **No `Pp` / `Ppk`** anywhere — stay on `Cpk` (`feedback_no_pp_ppk_only_cp_cpk`)
- **No `"root cause"`** in comments / strings — use "contribution" / "suspected cause" (P5 amended)
- **Use semantic Tailwind only** (`bg-surface-secondary`, `text-content-secondary`, `border-edge`, `text-content`) per `packages/ui/CLAUDE.md` Hard rules
- **@variscout/ui MAY NOT import from `apps/`** — pill subscribes to `@variscout/stores` and receives IP-derived data via props
- **Use factory `createTestOutcomeSpec()` for OutcomeSpec fixtures**, NEVER bare object literals — caught by `pnpm --filter @variscout/ui build` (`feedback_ui_build_before_merge`)
- **Functional components only**, props interface named `OutcomeSummaryPillProps`
- **Operate ONLY in the assigned worktree**, never `cd` to main repo (`feedback_subagent_worktree_discipline`)
- **Implementer verification scoped to <90s** per task (`feedback_implementer_long_bash_pitfall`) — `pnpm --filter @variscout/ui test -- OutcomeSummaryPill --run`
- **`pnpm` needs `--`** to forward args to vitest in this repo
- **Reuse production primitives:** `OutcomeSpecsPopover`, `calculateChannelStats`, `formatStatistic`. Don't write parallel implementations (`feedback_reuse_production_primitives`)

---

## Task 1: Failing test scaffold + null-when-no-yColumn behavior

**Files:**

- Create: `packages/ui/src/components/Canvas/EditMode/Header/__tests__/OutcomeSummaryPill.test.tsx`

- [ ] **Step 1: Create the test file with the first two tests**

Create `packages/ui/src/components/Canvas/EditMode/Header/__tests__/OutcomeSummaryPill.test.tsx`:

```tsx
import { beforeEach, describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { useAnalysisScopeStore, getAnalysisScopeInitialState } from '@variscout/stores';
import { createTestOutcomeSpec } from '../../../../../test-utils/outcomeSpec';
import { OutcomeSummaryPill } from '../OutcomeSummaryPill';

describe('OutcomeSummaryPill', () => {
  beforeEach(() => {
    useAnalysisScopeStore.setState(getAnalysisScopeInitialState());
  });

  it('renders nothing when scope.yColumn is undefined', () => {
    render(<OutcomeSummaryPill rawData={[]} outcomeSpecs={[]} />);
    expect(screen.queryByTestId('outcome-summary-pill')).toBeNull();
  });

  it('renders the pill with the outcome name when scope.yColumn is set', () => {
    useAnalysisScopeStore.setState({ yColumn: 'Diameter' });
    render(
      <OutcomeSummaryPill
        rawData={[]}
        outcomeSpecs={[createTestOutcomeSpec({ columnName: 'Diameter' })]}
      />
    );
    const pill = screen.getByTestId('outcome-summary-pill');
    expect(pill).toBeInTheDocument();
    expect(pill).toHaveTextContent('Diameter');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm --filter @variscout/ui test -- OutcomeSummaryPill --run`

Expected: FAIL with `Cannot find module '../OutcomeSummaryPill'` or equivalent — the component doesn't exist yet. Vitest reports both tests as failed.

- [ ] **Step 3: Commit the failing tests**

```bash
git add packages/ui/src/components/Canvas/EditMode/Header/__tests__/OutcomeSummaryPill.test.tsx
git commit -m "$(cat <<'EOF'
test(wedge-v1): LV1-H — failing tests for OutcomeSummaryPill scaffold

Locks the LV1-H contract: pill renders nothing when scope.yColumn is
undefined; renders with the outcome name when scope.yColumn is set.

Fails until Task 2 creates the component.

Refs: docs/superpowers/specs/2026-05-28-state-edit-mode-and-ip-scoped-presentation-design.md §4.1
EOF
)"
```

---

## Task 2: Implement component skeleton (subscription + null-return + heading text)

**Files:**

- Create: `packages/ui/src/components/Canvas/EditMode/Header/OutcomeSummaryPill.tsx`

- [ ] **Step 1: Create the skeleton component**

Create `packages/ui/src/components/Canvas/EditMode/Header/OutcomeSummaryPill.tsx`:

```tsx
import { useAnalysisScopeStore } from '@variscout/stores';
import type { DataRow, OutcomeSpec } from '@variscout/core';

export interface OutcomeSummaryPillProps {
  readonly rawData?: readonly DataRow[];
  readonly outcomeSpecs?: readonly OutcomeSpec[];
  readonly onOutcomeSpecApply?: (updated: OutcomeSpec) => void;
}

export function OutcomeSummaryPill(props: OutcomeSummaryPillProps): JSX.Element | null {
  const yColumn = useAnalysisScopeStore(s => s.yColumn);

  if (!yColumn) return null;

  return (
    <span
      data-testid="outcome-summary-pill"
      className="inline-flex items-center gap-2 rounded-full bg-surface-secondary border border-edge px-3 py-1 text-sm text-content-secondary"
    >
      Active outcome: <span className="text-content font-medium">{yColumn}</span>
      <span aria-hidden="true">·</span>
      Cpk —
    </span>
  );
}
```

- [ ] **Step 2: Run tests to verify they pass**

Run: `pnpm --filter @variscout/ui test -- OutcomeSummaryPill --run`

Expected: PASS — both Task 1 tests are now green. The pill is invisible when `yColumn` is undefined; renders with the outcome name (`Diameter`) when set.

- [ ] **Step 3: Commit the skeleton**

```bash
git add packages/ui/src/components/Canvas/EditMode/Header/OutcomeSummaryPill.tsx
git commit -m "$(cat <<'EOF'
feat(wedge-v1): LV1-H — OutcomeSummaryPill skeleton

Subscribes to useAnalysisScopeStore.yColumn. Renders nothing when
yColumn is undefined; renders 'Active outcome: {yColumn} · Cpk —'
placeholder when set. Cpk computation + popover wiring land in Tasks
3 and 4.

Refs: docs/superpowers/specs/2026-05-28-state-edit-mode-and-ip-scoped-presentation-design.md §4.1
EOF
)"
```

---

## Task 3: Cpk computation + categoricalFilters subscription

**Files:**

- Modify: `packages/ui/src/components/Canvas/EditMode/Header/OutcomeSummaryPill.tsx`
- Modify: `packages/ui/src/components/Canvas/EditMode/Header/__tests__/OutcomeSummaryPill.test.tsx`

- [ ] **Step 1: Add 3 new tests inside the existing describe**

Append these `it()` blocks inside the existing `describe('OutcomeSummaryPill', ...)` block in `packages/ui/src/components/Canvas/EditMode/Header/__tests__/OutcomeSummaryPill.test.tsx`. Imports at the top of the file already include `vitest` + `@testing-library/react` + the store helpers; no additional imports needed for these tests.

```tsx
it('shows formatted Cpk when outcomeSpec carries usl/lsl and data has variance', () => {
  useAnalysisScopeStore.setState({ yColumn: 'Diameter' });
  const spec = createTestOutcomeSpec({
    columnName: 'Diameter',
    lsl: 9.5,
    usl: 10.5,
  });
  // Deterministic fixture: 10 rows centered near 10, modest variance.
  // calculateChannelStats uses σ_within (moving-range sigma), so the
  // exact Cpk depends on consecutive differences. Asserting on the
  // 'Cpk ' prefix + a non-dash character is robust to formatting.
  const rawData = [
    { Diameter: 9.9 },
    { Diameter: 10.1 },
    { Diameter: 10.0 },
    { Diameter: 9.95 },
    { Diameter: 10.05 },
    { Diameter: 10.02 },
    { Diameter: 9.98 },
    { Diameter: 10.01 },
    { Diameter: 9.99 },
    { Diameter: 10.03 },
  ];
  render(<OutcomeSummaryPill rawData={rawData} outcomeSpecs={[spec]} />);
  const pill = screen.getByTestId('outcome-summary-pill');
  expect(pill).toHaveTextContent(/Cpk \S/); // not 'Cpk —'
  expect(pill).not.toHaveTextContent('Cpk —');
});

it('filters data by scope.categoricalFilters before computing Cpk', () => {
  useAnalysisScopeStore.setState({
    yColumn: 'Diameter',
    categoricalFilters: [{ column: 'Vessel', values: ['A'] }],
  });
  const spec = createTestOutcomeSpec({
    columnName: 'Diameter',
    lsl: 9.5,
    usl: 10.5,
  });
  // Vessel=A rows are tightly clustered (high Cpk); Vessel=B rows
  // are widely scattered (low Cpk). The filter keeps only Vessel=A,
  // so the pill must show a non-dash Cpk computed from the A subset
  // — not from the full dataset where B's spread would dominate.
  const rawData = [
    { Diameter: 9.99, Vessel: 'A' },
    { Diameter: 10.01, Vessel: 'A' },
    { Diameter: 10.0, Vessel: 'A' },
    { Diameter: 9.98, Vessel: 'A' },
    { Diameter: 10.02, Vessel: 'A' },
    { Diameter: 8.0, Vessel: 'B' },
    { Diameter: 12.0, Vessel: 'B' },
    { Diameter: 7.5, Vessel: 'B' },
  ];
  render(<OutcomeSummaryPill rawData={rawData} outcomeSpecs={[spec]} />);
  const pill = screen.getByTestId('outcome-summary-pill');
  expect(pill).toHaveTextContent(/Cpk \S/);
  expect(pill).not.toHaveTextContent('Cpk —');
});

it('shows Cpk — when outcomeSpec has no usl/lsl', () => {
  useAnalysisScopeStore.setState({ yColumn: 'Diameter' });
  const spec = createTestOutcomeSpec({
    columnName: 'Diameter',
    lsl: undefined,
    usl: undefined,
  });
  render(
    <OutcomeSummaryPill rawData={[{ Diameter: 10 }, { Diameter: 11 }]} outcomeSpecs={[spec]} />
  );
  expect(screen.getByTestId('outcome-summary-pill')).toHaveTextContent('Cpk —');
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm --filter @variscout/ui test -- OutcomeSummaryPill --run`

Expected: The 3 new tests FAIL (the skeleton still renders the placeholder `Cpk —` regardless of inputs). The 2 Task 1/2 tests still PASS.

- [ ] **Step 3: Implement Cpk computation + categorical-filter subscription**

Replace the contents of `packages/ui/src/components/Canvas/EditMode/Header/OutcomeSummaryPill.tsx` with the full implementation:

```tsx
import { useMemo } from 'react';
import { useAnalysisScopeStore } from '@variscout/stores';
import { calculateChannelStats } from '@variscout/core';
import type { DataRow, OutcomeSpec } from '@variscout/core';
import { formatStatistic } from '@variscout/core/i18n';

export interface OutcomeSummaryPillProps {
  readonly rawData?: readonly DataRow[];
  readonly outcomeSpecs?: readonly OutcomeSpec[];
  readonly onOutcomeSpecApply?: (updated: OutcomeSpec) => void;
}

function filterByCategoricalScope(
  rows: readonly DataRow[],
  filters: ReadonlyArray<{ column: string; values: ReadonlyArray<string | number> }>
): readonly DataRow[] {
  if (filters.length === 0) return rows;
  return rows.filter(row =>
    filters.every(f => f.values.includes(row[f.column] as string | number))
  );
}

export function OutcomeSummaryPill(props: OutcomeSummaryPillProps): JSX.Element | null {
  const yColumn = useAnalysisScopeStore(s => s.yColumn);
  const categoricalFilters = useAnalysisScopeStore(s => s.categoricalFilters);

  const outcomeSpec = props.outcomeSpecs?.find(o => o.columnName === yColumn);

  const filtered = useMemo(
    () => filterByCategoricalScope(props.rawData ?? [], categoricalFilters),
    [props.rawData, categoricalFilters]
  );

  const result = useMemo(
    () =>
      outcomeSpec && (outcomeSpec.usl !== undefined || outcomeSpec.lsl !== undefined)
        ? calculateChannelStats(filtered as DataRow[], yColumn ?? '', {
            usl: outcomeSpec.usl,
            lsl: outcomeSpec.lsl,
          })
        : null,
    [filtered, yColumn, outcomeSpec]
  );

  if (!yColumn) return null;

  const cpkLabel = result?.cpk !== undefined ? `Cpk ${formatStatistic(result.cpk)}` : 'Cpk —';

  return (
    <span
      data-testid="outcome-summary-pill"
      className="inline-flex items-center gap-2 rounded-full bg-surface-secondary border border-edge px-3 py-1 text-sm text-content-secondary"
    >
      Active outcome: <span className="text-content font-medium">{yColumn}</span>
      <span aria-hidden="true">·</span>
      {cpkLabel}
    </span>
  );
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm --filter @variscout/ui test -- OutcomeSummaryPill --run`

Expected: All 5 tests PASS (2 from Tasks 1/2 + 3 new from Task 3). The pill computes Cpk from filtered data using the OutcomeSpec's `usl`/`lsl`, formatted via `formatStatistic`.

- [ ] **Step 5: Commit**

```bash
git add packages/ui/src/components/Canvas/EditMode/Header/OutcomeSummaryPill.tsx \
        packages/ui/src/components/Canvas/EditMode/Header/__tests__/OutcomeSummaryPill.test.tsx
git commit -m "$(cat <<'EOF'
feat(wedge-v1): LV1-H — Cpk computation + categoricalFilters subscription

Pill subscribes to scope.categoricalFilters; filters rawData inline
before calling calculateChannelStats with outcomeSpec.usl/lsl. Renders
'Cpk —' when spec limits are missing or when calculateChannelStats
returns null/undefined for any other reason.

stepId filtering deferred to LV1-D/G when step-column convention lands.

Refs: docs/superpowers/specs/2026-05-28-state-edit-mode-and-ip-scoped-presentation-design.md §4.1
EOF
)"
```

---

## Task 4: ↗ popover wiring + mount in CanvasWorkspace + integration test

**Files:**

- Modify: `packages/ui/src/components/Canvas/EditMode/Header/OutcomeSummaryPill.tsx`
- Modify: `packages/ui/src/components/Canvas/EditMode/Header/__tests__/OutcomeSummaryPill.test.tsx`
- Modify: `packages/ui/src/components/Canvas/CanvasWorkspace.tsx` (header region around line 1235)
- Modify: `packages/ui/src/components/Canvas/__tests__/CanvasWorkspace.test.tsx` (one integration assertion)

- [ ] **Step 1: Add 2 popover-wiring tests**

Append inside the existing `describe('OutcomeSummaryPill', ...)` block in `packages/ui/src/components/Canvas/EditMode/Header/__tests__/OutcomeSummaryPill.test.tsx`. Add `fireEvent` + `vi` to the top imports if not already present (current imports include `render, screen` from `@testing-library/react` + `vitest`). Update the imports line to:

```tsx
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
```

Then append:

```tsx
it('opens OutcomeSpecsPopover on ↗ click with the current outcomeSpec', () => {
  useAnalysisScopeStore.setState({ yColumn: 'Diameter' });
  const spec = createTestOutcomeSpec({ columnName: 'Diameter' });
  render(<OutcomeSummaryPill rawData={[]} outcomeSpecs={[spec]} />);

  // Popover not visible before click
  expect(screen.queryByRole('dialog')).toBeNull();

  fireEvent.click(screen.getByTestId('outcome-summary-pill-spec-button'));

  // Popover renders after click (OutcomeSpecsPopover uses role="dialog")
  expect(screen.getByRole('dialog')).toBeInTheDocument();
  // The popover shows the current outcomeSpec's target value
  expect(screen.getByLabelText(/^target$/i)).toHaveValue(String(spec.target));
});

it('passes onApply through to onOutcomeSpecApply prop and closes popover', () => {
  useAnalysisScopeStore.setState({ yColumn: 'Diameter' });
  const spec = createTestOutcomeSpec({ columnName: 'Diameter' });
  const onApply = vi.fn();
  render(<OutcomeSummaryPill rawData={[]} outcomeSpecs={[spec]} onOutcomeSpecApply={onApply} />);
  fireEvent.click(screen.getByTestId('outcome-summary-pill-spec-button'));
  expect(screen.getByRole('dialog')).toBeInTheDocument();

  // Trigger the popover's Apply button (existing behavior — confirmed by
  // OutcomeSpecsPopover.test.tsx)
  fireEvent.click(screen.getByRole('button', { name: /apply/i }));

  expect(onApply).toHaveBeenCalledTimes(1);
  expect(onApply).toHaveBeenCalledWith(expect.objectContaining({ columnName: 'Diameter' }));
  // Popover closed after onApply (anchor cleared)
  expect(screen.queryByRole('dialog')).toBeNull();
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm --filter @variscout/ui test -- OutcomeSummaryPill --run`

Expected: The 2 new popover-wiring tests FAIL (the pill currently has no ↗ button + no popover state). The 5 prior tests still PASS.

- [ ] **Step 3: Implement popover wiring**

Replace `packages/ui/src/components/Canvas/EditMode/Header/OutcomeSummaryPill.tsx` with the final shape:

```tsx
import { useMemo, useState } from 'react';
import { useAnalysisScopeStore } from '@variscout/stores';
import { calculateChannelStats } from '@variscout/core';
import type { DataRow, OutcomeSpec } from '@variscout/core';
import { formatStatistic } from '@variscout/core/i18n';
import { OutcomeSpecsPopover } from '../OutcomeZone/OutcomeSpecsPopover';

export interface OutcomeSummaryPillProps {
  readonly rawData?: readonly DataRow[];
  readonly outcomeSpecs?: readonly OutcomeSpec[];
  readonly onOutcomeSpecApply?: (updated: OutcomeSpec) => void;
}

function filterByCategoricalScope(
  rows: readonly DataRow[],
  filters: ReadonlyArray<{ column: string; values: ReadonlyArray<string | number> }>
): readonly DataRow[] {
  if (filters.length === 0) return rows;
  return rows.filter(row =>
    filters.every(f => f.values.includes(row[f.column] as string | number))
  );
}

export function OutcomeSummaryPill(props: OutcomeSummaryPillProps): JSX.Element | null {
  const yColumn = useAnalysisScopeStore(s => s.yColumn);
  const categoricalFilters = useAnalysisScopeStore(s => s.categoricalFilters);
  const [anchor, setAnchor] = useState<{ x: number; y: number } | null>(null);

  const outcomeSpec = props.outcomeSpecs?.find(o => o.columnName === yColumn);

  const filtered = useMemo(
    () => filterByCategoricalScope(props.rawData ?? [], categoricalFilters),
    [props.rawData, categoricalFilters]
  );

  const result = useMemo(
    () =>
      outcomeSpec && (outcomeSpec.usl !== undefined || outcomeSpec.lsl !== undefined)
        ? calculateChannelStats(filtered as DataRow[], yColumn ?? '', {
            usl: outcomeSpec.usl,
            lsl: outcomeSpec.lsl,
          })
        : null,
    [filtered, yColumn, outcomeSpec]
  );

  if (!yColumn) return null;

  const cpkLabel = result?.cpk !== undefined ? `Cpk ${formatStatistic(result.cpk)}` : 'Cpk —';

  return (
    <>
      <span
        data-testid="outcome-summary-pill"
        className="inline-flex items-center gap-2 rounded-full bg-surface-secondary border border-edge px-3 py-1 text-sm text-content-secondary"
      >
        Active outcome: <span className="text-content font-medium">{yColumn}</span>
        <span aria-hidden="true">·</span>
        {cpkLabel}
        {outcomeSpec && (
          <button
            type="button"
            data-testid="outcome-summary-pill-spec-button"
            aria-label={`Open ${yColumn} spec`}
            onClick={e => {
              const rect = e.currentTarget.getBoundingClientRect();
              setAnchor({ x: rect.right, y: rect.bottom });
            }}
            className="text-content-secondary hover:text-content"
          >
            ↗
          </button>
        )}
      </span>
      {anchor && outcomeSpec && (
        <OutcomeSpecsPopover
          spec={outcomeSpec}
          anchor={anchor}
          onApply={updated => {
            props.onOutcomeSpecApply?.(updated);
            setAnchor(null);
          }}
          onClose={() => setAnchor(null)}
        />
      )}
    </>
  );
}
```

- [ ] **Step 4: Run pill tests to verify they pass**

Run: `pnpm --filter @variscout/ui test -- OutcomeSummaryPill --run`

Expected: All 7 OutcomeSummaryPill tests PASS (the 2 new popover-wiring tests now go green; the prior 5 stay green).

- [ ] **Step 5: Mount the pill in CanvasWorkspace header**

Edit `packages/ui/src/components/Canvas/CanvasWorkspace.tsx`. First, add the import alongside the existing EditMode imports (search for the closest existing import from `EditMode/`). Use:

```tsx
import { OutcomeSummaryPill } from './EditMode/Header/OutcomeSummaryPill';
```

Then locate the `<header>` block (currently lines 1235-1237):

```tsx
<header className="px-4 pt-4">
  <h2 className="text-lg font-semibold text-content">{t('frame.b1.heading')}</h2>
  <p className="text-sm text-content-secondary">{t('frame.b1.description')}</p>
</header>
```

Replace with:

```tsx
<header className="px-4 pt-4">
  <div className="flex items-center justify-between gap-3">
    <div>
      <h2 className="text-lg font-semibold text-content">{t('frame.b1.heading')}</h2>
      <p className="text-sm text-content-secondary">{t('frame.b1.description')}</p>
    </div>
    <OutcomeSummaryPill rawData={rawData} outcomeSpecs={outcomeSpecs} />
  </div>
</header>
```

Note: `onOutcomeSpecApply` is intentionally left undefined for now — the upstream apply handler can be wired in a follow-up when a clear consumer exists. The pill's popover Apply still works (state local to the pill); it just doesn't propagate to the project store. This is acceptable for LV1-H because the OutcomeSpec edit path from the outcome chip in OutcomeZone already exists and is the canonical mutation route.

- [ ] **Step 6: Add a CanvasWorkspace integration test**

Append to `packages/ui/src/components/Canvas/__tests__/CanvasWorkspace.test.tsx`. First find the existing `describe('CanvasWorkspace', ...)` block. Inside it, add this new `it()` block (you may need to add the scope-store reset to the file's existing `beforeEach`; if a `beforeEach` already resets stores, append the scope-store reset there too):

```tsx
it('LV1-H: renders OutcomeSummaryPill in header when scope.yColumn is set', () => {
  useAnalysisScopeStore.setState({ yColumn: 'Diameter' });
  // Render CanvasWorkspace with minimal props that match the existing
  // test setup pattern in this file (use the file's existing fixture
  // helper / mock if one exists; otherwise minimal valid props).
  render(<CanvasWorkspaceTestHarness yColumn="Diameter" />);
  expect(screen.getByTestId('outcome-summary-pill')).toBeInTheDocument();
});
```

If `CanvasWorkspaceTestHarness` doesn't exist in the file, look for the existing render pattern in the same file (likely a direct `render(<CanvasWorkspace {...props} />)` call with mock props at the top). Mirror that pattern. The key assertion is `screen.getByTestId('outcome-summary-pill')` after setting `scope.yColumn`.

If the existing CanvasWorkspace test setup is complex (mocks for visx, DnD-kit, etc.) and the integration test would balloon, defer this single integration assertion to a follow-up and rely on the standalone OutcomeSummaryPill tests + manual smoke. Document the deferral in the PR description.

Add the import at the top of the test file if not present:

```tsx
import { useAnalysisScopeStore } from '@variscout/stores';
```

- [ ] **Step 7: Run full UI test suite (verify no regression)**

Run: `pnpm --filter @variscout/ui test -- OutcomeSummaryPill CanvasWorkspace --run`

Expected: All targeted tests PASS, including the new CanvasWorkspace integration assertion. If the integration test was deferred per Step 6's note, only the 7 OutcomeSummaryPill tests need to pass.

- [ ] **Step 8: Commit**

```bash
git add packages/ui/src/components/Canvas/EditMode/Header/OutcomeSummaryPill.tsx \
        packages/ui/src/components/Canvas/EditMode/Header/__tests__/OutcomeSummaryPill.test.tsx \
        packages/ui/src/components/Canvas/CanvasWorkspace.tsx \
        packages/ui/src/components/Canvas/__tests__/CanvasWorkspace.test.tsx
git commit -m "$(cat <<'EOF'
feat(wedge-v1): LV1-H — popover wiring + mount in CanvasWorkspace header

↗ click opens OutcomeSpecsPopover anchored at the button's
boundingClientRect; onApply delegates to onOutcomeSpecApply prop and
clears the popover state. Pill mounts inline in the existing Process
tab header, conditional on scope.yColumn via the pill's own null-return.
Integration test asserts the pill appears in CanvasWorkspace when
yColumn is set.

Refs: docs/superpowers/specs/2026-05-28-state-edit-mode-and-ip-scoped-presentation-design.md §4.1
EOF
)"
```

---

## Acceptance signal (end-of-PR, pre-final-review)

- `pnpm --filter @variscout/ui test -- OutcomeSummaryPill --run` — 7 tests PASS (2 + 3 + 2).
- `pnpm --filter @variscout/ui test -- CanvasWorkspace --run` — existing tests + 1 new integration test all PASS (or N/A if integration test deferred).
- `pnpm --filter @variscout/ui build` — clean (no tsc errors from new types or imports per `feedback_ui_build_before_merge`).
- `pnpm --filter @variscout/azure-app build` — clean (CanvasWorkspace integration doesn't break Azure consumer).
- `bash scripts/pr-ready-check.sh` — green (controller-level sweep). If `ControlEditors.test.tsx` flake recurs, confirm structural unrelation via `git diff --stat main..HEAD -- apps/azure/src/components/ControlEditors*` returning empty + document in PR description.
- Branch contains 4 commits (failing test → skeleton → Cpk → popover+mount) preserved via `gh pr merge --merge --delete-branch`, never `--squash` (`feedback_preserve_commit_history`).
- Manual smoke not required (wedge V1 no-browser-walk policy).

---

## Why this plan (and not a bigger one)

LV1-H ships one new file + one CanvasWorkspace header edit. The Cpk computation reuses `calculateChannelStats`; the popover reuses `OutcomeSpecsPopover`; the formatter reuses `formatStatistic`; the test factory reuses `createTestOutcomeSpec`. Production-primitive reuse is the dominant theme (`feedback_reuse_production_primitives`). 4 TDD tasks at 5-10 min each — Task 3 carries the only judgment-density step (Cpk wiring + filter logic); Tasks 1, 2, 4 are mechanical.

`stepId` filtering is deliberately deferred — subscribing to a scope field without using it would mislead readers. LV1-D / LV1-G are the right PRs to add `stepId` populating + the matching step-column filter logic in the pill.

---

## Related

- Parent spec §4.1: `docs/superpowers/specs/2026-05-28-state-edit-mode-and-ip-scoped-presentation-design.md`
- Master plan PR-LV1-H row: `docs/superpowers/plans/2026-05-28-linked-views-phase-1-master-plan.md`
- LV1-A precedent (scope store): `docs/superpowers/plans/2026-05-28-pr-lv1-a-analysis-scope-store.md`
- LV1-B precedent (most recent linked-views PR): `docs/superpowers/plans/2026-05-28-pr-lv1-b-pending-explore-intent-migration.md`
- Reused popover: `packages/ui/src/components/Canvas/EditMode/OutcomeZone/OutcomeSpecsPopover.tsx`
- Reused Cpk function: `packages/core/src/performance.ts:129`
- Test factory: `packages/ui/src/test-utils/outcomeSpec.ts`
- Memory: `feedback_subagent_no_verify`, `feedback_subagent_worktree_discipline`, `feedback_implementer_long_bash_pitfall`, `feedback_wedge_v1_no_migration_no_backcompat`, `feedback_bundle_followups_pre_merge`, `feedback_preserve_commit_history`, `feedback_ui_build_before_merge`, `feedback_reuse_production_primitives`, `feedback_no_pp_ppk_only_cp_cpk`
