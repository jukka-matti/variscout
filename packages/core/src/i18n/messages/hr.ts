import type { MessageCatalog } from '../types';

/** Croatian message catalog */
export const hr: MessageCatalog = {
  // Statistics labels
  'stats.mean': 'Srednja vrijednost',
  'stats.median': 'Medijan',
  'stats.stdDev': 'Stand. devijacija',
  'stats.samples': 'Uzorci',
  'stats.passRate': 'Postotak prolaza',
  'stats.range': 'Raspon',
  'stats.min': 'Min.',
  'stats.max': 'Maks.',
  'stats.target': 'Cilj',
  'stats.sigma': 'Sigma',

  // Chart labels
  'chart.observation': 'Opažanje',
  'chart.count': 'Broj',
  'chart.frequency': 'Frekvencija',
  'chart.value': 'Vrijednost',
  'chart.category': 'Kategorija',
  'chart.cumulative': 'Kumulativni %',
  'chart.clickToEdit': 'Kliknite za uređivanje',
  'chart.median': 'Medijan',
  'chart.q1': 'Q1',
  'chart.q3': 'Q3',
  'chart.noChannelData': 'Nema podataka kanala',
  'chart.selectChannel': 'Odaberite kanal',

  // Limit labels
  'limits.usl': 'GGT',
  'limits.lsl': 'DGT',
  'limits.ucl': 'GKG',
  'limits.lcl': 'DKG',
  'limits.mean': 'Srednja vrijednost',
  'limits.target': 'Cilj',

  // Navigation
  'nav.newAnalysis': 'Nova analiza',
  'nav.backToDashboard': 'Natrag na nadzornu ploču',
  'nav.settings': 'Postavke',
  'nav.export': 'Izvoz',
  'nav.presentation': 'Prezentacija',
  'nav.menu': 'Izbornik',
  'nav.moreActions': 'Više radnji',

  // Panel titles
  'panel.findings': 'Nalazi',
  'panel.dataTable': 'Tablica podataka',
  'panel.whatIf': 'Što ako',
  'panel.investigation': 'Istraživanje',
  'panel.coScout': 'CoScout',
  'panel.drillPath': 'Put dubinske analize',

  // View modes
  'view.list': 'Popis',
  'view.board': 'Ploča',
  'view.tree': 'Stablo',

  // Action buttons
  'action.save': 'Spremi',
  'action.cancel': 'Odustani',
  'action.delete': 'Izbriši',
  'action.edit': 'Uredi',
  'action.copy': 'Kopiraj',
  'action.close': 'Zatvori',
  'action.learnMore': 'Saznajte više',
  'action.download': 'Preuzmi',
  'action.apply': 'Primijeni',
  'action.reset': 'Poništi',
  'action.retry': 'Pokušaj ponovno',
  'action.send': 'Pošalji',
  'action.ask': 'Pitaj',
  'action.clear': 'Očisti',
  'action.copyAll': 'Kopiraj sve',
  'action.selectAll': 'Odaberi sve',

  // CoScout
  'coscout.send': 'Pošalji',
  'coscout.clear': 'Očisti razgovor',
  'coscout.stop': 'Zaustavi',
  'coscout.rateLimit': 'Dosegnuto ograničenje zahtjeva. Molimo pričekajte.',
  'coscout.contentFilter': 'Sadržaj je filtriran sigurnosnom politikom.',
  'coscout.error': 'Došlo je do pogreške. Molimo pokušajte ponovno.',

  // Display/settings
  'display.preferences': 'Postavke prikaza',
  'display.chartTextSize': 'Veličina teksta grafikona',
  'display.compact': 'Kompaktno',
  'display.normal': 'Normalno',
  'display.large': 'Veliko',
  'display.lockYAxis': 'Zaključaj os Y',
  'display.filterContext': 'Kontekst filtera',
  'display.showSpecs': 'Prikaži specifikacije',

  // Investigation
  'investigation.brief': 'Sažetak istraživanja',
  'investigation.assignedToMe': 'Dodijeljeno meni',
  'investigation.hypothesis': 'Hipoteza',
  'investigation.hypotheses': 'Hipoteze',
  'investigation.pinAsFinding': 'Prikvači kao nalaz',
  'investigation.addObservation': 'Dodaj opažanje',

  // Empty states
  'empty.noData': 'Nema dostupnih podataka',
  'empty.noFindings': 'Još nema nalaza',
  'empty.noResults': 'Nema pronađenih rezultata',

  // Error messages
  'error.generic': 'Nešto je pošlo po krivu',
  'error.loadFailed': 'Učitavanje podataka nije uspjelo',
  'error.parseFailed': 'Obrada datoteke nije uspjela',

  // Settings labels
  'settings.language': 'Jezik',
  'settings.theme': 'Tema',
  'settings.textSize': 'Veličina teksta',

  // Finding statuses
  'findings.observed': 'Uočeno',
  'findings.investigating': 'U istraživanju',
  'findings.analyzed': 'Analizirano',
  'findings.improving': 'U poboljšanju',
  'findings.resolved': 'Riješeno',

  // Report labels
  'report.summary': 'Sažetak',
  'report.findings': 'Nalazi',
  'report.recommendations': 'Preporuke',
  'report.evidence': 'Dokazi',

  // Data input labels
  'data.pasteData': 'Zalijepi podatke',
  'data.uploadFile': 'Učitaj datoteku',
  'data.columnMapping': 'Mapiranje stupaca',
  'data.measureColumn': 'Stupac mjerenja',
  'data.factorColumn': 'Stupac faktora',
  'data.addData': 'Dodaj podatke',
  'data.editData': 'Uredi podatke',
  'data.showDataTable': 'Prikaži tablicu podataka',
  'data.hideDataTable': 'Sakrij tablicu podataka',

  // Status
  'status.cached': 'Spremljeno',
  'status.loading': 'Učitavanje',
  'status.ai': 'UI',

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
    'Nelsonovo pravilo 2 — niz {count} {side} prosjeka (#{start}–{end})',
  'chart.violation.nelson3.detail':
    'Nelsonovo pravilo 3 — trend {count} {direction} (#{start}–{end})',
  'chart.violation.side.above': 'iznad',
  'chart.violation.side.below': 'ispod',
  'chart.violation.direction.increasing': 'rastući',
  'chart.violation.direction.decreasing': 'padajući',

  // Parameterized messages
  'data.rowsLoaded': '{count} rows loaded',
  'findings.countLabel': '{count} findings',
};
