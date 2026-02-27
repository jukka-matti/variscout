/**
 * Tests for useDataState hook
 *
 * Validates core state management: initial state, setters, computed values
 * (filteredData, stats), and performance mode toggling.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDataState } from '../useDataState';
import type { PersistenceAdapter } from '../types';

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

function createMockPersistence(): PersistenceAdapter {
  return {
    saveProject: vi.fn().mockResolvedValue({
      id: 'test-id',
      name: 'Test',
      state: {},
      savedAt: new Date().toISOString(),
      rowCount: 0,
    }),
    loadProject: vi.fn().mockResolvedValue(undefined),
    listProjects: vi.fn().mockResolvedValue([]),
    deleteProject: vi.fn().mockResolvedValue(undefined),
    renameProject: vi.fn().mockResolvedValue(undefined),
    exportToFile: vi.fn(),
    importFromFile: vi.fn().mockResolvedValue({
      version: '1',
      rawData: [],
      outcome: null,
      factors: [],
      specs: {},
      filters: {},
      axisSettings: {},
    }),
  };
}

const testData = [
  { Machine: 'A', Weight: 10 },
  { Machine: 'A', Weight: 20 },
  { Machine: 'B', Weight: 30 },
  { Machine: 'B', Weight: 40 },
];

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('useDataState', () => {
  let mockPersistence: PersistenceAdapter;

  beforeEach(() => {
    mockPersistence = createMockPersistence();
  });

  // ---- Initial state ----

  it('returns empty initial state', () => {
    const { result } = renderHook(() => useDataState({ persistence: mockPersistence }));
    const [state] = result.current;

    expect(state.rawData).toEqual([]);
    expect(state.outcome).toBeNull();
    expect(state.factors).toEqual([]);
    expect(state.filters).toEqual({});
    expect(state.filteredData).toEqual([]);
    expect(state.stats).toBeNull();
    expect(state.isPerformanceMode).toBe(false);
    expect(state.measureColumns).toEqual([]);
    expect(state.measureLabel).toBe('Measure');
  });

  // ---- Core setters ----

  it('setRawData updates rawData', () => {
    const { result } = renderHook(() => useDataState({ persistence: mockPersistence }));

    act(() => {
      result.current[1].setRawData(testData);
    });

    expect(result.current[0].rawData).toEqual(testData);
    expect(result.current[0].rawData).toHaveLength(4);
  });

  it('setOutcome updates outcome', () => {
    const { result } = renderHook(() => useDataState({ persistence: mockPersistence }));

    act(() => {
      result.current[1].setOutcome('Weight');
    });

    expect(result.current[0].outcome).toBe('Weight');
  });

  it('setFactors updates factors', () => {
    const { result } = renderHook(() => useDataState({ persistence: mockPersistence }));

    act(() => {
      result.current[1].setFactors(['Machine']);
    });

    expect(result.current[0].factors).toEqual(['Machine']);
  });

  it('setSpecs updates specs', () => {
    const { result } = renderHook(() => useDataState({ persistence: mockPersistence }));

    act(() => {
      result.current[1].setSpecs({ usl: 50, lsl: 5 });
    });

    expect(result.current[0].specs).toEqual({ usl: 50, lsl: 5 });
  });

  // ---- Filters & filteredData ----

  it('setFilters updates filters and computes filteredData', () => {
    const { result } = renderHook(() => useDataState({ persistence: mockPersistence }));

    act(() => {
      result.current[1].setRawData(testData);
    });

    act(() => {
      result.current[1].setFilters({ Machine: ['A'] });
    });

    expect(result.current[0].filters).toEqual({ Machine: ['A'] });
    expect(result.current[0].filteredData).toHaveLength(2);
    expect(result.current[0].filteredData.every(r => r.Machine === 'A')).toBe(true);
  });

  it('filteredData with no filters equals rawData', () => {
    const { result } = renderHook(() => useDataState({ persistence: mockPersistence }));

    act(() => {
      result.current[1].setRawData(testData);
    });

    expect(result.current[0].filteredData).toEqual(testData);
    expect(result.current[0].filteredData).toHaveLength(4);
  });

  it('filteredData correctly filters based on multiple filter values', () => {
    const extendedData = [
      { Machine: 'A', Shift: '1', Weight: 10 },
      { Machine: 'A', Shift: '2', Weight: 20 },
      { Machine: 'B', Shift: '1', Weight: 30 },
      { Machine: 'B', Shift: '2', Weight: 40 },
    ];

    const { result } = renderHook(() => useDataState({ persistence: mockPersistence }));

    act(() => {
      result.current[1].setRawData(extendedData);
    });

    act(() => {
      result.current[1].setFilters({ Machine: ['A'], Shift: ['1'] });
    });

    expect(result.current[0].filteredData).toHaveLength(1);
    expect(result.current[0].filteredData[0]).toEqual({
      Machine: 'A',
      Shift: '1',
      Weight: 10,
    });
  });

  // ---- Computed stats ----

  it('stats are computed when rawData and outcome are set', () => {
    const { result } = renderHook(() => useDataState({ persistence: mockPersistence }));

    act(() => {
      result.current[1].setRawData(testData);
    });

    act(() => {
      result.current[1].setOutcome('Weight');
    });

    const stats = result.current[0].stats;
    expect(stats).not.toBeNull();
    expect(stats!.mean).toBe(25);
    expect(stats!.stdDev).toBeGreaterThan(0);
  });

  it('stats are null when no outcome is set', () => {
    const { result } = renderHook(() => useDataState({ persistence: mockPersistence }));

    act(() => {
      result.current[1].setRawData(testData);
    });

    expect(result.current[0].stats).toBeNull();
  });

  it('stats include capability indices when specs are provided', () => {
    const { result } = renderHook(() => useDataState({ persistence: mockPersistence }));

    act(() => {
      result.current[1].setRawData(testData);
    });

    act(() => {
      result.current[1].setOutcome('Weight');
      result.current[1].setSpecs({ usl: 50, lsl: 5 });
    });

    const stats = result.current[0].stats;
    expect(stats).not.toBeNull();
    expect(stats!.cp).toBeDefined();
    expect(stats!.cpk).toBeDefined();
    expect(stats!.cp).toBeGreaterThan(0);
  });

  // ---- Performance mode ----

  it('setPerformanceMode toggles performanceMode', () => {
    const { result } = renderHook(() => useDataState({ persistence: mockPersistence }));

    expect(result.current[0].isPerformanceMode).toBe(false);

    act(() => {
      result.current[1].setPerformanceMode(true);
    });

    expect(result.current[0].isPerformanceMode).toBe(true);

    act(() => {
      result.current[1].setPerformanceMode(false);
    });

    expect(result.current[0].isPerformanceMode).toBe(false);
  });

  it('setMeasureColumns and setMeasureLabel update performance state', () => {
    const { result } = renderHook(() => useDataState({ persistence: mockPersistence }));

    act(() => {
      result.current[1].setMeasureColumns(['Col1', 'Col2', 'Col3']);
      result.current[1].setMeasureLabel('Channel');
    });

    expect(result.current[0].measureColumns).toEqual(['Col1', 'Col2', 'Col3']);
    expect(result.current[0].measureLabel).toBe('Channel');
  });

  // ---- characteristicType in specs ----

  describe('characteristicType in specs', () => {
    it('setSpecs preserves characteristicType', () => {
      const { result } = renderHook(() => useDataState({ persistence: mockPersistence }));

      act(() => {
        result.current[1].setSpecs({ usl: 10, characteristicType: 'smaller' });
      });

      expect(result.current[0].specs.usl).toBe(10);
      expect(result.current[0].specs.characteristicType).toBe('smaller');
    });

    it('setSpecs with no characteristicType omits it', () => {
      const { result } = renderHook(() => useDataState({ persistence: mockPersistence }));

      act(() => {
        result.current[1].setSpecs({ usl: 10 });
      });

      expect(result.current[0].specs.usl).toBe(10);
      expect(result.current[0].specs.characteristicType).toBeUndefined();
    });

    it('setMeasureSpec preserves characteristicType', () => {
      const { result } = renderHook(() => useDataState({ persistence: mockPersistence }));

      act(() => {
        result.current[1].setMeasureSpec('FillHead1', {
          usl: 100,
          lsl: 90,
          characteristicType: 'larger',
        });
      });

      const measureSpecs = result.current[0].measureSpecs;
      expect(measureSpecs['FillHead1']).toBeDefined();
      expect(measureSpecs['FillHead1'].usl).toBe(100);
      expect(measureSpecs['FillHead1'].lsl).toBe(90);
      expect(measureSpecs['FillHead1'].characteristicType).toBe('larger');
    });
  });
});
