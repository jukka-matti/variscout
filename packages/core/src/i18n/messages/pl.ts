import type { MessageCatalog } from '../types';

/**
 * Polish message catalog
 */
export const pl: MessageCatalog = {
  // Statistics labels
  'stats.mean': 'Średnia',
  'stats.median': 'Mediana',
  'stats.stdDev': 'Odch. std.',
  'stats.samples': 'Próbki',
  'stats.passRate': 'Zgodność',
  'stats.range': 'Rozstęp',
  'stats.min': 'Min',
  'stats.max': 'Maks',
  'stats.target': 'Cel',
  'stats.sigma': 'Sigma',

  // Chart labels
  'chart.observation': 'Obserwacja',
  'chart.count': 'Liczba',
  'chart.frequency': 'Częstotliwość',
  'chart.value': 'Wartość',
  'chart.category': 'Kategoria',
  'chart.cumulative': 'Skumulowany %',
  'chart.clickToEdit': 'Kliknij, aby edytować',
  'chart.median': 'Mediana',
  'chart.q1': 'Q1',
  'chart.q3': 'Q3',
  'chart.noChannelData': 'Brak danych kanału',
  'chart.selectChannel': 'Wybierz kanał',

  // Limit labels (PN standards)
  'limits.usl': 'GGT',
  'limits.lsl': 'DGT',
  'limits.ucl': 'GKG',
  'limits.lcl': 'DKG',
  'limits.mean': 'Średnia',
  'limits.target': 'Cel',

  // Navigation
  'nav.newAnalysis': 'Nowa analiza',
  'nav.backToDashboard': 'Powrót do pulpitu',
  'nav.settings': 'Ustawienia',
  'nav.export': 'Eksportuj',
  'nav.presentation': 'Prezentacja',
  'nav.menu': 'Menu',
  'nav.moreActions': 'Więcej działań',

  // Panel titles
  'panel.findings': 'Ustalenia',
  'panel.dataTable': 'Tabela danych',
  'panel.whatIf': 'Co jeśli',
  'panel.investigation': 'Badanie',
  'panel.coScout': 'CoScout',
  'panel.drillPath': 'Ścieżka analizy',

  // View modes
  'view.list': 'Lista',
  'view.board': 'Tablica',
  'view.tree': 'Drzewo',

  // Action buttons
  'action.save': 'Zapisz',
  'action.cancel': 'Anuluj',
  'action.delete': 'Usuń',
  'action.edit': 'Edytuj',
  'action.copy': 'Kopiuj',
  'action.close': 'Zamknij',
  'action.learnMore': 'Dowiedz się więcej',
  'action.download': 'Pobierz',
  'action.apply': 'Zastosuj',
  'action.reset': 'Resetuj',
  'action.retry': 'Ponów',
  'action.send': 'Wyślij',
  'action.ask': 'Zapytaj',
  'action.clear': 'Wyczyść',
  'action.copyAll': 'Kopiuj wszystko',
  'action.selectAll': 'Zaznacz wszystko',

  // CoScout
  'coscout.send': 'Wyślij',
  'coscout.clear': 'Wyczyść rozmowę',
  'coscout.stop': 'Zatrzymaj',
  'coscout.rateLimit': 'Osiągnięto limit żądań. Proszę czekać.',
  'coscout.contentFilter': 'Treść odfiltrowana przez politykę bezpieczeństwa.',
  'coscout.error': 'Wystąpił błąd. Spróbuj ponownie.',

  // Display/settings
  'display.preferences': 'Preferencje',
  'display.chartTextSize': 'Rozmiar tekstu wykresu',
  'display.compact': 'Kompaktowy',
  'display.normal': 'Normalny',
  'display.large': 'Duży',
  'display.lockYAxis': 'Zablokuj oś Y',
  'display.filterContext': 'Kontekst filtra',
  'display.showSpecs': 'Pokaż specyfikacje',

  // Investigation
  'investigation.brief': 'Podsumowanie badania',
  'investigation.assignedToMe': 'Przypisane do mnie',
  'investigation.hypothesis': 'Hipoteza',
  'investigation.hypotheses': 'Hipotezy',
  'investigation.pinAsFinding': 'Przypnij jako ustalenie',
  'investigation.addObservation': 'Dodaj obserwację',

  // Empty states
  'empty.noData': 'Brak dostępnych danych',
  'empty.noFindings': 'Brak ustaleń',
  'empty.noResults': 'Nie znaleziono wyników',

  // Error messages
  'error.generic': 'Coś poszło nie tak',
  'error.loadFailed': 'Nie udało się załadować danych',
  'error.parseFailed': 'Nie udało się przetworzyć pliku',

  // Settings labels
  'settings.language': 'Język',
  'settings.theme': 'Motyw',
  'settings.textSize': 'Rozmiar tekstu',

  // Finding statuses
  'findings.observed': 'Zaobserwowane',
  'findings.investigating': 'W trakcie badania',
  'findings.analyzed': 'Przeanalizowane',
  'findings.improving': 'W trakcie poprawy',
  'findings.resolved': 'Rozwiązane',

  // Report labels
  'report.summary': 'Podsumowanie',
  'report.findings': 'Ustalenia',
  'report.recommendations': 'Zalecenia',
  'report.evidence': 'Dowody',

  // Data input labels
  'data.pasteData': 'Wklej dane',
  'data.uploadFile': 'Prześlij plik',
  'data.columnMapping': 'Mapowanie kolumn',
  'data.measureColumn': 'Kolumna pomiarowa',
  'data.factorColumn': 'Kolumna czynnika',
  'data.addData': 'Dodaj dane',
  'data.editData': 'Edytuj dane',
  'data.showDataTable': 'Pokaż tabelę danych',
  'data.hideDataTable': 'Ukryj tabelę danych',

  // Status
  'status.cached': 'W pamięci podręcznej',
  'status.loading': 'Ładowanie',
  'status.ai': 'AI',
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
    'Reguła Nelsona 2 — seria {count} {side} średniej (#{start}–{end})',
  'chart.violation.nelson3.detail': 'Reguła Nelsona 3 — trend {count} {direction} (#{start}–{end})',
  'chart.violation.side.above': 'powyżej',
  'chart.violation.side.below': 'poniżej',
  'chart.violation.direction.increasing': 'rosnący',
  'chart.violation.direction.decreasing': 'malejący',

  // Parameterized messages
  'data.rowsLoaded': '{count} rows loaded',
  'findings.countLabel': '{count} findings',

  // Chart limit labels (colon-suffixed for SVG rendering)
  'chart.label.ucl': 'UCL:',
  'chart.label.lcl': 'LCL:',
  'chart.label.mean': 'Śr.:',
  'chart.label.tgt': 'Cel:',
  'chart.label.usl': 'USL:',
  'chart.label.lsl': 'LSL:',
  'chart.label.value': 'Wartość:',
  'chart.label.n': 'n:',
  'chart.label.target': 'Cel:',

  // Chart status & empty states
  'chart.status.inControl': 'Pod kontrolą',
  'chart.status.outOfControl': 'Poza kontrolą (poza UCL/LCL)',
  'chart.noDataProbPlot': 'Brak danych dla wykresu prawdopodobieństwa',

  // Chart edit affordances
  'chart.edit.spec': 'Kliknij, aby edytować {spec}',
  'chart.edit.axisLabel': 'Kliknij, aby edytować etykietę osi',
  'chart.edit.yAxis': 'Kliknij, aby edytować skalę osi Y',
  'chart.edit.saveCancel': 'Enter, aby zapisać · Esc, aby anulować',

  // Performance table headers
  'chart.table.channel': 'Kanał',
  'stats.cp': 'Cp',

  // Chart UI labels
  'chart.copyToClipboard': 'Kopiuj wykres do schowka',
  'chart.maximize': 'Maksymalizuj wykres',
  'chart.type.ichart': 'I-Chart',
  'chart.type.boxplot': 'Boxplot',
  'chart.type.pareto': 'Pareto',
  'chart.drillHere': '↓ zagłęb się tutaj',
  'chart.percent': 'Procent',

  // Y-axis popover
  'chart.yAxisScale': 'Skala osi Y',
  'validation.minLessThanMax': 'Min musi być mniejsze niż Max',
  'action.noChanges': 'Brak zmian',

  // Create factor modal
  'factor.create': 'Utwórz czynnik z zaznaczenia',
  'factor.name': 'Nazwa czynnika',
  'factor.nameEmpty': 'Nazwa czynnika nie może być pusta',
  'factor.nameExists': 'Czynnik o tej nazwie już istnieje',
  'factor.example': 'np. Zdarzenia wysokiej temperatury',
  'factor.pointsMarked': '{count} punktów zostanie oznaczonych jako:',
  'factor.createAndFilter': 'Utwórz i filtruj',
  'factor.filterExplanation':
    'Widok zostanie automatycznie przefiltrowany, aby pokazać tylko wybrane punkty.',

  // Characteristic type selector
  'charType.nominal': 'Nominalna',
  'charType.nominalDesc': 'Zorientowana na cel (np. masa napełnienia)',
  'charType.smaller': 'Mniejsza jest lepsza',
  'charType.smallerDesc': 'Niższa jest lepsza (np. defekty)',
  'charType.larger': 'Większa jest lepsza',
  'charType.largerDesc': 'Wyższa jest lepsza (np. wydajność)',

  // Investigation prompt
  'investigation.trackingPrompt':
    'Śledzenie badania — otwórz panel Badanie, aby zobaczyć pełny obraz.',

  // Mobile category sheet
  'chart.highlight': 'Podświetlenie:',
  'chart.highlightRed': 'Czerwony',
  'chart.highlightAmber': 'Bursztynowy',
  'chart.highlightGreen': 'Zielony',
  'chart.clearHighlight': 'Usuń podświetlenie',
  'chart.drillDown': 'Zagłęb się w „{category}"',
  'ai.askCoScout': 'Zapytaj CoScout o to',

  // Settings descriptions
  'display.lockYAxisDesc': 'Zachowuje skalę do porównania wizualnego',
  'display.filterContextDesc': 'Wyświetl podsumowanie aktywnych filtrów pod nagłówkami wykresów',

  // Performance detected modal
  'performance.detected': 'Wykryto tryb Performance',
  'performance.columnsFound': 'Znaleziono {count} kolumn pomiarowych',
  'performance.labelQuestion': 'Co reprezentują te kanały pomiarowe?',
  'performance.labelExample': 'np. Głowica napełniająca, Gniazdo, Dysza',
  'performance.enable': 'Włącz tryb Performance',

  // Finding editor & data types
  'finding.placeholder': 'Co znalazłeś?',
  'finding.note': 'Notatka dotycząca odkrycia',
  'data.typeNumeric': 'Liczbowy',
  'data.typeCategorical': 'Kategoryczny',
  'data.typeDate': 'Data',
  'data.typeText': 'Tekst',
  'data.categories': 'kategorie',

  // PWA HomeScreen
  'home.heading': 'Odkrywaj analizę zmienności',
  'home.description':
    'Darmowe narzędzie szkoleniowe do analizy zmienności. Wizualizuj zmienność, obliczaj zdolność procesową i znajdź, na czym się skupić — bezpośrednio w przeglądarce.',
  'home.divider': 'lub użyj własnych danych',
  'home.pasteHelper': 'Skopiuj wiersze i wklej — automatycznie wykryjemy kolumny',
  'home.manualEntry': 'Lub wprowadź dane ręcznie',
  'home.upgradeHint':
    'Potrzebujesz funkcji zespołowych, przesyłania plików lub zapisanych projektów?',

  // PWA navigation
  'nav.presentationMode': 'Tryb prezentacji',
  'nav.hideFindings': 'Ukryj odkrycia',

  // Export
  'export.asImage': 'Eksportuj jako obraz',
  'export.asCsv': 'Eksportuj jako CSV',
  'export.imageDesc': 'Zrzut ekranu PNG do prezentacji',
  'export.csvDesc': 'Plik danych kompatybilny z arkuszem kalkulacyjnym',

  // Sample section
  'sample.heading': 'Wypróbuj przykładowy zestaw danych',
  'sample.allSamples': 'Wszystkie przykładowe zestawy danych',
  'sample.featured': 'Wyróżnione',
  'sample.caseStudies': 'Studia przypadków',
  'sample.journeys': 'Ścieżki edukacyjne',
  'sample.industry': 'Przykłady branżowe',

  // View modes (additional)
  'view.stats': 'Statystyki',

  // Display (additional)
  'display.appearance': 'Wygląd',

  // Azure toolbar
  'data.manualEntry': 'Wprowadzanie ręczne',
  'data.editTable': 'Edytuj tabelę danych',
  'toolbar.saveAs': 'Zapisz jako…',
  'toolbar.saving': 'Zapisywanie…',
  'toolbar.saved': 'Zapisano',
  'toolbar.saveFailed': 'Zapis nie powiódł się',
  'toolbar.addMore': 'Dodaj dane',
  'report.scouting': 'Raport Scouting',
  'export.csvFiltered': 'Eksportuj przefiltrowane dane jako CSV',
  'error.auth': 'Błąd uwierzytelniania',

  // File browse
  'file.browseLocal': 'Przeglądaj to urządzenie',
  'file.browseSharePoint': 'Przeglądaj SharePoint',
  'file.open': 'Otwórz plik',

  // Admin hub
  'admin.title': 'Administracja',
  'admin.status': 'Status',
  'admin.plan': 'Plan i funkcje',
  'admin.teams': 'Konfiguracja Teams',
  'admin.knowledge': 'Knowledge Base',
  'admin.troubleshooting': 'Rozwiązywanie problemów',

  // Admin plan tab
  'admin.currentPlan': 'Bieżący',
  'admin.feature': 'Funkcja',
  'admin.manageSubscription': 'Zarządzaj subskrypcją w Azure',
  'admin.planStandard': 'Standard',
  'admin.planTeam': 'Team',
  'admin.planStandardPrice': '€79/mies.',
  'admin.planTeamPrice': '€199/mies.',
  'admin.planStandardDesc': 'Pełna analiza z CoScout AI',
  'admin.planTeamDesc': 'Teams, OneDrive, SharePoint, baza wiedzy',

  // Feature names (plan matrix)
  'feature.charts': 'I-Chart, Boxplot, Pareto, Stats',
  'feature.capability': 'Analiza zdolności procesowej (Cp/Cpk)',
  'feature.performance': 'Tryb Performance (wielokanałowy)',
  'feature.anova': 'ANOVA i analiza czynnikowa',
  'feature.findingsWorkflow': 'Przepływ pracy odkryć i badań',
  'feature.whatIf': 'Symulacja What-If',
  'feature.csvImport': 'Import CSV/Excel',
  'feature.reportExport': 'Eksport raportu (PDF)',
  'feature.indexedDb': 'Lokalne przechowywanie IndexedDB',
  'feature.maxFactors': 'Do 6 czynników',
  'feature.maxRows': 'Do 100 tys. wierszy',
  'feature.onedriveSync': 'Synchronizacja projektów OneDrive',
  'feature.sharepointPicker': 'Selektor plików SharePoint',
  'feature.teamsIntegration': 'Integracja z Microsoft Teams',
  'feature.channelCollab': 'Współpraca w kanałach',
  'feature.mobileUi': 'Interfejs zoptymalizowany dla urządzeń mobilnych',
  'feature.coScoutAi': 'Asystent AI CoScout',
  'feature.narrativeBar': 'Wglądy NarrativeBar',
  'feature.chartInsights': 'Chipy wglądów wykresów',
  'feature.knowledgeBase': 'Knowledge Base (wyszukiwanie SharePoint)',
  'feature.aiActions': 'Sugestie działań AI',

  // Admin Teams setup
  'admin.teams.heading': 'Dodaj VariScout do Microsoft Teams',
  'admin.teams.description':
    'Wygeneruj pakiet aplikacji Teams dla swojego wdrożenia i prześlij go do centrum administracyjnego Teams.',
  'admin.teams.running': 'Działa wewnątrz Microsoft Teams',
  'admin.teams.step1': 'ID klienta rejestracji aplikacji (opcjonalne)',
  'admin.teams.step1Desc':
    'Wprowadź ID klienta rejestracji aplikacji Azure AD, aby włączyć SSO Teams w manifeście.',
  'admin.teams.step2': 'Pobierz pakiet aplikacji Teams',
  'admin.teams.step2Desc':
    'Ten plik .zip zawiera manifest i ikony wstępnie skonfigurowane dla Twojego wdrożenia.',
  'admin.teams.step3': 'Prześlij do centrum administracyjnego Teams',
  'admin.teams.step4': 'Dodaj VariScout do kanału',
  'admin.teams.download': 'Pobierz pakiet aplikacji Teams',

  // Admin status tab
  'admin.checksResult': '{pass}/{total} kontroli zaliczonych',
  'admin.runChecks': 'Uruchom wszystkie kontrole',
  'admin.notApplicable': 'Nie dotyczy Twojego planu',
  'admin.managePortal': 'Zarządzaj w portalu Azure',
  'admin.portalAccessNote':
    'Te elementy wymagają dostępu do portalu Azure i nie mogą być sprawdzone z poziomu przeglądarki.',
  'admin.fixInPortal': 'Napraw w portalu Azure: {label}',

  // Admin troubleshoot tab
  'admin.troubleshoot.intro':
    'Typowe problemy i sposoby ich rozwiązywania. Kliknij problem, aby zobaczyć instrukcje krok po kroku.',
  'admin.runCheck': 'Uruchom kontrolę',
  'admin.checkPassed': 'Kontrola zaliczona — to może nie być przyczyną problemu.',
  'admin.checkFailed': 'Kontrola niezaliczona — postępuj zgodnie z poniższymi krokami.',
  'admin.issue.signin': 'Użytkownicy nie mogą się zalogować',
  'admin.issue.signinDesc':
    'Uwierzytelnianie Azure AD nie działa lub użytkownicy widzą pustą stronę.',
  'admin.issue.signinSteps':
    'Sprawdź, czy uwierzytelnianie App Service jest włączone w portalu Azure.\nSprawdź, czy rejestracja aplikacji Azure AD ma prawidłowe identyfikatory URI przekierowania.\nUpewnij się, że rejestracja aplikacji ma włączone „Tokeny ID" w sekcji Uwierzytelnianie.\nSprawdź, czy dzierżawca zezwala na logowanie użytkowników do aplikacji (Aplikacje dla przedsiębiorstw → Właściwości → Włączone dla logowania użytkowników).',
  'admin.issue.onedrive': 'Synchronizacja OneDrive nie działa',
  'admin.issue.onedriveDesc':
    'Projekty nie synchronizują się z OneDrive lub użytkownicy widzą błędy uprawnień.',
  'admin.issue.onedriveSteps':
    'Sprawdź, czy rejestracja aplikacji ma delegowane uprawnienie „Files.ReadWrite".\nSprawdź, czy udzielono zgody administratora na uprawnienia Graph.\nUpewnij się, że użytkownik ma przypisaną licencję OneDrive.\nSpróbuj wylogować się i zalogować ponownie, aby odświeżyć token.',
  'admin.issue.coscout': 'CoScout nie odpowiada',
  'admin.issue.coscoutDesc': 'Asystent AI nie generuje odpowiedzi lub wyświetla błędy.',
  'admin.issue.coscoutSteps':
    'Sprawdź, czy punkt końcowy AI jest skonfigurowany w szablonie ARM / ustawieniach App Service.\nSprawdź, czy zasób Azure AI Services jest wdrożony i działa.\nSprawdź, czy wdrożenie modelu istnieje (np. gpt-4o) w zasobie AI Services.\nSprawdź limity Azure AI Services — wdrożenie mogło osiągnąć limity szybkości.',
  'admin.issue.kbEmpty': 'Knowledge Base nie zwraca wyników',
  'admin.issue.kbEmptyDesc':
    '„Przeszukaj Knowledge Base" w CoScout nie znajduje nic mimo istniejących dokumentów.',
  'admin.issue.kbEmptySteps':
    'Sprawdź, czy punkt końcowy AI Search jest skonfigurowany w ustawieniach App Service.\nSprawdź, czy źródło wiedzy Remote SharePoint zostało utworzone w AI Search.\nUpewnij się, że co najmniej 1 licencja Microsoft 365 Copilot jest aktywna w dzierżawcy.\nSprawdź, czy użytkownik ma dostęp do wyszukiwanych dokumentów w SharePoint.\nSprawdź, czy przełącznik podglądu Knowledge Base jest włączony (Administracja → zakładka Knowledge Base).',
  'admin.issue.teamsTab': 'Karta Teams nie wyświetla się',
  'admin.issue.teamsTabDesc': 'VariScout nie pojawia się w Teams lub karta nie ładuje się.',
  'admin.issue.teamsTabSteps':
    'Sprawdź, czy pakiet aplikacji Teams (.zip) został przesłany do centrum administracyjnego Teams.\nSprawdź, czy contentUrl w manifest.json odpowiada adresowi URL App Service.\nUpewnij się, że aplikacja jest zatwierdzona w centrum administracyjnym Teams (nie jest blokowana przez zasady).\nSpróbuj usunąć i ponownie dodać kartę w kanale.\nJeśli używasz domeny niestandardowej, sprawdź, czy jest w tablicy validDomains manifestu.',
  'admin.issue.newUser': 'Nowy użytkownik nie ma dostępu do aplikacji',
  'admin.issue.newUserDesc': 'Nowo dodany użytkownik widzi odmowę dostępu lub pustą stronę.',
  'admin.issue.newUserSteps':
    'W Azure AD przejdź do Aplikacje dla przedsiębiorstw → VariScout → Użytkownicy i grupy.\nDodaj użytkownika lub jego grupę zabezpieczeń do aplikacji.\nJeśli używasz „Wymagane przypisanie użytkownika", upewnij się, że użytkownik ma przypisanie.\nSprawdź zasady dostępu warunkowego, które mogą blokować użytkownika.',
  'admin.issue.aiSlow': 'Odpowiedzi AI są wolne',
  'admin.issue.aiSlowDesc': 'CoScout długo odpowiada lub często przekracza limit czasu.',
  'admin.issue.aiSlowSteps':
    'Sprawdź region wdrożenia Azure AI Services — opóźnienie rośnie z odległością.\nSprawdź, czy wdrożenie modelu ma wystarczającą kwotę TPM (tokenów na minutę).\nRozważ aktualizację do wdrożenia z provisionowaną przepustowością dla stałego opóźnienia.\nSprawdź, czy indeks AI Search jest duży — rozważ optymalizację źródła wiedzy.',
  'admin.issue.forbidden': 'Błędy „Forbidden"',
  'admin.issue.forbiddenDesc': 'Użytkownicy widzą błędy 403 przy dostępie do niektórych funkcji.',
  'admin.issue.forbiddenSteps':
    'Sprawdź, czy wszystkie wymagane uprawnienia Graph API mają zgodę administratora.\nSprawdź, czy magazyn tokenów uwierzytelniania App Service jest włączony.\nUpewnij się, że token użytkownika nie wygasł — spróbuj wylogować się i zalogować ponownie.\nSprawdź zasady dostępu warunkowego dla dzierżawcy.',
  'admin.issue.kbPartial': 'KB nie działa dla niektórych użytkowników',
  'admin.issue.kbPartialDesc':
    'Wyszukiwanie Knowledge Base działa dla administratorów, ale nie dla innych użytkowników.',
  'admin.issue.kbPartialSteps':
    'Źródła wiedzy Remote SharePoint używają uprawnień per użytkownik. Każdy użytkownik musi mieć dostęp SharePoint do dokumentów.\nSprawdź, czy dotknięci użytkownicy są blokowani przez zasady dostępu warunkowego.\nSprawdź, czy udzielono zgody administratora na delegowane uprawnienie Sites.Read.All.\nPoproś dotkniętych użytkowników o wylogowanie się i ponowne zalogowanie, aby odświeżyć token.',

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
  'improve.selectedCount': '{count} selected',
  'improve.timeframeBreakdown': '{low} low · {medium} med · {high} high',
  'improve.projectedCpk': 'Projected Cpk: {value}',
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
  'timeframe.label': 'Effort',

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
};
