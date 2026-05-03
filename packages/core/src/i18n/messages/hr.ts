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
  'display.density': 'Gustoća prikaza',
  'display.lockYAxis': 'Zaključaj os Y',
  'display.filterContext': 'Kontekst filtera',
  'display.showSpecs': 'Prikaži specifikacije',

  // Investigation
  'investigation.brief': 'Sažetak istraživanja',
  'investigation.assignedToMe': 'Dodijeljeno meni',
  'investigation.question': 'Question',
  'investigation.questions': 'Questions',
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

  // Report KPIs
  'report.kpi.samples': 'Samples',
  'report.kpi.mean': 'Mean',
  'report.kpi.variation': 'Variation',
  'report.kpi.cpk': 'Cpk',
  'report.kpi.passRate': 'Pass Rate',

  // AI Actions
  'ai.propose': 'Propose',
  'ai.applied': 'Applied',
  'ai.dismissed': 'Dismissed',
  'ai.expired': 'Expired',

  // Staged analysis
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
  'data.addQuestion': 'Add question',
  'data.removeQuestion': 'Remove question',
  'data.back': 'Back',

  // Paste screen
  'data.pasteInstructions': 'Paste your data here',
  'data.pasteSubtitle': 'Copy from Excel, CSV, or any spreadsheet',
  'data.useExample': 'Use example data',
  'data.analyzing': 'Analyzing…',
  'data.tipWithData': 'Tip: Include column headers in the first row',
  'data.tipNoData': 'Tip: Try pasting data from a spreadsheet or CSV file',

  // Data quality
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

  // Manual entry
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

  // Chart legend
  'chart.legend.commonCause': 'Common Cause',
  'chart.legend.specialCause': 'Special Cause',
  'chart.legend.outOfSpec': 'Out-of-Spec',
  'chart.legend.inControl': 'In-Control',
  'chart.legend.randomVariation': 'Random variation',
  'chart.legend.defect': 'Customer defect',

  // Chart violations
  'chart.violation.aboveUsl': 'Above USL ({value})',
  'chart.violation.belowLsl': 'Below LSL ({value})',
  'chart.violation.aboveUcl': 'Above UCL — special cause',
  'chart.violation.belowLcl': 'Below LCL — special cause',
  'chart.violation.aboveUclFavorable': 'Above UCL — favorable shift',
  'chart.violation.belowLclFavorable': 'Below LCL — favorable shift',
  'chart.violation.nelson2': 'Nelson Rule 2 — run of {count}',
  'chart.violation.nelson3': 'Nelson Rule 3 — trend of {count}',

  // Investigation sidebar
  'investigation.phaseInitial': 'Gather initial observations',
  'investigation.phaseDiverging': 'Explore multiple questions',
  'investigation.phaseValidating': 'Test and validate questions',
  'investigation.phaseConverging': 'Narrow to contribution',
  'investigation.phaseImproving': 'Implement and verify changes',
  'investigation.pdcaTitle': 'Verification Checklist',
  'investigation.verifyChart': 'I-Chart stable after change',
  'investigation.verifyStats': 'Cpk meets target',
  'investigation.verifyBoxplot': 'Boxplot spread reduced',
  'investigation.verifySideEffects': 'No side effects observed',
  'investigation.verifyOutcome': 'Outcome sustained over time',
  'investigation.uninvestigated': 'Uninvestigated Factors',

  // AI action tool labels
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
  'ai.tool.suggestSuspectedCause': 'Suggest suspected cause',
  'ai.tool.connectHubEvidence': 'Connect hub evidence',
  'ai.tool.suggestCausalLink': 'Suggest causal link',
  'ai.tool.highlightMapPattern': 'Highlight map pattern',

  // Report
  'report.kpi.inSpec': 'In Spec',

  // Table
  'table.noData': 'No data to display',
  'table.page': 'Page {page} of {total}',
  'table.rowsPerPage': 'Rows per page',
  'table.editHint': 'Click a cell to edit',
  'table.excluded': 'Excluded',
  'table.deleteRow': 'Delete row',
  'table.addRow': 'Add row',
  'table.unsavedChanges': 'Unsaved changes',
  'table.showAll': 'Show all',

  // Specs
  'specs.title': 'Specification Limits',
  'specs.advancedSettings': 'Advanced settings',
  'specs.apply': 'Apply specifications',
  'specs.noChanges': 'No changes to apply',
  'specs.editTitle': 'Edit Specifications',
  'specs.lslLabel': 'Lower Specification Limit (LSL)',
  'specs.uslLabel': 'Upper Specification Limit (USL)',

  // Upgrade
  'upgrade.title': 'Upgrade Available',
  'upgrade.limitReached': 'You have reached the limit for this feature',
  'upgrade.upgrade': 'Upgrade',
  'upgrade.viewOptions': 'View options',
  'upgrade.featureLimit': '{feature} is limited to {limit} in this plan',

  // Display toggles
  'display.violin': 'Violin plot',
  'display.violinDesc': 'Show distribution shape',
  'display.etaSquared': 'η²',
  'display.etaSquaredDesc': 'Show η² (effect size)',
  'display.sort': 'Sort',
  'display.ascending': 'Ascending',
  'display.descending': 'Descending',

  // Stats panel
  'stats.summary': 'Summary Statistics',
  'stats.histogram': 'Histogram',
  'stats.probPlot': 'Probability Plot',
  'stats.editSpecs': 'Edit specifications',

  // WhatIf
  'whatif.adjustMean': 'Adjust mean',
  'whatif.reduceVariation': 'Reduce variation',
  'whatif.currentProjected': 'Current vs Projected',
  'whatif.resetAdjustments': 'Reset adjustments',
  'whatif.yield': 'Projected yield',

  // Chart violation details (parameterized)
  'chart.violation.nelson2.detail':
    'Nelsonovo pravilo 2 — niz {count} {side} prosjeka (#{start}–{end})',
  'chart.violation.nelson3.detail':
    'Nelsonovo pravilo 3 — trend {count} {direction} (#{start}–{end})',
  'chart.violation.side.above': 'iznad',
  'chart.violation.side.below': 'ispod',
  'chart.violation.direction.increasing': 'rastući',
  'chart.violation.direction.decreasing': 'padajući',

  // Parameterized messages
  'data.rowsLoaded': '{count} rows loaded',
  'findings.countLabel': '{count} nalaza',
  'chart.label.target': 'Cilj:',

  // Chart limit labels
  'chart.label.ucl': 'GKG:',
  'chart.label.lcl': 'DKG:',
  'chart.label.mean': 'Srednja:',
  'chart.label.tgt': 'Cilj:',
  'chart.label.usl': 'GGT:',
  'chart.label.lsl': 'DGT:',
  'chart.label.value': 'Vrijednost:',
  'chart.label.n': 'n:',

  // Chart status
  'chart.status.inControl': 'Pod kontrolom',
  'chart.status.outOfControl': 'Izvan kontrole (izvan GKG/DKG)',
  'chart.noDataProbPlot': 'Nema dostupnih podataka za graf vjerojatnosti',

  // Chart edit affordances
  'chart.edit.spec': 'Kliknite za uređivanje {spec}',
  'chart.edit.axisLabel': 'Kliknite za uređivanje oznake osi',
  'chart.edit.yAxis': 'Kliknite za uređivanje skale Y-osi',
  'chart.edit.saveCancel': 'Enter za spremanje · Esc za odustajanje',

  // Performance table headers
  'chart.table.channel': 'Kanal',
  'stats.cp': 'Cp',

  // Chart UI labels
  'chart.copyToClipboard': 'Kopiraj grafikon u međuspremnik',
  'chart.maximize': 'Maksimiziraj grafikon',
  'chart.type.ichart': 'I-Chart',
  'chart.type.boxplot': 'Boxplot',
  'chart.type.pareto': 'Pareto',
  'chart.drillHere': '↓ detalji ovdje',
  'chart.percent': 'Postotak',
  'boxplot.factor.label': 'Factor',

  // Y-axis popover
  'chart.yAxisScale': 'Skala Y-osi',
  'validation.minLessThanMax': 'Min mora biti manji od Maks',
  'action.noChanges': 'Nema promjena',

  // Create factor modal
  'factor.create': 'Stvori faktor iz odabira',
  'factor.name': 'Naziv faktora',
  'factor.nameEmpty': 'Naziv faktora ne može biti prazan',
  'factor.nameExists': 'Faktor s ovim nazivom već postoji',
  'factor.example': 'npr. Događaji visoke temperature',
  'factor.pointsMarked': '{count} točaka bit će označeno kao:',
  'factor.createAndFilter': 'Stvori i filtriraj',
  'factor.filterExplanation': 'Prikaz će se automatski filtrirati za prikaz samo odabranih točaka.',

  // Characteristic type selector
  'charType.nominal': 'Nominalno',
  'charType.nominalDesc': 'Centrirano na cilj (npr. masa punjenja)',
  'charType.smaller': 'Manje je bolje',
  'charType.smallerDesc': 'Niže je bolje (npr. defekti)',
  'charType.larger': 'Veće je bolje',
  'charType.largerDesc': 'Više je bolje (npr. prinos)',

  // Investigation prompt
  'investigation.trackingPrompt':
    'Praćenje vaše istrage — otvorite panel Istrage za potpunu sliku.',

  // Mobile category sheet
  'chart.highlight': 'Označavanje:',
  'chart.highlightRed': 'Crveno',
  'chart.highlightAmber': 'Žuto',
  'chart.highlightGreen': 'Zeleno',
  'chart.clearHighlight': 'Ukloni označavanje',
  'chart.drillDown': 'Detalji u „{category}"',
  'ai.askCoScout': 'Pitajte CoScout o ovome',

  // Settings descriptions
  'display.lockYAxisDesc': 'Održava skalu za vizualnu usporedbu',
  'display.filterContextDesc': 'Prikaži sažetak aktivnog filtra ispod naslova grafikona',

  // Performance detected modal
  'performance.detected': 'Otkriven način rada performansi',
  'performance.columnsFound': 'Pronađeno {count} mjernih stupaca',
  'performance.labelQuestion': 'Što predstavljaju ovi mjerni kanali?',
  'performance.labelExample': 'npr. Glava za punjenje, Šupljina, Mlaznica',
  'performance.enable': 'Aktiviraj način rada performansi',

  // Finding editor & data types
  'finding.placeholder': 'Što ste otkrili?',
  'finding.note': 'Bilješka nalaza',
  'data.typeNumeric': 'Numerički',
  'data.typeCategorical': 'Kategorijski',
  'data.typeDate': 'Datum',
  'data.typeText': 'Tekst',
  'data.categories': 'kategorije',

  // PWA HomeScreen
  'home.heading': 'Istražite analizu varijacije',
  'home.description':
    'Besplatan alat za obuku u analizi varijacije. Vizualizirajte varijabilnost, izračunajte sposobnost i pronađite na što se fokusirati — izravno u pregledniku.',
  'home.divider': 'ili koristite vlastite podatke',
  'home.pasteHelper': 'Kopirajte redove i zalijepite — automatski ćemo prepoznati stupce',
  'home.manualEntry': 'Ili unesite podatke ručno',
  'home.upgradeHint': 'Trebate timske značajke, učitavanje datoteka ili spremljene projekte?',

  // PWA navigation
  'nav.presentationMode': 'Način prezentacije',
  'nav.hideFindings': 'Sakrij nalaze',

  // Export
  'export.asImage': 'Izvezi kao sliku',
  'export.asCsv': 'Izvezi kao CSV',
  'export.imageDesc': 'PNG snimka zaslona za prezentacije',
  'export.csvDesc': 'Datoteka podataka kompatibilna s proračunskim tablicama',

  // Sample section
  'sample.heading': 'Isprobajte primjer skupa podataka',
  'sample.allSamples': 'Svi primjeri skupova podataka',
  'sample.featured': 'Istaknuto',
  'sample.caseStudies': 'Studije slučaja',
  'sample.journeys': 'Putovanja učenja',
  'sample.industry': 'Industrijski primjeri',

  // View modes
  'view.stats': 'Statistika',
  'display.appearance': 'Izgled',

  // Azure toolbar
  'data.manualEntry': 'Ručni unos',
  'data.editTable': 'Uredi tablicu podataka',
  'toolbar.saveAs': 'Spremi kao…',
  'toolbar.saving': 'Spremanje…',
  'toolbar.saved': 'Spremljeno',
  'toolbar.saveFailed': 'Spremanje neuspješno',
  'toolbar.addMore': 'Dodaj podatke',
  'report.scouting': 'Izvješće izviđanja',
  'export.csvFiltered': 'Izvezi filtrirane podatke kao CSV',
  'error.auth': 'Greška autentikacije',

  // File browse
  'file.browseLocal': 'Pregledaj ovaj uređaj',
  'file.browseSharePoint': 'Pregledaj SharePoint',
  'file.open': 'Otvori datoteku',

  // Admin hub
  'admin.title': 'Administracija',
  'admin.status': 'Status',
  'admin.plan': 'Plan i značajke',
  'admin.teams': 'Postavljanje Teams',
  'admin.knowledge': 'Baza znanja',
  'admin.troubleshooting': 'Rješavanje problema',

  // Admin plan tab
  'admin.currentPlan': 'Trenutni',
  'admin.feature': 'Značajka',
  'admin.manageSubscription': 'Upravljanje pretplatom u Azure',
  'admin.planStandard': 'Standard',
  'admin.planTeam': 'Team',
  'admin.planStandardPrice': '€79/mj.',
  'admin.planTeamPrice': '€199/mj.',
  'admin.planStandardDesc': 'Potpuna analiza s CoScout AI',
  'admin.planTeamDesc': 'Teams, OneDrive, SharePoint, baza znanja',

  // Feature names
  'feature.charts': 'I-Chart, Boxplot, Pareto, Statistika',
  'feature.capability': 'Analiza sposobnosti (Cp/Cpk)',
  'feature.performance': 'Način rada performansi (višekanalni)',
  'feature.anova': 'ANOVA i faktorska analiza',
  'feature.findingsWorkflow': 'Nalazi i tijek rada istrage',
  'feature.whatIf': 'Simulacija što-ako',
  'feature.csvImport': 'Uvoz CSV/Excel',
  'feature.reportExport': 'Izvoz izvješća (PDF)',
  'feature.indexedDb': 'Lokalno pohranjivanje IndexedDB',
  'feature.maxFactors': 'Do 6 faktora',
  'feature.maxRows': 'Do 250K redova',
  'feature.onedriveSync': 'Sinkronizacija projekata s OneDrive',
  'feature.sharepointPicker': 'Birač datoteka iz SharePoint',
  'feature.teamsIntegration': 'Integracija s Microsoft Teams',
  'feature.channelCollab': 'Suradnja temeljena na kanalima',
  'feature.mobileUi': 'UI optimiziran za mobilne uređaje',
  'feature.coScoutAi': 'CoScout AI pomoćnik',
  'feature.narrativeBar': 'Uvidi NarrativeBar',
  'feature.chartInsights': 'Čipovi uvida grafikona',
  'feature.knowledgeBase': 'Baza znanja (pretraga SharePoint)',
  'feature.aiActions': 'AI-predložene radnje',

  // Admin Teams setup
  'admin.teams.heading': 'Dodajte VariScout u Microsoft Teams',
  'admin.teams.description':
    'Generirajte paket Teams aplikacije za vašu implementaciju i učitajte ga u centar za administraciju Teams.',
  'admin.teams.running': 'Pokrenut unutar Microsoft Teams',
  'admin.teams.step1': 'ID klijenta registracije aplikacije (Opcionalno)',
  'admin.teams.step1Desc':
    'Unesite ID klijenta registracije Azure AD aplikacije za omogućavanje Teams SSO u manifestu.',
  'admin.teams.step2': 'Preuzimanje paketa Teams aplikacije',
  'admin.teams.step2Desc':
    'Ovaj .zip sadrži manifest i ikone unaprijed konfigurirane za vašu implementaciju.',
  'admin.teams.step3': 'Učitaj u centar za administraciju Teams',
  'admin.teams.step4': 'Dodaj VariScout u kanal',
  'admin.teams.download': 'Preuzmi paket Teams aplikacije',

  // Admin status tab
  'admin.checksResult': '{pass}/{total} provjera uspješno',
  'admin.runChecks': 'Pokreni sve provjere',
  'admin.notApplicable': 'Nije primjenjivo za vaš plan',
  'admin.managePortal': 'Upravljaj u Azure Portal',
  'admin.portalAccessNote':
    'Ove stavke zahtijevaju pristup Azure Portalu i ne mogu se provjeriti iz preglednika.',
  'admin.fixInPortal': 'Popravi u Azure Portal: {label}',

  // Admin troubleshoot tab
  'admin.troubleshoot.intro':
    'Česti problemi i kako ih riješiti. Kliknite na problem za upute korak po korak.',
  'admin.runCheck': 'Pokreni provjeru',
  'admin.checkPassed': 'Provjera uspješna — ovo možda nije problem.',
  'admin.checkFailed': 'Provjera neuspješna — slijedite korake u nastavku.',
  'admin.issue.signin': 'Korisnici se ne mogu prijaviti',
  'admin.issue.signinDesc': 'Azure AD autentikacija ne radi ili korisnici vide praznu stranicu.',
  'admin.issue.signinSteps':
    'Provjerite je li autentikacija App Service omogućena u Azure Portal.\nProvjerite ima li registracija Azure AD aplikacije ispravne URI-je za preusmjeravanje.\nOsigurajte da registracija aplikacije ima omogućene "ID tokene" pod Autentikacija.\nProvjerite dopušta li zakupac prijavu korisnika u aplikaciju (Poslovne aplikacije → Svojstva → Omogućeno za prijavu korisnika).',
  'admin.issue.onedrive': 'OneDrive sinkronizacija ne radi',
  'admin.issue.onedriveDesc':
    'Projekti se ne sinkroniziraju s OneDrive ili korisnici vide greške dozvola.',
  'admin.issue.onedriveSteps':
    'Provjerite ima li registracija aplikacije delegiranu dozvolu „Files.ReadWrite".\nProvjerite je li dano odobrenje administratora za Graph dozvole.\nOsigurajte da korisnik ima dodijeljenu OneDrive licencu.\nPokušajte se odjaviti i ponovno prijaviti za osvježavanje tokena.',
  'admin.issue.coscout': 'CoScout ne reagira',
  'admin.issue.coscoutDesc': 'AI pomoćnik ne generira odgovore ili prikazuje greške.',
  'admin.issue.coscoutSteps':
    'Provjerite je li AI krajnja točka konfigurirana u ARM predlošku / postavkama App Service.\nProvjerite je li resurs Azure AI Services implementiran i pokrenut.\nProvjerite postoji li implementacija modela (npr. gpt-4o) u resursu AI Services.\nProvjerite kvote Azure AI Services — implementacija je možda dosegla ograničenja brzine.',
  'admin.issue.kbEmpty': 'Baza znanja ne vraća rezultate',
  'admin.issue.kbEmptyDesc':
    'CoScoutovo „Pretraži bazu znanja" ne pronalazi ništa unatoč postojanju dokumenata.',
  'admin.issue.kbEmptySteps':
    'Provjerite je li krajnja točka AI Search konfigurirana u postavkama App Service.\nProvjerite je li udaljeni SharePoint izvor znanja stvoren u AI Search.\nOsigurajte da je ≥1 licenca Microsoft 365 Copilot aktivna u zakupcu.\nProvjerite ima li korisnik pristup SharePoint dokumentima koji se pretražuju.\nProvjerite je li preklopnik pregleda baze znanja omogućen (Administracija → kartica Baza znanja).',
  'admin.issue.teamsTab': 'Teams kartica se ne prikazuje',
  'admin.issue.teamsTabDesc': 'VariScout se ne pojavljuje u Teams ili se kartica ne učitava.',
  'admin.issue.teamsTabSteps':
    'Provjerite je li paket Teams aplikacije (.zip) učitan u centar za administraciju Teams.\nProvjerite odgovara li contentUrl u manifest.json URL-u vašeg App Service.\nOsigurajte da je aplikacija odobrena u centru za administraciju Teams (nije blokirana politikom).\nPokušajte ukloniti i ponovno dodati karticu u kanalu.\nAko koristite prilagođenu domenu, provjerite je li u nizu validDomains manifesta.',
  'admin.issue.newUser': 'Novi korisnik ne može pristupiti aplikaciji',
  'admin.issue.newUserDesc': 'Novododani korisnik vidi odbijen pristup ili praznu stranicu.',
  'admin.issue.newUserSteps':
    'U Azure AD idite na Poslovne aplikacije → VariScout → Korisnici i grupe.\nDodajte korisnika ili njihovu sigurnosnu grupu u aplikaciju.\nAko se koristi „Potrebna dodjela korisnika", osigurajte da korisnik ima dodjelu.\nProvjerite politike uvjetnog pristupa koje bi mogle blokirati korisnika.',
  'admin.issue.aiSlow': 'AI odgovori su spori',
  'admin.issue.aiSlowDesc': 'CoScout dugo odgovara ili često istječe.',
  'admin.issue.aiSlowSteps':
    'Provjerite regiju implementacije Azure AI Services — latencija raste s udaljenošću.\nProvjerite ima li implementacija modela dovoljnu TPM (tokeni po minuti) kvotu.\nRazmislite o nadogradnji na implementaciju s osiguranom propusnošću za dosljednu latenciju.\nProvjerite je li indeks AI Search velik — razmislite o optimizaciji izvora znanja.',
  'admin.issue.forbidden': 'Greške „Forbidden"',
  'admin.issue.forbiddenDesc': 'Korisnici vide greške 403 pri pristupu određenim značajkama.',
  'admin.issue.forbiddenSteps':
    'Provjerite imaju li sve potrebne Graph API dozvole odobrenje administratora.\nProvjerite je li spremište tokena autentikacije App Service omogućeno.\nOsigurajte da token korisnika nije istekao — pokušajte se odjaviti i ponovno prijaviti.\nProvjerite politike uvjetnog pristupa zakupca.',
  'admin.issue.kbPartial': 'KB ne radi za neke korisnike',
  'admin.issue.kbPartialDesc':
    'Pretraga baze znanja radi za administratore, ali ne i za ostale korisnike.',
  'admin.issue.kbPartialSteps':
    'Udaljeni SharePoint izvori znanja koriste dozvole po korisniku. Svaki korisnik mora imati SharePoint pristup dokumentima.\nProvjerite jesu li pogođeni korisnici blokirani politikama uvjetnog pristupa.\nProvjerite je li dano odobrenje administratora za delegiranu dozvolu Sites.Read.All.\nZamolite pogođene korisnike da se odjave i ponovno prijave za osvježavanje tokena.',

  // Workspace navigation
  'workspace.frame': 'Frame',
  'workspace.analysis': 'Analysis',
  'workspace.investigation': 'Investigation',
  'workspace.findings': 'Findings',
  'workspace.improvement': 'Improvement',
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
  'fi.title': 'Inteligencija faktora',
  'fi.ranking': 'Rangiranje faktora (R² prilagođeni)',
  'fi.layer2': 'Sloj 2 · Glavni efekti',
  'fi.layer3': 'Sloj 3 · Interakcije faktora',
  'fi.investigate': 'Istraži →',
  'fi.notSignificant': 'nije značajno (p={value})',
  'fi.explainsSingle': '{factor} objašnjava {pct}% varijacije samostalno.',
  'fi.explainsMultiple': '{factors} zajedno objašnjavaju {pct}% varijacije.',
  'fi.layer2Locked': 'Sloj 2 (Glavni efekti) se otključava kad R²adj > {threshold}%',
  'fi.layer2Current': ' — trenutno {value}%',
  'fi.layer3Locked': 'Sloj 3 (Interakcije) se otključava kad su ≥2 faktora značajna',
  'fi.layer3Current': ' — trenutno {count} značajnih',
  'fi.best': 'Najbolji',
  'fi.range': 'Raspon',
  'fi.interactionDetected': 'Otkrivena interakcija: efekt {factorA} ovisi o razini {factorB}.',
  'fi.noInteraction': 'Nema značajne interakcije — efekti su približno aditivni.',

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

  // Upgrade (additional)
  'upgrade.freeTierLimitation': 'Free tier limitation',
  'upgrade.fromPrice': 'From \u20ac79/month',

  // Investigation Wall
  'wall.status.proposed': 'Proposed',
  'wall.status.evidenced': 'Evidenced',
  'wall.status.confirmed': 'Confirmed',
  'wall.status.refuted': 'Refuted',
  'wall.card.hypothesisLabel': 'Mechanism Branch',
  'wall.card.findings': '{count} findings',
  'wall.card.questions': '{count} questions',
  'wall.card.evidenceGap': 'Evidence gap',
  'wall.card.missingColumn': '⚠ Condition references missing column',
  'wall.card.missingColumnAria': 'Condition references missing column',
  'wall.card.ariaLabel': 'Mechanism Branch {name}, {status}, {count} supporting clues',
  'wall.problem.title': 'Problem condition',
  'wall.problem.eventsPerWeek': '{count} events/wk',
  'wall.problem.ariaLabel': 'Problem condition: {column}, Cpk {cpk}, {count} events per week',
  'wall.gate.and': 'AND',
  'wall.gate.or': 'OR',
  'wall.gate.not': 'NOT',
  'wall.gate.holds': 'HOLDS {matching}/{total}',
  'wall.gate.noTotals': '—/0',
  'wall.gate.ariaLabel': 'Gate {kind} {holds}',
  'wall.question.ariaLabel': 'Question: {text}, {status}',
  'wall.tributary.ariaLabel': 'Tributaries from Process Map',
  'wall.empty.ariaLabel': 'Mechanism Branch empty state',
  'wall.empty.title': 'Start a Mechanism Branch',
  'wall.empty.subtitle': 'Start from a suspected mechanism, question, or Factor Intelligence.',
  'wall.empty.writeHypothesis': 'Write a suspected mechanism',
  'wall.empty.promoteFromQuestion': 'Promote from a question',
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
  'wall.canvas.ariaLabel': 'Mechanism Branch workspace',
  'wall.cta.proposeHypothesis': 'Propose suspected mechanism from this finding',
  'wall.toolbar.groupByTributary': 'Group by tributary',
  'wall.toolbar.zoomIn': 'Zoom in',
  'wall.toolbar.zoomOut': 'Zoom out',
  'wall.toolbar.resetView': 'Reset view',
  'wall.palette.placeholder': 'Search hubs, questions, findings…',
  'wall.palette.empty': 'No matches',
  'wall.palette.kind.hub': 'BRANCH',
  'wall.palette.kind.question': 'QUESTION',
  'wall.palette.kind.finding': 'FINDING',
  'wall.minimap.ariaLabel': 'Investigation Wall minimap',

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
};
