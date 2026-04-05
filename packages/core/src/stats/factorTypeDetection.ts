import type { DataRow } from '../types';
import { toNumericValue } from '../types';

/**
 * Classification of a data column as continuous or categorical,
 * used by the GLM engine to decide between dummy coding and slope coefficients.
 */
export interface FactorTypeClassification {
  type: 'continuous' | 'categorical';
  confidence: 'high' | 'medium' | 'low';
  reason: string;
}

/**
 * Classify a single factor column as continuous or categorical.
 *
 * Heuristic rules applied in priority order:
 *
 * 1. Non-numeric values present → categorical (high)
 * 2. ≤ 6 unique values → categorical (high) — covers Machine 1–4, Year 2020–2022
 * 3. ≤ 20 unique values + all integers → categorical (medium) — covers Batch 1–50
 * 4. > 20 unique values → continuous (high) — covers Temperature with decimals
 * 5. Moderate cardinality (7–20) with decimals → continuous (medium)
 *
 * @param data - Array of data rows
 * @param column - Column name to classify
 * @param uniqueCount - Pre-computed number of unique non-null values
 * @param isNumeric - Whether all non-null values in the column are numeric
 */
export function classifyFactorType(
  data: DataRow[],
  column: string,
  uniqueCount: number,
  isNumeric: boolean
): FactorTypeClassification {
  // Rule 1: Non-numeric values → categorical (high confidence)
  if (!isNumeric) {
    return {
      type: 'categorical',
      confidence: 'high',
      reason: `Column "${column}" contains non-numeric values — treated as categorical.`,
    };
  }

  // Rule 2: ≤ 6 unique values → categorical (high confidence)
  if (uniqueCount <= 6) {
    return {
      type: 'categorical',
      confidence: 'high',
      reason: `Column "${column}" has only ${uniqueCount} unique value(s) — treated as categorical.`,
    };
  }

  // Rule 4: > 20 unique values → continuous (high confidence)
  // Checked before Rule 3 so integer check only runs for 7–20 range.
  if (uniqueCount > 20) {
    return {
      type: 'continuous',
      confidence: 'high',
      reason: `Column "${column}" has ${uniqueCount} unique values — treated as continuous.`,
    };
  }

  // Rule 3: 7–20 unique values — check whether all observed values are integers
  const hasDecimals = data.some(row => {
    const raw = row[column];
    const num = toNumericValue(raw);
    return num !== undefined && num !== Math.floor(num);
  });

  if (!hasDecimals) {
    // ≤ 20 unique + all integers → categorical (medium confidence)
    return {
      type: 'categorical',
      confidence: 'medium',
      reason: `Column "${column}" has ${uniqueCount} unique integer value(s) — treated as categorical.`,
    };
  }

  // Rule 5: Moderate cardinality (7–20) with decimals → continuous (medium confidence)
  return {
    type: 'continuous',
    confidence: 'medium',
    reason: `Column "${column}" has ${uniqueCount} unique values with decimal precision — treated as continuous.`,
  };
}

/**
 * Classify all factor columns in a dataset.
 *
 * Computes uniqueCount and isNumeric from the actual data for each column,
 * then delegates to `classifyFactorType`.
 *
 * @param data - Array of data rows
 * @param factors - Column names to classify
 * @returns Map from column name to its FactorTypeClassification
 */
export function classifyAllFactors(
  data: DataRow[],
  factors: string[]
): Map<string, FactorTypeClassification> {
  const result = new Map<string, FactorTypeClassification>();

  for (const column of factors) {
    const uniqueValues = new Set<string>();
    let isNumeric = true;

    for (const row of data) {
      const raw = row[column];

      // Skip null/undefined
      if (raw === null || raw === undefined) continue;

      const num = toNumericValue(raw);
      if (num === undefined) {
        // Non-numeric value found
        isNumeric = false;
        // Still record as a unique value for completeness
        uniqueValues.add(String(raw));
      } else {
        uniqueValues.add(String(num));
      }
    }

    const classification = classifyFactorType(data, column, uniqueValues.size, isNumeric);

    result.set(column, classification);
  }

  return result;
}
