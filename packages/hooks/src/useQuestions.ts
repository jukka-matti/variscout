import { useState, useCallback, useMemo } from 'react';
import {
  createQuestion,
  createImprovementIdea,
  type AnovaResult,
  type Finding,
  type FindingProjection,
  type GeneratedQuestion,
  type Question,
  type QuestionStatus,
  type QuestionValidationType,
  type ImprovementIdea,
} from '@variscout/core';

// ============================================================================
// Tree constraints
// ============================================================================

/** Maximum depth of question sub-tree (0 = root, 1 = child, 2 = grandchild) */
export const MAX_QUESTION_DEPTH = 3;

/** Maximum children per parent question */
export const MAX_CHILDREN_PER_PARENT = 8;

/** Soft warning threshold for total questions per investigation */
export const MAX_TOTAL_QUESTIONS = 30;

// ============================================================================
// Types
// ============================================================================

export interface ChildrenSummary {
  answered: number;
  'ruled-out': number;
  open: number;
  investigating: number;
  total: number;
}

export interface UseQuestionsOptions {
  /** Initial questions (for restoring persisted state) */
  initialQuestions?: Question[];
  /** Callback when questions change (for external persistence) */
  onQuestionsChange?: (questions: Question[]) => void;
  /** Current findings (for linked finding cleanup) */
  findings?: Finding[];
  /** Current ANOVA results by factor (for auto-validation) */
  anovaByFactor?: Record<string, AnovaResult>;
}

export interface UseQuestionsReturn {
  /** Current questions list */
  questions: Question[];
  /** Add a new root question */
  addQuestion: (text: string, factor?: string, level?: string) => Question;
  /** Add a sub-question under a parent */
  addSubQuestion: (
    parentId: string,
    text: string,
    factor?: string,
    level?: string,
    validationType?: QuestionValidationType
  ) => Question | null;
  /** Edit a question */
  editQuestion: (id: string, updates: Partial<Pick<Question, 'text' | 'factor' | 'level'>>) => void;
  /** Delete a question and all descendants, clear links from findings */
  deleteQuestion: (id: string) => string[];
  /** Link a finding to a question */
  linkFinding: (questionId: string, findingId: string) => void;
  /** Unlink a finding from a question */
  unlinkFinding: (questionId: string, findingId: string) => void;
  /** Get a question by ID */
  getQuestion: (id: string) => Question | undefined;
  /** Get questions linked to a specific factor */
  getByFactor: (factor: string) => Question[];
  /** Get direct children of a question */
  getChildren: (parentId: string) => Question[];
  /** Get root-level questions (no parent) */
  getRoots: () => Question[];
  /** Get ancestor chain from root to the given question (excluding self) */
  getAncestors: (id: string) => Question[];
  /** Get depth of a question in the tree (root = 0) */
  getDepth: (id: string) => number;
  /** Set validation task description */
  setValidationTask: (id: string, task: string) => void;
  /** Mark a gemba/expert task as completed */
  completeTask: (id: string) => void;
  /** Manually set question status with a note (for gemba/expert validation) */
  setManualStatus: (id: string, status: QuestionStatus, note?: string) => void;
  /** Get children summary counts for a parent question */
  getChildrenSummary: (parentId: string) => ChildrenSummary;
  /** Whether the max total question count has been reached */
  isAtCapacity: boolean;
  // --- Improvement Ideas ---
  /** Add an improvement idea to a question */
  addIdea: (questionId: string, text: string) => ImprovementIdea | null;
  /** Update an improvement idea */
  updateIdea: (
    questionId: string,
    ideaId: string,
    updates: Partial<
      Pick<
        ImprovementIdea,
        'text' | 'timeframe' | 'cost' | 'impactOverride' | 'notes' | 'direction' | 'category'
      >
    >
  ) => void;
  /** Remove an improvement idea */
  removeIdea: (questionId: string, ideaId: string) => void;
  /** Attach a What-If projection to an idea */
  setIdeaProjection: (questionId: string, ideaId: string, projection: FindingProjection) => void;
  /** Toggle the selected flag on an idea */
  selectIdea: (questionId: string, ideaId: string, selected: boolean) => void;
  /** Set cause role on a question (multiple suspected-cause allowed per tree) */
  setCauseRole: (
    questionId: string,
    role: 'suspected-cause' | 'contributing' | 'ruled-out' | undefined
  ) => void;
  // --- Question Lifecycle ---
  /** Generate initial questions from Factor Intelligence ranking + heuristic context */
  generateInitialQuestions: (
    generatedQuestions: GeneratedQuestion[],
    issueStatement?: string
  ) => Question[];
  /** Mark a question as answered by linking it to a finding */
  answerQuestion: (
    questionId: string,
    findingId: string,
    answer: 'answered' | 'ruled-out' | 'investigating'
  ) => void;
  /** Currently focused question (last clicked in checklist) */
  focusedQuestionId: string | null;
  /** Set the focused question */
  setFocusedQuestion: (id: string | null) => void;
}

/** Eta-squared thresholds for auto-validation */
const ETA_SUPPORTED = 0.15;
const ETA_CONTRADICTED = 0.05;

/**
 * Compute question status from ANOVA eta-squared for the linked factor.
 * Only applies to data-validated questions (validationType undefined or 'data').
 */
function computeStatus(
  question: Question,
  anovaByFactor?: Record<string, AnovaResult>
): QuestionStatus {
  // Non-data validation types keep their manually set status
  if (question.validationType && question.validationType !== 'data') {
    return question.status;
  }

  // Question-sourced questions that already have a non-open status
  // (auto-ruled-out or manually answered) keep their status
  if (question.questionSource && question.status !== 'open') {
    return question.status;
  }

  if (!question.factor || !anovaByFactor) return 'open';
  const anova = anovaByFactor[question.factor];
  if (!anova) return 'open';

  const eta = anova.etaSquared;
  if (eta >= ETA_SUPPORTED) return 'answered';
  if (eta < ETA_CONTRADICTED) return 'ruled-out';
  return 'investigating';
}

/**
 * Derive a parent's status from its children's statuses.
 * Returns null if any child is open (no override — keep own status).
 */
function deriveStatusFromChildren(childStatuses: QuestionStatus[]): QuestionStatus | null {
  if (childStatuses.length === 0) return null;
  if (childStatuses.some(s => s === 'open')) return null;
  if (childStatuses.every(s => s === 'ruled-out')) return 'ruled-out';
  if (childStatuses.some(s => s === 'answered')) return 'answered';
  return 'investigating';
}

/**
 * Get the depth of a question in the tree.
 */
function getQuestionDepth(id: string, questions: Question[]): number {
  let depth = 0;
  let current = questions.find(q => q.id === id);
  while (current?.parentId) {
    depth++;
    current = questions.find(q => q.id === current!.parentId);
    if (depth > MAX_QUESTION_DEPTH + 1) break; // safety
  }
  return depth;
}

/**
 * Manages investigation questions — shared theories that findings can reference.
 *
 * Supports tree structure via parentId for sub-question investigation.
 * Questions are auto-validated when linked to a factor with ANOVA results:
 * - eta² >= 15% → answered
 * - eta² < 5% → ruled-out
 * - 5-15% → investigating
 * - No factor linked → open
 *
 * Non-data validation types (gemba/expert) keep their manually set status.
 */
export function useQuestions(options: UseQuestionsOptions = {}): UseQuestionsReturn {
  const { initialQuestions, onQuestionsChange, anovaByFactor } = options;

  const [questions, setQuestions] = useState<Question[]>(initialQuestions ?? []);
  const [focusedQuestionId, setFocusedQuestion] = useState<string | null>(null);

  // Auto-validate statuses when ANOVA changes (data-validated only)
  // Then propagate children statuses upward to parents (bottom-up).
  const validatedQuestions = useMemo(() => {
    // Pass 1: compute per-question data status
    const withStatus = questions.map(q => {
      const computed = computeStatus(q, anovaByFactor);
      return computed !== q.status
        ? { ...q, status: computed, updatedAt: new Date().toISOString() }
        : q;
    });

    // Pass 2: propagate children → parent (bottom-up by depth)
    // Build depth map and parent→children index
    const byId = new Map<string, number>();
    for (let i = 0; i < withStatus.length; i++) {
      byId.set(withStatus[i].id, i);
    }

    const childrenOf = new Map<string, number[]>();
    for (let i = 0; i < withStatus.length; i++) {
      const pid = withStatus[i].parentId;
      if (pid) {
        const siblings = childrenOf.get(pid);
        if (siblings) siblings.push(i);
        else childrenOf.set(pid, [i]);
      }
    }

    // Only process parents that have children
    if (childrenOf.size === 0) return withStatus;

    // Compute depths, sort parents deepest-first
    const parentIds = [...childrenOf.keys()];
    const depthOf = (id: string): number => {
      let d = 0;
      let cur = withStatus[byId.get(id)!];
      while (cur?.parentId) {
        d++;
        const idx = byId.get(cur.parentId);
        if (idx === undefined) break;
        cur = withStatus[idx];
        if (d > MAX_QUESTION_DEPTH + 1) break;
      }
      return d;
    };
    parentIds.sort((a, b) => depthOf(b) - depthOf(a));

    const result = [...withStatus];
    for (const pid of parentIds) {
      const pidx = byId.get(pid);
      if (pidx === undefined) continue;
      const childIndices = childrenOf.get(pid)!;
      const childStatuses = childIndices.map(i => result[i].status);
      const derived = deriveStatusFromChildren(childStatuses);
      if (derived !== null && derived !== result[pidx].status) {
        result[pidx] = { ...result[pidx], status: derived, updatedAt: new Date().toISOString() };
      }
    }

    return result;
  }, [questions, anovaByFactor]);

  const isAtCapacity = validatedQuestions.length >= MAX_TOTAL_QUESTIONS;

  const update = useCallback(
    (updater: (prev: Question[]) => Question[]) => {
      setQuestions(prev => {
        const next = updater(prev);
        onQuestionsChange?.(next);
        return next;
      });
    },
    [onQuestionsChange]
  );

  const addQuestion = useCallback(
    (text: string, factor?: string, level?: string): Question => {
      const question = createQuestion(text, factor, level);
      update(prev => [...prev, question]);
      return question;
    },
    [update]
  );

  const addSubQuestion = useCallback(
    (
      parentId: string,
      text: string,
      factor?: string,
      level?: string,
      validationType?: QuestionValidationType
    ): Question | null => {
      // Validate parent exists
      const parent = validatedQuestions.find(q => q.id === parentId);
      if (!parent) return null;

      // Check depth constraint
      const parentDepth = getQuestionDepth(parentId, validatedQuestions);
      if (parentDepth >= MAX_QUESTION_DEPTH - 1) return null;

      // Check children count constraint
      const childCount = validatedQuestions.filter(q => q.parentId === parentId).length;
      if (childCount >= MAX_CHILDREN_PER_PARENT) return null;

      const question = createQuestion(text, factor, level, parentId, validationType);
      update(prev => [...prev, question]);
      return question;
    },
    [validatedQuestions, update]
  );

  const editQuestion = useCallback(
    (id: string, updates: Partial<Pick<Question, 'text' | 'factor' | 'level'>>) => {
      update(prev =>
        prev.map(q => (q.id === id ? { ...q, ...updates, updatedAt: new Date().toISOString() } : q))
      );
    },
    [update]
  );

  const deleteQuestion = useCallback(
    (id: string): string[] => {
      const unlinkedFindingIds: string[] = [];

      // Collect all descendant IDs for cascade delete
      const idsToDelete = new Set<string>([id]);
      const allQuestions = questions;
      let changed = true;
      while (changed) {
        changed = false;
        for (const q of allQuestions) {
          if (q.parentId && idsToDelete.has(q.parentId) && !idsToDelete.has(q.id)) {
            idsToDelete.add(q.id);
            changed = true;
          }
        }
      }

      // Collect all finding IDs that need unlinking
      for (const q of allQuestions) {
        if (idsToDelete.has(q.id)) {
          unlinkedFindingIds.push(...q.linkedFindingIds);
        }
      }

      update(prev => prev.filter(q => !idsToDelete.has(q.id)));
      return unlinkedFindingIds;
    },
    [questions, update]
  );

  const linkFinding = useCallback(
    (questionId: string, findingId: string) => {
      update(prev =>
        prev.map(q =>
          q.id === questionId && !q.linkedFindingIds.includes(findingId)
            ? {
                ...q,
                linkedFindingIds: [...q.linkedFindingIds, findingId],
                updatedAt: new Date().toISOString(),
              }
            : q
        )
      );
    },
    [update]
  );

  const unlinkFinding = useCallback(
    (questionId: string, findingId: string) => {
      update(prev =>
        prev.map(q =>
          q.id === questionId
            ? {
                ...q,
                linkedFindingIds: q.linkedFindingIds.filter(fid => fid !== findingId),
                updatedAt: new Date().toISOString(),
              }
            : q
        )
      );
    },
    [update]
  );

  const getQuestion = useCallback(
    (id: string): Question | undefined => {
      return validatedQuestions.find(q => q.id === id);
    },
    [validatedQuestions]
  );

  const getByFactor = useCallback(
    (factor: string): Question[] => {
      return validatedQuestions.filter(q => q.factor === factor);
    },
    [validatedQuestions]
  );

  const getChildren = useCallback(
    (parentId: string): Question[] => {
      return validatedQuestions.filter(q => q.parentId === parentId);
    },
    [validatedQuestions]
  );

  const getRoots = useCallback((): Question[] => {
    return validatedQuestions.filter(q => !q.parentId);
  }, [validatedQuestions]);

  const getAncestors = useCallback(
    (id: string): Question[] => {
      const ancestors: Question[] = [];
      let current = validatedQuestions.find(q => q.id === id);
      while (current?.parentId) {
        const parent = validatedQuestions.find(q => q.id === current!.parentId);
        if (!parent) break;
        ancestors.unshift(parent);
        current = parent;
      }
      return ancestors;
    },
    [validatedQuestions]
  );

  const getDepth = useCallback(
    (id: string): number => {
      return getQuestionDepth(id, validatedQuestions);
    },
    [validatedQuestions]
  );

  const setValidationTask = useCallback(
    (id: string, task: string) => {
      update(prev =>
        prev.map(q =>
          q.id === id ? { ...q, validationTask: task, updatedAt: new Date().toISOString() } : q
        )
      );
    },
    [update]
  );

  const completeTask = useCallback(
    (id: string) => {
      update(prev =>
        prev.map(q =>
          q.id === id ? { ...q, taskCompleted: true, updatedAt: new Date().toISOString() } : q
        )
      );
    },
    [update]
  );

  const setManualStatus = useCallback(
    (id: string, status: QuestionStatus, note?: string) => {
      update(prev =>
        prev.map(q =>
          q.id === id
            ? {
                ...q,
                status,
                manualNote: note,
                updatedAt: new Date().toISOString(),
              }
            : q
        )
      );
    },
    [update]
  );

  const getChildrenSummary = useCallback(
    (parentId: string): ChildrenSummary => {
      const children = validatedQuestions.filter(q => q.parentId === parentId);
      return {
        answered: children.filter(q => q.status === 'answered').length,
        'ruled-out': children.filter(q => q.status === 'ruled-out').length,
        open: children.filter(q => q.status === 'open').length,
        investigating: children.filter(q => q.status === 'investigating').length,
        total: children.length,
      };
    },
    [validatedQuestions]
  );

  // --- Improvement Ideas ---

  const addIdea = useCallback(
    (questionId: string, text: string): ImprovementIdea | null => {
      const question = validatedQuestions.find(q => q.id === questionId);
      if (!question) return null;
      const idea = createImprovementIdea(text);
      update(prev =>
        prev.map(q =>
          q.id === questionId
            ? { ...q, ideas: [...(q.ideas ?? []), idea], updatedAt: new Date().toISOString() }
            : q
        )
      );
      return idea;
    },
    [validatedQuestions, update]
  );

  const updateIdea = useCallback(
    (
      questionId: string,
      ideaId: string,
      updates: Partial<
        Pick<
          ImprovementIdea,
          'text' | 'timeframe' | 'cost' | 'impactOverride' | 'notes' | 'direction' | 'category'
        >
      >
    ) => {
      update(prev =>
        prev.map(q =>
          q.id === questionId && q.ideas
            ? {
                ...q,
                ideas: q.ideas.map(i => (i.id === ideaId ? { ...i, ...updates } : i)),
                updatedAt: new Date().toISOString(),
              }
            : q
        )
      );
    },
    [update]
  );

  const removeIdea = useCallback(
    (questionId: string, ideaId: string) => {
      update(prev =>
        prev.map(q =>
          q.id === questionId && q.ideas
            ? {
                ...q,
                ideas: q.ideas.filter(i => i.id !== ideaId),
                updatedAt: new Date().toISOString(),
              }
            : q
        )
      );
    },
    [update]
  );

  const setIdeaProjection = useCallback(
    (questionId: string, ideaId: string, projection: FindingProjection) => {
      update(prev =>
        prev.map(q =>
          q.id === questionId && q.ideas
            ? {
                ...q,
                ideas: q.ideas.map(i => (i.id === ideaId ? { ...i, projection } : i)),
                updatedAt: new Date().toISOString(),
              }
            : q
        )
      );
    },
    [update]
  );

  const selectIdea = useCallback(
    (questionId: string, ideaId: string, selected: boolean) => {
      update(prev =>
        prev.map(q =>
          q.id === questionId && q.ideas
            ? {
                ...q,
                ideas: q.ideas.map(i => (i.id === ideaId ? { ...i, selected } : i)),
                updatedAt: new Date().toISOString(),
              }
            : q
        )
      );
    },
    [update]
  );

  const setCauseRole = useCallback(
    (questionId: string, role: 'suspected-cause' | 'contributing' | 'ruled-out' | undefined) => {
      update(prev => {
        const now = new Date().toISOString();
        return prev.map(q => {
          if (q.id === questionId) {
            return { ...q, causeRole: role, updatedAt: now };
          }
          return q;
        });
      });
    },
    [update]
  );

  // --- Question Lifecycle ---

  const generateInitialQuestions = useCallback(
    (generatedQuestions: GeneratedQuestion[], _issueStatement?: string): Question[] => {
      const created: Question[] = [];
      for (const gq of generatedQuestions) {
        const q = createQuestion(gq.text, gq.factors.length === 1 ? gq.factors[0] : undefined);
        // Enrich with question-specific fields
        const enriched: Question = {
          ...q,
          questionSource: gq.source,
          evidence: { rSquaredAdj: gq.rSquaredAdj },
          status: gq.autoAnswered ? 'ruled-out' : 'open',
        };
        created.push(enriched);
      }
      if (created.length > 0) {
        update(prev => [...prev, ...created]);
      }
      return created;
    },
    [update]
  );

  const answerQuestion = useCallback(
    (questionId: string, findingId: string, answer: 'answered' | 'ruled-out' | 'investigating') => {
      update(prev =>
        prev.map(q => {
          if (q.id !== questionId) return q;
          const alreadyLinked = q.linkedFindingIds.includes(findingId);
          return {
            ...q,
            status: answer,
            linkedFindingIds: alreadyLinked
              ? q.linkedFindingIds
              : [...q.linkedFindingIds, findingId],
            updatedAt: new Date().toISOString(),
          };
        })
      );
    },
    [update]
  );

  return {
    questions: validatedQuestions,
    addQuestion,
    addSubQuestion,
    editQuestion,
    deleteQuestion,
    linkFinding,
    unlinkFinding,
    getQuestion,
    getByFactor,
    getChildren,
    getRoots,
    getAncestors,
    getDepth,
    setValidationTask,
    completeTask,
    setManualStatus,
    getChildrenSummary,
    isAtCapacity,
    addIdea,
    updateIdea,
    removeIdea,
    setIdeaProjection,
    selectIdea,
    setCauseRole,
    generateInitialQuestions,
    answerQuestion,
    focusedQuestionId,
    setFocusedQuestion,
  };
}
