import type { Finding, WindowContext } from './types';

export interface DriftResult {
  drifted: boolean;
  relativeChange: number;
  metric: 'cpk' | 'mean' | 'sigma';
  threshold: number;
}

const DEFAULT_DRIFT_THRESHOLD = 0.2;

/**
 * Compare a Finding's stats-at-creation against current-window stats.
 *
 * Uses Cpk relative change as the primary drift signal; falls back to mean
 * if Cpk is missing, then sigma.
 *
 * Returns null if the finding has no windowContext (i.e. created before V1).
 *
 * Per spec §3.5 (metric layer integration) + ADR-049 alignment.
 *
 * Formula:
 *   relativeChange = (currentVal − beforeVal) / beforeVal
 *   drifted = |relativeChange| ≥ threshold (default 0.20)
 */
export function computeFindingWindowDrift(
  finding: Finding,
  currentStats: WindowContext['statsAtCreation']
): DriftResult | null {
  const ctx = finding.windowContext;
  if (!ctx) return null;

  const threshold = ctx.driftThreshold ?? DEFAULT_DRIFT_THRESHOLD;
  const before = ctx.statsAtCreation;

  // Prefer cpk; fall back to mean, then sigma.
  const metric: 'cpk' | 'mean' | 'sigma' =
    before.cpk != null && currentStats.cpk != null
      ? 'cpk'
      : before.mean != null && currentStats.mean != null
        ? 'mean'
        : 'sigma';

  const beforeVal = before[metric];
  const currentVal = currentStats[metric];

  if (beforeVal == null || currentVal == null || beforeVal === 0) {
    return { drifted: false, relativeChange: 0, metric, threshold };
  }

  const relativeChange = (currentVal - beforeVal) / beforeVal;
  const drifted = Math.abs(relativeChange) >= threshold;

  return { drifted, relativeChange, metric, threshold };
}
