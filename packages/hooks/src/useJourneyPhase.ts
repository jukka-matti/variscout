import { useMemo } from 'react';
import type { Finding, JourneyPhase } from '@variscout/core';

/**
 * Detect the high-level analysis journey phase from current state.
 * Simple, deterministic, no AI.
 *
 * - frame: no data loaded yet
 * - scout: data loaded, exploring patterns (no findings yet)
 * - investigate: findings exist, drilling into causes
 * - improve: at least one finding has corrective actions
 */
export function useJourneyPhase(hasData: boolean, findings: Finding[]): JourneyPhase {
  return useMemo(() => {
    if (!hasData) return 'frame';
    const hasActions = findings.some(f => f.actions && f.actions.length > 0);
    if (hasActions) return 'improve';
    if (findings.length > 0) return 'investigate';
    return 'scout';
  }, [hasData, findings]);
}
