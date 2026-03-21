import * as Comlink from 'comlink';
import { computeStats, computeAnova } from '@variscout/core';
import type { StatsWorkerAPI } from '@variscout/core';

const api: StatsWorkerAPI = {
  computeStats,
  computeAnova,
};

Comlink.expose(api);
