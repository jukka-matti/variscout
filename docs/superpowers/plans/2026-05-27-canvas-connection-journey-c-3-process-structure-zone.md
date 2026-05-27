---
tier: ephemeral
purpose: build
title: PR-CCJ-C3 — Process structure zone + emergent step model (single PR, 3 phases)
status: active
date: 2026-05-27
layer: spec
---

# PR-CCJ-C3 — Process structure zone + emergent step model (single PR, 3 phases)

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` to implement task-by-task. Each task is bite-sized TDD against 1–3 files. Single PR with three internal phases (commit boundaries); one final Opus branch reviewer at the end.

**Goal:** Replace EditModeShell's process-structure children slot with a fully drop-aware `<ProcessStructureZone>` that materializes emergent step boxes from a categorical column drop, and exposes internal-Y / internal-X drop receivers that finally consume the step-bound drop ids (`outcome-zone:step:<stepId>`, `factor-zone:step:<stepId>`).

**Architecture:** Reuses the C1/C2 pattern (pure helpers + codec + `useDroppable` container + composer extension). C3 extends `encodeOutcomeDropId` to a discriminated union (mirroring C2's factor codec), adds `encodeProcessDropId` (singleton), and inserts a process route into `handleEditModeDragEnd` that short-circuits BEFORE outcome (so categorical drops on the process zone don't fall through to the outcome route).

**Tech Stack:** TypeScript, React, `@dnd-kit/core`, Vitest, happy-dom, Tailwind v4.

**Spec being implemented:** [`docs/superpowers/specs/2026-05-26-canvas-connection-journey-design.md`](../specs/2026-05-26-canvas-connection-journey-design.md) §3.3, §3.3.1, §3.4 (partial — slot reservations only), §4.2, §4.3 (partial).

**Parent master plan:** [`2026-05-27-canvas-connection-journey-c-master-plan.md`](./2026-05-27-canvas-connection-journey-c-master-plan.md) §"PR-CCJ-C3".

**Depends on:** C1 (Outcome zone) + C2 (Factors zone + step-bound model). Both shipped at `3451a5ec`.

---

## Context

C1 + C2 shipped on main at `3451a5ec`. The canvas Edit mode now accepts numeric columns into the global Outcome zone and global Factor zone, and the factor codec already supports `factor-zone:step:<stepId>` drops — **but no drop target consumes those yet**. C3 builds the third zone column: process structure. Dropping a categorical column with ≤30 distinct values (per `parsingProfile.ts:250-256`) materializes emergent step boxes from those values; each step box hosts an internal-Y section (step-bound outcomes) + an internal-X section (step-bound factors).

After C3, the canvas Edit mode is a fully drop-aware authoring surface. Phase D (timings) and Phase E (Charter modal persistence) build on top of locked-in step ids.

**Existing primitives reused (no rework):**

- `ImprovementProjectOutcomeGoal.stepId?` (already declared at `packages/core/src/improvementProject/types.ts:36`)
- `ImprovementProjectFactorControl.stepId?` (shipped in C2 at `packages/core/src/improvementProject/types.ts:46`)
- `encodeFactorDropId('global' | { stepId })` (shipped in C2 — step-bound branch ready, just unconsumed until C3)
- `handleEditModeDragEnd` composer (C3 inserts a process route + extends outcome route)
- `EditModeShell` props `steps?: { id; name }[]` + `factorControls` + `onFactorControlAdd(columnName, stepId?)` (all in place from C2)
- Parsing profile categorical detection (`packages/core/src/parser/parsingProfile.ts:250-256`)

**What's new in C3:**

- `encodeProcessDropId` (new singleton codec `process-zone:singleton`)
- `encodeOutcomeDropId` extension to discriminated union (mirror factor codec shape)
- `extractStepsFromCategoricalColumn` pure helper
- `<ProcessStructureZone>` container + `<StepBox>` primitive
- `handleProcessStructureDrop` + outcome-drop helper extension
- Test factory `createTestStep()`

**No persistence in C3.** State remains prop-driven; consumer (PWA / Azure app) wires Zustand bridge in E1 (Charter modal). Per `feedback_wedge_v1_no_migration_no_backcompat` — direct adds, no shims.

---

## Phase 1 — Process zone exists + materializes steps from categorical drops

### Task 1: Test factory + codec + extract helper

**Files:**

- Create: `packages/ui/src/test-utils/step.ts`
- Create: `packages/ui/src/components/Canvas/EditMode/ProcessZone/encodeProcessDropId.ts`
- Create: `packages/ui/src/components/Canvas/EditMode/ProcessZone/extractStepsFromCategoricalColumn.ts`
- Test: `packages/ui/src/components/Canvas/EditMode/ProcessZone/__tests__/encodeProcessDropId.test.ts`
- Test: `packages/ui/src/components/Canvas/EditMode/ProcessZone/__tests__/extractStepsFromCategoricalColumn.test.ts`

- [ ] **Step 1: Write the test factory**

```typescript
// packages/ui/src/test-utils/step.ts
export interface TestStep {
  id: string;
  name: string;
  order: number;
}

let counter = 0;

export function createTestStep(overrides: Partial<TestStep> = {}): TestStep {
  counter += 1;
  return {
    id: `step-test-${counter}`,
    name: `Step ${counter}`,
    order: counter - 1,
    ...overrides,
  };
}
```

- [ ] **Step 2: Write failing tests for the codec**

```typescript
// packages/ui/src/components/Canvas/EditMode/ProcessZone/__tests__/encodeProcessDropId.test.ts
import { describe, expect, it } from 'vitest';
import { encodeProcessDropId, isProcessDropId, PROCESS_ZONE_DROP_ID } from '../encodeProcessDropId';

describe('encodeProcessDropId', () => {
  it('returns the singleton drop id', () => {
    expect(encodeProcessDropId()).toBe('process-zone:singleton');
  });

  it('matches the exported constant', () => {
    expect(encodeProcessDropId()).toBe(PROCESS_ZONE_DROP_ID);
  });
});

describe('isProcessDropId', () => {
  it('returns true for the canonical id', () => {
    expect(isProcessDropId('process-zone:singleton')).toBe(true);
  });

  it('returns false for similar but distinct values', () => {
    expect(isProcessDropId('process-zone:other')).toBe(false);
    expect(isProcessDropId('outcome-zone:singleton')).toBe(false);
    expect(isProcessDropId('factor-zone:global')).toBe(false);
  });

  it('returns false for non-string values', () => {
    expect(isProcessDropId(undefined)).toBe(false);
    expect(isProcessDropId(null)).toBe(false);
    expect(isProcessDropId(42)).toBe(false);
  });
});
```

- [ ] **Step 3: Implement the codec**

```typescript
// packages/ui/src/components/Canvas/EditMode/ProcessZone/encodeProcessDropId.ts
export const PROCESS_ZONE_DROP_ID = 'process-zone:singleton' as const;
export type ProcessZoneDropId = typeof PROCESS_ZONE_DROP_ID;

export function encodeProcessDropId(): ProcessZoneDropId {
  return PROCESS_ZONE_DROP_ID;
}

export function isProcessDropId(value: unknown): value is ProcessZoneDropId {
  return value === PROCESS_ZONE_DROP_ID;
}
```

- [ ] **Step 4: Write failing tests for the extract helper**

```typescript
// packages/ui/src/components/Canvas/EditMode/ProcessZone/__tests__/extractStepsFromCategoricalColumn.test.ts
import { describe, expect, it } from 'vitest';
import { extractStepsFromCategoricalColumn } from '../extractStepsFromCategoricalColumn';

describe('extractStepsFromCategoricalColumn', () => {
  it('returns empty array for empty distinct values', () => {
    expect(extractStepsFromCategoricalColumn('Process_step', [])).toEqual([]);
  });

  it('builds one step per distinct value, preserving order', () => {
    const steps = extractStepsFromCategoricalColumn('Process_step', ['Mix', 'Fill', 'Seal']);
    expect(steps).toHaveLength(3);
    expect(steps.map(s => s.name)).toEqual(['Mix', 'Fill', 'Seal']);
    expect(steps.map(s => s.order)).toEqual([0, 1, 2]);
  });

  it('generates deterministic ids from column name + index', () => {
    const steps = extractStepsFromCategoricalColumn('Process_step', ['Mix', 'Fill']);
    expect(steps[0]?.id).toBe('step-Process_step-0');
    expect(steps[1]?.id).toBe('step-Process_step-1');
  });

  it('handles single-value categorical', () => {
    const steps = extractStepsFromCategoricalColumn('OnlyOne', ['Solo']);
    expect(steps).toEqual([{ id: 'step-OnlyOne-0', name: 'Solo', order: 0 }]);
  });
});
```

- [ ] **Step 5: Implement the extract helper**

```typescript
// packages/ui/src/components/Canvas/EditMode/ProcessZone/extractStepsFromCategoricalColumn.ts
export interface ExtractedStep {
  id: string;
  name: string;
  order: number;
}

export function extractStepsFromCategoricalColumn(
  columnName: string,
  distinctValues: string[]
): ExtractedStep[] {
  return distinctValues.map((value, idx) => ({
    id: `step-${columnName}-${idx}`,
    name: value,
    order: idx,
  }));
}
```

- [ ] **Step 6: Run tests + commit**

```bash
pnpm --filter @variscout/ui test -- ProcessZone/__tests__
git add packages/ui/src/test-utils/step.ts packages/ui/src/components/Canvas/EditMode/ProcessZone/
git commit -m "feat(wedge-v1): C3 task 1 — process zone codec + step extract helper + test factory"
```

### Task 2: `handleProcessStructureDrop` + composer wiring

**Files:**

- Create: `packages/ui/src/components/Canvas/EditMode/handleProcessStructureDrop.ts`
- Modify: `packages/ui/src/components/Canvas/EditMode/handleEditModeDragEnd.ts`
- Test: `packages/ui/src/components/Canvas/EditMode/__tests__/handleProcessStructureDrop.test.ts`
- Test: update existing `__tests__/handleEditModeDragEnd.test.ts` for new route ordering

- [ ] **Step 1: Write failing tests for `handleProcessStructureDrop`**

```typescript
import { describe, expect, it, vi } from 'vitest';
import { handleProcessStructureDrop } from '../handleProcessStructureDrop';

describe('handleProcessStructureDrop', () => {
  const baseArgs = {
    categoricalDistinctValuesByColumn: { Process_step: ['Mix', 'Fill', 'Seal'] },
    onStepsReplace: vi.fn(),
  };

  it('returns false when overId is undefined', () => {
    const onStepsReplace = vi.fn();
    expect(
      handleProcessStructureDrop({
        ...baseArgs,
        activeId: 'column:Process_step',
        overId: undefined,
        onStepsReplace,
      })
    ).toBe(false);
    expect(onStepsReplace).not.toHaveBeenCalled();
  });

  it('returns false when overId is not the process drop id', () => {
    const onStepsReplace = vi.fn();
    expect(
      handleProcessStructureDrop({
        ...baseArgs,
        activeId: 'column:Process_step',
        overId: 'outcome-zone:singleton',
        onStepsReplace,
      })
    ).toBe(false);
    expect(onStepsReplace).not.toHaveBeenCalled();
  });

  it('returns false when activeId is not a column drag id', () => {
    const onStepsReplace = vi.fn();
    expect(
      handleProcessStructureDrop({
        ...baseArgs,
        activeId: 'something-else',
        overId: 'process-zone:singleton',
        onStepsReplace,
      })
    ).toBe(false);
    expect(onStepsReplace).not.toHaveBeenCalled();
  });

  it('returns false when column has no distinct values registered', () => {
    const onStepsReplace = vi.fn();
    expect(
      handleProcessStructureDrop({
        categoricalDistinctValuesByColumn: {},
        activeId: 'column:Process_step',
        overId: 'process-zone:singleton',
        onStepsReplace,
      })
    ).toBe(false);
    expect(onStepsReplace).not.toHaveBeenCalled();
  });

  it('calls onStepsReplace with extracted steps + source column when all conditions match', () => {
    const onStepsReplace = vi.fn();
    const result = handleProcessStructureDrop({
      ...baseArgs,
      activeId: 'column:Process_step',
      overId: 'process-zone:singleton',
      onStepsReplace,
    });
    expect(result).toBe(true);
    expect(onStepsReplace).toHaveBeenCalledWith(
      [
        { id: 'step-Process_step-0', name: 'Mix', order: 0 },
        { id: 'step-Process_step-1', name: 'Fill', order: 1 },
        { id: 'step-Process_step-2', name: 'Seal', order: 2 },
      ],
      'Process_step'
    );
  });
});
```

- [ ] **Step 2: Implement `handleProcessStructureDrop`**

Read `handleOutcomeDrop.ts` for the exact `decodeColumnDragId` pattern + import shape. Mirror its structure.

```typescript
// packages/ui/src/components/Canvas/EditMode/handleProcessStructureDrop.ts
import { decodeColumnDragId } from './Palette/encodeColumnDragId'; // verify path during implementation
import { isProcessDropId } from './ProcessZone/encodeProcessDropId';
import {
  extractStepsFromCategoricalColumn,
  type ExtractedStep,
} from './ProcessZone/extractStepsFromCategoricalColumn';

export interface ProcessStructureDropArgs {
  activeId: string;
  overId: string | undefined;
  categoricalDistinctValuesByColumn: Record<string, string[]>;
  onStepsReplace: (steps: ExtractedStep[], sourceColumnName: string) => void;
}

export function handleProcessStructureDrop({
  activeId,
  overId,
  categoricalDistinctValuesByColumn,
  onStepsReplace,
}: ProcessStructureDropArgs): boolean {
  if (overId === undefined || !isProcessDropId(overId)) return false;

  const columnName = decodeColumnDragId(activeId);
  if (columnName == null) return false;

  const distinctValues = categoricalDistinctValuesByColumn[columnName];
  if (!distinctValues) return false;

  const steps = extractStepsFromCategoricalColumn(columnName, distinctValues);
  onStepsReplace(steps, columnName);
  return true;
}
```

- [ ] **Step 3: Modify `handleEditModeDragEnd` to insert process route FIRST**

The composer must short-circuit on process BEFORE outcome, because a categorical column lookup in `categoricalDistinctValuesByColumn` is the disambiguator (numeric columns won't be in that lookup, so they fall through cleanly to outcome).

```typescript
// packages/ui/src/components/Canvas/EditMode/handleEditModeDragEnd.ts
import type { DragEndEvent } from '@dnd-kit/core';
import { handleOutcomeDrop } from './handleOutcomeDrop';
import { handleFactorDrop } from './handleFactorDrop';
import { handleProcessStructureDrop } from './handleProcessStructureDrop';
import type { ExtractedStep } from './ProcessZone/extractStepsFromCategoricalColumn';
import type { OutcomeSpec } from '@variscout/core';

export interface EditModeDragEndArgs {
  numericValuesByColumn: Record<string, number[]>;
  categoricalDistinctValuesByColumn: Record<string, string[]>;
  onOutcomeSpecAdd?: (columnName: string, derived: Partial<OutcomeSpec>) => void;
  onFactorControlAdd?: (columnName: string, stepId?: string) => void;
  onStepsReplace?: (steps: ExtractedStep[], sourceColumnName: string) => void;
}

export function handleEditModeDragEnd(
  event: DragEndEvent,
  {
    numericValuesByColumn,
    categoricalDistinctValuesByColumn,
    onOutcomeSpecAdd,
    onFactorControlAdd,
    onStepsReplace,
  }: EditModeDragEndArgs
): void {
  const activeId = String(event.active.id);
  const overId = event.over?.id != null ? String(event.over.id) : undefined;

  if (onStepsReplace) {
    const consumed = handleProcessStructureDrop({
      activeId,
      overId,
      categoricalDistinctValuesByColumn,
      onStepsReplace,
    });
    if (consumed) return;
  }

  if (onOutcomeSpecAdd) {
    const consumed = handleOutcomeDrop({
      activeId,
      overId,
      numericValuesByColumn,
      onOutcomeSpecAdd,
    });
    if (consumed) return;
  }

  if (onFactorControlAdd) {
    handleFactorDrop({ activeId, overId, onFactorControlAdd });
  }
}
```

- [ ] **Step 4: Update existing `handleEditModeDragEnd` tests + add ordering assertion**

Add a test: numeric column dropped on `process-zone:singleton` does NOT trigger process route (no entry in `categoricalDistinctValuesByColumn`) and DOES fall through to outcome route if `overId` is `outcome-zone:singleton`. Existing tests will need the new `categoricalDistinctValuesByColumn` arg passed in their setup.

- [ ] **Step 5: Run tests + commit**

```bash
pnpm --filter @variscout/ui test -- EditMode/__tests__
git add packages/ui/src/components/Canvas/EditMode/handleProcessStructureDrop.ts \
        packages/ui/src/components/Canvas/EditMode/handleEditModeDragEnd.ts \
        packages/ui/src/components/Canvas/EditMode/__tests__/handleProcessStructureDrop.test.ts \
        packages/ui/src/components/Canvas/EditMode/__tests__/handleEditModeDragEnd.test.ts
git commit -m "feat(wedge-v1): C3 task 2 — handleProcessStructureDrop + composer wiring (process route short-circuits before outcome)"
```

### Task 3: `<ProcessStructureZone>` container + `<StepBox>` header

**Files:**

- Create: `packages/ui/src/components/Canvas/EditMode/ProcessZone/index.tsx`
- Create: `packages/ui/src/components/Canvas/EditMode/ProcessZone/StepBox.tsx`
- Test: `packages/ui/src/components/Canvas/EditMode/ProcessZone/__tests__/ProcessStructureZone.test.tsx`
- Test: `packages/ui/src/components/Canvas/EditMode/ProcessZone/__tests__/StepBox.test.tsx`

- [ ] **Step 1: Write failing tests for `<StepBox>` (header only at this phase)**

```typescript
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { StepBox } from '../StepBox';
import { createTestStep } from '../../../../../test-utils/step';

describe('StepBox', () => {
  it('renders step name as header text', () => {
    const step = createTestStep({ name: 'Mix' });
    render(<StepBox step={step} />);
    expect(screen.getByText('Mix')).toBeInTheDocument();
  });

  it('exposes data-testid using step id', () => {
    const step = createTestStep({ id: 'step-xyz' });
    render(<StepBox step={step} />);
    expect(screen.getByTestId('step-box-step-xyz')).toBeInTheDocument();
  });

  it('renders order indicator (1-indexed display)', () => {
    const step = createTestStep({ order: 0 });
    render(<StepBox step={step} />);
    expect(screen.getByText('1')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Implement `<StepBox>` (header only)**

```typescript
// packages/ui/src/components/Canvas/EditMode/ProcessZone/StepBox.tsx
import type { FC } from 'react';

export interface StepBoxStep {
  id: string;
  name: string;
  order: number;
}

export interface StepBoxProps {
  step: StepBoxStep;
}

export const StepBox: FC<StepBoxProps> = ({ step }) => {
  return (
    <div
      data-testid={`step-box-${step.id}`}
      className="flex min-w-0 flex-col rounded-md border border-edge bg-surface-primary p-2"
    >
      <header className="flex items-center gap-2">
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-surface-secondary text-xs text-content-secondary">
          {step.order + 1}
        </span>
        <span className="truncate text-sm font-medium text-content">{step.name}</span>
      </header>
    </div>
  );
};
```

- [ ] **Step 3: Write failing tests for `<ProcessStructureZone>`**

```typescript
import { DndContext } from '@dnd-kit/core';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ProcessStructureZone } from '../index';
import { createTestStep } from '../../../../../test-utils/step';

function renderInDnd(ui: React.ReactNode) {
  return render(<DndContext>{ui}</DndContext>);
}

describe('ProcessStructureZone', () => {
  it('renders the drop target wrapper with data-testid', () => {
    renderInDnd(<ProcessStructureZone steps={[]} />);
    expect(screen.getByTestId('process-structure-zone')).toBeInTheDocument();
  });

  it('shows empty-state hint when no steps', () => {
    renderInDnd(<ProcessStructureZone steps={[]} />);
    expect(
      screen.getByText(/Drop a categorical column to define process steps/i)
    ).toBeInTheDocument();
  });

  it('renders one StepBox per step in order', () => {
    const steps = [
      createTestStep({ id: 'step-1', name: 'Mix', order: 0 }),
      createTestStep({ id: 'step-2', name: 'Fill', order: 1 }),
    ];
    renderInDnd(<ProcessStructureZone steps={steps} />);
    expect(screen.getByTestId('step-box-step-1')).toBeInTheDocument();
    expect(screen.getByTestId('step-box-step-2')).toBeInTheDocument();
    expect(screen.getByText('Mix')).toBeInTheDocument();
    expect(screen.getByText('Fill')).toBeInTheDocument();
  });

  it('does not render empty-state when steps present', () => {
    renderInDnd(<ProcessStructureZone steps={[createTestStep()]} />);
    expect(
      screen.queryByText(/Drop a categorical column to define process steps/i)
    ).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 4: Implement `<ProcessStructureZone>`**

```typescript
// packages/ui/src/components/Canvas/EditMode/ProcessZone/index.tsx
import { useDroppable } from '@dnd-kit/core';
import type { FC } from 'react';
import { encodeProcessDropId } from './encodeProcessDropId';
import { StepBox, type StepBoxStep } from './StepBox';

export interface ProcessStructureZoneProps {
  steps: StepBoxStep[];
}

export const ProcessStructureZone: FC<ProcessStructureZoneProps> = ({ steps }) => {
  const { setNodeRef, isOver } = useDroppable({ id: encodeProcessDropId() });

  const borderClass = isOver
    ? 'border-2 border-dashed border-cyan-400'
    : 'border border-edge';

  return (
    <div
      ref={setNodeRef}
      data-testid="process-structure-zone"
      className={`flex min-h-0 flex-1 flex-col gap-2 rounded-md ${borderClass} bg-surface-secondary p-3`}
    >
      {steps.length === 0 ? (
        <p className="text-sm text-content-tertiary">
          Drop a categorical column to define process steps
        </p>
      ) : (
        <div className="flex flex-row flex-wrap items-start gap-2">
          {[...steps]
            .sort((a, b) => a.order - b.order)
            .map((step) => (
              <StepBox key={step.id} step={step} />
            ))}
        </div>
      )}
    </div>
  );
};
```

- [ ] **Step 5: Run tests + commit**

```bash
pnpm --filter @variscout/ui test -- ProcessZone
git add packages/ui/src/components/Canvas/EditMode/ProcessZone/
git commit -m "feat(wedge-v1): C3 task 3 — ProcessStructureZone container + StepBox header"
```

### Task 4: Wire into `EditModeShell` + delete `children` slot + update CanvasWorkspace

**Files:**

- Modify: `packages/ui/src/components/Canvas/EditMode/EditModeShell.tsx`
- Modify: `packages/ui/src/components/Canvas/EditMode/__tests__/EditModeShell.test.tsx`
- Modify: `packages/ui/src/components/Canvas/CanvasWorkspace.tsx` (call site)
- Modify any other callers surfaced by grep

- [ ] **Step 1: Survey EditModeShell callers**

```bash
grep -rn "<EditModeShell" packages/ apps/
```

Expected: only `packages/ui/src/components/Canvas/CanvasWorkspace.tsx`. If other callers exist, factor them into the fix in this task.

- [ ] **Step 2: Write failing test on EditModeShell wiring**

```typescript
// add to EditModeShell.test.tsx
it('renders ProcessStructureZone with empty hint when steps=[]', () => {
  render(<EditModeShell {...baseProps} steps={[]} />);
  expect(screen.getByTestId('process-structure-zone')).toBeInTheDocument();
  expect(screen.getByText(/Drop a categorical column to define process steps/i)).toBeInTheDocument();
});

it('renders StepBox per step when steps populated', () => {
  render(
    <EditModeShell
      {...baseProps}
      steps={[
        { id: 'step-1', name: 'Mix', order: 0 },
        { id: 'step-2', name: 'Fill', order: 1 },
      ]}
    />
  );
  expect(screen.getByText('Mix')).toBeInTheDocument();
  expect(screen.getByText('Fill')).toBeInTheDocument();
});
```

- [ ] **Step 3: Modify `EditModeShell` to embed `<ProcessStructureZone>` and delete `children`**

Key changes:

1. Add prop: `categoricalDistinctValuesByColumn?: Record<string, string[]>`
2. Add prop: `onStepsReplace?: (steps, sourceColumnName) => void`
3. Update prop `steps?: { id: string; name: string; order: number }[]` (add `order`)
4. Delete `children: ReactNode` prop
5. Replace `<section aria-label="Process structure zone">{children}</section>` with `<section ...><ProcessStructureZone steps={steps ?? []} /></section>`
6. Update the `onDragEnd` callback to forward `categoricalDistinctValuesByColumn` and `onStepsReplace`

- [ ] **Step 4: Update `CanvasWorkspace.tsx` call site**

- Stop passing `children`
- Pass new props: `categoricalDistinctValuesByColumn={...}`, `onStepsReplace={...}`, `steps={...}`
- If the previous `children={<Canvas />}` rendered State-mode content, route it elsewhere (e.g., conditional `State` vs `Edit` mode rendering at the CanvasWorkspace level). Verify whether the current code uses different children for State vs Edit modes — if so, the Edit-mode path now embeds ProcessStructureZone via EditModeShell; the State-mode Canvas may need a sibling rendering path.

**Carefully read CanvasWorkspace.tsx around the EditModeShell call to decide how the State-mode Canvas continues to render.** If the survey shows EditMode + StateMode both currently pass `<Canvas />` as children, the right shape is likely:

- In EditMode: don't pass children, let EditModeShell own ProcessStructureZone
- In StateMode: render `<Canvas />` directly (not via EditModeShell)

If the call site is more entangled, escalate to Opus.

- [ ] **Step 5: Update `steps` prop shape across the codebase**

The C2 `steps` prop was `{ id: string; name: string }[]`. C3 adds `order: number`. Grep for `steps?:` and `steps:` usages within Canvas/EditMode and update consumers.

- [ ] **Step 6: Run full UI test + build + commit**

```bash
pnpm --filter @variscout/ui test
pnpm --filter @variscout/ui build
git add packages/ui/src/components/Canvas/
git commit -m "feat(wedge-v1): C3 task 4 — wire ProcessStructureZone into EditModeShell; delete children slot"
```

---

## Phase 2 — Step-bound drop receivers (internal Y + internal X live)

### Task 5: Extend `encodeOutcomeDropId` to discriminated union

**Files:**

- Modify: `packages/ui/src/components/Canvas/EditMode/OutcomeZone/encodeOutcomeDropId.ts`
- Modify: `packages/ui/src/components/Canvas/EditMode/OutcomeZone/__tests__/encodeOutcomeDropId.test.ts`
- Modify: `packages/ui/src/components/Canvas/EditMode/OutcomeZone/index.tsx` (call site)
- Modify any other callers / tests surfaced by grep

- [ ] **Step 1: Write failing tests for the discriminated codec**

Mirror `encodeFactorDropId.test.ts`. Test cases:

- `encodeOutcomeDropId('singleton')` → `'outcome-zone:singleton'`
- `encodeOutcomeDropId({ stepId: 'step-x' })` → `'outcome-zone:step:step-x'`
- `decodeOutcomeDropId('outcome-zone:singleton')` → `{ scope: 'singleton' }`
- `decodeOutcomeDropId('outcome-zone:step:step-x')` → `{ scope: 'step', stepId: 'step-x' }`
- `decodeOutcomeDropId('bogus')` → `null`
- `decodeOutcomeDropId('outcome-zone:step:')` → `null` (empty stepId rejected)
- `isOutcomeDropId('outcome-zone:step:step-x')` → `true`
- `isOutcomeDropId('outcome-zone:singleton')` → `true`
- `isOutcomeDropId('bogus')` → `false`

- [ ] **Step 2: Refactor the codec to mirror `encodeFactorDropId.ts` shape**

```typescript
// packages/ui/src/components/Canvas/EditMode/OutcomeZone/encodeOutcomeDropId.ts
export const OUTCOME_ZONE_SINGLETON_DROP_ID = 'outcome-zone:singleton' as const;
const OUTCOME_ZONE_STEP_PREFIX = 'outcome-zone:step:';

export type OutcomeDropScope = 'singleton' | { stepId: string };
export type OutcomeDropId = typeof OUTCOME_ZONE_SINGLETON_DROP_ID | `outcome-zone:step:${string}`;
export type DecodedOutcomeDropScope = { scope: 'singleton' } | { scope: 'step'; stepId: string };

export function encodeOutcomeDropId(scope: OutcomeDropScope): OutcomeDropId {
  if (scope === 'singleton') return OUTCOME_ZONE_SINGLETON_DROP_ID;
  return `${OUTCOME_ZONE_STEP_PREFIX}${scope.stepId}` as OutcomeDropId;
}

export function decodeOutcomeDropId(value: string): DecodedOutcomeDropScope | null {
  if (value === OUTCOME_ZONE_SINGLETON_DROP_ID) return { scope: 'singleton' };
  if (value.startsWith(OUTCOME_ZONE_STEP_PREFIX)) {
    const stepId = value.slice(OUTCOME_ZONE_STEP_PREFIX.length);
    if (stepId.length === 0) return null;
    return { scope: 'step', stepId };
  }
  return null;
}

export function isOutcomeDropId(value: unknown): value is OutcomeDropId {
  return typeof value === 'string' && decodeOutcomeDropId(value) !== null;
}
```

- [ ] **Step 3: Update existing `OutcomeZone/index.tsx` call site**

Change `useDroppable({ id: encodeOutcomeDropId() })` to `useDroppable({ id: encodeOutcomeDropId('singleton') })`.

- [ ] **Step 4: Run tests + commit**

```bash
pnpm --filter @variscout/ui test -- OutcomeZone
git commit -am "feat(wedge-v1): C3 task 5 — extend encodeOutcomeDropId to discriminated union"
```

### Task 6: Update `handleOutcomeDrop` to emit stepId + composer extension

**Files:**

- Modify: `packages/ui/src/components/Canvas/EditMode/handleOutcomeDrop.ts`
- Modify: `packages/ui/src/components/Canvas/EditMode/handleEditModeDragEnd.ts`
- Modify: `packages/ui/src/components/Canvas/EditMode/EditModeShell.tsx`
- Modify tests

- [ ] **Step 1: Write failing tests for handleOutcomeDrop step-bound emission**

Add tests:

- Drop on `'outcome-zone:singleton'` → `onOutcomeSpecAdd(columnName, derived, undefined)`
- Drop on `'outcome-zone:step:step-x'` → `onOutcomeSpecAdd(columnName, derived, 'step-x')`
- Drop on `'outcome-zone:step:'` (empty stepId) → not consumed (returns false)

- [ ] **Step 2: Modify `handleOutcomeDrop.ts`**

Decode scope via `decodeOutcomeDropId`; pass stepId to callback. Update `OutcomeDropArgs.onOutcomeSpecAdd` signature:

```typescript
export interface OutcomeDropArgs {
  activeId: string;
  overId: string | undefined;
  numericValuesByColumn: Record<string, number[]>;
  onOutcomeSpecAdd: (columnName: string, derived: Partial<OutcomeSpec>, stepId?: string) => void;
}
```

- [ ] **Step 3: Update `handleEditModeDragEnd` and `EditModeShell` to forward stepId**

`EditModeShell` `onOutcomeSpecAdd` prop becomes `(columnName, derived, stepId?) => void`. Update all test mocks.

- [ ] **Step 4: Run tests + commit**

```bash
pnpm --filter @variscout/ui test -- EditMode
git commit -am "feat(wedge-v1): C3 task 6 — handleOutcomeDrop emits stepId for step-bound drops"
```

### Task 7: Internal-Y drop receiver inside StepBox

**Files:**

- Modify: `packages/ui/src/components/Canvas/EditMode/ProcessZone/StepBox.tsx`
- Modify: `packages/ui/src/components/Canvas/EditMode/ProcessZone/__tests__/StepBox.test.tsx`

- [ ] **Step 1: Write failing tests for internal-Y**

```typescript
// add to StepBox.test.tsx
it('renders internal-Y section as a useDroppable target', () => {
  const step = createTestStep({ id: 'step-1' });
  renderInDnd(<StepBox step={step} />);
  expect(screen.getByTestId('step-box-step-1-internal-y')).toBeInTheDocument();
});

it('shows internal-Y empty hint', () => {
  const step = createTestStep({ id: 'step-1' });
  renderInDnd(<StepBox step={step} />);
  expect(screen.getByText(/Drop a numeric column for this step's outcome/i)).toBeInTheDocument();
});
```

(The `isOver` affordance test requires a DnD mock; defer the affordance assertion to the existing DnD mock pattern used in C2's `EditModeShell.test.tsx` — read that test for the technique.)

- [ ] **Step 2: Add internal-Y section to `<StepBox>`**

```typescript
import { useDroppable } from '@dnd-kit/core';
import { encodeOutcomeDropId } from '../OutcomeZone/encodeOutcomeDropId';

// inside StepBox:
const internalY = useDroppable({ id: encodeOutcomeDropId({ stepId: step.id }) });

// in JSX, below the header:
<section
  ref={internalY.setNodeRef}
  data-testid={`step-box-${step.id}-internal-y`}
  className={`mt-2 rounded-sm p-2 ${
    internalY.isOver ? 'border-2 border-dashed border-cyan-400' : 'border border-edge'
  }`}
>
  <p className="text-xs text-content-tertiary">
    Drop a numeric column for this step's outcome
  </p>
</section>
```

- [ ] **Step 3: Run tests + commit**

```bash
pnpm --filter @variscout/ui test -- ProcessZone
git commit -am "feat(wedge-v1): C3 task 7 — internal-Y drop receiver inside StepBox"
```

### Task 8: Internal-X drop receiver inside StepBox + end-to-end integration

**Files:**

- Modify: `packages/ui/src/components/Canvas/EditMode/ProcessZone/StepBox.tsx`
- Modify: `packages/ui/src/components/Canvas/EditMode/ProcessZone/__tests__/StepBox.test.tsx`
- Modify: `packages/ui/src/components/Canvas/EditMode/__tests__/EditModeShell.test.tsx` (end-to-end integration)

- [ ] **Step 1: Add internal-X section + tests (mirror internal-Y but use `encodeFactorDropId({ stepId })`)**

```typescript
import { encodeFactorDropId } from '../FactorZone/encodeFactorDropId';

const internalX = useDroppable({ id: encodeFactorDropId({ stepId: step.id }) });

<section
  ref={internalX.setNodeRef}
  data-testid={`step-box-${step.id}-internal-x`}
  className={`mt-2 rounded-sm p-2 ${
    internalX.isOver ? 'border-2 border-dashed border-cyan-400' : 'border border-edge'
  }`}
>
  <p className="text-xs text-content-tertiary">
    Drop a column for this step's factor
  </p>
</section>
```

- [ ] **Step 2: End-to-end integration test in `EditModeShell.test.tsx`**

Mirror C2's DnD mock pattern. Setup: render EditModeShell with steps + categorical + numeric drop sources. Assert:

- Drop categorical on process-zone → `onStepsReplace` fired
- After steps materialized, drop numeric on step's internal-Y → `onOutcomeSpecAdd` called with `stepId`
- Drop numeric on step's internal-X → `onFactorControlAdd` called with `stepId`

- [ ] **Step 3: Run full UI test suite + commit**

```bash
pnpm --filter @variscout/ui test
git commit -am "feat(wedge-v1): C3 task 8 — internal-X drop receiver + end-to-end integration"
```

---

## Phase 3 — Visual polish + slot reservations

### Task 9: Connector arrows between sequential steps + layout

**Files:**

- Modify: `packages/ui/src/components/Canvas/EditMode/ProcessZone/index.tsx`
- Modify: `packages/ui/src/components/Canvas/EditMode/ProcessZone/__tests__/ProcessStructureZone.test.tsx`

- [ ] **Step 1: Write failing tests for connector arrow + layout**

```typescript
it('renders connector arrows between consecutive steps when 2+ steps', () => {
  const steps = [
    createTestStep({ id: 'a', order: 0 }),
    createTestStep({ id: 'b', order: 1 }),
    createTestStep({ id: 'c', order: 2 }),
  ];
  renderInDnd(<ProcessStructureZone steps={steps} />);
  // 3 steps → 2 connectors
  expect(screen.getAllByTestId(/process-step-connector/)).toHaveLength(2);
});

it('renders no connector for single step', () => {
  renderInDnd(<ProcessStructureZone steps={[createTestStep()]} />);
  expect(screen.queryByTestId(/process-step-connector/)).not.toBeInTheDocument();
});
```

- [ ] **Step 2: Implement arrows interleaved with step boxes**

In `ProcessStructureZone`:

```typescript
const sortedSteps = [...steps].sort((a, b) => a.order - b.order);

<div className="flex flex-row flex-wrap items-center gap-2">
  {sortedSteps.map((step, idx) => (
    <React.Fragment key={step.id}>
      <StepBox step={step} />
      {idx < sortedSteps.length - 1 ? (
        <span
          data-testid={`process-step-connector-${idx}`}
          className="text-content-tertiary"
          aria-hidden="true"
        >
          →
        </span>
      ) : null}
    </React.Fragment>
  ))}
</div>
```

- [ ] **Step 3: Run tests + commit**

```bash
pnpm --filter @variscout/ui test -- ProcessZone
git commit -am "feat(wedge-v1): C3 task 9 — connector arrows between sequential steps"
```

### Task 10: Slot reservations (timingBadge + resourceIndicator) + empty-state polish

**Files:**

- Modify: `packages/ui/src/components/Canvas/EditMode/ProcessZone/StepBox.tsx`
- Modify: `packages/ui/src/components/Canvas/EditMode/ProcessZone/__tests__/StepBox.test.tsx`

- [ ] **Step 1: Write failing tests for slot reservations**

```typescript
it('renders timingBadge when provided', () => {
  renderInDnd(
    <StepBox step={createTestStep()} timingBadge={<span data-testid="td">⏱ 42m</span>} />
  );
  expect(screen.getByTestId('td')).toBeInTheDocument();
});

it('renders no timingBadge slot when not provided', () => {
  renderInDnd(<StepBox step={createTestStep()} />);
  expect(screen.queryByTestId('td')).not.toBeInTheDocument();
});

it('renders resourceIndicator when provided', () => {
  renderInDnd(
    <StepBox step={createTestStep()} resourceIndicator={<span data-testid="ri">× 2 reactors</span>} />
  );
  expect(screen.getByTestId('ri')).toBeInTheDocument();
});
```

- [ ] **Step 2: Add the optional props to `<StepBox>`**

```typescript
export interface StepBoxProps {
  step: StepBoxStep;
  timingBadge?: ReactNode;
  resourceIndicator?: ReactNode;
}

// in JSX header:
<header className="flex items-center gap-2">
  <span className="...order badge...">{step.order + 1}</span>
  <span className="...name...">{step.name}</span>
  {timingBadge ? <span className="ml-auto">{timingBadge}</span> : null}
  {resourceIndicator ? <span>{resourceIndicator}</span> : null}
</header>
```

- [ ] **Step 3: Run tests + final build + commit + PR**

```bash
pnpm --filter @variscout/ui test
pnpm --filter @variscout/ui build
bash scripts/pr-ready-check.sh
git commit -am "feat(wedge-v1): C3 task 10 — StepBox slot reservations (timingBadge + resourceIndicator)"
git push -u origin feat/wedge-v1-ccj-c-3-process-zone
gh pr create --title "feat(wedge-v1): C3 — process structure zone + emergent step model" --body "..."
```

---

## Verification (after all 10 tasks)

1. `pnpm --filter @variscout/ui test` — new + extended tests green; no regressions on prior ui suite
2. `pnpm --filter @variscout/ui build` — clean
3. `pnpm test` (turbo) — global suites green
4. `bash scripts/pr-ready-check.sh` — full pre-merge gauntlet green
5. **Spec self-check** (per `feedback_wedge_v1_no_migration_no_backcompat` browser walks skipped; `--chrome` only for visual-only assertions not catchable headlessly):
   - Empty state shown initially
   - Drop categorical (≤30 distinct values) → step boxes appear in distinct-value order
   - Drop second categorical → previous steps REPLACED
   - Drop numeric on process zone → falls through to outcome route (no consumption by process)
   - Drop numeric on step's internal-Y → `onOutcomeSpecAdd(columnName, derived, stepId)`
   - Drop numeric on step's internal-X → `onFactorControlAdd(columnName, stepId)`
   - Connector arrows between consecutive steps
6. **Final branch review by Opus** (must STEP 0 `git checkout` per `feedback_code_review_subagent_must_checkout_pr_branch`) covering all 10 commits

---

## Out of scope

Deferred to **D1 (Capture step timings):**

- Timing-badge content (`⏱ ~42 min`)
- Derived chips (`Lead_time`, `Total_work_time`)
- Resource-indicator population

Deferred to **E1 (Charter modal):**

- Persistence of `steps[]` to the IP blob
- Step removal via dragging chip back to palette

Deferred to **later polish:**

- Inline step rename
- ColumnChip `dropped` visual feedback

---

## Execution model

- **Worktree:** `.worktrees/feat/wedge-v1-ccj-c-3-process-zone/`
- **Per task:** Sonnet implementer + Sonnet spec reviewer + Sonnet code-quality reviewer
- **Task 4 may warrant Opus** if call-site survey reveals non-trivial CanvasWorkspace rewires
- **Final branch review:** Opus on full diff (10 commits) before merge — STEP 0 `git checkout`
- **Merge:** `gh pr merge --merge --delete-branch` (NEVER `--squash`)
- **Subagent constraints (forwarded to every dispatch):** NEVER `--no-verify`; NEVER migration helpers / back-compat shims; operate ONLY in worktree, never cd to main repo; skip browser walks for wedge V1
- **After merge:** update `[[canvas-connection-journey]]` memory; mark task #29 completed; flag PR-CCJ-D1 as next

---

## Related

- [[canvas-connection-journey]]
- [[wedge-v1]]
- [[feedback_subagent_driven_default]]
- [[feedback_slice_size_cap]]
- [[feedback_one_worktree_per_agent]]
- [[feedback_preserve_commit_history]]
- [[feedback_ui_build_before_merge]]
- [[feedback_wedge_v1_no_migration_no_backcompat]]
- [[feedback_subagent_no_verify]]
- [[feedback_code_review_subagent_must_checkout_pr_branch]]
- [[feedback_no_backcompat_clean_architecture]]
