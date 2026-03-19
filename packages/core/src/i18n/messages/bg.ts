import type { MessageCatalog } from '../types';

/** Bulgarian message catalog */
export const bg: MessageCatalog = {
  // Statistics labels
  'stats.mean': 'Средна стойност',
  'stats.median': 'Медиана',
  'stats.stdDev': 'Стд. отклонение',
  'stats.samples': 'Проби',
  'stats.passRate': 'Процент годни',
  'stats.range': 'Размах',
  'stats.min': 'Мин.',
  'stats.max': 'Макс.',
  'stats.target': 'Цел',
  'stats.sigma': 'Сигма',

  // Chart labels
  'chart.observation': 'Наблюдение',
  'chart.count': 'Брой',
  'chart.frequency': 'Честота',
  'chart.value': 'Стойност',
  'chart.category': 'Категория',
  'chart.cumulative': 'Кумулативен %',
  'chart.clickToEdit': 'Щракнете за редакция',
  'chart.median': 'Медиана',
  'chart.q1': 'Q1',
  'chart.q3': 'Q3',
  'chart.noChannelData': 'Няма данни за канала',
  'chart.selectChannel': 'Изберете канал',

  // Limit labels
  'limits.usl': 'ГГД',
  'limits.lsl': 'ДГД',
  'limits.ucl': 'ГКГ',
  'limits.lcl': 'ДКГ',
  'limits.mean': 'Средна стойност',
  'limits.target': 'Цел',

  // Navigation
  'nav.newAnalysis': 'Нов анализ',
  'nav.backToDashboard': 'Обратно към таблото',
  'nav.settings': 'Настройки',
  'nav.export': 'Експорт',
  'nav.presentation': 'Презентация',
  'nav.menu': 'Меню',
  'nav.moreActions': 'Още действия',

  // Panel titles
  'panel.findings': 'Констатации',
  'panel.dataTable': 'Таблица с данни',
  'panel.whatIf': 'Какво ако',
  'panel.investigation': 'Разследване',
  'panel.coScout': 'CoScout',
  'panel.drillPath': 'Път на детайлизиране',

  // View modes
  'view.list': 'Списък',
  'view.board': 'Табло',
  'view.tree': 'Дърво',

  // Action buttons
  'action.save': 'Запази',
  'action.cancel': 'Отказ',
  'action.delete': 'Изтрий',
  'action.edit': 'Редактирай',
  'action.copy': 'Копирай',
  'action.close': 'Затвори',
  'action.learnMore': 'Научете повече',
  'action.download': 'Изтегли',
  'action.apply': 'Приложи',
  'action.reset': 'Нулирай',
  'action.retry': 'Опитай отново',
  'action.send': 'Изпрати',
  'action.ask': 'Попитай',
  'action.clear': 'Изчисти',
  'action.copyAll': 'Копирай всичко',
  'action.selectAll': 'Избери всичко',

  // CoScout
  'coscout.send': 'Изпрати',
  'coscout.clear': 'Изчисти разговора',
  'coscout.stop': 'Спри',
  'coscout.rateLimit': 'Лимитът на заявки е достигнат. Моля, изчакайте.',
  'coscout.contentFilter': 'Съдържанието е филтрирано от политиката за сигурност.',
  'coscout.error': 'Възникна грешка. Моля, опитайте отново.',

  // Display/settings
  'display.preferences': 'Предпочитания',
  'display.chartTextSize': 'Размер на текста в диаграмата',
  'display.compact': 'Компактно',
  'display.normal': 'Нормално',
  'display.large': 'Голямо',
  'display.lockYAxis': 'Заключи ос Y',
  'display.filterContext': 'Контекст на филтъра',
  'display.showSpecs': 'Покажи спецификации',

  // Investigation
  'investigation.brief': 'Резюме на разследването',
  'investigation.assignedToMe': 'Възложено на мен',
  'investigation.hypothesis': 'Хипотеза',
  'investigation.hypotheses': 'Хипотези',
  'investigation.pinAsFinding': 'Закачи като констатация',
  'investigation.addObservation': 'Добави наблюдение',

  // Empty states
  'empty.noData': 'Няма налични данни',
  'empty.noFindings': 'Все още няма констатации',
  'empty.noResults': 'Няма намерени резултати',

  // Error messages
  'error.generic': 'Нещо се обърка',
  'error.loadFailed': 'Неуспешно зареждане на данните',
  'error.parseFailed': 'Неуспешно обработване на файла',

  // Settings labels
  'settings.language': 'Език',
  'settings.theme': 'Тема',
  'settings.textSize': 'Размер на текста',

  // Finding statuses
  'findings.observed': 'Наблюдавано',
  'findings.investigating': 'В разследване',
  'findings.analyzed': 'Анализирано',
  'findings.improving': 'В подобрение',
  'findings.resolved': 'Разрешено',

  // Report labels
  'report.summary': 'Обобщение',
  'report.findings': 'Констатации',
  'report.recommendations': 'Препоръки',
  'report.evidence': 'Доказателства',

  // Data input labels
  'data.pasteData': 'Поставяне на данни',
  'data.uploadFile': 'Качване на файл',
  'data.columnMapping': 'Съпоставяне на колони',
  'data.measureColumn': 'Колона за измерване',
  'data.factorColumn': 'Колона за фактор',
  'data.addData': 'Добави данни',
  'data.editData': 'Редактирай данни',
  'data.showDataTable': 'Покажи таблица с данни',
  'data.hideDataTable': 'Скрий таблица с данни',

  // Status
  'status.cached': 'Кеширано',
  'status.loading': 'Зареждане',
  'status.ai': 'ИИ',

  // Methodology Coach
  'coach.frame': 'Frame',
  'coach.scout': 'Scout',
  'coach.investigate': 'Investigate',
  'coach.improve': 'Improve',
  'coach.frameDesc': 'Define the problem and set boundaries',
  'coach.scoutDesc': 'Gather data and explore patterns',
  'coach.investigateDesc': 'Test hypotheses and find root causes',
  'coach.improveDesc': 'Implement changes and verify results',

  // Report KPIs
  'report.kpi.samples': 'Samples',
  'report.kpi.mean': 'Mean',
  'report.kpi.variation': 'Variation',
  'report.kpi.cpk': 'Cpk',
  'report.kpi.passRate': 'Pass Rate',

  // AI Actions
  'ai.propose': 'Propose',
  'ai.applied': 'Applied',
  'ai.dismissed': 'Dismissed',
  'ai.expired': 'Expired',

  // Staged analysis
  'staged.before': 'Before',
  'staged.after': 'After',
  'staged.comparison': 'Comparison',

  // Data input / Column mapping
  'data.mapHeading': 'Map Your Data',
  'data.confirmColumns': 'Confirm Columns',
  'data.selectOutcome': 'Select Outcome',
  'data.selectFactors': 'Select Factors',
  'data.analysisSection': 'Analysis Brief',
  'data.optional': 'optional',
  'data.problemPlaceholder': 'Describe the problem you are investigating…',
  'data.outcomeDesc': 'The measurement you want to analyze',
  'data.factorsDesc': 'Categories that might influence the outcome',
  'data.alreadyOutcome': 'Already selected as outcome',
  'data.showNumericOnly': 'Numeric only',
  'data.showCategoricalOnly': 'Categorical only',
  'data.showAllColumns': 'All columns',
  'data.improvementTarget': 'Improvement target',
  'data.metric': 'Metric',
  'data.startAnalysis': 'Start Analysis',
  'data.applyChanges': 'Apply Changes',
  'data.addHypothesis': 'Add hypothesis',
  'data.removeHypothesis': 'Remove hypothesis',
  'data.back': 'Back',

  // Paste screen
  'data.pasteInstructions': 'Paste your data here',
  'data.pasteSubtitle': 'Copy from Excel, CSV, or any spreadsheet',
  'data.useExample': 'Use example data',
  'data.analyzing': 'Analyzing…',
  'data.tipWithData': 'Tip: Include column headers in the first row',
  'data.tipNoData': 'Tip: Try pasting data from a spreadsheet or CSV file',

  // Data quality
  'quality.allValid': 'All data valid',
  'quality.rowsReady': '{count} rows ready for analysis',
  'quality.rowsExcluded': '{count} rows excluded',
  'quality.missingValues': 'Missing values',
  'quality.nonNumeric': 'Non-numeric values',
  'quality.noVariation': 'No variation',
  'quality.emptyColumn': 'Empty column',
  'quality.noVariationWarning': 'This column has no variation — all values are identical',
  'quality.viewExcluded': 'View excluded',
  'quality.viewAll': 'View all',

  // Manual entry
  'manual.setupTitle': 'Manual Data Entry',
  'manual.analysisMode': 'Analysis mode',
  'manual.standard': 'Standard',
  'manual.standardDesc': 'Single measurement column with optional factors',
  'manual.performance': 'Performance',
  'manual.performanceDesc': 'Multiple measurement channels (fill heads, cavities)',
  'manual.outcome': 'Outcome column',
  'manual.outcomeExample': 'e.g. Weight, Length, Temperature',
  'manual.factors': 'Factors',
  'manual.addFactor': 'Add factor',
  'manual.measureLabel': 'Measure label',
  'manual.measureExample': 'e.g. Fill Head, Cavity, Nozzle',
  'manual.channelCount': 'Number of channels',
  'manual.channelRange': '{min}–{max} channels',
  'manual.startEntry': 'Start Entry',
  'manual.specs': 'Specifications',
  'manual.specsApplyAll': 'Apply to all channels',
  'manual.specsHelper': 'Set specification limits for the outcome column',

  // Chart legend
  'chart.legend.commonCause': 'Common Cause',
  'chart.legend.specialCause': 'Special Cause',
  'chart.legend.outOfSpec': 'Out-of-Spec',
  'chart.legend.inControl': 'In-Control',
  'chart.legend.randomVariation': 'Random variation',
  'chart.legend.defect': 'Customer defect',

  // Chart violations
  'chart.violation.aboveUsl': 'Above USL ({value})',
  'chart.violation.belowLsl': 'Below LSL ({value})',
  'chart.violation.aboveUcl': 'Above UCL — special cause',
  'chart.violation.belowLcl': 'Below LCL — special cause',
  'chart.violation.aboveUclFavorable': 'Above UCL — favorable shift',
  'chart.violation.belowLclFavorable': 'Below LCL — favorable shift',
  'chart.violation.nelson2': 'Nelson Rule 2 — run of {count}',
  'chart.violation.nelson3': 'Nelson Rule 3 — trend of {count}',

  // Investigation sidebar
  'investigation.phaseInitial': 'Gather initial observations',
  'investigation.phaseDiverging': 'Explore multiple hypotheses',
  'investigation.phaseValidating': 'Test and validate hypotheses',
  'investigation.phaseConverging': 'Narrow to root cause',
  'investigation.phaseImproving': 'Implement and verify changes',
  'investigation.pdcaTitle': 'Verification Checklist',
  'investigation.verifyChart': 'I-Chart stable after change',
  'investigation.verifyStats': 'Cpk meets target',
  'investigation.verifyBoxplot': 'Boxplot spread reduced',
  'investigation.verifySideEffects': 'No side effects observed',
  'investigation.verifyOutcome': 'Outcome sustained over time',
  'investigation.uninvestigated': 'Uninvestigated Factors',

  // Coach mobile phase titles
  'coach.frameTitle': 'Frame the Problem',
  'coach.scoutTitle': 'Scout the Data',
  'coach.investigateTitle': 'Investigate Causes',
  'coach.improveTitle': 'Improve the Process',

  // AI action tool labels
  'ai.tool.applyFilter': 'Apply filter',
  'ai.tool.clearFilters': 'Clear filters',
  'ai.tool.switchFactor': 'Switch factor',
  'ai.tool.createFinding': 'Create finding',
  'ai.tool.createHypothesis': 'Create hypothesis',
  'ai.tool.suggestAction': 'Suggest action',
  'ai.tool.shareFinding': 'Share finding',
  'ai.tool.publishReport': 'Publish report',
  'ai.tool.notifyOwners': 'Notify owners',

  // Report
  'report.kpi.inSpec': 'In Spec',

  // Table
  'table.noData': 'No data to display',
  'table.page': 'Page {page} of {total}',
  'table.rowsPerPage': 'Rows per page',
  'table.editHint': 'Click a cell to edit',
  'table.excluded': 'Excluded',
  'table.deleteRow': 'Delete row',
  'table.addRow': 'Add row',
  'table.unsavedChanges': 'Unsaved changes',

  // Specs
  'specs.title': 'Specification Limits',
  'specs.advancedSettings': 'Advanced settings',
  'specs.apply': 'Apply specifications',
  'specs.noChanges': 'No changes to apply',
  'specs.editTitle': 'Edit Specifications',
  'specs.lslLabel': 'Lower Specification Limit (LSL)',
  'specs.uslLabel': 'Upper Specification Limit (USL)',

  // Upgrade
  'upgrade.title': 'Upgrade Available',
  'upgrade.limitReached': 'You have reached the limit for this feature',
  'upgrade.upgrade': 'Upgrade',
  'upgrade.viewOptions': 'View options',
  'upgrade.featureLimit': '{feature} is limited to {limit} in this plan',

  // Display toggles
  'display.violin': 'Violin plot',
  'display.violinDesc': 'Show distribution shape',
  'display.contribution': 'Contribution',
  'display.contributionDesc': 'Show variation contribution',
  'display.sort': 'Sort',
  'display.ascending': 'Ascending',
  'display.descending': 'Descending',

  // Stats panel
  'stats.summary': 'Summary Statistics',
  'stats.histogram': 'Histogram',
  'stats.probPlot': 'Probability Plot',
  'stats.editSpecs': 'Edit specifications',

  // WhatIf
  'whatif.adjustMean': 'Adjust mean',
  'whatif.reduceVariation': 'Reduce variation',
  'whatif.currentProjected': 'Current vs Projected',
  'whatif.resetAdjustments': 'Reset adjustments',
  'whatif.yield': 'Projected yield',

  // Parameterized messages
  'data.rowsLoaded': '{count} rows loaded',
  'findings.countLabel': '{count} findings',
};
