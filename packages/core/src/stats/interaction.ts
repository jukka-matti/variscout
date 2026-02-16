import type { InteractionEdge } from '../types';
import { calculateMultipleRegression } from './multiRegression';

/**
 * Calculate the interaction strength between two factors
 *
 * Compares a main-effects-only model (factorA + factorB) against a model
 * that includes their interaction term. The difference in R² (ΔR²) measures
 * how much the factors interact — i.e., whether the effect of one factor
 * depends on the level of the other.
 *
 * @param data - Array of data records
 * @param factorA - First factor column name
 * @param factorB - Second factor column name
 * @param outcome - Outcome (Y) column name
 * @param categoricalColumns - Optional list of categorical column names
 * @returns InteractionEdge with ΔR², p-value, and standardized β; or null if regression fails
 */
export function getInteractionStrength<T extends Record<string, unknown>>(
  data: T[],
  factorA: string,
  factorB: string,
  outcome: string,
  categoricalColumns?: string[]
): InteractionEdge | null {
  if (data.length < 5) return null;

  // Check that both factors have at least 2 distinct values
  const valuesA = new Set(data.map(d => d[factorA]).filter(v => v != null));
  const valuesB = new Set(data.map(d => d[factorB]).filter(v => v != null));
  if (valuesA.size < 2 || valuesB.size < 2) return null;

  const xColumns = [factorA, factorB];
  const catCols = categoricalColumns ?? [];

  // Main-effects-only model
  const mainResult = calculateMultipleRegression(data, outcome, xColumns, {
    categoricalColumns: catCols,
    includeInteractions: false,
  });
  if (!mainResult) return null;

  // Full model with interaction term
  const fullResult = calculateMultipleRegression(data, outcome, xColumns, {
    categoricalColumns: catCols,
    includeInteractions: true,
  });
  if (!fullResult) return null;

  const deltaRSquared = Math.max(0, fullResult.rSquared - mainResult.rSquared);

  // Find the interaction coefficient(s) — pick the one with largest |standardized|
  const interactionCoeffs = fullResult.coefficients.filter(c => c.termInfo.type === 'interaction');

  if (interactionCoeffs.length === 0) {
    // No interaction term was created (e.g., insufficient data)
    return null;
  }

  // Use the interaction coefficient with the largest absolute standardized effect
  const bestInteraction = interactionCoeffs.reduce((best, c) =>
    Math.abs(c.standardized) > Math.abs(best.standardized) ? c : best
  );

  return {
    factorA,
    factorB,
    deltaRSquared,
    pValue: bestInteraction.pValue,
    standardizedBeta: bestInteraction.standardized,
  };
}
