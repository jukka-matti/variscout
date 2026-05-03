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
  PredictorType,
  PredictorInfo,
  TypeIIIResult,
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
  toVerificationData,
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
export type {
  BestSubsetResult,
  BestSubsetsResult,
  GeneratedQuestion,
  LevelChange,
  ModelPrediction,
  CoverageResult,
} from './bestSubsets';

// Performance channel ranking questions
export type { ChannelInput } from './channelQuestions';
export { generateChannelRankingQuestions, CPK_EXCELLENT } from './channelQuestions';
export {
  computeBestSubsets,
  computeRSquaredAdjusted,
  getBestSingleFactor,
  generateQuestionsFromRanking,
  predictFromModel,
  predictFromUnifiedModel,
  computeCoverage,
} from './bestSubsets';

// Type III SS decomposition
export { computeTypeIIISS } from './typeIIISS';

// Factor type detection
export type { FactorTypeClassification } from './factorTypeDetection';
export { classifyFactorType, classifyAllFactors } from './factorTypeDetection';

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

// Interaction screening (Pass 2 of best subsets)
export type { InteractionScreenResult } from './interactionScreening';
export {
  screenInteractionPair,
  classifyInteractionPattern,
  assignPlotAxes,
} from './interactionScreening';

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

// Causal graph (Evidence Map DAG)
// Note: CausalLink is exported from '@variscout/core/findings' (canonical source)
export type { RelationshipType } from './causalGraph';
export { classifyRelationship, wouldCreateCycle, findConvergencePoints } from './causalGraph';

// Evidence Map layout
export type {
  FactorNodeLayout,
  RelationshipEdgeLayout,
  EvidenceMapLayout,
} from './evidenceMapLayout';
export { computeEvidenceMapLayout } from './evidenceMapLayout';

// OLS regression (QR-based solver)
export type { OLSSolution, QuadraticTestResult } from './olsRegression';
export { solveOLS, CONDITION_NUMBER_WARNING, shouldIncludeQuadratic } from './olsRegression';

// Design matrix construction
export type { DesignMatrixResult, FactorEncoding, FactorSpec } from './designMatrix';
export { buildDesignMatrix } from './designMatrix';

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

// Boundary 2: numeric safety utilities (ADR-069)
export { finiteOrUndefined, safeDivide, computeOptimum } from './safeMath';

// UI relationship type mapping (5 engine types → 3 user-facing types)
export type { UIRelationshipType, UIRelationshipInfo } from './relationshipTypeMapping';
export { mapRelationshipType } from './relationshipTypeMapping';

// Production-line glance engine — node capability, spec lookup, sample confidence,
// migration helpers (Plan A: engine layer for canonical-map dashboard)
export { calculateNodeCapability } from './nodeCapability';
export type { NodeCapabilityResult, CalculateNodeCapabilitySource } from './nodeCapability';
export { lookupSpecRule, ruleMatches, ruleSpecificity } from './specRuleLookup';
export { sampleConfidenceFor, SAMPLE_CONFIDENCE_THRESHOLDS } from './sampleConfidence';
export type { SampleConfidence } from './sampleConfidence';
export { isLegacyInvestigation, suggestNodeMappings } from './nodeCapabilityMigration';
export { distinctContextValues } from './contextValueOptions';
export { rollupStepErrors } from './stepErrorAggregation';
export type { StepErrorRollupInput, StepErrorRollupResult } from './stepErrorAggregation';

// Time lens — global observation-set filter (consumed by chart hooks + page stats)
export type { TimeLens, TimeLensMode } from './timeLens';
export { DEFAULT_TIME_LENS } from './timeLens';
