import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { DriftResult } from '@variscout/core';
import { CanvasStepDriftIndicator } from '../CanvasStepDriftIndicator';

const drift = (overrides: Partial<DriftResult> = {}): DriftResult => ({
  direction: 'up',
  magnitude: 0.07,
  threshold: 0.05,
  metric: 'cpk',
  ...overrides,
});

describe('CanvasStepDriftIndicator', () => {
  it('renders nothing when drift is undefined', () => {
    const { container } = render(
      <CanvasStepDriftIndicator drift={undefined} stepId="mix" stepLabel="Mix" />
    );

    expect(container).toBeEmptyDOMElement();
  });

  it('renders an up arrow with magnitude percent when direction is up', () => {
    render(<CanvasStepDriftIndicator drift={drift()} stepId="mix" stepLabel="Mix" />);

    const node = screen.getByTestId('canvas-step-drift-indicator-mix');

    expect(node).toHaveTextContent('▲');
    expect(node).toHaveTextContent('7%');
    expect(node.getAttribute('aria-label')).toMatch(/improving/i);
  });

  it('renders a down arrow with magnitude percent when direction is down', () => {
    render(
      <CanvasStepDriftIndicator
        drift={drift({ direction: 'down', magnitude: 0.12 })}
        stepId="mix"
        stepLabel="Mix"
      />
    );

    const node = screen.getByTestId('canvas-step-drift-indicator-mix');

    expect(node).toHaveTextContent('▼');
    expect(node).toHaveTextContent('12%');
    expect(node.getAttribute('aria-label')).toMatch(/degrading/i);
  });

  it('renders a flat indicator without magnitude percent', () => {
    render(
      <CanvasStepDriftIndicator
        drift={drift({ direction: 'flat', magnitude: 0.01 })}
        stepId="mix"
        stepLabel="Mix"
      />
    );

    const node = screen.getByTestId('canvas-step-drift-indicator-mix');

    expect(node).toHaveTextContent('→');
    expect(node).not.toHaveTextContent('%');
  });
});
