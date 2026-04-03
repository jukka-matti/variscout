/**
 * Findings domain types — data model for analyst-captured findings,
 * questions, improvement ideas, and investigation workflow.
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

/** Descriptions for finding statuses (used in tooltips and board column headers) */
export const FINDING_STATUS_DESCRIPTIONS: Record<FindingStatus, string> = {
  observed: 'Pattern spotted — not yet investigated.',
  investigating: 'Actively drilling into data and testing questions.',
  analyzed: 'Suspected cause identified — ready to plan improvements.',
  improving: 'Corrective actions in progress. Collect After data to verify.',
  resolved: 'Actions complete, outcome verified. Standardize or iterate.',
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

// ============================================================================
// Comment Attachment Types (non-image files: PDF, XLSX, CSV, TXT)
// ============================================================================

/**
 * A non-image file attached to a finding comment.
 * Images use the existing `PhotoAttachment` + `photos` field.
 * Team plan: uploaded to OneDrive under /VariScout/Attachments/.
 * Standard plan: stored as local filename reference only (no upload).
 */
export interface CommentAttachment {
  id: string;
  filename: string;
  /** MIME type of the file (e.g. 'application/pdf', 'text/csv') */
  mimeType: string;
  /** File size in bytes */
  sizeBytes: number;
  /** OneDrive drive item ID, set after successful upload (Team plan only) */
  driveItemId?: string;
  /** SharePoint web URL for the uploaded file (Team plan only) */
  webUrl?: string;
  uploadStatus: PhotoUploadStatus;
  /** Timestamp when the attachment was added */
  attachedAt: number;
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
  /** Non-image file attachments (PDF, XLSX, CSV, TXT). Team plan: OneDrive upload. Standard: local reference. */
  attachments?: CommentAttachment[];
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
  assignee?: FindingAssignee;
  dueDate?: string; // ISO date string (YYYY-MM-DD)
  completedAt?: number; // Date.now() timestamp
  createdAt: number;
  /** Link to the ImprovementIdea that spawned this action (for traceability) */
  ideaId?: string;
}

// ============================================================================
// Finding Outcome (effectiveness verification)
// ============================================================================

/** Outcome assessment after corrective actions are complete */
export interface FindingOutcome {
  effective: 'yes' | 'no' | 'partial';
  cpkBefore?: number;
  cpkAfter?: number;
  notes?: string;
  verifiedAt: number;
}

// ============================================================================
// Improvement Idea Types (creative bridge between suspected cause and actions)
// ============================================================================

/** Implementation timeframe for an improvement idea (replaces IdeaEffort) */
export type IdeaTimeframe = 'just-do' | 'days' | 'weeks' | 'months';

/** Impact level for an improvement idea (computed or manual) */
export type IdeaImpact = 'low' | 'medium' | 'high';

/** Cost category for an improvement idea */
export type IdeaCostCategory = 'none' | 'low' | 'medium' | 'high';

/** Cost — categorical quick estimate or precise euro amount */
export interface IdeaCost {
  category: IdeaCostCategory;
  /** Optional precise amount (enables budget fitting, ROI, continuous matrix positioning) */
  amount?: number;
  /** Currency code (default: 'EUR') */
  currency?: string;
}

/** Risk sub-axis level (1 = low, 2 = moderate, 3 = severe/immediate) */
export type RiskLevel = 1 | 2 | 3;

/** Risk assessment from 2-axis matrix (RDMAIC methodology) */
export interface IdeaRiskAssessment {
  axis1: RiskLevel;
  axis2: RiskLevel;
  computed: ComputedRiskLevel;
}

/** Computed risk level from 2-axis matrix */
export type ComputedRiskLevel = 'low' | 'medium' | 'high' | 'very-high';

/** Available risk axis presets */
export type RiskAxisPreset =
  | 'process'
  | 'safety'
  | 'environmental'
  | 'quality'
  | 'regulatory'
  | 'brand';

/** Risk axis configuration — which two presets are selected */
export interface RiskAxisConfig {
  axis1: RiskAxisPreset;
  axis2: RiskAxisPreset;
}

/** Default risk axis configuration */
export const DEFAULT_RISK_AXIS_CONFIG: RiskAxisConfig = {
  axis1: 'process',
  axis2: 'safety',
};

/** Budget configuration for improvement planning */
export interface BudgetConfig {
  totalBudget?: number;
  currency?: string;
}

/**
 * Compute risk level from two sub-axes using the 3×3 RDMAIC risk matrix.
 *
 * Matrix:
 *            axis2=1    axis2=2    axis2=3
 * axis1=3:   high       high       very-high
 * axis1=2:   medium     medium     high
 * axis1=1:   low        medium     high
 */
export function computeRiskLevel(axis1: RiskLevel, axis2: RiskLevel): ComputedRiskLevel {
  const matrix: Record<number, Record<number, ComputedRiskLevel>> = {
    3: { 1: 'high', 2: 'high', 3: 'very-high' },
    2: { 1: 'medium', 2: 'medium', 3: 'high' },
    1: { 1: 'low', 2: 'medium', 3: 'high' },
  };
  return matrix[axis1][axis2];
}

/**
 * An improvement idea attached to an answered/investigating question.
 * Bridges validated suspected cause and corrective actions.
 */
export interface ImprovementIdea {
  /** Unique identifier */
  id: string;
  /** Idea description (e.g., "Simplify setup with visual guides") */
  text: string;
  /** Implementation timeframe estimate */
  timeframe?: IdeaTimeframe;
  /** Cost estimate (categorical or precise) */
  cost?: IdeaCost;
  /** Risk assessment from 2-axis matrix */
  risk?: IdeaRiskAssessment;
  /** Manual impact fallback when no projection is available */
  impactOverride?: IdeaImpact;
  /** Optional What-If projection — when present, impact is auto-computed */
  projection?: FindingProjection;
  /** Whether this idea is selected as "the one(s) to try" */
  selected?: boolean;
  /** Analyst's rationale for selection or notes */
  notes?: string;
  /** Improvement direction: prevent, detect, simplify, or eliminate */
  direction?: IdeaDirection;
  /** Whether idea was generated by CoScout AI */
  aiGenerated?: boolean;
  /** Anonymous vote count from brainstorm session */
  voteCount?: number;
  /** @deprecated Use `direction` instead. Alias kept for migration. */
  category?: IdeaDirection;
  /** Timestamp of creation */
  createdAt: string;
}

/** Four Ideation Directions — replaces old CAPA categories */
export type IdeaDirection = 'prevent' | 'detect' | 'simplify' | 'eliminate';

/** @deprecated Use IdeaDirection instead */
export type IdeaCategory = IdeaDirection;

// ============================================================================
// Question Types (formerly "Hypothesis" — renamed per ADR-053 question-driven model)
// ============================================================================

/** Investigation question status */
export type QuestionStatus = 'open' | 'investigating' | 'answered' | 'ruled-out';

/** Ordered list of question statuses */
export const QUESTION_STATUSES: QuestionStatus[] = [
  'open',
  'investigating',
  'answered',
  'ruled-out',
];

/** Human-readable labels for question statuses */
export const QUESTION_STATUS_LABELS: Record<QuestionStatus, string> = {
  open: 'Open',
  investigating: 'Investigating',
  answered: 'Answered',
  'ruled-out': 'Ruled out',
};

/** Validation type for question evidence gathering */
export type QuestionValidationType = 'data' | 'gemba' | 'expert';

/**
 * An investigation question — a testable claim about a factor's role in variation.
 *
 * In the question-driven model (ADR-053), questions are generated from Factor Intelligence
 * and form a tree structure. The analyst investigates by linking findings as evidence.
 * Supports tree structure via parentId for sub-questions.
 */
export interface Question {
  /** Unique identifier */
  id: string;
  /** Question text (e.g., "Does shift affect fill weight?") */
  text: string;
  /** Linked factor column name */
  factor?: string;
  /** Specific factor level (e.g., "Night") */
  level?: string;
  /** Investigation status */
  status: QuestionStatus;
  /** IDs of findings that link to this question */
  linkedFindingIds: string[];
  /** Timestamp of creation */
  createdAt: string;
  /** Timestamp of last update */
  updatedAt: string;

  // --- Tree structure (sub-questions) ---
  /** Parent question ID — enables tree (sub-questions). Undefined for root questions. */
  parentId?: string;
  /** How this question is validated: data (auto η²), gemba (go-and-see), or expert opinion */
  validationType?: QuestionValidationType;
  /** Task description for gemba/expert validation */
  validationTask?: string;
  /** Whether the gemba/expert task has been completed */
  taskCompleted?: boolean;
  /** Analyst's note when manually setting status (gemba/expert validation) */
  manualNote?: string;
  /** Improvement ideas for answered/investigating questions */
  ideas?: ImprovementIdea[];
  /** Role in investigation conclusion — multiple 'suspected-cause' allowed per tree */
  causeRole?: 'suspected-cause' | 'contributing' | 'ruled-out';
  /** Source of this question: how it was generated */
  questionSource?: 'factor-intel' | 'heuristic' | 'coscout' | 'analyst';
  /** Statistical evidence for auto-answered questions */
  evidence?: {
    rSquaredAdj?: number;
    etaSquared?: number;
  };
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
  | { chart: 'ichart'; anchorX: number; anchorY: number }
  | { chart: 'probability'; anchorX: number; anchorY: number; seriesKey?: string }
  | { chart: 'yamazumi'; category: string; activityType?: string }
  | { chart: 'coscout'; messageId: string };

// ============================================================================
// Finding Types
// ============================================================================

/**
 * Snapshot of the dashboard state when a finding was captured
 */
export interface FindingContext {
  /** Active filters at time of capture: factor → selected values */
  activeFilters: Record<string, (string | number)[]>;
  /** Cumulative variation % in focus (0–100), or null if no filters */
  cumulativeScope: number | null;
  /** Key statistics at time of capture */
  stats?: { mean: number; median?: number; cpk?: number; samples: number };
}

/** Finding role: observation (default) or benchmark (best-of-best target) */
export type FindingRole = 'observation' | 'benchmark';

/** Stats snapshot for benchmark findings */
export interface BenchmarkStats {
  mean: number;
  stdDev: number;
  cpk?: number;
  count: number;
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
  /** Link to a question (replaces deprecated suspectedCause) */
  questionId?: string;
  /** How this finding relates to its linked question */
  validationStatus?: 'supports' | 'contradicts' | 'inconclusive';
  /** What-If projection attached to this finding */
  projection?: FindingProjection;
  /** Corrective/preventive action items */
  actions?: ActionItem[];
  /** Outcome assessment after actions complete */
  outcome?: FindingOutcome;
  /** Finding role: observation (default) or benchmark (Phase 3) */
  role?: FindingRole;
  /** Benchmark stats snapshot (only for benchmark findings) */
  benchmarkStats?: BenchmarkStats;
  /** Explicit scope override: true=forced in, false=forced out, undefined=auto from status */
  scoped?: boolean;
  /** Whether this finding's text annotation should be visible on the chart. Default: undefined (shown for backward compat). */
  showOnChart?: boolean;
}

// ============================================================================
// Investigation Categories (dynamic, user-defined factor grouping)
// ============================================================================

/**
 * A user-defined investigation category that groups factor columns.
 *
 * Three-level investigation tree: Category → Factor → Question
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
