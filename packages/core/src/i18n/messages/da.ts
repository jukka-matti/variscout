import type { MessageCatalog } from '../types';

/** Danish message catalog */
export const da: MessageCatalog = {
  // Statistics labels
  'stats.mean': 'Gennemsnit',
  'stats.median': 'Median',
  'stats.stdDev': 'Std.afv.',
  'stats.samples': 'Prøver',
  'stats.passRate': 'Godkendt',
  'stats.range': 'Variationsbredde',
  'stats.min': 'Min',
  'stats.max': 'Maks',
  'stats.target': 'Målværdi',
  'stats.sigma': 'Sigma',

  // Chart labels
  'chart.observation': 'Observation',
  'chart.count': 'Antal',
  'chart.frequency': 'Frekvens',
  'chart.value': 'Værdi',
  'chart.category': 'Kategori',
  'chart.cumulative': 'Kumulativ %',
  'chart.clickToEdit': 'Klik for at redigere',
  'chart.median': 'Median',
  'chart.q1': 'Q1',
  'chart.q3': 'Q3',
  'chart.noChannelData': 'Ingen kanaldata',
  'chart.selectChannel': 'Vælg kanal',

  // Limit labels (Scandinavian standards use ISO/English abbreviations)
  'limits.usl': 'USL',
  'limits.lsl': 'LSL',
  'limits.ucl': 'UCL',
  'limits.lcl': 'LCL',
  'limits.mean': 'Gennemsnit',
  'limits.target': 'Målværdi',

  // Navigation
  'nav.newAnalysis': 'Ny analyse',
  'nav.backToDashboard': 'Tilbage til instrumentbræt',
  'nav.settings': 'Indstillinger',
  'nav.export': 'Eksportér',
  'nav.presentation': 'Præsentation',
  'nav.menu': 'Menu',
  'nav.moreActions': 'Flere handlinger',

  // Panel titles
  'panel.findings': 'Resultater',
  'panel.dataTable': 'Datatabel',
  'panel.whatIf': 'Hvad hvis',
  'panel.investigation': 'Undersøgelse',
  'panel.coScout': 'CoScout',
  'panel.drillPath': 'Nedbrydningssti',

  // View modes
  'view.list': 'Liste',
  'view.board': 'Tavle',
  'view.tree': 'Træ',

  // Action buttons
  'action.save': 'Gem',
  'action.cancel': 'Annullér',
  'action.delete': 'Slet',
  'action.edit': 'Rediger',
  'action.copy': 'Kopiér',
  'action.close': 'Luk',
  'action.learnMore': 'Læs mere',
  'action.download': 'Download',
  'action.apply': 'Anvend',
  'action.reset': 'Nulstil',
  'action.retry': 'Prøv igen',
  'action.send': 'Send',
  'action.ask': 'Spørg',
  'action.clear': 'Ryd',
  'action.copyAll': 'Kopiér alt',
  'action.selectAll': 'Vælg alle',

  // CoScout
  'coscout.send': 'Send',
  'coscout.clear': 'Ryd samtale',
  'coscout.stop': 'Stop',
  'coscout.rateLimit': 'Begrænsning nået. Vent venligst.',
  'coscout.contentFilter': 'Indhold filtreret af sikkerhedspolitik.',
  'coscout.error': 'Der opstod en fejl. Prøv igen.',

  // Display/settings
  'display.preferences': 'Præferencer',
  'display.chartTextSize': 'Diagramtekststørrelse',
  'display.compact': 'Kompakt',
  'display.normal': 'Normal',
  'display.large': 'Stor',
  'display.lockYAxis': 'Lås Y-akse',
  'display.filterContext': 'Filterkontekst',
  'display.showSpecs': 'Vis specifikationer',

  // Investigation
  'investigation.brief': 'Undersøgelsesrapport',
  'investigation.assignedToMe': 'Tildelt til mig',
  'investigation.hypothesis': 'Hypotese',
  'investigation.hypotheses': 'Hypoteser',
  'investigation.pinAsFinding': 'Fastgør som resultat',
  'investigation.addObservation': 'Tilføj observation',

  // Empty states
  'empty.noData': 'Ingen data tilgængelige',
  'empty.noFindings': 'Ingen resultater endnu',
  'empty.noResults': 'Ingen resultater fundet',

  // Error messages
  'error.generic': 'Noget gik galt',
  'error.loadFailed': 'Kunne ikke indlæse data',
  'error.parseFailed': 'Kunne ikke fortolke filen',

  // Settings labels
  'settings.language': 'Sprog',
  'settings.theme': 'Tema',
  'settings.textSize': 'Tekststørrelse',

  // Finding statuses
  'findings.observed': 'Observeret',
  'findings.investigating': 'Undersøges',
  'findings.analyzed': 'Analyseret',
  'findings.improving': 'Forbedres',
  'findings.resolved': 'Løst',

  // Report labels
  'report.summary': 'Opsummering',
  'report.findings': 'Resultater',
  'report.recommendations': 'Anbefalinger',
  'report.evidence': 'Dokumentation',

  // Data input labels
  'data.pasteData': 'Indsæt data',
  'data.uploadFile': 'Upload fil',
  'data.columnMapping': 'Kolonnetilknytning',
  'data.measureColumn': 'Målekolonne',
  'data.factorColumn': 'Faktorkolonne',
  'data.addData': 'Tilføj data',
  'data.editData': 'Rediger data',
  'data.showDataTable': 'Vis datatabel',
  'data.hideDataTable': 'Skjul datatabel',

  // Status
  'status.cached': 'Cachelagret',
  'status.loading': 'Indlæser',
  'status.ai': 'AI',
};
