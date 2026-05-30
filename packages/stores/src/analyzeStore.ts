/**
 * analyzeStore — Zustand store for findings, hypotheses, scopes, and causal links
 *
 * Consolidates CRUD from useFindings, useHypotheses hooks into a single store.
 * No callbacks — persistence will be via store.subscribe().
 * No React imports — pure Zustand, framework-agnostic.
 *
 * ADR-085: Questions retired; ProblemStatementScope is the first-class WHERE.
 *          Ideas re-homed to Hypothesis.ideas (keyed by hypothesisId).
 *          Per-scope gateNode replaces the top-level problemContributionTree.
 */

import { create } from 'zustand';
import { useProjectStore } from './projectStore';
import { useCanvasViewportStore } from './canvasViewportStore';
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
  ImprovementIdea,
  AnalyzeCategory,
  Hypothesis,
  HypothesisEvidence,
  CausalLink,
  GateNode,
  ProblemStatementScope,
  ConditionLeaf,
} from '@variscout/core';
import {
  createFinding,
  createFindingComment,
  createActionItem,
  createImprovementIdea,
  createHypothesis,
  createCausalLink,
  createProblemStatementScope,
  insertHubAsAndChild,
  type GatePath,
} from '@variscout/core';
import { computeScopeWhatIfProjection } from '@variscout/core/variation';

export const STORE_LAYER = 'document' as const;

type HypothesisUpdate = Partial<
  Pick<Hypothesis, 'name' | 'synthesis' | 'status' | 'nextMove' | 'counterFindingIds'>
>;

// ============================================================================
// State + Actions
// ============================================================================

export interface AnalyzeState {
  findings: Finding[];
  hypotheses: Hypothesis[];
  causalLinks: CausalLink[];
  categories: AnalyzeCategory[];
  /** First-class WHERE entities (ADR-085). Each scope owns its own gateNode. */
  scopes: ProblemStatementScope[];
}

export interface AnalyzeActions {
  // --- Finding actions ---
  addFinding: (text: string, context: FindingContext, source?: FindingSource) => Finding;
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

  // --- Scope actions (ADR-085 — first-class WHERE) ---
  addScope: (
    investigationId: string,
    outcome: string,
    predicates?: ConditionLeaf[],
    hypothesisIds?: string[]
  ) => ProblemStatementScope;
  updateScope: (
    scopeId: string,
    patch: Partial<Omit<ProblemStatementScope, 'id' | 'createdAt' | 'deletedAt'>>
  ) => void;
  removeScope: (scopeId: string) => void;
  addHypothesisToScope: (scopeId: string, hypothesisId: string) => void;
  /**
   * IM-5: recompute and persist the scope's `whatIfProjection` (projected overall
   * Cpk if the scope's drilled condition were fixed) from the live project data.
   *
   * Pulls `rawData` + per-outcome specs from `useProjectStore`, runs the What-If
   * simulation (`computeScopeWhatIfProjection`, which reuses
   * `computeCumulativeProjection`), and patches the scope via `updateScope`.
   * Sets `whatIfProjection` to `undefined` when the projection is unavailable
   * (no specs / insufficient data) so a stale value is never left behind.
   * No-op for an unknown scope id. ADR-088 #3; nothing is multiplied across levels.
   */
  recomputeScopeWhatIf: (scopeId: string) => void;

  // --- Hub actions ---
  createHub: (name: string, synthesis: string) => Hypothesis;
  /**
   * Create a new Hypothesis hub from a finding. The hub is seeded with a
   * default name derived from the finding's text (truncated), linked to the
   * finding, and returned. Returns null if the finding doesn't exist.
   */
  createHubFromFinding: (findingId: string) => Hypothesis | null;
  updateHub: (hubId: string, updates: HypothesisUpdate) => void;
  deleteHub: (hubId: string) => void;
  connectFindingToHub: (hubId: string, findingId: string) => void;
  disconnectFindingFromHub: (hubId: string, findingId: string) => void;
  setHubStatus: (hubId: string, status: Hypothesis['status']) => void;
  setHubEvidence: (hubId: string, evidence: HypothesisEvidence) => void;
  resetHubs: (hubs: Hypothesis[]) => void;
  /**
   * Append a comment to a hub (Investigation Wall team discussion).
   * Optimistically updates the hub's `comments` array, then POSTs to
   * /api/hub-comments/append. On HTTP failure, enqueues the comment to
   * canvasViewportStore.pendingComments for retry by the SSE reconnect flow.
   *
   * Returns the locally generated FindingComment so callers can render
   * immediately without waiting for the network round-trip.
   */
  addHubComment: (hubId: string, text: string, author?: string) => Promise<FindingComment>;

  // --- Ideas actions (F2 — keyed by hypothesisId, live on Hypothesis.ideas) ---
  addIdea: (hypothesisId: string, text: string) => ImprovementIdea | null;
  updateIdea: (
    hypothesisId: string,
    ideaId: string,
    updates: Partial<
      Pick<
        ImprovementIdea,
        'text' | 'timeframe' | 'cost' | 'impactOverride' | 'notes' | 'direction'
      >
    >
  ) => void;
  deleteIdea: (hypothesisId: string, ideaId: string) => void;
  selectIdea: (hypothesisId: string, ideaId: string, selected: boolean) => void;
  updateIdeaProjection: (
    hypothesisId: string,
    ideaId: string,
    projection: FindingProjection
  ) => void;

  // --- Causal link actions ---
  addCausalLink: (
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
  ) => CausalLink | null;
  removeCausalLink: (id: string) => void;
  updateCausalLink: (
    id: string,
    updates: Partial<
      Pick<
        CausalLink,
        'whyStatement' | 'direction' | 'evidenceType' | 'strength' | 'fromLevel' | 'toLevel'
      >
    >
  ) => void;
  linkFindingToCausalLink: (linkId: string, findingId: string) => void;
  unlinkFindingFromCausalLink: (linkId: string, findingId: string) => void;

  // --- Category + bulk actions ---
  setCategories: (categories: AnalyzeCategory[]) => void;
  loadAnalyzeState: (state: Partial<AnalyzeState>) => void;
  resetAll: () => void;

  // --- Investigation Wall (per-scope gateNode) ---
  /**
   * Set the contribution tree for a specific scope. Pass `undefined` to clear.
   * Terminology: "contribution tree", never "root cause" (P5 amended).
   */
  setScopeGateNode: (scopeId: string, tree: GateNode | undefined) => void;
  /**
   * Compose a hub into a scope's contribution tree at `path` via AND.
   * No-op if the scope's gateNode is undefined — caller must initialize via
   * `setScopeGateNode` first. Delegates to `insertHubAsAndChild` from
   * `@variscout/core/findings`.
   */
  composeScopeGate: (scopeId: string, path: GatePath, hubId: string) => void;
}

// ============================================================================
// Helpers
// ============================================================================

/**
 * Simple DFS cycle detection for the causal DAG.
 * Returns true if adding an edge fromFactor→toFactor would create a cycle.
 */
function wouldCreateCycle(links: CausalLink[], fromFactor: string, toFactor: string): boolean {
  const visited = new Set<string>();
  const stack = [toFactor];
  while (stack.length > 0) {
    const current = stack.pop()!;
    if (current === fromFactor) return true;
    if (visited.has(current)) continue;
    visited.add(current);
    for (const link of links) {
      if (link.fromFactor === current) stack.push(link.toFactor);
    }
  }
  return false;
}

// ============================================================================
// Initial state
// ============================================================================

const initialState: AnalyzeState = {
  findings: [],
  hypotheses: [],
  causalLinks: [],
  categories: [],
  scopes: [],
};

// ============================================================================
// Store
// ============================================================================

export const useAnalyzeStore = create<AnalyzeState & AnalyzeActions>()((set, get) => ({
  ...initialState,

  // ========================================================================
  // Finding actions
  // ========================================================================

  addFinding: (text, context, source?) => {
    const finding = createFinding(
      text,
      context.activeFilters,
      context.cumulativeScope,
      context.stats,
      undefined,
      source,
      'general-unassigned' // TODO(F6): pass active investigationId when multi-investigation is first-class
    );
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
      // Remove deleted finding ID from causal link references
      causalLinks: state.causalLinks.map(l => {
        if (!l.findingIds.includes(id)) return l;
        return {
          ...l,
          findingIds: l.findingIds.filter(fid => fid !== id),
          updatedAt: Date.now(),
        };
      }),
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
    const comment = createFindingComment(text, id, 'finding', author);
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

  setFindingProjection: (findingId, projection) => {
    set(state => ({
      findings: state.findings.map(f => (f.id === findingId ? { ...f, projection } : f)),
    }));
  },

  clearFindingProjection: findingId => {
    set(state => ({
      findings: state.findings.map(f => (f.id === findingId ? { ...f, projection: undefined } : f)),
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
          actions: f.actions?.map(a => (a.id === actionId ? { ...a, completedAt: Date.now() } : a)),
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
  // Scope actions (ADR-085 — first-class WHERE)
  // ========================================================================

  addScope: (investigationId, outcome, predicates?, hypothesisIds?) => {
    const scope = createProblemStatementScope(investigationId, outcome, predicates, hypothesisIds);
    set(state => ({ scopes: [...state.scopes, scope] }));
    return scope;
  },

  updateScope: (scopeId, patch) => {
    set(state => ({
      scopes: state.scopes.map(s =>
        s.id === scopeId ? { ...s, ...patch, updatedAt: Date.now() } : s
      ),
    }));
  },

  removeScope: scopeId => {
    set(state => ({
      scopes: state.scopes.filter(s => s.id !== scopeId),
    }));
  },

  addHypothesisToScope: (scopeId, hypothesisId) => {
    set(state => ({
      scopes: state.scopes.map(s => {
        if (s.id !== scopeId) return s;
        if (s.hypothesisIds.includes(hypothesisId)) return s;
        return {
          ...s,
          hypothesisIds: [...s.hypothesisIds, hypothesisId],
          updatedAt: Date.now(),
        };
      }),
    }));
  },

  recomputeScopeWhatIf: scopeId => {
    const scope = get().scopes.find(s => s.id === scopeId);
    if (!scope) return;

    // Pull the live project data imperatively (cross-store read is permitted;
    // reactive subscriptions are not). The scope owns its own outcome, so prefer
    // the per-outcome spec entry, falling back to the project-wide specs.
    const { rawData, specs, measureSpecs } = useProjectStore.getState();
    const outcomeSpecs = measureSpecs[scope.outcome] ?? specs;

    // What-If simulation (ADR-088 #3): reuse computeScopeWhatIfProjection →
    // computeCumulativeProjection. Returns null when unprojectable; we store
    // `undefined` so a stale number is never left behind.
    const projected = computeScopeWhatIfProjection(
      scope.predicates,
      rawData,
      scope.outcome,
      outcomeSpecs
    );

    get().updateScope(scopeId, { whatIfProjection: projected ?? undefined });
  },

  // ========================================================================
  // Hub actions
  // ========================================================================

  createHub: (name, synthesis) => {
    const hub = createHypothesis(name, synthesis);
    set(state => ({ hypotheses: [...state.hypotheses, hub] }));
    return hub;
  },

  createHubFromFinding: findingId => {
    const finding = get().findings.find(f => f.id === findingId);
    if (!finding) return null;
    const excerpt = finding.text.trim().slice(0, 80);
    const name = excerpt.length > 0 ? `Suspected mechanism: ${excerpt}` : 'New mechanism branch';
    const hub = createHypothesis(name, '', [findingId]);
    set(state => ({ hypotheses: [...state.hypotheses, hub] }));
    return hub;
  },

  updateHub: (hubId, updates) => {
    set(state => ({
      hypotheses: state.hypotheses.map(h =>
        h.id === hubId ? { ...h, ...updates, updatedAt: Date.now() } : h
      ),
    }));
  },

  deleteHub: hubId => {
    set(state => ({
      hypotheses: state.hypotheses.filter(h => h.id !== hubId),
      // Clear hypothesisId from causal links that reference the deleted hub
      causalLinks: state.causalLinks.map(l =>
        l.hypothesisId === hubId ? { ...l, hypothesisId: undefined, updatedAt: Date.now() } : l
      ),
      // Remove hub from all scope hypothesisIds lists
      scopes: state.scopes.map(s => {
        if (!s.hypothesisIds.includes(hubId)) return s;
        return {
          ...s,
          hypothesisIds: s.hypothesisIds.filter((id: string) => id !== hubId),
          updatedAt: Date.now(),
        };
      }),
    }));
  },

  connectFindingToHub: (hubId, findingId) => {
    set(state => ({
      hypotheses: state.hypotheses.map(h => {
        if (h.id !== hubId) return h;
        if (h.findingIds.includes(findingId)) return h;
        return {
          ...h,
          findingIds: [...h.findingIds, findingId],
          updatedAt: Date.now(),
        };
      }),
    }));
  },

  disconnectFindingFromHub: (hubId, findingId) => {
    set(state => ({
      hypotheses: state.hypotheses.map(h =>
        h.id !== hubId
          ? h
          : {
              ...h,
              findingIds: h.findingIds.filter(id => id !== findingId),
              updatedAt: Date.now(),
            }
      ),
    }));
  },

  setHubStatus: (hubId, status) => {
    set(state => ({
      hypotheses: state.hypotheses.map(h =>
        h.id !== hubId ? h : { ...h, status, updatedAt: Date.now() }
      ),
    }));
  },

  setHubEvidence: (hubId, evidence) => {
    set(state => ({
      hypotheses: state.hypotheses.map(h =>
        h.id !== hubId ? h : { ...h, evidence, updatedAt: Date.now() }
      ),
    }));
  },

  resetHubs: hubs => {
    set({ hypotheses: hubs });
  },

  addHubComment: async (hubId, text, author) => {
    // 1. Build the comment locally so optimistic append + server payload
    //    share the same id — keeps the SSE echo idempotent (server dedupes
    //    by id, so the echo that fans back via the stream is a no-op).
    const comment = createFindingComment(text, hubId, 'hypothesis', author);

    // 2. Optimistic update: append to the hub's comments array.
    set(state => ({
      hypotheses: state.hypotheses.map(h =>
        h.id === hubId
          ? {
              ...h,
              comments: [...(h.comments ?? []), comment],
              updatedAt: Date.now(),
            }
          : h
      ),
    }));

    // 3. Fire-and-track: POST to the server. On failure, push to the
    //    pendingComments queue so the SSE reconnect flow can drain it.
    const projectId = useProjectStore.getState().projectId;
    if (!projectId) {
      // PWA / no-project paths: optimistic-only, comment stays local.
      return comment;
    }

    try {
      const res = await fetch('/api/hub-comments/append', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          hubId,
          id: comment.id,
          text: comment.text,
          author: comment.author,
        }),
      });
      if (!res.ok) {
        useCanvasViewportStore.getState().enqueuePendingComment({
          scope: 'hub',
          targetId: hubId,
          text: comment.text,
          author: comment.author,
          localId: comment.id,
          createdAt: comment.createdAt,
        });
      }
    } catch {
      useCanvasViewportStore.getState().enqueuePendingComment({
        scope: 'hub',
        targetId: hubId,
        text: comment.text,
        author: comment.author,
        localId: comment.id,
        createdAt: comment.createdAt,
      });
    }

    return comment;
  },

  // ========================================================================
  // Ideas actions (F2 — keyed by hypothesisId, live on Hypothesis.ideas)
  // ========================================================================

  addIdea: (hypothesisId, text) => {
    const { hypotheses } = get();
    const hypothesis = hypotheses.find(h => h.id === hypothesisId);
    if (!hypothesis) return null;
    const idea = createImprovementIdea(text);
    set(state => ({
      hypotheses: state.hypotheses.map(h =>
        h.id === hypothesisId
          ? { ...h, ideas: [...(h.ideas ?? []), idea], updatedAt: Date.now() }
          : h
      ),
    }));
    return idea;
  },

  updateIdea: (hypothesisId, ideaId, updates) => {
    set(state => ({
      hypotheses: state.hypotheses.map(h =>
        h.id === hypothesisId && h.ideas
          ? {
              ...h,
              ideas: h.ideas.map(i => (i.id === ideaId ? { ...i, ...updates } : i)),
              updatedAt: Date.now(),
            }
          : h
      ),
    }));
  },

  deleteIdea: (hypothesisId, ideaId) => {
    set(state => ({
      hypotheses: state.hypotheses.map(h =>
        h.id === hypothesisId && h.ideas
          ? {
              ...h,
              ideas: h.ideas.filter(i => i.id !== ideaId),
              updatedAt: Date.now(),
            }
          : h
      ),
    }));
  },

  selectIdea: (hypothesisId, ideaId, selected) => {
    set(state => ({
      hypotheses: state.hypotheses.map(h =>
        h.id === hypothesisId && h.ideas
          ? {
              ...h,
              ideas: h.ideas.map(i => (i.id === ideaId ? { ...i, selected } : i)),
              updatedAt: Date.now(),
            }
          : h
      ),
    }));
  },

  updateIdeaProjection: (hypothesisId, ideaId, projection) => {
    set(state => ({
      hypotheses: state.hypotheses.map(h =>
        h.id === hypothesisId && h.ideas
          ? {
              ...h,
              ideas: h.ideas.map(i => (i.id === ideaId ? { ...i, projection } : i)),
              updatedAt: Date.now(),
            }
          : h
      ),
    }));
  },

  // ========================================================================
  // Causal link actions
  // ========================================================================

  addCausalLink: (fromFactor, toFactor, whyStatement, options?) => {
    const { causalLinks } = get();
    if (wouldCreateCycle(causalLinks, fromFactor, toFactor)) return null;
    const link = createCausalLink(fromFactor, toFactor, whyStatement, options);
    set(state => ({ causalLinks: [...state.causalLinks, link] }));
    return link;
  },

  removeCausalLink: id => {
    set(state => ({
      causalLinks: state.causalLinks.filter(l => l.id !== id),
    }));
  },

  updateCausalLink: (id, updates) => {
    set(state => ({
      causalLinks: state.causalLinks.map(l =>
        l.id === id ? { ...l, ...updates, updatedAt: Date.now() } : l
      ),
    }));
  },

  linkFindingToCausalLink: (linkId, findingId) => {
    set(state => ({
      causalLinks: state.causalLinks.map(l => {
        if (l.id !== linkId) return l;
        if (l.findingIds.includes(findingId)) return l;
        return {
          ...l,
          findingIds: [...l.findingIds, findingId],
          updatedAt: Date.now(),
        };
      }),
    }));
  },

  unlinkFindingFromCausalLink: (linkId, findingId) => {
    set(state => ({
      causalLinks: state.causalLinks.map(l =>
        l.id !== linkId
          ? l
          : {
              ...l,
              findingIds: l.findingIds.filter(id => id !== findingId),
              updatedAt: Date.now(),
            }
      ),
    }));
  },

  // ========================================================================
  // Category + bulk actions
  // ========================================================================

  setCategories: categories => {
    set({ categories });
  },

  loadAnalyzeState: partial => {
    set(state => ({
      findings: partial.findings ?? state.findings,
      hypotheses: partial.hypotheses ?? state.hypotheses,
      causalLinks: partial.causalLinks ?? state.causalLinks,
      categories: partial.categories ?? state.categories,
      scopes: partial.scopes ?? state.scopes,
    }));
  },

  resetAll: () => {
    set(initialState);
  },

  // ========================================================================
  // Investigation Wall actions (per-scope gateNode)
  // ========================================================================

  setScopeGateNode: (scopeId, tree) => {
    set(state => ({
      scopes: state.scopes.map(s =>
        s.id === scopeId ? { ...s, gateNode: tree, updatedAt: Date.now() } : s
      ),
    }));
  },

  composeScopeGate: (scopeId, path, hubId) =>
    set(state => {
      const scope = state.scopes.find(s => s.id === scopeId);
      if (!scope) return {};
      const current = scope.gateNode;
      // Tree must be initialized first — silent no-op matches the
      // UX contract (drag-drop fires frequently; we don't want to
      // create an implicit root).
      if (!current) return {};
      const next = insertHubAsAndChild(current, path, hubId);
      if (next === current) return {};
      return {
        scopes: state.scopes.map(s =>
          s.id === scopeId ? { ...s, gateNode: next, updatedAt: Date.now() } : s
        ),
      };
    }),
}));

/** Get the initial state (for test resets) */
export function getAnalyzeInitialState(): AnalyzeState {
  return { ...initialState };
}
