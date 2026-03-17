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
};
