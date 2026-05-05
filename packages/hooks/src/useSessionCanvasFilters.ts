import { useState } from 'react';
import type { ScopeFilter, TimelineWindow } from '@variscout/core';
import type { UseCanvasFiltersResult } from './useCanvasFilters';

const DEFAULT_CUMULATIVE: TimelineWindow = { kind: 'cumulative' };

export type UseSessionCanvasFiltersResult = UseCanvasFiltersResult;

export function useSessionCanvasFilters(): UseSessionCanvasFiltersResult {
  const [timelineWindow, setTimelineWindow] = useState<TimelineWindow>(DEFAULT_CUMULATIVE);
  const [scopeFilter, setScopeFilter] = useState<ScopeFilter | undefined>(undefined);
  const [paretoGroupBy, setParetoGroupBy] = useState<string | undefined>(undefined);

  return {
    timelineWindow,
    setTimelineWindow,
    scopeFilter,
    setScopeFilter,
    paretoGroupBy,
    setParetoGroupBy,
  };
}
