import type { MessageCatalog } from '../types';

/**
 * Turkish message catalog
 */
export const tr: MessageCatalog = {
  // Statistics labels
  'stats.mean': 'Ortalama',
  'stats.median': 'Ortanca',
  'stats.stdDev': 'Std. sapma',
  'stats.samples': 'Örnekler',
  'stats.passRate': 'Uygunluk oranı',
  'stats.range': 'Aralık',
  'stats.min': 'Min',
  'stats.max': 'Maks',
  'stats.target': 'Hedef',
  'stats.sigma': 'Sigma',

  // Chart labels
  'chart.observation': 'Gözlem',
  'chart.count': 'Sayı',
  'chart.frequency': 'Frekans',
  'chart.value': 'Değer',
  'chart.category': 'Kategori',
  'chart.cumulative': 'Kümülatif %',
  'chart.clickToEdit': 'Düzenlemek için tıklayın',
  'chart.median': 'Ortanca',
  'chart.q1': 'Q1',
  'chart.q3': 'Q3',
  'chart.noChannelData': 'Kanal verisi yok',
  'chart.selectChannel': 'Kanal seçin',

  // Limit labels (TSE standards)
  'limits.usl': 'ÜSL',
  'limits.lsl': 'ASL',
  'limits.ucl': 'ÜKL',
  'limits.lcl': 'AKL',
  'limits.mean': 'Ortalama',
  'limits.target': 'Hedef',

  // Navigation
  'nav.newAnalysis': 'Yeni Analiz',
  'nav.backToDashboard': 'Panele dön',
  'nav.settings': 'Ayarlar',
  'nav.export': 'Dışa aktar',
  'nav.presentation': 'Sunum',
  'nav.menu': 'Menü',
  'nav.moreActions': 'Diğer işlemler',

  // Panel titles
  'panel.findings': 'Bulgular',
  'panel.dataTable': 'Veri Tablosu',
  'panel.whatIf': 'Ya Olursa',
  'panel.investigation': 'İnceleme',
  'panel.coScout': 'CoScout',
  'panel.drillPath': 'Detay Yolu',

  // View modes
  'view.list': 'Liste',
  'view.board': 'Pano',
  'view.tree': 'Ağaç',

  // Action buttons
  'action.save': 'Kaydet',
  'action.cancel': 'İptal',
  'action.delete': 'Sil',
  'action.edit': 'Düzenle',
  'action.copy': 'Kopyala',
  'action.close': 'Kapat',
  'action.learnMore': 'Daha fazla bilgi',
  'action.download': 'İndir',
  'action.apply': 'Uygula',
  'action.reset': 'Sıfırla',
  'action.retry': 'Tekrar dene',
  'action.send': 'Gönder',
  'action.ask': 'Sor',
  'action.clear': 'Temizle',
  'action.copyAll': 'Tümünü kopyala',
  'action.selectAll': 'Tümünü seç',

  // CoScout
  'coscout.send': 'Gönder',
  'coscout.clear': 'Sohbeti temizle',
  'coscout.stop': 'Durdur',
  'coscout.rateLimit': 'İstek sınırına ulaşıldı. Lütfen bekleyin.',
  'coscout.contentFilter': 'İçerik güvenlik politikası tarafından filtrelendi.',
  'coscout.error': 'Bir hata oluştu. Lütfen tekrar deneyin.',

  // Display/settings
  'display.preferences': 'Tercihler',
  'display.chartTextSize': 'Grafik metin boyutu',
  'display.compact': 'Sıkışık',
  'display.normal': 'Normal',
  'display.large': 'Büyük',
  'display.lockYAxis': 'Y eksenini kilitle',
  'display.filterContext': 'Filtre bağlamı',
  'display.showSpecs': 'Spesifikasyonları göster',

  // Investigation
  'investigation.brief': 'İnceleme özeti',
  'investigation.assignedToMe': 'Bana atanan',
  'investigation.hypothesis': 'Hipotez',
  'investigation.hypotheses': 'Hipotezler',
  'investigation.pinAsFinding': 'Bulgu olarak sabitle',
  'investigation.addObservation': 'Gözlem ekle',

  // Empty states
  'empty.noData': 'Veri yok',
  'empty.noFindings': 'Henüz bulgu yok',
  'empty.noResults': 'Sonuç bulunamadı',

  // Error messages
  'error.generic': 'Bir sorun oluştu',
  'error.loadFailed': 'Veri yüklenemedi',
  'error.parseFailed': 'Dosya ayrıştırılamadı',

  // Settings labels
  'settings.language': 'Dil',
  'settings.theme': 'Tema',
  'settings.textSize': 'Metin boyutu',

  // Finding statuses
  'findings.observed': 'Gözlemlendi',
  'findings.investigating': 'İnceleniyor',
  'findings.analyzed': 'Analiz edildi',
  'findings.improving': 'İyileştiriliyor',
  'findings.resolved': 'Çözüldü',

  // Report labels
  'report.summary': 'Özet',
  'report.findings': 'Bulgular',
  'report.recommendations': 'Öneriler',
  'report.evidence': 'Kanıtlar',

  // Data input labels
  'data.pasteData': 'Veri yapıştır',
  'data.uploadFile': 'Dosya yükle',
  'data.columnMapping': 'Sütun eşleme',
  'data.measureColumn': 'Ölçüm sütunu',
  'data.factorColumn': 'Faktör sütunu',
  'data.addData': 'Veri ekle',
  'data.editData': 'Veri düzenle',
  'data.showDataTable': 'Veri tablosunu göster',
  'data.hideDataTable': 'Veri tablosunu gizle',

  // Status
  'status.cached': 'Önbellekte',
  'status.loading': 'Yükleniyor',
  'status.ai': 'YZ',
  // Methodology Coach
  'coach.frame': 'Frame',
  'coach.scout': 'Scout',
  'coach.investigate': 'Investigate',
  'coach.improve': 'Improve',
  'coach.frameDesc': 'Define the problem and set boundaries',
  'coach.scoutDesc': 'Gather data and explore patterns',
  'coach.investigateDesc': 'Test hypotheses and find root causes',
  'coach.improveDesc': 'Implement changes and verify results',
  'report.kpi.samples': 'Samples',
  'report.kpi.mean': 'Mean',
  'report.kpi.variation': 'Variation',
  'report.kpi.cpk': 'Cpk',
  'report.kpi.passRate': 'Pass Rate',
  'ai.propose': 'Propose',
  'ai.applied': 'Applied',
  'ai.dismissed': 'Dismissed',
  'ai.expired': 'Expired',
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
  'data.pasteInstructions': 'Paste your data here',
  'data.pasteSubtitle': 'Copy from Excel, CSV, or any spreadsheet',
  'data.useExample': 'Use example data',
  'data.analyzing': 'Analyzing…',
  'data.tipWithData': 'Tip: Include column headers in the first row',
  'data.tipNoData': 'Tip: Try pasting data from a spreadsheet or CSV file',
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
  'chart.legend.commonCause': 'Common Cause',
  'chart.legend.specialCause': 'Special Cause',
  'chart.legend.outOfSpec': 'Out-of-Spec',
  'chart.legend.inControl': 'In-Control',
  'chart.legend.randomVariation': 'Random variation',
  'chart.legend.defect': 'Customer defect',
  'chart.violation.aboveUsl': 'Above USL ({value})',
  'chart.violation.belowLsl': 'Below LSL ({value})',
  'chart.violation.aboveUcl': 'Above UCL — special cause',
  'chart.violation.belowLcl': 'Below LCL — special cause',
  'chart.violation.aboveUclFavorable': 'Above UCL — favorable shift',
  'chart.violation.belowLclFavorable': 'Below LCL — favorable shift',
  'chart.violation.nelson2': 'Nelson Rule 2 — run of {count}',
  'chart.violation.nelson3': 'Nelson Rule 3 — trend of {count}',
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
  'coach.frameTitle': 'Frame the Problem',
  'coach.scoutTitle': 'Scout the Data',
  'coach.investigateTitle': 'Investigate Causes',
  'coach.improveTitle': 'Improve the Process',
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
  'report.kpi.inSpec': 'In Spec',
  'table.noData': 'No data to display',
  'table.page': 'Page {page} of {total}',
  'table.rowsPerPage': 'Rows per page',
  'table.editHint': 'Click a cell to edit',
  'table.excluded': 'Excluded',
  'table.deleteRow': 'Delete row',
  'table.addRow': 'Add row',
  'table.unsavedChanges': 'Unsaved changes',
  'specs.title': 'Specification Limits',
  'specs.advancedSettings': 'Advanced settings',
  'specs.apply': 'Apply specifications',
  'specs.noChanges': 'No changes to apply',
  'specs.editTitle': 'Edit Specifications',
  'specs.lslLabel': 'Lower Specification Limit (LSL)',
  'specs.uslLabel': 'Upper Specification Limit (USL)',
  'upgrade.title': 'Upgrade Available',
  'upgrade.limitReached': 'You have reached the limit for this feature',
  'upgrade.upgrade': 'Upgrade',
  'upgrade.viewOptions': 'View options',
  'upgrade.featureLimit': '{feature} is limited to {limit} in this plan',
  'display.violin': 'Violin plot',
  'display.violinDesc': 'Show distribution shape',
  'display.contribution': 'Contribution',
  'display.contributionDesc': 'Show variation contribution',
  'display.sort': 'Sort',
  'display.ascending': 'Ascending',
  'display.descending': 'Descending',
  'stats.summary': 'Summary Statistics',
  'stats.histogram': 'Histogram',
  'stats.probPlot': 'Probability Plot',
  'stats.editSpecs': 'Edit specifications',
  'whatif.adjustMean': 'Adjust mean',
  'whatif.reduceVariation': 'Reduce variation',
  'whatif.currentProjected': 'Current vs Projected',
  'whatif.resetAdjustments': 'Reset adjustments',
  'whatif.yield': 'Projected yield',
  // Chart violation details (parameterized)
  'chart.violation.nelson2.detail':
    'Nelson Kuralı 2 — ortalama {side} {count} seri (#{start}–{end})',
  'chart.violation.nelson3.detail': 'Nelson Kuralı 3 — {count} {direction} trend (#{start}–{end})',
  'chart.violation.side.above': 'üstünde',
  'chart.violation.side.below': 'altında',
  'chart.violation.direction.increasing': 'artan',
  'chart.violation.direction.decreasing': 'azalan',

  // Parameterized messages
  'data.rowsLoaded': '{count} rows loaded',
  'findings.countLabel': '{count} findings',

  // Chart limit labels (colon-suffixed for SVG rendering)
  'chart.label.ucl': 'UCL:',
  'chart.label.lcl': 'LCL:',
  'chart.label.mean': 'Ort.:',
  'chart.label.tgt': 'Hdf:',
  'chart.label.usl': 'USL:',
  'chart.label.lsl': 'LSL:',
  'chart.label.value': 'Değer:',
  'chart.label.n': 'n:',
  'chart.label.target': 'Hedef:',

  // Chart status & empty states
  'chart.status.inControl': 'Kontrol altında',
  'chart.status.outOfControl': 'Kontrol dışında (UCL/LCL aşıldı)',
  'chart.noDataProbPlot': 'Olasılık grafiği için veri yok',

  // Chart edit affordances
  'chart.edit.spec': '{spec} düzenlemek için tıklayın',
  'chart.edit.axisLabel': 'Eksen etiketini düzenlemek için tıklayın',
  'chart.edit.yAxis': 'Y ekseni ölçeğini düzenlemek için tıklayın',
  'chart.edit.saveCancel': 'Kaydet: Enter · İptal: Esc',

  // Performance table headers
  'chart.table.channel': 'Kanal',
  'stats.cp': 'Cp',

  // Chart UI labels
  'chart.copyToClipboard': 'Grafiği panoya kopyala',
  'chart.maximize': 'Grafiği büyüt',
  'chart.type.ichart': 'I-Chart',
  'chart.type.boxplot': 'Boxplot',
  'chart.type.pareto': 'Pareto',
  'chart.drillHere': '↓ buraya detaylandır',
  'chart.percent': 'Yüzde',

  // Y-axis popover
  'chart.yAxisScale': 'Y Ekseni Ölçeği',
  'validation.minLessThanMax': 'Min, Maks değerinden küçük olmalıdır',
  'action.noChanges': 'Değişiklik Yok',

  // Create factor modal
  'factor.create': 'Seçimden Faktör Oluştur',
  'factor.name': 'Faktör Adı',
  'factor.nameEmpty': 'Faktör adı boş olamaz',
  'factor.nameExists': 'Bu isimde bir faktör zaten mevcut',
  'factor.example': 'ör. Yüksek Sıcaklık Olayları',
  'factor.pointsMarked': '{count} nokta şu şekilde işaretlenecek:',
  'factor.createAndFilter': 'Oluştur ve Filtrele',
  'factor.filterExplanation':
    'Görünüm, yalnızca seçilen noktaları gösterecek şekilde otomatik olarak filtrelenir.',

  // Characteristic type selector
  'charType.nominal': 'Nominal',
  'charType.nominalDesc': 'Hedefe yönelik (ör. dolum ağırlığı)',
  'charType.smaller': 'Küçük olan daha iyi',
  'charType.smallerDesc': 'Düşük olan daha iyi (ör. hatalar)',
  'charType.larger': 'Büyük olan daha iyi',
  'charType.largerDesc': 'Yüksek olan daha iyi (ör. verim)',

  // Investigation prompt
  'investigation.trackingPrompt':
    'Araştırmanız izleniyor — tam resmi görmek için Araştırma panelini açın.',

  // Mobile category sheet
  'chart.highlight': 'Vurgula:',
  'chart.highlightRed': 'Kırmızı',
  'chart.highlightAmber': 'Amber',
  'chart.highlightGreen': 'Yeşil',
  'chart.clearHighlight': 'Vurgulamayı kaldır',
  'chart.drillDown': '"{category}" içine detaylandır',
  'ai.askCoScout': "CoScout'a sor",

  // Settings descriptions
  'display.lockYAxisDesc': 'Görsel karşılaştırma için ölçeği korur',
  'display.filterContextDesc': 'Grafik başlıkları altında aktif filtre özetini göster',

  // Performance detected modal
  'performance.detected': 'Performance Modu Algılandı',
  'performance.columnsFound': '{count} ölçüm sütunu bulundu',
  'performance.labelQuestion': 'Bu ölçüm kanalları neyi temsil ediyor?',
  'performance.labelExample': 'ör. Dolum Kafası, Boşluk, Nozül',
  'performance.enable': 'Performance Modunu Etkinleştir',

  // Finding editor & data types
  'finding.placeholder': 'Ne buldunuz?',
  'finding.note': 'Bulgu notu',
  'data.typeNumeric': 'Sayısal',
  'data.typeCategorical': 'Kategorik',
  'data.typeDate': 'Tarih',
  'data.typeText': 'Metin',
  'data.categories': 'kategoriler',

  // Coaching text (scenario × phase)
  'coach.problem.frame': 'Problemi araştırmaya başlamak için verilerinizi ayarlayın.',
  'coach.problem.scout': 'Problemi açıklayabilecek varyasyon kalıplarını arayın.',
  'coach.problem.investigate': 'Faktörleri problemle ilişkilendiren kanıtlar oluşturun.',
  'coach.problem.improve': 'PDCA döngüsünü kullanarak iyileştirmeleri planlayın ve uygulayın.',
  'coach.hypothesis.frame': 'Hipotezinizi test etmek için verilerinizi ayarlayın.',
  'coach.hypothesis.scout': 'Hipotezinizi destekleyen veya çürüten kanıtları arayın.',
  'coach.hypothesis.investigate':
    'Şüphelenilen nedeni doğrulamak için istatistiksel kanıt toplayın.',
  'coach.hypothesis.improve': 'Neden doğrulandı — PDCA ile düzeltici eylemleri planlayın.',
  'coach.routine.frame': 'Rutin süreç kontrolü için verilerinizi ayarlayın.',
  'coach.routine.scout': 'Yeni sinyalleri, kaymaları veya beklenmeyen kalıpları tarayın.',
  'coach.routine.investigate': 'Bir sinyal bulundu — olası nedenleri araştırın.',
  'coach.routine.improve': 'Neden belirlendi — PDCA ile düzeltici eylemleri planlayın.',

  // PWA HomeScreen
  'home.heading': 'Varyasyon Analizini Keşfedin',
  'home.description':
    'Ücretsiz varyasyon analizi eğitim aracı. Değişkenliği görselleştirin, yeterliliği hesaplayın ve odaklanacağınız yeri bulun — doğrudan tarayıcınızda.',
  'home.divider': 'veya kendi verilerinizi kullanın',
  'home.pasteHelper': 'Satırları kopyalayın ve yapıştırın — sütunları otomatik algılayacağız',
  'home.manualEntry': 'Veya verileri elle girin',
  'home.upgradeHint': 'Ekip özellikleri, dosya yükleme veya kayıtlı projeler mi gerekiyor?',

  // PWA navigation
  'nav.presentationMode': 'Sunum Modu',
  'nav.hideFindings': 'Bulguları Gizle',

  // Export
  'export.asImage': 'Görüntü olarak dışa aktar',
  'export.asCsv': 'CSV olarak dışa aktar',
  'export.imageDesc': 'Sunumlar için PNG ekran görüntüsü',
  'export.csvDesc': 'Elektronik tablo uyumlu veri dosyası',

  // Sample section
  'sample.heading': 'Bir Örnek Veri Setini Deneyin',
  'sample.allSamples': 'Tüm Örnek Veri Setleri',
  'sample.featured': 'Öne Çıkan',
  'sample.caseStudies': 'Vaka Çalışmaları',
  'sample.journeys': 'Öğrenme Yolculukları',
  'sample.industry': 'Sektör Örnekleri',

  // View modes (additional)
  'view.stats': 'İstatistikler',

  // Display (additional)
  'display.appearance': 'Görünüm',

  // Azure toolbar
  'data.manualEntry': 'Elle Giriş',
  'data.editTable': 'Veri Tablosunu Düzenle',
  'toolbar.saveAs': 'Farklı Kaydet…',
  'toolbar.saving': 'Kaydediliyor…',
  'toolbar.saved': 'Kaydedildi',
  'toolbar.saveFailed': 'Kayıt Başarısız',
  'toolbar.addMore': 'Veri Ekle',
  'report.scouting': 'Scouting Raporu',
  'export.csvFiltered': 'Filtrelenmiş verileri CSV olarak dışa aktar',
  'error.auth': 'Kimlik doğrulama hatası',

  // File browse
  'file.browseLocal': 'Bu cihaza göz at',
  'file.browseSharePoint': "SharePoint'a göz at",
  'file.open': 'Dosya Aç',

  // Admin hub
  'admin.title': 'Yönetim',
  'admin.status': 'Durum',
  'admin.plan': 'Plan ve Özellikler',
  'admin.teams': 'Teams Kurulumu',
  'admin.knowledge': 'Knowledge Base',
  'admin.troubleshooting': 'Sorun Giderme',

  // Admin plan tab
  'admin.currentPlan': 'Mevcut',
  'admin.feature': 'Özellik',
  'admin.manageSubscription': "Azure'da Aboneliği Yönet",
  'admin.planStandard': 'Standard',
  'admin.planTeam': 'Team',
  'admin.planTeamAI': 'Team AI',
  'admin.planStandardPrice': '€99/ay',
  'admin.planTeamPrice': '€199/ay',
  'admin.planTeamAIPrice': '€279/ay',
  'admin.planStandardDesc': 'Tam analiz, yerel dosya depolama',
  'admin.planTeamDesc': 'Teams, OneDrive, SharePoint, mobil',
  'admin.planTeamAIDesc': 'AI Knowledge Base, gelişmiş CoScout',

  // Feature names (plan matrix)
  'feature.charts': 'I-Chart, Boxplot, Pareto, Stats',
  'feature.capability': 'Yeterlilik analizi (Cp/Cpk)',
  'feature.performance': 'Performance Modu (çok kanallı)',
  'feature.anova': 'ANOVA ve faktör analizi',
  'feature.findingsWorkflow': 'Bulgular ve araştırma iş akışı',
  'feature.whatIf': 'What-If simülasyonu',
  'feature.csvImport': 'CSV/Excel içe aktarma',
  'feature.reportExport': 'Rapor dışa aktarma (PDF)',
  'feature.indexedDb': 'IndexedDB yerel depolama',
  'feature.maxFactors': 'En fazla 6 faktör',
  'feature.maxRows': 'En fazla 100K satır',
  'feature.onedriveSync': 'OneDrive proje senkronizasyonu',
  'feature.sharepointPicker': 'SharePoint dosya seçici',
  'feature.teamsIntegration': 'Microsoft Teams entegrasyonu',
  'feature.channelCollab': 'Kanal tabanlı iş birliği',
  'feature.mobileUi': 'Mobil için optimize edilmiş UI',
  'feature.coScoutAi': 'CoScout AI asistanı',
  'feature.narrativeBar': 'NarrativeBar içgörüleri',
  'feature.chartInsights': 'Grafik içgörü çipleri',
  'feature.knowledgeBase': 'Knowledge Base (SharePoint araması)',
  'feature.aiActions': 'AI önerili eylemler',

  // Admin Teams setup
  'admin.teams.heading': "VariScout'u Microsoft Teams'e Ekleyin",
  'admin.teams.description':
    'Dağıtımınız için bir Teams uygulama paketi oluşturun ve Teams yönetim merkezine yükleyin.',
  'admin.teams.running': 'Microsoft Teams içinde çalışıyor',
  'admin.teams.step1': 'Uygulama Kaydı İstemci Kimliği (İsteğe bağlı)',
  'admin.teams.step1Desc':
    "Manifestte Teams SSO'yu etkinleştirmek için Azure AD Uygulama Kaydı İstemci Kimliğinizi girin.",
  'admin.teams.step2': 'Teams Uygulama Paketini İndirin',
  'admin.teams.step2Desc':
    'Bu .zip, dağıtımınız için önceden yapılandırılmış manifesti ve simgeleri içerir.',
  'admin.teams.step3': 'Teams Yönetim Merkezine Yükleyin',
  'admin.teams.step4': 'Bir Kanala VariScout Ekleyin',
  'admin.teams.download': 'Teams Uygulama Paketini İndir',

  // Admin status tab
  'admin.checksResult': '{pass}/{total} kontrol başarılı',
  'admin.runChecks': 'Tüm Kontrolleri Çalıştır',
  'admin.notApplicable': 'Planınız için geçerli değil',
  'admin.managePortal': "Azure Portal'da Yönet",
  'admin.portalAccessNote':
    'Bu öğeler Azure Portal erişimi gerektirir ve tarayıcıdan kontrol edilemez.',
  'admin.fixInPortal': "Azure Portal'da düzelt: {label}",

  // Admin troubleshoot tab
  'admin.troubleshoot.intro':
    'Yaygın sorunlar ve çözümleri. Adım adım talimatları görmek için bir soruna tıklayın.',
  'admin.runCheck': 'Kontrol Çalıştır',
  'admin.checkPassed': 'Kontrol başarılı — bu sorun olmayabilir.',
  'admin.checkFailed': 'Kontrol başarısız — aşağıdaki adımları izleyin.',
  'admin.issue.signin': 'Kullanıcılar oturum açamıyor',
  'admin.issue.signinDesc':
    'Azure AD kimlik doğrulaması çalışmıyor veya kullanıcılar boş bir sayfa görüyor.',
  'admin.issue.signinSteps':
    'Azure Portal\'da App Service Kimlik Doğrulamasının etkin olduğunu doğrulayın.\nAzure AD uygulama kaydının doğru yönlendirme URI\'lerine sahip olduğunu kontrol edin.\nUygulama kaydının Kimlik Doğrulama altında "Kimlik belirteçleri"nin etkin olduğundan emin olun.\nKiracının uygulamaya kullanıcı girişine izin verdiğini doğrulayın (Kurumsal Uygulamalar → Özellikler → Kullanıcıların oturum açması için etkin).',
  'admin.issue.onedrive': 'OneDrive senkronizasyonu çalışmıyor',
  'admin.issue.onedriveDesc':
    "Projeler OneDrive'a senkronize edilmiyor veya kullanıcılar izin hataları görüyor.",
  'admin.issue.onedriveSteps':
    'Uygulama kaydının "Files.ReadWrite" temsilci iznine sahip olduğunu doğrulayın.\nGraph izinleri için yönetici onayının verildiğini kontrol edin.\nKullanıcının OneDrive lisansı atanmış olduğundan emin olun.\nBelirteci yenilemek için oturumu kapatıp tekrar açmayı deneyin.',
  'admin.issue.coscout': 'CoScout yanıt vermiyor',
  'admin.issue.coscoutDesc': 'AI asistanı yanıt üretmiyor veya hatalar gösteriyor.',
  'admin.issue.coscoutSteps':
    'AI uç noktasının ARM şablonunda / App Service ayarlarında yapılandırıldığını doğrulayın.\nAzure AI Services kaynağının dağıtılmış ve çalışır durumda olduğunu kontrol edin.\nAI Services kaynağında model dağıtımının mevcut olduğunu doğrulayın (ör. gpt-4o).\nAzure AI Services kotalarını kontrol edin — dağıtım hız sınırlarına ulaşmış olabilir.',
  'admin.issue.kbEmpty': 'Knowledge Base sonuç döndürmüyor',
  'admin.issue.kbEmptyDesc':
    'CoScout\'un "Knowledge Base Ara" özelliği belgeler olmasına rağmen hiçbir şey bulamıyor.',
  'admin.issue.kbEmptySteps':
    "AI Search uç noktasının App Service ayarlarında yapılandırıldığını doğrulayın.\nAI Search'te Remote SharePoint bilgi kaynağının oluşturulduğunu kontrol edin.\nKiracıda en az 1 Microsoft 365 Copilot lisansının aktif olduğundan emin olun.\nKullanıcının aranan belgelere SharePoint erişimi olduğunu doğrulayın.\nKnowledge Base önizleme düğmesinin etkin olduğunu kontrol edin (Yönetim → Knowledge Base sekmesi).",
  'admin.issue.teamsTab': 'Teams sekmesi görünmüyor',
  'admin.issue.teamsTabDesc': "VariScout Teams'de görünmüyor veya sekme yüklenemiyor.",
  'admin.issue.teamsTabSteps':
    "Teams uygulama paketinin (.zip) Teams Yönetim Merkezine yüklendiğini doğrulayın.\nmanifest.json'daki contentUrl'nin App Service URL'nizle eşleştiğini kontrol edin.\nUygulamanın Teams Yönetim Merkezinde onaylandığından emin olun (ilke tarafından engellenmemiş).\nKanalda sekmeyi kaldırıp yeniden eklemeyi deneyin.\nÖzel alan adı kullanıyorsanız, manifestteki validDomains dizisinde olduğunu doğrulayın.",
  'admin.issue.newUser': 'Yeni kullanıcı uygulamaya erişemiyor',
  'admin.issue.newUserDesc': 'Yeni eklenen kullanıcı erişim reddedildi veya boş sayfa görüyor.',
  'admin.issue.newUserSteps':
    'Azure AD\'de Kurumsal Uygulamalar → VariScout → Kullanıcılar ve gruplar\'a gidin.\nKullanıcıyı veya güvenlik grubunu uygulamaya ekleyin.\n"Kullanıcı ataması gerekli" kullanıyorsanız, kullanıcının bir ataması olduğundan emin olun.\nKullanıcıyı engelleyebilecek Koşullu Erişim ilkelerini kontrol edin.',
  'admin.issue.aiSlow': 'AI yanıtları yavaş',
  'admin.issue.aiSlowDesc':
    'CoScout yanıt vermesi uzun sürüyor veya sık sık zaman aşımına uğruyor.',
  'admin.issue.aiSlowSteps':
    'Azure AI Services dağıtım bölgesini kontrol edin — mesafe arttıkça gecikme artar.\nModel dağıtımının yeterli TPM (dakika başına belirteç) kotasına sahip olduğunu doğrulayın.\nTutarlı gecikme için sağlanan verimlilik dağıtımına yükseltmeyi düşünün.\nAI Search dizininin büyük olup olmadığını kontrol edin — bilgi kaynağını optimize etmeyi düşünün.',
  'admin.issue.forbidden': '"Forbidden" hataları',
  'admin.issue.forbiddenDesc': 'Kullanıcılar belirli özelliklere erişirken 403 hataları görüyor.',
  'admin.issue.forbiddenSteps':
    'Gerekli tüm Graph API izinlerinin yönetici onayına sahip olduğunu kontrol edin.\nApp Service Kimlik Doğrulama belirteç deposunun etkin olduğunu doğrulayın.\nKullanıcının belirtecinin süresinin dolmadığından emin olun — oturumu kapatıp tekrar açmayı deneyin.\nKiracı için Koşullu Erişim ilkelerini kontrol edin.',
  'admin.issue.kbPartial': 'KB bazı kullanıcılarda çalışmıyor',
  'admin.issue.kbPartialDesc':
    'Knowledge Base araması yöneticiler için çalışıyor ancak diğer kullanıcılar için çalışmıyor.',
  'admin.issue.kbPartialSteps':
    'Remote SharePoint bilgi kaynakları kullanıcı bazlı izinler kullanır. Her kullanıcının belgelere SharePoint erişimi olmalıdır.\nEtkilenen kullanıcıların Koşullu Erişim ilkeleri tarafından engellenip engellenmediğini kontrol edin.\nSites.Read.All temsilci izni için yönetici onayının verildiğini doğrulayın.\nEtkilenen kullanıcılardan belirteçlerini yenilemek için oturumu kapatıp tekrar açmalarını isteyin.',
};
