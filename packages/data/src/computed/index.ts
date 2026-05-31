/**
 * Static computed chart data lookup for sample datasets.
 */

import { COMPUTED_CHART_DATA_BY_KEY } from './generated';
import type { ComputedChartData } from '../types';

/**
 * Get static chart data for a sample.
 */
export function getComputedData(urlKey: string): ComputedChartData | undefined {
  return COMPUTED_CHART_DATA_BY_KEY[urlKey];
}

/**
 * Static data cache.
 */
const computedCache = new Map<string, ComputedChartData>();

/**
 * Get static chart data with stable object identity across repeated lookups.
 */
export function getCachedComputedData(urlKey: string): ComputedChartData | undefined {
  if (!computedCache.has(urlKey)) {
    const computed = getComputedData(urlKey);
    if (computed) {
      computedCache.set(urlKey, computed);
    }
  }
  return computedCache.get(urlKey);
}
