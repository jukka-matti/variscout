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
  'display.density': 'Anzeigedichte',
  'display.lockYAxis': 'Y-Achse sperren',
  'display.filterContext': 'Filterkontext',
  'display.showSpecs': 'Spezifikationen anzeigen',

  // Investigation
  'investigation.brief': 'Untersuchungsbericht',
  'investigation.assignedToMe': 'Mir zugewiesen',
  'investigation.question': 'Question',
  'investigation.questions': 'Questions',
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
  'data.issueStatementPlaceholder': 'Beschreiben Sie, was Sie untersuchen möchten…',
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
  'data.addQuestion': 'Hypothese hinzufügen',
  'data.removeQuestion': 'Hypothese entfernen',
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

  // AI action tool labels
  'ai.tool.applyFilter': 'Filter anwenden',
  'ai.tool.clearFilters': 'Filter zurücksetzen',
  'ai.tool.switchFactor': 'Faktor wechseln',
  'ai.tool.createFinding': 'Befund erstellen',
  'ai.tool.createQuestion': 'Hypothese erstellen',
  'ai.tool.suggestAction': 'Maßnahme vorschlagen',
  'ai.tool.shareFinding': 'Befund teilen',
  'ai.tool.publishReport': 'Bericht veröffentlichen',
  'ai.tool.notifyOwners': 'Verantwortliche benachrichtigen',
  'ai.tool.suggestIdea': 'Verbesserungsidee vorschlagen',
  'ai.tool.sparkBrainstorm': 'Spark brainstorm ideas',
  'ai.tool.suggestSaveFinding': 'Erkenntnis speichern',
  'ai.tool.navigateTo': 'Navigate to',
  'ai.tool.answerQuestion': 'Answer question',
  'ai.tool.suggestSuspectedCause': 'Suggest suspected cause',
  'ai.tool.connectHubEvidence': 'Connect hub evidence',
  'ai.tool.suggestCausalLink': 'Suggest causal link',
  'ai.tool.highlightMapPattern': 'Highlight map pattern',

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
  'table.showAll': 'Alle anzeigen',

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
  'display.etaSquared': 'η²',
  'display.etaSquaredDesc': 'η² (Effektgröße) anzeigen',
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

  // Chart violation details (parameterized)
  'chart.violation.nelson2.detail':
    'Nelson-Regel 2 — Lauf von {count} {side} Mittelwert (#{start}–{end})',
  'chart.violation.nelson3.detail':
    'Nelson-Regel 3 — Trend von {count} {direction} (#{start}–{end})',
  'chart.violation.side.above': 'über',
  'chart.violation.side.below': 'unter',
  'chart.violation.direction.increasing': 'steigend',
  'chart.violation.direction.decreasing': 'fallend',

  // Parameterized messages
  'data.rowsLoaded': '{count} Zeilen geladen',
  'findings.countLabel': '{count} Befunde',

  // Chart limit labels (DIN standard)
  'chart.label.ucl': 'OKG:',
  'chart.label.lcl': 'UKG:',
  'chart.label.mean': 'Mittelwert:',
  'chart.label.tgt': 'Ziel:',
  'chart.label.usl': 'OSG:',
  'chart.label.lsl': 'USG:',
  'chart.label.value': 'Wert:',
  'chart.label.n': 'n:',
  'chart.label.target': 'Zielwert:',

  // Chart status
  'chart.status.inControl': 'Unter Kontrolle',
  'chart.status.outOfControl': 'Außer Kontrolle (jenseits OKG/UKG)',
  'chart.noDataProbPlot': 'Keine Daten für Wahrscheinlichkeitsdiagramm verfügbar',

  // Chart edit affordances
  'chart.edit.spec': 'Klicken zum Bearbeiten von {spec}',
  'chart.edit.axisLabel': 'Klicken zum Bearbeiten der Achsenbeschriftung',
  'chart.edit.yAxis': 'Klicken zum Bearbeiten der Y-Achsen-Skalierung',
  'chart.edit.saveCancel': 'Enter zum Speichern · Esc zum Abbrechen',

  // Performance table headers
  'chart.table.channel': 'Kanal',
  'stats.cp': 'Cp',

  // Chart UI labels
  'chart.copyToClipboard': 'Diagramm in Zwischenablage kopieren',
  'chart.maximize': 'Diagramm maximieren',
  'chart.type.ichart': 'I-Chart',
  'chart.type.boxplot': 'Boxplot',
  'chart.type.pareto': 'Pareto',
  'chart.drillHere': '↓ hier aufschlüsseln',
  'chart.percent': 'Prozent',

  // Y-axis popover
  'chart.yAxisScale': 'Y-Achsen-Skalierung',
  'validation.minLessThanMax': 'Min muss kleiner als Max sein',
  'action.noChanges': 'Keine Änderungen',

  // Create factor modal
  'factor.create': 'Faktor aus Auswahl erstellen',
  'factor.name': 'Faktorname',
  'factor.nameEmpty': 'Faktorname darf nicht leer sein',
  'factor.nameExists': 'Ein Faktor mit diesem Namen existiert bereits',
  'factor.example': 'z.\u00A0B. Hochtemperaturereignisse',
  'factor.pointsMarked': '{count} Punkte werden markiert als:',
  'factor.createAndFilter': 'Erstellen & Filtern',
  'factor.filterExplanation': 'Die Ansicht filtert automatisch auf die ausgewählten Punkte.',

  // Characteristic type selector
  'charType.nominal': 'Nominal',
  'charType.nominalDesc': 'Zielwert-zentriert (z.\u00A0B. Füllgewicht)',
  'charType.smaller': 'Kleiner ist besser',
  'charType.smallerDesc': 'Niedriger ist besser (z.\u00A0B. Fehler)',
  'charType.larger': 'Größer ist besser',
  'charType.largerDesc': 'Höher ist besser (z.\u00A0B. Ausbeute)',

  // Investigation prompt
  'investigation.trackingPrompt':
    'Ihre Untersuchung wird verfolgt — öffnen Sie das Untersuchungspanel für den Gesamtüberblick.',

  // Mobile category sheet
  'chart.highlight': 'Hervorheben:',
  'chart.highlightRed': 'Rot',
  'chart.highlightAmber': 'Gelb',
  'chart.highlightGreen': 'Grün',
  'chart.clearHighlight': 'Hervorhebung entfernen',
  'chart.drillDown': 'In „{category}" aufschlüsseln',
  'ai.askCoScout': 'CoScout dazu befragen',

  // Settings descriptions
  'display.lockYAxisDesc': 'Behält die Skalierung für visuellen Vergleich bei',
  'display.filterContextDesc': 'Aktive Filterzusammenfassung unter Diagrammüberschriften anzeigen',

  // Performance detected modal
  'performance.detected': 'Performance-Modus erkannt',
  'performance.columnsFound': '{count} Messspalten gefunden',
  'performance.labelQuestion': 'Was stellen diese Messkanäle dar?',
  'performance.labelExample': 'z.\u00A0B. Füllkopf, Kavität, Düse',
  'performance.enable': 'Performance-Modus aktivieren',

  // Finding editor & data types
  'finding.placeholder': 'Was haben Sie festgestellt?',
  'finding.note': 'Befundnotiz',
  'data.typeNumeric': 'Numerisch',
  'data.typeCategorical': 'Kategorial',
  'data.typeDate': 'Datum',
  'data.typeText': 'Text',
  'data.categories': 'Kategorien',

  // PWA HomeScreen
  'home.heading': 'Variationsanalyse erkunden',
  'home.description':
    'Kostenloses Schulungstool für Variationsanalyse. Variabilität visualisieren, Fähigkeit berechnen und Schwerpunkte finden — direkt im Browser.',
  'home.divider': 'oder eigene Daten verwenden',
  'home.pasteHelper': 'Zeilen kopieren und einfügen — Spalten werden automatisch erkannt',
  'home.manualEntry': 'Oder Daten manuell eingeben',
  'home.upgradeHint': 'Teamfunktionen, Datei-Upload oder gespeicherte Projekte benötigt?',

  // PWA navigation
  'nav.presentationMode': 'Präsentationsmodus',
  'nav.hideFindings': 'Befunde ausblenden',

  // Export
  'export.asImage': 'Als Bild exportieren',
  'export.asCsv': 'Als CSV exportieren',
  'export.imageDesc': 'PNG-Screenshot für Präsentationen',
  'export.csvDesc': 'Tabellenkalkulationskompatible Datendatei',

  // Sample section
  'sample.heading': 'Einen Beispiel-Datensatz ausprobieren',
  'sample.allSamples': 'Alle Beispiel-Datensätze',
  'sample.featured': 'Empfohlen',
  'sample.caseStudies': 'Fallstudien',
  'sample.journeys': 'Lernreisen',
  'sample.industry': 'Branchenbeispiele',

  // View modes
  'view.stats': 'Statistiken',
  'display.appearance': 'Erscheinungsbild',

  // Azure toolbar
  'data.manualEntry': 'Manuelle Eingabe',
  'data.editTable': 'Datentabelle bearbeiten',
  'toolbar.saveAs': 'Speichern unter…',
  'toolbar.saving': 'Speichert…',
  'toolbar.saved': 'Gespeichert',
  'toolbar.saveFailed': 'Speichern fehlgeschlagen',
  'toolbar.addMore': 'Daten hinzufügen',
  'report.scouting': 'Scouting-Bericht',
  'export.csvFiltered': 'Gefilterte Daten als CSV exportieren',
  'error.auth': 'Authentifizierungsfehler',

  // File browse
  'file.browseLocal': 'Dieses Gerät durchsuchen',
  'file.browseSharePoint': 'SharePoint durchsuchen',
  'file.open': 'Datei öffnen',

  // Admin hub
  'admin.title': 'Admin',
  'admin.status': 'Status',
  'admin.plan': 'Plan & Funktionen',
  'admin.teams': 'Teams-Einrichtung',
  'admin.knowledge': 'Wissensdatenbank',
  'admin.troubleshooting': 'Fehlerbehebung',

  // Admin plan tab
  'admin.currentPlan': 'Aktuell',
  'admin.feature': 'Funktion',
  'admin.manageSubscription': 'Abonnement in Azure verwalten',
  'admin.planStandard': 'Standard',
  'admin.planTeam': 'Team',
  'admin.planStandardPrice': '€79/Mo.',
  'admin.planTeamPrice': '€199/Mo.',
  'admin.planStandardDesc': 'Vollständige Analyse mit CoScout AI',
  'admin.planTeamDesc': 'Teams, OneDrive, SharePoint, Wissensdatenbank',

  // Feature names
  'feature.charts': 'I-Chart, Boxplot, Pareto, Statistiken',
  'feature.capability': 'Fähigkeitsanalyse (Cp/Cpk)',
  'feature.performance': 'Performance-Modus (Mehrkanal)',
  'feature.anova': 'ANOVA & Faktorenanalyse',
  'feature.findingsWorkflow': 'Befunde & Untersuchungsworkflow',
  'feature.whatIf': 'Was-wäre-wenn-Simulation',
  'feature.csvImport': 'CSV/Excel-Import',
  'feature.reportExport': 'Berichtexport (PDF)',
  'feature.indexedDb': 'IndexedDB lokale Speicherung',
  'feature.maxFactors': 'Bis zu 6 Faktoren',
  'feature.maxRows': 'Bis zu 250K Zeilen',
  'feature.onedriveSync': 'OneDrive-Projektsynchronisierung',
  'feature.sharepointPicker': 'SharePoint-Dateiauswahl',
  'feature.teamsIntegration': 'Microsoft Teams-Integration',
  'feature.channelCollab': 'Kanalbasierte Zusammenarbeit',
  'feature.mobileUi': 'Mobiloptimierte Benutzeroberfläche',
  'feature.coScoutAi': 'CoScout AI-Assistent',
  'feature.narrativeBar': 'NarrativeBar-Einblicke',
  'feature.chartInsights': 'Diagramm-Insight-Chips',
  'feature.knowledgeBase': 'Wissensdatenbank (SharePoint-Suche)',
  'feature.aiActions': 'KI-vorgeschlagene Maßnahmen',

  // Admin Teams setup
  'admin.teams.heading': 'VariScout zu Microsoft Teams hinzufügen',
  'admin.teams.description':
    'Erstellen Sie ein Teams-App-Paket für Ihre Bereitstellung und laden Sie es in Ihr Teams Admin Center hoch.',
  'admin.teams.running': 'Läuft innerhalb von Microsoft Teams',
  'admin.teams.step1': 'App-Registrierung Client-ID (Optional)',
  'admin.teams.step1Desc':
    'Geben Sie Ihre Azure AD App-Registrierungs-Client-ID ein, um Teams-SSO im Manifest zu aktivieren.',
  'admin.teams.step2': 'Teams-App-Paket herunterladen',
  'admin.teams.step2Desc':
    'Diese .zip enthält das Manifest und Icons, vorkonfiguriert für Ihre Bereitstellung.',
  'admin.teams.step3': 'In Teams Admin Center hochladen',
  'admin.teams.step4': 'VariScout zu einem Kanal hinzufügen',
  'admin.teams.download': 'Teams-App-Paket herunterladen',

  // Admin status tab
  'admin.checksResult': '{pass}/{total} Prüfungen bestanden',
  'admin.runChecks': 'Alle Prüfungen ausführen',
  'admin.notApplicable': 'Nicht zutreffend für Ihren Plan',
  'admin.managePortal': 'Im Azure Portal verwalten',
  'admin.portalAccessNote':
    'Diese Elemente erfordern Zugriff auf das Azure Portal und können nicht vom Browser aus geprüft werden.',
  'admin.fixInPortal': 'Im Azure Portal beheben: {label}',

  // Admin troubleshoot tab
  'admin.troubleshoot.intro':
    'Häufige Probleme und deren Lösung. Klicken Sie auf ein Problem für schrittweise Anweisungen.',
  'admin.runCheck': 'Prüfung ausführen',
  'admin.checkPassed': 'Prüfung bestanden — dies ist möglicherweise nicht das Problem.',
  'admin.checkFailed': 'Prüfung fehlgeschlagen — folgen Sie den Schritten unten.',
  'admin.issue.signin': 'Benutzer können sich nicht anmelden',
  'admin.issue.signinDesc':
    'Azure AD-Authentifizierung funktioniert nicht oder Benutzer sehen eine leere Seite.',
  'admin.issue.signinSteps':
    'Überprüfen Sie, ob App Service Authentication im Azure Portal aktiviert ist.\nPrüfen Sie, ob die Azure AD App-Registrierung die korrekten Umleitungs-URIs hat.\nStellen Sie sicher, dass bei der App-Registrierung unter Authentifizierung „ID-Token" aktiviert ist.\nÜberprüfen Sie, ob der Mandant die Benutzeranmeldung bei der App erlaubt (Unternehmensanwendungen → Eigenschaften → Für Benutzer zur Anmeldung aktiviert).',
  'admin.issue.onedrive': 'OneDrive-Synchronisierung funktioniert nicht',
  'admin.issue.onedriveDesc':
    'Projekte werden nicht mit OneDrive synchronisiert oder Benutzer sehen Berechtigungsfehler.',
  'admin.issue.onedriveSteps':
    'Überprüfen Sie, ob die App-Registrierung die delegierte Berechtigung „Files.ReadWrite" hat.\nPrüfen Sie, ob die Admin-Zustimmung für die Graph-Berechtigungen erteilt wurde.\nStellen Sie sicher, dass dem Benutzer eine OneDrive-Lizenz zugewiesen ist.\nVersuchen Sie, sich ab- und wieder anzumelden, um das Token zu aktualisieren.',
  'admin.issue.coscout': 'CoScout antwortet nicht',
  'admin.issue.coscoutDesc': 'Der KI-Assistent generiert keine Antworten oder zeigt Fehler an.',
  'admin.issue.coscoutSteps':
    'Überprüfen Sie, ob der KI-Endpunkt in der ARM-Vorlage / den App-Service-Einstellungen konfiguriert ist.\nPrüfen Sie, ob die Azure AI Services-Ressource bereitgestellt ist und läuft.\nÜberprüfen Sie, ob die Modellbereitstellung existiert (z.\u00A0B. gpt-4o) in der AI Services-Ressource.\nPrüfen Sie Azure AI Services-Kontingente — die Bereitstellung hat möglicherweise Ratenlimits erreicht.',
  'admin.issue.kbEmpty': 'Wissensdatenbank liefert keine Ergebnisse',
  'admin.issue.kbEmptyDesc':
    'CoScouts „Wissensdatenbank durchsuchen" findet nichts, obwohl Dokumente vorhanden sind.',
  'admin.issue.kbEmptySteps':
    'Überprüfen Sie, ob der AI Search-Endpunkt in den App-Service-Einstellungen konfiguriert ist.\nPrüfen Sie, ob die Remote-SharePoint-Wissensquelle in AI Search erstellt wurde.\nStellen Sie sicher, dass ≥1 Microsoft 365 Copilot-Lizenz im Mandanten aktiv ist.\nÜberprüfen Sie, ob der Benutzer SharePoint-Zugriff auf die durchsuchten Dokumente hat.\nPrüfen Sie, ob der Wissensdatenbank-Vorschau-Schalter aktiviert ist (Admin → Wissensdatenbank-Tab).',
  'admin.issue.teamsTab': 'Teams-Tab wird nicht angezeigt',
  'admin.issue.teamsTabDesc': 'VariScout erscheint nicht in Teams oder der Tab wird nicht geladen.',
  'admin.issue.teamsTabSteps':
    'Überprüfen Sie, ob das Teams-App-Paket (.zip) in das Teams Admin Center hochgeladen wurde.\nPrüfen Sie, ob die contentUrl im manifest.json mit Ihrer App-Service-URL übereinstimmt.\nStellen Sie sicher, dass die App im Teams Admin Center genehmigt ist (nicht durch Richtlinie blockiert).\nVersuchen Sie, den Tab im Kanal zu entfernen und neu hinzuzufügen.\nWenn Sie eine benutzerdefinierte Domäne verwenden, überprüfen Sie, ob sie im validDomains-Array des Manifests steht.',
  'admin.issue.newUser': 'Neuer Benutzer kann nicht auf die App zugreifen',
  'admin.issue.newUserDesc':
    'Ein neu hinzugefügter Benutzer sieht eine Zugriffsverweigerung oder eine leere Seite.',
  'admin.issue.newUserSteps':
    'Gehen Sie in Azure AD zu Unternehmensanwendungen → VariScout → Benutzer und Gruppen.\nFügen Sie den Benutzer oder seine Sicherheitsgruppe zur App hinzu.\nWenn „Benutzerzuweisung erforderlich" aktiviert ist, stellen Sie sicher, dass der Benutzer eine Zuweisung hat.\nPrüfen Sie Richtlinien für bedingten Zugriff, die den Benutzer blockieren könnten.',
  'admin.issue.aiSlow': 'KI-Antworten sind langsam',
  'admin.issue.aiSlowDesc':
    'CoScout braucht lange zum Antworten oder hat häufig Zeitüberschreitungen.',
  'admin.issue.aiSlowSteps':
    'Prüfen Sie die Azure AI Services-Bereitstellungsregion — Latenz steigt mit der Entfernung.\nÜberprüfen Sie, ob die Modellbereitstellung ausreichend TPM-Kontingent (Token pro Minute) hat.\nErwägen Sie ein Upgrade auf eine bereitgestellte Durchsatz-Bereitstellung für konsistente Latenz.\nPrüfen Sie, ob der AI Search-Index groß ist — erwägen Sie eine Optimierung der Wissensquelle.',
  'admin.issue.forbidden': '„Forbidden"-Fehler',
  'admin.issue.forbiddenDesc': 'Benutzer sehen 403-Fehler beim Zugriff auf bestimmte Funktionen.',
  'admin.issue.forbiddenSteps':
    'Prüfen Sie, ob alle erforderlichen Graph API-Berechtigungen Admin-Zustimmung haben.\nÜberprüfen Sie, ob der App Service Authentication Token Store aktiviert ist.\nStellen Sie sicher, dass das Token des Benutzers nicht abgelaufen ist — versuchen Sie, sich ab- und wieder anzumelden.\nPrüfen Sie Richtlinien für bedingten Zugriff des Mandanten.',
  'admin.issue.kbPartial': 'KB schlägt bei einigen Benutzern fehl',
  'admin.issue.kbPartialDesc':
    'Wissensdatenbank-Suche funktioniert für Admins, aber nicht für andere Benutzer.',
  'admin.issue.kbPartialSteps':
    'Remote-SharePoint-Wissensquellen verwenden benutzerspezifische Berechtigungen. Jeder Benutzer muss SharePoint-Zugriff auf die Dokumente haben.\nPrüfen Sie, ob die betroffenen Benutzer durch Richtlinien für bedingten Zugriff blockiert werden.\nÜberprüfen Sie, ob die Admin-Zustimmung für die delegierte Berechtigung Sites.Read.All erteilt wurde.\nBitten Sie die betroffenen Benutzer, sich ab- und wieder anzumelden, um ihr Token zu aktualisieren.',

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
  'improve.emptyNoFindings':
    'Pin findings from the Analysis view, then brainstorm improvement ideas here.',
  'improve.emptyNoSupported':
    'Answer your questions in the investigation. Answered questions unlock improvement brainstorming.',
  'improve.selectedCount': '{count} selected',
  'improve.timeframeBreakdown': '{low} low · {medium} med · {high} high',
  'improve.projectedCpk': 'Best projected Cpk: {value}',
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
  'improve.actionsDone': 'Maßnahmen erledigt',
  'improve.overdue': 'überfällig',
  'improve.addVerification': 'Verifizierungsdaten hinzufügen',
  'improve.assessOutcome': 'Ergebnis bewerten',
  'improve.viewActions': 'Maßnahmen anzeigen',
  'improve.actions': 'Maßnahmen',
  'improve.done': 'erledigt',

  // Brainstorm modal
  'brainstorm.title': 'Brainstorm',
  'brainstorm.subtitle': 'No judging yet — just ideas',
  'brainstorm.selectSubtitle': 'Tap ideas to select',
  'brainstorm.inputPlaceholder': '+ type an idea...',
  'brainstorm.doneBrainstorming': 'Done brainstorming →',
  'brainstorm.addToPlan': 'Add {count} to plan →',
  'brainstorm.back': '← Back',
  'brainstorm.sparkMore': 'Spark more',
  'brainstorm.inviteTeam': 'Invite team',
  'brainstorm.copyLink': 'Copy link',
  'brainstorm.ideaCount': '{count} ideas · {directions} directions',
  'brainstorm.selectedCount': '{selected} of {total} selected',
  'brainstorm.parkedLabel': 'Parked ideas',
  'brainstorm.triggerButton': 'Brainstorm',
  'brainstorm.joinToast.title': 'Brainstorm session started',
  'brainstorm.joinToast.body': '{name} started brainstorming ideas for {cause}',
  'brainstorm.joinToast.join': 'Join session',
  'brainstorm.joinToast.later': 'Later',
  'timeframe.label': 'Zeitrahmen',

  // Idea direction labels (Four Ideation Directions)
  'settings.improvementEvaluation': 'Improvement Evaluation',
  'settings.riskAxis1': 'Risk Axis 1',
  'settings.riskAxis2': 'Risk Axis 2',
  'settings.improvementBudget': 'Improvement Budget',
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
  'idea.whatIfSimulator': 'What-If Simulator',
  'idea.askCoScout': 'Ask CoScout',
  'idea.delete': 'Delete idea',
  'idea.addPlaceholder': 'Add improvement idea...',
  'idea.addButton': 'Add',
  'idea.askCoScoutForIdeas': 'Ask CoScout for ideas',
  'idea.moreOptions': 'More options',
  'idea.riskAssessment': 'Risk assessment',

  // Question role labels
  'question.primary': 'Primary',
  'question.contributing': 'Contributing',
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

  // Defect detected modal
  'defect.detected.title': 'Defect Data Detected',
  'defect.detected.confidence': 'confidence',
  'defect.detected.dataShape': 'Data shape',
  'defect.detected.defectType': 'Defect type',
  'defect.detected.count': 'Count',
  'defect.detected.result': 'Result',
  'defect.detected.unitsProduced': 'Units produced',
  'defect.detected.aggregationUnit': 'Group defects by',
  'defect.detected.dismiss': 'Use Standard Mode',
  'defect.detected.enable': 'Enable Defect Mode',
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

  // Report workspace view
  'report.cpkLearningLoop': 'Cpk Learning Loop',
  'report.verdict.effective': 'Effective',
  'report.verdict.partiallyEffective': 'Partially effective',
  'report.verdict.notEffective': 'Not effective',
  'report.cpk.before': 'Before',
  'report.cpk.projected': 'Projected',
  'report.cpk.actual': 'Actual',
  'report.cpk.pendingVerification': 'Pending verification',
  'report.cpk.metProjection': 'Met projection',
  'report.cpk.fromProjection': '{delta} from projection',
  'report.questionTree': 'Question Tree',
  'report.question.answered': 'Answered',
  'report.question.investigating': 'Investigating',
  'report.question.ruledOut': 'Ruled Out',
  'report.question.open': 'Open',
  'report.type.analysisSnapshot': 'Analysis Snapshot',
  'report.type.investigationReport': 'Investigation Report',
  'report.type.improvementStory': 'Improvement Story',
  'report.sections': 'Sections',
  'report.audience.technical': 'Technical',
  'report.audience.summary': 'Summary',
  'report.workspace.analysis': 'ANALYSIS',
  'report.workspace.findings': 'FINDINGS',
  'report.workspace.improvement': 'IMPROVEMENT',
  'report.action.copyAllCharts': 'Copy All Charts',
  'report.action.saveAsPdf': 'Save as PDF',
  'report.action.shareReport': 'Share Report',
  'report.action.publishToSharePoint': 'Publish to SharePoint',
  'report.action.publishedToSharePoint': 'Published to SharePoint',
  'report.publish.rendering': 'Rendering report\u2026',
  'report.publish.uploading': 'Uploading\u2026',
  'report.publish.exists': 'Report already exists in SharePoint.',
  'report.publish.replace': 'Replace',
  'report.publish.failed': 'Publish failed',
  'report.publish.tryAgain': 'Try again',
  'report.selectedCount': '{count} selected',
  'report.bestProjectedCpk': 'Best projected Cpk: {value}',
  'report.meetsTarget': '(meets target)',
  'report.costCategory': '{category} cost',
  'report.noCost': 'No cost',
  'report.riskLevel': '{level} risk',

  // Factor Intelligence
  'fi.title': 'Faktor-Intelligenz',
  'fi.ranking': 'Faktor-Ranking (R² adjustiert)',
  'fi.layer2': 'Ebene 2 · Haupteffekte',
  'fi.layer3': 'Ebene 3 · Faktor-Interaktionen',
  'fi.investigate': 'Untersuchen →',
  'fi.notSignificant': 'nicht signifikant (p={value})',
  'fi.explainsSingle': '{factor} erklärt {pct}% der Variation allein.',
  'fi.explainsMultiple': '{factors} erklären zusammen {pct}% der Variation.',
  'fi.layer2Locked': 'Ebene 2 (Haupteffekte) wird freigeschaltet bei R²adj > {threshold}%',
  'fi.layer2Current': ' — derzeit {value}%',
  'fi.layer3Locked': 'Ebene 3 (Interaktionen) wird freigeschaltet bei ≥2 signifikanten Faktoren',
  'fi.layer3Current': ' — derzeit {count} signifikant',
  'fi.best': 'Beste',
  'fi.range': 'Spannweite',
  'fi.interactionDetected':
    'Interaktion erkannt: Der Effekt von {factorA} hängt vom Niveau von {factorB} ab.',
  'fi.noInteraction': 'Keine signifikante Interaktion — Effekte sind annähernd additiv.',

  // Capability suggestion modal
  'capability.suggestion.title': 'Specification limits set',
  'capability.suggestion.description':
    'Would you like to start with the Capability view to check if your subgroups are meeting the Cpk target?',
  'capability.suggestion.whatYouSee': "What you'll see:",
  'capability.suggestion.bullet1': 'I-Chart plotting Cp and Cpk per subgroup',
  'capability.suggestion.bullet2': 'Whether subgroups consistently meet your target',
  'capability.suggestion.bullet3': 'Centering loss (gap between Cp and Cpk)',
  'capability.suggestion.startCapability': 'Start with Capability View',
  'capability.suggestion.standardView': 'Standard View',
  'capability.suggestion.footer': 'You can switch anytime using the toggle in the I-Chart header.',

  // Annotations
  'annotations.redHighlight': 'Red highlight',
  'annotations.amberHighlight': 'Amber highlight',
  'annotations.greenHighlight': 'Green highlight',
  'annotations.active': 'active',

  // Subgroup
  'subgroup.method': 'Subgroup Method',
  'subgroup.fixedSize': 'Fixed size',
  'subgroup.byColumn': 'By column',
  'subgroup.configuration': 'Subgroup Configuration',
  'subgroup.configureSubgroups': 'Configure subgroups',

  // Capability
  'capability.specsDetected': 'Specification limits detected',
  'capability.startCapabilityView': 'Start Capability View',
  'capability.cpkTrendSubgroup': 'Cpk trend per subgroup',
  'capability.standardView': 'Standard View',
  'capability.individualValuesChart': 'Individual values chart',
  'capability.switchAnytime': 'You can switch anytime using the toggle in the I-Chart header.',
  'capability.type': 'Type:',
  'capability.cpkTarget': 'Cpk target:',
  'capability.insufficientData': 'Insufficient data',
  'capability.meetsTarget': 'Meets target',
  'capability.marginal': 'Marginal',
  'capability.belowTarget': 'Below target',

  // Quality (additional)
  'quality.dataFile': 'Data File',

  // Finding (additional)
  'finding.addObservation': 'Add observation',

  // Action (additional)
  'action.continue': 'Continue',

  'action.drillDown': 'Drill Down',
  'action.viewDetails': 'View Details',

  // Upgrade (additional)
  'upgrade.freeTierLimitation': 'Free tier limitation',
  'upgrade.fromPrice': 'From €79/month',

  // Investigation Wall
  'wall.status.proposed': 'Proposed',
  'wall.status.evidenced': 'Evidenced',
  'wall.status.confirmed': 'Confirmed',
  'wall.status.refuted': 'Refuted',
  'wall.card.hypothesisLabel': 'Hypothesis',
  'wall.card.findings': '{count} findings',
  'wall.card.questions': '{count} questions',
  'wall.card.evidenceGap': 'Evidence gap',
  'wall.card.missingColumn': '⚠ Condition references missing column',
  'wall.card.missingColumnAria': 'Condition references missing column',
  'wall.card.ariaLabel': 'Hypothesis {name}, {status}, {count} findings',
  'wall.problem.title': 'Problem condition',
  'wall.problem.eventsPerWeek': '{count} events/wk',
  'wall.problem.ariaLabel': 'Problem condition: {column}, Cpk {cpk}, {count} events per week',
  'wall.gate.and': 'AND',
  'wall.gate.or': 'OR',
  'wall.gate.not': 'NOT',
  'wall.gate.holds': 'HOLDS {matching}/{total}',
  'wall.gate.noTotals': '—/0',
  'wall.gate.ariaLabel': 'Gate {kind} {holds}',
  'wall.question.ariaLabel': 'Question: {text}, {status}',
  'wall.tributary.ariaLabel': 'Tributaries from Process Map',
  'wall.empty.ariaLabel': 'Investigation Wall empty state',
  'wall.empty.title': 'Start with a hypothesis',
  'wall.empty.subtitle': 'Three ways to begin:',
  'wall.empty.writeHypothesis': 'Write one',
  'wall.empty.promoteFromQuestion': 'Promote from a question',
  'wall.empty.seedFromFactorIntel': 'Seed 3 from Factor Intelligence',
  'wall.rail.title': 'CoScout',
  'wall.rail.openAria': 'Open narrator rail',
  'wall.rail.closeAria': 'Close narrator rail',
  'wall.rail.rootAria': 'Narrator rail',
  'wall.rail.openButton': 'Open rail',
  'wall.rail.empty': 'No suggestions yet.',
  'wall.missing.ariaLabel': 'Missing evidence digest',
  'wall.missing.title': 'Missing evidence',
  'wall.missing.tagline': 'Missing evidence · the detective move nobody ships ({count})',
  'wall.canvas.ariaLabel': 'Investigation Wall canvas',
  'wall.cta.proposeHypothesis': 'Propose new hypothesis from this finding',
  'wall.toolbar.groupByTributary': 'Group by tributary',
  'wall.toolbar.zoomIn': 'Zoom in',
  'wall.toolbar.zoomOut': 'Zoom out',
  'wall.toolbar.resetView': 'Reset view',
  'wall.palette.placeholder': 'Search hubs, questions, findings…',
  'wall.palette.empty': 'No matches',
  'wall.palette.kind.hub': 'HUB',
  'wall.palette.kind.question': 'QUESTION',
  'wall.palette.kind.finding': 'FINDING',
  'wall.minimap.ariaLabel': 'Investigation Wall minimap',
};
