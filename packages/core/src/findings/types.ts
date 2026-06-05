/**
 * Findings domain types — data model for analyst-captured findings,
 * hypotheses, problem-statement scopes, improvement ideas, and investigation workflow.
 */

import type { HypothesisCondition, ConditionLeaf } from './hypothesisCondition';
import type { TimelineWindow } from '../timeline';
import type { TimeLens } from '../stats/timeLens';
import type { EntityBase } from '../identity';
import type { ProcessParticipantRef } from '../processHub';
import type { ImprovementProject } from '../improvementProject';
import type { ProcessMapTributary } from '../frame/types';

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
export interface PhotoAttachment extends EntityBase {
  filename: string;
  /** OneDrive file ID, set after successful upload */
  driveItemId?: string;
  /** Base64 data URL thumbnail (~50KB), persisted in .vrs for offline viewing */
  thumbnailDataUrl?: string;
  uploadStatus: PhotoUploadStatus;
  /** Timestamp when the photo was captured (Date.now()). Distinct from createdAt (EntityBase). */
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
export interface CommentAttachment extends EntityBase {
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
  /** Timestamp when the attachment was added. Distinct from createdAt (EntityBase). */
  attachedAt: number;
}

/** A timestamped comment in a finding's investigation log */
export interface FindingComment extends EntityBase {
  text: string;
  /** Author display name (from EasyAuth or Teams user context). Optional for backward compat. */
  author?: string;
  /**
   * Explicit parent entity this comment belongs to. Required for normalized storage.
   * Polymorphic: a comment can belong to a Finding or a Hypothesis.
   */
  parentId: Finding['id'] | Hypothesis['id'];
  /** Discriminator for parentId — which entity type owns this comment. */
  parentKind: 'finding' | 'hypothesis';
  /** Photo attachments (Team plan only) */
  photos?: PhotoAttachment[];
  /** Non-image file attachments (PDF, XLSX, CSV, TXT). Team plan: OneDrive upload. Standard: local reference. */
  attachments?: CommentAttachment[];
  /**
   * Resolved userId strings for @-tagged members in this comment.
   * Populated by parseMentions(text, members) at the call site (composer or store action).
   * Absent/empty for comments with no @mentions (backward compatible).
   */
  mentionedUserIds?: string[];
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
export type ActionItemStatus = 'open' | 'in-progress' | 'done';

export interface ActionItemQuickActionFields {
  stepId: string;
  parentImprovementIdeaId: null | ImprovementIdea['id'];
  parentImprovementProjectId: null | string;
  assignedTo: null | ProcessParticipantRef;
  dueAt: null | string;
  status: ActionItemStatus;
  doneAt: null | string;
  doneBy: null | ProcessParticipantRef;
  createdBy: ProcessParticipantRef;
}

export interface ActionItem extends EntityBase {
  text: string;
  assignee?: FindingAssignee;
  dueDate?: string; // ISO date string (YYYY-MM-DD)
  completedAt?: number; // Date.now() timestamp — soft-completion; distinct from deletedAt
  /** Link to the ImprovementIdea that spawned this action (for traceability) */
  ideaId?: ImprovementIdea['id'];
  /** Canvas step FK for Quick Action / response-path actions. */
  stepId?: string;
  parentImprovementIdeaId?: null | ImprovementIdea['id'];
  parentImprovementProjectId?: null | string;
  assignedTo?: null | ProcessParticipantRef;
  dueAt?: null | string;
  status?: ActionItemStatus;
  doneAt?: null | string;
  doneBy?: null | ProcessParticipantRef;
  createdBy?: ProcessParticipantRef;
  /** Optional last-edit timestamp used by synthesized V1 activity feed events. */
  updatedAt?: number;
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
// Improvement Idea Types (creative bridge between hypothesis and actions)
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
 * Bridges validated hypothesis and corrective actions.
 */
export interface ImprovementIdea extends EntityBase {
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
  /** Optional last-edit timestamp used by synthesized V1 activity feed events. */
  updatedAt?: number;
}

/** Four Ideation Directions — replaces old CAPA categories */
export type IdeaDirection = 'prevent' | 'detect' | 'simplify' | 'eliminate';

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

  /** Model context when projection is informed by regression (optional, backward compatible) */
  modelContext?: FindingProjectionModelContext;
}

/**
 * Context from the regression model that informed a projection.
 * Captures the analyst's estimation rationale and model quality.
 */
export interface FindingProjectionModelContext {
  /** Factor this projection targets (from the idea's linked question) */
  linkedFactor?: string;
  /** Analyst's estimate of how much of the factor gap this idea closes (0-1) */
  gapClosure?: number;
  /** Model-derived gap for the linked factor (in outcome units) */
  factorGap?: number;
  /** R² adjusted of the model used */
  rSquaredAdj?: number;
  /** Label of the model scope used (e.g., 'All data' or 'Machine=B') */
  scopeLabel?: string;
  /** Model-predicted optimum Cpk (ceiling from regression) */
  modelOptimumCpk?: number;
}

// ============================================================================
// Finding Source (chart observation origin)
// ============================================================================

/** Where a chart observation originated — discriminated union by chart type.
 *  `timeLens` carries the global time lens that was active when the finding
 *  was recorded so it can be restored on replay. Required for all new findings.
 */
export type FindingSource =
  | { chart: 'boxplot' | 'pareto'; category: string; timeLens: TimeLens }
  | {
      chart: 'ichart';
      anchorX: number;
      anchorY: number;
      timeLens: TimeLens;
      /** Index range when this finding came from a brush gesture on a mini-chart. */
      brushedRange?: { startIdx: number; endIdx: number };
    }
  | {
      chart: 'probability';
      anchorX: number;
      anchorY: number;
      seriesKey?: string;
      timeLens: TimeLens;
    }
  | { chart: 'coscout'; messageId: string; timeLens: TimeLens };

// ============================================================================
// Window Context (multi-level SCOUT V1 — drift detection)
// ============================================================================

/**
 * Snapshot of the timeline window and key stats at the moment a Finding was created.
 * Used by `computeFindingWindowDrift` to detect when current-window stats diverge
 * from the context in which the finding was made.
 */
export interface WindowContext {
  /** The active timeline window when the finding was created */
  windowAtCreation: TimelineWindow;
  /** Key stats captured at creation time */
  statsAtCreation: { cpk?: number; mean?: number; sigma?: number; n: number };
  /** Override the default drift threshold (0.20). Useful for high-stakes findings. */
  driftThreshold?: number;
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
  /** Cumulative variation % in focus (0–100), or null if no filters */
  cumulativeScope: number | null;
  /** Key statistics at time of capture */
  stats?: { mean: number; median?: number; cpk?: number; samples: number };
}

/** Finding role: observation (default) or benchmark (best-of-best target) */
export type FindingRole = 'observation' | 'benchmark';

/**
 * Evidence-type tag on a Finding. Mirrors `CausalLink.evidenceType` minus
 * `'unvalidated'` — by the time something is captured as a Finding it has been
 * categorised as one of three observable kinds. Used by Survey rules to detect
 * triangulation across multiple evidence types (spec §5 category 2 + §6 row 3).
 */
export type FindingEvidenceType = 'data' | 'gemba' | 'expert';

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
export interface Finding extends EntityBase {
  /** Analyst's note describing the finding */
  text: string;
  /** Dashboard state snapshot */
  context: FindingContext;
  /**
   * Evidence-type tag — required so Survey rules can triangulate across
   * `'data' | 'gemba' | 'expert'` without re-classifying each finding.
   * Defaults to `'data'` at the factory (existing chart-sourced findings).
   */
  evidenceType: FindingEvidenceType;
  /**
   * Explicit refutation flag used by Survey rules. Distinct from
   * `validationStatus` (which is a 3-way analyst note); this is an intent-explicit
   * boolean so the deriveHypothesisStatus rule can short-circuit on `refutes=true`.
   * Absence/`false` means supports or inconclusive.
   */
  refutes?: boolean;
  /** Investigation status */
  status: FindingStatus;
  /** Optional classification tag (only meaningful when status is 'analyzed') */
  tag?: FindingTag;
  /** Timestamped investigation comments */
  comments: FindingComment[];
  /** When status was last changed */
  statusChangedAt: number;
  /** Durable FK to the ProblemStatementScope this finding was captured within; undefined for findings not tied to a drill scope. */
  scopeId?: ProblemStatementScope['id'];
  /**
   * PR-CS-5 Part 2: the ProcessMap step this finding was captured from (the
   * Canvas "capture from step" affordance). Top-level FK parallel to
   * `ActionItem.stepId` / `MeasurementPlan.processLocation` — NOT a FindingSource
   * variant (FindingSource is chart-observation-only). Undefined for chart-captured
   * findings, which still surface on their column-derived step.
   *
   * Durability caveat: `stepId` is a ProcessMap node id (`step-${slug}-${seq}`),
   * not durable across process-map re-derivation. Best-effort for V1.
   */
  originStepId?: string;
  /** Chart observation origin — links finding to a specific chart element */
  source?: FindingSource;
  /** Optional assignee for Team plan @mention workflow */
  assignee?: FindingAssignee;
  /**
   * How this finding relates to the hypothesis branch it is attached to.
   * Drives the Investigation Wall's supporting / counter / not-tested clue split
   * (see `projectMechanismBranch`). Not a `Question` FK — retained after ADR-085
   * dropped the `Question` entity.
   */
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
  /** Timeline window + stats snapshot at creation time. Used for drift detection (V1 multi-level SCOUT). Absent for findings created before V1. */
  windowContext?: WindowContext;
}

// ============================================================================
// Investigation Categories (dynamic, user-defined factor grouping)
// ============================================================================

/**
 * A user-defined investigation category that groups factor columns.
 *
 * Two-level grouping: Category → Factor
 */
export interface AnalyzeCategory extends EntityBase {
  /** User-defined name: "Equipment", "Drying Method", "Staff", etc. */
  name: string;
  /** Which factor columns belong to this category (column-name strings, not entity FKs) */
  factorNames: string[];
  /** Badge color — auto-assigned from palette or user-picked */
  color?: string;
  /** Keyword that triggered inference, if any (for tooltip display) */
  inferredFrom?: string;
}

// ============================================================================
// Unified Projection Model
// ============================================================================

/** Source of a projection scenario — what mechanism is being addressed */
export type ProjectionSource =
  | { type: 'drill'; factors: string[]; levels: string[] }
  | { type: 'hypothesis'; hypothesisId: string; factors: string[] }
  | { type: 'centering' }
  | { type: 'idea'; ideaId: string }
  | { type: 'measured'; stageIndex: number };

/** Method for computing the projection adjustment */
export type ProjectionMethod =
  | { type: 'match-best' }
  | { type: 'target'; target: number }
  | { type: 'eliminate-waste' }
  | { type: 'direct'; meanShift: number; variationReduction: number }
  | { type: 'actual' };

/** Statistical domain projection result */
export interface StatisticalProjectionResult {
  currentMean: number;
  currentSigma: number;
  currentCpk?: number;
  currentYield?: number;
  projectedMean: number;
  projectedSigma: number;
  projectedCpk?: number;
  projectedYield?: number;
}

/** Unified projection result — domain-specific */
export interface ProjectionResult {
  domain: 'statistical';
  statistical?: StatisticalProjectionResult;
  overallImpact?: {
    projectedMean?: number;
    projectedSigma?: number;
    projectedCpk?: number;
  };
}

/** Unified projection scenario */
export interface ProjectionScenario {
  source: ProjectionSource;
  method: ProjectionMethod;
  result: ProjectionResult;
}

// ============================================================================
// Hypothesis Evidence
// ============================================================================

/** Mode-aware evidence on a hypothesis */
export interface HypothesisEvidence {
  /** Mode active when evidence was computed */
  mode: 'standard' | 'capability' | 'performance';
  /** How much of the problem this mechanism explains */
  contribution: {
    /** Numeric value: R²adj (0-1), Cpk delta, channel Cpk */
    value: number;
    /** From strategy: 'R²adj', 'Waste %', 'Cpk impact', 'Channel Cpk' */
    label: string;
    /** Human-readable: "Explains 52% of variation" */
    description: string;
  };
}

// ============================================================================
// Hypothesis (Investigation Reframing)
// ============================================================================

/**
 * Canonical hypothesis lifecycle status.
 *
 * - `proposed` — named mechanism, no evidence yet.
 * - `evidenced` — has supporting evidence but not yet challenged.
 * - `evidence-survived-test` — ≥2 distinct evidence types AND ≥1 survived
 *   disconfirmation. Falsification can only fail to break a hypothesis, never
 *   confirm it, so this state asserts "evidence survived a test", not certainty.
 * - `refuted` — a disconfirmation attempt overturned the hypothesis.
 * - `needs-disconfirmation` — has evidence but no falsification attempt recorded.
 */
export type HypothesisStatus =
  | 'proposed'
  | 'evidenced'
  | 'evidence-survived-test'
  | 'refuted'
  | 'needs-disconfirmation';

/**
 * A recorded falsification attempt against a hypothesis. Used by the Survey
 * confirm-gate rule (spec §5 category 1) to distinguish hypotheses that have
 * accumulated evidence but never been challenged from those that have survived
 * deliberate disconfirmation.
 */
export interface DisconfirmationAttempt {
  id: string;
  /** ISO 8601 timestamp the attempt was recorded. */
  attemptedAt: string;
  attemptedBy: ProcessParticipantRef;
  /** What falsification test was run (gemba check, alternative-cause analysis, etc.). */
  description: string;
  /**
   * `pending` — attempt scheduled / in flight; rule treats hypothesis as
   *   "needs-disconfirmation" still.
   * `survived` — attempt failed to refute; the hypothesis is strengthened
   *   (Survey rule promotes status to `evidence-survived-test` when triangulated).
   * `refuted` — attempt overturned the hypothesis.
   */
  verdict: 'pending' | 'survived' | 'refuted';
  /** Findings that the attempt produced (positive or negative evidence). */
  linkedFindingIds: Finding['id'][];
}

/**
 * A hypothesis — a named mechanism that connects multiple evidence
 * threads (findings) into one coherent story.
 *
 * This is the primary output of the Investigation Diamond. Each hypothesis drives
 * one HMW brainstorm session in the IMPROVE phase.
 *
 * See: docs/superpowers/specs/2026-04-03-investigation-workspace-reframing-design.md
 */
export interface Hypothesis extends EntityBase {
  /** Analyst-chosen name: "Nozzle wear on night shift" */
  name: string;
  /** Analyst's synthesis: how the evidence connects */
  synthesis: string;
  /** Connected finding IDs */
  findingIds: Finding['id'][];
  /** IDs of MeasurementPlans designed to gather evidence for this hypothesis. Parallel to findingIds.
   * Uses `string` instead of `MeasurementPlan['id']` to avoid a circular import
   * (measurementPlan/types.ts already imports Hypothesis from this file). */
  measurementPlanIds?: string[];
  /** Updated timestamp (Unix ms) */
  updatedAt: number;
  /** Mode-aware evidence — contribution stored, projection computed live */
  evidence?: HypothesisEvidence;
  /** Whether this hypothesis is selected for the current improvement round */
  selectedForImprovement?: boolean;
  /** Canonical hypothesis status. */
  status: HypothesisStatus;
  /** Theme tags for grouping related hypotheses. */
  themeTags?: string[];
  /** Branch-level next move. Investigation-level `ProcessContext.nextMove` remains separate. */
  nextMove?: string;
  /** Explicit finding IDs that should render as counter-clues for this branch. */
  counterFindingIds?: Finding['id'][];
  /** Predicate tree used by the Investigation Wall to evaluate HOLDS X/Y.
   * Auto-derived from the first finding's `findingSource` on creation; analyst-editable.
   * Absent for hubs created before Wall ships. */
  condition?: HypothesisCondition;
  /** Explicit ProcessMap binding. Falls back to column-matching derivation via
   * findings' columns when absent. */
  tributaryIds?: ProcessMapTributary['id'][];
  /** Signal Cards that this branch relies on for measurement or factor evidence.
   * Left as string[] — signal cards are not yet entities. */
  signalCardIds?: string[];
  /** Timestamped hypothesis-level team discussion. Same shape as FindingComment. */
  comments?: FindingComment[];
  /**
   * ActionItem tasks assigned to this hypothesis (Task 3).
   * Reuses the same `ActionItem` shape as `Finding.actions` + canvas steps.
   * Distinct from `MeasurementPlan` (no primaryFactor/method).
   */
  actions?: ActionItem[];
  /**
   * Recorded falsification attempts. Empty/absent + ≥2 evidence types triggers
   * the Survey confirm-gate rule (status auto-derives to `needs-disconfirmation`).
   * See `hypothesisEvidence.hasUnresolvedDisconfirmation`.
   */
  disconfirmationAttempts?: DisconfirmationAttempt[];
  /**
   * Improvement ideas that address this suspected cause (ADR-085 F2). Re-homed
   * from the retired `Question` entity — ideas belong to the mechanism they fix,
   * not to an investigation prompt.
   */
  ideas?: ImprovementIdea[];
  /**
   * FE-2b — the "superseded by →" anti-amnesia trail (spec §4.2). Set on a REFUTED
   * hub when its refute→respawn-sharper gesture creates a sharper replacement (H2),
   * pointing the red dead-end at its successor. The refuted hub stays red + never
   * archived; the card renders a small "superseded by → [H2 name]" text reference
   * so an analyst doesn't re-walk the dead end. Absent for hubs never superseded.
   */
  supersededByHypothesisId?: Hypothesis['id'];
}

// ============================================================================
// Causal Link (Investigation DAG)
// ============================================================================

/** Directed causal relationship between factors in the investigation DAG */
export interface CausalLink extends EntityBase {
  fromFactor: string; // Factor column name (e.g., "Shift")
  toFactor: string; // Factor column name (e.g., "Fill Head")
  fromLevel?: string; // Specific condition (e.g., "Night")
  toLevel?: string; // Specific condition (e.g., "Heads 5-8")
  whyStatement: string; // "Night shift runs cause thermal drift"
  direction: 'drives' | 'modulates' | 'confounds';
  evidenceType: 'data' | 'gemba' | 'expert' | 'unvalidated';
  findingIds: Finding['id'][]; // Findings supporting this link
  /** The Hypothesis this link belongs to. */
  hypothesisId?: Hypothesis['id'];
  strength?: number; // ΔR² or computed from R²adj comparison
  relationshipType?: 'independent' | 'overlapping' | 'synergistic' | 'interactive' | 'redundant';
  source: 'analyst' | 'coscout' | 'auto';
  /** Updated timestamp (Unix ms) */
  updatedAt: number;
}

export type CausalDirection = CausalLink['direction'];
export type CausalEvidenceType = CausalLink['evidenceType'];
export type CausalSource = CausalLink['source'];

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

// ============================================================================
// Investigation Wall — Contribution Tree
// ============================================================================

/**
 * Composition tree for the Investigation Wall. Leaves reference `Hypothesis`
 * hubs; branches compose them with boolean gates (AND / OR / NOT). Persisted on
 * `analyzeStore.problemContributionTree` so team-authored contribution stories
 * survive reload. Terminology: "contribution tree", never "root cause" (P5 amended).
 */
export type GateNode =
  | { kind: 'hub'; hubId: string }
  | { kind: 'and' | 'or'; children: GateNode[] }
  | { kind: 'not'; child: GateNode };

// ============================================================================
// Problem-Statement Scope (ADR-085 — the WHERE, first-class)
// ============================================================================

/**
 * The first-class WHERE of an investigation (ADR-085): an outcome (Y) sharpened
 * by a flat AND of `{factor=level}` drill predicates, with the many suspected
 * causes nested per-scope via `hypothesisIds`.
 *
 * WHERE (this scope) and WHY (the causes nested within it) stay strictly
 * separate — a scope is not a mechanism. `predicates` reuse the
 * `hypothesisCondition` leaf shape (`eq/in/...`); the cause's own disconfirmable
 * claim lives on `Hypothesis.condition`, never re-asserting the scope.
 */
export interface ProblemStatementScope extends EntityBase {
  /** FK to the owning ImprovementProject (PO-7 rename of investigationId). May carry the quick-analysis sentinel 'general-unassigned' when no project is active. */
  projectId: ImprovementProject['id'];
  /** The Y this scope sharpens. */
  outcome: string;
  /** The `{factor=level}` WHERE — a flat AND of drill-chip leaves. */
  predicates: ConditionLeaf[];
  /** The MANY suspected causes nested within this scope (the WHY). */
  hypothesisIds: Hypothesis['id'][];
  /**
   * Per-scope contribution tree (re-homed from `analyzeStore.problemContributionTree`).
   * Leaves reference `Hypothesis` hubs; branches compose with boolean gates.
   * Terminology: "contribution tree", never "root cause" (P5 amended).
   */
  gateNode?: GateNode;
  /**
   * Optional 'if-fixed' overall impact projection. Field only — the computation
   * lands in IM-5.
   */
  whatIfProjection?: number;
  /** Updated timestamp (Unix ms). */
  updatedAt: number;
}

// ============================================================================
// Analysis Brief (Stage 5 modal — investigation entry context)
// ============================================================================

/**
 * Investigation-level brief captured by Stage 5 modal (and historically by ColumnMapping).
 * Per D7 (slice 3): stays as a flat shape; "Open investigation →" lands on the canvas
 * with an active investigation; "Skip" lands with none.
 *
 * `target.metric` aligns with the existing `TargetMetric` type from the UI package; this
 * file owns the canonical definition now.
 */
export type AnalysisBriefTargetMetric = 'mean' | 'cpk' | 'defectRate' | 'cycleTime' | string;

export interface AnalysisBrief {
  /** What is being investigated (max 500 chars) */
  issueStatement?: string;
  /**
   * Optional draft hypothesis text entered at Stage 5.
   * Stored as-is; consumer apps decide how to surface it.
   * Slice 4 will persist this to an investigation Hypothesis entity.
   */
  hypothesisDraft?: string;
  /** Improvement target */
  target?: {
    metric: AnalysisBriefTargetMetric;
    direction: 'minimize' | 'maximize' | 'target';
    value: number;
  };
}
