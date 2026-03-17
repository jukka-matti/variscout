import type { MessageCatalog } from '../types';

/**
 * Dutch message catalog
 */
export const nl: MessageCatalog = {
  // Statistics labels
  'stats.mean': 'Gemiddelde',
  'stats.median': 'Mediaan',
  'stats.stdDev': 'Std. afw.',
  'stats.samples': 'Steekproeven',
  'stats.passRate': 'Slagingspercentage',
  'stats.range': 'Bereik',
  'stats.min': 'Min',
  'stats.max': 'Max',
  'stats.target': 'Doel',
  'stats.sigma': 'Sigma',

  // Chart labels
  'chart.observation': 'Waarneming',
  'chart.count': 'Aantal',
  'chart.frequency': 'Frequentie',
  'chart.value': 'Waarde',
  'chart.category': 'Categorie',
  'chart.cumulative': 'Cumulatief %',
  'chart.clickToEdit': 'Klik om te bewerken',
  'chart.median': 'Mediaan',
  'chart.q1': 'Q1',
  'chart.q3': 'Q3',
  'chart.noChannelData': 'Geen kanaalgegevens',
  'chart.selectChannel': 'Selecteer kanaal',

  // Limit labels (NEN standards — uses ISO abbreviations)
  'limits.usl': 'USL',
  'limits.lsl': 'LSL',
  'limits.ucl': 'UCL',
  'limits.lcl': 'LCL',
  'limits.mean': 'Gemiddelde',
  'limits.target': 'Doel',

  // Navigation
  'nav.newAnalysis': 'Nieuwe analyse',
  'nav.backToDashboard': 'Terug naar dashboard',
  'nav.settings': 'Instellingen',
  'nav.export': 'Exporteren',
  'nav.presentation': 'Presentatie',
  'nav.menu': 'Menu',
  'nav.moreActions': 'Meer acties',

  // Panel titles
  'panel.findings': 'Bevindingen',
  'panel.dataTable': 'Gegevenstabel',
  'panel.whatIf': 'Wat als',
  'panel.investigation': 'Onderzoek',
  'panel.coScout': 'CoScout',
  'panel.drillPath': 'Detailpad',

  // View modes
  'view.list': 'Lijst',
  'view.board': 'Bord',
  'view.tree': 'Boom',

  // Action buttons
  'action.save': 'Opslaan',
  'action.cancel': 'Annuleren',
  'action.delete': 'Verwijderen',
  'action.edit': 'Bewerken',
  'action.copy': 'Kopiëren',
  'action.close': 'Sluiten',
  'action.learnMore': 'Meer informatie',
  'action.download': 'Downloaden',
  'action.apply': 'Toepassen',
  'action.reset': 'Herstellen',
  'action.retry': 'Opnieuw proberen',
  'action.send': 'Verzenden',
  'action.ask': 'Vraag',
  'action.clear': 'Wissen',
  'action.copyAll': 'Alles kopiëren',
  'action.selectAll': 'Alles selecteren',

  // CoScout
  'coscout.send': 'Verzenden',
  'coscout.clear': 'Gesprek wissen',
  'coscout.stop': 'Stoppen',
  'coscout.rateLimit': 'Limiet bereikt. Even geduld.',
  'coscout.contentFilter': 'Inhoud gefilterd door veiligheidsbeleid.',
  'coscout.error': 'Er is een fout opgetreden. Probeer het opnieuw.',

  // Display/settings
  'display.preferences': 'Voorkeuren',
  'display.chartTextSize': 'Tekst grafiek',
  'display.compact': 'Compact',
  'display.normal': 'Normaal',
  'display.large': 'Groot',
  'display.lockYAxis': 'Y-as vergrendelen',
  'display.filterContext': 'Filtercontext',
  'display.showSpecs': 'Specificaties tonen',

  // Investigation
  'investigation.brief': 'Onderzoeksoverzicht',
  'investigation.assignedToMe': 'Aan mij toegewezen',
  'investigation.hypothesis': 'Hypothese',
  'investigation.hypotheses': 'Hypothesen',
  'investigation.pinAsFinding': 'Vastpinnen als bevinding',
  'investigation.addObservation': 'Waarneming toevoegen',

  // Empty states
  'empty.noData': 'Geen gegevens beschikbaar',
  'empty.noFindings': 'Nog geen bevindingen',
  'empty.noResults': 'Geen resultaten gevonden',

  // Error messages
  'error.generic': 'Er ging iets mis',
  'error.loadFailed': 'Laden van gegevens mislukt',
  'error.parseFailed': 'Bestand verwerken mislukt',

  // Settings labels
  'settings.language': 'Taal',
  'settings.theme': 'Thema',
  'settings.textSize': 'Tekstgrootte',

  // Finding statuses
  'findings.observed': 'Waargenomen',
  'findings.investigating': 'In onderzoek',
  'findings.analyzed': 'Geanalyseerd',
  'findings.improving': 'In verbetering',
  'findings.resolved': 'Opgelost',

  // Report labels
  'report.summary': 'Samenvatting',
  'report.findings': 'Bevindingen',
  'report.recommendations': 'Aanbevelingen',
  'report.evidence': 'Bewijs',

  // Data input labels
  'data.pasteData': 'Gegevens plakken',
  'data.uploadFile': 'Bestand uploaden',
  'data.columnMapping': 'Kolomtoewijzing',
  'data.measureColumn': 'Meetkolom',
  'data.factorColumn': 'Factorkolom',
  'data.addData': 'Gegevens toevoegen',
  'data.editData': 'Gegevens bewerken',
  'data.showDataTable': 'Gegevenstabel tonen',
  'data.hideDataTable': 'Gegevenstabel verbergen',

  // Status
  'status.cached': 'In cache',
  'status.loading': 'Laden',
  'status.ai': 'AI',
};
