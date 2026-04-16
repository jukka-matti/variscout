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
  'display.density': 'كثافة العرض',
  'display.lockYAxis': 'قفل المحور ص',
  'display.filterContext': 'سياق التصفية',
  'display.showSpecs': 'عرض المواصفات',

  // Investigation
  'investigation.brief': 'ملخص التحقيق',
  'investigation.assignedToMe': 'مُسند إليّ',
  'investigation.question': 'Question',
  'investigation.questions': 'Questions',
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
  'data.addQuestion': 'Add question',
  'data.removeQuestion': 'Remove question',
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
  'investigation.phaseDiverging': 'Explore multiple questions',
  'investigation.phaseValidating': 'Test and validate questions',
  'investigation.phaseConverging': 'Narrow to root cause',
  'investigation.phaseImproving': 'Implement and verify changes',
  'investigation.pdcaTitle': 'Verification Checklist',
  'investigation.verifyChart': 'I-Chart stable after change',
  'investigation.verifyStats': 'Cpk meets target',
  'investigation.verifyBoxplot': 'Boxplot spread reduced',
  'investigation.verifySideEffects': 'No side effects observed',
  'investigation.verifyOutcome': 'Outcome sustained over time',
  'investigation.uninvestigated': 'Uninvestigated Factors',

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
  'ai.tool.suggestSuspectedCause': 'Suggest suspected cause',
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
    'قاعدة نيلسون 2 — سلسلة {count} {side} المتوسط (#{start}–{end})',
  'chart.violation.nelson3.detail': 'قاعدة نيلسون 3 — اتجاه {count} {direction} (#{start}–{end})',
  'chart.violation.side.above': 'فوق',
  'chart.violation.side.below': 'تحت',
  'chart.violation.direction.increasing': 'تصاعدي',
  'chart.violation.direction.decreasing': 'تنازلي',

  // Parameterized messages
  'data.rowsLoaded': '{count} rows loaded',
  'findings.countLabel': '{count} نتائج',

  // Chart limit labels
  'chart.label.ucl': 'UCL:',
  'chart.label.lcl': 'LCL:',
  'chart.label.mean': 'المتوسط:',
  'chart.label.tgt': 'الهدف:',
  'chart.label.usl': 'USL:',
  'chart.label.lsl': 'LSL:',
  'chart.label.value': 'القيمة:',
  'chart.label.n': 'ن:',
  'chart.label.target': 'الهدف:',

  // Chart status
  'chart.status.inControl': 'تحت السيطرة',
  'chart.status.outOfControl': 'خارج السيطرة (تجاوز UCL/LCL)',
  'chart.noDataProbPlot': 'لا تتوفر بيانات لرسم الاحتمالات',

  // Chart edit affordances
  'chart.edit.spec': 'انقر لتعديل {spec}',
  'chart.edit.axisLabel': 'انقر لتعديل تسمية المحور',
  'chart.edit.yAxis': 'انقر لتعديل مقياس المحور الصادي',
  'chart.edit.saveCancel': 'Enter للحفظ · Esc للإلغاء',

  // Performance table headers
  'chart.table.channel': 'القناة',
  'stats.cp': 'Cp',

  // Chart UI labels
  'chart.copyToClipboard': 'نسخ الرسم البياني إلى الحافظة',
  'chart.maximize': 'تكبير الرسم البياني',
  'chart.type.ichart': 'I-Chart',
  'chart.type.boxplot': 'Boxplot',
  'chart.type.pareto': 'Pareto',
  'chart.drillHere': '↓ التنقيب هنا',
  'chart.percent': 'النسبة المئوية',

  // Y-axis popover
  'chart.yAxisScale': 'مقياس المحور الصادي',
  'validation.minLessThanMax': 'يجب أن يكون الحد الأدنى أقل من الحد الأقصى',
  'action.noChanges': 'لا تغييرات',

  // Create factor modal
  'factor.create': 'إنشاء عامل من التحديد',
  'factor.name': 'اسم العامل',
  'factor.nameEmpty': 'لا يمكن أن يكون اسم العامل فارغًا',
  'factor.nameExists': 'عامل بهذا الاسم موجود بالفعل',
  'factor.example': 'مثال: أحداث الحرارة العالية',
  'factor.pointsMarked': 'سيتم تمييز {count} نقطة كـ:',
  'factor.createAndFilter': 'إنشاء وتصفية',
  'factor.filterExplanation': 'سيتم تصفية العرض تلقائيًا لإظهار النقاط المحددة فقط.',

  // Characteristic type selector
  'charType.nominal': 'اسمي',
  'charType.nominalDesc': 'متمركز حول الهدف (مثل وزن التعبئة)',
  'charType.smaller': 'الأصغر أفضل',
  'charType.smallerDesc': 'الأقل أفضل (مثل العيوب)',
  'charType.larger': 'الأكبر أفضل',
  'charType.largerDesc': 'الأعلى أفضل (مثل العائد)',

  // Investigation prompt
  'investigation.trackingPrompt': 'جارٍ تتبع تحقيقك — افتح لوحة التحقيق لرؤية الصورة الكاملة.',

  // Mobile category sheet
  'chart.highlight': 'تمييز:',
  'chart.highlightRed': 'أحمر',
  'chart.highlightAmber': 'كهرماني',
  'chart.highlightGreen': 'أخضر',
  'chart.clearHighlight': 'إزالة التمييز',
  'chart.drillDown': 'التنقيب في "{category}"',
  'ai.askCoScout': 'اسأل CoScout عن هذا',

  // Settings descriptions
  'display.lockYAxisDesc': 'يحافظ على المقياس للمقارنة البصرية',
  'display.filterContextDesc': 'عرض ملخص التصفية النشط أسفل عناوين الرسوم البيانية',

  // Performance detected modal
  'performance.detected': 'تم اكتشاف وضع الأداء',
  'performance.columnsFound': 'تم العثور على {count} أعمدة قياس',
  'performance.labelQuestion': 'ماذا تمثل قنوات القياس هذه؟',
  'performance.labelExample': 'مثال: رأس التعبئة، التجويف، الفوهة',
  'performance.enable': 'تفعيل وضع الأداء',

  // Finding editor & data types
  'finding.placeholder': 'ماذا وجدت؟',
  'finding.note': 'ملاحظة النتيجة',
  'data.typeNumeric': 'رقمي',
  'data.typeCategorical': 'فئوي',
  'data.typeDate': 'تاريخ',
  'data.typeText': 'نص',
  'data.categories': 'فئات',

  // PWA HomeScreen
  'home.heading': 'استكشف تحليل التباين',
  'home.description':
    'أداة تدريب مجانية لتحليل التباين. تصور التقلب، واحسب القدرة، واعثر على نقاط التركيز — مباشرة في متصفحك.',
  'home.divider': 'أو استخدم بياناتك الخاصة',
  'home.pasteHelper': 'انسخ الصفوف والصقها — سنكتشف الأعمدة تلقائيًا',
  'home.manualEntry': 'أو أدخل البيانات يدويًا',
  'home.upgradeHint': 'هل تحتاج ميزات الفريق أو تحميل الملفات أو المشاريع المحفوظة؟',

  // PWA navigation
  'nav.presentationMode': 'وضع العرض التقديمي',
  'nav.hideFindings': 'إخفاء النتائج',

  // Export
  'export.asImage': 'تصدير كصورة',
  'export.asCsv': 'تصدير كـ CSV',
  'export.imageDesc': 'لقطة شاشة PNG للعروض التقديمية',
  'export.csvDesc': 'ملف بيانات متوافق مع جداول البيانات',

  // Sample section
  'sample.heading': 'جرب مجموعة بيانات نموذجية',
  'sample.allSamples': 'جميع مجموعات البيانات النموذجية',
  'sample.featured': 'مميزة',
  'sample.caseStudies': 'دراسات حالة',
  'sample.journeys': 'رحلات تعليمية',
  'sample.industry': 'أمثلة صناعية',

  // View modes
  'view.stats': 'إحصائيات',
  'display.appearance': 'المظهر',

  // Azure toolbar
  'data.manualEntry': 'إدخال يدوي',
  'data.editTable': 'تعديل جدول البيانات',
  'toolbar.saveAs': 'حفظ باسم…',
  'toolbar.saving': 'جارٍ الحفظ…',
  'toolbar.saved': 'تم الحفظ',
  'toolbar.saveFailed': 'فشل الحفظ',
  'toolbar.addMore': 'إضافة بيانات',
  'report.scouting': 'تقرير الاستكشاف',
  'export.csvFiltered': 'تصدير البيانات المصفاة كـ CSV',
  'error.auth': 'خطأ في المصادقة',

  // File browse
  'file.browseLocal': 'تصفح هذا الجهاز',
  'file.browseSharePoint': 'تصفح SharePoint',
  'file.open': 'فتح ملف',

  // Admin hub
  'admin.title': 'المسؤول',
  'admin.status': 'الحالة',
  'admin.plan': 'الخطة والميزات',
  'admin.teams': 'إعداد Teams',
  'admin.knowledge': 'قاعدة المعرفة',
  'admin.troubleshooting': 'استكشاف الأخطاء',

  // Admin plan tab
  'admin.currentPlan': 'الحالية',
  'admin.feature': 'الميزة',
  'admin.manageSubscription': 'إدارة الاشتراك في Azure',
  'admin.planStandard': 'Standard',
  'admin.planTeam': 'Team',
  'admin.planStandardPrice': '€79/شهر',
  'admin.planTeamPrice': '€199/شهر',
  'admin.planStandardDesc': 'تحليل كامل مع CoScout AI',
  'admin.planTeamDesc': 'Teams، OneDrive، SharePoint، قاعدة المعرفة',

  // Feature names
  'feature.charts': 'I-Chart، Boxplot، Pareto، إحصائيات',
  'feature.capability': 'تحليل القدرة (Cp/Cpk)',
  'feature.performance': 'وضع الأداء (متعدد القنوات)',
  'feature.anova': 'ANOVA وتحليل العوامل',
  'feature.findingsWorkflow': 'النتائج وسير عمل التحقيق',
  'feature.whatIf': 'محاكاة ماذا لو',
  'feature.csvImport': 'استيراد CSV/Excel',
  'feature.reportExport': 'تصدير التقارير (PDF)',
  'feature.indexedDb': 'تخزين محلي IndexedDB',
  'feature.maxFactors': 'حتى 6 عوامل',
  'feature.maxRows': 'حتى 250 ألف صف',
  'feature.onedriveSync': 'مزامنة مشاريع OneDrive',
  'feature.sharepointPicker': 'منتقي ملفات SharePoint',
  'feature.teamsIntegration': 'تكامل Microsoft Teams',
  'feature.channelCollab': 'تعاون قائم على القنوات',
  'feature.mobileUi': 'واجهة محسّنة للجوال',
  'feature.coScoutAi': 'مساعد CoScout AI',
  'feature.narrativeBar': 'رؤى NarrativeBar',
  'feature.chartInsights': 'شرائح رؤى الرسوم البيانية',
  'feature.knowledgeBase': 'قاعدة المعرفة (بحث SharePoint)',
  'feature.aiActions': 'إجراءات مقترحة بالذكاء الاصطناعي',

  // Admin Teams setup
  'admin.teams.heading': 'إضافة VariScout إلى Microsoft Teams',
  'admin.teams.description': 'أنشئ حزمة تطبيق Teams لنشرك وارفعها إلى مركز إدارة Teams.',
  'admin.teams.running': 'يعمل داخل Microsoft Teams',
  'admin.teams.step1': 'معرف عميل تسجيل التطبيق (اختياري)',
  'admin.teams.step1Desc':
    'أدخل معرف عميل تسجيل التطبيق في Azure AD لتفعيل Teams SSO في الملف التعريفي.',
  'admin.teams.step2': 'تنزيل حزمة تطبيق Teams',
  'admin.teams.step2Desc':
    'هذا الملف .zip يحتوي على الملف التعريفي والأيقونات المعدة مسبقًا لنشرك.',
  'admin.teams.step3': 'الرفع إلى مركز إدارة Teams',
  'admin.teams.step4': 'إضافة VariScout إلى قناة',
  'admin.teams.download': 'تنزيل حزمة تطبيق Teams',

  // Admin status tab
  'admin.checksResult': '{pass}/{total} فحوصات ناجحة',
  'admin.runChecks': 'تشغيل جميع الفحوصات',
  'admin.notApplicable': 'غير قابل للتطبيق على خطتك',
  'admin.managePortal': 'الإدارة في Azure Portal',
  'admin.portalAccessNote':
    'تتطلب هذه العناصر الوصول إلى Azure Portal ولا يمكن التحقق منها من المتصفح.',
  'admin.fixInPortal': 'الإصلاح في Azure Portal: {label}',

  // Admin troubleshoot tab
  'admin.troubleshoot.intro': 'مشاكل شائعة وكيفية حلها. انقر على مشكلة لرؤية التعليمات خطوة بخطوة.',
  'admin.runCheck': 'تشغيل الفحص',
  'admin.checkPassed': 'نجح الفحص — قد لا تكون هذه هي المشكلة.',
  'admin.checkFailed': 'فشل الفحص — اتبع الخطوات أدناه.',
  'admin.issue.signin': 'لا يستطيع المستخدمون تسجيل الدخول',
  'admin.issue.signinDesc': 'مصادقة Azure AD لا تعمل أو يرى المستخدمون صفحة فارغة.',
  'admin.issue.signinSteps':
    'تحقق من تفعيل مصادقة App Service في Azure Portal.\nتحقق من أن تسجيل تطبيق Azure AD يحتوي على عناوين URI للتوجيه الصحيحة.\nتأكد من تفعيل "رموز المعرف" في تسجيل التطبيق ضمن المصادقة.\nتحقق من أن المستأجر يسمح بتسجيل دخول المستخدمين إلى التطبيق (تطبيقات المؤسسة → الخصائص → مفعل لتسجيل دخول المستخدمين).',
  'admin.issue.onedrive': 'مزامنة OneDrive لا تعمل',
  'admin.issue.onedriveDesc':
    'لا تتم مزامنة المشاريع مع OneDrive أو يرى المستخدمون أخطاء في الأذونات.',
  'admin.issue.onedriveSteps':
    'تحقق من أن تسجيل التطبيق يحتوي على إذن "Files.ReadWrite" المفوض.\nتحقق من منح موافقة المسؤول لأذونات Graph.\nتأكد من تعيين ترخيص OneDrive للمستخدم.\nجرب تسجيل الخروج وتسجيل الدخول مرة أخرى لتحديث الرمز المميز.',
  'admin.issue.coscout': 'CoScout لا يستجيب',
  'admin.issue.coscoutDesc': 'مساعد الذكاء الاصطناعي لا يولد ردودًا أو يظهر أخطاء.',
  'admin.issue.coscoutSteps':
    'تحقق من تكوين نقطة نهاية AI في قالب ARM / إعدادات App Service.\nتحقق من نشر مورد Azure AI Services وتشغيله.\nتحقق من وجود نشر النموذج (مثل gpt-4o) في مورد AI Services.\nتحقق من حصص Azure AI Services — قد يكون النشر قد وصل لحدود المعدل.',
  'admin.issue.kbEmpty': 'قاعدة المعرفة لا تعيد نتائج',
  'admin.issue.kbEmptyDesc': '"البحث في قاعدة المعرفة" في CoScout لا يجد شيئًا رغم وجود المستندات.',
  'admin.issue.kbEmptySteps':
    'تحقق من تكوين نقطة نهاية AI Search في إعدادات App Service.\nتحقق من إنشاء مصدر معرفة Remote SharePoint في AI Search.\nتأكد من وجود ≥1 ترخيص Microsoft 365 Copilot نشط في المستأجر.\nتحقق من وصول المستخدم إلى المستندات المطلوب البحث فيها عبر SharePoint.\nتحقق من تفعيل مفتاح معاينة قاعدة المعرفة (المسؤول → علامة تبويب قاعدة المعرفة).',
  'admin.issue.teamsTab': 'علامة تبويب Teams لا تظهر',
  'admin.issue.teamsTabDesc': 'VariScout لا يظهر في Teams أو فشل تحميل علامة التبويب.',
  'admin.issue.teamsTabSteps':
    'تحقق من رفع حزمة تطبيق Teams (.zip) إلى مركز إدارة Teams.\nتحقق من أن contentUrl في manifest.json يتطابق مع عنوان URL لـ App Service.\nتأكد من الموافقة على التطبيق في مركز إدارة Teams (غير محظور بسياسة).\nجرب إزالة وإعادة إضافة علامة التبويب في القناة.\nإذا كنت تستخدم نطاقًا مخصصًا، تحقق من وجوده في مصفوفة validDomains في الملف التعريفي.',
  'admin.issue.newUser': 'مستخدم جديد لا يستطيع الوصول للتطبيق',
  'admin.issue.newUserDesc': 'مستخدم مضاف حديثًا يرى رفض الوصول أو صفحة فارغة.',
  'admin.issue.newUserSteps':
    'في Azure AD، انتقل إلى تطبيقات المؤسسة → VariScout → المستخدمون والمجموعات.\nأضف المستخدم أو مجموعة الأمان الخاصة بهم إلى التطبيق.\nإذا كان "تعيين المستخدم مطلوب" مفعلاً، تأكد من تعيين المستخدم.\nتحقق من سياسات الوصول المشروط التي قد تمنع المستخدم.',
  'admin.issue.aiSlow': 'ردود AI بطيئة',
  'admin.issue.aiSlowDesc': 'CoScout يستغرق وقتًا طويلاً للرد أو ينتهي الوقت بشكل متكرر.',
  'admin.issue.aiSlowSteps':
    'تحقق من منطقة نشر Azure AI Services — يزداد التأخير مع المسافة.\nتحقق من أن نشر النموذج لديه حصة TPM (رموز في الدقيقة) كافية.\nفكر في الترقية إلى نشر بمعدل نقل مخصص لتأخير ثابت.\nتحقق مما إذا كان فهرس AI Search كبيرًا — فكر في تحسين مصدر المعرفة.',
  'admin.issue.forbidden': 'أخطاء "Forbidden"',
  'admin.issue.forbiddenDesc': 'يرى المستخدمون أخطاء 403 عند الوصول إلى ميزات معينة.',
  'admin.issue.forbiddenSteps':
    'تحقق من حصول جميع أذونات Graph API المطلوبة على موافقة المسؤول.\nتحقق من تفعيل مخزن رموز مصادقة App Service.\nتأكد من عدم انتهاء صلاحية رمز المستخدم — جرب تسجيل الخروج والدخول مرة أخرى.\nتحقق من سياسات الوصول المشروط للمستأجر.',
  'admin.issue.kbPartial': 'KB تفشل لبعض المستخدمين',
  'admin.issue.kbPartialDesc': 'بحث قاعدة المعرفة يعمل للمسؤولين لكن ليس للمستخدمين الآخرين.',
  'admin.issue.kbPartialSteps':
    'مصادر معرفة Remote SharePoint تستخدم أذونات لكل مستخدم. يجب أن يكون لكل مستخدم وصول SharePoint إلى المستندات.\nتحقق مما إذا كان المستخدمون المتأثرون محظورين بسياسات الوصول المشروط.\nتحقق من منح موافقة المسؤول لإذن Sites.Read.All المفوض.\nاطلب من المستخدمين المتأثرين تسجيل الخروج والدخول مرة أخرى لتحديث الرمز المميز.',

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

  // Yamazumi (Time Study)
  'yamazumi.detected.title': 'Time Study Data Detected',
  'yamazumi.detected.confidence': 'confidence',
  'yamazumi.detected.description':
    'Your data contains activity type classifications and cycle times suitable for Yamazumi analysis.',
  'yamazumi.detected.activityType': 'Activity Type',
  'yamazumi.detected.cycleTime': 'Cycle Time',
  'yamazumi.detected.step': 'Process Step',
  'yamazumi.detected.reason': 'Waste Reason',
  'yamazumi.detected.taktTime': 'Takt Time (optional)',
  'yamazumi.detected.taktPlaceholder': 'e.g., 120 seconds',
  'yamazumi.detected.decline': 'Use Standard Mode',
  'yamazumi.detected.enable': 'Enable Yamazumi Mode',

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
  'yamazumi.metric.total': 'Total',
  'yamazumi.metric.va': 'VA',
  'yamazumi.metric.nva': 'NVA',
  'yamazumi.metric.waste': 'Waste',
  'yamazumi.metric.wait': 'Wait',
  'yamazumi.pareto.steps-total': 'Steps by Total Time',
  'yamazumi.pareto.steps-waste': 'Steps by Waste Time',
  'yamazumi.pareto.steps-nva': 'Steps by NVA Time',
  'yamazumi.pareto.activities': 'Activities by Time',
  'yamazumi.pareto.reasons': 'Waste Reasons',
  'yamazumi.summary.vaRatio': 'VA Ratio',
  'yamazumi.summary.efficiency': 'Process Efficiency',
  'yamazumi.summary.leadTime': 'Total Lead Time',
  'yamazumi.summary.takt': 'Takt Time',
  'yamazumi.summary.setTakt': 'Set',
  'yamazumi.summary.overTakt': 'steps over takt',
  'yamazumi.takt': 'Takt',
  'yamazumi.mode.label': 'Yamazumi',
  'yamazumi.mode.switch': 'Switch to Yamazumi',

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
  'report.questionTree': 'Question Tree',
  'report.question.answered': 'Answered',
  'report.question.investigating': 'Investigating',
  'report.question.ruledOut': 'Ruled Out',
  'report.question.open': 'Open',
  'report.type.analysisSnapshot': 'Analysis Snapshot',
  'report.type.investigationReport': 'Investigation Report',
  'report.type.improvementStory': 'Improvement Story',
  'report.sections': 'Sections',
  'report.audience.technical': 'Technical',
  'report.audience.summary': 'Summary',
  'report.workspace.analysis': 'ANALYSIS',
  'report.workspace.findings': 'FINDINGS',
  'report.workspace.improvement': 'IMPROVEMENT',
  'report.action.copyAllCharts': 'Copy All Charts',
  'report.action.saveAsPdf': 'Save as PDF',
  'report.action.shareReport': 'Share Report',
  'report.action.publishToSharePoint': 'Publish to SharePoint',
  'report.action.publishedToSharePoint': 'Published to SharePoint',
  'report.publish.rendering': 'Rendering report\u2026',
  'report.publish.uploading': 'Uploading\u2026',
  'report.publish.exists': 'Report already exists in SharePoint.',
  'report.publish.replace': 'Replace',
  'report.publish.failed': 'Publish failed',
  'report.publish.tryAgain': 'Try again',
  'report.selectedCount': '{count} selected',
  'report.bestProjectedCpk': 'Best projected Cpk: {value}',
  'report.meetsTarget': '(meets target)',
  'report.costCategory': '{category} cost',
  'report.noCost': 'No cost',
  'report.riskLevel': '{level} risk',

  // Factor Intelligence
  'fi.title': 'ذكاء العوامل',
  'fi.ranking': 'ترتيب العوامل (R² المعدّل)',
  'fi.layer2': 'الطبقة 2 · التأثيرات الرئيسية',
  'fi.layer3': 'الطبقة 3 · تفاعلات العوامل',
  'fi.investigate': 'تحقيق →',
  'fi.notSignificant': 'غير معنوي (p={value})',
  'fi.explainsSingle': '{factor} يفسر {pct}% من التباين بمفرده.',
  'fi.explainsMultiple': '{factors} معاً يفسرون {pct}% من التباين.',
  'fi.layer2Locked': 'الطبقة 2 (التأثيرات الرئيسية) تُفتح عندما R²adj > {threshold}%',
  'fi.layer2Current': ' — حالياً {value}%',
  'fi.layer3Locked': 'الطبقة 3 (التفاعلات) تُفتح عندما يكون ≥2 من العوامل معنوية',
  'fi.layer3Current': ' — حالياً {count} معنوي',
  'fi.best': 'الأفضل',
  'fi.range': 'المدى',
  'fi.interactionDetected': 'تم اكتشاف تفاعل: تأثير {factorA} يعتمد على مستوى {factorB}.',
  'fi.noInteraction': 'لا يوجد تفاعل معنوي — التأثيرات تقريبياً جمعية.',

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

  // Upgrade (additional)
  'upgrade.freeTierLimitation': 'Free tier limitation',
  'upgrade.fromPrice': 'From \u20ac79/month',
};
