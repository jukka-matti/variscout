/**
 * Internationalization types for VariScout
 */

/** Supported locales */
export type Locale =
  | 'en'
  | 'de'
  | 'es'
  | 'fi'
  | 'fr'
  | 'pt'
  | 'ja'
  | 'zh-Hans'
  | 'zh-Hant'
  | 'ko'
  | 'it'
  | 'nl'
  | 'pl'
  | 'ru'
  | 'tr'
  | 'sv'
  | 'da'
  | 'nb'
  | 'cs'
  | 'hu'
  | 'ro'
  | 'uk'
  | 'th'
  | 'vi'
  | 'id'
  | 'ms'
  | 'ar'
  | 'he'
  | 'hi'
  | 'el'
  | 'bg'
  | 'hr'
  | 'sk';

/** All supported locale values */
export const LOCALES: Locale[] = [
  'en',
  'de',
  'es',
  'fi',
  'fr',
  'pt',
  'ja',
  'zh-Hans',
  'zh-Hant',
  'ko',
  'it',
  'nl',
  'pl',
  'ru',
  'tr',
  'sv',
  'da',
  'nb',
  'cs',
  'hu',
  'ro',
  'uk',
  'th',
  'vi',
  'id',
  'ms',
  'ar',
  'he',
  'hi',
  'el',
  'bg',
  'hr',
  'sk',
];

/** Human-readable locale names (in their own language) */
export const LOCALE_NAMES: Record<Locale, string> = {
  en: 'English',
  de: 'Deutsch',
  es: 'Español',
  fi: 'Suomi',
  fr: 'Français',
  pt: 'Português',
  ja: '日本語',
  'zh-Hans': '简体中文',
  'zh-Hant': '繁體中文',
  ko: '한국어',
  it: 'Italiano',
  nl: 'Nederlands',
  pl: 'Polski',
  ru: 'Русский',
  tr: 'Türkçe',
  sv: 'Svenska',
  da: 'Dansk',
  nb: 'Norsk bokmål',
  cs: 'Čeština',
  hu: 'Magyar',
  ro: 'Română',
  uk: 'Українська',
  th: 'ไทย',
  vi: 'Tiếng Việt',
  id: 'Bahasa Indonesia',
  ms: 'Bahasa Melayu',
  ar: 'العربية',
  he: 'עברית',
  hi: 'हिन्दी',
  el: 'Ελληνικά',
  bg: 'Български',
  hr: 'Hrvatski',
  sk: 'Slovenčina',
};

/**
 * Message catalog interface — English is the source of truth.
 * All other locale catalogs must satisfy the same shape.
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
  'chart.clickToEdit': string;
  'chart.median': string;
  'chart.q1': string;
  'chart.q3': string;
  'chart.noChannelData': string;
  'chart.selectChannel': string;

  // Limit labels
  'limits.usl': string;
  'limits.lsl': string;
  'limits.ucl': string;
  'limits.lcl': string;
  'limits.mean': string;
  'limits.target': string;

  // Navigation
  'nav.newAnalysis': string;
  'nav.backToDashboard': string;
  'nav.settings': string;
  'nav.export': string;
  'nav.presentation': string;
  'nav.menu': string;
  'nav.moreActions': string;

  // Panel titles
  'panel.findings': string;
  'panel.dataTable': string;
  'panel.whatIf': string;
  'panel.investigation': string;
  'panel.coScout': string;
  'panel.drillPath': string;

  // View modes
  'view.list': string;
  'view.board': string;
  'view.tree': string;

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
  'action.retry': string;
  'action.send': string;
  'action.ask': string;
  'action.clear': string;
  'action.copyAll': string;
  'action.selectAll': string;

  // CoScout
  'coscout.send': string;
  'coscout.clear': string;
  'coscout.stop': string;
  'coscout.rateLimit': string;
  'coscout.contentFilter': string;
  'coscout.error': string;

  // Display/settings
  'display.preferences': string;
  'display.chartTextSize': string;
  'display.compact': string;
  'display.normal': string;
  'display.large': string;
  'display.lockYAxis': string;
  'display.filterContext': string;
  'display.showSpecs': string;

  // Investigation
  'investigation.brief': string;
  'investigation.assignedToMe': string;
  'investigation.hypothesis': string;
  'investigation.hypotheses': string;
  'investigation.pinAsFinding': string;
  'investigation.addObservation': string;

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
  'data.addData': string;
  'data.editData': string;
  'data.showDataTable': string;
  'data.hideDataTable': string;

  // Status
  'status.cached': string;
  'status.loading': string;
  'status.ai': string;
}
