import type { MessageCatalog } from '../types';

/** Ukrainian message catalog */
export const uk: MessageCatalog = {
  // Statistics labels
  'stats.mean': 'Середнє',
  'stats.median': 'Медіана',
  'stats.stdDev': 'Ст. відх.',
  'stats.samples': 'Зразки',
  'stats.passRate': 'Частка відповідності',
  'stats.range': 'Розмах',
  'stats.min': 'Мін',
  'stats.max': 'Макс',
  'stats.target': 'Ціль',
  'stats.sigma': 'Сигма',

  // Chart labels
  'chart.observation': 'Спостереження',
  'chart.count': 'Кількість',
  'chart.frequency': 'Частота',
  'chart.value': 'Значення',
  'chart.category': 'Категорія',
  'chart.cumulative': 'Кумулятивний %',
  'chart.clickToEdit': 'Натисніть для редагування',
  'chart.median': 'Медіана',
  'chart.q1': 'Q1',
  'chart.q3': 'Q3',
  'chart.noChannelData': 'Немає даних каналу',
  'chart.selectChannel': 'Обрати канал',

  // Limit labels (DSTU/GOST standards)
  'limits.usl': 'ВГД',
  'limits.lsl': 'НГД',
  'limits.ucl': 'ВКГ',
  'limits.lcl': 'НКГ',
  'limits.mean': 'Середнє',
  'limits.target': 'Ціль',

  // Navigation
  'nav.newAnalysis': 'Новий аналіз',
  'nav.backToDashboard': 'Назад до панелі',
  'nav.settings': 'Налаштування',
  'nav.export': 'Експорт',
  'nav.presentation': 'Презентація',
  'nav.menu': 'Меню',
  'nav.moreActions': 'Більше дій',

  // Panel titles
  'panel.findings': 'Висновки',
  'panel.dataTable': 'Таблиця даних',
  'panel.whatIf': 'Що якщо',
  'panel.investigation': 'Дослідження',
  'panel.coScout': 'CoScout',
  'panel.drillPath': 'Шлях деталізації',

  // View modes
  'view.list': 'Список',
  'view.board': 'Дошка',
  'view.tree': 'Дерево',

  // Action buttons
  'action.save': 'Зберегти',
  'action.cancel': 'Скасувати',
  'action.delete': 'Видалити',
  'action.edit': 'Редагувати',
  'action.copy': 'Копіювати',
  'action.close': 'Закрити',
  'action.learnMore': 'Дізнатися більше',
  'action.download': 'Завантажити',
  'action.apply': 'Застосувати',
  'action.reset': 'Скинути',
  'action.retry': 'Повторити',
  'action.send': 'Надіслати',
  'action.ask': 'Запитати',
  'action.clear': 'Очистити',
  'action.copyAll': 'Копіювати все',
  'action.selectAll': 'Вибрати все',

  // CoScout
  'coscout.send': 'Надіслати',
  'coscout.clear': 'Очистити розмову',
  'coscout.stop': 'Зупинити',
  'coscout.rateLimit': 'Досягнуто ліміт запитів. Зачекайте, будь ласка.',
  'coscout.contentFilter': 'Вміст відфільтровано політикою безпеки.',
  'coscout.error': 'Сталася помилка. Спробуйте ще раз.',

  // Display/settings
  'display.preferences': 'Налаштування',
  'display.chartTextSize': 'Розмір тексту діаграми',
  'display.compact': 'Компактний',
  'display.normal': 'Звичайний',
  'display.large': 'Великий',
  'display.lockYAxis': 'Зафіксувати вісь Y',
  'display.filterContext': 'Контекст фільтра',
  'display.showSpecs': 'Показати специфікації',

  // Investigation
  'investigation.brief': 'Звіт дослідження',
  'investigation.assignedToMe': 'Призначені мені',
  'investigation.hypothesis': 'Гіпотеза',
  'investigation.hypotheses': 'Гіпотези',
  'investigation.pinAsFinding': 'Закріпити як висновок',
  'investigation.addObservation': 'Додати спостереження',

  // Empty states
  'empty.noData': 'Немає доступних даних',
  'empty.noFindings': 'Ще немає висновків',
  'empty.noResults': 'Результатів не знайдено',

  // Error messages
  'error.generic': 'Щось пішло не так',
  'error.loadFailed': 'Не вдалося завантажити дані',
  'error.parseFailed': 'Не вдалося обробити файл',

  // Settings labels
  'settings.language': 'Мова',
  'settings.theme': 'Тема',
  'settings.textSize': 'Розмір тексту',

  // Finding statuses
  'findings.observed': 'Спостережено',
  'findings.investigating': 'Досліджується',
  'findings.analyzed': 'Проаналізовано',
  'findings.improving': 'Покращується',
  'findings.resolved': 'Вирішено',

  // Report labels
  'report.summary': 'Підсумок',
  'report.findings': 'Висновки',
  'report.recommendations': 'Рекомендації',
  'report.evidence': 'Докази',

  // Data input labels
  'data.pasteData': 'Вставити дані',
  'data.uploadFile': 'Завантажити файл',
  'data.columnMapping': 'Відповідність стовпців',
  'data.measureColumn': 'Стовпець вимірювань',
  'data.factorColumn': 'Стовпець фактора',
  'data.addData': 'Додати дані',
  'data.editData': 'Редагувати дані',
  'data.showDataTable': 'Показати таблицю даних',
  'data.hideDataTable': 'Сховати таблицю даних',

  // Status
  'status.cached': 'Кешовано',
  'status.loading': 'Завантаження',
  'status.ai': 'ШІ',

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
