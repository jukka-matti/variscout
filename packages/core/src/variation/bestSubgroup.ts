import type { CharacteristicType } from '../types';
import type { CategoryStats } from './types';

/**
 * Find the best-performing subgroup based on characteristic type.
 * Extracted from WhatIfPageBase for reuse in suspected cause evidence.
 *
 * - smaller-is-better → lowest mean
 * - larger-is-better → highest mean
 * - nominal → closest to target, then spec midpoint, then first category mean
 *
 * @param categories - Array of category statistics (must be non-empty)
 * @param characteristicType - Direction for "best": smaller | larger | nominal
 * @param target - Explicit target value for nominal type
 * @param specs - Spec limits for computing midpoint when no explicit target
 * @returns The category that best meets the criterion
 * @throws {Error} If categories array is empty
 */
export function findBestSubgroup(
  categories: CategoryStats[],
  characteristicType: CharacteristicType,
  target?: number,
  specs?: { usl?: number; lsl?: number }
): CategoryStats {
  if (categories.length === 0) throw new Error('No categories provided');
  if (categories.length === 1) return categories[0];

  if (characteristicType === 'smaller') {
    return categories.reduce((best, cat) => (cat.mean < best.mean ? cat : best));
  }

  if (characteristicType === 'larger') {
    return categories.reduce((best, cat) => (cat.mean > best.mean ? cat : best));
  }

  // Nominal: closest to target → spec midpoint → first category mean
  const tgt =
    target ??
    (specs?.usl !== undefined && specs?.lsl !== undefined
      ? (specs.usl + specs.lsl) / 2
      : categories[0].mean);

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
