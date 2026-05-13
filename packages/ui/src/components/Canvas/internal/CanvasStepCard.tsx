import React from 'react';
import { formatStatistic } from '@variscout/core/i18n';
import type {
  CanvasToolId,
  CanvasLensId,
  CanvasOverlayId,
  CanvasStepCardModel,
  CanvasStepInvestigationOverlay,
} from '@variscout/hooks';
import { StepDefectIndicator } from '../../StepDefectIndicator';
import { CanvasStepDriftIndicator } from './CanvasStepDriftIndicator';
import { CanvasStepMiniChart } from './CanvasStepMiniChart';
import { StepNodeMarker } from './StepNodeMarker';

interface CanvasStepCardProps {
  card: CanvasStepCardModel;
  zoom: number;
  activeLens: CanvasLensId;
  activeOverlays?: CanvasOverlayId[];
  investigationOverlay?: CanvasStepInvestigationOverlay;
  activeCanvasTool: CanvasToolId;
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
  if (card.capability.grade === 'green') return 'bg-status-pass-soft text-status-pass';
  if (card.capability.grade === 'amber') return 'bg-status-warning-soft text-status-warning';
  if (card.capability.grade === 'red') return 'bg-status-fail-soft text-status-fail';
  return 'bg-surface-secondary text-content-secondary';
}

export const CanvasStepCard: React.FC<CanvasStepCardProps> = ({
  card,
  zoom = 1,
  activeLens,
  activeOverlays = [],
  investigationOverlay,
  activeCanvasTool,
  onOpen,
  onStepSpecsRequest,
  registerCardElement,
}) => {
  const rootRef = React.useRef<HTMLDivElement | null>(null);
  const showFullDetail = zoom >= 1;
  const showDefects = showFullDetail && activeLens === 'defect' && card.defectCount !== undefined;
  const showCapability = !showFullDetail || activeLens === 'capability' || activeLens === 'default';
  const showInvestigations =
    showFullDetail && activeOverlays.includes('investigations') && investigationOverlay;
  const showFindings =
    showFullDetail && activeOverlays.includes('findings') && investigationOverlay?.findings.length;
  const showHypotheses =
    showFullDetail &&
    activeOverlays.includes('hypothesis-hubs') &&
    investigationOverlay?.hypotheses.length;
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
    <div
      ref={element => {
        rootRef.current = element;
        registerCardElement?.(card.stepId, element);
      }}
      role="button"
      tabIndex={0}
      className="flex min-h-44 flex-col gap-3 rounded-md border border-edge bg-surface-primary p-3 text-left shadow-sm transition-colors hover:border-edge-strong"
      data-testid={`canvas-step-card-${card.stepId}`}
      data-arrow-endpoint={card.metricColumn ? `step:${card.stepId}` : undefined}
      onClick={event => {
        if (activeCanvasTool === 'draw-hypothesis') return;
        onOpen(card.stepId, event.currentTarget);
      }}
      onKeyDown={event => {
        if (event.target !== event.currentTarget) return;
        if (event.key !== 'Enter' && event.key !== ' ') return;
        if (activeCanvasTool === 'draw-hypothesis') return;
        event.preventDefault();
        onOpen(card.stepId, event.currentTarget);
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <h4 className="text-sm font-semibold text-content">{card.stepName}</h4>
          {showFullDetail ? (
            card.metricColumn ? (
              <p className="text-xs text-content-secondary">{card.metricColumn}</p>
            ) : (
              <p className="text-xs text-content-muted">No metric selected</p>
            )
          ) : null}
        </div>
        {showDefects ? (
          <StepDefectIndicator defectCount={card.defectCount ?? 0} stepLabel={card.stepName} />
        ) : null}
      </div>

      {showFullDetail ? <CanvasStepMiniChart card={card} /> : null}

      <div className="flex flex-wrap items-center gap-1">
        {showInvestigations && activityCount > 0 ? (
          <span
            className="rounded-full bg-status-info-soft px-2 py-0.5 text-[11px] font-medium text-status-info"
            data-testid={`canvas-step-investigation-badge-${card.stepId}`}
            title={`${activityCount} investigation item${activityCount === 1 ? '' : 's'}`}
          >
            {activityCount} investigation
          </span>
        ) : null}
        {showFindings ? (
          <span
            className="rounded-full bg-status-info-soft px-2 py-0.5 text-[11px] font-medium text-status-info"
            data-testid={`canvas-step-finding-pin-${card.stepId}`}
          >
            {investigationOverlay?.findings.length} finding
          </span>
        ) : null}
        {showHypotheses ? (
          <StepNodeMarker
            hubs={(investigationOverlay?.hypotheses ?? []).map(cause => ({
              id: cause.id,
              name: cause.name,
              status: cause.status,
            }))}
            onClick={() => {
              if (activeCanvasTool === 'draw-hypothesis') return;
              if (rootRef.current) onOpen(card.stepId, rootRef.current);
            }}
          />
        ) : null}
        {showCapability ? (
          <span
            className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${gradeClass(card)}`}
            data-testid={`canvas-step-capability-${card.stepId}`}
          >
            {capabilityText(card)}
          </span>
        ) : null}
        {showCapability ? (
          <CanvasStepDriftIndicator
            drift={card.drift}
            stepId={card.stepId}
            stepLabel={card.stepName}
          />
        ) : null}
        {showFullDetail
          ? card.assignedColumns.slice(0, 3).map(column => (
              <span
                key={column}
                data-arrow-endpoint={`column:${column}`}
                data-arrow-host-step-id={card.stepId}
                role={activeCanvasTool === 'draw-hypothesis' ? 'button' : undefined}
                tabIndex={activeCanvasTool === 'draw-hypothesis' ? 0 : undefined}
                aria-label={`Hypothesis endpoint ${column}`}
                className="rounded-full bg-surface-secondary px-2 py-0.5 text-[11px] text-content-secondary"
              >
                {column}
              </span>
            ))
          : null}
      </div>

      {showFullDetail && card.metricColumn ? (
        <button
          type="button"
          className="mt-auto self-start rounded border border-edge bg-surface-secondary px-2 py-1 text-xs font-medium text-content-secondary hover:bg-surface-tertiary hover:text-content"
          aria-label={specButtonLabel}
          disabled={activeCanvasTool === 'draw-hypothesis'}
          onClick={event => {
            event.stopPropagation();
            if (activeCanvasTool === 'draw-hypothesis') return;
            onStepSpecsRequest?.(card.metricColumn!, card.stepId);
          }}
        >
          {card.capability.canAddSpecs ? '+ Add specs' : 'Edit specs'}
        </button>
      ) : null}
    </div>
  );
};
