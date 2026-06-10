import type { CharacteristicType } from '../types';
import type { CategoryStats } from './types';

/**
 * Find the best-performing subgroup based on characteristic type.
 * Extracted from WhatIfPageBase for reuse in hypothesis evidence.
 *
 * - smaller-is-better → lowest mean
 * - larger-is-better → highest mean
 * - nominal → closest to target, else closest to the USL/LSL midpoint
 *
 * Returns `undefined` when there is no inferable direction to rank by — a
 * nominal characteristic with neither an explicit target nor both spec limits
 * (the degenerate case). House style: never fabricate a "best" by anchoring on
 * first-encounter / row order, which is direction-blind and can recommend a
 * mean-worsening shift. Callers must suppress mean-anchored guidance in that
 * case (the spread comparison is direction-independent and stays valid).
 *
 * Note: by the time this is called, `characteristicType` has typically been
 * resolved via `inferCharacteristicType` — an inferred-default 'nominal' (no
 * explicit type, no specs) and an explicit 'nominal' with no anchor both yield
 * `undefined` here, since neither carries a direction.
 *
 * @param categories - Array of category statistics (must be non-empty)
 * @param characteristicType - Direction for "best": smaller | larger | nominal
 * @param target - Explicit target value for nominal type
 * @param specs - Spec limits for computing midpoint when no explicit target
 * @returns The category that best meets the criterion, or `undefined` when no
 *   direction is inferable (nominal with no target and no two-sided limits).
 *   Single-element arrays always return the sole element (the fast path fires
 *   before the undefined guard).
 * @throws {Error} If categories array is empty
 */
export function findBestSubgroup(
  categories: CategoryStats[],
  characteristicType: CharacteristicType,
  target?: number,
  specs?: { usl?: number; lsl?: number }
): CategoryStats | undefined {
  if (categories.length === 0) throw new Error('No categories provided');
  if (categories.length === 1) return categories[0];

  if (characteristicType === 'smaller') {
    return categories.reduce((best, cat) => (cat.mean < best.mean ? cat : best));
  }

  if (characteristicType === 'larger') {
    return categories.reduce((best, cat) => (cat.mean > best.mean ? cat : best));
  }

  // Nominal: closest to target → spec midpoint. With neither an explicit target
  // nor a two-sided midpoint there is no anchor and therefore no direction —
  // return undefined rather than fabricating one from row order.
  const tgt =
    target ??
    (specs?.usl !== undefined && specs?.lsl !== undefined
      ? (specs.usl + specs.lsl) / 2
      : undefined);

  if (tgt === undefined) return undefined;

  return categories.reduce((best, cat) =>
    Math.abs(cat.mean - tgt) < Math.abs(best.mean - tgt) ? cat : best
  );
}

/**
 * Find the subgroup with tightest spread (lowest σ).
 * Used for the "match tightest spread" preset in What-If analysis.
 *
 * @param categories - Array of category statistics (must be non-empty)
 * @returns The category with lowest standard deviation
 * @throws {Error} If categories array is empty
 */
export function findTightestSubgroup(categories: CategoryStats[]): CategoryStats {
  if (categories.length === 0) throw new Error('No categories provided');
  return categories.reduce((best, cat) => (cat.stdDev < best.stdDev ? cat : best));
}
