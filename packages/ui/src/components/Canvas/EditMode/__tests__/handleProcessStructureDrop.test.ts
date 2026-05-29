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
    it('returns true and calls onStepsReplace with ordered distinct values and column name', () => {
      // IM-0b: callback receives string[] (ordered distinct values), not ExtractedStep[].
      // addStepsFromColumn mints canonical ids; no throwaway id premint here.
      const onStepsReplace = vi.fn();
      const result = handleProcessStructureDrop({
        activeId,
        overId,
        categoricalDistinctValuesByColumn,
        onStepsReplace,
      });
      expect(result).toBe(true);
      expect(onStepsReplace).toHaveBeenCalledTimes(1);
      const [distinctValues, columnName] = onStepsReplace.mock.calls[0];
      expect(columnName).toBe('Stage');
      expect(distinctValues).toEqual(['Prep', 'Run', 'Cool']);
    });

    it('preserves the original ordering of distinct values', () => {
      const onStepsReplace = vi.fn();
      handleProcessStructureDrop({
        activeId: encodeColumnDragId('Phase'),
        overId,
        categoricalDistinctValuesByColumn: { Phase: ['A', 'B', 'C'] },
        onStepsReplace,
      });
      const [distinctValues] = onStepsReplace.mock.calls[0];
      expect(distinctValues).toEqual(['A', 'B', 'C']);
    });
  });
});
