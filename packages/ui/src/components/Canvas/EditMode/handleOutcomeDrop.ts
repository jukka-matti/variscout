import type { OutcomeSpec } from '@variscout/core';
import { decodeColumnDragId } from './Palette/encodeColumnDragId';
import { deriveDefaultSpecs } from './OutcomeZone/deriveDefaultSpecs';
import { isOutcomeDropId } from './OutcomeZone/encodeOutcomeDropId';

/**
 * Arguments to {@link handleOutcomeDrop}.
 *
 * `activeId` / `overId` mirror the `DragEndEvent` fields from `@dnd-kit/core`
 * (the helper is parent-agnostic — extracted as a pure function so it can be
 * unit-tested without rendering a `DndContext`). `numericValuesByColumn`
 * sources the raw values used by {@link deriveDefaultSpecs} to seed a
 * nominal-is-best target.
 */
export interface OutcomeDropArgs {
  activeId: string;
  overId: string | undefined;
  numericValuesByColumn: Record<string, number[]>;
  onOutcomeSpecAdd: (columnName: string, derived: Partial<OutcomeSpec>) => void;
}

/**
 * Routes a `column:<name>` → `outcome-zone:singleton` drag-end into an
 * `onOutcomeSpecAdd(columnName, derivedSpec)` call. Returns `true` when the
 * drop was consumed (so the caller can short-circuit other drop handlers in
 * the same `DndContext`), `false` otherwise.
 *
 * Default characteristic type is `'nominalIsBest'` — matches the Phase C1 spec.
 * The popover is the place to switch type after the spec lands.
 *
 * Pure helper: no React, no DOM, no `@dnd-kit/core` runtime. Intended to be
 * called from EditModeShell's own `DndContext.onDragEnd` (routed via
 * `handleEditModeDragEnd`); Canvas keeps a separate inner DndContext for
 * chip→step routing.
 */
export function handleOutcomeDrop({
  activeId,
  overId,
  numericValuesByColumn,
  onOutcomeSpecAdd,
}: OutcomeDropArgs): boolean {
  if (!overId || !isOutcomeDropId(overId)) return false;
  const columnName = decodeColumnDragId(activeId);
  if (!columnName) return false;
  const values = numericValuesByColumn[columnName] ?? [];
  const derived = deriveDefaultSpecs(values, 'nominalIsBest');
  onOutcomeSpecAdd(columnName, derived);
  return true;
}
