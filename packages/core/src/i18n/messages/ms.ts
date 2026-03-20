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
  'findings.countLabel': '{count} penemuan',

  // Chart limit labels
  'chart.label.ucl': 'UCL:',
  'chart.label.lcl': 'LCL:',
  'chart.label.mean': 'Min Purata:',
  'chart.label.tgt': 'Sas:',
  'chart.label.usl': 'USL:',
  'chart.label.lsl': 'LSL:',
  'chart.label.value': 'Nilai:',
  'chart.label.n': 'n:',
  'chart.label.target': 'Sasaran:',

  // Chart status
  'chart.status.inControl': 'Dalam kawalan',
  'chart.status.outOfControl': 'Di luar kawalan (melebihi UCL/LCL)',
  'chart.noDataProbPlot': 'Tiada data untuk plot kebarangkalian',

  // Chart edit affordances
  'chart.edit.spec': 'Klik untuk mengedit {spec}',
  'chart.edit.axisLabel': 'Klik untuk mengedit label paksi',
  'chart.edit.yAxis': 'Klik untuk mengedit skala paksi-Y',
  'chart.edit.saveCancel': 'Enter untuk simpan · Esc untuk batal',

  // Performance table headers
  'chart.table.channel': 'Saluran',
  'stats.cp': 'Cp',

  // Chart UI labels
  'chart.copyToClipboard': 'Salin carta ke papan keratan',
  'chart.maximize': 'Besarkan carta',
  'chart.type.ichart': 'I-Chart',
  'chart.type.boxplot': 'Boxplot',
  'chart.type.pareto': 'Pareto',
  'chart.drillHere': '↓ terokai di sini',
  'chart.percent': 'Peratus',

  // Y-axis popover
  'chart.yAxisScale': 'Skala Paksi-Y',
  'validation.minLessThanMax': 'Min mesti kurang daripada Maks',
  'action.noChanges': 'Tiada Perubahan',

  // Create factor modal
  'factor.create': 'Cipta Faktor daripada Pilihan',
  'factor.name': 'Nama Faktor',
  'factor.nameEmpty': 'Nama faktor tidak boleh kosong',
  'factor.nameExists': 'Faktor dengan nama ini sudah wujud',
  'factor.example': 'cth., Peristiwa Suhu Tinggi',
  'factor.pointsMarked': '{count} titik akan ditanda sebagai:',
  'factor.createAndFilter': 'Cipta & Tapis',
  'factor.filterExplanation':
    'Paparan akan ditapis secara automatik untuk menunjukkan hanya titik yang dipilih.',

  // Characteristic type selector
  'charType.nominal': 'Nominal',
  'charType.nominalDesc': 'Berpusat sasaran (cth. berat isian)',
  'charType.smaller': 'Lebih kecil lebih baik',
  'charType.smallerDesc': 'Lebih rendah lebih baik (cth. kecacatan)',
  'charType.larger': 'Lebih besar lebih baik',
  'charType.largerDesc': 'Lebih tinggi lebih baik (cth. hasil)',

  // Investigation prompt
  'investigation.trackingPrompt':
    'Menjejaki penyiasatan anda — buka panel Penyiasatan untuk melihat gambaran penuh.',

  // Mobile category sheet
  'chart.highlight': 'Serlahan:',
  'chart.highlightRed': 'Merah',
  'chart.highlightAmber': 'Ambar',
  'chart.highlightGreen': 'Hijau',
  'chart.clearHighlight': 'Padam serlahan',
  'chart.drillDown': 'Terokai "{category}"',
  'ai.askCoScout': 'Tanya CoScout tentang ini',

  // Settings descriptions
  'display.lockYAxisDesc': 'Mengekalkan skala untuk perbandingan visual',
  'display.filterContextDesc': 'Paparkan ringkasan penapis aktif di bawah tajuk carta',

  // Performance detected modal
  'performance.detected': 'Mod Prestasi Dikesan',
  'performance.columnsFound': '{count} lajur pengukuran ditemui',
  'performance.labelQuestion': 'Apakah yang diwakili oleh saluran pengukuran ini?',
  'performance.labelExample': 'cth., Kepala Isian, Kaviti, Muncung',
  'performance.enable': 'Dayakan Mod Prestasi',

  // Finding editor & data types
  'finding.placeholder': 'Apa yang anda temui?',
  'finding.note': 'Nota penemuan',
  'data.typeNumeric': 'Numerik',
  'data.typeCategorical': 'Kategori',
  'data.typeDate': 'Tarikh',
  'data.typeText': 'Teks',
  'data.categories': 'kategori',

  // PWA HomeScreen
  'home.heading': 'Terokai Analisis Variasi',
  'home.description':
    'Alat latihan analisis variasi percuma. Visualisasi kebolehubahan, kira keupayaan, dan cari fokus — terus dalam pelayar anda.',
  'home.divider': 'atau gunakan data anda sendiri',
  'home.pasteHelper': 'Salin baris dan tampal — kami akan mengesan lajur secara automatik',
  'home.manualEntry': 'Atau masukkan data secara manual',
  'home.upgradeHint': 'Perlukan ciri pasukan, muat naik fail, atau projek tersimpan?',

  // PWA navigation
  'nav.presentationMode': 'Mod Pembentangan',
  'nav.hideFindings': 'Sembunyikan Penemuan',

  // Export
  'export.asImage': 'Eksport sebagai Imej',
  'export.asCsv': 'Eksport sebagai CSV',
  'export.imageDesc': 'Tangkapan skrin PNG untuk pembentangan',
  'export.csvDesc': 'Fail data serasi hamparan',

  // Sample section
  'sample.heading': 'Cuba Set Data Sampel',
  'sample.allSamples': 'Semua Set Data Sampel',
  'sample.featured': 'Pilihan',
  'sample.caseStudies': 'Kajian Kes',
  'sample.journeys': 'Perjalanan Pembelajaran',
  'sample.industry': 'Contoh Industri',

  // View modes
  'view.stats': 'Statistik',
  'display.appearance': 'Penampilan',

  // Azure toolbar
  'data.manualEntry': 'Kemasukan Manual',
  'data.editTable': 'Edit Jadual Data',
  'toolbar.saveAs': 'Simpan Sebagai…',
  'toolbar.saving': 'Menyimpan…',
  'toolbar.saved': 'Disimpan',
  'toolbar.saveFailed': 'Simpanan Gagal',
  'toolbar.addMore': 'Tambah Data',
  'report.scouting': 'Laporan Tinjauan',
  'export.csvFiltered': 'Eksport data yang ditapis sebagai CSV',
  'error.auth': 'Ralat pengesahan',

  // File browse
  'file.browseLocal': 'Semak imbas peranti ini',
  'file.browseSharePoint': 'Semak imbas SharePoint',
  'file.open': 'Buka Fail',

  // Admin hub
  'admin.title': 'Admin',
  'admin.status': 'Status',
  'admin.plan': 'Pelan & Ciri',
  'admin.teams': 'Persediaan Teams',
  'admin.knowledge': 'Pangkalan Pengetahuan',
  'admin.troubleshooting': 'Penyelesaian Masalah',

  // Admin plan tab
  'admin.currentPlan': 'Semasa',
  'admin.feature': 'Ciri',
  'admin.manageSubscription': 'Urus Langganan dalam Azure',
  'admin.planStandard': 'Standard',
  'admin.planTeam': 'Team',
  'admin.planStandardPrice': '€79/bln',
  'admin.planTeamPrice': '€199/bln',
  'admin.planStandardDesc': 'Analisis penuh dengan CoScout AI',
  'admin.planTeamDesc': 'Teams, OneDrive, SharePoint, Pangkalan Pengetahuan',

  // Feature names
  'feature.charts': 'I-Chart, Boxplot, Pareto, Statistik',
  'feature.capability': 'Analisis keupayaan (Cp/Cpk)',
  'feature.performance': 'Mod Prestasi (berbilang saluran)',
  'feature.anova': 'ANOVA & analisis faktor',
  'feature.findingsWorkflow': 'Penemuan & aliran kerja penyiasatan',
  'feature.whatIf': 'Simulasi Bagaimana-Jika',
  'feature.csvImport': 'Import CSV/Excel',
  'feature.reportExport': 'Eksport laporan (PDF)',
  'feature.indexedDb': 'Storan tempatan IndexedDB',
  'feature.maxFactors': 'Sehingga 6 faktor',
  'feature.maxRows': 'Sehingga 100K baris',
  'feature.onedriveSync': 'Penyegerakan projek OneDrive',
  'feature.sharepointPicker': 'Pemilih fail SharePoint',
  'feature.teamsIntegration': 'Integrasi Microsoft Teams',
  'feature.channelCollab': 'Kerjasama berasaskan saluran',
  'feature.mobileUi': 'UI dioptimumkan untuk mudah alih',
  'feature.coScoutAi': 'Pembantu CoScout AI',
  'feature.narrativeBar': 'Cerapan NarrativeBar',
  'feature.chartInsights': 'Cip cerapan carta',
  'feature.knowledgeBase': 'Pangkalan Pengetahuan (carian SharePoint)',
  'feature.aiActions': 'Tindakan dicadangkan AI',

  // Admin Teams setup
  'admin.teams.heading': 'Tambah VariScout ke Microsoft Teams',
  'admin.teams.description':
    'Jana pakej aplikasi Teams untuk penggunaan anda dan muat naik ke pusat pentadbir Teams anda.',
  'admin.teams.running': 'Berjalan dalam Microsoft Teams',
  'admin.teams.step1': 'ID Klien Pendaftaran Aplikasi (Pilihan)',
  'admin.teams.step1Desc':
    'Masukkan ID Klien Pendaftaran Aplikasi Azure AD anda untuk mendayakan Teams SSO dalam manifes.',
  'admin.teams.step2': 'Muat Turun Pakej Aplikasi Teams',
  'admin.teams.step2Desc':
    '.zip ini mengandungi manifes dan ikon yang diprakonfigurasi untuk penggunaan anda.',
  'admin.teams.step3': 'Muat naik ke Pusat Pentadbir Teams',
  'admin.teams.step4': 'Tambah VariScout ke Saluran',
  'admin.teams.download': 'Muat Turun Pakej Aplikasi Teams',

  // Admin status tab
  'admin.checksResult': '{pass}/{total} semakan lulus',
  'admin.runChecks': 'Jalankan Semua Semakan',
  'admin.notApplicable': 'Tidak berkenaan untuk pelan anda',
  'admin.managePortal': 'Urus dalam Azure Portal',
  'admin.portalAccessNote':
    'Item ini memerlukan akses Azure Portal dan tidak boleh disemak dari pelayar.',
  'admin.fixInPortal': 'Betulkan dalam Azure Portal: {label}',

  // Admin troubleshoot tab
  'admin.troubleshoot.intro':
    'Masalah biasa dan cara menyelesaikannya. Klik masalah untuk melihat arahan langkah demi langkah.',
  'admin.runCheck': 'Jalankan Semakan',
  'admin.checkPassed': 'Semakan lulus — ini mungkin bukan masalahnya.',
  'admin.checkFailed': 'Semakan gagal — ikuti langkah di bawah.',
  'admin.issue.signin': 'Pengguna tidak boleh log masuk',
  'admin.issue.signinDesc':
    'Pengesahan Azure AD tidak berfungsi atau pengguna melihat halaman kosong.',
  'admin.issue.signinSteps':
    'Sahkan Pengesahan App Service didayakan dalam Azure Portal.\nSemak pendaftaran aplikasi Azure AD mempunyai URI pengalihan yang betul.\nPastikan pendaftaran aplikasi mempunyai "Token ID" didayakan di bawah Pengesahan.\nSahkan penyewa membenarkan log masuk pengguna ke aplikasi (Aplikasi Perusahaan → Sifat → Didayakan untuk pengguna log masuk).',
  'admin.issue.onedrive': 'Penyegerakan OneDrive tidak berfungsi',
  'admin.issue.onedriveDesc':
    'Projek tidak disegerakkan ke OneDrive atau pengguna melihat ralat kebenaran.',
  'admin.issue.onedriveSteps':
    'Sahkan pendaftaran aplikasi mempunyai kebenaran terwakil "Files.ReadWrite".\nSemak persetujuan pentadbir telah diberikan untuk kebenaran Graph.\nPastikan pengguna mempunyai lesen OneDrive yang diberikan.\nCuba log keluar dan log masuk semula untuk menyegarkan token.',
  'admin.issue.coscout': 'CoScout tidak bertindak balas',
  'admin.issue.coscoutDesc': 'Pembantu AI tidak menjana respons atau menunjukkan ralat.',
  'admin.issue.coscoutSteps':
    'Sahkan titik akhir AI dikonfigurasikan dalam templat ARM / tetapan App Service.\nSemak sumber Azure AI Services telah digunakan dan berjalan.\nSahkan penggunaan model wujud (cth. gpt-4o) dalam sumber AI Services.\nSemak kuota Azure AI Services — penggunaan mungkin telah mencapai had kadar.',
  'admin.issue.kbEmpty': 'Pangkalan Pengetahuan tidak mengembalikan hasil',
  'admin.issue.kbEmptyDesc':
    '"Cari Pangkalan Pengetahuan" CoScout tidak menemui apa-apa walaupun dokumen wujud.',
  'admin.issue.kbEmptySteps':
    'Sahkan titik akhir AI Search dikonfigurasikan dalam tetapan App Service.\nSemak sumber pengetahuan Remote SharePoint telah dicipta dalam AI Search.\nPastikan ≥1 lesen Microsoft 365 Copilot aktif dalam penyewa.\nSahkan pengguna mempunyai akses SharePoint ke dokumen yang dicari.\nSemak togol pratonton Pangkalan Pengetahuan didayakan (Admin → tab Pangkalan Pengetahuan).',
  'admin.issue.teamsTab': 'Tab Teams tidak dipaparkan',
  'admin.issue.teamsTabDesc': 'VariScout tidak muncul dalam Teams atau tab gagal dimuatkan.',
  'admin.issue.teamsTabSteps':
    'Sahkan pakej aplikasi Teams (.zip) telah dimuat naik ke Pusat Pentadbir Teams.\nSemak contentUrl dalam manifest.json sepadan dengan URL App Service anda.\nPastikan aplikasi diluluskan dalam Pusat Pentadbir Teams (tidak disekat oleh dasar).\nCuba alih keluar dan tambah semula tab dalam saluran.\nJika menggunakan domain tersuai, sahkan ia berada dalam tatasusunan validDomains manifes.',
  'admin.issue.newUser': 'Pengguna baharu tidak boleh mengakses aplikasi',
  'admin.issue.newUserDesc':
    'Pengguna yang baru ditambah melihat akses ditolak atau halaman kosong.',
  'admin.issue.newUserSteps':
    'Dalam Azure AD, pergi ke Aplikasi Perusahaan → VariScout → Pengguna dan kumpulan.\nTambah pengguna atau kumpulan keselamatan mereka ke aplikasi.\nJika "Penugasan pengguna diperlukan" digunakan, pastikan pengguna mempunyai penugasan.\nSemak dasar Akses Bersyarat yang mungkin menyekat pengguna.',
  'admin.issue.aiSlow': 'Respons AI lambat',
  'admin.issue.aiSlowDesc':
    'CoScout mengambil masa lama untuk bertindak balas atau sering tamat masa.',
  'admin.issue.aiSlowSteps':
    'Semak rantau penggunaan Azure AI Services — kependaman meningkat dengan jarak.\nSahkan penggunaan model mempunyai kuota TPM (token seminit) yang mencukupi.\nPertimbangkan naik taraf ke penggunaan daya pemprosesan yang diperuntukkan untuk kependaman yang konsisten.\nSemak jika indeks AI Search besar — pertimbangkan untuk mengoptimumkan sumber pengetahuan.',
  'admin.issue.forbidden': 'Ralat "Forbidden"',
  'admin.issue.forbiddenDesc': 'Pengguna melihat ralat 403 semasa mengakses ciri tertentu.',
  'admin.issue.forbiddenSteps':
    'Semak semua kebenaran Graph API yang diperlukan mempunyai persetujuan pentadbir.\nSahkan kedai token Pengesahan App Service didayakan.\nPastikan token pengguna belum tamat tempoh — cuba log keluar dan log masuk semula.\nSemak dasar Akses Bersyarat untuk penyewa.',
  'admin.issue.kbPartial': 'KB gagal untuk sesetengah pengguna',
  'admin.issue.kbPartialDesc':
    'Carian Pangkalan Pengetahuan berfungsi untuk pentadbir tetapi tidak untuk pengguna lain.',
  'admin.issue.kbPartialSteps':
    'Sumber pengetahuan Remote SharePoint menggunakan kebenaran setiap pengguna. Setiap pengguna mesti mempunyai akses SharePoint ke dokumen.\nSemak jika pengguna yang terjejas disekat oleh dasar Akses Bersyarat.\nSahkan persetujuan pentadbir telah diberikan untuk kebenaran terwakil Sites.Read.All.\nMinta pengguna yang terjejas log keluar dan log masuk semula untuk menyegarkan token mereka.',

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
  'improve.projectedCpk': 'Projected Cpk: {value}',
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
