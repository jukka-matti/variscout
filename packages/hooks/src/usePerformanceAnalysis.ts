/**
 * usePerformanceAnalysis — Derived hook: multi-measure channel performance.
 *
 * Active only in 'performance' analysis mode. Calculates per-channel Cpk
 * using calculateChannelPerformance from @variscout/core.
 */

import { useMemo } from 'react';
import { calculateChannelPerformance, type ChannelPerformanceData } from '@variscout/core';
import { useProjectStore } from '@variscout/stores';

export function usePerformanceAnalysis(): ChannelPerformanceData | null {
  const rawData = useProjectStore(s => s.rawData);
  const analysisMode = useProjectStore(s => s.analysisMode);
  const measureColumns = useProjectStore(s => s.measureColumns);
  const specs = useProjectStore(s => s.specs);

  return useMemo(() => {
    if (analysisMode !== 'performance' || measureColumns.length === 0 || rawData.length === 0) {
      return null;
    }
    if (specs.usl === undefined && specs.lsl === undefined) {
      return null;
    }
    return calculateChannelPerformance(rawData, measureColumns, specs);
  }, [analysisMode, rawData, measureColumns, specs]);
}
