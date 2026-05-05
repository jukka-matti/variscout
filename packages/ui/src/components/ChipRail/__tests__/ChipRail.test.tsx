import { DndContext } from '@dnd-kit/core';
import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ChipRail, type ChipRailEntry } from '../ChipRail';

const chips: ChipRailEntry[] = [
  { chipId: 'cycle-time', label: 'Cycle time', role: 'factor' },
  { chipId: 'operator', label: 'Operator', role: 'metadata' },
];

describe('ChipRail', () => {
  it('renders an accessible rail with one item per chip', () => {
    render(
      <DndContext>
        <ChipRail chips={chips} />
      </DndContext>
    );

    const rail = screen.getByTestId('chip-rail');
    expect(screen.getByRole('complementary', { name: 'Unassigned columns' })).toBe(rail);
    expect(within(rail).getByRole('heading', { name: 'Unassigned columns' })).toBeInTheDocument();
    expect(screen.getByTestId('chip-rail-item-cycle-time')).toBeInTheDocument();
    expect(screen.getByTestId('chip-rail-item-operator')).toBeInTheDocument();
  });

  it('renders an empty state when all chips are assigned', () => {
    render(<ChipRail chips={[]} />);

    const rail = screen.getByTestId('chip-rail');
    expect(within(rail).getByText('All columns assigned')).toBeInTheDocument();
    expect(within(rail).queryByRole('button')).toBeNull();
  });

  it('accepts a className for parent layout integration', () => {
    render(<ChipRail chips={[]} className="custom-rail" />);

    expect(screen.getByTestId('chip-rail')).toHaveClass('custom-rail');
  });
});
