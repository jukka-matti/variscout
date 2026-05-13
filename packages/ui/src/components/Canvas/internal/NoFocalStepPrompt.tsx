import React from 'react';
import type { ProcessMap } from '@variscout/core/frame';
import { useCanvasViewportStore } from '@variscout/stores';

export interface NoFocalStepPromptProps {
  hubId: string;
  map: ProcessMap;
}

export function sortedProcessSteps(map: ProcessMap) {
  return [...map.nodes].sort((left, right) => left.order - right.order);
}

export function NoFocalStepPrompt({ hubId, map }: NoFocalStepPromptProps) {
  const steps = React.useMemo(() => sortedProcessSteps(map), [map]);

  return (
    <section
      aria-label="Choose a process step"
      data-testid="no-focal-step-prompt"
      className="bg-surface-background p-6"
    >
      <div className="max-w-xl rounded-md border border-edge bg-surface-primary p-4">
        <h2 className="text-sm font-semibold text-content">Choose a step for L3</h2>
        <p className="mt-1 text-sm text-content-secondary">
          Local mechanism view needs a focal process step.
        </p>
        {steps.length > 0 ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {steps.map(step => (
              <button
                key={step.id}
                type="button"
                className="rounded-md border border-edge bg-surface-secondary px-3 py-2 text-sm font-medium text-content hover:bg-surface-tertiary focus:outline-none focus:ring-2 focus:ring-accent"
                onClick={() => useCanvasViewportStore.getState().setLevel(hubId, 'l3', step.id)}
                aria-label={`Open ${step.name} local mechanism`}
              >
                {step.name}
              </button>
            ))}
          </div>
        ) : (
          <p className="mt-4 text-sm text-content-muted">
            Add a process step before opening the local mechanism view.
          </p>
        )}
      </div>
    </section>
  );
}
