import type { MessageCatalog } from '../types';

/**
 * Finnish message catalog
 */
export const fi: MessageCatalog = {
  // Statistics labels
  'stats.mean': 'Keskiarvo',
  'stats.median': 'Mediaani',
  'stats.stdDev': 'Keskihajonta',
  'stats.samples': 'Näytteet',
  'stats.passRate': 'Hyväksymis-%',
  'stats.range': 'Vaihteluväli',
  'stats.min': 'Min',
  'stats.max': 'Max',
  'stats.target': 'Tavoite',
  'stats.sigma': 'Sigma',

  // Chart labels
  'chart.observation': 'Havainto',
  'chart.count': 'Lukumäärä',
  'chart.frequency': 'Frekvenssi',
  'chart.value': 'Arvo',
  'chart.category': 'Kategoria',
  'chart.cumulative': 'Kumulatiivinen %',

  // Limit labels
  'limits.usl': 'YTR',
  'limits.lsl': 'ATR',
  'limits.ucl': 'YVR',
  'limits.lcl': 'AVR',
  'limits.mean': 'Keskiarvo',
  'limits.target': 'Tavoite',

  // Action buttons
  'action.save': 'Tallenna',
  'action.cancel': 'Peruuta',
  'action.delete': 'Poista',
  'action.edit': 'Muokkaa',
  'action.copy': 'Kopioi',
  'action.close': 'Sulje',
  'action.learnMore': 'Lue lisää',
  'action.download': 'Lataa',
  'action.apply': 'Käytä',
  'action.reset': 'Palauta',

  // Empty states
  'empty.noData': 'Ei dataa saatavilla',
  'empty.noFindings': 'Ei havaintoja vielä',
  'empty.noResults': 'Tuloksia ei löytynyt',

  // Error messages
  'error.generic': 'Jokin meni pieleen',
  'error.loadFailed': 'Datan lataaminen epäonnistui',
  'error.parseFailed': 'Tiedoston käsittely epäonnistui',

  // Settings labels
  'settings.language': 'Kieli',
  'settings.theme': 'Teema',
  'settings.textSize': 'Tekstikoko',

  // Finding statuses
  'findings.observed': 'Havaittu',
  'findings.investigating': 'Tutkitaan',
  'findings.analyzed': 'Analysoitu',
  'findings.improving': 'Parannetaan',
  'findings.resolved': 'Ratkaistu',

  // Report labels
  'report.summary': 'Yhteenveto',
  'report.findings': 'Havainnot',
  'report.recommendations': 'Suositukset',
  'report.evidence': 'Näyttö',

  // Data input labels
  'data.pasteData': 'Liitä data',
  'data.uploadFile': 'Lataa tiedosto',
  'data.columnMapping': 'Sarakemääritys',
  'data.measureColumn': 'Mittaussarake',
  'data.factorColumn': 'Tekijäsarake',
};
