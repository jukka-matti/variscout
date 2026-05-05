import { useState } from 'react';
import type { ScopeFilter, TimelineWindow } from '@variscout/core';
import type { UseCanvasFiltersResult } from './useCanvasFilters';
import type { CanvasLensId } from './useCanvasStepCards';
import type { CanvasOverlayId } from './useCanvasInvestigationOverlays';

const DEFAULT_CUMULATIVE: TimelineWindow = { kind: 'cumulative' };

export type UseSessionCanvasFiltersResult = UseCanvasFiltersResult & {
  activeCanvasLens: CanvasLensId;
  setActiveCanvasLens: (next: CanvasLensId) => void;
  activeCanvasOverlays: CanvasOverlayId[];
  setActiveCanvasOverlays: (next: CanvasOverlayId[]) => void;
  toggleCanvasOverlay: (overlay: CanvasOverlayId) => void;
};

export function useSessionCanvasFilters(): UseSessionCanvasFiltersResult {
  const [timelineWindow, setTimelineWindow] = useState<TimelineWindow>(DEFAULT_CUMULATIVE);
  const [scopeFilter, setScopeFilter] = useState<ScopeFilter | undefined>(undefined);
  const [paretoGroupBy, setParetoGroupBy] = useState<string | undefined>(undefined);
  const [activeCanvasLens, setActiveCanvasLens] = useState<CanvasLensId>('default');
  const [activeCanvasOverlays, setActiveCanvasOverlays] = useState<CanvasOverlayId[]>([]);

  const toggleCanvasOverlay = (overlay: CanvasOverlayId): void => {
    setActiveCanvasOverlays(current =>
      current.includes(overlay) ? current.filter(id => id !== overlay) : [...current, overlay]
    );
  };

  return {
    timelineWindow,
    setTimelineWindow,
    scopeFilter,
    setScopeFilter,
    paretoGroupBy,
    setParetoGroupBy,
    activeCanvasLens,
    setActiveCanvasLens,
    activeCanvasOverlays,
    setActiveCanvasOverlays,
    toggleCanvasOverlay,
  };
}
