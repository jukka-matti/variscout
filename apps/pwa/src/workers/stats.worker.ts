import * as Comlink from 'comlink';
import { computeStats, computeAnova, computeBestSubsetsWorker } from '@variscout/core';
import type { StatsWorkerAPI } from '@variscout/core';

const api: StatsWorkerAPI = {
  computeStats,
  computeAnova,
  computeBestSubsetsWorker,
};

Comlink.expose(api);
