import React from 'react';
import { formatMessage, getMessage } from '@variscout/core/i18n';
import type { ProcessMap } from '@variscout/core/frame';
import { useCanvasViewportStore, type ProcessHubId } from '@variscout/stores';
import { useWallLocale } from '../../InvestigationWall/hooks/useWallLocale';

export interface NoFocalStepPromptProps {
  hubId: ProcessHubId;
  map: ProcessMap;
}

export function sortedProcessSteps(map: ProcessMap) {
  return [...map.nodes].sort((left, right) => left.order - right.order);
}

export function NoFocalStepPrompt({ hubId, map }: NoFocalStepPromptProps) {
  const locale = useWallLocale();
  const steps = React.useMemo(() => sortedProcessSteps(map), [map]);

  return (
    <section
      aria-label={getMessage(locale, 'canvas.noFocalStep.ariaLabel')}
      data-testid="no-focal-step-prompt"
      className="bg-surface-background p-6"
    >
      <div className="max-w-xl rounded-md border border-edge bg-surface-primary p-4">
        <h2 className="text-sm font-semibold text-content">
          {getMessage(locale, 'canvas.noFocalStep.heading')}
        </h2>
        <p className="mt-1 text-sm text-content-secondary">
          {getMessage(locale, 'canvas.noFocalStep.description')}
        </p>
        {steps.length > 0 ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {steps.map(step => (
              <button
                key={step.id}
                type="button"
                className="rounded-md border border-edge bg-surface-secondary px-3 py-2 text-sm font-medium text-content hover:bg-surface-tertiary focus:outline-none focus:ring-2 focus:ring-accent"
                onClick={() => useCanvasViewportStore.getState().setLevel(hubId, 'l3', step.id)}
                aria-label={formatMessage(locale, 'canvas.noFocalStep.openStepAria', {
                  stepName: step.name,
                })}
              >
                {step.name}
              </button>
            ))}
          </div>
        ) : (
          <p className="mt-4 text-sm text-content-muted">
            {getMessage(locale, 'canvas.noFocalStep.noStepsHint')}
          </p>
        )}
      </div>
    </section>
  );
}
