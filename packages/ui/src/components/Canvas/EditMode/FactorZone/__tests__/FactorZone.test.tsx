import { DndContext } from '@dnd-kit/core';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { createTestFactorControl } from '../../../../../test-utils/factorControl';
import { FactorZone, type FactorZoneProps } from '..';

function renderZone(props: Partial<FactorZoneProps> = {}) {
  return render(
    <DndContext>
      <FactorZone
        controls={[]}
        steps={[]}
        onControlAdd={vi.fn()}
        onControlUpdate={vi.fn()}
        {...props}
      />
    </DndContext>
  );
}

describe('FactorZone', () => {
  it('renders empty-state hint when no controls', () => {
    renderZone();
    expect(screen.getByText(/drop a column to set a factor/i)).toBeInTheDocument();
  });

  it('renders one FactorChip per control', () => {
    const controls = [
      createTestFactorControl({ factor: 'Temp' }),
      createTestFactorControl({ factor: 'Pressure' }),
    ];
    renderZone({ controls });
    expect(screen.getByText('Temp')).toBeInTheDocument();
    expect(screen.getByText('Pressure')).toBeInTheDocument();
  });

  it('has data-testid="factor-zone-global" wrapper', () => {
    renderZone();
    expect(screen.getByTestId('factor-zone-global')).toBeInTheDocument();
  });

  it('clicking ⚙ opens FactorSpecsPopover', () => {
    renderZone({ controls: [createTestFactorControl({ factor: 'Temp' })] });
    fireEvent.click(screen.getByRole('button', { name: /edit factor/i }));
    expect(screen.getByRole('dialog', { name: /edit factor/i })).toBeInTheDocument();
  });

  it('only one popover open at a time (mutual exclusion)', () => {
    renderZone({
      controls: [
        createTestFactorControl({ factor: 'Temp' }),
        createTestFactorControl({ factor: 'Pressure' }),
      ],
    });
    const buttons = screen.getAllByRole('button', { name: /edit factor/i });
    fireEvent.click(buttons[0]);
    fireEvent.click(buttons[1]);
    expect(screen.getAllByRole('dialog', { name: /edit factor/i })).toHaveLength(1);
  });

  it('popover Apply fires onControlUpdate with original factor name + updated control', () => {
    const onControlUpdate = vi.fn();
    renderZone({
      controls: [createTestFactorControl({ factor: 'Temp', targetCondition: 'old' })],
      onControlUpdate,
    });
    fireEvent.click(screen.getByRole('button', { name: /edit factor/i }));
    fireEvent.change(screen.getByLabelText(/target condition/i), { target: { value: 'new' } });
    fireEvent.click(screen.getByRole('button', { name: /apply/i }));
    expect(onControlUpdate).toHaveBeenCalledWith(
      'Temp',
      expect.objectContaining({ targetCondition: 'new' })
    );
  });

  it('popover Escape closes without firing onControlUpdate', () => {
    const onControlUpdate = vi.fn();
    renderZone({
      controls: [createTestFactorControl({ factor: 'Temp' })],
      onControlUpdate,
    });
    fireEvent.click(screen.getByRole('button', { name: /edit factor/i }));
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('dialog', { name: /edit factor/i })).not.toBeInTheDocument();
    expect(onControlUpdate).not.toHaveBeenCalled();
  });

  it('forwards steps prop to FactorSpecsPopover', () => {
    renderZone({
      controls: [createTestFactorControl()],
      steps: [{ id: 's-1', name: 'StepOne' }],
    });
    fireEvent.click(screen.getByRole('button', { name: /edit factor/i }));
    expect(screen.getByRole('option', { name: /stepone/i })).toBeInTheDocument();
  });
});
