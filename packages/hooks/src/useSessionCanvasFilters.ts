import { useCallback, useState } from 'react';
import type { ScopeFilter, TimelineWindow } from '@variscout/core';
import type { UseCanvasFiltersResult } from './useCanvasFilters';
import type { CanvasLensId } from './useCanvasStepCards';
import type { CanvasOverlayId } from './useCanvasInvestigationOverlays';
import type { CanvasToolId } from './useHypothesisDrawTool';

const DEFAULT_CUMULATIVE: TimelineWindow = { kind: 'cumulative' };

export type UseSessionCanvasFiltersResult = UseCanvasFiltersResult & {
  activeCanvasLens: CanvasLensId;
  setActiveCanvasLens: (next: CanvasLensId) => void;
  activeCanvasOverlays: CanvasOverlayId[];
  setActiveCanvasOverlays: (next: CanvasOverlayId[]) => void;
  toggleCanvasOverlay: (overlay: CanvasOverlayId) => void;
  activeCanvasTool: CanvasToolId;
  setActiveCanvasTool: (next: CanvasToolId) => void;
};

export function useSessionCanvasFilters(): UseSessionCanvasFiltersResult {
  const [timelineWindow, setTimelineWindow] = useState<TimelineWindow>(DEFAULT_CUMULATIVE);
  const [scopeFilter, setScopeFilter] = useState<ScopeFilter | undefined>(undefined);
  const [paretoGroupBy, setParetoGroupBy] = useState<string | undefined>(undefined);
  const [activeCanvasLens, setActiveCanvasLens] = useState<CanvasLensId>('default');
  const [activeCanvasOverlays, setActiveCanvasOverlays] = useState<CanvasOverlayId[]>([]);
  const [activeCanvasTool, setActiveCanvasToolState] = useState<CanvasToolId>('select');

  const toggleCanvasOverlay = useCallback((overlay: CanvasOverlayId): void => {
    setActiveCanvasOverlays(current =>
      current.includes(overlay) ? current.filter(id => id !== overlay) : [...current, overlay]
    );
  }, []);

  const setActiveCanvasTool = useCallback((next: CanvasToolId): void => {
    setActiveCanvasToolState(next);
    if (next === 'draw-hypothesis') {
      setActiveCanvasOverlays(current =>
        current.includes('hypotheses') ? current : [...current, 'hypotheses']
      );
    }
  }, []);

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
    activeCanvasTool,
    setActiveCanvasTool,
  };
}
