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

/**
 * Detect Nelson Rule 3 violations: 6+ consecutive strictly increasing or decreasing points
 *
 * Returns the indices of all points that are part of a trend of 6 or more
 * consecutive strictly monotone values. Equal values break the trend.
 *
 * @param values - Array of numeric measurement values
 * @returns Set of indices that are part of a Nelson Rule 3 violation
 *
 * @example
 * const violations = getNelsonRule3ViolationPoints([1, 2, 3, 4, 5, 6]);
 * // Returns Set containing indices 0-5 (6 consecutive increasing)
 */
export function getNelsonRule3ViolationPoints(values: number[]): Set<number> {
  const violations = new Set<number>();

  if (values.length < 6) return violations;

  let runStart = 0;
  let runDirection: 'increasing' | 'decreasing' | null = null;

  for (let i = 1; i < values.length; i++) {
    const currentDirection: 'increasing' | 'decreasing' | null =
      values[i] > values[i - 1] ? 'increasing' : values[i] < values[i - 1] ? 'decreasing' : null;

    if (currentDirection === null || currentDirection !== runDirection) {
      // Check if previous run was long enough (6+ points = 5+ transitions)
      if (runDirection !== null && i - runStart >= 6) {
        for (let j = runStart; j < i; j++) {
          violations.add(j);
        }
      }
      // Start new run from previous point (the transition starts at i-1)
      runStart = i - 1;
      runDirection = currentDirection;
    }
  }

  // Check final run
  if (runDirection !== null && values.length - runStart >= 6) {
    for (let j = runStart; j < values.length; j++) {
      violations.add(j);
    }
  }

  return violations;
}

/**
 * Get Nelson Rule 3 sequences (6+ consecutive strictly increasing or decreasing points)
 * Returns array of sequences with start/end indices and direction information
 *
 * @param values - Array of numeric values
 * @returns Array of NelsonRule3Sequence objects representing violation sequences
 *
 * @example
 * const sequences = getNelsonRule3Sequences([1, 2, 3, 4, 5, 6, 7]);
 * // Returns: [{ startIndex: 0, endIndex: 6, direction: 'increasing' }]
 */
export function getNelsonRule3Sequences(
  values: number[]
): Array<{ startIndex: number; endIndex: number; direction: 'increasing' | 'decreasing' }> {
  const sequences: Array<{
    startIndex: number;
    endIndex: number;
    direction: 'increasing' | 'decreasing';
  }> = [];

  if (values.length < 6) return sequences;

  let runStart = 0;
  let runDirection: 'increasing' | 'decreasing' | null = null;

  for (let i = 1; i < values.length; i++) {
    const currentDirection: 'increasing' | 'decreasing' | null =
      values[i] > values[i - 1] ? 'increasing' : values[i] < values[i - 1] ? 'decreasing' : null;

    if (currentDirection === null || currentDirection !== runDirection) {
      // Check if previous run was long enough
      if (runDirection !== null && i - runStart >= 6) {
        sequences.push({
          startIndex: runStart,
          endIndex: i - 1,
          direction: runDirection,
        });
      }
      runStart = i - 1;
      runDirection = currentDirection;
    }
  }

  // Check final run
  if (runDirection !== null && values.length - runStart >= 6) {
    sequences.push({
      startIndex: runStart,
      endIndex: values.length - 1,
      direction: runDirection,
    });
  }

  return sequences;
}
