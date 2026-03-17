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

  // Limit labels
  'limits.usl': 'USL',
  'limits.lsl': 'LSL',
  'limits.ucl': 'UCL',
  'limits.lcl': 'LCL',
  'limits.mean': 'Mean',
  'limits.target': 'Target',

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
};
