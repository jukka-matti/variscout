/**
 * Internationalization types for VariScout
 */

/** Supported locales */
export type Locale = 'en' | 'de' | 'es' | 'fi' | 'fr' | 'pt';

/** All supported locale values */
export const LOCALES: Locale[] = ['en', 'de', 'es', 'fi', 'fr', 'pt'];

/** Human-readable locale names (in their own language) */
export const LOCALE_NAMES: Record<Locale, string> = {
  en: 'English',
  de: 'Deutsch',
  es: 'Español',
  fi: 'Suomi',
  fr: 'Français',
  pt: 'Português',
};

/**
 * Message catalog interface — English is the source of truth.
 * All other locales must satisfy the same shape.
 */
export interface MessageCatalog {
  // Statistics labels
  'stats.mean': string;
  'stats.median': string;
  'stats.stdDev': string;
  'stats.samples': string;
  'stats.passRate': string;
  'stats.range': string;
  'stats.min': string;
  'stats.max': string;
  'stats.target': string;
  'stats.sigma': string;

  // Chart labels
  'chart.observation': string;
  'chart.count': string;
  'chart.frequency': string;
  'chart.value': string;
  'chart.category': string;
  'chart.cumulative': string;

  // Limit labels
  'limits.usl': string;
  'limits.lsl': string;
  'limits.ucl': string;
  'limits.lcl': string;
  'limits.mean': string;
  'limits.target': string;

  // Action buttons
  'action.save': string;
  'action.cancel': string;
  'action.delete': string;
  'action.edit': string;
  'action.copy': string;
  'action.close': string;
  'action.learnMore': string;
  'action.download': string;
  'action.apply': string;
  'action.reset': string;

  // Empty states
  'empty.noData': string;
  'empty.noFindings': string;
  'empty.noResults': string;

  // Error messages
  'error.generic': string;
  'error.loadFailed': string;
  'error.parseFailed': string;

  // Settings labels
  'settings.language': string;
  'settings.theme': string;
  'settings.textSize': string;

  // Finding statuses
  'findings.observed': string;
  'findings.investigating': string;
  'findings.analyzed': string;
  'findings.improving': string;
  'findings.resolved': string;

  // Report labels
  'report.summary': string;
  'report.findings': string;
  'report.recommendations': string;
  'report.evidence': string;

  // Data input labels
  'data.pasteData': string;
  'data.uploadFile': string;
  'data.columnMapping': string;
  'data.measureColumn': string;
  'data.factorColumn': string;
}
