import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { ComponentProps } from 'react';
import type { CanvasOverlayId } from '@variscout/hooks';
import { CanvasOverlayPicker } from '../CanvasOverlayPicker';

vi.mock('@variscout/hooks', async importOriginal => {
  const actual = await importOriginal<typeof import('@variscout/hooks')>();
  return {
    ...actual,
    useTranslation: () => ({
      t: (key: string) => {
        if (key === 'canvas.wall.overlayLabel') return 'Localized Wall';
        if (key === 'canvas.wall.overlayDescription') return 'Localized Wall description';
        return key;
      },
    }),
  };
});

const enabledOverlayIds: CanvasOverlayId[] = [
  'investigations',
  'hypotheses',
  'hypothesis-hubs',
  'findings',
  'wall',
];

function renderPicker(overrides: Partial<ComponentProps<typeof CanvasOverlayPicker>> = {}) {
  return render(
    <CanvasOverlayPicker activeOverlays={[]} onToggle={() => undefined} {...overrides} />
  );
}

describe('CanvasOverlayPicker', () => {
  it('shows all enabled overlays by default, including Wall', () => {
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
    expect(
      screen.queryByRole('button', { name: 'Localized Wall overlay' })
    ).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Hypotheses overlay' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Hypotheses overlay' })).not.toBeInTheDocument();
  });

  it('calls onToggle with the rendered overlay id', () => {
    const onToggle = vi.fn();
    renderPicker({ availableOverlays: ['wall'], onToggle });

    fireEvent.click(screen.getByRole('button', { name: 'Localized Wall overlay' }));

    expect(onToggle).toHaveBeenCalledTimes(1);
    expect(onToggle).toHaveBeenCalledWith('wall');
  });

  it('uses i18n keys for the desktop Wall overlay label and description', () => {
    renderPicker({ availableOverlays: ['wall'] });

    const wallButton = screen.getByRole('button', { name: 'Localized Wall overlay' });
    expect(wallButton).toHaveTextContent('Localized Wall');
    expect(wallButton).toHaveAttribute('title', 'Localized Wall description');
  });

  it('does not render an active overlay when it is not available', () => {
    renderPicker({ activeOverlays: ['wall'], availableOverlays: ['findings'] });

    expect(screen.getByRole('button', { name: 'Findings overlay' })).toHaveAttribute(
      'aria-pressed',
      'false'
    );
    expect(
      screen.queryByRole('button', { name: 'Localized Wall overlay' })
    ).not.toBeInTheDocument();
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
    case 'wall':
      return 'Localized Wall';
  }
}
