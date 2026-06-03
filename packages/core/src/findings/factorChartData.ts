/**
 * Pure data derivation for the per-factor stat triad's inline mini-charts
 * (PR-CS-9, spec §4.0 "sees the actual chart"). No UI imports — pure TS.
 *
 * Reuses the existing OLS engine (`getBestSingleFactor` → `predictFromUnifiedModel`)
 * for the fitted line — NO new stats math. A factor with zero x-variance yields no
 * fitted line (the engine has nothing to fit).
 *
 * Deterministic: no Date.now / Math.random / argless new Date.
 */

import type { DataRow } from '../types';
import { toNumericValue } from '../types';
import { getBestSingleFactor, predictFromUnifiedModel } from '../stats/bestSubsets';

/** Scatter + regression mini-chart data for a continuous factor. */
export interface ScatterFitData {
  /** Raw (x = factor, y = outcome) pairs with finite values. */
  points: Array<{ x: number; y: number }>;
  /** The OLS fitted line as two endpoints [minX, maxX], or null when not fittable. */
  fittedLine: Array<{ x: number; y: number }> | null;
  /** Whether the single-factor regression is significant (drives the line colour). */
  isSignificant: boolean;
}

/**
 * Scatter points + an OLS fitted line for `factor` against `outcome`. The fitted
 * line is the model's prediction at the x-range endpoints (a straight segment for
 * a linear single-factor model). Returns `fittedLine: null` (and `isSignificant:
 * false`) when the factor has no usable x-variance or the engine declines to fit.
 */
export function deriveScatterFitData(
  rows: ReadonlyArray<DataRow>,
  factor: string,
  outcome: string
): ScatterFitData {
  const points: Array<{ x: number; y: number }> = [];
  for (const row of rows) {
    const x = toNumericValue(row[factor]);
    const y = toNumericValue(row[outcome]);
    if (x !== undefined && y !== undefined) points.push({ x, y });
  }

  let fittedLine: Array<{ x: number; y: number }> | null = null;
  let isSignificant = false;

  if (points.length >= 2) {
    let minX = points[0].x;
    let maxX = points[0].x;
    for (const p of points) {
      if (p.x < minX) minX = p.x;
      if (p.x > maxX) maxX = p.x;
    }
    // Zero x-variance → nothing to fit (the negative control).
    if (maxX > minX) {
      const subset = getBestSingleFactor([...rows], outcome, [factor]);
      if (subset && subset.intercept !== undefined && (subset.predictors?.length ?? 0) > 0) {
        const y0 = predictFromUnifiedModel(subset, { [factor]: minX });
        const y1 = predictFromUnifiedModel(subset, { [factor]: maxX });
        if (y0 !== null && y1 !== null && Number.isFinite(y0) && Number.isFinite(y1)) {
          fittedLine = [
            { x: minX, y: y0 },
            { x: maxX, y: y1 },
          ];
          isSignificant = subset.isSignificant;
        }
      }
    }
  }

  return { points, fittedLine, isSignificant };
}

/**
 * Outcome values grouped by the factor's levels — the `MiniBoxplot` group shape.
 * Skips rows with a null/undefined category or a non-numeric outcome. Sorted by
 * category for a stable render.
 */
export function groupOutcomeByFactor(
  rows: ReadonlyArray<DataRow>,
  factor: string,
  outcome: string
): Array<{ category: string; values: number[] }> {
  const map = new Map<string, number[]>();
  for (const row of rows) {
    const cat = row[factor];
    const y = toNumericValue(row[outcome]);
    if (cat === null || cat === undefined || y === undefined) continue;
    const key = String(cat);
    const arr = map.get(key);
    if (arr) arr.push(y);
    else map.set(key, [y]);
  }
  return Array.from(map.entries())
    .map(([category, values]) => ({ category, values }))
    .sort((a, b) => a.category.localeCompare(b.category));
}
