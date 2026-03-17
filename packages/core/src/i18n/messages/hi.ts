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
  'display.chartTextSize': 'चार्ट पाठ आकार',
  'display.compact': 'संक्षिप्त',
  'display.normal': 'सामान्य',
  'display.large': 'बड़ा',
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
};
