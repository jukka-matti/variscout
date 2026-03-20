import type { MessageCatalog } from '../types';

/** Hebrew message catalog */
export const he: MessageCatalog = {
  // Statistics labels
  'stats.mean': 'ממוצע',
  'stats.median': 'חציון',
  'stats.stdDev': 'סטיית תקן',
  'stats.samples': 'דגימות',
  'stats.passRate': 'שיעור מעבר',
  'stats.range': 'טווח',
  'stats.min': 'מינימום',
  'stats.max': 'מקסימום',
  'stats.target': 'יעד',
  'stats.sigma': 'סיגמא',

  // Chart labels
  'chart.observation': 'תצפית',
  'chart.count': 'ספירה',
  'chart.frequency': 'תדירות',
  'chart.value': 'ערך',
  'chart.category': 'קטגוריה',
  'chart.cumulative': 'מצטבר %',
  'chart.clickToEdit': 'לחץ לעריכה',
  'chart.median': 'חציון',
  'chart.q1': 'Q1',
  'chart.q3': 'Q3',
  'chart.noChannelData': 'אין נתוני ערוץ',
  'chart.selectChannel': 'בחר ערוץ',

  // Limit labels
  'limits.usl': 'USL',
  'limits.lsl': 'LSL',
  'limits.ucl': 'UCL',
  'limits.lcl': 'LCL',
  'limits.mean': 'ממוצע',
  'limits.target': 'יעד',

  // Navigation
  'nav.newAnalysis': 'ניתוח חדש',
  'nav.backToDashboard': 'חזרה ללוח המחוונים',
  'nav.settings': 'הגדרות',
  'nav.export': 'ייצוא',
  'nav.presentation': 'מצגת',
  'nav.menu': 'תפריט',
  'nav.moreActions': 'פעולות נוספות',

  // Panel titles
  'panel.findings': 'ממצאים',
  'panel.dataTable': 'טבלת נתונים',
  'panel.whatIf': 'מה אם',
  'panel.investigation': 'חקירה',
  'panel.coScout': 'CoScout',
  'panel.drillPath': 'נתיב קידוח',

  // View modes
  'view.list': 'רשימה',
  'view.board': 'לוח',
  'view.tree': 'עץ',

  // Action buttons
  'action.save': 'שמור',
  'action.cancel': 'ביטול',
  'action.delete': 'מחק',
  'action.edit': 'ערוך',
  'action.copy': 'העתק',
  'action.close': 'סגור',
  'action.learnMore': 'למד עוד',
  'action.download': 'הורד',
  'action.apply': 'החל',
  'action.reset': 'אפס',
  'action.retry': 'נסה שוב',
  'action.send': 'שלח',
  'action.ask': 'שאל',
  'action.clear': 'נקה',
  'action.copyAll': 'העתק הכל',
  'action.selectAll': 'בחר הכל',

  // CoScout
  'coscout.send': 'שלח',
  'coscout.clear': 'נקה שיחה',
  'coscout.stop': 'עצור',
  'coscout.rateLimit': 'הגעת למגבלת קצב. אנא המתן.',
  'coscout.contentFilter': 'התוכן סונן על ידי מדיניות אבטחה.',
  'coscout.error': 'אירעה שגיאה. אנא נסה שוב.',

  // Display/settings
  'display.preferences': 'העדפות',
  'display.chartTextSize': 'גודל טקסט תרשים',
  'display.compact': 'צפוף',
  'display.normal': 'רגיל',
  'display.large': 'גדול',
  'display.lockYAxis': 'נעל ציר Y',
  'display.filterContext': 'הקשר סינון',
  'display.showSpecs': 'הצג מפרטים',

  // Investigation
  'investigation.brief': 'תקציר חקירה',
  'investigation.assignedToMe': 'מוקצה אליי',
  'investigation.hypothesis': 'השערה',
  'investigation.hypotheses': 'השערות',
  'investigation.pinAsFinding': 'הצמד כממצא',
  'investigation.addObservation': 'הוסף תצפית',

  // Empty states
  'empty.noData': 'אין נתונים זמינים',
  'empty.noFindings': 'אין ממצאים עדיין',
  'empty.noResults': 'לא נמצאו תוצאות',

  // Error messages
  'error.generic': 'משהו השתבש',
  'error.loadFailed': 'טעינת הנתונים נכשלה',
  'error.parseFailed': 'ניתוח הקובץ נכשל',

  // Settings labels
  'settings.language': 'שפה',
  'settings.theme': 'ערכת נושא',
  'settings.textSize': 'גודל טקסט',

  // Finding statuses
  'findings.observed': 'נצפה',
  'findings.investigating': 'בחקירה',
  'findings.analyzed': 'נותח',
  'findings.improving': 'בשיפור',
  'findings.resolved': 'נפתר',

  // Report labels
  'report.summary': 'סיכום',
  'report.findings': 'ממצאים',
  'report.recommendations': 'המלצות',
  'report.evidence': 'ראיות',

  // Data input labels
  'data.pasteData': 'הדבק נתונים',
  'data.uploadFile': 'העלה קובץ',
  'data.columnMapping': 'מיפוי עמודות',
  'data.measureColumn': 'עמודת מדידה',
  'data.factorColumn': 'עמודת גורם',
  'data.addData': 'הוסף נתונים',
  'data.editData': 'ערוך נתונים',
  'data.showDataTable': 'הצג טבלת נתונים',
  'data.hideDataTable': 'הסתר טבלת נתונים',

  // Status
  'status.cached': 'שמור במטמון',
  'status.loading': 'טוען',
  'status.ai': 'בינה',

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
  'ai.tool.suggestIdea': 'Suggest improvement idea',

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
  'chart.violation.nelson2.detail': 'כלל נלסון 2 — רצף {count} {side} ממוצע (#{start}–{end})',
  'chart.violation.nelson3.detail': 'כלל נלסון 3 — מגמה {count} {direction} (#{start}–{end})',
  'chart.violation.side.above': 'מעל',
  'chart.violation.side.below': 'מתחת',
  'chart.violation.direction.increasing': 'עולה',
  'chart.violation.direction.decreasing': 'יורד',

  // Parameterized messages
  'data.rowsLoaded': '{count} rows loaded',
  'findings.countLabel': '{count} ממצאים',

  // Chart limit labels
  'chart.label.ucl': 'UCL:',
  'chart.label.lcl': 'LCL:',
  'chart.label.mean': 'ממוצע:',
  'chart.label.tgt': 'יעד:',
  'chart.label.usl': 'USL:',
  'chart.label.lsl': 'LSL:',
  'chart.label.value': 'ערך:',
  'chart.label.n': 'n:',
  'chart.label.target': 'יעד:',

  // Chart status
  'chart.status.inControl': 'בשליטה',
  'chart.status.outOfControl': 'מחוץ לשליטה (מעבר ל-UCL/LCL)',
  'chart.noDataProbPlot': 'אין נתונים זמינים לתרשים הסתברות',

  // Chart edit affordances
  'chart.edit.spec': 'לחץ לעריכת {spec}',
  'chart.edit.axisLabel': 'לחץ לעריכת תווית הציר',
  'chart.edit.yAxis': 'לחץ לעריכת סולם ציר Y',
  'chart.edit.saveCancel': 'Enter לשמירה · Esc לביטול',

  // Performance table headers
  'chart.table.channel': 'ערוץ',
  'stats.cp': 'Cp',

  // Chart UI labels
  'chart.copyToClipboard': 'העתק תרשים ללוח',
  'chart.maximize': 'הגדל תרשים',
  'chart.type.ichart': 'I-Chart',
  'chart.type.boxplot': 'Boxplot',
  'chart.type.pareto': 'Pareto',
  'chart.drillHere': '↓ חפור כאן',
  'chart.percent': 'אחוז',

  // Y-axis popover
  'chart.yAxisScale': 'סולם ציר Y',
  'validation.minLessThanMax': 'מינימום חייב להיות קטן ממקסימום',
  'action.noChanges': 'אין שינויים',

  // Create factor modal
  'factor.create': 'צור גורם מבחירה',
  'factor.name': 'שם הגורם',
  'factor.nameEmpty': 'שם הגורם לא יכול להיות ריק',
  'factor.nameExists': 'גורם בשם זה כבר קיים',
  'factor.example': 'לדוגמה, אירועי טמפרטורה גבוהה',
  'factor.pointsMarked': '{count} נקודות יסומנו כ:',
  'factor.createAndFilter': 'צור וסנן',
  'factor.filterExplanation': 'התצוגה תסונן אוטומטית להצגת הנקודות שנבחרו בלבד.',

  // Characteristic type selector
  'charType.nominal': 'נומינלי',
  'charType.nominalDesc': 'ממוקד יעד (לדוגמה, משקל מילוי)',
  'charType.smaller': 'קטן יותר עדיף',
  'charType.smallerDesc': 'נמוך יותר עדיף (לדוגמה, פגמים)',
  'charType.larger': 'גדול יותר עדיף',
  'charType.largerDesc': 'גבוה יותר עדיף (לדוגמה, תפוקה)',

  // Investigation prompt
  'investigation.trackingPrompt':
    'עוקבים אחרי החקירה שלך — פתח את לוח החקירה לראות את התמונה המלאה.',

  // Mobile category sheet
  'chart.highlight': 'הדגשה:',
  'chart.highlightRed': 'אדום',
  'chart.highlightAmber': 'ענבר',
  'chart.highlightGreen': 'ירוק',
  'chart.clearHighlight': 'נקה הדגשה',
  'chart.drillDown': 'חפור לתוך "{category}"',
  'ai.askCoScout': 'שאל את CoScout על זה',

  // Settings descriptions
  'display.lockYAxisDesc': 'שומר על הסולם להשוואה חזותית',
  'display.filterContextDesc': 'הצג סיכום מסנן פעיל מתחת לכותרות התרשימים',

  // Performance detected modal
  'performance.detected': 'זוהה מצב ביצועים',
  'performance.columnsFound': 'נמצאו {count} עמודות מדידה',
  'performance.labelQuestion': 'מה מייצגים ערוצי המדידה האלה?',
  'performance.labelExample': 'לדוגמה, ראש מילוי, חלל, זרבובית',
  'performance.enable': 'הפעל מצב ביצועים',

  // Finding editor & data types
  'finding.placeholder': 'מה מצאת?',
  'finding.note': 'הערת ממצא',
  'data.typeNumeric': 'מספרי',
  'data.typeCategorical': 'קטגורי',
  'data.typeDate': 'תאריך',
  'data.typeText': 'טקסט',
  'data.categories': 'קטגוריות',

  // PWA HomeScreen
  'home.heading': 'חקור ניתוח שונות',
  'home.description':
    'כלי הדרכה חינמי לניתוח שונות. הצג משתנות, חשב יכולת, ומצא היכן להתמקד — ישירות בדפדפן שלך.',
  'home.divider': 'או השתמש בנתונים שלך',
  'home.pasteHelper': 'העתק שורות והדבק — נזהה עמודות אוטומטית',
  'home.manualEntry': 'או הזן נתונים ידנית',
  'home.upgradeHint': 'צריך תכונות צוות, העלאת קבצים, או פרויקטים שמורים?',

  // PWA navigation
  'nav.presentationMode': 'מצב מצגת',
  'nav.hideFindings': 'הסתר ממצאים',

  // Export
  'export.asImage': 'ייצא כתמונה',
  'export.asCsv': 'ייצא כ-CSV',
  'export.imageDesc': 'צילום מסך PNG למצגות',
  'export.csvDesc': 'קובץ נתונים תואם גיליונות אלקטרוניים',

  // Sample section
  'sample.heading': 'נסה מערך נתונים לדוגמה',
  'sample.allSamples': 'כל מערכי הנתונים לדוגמה',
  'sample.featured': 'מומלצים',
  'sample.caseStudies': 'מקרי בוחן',
  'sample.journeys': 'מסעות למידה',
  'sample.industry': 'דוגמאות תעשייתיות',

  // View modes
  'view.stats': 'סטטיסטיקה',
  'display.appearance': 'מראה',

  // Azure toolbar
  'data.manualEntry': 'הזנה ידנית',
  'data.editTable': 'ערוך טבלת נתונים',
  'toolbar.saveAs': 'שמור בשם…',
  'toolbar.saving': 'שומר…',
  'toolbar.saved': 'נשמר',
  'toolbar.saveFailed': 'השמירה נכשלה',
  'toolbar.addMore': 'הוסף נתונים',
  'report.scouting': 'דוח סיור',
  'export.csvFiltered': 'ייצא נתונים מסוננים כ-CSV',
  'error.auth': 'שגיאת אימות',

  // File browse
  'file.browseLocal': 'עיין במכשיר זה',
  'file.browseSharePoint': 'עיין ב-SharePoint',
  'file.open': 'פתח קובץ',

  // Admin hub
  'admin.title': 'ניהול',
  'admin.status': 'סטטוס',
  'admin.plan': 'תוכנית ותכונות',
  'admin.teams': 'הגדרת Teams',
  'admin.knowledge': 'בסיס ידע',
  'admin.troubleshooting': 'פתרון בעיות',

  // Admin plan tab
  'admin.currentPlan': 'נוכחית',
  'admin.feature': 'תכונה',
  'admin.manageSubscription': 'נהל מנוי ב-Azure',
  'admin.planStandard': 'Standard',
  'admin.planTeam': 'Team',
  'admin.planStandardPrice': '€79/חודש',
  'admin.planTeamPrice': '€199/חודש',
  'admin.planStandardDesc': 'ניתוח מלא עם CoScout AI',
  'admin.planTeamDesc': 'Teams, OneDrive, SharePoint, בסיס ידע',

  // Feature names
  'feature.charts': 'I-Chart, Boxplot, Pareto, סטטיסטיקה',
  'feature.capability': 'ניתוח יכולת (Cp/Cpk)',
  'feature.performance': 'מצב ביצועים (רב-ערוצי)',
  'feature.anova': 'ANOVA וניתוח גורמים',
  'feature.findingsWorkflow': 'ממצאים וזרימת עבודה לחקירה',
  'feature.whatIf': 'סימולציית מה-אם',
  'feature.csvImport': 'ייבוא CSV/Excel',
  'feature.reportExport': 'ייצוא דוחות (PDF)',
  'feature.indexedDb': 'אחסון מקומי IndexedDB',
  'feature.maxFactors': 'עד 6 גורמים',
  'feature.maxRows': 'עד 100K שורות',
  'feature.onedriveSync': 'סנכרון פרויקטים ב-OneDrive',
  'feature.sharepointPicker': 'בורר קבצים של SharePoint',
  'feature.teamsIntegration': 'שילוב Microsoft Teams',
  'feature.channelCollab': 'שיתוף פעולה מבוסס ערוצים',
  'feature.mobileUi': 'ממשק מותאם לנייד',
  'feature.coScoutAi': 'עוזר CoScout AI',
  'feature.narrativeBar': 'תובנות NarrativeBar',
  'feature.chartInsights': 'שבבי תובנות תרשימים',
  'feature.knowledgeBase': 'בסיס ידע (חיפוש SharePoint)',
  'feature.aiActions': 'פעולות מוצעות על ידי AI',

  // Admin Teams setup
  'admin.teams.heading': 'הוסף את VariScout ל-Microsoft Teams',
  'admin.teams.description':
    'צור חבילת אפליקציית Teams לפריסה שלך והעלה אותה למרכז הניהול של Teams.',
  'admin.teams.running': 'פועל בתוך Microsoft Teams',
  'admin.teams.step1': 'מזהה לקוח של רישום אפליקציה (אופציונלי)',
  'admin.teams.step1Desc':
    'הזן את מזהה הלקוח של רישום האפליקציה ב-Azure AD כדי להפעיל Teams SSO במניפסט.',
  'admin.teams.step2': 'הורד את חבילת אפליקציית Teams',
  'admin.teams.step2Desc': 'קובץ ה-.zip הזה מכיל את המניפסט והאייקונים המוגדרים מראש לפריסה שלך.',
  'admin.teams.step3': 'העלה למרכז הניהול של Teams',
  'admin.teams.step4': 'הוסף את VariScout לערוץ',
  'admin.teams.download': 'הורד חבילת אפליקציית Teams',

  // Admin status tab
  'admin.checksResult': '{pass}/{total} בדיקות עברו',
  'admin.runChecks': 'הפעל את כל הבדיקות',
  'admin.notApplicable': 'לא רלוונטי לתוכנית שלך',
  'admin.managePortal': 'נהל ב-Azure Portal',
  'admin.portalAccessNote': 'פריטים אלה דורשים גישה ל-Azure Portal ולא ניתן לבדוק אותם מהדפדפן.',
  'admin.fixInPortal': 'תקן ב-Azure Portal: {label}',

  // Admin troubleshoot tab
  'admin.troubleshoot.intro':
    'בעיות נפוצות וכיצד לתקן אותן. לחץ על בעיה לצפייה בהוראות שלב אחר שלב.',
  'admin.runCheck': 'הפעל בדיקה',
  'admin.checkPassed': 'הבדיקה עברה — ייתכן שזו לא הבעיה.',
  'admin.checkFailed': 'הבדיקה נכשלה — עקוב אחר השלבים למטה.',
  'admin.issue.signin': 'משתמשים לא יכולים להתחבר',
  'admin.issue.signinDesc': 'אימות Azure AD לא עובד או משתמשים רואים דף ריק.',
  'admin.issue.signinSteps':
    'ודא שאימות App Service מופעל ב-Azure Portal.\nבדוק שלרישום אפליקציית Azure AD יש כתובות URI להפניה נכונות.\nוודא שלרישום האפליקציה יש "אסימוני זיהוי" מופעלים תחת אימות.\nוודא שהדייר מאפשר למשתמשים להתחבר לאפליקציה (אפליקציות ארגוניות → מאפיינים → מופעל להתחברות משתמשים).',
  'admin.issue.onedrive': 'סנכרון OneDrive לא עובד',
  'admin.issue.onedriveDesc': 'פרויקטים לא מסתנכרנים ל-OneDrive או משתמשים רואים שגיאות הרשאה.',
  'admin.issue.onedriveSteps':
    'ודא שלרישום האפליקציה יש הרשאה מואצלת "Files.ReadWrite".\nבדוק שניתנה הסכמת מנהל להרשאות Graph.\nוודא שלמשתמש מוקצה רישיון OneDrive.\nנסה להתנתק ולהתחבר מחדש כדי לרענן את האסימון.',
  'admin.issue.coscout': 'CoScout לא מגיב',
  'admin.issue.coscoutDesc': 'עוזר ה-AI לא מייצר תגובות או מציג שגיאות.',
  'admin.issue.coscoutSteps':
    'ודא שנקודת קצה AI מוגדרת בתבנית ARM / הגדרות App Service.\nבדוק שמשאב Azure AI Services פרוס ופועל.\nוודא שפריסת המודל קיימת (למשל gpt-4o) במשאב AI Services.\nבדוק מכסות Azure AI Services — הפריסה עשויה להגיע למגבלות קצב.',
  'admin.issue.kbEmpty': 'בסיס הידע לא מחזיר תוצאות',
  'admin.issue.kbEmptyDesc': '"חפש בבסיס הידע" של CoScout לא מוצא כלום למרות שקיימים מסמכים.',
  'admin.issue.kbEmptySteps':
    'ודא שנקודת קצה AI Search מוגדרת בהגדרות App Service.\nבדוק שמקור ידע Remote SharePoint נוצר ב-AI Search.\nוודא ש-≥1 רישיון Microsoft 365 Copilot פעיל בדייר.\nוודא שלמשתמש יש גישת SharePoint למסמכים הנחפשים.\nבדוק שמתג התצוגה המקדימה של בסיס הידע מופעל (ניהול → לשונית בסיס ידע).',
  'admin.issue.teamsTab': 'לשונית Teams לא מופיעה',
  'admin.issue.teamsTabDesc': 'VariScout לא מופיע ב-Teams או שהלשונית לא נטענת.',
  'admin.issue.teamsTabSteps':
    'ודא שחבילת אפליקציית Teams (.zip) הועלתה למרכז הניהול של Teams.\nבדוק ש-contentUrl ב-manifest.json תואם לכתובת ה-URL של App Service.\nוודא שהאפליקציה מאושרת במרכז הניהול של Teams (לא חסומה על ידי מדיניות).\nנסה להסיר ולהוסיף מחדש את הלשונית בערוץ.\nאם משתמשים בדומיין מותאם אישית, ודא שהוא במערך validDomains של המניפסט.',
  'admin.issue.newUser': 'משתמש חדש לא יכול לגשת לאפליקציה',
  'admin.issue.newUserDesc': 'משתמש שנוסף לאחרונה רואה גישה נדחתה או דף ריק.',
  'admin.issue.newUserSteps':
    'ב-Azure AD, עבור לאפליקציות ארגוניות → VariScout → משתמשים וקבוצות.\nהוסף את המשתמש או קבוצת האבטחה שלהם לאפליקציה.\nאם "הקצאת משתמש נדרשת" מופעלת, ודא שלמשתמש יש הקצאה.\nבדוק מדיניות גישה מותנית שעלולה לחסום את המשתמש.',
  'admin.issue.aiSlow': 'תגובות AI איטיות',
  'admin.issue.aiSlowDesc': 'CoScout לוקח זמן רב להגיב או פג תוקף בתדירות גבוהה.',
  'admin.issue.aiSlowSteps':
    'בדוק את אזור פריסת Azure AI Services — השהייה גדלה עם המרחק.\nודא שלפריסת המודל יש מכסת TPM (אסימונים בדקה) מספיקה.\nשקול שדרוג לפריסה עם תפוקה מוקצית לשהייה עקבית.\nבדוק אם אינדקס AI Search גדול — שקול לייעל את מקור הידע.',
  'admin.issue.forbidden': 'שגיאות "Forbidden"',
  'admin.issue.forbiddenDesc': 'משתמשים רואים שגיאות 403 בעת גישה לתכונות מסוימות.',
  'admin.issue.forbiddenSteps':
    'בדוק שלכל הרשאות Graph API הנדרשות יש הסכמת מנהל.\nוודא שמאגר אסימוני אימות App Service מופעל.\nוודא שאסימון המשתמש לא פג — נסה להתנתק ולהתחבר מחדש.\nבדוק מדיניות גישה מותנית של הדייר.',
  'admin.issue.kbPartial': 'KB נכשל עבור חלק מהמשתמשים',
  'admin.issue.kbPartialDesc': 'חיפוש בסיס הידע עובד למנהלים אך לא למשתמשים אחרים.',
  'admin.issue.kbPartialSteps':
    'מקורות ידע Remote SharePoint משתמשים בהרשאות לכל משתמש. לכל משתמש חייבת להיות גישת SharePoint למסמכים.\nבדוק אם המשתמשים המושפעים חסומים על ידי מדיניות גישה מותנית.\nוודא שניתנה הסכמת מנהל להרשאה המואצלת Sites.Read.All.\nבקש מהמשתמשים המושפעים להתנתק ולהתחבר מחדש כדי לרענן את האסימון שלהם.',

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

  // Hypothesis role labels
  'hypothesis.primary': 'Primary',
  'hypothesis.contributing': 'Contributing',
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
};
