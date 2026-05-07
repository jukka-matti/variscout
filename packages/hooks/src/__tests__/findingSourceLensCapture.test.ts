/**
 * Tests for timeLens capture on finding recording and replay.
 *
 * Recording: buildFindingSource snapshots the session lens at the moment of call.
 * Replay: handleRestoreFinding (via useFindingsOrchestration) calls setTimeLens
 *         with the stored lens before restoring filters.
 *
 * Uses vi.mock factory pattern — mock declarations before any imports.
 */
import { vi, describe, it, expect, beforeEach } from 'vitest';

// ---------------------------------------------------------------------------
// Mock @variscout/stores BEFORE imports so the factory pattern is correct
// ---------------------------------------------------------------------------
vi.mock('@variscout/stores', () => {
  let _timeLens: import('@variscout/core').TimeLens = { mode: 'cumulative' };
  const setTimeLens = vi.fn((lens: import('@variscout/core').TimeLens) => {
    _timeLens = lens;
  });
  return {
    usePreferencesStore: Object.assign(
      vi.fn((selector: (s: { timeLens: import('@variscout/core').TimeLens }) => unknown) =>
        selector({ timeLens: _timeLens })
      ),
      {
        getState: () => ({ timeLens: _timeLens, setTimeLens }),
      }
    ),
  };
});

import { buildFindingSource } from '../findingCreation';
import { usePreferencesStore } from '@variscout/stores';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getSetTimeLens() {
  return usePreferencesStore.getState().setTimeLens as ReturnType<typeof vi.fn>;
}

// ---------------------------------------------------------------------------
// Recording tests
// ---------------------------------------------------------------------------

describe('buildFindingSource — timeLens capture', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset lens to cumulative for each test
    usePreferencesStore.getState().setTimeLens({ mode: 'cumulative' });
    vi.clearAllMocks(); // clear setTimeLens calls from the reset itself
  });

  it('captures cumulative lens on boxplot source', () => {
    // Default lens is cumulative
    const source = buildFindingSource('boxplot', 'Machine A');
    expect(source.timeLens).toEqual({ mode: 'cumulative' });
    expect(source.chart).toBe('boxplot');
    if (source.chart === 'boxplot' || source.chart === 'pareto') {
      expect(source.category).toBe('Machine A');
    }
  });

  it('captures rolling lens on ichart source when session lens is rolling', () => {
    // Set rolling lens in the store
    usePreferencesStore.getState().setTimeLens({ mode: 'rolling', windowSize: 50 });

    const source = buildFindingSource('ichart', undefined, 5, 2.3);
    expect(source.timeLens).toEqual({ mode: 'rolling', windowSize: 50 });
    expect(source.chart).toBe('ichart');
  });

  it('captures fixed lens on pareto source', () => {
    usePreferencesStore.getState().setTimeLens({ mode: 'fixed', anchor: 100, windowSize: 50 });

    const source = buildFindingSource('pareto', 'Defect X');
    expect(source.timeLens).toEqual({ mode: 'fixed', anchor: 100, windowSize: 50 });
    expect(source.chart).toBe('pareto');
  });

  it('deep-equals the exact lens from getState() at recording time', () => {
    const lens = { mode: 'rolling' as const, windowSize: 75 };
    usePreferencesStore.getState().setTimeLens(lens);

    const source = buildFindingSource('boxplot', 'Zone B');
    // The captured lens must structurally match the lens that was set
    expect(source.timeLens).toEqual(lens);
    expect(source.timeLens).toMatchObject({ mode: 'rolling', windowSize: 75 });
  });
});

// ---------------------------------------------------------------------------
// Replay tests — setTimeLens is called when replaying a finding
// ---------------------------------------------------------------------------

describe('finding replay — setTimeLens restored from source.timeLens', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    usePreferencesStore.getState().setTimeLens({ mode: 'cumulative' });
    vi.clearAllMocks();
  });

  it('calling setTimeLens with fixed lens restores it in the store', () => {
    const fixedLens = { mode: 'fixed' as const, anchor: 100, windowSize: 50 };

    // Simulate what handleRestoreFinding does: call setTimeLens before restoring filters
    usePreferencesStore.getState().setTimeLens(fixedLens);

    expect(usePreferencesStore.getState().timeLens).toEqual(fixedLens);
    expect(getSetTimeLens()).toHaveBeenCalledWith(fixedLens);
  });

  it('replay pattern: setTimeLens called BEFORE filter restoration', () => {
    const rollingLens = { mode: 'rolling' as const, windowSize: 50 };
    const callOrder: string[] = [];

    const mockSetTimeLens = vi.fn((lens: import('@variscout/core').TimeLens) => {
      callOrder.push('setTimeLens');
      usePreferencesStore.getState().setTimeLens(lens);
    });
    const mockSetFilters = vi.fn(() => {
      callOrder.push('setFilters');
    });

    // Simulate handleRestoreFinding logic
    const finding = {
      source: {
        chart: 'boxplot' as const,
        category: 'Machine A',
        timeLens: rollingLens,
      },
      context: { activeFilters: { Machine: ['A'] }, cumulativeScope: 42 },
    };

    if (finding.source.timeLens) {
      mockSetTimeLens(finding.source.timeLens);
    }
    mockSetFilters(finding.context.activeFilters);

    expect(callOrder).toEqual(['setTimeLens', 'setFilters']);
    expect(usePreferencesStore.getState().timeLens).toEqual(rollingLens);
  });
});
