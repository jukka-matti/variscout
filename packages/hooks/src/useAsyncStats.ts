import { useState, useEffect, useRef } from 'react';
import * as Comlink from 'comlink';
import type { StatsResult, SpecLimits, StatsWorkerAPI, StatsComputeResult } from '@variscout/core';

export interface UseAsyncStatsOptions {
  /** Numeric values from outcome column */
  values: number[];
  /** Spec limits */
  specs: SpecLimits;
  /** Comlink-wrapped Worker API (null = sync fallback) */
  workerApi: StatsWorkerAPI | null;
  /** Whether to compute KDE (for violin plots) */
  computeKDE?: boolean;
}

export interface UseAsyncStatsResult {
  stats: StatsResult | null;
  kde: { value: number; count: number }[] | null;
  isComputing: boolean;
}

/**
 * Async stats computation via Web Worker with generation counter.
 * Replaces synchronous useMemo stats in useDataComputation.
 *
 * - Generation counter discards stale results from rapid filter clicks
 * - Falls back to synchronous computation if workerApi is null
 * - Uses JSON-serialized keys to avoid spurious re-fires from unstable array refs
 */
export function useAsyncStats(options: UseAsyncStatsOptions): UseAsyncStatsResult {
  const { values, specs, workerApi, computeKDE } = options;

  const [stats, setStats] = useState<StatsResult | null>(null);
  const [kde, setKde] = useState<{ value: number; count: number }[] | null>(null);
  const [isComputing, setIsComputing] = useState(false);
  const generationRef = useRef(0);

  // Stable keys to avoid re-firing on every render when callers pass inline arrays/objects.
  // In production, callers should memoize; this is a safety net.
  // Use cheap fingerprint instead of join(',') which creates multi-MB strings at 250K rows.
  const valuesKey = `${values.length}:${values[0]}:${values[values.length - 1]}`;
  const specsKey = JSON.stringify(specs);

  useEffect(() => {
    if (values.length === 0) {
      setStats(null);
      setKde(null);
      setIsComputing(false);
      return;
    }

    const thisGeneration = ++generationRef.current;
    setIsComputing(true);

    const request = { values, specs, computeKDE };

    if (!workerApi) {
      // Fallback: sync computation (for tests or Worker unavailable)
      import('@variscout/core').then(({ computeStats }) => {
        if (thisGeneration !== generationRef.current) return;
        const result = computeStats(request);
        setStats(result.stats);
        setKde(result.kde ?? null);
        setIsComputing(false);
      });
      return;
    }

    // Transfer values as Float64Array for zero-copy to Worker thread.
    // After transfer the source buffer is neutered, but values is a
    // memoized derived array — a fresh one is created on next filter change.
    const float64 = new Float64Array(values);
    const transferRequest = {
      values: Comlink.transfer(float64, [float64.buffer]),
      specs,
      computeKDE,
    };

    // Comlink wraps the worker method to return a Promise at runtime,
    // even though the StatsWorkerAPI type declares a sync return.
    Promise.resolve(workerApi.computeStats(transferRequest))
      .then((result: StatsComputeResult) => {
        if (thisGeneration !== generationRef.current) return; // Stale
        setStats(result.stats);
        setKde(result.kde ?? null);
        setIsComputing(false);
      })
      .catch(() => {
        if (thisGeneration !== generationRef.current) return;
        setIsComputing(false);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [valuesKey, specsKey, workerApi, computeKDE]);

  return { stats, kde, isComputing };
}
