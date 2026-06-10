/**
 * ER-0 Task 6 — Finding capture: condition-scoped stats.
 *
 * Bug (2026-06-10 walkthrough): the FindingCard rendered condition chips from
 * `context.activeFilters` next to `n={context.stats.samples}` computed over a
 * DIFFERENT row set (the dashboard's unconditioned `filteredData`). The capture
 * handler passed the draft's condition as `captureOptions.activeFilters` but the
 * dashboard's rows to buildFindingContext, so n was wrong (dialog n=404 → card
 * n=1600).
 *
 * Fix: when `captureOptions.activeFilters` is present, compute the finding's
 * stats over `applyFilters(useProjectStore.getState().rawData, activeFilters)` —
 * the SAME row set the condition chips describe. The store read MUST be fresh
 * (getState), not a render-scope closure, because brush/probability/engine-signal
 * captures add a derived column via setRawData in the SAME tick.
 *
 * These tests use the REAL buildFindingContext / applyFilters (NOT mocked) so the
 * assertion is on the genuine computed samples count.
 *
 * vi.mock() BEFORE component imports — testing.md invariant.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

// ── Mocks BEFORE component imports ────────────────────────────────────────

const addFindingMock = vi.hoisted(() =>
  vi.fn(
    (
      _text: string,
      context: unknown
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ): any => ({ id: 'f-new', text: '', context })
  )
);
const findDuplicateSourceMock = vi.hoisted(() => vi.fn(() => undefined));
const setHighlightedFindingIdMock = vi.hoisted(() => vi.fn());
const setFindingsOpenMock = vi.hoisted(() => vi.fn());

// Mock ONLY useFindings so we can intercept the context passed to addFinding.
// buildFindingContext / applyFilters / useDrillPath / buildFindingSource stay
// REAL — they are what's under test.
vi.mock('@variscout/hooks', async importOriginal => {
  const actual = await importOriginal<typeof import('@variscout/hooks')>();
  return {
    ...actual,
    useFindings: () => ({
      findings: [],
      addFinding: addFindingMock,
      findDuplicate: vi.fn(() => undefined),
      findDuplicateSource: findDuplicateSourceMock,
      editFinding: vi.fn(),
      deleteFinding: vi.fn(),
      setFindingTag: vi.fn(),
      setFindingAssignee: vi.fn(),
      getFindingContext: vi.fn(),
      setOutcome: vi.fn(),
      addAction: vi.fn(),
      completeAction: vi.fn(),
      deleteAction: vi.fn(),
      addFindingComment: vi.fn(),
      setProjection: vi.fn(),
    }),
  };
});

vi.mock('../findingsStore', () => ({
  useFindingsStore: (selector: (s: { highlightedFindingId: string | null }) => unknown) =>
    selector({ highlightedFindingId: null }),
  groupFindingsByChart: () => ({ boxplot: [], pareto: [], ichart: [] }),
}));

vi.mock('../../panels/panelsStore', () => ({
  usePanelsStore: {
    getState: () => ({ setFindingsOpen: setFindingsOpenMock }),
  },
}));

vi.mock('../../findings/usePopoutSync', () => ({
  usePopoutSync: vi.fn(() => ({ handleOpenFindingsPopout: vi.fn() })),
}));

// ── Imports AFTER mocks ────────────────────────────────────────────────────

import { useFindingsOrchestration } from '../useFindingsOrchestration';
import { useFindingsStore } from '../findingsStore';
import type { UseFindingsOrchestrationOptions } from '../useFindingsOrchestration';
import { useProjectStore, getProjectInitialState, usePreferencesStore } from '@variscout/stores';
import type { DataRow } from '@variscout/core';

(useFindingsStore as unknown as { getState: () => unknown }).getState = () => ({
  setHighlightedFindingId: setHighlightedFindingIdMock,
});

// Deterministic dataset: 4 Billing rows + 6 Sales rows. Y = a constant
// distinguishable by Queue so the samples count is the only thing under test.
const ROWS: DataRow[] = [
  ...Array.from({ length: 4 }, (_, i) => ({ Queue: 'Billing', Y: 10 + i })),
  ...Array.from({ length: 6 }, (_, i) => ({ Queue: 'Sales', Y: 100 + i })),
];

function makeOptions(
  overrides: Partial<UseFindingsOrchestrationOptions> = {}
): UseFindingsOrchestrationOptions {
  const noOp = vi.fn();
  return {
    persistedFindings: [],
    setPersistedFindings: noOp,
    // Dashboard filters are BROADER than the captured condition — this is the
    // mismatch that produced the bug.
    filters: {},
    filteredData: ROWS, // the dashboard's unconditioned rows (all 10)
    outcome: 'Y',
    specs: undefined,
    rawData: ROWS,
    columnAliases: {},
    filterNav: {
      filterStack: [],
      pushFilter: noOp,
      popFilter: noOp,
      clearFilters: noOp,
    } as never,
    setFilters: noOp,
    shareFinding: vi.fn(async () => true),
    canMentionInChannel: false,
    onViewStateChange: noOp,
    ...overrides,
  };
}

describe('useFindingsOrchestration — condition-scoped finding stats (ER-0 Task 6)', () => {
  beforeEach(() => {
    addFindingMock.mockClear();
    findDuplicateSourceMock.mockClear();
    setHighlightedFindingIdMock.mockClear();
    setFindingsOpenMock.mockClear();
    useProjectStore.setState({ ...getProjectInitialState(), rawData: ROWS, outcome: 'Y' });
    // useFindings is the real hook; clear preferences for buildFindingSource.
    usePreferencesStore.setState({ timeLens: 'open-ended' } as never);
  });

  it('computes samples over the captured condition rows, not the dashboard filteredData', () => {
    const { result } = renderHook(() => useFindingsOrchestration(makeOptions()));

    act(() => {
      result.current.handleAddChartObservation('boxplot', 'Billing', 'note', undefined, undefined, {
        activeFilters: { Queue: ['Billing'] },
        captureMode: 'capture',
      });
    });

    expect(addFindingMock).toHaveBeenCalledTimes(1);
    const context = (addFindingMock.mock.calls[0] as unknown[])[1] as {
      stats?: { samples?: number };
    };
    // Billing has 4 rows; the dashboard filteredData had all 10. The persisted
    // samples MUST equal the captured condition's count.
    expect(context.stats?.samples).toBe(4);
  });

  it('reads fresh rawData (getState) so a same-tick derived column is counted', () => {
    const { result } = renderHook(() => useFindingsOrchestration(makeOptions()));

    act(() => {
      // Simulate the Dashboard same-tick sequence: add a derived 'obs' column via
      // setRawData, THEN capture a finding filtered on that brand-new column.
      const derived = useProjectStore
        .getState()
        .rawData.map((row, i) => ({ ...row, obs: i < 3 ? 'in' : 'out' }));
      useProjectStore.getState().setRawData(derived);
      result.current.handleAddChartObservation('ichart', undefined, 'brush', 0, 10, {
        activeFilters: { obs: ['in'] },
        captureMode: 'capture',
        brushedRange: { startIdx: 0, endIdx: 2 },
      });
    });

    expect(addFindingMock).toHaveBeenCalledTimes(1);
    const context = (addFindingMock.mock.calls[0] as unknown[])[1] as {
      stats?: { samples?: number };
    };
    // 3 rows carry obs='in'. A stale-closure implementation would call
    // applyFilters on the PRE-setRawData rows (no `obs` column); `row['obs']`
    // is undefined, `['in'].includes(undefined)` is false, so every row is
    // excluded → 0 matches → stats = undefined. The test would fail because
    // `samples` would be undefined rather than 3.
    expect(context.stats?.samples).toBe(3);
  });

  it('without captureOptions.activeFilters, keeps today filteredData semantics (context-menu path stays consistent)', () => {
    const { result } = renderHook(() =>
      useFindingsOrchestration(makeOptions({ filteredData: ROWS.slice(0, 5) }))
    );

    act(() => {
      // No captureOptions → the legacy path: stats over filteredData (5 rows).
      result.current.handleAddChartObservation('boxplot', 'Billing', 'note');
    });

    expect(addFindingMock).toHaveBeenCalledTimes(1);
    const context = (addFindingMock.mock.calls[0] as unknown[])[1] as {
      stats?: { samples?: number };
    };
    expect(context.stats?.samples).toBe(5);
  });
});
