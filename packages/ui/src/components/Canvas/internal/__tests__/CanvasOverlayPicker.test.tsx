import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { ComponentProps } from 'react';
import type { CanvasOverlayId } from '@variscout/hooks';
import { CanvasOverlayPicker } from '../CanvasOverlayPicker';

const enabledOverlayIds: CanvasOverlayId[] = [
  'investigations',
  'hypotheses',
  'hypothesis-hubs',
  'findings',
];

function renderPicker(overrides: Partial<ComponentProps<typeof CanvasOverlayPicker>> = {}) {
  return render(
    <CanvasOverlayPicker activeOverlays={[]} onToggle={() => undefined} {...overrides} />
  );
}

describe('CanvasOverlayPicker', () => {
  it('shows all enabled overlays by default', () => {
    renderPicker();

    for (const overlayId of enabledOverlayIds) {
      expect(
        screen.getByRole('button', { name: `${overlayIdLabel(overlayId)} overlay` })
      ).toBeInTheDocument();
    }
  });

  it('shows only available enabled overlays when availableOverlays is provided', () => {
    renderPicker({ availableOverlays: ['investigations', 'findings'] });

    expect(screen.getByRole('button', { name: 'Investigations overlay' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Findings overlay' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Hypotheses overlay' })).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Hypothesis hubs overlay' })
    ).not.toBeInTheDocument();
  });

  it('calls onToggle with the rendered overlay id', () => {
    const onToggle = vi.fn();
    renderPicker({ availableOverlays: ['findings'], onToggle });

    fireEvent.click(screen.getByRole('button', { name: 'Findings overlay' }));

    expect(onToggle).toHaveBeenCalledTimes(1);
    expect(onToggle).toHaveBeenCalledWith('findings');
  });

  it('does not render an active overlay when it is not available', () => {
    renderPicker({ activeOverlays: ['hypotheses'], availableOverlays: ['findings'] });

    expect(screen.getByRole('button', { name: 'Findings overlay' })).toHaveAttribute(
      'aria-pressed',
      'false'
    );
    expect(screen.queryByRole('button', { name: 'Hypotheses overlay' })).not.toBeInTheDocument();
  });
});

function overlayIdLabel(id: CanvasOverlayId): string {
  switch (id) {
    case 'investigations':
      return 'Investigations';
    case 'hypotheses':
      return 'Hypotheses';
    case 'hypothesis-hubs':
      return 'Hypothesis hubs';
    case 'findings':
      return 'Findings';
  }
}
