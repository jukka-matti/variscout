import { describe, it, expect, vi } from 'vitest';

vi.mock('@variscout/charts', () => ({
  useChartTheme: () => ({
    isDark: true,
    chrome: {
      labelMuted: '#64748b',
    },
    colors: {
      mean: '#3b82f6',
    },
  }),
  chartColors: {
    warning: '#f59e0b',
  },
}));

// useIChartBrush is a real hook — no need to mock it; jsdom handles useState
import { render, screen, fireEvent } from '@testing-library/react';
import { MiniIChart } from '../MiniIChart';

/** Polyfill setPointerCapture on the svg element for jsdom */
function polyfillCapture(el: Element) {
  (el as unknown as Record<string, unknown>)['setPointerCapture'] = vi.fn();
  (el as unknown as Record<string, unknown>)['releasePointerCapture'] = vi.fn();
}

describe('MiniIChart', () => {
  it('renders a line path for the values', () => {
    render(<MiniIChart values={[1, 2, 3, 4, 5]} width={248} height={80} />);
    const path = screen.getByTestId('mini-i-chart-path');
    expect(path).toBeInTheDocument();
    expect(path.getAttribute('d')).toMatch(/^M /);
  });

  it('renders nothing when values is empty', () => {
    const { container } = render(<MiniIChart values={[]} width={248} height={80} />);
    expect(container.querySelector('[data-testid="mini-i-chart-path"]')).toBeNull();
  });

  it('handles a single value (degenerate range) without crashing', () => {
    render(<MiniIChart values={[42]} width={248} height={80} />);
    expect(screen.getByTestId('mini-i-chart-path')).toBeInTheDocument();
  });

  it('renders a centerline at the mean', () => {
    render(<MiniIChart values={[1, 2, 3]} width={248} height={80} />);
    expect(screen.getByTestId('mini-i-chart-mean')).toBeInTheDocument();
  });

  it('does NOT render a brush rect when onBrushEnd is undefined', () => {
    const { container } = render(<MiniIChart values={[1, 2, 3, 4, 5]} width={248} height={80} />);
    expect(container.querySelector('[data-testid="mini-i-chart-brush"]')).toBeNull();
  });

  it('commits range via onBrushEnd after pointer drag', () => {
    const onBrushEnd = vi.fn();
    const { container } = render(
      <MiniIChart values={[1, 2, 3, 4, 5]} width={100} height={80} onBrushEnd={onBrushEnd} />
    );
    const svg = container.querySelector('svg')!;
    polyfillCapture(svg);
    // Mock getBoundingClientRect so pixel math is deterministic
    svg.getBoundingClientRect = () =>
      ({ left: 0, top: 0, right: 100, bottom: 80, width: 100, height: 80 }) as DOMRect;

    // values.length=5 → n-1=4; idx = round((px/100)*4)
    // pointerdown at px=0 → idx=0; pointerup at px=100 → idx=4
    fireEvent.pointerDown(svg, { clientX: 0, pointerId: 1, pointerType: 'mouse' });
    fireEvent.pointerMove(svg, { clientX: 50, pointerId: 1, pointerType: 'mouse' });
    fireEvent.pointerUp(svg, { clientX: 100, pointerId: 1, pointerType: 'mouse' });

    expect(onBrushEnd).toHaveBeenCalledOnce();
    expect(onBrushEnd).toHaveBeenCalledWith({ startIdx: 0, endIdx: 4 });
  });

  it('does NOT fire onBrushEnd on a zero-width drag (click)', () => {
    const onBrushEnd = vi.fn();
    const { container } = render(
      <MiniIChart values={[1, 2, 3, 4, 5]} width={100} height={80} onBrushEnd={onBrushEnd} />
    );
    const svg = container.querySelector('svg')!;
    polyfillCapture(svg);
    svg.getBoundingClientRect = () =>
      ({ left: 0, top: 0, right: 100, bottom: 80, width: 100, height: 80 }) as DOMRect;

    fireEvent.pointerDown(svg, { clientX: 25, pointerId: 1, pointerType: 'mouse' });
    fireEvent.pointerUp(svg, { clientX: 25, pointerId: 1, pointerType: 'mouse' });

    expect(onBrushEnd).not.toHaveBeenCalled();
  });
});
