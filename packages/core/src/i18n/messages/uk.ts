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
};
