import { DndContext } from '@dnd-kit/core';
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { createTestStep } from '../../../../../test-utils/step';
import { ProcessStructureZone, type ProcessStructureZoneProps } from '..';

function renderZone(props: Partial<ProcessStructureZoneProps> = {}) {
  return render(
    <DndContext>
      <ProcessStructureZone steps={[]} {...props} />
    </DndContext>
  );
}

describe('ProcessStructureZone', () => {
  it('has data-testid="process-structure-zone"', () => {
    renderZone();
    expect(screen.getByTestId('process-structure-zone')).toBeInTheDocument();
  });

  it('renders empty-state hint when no steps', () => {
    renderZone();
    expect(screen.getByText(/drop a categorical column/i)).toBeInTheDocument();
  });

  it('does not render empty-state hint when steps are present', () => {
    renderZone({ steps: [createTestStep({ id: 'step-1', name: 'Receive', order: 0 })] });
    expect(screen.queryByText(/drop a categorical column/i)).not.toBeInTheDocument();
  });

  it('renders one StepBox per step', () => {
    const steps = [
      createTestStep({ id: 's-1', name: 'Receive', order: 0 }),
      createTestStep({ id: 's-2', name: 'Process', order: 1 }),
    ];
    renderZone({ steps });
    expect(screen.getByTestId('step-box-s-1')).toBeInTheDocument();
    expect(screen.getByTestId('step-box-s-2')).toBeInTheDocument();
  });

  it('sorts steps by order ascending', () => {
    const steps = [
      createTestStep({ id: 's-3', name: 'Ship', order: 2 }),
      createTestStep({ id: 's-1', name: 'Receive', order: 0 }),
      createTestStep({ id: 's-2', name: 'Process', order: 1 }),
    ];
    renderZone({ steps });
    // Match root step-box elements only (not internal-* sub-sections)
    const boxes = screen.getAllByTestId(/^step-box-(?!.*-internal-)/);
    expect(boxes[0]).toHaveAttribute('data-testid', 'step-box-s-1');
    expect(boxes[1]).toHaveAttribute('data-testid', 'step-box-s-2');
    expect(boxes[2]).toHaveAttribute('data-testid', 'step-box-s-3');
  });

  it('renders connector arrows between consecutive steps when 2+ steps', () => {
    const steps = [
      createTestStep({ id: 'a', order: 0 }),
      createTestStep({ id: 'b', order: 1 }),
      createTestStep({ id: 'c', order: 2 }),
    ];
    renderZone({ steps });
    // 3 steps → 2 connectors
    expect(screen.getByTestId('process-step-connector-0')).toBeInTheDocument();
    expect(screen.getByTestId('process-step-connector-1')).toBeInTheDocument();
    expect(screen.queryByTestId('process-step-connector-2')).not.toBeInTheDocument();
  });

  it('renders no connector for single step', () => {
    renderZone({ steps: [createTestStep()] });
    expect(screen.queryByTestId(/^process-step-connector-/)).not.toBeInTheDocument();
  });

  it('renders no connector for zero steps', () => {
    renderZone();
    expect(screen.queryByTestId(/^process-step-connector-/)).not.toBeInTheDocument();
  });

  it('connector spans have aria-hidden="true"', () => {
    const steps = [createTestStep({ id: 'x', order: 0 }), createTestStep({ id: 'y', order: 1 })];
    renderZone({ steps });
    const connector = screen.getByTestId('process-step-connector-0');
    expect(connector).toHaveAttribute('aria-hidden', 'true');
  });
});

describe('ProcessStructureZone — timingByStepId forward prop (D1 Task 9)', () => {
  it('accepts timingByStepId prop (defaults to {} — no badges rendered without it)', () => {
    const steps = [
      createTestStep({ id: 'mix', order: 0 }),
      createTestStep({ id: 'fill', order: 1 }),
    ];
    renderZone({ steps });
    expect(screen.queryByTestId('badge')).not.toBeInTheDocument();
  });

  it('passes timingBadge to the matching StepBox when timingByStepId entry is present', () => {
    const steps = [
      createTestStep({ id: 'mix', order: 0 }),
      createTestStep({ id: 'fill', order: 1 }),
    ];
    renderZone({
      steps,
      timingByStepId: { mix: <span data-testid="badge">⏱ ~42 min</span> },
    });
    // Badge appears inside the mix step box
    const mixBox = screen.getByTestId('step-box-mix');
    expect(mixBox).toContainElement(screen.getByTestId('badge'));
    expect(screen.getByTestId('badge')).toHaveTextContent('⏱ ~42 min');
  });

  it('does not render a badge for a step absent from timingByStepId', () => {
    const steps = [
      createTestStep({ id: 'mix', order: 0 }),
      createTestStep({ id: 'fill', order: 1 }),
    ];
    renderZone({
      steps,
      timingByStepId: { mix: <span data-testid="badge">⏱ ~42 min</span> },
    });
    // fill step has no badge
    const fillBox = screen.getByTestId('step-box-fill');
    expect(fillBox).not.toContainElement(screen.queryByTestId('fill-badge'));
    // The only badge rendered is for mix
    expect(screen.getAllByTestId('badge')).toHaveLength(1);
  });

  it('empty timingByStepId ({}) renders no badges', () => {
    const steps = [createTestStep({ id: 'a', order: 0 }), createTestStep({ id: 'b', order: 1 })];
    renderZone({ steps, timingByStepId: {} });
    expect(screen.queryByTestId('badge')).not.toBeInTheDocument();
  });
});
