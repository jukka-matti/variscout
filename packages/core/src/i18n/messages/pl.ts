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
};
