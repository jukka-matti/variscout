import type { MessageCatalog } from '../types';

/**
 * French message catalog
 */
export const fr: MessageCatalog = {
  // Statistics labels
  'stats.mean': 'Moyenne',
  'stats.median': 'Médiane',
  'stats.stdDev': 'Écart type',
  'stats.samples': 'Échantillons',
  'stats.passRate': 'Taux de conformité',
  'stats.range': 'Étendue',
  'stats.min': 'Min',
  'stats.max': 'Max',
  'stats.target': 'Cible',
  'stats.sigma': 'Sigma',

  // Chart labels
  'chart.observation': 'Observation',
  'chart.count': 'Nombre',
  'chart.frequency': 'Fréquence',
  'chart.value': 'Valeur',
  'chart.category': 'Catégorie',
  'chart.cumulative': 'Cumulatif %',
  'chart.clickToEdit': 'Cliquer pour modifier',
  'chart.median': 'Médiane',
  'chart.q1': 'Q1',
  'chart.q3': 'Q3',
  'chart.noChannelData': 'Pas de données de canal',
  'chart.selectChannel': 'Sélectionner un canal',

  // Limit labels (AFNOR standard)
  'limits.usl': 'LSS',
  'limits.lsl': 'LSI',
  'limits.ucl': 'LCS',
  'limits.lcl': 'LCI',
  'limits.mean': 'Moyenne',
  'limits.target': 'Cible',

  // Navigation
  'nav.newAnalysis': 'Nouvelle analyse',
  'nav.backToDashboard': 'Retour au tableau de bord',
  'nav.settings': 'Paramètres',
  'nav.export': 'Exporter',
  'nav.presentation': 'Présentation',
  'nav.menu': 'Menu',
  'nav.moreActions': "Plus d'actions",

  // Panel titles
  'panel.findings': 'Observations',
  'panel.dataTable': 'Tableau de données',
  'panel.whatIf': 'Et si',
  'panel.investigation': 'Investigation',
  'panel.coScout': 'CoScout',
  'panel.drillPath': "Chemin d'exploration",

  // View modes
  'view.list': 'Liste',
  'view.board': 'Tableau',
  'view.tree': 'Arbre',

  // Action buttons
  'action.save': 'Enregistrer',
  'action.cancel': 'Annuler',
  'action.delete': 'Supprimer',
  'action.edit': 'Modifier',
  'action.copy': 'Copier',
  'action.close': 'Fermer',
  'action.learnMore': 'En savoir plus',
  'action.download': 'Télécharger',
  'action.apply': 'Appliquer',
  'action.reset': 'Réinitialiser',
  'action.retry': 'Réessayer',
  'action.send': 'Envoyer',
  'action.ask': 'Demander',
  'action.clear': 'Effacer',
  'action.copyAll': 'Tout copier',
  'action.selectAll': 'Tout sélectionner',

  // CoScout
  'coscout.send': 'Envoyer',
  'coscout.clear': 'Effacer la conversation',
  'coscout.stop': 'Arrêter',
  'coscout.rateLimit': 'Limite de débit atteinte. Veuillez patienter.',
  'coscout.contentFilter': 'Contenu filtré par la politique de sécurité.',
  'coscout.error': 'Une erreur est survenue. Veuillez réessayer.',

  // Display/settings
  'display.preferences': 'Préférences',
  'display.chartTextSize': 'Taille du texte des graphiques',
  'display.compact': 'Compact',
  'display.normal': 'Normal',
  'display.large': 'Grand',
  'display.lockYAxis': "Verrouiller l'axe Y",
  'display.filterContext': 'Contexte de filtre',
  'display.showSpecs': 'Afficher les spécifications',

  // Investigation
  'investigation.brief': "Rapport d'investigation",
  'investigation.assignedToMe': 'Assigné à moi',
  'investigation.hypothesis': 'Hypothèse',
  'investigation.hypotheses': 'Hypothèses',
  'investigation.pinAsFinding': 'Épingler comme observation',
  'investigation.addObservation': 'Ajouter une observation',

  // Empty states
  'empty.noData': 'Aucune donnée disponible',
  'empty.noFindings': 'Aucune observation pour le moment',
  'empty.noResults': 'Aucun résultat trouvé',

  // Error messages
  'error.generic': 'Une erreur est survenue',
  'error.loadFailed': 'Échec du chargement des données',
  'error.parseFailed': "Échec de l'analyse du fichier",

  // Settings labels
  'settings.language': 'Langue',
  'settings.theme': 'Thème',
  'settings.textSize': 'Taille du texte',

  // Finding statuses
  'findings.observed': 'Observé',
  'findings.investigating': "En cours d'investigation",
  'findings.analyzed': 'Analysé',
  'findings.improving': 'En amélioration',
  'findings.resolved': 'Résolu',

  // Report labels
  'report.summary': 'Résumé',
  'report.findings': 'Observations',
  'report.recommendations': 'Recommandations',
  'report.evidence': 'Preuves',

  // Data input labels
  'data.pasteData': 'Coller les données',
  'data.uploadFile': 'Importer un fichier',
  'data.columnMapping': 'Correspondance des colonnes',
  'data.measureColumn': 'Colonne de mesure',
  'data.factorColumn': 'Colonne de facteur',
  'data.addData': 'Ajouter des données',
  'data.editData': 'Modifier les données',
  'data.showDataTable': 'Afficher le tableau de données',
  'data.hideDataTable': 'Masquer le tableau de données',

  // Status
  'status.cached': 'En cache',
  'status.loading': 'Chargement',
  'status.ai': 'IA',
};
