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
  GradeTier,
  GradeCount,
  SpecLimits,
  CharacteristicType,
  ProbabilityPlotPoint,
  DisplayOptions,
  ConformanceResult,
  AnovaResult,
  AnovaGroup,
  RegressionResult,
  LinearFit,
  QuadraticFit,
  GageRRResult,
  GageRRInteraction,
  StageOrderMode,
  StagedStatsResult,
  StageBoundary,
  NelsonRule2Sequence,
  // Boxplot Types
  BoxplotGroupInput,
  BoxplotGroupData,
  // Performance Module Types
  ChannelHealth,
  ChannelInfo,
  ChannelResult,
  PerformanceSummary,
  ChannelPerformanceData,
  WideFormatDetection,
  // Multiple Regression Types
  MultiRegressionOptions,
  MultiRegressionResult,
  CoefficientResult,
  RegressionTerm,
  VIFWarning,
} from './types';

// Statistics
export {
  calculateStats,
  getEtaSquared,
  calculateProbabilityPlotData,
  normalQuantile,
  calculateConformance,
  groupDataByFactor,
  calculateAnova,
  calculateRegression,
  calculateGageRR,
  // Multiple regression (GLM)
  calculateMultipleRegression,
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
} from './stats';

// Matrix utilities (for advanced use)
export type { Matrix } from './matrix';
export { transpose, multiply, inverse, solve } from './matrix';

// Edition (legacy - prefer tier module for new code)
export type { Edition } from './edition';
export {
  EDITION_COLORS,
  configureEdition,
  getEdition,
  shouldShowBranding,
  getBrandingText,
  getSignatureText,
  isThemingEnabled,
  tierToEdition,
} from './edition';

// Tier (Azure Marketplace multi-tier licensing)
export type { LicenseTier, TierLimits, ChannelLimitResult } from './tier';
export {
  TIER_LIMITS,
  CHANNEL_WARNING_THRESHOLD,
  DEFAULT_TIER,
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
  CHANNEL_LIMITS,
  getChannelHealth,
  calculateChannelStats,
  calculateChannelPerformance,
  sortChannels,
  filterChannelsByHealth,
  getChannelsNeedingAttention,
  getWorstChannels,
  getBestChannels,
  validateThresholds,
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
  generateFilterId,
  getFilterLabel,
  filterStackToFilters,
  createFilterAction,
  findFilterIndex,
  popFilterStackTo,
  popFilterStack,
  pushFilterStack,
  shouldToggleFilter,
  filterStackToBreadcrumbs,
  initialNavigationState,
  VARIATION_THRESHOLDS,
  getVariationImpactLevel,
  getVariationInsight,
} from './navigation';

// Variation tracking
export type {
  DrillVariationResult,
  DrillLevelVariation,
  OptimalFactorResult,
  CategoryContributionResult,
  CategoryTotalSSResult,
  CategoryStats,
  ProjectedStats,
  DirectAdjustmentParams,
  DirectAdjustmentResult,
} from './variation';

export {
  calculateDrillVariation,
  calculateFactorVariations,
  calculateCategoryContributions,
  calculateCategoryTotalSS,
  getCategoryStats,
  calculateProjectedStats,
  shouldHighlightDrill,
  applyFilters,
  getNextDrillFactor,
  findOptimalFactors,
  simulateDirectAdjustment,
  DRILL_SWITCH_THRESHOLD,
} from './variation';

// URL parameter utilities
export {
  filtersToSearchParams,
  searchParamsToFilters,
  buildShareableUrl,
  updateUrlWithFilters,
  getFiltersFromUrl,
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
