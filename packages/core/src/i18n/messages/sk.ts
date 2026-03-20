import type { MessageCatalog } from '../types';

/** Slovak message catalog */
export const sk: MessageCatalog = {
  // Statistics labels
  'stats.mean': 'Priemer',
  'stats.median': 'Medián',
  'stats.stdDev': 'Štan. odchýlka',
  'stats.samples': 'Vzorky',
  'stats.passRate': 'Miera zhody',
  'stats.range': 'Rozpätie',
  'stats.min': 'Min.',
  'stats.max': 'Max.',
  'stats.target': 'Cieľ',
  'stats.sigma': 'Sigma',

  // Chart labels
  'chart.observation': 'Pozorovanie',
  'chart.count': 'Počet',
  'chart.frequency': 'Frekvencia',
  'chart.value': 'Hodnota',
  'chart.category': 'Kategória',
  'chart.cumulative': 'Kumulatívne %',
  'chart.clickToEdit': 'Kliknite pre úpravu',
  'chart.median': 'Medián',
  'chart.q1': 'Q1',
  'chart.q3': 'Q3',
  'chart.noChannelData': 'Žiadne údaje kanála',
  'chart.selectChannel': 'Vyberte kanál',

  // Limit labels
  'limits.usl': 'HMT',
  'limits.lsl': 'DMT',
  'limits.ucl': 'HRH',
  'limits.lcl': 'DRH',
  'limits.mean': 'Priemer',
  'limits.target': 'Cieľ',

  // Navigation
  'nav.newAnalysis': 'Nová analýza',
  'nav.backToDashboard': 'Späť na panel',
  'nav.settings': 'Nastavenia',
  'nav.export': 'Export',
  'nav.presentation': 'Prezentácia',
  'nav.menu': 'Menu',
  'nav.moreActions': 'Ďalšie akcie',

  // Panel titles
  'panel.findings': 'Zistenia',
  'panel.dataTable': 'Tabuľka údajov',
  'panel.whatIf': 'Čo ak',
  'panel.investigation': 'Vyšetrovanie',
  'panel.coScout': 'CoScout',
  'panel.drillPath': 'Cesta hĺbkovej analýzy',

  // View modes
  'view.list': 'Zoznam',
  'view.board': 'Tabuľa',
  'view.tree': 'Strom',

  // Action buttons
  'action.save': 'Uložiť',
  'action.cancel': 'Zrušiť',
  'action.delete': 'Odstrániť',
  'action.edit': 'Upraviť',
  'action.copy': 'Kopírovať',
  'action.close': 'Zavrieť',
  'action.learnMore': 'Zistiť viac',
  'action.download': 'Stiahnuť',
  'action.apply': 'Použiť',
  'action.reset': 'Obnoviť',
  'action.retry': 'Skúsiť znova',
  'action.send': 'Odoslať',
  'action.ask': 'Opýtať sa',
  'action.clear': 'Vymazať',
  'action.copyAll': 'Kopírovať všetko',
  'action.selectAll': 'Vybrať všetko',

  // CoScout
  'coscout.send': 'Odoslať',
  'coscout.clear': 'Vymazať konverzáciu',
  'coscout.stop': 'Zastaviť',
  'coscout.rateLimit': 'Dosiahnutý limit požiadaviek. Prosím, počkajte.',
  'coscout.contentFilter': 'Obsah bol filtrovaný bezpečnostnou politikou.',
  'coscout.error': 'Vyskytla sa chyba. Prosím, skúste to znova.',

  // Display/settings
  'display.preferences': 'Predvoľby',
  'display.chartTextSize': 'Veľkosť textu grafu',
  'display.compact': 'Kompaktné',
  'display.normal': 'Normálne',
  'display.large': 'Veľké',
  'display.lockYAxis': 'Zamknúť os Y',
  'display.filterContext': 'Kontext filtra',
  'display.showSpecs': 'Zobraziť špecifikácie',

  // Investigation
  'investigation.brief': 'Súhrn vyšetrovania',
  'investigation.assignedToMe': 'Pridelené mne',
  'investigation.hypothesis': 'Hypotéza',
  'investigation.hypotheses': 'Hypotézy',
  'investigation.pinAsFinding': 'Pripnúť ako zistenie',
  'investigation.addObservation': 'Pridať pozorovanie',

  // Empty states
  'empty.noData': 'Žiadne dostupné údaje',
  'empty.noFindings': 'Zatiaľ žiadne zistenia',
  'empty.noResults': 'Neboli nájdené žiadne výsledky',

  // Error messages
  'error.generic': 'Niečo sa pokazilo',
  'error.loadFailed': 'Nepodarilo sa načítať údaje',
  'error.parseFailed': 'Nepodarilo sa spracovať súbor',

  // Settings labels
  'settings.language': 'Jazyk',
  'settings.theme': 'Téma',
  'settings.textSize': 'Veľkosť textu',

  // Finding statuses
  'findings.observed': 'Pozorované',
  'findings.investigating': 'Vyšetruje sa',
  'findings.analyzed': 'Analyzované',
  'findings.improving': 'Zlepšuje sa',
  'findings.resolved': 'Vyriešené',

  // Report labels
  'report.summary': 'Súhrn',
  'report.findings': 'Zistenia',
  'report.recommendations': 'Odporúčania',
  'report.evidence': 'Dôkazy',

  // Data input labels
  'data.pasteData': 'Vložiť údaje',
  'data.uploadFile': 'Nahrať súbor',
  'data.columnMapping': 'Mapovanie stĺpcov',
  'data.measureColumn': 'Stĺpec merania',
  'data.factorColumn': 'Stĺpec faktora',
  'data.addData': 'Pridať údaje',
  'data.editData': 'Upraviť údaje',
  'data.showDataTable': 'Zobraziť tabuľku údajov',
  'data.hideDataTable': 'Skryť tabuľku údajov',

  // Status
  'status.cached': 'Uložené v cache',
  'status.loading': 'Načítava sa',
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
  'data.problemPlaceholder': 'Describe the problem you are investigating…',
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
  'data.addHypothesis': 'Add hypothesis',
  'data.removeHypothesis': 'Remove hypothesis',
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
  'investigation.phaseDiverging': 'Explore multiple hypotheses',
  'investigation.phaseValidating': 'Test and validate hypotheses',
  'investigation.phaseConverging': 'Narrow to root cause',
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
  'ai.tool.createHypothesis': 'Create hypothesis',
  'ai.tool.suggestAction': 'Suggest action',
  'ai.tool.shareFinding': 'Share finding',
  'ai.tool.publishReport': 'Publish report',
  'ai.tool.notifyOwners': 'Notify owners',
  'ai.tool.suggestIdea': 'Suggest improvement idea',

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
  'display.contribution': 'Contribution',
  'display.contributionDesc': 'Show variation contribution',
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
    'Nelsonovo pravidlo 2 — séria {count} {side} priemeru (#{start}–{end})',
  'chart.violation.nelson3.detail':
    'Nelsonovo pravidlo 3 — trend {count} {direction} (#{start}–{end})',
  'chart.violation.side.above': 'nad',
  'chart.violation.side.below': 'pod',
  'chart.violation.direction.increasing': 'rastúci',
  'chart.violation.direction.decreasing': 'klesajúci',

  // Parameterized messages
  'data.rowsLoaded': '{count} rows loaded',
  'findings.countLabel': '{count} zistení',
  'chart.label.target': 'Cieľ:',

  // Chart limit labels
  'chart.label.ucl': 'HRH:',
  'chart.label.lcl': 'DRH:',
  'chart.label.mean': 'Priemer:',
  'chart.label.tgt': 'Cieľ:',
  'chart.label.usl': 'HMT:',
  'chart.label.lsl': 'DMT:',
  'chart.label.value': 'Hodnota:',
  'chart.label.n': 'n:',

  // Chart status
  'chart.status.inControl': 'Pod kontrolou',
  'chart.status.outOfControl': 'Mimo kontroly (za HRH/DRH)',
  'chart.noDataProbPlot': 'Žiadne údaje pre graf pravdepodobnosti',

  // Chart edit affordances
  'chart.edit.spec': 'Kliknite pre úpravu {spec}',
  'chart.edit.axisLabel': 'Kliknite pre úpravu označenia osi',
  'chart.edit.yAxis': 'Kliknite pre úpravu mierky osi Y',
  'chart.edit.saveCancel': 'Enter pre uloženie · Esc pre zrušenie',

  // Performance table headers
  'chart.table.channel': 'Kanál',
  'stats.cp': 'Cp',

  // Chart UI labels
  'chart.copyToClipboard': 'Kopírovať graf do schránky',
  'chart.maximize': 'Maximalizovať graf',
  'chart.type.ichart': 'I-Chart',
  'chart.type.boxplot': 'Boxplot',
  'chart.type.pareto': 'Pareto',
  'chart.drillHere': '↓ podrobnosti tu',
  'chart.percent': 'Percento',

  // Y-axis popover
  'chart.yAxisScale': 'Mierka osi Y',
  'validation.minLessThanMax': 'Min musí byť menšie ako Max',
  'action.noChanges': 'Žiadne zmeny',

  // Create factor modal
  'factor.create': 'Vytvoriť faktor z výberu',
  'factor.name': 'Názov faktora',
  'factor.nameEmpty': 'Názov faktora nesmie byť prázdny',
  'factor.nameExists': 'Faktor s týmto názvom už existuje',
  'factor.example': 'napr. Udalosti vysokej teploty',
  'factor.pointsMarked': '{count} bodov bude označených ako:',
  'factor.createAndFilter': 'Vytvoriť a filtrovať',
  'factor.filterExplanation':
    'Zobrazenie sa automaticky vyfiltruje na zobrazenie iba vybraných bodov.',

  // Characteristic type selector
  'charType.nominal': 'Nominálny',
  'charType.nominalDesc': 'Centrovaný na cieľ (napr. hmotnosť plnenia)',
  'charType.smaller': 'Menšie je lepšie',
  'charType.smallerDesc': 'Nižšie je lepšie (napr. chyby)',
  'charType.larger': 'Väčšie je lepšie',
  'charType.largerDesc': 'Vyššie je lepšie (napr. výťažnosť)',

  // Investigation prompt
  'investigation.trackingPrompt':
    'Sledovanie vášho vyšetrovania — otvorte panel Vyšetrovania pre úplný obraz.',

  // Mobile category sheet
  'chart.highlight': 'Zvýraznenie:',
  'chart.highlightRed': 'Červená',
  'chart.highlightAmber': 'Jantárová',
  'chart.highlightGreen': 'Zelená',
  'chart.clearHighlight': 'Zrušiť zvýraznenie',
  'chart.drillDown': 'Podrobnosti v „{category}"',
  'ai.askCoScout': 'Opýtajte sa CoScout na toto',

  // Settings descriptions
  'display.lockYAxisDesc': 'Zachováva mierku pre vizuálne porovnanie',
  'display.filterContextDesc': 'Zobraziť súhrn aktívneho filtra pod názvami grafov',

  // Performance detected modal
  'performance.detected': 'Zistený režim výkonu',
  'performance.columnsFound': 'Nájdených {count} meracích stĺpcov',
  'performance.labelQuestion': 'Čo reprezentujú tieto meracie kanály?',
  'performance.labelExample': 'napr. Plniaca hlava, Dutina, Tryska',
  'performance.enable': 'Aktivovať režim výkonu',

  // Finding editor & data types
  'finding.placeholder': 'Čo ste zistili?',
  'finding.note': 'Poznámka k zisteniu',
  'data.typeNumeric': 'Číselné',
  'data.typeCategorical': 'Kategoriálne',
  'data.typeDate': 'Dátum',
  'data.typeText': 'Text',
  'data.categories': 'kategórie',

  // PWA HomeScreen
  'home.heading': 'Preskúmajte analýzu variácie',
  'home.description':
    'Bezplatný nástroj na školenie analýzy variácie. Vizualizujte variabilitu, vypočítajte spôsobilosť a nájdite kam zamerať pozornosť — priamo vo vašom prehliadači.',
  'home.divider': 'alebo použite vlastné údaje',
  'home.pasteHelper': 'Skopírujte riadky a vložte — automaticky rozpoznáme stĺpce',
  'home.manualEntry': 'Alebo zadajte údaje ručne',
  'home.upgradeHint': 'Potrebujete tímové funkcie, nahrávanie súborov alebo uložené projekty?',

  // PWA navigation
  'nav.presentationMode': 'Režim prezentácie',
  'nav.hideFindings': 'Skryť zistenia',

  // Export
  'export.asImage': 'Exportovať ako obrázok',
  'export.asCsv': 'Exportovať ako CSV',
  'export.imageDesc': 'PNG snímka obrazovky pre prezentácie',
  'export.csvDesc': 'Dátový súbor kompatibilný s tabuľkami',

  // Sample section
  'sample.heading': 'Vyskúšajte vzorový súbor údajov',
  'sample.allSamples': 'Všetky vzorové súbory údajov',
  'sample.featured': 'Odporúčané',
  'sample.caseStudies': 'Prípadové štúdie',
  'sample.journeys': 'Vzdelávacie cesty',
  'sample.industry': 'Priemyselné príklady',

  // View modes
  'view.stats': 'Štatistika',
  'display.appearance': 'Vzhľad',

  // Azure toolbar
  'data.manualEntry': 'Ručné zadávanie',
  'data.editTable': 'Upraviť tabuľku údajov',
  'toolbar.saveAs': 'Uložiť ako…',
  'toolbar.saving': 'Ukladanie…',
  'toolbar.saved': 'Uložené',
  'toolbar.saveFailed': 'Uloženie zlyhalo',
  'toolbar.addMore': 'Pridať údaje',
  'report.scouting': 'Správa z prieskumu',
  'export.csvFiltered': 'Exportovať filtrované údaje ako CSV',
  'error.auth': 'Chyba overenia',

  // File browse
  'file.browseLocal': 'Prehľadávať toto zariadenie',
  'file.browseSharePoint': 'Prehľadávať SharePoint',
  'file.open': 'Otvoriť súbor',

  // Admin hub
  'admin.title': 'Administrácia',
  'admin.status': 'Stav',
  'admin.plan': 'Plán a funkcie',
  'admin.teams': 'Nastavenie Teams',
  'admin.knowledge': 'Znalostná báza',
  'admin.troubleshooting': 'Riešenie problémov',

  // Admin plan tab
  'admin.currentPlan': 'Aktuálny',
  'admin.feature': 'Funkcia',
  'admin.manageSubscription': 'Spravovať predplatné v Azure',
  'admin.planStandard': 'Standard',
  'admin.planTeam': 'Team',
  'admin.planStandardPrice': '€79/mes.',
  'admin.planTeamPrice': '€199/mes.',
  'admin.planStandardDesc': 'Úplná analýza s CoScout AI',
  'admin.planTeamDesc': 'Teams, OneDrive, SharePoint, znalostná báza',

  // Feature names
  'feature.charts': 'I-Chart, Boxplot, Pareto, Štatistika',
  'feature.capability': 'Analýza spôsobilosti (Cp/Cpk)',
  'feature.performance': 'Režim výkonu (viackanálový)',
  'feature.anova': 'ANOVA a faktorová analýza',
  'feature.findingsWorkflow': 'Zistenia a pracovný postup vyšetrovania',
  'feature.whatIf': 'Simulácia čo-ak',
  'feature.csvImport': 'Import CSV/Excel',
  'feature.reportExport': 'Export správy (PDF)',
  'feature.indexedDb': 'Lokálne úložisko IndexedDB',
  'feature.maxFactors': 'Až 6 faktorov',
  'feature.maxRows': 'Až 100K riadkov',
  'feature.onedriveSync': 'Synchronizácia projektov cez OneDrive',
  'feature.sharepointPicker': 'Výber súborov zo SharePoint',
  'feature.teamsIntegration': 'Integrácia s Microsoft Teams',
  'feature.channelCollab': 'Spolupráca na základe kanálov',
  'feature.mobileUi': 'UI optimalizované pre mobilné zariadenia',
  'feature.coScoutAi': 'CoScout AI asistent',
  'feature.narrativeBar': 'Postrehy NarrativeBar',
  'feature.chartInsights': 'Čipy postrehov grafov',
  'feature.knowledgeBase': 'Znalostná báza (vyhľadávanie SharePoint)',
  'feature.aiActions': 'AI-navrhnuté akcie',

  // Admin Teams setup
  'admin.teams.heading': 'Pridať VariScout do Microsoft Teams',
  'admin.teams.description':
    'Vygenerujte balík aplikácie Teams pre vaše nasadenie a nahrajte ho do centra správy Teams.',
  'admin.teams.running': 'Beží v rámci Microsoft Teams',
  'admin.teams.step1': 'ID klienta registrácie aplikácie (Voliteľné)',
  'admin.teams.step1Desc':
    'Zadajte ID klienta registrácie aplikácie Azure AD na povolenie Teams SSO v manifeste.',
  'admin.teams.step2': 'Stiahnuť balík aplikácie Teams',
  'admin.teams.step2Desc':
    'Tento .zip obsahuje manifest a ikony predkonfigurované pre vaše nasadenie.',
  'admin.teams.step3': 'Nahrať do centra správy Teams',
  'admin.teams.step4': 'Pridať VariScout do kanála',
  'admin.teams.download': 'Stiahnuť balík aplikácie Teams',

  // Admin status tab
  'admin.checksResult': '{pass}/{total} kontrol úspešných',
  'admin.runChecks': 'Spustiť všetky kontroly',
  'admin.notApplicable': 'Neplatí pre váš plán',
  'admin.managePortal': 'Spravovať v Azure Portal',
  'admin.portalAccessNote':
    'Tieto položky vyžadujú prístup k Azure Portal a nedajú sa skontrolovať z prehliadača.',
  'admin.fixInPortal': 'Opraviť v Azure Portal: {label}',

  // Admin troubleshoot tab
  'admin.troubleshoot.intro':
    'Bežné problémy a ako ich vyriešiť. Kliknite na problém pre podrobné pokyny.',
  'admin.runCheck': 'Spustiť kontrolu',
  'admin.checkPassed': 'Kontrola úspešná — toto nemusí byť problém.',
  'admin.checkFailed': 'Kontrola neúspešná — postupujte podľa krokov nižšie.',
  'admin.issue.signin': 'Používatelia sa nemôžu prihlásiť',
  'admin.issue.signinDesc': 'Overenie Azure AD nefunguje alebo používatelia vidia prázdnu stránku.',
  'admin.issue.signinSteps':
    'Overte, že overenie App Service je povolené v Azure Portal.\nSkontrolujte, či registrácia aplikácie Azure AD má správne URI pre presmerovanie.\nUistite sa, že registrácia aplikácie má povolené „ID tokeny" v časti Overenie.\nOverte, že nájomca povoľuje prihlásenie používateľov do aplikácie (Podnikové aplikácie → Vlastnosti → Povolené pre prihlásenie používateľov).',
  'admin.issue.onedrive': 'Synchronizácia OneDrive nefunguje',
  'admin.issue.onedriveDesc':
    'Projekty sa nesynchronizujú s OneDrive alebo používatelia vidia chyby oprávnení.',
  'admin.issue.onedriveSteps':
    'Overte, že registrácia aplikácie má delegované oprávnenie „Files.ReadWrite".\nSkontrolujte, či bol udelený súhlas správcu pre oprávnenia Graph.\nUistite sa, že používateľ má pridelenú licenciu OneDrive.\nSkúste sa odhlásiť a znova prihlásiť na obnovenie tokenu.',
  'admin.issue.coscout': 'CoScout nereaguje',
  'admin.issue.coscoutDesc': 'AI asistent negeneruje odpovede alebo zobrazuje chyby.',
  'admin.issue.coscoutSteps':
    'Overte, že koncový bod AI je nakonfigurovaný v ARM šablóne / nastaveniach App Service.\nSkontrolujte, či je prostriedok Azure AI Services nasadený a beží.\nOverte, že nasadenie modelu existuje (napr. gpt-4o) v prostriedku AI Services.\nSkontrolujte kvóty Azure AI Services — nasadenie mohlo dosiahnuť limity rýchlosti.',
  'admin.issue.kbEmpty': 'Znalostná báza nevracia výsledky',
  'admin.issue.kbEmptyDesc':
    '„Vyhľadať v znalostnej báze" CoScout nenachádza nič napriek existencii dokumentov.',
  'admin.issue.kbEmptySteps':
    'Overte, že koncový bod AI Search je nakonfigurovaný v nastaveniach App Service.\nSkontrolujte, či bol vzdialený SharePoint zdroj znalostí vytvorený v AI Search.\nUistite sa, že ≥1 licencia Microsoft 365 Copilot je aktívna v nájomcovi.\nOverte, že používateľ má prístup SharePoint k vyhľadávaným dokumentom.\nSkontrolujte, či je prepínač náhľadu znalostnej bázy povolený (Administrácia → karta Znalostná báza).',
  'admin.issue.teamsTab': 'Karta Teams sa nezobrazuje',
  'admin.issue.teamsTabDesc': 'VariScout sa nezobrazuje v Teams alebo sa karta nenačítava.',
  'admin.issue.teamsTabSteps':
    'Overte, že balík aplikácie Teams (.zip) bol nahraný do centra správy Teams.\nSkontrolujte, či contentUrl v manifest.json zodpovedá URL vášho App Service.\nUistite sa, že aplikácia je schválená v centre správy Teams (nie je blokovaná politikou).\nSkúste kartu v kanáli odstrániť a znova pridať.\nAk používate vlastnú doménu, overte, že je v poli validDomains manifestu.',
  'admin.issue.newUser': 'Nový používateľ nemá prístup k aplikácii',
  'admin.issue.newUserDesc':
    'Novo pridaný používateľ vidí odmietnutý prístup alebo prázdnu stránku.',
  'admin.issue.newUserSteps':
    'V Azure AD prejdite na Podnikové aplikácie → VariScout → Používatelia a skupiny.\nPridajte používateľa alebo ich bezpečnostnú skupinu do aplikácie.\nAk sa používa „Vyžaduje sa priradenie používateľa", uistite sa, že používateľ má priradenie.\nSkontrolujte politiky podmieneného prístupu, ktoré by mohli blokovať používateľa.',
  'admin.issue.aiSlow': 'AI odpovede sú pomalé',
  'admin.issue.aiSlowDesc': 'CoScout dlho odpovedá alebo často vyprší časový limit.',
  'admin.issue.aiSlowSteps':
    'Skontrolujte región nasadenia Azure AI Services — latencia rastie so vzdialenosťou.\nOverte, že nasadenie modelu má dostatočnú kvótu TPM (tokenov za minútu).\nZvážte upgrade na nasadenie so zaručenou priepustnosťou pre konzistentnú latenciu.\nSkontrolujte, či je index AI Search veľký — zvážte optimalizáciu zdroja znalostí.',
  'admin.issue.forbidden': 'Chyby „Forbidden"',
  'admin.issue.forbiddenDesc': 'Používatelia vidia chyby 403 pri prístupe k určitým funkciám.',
  'admin.issue.forbiddenSteps':
    'Skontrolujte, či všetky požadované oprávnenia Graph API majú súhlas správcu.\nOverte, že úložisko tokenov overenia App Service je povolené.\nUistite sa, že token používateľa nevypršal — skúste sa odhlásiť a znova prihlásiť.\nSkontrolujte politiky podmieneného prístupu nájomcu.',
  'admin.issue.kbPartial': 'KB nefunguje pre niektorých používateľov',
  'admin.issue.kbPartialDesc':
    'Vyhľadávanie v znalostnej báze funguje pre správcov, ale nie pre ostatných používateľov.',
  'admin.issue.kbPartialSteps':
    'Vzdialené SharePoint zdroje znalostí používajú oprávnenia pre každého používateľa. Každý používateľ musí mať prístup SharePoint k dokumentom.\nSkontrolujte, či sú postihnutí používatelia blokovaní politikami podmieneného prístupu.\nOverte, že bol udelený súhlas správcu pre delegované oprávnenie Sites.Read.All.\nPožiadajte postihnutých používateľov, aby sa odhlásili a znova prihlásili na obnovenie ich tokenu.',

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
  'improve.selectedCount': '{count} selected',
  'improve.effortBreakdown': '{low} low · {medium} med · {high} high',
  'improve.projectedCpk': 'Projected Cpk: {value}',
  'improve.targetDelta': 'Δ {delta} to target',
  'improve.convertedToAction': '→ Action',

  // Effort labels
  'effort.low': 'Low',
  'effort.medium': 'Medium',
  'effort.high': 'High',
  'effort.label': 'Effort',

  // Idea direction labels (Four Ideation Directions)
  'idea.direction': 'Direction',
  'idea.prevent': 'Prevent',
  'idea.detect': 'Detect',
  'idea.simplify': 'Simplify',
  'idea.eliminate': 'Eliminate',

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
};
