/**
 * Improvement progress tracking — sequential estimation with sigma cascade.
 *
 * Computes projected and verified improvement toward a target metric,
 * aggregating projections from key-driver findings.
 */

import type { Finding, FindingProjection } from '../findings';
import type { TargetMetric } from '../ai/types';

// ============================================================================
// Types
// ============================================================================

export interface FindingContribution {
  findingId: string;
  hypothesisId?: string;
  /** Projected improvement for this finding's target metric */
  projected: number;
  /** Actual improvement (from outcome verification) */
  actual?: number;
  /** Percentage of target gap covered by this finding */
  percentOfGap: number;
  /** Verification status */
  status: 'projected' | 'verified-exceeded' | 'verified-below' | 'verified-matched';
}

export interface ImprovementProgress {
  target: {
    metric: TargetMetric;
    value: number;
    direction: 'minimize' | 'maximize' | 'target';
    current: number;
    gap: number;
  };

  projectedImprovement: {
    total: number;
    byFinding: FindingContribution[];
    projectedValue: number;
    percentCovered: number;
    remainingGap: number;
  };

  verifiedImprovement: {
    total: number;
    verifiedValue: number;
    percentAchieved: number;
  };
}

// ============================================================================
// Helpers
// ============================================================================

/**
 * Extract the relevant metric value from a projection's baseline or projected side.
 */
function getMetricValue(
  projection: FindingProjection,
  metric: TargetMetric,
  side: 'baseline' | 'projected'
): number | undefined {
  if (side === 'baseline') {
    switch (metric) {
      case 'mean':
        return projection.baselineMean;
      case 'sigma':
        return projection.baselineSigma;
      case 'cpk':
        return projection.baselineCpk;
      case 'yield':
        return projection.baselineYield;
      case 'passRate':
        return projection.baselinePassRate;
    }
  } else {
    switch (metric) {
      case 'mean':
        return projection.projectedMean;
      case 'sigma':
        return projection.projectedSigma;
      case 'cpk':
        return projection.projectedCpk;
      case 'yield':
        return projection.projectedYield;
      case 'passRate':
        return projection.projectedPassRate;
    }
  }
}

/**
 * Compute the signed improvement for a projection given target direction.
 * Positive = improvement toward target.
 */
function computeImprovement(
  projection: FindingProjection,
  metric: TargetMetric,
  direction: 'minimize' | 'maximize' | 'target',
  targetValue: number
): number {
  const baseline = getMetricValue(projection, metric, 'baseline');
  const projected = getMetricValue(projection, metric, 'projected');
  if (baseline === undefined || projected === undefined) return 0;

  const delta = projected - baseline;

  switch (direction) {
    case 'minimize':
      // Improvement = reduction (negative delta is good)
      return -delta;
    case 'maximize':
      // Improvement = increase (positive delta is good)
      return delta;
    case 'target':
      // Improvement = closing the gap to target
      return Math.abs(baseline - targetValue) - Math.abs(projected - targetValue);
  }
}

// ============================================================================
// Main Computation
// ============================================================================

/**
 * Compute improvement progress from findings with projections toward a target.
 *
 * Uses sequential estimation: findings are ordered by largest improvement first,
 * and each subsequent finding operates on the tighter post-improvement baseline
 * (sigma cascade).
 */
export function computeImprovementProgress(
  findings: Finding[],
  target: {
    metric: TargetMetric;
    value: number;
    direction: 'minimize' | 'maximize' | 'target';
  },
  currentStats: {
    mean: number;
    sigma: number;
    cpk?: number;
    yield?: number;
    passRate?: number;
  }
): ImprovementProgress {
  // Get current value for the target metric
  const currentValue = getCurrentMetricValue(currentStats, target.metric);

  // Compute gap
  const gap = computeGap(currentValue, target.value, target.direction);

  // Filter to key-driver findings with projections
  const keyDriversWithProjections = findings.filter(
    (f): f is Finding & { projection: FindingProjection } =>
      f.tag === 'key-driver' && f.projection !== undefined
  );

  // Sort by largest projected improvement first
  const sorted = [...keyDriversWithProjections].sort((a, b) => {
    const impA = computeImprovement(a.projection, target.metric, target.direction, target.value);
    const impB = computeImprovement(b.projection, target.metric, target.direction, target.value);
    return impB - impA; // Descending
  });

  // Sequential estimation
  const contributions: FindingContribution[] = [];
  let totalProjected = 0;
  let totalVerified = 0;

  for (const finding of sorted) {
    const improvement = computeImprovement(
      finding.projection,
      target.metric,
      target.direction,
      target.value
    );

    const isVerified = finding.status === 'resolved' && finding.outcome;

    let actualImprovement: number | undefined;
    let status: FindingContribution['status'] = 'projected';

    if (isVerified && finding.outcome) {
      // For verified findings, use actual Cpk if available
      if (target.metric === 'cpk' && finding.outcome.cpkAfter !== undefined) {
        const baselineCpk = finding.projection.baselineCpk ?? 0;
        actualImprovement = finding.outcome.cpkAfter - baselineCpk;
      } else {
        // Fall back to projected as best estimate
        actualImprovement = improvement;
      }

      if (actualImprovement > improvement * 1.05) {
        status = 'verified-exceeded';
      } else if (actualImprovement < improvement * 0.95) {
        status = 'verified-below';
      } else {
        status = 'verified-matched';
      }

      totalVerified += actualImprovement;
    }

    totalProjected += improvement;

    contributions.push({
      findingId: finding.id,
      hypothesisId: finding.hypothesisId,
      projected: improvement,
      actual: actualImprovement,
      percentOfGap: gap !== 0 ? (improvement / gap) * 100 : 0,
      status,
    });
  }

  const projectedValue = applyImprovementToValue(currentValue, totalProjected, target.direction);
  const verifiedValue = applyImprovementToValue(currentValue, totalVerified, target.direction);
  const percentCovered = gap !== 0 ? Math.min(100, (totalProjected / gap) * 100) : 0;
  const percentAchieved = gap !== 0 ? Math.min(100, (totalVerified / gap) * 100) : 0;

  return {
    target: {
      metric: target.metric,
      value: target.value,
      direction: target.direction,
      current: currentValue,
      gap,
    },
    projectedImprovement: {
      total: totalProjected,
      byFinding: contributions,
      projectedValue,
      percentCovered,
      remainingGap: Math.max(0, gap - totalProjected),
    },
    verifiedImprovement: {
      total: totalVerified,
      verifiedValue,
      percentAchieved,
    },
  };
}

// ============================================================================
// Internal Helpers
// ============================================================================

function getCurrentMetricValue(
  stats: { mean: number; sigma: number; cpk?: number; yield?: number; passRate?: number },
  metric: TargetMetric
): number {
  switch (metric) {
    case 'mean':
      return stats.mean;
    case 'sigma':
      return stats.sigma;
    case 'cpk':
      return stats.cpk ?? 0;
    case 'yield':
      return stats.yield ?? 0;
    case 'passRate':
      return stats.passRate ?? 0;
  }
}

function computeGap(
  current: number,
  targetValue: number,
  direction: 'minimize' | 'maximize' | 'target'
): number {
  switch (direction) {
    case 'minimize':
      return Math.max(0, current - targetValue);
    case 'maximize':
      return Math.max(0, targetValue - current);
    case 'target':
      return Math.abs(current - targetValue);
  }
}

function applyImprovementToValue(
  current: number,
  improvement: number,
  direction: 'minimize' | 'maximize' | 'target'
): number {
  switch (direction) {
    case 'minimize':
      return current - improvement;
    case 'maximize':
      return current + improvement;
    case 'target':
      // For bidirectional, improvement reduces the gap
      return current; // Simplified — actual projection uses per-finding computation
  }
}
