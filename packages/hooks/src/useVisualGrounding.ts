import { useCallback, useRef } from 'react';

export const GLOW_DURATION_MS = 3000;
export const SETTLED_DURATION_MS = 10000;

export type HighlightPhase = 'glow' | 'settled';

export interface HighlightAction {
  action: 'highlightCategories' | 'highlightStat' | 'focusChart' | 'expandPanel';
  categories?: string[];
  statKey?: string;
  chartFocus?: string;
  panelId?: string;
}

export function resolveHighlightTarget(
  targetType: string,
  targetId?: string
): HighlightAction | null {
  switch (targetType) {
    case 'boxplot':
    case 'pareto':
      return targetId
        ? { action: 'highlightCategories', categories: [targetId], chartFocus: targetType }
        : { action: 'focusChart', chartFocus: targetType };
    case 'ichart':
      return { action: 'focusChart', chartFocus: 'ichart' };
    case 'stats':
      return targetId
        ? { action: 'highlightStat', statKey: targetId }
        : { action: 'expandPanel', panelId: 'stats' };
    case 'yamazumi':
      return targetId
        ? { action: 'highlightCategories', categories: [targetId], chartFocus: 'yamazumi' }
        : { action: 'focusChart', chartFocus: 'yamazumi' };
    case 'finding':
    case 'question':
      return targetId
        ? { action: 'expandPanel', panelId: targetType, categories: [targetId] }
        : null;
    case 'dashboard':
      return { action: 'focusChart', chartFocus: 'dashboard' };
    case 'improvement':
      return { action: 'expandPanel', panelId: 'improvement' };
    default:
      return null;
  }
}

interface UseVisualGroundingOptions {
  onHighlightCategories?: (categories: string[], phase: HighlightPhase) => void;
  onHighlightStat?: (statKey: string, phase: HighlightPhase) => void;
  onFocusChart?: (chartType: string) => void;
  onExpandPanel?: (panelId: string, targetId?: string) => void;
  onClearHighlights?: () => void;
}

export function useVisualGrounding({
  onHighlightCategories,
  onHighlightStat,
  onFocusChart,
  onExpandPanel,
  onClearHighlights,
}: UseVisualGroundingOptions) {
  const glowTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const settledTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimers = useCallback(() => {
    if (glowTimerRef.current) clearTimeout(glowTimerRef.current);
    if (settledTimerRef.current) clearTimeout(settledTimerRef.current);
    glowTimerRef.current = null;
    settledTimerRef.current = null;
  }, []);

  const highlight = useCallback(
    (targetType: string, targetId?: string) => {
      const action = resolveHighlightTarget(targetType, targetId);
      if (!action) return;

      clearTimers();

      // Phase 1: Glow
      if (action.action === 'highlightCategories' && action.categories) {
        onHighlightCategories?.(action.categories, 'glow');
        if (action.chartFocus) onFocusChart?.(action.chartFocus);
      } else if (action.action === 'highlightStat' && action.statKey) {
        onHighlightStat?.(action.statKey, 'glow');
      } else if (action.action === 'focusChart' && action.chartFocus) {
        onFocusChart?.(action.chartFocus);
      } else if (action.action === 'expandPanel' && action.panelId) {
        onExpandPanel?.(action.panelId, action.categories?.[0]);
      }

      // Phase 2: Transition to settled after GLOW_DURATION
      glowTimerRef.current = setTimeout(() => {
        if (action.action === 'highlightCategories' && action.categories) {
          onHighlightCategories?.(action.categories, 'settled');
        } else if (action.action === 'highlightStat' && action.statKey) {
          onHighlightStat?.(action.statKey, 'settled');
        }

        // Phase 3: Clear after SETTLED_DURATION
        settledTimerRef.current = setTimeout(() => {
          onClearHighlights?.();
        }, SETTLED_DURATION_MS);
      }, GLOW_DURATION_MS);
    },
    [
      clearTimers,
      onHighlightCategories,
      onHighlightStat,
      onFocusChart,
      onExpandPanel,
      onClearHighlights,
    ]
  );

  const clearAll = useCallback(() => {
    clearTimers();
    onClearHighlights?.();
  }, [clearTimers, onClearHighlights]);

  return { highlight, clearAll };
}
