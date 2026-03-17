import type { MessageCatalog } from '../types';

/** Greek message catalog */
export const el: MessageCatalog = {
  // Statistics labels
  'stats.mean': 'Μέσος όρος',
  'stats.median': 'Διάμεσος',
  'stats.stdDev': 'Τυπ. Απόκλιση',
  'stats.samples': 'Δείγματα',
  'stats.passRate': 'Ποσοστό επιτυχίας',
  'stats.range': 'Εύρος',
  'stats.min': 'Ελάχ.',
  'stats.max': 'Μέγ.',
  'stats.target': 'Στόχος',
  'stats.sigma': 'Σίγμα',

  // Chart labels
  'chart.observation': 'Παρατήρηση',
  'chart.count': 'Πλήθος',
  'chart.frequency': 'Συχνότητα',
  'chart.value': 'Τιμή',
  'chart.category': 'Κατηγορία',
  'chart.cumulative': 'Αθροιστικό %',
  'chart.clickToEdit': 'Κλικ για επεξεργασία',
  'chart.median': 'Διάμεσος',
  'chart.q1': 'Q1',
  'chart.q3': 'Q3',
  'chart.noChannelData': 'Δεν υπάρχουν δεδομένα καναλιού',
  'chart.selectChannel': 'Επιλογή καναλιού',

  // Limit labels
  'limits.usl': 'USL',
  'limits.lsl': 'LSL',
  'limits.ucl': 'UCL',
  'limits.lcl': 'LCL',
  'limits.mean': 'Μέσος όρος',
  'limits.target': 'Στόχος',

  // Navigation
  'nav.newAnalysis': 'Νέα Ανάλυση',
  'nav.backToDashboard': 'Επιστροφή στον Πίνακα',
  'nav.settings': 'Ρυθμίσεις',
  'nav.export': 'Εξαγωγή',
  'nav.presentation': 'Παρουσίαση',
  'nav.menu': 'Μενού',
  'nav.moreActions': 'Περισσότερες ενέργειες',

  // Panel titles
  'panel.findings': 'Ευρήματα',
  'panel.dataTable': 'Πίνακας Δεδομένων',
  'panel.whatIf': 'Τι εάν',
  'panel.investigation': 'Διερεύνηση',
  'panel.coScout': 'CoScout',
  'panel.drillPath': 'Διαδρομή ανάλυσης',

  // View modes
  'view.list': 'Λίστα',
  'view.board': 'Πίνακας',
  'view.tree': 'Δέντρο',

  // Action buttons
  'action.save': 'Αποθήκευση',
  'action.cancel': 'Ακύρωση',
  'action.delete': 'Διαγραφή',
  'action.edit': 'Επεξεργασία',
  'action.copy': 'Αντιγραφή',
  'action.close': 'Κλείσιμο',
  'action.learnMore': 'Μάθετε περισσότερα',
  'action.download': 'Λήψη',
  'action.apply': 'Εφαρμογή',
  'action.reset': 'Επαναφορά',
  'action.retry': 'Επανάληψη',
  'action.send': 'Αποστολή',
  'action.ask': 'Ρωτήστε',
  'action.clear': 'Εκκαθάριση',
  'action.copyAll': 'Αντιγραφή όλων',
  'action.selectAll': 'Επιλογή όλων',

  // CoScout
  'coscout.send': 'Αποστολή',
  'coscout.clear': 'Εκκαθάριση συνομιλίας',
  'coscout.stop': 'Διακοπή',
  'coscout.rateLimit': 'Συμπληρώθηκε το όριο αιτημάτων. Παρακαλώ περιμένετε.',
  'coscout.contentFilter': 'Το περιεχόμενο φιλτραρίστηκε από την πολιτική ασφαλείας.',
  'coscout.error': 'Παρουσιάστηκε σφάλμα. Παρακαλώ δοκιμάστε ξανά.',

  // Display/settings
  'display.preferences': 'Προτιμήσεις',
  'display.chartTextSize': 'Μέγεθος κειμένου γραφήματος',
  'display.compact': 'Συμπαγές',
  'display.normal': 'Κανονικό',
  'display.large': 'Μεγάλο',
  'display.lockYAxis': 'Κλείδωμα άξονα Υ',
  'display.filterContext': 'Πλαίσιο φίλτρου',
  'display.showSpecs': 'Εμφάνιση προδιαγραφών',

  // Investigation
  'investigation.brief': 'Σύνοψη Διερεύνησης',
  'investigation.assignedToMe': 'Ανατέθηκε σε εμένα',
  'investigation.hypothesis': 'Υπόθεση',
  'investigation.hypotheses': 'Υποθέσεις',
  'investigation.pinAsFinding': 'Καρφίτσωμα ως εύρημα',
  'investigation.addObservation': 'Προσθήκη παρατήρησης',

  // Empty states
  'empty.noData': 'Δεν υπάρχουν διαθέσιμα δεδομένα',
  'empty.noFindings': 'Δεν υπάρχουν ευρήματα ακόμα',
  'empty.noResults': 'Δεν βρέθηκαν αποτελέσματα',

  // Error messages
  'error.generic': 'Κάτι πήγε στραβά',
  'error.loadFailed': 'Αποτυχία φόρτωσης δεδομένων',
  'error.parseFailed': 'Αποτυχία ανάλυσης αρχείου',

  // Settings labels
  'settings.language': 'Γλώσσα',
  'settings.theme': 'Θέμα',
  'settings.textSize': 'Μέγεθος κειμένου',

  // Finding statuses
  'findings.observed': 'Παρατηρήθηκε',
  'findings.investigating': 'Υπό διερεύνηση',
  'findings.analyzed': 'Αναλύθηκε',
  'findings.improving': 'Υπό βελτίωση',
  'findings.resolved': 'Επιλύθηκε',

  // Report labels
  'report.summary': 'Σύνοψη',
  'report.findings': 'Ευρήματα',
  'report.recommendations': 'Συστάσεις',
  'report.evidence': 'Τεκμηρίωση',

  // Data input labels
  'data.pasteData': 'Επικόλληση δεδομένων',
  'data.uploadFile': 'Μεταφόρτωση αρχείου',
  'data.columnMapping': 'Αντιστοίχιση στηλών',
  'data.measureColumn': 'Στήλη μέτρησης',
  'data.factorColumn': 'Στήλη παράγοντα',
  'data.addData': 'Προσθήκη δεδομένων',
  'data.editData': 'Επεξεργασία δεδομένων',
  'data.showDataTable': 'Εμφάνιση πίνακα δεδομένων',
  'data.hideDataTable': 'Απόκρυψη πίνακα δεδομένων',

  // Status
  'status.cached': 'Αποθηκευμένο',
  'status.loading': 'Φόρτωση',
  'status.ai': 'AI',
};
