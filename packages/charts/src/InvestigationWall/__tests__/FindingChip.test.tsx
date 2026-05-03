import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { FindingChip } from '../FindingChip';
import type { Finding } from '@variscout/core';
import { DEFAULT_TIME_LENS } from '@variscout/core';

const finding: Finding = {
  id: 'f1',
  text: 'Night-shift spike',
  createdAt: 0,
  context: { activeFilters: {}, cumulativeScope: null },
  status: 'observed',
  comments: [],
  statusChangedAt: 0,
  source: { chart: 'ichart', anchorX: 10, anchorY: 120, timeLens: DEFAULT_TIME_LENS },
};

describe('FindingChip', () => {
  it('renders finding text and source label', () => {
    render(
      <svg>
        <FindingChip finding={finding} x={0} y={0} />
      </svg>
    );
    expect(screen.getByText(/Night-shift spike/)).toBeInTheDocument();
    expect(screen.getByText(/ichart/i)).toBeInTheDocument();
  });

  it('fires onSelect on click', () => {
    const onSelect = vi.fn();
    render(
      <svg>
        <FindingChip finding={finding} x={0} y={0} onSelect={onSelect} />
      </svg>
    );
    fireEvent.click(screen.getByRole('button', { name: /finding/i }));
    expect(onSelect).toHaveBeenCalledWith('f1');
  });

  it('fires onDetach on right-click', () => {
    const onDetach = vi.fn();
    render(
      <svg>
        <FindingChip finding={finding} x={0} y={0} onDetach={onDetach} />
      </svg>
    );
    fireEvent.contextMenu(screen.getByRole('button', { name: /finding/i }));
    expect(onDetach).toHaveBeenCalledWith('f1');
  });
});
