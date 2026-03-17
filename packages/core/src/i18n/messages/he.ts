import type { MessageCatalog } from '../types';

/** Hebrew message catalog */
export const he: MessageCatalog = {
  // Statistics labels
  'stats.mean': 'ממוצע',
  'stats.median': 'חציון',
  'stats.stdDev': 'סטיית תקן',
  'stats.samples': 'דגימות',
  'stats.passRate': 'שיעור מעבר',
  'stats.range': 'טווח',
  'stats.min': 'מינימום',
  'stats.max': 'מקסימום',
  'stats.target': 'יעד',
  'stats.sigma': 'סיגמא',

  // Chart labels
  'chart.observation': 'תצפית',
  'chart.count': 'ספירה',
  'chart.frequency': 'תדירות',
  'chart.value': 'ערך',
  'chart.category': 'קטגוריה',
  'chart.cumulative': 'מצטבר %',
  'chart.clickToEdit': 'לחץ לעריכה',
  'chart.median': 'חציון',
  'chart.q1': 'Q1',
  'chart.q3': 'Q3',
  'chart.noChannelData': 'אין נתוני ערוץ',
  'chart.selectChannel': 'בחר ערוץ',

  // Limit labels
  'limits.usl': 'USL',
  'limits.lsl': 'LSL',
  'limits.ucl': 'UCL',
  'limits.lcl': 'LCL',
  'limits.mean': 'ממוצע',
  'limits.target': 'יעד',

  // Navigation
  'nav.newAnalysis': 'ניתוח חדש',
  'nav.backToDashboard': 'חזרה ללוח המחוונים',
  'nav.settings': 'הגדרות',
  'nav.export': 'ייצוא',
  'nav.presentation': 'מצגת',
  'nav.menu': 'תפריט',
  'nav.moreActions': 'פעולות נוספות',

  // Panel titles
  'panel.findings': 'ממצאים',
  'panel.dataTable': 'טבלת נתונים',
  'panel.whatIf': 'מה אם',
  'panel.investigation': 'חקירה',
  'panel.coScout': 'CoScout',
  'panel.drillPath': 'נתיב קידוח',

  // View modes
  'view.list': 'רשימה',
  'view.board': 'לוח',
  'view.tree': 'עץ',

  // Action buttons
  'action.save': 'שמור',
  'action.cancel': 'ביטול',
  'action.delete': 'מחק',
  'action.edit': 'ערוך',
  'action.copy': 'העתק',
  'action.close': 'סגור',
  'action.learnMore': 'למד עוד',
  'action.download': 'הורד',
  'action.apply': 'החל',
  'action.reset': 'אפס',
  'action.retry': 'נסה שוב',
  'action.send': 'שלח',
  'action.ask': 'שאל',
  'action.clear': 'נקה',
  'action.copyAll': 'העתק הכל',
  'action.selectAll': 'בחר הכל',

  // CoScout
  'coscout.send': 'שלח',
  'coscout.clear': 'נקה שיחה',
  'coscout.stop': 'עצור',
  'coscout.rateLimit': 'הגעת למגבלת קצב. אנא המתן.',
  'coscout.contentFilter': 'התוכן סונן על ידי מדיניות אבטחה.',
  'coscout.error': 'אירעה שגיאה. אנא נסה שוב.',

  // Display/settings
  'display.preferences': 'העדפות',
  'display.chartTextSize': 'גודל טקסט תרשים',
  'display.compact': 'צפוף',
  'display.normal': 'רגיל',
  'display.large': 'גדול',
  'display.lockYAxis': 'נעל ציר Y',
  'display.filterContext': 'הקשר סינון',
  'display.showSpecs': 'הצג מפרטים',

  // Investigation
  'investigation.brief': 'תקציר חקירה',
  'investigation.assignedToMe': 'מוקצה אליי',
  'investigation.hypothesis': 'השערה',
  'investigation.hypotheses': 'השערות',
  'investigation.pinAsFinding': 'הצמד כממצא',
  'investigation.addObservation': 'הוסף תצפית',

  // Empty states
  'empty.noData': 'אין נתונים זמינים',
  'empty.noFindings': 'אין ממצאים עדיין',
  'empty.noResults': 'לא נמצאו תוצאות',

  // Error messages
  'error.generic': 'משהו השתבש',
  'error.loadFailed': 'טעינת הנתונים נכשלה',
  'error.parseFailed': 'ניתוח הקובץ נכשל',

  // Settings labels
  'settings.language': 'שפה',
  'settings.theme': 'ערכת נושא',
  'settings.textSize': 'גודל טקסט',

  // Finding statuses
  'findings.observed': 'נצפה',
  'findings.investigating': 'בחקירה',
  'findings.analyzed': 'נותח',
  'findings.improving': 'בשיפור',
  'findings.resolved': 'נפתר',

  // Report labels
  'report.summary': 'סיכום',
  'report.findings': 'ממצאים',
  'report.recommendations': 'המלצות',
  'report.evidence': 'ראיות',

  // Data input labels
  'data.pasteData': 'הדבק נתונים',
  'data.uploadFile': 'העלה קובץ',
  'data.columnMapping': 'מיפוי עמודות',
  'data.measureColumn': 'עמודת מדידה',
  'data.factorColumn': 'עמודת גורם',
  'data.addData': 'הוסף נתונים',
  'data.editData': 'ערוך נתונים',
  'data.showDataTable': 'הצג טבלת נתונים',
  'data.hideDataTable': 'הסתר טבלת נתונים',

  // Status
  'status.cached': 'שמור במטמון',
  'status.loading': 'טוען',
  'status.ai': 'בינה',
};
