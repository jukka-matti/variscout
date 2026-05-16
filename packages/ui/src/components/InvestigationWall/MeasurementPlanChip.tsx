/**
 * MeasurementPlanChip — compact one-row DOM display of a MeasurementPlan.
 *
 * Pure DOM component (no SVG). Mounted inside <HypothesisCard> via foreignObject in Task 8.
 * Props-based — no store access.
 */

import type { MeasurementPlan } from '@variscout/core/measurementPlan';

export interface MeasurementPlanChipProps {
  plan: MeasurementPlan;
  ownerName: string;
  canEdit: boolean;
  onEdit: (planId: MeasurementPlan['id']) => void;
  onLinkFinding: (planId: MeasurementPlan['id']) => void;
}

const STATUS_INDICATOR: Record<MeasurementPlan['status'], { icon: string; className: string }> = {
  planned: { icon: '⏳', className: 'text-amber-500' },
  'in-progress': { icon: '⏳', className: 'text-amber-500' },
  complete: { icon: '✓', className: 'text-green-700' },
  skipped: { icon: '✗', className: 'text-gray-500' },
};

export function MeasurementPlanChip({
  plan,
  ownerName,
  canEdit,
  onEdit,
  onLinkFinding,
}: MeasurementPlanChipProps) {
  const indicator = STATUS_INDICATOR[plan.status];
  const showLinkButton = canEdit && (plan.status === 'planned' || plan.status === 'in-progress');

  return (
    <div
      data-testid="chip-body"
      className={`flex items-center gap-2 px-2 py-1 text-sm border-b border-gray-200 ${
        canEdit ? 'cursor-pointer hover:bg-gray-50' : ''
      }`}
      onClick={canEdit ? () => onEdit(plan.id) : undefined}
      onKeyDown={
        canEdit
          ? e => {
              if (e.key === 'Enter' || e.key === ' ') onEdit(plan.id);
            }
          : undefined
      }
      tabIndex={canEdit ? 0 : undefined}
    >
      <span data-testid="status-indicator" className={`font-semibold ${indicator.className}`}>
        {indicator.icon}
      </span>
      <span className="text-gray-600">{plan.method}</span>
      <span className="text-gray-400">•</span>
      <span className="font-medium">{plan.factor}</span>
      <span className="text-gray-400">•</span>
      <span className="text-gray-600">n={plan.sampleSize}</span>
      <span className="text-gray-400">•</span>
      <span className="text-gray-600">{ownerName}</span>
      {showLinkButton && (
        <button
          type="button"
          className="ml-auto text-xs text-blue-600 hover:text-blue-800 underline"
          onClick={e => {
            e.stopPropagation();
            onLinkFinding(plan.id);
          }}
        >
          Link Finding…
        </button>
      )}
    </div>
  );
}
