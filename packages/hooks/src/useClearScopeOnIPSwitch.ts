import { useEffect, useRef } from 'react';

/**
 * Clears transient analysis-scope state (drill filters) when the user switches
 * the active Improvement Project.
 *
 * Fires clearFn ONLY on a genuine A→B switch — both prev and next are non-null
 * and different. Suppresses:
 *   - First render (no previous id tracked yet)
 *   - null → id  (activation / single-IP auto-activation)
 *   - id  → null (deactivation)
 *
 * Pure consumer: caller supplies clearFn — hook is store-agnostic and trivially
 * testable. In Azure's Editor, clearFn is `useAnalysisScopeStore(s => s.clearScope)`
 * (stable Zustand action reference).
 */
export function useClearScopeOnIPSwitch(activeIPId: string | null, clearFn: () => void): void {
  const prevIdRef = useRef<string | null>(null);

  useEffect(() => {
    const prev = prevIdRef.current;
    if (prev !== null && activeIPId !== null && prev !== activeIPId) {
      clearFn();
    }
    prevIdRef.current = activeIPId;
  }, [activeIPId, clearFn]);
}
