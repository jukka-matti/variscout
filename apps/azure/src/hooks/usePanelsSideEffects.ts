import { useEffect, useRef } from 'react';
import { usePanelsStore } from '../stores/panelsStore';
import type { ViewState } from '@variscout/hooks';

/**
 * Bridge hook for Zustand panelsStore side effects that require React lifecycle.
 *
 * 1. ViewState persistence — reports findings/whatIf/improvement changes to the
 *    project persistence layer (skips the initial render to avoid echoing back
 *    the values that were just loaded).
 * 2. Highlight timeout — clears highlightedChartPoint after 2 seconds.
 */
export function usePanelsSideEffects(
  onViewStateChange?: (partial: Partial<ViewState>) => void
): void {
  const isFindingsOpen = usePanelsStore(s => s.isFindingsOpen);
  const isWhatIfOpen = usePanelsStore(s => s.isWhatIfOpen);
  const isImprovementOpen = usePanelsStore(s => s.isImprovementOpen);
  const highlightedChartPoint = usePanelsStore(s => s.highlightedChartPoint);

  // Persistence — skip initial render
  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    onViewStateChange?.({ isFindingsOpen, isWhatIfOpen, isImprovementOpen });
  }, [isFindingsOpen, isWhatIfOpen, isImprovementOpen, onViewStateChange]);

  // Highlight timeout
  useEffect(() => {
    if (highlightedChartPoint === null) return;
    const timer = setTimeout(() => usePanelsStore.getState().setHighlightPoint(null), 2000);
    return () => clearTimeout(timer);
  }, [highlightedChartPoint]);
}
