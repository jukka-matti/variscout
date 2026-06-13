/**
 * Variation module — barrel re-export
 *
 * Internal structure:
 *   types.ts          — Type definitions (OptimalFactorResult, ProjectedStats, etc.)
 *   drill.ts          — applyFilters
 *   suggestions.ts    — getNextDrillFactor, findOptimalFactors
 *   simulation.ts     — calculateProjectedStats, simulateDirectAdjustment
 */

// Types
export type {
  OptimalFactorResult,
  CategoryStats,
  ProjectedStats,
  DirectAdjustmentParams,
  DirectAdjustmentResult,
  OverallImpactResult,
  ProcessProjection,
  CenteringOpportunity,
  SpecSuggestion,
} from './types';

// Drill filtering
export { applyFilters } from './drill';

// Factor suggestions
export { getNextDrillFactor, findOptimalFactors, DRILL_SWITCH_THRESHOLD } from './suggestions';

// Simulation
export {
  calculateProjectedStats,
  simulateDirectAdjustment,
  simulateOverallImpact,
  normalCDF,
  normalPDF,
} from './simulation';

// Projection (ProcessHealthBar Phase 2-3)
export {
  computeDrillProjection,
  computeCenteringOpportunity,
  computeSpecSuggestion,
  computeCumulativeProjection,
  computeBenchmarkProjection,
  computeMatchedBestProjection,
} from './projection';
export type { MatchedBestProjection } from './projection';

// Scope-level contribution (IM-5 — What-If projection + descriptive coverage %)
export {
  computeScopeWhatIfProjection,
  computeConditionCoverage,
  computeScopeProblemStats,
} from './scopeContribution';
export type { ScopeProblemStats } from './scopeContribution';

// Direction-aware category coloring
export type { DirectionColor } from './directionColors';
export { computeCategoryDirectionColors } from './directionColors';

// Best subgroup selection (extracted from WhatIfPageBase)
export { findBestSubgroup, findTightestSubgroup } from './bestSubgroup';
