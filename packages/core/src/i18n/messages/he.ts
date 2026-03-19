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
