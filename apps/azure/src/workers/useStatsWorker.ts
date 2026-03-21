import { useMemo } from 'react';
import * as Comlink from 'comlink';
import type { StatsWorkerAPI } from '@variscout/core';

let workerApi: StatsWorkerAPI | null = null;

/**
 * Returns a singleton Comlink-wrapped Worker API.
 * Created once on first call, reused for all subsequent calls.
 */
export function useStatsWorker(): StatsWorkerAPI {
  return useMemo(() => {
    if (!workerApi) {
      const worker = new Worker(new URL('./stats.worker.ts', import.meta.url), { type: 'module' });
      workerApi = Comlink.wrap<StatsWorkerAPI>(worker);
    }
    return workerApi;
  }, []);
}
