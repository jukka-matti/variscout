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
  type CausalLink,
} from './types';

import { generateDeterministicId } from '../identity';
export { generateDeterministicId as generateId } from '../identity';

/**
 * Create a new Question with a unique ID.
 *
 * @param text - Question text
 * @param investigationId - FK to the owning investigation. Callers must pass
 *   explicitly; use 'general-unassigned' as a sentinel until investigations
 *   become first-class (F6 named-future, tracked in docs/investigations.md).
 */
export function createQuestion(
  text: string,
  investigationId: string,
  factor?: string,
  level?: string,
  parentId?: string,
  validationType?: QuestionValidationType
): Question {
  const now = Date.now();
  return {
    id: generateDeterministicId(),
    text,
    investigationId,
    factor,
    level,
    status: 'open',
    linkedFindingIds: [],
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
    parentId,
    validationType,
  };
}

/**
 * Create a new Finding with a unique ID.
 *
 * @param investigationId - FK to the owning investigation. Callers must pass
 *   explicitly; use 'general-unassigned' as a sentinel until investigations
 *   become first-class (F6 named-future, tracked in docs/investigations.md).
 */
export function createFinding(
  text: string,
  activeFilters: Record<string, (string | number)[]>,
  cumulativeScope: number | null,
  stats?: { mean: number; median?: number; cpk?: number; samples: number },
  status?: FindingStatus,
  source?: FindingSource,
  investigationId = 'general-unassigned' // callers should pass explicitly; sentinel until F6 first-class investigations
): Finding {
  const now = Date.now();
  const finding: Finding = {
    id: generateDeterministicId(),
    text,
    createdAt: now,
    deletedAt: null,
    investigationId,
    context: {
      activeFilters,
      cumulativeScope,
      stats,
    },
    status: status ?? 'observed',
    comments: [],
    statusChangedAt: now,
  };
  if (source) finding.source = source;
  return finding;
}

/**
 * Create a PhotoAttachment with a unique ID and pending upload status
 */
export function createPhotoAttachment(filename: string): PhotoAttachment {
  const now = Date.now();
  return {
    id: generateDeterministicId(),
    filename,
    uploadStatus: 'pending',
    capturedAt: now,
    createdAt: now,
    deletedAt: null,
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
  const now = Date.now();
  return {
    id: generateDeterministicId(),
    filename,
    mimeType,
    sizeBytes,
    uploadStatus: 'pending',
    attachedAt: now,
    createdAt: now,
    deletedAt: null,
  };
}

/**
 * Create a timestamped comment with a unique ID.
 *
 * @param text - Comment text
 * @param parentId - ID of the owning entity (Finding or SuspectedCause)
 * @param parentKind - Which entity type owns this comment
 * @param author - Optional author display name
 */
export function createFindingComment(
  text: string,
  parentId: string,
  parentKind: 'finding' | 'suspectedCause',
  author?: string
): FindingComment {
  const comment: FindingComment = {
    id: generateDeterministicId(),
    text,
    parentId,
    parentKind,
    createdAt: Date.now(),
    deletedAt: null,
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
    id: generateDeterministicId(),
    text,
    assignee,
    dueDate,
    createdAt: Date.now(),
    deletedAt: null,
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
    id: generateDeterministicId(),
    text,
    createdAt: Date.now(),
    deletedAt: null,
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
export function createFactorFinding(
  input: FactorFindingInput,
  investigationId: string = 'general-unassigned'
): FactorFindingBundle {
  const { factor, bestLevel, worstLevel, etaSquared, effectRange, pValue } = input;

  const etaPct = Number.isFinite(etaSquared) ? (etaSquared * 100).toFixed(1) : '—';
  const etaStr = Number.isFinite(etaSquared) ? etaSquared.toFixed(3) : '—';
  const pStr = pValue < 0.001 ? '<0.001' : Number.isFinite(pValue) ? pValue.toFixed(3) : '—';
  const rangeStr = Number.isFinite(effectRange) ? effectRange.toFixed(1) : '—';
  const findingText = `${factor} explains ${etaPct}% of variation (η²=${etaStr}, p=${pStr}). Effect range: ${rangeStr}.`;

  const finding = createFinding(
    findingText,
    {}, // no active filters — observation comes from Factor Intelligence
    null,
    undefined,
    'investigating', // skip 'observed' — Factor Intelligence already validated statistically
    undefined,
    investigationId
  );

  const question = createQuestion(
    `${factor} level "${worstLevel}" causes worse outcome — target: change to "${bestLevel}"`,
    investigationId,
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
    `Change ${factor} from "${worstLevel}" to "${bestLevel}" (expected improvement: ${Number.isFinite(effectRange) ? effectRange.toFixed(1) : '—'} units)`
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
  findingIds: string[] = [],
  investigationId = 'general-unassigned' // callers must pass explicitly; sentinel until F6 first-class investigations
): SuspectedCause {
  const now = Date.now();
  return {
    id: generateDeterministicId(),
    name,
    synthesis,
    questionIds,
    findingIds,
    investigationId,
    status: 'suspected',
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
  };
}

/**
 * Create a new CausalLink with a unique ID.
 *
 * A causal link represents a directed relationship between two factors in the
 * investigation DAG. Used to model causal chains discovered during investigation.
 *
 * @param fromFactor - Source factor column name (e.g., "Shift")
 * @param toFactor - Target factor column name (e.g., "Fill Head")
 * @param whyStatement - Analyst explanation of the causal mechanism
 * @param options - Optional configuration for direction, evidence, source, etc.
 */
export function createCausalLink(
  fromFactor: string,
  toFactor: string,
  whyStatement: string,
  options?: {
    fromLevel?: string;
    toLevel?: string;
    direction?: CausalLink['direction'];
    evidenceType?: CausalLink['evidenceType'];
    source?: CausalLink['source'];
    strength?: number;
    relationshipType?: CausalLink['relationshipType'];
  }
): CausalLink {
  const now = Date.now();
  return {
    id: generateDeterministicId(),
    fromFactor,
    toFactor,
    fromLevel: options?.fromLevel,
    toLevel: options?.toLevel,
    whyStatement,
    direction: options?.direction ?? 'drives',
    evidenceType: options?.evidenceType ?? 'unvalidated',
    questionIds: [],
    findingIds: [],
    strength: options?.strength,
    relationshipType: options?.relationshipType,
    source: options?.source ?? 'analyst',
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
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
    id: generateDeterministicId(),
    name,
    factorNames,
    color: CATEGORY_COLORS[existingCount % CATEGORY_COLORS.length],
    createdAt: Date.now(),
    deletedAt: null,
  };
  if (inferredFrom) category.inferredFrom = inferredFrom;
  return category;
}
