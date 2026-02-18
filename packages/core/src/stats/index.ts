/**
 * Statistics module — barrel re-export
 *
 * All consumer imports remain unchanged:
 *   import { calculateStats } from '@variscout/core'
 *
 * Internal structure:
 *   basic.ts          — calculateStats, calculateMovingRangeSigma
 *   anova.ts          — calculateAnova, groupDataByFactor, getEtaSquared
 *   regression.ts     — calculateRegression
 *   multiRegression.ts — calculateMultipleRegression
 *   interaction.ts    — getInteractionStrength
 *   modelReduction.ts — suggestTermRemoval
 *   probability.ts    — calculateProbabilityPlotData, normalQuantile
 *   conformance.ts    — calculateConformance
 *   staged.ts         — determineStageOrder, sortDataByStage, calculateStatsByStage, getStageBoundaries
 *   nelson.ts         — getNelsonRule2ViolationPoints, getNelsonRule2Sequences
 *   boxplot.ts        — calculateBoxplotStats, sortBoxplotData
 *   kde.ts            — calculateKDE
 *   distributions.ts  — (internal) fDistributionPValue, tDistributionPValue, etc.
 */

// Re-export types for convenience (matches original stats.ts re-exports)
export type {
  StatsResult,
  ProbabilityPlotPoint,
  ConformanceResult,
  AnovaResult,
  AnovaGroup,
  RegressionResult,
  LinearFit,
  QuadraticFit,
  StagedStatsResult,
  StageBoundary,
  StageOrderMode,
  MultiRegressionOptions,
  MultiRegressionResult,
  CoefficientResult,
  RegressionTerm,
  VIFWarning,
  BoxplotGroupInput,
  BoxplotGroupData,
} from '../types';

// Basic statistics
export { calculateStats, calculateMovingRangeSigma } from './basic';

// ANOVA
export { getEtaSquared, groupDataByFactor, calculateAnova } from './anova';

// Regression (simple)
export { calculateRegression } from './regression';

// Multiple regression (GLM)
export { calculateMultipleRegression } from './multiRegression';

// Interaction strength
export { getInteractionStrength } from './interaction';

// Model reduction
export { suggestTermRemoval } from './modelReduction';

// Probability plots
export { calculateProbabilityPlotData, normalQuantile } from './probability';

// Conformance
export { calculateConformance } from './conformance';

// Staged analysis
export {
  determineStageOrder,
  sortDataByStage,
  calculateStatsByStage,
  getStageBoundaries,
} from './staged';

// Nelson rules
export { getNelsonRule2ViolationPoints, getNelsonRule2Sequences } from './nelson';

// Boxplot statistics
export { calculateBoxplotStats, sortBoxplotData } from './boxplot';

// Kernel density estimation
export { calculateKDE } from './kde';
