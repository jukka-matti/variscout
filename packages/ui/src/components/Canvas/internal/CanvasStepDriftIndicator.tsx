import React from 'react';
import type { DriftResult } from '@variscout/core';

interface CanvasStepDriftIndicatorProps {
  drift: DriftResult | undefined;
  stepId: string;
  stepLabel: string;
}

const ARROW_BY_DIRECTION: Record<DriftResult['direction'], string> = {
  up: '▲',
  down: '▼',
  flat: '→',
};

const STYLE_BY_DIRECTION: Record<DriftResult['direction'], string> = {
  up: 'bg-status-pass-soft text-status-pass',
  down: 'bg-status-fail-soft text-status-fail',
  flat: 'bg-surface-secondary text-content-secondary',
};

const LABEL_BY_DIRECTION: Record<DriftResult['direction'], string> = {
  up: 'improving',
  down: 'degrading',
  flat: 'stable',
};

export const CanvasStepDriftIndicator: React.FC<CanvasStepDriftIndicatorProps> = ({
  drift,
  stepId,
  stepLabel,
}) => {
  if (!drift) return null;

  const showMagnitude = drift.direction !== 'flat';
  const magnitudePercent = Math.round(drift.magnitude * 100);
  const stateLabel = LABEL_BY_DIRECTION[drift.direction];

  return (
    <span
      className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[11px] font-medium ${STYLE_BY_DIRECTION[drift.direction]}`}
      data-testid={`canvas-step-drift-indicator-${stepId}`}
      aria-label={`${stepLabel} ${stateLabel}${showMagnitude ? ` ${magnitudePercent}%` : ''}`}
      title={`${stateLabel}${showMagnitude ? ` (${magnitudePercent}%)` : ''} via ${drift.metric}`}
    >
      <span aria-hidden="true">{ARROW_BY_DIRECTION[drift.direction]}</span>
      {showMagnitude ? <span>{magnitudePercent}%</span> : null}
    </span>
  );
};
