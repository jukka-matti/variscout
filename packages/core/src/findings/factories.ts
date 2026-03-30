/**
 * Factory functions for creating findings domain objects.
 */
import {
  CATEGORY_COLORS,
  type CommentAttachment,
  type Finding,
  type FindingStatus,
  type FindingSource,
  type FindingComment,
  type FindingOutcome,
  type FindingAssignee,
  type ActionItem,
  type Hypothesis,
  type HypothesisValidationType,
  type ImprovementIdea,
  type PhotoAttachment,
  type InvestigationCategory,
} from './types';

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
 * Create a CommentAttachment (non-image file) with a unique ID and pending upload status
 */
export function createCommentAttachment(
  filename: string,
  mimeType: string,
  sizeBytes: number
): CommentAttachment {
  return {
    id: generateId(),
    filename,
    mimeType,
    sizeBytes,
    uploadStatus: 'pending',
    attachedAt: Date.now(),
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
export function createActionItem(
  text: string,
  assignee?: FindingAssignee,
  dueDate?: string,
  ideaId?: string
): ActionItem {
  const action: ActionItem = {
    id: generateId(),
    text,
    assignee,
    dueDate,
    createdAt: Date.now(),
  };
  if (ideaId) action.ideaId = ideaId;
  return action;
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
// Factor Intelligence → Findings bridge
// ============================================================================

/** Input from FactorMainEffect for creating a factor-based finding. */
export interface FactorFindingInput {
  factor: string;
  bestLevel: string;
  worstLevel: string;
  etaSquared: number;
  effectRange: number;
  pValue: number;
}

/** Bundle returned by createFactorFinding. */
export interface FactorFindingBundle {
  finding: Finding;
  hypothesis: Hypothesis;
  idea: ImprovementIdea;
}

/**
 * Create a Finding + Hypothesis + ImprovementIdea from Factor Intelligence output.
 *
 * The hypothesis is auto-set to:
 *   - factor: the factor column name
 *   - level: the worst-performing level (the one to change)
 *   - status: 'supported' (statistically validated by η²)
 *   - validationType: 'data' (evidence is from data analysis)
 *
 * The improvement idea targets the factor change: worst → best.
 */
export function createFactorFinding(input: FactorFindingInput): FactorFindingBundle {
  const { factor, bestLevel, worstLevel, etaSquared, effectRange, pValue } = input;

  const etaPct = (etaSquared * 100).toFixed(1);
  const findingText = `${factor} explains ${etaPct}% of variation (η²=${etaSquared.toFixed(3)}, p=${pValue < 0.001 ? '<0.001' : pValue.toFixed(3)}). Effect range: ${effectRange.toFixed(1)}.`;

  const finding = createFinding(
    findingText,
    {}, // no active filters — observation comes from Factor Intelligence
    null,
    undefined,
    'investigating' // skip 'observed' — Factor Intelligence already validated statistically
  );

  const hypothesis = createHypothesis(
    `${factor} level "${worstLevel}" causes worse outcome — target: change to "${bestLevel}"`,
    factor,
    worstLevel,
    undefined,
    'data' // validated by data analysis, not gemba/expert
  );
  hypothesis.status = 'supported'; // Factor Intelligence provides statistical evidence
  hypothesis.linkedFindingIds = [finding.id];

  // Link finding to hypothesis
  finding.hypothesisId = hypothesis.id;
  finding.validationStatus = 'supports';

  // Seed improvement idea
  const idea = createImprovementIdea(
    `Change ${factor} from "${worstLevel}" to "${bestLevel}" (expected improvement: ${effectRange.toFixed(1)} units)`
  );
  idea.direction = 'eliminate';

  // Attach idea to hypothesis
  hypothesis.ideas = [idea];

  return { finding, hypothesis, idea };
}

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
