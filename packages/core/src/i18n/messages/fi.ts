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
  'display.chartTextSize': 'Kaavion tekstikoko',
  'display.compact': 'Tiivis',
  'display.normal': 'Normaali',
  'display.large': 'Suuri',
  'display.lockYAxis': 'Lukitse Y-akseli',
  'display.filterContext': 'Suodatinkonteksti',
  'display.showSpecs': 'Näytä spesifikaatiot',

  // Investigation
  'investigation.brief': 'Tutkimusraportti',
  'investigation.assignedToMe': 'Minulle osoitetut',
  'investigation.hypothesis': 'Hypoteesi',
  'investigation.hypotheses': 'Hypoteesit',
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

  // Methodology Coach
  'coach.frame': 'Rajaa',
  'coach.scout': 'Tutki',
  'coach.investigate': 'Selvitä',
  'coach.improve': 'Paranna',
  'coach.frameDesc': 'Määrittele ongelma ja rajaa',
  'coach.scoutDesc': 'Kerää dataa ja tutki kuvioita',
  'coach.investigateDesc': 'Testaa hypoteeseja ja etsi juurisyyt',
  'coach.improveDesc': 'Toteuta muutokset ja varmista tulokset',

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
  'data.problemPlaceholder': 'Kuvaile tutkittava ongelma…',
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
  'data.addHypothesis': 'Lisää hypoteesi',
  'data.removeHypothesis': 'Poista hypoteesi',
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

  // Coach mobile phase titles
  'coach.frameTitle': 'Rajaa ongelma',
  'coach.scoutTitle': 'Tutki dataa',
  'coach.investigateTitle': 'Selvitä syyt',
  'coach.improveTitle': 'Paranna prosessia',

  // AI action tool labels
  'ai.tool.applyFilter': 'Käytä suodatinta',
  'ai.tool.clearFilters': 'Tyhjennä suodattimet',
  'ai.tool.switchFactor': 'Vaihda tekijä',
  'ai.tool.createFinding': 'Luo havainto',
  'ai.tool.createHypothesis': 'Luo hypoteesi',
  'ai.tool.suggestAction': 'Ehdota toimenpidettä',
  'ai.tool.shareFinding': 'Jaa havainto',
  'ai.tool.publishReport': 'Julkaise raportti',
  'ai.tool.notifyOwners': 'Ilmoita vastuuhenkilöille',

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
  'display.contribution': 'Kontribuutio',
  'display.contributionDesc': 'Näytä vaihtelun osuus',
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
};
