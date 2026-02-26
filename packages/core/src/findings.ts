/**
 * Findings Scouting Report
 *
 * Data model for analyst-captured findings — bookmarked filter states
 * with notes, stats, and variation context.
 */

// ============================================================================
// Investigation Status Types
// ============================================================================

/** Investigation lifecycle status */
export type FindingStatus = 'observed' | 'investigating' | 'confirmed' | 'dismissed';

/** Ordered list of all finding statuses */
export const FINDING_STATUSES: FindingStatus[] = [
  'observed',
  'investigating',
  'confirmed',
  'dismissed',
];

/** Human-readable labels for finding statuses */
export const FINDING_STATUS_LABELS: Record<FindingStatus, string> = {
  observed: 'Observed',
  investigating: 'Investigating',
  confirmed: 'Confirmed',
  dismissed: 'Dismissed',
};

/** A timestamped comment in a finding's investigation log */
export interface FindingComment {
  id: string;
  text: string;
  createdAt: number;
}

// ============================================================================
// Finding Types
// ============================================================================

/**
 * Snapshot of the dashboard state when a finding was captured
 */
export interface FindingContext {
  /** Active filters at time of capture: factor → selected values */
  activeFilters: Record<string, (string | number)[]>;
  /** Cumulative variation % isolated (0–100), or null if no filters */
  cumulativeScope: number | null;
  /** Key statistics at time of capture */
  stats?: { mean: number; cpk?: number; samples: number };
}

/**
 * A single finding — a bookmarked filter state with analyst notes
 */
export interface Finding {
  /** Unique identifier */
  id: string;
  /** Analyst's note describing the finding */
  text: string;
  /** Timestamp of creation (Date.now()) */
  createdAt: number;
  /** Dashboard state snapshot */
  context: FindingContext;
  /** Investigation status */
  status: FindingStatus;
  /** Timestamped investigation comments */
  comments: FindingComment[];
  /** When status was last changed */
  statusChangedAt: number;
}

// ============================================================================
// Factory Functions
// ============================================================================

/** Generate a unique ID */
function generateId(): string {
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `f-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Create a new Finding with a unique ID
 */
export function createFinding(
  text: string,
  activeFilters: Record<string, (string | number)[]>,
  cumulativeScope: number | null,
  stats?: { mean: number; cpk?: number; samples: number },
  status?: FindingStatus
): Finding {
  return {
    id: generateId(),
    text,
    createdAt: Date.now(),
    context: {
      activeFilters,
      cumulativeScope,
      stats,
    },
    status: status ?? 'observed',
    comments: [],
    statusChangedAt: Date.now(),
  };
}

/**
 * Create a timestamped comment with a unique ID
 */
export function createFindingComment(text: string): FindingComment {
  return {
    id: generateId(),
    text,
    createdAt: Date.now(),
  };
}

// ============================================================================
// Status Helpers
// ============================================================================

/**
 * Get finding status
 */
export function getFindingStatus(finding: Finding): FindingStatus {
  return finding.status;
}

/**
 * Group findings by status for board view
 */
export function groupFindingsByStatus(findings: Finding[]): Record<FindingStatus, Finding[]> {
  const groups: Record<FindingStatus, Finding[]> = {
    observed: [],
    investigating: [],
    confirmed: [],
    dismissed: [],
  };

  for (const finding of findings) {
    groups[finding.status].push(finding);
  }

  return groups;
}

/**
 * Format a finding's filters as a compact display string
 *
 * @example
 * formatFindingFilters(ctx, { Machine: 'Filling Head' })
 * // → "Filling Head=B, Shift=Night"
 */
/**
 * Compare two activeFilters objects (order-insensitive for both keys and values)
 */
export function filtersEqual(
  a: Record<string, (string | number)[]>,
  b: Record<string, (string | number)[]>
): boolean {
  const keysA = Object.keys(a).sort();
  const keysB = Object.keys(b).sort();
  if (keysA.length !== keysB.length) return false;
  for (let i = 0; i < keysA.length; i++) {
    if (keysA[i] !== keysB[i]) return false;
    const valsA = a[keysA[i]].map(String).sort();
    const valsB = b[keysB[i]].map(String).sort();
    if (valsA.length !== valsB.length) return false;
    for (let j = 0; j < valsA.length; j++) {
      if (valsA[j] !== valsB[j]) return false;
    }
  }
  return true;
}

/**
 * Find an existing finding with matching filters, or undefined
 */
export function findDuplicateFinding(
  findings: Finding[],
  activeFilters: Record<string, (string | number)[]>
): Finding | undefined {
  return findings.find(f => filtersEqual(f.context.activeFilters, activeFilters));
}

export function formatFindingFilters(
  context: FindingContext,
  columnAliases?: Record<string, string>
): string {
  const parts: string[] = [];
  for (const [factor, values] of Object.entries(context.activeFilters)) {
    const label = columnAliases?.[factor] || factor;
    const valStr =
      values.length <= 2 ? values.map(String).join(', ') : `${values[0]} +${values.length - 1}`;
    parts.push(`${label}=${valStr}`);
  }
  return parts.join(' · ');
}
