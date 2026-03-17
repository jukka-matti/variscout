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
};
