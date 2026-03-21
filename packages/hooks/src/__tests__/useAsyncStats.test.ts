import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useAsyncStats } from '../useAsyncStats';
import type { StatsResult, StatsWorkerAPI } from '@variscout/core';

const mockStats: StatsResult = {
  mean: 10,
  stdDev: 2,
  median: 10,
  sigmaWithin: 1.8,
  mrBar: 2.1,
  ucl: 15.4,
  lcl: 4.6,
  cp: 1.5,
  cpk: 1.2,
  outOfSpecPercentage: 0,
};

const mockWorker = {
  computeStats: vi.fn().mockResolvedValue({
    stats: mockStats,
    kde: null,
  }),
};

describe('useAsyncStats', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns null stats and isComputing=false with no data', () => {
    const { result } = renderHook(() =>
      useAsyncStats({ values: [], specs: {}, workerApi: mockWorker as unknown as StatsWorkerAPI })
    );
    expect(result.current.stats).toBeNull();
    expect(result.current.isComputing).toBe(false);
  });

  it('computes stats via worker when values are provided', async () => {
    const values = [1, 2, 3, 4, 5];
    const { result } = renderHook(() =>
      useAsyncStats({
        values,
        specs: { usl: 10 },
        workerApi: mockWorker as unknown as StatsWorkerAPI,
      })
    );

    await waitFor(() => {
      expect(result.current.stats).toEqual(mockStats);
    });
    expect(result.current.isComputing).toBe(false);
    expect(mockWorker.computeStats).toHaveBeenCalledTimes(1);
  });

  it('discards stale results (generation counter)', async () => {
    const slowWorker = {
      computeStats: vi
        .fn()
        .mockImplementationOnce(
          () =>
            new Promise(resolve =>
              setTimeout(() => resolve({ stats: { ...mockStats, mean: 1 }, kde: null }), 100)
            )
        )
        .mockImplementationOnce(() =>
          Promise.resolve({ stats: { ...mockStats, mean: 2 }, kde: null })
        ),
    };

    const { result, rerender } = renderHook(
      ({ values }) =>
        useAsyncStats({ values, specs: {}, workerApi: slowWorker as unknown as StatsWorkerAPI }),
      { initialProps: { values: [1] } }
    );

    // Trigger second computation before first resolves
    rerender({ values: [2] });

    await waitFor(() => {
      expect(result.current.stats?.mean).toBe(2);
    });
  });

  it('falls back to sync computation when workerApi is null', async () => {
    const values = [10, 20, 30];
    const { result } = renderHook(() =>
      useAsyncStats({ values, specs: { usl: 50, lsl: 0 }, workerApi: null })
    );

    await waitFor(() => {
      expect(result.current.stats).not.toBeNull();
      expect(result.current.stats?.mean).toBeCloseTo(20, 0);
    });
  });
});
