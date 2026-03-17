import type { MessageCatalog } from '../types';

/** Norwegian Bokm\u00e5l message catalog */
export const nb: MessageCatalog = {
  // Statistics labels
  'stats.mean': 'Gjennomsnitt',
  'stats.median': 'Median',
  'stats.stdDev': 'Std.avvik',
  'stats.samples': 'Prøver',
  'stats.passRate': 'Godkjent',
  'stats.range': 'Variasjonsbredde',
  'stats.min': 'Min',
  'stats.max': 'Maks',
  'stats.target': 'Målverdi',
  'stats.sigma': 'Sigma',

  // Chart labels
  'chart.observation': 'Observasjon',
  'chart.count': 'Antall',
  'chart.frequency': 'Frekvens',
  'chart.value': 'Verdi',
  'chart.category': 'Kategori',
  'chart.cumulative': 'Kumulativ %',
  'chart.clickToEdit': 'Klikk for å redigere',
  'chart.median': 'Median',
  'chart.q1': 'Q1',
  'chart.q3': 'Q3',
  'chart.noChannelData': 'Ingen kanaldata',
  'chart.selectChannel': 'Velg kanal',

  // Limit labels (Scandinavian standards use ISO/English abbreviations)
  'limits.usl': 'USL',
  'limits.lsl': 'LSL',
  'limits.ucl': 'UCL',
  'limits.lcl': 'LCL',
  'limits.mean': 'Gjennomsnitt',
  'limits.target': 'Målverdi',

  // Navigation
  'nav.newAnalysis': 'Ny analyse',
  'nav.backToDashboard': 'Tilbake til instrumentpanel',
  'nav.settings': 'Innstillinger',
  'nav.export': 'Eksporter',
  'nav.presentation': 'Presentasjon',
  'nav.menu': 'Meny',
  'nav.moreActions': 'Flere handlinger',

  // Panel titles
  'panel.findings': 'Funn',
  'panel.dataTable': 'Datatabell',
  'panel.whatIf': 'Hva hvis',
  'panel.investigation': 'Undersøkelse',
  'panel.coScout': 'CoScout',
  'panel.drillPath': 'Nedbrytingssti',

  // View modes
  'view.list': 'Liste',
  'view.board': 'Tavle',
  'view.tree': 'Tre',

  // Action buttons
  'action.save': 'Lagre',
  'action.cancel': 'Avbryt',
  'action.delete': 'Slett',
  'action.edit': 'Rediger',
  'action.copy': 'Kopier',
  'action.close': 'Lukk',
  'action.learnMore': 'Les mer',
  'action.download': 'Last ned',
  'action.apply': 'Bruk',
  'action.reset': 'Tilbakestill',
  'action.retry': 'Prøv igjen',
  'action.send': 'Send',
  'action.ask': 'Spør',
  'action.clear': 'Tøm',
  'action.copyAll': 'Kopier alt',
  'action.selectAll': 'Velg alle',

  // CoScout
  'coscout.send': 'Send',
  'coscout.clear': 'Tøm samtale',
  'coscout.stop': 'Stopp',
  'coscout.rateLimit': 'Grense nådd. Vennligst vent.',
  'coscout.contentFilter': 'Innhold filtrert av sikkerhetspolicy.',
  'coscout.error': 'Det oppstod en feil. Prøv igjen.',

  // Display/settings
  'display.preferences': 'Innstillinger',
  'display.chartTextSize': 'Diagramtekststørrelse',
  'display.compact': 'Kompakt',
  'display.normal': 'Normal',
  'display.large': 'Stor',
  'display.lockYAxis': 'Lås Y-akse',
  'display.filterContext': 'Filterkontekst',
  'display.showSpecs': 'Vis spesifikasjoner',

  // Investigation
  'investigation.brief': 'Undersøkelsesrapport',
  'investigation.assignedToMe': 'Tildelt til meg',
  'investigation.hypothesis': 'Hypotese',
  'investigation.hypotheses': 'Hypoteser',
  'investigation.pinAsFinding': 'Fest som funn',
  'investigation.addObservation': 'Legg til observasjon',

  // Empty states
  'empty.noData': 'Ingen data tilgjengelig',
  'empty.noFindings': 'Ingen funn ennå',
  'empty.noResults': 'Ingen resultater funnet',

  // Error messages
  'error.generic': 'Noe gikk galt',
  'error.loadFailed': 'Kunne ikke laste data',
  'error.parseFailed': 'Kunne ikke tolke filen',

  // Settings labels
  'settings.language': 'Språk',
  'settings.theme': 'Tema',
  'settings.textSize': 'Tekststørrelse',

  // Finding statuses
  'findings.observed': 'Observert',
  'findings.investigating': 'Undersøkes',
  'findings.analyzed': 'Analysert',
  'findings.improving': 'Forbedres',
  'findings.resolved': 'Løst',

  // Report labels
  'report.summary': 'Sammendrag',
  'report.findings': 'Funn',
  'report.recommendations': 'Anbefalinger',
  'report.evidence': 'Dokumentasjon',

  // Data input labels
  'data.pasteData': 'Lim inn data',
  'data.uploadFile': 'Last opp fil',
  'data.columnMapping': 'Kolonnetilordning',
  'data.measureColumn': 'Målekolonne',
  'data.factorColumn': 'Faktorkolonne',
  'data.addData': 'Legg til data',
  'data.editData': 'Rediger data',
  'data.showDataTable': 'Vis datatabell',
  'data.hideDataTable': 'Skjul datatabell',

  // Status
  'status.cached': 'Hurtiglagret',
  'status.loading': 'Laster',
  'status.ai': 'AI',
};
