import type { MessageCatalog } from '../types';

/** Swedish message catalog */
export const sv: MessageCatalog = {
  // Statistics labels
  'stats.mean': 'Medelvärde',
  'stats.median': 'Median',
  'stats.stdDev': 'Std.avv.',
  'stats.samples': 'Prover',
  'stats.passRate': 'Godkänt',
  'stats.range': 'Variationsbredd',
  'stats.min': 'Min',
  'stats.max': 'Max',
  'stats.target': 'Målvärde',
  'stats.sigma': 'Sigma',

  // Chart labels
  'chart.observation': 'Observation',
  'chart.count': 'Antal',
  'chart.frequency': 'Frekvens',
  'chart.value': 'Värde',
  'chart.category': 'Kategori',
  'chart.cumulative': 'Kumulativ %',
  'chart.clickToEdit': 'Klicka för att redigera',
  'chart.median': 'Median',
  'chart.q1': 'Q1',
  'chart.q3': 'Q3',
  'chart.noChannelData': 'Inga kanaldata',
  'chart.selectChannel': 'Välj kanal',

  // Limit labels (Scandinavian standards use ISO/English abbreviations)
  'limits.usl': 'USL',
  'limits.lsl': 'LSL',
  'limits.ucl': 'UCL',
  'limits.lcl': 'LCL',
  'limits.mean': 'Medelvärde',
  'limits.target': 'Målvärde',

  // Navigation
  'nav.newAnalysis': 'Ny analys',
  'nav.backToDashboard': 'Tillbaka till instrumentpanel',
  'nav.settings': 'Inställningar',
  'nav.export': 'Exportera',
  'nav.presentation': 'Presentation',
  'nav.menu': 'Meny',
  'nav.moreActions': 'Fler åtgärder',

  // Panel titles
  'panel.findings': 'Iakttagelser',
  'panel.dataTable': 'Datatabell',
  'panel.whatIf': 'Tänk om',
  'panel.investigation': 'Utredning',
  'panel.coScout': 'CoScout',
  'panel.drillPath': 'Nedbrytningsväg',

  // View modes
  'view.list': 'Lista',
  'view.board': 'Tavla',
  'view.tree': 'Träd',

  // Action buttons
  'action.save': 'Spara',
  'action.cancel': 'Avbryt',
  'action.delete': 'Radera',
  'action.edit': 'Redigera',
  'action.copy': 'Kopiera',
  'action.close': 'Stäng',
  'action.learnMore': 'Läs mer',
  'action.download': 'Ladda ner',
  'action.apply': 'Tillämpa',
  'action.reset': 'Återställ',
  'action.retry': 'Försök igen',
  'action.send': 'Skicka',
  'action.ask': 'Fråga',
  'action.clear': 'Rensa',
  'action.copyAll': 'Kopiera allt',
  'action.selectAll': 'Markera allt',

  // CoScout
  'coscout.send': 'Skicka',
  'coscout.clear': 'Rensa konversation',
  'coscout.stop': 'Stoppa',
  'coscout.rateLimit': 'Begränsning nådd. Vänta en stund.',
  'coscout.contentFilter': 'Innehåll filtrerat av säkerhetspolicy.',
  'coscout.error': 'Ett fel uppstod. Försök igen.',

  // Display/settings
  'display.preferences': 'Inställningar',
  'display.chartTextSize': 'Diagramtextstorlek',
  'display.compact': 'Kompakt',
  'display.normal': 'Normal',
  'display.large': 'Stor',
  'display.lockYAxis': 'Lås Y-axel',
  'display.filterContext': 'Filterkontext',
  'display.showSpecs': 'Visa specifikationer',

  // Investigation
  'investigation.brief': 'Utredningsrapport',
  'investigation.assignedToMe': 'Tilldelade till mig',
  'investigation.hypothesis': 'Hypotes',
  'investigation.hypotheses': 'Hypoteser',
  'investigation.pinAsFinding': 'Fäst som iakttagelse',
  'investigation.addObservation': 'Lägg till observation',

  // Empty states
  'empty.noData': 'Inga data tillgängliga',
  'empty.noFindings': 'Inga iakttagelser ännu',
  'empty.noResults': 'Inga resultat hittades',

  // Error messages
  'error.generic': 'Något gick fel',
  'error.loadFailed': 'Kunde inte läsa in data',
  'error.parseFailed': 'Kunde inte tolka filen',

  // Settings labels
  'settings.language': 'Språk',
  'settings.theme': 'Tema',
  'settings.textSize': 'Textstorlek',

  // Finding statuses
  'findings.observed': 'Observerad',
  'findings.investigating': 'Utreds',
  'findings.analyzed': 'Analyserad',
  'findings.improving': 'Förbättras',
  'findings.resolved': 'Löst',

  // Report labels
  'report.summary': 'Sammanfattning',
  'report.findings': 'Iakttagelser',
  'report.recommendations': 'Rekommendationer',
  'report.evidence': 'Bevis',

  // Data input labels
  'data.pasteData': 'Klistra in data',
  'data.uploadFile': 'Ladda upp fil',
  'data.columnMapping': 'Kolumnmappning',
  'data.measureColumn': 'Mätkolumn',
  'data.factorColumn': 'Faktorkolumn',
  'data.addData': 'Lägg till data',
  'data.editData': 'Redigera data',
  'data.showDataTable': 'Visa datatabell',
  'data.hideDataTable': 'Dölj datatabell',

  // Status
  'status.cached': 'Cachad',
  'status.loading': 'Laddar',
  'status.ai': 'AI',
};
