import type { MessageCatalog } from '../types';

/**
 * Finnish message catalog
 */
export const fi: MessageCatalog = {
  // Statistics labels
  'stats.mean': 'Keskiarvo',
  'stats.median': 'Mediaani',
  'stats.stdDev': 'Keskihaj.',
  'stats.samples': 'Näytteet',
  'stats.passRate': 'Hyväksymis-%',
  'stats.range': 'Vaihteluväli',
  'stats.min': 'Min',
  'stats.max': 'Maks',
  'stats.target': 'Tavoite',
  'stats.sigma': 'Sigma',

  // Chart labels
  'chart.observation': 'Havainto',
  'chart.count': 'Lukumäärä',
  'chart.frequency': 'Frekvenssi',
  'chart.value': 'Arvo',
  'chart.category': 'Kategoria',
  'chart.cumulative': 'Kumulatiivinen %',
  'chart.clickToEdit': 'Napsauta muokataksesi',
  'chart.median': 'Mediaani',
  'chart.q1': 'Q1',
  'chart.q3': 'Q3',
  'chart.noChannelData': 'Ei kanavadataa',
  'chart.selectChannel': 'Valitse kanava',

  // Limit labels (SFS standard — uses ISO abbreviations)
  'limits.usl': 'USL',
  'limits.lsl': 'LSL',
  'limits.ucl': 'UCL',
  'limits.lcl': 'LCL',
  'limits.mean': 'Keskiarvo',
  'limits.target': 'Tavoite',

  // Navigation
  'nav.newAnalysis': 'Uusi analyysi',
  'nav.backToDashboard': 'Takaisin hallintapaneeliin',
  'nav.settings': 'Asetukset',
  'nav.export': 'Vie',
  'nav.presentation': 'Esitys',
  'nav.menu': 'Valikko',
  'nav.moreActions': 'Lisää toimintoja',

  // Panel titles
  'panel.findings': 'Havainnot',
  'panel.dataTable': 'Datataulukko',
  'panel.whatIf': 'Entä jos',
  'panel.analyze': 'Tutkimus',
  'panel.coScout': 'CoScout',
  'panel.drillPath': 'Porautumispolku',

  // View modes
  'view.list': 'Lista',
  'view.board': 'Taulu',
  'view.tree': 'Puu',

  // Action buttons
  'action.save': 'Tallenna',
  'action.cancel': 'Peruuta',
  'action.delete': 'Poista',
  'action.edit': 'Muokkaa',
  'action.copy': 'Kopioi',
  'action.close': 'Sulje',
  'action.learnMore': 'Lue lisää',
  'action.download': 'Lataa',
  'action.apply': 'Käytä',
  'action.reset': 'Palauta',
  'action.retry': 'Yritä uudelleen',
  'action.send': 'Lähetä',
  'action.ask': 'Kysy',
  'action.clear': 'Tyhjennä',
  'action.copyAll': 'Kopioi kaikki',
  'action.selectAll': 'Valitse kaikki',

  // CoScout
  'coscout.send': 'Lähetä',
  'coscout.clear': 'Tyhjennä keskustelu',
  'coscout.stop': 'Pysäytä',
  'coscout.rateLimit': 'Pyyntöraja saavutettu. Odota hetki.',
  'coscout.contentFilter': 'Sisältö suodatettu turvallisuuskäytännön mukaisesti.',
  'coscout.error': 'Tapahtui virhe. Yritä uudelleen.',

  // Display/settings
  'display.preferences': 'Asetukset',
  'display.density': 'Näyttötiheys',
  'display.lockYAxis': 'Lukitse Y-akseli',
  'display.filterContext': 'Suodatinkonteksti',
  'display.showSpecs': 'Näytä spesifikaatiot',

  // Investigation
  'analyze.brief': 'Tutkimusraportti',
  'analyze.assignedToMe': 'Minulle osoitetut',
  'analyze.pinAsFinding': 'Kiinnitä havainnoksi',
  'analyze.addObservation': 'Lisää havainto',

  // Empty states
  'empty.noData': 'Ei dataa saatavilla',
  'empty.noFindings': 'Ei havaintoja vielä',
  'empty.noResults': 'Ei tuloksia',

  // Error messages
  'error.generic': 'Jokin meni pieleen',
  'error.loadFailed': 'Datan lataus epäonnistui',
  'error.parseFailed': 'Tiedoston käsittely epäonnistui',

  // Settings labels
  'settings.language': 'Kieli',
  'settings.theme': 'Teema',
  'settings.textSize': 'Tekstikoko',

  // Finding statuses
  'findings.observed': 'Havaittu',
  'findings.investigating': 'Tutkitaan',
  'findings.analyzed': 'Analysoitu',
  'findings.improving': 'Parannetaan',
  'findings.resolved': 'Ratkaistu',

  // Report labels
  'report.summary': 'Yhteenveto',
  'report.findings': 'Havainnot',
  'report.recommendations': 'Suositukset',
  'report.evidence': 'Todisteet',

  // Data input labels
  'data.pasteData': 'Liitä data',
  'data.uploadFile': 'Lataa tiedosto',
  'data.columnMapping': 'Sarakkeiden yhdistäminen',
  'data.measureColumn': 'Mittaussarake',
  'data.factorColumn': 'Tekijäsarake',
  'data.addData': 'Lisää dataa',
  'data.editData': 'Muokkaa dataa',
  'data.showDataTable': 'Näytä datataulukko',
  'data.hideDataTable': 'Piilota datataulukko',

  // Status
  'status.cached': 'Välimuistissa',
  'status.loading': 'Ladataan',
  'status.ai': 'Tekoäly',

  // Report KPIs
  'report.kpi.samples': 'Näytteet',
  'report.kpi.mean': 'Keskiarvo',
  'report.kpi.variation': 'Vaihtelu',
  'report.kpi.cpk': 'Cpk',
  'report.kpi.passRate': 'Hyväksyntäaste',

  // AI Actions
  'ai.propose': 'Ehdota',
  'ai.applied': 'Käytetty',
  'ai.dismissed': 'Hylätty',
  'ai.expired': 'Vanhentunut',

  // Staged analysis
  'staged.before': 'Ennen',
  'staged.after': 'Jälkeen',
  'staged.comparison': 'Vertailu',

  // Data input / Column mapping
  'data.mapHeading': 'Yhdistä sarakkeet',
  'data.confirmColumns': 'Vahvista sarakkeet',
  'data.selectOutcome': 'Valitse tulosmuuttuja',
  'data.selectFactors': 'Valitse tekijät',
  'data.analysisSection': 'Analyysikuvaus',
  'data.optional': 'valinnainen',
  'data.issueStatementPlaceholder': 'Kuvaile mitä haluat tutkia…',
  'data.outcomeDesc': 'Mittaus, jota haluat analysoida',
  'data.factorsDesc': 'Kategoriat, jotka voivat vaikuttaa tulokseen',
  'data.alreadyOutcome': 'Jo valittu tulosmuuttujaksi',
  'data.showNumericOnly': 'Vain numeeriset',
  'data.showCategoricalOnly': 'Vain kategoriset',
  'data.showAllColumns': 'Kaikki sarakkeet',
  'data.improvementTarget': 'Parannustavoite',
  'data.metric': 'Mittari',
  'data.startAnalysis': 'Aloita analyysi',
  'data.applyChanges': 'Ota muutokset käyttöön',
  'data.back': 'Takaisin',

  // Paste screen
  'data.pasteInstructions': 'Liitä data tähän',
  'data.pasteSubtitle': 'Kopioi Excelistä, CSV-tiedostosta tai taulukkolaskimesta',
  'data.useExample': 'Käytä esimerkkidataa',
  'data.analyzing': 'Analysoidaan…',
  'data.tipWithData': 'Vinkki: Sisällytä sarakeotsikot ensimmäiselle riville',
  'data.tipNoData': 'Vinkki: Kokeile liittää dataa taulukkolaskimesta tai CSV-tiedostosta',

  // Data quality
  'quality.allValid': 'Kaikki data kelvollista',
  'quality.rowsReady': '{count} riviä valmiina analyysiin',
  'quality.rowsExcluded': '{count} riviä poissuljettu',
  'quality.missingValues': 'Puuttuvia arvoja',
  'quality.nonNumeric': 'Ei-numeerisia arvoja',
  'quality.noVariation': 'Ei vaihtelua',
  'quality.emptyColumn': 'Tyhjä sarake',
  'quality.noVariationWarning': 'Tässä sarakkeessa ei ole vaihtelua — kaikki arvot ovat identtisiä',
  'quality.viewExcluded': 'Näytä poissuljetut',
  'quality.viewAll': 'Näytä kaikki',

  // Manual entry
  'manual.setupTitle': 'Manuaalinen datasyöttö',
  'manual.analysisMode': 'Analyysitapa',
  'manual.standard': 'Perus',
  'manual.standardDesc': 'Yksi mittaussarake valinnaisilla tekijöillä',
  'manual.performance': 'Suorituskyky',
  'manual.performanceDesc': 'Useita mittauskanavia (täyttöpäät, muotit)',
  'manual.outcome': 'Tulosmuuttuja',
  'manual.outcomeExample': 'esim. Paino, Pituus, Lämpötila',
  'manual.factors': 'Tekijät',
  'manual.addFactor': 'Lisää tekijä',
  'manual.measureLabel': 'Mittauksen nimi',
  'manual.measureExample': 'esim. Täyttöpää, Muotti, Suutin',
  'manual.channelCount': 'Kanavien lukumäärä',
  'manual.channelRange': '{min}–{max} kanavaa',
  'manual.startEntry': 'Aloita syöttö',
  'manual.specs': 'Spesifikaatiot',
  'manual.specsApplyAll': 'Käytä kaikissa kanavissa',
  'manual.specsHelper': 'Aseta spesifikaatiorajat tulosmuuttujalle',

  // Chart legend
  'chart.legend.commonCause': 'Satunnaisvaihtelu',
  'chart.legend.specialCause': 'Erityissyy',
  'chart.legend.outOfSpec': 'Toleranssin ulkopuolella',
  'chart.legend.inControl': 'Hallinnassa',
  'chart.legend.randomVariation': 'Satunnaisvaihtelu',
  'chart.legend.defect': 'Asiakasvirhe',

  // Chart violations
  'chart.violation.aboveUsl': 'USL:n yläpuolella ({value})',
  'chart.violation.belowLsl': 'LSL:n alapuolella ({value})',
  'chart.violation.aboveUcl': 'UCL:n yläpuolella — erityissyy',
  'chart.violation.belowLcl': 'LCL:n alapuolella — erityissyy',
  'chart.violation.aboveUclFavorable': 'UCL:n yläpuolella — suotuisa muutos',
  'chart.violation.belowLclFavorable': 'LCL:n alapuolella — suotuisa muutos',
  'chart.violation.nelson2': 'Nelsonin sääntö 2 — jakso {count}',
  'chart.violation.nelson3': 'Nelsonin sääntö 3 — trendi {count}',

  // Analyze sidebar
  'analyze.phaseInitial': 'Kerää alkuhavainnot',
  'analyze.phaseDiverging': 'Tutki useita hypoteeseja',
  'analyze.phaseValidating': 'Testaa ja vahvista hypoteesit',
  'analyze.phaseConverging': 'Rajaa juurisyyhyn',
  'analyze.phaseImproving': 'Toteuta ja varmista muutokset',
  'analyze.pdcaTitle': 'Vahvistustarkistuslista',
  'analyze.verifyChart': 'I-kaavio vakaa muutoksen jälkeen',
  'analyze.verifyStats': 'Cpk saavuttaa tavoitteen',
  'analyze.verifyBoxplot': 'Laatikkokuvaajan hajonta pienentynyt',
  'analyze.verifySideEffects': 'Sivuvaikutuksia ei havaittu',
  'analyze.verifyOutcome': 'Tulos säilyy ajan myötä',
  'analyze.unanalyzed': 'Tutkimattomat tekijät',

  // AI action tool labels
  'ai.tool.applyFilter': 'Käytä suodatinta',
  'ai.tool.clearFilters': 'Tyhjennä suodattimet',
  'ai.tool.switchFactor': 'Vaihda tekijä',
  'ai.tool.createFinding': 'Luo havainto',
  'ai.tool.createQuestion': 'Luo hypoteesi',
  'ai.tool.suggestAction': 'Ehdota toimenpidettä',
  'ai.tool.shareFinding': 'Jaa havainto',
  'ai.tool.publishReport': 'Julkaise raportti',
  'ai.tool.notifyOwners': 'Ilmoita vastuuhenkilöille',
  'ai.tool.suggestIdea': 'Ehdota parannusideaa',
  'ai.tool.sparkBrainstorm': 'Spark brainstorm ideas',
  'ai.tool.suggestSaveFinding': 'Tallenna havainto',
  'ai.tool.navigateTo': 'Navigate to',
  'ai.tool.answerQuestion': 'Answer question',
  'ai.tool.suggestHypothesis': 'Suggest hypothesis',
  'ai.tool.connectHubEvidence': 'Connect hub evidence',
  'ai.tool.suggestCausalLink': 'Suggest causal link',
  'ai.tool.highlightMapPattern': 'Highlight map pattern',

  // Report
  'report.kpi.inSpec': 'Toleranssissa',

  // Table
  'table.noData': 'Ei dataa näytettävänä',
  'table.page': 'Sivu {page}/{total}',
  'table.rowsPerPage': 'Rivejä sivulla',
  'table.editHint': 'Napsauta solua muokataksesi',
  'table.excluded': 'Poissuljettu',
  'table.deleteRow': 'Poista rivi',
  'table.addRow': 'Lisää rivi',
  'table.unsavedChanges': 'Tallentamattomia muutoksia',
  'table.showAll': 'Näytä kaikki',

  // Specs
  'specs.title': 'Spesifikaatiorajat',
  'specs.advancedSettings': 'Lisäasetukset',
  'specs.apply': 'Ota spesifikaatiot käyttöön',
  'specs.noChanges': 'Ei muutoksia käytettäväksi',
  'specs.editTitle': 'Muokkaa spesifikaatioita',
  'specs.lslLabel': 'Alempi spesifikaatioraja (LSL)',
  'specs.uslLabel': 'Ylempi spesifikaatioraja (USL)',

  // Upgrade
  'upgrade.title': 'Päivitys saatavilla',
  'upgrade.limitReached': 'Olet saavuttanut tämän ominaisuuden rajan',
  'upgrade.upgrade': 'Päivitä',
  'upgrade.viewOptions': 'Näytä vaihtoehdot',
  'upgrade.featureLimit': '{feature} on rajoitettu {limit} tässä paketissa',

  // Display toggles
  'display.violin': 'Viulukuvio',
  'display.violinDesc': 'Näytä jakauman muoto',
  'display.etaSquared': 'η²',
  'display.etaSquaredDesc': 'Näytä η² (vaikutuskoko)',
  'display.sort': 'Järjestä',
  'display.ascending': 'Nouseva',
  'display.descending': 'Laskeva',

  // Stats panel
  'stats.summary': 'Yhteenvetotilastot',
  'stats.histogram': 'Histogrammi',
  'stats.probPlot': 'Todennäköisyyskuvio',
  'stats.editSpecs': 'Muokkaa spesifikaatioita',

  // WhatIf
  'whatif.adjustMean': 'Säädä keskiarvoa',
  'whatif.reduceVariation': 'Vähennä vaihtelua',
  'whatif.currentProjected': 'Nykyinen vs. ennustettu',
  'whatif.resetAdjustments': 'Palauta säädöt',
  'whatif.yield': 'Ennustettu saanto',

  // Chart violation details (parameterized)
  'chart.violation.nelson2.detail':
    'Nelsonin sääntö 2 — jakso {count} {side} keskiarvon (#{start}–{end})',
  'chart.violation.nelson3.detail':
    'Nelsonin sääntö 3 — trendi {count} {direction} (#{start}–{end})',
  'chart.violation.side.above': 'yli',
  'chart.violation.side.below': 'ali',
  'chart.violation.direction.increasing': 'nouseva',
  'chart.violation.direction.decreasing': 'laskeva',

  // Parameterized messages
  'data.rowsLoaded': '{count} riviä ladattu',
  'findings.countLabel': '{count} havaintoa',

  // Chart limit labels
  'chart.label.ucl': 'UCL:',
  'chart.label.lcl': 'LCL:',
  'chart.label.mean': 'Keskiarvo:',
  'chart.label.tgt': 'Tavoite:',
  'chart.label.usl': 'USL:',
  'chart.label.lsl': 'LSL:',
  'chart.label.value': 'Arvo:',
  'chart.label.n': 'n:',
  'chart.label.target': 'Tavoite:',

  // Chart status
  'chart.status.inControl': 'Hallinnassa',
  'chart.status.outOfControl': 'Hallitsematon (UCL/LCL ulkopuolella)',
  'chart.noDataProbPlot': 'Ei dataa todennäköisyyskaaviolle',

  // Chart edit affordances
  'chart.edit.spec': 'Napsauta muokataksesi {spec}',
  'chart.edit.axisLabel': 'Napsauta muokataksesi akselin otsikkoa',
  'chart.edit.yAxis': 'Napsauta muokataksesi Y-akselin skaalausta',
  'chart.edit.saveCancel': 'Enter tallentaaksesi · Esc peruuttaaksesi',

  // Performance table headers
  'chart.table.channel': 'Kanava',
  'stats.cp': 'Cp',

  // Chart UI labels
  'chart.copyToClipboard': 'Kopioi kaavio leikepöydälle',
  'chart.maximize': 'Suurenna kaavio',
  'chart.type.ichart': 'I-Chart',
  'chart.type.boxplot': 'Boxplot',
  'chart.type.pareto': 'Pareto',
  'chart.drillHere': '↓ poraudu tähän',
  'chart.percent': 'Prosentti',
  'boxplot.factor.label': 'Factor',

  // Y-axis popover
  'chart.yAxisScale': 'Y-akselin skaalaus',
  'validation.minLessThanMax': 'Min täytyy olla pienempi kuin Max',
  'action.noChanges': 'Ei muutoksia',

  // Create factor modal
  'factor.create': 'Luo tekijä valinnasta',
  'factor.name': 'Tekijän nimi',
  'factor.nameEmpty': 'Tekijän nimi ei voi olla tyhjä',
  'factor.nameExists': 'Samanniminen tekijä on jo olemassa',
  'factor.example': 'esim. Korkean lämpötilan tapahtumat',
  'factor.pointsMarked': '{count} pistettä merkitään:',
  'factor.createAndFilter': 'Luo ja suodata',
  'factor.filterExplanation': 'Näkymä suodattuu automaattisesti näyttämään vain valitut pisteet.',

  // Characteristic type selector
  'charType.nominal': 'Nominaalinen',
  'charType.nominalDesc': 'Tavoitekeskeinen (esim. täyttöpaino)',
  'charType.smaller': 'Pienempi on parempi',
  'charType.smallerDesc': 'Alhaisempi on parempi (esim. virheet)',
  'charType.larger': 'Suurempi on parempi',
  'charType.largerDesc': 'Korkeampi on parempi (esim. saanto)',

  // Analyze prompt
  'analyze.trackingPrompt':
    'Tutkimustasi seurataan — avaa tutkimuspaneeli nähdäksesi kokonaiskuvan.',

  // Mobile category sheet
  'chart.highlight': 'Korosta:',
  'chart.highlightRed': 'Punainen',
  'chart.highlightAmber': 'Keltainen',
  'chart.highlightGreen': 'Vihreä',
  'chart.clearHighlight': 'Poista korostus',
  'chart.drillDown': 'Poraudu kohteeseen "{category}"',
  'ai.askCoScout': 'Kysy CoScoutilta tästä',

  // Settings descriptions
  'display.lockYAxisDesc': 'Säilyttää skaalauksen visuaalista vertailua varten',
  'display.filterContextDesc': 'Näytä aktiivinen suodatinyhteenveto kaavioiden otsikoiden alla',

  // Performance detected modal
  'performance.detected': 'Suorituskykytila havaittu',
  'performance.columnsFound': '{count} mittaussaraketta löydetty',
  'performance.labelQuestion': 'Mitä nämä mittauskanavat edustavat?',
  'performance.labelExample': 'esim. Täyttöpää, Kaviteetti, Suutin',
  'performance.enable': 'Ota suorituskykytila käyttöön',

  // Finding editor & data types
  'finding.placeholder': 'Mitä havaitsit?',
  'finding.note': 'Havainnon muistiinpano',
  'data.typeNumeric': 'Numeerinen',
  'data.typeCategorical': 'Luokiteltu',
  'data.typeDate': 'Päivämäärä',
  'data.typeText': 'Teksti',
  'outcomeNoMatch.noColumn': 'No column called "{name}". Available numeric columns: {columns}.',
  'outcomeNoMatch.nonNumeric': '"{name}" is not numeric, so it cannot be a Y.',
  'outcomeNoMatch.noNumericColumns': 'no numeric columns',
  'data.categories': 'kategoriat',

  // PWA HomeScreen
  'home.heading': 'Tutustu vaihteluanalyysiin',
  'home.description':
    'Ilmainen vaihteluanalyysin koulutustyökalu. Visualisoi vaihtelua, laske kyvykkyys ja löydä kohdistuspisteet — suoraan selaimessasi.',
  'home.divider': 'tai käytä omaa dataa',
  'home.pasteHelper': 'Kopioi rivit ja liitä — tunnistamme sarakkeet automaattisesti',
  'home.manualEntry': 'Tai syötä data manuaalisesti',
  'home.upgradeHint':
    'Tarvitsetko tiimitoimintoja, tiedostojen latausta tai tallennettuja projekteja?',

  // PWA navigation
  'nav.presentationMode': 'Esitystila',
  'nav.hideFindings': 'Piilota havainnot',

  // Export
  'export.asImage': 'Vie kuvana',
  'export.asCsv': 'Vie CSV-tiedostona',
  'export.imageDesc': 'PNG-kuvakaappaus esityksiä varten',
  'export.csvDesc': 'Taulukkolaskentayhteensopiva datatiedosto',

  // Sample section
  'sample.heading': 'Kokeile esimerkkiaineistoa',
  'sample.allSamples': 'Kaikki esimerkkiaineistot',
  'sample.featured': 'Suositellut',
  'sample.caseStudies': 'Tapaustutkimukset',
  'sample.journeys': 'Oppimispolut',
  'sample.industry': 'Toimialaesimerkit',

  // View modes
  'view.stats': 'Tilastot',
  'display.appearance': 'Ulkoasu',

  // Azure toolbar
  'data.manualEntry': 'Manuaalinen syöttö',
  'data.editTable': 'Muokkaa datataulukkoa',
  'toolbar.saveAs': 'Tallenna nimellä…',
  'toolbar.saving': 'Tallennetaan…',
  'toolbar.saved': 'Tallennettu',
  'toolbar.saveFailed': 'Tallennus epäonnistui',
  'toolbar.addMore': 'Lisää dataa',
  'report.scouting': 'Tutkimusraportti',
  'export.csvFiltered': 'Vie suodatettu data CSV-tiedostona',
  'error.auth': 'Todennusvirhe',

  // File browse
  'file.browseLocal': 'Selaa tätä laitetta',
  'file.browseSharePoint': 'Selaa SharePoint',
  'file.open': 'Avaa tiedosto',

  // Admin hub
  'admin.title': 'Hallinta',
  'admin.status': 'Tila',
  'admin.teams': 'Teams-asetukset',
  'admin.knowledge': 'Tietopankki',
  'admin.troubleshooting': 'Vianmääritys',

  // Feature names
  'feature.charts': 'I-Chart, Boxplot, Pareto, Tilastot',
  'feature.capability': 'Kyvykkyysanalyysi (Cp/Cpk)',
  'feature.performance': 'Suorituskykytila (monikanava)',
  'feature.anova': 'ANOVA ja tekijäanalyysi',
  'feature.findingsWorkflow': 'Havainnot ja tutkimustyönkulku',
  'feature.whatIf': 'Mitä-jos-simulaatio',
  'feature.csvImport': 'CSV/Excel-tuonti',
  'feature.reportExport': 'Raportin vienti (PDF)',
  'feature.indexedDb': 'IndexedDB paikallinen tallennus',
  'feature.maxFactors': 'Enintään 6 tekijää',
  'feature.maxRows': 'Enintään 250K riviä',
  'feature.onedriveSync': 'OneDrive-projektien synkronointi',
  'feature.sharepointPicker': 'SharePoint-tiedostovalitsin',
  'feature.teamsIntegration': 'Microsoft Teams -integraatio',
  'feature.channelCollab': 'Kanavapohjainen yhteistyö',
  'feature.mobileUi': 'Mobiilioptimoitu käyttöliittymä',
  'feature.coScoutAi': 'CoScout AI -avustaja',
  'feature.narrativeBar': 'NarrativeBar-näkymät',
  'feature.chartInsights': 'Kaavion oivalluskortit',
  'feature.knowledgeBase': 'Tietopankki (SharePoint-haku)',
  'feature.aiActions': 'AI-ehdotetut toimenpiteet',

  // Admin Teams setup
  'admin.teams.heading': 'Lisää VariScout Microsoft Teamsiin',
  'admin.teams.description':
    'Luo Teams-sovelluspaketti käyttöönottoasi varten ja lataa se Teams-hallintakeskukseen.',
  'admin.teams.running': 'Käynnissä Microsoft Teamsin sisällä',
  'admin.teams.step1': 'Sovellusrekisteröinnin Client ID (Valinnainen)',
  'admin.teams.step1Desc':
    'Syötä Azure AD -sovellusrekisteröinnin Client ID ottaaksesi Teams-SSO:n käyttöön manifestissa.',
  'admin.teams.step2': 'Lataa Teams-sovelluspaketti',
  'admin.teams.step2Desc':
    'Tämä .zip sisältää manifestin ja kuvakkeet esikonfiguroituna käyttöönottoasi varten.',
  'admin.teams.step3': 'Lataa Teams-hallintakeskukseen',
  'admin.teams.step4': 'Lisää VariScout kanavaan',
  'admin.teams.download': 'Lataa Teams-sovelluspaketti',

  // Admin status tab
  'admin.checksResult': '{pass}/{total} tarkistusta läpäisty',
  'admin.runChecks': 'Suorita kaikki tarkistukset',
  'admin.notApplicable': 'Ei koske tilaussuunnitelmaasi',
  'admin.managePortal': 'Hallitse Azure Portalissa',
  'admin.portalAccessNote':
    'Nämä kohteet vaativat pääsyn Azure Portaliin eikä niitä voi tarkistaa selaimesta.',
  'admin.fixInPortal': 'Korjaa Azure Portalissa: {label}',

  // Admin troubleshoot tab
  'admin.troubleshoot.intro':
    'Yleisiä ongelmia ja niiden ratkaisut. Napsauta ongelmaa nähdäksesi vaiheittaiset ohjeet.',
  'admin.runCheck': 'Suorita tarkistus',
  'admin.checkPassed': 'Tarkistus läpäisty — tämä ei ehkä ole ongelma.',
  'admin.checkFailed': 'Tarkistus epäonnistui — seuraa alla olevia ohjeita.',
  'admin.issue.signin': 'Käyttäjät eivät voi kirjautua sisään',
  'admin.issue.signinDesc': 'Azure AD -todennus ei toimi tai käyttäjät näkevät tyhjän sivun.',
  'admin.issue.signinSteps':
    'Varmista, että App Service Authentication on käytössä Azure Portalissa.\nTarkista, että Azure AD -sovellusrekisteröinnissä on oikeat uudelleenohjaus-URI:t.\nVarmista, että sovellusrekisteröinnissä on "ID-tunnukset" käytössä Todennus-kohdassa.\nVarmista, että vuokraaja sallii käyttäjien kirjautumisen sovellukseen (Yrityssovellukset → Ominaisuudet → Käyttäjille sallittu kirjautuminen).',
  'admin.issue.onedrive': 'OneDrive-synkronointi ei toimi',
  'admin.issue.onedriveDesc':
    'Projektit eivät synkronoidu OneDriveen tai käyttäjät näkevät käyttöoikeusvirheitä.',
  'admin.issue.onedriveSteps':
    'Varmista, että sovellusrekisteröinnissä on delegoitu "Files.ReadWrite"-käyttöoikeus.\nTarkista, että järjestelmänvalvojan suostumus on myönnetty Graph-käyttöoikeuksille.\nVarmista, että käyttäjälle on määritetty OneDrive-lisenssi.\nKokeile kirjautumista ulos ja takaisin sisään tunnuksen päivittämiseksi.',
  'admin.issue.coscout': 'CoScout ei vastaa',
  'admin.issue.coscoutDesc': 'AI-avustaja ei luo vastauksia tai näyttää virheitä.',
  'admin.issue.coscoutSteps':
    'Varmista, että AI-päätepiste on määritetty ARM-mallissa / App Service -asetuksissa.\nTarkista, että Azure AI Services -resurssi on otettu käyttöön ja toimii.\nVarmista, että mallin käyttöönotto on olemassa (esim. gpt-4o) AI Services -resurssissa.\nTarkista Azure AI Services -kiintiöt — käyttöönotto on saattanut saavuttaa nopeusrajat.',
  'admin.issue.kbEmpty': 'Tietopankki ei palauta tuloksia',
  'admin.issue.kbEmptyDesc':
    'CoScoutin "Hae tietopankista" ei löydä mitään, vaikka dokumentteja on olemassa.',
  'admin.issue.kbEmptySteps':
    'Varmista, että AI Search -päätepiste on määritetty App Service -asetuksissa.\nTarkista, että etä-SharePoint-tietolähde on luotu AI Searchiin.\nVarmista, että ≥1 Microsoft 365 Copilot -lisenssi on aktiivinen vuokraajassa.\nVarmista, että käyttäjällä on SharePoint-pääsy haettaviin dokumentteihin.\nTarkista, että tietopankin esikatselukytkin on käytössä (Hallinta → Tietopankki-välilehti).',
  'admin.issue.teamsTab': 'Teams-välilehti ei näy',
  'admin.issue.teamsTabDesc': 'VariScout ei näy Teamsissa tai välilehti ei lataudu.',
  'admin.issue.teamsTabSteps':
    'Varmista, että Teams-sovelluspaketti (.zip) on ladattu Teams-hallintakeskukseen.\nTarkista, että manifest.json contentUrl vastaa App Service -URL:ää.\nVarmista, että sovellus on hyväksytty Teams-hallintakeskuksessa (ei estetty käytännöllä).\nKokeile välilehden poistamista ja uudelleen lisäämistä kanavaan.\nJos käytät mukautettua verkkotunnusta, varmista, että se on manifestin validDomains-taulukossa.',
  'admin.issue.newUser': 'Uusi käyttäjä ei pääse sovellukseen',
  'admin.issue.newUserDesc':
    'Äskettäin lisätty käyttäjä näkee pääsy estetty -ilmoituksen tai tyhjän sivun.',
  'admin.issue.newUserSteps':
    'Azure AD:ssä siirry Yrityssovellukset → VariScout → Käyttäjät ja ryhmät.\nLisää käyttäjä tai hänen käyttöoikeusryhmänsä sovellukseen.\nJos "Käyttäjämääritys vaaditaan" on käytössä, varmista, että käyttäjällä on määritys.\nTarkista ehdolliset käyttöoikeuskäytännöt, jotka saattavat estää käyttäjän.',
  'admin.issue.aiSlow': 'AI-vastaukset ovat hitaita',
  'admin.issue.aiSlowDesc': 'CoScoutin vastaaminen kestää kauan tai aikakatkaisu tapahtuu usein.',
  'admin.issue.aiSlowSteps':
    'Tarkista Azure AI Services -käyttöönottoalue — viive kasvaa etäisyyden myötä.\nVarmista, että mallin käyttöönotossa on riittävästi TPM-kiintiötä (tokenia minuutissa).\nHarkitse päivitystä varattuun suorituskykykäyttöönottoon tasaisen viiveen saavuttamiseksi.\nTarkista, onko AI Search -indeksi suuri — harkitse tietolähteen optimointia.',
  'admin.issue.forbidden': '"Forbidden"-virheet',
  'admin.issue.forbiddenDesc': 'Käyttäjät näkevät 403-virheitä tiettyihin toimintoihin pääsyessä.',
  'admin.issue.forbiddenSteps':
    'Tarkista, että kaikilla vaadituilla Graph API -käyttöoikeuksilla on järjestelmänvalvojan suostumus.\nVarmista, että App Service Authentication -tunnustevarasto on käytössä.\nVarmista, ettei käyttäjän tunnus ole vanhentunut — kokeile kirjautumista ulos ja takaisin sisään.\nTarkista vuokraajan ehdolliset käyttöoikeuskäytännöt.',
  'admin.issue.kbPartial': 'Tietopankki ei toimi joillekin käyttäjille',
  'admin.issue.kbPartialDesc':
    'Tietopankkihaku toimii järjestelmänvalvojille mutta ei muille käyttäjille.',
  'admin.issue.kbPartialSteps':
    'Etä-SharePoint-tietolähteet käyttävät käyttäjäkohtaisia käyttöoikeuksia. Jokaisella käyttäjällä täytyy olla SharePoint-pääsy dokumentteihin.\nTarkista, estävätkö ehdolliset käyttöoikeuskäytännöt kyseisiä käyttäjiä.\nVarmista, että järjestelmänvalvojan suostumus on myönnetty delegoidulle Sites.Read.All-käyttöoikeudelle.\nPyydä kyseisiä käyttäjiä kirjautumaan ulos ja takaisin sisään tunnuksen päivittämiseksi.',

  // Workspace navigation
  'workspace.process': 'Process',
  'workspace.explore': 'Explore',
  'workspace.analyze': 'Analyze',
  'workspace.findings': 'Findings',
  'workspace.improvement': 'Improvement',
  'workspace.improve': 'Improve',
  'workspace.project': 'Projekti',
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
  'improve.actionsDone': 'toimenpidettä tehty',
  'improve.overdue': 'myöhässä',
  'improve.addVerification': 'Lisää todennusdata',
  'improve.assessOutcome': 'Arvioi tulos',
  'improve.viewActions': 'Näytä toimenpiteet',
  'improve.actions': 'toimenpidettä',
  'improve.done': 'tehty',

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
  'timeframe.label': 'Aikajänne',

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
  'fi.title': 'Tekijäanalyysi',
  'fi.ranking': 'Tekijöiden järjestys (R² korjattu)',
  'fi.layer2': 'Taso 2 · Päävaikutukset',
  'fi.layer3': 'Taso 3 · Tekijöiden yhteisvaikutukset',
  'fi.investigate': 'Tutki →',
  'fi.notSignificant': 'ei merkitsevä (p={value})',
  'fi.explainsSingle': '{factor} selittää {pct}% vaihtelusta yksinään.',
  'fi.explainsMultiple': '{factors} selittävät yhdessä {pct}% vaihtelusta.',
  'fi.layer2Locked': 'Taso 2 (Päävaikutukset) avautuu kun R²adj > {threshold}%',
  'fi.layer2Current': ' — tällä hetkellä {value}%',
  'fi.layer3Locked': 'Taso 3 (Yhteisvaikutukset) avautuu kun ≥2 tekijää on merkitseviä',
  'fi.layer3Current': ' — tällä hetkellä {count} merkitsevää',
  'fi.best': 'Paras',
  'fi.range': 'Vaihteluväli',
  'fi.interactionDetected':
    'Yhteisvaikutus havaittu: {factorA}:n vaikutus riippuu {factorB}:n tasosta.',
  'fi.noInteraction': 'Ei merkitsevää yhteisvaikutusta — vaikutukset ovat lähes additiivisia.',

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
  'wall.status.confirmed': 'Verified',
  'wall.status.refuted': 'Ruled out',
  'wall.status.needsDisconfirmation': 'Suspected',
  'wall.status.suggestSupported': '2 evidence types + a survived test — mark Verified?',
  'wall.status.setLabel': 'Set status',
  'wall.card.hypothesisLabel': 'Suspected cause',
  'wall.card.findings': '{count} findings',
  'wall.card.evidenceGap': 'Evidence gap',
  'wall.card.missingColumn': '⚠ Condition references missing column',
  'wall.card.missingColumnAria': 'Condition references missing column',
  'wall.card.ariaLabel': 'Suspected cause {name}, {status}, {count} supporting clues',
  'wall.card.oneStepAway':
    '1 step away — running a disconfirmation test would let you mark this Verified',
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
  'wall.caveat.unbackedSurvived': 'Verified — disconfirmation has no attached evidence',
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
  'wall.empty.seedFromFactorIntel': 'Seed 3 from Factor Intelligence',
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

  // FRAME b0 lightweight render
  'frame.b0.q1.headline': 'Mitä haluat tutkia?',
  'frame.b0.q1.hint': 'Y-mittari / lopputulos',
  'frame.b0.q2.headline': 'Mikä saattaa vaikuttaa siihen?',
  'frame.b0.q2.hint': 'X-tekijät / syötteet',
  'frame.b0.runOrderHint': '(juoksujärjestys: {column})',
  'frame.b0.addProcessSteps.label': 'Lisää prosessivaiheet',
  'frame.b0.addProcessSteps.helper':
    'valinnainen — hyödyllinen kun X-tekijät kuuluvat tiettyihin vaiheisiin',
  'frame.b0.addHypothesis.label': 'Lisää hypoteesi',
  'frame.b0.addHypothesis.helper': 'valinnainen — mitä epäilet',
  'frame.b0.seeData.cta': 'Näytä data →',
  'frame.b0.seeData.pickYHint': 'Valitse ensin Y nähdäksesi analyysin.',
  'frame.b0.step.addCtq': '+ lisää mittaus tähän vaiheeseen (valinnainen)',
  'frame.b0.q1.empty': 'Numeerisia sarakkeita ei löytynyt — lisää tai tuo dataa aloittaaksesi.',
  'frame.b0.q1.emptyRanked':
    "Couldn't auto-rank an outcome. Type the numeric column name in the manual outcome field.",
  'frame.b0.q2.empty': 'Ei X-ehdokkaita — kun valitset Y:n, tekijät ilmestyvät tähän.',
  'frame.b0.aria.yCandidates': 'Y-ehdokassirut',
  'frame.b0.aria.selectedXs': 'Valitut X-sirut',
  'frame.b0.aria.availableXs': 'Saatavilla olevat X-sirut',
  'frame.canvasOverlay.cta.control.notReady':
    "Available after you've implemented a process change to monitor",
  'frame.canvasOverlay.cta.handoff.notReady':
    'Available after sustainment monitoring confirms gains',
  'frame.b1.heading': 'Kehystä tutkimus',
  'frame.b1.description':
    'Rakenna prosessikartta, jotta analyysillä on konteksti. Kartta ohjaa moodivalintaa ja mittaus­puute­raporttia; menetelmä haluaa CTS:n valtamerellä, CTQ:n per vaihe ja vähintään yhden rational-subgroup-akselin.',
  'frame.spec.notSet': 'spesifikaatio: ei asetettu',
  'frame.spec.set': 'spesifikaatio: asetettu',
  'frame.spec.add': '+ lisää spesifikaatio',
  'frame.spec.editor.title': 'Aseta spesifikaatio mittarille {measure}',
  'frame.spec.editor.usl': 'USL',
  'frame.spec.editor.lsl': 'LSL',
  'frame.spec.editor.target': 'Tavoite',
  'frame.spec.editor.cpkTarget': 'Cpk-tavoite',
  'frame.spec.editor.suggestedFromData': 'Ehdotettu datasta: keskiarvo ± 3σ. Vahvista tallennus.',
  'frame.spec.editor.confirm': 'Tallenna',
  'frame.spec.editor.cancel': 'Peruuta',
  'frame.spec.editor.invalidRange': 'USL:n täytyy olla suurempi kuin LSL.',
  'capability.noSpec.prompt':
    'Aseta tavoite / spesifikaatio mittarille {measure} nähdäksesi Cp/Cpk.',

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
};
