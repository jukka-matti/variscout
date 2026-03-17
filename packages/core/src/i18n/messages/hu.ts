import type { MessageCatalog } from '../types';

/** Hungarian message catalog */
export const hu: MessageCatalog = {
  // Statistics labels
  'stats.mean': 'Átlag',
  'stats.median': 'Medián',
  'stats.stdDev': 'Szórás',
  'stats.samples': 'Minták',
  'stats.passRate': 'Megfelelési arány',
  'stats.range': 'Terjedelem',
  'stats.min': 'Min',
  'stats.max': 'Max',
  'stats.target': 'Célérték',
  'stats.sigma': 'Szigma',

  // Chart labels
  'chart.observation': 'Megfigyelés',
  'chart.count': 'Darabszám',
  'chart.frequency': 'Gyakoriság',
  'chart.value': 'Érték',
  'chart.category': 'Kategória',
  'chart.cumulative': 'Kumulatív %',
  'chart.clickToEdit': 'Kattintson a szerkesztéshez',
  'chart.median': 'Medián',
  'chart.q1': 'Q1',
  'chart.q3': 'Q3',
  'chart.noChannelData': 'Nincs csatornaadat',
  'chart.selectChannel': 'Csatorna kiválasztása',

  // Limit labels (MSZ standards)
  'limits.usl': 'FTH',
  'limits.lsl': 'ATH',
  'limits.ucl': 'FEH',
  'limits.lcl': 'AEH',
  'limits.mean': 'Átlag',
  'limits.target': 'Célérték',

  // Navigation
  'nav.newAnalysis': 'Új elemzés',
  'nav.backToDashboard': 'Vissza az irányítópulthoz',
  'nav.settings': 'Beállítások',
  'nav.export': 'Exportálás',
  'nav.presentation': 'Bemutató',
  'nav.menu': 'Menü',
  'nav.moreActions': 'További műveletek',

  // Panel titles
  'panel.findings': 'Megállapítások',
  'panel.dataTable': 'Adattáblázat',
  'panel.whatIf': 'Mi lenne ha',
  'panel.investigation': 'Vizsgálat',
  'panel.coScout': 'CoScout',
  'panel.drillPath': 'Lebontási útvonal',

  // View modes
  'view.list': 'Lista',
  'view.board': 'Tábla',
  'view.tree': 'Fa',

  // Action buttons
  'action.save': 'Mentés',
  'action.cancel': 'Mégse',
  'action.delete': 'Törlés',
  'action.edit': 'Szerkesztés',
  'action.copy': 'Másolás',
  'action.close': 'Bezárás',
  'action.learnMore': 'Továbbiak',
  'action.download': 'Letöltés',
  'action.apply': 'Alkalmazás',
  'action.reset': 'Visszaállítás',
  'action.retry': 'Újrapróbálás',
  'action.send': 'Küldés',
  'action.ask': 'Kérdezés',
  'action.clear': 'Törlés',
  'action.copyAll': 'Összes másolása',
  'action.selectAll': 'Összes kijelölése',

  // CoScout
  'coscout.send': 'Küldés',
  'coscout.clear': 'Beszélgetés törlése',
  'coscout.stop': 'Leállítás',
  'coscout.rateLimit': 'Kéréskorlát elérve. Kérjük, várjon.',
  'coscout.contentFilter': 'A tartalom biztonsági szabályzat alapján szűrve.',
  'coscout.error': 'Hiba történt. Próbálja újra.',

  // Display/settings
  'display.preferences': 'Beállítások',
  'display.chartTextSize': 'Diagram szövegméret',
  'display.compact': 'Kompakt',
  'display.normal': 'Normál',
  'display.large': 'Nagy',
  'display.lockYAxis': 'Y-tengely zárolása',
  'display.filterContext': 'Szűrőkontextus',
  'display.showSpecs': 'Specifikációk megjelenítése',

  // Investigation
  'investigation.brief': 'Vizsgálati jelentés',
  'investigation.assignedToMe': 'Nekem kiosztott',
  'investigation.hypothesis': 'Hipotézis',
  'investigation.hypotheses': 'Hipotézisek',
  'investigation.pinAsFinding': 'Rögzítés megállapításként',
  'investigation.addObservation': 'Megfigyelés hozzáadása',

  // Empty states
  'empty.noData': 'Nincs elérhető adat',
  'empty.noFindings': 'Még nincsenek megállapítások',
  'empty.noResults': 'Nem található eredmény',

  // Error messages
  'error.generic': 'Valami hiba történt',
  'error.loadFailed': 'Az adatok betöltése sikertelen',
  'error.parseFailed': 'A fájl feldolgozása sikertelen',

  // Settings labels
  'settings.language': 'Nyelv',
  'settings.theme': 'Téma',
  'settings.textSize': 'Szövegméret',

  // Finding statuses
  'findings.observed': 'Megfigyelt',
  'findings.investigating': 'Vizsgálat alatt',
  'findings.analyzed': 'Elemzett',
  'findings.improving': 'Javítás alatt',
  'findings.resolved': 'Megoldva',

  // Report labels
  'report.summary': 'Összefoglalás',
  'report.findings': 'Megállapítások',
  'report.recommendations': 'Javaslatok',
  'report.evidence': 'Bizonyítékok',

  // Data input labels
  'data.pasteData': 'Adatok beillesztése',
  'data.uploadFile': 'Fájl feltöltése',
  'data.columnMapping': 'Oszlopleképezés',
  'data.measureColumn': 'Mérési oszlop',
  'data.factorColumn': 'Tényezőoszlop',
  'data.addData': 'Adatok hozzáadása',
  'data.editData': 'Adatok szerkesztése',
  'data.showDataTable': 'Adattáblázat megjelenítése',
  'data.hideDataTable': 'Adattáblázat elrejtése',

  // Status
  'status.cached': 'Gyorsítótárazva',
  'status.loading': 'Betöltés',
  'status.ai': 'MI',
};
