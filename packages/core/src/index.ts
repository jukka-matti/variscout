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
  DisplayOptions,
  ConformanceResult,
  AnovaResult,
  AnovaGroup,
  StageOrderMode,
  StagedStatsResult,
  StageBoundary,
  NelsonRule2Sequence,
} from './types';

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
  // Kernel density estimation (for violin plots)
  calculateKDE,
  // Evidence interpretation
  interpretEvidence,
  generateAnovaInsightLine,
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
  isTeamAIPlan,
  isTeamPlan,
} from './tier';

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
  VARIATION_THRESHOLDS,
  getVariationImpactLevel,
  getVariationInsight,
} from './navigation';

// Variation tracking
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
  DirectionColor,
} from './variation';

export {
  calculateDrillVariation,
  calculateFactorVariations,
  calculateCategoryTotalSS,
  getMaxCategoryContribution,
  getCategoryStats,
  calculateProjectedStats,
  shouldHighlightDrill,
  applyFilters,
  getNextDrillFactor,
  findOptimalFactors,
  simulateDirectAdjustment,
  simulateOverallImpact,
  normalCDF,
  normalPDF,
  computeCategoryDirectionColors,
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
  detectLocale,
} from './i18n';

// Responsive utilities (chart layout calculations)
export type { ChartMargins, ChartFonts, ChartType, Breakpoints } from './responsive';
export {
  getResponsiveMargins,
  getResponsiveFonts,
  getScaledFonts,
  getResponsiveTickCount,
  getBreakpoints,
} from './responsive';

// Time utilities
export type { TimeComponents, TimeExtractionConfig } from './time';
export {
  parseTimeValue,
  extractTimeComponents,
  formatTimeValue,
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
  ProcessContext,
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
} from './ai';
export {
  buildAIContext,
  detectInvestigationPhase,
  buildNarrationSystemPrompt,
  buildSummaryPrompt,
  buildCoScoutSystemPrompt,
  buildCoScoutMessages,
  buildCoScoutInput,
  formatKnowledgeContext,
  buildReportSystemPrompt,
  buildReportPrompt,
  buildLocaleHint,
  djb2Hash,
  narrationResponseSchema,
  chartInsightResponseSchema,
} from './ai';

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
  sendResponsesTurn,
  streamResponsesTurn,
  streamResponsesWithToolLoop,
  extractResponseText,
  buildCoScoutTools,
} from './ai';

// Category keyword matching and inference
export {
  CATEGORY_KEYWORDS,
  findMatchedCategoryKeyword,
  CATEGORY_DISPLAY_NAMES,
  inferCategoryName,
} from './parser';

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
  PhotoAttachment,
  PhotoUploadStatus,
  ActionItem,
  FindingOutcome,
  Hypothesis,
  HypothesisStatus,
  HypothesisValidationType,
  InvestigationCategory,
  ImprovementIdea,
  IdeaEffort,
  IdeaImpact,
} from './findings';
export {
  FINDING_STATUSES,
  FINDING_STATUS_LABELS,
  FINDING_STATUS_DESCRIPTIONS,
  FINDING_TAGS,
  FINDING_TAG_LABELS,
  HYPOTHESIS_STATUSES,
  HYPOTHESIS_STATUS_LABELS,
  PWA_STATUSES,
  CATEGORY_COLORS,
  generateId,
  createFinding,
  createFindingComment,
  createPhotoAttachment,
  createActionItem,
  createFindingOutcome,
  createHypothesis,
  createImprovementIdea,
  createInvestigationCategory,
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
} from './findings';
