import type { MessageCatalog } from '../types';

/** Arabic message catalog */
export const ar: MessageCatalog = {
  // Statistics labels
  'stats.mean': 'المتوسط',
  'stats.median': 'الوسيط',
  'stats.stdDev': 'الانحراف المعياري',
  'stats.samples': 'العينات',
  'stats.passRate': 'نسبة النجاح',
  'stats.range': 'المدى',
  'stats.min': 'الحد الأدنى',
  'stats.max': 'الحد الأقصى',
  'stats.target': 'الهدف',
  'stats.sigma': 'سيغما',

  // Chart labels
  'chart.observation': 'الملاحظة',
  'chart.count': 'العدد',
  'chart.frequency': 'التكرار',
  'chart.value': 'القيمة',
  'chart.category': 'الفئة',
  'chart.cumulative': 'التراكمي %',
  'chart.clickToEdit': 'انقر للتعديل',
  'chart.median': 'الوسيط',
  'chart.q1': 'Q1',
  'chart.q3': 'Q3',
  'chart.noChannelData': 'لا توجد بيانات للقناة',
  'chart.selectChannel': 'اختر القناة',

  // Limit labels
  'limits.usl': 'USL',
  'limits.lsl': 'LSL',
  'limits.ucl': 'UCL',
  'limits.lcl': 'LCL',
  'limits.mean': 'المتوسط',
  'limits.target': 'الهدف',

  // Navigation
  'nav.newAnalysis': 'تحليل جديد',
  'nav.backToDashboard': 'العودة إلى لوحة المعلومات',
  'nav.settings': 'الإعدادات',
  'nav.export': 'تصدير',
  'nav.presentation': 'عرض تقديمي',
  'nav.menu': 'القائمة',
  'nav.moreActions': 'إجراءات إضافية',

  // Panel titles
  'panel.findings': 'النتائج',
  'panel.dataTable': 'جدول البيانات',
  'panel.whatIf': 'ماذا لو',
  'panel.investigation': 'التحقيق',
  'panel.coScout': 'CoScout',
  'panel.drillPath': 'مسار التعمق',

  // View modes
  'view.list': 'قائمة',
  'view.board': 'لوحة',
  'view.tree': 'شجرة',

  // Action buttons
  'action.save': 'حفظ',
  'action.cancel': 'إلغاء',
  'action.delete': 'حذف',
  'action.edit': 'تعديل',
  'action.copy': 'نسخ',
  'action.close': 'إغلاق',
  'action.learnMore': 'معرفة المزيد',
  'action.download': 'تنزيل',
  'action.apply': 'تطبيق',
  'action.reset': 'إعادة تعيين',
  'action.retry': 'إعادة المحاولة',
  'action.send': 'إرسال',
  'action.ask': 'اسأل',
  'action.clear': 'مسح',
  'action.copyAll': 'نسخ الكل',
  'action.selectAll': 'تحديد الكل',

  // CoScout
  'coscout.send': 'إرسال',
  'coscout.clear': 'مسح المحادثة',
  'coscout.stop': 'إيقاف',
  'coscout.rateLimit': 'تم الوصول إلى حد المعدل. يرجى الانتظار.',
  'coscout.contentFilter': 'تمت تصفية المحتوى بموجب سياسة الأمان.',
  'coscout.error': 'حدث خطأ. يرجى المحاولة مرة أخرى.',

  // Display/settings
  'display.preferences': 'التفضيلات',
  'display.chartTextSize': 'حجم نص الرسم البياني',
  'display.compact': 'مضغوط',
  'display.normal': 'عادي',
  'display.large': 'كبير',
  'display.lockYAxis': 'قفل المحور ص',
  'display.filterContext': 'سياق التصفية',
  'display.showSpecs': 'عرض المواصفات',

  // Investigation
  'investigation.brief': 'ملخص التحقيق',
  'investigation.assignedToMe': 'مُسند إليّ',
  'investigation.hypothesis': 'فرضية',
  'investigation.hypotheses': 'فرضيات',
  'investigation.pinAsFinding': 'تثبيت كنتيجة',
  'investigation.addObservation': 'إضافة ملاحظة',

  // Empty states
  'empty.noData': 'لا توجد بيانات متاحة',
  'empty.noFindings': 'لا توجد نتائج بعد',
  'empty.noResults': 'لم يتم العثور على نتائج',

  // Error messages
  'error.generic': 'حدث خطأ ما',
  'error.loadFailed': 'فشل تحميل البيانات',
  'error.parseFailed': 'فشل تحليل الملف',

  // Settings labels
  'settings.language': 'اللغة',
  'settings.theme': 'المظهر',
  'settings.textSize': 'حجم النص',

  // Finding statuses
  'findings.observed': 'مُلاحَظ',
  'findings.investigating': 'قيد التحقيق',
  'findings.analyzed': 'مُحلَّل',
  'findings.improving': 'قيد التحسين',
  'findings.resolved': 'تم الحل',

  // Report labels
  'report.summary': 'الملخص',
  'report.findings': 'النتائج',
  'report.recommendations': 'التوصيات',
  'report.evidence': 'الأدلة',

  // Data input labels
  'data.pasteData': 'لصق البيانات',
  'data.uploadFile': 'رفع ملف',
  'data.columnMapping': 'تعيين الأعمدة',
  'data.measureColumn': 'عمود القياس',
  'data.factorColumn': 'عمود العامل',
  'data.addData': 'إضافة بيانات',
  'data.editData': 'تعديل البيانات',
  'data.showDataTable': 'عرض جدول البيانات',
  'data.hideDataTable': 'إخفاء جدول البيانات',

  // Status
  'status.cached': 'مُخزَّن',
  'status.loading': 'جارٍ التحميل',
  'status.ai': 'ذ.ا.',
};
