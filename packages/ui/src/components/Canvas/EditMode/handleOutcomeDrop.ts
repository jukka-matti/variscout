import type { OutcomeSpec } from '@variscout/core';
import { decodeColumnDragId } from './Palette/encodeColumnDragId';
import { deriveDefaultSpecs } from './OutcomeZone/deriveDefaultSpecs';
import { decodeOutcomeDropId } from './OutcomeZone/encodeOutcomeDropId';

/**
 * Arguments to {@link handleOutcomeDrop}.
 *
 * `activeId` / `overId` mirror the `DragEndEvent` fields from `@dnd-kit/core`
 * (the helper is parent-agnostic — extracted as a pure function so it can be
 * unit-tested without rendering a `DndContext`). `numericValuesByColumn`
 * sources the raw values used by {@link deriveDefaultSpecs} to seed a
 * nominal-is-best target. `onOutcomeSpecAdd` receives the decoded column name,
 * derived spec, and an optional `stepId` — `undefined` for the singleton
 * outcome zone, a concrete id for a per-step zone.
 */
export interface OutcomeDropArgs {
  activeId: string;
  overId: string | undefined;
  numericValuesByColumn: Record<string, number[]>;
  onOutcomeSpecAdd: (columnName: string, derived: Partial<OutcomeSpec>, stepId?: string) => void;
}

/**
 * Routes a `column:<name>` → `outcome-zone:*` drag-end into an
 * `onOutcomeSpecAdd(columnName, derivedSpec, stepId?)` call. Returns `true`
 * when the drop was consumed (so the caller can short-circuit other drop
 * handlers in the same `DndContext`), `false` otherwise.
 *
 * Routing:
 *   - `column:<name>` → `outcome-zone:singleton` ⇒ `onOutcomeSpecAdd(name, derived, undefined)`
 *   - `column:<name>` → `outcome-zone:step:<stepId>` ⇒ `onOutcomeSpecAdd(name, derived, stepId)`
 *
 * Default characteristic type is `'nominalIsBest'` — matches the Phase C1 spec.
 * The popover is the place to switch type after the spec lands.
 *
 * Pure helper: no React, no DOM, no `@dnd-kit/core` runtime. Intended to be
 * called from the inlined edit chrome's `DndContext.onDragEnd` (routed via
 * `handleEditModeDragEnd`); Canvas keeps a separate inner DndContext for
 * chip→step routing.
 */
export function handleOutcomeDrop({
  activeId,
  overId,
  numericValuesByColumn,
  onOutcomeSpecAdd,
}: OutcomeDropArgs): boolean {
  if (!overId) return false;
  const decoded = decodeOutcomeDropId(overId);
  if (!decoded) return false;
  const columnName = decodeColumnDragId(activeId);
  if (!columnName) return false;
  const values = numericValuesByColumn[columnName] ?? [];
  const derived = deriveDefaultSpecs(values, 'nominalIsBest');
  const stepId = decoded.scope === 'step' ? decoded.stepId : undefined;
  onOutcomeSpecAdd(columnName, derived, stepId);
  return true;
}
