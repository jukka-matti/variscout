import * as Comlink from 'comlink';
import { computeStats } from '@variscout/core';
import type { StatsWorkerAPI } from '@variscout/core';

const api: StatsWorkerAPI = {
  computeStats,
};

Comlink.expose(api);
