import type { MessageCatalog } from '../types';

/** Hindi message catalog */
export const hi: MessageCatalog = {
  // Statistics labels
  'stats.mean': 'माध्य',
  'stats.median': 'मध्यिका',
  'stats.stdDev': 'मानक विचलन',
  'stats.samples': 'नमूने',
  'stats.passRate': 'उत्तीर्ण दर',
  'stats.range': 'परिसर',
  'stats.min': 'न्यूनतम',
  'stats.max': 'अधिकतम',
  'stats.target': 'लक्ष्य',
  'stats.sigma': 'सिग्मा',

  // Chart labels
  'chart.observation': 'प्रेक्षण',
  'chart.count': 'गिनती',
  'chart.frequency': 'आवृत्ति',
  'chart.value': 'मान',
  'chart.category': 'श्रेणी',
  'chart.cumulative': 'संचयी %',
  'chart.clickToEdit': 'संपादित करने के लिए क्लिक करें',
  'chart.median': 'मध्यिका',
  'chart.q1': 'Q1',
  'chart.q3': 'Q3',
  'chart.noChannelData': 'कोई चैनल डेटा नहीं',
  'chart.selectChannel': 'चैनल चुनें',

  // Limit labels
  'limits.usl': 'USL',
  'limits.lsl': 'LSL',
  'limits.ucl': 'UCL',
  'limits.lcl': 'LCL',
  'limits.mean': 'माध्य',
  'limits.target': 'लक्ष्य',

  // Navigation
  'nav.newAnalysis': 'नया विश्लेषण',
  'nav.backToDashboard': 'डैशबोर्ड पर वापस जाएं',
  'nav.settings': 'सेटिंग्स',
  'nav.export': 'निर्यात',
  'nav.presentation': 'प्रस्तुति',
  'nav.menu': 'मेनू',
  'nav.moreActions': 'अधिक कार्य',

  // Panel titles
  'panel.findings': 'निष्कर्ष',
  'panel.dataTable': 'डेटा तालिका',
  'panel.whatIf': 'क्या होगा अगर',
  'panel.investigation': 'जांच',
  'panel.coScout': 'CoScout',
  'panel.drillPath': 'ड्रिल पथ',

  // View modes
  'view.list': 'सूची',
  'view.board': 'बोर्ड',
  'view.tree': 'वृक्ष',

  // Action buttons
  'action.save': 'सहेजें',
  'action.cancel': 'रद्द करें',
  'action.delete': 'हटाएं',
  'action.edit': 'संपादित करें',
  'action.copy': 'कॉपी करें',
  'action.close': 'बंद करें',
  'action.learnMore': 'और जानें',
  'action.download': 'डाउनलोड',
  'action.apply': 'लागू करें',
  'action.reset': 'रीसेट करें',
  'action.retry': 'पुनः प्रयास करें',
  'action.send': 'भेजें',
  'action.ask': 'पूछें',
  'action.clear': 'साफ़ करें',
  'action.copyAll': 'सभी कॉपी करें',
  'action.selectAll': 'सभी चुनें',

  // CoScout
  'coscout.send': 'भेजें',
  'coscout.clear': 'बातचीत साफ़ करें',
  'coscout.stop': 'रोकें',
  'coscout.rateLimit': 'दर सीमा पूरी हो गई। कृपया प्रतीक्षा करें।',
  'coscout.contentFilter': 'सुरक्षा नीति द्वारा सामग्री फ़िल्टर की गई।',
  'coscout.error': 'एक त्रुटि हुई। कृपया पुनः प्रयास करें।',

  // Display/settings
  'display.preferences': 'प्राथमिकताएं',
  'display.chartTextSize': 'चार्ट पाठ आकार',
  'display.compact': 'संक्षिप्त',
  'display.normal': 'सामान्य',
  'display.large': 'बड़ा',
  'display.lockYAxis': 'Y-अक्ष लॉक करें',
  'display.filterContext': 'फ़िल्टर संदर्भ',
  'display.showSpecs': 'विनिर्देश दिखाएं',

  // Investigation
  'investigation.brief': 'जांच सारांश',
  'investigation.assignedToMe': 'मुझे सौंपा गया',
  'investigation.hypothesis': 'परिकल्पना',
  'investigation.hypotheses': 'परिकल्पनाएं',
  'investigation.pinAsFinding': 'निष्कर्ष के रूप में पिन करें',
  'investigation.addObservation': 'प्रेक्षण जोड़ें',

  // Empty states
  'empty.noData': 'कोई डेटा उपलब्ध नहीं',
  'empty.noFindings': 'अभी तक कोई निष्कर्ष नहीं',
  'empty.noResults': 'कोई परिणाम नहीं मिला',

  // Error messages
  'error.generic': 'कुछ गलत हो गया',
  'error.loadFailed': 'डेटा लोड करने में विफल',
  'error.parseFailed': 'फ़ाइल पार्स करने में विफल',

  // Settings labels
  'settings.language': 'भाषा',
  'settings.theme': 'थीम',
  'settings.textSize': 'पाठ आकार',

  // Finding statuses
  'findings.observed': 'प्रेक्षित',
  'findings.investigating': 'जांच जारी',
  'findings.analyzed': 'विश्लेषित',
  'findings.improving': 'सुधार जारी',
  'findings.resolved': 'हल किया गया',

  // Report labels
  'report.summary': 'सारांश',
  'report.findings': 'निष्कर्ष',
  'report.recommendations': 'सिफारिशें',
  'report.evidence': 'साक्ष्य',

  // Data input labels
  'data.pasteData': 'डेटा पेस्ट करें',
  'data.uploadFile': 'फ़ाइल अपलोड करें',
  'data.columnMapping': 'स्तंभ मैपिंग',
  'data.measureColumn': 'माप स्तंभ',
  'data.factorColumn': 'कारक स्तंभ',
  'data.addData': 'डेटा जोड़ें',
  'data.editData': 'डेटा संपादित करें',
  'data.showDataTable': 'डेटा तालिका दिखाएं',
  'data.hideDataTable': 'डेटा तालिका छुपाएं',

  // Status
  'status.cached': 'कैश्ड',
  'status.loading': 'लोड हो रहा है',
  'status.ai': 'AI',

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
