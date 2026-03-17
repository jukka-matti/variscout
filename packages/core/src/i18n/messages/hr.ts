import type { MessageCatalog } from '../types';

/** Croatian message catalog */
export const hr: MessageCatalog = {
  // Statistics labels
  'stats.mean': 'Srednja vrijednost',
  'stats.median': 'Medijan',
  'stats.stdDev': 'Stand. devijacija',
  'stats.samples': 'Uzorci',
  'stats.passRate': 'Postotak prolaza',
  'stats.range': 'Raspon',
  'stats.min': 'Min.',
  'stats.max': 'Maks.',
  'stats.target': 'Cilj',
  'stats.sigma': 'Sigma',

  // Chart labels
  'chart.observation': 'Opažanje',
  'chart.count': 'Broj',
  'chart.frequency': 'Frekvencija',
  'chart.value': 'Vrijednost',
  'chart.category': 'Kategorija',
  'chart.cumulative': 'Kumulativni %',
  'chart.clickToEdit': 'Kliknite za uređivanje',
  'chart.median': 'Medijan',
  'chart.q1': 'Q1',
  'chart.q3': 'Q3',
  'chart.noChannelData': 'Nema podataka kanala',
  'chart.selectChannel': 'Odaberite kanal',

  // Limit labels
  'limits.usl': 'GGT',
  'limits.lsl': 'DGT',
  'limits.ucl': 'GKG',
  'limits.lcl': 'DKG',
  'limits.mean': 'Srednja vrijednost',
  'limits.target': 'Cilj',

  // Navigation
  'nav.newAnalysis': 'Nova analiza',
  'nav.backToDashboard': 'Natrag na nadzornu ploču',
  'nav.settings': 'Postavke',
  'nav.export': 'Izvoz',
  'nav.presentation': 'Prezentacija',
  'nav.menu': 'Izbornik',
  'nav.moreActions': 'Više radnji',

  // Panel titles
  'panel.findings': 'Nalazi',
  'panel.dataTable': 'Tablica podataka',
  'panel.whatIf': 'Što ako',
  'panel.investigation': 'Istraživanje',
  'panel.coScout': 'CoScout',
  'panel.drillPath': 'Put dubinske analize',

  // View modes
  'view.list': 'Popis',
  'view.board': 'Ploča',
  'view.tree': 'Stablo',

  // Action buttons
  'action.save': 'Spremi',
  'action.cancel': 'Odustani',
  'action.delete': 'Izbriši',
  'action.edit': 'Uredi',
  'action.copy': 'Kopiraj',
  'action.close': 'Zatvori',
  'action.learnMore': 'Saznajte više',
  'action.download': 'Preuzmi',
  'action.apply': 'Primijeni',
  'action.reset': 'Poništi',
  'action.retry': 'Pokušaj ponovno',
  'action.send': 'Pošalji',
  'action.ask': 'Pitaj',
  'action.clear': 'Očisti',
  'action.copyAll': 'Kopiraj sve',
  'action.selectAll': 'Odaberi sve',

  // CoScout
  'coscout.send': 'Pošalji',
  'coscout.clear': 'Očisti razgovor',
  'coscout.stop': 'Zaustavi',
  'coscout.rateLimit': 'Dosegnuto ograničenje zahtjeva. Molimo pričekajte.',
  'coscout.contentFilter': 'Sadržaj je filtriran sigurnosnom politikom.',
  'coscout.error': 'Došlo je do pogreške. Molimo pokušajte ponovno.',

  // Display/settings
  'display.preferences': 'Postavke prikaza',
  'display.chartTextSize': 'Veličina teksta grafikona',
  'display.compact': 'Kompaktno',
  'display.normal': 'Normalno',
  'display.large': 'Veliko',
  'display.lockYAxis': 'Zaključaj os Y',
  'display.filterContext': 'Kontekst filtera',
  'display.showSpecs': 'Prikaži specifikacije',

  // Investigation
  'investigation.brief': 'Sažetak istraživanja',
  'investigation.assignedToMe': 'Dodijeljeno meni',
  'investigation.hypothesis': 'Hipoteza',
  'investigation.hypotheses': 'Hipoteze',
  'investigation.pinAsFinding': 'Prikvači kao nalaz',
  'investigation.addObservation': 'Dodaj opažanje',

  // Empty states
  'empty.noData': 'Nema dostupnih podataka',
  'empty.noFindings': 'Još nema nalaza',
  'empty.noResults': 'Nema pronađenih rezultata',

  // Error messages
  'error.generic': 'Nešto je pošlo po krivu',
  'error.loadFailed': 'Učitavanje podataka nije uspjelo',
  'error.parseFailed': 'Obrada datoteke nije uspjela',

  // Settings labels
  'settings.language': 'Jezik',
  'settings.theme': 'Tema',
  'settings.textSize': 'Veličina teksta',

  // Finding statuses
  'findings.observed': 'Uočeno',
  'findings.investigating': 'U istraživanju',
  'findings.analyzed': 'Analizirano',
  'findings.improving': 'U poboljšanju',
  'findings.resolved': 'Riješeno',

  // Report labels
  'report.summary': 'Sažetak',
  'report.findings': 'Nalazi',
  'report.recommendations': 'Preporuke',
  'report.evidence': 'Dokazi',

  // Data input labels
  'data.pasteData': 'Zalijepi podatke',
  'data.uploadFile': 'Učitaj datoteku',
  'data.columnMapping': 'Mapiranje stupaca',
  'data.measureColumn': 'Stupac mjerenja',
  'data.factorColumn': 'Stupac faktora',
  'data.addData': 'Dodaj podatke',
  'data.editData': 'Uredi podatke',
  'data.showDataTable': 'Prikaži tablicu podataka',
  'data.hideDataTable': 'Sakrij tablicu podataka',

  // Status
  'status.cached': 'Spremljeno',
  'status.loading': 'Učitavanje',
  'status.ai': 'UI',
};
