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
  'display.density': string;
  'display.lockYAxis': string;
  'display.filterContext': string;
  'display.showSpecs': string;

  // Investigation
  'investigation.brief': string;
  'investigation.assignedToMe': string;
  'investigation.question': string;
  'investigation.questions': string;
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
  'data.addQuestion': string;
  'data.removeQuestion': string;
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
  'ai.tool.suggestSuspectedCause': string;
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
  'investigation.trackingPrompt': string;

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
  'admin.plan': string;
  'admin.teams': string;
  'admin.knowledge': string;
  'admin.troubleshooting': string;

  // Admin plan tab
  'admin.currentPlan': string;
  'admin.feature': string;
  'admin.manageSubscription': string;
  'admin.planStandard': string;
  'admin.planTeam': string;
  'admin.planStandardPrice': string;
  'admin.planTeamPrice': string;
  'admin.planStandardDesc': string;
  'admin.planTeamDesc': string;

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

  // Workspace navigation
  'workspace.analysis': string;
  'workspace.findings': string;
  'workspace.improvement': string;

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

  // Yamazumi (Time Study)
  'yamazumi.detected.title': string;
  'yamazumi.detected.confidence': string;
  'yamazumi.detected.description': string;
  'yamazumi.detected.activityType': string;
  'yamazumi.detected.cycleTime': string;
  'yamazumi.detected.step': string;
  'yamazumi.detected.reason': string;
  'yamazumi.detected.taktTime': string;
  'yamazumi.detected.taktPlaceholder': string;
  'yamazumi.detected.decline': string;
  'yamazumi.detected.enable': string;

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

  'yamazumi.metric.total': string;
  'yamazumi.metric.va': string;
  'yamazumi.metric.nva': string;
  'yamazumi.metric.waste': string;
  'yamazumi.metric.wait': string;
  'yamazumi.pareto.steps-total': string;
  'yamazumi.pareto.steps-waste': string;
  'yamazumi.pareto.steps-nva': string;
  'yamazumi.pareto.activities': string;
  'yamazumi.pareto.reasons': string;
  'yamazumi.summary.vaRatio': string;
  'yamazumi.summary.efficiency': string;
  'yamazumi.summary.leadTime': string;
  'yamazumi.summary.takt': string;
  'yamazumi.summary.setTakt': string;
  'yamazumi.summary.overTakt': string;
  'yamazumi.takt': string;
  'yamazumi.mode.label': string;
  'yamazumi.mode.switch': string;

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
  'report.questionTree': string;
  'report.question.answered': string;
  'report.question.investigating': string;
  'report.question.ruledOut': string;
  'report.question.open': string;
  'report.type.analysisSnapshot': string;
  'report.type.investigationReport': string;
  'report.type.improvementStory': string;
  'report.sections': string;
  'report.audience.technical': string;
  'report.audience.summary': string;
  'report.workspace.analysis': string;
  'report.workspace.findings': string;
  'report.workspace.improvement': string;
  'report.action.copyAllCharts': string;
  'report.action.saveAsPdf': string;
  'report.action.shareReport': string;
  'report.action.publishToSharePoint': string;
  'report.action.publishedToSharePoint': string;
  'report.publish.rendering': string;
  'report.publish.uploading': string;
  'report.publish.exists': string;
  'report.publish.replace': string;
  'report.publish.failed': string;
  'report.publish.tryAgain': string;
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

  // Upgrade (additional)
  'upgrade.freeTierLimitation': string;
  'upgrade.fromPrice': string;

  // Investigation Wall
  'wall.status.proposed': string;
  'wall.status.evidenced': string;
  'wall.status.confirmed': string;
  'wall.status.refuted': string;
  'wall.card.hypothesisLabel': string;
  'wall.card.findings': string;
  'wall.card.evidenceGap': string;
  'wall.card.missingColumn': string;
  'wall.card.missingColumnAria': string;
  'wall.card.ariaLabel': string;
  'wall.problem.title': string;
  'wall.problem.eventsPerWeek': string;
  'wall.problem.ariaLabel': string;
  'wall.gate.and': string;
  'wall.gate.or': string;
  'wall.gate.not': string;
  'wall.gate.holds': string;
  'wall.gate.noTotals': string;
  'wall.gate.ariaLabel': string;
  'wall.question.ariaLabel': string;
  'wall.tributary.ariaLabel': string;
  'wall.empty.ariaLabel': string;
  'wall.empty.title': string;
  'wall.empty.subtitle': string;
  'wall.empty.writeHypothesis': string;
  'wall.empty.promoteFromQuestion': string;
  'wall.empty.seedFromFactorIntel': string;
  'wall.rail.title': string;
  'wall.rail.openAria': string;
  'wall.rail.closeAria': string;
  'wall.rail.rootAria': string;
  'wall.rail.openButton': string;
  'wall.rail.empty': string;
  'wall.missing.ariaLabel': string;
  'wall.missing.title': string;
  'wall.canvas.ariaLabel': string;
  'wall.cta.proposeHypothesis': string;
}
