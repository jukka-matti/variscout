import { calculateStats } from '../stats/basic';
import { calculateKDE } from '../stats/kde';
import type { StatsComputeRequest, StatsComputeResult } from './types';

/**
 * Compute stats and optionally KDE.
 * This function runs inside the Web Worker — heavy computation offloaded from main thread.
 *
 * Note: ANOVA remains on the main thread because it requires DataRow[] with column names,
 * which would require serializing the full dataset. Stats + KDE use simple number[] arrays.
 */
export function computeStats(request: StatsComputeRequest): StatsComputeResult {
  const { values, specs, computeKDE: doKDE } = request;

  // Basic stats (mean, stdDev, Cp, Cpk, control limits)
  const stats = calculateStats(values, specs.usl, specs.lsl);

  // KDE (kernel density estimation for violin plots) — O(n * numPoints)
  let kde: StatsComputeResult['kde'] = null;
  if (doKDE && values.length > 0) {
    kde = calculateKDE(values);
  }

  return { stats, kde };
}
