/**
 * Tests for FocusedChartCard — focused (maximized) chart card.
 *
 * Covers the one-rAF skeleton mount gate (the maximize path's blank-window
 * fix) alongside the basic header/exit structure.
 */
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import FocusedChartCard from '../FocusedChartCard';
import type { FocusedChartCardProps } from '../FocusedChartCard';
import { flushRaf } from '../../../test-utils/raf';

const defaultProps: FocusedChartCardProps = {
  id: 'ichart-focus',
  header: <span>I-Chart</span>,
  chartName: 'ichart',
  onExit: vi.fn(),
  children: <div data-testid="focus-content">Focused chart</div>,
};

describe('FocusedChartCard', () => {
  it('renders the header and exit control', () => {
    render(<FocusedChartCard {...defaultProps} />);
    expect(screen.getByText('I-Chart')).toBeDefined();
    expect(screen.getByLabelText('Exit focus mode')).toBeDefined();
  });

  it('calls onExit when the exit button is clicked', () => {
    const onExit = vi.fn();
    render(<FocusedChartCard {...defaultProps} onExit={onExit} />);
    fireEvent.click(screen.getByLabelText('Exit focus mode'));
    expect(onExit).toHaveBeenCalled();
  });

  // --- skeleton mount gate ---

  it('paints a ChartSkeleton (not children) on the first frame before rAF', () => {
    render(<FocusedChartCard {...defaultProps} />);
    expect(screen.getByTestId('chart-skeleton')).toBeDefined();
    expect(screen.queryByTestId('focus-content')).toBeNull();
  });

  it('swaps the skeleton for children after the rAF flush', async () => {
    render(<FocusedChartCard {...defaultProps} />);
    expect(screen.getByTestId('chart-skeleton')).toBeDefined();
    await flushRaf();
    expect(screen.getByTestId('focus-content')).toBeDefined();
    expect(screen.queryByTestId('chart-skeleton')).toBeNull();
  });

  it('keeps the skeleton while isLoading is true, even after the rAF flush', async () => {
    render(<FocusedChartCard {...defaultProps} isLoading />);
    expect(screen.getByTestId('chart-skeleton')).toBeDefined();
    await flushRaf();
    expect(screen.getByTestId('chart-skeleton')).toBeDefined();
    expect(screen.queryByTestId('focus-content')).toBeNull();
  });
});
