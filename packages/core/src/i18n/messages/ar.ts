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

  // Chart violation details (parameterized)
  'chart.violation.nelson2.detail':
    'قاعدة نيلسون 2 — سلسلة {count} {side} المتوسط (#{start}–{end})',
  'chart.violation.nelson3.detail': 'قاعدة نيلسون 3 — اتجاه {count} {direction} (#{start}–{end})',
  'chart.violation.side.above': 'فوق',
  'chart.violation.side.below': 'تحت',
  'chart.violation.direction.increasing': 'تصاعدي',
  'chart.violation.direction.decreasing': 'تنازلي',

  // Parameterized messages
  'data.rowsLoaded': '{count} rows loaded',
  'findings.countLabel': '{count} findings',
};
