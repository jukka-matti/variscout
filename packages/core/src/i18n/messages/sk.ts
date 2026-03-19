import type { MessageCatalog } from '../types';

/** Slovak message catalog */
export const sk: MessageCatalog = {
  // Statistics labels
  'stats.mean': 'Priemer',
  'stats.median': 'Medián',
  'stats.stdDev': 'Štan. odchýlka',
  'stats.samples': 'Vzorky',
  'stats.passRate': 'Miera zhody',
  'stats.range': 'Rozpätie',
  'stats.min': 'Min.',
  'stats.max': 'Max.',
  'stats.target': 'Cieľ',
  'stats.sigma': 'Sigma',

  // Chart labels
  'chart.observation': 'Pozorovanie',
  'chart.count': 'Počet',
  'chart.frequency': 'Frekvencia',
  'chart.value': 'Hodnota',
  'chart.category': 'Kategória',
  'chart.cumulative': 'Kumulatívne %',
  'chart.clickToEdit': 'Kliknite pre úpravu',
  'chart.median': 'Medián',
  'chart.q1': 'Q1',
  'chart.q3': 'Q3',
  'chart.noChannelData': 'Žiadne údaje kanála',
  'chart.selectChannel': 'Vyberte kanál',

  // Limit labels
  'limits.usl': 'HMT',
  'limits.lsl': 'DMT',
  'limits.ucl': 'HRH',
  'limits.lcl': 'DRH',
  'limits.mean': 'Priemer',
  'limits.target': 'Cieľ',

  // Navigation
  'nav.newAnalysis': 'Nová analýza',
  'nav.backToDashboard': 'Späť na panel',
  'nav.settings': 'Nastavenia',
  'nav.export': 'Export',
  'nav.presentation': 'Prezentácia',
  'nav.menu': 'Menu',
  'nav.moreActions': 'Ďalšie akcie',

  // Panel titles
  'panel.findings': 'Zistenia',
  'panel.dataTable': 'Tabuľka údajov',
  'panel.whatIf': 'Čo ak',
  'panel.investigation': 'Vyšetrovanie',
  'panel.coScout': 'CoScout',
  'panel.drillPath': 'Cesta hĺbkovej analýzy',

  // View modes
  'view.list': 'Zoznam',
  'view.board': 'Tabuľa',
  'view.tree': 'Strom',

  // Action buttons
  'action.save': 'Uložiť',
  'action.cancel': 'Zrušiť',
  'action.delete': 'Odstrániť',
  'action.edit': 'Upraviť',
  'action.copy': 'Kopírovať',
  'action.close': 'Zavrieť',
  'action.learnMore': 'Zistiť viac',
  'action.download': 'Stiahnuť',
  'action.apply': 'Použiť',
  'action.reset': 'Obnoviť',
  'action.retry': 'Skúsiť znova',
  'action.send': 'Odoslať',
  'action.ask': 'Opýtať sa',
  'action.clear': 'Vymazať',
  'action.copyAll': 'Kopírovať všetko',
  'action.selectAll': 'Vybrať všetko',

  // CoScout
  'coscout.send': 'Odoslať',
  'coscout.clear': 'Vymazať konverzáciu',
  'coscout.stop': 'Zastaviť',
  'coscout.rateLimit': 'Dosiahnutý limit požiadaviek. Prosím, počkajte.',
  'coscout.contentFilter': 'Obsah bol filtrovaný bezpečnostnou politikou.',
  'coscout.error': 'Vyskytla sa chyba. Prosím, skúste to znova.',

  // Display/settings
  'display.preferences': 'Predvoľby',
  'display.chartTextSize': 'Veľkosť textu grafu',
  'display.compact': 'Kompaktné',
  'display.normal': 'Normálne',
  'display.large': 'Veľké',
  'display.lockYAxis': 'Zamknúť os Y',
  'display.filterContext': 'Kontext filtra',
  'display.showSpecs': 'Zobraziť špecifikácie',

  // Investigation
  'investigation.brief': 'Súhrn vyšetrovania',
  'investigation.assignedToMe': 'Pridelené mne',
  'investigation.hypothesis': 'Hypotéza',
  'investigation.hypotheses': 'Hypotézy',
  'investigation.pinAsFinding': 'Pripnúť ako zistenie',
  'investigation.addObservation': 'Pridať pozorovanie',

  // Empty states
  'empty.noData': 'Žiadne dostupné údaje',
  'empty.noFindings': 'Zatiaľ žiadne zistenia',
  'empty.noResults': 'Neboli nájdené žiadne výsledky',

  // Error messages
  'error.generic': 'Niečo sa pokazilo',
  'error.loadFailed': 'Nepodarilo sa načítať údaje',
  'error.parseFailed': 'Nepodarilo sa spracovať súbor',

  // Settings labels
  'settings.language': 'Jazyk',
  'settings.theme': 'Téma',
  'settings.textSize': 'Veľkosť textu',

  // Finding statuses
  'findings.observed': 'Pozorované',
  'findings.investigating': 'Vyšetruje sa',
  'findings.analyzed': 'Analyzované',
  'findings.improving': 'Zlepšuje sa',
  'findings.resolved': 'Vyriešené',

  // Report labels
  'report.summary': 'Súhrn',
  'report.findings': 'Zistenia',
  'report.recommendations': 'Odporúčania',
  'report.evidence': 'Dôkazy',

  // Data input labels
  'data.pasteData': 'Vložiť údaje',
  'data.uploadFile': 'Nahrať súbor',
  'data.columnMapping': 'Mapovanie stĺpcov',
  'data.measureColumn': 'Stĺpec merania',
  'data.factorColumn': 'Stĺpec faktora',
  'data.addData': 'Pridať údaje',
  'data.editData': 'Upraviť údaje',
  'data.showDataTable': 'Zobraziť tabuľku údajov',
  'data.hideDataTable': 'Skryť tabuľku údajov',

  // Status
  'status.cached': 'Uložené v cache',
  'status.loading': 'Načítava sa',
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
    'Nelsonovo pravidlo 2 — séria {count} {side} priemeru (#{start}–{end})',
  'chart.violation.nelson3.detail':
    'Nelsonovo pravidlo 3 — trend {count} {direction} (#{start}–{end})',
  'chart.violation.side.above': 'nad',
  'chart.violation.side.below': 'pod',
  'chart.violation.direction.increasing': 'rastúci',
  'chart.violation.direction.decreasing': 'klesajúci',

  // Parameterized messages
  'data.rowsLoaded': '{count} rows loaded',
  'findings.countLabel': '{count} findings',
};
