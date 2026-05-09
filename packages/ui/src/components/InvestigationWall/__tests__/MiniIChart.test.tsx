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
}));

import { render, screen } from '@testing-library/react';
import { MiniIChart } from '../MiniIChart';

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
});
