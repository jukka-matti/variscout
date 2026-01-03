/**
 * @variscout/core
 * Core statistics and utility functions for VariScout
 */

// Types
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
  configureEdition,
  getEdition,
  shouldShowBranding,
  getBrandingText,
  isITCEdition,
  getSignatureText,
} from './edition';

// Export utilities
export { getSpecStatus, generateCSV, downloadCSV } from './export';
export type { ExportOptions } from './export';

// Parser
export { parseCSV, parseExcel, detectColumns } from './parser';
