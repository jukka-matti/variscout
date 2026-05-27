import { DndContext } from '@dnd-kit/core';
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { ReactElement } from 'react';
import { StepBox, type StepBoxStep } from '../StepBox';

function makeStep(overrides: Partial<StepBoxStep> = {}): StepBoxStep {
  return { id: 'step-1', name: 'Receive', order: 0, ...overrides };
}

function renderInDnd(ui: ReactElement) {
  return render(<DndContext>{ui}</DndContext>);
}

describe('StepBox', () => {
  it('renders the step name', () => {
    renderInDnd(<StepBox step={makeStep({ name: 'Assemble' })} />);
    expect(screen.getByText('Assemble')).toBeInTheDocument();
  });

  it('exposes data-testid using step.id', () => {
    renderInDnd(<StepBox step={makeStep({ id: 'step-abc' })} />);
    expect(screen.getByTestId('step-box-step-abc')).toBeInTheDocument();
  });

  it('renders 1-indexed order number (order + 1)', () => {
    renderInDnd(<StepBox step={makeStep({ order: 2 })} />);
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('renders order 1 for order=0', () => {
    renderInDnd(<StepBox step={makeStep({ order: 0 })} />);
    expect(screen.getByText('1')).toBeInTheDocument();
  });

  it('renders internal-Y section with data-testid', () => {
    renderInDnd(<StepBox step={makeStep({ id: 'step-1' })} />);
    expect(screen.getByTestId('step-box-step-1-internal-y')).toBeInTheDocument();
  });

  it('shows internal-Y empty hint', () => {
    renderInDnd(<StepBox step={makeStep({ id: 'step-1' })} />);
    expect(screen.getByText(/Drop a numeric column for this step's outcome/i)).toBeInTheDocument();
  });
});
