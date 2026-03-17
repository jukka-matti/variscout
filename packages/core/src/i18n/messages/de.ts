import type { MessageCatalog } from '../types';

/**
 * German message catalog
 */
export const de: MessageCatalog = {
  // Statistics labels
  'stats.mean': 'Mittelwert',
  'stats.median': 'Median',
  'stats.stdDev': 'Std.Abw.',
  'stats.samples': 'Stichproben',
  'stats.passRate': 'Bestehensrate',
  'stats.range': 'Spannweite',
  'stats.min': 'Min',
  'stats.max': 'Max',
  'stats.target': 'Zielwert',
  'stats.sigma': 'Sigma',

  // Chart labels
  'chart.observation': 'Beobachtung',
  'chart.count': 'Anzahl',
  'chart.frequency': 'Häufigkeit',
  'chart.value': 'Wert',
  'chart.category': 'Kategorie',
  'chart.cumulative': 'Kumulativ %',
  'chart.clickToEdit': 'Klicken zum Bearbeiten',
  'chart.median': 'Median',
  'chart.q1': 'Q1',
  'chart.q3': 'Q3',
  'chart.noChannelData': 'Keine Kanaldaten',
  'chart.selectChannel': 'Kanal auswählen',

  // Limit labels (DIN standard abbreviations)
  'limits.usl': 'OSG',
  'limits.lsl': 'USG',
  'limits.ucl': 'OKG',
  'limits.lcl': 'UKG',
  'limits.mean': 'Mittelwert',
  'limits.target': 'Zielwert',

  // Navigation
  'nav.newAnalysis': 'Neue Analyse',
  'nav.backToDashboard': 'Zurück zum Dashboard',
  'nav.settings': 'Einstellungen',
  'nav.export': 'Exportieren',
  'nav.presentation': 'Präsentation',
  'nav.menu': 'Menü',
  'nav.moreActions': 'Weitere Aktionen',

  // Panel titles
  'panel.findings': 'Befunde',
  'panel.dataTable': 'Datentabelle',
  'panel.whatIf': 'Was wäre wenn',
  'panel.investigation': 'Untersuchung',
  'panel.coScout': 'CoScout',
  'panel.drillPath': 'Drill-Pfad',

  // View modes
  'view.list': 'Liste',
  'view.board': 'Board',
  'view.tree': 'Baum',

  // Action buttons
  'action.save': 'Speichern',
  'action.cancel': 'Abbrechen',
  'action.delete': 'Löschen',
  'action.edit': 'Bearbeiten',
  'action.copy': 'Kopieren',
  'action.close': 'Schließen',
  'action.learnMore': 'Mehr erfahren',
  'action.download': 'Herunterladen',
  'action.apply': 'Anwenden',
  'action.reset': 'Zurücksetzen',
  'action.retry': 'Erneut versuchen',
  'action.send': 'Senden',
  'action.ask': 'Fragen',
  'action.clear': 'Leeren',
  'action.copyAll': 'Alles kopieren',
  'action.selectAll': 'Alles auswählen',

  // CoScout
  'coscout.send': 'Senden',
  'coscout.clear': 'Gespräch leeren',
  'coscout.stop': 'Stopp',
  'coscout.rateLimit': 'Ratenlimit erreicht. Bitte warten.',
  'coscout.contentFilter': 'Inhalt durch Sicherheitsrichtlinie gefiltert.',
  'coscout.error': 'Ein Fehler ist aufgetreten. Bitte erneut versuchen.',

  // Display/settings
  'display.preferences': 'Einstellungen',
  'display.chartTextSize': 'Diagramm-Textgröße',
  'display.compact': 'Kompakt',
  'display.normal': 'Normal',
  'display.large': 'Groß',
  'display.lockYAxis': 'Y-Achse sperren',
  'display.filterContext': 'Filterkontext',
  'display.showSpecs': 'Spezifikationen anzeigen',

  // Investigation
  'investigation.brief': 'Untersuchungsbericht',
  'investigation.assignedToMe': 'Mir zugewiesen',
  'investigation.hypothesis': 'Hypothese',
  'investigation.hypotheses': 'Hypothesen',
  'investigation.pinAsFinding': 'Als Befund anheften',
  'investigation.addObservation': 'Beobachtung hinzufügen',

  // Empty states
  'empty.noData': 'Keine Daten verfügbar',
  'empty.noFindings': 'Noch keine Befunde',
  'empty.noResults': 'Keine Ergebnisse gefunden',

  // Error messages
  'error.generic': 'Etwas ist schiefgelaufen',
  'error.loadFailed': 'Daten konnten nicht geladen werden',
  'error.parseFailed': 'Datei konnte nicht verarbeitet werden',

  // Settings labels
  'settings.language': 'Sprache',
  'settings.theme': 'Design',
  'settings.textSize': 'Textgröße',

  // Finding statuses
  'findings.observed': 'Beobachtet',
  'findings.investigating': 'Wird untersucht',
  'findings.analyzed': 'Analysiert',
  'findings.improving': 'Wird verbessert',
  'findings.resolved': 'Gelöst',

  // Report labels
  'report.summary': 'Zusammenfassung',
  'report.findings': 'Befunde',
  'report.recommendations': 'Empfehlungen',
  'report.evidence': 'Nachweis',

  // Data input labels
  'data.pasteData': 'Daten einfügen',
  'data.uploadFile': 'Datei hochladen',
  'data.columnMapping': 'Spaltenzuordnung',
  'data.measureColumn': 'Messspalte',
  'data.factorColumn': 'Faktorspalte',
  'data.addData': 'Daten hinzufügen',
  'data.editData': 'Daten bearbeiten',
  'data.showDataTable': 'Datentabelle anzeigen',
  'data.hideDataTable': 'Datentabelle ausblenden',

  // Status
  'status.cached': 'Zwischengespeichert',
  'status.loading': 'Wird geladen',
  'status.ai': 'KI',
};
