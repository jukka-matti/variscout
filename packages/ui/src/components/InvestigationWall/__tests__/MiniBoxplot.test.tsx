import { describe, it, expect } from 'vitest';

vi.mock('@variscout/charts', () => ({
  useChartTheme: () => ({
    isDark: true,
    chrome: {
      labelMuted: '#64748b',
    },
    colors: {
      control: '#10b981',
    },
  }),
}));

import { render, screen } from '@testing-library/react';
import { MiniBoxplot } from '../MiniBoxplot';

describe('MiniBoxplot', () => {
  it('renders one group rect per category (≥7 values)', () => {
    render(
      <MiniBoxplot
        groups={[
          { category: 'A', values: [1, 2, 3, 4, 5, 6, 7] },
          { category: 'B', values: [3, 4, 5, 6, 7, 8, 9] },
          { category: 'C', values: [5, 6, 7, 8, 9, 10, 11] },
        ]}
        width={248}
        height={80}
      />
    );
    expect(screen.getAllByTestId(/mini-boxplot-box-/)).toHaveLength(3);
  });

  it('falls back to dots for groups below MIN_BOXPLOT_VALUES (7)', () => {
    render(<MiniBoxplot groups={[{ category: 'A', values: [1, 2, 3] }]} width={248} height={80} />);
    expect(screen.queryByTestId('mini-boxplot-box-A')).toBeNull();
    expect(screen.getByTestId('mini-boxplot-dots-A')).toBeInTheDocument();
  });

  it('renders nothing when groups is empty', () => {
    const { container } = render(<MiniBoxplot groups={[]} width={248} height={80} />);
    expect(container.querySelector('svg')).toBeNull();
  });

  it('produces deterministic dot positions across re-renders (no Math.random)', () => {
    const props = {
      groups: [{ category: 'A', values: [1, 2, 3] }],
      width: 248,
      height: 80,
    };
    const first = render(<MiniBoxplot {...props} />);
    const dotsA = first.container.innerHTML;
    first.unmount();
    const second = render(<MiniBoxplot {...props} />);
    expect(second.container.innerHTML).toBe(dotsA);
  });
});
