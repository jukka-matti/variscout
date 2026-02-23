/**
 * I-Chart Y-domain calculation utility
 */

import type { StatsResult, SpecLimits } from '@variscout/core';
import type { StageBoundary } from '../types';

interface AxisSettings {
  min?: number;
  max?: number;
}

/**
 * Compute the Y-axis domain for the I-Chart.
 *
 * Priority order:
 * 1. yDomainOverride (for Y-axis lock feature)
 * 2. Manual axis settings
 * 3. Auto-calculate from data, control limits, and spec limits
 */
export function computeIChartYDomain(
  data: { y: number }[],
  stats: StatsResult | null | undefined,
  specs: SpecLimits,
  isStaged: boolean,
  stageBoundaries: StageBoundary[],
  axisSettings?: AxisSettings,
  yDomainOverride?: { min: number; max: number }
): [number, number] {
  // Priority 1: yDomainOverride (for Y-axis lock feature)
  if (yDomainOverride) {
    return [yDomainOverride.min, yDomainOverride.max];
  }

  // Priority 2: Manual axis settings
  if (axisSettings?.min !== undefined && axisSettings?.max !== undefined) {
    return [axisSettings.min, axisSettings.max];
  }

  // Priority 3: Auto-calculate from data
  const values = data.map(d => d.y);
  let minVal = Math.min(...values);
  let maxVal = Math.max(...values);

  // Include control limits (single stats or all staged stats)
  if (isStaged) {
    // Include all stage control limits
    stageBoundaries.forEach(boundary => {
      minVal = Math.min(minVal, boundary.stats.lcl);
      maxVal = Math.max(maxVal, boundary.stats.ucl);
    });
  } else if (stats) {
    minVal = Math.min(minVal, stats.lcl);
    maxVal = Math.max(maxVal, stats.ucl);
  }

  // Include spec limits
  if (specs.usl !== undefined) maxVal = Math.max(maxVal, specs.usl);
  if (specs.lsl !== undefined) minVal = Math.min(minVal, specs.lsl);

  // Add padding
  const padding = (maxVal - minVal) * 0.1;
  return [minVal - padding, maxVal + padding];
}
