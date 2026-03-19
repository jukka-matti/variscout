import type { MessageCatalog } from '../types';

/** Romanian message catalog */
export const ro: MessageCatalog = {
  // Statistics labels
  'stats.mean': 'Medie',
  'stats.median': 'Mediană',
  'stats.stdDev': 'Abat. std.',
  'stats.samples': 'Eșantioane',
  'stats.passRate': 'Rată conformitate',
  'stats.range': 'Amplitudine',
  'stats.min': 'Min',
  'stats.max': 'Max',
  'stats.target': 'Țintă',
  'stats.sigma': 'Sigma',

  // Chart labels
  'chart.observation': 'Observație',
  'chart.count': 'Număr',
  'chart.frequency': 'Frecvență',
  'chart.value': 'Valoare',
  'chart.category': 'Categorie',
  'chart.cumulative': 'Cumulativ %',
  'chart.clickToEdit': 'Clic pentru editare',
  'chart.median': 'Mediană',
  'chart.q1': 'Q1',
  'chart.q3': 'Q3',
  'chart.noChannelData': 'Fără date canal',
  'chart.selectChannel': 'Selectare canal',

  // Limit labels (Romanian standards)
  'limits.usl': 'LSS',
  'limits.lsl': 'LSI',
  'limits.ucl': 'LCS',
  'limits.lcl': 'LCI',
  'limits.mean': 'Medie',
  'limits.target': 'Țintă',

  // Navigation
  'nav.newAnalysis': 'Analiză nouă',
  'nav.backToDashboard': 'Înapoi la panou',
  'nav.settings': 'Setări',
  'nav.export': 'Exportare',
  'nav.presentation': 'Prezentare',
  'nav.menu': 'Meniu',
  'nav.moreActions': 'Mai multe acțiuni',

  // Panel titles
  'panel.findings': 'Constatări',
  'panel.dataTable': 'Tabel de date',
  'panel.whatIf': 'Ce-ar fi dacă',
  'panel.investigation': 'Investigație',
  'panel.coScout': 'CoScout',
  'panel.drillPath': 'Cale de detaliere',

  // View modes
  'view.list': 'Listă',
  'view.board': 'Panou',
  'view.tree': 'Arbore',

  // Action buttons
  'action.save': 'Salvare',
  'action.cancel': 'Anulare',
  'action.delete': 'Ștergere',
  'action.edit': 'Editare',
  'action.copy': 'Copiere',
  'action.close': 'Închidere',
  'action.learnMore': 'Aflați mai multe',
  'action.download': 'Descărcare',
  'action.apply': 'Aplicare',
  'action.reset': 'Resetare',
  'action.retry': 'Reîncercare',
  'action.send': 'Trimitere',
  'action.ask': 'Întrebare',
  'action.clear': 'Ștergere',
  'action.copyAll': 'Copiere tot',
  'action.selectAll': 'Selectare tot',

  // CoScout
  'coscout.send': 'Trimitere',
  'coscout.clear': 'Ștergere conversație',
  'coscout.stop': 'Oprire',
  'coscout.rateLimit': 'Limită de cereri atinsă. Vă rugăm așteptați.',
  'coscout.contentFilter': 'Conținut filtrat de politica de securitate.',
  'coscout.error': 'A apărut o eroare. Încercați din nou.',

  // Display/settings
  'display.preferences': 'Preferințe',
  'display.chartTextSize': 'Dimensiune text grafic',
  'display.compact': 'Compact',
  'display.normal': 'Normal',
  'display.large': 'Mare',
  'display.lockYAxis': 'Blocare axă Y',
  'display.filterContext': 'Context filtru',
  'display.showSpecs': 'Afișare specificații',

  // Investigation
  'investigation.brief': 'Raport de investigație',
  'investigation.assignedToMe': 'Atribuite mie',
  'investigation.hypothesis': 'Ipoteză',
  'investigation.hypotheses': 'Ipoteze',
  'investigation.pinAsFinding': 'Fixare ca constatare',
  'investigation.addObservation': 'Adăugare observație',

  // Empty states
  'empty.noData': 'Nu sunt date disponibile',
  'empty.noFindings': 'Nicio constatare încă',
  'empty.noResults': 'Niciun rezultat găsit',

  // Error messages
  'error.generic': 'Ceva nu a funcționat',
  'error.loadFailed': 'Încărcarea datelor a eșuat',
  'error.parseFailed': 'Procesarea fișierului a eșuat',

  // Settings labels
  'settings.language': 'Limbă',
  'settings.theme': 'Temă',
  'settings.textSize': 'Dimensiune text',

  // Finding statuses
  'findings.observed': 'Observat',
  'findings.investigating': 'În investigare',
  'findings.analyzed': 'Analizat',
  'findings.improving': 'În îmbunătățire',
  'findings.resolved': 'Rezolvat',

  // Report labels
  'report.summary': 'Rezumat',
  'report.findings': 'Constatări',
  'report.recommendations': 'Recomandări',
  'report.evidence': 'Dovezi',

  // Data input labels
  'data.pasteData': 'Lipire date',
  'data.uploadFile': 'Încărcare fișier',
  'data.columnMapping': 'Mapare coloane',
  'data.measureColumn': 'Coloană de măsurare',
  'data.factorColumn': 'Coloană factor',
  'data.addData': 'Adăugare date',
  'data.editData': 'Editare date',
  'data.showDataTable': 'Afișare tabel de date',
  'data.hideDataTable': 'Ascundere tabel de date',

  // Status
  'status.cached': 'În cache',
  'status.loading': 'Se încarcă',
  'status.ai': 'IA',

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
    'Regula Nelson 2 — serie de {count} {side} medie (#{start}–{end})',
  'chart.violation.nelson3.detail':
    'Regula Nelson 3 — tendință de {count} {direction} (#{start}–{end})',
  'chart.violation.side.above': 'deasupra',
  'chart.violation.side.below': 'sub',
  'chart.violation.direction.increasing': 'crescătoare',
  'chart.violation.direction.decreasing': 'descrescătoare',

  // Parameterized messages
  'data.rowsLoaded': '{count} rows loaded',
  'findings.countLabel': '{count} findings',
};
