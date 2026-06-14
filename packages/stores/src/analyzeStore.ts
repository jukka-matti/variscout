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
  CategoricalFilterInput,
  DisconfirmationAttempt,
} from '@variscout/core';
import type { FindingEvidenceType } from '@variscout/core/findings';
import {
  createConsultation as consultationFactory,
  createConsultationQuestion,
  createConsultationResponse,
  createProposedInsight,
  type Consultation,
  type ConsultationAnchor,
  type ProposedInsightKind,
} from '@variscout/core/consultations';
import {
  createFinding,
  createFindingComment,
  createActionItem,
  createImprovementIdea,
  createHypothesis,
  createCausalLink,
  createProblemStatementScope,
  buildConditionFromCategoricalFilters,
  predicateSetKey,
  insertHubAsAndChild,
  type GatePath,
} from '@variscout/core';
import { deriveConditionFromFindingSource } from '@variscout/core/findings';
import { computeScopeWhatIfProjection } from '@variscout/core/variation';

export const STORE_LAYER = 'document' as const;

type HypothesisUpdate = Partial<
  Pick<
    Hypothesis,
    'name' | 'synthesis' | 'status' | 'nextMove' | 'counterFindingIds' | 'supersededByHypothesisId'
  >
>;

function findConditionColumnForCategory(
  activeFilters: FindingContext['activeFilters'],
  category: string
): string | undefined {
  const match = Object.entries(activeFilters).find(([, values]) =>
    values.some(value => String(value) === category)
  );
  return match?.[0];
}

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
  /** Consultation loop entities (CL-1). */
  consultations: Consultation[];
}

export interface AnalyzeActions {
  // --- Finding actions ---
  addFinding: (
    text: string,
    context: FindingContext,
    source?: FindingSource,
    scopeId?: ProblemStatementScope['id'],
    originStepId?: string,
    evidenceType?: FindingEvidenceType
  ) => Finding;
  editFinding: (id: string, text: string) => void;
  editFindingEvidenceType: (id: string, evidenceType: FindingEvidenceType) => void;
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
  /**
   * Set a finding's typed validation classification (FE-2a one-tap evaluate):
   * 'supports' | 'contradicts' | 'inconclusive'. Optionally stamps `refutes`.
   * Drives the Wall clue split + the Survey gate; never auto-run.
   */
  setFindingValidation: (
    findingId: string,
    validationStatus: 'supports' | 'contradicts' | 'inconclusive',
    refutes?: boolean
  ) => void;
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
  /** PR-CS-6 Edge 1 (PO-6): stamp a finding-level action as copied into a project tracker. */
  promoteFindingAction: (findingId: string, actionId: string, projectId: string) => void;
  setFindingOutcome: (findingId: string, outcome: FindingOutcome) => void;
  setBenchmark: (findingId: string, stats: BenchmarkStats) => void;
  clearBenchmark: (findingId: string) => void;
  toggleScope: (findingId: string) => void;

  // --- Scope actions (ADR-085 — first-class WHERE) ---
  addScope: (
    projectId: string,
    outcome: string,
    predicates?: ConditionLeaf[],
    hypothesisIds?: string[]
  ) => ProblemStatementScope;
  /**
   * IM-4a Task 1 — Drill → scope producer. Materialize the active compound
   * drill (the `categoricalFilters` chips) into a persisted
   * `ProblemStatementScope`.
   *
   * Called imperatively by the app on drill-commit (cross-store imperative read
   * is permitted; a reactive subscription from this Document store to the View
   * `analysisScopeStore` is forbidden — so the app passes the chips in).
   *
   * IDEMPOTENT on the predicate set (`predicateSetKey`): re-firing on the same
   * compound condition (regardless of chip order) returns the existing scope
   * rather than creating a duplicate. An empty drill is a no-op and returns
   * `undefined`. Single-value chips become `eq` leaves, multi-value become `in`.
   */
  syncScopeFromDrill: (
    projectId: string,
    outcome: string,
    filters: ReadonlyArray<CategoricalFilterInput>
  ) => ProblemStatementScope | undefined;
  /**
   * ER-4 — Range-capable Explore-side PSS producer.
   *
   * Accepts a flat `ConditionLeaf[]` (may contain range ops: between / gte /
   * lte / lt / gt / neq) instead of chip-filtered categoricals, and materialises
   * a `ProblemStatementScope` from the pill condition.
   *
   * Semantics mirror `syncScopeFromDrill`:
   * - Empty `leaves` → undefined (no-op, no scope created).
   * - IDEMPOTENT: same projectId + outcome + predicateSetKey(leaves) returns the
   *   existing scope id without creating a duplicate (soft-deleted scopes are
   *   excluded from the idempotency check — they trigger a fresh mint).
   * - Returns the scope id string (not the full scope object) so the caller can
   *   pass it to `recomputeScopeWhatIf` without an extra lookup.
   *
   * `syncScopeFromDrill` remains UNTOUCHED — the two producers coexist.
   */
  syncScopeFromCondition: (
    projectId: string,
    outcome: string,
    leaves: ConditionLeaf[]
  ) => string | undefined;
  updateScope: (
    scopeId: string,
    patch: Partial<Omit<ProblemStatementScope, 'id' | 'createdAt' | 'deletedAt'>>
  ) => void;
  removeScope: (scopeId: string) => void;
  addHypothesisToScope: (scopeId: string, hypothesisId: string) => void;
  /**
   * IM-4b Task 5 — soft-delete a scope (sets `deletedAt` to the current
   * timestamp). The scope is retained in the store for the HubRepository
   * tombstone; the presentation layer filters by `!deletedAt`. No-op for an
   * unknown scope id.
   */
  archiveScope: (scopeId: string) => void;
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

  // --- Hub ActionItem task actions (Task 3 IM-4b) ---
  addHypothesisAction: (
    hubId: string,
    text: string,
    assignee?: FindingAssignee,
    dueDate?: string
  ) => ActionItem | null;
  updateHypothesisAction: (
    hubId: string,
    actionId: string,
    patch: Partial<Pick<ActionItem, 'text' | 'assignee' | 'dueDate'>>
  ) => void;
  completeHypothesisAction: (hubId: string, actionId: string) => void;
  toggleHypothesisActionComplete: (hubId: string, actionId: string) => void;
  deleteHypothesisAction: (hubId: string, actionId: string) => void;

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
  /**
   * IM-4a Task 4 — append a falsification attempt to a hypothesis. The caller
   * stamps the attempt's id + timestamps (deterministic — mirrors the
   * MEASUREMENT_PLAN_ADD pattern; no Date.now/RNG inside the store). The derived
   * status (`deriveHypothesisStatus`) then reflects it: a `survived` attempt +
   * ≥2 evidence types makes the derived *advisory* suggestion
   * `evidence-survived-test`; a `pending` attempt holds at
   * `needs-disconfirmation`. Status itself is analyst-owned (CS-10) — this
   * appends the attempt only; it does not set status. No-op for an unknown hub id.
   */
  recordDisconfirmation: (hubId: string, attempt: DisconfirmationAttempt) => void;
  /**
   * Analyst-owned status setter. Writes the analyst-chosen status verbatim to
   * the hypothesis — the derivation (`deriveHypothesisStatus`) is not consulted.
   * The analyst IS the authority; the store stores the value as given.
   * No-op for an unknown hub id.
   */
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
  addHubComment: (
    hubId: string,
    text: string,
    author?: string,
    mentionedUserIds?: string[]
  ) => Promise<FindingComment>;
  /**
   * Edit a comment's text in place on a hypothesis hub.
   * Twin of `editFindingComment`. No-op when hubId or commentId does not exist.
   */
  editHubComment: (hubId: string, commentId: string, text: string) => void;
  /**
   * Remove a comment from a hypothesis hub.
   * Twin of `deleteFindingComment`. No-op when hubId or commentId does not exist.
   */
  deleteHubComment: (hubId: string, commentId: string) => void;

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

  // --- Consultation loop actions (CL-1) ---
  createConsultation: (title: string) => Consultation;
  addConsultationQuestion: (
    consultationId: string,
    text: string,
    anchor?: ConsultationAnchor
  ) => void;
  importResponse: (
    consultationId: string,
    input: {
      source: 'typed' | 'transcript';
      respondentLabel: string;
      rawArtifactRef?: string;
      insights: Array<{ text: string; kind: ProposedInsightKind; questionId?: string }>;
    }
  ) => void;
  acceptInsight: (consultationId: string, insightId: string) => Finding;
  rejectInsight: (consultationId: string, insightId: string) => void;
  /**
   * Edit a pending insight's text in place (analyst correction before accepting).
   * No-op when the consultationId or insightId does not exist.
   * Mirrors editFinding / editHubComment — serialize-safe (plain string).
   */
  editInsight: (consultationId: string, insightId: string, text: string) => void;
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
  consultations: [],
};

// ============================================================================
// Store
// ============================================================================

export const useAnalyzeStore = create<AnalyzeState & AnalyzeActions>()((set, get) => ({
  ...initialState,

  // ========================================================================
  // Finding actions
  // ========================================================================

  addFinding: (text, context, source?, scopeId?, originStepId?, evidenceType?) => {
    const base = createFinding(
      text,
      context.activeFilters,
      context.cumulativeScope,
      context.stats,
      undefined,
      source
    );
    // Durable finding→scope edge (PR-CS-0 Task 7) + finding→step edge
    // (PR-CS-5 Part 2): set post-factory to keep createFinding's positional
    // signature untouched. Optional + back-compat: omit → the field stays absent.
    const finding = {
      ...base,
      context: {
        ...base.context,
        ...(context.yColumn ? { yColumn: context.yColumn } : {}),
      },
      ...(scopeId ? { scopeId } : {}),
      ...(originStepId ? { originStepId } : {}),
      ...(evidenceType ? { evidenceType } : {}),
    };
    set(state => ({ findings: [finding, ...state.findings] }));
    return finding;
  },

  editFinding: (id, text) => {
    set(state => ({
      findings: state.findings.map(f => (f.id === id ? { ...f, text } : f)),
    }));
  },

  editFindingEvidenceType: (id, evidenceType) => {
    set(state => ({
      findings: state.findings.map(f => (f.id === id ? { ...f, evidenceType } : f)),
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

  setFindingValidation: (findingId, validationStatus, refutes) => {
    set(state => ({
      findings: state.findings.map(f =>
        f.id === findingId ? { ...f, validationStatus, refutes: refutes ?? f.refutes } : f
      ),
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

  promoteFindingAction: (findingId, actionId, projectId) => {
    set(state => ({
      findings: state.findings.map(f =>
        f.id === findingId
          ? {
              ...f,
              actions: f.actions?.map(a =>
                a.id === actionId ? { ...a, parentImprovementProjectId: projectId } : a
              ),
            }
          : f
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

  addScope: (projectId, outcome, predicates?, hypothesisIds?) => {
    const scope = createProblemStatementScope(projectId, outcome, predicates, hypothesisIds);
    set(state => ({ scopes: [...state.scopes, scope] }));
    return scope;
  },

  syncScopeFromDrill: (projectId, outcome, filters) => {
    // Reactive-on-condition-change with set-keyed idempotency (see AnalyzeWorkspace.tsx
    // §"Drill → scope spine" comment). Called from a useEffect on [categoricalFilters,
    // outcome] — NOT on an imperative commit gesture. Intermediate scopes accumulate
    // here; stale/superseded ones are pruned via the IM-4b scope rail (SCOPE_ARCHIVE).
    const predicates = buildConditionFromCategoricalFilters(filters);
    // Empty drill → no scope (the active chips ARE the active scope; no chips,
    // no compound WHERE to persist).
    if (predicates.length === 0) return undefined;

    // Idempotency: key on the predicate SET, scoped to this project +
    // outcome. Re-firing on the same compound condition returns the existing
    // scope (regardless of chip order) rather than duplicating it.
    const key = predicateSetKey(predicates);
    const existing = get().scopes.find(
      s =>
        s.projectId === projectId && s.outcome === outcome && predicateSetKey(s.predicates) === key
    );
    if (existing) return existing;

    return get().addScope(projectId, outcome, predicates);
  },

  syncScopeFromCondition: (projectId, outcome, leaves) => {
    // Empty leaves → no scope (no condition to persist).
    if (leaves.length === 0) return undefined;

    // Idempotency: key on the predicate SET (range-capable — predicateSetKey
    // handles between/gte/neq etc. natively). Soft-deleted scopes are excluded:
    // they do not satisfy the idempotency check so a fresh scope is minted.
    const key = predicateSetKey(leaves);
    const existing = get().scopes.find(
      s =>
        !s.deletedAt &&
        s.projectId === projectId &&
        s.outcome === outcome &&
        predicateSetKey(s.predicates) === key
    );
    if (existing) return existing.id;

    const scope = get().addScope(projectId, outcome, leaves);
    return scope.id;
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

  archiveScope: scopeId => {
    const exists = get().scopes.some(s => s.id === scopeId);
    if (!exists) return;
    set(state => ({
      scopes: state.scopes.map(s =>
        s.id === scopeId ? { ...s, deletedAt: Date.now(), updatedAt: Date.now() } : s
      ),
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
    const name = excerpt.length > 0 ? `Suspected cause: ${excerpt}` : 'New suspected cause';
    const condition = finding.source
      ? deriveConditionFromFindingSource(finding.source, {
          groupColumn:
            finding.source.chart === 'boxplot'
              ? findConditionColumnForCategory(
                  finding.context.activeFilters,
                  finding.source.category
                )
              : undefined,
          dimensionColumn:
            finding.source.chart === 'pareto'
              ? findConditionColumnForCategory(
                  finding.context.activeFilters,
                  finding.source.category
                )
              : undefined,
          metricColumn:
            finding.source.chart === 'ichart' || finding.source.chart === 'probability'
              ? finding.context.yColumn
              : undefined,
        })
      : undefined;
    const hub = { ...createHypothesis(name, '', [findingId]), condition };
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

  recordDisconfirmation: (hubId, attempt) => {
    set(state => ({
      hypotheses: state.hypotheses.map(h =>
        h.id !== hubId
          ? h
          : {
              ...h,
              disconfirmationAttempts: [...(h.disconfirmationAttempts ?? []), attempt],
              updatedAt: Date.now(),
            }
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

  setHubStatus: (hubId, status) => {
    set(state => ({
      hypotheses: state.hypotheses.map(h =>
        h.id !== hubId ? h : { ...h, status, updatedAt: Date.now() }
      ),
    }));
  },

  resetHubs: hubs => {
    set({ hypotheses: hubs });
  },

  addHubComment: async (hubId, text, author, mentionedUserIds) => {
    // 1. Build the comment locally so optimistic append + server payload
    //    share the same id — keeps the SSE echo idempotent (server dedupes
    //    by id, so the echo that fans back via the stream is a no-op).
    const comment = createFindingComment(text, hubId, 'hypothesis', author);
    // Attach resolved mention targets (parsed externally via parseMentions).
    if (mentionedUserIds && mentionedUserIds.length > 0) {
      comment.mentionedUserIds = mentionedUserIds;
    }

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
          ...(mentionedUserIds && mentionedUserIds.length > 0 ? { mentionedUserIds } : {}),
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

  editHubComment: (hubId, commentId, text) => {
    set(state => ({
      hypotheses: state.hypotheses.map(h =>
        h.id === hubId
          ? {
              ...h,
              comments: (h.comments ?? []).map(c => (c.id === commentId ? { ...c, text } : c)),
            }
          : h
      ),
    }));
  },

  deleteHubComment: (hubId, commentId) => {
    set(state => ({
      hypotheses: state.hypotheses.map(h =>
        h.id === hubId ? { ...h, comments: (h.comments ?? []).filter(c => c.id !== commentId) } : h
      ),
    }));
  },

  // ========================================================================
  // Hub ActionItem task actions (Task 3 IM-4b) — mirrors Finding action item methods
  // ========================================================================

  addHypothesisAction: (hubId, text, assignee?, dueDate?) => {
    const { hypotheses } = get();
    const hypothesis = hypotheses.find(h => h.id === hubId);
    if (!hypothesis) return null;
    const action = createActionItem(text, assignee, dueDate);
    set(state => ({
      hypotheses: state.hypotheses.map(h =>
        h.id === hubId
          ? { ...h, actions: [...(h.actions ?? []), action], updatedAt: Date.now() }
          : h
      ),
    }));
    return action;
  },

  updateHypothesisAction: (hubId, actionId, patch) => {
    set(state => ({
      hypotheses: state.hypotheses.map(h =>
        h.id === hubId
          ? {
              ...h,
              actions: h.actions?.map(a => (a.id === actionId ? { ...a, ...patch } : a)),
              updatedAt: Date.now(),
            }
          : h
      ),
    }));
  },

  completeHypothesisAction: (hubId, actionId) => {
    set(state => ({
      hypotheses: state.hypotheses.map(h =>
        h.id === hubId
          ? {
              ...h,
              actions: h.actions?.map(a =>
                a.id === actionId ? { ...a, completedAt: Date.now() } : a
              ),
              updatedAt: Date.now(),
            }
          : h
      ),
    }));
  },

  toggleHypothesisActionComplete: (hubId, actionId) => {
    set(state => ({
      hypotheses: state.hypotheses.map(h => {
        if (h.id !== hubId) return h;
        return {
          ...h,
          actions: h.actions?.map(a => {
            if (a.id !== actionId) return a;
            return a.completedAt
              ? { ...a, completedAt: undefined }
              : { ...a, completedAt: Date.now() };
          }),
          updatedAt: Date.now(),
        };
      }),
    }));
  },

  deleteHypothesisAction: (hubId, actionId) => {
    set(state => ({
      hypotheses: state.hypotheses.map(h =>
        h.id === hubId
          ? { ...h, actions: h.actions?.filter(a => a.id !== actionId), updatedAt: Date.now() }
          : h
      ),
    }));
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
      consultations: partial.consultations ?? state.consultations,
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

  // ==========================================================================
  // Consultation loop actions (CL-1)
  // ==========================================================================

  createConsultation: title => {
    const consultation = consultationFactory(title);
    set(state => ({ consultations: [consultation, ...state.consultations] }));
    return consultation;
  },

  addConsultationQuestion: (consultationId, text, anchor) => {
    const question = createConsultationQuestion(text, anchor);
    set(state => ({
      consultations: state.consultations.map(c =>
        c.id === consultationId
          ? { ...c, questions: [...c.questions, question], updatedAt: Date.now() }
          : c
      ),
    }));
  },

  importResponse: (consultationId, input) => {
    const response = createConsultationResponse(
      input.source,
      input.respondentLabel,
      input.rawArtifactRef
    );
    const insights = input.insights.map(i =>
      createProposedInsight(response.id, i.text, i.kind, i.questionId)
    );
    set(state => ({
      consultations: state.consultations.map(c =>
        c.id === consultationId
          ? {
              ...c,
              status: 'responses-imported',
              responses: [...c.responses, response],
              proposedInsights: [...c.proposedInsights, ...insights],
              updatedAt: Date.now(),
            }
          : c
      ),
    }));
  },

  acceptInsight: (consultationId, insightId) => {
    const consultation = get().consultations.find(c => c.id === consultationId);
    const insight = consultation?.proposedInsights.find(i => i.id === insightId);
    if (!consultation || !insight) {
      throw new Error(`acceptInsight: insight ${insightId} not found`);
    }
    // Idempotency guard: already accepted → return the existing Finding without creating a duplicate.
    if (insight.status === 'accepted' && insight.acceptedAs) {
      const existing = get().findings.find(f => f.id === insight.acceptedAs!.id);
      if (existing) return existing;
    }
    // Rejected insight: no-op (creating a Finding for rejected evidence is unsound).
    if (insight.status === 'rejected') {
      return undefined as unknown as Finding;
    }
    const response = consultation.responses.find(r => r.id === insight.responseId);
    const base = createFinding(insight.text, {}, null);
    const finding: Finding = {
      ...base,
      evidenceType: 'expert',
      provenance: {
        kind: 'consultation',
        consultationId,
        responseId: insight.responseId,
        ...(insight.questionId ? { questionId: insight.questionId } : {}),
        respondentLabel: response?.respondentLabel ?? '',
        importedAt: response?.importedAt ?? Date.now(),
      },
    };
    set(state => ({
      findings: [finding, ...state.findings],
      consultations: state.consultations.map(c =>
        c.id === consultationId
          ? {
              ...c,
              proposedInsights: c.proposedInsights.map(i =>
                i.id === insightId
                  ? { ...i, status: 'accepted', acceptedAs: { kind: 'finding', id: finding.id } }
                  : i
              ),
              updatedAt: Date.now(),
            }
          : c
      ),
    }));
    return finding;
  },

  rejectInsight: (consultationId, insightId) => {
    set(state => ({
      consultations: state.consultations.map(c =>
        c.id === consultationId
          ? {
              ...c,
              proposedInsights: c.proposedInsights.map(i =>
                i.id === insightId ? { ...i, status: 'rejected' } : i
              ),
              updatedAt: Date.now(),
            }
          : c
      ),
    }));
  },

  editInsight: (consultationId, insightId, text) => {
    // Only mutate pending insights. Editing an accepted insight would desync the
    // insight text from the already-created Finding snapshot; editing a rejected
    // insight has no effect either way.
    set(state => ({
      consultations: state.consultations.map(c =>
        c.id === consultationId
          ? {
              ...c,
              proposedInsights: c.proposedInsights.map(i =>
                i.id === insightId && i.status === 'pending' ? { ...i, text } : i
              ),
              updatedAt: Date.now(),
            }
          : c
      ),
    }));
  },
}));

/** Get the initial state (for test resets) */
export function getAnalyzeInitialState(): AnalyzeState {
  return { ...initialState };
}

// Expose getInitialState on the store object (consistent with canvasStore pattern).
(useAnalyzeStore as unknown as { getInitialState: () => AnalyzeState }).getInitialState =
  getAnalyzeInitialState;
