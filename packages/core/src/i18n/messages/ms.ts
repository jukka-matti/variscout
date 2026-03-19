import type { MessageCatalog } from '../types';

/** Malay message catalog */
export const ms: MessageCatalog = {
  // Statistics labels
  'stats.mean': 'Min Purata',
  'stats.median': 'Median',
  'stats.stdDev': 'Sis. Piawai',
  'stats.samples': 'Sampel',
  'stats.passRate': 'Kadar Lulus',
  'stats.range': 'Julat',
  'stats.min': 'Min',
  'stats.max': 'Maks',
  'stats.target': 'Sasaran',
  'stats.sigma': 'Sigma',

  // Chart labels
  'chart.observation': 'Pemerhatian',
  'chart.count': 'Bilangan',
  'chart.frequency': 'Kekerapan',
  'chart.value': 'Nilai',
  'chart.category': 'Kategori',
  'chart.cumulative': 'Kumulatif %',
  'chart.clickToEdit': 'Klik untuk mengedit',
  'chart.median': 'Median',
  'chart.q1': 'Q1',
  'chart.q3': 'Q3',
  'chart.noChannelData': 'Tiada data saluran',
  'chart.selectChannel': 'Pilih saluran',

  // Limit labels
  'limits.usl': 'USL',
  'limits.lsl': 'LSL',
  'limits.ucl': 'UCL',
  'limits.lcl': 'LCL',
  'limits.mean': 'Min Purata',
  'limits.target': 'Sasaran',

  // Navigation
  'nav.newAnalysis': 'Analisis Baharu',
  'nav.backToDashboard': 'Kembali ke Papan Pemuka',
  'nav.settings': 'Tetapan',
  'nav.export': 'Eksport',
  'nav.presentation': 'Pembentangan',
  'nav.menu': 'Menu',
  'nav.moreActions': 'Tindakan lanjut',

  // Panel titles
  'panel.findings': 'Penemuan',
  'panel.dataTable': 'Jadual Data',
  'panel.whatIf': 'Bagaimana Jika',
  'panel.investigation': 'Penyiasatan',
  'panel.coScout': 'CoScout',
  'panel.drillPath': 'Laluan Gerudi',

  // View modes
  'view.list': 'Senarai',
  'view.board': 'Papan',
  'view.tree': 'Pokok',

  // Action buttons
  'action.save': 'Simpan',
  'action.cancel': 'Batal',
  'action.delete': 'Padam',
  'action.edit': 'Edit',
  'action.copy': 'Salin',
  'action.close': 'Tutup',
  'action.learnMore': 'Ketahui lebih lanjut',
  'action.download': 'Muat turun',
  'action.apply': 'Gunakan',
  'action.reset': 'Tetap semula',
  'action.retry': 'Cuba semula',
  'action.send': 'Hantar',
  'action.ask': 'Tanya',
  'action.clear': 'Kosongkan',
  'action.copyAll': 'Salin semua',
  'action.selectAll': 'Pilih semua',

  // CoScout
  'coscout.send': 'Hantar',
  'coscout.clear': 'Kosongkan perbualan',
  'coscout.stop': 'Berhenti',
  'coscout.rateLimit': 'Had kadar dicapai. Sila tunggu.',
  'coscout.contentFilter': 'Kandungan ditapis oleh dasar keselamatan.',
  'coscout.error': 'Ralat berlaku. Sila cuba semula.',

  // Display/settings
  'display.preferences': 'Keutamaan',
  'display.chartTextSize': 'Saiz teks carta',
  'display.compact': 'Padat',
  'display.normal': 'Normal',
  'display.large': 'Besar',
  'display.lockYAxis': 'Kunci paksi Y',
  'display.filterContext': 'Konteks penapis',
  'display.showSpecs': 'Tunjukkan spesifikasi',

  // Investigation
  'investigation.brief': 'Ringkasan Penyiasatan',
  'investigation.assignedToMe': 'Ditugaskan kepada saya',
  'investigation.hypothesis': 'Hipotesis',
  'investigation.hypotheses': 'Hipotesis',
  'investigation.pinAsFinding': 'Semat sebagai penemuan',
  'investigation.addObservation': 'Tambah pemerhatian',

  // Empty states
  'empty.noData': 'Tiada data tersedia',
  'empty.noFindings': 'Belum ada penemuan',
  'empty.noResults': 'Tiada keputusan ditemui',

  // Error messages
  'error.generic': 'Sesuatu telah berlaku',
  'error.loadFailed': 'Gagal memuatkan data',
  'error.parseFailed': 'Gagal menghurai fail',

  // Settings labels
  'settings.language': 'Bahasa',
  'settings.theme': 'Tema',
  'settings.textSize': 'Saiz Teks',

  // Finding statuses
  'findings.observed': 'Diperhatikan',
  'findings.investigating': 'Menyiasat',
  'findings.analyzed': 'Dianalisis',
  'findings.improving': 'Menambah baik',
  'findings.resolved': 'Diselesaikan',

  // Report labels
  'report.summary': 'Ringkasan',
  'report.findings': 'Penemuan',
  'report.recommendations': 'Cadangan',
  'report.evidence': 'Bukti',

  // Data input labels
  'data.pasteData': 'Tampal Data',
  'data.uploadFile': 'Muat Naik Fail',
  'data.columnMapping': 'Pemetaan Lajur',
  'data.measureColumn': 'Lajur Ukuran',
  'data.factorColumn': 'Lajur Faktor',
  'data.addData': 'Tambah data',
  'data.editData': 'Edit data',
  'data.showDataTable': 'Tunjukkan jadual data',
  'data.hideDataTable': 'Sembunyikan jadual data',

  // Status
  'status.cached': 'Dicache',
  'status.loading': 'Memuatkan',
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
    'Peraturan Nelson 2 — siri {count} {side} purata (#{start}–{end})',
  'chart.violation.nelson3.detail':
    'Peraturan Nelson 3 — trend {count} {direction} (#{start}–{end})',
  'chart.violation.side.above': 'di atas',
  'chart.violation.side.below': 'di bawah',
  'chart.violation.direction.increasing': 'meningkat',
  'chart.violation.direction.decreasing': 'menurun',

  // Parameterized messages
  'data.rowsLoaded': '{count} rows loaded',
  'findings.countLabel': '{count} findings',
};
