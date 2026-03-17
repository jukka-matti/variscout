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
};
