/**
 * Variation module — barrel re-export
 *
 * All consumer imports remain unchanged:
 *   import { calculateDrillVariation } from '@variscout/core'
 *
 * Internal structure:
 *   types.ts          — Type definitions (DrillVariationResult, ProjectedStats, etc.)
 *   drill.ts          — calculateDrillVariation, applyFilters
 *   contributions.ts  — calculateCategoryTotalSS, getCategoryStats
 *   suggestions.ts    — calculateFactorVariations, getMaxCategoryContribution, findOptimalFactors
 *   simulation.ts     — calculateProjectedStats, simulateDirectAdjustment
 */

// Types
export type {
  DrillVariationResult,
  DrillLevelVariation,
  OptimalFactorResult,
  CategoryTotalSSResult,
  CategoryStats,
  ProjectedStats,
  DirectAdjustmentParams,
  DirectAdjustmentResult,
  OverallImpactResult,
} from './types';

// Drill variation
export { calculateDrillVariation, applyFilters } from './drill';

// Category contributions
export { calculateCategoryTotalSS, getCategoryStats } from './contributions';

// Factor suggestions
export {
  getMaxCategoryContribution,
  calculateFactorVariations,
  shouldHighlightDrill,
  getNextDrillFactor,
  findOptimalFactors,
  DRILL_SWITCH_THRESHOLD,
} from './suggestions';

// Simulation
export {
  calculateProjectedStats,
  simulateDirectAdjustment,
  simulateOverallImpact,
  normalCDF,
  normalPDF,
} from './simulation';

// Direction-aware category coloring
export type { DirectionColor } from './directionColors';
export { computeCategoryDirectionColors } from './directionColors';
