import type { DragEndEvent } from '@dnd-kit/core';
import type { OutcomeSpec } from '@variscout/core';
import { handleOutcomeDrop } from './handleOutcomeDrop';
import { handleFactorDrop } from './handleFactorDrop';
import {
  handleProcessStructureDrop,
  type ProcessStructureDropArgs,
} from './handleProcessStructureDrop';
import type { ExtractedStep } from './ProcessZone/extractStepsFromCategoricalColumn';

/**
 * Arguments to {@link handleEditModeDragEnd}.
 *
 * The router consumes the active/over ids from a `DragEndEvent` and dispatches
 * to the column→process, column→outcome, and column→factor routers in order.
 * All callbacks are optional — when missing, that route is a no-op (the helper
 * still returns without throwing, so EditModeShell can run with
 * partially-wired consumers).
 *
 * `numericValuesByColumn` is forwarded to {@link handleOutcomeDrop} for
 * `deriveDefaultSpecs` seeding.
 *
 * `categoricalDistinctValuesByColumn` is forwarded to
 * {@link handleProcessStructureDrop}. Optional with a default of `{}` so
 * existing consumers (EditModeShell) do not need updating until Task 4 wires
 * the full process-zone props.
 */
export interface EditModeDragEndArgs {
  numericValuesByColumn: Record<string, number[]>;
  /** Optional until Task 4 wires EditModeShell process-zone props. Default: `{}`. */
  categoricalDistinctValuesByColumn?: Record<string, string[]>;
  onOutcomeSpecAdd?: (columnName: string, derived: Partial<OutcomeSpec>) => void;
  onFactorControlAdd?: (columnName: string, stepId?: string) => void;
  onStepsReplace?: (steps: ExtractedStep[], sourceColumnName: string) => void;
}

/**
 * Pure drag-end router for EditModeShell's own `DndContext`.
 *
 * EditModeShell owns its own `DndContext` because its draggables (column
 * chips in the Palette) and its droppables (ProcessZone, OutcomeZone,
 * FactorZone) are siblings of the inner Canvas — Canvas keeps its own
 * separate `DndContext` for chip→step routing, which this helper never touches.
 *
 * Routing order (short-circuits on first consumer):
 *   1. `column:<name>` → `process-zone:singleton` ⇒ {@link handleProcessStructureDrop}
 *      (categorical columns only; numeric columns absent from
 *      `categoricalDistinctValuesByColumn` fall through to outcome check)
 *   2. `column:<name>` → `outcome-zone:singleton` ⇒ {@link handleOutcomeDrop}
 *   3. `column:<name>` → `factor-zone:global` ⇒ {@link handleFactorDrop} (stepId undefined)
 *   4. `column:<name>` → `factor-zone:step:<stepId>` ⇒ {@link handleFactorDrop} (stepId set)
 *
 * No-ops on:
 *   - `over` is null (dropped outside any droppable)
 *   - active id is not a `column:` drag (chip drags belong to Canvas's context)
 *   - drop target is unknown to this router
 *
 * Pure helper: no React, no DOM, no `@dnd-kit/core` runtime beyond the
 * `DragEndEvent` type. Designed to be called from
 * `<DndContext onDragEnd={...}>` inside EditModeShell.
 */
export function handleEditModeDragEnd(
  event: DragEndEvent,
  {
    numericValuesByColumn,
    categoricalDistinctValuesByColumn = {},
    onOutcomeSpecAdd,
    onFactorControlAdd,
    onStepsReplace,
  }: EditModeDragEndArgs
): void {
  const activeId = String(event.active.id);
  const overId = event.over?.id != null ? String(event.over.id) : undefined;

  if (onStepsReplace) {
    const processArgs: ProcessStructureDropArgs = {
      activeId,
      overId,
      categoricalDistinctValuesByColumn,
      onStepsReplace,
    };
    const consumed = handleProcessStructureDrop(processArgs);
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
