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
  'display.density': "Densité d'affichage",
  'display.lockYAxis': "Verrouiller l'axe Y",
  'display.filterContext': 'Contexte de filtre',
  'display.showSpecs': 'Afficher les spécifications',

  // Investigation
  'investigation.brief': "Rapport d'investigation",
  'investigation.assignedToMe': 'Assigné à moi',
  'investigation.question': 'Question',
  'investigation.questions': 'Questions',
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
  'data.issueStatementPlaceholder': 'Décrivez ce que vous souhaitez étudier…',
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
  'data.addQuestion': 'Ajouter une hypothèse',
  'data.removeQuestion': "Supprimer l'hypothèse",
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

  // AI action tool labels
  'ai.tool.applyFilter': 'Appliquer un filtre',
  'ai.tool.clearFilters': 'Effacer les filtres',
  'ai.tool.switchFactor': 'Changer de facteur',
  'ai.tool.createFinding': 'Créer un constat',
  'ai.tool.createQuestion': 'Créer une hypothèse',
  'ai.tool.suggestAction': 'Suggérer une action',
  'ai.tool.shareFinding': 'Partager un constat',
  'ai.tool.publishReport': 'Publier le rapport',
  'ai.tool.notifyOwners': 'Notifier les responsables',
  'ai.tool.suggestIdea': "Suggérer une idée d'amélioration",
  'ai.tool.suggestSaveFinding': "Enregistrer l'insight",
  'ai.tool.navigateTo': 'Navigate to',
  'ai.tool.answerQuestion': 'Answer question',

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
  'table.showAll': 'Afficher tout',

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

  // Chart limit labels
  'chart.label.ucl': 'LCS :',
  'chart.label.lcl': 'LCI :',
  'chart.label.mean': 'Moyenne :',
  'chart.label.tgt': 'Cible :',
  'chart.label.usl': 'LSS :',
  'chart.label.lsl': 'LSI :',
  'chart.label.value': 'Valeur :',
  'chart.label.n': 'n :',
  'chart.label.target': 'Cible :',

  // Chart status
  'chart.status.inControl': 'Sous contrôle',
  'chart.status.outOfControl': 'Hors contrôle (au-delà des LCS/LCI)',
  'chart.noDataProbPlot': 'Pas de données disponibles pour le diagramme de probabilité',

  // Chart edit affordances
  'chart.edit.spec': 'Cliquer pour modifier {spec}',
  'chart.edit.axisLabel': "Cliquer pour modifier le libellé de l'axe",
  'chart.edit.yAxis': "Cliquer pour modifier l'échelle de l'axe Y",
  'chart.edit.saveCancel': 'Entrée pour enregistrer · Échap pour annuler',

  // Performance table headers
  'chart.table.channel': 'Canal',
  'stats.cp': 'Cp',

  // Chart UI labels
  'chart.copyToClipboard': 'Copier le graphique dans le presse-papiers',
  'chart.maximize': 'Agrandir le graphique',
  'chart.type.ichart': 'I-Chart',
  'chart.type.boxplot': 'Boxplot',
  'chart.type.pareto': 'Pareto',
  'chart.drillHere': '↓ explorer ici',
  'chart.percent': 'Pourcentage',

  // Y-axis popover
  'chart.yAxisScale': "Échelle de l'axe Y",
  'validation.minLessThanMax': 'Min doit être inférieur à Max',
  'action.noChanges': 'Aucune modification',

  // Create factor modal
  'factor.create': 'Créer un facteur à partir de la sélection',
  'factor.name': 'Nom du facteur',
  'factor.nameEmpty': 'Le nom du facteur ne peut pas être vide',
  'factor.nameExists': 'Un facteur avec ce nom existe déjà',
  'factor.example': 'p. ex., Événements haute température',
  'factor.pointsMarked': '{count} points seront marqués comme :',
  'factor.createAndFilter': 'Créer et filtrer',
  'factor.filterExplanation':
    'La vue se filtrera automatiquement pour afficher uniquement les points sélectionnés.',

  // Characteristic type selector
  'charType.nominal': 'Nominal',
  'charType.nominalDesc': 'Centré sur la cible (p. ex., poids de remplissage)',
  'charType.smaller': 'Plus petit est mieux',
  'charType.smallerDesc': 'Plus bas est mieux (p. ex., défauts)',
  'charType.larger': 'Plus grand est mieux',
  'charType.largerDesc': 'Plus haut est mieux (p. ex., rendement)',

  // Investigation prompt
  'investigation.trackingPrompt':
    "Suivi de votre investigation — ouvrez le panneau d'investigation pour voir l'ensemble.",

  // Mobile category sheet
  'chart.highlight': 'Surligner :',
  'chart.highlightRed': 'Rouge',
  'chart.highlightAmber': 'Ambre',
  'chart.highlightGreen': 'Vert',
  'chart.clearHighlight': 'Effacer le surlignage',
  'chart.drillDown': 'Explorer « {category} »',
  'ai.askCoScout': 'Demander à CoScout à ce sujet',

  // Settings descriptions
  'display.lockYAxisDesc': "Maintient l'échelle pour la comparaison visuelle",
  'display.filterContextDesc':
    'Afficher le résumé des filtres actifs sous les en-têtes de graphiques',

  // Performance detected modal
  'performance.detected': 'Mode performance détecté',
  'performance.columnsFound': '{count} colonnes de mesure trouvées',
  'performance.labelQuestion': 'Que représentent ces canaux de mesure ?',
  'performance.labelExample': 'p. ex., Tête de remplissage, Cavité, Buse',
  'performance.enable': 'Activer le mode performance',

  // Finding editor & data types
  'finding.placeholder': "Qu'avez-vous constaté ?",
  'finding.note': 'Note du constat',
  'data.typeNumeric': 'Numérique',
  'data.typeCategorical': 'Catégoriel',
  'data.typeDate': 'Date',
  'data.typeText': 'Texte',
  'data.categories': 'catégories',

  // PWA HomeScreen
  'home.heading': "Explorer l'analyse de variation",
  'home.description':
    "Outil de formation gratuit à l'analyse de variation. Visualisez la variabilité, calculez la capabilité et trouvez où concentrer vos efforts — directement dans votre navigateur.",
  'home.divider': 'ou utilisez vos propres données',
  'home.pasteHelper': 'Copiez des lignes et collez — nous détecterons les colonnes automatiquement',
  'home.manualEntry': 'Ou saisissez les données manuellement',
  'home.upgradeHint':
    "Besoin de fonctionnalités d'équipe, de téléchargement de fichiers ou de projets enregistrés ?",

  // PWA navigation
  'nav.presentationMode': 'Mode présentation',
  'nav.hideFindings': 'Masquer les constats',

  // Export
  'export.asImage': 'Exporter en image',
  'export.asCsv': 'Exporter en CSV',
  'export.imageDesc': 'Capture PNG pour les présentations',
  'export.csvDesc': 'Fichier de données compatible tableur',

  // Sample section
  'sample.heading': 'Essayer un jeu de données exemple',
  'sample.allSamples': 'Tous les jeux de données exemples',
  'sample.featured': 'En vedette',
  'sample.caseStudies': 'Études de cas',
  'sample.journeys': "Parcours d'apprentissage",
  'sample.industry': "Exemples d'industrie",

  // View modes
  'view.stats': 'Statistiques',
  'display.appearance': 'Apparence',

  // Azure toolbar
  'data.manualEntry': 'Saisie manuelle',
  'data.editTable': 'Modifier la table de données',
  'toolbar.saveAs': 'Enregistrer sous…',
  'toolbar.saving': 'Enregistrement…',
  'toolbar.saved': 'Enregistré',
  'toolbar.saveFailed': "Échec de l'enregistrement",
  'toolbar.addMore': 'Ajouter des données',
  'report.scouting': "Rapport d'exploration",
  'export.csvFiltered': 'Exporter les données filtrées en CSV',
  'error.auth': "Erreur d'authentification",

  // File browse
  'file.browseLocal': 'Parcourir cet appareil',
  'file.browseSharePoint': 'Parcourir SharePoint',
  'file.open': 'Ouvrir le fichier',

  // Admin hub
  'admin.title': 'Admin',
  'admin.status': 'Statut',
  'admin.plan': 'Plan et fonctionnalités',
  'admin.teams': 'Configuration Teams',
  'admin.knowledge': 'Base de connaissances',
  'admin.troubleshooting': 'Dépannage',

  // Admin plan tab
  'admin.currentPlan': 'Actuel',
  'admin.feature': 'Fonctionnalité',
  'admin.manageSubscription': "Gérer l'abonnement dans Azure",
  'admin.planStandard': 'Standard',
  'admin.planTeam': 'Team',
  'admin.planStandardPrice': '79 €/mois',
  'admin.planTeamPrice': '199 €/mois',
  'admin.planStandardDesc': 'Analyse complète avec CoScout AI',
  'admin.planTeamDesc': 'Teams, OneDrive, SharePoint, base de connaissances',

  // Feature names
  'feature.charts': 'I-Chart, Boxplot, Pareto, Statistiques',
  'feature.capability': 'Analyse de capabilité (Cp/Cpk)',
  'feature.performance': 'Mode performance (multicanal)',
  'feature.anova': 'ANOVA et analyse factorielle',
  'feature.findingsWorkflow': "Constats et flux d'investigation",
  'feature.whatIf': 'Simulation et si',
  'feature.csvImport': 'Import CSV/Excel',
  'feature.reportExport': 'Export de rapports (PDF)',
  'feature.indexedDb': 'Stockage local IndexedDB',
  'feature.maxFactors': "Jusqu'à 6 facteurs",
  'feature.maxRows': "Jusqu'à 250K lignes",
  'feature.onedriveSync': 'Synchronisation de projets OneDrive',
  'feature.sharepointPicker': 'Sélecteur de fichiers SharePoint',
  'feature.teamsIntegration': 'Intégration Microsoft Teams',
  'feature.channelCollab': 'Collaboration par canaux',
  'feature.mobileUi': 'Interface optimisée pour mobile',
  'feature.coScoutAi': 'Assistant CoScout AI',
  'feature.narrativeBar': 'Aperçus NarrativeBar',
  'feature.chartInsights': 'Puces de suggestions graphiques',
  'feature.knowledgeBase': 'Base de connaissances (recherche SharePoint)',
  'feature.aiActions': 'Actions suggérées par IA',

  // Admin Teams setup
  'admin.teams.heading': 'Ajouter VariScout à Microsoft Teams',
  'admin.teams.description':
    "Générez un package d'application Teams pour votre déploiement et téléchargez-le dans votre centre d'administration Teams.",
  'admin.teams.running': 'Exécution dans Microsoft Teams',
  'admin.teams.step1': "ID client de l'inscription d'application (Optionnel)",
  'admin.teams.step1Desc':
    "Entrez l'ID client de votre inscription d'application Azure AD pour activer le SSO Teams dans le manifeste.",
  'admin.teams.step2': "Télécharger le package d'application Teams",
  'admin.teams.step2Desc':
    'Ce .zip contient le manifeste et les icônes préconfigurés pour votre déploiement.',
  'admin.teams.step3': "Télécharger dans le centre d'administration Teams",
  'admin.teams.step4': 'Ajouter VariScout à un canal',
  'admin.teams.download': "Télécharger le package d'application Teams",

  // Admin status tab
  'admin.checksResult': '{pass}/{total} vérifications réussies',
  'admin.runChecks': 'Exécuter toutes les vérifications',
  'admin.notApplicable': "Ne s'applique pas à votre plan",
  'admin.managePortal': 'Gérer dans Azure Portal',
  'admin.portalAccessNote':
    "Ces éléments nécessitent l'accès au Azure Portal et ne peuvent pas être vérifiés depuis le navigateur.",
  'admin.fixInPortal': 'Corriger dans Azure Portal : {label}',

  // Admin troubleshoot tab
  'admin.troubleshoot.intro':
    'Problèmes courants et comment les résoudre. Cliquez sur un problème pour voir les instructions étape par étape.',
  'admin.runCheck': 'Exécuter la vérification',
  'admin.checkPassed': "Vérification réussie — ce n'est peut-être pas le problème.",
  'admin.checkFailed': 'Vérification échouée — suivez les étapes ci-dessous.',
  'admin.issue.signin': 'Les utilisateurs ne peuvent pas se connecter',
  'admin.issue.signinDesc':
    "L'authentification Azure AD ne fonctionne pas ou les utilisateurs voient une page blanche.",
  'admin.issue.signinSteps':
    "Vérifiez que l'authentification App Service est activée dans Azure Portal.\nVérifiez que l'inscription d'application Azure AD a les URI de redirection correctes.\nAssurez-vous que l'inscription d'application a les « Jetons d'ID » activés sous Authentification.\nVérifiez que le locataire autorise la connexion des utilisateurs à l'application (Applications d'entreprise → Propriétés → Activé pour la connexion des utilisateurs).",
  'admin.issue.onedrive': 'La synchronisation OneDrive ne fonctionne pas',
  'admin.issue.onedriveDesc':
    'Les projets ne se synchronisent pas avec OneDrive ou les utilisateurs voient des erreurs de permission.',
  'admin.issue.onedriveSteps':
    "Vérifiez que l'inscription d'application a la permission déléguée « Files.ReadWrite ».\nVérifiez que le consentement administrateur a été accordé pour les permissions Graph.\nAssurez-vous que l'utilisateur a une licence OneDrive attribuée.\nEssayez de vous déconnecter et de vous reconnecter pour rafraîchir le jeton.",
  'admin.issue.coscout': 'CoScout ne répond pas',
  'admin.issue.coscoutDesc': "L'assistant IA ne génère pas de réponses ou affiche des erreurs.",
  'admin.issue.coscoutSteps':
    'Vérifiez que le point de terminaison IA est configuré dans le modèle ARM / les paramètres App Service.\nVérifiez que la ressource Azure AI Services est déployée et en fonctionnement.\nVérifiez que le déploiement du modèle existe (p. ex., gpt-4o) dans la ressource AI Services.\nVérifiez les quotas Azure AI Services — le déploiement a peut-être atteint les limites de taux.',
  'admin.issue.kbEmpty': 'La base de connaissances ne renvoie aucun résultat',
  'admin.issue.kbEmptyDesc':
    "« Rechercher la base de connaissances » de CoScout ne trouve rien malgré l'existence de documents.",
  'admin.issue.kbEmptySteps':
    "Vérifiez que le point de terminaison AI Search est configuré dans les paramètres App Service.\nVérifiez que la source de connaissances SharePoint distante a été créée dans AI Search.\nAssurez-vous qu'au moins 1 licence Microsoft 365 Copilot est active dans le locataire.\nVérifiez que l'utilisateur a accès SharePoint aux documents recherchés.\nVérifiez que le commutateur de prévisualisation de la base de connaissances est activé (Admin → onglet Base de connaissances).",
  'admin.issue.teamsTab': "L'onglet Teams ne s'affiche pas",
  'admin.issue.teamsTabDesc': "VariScout n'apparaît pas dans Teams ou l'onglet ne se charge pas.",
  'admin.issue.teamsTabSteps':
    "Vérifiez que le package d'application Teams (.zip) a été téléchargé dans le centre d'administration Teams.\nVérifiez que le contentUrl dans manifest.json correspond à l'URL de votre App Service.\nAssurez-vous que l'application est approuvée dans le centre d'administration Teams (non bloquée par une politique).\nEssayez de supprimer et de rajouter l'onglet dans le canal.\nSi vous utilisez un domaine personnalisé, vérifiez qu'il est dans le tableau validDomains du manifeste.",
  'admin.issue.newUser': "Un nouvel utilisateur ne peut pas accéder à l'application",
  'admin.issue.newUserDesc':
    'Un utilisateur nouvellement ajouté voit un accès refusé ou une page blanche.',
  'admin.issue.newUserSteps':
    "Dans Azure AD, allez dans Applications d'entreprise → VariScout → Utilisateurs et groupes.\nAjoutez l'utilisateur ou son groupe de sécurité à l'application.\nSi « Attribution d'utilisateur requise » est activé, assurez-vous que l'utilisateur a une attribution.\nVérifiez les politiques d'accès conditionnel qui pourraient bloquer l'utilisateur.",
  'admin.issue.aiSlow': 'Les réponses IA sont lentes',
  'admin.issue.aiSlowDesc':
    "CoScout met longtemps à répondre ou a fréquemment des délais d'expiration.",
  'admin.issue.aiSlowSteps':
    "Vérifiez la région de déploiement Azure AI Services — la latence augmente avec la distance.\nVérifiez que le déploiement du modèle a un quota TPM (jetons par minute) suffisant.\nEnvisagez une mise à niveau vers un déploiement à débit provisionné pour une latence constante.\nVérifiez si l'index AI Search est volumineux — envisagez d'optimiser la source de connaissances.",
  'admin.issue.forbidden': 'Erreurs « Forbidden »',
  'admin.issue.forbiddenDesc':
    "Les utilisateurs voient des erreurs 403 lors de l'accès à certaines fonctionnalités.",
  'admin.issue.forbiddenSteps':
    "Vérifiez que toutes les permissions Graph API requises ont le consentement administrateur.\nVérifiez que le magasin de jetons d'authentification App Service est activé.\nAssurez-vous que le jeton de l'utilisateur n'a pas expiré — essayez de vous déconnecter et de vous reconnecter.\nVérifiez les politiques d'accès conditionnel du locataire.",
  'admin.issue.kbPartial': 'La base de connaissances échoue pour certains utilisateurs',
  'admin.issue.kbPartialDesc':
    'La recherche dans la base de connaissances fonctionne pour les administrateurs mais pas pour les autres utilisateurs.',
  'admin.issue.kbPartialSteps':
    "Les sources de connaissances SharePoint distantes utilisent des permissions par utilisateur. Chaque utilisateur doit avoir un accès SharePoint aux documents.\nVérifiez si les utilisateurs concernés sont bloqués par des politiques d'accès conditionnel.\nVérifiez que le consentement administrateur a été accordé pour la permission déléguée Sites.Read.All.\nDemandez aux utilisateurs concernés de se déconnecter et de se reconnecter pour rafraîchir leur jeton.",

  // Workspace navigation
  'workspace.analysis': 'Analysis',
  'workspace.findings': 'Findings',
  'workspace.improvement': 'Improvement',

  // Synthesis card
  'synthesis.title': 'Suspected Cause',
  'synthesis.placeholder': 'The evidence points to…',
  'synthesis.coachNudge': 'Ready to summarize your understanding?',
  'synthesis.maxLength': 'Max 500 characters',

  // Improvement workspace
  'improve.title': 'Improvement Plan',
  'improve.backToAnalysis': 'Back to Analysis',
  'improve.fourDirections': 'Think: Prevent · Detect · Simplify · Eliminate',
  'improve.convertToActions': 'Convert selected → Actions',
  'improve.noIdeas': 'No improvement ideas yet',
  'improve.emptyNoFindings':
    'Pin findings from the Analysis view, then brainstorm improvement ideas here.',
  'improve.emptyNoSupported':
    'Answer your questions in the investigation. Answered questions unlock improvement brainstorming.',
  'improve.selectedCount': '{count} selected',
  'improve.timeframeBreakdown': '{low} low · {medium} med · {high} high',
  'improve.projectedCpk': 'Best projected Cpk: {value}',
  'improve.targetDelta': 'Δ {delta} to target',
  'improve.convertedToAction': '→ Action',

  // Effort labels
  'timeframe.justDo': 'Low',
  'timeframe.weeks': 'Medium',
  'timeframe.months': 'High',
  'timeframe.days': 'Days',
  'timeframe.justDo.description': 'Right now, existing resources, no approval needed',
  'timeframe.days.description': 'Minor coordination, can be done this week',
  'timeframe.weeks.description': 'Requires planning, moderate resources',
  'timeframe.months.description': 'Investment, cross-team, significant planning',
  'cost.label': 'Cost',
  'cost.none': 'None',
  'cost.low': 'Low',
  'cost.medium': 'Medium',
  'cost.high': 'High',
  'cost.amount': '€{amount}',
  'cost.budget': '€{spent} / €{budget}',
  'risk.label': 'Risk',
  'risk.low': 'Low',
  'risk.medium': 'Medium',
  'risk.high': 'High',
  'risk.veryHigh': 'Very high',
  'risk.notSet': 'Not set',
  'risk.axis1Label': '{axis} Impact',
  'risk.small': 'Small',
  'risk.significant': 'Significant',
  'risk.severe': 'Severe',
  'risk.none': 'None',
  'risk.possible': 'Possible',
  'risk.immediate': 'Immediate',
  'risk.preset.process': 'Process',
  'risk.preset.safety': 'Safety',
  'risk.preset.environmental': 'Environmental',
  'risk.preset.quality': 'Quality',
  'risk.preset.regulatory': 'Regulatory',
  'risk.preset.brand': 'Brand',
  'matrix.title': 'Prioritization Matrix',
  'matrix.listView': 'List',
  'matrix.matrixView': 'Matrix',
  'matrix.yAxis': 'Y-Axis',
  'matrix.xAxis': 'X-Axis',
  'matrix.color': 'Color',
  'matrix.preset.bangForBuck': 'Bang for Buck',
  'matrix.preset.quickImpact': 'Quick Impact',
  'matrix.preset.riskReward': 'Risk-Reward',
  'matrix.preset.budgetView': 'Budget View',
  'matrix.quickWins': 'Quick Wins',
  'matrix.clickToSelect': 'Click to select',
  'improve.maxRisk': 'Max risk: {level}',
  'improve.totalCost': '€{amount}',
  'improve.budgetStatus': '€{spent} / €{budget}',
  'improve.actionsDone': 'actions done',
  'improve.overdue': 'overdue',
  'improve.addVerification': 'Add verification',
  'improve.assessOutcome': 'Assess outcome',
  'improve.viewActions': 'View Actions',
  'improve.actions': 'actions',
  'improve.done': 'done',

  // Brainstorm modal
  'brainstorm.title': 'Brainstorm',
  'brainstorm.subtitle': 'No judging yet — just ideas',
  'brainstorm.selectSubtitle': 'Tap ideas to select',
  'brainstorm.inputPlaceholder': '+ type an idea...',
  'brainstorm.doneBrainstorming': 'Done brainstorming →',
  'brainstorm.addToPlan': 'Add {count} to plan →',
  'brainstorm.back': '← Back',
  'brainstorm.sparkMore': 'Spark more',
  'brainstorm.inviteTeam': 'Invite team',
  'brainstorm.copyLink': 'Copy link',
  'brainstorm.ideaCount': '{count} ideas · {directions} directions',
  'brainstorm.selectedCount': '{selected} of {total} selected',
  'brainstorm.parkedLabel': 'Parked ideas',
  'brainstorm.triggerButton': 'Brainstorm',
  'brainstorm.joinToast.title': 'Brainstorm session started',
  'brainstorm.joinToast.body': '{name} started brainstorming ideas for {cause}',
  'brainstorm.joinToast.join': 'Join session',
  'brainstorm.joinToast.later': 'Later',

  'timeframe.label': 'Délai',

  // Idea direction labels (Four Ideation Directions)
  'settings.improvementEvaluation': 'Improvement Evaluation',
  'settings.riskAxis1': 'Risk Axis 1',
  'settings.riskAxis2': 'Risk Axis 2',
  'settings.improvementBudget': 'Improvement Budget',
  'matrix.selected': 'Selected',
  'matrix.axis.benefit': 'Benefit',
  'matrix.axis.timeframe': 'Timeframe',
  'matrix.axis.cost': 'Cost',
  'matrix.axis.risk': 'Risk',
  'benefit.low': 'Low',
  'benefit.medium': 'Medium',
  'benefit.high': 'High',
  'idea.direction': 'Direction',
  'idea.prevent': 'Prevent',
  'idea.detect': 'Detect',
  'idea.simplify': 'Simplify',
  'idea.eliminate': 'Eliminate',
  'idea.whatIfSimulator': 'What-If Simulator',
  'idea.askCoScout': 'Ask CoScout',
  'idea.delete': 'Delete idea',
  'idea.addPlaceholder': 'Add improvement idea...',
  'idea.addButton': 'Add',
  'idea.askCoScoutForIdeas': 'Ask CoScout for ideas',
  'idea.moreOptions': 'More options',
  'idea.riskAssessment': 'Risk assessment',

  // Question role labels
  'question.primary': 'Primary',
  'question.contributing': 'Contributing',
  // Projected vs actual
  'outcome.projectedVsActual': 'Projected {projected} → Actual {actual}',
  'outcome.delta': '({sign}{delta})',
  'improve.convergenceNudge':
    'Your evidence is converging \u2014 summarize what you\u2019ve learned in the Improvement Plan.',

  // Yamazumi (Time Study)
  'yamazumi.detected.title': 'Time Study Data Detected',
  'yamazumi.detected.confidence': 'confidence',
  'yamazumi.detected.description':
    'Your data contains activity type classifications and cycle times suitable for Yamazumi analysis.',
  'yamazumi.detected.activityType': 'Activity Type',
  'yamazumi.detected.cycleTime': 'Cycle Time',
  'yamazumi.detected.step': 'Process Step',
  'yamazumi.detected.reason': 'Waste Reason',
  'yamazumi.detected.taktTime': 'Takt Time (optional)',
  'yamazumi.detected.taktPlaceholder': 'e.g., 120 seconds',
  'yamazumi.detected.decline': 'Use Standard Mode',
  'yamazumi.detected.enable': 'Enable Yamazumi Mode',
  'yamazumi.metric.total': 'Total',
  'yamazumi.metric.va': 'VA',
  'yamazumi.metric.nva': 'NVA',
  'yamazumi.metric.waste': 'Waste',
  'yamazumi.metric.wait': 'Wait',
  'yamazumi.pareto.steps-total': 'Steps by Total Time',
  'yamazumi.pareto.steps-waste': 'Steps by Waste Time',
  'yamazumi.pareto.steps-nva': 'Steps by NVA Time',
  'yamazumi.pareto.activities': 'Activities by Time',
  'yamazumi.pareto.reasons': 'Waste Reasons',
  'yamazumi.summary.vaRatio': 'VA Ratio',
  'yamazumi.summary.efficiency': 'Process Efficiency',
  'yamazumi.summary.leadTime': 'Total Lead Time',
  'yamazumi.summary.takt': 'Takt Time',
  'yamazumi.summary.setTakt': 'Set',
  'yamazumi.summary.overTakt': 'steps over takt',
  'yamazumi.takt': 'Takt',
  'yamazumi.mode.label': 'Yamazumi',
  'yamazumi.mode.switch': 'Switch to Yamazumi',

  // Report workspace view
  'report.cpkLearningLoop': 'Cpk Learning Loop',
  'report.verdict.effective': 'Effective',
  'report.verdict.partiallyEffective': 'Partially effective',
  'report.verdict.notEffective': 'Not effective',
  'report.cpk.before': 'Before',
  'report.cpk.projected': 'Projected',
  'report.cpk.actual': 'Actual',
  'report.cpk.pendingVerification': 'Pending verification',
  'report.cpk.metProjection': 'Met projection',
  'report.cpk.fromProjection': '{delta} from projection',
  'report.questionTree': 'Question Tree',
  'report.question.answered': 'Answered',
  'report.question.investigating': 'Investigating',
  'report.question.ruledOut': 'Ruled Out',
  'report.question.open': 'Open',
  'report.type.analysisSnapshot': 'Analysis Snapshot',
  'report.type.investigationReport': 'Investigation Report',
  'report.type.improvementStory': 'Improvement Story',
  'report.sections': 'Sections',
  'report.audience.technical': 'Technical',
  'report.audience.summary': 'Summary',
  'report.workspace.analysis': 'ANALYSIS',
  'report.workspace.findings': 'FINDINGS',
  'report.workspace.improvement': 'IMPROVEMENT',
  'report.action.copyAllCharts': 'Copy All Charts',
  'report.action.saveAsPdf': 'Save as PDF',
  'report.action.shareReport': 'Share Report',
  'report.action.publishToSharePoint': 'Publish to SharePoint',
  'report.action.publishedToSharePoint': 'Published to SharePoint',
  'report.publish.rendering': 'Rendering report\u2026',
  'report.publish.uploading': 'Uploading\u2026',
  'report.publish.exists': 'Report already exists in SharePoint.',
  'report.publish.replace': 'Replace',
  'report.publish.failed': 'Publish failed',
  'report.publish.tryAgain': 'Try again',
  'report.selectedCount': '{count} selected',
  'report.bestProjectedCpk': 'Best projected Cpk: {value}',
  'report.meetsTarget': '(meets target)',
  'report.costCategory': '{category} cost',
  'report.noCost': 'No cost',
  'report.riskLevel': '{level} risk',

  // Factor Intelligence
  'fi.title': 'Intelligence des Facteurs',
  'fi.ranking': 'Classement des facteurs (R² ajusté)',
  'fi.layer2': 'Niveau 2 · Effets Principaux',
  'fi.layer3': 'Niveau 3 · Interactions entre Facteurs',
  'fi.investigate': 'Investiguer →',
  'fi.notSignificant': 'non significatif (p={value})',
  'fi.explainsSingle': '{factor} explique {pct}% de la variation à lui seul.',
  'fi.explainsMultiple': '{factors} expliquent ensemble {pct}% de la variation.',
  'fi.layer2Locked': 'Niveau 2 (Effets Principaux) se déverrouille quand R²adj > {threshold}%',
  'fi.layer2Current': ' — actuellement {value}%',
  'fi.layer3Locked': 'Niveau 3 (Interactions) se déverrouille quand ≥2 facteurs sont significatifs',
  'fi.layer3Current': ' — actuellement {count} significatifs',
  'fi.best': 'Meilleur',
  'fi.range': 'Étendue',
  'fi.interactionDetected':
    "Interaction détectée : l'effet de {factorA} dépend du niveau de {factorB}.",
  'fi.noInteraction':
    'Aucune interaction significative — les effets sont approximativement additifs.',

  // Capability suggestion modal
  'capability.suggestion.title': 'Specification limits set',
  'capability.suggestion.description':
    'Would you like to start with the Capability view to check if your subgroups are meeting the Cpk target?',
  'capability.suggestion.whatYouSee': "What you'll see:",
  'capability.suggestion.bullet1': 'I-Chart plotting Cp and Cpk per subgroup',
  'capability.suggestion.bullet2': 'Whether subgroups consistently meet your target',
  'capability.suggestion.bullet3': 'Centering loss (gap between Cp and Cpk)',
  'capability.suggestion.startCapability': 'Start with Capability View',
  'capability.suggestion.standardView': 'Standard View',
  'capability.suggestion.footer': 'You can switch anytime using the toggle in the I-Chart header.',

  // Annotations
  'annotations.redHighlight': 'Red highlight',
  'annotations.amberHighlight': 'Amber highlight',
  'annotations.greenHighlight': 'Green highlight',
  'annotations.active': 'active',

  // Subgroup
  'subgroup.method': 'Subgroup Method',
  'subgroup.fixedSize': 'Fixed size',
  'subgroup.byColumn': 'By column',
  'subgroup.configuration': 'Subgroup Configuration',
  'subgroup.configureSubgroups': 'Configure subgroups',

  // Capability
  'capability.specsDetected': 'Specification limits detected',
  'capability.startCapabilityView': 'Start Capability View',
  'capability.cpkTrendSubgroup': 'Cpk trend per subgroup',
  'capability.standardView': 'Standard View',
  'capability.individualValuesChart': 'Individual values chart',
  'capability.switchAnytime': 'You can switch anytime using the toggle in the I-Chart header.',
  'capability.type': 'Type:',
  'capability.cpkTarget': 'Cpk target:',
  'capability.insufficientData': 'Insufficient data',
  'capability.meetsTarget': 'Meets target',
  'capability.marginal': 'Marginal',
  'capability.belowTarget': 'Below target',

  // Quality (additional)
  'quality.dataFile': 'Data File',

  // Finding (additional)
  'finding.addObservation': 'Add observation',

  // Action (additional)
  'action.continue': 'Continue',

  // Upgrade (additional)
  'upgrade.freeTierLimitation': 'Free tier limitation',
  'upgrade.fromPrice': 'From \u20ac79/month',
};
