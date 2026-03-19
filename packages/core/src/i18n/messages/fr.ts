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

  // Methodology Coach
  'coach.frame': 'Cadrer',
  'coach.scout': 'Explorer',
  'coach.investigate': 'Enquêter',
  'coach.improve': 'Améliorer',
  'coach.frameDesc': 'Définir le problème et ses limites',
  'coach.scoutDesc': 'Collecter des données et explorer les tendances',
  'coach.investigateDesc': 'Tester les hypothèses et trouver les causes',
  'coach.improveDesc': 'Mettre en œuvre les changements et vérifier les résultats',

  // Report KPIs
  'report.kpi.samples': 'Échantillons',
  'report.kpi.mean': 'Moyenne',
  'report.kpi.variation': 'Variation',
  'report.kpi.cpk': 'Cpk',
  'report.kpi.passRate': 'Taux de conformité',

  // AI Actions
  'ai.propose': 'Proposer',
  'ai.applied': 'Appliqué',
  'ai.dismissed': 'Rejeté',
  'ai.expired': 'Expiré',

  // Staged analysis
  'staged.before': 'Avant',
  'staged.after': 'Après',
  'staged.comparison': 'Comparaison',

  // Data input / Column mapping
  'data.mapHeading': 'Associer vos données',
  'data.confirmColumns': 'Confirmer les colonnes',
  'data.selectOutcome': 'Sélectionner la variable résultat',
  'data.selectFactors': 'Sélectionner les facteurs',
  'data.analysisSection': "Résumé d'analyse",
  'data.optional': 'facultatif',
  'data.problemPlaceholder': 'Décrivez le problème que vous étudiez…',
  'data.outcomeDesc': 'La mesure que vous souhaitez analyser',
  'data.factorsDesc': "Les catégories susceptibles d'influencer le résultat",
  'data.alreadyOutcome': 'Déjà sélectionné comme variable résultat',
  'data.showNumericOnly': 'Numériques uniquement',
  'data.showCategoricalOnly': 'Catégorielles uniquement',
  'data.showAllColumns': 'Toutes les colonnes',
  'data.improvementTarget': "Objectif d'amélioration",
  'data.metric': 'Indicateur',
  'data.startAnalysis': "Lancer l'analyse",
  'data.applyChanges': 'Appliquer les modifications',
  'data.addHypothesis': 'Ajouter une hypothèse',
  'data.removeHypothesis': "Supprimer l'hypothèse",
  'data.back': 'Retour',

  // Paste screen
  'data.pasteInstructions': 'Collez vos données ici',
  'data.pasteSubtitle': 'Copiez depuis Excel, un fichier CSV ou tout tableur',
  'data.useExample': 'Utiliser des données exemples',
  'data.analyzing': 'Analyse en cours…',
  'data.tipWithData': 'Conseil : incluez les en-têtes de colonnes dans la première ligne',
  'data.tipNoData': 'Conseil : essayez de coller des données depuis un tableur ou un fichier CSV',

  // Data quality
  'quality.allValid': 'Toutes les données sont valides',
  'quality.rowsReady': "{count} lignes prêtes pour l'analyse",
  'quality.rowsExcluded': '{count} lignes exclues',
  'quality.missingValues': 'Valeurs manquantes',
  'quality.nonNumeric': 'Valeurs non numériques',
  'quality.noVariation': 'Aucune variation',
  'quality.emptyColumn': 'Colonne vide',
  'quality.noVariationWarning':
    'Cette colonne ne présente aucune variation — toutes les valeurs sont identiques',
  'quality.viewExcluded': 'Voir les exclues',
  'quality.viewAll': 'Voir tout',

  // Manual entry
  'manual.setupTitle': 'Saisie manuelle des données',
  'manual.analysisMode': "Mode d'analyse",
  'manual.standard': 'Standard',
  'manual.standardDesc': 'Une seule colonne de mesure avec des facteurs facultatifs',
  'manual.performance': 'Performance',
  'manual.performanceDesc': 'Plusieurs canaux de mesure (têtes de remplissage, cavités)',
  'manual.outcome': 'Colonne résultat',
  'manual.outcomeExample': 'ex. Poids, Longueur, Température',
  'manual.factors': 'Facteurs',
  'manual.addFactor': 'Ajouter un facteur',
  'manual.measureLabel': 'Libellé de mesure',
  'manual.measureExample': 'ex. Tête de remplissage, Cavité, Buse',
  'manual.channelCount': 'Nombre de canaux',
  'manual.channelRange': '{min}–{max} canaux',
  'manual.startEntry': 'Commencer la saisie',
  'manual.specs': 'Spécifications',
  'manual.specsApplyAll': 'Appliquer à tous les canaux',
  'manual.specsHelper': 'Définir les limites de spécification pour la colonne résultat',

  // Chart legend
  'chart.legend.commonCause': 'Cause commune',
  'chart.legend.specialCause': 'Cause spéciale',
  'chart.legend.outOfSpec': 'Hors spécification',
  'chart.legend.inControl': 'Sous contrôle',
  'chart.legend.randomVariation': 'Variation aléatoire',
  'chart.legend.defect': 'Défaut client',

  // Chart violations
  'chart.violation.aboveUsl': 'Au-dessus de la LSS ({value})',
  'chart.violation.belowLsl': 'En dessous de la LSI ({value})',
  'chart.violation.aboveUcl': 'Au-dessus de la LCS — cause spéciale',
  'chart.violation.belowLcl': 'En dessous de la LCI — cause spéciale',
  'chart.violation.aboveUclFavorable': 'Au-dessus de la LCS — décalage favorable',
  'chart.violation.belowLclFavorable': 'En dessous de la LCI — décalage favorable',
  'chart.violation.nelson2': 'Règle de Nelson 2 — série de {count}',
  'chart.violation.nelson3': 'Règle de Nelson 3 — tendance de {count}',

  // Investigation sidebar
  'investigation.phaseInitial': 'Recueillir les observations initiales',
  'investigation.phaseDiverging': 'Explorer plusieurs hypothèses',
  'investigation.phaseValidating': 'Tester et valider les hypothèses',
  'investigation.phaseConverging': 'Converger vers la cause racine',
  'investigation.phaseImproving': 'Mettre en œuvre et vérifier les changements',
  'investigation.pdcaTitle': 'Liste de vérification',
  'investigation.verifyChart': 'Carte I stable après modification',
  'investigation.verifyStats': "Cpk conforme à l'objectif",
  'investigation.verifyBoxplot': 'Dispersion de la boîte à moustaches réduite',
  'investigation.verifySideEffects': 'Aucun effet secondaire observé',
  'investigation.verifyOutcome': 'Résultat maintenu dans le temps',
  'investigation.uninvestigated': 'Facteurs non étudiés',

  // Coach mobile phase titles
  'coach.frameTitle': 'Cadrer le problème',
  'coach.scoutTitle': 'Explorer les données',
  'coach.investigateTitle': 'Enquêter sur les causes',
  'coach.improveTitle': 'Améliorer le processus',

  // AI action tool labels
  'ai.tool.applyFilter': 'Appliquer un filtre',
  'ai.tool.clearFilters': 'Effacer les filtres',
  'ai.tool.switchFactor': 'Changer de facteur',
  'ai.tool.createFinding': 'Créer un constat',
  'ai.tool.createHypothesis': 'Créer une hypothèse',
  'ai.tool.suggestAction': 'Suggérer une action',
  'ai.tool.shareFinding': 'Partager un constat',
  'ai.tool.publishReport': 'Publier le rapport',
  'ai.tool.notifyOwners': 'Notifier les responsables',

  // Report
  'report.kpi.inSpec': 'Conforme',

  // Table
  'table.noData': 'Aucune donnée à afficher',
  'table.page': 'Page {page} sur {total}',
  'table.rowsPerPage': 'Lignes par page',
  'table.editHint': 'Cliquez sur une cellule pour la modifier',
  'table.excluded': 'Exclue',
  'table.deleteRow': 'Supprimer la ligne',
  'table.addRow': 'Ajouter une ligne',
  'table.unsavedChanges': 'Modifications non enregistrées',

  // Specs
  'specs.title': 'Limites de spécification',
  'specs.advancedSettings': 'Paramètres avancés',
  'specs.apply': 'Appliquer les spécifications',
  'specs.noChanges': 'Aucune modification à appliquer',
  'specs.editTitle': 'Modifier les spécifications',
  'specs.lslLabel': 'Limite de spécification inférieure (LSI)',
  'specs.uslLabel': 'Limite de spécification supérieure (LSS)',

  // Upgrade
  'upgrade.title': 'Mise à niveau disponible',
  'upgrade.limitReached': 'Vous avez atteint la limite pour cette fonctionnalité',
  'upgrade.upgrade': 'Mettre à niveau',
  'upgrade.viewOptions': 'Voir les options',
  'upgrade.featureLimit': '{feature} est limité à {limit} dans ce plan',

  // Display toggles
  'display.violin': 'Diagramme en violon',
  'display.violinDesc': 'Afficher la forme de la distribution',
  'display.contribution': 'Contribution',
  'display.contributionDesc': 'Afficher la contribution à la variation',
  'display.sort': 'Trier',
  'display.ascending': 'Croissant',
  'display.descending': 'Décroissant',

  // Stats panel
  'stats.summary': 'Statistiques récapitulatives',
  'stats.histogram': 'Histogramme',
  'stats.probPlot': 'Diagramme de probabilité',
  'stats.editSpecs': 'Modifier les spécifications',

  // WhatIf
  'whatif.adjustMean': 'Ajuster la moyenne',
  'whatif.reduceVariation': 'Réduire la variation',
  'whatif.currentProjected': 'Actuel vs Projeté',
  'whatif.resetAdjustments': 'Réinitialiser les ajustements',
  'whatif.yield': 'Rendement projeté',

  // Chart violation details (parameterized)
  'chart.violation.nelson2.detail':
    'Règle de Nelson 2 — série de {count} {side} moyenne (#{start}–{end})',
  'chart.violation.nelson3.detail':
    'Règle de Nelson 3 — tendance de {count} {direction} (#{start}–{end})',
  'chart.violation.side.above': 'au-dessus',
  'chart.violation.side.below': 'en dessous',
  'chart.violation.direction.increasing': 'croissante',
  'chart.violation.direction.decreasing': 'décroissante',

  // Parameterized messages
  'data.rowsLoaded': '{count} lignes chargées',
  'findings.countLabel': '{count} constats',
};
