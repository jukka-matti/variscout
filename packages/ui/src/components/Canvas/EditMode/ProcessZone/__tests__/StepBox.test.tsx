import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StepBox, type StepBoxStep } from '../StepBox';

function makeStep(overrides: Partial<StepBoxStep> = {}): StepBoxStep {
  return { id: 'step-1', name: 'Receive', order: 0, ...overrides };
}

describe('StepBox', () => {
  it('renders the step name', () => {
    render(<StepBox step={makeStep({ name: 'Assemble' })} />);
    expect(screen.getByText('Assemble')).toBeInTheDocument();
  });

  it('exposes data-testid using step.id', () => {
    render(<StepBox step={makeStep({ id: 'step-abc' })} />);
    expect(screen.getByTestId('step-box-step-abc')).toBeInTheDocument();
  });

  it('renders 1-indexed order number (order + 1)', () => {
    render(<StepBox step={makeStep({ order: 2 })} />);
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('renders order 1 for order=0', () => {
    render(<StepBox step={makeStep({ order: 0 })} />);
    expect(screen.getByText('1')).toBeInTheDocument();
  });
});
