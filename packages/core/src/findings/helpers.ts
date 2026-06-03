/**
 * Status helpers and utility functions for findings domain.
 */
import type {
  Finding,
  FindingStatus,
  FindingContext,
  FindingSource,
  AnalyzeCategory,
  Hypothesis,
  HypothesisEvidence,
} from './types';
import { collectReferencedColumns } from './hypothesisCondition';
import type { BestSubsetsResult, BestSubsetResult, LevelChange } from '../stats/bestSubsets';
import { predictFromModel, predictFromUnifiedModel } from '../stats/bestSubsets';

/**
 * Derive the factor columns a Hypothesis hub is "about" (ADR-085 F1).
 *
 * Factor identity comes from the hub's disconfirmable `condition` tree; when the
 * hub has no condition yet, fall back to the columns of its linked findings'
 * `activeFilters` snapshots.
 */
function deriveHubFactors(hub: Hypothesis, findings: Finding[]): string[] {
  if (hub.condition) {
    return [...collectReferencedColumns(hub.condition)];
  }
  const columns = new Set<string>();
  const linkedIds = new Set(hub.findingIds);
  for (const finding of findings) {
    if (!linkedIds.has(finding.id)) continue;
    for (const column of Object.keys(finding.context.activeFilters)) {
      columns.add(column);
    }
  }
  return [...columns];
}

/**
 * Get finding status
 */
export function getFindingStatus(finding: Finding): FindingStatus {
  return finding.status;
}

/**
 * Group findings by status for board view
 */
export function groupFindingsByStatus(findings: Finding[]): Record<FindingStatus, Finding[]> {
  const groups: Record<FindingStatus, Finding[]> = {
    observed: [],
    investigating: [],
    analyzed: [],
    improving: [],
    resolved: [],
  };

  for (const finding of findings) {
    groups[finding.status].push(finding);
  }

  return groups;
}

/**
 * Compare two activeFilters objects (order-insensitive for both keys and values)
 */
export function filtersEqual(
  a: Record<string, (string | number)[]>,
  b: Record<string, (string | number)[]>
): boolean {
  const keysA = Object.keys(a).sort();
  const keysB = Object.keys(b).sort();
  if (keysA.length !== keysB.length) return false;
  for (let i = 0; i < keysA.length; i++) {
    if (keysA[i] !== keysB[i]) return false;
    const valsA = a[keysA[i]].map(String).sort();
    const valsB = b[keysB[i]].map(String).sort();
    if (valsA.length !== valsB.length) return false;
    for (let j = 0; j < valsA.length; j++) {
      if (valsA[j] !== valsB[j]) return false;
    }
  }
  return true;
}

/**
 * Find an existing finding with matching filters, or undefined
 */
export function findDuplicateFinding(
  findings: Finding[],
  activeFilters: Record<string, (string | number)[]>
): Finding | undefined {
  return findings.find(f => filtersEqual(f.context.activeFilters, activeFilters));
}

/**
 * Find an existing finding with matching chart source (same chart type + category).
 * Used for duplicate detection when adding chart observations.
 */
export function findDuplicateBySource(
  findings: Finding[],
  source: FindingSource
): Finding | undefined {
  return findings.find(f => {
    if (!f.source) return false;
    if (f.source.chart !== source.chart) return false;
    // Category-based charts (boxplot/pareto)
    if (source.chart === 'boxplot' || source.chart === 'pareto') {
      return (
        (f.source.chart === 'boxplot' || f.source.chart === 'pareto') &&
        f.source.category === source.category
      );
    }
    // I-Chart: no duplicate detection by position (each is unique)
    // CoScout: no duplicate detection (each message is unique)
    return false;
  });
}

/**
 * Get the category that a factor belongs to, or undefined if uncategorized.
 */
export function getCategoryForFactor(
  categories: AnalyzeCategory[],
  factorName: string
): AnalyzeCategory | undefined {
  return categories.find(c => c.factorNames.includes(factorName));
}

/**
 * Format a finding's filters as a compact display string
 */
export function formatFindingFilters(
  context: FindingContext,
  columnAliases?: Record<string, string>
): string {
  const parts: string[] = [];
  for (const [factor, values] of Object.entries(context.activeFilters)) {
    const label = columnAliases?.[factor] || factor;
    const valStr =
      values.length <= 2 ? values.map(String).join(', ') : `${values[0]} +${values.length - 1}`;
    parts.push(`${label}=${valStr}`);
  }
  return parts.join(' · ');
}

/**
 * Determine if a finding is in scope for cumulative projection.
 * Auto-scope: investigating or analyzed status. Manual override via scoped field.
 */
export function isFindingScoped(finding: Finding): boolean {
  if (finding.scoped !== undefined) return finding.scoped;
  return finding.status === 'investigating' || finding.status === 'analyzed';
}

/**
 * Get all scoped findings (excluding benchmarks).
 */
export function getScopedFindings(findings: Finding[]): Finding[] {
  return findings.filter(f => f.role !== 'benchmark' && isFindingScoped(f));
}

// ============================================================================
// Mode-dispatched evidence computation
// ============================================================================

/** Statistical evidence via Best Subsets R²adj (standard + capability modes) */
function computeStatisticalEvidence(
  hubFactors: string[],
  bestSubsetsResult: BestSubsetsResult | null
): number {
  if (bestSubsetsResult && hubFactors.length > 0) {
    const sorted = [...hubFactors].sort();

    // Try exact factor-set match first
    const exact = bestSubsetsResult.subsets.find(s => {
      const sf = [...s.factors].sort();
      return sf.length === sorted.length && sf.every((f, i) => f === sorted[i]);
    });
    if (exact) return exact.rSquaredAdj;

    // Fall back to the largest subset whose factors are all in the hub
    const partial = bestSubsetsResult.subsets
      .filter(s => s.factors.every(f => hubFactors.includes(f)))
      .sort((a, b) => b.rSquaredAdj - a.rSquaredAdj);
    if (partial.length > 0) return partial[0].rSquaredAdj;
  }

  // No model match — no derivable contribution.
  return 0;
}

/** Channel evidence (performance mode) — falls back to statistical for now */
function computeChannelEvidence(
  hubFactors: string[],
  bestSubsetsResult: BestSubsetsResult | null
): number {
  return computeStatisticalEvidence(hubFactors, bestSubsetsResult);
}

/** Mode-specific evidence computation — follows analysisStrategy.ts pattern */
const evidenceComputers: Record<
  HypothesisEvidence['mode'],
  (hubFactors: string[], bestSubsets: BestSubsetsResult | null) => number
> = {
  standard: (hf, bs) => computeStatisticalEvidence(hf, bs),
  capability: (hf, bs) => computeStatisticalEvidence(hf, bs),
  performance: (hf, bs) => computeChannelEvidence(hf, bs),
};

const EVIDENCE_LABELS: Record<HypothesisEvidence['mode'], string> = {
  standard: 'R²adj',
  capability: 'Cpk impact',
  performance: 'Channel Cpk',
};

/**
 * Compute mode-aware evidence for a Hypothesis hub.
 *
 * Uses a mode-dispatched function map following the analysisStrategy.ts pattern.
 * Standard and capability modes use Best Subsets R²adj for correlated factors,
 * falling back to a capped sum of individual η² values. Performance mode
 * uses mode-appropriate evidence and skips Best Subsets.
 *
 * The hub's factor columns are derived from its `condition` tree (ADR-085 F1),
 * falling back to its linked findings' `activeFilters` columns.
 *
 * @param hub - The Hypothesis hub to compute evidence for
 * @param findings - All findings in scope (used to re-derive hub factors)
 * @param bestSubsetsResult - Best Subsets analysis result, or null for fallback
 * @param mode - Analysis mode (default: 'standard')
 * @returns Structured HypothesisEvidence object
 */
export function computeHubEvidence(
  hub: Hypothesis,
  findings: Finding[],
  bestSubsetsResult: BestSubsetsResult | null,
  mode: HypothesisEvidence['mode'] = 'standard'
): HypothesisEvidence {
  const hubFactors = deriveHubFactors(hub, findings);

  const value = evidenceComputers[mode](hubFactors, bestSubsetsResult);
  const pct = Math.round(value * 100);

  return {
    mode,
    contribution: {
      value,
      label: EVIDENCE_LABELS[mode],
      description: `Explains ${pct}% of variation`,
    },
  };
}

// ============================================================================
// Hub projection (model-based prediction for Hypothesis)
// ============================================================================

/** Projection result for a Hypothesis hub based on level-effects model */
export interface HubProjection {
  /** Change in predicted mean (target - current) */
  predictedMeanDelta: number;
  /** Predicted mean at target (best) levels */
  predictedMean: number;
  /** Predicted mean at current (worst) levels */
  currentMean: number;
  /** R²adj of the matching subset model */
  rSquaredAdj: number;
  /** Per-factor level changes */
  levelChanges: LevelChange[];
  /** Hedged label for UI display */
  label: string;
}

/**
 * Compute a model-based projection for a Hypothesis hub.
 *
 * Finds the best matching factor subset from the Best Subsets result,
 * uses level effects to predict the mean change when switching from
 * current worst levels to best levels.
 *
 * For all-categorical models: uses the additive level-effects prediction
 * (predictFromModel) with string level names.
 *
 * For OLS models with continuous factors: uses predictFromUnifiedModel
 * with numeric factor values when `currentWorstValues` is provided.
 * Falls back to the categorical path for any factor not present in the
 * numeric values map.
 *
 * @param hub - The Hypothesis hub
 * @param findings - All findings in scope (used to re-derive hub factors)
 * @param bestSubsetsResult - Best Subsets analysis result (null → return null)
 * @param currentWorstLevels - Current worst factor levels (factor → level string).
 *   For continuous factors, this is used only as fallback display labels.
 * @param options - Optional spec target, characteristic type, and continuous values
 */
export function computeHubProjection(
  hub: Hypothesis,
  findings: Finding[],
  bestSubsetsResult: BestSubsetsResult | null,
  currentWorstLevels: Record<string, string>,
  options?: {
    target?: number;
    characteristicType?: 'nominal' | 'smaller' | 'larger';
    /** Numeric values for continuous factors (factor → value) */
    currentWorstValues?: Record<string, number>;
    /** Numeric target values for continuous factors (factor → optimal value) */
    targetValues?: Record<string, number>;
  }
): HubProjection | null {
  if (!bestSubsetsResult) return null;

  const hubFactors = deriveHubFactors(hub, findings);

  if (hubFactors.length === 0) return null;

  // Find best matching subset: exact match first, then largest partial
  const sorted = [...hubFactors].sort();
  let matchedSubset: BestSubsetResult | undefined;

  matchedSubset = bestSubsetsResult.subsets.find(s => {
    const sf = [...s.factors].sort();
    return sf.length === sorted.length && sf.every((f, i) => f === sorted[i]);
  });

  if (!matchedSubset) {
    const partials = bestSubsetsResult.subsets
      .filter(s => s.factors.every(f => hubFactors.includes(f)))
      .sort((a, b) => b.rSquaredAdj - a.rSquaredAdj);
    matchedSubset = partials[0];
  }

  if (!matchedSubset) return null;

  // Find best levels: selection depends on characteristic type.
  // - nominal: level with smallest absolute effect (closest to grand mean)
  // - smaller: level with most negative effect (lowest predicted mean)
  // - larger: level with most positive effect (highest predicted mean)
  const charType = options?.characteristicType ?? 'nominal';
  const targetLevels: Record<string, string> = {};
  for (const factor of matchedSubset.factors) {
    const effects = matchedSubset.levelEffects.get(factor);
    if (!effects) return null;

    let bestLevel: string | undefined;

    if (charType === 'smaller') {
      // Smaller-is-better: pick the level with the most negative effect
      let bestEffect = Infinity;
      for (const [level, effect] of effects.entries()) {
        if (effect < bestEffect) {
          bestEffect = effect;
          bestLevel = level;
        }
      }
    } else if (charType === 'larger') {
      // Larger-is-better: pick the level with the most positive effect
      let bestEffect = -Infinity;
      for (const [level, effect] of effects.entries()) {
        if (effect > bestEffect) {
          bestEffect = effect;
          bestLevel = level;
        }
      }
    } else {
      // Nominal: pick the level closest to zero (closest to grand mean)
      let bestDist = Infinity;
      for (const [level, effect] of effects.entries()) {
        const distance = Math.abs(effect);
        if (distance < bestDist) {
          bestDist = distance;
          bestLevel = level;
        }
      }
    }

    if (!bestLevel) return null;
    targetLevels[factor] = bestLevel;
  }

  // Determine if the matched subset uses OLS with continuous factors
  const hasContinuousFactors =
    matchedSubset.factorTypes !== undefined &&
    Array.from(matchedSubset.factorTypes.values()).some(t => t === 'continuous');

  // OLS path: use predictFromUnifiedModel when continuous factors exist and
  // numeric values are provided for all continuous factors in the model.
  if (
    hasContinuousFactors &&
    matchedSubset.predictors !== undefined &&
    matchedSubset.intercept !== undefined &&
    options?.currentWorstValues !== undefined &&
    options?.targetValues !== undefined
  ) {
    const factorTypes = matchedSubset.factorTypes!;
    const currentWorstValues = options.currentWorstValues;
    const targetOpts = options.targetValues;

    // Build mixed factor-value maps (string for categorical, number for continuous)
    const currentFactorValues: Record<string, string | number> = {};
    const targetFactorValues: Record<string, string | number> = {};

    let allFactorsPresent = true;
    for (const factor of matchedSubset.factors) {
      const fType = factorTypes.get(factor) ?? 'categorical';
      if (fType === 'continuous') {
        const currentNum = currentWorstValues[factor];
        const targetNum = targetOpts[factor];
        if (currentNum === undefined || targetNum === undefined) {
          allFactorsPresent = false;
          break;
        }
        currentFactorValues[factor] = currentNum;
        targetFactorValues[factor] = targetNum;
      } else {
        const currentLevel = currentWorstLevels[factor];
        const targetLevel = targetLevels[factor];
        if (!currentLevel || !targetLevel) {
          allFactorsPresent = false;
          break;
        }
        currentFactorValues[factor] = currentLevel;
        targetFactorValues[factor] = targetLevel;
      }
    }

    if (allFactorsPresent) {
      const currentPredicted = predictFromUnifiedModel(matchedSubset, currentFactorValues);
      const targetPredicted = predictFromUnifiedModel(matchedSubset, targetFactorValues);

      if (currentPredicted !== null && targetPredicted !== null) {
        // Build level changes for display (continuous factors show numeric range)
        const levelChanges: LevelChange[] = matchedSubset.factors.map(factor => {
          const fType = factorTypes.get(factor) ?? 'categorical';
          if (fType === 'continuous') {
            return {
              factor,
              from: String(currentFactorValues[factor]),
              to: String(targetFactorValues[factor]),
              effect: targetPredicted - currentPredicted,
            };
          }
          return {
            factor,
            from: String(currentFactorValues[factor]),
            to: String(targetFactorValues[factor]),
            effect: 0, // individual contribution not decomposed in unified model
          };
        });

        return {
          predictedMeanDelta: targetPredicted - currentPredicted,
          predictedMean: targetPredicted,
          currentMean: currentPredicted,
          rSquaredAdj: matchedSubset.rSquaredAdj,
          levelChanges,
          label: 'Model suggests',
        };
      }
    }
    // Fall through to categorical path if numeric values incomplete
  }

  // Categorical (ANOVA) path: build currentLevels from provided worst levels
  const currentLevels: Record<string, string> = {};
  for (const factor of matchedSubset.factors) {
    const level = currentWorstLevels[factor];
    if (!level) return null;
    currentLevels[factor] = level;
  }

  const prediction = predictFromModel(
    matchedSubset,
    bestSubsetsResult.grandMean,
    currentLevels,
    targetLevels
  );

  if (!prediction) return null;

  return {
    predictedMeanDelta: prediction.meanDelta,
    predictedMean: prediction.predictedMean,
    currentMean: prediction.predictedMean - prediction.meanDelta,
    rSquaredAdj: matchedSubset.rSquaredAdj,
    levelChanges: prediction.levelChanges,
    label: 'Model suggests',
  };
}

// ============================================================================
// Evidence clustering (factor overlap detection)
// ============================================================================

/** A cluster of findings sharing a factor column that could form a Hypothesis hub */
export interface EvidenceCluster {
  /** Factor columns shared by the clustered findings */
  factors: string[];
  /** Finding IDs in the cluster */
  findingIds: string[];
}

/**
 * Detect clusters of in-scope findings that share a factor column and could
 * form new Hypothesis hubs (ADR-085 — factor identity comes from findings, not
 * a separate Question entity).
 *
 * Groups investigating/analyzed findings by the columns of their
 * `activeFilters` snapshot, excludes columns already covered by existing hubs,
 * and returns clusters with 2+ findings in first-seen (stable) order.
 *
 * Ordering is intentionally NOT ranked by R²adj — the analyst decides which
 * grouping is meaningful; the tool only surfaces the mechanical overlap.
 *
 * @param findings - All findings in scope
 * @param existingHubs - Existing Hypothesis hubs (covered columns excluded)
 */
export function detectEvidenceClusters(
  findings: Finding[],
  existingHubs: Hypothesis[]
): EvidenceCluster[] {
  // Collect columns already covered by existing hubs
  const coveredFactors = new Set<string>();
  for (const hub of existingHubs) {
    for (const factor of deriveHubFactors(hub, findings)) {
      coveredFactors.add(factor);
    }
  }

  // Group eligible findings by each referenced factor column (insertion order = first-seen)
  const factorFindings = new Map<string, Finding[]>();
  for (const finding of findings) {
    if (finding.status !== 'analyzed' && finding.status !== 'investigating') continue;
    for (const column of Object.keys(finding.context.activeFilters)) {
      if (coveredFactors.has(column)) continue;
      if (!factorFindings.has(column)) factorFindings.set(column, []);
      factorFindings.get(column)!.push(finding);
    }
  }

  // Build clusters from columns with 2+ findings; order is stable (Map insertion = first-seen)
  const clusters: EvidenceCluster[] = [];
  for (const [factor, fs] of factorFindings.entries()) {
    if (fs.length < 2) continue;

    const findingIds = [...new Set(fs.map(f => f.id))];

    clusters.push({
      factors: [factor],
      findingIds,
    });
  }

  return clusters;
}
