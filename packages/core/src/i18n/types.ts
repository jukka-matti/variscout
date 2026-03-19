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

  // Methodology Coach
  'coach.frame': string;
  'coach.scout': string;
  'coach.investigate': string;
  'coach.improve': string;
  'coach.frameDesc': string;
  'coach.scoutDesc': string;
  'coach.investigateDesc': string;
  'coach.improveDesc': string;

  // Report KPIs
  'report.kpi.samples': string;
  'report.kpi.mean': string;
  'report.kpi.variation': string;
  'report.kpi.cpk': string;
  'report.kpi.passRate': string;

  // AI Actions
  'ai.propose': string;
  'ai.applied': string;
  'ai.dismissed': string;
  'ai.expired': string;

  // Staged analysis
  'staged.before': string;
  'staged.after': string;
  'staged.comparison': string;

  // Data input / Column mapping
  'data.mapHeading': string;
  'data.confirmColumns': string;
  'data.selectOutcome': string;
  'data.selectFactors': string;
  'data.analysisSection': string;
  'data.optional': string;
  'data.problemPlaceholder': string;
  'data.outcomeDesc': string;
  'data.factorsDesc': string;
  'data.alreadyOutcome': string;
  'data.showNumericOnly': string;
  'data.showCategoricalOnly': string;
  'data.showAllColumns': string;
  'data.improvementTarget': string;
  'data.metric': string;
  'data.startAnalysis': string;
  'data.applyChanges': string;
  'data.addHypothesis': string;
  'data.removeHypothesis': string;
  'data.back': string;

  // Paste screen
  'data.pasteInstructions': string;
  'data.pasteSubtitle': string;
  'data.useExample': string;
  'data.analyzing': string;
  'data.tipWithData': string;
  'data.tipNoData': string;

  // Data quality
  'quality.allValid': string;
  'quality.rowsReady': string;
  'quality.rowsExcluded': string;
  'quality.missingValues': string;
  'quality.nonNumeric': string;
  'quality.noVariation': string;
  'quality.emptyColumn': string;
  'quality.noVariationWarning': string;
  'quality.viewExcluded': string;
  'quality.viewAll': string;

  // Manual entry
  'manual.setupTitle': string;
  'manual.analysisMode': string;
  'manual.standard': string;
  'manual.standardDesc': string;
  'manual.performance': string;
  'manual.performanceDesc': string;
  'manual.outcome': string;
  'manual.outcomeExample': string;
  'manual.factors': string;
  'manual.addFactor': string;
  'manual.measureLabel': string;
  'manual.measureExample': string;
  'manual.channelCount': string;
  'manual.channelRange': string;
  'manual.startEntry': string;
  'manual.specs': string;
  'manual.specsApplyAll': string;
  'manual.specsHelper': string;

  // Chart legend
  'chart.legend.commonCause': string;
  'chart.legend.specialCause': string;
  'chart.legend.outOfSpec': string;
  'chart.legend.inControl': string;
  'chart.legend.randomVariation': string;
  'chart.legend.defect': string;

  // Chart violations
  'chart.violation.aboveUsl': string;
  'chart.violation.belowLsl': string;
  'chart.violation.aboveUcl': string;
  'chart.violation.belowLcl': string;
  'chart.violation.aboveUclFavorable': string;
  'chart.violation.belowLclFavorable': string;
  'chart.violation.nelson2': string;
  'chart.violation.nelson3': string;

  // Investigation sidebar
  'investigation.phaseInitial': string;
  'investigation.phaseDiverging': string;
  'investigation.phaseValidating': string;
  'investigation.phaseConverging': string;
  'investigation.phaseImproving': string;
  'investigation.pdcaTitle': string;
  'investigation.verifyChart': string;
  'investigation.verifyStats': string;
  'investigation.verifyBoxplot': string;
  'investigation.verifySideEffects': string;
  'investigation.verifyOutcome': string;
  'investigation.uninvestigated': string;

  // Coach mobile phase titles
  'coach.frameTitle': string;
  'coach.scoutTitle': string;
  'coach.investigateTitle': string;
  'coach.improveTitle': string;

  // AI action tool labels
  'ai.tool.applyFilter': string;
  'ai.tool.clearFilters': string;
  'ai.tool.switchFactor': string;
  'ai.tool.createFinding': string;
  'ai.tool.createHypothesis': string;
  'ai.tool.suggestAction': string;
  'ai.tool.shareFinding': string;
  'ai.tool.publishReport': string;
  'ai.tool.notifyOwners': string;

  // Report
  'report.kpi.inSpec': string;

  // Table
  'table.noData': string;
  'table.page': string;
  'table.rowsPerPage': string;
  'table.editHint': string;
  'table.excluded': string;
  'table.deleteRow': string;
  'table.addRow': string;
  'table.unsavedChanges': string;

  // Specs
  'specs.title': string;
  'specs.advancedSettings': string;
  'specs.apply': string;
  'specs.noChanges': string;
  'specs.editTitle': string;
  'specs.lslLabel': string;
  'specs.uslLabel': string;

  // Upgrade
  'upgrade.title': string;
  'upgrade.limitReached': string;
  'upgrade.upgrade': string;
  'upgrade.viewOptions': string;
  'upgrade.featureLimit': string;

  // Display toggles
  'display.violin': string;
  'display.violinDesc': string;
  'display.contribution': string;
  'display.contributionDesc': string;
  'display.sort': string;
  'display.ascending': string;
  'display.descending': string;

  // Stats panel
  'stats.summary': string;
  'stats.histogram': string;
  'stats.probPlot': string;
  'stats.editSpecs': string;

  // WhatIf
  'whatif.adjustMean': string;
  'whatif.reduceVariation': string;
  'whatif.currentProjected': string;
  'whatif.resetAdjustments': string;
  'whatif.yield': string;

  // Parameterized messages
  'data.rowsLoaded': string;
  'findings.countLabel': string;
}
