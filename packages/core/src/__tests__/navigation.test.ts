import { describe, it, expect } from 'vitest';
import {
  generateFilterId,
  getFilterLabel,
  filterStackToFilters,
  createFilterAction,
  findFilterIndex,
  popFilterStackTo,
  popFilterStack,
  pushFilterStack,
  shouldToggleFilter,
  filterStackToBreadcrumbs,
  initialNavigationState,
  type FilterAction,
} from '../navigation';

describe('Navigation Utilities', () => {
  describe('generateFilterId', () => {
    it('should generate unique IDs', () => {
      const id1 = generateFilterId();
      const id2 = generateFilterId();

      expect(id1).toMatch(/^filter-\d+-[a-z0-9]+$/);
      expect(id1).not.toBe(id2);
    });
  });

  describe('getFilterLabel', () => {
    it('should format highlight action labels', () => {
      const action: FilterAction = {
        id: 'test-1',
        type: 'highlight',
        source: 'ichart',
        values: [42],
        rowIndex: 5,
        timestamp: Date.now(),
        label: '',
      };

      expect(getFilterLabel(action)).toBe('Point #6'); // 0-indexed to 1-indexed
    });

    it('should format filter action labels with factor', () => {
      const action: FilterAction = {
        id: 'test-2',
        type: 'filter',
        source: 'boxplot',
        factor: 'Machine',
        values: ['A', 'B'],
        timestamp: Date.now(),
        label: '',
      };

      expect(getFilterLabel(action)).toBe('Machine: A, B');
    });

    it('should truncate long value lists', () => {
      const action: FilterAction = {
        id: 'test-3',
        type: 'filter',
        source: 'pareto',
        factor: 'Shift',
        values: ['Morning', 'Afternoon', 'Night', 'Weekend'],
        timestamp: Date.now(),
        label: '',
      };

      expect(getFilterLabel(action)).toBe('Shift: Morning, Afternoon +2');
    });

    it('should handle empty values', () => {
      const action: FilterAction = {
        id: 'test-4',
        type: 'filter',
        source: 'boxplot',
        factor: 'Machine',
        values: [],
        timestamp: Date.now(),
        label: '',
      };

      expect(getFilterLabel(action)).toBe('Machine');
    });
  });

  describe('filterStackToFilters', () => {
    it('should convert empty stack to empty filters', () => {
      expect(filterStackToFilters([])).toEqual({});
    });

    it('should convert filter actions to filters object', () => {
      const stack: FilterAction[] = [
        {
          id: '1',
          type: 'filter',
          source: 'boxplot',
          factor: 'Machine',
          values: ['A'],
          timestamp: 1,
          label: 'Machine: A',
        },
        {
          id: '2',
          type: 'filter',
          source: 'pareto',
          factor: 'Defect',
          values: ['Scratch', 'Dent'],
          timestamp: 2,
          label: 'Defect: Scratch, Dent',
        },
      ];

      expect(filterStackToFilters(stack)).toEqual({
        Machine: ['A'],
        Defect: ['Scratch', 'Dent'],
      });
    });

    it('should ignore highlight actions', () => {
      const stack: FilterAction[] = [
        {
          id: '1',
          type: 'highlight',
          source: 'ichart',
          values: [42],
          rowIndex: 5,
          timestamp: 1,
          label: 'Point #6',
        },
      ];

      expect(filterStackToFilters(stack)).toEqual({});
    });

    it('should use latest value when same factor appears multiple times', () => {
      const stack: FilterAction[] = [
        {
          id: '1',
          type: 'filter',
          source: 'boxplot',
          factor: 'Machine',
          values: ['A'],
          timestamp: 1,
          label: 'Machine: A',
        },
        {
          id: '2',
          type: 'filter',
          source: 'boxplot',
          factor: 'Machine',
          values: ['B', 'C'],
          timestamp: 2,
          label: 'Machine: B, C',
        },
      ];

      expect(filterStackToFilters(stack)).toEqual({
        Machine: ['B', 'C'],
      });
    });
  });

  describe('createFilterAction', () => {
    it('should create action with auto-generated id, timestamp, and label', () => {
      const action = createFilterAction({
        type: 'filter',
        source: 'boxplot',
        factor: 'Machine',
        values: ['A'],
      });

      expect(action.id).toMatch(/^filter-/);
      expect(action.timestamp).toBeGreaterThan(0);
      expect(action.label).toBe('Machine: A');
    });
  });

  describe('stack operations', () => {
    const sampleStack: FilterAction[] = [
      {
        id: 'action-1',
        type: 'filter',
        source: 'boxplot',
        factor: 'Machine',
        values: ['A'],
        timestamp: 1,
        label: 'Machine: A',
      },
      {
        id: 'action-2',
        type: 'filter',
        source: 'pareto',
        factor: 'Defect',
        values: ['Scratch'],
        timestamp: 2,
        label: 'Defect: Scratch',
      },
      {
        id: 'action-3',
        type: 'filter',
        source: 'boxplot',
        factor: 'Shift',
        values: ['Day'],
        timestamp: 3,
        label: 'Shift: Day',
      },
    ];

    describe('findFilterIndex', () => {
      it('should find action by id', () => {
        expect(findFilterIndex(sampleStack, 'action-2')).toBe(1);
      });

      it('should return -1 for missing id', () => {
        expect(findFilterIndex(sampleStack, 'missing')).toBe(-1);
      });
    });

    describe('popFilterStackTo', () => {
      it('should pop stack to specified action (inclusive)', () => {
        const result = popFilterStackTo(sampleStack, 'action-2');
        expect(result).toHaveLength(2);
        expect(result[1].id).toBe('action-2');
      });

      it('should return original stack if id not found', () => {
        const result = popFilterStackTo(sampleStack, 'missing');
        expect(result).toBe(sampleStack);
      });
    });

    describe('popFilterStack', () => {
      it('should remove last action', () => {
        const result = popFilterStack(sampleStack);
        expect(result).toHaveLength(2);
        expect(result[result.length - 1].id).toBe('action-2');
      });

      it('should handle empty stack', () => {
        expect(popFilterStack([])).toEqual([]);
      });
    });

    describe('pushFilterStack', () => {
      it('should add action to end of stack', () => {
        const newAction: FilterAction = {
          id: 'action-4',
          type: 'filter',
          source: 'pareto',
          factor: 'Line',
          values: ['1'],
          timestamp: 4,
          label: 'Line: 1',
        };

        const result = pushFilterStack(sampleStack, newAction);
        expect(result).toHaveLength(4);
        expect(result[3]).toBe(newAction);
      });
    });
  });

  describe('shouldToggleFilter', () => {
    const stack: FilterAction[] = [
      {
        id: '1',
        type: 'filter',
        source: 'boxplot',
        factor: 'Machine',
        values: ['A', 'B'],
        timestamp: 1,
        label: 'Machine: A, B',
      },
    ];

    it('should return true when clicking same factor with same values', () => {
      const result = shouldToggleFilter(stack, {
        type: 'filter',
        source: 'boxplot',
        factor: 'Machine',
        values: ['A', 'B'],
      });
      expect(result).toBe(true);
    });

    it('should return true regardless of value order', () => {
      const result = shouldToggleFilter(stack, {
        type: 'filter',
        source: 'boxplot',
        factor: 'Machine',
        values: ['B', 'A'],
      });
      expect(result).toBe(true);
    });

    it('should return false for different values', () => {
      const result = shouldToggleFilter(stack, {
        type: 'filter',
        source: 'boxplot',
        factor: 'Machine',
        values: ['A'],
      });
      expect(result).toBe(false);
    });

    it('should return false for different factor', () => {
      const result = shouldToggleFilter(stack, {
        type: 'filter',
        source: 'boxplot',
        factor: 'Shift',
        values: ['A', 'B'],
      });
      expect(result).toBe(false);
    });

    it('should return false for highlight type', () => {
      const result = shouldToggleFilter(stack, {
        type: 'highlight',
        source: 'ichart',
        values: [1],
        rowIndex: 0,
      });
      expect(result).toBe(false);
    });
  });

  describe('filterStackToBreadcrumbs', () => {
    it('should return root item for empty stack', () => {
      const result = filterStackToBreadcrumbs([]);
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        id: 'root',
        label: 'All Data',
        isActive: true,
        source: 'ichart',
      });
    });

    it('should convert stack to breadcrumb items', () => {
      const stack: FilterAction[] = [
        {
          id: 'a1',
          type: 'filter',
          source: 'boxplot',
          factor: 'Machine',
          values: ['A'],
          timestamp: 1,
          label: 'Machine: A',
        },
        {
          id: 'a2',
          type: 'filter',
          source: 'pareto',
          factor: 'Defect',
          values: ['Scratch'],
          timestamp: 2,
          label: 'Defect: Scratch',
        },
      ];

      const result = filterStackToBreadcrumbs(stack);

      expect(result).toHaveLength(3);
      expect(result[0].isActive).toBe(false); // Root not active when stack has items
      expect(result[1].label).toBe('Machine: A');
      expect(result[1].isActive).toBe(false);
      expect(result[2].label).toBe('Defect: Scratch');
      expect(result[2].isActive).toBe(true); // Last item is active
    });

    it('should use custom root label', () => {
      const result = filterStackToBreadcrumbs([], 'Home');
      expect(result[0].label).toBe('Home');
    });
  });

  describe('initialNavigationState', () => {
    it('should have empty filter stack and no highlight', () => {
      expect(initialNavigationState).toEqual({
        filterStack: [],
        currentHighlight: null,
      });
    });
  });
});
