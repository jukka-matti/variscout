import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDrillDown } from '../useDrillDown';
import * as DataContextModule from '../../context/DataContext';

// Mock the DataContext
vi.mock('../../context/DataContext', () => ({
  useData: vi.fn(),
}));

describe('useDrillDown', () => {
  const mockSetFilters = vi.fn();
  const mockDataContext = {
    filters: {},
    setFilters: mockSetFilters,
    columnAliases: {},
  };

  // Store original window methods
  const originalLocationSearch = window.location.search;
  const originalLocationHref = window.location.href;
  const originalPushState = window.history.pushState;
  const originalReplaceState = window.history.replaceState;

  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(DataContextModule, 'useData').mockReturnValue(mockDataContext as any);

    // Mock window.location properties using Object.defineProperty
    Object.defineProperty(window, 'location', {
      value: {
        ...window.location,
        search: '',
        href: 'http://localhost:5173/',
      },
      writable: true,
    });

    // Mock window.history methods
    const historyState: any[] = [null];
    let currentIndex = 0;

    window.history.pushState = vi.fn((state: any) => {
      currentIndex++;
      historyState[currentIndex] = state;
    }) as any;

    window.history.replaceState = vi.fn((state: any) => {
      historyState[currentIndex] = state;
    }) as any;
  });

  afterEach(() => {
    // Restore original methods
    Object.defineProperty(window, 'location', {
      value: {
        ...window.location,
        search: originalLocationSearch,
        href: originalLocationHref,
      },
      writable: true,
    });
    window.history.pushState = originalPushState;
    window.history.replaceState = originalReplaceState;
  });

  describe('basic functionality', () => {
    it('initializes with empty drill stack', () => {
      const { result } = renderHook(() => useDrillDown());

      expect(result.current.drillStack).toEqual([]);
      expect(result.current.hasDrills).toBe(false);
      expect(result.current.breadcrumbs).toHaveLength(1);
      expect(result.current.breadcrumbs[0].id).toBe('root');
    });

    it('drillDown adds action to stack', () => {
      const { result } = renderHook(() => useDrillDown());

      act(() => {
        result.current.drillDown({
          type: 'filter',
          source: 'boxplot',
          factor: 'Machine',
          values: ['A'],
        });
      });

      expect(result.current.drillStack).toHaveLength(1);
      expect(result.current.drillStack[0].factor).toBe('Machine');
      expect(result.current.drillStack[0].values).toEqual(['A']);
      expect(result.current.hasDrills).toBe(true);
    });

    it('drillDown toggles off existing filter', () => {
      vi.spyOn(DataContextModule, 'useData').mockReturnValue({
        ...mockDataContext,
        filters: { Machine: ['A'] },
      } as any);

      const { result } = renderHook(() => useDrillDown());

      // First add a drill
      act(() => {
        result.current.drillDown({
          type: 'filter',
          source: 'boxplot',
          factor: 'Machine',
          values: ['A'],
        });
      });

      // Now toggle it off
      act(() => {
        result.current.drillDown({
          type: 'filter',
          source: 'boxplot',
          factor: 'Machine',
          values: ['A'],
        });
      });

      expect(result.current.drillStack).toHaveLength(0);
      expect(result.current.hasDrills).toBe(false);
    });

    it('clearDrill resets all state', () => {
      const { result } = renderHook(() => useDrillDown());

      // Add some drills
      act(() => {
        result.current.drillDown({
          type: 'filter',
          source: 'boxplot',
          factor: 'Machine',
          values: ['A'],
        });
      });

      act(() => {
        result.current.clearDrill();
      });

      expect(result.current.drillStack).toHaveLength(0);
      expect(result.current.hasDrills).toBe(false);
    });

    it('drillTo navigates to specific action', () => {
      const { result } = renderHook(() => useDrillDown());

      // Add two drills
      act(() => {
        result.current.drillDown({
          type: 'filter',
          source: 'boxplot',
          factor: 'Machine',
          values: ['A'],
        });
      });

      const firstActionId = result.current.drillStack[0].id;

      act(() => {
        result.current.drillDown({
          type: 'filter',
          source: 'boxplot',
          factor: 'Shift',
          values: ['Day'],
        });
      });

      expect(result.current.drillStack).toHaveLength(2);

      // Navigate back to first action
      act(() => {
        result.current.drillTo(firstActionId);
      });

      expect(result.current.drillStack).toHaveLength(1);
      expect(result.current.drillStack[0].factor).toBe('Machine');
    });

    it('drillTo root clears all drills', () => {
      const { result } = renderHook(() => useDrillDown());

      act(() => {
        result.current.drillDown({
          type: 'filter',
          source: 'boxplot',
          factor: 'Machine',
          values: ['A'],
        });
      });

      act(() => {
        result.current.drillTo('root');
      });

      expect(result.current.drillStack).toHaveLength(0);
    });
  });

  describe('highlight functionality', () => {
    it('handles highlight type drill without adding to stack', () => {
      const { result } = renderHook(() => useDrillDown());

      act(() => {
        result.current.drillDown({
          type: 'highlight',
          source: 'ichart',
          values: [42],
          rowIndex: 5,
        });
      });

      expect(result.current.drillStack).toHaveLength(0);
      expect(result.current.currentHighlight).toEqual({
        rowIndex: 5,
        value: 42,
        originalIndex: undefined,
      });
    });

    it('setHighlight and clearHighlight work correctly', () => {
      const { result } = renderHook(() => useDrillDown());

      act(() => {
        result.current.setHighlight(10, 50.5, 15);
      });

      expect(result.current.currentHighlight).toEqual({
        rowIndex: 10,
        value: 50.5,
        originalIndex: 15,
      });

      act(() => {
        result.current.clearHighlight();
      });

      expect(result.current.currentHighlight).toBeNull();
    });
  });

  describe('breadcrumb generation', () => {
    it('generates correct breadcrumbs', () => {
      const { result } = renderHook(() => useDrillDown());

      // Initially just root
      expect(result.current.breadcrumbs).toHaveLength(1);
      expect(result.current.breadcrumbs[0]).toEqual({
        id: 'root',
        label: 'All Data',
        isActive: true,
        source: 'ichart',
      });

      // Add a drill
      act(() => {
        result.current.drillDown({
          type: 'filter',
          source: 'boxplot',
          factor: 'Machine',
          values: ['A'],
        });
      });

      expect(result.current.breadcrumbs).toHaveLength(2);
      expect(result.current.breadcrumbs[0].isActive).toBe(false);
      expect(result.current.breadcrumbs[1].isActive).toBe(true);
      expect(result.current.breadcrumbs[1].label).toContain('Machine');
    });
  });

  describe('history integration', () => {
    it('pushes history state when enableHistory is true', () => {
      const { result } = renderHook(() =>
        useDrillDown({ enableHistory: true, enableUrlSync: false })
      );

      act(() => {
        result.current.drillDown({
          type: 'filter',
          source: 'boxplot',
          factor: 'Machine',
          values: ['A'],
        });
      });

      expect(window.history.pushState).toHaveBeenCalled();
      const lastCall = (window.history.pushState as any).mock.calls.slice(-1)[0];
      expect(lastCall[0]).toHaveProperty('drillFilters');
      expect(lastCall[0].drillFilters).toEqual({ Machine: ['A'] });
    });

    it('does not push history when enableHistory is false', () => {
      const { result } = renderHook(() =>
        useDrillDown({ enableHistory: false, enableUrlSync: false })
      );

      act(() => {
        result.current.drillDown({
          type: 'filter',
          source: 'boxplot',
          factor: 'Machine',
          values: ['A'],
        });
      });

      expect(window.history.pushState).not.toHaveBeenCalled();
    });
  });

  describe('URL sync', () => {
    it('initializes from URL parameters when enableUrlSync is true', () => {
      window.location.search = '?filter=Machine:A,B';

      renderHook(() => useDrillDown({ enableHistory: false, enableUrlSync: true }));

      // Should call setFilters with parsed URL params
      expect(mockSetFilters).toHaveBeenCalledWith({ Machine: ['A', 'B'] });
    });

    it('does not initialize from URL when enableUrlSync is false', () => {
      // Reset the mock and set fresh URL
      mockSetFilters.mockClear();
      Object.defineProperty(window, 'location', {
        value: {
          ...window.location,
          search: '?filter=Machine:A',
          href: 'http://localhost:5173/?filter=Machine:A',
        },
        writable: true,
      });

      renderHook(() => useDrillDown({ enableHistory: false, enableUrlSync: false }));

      // With enableUrlSync false, setFilters should not be called with URL filters
      // Check that we didn't initialize from URL
      const calls = mockSetFilters.mock.calls;
      const hasUrlFiltersInitialization = calls.some(
        (call: any) =>
          call[0]?.Machine && Array.isArray(call[0].Machine) && call[0].Machine.includes('A')
      );
      expect(hasUrlFiltersInitialization).toBe(false);
    });
  });

  describe('column alias support', () => {
    it('uses column aliases in labels', () => {
      vi.spyOn(DataContextModule, 'useData').mockReturnValue({
        ...mockDataContext,
        columnAliases: { Machine: 'Equipment' },
      } as any);

      const { result } = renderHook(() => useDrillDown());

      act(() => {
        result.current.drillDown({
          type: 'filter',
          source: 'boxplot',
          factor: 'Machine',
          values: ['A'],
        });
      });

      expect(result.current.drillStack[0].label).toContain('Equipment');
    });
  });
});
