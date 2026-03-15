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
export type FindingStatus = 'observed' | 'investigating' | 'analyzed' | 'improving' | 'resolved';

/** Ordered list of all finding statuses */
export const FINDING_STATUSES: FindingStatus[] = [
  'observed',
  'investigating',
  'analyzed',
  'improving',
  'resolved',
];

/** Human-readable labels for finding statuses */
export const FINDING_STATUS_LABELS: Record<FindingStatus, string> = {
  observed: 'Observed',
  investigating: 'Investigating',
  analyzed: 'Analyzed',
  improving: 'Improving',
  resolved: 'Resolved',
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

/** Statuses available in PWA (free tier) — hides improving/resolved */
export const PWA_STATUSES: FindingStatus[] = ['observed', 'investigating', 'analyzed'];

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
// Action Items (investigation tasks)
// ============================================================================

/** A corrective/preventive action task within a finding */
export interface ActionItem {
  id: string;
  text: string;
  assignee?: string;
  dueDate?: string; // ISO date string (YYYY-MM-DD)
  completedAt?: number; // Date.now() timestamp
  createdAt: number;
}

// ============================================================================
// Finding Outcome (effectiveness verification)
// ============================================================================

/** Outcome assessment after corrective actions are complete */
export interface FindingOutcome {
  effective: 'yes' | 'no' | 'partial';
  cpkAfter?: number;
  notes?: string;
  verifiedAt: number;
}

// ============================================================================
// Improvement Idea Types (IDEOI — creative bridge between root cause and actions)
// ============================================================================

/** Effort level for an improvement idea (manual human judgment) */
export type IdeaEffort = 'low' | 'medium' | 'high';

/** Impact level for an improvement idea (computed or manual) */
export type IdeaImpact = 'low' | 'medium' | 'high';

/**
 * An improvement idea attached to a supported/partial hypothesis.
 * Bridges validated root cause (ANALYSOI) and corrective actions (KOKEILE).
 */
export interface ImprovementIdea {
  /** Unique identifier */
  id: string;
  /** Idea description (e.g., "Simplify setup with visual guides") */
  text: string;
  /** Manual effort estimate — human judgment */
  effort?: IdeaEffort;
  /** Manual impact fallback when no projection is available */
  impactOverride?: IdeaImpact;
  /** Optional What-If projection — when present, impact is auto-computed */
  projection?: FindingProjection;
  /** Whether this idea is selected as "the one(s) to try" */
  selected?: boolean;
  /** Analyst's rationale for selection or notes */
  notes?: string;
  /** Timestamp of creation */
  createdAt: string;
}

// ============================================================================
// Hypothesis Types
// ============================================================================

/** Status of a hypothesis based on evidence */
export type HypothesisStatus = 'untested' | 'supported' | 'contradicted' | 'partial';

/** Ordered list of hypothesis statuses */
export const HYPOTHESIS_STATUSES: HypothesisStatus[] = [
  'untested',
  'supported',
  'contradicted',
  'partial',
];

/** Human-readable labels for hypothesis statuses */
export const HYPOTHESIS_STATUS_LABELS: Record<HypothesisStatus, string> = {
  untested: 'Untested',
  supported: 'Supported',
  contradicted: 'Contradicted',
  partial: 'Partial',
};

/** Validation type for hypothesis evidence gathering */
export type HypothesisValidationType = 'data' | 'gemba' | 'expert';

/**
 * A causal hypothesis — a shared theory that multiple findings can reference.
 * Supports tree structure via parentId for sub-hypothesis investigation.
 */
export interface Hypothesis {
  /** Unique identifier */
  id: string;
  /** Hypothesis text (e.g., "New operators lack system training") */
  text: string;
  /** Linked factor column name */
  factor?: string;
  /** Specific factor level (e.g., "Night") */
  level?: string;
  /** Validation status based on evidence */
  status: HypothesisStatus;
  /** IDs of findings that link to this hypothesis */
  linkedFindingIds: string[];
  /** Timestamp of creation */
  createdAt: string;
  /** Timestamp of last update */
  updatedAt: string;

  // --- Tree structure (sub-hypotheses) ---
  /** Parent hypothesis ID — enables tree (sub-hypotheses). Undefined for root hypotheses. */
  parentId?: string;
  /** How this hypothesis is validated: data (auto η²), gemba (go-and-see), or expert opinion */
  validationType?: HypothesisValidationType;
  /** Task description for gemba/expert validation */
  validationTask?: string;
  /** Whether the gemba/expert task has been completed */
  taskCompleted?: boolean;
  /** Analyst's note when manually setting status (gemba/expert validation) */
  manualNote?: string;
  /** Improvement ideas — IDEOI output for supported/partial hypotheses */
  ideas?: ImprovementIdea[];
}

// ============================================================================
// Finding Projection Types
// ============================================================================

/**
 * A What-If projection attached to a finding.
 * Captures baseline and projected stats for improvement tracking.
 */
export interface FindingProjection {
  /** Baseline mean at projection time */
  baselineMean: number;
  /** Baseline sigma at projection time */
  baselineSigma: number;
  /** Baseline Cpk (only if specs exist) */
  baselineCpk?: number;
  /** Baseline yield percentage */
  baselineYield?: number;
  /** Baseline pass rate percentage */
  baselinePassRate?: number;

  /** Projected mean after improvement */
  projectedMean: number;
  /** Projected sigma after improvement */
  projectedSigma: number;
  /** Projected Cpk */
  projectedCpk?: number;
  /** Projected yield percentage */
  projectedYield?: number;
  /** Projected pass rate percentage */
  projectedPassRate?: number;

  /** Mean delta (projected - baseline) */
  meanDelta: number;
  /** Sigma delta (projected - baseline) */
  sigmaDelta: number;

  /** Contribution to improvement target (0.0-1.0) */
  targetContribution?: number;

  /** What-If simulation parameters used */
  simulationParams: {
    meanAdjustment: number;
    variationReduction: number; // 0-100%
    presetUsed?: string; // e.g., "match-best", "reach-target"
  };

  /** Timestamp of projection creation */
  createdAt: string;
}

// ============================================================================
// Finding Source (chart observation origin)
// ============================================================================

/** Where a chart observation originated — discriminated union by chart type */
export type FindingSource =
  | { chart: 'boxplot' | 'pareto'; category: string }
  | { chart: 'ichart'; anchorX: number; anchorY: number };

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
  /** Link to a hypothesis (replaces deprecated suspectedCause) */
  hypothesisId?: string;
  /** How this finding relates to its linked hypothesis */
  validationStatus?: 'supports' | 'contradicts' | 'inconclusive';
  /** What-If projection attached to this finding */
  projection?: FindingProjection;
  /** Corrective/preventive action items */
  actions?: ActionItem[];
  /** Outcome assessment after actions complete */
  outcome?: FindingOutcome;
}

// ============================================================================
// Investigation Categories (dynamic, user-defined factor grouping)
// ============================================================================

/**
 * A user-defined investigation category that groups factor columns.
 *
 * Three-level investigation tree: Category → Factor → Hypothesis
 */
export interface InvestigationCategory {
  id: string;
  /** User-defined name: "Equipment", "Drying Method", "Staff", etc. */
  name: string;
  /** Which factor columns belong to this category */
  factorNames: string[];
  /** Badge color — auto-assigned from palette or user-picked */
  color?: string;
  /** Keyword that triggered inference, if any (for tooltip display) */
  inferredFrom?: string;
}

/**
 * Color palette for auto-assigning category badge colors.
 * Cycles through 8 distinct colors for visual differentiation.
 */
export const CATEGORY_COLORS = [
  '#3b82f6', // blue
  '#a855f7', // purple
  '#22c55e', // green
  '#f59e0b', // amber
  '#06b6d4', // cyan
  '#ef4444', // red
  '#ec4899', // pink
  '#64748b', // slate
] as const;

/**
 * Create a new InvestigationCategory with a unique ID and auto-assigned color.
 */
export function createInvestigationCategory(
  name: string,
  factorNames: string[],
  existingCount: number = 0,
  inferredFrom?: string
): InvestigationCategory {
  const category: InvestigationCategory = {
    id: generateId(),
    name,
    factorNames,
    color: CATEGORY_COLORS[existingCount % CATEGORY_COLORS.length],
  };
  if (inferredFrom) category.inferredFrom = inferredFrom;
  return category;
}

/**
 * Get the category that a factor belongs to, or undefined if uncategorized.
 */
export function getCategoryForFactor(
  categories: InvestigationCategory[],
  factorName: string
): InvestigationCategory | undefined {
  return categories.find(c => c.factorNames.includes(factorName));
}

// ============================================================================
// Factory Functions
// ============================================================================

/** Generate a unique ID */
export function generateId(): string {
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `f-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Create a new Hypothesis with a unique ID
 */
export function createHypothesis(
  text: string,
  factor?: string,
  level?: string,
  parentId?: string,
  validationType?: HypothesisValidationType
): Hypothesis {
  const now = new Date().toISOString();
  return {
    id: generateId(),
    text,
    factor,
    level,
    status: 'untested',
    linkedFindingIds: [],
    createdAt: now,
    updatedAt: now,
    parentId,
    validationType,
  };
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

/**
 * Create a new ActionItem with a unique ID
 */
export function createActionItem(text: string, assignee?: string, dueDate?: string): ActionItem {
  return {
    id: generateId(),
    text,
    assignee,
    dueDate,
    createdAt: Date.now(),
  };
}

/**
 * Create a FindingOutcome
 */
export function createFindingOutcome(
  effective: 'yes' | 'no' | 'partial',
  notes?: string,
  cpkAfter?: number
): FindingOutcome {
  return {
    effective,
    notes,
    cpkAfter,
    verifiedAt: Date.now(),
  };
}

/**
 * Create a new ImprovementIdea with a unique ID
 */
export function createImprovementIdea(text: string): ImprovementIdea {
  return {
    id: generateId(),
    text,
    createdAt: new Date().toISOString(),
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
    analyzed: [],
    improving: [],
    resolved: [],
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
    if (source.chart !== 'ichart') {
      return f.source.chart !== 'ichart' && f.source.category === source.category;
    }
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
 * Normalize a legacy flat FindingSource to the discriminated union shape.
 * Safe to call on already-migrated data.
 */
function migrateSource(source: FindingSource | undefined): FindingSource | undefined {
  if (!source) return undefined;
  if (source.chart === 'ichart') {
    // Ensure ichart shape has required anchorX/anchorY
    const s = source as Record<string, unknown>;
    return {
      chart: 'ichart',
      anchorX: (s.anchorX as number) ?? 0,
      anchorY: (s.anchorY as number) ?? 0,
    };
  }
  // Ensure boxplot/pareto shape has required category
  const s = source as Record<string, unknown>;
  return { chart: source.chart, category: (s.category as string) ?? '' };
}

/**
 * Migrate an array of findings from old status model to new.
 * Also normalizes FindingSource to discriminated union shape.
 * Safe to call on already-migrated data.
 */
export function migrateFindings(findings: Finding[]): Finding[] {
  return findings.map(f => {
    const migrated = migrateFindingStatus(f);
    const source = migrateSource(migrated.source);
    return source !== migrated.source ? { ...migrated, source } : migrated;
  });
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
