/**
 * Statistics module — barrel re-export
 *
 * All consumer imports remain unchanged:
 *   import { calculateStats } from '@variscout/core'
 *
 * Internal structure:
 *   basic.ts          — calculateStats, calculateMovingRangeSigma
 *   anova.ts          — calculateAnova, groupDataByFactor, getEtaSquared
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
  ProbabilityPlotSeries,
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
export {
  getEtaSquared,
  groupDataByFactor,
  calculateAnova,
  calculateAnovaFromArrays,
} from './anova';

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
export {
  calculateBoxplotStats,
  sortBoxplotData,
  selectBoxplotCategories,
  getMaxBoxplotCategories,
  MIN_BOX_STEP,
} from './boxplot';
export type { BoxplotPriorityCriterion } from './boxplot';

// Anderson-Darling normality test
export { andersonDarlingTest, normalCDF } from './andersonDarling';
export type { AndersonDarlingResult } from './andersonDarling';

// Best subsets regression
export type { BestSubsetResult, BestSubsetsResult, GeneratedQuestion } from './bestSubsets';

// Performance channel ranking questions
export type { ChannelInput } from './channelQuestions';
export { generateChannelRankingQuestions, CPK_EXCELLENT } from './channelQuestions';
export {
  computeBestSubsets,
  computeRSquaredAdjusted,
  getBestSingleFactor,
  generateQuestionsFromRanking,
} from './bestSubsets';

// Factor effects (Factor Intelligence Layers 2-3)
export type {
  LevelEffect,
  FactorMainEffect,
  MainEffectsResult,
  CellMean,
  InteractionResult,
  InteractionEffectsResult,
} from './factorEffects';
export {
  computeMainEffects,
  computeInteractionEffects,
  generateFollowUpQuestions,
} from './factorEffects';

// Kernel density estimation
export { calculateKDE } from './kde';

// Point decimation for chart rendering
export { lttb } from './lttb';

// Finding text generation
export type { FindingTextInput } from './findingText';
export { generateFindingText } from './findingText';

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
