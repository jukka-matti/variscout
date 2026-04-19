import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { DndContext } from '@dnd-kit/core';
import { DraggableHypothesisCard } from '../DraggableHypothesisCard';
import type { SuspectedCause } from '@variscout/core';

const hub: SuspectedCause = {
  id: 'h1',
  name: 'Nozzle runs hot',
  synthesis: '',
  questionIds: [],
  findingIds: [],
  status: 'proposed',
  createdAt: '',
  updatedAt: '',
};

describe('DraggableHypothesisCard', () => {
  it('renders inside a DndContext with a draggable data attr', () => {
    const { container } = render(
      <DndContext>
        <svg>
          <DraggableHypothesisCard hub={hub} displayStatus="proposed" x={100} y={100} />
        </svg>
      </DndContext>
    );
    expect(container.querySelector('[data-draggable-hub="h1"]')).toBeTruthy();
  });

  it('passes through the underlying hub name', () => {
    const { getByText } = render(
      <DndContext>
        <svg>
          <DraggableHypothesisCard hub={hub} displayStatus="proposed" x={100} y={100} />
        </svg>
      </DndContext>
    );
    expect(getByText(/Nozzle runs hot/)).toBeInTheDocument();
  });
});
