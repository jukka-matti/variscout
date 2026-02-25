/**
 * Tests for useFilterNavigation hook
 *
 * Tests state transitions through the hook's public API:
 * - Initial state
 * - applyFilter (filter and highlight types)
 * - Toggle behavior (same factor/values removes filter)
 * - removeLastFilter, clearFilters, navigateTo
 * - setHighlight / clearHighlight
 * - updateFilterValues (update, create, remove)
 * - removeFilter by factor name
 * - Breadcrumb generation from filter stack
 * - Multiple sequential filters
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useFilterNavigation } from '../useFilterNavigation';
import type { FilterNavigationContext } from '../types';

// ============================================================================
// Stable mock context (module-level to prevent infinite re-renders)
// ============================================================================

const mockSetFilters = vi.fn();

const defaultContext: FilterNavigationContext = {
  filters: {},
  setFilters: mockSetFilters,
  columnAliases: {},
};

/** Context with column aliases for label substitution tests */
const aliasedContext: FilterNavigationContext = {
  filters: {},
  setFilters: mockSetFilters,
  columnAliases: { Machine: 'Equipment', Shift: 'Work Period' },
};

// Disable history and URL sync for all tests (avoids window.history side effects)
const noHistoryOptions = { enableHistory: false, enableUrlSync: false } as const;

// ============================================================================
// Helpers
// ============================================================================

function renderFilterNav(context = defaultContext) {
  return renderHook(() => useFilterNavigation(context, noHistoryOptions));
}

// ============================================================================
// Tests
// ============================================================================

describe('useFilterNavigation', () => {
  beforeEach(() => {
    mockSetFilters.mockClear();
  });

  // --------------------------------------------------------------------------
  // 1. Initial state
  // --------------------------------------------------------------------------

  describe('initial state', () => {
    it('starts with empty filterStack, no highlight, hasFilters=false', () => {
      const { result } = renderFilterNav();

      expect(result.current.filterStack).toEqual([]);
      expect(result.current.currentHighlight).toBeNull();
      expect(result.current.hasFilters).toBe(false);
    });

    it('starts with a single root breadcrumb', () => {
      const { result } = renderFilterNav();

      expect(result.current.breadcrumbs).toHaveLength(1);
      expect(result.current.breadcrumbs[0].id).toBe('root');
      expect(result.current.breadcrumbs[0].label).toBe('All Data');
      expect(result.current.breadcrumbs[0].isActive).toBe(true);
    });
  });

  // --------------------------------------------------------------------------
  // 2. applyFilter with type='filter'
  // --------------------------------------------------------------------------

  describe('applyFilter (filter type)', () => {
    it('adds to filterStack and sets hasFilters=true', () => {
      const { result } = renderFilterNav();

      act(() => {
        result.current.applyFilter({
          type: 'filter',
          source: 'boxplot',
          factor: 'Machine',
          values: ['A'],
        });
      });

      expect(result.current.filterStack).toHaveLength(1);
      expect(result.current.filterStack[0].factor).toBe('Machine');
      expect(result.current.filterStack[0].values).toEqual(['A']);
      expect(result.current.hasFilters).toBe(true);
    });

    it('calls setFilters with the derived filters object', () => {
      const { result } = renderFilterNav();

      act(() => {
        result.current.applyFilter({
          type: 'filter',
          source: 'boxplot',
          factor: 'Machine',
          values: ['A'],
        });
      });

      expect(mockSetFilters).toHaveBeenCalledWith({ Machine: ['A'] });
    });
  });

  // --------------------------------------------------------------------------
  // 3. applyFilter with type='highlight'
  // --------------------------------------------------------------------------

  describe('applyFilter (highlight type)', () => {
    it('sets currentHighlight without affecting filterStack', () => {
      const { result } = renderFilterNav();

      act(() => {
        result.current.applyFilter({
          type: 'highlight',
          source: 'ichart',
          values: [42.5],
          rowIndex: 7,
          originalIndex: 12,
        });
      });

      expect(result.current.currentHighlight).toEqual({
        rowIndex: 7,
        value: 42.5,
        originalIndex: 12,
      });
      expect(result.current.filterStack).toHaveLength(0);
      expect(result.current.hasFilters).toBe(false);
    });
  });

  // --------------------------------------------------------------------------
  // 4. Toggle behavior
  // --------------------------------------------------------------------------

  describe('toggle behavior', () => {
    it('applying same factor/values removes the filter', () => {
      const { result } = renderFilterNav();

      // Apply filter
      act(() => {
        result.current.applyFilter({
          type: 'filter',
          source: 'boxplot',
          factor: 'Machine',
          values: ['A'],
        });
      });
      expect(result.current.filterStack).toHaveLength(1);

      // Apply same filter again -> toggle off
      act(() => {
        result.current.applyFilter({
          type: 'filter',
          source: 'boxplot',
          factor: 'Machine',
          values: ['A'],
        });
      });
      expect(result.current.filterStack).toHaveLength(0);
      expect(result.current.hasFilters).toBe(false);
    });

    it('applying same factor with different values does NOT toggle', () => {
      const { result } = renderFilterNav();

      act(() => {
        result.current.applyFilter({
          type: 'filter',
          source: 'boxplot',
          factor: 'Machine',
          values: ['A'],
        });
      });

      // Different value for same factor -> replaces (pushes new action)
      act(() => {
        result.current.applyFilter({
          type: 'filter',
          source: 'boxplot',
          factor: 'Machine',
          values: ['B'],
        });
      });

      // Should have 2 actions (push, not toggle), but last filter wins in filters map
      expect(result.current.filterStack).toHaveLength(2);
    });
  });

  // --------------------------------------------------------------------------
  // 5. removeLastFilter
  // --------------------------------------------------------------------------

  describe('removeLastFilter', () => {
    it('pops the last filter from the stack', () => {
      const { result } = renderFilterNav();

      act(() => {
        result.current.applyFilter({
          type: 'filter',
          source: 'boxplot',
          factor: 'Machine',
          values: ['A'],
        });
      });
      act(() => {
        result.current.applyFilter({
          type: 'filter',
          source: 'pareto',
          factor: 'Shift',
          values: ['Day'],
        });
      });
      expect(result.current.filterStack).toHaveLength(2);

      act(() => {
        result.current.removeLastFilter();
      });

      expect(result.current.filterStack).toHaveLength(1);
      expect(result.current.filterStack[0].factor).toBe('Machine');
    });

    it('removeLastFilter on empty stack does nothing', () => {
      const { result } = renderFilterNav();

      act(() => {
        result.current.removeLastFilter();
      });

      expect(result.current.filterStack).toHaveLength(0);
    });
  });

  // --------------------------------------------------------------------------
  // 6. clearFilters
  // --------------------------------------------------------------------------

  describe('clearFilters', () => {
    it('resets filterStack, highlight, and hasFilters', () => {
      const { result } = renderFilterNav();

      // Add filter and highlight
      act(() => {
        result.current.applyFilter({
          type: 'filter',
          source: 'boxplot',
          factor: 'Machine',
          values: ['A'],
        });
        result.current.setHighlight(3, 25.0);
      });

      expect(result.current.filterStack).toHaveLength(1);
      expect(result.current.currentHighlight).not.toBeNull();

      act(() => {
        result.current.clearFilters();
      });

      expect(result.current.filterStack).toHaveLength(0);
      expect(result.current.currentHighlight).toBeNull();
      expect(result.current.hasFilters).toBe(false);
    });
  });

  // --------------------------------------------------------------------------
  // 7. setHighlight / clearHighlight
  // --------------------------------------------------------------------------

  describe('setHighlight / clearHighlight', () => {
    it('setHighlight sets currentHighlight with rowIndex and value', () => {
      const { result } = renderFilterNav();

      act(() => {
        result.current.setHighlight(5, 99.2, 10);
      });

      expect(result.current.currentHighlight).toEqual({
        rowIndex: 5,
        value: 99.2,
        originalIndex: 10,
      });
    });

    it('clearHighlight removes the highlight', () => {
      const { result } = renderFilterNav();

      act(() => {
        result.current.setHighlight(5, 99.2);
      });
      expect(result.current.currentHighlight).not.toBeNull();

      act(() => {
        result.current.clearHighlight();
      });
      expect(result.current.currentHighlight).toBeNull();
    });
  });

  // --------------------------------------------------------------------------
  // 8. navigateTo
  // --------------------------------------------------------------------------

  describe('navigateTo', () => {
    it('navigateTo("root") clears all filters', () => {
      const { result } = renderFilterNav();

      act(() => {
        result.current.applyFilter({
          type: 'filter',
          source: 'boxplot',
          factor: 'Machine',
          values: ['A'],
        });
      });
      act(() => {
        result.current.applyFilter({
          type: 'filter',
          source: 'pareto',
          factor: 'Shift',
          values: ['Day'],
        });
      });
      expect(result.current.filterStack).toHaveLength(2);

      act(() => {
        result.current.navigateTo('root');
      });

      expect(result.current.filterStack).toHaveLength(0);
      expect(result.current.hasFilters).toBe(false);
    });

    it('navigateTo a specific action ID truncates the stack', () => {
      const { result } = renderFilterNav();

      act(() => {
        result.current.applyFilter({
          type: 'filter',
          source: 'boxplot',
          factor: 'Machine',
          values: ['A'],
        });
      });

      const firstActionId = result.current.filterStack[0].id;

      act(() => {
        result.current.applyFilter({
          type: 'filter',
          source: 'pareto',
          factor: 'Shift',
          values: ['Day'],
        });
      });
      act(() => {
        result.current.applyFilter({
          type: 'filter',
          source: 'boxplot',
          factor: 'Operator',
          values: ['Alice'],
        });
      });
      expect(result.current.filterStack).toHaveLength(3);

      act(() => {
        result.current.navigateTo(firstActionId);
      });

      expect(result.current.filterStack).toHaveLength(1);
      expect(result.current.filterStack[0].factor).toBe('Machine');
    });
  });

  // --------------------------------------------------------------------------
  // 9. updateFilterValues - update existing
  // --------------------------------------------------------------------------

  describe('updateFilterValues', () => {
    it('updates values for an existing filter in-place', () => {
      const { result } = renderFilterNav();

      act(() => {
        result.current.applyFilter({
          type: 'filter',
          source: 'boxplot',
          factor: 'Machine',
          values: ['A'],
        });
      });
      expect(result.current.filterStack[0].values).toEqual(['A']);

      act(() => {
        result.current.updateFilterValues('Machine', ['A', 'B']);
      });

      expect(result.current.filterStack).toHaveLength(1);
      expect(result.current.filterStack[0].values).toEqual(['A', 'B']);
      expect(mockSetFilters).toHaveBeenLastCalledWith({ Machine: ['A', 'B'] });
    });

    // --------------------------------------------------------------------------
    // 10. updateFilterValues with empty array removes filter
    // --------------------------------------------------------------------------

    it('removes the filter when called with empty values array', () => {
      const { result } = renderFilterNav();

      act(() => {
        result.current.applyFilter({
          type: 'filter',
          source: 'boxplot',
          factor: 'Machine',
          values: ['A'],
        });
      });
      expect(result.current.filterStack).toHaveLength(1);

      act(() => {
        result.current.updateFilterValues('Machine', []);
      });

      expect(result.current.filterStack).toHaveLength(0);
      expect(result.current.hasFilters).toBe(false);
    });

    // --------------------------------------------------------------------------
    // 11. updateFilterValues for nonexistent factor creates new filter
    // --------------------------------------------------------------------------

    it('creates a new filter when factor does not exist in stack', () => {
      const { result } = renderFilterNav();

      act(() => {
        result.current.updateFilterValues('Machine', ['A', 'C']);
      });

      expect(result.current.filterStack).toHaveLength(1);
      expect(result.current.filterStack[0].factor).toBe('Machine');
      expect(result.current.filterStack[0].values).toEqual(['A', 'C']);
      expect(result.current.hasFilters).toBe(true);
    });
  });

  // --------------------------------------------------------------------------
  // 12. removeFilter by factor name
  // --------------------------------------------------------------------------

  describe('removeFilter', () => {
    it('removes a specific filter by factor name', () => {
      const { result } = renderFilterNav();

      act(() => {
        result.current.applyFilter({
          type: 'filter',
          source: 'boxplot',
          factor: 'Machine',
          values: ['A'],
        });
      });
      act(() => {
        result.current.applyFilter({
          type: 'filter',
          source: 'pareto',
          factor: 'Shift',
          values: ['Day'],
        });
      });
      expect(result.current.filterStack).toHaveLength(2);

      act(() => {
        result.current.removeFilter('Machine');
      });

      expect(result.current.filterStack).toHaveLength(1);
      expect(result.current.filterStack[0].factor).toBe('Shift');
    });

    it('removing nonexistent factor is a no-op', () => {
      const { result } = renderFilterNav();

      act(() => {
        result.current.applyFilter({
          type: 'filter',
          source: 'boxplot',
          factor: 'Machine',
          values: ['A'],
        });
      });

      act(() => {
        result.current.removeFilter('Nonexistent');
      });

      expect(result.current.filterStack).toHaveLength(1);
      expect(result.current.filterStack[0].factor).toBe('Machine');
    });
  });

  // --------------------------------------------------------------------------
  // 13. Multiple sequential filters accumulate correctly
  // --------------------------------------------------------------------------

  describe('multiple sequential filters', () => {
    it('accumulates three filters from different sources', () => {
      const { result } = renderFilterNav();

      act(() => {
        result.current.applyFilter({
          type: 'filter',
          source: 'boxplot',
          factor: 'Machine',
          values: ['A'],
        });
      });
      act(() => {
        result.current.applyFilter({
          type: 'filter',
          source: 'pareto',
          factor: 'Shift',
          values: ['Day'],
        });
      });
      act(() => {
        result.current.applyFilter({
          type: 'filter',
          source: 'boxplot',
          factor: 'Operator',
          values: ['Alice'],
        });
      });

      expect(result.current.filterStack).toHaveLength(3);
      expect(result.current.filterStack[0].factor).toBe('Machine');
      expect(result.current.filterStack[1].factor).toBe('Shift');
      expect(result.current.filterStack[2].factor).toBe('Operator');

      // setFilters should include all three factors
      expect(mockSetFilters).toHaveBeenLastCalledWith({
        Machine: ['A'],
        Shift: ['Day'],
        Operator: ['Alice'],
      });
    });

    it('setFilters called after each filter application', () => {
      const { result } = renderFilterNav();
      mockSetFilters.mockClear();

      act(() => {
        result.current.applyFilter({
          type: 'filter',
          source: 'boxplot',
          factor: 'Machine',
          values: ['A'],
        });
      });
      act(() => {
        result.current.applyFilter({
          type: 'filter',
          source: 'pareto',
          factor: 'Shift',
          values: ['Day'],
        });
      });

      expect(mockSetFilters).toHaveBeenCalledTimes(2);
    });
  });

  // --------------------------------------------------------------------------
  // 14. Breadcrumbs reflect filter stack
  // --------------------------------------------------------------------------

  describe('breadcrumbs', () => {
    it('breadcrumbs include root plus one item per filter', () => {
      const { result } = renderFilterNav();

      act(() => {
        result.current.applyFilter({
          type: 'filter',
          source: 'boxplot',
          factor: 'Machine',
          values: ['A'],
        });
      });
      act(() => {
        result.current.applyFilter({
          type: 'filter',
          source: 'pareto',
          factor: 'Shift',
          values: ['Day'],
        });
      });

      const crumbs = result.current.breadcrumbs;
      expect(crumbs).toHaveLength(3); // root + 2 filters

      // Root
      expect(crumbs[0].id).toBe('root');
      expect(crumbs[0].isActive).toBe(false);

      // First filter
      expect(crumbs[1].label).toContain('Machine');
      expect(crumbs[1].isActive).toBe(false);

      // Last filter (active)
      expect(crumbs[2].label).toContain('Shift');
      expect(crumbs[2].isActive).toBe(true);
    });

    it('root breadcrumb is active when no filters exist', () => {
      const { result } = renderFilterNav();

      expect(result.current.breadcrumbs[0].isActive).toBe(true);
    });

    it('breadcrumbs update after removeLastFilter', () => {
      const { result } = renderFilterNav();

      act(() => {
        result.current.applyFilter({
          type: 'filter',
          source: 'boxplot',
          factor: 'Machine',
          values: ['A'],
        });
      });
      act(() => {
        result.current.applyFilter({
          type: 'filter',
          source: 'pareto',
          factor: 'Shift',
          values: ['Day'],
        });
      });

      act(() => {
        result.current.removeLastFilter();
      });

      const crumbs = result.current.breadcrumbs;
      expect(crumbs).toHaveLength(2); // root + Machine
      expect(crumbs[1].isActive).toBe(true);
      expect(crumbs[1].label).toContain('Machine');
    });
  });

  // --------------------------------------------------------------------------
  // Column aliases in labels
  // --------------------------------------------------------------------------

  describe('column aliases', () => {
    it('applyFilter uses column alias in the label', () => {
      const { result } = renderFilterNav(aliasedContext);

      act(() => {
        result.current.applyFilter({
          type: 'filter',
          source: 'boxplot',
          factor: 'Machine',
          values: ['A'],
        });
      });

      expect(result.current.filterStack[0].label).toContain('Equipment');
    });

    it('updateFilterValues uses column alias in the label', () => {
      const { result } = renderFilterNav(aliasedContext);

      act(() => {
        result.current.updateFilterValues('Machine', ['A', 'B']);
      });

      expect(result.current.filterStack[0].label).toContain('Equipment');
    });
  });
});
