import { useState, useCallback, useMemo } from 'react';
import {
  createHypothesis,
  createImprovementIdea,
  type AnovaResult,
  type Finding,
  type FindingProjection,
  type GeneratedQuestion,
  type Hypothesis,
  type HypothesisStatus,
  type HypothesisValidationType,
  type ImprovementIdea,
} from '@variscout/core';

// ============================================================================
// Tree constraints
// ============================================================================

/** Maximum depth of hypothesis sub-tree (0 = root, 1 = child, 2 = grandchild) */
export const MAX_HYPOTHESIS_DEPTH = 3;

/** Maximum children per parent hypothesis */
export const MAX_CHILDREN_PER_PARENT = 8;

/** Soft warning threshold for total hypotheses per investigation */
export const MAX_TOTAL_HYPOTHESES = 30;

// ============================================================================
// Types
// ============================================================================

export interface ChildrenSummary {
  supported: number;
  contradicted: number;
  untested: number;
  partial: number;
  total: number;
}

export interface UseHypothesesOptions {
  /** Initial hypotheses (for restoring persisted state) */
  initialHypotheses?: Hypothesis[];
  /** Callback when hypotheses change (for external persistence) */
  onHypothesesChange?: (hypotheses: Hypothesis[]) => void;
  /** Current findings (for linked finding cleanup) */
  findings?: Finding[];
  /** Current ANOVA results by factor (for auto-validation) */
  anovaByFactor?: Record<string, AnovaResult>;
}

export interface UseHypothesesReturn {
  /** Current hypotheses list */
  hypotheses: Hypothesis[];
  /** Add a new root hypothesis */
  addHypothesis: (text: string, factor?: string, level?: string) => Hypothesis;
  /** Add a sub-hypothesis under a parent */
  addSubHypothesis: (
    parentId: string,
    text: string,
    factor?: string,
    level?: string,
    validationType?: HypothesisValidationType
  ) => Hypothesis | null;
  /** Edit a hypothesis */
  editHypothesis: (
    id: string,
    updates: Partial<Pick<Hypothesis, 'text' | 'factor' | 'level'>>
  ) => void;
  /** Delete a hypothesis and all descendants, clear links from findings */
  deleteHypothesis: (id: string) => string[];
  /** Link a finding to a hypothesis */
  linkFinding: (hypothesisId: string, findingId: string) => void;
  /** Unlink a finding from a hypothesis */
  unlinkFinding: (hypothesisId: string, findingId: string) => void;
  /** Get a hypothesis by ID */
  getHypothesis: (id: string) => Hypothesis | undefined;
  /** Get hypotheses linked to a specific factor */
  getByFactor: (factor: string) => Hypothesis[];
  /** Get direct children of a hypothesis */
  getChildren: (parentId: string) => Hypothesis[];
  /** Get root-level hypotheses (no parent) */
  getRoots: () => Hypothesis[];
  /** Get ancestor chain from root to the given hypothesis (excluding self) */
  getAncestors: (id: string) => Hypothesis[];
  /** Get depth of a hypothesis in the tree (root = 0) */
  getDepth: (id: string) => number;
  /** Set validation task description */
  setValidationTask: (id: string, task: string) => void;
  /** Mark a gemba/expert task as completed */
  completeTask: (id: string) => void;
  /** Manually set hypothesis status with a note (for gemba/expert validation) */
  setManualStatus: (id: string, status: HypothesisStatus, note?: string) => void;
  /** Get children summary counts for a parent hypothesis */
  getChildrenSummary: (parentId: string) => ChildrenSummary;
  /** Whether the max total hypothesis count has been reached */
  isAtCapacity: boolean;
  // --- Improvement Ideas ---
  /** Add an improvement idea to a hypothesis */
  addIdea: (hypothesisId: string, text: string) => ImprovementIdea | null;
  /** Update an improvement idea */
  updateIdea: (
    hypothesisId: string,
    ideaId: string,
    updates: Partial<
      Pick<
        ImprovementIdea,
        'text' | 'timeframe' | 'cost' | 'impactOverride' | 'notes' | 'direction' | 'category'
      >
    >
  ) => void;
  /** Remove an improvement idea */
  removeIdea: (hypothesisId: string, ideaId: string) => void;
  /** Attach a What-If projection to an idea */
  setIdeaProjection: (hypothesisId: string, ideaId: string, projection: FindingProjection) => void;
  /** Toggle the selected flag on an idea */
  selectIdea: (hypothesisId: string, ideaId: string, selected: boolean) => void;
  /** Set cause role on a hypothesis (multiple suspected-cause allowed per tree) */
  setCauseRole: (
    hypothesisId: string,
    role: 'suspected-cause' | 'contributing' | 'ruled-out' | undefined
  ) => void;
  // --- Question Lifecycle ---
  /** Generate initial questions from Factor Intelligence ranking + heuristic context */
  generateInitialQuestions: (
    generatedQuestions: GeneratedQuestion[],
    issueStatement?: string
  ) => Hypothesis[];
  /** Mark a question as answered by linking it to a finding */
  answerQuestion: (
    questionId: string,
    findingId: string,
    answer: 'supported' | 'contradicted' | 'partial'
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
 * Compute hypothesis status from ANOVA eta-squared for the linked factor.
 * Only applies to data-validated hypotheses (validationType undefined or 'data').
 */
function computeStatus(
  hypothesis: Hypothesis,
  anovaByFactor?: Record<string, AnovaResult>
): HypothesisStatus {
  // Non-data validation types keep their manually set status
  if (hypothesis.validationType && hypothesis.validationType !== 'data') {
    return hypothesis.status;
  }

  // Question-sourced hypotheses that already have a non-untested status
  // (auto-ruled-out or manually answered) keep their status
  if (hypothesis.questionSource && hypothesis.status !== 'untested') {
    return hypothesis.status;
  }

  if (!hypothesis.factor || !anovaByFactor) return 'untested';
  const anova = anovaByFactor[hypothesis.factor];
  if (!anova) return 'untested';

  const eta = anova.etaSquared;
  if (eta >= ETA_SUPPORTED) return 'supported';
  if (eta < ETA_CONTRADICTED) return 'contradicted';
  return 'partial';
}

/**
 * Derive a parent's status from its children's statuses.
 * Returns null if any child is untested (no override — keep own status).
 */
function deriveStatusFromChildren(childStatuses: HypothesisStatus[]): HypothesisStatus | null {
  if (childStatuses.length === 0) return null;
  if (childStatuses.some(s => s === 'untested')) return null;
  if (childStatuses.every(s => s === 'contradicted')) return 'contradicted';
  if (childStatuses.some(s => s === 'supported')) return 'supported';
  return 'partial';
}

/**
 * Get the depth of a hypothesis in the tree.
 */
function getHypothesisDepth(id: string, hypotheses: Hypothesis[]): number {
  let depth = 0;
  let current = hypotheses.find(h => h.id === id);
  while (current?.parentId) {
    depth++;
    current = hypotheses.find(h => h.id === current!.parentId);
    if (depth > MAX_HYPOTHESIS_DEPTH + 1) break; // safety
  }
  return depth;
}

/**
 * Manages causal hypotheses — shared theories that findings can reference.
 *
 * Supports tree structure via parentId for sub-hypothesis investigation.
 * Hypotheses are auto-validated when linked to a factor with ANOVA results:
 * - eta² >= 15% → supported
 * - eta² < 5% → contradicted
 * - 5-15% → partial
 * - No factor linked → untested
 *
 * Non-data validation types (gemba/expert) keep their manually set status.
 */
export function useHypotheses(options: UseHypothesesOptions = {}): UseHypothesesReturn {
  const { initialHypotheses, onHypothesesChange, anovaByFactor } = options;

  const [hypotheses, setHypotheses] = useState<Hypothesis[]>(initialHypotheses ?? []);
  const [focusedQuestionId, setFocusedQuestion] = useState<string | null>(null);

  // Auto-validate statuses when ANOVA changes (data-validated only)
  // Then propagate children statuses upward to parents (bottom-up).
  const validatedHypotheses = useMemo(() => {
    // Pass 1: compute per-hypothesis data status
    const withStatus = hypotheses.map(h => {
      const computed = computeStatus(h, anovaByFactor);
      return computed !== h.status
        ? { ...h, status: computed, updatedAt: new Date().toISOString() }
        : h;
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
        if (d > MAX_HYPOTHESIS_DEPTH + 1) break;
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
  }, [hypotheses, anovaByFactor]);

  const isAtCapacity = validatedHypotheses.length >= MAX_TOTAL_HYPOTHESES;

  const update = useCallback(
    (updater: (prev: Hypothesis[]) => Hypothesis[]) => {
      setHypotheses(prev => {
        const next = updater(prev);
        onHypothesesChange?.(next);
        return next;
      });
    },
    [onHypothesesChange]
  );

  const addHypothesis = useCallback(
    (text: string, factor?: string, level?: string): Hypothesis => {
      const hypothesis = createHypothesis(text, factor, level);
      update(prev => [...prev, hypothesis]);
      return hypothesis;
    },
    [update]
  );

  const addSubHypothesis = useCallback(
    (
      parentId: string,
      text: string,
      factor?: string,
      level?: string,
      validationType?: HypothesisValidationType
    ): Hypothesis | null => {
      // Validate parent exists
      const parent = validatedHypotheses.find(h => h.id === parentId);
      if (!parent) return null;

      // Check depth constraint
      const parentDepth = getHypothesisDepth(parentId, validatedHypotheses);
      if (parentDepth >= MAX_HYPOTHESIS_DEPTH - 1) return null;

      // Check children count constraint
      const childCount = validatedHypotheses.filter(h => h.parentId === parentId).length;
      if (childCount >= MAX_CHILDREN_PER_PARENT) return null;

      const hypothesis = createHypothesis(text, factor, level, parentId, validationType);
      update(prev => [...prev, hypothesis]);
      return hypothesis;
    },
    [validatedHypotheses, update]
  );

  const editHypothesis = useCallback(
    (id: string, updates: Partial<Pick<Hypothesis, 'text' | 'factor' | 'level'>>) => {
      update(prev =>
        prev.map(h => (h.id === id ? { ...h, ...updates, updatedAt: new Date().toISOString() } : h))
      );
    },
    [update]
  );

  const deleteHypothesis = useCallback(
    (id: string): string[] => {
      const unlinkedFindingIds: string[] = [];

      // Collect all descendant IDs for cascade delete
      const idsToDelete = new Set<string>([id]);
      const allHypotheses = hypotheses;
      let changed = true;
      while (changed) {
        changed = false;
        for (const h of allHypotheses) {
          if (h.parentId && idsToDelete.has(h.parentId) && !idsToDelete.has(h.id)) {
            idsToDelete.add(h.id);
            changed = true;
          }
        }
      }

      // Collect all finding IDs that need unlinking
      for (const h of allHypotheses) {
        if (idsToDelete.has(h.id)) {
          unlinkedFindingIds.push(...h.linkedFindingIds);
        }
      }

      update(prev => prev.filter(h => !idsToDelete.has(h.id)));
      return unlinkedFindingIds;
    },
    [hypotheses, update]
  );

  const linkFinding = useCallback(
    (hypothesisId: string, findingId: string) => {
      update(prev =>
        prev.map(h =>
          h.id === hypothesisId && !h.linkedFindingIds.includes(findingId)
            ? {
                ...h,
                linkedFindingIds: [...h.linkedFindingIds, findingId],
                updatedAt: new Date().toISOString(),
              }
            : h
        )
      );
    },
    [update]
  );

  const unlinkFinding = useCallback(
    (hypothesisId: string, findingId: string) => {
      update(prev =>
        prev.map(h =>
          h.id === hypothesisId
            ? {
                ...h,
                linkedFindingIds: h.linkedFindingIds.filter(fid => fid !== findingId),
                updatedAt: new Date().toISOString(),
              }
            : h
        )
      );
    },
    [update]
  );

  const getHypothesis = useCallback(
    (id: string): Hypothesis | undefined => {
      return validatedHypotheses.find(h => h.id === id);
    },
    [validatedHypotheses]
  );

  const getByFactor = useCallback(
    (factor: string): Hypothesis[] => {
      return validatedHypotheses.filter(h => h.factor === factor);
    },
    [validatedHypotheses]
  );

  const getChildren = useCallback(
    (parentId: string): Hypothesis[] => {
      return validatedHypotheses.filter(h => h.parentId === parentId);
    },
    [validatedHypotheses]
  );

  const getRoots = useCallback((): Hypothesis[] => {
    return validatedHypotheses.filter(h => !h.parentId);
  }, [validatedHypotheses]);

  const getAncestors = useCallback(
    (id: string): Hypothesis[] => {
      const ancestors: Hypothesis[] = [];
      let current = validatedHypotheses.find(h => h.id === id);
      while (current?.parentId) {
        const parent = validatedHypotheses.find(h => h.id === current!.parentId);
        if (!parent) break;
        ancestors.unshift(parent);
        current = parent;
      }
      return ancestors;
    },
    [validatedHypotheses]
  );

  const getDepth = useCallback(
    (id: string): number => {
      return getHypothesisDepth(id, validatedHypotheses);
    },
    [validatedHypotheses]
  );

  const setValidationTask = useCallback(
    (id: string, task: string) => {
      update(prev =>
        prev.map(h =>
          h.id === id ? { ...h, validationTask: task, updatedAt: new Date().toISOString() } : h
        )
      );
    },
    [update]
  );

  const completeTask = useCallback(
    (id: string) => {
      update(prev =>
        prev.map(h =>
          h.id === id ? { ...h, taskCompleted: true, updatedAt: new Date().toISOString() } : h
        )
      );
    },
    [update]
  );

  const setManualStatus = useCallback(
    (id: string, status: HypothesisStatus, note?: string) => {
      update(prev =>
        prev.map(h =>
          h.id === id
            ? {
                ...h,
                status,
                manualNote: note,
                updatedAt: new Date().toISOString(),
              }
            : h
        )
      );
    },
    [update]
  );

  const getChildrenSummary = useCallback(
    (parentId: string): ChildrenSummary => {
      const children = validatedHypotheses.filter(h => h.parentId === parentId);
      return {
        supported: children.filter(h => h.status === 'supported').length,
        contradicted: children.filter(h => h.status === 'contradicted').length,
        untested: children.filter(h => h.status === 'untested').length,
        partial: children.filter(h => h.status === 'partial').length,
        total: children.length,
      };
    },
    [validatedHypotheses]
  );

  // --- Improvement Ideas ---

  const addIdea = useCallback(
    (hypothesisId: string, text: string): ImprovementIdea | null => {
      const hypothesis = validatedHypotheses.find(h => h.id === hypothesisId);
      if (!hypothesis) return null;
      const idea = createImprovementIdea(text);
      update(prev =>
        prev.map(h =>
          h.id === hypothesisId
            ? { ...h, ideas: [...(h.ideas ?? []), idea], updatedAt: new Date().toISOString() }
            : h
        )
      );
      return idea;
    },
    [validatedHypotheses, update]
  );

  const updateIdea = useCallback(
    (
      hypothesisId: string,
      ideaId: string,
      updates: Partial<
        Pick<
          ImprovementIdea,
          'text' | 'timeframe' | 'cost' | 'impactOverride' | 'notes' | 'direction' | 'category'
        >
      >
    ) => {
      update(prev =>
        prev.map(h =>
          h.id === hypothesisId && h.ideas
            ? {
                ...h,
                ideas: h.ideas.map(i => (i.id === ideaId ? { ...i, ...updates } : i)),
                updatedAt: new Date().toISOString(),
              }
            : h
        )
      );
    },
    [update]
  );

  const removeIdea = useCallback(
    (hypothesisId: string, ideaId: string) => {
      update(prev =>
        prev.map(h =>
          h.id === hypothesisId && h.ideas
            ? {
                ...h,
                ideas: h.ideas.filter(i => i.id !== ideaId),
                updatedAt: new Date().toISOString(),
              }
            : h
        )
      );
    },
    [update]
  );

  const setIdeaProjection = useCallback(
    (hypothesisId: string, ideaId: string, projection: FindingProjection) => {
      update(prev =>
        prev.map(h =>
          h.id === hypothesisId && h.ideas
            ? {
                ...h,
                ideas: h.ideas.map(i => (i.id === ideaId ? { ...i, projection } : i)),
                updatedAt: new Date().toISOString(),
              }
            : h
        )
      );
    },
    [update]
  );

  const selectIdea = useCallback(
    (hypothesisId: string, ideaId: string, selected: boolean) => {
      update(prev =>
        prev.map(h =>
          h.id === hypothesisId && h.ideas
            ? {
                ...h,
                ideas: h.ideas.map(i => (i.id === ideaId ? { ...i, selected } : i)),
                updatedAt: new Date().toISOString(),
              }
            : h
        )
      );
    },
    [update]
  );

  const setCauseRole = useCallback(
    (hypothesisId: string, role: 'suspected-cause' | 'contributing' | 'ruled-out' | undefined) => {
      update(prev => {
        const now = new Date().toISOString();
        return prev.map(h => {
          if (h.id === hypothesisId) {
            return { ...h, causeRole: role, updatedAt: now };
          }
          return h;
        });
      });
    },
    [update]
  );

  // --- Question Lifecycle ---

  const generateInitialQuestions = useCallback(
    (generatedQuestions: GeneratedQuestion[], _issueStatement?: string): Hypothesis[] => {
      const created: Hypothesis[] = [];
      for (const q of generatedQuestions) {
        const h = createHypothesis(q.text, q.factors.length === 1 ? q.factors[0] : undefined);
        // Enrich with question-specific fields
        const enriched: Hypothesis = {
          ...h,
          questionSource: q.source,
          evidence: { rSquaredAdj: q.rSquaredAdj },
          status: q.autoAnswered ? 'contradicted' : 'untested',
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
    (questionId: string, findingId: string, answer: 'supported' | 'contradicted' | 'partial') => {
      update(prev =>
        prev.map(h => {
          if (h.id !== questionId) return h;
          const alreadyLinked = h.linkedFindingIds.includes(findingId);
          return {
            ...h,
            status: answer,
            linkedFindingIds: alreadyLinked
              ? h.linkedFindingIds
              : [...h.linkedFindingIds, findingId],
            updatedAt: new Date().toISOString(),
          };
        })
      );
    },
    [update]
  );

  return {
    hypotheses: validatedHypotheses,
    addHypothesis,
    addSubHypothesis,
    editHypothesis,
    deleteHypothesis,
    linkFinding,
    unlinkFinding,
    getHypothesis,
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
