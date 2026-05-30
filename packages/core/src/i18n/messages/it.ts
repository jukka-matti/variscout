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
  'panel.analyze': 'Indagine',
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
  'analyze.brief': 'Riepilogo indagine',
  'analyze.assignedToMe': 'Assegnati a me',
  'analyze.pinAsFinding': 'Fissa come risultanza',
  'analyze.addObservation': 'Aggiungi osservazione',

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
  'analyze.phaseInitial': 'Gather initial observations',
  'analyze.phaseDiverging': 'Explore multiple questions',
  'analyze.phaseValidating': 'Test and validate questions',
  'analyze.phaseConverging': 'Narrow to contribution',
  'analyze.phaseImproving': 'Implement and verify changes',
  'analyze.pdcaTitle': 'Verification Checklist',
  'analyze.verifyChart': 'I-Chart stable after change',
  'analyze.verifyStats': 'Cpk meets target',
  'analyze.verifyBoxplot': 'Boxplot spread reduced',
  'analyze.verifySideEffects': 'No side effects observed',
  'analyze.verifyOutcome': 'Outcome sustained over time',
  'analyze.unanalyzed': 'Uninvestigated Factors',
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
  'ai.tool.sparkBrainstorm': 'Spark brainstorm ideas',
  'ai.tool.suggestSaveFinding': 'Save insight',
  'ai.tool.navigateTo': 'Navigate to',
  'ai.tool.answerQuestion': 'Answer question',
  'ai.tool.suggestHypothesis': 'Suggest hypothesis',
  'ai.tool.connectHubEvidence': 'Connect hub evidence',
  'ai.tool.suggestCausalLink': 'Suggest causal link',
  'ai.tool.highlightMapPattern': 'Highlight map pattern',
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
  'display.etaSquared': 'η²',
  'display.etaSquaredDesc': 'Show η² (effect size)',
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
  'boxplot.factor.label': 'Factor',

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

  // Analyze prompt
  'analyze.trackingPrompt':
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
  'admin.teams': 'Configurazione Teams',
  'admin.knowledge': 'Knowledge Base',
  'admin.troubleshooting': 'Risoluzione problemi',

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
  'workspace.process': 'Process',
  'workspace.explore': 'Explore',
  'workspace.analyze': 'Analyze',
  'workspace.findings': 'Findings',
  'workspace.improvement': 'Improvement',
  'workspace.improve': 'Improve',
  'workspace.project': 'Progetto',
  'workspace.report': 'Report',

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

  // Defect detected modal
  'defect.detected.title': 'Defect Data Detected',
  'defect.detected.confidence': 'confidence',
  'defect.detected.dataShape': 'Data shape',
  'defect.detected.defectType': 'Defect type',
  'defect.detected.count': 'Count',
  'defect.detected.result': 'Result',
  'defect.detected.unitsProduced': 'Units produced',
  'defect.detected.aggregationUnit': 'Group defects by',
  'defect.detected.dismiss': 'Use Standard Mode',
  'defect.detected.enable': 'Enable Defect Mode',
  'defect.detected.stepOfOrigin': 'Step of origin',
  'defect.detected.stepOfOriginHint':
    'Identifies which step caught each defect. Optional — defects anchor to outcome when not set.',

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
  'report.type.analysisSnapshot': 'Analysis Snapshot',
  'report.type.analyzeReport': 'Analyze Report',
  'report.type.improvementStory': 'Improvement Story',
  'report.sections': 'Sections',
  'report.audience.technical': 'Technical',
  'report.audience.summary': 'Summary',
  'report.workspace.analysis': 'ANALYSIS',
  'report.workspace.findings': 'FINDINGS',
  'report.workspace.improvement': 'IMPROVEMENT',
  'report.action.copyAllCharts': 'Copy All Charts',
  'report.action.saveAsPdf': 'Save as PDF',
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

  'action.drillDown': 'Drill Down',
  'action.viewDetails': 'View Details',

  // Canvas Wall overlay
  'canvas.wall.overlayLabel': 'Wall',
  'canvas.wall.overlayDescription':
    'Investigation Wall projected onto the canvas. Click any hub to open the Wall destination view.',
  'canvas.wall.shortcutLabel': 'Open Wall',

  // Investigation Wall
  'wall.status.proposed': 'Proposed',
  'wall.status.evidenced': 'Evidenced',
  'wall.status.confirmed': 'Confirmed',
  'wall.status.refuted': 'Refuted',
  'wall.status.needsDisconfirmation': 'Needs disconfirmation',
  'wall.card.hypothesisLabel': 'Mechanism Branch',
  'wall.card.findings': '{count} findings',
  'wall.card.evidenceGap': 'Evidence gap',
  'wall.card.missingColumn': '⚠ Condition references missing column',
  'wall.card.missingColumnAria': 'Condition references missing column',
  'wall.card.ariaLabel': 'Mechanism Branch {name}, {status}, {count} supporting clues',
  'wall.card.oneStepAway':
    '1 step away — running a disconfirmation test would promote this from evidenced to confirmed',
  'wall.problem.title': 'Problem condition',
  'wall.problem.eventsPerWeek': '{count} events',
  'wall.problem.ariaLabel': 'Problem condition: {column}, Cpk {cpk}, {count} events per week',
  'wall.scope.whatIf': 'If fixed: Cpk {value}',
  'wall.scope.coverage': 'Covers {value}%',
  'wall.evidence.supports': 'Supports',
  'wall.evidence.countsAgainst': 'Counts against',
  'wall.evidence.contributingFactors': 'Contributing factors',
  'wall.disconfirm.prompt': 'We tried to break this — did it hold?',
  'wall.disconfirm.descriptionLabel': 'What did you try?',
  'wall.disconfirm.verdictLabel': 'Did it hold?',
  'wall.disconfirm.verdictPending': 'Still checking',
  'wall.disconfirm.verdictSurvived': 'Held up (survived)',
  'wall.disconfirm.verdictRefuted': 'Broke it (refuted)',
  'wall.disconfirm.record': 'Record',
  'wall.disconfirm.cancel': 'Cancel',
  // ActionItem tasks on hypotheses (IM-4b Task 3)
  'wall.task.addButton': '+ Add Task',
  'wall.task.taskLabel': 'Task description',
  'wall.task.save': 'Save',
  'wall.task.cancel': 'Cancel',
  'wall.task.markDone': 'Mark Done',
  // Plan-owner data-collection task surface (IM-4b Task 4)
  'wall.collect.assigned': 'Assigned: collect {primaryFactor}',
  'wall.collect.status.planned': 'planned',
  'wall.collect.status.inProgress': 'in-progress',
  'wall.collect.status.complete': 'complete',
  'wall.collect.status.skipped': 'skipped',
  'wall.collect.due': 'Due: {date}',
  'wall.scope.archive': 'Archive scope {condition}',
  'wall.gate.and': 'AND',
  'wall.gate.or': 'OR',
  'wall.gate.not': 'NOT',
  'wall.gate.holds': 'HOLDS {matching}/{total}',
  'wall.gate.noTotals': '—/0',
  'wall.gate.ariaLabel': 'Gate {kind} {holds}',
  'wall.tributary.ariaLabel': 'Tributaries from Process Map',
  'wall.empty.ariaLabel': 'Mechanism Branch empty state',
  'wall.empty.title': 'Start a Mechanism Branch',
  'wall.empty.subtitle': 'Start from a suspected mechanism, question, or Factor Intelligence.',
  'wall.empty.writeHypothesis': 'Write a suspected mechanism',
  'wall.empty.seedFromFactorIntel': 'Seed 3 from Factor Intelligence',
  'wall.rail.title': 'CoScout',
  'wall.rail.openAria': 'Open narrator rail',
  'wall.rail.closeAria': 'Close narrator rail',
  'wall.rail.rootAria': 'Narrator rail',
  'wall.rail.openButton': 'Open rail',
  'wall.rail.empty': 'No suggestions yet.',
  'wall.missing.ariaLabel': 'Missing evidence digest',
  'wall.missing.title': 'Missing evidence',
  'wall.missing.tagline': 'Missing evidence · the detective move nobody ships ({count})',
  'wall.missing.processMap': 'Process Map grouping is available after FRAME mapping.',
  'wall.missing.collapsed': 'Show details',
  'wall.missing.expanded': 'Hide details',
  'wall.canvas.ariaLabel': 'Mechanism Branch workspace',
  'wall.cta.proposeHypothesis': 'Propose suspected mechanism from this finding',
  'wall.toolbar.groupByTributary': 'Group by tributary',
  'wall.toolbar.zoomIn': 'Zoom in',
  'wall.toolbar.zoomOut': 'Zoom out',
  'wall.toolbar.resetView': 'Reset view',
  'wall.palette.placeholder': 'Search hubs, questions, findings…',
  'wall.palette.empty': 'No matches',
  'wall.palette.kind.hub': 'BRANCH',
  'wall.palette.kind.finding': 'FINDING',
  'wall.minimap.ariaLabel': 'Investigation Wall minimap',
  // Brush-to-finding confirmation flow (RPS V1 PR4 Task 17) — TODO(i18n): translate
  'wall.brush.confirmIChart': 'Pin indices {start}-{end} on {factor} as finding?',
  'wall.brush.confirmIChartNoFactor': 'Pin range as finding?',
  'wall.brush.confirmBoxplot': 'Pin category "{category}" on {factor} as finding?',
  'wall.brush.confirmBoxplotNoFactor': 'Pin category "{category}" as finding?',
  'wall.brush.pin': 'Pin',
  'wall.brush.cancel': 'Cancel',
  'wall.brush.dialogAriaLabel': 'Pin selection as finding',

  // FRAME b0 lightweight render — TODO(i18n): translate
  'frame.b0.q1.headline': 'What do you want to investigate?',
  'frame.b0.q1.hint': 'your Y / output measurement',
  'frame.b0.q2.headline': 'What might be affecting it?',
  'frame.b0.q2.hint': "your X's / inputs",
  'frame.b0.runOrderHint': '(run order: {column})',
  'frame.b0.addProcessSteps.label': 'Add process steps',
  'frame.b0.addProcessSteps.helper': "optional — useful when your X's belong to specific stages",
  'frame.b0.addHypothesis.label': 'Add a hypothesis',
  'frame.b0.addHypothesis.helper': 'optional — what you suspect',
  'frame.b0.seeData.cta': 'See the data →',
  'frame.b0.seeData.pickYHint': 'Pick a Y first to see the analysis.',
  'frame.b0.step.addCtq': '+ add measurement at this step (optional)',
  'frame.b0.q1.empty': 'No numeric columns detected — add or import data to begin.', // TODO(i18n): translate
  'frame.b0.q2.empty': 'No X candidates — once you pick a Y, factor candidates appear here.', // TODO(i18n): translate
  'frame.b0.aria.yCandidates': 'Y candidate chips', // TODO(i18n): translate
  'frame.b0.aria.selectedXs': 'Selected X chips', // TODO(i18n): translate
  'frame.b0.aria.availableXs': 'Available X chips', // TODO(i18n): translate
  'frame.canvasOverlay.cta.control.notReady':
    "Available after you've implemented a process change to monitor",
  'frame.canvasOverlay.cta.handoff.notReady':
    'Available after sustainment monitoring confirms gains',
  'frame.b1.heading': 'Frame the investigation', // TODO(i18n): translate
  'frame.b1.description':
    'Build your process map so the analysis has context. The map drives mode selection and a measurement-gap report; the methodology wants CTS at the ocean, a CTQ per step, and at least one rational-subgroup axis.', // TODO(i18n): translate
  'frame.spec.notSet': 'spec: not set',
  'frame.spec.set': 'spec: set', // TODO(i18n): translate
  'frame.spec.add': '+ add spec',
  'frame.spec.editor.title': 'Set spec for {measure}',
  'frame.spec.editor.usl': 'USL',
  'frame.spec.editor.lsl': 'LSL',
  'frame.spec.editor.target': 'Target',
  'frame.spec.editor.cpkTarget': 'Cpk target',
  'frame.spec.editor.suggestedFromData': 'Suggested from data: mean ± 3σ. Confirm to save.',
  'frame.spec.editor.confirm': 'Save',
  'frame.spec.editor.cancel': 'Cancel',
  'frame.spec.editor.invalidRange': 'USL must be greater than LSL.', // TODO(i18n): translate
  'capability.noSpec.prompt': 'Set a target / spec on {measure} to see Cp/Cpk.',

  // Verify card segmented tabs — TODO(i18n): translate
  'verify.tabs.label': 'Verify view',
  'verify.tab.probability': 'Probability',
  'verify.tab.distribution': 'Distribution',
  'verify.tab.capability': 'Capability',
  'verify.tab.pareto': 'Pareto',

  // Time lens (ProcessHealthBar) — TODO(i18n): translate
  'timeLens.button': 'Time',
  'timeLens.popover.title': 'Time window',
  'timeLens.mode.cumulative': 'Cumulative',
  'timeLens.mode.rolling': 'Rolling',
  'timeLens.mode.fixed': 'Fixed',
  'timeLens.mode.openEnded': 'Open-ended',
  'timeLens.input.windowSize': 'Window size',
  'timeLens.input.anchor': 'Anchor',

  // TODO(i18n): translate canvas.* keys
  // Canvas — SystemLevelView
  'canvas.system.activeAnalyzes': 'Active investigations',
  'canvas.system.conformance': 'Conformance',
  'canvas.system.inbox': 'Inbox',
  'canvas.system.lensLabel': 'Lens: {lens}',
  'canvas.system.noNumericOutcome': 'No numeric outcome',
  'canvas.system.noOutcomePrompts': 'No outcome prompts',
  'canvas.system.noOutcomeTrend': 'No outcome trend',
  'canvas.system.openScout': 'Open SCOUT',
  'canvas.system.outcomeDistribution': 'Outcome distribution',
  'canvas.system.outcomeDrift': 'Outcome drift',
  'canvas.system.outOfSpecMessage': '{outcome} has {pct} readings outside spec.',
  'canvas.system.reviewAction': 'Review',

  // Canvas — CanvasLensPicker
  'canvas.lensPicker.ariaLabel': 'Canvas lenses',
  'canvas.lensPicker.lensAriaLabel': '{label} lens',
  'canvas.lensPicker.invalidAtLevel':
    "{lens} isn't available at {currentLevel} \u2014 try {suggestedLevel}.",

  // Canvas — lens labels & descriptions
  'canvas.lens.capability.description': 'Capability, Cpk trust, and step health.',
  'canvas.lens.capability.label': 'Capability',
  'canvas.lens.default.description': 'Step metrics, specs, and current card state.',
  'canvas.lens.default.label': 'Default',
  'canvas.lens.defect.description': 'Defect counts projected onto process steps.',
  'canvas.lens.defect.label': 'Defect',
  'canvas.lens.performance.description': 'Future within-step channel lens.',
  'canvas.lens.performance.label': 'Performance',
  'canvas.lens.processFlow.description': 'Plain process structure without per-card analytics.',
  'canvas.lens.processFlow.label': 'Process flow',

  // Canvas — NoFocalStepPrompt
  'canvas.noFocalStep.ariaLabel': 'Choose a process step',
  'canvas.noFocalStep.description': 'Local mechanism view needs a focal process step.',
  'canvas.noFocalStep.heading': 'Choose a step for L3',
  'canvas.noFocalStep.noStepsHint': 'Add a process step before opening the local mechanism view.',
  'canvas.noFocalStep.openStepAria': 'Open {stepName} local mechanism',

  // Canvas — MobileLevelPicker
  'canvas.mobile.ariaLabel': 'Canvas levels',
  'canvas.mobile.process': 'Process',
  'canvas.mobile.step': 'Step',
  'canvas.mobile.system': 'System',

  // Canvas — AuthorL3View
  'canvas.authorL3.assignedColumns': 'Assigned columns',
  'canvas.authorL3.ctqHeading': 'CTQ',
  'canvas.authorL3.dropHint': 'Drop columns here to assign them to this process step.',
  'canvas.authorL3.dropTargetAria': '{stepName} assignment target',
  'canvas.authorL3.dropTargetAriaWithChip':
    '{stepName} assignment target, press Enter to place {chipLabel}',
  'canvas.authorL3.noAssignedColumns': 'No assigned columns yet',
  'canvas.authorL3.noCtqContext': 'No unassigned CTQ context',
  'canvas.authorL3.noTributaryContext': 'No unassigned tributary context',
  'canvas.authorL3.selectedStep': 'Selected step',
  'canvas.authorL3.tributaryColumns': 'Tributary columns',
  'canvas.authorL3.unassignedColumns': 'Unassigned columns',

  // Canvas — LocalMechanismView
  'canvas.localMechanism.actionButton': 'Action',
  'canvas.localMechanism.etaSquaredLabel': 'eta² {value}',
  'canvas.localMechanism.evidenceMap': 'Local evidence map',
  'canvas.localMechanism.factorContribution': 'Factor contribution evidence',
  'canvas.localMechanism.analyzeWall': 'Investigation wall',
  'canvas.localMechanism.logActionAria': 'Log action for {column}',
  'canvas.localMechanism.noNumericValues': 'No numeric values',
  'canvas.localMechanism.openChartAria': 'Open {column} details mini chart',
  'canvas.localMechanism.openColumnAria': 'Open {column} details',
  'canvas.localMechanism.quickActionTitle': '{column} quick action',
  'canvas.localMechanism.focusedAnalyze': 'Investigate',
  'canvas.localMechanism.charter': 'Charter',
  'canvas.localMechanism.control': 'Control',
  'canvas.localMechanism.handoff': 'Handoff',
  'canvas.localMechanism.focusedAnalyzeAria': 'Start focused analysis for {column}',
  'canvas.localMechanism.charterAria': 'Open improvement charter for {column}',
  'canvas.localMechanism.controlAria': 'Open control for {column}',
  'canvas.localMechanism.handoffAria': 'Open handoff for {column}',
};
