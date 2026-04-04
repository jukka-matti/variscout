/**
 * useYDomain — Derived hook: Y-axis domain computation.
 *
 * Computes full-data Y domain (for axis lock feature) and the effective
 * Y domain to pass to charts based on displayOptions.lockYAxisToFullData.
 */

import { useMemo } from 'react';
import { safeMin, safeMax } from '@variscout/core';
import { useProjectStore } from '@variscout/stores';

export interface YDomainResult {
  fullDataYDomain: { min: number; max: number } | null;
  yDomainForCharts: { min: number; max: number } | undefined;
}

export function useYDomain(): YDomainResult {
  const rawData = useProjectStore(s => s.rawData);
  const outcome = useProjectStore(s => s.outcome);
  const specs = useProjectStore(s => s.specs);
  const displayOptions = useProjectStore(s => s.displayOptions);

  const fullDataYDomain = useMemo(() => {
    if (!outcome || rawData.length === 0) return null;
    const values = rawData
      .map(d => {
        const v = d[outcome];
        return typeof v === 'number' ? v : Number(v);
      })
      .filter(v => !isNaN(v));
    if (values.length === 0) return null;

    let minVal = safeMin(values);
    let maxVal = safeMax(values);

    // Include spec limits in domain
    if (specs.usl !== undefined) maxVal = Math.max(maxVal, specs.usl);
    if (specs.lsl !== undefined) minVal = Math.min(minVal, specs.lsl);

    // Add 10% padding
    const padding = (maxVal - minVal) * 0.1 || 1;
    return { min: minVal - padding, max: maxVal + padding };
  }, [rawData, outcome, specs]);

  const yDomainForCharts = useMemo(() => {
    if (displayOptions.lockYAxisToFullData && fullDataYDomain) {
      return fullDataYDomain;
    }
    return undefined;
  }, [displayOptions.lockYAxisToFullData, fullDataYDomain]);

  return { fullDataYDomain, yDomainForCharts };
}
