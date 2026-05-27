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
    const boxes = screen.getAllByTestId(/^step-box-/);
    expect(boxes[0]).toHaveAttribute('data-testid', 'step-box-s-1');
    expect(boxes[1]).toHaveAttribute('data-testid', 'step-box-s-2');
    expect(boxes[2]).toHaveAttribute('data-testid', 'step-box-s-3');
  });
});
