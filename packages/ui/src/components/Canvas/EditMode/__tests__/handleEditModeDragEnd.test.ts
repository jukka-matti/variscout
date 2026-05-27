import { describe, it, expect, vi } from 'vitest';
import type { DragEndEvent } from '@dnd-kit/core';
import { handleEditModeDragEnd } from '../handleEditModeDragEnd';
import { encodeColumnDragId } from '../Palette/encodeColumnDragId';
import { encodeOutcomeDropId } from '../OutcomeZone/encodeOutcomeDropId';
import { encodeFactorDropId } from '../FactorZone/encodeFactorDropId';
import { encodeProcessDropId } from '../ProcessZone/encodeProcessDropId';

/**
 * Builds a minimal DragEndEvent shape sufficient for the router.
 *
 * `@dnd-kit/core`'s real `DragEndEvent` has many fields; the router only reads
 * `active.id` and `over?.id`. We cast through `unknown` because constructing
 * the full event with collision/over-rect data is irrelevant to this router's
 * contract (parent-agnostic, pure-function dispatch by id).
 */
const dragEndEvent = (activeId: string, overId: string | undefined): DragEndEvent =>
  ({
    active: { id: activeId },
    over: overId ? { id: overId } : null,
  }) as unknown as DragEndEvent;

describe('handleEditModeDragEnd', () => {
  describe('outcome routing', () => {
    it('routes a column drop on the outcome zone to onOutcomeSpecAdd', () => {
      const onOutcomeSpecAdd = vi.fn();
      const onFactorControlAdd = vi.fn();
      handleEditModeDragEnd(
        dragEndEvent(encodeColumnDragId('Diameter'), encodeOutcomeDropId('singleton')),
        {
          numericValuesByColumn: { Diameter: [10, 10, 10, 11, 11, 12] },
          categoricalDistinctValuesByColumn: {},
          onOutcomeSpecAdd,
          onFactorControlAdd,
        }
      );
      expect(onOutcomeSpecAdd).toHaveBeenCalledTimes(1);
      expect(onOutcomeSpecAdd).toHaveBeenCalledWith('Diameter', expect.any(Object), undefined);
      expect(onFactorControlAdd).not.toHaveBeenCalled();
    });
  });

  describe('factor routing', () => {
    it('routes a column drop on the global factor zone to onFactorControlAdd with undefined stepId', () => {
      const onOutcomeSpecAdd = vi.fn();
      const onFactorControlAdd = vi.fn();
      handleEditModeDragEnd(
        dragEndEvent(encodeColumnDragId('Temperature'), encodeFactorDropId('global')),
        {
          numericValuesByColumn: {},
          categoricalDistinctValuesByColumn: {},
          onOutcomeSpecAdd,
          onFactorControlAdd,
        }
      );
      expect(onFactorControlAdd).toHaveBeenCalledTimes(1);
      expect(onFactorControlAdd).toHaveBeenCalledWith('Temperature', undefined);
      expect(onOutcomeSpecAdd).not.toHaveBeenCalled();
    });

    it('routes a column drop on a per-step factor zone to onFactorControlAdd with the stepId', () => {
      const onOutcomeSpecAdd = vi.fn();
      const onFactorControlAdd = vi.fn();
      handleEditModeDragEnd(
        dragEndEvent(encodeColumnDragId('Pressure'), encodeFactorDropId({ stepId: 's-1' })),
        {
          numericValuesByColumn: {},
          categoricalDistinctValuesByColumn: {},
          onOutcomeSpecAdd,
          onFactorControlAdd,
        }
      );
      expect(onFactorControlAdd).toHaveBeenCalledTimes(1);
      expect(onFactorControlAdd).toHaveBeenCalledWith('Pressure', 's-1');
      expect(onOutcomeSpecAdd).not.toHaveBeenCalled();
    });
  });

  describe('non-matching events (no regression on chip drag)', () => {
    it('does not call either callback when the drop target is unknown', () => {
      const onOutcomeSpecAdd = vi.fn();
      const onFactorControlAdd = vi.fn();
      handleEditModeDragEnd(dragEndEvent(encodeColumnDragId('A'), 'step:s-1'), {
        numericValuesByColumn: {},
        categoricalDistinctValuesByColumn: {},
        onOutcomeSpecAdd,
        onFactorControlAdd,
      });
      expect(onOutcomeSpecAdd).not.toHaveBeenCalled();
      expect(onFactorControlAdd).not.toHaveBeenCalled();
    });

    it('does not call either callback when the drag source is not a column drag', () => {
      const onOutcomeSpecAdd = vi.fn();
      const onFactorControlAdd = vi.fn();
      handleEditModeDragEnd(dragEndEvent('chip:c-1', encodeOutcomeDropId('singleton')), {
        numericValuesByColumn: {},
        categoricalDistinctValuesByColumn: {},
        onOutcomeSpecAdd,
        onFactorControlAdd,
      });
      expect(onOutcomeSpecAdd).not.toHaveBeenCalled();
      expect(onFactorControlAdd).not.toHaveBeenCalled();
    });

    it('does not call either callback when over is null (dropped outside any droppable)', () => {
      const onOutcomeSpecAdd = vi.fn();
      const onFactorControlAdd = vi.fn();
      handleEditModeDragEnd(dragEndEvent(encodeColumnDragId('A'), undefined), {
        numericValuesByColumn: {},
        categoricalDistinctValuesByColumn: {},
        onOutcomeSpecAdd,
        onFactorControlAdd,
      });
      expect(onOutcomeSpecAdd).not.toHaveBeenCalled();
      expect(onFactorControlAdd).not.toHaveBeenCalled();
    });

    it('does not call onOutcomeSpecAdd when a numeric column drops on process-zone:singleton (absent from categoricalDistinctValuesByColumn — falls through but no outcome match either)', () => {
      // Covers the critical ordering nuance: numeric column → process-zone:singleton
      // is absent from categoricalDistinctValuesByColumn, so the process route returns
      // false; it also won't match outcome-zone, so both callbacks remain silent.
      const onOutcomeSpecAdd = vi.fn();
      const onStepsReplace = vi.fn();
      handleEditModeDragEnd(dragEndEvent(encodeColumnDragId('Diameter'), encodeProcessDropId()), {
        numericValuesByColumn: { Diameter: [10, 11, 12] },
        categoricalDistinctValuesByColumn: {}, // 'Diameter' absent — numeric column
        onOutcomeSpecAdd,
        onStepsReplace,
      });
      expect(onStepsReplace).not.toHaveBeenCalled();
      expect(onOutcomeSpecAdd).not.toHaveBeenCalled();
    });
  });

  describe('optional callbacks', () => {
    it('is a no-op when onOutcomeSpecAdd is undefined and the drop targets the outcome zone', () => {
      const onFactorControlAdd = vi.fn();
      expect(() =>
        handleEditModeDragEnd(
          dragEndEvent(encodeColumnDragId('A'), encodeOutcomeDropId('singleton')),
          {
            numericValuesByColumn: {},
            categoricalDistinctValuesByColumn: {},
            onFactorControlAdd,
          }
        )
      ).not.toThrow();
      expect(onFactorControlAdd).not.toHaveBeenCalled();
    });

    it('is a no-op when onFactorControlAdd is undefined and the drop targets a factor zone', () => {
      const onOutcomeSpecAdd = vi.fn();
      expect(() =>
        handleEditModeDragEnd(dragEndEvent(encodeColumnDragId('A'), encodeFactorDropId('global')), {
          numericValuesByColumn: {},
          categoricalDistinctValuesByColumn: {},
          onOutcomeSpecAdd,
        })
      ).not.toThrow();
      expect(onOutcomeSpecAdd).not.toHaveBeenCalled();
    });
  });

  describe('process routing (short-circuits before outcome)', () => {
    it('fires onStepsReplace and NOT onOutcomeSpecAdd when a categorical column drops on process-zone:singleton', () => {
      const onStepsReplace = vi.fn();
      const onOutcomeSpecAdd = vi.fn();
      const onFactorControlAdd = vi.fn();
      handleEditModeDragEnd(dragEndEvent(encodeColumnDragId('Stage'), encodeProcessDropId()), {
        numericValuesByColumn: {},
        categoricalDistinctValuesByColumn: { Stage: ['Prep', 'Run', 'Cool'] },
        onStepsReplace,
        onOutcomeSpecAdd,
        onFactorControlAdd,
      });
      expect(onStepsReplace).toHaveBeenCalledTimes(1);
      const [steps, colName] = onStepsReplace.mock.calls[0];
      expect(colName).toBe('Stage');
      expect(steps).toHaveLength(3);
      // Process route consumed the drop; outcome + factor must NOT fire
      expect(onOutcomeSpecAdd).not.toHaveBeenCalled();
      expect(onFactorControlAdd).not.toHaveBeenCalled();
    });
  });
});
