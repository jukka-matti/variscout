import type { MessageCatalog } from '../types';

/** Romanian message catalog */
export const ro: MessageCatalog = {
  // Statistics labels
  'stats.mean': 'Medie',
  'stats.median': 'Mediană',
  'stats.stdDev': 'Abat. std.',
  'stats.samples': 'Eșantioane',
  'stats.passRate': 'Rată conformitate',
  'stats.range': 'Amplitudine',
  'stats.min': 'Min',
  'stats.max': 'Max',
  'stats.target': 'Țintă',
  'stats.sigma': 'Sigma',

  // Chart labels
  'chart.observation': 'Observație',
  'chart.count': 'Număr',
  'chart.frequency': 'Frecvență',
  'chart.value': 'Valoare',
  'chart.category': 'Categorie',
  'chart.cumulative': 'Cumulativ %',
  'chart.clickToEdit': 'Clic pentru editare',
  'chart.median': 'Mediană',
  'chart.q1': 'Q1',
  'chart.q3': 'Q3',
  'chart.noChannelData': 'Fără date canal',
  'chart.selectChannel': 'Selectare canal',

  // Limit labels (Romanian standards)
  'limits.usl': 'LSS',
  'limits.lsl': 'LSI',
  'limits.ucl': 'LCS',
  'limits.lcl': 'LCI',
  'limits.mean': 'Medie',
  'limits.target': 'Țintă',

  // Navigation
  'nav.newAnalysis': 'Analiză nouă',
  'nav.backToDashboard': 'Înapoi la panou',
  'nav.settings': 'Setări',
  'nav.export': 'Exportare',
  'nav.presentation': 'Prezentare',
  'nav.menu': 'Meniu',
  'nav.moreActions': 'Mai multe acțiuni',

  // Panel titles
  'panel.findings': 'Constatări',
  'panel.dataTable': 'Tabel de date',
  'panel.whatIf': 'Ce-ar fi dacă',
  'panel.investigation': 'Investigație',
  'panel.coScout': 'CoScout',
  'panel.drillPath': 'Cale de detaliere',

  // View modes
  'view.list': 'Listă',
  'view.board': 'Panou',
  'view.tree': 'Arbore',

  // Action buttons
  'action.save': 'Salvare',
  'action.cancel': 'Anulare',
  'action.delete': 'Ștergere',
  'action.edit': 'Editare',
  'action.copy': 'Copiere',
  'action.close': 'Închidere',
  'action.learnMore': 'Aflați mai multe',
  'action.download': 'Descărcare',
  'action.apply': 'Aplicare',
  'action.reset': 'Resetare',
  'action.retry': 'Reîncercare',
  'action.send': 'Trimitere',
  'action.ask': 'Întrebare',
  'action.clear': 'Ștergere',
  'action.copyAll': 'Copiere tot',
  'action.selectAll': 'Selectare tot',

  // CoScout
  'coscout.send': 'Trimitere',
  'coscout.clear': 'Ștergere conversație',
  'coscout.stop': 'Oprire',
  'coscout.rateLimit': 'Limită de cereri atinsă. Vă rugăm așteptați.',
  'coscout.contentFilter': 'Conținut filtrat de politica de securitate.',
  'coscout.error': 'A apărut o eroare. Încercați din nou.',

  // Display/settings
  'display.preferences': 'Preferințe',
  'display.chartTextSize': 'Dimensiune text grafic',
  'display.compact': 'Compact',
  'display.normal': 'Normal',
  'display.large': 'Mare',
  'display.lockYAxis': 'Blocare axă Y',
  'display.filterContext': 'Context filtru',
  'display.showSpecs': 'Afișare specificații',

  // Investigation
  'investigation.brief': 'Raport de investigație',
  'investigation.assignedToMe': 'Atribuite mie',
  'investigation.hypothesis': 'Ipoteză',
  'investigation.hypotheses': 'Ipoteze',
  'investigation.pinAsFinding': 'Fixare ca constatare',
  'investigation.addObservation': 'Adăugare observație',

  // Empty states
  'empty.noData': 'Nu sunt date disponibile',
  'empty.noFindings': 'Nicio constatare încă',
  'empty.noResults': 'Niciun rezultat găsit',

  // Error messages
  'error.generic': 'Ceva nu a funcționat',
  'error.loadFailed': 'Încărcarea datelor a eșuat',
  'error.parseFailed': 'Procesarea fișierului a eșuat',

  // Settings labels
  'settings.language': 'Limbă',
  'settings.theme': 'Temă',
  'settings.textSize': 'Dimensiune text',

  // Finding statuses
  'findings.observed': 'Observat',
  'findings.investigating': 'În investigare',
  'findings.analyzed': 'Analizat',
  'findings.improving': 'În îmbunătățire',
  'findings.resolved': 'Rezolvat',

  // Report labels
  'report.summary': 'Rezumat',
  'report.findings': 'Constatări',
  'report.recommendations': 'Recomandări',
  'report.evidence': 'Dovezi',

  // Data input labels
  'data.pasteData': 'Lipire date',
  'data.uploadFile': 'Încărcare fișier',
  'data.columnMapping': 'Mapare coloane',
  'data.measureColumn': 'Coloană de măsurare',
  'data.factorColumn': 'Coloană factor',
  'data.addData': 'Adăugare date',
  'data.editData': 'Editare date',
  'data.showDataTable': 'Afișare tabel de date',
  'data.hideDataTable': 'Ascundere tabel de date',

  // Status
  'status.cached': 'În cache',
  'status.loading': 'Se încarcă',
  'status.ai': 'IA',
};
