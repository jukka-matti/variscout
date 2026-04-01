import type { MessageCatalog } from '../types';

/** Hindi message catalog */
export const hi: MessageCatalog = {
  // Statistics labels
  'stats.mean': 'माध्य',
  'stats.median': 'मध्यिका',
  'stats.stdDev': 'मानक विचलन',
  'stats.samples': 'नमूने',
  'stats.passRate': 'उत्तीर्ण दर',
  'stats.range': 'परिसर',
  'stats.min': 'न्यूनतम',
  'stats.max': 'अधिकतम',
  'stats.target': 'लक्ष्य',
  'stats.sigma': 'सिग्मा',

  // Chart labels
  'chart.observation': 'प्रेक्षण',
  'chart.count': 'गिनती',
  'chart.frequency': 'आवृत्ति',
  'chart.value': 'मान',
  'chart.category': 'श्रेणी',
  'chart.cumulative': 'संचयी %',
  'chart.clickToEdit': 'संपादित करने के लिए क्लिक करें',
  'chart.median': 'मध्यिका',
  'chart.q1': 'Q1',
  'chart.q3': 'Q3',
  'chart.noChannelData': 'कोई चैनल डेटा नहीं',
  'chart.selectChannel': 'चैनल चुनें',

  // Limit labels
  'limits.usl': 'USL',
  'limits.lsl': 'LSL',
  'limits.ucl': 'UCL',
  'limits.lcl': 'LCL',
  'limits.mean': 'माध्य',
  'limits.target': 'लक्ष्य',

  // Navigation
  'nav.newAnalysis': 'नया विश्लेषण',
  'nav.backToDashboard': 'डैशबोर्ड पर वापस जाएं',
  'nav.settings': 'सेटिंग्स',
  'nav.export': 'निर्यात',
  'nav.presentation': 'प्रस्तुति',
  'nav.menu': 'मेनू',
  'nav.moreActions': 'अधिक कार्य',

  // Panel titles
  'panel.findings': 'निष्कर्ष',
  'panel.dataTable': 'डेटा तालिका',
  'panel.whatIf': 'क्या होगा अगर',
  'panel.investigation': 'जांच',
  'panel.coScout': 'CoScout',
  'panel.drillPath': 'ड्रिल पथ',

  // View modes
  'view.list': 'सूची',
  'view.board': 'बोर्ड',
  'view.tree': 'वृक्ष',

  // Action buttons
  'action.save': 'सहेजें',
  'action.cancel': 'रद्द करें',
  'action.delete': 'हटाएं',
  'action.edit': 'संपादित करें',
  'action.copy': 'कॉपी करें',
  'action.close': 'बंद करें',
  'action.learnMore': 'और जानें',
  'action.download': 'डाउनलोड',
  'action.apply': 'लागू करें',
  'action.reset': 'रीसेट करें',
  'action.retry': 'पुनः प्रयास करें',
  'action.send': 'भेजें',
  'action.ask': 'पूछें',
  'action.clear': 'साफ़ करें',
  'action.copyAll': 'सभी कॉपी करें',
  'action.selectAll': 'सभी चुनें',

  // CoScout
  'coscout.send': 'भेजें',
  'coscout.clear': 'बातचीत साफ़ करें',
  'coscout.stop': 'रोकें',
  'coscout.rateLimit': 'दर सीमा पूरी हो गई। कृपया प्रतीक्षा करें।',
  'coscout.contentFilter': 'सुरक्षा नीति द्वारा सामग्री फ़िल्टर की गई।',
  'coscout.error': 'एक त्रुटि हुई। कृपया पुनः प्रयास करें।',

  // Display/settings
  'display.preferences': 'प्राथमिकताएं',
  'display.density': 'प्रदर्शन घनत्व',
  'display.lockYAxis': 'Y-अक्ष लॉक करें',
  'display.filterContext': 'फ़िल्टर संदर्भ',
  'display.showSpecs': 'विनिर्देश दिखाएं',

  // Investigation
  'investigation.brief': 'जांच सारांश',
  'investigation.assignedToMe': 'मुझे सौंपा गया',
  'investigation.hypothesis': 'परिकल्पना',
  'investigation.hypotheses': 'परिकल्पनाएं',
  'investigation.pinAsFinding': 'निष्कर्ष के रूप में पिन करें',
  'investigation.addObservation': 'प्रेक्षण जोड़ें',

  // Empty states
  'empty.noData': 'कोई डेटा उपलब्ध नहीं',
  'empty.noFindings': 'अभी तक कोई निष्कर्ष नहीं',
  'empty.noResults': 'कोई परिणाम नहीं मिला',

  // Error messages
  'error.generic': 'कुछ गलत हो गया',
  'error.loadFailed': 'डेटा लोड करने में विफल',
  'error.parseFailed': 'फ़ाइल पार्स करने में विफल',

  // Settings labels
  'settings.language': 'भाषा',
  'settings.theme': 'थीम',
  'settings.textSize': 'पाठ आकार',

  // Finding statuses
  'findings.observed': 'प्रेक्षित',
  'findings.investigating': 'जांच जारी',
  'findings.analyzed': 'विश्लेषित',
  'findings.improving': 'सुधार जारी',
  'findings.resolved': 'हल किया गया',

  // Report labels
  'report.summary': 'सारांश',
  'report.findings': 'निष्कर्ष',
  'report.recommendations': 'सिफारिशें',
  'report.evidence': 'साक्ष्य',

  // Data input labels
  'data.pasteData': 'डेटा पेस्ट करें',
  'data.uploadFile': 'फ़ाइल अपलोड करें',
  'data.columnMapping': 'स्तंभ मैपिंग',
  'data.measureColumn': 'माप स्तंभ',
  'data.factorColumn': 'कारक स्तंभ',
  'data.addData': 'डेटा जोड़ें',
  'data.editData': 'डेटा संपादित करें',
  'data.showDataTable': 'डेटा तालिका दिखाएं',
  'data.hideDataTable': 'डेटा तालिका छुपाएं',

  // Status
  'status.cached': 'कैश्ड',
  'status.loading': 'लोड हो रहा है',
  'status.ai': 'AI',

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
  'ai.tool.suggestSaveFinding': 'Save insight',
  'ai.tool.navigateTo': 'Navigate to',

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
    'नेल्सन नियम 2 — {count} की श्रृंखला औसत से {side} (#{start}–{end})',
  'chart.violation.nelson3.detail':
    'नेल्सन नियम 3 — {count} {direction} प्रवृत्ति (#{start}–{end})',
  'chart.violation.side.above': 'ऊपर',
  'chart.violation.side.below': 'नीचे',
  'chart.violation.direction.increasing': 'बढ़ती',
  'chart.violation.direction.decreasing': 'घटती',

  // Parameterized messages
  'data.rowsLoaded': '{count} rows loaded',
  'findings.countLabel': '{count} निष्कर्ष',

  // Chart limit labels
  'chart.label.ucl': 'UCL:',
  'chart.label.lcl': 'LCL:',
  'chart.label.mean': 'माध्य:',
  'chart.label.tgt': 'लक्ष्य:',
  'chart.label.usl': 'USL:',
  'chart.label.lsl': 'LSL:',
  'chart.label.value': 'मान:',
  'chart.label.n': 'n:',
  'chart.label.target': 'लक्ष्य:',

  // Chart status
  'chart.status.inControl': 'नियंत्रण में',
  'chart.status.outOfControl': 'नियंत्रण से बाहर (UCL/LCL से परे)',
  'chart.noDataProbPlot': 'प्रायिकता प्लॉट के लिए कोई डेटा उपलब्ध नहीं',

  // Chart edit affordances
  'chart.edit.spec': '{spec} संपादित करने के लिए क्लिक करें',
  'chart.edit.axisLabel': 'अक्ष लेबल संपादित करने के लिए क्लिक करें',
  'chart.edit.yAxis': 'Y-अक्ष स्केल संपादित करने के लिए क्लिक करें',
  'chart.edit.saveCancel': 'सहेजने के लिए Enter · रद्द करने के लिए Esc',

  // Performance table headers
  'chart.table.channel': 'चैनल',
  'stats.cp': 'Cp',

  // Chart UI labels
  'chart.copyToClipboard': 'चार्ट को क्लिपबोर्ड पर कॉपी करें',
  'chart.maximize': 'चार्ट को अधिकतम करें',
  'chart.type.ichart': 'I-Chart',
  'chart.type.boxplot': 'Boxplot',
  'chart.type.pareto': 'Pareto',
  'chart.drillHere': '↓ यहाँ ड्रिल करें',
  'chart.percent': 'प्रतिशत',

  // Y-axis popover
  'chart.yAxisScale': 'Y-अक्ष स्केल',
  'validation.minLessThanMax': 'न्यूनतम अधिकतम से कम होना चाहिए',
  'action.noChanges': 'कोई परिवर्तन नहीं',

  // Create factor modal
  'factor.create': 'चयन से कारक बनाएँ',
  'factor.name': 'कारक का नाम',
  'factor.nameEmpty': 'कारक का नाम रिक्त नहीं हो सकता',
  'factor.nameExists': 'इस नाम का कारक पहले से मौजूद है',
  'factor.example': 'उदा., उच्च तापमान घटनाएँ',
  'factor.pointsMarked': '{count} बिंदु इस रूप में चिह्नित होंगे:',
  'factor.createAndFilter': 'बनाएँ और फ़िल्टर करें',
  'factor.filterExplanation': 'दृश्य स्वचालित रूप से केवल चयनित बिंदु दिखाने के लिए फ़िल्टर होगा।',

  // Characteristic type selector
  'charType.nominal': 'नॉमिनल',
  'charType.nominalDesc': 'लक्ष्य-केंद्रित (उदा. भरण वजन)',
  'charType.smaller': 'छोटा बेहतर है',
  'charType.smallerDesc': 'कम बेहतर है (उदा. दोष)',
  'charType.larger': 'बड़ा बेहतर है',
  'charType.largerDesc': 'अधिक बेहतर है (उदा. उपज)',

  // Investigation prompt
  'investigation.trackingPrompt':
    'आपकी जाँच ट्रैक हो रही है — पूरी तस्वीर देखने के लिए जाँच पैनल खोलें।',

  // Mobile category sheet
  'chart.highlight': 'हाइलाइट:',
  'chart.highlightRed': 'लाल',
  'chart.highlightAmber': 'एम्बर',
  'chart.highlightGreen': 'हरा',
  'chart.clearHighlight': 'हाइलाइट हटाएँ',
  'chart.drillDown': '"{category}" में ड्रिल करें',
  'ai.askCoScout': 'इसके बारे में CoScout से पूछें',

  // Settings descriptions
  'display.lockYAxisDesc': 'दृश्य तुलना के लिए स्केल बनाए रखता है',
  'display.filterContextDesc': 'चार्ट शीर्षकों के नीचे सक्रिय फ़िल्टर सारांश प्रदर्शित करें',

  // Performance detected modal
  'performance.detected': 'प्रदर्शन मोड का पता चला',
  'performance.columnsFound': '{count} माप स्तंभ मिले',
  'performance.labelQuestion': 'ये माप चैनल क्या दर्शाते हैं?',
  'performance.labelExample': 'उदा., फिल हेड, कैविटी, नोज़ल',
  'performance.enable': 'प्रदर्शन मोड सक्षम करें',

  // Finding editor & data types
  'finding.placeholder': 'आपने क्या पाया?',
  'finding.note': 'निष्कर्ष नोट',
  'data.typeNumeric': 'संख्यात्मक',
  'data.typeCategorical': 'श्रेणीबद्ध',
  'data.typeDate': 'दिनांक',
  'data.typeText': 'पाठ',
  'data.categories': 'श्रेणियाँ',

  // PWA HomeScreen
  'home.heading': 'विचलन विश्लेषण का अन्वेषण करें',
  'home.description':
    'मुफ़्त विचलन विश्लेषण प्रशिक्षण उपकरण। परिवर्तनशीलता को देखें, क्षमता की गणना करें, और ध्यान केंद्रित करने का स्थान खोजें — सीधे अपने ब्राउज़र में।',
  'home.divider': 'या अपना स्वयं का डेटा उपयोग करें',
  'home.pasteHelper':
    'पंक्तियाँ कॉपी करें और पेस्ट करें — हम स्तंभों को स्वचालित रूप से पहचान लेंगे',
  'home.manualEntry': 'या डेटा मैन्युअल रूप से दर्ज करें',
  'home.upgradeHint': 'टीम सुविधाओं, फ़ाइल अपलोड, या सहेजे गए प्रोजेक्ट की आवश्यकता है?',

  // PWA navigation
  'nav.presentationMode': 'प्रस्तुति मोड',
  'nav.hideFindings': 'निष्कर्ष छिपाएँ',

  // Export
  'export.asImage': 'छवि के रूप में निर्यात करें',
  'export.asCsv': 'CSV के रूप में निर्यात करें',
  'export.imageDesc': 'प्रस्तुतियों के लिए PNG स्क्रीनशॉट',
  'export.csvDesc': 'स्प्रेडशीट-संगत डेटा फ़ाइल',

  // Sample section
  'sample.heading': 'एक नमूना डेटासेट आज़माएँ',
  'sample.allSamples': 'सभी नमूना डेटासेट',
  'sample.featured': 'विशेष',
  'sample.caseStudies': 'केस स्टडी',
  'sample.journeys': 'शिक्षण यात्राएँ',
  'sample.industry': 'उद्योग उदाहरण',

  // View modes
  'view.stats': 'सांख्यिकी',
  'display.appearance': 'दिखावट',

  // Azure toolbar
  'data.manualEntry': 'मैन्युअल प्रविष्टि',
  'data.editTable': 'डेटा तालिका संपादित करें',
  'toolbar.saveAs': 'इस रूप में सहेजें…',
  'toolbar.saving': 'सहेज रहा है…',
  'toolbar.saved': 'सहेजा गया',
  'toolbar.saveFailed': 'सहेजना विफल',
  'toolbar.addMore': 'डेटा जोड़ें',
  'report.scouting': 'स्काउटिंग रिपोर्ट',
  'export.csvFiltered': 'फ़िल्टर किए गए डेटा को CSV के रूप में निर्यात करें',
  'error.auth': 'प्रमाणीकरण त्रुटि',

  // File browse
  'file.browseLocal': 'इस डिवाइस में ब्राउज़ करें',
  'file.browseSharePoint': 'SharePoint में ब्राउज़ करें',
  'file.open': 'फ़ाइल खोलें',

  // Admin hub
  'admin.title': 'व्यवस्थापक',
  'admin.status': 'स्थिति',
  'admin.plan': 'योजना और सुविधाएँ',
  'admin.teams': 'Teams सेटअप',
  'admin.knowledge': 'ज्ञान आधार',
  'admin.troubleshooting': 'समस्या निवारण',

  // Admin plan tab
  'admin.currentPlan': 'वर्तमान',
  'admin.feature': 'सुविधा',
  'admin.manageSubscription': 'Azure में सदस्यता प्रबंधित करें',
  'admin.planStandard': 'Standard',
  'admin.planTeam': 'Team',
  'admin.planStandardPrice': '€79/माह',
  'admin.planTeamPrice': '€199/माह',
  'admin.planStandardDesc': 'CoScout AI के साथ पूर्ण विश्लेषण',
  'admin.planTeamDesc': 'Teams, OneDrive, SharePoint, ज्ञान आधार',

  // Feature names
  'feature.charts': 'I-Chart, Boxplot, Pareto, सांख्यिकी',
  'feature.capability': 'क्षमता विश्लेषण (Cp/Cpk)',
  'feature.performance': 'प्रदर्शन मोड (बहु-चैनल)',
  'feature.anova': 'ANOVA और कारक विश्लेषण',
  'feature.findingsWorkflow': 'निष्कर्ष और जाँच कार्यप्रवाह',
  'feature.whatIf': 'क्या-अगर सिमुलेशन',
  'feature.csvImport': 'CSV/Excel आयात',
  'feature.reportExport': 'रिपोर्ट निर्यात (PDF)',
  'feature.indexedDb': 'IndexedDB स्थानीय संग्रहण',
  'feature.maxFactors': '6 कारकों तक',
  'feature.maxRows': '250K पंक्तियों तक',
  'feature.onedriveSync': 'OneDrive प्रोजेक्ट सिंक',
  'feature.sharepointPicker': 'SharePoint फ़ाइल पिकर',
  'feature.teamsIntegration': 'Microsoft Teams एकीकरण',
  'feature.channelCollab': 'चैनल-आधारित सहयोग',
  'feature.mobileUi': 'मोबाइल-अनुकूलित UI',
  'feature.coScoutAi': 'CoScout AI सहायक',
  'feature.narrativeBar': 'NarrativeBar अंतर्दृष्टि',
  'feature.chartInsights': 'चार्ट अंतर्दृष्टि चिप्स',
  'feature.knowledgeBase': 'ज्ञान आधार (SharePoint खोज)',
  'feature.aiActions': 'AI-सुझावित कार्रवाइयाँ',

  // Admin Teams setup
  'admin.teams.heading': 'Microsoft Teams में VariScout जोड़ें',
  'admin.teams.description':
    'अपनी तैनाती के लिए एक Teams ऐप पैकेज बनाएँ और इसे अपने Teams व्यवस्थापक केंद्र में अपलोड करें।',
  'admin.teams.running': 'Microsoft Teams के अंदर चल रहा है',
  'admin.teams.step1': 'ऐप पंजीकरण क्लाइंट ID (वैकल्पिक)',
  'admin.teams.step1Desc':
    'मैनिफ़ेस्ट में Teams SSO सक्षम करने के लिए अपना Azure AD ऐप पंजीकरण क्लाइंट ID दर्ज करें।',
  'admin.teams.step2': 'Teams ऐप पैकेज डाउनलोड करें',
  'admin.teams.step2Desc':
    'इस .zip में आपकी तैनाती के लिए पूर्व-कॉन्फ़िगर किए गए मैनिफ़ेस्ट और आइकन हैं।',
  'admin.teams.step3': 'Teams व्यवस्थापक केंद्र में अपलोड करें',
  'admin.teams.step4': 'किसी चैनल में VariScout जोड़ें',
  'admin.teams.download': 'Teams ऐप पैकेज डाउनलोड करें',

  // Admin status tab
  'admin.checksResult': '{pass}/{total} जाँचें पास हुईं',
  'admin.runChecks': 'सभी जाँचें चलाएँ',
  'admin.notApplicable': 'आपकी योजना पर लागू नहीं',
  'admin.managePortal': 'Azure Portal में प्रबंधित करें',
  'admin.portalAccessNote':
    'इन आइटम्स के लिए Azure Portal एक्सेस आवश्यक है और ब्राउज़र से जाँच नहीं की जा सकती।',
  'admin.fixInPortal': 'Azure Portal में ठीक करें: {label}',

  // Admin troubleshoot tab
  'admin.troubleshoot.intro':
    'सामान्य समस्याएँ और उन्हें कैसे ठीक करें। चरण-दर-चरण निर्देशों के लिए किसी समस्या पर क्लिक करें।',
  'admin.runCheck': 'जाँच चलाएँ',
  'admin.checkPassed': 'जाँच पास हुई — यह समस्या नहीं हो सकती।',
  'admin.checkFailed': 'जाँच विफल — नीचे दिए गए चरणों का पालन करें।',
  'admin.issue.signin': 'उपयोगकर्ता साइन इन नहीं कर सकते',
  'admin.issue.signinDesc':
    'Azure AD प्रमाणीकरण काम नहीं कर रहा या उपयोगकर्ताओं को खाली पृष्ठ दिखता है।',
  'admin.issue.signinSteps':
    'सत्यापित करें कि App Service प्रमाणीकरण Azure Portal में सक्षम है।\nजाँचें कि Azure AD ऐप पंजीकरण में सही रीडायरेक्ट URI हैं।\nसुनिश्चित करें कि ऐप पंजीकरण में प्रमाणीकरण के तहत "ID टोकन" सक्षम हैं।\nसत्यापित करें कि टेनेंट ऐप में उपयोगकर्ता साइन-इन की अनुमति देता है (एंटरप्राइज़ एप्लिकेशन → गुण → उपयोगकर्ताओं के साइन-इन के लिए सक्षम)।',
  'admin.issue.onedrive': 'OneDrive सिंक काम नहीं कर रहा',
  'admin.issue.onedriveDesc':
    'प्रोजेक्ट OneDrive पर सिंक नहीं हो रहे या उपयोगकर्ताओं को अनुमति त्रुटियाँ दिखती हैं।',
  'admin.issue.onedriveSteps':
    'सत्यापित करें कि ऐप पंजीकरण में "Files.ReadWrite" प्रत्यायोजित अनुमति है।\nजाँचें कि Graph अनुमतियों के लिए व्यवस्थापक सहमति दी गई है।\nसुनिश्चित करें कि उपयोगकर्ता को OneDrive लाइसेंस सौंपा गया है।\nटोकन रीफ़्रेश करने के लिए साइन आउट और साइन इन करने का प्रयास करें।',
  'admin.issue.coscout': 'CoScout प्रतिक्रिया नहीं दे रहा',
  'admin.issue.coscoutDesc': 'AI सहायक प्रतिक्रियाएँ उत्पन्न नहीं कर रहा या त्रुटियाँ दिखा रहा है।',
  'admin.issue.coscoutSteps':
    'सत्यापित करें कि AI एंडपॉइंट ARM टेम्पलेट / App Service सेटिंग्स में कॉन्फ़िगर है।\nजाँचें कि Azure AI Services संसाधन तैनात और चल रहा है।\nसत्यापित करें कि AI Services संसाधन में मॉडल तैनाती मौजूद है (उदा. gpt-4o)।\nAzure AI Services कोटा जाँचें — तैनाती दर सीमा तक पहुँच गई हो सकती है।',
  'admin.issue.kbEmpty': 'ज्ञान आधार कोई परिणाम नहीं लौटाता',
  'admin.issue.kbEmptyDesc':
    'CoScout का "ज्ञान आधार खोजें" दस्तावेज़ मौजूद होने के बावजूद कुछ नहीं पाता।',
  'admin.issue.kbEmptySteps':
    'सत्यापित करें कि AI Search एंडपॉइंट App Service सेटिंग्स में कॉन्फ़िगर है।\nजाँचें कि Remote SharePoint ज्ञान स्रोत AI Search में बनाया गया है।\nसुनिश्चित करें कि टेनेंट में ≥1 Microsoft 365 Copilot लाइसेंस सक्रिय है।\nसत्यापित करें कि उपयोगकर्ता के पास खोजे जा रहे दस्तावेज़ों तक SharePoint पहुँच है।\nजाँचें कि ज्ञान आधार पूर्वावलोकन टॉगल सक्षम है (व्यवस्थापक → ज्ञान आधार टैब)।',
  'admin.issue.teamsTab': 'Teams टैब नहीं दिख रहा',
  'admin.issue.teamsTabDesc': 'VariScout Teams में दिखाई नहीं देता या टैब लोड नहीं होता।',
  'admin.issue.teamsTabSteps':
    'सत्यापित करें कि Teams ऐप पैकेज (.zip) Teams व्यवस्थापक केंद्र में अपलोड किया गया है।\nजाँचें कि manifest.json में contentUrl आपके App Service URL से मेल खाता है।\nसुनिश्चित करें कि ऐप Teams व्यवस्थापक केंद्र में स्वीकृत है (नीति द्वारा अवरुद्ध नहीं)।\nचैनल में टैब हटाकर फिर से जोड़ने का प्रयास करें।\nयदि कस्टम डोमेन का उपयोग कर रहे हैं, सत्यापित करें कि यह मैनिफ़ेस्ट के validDomains सरणी में है।',
  'admin.issue.newUser': 'नया उपयोगकर्ता ऐप एक्सेस नहीं कर सकता',
  'admin.issue.newUserDesc': 'नया जोड़ा गया उपयोगकर्ता एक्सेस अस्वीकृत या खाली पृष्ठ देखता है।',
  'admin.issue.newUserSteps':
    'Azure AD में, एंटरप्राइज़ एप्लिकेशन → VariScout → उपयोगकर्ता और समूह पर जाएँ।\nउपयोगकर्ता या उनके सुरक्षा समूह को ऐप में जोड़ें।\nयदि "उपयोगकर्ता असाइनमेंट आवश्यक" का उपयोग हो, सुनिश्चित करें कि उपयोगकर्ता के पास असाइनमेंट है।\nउपयोगकर्ता को अवरुद्ध करने वाली सशर्त पहुँच नीतियों की जाँच करें।',
  'admin.issue.aiSlow': 'AI प्रतिक्रियाएँ धीमी हैं',
  'admin.issue.aiSlowDesc':
    'CoScout प्रतिक्रिया देने में बहुत समय लेता है या बार-बार समय समाप्त हो जाता है।',
  'admin.issue.aiSlowSteps':
    'Azure AI Services तैनाती क्षेत्र जाँचें — दूरी के साथ विलंबता बढ़ती है।\nसत्यापित करें कि मॉडल तैनाती में पर्याप्त TPM (प्रति मिनट टोकन) कोटा है।\nनिरंतर विलंबता के लिए प्रावधानित थ्रूपुट तैनाती में अपग्रेड पर विचार करें।\nजाँचें कि AI Search इंडेक्स बड़ा तो नहीं — ज्ञान स्रोत को अनुकूलित करने पर विचार करें।',
  'admin.issue.forbidden': '"Forbidden" त्रुटियाँ',
  'admin.issue.forbiddenDesc':
    'कुछ सुविधाओं तक पहुँचने पर उपयोगकर्ताओं को 403 त्रुटियाँ दिखती हैं।',
  'admin.issue.forbiddenSteps':
    'जाँचें कि सभी आवश्यक Graph API अनुमतियों को व्यवस्थापक सहमति प्राप्त है।\nसत्यापित करें कि App Service प्रमाणीकरण टोकन स्टोर सक्षम है।\nसुनिश्चित करें कि उपयोगकर्ता का टोकन समाप्त नहीं हुआ है — साइन आउट और साइन इन करने का प्रयास करें।\nटेनेंट की सशर्त पहुँच नीतियों की जाँच करें।',
  'admin.issue.kbPartial': 'कुछ उपयोगकर्ताओं के लिए KB विफल',
  'admin.issue.kbPartialDesc':
    'ज्ञान आधार खोज व्यवस्थापकों के लिए काम करती है लेकिन अन्य उपयोगकर्ताओं के लिए नहीं।',
  'admin.issue.kbPartialSteps':
    'Remote SharePoint ज्ञान स्रोत प्रति-उपयोगकर्ता अनुमतियों का उपयोग करते हैं। प्रत्येक उपयोगकर्ता के पास दस्तावेज़ों तक SharePoint पहुँच होनी चाहिए।\nजाँचें कि प्रभावित उपयोगकर्ता सशर्त पहुँच नीतियों द्वारा अवरुद्ध तो नहीं हैं।\nसत्यापित करें कि Sites.Read.All प्रत्यायोजित अनुमति के लिए व्यवस्थापक सहमति दी गई है।\nप्रभावित उपयोगकर्ताओं से अपना टोकन रीफ़्रेश करने के लिए साइन आउट और साइन इन करने को कहें।',

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
    'Validate your hypotheses in the Findings view. Supported hypotheses unlock improvement brainstorming.',
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

  // Hypothesis role labels
  'hypothesis.primary': 'Primary',
  'hypothesis.contributing': 'Contributing',
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
  'report.hypothesisTree': 'Hypothesis Tree',
  'report.hypothesis.supported': 'Supported',
  'report.hypothesis.partial': 'Partial',
  'report.hypothesis.contradicted': 'Contradicted',
  'report.hypothesis.untested': 'Untested',
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
  'fi.title': 'कारक बुद्धिमत्ता',
  'fi.ranking': 'कारक रैंकिंग (R² समायोजित)',
  'fi.layer2': 'परत 2 · मुख्य प्रभाव',
  'fi.layer3': 'परत 3 · कारक अंतःक्रियाएँ',
  'fi.investigate': 'जाँच करें →',
  'fi.notSignificant': 'महत्वपूर्ण नहीं (p={value})',
  'fi.explainsSingle': '{factor} अकेले {pct}% विचरण की व्याख्या करता है।',
  'fi.explainsMultiple': '{factors} मिलकर {pct}% विचरण की व्याख्या करते हैं।',
  'fi.layer2Locked': 'परत 2 (मुख्य प्रभाव) R²adj > {threshold}% होने पर अनलॉक होती है',
  'fi.layer2Current': ' — वर्तमान में {value}%',
  'fi.layer3Locked': 'परत 3 (अंतःक्रियाएँ) ≥2 कारक महत्वपूर्ण होने पर अनलॉक होती है',
  'fi.layer3Current': ' — वर्तमान में {count} महत्वपूर्ण',
  'fi.best': 'सर्वश्रेष्ठ',
  'fi.range': 'परिसर',
  'fi.interactionDetected':
    'अंतःक्रिया पाई गई: {factorA} का प्रभाव {factorB} के स्तर पर निर्भर करता है।',
  'fi.noInteraction': 'कोई महत्वपूर्ण अंतःक्रिया नहीं — प्रभाव लगभग योगात्मक हैं।',

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
