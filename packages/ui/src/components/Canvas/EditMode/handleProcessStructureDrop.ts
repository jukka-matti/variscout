import { decodeColumnDragId } from './Palette/encodeColumnDragId';
import { isProcessDropId } from './ProcessZone/encodeProcessDropId';

/**
 * Arguments to {@link handleProcessStructureDrop}.
 *
 * `activeId` / `overId` mirror the `DragEndEvent` fields from `@dnd-kit/core`
 * (the helper is parent-agnostic — extracted as a pure function so it can be
 * unit-tested without rendering a `DndContext`). `categoricalDistinctValuesByColumn`
 * maps column names to their ordered distinct values; only columns present in
 * this map are eligible for process-zone materialization (numeric columns are
 * absent and therefore fall through to downstream drop handlers).
 */
export interface ProcessStructureDropArgs {
  activeId: string;
  overId: string | undefined;
  categoricalDistinctValuesByColumn: Record<string, string[]>;
  /** Called with the ordered distinct values and the source column name.
   *  The receiver (CanvasWorkspace.handleStepsReplace) passes them straight
   *  to `addStepsFromColumn` — canonical ids are minted there. The old
   *  `step-${columnName}-${idx}` pre-mint was discarded on arrival (IM-0b). */
  onStepsReplace: (distinctValues: string[], sourceColumnName: string) => void;
}

/**
 * Routes a `column:<name>` → `process-zone:singleton` drag-end into an
 * `onStepsReplace(distinctValues, columnName)` call. Returns `true` when the
 * drop was consumed (so the caller can short-circuit other drop handlers in
 * the same `DndContext`), `false` otherwise.
 *
 * Guard sequence:
 *   1. `overId` must be `'process-zone:singleton'` — otherwise not a process drop.
 *   2. `activeId` must decode to a `column:<name>` — otherwise not a column drag.
 *   3. The decoded column must appear in `categoricalDistinctValuesByColumn` —
 *      numeric columns are absent and must fall through to the outcome handler.
 *
 * On match: passes the ordered distinct values directly to `onStepsReplace` —
 * no intermediate `ExtractedStep[]` with throwaway ids (IM-0b).
 *
 * Pure helper: no React, no DOM, no `@dnd-kit/core` runtime. Sibling of
 * {@link handleOutcomeDrop} and {@link handleFactorDrop}.
 */
export function handleProcessStructureDrop({
  activeId,
  overId,
  categoricalDistinctValuesByColumn,
  onStepsReplace,
}: ProcessStructureDropArgs): boolean {
  if (!overId || !isProcessDropId(overId)) return false;
  const columnName = decodeColumnDragId(activeId);
  if (!columnName) return false;
  const distinctValues = categoricalDistinctValuesByColumn[columnName];
  if (!distinctValues) return false;
  onStepsReplace(distinctValues, columnName);
  return true;
}
