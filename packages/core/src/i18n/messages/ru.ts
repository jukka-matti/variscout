import type { MessageCatalog } from '../types';

/**
 * Russian message catalog
 */
export const ru: MessageCatalog = {
  // Statistics labels
  'stats.mean': 'Среднее',
  'stats.median': 'Медиана',
  'stats.stdDev': 'Ст. откл.',
  'stats.samples': 'Выборки',
  'stats.passRate': 'Доля годных',
  'stats.range': 'Размах',
  'stats.min': 'Мин',
  'stats.max': 'Макс',
  'stats.target': 'Цель',
  'stats.sigma': 'Сигма',

  // Chart labels
  'chart.observation': 'Наблюдение',
  'chart.count': 'Количество',
  'chart.frequency': 'Частота',
  'chart.value': 'Значение',
  'chart.category': 'Категория',
  'chart.cumulative': 'Накопленный %',
  'chart.clickToEdit': 'Нажмите для редактирования',
  'chart.median': 'Медиана',
  'chart.q1': 'Q1',
  'chart.q3': 'Q3',
  'chart.noChannelData': 'Нет данных канала',
  'chart.selectChannel': 'Выберите канал',

  // Limit labels (GOST standards)
  'limits.usl': 'ВГД',
  'limits.lsl': 'НГД',
  'limits.ucl': 'ВКГ',
  'limits.lcl': 'НКГ',
  'limits.mean': 'Среднее',
  'limits.target': 'Цель',

  // Navigation
  'nav.newAnalysis': 'Новый анализ',
  'nav.backToDashboard': 'Назад к панели',
  'nav.settings': 'Настройки',
  'nav.export': 'Экспорт',
  'nav.presentation': 'Презентация',
  'nav.menu': 'Меню',
  'nav.moreActions': 'Ещё действия',

  // Panel titles
  'panel.findings': 'Выводы',
  'panel.dataTable': 'Таблица данных',
  'panel.whatIf': 'Что если',
  'panel.investigation': 'Расследование',
  'panel.coScout': 'CoScout',
  'panel.drillPath': 'Путь детализации',

  // View modes
  'view.list': 'Список',
  'view.board': 'Доска',
  'view.tree': 'Дерево',

  // Action buttons
  'action.save': 'Сохранить',
  'action.cancel': 'Отмена',
  'action.delete': 'Удалить',
  'action.edit': 'Редактировать',
  'action.copy': 'Копировать',
  'action.close': 'Закрыть',
  'action.learnMore': 'Подробнее',
  'action.download': 'Скачать',
  'action.apply': 'Применить',
  'action.reset': 'Сбросить',
  'action.retry': 'Повторить',
  'action.send': 'Отправить',
  'action.ask': 'Спросить',
  'action.clear': 'Очистить',
  'action.copyAll': 'Копировать всё',
  'action.selectAll': 'Выбрать всё',

  // CoScout
  'coscout.send': 'Отправить',
  'coscout.clear': 'Очистить беседу',
  'coscout.stop': 'Остановить',
  'coscout.rateLimit': 'Достигнут лимит запросов. Подождите.',
  'coscout.contentFilter': 'Содержимое отфильтровано политикой безопасности.',
  'coscout.error': 'Произошла ошибка. Попробуйте снова.',

  // Display/settings
  'display.preferences': 'Настройки отображения',
  'display.chartTextSize': 'Размер текста графика',
  'display.compact': 'Компактный',
  'display.normal': 'Обычный',
  'display.large': 'Крупный',
  'display.lockYAxis': 'Зафиксировать ось Y',
  'display.filterContext': 'Контекст фильтра',
  'display.showSpecs': 'Показать допуски',

  // Investigation
  'investigation.brief': 'Сводка расследования',
  'investigation.assignedToMe': 'Назначенные мне',
  'investigation.hypothesis': 'Гипотеза',
  'investigation.hypotheses': 'Гипотезы',
  'investigation.pinAsFinding': 'Закрепить как вывод',
  'investigation.addObservation': 'Добавить наблюдение',

  // Empty states
  'empty.noData': 'Нет данных',
  'empty.noFindings': 'Выводов пока нет',
  'empty.noResults': 'Результатов не найдено',

  // Error messages
  'error.generic': 'Что-то пошло не так',
  'error.loadFailed': 'Не удалось загрузить данные',
  'error.parseFailed': 'Не удалось обработать файл',

  // Settings labels
  'settings.language': 'Язык',
  'settings.theme': 'Тема',
  'settings.textSize': 'Размер текста',

  // Finding statuses
  'findings.observed': 'Обнаружено',
  'findings.investigating': 'Расследуется',
  'findings.analyzed': 'Проанализировано',
  'findings.improving': 'Улучшается',
  'findings.resolved': 'Решено',

  // Report labels
  'report.summary': 'Сводка',
  'report.findings': 'Выводы',
  'report.recommendations': 'Рекомендации',
  'report.evidence': 'Доказательства',

  // Data input labels
  'data.pasteData': 'Вставить данные',
  'data.uploadFile': 'Загрузить файл',
  'data.columnMapping': 'Сопоставление столбцов',
  'data.measureColumn': 'Столбец измерений',
  'data.factorColumn': 'Столбец факторов',
  'data.addData': 'Добавить данные',
  'data.editData': 'Редактировать данные',
  'data.showDataTable': 'Показать таблицу данных',
  'data.hideDataTable': 'Скрыть таблицу данных',

  // Status
  'status.cached': 'Кэшировано',
  'status.loading': 'Загрузка',
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
  'report.kpi.samples': 'Samples',
  'report.kpi.mean': 'Mean',
  'report.kpi.variation': 'Variation',
  'report.kpi.cpk': 'Cpk',
  'report.kpi.passRate': 'Pass Rate',
  'ai.propose': 'Propose',
  'ai.applied': 'Applied',
  'ai.dismissed': 'Dismissed',
  'ai.expired': 'Expired',
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
  'data.pasteInstructions': 'Paste your data here',
  'data.pasteSubtitle': 'Copy from Excel, CSV, or any spreadsheet',
  'data.useExample': 'Use example data',
  'data.analyzing': 'Analyzing…',
  'data.tipWithData': 'Tip: Include column headers in the first row',
  'data.tipNoData': 'Tip: Try pasting data from a spreadsheet or CSV file',
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
  'chart.legend.commonCause': 'Common Cause',
  'chart.legend.specialCause': 'Special Cause',
  'chart.legend.outOfSpec': 'Out-of-Spec',
  'chart.legend.inControl': 'In-Control',
  'chart.legend.randomVariation': 'Random variation',
  'chart.legend.defect': 'Customer defect',
  'chart.violation.aboveUsl': 'Above USL ({value})',
  'chart.violation.belowLsl': 'Below LSL ({value})',
  'chart.violation.aboveUcl': 'Above UCL — special cause',
  'chart.violation.belowLcl': 'Below LCL — special cause',
  'chart.violation.aboveUclFavorable': 'Above UCL — favorable shift',
  'chart.violation.belowLclFavorable': 'Below LCL — favorable shift',
  'chart.violation.nelson2': 'Nelson Rule 2 — run of {count}',
  'chart.violation.nelson3': 'Nelson Rule 3 — trend of {count}',
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
  'coach.frameTitle': 'Frame the Problem',
  'coach.scoutTitle': 'Scout the Data',
  'coach.investigateTitle': 'Investigate Causes',
  'coach.improveTitle': 'Improve the Process',
  'ai.tool.applyFilter': 'Apply filter',
  'ai.tool.clearFilters': 'Clear filters',
  'ai.tool.switchFactor': 'Switch factor',
  'ai.tool.createFinding': 'Create finding',
  'ai.tool.createHypothesis': 'Create hypothesis',
  'ai.tool.suggestAction': 'Suggest action',
  'ai.tool.shareFinding': 'Share finding',
  'ai.tool.publishReport': 'Publish report',
  'ai.tool.notifyOwners': 'Notify owners',
  'ai.tool.suggestIdea': 'Suggest improvement idea',
  'report.kpi.inSpec': 'In Spec',
  'table.noData': 'No data to display',
  'table.page': 'Page {page} of {total}',
  'table.rowsPerPage': 'Rows per page',
  'table.editHint': 'Click a cell to edit',
  'table.excluded': 'Excluded',
  'table.deleteRow': 'Delete row',
  'table.addRow': 'Add row',
  'table.unsavedChanges': 'Unsaved changes',
  'specs.title': 'Specification Limits',
  'specs.advancedSettings': 'Advanced settings',
  'specs.apply': 'Apply specifications',
  'specs.noChanges': 'No changes to apply',
  'specs.editTitle': 'Edit Specifications',
  'specs.lslLabel': 'Lower Specification Limit (LSL)',
  'specs.uslLabel': 'Upper Specification Limit (USL)',
  'upgrade.title': 'Upgrade Available',
  'upgrade.limitReached': 'You have reached the limit for this feature',
  'upgrade.upgrade': 'Upgrade',
  'upgrade.viewOptions': 'View options',
  'upgrade.featureLimit': '{feature} is limited to {limit} in this plan',
  'display.violin': 'Violin plot',
  'display.violinDesc': 'Show distribution shape',
  'display.contribution': 'Contribution',
  'display.contributionDesc': 'Show variation contribution',
  'display.sort': 'Sort',
  'display.ascending': 'Ascending',
  'display.descending': 'Descending',
  'stats.summary': 'Summary Statistics',
  'stats.histogram': 'Histogram',
  'stats.probPlot': 'Probability Plot',
  'stats.editSpecs': 'Edit specifications',
  'whatif.adjustMean': 'Adjust mean',
  'whatif.reduceVariation': 'Reduce variation',
  'whatif.currentProjected': 'Current vs Projected',
  'whatif.resetAdjustments': 'Reset adjustments',
  'whatif.yield': 'Projected yield',
  // Chart violation details (parameterized)
  'chart.violation.nelson2.detail':
    'Правило Нельсона 2 — серия {count} {side} среднего (#{start}–{end})',
  'chart.violation.nelson3.detail':
    'Правило Нельсона 3 — тренд {count} {direction} (#{start}–{end})',
  'chart.violation.side.above': 'выше',
  'chart.violation.side.below': 'ниже',
  'chart.violation.direction.increasing': 'возрастающий',
  'chart.violation.direction.decreasing': 'убывающий',

  // Parameterized messages
  'data.rowsLoaded': '{count} rows loaded',
  'findings.countLabel': '{count} findings',

  // Chart limit labels (colon-suffixed for SVG rendering)
  'chart.label.ucl': 'UCL:',
  'chart.label.lcl': 'LCL:',
  'chart.label.mean': 'Ср.:',
  'chart.label.tgt': 'Цель:',
  'chart.label.usl': 'USL:',
  'chart.label.lsl': 'LSL:',
  'chart.label.value': 'Значение:',
  'chart.label.n': 'n:',
  'chart.label.target': 'Цель:',

  // Chart status & empty states
  'chart.status.inControl': 'Под контролем',
  'chart.status.outOfControl': 'Вне контроля (за пределами UCL/LCL)',
  'chart.noDataProbPlot': 'Нет данных для графика вероятности',

  // Chart edit affordances
  'chart.edit.spec': 'Нажмите, чтобы изменить {spec}',
  'chart.edit.axisLabel': 'Нажмите, чтобы изменить подпись оси',
  'chart.edit.yAxis': 'Нажмите, чтобы изменить масштаб оси Y',
  'chart.edit.saveCancel': 'Enter — сохранить · Esc — отменить',

  // Performance table headers
  'chart.table.channel': 'Канал',
  'stats.cp': 'Cp',

  // Chart UI labels
  'chart.copyToClipboard': 'Копировать график в буфер обмена',
  'chart.maximize': 'Развернуть график',
  'chart.type.ichart': 'I-Chart',
  'chart.type.boxplot': 'Boxplot',
  'chart.type.pareto': 'Pareto',
  'chart.drillHere': '↓ детализировать здесь',
  'chart.percent': 'Процент',

  // Y-axis popover
  'chart.yAxisScale': 'Масштаб оси Y',
  'validation.minLessThanMax': 'Мин. должно быть меньше Макс.',
  'action.noChanges': 'Без изменений',

  // Create factor modal
  'factor.create': 'Создать фактор из выделения',
  'factor.name': 'Имя фактора',
  'factor.nameEmpty': 'Имя фактора не может быть пустым',
  'factor.nameExists': 'Фактор с таким именем уже существует',
  'factor.example': 'напр., События высокой температуры',
  'factor.pointsMarked': '{count} точек будут отмечены как:',
  'factor.createAndFilter': 'Создать и отфильтровать',
  'factor.filterExplanation':
    'Представление будет автоматически отфильтровано, чтобы показать только выбранные точки.',

  // Characteristic type selector
  'charType.nominal': 'Номинальная',
  'charType.nominalDesc': 'Целевое значение (напр., масса наполнения)',
  'charType.smaller': 'Чем меньше, тем лучше',
  'charType.smallerDesc': 'Чем ниже, тем лучше (напр., дефекты)',
  'charType.larger': 'Чем больше, тем лучше',
  'charType.largerDesc': 'Чем выше, тем лучше (напр., выход)',

  // Investigation prompt
  'investigation.trackingPrompt':
    'Отслеживание расследования — откройте панель «Расследование», чтобы увидеть полную картину.',

  // Mobile category sheet
  'chart.highlight': 'Выделение:',
  'chart.highlightRed': 'Красный',
  'chart.highlightAmber': 'Янтарный',
  'chart.highlightGreen': 'Зелёный',
  'chart.clearHighlight': 'Снять выделение',
  'chart.drillDown': 'Детализировать «{category}»',
  'ai.askCoScout': 'Спросить CoScout об этом',

  // Settings descriptions
  'display.lockYAxisDesc': 'Сохраняет масштаб для визуального сравнения',
  'display.filterContextDesc': 'Показывать сводку активных фильтров под заголовками графиков',

  // Performance detected modal
  'performance.detected': 'Обнаружен режим Performance',
  'performance.columnsFound': 'Найдено {count} столбцов измерений',
  'performance.labelQuestion': 'Что представляют эти каналы измерений?',
  'performance.labelExample': 'напр., Дозирующая головка, Гнездо, Сопло',
  'performance.enable': 'Включить режим Performance',

  // Finding editor & data types
  'finding.placeholder': 'Что вы обнаружили?',
  'finding.note': 'Заметка о находке',
  'data.typeNumeric': 'Числовой',
  'data.typeCategorical': 'Категориальный',
  'data.typeDate': 'Дата',
  'data.typeText': 'Текст',
  'data.categories': 'категории',

  // Coaching text (scenario × phase)
  'coach.problem.frame': 'Настройте данные, чтобы начать расследование проблемы.',
  'coach.problem.scout': 'Ищите закономерности вариации, которые могут объяснить проблему.',
  'coach.problem.investigate': 'Собирайте доказательства связи факторов с проблемой.',
  'coach.problem.improve': 'Планируйте и выполняйте улучшения с помощью цикла PDCA.',
  'coach.hypothesis.frame': 'Настройте данные для проверки гипотезы.',
  'coach.hypothesis.scout': 'Ищите доказательства, подтверждающие или опровергающие гипотезу.',
  'coach.hypothesis.investigate':
    'Соберите статистические доказательства для подтверждения предполагаемой причины.',
  'coach.hypothesis.improve':
    'Причина подтверждена — планируйте корректирующие действия через PDCA.',
  'coach.routine.frame': 'Настройте данные для рутинной проверки процесса.',
  'coach.routine.scout': 'Ищите новые сигналы, смещения или неожиданные закономерности.',
  'coach.routine.investigate': 'Обнаружен сигнал — изучите возможные причины.',
  'coach.routine.improve': 'Причина определена — планируйте корректирующие действия через PDCA.',

  // PWA HomeScreen
  'home.heading': 'Исследуйте анализ вариации',
  'home.description':
    'Бесплатный инструмент для обучения анализу вариации. Визуализируйте изменчивость, рассчитывайте воспроизводимость и находите, на чём сосредоточиться — прямо в браузере.',
  'home.divider': 'или используйте свои данные',
  'home.pasteHelper': 'Скопируйте строки и вставьте — мы автоматически определим столбцы',
  'home.manualEntry': 'Или введите данные вручную',
  'home.upgradeHint': 'Нужны командные функции, загрузка файлов или сохранённые проекты?',

  // PWA navigation
  'nav.presentationMode': 'Режим презентации',
  'nav.hideFindings': 'Скрыть находки',

  // Export
  'export.asImage': 'Экспорт как изображение',
  'export.asCsv': 'Экспорт как CSV',
  'export.imageDesc': 'Снимок экрана PNG для презентаций',
  'export.csvDesc': 'Файл данных, совместимый с таблицами',

  // Sample section
  'sample.heading': 'Попробуйте пример набора данных',
  'sample.allSamples': 'Все примеры наборов данных',
  'sample.featured': 'Рекомендуемые',
  'sample.caseStudies': 'Тематические исследования',
  'sample.journeys': 'Обучающие маршруты',
  'sample.industry': 'Отраслевые примеры',

  // View modes (additional)
  'view.stats': 'Статистика',

  // Display (additional)
  'display.appearance': 'Внешний вид',

  // Azure toolbar
  'data.manualEntry': 'Ручной ввод',
  'data.editTable': 'Редактировать таблицу данных',
  'toolbar.saveAs': 'Сохранить как…',
  'toolbar.saving': 'Сохранение…',
  'toolbar.saved': 'Сохранено',
  'toolbar.saveFailed': 'Ошибка сохранения',
  'toolbar.addMore': 'Добавить данные',
  'report.scouting': 'Отчёт Scouting',
  'export.csvFiltered': 'Экспортировать отфильтрованные данные как CSV',
  'error.auth': 'Ошибка авторизации',

  // File browse
  'file.browseLocal': 'Обзор устройства',
  'file.browseSharePoint': 'Обзор SharePoint',
  'file.open': 'Открыть файл',

  // Admin hub
  'admin.title': 'Администрирование',
  'admin.status': 'Статус',
  'admin.plan': 'План и функции',
  'admin.teams': 'Настройка Teams',
  'admin.knowledge': 'Knowledge Base',
  'admin.troubleshooting': 'Устранение неполадок',

  // Admin plan tab
  'admin.currentPlan': 'Текущий',
  'admin.feature': 'Функция',
  'admin.manageSubscription': 'Управление подпиской в Azure',
  'admin.planStandard': 'Standard',
  'admin.planTeam': 'Team',
  'admin.planStandardPrice': '€79/мес.',
  'admin.planTeamPrice': '€199/мес.',
  'admin.planStandardDesc': 'Полный анализ с CoScout AI',
  'admin.planTeamDesc': 'Teams, OneDrive, SharePoint, база знаний',

  // Feature names (plan matrix)
  'feature.charts': 'I-Chart, Boxplot, Pareto, Stats',
  'feature.capability': 'Анализ воспроизводимости (Cp/Cpk)',
  'feature.performance': 'Режим Performance (многоканальный)',
  'feature.anova': 'ANOVA и факторный анализ',
  'feature.findingsWorkflow': 'Рабочий процесс находок и расследования',
  'feature.whatIf': 'Моделирование What-If',
  'feature.csvImport': 'Импорт CSV/Excel',
  'feature.reportExport': 'Экспорт отчёта (PDF)',
  'feature.indexedDb': 'Локальное хранилище IndexedDB',
  'feature.maxFactors': 'До 6 факторов',
  'feature.maxRows': 'До 100 тыс. строк',
  'feature.onedriveSync': 'Синхронизация проектов OneDrive',
  'feature.sharepointPicker': 'Выбор файлов SharePoint',
  'feature.teamsIntegration': 'Интеграция с Microsoft Teams',
  'feature.channelCollab': 'Совместная работа в каналах',
  'feature.mobileUi': 'Оптимизированный мобильный интерфейс',
  'feature.coScoutAi': 'AI-ассистент CoScout',
  'feature.narrativeBar': 'Аналитика NarrativeBar',
  'feature.chartInsights': 'Чипы аналитики графиков',
  'feature.knowledgeBase': 'Knowledge Base (поиск SharePoint)',
  'feature.aiActions': 'Действия, предлагаемые AI',

  // Admin Teams setup
  'admin.teams.heading': 'Добавить VariScout в Microsoft Teams',
  'admin.teams.description':
    'Сгенерируйте пакет приложения Teams для вашего развёртывания и загрузите его в центр администрирования Teams.',
  'admin.teams.running': 'Работает внутри Microsoft Teams',
  'admin.teams.step1': 'Идентификатор клиента регистрации приложения (необязательно)',
  'admin.teams.step1Desc':
    'Введите идентификатор клиента регистрации приложения Azure AD для включения SSO Teams в манифесте.',
  'admin.teams.step2': 'Скачать пакет приложения Teams',
  'admin.teams.step2Desc':
    'Этот .zip содержит манифест и значки, предварительно настроенные для вашего развёртывания.',
  'admin.teams.step3': 'Загрузить в центр администрирования Teams',
  'admin.teams.step4': 'Добавить VariScout в канал',
  'admin.teams.download': 'Скачать пакет приложения Teams',

  // Admin status tab
  'admin.checksResult': '{pass}/{total} проверок пройдено',
  'admin.runChecks': 'Запустить все проверки',
  'admin.notApplicable': 'Не применимо к вашему плану',
  'admin.managePortal': 'Управление в Azure Portal',
  'admin.portalAccessNote':
    'Эти элементы требуют доступа к Azure Portal и не могут быть проверены из браузера.',
  'admin.fixInPortal': 'Исправить в Azure Portal: {label}',

  // Admin troubleshoot tab
  'admin.troubleshoot.intro':
    'Распространённые проблемы и способы их решения. Нажмите на проблему для пошаговых инструкций.',
  'admin.runCheck': 'Запустить проверку',
  'admin.checkPassed': 'Проверка пройдена — возможно, это не является проблемой.',
  'admin.checkFailed': 'Проверка не пройдена — следуйте инструкциям ниже.',
  'admin.issue.signin': 'Пользователи не могут войти',
  'admin.issue.signinDesc':
    'Аутентификация Azure AD не работает или пользователи видят пустую страницу.',
  'admin.issue.signinSteps':
    'Убедитесь, что аутентификация App Service включена в Azure Portal.\nПроверьте, что регистрация приложения Azure AD имеет правильные URI перенаправления.\nУбедитесь, что в регистрации приложения включены «Токены ID» в разделе «Аутентификация».\nПроверьте, что арендатор разрешает вход пользователей в приложение (Корпоративные приложения → Свойства → Вход пользователей включён).',
  'admin.issue.onedrive': 'Синхронизация OneDrive не работает',
  'admin.issue.onedriveDesc':
    'Проекты не синхронизируются с OneDrive или пользователи видят ошибки доступа.',
  'admin.issue.onedriveSteps':
    'Проверьте, что регистрация приложения имеет делегированное разрешение «Files.ReadWrite».\nУбедитесь, что согласие администратора предоставлено для разрешений Graph.\nУбедитесь, что пользователю назначена лицензия OneDrive.\nПопробуйте выйти и войти снова для обновления токена.',
  'admin.issue.coscout': 'CoScout не отвечает',
  'admin.issue.coscoutDesc': 'AI-ассистент не генерирует ответы или показывает ошибки.',
  'admin.issue.coscoutSteps':
    'Проверьте, что конечная точка AI настроена в шаблоне ARM / параметрах App Service.\nУбедитесь, что ресурс Azure AI Services развёрнут и работает.\nПроверьте, что развёртывание модели существует (напр., gpt-4o) в ресурсе AI Services.\nПроверьте квоты Azure AI Services — развёртывание могло достигнуть ограничений скорости.',
  'admin.issue.kbEmpty': 'Knowledge Base не возвращает результатов',
  'admin.issue.kbEmptyDesc':
    '«Поиск Knowledge Base» в CoScout ничего не находит, несмотря на наличие документов.',
  'admin.issue.kbEmptySteps':
    'Проверьте, что конечная точка AI Search настроена в параметрах App Service.\nУбедитесь, что источник знаний Remote SharePoint создан в AI Search.\nУбедитесь, что минимум 1 лицензия Microsoft 365 Copilot активна в арендаторе.\nПроверьте, что пользователь имеет доступ к документам SharePoint.\nПроверьте, что переключатель предварительного просмотра Knowledge Base включён (Администрирование → вкладка Knowledge Base).',
  'admin.issue.teamsTab': 'Вкладка Teams не отображается',
  'admin.issue.teamsTabDesc': 'VariScout не появляется в Teams или вкладка не загружается.',
  'admin.issue.teamsTabSteps':
    'Проверьте, что пакет приложения Teams (.zip) загружен в центр администрирования Teams.\nУбедитесь, что contentUrl в manifest.json соответствует URL вашего App Service.\nУбедитесь, что приложение одобрено в центре администрирования Teams (не заблокировано политикой).\nПопробуйте удалить и заново добавить вкладку в канале.\nЕсли используется пользовательский домен, проверьте его наличие в массиве validDomains манифеста.',
  'admin.issue.newUser': 'Новый пользователь не может получить доступ к приложению',
  'admin.issue.newUserDesc':
    'Вновь добавленный пользователь видит отказ в доступе или пустую страницу.',
  'admin.issue.newUserSteps':
    'В Azure AD перейдите в Корпоративные приложения → VariScout → Пользователи и группы.\nДобавьте пользователя или его группу безопасности в приложение.\nЕсли используется «Требуется назначение пользователя», убедитесь, что пользователь имеет назначение.\nПроверьте политики условного доступа, которые могут блокировать пользователя.',
  'admin.issue.aiSlow': 'Медленные ответы AI',
  'admin.issue.aiSlowDesc': 'CoScout долго отвечает или часто превышает время ожидания.',
  'admin.issue.aiSlowSteps':
    'Проверьте регион развёртывания Azure AI Services — задержка увеличивается с расстоянием.\nУбедитесь, что развёртывание модели имеет достаточную квоту TPM (токенов в минуту).\nРассмотрите переход на развёртывание с выделенной пропускной способностью для стабильной задержки.\nПроверьте, велик ли индекс AI Search — рассмотрите оптимизацию источника знаний.',
  'admin.issue.forbidden': 'Ошибки «Forbidden»',
  'admin.issue.forbiddenDesc': 'Пользователи видят ошибки 403 при доступе к определённым функциям.',
  'admin.issue.forbiddenSteps':
    'Проверьте, что для всех необходимых разрешений Graph API получено согласие администратора.\nУбедитесь, что хранилище токенов аутентификации App Service включено.\nУбедитесь, что токен пользователя не истёк — попробуйте выйти и войти снова.\nПроверьте политики условного доступа для арендатора.',
  'admin.issue.kbPartial': 'KB не работает для некоторых пользователей',
  'admin.issue.kbPartialDesc':
    'Поиск Knowledge Base работает для администраторов, но не для остальных пользователей.',
  'admin.issue.kbPartialSteps':
    'Источники знаний Remote SharePoint используют разрешения на уровне пользователя. Каждый пользователь должен иметь доступ SharePoint к документам.\nПроверьте, не заблокированы ли затронутые пользователи политиками условного доступа.\nУбедитесь, что согласие администратора предоставлено для делегированного разрешения Sites.Read.All.\nПопросите затронутых пользователей выйти и войти снова для обновления токена.',

  // Workspace navigation
  'workspace.analysis': 'Analysis',
  'workspace.findings': 'Findings',
  'workspace.improvement': 'Improvement',

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
  'improve.selectedCount': '{count} selected',
  'improve.effortBreakdown': '{low} low · {medium} med · {high} high',
  'improve.projectedCpk': 'Projected Cpk: {value}',
  'improve.targetDelta': 'Δ {delta} to target',
  'improve.convertedToAction': '→ Action',

  // Effort labels
  'effort.low': 'Low',
  'effort.medium': 'Medium',
  'effort.high': 'High',
  'effort.label': 'Effort',

  // Idea direction labels (Four Ideation Directions)
  'idea.direction': 'Direction',
  'idea.prevent': 'Prevent',
  'idea.detect': 'Detect',
  'idea.simplify': 'Simplify',
  'idea.eliminate': 'Eliminate',

  // Projected vs actual
  'outcome.projectedVsActual': 'Projected {projected} → Actual {actual}',
  'outcome.delta': '({sign}{delta})',
  'improve.convergenceNudge':
    'Your evidence is converging \u2014 summarize what you\u2019ve learned in the Improvement Plan.',
};
