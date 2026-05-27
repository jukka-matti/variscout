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
 * as existing onSelectHub / onComposeGate / onPromoteQuestion do. No new
 * dispatch mechanism introduced.
 */

import React, { useState } from 'react';
import type { Finding } from '@variscout/core';
import type { MeasurementPlan } from '@variscout/core/measurementPlan';
import type { ProjectMember } from '@variscout/core/projectMembership';
import { canAccess } from '@variscout/core/projectMembership';
import { HypothesisCard, type HypothesisCardProps } from './HypothesisCard';
import { MeasurementPlanChip } from './MeasurementPlanChip';
import { AddPlanForm } from './AddPlanForm';
import { LinkFindingPicker } from './LinkFindingPicker';

// Card geometry constants (mirrors HypothesisCard internals)
const CARD_W = 280;
const CARD_H = 288;
/** Height of one MeasurementPlanChip row in the foreignObject (px). */
const CHIP_ROW_H = 32;
/** Height of the + Add Plan button row (px). */
const ADD_BTN_H = 32;
/** Height of AddPlanForm when expanded (px). */
const FORM_H = 280;
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
}

export const HypothesisCardWithPlans: React.FC<HypothesisCardWithPlansProps> = ({
  plans,
  members,
  currentUserId,
  findings,
  onAddPlan,
  onLinkFinding,
  onEditPlan,
  ...cardProps
}) => {
  const [addPlanFormOpen, setAddPlanFormOpen] = useState(false);
  const [linkFindingForPlanId, setLinkFindingForPlanId] = useState<string | null>(null);

  // ACL gate — open-access when no members configured (V1 single-user scenario)
  const canEdit =
    members.length === 0 ||
    (currentUserId !== null && canAccess(currentUserId, members, 'edit-contributions'));

  // Plans section is positioned below CARD_H + PLANS_GAP from card's (x, y).
  // HypothesisCard is anchored at center-top (cx = x, top = y), so card spans
  // [x - CARD_W/2 .. x + CARD_W/2] horizontally, [y .. y + CARD_H] vertically.
  const plansSectionY = CARD_H + PLANS_GAP;

  // Dynamic height: chips rows + optional button + optional form
  const chipsTotalH = plans.length * CHIP_ROW_H;
  const btnH = canEdit && !addPlanFormOpen ? ADD_BTN_H : 0;
  const formH = canEdit && addPlanFormOpen ? FORM_H : 0;
  const plansSectionH = chipsTotalH + btnH + formH;

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
          data-testid="plans-section"
        >
          <div className="bg-white border border-gray-200 rounded-b shadow-sm overflow-visible">
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
              />
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
