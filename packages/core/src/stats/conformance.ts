import type { ConformanceResult } from '../types';

/**
 * Calculate conformance statistics against specification limits
 *
 * @param values - Array of numeric measurement values
 * @param usl - Upper Specification Limit (optional)
 * @param lsl - Lower Specification Limit (optional)
 * @returns ConformanceResult with pass/fail counts and percentages
 *
 * @example
 * const result = calculateConformance([10, 12, 14, 16], 15, 9);
 * // { pass: 3, failUsl: 1, failLsl: 0, total: 4, passRate: 75 }
 */
export function calculateConformance(
  values: number[],
  usl?: number,
  lsl?: number
): ConformanceResult {
  let pass = 0;
  let failUsl = 0;
  let failLsl = 0;

  values.forEach(val => {
    if (usl !== undefined && val > usl) {
      failUsl++;
    } else if (lsl !== undefined && val < lsl) {
      failLsl++;
    } else {
      pass++;
    }
  });

  const total = values.length;
  return {
    pass,
    failUsl,
    failLsl,
    total,
    passRate: total > 0 ? (pass / total) * 100 : 0,
  };
}
