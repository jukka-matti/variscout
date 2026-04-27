/**
 * @variscout/core
 * Core statistics and utility functions for VariScout
 */

// Types - Data Row (foundation for type-safe data handling)
export type { DataCellValue, DataRow } from './types';
export { isNumericValue, isStringValue, toNumericValue, inferCharacteristicType } from './types';

// Types - Statistics and Analysis
export type {
  StatsResult,
  SpecLimits,
  CharacteristicType,
  ProbabilityPlotPoint,
  ProbabilityPlotSeries,
  ConformanceResult,
  AnovaResult,
  AnovaGroup,
  StageOrderMode,
  AnalysisMode,
  StagedStatsResult,
  StageBoundary,
  NelsonRule2Sequence,
} from './types';

// Canonical UI presentation types (single source of truth)
export type {
  ScaleMode,
  HighlightColor,
  DisplayOptions,
  ChartTitles,
  ParetoMode,
  ParetoAggregation,
  ViewState,
  AxisSettings,
} from './ui-types/index';

// Canonical Evidence Map data types (single source of truth)
export type {
  FactorNodeData,
  RelationshipEdgeData,
  OutcomeNodeData,
  EquationData,
  CausalEdgeData,
  ConvergencePointData,
} from './evidenceMap/index';

// Types - Staged Comparison
export type {
  StagedComparison,
  StagedComparisonStage,
  StagedComparisonDeltas,
  DeltaColor,
} from './stats';

// Types - Evidence Interpretation
export type { EvidenceLevel, EvidenceInterpretation } from './stats';

// (continued types)
export type {
  NelsonRule3Sequence,
  // Boxplot Types
  BoxplotGroupInput,
  BoxplotGroupData,
  BoxplotSortBy,
  BoxplotSortDirection,
  // Performance Module Types
  ChannelHealth,
  ChannelInfo,
  ChannelResult,
  PerformanceSummary,
  ChannelPerformanceData,
  WideFormatDetection,
  // Chart Data Point Types
  IChartDataPoint,
  ParetoDataPoint,
  // Complement Insight (Target Discovery)
  ComplementInsight,
} from './types';

// Statistics
export {
  calculateStats,
  calculateMovingRangeSigma,
  getEtaSquared,
  calculateProbabilityPlotData,
  normalQuantile,
  calculateConformance,
  groupDataByFactor,
  calculateAnova,
  calculateAnovaFromArrays,
  // Staged stats functions
  determineStageOrder,
  sortDataByStage,
  calculateStatsByStage,
  getStageBoundaries,
  calculateStagedComparison,
  // Nelson rules
  getNelsonRule2ViolationPoints,
  getNelsonRule2Sequences,
  getNelsonRule3ViolationPoints,
  getNelsonRule3Sequences,
  // Boxplot statistics
  calculateBoxplotStats,
  sortBoxplotData,
  selectBoxplotCategories,
  getMaxBoxplotCategories,
  MIN_BOX_STEP,
  type BoxplotPriorityCriterion,
  // Kernel density estimation (for violin plots)
  calculateKDE,
  // Best subsets regression
  computeBestSubsets,
  computeRSquaredAdjusted,
  getBestSingleFactor,
  generateQuestionsFromRanking,
  predictFromModel,
  computeCoverage,
  // Point decimation for chart rendering
  lttb,
  // Evidence interpretation
  interpretEvidence,
  generateAnovaInsightLine,
  // Subgroup capability analysis
  groupDataIntoSubgroups,
  calculateSubgroupCapability,
  calculateSeriesControlLimits,
  // Factor Intelligence (Layers 2-3)
  computeMainEffects,
  computeInteractionEffects,
  generateFollowUpQuestions,
  // Finding text generation
  generateFindingText,
} from './stats';

// Finding text generation types
export type { FindingTextInput } from './stats';

// Subgroup capability types
export type {
  SubgroupMethod,
  SubgroupConfig,
  SubgroupCapabilityResult,
  SubgroupData,
  CapabilitySeriesLimits,
  StandardIChartMetric,
} from './stats';

// Best subsets regression types
export type {
  BestSubsetResult,
  BestSubsetsResult,
  GeneratedQuestion,
  LevelChange,
  ModelPrediction,
  CoverageResult,
} from './stats';

// Factor effects types (Factor Intelligence Layers 2-3)
export type {
  LevelEffect,
  FactorMainEffect,
  MainEffectsResult,
  CellMean,
  InteractionResult,
  InteractionEffectsResult,
} from './stats';

// Tier (Azure Marketplace multi-tier licensing) — primary module
export type { LicenseTier, TierLimits, ChannelLimitResult, MarketplacePlan } from './tier';
export {
  CHANNEL_WARNING_THRESHOLD,
  configureTier,
  getTier,
  isPaidTier,
  getMaxChannels,
  getTierLimits,
  isChannelLimitExceeded,
  shouldShowChannelWarning,
  validateChannelCount,
  getTierDescription,
  getUpgradeUrl,
  // Branding helpers (canonical source)
  BRANDING_COLORS,
  shouldShowBranding,
  getBrandingText,
  getSignatureText,
  // Marketplace plan helpers
  DEFAULT_PLAN,
  configurePlan,
  getPlan,
  hasTeamFeatures,
  hasKnowledgeBase,
  isTeamPlan,
} from './tier';

// Process Hub review signals
export { buildHubReviewSignal } from './processReviewSignal';
export type {
  BuildHubReviewSignalInput,
  HubReviewCapability,
  HubReviewChangeSignals,
  HubReviewSignal,
  HubReviewTopFocus,
} from './processReviewSignal';

// Signal Cards
export {
  buildBranchSignalWarnings,
  buildSignalMeasurementNextMoves,
  matchSignalCard,
  signalTrustLabel,
  signalTrustStatus,
  signalWeakLink,
} from './signalCards';
export type {
  BranchSignalWarning,
  MeasurementStudyStatus,
  SignalCard,
  SignalMeasurementNextMove,
  SignalPowerStatus,
  SignalRole,
  SignalSourceArchetype,
  SignalTrustGrade,
} from './signalCards';

// Process Moments
export {
  buildProcessMomentFindingClue,
  computeProcessMoments,
  summarizeComparableProcessMoments,
} from './processMoments';
export type {
  ComparableProcessMomentSummary,
  ProcessMomentBoundary,
  ProcessMomentDefinition,
  ProcessMomentFindingClue,
  ProcessMomentInsufficientReason,
  ProcessMomentResult,
  ProcessMomentStatus,
} from './processMoments';

// Evidence Sources / Data Profiles / Snapshots
export {
  AGENT_REVIEW_LOG_PROFILE,
  DATA_PROFILE_REGISTRY,
  detectDataProfiles,
  processHubEvidenceBlobPath,
  processHubEvidenceSnapshotsCatalogPath,
  processHubEvidenceSourceBlobPath,
  processHubEvidenceSourcesCatalogPath,
  validateEvidenceSourceSnapshot,
} from './evidenceSources';
export type {
  DataProfileConfidence,
  DataProfileDefinition,
  DataProfileDetection,
  EvidenceCadence,
  EvidenceLatestSignal,
  EvidenceSignalSeverity,
  EvidenceSnapshot,
  EvidenceSource,
  EvidenceValidationResult,
  ProfileApplication,
} from './evidenceSources';

// Preview feature registry
export type { PreviewFeature } from './preview';
export { isPreviewEnabled, setPreviewEnabled } from './preview';

// Export utilities
export {
  getSpecStatus,
  generateCSV,
  downloadCSV,
  generateFindingsCSV,
  generateFindingsJSON,
  downloadFindingsCSV,
  downloadFindingsJSON,
} from './export';
export type { ExportOptions } from './export';

// Parser types
export type {
  ColumnAnalysis,
  DetectedColumns,
  StackSuggestion,
  ExclusionReason,
  ExcludedRow,
  ColumnIssue,
  DataQualityReport,
  ParetoRow,
  DetectChannelsOptions,
  DetectWideFormatOptions,
} from './parser';

// Parser functions
export {
  parseCSV,
  parseText,
  parseExcel,
  detectColumns,
  validateData,
  parseParetoFile,
  // Wide format detection
  detectChannelColumns,
  detectWideFormat,
} from './parser';

// Performance Module
export {
  CPK_THRESHOLDS,
  getChannelHealth,
  calculateChannelStats,
  calculateChannelPerformance,
  sortChannels,
  getWorstChannels,
  // Control limits for capability metrics
  calculateCapabilityControlLimits,
  getCapabilityControlStatus,
  type CpkThresholds,
  type ChannelSortBy,
  type CapabilityControlLimits,
  type CapabilityControlStatus,
} from './performance';

// Navigation
export type {
  FilterType,
  FilterSource,
  FilterAction,
  HighlightState,
  NavigationState,
  BreadcrumbItem,
} from './navigation';

export {
  filterStackToFilters,
  createFilterAction,
  popFilterStackTo,
  popFilterStack,
  pushFilterStack,
  shouldToggleFilter,
  filterStackToBreadcrumbs,
} from './navigation';

// Variation tracking
export type {
  OptimalFactorResult,
  CategoryStats,
  ProjectedStats,
  DirectAdjustmentParams,
  DirectAdjustmentResult,
  OverallImpactResult,
  DirectionColor,
} from './variation';

export {
  calculateProjectedStats,
  applyFilters,
  getNextDrillFactor,
  findOptimalFactors,
  simulateDirectAdjustment,
  simulateOverallImpact,
  normalCDF,
  normalPDF,
  computeCategoryDirectionColors,
  findBestSubgroup,
  findTightestSubgroup,
  DRILL_SWITCH_THRESHOLD,
} from './variation';

// Improvement Progress Tracking
export type { ImprovementProgress, FindingContribution } from './variation/progress';
export { computeImprovementProgress, computeIdeaImpact } from './variation/progress';

// URL parameter utilities
export {
  filtersToSearchParams,
  searchParamsToFilters,
  updateUrlWithFilters,
  isEmbedMode,
} from './urlParams';

// Glossary (vocabulary)
export type { GlossaryTerm, GlossaryCategory, GlossaryLocale } from './glossary';
export {
  glossaryTerms,
  glossaryMap,
  getTerm,
  getTermsByCategory,
  hasTerm,
  buildGlossaryPrompt,
} from './glossary';

// Knowledge Model (vocabulary + methodology concepts)
export type { ConceptCategory, KnowledgeRelation, Concept, KnowledgeEntry } from './glossary';
export { isConcept, isGlossaryTerm } from './glossary';
export { concepts, conceptMap, getConcept } from './glossary';
export { allKnowledge, getEntry, hasEntry, getRelated, getReferencedBy } from './glossary';

// Formatting utilities
export { formatPValue, getStars } from './format';

// Internationalization
export type { Locale, MessageCatalog } from './i18n';
export {
  LOCALES,
  LOCALE_NAMES,
  formatStatistic,
  formatPercent,
  formatDate,
  formatInteger,
  getMessages,
  getMessage,
  formatMessage,
  detectLocale,
  registerLocaleLoaders,
  registerLocale,
  preloadLocale,
  isLocaleLoaded,
} from './i18n';

// Responsive utilities (chart layout calculations)
export type { ChartMargins, ChartFonts, ChartType, Breakpoints } from './responsive';
export {
  getResponsiveMargins,
  getResponsiveFonts,
  getScaledFonts,
  getResponsiveTickCount,
  getBreakpoints,
  stageColors,
} from './responsive';

// Time utilities
export type { TimeComponents, TimeExtractionConfig, TimeGranularity } from './time';
export {
  parseTimeValue,
  extractTimeComponents,
  formatTimeValue,
  formatTimeBucket,
  augmentWithTimeColumns,
  hasTimeComponent,
} from './time';

// Selection utilities (Minitab-style brushing)
export { createFactorFromSelection, isValidFactorName, getColumnNames } from './utils/selection';

// Numeric utilities (stack-safe for large datasets)
export { safeMin, safeMax } from './utils/minmax';

// EXIF/GPS metadata stripping (defense-in-depth for photo uploads)
export { hasExifData, stripExifSegments, stripExifFromBlob } from './utils/exifStrip';

// AI (Phase 1)
export type {
  CurrentUnderstanding,
  CurrentUnderstandingMechanism,
  ProcessContext,
  ProblemCondition,
  ProblemConditionStatus,
  TargetMetric,
  EntryScenario,
  InvestigationPhase,
  JourneyPhase,
  AITier,
  AIContext,
  AIErrorType,
  CoScoutMessage,
  CoScoutError,
  BuildAIContextOptions,
  AIStatsInput,
  BuildCoScoutSystemPromptOptions,
  BuildCoScoutToolsOptions,
  CoScoutSurface,
  CoScoutPromptTiers,
  AssembleCoScoutPromptOptions,
} from './ai';

export {
  DEFAULT_PROCESS_HUB,
  DEFAULT_PROCESS_HUB_ID,
  DEFAULT_PROCESS_HUB_NAME,
  buildProcessHubCadence,
  buildProcessHubContext,
  buildProcessHubReview,
  buildProcessHubRollups,
  investigationStatusFromJourneyPhase,
  normalizeProcessHubId,
} from './processHub';

// Sustainment (Phase 6)
export type {
  SustainmentRecord,
  SustainmentReview,
  ControlHandoff,
  SustainmentCadence,
  SustainmentVerdict,
  ControlHandoffSurface,
  SustainmentMetadataProjection,
} from './sustainment';
export {
  nextDueFromCadence,
  isSustainmentDue,
  isSustainmentOverdue,
  selectSustainmentReviews,
  selectControlHandoffCandidates,
  sustainmentRecordBlobPath,
  sustainmentReviewBlobPath,
  controlHandoffBlobPath,
  sustainmentCatalogPath,
} from './sustainment';

// Survey evaluator (QDE 2.0 foundation)
export { evaluateSurvey, SURVEY_RECOMMENDATION_KIND_LABELS, SURVEY_STATUS_LABELS } from './survey';
export type {
  SurveyDiagnostics,
  SurveyEvaluation,
  SurveyEvaluationInput,
  SurveyPossibilityItem,
  SurveyPowerItem,
  SurveyRecommendation,
  SurveyRecommendationKind,
  SurveyRecommendationSource,
  SurveyRecommendationTarget,
  SurveySection,
  SurveyStatus,
  SurveyTrustItem,
} from './survey';
export type {
  InvestigationDepth,
  InvestigationStatus,
  ProcessHubAttentionReason,
  ProcessHubCadenceQueue,
  ProcessHubCadenceSnapshot,
  ProcessHubCadenceSummary,
  ProcessHubContextContract,
  ProcessHubContextInvestigation,
  ProcessHub,
  ProcessHubInvestigation,
  ProcessHubInvestigationMetadata,
  ProcessHubMetricContext,
  ProcessHubProcessMapSummary,
  ProcessHubReadinessReason,
  ProcessHubReview,
  ProcessHubReviewItem,
  ProcessHubRollup,
  ProcessHubSurveyReadinessSummary,
  ProcessHubVariationConcentration,
  ProcessParticipantRef,
} from './processHub';
export {
  buildAIContext,
  detectInvestigationPhase,
  buildNarrationSystemPrompt,
  buildSummaryPrompt,
  formatKnowledgeContext,
  assembleCoScoutPrompt,
  buildCoScoutMessageInput,
  buildReportSystemPrompt,
  buildReportPrompt,
  buildLocaleHint,
  djb2Hash,
  narrationResponseSchema,
  chartInsightResponseSchema,
} from './ai';

// Process understanding vocabulary helpers
export {
  buildCurrentUnderstanding,
  buildProblemCondition,
  type BuildCurrentUnderstandingInput,
  type BuildProblemConditionInput,
} from './processUnderstanding';

// AI (Action Tools — ADR-029)
export type {
  ActionToolName,
  ReadToolName,
  CoScoutToolName,
  ProposalStatus,
  ActionProposal,
  ParsedActionMarker,
  FilterPreview,
} from './ai';
export {
  parseActionMarkers,
  stripActionMarkers,
  computeFilterPreview,
  hashFilterStack,
  generateProposalId,
  isDuplicateProposal,
} from './ai';

// AI (Phase 2 — Chart Insights)
export type {
  InsightChartType,
  ChipType,
  DeterministicInsight,
  InsightAction,
  ChartInsightData,
} from './ai';
export {
  buildIChartInsight,
  buildBoxplotInsight,
  buildParetoInsight,
  buildStatsInsight,
  buildStagedComparisonInsight,
  buildChartInsightPrompt,
  buildChartInsightSystemPrompt,
  buildSuggestedQuestions,
  formatForMobile,
} from './ai';

// AI (Phase 3 — Tracing & Responses API)
export type {
  AIFeature,
  TraceMetadata,
  TokenUsage,
  TraceRecord,
  TraceStats,
  ResponsesApiConfig,
  ResponsesApiRequest,
  ResponsesApiResponse,
  ResponseOutput,
  ToolDefinition,
  TextFormat,
  FunctionCallOutput,
  ToolHandlerMap,
} from './ai';
export {
  traceAICall,
  getRecentTraces,
  clearTraces,
  getTraceStats,
  ResponsesApiError,
  sendResponsesTurn,
  streamResponsesTurn,
  streamResponsesWithToolLoop,
  extractResponseText,
  ConversationHistory,
  getCoScoutReasoningEffort,
  buildDashboardSummaryPrompt,
} from './ai';

// AI (Project Search — ADR-042)
export { searchProjectArtifacts } from './ai';
export type { SearchProjectOptions, SearchResult } from './ai';

// Wall investigation actions (Phase 3)
export {
  proposeDisconfirmationMove,
  critiqueInvestigationState,
  detectBestSubsetsCandidates,
} from './ai/actions';
export type {
  SuggestedBrush,
  InvestigationGap,
  CritiqueInput,
  CritiqueResult,
  BestSubsetsCandidate,
} from './ai/actions';

// Category keyword matching and inference
export {
  CATEGORY_KEYWORDS,
  findMatchedCategoryKeyword,
  CATEGORY_DISPLAY_NAMES,
  inferCategoryName,
} from './parser';

// Stack (unpivot) columns
export { stackColumns, previewStack } from './parser';
export type { StackConfig, StackResult } from './parser';

// Findings (scouting report)
export type {
  Finding,
  FindingAssignee,
  FindingContext,
  FindingStatus,
  FindingComment,
  FindingTag,
  FindingSource,
  FindingProjection,
  FindingProjectionModelContext,
  PhotoAttachment,
  PhotoUploadStatus,
  CommentAttachment,
  ActionItem,
  FindingOutcome,
  Question,
  QuestionStatus,
  QuestionValidationType,
  InvestigationCategory,
  ImprovementIdea,
  IdeaTimeframe,
  IdeaCostCategory,
  IdeaCost,
  RiskLevel,
  IdeaRiskAssessment,
  ComputedRiskLevel,
  RiskAxisPreset,
  RiskAxisConfig,
  BudgetConfig,
  IdeaImpact,
  IdeaDirection,
  IdeaCategory,
  FindingRole,
  BenchmarkStats,
  SuspectedCause,
  MechanismBranchReadiness,
  MechanismBranchStatus,
  MechanismBranchClueView,
  MechanismBranchProcessContext,
  MechanismBranchProjectionOptions,
  MechanismBranchQuestionView,
  MechanismBranchReadinessView,
  MechanismBranchViewModel,
  // Causal link types (investigation DAG)
  CausalLink,
  CausalDirection,
  CausalEvidenceType,
  CausalSource,
  // Projection types (SuspectedCause evidence model)
  ProjectionSource,
  ProjectionMethod,
  StatisticalProjectionResult,
  LeanProjectionResult,
  ProjectionResult,
  ProjectionScenario,
  SuspectedCauseEvidence,
  // Investigation Wall — contribution tree
  GateNode,
  // HypothesisCondition evaluator (DataRow is re-exported via line 7 from './types')
  AndCheckResult,
} from './findings';

// FRAME ProcessMap types (surface at root for UI consumers)
export type {
  ProcessMap,
  ProcessMapNode,
  ProcessMapTributary,
  ProcessMapHunch,
  TributaryRole,
} from './frame';
export {
  DEFAULT_RISK_AXIS_CONFIG,
  computeRiskLevel,
  FINDING_STATUSES,
  FINDING_STATUS_LABELS,
  FINDING_STATUS_DESCRIPTIONS,
  FINDING_TAGS,
  FINDING_TAG_LABELS,
  QUESTION_STATUSES,
  QUESTION_STATUS_LABELS,
  PWA_STATUSES,
  CATEGORY_COLORS,
  generateId,
  createFinding,
  createFindingComment,
  createPhotoAttachment,
  createCommentAttachment,
  createActionItem,
  createFindingOutcome,
  createQuestion,
  createImprovementIdea,
  createFactorFinding,
  createInvestigationCategory,
  createSuspectedCause,
  createCausalLink,
  // HypothesisCondition evaluator
  evaluateCondition,
  runAndCheck,
  // HypothesisCondition column inspection
  collectReferencedColumns,
  conditionHasMissingColumn,
  // GateNode path-based tree ops (Investigation Wall contribution tree)
  getAt,
  updateAt,
  insertHubAsAndChild,
  removeAt,
} from './findings';
export type { GatePath } from './findings';
export type { FactorFindingInput, FactorFindingBundle } from './findings';
export {
  getCategoryForFactor,
  getFindingStatus,
  groupFindingsByStatus,
  formatFindingFilters,
  filtersEqual,
  findDuplicateFinding,
  findDuplicateBySource,
  migrateFindingStatus,
  migrateFindings,
  migrateActionAssignee,
  isFindingScoped,
  getScopedFindings,
  computeHubContribution,
  computeHubEvidence,
  computeHubProjection,
  projectMechanismBranch,
  projectMechanismBranches,
  detectEvidenceClusters,
  migrateCauseRolesToHubs,
} from './findings';
export type { HubProjection, EvidenceCluster } from './findings';

// Yamazumi Analysis Mode
export type {
  ActivityType,
  YamazumiColumnMapping,
  YamazumiSegment,
  YamazumiBarData,
  YamazumiSummary,
  YamazumiIChartMetric,
  YamazumiParetoMode,
  YamazumiDetection,
} from './yamazumi';
export {
  ACTIVITY_TYPE_COLORS,
  ACTIVITY_TYPE_LABELS,
  ACTIVITY_TYPE_ORDER,
  classifyActivityType,
  isActivityTypeValue,
  computeYamazumiData,
  computeYamazumiSummary,
  detectYamazumiFormat,
  // Lean projection engine
  projectWasteElimination,
  projectVAImprovement,
} from './yamazumi';

// Defect analysis
export type {
  DefectDataShape,
  DefectMapping,
  DefectDetection,
  DefectTransformResult,
  DefectQuestionInput,
} from './defect';
export { detectDefectFormat, computeDefectRates, generateDefectAnalysisQuestions } from './defect';

// Worker types (for app-level Worker integration)
export type {
  StatsComputeRequest,
  StatsComputeResult,
  AnovaComputeRequest,
  BestSubsetsComputeRequest,
  SerializedBestSubsetsResult,
  StatsWorkerAPI,
} from './workers/types';
export {
  computeStats,
  computeAnova,
  computeBestSubsetsWorker,
  deserializeBestSubsetsResult,
} from './workers/statsWorkerApi';

// Project Metadata (Portfolio view)
export { buildProjectMetadata } from './projectMetadata';
export type { ProjectMetadata } from './projectMetadata';
