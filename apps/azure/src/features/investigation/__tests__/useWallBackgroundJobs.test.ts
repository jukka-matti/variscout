import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// vi.mock() MUST precede all imports that touch the mocked modules.
vi.mock('@variscout/core', async importOriginal => {
  const actual = await importOriginal<typeof import('@variscout/core')>();
  return {
    ...actual,
    detectBestSubsetsCandidates: vi.fn().mockReturnValue([]),
  };
});

import { detectBestSubsetsCandidates } from '@variscout/core';
import { useProjectStore, useInvestigationStore } from '@variscout/stores';
import { useAIStore } from '../../ai/aiStore';
import { useWallBackgroundJobs } from '../useWallBackgroundJobs';

const mockDetect = vi.mocked(detectBestSubsetsCandidates);

function resetStores(): void {
  // Project store: set minimal shape relevant to the hook.
  useProjectStore.setState({ rawData: [], outcome: null });
  // Investigation store: clear suspected causes.
  useInvestigationStore.setState({ suspectedCauses: [] });
  // AI store: clear suggestions.
  useAIStore.setState({ wallSuggestions: [] });
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.useFakeTimers();
  resetStores();
});

afterEach(() => {
  vi.useRealTimers();
});

/**
 * Build a minimal row set with two columns so the detector would see enough
 * data to run if it weren't mocked. Deterministic — no Math.random.
 */
function seedRows(n: number): Array<Record<string, number | string>> {
  const rows: Array<Record<string, number | string>> = [];
  for (let i = 0; i < n; i++) {
    rows.push({ Weight: 100 + (i % 10), Machine: i % 2 === 0 ? 'M1' : 'M2' });
  }
  return rows;
}

describe('useWallBackgroundJobs (azure)', () => {
  it('does not run the detector before the debounce window elapses', () => {
    renderHook(() => useWallBackgroundJobs());

    act(() => {
      useProjectStore.setState({ rawData: seedRows(20), outcome: 'Weight' });
    });

    // Still within the 2000ms debounce — detector must not have run.
    act(() => {
      vi.advanceTimersByTime(1999);
    });
    expect(mockDetect).not.toHaveBeenCalled();
  });

  it('runs the detector once after the 2000ms debounce elapses', () => {
    renderHook(() => useWallBackgroundJobs());

    act(() => {
      useProjectStore.setState({ rawData: seedRows(20), outcome: 'Weight' });
    });

    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(mockDetect).toHaveBeenCalledTimes(1);
  });

  it('coalesces a burst of changes into a single detector call', () => {
    renderHook(() => useWallBackgroundJobs());

    act(() => {
      useProjectStore.setState({ rawData: seedRows(20), outcome: 'Weight' });
      useProjectStore.setState({ rawData: seedRows(21), outcome: 'Weight' });
      useProjectStore.setState({ rawData: seedRows(22), outcome: 'Weight' });
    });

    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(mockDetect).toHaveBeenCalledTimes(1);
  });

  it('emits candidates into aiStore.wallSuggestions when the detector returns results', () => {
    mockDetect.mockReturnValue([
      { columns: ['Machine'], rSquaredAdj: 0.92, improvementOverBaseline: 0.5 },
    ]);

    renderHook(() => useWallBackgroundJobs());

    act(() => {
      useProjectStore.setState({ rawData: seedRows(20), outcome: 'Weight' });
    });
    act(() => {
      vi.advanceTimersByTime(2000);
    });

    const suggestions = useAIStore.getState().wallSuggestions;
    expect(suggestions).toHaveLength(1);
    expect(suggestions[0].kind).toBe('suggestion');
    expect(suggestions[0].source).toBe('best-subsets');
    expect(suggestions[0].candidates).toEqual([
      { columns: ['Machine'], rSquaredAdj: 0.92, improvementOverBaseline: 0.5 },
    ]);
  });

  it('clears suggestions when the detector returns no candidates', () => {
    // Seed an existing suggestion so we can observe it being cleared.
    useAIStore.getState().upsertWallSuggestion({
      kind: 'suggestion',
      id: 'best-subsets',
      source: 'best-subsets',
      candidates: [{ columns: ['Machine'], rSquaredAdj: 0.5, improvementOverBaseline: 0.2 }],
      emittedAt: 1,
    });

    mockDetect.mockReturnValue([]);

    renderHook(() => useWallBackgroundJobs());

    act(() => {
      useProjectStore.setState({ rawData: seedRows(20), outcome: 'Weight' });
    });
    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(useAIStore.getState().wallSuggestions).toEqual([]);
  });

  it('skips the detector when outcome is null', () => {
    renderHook(() => useWallBackgroundJobs());

    act(() => {
      useProjectStore.setState({ rawData: seedRows(20), outcome: null });
    });
    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(mockDetect).not.toHaveBeenCalled();
  });

  it('skips the detector when there are no rows', () => {
    renderHook(() => useWallBackgroundJobs());

    act(() => {
      useProjectStore.setState({ rawData: [], outcome: 'Weight' });
    });
    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(mockDetect).not.toHaveBeenCalled();
  });

  it('passes cited columns collected from hubs to the detector', () => {
    mockDetect.mockReturnValue([]);

    renderHook(() => useWallBackgroundJobs());

    act(() => {
      useProjectStore.setState({ rawData: seedRows(20), outcome: 'Weight' });
      useInvestigationStore.setState({
        suspectedCauses: [
          {
            id: 'h1',
            name: 'H1',
            synthesis: '',
            questionIds: [],
            findingIds: [],
            status: 'suspected',
            createdAt: Date.parse('2026-04-19T00:00:00Z'),
            updatedAt: Date.parse('2026-04-19T00:00:00Z'),
            deletedAt: null,
            investigationId: 'general-unassigned',
            condition: { kind: 'leaf', column: 'Machine', op: 'eq', value: 'M1' },
          },
        ],
      });
    });

    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(mockDetect).toHaveBeenCalledTimes(1);
    // Signature: (rows, ctsColumn, allColumns, citedColumns)
    const [, ctsColumn, allColumns, citedColumns] = mockDetect.mock.calls[0];
    expect(ctsColumn).toBe('Weight');
    expect(Array.from(allColumns)).toContain('Machine');
    expect(Array.from(citedColumns)).toEqual(['Machine']);
  });

  it('unsubscribes and stops running on unmount', () => {
    const { unmount } = renderHook(() => useWallBackgroundJobs());
    unmount();

    act(() => {
      useProjectStore.setState({ rawData: seedRows(20), outcome: 'Weight' });
      vi.advanceTimersByTime(5000);
    });

    expect(mockDetect).not.toHaveBeenCalled();
  });
});
