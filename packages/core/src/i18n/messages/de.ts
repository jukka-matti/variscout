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

  // Methodology Coach
  'coach.frame': 'Rahmen',
  'coach.scout': 'Erkunden',
  'coach.investigate': 'Untersuchen',
  'coach.improve': 'Verbessern',
  'coach.frameDesc': 'Problem definieren und Grenzen setzen',
  'coach.scoutDesc': 'Daten sammeln und Muster erkunden',
  'coach.investigateDesc': 'Hypothesen testen und Ursachen finden',
  'coach.improveDesc': 'Änderungen umsetzen und Ergebnisse überprüfen',

  // Report KPIs
  'report.kpi.samples': 'Stichproben',
  'report.kpi.mean': 'Mittelwert',
  'report.kpi.variation': 'Streuung',
  'report.kpi.cpk': 'Cpk',
  'report.kpi.passRate': 'Bestehensrate',

  // AI Actions
  'ai.propose': 'Vorschlagen',
  'ai.applied': 'Angewendet',
  'ai.dismissed': 'Verworfen',
  'ai.expired': 'Abgelaufen',

  // Staged analysis
  'staged.before': 'Vorher',
  'staged.after': 'Nachher',
  'staged.comparison': 'Vergleich',

  // Data input / Column mapping
  'data.mapHeading': 'Daten zuordnen',
  'data.confirmColumns': 'Spalten bestätigen',
  'data.selectOutcome': 'Zielgröße auswählen',
  'data.selectFactors': 'Faktoren auswählen',
  'data.analysisSection': 'Analysebeschreibung',
  'data.optional': 'optional',
  'data.problemPlaceholder': 'Beschreiben Sie das Problem, das Sie untersuchen…',
  'data.outcomeDesc': 'Die Messgröße, die Sie analysieren möchten',
  'data.factorsDesc': 'Kategorien, die das Ergebnis beeinflussen könnten',
  'data.alreadyOutcome': 'Bereits als Zielgröße ausgewählt',
  'data.showNumericOnly': 'Nur numerisch',
  'data.showCategoricalOnly': 'Nur kategorisch',
  'data.showAllColumns': 'Alle Spalten',
  'data.improvementTarget': 'Verbesserungsziel',
  'data.metric': 'Kennzahl',
  'data.startAnalysis': 'Analyse starten',
  'data.applyChanges': 'Änderungen übernehmen',
  'data.addHypothesis': 'Hypothese hinzufügen',
  'data.removeHypothesis': 'Hypothese entfernen',
  'data.back': 'Zurück',

  // Paste screen
  'data.pasteInstructions': 'Daten hier einfügen',
  'data.pasteSubtitle': 'Aus Excel, CSV oder einer Tabellenkalkulation kopieren',
  'data.useExample': 'Beispieldaten verwenden',
  'data.analyzing': 'Wird analysiert…',
  'data.tipWithData': 'Tipp: Spaltenüberschriften in die erste Zeile einfügen',
  'data.tipNoData':
    'Tipp: Versuchen Sie, Daten aus einer Tabellenkalkulation oder CSV-Datei einzufügen',

  // Data quality
  'quality.allValid': 'Alle Daten gültig',
  'quality.rowsReady': '{count} Zeilen bereit zur Analyse',
  'quality.rowsExcluded': '{count} Zeilen ausgeschlossen',
  'quality.missingValues': 'Fehlende Werte',
  'quality.nonNumeric': 'Nicht-numerische Werte',
  'quality.noVariation': 'Keine Streuung',
  'quality.emptyColumn': 'Leere Spalte',
  'quality.noVariationWarning': 'Diese Spalte hat keine Streuung — alle Werte sind identisch',
  'quality.viewExcluded': 'Ausgeschlossene anzeigen',
  'quality.viewAll': 'Alle anzeigen',

  // Manual entry
  'manual.setupTitle': 'Manuelle Dateneingabe',
  'manual.analysisMode': 'Analysemodus',
  'manual.standard': 'Standard',
  'manual.standardDesc': 'Einzelne Messspalte mit optionalen Faktoren',
  'manual.performance': 'Performance',
  'manual.performanceDesc': 'Mehrere Messkanäle (Fülldüsen, Kavitäten)',
  'manual.outcome': 'Zielgröße',
  'manual.outcomeExample': 'z. B. Gewicht, Länge, Temperatur',
  'manual.factors': 'Faktoren',
  'manual.addFactor': 'Faktor hinzufügen',
  'manual.measureLabel': 'Messbezeichnung',
  'manual.measureExample': 'z. B. Fülldüse, Kavität, Düse',
  'manual.channelCount': 'Anzahl der Kanäle',
  'manual.channelRange': '{min}–{max} Kanäle',
  'manual.startEntry': 'Eingabe starten',
  'manual.specs': 'Spezifikationen',
  'manual.specsApplyAll': 'Auf alle Kanäle anwenden',
  'manual.specsHelper': 'Spezifikationsgrenzen für die Zielgröße festlegen',

  // Chart legend
  'chart.legend.commonCause': 'Zufällige Ursache',
  'chart.legend.specialCause': 'Besondere Ursache',
  'chart.legend.outOfSpec': 'Außerhalb Spezifikation',
  'chart.legend.inControl': 'Unter Kontrolle',
  'chart.legend.randomVariation': 'Zufällige Streuung',
  'chart.legend.defect': 'Kundenreklamation',

  // Chart violations
  'chart.violation.aboveUsl': 'Über OSG ({value})',
  'chart.violation.belowLsl': 'Unter USG ({value})',
  'chart.violation.aboveUcl': 'Über OKG — besondere Ursache',
  'chart.violation.belowLcl': 'Unter UKG — besondere Ursache',
  'chart.violation.aboveUclFavorable': 'Über OKG — günstige Verschiebung',
  'chart.violation.belowLclFavorable': 'Unter UKG — günstige Verschiebung',
  'chart.violation.nelson2': 'Nelson-Regel 2 — Lauf von {count}',
  'chart.violation.nelson3': 'Nelson-Regel 3 — Trend von {count}',

  // Investigation sidebar
  'investigation.phaseInitial': 'Erste Beobachtungen sammeln',
  'investigation.phaseDiverging': 'Mehrere Hypothesen erkunden',
  'investigation.phaseValidating': 'Hypothesen testen und validieren',
  'investigation.phaseConverging': 'Ursache eingrenzen',
  'investigation.phaseImproving': 'Änderungen umsetzen und verifizieren',
  'investigation.pdcaTitle': 'Verifizierungs-Checkliste',
  'investigation.verifyChart': 'I-Chart stabil nach Änderung',
  'investigation.verifyStats': 'Cpk erfüllt Zielwert',
  'investigation.verifyBoxplot': 'Boxplot-Streuung reduziert',
  'investigation.verifySideEffects': 'Keine Nebeneffekte beobachtet',
  'investigation.verifyOutcome': 'Ergebnis über Zeit nachhaltig',
  'investigation.uninvestigated': 'Nicht untersuchte Faktoren',

  // Coach mobile phase titles
  'coach.frameTitle': 'Problem eingrenzen',
  'coach.scoutTitle': 'Daten erkunden',
  'coach.investigateTitle': 'Ursachen untersuchen',
  'coach.improveTitle': 'Prozess verbessern',

  // AI action tool labels
  'ai.tool.applyFilter': 'Filter anwenden',
  'ai.tool.clearFilters': 'Filter zurücksetzen',
  'ai.tool.switchFactor': 'Faktor wechseln',
  'ai.tool.createFinding': 'Befund erstellen',
  'ai.tool.createHypothesis': 'Hypothese erstellen',
  'ai.tool.suggestAction': 'Maßnahme vorschlagen',
  'ai.tool.shareFinding': 'Befund teilen',
  'ai.tool.publishReport': 'Bericht veröffentlichen',
  'ai.tool.notifyOwners': 'Verantwortliche benachrichtigen',

  // Report
  'report.kpi.inSpec': 'Innerhalb Spezifikation',

  // Table
  'table.noData': 'Keine Daten vorhanden',
  'table.page': 'Seite {page} von {total}',
  'table.rowsPerPage': 'Zeilen pro Seite',
  'table.editHint': 'Klicken Sie auf eine Zelle zum Bearbeiten',
  'table.excluded': 'Ausgeschlossen',
  'table.deleteRow': 'Zeile löschen',
  'table.addRow': 'Zeile hinzufügen',
  'table.unsavedChanges': 'Nicht gespeicherte Änderungen',

  // Specs
  'specs.title': 'Spezifikationsgrenzen',
  'specs.advancedSettings': 'Erweiterte Einstellungen',
  'specs.apply': 'Spezifikationen übernehmen',
  'specs.noChanges': 'Keine Änderungen zu übernehmen',
  'specs.editTitle': 'Spezifikationen bearbeiten',
  'specs.lslLabel': 'Untere Spezifikationsgrenze (USG)',
  'specs.uslLabel': 'Obere Spezifikationsgrenze (OSG)',

  // Upgrade
  'upgrade.title': 'Upgrade verfügbar',
  'upgrade.limitReached': 'Sie haben das Limit für diese Funktion erreicht',
  'upgrade.upgrade': 'Upgrade',
  'upgrade.viewOptions': 'Optionen anzeigen',
  'upgrade.featureLimit': '{feature} ist in diesem Plan auf {limit} begrenzt',

  // Display toggles
  'display.violin': 'Violindiagramm',
  'display.violinDesc': 'Verteilungsform anzeigen',
  'display.contribution': 'Beitrag',
  'display.contributionDesc': 'Streuungsbeitrag anzeigen',
  'display.sort': 'Sortieren',
  'display.ascending': 'Aufsteigend',
  'display.descending': 'Absteigend',

  // Stats panel
  'stats.summary': 'Zusammenfassende Statistik',
  'stats.histogram': 'Histogramm',
  'stats.probPlot': 'Wahrscheinlichkeitsdiagramm',
  'stats.editSpecs': 'Spezifikationen bearbeiten',

  // WhatIf
  'whatif.adjustMean': 'Mittelwert anpassen',
  'whatif.reduceVariation': 'Streuung reduzieren',
  'whatif.currentProjected': 'Aktuell vs. Prognose',
  'whatif.resetAdjustments': 'Anpassungen zurücksetzen',
  'whatif.yield': 'Prognostizierte Ausbeute',

  // Parameterized messages
  'data.rowsLoaded': '{count} Zeilen geladen',
  'findings.countLabel': '{count} Befunde',
};
