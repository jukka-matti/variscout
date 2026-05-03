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
  'display.density': 'Πυκνότητα εμφάνισης',
  'display.lockYAxis': 'Κλείδωμα άξονα Υ',
  'display.filterContext': 'Πλαίσιο φίλτρου',
  'display.showSpecs': 'Εμφάνιση προδιαγραφών',

  // Investigation
  'investigation.brief': 'Σύνοψη Διερεύνησης',
  'investigation.assignedToMe': 'Ανατέθηκε σε εμένα',
  'investigation.question': 'Question',
  'investigation.questions': 'Questions',
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
  'investigation.phaseConverging': 'Narrow to contribution',
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
    'Κανόνας Nelson 2 — σειρά {count} {side} μέσου (#{start}–{end})',
  'chart.violation.nelson3.detail': 'Κανόνας Nelson 3 — τάση {count} {direction} (#{start}–{end})',
  'chart.violation.side.above': 'πάνω',
  'chart.violation.side.below': 'κάτω',
  'chart.violation.direction.increasing': 'αυξητική',
  'chart.violation.direction.decreasing': 'φθίνουσα',

  // Parameterized messages
  'data.rowsLoaded': '{count} rows loaded',
  'findings.countLabel': '{count} ευρήματα',
  'chart.label.target': 'Στόχος:',

  // Chart limit labels
  'chart.label.ucl': 'UCL:',
  'chart.label.lcl': 'LCL:',
  'chart.label.mean': 'Μέσος:',
  'chart.label.tgt': 'Στόχ.:',
  'chart.label.usl': 'USL:',
  'chart.label.lsl': 'LSL:',
  'chart.label.value': 'Τιμή:',
  'chart.label.n': 'n:',

  // Chart status
  'chart.status.inControl': 'Υπό έλεγχο',
  'chart.status.outOfControl': 'Εκτός ελέγχου (πέρα από UCL/LCL)',
  'chart.noDataProbPlot': 'Δεν υπάρχουν δεδομένα για το διάγραμμα πιθανότητας',

  // Chart edit affordances
  'chart.edit.spec': 'Κλικ για επεξεργασία {spec}',
  'chart.edit.axisLabel': 'Κλικ για επεξεργασία ετικέτας άξονα',
  'chart.edit.yAxis': 'Κλικ για επεξεργασία κλίμακας άξονα Y',
  'chart.edit.saveCancel': 'Enter για αποθήκευση · Esc για ακύρωση',

  // Performance table headers
  'chart.table.channel': 'Κανάλι',
  'stats.cp': 'Cp',

  // Chart UI labels
  'chart.copyToClipboard': 'Αντιγραφή γραφήματος στο πρόχειρο',
  'chart.maximize': 'Μεγιστοποίηση γραφήματος',
  'chart.type.ichart': 'I-Chart',
  'chart.type.boxplot': 'Boxplot',
  'chart.type.pareto': 'Pareto',
  'chart.drillHere': '↓ ανάλυση εδώ',
  'chart.percent': 'Ποσοστό',
  'boxplot.factor.label': 'Factor',

  // Y-axis popover
  'chart.yAxisScale': 'Κλίμακα Άξονα Y',
  'validation.minLessThanMax': 'Το ελάχιστο πρέπει να είναι μικρότερο από το μέγιστο',
  'action.noChanges': 'Χωρίς αλλαγές',

  // Create factor modal
  'factor.create': 'Δημιουργία παράγοντα από επιλογή',
  'factor.name': 'Όνομα παράγοντα',
  'factor.nameEmpty': 'Το όνομα παράγοντα δεν μπορεί να είναι κενό',
  'factor.nameExists': 'Υπάρχει ήδη παράγοντας με αυτό το όνομα',
  'factor.example': 'π.χ., Συμβάντα υψηλής θερμοκρασίας',
  'factor.pointsMarked': '{count} σημεία θα επισημανθούν ως:',
  'factor.createAndFilter': 'Δημιουργία & Φιλτράρισμα',
  'factor.filterExplanation':
    'Η προβολή θα φιλτραριστεί αυτόματα για εμφάνιση μόνο των επιλεγμένων σημείων.',

  // Characteristic type selector
  'charType.nominal': 'Ονομαστικό',
  'charType.nominalDesc': 'Κεντραρισμένο στο στόχο (π.χ. βάρος πλήρωσης)',
  'charType.smaller': 'Μικρότερο είναι καλύτερο',
  'charType.smallerDesc': 'Χαμηλότερο είναι καλύτερο (π.χ. ελαττώματα)',
  'charType.larger': 'Μεγαλύτερο είναι καλύτερο',
  'charType.largerDesc': 'Υψηλότερο είναι καλύτερο (π.χ. απόδοση)',

  // Investigation prompt
  'investigation.trackingPrompt':
    'Παρακολούθηση της έρευνάς σας — ανοίξτε τον πίνακα Έρευνας για πλήρη εικόνα.',

  // Mobile category sheet
  'chart.highlight': 'Επισήμανση:',
  'chart.highlightRed': 'Κόκκινο',
  'chart.highlightAmber': 'Κεχριμπαρί',
  'chart.highlightGreen': 'Πράσινο',
  'chart.clearHighlight': 'Αφαίρεση επισήμανσης',
  'chart.drillDown': 'Ανάλυση στο "{category}"',
  'ai.askCoScout': "Ρωτήστε το CoScout γι' αυτό",

  // Settings descriptions
  'display.lockYAxisDesc': 'Διατηρεί την κλίμακα για οπτική σύγκριση',
  'display.filterContextDesc': 'Εμφάνιση σύνοψης ενεργού φίλτρου κάτω από τους τίτλους γραφημάτων',

  // Performance detected modal
  'performance.detected': 'Εντοπίστηκε λειτουργία απόδοσης',
  'performance.columnsFound': 'Βρέθηκαν {count} στήλες μέτρησης',
  'performance.labelQuestion': 'Τι αντιπροσωπεύουν αυτά τα κανάλια μέτρησης;',
  'performance.labelExample': 'π.χ., Κεφαλή πλήρωσης, Κοιλότητα, Ακροφύσιο',
  'performance.enable': 'Ενεργοποίηση λειτουργίας απόδοσης',

  // Finding editor & data types
  'finding.placeholder': 'Τι ανακαλύψατε;',
  'finding.note': 'Σημείωση ευρήματος',
  'data.typeNumeric': 'Αριθμητικό',
  'data.typeCategorical': 'Κατηγορικό',
  'data.typeDate': 'Ημερομηνία',
  'data.typeText': 'Κείμενο',
  'data.categories': 'κατηγορίες',

  // PWA HomeScreen
  'home.heading': 'Εξερεύνηση ανάλυσης διακύμανσης',
  'home.description':
    'Δωρεάν εργαλείο εκπαίδευσης ανάλυσης διακύμανσης. Οπτικοποιήστε τη μεταβλητότητα, υπολογίστε την ικανότητα και βρείτε πού να εστιάσετε — απευθείας στο πρόγραμμα περιήγησής σας.',
  'home.divider': 'ή χρησιμοποιήστε τα δικά σας δεδομένα',
  'home.pasteHelper': 'Αντιγράψτε γραμμές και επικολλήστε — θα ανιχνεύσουμε αυτόματα τις στήλες',
  'home.manualEntry': 'Ή εισάγετε δεδομένα χειροκίνητα',
  'home.upgradeHint': 'Χρειάζεστε λειτουργίες ομάδας, μεταφόρτωση αρχείων ή αποθηκευμένα έργα;',

  // PWA navigation
  'nav.presentationMode': 'Λειτουργία παρουσίασης',
  'nav.hideFindings': 'Απόκρυψη ευρημάτων',

  // Export
  'export.asImage': 'Εξαγωγή ως εικόνα',
  'export.asCsv': 'Εξαγωγή ως CSV',
  'export.imageDesc': 'Στιγμιότυπο PNG για παρουσιάσεις',
  'export.csvDesc': 'Αρχείο δεδομένων συμβατό με υπολογιστικά φύλλα',

  // Sample section
  'sample.heading': 'Δοκιμάστε ένα δείγμα δεδομένων',
  'sample.allSamples': 'Όλα τα δείγματα δεδομένων',
  'sample.featured': 'Προτεινόμενα',
  'sample.caseStudies': 'Μελέτες περίπτωσης',
  'sample.journeys': 'Μαθησιακές διαδρομές',
  'sample.industry': 'Βιομηχανικά παραδείγματα',

  // View modes
  'view.stats': 'Στατιστικά',
  'display.appearance': 'Εμφάνιση',

  // Azure toolbar
  'data.manualEntry': 'Χειροκίνητη εισαγωγή',
  'data.editTable': 'Επεξεργασία πίνακα δεδομένων',
  'toolbar.saveAs': 'Αποθήκευση ως…',
  'toolbar.saving': 'Αποθήκευση…',
  'toolbar.saved': 'Αποθηκεύτηκε',
  'toolbar.saveFailed': 'Η αποθήκευση απέτυχε',
  'toolbar.addMore': 'Προσθήκη δεδομένων',
  'report.scouting': 'Αναφορά ανίχνευσης',
  'export.csvFiltered': 'Εξαγωγή φιλτραρισμένων δεδομένων ως CSV',
  'error.auth': 'Σφάλμα ταυτοποίησης',

  // File browse
  'file.browseLocal': 'Αναζήτηση σε αυτή τη συσκευή',
  'file.browseSharePoint': 'Αναζήτηση στο SharePoint',
  'file.open': 'Άνοιγμα αρχείου',

  // Admin hub
  'admin.title': 'Διαχείριση',
  'admin.status': 'Κατάσταση',
  'admin.plan': 'Πλάνο & Λειτουργίες',
  'admin.teams': 'Ρύθμιση Teams',
  'admin.knowledge': 'Βάση Γνώσεων',
  'admin.troubleshooting': 'Αντιμετώπιση προβλημάτων',

  // Admin plan tab
  'admin.currentPlan': 'Τρέχον',
  'admin.feature': 'Λειτουργία',
  'admin.manageSubscription': 'Διαχείριση συνδρομής στο Azure',
  'admin.planStandard': 'Standard',
  'admin.planTeam': 'Team',
  'admin.planStandardPrice': '€79/μήνα',
  'admin.planTeamPrice': '€199/μήνα',
  'admin.planStandardDesc': 'Πλήρης ανάλυση με CoScout AI',
  'admin.planTeamDesc': 'Teams, OneDrive, SharePoint, βάση γνώσεων',

  // Feature names
  'feature.charts': 'I-Chart, Boxplot, Pareto, Στατιστικά',
  'feature.capability': 'Ανάλυση ικανότητας (Cp/Cpk)',
  'feature.performance': 'Λειτουργία απόδοσης (πολλαπλών καναλιών)',
  'feature.anova': 'ANOVA & ανάλυση παραγόντων',
  'feature.findingsWorkflow': 'Ευρήματα & ροή εργασίας έρευνας',
  'feature.whatIf': 'Προσομοίωση τι-αν',
  'feature.csvImport': 'Εισαγωγή CSV/Excel',
  'feature.reportExport': 'Εξαγωγή αναφοράς (PDF)',
  'feature.indexedDb': 'Τοπική αποθήκευση IndexedDB',
  'feature.maxFactors': 'Έως 6 παράγοντες',
  'feature.maxRows': 'Έως 250K γραμμές',
  'feature.onedriveSync': 'Συγχρονισμός έργων OneDrive',
  'feature.sharepointPicker': 'Επιλογέας αρχείων SharePoint',
  'feature.teamsIntegration': 'Ενσωμάτωση Microsoft Teams',
  'feature.channelCollab': 'Συνεργασία βάσει καναλιού',
  'feature.mobileUi': 'Βελτιστοποιημένο UI για κινητά',
  'feature.coScoutAi': 'Βοηθός CoScout AI',
  'feature.narrativeBar': 'Πληροφορίες NarrativeBar',
  'feature.chartInsights': 'Chips πληροφοριών γραφήματος',
  'feature.knowledgeBase': 'Βάση Γνώσεων (αναζήτηση SharePoint)',
  'feature.aiActions': 'Ενέργειες που προτείνονται από AI',

  // Admin Teams setup
  'admin.teams.heading': 'Προσθήκη VariScout στο Microsoft Teams',
  'admin.teams.description':
    'Δημιουργήστε ένα πακέτο εφαρμογής Teams για την ανάπτυξή σας και μεταφορτώστε το στο κέντρο διαχείρισης Teams.',
  'admin.teams.running': 'Εκτελείται εντός Microsoft Teams',
  'admin.teams.step1': 'ID πελάτη εγγραφής εφαρμογής (Προαιρετικό)',
  'admin.teams.step1Desc':
    'Εισάγετε το ID πελάτη εγγραφής εφαρμογής Azure AD για ενεργοποίηση Teams SSO στο manifest.',
  'admin.teams.step2': 'Λήψη πακέτου εφαρμογής Teams',
  'admin.teams.step2Desc':
    'Αυτό το .zip περιέχει το manifest και τα εικονίδια προρυθμισμένα για την ανάπτυξή σας.',
  'admin.teams.step3': 'Μεταφόρτωση στο κέντρο διαχείρισης Teams',
  'admin.teams.step4': 'Προσθήκη VariScout σε κανάλι',
  'admin.teams.download': 'Λήψη πακέτου εφαρμογής Teams',

  // Admin status tab
  'admin.checksResult': '{pass}/{total} έλεγχοι πέτυχαν',
  'admin.runChecks': 'Εκτέλεση όλων των ελέγχων',
  'admin.notApplicable': 'Δεν εφαρμόζεται στο πλάνο σας',
  'admin.managePortal': 'Διαχείριση στο Azure Portal',
  'admin.portalAccessNote':
    'Αυτά τα στοιχεία απαιτούν πρόσβαση στο Azure Portal και δεν μπορούν να ελεγχθούν από το πρόγραμμα περιήγησης.',
  'admin.fixInPortal': 'Διόρθωση στο Azure Portal: {label}',

  // Admin troubleshoot tab
  'admin.troubleshoot.intro':
    'Συνηθισμένα προβλήματα και πώς να τα λύσετε. Κάντε κλικ σε ένα πρόβλημα για οδηγίες βήμα-βήμα.',
  'admin.runCheck': 'Εκτέλεση ελέγχου',
  'admin.checkPassed': 'Ο έλεγχος πέτυχε — αυτό μπορεί να μην είναι το πρόβλημα.',
  'admin.checkFailed': 'Ο έλεγχος απέτυχε — ακολουθήστε τα βήματα παρακάτω.',
  'admin.issue.signin': 'Οι χρήστες δεν μπορούν να συνδεθούν',
  'admin.issue.signinDesc':
    'Η ταυτοποίηση Azure AD δεν λειτουργεί ή οι χρήστες βλέπουν κενή σελίδα.',
  'admin.issue.signinSteps':
    'Επαληθεύστε ότι η ταυτοποίηση App Service είναι ενεργοποιημένη στο Azure Portal.\nΕλέγξτε ότι η εγγραφή εφαρμογής Azure AD έχει τα σωστά URI ανακατεύθυνσης.\nΒεβαιωθείτε ότι η εγγραφή εφαρμογής έχει ενεργοποιημένα τα "ID tokens" στην Ταυτοποίηση.\nΕπαληθεύστε ότι ο μισθωτής επιτρέπει τη σύνδεση χρηστών στην εφαρμογή (Εταιρικές Εφαρμογές → Ιδιότητες → Ενεργοποιημένο για σύνδεση χρηστών).',
  'admin.issue.onedrive': 'Ο συγχρονισμός OneDrive δεν λειτουργεί',
  'admin.issue.onedriveDesc':
    'Τα έργα δεν συγχρονίζονται στο OneDrive ή οι χρήστες βλέπουν σφάλματα αδειών.',
  'admin.issue.onedriveSteps':
    'Επαληθεύστε ότι η εγγραφή εφαρμογής έχει εξουσιοδοτημένη άδεια "Files.ReadWrite".\nΕλέγξτε ότι η συναίνεση διαχειριστή έχει χορηγηθεί για τις άδειες Graph.\nΒεβαιωθείτε ότι ο χρήστης έχει εκχωρημένη άδεια OneDrive.\nΔοκιμάστε αποσύνδεση και επανασύνδεση για ανανέωση του token.',
  'admin.issue.coscout': 'Το CoScout δεν αποκρίνεται',
  'admin.issue.coscoutDesc': 'Ο βοηθός AI δεν παράγει απαντήσεις ή εμφανίζει σφάλματα.',
  'admin.issue.coscoutSteps':
    'Επαληθεύστε ότι το AI endpoint είναι ρυθμισμένο στο ARM template / ρυθμίσεις App Service.\nΕλέγξτε ότι ο πόρος Azure AI Services είναι αναπτυγμένος και εκτελείται.\nΕπαληθεύστε ότι υπάρχει ανάπτυξη μοντέλου (π.χ. gpt-4o) στον πόρο AI Services.\nΕλέγξτε τα όρια Azure AI Services — η ανάπτυξη μπορεί να έχει φτάσει τα όρια ρυθμού.',
  'admin.issue.kbEmpty': 'Η Βάση Γνώσεων δεν επιστρέφει αποτελέσματα',
  'admin.issue.kbEmptyDesc':
    'Η "Αναζήτηση Βάσης Γνώσεων" του CoScout δεν βρίσκει τίποτα παρά την ύπαρξη εγγράφων.',
  'admin.issue.kbEmptySteps':
    'Επαληθεύστε ότι το AI Search endpoint είναι ρυθμισμένο στις ρυθμίσεις App Service.\nΕλέγξτε ότι η απομακρυσμένη πηγή γνώσης SharePoint έχει δημιουργηθεί στο AI Search.\nΒεβαιωθείτε ότι ≥1 άδεια Microsoft 365 Copilot είναι ενεργή στο μισθωτή.\nΕπαληθεύστε ότι ο χρήστης έχει πρόσβαση SharePoint στα αναζητούμενα έγγραφα.\nΕλέγξτε ότι ο διακόπτης προεπισκόπησης Βάσης Γνώσεων είναι ενεργοποιημένος (Διαχείριση → καρτέλα Βάση Γνώσεων).',
  'admin.issue.teamsTab': 'Η καρτέλα Teams δεν εμφανίζεται',
  'admin.issue.teamsTabDesc':
    'Το VariScout δεν εμφανίζεται στο Teams ή η καρτέλα αποτυγχάνει να φορτώσει.',
  'admin.issue.teamsTabSteps':
    'Επαληθεύστε ότι το πακέτο εφαρμογής Teams (.zip) μεταφορτώθηκε στο κέντρο διαχείρισης Teams.\nΕλέγξτε ότι το contentUrl στο manifest.json ταιριάζει με το URL του App Service.\nΒεβαιωθείτε ότι η εφαρμογή είναι εγκεκριμένη στο κέντρο διαχείρισης Teams (δεν μπλοκάρεται από πολιτική).\nΔοκιμάστε να αφαιρέσετε και να προσθέσετε ξανά την καρτέλα στο κανάλι.\nΑν χρησιμοποιείτε προσαρμοσμένο domain, επαληθεύστε ότι βρίσκεται στον πίνακα validDomains του manifest.',
  'admin.issue.newUser': 'Νέος χρήστης δεν μπορεί να έχει πρόσβαση στην εφαρμογή',
  'admin.issue.newUserDesc':
    'Ένας πρόσφατα προστεθέν χρήστης βλέπει απόρριψη πρόσβασης ή κενή σελίδα.',
  'admin.issue.newUserSteps':
    'Στο Azure AD, μεταβείτε σε Εταιρικές Εφαρμογές → VariScout → Χρήστες και ομάδες.\nΠροσθέστε τον χρήστη ή την ομάδα ασφαλείας του στην εφαρμογή.\nΑν χρησιμοποιείτε "Απαιτείται εκχώρηση χρήστη", βεβαιωθείτε ότι ο χρήστης έχει εκχώρηση.\nΕλέγξτε πολιτικές υπό όρους πρόσβασης που μπορεί να μπλοκάρουν τον χρήστη.',
  'admin.issue.aiSlow': 'Οι απαντήσεις AI είναι αργές',
  'admin.issue.aiSlowDesc': 'Το CoScout αργεί να απαντήσει ή λήγει συχνά.',
  'admin.issue.aiSlowSteps':
    'Ελέγξτε την περιοχή ανάπτυξης Azure AI Services — η καθυστέρηση αυξάνεται με την απόσταση.\nΕπαληθεύστε ότι η ανάπτυξη μοντέλου έχει επαρκές όριο TPM (tokens ανά λεπτό).\nΣκεφτείτε αναβάθμιση σε ανάπτυξη με εγγυημένη ρυθμαπόδοση για σταθερή καθυστέρηση.\nΕλέγξτε αν ο δείκτης AI Search είναι μεγάλος — σκεφτείτε τη βελτιστοποίηση της πηγής γνώσης.',
  'admin.issue.forbidden': 'Σφάλματα "Forbidden"',
  'admin.issue.forbiddenDesc':
    'Οι χρήστες βλέπουν σφάλματα 403 κατά την πρόσβαση σε ορισμένες λειτουργίες.',
  'admin.issue.forbiddenSteps':
    'Ελέγξτε ότι όλες οι απαιτούμενες άδειες Graph API έχουν συναίνεση διαχειριστή.\nΕπαληθεύστε ότι η αποθήκη token ταυτοποίησης App Service είναι ενεργοποιημένη.\nΒεβαιωθείτε ότι το token του χρήστη δεν έχει λήξει — δοκιμάστε αποσύνδεση και επανασύνδεση.\nΕλέγξτε πολιτικές υπό όρους πρόσβασης του μισθωτή.',
  'admin.issue.kbPartial': 'Η KB αποτυγχάνει για κάποιους χρήστες',
  'admin.issue.kbPartialDesc':
    'Η αναζήτηση Βάσης Γνώσεων λειτουργεί για διαχειριστές αλλά όχι για άλλους χρήστες.',
  'admin.issue.kbPartialSteps':
    'Οι απομακρυσμένες πηγές γνώσης SharePoint χρησιμοποιούν δικαιώματα ανά χρήστη. Κάθε χρήστης πρέπει να έχει πρόσβαση SharePoint στα έγγραφα.\nΕλέγξτε αν οι επηρεαζόμενοι χρήστες μπλοκάρονται από πολιτικές υπό όρους πρόσβασης.\nΕπαληθεύστε ότι η συναίνεση διαχειριστή δόθηκε για την εξουσιοδοτημένη άδεια Sites.Read.All.\nΖητήστε από τους επηρεαζόμενους χρήστες να αποσυνδεθούν και να συνδεθούν ξανά για ανανέωση του token τους.',

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
  'fi.title': 'Ευφυΐα Παραγόντων',
  'fi.ranking': 'Κατάταξη παραγόντων (R² προσαρμοσμένο)',
  'fi.layer2': 'Επίπεδο 2 · Κύριες Επιδράσεις',
  'fi.layer3': 'Επίπεδο 3 · Αλληλεπιδράσεις Παραγόντων',
  'fi.investigate': 'Διερεύνηση →',
  'fi.notSignificant': 'μη σημαντικό (p={value})',
  'fi.explainsSingle': '{factor} εξηγεί το {pct}% της διακύμανσης μόνο του.',
  'fi.explainsMultiple': '{factors} μαζί εξηγούν το {pct}% της διακύμανσης.',
  'fi.layer2Locked': 'Επίπεδο 2 (Κύριες Επιδράσεις) ξεκλειδώνει όταν R²adj > {threshold}%',
  'fi.layer2Current': ' — τρέχον {value}%',
  'fi.layer3Locked': 'Επίπεδο 3 (Αλληλεπιδράσεις) ξεκλειδώνει όταν ≥2 παράγοντες είναι σημαντικοί',
  'fi.layer3Current': ' — τρέχον {count} σημαντικοί',
  'fi.best': 'Καλύτερο',
  'fi.range': 'Εύρος',
  'fi.interactionDetected':
    'Ανιχνεύθηκε αλληλεπίδραση: η επίδραση του {factorA} εξαρτάται από το επίπεδο του {factorB}.',
  'fi.noInteraction':
    'Καμία σημαντική αλληλεπίδραση — οι επιδράσεις είναι κατά προσέγγιση αθροιστικές.',

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

  // Investigation Wall
  'wall.status.proposed': 'Proposed',
  'wall.status.evidenced': 'Evidenced',
  'wall.status.confirmed': 'Confirmed',
  'wall.status.refuted': 'Refuted',
  'wall.card.hypothesisLabel': 'Mechanism Branch',
  'wall.card.findings': '{count} findings',
  'wall.card.questions': '{count} questions',
  'wall.card.evidenceGap': 'Evidence gap',
  'wall.card.missingColumn': '⚠ Condition references missing column',
  'wall.card.missingColumnAria': 'Condition references missing column',
  'wall.card.ariaLabel': 'Mechanism Branch {name}, {status}, {count} supporting clues',
  'wall.problem.title': 'Problem condition',
  'wall.problem.eventsPerWeek': '{count} events/wk',
  'wall.problem.ariaLabel': 'Problem condition: {column}, Cpk {cpk}, {count} events per week',
  'wall.gate.and': 'AND',
  'wall.gate.or': 'OR',
  'wall.gate.not': 'NOT',
  'wall.gate.holds': 'HOLDS {matching}/{total}',
  'wall.gate.noTotals': '—/0',
  'wall.gate.ariaLabel': 'Gate {kind} {holds}',
  'wall.question.ariaLabel': 'Question: {text}, {status}',
  'wall.tributary.ariaLabel': 'Tributaries from Process Map',
  'wall.empty.ariaLabel': 'Mechanism Branch empty state',
  'wall.empty.title': 'Start a Mechanism Branch',
  'wall.empty.subtitle': 'Start from a suspected mechanism, question, or Factor Intelligence.',
  'wall.empty.writeHypothesis': 'Write a suspected mechanism',
  'wall.empty.promoteFromQuestion': 'Promote from a question',
  'wall.empty.seedFromFactorIntel': 'Seed 3 from Factor Intelligence',
  'wall.rail.title': 'CoScout',
  'wall.rail.openAria': 'Open narrator rail',
  'wall.rail.closeAria': 'Close narrator rail',
  'wall.rail.rootAria': 'Narrator rail',
  'wall.rail.openButton': 'Open rail',
  'wall.rail.empty': 'No suggestions yet.',
  'wall.missing.ariaLabel': 'Missing evidence digest',
  'wall.missing.title': 'Missing evidence',
  'wall.missing.tagline': 'Missing evidence · the detective move nobody ships ({count})',
  'wall.missing.processMap': 'Process Map grouping is available after FRAME mapping.',
  'wall.canvas.ariaLabel': 'Mechanism Branch workspace',
  'wall.cta.proposeHypothesis': 'Propose suspected mechanism from this finding',
  'wall.toolbar.groupByTributary': 'Group by tributary',
  'wall.toolbar.zoomIn': 'Zoom in',
  'wall.toolbar.zoomOut': 'Zoom out',
  'wall.toolbar.resetView': 'Reset view',
  'wall.palette.placeholder': 'Search hubs, questions, findings…',
  'wall.palette.empty': 'No matches',
  'wall.palette.kind.hub': 'BRANCH',
  'wall.palette.kind.question': 'QUESTION',
  'wall.palette.kind.finding': 'FINDING',
  'wall.minimap.ariaLabel': 'Investigation Wall minimap',

  // FRAME b0 lightweight render — TODO(i18n): translate
  'frame.b0.q1.headline': 'What do you want to investigate?',
  'frame.b0.q1.hint': 'your Y / output measurement',
  'frame.b0.q2.headline': 'What might be affecting it?',
  'frame.b0.q2.hint': "your X's / inputs",
  'frame.b0.runOrderHint': '(run order: {column})',
  'frame.b0.addProcessSteps.label': 'Add process steps',
  'frame.b0.addProcessSteps.helper': "optional — useful when your X's belong to specific stages",
  'frame.b0.addHypothesis.label': 'Add a hypothesis',
  'frame.b0.addHypothesis.helper': 'optional — what you suspect',
  'frame.b0.seeData.cta': 'See the data →',
  'frame.b0.seeData.pickYHint': 'Pick a Y first to see the analysis.',
  'frame.b0.step.addCtq': '+ add measurement at this step (optional)',
  'frame.b0.q1.empty': 'No numeric columns detected — add or import data to begin.', // TODO(i18n): translate
  'frame.b0.q2.empty': 'No X candidates — once you pick a Y, factor candidates appear here.', // TODO(i18n): translate
  'frame.b0.aria.yCandidates': 'Y candidate chips', // TODO(i18n): translate
  'frame.b0.aria.selectedXs': 'Selected X chips', // TODO(i18n): translate
  'frame.b0.aria.availableXs': 'Available X chips', // TODO(i18n): translate
  'frame.b1.heading': 'Frame the investigation', // TODO(i18n): translate
  'frame.b1.description':
    'Build your process map so the analysis has context. The map drives mode selection and a measurement-gap report; the methodology wants CTS at the ocean, a CTQ per step, and at least one rational-subgroup axis.', // TODO(i18n): translate
  'frame.spec.notSet': 'spec: not set',
  'frame.spec.set': 'spec: set', // TODO(i18n): translate
  'frame.spec.add': '+ add spec',
  'frame.spec.editor.title': 'Set spec for {measure}',
  'frame.spec.editor.usl': 'USL',
  'frame.spec.editor.lsl': 'LSL',
  'frame.spec.editor.target': 'Target',
  'frame.spec.editor.cpkTarget': 'Cpk target',
  'frame.spec.editor.suggestedFromData': 'Suggested from data: mean ± 3σ. Confirm to save.',
  'frame.spec.editor.confirm': 'Save',
  'frame.spec.editor.cancel': 'Cancel',
  'frame.spec.editor.invalidRange': 'USL must be greater than LSL.', // TODO(i18n): translate
  'capability.noSpec.prompt': 'Set a target / spec on {measure} to see Cp/Cpk.',

  // Verify card segmented tabs — TODO(i18n): translate
  'verify.tab.probability': 'Probability',
  'verify.tab.distribution': 'Distribution',
  'verify.tab.capability': 'Capability',
  'verify.tab.pareto': 'Pareto',

  // Time lens (ProcessHealthBar) — TODO(i18n): translate
  'timeLens.button': 'Time',
  'timeLens.popover.title': 'Time window',
  'timeLens.mode.cumulative': 'Cumulative',
  'timeLens.mode.rolling': 'Rolling',
  'timeLens.mode.fixed': 'Fixed',
  'timeLens.mode.openEnded': 'Open-ended',
  'timeLens.input.windowSize': 'Window size',
  'timeLens.input.anchor': 'Anchor',
};
