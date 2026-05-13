import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { CanvasViewport } from '../CanvasViewport';

describe('CanvasViewport', () => {
  it('applies the CSS transform from zoom and pan', () => {
    const { container } = render(
      <CanvasViewport zoom={1.5} pan={{ x: 100, y: 50 }}>
        <div>Canvas content</div>
      </CanvasViewport>
    );

    const inner = container.querySelector('[data-canvas-viewport-inner]');

    expect(inner).toHaveStyle({
      transform: 'translate(100px, 50px) scale(1.5)',
    });
  });

  it('sets touchAction none on the wrapper', () => {
    const { container } = render(
      <CanvasViewport zoom={1} pan={{ x: 0, y: 0 }}>
        <div>Canvas content</div>
      </CanvasViewport>
    );

    const wrapper = container.querySelector('[data-canvas-viewport-wrapper]');

    expect(wrapper).toHaveStyle({
      touchAction: 'none',
    });
  });

  it('renders children unchanged', () => {
    render(
      <CanvasViewport zoom={1} pan={{ x: 0, y: 0 }}>
        <button type="button">Open details</button>
      </CanvasViewport>
    );

    expect(screen.getByRole('button', { name: 'Open details' })).toBeInTheDocument();
  });
});
