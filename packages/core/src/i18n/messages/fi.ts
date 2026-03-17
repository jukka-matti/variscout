import type { MessageCatalog } from '../types';

/**
 * Finnish message catalog
 */
export const fi: MessageCatalog = {
  // Statistics labels
  'stats.mean': 'Keskiarvo',
  'stats.median': 'Mediaani',
  'stats.stdDev': 'Keskihaj.',
  'stats.samples': 'Näytteet',
  'stats.passRate': 'Hyväksymis-%',
  'stats.range': 'Vaihteluväli',
  'stats.min': 'Min',
  'stats.max': 'Maks',
  'stats.target': 'Tavoite',
  'stats.sigma': 'Sigma',

  // Chart labels
  'chart.observation': 'Havainto',
  'chart.count': 'Lukumäärä',
  'chart.frequency': 'Frekvenssi',
  'chart.value': 'Arvo',
  'chart.category': 'Kategoria',
  'chart.cumulative': 'Kumulatiivinen %',
  'chart.clickToEdit': 'Napsauta muokataksesi',
  'chart.median': 'Mediaani',
  'chart.q1': 'Q1',
  'chart.q3': 'Q3',
  'chart.noChannelData': 'Ei kanavadataa',
  'chart.selectChannel': 'Valitse kanava',

  // Limit labels (SFS standard — uses ISO abbreviations)
  'limits.usl': 'USL',
  'limits.lsl': 'LSL',
  'limits.ucl': 'UCL',
  'limits.lcl': 'LCL',
  'limits.mean': 'Keskiarvo',
  'limits.target': 'Tavoite',

  // Navigation
  'nav.newAnalysis': 'Uusi analyysi',
  'nav.backToDashboard': 'Takaisin hallintapaneeliin',
  'nav.settings': 'Asetukset',
  'nav.export': 'Vie',
  'nav.presentation': 'Esitys',
  'nav.menu': 'Valikko',
  'nav.moreActions': 'Lisää toimintoja',

  // Panel titles
  'panel.findings': 'Havainnot',
  'panel.dataTable': 'Datataulukko',
  'panel.whatIf': 'Entä jos',
  'panel.investigation': 'Tutkimus',
  'panel.coScout': 'CoScout',
  'panel.drillPath': 'Porautumispolku',

  // View modes
  'view.list': 'Lista',
  'view.board': 'Taulu',
  'view.tree': 'Puu',

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
  'action.retry': 'Yritä uudelleen',
  'action.send': 'Lähetä',
  'action.ask': 'Kysy',
  'action.clear': 'Tyhjennä',
  'action.copyAll': 'Kopioi kaikki',
  'action.selectAll': 'Valitse kaikki',

  // CoScout
  'coscout.send': 'Lähetä',
  'coscout.clear': 'Tyhjennä keskustelu',
  'coscout.stop': 'Pysäytä',
  'coscout.rateLimit': 'Pyyntöraja saavutettu. Odota hetki.',
  'coscout.contentFilter': 'Sisältö suodatettu turvallisuuskäytännön mukaisesti.',
  'coscout.error': 'Tapahtui virhe. Yritä uudelleen.',

  // Display/settings
  'display.preferences': 'Asetukset',
  'display.chartTextSize': 'Kaavion tekstikoko',
  'display.compact': 'Tiivis',
  'display.normal': 'Normaali',
  'display.large': 'Suuri',
  'display.lockYAxis': 'Lukitse Y-akseli',
  'display.filterContext': 'Suodatinkonteksti',
  'display.showSpecs': 'Näytä spesifikaatiot',

  // Investigation
  'investigation.brief': 'Tutkimusraportti',
  'investigation.assignedToMe': 'Minulle osoitetut',
  'investigation.hypothesis': 'Hypoteesi',
  'investigation.hypotheses': 'Hypoteesit',
  'investigation.pinAsFinding': 'Kiinnitä havainnoksi',
  'investigation.addObservation': 'Lisää havainto',

  // Empty states
  'empty.noData': 'Ei dataa saatavilla',
  'empty.noFindings': 'Ei havaintoja vielä',
  'empty.noResults': 'Ei tuloksia',

  // Error messages
  'error.generic': 'Jokin meni pieleen',
  'error.loadFailed': 'Datan lataus epäonnistui',
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
  'report.evidence': 'Todisteet',

  // Data input labels
  'data.pasteData': 'Liitä data',
  'data.uploadFile': 'Lataa tiedosto',
  'data.columnMapping': 'Sarakkeiden yhdistäminen',
  'data.measureColumn': 'Mittaussarake',
  'data.factorColumn': 'Tekijäsarake',
  'data.addData': 'Lisää dataa',
  'data.editData': 'Muokkaa dataa',
  'data.showDataTable': 'Näytä datataulukko',
  'data.hideDataTable': 'Piilota datataulukko',

  // Status
  'status.cached': 'Välimuistissa',
  'status.loading': 'Ladataan',
  'status.ai': 'Tekoäly',
};
