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
  'display.density': 'Densità di visualizzazione',
  'display.lockYAxis': 'Blocca asse Y',
  'display.filterContext': 'Contesto filtro',
  'display.showSpecs': 'Mostra specifiche',

  // Investigation
  'investigation.brief': 'Riepilogo indagine',
  'investigation.assignedToMe': 'Assegnati a me',
  'investigation.question': 'Question',
  'investigation.questions': 'Questions',
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
  'report.kpi.samples': 'Campioni',
  'report.kpi.mean': 'Media',
  'report.kpi.variation': 'Variazione',
  'report.kpi.cpk': 'Cpk',
  'report.kpi.passRate': 'Tasso di conformità',
  'ai.propose': 'Proponi',
  'ai.applied': 'Applicato',
  'ai.dismissed': 'Rifiutato',
  'ai.expired': 'Scaduto',
  'staged.before': 'Prima',
  'staged.after': 'Dopo',
  'staged.comparison': 'Confronto',

  // Data input / Column mapping
  'data.mapHeading': 'Map Your Data',
  'data.confirmColumns': 'Confirm Columns',
  'data.selectOutcome': 'Select Outcome',
  'data.selectFactors': 'Select Factors',
  'data.analysisSection': 'Analysis Brief',
  'data.optional': 'optional',
  'data.issueStatementPlaceholder': 'Describe what you want to investigate…',
  'data.outcomeDesc': 'The measurement you want to analyze',
  'data.factorsDesc': 'Categories that might influence the outcome',
  'data.alreadyOutcome': 'Already selected as outcome',
  'data.showNumericOnly': 'Numeric only',
  'data.showCategoricalOnly': 'Categorical only',
  'data.showAllColumns': 'All columns',
  'data.improvementTarget': 'Improvement target',
  'data.metric': 'Metric',
  'data.startAnalysis': 'Start Analysis',
  'data.applyChanges': 'Apply Changes',
  'data.addQuestion': 'Add question',
  'data.removeQuestion': 'Remove question',
  'data.back': 'Back',
  'data.pasteInstructions': 'Paste your data here',
  'data.pasteSubtitle': 'Copy from Excel, CSV, or any spreadsheet',
  'data.useExample': 'Use example data',
  'data.analyzing': 'Analyzing…',
  'data.tipWithData': 'Tip: Include column headers in the first row',
  'data.tipNoData': 'Tip: Try pasting data from a spreadsheet or CSV file',
  'quality.allValid': 'All data valid',
  'quality.rowsReady': '{count} rows ready for analysis',
  'quality.rowsExcluded': '{count} rows excluded',
  'quality.missingValues': 'Missing values',
  'quality.nonNumeric': 'Non-numeric values',
  'quality.noVariation': 'No variation',
  'quality.emptyColumn': 'Empty column',
  'quality.noVariationWarning': 'This column has no variation — all values are identical',
  'quality.viewExcluded': 'View excluded',
  'quality.viewAll': 'View all',
  'manual.setupTitle': 'Manual Data Entry',
  'manual.analysisMode': 'Analysis mode',
  'manual.standard': 'Standard',
  'manual.standardDesc': 'Single measurement column with optional factors',
  'manual.performance': 'Performance',
  'manual.performanceDesc': 'Multiple measurement channels (fill heads, cavities)',
  'manual.outcome': 'Outcome column',
  'manual.outcomeExample': 'e.g. Weight, Length, Temperature',
  'manual.factors': 'Factors',
  'manual.addFactor': 'Add factor',
  'manual.measureLabel': 'Measure label',
  'manual.measureExample': 'e.g. Fill Head, Cavity, Nozzle',
  'manual.channelCount': 'Number of channels',
  'manual.channelRange': '{min}–{max} channels',
  'manual.startEntry': 'Start Entry',
  'manual.specs': 'Specifications',
  'manual.specsApplyAll': 'Apply to all channels',
  'manual.specsHelper': 'Set specification limits for the outcome column',
  'chart.legend.commonCause': 'Common Cause',
  'chart.legend.specialCause': 'Special Cause',
  'chart.legend.outOfSpec': 'Out-of-Spec',
  'chart.legend.inControl': 'In-Control',
  'chart.legend.randomVariation': 'Random variation',
  'chart.legend.defect': 'Customer defect',
  'chart.violation.aboveUsl': 'Above USL ({value})',
  'chart.violation.belowLsl': 'Below LSL ({value})',
  'chart.violation.aboveUcl': 'Above UCL — special cause',
  'chart.violation.belowLcl': 'Below LCL — special cause',
  'chart.violation.aboveUclFavorable': 'Above UCL — favorable shift',
  'chart.violation.belowLclFavorable': 'Below LCL — favorable shift',
  'chart.violation.nelson2': 'Nelson Rule 2 — run of {count}',
  'chart.violation.nelson3': 'Nelson Rule 3 — trend of {count}',
  'investigation.phaseInitial': 'Gather initial observations',
  'investigation.phaseDiverging': 'Explore multiple questions',
  'investigation.phaseValidating': 'Test and validate questions',
  'investigation.phaseConverging': 'Narrow to root cause',
  'investigation.phaseImproving': 'Implement and verify changes',
  'investigation.pdcaTitle': 'Verification Checklist',
  'investigation.verifyChart': 'I-Chart stable after change',
  'investigation.verifyStats': 'Cpk meets target',
  'investigation.verifyBoxplot': 'Boxplot spread reduced',
  'investigation.verifySideEffects': 'No side effects observed',
  'investigation.verifyOutcome': 'Outcome sustained over time',
  'investigation.uninvestigated': 'Uninvestigated Factors',
  'ai.tool.applyFilter': 'Apply filter',
  'ai.tool.clearFilters': 'Clear filters',
  'ai.tool.switchFactor': 'Switch factor',
  'ai.tool.createFinding': 'Create finding',
  'ai.tool.createQuestion': 'Create question',
  'ai.tool.suggestAction': 'Suggest action',
  'ai.tool.shareFinding': 'Share finding',
  'ai.tool.publishReport': 'Publish report',
  'ai.tool.notifyOwners': 'Notify owners',
  'ai.tool.suggestIdea': 'Suggest improvement idea',
  'ai.tool.suggestSaveFinding': 'Save insight',
  'ai.tool.navigateTo': 'Navigate to',
  'ai.tool.answerQuestion': 'Answer question',
  'report.kpi.inSpec': 'In Spec',
  'table.noData': 'No data to display',
  'table.page': 'Page {page} of {total}',
  'table.rowsPerPage': 'Rows per page',
  'table.editHint': 'Click a cell to edit',
  'table.excluded': 'Excluded',
  'table.deleteRow': 'Delete row',
  'table.addRow': 'Add row',
  'table.unsavedChanges': 'Unsaved changes',
  'table.showAll': 'Show all',
  'specs.title': 'Specification Limits',
  'specs.advancedSettings': 'Advanced settings',
  'specs.apply': 'Apply specifications',
  'specs.noChanges': 'No changes to apply',
  'specs.editTitle': 'Edit Specifications',
  'specs.lslLabel': 'Lower Specification Limit (LSL)',
  'specs.uslLabel': 'Upper Specification Limit (USL)',
  'upgrade.title': 'Upgrade Available',
  'upgrade.limitReached': 'You have reached the limit for this feature',
  'upgrade.upgrade': 'Upgrade',
  'upgrade.viewOptions': 'View options',
  'upgrade.featureLimit': '{feature} is limited to {limit} in this plan',
  'display.violin': 'Violin plot',
  'display.violinDesc': 'Show distribution shape',
  'display.contribution': 'Contribution',
  'display.contributionDesc': 'Show variation contribution',
  'display.sort': 'Sort',
  'display.ascending': 'Ascending',
  'display.descending': 'Descending',
  'stats.summary': 'Summary Statistics',
  'stats.histogram': 'Histogram',
  'stats.probPlot': 'Probability Plot',
  'stats.editSpecs': 'Edit specifications',
  'whatif.adjustMean': 'Adjust mean',
  'whatif.reduceVariation': 'Reduce variation',
  'whatif.currentProjected': 'Current vs Projected',
  'whatif.resetAdjustments': 'Reset adjustments',
  'whatif.yield': 'Projected yield',
  // Chart violation details (parameterized)
  'chart.violation.nelson2.detail':
    'Regola di Nelson 2 — serie di {count} {side} media (#{start}–{end})',
  'chart.violation.nelson3.detail':
    'Regola di Nelson 3 — tendenza di {count} {direction} (#{start}–{end})',
  'chart.violation.side.above': 'sopra',
  'chart.violation.side.below': 'sotto',
  'chart.violation.direction.increasing': 'crescente',
  'chart.violation.direction.decreasing': 'decrescente',

  // Parameterized messages
  'data.rowsLoaded': '{count} rows loaded',
  'findings.countLabel': '{count} findings',

  // Chart limit labels (colon-suffixed for SVG rendering)
  'chart.label.ucl': 'UCL:',
  'chart.label.lcl': 'LCL:',
  'chart.label.mean': 'Media:',
  'chart.label.tgt': 'Obi.:',
  'chart.label.usl': 'USL:',
  'chart.label.lsl': 'LSL:',
  'chart.label.value': 'Valore:',
  'chart.label.n': 'n:',
  'chart.label.target': 'Obiettivo:',

  // Chart status & empty states
  'chart.status.inControl': 'Sotto controllo',
  'chart.status.outOfControl': 'Fuori controllo (oltre UCL/LCL)',
  'chart.noDataProbPlot': 'Nessun dato disponibile per il diagramma di probabilità',

  // Chart edit affordances
  'chart.edit.spec': 'Clicca per modificare {spec}',
  'chart.edit.axisLabel': "Clicca per modificare l'etichetta dell'asse",
  'chart.edit.yAxis': "Clicca per modificare la scala dell'asse Y",
  'chart.edit.saveCancel': 'Invio per salvare · Esc per annullare',

  // Performance table headers
  'chart.table.channel': 'Canale',
  'stats.cp': 'Cp',

  // Chart UI labels
  'chart.copyToClipboard': 'Copia grafico negli appunti',
  'chart.maximize': 'Massimizza grafico',
  'chart.type.ichart': 'I-Chart',
  'chart.type.boxplot': 'Boxplot',
  'chart.type.pareto': 'Pareto',
  'chart.drillHere': '↓ approfondisci qui',
  'chart.percent': 'Percentuale',

  // Y-axis popover
  'chart.yAxisScale': 'Scala asse Y',
  'validation.minLessThanMax': 'Il minimo deve essere inferiore al massimo',
  'action.noChanges': 'Nessuna modifica',

  // Create factor modal
  'factor.create': 'Crea fattore dalla selezione',
  'factor.name': 'Nome fattore',
  'factor.nameEmpty': 'Il nome del fattore non può essere vuoto',
  'factor.nameExists': 'Un fattore con questo nome esiste già',
  'factor.example': 'es. Eventi ad alta temperatura',
  'factor.pointsMarked': '{count} punti saranno contrassegnati come:',
  'factor.createAndFilter': 'Crea e filtra',
  'factor.filterExplanation':
    'La vista verrà automaticamente filtrata per mostrare solo i punti selezionati.',

  // Characteristic type selector
  'charType.nominal': 'Nominale',
  'charType.nominalDesc': "Centrato sull'obiettivo (es. peso di riempimento)",
  'charType.smaller': 'Più piccolo è meglio',
  'charType.smallerDesc': 'Più basso è meglio (es. difetti)',
  'charType.larger': 'Più grande è meglio',
  'charType.largerDesc': 'Più alto è meglio (es. resa)',

  // Investigation prompt
  'investigation.trackingPrompt':
    "Monitoraggio dell'indagine — apri il pannello Indagine per vedere il quadro completo.",

  // Mobile category sheet
  'chart.highlight': 'Evidenzia:',
  'chart.highlightRed': 'Rosso',
  'chart.highlightAmber': 'Ambra',
  'chart.highlightGreen': 'Verde',
  'chart.clearHighlight': 'Rimuovi evidenziazione',
  'chart.drillDown': 'Approfondisci "{category}"',
  'ai.askCoScout': 'Chiedi a CoScout',

  // Settings descriptions
  'display.lockYAxisDesc': 'Mantiene la scala per il confronto visivo',
  'display.filterContextDesc':
    'Mostra il riepilogo dei filtri attivi sotto le intestazioni dei grafici',

  // Performance detected modal
  'performance.detected': 'Modalità Performance rilevata',
  'performance.columnsFound': '{count} colonne di misurazione trovate',
  'performance.labelQuestion': 'Cosa rappresentano questi canali di misurazione?',
  'performance.labelExample': 'es. Testina di riempimento, Cavità, Ugello',
  'performance.enable': 'Abilita modalità Performance',

  // Finding editor & data types
  'finding.placeholder': 'Cosa hai trovato?',
  'finding.note': 'Nota del risultato',
  'data.typeNumeric': 'Numerico',
  'data.typeCategorical': 'Categorico',
  'data.typeDate': 'Data',
  'data.typeText': 'Testo',
  'data.categories': 'categorie',

  // PWA HomeScreen
  'home.heading': "Esplora l'analisi della variazione",
  'home.description':
    "Strumento gratuito di formazione sull'analisi della variazione. Visualizza la variabilità, calcola la capacità e trova dove concentrarti — direttamente nel browser.",
  'home.divider': 'oppure usa i tuoi dati',
  'home.pasteHelper': 'Copia le righe e incolla — rileveremo le colonne automaticamente',
  'home.manualEntry': 'Oppure inserisci i dati manualmente',
  'home.upgradeHint':
    'Hai bisogno di funzionalità di squadra, caricamento file o progetti salvati?',

  // PWA navigation
  'nav.presentationMode': 'Modalità presentazione',
  'nav.hideFindings': 'Nascondi risultati',

  // Export
  'export.asImage': 'Esporta come immagine',
  'export.asCsv': 'Esporta come CSV',
  'export.imageDesc': 'Screenshot PNG per presentazioni',
  'export.csvDesc': 'File dati compatibile con fogli di calcolo',

  // Sample section
  'sample.heading': 'Prova un set di dati di esempio',
  'sample.allSamples': 'Tutti i set di dati di esempio',
  'sample.featured': 'In evidenza',
  'sample.caseStudies': 'Casi studio',
  'sample.journeys': 'Percorsi di apprendimento',
  'sample.industry': 'Esempi industriali',

  // View modes (additional)
  'view.stats': 'Statistiche',

  // Display (additional)
  'display.appearance': 'Aspetto',

  // Azure toolbar
  'data.manualEntry': 'Inserimento manuale',
  'data.editTable': 'Modifica tabella dati',
  'toolbar.saveAs': 'Salva con nome…',
  'toolbar.saving': 'Salvataggio…',
  'toolbar.saved': 'Salvato',
  'toolbar.saveFailed': 'Salvataggio fallito',
  'toolbar.addMore': 'Aggiungi dati',
  'report.scouting': 'Rapporto di Scouting',
  'export.csvFiltered': 'Esporta dati filtrati come CSV',
  'error.auth': 'Errore di autenticazione',

  // File browse
  'file.browseLocal': 'Sfoglia questo dispositivo',
  'file.browseSharePoint': 'Sfoglia SharePoint',
  'file.open': 'Apri file',

  // Admin hub
  'admin.title': 'Amministrazione',
  'admin.status': 'Stato',
  'admin.plan': 'Piano e funzionalità',
  'admin.teams': 'Configurazione Teams',
  'admin.knowledge': 'Knowledge Base',
  'admin.troubleshooting': 'Risoluzione problemi',

  // Admin plan tab
  'admin.currentPlan': 'Attuale',
  'admin.feature': 'Funzionalità',
  'admin.manageSubscription': 'Gestisci abbonamento in Azure',
  'admin.planStandard': 'Standard',
  'admin.planTeam': 'Team',
  'admin.planStandardPrice': '€79/mese',
  'admin.planTeamPrice': '€199/mese',
  'admin.planStandardDesc': 'Analisi completa con CoScout AI',
  'admin.planTeamDesc': 'Teams, OneDrive, SharePoint, Knowledge Base',

  // Feature names (plan matrix)
  'feature.charts': 'I-Chart, Boxplot, Pareto, Stats',
  'feature.capability': 'Analisi della capacità (Cp/Cpk)',
  'feature.performance': 'Modalità Performance (multi-canale)',
  'feature.anova': 'ANOVA e analisi fattoriale',
  'feature.findingsWorkflow': 'Flusso di lavoro risultati e indagine',
  'feature.whatIf': 'Simulazione What-If',
  'feature.csvImport': 'Importazione CSV/Excel',
  'feature.reportExport': 'Esportazione rapporto (PDF)',
  'feature.indexedDb': 'Archiviazione locale IndexedDB',
  'feature.maxFactors': 'Fino a 6 fattori',
  'feature.maxRows': 'Fino a 250K righe',
  'feature.onedriveSync': 'Sincronizzazione progetti OneDrive',
  'feature.sharepointPicker': 'Selettore file SharePoint',
  'feature.teamsIntegration': 'Integrazione Microsoft Teams',
  'feature.channelCollab': 'Collaborazione basata su canali',
  'feature.mobileUi': 'UI ottimizzata per mobile',
  'feature.coScoutAi': 'Assistente AI CoScout',
  'feature.narrativeBar': 'Approfondimenti NarrativeBar',
  'feature.chartInsights': 'Chip di approfondimento grafici',
  'feature.knowledgeBase': 'Knowledge Base (ricerca SharePoint)',
  'feature.aiActions': "Azioni suggerite dall'AI",

  // Admin Teams setup
  'admin.teams.heading': 'Aggiungi VariScout a Microsoft Teams',
  'admin.teams.description':
    'Genera un pacchetto app Teams per la tua distribuzione e caricalo nel centro di amministrazione Teams.',
  'admin.teams.running': "In esecuzione all'interno di Microsoft Teams",
  'admin.teams.step1': 'ID client registrazione app (opzionale)',
  'admin.teams.step1Desc':
    "Inserisci l'ID client della registrazione app Azure AD per abilitare il SSO di Teams nel manifesto.",
  'admin.teams.step2': 'Scarica il pacchetto app Teams',
  'admin.teams.step2Desc':
    'Questo .zip contiene il manifesto e le icone preconfigurate per la tua distribuzione.',
  'admin.teams.step3': 'Carica nel centro di amministrazione Teams',
  'admin.teams.step4': 'Aggiungi VariScout a un canale',
  'admin.teams.download': 'Scarica pacchetto app Teams',

  // Admin status tab
  'admin.checksResult': '{pass}/{total} controlli superati',
  'admin.runChecks': 'Esegui tutti i controlli',
  'admin.notApplicable': 'Non applicabile al tuo piano',
  'admin.managePortal': 'Gestisci nel portale Azure',
  'admin.portalAccessNote':
    "Questi elementi richiedono l'accesso al portale Azure e non possono essere verificati dal browser.",
  'admin.fixInPortal': 'Correggi nel portale Azure: {label}',

  // Admin troubleshoot tab
  'admin.troubleshoot.intro':
    'Problemi comuni e come risolverli. Clicca su un problema per vedere le istruzioni passo passo.',
  'admin.runCheck': 'Esegui controllo',
  'admin.checkPassed': 'Controllo superato — questo potrebbe non essere il problema.',
  'admin.checkFailed': 'Controllo fallito — segui i passaggi qui sotto.',
  'admin.issue.signin': 'Gli utenti non riescono ad accedere',
  'admin.issue.signinDesc':
    "L'autenticazione Azure AD non funziona o gli utenti vedono una pagina vuota.",
  'admin.issue.signinSteps':
    "Verifica che l'autenticazione App Service sia abilitata nel portale Azure.\nControlla che la registrazione app Azure AD abbia gli URI di reindirizzamento corretti.\nAssicurati che la registrazione app abbia i \"Token ID\" abilitati in Autenticazione.\nVerifica che il tenant permetta l'accesso degli utenti all'app (Applicazioni aziendali → Proprietà → Abilitato per l'accesso utenti).",
  'admin.issue.onedrive': 'La sincronizzazione OneDrive non funziona',
  'admin.issue.onedriveDesc':
    'I progetti non si sincronizzano su OneDrive o gli utenti vedono errori di autorizzazione.',
  'admin.issue.onedriveSteps':
    'Verifica che la registrazione app abbia il permesso delegato "Files.ReadWrite".\nControlla che il consenso dell\'amministratore sia stato concesso per i permessi Graph.\nAssicurati che l\'utente abbia una licenza OneDrive assegnata.\nProva a disconnetterti e riconnetterti per aggiornare il token.',
  'admin.issue.coscout': 'CoScout non risponde',
  'admin.issue.coscoutDesc': "L'assistente AI non genera risposte o mostra errori.",
  'admin.issue.coscoutSteps':
    "Verifica che l'endpoint AI sia configurato nel template ARM / impostazioni App Service.\nControlla che la risorsa Azure AI Services sia distribuita e in esecuzione.\nVerifica che la distribuzione del modello esista (es. gpt-4o) nella risorsa AI Services.\nControlla le quote di Azure AI Services — la distribuzione potrebbe aver raggiunto i limiti di velocità.",
  'admin.issue.kbEmpty': 'Knowledge Base non restituisce risultati',
  'admin.issue.kbEmptyDesc':
    'La "Ricerca Knowledge Base" di CoScout non trova nulla nonostante esistano documenti.',
  'admin.issue.kbEmptySteps':
    "Verifica che l'endpoint AI Search sia configurato nelle impostazioni App Service.\nControlla che la sorgente di conoscenza Remote SharePoint sia stata creata in AI Search.\nAssicurati che almeno 1 licenza Microsoft 365 Copilot sia attiva nel tenant.\nVerifica che l'utente abbia accesso SharePoint ai documenti cercati.\nControlla che il toggle di anteprima Knowledge Base sia abilitato (Amministrazione → scheda Knowledge Base).",
  'admin.issue.teamsTab': 'La scheda Teams non viene mostrata',
  'admin.issue.teamsTabDesc': 'VariScout non appare in Teams o la scheda non si carica.',
  'admin.issue.teamsTabSteps':
    "Verifica che il pacchetto app Teams (.zip) sia stato caricato nel centro di amministrazione Teams.\nControlla che il contentUrl del manifest.json corrisponda all'URL del tuo App Service.\nAssicurati che l'app sia approvata nel centro di amministrazione Teams (non bloccata da criteri).\nProva a rimuovere e aggiungere nuovamente la scheda nel canale.\nSe usi un dominio personalizzato, verifica che sia nell'array validDomains del manifesto.",
  'admin.issue.newUser': "Il nuovo utente non riesce ad accedere all'app",
  'admin.issue.newUserDesc': 'Un utente appena aggiunto vede un accesso negato o una pagina vuota.',
  'admin.issue.newUserSteps':
    "In Azure AD, vai a Applicazioni aziendali → VariScout → Utenti e gruppi.\nAggiungi l'utente o il suo gruppo di sicurezza all'app.\nSe usi \"Assegnazione utente richiesta\", assicurati che l'utente abbia un'assegnazione.\nControlla i criteri di accesso condizionale che potrebbero bloccare l'utente.",
  'admin.issue.aiSlow': 'Le risposte AI sono lente',
  'admin.issue.aiSlowDesc': 'CoScout impiega molto tempo per rispondere o va spesso in timeout.',
  'admin.issue.aiSlowSteps':
    "Controlla la regione di distribuzione di Azure AI Services — la latenza aumenta con la distanza.\nVerifica che la distribuzione del modello abbia una quota TPM (token al minuto) sufficiente.\nConsidera l'upgrade a una distribuzione con throughput provisionato per latenza costante.\nControlla se l'indice AI Search è grande — considera l'ottimizzazione della sorgente di conoscenza.",
  'admin.issue.forbidden': 'Errori "Forbidden"',
  'admin.issue.forbiddenDesc':
    'Gli utenti vedono errori 403 quando accedono a determinate funzionalità.',
  'admin.issue.forbiddenSteps':
    "Controlla che tutti i permessi Graph API richiesti abbiano il consenso dell'amministratore.\nVerifica che il token store dell'autenticazione App Service sia abilitato.\nAssicurati che il token dell'utente non sia scaduto — prova a disconnetterti e riconnetterti.\nControlla i criteri di accesso condizionale per il tenant.",
  'admin.issue.kbPartial': 'KB non funziona per alcuni utenti',
  'admin.issue.kbPartialDesc':
    'La ricerca Knowledge Base funziona per gli amministratori ma non per gli altri utenti.',
  'admin.issue.kbPartialSteps':
    "Le sorgenti di conoscenza Remote SharePoint usano permessi per utente. Ogni utente deve avere accesso SharePoint ai documenti.\nControlla se gli utenti interessati sono bloccati da criteri di accesso condizionale.\nVerifica che il consenso dell'amministratore sia stato concesso per il permesso delegato Sites.Read.All.\nChiedi agli utenti interessati di disconnettersi e riconnettersi per aggiornare il token.",

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

  'timeframe.label': 'Effort',

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
  'fi.title': 'Intelligenza dei Fattori',
  'fi.ranking': 'Classifica dei fattori (R² corretto)',
  'fi.layer2': 'Livello 2 · Effetti Principali',
  'fi.layer3': 'Livello 3 · Interazioni tra Fattori',
  'fi.investigate': 'Indaga →',
  'fi.notSignificant': 'non significativo (p={value})',
  'fi.explainsSingle': '{factor} spiega da solo il {pct}% della variazione.',
  'fi.explainsMultiple': '{factors} insieme spiegano il {pct}% della variazione.',
  'fi.layer2Locked': 'Livello 2 (Effetti Principali) si sblocca quando R²adj > {threshold}%',
  'fi.layer2Current': ' — attualmente {value}%',
  'fi.layer3Locked': 'Livello 3 (Interazioni) si sblocca quando ≥2 fattori sono significativi',
  'fi.layer3Current': ' — attualmente {count} significativi',
  'fi.best': 'Migliore',
  'fi.range': 'Escursione',
  'fi.interactionDetected':
    "Interazione rilevata: l'effetto di {factorA} dipende dal livello di {factorB}.",
  'fi.noInteraction':
    'Nessuna interazione significativa — gli effetti sono approssimativamente additivi.',

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
