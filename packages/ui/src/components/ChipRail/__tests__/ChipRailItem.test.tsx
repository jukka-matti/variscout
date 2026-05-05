import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { encodeChipDragId } from '@variscout/hooks';

const draggableSpy = vi.hoisted(() => vi.fn());

vi.mock('@dnd-kit/core', () => ({
  useDraggable: draggableSpy,
}));

import { ChipRailItem } from '../ChipRailItem';

describe('ChipRailItem', () => {
  it('renders a draggable accessible button for a chip', () => {
    const setNodeRef = vi.fn();
    draggableSpy.mockReturnValue({
      attributes: {
        'aria-describedby': 'dnd-description',
      },
      listeners: {
        onPointerDown: vi.fn(),
      },
      setNodeRef,
      transform: null,
      isDragging: false,
    });

    render(<ChipRailItem chipId="cycle-time" label="Cycle time" role="factor" />);

    expect(draggableSpy).toHaveBeenCalledWith({ id: encodeChipDragId('cycle-time') });
    const item = screen.getByTestId('chip-rail-item-cycle-time');
    expect(item.tagName).toBe('BUTTON');
    expect(setNodeRef).toHaveBeenCalled();
    expect(screen.getByRole('button', { name: /Cycle time factor column/i })).toBeInTheDocument();
    expect(item).toHaveTextContent('Cycle time');
    expect(item).toHaveTextContent('factor');
  });

  it('marks the item while dragging', () => {
    draggableSpy.mockReturnValue({
      attributes: {},
      listeners: {},
      setNodeRef: vi.fn(),
      transform: { x: 4, y: 8, scaleX: 1, scaleY: 1 },
      isDragging: true,
    });

    render(<ChipRailItem chipId="operator" label="Operator" role="metadata" />);

    const item = screen.getByTestId('chip-rail-item-operator');
    expect(item).toHaveAttribute('data-dragging', 'true');
    expect(item).toHaveStyle({ transform: 'translate3d(4px, 8px, 0)' });
  });
});
