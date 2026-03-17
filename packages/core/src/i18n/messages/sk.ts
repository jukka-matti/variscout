import type { MessageCatalog } from '../types';

/** Slovak message catalog */
export const sk: MessageCatalog = {
  // Statistics labels
  'stats.mean': 'Priemer',
  'stats.median': 'Medián',
  'stats.stdDev': 'Štan. odchýlka',
  'stats.samples': 'Vzorky',
  'stats.passRate': 'Miera zhody',
  'stats.range': 'Rozpätie',
  'stats.min': 'Min.',
  'stats.max': 'Max.',
  'stats.target': 'Cieľ',
  'stats.sigma': 'Sigma',

  // Chart labels
  'chart.observation': 'Pozorovanie',
  'chart.count': 'Počet',
  'chart.frequency': 'Frekvencia',
  'chart.value': 'Hodnota',
  'chart.category': 'Kategória',
  'chart.cumulative': 'Kumulatívne %',
  'chart.clickToEdit': 'Kliknite pre úpravu',
  'chart.median': 'Medián',
  'chart.q1': 'Q1',
  'chart.q3': 'Q3',
  'chart.noChannelData': 'Žiadne údaje kanála',
  'chart.selectChannel': 'Vyberte kanál',

  // Limit labels
  'limits.usl': 'HMT',
  'limits.lsl': 'DMT',
  'limits.ucl': 'HRH',
  'limits.lcl': 'DRH',
  'limits.mean': 'Priemer',
  'limits.target': 'Cieľ',

  // Navigation
  'nav.newAnalysis': 'Nová analýza',
  'nav.backToDashboard': 'Späť na panel',
  'nav.settings': 'Nastavenia',
  'nav.export': 'Export',
  'nav.presentation': 'Prezentácia',
  'nav.menu': 'Menu',
  'nav.moreActions': 'Ďalšie akcie',

  // Panel titles
  'panel.findings': 'Zistenia',
  'panel.dataTable': 'Tabuľka údajov',
  'panel.whatIf': 'Čo ak',
  'panel.investigation': 'Vyšetrovanie',
  'panel.coScout': 'CoScout',
  'panel.drillPath': 'Cesta hĺbkovej analýzy',

  // View modes
  'view.list': 'Zoznam',
  'view.board': 'Tabuľa',
  'view.tree': 'Strom',

  // Action buttons
  'action.save': 'Uložiť',
  'action.cancel': 'Zrušiť',
  'action.delete': 'Odstrániť',
  'action.edit': 'Upraviť',
  'action.copy': 'Kopírovať',
  'action.close': 'Zavrieť',
  'action.learnMore': 'Zistiť viac',
  'action.download': 'Stiahnuť',
  'action.apply': 'Použiť',
  'action.reset': 'Obnoviť',
  'action.retry': 'Skúsiť znova',
  'action.send': 'Odoslať',
  'action.ask': 'Opýtať sa',
  'action.clear': 'Vymazať',
  'action.copyAll': 'Kopírovať všetko',
  'action.selectAll': 'Vybrať všetko',

  // CoScout
  'coscout.send': 'Odoslať',
  'coscout.clear': 'Vymazať konverzáciu',
  'coscout.stop': 'Zastaviť',
  'coscout.rateLimit': 'Dosiahnutý limit požiadaviek. Prosím, počkajte.',
  'coscout.contentFilter': 'Obsah bol filtrovaný bezpečnostnou politikou.',
  'coscout.error': 'Vyskytla sa chyba. Prosím, skúste to znova.',

  // Display/settings
  'display.preferences': 'Predvoľby',
  'display.chartTextSize': 'Veľkosť textu grafu',
  'display.compact': 'Kompaktné',
  'display.normal': 'Normálne',
  'display.large': 'Veľké',
  'display.lockYAxis': 'Zamknúť os Y',
  'display.filterContext': 'Kontext filtra',
  'display.showSpecs': 'Zobraziť špecifikácie',

  // Investigation
  'investigation.brief': 'Súhrn vyšetrovania',
  'investigation.assignedToMe': 'Pridelené mne',
  'investigation.hypothesis': 'Hypotéza',
  'investigation.hypotheses': 'Hypotézy',
  'investigation.pinAsFinding': 'Pripnúť ako zistenie',
  'investigation.addObservation': 'Pridať pozorovanie',

  // Empty states
  'empty.noData': 'Žiadne dostupné údaje',
  'empty.noFindings': 'Zatiaľ žiadne zistenia',
  'empty.noResults': 'Neboli nájdené žiadne výsledky',

  // Error messages
  'error.generic': 'Niečo sa pokazilo',
  'error.loadFailed': 'Nepodarilo sa načítať údaje',
  'error.parseFailed': 'Nepodarilo sa spracovať súbor',

  // Settings labels
  'settings.language': 'Jazyk',
  'settings.theme': 'Téma',
  'settings.textSize': 'Veľkosť textu',

  // Finding statuses
  'findings.observed': 'Pozorované',
  'findings.investigating': 'Vyšetruje sa',
  'findings.analyzed': 'Analyzované',
  'findings.improving': 'Zlepšuje sa',
  'findings.resolved': 'Vyriešené',

  // Report labels
  'report.summary': 'Súhrn',
  'report.findings': 'Zistenia',
  'report.recommendations': 'Odporúčania',
  'report.evidence': 'Dôkazy',

  // Data input labels
  'data.pasteData': 'Vložiť údaje',
  'data.uploadFile': 'Nahrať súbor',
  'data.columnMapping': 'Mapovanie stĺpcov',
  'data.measureColumn': 'Stĺpec merania',
  'data.factorColumn': 'Stĺpec faktora',
  'data.addData': 'Pridať údaje',
  'data.editData': 'Upraviť údaje',
  'data.showDataTable': 'Zobraziť tabuľku údajov',
  'data.hideDataTable': 'Skryť tabuľku údajov',

  // Status
  'status.cached': 'Uložené v cache',
  'status.loading': 'Načítava sa',
  'status.ai': 'UI',
};
