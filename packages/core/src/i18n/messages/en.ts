import type { MessageCatalog } from '../types';

/**
 * English message catalog — source of truth.
 * All other locale catalogs must satisfy the same interface.
 */
export const en: MessageCatalog = {
  // Statistics labels
  'stats.mean': 'Mean',
  'stats.median': 'Median',
  'stats.stdDev': 'Std Dev',
  'stats.samples': 'Samples',
  'stats.passRate': 'Pass Rate',
  'stats.range': 'Range',
  'stats.min': 'Min',
  'stats.max': 'Max',
  'stats.target': 'Target',
  'stats.sigma': 'Sigma',

  // Chart labels
  'chart.observation': 'Observation',
  'chart.count': 'Count',
  'chart.frequency': 'Frequency',
  'chart.value': 'Value',
  'chart.category': 'Category',
  'chart.cumulative': 'Cumulative %',
  'chart.clickToEdit': 'Click to edit',
  'chart.median': 'Median',
  'chart.q1': 'Q1',
  'chart.q3': 'Q3',
  'chart.noChannelData': 'No channel data',
  'chart.selectChannel': 'Select channel',

  // Limit labels
  'limits.usl': 'USL',
  'limits.lsl': 'LSL',
  'limits.ucl': 'UCL',
  'limits.lcl': 'LCL',
  'limits.mean': 'Mean',
  'limits.target': 'Target',

  // Navigation
  'nav.newAnalysis': 'New Analysis',
  'nav.backToDashboard': 'Back to Dashboard',
  'nav.settings': 'Settings',
  'nav.export': 'Export',
  'nav.presentation': 'Presentation',
  'nav.menu': 'Menu',
  'nav.moreActions': 'More actions',

  // Panel titles
  'panel.findings': 'Findings',
  'panel.dataTable': 'Data Table',
  'panel.whatIf': 'What If',
  'panel.investigation': 'Investigation',
  'panel.coScout': 'CoScout',
  'panel.drillPath': 'Drill Path',

  // View modes
  'view.list': 'List',
  'view.board': 'Board',
  'view.tree': 'Tree',

  // Action buttons
  'action.save': 'Save',
  'action.cancel': 'Cancel',
  'action.delete': 'Delete',
  'action.edit': 'Edit',
  'action.copy': 'Copy',
  'action.close': 'Close',
  'action.learnMore': 'Learn more',
  'action.download': 'Download',
  'action.apply': 'Apply',
  'action.reset': 'Reset',
  'action.retry': 'Retry',
  'action.send': 'Send',
  'action.ask': 'Ask',
  'action.clear': 'Clear',
  'action.copyAll': 'Copy all',
  'action.selectAll': 'Select all',

  // CoScout
  'coscout.send': 'Send',
  'coscout.clear': 'Clear conversation',
  'coscout.stop': 'Stop',
  'coscout.rateLimit': 'Rate limit reached. Please wait.',
  'coscout.contentFilter': 'Content filtered by safety policy.',
  'coscout.error': 'An error occurred. Please try again.',

  // Display/settings
  'display.preferences': 'Preferences',
  'display.chartTextSize': 'Chart text size',
  'display.compact': 'Compact',
  'display.normal': 'Normal',
  'display.large': 'Large',
  'display.lockYAxis': 'Lock Y-axis',
  'display.filterContext': 'Filter context',
  'display.showSpecs': 'Show specifications',

  // Investigation
  'investigation.brief': 'Investigation Brief',
  'investigation.assignedToMe': 'Assigned to me',
  'investigation.hypothesis': 'Hypothesis',
  'investigation.hypotheses': 'Hypotheses',
  'investigation.pinAsFinding': 'Pin as finding',
  'investigation.addObservation': 'Add observation',

  // Empty states
  'empty.noData': 'No data available',
  'empty.noFindings': 'No findings yet',
  'empty.noResults': 'No results found',

  // Error messages
  'error.generic': 'Something went wrong',
  'error.loadFailed': 'Failed to load data',
  'error.parseFailed': 'Failed to parse file',

  // Settings labels
  'settings.language': 'Language',
  'settings.theme': 'Theme',
  'settings.textSize': 'Text Size',

  // Finding statuses
  'findings.observed': 'Observed',
  'findings.investigating': 'Investigating',
  'findings.analyzed': 'Analyzed',
  'findings.improving': 'Improving',
  'findings.resolved': 'Resolved',

  // Report labels
  'report.summary': 'Summary',
  'report.findings': 'Findings',
  'report.recommendations': 'Recommendations',
  'report.evidence': 'Evidence',

  // Data input labels
  'data.pasteData': 'Paste Data',
  'data.uploadFile': 'Upload File',
  'data.columnMapping': 'Column Mapping',
  'data.measureColumn': 'Measure Column',
  'data.factorColumn': 'Factor Column',
  'data.addData': 'Add data',
  'data.editData': 'Edit data',
  'data.showDataTable': 'Show data table',
  'data.hideDataTable': 'Hide data table',

  // Status
  'status.cached': 'Cached',
  'status.loading': 'Loading',
  'status.ai': 'AI',
};
