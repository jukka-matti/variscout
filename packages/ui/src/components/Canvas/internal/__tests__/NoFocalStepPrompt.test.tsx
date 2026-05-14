import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import type { ProcessMap } from '@variscout/core/frame';
import {
  getCanvasViewportInitialState,
  useCanvasViewportStore,
  type ProcessHubId,
} from '@variscout/stores';
import { NoFocalStepPrompt } from '../NoFocalStepPrompt';

// Cast helper: acceptable inside test files per project convention
const h = (id: string) => id as ProcessHubId;

const map: ProcessMap = {
  version: 1,
  nodes: [
    { id: 'step-2', name: 'Fill', order: 2 },
    { id: 'step-1', name: 'Mix', order: 1 },
  ],
  tributaries: [],
  createdAt: '2026-05-04T00:00:00.000Z',
  updatedAt: '2026-05-04T00:00:00.000Z',
};

describe('NoFocalStepPrompt', () => {
  beforeEach(() => {
    useCanvasViewportStore.setState(getCanvasViewportInitialState());
  });

  it('lists steps in process order and sets L3 focal step from a button click', () => {
    render(<NoFocalStepPrompt hubId={h('hub-prompt')} map={map} />);

    const prompt = screen.getByTestId('no-focal-step-prompt');
    expect(prompt).toHaveAccessibleName(/choose a process step/i);
    expect(screen.getAllByRole('button').map(button => button.textContent)).toEqual([
      'Mix',
      'Fill',
    ]);

    fireEvent.click(screen.getByRole('button', { name: /open mix local mechanism/i }));

    expect(useCanvasViewportStore.getState().getViewport(h('hub-prompt'))).toMatchObject({
      currentLevel: 'l3',
      focalStepId: 'step-1',
    });
  });
});
