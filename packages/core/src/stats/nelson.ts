/**
 * Detect Nelson Rule 2 violations: 9+ consecutive points on same side of center line
 *
 * Returns the indices of all points that are part of a run of 9 or more
 * consecutive points above or below the mean (center line).
 *
 * @param values - Array of numeric measurement values
 * @param mean - The center line value (typically the process mean)
 * @returns Set of indices that are part of a Nelson Rule 2 violation
 *
 * @example
 * const violations = getNelsonRule2ViolationPoints([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 0);
 * // Returns Set containing indices 0-9 (all above mean of 0)
 */
export function getNelsonRule2ViolationPoints(values: number[], mean: number): Set<number> {
  const violations = new Set<number>();

  if (values.length < 9) return violations;

  // Track current run
  let runStart = 0;
  let runSide: 'above' | 'below' | null = null;

  for (let i = 0; i < values.length; i++) {
    const value = values[i];
    const currentSide: 'above' | 'below' | null =
      value > mean ? 'above' : value < mean ? 'below' : null;

    // Points exactly on the mean break the run
    if (currentSide === null || currentSide !== runSide) {
      // Check if previous run was long enough (9+)
      if (runSide !== null && i - runStart >= 9) {
        for (let j = runStart; j < i; j++) {
          violations.add(j);
        }
      }
      // Start new run
      runStart = i;
      runSide = currentSide;
    }
  }

  // Check final run
  if (runSide !== null && values.length - runStart >= 9) {
    for (let j = runStart; j < values.length; j++) {
      violations.add(j);
    }
  }

  return violations;
}

/**
 * Get Nelson Rule 2 sequences (9+ consecutive points on same side of mean)
 * Returns array of sequences with start/end indices and side information
 *
 * @param values - Array of numeric values
 * @param mean - Mean value to test against
 * @returns Array of NelsonRule2Sequence objects representing violation sequences
 *
 * @example
 * const sequences = getNelsonRule2Sequences([10, 11, 12, 13, 14, 15, 16, 17, 18], 5);
 * // Returns: [{ startIndex: 0, endIndex: 8, side: 'above' }]
 */
export function getNelsonRule2Sequences(
  values: number[],
  mean: number
): Array<{ startIndex: number; endIndex: number; side: 'above' | 'below' }> {
  const sequences: Array<{ startIndex: number; endIndex: number; side: 'above' | 'below' }> = [];

  if (values.length < 9) return sequences;

  // Track current run
  let runStart = 0;
  let runSide: 'above' | 'below' | null = null;

  for (let i = 0; i < values.length; i++) {
    const value = values[i];
    const currentSide: 'above' | 'below' | null =
      value > mean ? 'above' : value < mean ? 'below' : null;

    // Points exactly on the mean break the run
    if (currentSide === null || currentSide !== runSide) {
      // Check if previous run was long enough (9+)
      if (runSide !== null && i - runStart >= 9) {
        sequences.push({
          startIndex: runStart,
          endIndex: i - 1,
          side: runSide,
        });
      }
      // Start new run
      runStart = i;
      runSide = currentSide;
    }
  }

  // Check final run
  if (runSide !== null && values.length - runStart >= 9) {
    sequences.push({
      startIndex: runStart,
      endIndex: values.length - 1,
      side: runSide,
    });
  }

  return sequences;
}
