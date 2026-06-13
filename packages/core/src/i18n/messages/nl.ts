import type { MessageCatalog } from '../types';

/**
 * Dutch message catalog
 */
export const nl: MessageCatalog = {
  // Statistics labels
  'stats.mean': 'Gemiddelde',
  'stats.median': 'Mediaan',
  'stats.stdDev': 'Std. afw.',
  'stats.samples': 'Steekproeven',
  'stats.passRate': 'Slagingspercentage',
  'stats.range': 'Bereik',
  'stats.min': 'Min',
  'stats.max': 'Max',
  'stats.target': 'Doel',
  'stats.sigma': 'Sigma',

  // Chart labels
  'chart.observation': 'Waarneming',
  'chart.count': 'Aantal',
  'chart.frequency': 'Frequentie',
  'chart.value': 'Waarde',
  'chart.category': 'Categorie',
  'chart.cumulative': 'Cumulatief %',
  'chart.clickToEdit': 'Klik om te bewerken',
  'chart.median': 'Mediaan',
  'chart.q1': 'Q1',
  'chart.q3': 'Q3',
  'chart.noChannelData': 'Geen kanaalgegevens',
  'chart.selectChannel': 'Selecteer kanaal',

  // Limit labels (NEN standards — uses ISO abbreviations)
  'limits.usl': 'USL',
  'limits.lsl': 'LSL',
  'limits.ucl': 'UCL',
  'limits.lcl': 'LCL',
  'limits.mean': 'Gemiddelde',
  'limits.target': 'Doel',

  // Navigation
  'nav.newAnalysis': 'Nieuwe analyse',
  'nav.backToDashboard': 'Terug naar dashboard',
  'nav.settings': 'Instellingen',
  'nav.export': 'Exporteren',
  'nav.presentation': 'Presentatie',
  'nav.menu': 'Menu',
  'nav.moreActions': 'Meer acties',

  // Panel titles
  'panel.findings': 'Bevindingen',
  'panel.dataTable': 'Gegevenstabel',
  'panel.whatIf': 'Wat als',
  'panel.analyze': 'Onderzoek',
  'panel.coScout': 'CoScout',
  'panel.drillPath': 'Detailpad',

  // View modes
  'view.list': 'Lijst',
  'view.board': 'Bord',
  'view.tree': 'Boom',

  // Action buttons
  'action.save': 'Opslaan',
  'action.cancel': 'Annuleren',
  'action.delete': 'Verwijderen',
  'action.edit': 'Bewerken',
  'action.copy': 'Kopiëren',
  'action.close': 'Sluiten',
  'action.learnMore': 'Meer informatie',
  'action.download': 'Downloaden',
  'action.apply': 'Toepassen',
  'action.reset': 'Herstellen',
  'action.retry': 'Opnieuw proberen',
  'action.send': 'Verzenden',
  'action.ask': 'Vraag',
  'action.clear': 'Wissen',
  'action.copyAll': 'Alles kopiëren',
  'action.selectAll': 'Alles selecteren',

  // CoScout
  'coscout.send': 'Verzenden',
  'coscout.clear': 'Gesprek wissen',
  'coscout.stop': 'Stoppen',
  'coscout.rateLimit': 'Limiet bereikt. Even geduld.',
  'coscout.contentFilter': 'Inhoud gefilterd door veiligheidsbeleid.',
  'coscout.error': 'Er is een fout opgetreden. Probeer het opnieuw.',

  // Display/settings
  'display.preferences': 'Voorkeuren',
  'display.density': 'Weergavedichtheid',
  'display.lockYAxis': 'Y-as vergrendelen',
  'display.filterContext': 'Filtercontext',
  'display.showSpecs': 'Specificaties tonen',

  // Investigation
  'analyze.brief': 'Onderzoeksoverzicht',
  'analyze.assignedToMe': 'Aan mij toegewezen',
  'analyze.pinAsFinding': 'Vastpinnen als bevinding',
  'analyze.addObservation': 'Waarneming toevoegen',

  // Empty states
  'empty.noData': 'Geen gegevens beschikbaar',
  'empty.noFindings': 'Nog geen bevindingen',
  'empty.noResults': 'Geen resultaten gevonden',

  // Error messages
  'error.generic': 'Er ging iets mis',
  'error.loadFailed': 'Laden van gegevens mislukt',
  'error.parseFailed': 'Bestand verwerken mislukt',

  // Settings labels
  'settings.language': 'Taal',
  'settings.theme': 'Thema',
  'settings.textSize': 'Tekstgrootte',

  // Finding statuses
  'findings.observed': 'Waargenomen',
  'findings.investigating': 'In onderzoek',
  'findings.analyzed': 'Geanalyseerd',
  'findings.improving': 'In verbetering',
  'findings.resolved': 'Opgelost',

  // Report labels
  'report.summary': 'Samenvatting',
  'report.findings': 'Bevindingen',
  'report.recommendations': 'Aanbevelingen',
  'report.evidence': 'Bewijs',

  // Data input labels
  'data.pasteData': 'Gegevens plakken',
  'data.uploadFile': 'Bestand uploaden',
  'data.columnMapping': 'Kolomtoewijzing',
  'data.measureColumn': 'Meetkolom',
  'data.factorColumn': 'Factorkolom',
  'data.addData': 'Gegevens toevoegen',
  'data.editData': 'Gegevens bewerken',
  'data.showDataTable': 'Gegevenstabel tonen',
  'data.hideDataTable': 'Gegevenstabel verbergen',

  // Status
  'status.cached': 'In cache',
  'status.loading': 'Laden',
  'status.ai': 'AI',
  'report.kpi.samples': 'Samples',
  'report.kpi.mean': 'Mean',
  'report.kpi.variation': 'Variation',
  'report.kpi.cpk': 'Cpk',
  'report.kpi.passRate': 'Pass Rate',
  'ai.propose': 'Propose',
  'ai.applied': 'Applied',
  'ai.dismissed': 'Dismissed',
  'ai.expired': 'Expired',
  'staged.before': 'Before',
  'staged.after': 'After',
  'staged.comparison': 'Comparison',

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
    'Nelson-regel 2 — reeks van {count} {side} gemiddelde (#{start}–{end})',
  'chart.violation.nelson3.detail':
    'Nelson-regel 3 — trend van {count} {direction} (#{start}–{end})',
  'chart.violation.side.above': 'boven',
  'chart.violation.side.below': 'onder',
  'chart.violation.direction.increasing': 'stijgend',
  'chart.violation.direction.decreasing': 'dalend',

  // Parameterized messages
  'data.rowsLoaded': '{count} rows loaded',
  'findings.countLabel': '{count} findings',

  // Chart limit labels (colon-suffixed for SVG rendering)
  'chart.label.ucl': 'UCL:',
  'chart.label.lcl': 'LCL:',
  'chart.label.mean': 'Gem.:',
  'chart.label.tgt': 'Doel:',
  'chart.label.usl': 'USL:',
  'chart.label.lsl': 'LSL:',
  'chart.label.value': 'Waarde:',
  'chart.label.n': 'n:',
  'chart.label.target': 'Doel:',

  // Chart status & empty states
  'chart.status.inControl': 'Onder controle',
  'chart.status.outOfControl': 'Buiten controle (voorbij UCL/LCL)',
  'chart.noDataProbPlot': 'Geen gegevens beschikbaar voor kansverdeling',

  // Chart edit affordances
  'chart.edit.spec': 'Klik om {spec} te bewerken',
  'chart.edit.axisLabel': 'Klik om aslabel te bewerken',
  'chart.edit.yAxis': 'Klik om Y-asschaal te bewerken',
  'chart.edit.saveCancel': 'Enter om op te slaan · Esc om te annuleren',

  // Performance table headers
  'chart.table.channel': 'Kanaal',
  'stats.cp': 'Cp',

  // Chart UI labels
  'chart.copyToClipboard': 'Grafiek naar klembord kopiëren',
  'chart.maximize': 'Grafiek maximaliseren',
  'chart.type.ichart': 'I-Chart',
  'chart.type.boxplot': 'Boxplot',
  'chart.type.pareto': 'Pareto',
  'chart.drillHere': '↓ hier inzoomen',
  'chart.percent': 'Percentage',
  'boxplot.factor.label': 'Factor',

  // Y-axis popover
  'chart.yAxisScale': 'Y-asschaal',
  'validation.minLessThanMax': 'Min moet kleiner zijn dan Max',
  'action.noChanges': 'Geen wijzigingen',

  // Create factor modal
  'factor.create': 'Factor aanmaken uit selectie',
  'factor.name': 'Factornaam',
  'factor.nameEmpty': 'Factornaam mag niet leeg zijn',
  'factor.nameExists': 'Een factor met deze naam bestaat al',
  'factor.example': 'bijv. Hoge temperatuur gebeurtenissen',
  'factor.pointsMarked': '{count} punten worden gemarkeerd als:',
  'factor.createAndFilter': 'Aanmaken en filteren',
  'factor.filterExplanation':
    'De weergave wordt automatisch gefilterd om alleen de geselecteerde punten te tonen.',

  // Characteristic type selector
  'charType.nominal': 'Nominaal',
  'charType.nominalDesc': 'Doelgericht (bijv. vulgewicht)',
  'charType.smaller': 'Kleiner is beter',
  'charType.smallerDesc': 'Lager is beter (bijv. defecten)',
  'charType.larger': 'Groter is beter',
  'charType.largerDesc': 'Hoger is beter (bijv. opbrengst)',

  // Analyze prompt
  'analyze.trackingPrompt':
    'Uw onderzoek wordt gevolgd — open het Onderzoekspaneel om het volledige beeld te zien.',

  // Mobile category sheet
  'chart.highlight': 'Markeren:',
  'chart.highlightRed': 'Rood',
  'chart.highlightAmber': 'Amber',
  'chart.highlightGreen': 'Groen',
  'chart.clearHighlight': 'Markering wissen',
  'chart.drillDown': 'Inzoomen op "{category}"',
  'ai.askCoScout': 'Vraag CoScout hierover',

  // Settings descriptions
  'display.lockYAxisDesc': 'Behoudt schaal voor visuele vergelijking',
  'display.filterContextDesc': 'Toon actief filteroverzicht onder grafiekkoppen',

  // Performance detected modal
  'performance.detected': 'Performance-modus gedetecteerd',
  'performance.columnsFound': '{count} meetkolommen gevonden',
  'performance.labelQuestion': 'Wat vertegenwoordigen deze meetkanalen?',
  'performance.labelExample': 'bijv. Vulkop, Holte, Mondstuk',
  'performance.enable': 'Performance-modus inschakelen',

  // Finding editor & data types
  'finding.placeholder': 'Wat heeft u gevonden?',
  'finding.note': 'Bevindingsnotitie',
  'data.typeNumeric': 'Numeriek',
  'data.typeCategorical': 'Categorisch',
  'data.typeDate': 'Datum',
  'data.typeText': 'Tekst',
  'outcomeNoMatch.noColumn': 'No column called "{name}". Available numeric columns: {columns}.',
  'outcomeNoMatch.nonNumeric': '"{name}" is not numeric, so it cannot be a Y.',
  'outcomeNoMatch.noNumericColumns': 'no numeric columns',
  'data.categories': 'categorieën',

  // PWA HomeScreen
  'home.heading': 'Verken variatieanalyse',
  'home.description':
    'Gratis trainingstool voor variatieanalyse. Visualiseer variabiliteit, bereken procesbekwaamheid en ontdek waar u moet focussen — direct in uw browser.',
  'home.divider': 'of gebruik uw eigen gegevens',
  'home.pasteHelper': 'Kopieer rijen en plak — we detecteren kolommen automatisch',
  'home.manualEntry': 'Of voer gegevens handmatig in',
  'home.upgradeHint': 'Teamfuncties, bestandsupload of opgeslagen projecten nodig?',

  // PWA navigation
  'nav.presentationMode': 'Presentatiemodus',
  'nav.hideFindings': 'Bevindingen verbergen',

  // Export
  'export.asImage': 'Exporteren als afbeelding',
  'export.asCsv': 'Exporteren als CSV',
  'export.imageDesc': 'PNG-schermafbeelding voor presentaties',
  'export.csvDesc': 'Spreadsheet-compatibel gegevensbestand',

  // Sample section
  'sample.heading': 'Probeer een voorbeelddataset',
  'sample.allSamples': 'Alle voorbeelddatasets',
  'sample.featured': 'Uitgelicht',
  'sample.caseStudies': "Casestudy's",
  'sample.journeys': 'Leertrajecten',
  'sample.industry': 'Industrie-voorbeelden',

  // View modes (additional)
  'view.stats': 'Statistieken',

  // Display (additional)
  'display.appearance': 'Weergave',

  // Azure toolbar
  'data.manualEntry': 'Handmatige invoer',
  'data.editTable': 'Gegevenstabel bewerken',
  'toolbar.saveAs': 'Opslaan als…',
  'toolbar.saving': 'Opslaan…',
  'toolbar.saved': 'Opgeslagen',
  'toolbar.saveFailed': 'Opslaan mislukt',
  'toolbar.addMore': 'Gegevens toevoegen',
  'report.scouting': 'Scoutingsrapport',
  'export.csvFiltered': 'Gefilterde gegevens exporteren als CSV',
  'error.auth': 'Authenticatiefout',

  // File browse
  'file.browseLocal': 'Dit apparaat doorzoeken',
  'file.browseSharePoint': 'SharePoint doorzoeken',
  'file.open': 'Bestand openen',

  // Admin hub
  'admin.title': 'Beheer',
  'admin.status': 'Status',
  'admin.teams': 'Teams-configuratie',
  'admin.knowledge': 'Knowledge Base',
  'admin.troubleshooting': 'Probleemoplossing',

  // Feature names (plan matrix)
  'feature.charts': 'I-Chart, Boxplot, Pareto, Stats',
  'feature.capability': 'Procesbekwaamheidsanalyse (Cp/Cpk)',
  'feature.performance': 'Performance-modus (multi-kanaal)',
  'feature.anova': 'ANOVA en factoranalyse',
  'feature.findingsWorkflow': 'Bevindingen- en onderzoeksworkflow',
  'feature.whatIf': 'What-If-simulatie',
  'feature.csvImport': 'CSV/Excel-import',
  'feature.reportExport': 'Rapportexport (PDF)',
  'feature.indexedDb': 'Lokale opslag IndexedDB',
  'feature.maxFactors': 'Tot 6 factoren',
  'feature.maxRows': 'Tot 250K rijen',
  'feature.onedriveSync': 'OneDrive-projectsynchronisatie',
  'feature.sharepointPicker': 'SharePoint-bestandskiezer',
  'feature.teamsIntegration': 'Microsoft Teams-integratie',
  'feature.channelCollab': 'Kanaalgebaseerde samenwerking',
  'feature.mobileUi': 'Mobiel geoptimaliseerde UI',
  'feature.coScoutAi': 'CoScout AI-assistent',
  'feature.narrativeBar': 'NarrativeBar-inzichten',
  'feature.chartInsights': 'Grafiekinzichtchips',
  'feature.knowledgeBase': 'Knowledge Base (SharePoint-zoeken)',
  'feature.aiActions': 'Door AI voorgestelde acties',

  // Admin Teams setup
  'admin.teams.heading': 'VariScout toevoegen aan Microsoft Teams',
  'admin.teams.description':
    'Genereer een Teams-app-pakket voor uw implementatie en upload het naar het Teams-beheercentrum.',
  'admin.teams.running': 'Draait binnen Microsoft Teams',
  'admin.teams.step1': 'App-registratie Client-ID (optioneel)',
  'admin.teams.step1Desc':
    'Voer uw Azure AD App-registratie Client-ID in om Teams SSO in het manifest in te schakelen.',
  'admin.teams.step2': 'Download het Teams-app-pakket',
  'admin.teams.step2Desc':
    'Dit .zip-bestand bevat het manifest en pictogrammen die vooraf zijn geconfigureerd voor uw implementatie.',
  'admin.teams.step3': 'Uploaden naar het Teams-beheercentrum',
  'admin.teams.step4': 'VariScout toevoegen aan een kanaal',
  'admin.teams.download': 'Teams-app-pakket downloaden',

  // Admin status tab
  'admin.checksResult': '{pass}/{total} controles geslaagd',
  'admin.runChecks': 'Alle controles uitvoeren',
  'admin.notApplicable': 'Niet van toepassing op uw plan',
  'admin.managePortal': 'Beheren in Azure Portal',
  'admin.portalAccessNote':
    'Deze items vereisen toegang tot Azure Portal en kunnen niet vanuit de browser worden gecontroleerd.',
  'admin.fixInPortal': 'Oplossen in Azure Portal: {label}',

  // Admin troubleshoot tab
  'admin.troubleshoot.intro':
    'Veelvoorkomende problemen en hoe ze op te lossen. Klik op een probleem voor stapsgewijze instructies.',
  'admin.runCheck': 'Controle uitvoeren',
  'admin.checkPassed': 'Controle geslaagd — dit is mogelijk niet het probleem.',
  'admin.checkFailed': 'Controle mislukt — volg de onderstaande stappen.',
  'admin.issue.signin': 'Gebruikers kunnen niet inloggen',
  'admin.issue.signinDesc': 'Azure AD-authenticatie werkt niet of gebruikers zien een lege pagina.',
  'admin.issue.signinSteps':
    'Controleer of App Service-authenticatie is ingeschakeld in Azure Portal.\nControleer of de Azure AD-appregistratie de juiste omleidings-URI\'s heeft.\nZorg ervoor dat de appregistratie "ID-tokens" heeft ingeschakeld onder Authenticatie.\nControleer of de tenant gebruikersaanmelding bij de app toestaat (Bedrijfsapplicaties → Eigenschappen → Ingeschakeld voor gebruikersaanmelding).',
  'admin.issue.onedrive': 'OneDrive-synchronisatie werkt niet',
  'admin.issue.onedriveDesc':
    'Projecten synchroniseren niet naar OneDrive of gebruikers zien machtigingsfouten.',
  'admin.issue.onedriveSteps':
    'Controleer of de appregistratie de gedelegeerde machtiging "Files.ReadWrite" heeft.\nControleer of beheerderstoestemming is verleend voor de Graph-machtigingen.\nZorg ervoor dat de gebruiker een OneDrive-licentie heeft toegewezen.\nProbeer uit te loggen en weer in te loggen om het token te vernieuwen.',
  'admin.issue.coscout': 'CoScout reageert niet',
  'admin.issue.coscoutDesc': 'De AI-assistent genereert geen antwoorden of toont fouten.',
  'admin.issue.coscoutSteps':
    'Controleer of het AI-eindpunt is geconfigureerd in de ARM-sjabloon / App Service-instellingen.\nControleer of de Azure AI Services-resource is geïmplementeerd en actief is.\nControleer of de modelimplementatie bestaat (bijv. gpt-4o) in de AI Services-resource.\nControleer de Azure AI Services-quota — de implementatie heeft mogelijk de snelheidslimieten bereikt.',
  'admin.issue.kbEmpty': 'Knowledge Base geeft geen resultaten',
  'admin.issue.kbEmptyDesc':
    'CoScout\'s "Knowledge Base doorzoeken" vindt niets ondanks bestaande documenten.',
  'admin.issue.kbEmptySteps':
    'Controleer of het AI Search-eindpunt is geconfigureerd in de App Service-instellingen.\nControleer of de Remote SharePoint-kennisbron is aangemaakt in AI Search.\nZorg ervoor dat minimaal 1 Microsoft 365 Copilot-licentie actief is in de tenant.\nControleer of de gebruiker SharePoint-toegang heeft tot de gezochte documenten.\nControleer of de Knowledge Base-preview-schakelaar is ingeschakeld (Beheer → tabblad Knowledge Base).',
  'admin.issue.teamsTab': 'Teams-tabblad wordt niet weergegeven',
  'admin.issue.teamsTabDesc':
    'VariScout verschijnt niet in Teams of het tabblad wordt niet geladen.',
  'admin.issue.teamsTabSteps':
    'Controleer of het Teams-app-pakket (.zip) is geüpload naar het Teams-beheercentrum.\nControleer of de contentUrl in manifest.json overeenkomt met uw App Service-URL.\nZorg ervoor dat de app is goedgekeurd in het Teams-beheercentrum (niet geblokkeerd door beleid).\nProbeer het tabblad te verwijderen en opnieuw toe te voegen in het kanaal.\nAls u een aangepast domein gebruikt, controleer of het in de validDomains-array van het manifest staat.',
  'admin.issue.newUser': 'Nieuwe gebruiker heeft geen toegang tot de app',
  'admin.issue.newUserDesc':
    'Een nieuw toegevoegde gebruiker ziet een toegang geweigerd of lege pagina.',
  'admin.issue.newUserSteps':
    'Ga in Azure AD naar Bedrijfsapplicaties → VariScout → Gebruikers en groepen.\nVoeg de gebruiker of hun beveiligingsgroep toe aan de app.\nAls u "Gebruikerstoewijzing vereist" gebruikt, zorg ervoor dat de gebruiker een toewijzing heeft.\nControleer Voorwaardelijke toegang-beleid dat de gebruiker mogelijk blokkeert.',
  'admin.issue.aiSlow': 'AI-antwoorden zijn traag',
  'admin.issue.aiSlowDesc':
    'CoScout doet er lang over om te reageren of heeft regelmatig een time-out.',
  'admin.issue.aiSlowSteps':
    'Controleer de Azure AI Services-implementatieregio — latentie neemt toe met afstand.\nControleer of de modelimplementatie voldoende TPM (tokens per minuut) quota heeft.\nOverweeg een upgrade naar een provisioned throughput-implementatie voor consistente latentie.\nControleer of de AI Search-index groot is — overweeg de kennisbron te optimaliseren.',
  'admin.issue.forbidden': '"Forbidden"-fouten',
  'admin.issue.forbiddenDesc': 'Gebruikers zien 403-fouten bij het openen van bepaalde functies.',
  'admin.issue.forbiddenSteps':
    'Controleer of alle vereiste Graph API-machtigingen beheerderstoestemming hebben.\nControleer of de App Service-authenticatie-tokenopslag is ingeschakeld.\nZorg ervoor dat het token van de gebruiker niet is verlopen — probeer uit te loggen en weer in te loggen.\nControleer Voorwaardelijke toegang-beleid voor de tenant.',
  'admin.issue.kbPartial': 'KB werkt niet voor sommige gebruikers',
  'admin.issue.kbPartialDesc':
    'Knowledge Base-zoeken werkt voor beheerders maar niet voor andere gebruikers.',
  'admin.issue.kbPartialSteps':
    'Remote SharePoint-kennisbronnen gebruiken machtigingen per gebruiker. Elke gebruiker moet SharePoint-toegang tot de documenten hebben.\nControleer of de getroffen gebruikers worden geblokkeerd door Voorwaardelijke toegang-beleid.\nControleer of beheerderstoestemming is verleend voor de gedelegeerde machtiging Sites.Read.All.\nVraag de getroffen gebruikers om uit te loggen en weer in te loggen om hun token te vernieuwen.',

  // Workspace navigation
  'workspace.process': 'Process',
  'workspace.explore': 'Explore',
  'workspace.analyze': 'Analyze',
  'workspace.findings': 'Findings',
  'workspace.improvement': 'Improvement',
  'workspace.improve': 'Improve',
  'workspace.project': 'Project',
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

  // ── DefectDispatchBanner (ER-5b) ──
  'defect.dispatch.banner.label': '⌖ Detected count data — analyzing defect rates',
  'defect.dispatch.banner.adjust': 'adjust columns ▾',
  'defect.dispatch.banner.useStandard': 'use as standard data',

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
  'fi.title': 'Factor-intelligentie',
  'fi.ranking': 'Factorrangschikking (R² gecorrigeerd)',
  'fi.layer2': 'Laag 2 · Hoofdeffecten',
  'fi.layer3': 'Laag 3 · Factorinteracties',
  'fi.investigate': 'Onderzoeken →',
  'fi.notSignificant': 'niet significant (p={value})',
  'fi.explainsSingle': '{factor} verklaart {pct}% van de variatie alleen.',
  'fi.explainsMultiple': '{factors} verklaren samen {pct}% van de variatie.',
  'fi.layer2Locked': 'Laag 2 (Hoofdeffecten) wordt ontgrendeld wanneer R²adj > {threshold}%',
  'fi.layer2Current': ' — momenteel {value}%',
  'fi.layer3Locked': 'Laag 3 (Interacties) wordt ontgrendeld wanneer ≥2 factoren significant zijn',
  'fi.layer3Current': ' — momenteel {count} significant',
  'fi.best': 'Beste',
  'fi.range': 'Bereik',
  'fi.interactionDetected':
    'Interactie gedetecteerd: het effect van {factorA} hangt af van het niveau van {factorB}.',
  'fi.noInteraction': 'Geen significante interactie — effecten zijn bij benadering additief.',

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
  'canvas.wall.shortcutLabel': 'Open Wall',

  // Investigation Wall
  'wall.status.proposed': 'Suspected',
  'wall.status.evidenced': 'Suspected',
  'wall.status.confirmed': 'Supported',
  'wall.status.refuted': 'Ruled out',
  'wall.status.needsDisconfirmation': 'Suspected',
  'wall.status.suggestSupported': '2 evidence types + a survived test — mark Supported?',
  'wall.status.setLabel': 'Set status',
  'wall.card.hypothesisLabel': 'Suspected cause',
  'wall.card.findings': '{count} findings',
  'wall.card.evidenceGap': 'Evidence gap',
  'wall.card.missingColumn': '⚠ Condition references missing column',
  'wall.card.missingColumnAria': 'Condition references missing column',
  'wall.card.ariaLabel': 'Suspected cause {name}, {status}, {count} supporting clues',
  'wall.card.oneStepAway':
    '1 step away — running a disconfirmation test would let you mark this Supported',
  'wall.problem.title': 'Problem condition',
  'wall.problem.eventsPerWeek': '{count} events',
  'wall.problem.ariaLabel': 'Problem condition: {column}, Cpk {cpk}, {count} events per week',
  'wall.scope.whatIf': 'If fixed: Cpk {value}',
  'wall.scope.coverage': 'Covers {value}%',
  'wall.evidence.supports': 'Supports',
  'wall.evidence.countsAgainst': 'Counts against',
  'wall.evidence.contributingFactors': 'Contributing factors',
  'wall.factorGlyph.aria': 'Focus factor {factor}',
  'wall.exploreJump.aria': 'Open {factor} in Explore',
  'wall.disconfirm.prompt': 'We tried to break this — did it hold?',
  'wall.disconfirm.descriptionLabel': 'What did you try?',
  'wall.disconfirm.verdictLabel': 'Did it hold?',
  'wall.disconfirm.verdictPending': 'Still checking',
  'wall.disconfirm.verdictSurvived': 'Held up (survived)',
  'wall.disconfirm.verdictRefuted': 'Broke it (refuted)',
  'wall.disconfirm.record': 'Record',
  'wall.disconfirm.cancel': 'Cancel',
  // FE-2b — the fused "Try to break it" premortem (spec §4.2)
  'wall.disconfirm.tryToBreakIt': 'Try to break it',
  'wall.disconfirm.tryToBreakItHint':
    'Predict what would prove this WRONG — the test grades the verdict.',
  'wall.disconfirm.predictLabel': 'What would you expect to see if this is wrong?',
  'wall.disconfirm.predictPlaceholder':
    'e.g. if the night shift drives it, day-shift runs should run cool…',
  'wall.disconfirm.predictHint': 'Optional, but a sharp prediction makes the test severe.',
  'wall.disconfirm.manualFallback': 'Log a gemba or expert disconfirmation (no data)',
  'wall.disconfirm.verdictSurvivedToast': 'Survived — the cause withstood the attempt.',
  'wall.disconfirm.verdictRefutedToast': 'Refuted — the predicted relationship was absent.',
  // FE-2b — the §4.1 soft caveat for an unbacked survived attempt
  'wall.caveat.unbackedSurvived': 'Supported — disconfirmation has no attached evidence',
  'wall.caveat.backWithTest': 'back it with a test →',
  // FE-2b — refute → respawn-sharper (spec §4.2)
  'wall.respawn.sharpenCta': 'Sharpen → propose a new hypothesis',
  'wall.respawn.nameLabel': 'New hypothesis',
  'wall.respawn.namePlaceholder': 'e.g. it’s the spindle, regardless of shift',
  'wall.respawn.carryNote':
    'The refuting finding carries forward as supporting evidence for the new hypothesis.',
  'wall.respawn.confirm': 'Create sharpened hypothesis',
  'wall.respawn.cancel': 'Cancel',
  'wall.respawn.supersededBy': 'superseded by →',
  // FE-2b — the confound sign-prompt + side-by-side What-If (spec §4.2)
  'wall.confound.heading': 'This factor is also cited by a rival cause',
  'wall.confound.prompt': 'Mark the opposite sign on “{rival}”?',
  'wall.confound.markOpposite': 'Counts against the rival',
  'wall.confound.notAdditive':
    'These projections are not additive — each cause is its own What-If.',
  'wall.confound.whatIfFor': 'If you control “{hypothesis}”',
  // FE-2b — the activated affordances (spec §4.2)
  'wall.affordance.tryDisconfirmation': 'Try disconfirmation',
  'wall.affordance.oneStepAwayAction': 'Open the test plan with “Try to break it” ready',
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
  // L-3 suspected-cause activity layer
  'wall.activity.inFlightHeading': 'In flight - evidence being collected',
  'wall.activity.pendingAttempt': 'Break attempt pending:',
  'wall.activity.stalledHeading': 'Nothing in flight for {days} working days',
  'wall.activity.planCheck': 'Plan a check',
  'wall.activity.goLook': 'Go look',
  'wall.activity.ruleOut': 'Rule it out',
  // PR-CS-11 — analyst-owned plan-status select + re-ingest pending-match prompt (Task 5)
  'wall.collect.setStatusLabel': 'Set plan status',
  'wall.collect.pending.prompt': 'Factor “{column}” arrived — needed by this plan',
  'wall.collect.pending.linkFinding': 'Link finding…',
  'wall.collect.pending.markInProgress': 'Mark in-progress',
  'wall.collect.pending.dismiss': 'Dismiss matched factor',
  'wall.scope.archive': 'Archive scope {condition}',
  'wall.gate.and': 'AND',
  'wall.gate.or': 'OR',
  'wall.gate.not': 'NOT',
  'wall.gate.holds': 'HOLDS {matching}/{total}',
  'wall.gate.noTotals': '—/0',
  'wall.gate.ariaLabel': 'Gate {kind} {holds}',
  'wall.tributary.ariaLabel': 'Tributaries from Process Map',
  'wall.empty.ariaLabel': 'Suspected cause empty state',
  'wall.empty.title': 'Start a suspected cause',
  'wall.empty.subtitle': 'Start from a suspected cause, question, or Factor Intelligence.',
  'wall.empty.writeHypothesis': 'Add a suspected cause',
  'wall.empty.seedFromFactorIntel': 'Seed 3 largest contributors',
  'wall.rail.title': 'CoScout',
  'wall.rail.openAria': 'Open narrator rail',
  'wall.rail.closeAria': 'Close narrator rail',
  'wall.rail.rootAria': 'Narrator rail',
  'wall.rail.openButton': 'Open rail',
  'wall.rail.empty': 'No suggestions yet.',
  'wall.missing.ariaLabel': 'Missing evidence digest',
  'wall.missing.title': 'Missing evidence',
  'wall.missing.tagline': "Evidence you haven't checked yet ({count})",
  'wall.missing.processMap': 'Process Map grouping is available after FRAME mapping.',
  'wall.missing.collapsed': 'Show details',
  'wall.missing.expanded': 'Hide details',
  'wall.canvas.ariaLabel': 'Suspected cause workspace',
  'wall.cta.proposeHypothesis': 'Propose suspected cause from this finding',
  // Model-builder band (Factors & Evaluation Increment 1)
  'wall.model.bandAriaLabel': 'Vital-few model builder',
  'wall.model.title': 'What accounts for the spread in this data',
  'wall.model.keptHeading': 'Vital few',
  'wall.model.candidatesHeading': 'Other factors',
  'wall.model.vitalFewLine': 'vital-few line',
  'wall.model.rSquaredAdj': 'R²adj {value}',
  'wall.model.factorP': 'p {value}',
  'wall.model.associationStrength': 'Association strength',
  'wall.model.deltaR2': 'ΔR² {value}',
  'wall.model.notAVerdict':
    'Associated with the spread in this scope — a clue to investigate, not a verdict.',
  'wall.model.deltaR2Caption':
    'Each bar is a factor’s unique share of the spread; correlated factors overlap, so they need not sum to the model fit.',
  'wall.model.useSuggested': '↩ Use suggested model',
  'wall.model.addToModel': 'Add {factor} to the model',
  'wall.model.removeFromModel': 'Remove {factor} from the model',
  'wall.model.fitOnlyDot': 'Fit-only estimate',
  'wall.model.fitOnlyTooltip':
    'Few observations per factor — treat this as a fit-only estimate, not a confirmed result.',
  'wall.model.redundancy':
    'Removing {factor} barely changed the model — it is correlated with another factor, redundant not irrelevant.',
  'wall.model.redundancyDismiss': 'Dismiss',
  'wall.model.vifTooltip': 'VIF {value}',
  'wall.model.tooFewRows': 'Too few rows to re-rank — showing parent scope.',
  'wall.model.constantInScope': 'constant in scope',
  'wall.model.captureModel': 'Capture model as Finding',
  'wall.model.empty': 'Set an outcome and factors to build a model.',
  'wall.model.capturedText':
    'Model: {factors} accounts for the spread (R²adj {rSquaredAdj}) in {scope}',
  // Hypothesis test-plan triad (Factors & Evaluation Increment 2a)
  // ── Model drawer (ER-3 — "The model behind the ranking") ──
  'modelDrawer.title': 'The model behind the ranking',
  'modelDrawer.subtitle': '{outcome} ~ {terms} · fitted on {scope}',
  'modelDrawer.closeAria': 'Close the model drawer',
  'modelDrawer.empty': 'Set an outcome and factors to build a model.',
  'modelDrawer.summaryHeading': 'Model summary',
  'modelDrawer.summaryS': 'S (residual σ)',
  'modelDrawer.summaryR2': 'R²',
  'modelDrawer.summaryR2adj': 'R²adj',
  'modelDrawer.summaryN': 'n',
  'modelDrawer.summaryCaption':
    'S is the everyday variation left after the model — the same number family as the residual chip on the strip.',
  'modelDrawer.equationHeading': 'Equation (largest terms)',
  'modelDrawer.equationCaption':
    'Reference levels: {references}. Coefficients are group contrasts vs reference — read them as "how much this condition adds", not as causes.',
  'modelDrawer.coefficientsHeading': 'Coefficients',
  'modelDrawer.coefTerm': 'Term',
  'modelDrawer.coefCoef': 'Coef',
  'modelDrawer.coefSE': 'SE',
  'modelDrawer.coefT': 't',
  'modelDrawer.coefP': 'p',
  'modelDrawer.anovaHeading': 'ANOVA',
  'modelDrawer.anovaSource': 'Source',
  'modelDrawer.anovaDF': 'DF',
  'modelDrawer.anovaSS': 'SS',
  'modelDrawer.anovaF': 'F',
  'modelDrawer.anovaP': 'p',
  'modelDrawer.anovaError': 'Error',
  'modelDrawer.anovaTotal': 'Total',
  'modelDrawer.anovaCaption':
    'Type III (model-comparison) SS. η² on the strip = adjusted share per factor — see the strip subtitle.',
  'modelDrawer.ladderHeading': 'Best subsets (how the model was chosen)',
  'modelDrawer.ladderModel': 'Candidate model',
  'modelDrawer.ladderTerms': 'terms',
  'modelDrawer.ladderR2': 'R²',
  'modelDrawer.ladderR2adj': 'R²adj',
  'modelDrawer.ladderShown': '✓ shown',
  'modelDrawer.ladderNote':
    'Each candidate is its own least-squares fit; higher R²adj = the added terms pay their degrees-of-freedom rent. Interactions are screened only among surviving main effects (hierarchical, two-pass). The drawer shows the model behind the ranking you are looking at.',
  'modelDrawer.predictHeading': 'Check the equation — predict a condition',
  'modelDrawer.predictResult': '→ fitted {fitted} ± {s} · observed x̄ {observed} (n={n})',
  'modelDrawer.predictNoCell': '→ fitted {fitted} ± {s} · no observed rows for this condition',
  'modelDrawer.predictCaption':
    "Fitted mean ± S. Compare with the observed cell mean to feel the model's honesty.",
  'modelDrawer.constantInScope': 'constant in scope',
  'modelDrawer.captureModel': 'Capture model as Finding',
  'modelDrawer.warningRankDeficient':
    'Collinear or single-level factor — affected coefficients are shown as 0.',
  'modelDrawer.allData': 'All data',
  'wall.testplan.heading': 'How do I test this?',
  'wall.testplan.toolTwoSample': 'Boxplot + 2-sample',
  'wall.testplan.toolRegression': 'Scatter + regression',
  'wall.testplan.toolCapability': 'Capability (Cp/Cpk)',
  'wall.testplan.evaluate': 'Evaluate',
  'wall.testplan.evaluateAria': 'Evaluate whether {factor} accounts for the spread',
  'wall.testplan.addPlan': '+ Measurement Plan',
  'wall.testplan.addPlanAria': 'Plan how to collect {factor}',
  'wall.testplan.gapLabel': 'no data yet',
  'wall.testplan.resultSupports': '{factor} accounts for the spread (p {p})',
  'wall.testplan.resultInconclusive': '{factor} — inconclusive (p {p})',
  'wall.testplan.resultContradicts': '{factor} counts against this cause (p {p})',
  'wall.testplan.empty': 'No factors yet — capture a finding or set this cause’s condition.',
  // Per-hypothesis What-If (Factors & Evaluation Increment 2a, §5)
  'wall.whatif.heading': 'If you control this cause',
  'wall.whatif.projection': 'Projected Cpk {cpk}, covers {coverage}% of the data',
  'wall.whatif.noProjection': 'Set specs + a condition to project the gain.',
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
  'frame.b0.q2.bridge': 'These are the same candidate factors Explore will rank from the data.',
  'frame.b0.runOrderHint': '(run order: {column})',
  'frame.b0.addProcessSteps.label': 'Add process steps',
  'frame.b0.addProcessSteps.helper': "optional — useful when your X's belong to specific stages",
  'frame.b0.addHypothesis.label': 'Add a hypothesis',
  'frame.b0.addHypothesis.helper': 'optional — what you suspect',
  'frame.b0.seeData.cta': 'See the data →',
  'frame.b0.seeData.pickYHint': 'Pick a Y first to see the analysis.',
  'frame.b0.step.addCtq': '+ add measurement at this step (optional)',
  'frame.b0.q1.empty': 'No numeric columns detected — add or import data to begin.', // TODO(i18n): translate
  'frame.b0.q1.emptyRanked':
    "Couldn't auto-rank an outcome. Type the numeric column name in the manual outcome field.",
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

  // ProcessHealthBar generic labels

  'healthBar.rows': 'rows',

  // Factor strip (ER-2 — "What explains the variation?")
  'factorStrip.title': 'What does explain it?',
  'factorStrip.title.scoped': 'What does explain it within this condition?',
  'factorStrip.subtitle':
    "how much of the row-to-row differences each factor accounts for (η²) — shares overlap, won't sum to 100%",
  'factorStrip.bridge': 'Same candidate factors as Frame; ranked here from the data.',
  'factorStrip.modelLink': 'How these % are computed (model & ANOVA) →',
  'factorStrip.modelLink.stub': 'coming with the model drawer',
  'factorStrip.star.title': 'largest share',
  'factorStrip.stepBadge.title': 'Process step: {step}',
  'factorStrip.binned': '(binned)',
  'factorStrip.examined': 'examined',
  'factorStrip.chip.hover': 'p={p} · df={dfB},{dfW} · joint n={n}',
  'factorStrip.residual': 'everyday variation · ~{n}% — not tied to these factors',
  'factorStrip.residual.hover':
    'Residual of the joint model — mostly routine row-to-row variation, plus factors not yet measured. A large residual is typical for service data.',
  'factorStrip.alsoScreened': '+{n} also screened',
  'factorStrip.whatif.label': 'what-if · everyone matched the best group',
  'factorStrip.whatif.matched': 'If all {factor} groups matched {bestLevel}:',
  'factorStrip.whatif.average': 'average {outcome}, all {n} rows: {current} → {projected}',
  'factorStrip.whatif.average.scoped': 'average {outcome}, this condition: {current} → {projected}',
  'factorStrip.whatif.cpk': 'Cpk {current} → {projected} (reference {target})',
  'factorStrip.whatif.bridge':
    'the gap is bigger per group — this is the overall average across {k} groups',
  // Boxplot card (factor dropdown absorbed by the strip)
  'boxplot.title.by': '{outcome} by {factor}',
  'boxplot.factor.hint': 'click a factor above to compare its groups here',

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
  'canvas.localMechanism.factorContribution': 'Factor contribution evidence',
  'canvas.localMechanism.logActionAria': 'Log action for {column}',
  'canvas.localMechanism.noNumericValues': 'No numeric values',
  'canvas.localMechanism.openChartAria': 'Open {column} details mini chart',
  'canvas.localMechanism.openColumnAria': 'Open {column} details',
  'canvas.localMechanism.quickActionTitle': '{column} quick action',
  'canvas.localMechanism.control': 'Control',
  'canvas.localMechanism.handoff': 'Handoff',
  'canvas.localMechanism.controlAria': 'Open control for {column}',
  'canvas.localMechanism.handoffAria': 'Open handoff for {column}',
  // ── Condition pill (ER-4) ──
  'conditionPill.statDefault': 'x̄',
  'conditionPill.summaryWithMeans':
    '{gesture}{summary} · n={n} · {statLabel} {meanIn} vs {meanOut}',
  'conditionPill.summaryNoMeans': '{gesture}{summary} · n={n}',
  'conditionPill.capture': '✚ Capture finding',
  'conditionPill.apply': 'view as condition →',
  'conditionPill.ariaLabel': 'Condition: {summary}',
  // ── Scope bar (ER-4) ──
  'scopeBar.viewing': '⌖ Viewing condition:',
  'scopeBar.rows': '{nIn} of {nTotal} rows',
  'scopeBar.clear': '× back to all data',
  'scopeBar.analyze': 'Take it to Analyze →',
  'scopeBar.ariaLabel': 'Viewing condition: {label}',

  // -- Membership strip variant (ER-5a) --
  'factorStrip.title.membership': 'What distinguishes these rows?',
  'factorStrip.membership.subtitle':
    'how strongly each factor distinguishes the rows in this condition from the rest (separation -- not % of variation)',
  'factorStrip.membership.separation': 'separation',
  'factorStrip.membership.chip.hover': 'p={p} · χ² df={df} · n={n}',
  'factorStrip.membership.chip.topLevel': '{level} ×{lift}',
  'factorStrip.membership.chip.onlyInCondition': 'only in condition',

  // ── Defect-rate-share strip variant (ER-5b) ──
  'factorStrip.title.defectRate': 'What drives the defect rate?',
  'factorStrip.defectRate.subtitle':
    'how strongly each factor concentrates the defect rate across its levels (rate concentration — not % of variation)',
  'factorStrip.defectRate.chip.topLevel': '{level} {rate}%',
  'factorStrip.defectRate.chip.topLevelCount': '{level} {count}',
  'factorStrip.defectRate.chip.concentration': 'concentration {value}',
  'factorStrip.defectRate.star.title': 'largest share',

  // -- Composition view (ER-5a) --
  'compositionView.title': 'Composition by {factor}',
  'compositionView.toggle.lift': 'lift',
  'compositionView.toggle.count': 'count',
  'compositionView.shareIn': 'share in condition',
  'compositionView.shareOut': 'share outside',
  'compositionView.lift': '×{lift}',
  'compositionView.liftOnlyInCondition': 'only in condition',
  'compositionView.addAria': 'Add {level} to condition',
  'compositionView.empty': 'No composition data -- condition may be degenerate.',
  'compositionView.countIn': 'in condition',
};
