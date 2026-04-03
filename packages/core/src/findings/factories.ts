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
  type Question,
  type QuestionValidationType,
  type ImprovementIdea,
  type PhotoAttachment,
  type InvestigationCategory,
  type SuspectedCause,
} from './types';

/** Generate a unique ID */
export function generateId(): string {
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `f-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Create a new Question with a unique ID
 */
export function createQuestion(
  text: string,
  factor?: string,
  level?: string,
  parentId?: string,
  validationType?: QuestionValidationType
): Question {
  const now = new Date().toISOString();
  return {
    id: generateId(),
    text,
    factor,
    level,
    status: 'open',
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
  question: Question;
  idea: ImprovementIdea;
}

/**
 * Create a Finding + Question + ImprovementIdea from Factor Intelligence output.
 *
 * The question is auto-set to:
 *   - factor: the factor column name
 *   - level: the worst-performing level (the one to change)
 *   - status: 'answered' (statistically validated by η²)
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

  const question = createQuestion(
    `${factor} level "${worstLevel}" causes worse outcome — target: change to "${bestLevel}"`,
    factor,
    worstLevel,
    undefined,
    'data' // validated by data analysis, not gemba/expert
  );
  question.status = 'answered'; // Factor Intelligence provides statistical evidence
  question.linkedFindingIds = [finding.id];

  // Link finding to question
  finding.questionId = question.id;
  finding.validationStatus = 'supports';

  // Seed improvement idea
  const idea = createImprovementIdea(
    `Change ${factor} from "${worstLevel}" to "${bestLevel}" (expected improvement: ${effectRange.toFixed(1)} units)`
  );
  idea.direction = 'eliminate';

  // Attach idea to question
  question.ideas = [idea];

  return { finding, question, idea };
}

/**
 * Create a new SuspectedCause hub with a unique ID.
 *
 * A hub groups one or more questions (and their findings) under a named suspected
 * cause, enabling the analyst to synthesize multiple evidence streams into a
 * coherent explanation. The aggregate evidence contribution is computed separately
 * via `computeHubContribution` in helpers.
 *
 * @param name - Analyst-chosen label, e.g. "Nozzle wear on night shift"
 * @param synthesis - Free-text explanation connecting the evidence
 * @param questionIds - IDs of questions linked to this hub
 * @param findingIds - IDs of findings linked to this hub
 */
export function createSuspectedCause(
  name: string,
  synthesis: string,
  questionIds: string[] = [],
  findingIds: string[] = []
): SuspectedCause {
  const now = new Date().toISOString();
  return {
    id: generateId(),
    name,
    synthesis,
    questionIds,
    findingIds,
    status: 'suspected',
    createdAt: now,
    updatedAt: now,
  };
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
