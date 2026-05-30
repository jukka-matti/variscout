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
import type { Finding, ActionItem } from '@variscout/core';
import type { ConditionLeaf } from '@variscout/core/findings';
import type { MeasurementPlan } from '@variscout/core/measurementPlan';
import type { ProjectMember } from '@variscout/core/projectMembership';
import { canAccess } from '@variscout/core/projectMembership';
import { getMessage } from '@variscout/core/i18n';
import { HypothesisCard, type HypothesisCardProps } from './HypothesisCard';
import { MeasurementPlanChip } from './MeasurementPlanChip';
import { AddPlanForm, type StepOption } from './AddPlanForm';
import { LinkFindingPicker } from './LinkFindingPicker';
import { useWallLocale } from './hooks/useWallLocale';

// Card geometry constants (mirrors HypothesisCard internals)
const CARD_W = 280;
const CARD_H = 288;
/** Height of one MeasurementPlanChip row in the foreignObject (px). */
const CHIP_ROW_H = 32;
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
/** Horizontal offset of the foreignObject from the card's center-top anchor. */
const FO_X = -(CARD_W / 2);

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
  stepOptions,
  defaultScope,
  defaultOutcome,
  ...cardProps
}) => {
  const locale = useWallLocale();
  const [addPlanFormOpen, setAddPlanFormOpen] = useState(false);
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

  // Dynamic height: action item rows + add-task form/button + chips rows +
  // optional add-plan button + optional add-plan form + optional disconfirmation gesture.
  const actions = cardProps.hub.actions ?? [];
  const actionRowsTotalH = actions.length * ACTION_ROW_H;
  const addTaskBtnH = canEdit && onAddHypothesisAction && !addTaskFormOpen ? ADD_BTN_H : 0;
  const addTaskFormH = canEdit && addTaskFormOpen ? ADD_TASK_FORM_H : 0;
  const chipsTotalH = plans.length * CHIP_ROW_H;
  const btnH = canEdit && !addPlanFormOpen ? ADD_BTN_H : 0;
  const formH = canEdit && addPlanFormOpen ? FORM_H : 0;
  const disconfirmH = showDisconfirmGesture
    ? disconfirmFormOpen
      ? DISCONFIRM_FORM_H
      : ADD_BTN_H
    : 0;
  const plansSectionH =
    actionRowsTotalH + addTaskBtnH + addTaskFormH + chipsTotalH + btnH + formH + disconfirmH;

  // Owner name resolver
  const resolveOwner = (ownerId: string): string =>
    members.find(m => m.id === ownerId)?.displayName ?? '(unknown)';

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

            {/* Chip rows */}
            {plans.map(plan => (
              <MeasurementPlanChip
                key={plan.id}
                plan={plan}
                ownerName={resolveOwner(plan.owner)}
                canEdit={canEdit}
                onEdit={onEditPlan}
                onLinkFinding={id => setLinkFindingForPlanId(id)}
              />
            ))}

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
                hypothesisId={cardProps.hub.id}
                members={[...members]}
                onSave={plan => {
                  onAddPlan(plan);
                  setAddPlanFormOpen(false);
                }}
                onCancel={() => setAddPlanFormOpen(false)}
                stepOptions={stepOptions}
                defaultScope={defaultScope}
                defaultOutcome={defaultOutcome}
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
    </g>
  );
};
