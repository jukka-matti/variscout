import { useEffect, useRef } from 'react';
import { usePanelsStore } from './panelsStore';
import type { ViewState } from '@variscout/hooks';

/**
 * Bridge hook: watches Zustand panelsStore and persists visibility state
 * to DataContext (project-level persistence via IndexedDB/OneDrive).
 *
 * This hook exists because persistence lives in React Context (DataContext),
 * while panel state lives in Zustand. The hook bridges the two layers.
 * See ADR-041 for the bridge hook pattern rationale.
 */
export function usePanelsPersistence(
  onViewStateChange?: (partial: Partial<ViewState>) => void
): void {
  const isFindingsOpen = usePanelsStore(s => s.isFindingsOpen);
  const isWhatIfOpen = usePanelsStore(s => s.isWhatIfOpen);
  const activeView = usePanelsStore(s => s.activeView);
  const highlightedChartPoint = usePanelsStore(s => s.highlightedChartPoint);

  // Persistence — skip initial render and redundant writes
  const isFirstRender = useRef(true);
  const prevRef = useRef({ isFindingsOpen, isWhatIfOpen, activeView });
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    const prev = prevRef.current;
    if (
      prev.isFindingsOpen === isFindingsOpen &&
      prev.isWhatIfOpen === isWhatIfOpen &&
      prev.activeView === activeView
    ) {
      return;
    }
    prevRef.current = { isFindingsOpen, isWhatIfOpen, activeView };
    onViewStateChange?.({ isFindingsOpen, isWhatIfOpen, activeView });
  }, [isFindingsOpen, isWhatIfOpen, activeView, onViewStateChange]);

  // Highlight timeout
  useEffect(() => {
    if (highlightedChartPoint === null) return;
    const timer = setTimeout(() => usePanelsStore.getState().setHighlightPoint(null), 2000);
    return () => clearTimeout(timer);
  }, [highlightedChartPoint]);
}
