/**
 * @variscout/core
 * Core statistics and utility functions for VariScout
 */

// Types - Data Row (foundation for type-safe data handling)
export type { DataCellValue, DataRow } from './types';
export { isNumericValue, isStringValue, toNumericValue } from './types';

// Types - Statistics and Analysis
export type {
  StatsResult,
  GradeTier,
  GradeCount,
  SpecLimits,
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
  // Staged stats functions
  determineStageOrder,
  sortDataByStage,
  calculateStatsByStage,
  getStageBoundaries,
} from './stats';

// License
export {
  isValidLicenseFormat,
  generateLicenseKey,
  storeLicenseKey,
  getStoredLicenseKey,
  removeLicenseKey,
  hasValidLicense,
} from './license';

// Edition
export type { Edition } from './edition';
export {
  EDITION_COLORS,
  configureEdition,
  getEdition,
  shouldShowBranding,
  getBrandingText,
  isITCEdition,
  getSignatureText,
  isThemingEnabled,
} from './edition';

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
} from './parser';

// Parser functions
export { parseCSV, parseExcel, detectColumns, validateData, parseParetoFile } from './parser';

// Navigation
export type {
  DrillType,
  DrillSource,
  DrillAction,
  HighlightState,
  NavigationState,
  BreadcrumbItem,
} from './navigation';

export {
  generateDrillId,
  getDrillLabel,
  drillStackToFilters,
  createDrillAction,
  findDrillIndex,
  popDrillStackTo,
  popDrillStack,
  pushDrillStack,
  shouldToggleDrill,
  drillStackToBreadcrumbs,
  initialNavigationState,
  VARIATION_THRESHOLDS,
  getVariationImpactLevel,
  getVariationInsight,
} from './navigation';

// Variation tracking
export type { DrillVariationResult, DrillLevelVariation, OptimalFactorResult } from './variation';

export {
  calculateDrillVariation,
  calculateFactorVariations,
  shouldHighlightDrill,
  applyFilters,
  getNextDrillFactor,
  findOptimalFactors,
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
