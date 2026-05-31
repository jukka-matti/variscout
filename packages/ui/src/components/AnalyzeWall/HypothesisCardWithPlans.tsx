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
import type { Finding, ActionItem, ImprovementIdea, IdeaImpact } from '@variscout/core';
import type { ConditionLeaf } from '@variscout/core/findings';
import type { MeasurementPlan } from '@variscout/core/measurementPlan';
import type { ProjectMember } from '@variscout/core/projectMembership';
import { canAccess } from '@variscout/core/projectMembership';
import { getMessage } from '@variscout/core/i18n';
import { HypothesisCard, type HypothesisCardProps } from './HypothesisCard';
import { MeasurementPlanChip } from './MeasurementPlanChip';
import { AddPlanForm, type StepOption } from './AddPlanForm';
import { LinkFindingPicker } from './LinkFindingPicker';
import { HypothesisComments } from './HypothesisComments';
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
/** Height of the per-hypothesis What-If block (px). */
const WHATIF_H = 56;
/** Horizontal offset of the foreignObject from the card's center-top anchor. */
const FO_X = -(CARD_W / 2);
/** Fixed height reserved for the ImprovementIdeasSection foreignObject (px). */
const IDEAS_SECTION_H = 300;
/** Fixed height reserved for the HypothesisComments foreignObject (px). */
const COMMENTS_SECTION_H = 320;

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
   * FE-2a — one-tap evaluate. Called with (hypothesisId, factor) when the analyst
   * taps "Evaluate" on a READY factor. The app runs `evaluateHypothesisFactor`,
   * writes the typed Finding (validationStatus), connects it to the hub, and
   * re-renders the Wall. NEVER auto-run. When omitted, the evaluate CTA is hidden.
   */
  onEvaluateFactor?: (hypothesisId: string, factor: string) => void;
  /**
   * FE-2a — the per-hypothesis What-If (§5). When provided, the card renders
   * "If you control this cause → projected Cpk X, covers Y%". Never summed across
   * hypotheses. `cpk`/`coveragePct` null → the no-projection caption shows.
   */
  whatIf?: { cpk: number | null; coveragePct: number | null };
}

/** A single test-plan triad row passed to the card (FE-2a). */
export interface TestPlanFactorView {
  factor: string;
  readiness: 'ready' | 'gap';
  tool: 'two-sample' | 'regression' | 'capability' | null;
}

export const HypothesisCardWithPlans: React.FC<HypothesisCardWithPlansProps> = ({
  plans,
  members,
  currentUserId,
  findings,
  onAddPlan,
  onLinkFinding,
  onEditPlan,
  onAddHypothesisAction,
  onCompleteHypothesisAction,
  onRecordDisconfirmation,
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

  // ImprovementIdeasSection mounts when the parent wires the impacts map AND the
  // hub carries at least one idea (Task 6 IM-4b). Hoisted so the comments
  // foreignObject can offset itself below the ideas section.
  const showIdeasSection = ideaImpacts !== undefined && (cardProps.hub.ideas?.length ?? 0) > 0;

  // Dynamic height: action item rows + add-task form/button +
  // data-collection-task sections (each includes the chip) +
  // optional add-plan button + optional add-plan form +
  // optional disconfirmation gesture.
  const actions = cardProps.hub.actions ?? [];
  const actionRowsTotalH = actions.length * ACTION_ROW_H;
  const addTaskBtnH = canEdit && onAddHypothesisAction && !addTaskFormOpen ? ADD_BTN_H : 0;
  const addTaskFormH = canEdit && addTaskFormOpen ? ADD_TASK_FORM_H : 0;
  // Each data-collection-task section now embeds the chip — no separate chipsTotalH.
  const dataCollectTotalH = plans.length * DATA_COLLECT_ROW_H;
  const btnH = canEdit && !addPlanFormOpen ? ADD_BTN_H : 0;
  const formH = canEdit && addPlanFormOpen ? FORM_H : 0;
  const disconfirmH = showDisconfirmGesture
    ? disconfirmFormOpen
      ? DISCONFIRM_FORM_H
      : ADD_BTN_H
    : 0;
  // FE-2a — the test-plan triad + per-hypothesis What-If add their own height.
  const showTestPlan = testPlanFactors !== undefined;
  const testPlanH = showTestPlan
    ? TEST_PLAN_HEADER_H + (testPlanFactors?.length ?? 0) * TEST_PLAN_ROW_H
    : 0;
  const whatIfH = whatIf !== undefined ? WHATIF_H : 0;
  const plansSectionH =
    actionRowsTotalH +
    addTaskBtnH +
    addTaskFormH +
    testPlanH +
    whatIfH +
    dataCollectTotalH +
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
                  testPlanFactors!.map(tp => (
                    <div
                      key={`tp-${tp.factor}`}
                      data-testid={`test-plan-factor-${tp.factor}`}
                      data-readiness={tp.readiness}
                      data-tool={tp.tool ?? ''}
                      className="flex items-center gap-2 px-3 py-1.5 text-sm"
                    >
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
                          onClick={() => onEvaluateFactor(cardProps.hub.id, tp.factor)}
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
                  ))
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

            {/* Data-collection task sections (Task 4 IM-4b) — one per plan, read-display (no ACL gate).
                Each section embeds the MeasurementPlanChip so its text (including primaryFactor)
                appears in section.textContent without adding an independent matching element
                alongside the chip for Testing Library's getAllByText queries. */}
            {plans.map(plan => {
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
                  />
                </div>
              );
            })}

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

            {/* Disconfirmation gesture — "we tried to break this — did it hold?" */}
            {showDisconfirmGesture && !disconfirmFormOpen && (
              <button
                type="button"
                className="w-full px-3 py-1.5 text-sm text-amber-700 hover:bg-amber-50 text-left border-t border-gray-100"
                onClick={() => setDisconfirmFormOpen(true)}
              >
                {getMessage(locale, 'wall.disconfirm.prompt')}
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
