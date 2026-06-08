/**
 * HypothesisCardWithPlans — SVG <g> wrapper that renders HypothesisCard plus
 * an inline MeasurementPlan section via foreignObject below the card body.
 *
 * Composition strategy B: wrap, not extend. HypothesisCard's contract is
 * unchanged; measurement-plan affordances live entirely in the extension zone.
 *
 * ACL gate:
 *   - members.length === 0  → open-access (V1 single-user scenario)
 *   - otherwise             → canAccess(currentUserId, members, 'edit-contributions')
 *
 * Measurement plans are contributions per the 2-tier ACL — Lead + Member +
 * Sponsor can add/link plans.
 *
 * Dispatch pattern: callbacks bubble up to parent (WallCanvas → app) exactly
 * as existing onSelectHub / onComposeGate do. No new dispatch mechanism
 * introduced.
 */

import React, { useState } from 'react';
import type {
  Finding,
  ActionItem,
  ImprovementIdea,
  IdeaImpact,
  HypothesisStatus,
} from '@variscout/core';
import type { ConditionLeaf } from '@variscout/core/findings';
import type { MeasurementPlan } from '@variscout/core/measurementPlan';
import type { ProjectMember } from '@variscout/core/projectMembership';
import { canAccess } from '@variscout/core/projectMembership';
import {
  deriveHypothesisActivity,
  displayHypothesisStatus,
  evidenceTypesForHypothesis,
} from '@variscout/core/findings';
import { getMessage } from '@variscout/core/i18n';
import type { MeasurementPlanStatus } from '@variscout/core/measurementPlan';
import { HypothesisCard, type HypothesisCardProps } from './HypothesisCard';
import { MeasurementPlanChip, type MeasurementPlanChipPendingMatch } from './MeasurementPlanChip';
import { AddPlanForm, type StepOption } from './AddPlanForm';
import { LinkFindingPicker } from './LinkFindingPicker';
import { HypothesisComments } from './HypothesisComments';
import { MiniBoxplot } from './MiniBoxplot';
import { MiniScatterFit } from './MiniScatterFit';
import { useWallLocale } from './hooks/useWallLocale';
import ImprovementIdeasSection from '../FindingsLog/ImprovementIdeasSection';

// Card geometry constants (mirrors HypothesisCard internals)
const CARD_W = 280;
const CARD_H = 288;
/**
 * Height of one data-collection-task section per plan (px).
 * Each section contains a header row (~28px) + embedded MeasurementPlanChip
 * row (32px) + padding/gap (~8px) = 68px.
 */
const DATA_COLLECT_ROW_H = 68;
/** Height of the activity header above in-flight rows. */
const ACTIVITY_HEADER_H = 30;
/** Height of one pending break-attempt row. */
const PENDING_ATTEMPT_ROW_H = 44;
/** Height of the stalled activity band. */
const STALLED_ACTIVITY_H = 84;
/** Height of one ActionItem task row in the foreignObject (px). */
const ACTION_ROW_H = 32;
/** Height of the inline add-task form (px). */
const ADD_TASK_FORM_H = 72;
/** Height of the + Add Plan button row (px). */
const ADD_BTN_H = 32;
/** Height of the expanded disconfirmation form (description + verdict + actions). */
const DISCONFIRM_FORM_H = 200;
/**
 * Height of AddPlanForm when expanded (px).
 * The form currently has ~8 fields + 2 textareas (opDef, msaNote) + error row +
 * Save/Cancel — update this value whenever fields are added/removed.
 */
const FORM_H = 660;
/** Vertical gap between card bottom and the plans section (user-space units). */
const PLANS_GAP = 8;
/** Height of the test-plan triad header row (px). */
const TEST_PLAN_HEADER_H = 28;
/** Height of one test-plan factor row (factor + tool + CTA) (px). */
const TEST_PLAN_ROW_H = 40;
/** PR-CS-9 — inline triad chart dimensions (px). */
const TRIAD_CHART_W = 240;
const TRIAD_CHART_H = 56;
/** PR-CS-9 — extra height a triad row gains when it carries an inline chart (chart + gap). */
const TEST_PLAN_CHART_H = 64;
/** FE-2b — extra height added to a triad row whose "Try to break it" is checked
 * (the premortem prediction field + hint). */
const BREAK_IT_EXPANSION_H = 96;
/** FE-2b — extra height for a triad row that surfaces a confound rival prompt. */
const CONFOUND_PROMPT_H = 88;
/** FE-2b — height of the §4.1 soft-caveat band. */
const CAVEAT_H = 40;
/** FE-2b — height of the refute→respawn-sharper band (collapsed CTA / open form). */
const RESPAWN_CTA_H = 32;
const RESPAWN_FORM_H = 132;
/** FE-2b — height of the "superseded by →" anti-amnesia trail text. */
const SUPERSEDED_H = 24;
/** Height of the per-hypothesis What-If block (px). */
const WHATIF_H = 56;
/** L-2 — height of the analyst-set status display summary + override row. */
const STATUS_CONTROL_H = 168;
/** CS-10 — extra height for the advisory suggestion chip when shown. */
const STATUS_CHIP_H = 36;
/** Horizontal offset of the foreignObject from the card's center-top anchor. */
const FO_X = -(CARD_W / 2);
/** Fixed height reserved for the ImprovementIdeasSection foreignObject (px). */
const IDEAS_SECTION_H = 300;
/** Fixed height reserved for the HypothesisComments foreignObject (px). */
const COMMENTS_SECTION_H = 320;

/**
 * CS-10 — the 5 analyst-selectable statuses (free choice — the control offers
 * every state, no gating). Order mirrors the investigation progression.
 */
const STATUS_OPTIONS: ReadonlyArray<HypothesisStatus> = [
  'proposed',
  'evidenced',
  'needs-disconfirmation',
  'evidence-survived-test',
  'refuted',
];

export interface HypothesisCardWithPlansProps extends HypothesisCardProps {
  /** All measurement plans for this hypothesis (non-deleted). */
  plans: MeasurementPlan[];
  /** Project members for ACL checks and owner name resolution. */
  members: ReadonlyArray<ProjectMember>;
  /**
   * Current user's userId (not entity id). Matches ProjectMember.userId.
   * Pass null when unauthenticated.
   */
  currentUserId: string | null;
  /** All findings available on this hypothesis (for the picker). */
  findings: Finding[];
  /**
   * Called when the user saves a new plan.
   * Receives Omit<MeasurementPlan, 'id' | 'createdAt' | 'deletedAt'> — parent
   * stamps id (generateDeterministicId) + timestamps + dispatches MEASUREMENT_PLAN_ADD.
   */
  onAddPlan: (plan: Omit<MeasurementPlan, 'id' | 'createdAt' | 'deletedAt'>) => void;
  /**
   * Called once per finding the user chose to link.
   * Parent dispatches MEASUREMENT_PLAN_LINK_FINDING per call.
   */
  onLinkFinding: (planId: string, findingId: string) => void;
  /**
   * Called when user clicks the edit affordance on a chip.
   * V1: pass-through — parent decides behaviour (edit UI not in this PR).
   */
  onEditPlan: (planId: string) => void;
  /**
   * PR-CS-11 (Task 5) — analyst-owned plan-status setter, threaded to each
   * MeasurementPlanChip. When wired AND the user can edit, every chip renders the
   * 4-state status select (free choice) + the one-click "Mark in-progress" in the
   * pending-match prompt. The app dispatches the status update (Task 6 wires it).
   * Optional — omit to leave the chips status-display-only.
   */
  onSetPlanStatus?: (planId: string, status: MeasurementPlanStatus) => void;
  /**
   * PR-CS-11 (Task 5) — the re-ingest pending matches for THIS hypothesis's
   * plans, keyed by planId. The app resolves these from the engine's
   * `ReingestPendingMatch` descriptors (Task 6). A chip whose plan id is present
   * renders the apply prompt ("Factor … arrived"). Omit/empty → no prompts (the
   * quiet default). Presentational pass-through — the card computes nothing.
   */
  pendingMatchByPlanId?: Record<string, MeasurementPlanChipPendingMatch | undefined>;
  /**
   * PR-CS-11 (Task 5) — dismiss a pending match (called with the descriptor id).
   * Threaded to each chip's ✕. The app drops the match (Task 6). Omit to hide
   * the dismiss control.
   */
  onDismissPendingMatch?: (id: string) => void;
  /**
   * Process steps for the processLocation picker in AddPlanForm.
   * Derived at WallCanvas level from `deriveProcessSteps(processMap)`.
   * Pass `undefined` when processMap is absent; AddPlanForm hides the step picker.
   */
  stepOptions?: StepOption[];
  /**
   * Active drill-chip scope conditions (snapshot) for AddPlanForm's `scope` field.
   * Pass `undefined` to default to `[]`.
   */
  defaultScope?: ConditionLeaf[];
  /**
   * Pre-fill for AddPlanForm's outcome field.
   * Pass `undefined` to default to `''`.
   */
  defaultOutcome?: string;
  /**
   * Task 3 (IM-4b) — called when the user saves a new ActionItem task on this hypothesis.
   * Receives (hypothesisId, text, assignee?). Parent dispatches HYPOTHESIS_ACTION_ADD.
   * When omitted, the "+ Add Task" button is not rendered.
   */
  onAddHypothesisAction?: (hypothesisId: string, text: string) => void;
  /**
   * Task 3 (IM-4b) — called when the user clicks "Mark Done" on an open action item.
   * Receives (hypothesisId, actionId). Parent dispatches HYPOTHESIS_ACTION_COMPLETE.
   */
  onCompleteHypothesisAction?: (hypothesisId: string, actionId: string) => void;
  /**
   * IM-4a — record a falsification attempt against this hypothesis
   * ("we tried to break this — did it hold?"). When provided AND the user has
   * edit-contributions access, the card renders the disconfirmation gesture +
   * inline form. The parent stamps id + attemptedAt + attemptedBy +
   * linkedFindingIds and dispatches HYPOTHESIS_RECORD_DISCONFIRMATION.
   * Omit to hide the gesture entirely.
   */
  onRecordDisconfirmation?: (
    hypothesisId: string,
    input: { description: string; verdict: 'pending' | 'survived' | 'refuted' }
  ) => void;
  /**
   * CS-10 — Analyst-owned status setter. When wired AND the user has edit rights,
   * the card renders (a) the analyst-set status control offering all 5 states as
   * a free choice (no validation, no contradiction warning — owner decision), and
   * (b) the advisory "mark Verified?" suggestion chip when the derivation
   * (`suggestedStatus`) says evidence-survived-test but the analyst has not yet
   * promoted the hub. Picking a state / clicking the chip calls back with the
   * chosen status. Omit to hide both.
   */
  onSetStatus?: (hubId: string, status: HypothesisStatus) => void;
  /** L-3 — render-time activity clock for deterministic tests. Defaults to Date.now(). */
  activityNow?: number;
  /** L-3 — escape action for stalled causes: take the analyst to go-look capture. */
  onGoLook?: (hypothesisId: string) => void;
  /**
   * Task 6 (IM-4b) — IdeaImpact map keyed by ideaId.
   * Passed through to ImprovementIdeasSection for rendering impact badges.
   * Required to mount ImprovementIdeasSection (pass {} when no impacts known).
   */
  ideaImpacts?: Record<string, IdeaImpact | undefined>;
  /**
   * Task 6 (IM-4b) — called when the user clicks "Project idea with What-If".
   * Receives (hypothesisId, ideaId). Wires handleProjectIdea from useAnalyzeOrchestration.
   */
  onProjectIdea?: (hypothesisId: string, ideaId: string) => void;
  /**
   * Task 6 (IM-4b) — called when the user adds a new improvement idea.
   * Receives (hypothesisId, text). When omitted, the add-idea input is hidden.
   */
  onAddIdea?: (hypothesisId: string, text: string) => void;
  /**
   * Task 6 (IM-4b) — called when the user updates an improvement idea.
   */
  onUpdateIdea?: (
    hypothesisId: string,
    ideaId: string,
    updates: Partial<Pick<ImprovementIdea, 'text' | 'timeframe' | 'impactOverride' | 'notes'>>
  ) => void;
  /**
   * Task 6 (IM-4b) — called when the user removes an improvement idea.
   */
  onRemoveIdea?: (hypothesisId: string, ideaId: string) => void;
  /**
   * Task 6 (IM-4b) — called when the user selects/deselects an improvement idea.
   */
  onSelectIdea?: (hypothesisId: string, ideaId: string, selected: boolean) => void;
  /**
   * Task 1 (IM-4b) — called when the user submits a new comment on this hub's
   * team thread. Receives (hubId, text, attachment?). Parent dispatches
   * addHubComment (which runs parseMentions on the text). When omitted, the
   * comment thread is not mounted.
   */
  onAddHubComment?: (hubId: string, text: string, attachment?: File) => void;
  /** Task 1 (IM-4b) — called when the user saves an edited comment. */
  onEditHubComment?: (hubId: string, commentId: string, text: string) => void;
  /** Task 1 (IM-4b) — called when the user deletes a comment. */
  onDeleteHubComment?: (hubId: string, commentId: string) => void;
  /** Task 1 (IM-4b) — show author names on the comment thread (default false). */
  showCommentAuthors?: boolean;
  /**
   * FE-2a — the hypothesis test-plan triad read-model (derived, no stored field):
   * each relevant factor + its data-readiness + the auto-suggested tool. Built by
   * the app via `buildHypothesisTestPlan(hub, findings, rows, outcome)`. When
   * provided (even empty), the "How do I test this?" triad renders. Omit to hide.
   */
  testPlanFactors?: ReadonlyArray<TestPlanFactorView>;
  /**
   * FE-2a / FE-2b — one-tap evaluate. Called with (hypothesisId, factor, options)
   * when the analyst taps "Evaluate" on a READY factor. The app runs
   * `evaluateHypothesisFactor`, writes the typed Finding (validationStatus),
   * connects it to the hub, and re-renders the Wall. NEVER auto-run. When omitted,
   * the evaluate CTA is hidden.
   *
   * FE-2b — when `options.tryToBreakIt` is set, the SAME engine result is graded
   * as a disconfirmation verdict (significant → survived/supports;
   * not-significant → refuted/contradicts) and the app ALSO records a
   * `DisconfirmationAttempt` with the finding linked (engine-graded, never
   * self-graded). `options.prediction` carries the optional premortem text into
   * the attempt's `description`.
   */
  onEvaluateFactor?: (
    hypothesisId: string,
    factor: string,
    options?: EvaluateFactorOptions
  ) => void;
  /**
   * FE-2a — the per-hypothesis What-If (§5). When provided, the card renders
   * "If you control this cause → projected Cpk X, covers Y%". Never summed across
   * hypotheses. `cpk`/`coveragePct` null → the no-projection caption shows.
   */
  whatIf?: { cpk: number | null; coveragePct: number | null };
  /**
   * FE-2b — the §4.1 soft caveat read-model. When this hub's derived status is
   * Verified (`evidence-survived-test`) but its sole survived disconfirmation attempt has an
   * EMPTY `linkedFindingIds` (an unbacked survived — a manual gemba/expert claim or
   * legacy self-grade), the card renders an ambient muted caveat + a "back it with
   * a test →" link. Read-model only — status stays engine-derived. Pass `false`
   * (default) to hide.
   */
  unbackedSurvived?: boolean;
  /**
   * FE-2b — refute → respawn-sharper (spec §4.2). When this hub is refuted (a
   * "Try to break it" evaluate or any refutation), the card offers an inline
   * "Sharpen → propose a new hypothesis" that seeds H2 (editable name) and carries
   * the refuting finding forward as SUPPORTING evidence for H2. Called with
   * (refutedHypothesisId, newName). When omitted, the sharpen CTA is hidden.
   */
  onRespawnSharper?: (refutedHypothesisId: string, newName: string) => void;
  /**
   * FE-2b — the "superseded by →" anti-amnesia trail (spec §4.2). The resolved
   * NAME of the sharper hypothesis (H2) this refuted hub was superseded by, looked
   * up by the parent from `hub.supersededByHypothesisId`. When present (the hub is
   * refuted AND was respawned), the card renders a small "superseded by → [name]"
   * text reference so the analyst doesn't re-walk the dead end. Plain text — NOT a
   * drawn canvas edge. Absent when the hub was never superseded.
   */
  supersededByName?: string;
  /**
   * FE-2b — the confound sign-prompt (spec §4.2). When a factor the analyst is
   * about to evaluate is ALSO cited by a rival hypothesis, the card surfaces the
   * rival + prompts the analyst to mark the opposite sign on it. The map is keyed
   * by factor column → the rival cause's `{id,name}` + that rival's side-by-side
   * What-If. Pass `undefined` to disable the prompt.
   */
  confoundByFactor?: Record<string, ConfoundRivalView | undefined>;
  /**
   * FE-2b — mark the opposite sign on a rival cause (the confound prompt's action).
   * Called with (rivalHypothesisId, findingId) — re-links the shared finding to the
   * rival as a counter-clue (`counterFindingIds`/contradicts). When omitted, the
   * "Counts against the rival" button is hidden.
   */
  onMarkConfoundOpposite?: (rivalHypothesisId: string, findingId: string) => void;
}

/** A scatter/boxplot chart payload for a triad row (precomputed by the parent). */
export type TriadFactorChart =
  | {
      kind: 'scatter';
      points: Array<{ x: number; y: number }>;
      fittedLine: Array<{ x: number; y: number }> | null;
      isSignificant: boolean;
    }
  | { kind: 'boxplot'; groups: Array<{ category: string; values: number[] }> };

/** A single test-plan triad row passed to the card (FE-2a). */
export interface TestPlanFactorView {
  factor: string;
  readiness: 'ready' | 'gap';
  tool: 'two-sample' | 'regression' | 'capability' | null;
  /**
   * PR-CS-9 — the precomputed inline chart for this factor (spec §4.0 "see the
   * chart"). Populated by the parent (WallCanvas) ONLY for the focused hub, so the
   * charts are summoned onto a focused hypothesis, not always-on. Undefined → no
   * inline chart for this row.
   */
  chart?: TriadFactorChart;
}

/** FE-2b — the per-evaluate options carried up by the fused triad row. */
export interface EvaluateFactorOptions {
  /** When true, grade the SAME engine result as a disconfirmation verdict. */
  tryToBreakIt?: boolean;
  /** The optional falsifying-prediction premortem text (→ attempt.description). */
  prediction?: string;
}

/** FE-2b — a rival cause that cites the same factor (the confound prompt). */
export interface ConfoundRivalView {
  /** The rival hypothesis. */
  rivalId: string;
  rivalName: string;
  /** The shared finding to re-link as a counter-clue when the analyst confirms. */
  sharedFindingId: string | null;
  /** The rival's OWN What-If (never summed with this hub's). */
  whatIf: { cpk: number | null; coveragePct: number | null };
}

export const HypothesisCardWithPlans: React.FC<HypothesisCardWithPlansProps> = ({
  plans,
  members,
  currentUserId,
  findings,
  onAddPlan,
  onLinkFinding,
  onEditPlan,
  onSetPlanStatus,
  pendingMatchByPlanId,
  onDismissPendingMatch,
  onAddHypothesisAction,
  onCompleteHypothesisAction,
  onRecordDisconfirmation,
  onSetStatus,
  activityNow,
  onGoLook,
  ideaImpacts,
  onProjectIdea,
  onAddIdea,
  onUpdateIdea,
  onRemoveIdea,
  onSelectIdea,
  onAddHubComment,
  onEditHubComment,
  onDeleteHubComment,
  showCommentAuthors,
  testPlanFactors,
  onEvaluateFactor,
  whatIf,
  unbackedSurvived,
  onRespawnSharper,
  supersededByName,
  confoundByFactor,
  onMarkConfoundOpposite,
  stepOptions,
  defaultScope,
  defaultOutcome,
  ...cardProps
}) => {
  const locale = useWallLocale();
  const [addPlanFormOpen, setAddPlanFormOpen] = useState(false);
  // FE-2a — when a gap factor's "+ Measurement Plan" is tapped, open the form
  // pre-filled with that factor (kills the free-text drift). null = no prefill.
  const [planPrefillFactor, setPlanPrefillFactor] = useState<string | null>(null);
  const [linkFindingForPlanId, setLinkFindingForPlanId] = useState<string | null>(null);
  const [disconfirmFormOpen, setDisconfirmFormOpen] = useState(false);
  const [disconfirmDescription, setDisconfirmDescription] = useState('');
  const [disconfirmVerdict, setDisconfirmVerdict] = useState<'pending' | 'survived' | 'refuted'>(
    'pending'
  );
  // Add Task form state (Task 3 IM-4b)
  const [addTaskFormOpen, setAddTaskFormOpen] = useState(false);
  const [taskText, setTaskText] = useState('');
  // FE-2b — per-factor "Try to break it" toggle + the optional premortem
  // prediction. Keyed by factor column so each triad row owns its own gesture.
  const [breakItByFactor, setBreakItByFactor] = useState<Record<string, boolean>>({});
  const [predictionByFactor, setPredictionByFactor] = useState<Record<string, string>>({});
  // FE-2b — refute → respawn-sharper inline form (the editable H2 name).
  const [respawnFormOpen, setRespawnFormOpen] = useState(false);
  const [respawnName, setRespawnName] = useState('');

  // ACL gate — open-access when no members configured (V1 single-user scenario)
  const canEdit =
    members.length === 0 ||
    (currentUserId !== null && canAccess(currentUserId, members, 'edit-contributions'));

  // Plans section is positioned below CARD_H + PLANS_GAP from card's (x, y).
  // HypothesisCard is anchored at center-top (cx = x, top = y), so card spans
  // [x - CARD_W/2 .. x + CARD_W/2] horizontally, [y .. y + CARD_H] vertically.
  const plansSectionY = CARD_H + PLANS_GAP;

  // Disconfirmation gesture is shown when the parent wires the callback AND the
  // user has edit-contributions access (the same ACL gate as the plans zone).
  const showDisconfirmGesture = canEdit && Boolean(onRecordDisconfirmation);

  // CS-10 — the analyst-set status control. Same ACL gate as the disconfirmation
  // gesture: shown when the parent wires onSetStatus AND the user can edit.
  const showStatusControl = canEdit && Boolean(onSetStatus);
  const counterFindingIds = new Set(cardProps.hub.counterFindingIds ?? []);
  const linkedFindings = findings.filter(f => cardProps.hub.findingIds.includes(f.id));
  const supportCount = linkedFindings.filter(
    f =>
      !counterFindingIds.has(f.id) &&
      !f.refutes &&
      f.validationStatus !== 'contradicts' &&
      f.validationStatus !== 'inconclusive'
  ).length;
  const refutingCount = linkedFindings.filter(
    f => counterFindingIds.has(f.id) || f.refutes || f.validationStatus === 'contradicts'
  ).length;
  const survivedAttemptCount = (cardProps.hub.disconfirmationAttempts ?? []).filter(
    attempt => attempt.verdict === 'survived'
  ).length;
  const distinctEvidenceTypes = evidenceTypesForHypothesis(cardProps.hub, findings).size;
  const statusProposal = (() => {
    if (!showStatusControl) return null;
    if (cardProps.hub.status !== 'refuted' && refutingCount > 0) {
      return {
        label: `${refutingCount} refuting finding${refutingCount === 1 ? '' : 's'} - mark Ruled out?`,
        status: 'refuted' as HypothesisStatus,
      };
    }
    if (
      cardProps.hub.status === 'needs-disconfirmation' &&
      distinctEvidenceTypes >= 2 &&
      survivedAttemptCount > 0
    ) {
      return {
        label: `${survivedAttemptCount} survived break attempt${survivedAttemptCount === 1 ? '' : 's'} - mark Verified?`,
        status: 'evidence-survived-test' as HypothesisStatus,
      };
    }
    if (
      cardProps.hub.status === 'evidenced' &&
      distinctEvidenceTypes >= 2 &&
      survivedAttemptCount === 0
    ) {
      return {
        label: 'Evidence logged - keep marked Suspected',
        status: 'needs-disconfirmation' as HypothesisStatus,
      };
    }
    if (cardProps.hub.status === 'proposed' && supportCount > 0) {
      return {
        label: `${supportCount} supporting finding${supportCount === 1 ? '' : 's'} - mark Suspected?`,
        status: 'evidenced' as HypothesisStatus,
      };
    }
    return null;
  })();

  // ImprovementIdeasSection mounts when the parent wires the impacts map AND the
  // hub carries at least one idea (Task 6 IM-4b). Hoisted so the comments
  // foreignObject can offset itself below the ideas section.
  const showIdeasSection = ideaImpacts !== undefined && (cardProps.hub.ideas?.length ?? 0) > 0;

  // Dynamic height: action item rows + add-task form/button +
  // data-collection-task sections (each includes the chip) +
  // optional add-plan button + optional add-plan form +
  // optional disconfirmation gesture.
  const actions = cardProps.hub.actions ?? [];
  const activity = deriveHypothesisActivity({
    hub: cardProps.hub,
    plans,
    testPlanFactors,
    now: activityNow ?? Date.now(),
  });
  const inFlightPlanRows = activity.inFlightPlans;
  const pendingAttemptRows = activity.pendingAttempts;
  const showInFlightActivity = inFlightPlanRows.length > 0 || pendingAttemptRows.length > 0;
  const actionRowsTotalH = actions.length * ACTION_ROW_H;
  const addTaskBtnH = canEdit && onAddHypothesisAction && !addTaskFormOpen ? ADD_BTN_H : 0;
  const addTaskFormH = canEdit && addTaskFormOpen ? ADD_TASK_FORM_H : 0;
  // Each data-collection-task section now embeds the chip — no separate chipsTotalH.
  const dataCollectTotalH = inFlightPlanRows.length * DATA_COLLECT_ROW_H;
  const activityHeaderH = showInFlightActivity ? ACTIVITY_HEADER_H : 0;
  const pendingAttemptRowsH = pendingAttemptRows.length * PENDING_ATTEMPT_ROW_H;
  const stalledH = activity.stalled.isStalled ? STALLED_ACTIVITY_H : 0;
  const btnH = canEdit && !addPlanFormOpen ? ADD_BTN_H : 0;
  const formH = canEdit && addPlanFormOpen ? FORM_H : 0;
  const disconfirmH = showDisconfirmGesture
    ? disconfirmFormOpen
      ? DISCONFIRM_FORM_H
      : ADD_BTN_H
    : 0;
  // FE-2a — the test-plan triad + per-hypothesis What-If add their own height.
  // FE-2b — each ready row grows when its "Try to break it" is checked (the
  // premortem field) and/or when a confound rival is surfaced for that factor.
  const showTestPlan = testPlanFactors !== undefined;
  const testPlanRowsH = (testPlanFactors ?? []).reduce((sum, tp) => {
    let rowH = TEST_PLAN_ROW_H;
    if (tp.readiness === 'ready') {
      if (tp.chart) rowH += TEST_PLAN_CHART_H;
      if (breakItByFactor[tp.factor]) rowH += BREAK_IT_EXPANSION_H;
      if (confoundByFactor?.[tp.factor]) rowH += CONFOUND_PROMPT_H;
    }
    return sum + rowH;
  }, 0);
  const testPlanH = showTestPlan ? TEST_PLAN_HEADER_H + testPlanRowsH : 0;
  const whatIfH = whatIf !== undefined ? WHATIF_H : 0;
  // FE-2b — the §4.1 soft caveat (unbacked survived) renders ambiently.
  const caveatH = unbackedSurvived ? CAVEAT_H : 0;
  // FE-2b — refute → respawn-sharper. Shown only when the parent wires the
  // callback AND the hub is refuted (its display status is 'refuted').
  const showRespawn = canEdit && Boolean(onRespawnSharper) && cardProps.displayStatus === 'refuted';
  const respawnH = showRespawn ? (respawnFormOpen ? RESPAWN_FORM_H : RESPAWN_CTA_H) : 0;
  // FE-2b — the "superseded by →" trail renders on a refuted hub that was
  // respawned into a sharper successor. Independent of edit access (it's a
  // read-only lineage marker, visible to everyone).
  const showSuperseded = cardProps.displayStatus === 'refuted' && Boolean(supersededByName);
  const supersededH = showSuperseded ? SUPERSEDED_H : 0;
  // FSJ-8 — the analyst-set status ladder + optional advisory proposal chip.
  const statusControlH = showStatusControl
    ? STATUS_CONTROL_H + (statusProposal ? STATUS_CHIP_H : 0)
    : 0;
  const plansSectionH =
    statusControlH +
    actionRowsTotalH +
    addTaskBtnH +
    addTaskFormH +
    testPlanH +
    whatIfH +
    caveatH +
    respawnH +
    supersededH +
    activityHeaderH +
    dataCollectTotalH +
    pendingAttemptRowsH +
    stalledH +
    btnH +
    formH +
    disconfirmH;

  // Owner name resolver
  const resolveOwner = (ownerId: string): string =>
    members.find(m => m.id === ownerId)?.displayName ?? '(unknown)';

  // Status label resolver for data-collection-task section
  const resolveStatusLabel = (status: MeasurementPlan['status']): string => {
    switch (status) {
      case 'planned':
        return getMessage(locale, 'wall.collect.status.planned');
      case 'in-progress':
        return getMessage(locale, 'wall.collect.status.inProgress');
      case 'complete':
        return getMessage(locale, 'wall.collect.status.complete');
      case 'skipped':
        return getMessage(locale, 'wall.collect.status.skipped');
    }
  };

  // Picker state: find the plan being linked
  const pickerPlan = linkFindingForPlanId
    ? (plans.find(p => p.id === linkFindingForPlanId) ?? null)
    : null;

  const handlePickerConfirm = (findingIds: string[]) => {
    if (!linkFindingForPlanId) return;
    for (const fid of findingIds) {
      onLinkFinding(linkFindingForPlanId, fid);
    }
    setLinkFindingForPlanId(null);
  };

  // FE-2a — the gap-factor "+ Measurement Plan" opens the AddPlanForm pre-filled
  // with the factor (kills free-text drift). Reuses the existing plans form.
  const handlePlanForFactor = (factor: string) => {
    setPlanPrefillFactor(factor);
    setAddPlanFormOpen(true);
  };

  // Tool label resolver for the test-plan triad.
  const resolveToolLabel = (tool: TestPlanFactorView['tool']): string => {
    switch (tool) {
      case 'two-sample':
        return getMessage(locale, 'wall.testplan.toolTwoSample');
      case 'regression':
        return getMessage(locale, 'wall.testplan.toolRegression');
      case 'capability':
        return getMessage(locale, 'wall.testplan.toolCapability');
      default:
        return '';
    }
  };

  const handleDisconfirmSave = () => {
    if (!onRecordDisconfirmation) return;
    const description = disconfirmDescription.trim();
    if (description.length === 0) return;
    onRecordDisconfirmation(cardProps.hub.id, { description, verdict: disconfirmVerdict });
    setDisconfirmDescription('');
    setDisconfirmVerdict('pending');
    setDisconfirmFormOpen(false);
  };

  // FE-2b — the fused evaluate: run the FE-2a/2b evaluate, carrying the per-row
  // "Try to break it" flag + the optional premortem prediction. The app derives
  // the verdict from the SAME engine result and records the DisconfirmationAttempt
  // with the finding linked (engine-graded). NEVER gate the tap on a written
  // prediction (the locked call — the engine verdict is the real backing).
  const handleFusedEvaluate = (factor: string) => {
    if (!onEvaluateFactor) return;
    const tryToBreakIt = Boolean(breakItByFactor[factor]);
    const prediction = (predictionByFactor[factor] ?? '').trim();
    onEvaluateFactor(cardProps.hub.id, factor, {
      tryToBreakIt,
      prediction: prediction.length > 0 ? prediction : undefined,
    });
  };

  // FE-2b — refute → respawn-sharper. Seeds H2 from the editable name; the app
  // creates the new hub and carries the refuting finding forward as supporting.
  const handleRespawnSave = () => {
    if (!onRespawnSharper) return;
    const name = respawnName.trim();
    if (name.length === 0) return;
    onRespawnSharper(cardProps.hub.id, name);
    setRespawnName('');
    setRespawnFormOpen(false);
  };

  return (
    <g>
      {/* Base card — contract unchanged */}
      <HypothesisCard {...cardProps} />

      {/* Plans extension zone — only rendered when there's content */}
      {plansSectionH > 0 && (
        <foreignObject
          x={cardProps.x + FO_X}
          y={cardProps.y + plansSectionY}
          width={CARD_W}
          height={plansSectionH}
          style={{ overflow: 'visible' }}
          data-testid="plans-section"
        >
          <div className="bg-white border border-gray-200 rounded-b shadow-sm overflow-visible">
            {/* L-2 — analyst-owned status. The select preserves the stored enum;
                the display summary teaches only the 3-state presentation model. */}
            {showStatusControl && (
              <div
                data-testid="analyst-set-status-section"
                className="border-b border-gray-100 px-3 py-2 space-y-2"
              >
                <div data-testid="status-summary" className="rounded border border-gray-200 p-2">
                  <div className="text-[11px] font-semibold text-gray-700">Displayed state</div>
                  <div className="mt-1 text-[11px] leading-tight text-gray-600">
                    Suspected causes stay suspected until they survive a deliberate break attempt or
                    are ruled out.
                  </div>
                </div>
                {statusProposal && (
                  <button
                    type="button"
                    data-testid="status-proposal-chip"
                    className="inline-flex items-center rounded-full border border-blue-600 bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-800 hover:bg-blue-100"
                    onClick={() => onSetStatus?.(cardProps.hub.id, statusProposal.status)}
                  >
                    {statusProposal.label}
                  </button>
                )}
                <label className="block text-xs font-medium text-gray-700">
                  {getMessage(locale, 'wall.status.setLabel')}
                  <select
                    data-testid="analyst-set-status-control"
                    aria-label={getMessage(locale, 'wall.status.setLabel')}
                    className="mt-1 w-full rounded border border-gray-300 px-2 py-1 text-sm"
                    value={cardProps.hub.status}
                    onChange={e =>
                      onSetStatus?.(cardProps.hub.id, e.target.value as HypothesisStatus)
                    }
                  >
                    {STATUS_OPTIONS.map(s => (
                      <option key={s} value={s}>
                        {displayHypothesisStatus(s).label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            )}

            {/* FE-2a — the hypothesis test-plan triad: "How do I test this?".
                Each relevant factor + its auto-suggested tool + a one-tap
                Evaluate (ready) or "+ Measurement Plan" (gap). The factors are a
                derived read-model (deriveHypothesisFactors); the app runs the
                real test on tap and writes a typed Finding. */}
            {showTestPlan && (
              <div data-testid="test-plan-triad" className="border-b border-gray-100">
                <div className="px-3 pt-2 pb-1 text-xs font-semibold uppercase text-gray-500">
                  {getMessage(locale, 'wall.testplan.heading')}
                </div>
                {(testPlanFactors?.length ?? 0) === 0 ? (
                  <div className="px-3 pb-2 text-xs text-gray-400">
                    {getMessage(locale, 'wall.testplan.empty')}
                  </div>
                ) : (
                  testPlanFactors!.map(tp => {
                    const breakIt = Boolean(breakItByFactor[tp.factor]);
                    const confound =
                      tp.readiness === 'ready' ? confoundByFactor?.[tp.factor] : undefined;
                    return (
                      <div
                        key={`tp-${tp.factor}`}
                        data-testid={`test-plan-factor-${tp.factor}`}
                        data-readiness={tp.readiness}
                        data-tool={tp.tool ?? ''}
                        data-break-it={breakIt ? 'on' : 'off'}
                        className="flex flex-col px-3 py-1.5 text-sm"
                      >
                        <div className="flex items-center gap-2">
                          <span className="flex-1 min-w-0">
                            <span className="font-medium text-gray-800 truncate">{tp.factor}</span>
                            {tp.readiness === 'ready' && tp.tool ? (
                              <span className="ml-1.5 text-xs text-gray-500">
                                {resolveToolLabel(tp.tool)}
                              </span>
                            ) : (
                              <span className="ml-1.5 text-xs italic text-amber-700">
                                {getMessage(locale, 'wall.testplan.gapLabel')}
                              </span>
                            )}
                          </span>
                          {tp.readiness === 'ready' && onEvaluateFactor && (
                            <button
                              type="button"
                              data-testid={`evaluate-factor-${tp.factor}`}
                              className="flex-shrink-0 rounded bg-blue-600 px-2 py-0.5 text-xs text-white hover:bg-blue-700"
                              aria-label={getMessage(locale, 'wall.testplan.evaluateAria').replace(
                                '{factor}',
                                tp.factor
                              )}
                              onClick={() => handleFusedEvaluate(tp.factor)}
                            >
                              {getMessage(locale, 'wall.testplan.evaluate')}
                            </button>
                          )}
                          {tp.readiness === 'gap' && canEdit && (
                            <button
                              type="button"
                              data-testid={`plan-factor-${tp.factor}`}
                              className="flex-shrink-0 rounded border border-amber-300 px-2 py-0.5 text-xs text-amber-700 hover:bg-amber-50"
                              aria-label={getMessage(locale, 'wall.testplan.addPlanAria').replace(
                                '{factor}',
                                tp.factor
                              )}
                              onClick={() => handlePlanForFactor(tp.factor)}
                            >
                              {getMessage(locale, 'wall.testplan.addPlan')}
                            </button>
                          )}
                        </div>

                        {/* PR-CS-9 — the inline stat chart (spec §4.0 "sees the
                            actual chart"). Present only for a ready factor whose
                            parent supplied a chart payload (focused hub). */}
                        {tp.readiness === 'ready' && tp.chart && (
                          <div className="mt-1" data-testid={`triad-chart-${tp.factor}`}>
                            {tp.chart.kind === 'scatter' ? (
                              <MiniScatterFit
                                points={tp.chart.points}
                                fittedLine={tp.chart.fittedLine}
                                isSignificant={tp.chart.isSignificant}
                                width={TRIAD_CHART_W}
                                height={TRIAD_CHART_H}
                              />
                            ) : (
                              <MiniBoxplot
                                groups={tp.chart.groups}
                                width={TRIAD_CHART_W}
                                height={TRIAD_CHART_H}
                              />
                            )}
                          </div>
                        )}

                        {/* FE-2b keystone — the fused "Try to break it" checkbox.
                            The engine grades the verdict; the analyst never picks
                            survived/refuted. A prospective premortem (predict what
                            would prove this WRONG). */}
                        {tp.readiness === 'ready' && onEvaluateFactor && (
                          <label
                            className="mt-1 flex items-center gap-1.5 text-xs text-gray-600"
                            data-testid={`try-break-it-${tp.factor}`}
                          >
                            <input
                              type="checkbox"
                              className="h-3 w-3"
                              checked={breakIt}
                              aria-label={getMessage(locale, 'wall.disconfirm.tryToBreakIt')}
                              onChange={e =>
                                setBreakItByFactor(prev => ({
                                  ...prev,
                                  [tp.factor]: e.target.checked,
                                }))
                              }
                            />
                            <span className="font-medium text-amber-800">
                              {getMessage(locale, 'wall.disconfirm.tryToBreakIt')}
                            </span>
                          </label>
                        )}
                        {tp.readiness === 'ready' && breakIt && (
                          <div
                            className="mt-1 space-y-1"
                            data-testid={`break-it-fields-${tp.factor}`}
                          >
                            <p className="text-[11px] italic text-amber-700">
                              {getMessage(locale, 'wall.disconfirm.tryToBreakItHint')}
                            </p>
                            <textarea
                              className="w-full rounded border border-amber-200 px-2 py-1 text-xs"
                              rows={2}
                              aria-label={getMessage(locale, 'wall.disconfirm.predictLabel')}
                              placeholder={getMessage(locale, 'wall.disconfirm.predictPlaceholder')}
                              value={predictionByFactor[tp.factor] ?? ''}
                              onChange={e =>
                                setPredictionByFactor(prev => ({
                                  ...prev,
                                  [tp.factor]: e.target.value,
                                }))
                              }
                            />
                            <p className="text-[10px] text-gray-400">
                              {getMessage(locale, 'wall.disconfirm.predictHint')}
                            </p>
                          </div>
                        )}

                        {/* FE-2b — the confound sign-prompt: this factor is also
                            cited by a rival cause. Surface the rival + prompt the
                            opposite sign + show side-by-side What-If (NEVER summed). */}
                        {confound && (
                          <div
                            className="mt-1.5 rounded border border-purple-200 bg-purple-50 px-2 py-1.5 text-xs"
                            data-testid={`confound-prompt-${tp.factor}`}
                          >
                            <div className="font-semibold text-purple-800">
                              {getMessage(locale, 'wall.confound.heading')}
                            </div>
                            <div className="mt-0.5 text-purple-900">
                              {getMessage(locale, 'wall.confound.prompt').replace(
                                '{rival}',
                                confound.rivalName
                              )}
                            </div>
                            {confound.sharedFindingId && onMarkConfoundOpposite && (
                              <button
                                type="button"
                                data-testid={`confound-mark-opposite-${tp.factor}`}
                                className="mt-1 rounded border border-purple-300 px-2 py-0.5 text-[11px] text-purple-800 hover:bg-purple-100"
                                onClick={() =>
                                  onMarkConfoundOpposite(
                                    confound.rivalId,
                                    confound.sharedFindingId!
                                  )
                                }
                              >
                                {getMessage(locale, 'wall.confound.markOpposite')}
                              </button>
                            )}
                            {/* Side-by-side per-hypothesis What-If — explicitly NOT
                                additive. Two separate projections. */}
                            <div className="mt-1 grid grid-cols-2 gap-2">
                              <div data-testid={`confound-whatif-self-${tp.factor}`}>
                                <div className="text-[10px] uppercase text-gray-500">
                                  {getMessage(locale, 'wall.confound.whatIfFor').replace(
                                    '{hypothesis}',
                                    cardProps.hub.name
                                  )}
                                </div>
                                <div className="text-purple-900">
                                  {whatIf?.cpk != null && Number.isFinite(whatIf.cpk)
                                    ? whatIf.cpk.toFixed(2)
                                    : '—'}
                                </div>
                              </div>
                              <div data-testid={`confound-whatif-rival-${tp.factor}`}>
                                <div className="text-[10px] uppercase text-gray-500">
                                  {getMessage(locale, 'wall.confound.whatIfFor').replace(
                                    '{hypothesis}',
                                    confound.rivalName
                                  )}
                                </div>
                                <div className="text-purple-900">
                                  {confound.whatIf.cpk != null &&
                                  Number.isFinite(confound.whatIf.cpk)
                                    ? confound.whatIf.cpk.toFixed(2)
                                    : '—'}
                                </div>
                              </div>
                            </div>
                            <p className="mt-1 text-[10px] italic text-gray-500">
                              {getMessage(locale, 'wall.confound.notAdditive')}
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* FE-2a — the per-hypothesis What-If (§5): "if you control this cause
                → projected Cpk X, covers Y%". NEVER summed across hypotheses. */}
            {whatIf !== undefined && (
              <div data-testid="hypothesis-whatif" className="border-b border-gray-100 px-3 py-2">
                <div className="text-xs font-semibold uppercase text-gray-500">
                  {getMessage(locale, 'wall.whatif.heading')}
                </div>
                {whatIf.cpk !== null &&
                whatIf.coveragePct !== null &&
                Number.isFinite(whatIf.cpk) &&
                Number.isFinite(whatIf.coveragePct) ? (
                  <div data-testid="hypothesis-whatif-value" className="text-sm text-gray-800">
                    {getMessage(locale, 'wall.whatif.projection')
                      .replace('{cpk}', whatIf.cpk.toFixed(2))
                      .replace('{coverage}', whatIf.coveragePct.toFixed(0))}
                  </div>
                ) : (
                  <div className="text-xs text-gray-400">
                    {getMessage(locale, 'wall.whatif.noProjection')}
                  </div>
                )}
              </div>
            )}

            {/* FE-2b — the §4.1 soft caveat for an unbacked survived attempt. An
                ambient muted note (read-model only; status stays engine-derived) +
                a "back it with a test →" link that pre-checks "Try to break it" on
                the first ready factor so the analyst can run the real test. */}
            {unbackedSurvived && (
              <div
                data-testid="unbacked-survived-caveat"
                className="border-b border-gray-100 px-3 py-2 text-xs text-gray-500 italic"
              >
                <span>{getMessage(locale, 'wall.caveat.unbackedSurvived')}</span>
                {(testPlanFactors ?? []).some(tp => tp.readiness === 'ready') && (
                  <button
                    type="button"
                    data-testid="back-it-with-test"
                    className="ml-1.5 not-italic text-blue-600 hover:underline"
                    onClick={() => {
                      const firstReady = (testPlanFactors ?? []).find(
                        tp => tp.readiness === 'ready'
                      );
                      if (firstReady) {
                        setBreakItByFactor(prev => ({ ...prev, [firstReady.factor]: true }));
                      }
                    }}
                  >
                    {getMessage(locale, 'wall.caveat.backWithTest')}
                  </button>
                )}
              </div>
            )}

            {/* FE-2b — refute → respawn-sharper (spec §4.2). A refuted hub stays
                red + never archived; this inline gesture seeds a sharper H2 and
                carries the refuting finding forward as SUPPORTING evidence. */}
            {showRespawn && !respawnFormOpen && (
              <button
                type="button"
                data-testid="respawn-sharper-cta"
                className="w-full px-3 py-1.5 text-sm text-indigo-600 hover:bg-indigo-50 text-left border-b border-gray-100"
                onClick={() => {
                  setRespawnFormOpen(true);
                  setRespawnName('');
                }}
              >
                {getMessage(locale, 'wall.respawn.sharpenCta')}
              </button>
            )}
            {showRespawn && respawnFormOpen && (
              <div
                className="px-3 py-2 border-b border-gray-100 space-y-1.5"
                data-testid="respawn-sharper-form"
              >
                <label className="block text-xs font-medium text-gray-700">
                  {getMessage(locale, 'wall.respawn.nameLabel')}
                  <input
                    type="text"
                    aria-label={getMessage(locale, 'wall.respawn.nameLabel')}
                    className="mt-1 w-full rounded border border-gray-300 px-2 py-1 text-sm"
                    placeholder={getMessage(locale, 'wall.respawn.namePlaceholder')}
                    value={respawnName}
                    onChange={e => setRespawnName(e.target.value)}
                    autoFocus
                  />
                </label>
                <p className="text-[11px] italic text-gray-500" data-testid="respawn-carry-note">
                  {getMessage(locale, 'wall.respawn.carryNote')}
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    data-testid="respawn-confirm"
                    className="rounded bg-indigo-600 px-2 py-1 text-xs text-white hover:bg-indigo-700 disabled:opacity-50"
                    disabled={respawnName.trim().length === 0}
                    onClick={handleRespawnSave}
                  >
                    {getMessage(locale, 'wall.respawn.confirm')}
                  </button>
                  <button
                    type="button"
                    className="rounded border border-gray-300 px-2 py-1 text-xs text-gray-700 hover:bg-gray-50"
                    onClick={() => {
                      setRespawnFormOpen(false);
                      setRespawnName('');
                    }}
                  >
                    {getMessage(locale, 'wall.respawn.cancel')}
                  </button>
                </div>
              </div>
            )}

            {/* FE-2b — the "superseded by →" anti-amnesia trail (spec §4.2). A
                refuted hub that was respawned into a sharper successor renders a
                small read-only lineage reference (plain text, NOT a canvas edge)
                so the analyst doesn't re-walk the dead end. */}
            {showSuperseded && (
              <p
                data-testid="superseded-by-trail"
                className="border-b border-gray-100 px-3 py-1 text-[11px] italic text-gray-500"
              >
                {getMessage(locale, 'wall.respawn.supersededBy')}{' '}
                <span className="not-italic font-medium text-gray-700">{supersededByName}</span>
              </p>
            )}

            {/* ActionItem task rows (Task 3 IM-4b) */}
            {actions.map((action: ActionItem) => {
              const isDone = action.completedAt !== undefined;
              return (
                <div
                  key={action.id}
                  data-testid="action-item-row"
                  data-status={isDone ? 'done' : 'open'}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm border-b border-gray-100 last:border-b-0"
                >
                  {canEdit && !isDone && onCompleteHypothesisAction && (
                    <button
                      type="button"
                      className="flex-shrink-0 rounded border border-gray-300 px-1.5 py-0.5 text-xs text-gray-600 hover:bg-gray-50"
                      aria-label={getMessage(locale, 'wall.task.markDone')}
                      onClick={() => onCompleteHypothesisAction(cardProps.hub.id, action.id)}
                    >
                      {getMessage(locale, 'wall.task.markDone')}
                    </button>
                  )}
                  <div className="flex-1 min-w-0">
                    <span className={isDone ? 'line-through text-gray-400' : 'text-gray-800'}>
                      {action.text}
                    </span>
                    {action.assignee && (
                      <span className="ml-1 text-xs text-gray-500">
                        {action.assignee.displayName}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}

            {/* + Add Task button (Task 3 IM-4b) */}
            {canEdit && onAddHypothesisAction && !addTaskFormOpen && (
              <button
                type="button"
                className="w-full px-3 py-1.5 text-sm text-indigo-600 hover:bg-indigo-50 text-left border-b border-gray-100"
                aria-label={getMessage(locale, 'wall.task.addButton')}
                onClick={() => setAddTaskFormOpen(true)}
              >
                {getMessage(locale, 'wall.task.addButton')}
              </button>
            )}

            {/* Inline add-task form (Task 3 IM-4b) */}
            {canEdit && addTaskFormOpen && (
              <div className="px-3 py-2 border-b border-gray-100 space-y-1">
                <label className="block text-xs font-medium text-gray-700">
                  {getMessage(locale, 'wall.task.taskLabel')}
                  <input
                    type="text"
                    aria-label={getMessage(locale, 'wall.task.taskLabel')}
                    className="mt-1 w-full rounded border border-gray-300 px-2 py-1 text-sm"
                    value={taskText}
                    onChange={e => setTaskText(e.target.value)}
                    autoFocus
                  />
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    className="rounded bg-indigo-600 px-2 py-1 text-xs text-white hover:bg-indigo-700 disabled:opacity-50"
                    disabled={taskText.trim().length === 0}
                    onClick={() => {
                      if (onAddHypothesisAction && taskText.trim()) {
                        onAddHypothesisAction(cardProps.hub.id, taskText.trim());
                        setTaskText('');
                        setAddTaskFormOpen(false);
                      }
                    }}
                  >
                    {getMessage(locale, 'wall.task.save')}
                  </button>
                  <button
                    type="button"
                    className="rounded border border-gray-300 px-2 py-1 text-xs text-gray-700 hover:bg-gray-50"
                    onClick={() => {
                      setAddTaskFormOpen(false);
                      setTaskText('');
                    }}
                  >
                    {getMessage(locale, 'wall.task.cancel')}
                  </button>
                </div>
              </div>
            )}

            {showInFlightActivity && (
              <div data-testid="activity-in-flight" className="border-b border-gray-100">
                <div className="px-3 pt-2 pb-1 text-xs font-semibold uppercase text-gray-500">
                  In flight - evidence being collected
                </div>

                {/* Data-collection task sections (Task 4 IM-4b) — active plans only, read-display (no ACL gate).
                    Each section embeds the MeasurementPlanChip so its text (including primaryFactor)
                    appears in section.textContent without adding an independent matching element
                    alongside the chip for Testing Library's getAllByText queries. */}
                {inFlightPlanRows.map(plan => {
                  const ownerName = resolveOwner(plan.owner);
                  const statusLabel = resolveStatusLabel(plan.status);
                  return (
                    <div
                      key={`dc-${plan.id}`}
                      data-testid="data-collection-task"
                      className="flex flex-col border-b border-gray-100"
                    >
                      {/* Header: "Assigned: collect {primaryFactor}" label + status badge + due date.
                          Owner name is intentionally omitted here — it already appears
                          in the embedded MeasurementPlanChip row below, so
                          section.textContent contains it without duplicating the DOM node
                          (avoids getByText('Alice Lead') ambiguity in existing tests). */}
                      <div className="flex items-center gap-2 px-3 pt-2 pb-1 text-sm">
                        <span className="font-medium text-gray-800 truncate flex-1">
                          {getMessage(locale, 'wall.collect.assigned').replace(
                            '{primaryFactor}',
                            plan.primaryFactor
                          )}
                        </span>
                        <span
                          data-status={plan.status}
                          className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-700 flex-shrink-0"
                        >
                          {statusLabel}
                        </span>
                        {plan.dueDate && (
                          <span className="text-xs text-gray-500 flex-shrink-0">
                            {getMessage(locale, 'wall.collect.due').replace('{date}', plan.dueDate)}
                          </span>
                        )}
                      </div>
                      {/* Chip row embedded inside the section — its text (primaryFactor etc.)
                          contributes to section.textContent without duplicating getAllByText results */}
                      <MeasurementPlanChip
                        plan={plan}
                        ownerName={ownerName}
                        canEdit={canEdit}
                        onEdit={onEditPlan}
                        onLinkFinding={id => setLinkFindingForPlanId(id)}
                        pendingMatch={pendingMatchByPlanId?.[plan.id] ?? null}
                        onSetPlanStatus={onSetPlanStatus}
                        onDismissPendingMatch={onDismissPendingMatch}
                      />
                    </div>
                  );
                })}

                {pendingAttemptRows.map(attempt => (
                  <div
                    key={`pending-attempt-${attempt.id}`}
                    data-testid="activity-pending-attempt"
                    className="px-3 py-1.5 text-xs text-amber-800 border-t border-amber-100 bg-amber-50"
                  >
                    <span className="font-medium">Break attempt pending:</span>
                    <span className="ml-1">{attempt.description}</span>
                  </div>
                ))}
              </div>
            )}

            {activity.stalled.isStalled && (
              <div
                data-testid="activity-stalled"
                className="border-b border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900"
              >
                <div className="font-semibold">
                  Nothing in flight for {activity.stalled.quietWorkingDays} working days
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    className="rounded border border-amber-300 bg-white px-2 py-0.5 text-amber-800 hover:bg-amber-100"
                    onClick={() => setAddPlanFormOpen(true)}
                  >
                    Plan a check
                  </button>
                  <button
                    type="button"
                    className="rounded border border-amber-300 bg-white px-2 py-0.5 text-amber-800 hover:bg-amber-100 disabled:opacity-50"
                    disabled={!onGoLook}
                    onClick={() => onGoLook?.(cardProps.hub.id)}
                  >
                    Go look
                  </button>
                  <button
                    type="button"
                    className="rounded border border-amber-300 bg-white px-2 py-0.5 text-amber-800 hover:bg-amber-100 disabled:opacity-50"
                    disabled={!onSetStatus}
                    onClick={() => onSetStatus?.(cardProps.hub.id, 'refuted')}
                  >
                    Rule it out
                  </button>
                </div>
              </div>
            )}

            {/* + Add Plan button */}
            {canEdit && !addPlanFormOpen && (
              <button
                type="button"
                className="w-full px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 text-left"
                aria-label="Add plan"
                onClick={() => setAddPlanFormOpen(true)}
              >
                + Add Plan
              </button>
            )}

            {/* Inline AddPlanForm expansion */}
            {canEdit && addPlanFormOpen && (
              <AddPlanForm
                // Remount when the prefill factor changes so the seeded
                // useState picks up the new defaultPrimaryFactor.
                key={planPrefillFactor ?? '__no_prefill__'}
                hypothesisId={cardProps.hub.id}
                members={[...members]}
                onSave={plan => {
                  onAddPlan(plan);
                  setAddPlanFormOpen(false);
                  setPlanPrefillFactor(null);
                }}
                onCancel={() => {
                  setAddPlanFormOpen(false);
                  setPlanPrefillFactor(null);
                }}
                stepOptions={stepOptions}
                defaultScope={defaultScope}
                defaultOutcome={defaultOutcome}
                defaultPrimaryFactor={planPrefillFactor ?? undefined}
              />
            )}

            {/* FE-2b — the legacy free-text disconfirmation form survives ONLY as
                the manual fallback for NON-data (gemba / expert) attempts. The
                data-backed disconfirmation now lives in the fused "Try to break
                it" checkbox on the triad evaluate above; this records a
                `survived` with empty `linkedFindingIds` (→ the §4.1 soft caveat). */}
            {showDisconfirmGesture && !disconfirmFormOpen && (
              <button
                type="button"
                data-testid="manual-disconfirm-fallback"
                className="w-full px-3 py-1.5 text-xs text-gray-500 hover:bg-gray-50 text-left border-t border-gray-100"
                onClick={() => setDisconfirmFormOpen(true)}
              >
                {getMessage(locale, 'wall.disconfirm.manualFallback')}
              </button>
            )}
            {showDisconfirmGesture && disconfirmFormOpen && (
              <div className="px-3 py-2 border-t border-gray-100 space-y-2">
                <label className="block text-xs font-medium text-gray-700">
                  {getMessage(locale, 'wall.disconfirm.descriptionLabel')}
                  <textarea
                    aria-label={getMessage(locale, 'wall.disconfirm.descriptionLabel')}
                    className="mt-1 w-full rounded border border-gray-300 px-2 py-1 text-sm"
                    rows={2}
                    value={disconfirmDescription}
                    onChange={e => setDisconfirmDescription(e.target.value)}
                  />
                </label>
                <label className="block text-xs font-medium text-gray-700">
                  {getMessage(locale, 'wall.disconfirm.verdictLabel')}
                  <select
                    aria-label={getMessage(locale, 'wall.disconfirm.verdictLabel')}
                    className="mt-1 w-full rounded border border-gray-300 px-2 py-1 text-sm"
                    value={disconfirmVerdict}
                    onChange={e =>
                      setDisconfirmVerdict(e.target.value as 'pending' | 'survived' | 'refuted')
                    }
                  >
                    <option value="pending">
                      {getMessage(locale, 'wall.disconfirm.verdictPending')}
                    </option>
                    <option value="survived">
                      {getMessage(locale, 'wall.disconfirm.verdictSurvived')}
                    </option>
                    <option value="refuted">
                      {getMessage(locale, 'wall.disconfirm.verdictRefuted')}
                    </option>
                  </select>
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    className="rounded bg-amber-600 px-2 py-1 text-xs text-white hover:bg-amber-700 disabled:opacity-50"
                    disabled={disconfirmDescription.trim().length === 0}
                    onClick={handleDisconfirmSave}
                  >
                    {getMessage(locale, 'wall.disconfirm.record')}
                  </button>
                  <button
                    type="button"
                    className="rounded border border-gray-300 px-2 py-1 text-xs text-gray-700 hover:bg-gray-50"
                    onClick={() => {
                      setDisconfirmFormOpen(false);
                      setDisconfirmDescription('');
                      setDisconfirmVerdict('pending');
                    }}
                  >
                    {getMessage(locale, 'wall.disconfirm.cancel')}
                  </button>
                </div>
              </div>
            )}
          </div>
        </foreignObject>
      )}

      {/* LinkFindingPicker — rendered in a separate foreignObject overlay */}
      {pickerPlan && (
        <foreignObject
          x={cardProps.x + FO_X}
          y={cardProps.y + plansSectionY}
          width={420}
          height={440}
          style={{ overflow: 'visible' }}
          data-testid="link-finding-picker"
        >
          <LinkFindingPicker
            hypothesis={cardProps.hub}
            plan={pickerPlan}
            findings={findings}
            onConfirm={handlePickerConfirm}
            onCancel={() => setLinkFindingForPlanId(null)}
          />
        </foreignObject>
      )}

      {/* Task 6 (IM-4b) — ImprovementIdeasSection: re-mount the detached IM-1 flow.
          Rendered only when hub.ideas is non-empty AND ideaImpacts is provided.
          Positioned below the plans section in a foreignObject. */}
      {showIdeasSection && (
        <foreignObject
          x={cardProps.x + FO_X}
          y={cardProps.y + plansSectionY + plansSectionH}
          width={CARD_W}
          height={IDEAS_SECTION_H}
          style={{ overflow: 'visible' }}
          data-testid={`ideas-fo-${cardProps.hub.id}`}
        >
          <ImprovementIdeasSection
            hypothesisId={cardProps.hub.id}
            ideas={cardProps.hub.ideas ?? []}
            ideaImpacts={ideaImpacts ?? {}}
            onAddIdea={onAddIdea}
            onUpdateIdea={onUpdateIdea}
            onRemoveIdea={onRemoveIdea}
            onSelectIdea={onSelectIdea}
            onProjectIdea={onProjectIdea}
            hypothesisText={cardProps.hub.name}
            canEdit={canEdit}
          />
        </foreignObject>
      )}

      {/* Task 1 (IM-4b) — HypothesisComments: team discussion thread. Mounted
          via the production seam when the parent wires onAddHubComment (the
          presence of the add callback is the "comments enabled" signal). The
          ACL gate lives inside HypothesisComments (mirrors the plans-zone gate).
          Positioned below the plans + ideas sections. */}
      {onAddHubComment && (
        <foreignObject
          x={cardProps.x + FO_X}
          y={cardProps.y + plansSectionY + plansSectionH + (showIdeasSection ? IDEAS_SECTION_H : 0)}
          width={CARD_W}
          height={COMMENTS_SECTION_H}
          style={{ overflow: 'visible' }}
          data-testid={`comments-fo-${cardProps.hub.id}`}
        >
          <HypothesisComments
            hub={cardProps.hub}
            members={members}
            currentUserId={currentUserId}
            onAdd={onAddHubComment}
            onEdit={onEditHubComment ?? (() => {})}
            onDelete={onDeleteHubComment ?? (() => {})}
            showAuthors={showCommentAuthors}
          />
        </foreignObject>
      )}
    </g>
  );
};
