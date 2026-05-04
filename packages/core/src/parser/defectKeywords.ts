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

/**
 * Keywords matching the column that identifies which step caught/rejected each defect.
 * See spec §9.1 (defect anchoring) — when present, defect data anchors per-step.
 *
 * Order matters: more specific multi-word keywords appear first so they pre-empt the bare
 * 'step' fallback for column names like `process_step` or `step_id`.
 * The matcher uses substring matching, so e.g. `reject_step` matches a column named
 * `my_reject_step_v2`.
 */
export const STEP_REJECTED_AT_KEYWORDS = [
  'step_rejected_at',
  'reject_step',
  'rejection_step',
  'step_of_origin',
  'failed_at_step',
  'defect_step',
  'caught_at_step',
  'caught_at',
  'step_caught',
  'fail_step',
  'rejected_step',
  // Bare 'step' is a final fallback — more specific keywords above pre-empt it.
  'step',
];
