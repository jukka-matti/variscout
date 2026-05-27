---
tier: ephemeral
purpose: build
title: PR-CCJ-B2.2 — ColumnChip + Palette primitive (UI) — Implementation Plan
status: active
date: 2026-05-27
layer: spec
---

# PR-CCJ-B2.2 — ColumnChip + Palette primitive (UI) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax. **Right-size models** per `feedback_subagent_driven_default`: Tasks 1, 6 are mechanical (Haiku); Tasks 2-5, 7-8 are standard TDD (Sonnet); final branch reviewer is Opus.

**Spec being implemented:** [`docs/superpowers/specs/2026-05-26-canvas-connection-journey-design.md`](../specs/2026-05-26-canvas-connection-journey-design.md) §3.1 (Palette zone) + §4.1 (Visual design tokens). §3.1.1 + §3.1.2 (popover + context-menu UI) are wired-but-stubbed; the actual popover/menu UI lands in B2.3.

**Parent sequencer:** [`2026-05-27-canvas-connection-journey-b2-master-plan.md`](./2026-05-27-canvas-connection-journey-b2-master-plan.md)

**Goal:** Render the palette zone of `EditModeShell` by consuming B2.1's `ColumnParsingProfile[]` contract. Output: grouped, draggable `ColumnChip` primitives with parsing badges + interpretation text + numeric sparklines + stubbed `▾` / `⋮` callbacks.

**Architecture:** New folder `packages/ui/src/components/Canvas/EditMode/Palette/` containing `ColumnChip`, `ColumnGroup`, `Palette` (index), and a small `encodeColumnDragId` codec. Drag is `@dnd-kit/core` `useDraggable` (repo convention). Sparkline is an inline 24-bar SVG histogram local to `ColumnChip` (precedent: `ColumnCandidateChip.tsx`). All visual state is prop-driven for testability — real drop-zone logic + ghost-suggestion heuristics ship in Phase C / F.

**Tech Stack:** React 18, TypeScript strict, Tailwind v4, `@dnd-kit/core` (already in `packages/ui/package.json`), Vitest + happy-dom test pool (per `packages/ui/CLAUDE.md` testing rules).

**Branch:** `feat/wedge-v1-ccj-b2-2-column-chip` off main (currently at PR #219 merge `cd56261a`).

---

## File structure (locked decisions)

**Create:**

- `packages/ui/src/test-utils/columnParsingProfile.ts` — `createTestColumnParsingProfile(overrides?)` factory
- `packages/ui/src/components/Canvas/EditMode/Palette/encodeColumnDragId.ts` — `encode` + `decode` pair, prefix `column:`
- `packages/ui/src/components/Canvas/EditMode/Palette/ColumnChip.tsx` — single chip
- `packages/ui/src/components/Canvas/EditMode/Palette/ColumnGroup.tsx` — grouped section
- `packages/ui/src/components/Canvas/EditMode/Palette/index.tsx` — `Palette` container
- `packages/ui/src/components/Canvas/EditMode/Palette/__tests__/columnParsingProfileFactory.test.ts`
- `packages/ui/src/components/Canvas/EditMode/Palette/__tests__/encodeColumnDragId.test.ts`
- `packages/ui/src/components/Canvas/EditMode/Palette/__tests__/ColumnChip.test.tsx`
- `packages/ui/src/components/Canvas/EditMode/Palette/__tests__/ColumnGroup.test.tsx`
- `packages/ui/src/components/Canvas/EditMode/Palette/__tests__/Palette.test.tsx`

**Modify:**

- `packages/ui/src/components/Canvas/EditMode/EditModeShell.tsx` — accept optional `profiles?` + `numericValuesByColumn?` + callback props; replace the palette-zone placeholder paragraph with `<Palette>`
- `packages/ui/src/components/Canvas/EditMode/__tests__/EditModeShell.test.tsx` — add wiring assertion

**Out of scope (do NOT touch):**

- `packages/ui/src/components/ColumnCandidateChip/` (legacy chip stays untouched; consumes `ColumnAnalysis.name`, not `ColumnParsingProfile.columnName`)
- `packages/core/src/parser/**` (B2.1 contract is locked; no shape changes)
- The Outcomes-Factors zone + Process zone of EditModeShell (Phase C)

---

## Pre-implementation setup

- [ ] **Step 0a: Create worktree + branch**

```bash
git fetch origin
git worktree add .worktrees/feat/wedge-v1-ccj-b2-2-column-chip -b feat/wedge-v1-ccj-b2-2-column-chip origin/main
cd .worktrees/feat/wedge-v1-ccj-b2-2-column-chip
pnpm install --frozen-lockfile
```

Expected: clean worktree on the new branch at `cd56261a`.

- [ ] **Step 0b: Confirm baseline tests pass**

```bash
pnpm --filter @variscout/ui test
```

Expected: PASS (snapshot of pre-change green baseline). Note the elapsed time — subsequent test runs target individual files only to stay fast (`pnpm --filter @variscout/ui test -- <pattern>`).

---

## Task 1: Test factory `createTestColumnParsingProfile`

**Files:**

- Create: `packages/ui/src/test-utils/columnParsingProfile.ts`
- Test: `packages/ui/src/components/Canvas/EditMode/Palette/__tests__/columnParsingProfileFactory.test.ts`

- [ ] **Step 1: Write the failing factory test**

```typescript
// columnParsingProfileFactory.test.ts
import { describe, it, expect } from 'vitest';
import type { ColumnParsingProfile } from '@variscout/core/parser';
import { createTestColumnParsingProfile } from '../../../../../test-utils/columnParsingProfile';

describe('createTestColumnParsingProfile', () => {
  it('returns a valid ColumnParsingProfile with defaults', () => {
    const profile: ColumnParsingProfile = createTestColumnParsingProfile();
    expect(profile.columnName).toBe('Column');
    expect(profile.status).toBe('ok');
    expect(profile.confidence).toBe(100);
    expect(profile.primary).toEqual({
      kind: 'numeric',
      label: 'numeric · plain',
      detail: {},
    });
    expect(profile.alternatives).toEqual([]);
    expect(profile.transformedSamples).toHaveLength(0);
  });

  it('applies overrides on top of defaults', () => {
    const profile = createTestColumnParsingProfile({
      columnName: 'Defects',
      status: 'warning',
      confidence: 65,
    });
    expect(profile.columnName).toBe('Defects');
    expect(profile.status).toBe('warning');
    expect(profile.confidence).toBe(65);
    expect(profile.primary?.kind).toBe('numeric');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pnpm --filter @variscout/ui test -- columnParsingProfileFactory
```

Expected: FAIL — `Cannot find module '.../test-utils/columnParsingProfile'`.

- [ ] **Step 3: Implement the factory**

Create `packages/ui/src/test-utils/columnParsingProfile.ts`:

```typescript
import type { ColumnParsingProfile } from '@variscout/core/parser';

export function createTestColumnParsingProfile(
  overrides: Partial<ColumnParsingProfile> = {}
): ColumnParsingProfile {
  return {
    columnName: 'Column',
    status: 'ok',
    confidence: 100,
    primary: { kind: 'numeric', label: 'numeric · plain', detail: {} },
    alternatives: [],
    transformedSamples: [],
    ...overrides,
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
pnpm --filter @variscout/ui test -- columnParsingProfileFactory
```

Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add packages/ui/src/test-utils/columnParsingProfile.ts \
        packages/ui/src/components/Canvas/EditMode/Palette/__tests__/columnParsingProfileFactory.test.ts
git commit -m "test(ui): add createTestColumnParsingProfile factory"
```

---

## Task 2: `encodeColumnDragId` codec

**Files:**

- Create: `packages/ui/src/components/Canvas/EditMode/Palette/encodeColumnDragId.ts`
- Test: `packages/ui/src/components/Canvas/EditMode/Palette/__tests__/encodeColumnDragId.test.ts`

- [ ] **Step 1: Write the failing codec tests**

```typescript
// encodeColumnDragId.test.ts
import { describe, it, expect } from 'vitest';
import { encodeColumnDragId, decodeColumnDragId, isColumnDragId } from '../encodeColumnDragId';

describe('encodeColumnDragId', () => {
  it('round-trips a simple column name', () => {
    const id = encodeColumnDragId('Speed');
    expect(id).toBe('column:Speed');
    expect(decodeColumnDragId(id)).toBe('Speed');
  });

  it('round-trips a column name with spaces', () => {
    const id = encodeColumnDragId('Lead time (h)');
    expect(decodeColumnDragId(id)).toBe('Lead time (h)');
  });

  it('isColumnDragId returns true for column ids and false for others', () => {
    expect(isColumnDragId('column:Speed')).toBe(true);
    expect(isColumnDragId('chip:abc-123')).toBe(false);
    expect(isColumnDragId('Speed')).toBe(false);
  });

  it('decodeColumnDragId returns null for non-column ids', () => {
    expect(decodeColumnDragId('chip:abc-123')).toBeNull();
    expect(decodeColumnDragId('Speed')).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pnpm --filter @variscout/ui test -- encodeColumnDragId
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement the codec**

Create `packages/ui/src/components/Canvas/EditMode/Palette/encodeColumnDragId.ts`:

```typescript
const PREFIX = 'column:';

export function encodeColumnDragId(columnName: string): string {
  return `${PREFIX}${columnName}`;
}

export function isColumnDragId(value: unknown): value is `column:${string}` {
  return typeof value === 'string' && value.startsWith(PREFIX);
}

export function decodeColumnDragId(value: string): string | null {
  if (!isColumnDragId(value)) return null;
  return value.slice(PREFIX.length);
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
pnpm --filter @variscout/ui test -- encodeColumnDragId
```

Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add packages/ui/src/components/Canvas/EditMode/Palette/encodeColumnDragId.ts \
        packages/ui/src/components/Canvas/EditMode/Palette/__tests__/encodeColumnDragId.test.ts
git commit -m "feat(ui): add encodeColumnDragId codec for palette dnd-kit ids"
```

---

## Task 3: `ColumnChip` base render — name + interpretation + status badge

**Files:**

- Create: `packages/ui/src/components/Canvas/EditMode/Palette/ColumnChip.tsx`
- Test: `packages/ui/src/components/Canvas/EditMode/Palette/__tests__/ColumnChip.test.tsx`

- [ ] **Step 1: Write the failing base-render tests**

```tsx
// ColumnChip.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DndContext } from '@dnd-kit/core';
import { ColumnChip } from '../ColumnChip';
import { createTestColumnParsingProfile } from '../../../../../test-utils/columnParsingProfile';

const renderChip = (props: Partial<React.ComponentProps<typeof ColumnChip>> = {}) =>
  render(
    <DndContext>
      <ColumnChip profile={createTestColumnParsingProfile()} {...props} />
    </DndContext>
  );

describe('ColumnChip — base render', () => {
  it('renders the columnName', () => {
    renderChip({ profile: createTestColumnParsingProfile({ columnName: 'Speed' }) });
    expect(screen.getByText('Speed')).toBeInTheDocument();
  });

  it('renders the primary.label interpretation line', () => {
    renderChip({
      profile: createTestColumnParsingProfile({
        primary: { kind: 'numeric', label: 'numeric · EU decimal', detail: {} },
      }),
    });
    expect(screen.getByText('numeric · EU decimal')).toBeInTheDocument();
  });

  it('renders ✓ badge for status=ok', () => {
    renderChip({ profile: createTestColumnParsingProfile({ status: 'ok' }) });
    expect(screen.getByTestId('column-chip-badge')).toHaveTextContent('✓');
  });

  it('renders ⚠ badge for status=warning', () => {
    renderChip({ profile: createTestColumnParsingProfile({ status: 'warning' }) });
    expect(screen.getByTestId('column-chip-badge')).toHaveTextContent('⚠');
  });

  it('renders ✗ badge for status=error', () => {
    renderChip({
      profile: createTestColumnParsingProfile({ status: 'error', primary: null }),
    });
    expect(screen.getByTestId('column-chip-badge')).toHaveTextContent('✗');
  });

  it('renders a fallback interpretation line when primary is null', () => {
    renderChip({
      profile: createTestColumnParsingProfile({ status: 'error', primary: null }),
    });
    expect(screen.getByText(/parse failed/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pnpm --filter @variscout/ui test -- ColumnChip
```

Expected: FAIL — `Cannot find module '../ColumnChip'`.

- [ ] **Step 3: Implement minimal `ColumnChip`**

Create `packages/ui/src/components/Canvas/EditMode/Palette/ColumnChip.tsx`:

```tsx
import React from 'react';
import type { ColumnParsingProfile, ParsingStatus } from '@variscout/core/parser';

export interface ColumnChipProps {
  profile: ColumnParsingProfile;
  /** Optional raw numeric values for the sparkline (numeric kind only). Plumbed by Palette. */
  numericValues?: number[];
  /** Visual state: chip has been dropped into a zone or step (faded). */
  dropped?: boolean;
  /** Visual state: system is suggesting a role for this chip. */
  ghostSuggested?: 'factor' | 'outcome' | 'process';
  /** Called when the ▾ button is clicked. Popover UI lands in B2.3. */
  onOverrideOpen?: (columnName: string) => void;
  /** Called when the ⋮ button is clicked. Context-menu UI lands in B2.3. */
  onContextMenuOpen?: (columnName: string) => void;
}

const BADGE_BY_STATUS: Record<ParsingStatus, { icon: string; classes: string }> = {
  ok: { icon: '✓', classes: 'text-green-700 bg-green-50' },
  warning: { icon: '⚠', classes: 'text-amber-700 bg-amber-50' },
  error: { icon: '✗', classes: 'text-red-700 bg-red-50' },
};

export const ColumnChip: React.FC<ColumnChipProps> = ({ profile }) => {
  const badge = BADGE_BY_STATUS[profile.status];
  const interpretationLabel = profile.primary?.label ?? 'parse failed';

  return (
    <div
      data-testid="column-chip"
      className="flex items-center gap-2 rounded-md border border-edge bg-surface-primary px-2 py-1.5"
    >
      <span
        data-testid="column-chip-badge"
        className={`inline-flex h-4 w-4 items-center justify-center rounded text-xs ${badge.classes}`}
        aria-label={`Parsing status: ${profile.status}`}
      >
        {badge.icon}
      </span>
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-xs font-medium text-content">{profile.columnName}</span>
        <span className="truncate text-[10px] text-content-tertiary">{interpretationLabel}</span>
      </div>
    </div>
  );
};

export default ColumnChip;
```

- [ ] **Step 4: Run test to verify it passes**

```bash
pnpm --filter @variscout/ui test -- ColumnChip
```

Expected: PASS (6 tests).

- [ ] **Step 5: Commit**

```bash
git add packages/ui/src/components/Canvas/EditMode/Palette/ColumnChip.tsx \
        packages/ui/src/components/Canvas/EditMode/Palette/__tests__/ColumnChip.test.tsx
git commit -m "feat(ui): ColumnChip base render with parsing badge"
```

---

## Task 4: `ColumnChip` drag handle (dnd-kit)

**Files:**

- Modify: `packages/ui/src/components/Canvas/EditMode/Palette/ColumnChip.tsx`
- Modify: `packages/ui/src/components/Canvas/EditMode/Palette/__tests__/ColumnChip.test.tsx`

- [ ] **Step 1: Write the failing drag tests**

Append to `ColumnChip.test.tsx`:

```tsx
import { encodeColumnDragId } from '../encodeColumnDragId';

describe('ColumnChip — drag handle', () => {
  it('renders a drag handle with cursor-grab', () => {
    renderChip();
    const handle = screen.getByTestId('column-chip-drag-handle');
    expect(handle.className).toMatch(/cursor-grab/);
    expect(handle).toHaveTextContent('⋮⋮');
  });

  it('exposes a draggable element with the encoded column id', () => {
    renderChip({ profile: createTestColumnParsingProfile({ columnName: 'Speed' }) });
    const draggable = screen.getByTestId('column-chip');
    expect(draggable.getAttribute('data-draggable-id')).toBe(encodeColumnDragId('Speed'));
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pnpm --filter @variscout/ui test -- ColumnChip
```

Expected: FAIL — `column-chip-drag-handle` not found; `data-draggable-id` missing.

- [ ] **Step 3: Wire `useDraggable` and render the handle**

Update `ColumnChip.tsx`:

```tsx
import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import type { ColumnParsingProfile, ParsingStatus } from '@variscout/core/parser';
import { encodeColumnDragId } from './encodeColumnDragId';

// ...props + BADGE_BY_STATUS unchanged...

export const ColumnChip: React.FC<ColumnChipProps> = ({ profile }) => {
  const draggableId = encodeColumnDragId(profile.columnName);
  const { attributes, listeners, setNodeRef, transform } = useDraggable({ id: draggableId });
  const badge = BADGE_BY_STATUS[profile.status];
  const interpretationLabel = profile.primary?.label ?? 'parse failed';

  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      data-testid="column-chip"
      data-draggable-id={draggableId}
      className="flex items-center gap-2 rounded-md border border-edge bg-surface-primary px-2 py-1.5"
    >
      <button
        type="button"
        data-testid="column-chip-drag-handle"
        className="cursor-grab text-xs text-content-tertiary"
        aria-label={`Drag ${profile.columnName}`}
        {...attributes}
        {...listeners}
      >
        ⋮⋮
      </button>
      <span
        data-testid="column-chip-badge"
        className={`inline-flex h-4 w-4 items-center justify-center rounded text-xs ${badge.classes}`}
        aria-label={`Parsing status: ${profile.status}`}
      >
        {badge.icon}
      </span>
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-xs font-medium text-content">{profile.columnName}</span>
        <span className="truncate text-[10px] text-content-tertiary">{interpretationLabel}</span>
      </div>
    </div>
  );
};
```

- [ ] **Step 4: Run test to verify it passes**

```bash
pnpm --filter @variscout/ui test -- ColumnChip
```

Expected: PASS (8 tests total).

- [ ] **Step 5: Commit**

```bash
git add packages/ui/src/components/Canvas/EditMode/Palette/ColumnChip.tsx \
        packages/ui/src/components/Canvas/EditMode/Palette/__tests__/ColumnChip.test.tsx
git commit -m "feat(ui): ColumnChip drag handle via dnd-kit useDraggable"
```

---

## Task 5: `ColumnChip` affordances + visual states (`▾`, `⋮`, dropped, ghost)

Bundled because each sub-feature is small and they share the same render path.

**Files:**

- Modify: `ColumnChip.tsx`
- Modify: `__tests__/ColumnChip.test.tsx`

- [ ] **Step 1: Write the failing affordance + state tests**

Append to `ColumnChip.test.tsx`:

```tsx
import { fireEvent } from '@testing-library/react';
import { vi } from 'vitest';

describe('ColumnChip — affordances', () => {
  it('renders the ▾ override button and fires onOverrideOpen with columnName', () => {
    const onOverrideOpen = vi.fn();
    renderChip({
      profile: createTestColumnParsingProfile({ columnName: 'Speed' }),
      onOverrideOpen,
    });
    fireEvent.click(screen.getByTestId('column-chip-override-button'));
    expect(onOverrideOpen).toHaveBeenCalledWith('Speed');
  });

  it('renders the ⋮ context button and fires onContextMenuOpen with columnName', () => {
    const onContextMenuOpen = vi.fn();
    renderChip({
      profile: createTestColumnParsingProfile({ columnName: 'Speed' }),
      onContextMenuOpen,
    });
    fireEvent.click(screen.getByTestId('column-chip-context-button'));
    expect(onContextMenuOpen).toHaveBeenCalledWith('Speed');
  });
});

describe('ColumnChip — visual states', () => {
  it('applies dropped styling when dropped=true', () => {
    renderChip({ dropped: true });
    const chip = screen.getByTestId('column-chip');
    expect(chip.className).toMatch(/opacity-50/);
    expect(chip.className).toMatch(/bg-surface-secondary/);
  });

  it('applies ghost-suggested styling and hint pill', () => {
    renderChip({ ghostSuggested: 'factor' });
    const chip = screen.getByTestId('column-chip');
    expect(chip.className).toMatch(/border-dashed/);
    expect(chip.className).toMatch(/border-cyan-400/);
    expect(screen.getByTestId('column-chip-hint-pill')).toHaveTextContent(/factor\?/i);
  });

  it('renders different hint pill copy per ghost role', () => {
    const { rerender } = renderChip({ ghostSuggested: 'outcome' });
    expect(screen.getByTestId('column-chip-hint-pill')).toHaveTextContent(/outcome\?/i);
    rerender(
      <DndContext>
        <ColumnChip profile={createTestColumnParsingProfile()} ghostSuggested="process" />
      </DndContext>
    );
    expect(screen.getByTestId('column-chip-hint-pill')).toHaveTextContent(/process\?/i);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pnpm --filter @variscout/ui test -- ColumnChip
```

Expected: FAIL.

- [ ] **Step 3: Implement buttons + state classes**

Update `ColumnChip.tsx` — add buttons in the render output (after the name/label column) and compose the chip's outer className conditionally:

```tsx
const chipClasses = [
  'flex items-center gap-2 rounded-md border bg-surface-primary px-2 py-1.5',
  dropped ? 'opacity-50 bg-surface-secondary border-edge' : '',
  ghostSuggested ? 'border-2 border-dashed border-cyan-400' : 'border-edge',
]
  .filter(Boolean)
  .join(' ');

// ...

return (
  <div
    ref={setNodeRef}
    style={style}
    data-testid="column-chip"
    data-draggable-id={draggableId}
    className={chipClasses}
  >
    {/* drag handle, badge, label column unchanged */}

    {ghostSuggested && (
      <span
        data-testid="column-chip-hint-pill"
        className="rounded-full bg-cyan-50 px-1.5 py-0.5 text-[10px] text-cyan-700"
      >
        {ghostSuggested}?
      </span>
    )}

    <button
      type="button"
      data-testid="column-chip-override-button"
      className="text-xs text-content-tertiary hover:text-content"
      aria-label={`Override parsing for ${profile.columnName}`}
      onClick={() => onOverrideOpen?.(profile.columnName)}
    >
      ▾
    </button>
    <button
      type="button"
      data-testid="column-chip-context-button"
      className="text-xs text-content-tertiary hover:text-content"
      aria-label={`Open context menu for ${profile.columnName}`}
      onClick={() => onContextMenuOpen?.(profile.columnName)}
    >
      ⋮
    </button>
  </div>
);
```

Make sure to destructure `dropped`, `ghostSuggested`, `onOverrideOpen`, `onContextMenuOpen` in the props signature.

- [ ] **Step 4: Run test to verify it passes**

```bash
pnpm --filter @variscout/ui test -- ColumnChip
```

Expected: PASS (13 tests total).

- [ ] **Step 5: Commit**

```bash
git add packages/ui/src/components/Canvas/EditMode/Palette/ColumnChip.tsx \
        packages/ui/src/components/Canvas/EditMode/Palette/__tests__/ColumnChip.test.tsx
git commit -m "feat(ui): ColumnChip override/context buttons + dropped/ghost states"
```

---

## Task 6: `ColumnChip` numeric sparkline

**Files:**

- Modify: `ColumnChip.tsx`
- Modify: `__tests__/ColumnChip.test.tsx`

- [ ] **Step 1: Write the failing sparkline tests**

```tsx
describe('ColumnChip — sparkline', () => {
  it('renders a sparkline SVG for numeric kind when numericValues provided', () => {
    renderChip({
      profile: createTestColumnParsingProfile({
        primary: { kind: 'numeric', label: 'numeric · plain', detail: {} },
      }),
      numericValues: [1, 2, 3, 4, 5, 6, 7, 8],
    });
    const sparkline = screen.getByTestId('column-chip-sparkline');
    expect(sparkline.tagName.toLowerCase()).toBe('svg');
    expect(sparkline.querySelectorAll('rect').length).toBeGreaterThan(0);
  });

  it('does not render a sparkline for categorical kind', () => {
    renderChip({
      profile: createTestColumnParsingProfile({
        primary: { kind: 'categorical', label: 'categorical · 4 levels', detail: {} },
      }),
      numericValues: [1, 2, 3],
    });
    expect(screen.queryByTestId('column-chip-sparkline')).toBeNull();
  });

  it('renders a placeholder when numeric kind has no numericValues', () => {
    renderChip({
      profile: createTestColumnParsingProfile({
        primary: { kind: 'numeric', label: 'numeric · plain', detail: {} },
      }),
    });
    expect(screen.getByTestId('column-chip-sparkline-placeholder')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pnpm --filter @variscout/ui test -- ColumnChip
```

Expected: FAIL.

- [ ] **Step 3: Implement inline `NumericSparkline`**

In the same `ColumnChip.tsx` file, add a local helper component (do NOT export):

```tsx
const SPARK_WIDTH = 60;
const SPARK_HEIGHT = 24;
const SPARK_BARS = 24;

function binValues(values: number[], binCount: number): number[] {
  const finite = values.filter(v => Number.isFinite(v));
  if (finite.length === 0) return [];
  const min = Math.min(...finite);
  const max = Math.max(...finite);
  if (min === max) return [finite.length];
  const counts = new Array(binCount).fill(0);
  const range = max - min;
  for (const v of finite) {
    const idx = Math.min(binCount - 1, Math.floor(((v - min) / range) * binCount));
    counts[idx] += 1;
  }
  return counts;
}

const NumericSparkline: React.FC<{ values: number[] }> = ({ values }) => {
  const bins = binValues(values, SPARK_BARS);
  if (bins.length === 0) {
    return (
      <span
        data-testid="column-chip-sparkline-placeholder"
        className="text-[10px] text-content-tertiary"
      >
        no data
      </span>
    );
  }
  const peak = Math.max(...bins);
  const barWidth = SPARK_WIDTH / bins.length;
  return (
    <svg
      data-testid="column-chip-sparkline"
      width={SPARK_WIDTH}
      height={SPARK_HEIGHT}
      role="presentation"
      className="text-content-tertiary"
    >
      {bins.map((count, i) => {
        const h = peak === 0 ? 0 : (count / peak) * SPARK_HEIGHT;
        return (
          <rect
            key={i}
            x={i * barWidth}
            y={SPARK_HEIGHT - h}
            width={Math.max(0, barWidth - 1)}
            height={h}
            fill="currentColor"
            opacity={0.6}
          />
        );
      })}
    </svg>
  );
};
```

Then in `ColumnChip`'s JSX, between the label column and the override/context buttons:

```tsx
{
  profile.primary?.kind === 'numeric' &&
    (numericValues && numericValues.length > 0 ? (
      <NumericSparkline values={numericValues} />
    ) : (
      <span
        data-testid="column-chip-sparkline-placeholder"
        className="text-[10px] text-content-tertiary"
      >
        no data
      </span>
    ));
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
pnpm --filter @variscout/ui test -- ColumnChip
```

Expected: PASS (16 tests total).

- [ ] **Step 5: Commit**

```bash
git add packages/ui/src/components/Canvas/EditMode/Palette/ColumnChip.tsx \
        packages/ui/src/components/Canvas/EditMode/Palette/__tests__/ColumnChip.test.tsx
git commit -m "feat(ui): ColumnChip numeric sparkline (inline SVG histogram)"
```

---

## Task 7: `ColumnGroup` + `Palette` container (grouping by kind)

**Files:**

- Create: `ColumnGroup.tsx`
- Create: `index.tsx` (Palette container)
- Create: `__tests__/ColumnGroup.test.tsx`
- Create: `__tests__/Palette.test.tsx`

- [ ] **Step 1: Write the failing ColumnGroup test**

```tsx
// ColumnGroup.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DndContext } from '@dnd-kit/core';
import { ColumnGroup } from '../ColumnGroup';
import { createTestColumnParsingProfile } from '../../../../../test-utils/columnParsingProfile';

describe('ColumnGroup', () => {
  it('renders the label with the count and one chip per profile', () => {
    const profiles = [
      createTestColumnParsingProfile({ columnName: 'A' }),
      createTestColumnParsingProfile({ columnName: 'B' }),
      createTestColumnParsingProfile({ columnName: 'C' }),
    ];
    render(
      <DndContext>
        <ColumnGroup
          groupKey="numeric"
          label="Numeric"
          profiles={profiles}
          numericValuesByColumn={{}}
        />
      </DndContext>
    );
    expect(screen.getByText('Numeric · 3')).toBeInTheDocument();
    expect(screen.getByTestId('palette-group-numeric')).toBeInTheDocument();
    expect(screen.getAllByTestId('column-chip')).toHaveLength(3);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pnpm --filter @variscout/ui test -- ColumnGroup
```

Expected: FAIL.

- [ ] **Step 3: Implement `ColumnGroup`**

Create `ColumnGroup.tsx`:

```tsx
import React from 'react';
import type { ColumnParsingProfile } from '@variscout/core/parser';
import { ColumnChip } from './ColumnChip';

export interface ColumnGroupProps {
  groupKey: 'numeric' | 'categorical' | 'time-id' | 'other';
  label: string;
  profiles: ColumnParsingProfile[];
  numericValuesByColumn: Record<string, number[]>;
  onColumnOverrideOpen?: (columnName: string) => void;
  onColumnContextMenuOpen?: (columnName: string) => void;
}

export const ColumnGroup: React.FC<ColumnGroupProps> = ({
  groupKey,
  label,
  profiles,
  numericValuesByColumn,
  onColumnOverrideOpen,
  onColumnContextMenuOpen,
}) => {
  return (
    <section data-testid={`palette-group-${groupKey}`} className="flex flex-col gap-1.5">
      <h4 className="text-[10px] font-semibold uppercase tracking-wide text-content-tertiary">
        {label} · {profiles.length}
      </h4>
      <div className="flex flex-col gap-1">
        {profiles.map(profile => (
          <ColumnChip
            key={profile.columnName}
            profile={profile}
            numericValues={numericValuesByColumn[profile.columnName]}
            onOverrideOpen={onColumnOverrideOpen}
            onContextMenuOpen={onColumnContextMenuOpen}
          />
        ))}
      </div>
    </section>
  );
};

export default ColumnGroup;
```

- [ ] **Step 4: Write the failing Palette test**

```tsx
// Palette.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DndContext } from '@dnd-kit/core';
import { Palette } from '../index';
import { createTestColumnParsingProfile } from '../../../../../test-utils/columnParsingProfile';

const renderPalette = (props: Partial<React.ComponentProps<typeof Palette>>) =>
  render(
    <DndContext>
      <Palette profiles={[]} numericValuesByColumn={{}} {...props} />
    </DndContext>
  );

describe('Palette', () => {
  it('renders groups in canonical order: numeric → categorical → time-id → other', () => {
    renderPalette({
      profiles: [
        createTestColumnParsingProfile({
          columnName: 'Notes',
          primary: { kind: 'text', label: 'text', detail: {} },
        }),
        createTestColumnParsingProfile({
          columnName: 'Date',
          primary: { kind: 'date', label: 'ISO date (YYYY-MM-DD)', detail: {} },
        }),
        createTestColumnParsingProfile({
          columnName: 'Speed',
          primary: { kind: 'numeric', label: 'numeric · plain', detail: {} },
        }),
        createTestColumnParsingProfile({
          columnName: 'Line',
          primary: { kind: 'categorical', label: 'categorical · 2 levels', detail: {} },
        }),
      ],
    });
    const groups = screen.getAllByTestId(/^palette-group-/);
    expect(groups.map(g => g.getAttribute('data-testid'))).toEqual([
      'palette-group-numeric',
      'palette-group-categorical',
      'palette-group-time-id',
      'palette-group-other',
    ]);
  });

  it('groups date + id kinds together under Time / ID', () => {
    renderPalette({
      profiles: [
        createTestColumnParsingProfile({
          columnName: 'BatchId',
          primary: { kind: 'id', label: 'id · 5 unique', detail: {} },
        }),
        createTestColumnParsingProfile({
          columnName: 'ShipDate',
          primary: { kind: 'date', label: 'DD/MM/YYYY', detail: {} },
        }),
      ],
    });
    const timeIdGroup = screen.getByTestId('palette-group-time-id');
    expect(timeIdGroup).toHaveTextContent('Time / ID · 2');
  });

  it('omits empty groups', () => {
    renderPalette({
      profiles: [
        createTestColumnParsingProfile({
          columnName: 'Speed',
          primary: { kind: 'numeric', label: 'numeric · plain', detail: {} },
        }),
      ],
    });
    expect(screen.queryByTestId('palette-group-categorical')).toBeNull();
    expect(screen.queryByTestId('palette-group-time-id')).toBeNull();
    expect(screen.queryByTestId('palette-group-other')).toBeNull();
  });

  it('renders an empty-state hint when profiles is empty', () => {
    renderPalette({ profiles: [] });
    expect(screen.getByText(/no columns yet/i)).toBeInTheDocument();
  });

  it('passes numericValuesByColumn through to chips', () => {
    renderPalette({
      profiles: [
        createTestColumnParsingProfile({
          columnName: 'Speed',
          primary: { kind: 'numeric', label: 'numeric · plain', detail: {} },
        }),
      ],
      numericValuesByColumn: { Speed: [1, 2, 3, 4, 5] },
    });
    expect(screen.getByTestId('column-chip-sparkline')).toBeInTheDocument();
  });
});
```

- [ ] **Step 5: Run test to verify it fails**

```bash
pnpm --filter @variscout/ui test -- Palette
```

Expected: FAIL.

- [ ] **Step 6: Implement `Palette`**

Create `index.tsx`:

```tsx
import React from 'react';
import type { ColumnParsingProfile, ParsingInterpretation } from '@variscout/core/parser';
import { ColumnGroup } from './ColumnGroup';

export interface PaletteProps {
  profiles: ColumnParsingProfile[];
  numericValuesByColumn: Record<string, number[]>;
  onColumnOverrideOpen?: (columnName: string) => void;
  onColumnContextMenuOpen?: (columnName: string) => void;
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

export const Palette: React.FC<PaletteProps> = ({
  profiles,
  numericValuesByColumn,
  onColumnOverrideOpen,
  onColumnContextMenuOpen,
}) => {
  if (profiles.length === 0) {
    return (
      <p className="text-xs text-content-tertiary" data-testid="palette-empty">
        No columns yet — paste data to get started.
      </p>
    );
  }

  const buckets: Record<GroupKey, ColumnParsingProfile[]> = {
    numeric: [],
    categorical: [],
    'time-id': [],
    other: [],
  };
  for (const profile of profiles) {
    buckets[bucketFor(profile.primary?.kind)].push(profile);
  }

  return (
    <div className="flex flex-col gap-3" data-testid="palette">
      {GROUP_ORDER.filter(({ key }) => buckets[key].length > 0).map(({ key, label }) => (
        <ColumnGroup
          key={key}
          groupKey={key}
          label={label}
          profiles={buckets[key]}
          numericValuesByColumn={numericValuesByColumn}
          onColumnOverrideOpen={onColumnOverrideOpen}
          onColumnContextMenuOpen={onColumnContextMenuOpen}
        />
      ))}
    </div>
  );
};

export default Palette;
```

- [ ] **Step 7: Run test to verify it passes**

```bash
pnpm --filter @variscout/ui test -- ColumnGroup Palette ColumnChip
```

Expected: PASS (full Palette suite).

- [ ] **Step 8: Commit**

```bash
git add packages/ui/src/components/Canvas/EditMode/Palette/ColumnGroup.tsx \
        packages/ui/src/components/Canvas/EditMode/Palette/index.tsx \
        packages/ui/src/components/Canvas/EditMode/Palette/__tests__/ColumnGroup.test.tsx \
        packages/ui/src/components/Canvas/EditMode/Palette/__tests__/Palette.test.tsx
git commit -m "feat(ui): ColumnGroup + Palette container with kind grouping"
```

---

## Task 8: Wire `Palette` into `EditModeShell` + final build + open PR

**Files:**

- Modify: `packages/ui/src/components/Canvas/EditMode/EditModeShell.tsx`
- Modify: `packages/ui/src/components/Canvas/EditMode/__tests__/EditModeShell.test.tsx`

- [ ] **Step 1: Write the failing wiring tests**

Add to `EditModeShell.test.tsx`:

```tsx
import type { ColumnParsingProfile } from '@variscout/core/parser';
import { createTestColumnParsingProfile } from '../../../../test-utils/columnParsingProfile';

describe('EditModeShell — Palette wiring', () => {
  it('renders the Palette with the given profiles inside the palette zone', () => {
    const profiles: ColumnParsingProfile[] = [
      createTestColumnParsingProfile({ columnName: 'Speed' }),
    ];
    render(
      <DndContext>
        <EditModeShell onDone={() => {}} profiles={profiles} numericValuesByColumn={{}}>
          <div />
        </EditModeShell>
      </DndContext>
    );
    const zone = screen.getByTestId('edit-mode-zone-palette');
    expect(zone).toContainElement(screen.getByTestId('palette'));
    expect(zone).toContainElement(screen.getByText('Speed'));
  });

  it('falls back to the empty-state hint when no profiles are passed', () => {
    render(
      <DndContext>
        <EditModeShell onDone={() => {}}>
          <div />
        </EditModeShell>
      </DndContext>
    );
    expect(screen.getByTestId('palette-empty')).toBeInTheDocument();
  });
});
```

If `EditModeShell.test.tsx` does not already wrap renders in `<DndContext>`, add it here only — do not refactor existing passing tests.

- [ ] **Step 2: Run test to verify it fails**

```bash
pnpm --filter @variscout/ui test -- EditModeShell
```

Expected: FAIL — `profiles` prop unknown; palette zone still shows the placeholder text.

- [ ] **Step 3: Modify `EditModeShell.tsx`**

```tsx
import React from 'react';
import type { ColumnParsingProfile } from '@variscout/core/parser';
import { Palette } from './Palette';

export interface EditModeShellProps {
  onDone: () => void;
  children: React.ReactNode;
  /** Column parsing profiles to render in the palette zone. Defaults to []. */
  profiles?: ColumnParsingProfile[];
  /** Raw numeric values per column, for sparklines. Defaults to {}. */
  numericValuesByColumn?: Record<string, number[]>;
  /** Forwarded to the palette's ColumnChips. Popover UI ships in B2.3. */
  onColumnOverrideOpen?: (columnName: string) => void;
  /** Forwarded to the palette's ColumnChips. Context menu UI ships in B2.3. */
  onColumnContextMenuOpen?: (columnName: string) => void;
}

export const EditModeShell: React.FC<EditModeShellProps> = ({
  onDone,
  children,
  profiles = [],
  numericValuesByColumn = {},
  onColumnOverrideOpen,
  onColumnContextMenuOpen,
}) => {
  return (
    <section
      data-testid="edit-mode-shell"
      className="flex min-h-0 flex-1 flex-col"
      aria-label="Edit mode"
    >
      <header className="flex items-center justify-between border-b border-edge bg-surface-secondary px-4 py-2">
        <div className="flex flex-col">
          <h2 className="text-sm font-semibold text-content">Edit map</h2>
          <p className="text-xs text-content-secondary">
            Connect your data to the process structure.
          </p>
        </div>
        <button
          type="button"
          onClick={onDone}
          className="rounded-md border border-edge bg-surface-primary px-3 py-1.5 text-xs font-medium text-content hover:bg-surface-tertiary"
        >
          Done
        </button>
      </header>

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 p-3 md:grid-cols-[14rem_18rem_minmax(0,1fr)]">
        <aside
          data-testid="edit-mode-zone-palette"
          className="flex flex-col gap-2 rounded-md border border-dashed border-edge bg-surface-primary p-3"
          aria-label="Palette zone"
        >
          <h3 className="text-xs font-semibold uppercase tracking-wide text-content-tertiary">
            Palette
          </h3>
          <Palette
            profiles={profiles}
            numericValuesByColumn={numericValuesByColumn}
            onColumnOverrideOpen={onColumnOverrideOpen}
            onColumnContextMenuOpen={onColumnContextMenuOpen}
          />
        </aside>

        <aside
          data-testid="edit-mode-zone-outcomes-factors"
          className="flex flex-col rounded-md border border-dashed border-edge bg-surface-primary p-3"
          aria-label="Outcomes and Factors zone"
        >
          <h3 className="text-xs font-semibold uppercase tracking-wide text-content-tertiary">
            Outcomes &amp; Factors
          </h3>
          <p className="mt-2 text-xs text-content-secondary">
            Outcome and factor zones arrive in Phase C.
          </p>
        </aside>

        <section
          data-testid="edit-mode-zone-process"
          className="flex min-h-0 flex-col rounded-md border border-edge bg-surface-primary"
          aria-label="Process structure zone"
        >
          {children}
        </section>
      </div>
    </section>
  );
};

export default EditModeShell;
```

- [ ] **Step 4: Run test to verify it passes**

```bash
pnpm --filter @variscout/ui test -- EditModeShell
```

Expected: PASS. Also run the full ui suite once before pushing:

```bash
pnpm --filter @variscout/ui test
pnpm --filter @variscout/ui build
```

Expected: both green (build catches type drift per `feedback_ui_build_before_merge`).

- [ ] **Step 5: Commit**

```bash
git add packages/ui/src/components/Canvas/EditMode/EditModeShell.tsx \
        packages/ui/src/components/Canvas/EditMode/__tests__/EditModeShell.test.tsx
git commit -m "feat(ui): wire Palette into EditModeShell palette zone"
```

- [ ] **Step 6: Push branch and open PR**

```bash
git push -u origin feat/wedge-v1-ccj-b2-2-column-chip
gh pr create --title "feat(wedge-v1): PR-CCJ-B2.2 — ColumnChip + Palette primitive" \
  --body "$(cat <<'EOF'
## Summary

Renders the palette zone of `EditModeShell` with grouped, draggable `ColumnChip` primitives consuming B2.1's `ColumnParsingProfile[]` contract.

- New `ColumnChip` with parsing badge (✓/⚠/✗) + interpretation line + numeric sparkline + drag handle (`@dnd-kit/core`) + stubbed `▾` / `⋮` callbacks (popover + context menu UI ship in B2.3)
- New `ColumnGroup` primitive — grouped section with `{Label} · {count}` header
- New `Palette` container — buckets profiles by kind into `Numeric → Categorical → Time / ID → Other`, omits empty groups
- `EditModeShell` accepts optional `profiles`, `numericValuesByColumn`, and column-event callback props; falls back to an empty-state hint when no profiles passed

## Spec
- `docs/superpowers/specs/2026-05-26-canvas-connection-journey-design.md` §3.1, §4.1
- Sequencer: `docs/superpowers/plans/2026-05-27-canvas-connection-journey-b2-master-plan.md`
- Sub-plan: `docs/superpowers/plans/2026-05-27-canvas-connection-journey-b2-2-column-chip-palette.md`

## Test plan
- [x] `pnpm --filter @variscout/ui test` green (ColumnChip 16 tests, ColumnGroup 1, Palette 5, EditModeShell wiring 2, factory + codec 6)
- [x] `pnpm --filter @variscout/ui build` green
- [x] `pnpm test` green (turbo)
- [ ] Manual render check (Storybook-style harness or `pnpm dev`)

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

---

## Verification (B2.2 completion)

After the PR opens:

1. `bash scripts/pr-ready-check.sh` — full pre-merge gauntlet must be green
2. Final Opus branch reviewer (per `feedback_subagent_driven_default`) with `STEP 0` git checkout (per `feedback_code_review_subagent_must_checkout_pr_branch`)
3. Merge with `gh pr merge --merge --delete-branch` (NEVER `--squash`, NEVER `--admin` unless emergency, per `feedback_preserve_commit_history`)
4. Update `[[canvas-connection-journey]]` memory with B2.2 outcomes + flag B2.3 as next
5. Remove worktree: `git worktree remove .worktrees/feat/wedge-v1-ccj-b2-2-column-chip && git branch -d feat/wedge-v1-ccj-b2-2-column-chip`

## Out of scope (B2.2)

Deferred to B2.3:

- `ParsingOverridePopover` UI (chip emits the `▾` callback only)
- `ColumnChipContextMenu` UI (chip emits the `⋮` callback only)
- `ParsingBanner` for aggregate ⚠ across ≥ 3 chips

Deferred to Phase C+:

- Real drop targets (drag events fire, no zone accepts them)
- Real ghost-suggested heuristics (chip renders state from prop)
- Derived chips (`✨` marker, DERIVED FROM section) — Phase D
- Outcome chips with specs popover (`⚙`) — Phase C, PR-CCJ-C1
- Persistence of user parsing overrides — C-phase Hub blob update
- Inflection binning (Probability Plot lens) — Phase G

## Related

- [B2 master sequencer](./2026-05-27-canvas-connection-journey-b2-master-plan.md)
- [Canvas Connection Journey spec](../specs/2026-05-26-canvas-connection-journey-design.md) §3.1, §4.1
- [Canvas Connection Journey master plan](./2026-05-26-canvas-connection-journey-master-plan.md)
- [[canvas-connection-journey]], [[wedge-v1]], [[feedback_subagent_driven_default]], [[feedback_slice_size_cap]], [[feedback_one_worktree_per_agent]], [[feedback_preserve_commit_history]], [[feedback_ui_build_before_merge]], [[feedback_green_400_light_contrast]]
