import { decodeColumnDragId } from './Palette/encodeColumnDragId';
import { decodeFactorDropId } from './FactorZone/encodeFactorDropId';

/**
 * Arguments to {@link handleFactorDrop}.
 *
 * `activeId` / `overId` mirror the `DragEndEvent` fields from `@dnd-kit/core`
 * (the helper is parent-agnostic — extracted as a pure function so it can be
 * unit-tested without rendering a `DndContext`). `onFactorControlAdd` receives
 * the decoded column name plus an optional `stepId` — `undefined` for the
 * global factor zone, a concrete id for a per-step zone.
 */
export interface FactorDropArgs {
  activeId: string;
  overId: string | undefined;
  onFactorControlAdd: (columnName: string, stepId?: string) => void;
}

/**
 * Pure drag-end router for column → factor-zone drops.
 *
 * Returns `true` if the drop was consumed (short-circuit downstream routing),
 * `false` otherwise. Invoked from the inlined edit chrome's
 * `DndContext.onDragEnd` (routed via `handleEditModeDragEnd`); Canvas keeps a
 * separate inner DndContext for chip→step routing.
 *
 * Routing:
 *   - `column:<name>` → `factor-zone:global` ⇒ `onFactorControlAdd(name, undefined)`
 *   - `column:<name>` → `factor-zone:step:<stepId>` ⇒ `onFactorControlAdd(name, stepId)`
 *
 * Pure helper: no React, no DOM, no `@dnd-kit/core` runtime. Sibling of
 * {@link handleOutcomeDrop}.
 */
export function handleFactorDrop({
  activeId,
  overId,
  onFactorControlAdd,
}: FactorDropArgs): boolean {
  if (!overId) return false;
  const decoded = decodeFactorDropId(overId);
  if (!decoded) return false;
  const columnName = decodeColumnDragId(activeId);
  if (!columnName) return false;
  const stepId = decoded.scope === 'step' ? decoded.stepId : undefined;
  onFactorControlAdd(columnName, stepId);
  return true;
}
