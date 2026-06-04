import { useCallback, useState } from 'react';
import type { ScopeFilter, TimelineWindow } from '@variscout/core';
import type { CanvasLensId } from './useCanvasStepCards';
import type { CanvasOverlayId } from './useCanvasAnalyzeOverlays';
import type { CanvasToolId } from './useHypothesisDrawTool';

/** Inlined from the retired useCanvasFilters (PO-1) — the session hook's base shape. */
export interface UseCanvasFiltersResult {
  /** Current timeline window. Defaults to { kind: 'cumulative' } when unset. */
  timelineWindow: TimelineWindow;
  /** Setter for the timeline window. */
  setTimelineWindow: (window: TimelineWindow) => void;
  /** Current scope filter, or undefined when not set. */
  scopeFilter: ScopeFilter | undefined;
  /** Setter for the scope filter; pass undefined to clear. */
  setScopeFilter: (filter: ScopeFilter | undefined) => void;
  /** Current Pareto group-by column name, or undefined when caller should use default. */
  paretoGroupBy: string | undefined;
  /** Setter for the group-by column; pass undefined to clear. */
  setParetoGroupBy: (factor: string | undefined) => void;
}

const DEFAULT_CUMULATIVE: TimelineWindow = { kind: 'cumulative' };
const HYPOTHESES_OVERLAY: CanvasOverlayId = 'hypotheses';

type SessionCanvasFiltersState = {
  timelineWindow: TimelineWindow;
  scopeFilter: ScopeFilter | undefined;
  paretoGroupBy: string | undefined;
  activeCanvasLens: CanvasLensId;
  activeCanvasOverlays: CanvasOverlayId[];
  activeCanvasTool: CanvasToolId;
};

function createDefaultSessionCanvasFiltersState(): SessionCanvasFiltersState {
  return {
    timelineWindow: DEFAULT_CUMULATIVE,
    scopeFilter: undefined,
    paretoGroupBy: undefined,
    activeCanvasLens: 'default',
    activeCanvasOverlays: [],
    activeCanvasTool: 'select',
  };
}

let sessionCanvasFiltersState = createDefaultSessionCanvasFiltersState();

export function __resetSessionCanvasFiltersForTests(): void {
  sessionCanvasFiltersState = createDefaultSessionCanvasFiltersState();
}

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
  const [timelineWindow, setTimelineWindowState] = useState<TimelineWindow>(
    sessionCanvasFiltersState.timelineWindow
  );
  const [scopeFilter, setScopeFilterState] = useState<ScopeFilter | undefined>(
    sessionCanvasFiltersState.scopeFilter
  );
  const [paretoGroupBy, setParetoGroupByState] = useState<string | undefined>(
    sessionCanvasFiltersState.paretoGroupBy
  );
  const [activeCanvasLens, setActiveCanvasLensState] = useState<CanvasLensId>(
    sessionCanvasFiltersState.activeCanvasLens
  );
  const [activeCanvasOverlays, setActiveCanvasOverlaysState] = useState<CanvasOverlayId[]>(
    sessionCanvasFiltersState.activeCanvasOverlays
  );
  const [activeCanvasTool, setActiveCanvasToolState] = useState<CanvasToolId>(
    sessionCanvasFiltersState.activeCanvasTool
  );

  const setTimelineWindow = useCallback((next: TimelineWindow): void => {
    sessionCanvasFiltersState = { ...sessionCanvasFiltersState, timelineWindow: next };
    setTimelineWindowState(next);
  }, []);

  const setScopeFilter = useCallback((next: ScopeFilter | undefined): void => {
    sessionCanvasFiltersState = { ...sessionCanvasFiltersState, scopeFilter: next };
    setScopeFilterState(next);
  }, []);

  const setParetoGroupBy = useCallback((next: string | undefined): void => {
    sessionCanvasFiltersState = { ...sessionCanvasFiltersState, paretoGroupBy: next };
    setParetoGroupByState(next);
  }, []);

  const setActiveCanvasLens = useCallback((next: CanvasLensId): void => {
    sessionCanvasFiltersState = { ...sessionCanvasFiltersState, activeCanvasLens: next };
    setActiveCanvasLensState(next);
  }, []);

  const setActiveCanvasOverlays = useCallback((next: CanvasOverlayId[]): void => {
    sessionCanvasFiltersState = { ...sessionCanvasFiltersState, activeCanvasOverlays: next };
    setActiveCanvasOverlaysState(next);
  }, []);

  const toggleCanvasOverlay = useCallback((overlay: CanvasOverlayId): void => {
    setActiveCanvasOverlaysState(current => {
      const next = current.includes(overlay)
        ? current.filter(id => id !== overlay)
        : [...current, overlay];
      sessionCanvasFiltersState = { ...sessionCanvasFiltersState, activeCanvasOverlays: next };
      return next;
    });
  }, []);

  const setActiveCanvasTool = useCallback((next: CanvasToolId): void => {
    sessionCanvasFiltersState = { ...sessionCanvasFiltersState, activeCanvasTool: next };
    setActiveCanvasToolState(next);
    if (next === 'draw-hypothesis') {
      setActiveCanvasOverlaysState(current => {
        const nextOverlays = current.includes(HYPOTHESES_OVERLAY)
          ? current
          : [...current, HYPOTHESES_OVERLAY];
        sessionCanvasFiltersState = {
          ...sessionCanvasFiltersState,
          activeCanvasOverlays: nextOverlays,
        };
        return nextOverlays;
      });
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
