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
  'panel.analyze': string;
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
  'display.density': string;
  'display.lockYAxis': string;
  'display.filterContext': string;
  'display.showSpecs': string;

  // Investigation
  'analyze.brief': string;
  'analyze.assignedToMe': string;
  'analyze.pinAsFinding': string;
  'analyze.addObservation': string;

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
  'settings.improvementEvaluation': string;
  'settings.riskAxis1': string;
  'settings.riskAxis2': string;
  'settings.improvementBudget': string;

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
  'data.issueStatementPlaceholder': string;
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
  'analyze.phaseInitial': string;
  'analyze.phaseDiverging': string;
  'analyze.phaseValidating': string;
  'analyze.phaseConverging': string;
  'analyze.phaseImproving': string;
  'analyze.pdcaTitle': string;
  'analyze.verifyChart': string;
  'analyze.verifyStats': string;
  'analyze.verifyBoxplot': string;
  'analyze.verifySideEffects': string;
  'analyze.verifyOutcome': string;
  'analyze.unanalyzed': string;

  // AI action tool labels
  'ai.tool.applyFilter': string;
  'ai.tool.clearFilters': string;
  'ai.tool.switchFactor': string;
  'ai.tool.createFinding': string;
  'ai.tool.createQuestion': string;
  'ai.tool.suggestAction': string;
  'ai.tool.shareFinding': string;
  'ai.tool.publishReport': string;
  'ai.tool.notifyOwners': string;
  'ai.tool.suggestIdea': string;
  'ai.tool.sparkBrainstorm': string;
  'ai.tool.suggestSaveFinding': string;
  'ai.tool.navigateTo': string;
  'ai.tool.answerQuestion': string;
  'ai.tool.suggestHypothesis': string;
  'ai.tool.connectHubEvidence': string;
  'ai.tool.suggestCausalLink': string;
  'ai.tool.highlightMapPattern': string;

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
  'table.showAll': string;

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
  'display.etaSquared': string;
  'display.etaSquaredDesc': string;
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

  // Chart violation details (parameterized)
  'chart.violation.nelson2.detail': string;
  'chart.violation.nelson3.detail': string;
  'chart.violation.side.above': string;
  'chart.violation.side.below': string;
  'chart.violation.direction.increasing': string;
  'chart.violation.direction.decreasing': string;

  // Parameterized messages
  'data.rowsLoaded': string;
  'findings.countLabel': string;

  // Chart limit labels (colon-suffixed for SVG rendering)
  'chart.label.ucl': string;
  'chart.label.lcl': string;
  'chart.label.mean': string;
  'chart.label.tgt': string;
  'chart.label.usl': string;
  'chart.label.lsl': string;
  'chart.label.value': string;
  'chart.label.n': string;
  'chart.label.target': string;

  // Chart status & empty states
  'chart.status.inControl': string;
  'chart.status.outOfControl': string;
  'chart.noDataProbPlot': string;

  // Chart edit affordances
  'chart.edit.spec': string;
  'chart.edit.axisLabel': string;
  'chart.edit.yAxis': string;
  'chart.edit.saveCancel': string;

  // Performance table headers
  'chart.table.channel': string;
  'stats.cp': string;

  // Chart UI labels
  'chart.copyToClipboard': string;
  'chart.maximize': string;
  'chart.type.ichart': string;
  'chart.type.boxplot': string;
  'chart.type.pareto': string;
  'chart.drillHere': string;
  'chart.percent': string;
  'boxplot.factor.label': string;

  // Y-axis popover
  'chart.yAxisScale': string;
  'validation.minLessThanMax': string;
  'action.noChanges': string;

  // Create factor modal
  'factor.create': string;
  'factor.name': string;
  'factor.nameEmpty': string;
  'factor.nameExists': string;
  'factor.example': string;
  'factor.pointsMarked': string;
  'factor.createAndFilter': string;
  'factor.filterExplanation': string;

  // Characteristic type selector
  'charType.nominal': string;
  'charType.nominalDesc': string;
  'charType.smaller': string;
  'charType.smallerDesc': string;
  'charType.larger': string;
  'charType.largerDesc': string;

  // Investigation prompt
  'analyze.trackingPrompt': string;

  // Mobile category sheet
  'chart.highlight': string;
  'chart.highlightRed': string;
  'chart.highlightAmber': string;
  'chart.highlightGreen': string;
  'chart.clearHighlight': string;
  'chart.drillDown': string;
  'ai.askCoScout': string;

  // Settings descriptions
  'display.lockYAxisDesc': string;
  'display.filterContextDesc': string;

  // Performance detected modal
  'performance.detected': string;
  'performance.columnsFound': string;
  'performance.labelQuestion': string;
  'performance.labelExample': string;
  'performance.enable': string;

  // Finding editor & data types
  'finding.placeholder': string;
  'finding.note': string;
  'data.typeNumeric': string;
  'data.typeCategorical': string;
  'data.typeDate': string;
  'data.typeText': string;
  'outcomeNoMatch.noColumn': string;
  'outcomeNoMatch.nonNumeric': string;
  'outcomeNoMatch.noNumericColumns': string;
  'data.categories': string;

  // PWA HomeScreen
  'home.heading': string;
  'home.description': string;
  'home.divider': string;
  'home.pasteHelper': string;
  'home.manualEntry': string;
  'home.upgradeHint': string;

  // PWA navigation
  'nav.presentationMode': string;
  'nav.hideFindings': string;

  // Export
  'export.asImage': string;
  'export.asCsv': string;
  'export.imageDesc': string;
  'export.csvDesc': string;

  // Sample section
  'sample.heading': string;
  'sample.allSamples': string;
  'sample.featured': string;
  'sample.caseStudies': string;
  'sample.journeys': string;
  'sample.industry': string;

  // View modes (additional)
  'view.stats': string;

  // Display (additional)
  'display.appearance': string;

  // Azure toolbar
  'data.manualEntry': string;
  'data.editTable': string;
  'toolbar.saveAs': string;
  'toolbar.saving': string;
  'toolbar.saved': string;
  'toolbar.saveFailed': string;
  'toolbar.addMore': string;
  'report.scouting': string;
  'export.csvFiltered': string;
  'error.auth': string;

  // File browse
  'file.browseLocal': string;
  'file.browseSharePoint': string;
  'file.open': string;

  // Admin hub
  'admin.title': string;
  'admin.status': string;
  'admin.teams': string;
  'admin.knowledge': string;
  'admin.troubleshooting': string;

  // Feature names (plan matrix)
  'feature.charts': string;
  'feature.capability': string;
  'feature.performance': string;
  'feature.anova': string;
  'feature.findingsWorkflow': string;
  'feature.whatIf': string;
  'feature.csvImport': string;
  'feature.reportExport': string;
  'feature.indexedDb': string;
  'feature.maxFactors': string;
  'feature.maxRows': string;
  'feature.onedriveSync': string;
  'feature.sharepointPicker': string;
  'feature.teamsIntegration': string;
  'feature.channelCollab': string;
  'feature.mobileUi': string;
  'feature.coScoutAi': string;
  'feature.narrativeBar': string;
  'feature.chartInsights': string;
  'feature.knowledgeBase': string;
  'feature.aiActions': string;

  // Admin Teams setup
  'admin.teams.heading': string;
  'admin.teams.description': string;
  'admin.teams.running': string;
  'admin.teams.step1': string;
  'admin.teams.step1Desc': string;
  'admin.teams.step2': string;
  'admin.teams.step2Desc': string;
  'admin.teams.step3': string;
  'admin.teams.step4': string;
  'admin.teams.download': string;

  // Admin status tab
  'admin.checksResult': string;
  'admin.runChecks': string;
  'admin.notApplicable': string;
  'admin.managePortal': string;
  'admin.portalAccessNote': string;
  'admin.fixInPortal': string;

  // Admin troubleshoot tab
  'admin.troubleshoot.intro': string;
  'admin.runCheck': string;
  'admin.checkPassed': string;
  'admin.checkFailed': string;
  'admin.issue.signin': string;
  'admin.issue.signinDesc': string;
  'admin.issue.signinSteps': string;
  'admin.issue.onedrive': string;
  'admin.issue.onedriveDesc': string;
  'admin.issue.onedriveSteps': string;
  'admin.issue.coscout': string;
  'admin.issue.coscoutDesc': string;
  'admin.issue.coscoutSteps': string;
  'admin.issue.kbEmpty': string;
  'admin.issue.kbEmptyDesc': string;
  'admin.issue.kbEmptySteps': string;
  'admin.issue.teamsTab': string;
  'admin.issue.teamsTabDesc': string;
  'admin.issue.teamsTabSteps': string;
  'admin.issue.newUser': string;
  'admin.issue.newUserDesc': string;
  'admin.issue.newUserSteps': string;
  'admin.issue.aiSlow': string;
  'admin.issue.aiSlowDesc': string;
  'admin.issue.aiSlowSteps': string;
  'admin.issue.forbidden': string;
  'admin.issue.forbiddenDesc': string;
  'admin.issue.forbiddenSteps': string;
  'admin.issue.kbPartial': string;
  'admin.issue.kbPartialDesc': string;
  'admin.issue.kbPartialSteps': string;

  // Workspace navigation (wedge V1 amendment 2026-05-16: Frame → Process, Analysis → Analyze)
  'workspace.process': string;
  'workspace.explore': string;
  'workspace.analyze': string;
  'workspace.improvement': string;
  'workspace.improve': string;
  'workspace.project': string;
  'workspace.report': string;
  'workspace.findings': string;

  // Synthesis card
  'synthesis.title': string;
  'synthesis.placeholder': string;
  'synthesis.coachNudge': string;
  'synthesis.maxLength': string;

  // Improvement workspace
  'improve.title': string;
  'improve.backToAnalysis': string;
  'improve.fourDirections': string;
  'improve.convertToActions': string;
  'improve.noIdeas': string;
  'improve.emptyNoFindings': string;
  'improve.emptyNoSupported': string;
  'improve.selectedCount': string;
  'improve.timeframeBreakdown': string;
  'improve.projectedCpk': string;
  'improve.targetDelta': string;
  'improve.convertedToAction': string;
  'improve.maxRisk': string;
  'improve.totalCost': string;
  'improve.budgetStatus': string;
  'improve.actionsDone': string;
  'improve.overdue': string;
  'improve.addVerification': string;
  'improve.assessOutcome': string;
  'improve.viewActions': string;
  'improve.actions': string;
  'improve.done': string;

  // Brainstorm modal
  'brainstorm.title': string;
  'brainstorm.subtitle': string;
  'brainstorm.selectSubtitle': string;
  'brainstorm.inputPlaceholder': string;
  'brainstorm.doneBrainstorming': string;
  'brainstorm.addToPlan': string;
  'brainstorm.back': string;
  'brainstorm.sparkMore': string;
  'brainstorm.inviteTeam': string;
  'brainstorm.copyLink': string;
  'brainstorm.ideaCount': string;
  'brainstorm.selectedCount': string;
  'brainstorm.parkedLabel': string;
  'brainstorm.triggerButton': string;
  'brainstorm.joinToast.title': string;
  'brainstorm.joinToast.body': string;
  'brainstorm.joinToast.join': string;
  'brainstorm.joinToast.later': string;

  // Timeframe labels (replaces effort)
  'timeframe.label': string;
  'timeframe.justDo': string;
  'timeframe.days': string;
  'timeframe.weeks': string;
  'timeframe.months': string;
  'timeframe.justDo.description': string;
  'timeframe.days.description': string;
  'timeframe.weeks.description': string;
  'timeframe.months.description': string;

  // Cost labels
  'cost.label': string;
  'cost.none': string;
  'cost.low': string;
  'cost.medium': string;
  'cost.high': string;
  'cost.amount': string;
  'cost.budget': string;

  // Risk labels
  'risk.label': string;
  'risk.low': string;
  'risk.medium': string;
  'risk.high': string;
  'risk.veryHigh': string;
  'risk.notSet': string;
  'risk.axis1Label': string;
  'risk.small': string;
  'risk.significant': string;
  'risk.severe': string;
  'risk.none': string;
  'risk.possible': string;
  'risk.immediate': string;
  'risk.preset.process': string;
  'risk.preset.safety': string;
  'risk.preset.environmental': string;
  'risk.preset.quality': string;
  'risk.preset.regulatory': string;
  'risk.preset.brand': string;

  // Prioritization matrix
  'matrix.title': string;
  'matrix.listView': string;
  'matrix.matrixView': string;
  'matrix.yAxis': string;
  'matrix.xAxis': string;
  'matrix.color': string;
  'matrix.preset.bangForBuck': string;
  'matrix.preset.quickImpact': string;
  'matrix.preset.riskReward': string;
  'matrix.preset.budgetView': string;
  'matrix.quickWins': string;
  'matrix.clickToSelect': string;
  'matrix.selected': string;
  'matrix.axis.benefit': string;
  'matrix.axis.timeframe': string;
  'matrix.axis.cost': string;
  'matrix.axis.risk': string;
  'benefit.low': string;
  'benefit.medium': string;
  'benefit.high': string;

  // Idea direction labels (Four Ideation Directions)
  'idea.direction': string;
  'idea.prevent': string;
  'idea.detect': string;
  'idea.simplify': string;
  'idea.eliminate': string;
  'idea.whatIfSimulator': string;
  'idea.askCoScout': string;
  'idea.delete': string;
  'idea.addPlaceholder': string;
  'idea.addButton': string;
  'idea.askCoScoutForIdeas': string;
  'idea.moreOptions': string;
  'idea.riskAssessment': string;

  // Capability suggestion modal
  'capability.suggestion.title': string;
  'capability.suggestion.description': string;
  'capability.suggestion.whatYouSee': string;
  'capability.suggestion.bullet1': string;
  'capability.suggestion.bullet2': string;
  'capability.suggestion.bullet3': string;
  'capability.suggestion.startCapability': string;
  'capability.suggestion.standardView': string;
  'capability.suggestion.footer': string;

  // Question role labels
  'question.primary': string;
  'question.contributing': string;

  // Projected vs actual
  'outcome.projectedVsActual': string;
  'outcome.delta': string;

  // Improvement convergence
  'improve.convergenceNudge': string;

  // Defect detected modal
  'defect.detected.title': string;
  'defect.detected.confidence': string;
  'defect.detected.dataShape': string;
  'defect.detected.defectType': string;
  'defect.detected.count': string;
  'defect.detected.result': string;
  'defect.detected.unitsProduced': string;
  'defect.detected.aggregationUnit': string;
  'defect.detected.dismiss': string;
  'defect.detected.enable': string;
  'defect.detected.stepOfOrigin': string;
  'defect.detected.stepOfOriginHint': string;

  // Factor Intelligence
  'fi.title': string;
  'fi.ranking': string;
  'fi.layer2': string;
  'fi.layer3': string;
  'fi.investigate': string;
  'fi.notSignificant': string;
  'fi.explainsSingle': string;
  'fi.explainsMultiple': string;
  'fi.layer2Locked': string;
  'fi.layer2Current': string;
  'fi.layer3Locked': string;
  'fi.layer3Current': string;
  'fi.best': string;
  'fi.range': string;
  'fi.interactionDetected': string;
  'fi.noInteraction': string;

  // Report workspace view
  'report.cpkLearningLoop': string;
  'report.verdict.effective': string;
  'report.verdict.partiallyEffective': string;
  'report.verdict.notEffective': string;
  'report.cpk.before': string;
  'report.cpk.projected': string;
  'report.cpk.actual': string;
  'report.cpk.pendingVerification': string;
  'report.cpk.metProjection': string;
  'report.cpk.fromProjection': string;
  'report.type.analysisSnapshot': string;
  'report.type.analyzeReport': string;
  'report.type.improvementStory': string;
  'report.sections': string;
  'report.audience.technical': string;
  'report.audience.summary': string;
  'report.workspace.analysis': string;
  'report.workspace.findings': string;
  'report.workspace.improvement': string;
  'report.action.copyAllCharts': string;
  'report.action.saveAsPdf': string;
  'report.selectedCount': string;
  'report.bestProjectedCpk': string;
  'report.meetsTarget': string;
  'report.costCategory': string;
  'report.noCost': string;
  'report.riskLevel': string;

  // Annotations (context menu)
  'annotations.redHighlight': string;
  'annotations.amberHighlight': string;
  'annotations.greenHighlight': string;
  'annotations.active': string;

  // Subgroup configuration
  'subgroup.method': string;
  'subgroup.fixedSize': string;
  'subgroup.byColumn': string;
  'subgroup.configuration': string;
  'subgroup.configureSubgroups': string;

  // Capability suggestion modal
  'capability.specsDetected': string;
  'capability.startCapabilityView': string;
  'capability.cpkTrendSubgroup': string;
  'capability.standardView': string;
  'capability.individualValuesChart': string;
  'capability.switchAnytime': string;
  'capability.type': string;
  'capability.cpkTarget': string;
  'capability.insufficientData': string;
  'capability.meetsTarget': string;
  'capability.marginal': string;
  'capability.belowTarget': string;

  // Data quality
  'quality.dataFile': string;

  // Finding actions
  'finding.addObservation': string;

  // Actions (additional)
  'action.continue': string;
  'action.drillDown': string;
  'action.viewDetails': string;

  // Canvas Wall overlay
  'canvas.wall.shortcutLabel': string;

  // Investigation Wall
  'wall.status.proposed': string;
  'wall.status.evidenced': string;
  'wall.status.confirmed': string;
  'wall.status.refuted': string;
  'wall.status.needsDisconfirmation': string;
  // CS-10 — analyst-owned status: the advisory suggestion chip copy + the
  // analyst-set control label.
  'wall.status.suggestSupported': string;
  'wall.status.setLabel': string;
  'wall.card.hypothesisLabel': string;
  'wall.card.findings': string;
  'wall.card.evidenceGap': string;
  'wall.card.missingColumn': string;
  'wall.card.missingColumnAria': string;
  'wall.card.ariaLabel': string;
  'wall.card.oneStepAway': string;
  'wall.problem.title': string;
  'wall.problem.eventsPerWeek': string;
  'wall.problem.ariaLabel': string;
  'wall.scope.whatIf': string;
  'wall.scope.coverage': string;
  'wall.scope.archive': string;
  'wall.evidence.supports': string;
  'wall.evidence.countsAgainst': string;
  'wall.evidence.contributingFactors': string;
  'wall.factorGlyph.aria': string;
  /** CS-13 crossing-back — aria label for the Wall → Explore jump buttons. */
  'wall.exploreJump.aria': string;
  'wall.disconfirm.prompt': string;
  'wall.disconfirm.descriptionLabel': string;
  'wall.disconfirm.verdictLabel': string;
  'wall.disconfirm.verdictPending': string;
  'wall.disconfirm.verdictSurvived': string;
  'wall.disconfirm.verdictRefuted': string;
  'wall.disconfirm.record': string;
  'wall.disconfirm.cancel': string;
  // FE-2b — the fused "Try to break it" premortem (spec §4.2)
  'wall.disconfirm.tryToBreakIt': string;
  'wall.disconfirm.tryToBreakItHint': string;
  'wall.disconfirm.predictLabel': string;
  'wall.disconfirm.predictPlaceholder': string;
  'wall.disconfirm.predictHint': string;
  'wall.disconfirm.manualFallback': string;
  'wall.disconfirm.verdictSurvivedToast': string;
  'wall.disconfirm.verdictRefutedToast': string;
  // FE-2b — the §4.1 soft caveat for an unbacked survived attempt
  'wall.caveat.unbackedSurvived': string;
  'wall.caveat.backWithTest': string;
  // FE-2b — refute → respawn-sharper (spec §4.2)
  'wall.respawn.sharpenCta': string;
  'wall.respawn.nameLabel': string;
  'wall.respawn.namePlaceholder': string;
  'wall.respawn.carryNote': string;
  'wall.respawn.confirm': string;
  'wall.respawn.cancel': string;
  'wall.respawn.supersededBy': string;
  // FE-2b — the confound sign-prompt + side-by-side What-If (spec §4.2)
  'wall.confound.heading': string;
  'wall.confound.prompt': string;
  'wall.confound.markOpposite': string;
  'wall.confound.notAdditive': string;
  'wall.confound.whatIfFor': string;
  // FE-2b — the activated affordances (spec §4.2)
  'wall.affordance.tryDisconfirmation': string;
  'wall.affordance.oneStepAwayAction': string;
  // ActionItem tasks on hypotheses (IM-4b Task 3)
  'wall.task.addButton': string;
  'wall.task.taskLabel': string;
  'wall.task.save': string;
  'wall.task.cancel': string;
  'wall.task.markDone': string;
  // Plan-owner data-collection task surface (IM-4b Task 4)
  'wall.collect.assigned': string;
  'wall.collect.status.planned': string;
  'wall.collect.status.inProgress': string;
  'wall.collect.status.complete': string;
  'wall.collect.status.skipped': string;
  'wall.collect.due': string;
  // L-3 suspected-cause activity layer
  'wall.activity.inFlightHeading': string;
  'wall.activity.pendingAttempt': string;
  'wall.activity.stalledHeading': string;
  'wall.activity.planCheck': string;
  'wall.activity.goLook': string;
  'wall.activity.ruleOut': string;
  // PR-CS-11 — analyst-owned plan-status select + re-ingest pending-match prompt (Task 5)
  'wall.collect.setStatusLabel': string;
  'wall.collect.pending.prompt': string;
  'wall.collect.pending.linkFinding': string;
  'wall.collect.pending.markInProgress': string;
  'wall.collect.pending.dismiss': string;
  'wall.gate.and': string;
  'wall.gate.or': string;
  'wall.gate.not': string;
  'wall.gate.holds': string;
  'wall.gate.noTotals': string;
  'wall.gate.ariaLabel': string;
  'wall.tributary.ariaLabel': string;
  'wall.empty.ariaLabel': string;
  'wall.empty.title': string;
  'wall.empty.subtitle': string;
  'wall.empty.writeHypothesis': string;
  'wall.empty.seedFromFactorIntel': string;
  'wall.rail.title': string;
  'wall.rail.openAria': string;
  'wall.rail.closeAria': string;
  'wall.rail.rootAria': string;
  'wall.rail.openButton': string;
  'wall.rail.empty': string;
  'wall.missing.ariaLabel': string;
  'wall.missing.title': string;
  'wall.missing.tagline': string;
  'wall.missing.processMap': string;
  // Collapsible toggle labels (screen-reader-friendly; RPS V1 PR4 Task 19)
  'wall.missing.collapsed': string;
  'wall.missing.expanded': string;
  'wall.canvas.ariaLabel': string;
  'wall.cta.proposeHypothesis': string;
  // Model-builder band (Factors & Evaluation Increment 1)
  'wall.model.bandAriaLabel': string;
  'wall.model.title': string;
  'wall.model.keptHeading': string;
  'wall.model.candidatesHeading': string;
  'wall.model.vitalFewLine': string;
  'wall.model.rSquaredAdj': string;
  'wall.model.factorP': string;
  'wall.model.associationStrength': string;
  'wall.model.deltaR2': string;
  'wall.model.notAVerdict': string;
  'wall.model.deltaR2Caption': string;
  'wall.model.useSuggested': string;
  'wall.model.addToModel': string;
  'wall.model.removeFromModel': string;
  'wall.model.fitOnlyDot': string;
  'wall.model.fitOnlyTooltip': string;
  'wall.model.redundancy': string;
  'wall.model.redundancyDismiss': string;
  'wall.model.vifTooltip': string;
  'wall.model.tooFewRows': string;
  'wall.model.constantInScope': string;
  'wall.model.captureModel': string;
  'wall.model.empty': string;
  'wall.model.capturedText': string;
  // ── Model drawer (ER-3 — "The model behind the ranking") ──
  'modelDrawer.title': string;
  'modelDrawer.subtitle': string;
  'modelDrawer.closeAria': string;
  'modelDrawer.empty': string;
  'modelDrawer.summaryHeading': string;
  'modelDrawer.summaryS': string;
  'modelDrawer.summaryR2': string;
  'modelDrawer.summaryR2adj': string;
  'modelDrawer.summaryN': string;
  'modelDrawer.summaryCaption': string;
  'modelDrawer.equationHeading': string;
  'modelDrawer.equationCaption': string;
  'modelDrawer.coefficientsHeading': string;
  'modelDrawer.coefTerm': string;
  'modelDrawer.coefCoef': string;
  'modelDrawer.coefSE': string;
  'modelDrawer.coefT': string;
  'modelDrawer.coefP': string;
  'modelDrawer.anovaHeading': string;
  'modelDrawer.anovaSource': string;
  'modelDrawer.anovaDF': string;
  'modelDrawer.anovaSS': string;
  'modelDrawer.anovaF': string;
  'modelDrawer.anovaP': string;
  'modelDrawer.anovaError': string;
  'modelDrawer.anovaTotal': string;
  'modelDrawer.anovaCaption': string;
  'modelDrawer.ladderHeading': string;
  'modelDrawer.ladderModel': string;
  'modelDrawer.ladderTerms': string;
  'modelDrawer.ladderR2': string;
  'modelDrawer.ladderR2adj': string;
  'modelDrawer.ladderShown': string;
  'modelDrawer.ladderNote': string;
  'modelDrawer.predictHeading': string;
  'modelDrawer.predictResult': string;
  'modelDrawer.predictNoCell': string;
  'modelDrawer.predictCaption': string;
  'modelDrawer.constantInScope': string;
  'modelDrawer.captureModel': string;
  'modelDrawer.warningRankDeficient': string;
  /** Scope label used when the Explore drawer is not drilling (full dataset). */
  'modelDrawer.allData': string;
  // Hypothesis test-plan triad (Factors & Evaluation Increment 2a)
  'wall.testplan.heading': string;
  'wall.testplan.toolTwoSample': string;
  'wall.testplan.toolRegression': string;
  'wall.testplan.toolCapability': string;
  'wall.testplan.evaluate': string;
  'wall.testplan.evaluateAria': string;
  'wall.testplan.addPlan': string;
  'wall.testplan.addPlanAria': string;
  'wall.testplan.gapLabel': string;
  'wall.testplan.resultSupports': string;
  'wall.testplan.resultInconclusive': string;
  'wall.testplan.resultContradicts': string;
  'wall.testplan.empty': string;
  // Per-hypothesis What-If (Factors & Evaluation Increment 2a, §5)
  'wall.whatif.heading': string;
  'wall.whatif.projection': string;
  'wall.whatif.noProjection': string;
  // Scale features (Phase 13)
  'wall.toolbar.groupByTributary': string;
  'wall.toolbar.zoomIn': string;
  'wall.toolbar.zoomOut': string;
  'wall.toolbar.resetView': string;
  'wall.palette.placeholder': string;
  'wall.palette.empty': string;
  'wall.palette.kind.hub': string;
  'wall.palette.kind.finding': string;
  'wall.minimap.ariaLabel': string;
  // Brush-to-finding confirmation flow (RPS V1 PR4 Task 17)
  'wall.brush.confirmIChart': string;
  'wall.brush.confirmIChartNoFactor': string;
  'wall.brush.confirmBoxplot': string;
  'wall.brush.confirmBoxplotNoFactor': string;
  'wall.brush.pin': string;
  'wall.brush.cancel': string;
  'wall.brush.dialogAriaLabel': string;

  // FRAME b0 lightweight render
  'frame.b0.q1.headline': string;
  'frame.b0.q1.hint': string;
  'frame.b0.q2.headline': string;
  'frame.b0.q2.hint': string;
  'frame.b0.q2.bridge': string;
  'frame.b0.runOrderHint': string;
  'frame.b0.addProcessSteps.label': string;
  'frame.b0.addProcessSteps.helper': string;
  'frame.b0.addHypothesis.label': string;
  'frame.b0.addHypothesis.helper': string;
  'frame.b0.seeData.cta': string;
  'frame.b0.seeData.pickYHint': string;
  'frame.b0.step.addCtq': string;
  'frame.b0.q1.empty': string;
  'frame.b0.q1.emptyRanked': string;
  'frame.b0.q2.empty': string;
  'frame.b0.aria.yCandidates': string;
  'frame.b0.aria.selectedXs': string;
  'frame.b0.aria.availableXs': string;
  'frame.canvasOverlay.cta.control.notReady': string;
  'frame.canvasOverlay.cta.handoff.notReady': string;
  'frame.b1.heading': string;
  'frame.b1.description': string;
  'frame.spec.notSet': string;
  'frame.spec.set': string;
  'frame.spec.add': string;
  'frame.spec.editor.title': string;
  'frame.spec.editor.usl': string;
  'frame.spec.editor.lsl': string;
  'frame.spec.editor.target': string;
  'frame.spec.editor.cpkTarget': string;
  'frame.spec.editor.suggestedFromData': string;
  'frame.spec.editor.confirm': string;
  'frame.spec.editor.cancel': string;
  'frame.spec.editor.invalidRange': string;

  // Capability (FRAME b0)
  'capability.noSpec.prompt': string;

  // Verify card segmented tabs
  'verify.tabs.label': string;
  'verify.tab.probability': string;
  'verify.tab.distribution': string;
  'verify.tab.capability': string;
  'verify.tab.pareto': string;

  // ProcessHealthBar generic labels
  'healthBar.rows': string;

  // Factor strip (ER-2 — "What explains the variation?")
  'factorStrip.title': string;
  'factorStrip.title.scoped': string;
  'factorStrip.subtitle': string;
  'factorStrip.bridge': string;
  'factorStrip.modelLink': string;
  'factorStrip.modelLink.stub': string;
  'factorStrip.star.title': string;
  'factorStrip.stepBadge.title': string;
  'factorStrip.binned': string;
  'factorStrip.examined': string;
  'factorStrip.chip.hover': string;
  'factorStrip.residual': string;
  'factorStrip.residual.hover': string;
  'factorStrip.alsoScreened': string;
  'factorStrip.whatif.label': string;
  'factorStrip.whatif.matched': string;
  'factorStrip.whatif.average': string;
  'factorStrip.whatif.average.scoped': string;
  'factorStrip.whatif.cpk': string;
  'factorStrip.whatif.bridge': string;
  // Boxplot card (factor dropdown absorbed by the strip)
  'boxplot.title.by': string;
  'boxplot.factor.hint': string;

  // Time lens (ProcessHealthBar)
  'timeLens.button': string;
  'timeLens.popover.title': string;
  'timeLens.mode.cumulative': string;
  'timeLens.mode.rolling': string;
  'timeLens.mode.fixed': string;
  'timeLens.mode.openEnded': string;
  'timeLens.input.windowSize': string;
  'timeLens.input.anchor': string;

  // Canvas — SystemLevelView
  'canvas.system.activeAnalyzes': string;
  'canvas.system.conformance': string;
  'canvas.system.inbox': string;
  'canvas.system.lensLabel': string;
  'canvas.system.noNumericOutcome': string;
  'canvas.system.noOutcomePrompts': string;
  'canvas.system.noOutcomeTrend': string;
  'canvas.system.openScout': string;
  'canvas.system.outcomeDistribution': string;
  'canvas.system.outcomeDrift': string;
  'canvas.system.outOfSpecMessage': string;
  'canvas.system.reviewAction': string;

  // Canvas — CanvasLensPicker (toolbar aria + per-lens aria)
  'canvas.lensPicker.ariaLabel': string;
  'canvas.lensPicker.lensAriaLabel': string;
  'canvas.lensPicker.invalidAtLevel': string;

  // Canvas — lens labels & descriptions (used by CanvasLensPicker)
  'canvas.lens.capability.description': string;
  'canvas.lens.capability.label': string;
  'canvas.lens.default.description': string;
  'canvas.lens.default.label': string;
  'canvas.lens.defect.description': string;
  'canvas.lens.defect.label': string;
  'canvas.lens.performance.description': string;
  'canvas.lens.performance.label': string;
  'canvas.lens.processFlow.description': string;
  'canvas.lens.processFlow.label': string;

  // Canvas — NoFocalStepPrompt
  'canvas.noFocalStep.ariaLabel': string;
  'canvas.noFocalStep.description': string;
  'canvas.noFocalStep.heading': string;
  'canvas.noFocalStep.noStepsHint': string;
  'canvas.noFocalStep.openStepAria': string;

  // Canvas — MobileLevelPicker
  'canvas.mobile.ariaLabel': string;
  'canvas.mobile.process': string;
  'canvas.mobile.step': string;
  'canvas.mobile.system': string;

  // Canvas — AuthorL3View
  'canvas.authorL3.assignedColumns': string;
  'canvas.authorL3.ctqHeading': string;
  'canvas.authorL3.dropHint': string;
  'canvas.authorL3.dropTargetAria': string;
  'canvas.authorL3.dropTargetAriaWithChip': string;
  'canvas.authorL3.noAssignedColumns': string;
  'canvas.authorL3.noCtqContext': string;
  'canvas.authorL3.noTributaryContext': string;
  'canvas.authorL3.selectedStep': string;
  'canvas.authorL3.tributaryColumns': string;
  'canvas.authorL3.unassignedColumns': string;

  // Canvas — LocalMechanismView
  'canvas.localMechanism.actionButton': string;
  'canvas.localMechanism.etaSquaredLabel': string;
  'canvas.localMechanism.factorContribution': string;
  'canvas.localMechanism.logActionAria': string;
  'canvas.localMechanism.noNumericValues': string;
  'canvas.localMechanism.openChartAria': string;
  'canvas.localMechanism.openColumnAria': string;
  'canvas.localMechanism.quickActionTitle': string;
  'canvas.localMechanism.control': string;
  'canvas.localMechanism.handoff': string;
  'canvas.localMechanism.controlAria': string;
  'canvas.localMechanism.handoffAria': string;
  // ── Condition pill (ER-4 — one pattern for minting a condition from a chart gesture) ──
  /** Default statistic label rendered before the in-vs-out means (caller may override). */
  'conditionPill.statDefault': string;
  /** Copy with the in-vs-out mean comparison: "{gesture}{summary} · n={n} · {statLabel} {meanIn} vs {meanOut}". */
  'conditionPill.summaryWithMeans': string;
  /** Copy without means: "{gesture}{summary} · n={n}". */
  'conditionPill.summaryNoMeans': string;
  'conditionPill.capture': string;
  'conditionPill.apply': string;
  'conditionPill.ariaLabel': string;
  // ── Scope bar (ER-4 — the conditional "Viewing condition" row under the context line) ──
  'scopeBar.viewing': string;
  /** Row-count fragment: "{nIn} of {nTotal} rows". */
  'scopeBar.rows': string;
  'scopeBar.clear': string;
  'scopeBar.analyze': string;
  /** Accessible label for the whole row: "Viewing condition: {label}". */
  'scopeBar.ariaLabel': string;
}
