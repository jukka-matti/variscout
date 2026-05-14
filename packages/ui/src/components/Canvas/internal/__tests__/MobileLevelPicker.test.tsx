import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { getCanvasViewportInitialState, useCanvasViewportStore } from '@variscout/stores';
import type { ProcessHubId } from '@variscout/core/processHub';
import { MobileLevelPicker } from '../MobileLevelPicker';

// Cast helper: acceptable inside test files per project convention
const h = (id: string) => id as ProcessHubId;

describe('MobileLevelPicker', () => {
  beforeEach(() => {
    useCanvasViewportStore.setState(getCanvasViewportInitialState());
  });

  it('renders System, Process, and Step controls with the active level marked', () => {
    render(<MobileLevelPicker hubId={h('hub-mobile')} currentLevel="l2" />);

    expect(screen.getByRole('button', { name: 'System' })).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByRole('button', { name: 'Process' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Step' })).toBeEnabled();
  });

  it('writes level changes through fitToContent', () => {
    render(<MobileLevelPicker hubId={h('hub-mobile')} currentLevel="l2" focalStepId="step-1" />);

    fireEvent.click(screen.getByRole('button', { name: 'System' }));
    expect(useCanvasViewportStore.getState().getViewport(h('hub-mobile'))).toMatchObject({
      currentLevel: 'l1',
      zoom: 0.2,
      pan: { x: 0, y: 0 },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Process' }));
    expect(useCanvasViewportStore.getState().getViewport(h('hub-mobile'))).toMatchObject({
      currentLevel: 'l2',
      zoom: 1,
      pan: { x: 0, y: 0 },
    });
  });

  it('navigates directly to l3 without focal step so canvas renders step-list (spec §7)', () => {
    render(<MobileLevelPicker hubId={h('hub-mobile')} currentLevel="l2" />);

    const stepButton = screen.getByRole('button', { name: 'Step' });

    expect(stepButton).toBeEnabled();
    expect(() => fireEvent.click(stepButton)).not.toThrow();
    expect(useCanvasViewportStore.getState().getViewport(h('hub-mobile'))).toMatchObject({
      currentLevel: 'l3',
      zoom: 2.5,
    });
    // No focalStepId — canvas NoFocalStepPrompt step-list will render at l3.
    expect(
      useCanvasViewportStore.getState().getViewport(h('hub-mobile')).focalStepId
    ).toBeUndefined();
  });

  it('enables Step with a focal step and writes l3 through fitToContent', () => {
    useCanvasViewportStore.getState().setLevel(h('hub-mobile'), 'l3', 'step-1');

    render(<MobileLevelPicker hubId={h('hub-mobile')} currentLevel="l2" focalStepId="step-1" />);

    fireEvent.click(screen.getByRole('button', { name: 'Step' }));

    expect(useCanvasViewportStore.getState().getViewport(h('hub-mobile'))).toMatchObject({
      currentLevel: 'l3',
      focalStepId: 'step-1',
      zoom: 2.5,
      pan: { x: 0, y: 0 },
    });
  });

  it('remembers the last focal step for Step re-entry while mounted', () => {
    useCanvasViewportStore.getState().setLevel(h('hub-mobile'), 'l3', 'step-1');

    const { rerender } = render(
      <MobileLevelPicker hubId={h('hub-mobile')} currentLevel="l3" focalStepId="step-1" />
    );

    rerender(<MobileLevelPicker hubId={h('hub-mobile')} currentLevel="l2" />);

    const stepButton = screen.getByRole('button', { name: 'Step' });
    expect(stepButton).toBeEnabled();

    fireEvent.click(stepButton);

    expect(useCanvasViewportStore.getState().getViewport(h('hub-mobile'))).toMatchObject({
      currentLevel: 'l3',
      focalStepId: 'step-1',
      zoom: 2.5,
      pan: { x: 0, y: 0 },
    });
  });

  it('does not reuse a remembered focal step after hub changes', () => {
    useCanvasViewportStore.getState().setLevel(h('hub-a'), 'l3', 'step-a');

    const { rerender } = render(
      <MobileLevelPicker
        hubId={h('hub-a')}
        currentLevel="l3"
        focalStepId="step-a"
        availableStepIds={['step-a']}
      />
    );

    rerender(
      <MobileLevelPicker hubId={h('hub-b')} currentLevel="l2" availableStepIds={['step-b']} />
    );
    fireEvent.click(screen.getByRole('button', { name: 'Step' }));

    expect(useCanvasViewportStore.getState().getViewport(h('hub-b'))).toMatchObject({
      currentLevel: 'l3',
      zoom: 2.5,
    });
    expect(useCanvasViewportStore.getState().getViewport(h('hub-b')).focalStepId).toBeUndefined();
  });

  it('ignores a remembered focal step that is no longer in availableStepIds', () => {
    useCanvasViewportStore.getState().setLevel(h('hub-mobile'), 'l3', 'step-1');

    const { rerender } = render(
      <MobileLevelPicker
        hubId={h('hub-mobile')}
        currentLevel="l3"
        focalStepId="step-1"
        availableStepIds={['step-1']}
      />
    );

    rerender(
      <MobileLevelPicker hubId={h('hub-mobile')} currentLevel="l2" availableStepIds={['step-2']} />
    );
    fireEvent.click(screen.getByRole('button', { name: 'Step' }));

    expect(useCanvasViewportStore.getState().getViewport(h('hub-mobile'))).toMatchObject({
      currentLevel: 'l3',
      zoom: 2.5,
    });
    expect(
      useCanvasViewportStore.getState().getViewport(h('hub-mobile')).focalStepId
    ).toBeUndefined();
  });
});
