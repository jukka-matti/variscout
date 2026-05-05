import { useState } from 'react';
import type { ScopeFilter, TimelineWindow } from '@variscout/core';
import type { UseCanvasFiltersResult } from './useCanvasFilters';
import type { CanvasLensId } from './useCanvasStepCards';

const DEFAULT_CUMULATIVE: TimelineWindow = { kind: 'cumulative' };

export type UseSessionCanvasFiltersResult = UseCanvasFiltersResult & {
  activeCanvasLens: CanvasLensId;
  setActiveCanvasLens: (next: CanvasLensId) => void;
};

export function useSessionCanvasFilters(): UseSessionCanvasFiltersResult {
  const [timelineWindow, setTimelineWindow] = useState<TimelineWindow>(DEFAULT_CUMULATIVE);
  const [scopeFilter, setScopeFilter] = useState<ScopeFilter | undefined>(undefined);
  const [paretoGroupBy, setParetoGroupBy] = useState<string | undefined>(undefined);
  const [activeCanvasLens, setActiveCanvasLens] = useState<CanvasLensId>('default');

  return {
    timelineWindow,
    setTimelineWindow,
    scopeFilter,
    setScopeFilter,
    paretoGroupBy,
    setParetoGroupBy,
    activeCanvasLens,
    setActiveCanvasLens,
  };
}
