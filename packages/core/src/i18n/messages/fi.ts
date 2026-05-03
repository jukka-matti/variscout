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
  'panel.investigation': 'Tutkimus',
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
  'investigation.brief': 'Tutkimusraportti',
  'investigation.assignedToMe': 'Minulle osoitetut',
  'investigation.question': 'Question',
  'investigation.questions': 'Questions',
  'investigation.pinAsFinding': 'Kiinnitä havainnoksi',
  'investigation.addObservation': 'Lisää havainto',

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
  'data.addQuestion': 'Lisää hypoteesi',
  'data.removeQuestion': 'Poista hypoteesi',
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

  // Investigation sidebar
  'investigation.phaseInitial': 'Kerää alkuhavainnot',
  'investigation.phaseDiverging': 'Tutki useita hypoteeseja',
  'investigation.phaseValidating': 'Testaa ja vahvista hypoteesit',
  'investigation.phaseConverging': 'Rajaa juurisyyhyn',
  'investigation.phaseImproving': 'Toteuta ja varmista muutokset',
  'investigation.pdcaTitle': 'Vahvistustarkistuslista',
  'investigation.verifyChart': 'I-kaavio vakaa muutoksen jälkeen',
  'investigation.verifyStats': 'Cpk saavuttaa tavoitteen',
  'investigation.verifyBoxplot': 'Laatikkokuvaajan hajonta pienentynyt',
  'investigation.verifySideEffects': 'Sivuvaikutuksia ei havaittu',
  'investigation.verifyOutcome': 'Tulos säilyy ajan myötä',
  'investigation.uninvestigated': 'Tutkimattomat tekijät',

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
  'ai.tool.suggestSuspectedCause': 'Suggest suspected cause',
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

  // Investigation prompt
  'investigation.trackingPrompt':
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
  'admin.plan': 'Tilaus ja ominaisuudet',
  'admin.teams': 'Teams-asetukset',
  'admin.knowledge': 'Tietopankki',
  'admin.troubleshooting': 'Vianmääritys',

  // Admin plan tab
  'admin.currentPlan': 'Nykyinen',
  'admin.feature': 'Ominaisuus',
  'admin.manageSubscription': 'Hallitse tilausta Azuressa',
  'admin.planStandard': 'Standard',
  'admin.planTeam': 'Team',
  'admin.planStandardPrice': '€79/kk',
  'admin.planTeamPrice': '€199/kk',
  'admin.planStandardDesc': 'Täysi analyysi CoScout AI:lla',
  'admin.planTeamDesc': 'Teams, OneDrive, SharePoint, tietopankki',

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
  'frame.b0.q2.empty': 'Ei X-ehdokkaita — kun valitset Y:n, tekijät ilmestyvät tähän.',
  'frame.b0.aria.yCandidates': 'Y-ehdokassirut',
  'frame.b0.aria.selectedXs': 'Valitut X-sirut',
  'frame.b0.aria.availableXs': 'Saatavilla olevat X-sirut',
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
