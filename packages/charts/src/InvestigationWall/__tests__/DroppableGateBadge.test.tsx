import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { DndContext } from '@dnd-kit/core';
import { DroppableGateBadge } from '../DroppableGateBadge';
import { encodeGatePath } from '../hooks/useWallDragDrop';

describe('DroppableGateBadge', () => {
  it('renders with an encoded data-drop-path derived from the GatePath prop', () => {
    const { container } = render(
      <DndContext>
        <svg>
          <DroppableGateBadge kind="and" path={[0, 1]} x={100} y={100} />
        </svg>
      </DndContext>
    );
    const wrapper = container.querySelector('[data-drop-target="gate"]');
    expect(wrapper).toBeTruthy();
    expect(wrapper?.getAttribute('data-drop-path')).toBe(encodeGatePath([0, 1]));
  });

  it('sets data-drop-over to "false" when nothing is hovering', () => {
    const { container } = render(
      <DndContext>
        <svg>
          <DroppableGateBadge kind="or" path={[]} x={0} y={0} />
        </svg>
      </DndContext>
    );
    expect(
      container.querySelector('[data-drop-target="gate"]')?.getAttribute('data-drop-over')
    ).toBe('false');
  });

  it('renders the inner GateBadge glyph for the kind', () => {
    const { container } = render(
      <DndContext>
        <svg>
          <DroppableGateBadge kind="not" path={['child']} x={0} y={0} />
        </svg>
      </DndContext>
    );
    // NOT uses the ⊘ glyph in GateBadge.
    expect(container.textContent).toContain('⊘');
  });
});
