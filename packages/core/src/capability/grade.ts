/**
 * Per-characteristic Cpk grading.
 *
 * Single source of truth for capability colors / status across every banding
 * surface in the product (ProcessHealthBar, Report KPI grids, process
 * moments, charts). Replaces the inline `statusForCpk`, `getCpkColor`, and
 * `cpkColor` copies that previously diverged.
 */

export type CpkGrade = 'green' | 'amber' | 'red';

/**
 * Grade Cpk relative to a user-set target.
 *
 *   green:  cpk >= target          (meets the bar)
 *   amber:  cpk >= target * 0.75   (within 75% of bar)
 *   red:    cpk <  target * 0.75   (well below bar)
 *
 * Why `target * 0.75` (not absolute `1.0`): the user-set target IS the
 * "what does capable mean for this characteristic" abstraction. Hardcoding
 * 1.0 reintroduces literature absolutes the target is supposed to replace
 * and breaks for industries whose target is far from 1.33 (e.g. Class III
 * medical = 2.0+, where amber would otherwise span an enormous range).
 */
export function gradeCpk(cpk: number, target: number): CpkGrade {
  if (cpk >= target) return 'green';
  if (cpk >= target * 0.75) return 'amber';
  return 'red';
}
