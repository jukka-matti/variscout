/**
 * Keyword lists for defect data format detection
 */

/** Column names that suggest a defect type/category column */
export const DEFECT_TYPE_KEYWORDS = [
  'defect',
  'defect_type',
  'defect_category',
  'error',
  'error_type',
  'failure',
  'failure_mode',
  'reject',
  'reject_reason',
  'fault',
  'issue',
  'issue_type',
  'nonconformance',
  'nc_type',
  'scrap_reason',
];

/** Column names that suggest a defect count column */
export const DEFECT_COUNT_KEYWORDS = [
  'count',
  'defect_count',
  'defects',
  'errors',
  'rejects',
  'failures',
  'qty_defective',
  'nc_count',
  'scrap_count',
];

/** Paired pass/fail value patterns (case-insensitive matching) */
export const PASS_FAIL_VALUES: [string, string][] = [
  ['OK', 'NG'],
  ['Pass', 'Fail'],
  ['Good', 'Bad'],
  ['Conforming', 'Nonconforming'],
  ['0', '1'],
  ['Y', 'N'],
  ['Accept', 'Reject'],
  ['Go', 'NoGo'],
];

/** Column names that suggest a pass/fail result column */
export const PASS_FAIL_COLUMN_KEYWORDS = [
  'result',
  'status',
  'outcome',
  'pass_fail',
  'verdict',
  'judgment',
];
