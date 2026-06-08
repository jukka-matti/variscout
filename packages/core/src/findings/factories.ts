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
  type ActionItemQuickActionFields,
  type ActionItemStatus,
  type ImprovementIdea,
  type PhotoAttachment,
  type AnalyzeCategory,
  type Hypothesis,
  type CausalLink,
  type ProblemStatementScope,
} from './types';
import type { ConditionLeaf } from './hypothesisCondition';
import type { ProcessParticipantRef } from '../processHub';

import { generateDeterministicId } from '../identity';
export { generateDeterministicId as generateId } from '../identity';

/**
 * Create a new Finding with a unique ID.
 */
export function createFinding(
  text: string,
  activeFilters: Record<string, (string | number)[]>,
  cumulativeScope: number | null,
  stats?: { mean: number; median?: number; cpk?: number; samples: number },
  status?: FindingStatus,
  source?: FindingSource
): Finding {
  const now = Date.now();
  const finding: Finding = {
    id: generateDeterministicId(),
    text,
    createdAt: now,
    deletedAt: null,
    context: {
      activeFilters,
      cumulativeScope,
      stats,
    },
    // Findings created via this factory originate from chart observations, so
    // they default to `'data'` evidence. Gemba/expert findings should set this
    // explicitly at their creation site.
    evidenceType: 'data',
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
 * @param parentId - ID of the owning entity (Finding or Hypothesis)
 * @param parentKind - Which entity type owns this comment
 * @param author - Optional author display name
 */
export function createFindingComment(
  text: string,
  parentId: string,
  parentKind: 'finding' | 'hypothesis',
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
  assigneeOrFields?: FindingAssignee | ActionItemQuickActionFields,
  dueDate?: string,
  ideaId?: string
): ActionItem {
  if (assigneeOrFields && 'stepId' in assigneeOrFields) {
    return {
      id: generateDeterministicId(),
      text,
      stepId: assigneeOrFields.stepId,
      parentImprovementProjectId: assigneeOrFields.parentImprovementProjectId,
      parentImprovementIdeaId: assigneeOrFields.parentImprovementIdeaId,
      assignedTo: assigneeOrFields.assignedTo,
      dueAt: assigneeOrFields.dueAt,
      status: assigneeOrFields.status,
      doneAt: assigneeOrFields.doneAt,
      doneBy: assigneeOrFields.doneBy,
      createdBy: assigneeOrFields.createdBy,
      createdAt: Date.now(),
      deletedAt: null,
    };
  }

  const action: ActionItem = {
    id: generateDeterministicId(),
    text,
    assignee: assigneeOrFields,
    dueDate,
    createdAt: Date.now(),
    deletedAt: null,
  };
  if (ideaId) action.ideaId = ideaId;
  return action;
}

export function createProjectActionItem(input: {
  text: string;
  parentImprovementProjectId: string | null;
}): ActionItem {
  return {
    id: generateDeterministicId(),
    text: input.text,
    parentImprovementProjectId: input.parentImprovementProjectId,
    status: 'open',
    createdAt: Date.now(),
    deletedAt: null,
  };
}

export function createStepQuickActionItem(input: {
  text: string;
  stepId: string;
  status: Extract<ActionItemStatus, 'open' | 'done'>;
  assignedTo?: ProcessParticipantRef | null;
  dueAt?: string | null;
  createdBy?: ProcessParticipantRef;
}): ActionItem {
  const isOpen = input.status === 'open';

  return {
    id: generateDeterministicId(),
    text: input.text,
    stepId: input.stepId,
    parentImprovementProjectId: null,
    parentImprovementIdeaId: null,
    assignedTo: isOpen ? (input.assignedTo ?? null) : null,
    dueAt: isOpen ? (input.dueAt ?? null) : null,
    status: input.status,
    doneAt: isOpen ? null : new Date().toISOString(),
    doneBy: null,
    createdBy: input.createdBy ?? { displayName: 'Local browser' },
    createdAt: Date.now(),
    deletedAt: null,
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
    id: generateDeterministicId(),
    text,
    createdAt: Date.now(),
    deletedAt: null,
  };
}

/**
 * Create a new Hypothesis with a unique ID.
 *
 * A hypothesis groups one or more findings under a named mechanism, enabling the
 * analyst to synthesize multiple evidence streams into a coherent explanation.
 * The aggregate evidence contribution is computed separately via
 * `computeHubEvidence` in helpers.
 *
 * @param name - Analyst-chosen label, e.g. "Nozzle wear on night shift"
 * @param synthesis - Free-text explanation connecting the evidence
 * @param findingIds - IDs of findings linked to this hub
 */
export function createHypothesis(
  name: string,
  synthesis: string,
  findingIds: string[] = []
): Hypothesis {
  const now = Date.now();
  return {
    id: generateDeterministicId(),
    name,
    synthesis,
    findingIds,
    status: 'proposed',
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
 * Create a new ProblemStatementScope (the WHERE) with a unique ID (ADR-085).
 *
 * @param projectId - FK to the owning ImprovementProject.
 * @param outcome - The Y this scope sharpens.
 * @param predicates - The `{factor=level}` WHERE (flat AND of drill-chip leaves).
 * @param hypothesisIds - The suspected causes nested within this scope (the WHY).
 */
export function createProblemStatementScope(
  projectId: string,
  outcome: string,
  predicates: ConditionLeaf[] = [],
  hypothesisIds: string[] = [],
  options: {
    parentScopeId?: ProblemStatementScope['id'];
    sourceFindingId?: Finding['id'];
    createdFrom?: ProblemStatementScope['createdFrom'];
  } = {}
): ProblemStatementScope {
  const now = Date.now();
  const scope: ProblemStatementScope = {
    id: generateDeterministicId(),
    projectId,
    outcome,
    predicates,
    hypothesisIds,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
  };
  if (options.parentScopeId !== undefined) scope.parentScopeId = options.parentScopeId;
  if (options.sourceFindingId !== undefined) scope.sourceFindingId = options.sourceFindingId;
  if (options.createdFrom !== undefined) scope.createdFrom = options.createdFrom;
  return scope;
}

/**
 * Create a new AnalyzeCategory with a unique ID and auto-assigned color.
 */
export function createInvestigationCategory(
  name: string,
  factorNames: string[],
  existingCount: number = 0,
  inferredFrom?: string
): AnalyzeCategory {
  const category: AnalyzeCategory = {
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
