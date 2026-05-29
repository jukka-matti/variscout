import { useAnalysisScopeStore } from '@variscout/stores';

/**
 * Returns true when no analysis scope field is set (yColumn, boxplotFactor,
 * stepId, or categoricalFilters). Used by canvas chips to decide whether to
 * dim out-of-scope items at 50% opacity.
 *
 * Spec §4.5: chips append opacity-50 when !scopeIsEmpty && !isInScope.
 */
export function useScopeIsEmpty(): boolean {
  const yColumn = useAnalysisScopeStore(s => s.yColumn);
  const boxplotFactor = useAnalysisScopeStore(s => s.boxplotFactor);
  const stepId = useAnalysisScopeStore(s => s.stepId);
  const categoricalFilters = useAnalysisScopeStore(s => s.categoricalFilters);
  return !yColumn && !boxplotFactor && !stepId && categoricalFilters.length === 0;
}
