/**
 * Design matrix construction for OLS regression.
 *
 * Converts raw DataRow arrays into a column-major Float64Array design matrix
 * suitable for QR-based OLS solvers. Handles:
 *   - Reference coding for categorical factors (k-1 indicator columns,
 *     most-frequent level omitted as reference)
 *   - Column centering for continuous factors (reduces multicollinearity)
 *   - Optional quadratic terms: (x - mean)² column appended after linear
 *   - Missing value exclusion with valid row index tracking
 *
 * Column layout in X:
 *   [0]       intercept (all 1s)
 *   [1..k-1]  indicator columns for factor 1 (categorical) or
 *             raw/centered values (continuous) + optional quadratic
 *   ...       repeated for each factor in declaration order
 */

import type { DataRow } from '../types';
import { toNumericValue } from '../types';

// ============================================================================
// Public types
// ============================================================================

/**
 * Encoding metadata for one factor in the design matrix.
 * Allows downstream code to interpret coefficients and build predictions.
 */
export interface FactorEncoding {
  /** Factor column name in the source data */
  factorName: string;
  /** Whether this factor is treated as continuous, categorical, or interaction */
  type: 'continuous' | 'categorical' | 'interaction';
  /**
   * Column indices in X (0 = intercept).
   * Categorical: one index per non-reference level (k-1 columns).
   * Continuous: one index (linear) or two indices [linear, quadratic].
   * Interaction: one index per product term.
   */
  columnIndices: number[];
  /** Categorical: all levels sorted alphabetically */
  levels?: string[];
  /** Categorical: omitted level (most frequent) used as reference */
  referenceLevel?: string;
  /** Continuous + quadratic: column index of the (x - mean)² term */
  quadraticIndex?: number;
  /** Continuous: mean of the factor values (used for centering) */
  mean?: number;
  /** Interaction: the two source factor names */
  sourceFactors?: [string, string];
  /** Interaction: the kind of factor pair */
  interactionType?: 'cont×cont' | 'cont×cat' | 'cat×cat';
}

/**
 * Result of buildDesignMatrix.
 * X is column-major: X[col][row] — optimised for BLAS-style solvers.
 */
export interface DesignMatrixResult {
  /** Column-major design matrix. X[col] is a Float64Array of length n. */
  X: Float64Array[];
  /** Outcome vector, length n */
  y: Float64Array;
  /** Number of valid observations included */
  n: number;
  /** Number of columns in X (including intercept) */
  p: number;
  /** One encoding per factor, in declaration order */
  encodings: FactorEncoding[];
  /** Indices into the original data array for rows that were included */
  validIndices: number[];
}

/**
 * Factor specification passed to buildDesignMatrix.
 */
export interface FactorSpec {
  name: string;
  type: 'continuous' | 'categorical' | 'interaction';
  /** Continuous only: include a (x - mean)² column in addition to the linear term */
  includeQuadratic?: boolean;
  /** Interaction only: the two source factor names (must appear earlier in the factors array) */
  sourceFactors?: [string, string];
}

// ============================================================================
// Internal helpers
// ============================================================================

/**
 * Count occurrences of each string value in an array.
 * Returns a Map<value, count> sorted by count descending (insertion order).
 */
function countLevels(values: string[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const v of values) {
    counts.set(v, (counts.get(v) ?? 0) + 1);
  }
  return counts;
}

/**
 * Pick the most frequent level to use as the reference.
 * Ties broken by alphabetical order of level name.
 */
function pickReferenceLevel(counts: Map<string, number>): string {
  let bestLevel = '';
  let bestCount = -1;
  for (const [level, count] of counts) {
    if (count > bestCount || (count === bestCount && level < bestLevel)) {
      bestLevel = level;
      bestCount = count;
    }
  }
  return bestLevel;
}

// ============================================================================
// Main function
// ============================================================================

/**
 * Build a design matrix from raw data rows.
 *
 * @param data     Source rows (Record<string, string|number|undefined|...>)
 * @param outcome  Name of the numeric outcome column
 * @param factors  Factor specifications (name, type, optional quadratic flag)
 * @returns        Column-major design matrix + encodings + valid row metadata
 *
 * @example
 * const result = buildDesignMatrix(rows, 'Yield', [
 *   { name: 'Temperature', type: 'continuous', includeQuadratic: true },
 *   { name: 'Machine',     type: 'categorical' },
 * ]);
 */
export function buildDesignMatrix(
  data: DataRow[],
  outcome: string,
  factors: FactorSpec[]
): DesignMatrixResult {
  // -----------------------------------------------------------------------
  // Pass 1: identify valid rows and collect raw categorical / continuous
  //         values for each factor (needed to compute levels & means).
  // -----------------------------------------------------------------------

  // For each row, record whether it is valid (non-missing outcome + all factors)
  const validIndices: number[] = [];

  // Temporary storage per factor (indexed by factor position)
  const rawCategorical: string[][] = factors.map(() => []);
  const rawContinuous: number[][] = factors.map(() => []);

  for (let rowIdx = 0; rowIdx < data.length; rowIdx++) {
    const row = data[rowIdx];

    // Check outcome
    const yVal = toNumericValue(row[outcome]);
    if (yVal === undefined) continue;

    // Check each factor (skip interaction factors — they have no raw column)
    let rowValid = true;
    for (let fi = 0; fi < factors.length; fi++) {
      const { name, type } = factors[fi];
      if (type === 'interaction') continue;

      const cell = row[name];

      if (type === 'continuous') {
        const num = toNumericValue(cell);
        if (num === undefined) {
          rowValid = false;
          break;
        }
      } else {
        // categorical: value must be a non-null, non-undefined string or number
        if (cell === null || cell === undefined) {
          rowValid = false;
          break;
        }
      }
    }

    if (!rowValid) continue;

    // Row is valid — collect raw values (skip interaction factors)
    validIndices.push(rowIdx);
    for (let fi = 0; fi < factors.length; fi++) {
      const { name, type } = factors[fi];
      if (type === 'interaction') continue;
      const cell = row[name];
      if (type === 'continuous') {
        rawContinuous[fi].push(toNumericValue(cell) as number);
      } else {
        rawCategorical[fi].push(String(cell));
      }
    }
  }

  const n = validIndices.length;

  // -----------------------------------------------------------------------
  // Compute encoding metadata per factor
  // -----------------------------------------------------------------------

  // Determine total number of X columns: 1 (intercept) + columns per factor
  let totalCols = 1; // intercept

  const encodings: FactorEncoding[] = [];

  for (let fi = 0; fi < factors.length; fi++) {
    const { name, type, includeQuadratic } = factors[fi];

    if (type === 'categorical') {
      const vals = rawCategorical[fi];
      const counts = countLevels(vals);
      const referenceLevel = pickReferenceLevel(counts);
      // All levels sorted alphabetically (reference is still listed in levels)
      const levels = Array.from(counts.keys()).sort();
      // Non-reference levels get columns (k-1 indicators)
      const nonRefLevels = levels.filter(l => l !== referenceLevel);
      const startCol = totalCols;
      const columnIndices = nonRefLevels.map((_, i) => startCol + i);
      totalCols += nonRefLevels.length;

      encodings.push({
        factorName: name,
        type: 'categorical',
        columnIndices,
        levels,
        referenceLevel,
      });
    } else if (type === 'interaction') {
      const [srcA, srcB] = factors[fi].sourceFactors ?? ([] as unknown as [string, string]);
      const encA = encodings.find(e => e.factorName === srcA);
      const encB = encodings.find(e => e.factorName === srcB);

      if (!encA || !encB) {
        throw new Error(
          `buildDesignMatrix: interaction factor "${name}" references unknown source factors "${srcA}" or "${srcB}". ` +
            `Source factors must appear before the interaction in the factors array.`
        );
      }

      let interactionType: FactorEncoding['interactionType'];
      let numCols: number;

      if (encA.type === 'continuous' && encB.type === 'continuous') {
        interactionType = 'cont×cont';
        numCols = 1;
      } else if (encA.type === 'continuous' && encB.type === 'categorical') {
        interactionType = 'cont×cat';
        numCols = encB.columnIndices.length; // (m-1)
      } else if (encA.type === 'categorical' && encB.type === 'continuous') {
        interactionType = 'cont×cat';
        numCols = encA.columnIndices.length; // (m-1)
      } else {
        // cat×cat
        interactionType = 'cat×cat';
        numCols = encA.columnIndices.length * encB.columnIndices.length; // (a-1)(b-1)
      }

      const startCol = totalCols;
      const columnIndices = Array.from({ length: numCols }, (_, i) => startCol + i);
      totalCols += numCols;

      encodings.push({
        factorName: name,
        type: 'interaction',
        columnIndices,
        sourceFactors: [srcA, srcB],
        interactionType,
      });
    } else {
      // continuous
      const vals = rawContinuous[fi];
      const mean = vals.length > 0 ? vals.reduce((s, v) => s + v, 0) / vals.length : 0;

      const linearCol = totalCols;
      totalCols += 1;

      const encoding: FactorEncoding = {
        factorName: name,
        type: 'continuous',
        columnIndices: [linearCol],
        mean,
      };

      if (includeQuadratic) {
        encoding.quadraticIndex = totalCols;
        encoding.columnIndices = [linearCol, totalCols];
        totalCols += 1;
      }

      encodings.push(encoding);
    }
  }

  const p = totalCols;

  // -----------------------------------------------------------------------
  // Allocate output arrays (column-major)
  // -----------------------------------------------------------------------
  const X: Float64Array[] = Array.from({ length: p }, () => new Float64Array(n));
  const y = new Float64Array(n);

  // -----------------------------------------------------------------------
  // Pass 2: fill X and y
  // -----------------------------------------------------------------------

  // Precompute non-reference levels for each categorical factor
  const nonRefLevelsByFactor: (string[] | null)[] = encodings.map(enc => {
    if (enc.type === 'categorical' && enc.levels && enc.referenceLevel) {
      return enc.levels.filter(l => l !== enc.referenceLevel);
    }
    return null;
  });

  for (let ri = 0; ri < n; ri++) {
    const row = data[validIndices[ri]];

    // Outcome
    y[ri] = toNumericValue(row[outcome]) as number;

    // Intercept
    X[0][ri] = 1;

    // Factor columns (skip interaction factors — filled in a separate pass below)
    for (let fi = 0; fi < factors.length; fi++) {
      const { name, type } = factors[fi];
      if (type === 'interaction') continue;

      const enc = encodings[fi];

      if (type === 'categorical') {
        const cell = String(row[name]);
        const nonRefLevels = nonRefLevelsByFactor[fi] as string[];
        for (let li = 0; li < nonRefLevels.length; li++) {
          X[enc.columnIndices[li]][ri] = cell === nonRefLevels[li] ? 1 : 0;
        }
      } else {
        // continuous
        const raw = toNumericValue(row[name]) as number;
        const mean = enc.mean as number;
        const centered = raw - mean;
        // Linear column: raw value (not centered — centering handled via mean storage)
        // NOTE: we store the raw value in the linear column and the quadratic
        // as (x - mean)². The solver will use raw for coefficients, but
        // (x-mean)² for the quadratic to reduce multicollinearity.
        X[enc.columnIndices[0]][ri] = raw;

        if (enc.quadraticIndex !== undefined) {
          X[enc.quadraticIndex][ri] = centered * centered;
        }
      }
    }
  }

  // -----------------------------------------------------------------------
  // Pass 3: fill interaction product columns
  // Reads from already-populated main-effect columns.
  // -----------------------------------------------------------------------

  for (let fi = 0; fi < factors.length; fi++) {
    if (factors[fi].type !== 'interaction') continue;

    const intEnc = encodings[fi];
    const encA = encodings.find(e => e.factorName === intEnc.sourceFactors![0])!;
    const encB = encodings.find(e => e.factorName === intEnc.sourceFactors![1])!;

    if (intEnc.interactionType === 'cont×cont') {
      // Centered product: (x - meanX) * (z - meanZ)
      const colA = encA.columnIndices[0];
      const colB = encB.columnIndices[0];
      const meanA = encA.mean as number;
      const meanB = encB.mean as number;
      const intCol = intEnc.columnIndices[0];
      for (let ri = 0; ri < n; ri++) {
        X[intCol][ri] = (X[colA][ri] - meanA) * (X[colB][ri] - meanB);
      }
    } else if (intEnc.interactionType === 'cont×cat') {
      // Determine which encoding is continuous and which is categorical
      const contEnc = encA.type === 'continuous' ? encA : encB;
      const catEnc = encA.type === 'categorical' ? encA : encB;
      const contCol = contEnc.columnIndices[0];
      const contMean = contEnc.mean as number;

      for (let li = 0; li < catEnc.columnIndices.length; li++) {
        const catCol = catEnc.columnIndices[li];
        const intCol = intEnc.columnIndices[li];
        for (let ri = 0; ri < n; ri++) {
          X[intCol][ri] = (X[contCol][ri] - contMean) * X[catCol][ri];
        }
      }
    } else {
      // cat×cat: each pair of dummies
      let intColCount = 0;
      for (let ali = 0; ali < encA.columnIndices.length; ali++) {
        for (let bli = 0; bli < encB.columnIndices.length; bli++) {
          const colA = encA.columnIndices[ali];
          const colB = encB.columnIndices[bli];
          const intCol = intEnc.columnIndices[intColCount++];
          for (let ri = 0; ri < n; ri++) {
            X[intCol][ri] = X[colA][ri] * X[colB][ri];
          }
        }
      }
    }
  }

  return { X, y, n, p, encodings, validIndices };
}
