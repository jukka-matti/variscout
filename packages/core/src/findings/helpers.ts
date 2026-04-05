/**
 * Status helpers and utility functions for findings domain.
 */
import type {
  Finding,
  FindingStatus,
  FindingContext,
  FindingSource,
  InvestigationCategory,
  Question,
  SuspectedCause,
  SuspectedCauseEvidence,
} from './types';
import { createSuspectedCause } from './factories';
import type { BestSubsetsResult, BestSubsetResult, LevelChange } from '../stats/bestSubsets';
import { predictFromModel, predictFromUnifiedModel } from '../stats/bestSubsets';

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
    // Category-based charts (boxplot/pareto/yamazumi)
    if (source.chart === 'boxplot' || source.chart === 'pareto' || source.chart === 'yamazumi') {
      return (
        (f.source.chart === 'boxplot' ||
          f.source.chart === 'pareto' ||
          f.source.chart === 'yamazumi') &&
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
  categories: InvestigationCategory[],
  factorName: string
): InvestigationCategory | undefined {
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
// SuspectedCause hub helpers
// ============================================================================

/**
 * Compute the aggregate evidence contribution for a SuspectedCause hub.
 *
 * Sums η² (etaSquared) from each connected question. Falls back to rSquaredAdj
 * when etaSquared is absent. Questions not present in the provided list are
 * silently skipped (e.g. questions from a different investigation scope).
 *
 * @param hub - The SuspectedCause hub to compute contribution for
 * @param questions - All questions in scope (e.g. from the investigation store)
 * @returns Aggregate contribution as a decimal (e.g. 0.56 = 56%)
 *
 * @deprecated Use `computeHubEvidence` instead, which uses Best Subsets R²adj
 * for correlated factors and always returns a value ≤ 1.0.
 */
export function computeHubContribution(hub: SuspectedCause, questions: Question[]): number {
  const hubQuestionIds = new Set(hub.questionIds);
  let total = 0;
  for (const q of questions) {
    if (!hubQuestionIds.has(q.id)) continue;
    const contribution = q.evidence?.etaSquared ?? q.evidence?.rSquaredAdj ?? 0;
    total += contribution;
  }
  return total;
}

// ============================================================================
// Mode-dispatched evidence computation
// ============================================================================

/** Statistical evidence via Best Subsets R²adj (standard + capability modes) */
function computeStatisticalEvidence(
  hubFactors: string[],
  questions: Question[],
  questionIds: string[],
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

  // Fallback: capped sum of individual evidence
  const hubQIds = new Set(questionIds);
  let sum = 0;
  for (const q of questions) {
    if (!hubQIds.has(q.id)) continue;
    sum += q.evidence?.etaSquared ?? q.evidence?.rSquaredAdj ?? 0;
  }
  return Math.min(sum, 1.0);
}

/** Lean evidence from waste contribution (yamazumi mode) */
function computeLeanEvidence(questions: Question[], questionIds: string[]): number {
  // Sum waste contribution from connected questions (capped at 1.0)
  const hubQIds = new Set(questionIds);
  let sum = 0;
  for (const q of questions) {
    if (!hubQIds.has(q.id)) continue;
    sum += q.evidence?.etaSquared ?? q.evidence?.rSquaredAdj ?? 0;
  }
  return Math.min(sum, 1.0);
}

/** Channel evidence from channel Cpk (performance mode) */
function computeChannelEvidence(questions: Question[], questionIds: string[]): number {
  // For now, same fallback as lean — will be refined when channel ranking is implemented
  const hubQIds = new Set(questionIds);
  let sum = 0;
  for (const q of questions) {
    if (!hubQIds.has(q.id)) continue;
    sum += q.evidence?.etaSquared ?? q.evidence?.rSquaredAdj ?? 0;
  }
  return Math.min(sum, 1.0);
}

/** Mode-specific evidence computation — follows analysisStrategy.ts pattern */
const evidenceComputers: Record<
  SuspectedCauseEvidence['mode'],
  (
    hubFactors: string[],
    questions: Question[],
    questionIds: string[],
    bestSubsets: BestSubsetsResult | null
  ) => number
> = {
  standard: (hf, q, qIds, bs) => computeStatisticalEvidence(hf, q, qIds, bs),
  capability: (hf, q, qIds, bs) => computeStatisticalEvidence(hf, q, qIds, bs),
  yamazumi: (_hf, q, qIds) => computeLeanEvidence(q, qIds),
  performance: (_hf, q, qIds) => computeChannelEvidence(q, qIds),
};

const EVIDENCE_LABELS: Record<SuspectedCauseEvidence['mode'], string> = {
  standard: 'R²adj',
  capability: 'Cpk impact',
  yamazumi: 'Waste %',
  performance: 'Channel Cpk',
};

/**
 * Compute mode-aware evidence for a SuspectedCause hub.
 *
 * Uses a mode-dispatched function map following the analysisStrategy.ts pattern.
 * Standard and capability modes use Best Subsets R²adj for correlated factors,
 * falling back to a capped sum of individual η² values. Yamazumi and performance
 * modes use mode-appropriate evidence and skip Best Subsets.
 *
 * Duplicate factors across connected questions are deduplicated before lookup
 * to prevent match failures when multiple questions share the same factor.
 *
 * @param hub - The SuspectedCause hub to compute evidence for
 * @param questions - All questions in scope (e.g. from the investigation store)
 * @param bestSubsetsResult - Best Subsets analysis result, or null for fallback
 * @param mode - Analysis mode (default: 'standard')
 * @returns Structured SuspectedCauseEvidence object
 */
export function computeHubEvidence(
  hub: SuspectedCause,
  questions: Question[],
  bestSubsetsResult: BestSubsetsResult | null,
  mode: SuspectedCauseEvidence['mode'] = 'standard'
): SuspectedCauseEvidence {
  // Collect unique factors linked to hub questions (dedup prevents match failures)
  const hubFactors = [
    ...new Set(
      hub.questionIds
        .map(id => questions.find(q => q.id === id)?.factor)
        .filter((f): f is string => f != null)
    ),
  ];

  const value = evidenceComputers[mode](hubFactors, questions, hub.questionIds, bestSubsetsResult);
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
// Hub projection (model-based prediction for SuspectedCause)
// ============================================================================

/** Projection result for a SuspectedCause hub based on level-effects model */
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
 * Compute a model-based projection for a SuspectedCause hub.
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
 * @param hub - The SuspectedCause hub
 * @param questions - All questions in scope
 * @param bestSubsetsResult - Best Subsets analysis result (null → return null)
 * @param currentWorstLevels - Current worst factor levels (factor → level string).
 *   For continuous factors, this is used only as fallback display labels.
 * @param options - Optional spec target, characteristic type, and continuous values
 */
export function computeHubProjection(
  hub: SuspectedCause,
  questions: Question[],
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

  // Collect unique factors from connected questions
  const hubFactors = [
    ...new Set(
      hub.questionIds
        .map(id => questions.find(q => q.id === id)?.factor)
        .filter((f): f is string => f != null)
    ),
  ];

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

/** A cluster of questions sharing factors that could form a SuspectedCause hub */
export interface EvidenceCluster {
  /** Factors shared by the clustered questions */
  factors: string[];
  /** Question IDs in the cluster */
  questionIds: string[];
  /** Finding IDs linked to clustered questions */
  findingIds: string[];
  /** Combined R²adj of the cluster */
  rSquaredAdj: number;
}

/**
 * Detect clusters of answered questions that share factors and could
 * form new SuspectedCause hubs.
 *
 * Groups answered questions by their factor, excludes factors already
 * covered by existing hubs, and returns clusters with 2+ questions
 * sorted by combined R²adj.
 *
 * @param questions - All questions in scope
 * @param findings - All findings in scope
 * @param existingHubs - Existing SuspectedCause hubs (factors excluded)
 */
export function detectEvidenceClusters(
  questions: Question[],
  findings: Finding[],
  existingHubs: SuspectedCause[]
): EvidenceCluster[] {
  // Collect factors already covered by existing hubs
  const coveredFactors = new Set<string>();
  for (const hub of existingHubs) {
    for (const qId of hub.questionIds) {
      const q = questions.find(qq => qq.id === qId);
      if (q?.factor) coveredFactors.add(q.factor);
    }
  }

  // Group answered questions by factor
  const factorQuestions = new Map<string, Question[]>();
  for (const q of questions) {
    if (q.status !== 'answered' && q.status !== 'investigating') continue;
    if (!q.factor) continue;
    if (coveredFactors.has(q.factor)) continue;

    if (!factorQuestions.has(q.factor)) factorQuestions.set(q.factor, []);
    factorQuestions.get(q.factor)!.push(q);
  }

  // Build clusters from factors with 2+ questions
  const clusters: EvidenceCluster[] = [];
  for (const [factor, qs] of factorQuestions.entries()) {
    if (qs.length < 2) continue;

    const questionIds = qs.map(q => q.id);
    const findingIds = [...new Set(qs.flatMap(q => q.linkedFindingIds ?? []))];
    const rSquaredAdj = qs.reduce((sum, q) => sum + (q.evidence?.rSquaredAdj ?? 0), 0);

    clusters.push({
      factors: [factor],
      questionIds,
      findingIds,
      rSquaredAdj,
    });
  }

  // Sort by combined R²adj descending
  clusters.sort((a, b) => b.rSquaredAdj - a.rSquaredAdj);

  return clusters;
}

/**
 * Migrate legacy `causeRole: 'suspected-cause'` tags on questions into individual
 * SuspectedCause hub instances.
 *
 * One hub is created per question that has `causeRole === 'suspected-cause'` and
 * a non-empty `factor` name. Questions with `ruled-out` or `contributing` roles,
 * or questions without a factor, are skipped.
 *
 * This is a one-time migration helper — new investigations should use the
 * SuspectedCause hub model directly.
 *
 * @param questions - All questions in the investigation tree
 * @returns New SuspectedCause hubs (one per migrated question)
 */
export function migrateCauseRolesToHubs(questions: Question[]): SuspectedCause[] {
  const hubs: SuspectedCause[] = [];
  for (const q of questions) {
    if (q.causeRole !== 'suspected-cause') continue;
    if (!q.factor) continue;
    hubs.push(createSuspectedCause(q.factor, '', [q.id], q.linkedFindingIds ?? []));
  }
  return hubs;
}
