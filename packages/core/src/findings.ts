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
export type FindingStatus = 'observed' | 'investigating' | 'analyzed';

/** Ordered list of all finding statuses */
export const FINDING_STATUSES: FindingStatus[] = ['observed', 'investigating', 'analyzed'];

/** Human-readable labels for finding statuses */
export const FINDING_STATUS_LABELS: Record<FindingStatus, string> = {
  observed: 'Observed',
  investigating: 'Investigating',
  analyzed: 'Analyzed',
};

// ============================================================================
// Finding Tags (classification for analyzed findings)
// ============================================================================

/** Optional classification tag for analyzed findings */
export type FindingTag = 'key-driver' | 'low-impact';

/** Ordered list of all finding tags */
export const FINDING_TAGS: FindingTag[] = ['key-driver', 'low-impact'];

/** Human-readable labels for finding tags */
export const FINDING_TAG_LABELS: Record<FindingTag, string> = {
  'key-driver': 'Key Driver',
  'low-impact': 'Low Impact',
};

// ============================================================================
// Photo Attachment Types
// ============================================================================

/** Upload lifecycle status for a photo attachment */
export type PhotoUploadStatus = 'pending' | 'uploaded' | 'failed';

/** A photo attached to a finding comment */
export interface PhotoAttachment {
  id: string;
  filename: string;
  /** OneDrive file ID, set after successful upload */
  driveItemId?: string;
  /** Base64 data URL thumbnail (~50KB), persisted in .vrs for offline viewing */
  thumbnailDataUrl?: string;
  uploadStatus: PhotoUploadStatus;
  /** Timestamp when the photo was captured (Date.now()) */
  capturedAt: number;
}

/** A timestamped comment in a finding's investigation log */
export interface FindingComment {
  id: string;
  text: string;
  createdAt: number;
  /** Author display name (from EasyAuth or Teams user context). Optional for backward compat. */
  author?: string;
  /** Photo attachments (Team plan only) */
  photos?: PhotoAttachment[];
}

// ============================================================================
// Finding Assignee (Team plan @mention workflow)
// ============================================================================

/** A lightweight assignee for Team plan channel @mention workflow */
export interface FindingAssignee {
  /** Azure AD user principal name (e.g. jane@contoso.com) */
  upn: string;
  /** Display name for UI rendering */
  displayName: string;
  /** Azure AD object ID — used for Graph @mention entity */
  userId?: string;
}

// ============================================================================
// Finding Source (chart observation origin)
// ============================================================================

/** Where a chart observation originated */
export interface FindingSource {
  /** Which chart type the observation was made on */
  chart: 'boxplot' | 'pareto' | 'ichart';
  /** Category key (boxplot/pareto anchor) */
  category?: string;
  /** Percentage X position within chart area (0.0–1.0), I-Chart only */
  anchorX?: number;
  /** Percentage Y position within chart area (0.0–1.0), I-Chart only */
  anchorY?: number;
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
  stats?: { mean: number; median?: number; cpk?: number; samples: number };
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
  /** Optional classification tag (only meaningful when status is 'analyzed') */
  tag?: FindingTag;
  /** Timestamped investigation comments */
  comments: FindingComment[];
  /** When status was last changed */
  statusChangedAt: number;
  /** Chart observation origin — links finding to a specific chart element */
  source?: FindingSource;
  /** Optional assignee for Team plan @mention workflow */
  assignee?: FindingAssignee;
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
  stats?: { mean: number; median?: number; cpk?: number; samples: number },
  status?: FindingStatus,
  source?: FindingSource
): Finding {
  const finding: Finding = {
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
  if (source) finding.source = source;
  return finding;
}

/**
 * Create a PhotoAttachment with a unique ID and pending upload status
 */
export function createPhotoAttachment(filename: string): PhotoAttachment {
  return {
    id: generateId(),
    filename,
    uploadStatus: 'pending',
    capturedAt: Date.now(),
  };
}

/**
 * Create a timestamped comment with a unique ID
 */
export function createFindingComment(text: string, author?: string): FindingComment {
  const comment: FindingComment = {
    id: generateId(),
    text,
    createdAt: Date.now(),
  };
  if (author) comment.author = author;
  return comment;
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
    analyzed: [],
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

/**
 * Find an existing finding with matching chart source (same chart type + category).
 * Used for duplicate detection when adding chart observations.
 */
export function findDuplicateBySource(
  findings: Finding[],
  source: FindingSource
): Finding | undefined {
  return findings.find(f => {
    if (!f.source) return false;
    if (f.source.chart !== source.chart) return false;
    // Category-based charts (boxplot/pareto)
    if (source.category) return f.source.category === source.category;
    // I-Chart: no duplicate detection by position (each is unique)
    return false;
  });
}

// ============================================================================
// Migration
// ============================================================================

/**
 * Migrate a finding from the old 4-status model to the new 3-status model.
 * - 'confirmed' → 'analyzed' + tag 'key-driver'
 * - 'dismissed' → 'analyzed' + tag 'low-impact'
 * Other statuses pass through unchanged.
 */
export function migrateFindingStatus(finding: Finding): Finding {
  const status = finding.status as string;
  if (status === 'confirmed') {
    return { ...finding, status: 'analyzed', tag: finding.tag ?? 'key-driver' };
  }
  if (status === 'dismissed') {
    return { ...finding, status: 'analyzed', tag: finding.tag ?? 'low-impact' };
  }
  return finding;
}

/**
 * Migrate an array of findings from old status model to new.
 * Safe to call on already-migrated data.
 */
export function migrateFindings(findings: Finding[]): Finding[] {
  return findings.map(migrateFindingStatus);
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
