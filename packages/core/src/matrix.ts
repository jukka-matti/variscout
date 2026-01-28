/**
 * Matrix utilities for Ordinary Least Squares (OLS) regression
 *
 * These functions support the multiple regression implementation
 * using the Normal Equations: β̂ = (X'X)⁻¹X'Y
 */

/**
 * A 2D matrix represented as an array of rows
 */
export type Matrix = number[][];

/**
 * Transpose a matrix: A' where A'[i][j] = A[j][i]
 *
 * @param A - Input matrix (m × n)
 * @returns Transposed matrix (n × m)
 *
 * @example
 * transpose([[1, 2], [3, 4], [5, 6]]);
 * // Returns [[1, 3, 5], [2, 4, 6]]
 */
export function transpose(A: Matrix): Matrix {
  if (A.length === 0) return [];
  if (A[0].length === 0) return [];

  const rows = A.length;
  const cols = A[0].length;
  const result: Matrix = [];

  for (let j = 0; j < cols; j++) {
    result[j] = [];
    for (let i = 0; i < rows; i++) {
      result[j][i] = A[i][j];
    }
  }

  return result;
}

/**
 * Multiply two matrices: C = AB where C[i][j] = Σ A[i][k] × B[k][j]
 *
 * @param A - First matrix (m × n)
 * @param B - Second matrix (n × p)
 * @returns Product matrix (m × p), or null if dimensions don't match
 *
 * @example
 * multiply([[1, 2], [3, 4]], [[5, 6], [7, 8]]);
 * // Returns [[19, 22], [43, 50]]
 */
export function multiply(A: Matrix, B: Matrix): Matrix | null {
  if (A.length === 0 || B.length === 0) return null;

  const aRows = A.length;
  const aCols = A[0].length;
  const bRows = B.length;
  const bCols = B[0].length;

  // Dimensions must be compatible: A is m×n, B is n×p
  if (aCols !== bRows) return null;

  const result: Matrix = [];

  for (let i = 0; i < aRows; i++) {
    result[i] = [];
    for (let j = 0; j < bCols; j++) {
      let sum = 0;
      for (let k = 0; k < aCols; k++) {
        sum += A[i][k] * B[k][j];
      }
      result[i][j] = sum;
    }
  }

  return result;
}

/**
 * Multiply a matrix by a column vector: result = A × b
 *
 * @param A - Matrix (m × n)
 * @param b - Column vector (length n)
 * @returns Result vector (length m), or null if dimensions don't match
 */
export function multiplyVector(A: Matrix, b: number[]): number[] | null {
  if (A.length === 0 || b.length === 0) return null;

  const rows = A.length;
  const cols = A[0].length;

  if (cols !== b.length) return null;

  const result: number[] = [];

  for (let i = 0; i < rows; i++) {
    let sum = 0;
    for (let j = 0; j < cols; j++) {
      sum += A[i][j] * b[j];
    }
    result[i] = sum;
  }

  return result;
}

/**
 * Compute the inverse of a square matrix using Gaussian elimination
 * with partial pivoting for numerical stability.
 *
 * @param A - Square matrix (n × n)
 * @returns Inverse matrix, or null if matrix is singular (det ≈ 0)
 *
 * @example
 * inverse([[4, 7], [2, 6]]);
 * // Returns [[0.6, -0.7], [-0.2, 0.4]]
 */
export function inverse(A: Matrix): Matrix | null {
  const n = A.length;
  if (n === 0) return null;

  // Must be square
  if (A.some(row => row.length !== n)) return null;

  // Create augmented matrix [A | I]
  const augmented: Matrix = A.map((row, i) => {
    const identity = new Array(n).fill(0);
    identity[i] = 1;
    return [...row, ...identity];
  });

  // Forward elimination with partial pivoting
  for (let col = 0; col < n; col++) {
    // Find pivot (largest absolute value in column)
    let maxRow = col;
    let maxVal = Math.abs(augmented[col][col]);

    for (let row = col + 1; row < n; row++) {
      const absVal = Math.abs(augmented[row][col]);
      if (absVal > maxVal) {
        maxVal = absVal;
        maxRow = row;
      }
    }

    // Check for singularity
    if (maxVal < 1e-12) {
      return null; // Matrix is singular
    }

    // Swap rows if needed
    if (maxRow !== col) {
      [augmented[col], augmented[maxRow]] = [augmented[maxRow], augmented[col]];
    }

    // Scale pivot row
    const pivot = augmented[col][col];
    for (let j = 0; j < 2 * n; j++) {
      augmented[col][j] /= pivot;
    }

    // Eliminate column entries above and below pivot
    for (let row = 0; row < n; row++) {
      if (row !== col) {
        const factor = augmented[row][col];
        for (let j = 0; j < 2 * n; j++) {
          augmented[row][j] -= factor * augmented[col][j];
        }
      }
    }
  }

  // Extract inverse (right half of augmented matrix)
  return augmented.map(row => row.slice(n));
}

/**
 * Solve a system of linear equations Ax = b using matrix inverse
 *
 * @param A - Coefficient matrix (n × n)
 * @param b - Right-hand side vector (length n)
 * @returns Solution vector x, or null if system cannot be solved
 *
 * @example
 * // Solve: 2x + y = 5, x + 3y = 5
 * solve([[2, 1], [1, 3]], [5, 5]);
 * // Returns [2, 1]
 */
export function solve(A: Matrix, b: number[]): number[] | null {
  const n = A.length;
  if (n === 0 || b.length !== n) return null;

  const Ainv = inverse(A);
  if (!Ainv) return null;

  return multiplyVector(Ainv, b);
}

/**
 * Create an identity matrix of size n × n
 *
 * @param n - Size of the matrix
 * @returns Identity matrix
 */
export function identity(n: number): Matrix {
  const result: Matrix = [];
  for (let i = 0; i < n; i++) {
    result[i] = new Array(n).fill(0);
    result[i][i] = 1;
  }
  return result;
}

/**
 * Calculate the diagonal elements of a matrix
 *
 * @param A - Square matrix
 * @returns Array of diagonal elements
 */
export function diagonal(A: Matrix): number[] {
  const n = Math.min(A.length, A[0]?.length ?? 0);
  const result: number[] = [];
  for (let i = 0; i < n; i++) {
    result[i] = A[i][i];
  }
  return result;
}

/**
 * Calculate the trace (sum of diagonal elements) of a matrix
 *
 * @param A - Square matrix
 * @returns Sum of diagonal elements
 */
export function trace(A: Matrix): number {
  return diagonal(A).reduce((sum, val) => sum + val, 0);
}

/**
 * Build the design matrix X for multiple regression
 * Includes column of 1s for intercept
 *
 * @param data - Array of data rows
 * @param columns - Column names to include as predictors
 * @returns Design matrix (n × (p+1)) where p is number of predictors
 */
export function buildDesignMatrix<T extends Record<string, unknown>>(
  data: T[],
  columns: string[]
): { X: Matrix; validRows: number[] } {
  const X: Matrix = [];
  const validRows: number[] = [];

  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    const values: number[] = [1]; // Intercept term
    let valid = true;

    for (const col of columns) {
      const val = Number(row[col]);
      if (isNaN(val) || !isFinite(val)) {
        valid = false;
        break;
      }
      values.push(val);
    }

    if (valid) {
      X.push(values);
      validRows.push(i);
    }
  }

  return { X, validRows };
}

/**
 * Extract response vector Y from data
 *
 * @param data - Array of data rows
 * @param yColumn - Column name for response variable
 * @param validRows - Indices of valid rows to include
 * @returns Response vector
 */
export function extractResponseVector<T extends Record<string, unknown>>(
  data: T[],
  yColumn: string,
  validRows: number[]
): number[] {
  return validRows.map(i => Number(data[i][yColumn]));
}
