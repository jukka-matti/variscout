import { calculateStats } from '../stats/basic';
import { calculateKDE } from '../stats/kde';
import { calculateAnovaFromArrays } from '../stats/anova';
import type { AnovaResult } from '../types';
import type { StatsComputeRequest, StatsComputeResult, AnovaComputeRequest } from './types';

/**
 * Compute stats and optionally KDE.
 * This function runs inside the Web Worker — heavy computation offloaded from main thread.
 */
export function computeStats(request: StatsComputeRequest): StatsComputeResult {
  const { specs, computeKDE: doKDE } = request;
  // Convert Float64Array to regular array (d3 and KDE expect number[])
  const values =
    request.values instanceof Float64Array ? Array.from(request.values) : request.values;

  // Basic stats (mean, stdDev, Cp, Cpk, control limits)
  const stats = calculateStats(values, specs.usl, specs.lsl);

  // KDE (kernel density estimation for violin plots) — O(n * numPoints)
  let kde: StatsComputeResult['kde'] = null;
  if (doKDE && values.length > 0) {
    kde = calculateKDE(values);
  }

  return { stats, kde };
}

/**
 * Compute one-way ANOVA from pre-extracted column arrays.
 * Runs inside the Web Worker — avoids serializing full DataRow[] objects.
 */
export function computeAnova(request: AnovaComputeRequest): AnovaResult | null {
  // Convert Float64Array to regular array if needed
  const outcomeValues =
    request.outcomeValues instanceof Float64Array
      ? Array.from(request.outcomeValues)
      : request.outcomeValues;
  return calculateAnovaFromArrays(request.factorValues, outcomeValues, request.outcomeName);
}
