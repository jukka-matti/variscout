import { DndContext } from '@dnd-kit/core';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { createTestOutcomeSpec } from '../../../../../test-utils/outcomeSpec';
import { OutcomeZone, type OutcomeZoneProps } from '..';

function renderZone(props: Partial<OutcomeZoneProps> = {}) {
  return render(
    <DndContext>
      <OutcomeZone
        specs={[]}
        numericValuesByColumn={{}}
        onSpecAdd={vi.fn()}
        onSpecUpdate={vi.fn()}
        {...props}
      />
    </DndContext>
  );
}

describe('OutcomeZone', () => {
  it('renders empty-state hint when no specs', () => {
    renderZone();
    expect(screen.getByText(/drop a numeric column/i)).toBeInTheDocument();
  });

  it('renders one OutcomeCard per spec', () => {
    const specs = [
      createTestOutcomeSpec({ id: 'o-1', columnName: 'A' }),
      createTestOutcomeSpec({ id: 'o-2', columnName: 'B' }),
    ];
    renderZone({ specs });
    expect(screen.getByText('A')).toBeInTheDocument();
    expect(screen.getByText('B')).toBeInTheDocument();
  });

  it('has data-testid="outcome-zone" wrapper', () => {
    renderZone();
    expect(screen.getByTestId('outcome-zone')).toBeInTheDocument();
  });

  it('clicking ⚙ on a card opens SpecsPopover', () => {
    renderZone({ specs: [createTestOutcomeSpec({ id: 'o-1', columnName: 'A' })] });
    fireEvent.click(screen.getByRole('button', { name: /edit specs/i }));
    expect(screen.getByRole('dialog', { name: /edit outcome specs/i })).toBeInTheDocument();
  });

  it('only one popover open at a time (mutual exclusion)', () => {
    renderZone({
      specs: [
        createTestOutcomeSpec({ id: 'o-1', columnName: 'A' }),
        createTestOutcomeSpec({ id: 'o-2', columnName: 'B' }),
      ],
    });
    const buttons = screen.getAllByRole('button', { name: /edit specs/i });
    fireEvent.click(buttons[0]);
    fireEvent.click(buttons[1]);
    expect(screen.getAllByRole('dialog', { name: /edit outcome specs/i })).toHaveLength(1);
  });

  it('popover Apply fires onSpecUpdate with updated spec', () => {
    const onSpecUpdate = vi.fn();
    renderZone({
      specs: [createTestOutcomeSpec({ id: 'o-1', columnName: 'A', target: 5 })],
      onSpecUpdate,
    });
    fireEvent.click(screen.getByRole('button', { name: /edit specs/i }));
    fireEvent.change(screen.getByLabelText(/^target$/i), { target: { value: '42' } });
    fireEvent.click(screen.getByRole('button', { name: /apply/i }));
    expect(onSpecUpdate).toHaveBeenCalledWith('o-1', expect.objectContaining({ target: 42 }));
  });

  it('popover Escape closes without firing onSpecUpdate', () => {
    const onSpecUpdate = vi.fn();
    renderZone({
      specs: [createTestOutcomeSpec({ id: 'o-1', columnName: 'A' })],
      onSpecUpdate,
    });
    fireEvent.click(screen.getByRole('button', { name: /edit specs/i }));
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('dialog', { name: /edit outcome specs/i })).not.toBeInTheDocument();
    expect(onSpecUpdate).not.toHaveBeenCalled();
  });
});
