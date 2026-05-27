import { decodeColumnDragId } from './Palette/encodeColumnDragId';
import { isProcessDropId } from './ProcessZone/encodeProcessDropId';
import {
  extractStepsFromCategoricalColumn,
  type ExtractedStep,
} from './ProcessZone/extractStepsFromCategoricalColumn';

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
  onStepsReplace: (steps: ExtractedStep[], sourceColumnName: string) => void;
}

/**
 * Routes a `column:<name>` → `process-zone:singleton` drag-end into an
 * `onStepsReplace(steps, columnName)` call. Returns `true` when the drop was
 * consumed (so the caller can short-circuit other drop handlers in the same
 * `DndContext`), `false` otherwise.
 *
 * Guard sequence:
 *   1. `overId` must be `'process-zone:singleton'` — otherwise not a process drop.
 *   2. `activeId` must decode to a `column:<name>` — otherwise not a column drag.
 *   3. The decoded column must appear in `categoricalDistinctValuesByColumn` —
 *      numeric columns are absent and must fall through to the outcome handler.
 *
 * On match: calls `extractStepsFromCategoricalColumn(columnName, distinctValues)`
 * to produce ordered `ExtractedStep[]`, then fires `onStepsReplace`.
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
  const steps = extractStepsFromCategoricalColumn(columnName, distinctValues);
  onStepsReplace(steps, columnName);
  return true;
}
