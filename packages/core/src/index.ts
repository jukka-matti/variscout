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
  // Nelson rules
  getNelsonRule2ViolationPoints,
  getNelsonRule2Sequences,
  // Boxplot statistics
  calculateBoxplotStats,
  sortBoxplotData,
  // Kernel density estimation (for violin plots)
  calculateKDE,
} from './stats';

// Tier (Azure Marketplace multi-tier licensing) — primary module
export type { LicenseTier, TierLimits, ChannelLimitResult } from './tier';
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
} from './tier';

// Export utilities
export { getSpecStatus, generateCSV, downloadCSV } from './export';
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

// URL parameter utilities
export {
  filtersToSearchParams,
  searchParamsToFilters,
  updateUrlWithFilters,
  isEmbedMode,
} from './urlParams';

// Glossary
export type { GlossaryTerm, GlossaryCategory, GlossaryLocale } from './glossary';
export { glossaryTerms, glossaryMap, getTerm, getTermsByCategory, hasTerm } from './glossary';

// Formatting utilities
export { formatPValue, getStars } from './format';

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

// Findings (scouting report)
export type {
  Finding,
  FindingContext,
  FindingStatus,
  FindingComment,
  FindingTag,
} from './findings';
export {
  FINDING_STATUSES,
  FINDING_STATUS_LABELS,
  FINDING_TAGS,
  FINDING_TAG_LABELS,
  createFinding,
  createFindingComment,
  getFindingStatus,
  groupFindingsByStatus,
  formatFindingFilters,
  filtersEqual,
  findDuplicateFinding,
  migrateFindingStatus,
  migrateFindings,
} from './findings';
