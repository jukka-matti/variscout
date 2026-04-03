/**
 * Deterministic chart insight builders.
 * Pure functions that generate per-chart insight text from existing analysis data.
 * These are the fallback path AND data foundation for AI prompts.
 */

import type { NelsonRule2Sequence, NelsonRule3Sequence } from '../types';
import type { StagedComparison } from '../stats/staged';
import { formatStatistic } from '../i18n/format';

export type InsightChartType = 'ichart' | 'boxplot' | 'pareto' | 'capability' | 'stats';
export type ChipType = 'suggestion' | 'warning' | 'info';

/** Action metadata for clickable insight chips */
export interface InsightAction {
  type: 'drill';
  factor: string;
  value?: string;
}

export interface DeterministicInsight {
  /** Display text, max ~100 chars */
  text: string;
  /** Visual chip style */
  chipType: ChipType;
  /** Higher = show this one (only 1 chip per chart) */
  priority: number;
  /** Optional action triggered when user clicks the chip */
  action?: InsightAction;
}

/**
 * Build insight chip for I-Chart based on Nelson Rule 2/3 sequences and OOC points.
 */
export function buildIChartInsight(
  nelsonSequences: NelsonRule2Sequence[],
  outOfControlCount: number,
  totalPoints: number,
  nelsonRule3Sequences?: NelsonRule3Sequence[]
): DeterministicInsight | null {
  // Priority 3: Nelson Rule 2 detected — pick the longest sequence
  if (nelsonSequences.length > 0) {
    const longest = nelsonSequences.reduce((best, seq) => {
      const bestLen = best.endIndex - best.startIndex + 1;
      const seqLen = seq.endIndex - seq.startIndex + 1;
      return seqLen > bestLen ? seq : best;
    });
    const length = longest.endIndex - longest.startIndex + 1;
    return {
      text: `Process shift: ${length} points ${longest.side} mean from obs. ${longest.startIndex + 1}`,
      chipType: 'warning',
      priority: 3,
    };
  }

  // Priority 2.5: Nelson Rule 3 detected — pick the longest trend
  if (nelsonRule3Sequences && nelsonRule3Sequences.length > 0) {
    const longest = nelsonRule3Sequences.reduce((best, seq) => {
      const bestLen = best.endIndex - best.startIndex + 1;
      const seqLen = seq.endIndex - seq.startIndex + 1;
      return seqLen > bestLen ? seq : best;
    });
    const length = longest.endIndex - longest.startIndex + 1;
    return {
      text: `Trend detected: ${length} consecutive ${longest.direction} points from obs. ${longest.startIndex + 1}`,
      chipType: 'warning',
      priority: 2.5,
    };
  }

  // Priority 2: OOC points but no Nelson sequences
  if (outOfControlCount > 0 && totalPoints > 0) {
    const pct = Math.round((outOfControlCount / totalPoints) * 100);
    return {
      text: `${outOfControlCount} of ${totalPoints} points outside control limits (${pct}%)`,
      chipType: 'warning',
      priority: 2,
    };
  }

  // Priority 1: stable — no chip needed
  return null;
}

/**
 * Build insight chip for Boxplot based on factor η² (eta-squared) effect sizes.
 */
export function buildBoxplotInsight(
  factorVariations: Map<string, number>,
  currentFactor: string,
  nextDrillFactor: string | null
): DeterministicInsight | null {
  // Priority 3: next drill factor has meaningful variation
  if (nextDrillFactor !== null) {
    const nextVariation = factorVariations.get(nextDrillFactor);
    if (nextVariation !== undefined && nextVariation >= 30) {
      return {
        text: `→ Drill ${nextDrillFactor} (${Math.round(nextVariation)}% of variation)`,
        chipType: 'suggestion',
        priority: 3,
        action: { type: 'drill', factor: nextDrillFactor },
      };
    }
  }

  // Priority 2: current factor explains majority of variation
  const currentVariation = factorVariations.get(currentFactor);
  if (currentVariation !== undefined && currentVariation >= 50) {
    return {
      text: `${currentFactor} explains ${Math.round(currentVariation)}% of total variation`,
      chipType: 'info',
      priority: 2,
    };
  }

  return null;
}

/**
 * Build insight chip for Pareto chart based on category contributions.
 */
export function buildParetoInsight(
  categoryContributions: Map<string, number>,
  categoryCount: number,
  factor?: string
): DeterministicInsight | null {
  if (categoryCount < 3) {
    return null;
  }

  // Sort contributions descending
  const sorted = [...categoryContributions.entries()].sort((a, b) => b[1] - a[1]);

  // Single dominant category — actionable: drill into it
  if (sorted.length > 0 && sorted[0][1] > 50) {
    const [name, pct] = sorted[0];
    return {
      text: `"${name}" accounts for ${Math.round(pct)}% of variation`,
      chipType: 'info',
      priority: 2,
      action: factor ? { type: 'drill', factor, value: name } : undefined,
    };
  }

  // Top 2 contributions
  if (sorted.length >= 2) {
    const top2Sum = sorted[0][1] + sorted[1][1];

    // Priority 3: very concentrated (>= 80%) with enough categories
    if (categoryCount >= 5 && top2Sum >= 80) {
      return {
        text: `Top 2 of ${categoryCount} categories explain ${Math.round(top2Sum)}% — investigate these first`,
        chipType: 'suggestion',
        priority: 3,
      };
    }

    // Priority 2: moderately concentrated (>= 60%)
    if (top2Sum >= 60) {
      return {
        text: `Top 2 of ${categoryCount} categories explain ${Math.round(top2Sum)}%`,
        chipType: 'info',
        priority: 2,
      };
    }
  }

  return null;
}

/**
 * Build insight chip for Stats panel based on capability indices and pass rate.
 */
export function buildStatsInsight(
  cpk: number | undefined,
  cp: number | undefined,
  cpkTarget: number,
  passRate: number | undefined,
  hasSpecs: boolean
): DeterministicInsight | null {
  if (!hasSpecs) {
    return null;
  }

  // Priority 3: Cpk below target
  if (cpk !== undefined && cpk < cpkTarget) {
    return {
      text: `Cpk ${formatStatistic(cpk, 'en', 2)} — below ${formatStatistic(cpkTarget, 'en', 2)} target`,
      chipType: 'warning',
      priority: 3,
    };
  }

  // Priority 1: Cpk meets target
  if (cpk !== undefined && cpk >= cpkTarget) {
    return {
      text: `Cpk ${formatStatistic(cpk, 'en', 2)} meets ${formatStatistic(cpkTarget, 'en', 2)} target`,
      chipType: 'info',
      priority: 1,
    };
  }

  // Priority 2: pass rate below threshold
  if (passRate !== undefined && passRate < 95) {
    return {
      text: `Pass rate ${Math.round(passRate)}% — review spec compliance`,
      chipType: 'warning',
      priority: 2,
    };
  }

  return null;
}

/**
 * Build insight chip for staged comparison data on I-Chart.
 * Shows improvement/regression summary when stages are active.
 */
export function buildStagedComparisonInsight(
  comparison: StagedComparison
): DeterministicInsight | null {
  const { deltas } = comparison;
  const parts: string[] = [];

  // Cpk change
  if (deltas.cpkDelta !== null) {
    const sign = deltas.cpkDelta > 0 ? '+' : '';
    parts.push(`Cpk ${sign}${formatStatistic(deltas.cpkDelta, 'en', 2)}`);
  }

  // Out-of-spec reduction
  if (deltas.outOfSpecReduction > 0.5) {
    parts.push(`${formatStatistic(deltas.outOfSpecReduction, 'en', 1)}% fewer out-of-spec`);
  } else if (deltas.outOfSpecReduction < -0.5) {
    parts.push(
      `${formatStatistic(Math.abs(deltas.outOfSpecReduction), 'en', 1)}% more out-of-spec`
    );
  }

  // Variation change
  const variationPct = Math.round((deltas.variationRatio - 1) * 100);
  if (Math.abs(variationPct) >= 5) {
    parts.push(`variation ${variationPct > 0 ? '+' : ''}${variationPct}%`);
  }

  if (parts.length === 0) return null;

  // Determine if improvement or regression
  const isImproved =
    (deltas.cpkDelta !== null && deltas.cpkDelta > 0.05) ||
    deltas.variationRatio < 0.95 ||
    deltas.outOfSpecReduction > 1;

  const isRegressed =
    (deltas.cpkDelta !== null && deltas.cpkDelta < -0.05) ||
    deltas.variationRatio > 1.05 ||
    deltas.outOfSpecReduction < -1;

  const prefix = isImproved ? 'Improvement' : isRegressed ? 'Regression' : 'Change';

  // Priority: 3 if Cpk improved > 0.2, 2 if marginal, 1 if regression
  let priority = 2;
  if (deltas.cpkDelta !== null && deltas.cpkDelta > 0.2) priority = 3;
  else if (isRegressed) priority = 1;

  return {
    text: `${prefix}: ${parts.join(', ')}`,
    chipType: isImproved ? 'info' : isRegressed ? 'warning' : 'info',
    priority,
  };
}
