import { describe, it, expect } from 'vitest';
import {
  generateDrillId,
  getDrillLabel,
  drillStackToFilters,
  createDrillAction,
  findDrillIndex,
  popDrillStackTo,
  popDrillStack,
  pushDrillStack,
  shouldToggleDrill,
  drillStackToBreadcrumbs,
  initialNavigationState,
  type DrillAction,
} from '../navigation';

describe('Navigation Utilities', () => {
  describe('generateDrillId', () => {
    it('should generate unique IDs', () => {
      const id1 = generateDrillId();
      const id2 = generateDrillId();

      expect(id1).toMatch(/^drill-\d+-[a-z0-9]+$/);
      expect(id1).not.toBe(id2);
    });
  });

  describe('getDrillLabel', () => {
    it('should format highlight action labels', () => {
      const action: DrillAction = {
        id: 'test-1',
        type: 'highlight',
        source: 'ichart',
        values: [42],
        rowIndex: 5,
        timestamp: Date.now(),
        label: '',
      };

      expect(getDrillLabel(action)).toBe('Point #6'); // 0-indexed to 1-indexed
    });

    it('should format filter action labels with factor', () => {
      const action: DrillAction = {
        id: 'test-2',
        type: 'filter',
        source: 'boxplot',
        factor: 'Machine',
        values: ['A', 'B'],
        timestamp: Date.now(),
        label: '',
      };

      expect(getDrillLabel(action)).toBe('Machine: A, B');
    });

    it('should truncate long value lists', () => {
      const action: DrillAction = {
        id: 'test-3',
        type: 'filter',
        source: 'pareto',
        factor: 'Shift',
        values: ['Morning', 'Afternoon', 'Night', 'Weekend'],
        timestamp: Date.now(),
        label: '',
      };

      expect(getDrillLabel(action)).toBe('Shift: Morning, Afternoon +2');
    });

    it('should handle empty values', () => {
      const action: DrillAction = {
        id: 'test-4',
        type: 'filter',
        source: 'boxplot',
        factor: 'Machine',
        values: [],
        timestamp: Date.now(),
        label: '',
      };

      expect(getDrillLabel(action)).toBe('Machine');
    });
  });

  describe('drillStackToFilters', () => {
    it('should convert empty stack to empty filters', () => {
      expect(drillStackToFilters([])).toEqual({});
    });

    it('should convert filter actions to filters object', () => {
      const stack: DrillAction[] = [
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

      expect(drillStackToFilters(stack)).toEqual({
        Machine: ['A'],
        Defect: ['Scratch', 'Dent'],
      });
    });

    it('should ignore highlight actions', () => {
      const stack: DrillAction[] = [
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

      expect(drillStackToFilters(stack)).toEqual({});
    });

    it('should use latest value when same factor appears multiple times', () => {
      const stack: DrillAction[] = [
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

      expect(drillStackToFilters(stack)).toEqual({
        Machine: ['B', 'C'],
      });
    });
  });

  describe('createDrillAction', () => {
    it('should create action with auto-generated id, timestamp, and label', () => {
      const action = createDrillAction({
        type: 'filter',
        source: 'boxplot',
        factor: 'Machine',
        values: ['A'],
      });

      expect(action.id).toMatch(/^drill-/);
      expect(action.timestamp).toBeGreaterThan(0);
      expect(action.label).toBe('Machine: A');
    });
  });

  describe('stack operations', () => {
    const sampleStack: DrillAction[] = [
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

    describe('findDrillIndex', () => {
      it('should find action by id', () => {
        expect(findDrillIndex(sampleStack, 'action-2')).toBe(1);
      });

      it('should return -1 for missing id', () => {
        expect(findDrillIndex(sampleStack, 'missing')).toBe(-1);
      });
    });

    describe('popDrillStackTo', () => {
      it('should pop stack to specified action (inclusive)', () => {
        const result = popDrillStackTo(sampleStack, 'action-2');
        expect(result).toHaveLength(2);
        expect(result[1].id).toBe('action-2');
      });

      it('should return original stack if id not found', () => {
        const result = popDrillStackTo(sampleStack, 'missing');
        expect(result).toBe(sampleStack);
      });
    });

    describe('popDrillStack', () => {
      it('should remove last action', () => {
        const result = popDrillStack(sampleStack);
        expect(result).toHaveLength(2);
        expect(result[result.length - 1].id).toBe('action-2');
      });

      it('should handle empty stack', () => {
        expect(popDrillStack([])).toEqual([]);
      });
    });

    describe('pushDrillStack', () => {
      it('should add action to end of stack', () => {
        const newAction: DrillAction = {
          id: 'action-4',
          type: 'filter',
          source: 'pareto',
          factor: 'Line',
          values: ['1'],
          timestamp: 4,
          label: 'Line: 1',
        };

        const result = pushDrillStack(sampleStack, newAction);
        expect(result).toHaveLength(4);
        expect(result[3]).toBe(newAction);
      });
    });
  });

  describe('shouldToggleDrill', () => {
    const stack: DrillAction[] = [
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
      const result = shouldToggleDrill(stack, {
        type: 'filter',
        source: 'boxplot',
        factor: 'Machine',
        values: ['A', 'B'],
      });
      expect(result).toBe(true);
    });

    it('should return true regardless of value order', () => {
      const result = shouldToggleDrill(stack, {
        type: 'filter',
        source: 'boxplot',
        factor: 'Machine',
        values: ['B', 'A'],
      });
      expect(result).toBe(true);
    });

    it('should return false for different values', () => {
      const result = shouldToggleDrill(stack, {
        type: 'filter',
        source: 'boxplot',
        factor: 'Machine',
        values: ['A'],
      });
      expect(result).toBe(false);
    });

    it('should return false for different factor', () => {
      const result = shouldToggleDrill(stack, {
        type: 'filter',
        source: 'boxplot',
        factor: 'Shift',
        values: ['A', 'B'],
      });
      expect(result).toBe(false);
    });

    it('should return false for highlight type', () => {
      const result = shouldToggleDrill(stack, {
        type: 'highlight',
        source: 'ichart',
        values: [1],
        rowIndex: 0,
      });
      expect(result).toBe(false);
    });
  });

  describe('drillStackToBreadcrumbs', () => {
    it('should return root item for empty stack', () => {
      const result = drillStackToBreadcrumbs([]);
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        id: 'root',
        label: 'All Data',
        isActive: true,
        source: 'ichart',
      });
    });

    it('should convert stack to breadcrumb items', () => {
      const stack: DrillAction[] = [
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

      const result = drillStackToBreadcrumbs(stack);

      expect(result).toHaveLength(3);
      expect(result[0].isActive).toBe(false); // Root not active when stack has items
      expect(result[1].label).toBe('Machine: A');
      expect(result[1].isActive).toBe(false);
      expect(result[2].label).toBe('Defect: Scratch');
      expect(result[2].isActive).toBe(true); // Last item is active
    });

    it('should use custom root label', () => {
      const result = drillStackToBreadcrumbs([], 'Home');
      expect(result[0].label).toBe('Home');
    });
  });

  describe('initialNavigationState', () => {
    it('should have empty drill stack and no highlight', () => {
      expect(initialNavigationState).toEqual({
        drillStack: [],
        currentHighlight: null,
      });
    });
  });
});
