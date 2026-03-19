import type { MessageCatalog } from '../types';

/** Indonesian message catalog */
export const id: MessageCatalog = {
  // Statistics labels
  'stats.mean': 'Rata-rata',
  'stats.median': 'Median',
  'stats.stdDev': 'Simp. Baku',
  'stats.samples': 'Sampel',
  'stats.passRate': 'Tingkat Lulus',
  'stats.range': 'Rentang',
  'stats.min': 'Min',
  'stats.max': 'Maks',
  'stats.target': 'Target',
  'stats.sigma': 'Sigma',

  // Chart labels
  'chart.observation': 'Observasi',
  'chart.count': 'Jumlah',
  'chart.frequency': 'Frekuensi',
  'chart.value': 'Nilai',
  'chart.category': 'Kategori',
  'chart.cumulative': 'Kumulatif %',
  'chart.clickToEdit': 'Klik untuk mengedit',
  'chart.median': 'Median',
  'chart.q1': 'Q1',
  'chart.q3': 'Q3',
  'chart.noChannelData': 'Tidak ada data kanal',
  'chart.selectChannel': 'Pilih kanal',

  // Limit labels
  'limits.usl': 'USL',
  'limits.lsl': 'LSL',
  'limits.ucl': 'UCL',
  'limits.lcl': 'LCL',
  'limits.mean': 'Rata-rata',
  'limits.target': 'Target',

  // Navigation
  'nav.newAnalysis': 'Analisis Baru',
  'nav.backToDashboard': 'Kembali ke Dasbor',
  'nav.settings': 'Pengaturan',
  'nav.export': 'Ekspor',
  'nav.presentation': 'Presentasi',
  'nav.menu': 'Menu',
  'nav.moreActions': 'Tindakan lainnya',

  // Panel titles
  'panel.findings': 'Temuan',
  'panel.dataTable': 'Tabel Data',
  'panel.whatIf': 'Bagaimana Jika',
  'panel.investigation': 'Investigasi',
  'panel.coScout': 'CoScout',
  'panel.drillPath': 'Jalur Telusur',

  // View modes
  'view.list': 'Daftar',
  'view.board': 'Papan',
  'view.tree': 'Pohon',

  // Action buttons
  'action.save': 'Simpan',
  'action.cancel': 'Batal',
  'action.delete': 'Hapus',
  'action.edit': 'Edit',
  'action.copy': 'Salin',
  'action.close': 'Tutup',
  'action.learnMore': 'Pelajari lebih lanjut',
  'action.download': 'Unduh',
  'action.apply': 'Terapkan',
  'action.reset': 'Atur Ulang',
  'action.retry': 'Coba Lagi',
  'action.send': 'Kirim',
  'action.ask': 'Tanya',
  'action.clear': 'Hapus',
  'action.copyAll': 'Salin semua',
  'action.selectAll': 'Pilih semua',

  // CoScout
  'coscout.send': 'Kirim',
  'coscout.clear': 'Hapus percakapan',
  'coscout.stop': 'Berhenti',
  'coscout.rateLimit': 'Batas laju tercapai. Silakan tunggu.',
  'coscout.contentFilter': 'Konten difilter oleh kebijakan keamanan.',
  'coscout.error': 'Terjadi kesalahan. Silakan coba lagi.',

  // Display/settings
  'display.preferences': 'Preferensi',
  'display.chartTextSize': 'Ukuran teks grafik',
  'display.compact': 'Ringkas',
  'display.normal': 'Normal',
  'display.large': 'Besar',
  'display.lockYAxis': 'Kunci sumbu Y',
  'display.filterContext': 'Konteks filter',
  'display.showSpecs': 'Tampilkan spesifikasi',

  // Investigation
  'investigation.brief': 'Ringkasan Investigasi',
  'investigation.assignedToMe': 'Ditugaskan kepada saya',
  'investigation.hypothesis': 'Hipotesis',
  'investigation.hypotheses': 'Hipotesis',
  'investigation.pinAsFinding': 'Sematkan sebagai temuan',
  'investigation.addObservation': 'Tambahkan observasi',

  // Empty states
  'empty.noData': 'Tidak ada data tersedia',
  'empty.noFindings': 'Belum ada temuan',
  'empty.noResults': 'Tidak ada hasil ditemukan',

  // Error messages
  'error.generic': 'Terjadi kesalahan',
  'error.loadFailed': 'Gagal memuat data',
  'error.parseFailed': 'Gagal mengurai berkas',

  // Settings labels
  'settings.language': 'Bahasa',
  'settings.theme': 'Tema',
  'settings.textSize': 'Ukuran Teks',

  // Finding statuses
  'findings.observed': 'Diamati',
  'findings.investigating': 'Menyelidiki',
  'findings.analyzed': 'Dianalisis',
  'findings.improving': 'Memperbaiki',
  'findings.resolved': 'Terselesaikan',

  // Report labels
  'report.summary': 'Ringkasan',
  'report.findings': 'Temuan',
  'report.recommendations': 'Rekomendasi',
  'report.evidence': 'Bukti',

  // Data input labels
  'data.pasteData': 'Tempel Data',
  'data.uploadFile': 'Unggah Berkas',
  'data.columnMapping': 'Pemetaan Kolom',
  'data.measureColumn': 'Kolom Ukuran',
  'data.factorColumn': 'Kolom Faktor',
  'data.addData': 'Tambah data',
  'data.editData': 'Edit data',
  'data.showDataTable': 'Tampilkan tabel data',
  'data.hideDataTable': 'Sembunyikan tabel data',

  // Status
  'status.cached': 'Tersimpan',
  'status.loading': 'Memuat',
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
    'Aturan Nelson 2 — seri {count} {side} rata-rata (#{start}–{end})',
  'chart.violation.nelson3.detail': 'Aturan Nelson 3 — tren {count} {direction} (#{start}–{end})',
  'chart.violation.side.above': 'di atas',
  'chart.violation.side.below': 'di bawah',
  'chart.violation.direction.increasing': 'meningkat',
  'chart.violation.direction.decreasing': 'menurun',

  // Parameterized messages
  'data.rowsLoaded': '{count} rows loaded',
  'findings.countLabel': '{count} findings',
};
