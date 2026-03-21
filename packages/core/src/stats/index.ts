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
 *   nelson.ts         — getNelsonRule2ViolationPoints, getNelsonRule2Sequences, getNelsonRule3ViolationPoints, getNelsonRule3Sequences
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
  StagedStatsResult,
  StageBoundary,
  StageOrderMode,
  BoxplotGroupInput,
  BoxplotGroupData,
} from '../types';

// Basic statistics
export { calculateStats, calculateMovingRangeSigma } from './basic';

// ANOVA
export { getEtaSquared, groupDataByFactor, calculateAnova } from './anova';

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
  calculateStagedComparison,
} from './staged';

export type {
  StagedComparison,
  StagedComparisonStage,
  StagedComparisonDeltas,
  DeltaColor,
} from './staged';

// Nelson rules
export {
  getNelsonRule2ViolationPoints,
  getNelsonRule2Sequences,
  getNelsonRule3ViolationPoints,
  getNelsonRule3Sequences,
} from './nelson';

// Boxplot statistics
export { calculateBoxplotStats, sortBoxplotData } from './boxplot';

// Kernel density estimation
export { calculateKDE } from './kde';

// Evidence interpretation
export type { EvidenceLevel, EvidenceInterpretation } from './evidence';
export { interpretEvidence, generateAnovaInsightLine } from './evidence';

// Subgroup capability analysis
export type {
  SubgroupMethod,
  SubgroupConfig,
  SubgroupCapabilityResult,
  SubgroupData,
  CapabilitySeriesLimits,
  StandardIChartMetric,
} from './subgroupCapability';
export {
  groupDataIntoSubgroups,
  calculateSubgroupCapability,
  calculateSeriesControlLimits,
} from './subgroupCapability';
