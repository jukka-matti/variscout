/**
 * investigationStore — Zustand store for findings, questions, and suspected cause hubs
 *
 * Consolidates CRUD from useFindings, useQuestions, and useSuspectedCauses hooks
 * into a single store. No callbacks — persistence will be via store.subscribe().
 * No React imports — pure Zustand, framework-agnostic.
 */

import { create } from 'zustand';
import type {
  Finding,
  FindingContext,
  FindingSource,
  FindingStatus,
  FindingTag,
  FindingAssignee,
  FindingComment,
  FindingProjection,
  FindingOutcome,
  ActionItem,
  PhotoAttachment,
  PhotoUploadStatus,
  CommentAttachment,
  BenchmarkStats,
  Question,
  QuestionStatus,
  QuestionValidationType,
  ImprovementIdea,
  InvestigationCategory,
  SuspectedCause,
  SuspectedCauseEvidence,
} from '@variscout/core';
import {
  createFinding,
  createFindingComment,
  createActionItem,
  createQuestion,
  createImprovementIdea,
  createSuspectedCause,
} from '@variscout/core';

// ============================================================================
// Tree constraints (mirrored from useQuestions.ts)
// ============================================================================

/** Maximum depth of question sub-tree (0 = root, 1 = child, 2 = grandchild) */
export const MAX_QUESTION_DEPTH = 3;

/** Maximum children per parent question */
export const MAX_CHILDREN_PER_PARENT = 8;

// ============================================================================
// State + Actions
// ============================================================================

export interface InvestigationState {
  findings: Finding[];
  questions: Question[];
  suspectedCauses: SuspectedCause[];
  categories: InvestigationCategory[];
  focusedQuestionId: string | null;
}

export interface InvestigationActions {
  // --- Finding actions ---
  addFinding: (
    text: string,
    context: FindingContext,
    source?: FindingSource,
    questionId?: string
  ) => Finding;
  editFinding: (id: string, text: string) => void;
  deleteFinding: (id: string) => void;
  setFindingStatus: (id: string, status: FindingStatus) => void;
  setFindingTag: (id: string, tag: FindingTag | null) => void;
  setFindingAssignee: (id: string, assignee: FindingAssignee | null) => void;
  addFindingComment: (id: string, text: string, author?: string) => FindingComment;
  editFindingComment: (findingId: string, commentId: string, text: string) => void;
  deleteFindingComment: (findingId: string, commentId: string) => void;
  addPhotoToComment: (findingId: string, commentId: string, photo: PhotoAttachment) => void;
  updatePhotoStatus: (
    findingId: string,
    commentId: string,
    photoId: string,
    status: PhotoUploadStatus,
    driveItemId?: string
  ) => void;
  addAttachmentToComment: (
    findingId: string,
    commentId: string,
    attachment: CommentAttachment
  ) => void;
  updateAttachmentStatus: (
    findingId: string,
    commentId: string,
    attachmentId: string,
    status: PhotoUploadStatus,
    driveItemId?: string,
    webUrl?: string
  ) => void;
  linkFindingToQuestion: (
    findingId: string,
    questionId: string,
    validationStatus?: 'supports' | 'contradicts' | 'inconclusive'
  ) => void;
  unlinkFindingFromQuestion: (findingId: string) => void;
  setFindingProjection: (findingId: string, projection: FindingProjection) => void;
  clearFindingProjection: (findingId: string) => void;
  addFindingAction: (
    findingId: string,
    text: string,
    assignee?: FindingAssignee,
    dueDate?: string,
    ideaId?: string
  ) => void;
  updateFindingAction: (
    findingId: string,
    actionId: string,
    updates: Partial<Pick<ActionItem, 'text' | 'assignee' | 'dueDate'>>
  ) => void;
  completeFindingAction: (findingId: string, actionId: string) => void;
  toggleFindingActionComplete: (findingId: string, actionId: string) => void;
  deleteFindingAction: (findingId: string, actionId: string) => void;
  setFindingOutcome: (findingId: string, outcome: FindingOutcome) => void;
  setBenchmark: (findingId: string, stats: BenchmarkStats) => void;
  clearBenchmark: (findingId: string) => void;
  toggleScope: (findingId: string) => void;

  // --- Question actions ---
  addQuestion: (text: string, factor?: string, level?: string) => Question;
  addSubQuestion: (
    parentId: string,
    text: string,
    factor?: string,
    level?: string,
    validationType?: QuestionValidationType
  ) => Question | null;
  editQuestion: (id: string, updates: Partial<Pick<Question, 'text' | 'factor' | 'level'>>) => void;
  deleteQuestion: (id: string) => string[];
  setQuestionStatus: (id: string, status: QuestionStatus) => void;
  linkFindingToQuestionList: (questionId: string, findingId: string) => void;
  unlinkFindingFromQuestionList: (questionId: string, findingId: string) => void;
  addIdea: (questionId: string, text: string) => ImprovementIdea | null;
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
  deleteIdea: (questionId: string, ideaId: string) => void;
  selectIdea: (questionId: string, ideaId: string, selected: boolean) => void;
  updateIdeaProjection: (questionId: string, ideaId: string, projection: FindingProjection) => void;
  setFocusedQuestion: (id: string | null) => void;

  // --- Hub actions ---
  createHub: (name: string, synthesis: string) => SuspectedCause;
  updateHub: (hubId: string, updates: Partial<Pick<SuspectedCause, 'name' | 'synthesis'>>) => void;
  deleteHub: (hubId: string) => void;
  connectQuestionToHub: (hubId: string, questionId: string) => void;
  disconnectQuestionFromHub: (hubId: string, questionId: string) => void;
  connectFindingToHub: (hubId: string, findingId: string) => void;
  disconnectFindingFromHub: (hubId: string, findingId: string) => void;
  setHubStatus: (hubId: string, status: SuspectedCause['status']) => void;
  setHubEvidence: (hubId: string, evidence: SuspectedCauseEvidence) => void;
  resetHubs: (hubs: SuspectedCause[]) => void;

  // --- Category + bulk actions ---
  setCategories: (categories: InvestigationCategory[]) => void;
  loadInvestigationState: (state: Partial<InvestigationState>) => void;
  resetAll: () => void;
}

// ============================================================================
// Helpers
// ============================================================================

function getQuestionDepth(id: string, questions: Question[]): number {
  let depth = 0;
  let current = questions.find(q => q.id === id);
  while (current?.parentId) {
    depth++;
    current = questions.find(q => q.id === current!.parentId);
    if (depth > MAX_QUESTION_DEPTH + 1) break;
  }
  return depth;
}

function collectDescendants(id: string, questions: Question[]): Set<string> {
  const ids = new Set<string>([id]);
  let changed = true;
  while (changed) {
    changed = false;
    for (const q of questions) {
      if (q.parentId && ids.has(q.parentId) && !ids.has(q.id)) {
        ids.add(q.id);
        changed = true;
      }
    }
  }
  return ids;
}

// ============================================================================
// Initial state
// ============================================================================

const initialState: InvestigationState = {
  findings: [],
  questions: [],
  suspectedCauses: [],
  categories: [],
  focusedQuestionId: null,
};

// ============================================================================
// Store
// ============================================================================

export const useInvestigationStore = create<InvestigationState & InvestigationActions>()(
  (set, get) => ({
    ...initialState,

    // ========================================================================
    // Finding actions
    // ========================================================================

    addFinding: (text, context, source?, questionId?) => {
      const finding = createFinding(
        text,
        context.activeFilters,
        context.cumulativeScope,
        context.stats,
        undefined,
        source
      );
      if (questionId) {
        finding.questionId = questionId;
      }
      set(state => ({ findings: [finding, ...state.findings] }));
      return finding;
    },

    editFinding: (id, text) => {
      set(state => ({
        findings: state.findings.map(f => (f.id === id ? { ...f, text } : f)),
      }));
    },

    deleteFinding: id => {
      set(state => ({
        findings: state.findings.filter(f => f.id !== id),
      }));
    },

    setFindingStatus: (id, status) => {
      set(state => ({
        findings: state.findings.map(f =>
          f.id === id ? { ...f, status, statusChangedAt: Date.now() } : f
        ),
      }));
    },

    setFindingTag: (id, tag) => {
      set(state => ({
        findings: state.findings.map(f => (f.id === id ? { ...f, tag: tag ?? undefined } : f)),
      }));
    },

    setFindingAssignee: (id, assignee) => {
      set(state => ({
        findings: state.findings.map(f =>
          f.id === id ? { ...f, assignee: assignee ?? undefined } : f
        ),
      }));
    },

    addFindingComment: (id, text, author?) => {
      const comment = createFindingComment(text, author);
      set(state => ({
        findings: state.findings.map(f =>
          f.id === id ? { ...f, comments: [...f.comments, comment] } : f
        ),
      }));
      return comment;
    },

    editFindingComment: (findingId, commentId, text) => {
      set(state => ({
        findings: state.findings.map(f =>
          f.id === findingId
            ? {
                ...f,
                comments: f.comments.map(c => (c.id === commentId ? { ...c, text } : c)),
              }
            : f
        ),
      }));
    },

    deleteFindingComment: (findingId, commentId) => {
      set(state => ({
        findings: state.findings.map(f =>
          f.id === findingId ? { ...f, comments: f.comments.filter(c => c.id !== commentId) } : f
        ),
      }));
    },

    addPhotoToComment: (findingId, commentId, photo) => {
      set(state => ({
        findings: state.findings.map(f =>
          f.id === findingId
            ? {
                ...f,
                comments: f.comments.map(c =>
                  c.id === commentId ? { ...c, photos: [...(c.photos ?? []), photo] } : c
                ),
              }
            : f
        ),
      }));
    },

    updatePhotoStatus: (findingId, commentId, photoId, status, driveItemId?) => {
      set(state => ({
        findings: state.findings.map(f =>
          f.id === findingId
            ? {
                ...f,
                comments: f.comments.map(c =>
                  c.id === commentId
                    ? {
                        ...c,
                        photos: c.photos?.map(p =>
                          p.id === photoId
                            ? {
                                ...p,
                                uploadStatus: status,
                                ...(driveItemId ? { driveItemId } : {}),
                              }
                            : p
                        ),
                      }
                    : c
                ),
              }
            : f
        ),
      }));
    },

    addAttachmentToComment: (findingId, commentId, attachment) => {
      set(state => ({
        findings: state.findings.map(f =>
          f.id === findingId
            ? {
                ...f,
                comments: f.comments.map(c =>
                  c.id === commentId
                    ? { ...c, attachments: [...(c.attachments ?? []), attachment] }
                    : c
                ),
              }
            : f
        ),
      }));
    },

    updateAttachmentStatus: (findingId, commentId, attachmentId, status, driveItemId?, webUrl?) => {
      set(state => ({
        findings: state.findings.map(f =>
          f.id === findingId
            ? {
                ...f,
                comments: f.comments.map(c =>
                  c.id === commentId
                    ? {
                        ...c,
                        attachments: c.attachments?.map(a =>
                          a.id === attachmentId
                            ? {
                                ...a,
                                uploadStatus: status,
                                ...(driveItemId ? { driveItemId } : {}),
                                ...(webUrl ? { webUrl } : {}),
                              }
                            : a
                        ),
                      }
                    : c
                ),
              }
            : f
        ),
      }));
    },

    linkFindingToQuestion: (findingId, questionId, validationStatus?) => {
      set(state => ({
        findings: state.findings.map(f =>
          f.id === findingId
            ? { ...f, questionId, validationStatus: validationStatus ?? f.validationStatus }
            : f
        ),
      }));
    },

    unlinkFindingFromQuestion: findingId => {
      set(state => ({
        findings: state.findings.map(f =>
          f.id === findingId ? { ...f, questionId: undefined, validationStatus: undefined } : f
        ),
      }));
    },

    setFindingProjection: (findingId, projection) => {
      set(state => ({
        findings: state.findings.map(f => (f.id === findingId ? { ...f, projection } : f)),
      }));
    },

    clearFindingProjection: findingId => {
      set(state => ({
        findings: state.findings.map(f =>
          f.id === findingId ? { ...f, projection: undefined } : f
        ),
      }));
    },

    addFindingAction: (findingId, text, assignee?, dueDate?, ideaId?) => {
      const action = createActionItem(text, assignee, dueDate, ideaId);
      set(state => ({
        findings: state.findings.map(f => {
          if (f.id !== findingId) return f;
          const updated = { ...f, actions: [...(f.actions ?? []), action] };
          // Auto-transition: first action on 'analyzed' → 'improving'
          if (f.status === 'analyzed' && !f.actions?.length) {
            updated.status = 'improving';
            updated.statusChangedAt = Date.now();
          }
          return updated;
        }),
      }));
    },

    updateFindingAction: (findingId, actionId, updates) => {
      set(state => ({
        findings: state.findings.map(f =>
          f.id === findingId
            ? {
                ...f,
                actions: f.actions?.map(a => (a.id === actionId ? { ...a, ...updates } : a)),
              }
            : f
        ),
      }));
    },

    completeFindingAction: (findingId, actionId) => {
      set(state => ({
        findings: state.findings.map(f => {
          if (f.id !== findingId) return f;
          return {
            ...f,
            actions: f.actions?.map(a =>
              a.id === actionId ? { ...a, completedAt: Date.now() } : a
            ),
          };
        }),
      }));
    },

    toggleFindingActionComplete: (findingId, actionId) => {
      set(state => ({
        findings: state.findings.map(f => {
          if (f.id !== findingId) return f;
          return {
            ...f,
            actions: f.actions?.map(a => {
              if (a.id !== actionId) return a;
              return a.completedAt
                ? { ...a, completedAt: undefined }
                : { ...a, completedAt: Date.now() };
            }),
          };
        }),
      }));
    },

    deleteFindingAction: (findingId, actionId) => {
      set(state => ({
        findings: state.findings.map(f =>
          f.id === findingId ? { ...f, actions: f.actions?.filter(a => a.id !== actionId) } : f
        ),
      }));
    },

    setFindingOutcome: (findingId, outcome) => {
      set(state => ({
        findings: state.findings.map(f => {
          if (f.id !== findingId) return f;
          const updated = { ...f, outcome };
          // Auto-transition: outcome set + all actions complete → 'resolved'
          const allDone = updated.actions?.length && updated.actions.every(a => a.completedAt);
          if (allDone && updated.status === 'improving') {
            updated.status = 'resolved';
            updated.statusChangedAt = Date.now();
          }
          return updated;
        }),
      }));
    },

    setBenchmark: (findingId, stats) => {
      set(state => ({
        findings: state.findings.map(f => {
          if (f.id === findingId) {
            return { ...f, role: 'benchmark' as const, benchmarkStats: stats };
          }
          // Clear previous benchmark
          if (f.role === 'benchmark') {
            return { ...f, role: undefined, benchmarkStats: undefined };
          }
          return f;
        }),
      }));
    },

    clearBenchmark: findingId => {
      set(state => ({
        findings: state.findings.map(f => {
          if (f.id !== findingId) return f;
          return { ...f, role: undefined, benchmarkStats: undefined };
        }),
      }));
    },

    toggleScope: findingId => {
      set(state => ({
        findings: state.findings.map(f => {
          if (f.id !== findingId) return f;
          // Cycle: undefined → true → false → undefined
          const nextScoped = f.scoped === undefined ? true : f.scoped === true ? false : undefined;
          return { ...f, scoped: nextScoped };
        }),
      }));
    },

    // ========================================================================
    // Question actions
    // ========================================================================

    addQuestion: (text, factor?, level?) => {
      const question = createQuestion(text, factor, level);
      set(state => ({ questions: [...state.questions, question] }));
      return question;
    },

    addSubQuestion: (parentId, text, factor?, level?, validationType?) => {
      const { questions } = get();
      const parent = questions.find(q => q.id === parentId);
      if (!parent) return null;

      // Check depth constraint
      const parentDepth = getQuestionDepth(parentId, questions);
      if (parentDepth >= MAX_QUESTION_DEPTH - 1) return null;

      // Check children count constraint
      const childCount = questions.filter(q => q.parentId === parentId).length;
      if (childCount >= MAX_CHILDREN_PER_PARENT) return null;

      const question = createQuestion(text, factor, level, parentId, validationType);
      set(state => ({ questions: [...state.questions, question] }));
      return question;
    },

    editQuestion: (id, updates) => {
      set(state => ({
        questions: state.questions.map(q =>
          q.id === id ? { ...q, ...updates, updatedAt: new Date().toISOString() } : q
        ),
      }));
    },

    deleteQuestion: id => {
      const { questions } = get();
      const idsToDelete = collectDescendants(id, questions);

      // Collect finding IDs that need unlinking
      const unlinkedFindingIds: string[] = [];
      for (const q of questions) {
        if (idsToDelete.has(q.id)) {
          unlinkedFindingIds.push(...q.linkedFindingIds);
        }
      }

      set(state => ({
        questions: state.questions.filter(q => !idsToDelete.has(q.id)),
        // Clear questionId from linked findings
        findings: state.findings.map(f =>
          f.questionId && idsToDelete.has(f.questionId)
            ? { ...f, questionId: undefined, validationStatus: undefined }
            : f
        ),
      }));

      return unlinkedFindingIds;
    },

    setQuestionStatus: (id, status) => {
      set(state => ({
        questions: state.questions.map(q =>
          q.id === id ? { ...q, status, updatedAt: new Date().toISOString() } : q
        ),
      }));
    },

    linkFindingToQuestionList: (questionId, findingId) => {
      set(state => ({
        questions: state.questions.map(q =>
          q.id === questionId && !q.linkedFindingIds.includes(findingId)
            ? {
                ...q,
                linkedFindingIds: [...q.linkedFindingIds, findingId],
                updatedAt: new Date().toISOString(),
              }
            : q
        ),
      }));
    },

    unlinkFindingFromQuestionList: (questionId, findingId) => {
      set(state => ({
        questions: state.questions.map(q =>
          q.id === questionId
            ? {
                ...q,
                linkedFindingIds: q.linkedFindingIds.filter(fid => fid !== findingId),
                updatedAt: new Date().toISOString(),
              }
            : q
        ),
      }));
    },

    addIdea: (questionId, text) => {
      const { questions } = get();
      const question = questions.find(q => q.id === questionId);
      if (!question) return null;
      const idea = createImprovementIdea(text);
      set(state => ({
        questions: state.questions.map(q =>
          q.id === questionId
            ? { ...q, ideas: [...(q.ideas ?? []), idea], updatedAt: new Date().toISOString() }
            : q
        ),
      }));
      return idea;
    },

    updateIdea: (questionId, ideaId, updates) => {
      set(state => ({
        questions: state.questions.map(q =>
          q.id === questionId && q.ideas
            ? {
                ...q,
                ideas: q.ideas.map(i => (i.id === ideaId ? { ...i, ...updates } : i)),
                updatedAt: new Date().toISOString(),
              }
            : q
        ),
      }));
    },

    deleteIdea: (questionId, ideaId) => {
      set(state => ({
        questions: state.questions.map(q =>
          q.id === questionId && q.ideas
            ? {
                ...q,
                ideas: q.ideas.filter(i => i.id !== ideaId),
                updatedAt: new Date().toISOString(),
              }
            : q
        ),
      }));
    },

    selectIdea: (questionId, ideaId, selected) => {
      set(state => ({
        questions: state.questions.map(q =>
          q.id === questionId && q.ideas
            ? {
                ...q,
                ideas: q.ideas.map(i => (i.id === ideaId ? { ...i, selected } : i)),
                updatedAt: new Date().toISOString(),
              }
            : q
        ),
      }));
    },

    updateIdeaProjection: (questionId, ideaId, projection) => {
      set(state => ({
        questions: state.questions.map(q =>
          q.id === questionId && q.ideas
            ? {
                ...q,
                ideas: q.ideas.map(i => (i.id === ideaId ? { ...i, projection } : i)),
                updatedAt: new Date().toISOString(),
              }
            : q
        ),
      }));
    },

    setFocusedQuestion: id => {
      set({ focusedQuestionId: id });
    },

    // ========================================================================
    // Hub actions
    // ========================================================================

    createHub: (name, synthesis) => {
      const hub = createSuspectedCause(name, synthesis);
      set(state => ({ suspectedCauses: [...state.suspectedCauses, hub] }));
      return hub;
    },

    updateHub: (hubId, updates) => {
      set(state => ({
        suspectedCauses: state.suspectedCauses.map(h =>
          h.id === hubId ? { ...h, ...updates, updatedAt: new Date().toISOString() } : h
        ),
      }));
    },

    deleteHub: hubId => {
      set(state => ({
        suspectedCauses: state.suspectedCauses.filter(h => h.id !== hubId),
      }));
    },

    connectQuestionToHub: (hubId, questionId) => {
      set(state => ({
        suspectedCauses: state.suspectedCauses.map(h => {
          if (h.id !== hubId) return h;
          if (h.questionIds.includes(questionId)) return h;
          return {
            ...h,
            questionIds: [...h.questionIds, questionId],
            updatedAt: new Date().toISOString(),
          };
        }),
      }));
    },

    disconnectQuestionFromHub: (hubId, questionId) => {
      set(state => ({
        suspectedCauses: state.suspectedCauses.map(h =>
          h.id !== hubId
            ? h
            : {
                ...h,
                questionIds: h.questionIds.filter(id => id !== questionId),
                updatedAt: new Date().toISOString(),
              }
        ),
      }));
    },

    connectFindingToHub: (hubId, findingId) => {
      set(state => ({
        suspectedCauses: state.suspectedCauses.map(h => {
          if (h.id !== hubId) return h;
          if (h.findingIds.includes(findingId)) return h;
          return {
            ...h,
            findingIds: [...h.findingIds, findingId],
            updatedAt: new Date().toISOString(),
          };
        }),
      }));
    },

    disconnectFindingFromHub: (hubId, findingId) => {
      set(state => ({
        suspectedCauses: state.suspectedCauses.map(h =>
          h.id !== hubId
            ? h
            : {
                ...h,
                findingIds: h.findingIds.filter(id => id !== findingId),
                updatedAt: new Date().toISOString(),
              }
        ),
      }));
    },

    setHubStatus: (hubId, status) => {
      set(state => ({
        suspectedCauses: state.suspectedCauses.map(h =>
          h.id !== hubId ? h : { ...h, status, updatedAt: new Date().toISOString() }
        ),
      }));
    },

    setHubEvidence: (hubId, evidence) => {
      set(state => ({
        suspectedCauses: state.suspectedCauses.map(h =>
          h.id !== hubId ? h : { ...h, evidence, updatedAt: new Date().toISOString() }
        ),
      }));
    },

    resetHubs: hubs => {
      set({ suspectedCauses: hubs });
    },

    // ========================================================================
    // Category + bulk actions
    // ========================================================================

    setCategories: categories => {
      set({ categories });
    },

    loadInvestigationState: partial => {
      set(state => ({
        findings: partial.findings ?? state.findings,
        questions: partial.questions ?? state.questions,
        suspectedCauses: partial.suspectedCauses ?? state.suspectedCauses,
        categories: partial.categories ?? state.categories,
      }));
    },

    resetAll: () => {
      set(initialState);
    },
  })
);

/** Get the initial state (for test resets) */
export function getInvestigationInitialState(): InvestigationState {
  return { ...initialState };
}
