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
  'panel.analyze': 'Разследване',
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
  'display.density': 'Плътност на дисплея',
  'display.lockYAxis': 'Заключи ос Y',
  'display.filterContext': 'Контекст на филтъра',
  'display.showSpecs': 'Покажи спецификации',

  // Investigation
  'analyze.brief': 'Резюме на разследването',
  'analyze.assignedToMe': 'Възложено на мен',
  'analyze.pinAsFinding': 'Закачи като констатация',
  'analyze.addObservation': 'Добави наблюдение',

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
  'data.issueStatementPlaceholder': 'Describe what you want to investigate…',
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

  // Analyze sidebar
  'analyze.phaseInitial': 'Gather initial observations',
  'analyze.phaseDiverging': 'Explore multiple questions',
  'analyze.phaseValidating': 'Test and validate questions',
  'analyze.phaseConverging': 'Narrow to contribution',
  'analyze.phaseImproving': 'Implement and verify changes',
  'analyze.pdcaTitle': 'Verification Checklist',
  'analyze.verifyChart': 'I-Chart stable after change',
  'analyze.verifyStats': 'Cpk meets target',
  'analyze.verifyBoxplot': 'Boxplot spread reduced',
  'analyze.verifySideEffects': 'No side effects observed',
  'analyze.verifyOutcome': 'Outcome sustained over time',
  'analyze.unanalyzed': 'Uninvestigated Factors',

  // AI action tool labels
  'ai.tool.applyFilter': 'Apply filter',
  'ai.tool.clearFilters': 'Clear filters',
  'ai.tool.switchFactor': 'Switch factor',
  'ai.tool.createFinding': 'Create finding',
  'ai.tool.createQuestion': 'Create question',
  'ai.tool.suggestAction': 'Suggest action',
  'ai.tool.shareFinding': 'Share finding',
  'ai.tool.publishReport': 'Publish report',
  'ai.tool.notifyOwners': 'Notify owners',
  'ai.tool.suggestIdea': 'Suggest improvement idea',
  'ai.tool.sparkBrainstorm': 'Spark brainstorm ideas',
  'ai.tool.suggestSaveFinding': 'Save insight',
  'ai.tool.navigateTo': 'Navigate to',
  'ai.tool.answerQuestion': 'Answer question',
  'ai.tool.suggestHypothesis': 'Suggest hypothesis',
  'ai.tool.connectHubEvidence': 'Connect hub evidence',
  'ai.tool.suggestCausalLink': 'Suggest causal link',
  'ai.tool.highlightMapPattern': 'Highlight map pattern',

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
  'table.showAll': 'Show all',

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
  'display.etaSquared': 'η²',
  'display.etaSquaredDesc': 'Show η² (effect size)',
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

  // Chart violation details (parameterized)
  'chart.violation.nelson2.detail':
    'Правило на Нелсън 2 — серия {count} {side} средното (#{start}–{end})',
  'chart.violation.nelson3.detail':
    'Правило на Нелсън 3 — тенденция {count} {direction} (#{start}–{end})',
  'chart.violation.side.above': 'над',
  'chart.violation.side.below': 'под',
  'chart.violation.direction.increasing': 'нарастващ',
  'chart.violation.direction.decreasing': 'намаляващ',

  // Parameterized messages
  'data.rowsLoaded': '{count} rows loaded',
  'findings.countLabel': '{count} констатации',
  'chart.label.target': 'Цел:',

  // Chart limit labels
  'chart.label.ucl': 'ГКГ:',
  'chart.label.lcl': 'ДКГ:',
  'chart.label.mean': 'Средна:',
  'chart.label.tgt': 'Цел:',
  'chart.label.usl': 'ГГД:',
  'chart.label.lsl': 'ДГД:',
  'chart.label.value': 'Стойност:',
  'chart.label.n': 'n:',

  // Chart status
  'chart.status.inControl': 'Под контрол',
  'chart.status.outOfControl': 'Извън контрол (извън ГКГ/ДКГ)',
  'chart.noDataProbPlot': 'Няма налични данни за графика на вероятности',

  // Chart edit affordances
  'chart.edit.spec': 'Щракнете за редакция на {spec}',
  'chart.edit.axisLabel': 'Щракнете за редакция на етикета на оста',
  'chart.edit.yAxis': 'Щракнете за редакция на скалата на Y-оста',
  'chart.edit.saveCancel': 'Enter за запис · Esc за отмяна',

  // Performance table headers
  'chart.table.channel': 'Канал',
  'stats.cp': 'Cp',

  // Chart UI labels
  'chart.copyToClipboard': 'Копиране на графиката в клипборда',
  'chart.maximize': 'Увеличаване на графиката',
  'chart.type.ichart': 'I-Chart',
  'chart.type.boxplot': 'Boxplot',
  'chart.type.pareto': 'Pareto',
  'chart.drillHere': '↓ детайли тук',
  'chart.percent': 'Процент',
  'boxplot.factor.label': 'Factor',

  // Y-axis popover
  'chart.yAxisScale': 'Скала на Y-оста',
  'validation.minLessThanMax': 'Мин. трябва да е по-малко от Макс.',
  'action.noChanges': 'Няма промени',

  // Create factor modal
  'factor.create': 'Създаване на фактор от избор',
  'factor.name': 'Име на фактор',
  'factor.nameEmpty': 'Името на фактора не може да е празно',
  'factor.nameExists': 'Фактор с това име вече съществува',
  'factor.example': 'напр. Събития при висока температура',
  'factor.pointsMarked': '{count} точки ще бъдат маркирани като:',
  'factor.createAndFilter': 'Създаване и филтриране',
  'factor.filterExplanation':
    'Изгледът автоматично ще бъде филтриран да показва само избраните точки.',

  // Characteristic type selector
  'charType.nominal': 'Номинален',
  'charType.nominalDesc': 'Центриран спрямо целта (напр. тегло на пълнене)',
  'charType.smaller': 'По-малко е по-добре',
  'charType.smallerDesc': 'По-ниско е по-добре (напр. дефекти)',
  'charType.larger': 'По-голямо е по-добре',
  'charType.largerDesc': 'По-високо е по-добре (напр. добив)',

  // Analyze prompt
  'analyze.trackingPrompt':
    'Проследяване на вашето разследване — отворете панела за разследване за пълната картина.',

  // Mobile category sheet
  'chart.highlight': 'Маркиране:',
  'chart.highlightRed': 'Червено',
  'chart.highlightAmber': 'Кехлибарено',
  'chart.highlightGreen': 'Зелено',
  'chart.clearHighlight': 'Изчистване на маркиране',
  'chart.drillDown': 'Детайли в „{category}"',
  'ai.askCoScout': 'Попитайте CoScout за това',

  // Settings descriptions
  'display.lockYAxisDesc': 'Запазва скалата за визуално сравнение',
  'display.filterContextDesc': 'Показване на резюме на активния филтър под заглавията на графиките',

  // Performance detected modal
  'performance.detected': 'Открит е режим на производителност',
  'performance.columnsFound': 'Намерени са {count} измервателни колони',
  'performance.labelQuestion': 'Какво представляват тези измервателни канали?',
  'performance.labelExample': 'напр. Глава за пълнене, Кухина, Дюза',
  'performance.enable': 'Активиране на режим производителност',

  // Finding editor & data types
  'finding.placeholder': 'Какво открихте?',
  'finding.note': 'Бележка за констатация',
  'data.typeNumeric': 'Числови',
  'data.typeCategorical': 'Категорийни',
  'data.typeDate': 'Дата',
  'data.typeText': 'Текст',
  'outcomeNoMatch.noColumn': 'No column called "{name}". Available numeric columns: {columns}.',
  'outcomeNoMatch.nonNumeric': '"{name}" is not numeric, so it cannot be a Y.',
  'outcomeNoMatch.noNumericColumns': 'no numeric columns',
  'data.categories': 'категории',

  // PWA HomeScreen
  'home.heading': 'Изследване на анализа на вариация',
  'home.description':
    'Безплатен инструмент за обучение по анализ на вариация. Визуализирайте изменчивостта, изчислете способността и открийте къде да фокусирате — направо в браузъра ви.',
  'home.divider': 'или използвайте собствени данни',
  'home.pasteHelper': 'Копирайте редове и поставете — ще разпознаем колоните автоматично',
  'home.manualEntry': 'Или въведете данни ръчно',
  'home.upgradeHint': 'Нуждаете се от екипни функции, качване на файлове или запазени проекти?',

  // PWA navigation
  'nav.presentationMode': 'Режим на презентация',
  'nav.hideFindings': 'Скриване на констатации',

  // Export
  'export.asImage': 'Експорт като изображение',
  'export.asCsv': 'Експорт като CSV',
  'export.imageDesc': 'PNG екранна снимка за презентации',
  'export.csvDesc': 'Файл с данни, съвместим с електронни таблици',

  // Sample section
  'sample.heading': 'Изпробвайте примерен набор от данни',
  'sample.allSamples': 'Всички примерни набори от данни',
  'sample.featured': 'Препоръчани',
  'sample.caseStudies': 'Казуси',
  'sample.journeys': 'Учебни пътувания',
  'sample.industry': 'Индустриални примери',

  // View modes
  'view.stats': 'Статистика',
  'display.appearance': 'Външен вид',

  // Azure toolbar
  'data.manualEntry': 'Ръчно въвеждане',
  'data.editTable': 'Редактиране на таблица с данни',
  'toolbar.saveAs': 'Запис като…',
  'toolbar.saving': 'Записване…',
  'toolbar.saved': 'Записано',
  'toolbar.saveFailed': 'Неуспешен запис',
  'toolbar.addMore': 'Добавяне на данни',
  'report.scouting': 'Доклад за проучване',
  'export.csvFiltered': 'Експорт на филтрирани данни като CSV',
  'error.auth': 'Грешка при удостоверяване',

  // File browse
  'file.browseLocal': 'Преглед на това устройство',
  'file.browseSharePoint': 'Преглед на SharePoint',
  'file.open': 'Отваряне на файл',

  // Admin hub
  'admin.title': 'Администрация',
  'admin.status': 'Статус',
  'admin.teams': 'Настройка на Teams',
  'admin.knowledge': 'База знания',
  'admin.troubleshooting': 'Отстраняване на проблеми',

  // Feature names
  'feature.charts': 'I-Chart, Boxplot, Pareto, Статистика',
  'feature.capability': 'Анализ на способност (Cp/Cpk)',
  'feature.performance': 'Режим на производителност (многоканален)',
  'feature.anova': 'ANOVA и факторен анализ',
  'feature.findingsWorkflow': 'Констатации и работен процес за разследване',
  'feature.whatIf': 'Симулация "какво ако"',
  'feature.csvImport': 'Импорт на CSV/Excel',
  'feature.reportExport': 'Експорт на доклад (PDF)',
  'feature.indexedDb': 'Локално съхранение IndexedDB',
  'feature.maxFactors': 'До 6 фактора',
  'feature.maxRows': 'До 250K реда',
  'feature.onedriveSync': 'Синхронизация на проекти с OneDrive',
  'feature.sharepointPicker': 'Избор на файлове от SharePoint',
  'feature.teamsIntegration': 'Интеграция с Microsoft Teams',
  'feature.channelCollab': 'Сътрудничество по канали',
  'feature.mobileUi': 'Оптимизиран за мобилни UI',
  'feature.coScoutAi': 'Помощник CoScout AI',
  'feature.narrativeBar': 'Прозрения от NarrativeBar',
  'feature.chartInsights': 'Чипове с прозрения за графики',
  'feature.knowledgeBase': 'База знания (търсене в SharePoint)',
  'feature.aiActions': 'Предложени от AI действия',

  // Admin Teams setup
  'admin.teams.heading': 'Добавяне на VariScout към Microsoft Teams',
  'admin.teams.description':
    'Генерирайте пакет за приложение Teams за вашето внедряване и го качете в центъра за администриране на Teams.',
  'admin.teams.running': 'Работи вътре в Microsoft Teams',
  'admin.teams.step1': 'ID на клиент за регистрация на приложение (По избор)',
  'admin.teams.step1Desc':
    'Въведете ID на клиент за регистрация на приложение в Azure AD, за да активирате Teams SSO в манифеста.',
  'admin.teams.step2': 'Изтегляне на пакет за приложение Teams',
  'admin.teams.step2Desc':
    'Този .zip съдържа манифеста и иконите, предварително конфигурирани за вашето внедряване.',
  'admin.teams.step3': 'Качване в центъра за администриране на Teams',
  'admin.teams.step4': 'Добавяне на VariScout към канал',
  'admin.teams.download': 'Изтегляне на пакет за приложение Teams',

  // Admin status tab
  'admin.checksResult': '{pass}/{total} проверки успешни',
  'admin.runChecks': 'Изпълнение на всички проверки',
  'admin.notApplicable': 'Неприложимо за вашия план',
  'admin.managePortal': 'Управление в Azure Portal',
  'admin.portalAccessNote':
    'Тези елементи изискват достъп до Azure Portal и не могат да бъдат проверени от браузъра.',
  'admin.fixInPortal': 'Коригиране в Azure Portal: {label}',

  // Admin troubleshoot tab
  'admin.troubleshoot.intro':
    'Често срещани проблеми и как да ги отстраните. Щракнете върху проблем за инструкции стъпка по стъпка.',
  'admin.runCheck': 'Изпълнение на проверка',
  'admin.checkPassed': 'Проверката е успешна — може да не е проблемът.',
  'admin.checkFailed': 'Проверката е неуспешна — следвайте стъпките по-долу.',
  'admin.issue.signin': 'Потребителите не могат да влязат',
  'admin.issue.signinDesc':
    'Удостоверяването чрез Azure AD не работи или потребителите виждат празна страница.',
  'admin.issue.signinSteps':
    'Проверете дали удостоверяването на App Service е активирано в Azure Portal.\nПроверете дали регистрацията на приложение в Azure AD има правилните URI за пренасочване.\nУверете се, че регистрацията на приложение има активирани „ID tokens" под Удостоверяване.\nПроверете дали наемателят позволява вход на потребители в приложението (Корпоративни приложения → Свойства → Активирано за вход на потребители).',
  'admin.issue.onedrive': 'Синхронизацията с OneDrive не работи',
  'admin.issue.onedriveDesc':
    'Проектите не се синхронизират с OneDrive или потребителите виждат грешки с разрешения.',
  'admin.issue.onedriveSteps':
    'Проверете дали регистрацията на приложение има делегирано разрешение „Files.ReadWrite".\nПроверете дали е дадено съгласие на администратор за разрешенията на Graph.\nУверете се, че на потребителя е присвоен лиценз за OneDrive.\nОпитайте да излезете и да влезете отново, за да обновите токена.',
  'admin.issue.coscout': 'CoScout не отговаря',
  'admin.issue.coscoutDesc': 'AI помощникът не генерира отговори или показва грешки.',
  'admin.issue.coscoutSteps':
    'Проверете дали AI крайната точка е конфигурирана в ARM шаблона / настройките на App Service.\nПроверете дали ресурсът Azure AI Services е внедрен и работи.\nПроверете дали съществува внедряване на модел (напр. gpt-4o) в ресурса AI Services.\nПроверете квотите на Azure AI Services — внедряването може да е достигнало ограниченията на честотата.',
  'admin.issue.kbEmpty': 'Базата знания не връща резултати',
  'admin.issue.kbEmptyDesc':
    '„Търсене в базата знания" на CoScout не намира нищо, въпреки наличието на документи.',
  'admin.issue.kbEmptySteps':
    'Проверете дали крайната точка за AI Search е конфигурирана в настройките на App Service.\nПроверете дали отдалеченият SharePoint източник на знания е създаден в AI Search.\nУверете се, че ≥1 лиценз за Microsoft 365 Copilot е активен в наемателя.\nПроверете дали потребителят има достъп до SharePoint за търсените документи.\nПроверете дали превключвателят за визуализация на базата знания е активиран (Администрация → раздел База знания).',
  'admin.issue.teamsTab': 'Разделът Teams не се показва',
  'admin.issue.teamsTabDesc': 'VariScout не се появява в Teams или разделът не се зарежда.',
  'admin.issue.teamsTabSteps':
    'Проверете дали пакетът за приложение Teams (.zip) е качен в центъра за администриране на Teams.\nПроверете дали contentUrl в manifest.json съвпада с URL адреса на вашия App Service.\nУверете се, че приложението е одобрено в центъра за администриране на Teams (не е блокирано от политика).\nОпитайте да премахнете и да добавите отново раздела в канала.\nАко използвате потребителски домейн, проверете дали е в масива validDomains на манифеста.',
  'admin.issue.newUser': 'Нов потребител няма достъп до приложението',
  'admin.issue.newUserDesc': 'Новодобавен потребител вижда отказан достъп или празна страница.',
  'admin.issue.newUserSteps':
    'В Azure AD отидете на Корпоративни приложения → VariScout → Потребители и групи.\nДобавете потребителя или тяхната група за сигурност към приложението.\nАко се използва „Изисква се присвояване на потребител", уверете се, че потребителят има присвояване.\nПроверете политики за условен достъп, които може да блокират потребителя.',
  'admin.issue.aiSlow': 'Бавни AI отговори',
  'admin.issue.aiSlowDesc': 'CoScout отнема дълго време за отговор или често изтича.',
  'admin.issue.aiSlowSteps':
    'Проверете региона на внедряване на Azure AI Services — забавянето нараства с разстоянието.\nПроверете дали внедряването на модела има достатъчна квота TPM (токени в минута).\nОбмислете надграждане до внедряване с гарантирана пропускателна способност за постоянно забавяне.\nПроверете дали индексът на AI Search е голям — обмислете оптимизиране на източника на знания.',
  'admin.issue.forbidden': 'Грешки „Forbidden"',
  'admin.issue.forbiddenDesc': 'Потребителите виждат грешки 403 при достъп до определени функции.',
  'admin.issue.forbiddenSteps':
    'Проверете дали всички необходими разрешения на Graph API имат съгласие на администратор.\nПроверете дали хранилището за токени за удостоверяване на App Service е активирано.\nУверете се, че токенът на потребителя не е изтекъл — опитайте да излезете и да влезете отново.\nПроверете политики за условен достъп на наемателя.',
  'admin.issue.kbPartial': 'KB не работи за някои потребители',
  'admin.issue.kbPartialDesc':
    'Търсенето в базата знания работи за администратори, но не и за други потребители.',
  'admin.issue.kbPartialSteps':
    'Отдалечените SharePoint източници на знания използват разрешения за всеки потребител. Всеки потребител трябва да има достъп до SharePoint за документите.\nПроверете дали засегнатите потребители са блокирани от политики за условен достъп.\nПроверете дали е дадено съгласие на администратор за делегираното разрешение Sites.Read.All.\nПомолете засегнатите потребители да излязат и да влязат отново, за да обновят токена си.',

  // Workspace navigation
  'workspace.process': 'Process',
  'workspace.explore': 'Explore',
  'workspace.analyze': 'Analyze',
  'workspace.findings': 'Findings',
  'workspace.improvement': 'Improvement',
  'workspace.improve': 'Improve',
  'workspace.project': 'Проект',
  'workspace.report': 'Report',

  // Synthesis card
  'synthesis.title': 'Suspected Cause',
  'synthesis.placeholder': 'The evidence points to…',
  'synthesis.coachNudge': 'Ready to summarize your understanding?',
  'synthesis.maxLength': 'Max 500 characters',

  // Improvement workspace
  'improve.title': 'Improvement Plan',
  'improve.backToAnalysis': 'Back to Analysis',
  'improve.fourDirections': 'Think: Prevent · Detect · Simplify · Eliminate',
  'improve.convertToActions': 'Convert selected → Actions',
  'improve.noIdeas': 'No improvement ideas yet',
  'improve.emptyNoFindings':
    'Pin findings from the Analysis view, then brainstorm improvement ideas here.',
  'improve.emptyNoSupported':
    'Answer your questions in the investigation. Answered questions unlock improvement brainstorming.',
  'improve.selectedCount': '{count} selected',
  'improve.timeframeBreakdown': '{low} low · {medium} med · {high} high',
  'improve.projectedCpk': 'Best projected Cpk: {value}',
  'improve.targetDelta': 'Δ {delta} to target',
  'improve.convertedToAction': '→ Action',

  // Effort labels
  'timeframe.justDo': 'Low',
  'timeframe.weeks': 'Medium',
  'timeframe.months': 'High',
  'timeframe.days': 'Days',
  'timeframe.justDo.description': 'Right now, existing resources, no approval needed',
  'timeframe.days.description': 'Minor coordination, can be done this week',
  'timeframe.weeks.description': 'Requires planning, moderate resources',
  'timeframe.months.description': 'Investment, cross-team, significant planning',
  'cost.label': 'Cost',
  'cost.none': 'None',
  'cost.low': 'Low',
  'cost.medium': 'Medium',
  'cost.high': 'High',
  'cost.amount': '€{amount}',
  'cost.budget': '€{spent} / €{budget}',
  'risk.label': 'Risk',
  'risk.low': 'Low',
  'risk.medium': 'Medium',
  'risk.high': 'High',
  'risk.veryHigh': 'Very high',
  'risk.notSet': 'Not set',
  'risk.axis1Label': '{axis} Impact',
  'risk.small': 'Small',
  'risk.significant': 'Significant',
  'risk.severe': 'Severe',
  'risk.none': 'None',
  'risk.possible': 'Possible',
  'risk.immediate': 'Immediate',
  'risk.preset.process': 'Process',
  'risk.preset.safety': 'Safety',
  'risk.preset.environmental': 'Environmental',
  'risk.preset.quality': 'Quality',
  'risk.preset.regulatory': 'Regulatory',
  'risk.preset.brand': 'Brand',
  'matrix.title': 'Prioritization Matrix',
  'matrix.listView': 'List',
  'matrix.matrixView': 'Matrix',
  'matrix.yAxis': 'Y-Axis',
  'matrix.xAxis': 'X-Axis',
  'matrix.color': 'Color',
  'matrix.preset.bangForBuck': 'Bang for Buck',
  'matrix.preset.quickImpact': 'Quick Impact',
  'matrix.preset.riskReward': 'Risk-Reward',
  'matrix.preset.budgetView': 'Budget View',
  'matrix.quickWins': 'Quick Wins',
  'matrix.clickToSelect': 'Click to select',
  'improve.maxRisk': 'Max risk: {level}',
  'improve.totalCost': '€{amount}',
  'improve.budgetStatus': '€{spent} / €{budget}',
  'improve.actionsDone': 'actions done',
  'improve.overdue': 'overdue',
  'improve.addVerification': 'Add verification',
  'improve.assessOutcome': 'Assess outcome',
  'improve.viewActions': 'View Actions',
  'improve.actions': 'actions',
  'improve.done': 'done',

  // Brainstorm modal
  'brainstorm.title': 'Brainstorm',
  'brainstorm.subtitle': 'No judging yet — just ideas',
  'brainstorm.selectSubtitle': 'Tap ideas to select',
  'brainstorm.inputPlaceholder': '+ type an idea...',
  'brainstorm.doneBrainstorming': 'Done brainstorming →',
  'brainstorm.addToPlan': 'Add {count} to plan →',
  'brainstorm.back': '← Back',
  'brainstorm.sparkMore': 'Spark more',
  'brainstorm.inviteTeam': 'Invite team',
  'brainstorm.copyLink': 'Copy link',
  'brainstorm.ideaCount': '{count} ideas · {directions} directions',
  'brainstorm.selectedCount': '{selected} of {total} selected',
  'brainstorm.parkedLabel': 'Parked ideas',
  'brainstorm.triggerButton': 'Brainstorm',
  'brainstorm.joinToast.title': 'Brainstorm session started',
  'brainstorm.joinToast.body': '{name} started brainstorming ideas for {cause}',
  'brainstorm.joinToast.join': 'Join session',
  'brainstorm.joinToast.later': 'Later',

  'timeframe.label': 'Effort',

  // Idea direction labels (Four Ideation Directions)
  'settings.improvementEvaluation': 'Improvement Evaluation',
  'settings.riskAxis1': 'Risk Axis 1',
  'settings.riskAxis2': 'Risk Axis 2',
  'settings.improvementBudget': 'Improvement Budget',
  'matrix.selected': 'Selected',
  'matrix.axis.benefit': 'Benefit',
  'matrix.axis.timeframe': 'Timeframe',
  'matrix.axis.cost': 'Cost',
  'matrix.axis.risk': 'Risk',
  'benefit.low': 'Low',
  'benefit.medium': 'Medium',
  'benefit.high': 'High',
  'idea.direction': 'Direction',
  'idea.prevent': 'Prevent',
  'idea.detect': 'Detect',
  'idea.simplify': 'Simplify',
  'idea.eliminate': 'Eliminate',
  'idea.whatIfSimulator': 'What-If Simulator',
  'idea.askCoScout': 'Ask CoScout',
  'idea.delete': 'Delete idea',
  'idea.addPlaceholder': 'Add improvement idea...',
  'idea.addButton': 'Add',
  'idea.askCoScoutForIdeas': 'Ask CoScout for ideas',
  'idea.moreOptions': 'More options',
  'idea.riskAssessment': 'Risk assessment',

  // Question role labels
  'question.primary': 'Primary',
  'question.contributing': 'Contributing',
  // Projected vs actual
  'outcome.projectedVsActual': 'Projected {projected} → Actual {actual}',
  'outcome.delta': '({sign}{delta})',
  'improve.convergenceNudge':
    'Your evidence is converging \u2014 summarize what you\u2019ve learned in the Improvement Plan.',

  // Defect detected modal
  'defect.detected.title': 'Defect Data Detected',
  'defect.detected.confidence': 'confidence',
  'defect.detected.dataShape': 'Data shape',
  'defect.detected.defectType': 'Defect type',
  'defect.detected.count': 'Count',
  'defect.detected.result': 'Result',
  'defect.detected.unitsProduced': 'Units produced',
  'defect.detected.aggregationUnit': 'Group defects by',
  'defect.detected.dismiss': 'Use Standard Mode',
  'defect.detected.enable': 'Enable Defect Mode',
  'defect.detected.stepOfOrigin': 'Step of origin',
  'defect.detected.stepOfOriginHint':
    'Identifies which step caught each defect. Optional — defects anchor to outcome when not set.',

  // Report workspace view
  'report.cpkLearningLoop': 'Cpk Learning Loop',
  'report.verdict.effective': 'Effective',
  'report.verdict.partiallyEffective': 'Partially effective',
  'report.verdict.notEffective': 'Not effective',
  'report.cpk.before': 'Before',
  'report.cpk.projected': 'Projected',
  'report.cpk.actual': 'Actual',
  'report.cpk.pendingVerification': 'Pending verification',
  'report.cpk.metProjection': 'Met projection',
  'report.cpk.fromProjection': '{delta} from projection',
  'report.type.analysisSnapshot': 'Analysis Snapshot',
  'report.type.analyzeReport': 'Analyze Report',
  'report.type.improvementStory': 'Improvement Story',
  'report.sections': 'Sections',
  'report.audience.technical': 'Technical',
  'report.audience.summary': 'Summary',
  'report.workspace.analysis': 'ANALYSIS',
  'report.workspace.findings': 'FINDINGS',
  'report.workspace.improvement': 'IMPROVEMENT',
  'report.action.copyAllCharts': 'Copy All Charts',
  'report.action.saveAsPdf': 'Save as PDF',
  'report.selectedCount': '{count} selected',
  'report.bestProjectedCpk': 'Best projected Cpk: {value}',
  'report.meetsTarget': '(meets target)',
  'report.costCategory': '{category} cost',
  'report.noCost': 'No cost',
  'report.riskLevel': '{level} risk',

  // Factor Intelligence
  'fi.title': 'Интелигентност на факторите',
  'fi.ranking': 'Класиране на фактори (R² коригирано)',
  'fi.layer2': 'Слой 2 · Основни ефекти',
  'fi.layer3': 'Слой 3 · Взаимодействия между фактори',
  'fi.investigate': 'Проучи →',
  'fi.notSignificant': 'незначим (p={value})',
  'fi.explainsSingle': '{factor} обяснява {pct}% от вариацията самостоятелно.',
  'fi.explainsMultiple': '{factors} заедно обясняват {pct}% от вариацията.',
  'fi.layer2Locked': 'Слой 2 (Основни ефекти) се отключва при R²adj > {threshold}%',
  'fi.layer2Current': ' — в момента {value}%',
  'fi.layer3Locked': 'Слой 3 (Взаимодействия) се отключва при ≥2 значими фактора',
  'fi.layer3Current': ' — в момента {count} значими',
  'fi.best': 'Най-добър',
  'fi.range': 'Размах',
  'fi.interactionDetected':
    'Открито взаимодействие: ефектът на {factorA} зависи от нивото на {factorB}.',
  'fi.noInteraction': 'Няма значимо взаимодействие — ефектите са приблизително адитивни.',

  // Capability suggestion modal
  'capability.suggestion.title': 'Specification limits set',
  'capability.suggestion.description':
    'Would you like to start with the Capability view to check if your subgroups are meeting the Cpk target?',
  'capability.suggestion.whatYouSee': "What you'll see:",
  'capability.suggestion.bullet1': 'I-Chart plotting Cp and Cpk per subgroup',
  'capability.suggestion.bullet2': 'Whether subgroups consistently meet your target',
  'capability.suggestion.bullet3': 'Centering loss (gap between Cp and Cpk)',
  'capability.suggestion.startCapability': 'Start with Capability View',
  'capability.suggestion.standardView': 'Standard View',
  'capability.suggestion.footer': 'You can switch anytime using the toggle in the I-Chart header.',

  // Annotations
  'annotations.redHighlight': 'Red highlight',
  'annotations.amberHighlight': 'Amber highlight',
  'annotations.greenHighlight': 'Green highlight',
  'annotations.active': 'active',

  // Subgroup
  'subgroup.method': 'Subgroup Method',
  'subgroup.fixedSize': 'Fixed size',
  'subgroup.byColumn': 'By column',
  'subgroup.configuration': 'Subgroup Configuration',
  'subgroup.configureSubgroups': 'Configure subgroups',

  // Capability
  'capability.specsDetected': 'Specification limits detected',
  'capability.startCapabilityView': 'Start Capability View',
  'capability.cpkTrendSubgroup': 'Cpk trend per subgroup',
  'capability.standardView': 'Standard View',
  'capability.individualValuesChart': 'Individual values chart',
  'capability.switchAnytime': 'You can switch anytime using the toggle in the I-Chart header.',
  'capability.type': 'Type:',
  'capability.cpkTarget': 'Cpk target:',
  'capability.insufficientData': 'Insufficient data',
  'capability.meetsTarget': 'Meets target',
  'capability.marginal': 'Marginal',
  'capability.belowTarget': 'Below target',

  // Quality (additional)
  'quality.dataFile': 'Data File',

  // Finding (additional)
  'finding.addObservation': 'Add observation',

  // Action (additional)
  'action.continue': 'Continue',

  'action.drillDown': 'Drill Down',
  'action.viewDetails': 'View Details',

  // Canvas Wall overlay
  'canvas.wall.shortcutLabel': 'Open Wall',

  // Investigation Wall
  'wall.status.proposed': 'Suspected',
  'wall.status.evidenced': 'Suspected',
  'wall.status.confirmed': 'Verified',
  'wall.status.refuted': 'Ruled out',
  'wall.status.needsDisconfirmation': 'Suspected',
  'wall.status.suggestSupported': '2 evidence types + a survived test — mark Verified?',
  'wall.status.setLabel': 'Set status',
  'wall.card.hypothesisLabel': 'Suspected cause',
  'wall.card.findings': '{count} findings',
  'wall.card.evidenceGap': 'Evidence gap',
  'wall.card.missingColumn': '⚠ Condition references missing column',
  'wall.card.missingColumnAria': 'Condition references missing column',
  'wall.card.ariaLabel': 'Suspected cause {name}, {status}, {count} supporting clues',
  'wall.card.oneStepAway':
    '1 step away — running a disconfirmation test would let you mark this Verified',
  'wall.problem.title': 'Problem condition',
  'wall.problem.eventsPerWeek': '{count} events',
  'wall.problem.ariaLabel': 'Problem condition: {column}, Cpk {cpk}, {count} events per week',
  'wall.scope.whatIf': 'If fixed: Cpk {value}',
  'wall.scope.coverage': 'Covers {value}%',
  'wall.evidence.supports': 'Supports',
  'wall.evidence.countsAgainst': 'Counts against',
  'wall.evidence.contributingFactors': 'Contributing factors',
  'wall.factorGlyph.aria': 'Focus factor {factor}',
  'wall.exploreJump.aria': 'Open {factor} in Explore',
  'wall.disconfirm.prompt': 'We tried to break this — did it hold?',
  'wall.disconfirm.descriptionLabel': 'What did you try?',
  'wall.disconfirm.verdictLabel': 'Did it hold?',
  'wall.disconfirm.verdictPending': 'Still checking',
  'wall.disconfirm.verdictSurvived': 'Held up (survived)',
  'wall.disconfirm.verdictRefuted': 'Broke it (refuted)',
  'wall.disconfirm.record': 'Record',
  'wall.disconfirm.cancel': 'Cancel',
  // FE-2b — the fused "Try to break it" premortem (spec §4.2)
  'wall.disconfirm.tryToBreakIt': 'Try to break it',
  'wall.disconfirm.tryToBreakItHint':
    'Predict what would prove this WRONG — the test grades the verdict.',
  'wall.disconfirm.predictLabel': 'What would you expect to see if this is wrong?',
  'wall.disconfirm.predictPlaceholder':
    'e.g. if the night shift drives it, day-shift runs should run cool…',
  'wall.disconfirm.predictHint': 'Optional, but a sharp prediction makes the test severe.',
  'wall.disconfirm.manualFallback': 'Log a gemba or expert disconfirmation (no data)',
  'wall.disconfirm.verdictSurvivedToast': 'Survived — the cause withstood the attempt.',
  'wall.disconfirm.verdictRefutedToast': 'Refuted — the predicted relationship was absent.',
  // FE-2b — the §4.1 soft caveat for an unbacked survived attempt
  'wall.caveat.unbackedSurvived': 'Supported — disconfirmation has no attached evidence',
  'wall.caveat.backWithTest': 'back it with a test →',
  // FE-2b — refute → respawn-sharper (spec §4.2)
  'wall.respawn.sharpenCta': 'Sharpen → propose a new hypothesis',
  'wall.respawn.nameLabel': 'New hypothesis',
  'wall.respawn.namePlaceholder': 'e.g. it’s the spindle, regardless of shift',
  'wall.respawn.carryNote':
    'The refuting finding carries forward as supporting evidence for the new hypothesis.',
  'wall.respawn.confirm': 'Create sharpened hypothesis',
  'wall.respawn.cancel': 'Cancel',
  'wall.respawn.supersededBy': 'superseded by →',
  // FE-2b — the confound sign-prompt + side-by-side What-If (spec §4.2)
  'wall.confound.heading': 'This factor is also cited by a rival cause',
  'wall.confound.prompt': 'Mark the opposite sign on “{rival}”?',
  'wall.confound.markOpposite': 'Counts against the rival',
  'wall.confound.notAdditive':
    'These projections are not additive — each cause is its own What-If.',
  'wall.confound.whatIfFor': 'If you control “{hypothesis}”',
  // FE-2b — the activated affordances (spec §4.2)
  'wall.affordance.tryDisconfirmation': 'Try disconfirmation',
  'wall.affordance.oneStepAwayAction': 'Open the test plan with “Try to break it” ready',
  // ActionItem tasks on hypotheses (IM-4b Task 3)
  'wall.task.addButton': '+ Add Task',
  'wall.task.taskLabel': 'Task description',
  'wall.task.save': 'Save',
  'wall.task.cancel': 'Cancel',
  'wall.task.markDone': 'Mark Done',
  // Plan-owner data-collection task surface (IM-4b Task 4)
  'wall.collect.assigned': 'Assigned: collect {primaryFactor}',
  'wall.collect.status.planned': 'planned',
  'wall.collect.status.inProgress': 'in-progress',
  'wall.collect.status.complete': 'complete',
  'wall.collect.status.skipped': 'skipped',
  'wall.collect.due': 'Due: {date}',
  // PR-CS-11 — analyst-owned plan-status select + re-ingest pending-match prompt (Task 5)
  'wall.collect.setStatusLabel': 'Set plan status',
  'wall.collect.pending.prompt': 'Factor “{column}” arrived — needed by this plan',
  'wall.collect.pending.linkFinding': 'Link finding…',
  'wall.collect.pending.markInProgress': 'Mark in-progress',
  'wall.collect.pending.dismiss': 'Dismiss matched factor',
  'wall.scope.archive': 'Archive scope {condition}',
  'wall.gate.and': 'AND',
  'wall.gate.or': 'OR',
  'wall.gate.not': 'NOT',
  'wall.gate.holds': 'HOLDS {matching}/{total}',
  'wall.gate.noTotals': '—/0',
  'wall.gate.ariaLabel': 'Gate {kind} {holds}',
  'wall.tributary.ariaLabel': 'Tributaries from Process Map',
  'wall.empty.ariaLabel': 'Suspected cause empty state',
  'wall.empty.title': 'Start a suspected cause',
  'wall.empty.subtitle': 'Start from a suspected mechanism, question, or Factor Intelligence.',
  'wall.empty.writeHypothesis': 'Add a suspected cause',
  'wall.empty.seedFromFactorIntel': 'Seed 3 from Factor Intelligence',
  'wall.rail.title': 'CoScout',
  'wall.rail.openAria': 'Open narrator rail',
  'wall.rail.closeAria': 'Close narrator rail',
  'wall.rail.rootAria': 'Narrator rail',
  'wall.rail.openButton': 'Open rail',
  'wall.rail.empty': 'No suggestions yet.',
  'wall.missing.ariaLabel': 'Missing evidence digest',
  'wall.missing.title': 'Missing evidence',
  'wall.missing.tagline': "Evidence you haven't checked yet ({count})",
  'wall.missing.processMap': 'Process Map grouping is available after FRAME mapping.',
  'wall.missing.collapsed': 'Show details',
  'wall.missing.expanded': 'Hide details',
  'wall.canvas.ariaLabel': 'Suspected cause workspace',
  'wall.cta.proposeHypothesis': 'Propose suspected mechanism from this finding',
  // Model-builder band (Factors & Evaluation Increment 1)
  'wall.model.bandAriaLabel': 'Vital-few model builder',
  'wall.model.title': 'What accounts for the spread in this data',
  'wall.model.keptHeading': 'Vital few',
  'wall.model.candidatesHeading': 'Other factors',
  'wall.model.vitalFewLine': 'vital-few line',
  'wall.model.rSquaredAdj': 'R²adj {value}',
  'wall.model.factorP': 'p {value}',
  'wall.model.associationStrength': 'Association strength',
  'wall.model.deltaR2': 'ΔR² {value}',
  'wall.model.notAVerdict':
    'Associated with the spread in this scope — a clue to investigate, not a verdict.',
  'wall.model.deltaR2Caption':
    'Each bar is a factor’s unique share of the spread; correlated factors overlap, so they need not sum to the model fit.',
  'wall.model.useSuggested': '↩ Use suggested model',
  'wall.model.addToModel': 'Add {factor} to the model',
  'wall.model.removeFromModel': 'Remove {factor} from the model',
  'wall.model.fitOnlyDot': 'Fit-only estimate',
  'wall.model.fitOnlyTooltip':
    'Few observations per factor — treat this as a fit-only estimate, not a confirmed result.',
  'wall.model.redundancy':
    'Removing {factor} barely changed the model — it is correlated with another factor, redundant not irrelevant.',
  'wall.model.redundancyDismiss': 'Dismiss',
  'wall.model.vifTooltip': 'VIF {value}',
  'wall.model.tooFewRows': 'Too few rows to re-rank — showing parent scope.',
  'wall.model.constantInScope': 'constant in scope',
  'wall.model.captureModel': 'Capture model as Finding',
  'wall.model.empty': 'Set an outcome and factors to build a model.',
  'wall.model.capturedText':
    'Model: {factors} accounts for the spread (R²adj {rSquaredAdj}) in {scope}',
  // Hypothesis test-plan triad (Factors & Evaluation Increment 2a)
  'wall.testplan.heading': 'How do I test this?',
  'wall.testplan.toolTwoSample': 'Boxplot + 2-sample',
  'wall.testplan.toolRegression': 'Scatter + regression',
  'wall.testplan.toolCapability': 'Capability (Cp/Cpk)',
  'wall.testplan.evaluate': 'Evaluate',
  'wall.testplan.evaluateAria': 'Evaluate whether {factor} accounts for the spread',
  'wall.testplan.addPlan': '+ Measurement Plan',
  'wall.testplan.addPlanAria': 'Plan how to collect {factor}',
  'wall.testplan.gapLabel': 'no data yet',
  'wall.testplan.resultSupports': '{factor} accounts for the spread (p {p})',
  'wall.testplan.resultInconclusive': '{factor} — inconclusive (p {p})',
  'wall.testplan.resultContradicts': '{factor} counts against this cause (p {p})',
  'wall.testplan.empty': 'No factors yet — capture a finding or set this cause’s condition.',
  // Per-hypothesis What-If (Factors & Evaluation Increment 2a, §5)
  'wall.whatif.heading': 'If you control this cause',
  'wall.whatif.projection': 'Projected Cpk {cpk}, covers {coverage}% of the data',
  'wall.whatif.noProjection': 'Set specs + a condition to project the gain.',
  'wall.toolbar.groupByTributary': 'Group by tributary',
  'wall.toolbar.zoomIn': 'Zoom in',
  'wall.toolbar.zoomOut': 'Zoom out',
  'wall.toolbar.resetView': 'Reset view',
  'wall.palette.placeholder': 'Search hubs, questions, findings…',
  'wall.palette.empty': 'No matches',
  'wall.palette.kind.hub': 'BRANCH',
  'wall.palette.kind.finding': 'FINDING',
  'wall.minimap.ariaLabel': 'Investigation Wall minimap',
  // Brush-to-finding confirmation flow (RPS V1 PR4 Task 17) — TODO(i18n): translate
  'wall.brush.confirmIChart': 'Pin indices {start}-{end} on {factor} as finding?',
  'wall.brush.confirmIChartNoFactor': 'Pin range as finding?',
  'wall.brush.confirmBoxplot': 'Pin category "{category}" on {factor} as finding?',
  'wall.brush.confirmBoxplotNoFactor': 'Pin category "{category}" as finding?',
  'wall.brush.pin': 'Pin',
  'wall.brush.cancel': 'Cancel',
  'wall.brush.dialogAriaLabel': 'Pin selection as finding',

  // FRAME b0 lightweight render — TODO(i18n): translate
  'frame.b0.q1.headline': 'What do you want to investigate?',
  'frame.b0.q1.hint': 'your Y / output measurement',
  'frame.b0.q2.headline': 'What might be affecting it?',
  'frame.b0.q2.hint': "your X's / inputs",
  'frame.b0.runOrderHint': '(run order: {column})',
  'frame.b0.addProcessSteps.label': 'Add process steps',
  'frame.b0.addProcessSteps.helper': "optional — useful when your X's belong to specific stages",
  'frame.b0.addHypothesis.label': 'Add a hypothesis',
  'frame.b0.addHypothesis.helper': 'optional — what you suspect',
  'frame.b0.seeData.cta': 'See the data →',
  'frame.b0.seeData.pickYHint': 'Pick a Y first to see the analysis.',
  'frame.b0.step.addCtq': '+ add measurement at this step (optional)',
  'frame.b0.q1.empty': 'No numeric columns detected — add or import data to begin.', // TODO(i18n): translate
  'frame.b0.q1.emptyRanked':
    "Couldn't auto-rank an outcome. Type the numeric column name in the manual outcome field.",
  'frame.b0.q2.empty': 'No X candidates — once you pick a Y, factor candidates appear here.', // TODO(i18n): translate
  'frame.b0.aria.yCandidates': 'Y candidate chips', // TODO(i18n): translate
  'frame.b0.aria.selectedXs': 'Selected X chips', // TODO(i18n): translate
  'frame.b0.aria.availableXs': 'Available X chips', // TODO(i18n): translate
  'frame.canvasOverlay.cta.control.notReady':
    "Available after you've implemented a process change to monitor",
  'frame.canvasOverlay.cta.handoff.notReady':
    'Available after sustainment monitoring confirms gains',
  'frame.b1.heading': 'Frame the investigation', // TODO(i18n): translate
  'frame.b1.description':
    'Build your process map so the analysis has context. The map drives mode selection and a measurement-gap report; the methodology wants CTS at the ocean, a CTQ per step, and at least one rational-subgroup axis.', // TODO(i18n): translate
  'frame.spec.notSet': 'spec: not set',
  'frame.spec.set': 'spec: set', // TODO(i18n): translate
  'frame.spec.add': '+ add spec',
  'frame.spec.editor.title': 'Set spec for {measure}',
  'frame.spec.editor.usl': 'USL',
  'frame.spec.editor.lsl': 'LSL',
  'frame.spec.editor.target': 'Target',
  'frame.spec.editor.cpkTarget': 'Cpk target',
  'frame.spec.editor.suggestedFromData': 'Suggested from data: mean ± 3σ. Confirm to save.',
  'frame.spec.editor.confirm': 'Save',
  'frame.spec.editor.cancel': 'Cancel',
  'frame.spec.editor.invalidRange': 'USL must be greater than LSL.', // TODO(i18n): translate
  'capability.noSpec.prompt': 'Set a target / spec on {measure} to see Cp/Cpk.',

  // Verify card segmented tabs — TODO(i18n): translate
  'verify.tabs.label': 'Verify view',
  'verify.tab.probability': 'Probability',
  'verify.tab.distribution': 'Distribution',
  'verify.tab.capability': 'Capability',
  'verify.tab.pareto': 'Pareto',

  // Time lens (ProcessHealthBar) — TODO(i18n): translate
  'timeLens.button': 'Time',
  'timeLens.popover.title': 'Time window',
  'timeLens.mode.cumulative': 'Cumulative',
  'timeLens.mode.rolling': 'Rolling',
  'timeLens.mode.fixed': 'Fixed',
  'timeLens.mode.openEnded': 'Open-ended',
  'timeLens.input.windowSize': 'Window size',
  'timeLens.input.anchor': 'Anchor',

  // TODO(i18n): translate canvas.* keys
  // Canvas — SystemLevelView
  'canvas.system.activeAnalyzes': 'Active investigations',
  'canvas.system.conformance': 'Conformance',
  'canvas.system.inbox': 'Inbox',
  'canvas.system.lensLabel': 'Lens: {lens}',
  'canvas.system.noNumericOutcome': 'No numeric outcome',
  'canvas.system.noOutcomePrompts': 'No outcome prompts',
  'canvas.system.noOutcomeTrend': 'No outcome trend',
  'canvas.system.openScout': 'Open SCOUT',
  'canvas.system.outcomeDistribution': 'Outcome distribution',
  'canvas.system.outcomeDrift': 'Outcome drift',
  'canvas.system.outOfSpecMessage': '{outcome} has {pct} readings outside spec.',
  'canvas.system.reviewAction': 'Review',

  // Canvas — CanvasLensPicker
  'canvas.lensPicker.ariaLabel': 'Canvas lenses',
  'canvas.lensPicker.lensAriaLabel': '{label} lens',
  'canvas.lensPicker.invalidAtLevel':
    "{lens} isn't available at {currentLevel} \u2014 try {suggestedLevel}.",

  // Canvas — lens labels & descriptions
  'canvas.lens.capability.description': 'Capability, Cpk trust, and step health.',
  'canvas.lens.capability.label': 'Capability',
  'canvas.lens.default.description': 'Step metrics, specs, and current card state.',
  'canvas.lens.default.label': 'Default',
  'canvas.lens.defect.description': 'Defect counts projected onto process steps.',
  'canvas.lens.defect.label': 'Defect',
  'canvas.lens.performance.description': 'Future within-step channel lens.',
  'canvas.lens.performance.label': 'Performance',
  'canvas.lens.processFlow.description': 'Plain process structure without per-card analytics.',
  'canvas.lens.processFlow.label': 'Process flow',

  // Canvas — NoFocalStepPrompt
  'canvas.noFocalStep.ariaLabel': 'Choose a process step',
  'canvas.noFocalStep.description': 'Local mechanism view needs a focal process step.',
  'canvas.noFocalStep.heading': 'Choose a step for L3',
  'canvas.noFocalStep.noStepsHint': 'Add a process step before opening the local mechanism view.',
  'canvas.noFocalStep.openStepAria': 'Open {stepName} local mechanism',

  // Canvas — MobileLevelPicker
  'canvas.mobile.ariaLabel': 'Canvas levels',
  'canvas.mobile.process': 'Process',
  'canvas.mobile.step': 'Step',
  'canvas.mobile.system': 'System',

  // Canvas — AuthorL3View
  'canvas.authorL3.assignedColumns': 'Assigned columns',
  'canvas.authorL3.ctqHeading': 'CTQ',
  'canvas.authorL3.dropHint': 'Drop columns here to assign them to this process step.',
  'canvas.authorL3.dropTargetAria': '{stepName} assignment target',
  'canvas.authorL3.dropTargetAriaWithChip':
    '{stepName} assignment target, press Enter to place {chipLabel}',
  'canvas.authorL3.noAssignedColumns': 'No assigned columns yet',
  'canvas.authorL3.noCtqContext': 'No unassigned CTQ context',
  'canvas.authorL3.noTributaryContext': 'No unassigned tributary context',
  'canvas.authorL3.selectedStep': 'Selected step',
  'canvas.authorL3.tributaryColumns': 'Tributary columns',
  'canvas.authorL3.unassignedColumns': 'Unassigned columns',

  // Canvas — LocalMechanismView
  'canvas.localMechanism.actionButton': 'Action',
  'canvas.localMechanism.etaSquaredLabel': 'eta² {value}',
  'canvas.localMechanism.factorContribution': 'Factor contribution evidence',
  'canvas.localMechanism.logActionAria': 'Log action for {column}',
  'canvas.localMechanism.noNumericValues': 'No numeric values',
  'canvas.localMechanism.openChartAria': 'Open {column} details mini chart',
  'canvas.localMechanism.openColumnAria': 'Open {column} details',
  'canvas.localMechanism.quickActionTitle': '{column} quick action',
  'canvas.localMechanism.control': 'Control',
  'canvas.localMechanism.handoff': 'Handoff',
  'canvas.localMechanism.controlAria': 'Open control for {column}',
  'canvas.localMechanism.handoffAria': 'Open handoff for {column}',
};
