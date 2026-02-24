/**
 * Process improvement simulation — projected stats and direct adjustment what-if analysis
 */

import type {
  DataRow,
  FactorAdjustment,
  ModelSimulationResult,
  MultiRegressionResult,
} from '../types';
import { toNumericValue } from '../types';
import type { ProjectedStats, DirectAdjustmentParams, DirectAdjustmentResult } from './types';

export type { ProjectedStats, DirectAdjustmentParams, DirectAdjustmentResult };

/**
 * Error function approximation using Horner's method
 * Used for normal CDF calculation
 */
function erf(x: number): number {
  // Constants for approximation
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;

  // Save the sign of x
  const sign = x < 0 ? -1 : 1;
  x = Math.abs(x);

  // A&S formula 7.1.26
  const t = 1 / (1 + p * x);
  const y = 1 - ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

  return sign * y;
}

/**
 * Standard normal cumulative distribution function
 */
function normalCDF(z: number): number {
  return 0.5 * (1 + erf(z / Math.SQRT2));
}

/**
 * Calculate yield (percentage in spec) from a normal distribution
 */
function calculateYieldFromDistribution(
  mean: number,
  stdDev: number,
  specs?: { usl?: number; lsl?: number }
): number | undefined {
  if (!specs || (specs.usl === undefined && specs.lsl === undefined)) {
    return undefined;
  }

  if (stdDev === 0) {
    // No variation - check if mean is within specs
    const withinUSL = specs.usl === undefined || mean <= specs.usl;
    const withinLSL = specs.lsl === undefined || mean >= specs.lsl;
    return withinUSL && withinLSL ? 100 : 0;
  }

  // Calculate probability of being within spec limits
  let yieldPct = 100;

  if (specs.usl !== undefined && specs.lsl !== undefined) {
    // Both limits: P(LSL <= X <= USL)
    const zUpper = (specs.usl - mean) / stdDev;
    const zLower = (specs.lsl - mean) / stdDev;
    yieldPct = (normalCDF(zUpper) - normalCDF(zLower)) * 100;
  } else if (specs.usl !== undefined) {
    // Only upper limit: P(X <= USL)
    const z = (specs.usl - mean) / stdDev;
    yieldPct = normalCDF(z) * 100;
  } else if (specs.lsl !== undefined) {
    // Only lower limit: P(X >= LSL) = 1 - P(X < LSL)
    const z = (specs.lsl - mean) / stdDev;
    yieldPct = (1 - normalCDF(z)) * 100;
  }

  return Math.max(0, Math.min(100, yieldPct));
}

/**
 * Calculate projected statistics if certain categories were excluded
 *
 * This enables the "what-if" analysis: if we fixed/excluded the worst-performing
 * category, what would our stats look like? Shows potential improvement in
 * mean, standard deviation, and Cpk.
 *
 * @param data - Array of data rows
 * @param factor - Column name for the grouping variable
 * @param outcome - Column name for the numeric outcome variable
 * @param excludedCategories - Set of category values to exclude from projection
 * @param specs - Optional spec limits for Cpk calculation
 * @param currentStats - Optional current stats for improvement percentage calculation
 * @returns ProjectedStats with projected mean, stdDev, Cpk, and improvement percentages
 */
export function calculateProjectedStats(
  data: DataRow[],
  factor: string,
  outcome: string,
  excludedCategories: Set<string | number>,
  specs?: { usl?: number; lsl?: number; target?: number },
  currentStats?: { mean: number; stdDev: number; cpk?: number }
): ProjectedStats | null {
  // Filter out excluded categories
  const filteredData = data.filter(row => {
    const factorValue = row[factor];
    if (factorValue === undefined || factorValue === null) return true;
    return !excludedCategories.has(factorValue as string | number);
  });

  // Extract numeric outcome values
  const values = filteredData
    .map(d => toNumericValue(d[outcome]))
    .filter((v): v is number => v !== undefined);

  // Need at least 2 values for meaningful stats
  if (values.length < 2) {
    return null;
  }

  // Calculate projected mean
  const mean = values.reduce((a, b) => a + b, 0) / values.length;

  // Calculate projected standard deviation (population)
  const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
  const stdDev = Math.sqrt(variance);

  // Build result object
  const result: ProjectedStats = {
    mean,
    stdDev,
    remainingCount: values.length,
  };

  // Calculate Cp and Cpk if specs provided
  if (specs && stdDev > 0) {
    const { usl, lsl } = specs;

    if (usl !== undefined && lsl !== undefined) {
      result.cp = (usl - lsl) / (6 * stdDev);
      const cpu = (usl - mean) / (3 * stdDev);
      const cpl = (mean - lsl) / (3 * stdDev);
      result.cpk = Math.min(cpu, cpl);
    } else if (usl !== undefined) {
      result.cpk = (usl - mean) / (3 * stdDev);
    } else if (lsl !== undefined) {
      result.cpk = (mean - lsl) / (3 * stdDev);
    }
  }

  // Calculate improvement percentages if current stats provided
  if (currentStats) {
    // Standard deviation reduction (negative = worse, positive = improvement)
    if (currentStats.stdDev > 0) {
      result.stdDevReductionPct = ((currentStats.stdDev - stdDev) / currentStats.stdDev) * 100;
    }

    // Mean centering improvement (how much closer to target or center of specs)
    if (specs) {
      const target =
        specs.target ??
        (specs.usl !== undefined && specs.lsl !== undefined
          ? (specs.usl + specs.lsl) / 2
          : undefined);

      if (target !== undefined) {
        const currentDeviation = Math.abs(currentStats.mean - target);
        const projectedDeviation = Math.abs(mean - target);

        if (currentDeviation > 0) {
          result.meanImprovementPct =
            ((currentDeviation - projectedDeviation) / currentDeviation) * 100;
        } else if (projectedDeviation === 0) {
          result.meanImprovementPct = 0; // Already at target
        }
      }
    }

    // Cpk improvement
    if (currentStats.cpk !== undefined && currentStats.cpk > 0 && result.cpk !== undefined) {
      result.cpkImprovementPct = ((result.cpk - currentStats.cpk) / currentStats.cpk) * 100;
    }
  }

  return result;
}

/**
 * Simulate process improvement through direct mean shift and variation reduction
 *
 * This function enables "what-if" analysis for process improvement planning.
 * Users can adjust:
 * 1. Mean shift - moving the process center toward a target
 * 2. Variation reduction - reducing process spread (e.g., through better controls)
 *
 * The function calculates projected Cpk, yield, and PPM based on normal distribution
 * assumptions, showing potential improvement percentages.
 *
 * @param currentStats - Current process statistics (mean, stdDev, optionally cpk)
 * @param params - Adjustment parameters (meanShift, variationReduction)
 * @param specs - Optional specification limits for capability calculations
 * @returns DirectAdjustmentResult with projected stats and improvements
 */
export function simulateDirectAdjustment(
  currentStats: { mean: number; stdDev: number; cpk?: number },
  params: DirectAdjustmentParams,
  specs?: { usl?: number; lsl?: number; target?: number }
): DirectAdjustmentResult {
  // Apply adjustments
  const projectedMean = currentStats.mean + params.meanShift;
  const projectedStdDev = currentStats.stdDev * (1 - params.variationReduction);

  // Build result
  const result: DirectAdjustmentResult = {
    projectedMean,
    projectedStdDev,
    improvements: {},
  };

  // Calculate Cp and Cpk if specs provided
  if (specs && projectedStdDev > 0) {
    const { usl, lsl } = specs;

    if (usl !== undefined && lsl !== undefined) {
      result.projectedCp = (usl - lsl) / (6 * projectedStdDev);
      const cpu = (usl - projectedMean) / (3 * projectedStdDev);
      const cpl = (projectedMean - lsl) / (3 * projectedStdDev);
      result.projectedCpk = Math.min(cpu, cpl);
    } else if (usl !== undefined) {
      result.projectedCpk = (usl - projectedMean) / (3 * projectedStdDev);
    } else if (lsl !== undefined) {
      result.projectedCpk = (projectedMean - lsl) / (3 * projectedStdDev);
    }
  }

  // Calculate yield and PPM
  const projectedYield = calculateYieldFromDistribution(projectedMean, projectedStdDev, specs);
  if (projectedYield !== undefined) {
    result.projectedYield = projectedYield;
    result.projectedPPM = Math.round((100 - projectedYield) * 10000); // Convert % to PPM
  }

  // Calculate improvement percentages
  if (currentStats.cpk !== undefined && currentStats.cpk > 0 && result.projectedCpk !== undefined) {
    result.improvements.cpkImprovementPct =
      ((result.projectedCpk - currentStats.cpk) / currentStats.cpk) * 100;
  }

  // Calculate current yield for comparison
  const currentYield = calculateYieldFromDistribution(
    currentStats.mean,
    currentStats.stdDev,
    specs
  );
  if (currentYield !== undefined && projectedYield !== undefined) {
    result.improvements.yieldImprovementPct = projectedYield - currentYield;
  }

  return result;
}

// ============================================================================
// Model-driven simulation
// ============================================================================

/**
 * Baseline values per factor used by the model-driven simulator.
 */
export interface FactorBaseline {
  factor: string;
  type: 'categorical' | 'continuous';
  /** For categorical: mode (most common value). For continuous: mean */
  currentValue: string | number;
  /** For categorical: all observed levels */
  levels?: string[];
  /** For continuous: mean and stdDev of observed values */
  mean?: number;
  stdDev?: number;
}

/**
 * Compute baseline values for each predictor in the regression model.
 *
 * Categorical factors → mode (most frequent value).
 * Continuous factors → mean.
 */
export function getFactorBaselines(
  data: DataRow[],
  model: MultiRegressionResult
): FactorBaseline[] {
  // Build lookup: which columns are categorical (have levels/reference in terms)
  const catFactors = new Set<string>();
  const contFactors = new Set<string>();

  for (const term of model.terms ?? []) {
    if (term.type === 'categorical') {
      catFactors.add(term.columns[0]);
    } else if (term.type === 'continuous') {
      contFactors.add(term.columns[0]);
    }
  }

  // Also infer from coefficients: dummy terms like "Machine_B" with level
  for (const coef of model.coefficients) {
    const termInfo = model.terms?.find(t => t.label === coef.term);
    if (termInfo) {
      if (termInfo.type === 'categorical') catFactors.add(termInfo.columns[0]);
      else if (termInfo.type === 'continuous') contFactors.add(termInfo.columns[0]);
    }
  }

  const baselines: FactorBaseline[] = [];

  for (const factor of catFactors) {
    const counts = new Map<string, number>();
    for (const row of data) {
      const v = row[factor];
      if (v == null) continue;
      const key = String(v);
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    let mode = '';
    let maxCount = 0;
    for (const [key, count] of counts) {
      if (count > maxCount) {
        mode = key;
        maxCount = count;
      }
    }
    baselines.push({
      factor,
      type: 'categorical',
      currentValue: mode,
      levels: Array.from(counts.keys()).sort(),
    });
  }

  for (const factor of contFactors) {
    const values: number[] = [];
    for (const row of data) {
      const v = toNumericValue(row[factor]);
      if (v !== undefined) values.push(v);
    }
    if (values.length === 0) continue;
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((s, v) => s + (v - mean) ** 2, 0) / values.length;
    baselines.push({
      factor,
      type: 'continuous',
      currentValue: mean,
      mean,
      stdDev: Math.sqrt(variance),
    });
  }

  return baselines;
}

/**
 * Simulate the predicted mean shift from a regression model given proposed
 * factor-level adjustments.
 *
 * For each adjustment the function computes the change in the regression
 * predicted value: `ŷ_proposed - ŷ_current`.
 *
 * Categorical factors: switching from level A to level B changes ŷ by
 * `(β_B - β_A)` where β is the coefficient for the respective dummy.
 * The reference level has an implicit coefficient of 0.
 *
 * Continuous factors: shifting by Δ changes ŷ by `β × Δ`.
 */
export function simulateFromModel(
  model: MultiRegressionResult,
  adjustments: FactorAdjustment[]
): ModelSimulationResult {
  const contributions: ModelSimulationResult['contributions'] = [];
  let totalShift = 0;

  for (const adj of adjustments) {
    // Find corresponding terms in the model
    const relatedTerms = (model.terms ?? []).filter(
      t => t.columns[0] === adj.factor && t.type !== 'interaction'
    );

    if (relatedTerms.length === 0) {
      // Try matching by coefficient term name directly
      const coef = model.coefficients.find(c => c.term === adj.factor);
      if (coef) {
        // Continuous predictor matched by name
        const delta = coef.coefficient * (Number(adj.proposedValue) - Number(adj.currentValue));
        contributions.push({ factor: adj.factor, delta });
        totalShift += delta;
      }
      continue;
    }

    const termType = relatedTerms[0].type;

    if (termType === 'categorical') {
      // For categorical: find coefficients for current and proposed levels
      // Reference level has implicit coefficient 0
      const currentStr = String(adj.currentValue);
      const proposedStr = String(adj.proposedValue);

      let betaCurrent = 0;
      let betaProposed = 0;

      for (const term of relatedTerms) {
        const coef = model.coefficients.find(c => c.term === term.label);
        if (!coef) continue;
        if (term.level === currentStr) betaCurrent = coef.coefficient;
        if (term.level === proposedStr) betaProposed = coef.coefficient;
      }

      const delta = betaProposed - betaCurrent;
      contributions.push({ factor: adj.factor, delta });
      totalShift += delta;
    } else {
      // Continuous
      const coef = model.coefficients.find(c => c.term === relatedTerms[0].label);
      if (coef) {
        const delta = coef.coefficient * (Number(adj.proposedValue) - Number(adj.currentValue));
        contributions.push({ factor: adj.factor, delta });
        totalShift += delta;
      }
    }
  }

  return { meanShift: totalShift, contributions };
}
