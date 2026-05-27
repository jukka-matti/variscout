---
tier: ephemeral
purpose: build
title: PR-CCJ-C1 — Outcome zone + specs popover
status: active
date: 2026-05-27
layer: spec
---

# PR-CCJ-C1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Render the top half of EditModeShell's Outcomes & Factors zone as a functional drop target: `OutcomeZone` accepts `column:<name>` drag events from the palette, derives default specs from the dropped column's numeric values + `characteristicType`, creates `OutcomeCard` primitives with direction indicator + spec pills + `⚙` button, and opens a `SpecsPopover` editor on `⚙` click with `characteristicType`-aware LSL/USL disabling.

**Architecture:** UI-only TDD. `useDroppable` from `@dnd-kit/core` for the drop zone (singleton id `outcome-zone:singleton`). Mutual-exclusion popover state via single `openSpecsForSpecId: string | null` slot (mirrors B2.3 `OpenOverlay` discipline). All state prop-driven; no Zustand wiring or IP-blob persistence in this PR (deferred to E1 Charter modal). The `OutcomeSpec` type already exists in `@variscout/core` — no core changes.

**Tech Stack:** React 18, TypeScript, `@dnd-kit/core` (`useDroppable`), Tailwind (semantic tokens), Vitest + Testing Library + happy-dom.

---

**Spec being implemented:** [`docs/superpowers/specs/2026-05-26-canvas-connection-journey-design.md`](../specs/2026-05-26-canvas-connection-journey-design.md) §3.2, §3.2.1, §3.2.2

**Parent master sequencer:** [`2026-05-27-canvas-connection-journey-c-master-plan.md`](./2026-05-27-canvas-connection-journey-c-master-plan.md)

**Depends on:** PR-CCJ-B2 (column chip drag-id `column:<name>` codec, `useDroppable` patterns established by ProcessMapBase/DroppableGateBadge, EditModeShell `profiles`/`numericValuesByColumn` props). All shipped at `a961d867`.

---

## File Structure

```
Create:
  packages/ui/src/test-utils/outcomeSpec.ts                                                — createTestOutcomeSpec() factory
  packages/ui/src/components/Canvas/EditMode/OutcomeZone/encodeOutcomeDropId.ts            — drop-id codec
  packages/ui/src/components/Canvas/EditMode/OutcomeZone/deriveDefaultSpecs.ts             — pure helper
  packages/ui/src/components/Canvas/EditMode/OutcomeZone/OutcomeCard.tsx                   — outcome chip primitive
  packages/ui/src/components/Canvas/EditMode/OutcomeZone/SpecsPopover.tsx                  — specs editor popover
  packages/ui/src/components/Canvas/EditMode/OutcomeZone/index.tsx                         — OutcomeZone container
  packages/ui/src/components/Canvas/EditMode/OutcomeZone/__tests__/deriveDefaultSpecs.test.ts
  packages/ui/src/components/Canvas/EditMode/OutcomeZone/__tests__/OutcomeCard.test.tsx
  packages/ui/src/components/Canvas/EditMode/OutcomeZone/__tests__/SpecsPopover.test.tsx
  packages/ui/src/components/Canvas/EditMode/OutcomeZone/__tests__/OutcomeZone.test.tsx
Modify:
  packages/ui/src/components/Canvas/EditMode/EditModeShell.tsx                              — wire OutcomeZone (top half of placeholder), add 4 new props
  packages/ui/src/components/Canvas/EditMode/__tests__/EditModeShell.test.tsx               — add OutcomeZone wiring assertions
```

---

## Tasks

### Task 1 — Worktree + branch + test factory

**Files:**

- Worktree: `.worktrees/feat/wedge-v1-ccj-c-1-outcome-zone/` off branch `feat/wedge-v1-ccj-c-1-outcome-zone`
- Create: `packages/ui/src/test-utils/outcomeSpec.ts`
- Test: `packages/ui/src/test-utils/outcomeSpec.test.ts`

- [ ] **Step 1: Create worktree + branch**

```bash
cd /Users/jukka-mattiturtiainen/Projects/VariScout_lite
git worktree add -b feat/wedge-v1-ccj-c-1-outcome-zone .worktrees/feat/wedge-v1-ccj-c-1-outcome-zone main
cd .worktrees/feat/wedge-v1-ccj-c-1-outcome-zone
```

- [ ] **Step 2: Read `OutcomeSpec` type to mirror exactly**

Run: `head -110 packages/core/src/processHub.ts | tail -40`
Expected: `OutcomeSpec` interface at ~lines 86-101 with fields `id` (EntityBase), `hubId`, `columnName`, `characteristicType`, `target?`, `lsl?`, `usl?`, `cpkTarget?`.

- [ ] **Step 3: Write failing test for factory**

`packages/ui/src/test-utils/outcomeSpec.test.ts`:

```typescript
import { describe, expect, it } from 'vitest';
import { createTestOutcomeSpec } from './outcomeSpec';

describe('createTestOutcomeSpec', () => {
  it('returns a fully-formed OutcomeSpec with sensible defaults', () => {
    const spec = createTestOutcomeSpec();
    expect(spec.id).toMatch(/^outcome-/);
    expect(spec.hubId).toBe('hub-test');
    expect(spec.columnName).toBe('Diameter');
    expect(spec.characteristicType).toBe('nominalIsBest');
    expect(spec.target).toBe(10);
    expect(spec.lsl).toBe(9.5);
    expect(spec.usl).toBe(10.5);
    expect(spec.cpkTarget).toBe(1.33);
  });

  it('merges overrides over defaults', () => {
    const spec = createTestOutcomeSpec({
      columnName: 'Cycle_time',
      characteristicType: 'smallerIsBetter',
    });
    expect(spec.columnName).toBe('Cycle_time');
    expect(spec.characteristicType).toBe('smallerIsBetter');
    expect(spec.cpkTarget).toBe(1.33); // unchanged
  });
});
```

- [ ] **Step 4: Run test to verify it fails**

Run: `pnpm --filter @variscout/ui test outcomeSpec.test`
Expected: FAIL (module not found).

- [ ] **Step 5: Implement factory**

`packages/ui/src/test-utils/outcomeSpec.ts`:

```typescript
import type { OutcomeSpec } from '@variscout/core';

let counter = 0;

export function createTestOutcomeSpec(overrides: Partial<OutcomeSpec> = {}): OutcomeSpec {
  counter += 1;
  return {
    id: `outcome-test-${counter}`,
    hubId: 'hub-test',
    createdAt: '2026-05-27T00:00:00.000Z',
    updatedAt: '2026-05-27T00:00:00.000Z',
    columnName: 'Diameter',
    characteristicType: 'nominalIsBest',
    target: 10,
    lsl: 9.5,
    usl: 10.5,
    cpkTarget: 1.33,
    ...overrides,
  };
}
```

(If `OutcomeSpec`'s EntityBase requires additional fields the implementer discovers via tsc, add them — keep deterministic test values.)

- [ ] **Step 6: Run test to verify it passes**

Run: `pnpm --filter @variscout/ui test outcomeSpec.test`
Expected: PASS (2/2).

- [ ] **Step 7: Commit**

```bash
git add packages/ui/src/test-utils/outcomeSpec.ts packages/ui/src/test-utils/outcomeSpec.test.ts
git commit -m "test(ui): add createTestOutcomeSpec factory for C1 outcome zone"
```

---

### Task 2 — `deriveDefaultSpecs` pure helper

**Files:**

- Create: `packages/ui/src/components/Canvas/EditMode/OutcomeZone/deriveDefaultSpecs.ts`
- Test: `packages/ui/src/components/Canvas/EditMode/OutcomeZone/__tests__/deriveDefaultSpecs.test.ts`

- [ ] **Step 1: Write failing test**

```typescript
import { describe, expect, it } from 'vitest';
import { deriveDefaultSpecs } from '../deriveDefaultSpecs';

describe('deriveDefaultSpecs', () => {
  it('nominalIsBest: target = mean, LSL/USL undefined, Cpk = 1.33', () => {
    const result = deriveDefaultSpecs([1, 2, 3, 4, 5], 'nominalIsBest');
    expect(result.target).toBe(3);
    expect(result.lsl).toBeUndefined();
    expect(result.usl).toBeUndefined();
    expect(result.cpkTarget).toBe(1.33);
  });

  it('smallerIsBetter: all spec values undefined except Cpk', () => {
    const result = deriveDefaultSpecs([1, 2, 3, 4, 5], 'smallerIsBetter');
    expect(result.target).toBeUndefined();
    expect(result.lsl).toBeUndefined();
    expect(result.usl).toBeUndefined();
    expect(result.cpkTarget).toBe(1.33);
  });

  it('largerIsBetter: all spec values undefined except Cpk', () => {
    const result = deriveDefaultSpecs([1, 2, 3, 4, 5], 'largerIsBetter');
    expect(result.target).toBeUndefined();
    expect(result.cpkTarget).toBe(1.33);
  });

  it('empty values: all undefined except Cpk', () => {
    const result = deriveDefaultSpecs([], 'nominalIsBest');
    expect(result.target).toBeUndefined();
    expect(result.cpkTarget).toBe(1.33);
  });

  it('ignores non-finite values when computing mean', () => {
    const result = deriveDefaultSpecs([1, 2, NaN, 3, Infinity], 'nominalIsBest');
    expect(result.target).toBe(2); // (1+2+3) / 3
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @variscout/ui test deriveDefaultSpecs.test`
Expected: FAIL (module not found).

- [ ] **Step 3: Implement helper**

```typescript
import type { CharacteristicType, OutcomeSpec } from '@variscout/core';

export type DerivedSpecs = Pick<OutcomeSpec, 'target' | 'lsl' | 'usl' | 'cpkTarget'>;

export function deriveDefaultSpecs(
  values: number[],
  characteristicType: CharacteristicType
): DerivedSpecs {
  const cpkTarget = 1.33;

  if (characteristicType !== 'nominalIsBest') {
    return { target: undefined, lsl: undefined, usl: undefined, cpkTarget };
  }

  const finite = values.filter(v => Number.isFinite(v));
  if (finite.length === 0) {
    return { target: undefined, lsl: undefined, usl: undefined, cpkTarget };
  }

  const mean = finite.reduce((sum, v) => sum + v, 0) / finite.length;
  return { target: mean, lsl: undefined, usl: undefined, cpkTarget };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @variscout/ui test deriveDefaultSpecs.test`
Expected: PASS (5/5).

- [ ] **Step 5: Commit**

```bash
git add packages/ui/src/components/Canvas/EditMode/OutcomeZone/deriveDefaultSpecs.ts packages/ui/src/components/Canvas/EditMode/OutcomeZone/__tests__/deriveDefaultSpecs.test.ts
git commit -m "feat(ui): deriveDefaultSpecs helper for OutcomeZone"
```

---

### Task 3 — `OutcomeCard` base render

**Files:**

- Create: `packages/ui/src/components/Canvas/EditMode/OutcomeZone/OutcomeCard.tsx`
- Test: `packages/ui/src/components/Canvas/EditMode/OutcomeZone/__tests__/OutcomeCard.test.tsx`

- [ ] **Step 1: Write failing test**

```typescript
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { createTestOutcomeSpec } from '../../../../../test-utils/outcomeSpec';
import { OutcomeCard } from '../OutcomeCard';

describe('OutcomeCard', () => {
  it('renders columnName, direction indicator, and spec pills', () => {
    render(<OutcomeCard spec={createTestOutcomeSpec({ columnName: 'Diameter', characteristicType: 'nominalIsBest', target: 10, lsl: 9.5, usl: 10.5, cpkTarget: 1.33 })} onSpecsClick={vi.fn()} />);
    expect(screen.getByText('Diameter')).toBeInTheDocument();
    expect(screen.getByText('=')).toBeInTheDocument(); // nominalIsBest direction
    expect(screen.getByText(/target: 10/)).toBeInTheDocument();
    expect(screen.getByText(/LSL: 9.5/)).toBeInTheDocument();
    expect(screen.getByText(/USL: 10.5/)).toBeInTheDocument();
    expect(screen.getByText(/Cpk: 1.33/)).toBeInTheDocument();
  });

  it('renders ↓ for smallerIsBetter', () => {
    render(<OutcomeCard spec={createTestOutcomeSpec({ characteristicType: 'smallerIsBetter' })} onSpecsClick={vi.fn()} />);
    expect(screen.getByText('↓')).toBeInTheDocument();
  });

  it('renders ↑ for largerIsBetter', () => {
    render(<OutcomeCard spec={createTestOutcomeSpec({ characteristicType: 'largerIsBetter' })} onSpecsClick={vi.fn()} />);
    expect(screen.getByText('↑')).toBeInTheDocument();
  });

  it('renders em-dash for missing spec values', () => {
    render(<OutcomeCard spec={createTestOutcomeSpec({ target: undefined, lsl: undefined, usl: undefined })} onSpecsClick={vi.fn()} />);
    expect(screen.getByText(/target: —/)).toBeInTheDocument();
    expect(screen.getByText(/LSL: —/)).toBeInTheDocument();
    expect(screen.getByText(/USL: —/)).toBeInTheDocument();
  });

  it('clicking ⚙ fires onSpecsClick with anchor from getBoundingClientRect', () => {
    const onSpecsClick = vi.fn();
    render(<OutcomeCard spec={createTestOutcomeSpec()} onSpecsClick={onSpecsClick} />);
    const button = screen.getByRole('button', { name: /edit specs/i });
    fireEvent.click(button);
    expect(onSpecsClick).toHaveBeenCalledTimes(1);
    expect(onSpecsClick).toHaveBeenCalledWith(expect.objectContaining({ x: expect.any(Number), y: expect.any(Number) }));
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @variscout/ui test OutcomeCard.test`
Expected: FAIL (module not found).

- [ ] **Step 3: Implement OutcomeCard**

```typescript
import { useRef } from 'react';
import type { OutcomeSpec } from '@variscout/core';

export interface OutcomeCardProps {
  spec: OutcomeSpec;
  onSpecsClick: (anchor: { x: number; y: number }) => void;
}

const DIRECTION_BY_TYPE: Record<OutcomeSpec['characteristicType'], string> = {
  nominalIsBest: '=',
  smallerIsBetter: '↓',
  largerIsBetter: '↑',
};

function formatPill(label: string, value: number | undefined): string {
  return `${label}: ${value !== undefined ? value : '—'}`;
}

export function OutcomeCard({ spec, onSpecsClick }: OutcomeCardProps) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const direction = DIRECTION_BY_TYPE[spec.characteristicType];

  const handleSpecsClick = () => {
    const rect = buttonRef.current?.getBoundingClientRect();
    onSpecsClick({ x: rect?.left ?? 0, y: rect?.bottom ?? 0 });
  };

  return (
    <div className="flex flex-col gap-1 rounded-md border border-edge bg-surface-primary p-3 text-content">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-base font-semibold">{spec.columnName}</span>
          <span aria-hidden="true" className="text-content-tertiary">{direction}</span>
        </div>
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
      <div className="flex flex-wrap gap-1 text-xs text-content-secondary">
        <span className="rounded bg-surface-secondary px-2 py-0.5">{formatPill('target', spec.target)}</span>
        <span className="rounded bg-surface-secondary px-2 py-0.5">{formatPill('LSL', spec.lsl)}</span>
        <span className="rounded bg-surface-secondary px-2 py-0.5">{formatPill('USL', spec.usl)}</span>
        <span className="rounded bg-surface-secondary px-2 py-0.5">{formatPill('Cpk', spec.cpkTarget)}</span>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @variscout/ui test OutcomeCard.test`
Expected: PASS (5/5).

- [ ] **Step 5: Commit**

```bash
git add packages/ui/src/components/Canvas/EditMode/OutcomeZone/OutcomeCard.tsx packages/ui/src/components/Canvas/EditMode/OutcomeZone/__tests__/OutcomeCard.test.tsx
git commit -m "feat(ui): OutcomeCard with direction indicator and spec pills"
```

---

### Task 4 — `SpecsPopover` render + characteristicType-aware disabling + Escape/backdrop close

**Files:**

- Create: `packages/ui/src/components/Canvas/EditMode/OutcomeZone/SpecsPopover.tsx`
- Test: `packages/ui/src/components/Canvas/EditMode/OutcomeZone/__tests__/SpecsPopover.test.tsx`

- [ ] **Step 1: Write failing tests**

```typescript
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { createTestOutcomeSpec } from '../../../../../test-utils/outcomeSpec';
import { SpecsPopover } from '../SpecsPopover';

describe('SpecsPopover', () => {
  const baseProps = {
    spec: createTestOutcomeSpec(),
    anchor: { x: 120, y: 200 },
    onApply: vi.fn(),
    onClose: vi.fn(),
  };

  it('renders fixed-positioned popover anchored at given coordinates', () => {
    render(<SpecsPopover {...baseProps} />);
    const popover = screen.getByRole('dialog');
    expect(popover).toHaveStyle({ position: 'fixed', left: '120px', top: '200px' });
  });

  it('renders all 4 spec inputs + characteristicType radio group', () => {
    render(<SpecsPopover {...baseProps} />);
    expect(screen.getByLabelText(/target/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/LSL/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/USL/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Cpk target/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/nominal is best/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/smaller is better/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/larger is better/i)).toBeInTheDocument();
  });

  it('LSL input disabled when characteristicType is smallerIsBetter', () => {
    render(<SpecsPopover {...baseProps} spec={createTestOutcomeSpec({ characteristicType: 'smallerIsBetter' })} />);
    expect(screen.getByLabelText(/LSL/i)).toBeDisabled();
    expect(screen.getByLabelText(/USL/i)).not.toBeDisabled();
  });

  it('USL input disabled when characteristicType is largerIsBetter', () => {
    render(<SpecsPopover {...baseProps} spec={createTestOutcomeSpec({ characteristicType: 'largerIsBetter' })} />);
    expect(screen.getByLabelText(/USL/i)).toBeDisabled();
    expect(screen.getByLabelText(/LSL/i)).not.toBeDisabled();
  });

  it('Escape key fires onClose', () => {
    const onClose = vi.fn();
    render(<SpecsPopover {...baseProps} onClose={onClose} />);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('backdrop click fires onClose', () => {
    const onClose = vi.fn();
    render(<SpecsPopover {...baseProps} onClose={onClose} />);
    const backdrop = screen.getByTestId('specs-popover-backdrop');
    fireEvent.click(backdrop);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('Apply button fires onApply with edited values', () => {
    const onApply = vi.fn();
    render(<SpecsPopover {...baseProps} onApply={onApply} />);
    fireEvent.change(screen.getByLabelText(/target/i), { target: { value: '42' } });
    fireEvent.click(screen.getByRole('button', { name: /apply/i }));
    expect(onApply).toHaveBeenCalledTimes(1);
    expect(onApply).toHaveBeenCalledWith(expect.objectContaining({ target: 42 }));
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @variscout/ui test SpecsPopover.test`
Expected: FAIL (module not found).

- [ ] **Step 3: Implement SpecsPopover**

```typescript
import { useEffect, useState } from 'react';
import type { CharacteristicType, OutcomeSpec } from '@variscout/core';

export interface SpecsPopoverProps {
  spec: OutcomeSpec;
  anchor: { x: number; y: number };
  onApply: (updated: OutcomeSpec) => void;
  onClose: () => void;
}

function parseNumber(value: string): number | undefined {
  if (value === '') return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export function SpecsPopover({ spec, anchor, onApply, onClose }: SpecsPopoverProps) {
  const [characteristicType, setCharacteristicType] = useState<CharacteristicType>(spec.characteristicType);
  const [target, setTarget] = useState(spec.target?.toString() ?? '');
  const [lsl, setLsl] = useState(spec.lsl?.toString() ?? '');
  const [usl, setUsl] = useState(spec.usl?.toString() ?? '');
  const [cpkTarget, setCpkTarget] = useState(spec.cpkTarget?.toString() ?? '1.33');

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  const handleApply = () => {
    onApply({
      ...spec,
      characteristicType,
      target: parseNumber(target),
      lsl: parseNumber(lsl),
      usl: parseNumber(usl),
      cpkTarget: parseNumber(cpkTarget) ?? 1.33,
    });
  };

  const lslDisabled = characteristicType === 'smallerIsBetter';
  const uslDisabled = characteristicType === 'largerIsBetter';

  return (
    <>
      <div
        data-testid="specs-popover-backdrop"
        className="fixed inset-0 z-40"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-label="Edit outcome specs"
        className="fixed z-50 flex w-72 flex-col gap-3 rounded-md border border-edge bg-surface-primary p-4 shadow-lg"
        style={{ position: 'fixed', left: `${anchor.x}px`, top: `${anchor.y}px` }}
      >
        <fieldset className="flex flex-col gap-1">
          <legend className="text-xs uppercase tracking-wide text-content-tertiary">Characteristic</legend>
          {(['nominalIsBest', 'smallerIsBetter', 'largerIsBetter'] as const).map((type) => (
            <label key={type} className="flex items-center gap-2 text-sm text-content">
              <input
                type="radio"
                name="characteristicType"
                value={type}
                checked={characteristicType === type}
                onChange={() => setCharacteristicType(type)}
              />
              <span>{type === 'nominalIsBest' ? 'Nominal is best' : type === 'smallerIsBetter' ? 'Smaller is better' : 'Larger is better'}</span>
            </label>
          ))}
        </fieldset>
        <label className="flex flex-col gap-1 text-sm text-content">
          <span>Target</span>
          <input type="number" value={target} onChange={(e) => setTarget(e.target.value)} className="rounded border border-edge px-2 py-1" />
        </label>
        <label className={`flex flex-col gap-1 text-sm ${lslDisabled ? 'text-content-tertiary' : 'text-content'}`}>
          <span>LSL</span>
          <input type="number" value={lsl} disabled={lslDisabled} onChange={(e) => setLsl(e.target.value)} className="rounded border border-edge px-2 py-1 disabled:bg-surface-secondary" />
        </label>
        <label className={`flex flex-col gap-1 text-sm ${uslDisabled ? 'text-content-tertiary' : 'text-content'}`}>
          <span>USL</span>
          <input type="number" value={usl} disabled={uslDisabled} onChange={(e) => setUsl(e.target.value)} className="rounded border border-edge px-2 py-1 disabled:bg-surface-secondary" />
        </label>
        <label className="flex flex-col gap-1 text-sm text-content">
          <span>Cpk target</span>
          <input type="number" value={cpkTarget} onChange={(e) => setCpkTarget(e.target.value)} className="rounded border border-edge px-2 py-1" />
        </label>
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded px-3 py-1 text-sm text-content-secondary hover:bg-surface-secondary">Cancel</button>
          <button type="button" onClick={handleApply} className="rounded bg-accent px-3 py-1 text-sm text-accent-foreground hover:bg-accent-hover">Apply</button>
        </div>
      </div>
    </>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @variscout/ui test SpecsPopover.test`
Expected: PASS (7/7).

- [ ] **Step 5: Commit**

```bash
git add packages/ui/src/components/Canvas/EditMode/OutcomeZone/SpecsPopover.tsx packages/ui/src/components/Canvas/EditMode/OutcomeZone/__tests__/SpecsPopover.test.tsx
git commit -m "feat(ui): SpecsPopover with characteristicType-aware LSL/USL disabling"
```

---

### Task 5 — `encodeOutcomeDropId` drop-id codec

**Files:**

- Create: `packages/ui/src/components/Canvas/EditMode/OutcomeZone/encodeOutcomeDropId.ts`
- Test: included in `__tests__/OutcomeZone.test.tsx` Task 6 (codec is small enough to bundle with zone tests)

- [ ] **Step 1: Write failing test (will be bundled into OutcomeZone test file in Task 6)**

For now, write a quick smoke test alongside the codec file:

`packages/ui/src/components/Canvas/EditMode/OutcomeZone/__tests__/encodeOutcomeDropId.test.ts`:

```typescript
import { describe, expect, it } from 'vitest';
import {
  decodeOutcomeDropId,
  encodeOutcomeDropId,
  isOutcomeDropId,
  OUTCOME_ZONE_DROP_ID,
} from '../encodeOutcomeDropId';

describe('encodeOutcomeDropId', () => {
  it('encode returns the singleton drop id', () => {
    expect(encodeOutcomeDropId()).toBe('outcome-zone:singleton');
    expect(encodeOutcomeDropId()).toBe(OUTCOME_ZONE_DROP_ID);
  });

  it('isOutcomeDropId type-guards the singleton id', () => {
    expect(isOutcomeDropId('outcome-zone:singleton')).toBe(true);
    expect(isOutcomeDropId('column:Diameter')).toBe(false);
    expect(isOutcomeDropId(123)).toBe(false);
  });

  it('decode returns "singleton" for canonical id, null otherwise', () => {
    expect(decodeOutcomeDropId('outcome-zone:singleton')).toBe('singleton');
    expect(decodeOutcomeDropId('outcome-zone:other')).toBeNull();
    expect(decodeOutcomeDropId('canvas:empty')).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @variscout/ui test encodeOutcomeDropId.test`
Expected: FAIL (module not found).

- [ ] **Step 3: Implement codec**

`packages/ui/src/components/Canvas/EditMode/OutcomeZone/encodeOutcomeDropId.ts`:

```typescript
export const OUTCOME_ZONE_DROP_ID = 'outcome-zone:singleton' as const;
export type OutcomeZoneDropId = typeof OUTCOME_ZONE_DROP_ID;

export function encodeOutcomeDropId(): OutcomeZoneDropId {
  return OUTCOME_ZONE_DROP_ID;
}

export function isOutcomeDropId(value: unknown): value is OutcomeZoneDropId {
  return value === OUTCOME_ZONE_DROP_ID;
}

export function decodeOutcomeDropId(value: string): 'singleton' | null {
  return value === OUTCOME_ZONE_DROP_ID ? 'singleton' : null;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @variscout/ui test encodeOutcomeDropId.test`
Expected: PASS (3/3).

- [ ] **Step 5: Commit**

```bash
git add packages/ui/src/components/Canvas/EditMode/OutcomeZone/encodeOutcomeDropId.ts packages/ui/src/components/Canvas/EditMode/OutcomeZone/__tests__/encodeOutcomeDropId.test.ts
git commit -m "feat(ui): encodeOutcomeDropId codec for outcome zone drop target"
```

---

### Task 6 — `OutcomeZone` container + drop target + popover orchestration

**Files:**

- Create: `packages/ui/src/components/Canvas/EditMode/OutcomeZone/index.tsx`
- Test: `packages/ui/src/components/Canvas/EditMode/OutcomeZone/__tests__/OutcomeZone.test.tsx`

- [ ] **Step 1: Write failing tests**

```typescript
import { DndContext } from '@dnd-kit/core';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { createTestOutcomeSpec } from '../../../../../test-utils/outcomeSpec';
import { OutcomeZone } from '..';

function renderZone(props: Partial<React.ComponentProps<typeof OutcomeZone>> = {}) {
  return render(
    <DndContext>
      <OutcomeZone
        specs={[]}
        numericValuesByColumn={{}}
        onSpecAdd={vi.fn()}
        onSpecUpdate={vi.fn()}
        {...props}
      />
    </DndContext>,
  );
}

describe('OutcomeZone', () => {
  it('renders empty-state hint when no specs', () => {
    renderZone();
    expect(screen.getByText(/drop a numeric column/i)).toBeInTheDocument();
  });

  it('renders one OutcomeCard per spec', () => {
    const specs = [createTestOutcomeSpec({ id: 'o-1', columnName: 'A' }), createTestOutcomeSpec({ id: 'o-2', columnName: 'B' })];
    renderZone({ specs });
    expect(screen.getByText('A')).toBeInTheDocument();
    expect(screen.getByText('B')).toBeInTheDocument();
  });

  it('has data-testid="outcome-zone" wrapper', () => {
    renderZone();
    expect(screen.getByTestId('outcome-zone')).toBeInTheDocument();
  });

  it('clicking ⚙ on a card opens SpecsPopover', () => {
    renderZone({ specs: [createTestOutcomeSpec({ id: 'o-1', columnName: 'A' })] });
    fireEvent.click(screen.getByRole('button', { name: /edit specs/i }));
    expect(screen.getByRole('dialog', { name: /edit outcome specs/i })).toBeInTheDocument();
  });

  it('only one popover open at a time (mutual exclusion)', () => {
    renderZone({
      specs: [
        createTestOutcomeSpec({ id: 'o-1', columnName: 'A' }),
        createTestOutcomeSpec({ id: 'o-2', columnName: 'B' }),
      ],
    });
    const buttons = screen.getAllByRole('button', { name: /edit specs/i });
    fireEvent.click(buttons[0]);
    fireEvent.click(buttons[1]);
    expect(screen.getAllByRole('dialog', { name: /edit outcome specs/i })).toHaveLength(1);
  });

  it('popover Apply fires onSpecUpdate with updated spec', () => {
    const onSpecUpdate = vi.fn();
    renderZone({ specs: [createTestOutcomeSpec({ id: 'o-1', columnName: 'A', target: 5 })], onSpecUpdate });
    fireEvent.click(screen.getByRole('button', { name: /edit specs/i }));
    fireEvent.change(screen.getByLabelText(/target/i), { target: { value: '42' } });
    fireEvent.click(screen.getByRole('button', { name: /apply/i }));
    expect(onSpecUpdate).toHaveBeenCalledWith('o-1', expect.objectContaining({ target: 42 }));
  });

  it('popover Escape closes without firing onSpecUpdate', () => {
    const onSpecUpdate = vi.fn();
    renderZone({ specs: [createTestOutcomeSpec({ id: 'o-1', columnName: 'A' })], onSpecUpdate });
    fireEvent.click(screen.getByRole('button', { name: /edit specs/i }));
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('dialog', { name: /edit outcome specs/i })).not.toBeInTheDocument();
    expect(onSpecUpdate).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @variscout/ui test OutcomeZone.test`
Expected: FAIL (module not found).

- [ ] **Step 3: Implement OutcomeZone**

```typescript
import { useDroppable } from '@dnd-kit/core';
import { useState } from 'react';
import type { OutcomeSpec } from '@variscout/core';
import { OutcomeCard } from './OutcomeCard';
import { SpecsPopover } from './SpecsPopover';
import { encodeOutcomeDropId } from './encodeOutcomeDropId';

export interface OutcomeZoneProps {
  specs: OutcomeSpec[];
  numericValuesByColumn: Record<string, number[]>;
  onSpecAdd: (columnName: string, derived: Partial<OutcomeSpec>) => void;
  onSpecUpdate: (specId: string, updated: OutcomeSpec) => void;
}

interface OpenSpecs {
  specId: string;
  anchor: { x: number; y: number };
}

export function OutcomeZone({ specs, numericValuesByColumn: _numericValuesByColumn, onSpecAdd: _onSpecAdd, onSpecUpdate }: OutcomeZoneProps) {
  const { setNodeRef, isOver } = useDroppable({ id: encodeOutcomeDropId() });
  const [openSpecs, setOpenSpecs] = useState<OpenSpecs | null>(null);

  const isOverClasses = isOver ? 'border-2 border-dashed border-cyan-400' : 'border border-edge';

  const activeSpec = openSpecs ? specs.find((s) => s.id === openSpecs.specId) : null;

  return (
    <div
      ref={setNodeRef}
      data-testid="outcome-zone"
      className={`flex min-h-[6rem] flex-col gap-2 rounded-md p-3 ${isOverClasses}`}
    >
      {specs.length === 0 ? (
        <p className="text-sm text-content-tertiary">Drop a numeric column to set an outcome</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {specs.map((spec) => (
            <OutcomeCard
              key={spec.id}
              spec={spec}
              onSpecsClick={(anchor) => setOpenSpecs({ specId: spec.id, anchor })}
            />
          ))}
        </div>
      )}
      {openSpecs && activeSpec && (
        <SpecsPopover
          spec={activeSpec}
          anchor={openSpecs.anchor}
          onApply={(updated) => {
            onSpecUpdate(activeSpec.id, updated);
            setOpenSpecs(null);
          }}
          onClose={() => setOpenSpecs(null)}
        />
      )}
    </div>
  );
}
```

> **Note:** `onSpecAdd` + `numericValuesByColumn` are unused in C1's drop-acceptance path because routing dropped events from the `DndContext` parent requires an `onDragEnd` handler at the EditModeShell level — that wiring lives in Task 7. The props are accepted in the zone's surface so EditModeShell can pass them through; actual onDragEnd → derive → emit will be wired in Task 7. (Prefixing with `_` to satisfy lint.)

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @variscout/ui test OutcomeZone.test`
Expected: PASS (7/7).

- [ ] **Step 5: Commit**

```bash
git add packages/ui/src/components/Canvas/EditMode/OutcomeZone/index.tsx packages/ui/src/components/Canvas/EditMode/OutcomeZone/__tests__/OutcomeZone.test.tsx
git commit -m "feat(ui): OutcomeZone container with drop target and popover orchestration"
```

---

### Task 7 — Wire `OutcomeZone` into `EditModeShell` + drag-end routing + final build + PR

**Files:**

- Modify: `packages/ui/src/components/Canvas/EditMode/EditModeShell.tsx`
- Modify: `packages/ui/src/components/Canvas/EditMode/__tests__/EditModeShell.test.tsx`

- [ ] **Step 1: Inspect current EditModeShell structure**

Run: `grep -n "Outcome and factor" packages/ui/src/components/Canvas/EditMode/EditModeShell.tsx`
Expected: location of the placeholder paragraph to replace.

- [ ] **Step 2: Write failing test in EditModeShell.test.tsx**

Append to `__tests__/EditModeShell.test.tsx`:

```typescript
describe('EditModeShell — OutcomeZone wiring', () => {
  it('renders OutcomeZone in outcomes-factors zone (replaces top-half placeholder)', () => {
    render(
      <EditModeShell onDone={vi.fn()} outcomeSpecs={[]}>
        <div>process content</div>
      </EditModeShell>
    );
    expect(screen.getByTestId('outcome-zone')).toBeInTheDocument();
    expect(screen.queryByText(/outcome and factor zones arrive in phase c/i)).not.toBeInTheDocument();
  });

  it('keeps a thinner factor-zone placeholder (C2 slot)', () => {
    render(
      <EditModeShell onDone={vi.fn()} outcomeSpecs={[]}>
        <div>process content</div>
      </EditModeShell>
    );
    expect(screen.getByText(/factor zone arrives in c2/i)).toBeInTheDocument();
  });

  it('forwards onOutcomeSpecAdd / onOutcomeSpecUpdate to OutcomeZone', () => {
    const onSpecUpdate = vi.fn();
    const spec = createTestOutcomeSpec({ id: 'o-1', columnName: 'A' });
    render(
      <EditModeShell onDone={vi.fn()} outcomeSpecs={[spec]} onOutcomeSpecUpdate={onSpecUpdate}>
        <div>process content</div>
      </EditModeShell>
    );
    fireEvent.click(screen.getByRole('button', { name: /edit specs/i }));
    fireEvent.click(screen.getByRole('button', { name: /apply/i }));
    expect(onSpecUpdate).toHaveBeenCalledWith('o-1', expect.objectContaining({ id: 'o-1' }));
  });

  it('drop column on outcome zone fires onOutcomeSpecAdd with derived specs', () => {
    // Verify drag-end routing: simulate DndContext.onDragEnd with active id `column:Diameter` over `outcome-zone:singleton`.
    // Use DndContext's announcements + sensors API at a level where dnd-kit's drag end can be triggered programmatically.
    // If full programmatic drop is too brittle, replace with a direct test on EditModeShell's onDragEnd handler exported for testing or use a smaller integration approach (test the handler logic with a helper that EditModeShell uses internally).
    // Minimum acceptable: assert that when column:X dropped over outcome-zone:singleton, onOutcomeSpecAdd is called with (columnName: 'Diameter', { target: <mean>, cpkTarget: 1.33 }).
    // If dnd-kit DnD is too hard to trigger in test, extract the drag-end handler into a tested helper and call it directly.
    expect(true).toBe(true); // placeholder; implementer expands to real assertion
  });
});
```

> Note: the drop-routing test (4th) is intentionally a placeholder. The implementer should choose between: (a) extract the `onDragEnd` handler in EditModeShell into a small pure helper `handleOutcomeDrop(active, over, numericValuesByColumn)` and test it directly; (b) drive dnd-kit's KeyboardSensor programmatically. Option (a) is simpler and matches `ProcessMapBase`/`AuthorL3View` precedents. Adopt option (a) unless precedent says otherwise.

- [ ] **Step 3: Run test to verify failures**

Run: `pnpm --filter @variscout/ui test EditModeShell.test`
Expected: failures on the 3 new assertions (placeholder removed, factor-zone placeholder, onSpecUpdate forwarding).

- [ ] **Step 4: Modify EditModeShell**

Implementer steps:

1. Import `OutcomeZone`, `isOutcomeDropId`, `deriveDefaultSpecs`, `decodeColumnDragId` (from existing Palette codec).
2. Add to `EditModeShellProps`:
   ```typescript
   outcomeSpecs?: OutcomeSpec[];
   onOutcomeSpecAdd?: (columnName: string, derived: Partial<OutcomeSpec>) => void;
   onOutcomeSpecUpdate?: (specId: string, updated: OutcomeSpec) => void;
   ```
3. Replace the existing static placeholder paragraph with:
   ```tsx
   <OutcomeZone
     specs={outcomeSpecs ?? []}
     numericValuesByColumn={numericValuesByColumn ?? {}}
     onSpecAdd={onOutcomeSpecAdd ?? (() => {})}
     onSpecUpdate={onOutcomeSpecUpdate ?? (() => {})}
   />
   <p className="text-xs text-content-tertiary">Factor zone arrives in C2.</p>
   ```
4. If EditModeShell wraps its content with `DndContext`, add an `onDragEnd` handler that routes `column:<name>` → `outcome-zone:singleton` drops to `onOutcomeSpecAdd`. If `DndContext` lives one level up (verify with grep), document the handoff in a comment; alternatively extract a tested pure helper `handleOutcomeDrop(active, over, numericValuesByColumn, onOutcomeSpecAdd)` used by whichever component owns the context.

- [ ] **Step 5: Run test to verify all pass**

Run: `pnpm --filter @variscout/ui test EditModeShell.test`
Expected: PASS for all assertions.

- [ ] **Step 6: Run full ui test suite + build**

Run: `pnpm --filter @variscout/ui test && pnpm --filter @variscout/ui build`
Expected: 2191+ tests pass, build clean (catches type drift per `feedback_ui_build_before_merge`).

- [ ] **Step 7: Push branch + open PR**

```bash
git add packages/ui/src/components/Canvas/EditMode/EditModeShell.tsx packages/ui/src/components/Canvas/EditMode/__tests__/EditModeShell.test.tsx
git commit -m "feat(ui): wire OutcomeZone into EditModeShell + drag-end routing"
git push -u origin feat/wedge-v1-ccj-c-1-outcome-zone
gh pr create --title "feat(ui): PR-CCJ-C1 Outcome zone + specs popover" --body "$(cat <<'EOF'
## Summary

- New `<OutcomeZone>` drop target in EditModeShell's Outcomes & Factors zone (top half)
- `OutcomeCard` primitive with direction indicator + spec pills + ⚙ button
- `SpecsPopover` with characteristicType-aware LSL/USL disabling (per spec §3.2.1)
- `deriveDefaultSpecs` pure helper (mean-as-target for nominalIsBest, undefined otherwise)
- `encodeOutcomeDropId` codec — singleton `outcome-zone:singleton`
- Drag-end routing: dropping `column:<name>` on the zone fires `onOutcomeSpecAdd(columnName, derived)`

Implements Phase C master sequencer PR-CCJ-C1 against spec §3.2, §3.2.1, §3.2.2 (see docs/superpowers/plans/2026-05-27-canvas-connection-journey-c-master-plan.md).

## Test plan

- [ ] `pnpm --filter @variscout/ui test` — green (incl. new OutcomeZone tests)
- [ ] `pnpm --filter @variscout/ui build` — clean (type drift catch)
- [ ] `bash scripts/pr-ready-check.sh` — full pre-merge gauntlet green
- [ ] Spec self-check: drop numeric column into OutcomeZone → OutcomeCard renders with derived target; ⚙ opens SpecsPopover; LSL disabled for smallerIsBetter, USL disabled for largerIsBetter; Apply updates pills; multi-outcome wraps horizontally

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

- [ ] **Step 8: Final branch review by Opus**

Dispatch Opus code-reviewer subagent — must STEP 0 `git fetch && git checkout feat/wedge-v1-ccj-c-1-outcome-zone && git branch --show-current` before review (per `feedback_code_review_subagent_must_checkout_pr_branch`).

- [ ] **Step 9: Merge with `--merge --delete-branch` (NOT `--squash`)**

```bash
cd /Users/jukka-mattiturtiainen/Projects/VariScout_lite
gh pr merge feat/wedge-v1-ccj-c-1-outcome-zone --merge --delete-branch
git worktree remove .worktrees/feat/wedge-v1-ccj-c-1-outcome-zone --force
git pull --ff-only
```

---

## Verification

After all 7 tasks merge:

1. `pnpm --filter @variscout/ui test` — all OutcomeZone + EditModeShell tests green; no regressions
2. `pnpm --filter @variscout/ui build` — clean (catches type drift)
3. `pnpm test` (turbo) — global suites green
4. `bash scripts/pr-ready-check.sh` — full pre-merge gauntlet green
5. Spec self-check: dropping a numeric column from palette into OutcomeZone creates an OutcomeCard with derived specs; `⚙` opens SpecsPopover; LSL disabled for smallerIsBetter / USL disabled for largerIsBetter; Apply updates the card pills; multi-outcome wraps horizontally

## Out of scope (this PR)

Deferred to **C2:**

- `<FactorZone>` rendering — bottom half of Outcomes & Factors zone keeps a thinner placeholder
- `ImprovementProjectFactorControl.stepId` field extension
- Global vs step-bound factor styling

Deferred to **C3:**

- `<ProcessStructureZone>` — children slot still hosts the existing CanvasWorkspace
- Emergent step boxes from categorical drops
- Step-bound drop ids (`factor-zone:step:<stepId>`, `outcome-zone:step:<stepId>`)

Deferred to **E1 (Charter modal):**

- Persistence of `outcomeSpecs` to the IP blob — C1 state is prop-driven; consumer (PWA / Azure app) wires Zustand bridge in E1

Deferred to **D1 (timings):**

- Derived chips (`✨ Lead_time`, etc.) appearing in palette

Deferred to **F1 (smart routing):**

- Ghost-suggested heuristics on numeric column chips

## Execution model

Per `feedback_subagent_driven_default` + `feedback_one_worktree_per_agent`:

- **Worktree:** `.worktrees/feat/wedge-v1-ccj-c-1-outcome-zone/` — main session stays at repo root
- **Per task:** Sonnet implementer + Sonnet spec reviewer + Sonnet code-quality reviewer (each task is well-specified TDD against 1–3 files)
- **Final branch review:** Opus on full diff before merge — must STEP 0 `git checkout` the PR branch
- **Merge:** `gh pr merge --merge --delete-branch` (NEVER `--squash`)
- **Subagent constraints:** NEVER `--no-verify`; NEVER add migration helpers / back-compat shims; operate ONLY in assigned worktree
- **After merge:** update `[[canvas-connection-journey]]` memory with C1 shipped outcomes; flag C2 as next

## Related

- [Phase C master sequencer](./2026-05-27-canvas-connection-journey-c-master-plan.md)
- [Canvas Connection Journey spec](../specs/2026-05-26-canvas-connection-journey-design.md) §3.2, §3.2.1, §3.2.2
- [Canvas Connection Journey master plan](./2026-05-26-canvas-connection-journey-master-plan.md)
- Memory: `[[canvas-connection-journey]]`, `[[wedge-v1]]`, `[[feedback_subagent_driven_default]]`, `[[feedback_one_worktree_per_agent]]`, `[[feedback_preserve_commit_history]]`, `[[feedback_ui_build_before_merge]]`
