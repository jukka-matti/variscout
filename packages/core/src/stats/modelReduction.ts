import type { MultiRegressionResult, TermRemovalSuggestion } from '../types';
import { formatStatistic } from '../i18n/format';

/**
 * Suggest the next term to remove during guided model reduction.
 *
 * Strategy:
 * 1. If any term has severe VIF (>10), suggest it first (unreliable estimate)
 * 2. Among non-significant terms (p >= 0.05), suggest the one with highest p-value
 * 3. At equal p-values, prefer interaction terms over main effects
 * 4. If all terms are significant and no VIF issues, return null (model is reduced)
 *
 * @param result - Current multi-regression result
 * @returns Suggestion for which term to remove, or null if model is well-specified
 */
export function suggestTermRemoval(result: MultiRegressionResult): TermRemovalSuggestion | null {
  const coefficients = result.coefficients;
  if (coefficients.length === 0) return null;

  // Priority 1: Severe VIF (> 10) — coefficient estimate is unreliable
  const severeVif = coefficients
    .filter(c => (c.vif ?? 0) > 10)
    .sort((a, b) => (b.vif ?? 0) - (a.vif ?? 0));

  if (severeVif.length > 0) {
    const worst = severeVif[0];
    return {
      term: worst.term,
      pValue: worst.pValue,
      reason: 'high_vif',
      explanation: `${worst.term} has VIF = ${formatStatistic(worst.vif!, 'en', 1)}, indicating severe multicollinearity. Its coefficient estimate is unreliable.`,
    };
  }

  // Priority 2: Non-significant terms (p >= 0.05), highest p-value first
  const nonSignificant = coefficients
    .filter(c => !c.isSignificant)
    .sort((a, b) => {
      // Highest p-value first
      if (Math.abs(b.pValue - a.pValue) > 1e-10) return b.pValue - a.pValue;
      // Tie-breaker: prefer removing interaction terms over main effects
      const aIsInteraction = a.termInfo.type === 'interaction' ? 1 : 0;
      const bIsInteraction = b.termInfo.type === 'interaction' ? 1 : 0;
      return bIsInteraction - aIsInteraction;
    });

  if (nonSignificant.length > 0) {
    const worst = nonSignificant[0];
    const termType = worst.termInfo.type === 'interaction' ? 'interaction term' : 'term';
    return {
      term: worst.term,
      pValue: worst.pValue,
      reason: 'not_significant',
      explanation: `${worst.term} has p = ${formatStatistic(worst.pValue, 'en', 3)}, not statistically significant. This ${termType} can likely be removed without loss of explanatory power.`,
    };
  }

  // All terms significant and no VIF issues — model is well-specified
  return null;
}
