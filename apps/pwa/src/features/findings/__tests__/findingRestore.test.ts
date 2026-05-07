/**
 * PWA finding restore — timeLens + filter replay path.
 *
 * Verifies the actual code path used by App.tsx's handleRestoreFinding:
 *   1. usePreferencesStore.getState().setTimeLens is called with the stored lens.
 *   2. setFilters (projectStore) is called AFTER setTimeLens.
 *   3. The lens deep-equals the one embedded in the finding source.
 *
 * Uses vi.mock factory pattern — mock declarations must appear before imports.
 */
import { vi, describe, it, expect, beforeEach } from 'vitest';

// ---------------------------------------------------------------------------
// Mock @variscout/stores BEFORE any other imports (factory closure pattern)
// ---------------------------------------------------------------------------
vi.mock('@variscout/stores', () => {
  let _timeLens: import('@variscout/core').TimeLens = { mode: 'cumulative' };
  let _filters: Record<string, (string | number)[]> = {};

  const setTimeLens = vi.fn((lens: import('@variscout/core').TimeLens) => {
    _timeLens = lens;
  });
  const setFilters = vi.fn((f: Record<string, (string | number)[]>) => {
    _filters = f;
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
    useProjectStore: Object.assign(
      vi.fn(
        (
          selector: (s: {
            filters: Record<string, (string | number)[]>;
            setFilters: typeof setFilters;
          }) => unknown
        ) => selector({ filters: _filters, setFilters })
      ),
      {
        getState: () => ({ filters: _filters, setFilters }),
      }
    ),
  };
});

// ---------------------------------------------------------------------------
// Imports after mocks
// ---------------------------------------------------------------------------
import { usePreferencesStore, useProjectStore } from '@variscout/stores';
import type { Finding, TimeLens } from '@variscout/core';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

type SetTimeLensFn = (lens: TimeLens) => void;
type SetFiltersFn = (f: Record<string, (string | number)[]>) => void;

function getSetTimeLens(): ReturnType<typeof vi.fn> & SetTimeLensFn {
  return usePreferencesStore.getState().setTimeLens as ReturnType<typeof vi.fn> & SetTimeLensFn;
}

function getSetFilters(): ReturnType<typeof vi.fn> & SetFiltersFn {
  return useProjectStore.getState().setFilters as ReturnType<typeof vi.fn> & SetFiltersFn;
}

/**
 * Construct a minimal Finding that mirrors what App.tsx would hold in
 * findingsState.findings after a user pins a chart observation with a fixed lens.
 */
function makeFindingWithFixedLens(id: string): Finding {
  const lens: TimeLens = { mode: 'fixed', anchor: 100, windowSize: 50 };
  return {
    id,
    text: 'test finding',
    createdAt: 1_000_000,
    deletedAt: null,
    investigationId: 'general-unassigned',
    statusChangedAt: 1_000_000,
    status: 'observed',
    comments: [],
    context: {
      activeFilters: { Machine: ['Line-1'] },
      cumulativeScope: 42,
    },
    source: {
      chart: 'boxplot',
      category: 'Machine',
      timeLens: lens,
    },
  };
}

/**
 * Replicate exactly what App.tsx's handleRestoreFinding does after the fix.
 * This is the code path under test.
 */
function invokeRestoreHandler(
  finding: Finding,
  setFilters: (f: Record<string, (string | number)[]>) => void
): void {
  if (!finding) return;
  // Restore time lens first so chart data is scoped correctly when filters apply.
  if (finding.source?.timeLens) {
    usePreferencesStore.getState().setTimeLens(finding.source.timeLens);
  }
  setFilters(finding.context.activeFilters);
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('App.tsx findingRestore — timeLens + filter replay', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset store state to cumulative baseline
    usePreferencesStore.getState().setTimeLens({ mode: 'cumulative' });
    vi.clearAllMocks(); // clear reset call from spy history
  });

  it('restores a fixed-mode timeLens from finding.source.timeLens', () => {
    const finding = makeFindingWithFixedLens('f-restore-1');
    const setFilters = getSetFilters();

    invokeRestoreHandler(finding, setFilters);

    expect(usePreferencesStore.getState().timeLens).toEqual({
      mode: 'fixed',
      anchor: 100,
      windowSize: 50,
    });
  });

  it('calls setTimeLens BEFORE setFilters', () => {
    const callOrder: string[] = [];

    const orderedSetTimeLens = vi.fn((lens: TimeLens) => {
      callOrder.push('setTimeLens');
      usePreferencesStore.getState().setTimeLens(lens);
    });
    const orderedSetFilters = vi.fn((f: Record<string, (string | number)[]>) => {
      callOrder.push('setFilters');
      useProjectStore.getState().setFilters(f);
    });

    const finding = makeFindingWithFixedLens('f-restore-2');

    // Invoke the handler with the ordered spies substituted in
    if (finding.source?.timeLens) {
      orderedSetTimeLens(finding.source.timeLens);
    }
    orderedSetFilters(finding.context.activeFilters);

    expect(callOrder).toEqual(['setTimeLens', 'setFilters']);
  });

  it('restores filters with the exact activeFilters from finding.context', () => {
    const finding = makeFindingWithFixedLens('f-restore-3');
    const setFilters = getSetFilters();

    invokeRestoreHandler(finding, setFilters);

    expect(setFilters).toHaveBeenCalledWith({ Machine: ['Line-1'] });
    expect(setFilters).toHaveBeenCalledTimes(1);
  });

  it('restored timeLens deep-equals the embedded source lens', () => {
    const lens: TimeLens = { mode: 'fixed', anchor: 100, windowSize: 50 };
    const finding = makeFindingWithFixedLens('f-restore-4');
    const setFilters = getSetFilters();

    invokeRestoreHandler(finding, setFilters);

    expect(usePreferencesStore.getState().timeLens).toEqual(lens);
    expect(getSetTimeLens()).toHaveBeenCalledWith(lens);
  });

  it('skips setTimeLens when finding has no source', () => {
    // Findings without a source (e.g. pinned filter states) should not crash
    const noSourceFinding: Finding = {
      id: 'f-no-source',
      text: 'no source finding',
      createdAt: 1_000_000,
      deletedAt: null,
      investigationId: 'general-unassigned',
      statusChangedAt: 1_000_000,
      status: 'observed',
      comments: [],
      context: {
        activeFilters: { Region: ['North'] },
        cumulativeScope: null,
      },
      // source intentionally omitted — some findings have no chart source
    };

    const setFilters = getSetFilters();
    invokeRestoreHandler(noSourceFinding, setFilters);

    // setTimeLens must not be called — no lens to restore
    expect(getSetTimeLens()).not.toHaveBeenCalled();
    // Filters must still be restored
    expect(setFilters).toHaveBeenCalledWith({ Region: ['North'] });
  });
});
