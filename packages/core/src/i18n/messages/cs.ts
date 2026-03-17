import type { MessageCatalog } from '../types';

/** Czech message catalog */
export const cs: MessageCatalog = {
  // Statistics labels
  'stats.mean': 'Průměr',
  'stats.median': 'Medián',
  'stats.stdDev': 'Sm. odch.',
  'stats.samples': 'Vzorky',
  'stats.passRate': 'Podíl shody',
  'stats.range': 'Rozpětí',
  'stats.min': 'Min',
  'stats.max': 'Max',
  'stats.target': 'Cíl',
  'stats.sigma': 'Sigma',

  // Chart labels
  'chart.observation': 'Pozorování',
  'chart.count': 'Počet',
  'chart.frequency': 'Četnost',
  'chart.value': 'Hodnota',
  'chart.category': 'Kategorie',
  'chart.cumulative': 'Kumulativní %',
  'chart.clickToEdit': 'Klikněte pro úpravu',
  'chart.median': 'Medián',
  'chart.q1': 'Q1',
  'chart.q3': 'Q3',
  'chart.noChannelData': 'Žádná data kanálu',
  'chart.selectChannel': 'Vybrat kanál',

  // Limit labels (ČSN standards)
  'limits.usl': 'HMT',
  'limits.lsl': 'DMT',
  'limits.ucl': 'HRH',
  'limits.lcl': 'DRH',
  'limits.mean': 'Průměr',
  'limits.target': 'Cíl',

  // Navigation
  'nav.newAnalysis': 'Nová analýza',
  'nav.backToDashboard': 'Zpět na přehled',
  'nav.settings': 'Nastavení',
  'nav.export': 'Exportovat',
  'nav.presentation': 'Prezentace',
  'nav.menu': 'Nabídka',
  'nav.moreActions': 'Další akce',

  // Panel titles
  'panel.findings': 'Zjištění',
  'panel.dataTable': 'Datová tabulka',
  'panel.whatIf': 'Co kdyby',
  'panel.investigation': 'Šetření',
  'panel.coScout': 'CoScout',
  'panel.drillPath': 'Cesta rozkladu',

  // View modes
  'view.list': 'Seznam',
  'view.board': 'Nástěnka',
  'view.tree': 'Strom',

  // Action buttons
  'action.save': 'Uložit',
  'action.cancel': 'Zrušit',
  'action.delete': 'Smazat',
  'action.edit': 'Upravit',
  'action.copy': 'Kopírovat',
  'action.close': 'Zavřít',
  'action.learnMore': 'Zjistit více',
  'action.download': 'Stáhnout',
  'action.apply': 'Použít',
  'action.reset': 'Obnovit',
  'action.retry': 'Zkusit znovu',
  'action.send': 'Odeslat',
  'action.ask': 'Zeptat se',
  'action.clear': 'Vymazat',
  'action.copyAll': 'Kopírovat vše',
  'action.selectAll': 'Vybrat vše',

  // CoScout
  'coscout.send': 'Odeslat',
  'coscout.clear': 'Vymazat konverzaci',
  'coscout.stop': 'Zastavit',
  'coscout.rateLimit': 'Dosažen limit požadavků. Počkejte prosím.',
  'coscout.contentFilter': 'Obsah filtrován bezpečnostní politikou.',
  'coscout.error': 'Došlo k chybě. Zkuste to znovu.',

  // Display/settings
  'display.preferences': 'Předvolby',
  'display.chartTextSize': 'Velikost textu grafu',
  'display.compact': 'Kompaktní',
  'display.normal': 'Normální',
  'display.large': 'Velký',
  'display.lockYAxis': 'Zamknout osu Y',
  'display.filterContext': 'Kontext filtru',
  'display.showSpecs': 'Zobrazit specifikace',

  // Investigation
  'investigation.brief': 'Zpráva o šetření',
  'investigation.assignedToMe': 'Přiřazené mně',
  'investigation.hypothesis': 'Hypotéza',
  'investigation.hypotheses': 'Hypotézy',
  'investigation.pinAsFinding': 'Připnout jako zjištění',
  'investigation.addObservation': 'Přidat pozorování',

  // Empty states
  'empty.noData': 'Žádná data k dispozici',
  'empty.noFindings': 'Zatím žádná zjištění',
  'empty.noResults': 'Nebyly nalezeny žádné výsledky',

  // Error messages
  'error.generic': 'Něco se pokazilo',
  'error.loadFailed': 'Nepodařilo se načíst data',
  'error.parseFailed': 'Nepodařilo se zpracovat soubor',

  // Settings labels
  'settings.language': 'Jazyk',
  'settings.theme': 'Motiv',
  'settings.textSize': 'Velikost textu',

  // Finding statuses
  'findings.observed': 'Pozorováno',
  'findings.investigating': 'Vyšetřuje se',
  'findings.analyzed': 'Analyzováno',
  'findings.improving': 'Zlepšuje se',
  'findings.resolved': 'Vyřešeno',

  // Report labels
  'report.summary': 'Shrnutí',
  'report.findings': 'Zjištění',
  'report.recommendations': 'Doporučení',
  'report.evidence': 'Důkazy',

  // Data input labels
  'data.pasteData': 'Vložit data',
  'data.uploadFile': 'Nahrát soubor',
  'data.columnMapping': 'Mapování sloupců',
  'data.measureColumn': 'Měřicí sloupec',
  'data.factorColumn': 'Sloupec faktoru',
  'data.addData': 'Přidat data',
  'data.editData': 'Upravit data',
  'data.showDataTable': 'Zobrazit datovou tabulku',
  'data.hideDataTable': 'Skrýt datovou tabulku',

  // Status
  'status.cached': 'V mezipaměti',
  'status.loading': 'Načítání',
  'status.ai': 'AI',
};
