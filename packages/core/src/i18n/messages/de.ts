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

  // Limit labels
  'limits.usl': 'OSG',
  'limits.lsl': 'USG',
  'limits.ucl': 'OKG',
  'limits.lcl': 'UKG',
  'limits.mean': 'Mittelwert',
  'limits.target': 'Zielwert',

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
};
