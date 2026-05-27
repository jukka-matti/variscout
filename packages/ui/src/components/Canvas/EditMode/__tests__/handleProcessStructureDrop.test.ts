import { describe, it, expect, vi } from 'vitest';
import { handleProcessStructureDrop } from '../handleProcessStructureDrop';
import { encodeColumnDragId } from '../Palette/encodeColumnDragId';
import { encodeProcessDropId } from '../ProcessZone/encodeProcessDropId';

describe('handleProcessStructureDrop', () => {
  const overId = encodeProcessDropId(); // 'process-zone:singleton'
  const activeId = encodeColumnDragId('Stage'); // 'column:Stage'
  const categoricalDistinctValuesByColumn = { Stage: ['Prep', 'Run', 'Cool'] };

  describe('guard: returns false when drop cannot be consumed', () => {
    it('returns false when overId is undefined', () => {
      const onStepsReplace = vi.fn();
      const result = handleProcessStructureDrop({
        activeId,
        overId: undefined,
        categoricalDistinctValuesByColumn,
        onStepsReplace,
      });
      expect(result).toBe(false);
      expect(onStepsReplace).not.toHaveBeenCalled();
    });

    it('returns false when overId is not a process drop id', () => {
      const onStepsReplace = vi.fn();
      const result = handleProcessStructureDrop({
        activeId,
        overId: 'outcome-zone:singleton',
        categoricalDistinctValuesByColumn,
        onStepsReplace,
      });
      expect(result).toBe(false);
      expect(onStepsReplace).not.toHaveBeenCalled();
    });

    it('returns false when activeId is not a column drag id', () => {
      const onStepsReplace = vi.fn();
      const result = handleProcessStructureDrop({
        activeId: 'chip:c-1',
        overId,
        categoricalDistinctValuesByColumn,
        onStepsReplace,
      });
      expect(result).toBe(false);
      expect(onStepsReplace).not.toHaveBeenCalled();
    });

    it('returns false when the column has no entry in categoricalDistinctValuesByColumn', () => {
      const onStepsReplace = vi.fn();
      // 'Stage' not in the map (empty or different column)
      const result = handleProcessStructureDrop({
        activeId,
        overId,
        categoricalDistinctValuesByColumn: { OtherColumn: ['A', 'B'] },
        onStepsReplace,
      });
      expect(result).toBe(false);
      expect(onStepsReplace).not.toHaveBeenCalled();
    });

    it('returns false when categoricalDistinctValuesByColumn is empty (numeric column path)', () => {
      // Simulates a numeric column dropped on process-zone:singleton —
      // the column won't be in categoricalDistinctValuesByColumn, so it falls through.
      const onStepsReplace = vi.fn();
      const result = handleProcessStructureDrop({
        activeId: encodeColumnDragId('Diameter'), // numeric column
        overId,
        categoricalDistinctValuesByColumn: {}, // no entry for 'Diameter'
        onStepsReplace,
      });
      expect(result).toBe(false);
      expect(onStepsReplace).not.toHaveBeenCalled();
    });
  });

  describe('happy path: consumes drop and fires callback', () => {
    it('returns true and calls onStepsReplace with extracted steps and column name', () => {
      const onStepsReplace = vi.fn();
      const result = handleProcessStructureDrop({
        activeId,
        overId,
        categoricalDistinctValuesByColumn,
        onStepsReplace,
      });
      expect(result).toBe(true);
      expect(onStepsReplace).toHaveBeenCalledTimes(1);
      const [steps, columnName] = onStepsReplace.mock.calls[0];
      expect(columnName).toBe('Stage');
      expect(steps).toHaveLength(3);
      expect(steps[0]).toMatchObject({ name: 'Prep', order: 0 });
      expect(steps[1]).toMatchObject({ name: 'Run', order: 1 });
      expect(steps[2]).toMatchObject({ name: 'Cool', order: 2 });
    });

    it('generates stable deterministic ids from column name + index', () => {
      const onStepsReplace = vi.fn();
      handleProcessStructureDrop({
        activeId: encodeColumnDragId('Phase'),
        overId,
        categoricalDistinctValuesByColumn: { Phase: ['A', 'B', 'C'] },
        onStepsReplace,
      });
      const [steps] = onStepsReplace.mock.calls[0];
      expect(steps[0].id).toBe('step-Phase-0');
      expect(steps[1].id).toBe('step-Phase-1');
      expect(steps[2].id).toBe('step-Phase-2');
    });
  });
});
