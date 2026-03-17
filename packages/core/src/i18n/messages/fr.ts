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

  // Limit labels
  'limits.usl': 'LSS',
  'limits.lsl': 'LSI',
  'limits.ucl': 'LCS',
  'limits.lcl': 'LCI',
  'limits.mean': 'Moyenne',
  'limits.target': 'Cible',

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
};
