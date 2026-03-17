import type { MessageCatalog } from '../types';

/**
 * Italian message catalog
 */
export const it: MessageCatalog = {
  // Statistics labels
  'stats.mean': 'Media',
  'stats.median': 'Mediana',
  'stats.stdDev': 'Dev. std.',
  'stats.samples': 'Campioni',
  'stats.passRate': 'Tasso di conformità',
  'stats.range': 'Escursione',
  'stats.min': 'Min',
  'stats.max': 'Max',
  'stats.target': 'Obiettivo',
  'stats.sigma': 'Sigma',

  // Chart labels
  'chart.observation': 'Osservazione',
  'chart.count': 'Conteggio',
  'chart.frequency': 'Frequenza',
  'chart.value': 'Valore',
  'chart.category': 'Categoria',
  'chart.cumulative': 'Cumulativo %',
  'chart.clickToEdit': 'Clicca per modificare',
  'chart.median': 'Mediana',
  'chart.q1': 'Q1',
  'chart.q3': 'Q3',
  'chart.noChannelData': 'Nessun dato canale',
  'chart.selectChannel': 'Seleziona canale',

  // Limit labels (UNI standards)
  'limits.usl': 'LSS',
  'limits.lsl': 'LSI',
  'limits.ucl': 'LCS',
  'limits.lcl': 'LCI',
  'limits.mean': 'Media',
  'limits.target': 'Obiettivo',

  // Navigation
  'nav.newAnalysis': 'Nuova analisi',
  'nav.backToDashboard': 'Torna alla dashboard',
  'nav.settings': 'Impostazioni',
  'nav.export': 'Esporta',
  'nav.presentation': 'Presentazione',
  'nav.menu': 'Menu',
  'nav.moreActions': 'Altre azioni',

  // Panel titles
  'panel.findings': 'Risultanze',
  'panel.dataTable': 'Tabella dati',
  'panel.whatIf': 'Ipotesi',
  'panel.investigation': 'Indagine',
  'panel.coScout': 'CoScout',
  'panel.drillPath': 'Percorso di analisi',

  // View modes
  'view.list': 'Elenco',
  'view.board': 'Bacheca',
  'view.tree': 'Albero',

  // Action buttons
  'action.save': 'Salva',
  'action.cancel': 'Annulla',
  'action.delete': 'Elimina',
  'action.edit': 'Modifica',
  'action.copy': 'Copia',
  'action.close': 'Chiudi',
  'action.learnMore': 'Scopri di più',
  'action.download': 'Scarica',
  'action.apply': 'Applica',
  'action.reset': 'Ripristina',
  'action.retry': 'Riprova',
  'action.send': 'Invia',
  'action.ask': 'Chiedi',
  'action.clear': 'Cancella',
  'action.copyAll': 'Copia tutto',
  'action.selectAll': 'Seleziona tutto',

  // CoScout
  'coscout.send': 'Invia',
  'coscout.clear': 'Cancella conversazione',
  'coscout.stop': 'Ferma',
  'coscout.rateLimit': 'Limite di richieste raggiunto. Attendere.',
  'coscout.contentFilter': 'Contenuto filtrato dalla policy di sicurezza.',
  'coscout.error': 'Si è verificato un errore. Riprovare.',

  // Display/settings
  'display.preferences': 'Preferenze',
  'display.chartTextSize': 'Dimensione testo grafico',
  'display.compact': 'Compatto',
  'display.normal': 'Normale',
  'display.large': 'Grande',
  'display.lockYAxis': 'Blocca asse Y',
  'display.filterContext': 'Contesto filtro',
  'display.showSpecs': 'Mostra specifiche',

  // Investigation
  'investigation.brief': 'Riepilogo indagine',
  'investigation.assignedToMe': 'Assegnati a me',
  'investigation.hypothesis': 'Ipotesi',
  'investigation.hypotheses': 'Ipotesi',
  'investigation.pinAsFinding': 'Fissa come risultanza',
  'investigation.addObservation': 'Aggiungi osservazione',

  // Empty states
  'empty.noData': 'Nessun dato disponibile',
  'empty.noFindings': 'Nessuna risultanza',
  'empty.noResults': 'Nessun risultato trovato',

  // Error messages
  'error.generic': 'Qualcosa è andato storto',
  'error.loadFailed': 'Caricamento dati non riuscito',
  'error.parseFailed': 'Analisi del file non riuscita',

  // Settings labels
  'settings.language': 'Lingua',
  'settings.theme': 'Tema',
  'settings.textSize': 'Dimensione testo',

  // Finding statuses
  'findings.observed': 'Osservato',
  'findings.investigating': 'In indagine',
  'findings.analyzed': 'Analizzato',
  'findings.improving': 'In miglioramento',
  'findings.resolved': 'Risolto',

  // Report labels
  'report.summary': 'Riepilogo',
  'report.findings': 'Risultanze',
  'report.recommendations': 'Raccomandazioni',
  'report.evidence': 'Evidenze',

  // Data input labels
  'data.pasteData': 'Incolla dati',
  'data.uploadFile': 'Carica file',
  'data.columnMapping': 'Mappatura colonne',
  'data.measureColumn': 'Colonna misura',
  'data.factorColumn': 'Colonna fattore',
  'data.addData': 'Aggiungi dati',
  'data.editData': 'Modifica dati',
  'data.showDataTable': 'Mostra tabella dati',
  'data.hideDataTable': 'Nascondi tabella dati',

  // Status
  'status.cached': 'In cache',
  'status.loading': 'Caricamento',
  'status.ai': 'IA',
};
