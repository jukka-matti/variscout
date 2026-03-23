import { useMemo } from 'react';
import * as Comlink from 'comlink';
import type { StatsWorkerAPI } from '@variscout/core';

let cachedApi: Comlink.Remote<StatsWorkerAPI> | null = null;

/**
 * Returns a singleton Comlink-wrapped Worker API.
 * Created once on first call, reused for all subsequent calls.
 */
export function useStatsWorker(): StatsWorkerAPI {
  // eslint-disable-next-line react-hooks/globals -- intentional singleton: Worker created once, reused across renders
  return useMemo(() => {
    if (!cachedApi) {
      const worker = new Worker(new URL('./stats.worker.ts', import.meta.url), { type: 'module' });
      cachedApi = Comlink.wrap<StatsWorkerAPI>(worker);
    }
    return cachedApi as unknown as StatsWorkerAPI;
  }, []);
}
