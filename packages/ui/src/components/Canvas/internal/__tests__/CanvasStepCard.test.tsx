import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { CanvasStepCardModel, CanvasStepInvestigationOverlay } from '@variscout/hooks';
import { CanvasStepCard } from '../CanvasStepCard';

const baseCard: CanvasStepCardModel = {
  stepId: 'step-1',
  stepName: 'Chamber 3',
  metricColumn: 'pressure_psi',
  metricKind: 'numeric',
  assignedColumns: ['pressure_psi', 'temp_c'],
  values: [10, 11, 12],
  distribution: [],
  capability: { state: 'no-specs', n: 3, canAddSpecs: true },
  stats: {
    mean: 11,
    median: 11,
    stdDev: 1,
    sigmaWithin: 1,
    mrBar: 1,
    ucl: 14,
    lcl: 8,
    outOfSpecPercentage: 0,
  },
};

const overlayWithPromoted: CanvasStepInvestigationOverlay = {
  stepId: 'step-1',
  questions: [],
  findings: [],
  hypotheses: [
    {
      id: 'hub-1',
      name: 'Thermal drift',
      status: 'proposed',
      questionId: undefined,
      focus: { kind: 'suspected-cause', id: 'hub-1' },
    },
  ],
  causalLinks: [],
  investigationCounts: { open: 0, supported: 0, refuted: 0 },
};

describe('CanvasStepCard hypothesis drawing affordances', () => {
  it('renders StepNodeMarker instead of inline cause count for promoted causes', () => {
    render(
      <CanvasStepCard
        card={baseCard}
        activeLens="default"
        activeOverlays={['hypothesis-hubs']}
        investigationOverlay={overlayWithPromoted}
        activeCanvasTool="select"
        onOpen={() => undefined}
      />
    );

    expect(screen.getByTestId('step-node-marker')).toBeInTheDocument();
    expect(screen.queryByText(/^1 cause$/)).not.toBeInTheDocument();
  });

  it('exposes a step arrow endpoint on the card root', () => {
    render(
      <CanvasStepCard
        card={baseCard}
        activeLens="default"
        activeCanvasTool="select"
        onOpen={() => undefined}
      />
    );

    expect(screen.getByTestId('canvas-step-card-step-1')).toHaveAttribute(
      'data-arrow-endpoint',
      'step:step-1'
    );
  });

  it('does not expose a step arrow endpoint when the card has no metric column', () => {
    render(
      <CanvasStepCard
        card={{ ...baseCard, metricColumn: undefined }}
        activeLens="default"
        activeCanvasTool="select"
        onOpen={() => undefined}
      />
    );

    expect(screen.getByTestId('canvas-step-card-step-1')).not.toHaveAttribute(
      'data-arrow-endpoint'
    );
  });

  it('exposes column arrow endpoints on visible assigned column chips', () => {
    render(
      <CanvasStepCard
        card={baseCard}
        activeLens="default"
        activeCanvasTool="select"
        onOpen={() => undefined}
      />
    );

    const pressureChip = screen
      .getAllByText('pressure_psi')
      .find(element => element.tagName === 'SPAN');
    expect(pressureChip).toHaveAttribute('data-arrow-endpoint', 'column:pressure_psi');
    expect(screen.getByText('temp_c')).toHaveAttribute('data-arrow-endpoint', 'column:temp_c');
  });

  it('makes column arrow endpoints keyboard-focusable while draw-hypothesis is active', () => {
    render(
      <CanvasStepCard
        card={baseCard}
        activeLens="default"
        activeCanvasTool="draw-hypothesis"
        onOpen={() => undefined}
      />
    );

    expect(screen.getByText('temp_c')).toHaveAttribute('tabIndex', '0');
    expect(screen.getByText('temp_c')).toHaveAttribute('role', 'button');
    expect(screen.getByText('temp_c')).toHaveAttribute('aria-label', 'Hypothesis endpoint temp_c');
  });

  it('keeps column endpoints resolvable on metric-less cards', () => {
    render(
      <CanvasStepCard
        card={{ ...baseCard, metricColumn: undefined }}
        activeLens="default"
        activeCanvasTool="draw-hypothesis"
        onOpen={() => undefined}
      />
    );

    expect(screen.getByText('temp_c')).toHaveAttribute('data-arrow-host-step-id', 'step-1');
    expect(screen.getByText('temp_c')).toHaveAttribute('role', 'button');
  });

  it('opens drilldown on click while select tool is active', () => {
    const onOpen = vi.fn();
    render(
      <CanvasStepCard
        card={baseCard}
        activeLens="default"
        activeCanvasTool="select"
        onOpen={onOpen}
      />
    );

    fireEvent.click(screen.getByTestId('canvas-step-card-step-1'));

    expect(onOpen).toHaveBeenCalled();
  });

  it('does not open drilldown on click while draw-hypothesis tool is active', () => {
    const onOpen = vi.fn();
    render(
      <CanvasStepCard
        card={baseCard}
        activeLens="default"
        activeCanvasTool="draw-hypothesis"
        onOpen={onOpen}
      />
    );

    fireEvent.click(screen.getByTestId('canvas-step-card-step-1'));

    expect(onOpen).not.toHaveBeenCalled();
  });

  it('clicking StepNodeMarker opens drilldown once', () => {
    const onOpen = vi.fn();
    render(
      <CanvasStepCard
        card={baseCard}
        activeLens="default"
        activeOverlays={['hypothesis-hubs']}
        investigationOverlay={overlayWithPromoted}
        activeCanvasTool="select"
        onOpen={onOpen}
      />
    );

    fireEvent.click(screen.getByTestId('step-node-marker'));

    expect(onOpen).toHaveBeenCalledTimes(1);
  });

  it('does not open StepNodeMarker drilldown while draw-hypothesis tool is active', () => {
    const onOpen = vi.fn();
    render(
      <CanvasStepCard
        card={baseCard}
        activeLens="default"
        activeOverlays={['hypothesis-hubs']}
        investigationOverlay={overlayWithPromoted}
        activeCanvasTool="draw-hypothesis"
        onOpen={onOpen}
      />
    );

    fireEvent.click(screen.getByTestId('step-node-marker'));

    expect(onOpen).not.toHaveBeenCalled();
  });

  it('does not open step specs while draw-hypothesis tool is active', () => {
    const onStepSpecsRequest = vi.fn();
    render(
      <CanvasStepCard
        card={baseCard}
        activeLens="default"
        activeCanvasTool="draw-hypothesis"
        onOpen={() => undefined}
        onStepSpecsRequest={onStepSpecsRequest}
      />
    );

    const specButton = screen.getByText('+ Add specs');
    expect(specButton).toBeDisabled();
    fireEvent.click(specButton);

    expect(onStepSpecsRequest).not.toHaveBeenCalled();
  });
});
