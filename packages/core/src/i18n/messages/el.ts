import type { MessageCatalog } from '../types';

/** Greek message catalog */
export const el: MessageCatalog = {
  // Statistics labels
  'stats.mean': 'Μέσος όρος',
  'stats.median': 'Διάμεσος',
  'stats.stdDev': 'Τυπ. Απόκλιση',
  'stats.samples': 'Δείγματα',
  'stats.passRate': 'Ποσοστό επιτυχίας',
  'stats.range': 'Εύρος',
  'stats.min': 'Ελάχ.',
  'stats.max': 'Μέγ.',
  'stats.target': 'Στόχος',
  'stats.sigma': 'Σίγμα',

  // Chart labels
  'chart.observation': 'Παρατήρηση',
  'chart.count': 'Πλήθος',
  'chart.frequency': 'Συχνότητα',
  'chart.value': 'Τιμή',
  'chart.category': 'Κατηγορία',
  'chart.cumulative': 'Αθροιστικό %',
  'chart.clickToEdit': 'Κλικ για επεξεργασία',
  'chart.median': 'Διάμεσος',
  'chart.q1': 'Q1',
  'chart.q3': 'Q3',
  'chart.noChannelData': 'Δεν υπάρχουν δεδομένα καναλιού',
  'chart.selectChannel': 'Επιλογή καναλιού',

  // Limit labels
  'limits.usl': 'USL',
  'limits.lsl': 'LSL',
  'limits.ucl': 'UCL',
  'limits.lcl': 'LCL',
  'limits.mean': 'Μέσος όρος',
  'limits.target': 'Στόχος',

  // Navigation
  'nav.newAnalysis': 'Νέα Ανάλυση',
  'nav.backToDashboard': 'Επιστροφή στον Πίνακα',
  'nav.settings': 'Ρυθμίσεις',
  'nav.export': 'Εξαγωγή',
  'nav.presentation': 'Παρουσίαση',
  'nav.menu': 'Μενού',
  'nav.moreActions': 'Περισσότερες ενέργειες',

  // Panel titles
  'panel.findings': 'Ευρήματα',
  'panel.dataTable': 'Πίνακας Δεδομένων',
  'panel.whatIf': 'Τι εάν',
  'panel.investigation': 'Διερεύνηση',
  'panel.coScout': 'CoScout',
  'panel.drillPath': 'Διαδρομή ανάλυσης',

  // View modes
  'view.list': 'Λίστα',
  'view.board': 'Πίνακας',
  'view.tree': 'Δέντρο',

  // Action buttons
  'action.save': 'Αποθήκευση',
  'action.cancel': 'Ακύρωση',
  'action.delete': 'Διαγραφή',
  'action.edit': 'Επεξεργασία',
  'action.copy': 'Αντιγραφή',
  'action.close': 'Κλείσιμο',
  'action.learnMore': 'Μάθετε περισσότερα',
  'action.download': 'Λήψη',
  'action.apply': 'Εφαρμογή',
  'action.reset': 'Επαναφορά',
  'action.retry': 'Επανάληψη',
  'action.send': 'Αποστολή',
  'action.ask': 'Ρωτήστε',
  'action.clear': 'Εκκαθάριση',
  'action.copyAll': 'Αντιγραφή όλων',
  'action.selectAll': 'Επιλογή όλων',

  // CoScout
  'coscout.send': 'Αποστολή',
  'coscout.clear': 'Εκκαθάριση συνομιλίας',
  'coscout.stop': 'Διακοπή',
  'coscout.rateLimit': 'Συμπληρώθηκε το όριο αιτημάτων. Παρακαλώ περιμένετε.',
  'coscout.contentFilter': 'Το περιεχόμενο φιλτραρίστηκε από την πολιτική ασφαλείας.',
  'coscout.error': 'Παρουσιάστηκε σφάλμα. Παρακαλώ δοκιμάστε ξανά.',

  // Display/settings
  'display.preferences': 'Προτιμήσεις',
  'display.chartTextSize': 'Μέγεθος κειμένου γραφήματος',
  'display.compact': 'Συμπαγές',
  'display.normal': 'Κανονικό',
  'display.large': 'Μεγάλο',
  'display.lockYAxis': 'Κλείδωμα άξονα Υ',
  'display.filterContext': 'Πλαίσιο φίλτρου',
  'display.showSpecs': 'Εμφάνιση προδιαγραφών',

  // Investigation
  'investigation.brief': 'Σύνοψη Διερεύνησης',
  'investigation.assignedToMe': 'Ανατέθηκε σε εμένα',
  'investigation.hypothesis': 'Υπόθεση',
  'investigation.hypotheses': 'Υποθέσεις',
  'investigation.pinAsFinding': 'Καρφίτσωμα ως εύρημα',
  'investigation.addObservation': 'Προσθήκη παρατήρησης',

  // Empty states
  'empty.noData': 'Δεν υπάρχουν διαθέσιμα δεδομένα',
  'empty.noFindings': 'Δεν υπάρχουν ευρήματα ακόμα',
  'empty.noResults': 'Δεν βρέθηκαν αποτελέσματα',

  // Error messages
  'error.generic': 'Κάτι πήγε στραβά',
  'error.loadFailed': 'Αποτυχία φόρτωσης δεδομένων',
  'error.parseFailed': 'Αποτυχία ανάλυσης αρχείου',

  // Settings labels
  'settings.language': 'Γλώσσα',
  'settings.theme': 'Θέμα',
  'settings.textSize': 'Μέγεθος κειμένου',

  // Finding statuses
  'findings.observed': 'Παρατηρήθηκε',
  'findings.investigating': 'Υπό διερεύνηση',
  'findings.analyzed': 'Αναλύθηκε',
  'findings.improving': 'Υπό βελτίωση',
  'findings.resolved': 'Επιλύθηκε',

  // Report labels
  'report.summary': 'Σύνοψη',
  'report.findings': 'Ευρήματα',
  'report.recommendations': 'Συστάσεις',
  'report.evidence': 'Τεκμηρίωση',

  // Data input labels
  'data.pasteData': 'Επικόλληση δεδομένων',
  'data.uploadFile': 'Μεταφόρτωση αρχείου',
  'data.columnMapping': 'Αντιστοίχιση στηλών',
  'data.measureColumn': 'Στήλη μέτρησης',
  'data.factorColumn': 'Στήλη παράγοντα',
  'data.addData': 'Προσθήκη δεδομένων',
  'data.editData': 'Επεξεργασία δεδομένων',
  'data.showDataTable': 'Εμφάνιση πίνακα δεδομένων',
  'data.hideDataTable': 'Απόκρυψη πίνακα δεδομένων',

  // Status
  'status.cached': 'Αποθηκευμένο',
  'status.loading': 'Φόρτωση',
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

  // Chart violation details (parameterized)
  'chart.violation.nelson2.detail':
    'Κανόνας Nelson 2 — σειρά {count} {side} μέσου (#{start}–{end})',
  'chart.violation.nelson3.detail': 'Κανόνας Nelson 3 — τάση {count} {direction} (#{start}–{end})',
  'chart.violation.side.above': 'πάνω',
  'chart.violation.side.below': 'κάτω',
  'chart.violation.direction.increasing': 'αυξητική',
  'chart.violation.direction.decreasing': 'φθίνουσα',

  // Parameterized messages
  'data.rowsLoaded': '{count} rows loaded',
  'findings.countLabel': '{count} findings',
};
