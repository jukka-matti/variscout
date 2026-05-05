import React from 'react';
import { formatStatistic } from '@variscout/core/i18n';
import type {
  CanvasLensId,
  CanvasOverlayId,
  CanvasStepCardModel,
  CanvasStepInvestigationOverlay,
} from '@variscout/hooks';
import { StepDefectIndicator } from '../../StepDefectIndicator';
import { CanvasStepMiniChart } from './CanvasStepMiniChart';

interface CanvasStepCardProps {
  card: CanvasStepCardModel;
  activeLens: CanvasLensId;
  activeOverlays?: CanvasOverlayId[];
  investigationOverlay?: CanvasStepInvestigationOverlay;
  onOpen: (stepId: string, element: HTMLElement) => void;
  onStepSpecsRequest?: (column: string, stepId: string) => void;
  registerCardElement?: (stepId: string, element: HTMLElement | null) => void;
}

function capabilityText(card: CanvasStepCardModel): string {
  const c = card.capability;
  const cpkText = c.cpk === undefined ? '—' : formatStatistic(c.cpk, 'en', 2);
  if (c.state === 'no-specs' && card.stats) {
    return `${formatStatistic(card.stats.mean, 'en', 2)} +/- ${formatStatistic(card.stats.stdDev, 'en', 2)} · n=${c.n}`;
  }
  if (c.state === 'no-specs') return 'mean +/- sigma';
  if (c.state === 'partial-specs') return 'complete specs';
  if (c.state === 'suppressed') return `Cpk hidden, n=${c.n}`;
  if (c.state === 'review') return `Cpk ${cpkText} trust pending`;
  if (c.state === 'graded') return `Cpk ${cpkText} ${c.grade}`;
  return 'Cpk unavailable';
}

function gradeClass(card: CanvasStepCardModel): string {
  if (card.capability.grade === 'green') return 'bg-emerald-500/10 text-emerald-700';
  if (card.capability.grade === 'amber') return 'bg-amber-500/10 text-amber-700';
  if (card.capability.grade === 'red') return 'bg-red-500/10 text-red-700';
  return 'bg-surface-secondary text-content-secondary';
}

export const CanvasStepCard: React.FC<CanvasStepCardProps> = ({
  card,
  activeLens,
  activeOverlays = [],
  investigationOverlay,
  onOpen,
  onStepSpecsRequest,
  registerCardElement,
}) => {
  const showDefects = activeLens === 'defect' && card.defectCount !== undefined;
  const showCapability = activeLens === 'capability' || activeLens === 'default';
  const showInvestigations = activeOverlays.includes('investigations') && investigationOverlay;
  const showFindings = activeOverlays.includes('findings') && investigationOverlay?.findings.length;
  const showSuspectedCauses =
    activeOverlays.includes('suspected-causes') && investigationOverlay?.suspectedCauses.length;
  const activityCount = investigationOverlay
    ? investigationOverlay.investigationCounts.open +
      investigationOverlay.investigationCounts.supported +
      investigationOverlay.investigationCounts.refuted
    : 0;
  const specButtonLabel =
    card.capability.state === 'no-specs'
      ? `Add specs for ${card.stepName}`
      : `Edit specs for ${card.stepName}`;

  return (
    <article
      ref={element => registerCardElement?.(card.stepId, element)}
      role="button"
      tabIndex={0}
      className="flex min-h-44 flex-col gap-3 rounded-md border border-edge bg-surface-primary p-3 text-left shadow-sm transition-colors hover:border-edge-strong"
      data-testid={`canvas-step-card-${card.stepId}`}
      onClick={event => onOpen(card.stepId, event.currentTarget)}
      onKeyDown={event => {
        if (event.key !== 'Enter' && event.key !== ' ') return;
        event.preventDefault();
        onOpen(card.stepId, event.currentTarget);
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <h4 className="text-sm font-semibold text-content">{card.stepName}</h4>
          {card.metricColumn ? (
            <p className="text-xs text-content-secondary">{card.metricColumn}</p>
          ) : (
            <p className="text-xs text-content-muted">No metric selected</p>
          )}
        </div>
        {showDefects ? (
          <StepDefectIndicator defectCount={card.defectCount ?? 0} stepLabel={card.stepName} />
        ) : null}
      </div>

      <CanvasStepMiniChart card={card} />

      <div className="flex flex-wrap items-center gap-1">
        {showInvestigations && activityCount > 0 ? (
          <span
            className="rounded-full bg-blue-500/10 px-2 py-0.5 text-[11px] font-medium text-blue-700"
            data-testid={`canvas-step-investigation-badge-${card.stepId}`}
            title={`${activityCount} investigation item${activityCount === 1 ? '' : 's'}`}
          >
            {activityCount} investigation
          </span>
        ) : null}
        {showFindings ? (
          <span
            className="rounded-full bg-sky-500/10 px-2 py-0.5 text-[11px] font-medium text-sky-700"
            data-testid={`canvas-step-finding-pin-${card.stepId}`}
          >
            {investigationOverlay?.findings.length} finding
          </span>
        ) : null}
        {showSuspectedCauses ? (
          <span
            className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[11px] font-medium text-amber-700"
            data-testid={`canvas-step-suspected-cause-marker-${card.stepId}`}
          >
            {investigationOverlay?.suspectedCauses.length} cause
          </span>
        ) : null}
        {showCapability ? (
          <span
            className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${gradeClass(card)}`}
            data-testid={`canvas-step-capability-${card.stepId}`}
          >
            {capabilityText(card)}
          </span>
        ) : null}
        {card.assignedColumns.slice(0, 3).map(column => (
          <span
            key={column}
            className="rounded-full bg-surface-secondary px-2 py-0.5 text-[11px] text-content-secondary"
          >
            {column}
          </span>
        ))}
      </div>

      {card.metricColumn ? (
        <button
          type="button"
          className="mt-auto self-start rounded border border-edge bg-surface-secondary px-2 py-1 text-xs font-medium text-content-secondary hover:bg-surface-tertiary hover:text-content"
          aria-label={specButtonLabel}
          onClick={event => {
            event.stopPropagation();
            onStepSpecsRequest?.(card.metricColumn!, card.stepId);
          }}
        >
          {card.capability.canAddSpecs ? '+ Add specs' : 'Edit specs'}
        </button>
      ) : null}
    </article>
  );
};
