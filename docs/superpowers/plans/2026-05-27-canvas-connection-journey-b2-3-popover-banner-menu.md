---
tier: ephemeral
purpose: build
title: PR-CCJ-B2.3 — Override popover + Banner + Context menu (UI) — Implementation Plan
status: active
date: 2026-05-27
layer: spec
---

# PR-CCJ-B2.3 — Override popover + Banner + Context menu (UI) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax. **Right-size models** per `feedback_subagent_driven_default`: Task 1 is mechanical (Haiku); Tasks 2–7 are standard TDD (Sonnet); final branch reviewer is Opus.

**Spec being implemented:** [`docs/superpowers/specs/2026-05-26-canvas-connection-journey-design.md`](../specs/2026-05-26-canvas-connection-journey-design.md) §3.1.1 _Parsing override popover_ + §3.1.2 _Column chip context menu_ + the implied aggregate-warning banner in §3.1.

**Parent sequencer:** [`2026-05-27-canvas-connection-journey-b2-master-plan.md`](./2026-05-27-canvas-connection-journey-b2-master-plan.md)

**Goal:** Finish the palette surface by wiring the `▾` and `⋮` callbacks already emitted by `ColumnChip` (PR #220) to real UI: `ParsingOverridePopover` (3 samples + confidence + alternatives + "Apply to similar"), `ColumnChipContextMenu` (per-kind items), and `ParsingBanner` (aggregate ⚠ when ≥ 3 chips warn). All chip-context-menu items emit a typed `onItemSelect` callback but route to no-op handlers in B2.3 — D + F + G phases wire the actual actions.

**Architecture:** Three new primitives in `packages/ui/src/components/Canvas/EditMode/Palette/`. Mutual-exclusion overlay state lives in `Palette` (`openOverlay: { kind: 'menu' | 'popover'; columnName: string; anchor: { x: number; y: number } } | null`). Menu mirrors the `EvidenceMapContextMenu` pattern (fixed position, viewport-clamped, auto-focus first item, Escape + invisible backdrop close). Popover mirrors a lighter `YAxisPopover` shape (anchor-positioned, outside-click + Escape close). Banner is presentational and renders inside `Palette` above the groups when `warningCount >= 3`.

**Tech Stack:** React 18, TypeScript strict, Tailwind v4, Vitest + happy-dom (per `packages/ui/CLAUDE.md`).

**Branch:** `feat/wedge-v1-ccj-b2-3-popover-banner-menu` off main (currently at PR #220 merge `dfa84ceb`).

---

## File structure (locked decisions)

**Create:**

- `packages/ui/src/components/Canvas/EditMode/Palette/ColumnChipContextMenu.tsx` — per-kind menu primitive
- `packages/ui/src/components/Canvas/EditMode/Palette/ParsingOverridePopover.tsx` — override + samples + apply-to-similar
- `packages/ui/src/components/Canvas/EditMode/Palette/ParsingBanner.tsx` — aggregate ⚠ banner
- `packages/ui/src/components/Canvas/EditMode/Palette/columnChipMenuItems.ts` — static `getItemsForKind(kind)` config
- `packages/ui/src/components/Canvas/EditMode/Palette/__tests__/ColumnChipContextMenu.test.tsx`
- `packages/ui/src/components/Canvas/EditMode/Palette/__tests__/ParsingOverridePopover.test.tsx`
- `packages/ui/src/components/Canvas/EditMode/Palette/__tests__/ParsingBanner.test.tsx`
- `packages/ui/src/components/Canvas/EditMode/Palette/__tests__/columnChipMenuItems.test.ts`

**Modify:**

- `packages/ui/src/components/Canvas/EditMode/Palette/ColumnChip.tsx` — pass anchor `(x, y)` rect to the callbacks (compute from `getBoundingClientRect()` on click)
- `packages/ui/src/components/Canvas/EditMode/Palette/index.tsx` — hold `openOverlay` state, render banner + menu + popover, do mutual exclusion
- `packages/ui/src/components/Canvas/EditMode/Palette/__tests__/Palette.test.tsx` — add banner + overlay wiring tests
- `packages/ui/src/components/Canvas/EditMode/Palette/__tests__/ColumnChip.test.tsx` — update affordance tests to expect anchor in the callback payload

**Out of scope (do NOT touch):**

- Hub-memoization of user overrides — emit `onOverrideAccept(columnName, interpretation)` callback only; persistence wires in C-phase
- Wire of menu items to D/F/G destinations — emit typed `onMenuItemSelect(columnName, itemId)`; consumer routes to no-op
- Real "Apply to similar" matching logic — popover emits `onApplyToSimilar(columnName, interpretation)`; route stays as a callback
- `apps/*/src/**` — no app-side wiring in B2.3

---

## Mutual-exclusion contract (Palette overlay state)

Per `packages/ui/CLAUDE.md` Evidence Map convention: only one overlay open at a time.

```typescript
type OpenOverlay =
  | { kind: 'menu'; columnName: string; anchor: { x: number; y: number } }
  | { kind: 'popover'; columnName: string; anchor: { x: number; y: number } };

// In Palette:
const [openOverlay, setOpenOverlay] = useState<OpenOverlay | null>(null);

// ColumnChip's callback shape changes from (columnName) to (columnName, anchor):
const onColumnContextMenuOpen = (columnName, anchor) =>
  setOpenOverlay({ kind: 'menu', columnName, anchor });
const onColumnOverrideOpen = (columnName, anchor) =>
  setOpenOverlay({ kind: 'popover', columnName, anchor });
// Either action automatically closes the other (single state slot).
```

The chip callback signature must therefore accept `anchor` alongside `columnName`. This is a small backward-incompatible change vs the B2.2 signature — acceptable because B2.2's callbacks are not yet wired in any app.

---

## Pre-implementation setup

- [ ] **Step 0a: Create worktree + branch**

```bash
git fetch origin
git worktree add .worktrees/feat/wedge-v1-ccj-b2-3-popover-banner-menu -b feat/wedge-v1-ccj-b2-3-popover-banner-menu origin/main
cd .worktrees/feat/wedge-v1-ccj-b2-3-popover-banner-menu
pnpm install --frozen-lockfile
```

Expected: clean worktree on the new branch at `dfa84ceb`.

- [ ] **Step 0b: Baseline check**

```bash
pnpm --filter @variscout/ui test -- Palette ColumnChip ColumnGroup EditModeShell columnParsingProfileFactory encodeColumnDragId
```

Expected: PASS (28+ tests across the existing Palette surface). Snapshot the count.

---

## Task 1: `columnChipMenuItems` static config

**Files:**

- Create: `packages/ui/src/components/Canvas/EditMode/Palette/columnChipMenuItems.ts`
- Test: `packages/ui/src/components/Canvas/EditMode/Palette/__tests__/columnChipMenuItems.test.ts`

This is a static config + lookup function — pure mechanical. No menu UI yet; the UI lands in Task 2 and consumes this.

- [ ] **Step 1: Write the failing config tests**

```typescript
// columnChipMenuItems.test.ts
import { describe, it, expect } from 'vitest';
import { getMenuItemsForKind, type ColumnMenuItem } from '../columnChipMenuItems';

describe('getMenuItemsForKind', () => {
  it('returns numeric items in spec order', () => {
    const items = getMenuItemsForKind('numeric');
    expect(items.map(i => i.id)).toEqual([
      'use-as-factor',
      'bin-into-categorical',
      'view-in-explore',
      'calculate-from',
      'parsing-and-format',
      'rename-column',
    ]);
  });

  it('returns time/date items in spec order', () => {
    const items = getMenuItemsForKind('date');
    expect(items.map(i => i.id)).toEqual([
      'use-as-timestamp',
      'use-as-time-factors',
      'view-in-explore',
      'parsing-and-format',
      'rename-column',
    ]);
  });

  it('returns categorical items in spec order', () => {
    const items = getMenuItemsForKind('categorical');
    expect(items.map(i => i.id)).toEqual([
      'use-as-factor',
      'use-as-process-step',
      'view-in-explore',
      'combine-levels',
      'parsing-and-format',
      'rename-column',
    ]);
  });

  it('returns id items in spec order', () => {
    const items = getMenuItemsForKind('id');
    expect(items.map(i => i.id)).toEqual([
      'use-as-scope-id',
      'view-uniqueness-in-explore',
      'parsing-and-format',
      'rename-column',
    ]);
  });

  it('returns text items (fallback set)', () => {
    const items = getMenuItemsForKind('text');
    expect(items.map(i => i.id)).toEqual(['parsing-and-format', 'rename-column']);
  });

  it('every item has a human label', () => {
    const allKinds = ['numeric', 'date', 'categorical', 'id', 'text'] as const;
    for (const kind of allKinds) {
      for (const item of getMenuItemsForKind(kind)) {
        expect(item.label).toBeTruthy();
        expect(item.id).toBeTruthy();
      }
    }
  });
});
```

- [ ] **Step 2: Run, confirm FAIL**

```bash
pnpm --filter @variscout/ui test -- columnChipMenuItems
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement the config**

Create `packages/ui/src/components/Canvas/EditMode/Palette/columnChipMenuItems.ts`:

```typescript
import type { ParsingInterpretation } from '@variscout/core/parser';

type ColumnKind = ParsingInterpretation['kind'];

export interface ColumnMenuItem {
  id: string;
  label: string;
}

const NUMERIC: ColumnMenuItem[] = [
  { id: 'use-as-factor', label: 'Use as continuous factor' },
  { id: 'bin-into-categorical', label: 'Bin into categorical…' },
  { id: 'view-in-explore', label: 'View distribution in Explore →' },
  { id: 'calculate-from', label: 'Calculate from this column…' },
  { id: 'parsing-and-format', label: 'Parsing & format' },
  { id: 'rename-column', label: 'Rename column…' },
];

const DATE: ColumnMenuItem[] = [
  { id: 'use-as-timestamp', label: 'Use as timestamp' },
  { id: 'use-as-time-factors', label: 'Use as time factors' },
  { id: 'view-in-explore', label: 'View distribution in Explore →' },
  { id: 'parsing-and-format', label: 'Parsing & format' },
  { id: 'rename-column', label: 'Rename column…' },
];

const CATEGORICAL: ColumnMenuItem[] = [
  { id: 'use-as-factor', label: 'Use as factor' },
  { id: 'use-as-process-step', label: 'Use as process step' },
  { id: 'view-in-explore', label: 'View frequencies in Explore →' },
  { id: 'combine-levels', label: 'Combine levels…' },
  { id: 'parsing-and-format', label: 'Parsing & format' },
  { id: 'rename-column', label: 'Rename column…' },
];

const ID: ColumnMenuItem[] = [
  { id: 'use-as-scope-id', label: 'Use as scope identifier' },
  { id: 'view-uniqueness-in-explore', label: 'View uniqueness in Explore →' },
  { id: 'parsing-and-format', label: 'Parsing & format' },
  { id: 'rename-column', label: 'Rename column…' },
];

const TEXT: ColumnMenuItem[] = [
  { id: 'parsing-and-format', label: 'Parsing & format' },
  { id: 'rename-column', label: 'Rename column…' },
];

export function getMenuItemsForKind(kind: ColumnKind): ColumnMenuItem[] {
  switch (kind) {
    case 'numeric':
      return NUMERIC;
    case 'date':
      return DATE;
    case 'categorical':
      return CATEGORICAL;
    case 'id':
      return ID;
    case 'text':
    default:
      return TEXT;
  }
}
```

- [ ] **Step 4: Run, confirm PASS**

```bash
pnpm --filter @variscout/ui test -- columnChipMenuItems
```

Expected: PASS (6 tests).

- [ ] **Step 5: Commit**

```bash
git add packages/ui/src/components/Canvas/EditMode/Palette/columnChipMenuItems.ts \
        packages/ui/src/components/Canvas/EditMode/Palette/__tests__/columnChipMenuItems.test.ts
git commit -m "feat(ui): columnChipMenuItems config per spec §3.1.2"
```

---

## Task 2: `ColumnChipContextMenu` primitive

**Files:**

- Create: `packages/ui/src/components/Canvas/EditMode/Palette/ColumnChipContextMenu.tsx`
- Test: `packages/ui/src/components/Canvas/EditMode/Palette/__tests__/ColumnChipContextMenu.test.tsx`

Mirror `EvidenceMapContextMenu/NodeContextMenu` pattern: fixed position, viewport-clamped, auto-focus first item, Escape + invisible-backdrop close.

- [ ] **Step 1: Write the failing menu tests**

```tsx
// ColumnChipContextMenu.test.tsx
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ColumnChipContextMenu } from '../ColumnChipContextMenu';

const baseProps = {
  columnName: 'Speed',
  kind: 'numeric' as const,
  anchor: { x: 100, y: 200 },
  onItemSelect: vi.fn(),
  onClose: vi.fn(),
};

describe('ColumnChipContextMenu', () => {
  it('renders the spec items for the given kind', () => {
    render(<ColumnChipContextMenu {...baseProps} />);
    expect(screen.getByText('Use as continuous factor')).toBeInTheDocument();
    expect(screen.getByText('Bin into categorical…')).toBeInTheDocument();
    expect(screen.getByText('View distribution in Explore →')).toBeInTheDocument();
    expect(screen.getByText('Calculate from this column…')).toBeInTheDocument();
    expect(screen.getByText('Parsing & format')).toBeInTheDocument();
    expect(screen.getByText('Rename column…')).toBeInTheDocument();
  });

  it('fires onItemSelect with columnName + itemId on click', () => {
    const onItemSelect = vi.fn();
    render(<ColumnChipContextMenu {...baseProps} onItemSelect={onItemSelect} />);
    fireEvent.click(screen.getByText('Bin into categorical…'));
    expect(onItemSelect).toHaveBeenCalledWith('Speed', 'bin-into-categorical');
  });

  it('fires onClose after item click', () => {
    const onClose = vi.fn();
    render(<ColumnChipContextMenu {...baseProps} onClose={onClose} />);
    fireEvent.click(screen.getByText('Parsing & format'));
    expect(onClose).toHaveBeenCalled();
  });

  it('closes on Escape', () => {
    const onClose = vi.fn();
    render(<ColumnChipContextMenu {...baseProps} onClose={onClose} />);
    fireEvent.keyDown(screen.getByRole('menu'), { key: 'Escape' });
    expect(onClose).toHaveBeenCalled();
  });

  it('closes on backdrop click', () => {
    const onClose = vi.fn();
    render(<ColumnChipContextMenu {...baseProps} onClose={onClose} />);
    fireEvent.click(screen.getByTestId('column-chip-menu-backdrop'));
    expect(onClose).toHaveBeenCalled();
  });

  it('renders the kind-specific item set for categorical', () => {
    render(<ColumnChipContextMenu {...baseProps} kind="categorical" />);
    expect(screen.getByText('Use as process step')).toBeInTheDocument();
    expect(screen.getByText('Combine levels…')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run, confirm FAIL**

```bash
pnpm --filter @variscout/ui test -- ColumnChipContextMenu
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement the menu**

Create `packages/ui/src/components/Canvas/EditMode/Palette/ColumnChipContextMenu.tsx`:

```tsx
import React, { useEffect, useRef } from 'react';
import type { ParsingInterpretation } from '@variscout/core/parser';
import { getMenuItemsForKind } from './columnChipMenuItems';

export interface ColumnChipContextMenuProps {
  columnName: string;
  kind: ParsingInterpretation['kind'];
  anchor: { x: number; y: number };
  onItemSelect: (columnName: string, itemId: string) => void;
  onClose: () => void;
}

export const ColumnChipContextMenu: React.FC<ColumnChipContextMenuProps> = ({
  columnName,
  kind,
  anchor,
  onItemSelect,
  onClose,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const items = getMenuItemsForKind(kind);

  useEffect(() => {
    const first = menuRef.current?.querySelector<HTMLButtonElement>('[role="menuitem"]');
    first?.focus();
  }, []);

  return (
    <>
      <div
        data-testid="column-chip-menu-backdrop"
        className="fixed inset-0 z-40"
        onClick={onClose}
      />
      <div
        ref={menuRef}
        role="menu"
        aria-label={`Actions for ${columnName}`}
        tabIndex={-1}
        onKeyDown={e => {
          if (e.key === 'Escape') onClose();
        }}
        style={{ position: 'fixed', left: anchor.x, top: anchor.y, zIndex: 50 }}
        className="min-w-[14rem] rounded-md border border-edge bg-surface-primary py-1 shadow-md"
      >
        {items.map(item => (
          <button
            key={item.id}
            type="button"
            role="menuitem"
            className="block w-full px-3 py-1.5 text-left text-xs text-content hover:bg-surface-secondary focus:bg-surface-secondary focus:outline-none"
            onClick={() => {
              onItemSelect(columnName, item.id);
              onClose();
            }}
          >
            {item.label}
          </button>
        ))}
      </div>
    </>
  );
};

export default ColumnChipContextMenu;
```

Note: viewport clamping (clamp left/top if menu would overflow) is deferred — happy-dom in tests reports `window.innerWidth`/`innerHeight` reliably but the anchors are caller-provided. In B2.3 we trust the caller; if a future PR finds real overflow we add a `useLayoutEffect` clamp. Document this in the commit.

- [ ] **Step 4: Run, confirm PASS**

```bash
pnpm --filter @variscout/ui test -- ColumnChipContextMenu
```

Expected: PASS (6 tests).

- [ ] **Step 5: Commit**

```bash
git add packages/ui/src/components/Canvas/EditMode/Palette/ColumnChipContextMenu.tsx \
        packages/ui/src/components/Canvas/EditMode/Palette/__tests__/ColumnChipContextMenu.test.tsx
git commit -m "feat(ui): ColumnChipContextMenu primitive (per-kind items + Escape/backdrop close)"
```

---

## Task 3: `ParsingOverridePopover` primitive

**Files:**

- Create: `packages/ui/src/components/Canvas/EditMode/Palette/ParsingOverridePopover.tsx`
- Test: `packages/ui/src/components/Canvas/EditMode/Palette/__tests__/ParsingOverridePopover.test.tsx`

Shows 3 transformed samples + confidence percentage + alternatives ranked by parse-count + "Apply to similar →" affordance. Outside-click + Escape close. The chip's primary stays selected by default; clicking an alternative emits `onChoose(interpretation)` which the caller routes back (no internal state in B2.3 — pure controlled).

- [ ] **Step 1: Write the failing popover tests**

```tsx
// ParsingOverridePopover.test.tsx
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ParsingOverridePopover } from '../ParsingOverridePopover';
import { createTestColumnParsingProfile } from '../../../../../test-utils/columnParsingProfile';

const renderPopover = (overrides = {}) => {
  const props = {
    columnName: 'Speed',
    profile: createTestColumnParsingProfile({
      columnName: 'Speed',
      confidence: 92,
      primary: { kind: 'numeric', label: 'numeric · EU decimal', detail: {} },
      alternatives: [
        {
          interpretation: { kind: 'numeric', label: 'numeric · US format', detail: {} },
          parseCount: 5,
          totalCount: 10,
        },
      ],
      transformedSamples: [
        { raw: '182,5', transformed: '182.5' },
        { raw: '93,2', transformed: '93.2' },
        { raw: '47,1', transformed: '47.1' },
      ],
    }),
    anchor: { x: 100, y: 200 },
    onChoose: vi.fn(),
    onApplyToSimilar: vi.fn(),
    onClose: vi.fn(),
    ...overrides,
  };
  return { props, ...render(<ParsingOverridePopover {...props} />) };
};

describe('ParsingOverridePopover', () => {
  it('renders the primary interpretation label and confidence', () => {
    renderPopover();
    expect(screen.getByText(/numeric · EU decimal/)).toBeInTheDocument();
    expect(screen.getByText(/92%/)).toBeInTheDocument();
  });

  it('renders the 3 transformed samples', () => {
    renderPopover();
    expect(screen.getByText(/182,5 → 182\.5/)).toBeInTheDocument();
    expect(screen.getByText(/93,2 → 93\.2/)).toBeInTheDocument();
    expect(screen.getByText(/47,1 → 47\.1/)).toBeInTheDocument();
  });

  it('renders alternatives with parseCount / totalCount', () => {
    renderPopover();
    expect(screen.getByText(/numeric · US format/)).toBeInTheDocument();
    expect(screen.getByText(/5 \/ 10/)).toBeInTheDocument();
  });

  it('clicking an alternative fires onChoose with the chosen interpretation', () => {
    const { props } = renderPopover();
    fireEvent.click(screen.getByTestId('override-alternative-numeric · US format'));
    expect(props.onChoose).toHaveBeenCalledWith('Speed', {
      kind: 'numeric',
      label: 'numeric · US format',
      detail: {},
    });
  });

  it('fires onApplyToSimilar with current primary when the affordance is clicked', () => {
    const { props } = renderPopover();
    fireEvent.click(screen.getByRole('button', { name: /apply to similar/i }));
    expect(props.onApplyToSimilar).toHaveBeenCalledWith('Speed', {
      kind: 'numeric',
      label: 'numeric · EU decimal',
      detail: {},
    });
  });

  it('closes on Escape', () => {
    const { props } = renderPopover();
    fireEvent.keyDown(screen.getByTestId('parsing-override-popover'), { key: 'Escape' });
    expect(props.onClose).toHaveBeenCalled();
  });

  it('closes on backdrop click', () => {
    const { props } = renderPopover();
    fireEvent.click(screen.getByTestId('parsing-override-popover-backdrop'));
    expect(props.onClose).toHaveBeenCalled();
  });

  it('shows a "parse failed" hint when primary is null', () => {
    renderPopover({
      profile: createTestColumnParsingProfile({
        status: 'error',
        primary: null,
        confidence: 0,
      }),
    });
    expect(screen.getByText(/parse failed/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run, confirm FAIL**

```bash
pnpm --filter @variscout/ui test -- ParsingOverridePopover
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement the popover**

Create `packages/ui/src/components/Canvas/EditMode/Palette/ParsingOverridePopover.tsx`:

```tsx
import React from 'react';
import type { ColumnParsingProfile, ParsingInterpretation } from '@variscout/core/parser';

export interface ParsingOverridePopoverProps {
  columnName: string;
  profile: ColumnParsingProfile;
  anchor: { x: number; y: number };
  onChoose: (columnName: string, interpretation: ParsingInterpretation) => void;
  onApplyToSimilar: (columnName: string, interpretation: ParsingInterpretation) => void;
  onClose: () => void;
}

export const ParsingOverridePopover: React.FC<ParsingOverridePopoverProps> = ({
  columnName,
  profile,
  anchor,
  onChoose,
  onApplyToSimilar,
  onClose,
}) => {
  return (
    <>
      <div
        data-testid="parsing-override-popover-backdrop"
        className="fixed inset-0 z-40"
        onClick={onClose}
      />
      <div
        data-testid="parsing-override-popover"
        role="dialog"
        aria-label={`Parsing options for ${columnName}`}
        tabIndex={-1}
        onKeyDown={e => {
          if (e.key === 'Escape') onClose();
        }}
        style={{ position: 'fixed', left: anchor.x, top: anchor.y, zIndex: 50 }}
        className="w-[20rem] rounded-md border border-edge bg-surface-primary p-3 text-xs shadow-md"
      >
        <header className="mb-2 flex items-baseline justify-between">
          <span className="font-medium text-content">{columnName}</span>
          {profile.primary ? (
            <span className="text-content-tertiary">
              {profile.primary.label} · {profile.confidence}%
            </span>
          ) : (
            <span className="text-red-700">parse failed</span>
          )}
        </header>

        {profile.transformedSamples.length > 0 && (
          <ul className="mb-2 space-y-0.5 font-mono text-[10px] text-content-secondary">
            {profile.transformedSamples.map((sample, i) => (
              <li key={i}>
                {sample.raw} → {sample.transformed}
              </li>
            ))}
          </ul>
        )}

        {profile.alternatives.length > 0 && (
          <section className="mb-2 border-t border-edge pt-2">
            <h5 className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-content-tertiary">
              Alternatives
            </h5>
            <ul className="space-y-0.5">
              {profile.alternatives.map(alt => (
                <li key={alt.interpretation.label}>
                  <button
                    type="button"
                    data-testid={`override-alternative-${alt.interpretation.label}`}
                    className="flex w-full items-baseline justify-between rounded px-1 py-0.5 text-left text-xs text-content hover:bg-surface-secondary"
                    onClick={() => {
                      onChoose(columnName, alt.interpretation);
                      onClose();
                    }}
                  >
                    <span>{alt.interpretation.label}</span>
                    <span className="text-[10px] text-content-tertiary">
                      {alt.parseCount} / {alt.totalCount}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}

        {profile.primary && (
          <button
            type="button"
            className="w-full rounded-md border border-edge bg-surface-primary px-2 py-1 text-xs text-content hover:bg-surface-secondary"
            onClick={() => onApplyToSimilar(columnName, profile.primary!)}
          >
            Apply to similar columns →
          </button>
        )}
      </div>
    </>
  );
};

export default ParsingOverridePopover;
```

- [ ] **Step 4: Run, confirm PASS**

```bash
pnpm --filter @variscout/ui test -- ParsingOverridePopover
```

Expected: PASS (8 tests).

- [ ] **Step 5: Commit**

```bash
git add packages/ui/src/components/Canvas/EditMode/Palette/ParsingOverridePopover.tsx \
        packages/ui/src/components/Canvas/EditMode/Palette/__tests__/ParsingOverridePopover.test.tsx
git commit -m "feat(ui): ParsingOverridePopover primitive (samples + alternatives + apply-to-similar)"
```

---

## Task 4: `ParsingBanner` primitive

**Files:**

- Create: `packages/ui/src/components/Canvas/EditMode/Palette/ParsingBanner.tsx`
- Test: `packages/ui/src/components/Canvas/EditMode/Palette/__tests__/ParsingBanner.test.tsx`

A small inline banner that appears at the top of the palette when ≥ 3 chips have status `'warning'`. Shows the count + a "Review parsing" button that emits an `onReviewAll()` callback (no-op-routed in B2.3; future C-phase wires it to a focused review flow).

- [ ] **Step 1: Write the failing banner tests**

```tsx
// ParsingBanner.test.tsx
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ParsingBanner } from '../ParsingBanner';

describe('ParsingBanner', () => {
  it('renders the warning count and review button when warningCount >= 3', () => {
    const onReviewAll = vi.fn();
    render(<ParsingBanner warningCount={4} onReviewAll={onReviewAll} />);
    expect(screen.getByText(/4 columns need attention/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /review/i })).toBeInTheDocument();
  });

  it('fires onReviewAll when the review button is clicked', () => {
    const onReviewAll = vi.fn();
    render(<ParsingBanner warningCount={3} onReviewAll={onReviewAll} />);
    fireEvent.click(screen.getByRole('button', { name: /review/i }));
    expect(onReviewAll).toHaveBeenCalled();
  });

  it('uses warning amber tokens', () => {
    render(<ParsingBanner warningCount={3} onReviewAll={() => {}} />);
    const banner = screen.getByTestId('parsing-banner');
    expect(banner.className).toMatch(/bg-amber-50/);
    expect(banner.className).toMatch(/text-amber-700/);
  });
});
```

- [ ] **Step 2: Run, confirm FAIL**

```bash
pnpm --filter @variscout/ui test -- ParsingBanner
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement the banner**

Create `packages/ui/src/components/Canvas/EditMode/Palette/ParsingBanner.tsx`:

```tsx
import React from 'react';

export interface ParsingBannerProps {
  warningCount: number;
  onReviewAll: () => void;
}

export const ParsingBanner: React.FC<ParsingBannerProps> = ({ warningCount, onReviewAll }) => {
  return (
    <div
      data-testid="parsing-banner"
      role="status"
      className="flex items-center justify-between gap-2 rounded-md bg-amber-50 px-3 py-1.5 text-xs text-amber-700"
    >
      <span>⚠ {warningCount} columns need attention</span>
      <button
        type="button"
        className="rounded border border-amber-700/40 px-2 py-0.5 text-[10px] font-medium text-amber-700 hover:bg-amber-100"
        onClick={onReviewAll}
      >
        Review
      </button>
    </div>
  );
};

export default ParsingBanner;
```

- [ ] **Step 4: Run, confirm PASS**

```bash
pnpm --filter @variscout/ui test -- ParsingBanner
```

Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add packages/ui/src/components/Canvas/EditMode/Palette/ParsingBanner.tsx \
        packages/ui/src/components/Canvas/EditMode/Palette/__tests__/ParsingBanner.test.tsx
git commit -m "feat(ui): ParsingBanner primitive (aggregate ⚠ count + review CTA)"
```

---

## Task 5: ColumnChip callback signature — pass anchor

**Files:**

- Modify: `packages/ui/src/components/Canvas/EditMode/Palette/ColumnChip.tsx`
- Modify: `packages/ui/src/components/Canvas/EditMode/Palette/__tests__/ColumnChip.test.tsx`

Update the two affordance buttons to compute their anchor from `getBoundingClientRect()` on click and pass it as the second arg to the callback. Update the prop types accordingly.

- [ ] **Step 1: Modify the affordance tests**

In `__tests__/ColumnChip.test.tsx`, find the existing `describe('ColumnChip — affordances', ...)` block. Replace its two tests with:

```tsx
describe('ColumnChip — affordances', () => {
  it('renders the ▾ override button and fires onOverrideOpen with columnName + anchor', () => {
    const onOverrideOpen = vi.fn();
    renderChip({
      profile: createTestColumnParsingProfile({ columnName: 'Speed' }),
      onOverrideOpen,
    });
    fireEvent.click(screen.getByTestId('column-chip-override-button'));
    expect(onOverrideOpen).toHaveBeenCalledWith(
      'Speed',
      expect.objectContaining({ x: expect.any(Number), y: expect.any(Number) })
    );
  });

  it('renders the ⋮ context button and fires onContextMenuOpen with columnName + anchor', () => {
    const onContextMenuOpen = vi.fn();
    renderChip({
      profile: createTestColumnParsingProfile({ columnName: 'Speed' }),
      onContextMenuOpen,
    });
    fireEvent.click(screen.getByTestId('column-chip-context-button'));
    expect(onContextMenuOpen).toHaveBeenCalledWith(
      'Speed',
      expect.objectContaining({ x: expect.any(Number), y: expect.any(Number) })
    );
  });
});
```

- [ ] **Step 2: Run, confirm FAIL**

```bash
pnpm --filter @variscout/ui test -- ColumnChip
```

Expected: FAIL — old call signature is single-arg.

- [ ] **Step 3: Update `ColumnChip.tsx`**

In `ColumnChip.tsx`:

1. Change the prop types:

```tsx
onOverrideOpen?: (columnName: string, anchor: { x: number; y: number }) => void;
onContextMenuOpen?: (columnName: string, anchor: { x: number; y: number }) => void;
```

2. Update the two button click handlers to compute the anchor:

```tsx
<button
  type="button"
  data-testid="column-chip-override-button"
  className="text-xs text-content-tertiary hover:text-content"
  aria-label={`Override parsing for ${profile.columnName}`}
  onClick={(e) => {
    const rect = (e.currentTarget as HTMLButtonElement).getBoundingClientRect();
    onOverrideOpen?.(profile.columnName, { x: rect.left, y: rect.bottom });
  }}
>
  ▾
</button>
<button
  type="button"
  data-testid="column-chip-context-button"
  className="text-xs text-content-tertiary hover:text-content"
  aria-label={`Open context menu for ${profile.columnName}`}
  onClick={(e) => {
    const rect = (e.currentTarget as HTMLButtonElement).getBoundingClientRect();
    onContextMenuOpen?.(profile.columnName, { x: rect.left, y: rect.bottom });
  }}
>
  ⋮
</button>
```

- [ ] **Step 4: Run, confirm PASS**

```bash
pnpm --filter @variscout/ui test -- ColumnChip
```

Expected: PASS (16 tests, unchanged count).

- [ ] **Step 5: Commit**

```bash
git add packages/ui/src/components/Canvas/EditMode/Palette/ColumnChip.tsx \
        packages/ui/src/components/Canvas/EditMode/Palette/__tests__/ColumnChip.test.tsx
git commit -m "refactor(ui): ColumnChip emits anchor with override/context callbacks"
```

---

## Task 6: Palette overlay state + banner threshold + mutual exclusion

**Files:**

- Modify: `packages/ui/src/components/Canvas/EditMode/Palette/index.tsx`
- Modify: `packages/ui/src/components/Canvas/EditMode/Palette/__tests__/Palette.test.tsx`

Palette now owns the `openOverlay` state and renders `ColumnChipContextMenu` / `ParsingOverridePopover` / `ParsingBanner` based on its own props + state. The existing `onColumnOverrideOpen` / `onColumnContextMenuOpen` Palette props (forwarded to chips today) become OPTIONAL outbound callbacks — Palette no longer needs them for normal operation, but consumers may still want to observe these events. Add new optional callbacks: `onMenuItemSelect(columnName, itemId)`, `onOverrideAccept(columnName, interpretation)`, `onApplyToSimilar(columnName, interpretation)`, `onReviewAllWarnings()`. All four default to no-ops.

- [ ] **Step 1: Append failing tests**

```tsx
// Palette.test.tsx — append at the end
import { fireEvent } from '@testing-library/react';
import { vi } from 'vitest';

describe('Palette — overlay state + banner', () => {
  const warningProfiles = (n: number) =>
    Array.from({ length: n }, (_, i) =>
      createTestColumnParsingProfile({
        columnName: `Col${i}`,
        status: 'warning',
        confidence: 60,
        primary: { kind: 'numeric', label: 'numeric · plain', detail: {} },
      })
    );

  it('renders ParsingBanner when warning count >= 3', () => {
    renderPalette({ profiles: warningProfiles(3) });
    expect(screen.getByTestId('parsing-banner')).toBeInTheDocument();
    expect(screen.getByText(/3 columns need attention/i)).toBeInTheDocument();
  });

  it('does not render ParsingBanner when warning count < 3', () => {
    renderPalette({ profiles: warningProfiles(2) });
    expect(screen.queryByTestId('parsing-banner')).toBeNull();
  });

  it('opens the context menu when a chip ⋮ button is clicked', () => {
    renderPalette({
      profiles: [
        createTestColumnParsingProfile({
          columnName: 'Speed',
          primary: { kind: 'numeric', label: 'numeric · plain', detail: {} },
        }),
      ],
    });
    fireEvent.click(screen.getByTestId('column-chip-context-button'));
    expect(screen.getByRole('menu')).toBeInTheDocument();
    expect(screen.getByText('Use as continuous factor')).toBeInTheDocument();
  });

  it('opens the override popover when a chip ▾ button is clicked', () => {
    renderPalette({
      profiles: [
        createTestColumnParsingProfile({
          columnName: 'Speed',
          primary: { kind: 'numeric', label: 'numeric · plain', detail: {} },
        }),
      ],
    });
    fireEvent.click(screen.getByTestId('column-chip-override-button'));
    expect(screen.getByTestId('parsing-override-popover')).toBeInTheDocument();
  });

  it('opening the menu closes the popover (mutual exclusion)', () => {
    renderPalette({
      profiles: [
        createTestColumnParsingProfile({
          columnName: 'Speed',
          primary: { kind: 'numeric', label: 'numeric · plain', detail: {} },
        }),
      ],
    });
    fireEvent.click(screen.getByTestId('column-chip-override-button'));
    expect(screen.getByTestId('parsing-override-popover')).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('column-chip-context-button'));
    expect(screen.queryByTestId('parsing-override-popover')).toBeNull();
    expect(screen.getByRole('menu')).toBeInTheDocument();
  });

  it('forwards menu item selections via onMenuItemSelect', () => {
    const onMenuItemSelect = vi.fn();
    renderPalette({
      profiles: [
        createTestColumnParsingProfile({
          columnName: 'Speed',
          primary: { kind: 'numeric', label: 'numeric · plain', detail: {} },
        }),
      ],
      onMenuItemSelect,
    });
    fireEvent.click(screen.getByTestId('column-chip-context-button'));
    fireEvent.click(screen.getByText('Bin into categorical…'));
    expect(onMenuItemSelect).toHaveBeenCalledWith('Speed', 'bin-into-categorical');
  });

  it('forwards override choice via onOverrideAccept', () => {
    const onOverrideAccept = vi.fn();
    renderPalette({
      profiles: [
        createTestColumnParsingProfile({
          columnName: 'Speed',
          confidence: 92,
          primary: { kind: 'numeric', label: 'numeric · EU decimal', detail: {} },
          alternatives: [
            {
              interpretation: { kind: 'numeric', label: 'numeric · US format', detail: {} },
              parseCount: 5,
              totalCount: 10,
            },
          ],
        }),
      ],
      onOverrideAccept,
    });
    fireEvent.click(screen.getByTestId('column-chip-override-button'));
    fireEvent.click(screen.getByTestId('override-alternative-numeric · US format'));
    expect(onOverrideAccept).toHaveBeenCalledWith('Speed', {
      kind: 'numeric',
      label: 'numeric · US format',
      detail: {},
    });
  });

  it('clicking review on the banner fires onReviewAllWarnings', () => {
    const onReviewAllWarnings = vi.fn();
    renderPalette({ profiles: warningProfiles(3), onReviewAllWarnings });
    fireEvent.click(screen.getByRole('button', { name: /review/i }));
    expect(onReviewAllWarnings).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run, confirm FAIL**

```bash
pnpm --filter @variscout/ui test -- Palette
```

Expected: FAIL — no banner, no overlays, missing callbacks.

- [ ] **Step 3: Update `Palette/index.tsx`**

Rewrite `packages/ui/src/components/Canvas/EditMode/Palette/index.tsx`:

```tsx
import React, { useState } from 'react';
import type { ColumnParsingProfile, ParsingInterpretation } from '@variscout/core/parser';
import { ColumnGroup } from './ColumnGroup';
import { ColumnChipContextMenu } from './ColumnChipContextMenu';
import { ParsingOverridePopover } from './ParsingOverridePopover';
import { ParsingBanner } from './ParsingBanner';

export interface PaletteProps {
  profiles: ColumnParsingProfile[];
  numericValuesByColumn: Record<string, number[]>;
  /** Notify when a context-menu item is chosen. Routed to no-op by default. */
  onMenuItemSelect?: (columnName: string, itemId: string) => void;
  /** Notify when a user picks a different parsing interpretation. Routed to no-op by default. */
  onOverrideAccept?: (columnName: string, interpretation: ParsingInterpretation) => void;
  /** Notify when "Apply to similar" is clicked. Routed to no-op by default. */
  onApplyToSimilar?: (columnName: string, interpretation: ParsingInterpretation) => void;
  /** Notify when the aggregate-warning banner's Review button is clicked. */
  onReviewAllWarnings?: () => void;
}

type GroupKey = 'numeric' | 'categorical' | 'time-id' | 'other';

const GROUP_ORDER: ReadonlyArray<{ key: GroupKey; label: string }> = [
  { key: 'numeric', label: 'Numeric' },
  { key: 'categorical', label: 'Categorical' },
  { key: 'time-id', label: 'Time / ID' },
  { key: 'other', label: 'Other' },
];

function bucketFor(kind: ParsingInterpretation['kind'] | undefined): GroupKey {
  switch (kind) {
    case 'numeric':
      return 'numeric';
    case 'categorical':
      return 'categorical';
    case 'date':
    case 'id':
      return 'time-id';
    default:
      return 'other';
  }
}

type OpenOverlay =
  | { kind: 'menu'; columnName: string; anchor: { x: number; y: number } }
  | { kind: 'popover'; columnName: string; anchor: { x: number; y: number } };

const WARNING_BANNER_THRESHOLD = 3;

export const Palette: React.FC<PaletteProps> = ({
  profiles,
  numericValuesByColumn,
  onMenuItemSelect,
  onOverrideAccept,
  onApplyToSimilar,
  onReviewAllWarnings,
}) => {
  const [openOverlay, setOpenOverlay] = useState<OpenOverlay | null>(null);

  if (profiles.length === 0) {
    return (
      <p className="text-xs text-content-tertiary" data-testid="palette-empty">
        No columns yet — paste data to get started.
      </p>
    );
  }

  const warningCount = profiles.filter(p => p.status === 'warning').length;

  const buckets: Record<GroupKey, ColumnParsingProfile[]> = {
    numeric: [],
    categorical: [],
    'time-id': [],
    other: [],
  };
  for (const profile of profiles) {
    buckets[bucketFor(profile.primary?.kind)].push(profile);
  }

  const activeProfile = openOverlay && profiles.find(p => p.columnName === openOverlay.columnName);

  return (
    <div className="flex flex-col gap-3" data-testid="palette">
      {warningCount >= WARNING_BANNER_THRESHOLD && (
        <ParsingBanner warningCount={warningCount} onReviewAll={() => onReviewAllWarnings?.()} />
      )}

      {GROUP_ORDER.filter(({ key }) => buckets[key].length > 0).map(({ key, label }) => (
        <ColumnGroup
          key={key}
          groupKey={key}
          label={label}
          profiles={buckets[key]}
          numericValuesByColumn={numericValuesByColumn}
          onColumnOverrideOpen={(columnName, anchor) =>
            setOpenOverlay({ kind: 'popover', columnName, anchor })
          }
          onColumnContextMenuOpen={(columnName, anchor) =>
            setOpenOverlay({ kind: 'menu', columnName, anchor })
          }
        />
      ))}

      {openOverlay?.kind === 'menu' && activeProfile && (
        <ColumnChipContextMenu
          columnName={activeProfile.columnName}
          kind={activeProfile.primary?.kind ?? 'text'}
          anchor={openOverlay.anchor}
          onItemSelect={(name, itemId) => onMenuItemSelect?.(name, itemId)}
          onClose={() => setOpenOverlay(null)}
        />
      )}

      {openOverlay?.kind === 'popover' && activeProfile && (
        <ParsingOverridePopover
          columnName={activeProfile.columnName}
          profile={activeProfile}
          anchor={openOverlay.anchor}
          onChoose={(name, interpretation) => onOverrideAccept?.(name, interpretation)}
          onApplyToSimilar={(name, interpretation) => onApplyToSimilar?.(name, interpretation)}
          onClose={() => setOpenOverlay(null)}
        />
      )}
    </div>
  );
};

export default Palette;
```

Also update `ColumnGroup.tsx` to forward the anchor through its prop types:

```tsx
onColumnOverrideOpen?: (columnName: string, anchor: { x: number; y: number }) => void;
onColumnContextMenuOpen?: (columnName: string, anchor: { x: number; y: number }) => void;
```

No other ColumnGroup body change needed — it already passes the callbacks to `ColumnChip` as-is.

- [ ] **Step 4: Run, confirm PASS**

```bash
pnpm --filter @variscout/ui test -- Palette ColumnGroup ColumnChip ParsingBanner ColumnChipContextMenu ParsingOverridePopover
```

Expected: PASS — full Palette test suite green (13+ Palette tests + earlier counts).

- [ ] **Step 5: Commit**

```bash
git add packages/ui/src/components/Canvas/EditMode/Palette/index.tsx \
        packages/ui/src/components/Canvas/EditMode/Palette/ColumnGroup.tsx \
        packages/ui/src/components/Canvas/EditMode/Palette/__tests__/Palette.test.tsx
git commit -m "feat(ui): Palette wires overlays + banner with mutual exclusion"
```

---

## Task 7: EditModeShell forward callbacks + final build + open PR

**Files:**

- Modify: `packages/ui/src/components/Canvas/EditMode/EditModeShell.tsx`
- Modify: `packages/ui/src/components/Canvas/EditMode/__tests__/EditModeShell.test.tsx`

`EditModeShell`'s existing `onColumnOverrideOpen` / `onColumnContextMenuOpen` props were notification hooks for the chip-button clicks; they predate the popover/menu UI. They become OBSOLETE — Palette now owns the overlays. Replace them with the four new outbound callbacks (`onMenuItemSelect`, `onOverrideAccept`, `onApplyToSimilar`, `onReviewAllWarnings`), forwarded to `<Palette>`.

- [ ] **Step 1: Update EditModeShell tests for forwarded callbacks**

Add to `EditModeShell.test.tsx`:

```tsx
describe('EditModeShell — Palette callback forwarding', () => {
  it('forwards onMenuItemSelect from chip context menu through to the host', () => {
    const onMenuItemSelect = vi.fn();
    render(
      <DndContext>
        <EditModeShell
          onDone={() => {}}
          profiles={[
            createTestColumnParsingProfile({
              columnName: 'Speed',
              primary: { kind: 'numeric', label: 'numeric · plain', detail: {} },
            }),
          ]}
          numericValuesByColumn={{}}
          onMenuItemSelect={onMenuItemSelect}
        >
          <div />
        </EditModeShell>
      </DndContext>
    );
    fireEvent.click(screen.getByTestId('column-chip-context-button'));
    fireEvent.click(screen.getByText('Bin into categorical…'));
    expect(onMenuItemSelect).toHaveBeenCalledWith('Speed', 'bin-into-categorical');
  });
});
```

If `fireEvent` and `vi` are not already imported in the file, add them.

- [ ] **Step 2: Run, confirm FAIL**

```bash
pnpm --filter @variscout/ui test -- EditModeShell
```

Expected: FAIL — `onMenuItemSelect` not yet a prop on EditModeShell.

- [ ] **Step 3: Update `EditModeShell.tsx`**

Replace the prop interface:

```tsx
import type { ColumnParsingProfile, ParsingInterpretation } from '@variscout/core/parser';

export interface EditModeShellProps {
  onDone: () => void;
  children: React.ReactNode;
  profiles?: ColumnParsingProfile[];
  numericValuesByColumn?: Record<string, number[]>;
  /** Forwarded to the palette. Routed to no-op by default. */
  onMenuItemSelect?: (columnName: string, itemId: string) => void;
  /** Forwarded to the palette. Routed to no-op by default. */
  onOverrideAccept?: (columnName: string, interpretation: ParsingInterpretation) => void;
  /** Forwarded to the palette. Routed to no-op by default. */
  onApplyToSimilar?: (columnName: string, interpretation: ParsingInterpretation) => void;
  /** Forwarded to the palette. Routed to no-op by default. */
  onReviewAllWarnings?: () => void;
}
```

Update the component destructure + the `<Palette>` invocation:

```tsx
export const EditModeShell: React.FC<EditModeShellProps> = ({
  onDone,
  children,
  profiles = [],
  numericValuesByColumn = {},
  onMenuItemSelect,
  onOverrideAccept,
  onApplyToSimilar,
  onReviewAllWarnings,
}) => {
  return (
    // ...header + grid unchanged...
    <Palette
      profiles={profiles}
      numericValuesByColumn={numericValuesByColumn}
      onMenuItemSelect={onMenuItemSelect}
      onOverrideAccept={onOverrideAccept}
      onApplyToSimilar={onApplyToSimilar}
      onReviewAllWarnings={onReviewAllWarnings}
    />
    // ...rest unchanged...
  );
};
```

Remove the now-unused `onColumnOverrideOpen` / `onColumnContextMenuOpen` props from the EditModeShell interface — Palette owns them internally now.

- [ ] **Step 4: Run, confirm PASS**

```bash
pnpm --filter @variscout/ui test -- EditModeShell
pnpm --filter @variscout/ui test
pnpm --filter @variscout/ui build
```

All must be green. Fix any type drift the build catches.

- [ ] **Step 5: Commit**

```bash
git add packages/ui/src/components/Canvas/EditMode/EditModeShell.tsx \
        packages/ui/src/components/Canvas/EditMode/__tests__/EditModeShell.test.tsx
git commit -m "feat(ui): EditModeShell forwards palette overlay callbacks"
```

- [ ] **Step 6: Push branch and open PR**

```bash
git push -u origin feat/wedge-v1-ccj-b2-3-popover-banner-menu
gh pr create --title "feat(wedge-v1): PR-CCJ-B2.3 — Override popover + Banner + Context menu" \
  --body "$(cat <<'EOF'
## Summary

Completes the palette surface by wiring `ColumnChip`'s ▾ + ⋮ callbacks to real UI and adding the aggregate-warning banner.

- New \`ColumnChipContextMenu\` — per-kind item lists (numeric / time / categorical / id / text) per spec §3.1.2; Escape + backdrop close; auto-focus first item
- New \`ParsingOverridePopover\` — 3 transformed samples + confidence + ranked alternatives + "Apply to similar →" affordance; Escape + backdrop close
- New \`ParsingBanner\` — aggregate ⚠ trigger when ≥ 3 chips warn, with a "Review" CTA
- \`Palette\` owns the overlay state (mutual exclusion: opening one closes the other)
- \`ColumnChip\` callbacks now emit \`(columnName, anchor)\` so overlays can position relative to the button rect
- \`EditModeShell\` props refactored: \`onMenuItemSelect\` / \`onOverrideAccept\` / \`onApplyToSimilar\` / \`onReviewAllWarnings\` (the old click-only \`onColumnOverrideOpen\` / \`onColumnContextMenuOpen\` are removed since Palette now owns overlays)

All chip-menu action callbacks are no-op-routed in B2.3; D/F/G phases wire the actual handlers. Hub-memoization of user overrides remains out of scope — emitted as a typed callback only.

## Spec
- \`docs/superpowers/specs/2026-05-26-canvas-connection-journey-design.md\` §3.1.1, §3.1.2
- Sequencer: \`docs/superpowers/plans/2026-05-27-canvas-connection-journey-b2-master-plan.md\`
- Sub-plan: \`docs/superpowers/plans/2026-05-27-canvas-connection-journey-b2-3-popover-banner-menu.md\`

## Test plan
- [x] \`pnpm --filter @variscout/ui test\` green
- [x] \`pnpm --filter @variscout/ui build\` green
- [ ] \`bash scripts/pr-ready-check.sh\` (controller will run pre-merge)
- [ ] Final Opus branch review (controller will dispatch)

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

Report PR URL.

---

## Verification (B2.3 completion)

After the PR opens:

1. `bash scripts/pr-ready-check.sh` — full pre-merge gauntlet green
2. Final Opus branch reviewer with STEP 0 git checkout
3. Merge with `gh pr merge --merge --delete-branch` (per `feedback_preserve_commit_history`)
4. Update `[[canvas-connection-journey]]` memory with B2.3 outcomes + flag whole B2 as DONE
5. Mark task #26 (`PR-CCJ-B2`) completed in the task list
6. Worktree cleanup: `git worktree remove .worktrees/feat/wedge-v1-ccj-b2-3-popover-banner-menu && git branch -d feat/wedge-v1-ccj-b2-3-popover-banner-menu`

## Out of scope (B2.3)

Deferred to C-phase or later:

- Hub-memoization of user parsing overrides (popover emits callback only)
- Real menu-item destinations (`Bin into categorical…` → Explore + Probability Plot binning is F1/G1)
- Real "Apply to similar" matching algorithm
- `Rename column…` UI
- `Combine levels…` UI (V2+)
- Viewport clamping on the menu/popover (B2.3 trusts caller-provided anchor; will revisit if real overflow surfaces)
- Focus trap inside the popover (uses outside-click + Escape; menu uses auto-focus on first item per `EvidenceMapContextMenu` pattern)

## Related

- [B2 master sequencer](./2026-05-27-canvas-connection-journey-b2-master-plan.md)
- [B2.2 sub-plan](./2026-05-27-canvas-connection-journey-b2-2-column-chip-palette.md)
- [Canvas Connection Journey spec](../specs/2026-05-26-canvas-connection-journey-design.md) §3.1.1, §3.1.2
- [[canvas-connection-journey]], [[wedge-v1]], [[feedback_subagent_driven_default]], [[feedback_slice_size_cap]], [[feedback_one_worktree_per_agent]], [[feedback_preserve_commit_history]], [[feedback_ui_build_before_merge]]
- `packages/ui/src/components/EvidenceMapContextMenu/NodeContextMenu.tsx` — pattern reference for fixed-position menus
