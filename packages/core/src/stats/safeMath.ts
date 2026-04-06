/**
 * Boundary 2 utilities: guarantee stats engine outputs are finite.
 *
 * Applied at the OUTPUT boundary of stats functions — not inside every
 * arithmetic expression. This is the safety net that catches everything,
 * regardless of how NaN was produced.
 *
 * See ADR-069 for the three-boundary numeric safety architecture.
 */

/** Converts any non-finite number to undefined. Apply at stats function return boundaries. */
export function finiteOrUndefined(n: number): number | undefined {
  return Number.isFinite(n) ? n : undefined;
}

/** Safe division returning undefined for non-finite results, zero/near-zero denominators. */
export function safeDivide(
  numerator: number,
  denominator: number,
  minDenom: number = 1e-15
): number | undefined {
  if (!Number.isFinite(numerator) || !Number.isFinite(denominator)) return undefined;
  if (Math.abs(denominator) < minDenom) return undefined;
  const result = numerator / denominator;
  return Number.isFinite(result) ? result : undefined;
}

/**
 * Compute optimum (sweet spot) from centered quadratic vertex: x* = x̄ - b₁/(2·b₂)
 * Single source of truth — used by evidenceMapLayout and buildAIContext.
 */
export function computeOptimum(
  linearCoefficient: number,
  quadCoefficient: number,
  quadMean: number
): number | undefined {
  const vertex = safeDivide(linearCoefficient, 2 * quadCoefficient);
  if (vertex === undefined) return undefined;
  const result = quadMean - vertex;
  return Number.isFinite(result) ? result : undefined;
}
